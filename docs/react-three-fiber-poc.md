# React Three Fiber proof of concept

This is a local, English-language prototype for exploring three periodic-table designs and the same underlying element content. Publishing is a separate step. It retains the Next.js Pages Router, React 18, and static export, using React Three Fiber 8, Drei 9, and Three.js for the interactive scenes.

## Where the implementation lives

| Responsibility | Files |
| --- | --- |
| Application shell and persistent renderer | `pages/_app.js`, `components/explorer/SceneCanvas.js` |
| URL-derived design/panel state, transient selection, hover, reduced motion, viewport visibility | `components/explorer/ExplorerProvider.js` |
| Design metadata, chronology, membership, camera framing and lighting anchors | `data/table-registry.js` |
| Shared table experience, controls, history, HTML detail panel and return preview | `components/explorer/TableExperience.js` |
| Layout dispatch, cameras, lights and table transitions | `components/explorer/TableScene.js` |
| Batched visible cell bodies, outlines and labels | `components/explorer/CellBatch.js`, `components/explorer/labelAtlas.js` |
| Reusable per-element pointer and selection interface | `components/explorer/ElementCell.js` |
| Original racetrack paths and cached SVG-to-mesh conversion | `data/racetrack-layout.json`, `components/explorer/racetrackGeometry.js` |
| Historical Giguère face placements and construction notes | `data/giguere-layout.json`, `data/giguere-provenance.json`, `components/explorer/GiguereStructure.js` |
| Shared rings/electrons and tracked illustration viewports | `components/explorer/BohrModel.js`, `components/explorer/BohrViewport.js` |
| Shared element content and bento rendering | `data/element-content.js`, `components/explorer/ElementDetail.js`, `components/explorer/ElementDetail.module.css` |
| Discovery and lowercase element pages | `pages/elements.js`, `pages/[element].js` |
| HTML navigation and scoped explorer styling | `components/explorer/ExplorerNavigation.js`, `styles/explorer.css` |
| Phone overflow containment around the unchanged footer | `components/explorer/FooterViewport.js` |

`SceneCanvas` mounts once in the application shell. It is loaded on the client because WebGL and canvas textures need browser APIs. Drei `View` components track the table and visible Bohr illustrations in the DOM; `View.Port` renders those viewports through the shared renderer. There is no separate WebGL canvas for every bento card. Navigation, controls, articles, search, and the footer remain HTML.

`CellBatch` renders the visible table with one merged body mesh, one merged outline, and up to four label meshes: at most six draw calls for those parts, rather than separate draws for every element. It preserves each input geometry's triangles and face orientation. Per-element colors and label-detail partitions update the batch's buffer attributes. Backgrounds, Bohr illustrations, and Giguère's structural panels add their own draws.

Each element still has an `ElementCell` instance with an invisible picking proxy. These proxies preserve the common hover and selection interface and the exact outward-facing geometry, including Giguère's different front/back elements. They add no visible draws or per-cell animation callbacks. Rectangular cells share a box; historical Giguère entries use outward-facing planes; racetrack cells receive their cached curved geometry.

`labelAtlas.js` caches four canvas textures containing the labels for all 118 elements. It uses the existing Neue Haas Grotesk font, drawing a system fallback immediately and repainting the same textures when the web font is ready. `CellBatch` projects each label's usable width and height, using the narrower screen dimension to determine detail. Thresholds near 40, 64, and 100 pixels have a small hysteresis band. Names fit their atlas tile, and racetrack label size is constrained by an interior-safe box rather than the full curved cell's bounding box. A single periodic batch check replaces per-cell frame callbacks.

Transient animation values, camera objects, and orbital positions live in refs rather than React state updated every frame. `TableScene` coordinates outgoing/incoming designs and camera easing with animejs. Camera journeys interpolate orbital angles and distance, so an orbit reset travels around the model; a newer request retargets from the current pose. Controls pause during the journey and resume within the layout's angle/distance limits. The HTML panel and tracked table rectangle provide the expanding-panel/shrinking-preview layout. Opening follows the changing preview rectangle, while closing eases to a fixed saved camera position and target. The preview disables cell selection and camera controls. Reduced motion applies camera changes immediately while table/panel travel becomes a brief fade.

