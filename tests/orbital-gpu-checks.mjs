import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  buildOrbitalField,
  sampleOrbitalGrid,
} from "../components/explorer/orbitals/orbitalField.mjs";
import { ensureOrbitalPresets, getOrbitalPreset } from "../data/orbital-presets.mjs";

const source = new URL(
  "../components/explorer/orbitals/OrbitalVolume.js",
  import.meta.url,
);

const elements = JSON.parse(
  readFileSync(new URL("../public/elements.json", import.meta.url), "utf8"),
);
ensureOrbitalPresets(elements);

function readSamplingGLSL() {
  const match =
    /export\s+const\s+orbitalFieldSamplingGLSL\s*=\s*`([^`]*)`\s*;/.exec(
      readFileSync(source, "utf8"),
    );
  assert.ok(
    match && !match[1].includes("${"),
    "Test the actual standalone field sampler used by OrbitalVolume",
  );
  return match[1];
}

function reference(field, point) {
  const radius = Math.hypot(...point);
  const index = field.grids.findIndex((grid) => radius < grid.radius);
  if (index < 0) return [0, 0];
  const grid = field.grids[index];
  const value = sampleOrbitalGrid(grid, ...point);
  if (index + 1 === field.grids.length) return value;
  const fraction = Math.max(
    0,
    Math.min(1, (radius / grid.radius - (1 - 6 / grid.size)) / (4 / grid.size)),
  );
  const blend = fraction * fraction * (3 - 2 * fraction);
  const coarse = sampleOrbitalGrid(field.grids[index + 1], ...point);
  return value.map((channel, i) => channel * (1 - blend) + coarse[i] * blend);
}

/** Verify the production sampler with actual RG16F textures and float readback. */
export async function runOrbitalGPUChecks(
  browser,
  baseURL = "http://localhost:3000",
) {
  const shader = readSamplingGLSL();
  const scenarios = [
    { number: 1, sizeMode: "normalized" },
    { number: 6, sizeMode: "normalized", orientation: "x" },
    { number: 118, sizeMode: "normalized" },
    { number: 118, sizeMode: "ratios" },
    { number: 118, sizeMode: "ratios", only: ["1s"] },
    { number: 118, sizeMode: "ratios", only: [] },
  ].map((scenario) => {
    const preset = getOrbitalPreset(scenario.number);
    const field = buildOrbitalField({
      allSubshells: preset.subshells,
      subshells: preset.subshells
        .filter(({ id }) => !scenario.only || scenario.only.includes(id))
        .map(({ id }) => ({ id, orientation: scenario.orientation || "z" })),
      sizeMode: scenario.sizeMode,
      resolution: 64,
    });
    const points = [
      [0, 0, 0],
      [0.1, 0, 0],
      [-0.1, 0, 0],
      [0, 0.4, 0],
      [0.2, -0.15, 0.3],
      [1, 0, 0],
      [1.2, 0, 0],
    ];
    field.grids.forEach(({ radius, size }) => {
      for (const fraction of [
        0.25,
        1 - 6 / size,
        1 - 4 / size,
        1 - 2 / size,
        0.999,
      ])
        points.push([
          (radius * fraction) / Math.sqrt(2),
          0,
          (radius * fraction) / Math.sqrt(2),
        ]);
    });
    return {
      label: `${preset.symbol}/${scenario.sizeMode}/${scenario.only?.join(",") ?? "all"}`,
      grids: field.grids.map(({ radius, size, data }) => ({
        radius,
        size,
        base64: Buffer.from(
          data.buffer,
          data.byteOffset,
          data.byteLength,
        ).toString("base64"),
      })),
      points,
      expected: points.map((point) => reference(field, point)),
    };
  });
  const context = await browser.newContext({
    viewport: { width: 640, height: 480 },
  });
  try {
    const page = await context.newPage();
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    const result = await page.evaluate(
      ({ shader, scenarios }) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const gl = canvas.getContext("webgl2", {
          antialias: false,
          preserveDrawingBuffer: true,
          premultipliedAlpha: false,
        });
        if (!gl) throw new Error("GPU field verification requires WebGL2");
        const allocated = [];
        const textures = [];
        let program;
        try {
          const compile = (type, source) => {
            const item = gl.createShader(type);
            allocated.push(item);
            gl.shaderSource(item, source);
            gl.compileShader(item);
            if (!gl.getShaderParameter(item, gl.COMPILE_STATUS))
              throw new Error(gl.getShaderInfoLog(item));
            return item;
          };
          const vertex = compile(
            gl.VERTEX_SHADER,
            `#version 300 es
          void main() { vec2 p=gl_VertexID==0?vec2(-1,-1):(gl_VertexID==1?vec2(3,-1):vec2(-1,3)); gl_Position=vec4(p,0,1); }`,
          );
          const fragment = compile(
            gl.FRAGMENT_SHADER,
            `#version 300 es
          precision highp float; precision highp int;
          uniform vec3 samplePoint; uniform int channel;
          out vec4 encoded;
          ${shader}
          void main() {
            vec2 sampleValue=overlayField(samplePoint);
            uint bits=floatBitsToUint(channel==0?sampleValue.x:sampleValue.y);
            encoded=vec4(uvec4(bits&255u,(bits>>8u)&255u,(bits>>16u)&255u,(bits>>24u)&255u))/255.0;
          }`,
          );
          program = gl.createProgram();
          gl.attachShader(program, vertex);
          gl.attachShader(program, fragment);
          gl.linkProgram(program);
          if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(program));
          gl.useProgram(program);
          gl.disable(gl.DITHER);
          gl.disable(gl.BLEND);
          gl.disable(gl.DEPTH_TEST);
          gl.viewport(0, 0, 1, 1);
          const location = (name) => gl.getUniformLocation(program, name);
          const bytes = new Uint8Array(4);
          const values = scenarios.map((scenario) => {
            while (textures.length) gl.deleteTexture(textures.pop());
            const radii = new Float32Array([1, 1, 1, 1, 1, 1]);
            for (let index = 0; index < 6; index++) {
              const grid = scenario.grids[index];
              const texture = gl.createTexture();
              textures.push(texture);
              gl.activeTexture(gl.TEXTURE0 + index);
              gl.bindTexture(gl.TEXTURE_3D, texture);
              gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              for (const parameter of [
                gl.TEXTURE_WRAP_S,
                gl.TEXTURE_WRAP_T,
                gl.TEXTURE_WRAP_R,
              ])
                gl.texParameteri(gl.TEXTURE_3D, parameter, gl.CLAMP_TO_EDGE);
              gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
              const buffer = grid
                ? Uint8Array.from(atob(grid.base64), (value) =>
                    value.charCodeAt(0),
                  ).buffer
                : new ArrayBuffer(4);
              const size = grid?.size || 1;
              gl.texImage3D(
                gl.TEXTURE_3D,
                0,
                gl.RG16F,
                size,
                size,
                size,
                0,
                gl.RG,
                gl.HALF_FLOAT,
                new Uint16Array(buffer),
              );
              gl.uniform1i(location(`grid${index}`), index);
              radii[index] = grid?.radius || 1;
            }
            gl.uniform1fv(location("radii"), radii);
            gl.uniform1i(location("gridCount"), scenario.grids.length);
            gl.uniform1f(location("gridSize"), scenario.grids[0]?.size || 64);
            return scenario.points.map((point) => {
              gl.uniform3fv(location("samplePoint"), point);
              return [0, 1].map((channel) => {
                gl.uniform1i(location("channel"), channel);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
                gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
                return new DataView(bytes.buffer).getFloat32(0, true);
              });
            });
          });
          const error = gl.getError();
          if (error !== gl.NO_ERROR)
            throw new Error(`Field GPU error ${error}`);
          const debug = gl.getExtension("WEBGL_debug_renderer_info");
          return {
            values,
            renderer: debug
              ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
              : gl.getParameter(gl.RENDERER),
          };
        } finally {
          textures.forEach((texture) => gl.deleteTexture(texture));
          if (program) gl.deleteProgram(program);
          allocated.forEach((item) => gl.deleteShader(item));
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        }
      },
      { shader, scenarios },
    );
    let comparisons = 0;
    let maxAbsoluteError = 0;
    let maxToleranceFraction = 0;
    scenarios.forEach((scenario, scenarioIndex) =>
      scenario.expected.forEach((channels, sample) =>
        channels.forEach((expected, channel) => {
          const actual = result.values[scenarioIndex][sample][channel];
          assert.ok(
            Number.isFinite(actual),
            `${scenario.label} finite channel`,
          );
          const error = Math.abs(actual - expected);
          maxAbsoluteError = Math.max(error, maxAbsoluteError);
          const tolerance = 2e-4 + Math.abs(expected) * 0.002;
          maxToleranceFraction = Math.max(
            maxToleranceFraction,
            error / tolerance,
          );
          assert.ok(
            error <= tolerance,
            `${scenario.label} at ${scenario.points[sample]} channel ${channel}: CPU ${expected}, GPU ${actual}`,
          );
          comparisons++;
        }),
      ),
    );
    return {
      status: "passed",
      scenarios: scenarios.length,
      comparisons,
      maxAbsoluteError,
      maxToleranceFraction,
      renderer: result.renderer,
      shaderSHA256: createHash("sha256").update(shader).digest("hex"),
      shaderSource:
        "components/explorer/orbitals/OrbitalVolume.js#orbitalFieldSamplingGLSL",
      readback:
        "Production RG16F sampler with actual nested textures; floatBitsToUint encoded into RGBA8",
      tolerance:
        "2e-4 absolute + 0.2% relative for hardware-filtered half-float texture samples",
    };
  } finally {
    await context.close();
  }
}
