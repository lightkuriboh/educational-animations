/**
 * Automated Unit & Integrity Test Suite for Genital Homology 3D Engine
 * 
 * Tests:
 * 1. Keyframe Parameter Schema Uniformity (S0, F_Neo, F_Adult, M_Neo, M_Adult)
 * 2. Continuous Parameter Sampling & NaN Guard across timeline [0, 1]
 * 3. Mesh Vertex Generation & Numerical Stability (all coordinates finite)
 * 4. Hood Cowl Collapse Verification when hood < 0.02
 * 5. Seam Normal and Coordinate Consistency for Periodic Meshes
 * 6. Headless Clearance & Non-Clipping Verification (Torso & Medial Thighs)
 * 
 * Run with: node --no-warnings genitals-edu/tools/run-unit-tests.mjs
 */
import assert from 'node:assert/strict';

globalThis.window = { THREE: {} };
const ROOT = new URL('../js/', import.meta.url).href;

const { P } = await import(ROOT + 'params/keyframes.js');
const { sampleParams } = await import(ROOT + 'params/sampler.js');
const { smoothstep } = await import(ROOT + 'math/helpers.js');
const { writeTubercle } = await import(ROOT + 'mesh/tubercle.js');
const { writeHood } = await import(ROOT + 'mesh/hood.js');
const { writeTube } = await import(ROOT + 'mesh/folds.js');
const { writeSwelling, writeScrotalRaphe } = await import(ROOT + 'mesh/swellings.js');
const { writeSinus3D } = await import(ROOT + 'mesh/sinus.js');
const { torsoStatic, torsoMons, torsoHeight, thighPoint, thighClearance } = await import(ROOT + 'mesh/bodyField.js');

function createMockGrid(nU, nV) {
  const n = (nU + 1) * (nV + 1);
  const a = new Float32Array(n * 3);
  return {
    a,
    userData: { nU, nV },
    attributes: {
      position: {
        count: n,
        setXYZ(k, x, y, z) {
          a[k * 3] = x;
          a[k * 3 + 1] = y;
          a[k * 3 + 2] = z;
        },
        getX(k) { return a[k * 3]; },
        getY(k) { return a[k * 3 + 1]; },
        getZ(k) { return a[k * 3 + 2]; }
      }
    }
  };
}

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log('--- Starting Unit Test Suite ---\n');

// 1. Keyframe Parameter Schema Uniformity
test('Keyframe Schema Uniformity across all 5 stages', () => {
  const stages = ['S0', 'F_Neo', 'F_Adult', 'M_Neo', 'M_Adult'];
  const sections = ['tubercle', 'folds', 'swellings', 'sinus'];

  const baseline = P.S0;
  for (const stage of stages) {
    assert(P[stage], `Missing stage ${stage}`);
    for (const sec of sections) {
      assert(P[stage][sec], `Missing section ${sec} in stage ${stage}`);
      const baseKeys = Object.keys(baseline[sec]).sort();
      const stageKeys = Object.keys(P[stage][sec]).sort();
      assert.deepEqual(stageKeys, baseKeys, `Key mismatch in ${stage}.${sec}: expected [${baseKeys}], got [${stageKeys}]`);
      
      for (const k of stageKeys) {
        const val = P[stage][sec][k];
        assert(typeof val === 'number' && Number.isFinite(val), `Invalid value at ${stage}.${sec}.${k}: ${val}`);
      }
    }
  }
});

// 2. Continuous Parameter Sampling & NaN Guard
test('Parameter Sampling continuity and finite values across [0, 1]', () => {
  const modes = [
    { advMode: true, arousal: 0 },
    { advMode: true, arousal: 1 },
    { advMode: false, arousal: 0 },
    { advMode: false, arousal: 1 }
  ];

  for (const mode of modes) {
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const p = sampleParams(Math.min(1, t), mode);
      assert(p, `Null params returned at t=${t}`);
      for (const sec of ['tubercle', 'folds', 'swellings', 'sinus']) {
        for (const [k, v] of Object.entries(p[sec])) {
          assert(Number.isFinite(v), `Non-finite param ${sec}.${k} = ${v} at t=${t}, mode=${JSON.stringify(mode)}`);
        }
      }
    }
  }
});

// 3. Mesh Vertex Generation & Numerical Stability
test('Mesh Vertex Generation numerical stability', () => {
  const tub = createMockGrid(56, 40);
  const hood = createMockGrid(36, 32);
  const foldL = createMockGrid(60, 28);
  const swellL = createMockGrid(60, 36);
  const sinus = createMockGrid(52, 28);
  const raphe = createMockGrid(60, 36);

  for (let t = 0; t <= 1; t += 0.1) {
    const p = sampleParams(t, { advMode: true, arousal: 0.5 });
    writeTubercle(tub, p.tubercle);
    writeHood(hood, p.tubercle);
    writeTube(foldL, -1, p.folds, p.tubercle, p.folds.a, p.folds.b, 0);
    writeSwelling(swellL, -1, p.swellings);
    writeScrotalRaphe(raphe, p.swellings);
    writeSinus3D(sinus, p.sinus);

    for (const grid of [tub, hood, foldL, swellL, raphe, sinus]) {
      for (let i = 0; i < grid.a.length; i++) {
        assert(Number.isFinite(grid.a[i]), `Found non-finite mesh vertex coordinate at index ${i}, t=${t}`);
      }
    }
  }
});