The renderer caps pixel ratio at 1.5. Intersection observers track visible views, decorative motion pauses offscreen, and the renderer uses demand mode when no registered viewport is visible. Bohr electrons share geometry and use instancing; orbital rings and label textures are also shared. These resource choices are implementation measures, not a claim that performance has been validated on every device.

## Geometry and scientific provenance

| Design | Displayed membership | Source and interpretation |
| --- | --- | --- |
| 18 columns | 118 unique elements, atomic numbers 1–118 | Existing `public/elements.json` coordinates, retaining La/Ac in group 3 and the detached Ce–Lu and Th–Lr rows. The registry labels this contemporary convention **Today** and does not invent a single origin year. [IUPAC reference](https://iupac.org/what-we-do/periodic-table-of-elements/). |
| Racetrack | 104 original numbered regions, atomic numbers 1–104 | Exact numbered `d` strings extracted from the previous `components/TableRaceTrack.js`. It is the existing site's adaptation of [Clark's design](https://www.meta-synthesis.com/webbook/35_pt/pt_database.php?PT_id=86), not an exact reproduction of the 1933 print. |
| Giguère | 103 element faces, atomic numbers 1–103 | Placements reconstructed from the three photographs on p. 37 of Giguère's original article. The pictured placard is dated 1965; the article appeared in December 1966. The [catalogue entry](https://www.meta-synthesis.com/webbook/35_pt/pt_database.php?PT_id=525) and the [original paper hosted by Grover Lab](https://raw.githubusercontent.com/groverlab/giguere-3D-periodic-table/main/giguere-1966.pdf) are recorded in the provenance file. |

Racetrack conversion uses `SVGLoader` and shallow `ExtrudeGeometry`. Coordinates are scaled by 1/100, centered on the original 2084 × 1250 view box, and Y-flipped while preserving front-face winding. Precomputed interior label anchors and usable boxes avoid expensive label searches on each load. Meshes and `EdgesGeometry` outlines are cached for the browser session; consumers must not dispose of those shared resources on every layout change. The original paths are retained in JSON so the geometry can be audited or regenerated.

Each Giguère data record represents one element on one face. Its Euler rotation turns the local +Z normal outward. Opposing records on the same physical tile can carry different elements and have independent labels and hit targets. There are 52 occupied tiles with 103 labeled faces, plus seven entirely blank structural tiles. The back of the lawrencium tile is also blank. The four wings contain 14 s-block, 30 p-block, 31 d-block, and 28 f-block entries.

The Giguère reconstruction uses current names, including Lr for the original Lw. It excludes the modern additions in the [Grover Lab construction model](https://github.com/groverlab/giguere-3D-periodic-table) and corrects that model's Pr/Pa transcription error using the historical photograph. Dimensions are normalized for interaction; original printed masses, period markers, and title placards are not transcribed. `data/giguere-provenance.json` records these choices and the expected front/back rows.

Bohr illustrations use the dataset's `shells` populations. They are stylized shell diagrams, not literal electron trajectories or quantum orbitals. No neutron count is inferred by rounding atomic mass.

## URLs and navigation state

Development routes use `/`; production export uses the `/periodictable` prefix. `next/link`, `router.basePath`, and the application base URL handle local assets and navigation under that prefix.

| URL without the production prefix | Meaning |
| --- | --- |
| `/` | Designs, contemporary 18-column table |
| `/?design=racetrack` | Designs, racetrack table |
| `/?design=giguere&element=gold` | Giguère with the shared gold detail panel open |
| `/timeline/?design=giguere&panel=history` | Chronological navigation with Giguère's history open |
| `/elements/` | Search and featured element discovery |
| `/hydrogen/`, `/carbon/`, `/gold/` | Standalone pages using the same detail renderer |

The registry IDs are `18`, `racetrack`, and `giguere`; the default `18` is normally omitted from the query. `element` opens an element sidebar, while `panel=history` opens design history. The UI writes these as mutually exclusive states. Design/panel changes use shallow router history, so direct links and browser Back can reconstruct the relevant state. Hover, orbital animation, and camera movement do not add history entries. A selected element persists while switching designs during the session; historical layouts do not gain an invented cell when that element is absent.

All 118 standalone element paths are generated from `element.name.toLowerCase()` in `getStaticPaths`, preserving existing lowercase URLs. There is no dynamic server lookup or CMS requirement.

## Extending designs and element content

To add a design, add its identity, date/edition distinction, sources, membership, camera settings, and lighting anchors to `TABLES` in `data/table-registry.js`. Add a geometry case to `layoutCells` in `TableScene.js`. Each cell provides an atomic `number`, `position`, optional `rotation`, and, where needed, `geometry`, `outline`, `labelPosition`, `labelWidth`, and `labelHeight`. Supply its icon in `ExplorerNavigation` and add source-based membership and placement checks. Designs and Timeline consume the same registry; chronological order comes from `year`, with the contemporary `null` year sorting last.

Do not extend a historical model's membership just because more elements exist in the shared element dataset. Keep design origin and displayed edition separate, and record interpretation choices in provenance alongside the geometry.

`getElementContent(element)` creates common identity, shell visualization, properties, configuration, and source content for every element. The baseline uses `public/elements.json`; that older dataset has not undergone a comprehensive editorial migration. Missing properties render as **Unavailable**. Property formatting supplies units and includes specific source-checked corrections for showcase content.

Richer Hydrogen, Carbon, and Gold records live in `elementStories`, keyed by atomic number. They include source links to RSC/NASA, attributed imagery, and reusable content blocks. Add another story by supplying `eyebrow`, `summary`, `sources`, and `blocks`; no new element page component is necessary. Supported block shapes include:

```js
const blocks = [
{ id: 'context', type: 'text', title: 'A short heading', body: 'Source-backed prose.',
  source: { title: 'Source name', url: 'https://example.org/source' } },

{ id: 'properties', type: 'facts', title: 'At a glance',
  items: [{ label: 'Property', value: 'Value with unit' }] },

{ id: 'photo', type: 'image', title: 'Image title', src: 'https://example.org/image.jpg',
  alt: 'A useful description of the visible content.', caption: 'Context for the image.',
  credit: 'Creator / organization', source: 'https://example.org/image-source' },

{ id: 'clip', type: 'video', title: 'Video title', src: 'https://example.org/video.mp4',
  poster: 'https://example.org/poster.jpg', captions: 'https://example.org/captions.vtt',
  caption: 'Context for the video.', source: { title: 'Source name', url: 'https://example.org/source' } },

{ id: 'atom', type: 'visualization', visualization: 'bohr', title: 'Inside a neutral atom' }
];
```

The existing `bond-comparison` visualization also accepts selectable choices with nodes, edges, captions, and explanatory text. Add a visualization renderer when the content needs a different kind of illustration. Bohr illustrations use the shared WebGL renderer; the carbon bond comparison is an accessible interactive SVG. Video blocks require explicit activation and native playback controls; the current showcase does not preload an autoplaying video collection. The three NASA showcase photographs are stored in `public/images/stories/` as `hydrogen-sun.jpg`, `carbon-earth.jpg`, and `gold-webb.jpg`, with attribution, alternative text, and original source links in the content records. Images load lazily and offer a source-link fallback if delivery fails.

## Local development and static export

The repository's CI uses Node 20. From the repository root:

```sh
npm install
npm run dev -- --port 3017
```

Open `http://localhost:3017/`. Development output goes to `.next-development`; production output goes to `.next-production`, allowing a development server and a production build to use separate generated directories.

Run the focused checks and production export:

```sh
npm test
npm run lint
npm run build
npm run verify:export
```

`npm test` runs `node --test tests/*.test.mjs`. For Next.js 13.2, the build script runs **`next build && next export`**. The export creates `out/`. `npm run verify:export` then checks the generated HTML, all element pages, and local references under `/periodictable`. A successful Next compilation by itself is not verification of the exported site. Do not use `npm start` as the static-export acceptance check.

To preview the export at its configured production prefix:

```sh
npm run preview
```

Open `http://localhost:3019/periodictable/`, then directly open `/periodictable/hydrogen/` and a query-driven table URL. The preview server mounts `out/` at `/periodictable` and redirects the root to that prefix. Check scripts, icons, styles, source links, and refresh behavior there. This server is for local inspection only. Existing GitHub Pages workflow configuration does not authorize publishing this prototype.

## Verification and remaining evidence

The focused Node tests cover element identities and coordinates, all shell totals including Hydrogen/Carbon/Gold and seven-shell Oganesson, racetrack source preservation and label hit targets, and Giguère historical membership/face placement. Recorded verification at this documentation update:

| Check | Result |
| --- | --- |
| `npm test` | 11 tests passed. |
| `npm run lint` | Passed, with four pre-existing warnings in legacy `CanvasBackground` and `TimelineContent` components. |
| Production build and static export | Completed through `next build && next export`. |
| `npm run verify:export` | Passed: 124 HTML files, all 118 element pages, and 4,633 local references checked. |
| Second full browser run | 23 checks passed; one reduced-motion check used a stale accessible button label. The locator has been corrected and focused re-verification is pending. This is not yet a claim that all 24 browser checks passed. |

Run the commands again after subsequent changes; these results describe the recorded implementation pass rather than guaranteeing future edits.

`tests/browser-checks.mjs` exports `runBrowserChecks(browser, baseURL)`. It accepts a caller-owned Playwright browser, including a browser connected through CDP. A local wrapper can invoke it as follows after establishing a debugging endpoint:

```js
import { chromium } from '@playwright/test';
import { runBrowserChecks } from './tests/browser-checks.mjs';

const browser = await chromium.connectOverCDP(process.env.PERIODIC_CDP_URL);
const report = await runBrowserChecks(browser, 'http://localhost:3017');
console.log({ passed: report.passed, failed: report.failed, report: report.reportPath });
process.exitCode = report.failed ? 1 : 0;
```

The harness creates and closes its own browser contexts and writes `artifacts/verification/browser-checks.json` plus screenshots. It exercises transitions, query state, selection/picking, camera return, responsive layouts, fallback content, and interaction-frame measurements. It uses the development-only scene diagnostics in `TableScene`; production prefix verification is a separate exported-site check. Review failures and browser diagnostics rather than treating the existence of an artifact as a passing result. The recorded second run's reduced-motion failure was a timeout finding the old “Resume orbit” button label after the UI label changed, and its corrected focused run still needs to be recorded.

After batching the visible cells, the recorded Headless Chromium samples were:

| Surface and sampling phase | Average frame rate | 95th-percentile frame interval |
| --- | --- | --- |
| Desktop, 1440 × 1000, resting scene | 58.5 fps | 16.8 ms |
| Desktop, 1440 × 1000, hovering Gold | 60.0 fps | 16.8 ms |
| Mobile emulation, 390 × 844, 4× CPU slowdown, resting scene | 60.0 fps | 16.7 ms |
| Mobile emulation, 390 × 844, 4× CPU slowdown, hover simulation | 60.0 fps | 16.8 ms |

The initial implementation sampled approximately 23 fps on desktop and 14.6 fps in mobile emulation before batching. These are short browser frame-scheduling measurements, not a comprehensive device benchmark or a measurement of every table/gesture combination. The full recorded environment, sample counts, and timings are in `artifacts/verification/browser-checks.json`.

Mobile measurements in the browser harness are **viewport/touch emulation**, including an optional Chromium CPU slowdown. Physical phone/tablet performance and touch behavior have not yet been measured. Emulation cannot establish the behavior of a particular device GPU, memory budget, or operating-system gesture handling.

`components/Footer.js` and `styles/footer.module.css` were left untouched. Their pre-existing one-line whitespace changes remain in the working tree; no implementation changes were added to either file. No pre-implementation hash baseline was captured, so a hash comparison is not claimed. `FooterViewport` wraps the existing footer in a keyboard-focusable overflow region, containing its intrinsic three-column grid on narrow phones without widening the whole page. Its wrapper styles do not override footer selectors or change the existing footer component.

The prototype does not include the other researched layouts, discovery-by-year simulation, a CMS, a comprehensive audit/migration of all legacy prose, or publishing. The existing external web font still depends on its host, and source links point to their original publishers. This delivery is for local review. Remaining visual and performance findings should be recorded with their actual device/browser context before expanding the collection of designs.
