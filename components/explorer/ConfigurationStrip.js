import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronsLeftRight,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  configurationGroups,
  configurationPageStarts,
} from "../../data/electron-configuration.mjs";
import { useExplorer } from "./ExplorerProvider";
import styles from "./ConfigurationStrip.module.css";

export default function ConfigurationStrip({
  model,
  mode,
  expanded,
  onExpandedChange,
  visibleSubshells,
  onToggleSubshell,
  onToggleCore,
  onShowAll,
  onHideAll,
  orientations,
  onOrientationChange,
  onHighlightShells,
  page,
  onPageChange,
}) {
  const { reducedMotion } = useExplorer();
  const id = useId();
  const holder = useRef();
  const scroller = useRef();
  const track = useRef();
  const configurationHeading = useRef();
  const [headingHeight, setHeadingHeight] = useState(28);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setHeadingHeight(Math.ceil(entry.target.getBoundingClientRect().height)),
    );
    observer.observe(configurationHeading.current);
    return () => observer.disconnect();
  }, []);
  const touchGesture = useRef(null);
  const pageRef = useRef(page);
  const requestedPage = useRef(null);
  pageRef.current = page;
  const [pages, setPages] = useState([0]);
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const [touched, setTouched] = useState(null);
  const groups = useMemo(
    () => configurationGroups(model, expanded),
    [model, expanded],
  );
  const preview = mode === "shell" ? hovered || focused || touched : null;
  const visible = new Set(visibleSubshells);
  const coreVisible =
    model.core?.ids.filter((entry) => visible.has(entry)).length || 0;
  const allCoreVisible = coreVisible === model.core?.ids.length;
  const first = model.entries[0]?.id;

  useEffect(() => {
    onHighlightShells(
      groups.find((group) => group.id === preview)?.shells || [],
    );
  }, [preview, groups, onHighlightShells]);

  useEffect(() => {
    setHovered(null);
    setFocused(null);
    setTouched(null);
  }, [mode, expanded]);

  useEffect(() => {
    if (!touched) return;
    const dismiss = (event) => {
      if (!holder.current?.contains(event.target)) setTouched(null);
    };
    const escape = (event) => {
      if (event.key === "Escape") setTouched(null);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [touched]);

  useEffect(() => {
    const viewport = scroller.current;
    const line = track.current;
    let frame;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const origin = line.getBoundingClientRect().left;
        const starts = [...line.querySelectorAll("[data-config-group]")].map(
          (group) => group.getBoundingClientRect().left - origin,
        );
        const next = configurationPageStarts(
          starts,
          viewport.clientWidth,
          viewport.scrollWidth,
        );
        setPages((previous) =>
          previous.length === next.length &&
          previous.every((value, index) => Math.abs(value - next[index]) < 1)
            ? previous
            : next,
        );
        const index = Math.min(
          requestedPage.current ?? pageRef.current,
          next.length - 1,
        );
        requestedPage.current = null;
        pageRef.current = index;
        onPageChange(index);
        viewport.scrollTo({ left: next[index], behavior: "auto" });
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(line);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [groups, mode, onPageChange]);

  const goTo = (index) => {
    const next = Math.max(0, Math.min(index, pages.length - 1));
    requestedPage.current = next;
    pageRef.current = next;
    onPageChange(next);
    scroller.current.scrollTo({
      left: pages[next],
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };
  const onScroll = () => {
    const left = scroller.current.scrollLeft;
    // Keep the chosen page stable during smooth travel. ResizeObserver may
    // remeasure the track before the animation reaches its destination.
    if (requestedPage.current !== null) {
      if (Math.abs(pages[requestedPage.current] - left) > 1) return;
      requestedPage.current = null;
    }
    const nearest = pages.reduce(
      (best, value, index) =>
        Math.abs(value - left) < Math.abs(pages[best] - left) ? index : best,
      0,
    );
    if (nearest !== pageRef.current) {
      pageRef.current = nearest;
      onPageChange(nearest);
    }
  };
  const interruptPaging = () => {
    requestedPage.current = null;
  };
  const disclosure = () => {
    requestedPage.current = null;
    pageRef.current = 0;
    onPageChange(0);
    onExpandedChange(!expanded);
  };
  const shellTotal = (group) =>
    model.entries
      .filter((entry) => entry.n === group.shells[0] + 1)
      .reduce((total, entry) => total + entry.electrons, 0);
  const shellLabel = (group) => {
    if (group.id === "core")
      return `${group.count} core electrons across ${group.shells.length} ${group.shells.length === 1 ? "shell" : "shells"}`;
    const total = shellTotal(group);
    return group.count < total
      ? `${group.count} of ${total} electrons in shell ${group.shells[0] + 1}, ${group.entries.map((entry) => entry.id).join(" and ")} contribution`
      : `${group.count} electrons in shell ${group.shells[0] + 1}`;
  };
  const previewGroup = groups.find((group) => group.id === preview);
  const partialShell =
    previewGroup &&
    previewGroup.id !== "core" &&
    previewGroup.count < shellTotal(previewGroup);
  const coreNote =
    model.core && !expanded && model.core.shells.length > 1
      ? partialShell
        ? `${previewGroup.entries.map((entry) => entry.id).join(" and ")} contributes ${previewGroup.count} of shell ${previewGroup.shells[0] + 1}’s ${shellTotal(previewGroup)} electrons.`
        : `${model.core.electrons} is the [${model.core.symbol}] core total across ${["zero", "one", "two", "three", "four", "five", "six", "seven"][model.core.shells.length]} shells.`
      : null;

  return (
    <div
      ref={holder}
      className={styles.strip}
      data-testid="configuration-strip"
      data-expanded={expanded}
      data-mode={mode}
      style={{ "--heading-height": `${headingHeight}px` }}
    >
      <div className={styles.headingRow}>
        <span id={`${id}-counts`} className={styles.heading}>
          Electrons by shell
        </span>
        {pages.length > 1 && (
          <div className={styles.pagination} aria-label="Configuration pages">
            <button
              type="button"
              aria-label="Previous configuration page"
              disabled={page === 0}
              onClick={() => goTo(page - 1)}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <div className={styles.dots}>
              {pages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Configuration page ${index + 1} of ${pages.length}`}
                  aria-current={page === index ? "page" : undefined}
                  onClick={() => goTo(index)}
                >
                  <span />
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Next configuration page"
              disabled={page >= pages.length - 1}
              onClick={() => goTo(page + 1)}
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <div
        ref={scroller}
        className={styles.scroller}
        data-testid="configuration-scroll"
        onScroll={onScroll}
        onPointerDownCapture={interruptPaging}
        onWheelCapture={interruptPaging}
        onFocusCapture={interruptPaging}
      >
        <div ref={track} className={styles.track}>
          {groups.map((group, index) => (
            <div
              key={`count-${group.id}`}
              className={styles.countGroup}
              style={{ gridColumn: index + 1 }}
              data-highlighted={preview === group.id}
            >
              <div className={styles.countRow}>
                {mode === "shell" ? (
                  <button
                    type="button"
                    className={styles.count}
                    data-group-id={group.id}
                    data-count={group.count}
                    aria-label={shellLabel(group)}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "touch") setHovered(group.id);
                    }}
                    onPointerLeave={() => setHovered(null)}
                    onPointerDown={(event) => {
                      if (event.pointerType !== "touch") return;
                      setFocused(null);
                      touchGesture.current = {
                        id: event.pointerId,
                        group: group.id,
                        x: event.clientX,
                        y: event.clientY,
                        moved: false,
                      };
                    }}
                    onPointerMove={(event) => {
                      const gesture = touchGesture.current;
                      if (
                        gesture?.id === event.pointerId &&
                        Math.hypot(
                          event.clientX - gesture.x,
                          event.clientY - gesture.y,
                        ) > 8
                      )
                        gesture.moved = true;
                    }}
                    onPointerCancel={() => {
                      touchGesture.current = null;
                    }}
                    onFocus={(event) => {
                      if (
                        !touchGesture.current &&
                        event.currentTarget.matches(":focus-visible")
                      )
                        setFocused(group.id);
                    }}
                    onBlur={() => setFocused(null)}
                    onPointerUp={(event) => {
                      const gesture = touchGesture.current;
                      touchGesture.current = null;
                      if (
                        event.pointerType === "touch" &&
                        gesture?.id === event.pointerId &&
                        gesture.group === group.id &&
                        !gesture.moved &&
                        Math.hypot(
                          event.clientX - gesture.x,
                          event.clientY - gesture.y,
                        ) <= 8
                      )
                        setTouched((current) =>
                          current === group.id ? null : group.id,
                        );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setTouched(null);
                        setFocused(null);
                        event.currentTarget.blur();
                      }
                    }}
                  >
                    {group.count}
                  </button>
                ) : (
                  <span
                    className={`${styles.count} ${styles.passiveCount}`}
                    data-group-id={group.id}
                    data-count={group.count}
                    aria-label={shellLabel(group)}
                  >
                    {group.count}
                  </span>
                )}
              </div>
            </div>
          ))}
          <div
            ref={configurationHeading}
            className={styles.configurationHeading}
          >
            <span id={`${id}-configuration`} className={styles.heading}>
              Electron configuration
            </span>
            {mode === "orbitals" && (
              <div
                className={styles.visibilityToggle}
                role="group"
                aria-label="Orbital visibility"
              >
                <button
                  type="button"
                  aria-pressed={
                    visibleSubshells.length === model.entries.length
                  }
                  onClick={onShowAll}
                >
                  <Eye aria-hidden="true" />
                  Show all
                </button>
                <button
                  type="button"
                  aria-pressed={visibleSubshells.length === 0}
                  onClick={onHideAll}
                >
                  <EyeOff aria-hidden="true" />
                  Hide all
                </button>
              </div>
            )}
          </div>
          {groups.map((group, index) => (
            <div
              key={group.id}
              className={styles.group}
              style={{ gridColumn: index + 1 }}
              data-config-group
              data-group-id={group.id}
              data-highlighted={preview === group.id}
            >
              <div className={styles.entries}>
                {group.entries.map((entry) => {
                  const core = Boolean(entry.core);
                  const collapse =
                    !core && expanded && model.core && entry.id === first;
                  const active = core ? coreVisible > 0 : visible.has(entry.id);
                  const mixed = core && coreVisible > 0 && !allCoreVisible;
                  const label = core
                    ? `[${entry.symbol}]`
                    : `${entry.id}${entry.electrons}`;
                  const content = (
                    <>
                      <span className={styles.chipLabel}>
                        {core ? (
                          `[${entry.symbol}]`
                        ) : (
                          <>
                            {entry.id}
                            <sup>{entry.electrons}</sup>
                          </>
                        )}
                      </span>
                      {core ? (
                        <ChevronsLeftRight
                          className={styles.disclosureIcon}
                          aria-hidden="true"
                        />
                      ) : collapse ? (
                        <span
                          className={styles.collapseGlyph}
                          aria-hidden="true"
                        >
                          &gt; [{model.core.symbol}] &lt;
                        </span>
                      ) : null}
                    </>
                  );
                  return (
                    <div
                      key={entry.id}
                      className={styles.entry}
                      data-subshell-id={entry.id}
                      data-visible={active}
                      data-mixed={mixed}
                      data-orbital-type={entry.l === 1 ? "p" : "other"}
                    >
                      {core || collapse ? (
                        <button
                          type="button"
                          className={styles.chip}
                          data-testid="core-toggle"
                          aria-label={
                            core
                              ? `Expand [${entry.symbol}] core configuration`
                              : `Collapse to [${model.core.symbol}] core configuration`
                          }
                          aria-expanded={expanded}
                          onClick={disclosure}
                        >
                          {content}
                        </button>
                      ) : mode === "orbitals" ? (
                        <button
                          type="button"
                          className={styles.chip}
                          data-testid={`visibility-${entry.id}`}
                          aria-label={`${entry.id} orbital visibility`}
                          aria-pressed={active}
                          onClick={() => onToggleSubshell(entry.id)}
                        >
                          {content}
                          {active ? (
                            <Eye
                              className={styles.inlineEye}
                              aria-hidden="true"
                            />
                          ) : (
                            <EyeOff
                              className={styles.inlineEye}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      ) : (
                        <span
                          className={`${styles.chip} ${styles.passiveChip}`}
                          aria-label={label}
                        >
                          {content}
                        </span>
                      )}
                      {mode === "orbitals" && (
                        <>
                          {(core || collapse) && (
                            <button
                              type="button"
                              className={styles.eye}
                              data-testid={`visibility-${entry.id}`}
                              aria-label={
                                core
                                  ? `[${entry.symbol}] core orbital visibility`
                                  : `${entry.id} orbital visibility`
                              }
                              aria-pressed={mixed ? "mixed" : active}
                              title={
                                core
                                  ? allCoreVisible
                                    ? "Hide core orbitals"
                                    : "Show all core orbitals"
                                  : active
                                    ? `Hide ${entry.id}`
                                    : `Show ${entry.id}`
                              }
                              onClick={() =>
                                core
                                  ? onToggleCore()
                                  : onToggleSubshell(entry.id)
                              }
                            >
                              {active ? (
                                <Eye aria-hidden="true" />
                              ) : (
                                <EyeOff aria-hidden="true" />
                              )}
                            </button>
                          )}
                          {entry.l === 1 && (
                            <div className={styles.axisRow}>
                              {entry.l === 1 && (
                                <div
                                  role="group"
                                  aria-label={`${entry.id} orbital orientation`}
                                  className={styles.axes}
                                >
                                  {["x", "y", "z"].map((axis) => (
                                    <button
                                      key={axis}
                                      type="button"
                                      aria-label={`${entry.id} ${axis} orbital`}
                                      aria-pressed={
                                        orientations[entry.id] === axis
                                      }
                                      onClick={() =>
                                        onOrientationChange(entry.id, axis)
                                      }
                                    >
                                      {axis.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {coreNote && <p className={styles.coreExplanation}>{coreNote}</p>}
    </div>
  );
}
