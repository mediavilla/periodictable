import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { View, OrthographicCamera } from "@react-three/drei";
import BohrModel from "./BohrModel";
import { useExplorer } from "./ExplorerProvider";
import { categoryColor } from "../../data/table-registry";

export function BohrViewport({ element, illustration = false }) {
  const { reducedMotion, webglFailed, registerViewport } = useExplorer();
  const id = useId();
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const holder = useRef();
  useEffect(() => {
    registerViewport(id, visible);
    return () => registerViewport(id, false);
  }, [id, visible, registerViewport]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (holder.current) observer.observe(holder.current);
    return () => observer.disconnect();
  }, []);
  const radius = 1 + (element.shells.length - 1) * 0.63;
  return (
    <div ref={holder} style={{ position: "relative" }}>
      <div
        role="img"
        aria-label={`${element.name}: ${element.shells.join(", ")} electrons in successive shells`}
      >
        {!webglFailed ? (
          <View
            visible={visible}
            style={{
              height: illustration ? 160 : 280,
              width: "100%",
              position: "relative",
            }}
          >
            <OrthographicCamera
              makeDefault
              position={[0, 0, 20]}
              zoom={(illustration ? 65 : 118) / radius}
            />
            <BohrModel
              element={element}
              color={illustration ? "#333333" : categoryColor(element.category)}
              paused={paused || reducedMotion || !visible}
            />
          </View>
        ) : (
          <div style={{ padding: 40, fontSize: 24 }}>
            {element.symbol} · {element.shells.join(" / ")}
          </div>
        )}
      </div>
      {!illustration && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          disabled={reducedMotion}
          style={{ position: "relative", zIndex: 3 }}
        >
          {paused || reducedMotion ? (
            <Play aria-hidden="true" />
          ) : (
            <Pause aria-hidden="true" />
          )}
          {reducedMotion
            ? "Orbit paused · reduced motion"
            : paused
              ? "Resume orbit"
              : "Pause orbit"}
        </button>
      )}
    </div>
  );
}
export default BohrViewport;
