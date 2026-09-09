import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { evaluateOrbital, ORBITAL_MODELS } from '../components/explorer/orbitals/orbitalMath.mjs';

const rendererFile = new URL('../components/explorer/orbitals/OrbitalVolume.js', import.meta.url);

// Extract the actual shader literal used by OrbitalVolume, not a test rewrite.
// Never eval the React module or interpolate arbitrary source into this helper.
function readWavefunctionGLSL() {
  const source = readFileSync(rendererFile, 'utf8');
  const match = /export\s+const\s+orbitalFunctionsGLSL\s*=\s*`([^`]*)`\s*;/.exec(source);
  assert.ok(match, 'OrbitalVolume must export its wavefunction GLSL as a template literal');
  assert.ok(!match[1].includes('${'), 'Resolve GLSL interpolation explicitly before numerical verification');
  return match[1];
}

function samplePoints() {
  const samples = [];
  for (const id of Object.keys(ORBITAL_MODELS)) {
    for (const axis of id === '2p' ? ['x', 'y', 'z'] : ['z']) {
      for (const point of [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [2, 0, 0], [0, 2, 0], [0, 0, 2], [-2, -2, -2], [1.25, -0.7, 2.1], [4, 3, 0], [8, 2, -3]]) {
        const amplitude = evaluateOrbital(id, ...point, axis);
        samples.push({ id, axis, point, shaderIndex: ORBITAL_MODELS[id].shaderIndex, axisIndex: { x: 0, y: 1, z: 2 }[axis], amplitude, density: amplitude * amplitude });
      }
    }
  }
  return samples;
}

/**
 * Compare actual GPU float results with the independent JavaScript evaluator.
 * Uses one detached, test-only WebGL2 context; the app still has one Canvas.
 * Float bits are encoded into RGBA8 bytes so no float framebuffer extension is
 * required. Only this helper's browser context is closed.
 */
export async function runOrbitalGPUChecks(browser, baseURL = 'http://localhost:3000') {
  const shader = readWavefunctionGLSL();
  const samples = samplePoints();
  const context = await browser.newContext({ viewport: { width: 640, height: 480 } });
  try {
    const page = await context.newPage();
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(({ shader, samples }) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
      if (!gl) throw new Error('GPU numerical verification requires WebGL2');
      const allocated = [];
      let program;
      try {
        const compile = (type, source) => {
          const item = gl.createShader(type);
          allocated.push(item);
          gl.shaderSource(item, source);
          gl.compileShader(item);
          if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) throw new Error(`GPU test shader compile: ${gl.getShaderInfoLog(item)}`);
          return item;
        };
        const vertex = compile(gl.VERTEX_SHADER, `#version 300 es
          void main() {
            vec2 p = gl_VertexID == 0 ? vec2(-1.0, -1.0) : (gl_VertexID == 1 ? vec2(3.0, -1.0) : vec2(-1.0, 3.0));
            gl_Position = vec4(p, 0.0, 1.0);
          }`);
        const fragment = compile(gl.FRAGMENT_SHADER, `#version 300 es
          precision highp float;
          precision highp int;
          uniform vec3 samplePoint;
          uniform int selectedOrbital;
          uniform int selectedAxis;
          uniform int densityMode;
          out vec4 encoded;
          ${shader}
          void main() {
            float amplitude = wavefunction(samplePoint, selectedOrbital, selectedAxis);
            uint bits = floatBitsToUint(densityMode == 0 ? amplitude : amplitude * amplitude);
            uvec4 bytes = uvec4(bits & 255u, (bits >> 8u) & 255u, (bits >> 16u) & 255u, (bits >> 24u) & 255u);
            encoded = vec4(bytes) / 255.0;
          }`);
        program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`GPU test program link: ${gl.getProgramInfoLog(program)}`);
        gl.useProgram(program);
        gl.disable(gl.DITHER);
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.viewport(0, 0, 1, 1);
        const locations = Object.fromEntries(['samplePoint', 'selectedOrbital', 'selectedAxis', 'densityMode'].map((name) => [name, gl.getUniformLocation(program, name)]));
        const bytes = new Uint8Array(4);
        const values = samples.map(({ point, shaderIndex, axisIndex }) => {
          gl.uniform3fv(locations.samplePoint, point);
          gl.uniform1i(locations.selectedOrbital, shaderIndex);
          gl.uniform1i(locations.selectedAxis, axisIndex);
          const modes = [0, 1].map((mode) => {
            gl.uniform1i(locations.densityMode, mode);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
            return new DataView(bytes.buffer).getFloat32(0, true);
          });
          return { amplitude: modes[0], density: modes[1] };
        });
        const error = gl.getError();
        if (error !== gl.NO_ERROR) throw new Error(`GPU numerical check WebGL error ${error}`);
        const debug = gl.getExtension('WEBGL_debug_renderer_info');
        return {
          values,
          vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
          renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
          precision: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT).precision,
        };
      } finally {
        if (program) gl.deleteProgram(program);
        allocated.forEach((item) => gl.deleteShader(item));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    }, { shader, samples });

    let maxAbsoluteError = 0;
    let maxRelativeError = 0;
    samples.forEach((sample, index) => {
      for (const quantity of ['amplitude', 'density']) {
        const expected = sample[quantity];
        const actual = result.values[index][quantity];
        assert.ok(Number.isFinite(actual), `${sample.id}/${sample.axis} ${quantity} must be finite`);
        const absoluteError = Math.abs(actual - expected);
        maxAbsoluteError = Math.max(maxAbsoluteError, absoluteError);
        // Near-zero nodes use the absolute tolerance; relative error there is
        // undefined or misleading. Both tolerances apply away from zero.
        const relativeError = Math.abs(expected) > 1e-7 ? absoluteError / Math.abs(expected) : 0;
        maxRelativeError = Math.max(maxRelativeError, relativeError);
        const label = `${sample.id}/${sample.axis} at ${sample.point.join(',')} (${quantity})`;
        assert.ok(absoluteError <= 1e-5, `${label}: CPU ${expected}, GPU ${actual}, absolute error ${absoluteError}`);
        assert.ok(relativeError <= 1e-4, `${label}: relative error ${relativeError}`);
      }
    });
    return {
      status: 'passed',
      samples: samples.length,
      comparisons: samples.length * 2,
      shaderSHA256: createHash('sha256').update(shader).digest('hex'),
      shaderSource: 'components/explorer/orbitals/OrbitalVolume.js#orbitalFunctionsGLSL',
      readback: 'WebGL2 floatBitsToUint encoded into RGBA8; no float framebuffer extension',
      tolerances: { absolute: 1e-5, relative: 1e-4, relativeAppliedAbove: 1e-7 },
      maxAbsoluteError,
      maxRelativeError,
      vendor: result.vendor,
      renderer: result.renderer,
      fragmentHighFloatPrecision: result.precision,
    };
  } finally {
    await context.close();
  }
}
