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
import { findElement, findSlot, tableById } from "../../data/table-registry";
import { designForRoute } from "../../data/model-slots.mjs";

const Context = createContext(null);
export const useExplorer = () => useContext(Context);
export function ExplorerProvider({ children }) {
  const router = useRouter();
  const remembered = useRef({ "/": "18", "/timeline": "18" });
  const design = tableById(
    designForRoute(router.query.design, router.pathname),
  );
  const detailElement = findElement(router.query.element);
  const detailSlot = findSlot(design.id, router.query.slot);
  const isTableRoute =
    router.pathname === "/" || router.pathname === "/timeline";
  const panel = !isTableRoute
    ? null
    : router.query.panel === "history"
      ? "history"
      : detailElement
        ? "element"
        : detailSlot && router.query.panel === "entry"
          ? "entry"
          : null;
  const [selected, setSelectedElement] = useState(elements[0]);
  const [hovered, setHoveredElement] = useState(null);
  const [selectedSlotKey, setSelectedSlot] = useState(null);
  const [hoveredSlotKey, setHoveredSlot] = useState(null);
  const setSelected = useCallback((element) => {
    setSelectedElement(element);
    setSelectedSlot(null);
  }, []);
  const setHovered = useCallback((element) => {
    setHoveredElement(element);
    setHoveredSlot(null);
  }, []);
  const slotFromKey = (key) =>
    key?.design === design.id ? findSlot(design.id, key.id) : null;
  const activeSlot =
    detailSlot ||
    slotFromKey(hoveredSlotKey) ||
    (!hovered && slotFromKey(selectedSlotKey));
  const [command, setCommand] = useState({ type: "reset", serial: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [viewports, setViewports] = useState({});
  const returnFocus = useRef(null);
  const wasPanel = useRef(false);
  useEffect(() => {
    if (isTableRoute) remembered.current[router.pathname] = design.id;
  }, [design.id, isTableRoute, router.pathname]);
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
    if (detailElement) setSelectedElement(detailElement);
    if (detailSlot) setSelectedSlot({ design: design.id, id: detailSlot.id });
    setHovered(null);
  }, [detailElement, detailSlot, design.id, setHovered]);
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
    activeSlot,
    detailSlot,
    hoverSlot: (slot) => {
      setHoveredElement(slot?.number ? elements[slot.number - 1] : null);
      setHoveredSlot(slot ? { design: design.id, id: slot.id } : null);
    },
    selectSlot: (slot) => {
      if (slot.number) setSelectedElement(elements[slot.number - 1]);
      setHovered(null);
      setSelectedSlot({ design: design.id, id: slot.id });
    },
    panel,
    detailElement,
    reducedMotion,
    webglFailed,
    setWebglFailed,
    command,
    registerViewport,
    sceneActive: Object.values(viewports).some(Boolean),
    issue: (type) => setCommand((c) => ({ type, serial: c.serial + 1 })),
    destinationHref: (pathname) => {
      if (pathname === "/elements") return pathname;
      const id = designForRoute(
        isTableRoute ? design.id : null,
        pathname,
        remembered.current[pathname],
      );
      return id === "18" ? pathname : { pathname, query: { design: id } };
    },
    changeDesign: (id) => {
      if (id === design.id) return;
      navigate({
        design: id === "18" ? null : id,
        slot: null,
        ...(panel === "entry" ? { panel: null } : {}),
      });
    },
    openElement: (element) => {
      if (!panel) returnFocus.current = document.activeElement;
      setSelected(element);
      setHovered(null);
      navigate({
        element: element.name.toLowerCase(),
        panel: null,
        slot: null,
      });
    },
    openSlot: (slot) => {
      if (!panel) returnFocus.current = document.activeElement;
      if (slot.number) setSelectedElement(elements[slot.number - 1]);
      setHovered(null);
      setSelectedSlot({ design: design.id, id: slot.id });
      navigate({
        element: slot.number
          ? elements[slot.number - 1].name.toLowerCase()
          : null,
        slot: slot.id,
        panel: slot.number ? null : "entry",
      });
    },
    openHistory: () => {
      if (!panel) returnFocus.current = document.activeElement;
      navigate({ panel: "history", element: null, slot: null });
    },
    closePanel: () => navigate({ panel: null, element: null, slot: null }),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
