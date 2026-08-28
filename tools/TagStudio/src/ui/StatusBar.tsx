import { APP_CREDIT, APP_VERSION } from "../core/types";
import { dualPlaneByteSize, physicalMm } from "../core/profiles";
import { paletteStats, usedPaletteCount } from "../core/palette";
import type { IndexedBitmap, Project } from "../core/types";

interface Props {
  project: Project;
  bitmap: IndexedBitmap;
  hover: { x: number; y: number } | null;
  zoom: number;
  dirty: boolean;
  error: string | null;
  notice?: string | null;
  invalidCount: number;
  previewMask: boolean;
}

export function StatusBar({ project, bitmap, hover, zoom, dirty, error, notice, invalidCount, previewMask }: Props) {
  const mm = physicalMm(project.profileId, project.orientation);
  const colors = usedPaletteCount(bitmap);
  const bytes = dualPlaneByteSize(project.canvasWidth, project.canvasHeight);
  const st = paletteStats(bitmap);
  const pct = (n: number) => (st.total ? ((n / st.total) * 100).toFixed(1) : "0.0");
  return (
    <footer className="status" data-testid="status-bar">
      <span>
        {project.canvasWidth} × {project.canvasHeight} px
        {mm ? ` · ${mm.width} × ${mm.height} mm` : ""}
        {hover ? ` · ${hover.x}, ${hover.y}` : ""}
        {` · zoom ${Math.round(zoom * 100)}%`}
        {` · barev ${colors}/3`}
        {` · B ${st.white} (${pct(st.white)}%) · Č ${st.black} (${pct(st.black)}%) · R ${st.red} (${pct(st.red)}%)`}
        {invalidCount ? ` · neplatné ${invalidCount}` : ""}
        {` · export ${bytes} B`}
        {previewMask ? " · náhled: červená maska" : ""}
        {dirty ? " · neuloženo" : ""}
        {notice && !error ? ` · ${notice}` : ""}
      </span>
      <span className={error ? "error" : "credit"}>
        {error ?? `${APP_CREDIT} · v${APP_VERSION}`}
      </span>
    </footer>
  );
}
