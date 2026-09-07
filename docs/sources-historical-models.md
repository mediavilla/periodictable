# Historical layout sources and transcription

Checked 7 September 2026. The data are in `data/models/historical-models.js`. These are interactive reconstructions: geometry, modern type, colours and explanatory names are ours. They are not scans presented as originals.

## Döbereiner — selected triads, 1829

[Döbereiner’s 1829 paper, translated in Classic Chemistry](https://web.lemoyne.edu/~giunta/dobereiner.html), discusses the four representative groups used here: Li–Na–K, Ca–Sr–Ba, S–Se–Te, and Cl–Br–I. [Girolami’s study of the original documents](https://doi.org/10.13128/Substantia-592), pp. 113–114, independently identifies these four groups.

The twelve cells form four separated horizontal triplets. This geometry is an educational arrangement, not a purported original 1829 periodic table. The selection is not the complete list of groups considered in Döbereiner’s paper. Names and properties come from the modern element dataset. No historical numerical formula is calculated from modern data and attributed to the original paper: its comparisons also involve oxides and older weight conventions.

Confidence: high for these four memberships; no facsimile claim for their screen layout.

## Mendeleev — first published arrangement, 1869

Primary transcription: [Mendeleev’s German abstract, Zeitschrift für Chemie 12 (1869), pp. 405–406](https://books.google.com/books?id=h5BTAAAAcAAJ&pg=PA405), through [Carmen Giunta’s annotated translation and table](https://web.lemoyne.edu/~giunta/EA/MENDELEEVann.HTML). The rows of the translated table were re-opened and transcribed directly, retaining all six source columns and nineteen rows.

The reconstruction has **66 occupied slots**: 60 single modern-element identities, one shared Ni/Co slot, one historical didymium slot, and four unnamed predictions. That represents 63 historically named entries when Ni and Co are counted separately and didymium is counted as one historical entry. It is not a table of 66 discovered elements. Didymium maps to two modern detail links, Pr and Nd, but has no single atomic number. Combined Ni/Co likewise retains its single source position without being called a chemical compound.

The four prediction weights are 180, 68, 70 and 45; none receives a modern atomic number. All source weight strings, decimal commas, question marks and the labels Ur, J, ?Er, ?Yt and ?In are preserved. The Rh/Ru order, hydrogen’s placement alongside Cu/Ag/Hg, and the unusual rare-earth/uranium positions are not corrected. Modern identity links do not change what the historical cell claims.

Confidence: high for the row/column transcription of the published abstract. This is specifically the 1869 German-abstract layout, not the handwritten preliminary draft or the revised 1871 table. Aspect ratio, card outlines and colours are modern presentation choices.

## Janet — left-step Version III, November 1928

Primary visual transcription: [original Version III scan](https://www.meta-synthesis.com/webbook/35_pt/JanetIII.jpg), linked in the [reference collection’s three-version entry](https://www.meta-synthesis.com/webbook/35_pt/pt_database.php?PT_id=152). The catalog identifies Versions I and II with April 1928 and Version III with November 1928, citing information supplied by Philip Stewart. The full JPEG was downloaded to a temporary research file and visually inspected; no image asset is republished with this reconstruction.

The figure contains **120 numbered positions**, arranged in eight rows of **2, 2, 8, 8, 18, 18, 32, 32**. It separates four blocks: f has 28 slots, d 40, p 36 and s 16. Helium is above beryllium. La and Ac begin the f block; Lu and the unassigned position 103 begin the neighbouring d rows. All blocks are flat in this Version III figure; Janet’s separate cylindrical models are not substituted for it.

The reconstruction retains **30 unnamed positions**: 85, 87, and 93–120. The source prints their numbers and no element symbols. Our question mark and “Unassigned in 1928” label make those blanks accessible, while `sourceNumber` retains the printed position. These records deliberately lack a modern `number`; even modern named elements 93–118 are not inserted retroactively. Positions 119 and 120 also remain anonymous.

Two further records preserve claims rather than assert verified modern identifications: `Ma` at 43 (masurium) and `Fr` at 61 (florentium). In particular, Fr here is not the modern symbol for francium at 87. [The history study of Portuguese periodic charts](https://distantreader.org/stacks/journals/subs/subs-744.pdf) discusses these unconfirmed names and dates; the actual labels in this dataset come from the inspected Janet scan.

The other 88 positions map to current element identities. Source aliases A18, Va23, X54, Tu69, Ny70 and Em86 are retained. Ny at 70 denotes neoytterbium, whose nomenclature history is covered by [Miśkowiec, Foundations of Chemistry](https://doi.org/10.1007/s10698-022-09451-w); this is a historical name for modern ytterbium, unlike the unconfirmed Ma and Fr claims. Current names may accompany source symbols for legibility. No atomic mass or electron configuration is appended to Janet’s original labels.

Confidence: high for numbered membership, block positions, missing-symbol slots and the listed distinct historical aliases. Ordinary unambiguous symbols use the modern dataset. Fine printing irregularities are not imitated. The peripheral French explanatory columns and cylinder-generatrix annotations are described in the history text rather than reconstructed as selectable element cells. Pastel block colours, cell spacing and question-mark markers are modern additions.

## Data contract

Every slot has its own unique `id`, separate from atomic number. `number` is used only for a verified single modern element; `elementNumbers` supplies related modern identities for combined or historical entries. `kind` distinguishes `element`, `composite`, `prediction` and `historical`. `historical: true` prevents the renderer from silently supplementing a source label with current atomic mass or electron configuration. Extra `sourceNumber`, `sourceRow`, `sourceColumn` and `block` fields provide provenance and testable positioning without inventing modern identities.

Focused tests validate memberships, source-sensitive exceptions, row/block counts, finite geometry and non-overlapping hit regions. They deliberately distinguish slot count, historical entry count, and the number of modern detail links.
