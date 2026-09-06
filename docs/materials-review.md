# Elements — materials review

Reviewed 5 September 2026. This is a discovery record, not a proposal for the new website.

## Reading of the project

The collection points toward a visually engaging exploration of the periodic table: how people discovered and arranged the elements, how electron structure explains patterns, and how individual elements connect to everyday life. That reading comes from the repeated alternative-table references, the timeline, the orbital questions and the existing three-layout prototype. It is an interpretation of the collected material, not an agreed product direction.

## Coverage

The Elements root, its nine direct pages, their four child pages, seven main databases and all 398 records in those seven databases were fetched. Record bodies were checked as well as properties; most are empty. One further inline database under References → Book notes was inspected in desktop Notion after the connector's database-query allowance was exhausted. It displays three unnamed records with empty visible properties; those three record bodies were not opened.

More than 100 linked destinations were attempted. Some sources returned readable text, some only a landing page or abstract, and many old URLs failed or redirected. This is not a claim to have watched every video, read paywalled chapters, or fully exercised every interactive demo. The link inventory records retrieval outcomes. Links inside clipped third-party articles were treated as supporting references, not as an instruction to recursively review the whole web.

No Notion content or application code was edited. The repository already had changes to components/Footer.js and styles/footer.module.css; they were left alone. These review documents are the only additions.

## Notion inventory

