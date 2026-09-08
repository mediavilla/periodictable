# Implementation map

A working brief of how this repository is built, so later tasks can land in the right files. It describes the live explorer, the leftover HTML-table era, and the remaining product work. Scientific transcription details stay in the source documents listed at the end.

Reviewed 8 September 2026 against the current tree on `main`, including uncommitted explorer-detail edits.

## What this site is

An interactive exploration of **how people have arranged the elements**, plus **shared stories for all 118 elements**. Visitors switch among historical and contemporary table designs, open a design’s history, or open an element (or a historical entry that is not a modern element). A discovery page and 118 standalone element pages reuse the same content renderer.

It is a **static Next.js site**. There is no CMS, no API, and no server-side lookup at runtime. All table geometry, membership, and element facts are compiled into the export.

The product is still a local/reviewable prototype in important ways: several footer destinations are placeholders, most element pages use baseline facts rather than curated stories, and a large unused HTML-table codebase remains in the tree.

## Stack and constraints

| Piece | Choice |
| --- | --- |
| Framework | Next.js 13.2, **Pages Router**, JavaScript |
| UI | React 18.2 |
| 3D | React Three Fiber 8, Drei 9, Three.js 0.170 |
| Motion | animejs for camera and table transitions |
| Icons / type | lucide-react; Geist and Geist Mono bundled from `geist` |
| Output | `output: "export"` with `trailingSlash: true` and unoptimized images |
| Node | CI uses Node 20 |

Hard constraints that affect almost every change:

- **Static export.** No `getServerSideProps`, no API routes, no middleware. `pages/[element].js` uses `getStaticPaths` / `getStaticProps` only.
- **One persistent WebGL canvas.** `SceneCanvas` mounts in `_app.js` and is loaded with `next/dynamic` (`ssr: false`). Table views and Bohr illustrations are Drei `View` rectangles; `View.Port` draws them through that canvas.
- **URL is the durable state** for design, open panel, selected element, and historical slot. Hover, camera, and orbit animation must not write history.
- **Historical membership is edition-specific.** Do not add modern elements to a historical model because they exist in `elements.json`.
- **`components/Footer.js` and `styles/footer.module.css` are frozen.** Overflow on phones is handled by `FooterViewport`, not by editing the footer.

`next.config.js` sets `basePath` empty on Vercel (`VERCEL=1`), `/periodictable` for other production hosts, and empty in development. Override with `SITE_BASE_PATH`. Development builds write to `.next-development` so a production `.next` can coexist.

## How a request becomes a scene

```
pages/_app.js
  ExplorerProvider          URL → design, panel, element, slot
  <Component />             Designs, Timeline, Elements, or a standalone page
  SceneCanvas               one Canvas + View.Port (client only)

TableExperience             HTML chrome + Drei View for the table
  TableScene                cameras, lights, transitions, picking
    CellBatch               merged bodies, outlines, labels
    ElementCell × N         invisible picking proxies
    optional structure      Giguère wings, spatial/planar extras
```

`ExplorerProvider` is the live state contract. Table pages, navigation, the canvas, and Bohr viewports all call `useExplorer()`. They do not use the older `TableProvider`.

## Routes

All live pages live under `pages/`. There is no `pages/api`.

| Path | Page | What it renders |
| --- | --- | --- |
| `/` | `index.js` | `TableExperience` — Designs collection |
| `/timeline/` | `timeline.js` | `TableExperience timeline` — chronological collection |
| `/elements/` | `elements.js` | Discovery: three featured stories, then `ElementFinder` |
| `/{name}/` | `[element].js` | Standalone `ElementDetail` for all 118 lowercase names |
| `/about/`, `/contact/`, `/donate/`, `/sponsor/`, `/feedback/` | matching page files | `PlaceholderPage` |

Designs and Timeline share one component. The `timeline` flag only changes heading copy, the second navigation row (`DESIGN_IDS` vs `TIMELINE_IDS`), and whether the short introduction shows.

Standalone element URLs are `element.name.toLowerCase()` with `fallback: false`. There is no slug map and no CMS id.

## URL state

Query parameters, restored by shallow `router.push`:

| Param | Meaning |
| --- | --- |
| `design` | Registry id. Omitted when the design is `18`. |
| `element` | Lowercase English name. Opens the element panel on table routes. |
| `slot` | Stable slot id such as `mendeleev-…`. Used when a cell is not a single modern element, or to keep a historical occurrence distinct. |
| `panel` | `history` for design history; `entry` for a slot with no modern `number`. |

