# Planar continuous models

Both models use the existing persistent renderer and front-facing pan/zoom controls. These are planar historical designs rendered as shallow meshes, not invented three-dimensional helices. The data keep source positions separate from current element identities.

## Benfey spiral

The geometric reference is **Figure 3, printed page 143** of Theodor Benfey, “The Biography of a Periodic Spiral: from Chemistry magazine, via Industry, to a Foucault Pendulum,” _Bulletin for the History of Chemistry_ 34(2), 141–145 (2009). [Open the source, PDF page 73](https://acshist.scs.illinois.edu/bulletin_open_access/FullIssues/bhc2009v034f2.pdf#page=73). The figure itself credits a January 1970 _Chemistry_ reprint. The history panel records 1964 as the design origin, not as the date of this expanded edition.

The original embedded image is 640 × 487 pixels. `benfey-layout.json` stores its coordinate system, source label centres and explicit boundary polygons. Named cells were separated along the raster's printed outlines, with local repair of broken hairline boundaries. Lettering holes and small compression notches were removed within individual regions, then the contours were simplified within a 1.4-source-pixel tolerance. Straight-sided convex cells use their measured outer envelopes, with local manual boundary repairs for the Am/Cm junction; the central hydrogen disk follows the measured elliptical outline. White prediction cells whose borders join the surrounding paper were traced manually. The resulting outlines are a digitized reconstruction at the source scan's resolution, not archival vector originals. No generic spiral equation generates the element positions.

The displayed source has **105 named entries**, followed by **39 unnamed numbered positions, 106–144**. The predicted extension stays visible, but those cells have no modern element number and open a historical explanation. The source's **Ku (104)** and **Ha (105)** map to current Rutherfordium and Dubnium names; the source symbols are retained as provenance. All known cells stay in their original sequence, including the upper lanthanide/actinide region and lower transition-metal region.

The available embedded source scan is grayscale. Pastel fills are editorial band coding, not a claim to reproduce its original printed inks. Label text stays horizontal, as in the figure, using a measured source centre where it fits and an interior rectangle in tapered cells. These fitted label rectangles are stored with the coordinates so layout work does not delay the first render. Outlines are drawn from the digitized contours, so extrusion triangulation does not create crossing seams.

## Chemical Galaxy II

The source is Philip Stewart's **Chemical Galaxy II**, described in his 2006 [creator notes](https://www.chemicalgalaxy.co.uk/page3_page3.html). The [703 × 522 reproduction](https://www.meta-synthesis.com/webbook/35_pt/stew.jpg) supplies the measured disk locations; the [creator site](https://www.chemicalgalaxy.co.uk/) supplies attribution. Carl Wenczek translated Stewart's design into electronic form. Stewart's original article, “A New Image of the Periodic Table,” appeared in _Education in Chemistry_ 41(6), 156–158, November 2004. This distinguishes the original publication from the displayed second edition.

`chemical-galaxy-layout.json` stores individually measured centres and radii for **118 numbered disks plus the conceptual central question mark**. The five positions **113 and 115–118** remain source question marks with no current selectable element identity. The other 113 disks are identified in that edition. **Uub (112)** and **Uuq (114)** use current Copernicium and Flerovium labels, with source aliases recorded. The central question mark is an annotation about Stewart's conceptual “element zero,” not a chemical element.

Hydrogen remains near Carbon; Helium joins the noble gases; Lu and Lr retain their positions at the junction with the following series. The pastel grouping colours follow the creator image's families, with saturation reduced for this site's presentation. The deliberately nonuniform disk positions and elliptical proportions are retained. Guide curves interpolate measured source positions; they are contextual lines, not element boundaries or hit targets. Detailed element facts come from the site's shared current data, not the historical creator commentary.

## Validation

`tests/planar-models.test.mjs` verifies source membership and prediction counts, exceptional positions and aliases, bounded resource caching, and front-face ray selection at the centre and four corners of every fitted label. All 263 displayed positions have individual hit targets. Historical predictions and the conceptual centre are deliberately absent from each model's modern element membership.

No external images, font files or additional renderers are loaded by these models at runtime. Geometry and guide caches contain at most the two available planar designs. Galaxy disks share geometry and outlines whenever their measured radii match. Benfey retains separate contours for its individually shaped cells.