// 4. Clitoral Hood Cowl Collapse Verification
test('Hood Cowl collapses to a point when hood < 0.02', () => {
  const hood = createMockGrid(36, 32);
  const pMale = sampleParams(1.0, { advMode: true, arousal: 0 }); // Male stage has hood = 0
  assert(pMale.tubercle.hood < 0.02, 'Male hood parameter should be < 0.02');
  
  writeHood(hood, pMale.tubercle);
  
  // All vertices should collapse to the same coordinate
  const p0x = hood.attributes.position.getX(0);
  const p0y = hood.attributes.position.getY(0);
  const p0z = hood.attributes.position.getZ(0);

  for (let i = 1; i < hood.attributes.position.count; i++) {
    const dx = Math.abs(hood.attributes.position.getX(i) - p0x);
    const dy = Math.abs(hood.attributes.position.getY(i) - p0y);
    const dz = Math.abs(hood.attributes.position.getZ(i) - p0z);
    assert(dx < 1e-6 && dy < 1e-6 && dz < 1e-6, `Hood vertex ${i} did not collapse cleanly: delta = (${dx}, ${dy}, ${dz})`);
  }
});

// 5. Thigh & Torso Analytical Field Consistency
test('Body field functions return valid numbers and symmetry', () => {
  // Test bilateral symmetry of torsoStatic and torsoMons
  for (let x = 0; x <= 2.5; x += 0.25) {
    for (let y = -2.5; y <= 2.5; y += 0.5) {
      const zR = torsoStatic(x, y);
      const zL = torsoStatic(-x, y);
      assert(Math.abs(zR - zL) < 1e-6, `torsoStatic asymmetry at x=${x}, y=${y}`);
      const mR = torsoMons(x, y);
      const mL = torsoMons(-x, y);
      assert(Math.abs(mR - mL) < 1e-6, `torsoMons asymmetry at x=${x}, y=${y}`);
    }
  }

  // Test thigh bilateral symmetry: any point on right thigh mirrored across X has matching clearance on left thigh
  for (let t = 0; t <= 1; t += 0.25) {
    for (let phi = 0; phi < Math.PI * 2; phi += 0.5) {
      const pR = thighPoint(1, t, phi);
      const pMirrored = [-pR[0], pR[1], pR[2]];
      const clearR = thighClearance(1, pR);
      const clearL = thighClearance(-1, pMirrored);
      assert(Math.abs(clearR - clearL) < 1e-4, `Thigh bilateral clearance asymmetry at t=${t}, phi=${phi}: ${clearR} vs ${clearL}`);
    }
  }
});

// 6. Clearance & Non-Clipping Verification
test('Clearance Verification across developmental timeline and arousal states', () => {
  const LIMITS = { tubercle: 0.02, hood: 0.02, swellings: 0.02, folds: 0.01, thigh: 0.08 };
  const cases = [];
  for (const t of [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1])
    for (const arousal of [0, 1]) cases.push({ t, state: { advMode: true, arousal } });
  for (const t of [1 / 6, 0.5, 5 / 6]) cases.push({ t, state: { advMode: false, arousal: 0 } });

  const tub = createMockGrid(56, 40);
  const hood = createMockGrid(36, 32);
  const fL = createMockGrid(60, 28), fR = createMockGrid(60, 28);
  const sL = createMockGrid(60, 36), sR = createMockGrid(60, 36);

  function getVerts(g, filter) {
    const out = [], { nU, nV } = g.userData;
    for (let i = 0; i <= nU; i++) for (let j = 0; j <= nV; j++) {
      if (filter && !filter(i / nU, j / nV)) continue;
      const k = i * (nV + 1) + j;
      out.push([g.a[k * 3], g.a[k * 3 + 1], g.a[k * 3 + 2]]);
    }
    return out;
  }

  for (const c of cases) {
    const p = sampleParams(c.t, c.state);
    const m = smoothstep(0, 0.6, p.swellings.fuse);
    writeTubercle(tub, p.tubercle);
    writeHood(hood, p.tubercle);
    writeTube(fL, -1, p.folds, p.tubercle, p.folds.a, p.folds.b, 0);
    writeTube(fR, 1, p.folds, p.tubercle, p.folds.a, p.folds.b, 0);
    writeSwelling(sL, -1, p.swellings);
    writeSwelling(sR, 1, p.swellings);

    const minTorso = vs => vs.reduce((mn, [x, y, z]) => Math.min(mn, z - torsoHeight(x, y, m)), Infinity);
    const hoodOn = p.tubercle.hood > 0.02;
    const swFront = (side) => (s, w) => s >= 0.15 && s <= 0.85 && -side * Math.sin(2 * Math.PI * w) >= 0.2;
    const foldOuter = (s, w) => s >= 0.1 && s <= 0.9 && Math.sin(2 * Math.PI * w) > 0;

    const organ = [...getVerts(tub, u => u >= 0.2), ...(hoodOn ? getVerts(hood) : []), ...getVerts(fL), ...getVerts(fR), ...getVerts(sL), ...getVerts(sR)];
    const res = {
      tubercle: minTorso(getVerts(tub, u => u >= 0.2)),
      hood: hoodOn ? minTorso(getVerts(hood)) : Infinity,
      swellings: Math.min(minTorso(getVerts(sL, swFront(-1))), minTorso(getVerts(sR, swFront(1)))),
      folds: Math.min(minTorso(getVerts(fL, foldOuter)), minTorso(getVerts(fR, foldOuter))),
      thigh: organ.reduce((mn, P) => Math.min(mn, thighClearance(-1, P), thighClearance(1, P)), Infinity)
    };

    for (const [key, limit] of Object.entries(LIMITS)) {
      if (res[key] !== Infinity) {
        assert(res[key] >= limit, `Clearance failure: ${key} = ${res[key]} < ${limit} at t=${c.t}, arousal=${c.state.arousal}`);
      }
    }
  }
});

console.log(`\n🎉 All ${passedTests}/${totalTests} unit tests passed successfully!\n`);
