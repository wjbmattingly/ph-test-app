<template>
  <div class="explore-page">
    <!-- Map -->
    <div class="map-pane">
      <ExploreMap
        ref="exploreMap"
        :highlight-names="highlightsEnabled ? activeSiteNames : []"
        :show-only-highlights="showOnlyResultSites"
        :selected-name="selectedSiteName"
        @site-click="onSiteClick"
        @sites-click="onSitesClick"
      />

      <!-- Overlapping-sites chooser -->
      <aside v-if="siteChoices" class="site-panel">
        <header class="site-panel-head">
          <div>
            <h2 class="site-panel-title">{{ siteChoices.length }} sites here</h2>
          </div>
          <button type="button" class="clear-site" title="Close" @click="siteChoices = null">×</button>
        </header>
        <p class="site-panel-mention muted">Several sites overlap at this point — pick one:</p>
        <button
          v-for="choice in siteChoices"
          :key="choice.SiteName"
          type="button"
          class="site-choice"
          @click="pickSiteChoice(choice)"
        >
          <strong>{{ cleanName(choice.SiteName) }}</strong>
          <span class="site-choice-type">{{ choice.SiteType }}</span>
        </button>
      </aside>

      <!-- Selected place metadata (mirrors the map page popup) -->
      <aside v-if="selectedSite && !siteChoices" class="site-panel">
        <header class="site-panel-head">
          <div>
            <h2 class="site-panel-title">{{ cleanName(selectedSite.SiteName) }}</h2>
            <span class="site-type">{{ selectedSite.SiteType }}</span>
          </div>
          <button type="button" class="clear-site" title="Clear selection" @click="clearSelection">×</button>
        </header>

        <p v-if="selectedMention" class="site-panel-mention">
          Named in {{ selectedMention.transcripts }}
          {{ selectedMention.transcripts === 1 ? 'testimony' : 'testimonies' }}
          ({{ selectedMention.occurrences.toLocaleString() }} passages)
        </p>
        <p v-else class="site-panel-mention muted">Not named in any testimony</p>

        <button
          type="button"
          class="site-search-btn"
          @click="searchSelectedPlace"
        >
          Search testimony about this place
        </button>
        <button
          v-if="results.length && selectedMention"
          type="button"
          class="site-filter-btn"
          :class="{ active: isPlaceFilterActive }"
          @click="togglePlaceFilter"
        >
          {{ isPlaceFilterActive ? 'Clear place filter' : 'Filter results by this place' }}
        </button>

        <dl class="site-panel-fields">
          <div v-if="selectedSite.EncyStruc" class="site-field">
            <dt>Encyclopedia structure</dt>
            <dd>{{ selectedSite.EncyStruc }}</dd>
          </div>
          <div v-for="entry in sitePanelEntries" :key="entry.label" class="site-field">
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
        </dl>
        <p v-if="!sitePanelEntries.length" class="site-panel-note">
          Zoom in or reselect on the map for full site details.
        </p>
      </aside>
    </div>

    <!-- Search / results panel -->
    <aside class="search-pane">
      <form class="search-bar" @submit.prevent="submitSearch">
        <input
          v-model="queryText"
          type="text"
          class="query-input"
          placeholder="Search testimony — e.g. hiding in the forest"
          aria-label="Search testimony"
        />
        <div class="search-bar-row">
          <div class="mode-toggle" role="radiogroup" aria-label="Search mode">
            <button
              v-for="mode in modes"
              :key="mode.value"
              type="button"
              :class="{ active: queryType === mode.value }"
              :title="mode.hint"
              @click="queryType = mode.value"
            >
              {{ mode.label }}
            </button>
          </div>
          <div class="bar-actions">
            <button type="submit" class="search-btn" :disabled="searching || !queryText.trim()">
              {{ searching ? 'Searching…' : 'Search' }}
            </button>
            <button
              v-if="searched || queryText"
              type="button"
              class="reset-btn"
              title="Clear the search, results, and filters"
              @click="resetExplore"
            >
              Reset
            </button>
          </div>
        </div>

        <details class="advanced-opts" :open="bioFilterCount > 0">
          <summary>Advanced<span v-if="bioFilterCount" class="adv-badge">{{ bioFilterCount }}</span></summary>
          <div class="advanced-row">
            <label class="adv-field">
              Max results
              <input v-model.number="numResults" type="number" min="10" max="5000" step="10" />
            </label>
            <label class="adv-field adv-slider" :class="{ disabled: queryType === 'Keyword' }">
              Min. similarity
              <input
                v-model.number="scoreThreshold"
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                :disabled="queryType === 'Keyword'"
              />
              <span class="adv-value">{{ scoreThreshold > 0 ? scoreThreshold.toFixed(2) : 'off' }}</span>
            </label>
          </div>
          <p class="adv-hint">
            Similarity filtering applies to Semantic and Hybrid searches; results below the
            threshold are dropped after retrieval.
          </p>

          <div class="advanced-row bio-row">
            <label class="adv-field">
              Gender
              <select v-model="bioGender">
                <option value="">All</option>
                <option v-for="g in filterOptions.genders" :key="g" :value="g">{{ g }}</option>
              </select>
            </label>
            <label class="adv-field">
              Country
              <select v-model="bioCountry">
                <option value="">All</option>
                <option v-for="c in filterOptions.countries" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <label class="adv-field">
              Experience
              <select v-model="bioExperience">
                <option value="">All</option>
                <option v-for="e in filterOptions.experienceGroups" :key="e" :value="e">{{ e }}</option>
              </select>
            </label>
            <label class="adv-field">
              Birth year
              <select v-model="bioBirthYear">
                <option value="">All</option>
                <option v-for="y in filterOptions.birthYears" :key="y" :value="y">{{ y }}</option>
              </select>
            </label>
            <label class="adv-field">
              RG number
              <input v-model.trim="bioRg" type="text" placeholder="rg-50..." class="adv-text" />
            </label>
            <button v-if="bioFilterCount" type="button" class="adv-clear" @click="clearBioFilters">
              Clear filters ({{ bioFilterCount }})
            </button>
          </div>
          <p class="adv-hint">Biographic filters combine with AND and apply on the next search.</p>
        </details>
      </form>

      <!-- Status -->
      <div v-if="searching" class="status-line">
        <span class="spinner" aria-hidden="true"></span> {{ searchStage }}
      </div>
      <div v-if="errorMessage" class="error-banner">
        <strong>Search failed.</strong> {{ errorMessage }}
      </div>

      <!-- Tandem summary -->
      <div v-if="results.length" class="tandem-strip">
        <div class="tandem-counts">
          <strong>{{ filteredResults.length }}</strong>
          <template v-if="placeFilter"> of {{ results.length }}</template>
          passages ·
          <strong>{{ resultRgs.length }}</strong> testimonies ·
          <strong>{{ activeSiteNames.length }}</strong> mapped sites named
          <template v-if="excerptOnly"> in excerpts</template>
          <span v-if="placeFilter" class="filter-chip">
            place: {{ cleanName(placeFilter) }}<template v-if="excerptOnly"> (in excerpt)</template>
            <button type="button" class="filter-chip-clear" title="Clear place filter" @click="placeFilter = null">×</button>
          </span>
        </div>
        <div class="tandem-controls">
          <label class="tandem-check">
            <input v-model="highlightsEnabled" type="checkbox" /> Highlight sites
          </label>
          <label class="tandem-check">
            <input v-model="showOnlyResultSites" type="checkbox" /> Only these sites
          </label>
          <label class="tandem-check" title="Restrict to places named in the returned passages themselves, not the whole testimonies">
            <input v-model="excerptOnly" type="checkbox" /> Excerpt places only
          </label>
          <button
            type="button"
            class="zoom-btn"
            :disabled="!activeSiteNames.length"
            @click="zoomToResults"
          >
            Zoom to results
          </button>
        </div>
        <div class="export-row">
          <span class="export-label">Export:</span>
          <button type="button" @click="exportSearchResults(filteredResults, exportSummary, 'csv')">CSV</button>
          <button type="button" @click="exportSearchResults(filteredResults, exportSummary, 'json')">JSON</button>
          <button type="button" :disabled="!activeSiteNames.length" @click="exportSitesGeojson">Sites GeoJSON</button>
          <button type="button" @click="exportMapPng">Map PNG</button>
        </div>
      </div>

      <!-- Results -->
      <div v-if="results.length" class="results-scroll">
        <article v-for="(row, idx) in visibleResults" :key="row.rg + '-' + idx" class="result-card">
          <header class="result-head">
            <strong class="result-name">{{ displayName(row) || 'Unknown interviewee' }}</strong>
            <span v-if="row.score != null" class="result-score" :title="'Similarity ' + row.score">
              <span class="score-bar"><span class="score-fill" :style="{ width: scoreWidth(row.score) }"></span></span>
            </span>
          </header>
          <p class="result-meta">
            {{ row.rg }}<template v-if="row.birth_year"> · b. {{ row.birth_year }}</template><template v-if="row.birth_country"> · {{ row.birth_country }}</template><template v-if="row.experience_group"> · {{ row.experience_group }}</template>
          </p>
          <p class="result-excerpt" v-html="highlightExcerpt(row.text, lastQueryText)"></p>
          <div v-if="excerptSitesFor(row).length" class="result-places">
            <span class="places-label">In this excerpt:</span>
            <button
              v-for="site in excerptSitesFor(row)"
              :key="'x' + site"
              type="button"
              class="place-chip excerpt-chip"
              @click="focusSite(site)"
            >
              {{ cleanName(site) }}
            </button>
          </div>
          <div v-if="sitesForRg(row.rg).length" class="result-places">
            <span class="places-label">Places named in this testimony:</span>
            <button
              v-for="site in testimonyChipsFor(row)"
              :key="site"
              type="button"
              class="place-chip"
              :class="{ 'filtered-chip': site === placeFilter }"
              @click="focusSite(site)"
            >
              {{ cleanName(site) }}
            </button>
            <span v-if="sitesForRg(row.rg).length > 4" class="places-more">
              +{{ sitesForRg(row.rg).length - 4 }} more
            </span>
          </div>
          <footer class="result-actions">
            <button type="button" class="link-btn" @click="openTranscript(row)">Open in transcript</button>
          </footer>
        </article>

        <button
          v-if="visibleCount < filteredResults.length"
          type="button"
          class="show-more"
          @click="visibleCount += 100"
        >
          Show more ({{ filteredResults.length - visibleCount }} remaining)
        </button>

        <div v-if="placeFilter && !filteredResults.length" class="empty-state">
          <p>No results in this search reference {{ cleanName(placeFilter) }}.</p>
        </div>
      </div>

      <!-- Empty states -->
      <div v-else-if="searched && !searching && !errorMessage" class="empty-state">
        <p>No passages matched. Try a broader phrasing or the Semantic mode.</p>
      </div>
      <div v-else-if="!searching" class="intro-state">
        <h2>Explore testimony and territory together</h2>
        <p>
          Search nearly 1,000 USHMM oral testimonies. Sites named by the matching
          testimonies light up on the map — or click any site to hear how survivors
          spoke about it.
        </p>
        <p class="try-label">Try:</p>
        <div class="example-chips">
          <button
            v-for="ex in exampleQueries"
            :key="ex"
            type="button"
            class="example-chip"
            @click="runExample(ex)"
          >
            {{ ex }}
          </button>
        </div>
      </div>
    </aside>

    <TranscriptModal
      v-if="transcriptModal"
      :rg="transcriptModal.rg"
      :sentence-id="transcriptModal.sentenceId"
      :title="transcriptModal.title"
      @close="transcriptModal = null"
    />
  </div>
