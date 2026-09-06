import { Component, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useExplorer } from "./ExplorerProvider";

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function SceneCanvas({ eventSource }) {
  const { webglFailed, setWebglFailed, sceneActive } = useExplorer();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready || webglFailed) return null;
  return (
    <SceneBoundary onFailure={() => setWebglFailed(true)}>
      <Canvas
        frameloop={sceneActive ? "always" : "demand"}
        eventSource={eventSource}
        eventPrefix="client"
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 4,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            setWebglFailed(true);
          });
        }}
        fallback={
          <span>
            3D rendering is unavailable. Element content remains available
            below.
          </span>
        }
      >
        <ClearFrame />
        <View.Port />
      </Canvas>
    </SceneBoundary>
  );
}
function ClearFrame() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false);
    gl.setClearColor("#ffffff", 0);
    gl.clear(true, true, true);
  }, -1);
  return null;
}