`ExplorerProvider` treats `element`, `entry`, and `history` as mutually exclusive on table routes. Changing design keeps a selected modern element in session memory; historical layouts do not invent a cell if that element is absent. Each of `/` and `/timeline` remembers its last design for the destination links in the top nav.

Examples (development, no prefix):

- `/?design=giguere&element=gold`
- `/timeline/?design=mendeleev&panel=history`
- `/timeline/?design=janet&slot=janet-85&panel=entry`

Production on a non-Vercel host prefixes these with `/periodictable`. Use `next/link`, `router.basePath`, and `utils/assetPath.js` for local files.

## Data layer

### Canonical element dataset

`public/elements.json` is an array of **118 objects in atomic-number order**. Renderers index as `elements[number - 1]`. Tests enforce that contract.

Useful fields:

- Identity: `number`, `name`, `symbol`, `category`
- Layout: `col18Xpos` / `col18Ypos`, `col32Xpos` / `col32Ypos`
- Structure: `shells`, `electron_configuration`, `econfig_shorthand`
- Properties: `atomic_mass`, `phase`, `density`, `melt`, `boil`, `appearance`, ionization, electronegativity, and related values
- `source` (Wikipedia URL) and `summary` (legacy prose; used as fallback copy)

`public/elements32.json` is leftover from the HTML 32-column table. The live 32-column model reads coordinates from `elements.json`.

### Table registry

`data/table-registry.js` is the catalogue. It concatenates:

1. Three **core** tables defined inline: `18`, `racetrack`, `giguere`
2. `data/models/modern-models.js` — `32`
3. `data/models/historical-models.js` — `dobereiner`, `mendeleev`, `janet`
4. `data/models/spatial-models.js` — `telluric`, `stowe` (`renderer: "spatial"`)
5. `data/models/planar-models.js` — `benfey`, `chemical-galaxy` (`renderer: "planar"`)

Each table record includes identity copy (`name`, `creator`, `date`, `edition`, `principle`, `significance`, `introduction`, `sources`), `camera` and `lightingAnchors`, and either explicit `membership` or membership derived from slots.

Helpers:

- `tableById(id)` — unknown ids fall back to `18`
- `designTables` / `chronologicalTables` — navigation order, not registry order
- `tableSlots(id)` / `findSlot` / `findElement`
- `categoryColor` / `categoryPastelColor` — shared by canvas and HTML (pastel is 55% white mixed in linear sRGB)

### Slots vs elements

A **slot** is a displayed position in a specific edition. It is not the same as a modern element.

`data/model-slots.mjs` owns:

- `DESIGN_IDS` and `TIMELINE_IDS` (the approved navigation collections)
- `designForRoute(id, pathname, remembered)` so a design that exists only in one collection cannot leak into the other
- `slotNumbers(slot)` — zero, one, or several modern atomic numbers
- `slotLabel(slot, elements)` — what the cell prints, including historical weights marked `· source`

Slot fields you will see:

| Field | Role |
| --- | --- |
| `id` | Stable identity (`{design}-{…}`). Never reuse atomic number as the only key. |
| `number` | Set only for a verified single modern element. |
| `elementNumbers` | Related modern identities for composites (Ni/Co, didymium). |
| `kind` | `element`, `prediction`, `composite`, `historical`, `radical`, `comparison`, `annotation`, … |
| `historical` | Do not silently add current mass or configuration to the label. |
| `mass` / `sourceNumber` / `symbol` / `note` | Printed source values and explanation copy. |

Janet, Mendeleev, Benfey, Chemical Galaxy, Stowe, and the telluric screw all include positions that are **not** modern elements. Clicking those opens `panel=entry` rather than inventing a Bohr model.

### Geometry sources

| Design | Geometry | Notes |
| --- | --- | --- |
| `18` | `elements.json` 18-column coordinates | Built in `TableScene.layoutCells` |
| `32` | `elements.json` 32-column coordinates | `modernLayouts` |
| `racetrack` | `data/racetrack-layout.json` | SVG paths extruded in `racetrackGeometry.js`; 104 regions |
| `giguere` | `data/giguere-layout.json` | Outward-facing planes; provenance in `giguere-provenance.json` |
| `dobereiner`, `mendeleev`, `janet` | records in `historical-models.js` | Grid-like boxes from slot `position` / `width` / `height` |
| `telluric`, `stowe` | `spatial-models.js` + `spatialModelGeometry.js` | Loaded on demand |
| `benfey`, `chemical-galaxy` | JSON layouts + `planarModelGeometry.js` | Loaded on demand; Benfey keeps traced polygons |