</template>

<script>
import ExploreMap from '@/components/ExploreMap.vue';
import TranscriptModal from '@/components/TranscriptModal.vue';
import testimonySearch from '@/mixins/testimonySearch';
import mentionsFile from '@/static/data/testimony-mentions.json';
import mapConfig from '@/static/data/map-config.json';
import { formatSiteValue, certaintyFor } from '@/utils/siteValueFormat';

const MENTIONS = mentionsFile.sites || {};

// Diacritic folding so "Łódź" matches "Lodz" in excerpt text (mirrors the
// pipeline that built testimony-mentions.json)
const FOLD_EXTRA = { 'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'ø': 'o', 'Ø': 'O', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe' };
function foldText(str) {
  return (str || '')
    .replace(/[łŁđĐøØßæœ]/g, c => FOLD_EXTRA[c] || c)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// rg number -> [raw SiteNames named in that testimony]
const RG_TO_SITES = {};
for (const [site, info] of Object.entries(MENTIONS)) {
  for (const rg of info.rg_numbers || []) {
    (RG_TO_SITES[rg] = RG_TO_SITES[rg] || []).push(site);
  }
}
// Stable ordering: most-cited sites first within each testimony
for (const rg of Object.keys(RG_TO_SITES)) {
  RG_TO_SITES[rg].sort((a, b) => (MENTIONS[b].transcripts - MENTIONS[a].transcripts));
}

export default {
  name: 'ExplorePage',
  components: { ExploreMap, TranscriptModal },
  mixins: [testimonySearch],
  data() {
    return {
      queryText: '',
      queryType: 'Vector',
      modes: [
        { value: 'Vector', label: 'Semantic', hint: 'Match by meaning, not exact words' },
        { value: 'Keyword', label: 'Keyword', hint: 'Match exact words (BM25)' },
        { value: 'Hybrid', label: 'Hybrid', hint: 'Blend of semantic and keyword' }
      ],
      searching: false,
      searched: false,
      searchStage: '',
      errorMessage: '',
      results: [],
      placeFilter: null,     // raw SiteName; restrict results to testimonies naming it
      visibleCount: 50,
      numResults: 1000,
      scoreThreshold: 0,
      bioGender: '',
      bioCountry: '',
      bioExperience: '',
      bioBirthYear: '',
      bioRg: '',
      filterOptions: { genders: [], countries: [], experienceGroups: [], birthYears: [] },
      lastQueryText: '',
      highlightsEnabled: true,
      showOnlyResultSites: false,
      excerptOnly: false,
      selectedSite: null,
      siteChoices: null,
      transcriptModal: null,
      exampleQueries: [
        'deportation by cattle car',
        'hiding in the forest',
        'liberation by the Americans',
        'Warsaw',
        'life inside the ghetto'
      ]
    };
  },
  computed: {
    filteredResults() {
      if (!this.placeFilter) return this.results;
      // "Excerpt places only" narrows the place filter to passages whose
      // own text names the place, not just the wider testimony.
      if (this.excerptOnly) {
        return this.results.filter(r => (r._excerptSites || []).includes(this.placeFilter));
      }
      const info = MENTIONS[this.placeFilter];
      const rgSet = new Set(info ? info.rg_numbers : []);
      return this.results.filter(r => rgSet.has((r.rg || '').toLowerCase()));
    },
    bioFilterCount() {
      return [this.bioGender, this.bioCountry, this.bioExperience,
        String(this.bioBirthYear || ''), this.bioRg].filter(v => v && v.trim()).length;
    },
    isPlaceFilterActive() {
      return !!this.selectedSite && this.placeFilter === this.selectedSite.SiteName;
    },
    resultRgs() {
      return [...new Set(this.filteredResults.map(r => (r.rg || '').toLowerCase()).filter(Boolean))];
    },
    resultSiteNames() {
      const set = new Set();
      for (const rg of this.resultRgs) {
        for (const site of RG_TO_SITES[rg] || []) set.add(site);
      }
      return [...set];
    },
    excerptSiteNames() {
      const set = new Set();
      for (const row of this.filteredResults) {
        for (const site of row._excerptSites || []) set.add(site);
      }
      return [...set];
    },
    // The site set driving map highlighting and the tandem count
    activeSiteNames() {
      return this.excerptOnly ? this.excerptSiteNames : this.resultSiteNames;
    },
    visibleResults() {
      return this.filteredResults.slice(0, this.visibleCount);
    },
    // Metadata fields for the selected site, using the map page's labels
    sitePanelEntries() {
      const props = this.selectedSite;
      if (!props) return [];
      const st = (props.SiteType || '').toLowerCase();
      let ctrls = [];
      if (st === 'ghetto') ctrls = mapConfig.fieldControlsByDataset.ghetto || [];
      else if (st.includes('camp')) ctrls = mapConfig.fieldControlsByDataset.camp || [];
      return ctrls
        .map(ctrl => ({ label: ctrl.label, value: props[ctrl.field], field: ctrl.field }))
        .filter(e => {
          if (e.value === undefined || e.value === null) return false;
          const v = String(e.value).trim();
          return v && !['false', 'FALSE', 'False', '0'].includes(v);
        })
        .map(e => ({
          ...e,
          fmt: formatSiteValue(e.value),
          cert: certaintyFor(props, e.field)
        }));
    },
    selectedSiteName() {
      return this.selectedSite ? this.selectedSite.SiteName : '';
    },
    selectedMention() {
      return this.selectedSite ? MENTIONS[this.selectedSite.SiteName] || null : null;
    },
    exportSummary() {
      const bits = [`q="${this.lastQueryText}"`, `type=${this.queryType}`];
      if (this.bioGender) bits.push(`gender=${this.bioGender}`);
      if (this.bioCountry) bits.push(`country=${this.bioCountry}`);
      if (this.bioExperience) bits.push(`experience=${this.bioExperience}`);
      if (this.bioBirthYear) bits.push(`birthYear=${this.bioBirthYear}`);
      if (this.bioRg) bits.push(`rg=${this.bioRg}`);
      if (this.placeFilter) bits.push(`place=${this.cleanName(this.placeFilter)}${this.excerptOnly ? ' (in excerpt)' : ''}`);
      bits.push('via /explore');
      return bits.join('; ');
    }
  },
  watch: {
    highlightsEnabled(v) {
      if (process.client) localStorage.setItem('pth-explore-highlight', v ? '1' : '0');
    },
    showOnlyResultSites(v) {
      if (process.client) localStorage.setItem('pth-explore-only-sites', v ? '1' : '0');
    },
    excerptOnly(v) {
      if (process.client) localStorage.setItem('pth-explore-excerpt-only', v ? '1' : '0');
    },
    placeFilter() {
      this.visibleCount = 50;
    }
  },
  mounted() {
    // Restore map-toggle preferences
    const savedHighlight = localStorage.getItem('pth-explore-highlight');
    if (savedHighlight != null) this.highlightsEnabled = savedHighlight === '1';
    const savedOnly = localStorage.getItem('pth-explore-only-sites');
    if (savedOnly != null) this.showOnlyResultSites = savedOnly === '1';
    const savedExcerpt = localStorage.getItem('pth-explore-excerpt-only');
    if (savedExcerpt != null) this.excerptOnly = savedExcerpt === '1';

    this.loadFilterOptions();

    const q = decodeURIComponent(this.$route.query.q || '');
    if (q) {
      this.queryText = q;
      this.queryType = 'Hybrid';
      this.submitSearch();
    }
  },
  methods: {
    cleanName(name) {
      return (name || '').replace(/ /g, ' ').trim();
    },

    openTranscript(row) {
      this.transcriptModal = {
        rg: (row.rg || '').toLowerCase(),
        sentenceId: (row.sentence_ids && row.sentence_ids[0]) || '',
        title: this.displayName(row)
      };
    },

    sitesForRg(rg) {
      return RG_TO_SITES[(rg || '').toLowerCase()] || [];
    },

    // Sites (from this testimony's known set) whose names literally appear
    // in the returned passage text
    computeExcerptSites(row) {
      const candidates = this.sitesForRg(row.rg);
      if (!candidates.length) return [];
      const text = foldText(row.text || '');
      return candidates.filter(site => {
        const name = foldText(this.cleanName(site));
        if (name.length < 4) return false;
        return new RegExp('(^|[^\\w])' + escapeRe(name) + '($|[^\\w])').test(text);
      });
    },
    excerptSitesFor(row) {
      return (row && row._excerptSites) || [];
    },

    // Top testimony places for a card; the active place filter is always
    // pinned first so it's visible why the result matched the filter.
    testimonyChipsFor(row) {
      const sites = this.sitesForRg(row.rg);
      if (this.placeFilter && sites.includes(this.placeFilter)) {
        return [this.placeFilter, ...sites.filter(x => x !== this.placeFilter).slice(0, 3)];
      }
      return sites.slice(0, 4);
    },

    togglePlaceFilter() {
      if (!this.selectedSite) return;
      this.placeFilter = this.isPlaceFilterActive ? null : this.selectedSite.SiteName;
    },

    async loadFilterOptions() {
      try {
        const basePath = process.env.NUXT_PUBLIC_BASE_PATH || '';
        const resp = await fetch(`${basePath}/data/filters.json`);
        if (!resp.ok) return;
        const data = await resp.json();
        const uniq = xs => [...new Set((xs || []).map(x => (x ?? '').toString().trim()))].filter(Boolean);
        this.filterOptions = {
          genders: uniq(data.genders),
          countries: uniq(data.countries),
          experienceGroups: uniq(data.experience_groups),
          birthYears: [...new Set((data.birth_years || []).map(Number).filter(Number.isFinite))].sort((a, b) => a - b)
        };
      } catch (e) {
        console.warn('filters.json load failed', e);
      }
    },

    resetExplore() {
      this.queryText = '';
      this.queryType = 'Vector';
      this.results = [];
      this.searched = false;
      this.errorMessage = '';
      this.lastQueryText = '';
      this.placeFilter = null;
      this.selectedSite = null;
      this.siteChoices = null;
      this.scoreThreshold = 0;
      this.visibleCount = 50;
      this.clearBioFilters();
      if (process.client) {
        window.history.replaceState(window.history.state, '', this.$route.path);
      }
    },

    clearBioFilters() {
      this.bioGender = '';
      this.bioCountry = '';
      this.bioExperience = '';
      this.bioBirthYear = '';
      this.bioRg = '';
    },

    async submitSearch() {
      const q = this.queryText.trim();
      if (!q || this.searching) return;
      this.searched = true;
      this.searching = true;
      this.errorMessage = '';
      this.results = [];
      this.lastQueryText = q;

      // Keep the URL shareable without triggering a route change
      if (process.client) {
        const url = `${this.$route.path}?q=${encodeURIComponent(q)}`;
        window.history.replaceState(window.history.state, '', url);
      }

      try {
        let results = await this.runTestimonySearch({
          queryType: this.queryType,
          queryText: q,
          numResults: this.numResults,
          testimonyFilters: this.bioFilterCount > 0,
          gender: this.bioGender,
          country: this.bioCountry,
          experienceGroup: this.bioExperience,
          birthYear: this.bioBirthYear,
          rgNumber: this.bioRg
        });
        if (this.scoreThreshold > 0 && this.queryType !== 'Keyword') {
          results = results.filter(r => r.score != null && r.score >= this.scoreThreshold);
        }
        results.forEach(r => { r._excerptSites = this.computeExcerptSites(r); });
        this.results = results;
        this.placeFilter = null;
        this.visibleCount = 50;
      } catch (err) {
        this.errorMessage = (err && err.message) || 'Unknown error.';
      } finally {
        this.searching = false;
        this.searchStage = '';
      }
    },

    runExample(q) {
      this.queryText = q;
      this.queryType = 'Hybrid';
      this.submitSearch();
    },

    onSitesClick(choicesList) {
      this.siteChoices = choicesList;
    },
    pickSiteChoice(props) {
      this.siteChoices = null;
      this.onSiteClick(props);
    },

    onSiteClick(props) {
      // Selecting a place never clobbers an existing search — the side
      // panel has an explicit button for that. Only auto-search when the
      // user hasn't searched anything yet.
      this.selectedSite = props;
      this.enrichSelectedSite(props.SiteName);
      if (!this.searched) this.searchSelectedPlace();
    },

    // Fill in full tile attributes if the selection only carries a name
    enrichSelectedSite(rawName) {
      if (!rawName || !this.$refs.exploreMap) return;
      if (this.selectedSite && this.selectedSite.EncyStruc !== undefined) return;
      this.$refs.exploreMap.getFeatureByName(rawName).then(full => {
        if (full && this.selectedSite && this.selectedSite.SiteName === rawName) {
          this.selectedSite = full;
        }
      });
    },

    searchSelectedPlace() {
      const name = this.cleanName(this.selectedSite && this.selectedSite.SiteName);
      if (!name) return;
      this.queryText = name;
      this.queryType = 'Hybrid';
      this.submitSearch();
    },

    focusSite(rawName) {
      const info = MENTIONS[rawName];
      this.selectedSite = {
        SiteName: rawName,
        SiteType: (info && info.site_type) || ''
      };
      const mapComp = this.$refs.exploreMap;
      if (info && info.lng != null && mapComp) {
        mapComp.flyTo([info.lng, info.lat], 7);
      }
      this.enrichSelectedSite(rawName);
    },

    clearSelection() {
      this.selectedSite = null;
      this.siteChoices = null;
    },

    downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },

    // Highlighted sites (per current toggles/filters) as a GeoJSON
    // FeatureCollection, with the query recorded alongside.
    exportSitesGeojson() {
      const features = this.activeSiteNames
        .map(name => {
          const m = MENTIONS[name];
          if (!m || m.lng == null) return null;
          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [m.lng, m.lat] },
            properties: {
              name: this.cleanName(name),
              site_type: m.site_type || null,
              testimonies_naming_site: m.transcripts,
              passages_naming_site: m.occurrences,
              rg_numbers: m.rg_numbers
            }
          };
        })
        .filter(Boolean);
      const fc = {
        type: 'FeatureCollection',
        query: this.exportSummary,
        exported_at: new Date().toISOString(),
        features
      };
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.downloadBlob(
        new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' }),
        `placing-holocaust-sites-${stamp}.geojson`
      );
    },

    // Current map view as a PNG with the query written into a caption bar.
    // The canvas is read inside a 'render' callback so the WebGL buffer is
    // guaranteed to hold the frame (works regardless of preserveDrawingBuffer).
    exportMapPng() {
      const mapComp = this.$refs.exploreMap;
      if (!mapComp || !mapComp.map) return;
      mapComp.map.once('render', () => this.composeMapPng(mapComp.map.getCanvas()));
      mapComp.map.triggerRepaint();
    },

    composeMapPng(src) {
      const scale = window.devicePixelRatio || 1;
      const captionLines = [];
      if (this.lastQueryText) {
        captionLines.push(`Query: ${this.exportSummary.replace('; via /explore', '')}`);
        captionLines.push(
          `${this.filteredResults.length} passages · ${this.resultRgs.length} testimonies · ` +
          `${this.activeSiteNames.length} mapped sites${this.excerptOnly ? ' (excerpt-level)' : ''}`
        );
      } else {
        captionLines.push('Placing the Holocaust — map view');
      }
      captionLines.push(`Exported ${new Date().toISOString().slice(0, 10)} · placingtheholocaust.org`);

      const lineH = 22 * scale;
      const padY = 14 * scale;
      const capH = captionLines.length * lineH + padY * 2;
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
      captionLines.forEach((line, i) => {
        ctx.fillText(line, 14 * scale, src.height + padY + (i + 0.8) * lineH - lineH * 0.25);
      });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      out.toBlob(blob => {
        if (blob) this.downloadBlob(blob, `placing-holocaust-map-${stamp}.png`);
      }, 'image/png');
    },

    zoomToResults() {
      const coords = this.activeSiteNames
        .map(n => MENTIONS[n])
        .filter(m => m && m.lng != null)
        .map(m => [m.lng, m.lat]);
      if (!coords.length || !this.$refs.exploreMap) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [x, y] of coords) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
      this.$refs.exploreMap.map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 60, duration: 1200, maxZoom: 9 });
    }
  }
};
</script>