| Collection | Records | What is actually there |
| --- | ---: | --- |
| [Elements table](https://www.notion.so/065a0376c0564124a5a8298b3d4c8c37) | 118 | Element identity, naming, group/period, atomic weight, thermal and physical properties, abundance and discovery fields. Many numerical fields are text with units or footnote remnants. |
| [Table Quotes](https://www.notion.so/5ead974eed78494ab11a9294e06dfdb0) | 3 | Two quotations and one blank record. One author is entered as “Sean Kean”; the book credit elsewhere says Sam Kean. |
| [Elements Trivia](https://www.notion.so/c529a6599a06478aa2f6d7e8d8952006) | 121 | 118 element rows plus Quotes, Hydrogen and Heavy Metals. Only five element Quote fields contain material: Bismuth, Antimony, Mercury, Phosphorus and a NASA link for Beryllium. The separate Hydrogen row contains a six-part prose draft. |
| [References](https://www.notion.so/65fa01eda3ba484e8f2a348a495a46c5) | 43 | Scientific explanations, datasets, alternative tables, visual examples and development tutorials; some clipped articles and some empty bookmark records. |
| [Quotes Book](https://www.notion.so/7144b442104d4a5d94f733762a985f30) | 69 | 68 excerpt records plus a source-credit record naming Sam Kean, The Disappearing Spoon, Apple Books. Themes include families, bonding, electrons, nuclei, abundance and element anecdotes. |
| [Variables → Containers](https://www.notion.so/176356873d0342e3bbee839d7e5f1a16) | 18 | Old component/state naming inventory: selected element, adjacent elements, grid positions and orbital selection. |
| [Variables → Components](https://www.notion.so/2cd9fc73fde34a28a119cd7dab97d043) | 26 | Variable inventory for Bohr models, element cards, configurations and miniature navigation. Rename fields are empty. |
| [Book notes → unnamed database](https://www.notion.so/8d2c7566fbca4cfca6ad25b0f8630fed) | 3 shown | Unnamed rows with empty visible properties; record bodies unverified. |

## Pages and themes

- [INSPIRATION](https://www.notion.so/fec431b876804888929ca647e23f512b): ToyFight, Steve Jobs Archive, Offscreen Canvas, Google's A–Z of AI, MasterClass, Virtual Angkor, physical element products and Atilla Taşkıran. A moiré PDF adds a separate visual-effects strand. These are references, not explicit feature requirements.
- [Moodboard](https://www.notion.so/c9f548c4f3654392974e65be2adfa6e7): Offscreen Magazine and Toca Boca, plus a blank child page. The combination suggests editorial care and playful exploration, but there is no written visual brief.
- [3D Blender](https://www.notion.so/a5fc3b033d7940af8788aa9a27a55901): Three.js, React Three Fiber, tutorials and a specific texture/mesh experiment. The note explicitly identifies Victor Temprano's 3D periodic-table project as close to the original ambition.
- [Orbitals](https://www.notion.so/9fe5a245a47747e49ad015b0416ad57f): ChemTube3D, Orbitron, Chemguide, Purdue, Britannica, LibreTexts and videos. The connected “Orbital shapes3D” reference asks why atoms are depicted with unusual shapes and whether those surfaces represent a probability threshold. This is a substantive explanatory question in the research.
- [Ideas](https://www.notion.so/9eff7a4724794842b63f64bf97c8159b): an elements screensaver, particle FAQs, plus separate Playbook and number-site ideas. Their presence does not establish them as website scope.
- [Timeline](https://www.notion.so/c615961f75d24f7ba78f0cfe69225dfb): 27 proposed milestones from 1669 to 2016. The 1932 child is a one-line neutron note. The 2016 child connects superheavy elements, existence and extremely short lifetimes.
- [Code](https://www.notion.so/f5ec8b02e9ef4b6eb6576558cde274e6): Lenis smooth scrolling and Aniso ASCII imagery, including a GitHub reference. Two tweet blocks did not expose readable content.
- [ChatGPT](https://www.notion.so/086f7da7a77c4bbda03d06f265bd9406): a 2023 prompt describing a Next.js history site, a scrolling year sidebar, JSON content, year components and element cards. It contains the introduction, not an entire saved conversation.
- [Netflix’s Playbook](https://www.notion.so/6a2318bbcbda460f8dd75819f577ee65): incomplete coaching notes with a few Doc Rivers timestamps and empty sections for the other coaches. Its bookmark destination remains unresolved.

## Most informative source connections

The [Chemogenesis database](https://www.meta-synthesis.com/webbook/35_pt/pt_database.php) catalogs different table formulations and historical developments. The saved [New Scientist article](https://www.newscientist.com/article/mg24132190-400-three-reasons-why-the-periodic-table-needs-a-redesign/) discusses placement problems and alternatives, including a continuous 32-column arrangement. Together, these explain why table shape is a central subject in the collection.

[Victor Temprano's article](https://www.codementor.io/@victorgerardtemprano/how-i-fell-in-love-with-atoms-and-built-a-3d-periodic-table-in-javascript-f214fz57w) describes the challenge of making an atomic viewer in Three.js. The associated orbital references cover mathematical surfaces and scientific interpretation. [Purdue's quantum-number explanation](https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch6/quantum.php) distinguishes shells, subshells and orientations; [Visionlearning's animation](https://www.visionlearning.com/library/animations/Bohrs_Atom/Bohrs_Atom.html) connects hydrogen energy transitions with emitted light. These serve different explanatory purposes.

The 2016 prose is traceable to the abstract of Eric Scerri's [Synthetic Elements](https://academic.oup.com/book/40719/chapter/348476794), in The Periodic Table: Its Story and Its Significance, published in 2019. The abstract was accessible; the full chapter was not. The paired University of Michigan ultrafast-timescale link could not be retrieved.

The Beryllium row links to [NASA's telescope-spinoff article](https://spinoff.nasa.gov/looking-into-space-pays-off-at-home), including the manufacture of beryllium mirrors. The Heavy Metals page points to [Where did all the gold in the universe come from?](https://thekidshouldseethis.com/post/where-did-gold-come-from-video). These provide concrete examples of the everyday-life and cosmic-origin strands.

The design collection spans [Offscreen's editorial presentation](https://www.offscreenmag.com/), [Toca Boca's play-oriented world](https://www.tocaboca.com/), [Virtual Angkor's thematic history modules](https://www.virtualangkor.com/) and creative coding. [Offscreen Canvas](https://offscreencanvas.com/) contains shader, animation and rendering breakdowns. The [moiré document](https://depts.washington.edu/mictech/optics/me557/moire_a.pdf) is a 77-page engineering lecture on geometric and interferometric methods; it is not periodic-table content.

## Existing repository

Repository: [mediavilla/periodictable](https://github.com/mediavilla/periodictable). Inspected locally, without running or changing it.

- Next.js 13 / React 18, Pages Router, JavaScript and CSS modules. Production configuration uses a static export under /periodictable.
- The home page switches between 18-column, 32-column and racetrack views, with shared element selection and keyboard navigation.
- public/elements.json contains 118 records and 29 fields, including separate layout coordinates, shells, configurations and source links.
- There are 118 individual element components. The Hydrogen prose matches the six-part Notion draft: discovery, name, occurrence, properties, applications and interactions.
- There are 27 timeline components and 27 JSON entries. Some sections are brief scaffolds; 2016 includes element cards and a timescale/animation experiment.
- Element pages combine a card, Bohr illustration, miniature table navigation and prose. The Orbitals component is explicitly a placeholder.
- /elements is a written idea sketch: a date-sensitive bento layout, prominent search and filters for body/Earth/universe, mass and groupings. /about is a placeholder.
- No build or runtime verification was performed; this was a materials review, not a technical audit.

## Content observations to retain for later

The collection has a substantial data base and broad prose coverage in the repository, but the Notion trivia fields are mostly unfilled. These are different layers of completion and should not be conflated.

The historical notes remain drafts. The 1928 entry is visibly cut off in both Notion and JSON. The saved Sutori preview says 1649 for Brand while the written timeline says 1669. A book excerpt refers to 112 known elements, reflecting its historical context. Dates, attributions, numerical data and scientific explanations have not undergone a comprehensive fact-check here.

The excerpt library contains useful themes, but excerpts are not finished original site copy. The source-credit entry supplies the book title; most individual records lack page or edition references. The Table Quotes author spelling also needs reconciliation.

The orbital research and the Bohr illustration represent different models. The old implementation's placeholder does not mean the associated scientific questions were resolved.

## Access gaps

- All seven main database record bodies were fetched; the three unnamed nested records were only inspected at table level.
- Two Code tweets and the Netflix’s Playbook bookmark were not recovered.
- Several videos, tweets, interactive demos and external images were not readable through the available tools. The Orbitals image also visibly fails in Notion.
- Some saved URLs now redirect to different destinations: the old Lenis and Aniso sites lead to Studio Freight; the Aniso repository redirects to darkroomengineering/aniso; one Socratic resource redirects to Google Lens.
- Failed retrieval does not prove that a link is permanently dead. Full reading of inaccessible or paywalled content remains outstanding.

The next conversation can define audience, priorities and website approach from this record. No approach has been selected here.