`modelGeometry.loadAdditionalCells` dynamically imports planar/spatial factories so the registry stays usable without WebGL.

## Rendering pipeline

### Shared canvas

`SceneCanvas` uses `frameloop="always"` only while some registered viewport is visible (`sceneActive`). Otherwise it drops to `demand`. Pixel ratio is capped at 2. WebGL context loss or a render error sets `webglFailed`; HTML search and element pages still work.

### Table scene

`TableScene` is the interactive 3D controller:

- Frames the current design from `camera.width/height/depth` and the live `View` rectangle
- Cross-fades and slides between designs with animejs; later requests cancel earlier geometry preparation
- Flat designs pan in the front plane; spatial designs (`camera.orbit`) rotate, with cylinder or panel collision for telluric/Giguère/Stowe
- Zoom-out stops at the fitted distance; HTML +/−/reset buttons send `issue("in"|"out"|"reset")` through the provider
- Opening a panel saves the camera and reframes; closing restores that snapshot
- `prefers-reduced-motion` skips journeys and uses a short fade

Development builds expose `window.__periodicScene` (cell count, camera, projected picking, draw calls) for the Playwright harnesses. Do not treat that object as a public API.

### Batched drawing vs picking

`CellBatch` merges visible bodies, outlines, and up to five label atlas meshes. That is the draw-call budget for the cells themselves.

`ElementCell` is a hidden mesh on the same geometry so hover and click keep the correct face (important for Giguère front/back). There is no per-cell `useFrame`.

Touch uses two-step selection: first tap highlights, second tap opens. Mouse/pen opens on a single click if pointer travel is small (`event.delta > 7` is ignored as a drag).

### Labels

`labelAtlas.js` paints five shared canvas textures for all positions (enough rows for Benfey’s 144). Projected size, with hysteresis, chooses how much to show: number, symbol, name, mass, configuration. Historical slots never gain a modern weight or Bohr configuration through this path.

### Bohr illustrations

`BohrModel` is a stylized shell diagram from `element.shells`. Electrons are instanced; rings are shared. It is not a quantum-orbital view. `BohrViewport` tracks a DOM `View` on element pages and featured cards. A large decorative copy also sits on the table backdrop. Neutrons are not inferred from atomic mass.

## HTML chrome

`TableExperience` owns the page around the canvas: heading, “About this design”, selection card, camera controls, absence notices, historical-entry lists, finder, and the sliding preview/detail split.

Panel contents:

- **element** — optional historical context, then `ElementDetail compact`, plus a link to the standalone page
- **entry** — source-only copy, related modern elements if any, edition and sources
- **history** — creator, origin, displayed edition, principle, significance, sources

Keyboard on table routes: arrows walk `tableSlots`, Enter opens, Escape closes the panel. The table `View` is focusable.

`ExplorerNavigation` is the full-width bar: Designs / Timeline / Elements, then either design icons or the 118-element strip. Extra models still use a diamond placeholder until SVG artwork exists. Styles live in `styles/explorer-navigation.css` so they do not fight leftover global rules.

`ElementFinder` searches name, symbol, or exact atomic number. On table pages, choosing an element opens the panel; on `/elements`, tiles are links to standalone pages.

## Element content

`data/element-content.js` is independent of geometry.

`getElementContent(element)` always returns:

1. Bohr visualization block
2. Facts block (`getElementFacts`)
3. Optional curated `elementStories[number].blocks`

Facts format units and mark missing values **Unavailable**. Carbon density/melting and gold boiling have explicit source-checked overrides rather than dumping the raw JSON.

Curated stories exist for **Hydrogen (1), Carbon (6), Gold (79)** only. Block types the renderer understands:

- `text` (optional `accent`, `monospace`, `source`)
- `facts`
- `image` (`src` under `public/`, `alt`, `caption`, `credit`, `source`)
- `video` (click-to-play; optional captions)
- `visualization`: `bohr` or `bond-comparison`

NASA showcase images live in `public/images/stories/` with attributions in `attributions.json`. Images load lazily and fall back to the source link if they fail.

`ElementDetail` is the only element-page renderer that current routes use. Compact mode is the table sidebar; full mode is `pages/[element].js`.