<style scoped>
.explore-page {
  display: flex;
  flex: 1;               /* claim full width inside the layout's flex main */
  min-width: 0;
  height: calc(100vh - var(--site-header-height, 64px));
  overflow: hidden;
}

.map-pane {
  flex: 1;
  min-width: 0;
  position: relative;
}

.search-pane {
  flex: 0 0 auto;
  width: 480px;
  max-width: 48%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e2e2e2;
  background: #fff;
  overflow: hidden;
}

/* --- Search bar --- */
.search-bar {
  padding: 14px 16px 10px;
  border-bottom: 1px solid #ececec;
  background: #fafafa;
}

.query-input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
}
.query-input:focus {
  outline: 2px solid #000;
  outline-offset: -1px;
  border-color: #000;
}

.search-bar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
}

.mode-toggle {
  display: inline-flex;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.mode-toggle button {
  padding: 6px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  color: #444;
}
.mode-toggle button + button {
  border-left: 1px solid #e2e2e2;
}
.mode-toggle button.active {
  background: #000;
  color: #fff;
}

.bar-actions { display: inline-flex; gap: 6px; }
.reset-btn {
  padding: 7px 12px;
  background: #fff;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
}
.reset-btn:hover { border-color: #000; }
.search-btn {
  padding: 7px 18px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}
.search-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

/* --- Advanced options --- */
.advanced-opts { margin-top: 8px; }
.advanced-opts summary {
  cursor: pointer;
  font-size: 0.8rem;
  color: #666;
  user-select: none;
}
.advanced-opts summary:hover { color: #000; }
.advanced-row {
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 0 2px;
}
.adv-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #444;
}
.adv-field input[type="number"] {
  width: 78px;
  padding: 4px 7px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.adv-slider input[type="range"] { width: 110px; }
.adv-slider.disabled { opacity: 0.45; }
.adv-value {
  min-width: 30px;
  font-variant-numeric: tabular-nums;
  color: #222;
}
.bio-row { border-top: 1px dashed #e2e2e2; margin-top: 6px; padding-top: 10px; }
.adv-field select {
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  max-width: 130px;
}
.adv-text {
  width: 90px;
  padding: 4px 7px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.adv-clear {
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  color: #333;
  padding: 4px 10px;
  font-size: 0.78rem;
  cursor: pointer;
}
.adv-clear:hover { border-color: #000; }
.adv-badge {
  display: inline-block;
  margin-left: 6px;
  background: #000;
  color: #fff;
  border-radius: 9px;
  font-size: 0.68rem;
  padding: 0 7px;
  font-weight: 600;
}
.adv-hint {
  margin: 4px 0 0;
  font-size: 0.72rem;
  color: #999;
  line-height: 1.4;
}

/* --- Selected place metadata panel (docked over the map, left) --- */
.site-panel {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 300px;
  max-width: calc(100% - 70px);
  max-height: calc(100% - 48px);
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  padding: 12px 14px;
  z-index: 3;
}
.site-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.site-panel-title {
  margin: 0 0 4px;
  font-size: 1.05rem;
}
.site-type {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  background: #f3f3f3;
  border: 1px solid #ddd;
  font-size: 0.72rem;
}
.site-panel-mention {
  margin: 8px 0;
  font-size: 0.82rem;
  color: #444;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}
.site-panel-mention.muted { font-style: italic; color: #888; }
.site-panel-fields { margin: 0; }
.site-field { margin-bottom: 7px; }
.site-field dt {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #999;
}
.site-field dd {
  margin: 1px 0 0;
  font-size: 0.84rem;
  color: #222;
  overflow-wrap: anywhere;
}
.site-search-btn {
  display: block;
  width: 100%;
  margin: 0 0 10px;
  padding: 7px 10px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  font-size: 0.82rem;
}
.site-search-btn:hover { background: #2a2a2a; }
.site-filter-btn {
  display: block;
  width: 100%;
  margin: 0 0 10px;
  padding: 7px 10px;
  background: #fff;
  color: #000;
  border: 1px solid #000;
  border-radius: 7px;
  cursor: pointer;
  font-size: 0.82rem;
}
.site-filter-btn:hover { background: #f2f2f2; }
.site-filter-btn.active {
  background: #ffe9a8;
  border-color: #c79600;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  padding: 1px 4px 1px 9px;
  background: #ffe9a8;
  border: 1px solid #c79600;
  border-radius: 11px;
  font-size: 0.78rem;
}
.filter-chip-clear {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1;
  padding: 0 3px;
  color: #6b5200;
}
.filter-chip-clear:hover { color: #000; }
.val-pills {
  margin: 2px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.val-pill {
  background: #f1f1f1;
  border: 1px solid #e2e2e2;
  border-radius: 10px;
  padding: 1px 8px;
  font-size: 0.76rem;
  color: #333;
}
.cert-badge {
  display: inline-block;
  margin-left: 5px;
  padding: 0 7px;
  border-radius: 9px;
  background: #f3f0e8;
  border: 1px solid #ddd2b8;
  font-size: 0.66rem;
  color: #6b5d3a;
  vertical-align: middle;
  white-space: nowrap;
}
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
.site-choice-type {
  font-size: 0.72rem;
  color: #777;
  flex: none;
}
.site-panel-note {
  margin: 6px 0 0;
  font-size: 0.78rem;
  color: #999;
  font-style: italic;
}
.clear-site {
  border: none;
  background: transparent;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  color: #666;
  padding: 2px 6px;
  flex: none;
}
.clear-site:hover { color: #000; }

/* --- Status --- */
.status-line {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  color: #666;
  font-style: italic;
  font-size: 0.9rem;
}
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #ccc;
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex: none;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-banner {
  margin: 12px 16px;
  padding: 10px 12px;
  background: #fbecec;
  border: 1px solid #e5b4b4;
  border-radius: 6px;
  color: #7a2a2a;
  font-size: 0.9rem;
}

/* --- Tandem strip --- */
.tandem-strip {
  padding: 9px 16px;
  border-bottom: 1px solid #ececec;
  background: #fff;
  font-size: 0.85rem;
}
.tandem-counts { color: #333; }
.tandem-controls {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.tandem-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: #444;
}
.zoom-btn {
  color: #333;
  padding: 3px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
}
.zoom-btn:hover:not(:disabled) { border-color: #000; }
.zoom-btn:disabled { opacity: 0.4; cursor: default; }

/* --- Results --- */
.results-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 10px 16px 20px;
}

.result-card {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.result-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}
.result-name { font-size: 0.95rem; text-transform: capitalize; }
.result-score { flex: none; }
.score-bar {
  display: inline-block;
  width: 70px;
  height: 6px;
  background: #ececec;
  border-radius: 3px;
  overflow: hidden;
  vertical-align: middle;
}
.score-fill {
  display: block;
  height: 100%;
  background: #000;
}
.result-meta {
  margin: 2px 0 6px;
  font-size: 0.78rem;
  color: #777;
}
.result-excerpt {
  margin: 0 0 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #333;
}
.result-excerpt >>> mark {
  background: #f5e6a8;
  padding: 0 2px;
  border-radius: 2px;
}
.result-places {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 6px;
}
.places-label {
  font-size: 0.75rem;
  color: #888;
}
.place-chip {
  padding: 2px 9px;
  border: 1px solid #d8d8d8;
  border-radius: 11px;
  background: #f7f7f7;
  font-size: 0.76rem;
  cursor: pointer;
  color: #333;
}
.place-chip:hover {
  border-color: #000;
  background: #fff;
}
.places-more { font-size: 0.75rem; color: #999; }
.excerpt-chip {
  background: #fff8e1;
  border-color: #e0c368;
}
.filtered-chip {
  background: #ffe9a8;
  border-color: #c79600;
  font-weight: 600;
}
.excerpt-chip:hover { border-color: #000; }
.show-more {
  display: block;
  margin: 14px auto 0;
  padding: 8px 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 0.85rem;
}
.show-more:hover { border-color: #000; }
.result-actions { font-size: 0.82rem; }
.result-actions a { color: #000; }
.link-btn {
  border: none;
  background: transparent;
  padding: 0;
  color: #000;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.82rem;
}

.export-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 7px;
  flex-wrap: wrap;
}
.export-label { font-size: 0.78rem; color: #888; }
.export-row button {
  color: #333;
  padding: 3px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.78rem;
}
.export-row button:hover:not(:disabled) { border-color: #000; }
.export-row button:disabled { opacity: 0.4; cursor: default; }

/* --- Empty / intro state --- */
.empty-state,
.intro-state {
  padding: 24px 20px;
  color: #555;
}
.intro-state h2 {
  font-size: 1.15rem;
  margin: 0 0 8px;
}
.intro-state p {
  font-size: 0.92rem;
  line-height: 1.55;
  margin: 0 0 10px;
}
.try-label {
  font-weight: 600;
  color: #333;
}
.example-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.example-chip {
  color: #333;
  padding: 5px 13px;
  border: 1px solid #ccc;
  border-radius: 15px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
}
.example-chip:hover {
  border-color: #000;
  background: #f5f5f5;
}

@media (max-width: 800px) {
  .explore-page { flex-direction: column; }
  .search-pane { width: 100%; max-width: 100%; height: 55%; }
  .map-pane { height: 45%; flex: none; }
}
</style>
