#!/usr/bin/env bash
# Offline deployment contract tests. No Docker daemon, SSH, or credentials needed.
set -euo pipefail
export DEPLOY_SCRIPT="$(cd "$(dirname "$0")" && pwd)/remote-deploy.sh"
python3 - <<'PY'
import json, os, pathlib, subprocess, tempfile

mock = r'''#!/usr/bin/env python3
import json, os, pathlib, sys
p = pathlib.Path(os.environ['MOCK_STATE'])
s = json.loads(p.read_text())
a = sys.argv[1:]
s['calls'].append(a)
code, out = 0, ''
if a[0] == 'compose':
    command = next((x for x in a if x in ('ps', 'run', 'up')), '')
    if command == 'ps' and '-q' in a:
        out = 'web' if s.get('exists', True) else ''
    elif command == 'run':
        code = 1 if s['scenario'] == 'init-fail' else 0
    elif command == 'up':
        image = os.environ['HANDAHANA_IMAGE']
        s.setdefault('starts', []).append(image)
        if image == 'test:new' and s['scenario'] == 'up-fail':
            code = 1
        else:
            s['exists'], s['current'] = True, image
elif a[0] == 'inspect':
    fmt = a[a.index('--format') + 1]
    current = s.get('current', 'sha256:old')
    healthy = not (current == 'test:new' and s['scenario'] == 'health-fail')
    if fmt == '{{.Image}}': out = 'sha256:new' if current == 'test:new' else current
    elif fmt == '{{.State.Status}}': out = 'running'
    elif fmt.startswith('{{if'): out = 'healthy'
    else: out = 'running/healthy' if healthy else 'running/unhealthy'
else:
    raise SystemExit('Unexpected Docker command: ' + repr(a))
p.write_text(json.dumps(s))
print(out)
sys.exit(code)
'''
for scenario in ('success', 'init-fail', 'up-fail', 'health-fail', 'no-previous', 'stored-previous'):
    with tempfile.TemporaryDirectory(prefix='hadahana-deploy-test-') as tmp:
        d = pathlib.Path(tmp)
        (d/'docker').write_text(mock)
        (d/'docker').chmod(0o755)
        (d/'.env').write_text('SESSION_SECRET=synthetic-not-a-real-secret\nHANDAHANA_IMAGE=test:new\n')
        (d/'docker-compose.yml').write_text('services: {}\n')
        state = {'scenario': scenario, 'calls': [], 'current': 'sha256:old'}
        if scenario in ('no-previous', 'stored-previous'):
            state.update(exists=False, scenario='health-fail')
        if scenario == 'stored-previous': (d/'.last-good-image').write_text('sha256:old\n')
        (d/'state.json').write_text(json.dumps(state))
        env = dict(os.environ, PATH=tmp+':'+os.environ['PATH'], DEPLOY_PATH=tmp,
                   HANDAHANA_IMAGE='test:new', MOCK_STATE=str(d/'state.json'),
                   HANDAHANA_IMAGE_ARCHIVE='', GHCR_TOKEN='', GHCR_USER='')
        result = subprocess.run(['bash', os.environ['DEPLOY_SCRIPT']], env=env, capture_output=True, text=True)
        state = json.loads((d/'state.json').read_text())
        starts = state.get('starts', [])
        assert result.returncode == (0 if scenario == 'success' else 1), (scenario, result.stdout, result.stderr)
        if scenario == 'init-fail':
            assert not starts, 'Init failure replaced web!'
        elif scenario == 'success':
            assert starts == ['test:new']
            assert (d/'.last-good-image').read_text().strip() == 'sha256:new'
        elif scenario == 'no-previous':
            assert starts == ['test:new']
            assert 'automatic rollback unavailable' in result.stdout
        else:
            assert starts == ['test:new', 'sha256:old'], (scenario, starts)
            assert 'HANDAHANA_IMAGE=sha256:old' in (d/'.env').read_text()
            assert 'HANDAHANA_IMAGE=sha256:old' in (d/'.env.images').read_text()
        for call in state['calls']:
            if call[0] == 'compose' and 'run' in call:
                # The droplet uses Compose 2.37.1. Keep deploy-run flags in
                # this known-supported subset: newer CI Compose accepts flags
                # (notably --no-build) which 2.37.1 rejects before init starts.
                run_args = call[call.index('run') + 1:-1]
                supported_flags = {'--rm', '--no-deps', '--pull'}
                assert all(arg in supported_flags for arg in run_args if arg.startswith('-')), run_args
                assert '--pull' in run_args and run_args[run_args.index('--pull') + 1] == 'never', run_args
            if call[0] == 'compose' and 'up' in call:
                assert '--no-deps' in call and call[-1] == 'handahana-web'
            assert not any(x in call for x in ('down', 'rm', 'prune'))
        assert 'synthetic-not-a-real-secret' not in result.stdout + result.stderr
        print('PASS:', scenario)
print('All deployment preflight/rollback contracts passed (mock Docker, no production access).')
PY
