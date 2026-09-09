import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ORBITAL_MODELS } from "./orbitalMath.mjs";

const vertexShader = `
varying vec2 screenUV;
void main() {
  screenUV = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// Normalized hydrogenic wavefunctions, Z=1 and distances in Bohr radii.
// The renderer's exposure and camera fit never change this probability field.
export const orbitalFunctionsGLSL = `
float wavefunction(vec3 p, int orbital, int axis) {
  float r = length(p);
  if (orbital == 0) return exp(-r) / sqrt(3.141592653589793);
  if (orbital == 1) return (2.0-r)*exp(-r*0.5)/sqrt(32.0*3.141592653589793);
  float coordinate = axis == 0 ? p.x : (axis == 1 ? p.y : p.z);
  return coordinate*exp(-r*0.5)/sqrt(32.0*3.141592653589793);
}`;

const fragmentShader = `
precision highp float;
varying vec2 screenUV;
uniform vec3 eye;
uniform mat3 basis;
uniform float aspect;
uniform float radius;
uniform float exposure;
uniform int orbital;
uniform int axis;
uniform int steps;
uniform bool cutaway;
${orbitalFunctionsGLSL}
void main() {
  vec3 background = vec3(0.045, 0.060, 0.075);
  vec2 xy = (screenUV*2.0-1.0)*vec2(aspect, 1.0)*0.3639702343;
  vec3 direction = normalize(basis*vec3(xy, -1.0));
  float b = dot(eye,direction);
  float discriminant = b*b-dot(eye,eye)+radius*radius;
  vec4 cloud = vec4(0.0);
  if (discriminant > 0.0) {
    float entry = max(0.0,-b-sqrt(discriminant));
    float exitPoint = -b+sqrt(discriminant);
    if (cutaway) entry = max(entry,-dot(eye,eye)/dot(direction,eye));
    if (exitPoint <= entry) { gl_FragColor = vec4(background,1.0); return; }
    float stepLength = (exitPoint-entry)/float(steps);
    for (int i=0; i<112; i++) {
      if (i >= steps) break;
      vec3 p = eye+direction*(entry+(float(i)+0.5)*stepLength);
      float psi = wavefunction(p,orbital,axis);
      float density = psi*psi;
      float alpha = 1.0-exp(-density*exposure*stepLength);
      vec3 colour = psi >= 0.0 ? vec3(1.0,0.19,0.35) : vec3(0.12,0.94,0.88);
      // A modest highlight exposes the dense interior without a bloom pass.
      colour = mix(colour, vec3(1.0), min(0.48,density*exposure*0.055));
      cloud.rgb += (1.0-cloud.a)*alpha*colour;
      cloud.a += (1.0-cloud.a)*alpha;
      if (cloud.a > 0.995) break;
    }
  }
  gl_FragColor = vec4(cloud.rgb+background*(1.0-cloud.a),1.0);
}`;

function resources() {
  const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      eye: { value: new THREE.Vector3() },
      basis: { value: new THREE.Matrix3() },
      aspect: { value: 1 },
      radius: { value: 6 },
      exposure: { value: 12 },
      orbital: { value: 0 },
      axis: { value: 2 },
      steps: { value: 80 },
      cutaway: { value: false },
    },
  });
  const scene = new THREE.Scene();
  const quad = new THREE.Mesh(geometry, material);
  quad.frustumCulled = false;
  scene.add(quad);
  const displayMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader: `varying vec2 screenUV; uniform sampler2D cloud; uniform vec2 viewSize;
      void main() {
        vec2 corner = abs(screenUV-0.5)*viewSize-(viewSize*0.5-12.0);
        if (length(max(corner,0.0))>12.0) discard;
        gl_FragColor = texture2D(cloud, screenUV);
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
    camera: new THREE.PerspectiveCamera(40, 1, 0.1, 200),
    viewport: new THREE.Vector4(),
    scissor: new THREE.Vector4(),
    clear: new THREE.Color(),
    direction: new THREE.Vector3(),
    renders: 0,
    key: "",
    failed: false,
  };
}

/** Expensive ray marching runs only on changes. Every other View frame blits. */
export default function OrbitalVolume({
  controller,
  surface,
  axes,
  onFailure,
}) {
  const cache = useMemo(resources, []);
  const failure = useRef(onFailure);
  failure.current = onFailure;
  useEffect(
    () => () => {
      cache.target.dispose();
      cache.geometry.dispose();
      cache.material.dispose();
      cache.displayMaterial.dispose();
    },
    [cache],
  );

  useFrame(({ gl, invalidate }) => {
    const c = controller.current;
    c.invalidate = invalidate;
    if (!c.visible || cache.failed || c.width < 1 || c.height < 1) return;
    const model = ORBITAL_MODELS[c.orbital];
    const aspect = c.width / c.height;
    const halfFov = Math.min(
      Math.PI / 9,
      Math.atan(Math.tan(Math.PI / 9) * aspect),
    );
    const maxDistance = Math.max(
      model.domainRadius * 1.15,
      (model.fitRadius / Math.sin(halfFov)) * 1.12,
    );
    const distance = Math.max(model.domainRadius * 1.025, maxDistance / c.zoom);
    c.zoom = maxDistance / distance;
    const interacting = c.interacting;
    const resolution = c.coarse ? 1 : Math.min(gl.getPixelRatio(), 1.5);
    const width = Math.max(
      1,
      Math.round(Math.min(c.width * resolution, interacting ? 420 : 760)),
    );
    const height = Math.max(1, Math.round(width / aspect));
    const steps = interacting ? (c.coarse ? 48 : 64) : 96;
    const key = [
      c.orbital,
      c.axis,
      c.cutaway,
      c.yaw,
      c.pitch,
      distance,
      width,
      height,
      steps,
    ].join(":");
    if (cache.key === key) return;
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
    u.radius.value = model.domainRadius;
    u.exposure.value = model.exposure;
    u.orbital.value = model.shaderIndex;
    u.axis.value = { x: 0, y: 1, z: 2 }[c.axis];
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
    const oldShaderError = gl.debug.onShaderError;
    const begin = performance.now();
    try {
      gl.debug.onShaderError = () => {
        throw new Error("Orbital shader unavailable");
      };
      cache.target.setSize(width, height);
      gl.setRenderTarget(cache.target);
      // setRenderTarget uses its physical-pixel viewport. setViewport here
      // would multiply by the canvas DPR and crop the image on Retina screens.
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
    if (surface.current) {
      surface.current.dataset.orbitalState = JSON.stringify({
        orbital: c.orbital,
        axis: c.axis,
        cutaway: c.cutaway,
        yaw: c.yaw,
        pitch: c.pitch,
        zoom: c.zoom,
        renders: cache.renders,
        steps,
        width,
        height,
        renderSubmissionMs: performance.now() - begin,
        textures: gl.info.memory.textures,
        geometries: gl.info.memory.geometries,
      });
    }
    // Project the model axes into a small HTML legend; no React frame updates.
    axes.current?.querySelectorAll("g[data-axis]").forEach((group, index) => {
      cache.direction.set(
        index === 0 ? 1 : 0,
        index === 1 ? 1 : 0,
        index === 2 ? 1 : 0,
      );
      cache.direction.transformDirection(cam.matrixWorldInverse);
      const x = 42 + cache.direction.x * 25,
        y = 42 - cache.direction.y * 25;
      const line = group.querySelector("line"),
        label = group.querySelector("text");
      line.setAttribute("x2", x);
      line.setAttribute("y2", y);
      label.setAttribute("x", 42 + cache.direction.x * 33);
      label.setAttribute("y", 46 - cache.direction.y * 33);
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
