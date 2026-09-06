import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/router";
import elements from "../../public/elements.json";
import { findElement, tableById } from "../../data/table-registry";

const Context = createContext(null);
export const useExplorer = () => useContext(Context);
export function ExplorerProvider({ children }) {
  const router = useRouter();
  const design = tableById(router.query.design);
  const detailElement = findElement(router.query.element);
  const isTableRoute =
    router.pathname === "/" || router.pathname === "/timeline";
  const panel = !isTableRoute
    ? null
    : router.query.panel === "history"
      ? "history"
      : detailElement
        ? "element"
        : null;
  const [selected, setSelected] = useState(elements[0]);
  const [hovered, setHovered] = useState(null);
  const [command, setCommand] = useState({ type: "reset", serial: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [viewports, setViewports] = useState({});
  const returnFocus = useRef(null);
  const wasPanel = useRef(false);
  useEffect(() => {
    if (wasPanel.current && !panel) {
      const target = returnFocus.current?.isConnected
        ? returnFocus.current
        : document.querySelector(".explorerSelection button");
      target?.focus({ preventScroll: true });
    }
    wasPanel.current = !!panel;
  }, [panel]);
  const registerViewport = useCallback(
    (id, visible) =>
      setViewports((previous) =>
        previous[id] === visible ? previous : { ...previous, [id]: visible },
      ),
    [],
  );
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (detailElement) setSelected(detailElement);
    setHovered(null);
  }, [detailElement, design.id]);
  const navigate = (changes) => {
    const query = { ...router.query, ...changes };
    Object.keys(query).forEach((k) => {
      if (query[k] == null) delete query[k];
    });
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
      scroll: false,
    });
  };
  const value = {
    design,
    selected,
    setSelected,
    hovered,
    setHovered,
    active: panel ? detailElement || selected : hovered || selected,
    panel,
    detailElement,
    reducedMotion,
    webglFailed,
    setWebglFailed,
    command,
    registerViewport,
    sceneActive: Object.values(viewports).some(Boolean),
    issue: (type) => setCommand((c) => ({ type, serial: c.serial + 1 })),
    changeDesign: (id) => navigate({ design: id === "18" ? null : id }),
    openElement: (element) => {
      if (!panel) returnFocus.current = document.activeElement;
      setSelected(element);
      setHovered(null);
      navigate({ element: element.name.toLowerCase(), panel: null });
    },
    openHistory: () => {
      if (!panel) returnFocus.current = document.activeElement;
      navigate({ panel: "history", element: null });
    },
    closePanel: () => navigate({ panel: null, element: null }),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