Uncommitted work in the tree (8 September 2026) moves electron configuration into the Bohr card, restyles the detail grid, and adds warning icons on absence notices. Treat that as in-progress UI, not as a second content system.

## Styling

| File | Role |
| --- | --- |
| `styles/globals.css` | Geist faces, leftover global type, some legacy timeline rules |
| `styles/explorer.css` | Explorer layout, stage, panel, finder, controls |
| `styles/explorer-navigation.css` | Top bar and design/element strips |
| `components/explorer/ElementDetail.module.css` | Bento detail |
| `styles/placeholder-page.module.css` | Footer destinations |
| `styles/footer.module.css` | Frozen footer |

Explorer pages set their own 16px type and `#fafafa` background. Do not restyle them through the old periodic-table CSS modules.

## Testing, build, preview

```sh
npm test              # node --test tests/*.test.mjs
npm run lint
npm run build         # next build && next export → out/
npm run verify:export # HTML, 118 element pages, local href/src under the export prefix
npm run preview       # serve out/ at the configured prefix (default port 3019)
```

Node tests cover identities and shells, slot/collection contracts, racetrack/Giguère geometry, historical/spatial/planar membership, camera limits, and hosting `basePath`.

Playwright runners are **not** `npm test`. They export `runBrowserChecks(browser, baseURL)` (or a focused sibling) and write `artifacts/verification/` (gitignored). They expect a caller-owned browser, including CDP. Measurements are desktop or emulated viewports, not physical devices.

| Harness | Focus |
| --- | --- |
| `tests/browser-checks.mjs` | Core three models, picking, camera, reduced motion |
| `tests/all-models-browser-checks.mjs` | All eleven models and directed collection transitions |
| `tests/export-browser-checks.mjs` | Exported site under the production prefix |
| `tests/interface-feedback-checks.mjs` | Navigation and layout feedback |
| `tests/detail-preview-browser-checks.mjs` | Panel/preview camera |
| `tests/spatial-camera-browser-checks.mjs` | Stowe/telluric/Giguère camera clearance |

## Hosting

- **Vercel:** framework preset, no Output Directory override, export at `/`.
- **Other static hosts:** `/periodictable` unless `SITE_BASE_PATH` says otherwise.
- **GitHub Pages:** `.github/workflows/nextjs.yml` still builds `out/` and deploys Pages. The explorer docs treat that workflow as preexisting; it is not an instruction to publish an unfinished prototype.

`npm start` is the Next server. It is not the acceptance check for the static site. Use `verify:export` and `preview`.

## Two codebases in one repo

Current routes import **only** `components/explorer/*`, `data/*`, `public/elements.json`, and a few small utils (`assetPath`, category helpers unused by explorer).

The following is **legacy HTML-table work**. It is not mounted. Prefer not to extend it:

| Area | Paths |
| --- | --- |
| Old table state | `utils/TableProvider.js`, `utils/fetchElement.js` |
| 18 / 32 / racetrack DOM tables | `Table18Cols.js`, `Table32Cols.js`, `TableRaceTrack.js`, `TableSwitcher.js`, `TableRenderer.js`, `TableRaceTrack copy.js` |
| Mini nav / cards | `NavMiniTable18.js`, `NavMiniTable32.js`, `NavMiniTableRaceTrack.js`, `NavElement.js`, `NavTop.js`, `ElementCard.js` |
| Canvas experiments | `CanvasBackground.js`, `Bohr.js`, `BohrBackground.js`, `Orbitals.js` (explicit placeholder) |
| Per-element prose components | `components/Elements/*.js` (118 files) loaded by unused `CustomElementContent.js` |
| Year timeline | `public/timeline.json`, `TimelineContent.js`, `TimelineSidebar.js`, `components/TimelineYears/*.js` (27 years) |

The live Timeline is a **chronological list of table designs**, not the 1669–2016 discovery narrative in `timeline.json`. That narrative is research/legacy content, not a current route.

`package.json` still lists jQuery, jsdom, xml2js, and the stub `fs` package. Cheerio is used by export verification and the preview server. The others look unused by the explorer.

## What is finished vs open

### In place

- Eleven models across two navigation collections, with source-backed slots
- Shared canvas, batched cells, picking, camera save/restore, reduced motion, WebGL fallback
- Element finder, standalone pages for all 118 names, baseline facts + Bohr diagram
- Curated stories for hydrogen, carbon, and gold
- Frozen footer wrapped for narrow viewports
- Static export, prefix-aware assets, Node tests, optional browser harnesses

