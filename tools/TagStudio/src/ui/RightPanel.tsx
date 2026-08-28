import type { BwPhaseId, DitherId, FillStyle, Layer, PaletteColor, PlaneMap, Project } from "../core/types";
import { BW_PHASE_IDS, algorithmsByCategory, getDitherInfo } from "../core/ditherRegistry";
import { PatternPicker } from "./PatternPicker";

interface Props {
  project: Project;
  selected: Layer | null;
  advanced: boolean;
  onAdvanced: (v: boolean) => void;
  onProjectPatch: (patch: Partial<Project>) => void;
  onLayerPatch: (patch: Partial<Layer>) => void;
  previewMode: "result" | "mask";
  onPreviewMode: (mode: "result" | "mask") => void;
}

const COLORS: PaletteColor[] = ["white", "black", "red"];

export function RightPanel({ project, selected, advanced, onAdvanced, onProjectPatch, onLayerPatch, previewMode, onPreviewMode }: Props) {
  const info = getDitherInfo(project.dither.mode);
  const groups = algorithmsByCategory();
  const isBwr = project.dither.mode === "bwr-two-phase";
  const showBlue = project.dither.mode === "blue-noise" || (isBwr && project.dither.bwr.bwPhase === "blue-noise");
  return (
    <aside className="panel right">
      <h2>Převod</h2>
      <label className="field">
        Dithering
        <select
          data-testid="dither-mode"
          value={project.dither.mode}
          onChange={(e) => onProjectPatch({ dither: { ...project.dither, mode: e.target.value as DitherId } })}
        >
          {groups.map((g) => (
            <optgroup key={g.category} label={g.label}>
              {g.items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <p className="muted" data-testid="dither-desc">
        {info.description}
      </p>
      <div className="grid2">
        <Num label="Jas" value={project.dither.brightness} min={-100} max={100} onChange={(v) => onProjectPatch({ dither: { ...project.dither, brightness: v } })} />
        <Num label="Kontrast" value={project.dither.contrast} min={-100} max={100} onChange={(v) => onProjectPatch({ dither: { ...project.dither, contrast: v } })} />
        <Num label="Sytost" value={project.dither.saturation} min={-100} max={100} onChange={(v) => onProjectPatch({ dither: { ...project.dither, saturation: v } })} />
        <Num label="Citlivost červené" value={project.dither.redSensitivity} min={0} max={100} onChange={(v) => onProjectPatch({ dither: { ...project.dither, redSensitivity: v } })} />
      </div>
      {showBlue && (
        <Num
          label="Blue noise síla"
          value={project.dither.blueNoiseStrength}
          min={0}
          max={100}
          onChange={(v) => onProjectPatch({ dither: { ...project.dither, blueNoiseStrength: v } })}
        />
      )}
      {isBwr && (
        <div className="bwr-box" data-testid="bwr-controls">
          <p className="muted">BWR nejprve rezervuje červené akcenty; zbytek jde jen do černé a bílé.</p>
          <Num
            label="Min. chromatičnost"
            value={project.dither.bwr.minChroma}
            min={0}
            max={100}
            onChange={(v) => onProjectPatch({ dither: { ...project.dither, bwr: { ...project.dither.bwr, minChroma: v } } })}
          />
          <Num
            label="Práh červené masky"
            value={project.dither.bwr.maskThreshold}
            min={0}
            max={100}
            onChange={(v) => onProjectPatch({ dither: { ...project.dither, bwr: { ...project.dither.bwr, maskThreshold: v } } })}
          />
          <label className="check">
            <input
              type="checkbox"
              data-testid="protect-neutrals"
              checked={project.dither.bwr.protectNeutrals}
              onChange={(e) =>
                onProjectPatch({ dither: { ...project.dither, bwr: { ...project.dither.bwr, protectNeutrals: e.target.checked } } })
              }
            />
            Chránit neutrální tóny
          </label>
          <label className="field">
            Černobílá 2. fáze
            <select
              data-testid="bwr-bw-phase"
              value={project.dither.bwr.bwPhase}
              onChange={(e) =>
                onProjectPatch({ dither: { ...project.dither, bwr: { ...project.dither.bwr, bwPhase: e.target.value as BwPhaseId } } })
              }
            >
              {BW_PHASE_IDS.map((id) => (
                <option key={id} value={id}>
                  {getDitherInfo(id).name}
                </option>
              ))}
            </select>
          </label>
          <div className="row">
            <button type="button" data-testid="preview-result" className={previewMode === "result" ? "primary" : undefined} onClick={() => onPreviewMode("result")}>
              Výsledek
            </button>
            <button type="button" data-testid="preview-mask" className={previewMode === "mask" ? "primary" : undefined} onClick={() => onPreviewMode("mask")}>
              Červená maska
            </button>
          </div>
        </div>
      )}
      <label className="check">
        <input
          type="checkbox"
          checked={project.showSafeMargin}
          onChange={(e) => onProjectPatch({ showSafeMargin: e.target.checked })}
        />
        Bezpečný okraj
      </label>
      <Num label="Okraj (px)" value={project.safeMargin} min={0} max={40} onChange={(v) => onProjectPatch({ safeMargin: v })} />
      <label className="check">
        <input
          type="checkbox"
          checked={project.showPixelGrid}
          onChange={(e) => onProjectPatch({ showPixelGrid: e.target.checked })}
        />
        Pixelová mřížka (při velkém zoomu)
      </label>
      <PatternPicker
        pickerId="background"
        label="Pozadí plátna"
        value={project.background}
        onChange={(background) => onProjectPatch({ background })}
      />

      <h2>Vrstva</h2>
      {!selected && <div className="muted">Vyberte vrstvu</div>}
      {selected && (
        <>
          <label className="field">
            Název
            <input value={selected.name} onChange={(e) => onLayerPatch({ name: e.target.value })} />
          </label>
          {selected.type !== "line" && (
            <div className="grid2">
              <Num label="X" value={round1(selected.x)} onChange={(v) => onLayerPatch({ x: v })} />
              <Num label="Y" value={round1(selected.y)} onChange={(v) => onLayerPatch({ y: v })} />
              <Num label="Šířka" value={round1(selected.width)} min={1} onChange={(v) => onLayerPatch({ width: v })} />
              <Num label="Výška" value={round1(selected.height)} min={1} onChange={(v) => onLayerPatch({ height: v })} />
              <Num label="Otočení °" value={round1(selected.rotation)} onChange={(v) => onLayerPatch({ rotation: v })} />
            </div>
          )}
          {selected.type !== "line" && selected.type !== "image" && (
            <div className="row">
              <button type="button" onClick={() => onLayerPatch({ rotation: ((selected.rotation + 90) % 360) })}>
                +90°
              </button>
            </div>
          )}
          {selected.type === "image" && <ImageProps layer={selected} onLayerPatch={onLayerPatch} />}
          {selected.type === "text" && <TextProps layer={selected} onLayerPatch={onLayerPatch} />}
          {selected.type === "rect" && <RectProps layer={selected} onLayerPatch={onLayerPatch} />}
          {selected.type === "line" && <LineProps layer={selected} onLayerPatch={onLayerPatch} />}
        </>
      )}

      <details className="details" open={advanced} onToggle={(e) => onAdvanced((e.target as HTMLDetailsElement).open)}>
        <summary data-testid="advanced-export">Pokročilé nastavení exportu</summary>
        <div className="grid2" style={{ marginTop: 8 }}>
          <label className="field">
            Pořadí bitů
            <select
              value={project.export.bitOrder}
              onChange={(e) => onProjectPatch({ export: { ...project.export, bitOrder: e.target.value as Project["export"]["bitOrder"] } })}
            >
              <option value="msb-first">MSB-first</option>
              <option value="lsb-first">LSB-first</option>
            </select>
          </label>
          <label className="field">
            Pořadí rovin
            <select
              value={project.export.planeOrder}
              onChange={(e) => onProjectPatch({ export: { ...project.export, planeOrder: e.target.value as Project["export"]["planeOrder"] } })}
            >
              <option value="a-then-b">A potom B</option>
              <option value="b-then-a">B potom A</option>
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={project.export.invertA}
              onChange={(e) => onProjectPatch({ export: { ...project.export, invertA: e.target.checked } })}
            />
            Inverze A
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={project.export.invertB}
              onChange={(e) => onProjectPatch({ export: { ...project.export, invertB: e.target.checked } })}
            />
            Inverze B
          </label>
          <label className="field">
            Mapování rovin
            <select
              data-testid="plane-map"
              value={project.export.planeMap}
              onChange={(e) => onProjectPatch({ export: { ...project.export, planeMap: e.target.value as PlaneMap } })}
            >
              <option value="legacy">Legacy v0.1/v0.2 (A=1 B=1 bílá)</option>
              <option value="cog-edg2-0260-a">CoG EDG2-0260-A (0x10/0x13)</option>
            </select>
          </label>
          <label className="field">
            Otočení exportu
            <select
              value={project.export.rotate}
              onChange={(e) => onProjectPatch({ export: { ...project.export, rotate: Number(e.target.value) as Project["export"]["rotate"] } })}
            >
              <option value={0}>0°</option>
              <option value={90}>90°</option>
              <option value={180}>180°</option>
              <option value={270}>270°</option>
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={project.export.flipX}
              onChange={(e) => onProjectPatch({ export: { ...project.export, flipX: e.target.checked } })}
            />
            Převrátit X
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={project.export.flipY}
              onChange={(e) => onProjectPatch({ export: { ...project.export, flipY: e.target.checked } })}
            />
            Převrátit Y
          </label>
          <label className="field">
            Název C pole
            <input
              value={project.export.cArrayName}
              onChange={(e) => onProjectPatch({ export: { ...project.export, cArrayName: e.target.value } })}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={project.export.sdccCode}
              onChange={(e) => onProjectPatch({ export: { ...project.export, sdccCode: e.target.checked } })}
            />
            SDCC __code
          </label>
        </div>
        <p className="muted">
          Polarita BIN legacy formátu zůstává výchozí. Předvolba CoG používá ověřené logické mapování 0x10/0x13; hodnoty 0x10 a 0x13 se do obrazových dat nevkládají.
        </p>
      </details>
    </aside>
  );
}

function ImageProps({
  layer,
  onLayerPatch,
}: {
  layer: Extract<Layer, { type: "image" }>;
  onLayerPatch: (patch: Partial<Layer>) => void;
}) {
  return (
    <>
      <label className="check">
        <input type="checkbox" checked={layer.keepAspect} onChange={(e) => onLayerPatch({ keepAspect: e.target.checked })} />
        Zachovat poměr stran
      </label>
      <label className="field">
        Režim
        <select value={layer.fit} onChange={(e) => onLayerPatch({ fit: e.target.value as Extract<Layer, { type: "image" }>["fit"] })}>
          <option value="contain">Contain</option>
          <option value="cover">Cover</option>
          <option value="manual">Ruční výřez</option>
        </select>
      </label>
      <div className="row">
        <button type="button" onClick={() => onLayerPatch({ rotation: (layer.rotation + 90) % 360 })}>
          +90°
        </button>
        <button type="button" onClick={() => onLayerPatch({ flipX: !layer.flipX })}>
          Překlopit X
        </button>
        <button type="button" onClick={() => onLayerPatch({ flipY: !layer.flipY })}>
          Překlopit Y
        </button>
      </div>
      <div className="grid2">
        <Num label="Jas vrstvy" value={layer.brightness} min={-100} max={100} onChange={(v) => onLayerPatch({ brightness: v })} />
        <Num label="Kontrast vrstvy" value={layer.contrast} min={-100} max={100} onChange={(v) => onLayerPatch({ contrast: v })} />
        <Num label="Sytost vrstvy" value={layer.saturation} min={-100} max={100} onChange={(v) => onLayerPatch({ saturation: v })} />
        <Num label="Červená vrstvy" value={layer.redSensitivity} min={0} max={100} onChange={(v) => onLayerPatch({ redSensitivity: v })} />
      </div>
      <label className="check">
        <input type="checkbox" checked={layer.ditherEnabled} onChange={(e) => onLayerPatch({ ditherEnabled: e.target.checked })} />
        Dithering této vrstvy
      </label>
      {layer.fit === "manual" && (
        <div className="grid2">
          <Num label="Výřez X" value={layer.crop?.x ?? 0} onChange={(v) => onLayerPatch({ crop: { ...(layer.crop ?? { x: 0, y: 0, width: layer.srcWidth, height: layer.srcHeight }), x: v } })} />
          <Num label="Výřez Y" value={layer.crop?.y ?? 0} onChange={(v) => onLayerPatch({ crop: { ...(layer.crop ?? { x: 0, y: 0, width: layer.srcWidth, height: layer.srcHeight }), y: v } })} />
          <Num label="Výřez W" value={layer.crop?.width ?? layer.srcWidth} min={1} onChange={(v) => onLayerPatch({ crop: { ...(layer.crop ?? { x: 0, y: 0, width: layer.srcWidth, height: layer.srcHeight }), width: v } })} />
          <Num label="Výřez H" value={layer.crop?.height ?? layer.srcHeight} min={1} onChange={(v) => onLayerPatch({ crop: { ...(layer.crop ?? { x: 0, y: 0, width: layer.srcWidth, height: layer.srcHeight }), height: v } })} />
        </div>
      )}
    </>
  );
}

function TextProps({
  layer,
  onLayerPatch,
}: {
  layer: Extract<Layer, { type: "text" }>;
  onLayerPatch: (patch: Partial<Layer>) => void;
}) {
  return (
    <>
      <label className="field">
        Text
        <textarea data-testid="text-content" value={layer.text} onChange={(e) => onLayerPatch({ text: e.target.value })} />
      </label>
      <PatternPicker
        pickerId="text"
        label="Barva / vzor textu"
        value={layer.fill}
        warnSmall={layer.fontSize < 12}
        onChange={(fill: FillStyle) => {
          const color = fill.kind === "solid" ? fill.color : layer.color;
          onLayerPatch({ fill, color });
        }}
      />
      <div className="grid2">
        <Num label="Velikost px" value={layer.fontSize} min={4} max={200} onChange={(v) => onLayerPatch({ fontSize: v })} />
        <Num label="Řádkování" value={layer.lineHeight} min={0.8} max={3} step={0.05} onChange={(v) => onLayerPatch({ lineHeight: v })} />
      </div>
      <label className="check">
        <input type="checkbox" checked={layer.bold} onChange={(e) => onLayerPatch({ bold: e.target.checked })} />
        Tučné
      </label>
      <label className="field">
        Zarovnání
        <select value={layer.align} onChange={(e) => onLayerPatch({ align: e.target.value as Extract<Layer, { type: "text" }>["align"] })}>
          <option value="left">Vlevo</option>
          <option value="center">Na střed</option>
          <option value="right">Vpravo</option>
        </select>
      </label>
      <label className="check">
        <input type="checkbox" checked={layer.outline} onChange={(e) => onLayerPatch({ outline: e.target.checked })} />
        Obrys
      </label>
      {layer.outline && <Num label="Obrys px" value={layer.outlineWidth} min={1} max={8} onChange={(v) => onLayerPatch({ outlineWidth: v })} />}
    </>
  );
}

function RectProps({
  layer,
  onLayerPatch,
}: {
  layer: Extract<Layer, { type: "rect" }>;
  onLayerPatch: (patch: Partial<Layer>) => void;
}) {
  return (
    <>
      <PatternPicker pickerId="fill" label="Výplň" value={layer.fill} allowNone onChange={(fill) => onLayerPatch({ fill })} />
      <PatternPicker pickerId="stroke" label="Obrys" value={layer.stroke} allowNone onChange={(stroke) => onLayerPatch({ stroke })} />
      <Num label="Tloušťka obrysu" value={layer.strokeWidth} min={0} max={40} onChange={(v) => onLayerPatch({ strokeWidth: v })} />
    </>
  );
}

function LineProps({
  layer,
  onLayerPatch,
}: {
  layer: Extract<Layer, { type: "line" }>;
  onLayerPatch: (patch: Partial<Layer>) => void;
}) {
  return (
    <div className="grid2">
      <Num label="X1" value={round1(layer.x1)} onChange={(v) => onLayerPatch({ x1: v })} />
      <Num label="Y1" value={round1(layer.y1)} onChange={(v) => onLayerPatch({ y1: v })} />
      <Num label="X2" value={round1(layer.x2)} onChange={(v) => onLayerPatch({ x2: v })} />
      <Num label="Y2" value={round1(layer.y2)} onChange={(v) => onLayerPatch({ y2: v })} />
      <label className="field">
        Barva
        <select value={layer.color} onChange={(e) => onLayerPatch({ color: e.target.value as PaletteColor })}>
          {COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <Num label="Tloušťka" value={layer.thickness} min={1} max={40} onChange={(v) => onLayerPatch({ thickness: v })} />
    </div>
  );
}

function Num({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="field">
      {label}
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
