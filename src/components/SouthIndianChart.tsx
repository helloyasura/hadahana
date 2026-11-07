type Cell = {
  /** Sign index 0–11 (Mesha=0) — used by legacy fixed-SI mode */
  signIndex?: number;
  signSi?: string;
  glyphs: string[];
  isLagna: boolean;
  /** Rashi number 1–12 */
  rashiNum?: number;
  /** Bhava number 1–12 from lagna (traditional booklet charts) */
  houseNum?: number;
};

type Props = {
  cells: Cell[];
  centerTitle: string;
  degree?: string;
  /**
   * Traditional Handahana booklet mode:
   * lagna-fixed houses (H1 at top), diagonal corners, bhava numbers in empty houses.
   */
  traditional?: boolean;
};

function HouseContent({
  cell,
  traditional,
}: {
  cell: Cell | undefined;
  traditional: boolean;
}) {
  if (!cell) return null;
  const hasGlyphs = cell.glyphs.length > 0;
  const emptyLabel = traditional
    ? (cell.houseNum ?? cell.rashiNum ?? "")
    : (cell.signSi ?? "");
  return (
    <div className={`sl-house${cell.isLagna ? " sl-lagna" : ""}`}>
      {traditional ? (
        hasGlyphs ? (
          <div className="sl-glyphs">
            {cell.glyphs.map((g) => (
              <span key={g}>{g}</span>
            ))}
          </div>
        ) : (
          <span className="sl-num">{emptyLabel}</span>
        )
      ) : (
        <>
          <span className="si-sign">{cell.signSi}</span>
          <div className="si-glyphs">
            {cell.glyphs.map((g) => (
              <span key={g}>{g}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Traditional SL booklet house geometry (lagna-fixed):
 *
 *   [ H2 \ H3 ] [  H1  ] [ H12 \ H11 ]
 *   [   H4    ] [ TITLE] [    H10    ]
 *   [ H5 / H6 ] [  H7  ] [  H8 \ H9  ]
 *
 * Empty houses show the bhava number (1–12), matching Handahana booklets.
 */
export function SouthIndianChart({
  cells,
  centerTitle,
  degree,
  traditional = true,
}: Props) {
  // Prefer house-keyed cells (1–12); fall back to sign-index for legacy payloads
  const byHouse = new Map<number, Cell>();
  const bySign = new Map<number, Cell>();
  for (const c of cells) {
    if (c.houseNum != null) byHouse.set(c.houseNum, c);
    if (c.signIndex != null) bySign.set(c.signIndex, c);
  }

  const house = (n: number): Cell | undefined => {
    if (byHouse.has(n)) return byHouse.get(n);
    // Legacy: derive house from lagna sign cell if only sign-based cells exist
    const lagna = cells.find((c) => c.isLagna);
    if (lagna?.signIndex == null) return undefined;
    const signIdx = (lagna.signIndex + n - 1) % 12;
    const c = bySign.get(signIdx);
    if (!c) return undefined;
    return { ...c, houseNum: n };
  };

  if (!traditional) {
    const SI_CELLS = [
      { signIndex: 11, row: 0, col: 0 },
      { signIndex: 0, row: 0, col: 1 },
      { signIndex: 1, row: 0, col: 2 },
      { signIndex: 2, row: 0, col: 3 },
      { signIndex: 3, row: 1, col: 3 },
      { signIndex: 4, row: 2, col: 3 },
      { signIndex: 5, row: 3, col: 3 },
      { signIndex: 6, row: 3, col: 2 },
      { signIndex: 7, row: 3, col: 1 },
      { signIndex: 8, row: 3, col: 0 },
      { signIndex: 9, row: 2, col: 0 },
      { signIndex: 10, row: 1, col: 0 },
    ];
    return (
      <div className="si-chart" role="img" aria-label={centerTitle}>
        <div className="si-grid">
          {SI_CELLS.map((pos) => {
            const c = bySign.get(pos.signIndex);
            return (
              <div
                key={`${pos.row}-${pos.col}`}
                className={`si-cell${c?.isLagna ? " si-lagna" : ""}`}
                style={{ gridRow: pos.row + 1, gridColumn: pos.col + 1 }}
              >
                <HouseContent cell={c} traditional={false} />
              </div>
            );
          })}
          <div className="si-center">
            <strong>{centerTitle}</strong>
            {degree ? <span>{degree}</span> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="si-chart sl-chart" role="img" aria-label={centerTitle}>
      <div className="sl-grid">
        {/* Top-left: H2 (upper/toward lagna) · H3 (lower/toward left) — ╲ */}
        <div className="sl-cell sl-corner sl-tl">
          <div className="sl-tri sl-tri-tr">
            <HouseContent cell={house(2)} traditional />
          </div>
          <div className="sl-tri sl-tri-bl">
            <HouseContent cell={house(3)} traditional />
          </div>
          <svg className="sl-diag" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <line x1="0" y1="0" x2="100" y2="100" />
          </svg>
        </div>

        {/* Top-middle: H1 lagna */}
        <div className="sl-cell sl-edge">
          <HouseContent cell={house(1)} traditional />
        </div>

        {/* Top-right: H12 (upper/toward lagna) · H11 (lower) — ╱ */}
        <div className="sl-cell sl-corner sl-tr">
          <div className="sl-tri sl-tri-tl">
            <HouseContent cell={house(12)} traditional />
          </div>
          <div className="sl-tri sl-tri-br">
            <HouseContent cell={house(11)} traditional />
          </div>
          <svg className="sl-diag" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <line x1="100" y1="0" x2="0" y2="100" />
          </svg>
        </div>

        {/* Middle-left: H4 */}
        <div className="sl-cell sl-edge">
          <HouseContent cell={house(4)} traditional />
        </div>

        <div className="sl-center">
          <strong>{centerTitle}</strong>
        </div>

        {/* Middle-right: H10 */}
        <div className="sl-cell sl-edge">
          <HouseContent cell={house(10)} traditional />
        </div>

        {/* Bottom-left: H5 (upper) · H6 (lower) — ╱ */}
        <div className="sl-cell sl-corner sl-bl">
          <div className="sl-tri sl-tri-tl">
            <HouseContent cell={house(5)} traditional />
          </div>
          <div className="sl-tri sl-tri-br">
            <HouseContent cell={house(6)} traditional />
          </div>
          <svg className="sl-diag" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <line x1="100" y1="0" x2="0" y2="100" />
          </svg>
        </div>

        {/* Bottom-middle: H7 */}
        <div className="sl-cell sl-edge">
          <HouseContent cell={house(7)} traditional />
        </div>

        {/* Bottom-right: H9 (upper) · H8 (lower) — ╲ */}
        <div className="sl-cell sl-corner sl-br">
          <div className="sl-tri sl-tri-tr">
            <HouseContent cell={house(9)} traditional />
          </div>
          <div className="sl-tri sl-tri-bl">
            <HouseContent cell={house(8)} traditional />
          </div>
          <svg className="sl-diag" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <line x1="0" y1="0" x2="100" y2="100" />
          </svg>
        </div>
      </div>
    </div>
  );
}