### Intentionally not built yet

- Real About / Contact / Donate / Sponsor / Feedback pages (`PlaceholderPage` only). `pages/feedback.js` still exports a function named `Donate` (copy-paste leftover).
- SVG icons for the eight newer designs (diamond marker in the nav)
- Curated stories for the other 115 elements
- Editorial migration of `elements.json` summaries and the 118 `components/Elements` drafts
- Discovery-by-year simulation (the old `timeline.json` years)
- Quantum orbital visualization (`Orbitals.js` remains a stub; Bohr is the only live atom graphic)
- CMS, user accounts, or server features
- Physical-device performance and touch sign-off
- Deleting or migrating the unused HTML-table tree

### Product research that is not code

`docs/materials-review.md` and `docs/source-inventory.md` describe a Notion research dump (quotes, trivia, orbital references, moodboard). They are not a backlog. Treat them as background unless a task says otherwise.

## Where to put new work

### Add or change a table design

1. Metadata and slots in the matching `data/models/*.js` (or core tables in `table-registry.js`)
2. Confirm edition vs origin, and historical-to-modern mapping, **before** geometry
3. If it is not a simple grid, add a factory and optional structure component; wire `renderer` and `loadAdditionalCells`
4. Add the id to `DESIGN_IDS` and/or `TIMELINE_IDS` only if it belongs in that collection
5. Camera, lighting anchors, label bounds, and source colours
6. Membership/picking tests in the existing `tests/*.test.mjs` files
7. Provenance notes in the relevant `docs/sources-*.md`

Do not enlarge a historical membership because a later element exists. Predictions and unnamed positions stay slots without `number`.

### Add element storytelling

Add an `elementStories[atomicNumber]` record in `data/element-content.js`. No new page component. Reuse block types; add a visualization renderer in `ElementDetail.js` only when the content truly needs a new illustration. Keep source URLs on blocks. Put local media in `public/images/stories/` and record attribution.

### Change table interaction or URL behavior

`ExplorerProvider` first, then `TableExperience` / `TableScene`. Keep hover and camera out of the query string. Preserve `design` / `element` / `slot` / `panel` as the shareable state.

### Change look and feel of the live site

`styles/explorer.css`, `styles/explorer-navigation.css`, and `ElementDetail.module.css`. Leave `footer.module.css` and the unused `periodicTable.module.css` alone unless a task is explicitly about the frozen footer or deleting legacy CSS.

### Fill a placeholder page

Replace the `PlaceholderPage` usage in that `pages/*.js` file. Keep `ExplorerNavigation` and `FooterViewport` so chrome stays consistent.

## Conventions that keep tasks reviewable

- JavaScript, Pages Router, no TypeScript. Path alias `@/*` exists in `jsconfig.json` but current explorer code uses relative imports.
- React 18: no `use()`, no `ref` as a regular prop pattern from React 19, no `<ViewTransition>`.
- Do not define components inside components on hot paths (`TableExperience` already has some nested helpers; do not add more unless a refactor task asks for it).
- Geometry caches (racetrack meshes, label atlases, Bohr rings) are shared. Do not dispose them on every design change.
- Bohr diagrams must keep `sum(shells) === atomic number` (enforced in tests).
- After UI changes, verify in the browser (or the matching Playwright harness), not only by reading the export log.
- `npm test` plus `verify:export` are the default mechanical checks; browser harnesses when the task touches picking, camera, or transitions.

## Related documents

| Document | Use it for |
| --- | --- |
| [react-three-fiber-poc.md](react-three-fiber-poc.md) | Original three-model explorer: canvas, batching, URLs, local commands |
| [additional-table-models.md](additional-table-models.md) | The eight later models, slot semantics, extension checklist |
| [sources-historical-models.md](sources-historical-models.md) | Döbereiner, Mendeleev, Janet transcription decisions |
| [sources-spatial-models.md](sources-spatial-models.md) | Telluric screw and Stowe |
| [sources-planar-models.md](sources-planar-models.md) | Benfey and Chemical Galaxy |
| [materials-review.md](materials-review.md) | Notion research snapshot, not implementation |
| [source-inventory.md](source-inventory.md) | Link retrieval log for that research |

When a later task conflicts with an older POC note, prefer this map plus the current `data/` and `components/explorer/` files. The POC document still describes hosting, verification commands, and the three core geometries in more depth.
