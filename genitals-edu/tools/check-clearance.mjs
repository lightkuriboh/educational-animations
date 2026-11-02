/**
 * Headless geometry verification (no browser): ensures organs never clip into the
 * torso and keep clear of the thighs at every stage and arousal extreme.
 * Run: node --no-warnings genitals-edu/tools/check-clearance.mjs
 */
globalThis.window = { THREE: {} };
const ROOT = new URL('../js/', import.meta.url).href;
const { sampleParams } = await import(ROOT + 'params/sampler.js');
const { smoothstep } = await import(ROOT + 'math/helpers.js');
const { writeTubercle } = await import(ROOT + 'mesh/tubercle.js');
const { writeHood } = await import(ROOT + 'mesh/hood.js');
const { writeTube } = await import(ROOT + 'mesh/folds.js');
const { writeSwelling } = await import(ROOT + 'mesh/swellings.js');
const { torsoHeight, thighClearance } = await import(ROOT + 'mesh/bodyField.js');

function grid(nU, nV) {
  const a = new Float32Array((nU + 1) * (nV + 1) * 3);
  return { a, userData: { nU, nV }, attributes: { position: { setXYZ(k, x, y, z) { a[k * 3] = x; a[k * 3 + 1] = y; a[k * 3 + 2] = z; } } } };
}
function verts(g, filter) {
  const out = [], { nU, nV } = g.userData;
  for (let i = 0; i <= nU; i++) for (let j = 0; j <= nV; j++) {
    if (filter && !filter(i / nU, j / nV)) continue;
    const k = i * (nV + 1) + j;
    out.push([g.a[k * 3], g.a[k * 3 + 1], g.a[k * 3 + 2]]);
  }
  return out;
}
const LIMITS = { tubercle: 0.02, hood: 0.02, swellings: 0.02, folds: 0.01, thigh: 0.08 };

const cases = [];
for (const t of [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1])
  for (const arousal of [0, 1]) cases.push({ t, state: { advMode: true, arousal } });
for (const t of [1 / 6, 0.5, 5 / 6]) cases.push({ t, state: { advMode: false, arousal: 0 } });

let failed = false;
for (const c of cases) {
  const p = sampleParams(c.t, c.state);
  const m = smoothstep(0, 0.6, p.swellings.fuse);
  const tub = grid(56, 40); writeTubercle(tub, p.tubercle);
  const hood = grid(36, 32); writeHood(hood, p.tubercle);
  const fL = grid(60, 28), fR = grid(60, 28);
  writeTube(fL, -1, p.folds, p.tubercle, p.folds.a, p.folds.b, 0);
  writeTube(fR, 1, p.folds, p.tubercle, p.folds.a, p.folds.b, 0);
  const sL = grid(60, 36), sR = grid(60, 36);
  writeSwelling(sL, -1, p.swellings); writeSwelling(sR, 1, p.swellings);

  const minTorso = vs => vs.reduce((mn, [x, y, z]) => Math.min(mn, z - torsoHeight(x, y, m)), Infinity);
  const hoodOn = p.tubercle.hood > 0.02;
  // swelling grid: th = -side * w * 2π  ->  sin(th) = -side * sin(2πw)
  const swFront = (side) => (s, w) => s >= 0.15 && s <= 0.85 && -side * Math.sin(2 * Math.PI * w) >= 0.2;
  const foldOuter = (s, w) => s >= 0.1 && s <= 0.9 && Math.sin(2 * Math.PI * w) > 0;

  const organ = [...verts(tub, u => u >= 0.2), ...(hoodOn ? verts(hood) : []), ...verts(fL), ...verts(fR), ...verts(sL), ...verts(sR)];
  const res = {
    tubercle: minTorso(verts(tub, u => u >= 0.2)),
    hood: hoodOn ? minTorso(verts(hood)) : Infinity,
    swellings: Math.min(minTorso(verts(sL, swFront(-1))), minTorso(verts(sR, swFront(1)))),
    folds: Math.min(minTorso(verts(fL, foldOuter)), minTorso(verts(fR, foldOuter))),
    thigh: organ.reduce((mn, P) => Math.min(mn, thighClearance(-1, P), thighClearance(1, P)), Infinity)
  };
  const bad = Object.keys(LIMITS).filter(k => res[k] < LIMITS[k]);
  if (bad.length) failed = true;
  const fmt = v => (v === Infinity ? '  n/a ' : v.toFixed(3).padStart(6));
  console.log(
    `${c.state.advMode ? 'adv' : 'std'} t=${c.t.toFixed(3)} ar=${c.state.arousal} | ` +
    Object.keys(LIMITS).map(k => `${k}:${fmt(res[k])}`).join(' ') + (bad.length ? `  <-- FAIL ${bad.join(',')}` : '')
  );
}
process.exit(failed ? 1 : 0);
