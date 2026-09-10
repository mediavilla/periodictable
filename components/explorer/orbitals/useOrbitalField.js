import { useEffect, useRef, useState } from "react";

/** One current field and one worker job; rapid requests keep only the latest. */
export default function useOrbitalField({
  preset,
  visibleSubshells,
  orientations,
  sizeMode,
  active,
  onFailure,
}) {
  const [result, setResult] = useState({ field: null, loading: false });
  const worker = useRef(null);
  const running = useRef(null);
  const generation = useRef(0);
  const accepted = useRef("");
  const latest = useRef(null);
  const scheduler = useRef(null);
  const failure = useRef(onFailure);
  failure.current = onFailure;
  const subshells = preset.subshells
    .filter(({ id }) => visibleSubshells.includes(id))
    .map(({ id }) => ({ id, orientation: orientations[id] || "z" }));
  const key = JSON.stringify([preset.number, subshells, sizeMode]);
  latest.current = {
    key,
    active,
    options: {
      subshells,
      allSubshells: preset.subshells,
      sizeMode,
      resolution: 64,
    },
  };

  useEffect(() => {
    let mounted = true;
    const stop = () => {
      worker.current?.terminate();
      worker.current = null;
      running.current = null;
    };
    const fail = () => {
      stop();
      if (mounted) {
        setResult((previous) => ({ ...previous, loading: false }));
        failure.current();
      }
    };
    const dispatch = () => {
      const request = latest.current;
      if (
        !mounted ||
        !request.active ||
        running.current ||
        accepted.current === request.key
      )
        return;
      try {
        if (!worker.current) {
          worker.current = new Worker(
            new URL("./orbitalField.worker.js", import.meta.url),
            { type: "module" },
          );
          worker.current.onerror = fail;
          worker.current.onmessage = ({ data }) => {
            const job = running.current;
            if (!mounted || !job || data.generation !== job.generation) return;
            running.current = null;
            if (job.key !== latest.current.key) {
              dispatch();
              return;
            }
            if (data.error || !data.field) {
              fail();
              return;
            }
            accepted.current = job.key;
            setResult({
              loading: false,
              field: {
                ...data.field,
                generation: job.generation,
                key: job.key,
                sizeMode: job.options.sizeMode,
                visibleSubshells: job.options.subshells.map(({ id }) => id),
                orientations: Object.fromEntries(
                  job.options.subshells.map(({ id, orientation }) => [
                    id,
                    orientation,
                  ]),
                ),
              },
            });
            dispatch();
          };
        }
        const job = { ...request, generation: ++generation.current };
        running.current = job;
        setResult((previous) => ({ ...previous, loading: true }));
        worker.current.postMessage({
          generation: job.generation,
          ...job.options,
        });
      } catch {
        fail();
      }
    };
    // The scheduler itself is stable; this method is called when React inputs
    // change, never from the animation loop.
    scheduler.current = { schedule: dispatch, stop };
    dispatch();
    return () => {
      mounted = false;
      stop();
    };
  }, []);

  useEffect(() => {
    if (!active || accepted.current === key) {
      scheduler.current?.stop();
      setResult((previous) =>
        previous.loading ? { ...previous, loading: false } : previous,
      );
    } else {
      scheduler.current?.schedule();
    }
  }, [key, active]);

  return {
    ...result,
    loading: active && (result.loading || result.field?.key !== key),
    requestedKey: key,
  };
}
