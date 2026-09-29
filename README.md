# LineUp for Obsidian Bases

Interactive multi-attribute ranking and visualization view for [Obsidian Bases](https://obsidian.md). Powered by [LineUp.js](https://lineup.js.org). Adapted to Obsidian such that it works interactively and adapts to the installed theme.

## Features

- **Multi-Attribute Ranking**: Rank and compare notes across multiple frontmatter, file metadata, and formula properties.
- **Weighted & Combined Columns**: Create custom composite scores by combining multiple columns with interactive weights and live recalculation.
- **Filtering & Grouping**: Filter, sort, and aggregate notes with instant visual distributions and box plots.
- **Bases Integration**: Integrates directly into Obsidian Bases (`type: lineup`) as a native [view](https://obsidian.md/help/bases/views).
- **Layout & Column Persistence**: Custom columns, weighted sums, sorting, and filter states automatically persist directly into `.base` view configurations.
- **Direct Note Navigation**: Single-click any row to immediately open the note in your workspace.

## Installation

### Obsidian Community Plugin
> [!NOTE]
> Obsidian Community Plugin submission is currently in progress. Until approved, install via GitHub Releases or [BRAT](https://github.com/TfTHacker/obsidian42-brat).

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub Release](https://github.com/albortino/obsidian-lineup/releases).
2. In your Obsidian vault, navigate to `.obsidian/plugins/` and create a folder named `obsidian-lineup`.
3. Copy the three downloaded files into `.obsidian/plugins/obsidian-lineup/`.
4. Reload Obsidian (or reload plugins in **Settings > Community plugins**), then enable **LineUp for Bases**.

## User Guide

### Adding a View to Bases
LineUp for Obsidian adds a dedicated view type for Bases. Simply switch the view to "LineUp" in the view dropdown of your Base, as described in the official [Obsidian Bases documentation](https://obsidian.md/help/bases/views).

It operates as a rich visual layer on top of your `.base` data, inheriting base-level filters while allowing independent interactive filtering, grouping, and multi-attribute sorting.

- **Persistence in Base Views**: Custom ranking columns (e.g., weighted sums), column arrangements, and filter adjustments configured within a Base view are automatically saved to the `.base` file.
- **Live Embeds in Notes**: Using native Bases embed syntax (`![[base.base#LineUp-View]]`), LineUp views can be embedded anywhere in your notes as interactive, read-only exploration views.

### Core Advantages of LineUp over Standard Tables

| Feature                | Standard Table / Dataview                               | LineUp                                                                                      |
| :--------------------- | :------------------------------------------------------ | :------------------------------------------------------------------------------------------ |
| **Sorting**            | Single-column sort (or static secondary sort)           | **Hierarchical & multi-attribute weighted sorting**                                         |
| **Numeric Comparison** | Plain text digits                                       | **Bar lengths, distributions, and min/max domain scaling**                                  |
| **Combined Scores**    | Requires manual formulas (`rating * 0.7 + pages * 0.3`) | **Interactive drag & drop weighted columns with live recalculation**                        |
| **Categorical Data**   | Static tags or text                                     | **Color-coded stacked distributions with multi-select filter histograms**                   |
| **Filtering**          | Static query code (`WHERE ...`)                         | **Live histogram range-sliders & visual checkboxes directly in headers**                    |
| **Grouping & Summary** | Nested list/table sections                              | **Hierarchical row grouping with box plots & aggregate distribution bars**                 |
| **Side-Panel**         | None                                                    | **Collapsible side-panel (`»`/`«`) to inspect distributions and create composite rankings** |
| **Layout Persistence** | Manual query configuration                              | **Automatic view state serialization to `.base` view configuration**                        |
| **Data Safety**        | Read/write risk depending on plugins                    | **100% Live Read-only**                                                                     |

### Technical Highlights

1. **Native Bases Engine Integration**:
   - Built on Obsidian 1.10+ native `.base` data engine.
   - Evaluates formulas (e.g., `formula.stars`), tags (`file.hasTag("book")`), and frontmatter properties.
2. **Layout & State Persistence**:
   - Debounced automatic synchronization of LineUp table configurations (rankings, weights, column order, filters) to `.base` view metadata.
3. **Direct Note Navigation**:
   - Single-click on any row immediately opens the corresponding note (`file.name`) in your active workspace leaf.
4. **Auto-Type Inference & Null Handling**:
   - Distinguishes numeric properties (with proper min/max domains) from categorical strings.
   - Accurately unwraps `NullValue` so missing properties don't corrupt numeric columns or ranking computations.
5. **Drag Auto-Scrolling & Virtual Scrolling**:
   - Handles large vaults smoothly with virtual row rendering and height stabilization (`min-height: 480px`).
   - Automatically scrolls horizontally when dragging column headers near table boundaries.
6. **Theme Synchronization**:
   - Seamlessly synchronizes with Obsidian CSS tokens across light and dark modes for every theme.

## Limitations

* **Note Embed State**:
  - Interactive adjustments made inside embedded LineUp views in markdown notes are held in memory during the session. Changes made directly within the dedicated `.base` file view are fully persistent.
* **Canvas Minimum Dimensions**:
  - In Obsidian Canvas text cards, LineUp requires adequate width and height (at least 480px height) for virtual scrolling and header toolbars.
* **Array / Multi-Value Tags**:
  - Tag lists (`tags: [book, scifi]`) are unwrapped as strings by Bases; for discrete categorical filtering in LineUp, dedicated single-value scalar properties (like `genre`, `status`, `format`) provide the best visual experience.


## Use-Cases
### Analysis of a Book Base
Assume we have a `Bases` table called `Books` with the following columns:
- `title`
- `rating`
- `pages`
- `author`
- `genre`
- `status`
- `format` 

#### Question A: "Which book should I read next?" (Multi-Attribute Decision)
* **Problem**: A book rated 5 stars with 900 pages might be too lengthy for a short holiday trip, whereas a short 100-page book rated 2 stars isn't worth reading.
* **Solution in LineUp**:
  1. In the LineUp table, open the side-panel using the toggle icon (`»`) or click the column addition menu (`+`).
  2. Create a **Weighted Sum Column**.
  3. Drag and drop `Rating (1-5)` (e.g., 60% weight) and `Pages` (inverted or 40% weight) into it.
  4. The rows instantly re-rank according to the calculated composite score.

#### Question B: "Which long science fiction books haven't I started yet?"
* **Solution in LineUp**:
  1. **Genre Filter**: Hover over the `Genre` column header, click the filter icon, and check only `Science-Fiction` (or `Science`).
  2. **Status Filter**: In `Status`, filter by `Wishlist`.
  3. **Pages Sort**: Click the `Pages` column header to sort descending.
  4. **Histogram**: The header histogram immediately visualizes the page count distribution of the filtered subset.

#### Question C: "How is my reading progress distributed across different formats?"
* **Solution in LineUp**:
  1. Locate the `Format` column (`Paperback`, `Hardbound`, `Hardcover`, `E-Book`).
  2. Click the group icon in the `Format` column header to **group rows by format**.
  3. LineUp automatically aggregates numeric attributes (`Progress (%)`, `Pages`, `Price`) per group into visual box plots and aggregate bars.


## Credits & Related Publications

This plugin is built on the [LineUp.js](https://lineup.js.org) library by the Caleydo team.

If you use LineUp for research, please cite:

- **LineUp: Visual Analysis of Multi-Attribute Rankings** ([Paper](http://data.caleydo.org/papers/2013_infovis_lineup.pdf) | [Website](http://caleydo.org/publications/2013_infovis_lineup/))  
  Samuel Gratzl, Alexander Lex, Nils Gehlenborg, Hanspeter Pfister, and Marc Streit.  
  *IEEE Transactions on Visualization and Computer Graphics (InfoVis '13)*, 19(12), pp. 2277–2286, [doi:10.1109/TVCG.2013.173](https://dx.doi.org/10.1109/TVCG.2013.173), 2013.  
  *(IEEE VIS InfoVis 2013 Best Paper Award)*

- **Taggle: Scalable Visualization of Tabular Data through Aggregation** ([Paper Preprint](http://data.caleydo.org/papers/2019_sage_infovis_taggle.pdf) | [Website](http://caleydo.org/publications/2019_sage_infovis_taggle/))  
  Katarina Furmanova, Samuel Gratzl, Holger Stitz, Thomas Zichner, Miroslava Jaresova, Martin Ennemoser, Alexander Lex, and Marc Streit.  
  *Information Visualization*, 19(2): 114–136, [doi:10.1177/1473871619878085](https://dx.doi.org/10.1177/1473871619878085), 2019.

## License

[MIT License](LICENSE)
