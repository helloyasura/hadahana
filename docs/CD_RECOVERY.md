# CD startup failure and safe recovery

## Confirmed cause

The failed deployment was **not** a missing shell or missing CHOWN/SETUID
capability. The production host uses **Snap Docker** with AppArmor. Read-only
kernel-log inspection of the failing init launch recorded:

```text
apparmor="DENIED" operation="exec" info="no new privs" error=-1
profile="snap.docker.dockerd" name="/bin/sh" target="docker-default"
```

`security_opt: [no-new-privileges:true]` prevents this AppArmor profile transition
on that host. Execution is denied before the init shell or ownership command
runs. Changing the image or adding more Linux capabilities would not address
this particular denial.

Remove **only** that option from the short-lived ownership init service. It
still uses Docker's default AppArmor and seccomp profiles, a read-only root
filesystem, no networking, three filesystem-only capabilities, and memory/PID
limits. The web process remains UID 1001. Do not disable AppArmor, add privileged
mode, or change any host-wide Docker/Snap configuration.

## Deployment safety

1. Load the image without stopping web.
2. Capture the currently healthy web's immutable image ID; retain it in the
   root-readable `.last-good-image` checkpoint.
3. Run the ownership init as an isolated one-off container **before** replacing
   web. An init failure fails CD and leaves the old web container untouched.
4. Start only web with `--no-deps`. Verify the new container's Docker health
   status, not merely a response that might have come from an old process.
5. On start/health failure restore the known-good image using `--no-deps`, check
   its health, persist the rollback image pin, and still fail CD.
6. On success persist the new image checkpoint and pin.

No volume deletion, stack-wide `down`, host nginx edits, or other app changes
are needed. This is not zero-downtime deployment: the old web may be unavailable
briefly while Compose replaces it. Rollback cannot restore a previous image
that has been deleted, and image rollback does not undo data changes (this
migration only repairs ownership). The first deployment from the current
already-down state has no recorded healthy checkpoint; a failure there is
reported explicitly rather than treating the broken Created container as good.

## Verification and recovery scope

`bash scripts/verify-deploy.sh` tests success, init failure without web replacement,
web-start failure, health failure, no-previous-image, and checkpoint recovery
using a mock Docker command. CI also starts the **actual production Compose
file**, init dependency and web, against a nonempty legacy root-owned volume;
it checks init exit status, web health, HTTP, and non-root atomic file writes.
A standard GitHub runner does not reproduce Snap Docker's AppArmor policy, so
the production audit log is the evidence for the host-specific cause.

Docker is unavailable on the development box; no production container was
started, stopped, recreated, or modified during this investigation. Merging the
fix triggers normal CD: the corrected init then web should start without a
manual host change. No rollback to an old image or manual production command
is required for the identified failure. Unrelated deployment failures remain
possible; wait for CI and CD health checks. Jyotisha Pro's separate LUMS/secrets
launch prerequisites are not changed by this deployment repair.
