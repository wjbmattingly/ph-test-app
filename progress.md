## Anne's requirements vs. what's built

### General goals

| Goal | Status | Notes |
|---|---|---|
| Support historical-geographical research and teaching | ✅ Done | Full platform: Map, Explore, Search, Transcripts |
| Promote spatial thinking and geographic literacy | ✅ Done | Map ↔ testimony tandem view (Explore) makes place central to every interaction |
| Provide foundational data for others' use (no need to recreate datasets) | ✅ Done | Full CSV downloads of SS camps (1,597 sites) and ghettos (1,295 sites), all 194 fields, on the Documentation page, plus a link to the authoritative EHRI archive |
| Connect the mapping platform and testimony search, intuitively | ✅ Done | **Explore** tab: click a testimony result → its named places light up on the map; click a map site → search testimony about it; filter results by place; excerpt- vs. testimony-level place matching |

### Mapping website capabilities

| Capability | Status | Notes |
|---|---|---|
| Clear, easy-to-navigate interface | ✅ Done | Redesigned filter sidebar, hover-grow site circles, padded clicks, click-disambiguation chooser for overlapping sites |
| — Multi-selection variables (Restrictions, etc.) | ✅ Done | Chip-button multi-selects with Select All / Clear |
| — Search for numerical values or spans | ✅ Done | Converted to two-handle **range** sliders (min–max), not just "≥ value" |
| — Search by date spans (no calendar) | ✅ Done | Start/end date sliders; values now display on their own line, formatted ("Jun 24, 1941") instead of raw ISO strings |
| Certainty fields tied to their substantive field | ✅ Done | Certainty badges (e.g., "high certainty") shown next to dates, populations, and labor/epidemic fields in both the map popup and Explore's site panel |
| Single- and multi-value search, with clear AND/OR | ✅ Done | Explicit note now on the map, Search, and Explore pages: *"Filters combine with AND; values within a multi-select combine with OR"* |
| Export whole datasets + documentation | ✅ Done | CSV downloads (camps, ghettos) + full field documentation + EHRI archive link |
| Export maps that answer a query (with the query) + underlying data | ✅ Done | Map page: **Export PNG** (query + count baked into a caption bar), **Export CSV**, **Export GeoJSON** of the sites currently matching the filters and in view. Explore has the same trio. |
| Explore MRE (Mass Removal Events) data | ⛔ **Blocked** | Not yet provided — Anne/Maja are adding it to EHRI in July 2026. Nothing to build against yet, but the config-driven filter system means it can be added later without a redesign. |
| Intuitive display of site count for any query | ✅ Done | Live "**N sites match in view**" readout on the map legend; Explore shows passage/testimony/site counts throughout |
| Distribution of values by region and by time | ✅ Done | **Distributions** panel: histograms recompute for whatever's filtered and currently in view — pan/zoom to a region to see its distribution; pick a year field for the time dimension |
| Time slider to see change over time | ✅ Done | New **"Point in Time"** scrubber — drag through the war years and the map (and site count) update to show only sites that existed on that date |
| Number sliders for changing totals over time/period | 🟡 Partial | The Point-in-Time scrubber + live count together deliver this for *existence over time*. What's **not** built: an animated slider tracking one numeric variable's value changing period-by-period (e.g., watch a specific field's total climb year by year) — a further step if wanted |
| Histograms for a given variable | ✅ Done | Same Distributions panel — start/end/occupation year, duration, populations, testimony mentions, with log-scale bins for skewed values |
