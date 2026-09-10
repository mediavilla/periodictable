import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ORBITAL_MODELS } from "./orbitalMath.mjs";

// High-n outer radial peaks extend beyond the half-domain fit (7s peaks at
// 0.640 of its domain). With 12% camera padding these visual envelopes keep
// those peaks in view; they are display bounds, not probability percentiles.
const outerShellFitFractions = { 5: 0.55, 6: 0.58, 7: 0.6 };

const vertexShader = `
out vec2 screenUV;
void main() {
  screenUV = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// Every nested grid stores the complete overlay. Choose the finest covering
// grid and blend its edge; summing grids would count the same field twice.
export const orbitalFieldSamplingGLSL = `
uniform highp sampler3D grid0;
uniform highp sampler3D grid1;
uniform highp sampler3D grid2;
uniform highp sampler3D grid3;
uniform highp sampler3D grid4;
uniform highp sampler3D grid5;
uniform float radii[6];
uniform int gridCount;
uniform float gridSize;
vec2 gridAt(int index, vec3 p) {
  vec3 uv = p / (2.0 * radii[index]) + 0.5;
  if (index == 0) return texture(grid0, uv).rg;
  if (index == 1) return texture(grid1, uv).rg;
  if (index == 2) return texture(grid2, uv).rg;
  if (index == 3) return texture(grid3, uv).rg;
  if (index == 4) return texture(grid4, uv).rg;
  return texture(grid5, uv).rg;
}
vec2 overlayField(vec3 p) {
  if (gridCount == 0 || length(p) >= radii[gridCount - 1]) return vec2(0.0);
  float r = length(p);
  for (int i = 0; i < 6; i++) {
    if (i >= gridCount) break;
    if (r < radii[i]) {
      vec2 field = gridAt(i, p);
      if (i + 1 < gridCount) {
        float blend = smoothstep(radii[i] * (1.0 - 6.0 / gridSize), radii[i] * (1.0 - 2.0 / gridSize), r);
        field = mix(field, gridAt(i + 1, p), blend);
      }
      return max(field, vec2(0.0));
    }
  }
  return vec2(0.0);
}`;

const fragmentShader = `
precision highp float;
precision highp int;
in vec2 screenUV;
out vec4 outputColor;
uniform vec3 eye;
uniform mat3 basis;
uniform float aspect;
uniform float exposure;
uniform int steps;
uniform bool cutaway;
${orbitalFieldSamplingGLSL}
void main() {
  vec3 background = vec3(0.045, 0.060, 0.075);
  vec2 xy = (screenUV * 2.0 - 1.0) * vec2(aspect, 1.0) * 0.3639702343;
  vec3 direction = normalize(basis * vec3(xy, -1.0));
  vec4 cloud = vec4(0.0);
  float starts[6];
  float ends[6];
  float b = dot(eye, direction);
  for (int j = 0; j < 6; j++) {
    float disc = b*b-dot(eye,eye)+radii[j]*radii[j];
    starts[j] = disc > 0.0 ? max(0.0,-b-sqrt(max(0.0,disc))) : 1e6;
    ends[j] = disc > 0.0 ? -b+sqrt(max(0.0,disc)) : -1.0;
  }
  if (gridCount > 0) {
    float entry = starts[gridCount - 1];
    float exitPoint = ends[gridCount - 1];
    if (cutaway) entry = max(entry, -dot(eye,eye)/min(-1e-8,dot(direction,eye)));
    float t = entry;
    // A central ray uses at most (levelCount+1)*steps/2 samples.
    for (int i = 0; i < 384; i++) {
      if (t >= exitPoint || cloud.a > 0.995) break;
      float localRadius = radii[gridCount - 1];
      float boundary = exitPoint;
      bool found = false;
      for (int j = 0; j < 6; j++) {
        if (j >= gridCount) break;
        if (!found && t+1e-6 >= starts[j] && t+1e-6 < ends[j]) {
          localRadius = radii[j];
          found = true;
        }
        if (starts[j] > t+1e-6) boundary = min(boundary, starts[j]);
        if (ends[j] > t+1e-6) boundary = min(boundary, ends[j]);
      }
      float stepLength = max(1e-6,min(2.0*localRadius/float(steps),boundary-t));
      vec2 field = overlayField(eye+direction*(t+0.5*stepLength));
      float density = field.x+field.y;
      float alpha = 1.0-exp(-density*exposure*stepLength);
      vec3 colour = (field.x*vec3(1.0,0.19,0.35)+field.y*vec3(0.12,0.94,0.88))/max(density,1e-12);
      colour = mix(colour,vec3(1.0),min(0.32,density*exposure*0.02));
      cloud.rgb += (1.0-cloud.a)*alpha*colour;
      cloud.a += (1.0-cloud.a)*alpha;
      t += stepLength;
    }
  }
  outputColor = vec4(cloud.rgb+background*(1.0-cloud.a),1.0);
}`;

export function createOrbitalFieldTexture(grid) {
  const texture = new THREE.Data3DTexture(
    grid.data,
    grid.size,
    grid.size,
    grid.size,
  );
  texture.format = THREE.RGFormat;
  texture.type = THREE.HalfFloatType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.unpackAlignment = 1;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function resources() {
  const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const empty = createOrbitalFieldTexture({
    size: 1,
    data: new Uint16Array(2),
  });
  const uniforms = {
    eye: { value: new THREE.Vector3() },
    basis: { value: new THREE.Matrix3() },
    aspect: { value: 1 },
    exposure: { value: 1 },
    gridCount: { value: 0 },
    gridSize: { value: 64 },
    radii: { value: new Float32Array([1, 1, 1, 1, 1, 1]) },
    steps: { value: 96 },
    cutaway: { value: false },
  };
  for (let i = 0; i < 6; i++) uniforms[`grid${i}`] = { value: empty };
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms,
  });
  const scene = new THREE.Scene();
  const quad = new THREE.Mesh(geometry, material);
  quad.frustumCulled = false;
  scene.add(quad);
  const displayMaterial = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader: `in vec2 screenUV; out vec4 outputColor; uniform sampler2D cloud; uniform vec2 viewSize;
      void main() {
        vec2 corner = abs(screenUV-0.5)*viewSize-(viewSize*0.5-12.0);
        if (length(max(corner,0.0))>12.0) discard;
        outputColor = texture(cloud, screenUV);
      }`,
    uniforms: {
      cloud: { value: target.texture },
      viewSize: { value: new THREE.Vector2() },
    },
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  return {
    target,
    geometry,
    material,
    displayMaterial,
    scene,
    empty,
    camera: new THREE.PerspectiveCamera(40, 1, 0.0001, 200),
    viewport: new THREE.Vector4(),
    scissor: new THREE.Vector4(),
    clear: new THREE.Color(),
    direction: new THREE.Vector3(),
    renders: 0,
    key: "",
    failed: false,
    textures: [],
    field: null,
    fitRadius: 1,
    resetSerial: 0,
  };
}

/** Expensive texture ray marching runs only on changes; other frames blit. */
export default function OrbitalVolume({
  controller,
  surface,
  axes,
  field,
  onFailure,
}) {
  const cache = useMemo(resources, []);
  const currentField = useRef(field);
  currentField.current = field;
  const failure = useRef(onFailure);
  failure.current = onFailure;
  useEffect(
    () => () => {
      cache.target.dispose();
      cache.geometry.dispose();
      cache.material.dispose();
      cache.displayMaterial.dispose();
      cache.empty.dispose();
      cache.textures.forEach((texture) => texture.dispose());
    },
    [cache],
  );

  useFrame(({ gl, invalidate }) => {
    const c = controller.current;
    c.invalidate = invalidate;
    const next = currentField.current;
    if (!c.visible || cache.failed || !next || c.width < 1 || c.height < 1)
      return;
    if (cache.field !== next) {
      try {
        const textures = next.grids.map(createOrbitalFieldTexture);
        cache.textures.forEach((texture) => texture.dispose());
        cache.textures = textures;
        cache.field = next;
        // Fit the visible cloud, not its very faint finite-domain tails. The
        // same model-space fit radii also keep isolated ratio-mode cores usable.
        cache.fitRadius =
          Math.max(
            0,
            ...next.visibleSubshells.map((id) => {
              const model = ORBITAL_MODELS[id];
              const modelFit = Math.max(
                model.fitRadius,
                (outerShellFitFractions[model.n] || 0) * model.domainRadius,
              );
              return (
                modelFit /
                (next.sizeMode === "normalized"
                  ? model.domainRadius
                  : next.outerModelRadius)
              );
            }),
          ) || 0.5;
        const u = cache.material.uniforms;
        u.gridCount.value = textures.length;
        u.gridSize.value = next.grids[0]?.size || 64;
        u.exposure.value = next.globalExposure || 1;
        for (let i = 0; i < 6; i++) {
          u[`grid${i}`].value = textures[i] || cache.empty;
          u.radii.value[i] = next.grids[i]?.radius || 1;
        }
      } catch {
        cache.failed = true;
        queueMicrotask(() => failure.current());
        return;
      }
    }
    const aspect = c.width / c.height;
    const halfFov = Math.min(
      Math.PI / 9,
      Math.atan(Math.tan(Math.PI / 9) * aspect),
    );
    const fullDistance = 1.12 / Math.sin(halfFov);
    if (!c.pending && c.resetSerial !== cache.resetSerial) {
      cache.resetSerial = c.resetSerial;
      c.zoom = 1 / Math.max(cache.fitRadius, 0.005);
    }
    // A fixed central limit preserves core zoom when switching size modes.
    const minDistance = 0.004;
    const distance = Math.max(minDistance, fullDistance / c.zoom);
    c.zoom = fullDistance / distance;
    const resolution = c.coarse ? 1 : Math.min(gl.getPixelRatio(), 1.5);
    const width = Math.max(
      1,
      Math.round(Math.min(c.width * resolution, c.interacting ? 420 : 760)),
    );
    const height = Math.max(1, Math.round(width / aspect));
    const steps = c.interacting ? (c.coarse ? 48 : 64) : 96;
    const key = [
      next.generation,
      c.cutaway,
      c.yaw,
      c.pitch,
      distance,
      width,
      height,
      steps,
    ].join(":");
    if (cache.key === key) return;
    c.saveCamera?.({ yaw: c.yaw, pitch: c.pitch, zoom: c.zoom });
    const cam = cache.camera;
    cam.aspect = aspect;
    cam.position.set(
      distance * Math.cos(c.pitch) * Math.sin(c.yaw),
      distance * Math.sin(c.pitch),
      distance * Math.cos(c.pitch) * Math.cos(c.yaw),
    );
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();
    const u = cache.material.uniforms;
    u.eye.value.copy(cam.position);
    u.basis.value.setFromMatrix4(cam.matrixWorld);
    u.aspect.value = aspect;
    u.steps.value = steps;
    u.cutaway.value = c.cutaway;
    cache.displayMaterial.uniforms.viewSize.value.set(c.width, c.height);
    const oldTarget = gl.getRenderTarget();
    gl.getViewport(cache.viewport);
    gl.getScissor(cache.scissor);
    const oldScissor = gl.getScissorTest();
    gl.getClearColor(cache.clear);
    const oldAlpha = gl.getClearAlpha(),
      oldAutoClear = gl.autoClear;
    const oldShaderError = gl.debug.onShaderError,
      begin = performance.now();
    try {
      gl.debug.onShaderError = () => {
        throw new Error("Orbital shader unavailable");
      };
      cache.target.setSize(width, height);
      gl.setRenderTarget(cache.target);
      gl.setScissorTest(false);
      gl.autoClear = true;
      gl.render(cache.scene, cam);
      cache.renders++;
      cache.key = key;
    } catch {
      cache.failed = true;
      queueMicrotask(() => failure.current());
    } finally {
      gl.debug.onShaderError = oldShaderError;
      gl.setRenderTarget(oldTarget);
      gl.setViewport(cache.viewport);
      gl.setScissor(cache.scissor);
      gl.setScissorTest(oldScissor);
      gl.setClearColor(cache.clear, oldAlpha);
      gl.autoClear = oldAutoClear;
    }
    if (surface.current)
      surface.current.dataset.orbitalState = JSON.stringify({
        visibleSubshells: next.visibleSubshells,
        orientations: next.orientations,
        sizeMode: next.sizeMode,
        pending: c.pending,
        cutaway: c.cutaway,
        yaw: c.yaw,
        pitch: c.pitch,
        zoom: c.zoom,
        distance,
        fieldGeneration: next.generation,
        fieldGenerationMs: next.generationMs,
        gridRadii: next.grids.map((grid) => grid.radius),
        fieldBytes: next.grids.reduce(
          (sum, grid) => sum + grid.data.byteLength,
          0,
        ),
        visibleRadius: next.visibleRadius,
        fitRadius: cache.fitRadius,
        renders: cache.renders,
        steps,
        width,
        height,
        renderSubmissionMs: performance.now() - begin,
        textures: gl.info.memory.textures,
        geometries: gl.info.memory.geometries,
      });
    axes.current?.querySelectorAll("g[data-axis]").forEach((group, index) => {
      cache.direction.set(
        index === 0 ? 1 : 0,
        index === 1 ? 1 : 0,
        index === 2 ? 1 : 0,
      );
      cache.direction.transformDirection(cam.matrixWorldInverse);
      group
        .querySelector("line")
        .setAttribute("x2", 42 + cache.direction.x * 25);
      group
        .querySelector("line")
        .setAttribute("y2", 42 - cache.direction.y * 25);
      group
        .querySelector("text")
        .setAttribute("x", 42 + cache.direction.x * 33);
      group
        .querySelector("text")
        .setAttribute("y", 46 - cache.direction.y * 33);
    });
  }, -0.5);
  return (
    <mesh
      geometry={cache.geometry}
      material={cache.displayMaterial}
      frustumCulled={false}
      dispose={null}
    />
  );
}
