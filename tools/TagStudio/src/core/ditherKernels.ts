/** Taps relativní k průchodu zleva doprava. Při dir=-1 se dx zrcadlí. */

export interface KernelTap {
  dx: number;
  dy: number;
  w: number;
}

export interface ErrorKernel {
  id: string;
  taps: KernelTap[];
  denom: number;
}

export const FLOYD_STEINBERG_KERNEL: ErrorKernel = {
  id: "floyd-steinberg",
  taps: [
    { dx: 1, dy: 0, w: 7 },
    { dx: -1, dy: 1, w: 3 },
    { dx: 0, dy: 1, w: 5 },
    { dx: 1, dy: 1, w: 1 },
  ],
  denom: 16,
};

export const ATKINSON_KERNEL: ErrorKernel = {
  id: "atkinson",
  taps: [
    { dx: 1, dy: 0, w: 1 },
    { dx: 2, dy: 0, w: 1 },
    { dx: -1, dy: 1, w: 1 },
    { dx: 0, dy: 1, w: 1 },
    { dx: 1, dy: 1, w: 1 },
    { dx: 0, dy: 2, w: 1 },
  ],
  denom: 8,
};

export const SIERRA_LITE_KERNEL: ErrorKernel = {
  id: "sierra-lite",
  taps: [
    { dx: 1, dy: 0, w: 2 },
    { dx: -1, dy: 1, w: 1 },
    { dx: 0, dy: 1, w: 1 },
  ],
  denom: 4,
};

export const BURKES_KERNEL: ErrorKernel = {
  id: "burkes",
  taps: [
    { dx: 1, dy: 0, w: 8 },
    { dx: 2, dy: 0, w: 4 },
    { dx: -2, dy: 1, w: 2 },
    { dx: -1, dy: 1, w: 4 },
    { dx: 0, dy: 1, w: 8 },
    { dx: 1, dy: 1, w: 4 },
    { dx: 2, dy: 1, w: 2 },
  ],
  denom: 32,
};

export function mirrorTaps(taps: KernelTap[], dir: 1 | -1): KernelTap[] {
  if (dir === 1) return taps;
  return taps.map((t) => ({ dx: t.dx === 0 ? 0 : -t.dx, dy: t.dy, w: t.w }));
}

export function kernelWeightSum(kernel: ErrorKernel): number {
  return kernel.taps.reduce((s, t) => s + t.w, 0);
}
