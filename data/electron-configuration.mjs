const SUPERSCRIPT_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

export function configurationSuperscripts(configuration = "") {
  return configuration.replace(
    /(\d[spdf])(\d+)/g,
    (_, orbital, occupation) =>
      orbital +
      [...occupation]
        .map((digit) => SUPERSCRIPT_DIGITS[Number(digit)])
        .join(""),
  );
}

export function parseConfiguration(configuration = "") {
  const plain = configuration.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (digit) =>
    String(SUPERSCRIPT_DIGITS.indexOf(digit)),
  );
  return [...plain.matchAll(/([1-7])([spdf])(\d+)/g)].map(
    ([, shell, family, occupation]) => ({
      id: `${shell}${family}`,
      n: Number(shell),
      l: "spdf".indexOf(family),
      electrons: Number(occupation),
    }),
  );
}

export function createConfigurationModel(element) {
  const entries = parseConfiguration(element.electron_configuration);
  const shorthand = element.econfig_shorthand || element.electron_configuration;
  const coreSymbol = shorthand.match(/\[([^\]]+)\]/)?.[1] || null;
  const remaining = new Set(
    parseConfiguration(shorthand).map((entry) => entry.id),
  );
  const coreEntries = coreSymbol
    ? entries.filter((entry) => !remaining.has(entry.id))
    : [];
  const core = coreEntries.length
    ? {
        symbol: coreSymbol,
        entries: coreEntries,
        ids: coreEntries.map((entry) => entry.id),
        electrons: coreEntries.reduce(
          (total, entry) => total + entry.electrons,
          0,
        ),
        shells: [...new Set(coreEntries.map((entry) => entry.n - 1))],
      }
    : null;
  return { entries, core };
}

export function configurationGroups(model, expanded = false) {
  const groups = [];
  const coreIds = new Set(model.core?.ids || []);
  if (model.core && !expanded)
    groups.push({
      id: "core",
      count: model.core.electrons,
      shells: model.core.shells,
      entries: [{ id: "core", core: true, symbol: model.core.symbol }],
    });
  for (const entry of model.entries) {
    if (!expanded && coreIds.has(entry.id)) continue;
    const id = `shell-${entry.n}`;
    let group = groups.find((item) => item.id === id);
    if (!group) {
      group = { id, count: 0, shells: [entry.n - 1], entries: [] };
      groups.push(group);
    }
    group.entries.push(entry);
    group.count += entry.electrons;
  }
  return groups;
}

// Page positions come from actual group boundaries and the measured viewport.
// A group wider than the viewport is traversed in viewport-sized increments.
export function configurationPageStarts(
  groupStarts,
  viewportWidth,
  totalWidth,
) {
  const end = Math.max(0, totalWidth - viewportWidth);
  if (end <= 1 || viewportWidth <= 0) return [0];
  const pages = [0];
  while (pages[pages.length - 1] < end - 1) {
    const current = pages[pages.length - 1];
    const fitting = groupStarts.filter(
      (position) =>
        position > current + 1 && position <= current + viewportWidth,
    );
    const next = Math.min(
      end,
      fitting.length ? fitting[fitting.length - 1] : current + viewportWidth,
    );
    if (next <= current + 1) break;
    pages.push(next);
  }
  return pages;
}
