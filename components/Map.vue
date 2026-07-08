<template>
  <div class="map-container">
    <!-- Floating menu -->
    <aside class="left-sidebar" v-if="config">
      <h3>Select Data</h3>

      <!-- Transcripts Filter -->
      <details class="dataset-section transcripts-section">
        <summary>{{ sectionLabels.transcripts }}</summary>
        <div class="filter-control">
          <label for="mentioned_in_transcripts">Mentioned in Transcripts</label>
          <select
            id="mentioned_in_transcripts"
            v-model="filterValues.mentioned_in_transcripts"
            @change="updateFilters"
          >
            <option value="">All</option>
            <option :value="true">Yes</option>
            <option :value="false">No</option>
          </select>
          <p class="filter-note">
            {{ mentionedCount.toLocaleString() }} of {{ totalSiteCount.toLocaleString() }} sites are named
            in the {{ transcriptTotal }} USHMM testimonies.
          </p>
        </div>
      </details>

      <hr class="section-divider" />

      <!-- Point in time -->
      <details class="dataset-section time-section" open>
        <summary>Point in Time</summary>
        <div class="filter-control">
          <label class="snapshot-toggle">
            <input v-model="snapshotOn" type="checkbox" @change="updateFilters" />
            Show only sites existing on…
          </label>
          <div class="slider-value" :class="{ dim: !snapshotOn }">{{ prettyDateMs(snapshotMs) }}</div>
          <input
            type="range"
            v-model.number="snapshotMs"
            :min="snapshotMinMs"
            :max="snapshotMaxMs"
            step="86400000"
            :disabled="!snapshotOn"
            @input="updateFilters"
          />
          <p class="filter-note">
            Drag to scrub through the war years; the map and the site count update as you move.
            Sites without a known start date are hidden while this is on.
          </p>
        </div>
      </details>

      <hr class="section-divider" />

      <!-- Camps controls -->
      <details class="dataset-section camps-section">
        <summary>{{ sectionLabels.camp }}</summary>
        <div class="dataset-controls">
          <div
            v-for="ctrl in config.fieldControlsByDataset.camp"
            :key="ctrl.field"
            class="filter-control"
          >
            <!-- Multi-select as collapsible buttons (collapsed by default) -->
            <details v-if="ctrl.type === 'multi-select'" class="control-collapsible">
              <summary class="control-summary">
                <span class="filter-label">{{ ctrl.label }}</span>
                <span class="summary-count">
                  ({{ (filterValues[ctrl.field] || []).length }}/{{ (filterOptions[ctrl.field] || []).length }})
                </span>
              </summary>

              <div class="multi-select">
                <div class="multi-buttons">
                  <button
                    v-for="opt in filterOptions[ctrl.field]"
                    :key="opt"
                    type="button"
                    :class="{ selected: filterValues[ctrl.field].includes(opt) }"
                    @click="toggleMultiSelect(ctrl.field, opt)"
                  >
                    {{ opt }}
                  </button>
                </div>
                <div class="multi-actions">
                  <button type="button" @click="selectAll(ctrl.field)">Select All</button>
                  <button type="button" @click="clearAll(ctrl.field)">Clear</button>
                </div>
              </div>
            </details>

            <!-- Dropdown -->
            <div v-else-if="ctrl.type === 'dropdown'">
              <label :for="ctrl.field">{{ ctrl.label }}</label>
              <select
                :id="ctrl.field"
                v-model="filterValues[ctrl.field]"
                @change="updateFilters"
              >
                <option value="">All</option>
                <option
                  v-for="opt in filterOptions[ctrl.field]"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
            </div>

            <!-- Sliders -->
            <div v-else-if="ctrl.type === 'slider' || ctrl.type === 'time-slider'" class="filter-control">
              <label class="slider-label" :for="ctrl.field">{{ ctrl.label }}</label>

              <!-- numeric span: two handles (from / to) -->
              <template v-if="ctrl.type === 'slider'">
                <div class="slider-value">{{ rangeText(ctrl.field) }}</div>
                <div class="range-pair">
                  <input
                    type="range"
                    :id="ctrl.field"
                    v-model.number="filterValues[ctrl.field].lo"
                    :min="getMin(ctrl.field)"
                    :max="getMax(ctrl.field)"
                    step="1"
                    :disabled="!hasRange(ctrl.field)"
                    @input="onRangeInput(ctrl.field, 'lo')"
                  />
                  <input
                    type="range"
                    v-model.number="filterValues[ctrl.field].hi"
                    :min="getMin(ctrl.field)"
                    :max="getMax(ctrl.field)"
                    step="1"
                    :disabled="!hasRange(ctrl.field)"
                    @input="onRangeInput(ctrl.field, 'hi')"
                  />
                </div>
              </template>

              <!-- date slider -->
              <template v-else>
                <div class="slider-value">{{ prettyDateMs(filterValues[ctrl.field]) }}</div>
                <input
                  type="range"
                  :id="ctrl.field"
                  v-model.number="filterValues[ctrl.field]"
                  :min="getMin(ctrl.field)"
                  :max="getMax(ctrl.field)"
                  step="86400000"
                  :disabled="!hasRange(ctrl.field)"
                  @input="onSliderInput(ctrl.field)"
                  @change="onSliderChange(ctrl.field)"
                />
              </template>
            </div>
          </div>
        </div>
      </details>

      <hr class="section-divider" />

      <!-- Ghettos controls -->
      <details class="dataset-section ghettos-section">
        <summary>{{ sectionLabels.ghetto }}</summary>
        <div class="dataset-controls">
          <div
            v-for="ctrl in config.fieldControlsByDataset.ghetto"
            :key="ctrl.field"
            class="filter-control"
          >
            <!-- Multi-select as collapsible buttons (collapsed by default) -->
            <details v-if="ctrl.type === 'multi-select'" class="control-collapsible">
              <summary class="control-summary">
                <span class="filter-label">{{ ctrl.label }}</span>
                <span class="summary-count">
                  ({{ (filterValues[ctrl.field] || []).length }}/{{ (filterOptions[ctrl.field] || []).length }})
                </span>
              </summary>

              <div class="multi-select">
                <div class="multi-buttons">
                  <button
                    v-for="opt in filterOptions[ctrl.field]"
                    :key="opt"
                    type="button"
                    :class="{ selected: filterValues[ctrl.field].includes(opt) }"
                    @click="toggleMultiSelect(ctrl.field, opt)"
                  >
                    {{ opt }}
                  </button>
                </div>
                <div class="multi-actions">
                  <button type="button" @click="selectAll(ctrl.field)">Select All</button>
                  <button type="button" @click="clearAll(ctrl.field)">Clear</button>
                </div>
              </div>
            </details>

            <!-- Dropdown -->
            <div v-else-if="ctrl.type === 'dropdown'">
              <label :for="ctrl.field">{{ ctrl.label }}</label>
              <select
                :id="ctrl.field"
                v-model="filterValues[ctrl.field]"
                @change="updateFilters"
              >
                <option value="">All</option>
                <option
                  v-for="opt in filterOptions[ctrl.field]"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
            </div>

            <!-- (If you add sliders to ghetto dataset, they render here too) -->
            <div v-else-if="ctrl.type === 'slider' || ctrl.type === 'time-slider'" class="filter-control">
              <label class="slider-label" :for="ctrl.field">{{ ctrl.label }}</label>

              <!-- numeric span: two handles (from / to) -->
              <template v-if="ctrl.type === 'slider'">
                <div class="slider-value">{{ rangeText(ctrl.field) }}</div>
                <div class="range-pair">
                  <input
                    type="range"
                    :id="ctrl.field"
                    v-model.number="filterValues[ctrl.field].lo"
                    :min="getMin(ctrl.field)"
                    :max="getMax(ctrl.field)"
                    step="1"
                    :disabled="!hasRange(ctrl.field)"
                    @input="onRangeInput(ctrl.field, 'lo')"
                  />
                  <input
                    type="range"
                    v-model.number="filterValues[ctrl.field].hi"
                    :min="getMin(ctrl.field)"
                    :max="getMax(ctrl.field)"
                    step="1"
                    :disabled="!hasRange(ctrl.field)"
                    @input="onRangeInput(ctrl.field, 'hi')"
                  />
                </div>
              </template>

              <!-- date slider -->
              <template v-else>
                <div class="slider-value">{{ prettyDateMs(filterValues[ctrl.field]) }}</div>
                <input
                  type="range"
                  :id="ctrl.field"
                  v-model.number="filterValues[ctrl.field]"
                  :min="getMin(ctrl.field)"
                  :max="getMax(ctrl.field)"
                  step="86400000"
                  :disabled="!hasRange(ctrl.field)"
                  @input="onSliderInput(ctrl.field)"
                  @change="onSliderChange(ctrl.field)"
                />
              </template>
            </div>
          </div>
        </div>
      </details>
      <hr class="section-divider" />

      <!-- Distributions -->
      <details class="dataset-section charts-section">
        <summary>Distributions</summary>
        <div class="filter-control">
          <label for="hist-field">Variable</label>
          <select id="hist-field" v-model="histField" @change="computeHistogram">
            <option value="">Choose a variable…</option>
            <option v-for="f in histFields" :key="f.field" :value="f.field">{{ f.label }}</option>
          </select>
          <p class="filter-note">Counts reflect the current filters and the visible map area — pan or zoom to a region to see its distribution.</p>

          <div v-if="histData && histData.bins.length" class="hist">
            <div v-for="bin in histData.bins" :key="bin.label" class="hist-row">
              <span class="hist-label">{{ bin.label }}</span>
              <span class="hist-bar-wrap">
                <span class="hist-bar" :style="{ width: Math.max(2, Math.round(bin.count / histData.max * 100)) + '%' }"></span>
              </span>
              <span class="hist-count">{{ bin.count.toLocaleString() }}</span>
            </div>
            <p class="filter-note">{{ histData.total.toLocaleString() }} sites with values in view</p>
          </div>
          <p v-else-if="histField" class="filter-note"><em>No values among the sites in view.</em></p>
        </div>
      </details>
    </aside>

    <!-- Legend Floating Top-Right -->
    <div class="legend-floating" ref="legend">
      <div class="legend-header">
        <h3>Legend</h3>
        <button class="clear-filters-btn" type="button" @click="resetFilters">Clear filters</button>
      </div>
      <div class="legend-item">
        <span class="color-circle" style="background:#AA66CD;"></span> Ghetto
      </div>
      <div class="legend-item">
        <span class="color-circle" style="background:#FFAA00;"></span> Camp / Subcamp
      </div>
      <div class="legend-item">
        <span class="color-circle" style="background:#FF5733;"></span> Death Camp
      </div>
      <div class="legend-item">
        <span class="color-circle" style="background:#888888;"></span> Other
      </div>

      <!-- Match count -->
      <div class="match-count">
        <strong>{{ matchCount == null ? '…' : matchCount.toLocaleString() }}</strong>
        {{ matchCount === 1 ? 'site matches' : 'sites match' }} in view
      </div>

      <!-- Current query moved here -->
      <div v-if="filterDescription" class="current-query in-legend">
        <h4>Current Query</h4>
        <p>{{ filterDescription }}</p>
        <p class="semantics-note">Filters combine with AND; values within a multi-select combine with OR.</p>
      </div>

      <div class="legend-exports">
        <span class="export-label">Export:</span>
        <button type="button" @click="exportMapPng">Map PNG</button>
        <button type="button" @click="exportFilteredSites('csv')">CSV</button>
        <button type="button" @click="exportFilteredSites('geojson')">GeoJSON</button>
      </div>
    </div>

    <!-- Map -->
    <div ref="mapContainer" class="map"></div>

    <!-- Overlapping-sites chooser -->
    <div v-if="popupChoices" class="popup site-chooser" :style="popupStyle">
      <h3 class="popup-title">{{ popupChoices.length }} sites here</h3>
      <p class="chooser-hint">Several sites overlap at this point — pick one:</p>
      <button
        v-for="choice in popupChoices"
        :key="choice.SiteName"
        type="button"
        class="site-choice"
        @click="pickPopupChoice(choice)"
      >
        <strong>{{ choice.SiteName }}</strong>
        <span class="site-choice-type">{{ choice.SiteType }}</span>
      </button>
      <button @click="popupChoices = null" class="popup-close">Close</button>
    </div>

    <!-- Popup (below legend, floating & scrollable) -->
    <div
      v-if="popupVisible && !popupChoices"
      class="popup"
      :style="popupStyle"
    >
      <h3 class="popup-title">{{ popupData.SiteName }}</h3>
      <dl class="popup-details">
        <div class="popup-field">
          <dt>Type</dt>
          <dd>{{ popupData.SiteType }}</dd>
        </div>
        <div class="popup-field" v-if="popupData.EncyStruc">
          <dt>Encyclopedia Structure</dt>
          <dd>{{ popupData.EncyStruc }}</dd>
        </div>

        <!-- Dataset-specific fields -->
        <div
          v-for="entry in popupFieldEntries"
          :key="entry.label"
          class="popup-field"
        >
          <dt>{{ entry.label }}</dt>
          <dd v-if="entry.fmt.kind === 'list'" class="val-pills">
            <span v-for="item in entry.fmt.items" :key="item" class="val-pill">{{ item }}</span>
            <span v-if="entry.cert" class="cert-badge" :title="'Certainty of this value: ' + entry.cert">{{ entry.cert }}</span>
          </dd>
          <dd v-else>
            {{ entry.fmt.text }}
            <span v-if="entry.cert" class="cert-badge" :title="'Certainty of this value: ' + entry.cert">{{ entry.cert }}</span>
          </dd>
        </div>

        <!-- Testimony references -->
        <div v-if="isMentioned(popupData)" class="popup-field transcript-field">
          <dt>Testimony references</dt>
          <dd>
            Named in {{ mentionInfo(popupData).transcripts }}
            {{ mentionInfo(popupData).transcripts === 1 ? 'testimony' : 'testimonies' }}
            ({{ mentionInfo(popupData).occurrences }} passages)
          </dd>
        </div>
        <div v-if="isMentioned(popupData) && transcriptLink" class="popup-field transcript-field">
          <dt>Transcript</dt>
          <dd>
            <a :href="transcriptLink" class="transcript-link">Explore testimony about this place</a>
          </dd>
        </div>
      </dl>
      <button @click="closePopup" class="popup-close">Close</button>
    </div>
  </div>
