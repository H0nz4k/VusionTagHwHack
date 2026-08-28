import { useEffect, useRef } from "react";
import { patternsByGroup, sampleBwrPattern, type BwrPatternId } from "../core/bwrPatterns";
import { PALETTE_RGB, type FillStyle } from "../core/types";
import { NONE_FILL, patternFill, solidFill } from "../core/fillStyle";

interface Props {
  value: FillStyle;
  allowNone?: boolean;
  label: string;
  pickerId: string;
  onChange: (style: FillStyle) => void;
  warnSmall?: boolean;
}

export function PatternPicker({ value, allowNone, label, pickerId, onChange, warnSmall }: Props) {
  const groups = patternsByGroup();
  const usePatterns = value.kind === "bwr-pattern";
  return (
    <div className="pattern-picker" data-testid={`pattern-picker-${pickerId}`}>
      <div className="row">
        <span className="muted">{label}</span>
        {allowNone && (
          <button type="button" className={value.kind === "none" ? "primary" : undefined} onClick={() => onChange(NONE_FILL)}>
            Žádná
          </button>
        )}
        <button
          type="button"
          className={!usePatterns && value.kind !== "none" ? "primary" : undefined}
          onClick={() => onChange(value.kind === "solid" ? value : solidFill("black"))}
        >
          Solidní
        </button>
        <button
          type="button"
          data-testid={`bwr-patterns-toggle-${pickerId}`}
          className={usePatterns ? "primary" : undefined}
          onClick={() => onChange(value.kind === "bwr-pattern" ? value : patternFill("bwr-05-gray-50"))}
        >
          BWR vzory
        </button>
      </div>
      {!usePatterns && value.kind !== "none" && (
        <div className="swatch-row" role="listbox" aria-label="Solidní barvy">
          {(["white", "black", "red"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="option"
              aria-selected={value.kind === "solid" && value.color === c}
              className={value.kind === "solid" && value.color === c ? "swatch-btn active" : "swatch-btn"}
              onClick={() => onChange(solidFill(c))}
            >
              <span className="swatch" style={{ background: c === "white" ? "#fff" : c === "black" ? "#000" : "#c00" }} />
              {c === "white" ? "Bílá" : c === "black" ? "Černá" : "Červená"}
            </button>
          ))}
        </div>
      )}
      {usePatterns &&
        groups.map((g) => (
          <div key={g.label} className="pattern-group">
            <p className="muted">{g.label}</p>
            <div className="pattern-grid">
              {g.items.map((p) => {
                const active = value.kind === "bwr-pattern" && value.patternId === p.id;
                const title = `${String(p.number).padStart(2, "0")} ${p.name} — W ${Math.round(p.ratio.w)} / B ${Math.round(p.ratio.b)} / R ${Math.round(p.ratio.r)} % · ${p.description}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-testid={`pattern-${pickerId}-${p.id}`}
                    className={active ? "pattern-cell active" : "pattern-cell"}
                    title={title}
                    aria-label={title}
                    aria-pressed={active}
                    onClick={() => onChange(patternFill(p.id))}
                  >
                    <PatternSwatch id={p.id} />
                    <span>{String(p.number).padStart(2, "0")}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      {warnSmall && usePatterns && <p className="muted">Na velmi malém textu nemusí být směs vzoru čitelná.</p>}
    </div>
  );
}

function PatternSwatch({ id }: { id: BwrPatternId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = 24;
    const h = 16;
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = sampleBwrPattern(id, x, y);
        const rgb = PALETTE_RGB[idx];
        const o = (y * w + x) * 4;
        img.data[o] = rgb[0];
        img.data[o + 1] = rgb[1];
        img.data[o + 2] = rgb[2];
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [id]);
  return <canvas ref={ref} width={24} height={16} className="pattern-swatch" />;
}
