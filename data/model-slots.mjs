// Displayed positions have their own identity: a historical position may refer
// to several elements, a repeated element, or no modern element at all.
export function slotNumbers(slot) {
  return [
    ...new Set(slot.elementNumbers || (slot.number ? [slot.number] : [])),
  ].filter(
    (number) => Number.isInteger(number) && number >= 1 && number <= 118,
  );
}

export function slotLabel(slot, elements) {
  const element = slot.number ? elements[slot.number - 1] : null;
  const historical = slot.mass != null || slot.historical === true;
  return {
    symbol: String(slot.symbol ?? element?.symbol ?? "?"),
    name: slot.name ?? element?.name ?? "Historical entry",
    number: String(
      slot.sourceNumber ?? (historical ? "" : (slot.number ?? "")),
    ),
    mass:
      slot.mass != null
        ? `${slot.mass} · source`
        : historical
          ? ""
          : String(element?.atomic_mass ?? ""),
    configuration: historical
      ? "Historical notation"
      : (element?.econfig_shorthand ?? ""),
    style: slot.labelStyle || "standard",
  };
}

export const DESIGN_IDS = [
  "18",
  "32",
  "racetrack",
  "giguere",
  "janet",
  "stowe",
  "benfey",
  "chemical-galaxy",
];
export const TIMELINE_IDS = [
  "dobereiner",
  "telluric",
  "mendeleev",
  "janet",
  "racetrack",
  "giguere",
  "stowe",
  "18",
];
export function designForRoute(id, pathname, remembered = "18") {
  const collection = pathname === "/timeline" ? TIMELINE_IDS : DESIGN_IDS;
  return collection.includes(id)
    ? id
    : collection.includes(remembered)
      ? remembered
      : "18";
}