</template>

<script>
import maplibre from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import config from '@/static/data/map-config.json';
import { formatSiteValue, certaintyFor } from '@/utils/siteValueFormat';
import mentionsFile from '@/static/data/testimony-mentions.json';

// Locally computed testimony references (see README: testimony mentions).
// Keys are raw SiteName values from the tiles, padding intact, so they can
// be matched against feature properties with exact equality. This replaces
// the stale mentioned_in_transcripts/transcript_mention_count baked into
// the tiles, which missed diacritic names (Kraków, Łódź, Riga...) and all
// of Auschwitz.
const MENTIONS = mentionsFile.sites || {};
const MENTIONED_NAMES = Object.keys(MENTIONS);

// --- ISO date handling + defaults for time sliders ---
const DEFAULT_DATE_START = '1933-02-01';
const DEFAULT_DATE_END   = '1945-05-05';
const BASE_PATH = process.env.NUXT_PUBLIC_BASE_PATH || '';

function dateStrToMs(s) {
  if (!s) return NaN;
  const t = Date.parse(s); // expects YYYY-MM-DD
  return Number.isNaN(t) ? NaN : t;
}
function msToDateStr(ms) {
  if (ms == null || Number.isNaN(Number(ms))) return '';
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

export default {
  name: 'Map',
  props: {
    mapStyle: { type: String, default: 'https://demotiles.maplibre.org/style.json' },
    center:    { type: Array,  default: () => [15.2551, 52.5200] },
    zoom:      { type: Number, default: 4 }
  },
  data() {
    // Clone config and make dataset-specific field keys so camp/ghetto filters don't bleed into each other
    const configClone = JSON.parse(JSON.stringify(config));
    ['camp', 'ghetto'].forEach(ds => {
      configClone.fieldControlsByDataset[ds] = (configClone.fieldControlsByDataset[ds] || []).map(ctrl => {
        return {
          ...ctrl,
          dataField: ctrl.field,
          field: `${ds}__${ctrl.field}`
        };
      });
    });

    const values = {};
    const options = {};
    const allCtrls = [
      ...configClone.dropdownFilters,
      ...Object.values(configClone.fieldControlsByDataset).flat()
    ];

    allCtrls.forEach(ctrl => {
      if (ctrl.type === 'multi-select') {
        values[ctrl.field] = [];
        options[ctrl.field] = ctrl.options || [];
      } else if (ctrl.type === 'slider') {
        if (ctrl.options?.min != null && ctrl.options?.max != null) {
          const lo = Number(ctrl.options.min);
          const hi = Number(ctrl.options.max);
          values[ctrl.field] = { lo, hi };
          options[ctrl.field] = { min: lo, max: hi };
        } else {
          values[ctrl.field] = { lo: null, hi: null };
          options[ctrl.field] = { min: null, max: null };
        }
      } else if (ctrl.type === 'time-slider') {
        // Convert provided YYYY-MM-DD (if any) to ms; fallback to defaults
        let minStr = ctrl.options?.min ?? ctrl.options?.start;
        let maxStr = ctrl.options?.max ?? ctrl.options?.end;
        if (minStr == null || maxStr == null) {
          minStr = DEFAULT_DATE_START;
          maxStr = DEFAULT_DATE_END;
        }
        const minMs = dateStrToMs(minStr);
        const maxMs = dateStrToMs(maxStr);
        const finalMin = Number.isNaN(minMs) ? dateStrToMs(DEFAULT_DATE_START) : minMs;
        const finalMax = Number.isNaN(maxMs) ? dateStrToMs(DEFAULT_DATE_END)   : maxMs;
        values[ctrl.field]  = finalMin; // initialize at min (won't filter until moved)
        options[ctrl.field] = { min: finalMin, max: finalMax, __isTime: true };
      } else {
        values[ctrl.field] = '';
        options[ctrl.field] = ctrl.options || [];
      }
    });

    // transcripts boolean selector
    values.mentioned_in_transcripts = '';
    options.mentioned_in_transcripts = [true, false];

    return {
      config: configClone,
      filterValues: values,
      filterOptions: options,
      sectionLabels: { camp: 'Camps', ghetto: 'Ghettos', transcripts: 'Transcripts' },
      map: null,
      matchCount: null,
      snapshotOn: false,
      snapshotMs: dateStrToMs('1942-01-01'),
      snapshotMinMs: dateStrToMs(DEFAULT_DATE_START),
      snapshotMaxMs: dateStrToMs(DEFAULT_DATE_END),
      popupChoices: null,
      histField: '',
      histData: null,
      histFields: [
        { field: 'StartMidYear', label: 'Start year', kind: 'year' },
        { field: 'EndMidYear', label: 'End year', kind: 'year' },
        { field: 'GerOcMidYear', label: 'German occupation year', kind: 'year' },
        { field: 'DurMid', label: 'Duration (days)', kind: 'number' },
        { field: 'GPopMax', label: 'Max ghetto population', kind: 'number' },
        { field: 'PMaxPop', label: 'Max camp population', kind: 'number' },
        { field: '__mentions', label: 'Testimonies naming the site', kind: 'number' }
      ],
      popupVisible: false,
      popupData: {},
      filterDescription: '',
      legendHeight: 0,
      msToDateStr // expose for template label
    };
  },
  computed: {
    mentionedCount() {
      return MENTIONED_NAMES.length;
    },
    totalSiteCount() {
      return 2892; // unique SiteName values in the gazetteer tiles
    },
    transcriptTotal() {
      return 979;
    },
    popupStyle() {
      const top = this.legendHeight ? this.legendHeight + 28 : 80;
      return {
        top: `${top}px`,
        right: '20px',
        maxHeight: `calc(100vh - ${top + 20}px)`,
        overflow: 'auto'
      };
    },
    popupFieldEntries() {
      if (!this.popupData) return [];
      const st = (this.popupData.SiteType || '').toLowerCase();
      let ctrls = [];
      if (st === 'ghetto') ctrls = this.config.fieldControlsByDataset.ghetto || [];
      else if (st.includes('camp')) ctrls = this.config.fieldControlsByDataset.camp || [];

      return ctrls
        .map(ctrl => {
          const val = this.popupData[ctrl.dataField] ?? this.popupData[ctrl.field];
          return { label: ctrl.label, value: val, dataField: ctrl.dataField || ctrl.field };
        })
        .filter(entry => this.isDisplayValue(entry.value))
        .map(entry => ({
          ...entry,
          fmt: formatSiteValue(entry.value),
          cert: certaintyFor(this.popupData, entry.dataField)
        }));
    },
    transcriptLink() {
      if (!this.isMentioned(this.popupData)) return '';
      // SiteName values can carry trailing padding (spaces/NBSP) in the tiles
      const name = (this.popupData?.SiteName || '').replace(/\u00a0/g, ' ').trim();
      const q = encodeURIComponent(name);
      return `${BASE_PATH}/explore?q=${q}`;
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.measureLegend();
      window.addEventListener('resize', this.measureLegend);
    });
    this.initMap();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.measureLegend);
  },
  methods: {
    isControlActive(ctrl) {
      const v = this.filterValues[ctrl.field];
      const opts = this.filterOptions[ctrl.field];
      if (ctrl.type === 'dropdown') return v !== '';
      if (ctrl.type === 'multi-select') return Array.isArray(v) && v.length > 0;
      if (ctrl.type === 'slider') {
        if (!v || opts?.min == null || opts?.max == null) return false;
        return Number(v.lo) > Number(opts.min) || Number(v.hi) < Number(opts.max);
      }
      if (ctrl.type === 'time-slider') {
        const min = opts?.min;
        return v != null && min != null && Number(v) > Number(min);
      }
      return false;
    },
    slugify(text) {
      const base = (text || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      return base || 'value';
    },
    // ---- slider enable/guard helpers ----
    hasRange(field) {
      const o = this.filterOptions[field];
      return o && o.min != null && o.max != null && Number.isFinite(o.min) && Number.isFinite(o.max) && o.max > o.min;
    },
    getMin(field) {
      const o = this.filterOptions[field];
      return (o && o.min != null) ? Number(o.min) : 0;
    },
    getMax(field) {
      const o = this.filterOptions[field];
      return (o && o.max != null) ? Number(o.max) : 0;
    },
    clampToRange(field, val) {
      const min = this.getMin(field);
      const max = this.getMax(field);
      if (!this.hasRange(field)) return val;
      if (val < min) return min;
      if (val > max) return max;
      return val;
    },
    isDisplayValue(val) {
      if (val === undefined || val === null) return false;
      const s = String(val).trim();
      if (!s) return false;
      const falsy = ['false', 'FALSE', 'False', '0'];
      return !falsy.includes(s);
    },
    isMentioned(data) {
      return !!(data?.SiteName && MENTIONS[data.SiteName]);
    },
    mentionInfo(data) {
      return (data?.SiteName && MENTIONS[data.SiteName]) || null;
    },
    onRangeInput(field, which) {
      const v = this.filterValues[field];
      if (!v) return;
      // keep the pair ordered: the handle being dragged pushes the other
      if (Number(v.lo) > Number(v.hi)) {
        if (which === 'lo') this.$set(v, 'hi', v.lo);
        else this.$set(v, 'lo', v.hi);
      }
      this.updateFilters();
    },

    rangeText(field) {
      const v = this.filterValues[field];
      if (!v || v.lo == null) return '—';
      return `${Number(v.lo).toLocaleString()} – ${Number(v.hi).toLocaleString()}`;
    },

    prettyDateMs(ms) {
      if (ms == null || Number.isNaN(Number(ms))) return '—';
      const d = new Date(Number(ms));
      if (Number.isNaN(d.getTime())) return '—';
      const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${M[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    },

    onSliderInput(field) {
      const v = Number(this.filterValues[field]);
      const clamped = this.clampToRange(field, v);
      if (clamped !== v) this.$set(this.filterValues, field, clamped);
      const ctrl = [...this.config.dropdownFilters, ...Object.values(this.config.fieldControlsByDataset).flat()].find(c => c.field === field);
      if (ctrl && ctrl.type === 'time-slider') return; // defer update to change to reduce jitter
      this.updateFilters();
    },
    onSliderChange(field) {
      const v = Number(this.filterValues[field]);
      const clamped = this.clampToRange(field, v);
      if (clamped !== v) this.$set(this.filterValues, field, clamped);
      this.updateFilters();
    },

    // ---- clear filters ----
    resetFilters() {
      const values = this.filterValues;
      const options = this.filterOptions;

      // dropdowns & multi-selects
      this.config.dropdownFilters.forEach(c => {
        if (c.type === 'multi-select') this.$set(values, c.field, []);
        else if (c.type === 'dropdown') this.$set(values, c.field, '');
        else if (c.type === 'slider') {
          const min = (options[c.field]?.min != null) ? Number(options[c.field].min) : null;
          const max = (options[c.field]?.max != null) ? Number(options[c.field].max) : null;
          this.$set(values, c.field, { lo: min, hi: max });
        } else if (c.type === 'time-slider') {
          const min = (options[c.field]?.min != null) ? Number(options[c.field].min) : dateStrToMs(DEFAULT_DATE_START);
          this.$set(values, c.field, min); // value==min -> no filter
        }
      });

      Object.values(this.config.fieldControlsByDataset).flat().forEach(c => {
        if (c.type === 'multi-select') this.$set(values, c.field, []);
        else if (c.type === 'dropdown') this.$set(values, c.field, '');
        else if (c.type === 'slider') {
          const min = (options[c.field]?.min != null) ? Number(options[c.field].min) : null;
          const max = (options[c.field]?.max != null) ? Number(options[c.field].max) : null;
          this.$set(values, c.field, { lo: min, hi: max });
        } else if (c.type === 'time-slider') {
          const min = (options[c.field]?.min != null) ? Number(options[c.field].min) : dateStrToMs(DEFAULT_DATE_START);
          this.$set(values, c.field, min);
        }
      });

      // transcripts
      this.$set(values, 'mentioned_in_transcripts', '');

      // point in time
      this.snapshotOn = false;

      this.updateFilters();
    },

    filteredFeaturesInView() {
      if (!this.map || !this.map.getLayer('gazetteer')) return [];
      const feats = this.map.queryRenderedFeatures({ layers: ['gazetteer'] });
      const seen = new Set();
      const unique = [];
      for (const f of feats) {
        const name = f.properties?.SiteName;
        if (!name || seen.has(name)) continue;
        seen.add(name);
        unique.push(f);
      }
      return unique;
    },

    updateMatchCount() {
      this.matchCount = this.filteredFeaturesInView().length;
    },

    downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },

    exportQuerySummary() {
      return this.filterDescription || 'no filters (all sites)';
    },

    // Current map view as a PNG with the query written into a caption bar.
    exportMapPng() {
      if (!this.map) return;
      this.map.once('render', () => {
        const src = this.map.getCanvas();
        const scale = window.devicePixelRatio || 1;
        const lines = [
          `Query: ${this.exportQuerySummary()}`,
          `${(this.matchCount ?? 0).toLocaleString()} sites in view · Filters AND, multi-select values OR`,
          `Exported ${new Date().toISOString().slice(0, 10)} · placingtheholocaust.org`
        ];
        const lineH = 22 * scale;
        const padY = 14 * scale;
        const capH = lines.length * lineH + padY * 2;
        const out = document.createElement('canvas');
        out.width = src.width;
        out.height = src.height + capH;
        const ctx = out.getContext('2d');
        ctx.drawImage(src, 0, 0);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, src.height, out.width, capH);
        ctx.strokeStyle = '#dddddd';
        ctx.beginPath();
        ctx.moveTo(0, src.height + 0.5);
        ctx.lineTo(out.width, src.height + 0.5);
        ctx.stroke();
        ctx.fillStyle = '#111111';
        ctx.font = `${13 * scale}px sans-serif`;
        lines.forEach((line, i) => {
          ctx.fillText(line, 14 * scale, src.height + padY + (i + 0.8) * lineH - lineH * 0.25);
        });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        out.toBlob(blob => {
          if (blob) this.downloadBlob(blob, `placing-holocaust-map-${stamp}.png`);
        }, 'image/png');
      });
      this.map.triggerRepaint();
    },

    // Filtered sites in view with full attributes, as CSV or GeoJSON.
    exportFilteredSites(format) {
      const feats = this.filteredFeaturesInView();
      if (!feats.length) return;
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (format === 'geojson') {
        const fc = {
          type: 'FeatureCollection',
          query: this.exportQuerySummary(),
          exported_at: new Date().toISOString(),
          note: 'Sites matching the query within the exported map view',
          features: feats.map(f => ({
            type: 'Feature',
            geometry: f.geometry,
            properties: f.properties
          }))
        };
        this.downloadBlob(
          new Blob([JSON.stringify(fc)], { type: 'application/geo+json' }),
          `placing-holocaust-sites-${stamp}.geojson`
        );
        return;
      }
      // CSV over the union of all attribute keys
      const keys = [...new Set(feats.flatMap(f => Object.keys(f.properties || {})))].sort();
      const esc = (v) => {
        const str = (v ?? '').toString();
        return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
      };
      const lines = [
        `# Query: ${this.exportQuerySummary()}`,
        `# Exported: ${new Date().toISOString()} — sites matching the query within the map view`,
        keys.join(','),
        ...feats.map(f => keys.map(k => esc(f.properties[k])).join(','))
      ];
      this.downloadBlob(
        new Blob([lines.join('\n')], { type: 'text/csv' }),
        `placing-holocaust-sites-${stamp}.csv`
      );
    },

    computeHistogram() {
      if (!this.histField || !this.map || !this.map.getLayer('gazetteer')) {
        this.histData = null;
        return;
      }
      const spec = this.histFields.find(f => f.field === this.histField);
      const feats = this.map.queryRenderedFeatures({ layers: ['gazetteer'] });
      const seen = new Set();
      const vals = [];
      for (const f of feats) {
        const name = f.properties?.SiteName;
        if (!name || seen.has(name)) continue;
        seen.add(name);
        let v;
        if (this.histField === '__mentions') {
          v = MENTIONS[name] ? MENTIONS[name].transcripts : null;
        } else {
          v = Number(f.properties[this.histField]);
        }
        if (v != null && Number.isFinite(v) && v > 0) vals.push(v);
      }
      if (!vals.length) {
        this.histData = { bins: [], total: 0, max: 0 };
        return;
      }
      vals.sort((a, b) => a - b);
      const min = vals[0];
      const max = vals[vals.length - 1];
      let bins;
      if (spec.kind === 'year') {
        // one bin per year (grouped when the span is very wide)
        const span = max - min + 1;
        const step = Math.max(1, Math.ceil(span / 20));
        bins = [];
        for (let start = min; start <= max; start += step) {
          const end = start + step - 1;
          bins.push({
            label: step === 1 ? String(start) : `${start}–${end}`,
            count: vals.filter(v => v >= start && v <= end).length
          });
        }
        // stray outlier years produce long empty tails — trim them
        while (bins.length && bins[0].count === 0) bins.shift();
        while (bins.length && bins[bins.length - 1].count === 0) bins.pop();
      } else if (max / Math.max(min, 1) > 50) {
        // heavily skewed values (populations): logarithmic bins (1–3–10)
        const edges = [];
        let e = Math.pow(10, Math.floor(Math.log10(Math.max(min, 1))));
        while (e <= max * 3) {
          edges.push(e, e * 3);
          e *= 10;
        }
        const bounds = edges.filter(x => x * 3 >= min && x / 3 <= max);
        const fmt = (x) => Math.round(x).toLocaleString();
        bins = [];
        for (let i = 0; i < bounds.length - 1; i++) {
          const lo = bounds[i];
          const hi = bounds[i + 1];
          const count = vals.filter(v => v >= lo && (i === bounds.length - 2 ? v <= max : v < hi)).length;
          bins.push({ label: `${fmt(lo)}–${fmt(Math.min(hi, max))}`, count });
        }
        while (bins.length && bins[0].count === 0) bins.shift();
        while (bins.length && bins[bins.length - 1].count === 0) bins.pop();
      } else {
        // ~10 linear bins over the value range
        const nBins = Math.min(10, vals.length);
        const width = (max - min) / nBins || 1;
        bins = [];
        for (let i = 0; i < nBins; i++) {
          const lo = min + i * width;
          const hi = i === nBins - 1 ? max : min + (i + 1) * width;
          const fmt = (x) => Math.round(x).toLocaleString();
          bins.push({
            label: `${fmt(lo)}–${fmt(hi)}`,
            count: vals.filter(v => v >= lo && (i === nBins - 1 ? v <= hi : v < hi)).length
          });
        }
      }
      this.histData = {
        bins,
        total: vals.length,
        max: Math.max(...bins.map(b => b.count), 1)
      };
    },

    measureLegend() {
      const el = this.$refs.legend;
      this.legendHeight = el ? el.getBoundingClientRect().height : 0;
    },
    initMap() {
      const protocol = new Protocol();
      maplibre.addProtocol('pmtiles', protocol.tile);

      this.map = new maplibre.Map({
        container: this.$refs.mapContainer,
        style: this.mapStyle,
        center: this.center,
        zoom: this.zoom
      });

      this.map.on('load', () => {
        const tileUrl = 'pmtiles://https://placing-holocaust-tiles.s3.us-east-2.amazonaws.com/gazetteer_processed.pmtiles';
        this.map.addSource('gazetteer', {
          type: 'vector',
          url: tileUrl
        });

        this.map.addLayer({
          id: 'gazetteer',
          type: 'circle',
          source: 'gazetteer',
          'source-layer': config.sourceLayer || 'gazetteer_full_output_processed',
          paint: {
            // Circle radius grows as you zoom in
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              5, 2.5,
              8, 4,
              12, 6
            ],

            // Fill color by SiteType
            'circle-color': [
              'match', ['get', 'SiteType'],
              'Ghetto', '#AA66CD',
              'Camp', '#FFAA00',
              'Main camp', '#FFAA00',
              'Subcamp', '#FFAA00',
              'Death camp', '#FF5733',
              '#888888' // fallback
            ],

            // Stroke color: slightly brighter version of fill
            'circle-stroke-color': [
              'match', ['get', 'SiteType'],
              'Ghetto', '#C188D8',
              'Camp', '#FFC54D',
              'Main camp', '#FFC54D',
              'Subcamp', '#FFC54D',
              'Death camp', '#FF7B55',
              '#AAAAAA'
            ],
            'circle-stroke-width': [
              'interpolate', ['linear'], ['zoom'],
              5, 0.5,
              8, 1,
              12, 1.5
            ],
            'circle-opacity': 0.9
          }
        });

        // Hover layer: the circle under the cursor grows so it's clear
        // which site you're about to click.
        this.map.addLayer({
          id: 'gazetteer-hover',
          type: 'circle',
          source: 'gazetteer',
          'source-layer': config.sourceLayer || 'gazetteer_full_output_processed',
          filter: ['==', ['get', 'SiteName'], '___none___'],
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              5, 7,
              8, 10,
              12, 13
            ],
            'circle-color': [
              'match', ['get', 'SiteType'],
              'Ghetto', '#AA66CD',
              'Camp', '#FFAA00',
              'Main camp', '#FFAA00',
              'Subcamp', '#FFAA00',
              'Death camp', '#FF5733',
              '#888888'
            ],
            'circle-stroke-color': '#000',
            'circle-stroke-width': 1.5,
            'circle-opacity': 1
          }
        });

        this.map.on('mousemove', 'gazetteer', (e) => {
          this.map.getCanvas().style.cursor = 'pointer';
          const name = e.features?.[0]?.properties?.SiteName;
          if (name != null) {
            this.map.setFilter('gazetteer-hover', ['==', ['get', 'SiteName'], name]);
          }
        });
        this.map.on('mouseleave', 'gazetteer', () => {
          this.map.getCanvas().style.cursor = '';
          this.map.setFilter('gazetteer-hover', ['==', ['get', 'SiteName'], '___none___']);
        });

        this.map.once('idle', () => {
          this.loadFilterOptions();
          this.updateFilters();
        });

        this.map.on('idle', () => {
          this.updateMatchCount();
          if (this.histField) this.computeHistogram();
        });

        // Padded click: accept clicks within a few pixels of a circle.
        // Overlapping sites produce a chooser instead of a silent guess.
        this.map.on('click', (e) => {
          const pad = 6;
          const feats = this.map.queryRenderedFeatures(
            [[e.point.x - pad, e.point.y - pad], [e.point.x + pad, e.point.y + pad]],
            { layers: ['gazetteer'] }
          );
          if (!feats.length) return;
          const unique = [];
          const seen = new Set();
          for (const f of feats) {
            const name = f.properties?.SiteName;
            if (!name || seen.has(name)) continue;
            seen.add(name);
            unique.push(f.properties);
          }
          if (unique.length === 1) {
            this.popupChoices = null;
            this.showPopup({ features: feats });
          } else {
            this.popupChoices = unique;
            this.popupVisible = false;
          }
        });
      });
    },
    loadFilterOptions() {
      let feats = [];
      try {
        feats = this.map.querySourceFeatures(
          'gazetteer',
          { sourceLayer: this.config.sourceLayer || 'gazetteer_full_output_processed' }
        );
      } catch (e) {
        console.warn('Failed to query source features', e);
        return;
      }

      // Populate dropdowns from tiles if flagged
      this.config.dropdownFilters.forEach(f => {
        if (f.loadFrom === 'tiles' && !f.options) {
          const set = new Set(
            feats
              .map(ft => ft.properties?.[f.field])
              .filter(v => v !== null && v !== undefined && v !== '')
          );
          this.$set(this.filterOptions, f.field, Array.from(set).sort());
        }
      });

      // Populate multi-select options if not provided
      Object.values(this.config.fieldControlsByDataset).flat()
        .filter(c => c.type === 'multi-select' && (!c.options || c.options.length === 0))
        .forEach(c => {
          const dataField = c.dataField || c.field;
          const set = new Set();
          feats.forEach(ft => {
            const val = ft.properties?.[dataField];
            if (val === null || val === undefined || val === '') return;
            if (dataField === 'Nation' || dataField === 'InmateType') {
              String(val).split(';').forEach(tok => {
                const t = tok.trim();
                if (t) set.add(t);
              });
            } else {
              set.add(val);
            }
          });
          this.$set(this.filterOptions, c.field, Array.from(set).sort());
        });

      // Derive min/max for sliders and time-sliders if missing
      const allCtrls = [
        ...this.config.dropdownFilters,
        ...Object.values(this.config.fieldControlsByDataset).flat()
      ];

      allCtrls.forEach(c => {
        const dataField = c.dataField || c.field;
        const fieldExists = feats.some(ft => Object.prototype.hasOwnProperty.call(ft.properties || {}, dataField));
        if (!fieldExists) return;

        if (c.type === 'slider' &&
            (this.filterOptions[c.field]?.min == null || this.filterOptions[c.field]?.max == null)) {
          const vals = feats.map(ft => ft.properties?.[dataField])
            .filter(v => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v)))
            .map(v => Number(v));

          if (vals.length) {
            const min = Math.min(...vals);
            const max = Math.max(...vals);
            this.$set(this.filterOptions, c.field, { min, max });
            const current = this.filterValues[c.field] || {};
            const lo = Number.isFinite(Number(current.lo)) ? Math.min(Math.max(Number(current.lo), min), max) : min;
            const hi = Number.isFinite(Number(current.hi)) ? Math.min(Math.max(Number(current.hi), min), max) : max;
            this.$set(this.filterValues, c.field, { lo, hi });
          } else {
            this.$set(this.filterOptions, c.field, { min: null, max: null });
          }
        }

        if (c.type === 'time-slider' &&
            (this.filterOptions[c.field]?.min == null || this.filterOptions[c.field]?.max == null)) {
          // Gather ISO strings -> ms
          const msVals = feats.map(ft => ft.properties?.[dataField])
            .filter(v => v && typeof v === 'string')
            .map(v => dateStrToMs(v))
            .filter(t => !Number.isNaN(t));

          let minMs, maxMs;
          if (msVals.length) {
            minMs = Math.min(...msVals);
            maxMs = Math.max(...msVals);
          } else {
            // fallback to defaults
            minMs = dateStrToMs(DEFAULT_DATE_START);
            maxMs = dateStrToMs(DEFAULT_DATE_END);
          }

          this.$set(this.filterOptions, c.field, { min: minMs, max: maxMs, __isTime: true });

          const current = this.filterValues[c.field];
          const nextVal =
            (current == null || Number.isNaN(Number(current)))
              ? minMs
              : Math.min(Math.max(Number(current), minMs), maxMs);

          this.$set(this.filterValues, c.field, nextVal);
        }
      });
    },
    toggleMultiSelect(field, opt) {
      const arr = this.filterValues[field];
      const idx = arr.indexOf(opt);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(opt);
      this.updateFilters();
    },
    selectAll(field) {
      this.filterValues[field] = [...(this.filterOptions[field] || [])];
      this.updateFilters();
    },
    clearAll(field) {
      this.filterValues[field] = [];
      this.updateFilters();
    },
    updateFilters() {
      const campTypes = ['Camp', 'Main camp', 'Subcamp', 'Death camp'];
      const ghettoTypes = ['Ghetto'];
      const containsFields = ['Nation', 'InmateType'];

      const addControlFilters = (ctrl, expr) => {
        const v = this.filterValues[ctrl.field];
        const dataField = ctrl.dataField || ctrl.field;

        if (ctrl.type === 'dropdown' && v) {
          expr.push(['==', ['get', dataField], v]);
        }

        if (ctrl.type === 'multi-select' && Array.isArray(v) && v.length) {
          if (dataField === 'HoldPStruc' || dataField === 'RestrType') {
            const clauses = v.map(opt => ['==', ['get', `${dataField}_${this.slugify(opt)}`], 'TRUE']);
            if (clauses.length) expr.push(['any', ...clauses]);
          } else if (dataField === 'Demographics') {
            const fieldMap = {
              Men: 'Men',
              Women: 'Women',
              Elderly: 'Elderly',
              Youth: 'Youth',
              Children: 'Children'
            };
            const trueLiterals = ['TRUE', 'True', 'true', true, 1, '1'];
            const clauses = v
              .map(opt => fieldMap[opt])
              .filter(Boolean)
              .map(f => ['in', ['get', f], ['literal', trueLiterals]]);
            // Fallback: also check semicolon list if present
            v.forEach(opt => {
              clauses.push(['>=', ['index-of', opt, ['coalesce', ['get', 'DemographicsList'], '']], 0]);
            });
            if (clauses.length) expr.push(['any', ...clauses]); // match any selected demographic
          } else if (containsFields.includes(dataField)) {
            const clauses = v.map(opt => ['>=', ['index-of', opt, ['get', dataField]], 0]);
            if (clauses.length) expr.push(['any', ...clauses]);
          } else {
            expr.push(['in', ['get', dataField], ['literal', v]]);
          }
        }

        const sliderOpts = this.filterOptions[ctrl.field];

        // numeric span: apply each bound only when moved off the extreme
        if (ctrl.type === 'slider' && v && sliderOpts && sliderOpts.min != null) {
          if (Number(v.lo) > Number(sliderOpts.min)) {
            expr.push(['>=', ['to-number', ['get', dataField]], Number(v.lo)]);
          }
          if (sliderOpts.max != null && Number(v.hi) < Number(sliderOpts.max)) {
            expr.push(['<=', ['to-number', ['get', dataField]], Number(v.hi)]);
          }
        }

        // time sliders: handle Start/End ranges separately; other time sliders apply simple compare
        if (
          ctrl.type === 'time-slider' &&
          !['StartMid_ISO', 'EndMid_ISO'].includes(dataField) &&
          v != null &&
          sliderOpts &&
          sliderOpts.min != null &&
          v > sliderOpts.min
        ) {
          const vStr = msToDateStr(v);
          if (vStr) {
            const compareOp = dataField.toLowerCase().includes('end') ? '<=' : '>=';
            expr.push([compareOp, ['get', dataField], vStr]);
          }
        }
      };

      const globalExpr = ['all'];
      this.config.dropdownFilters.forEach(c => addControlFilters(c, globalExpr));

      const buildTimeRangeExpr = (ctrls) => {
        const startCtrl = ctrls.find(c => c.dataField === 'StartMid_ISO');
        const endCtrl   = ctrls.find(c => c.dataField === 'EndMid_ISO');
        if (!startCtrl && !endCtrl) return null;

        const startVal = startCtrl ? this.filterValues[startCtrl.field] : null;
        const endVal   = endCtrl ? this.filterValues[endCtrl.field] : null;
        const startOpts = startCtrl ? this.filterOptions[startCtrl.field] : null;
        const endOpts   = endCtrl ? this.filterOptions[endCtrl.field] : null;

        const startActive = startCtrl && startOpts?.min != null && startVal != null && Number(startVal) > Number(startOpts.min);
        const endActive   = endCtrl && endOpts?.min != null && endVal != null && Number(endVal) > Number(endOpts.min);

        if (!startActive && !endActive) return null;

        const startMs = startActive ? Number(startVal) : Number(startOpts?.min);
        const endMs   = endActive ? Number(endVal)   : Number(endOpts?.max);
        const startStr = msToDateStr(startMs);
        const endStr   = msToDateStr(endMs);
        if (!startStr || !endStr) return null;

        const endField = ['coalesce', ['get', 'EndMid_ISO'], ['get', 'StartMid_ISO']];
        return ['all', ['<=', ['get', 'StartMid_ISO'], endStr], ['>=', endField, startStr]];
      };

      const buildSiteExpr = (types, ctrls) => {
        const expr = ['all', ['in', ['get', 'SiteType'], ['literal', types]]];
        ctrls.forEach(c => addControlFilters(c, expr));
        const timeRangeExpr = buildTimeRangeExpr(ctrls);
        if (timeRangeExpr) expr.push(timeRangeExpr);
        return expr;
      };

      const campExpr = buildSiteExpr(campTypes, this.config.fieldControlsByDataset.camp || []);
      const ghettoExpr = buildSiteExpr(ghettoTypes, this.config.fieldControlsByDataset.ghetto || []);

      const campActive = (this.config.fieldControlsByDataset.camp || []).some(c => this.isControlActive(c));
      const ghettoActive = (this.config.fieldControlsByDataset.ghetto || []).some(c => this.isControlActive(c));

      let expr;
      if (campActive && ghettoActive) {
        expr = ['all', ...globalExpr.slice(1), ['any', campExpr, ghettoExpr]];
      } else if (campActive) {
        expr = ['all', ...globalExpr.slice(1), campExpr];
      } else if (ghettoActive) {
        expr = ['all', ...globalExpr.slice(1), ghettoExpr];
      } else {
        expr = globalExpr;
      }

      if (this.snapshotOn) {
        const dStr = msToDateStr(this.snapshotMs);
        if (dStr) {
          expr.push(['<=', ['get', 'StartMid_ISO'], dStr]);
          expr.push(['>=', ['coalesce', ['get', 'EndMid_ISO'], ['get', 'StartMid_ISO']], dStr]);
        }
      }

      const t = this.filterValues.mentioned_in_transcripts;
      if (t === true) {
        expr.push(['in', ['get', 'SiteName'], ['literal', MENTIONED_NAMES]]);
      }
      if (t === false) {
        expr.push(['!', ['in', ['get', 'SiteName'], ['literal', MENTIONED_NAMES]]]);
      }

      if (this.map && this.map.getLayer('gazetteer')) {
        this.map.setFilter('gazetteer', expr);
      }
      this._updateFilterDescription();
    },
    _updateFilterDescription() {
      const parts = [];
      const allCtrls = [
        ...this.config.dropdownFilters,
        ...Object.values(this.config.fieldControlsByDataset).flat()
      ];
      const labelOf = (field) => {
        const ctrl = allCtrls.find(c => c.field === field);
        return (ctrl && (ctrl.shortLabel || ctrl.label)) || field;
      };
      Object.keys(this.filterValues).forEach(field => {
        const val = this.filterValues[field];
        if (field === 'mentioned_in_transcripts') {
          if (val === true) parts.push('Mentioned in transcripts: Yes');
          if (val === false) parts.push('Mentioned in transcripts: No');
        } else if (val && typeof val === 'string') {
          parts.push(`${labelOf(field)}: ${val}`);
        } else if (Array.isArray(val) && val.length) {
          parts.push(`${labelOf(field)}: ${val.join(', ')}`);
        } else if (
          typeof val === 'number' &&
          this.filterOptions[field]?.min != null &&
          val > this.filterOptions[field].min
        ) {
          const isTime = !!this.filterOptions[field]?.__isTime;
          parts.push(`${labelOf(field)} ≥ ${isTime ? msToDateStr(val) : val}`);
        } else if (
          val && typeof val === 'object' && val.lo != null &&
          this.filterOptions[field]?.min != null &&
          (Number(val.lo) > Number(this.filterOptions[field].min) ||
           Number(val.hi) < Number(this.filterOptions[field].max))
        ) {
          parts.push(`${labelOf(field)}: ${Number(val.lo).toLocaleString()}–${Number(val.hi).toLocaleString()}`);
        }
      });
      if (this.snapshotOn) {
        parts.push(`existing on ${this.prettyDateMs(this.snapshotMs)}`);
      }
      this.filterDescription = parts.join('; ');
    },
    pickPopupChoice(props) {
      this.popupChoices = null;
      this.popupData = props;
      this.popupVisible = true;
    },
    showPopup(e) {
      const p = e.features[0].properties;
      this.popupData = p;
      this.popupVisible = true;

      const lng = Number(p.Long_X);
      const lat = Number(p.Lat_Y);
      if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
        this.map.flyTo({ center: [lng, lat], zoom: 8 });
      }

      this.$nextTick(this.measureLegend);
    },
    closePopup() { this.popupVisible = false; },
    formatDate(ts) { return msToDateStr(ts); } // keep compatibility if used elsewhere
  }
};
</script>

