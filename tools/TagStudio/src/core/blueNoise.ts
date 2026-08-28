/** Deterministická 64×64 blue-noise dlaždice (void-and-cluster, pevný seed). Vlastní kód. */

export const BLUE_NOISE_SIZE = 64;
const SEED = 0x51e9_b10e;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wrap(v: number, size: number): number {
  return ((v % size) + size) % size;
}

function buildKernel(sigma: number): Array<{ dx: number; dy: number; w: number }> {
  const radius = 5;
  const s2 = 2 * sigma * sigma;
  const kernel: Array<{ dx: number; dy: number; w: number }> = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      kernel.push({ dx, dy, w: Math.exp(-(dx * dx + dy * dy) / s2) });
    }
  }
  return kernel;
}

function applyFlip(
  energy: Float64Array,
  size: number,
  idx: number,
  delta: number,
  kernel: Array<{ dx: number; dy: number; w: number }>,
): void {
  const x = idx % size;
  const y = (idx / size) | 0;
  for (const k of kernel) {
    const ix = wrap(x + k.dx, size);
    const iy = wrap(y + k.dy, size);
    energy[iy * size + ix] += delta * k.w;
  }
}

export function generateBlueNoiseTile(size = BLUE_NOISE_SIZE, seed = SEED): Uint8Array {
  const rand = mulberry32(seed);
  const n = size * size;
  const binary = new Uint8Array(n);
  const kernel = buildKernel(1.9);
  const initial = Math.max(1, Math.floor(n * 0.1));
  const order = new Uint32Array(n);
  for (let i = 0; i < n; i++) order[i] = i;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  for (let i = 0; i < initial; i++) binary[order[i]] = 1;

  const energy = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    if (binary[i]) applyFlip(energy, size, i, 1, kernel);
  }

  const extrema = () => {
    let cluster = -1;
    let clusterE = -Infinity;
    let voidIdx = -1;
    let voidE = Infinity;
    for (let i = 0; i < n; i++) {
      if (binary[i]) {
        if (energy[i] > clusterE) {
          clusterE = energy[i];
          cluster = i;
        }
      } else if (energy[i] < voidE) {
        voidE = energy[i];
        voidIdx = i;
      }
    }
    return { cluster, voidIdx, clusterE, voidE };
  };

  for (let iter = 0; iter < 1200; iter++) {
    const { cluster, voidIdx, clusterE, voidE } = extrema();
    if (cluster < 0 || voidIdx < 0 || cluster === voidIdx) break;
    if (clusterE - voidE < 1e-6) break;
    binary[cluster] = 0;
    applyFlip(energy, size, cluster, -1, kernel);
    binary[voidIdx] = 1;
    applyFlip(energy, size, voidIdx, 1, kernel);
  }

  const ranks = new Uint16Array(n);
  const ones: number[] = [];
  for (let i = 0; i < n; i++) if (binary[i]) ones.push(i);
  let rank = ones.length - 1;
  const workBin = new Uint8Array(binary);
  const workE = new Float64Array(energy);
  while (ones.length) {
    let best = 0;
    let bestE = -Infinity;
    for (let k = 0; k < ones.length; k++) {
      const i = ones[k];
      if (workE[i] > bestE) {
        bestE = workE[i];
        best = k;
      }
    }
    const idx = ones.splice(best, 1)[0];
    ranks[idx] = rank--;
    workBin[idx] = 0;
    applyFlip(workE, size, idx, -1, kernel);
  }

  const zeros: number[] = [];
  for (let i = 0; i < n; i++) if (!binary[i]) zeros.push(i);
  workBin.set(binary);
  workE.fill(0);
  for (let i = 0; i < n; i++) if (binary[i]) applyFlip(workE, size, i, 1, kernel);
  rank = initial;
  while (zeros.length) {
    let best = 0;
    let bestE = Infinity;
    for (let k = 0; k < zeros.length; k++) {
      const i = zeros[k];
      if (workE[i] < bestE) {
        bestE = workE[i];
        best = k;
      }
    }
    const idx = zeros.splice(best, 1)[0];
    ranks[idx] = rank++;
    workBin[idx] = 1;
    applyFlip(workE, size, idx, 1, kernel);
  }

  const tile = new Uint8Array(n);
  for (let i = 0; i < n; i++) tile[i] = Math.round((ranks[i] / (n - 1)) * 255);
  return tile;
}

let cached: Uint8Array | null = null;

export function getBlueNoiseTile(): Uint8Array {
  if (!cached) cached = generateBlueNoiseTile();
  return cached;
}