<style scoped>
.map-container { display:flex; position:relative; height:100vh; }
.map { flex:1; }

/* Floating left menu */
.left-sidebar {
  position:absolute;
  top:20px; left:20px;
  width:320px;
  max-height:calc(100vh - 40px);
  background:rgba(255,255,255,0.95);
  padding:12px;
  overflow:auto;
  border-radius:8px;
  box-shadow:0 2px 8px rgba(0,0,0,0.15);
  z-index:2;
}
.left-sidebar details summary { cursor:pointer; font-weight:600; margin:6px 0; }
.dataset-section { margin-top:8px; }
.section-divider {
  border:none;
  border-top:1px solid #ccc;
  margin:12px 0 8px;
}
.filter-control { margin-bottom:12px; }
.filter-note { margin:6px 0 0; font-size:11px; color:#666; line-height:1.4; }
.slider-label { display: block; font-weight: 600; margin-bottom: 2px; }
.slider-value {
  font-size: 0.82rem;
  color: #333;
  font-variant-numeric: tabular-nums;
  margin: 1px 0 3px;
}
.slider-value.dim { color: #aaa; }
.range-pair { display: flex; flex-direction: column; gap: 2px; }
.range-pair input, .time-section input[type="range"] { width: 100%; }
.snapshot-toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 4px;
}
.match-count {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e5e5;
  font-size: 0.85rem;
  color: #333;
}
.semantics-note {
  margin: 6px 0 0;
  font-size: 0.72rem;
  color: #999;
  line-height: 1.35;
}
.legend-exports {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.legend-exports .export-label { font-size: 0.75rem; color: #888; }
.legend-exports button {
  color: #333;
  padding: 2px 9px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.75rem;
}
.legend-exports button:hover { border-color: #000; }
.cert-badge {
  display: inline-block;
  margin-left: 5px;
  padding: 0 7px;
  border-radius: 9px;
  background: #f3f0e8;
  border: 1px solid #ddd2b8;
  font-size: 0.68rem;
  color: #6b5d3a;
  vertical-align: middle;
  white-space: nowrap;
}
.chooser-hint { font-size: 0.82rem; color: #666; margin: 4px 0 10px; }
.site-choice {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 6px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  color: #111;
  cursor: pointer;
  text-align: left;
  font-size: 0.86rem;
}
.site-choice:hover { border-color: #000; background: #f8f8f8; }
.site-choice-type { font-size: 0.72rem; color: #777; flex: none; }
.hist { margin-top: 8px; max-height: 300px; overflow-y: auto; }
.hist-row {
  display: grid;
  grid-template-columns: 74px 1fr 34px;
  align-items: center;
  gap: 6px;
  padding: 1.5px 0;
  font-size: 11px;
}
.hist-label { color: #555; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hist-bar-wrap { background: #efefef; border-radius: 3px; height: 11px; overflow: hidden; }
.hist-bar { display: block; height: 100%; background: #444; border-radius: 3px; }
.hist-count { color: #333; font-variant-numeric: tabular-nums; }
.val-pills { margin: 2px 0 0; display: flex; flex-wrap: wrap; gap: 4px; }
.val-pill {
  background: #f1f1f1;
  border: 1px solid #e2e2e2;
  border-radius: 10px;
  padding: 1px 8px;
  font-size: 0.74rem;
  color: #333;
}
.filter-label { font-weight:600; }

/* Collapsible control header */
.control-collapsible {
  border:1px solid #e3e3e3;
  border-radius:8px;
  padding:6px 8px;
  background:rgba(250,250,250,0.9);
  margin-bottom:10px;
}
.control-summary {
  display:flex;
  align-items:center;
  justify-content:space-between;
  list-style:none;
  cursor:pointer;
}
.summary-count { font-size:0.85em; color:#555; }

/* Multi-select buttons */
.multi-buttons { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0 6px; }
.multi-buttons button {
  padding:4px 10px;
  border:none;
  border-radius:14px;
  background:#e6e6e7;
  color:#000;
  cursor:pointer;
}
.multi-buttons button.selected {
  background:#000;
  color:#fff;
}
.multi-actions { display:flex; gap:8px; }
.multi-actions button {
  font-size:0.8em;
  background:#f4f4f4;
  border:none;
  border-radius:6px;
  padding:4px 8px;
  cursor:pointer;
}

/* Legend floating top-right */
.legend-floating {
  position:absolute;
  top:20px; right:20px;
  max-width:320px;
  background:rgba(255,255,255,0.95);
  padding:10px 12px;
  border-radius:8px;
  box-shadow:0 2px 8px rgba(0,0,0,0.15);
  z-index:2;
}
.legend-floating .legend-header{
  display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;
}
.clear-filters-btn{
  font-size:.85rem; line-height:1; padding:6px 12px; border:none; border-radius:6px;
  background:#000; color:#fff; cursor:pointer;
}
.clear-filters-btn:hover{ background:#333; }

.legend-floating h3 { margin:0; font-size:1rem; }
.legend-item { display:flex; align-items:center; margin-bottom:4px; }
.color-circle {
  width:14px; height:14px;
  border-radius:50%;
  border:1px solid #000;
  margin-right:6px;
}
/* Current query inside legend */
.current-query.in-legend { margin-top:8px; }
.current-query.in-legend h4 { margin:8px 0 4px; font-size:0.95rem; }
.current-query.in-legend p { margin:0; font-size:0.9rem; color:#333; }

/* Popup (floats below legend, scrollable with max height) */
.popup {
  position:absolute;
  right:20px;
  width:340px;
  background:#fff;
  padding:16px 16px 14px;
  border:1px solid #d8d8dc;
  border-radius:10px;
  box-shadow:0 6px 18px rgba(0,0,0,0.15);
  z-index:2;
  overflow:auto;
}
.popup-title {
  margin:0 0 10px;
  font-size:1.1rem;
  line-height:1.25;
  letter-spacing:.2px;
}
.popup-details {
  margin:0; padding:0;
}
.popup-field {
  display:block;
  margin:0 0 10px;
}
.popup-field dt {
  margin:0 0 2px;
  font-size:.78rem;
  line-height:1.2;
  text-transform:uppercase;
  letter-spacing:.04em;
  color:#555a66;
}
.popup-field dd {
  margin:0;
  font-size:.96rem;
  line-height:1.45;
  color:#15151a;
  word-break:break-word;
}
.transcript-link { color:#0a66c2; text-decoration:underline; }
.popup-close {
  margin-top:12px;
  padding:6px 14px;
  background:#000;
  color:#fff;
  border:none;
  border-radius:6px;
  cursor:pointer;
}
.popup-close:hover { background:#333; }
</style>
