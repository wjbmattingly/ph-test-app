<template>
  <div class="search-page layout-with-sidebar">
    <!-- Sidebar: Filters -->
    <aside class="left-sidebar">
      <h2 class="sidebar-title">Filters</h2>

      <div v-if="loading" class="loading-indicator">
        Loading filter data...
      </div>

      <SearchForm
        v-else
        ref="searchForm"
        :genders="genders"
        :countries="countries"
        :experienceGroups="experienceGroups"
        :birthYears="birthYears"
        :placeLabelOptions="placeLabelOptions"
        :busy="searching"
        hide-query
        show-query-summary
        @search-submitted="onSearchFormSubmitted"
      />
    </aside>

    <!-- Main Content -->
    <main class="content-area">
      <h1 class="page-heading">Search Transcripts</h1>

      <!-- Prominent query bar -->
      <form class="query-bar" @submit.prevent="onQueryBarSubmit">
        <input
          v-model="queryText"
          type="text"
          class="query-input"
          placeholder="Search nearly 1,000 USHMM testimonies — by meaning, not just keywords"
          aria-label="Search testimony"
        />
        <div class="query-bar-row">
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
          <button type="submit" class="search-btn" :disabled="searching || !queryText.trim()">
            {{ searching ? 'Searching…' : 'Search' }}
          </button>
        </div>
      </form>

      <div v-if="lastQuerySummary" class="query-summary-inline">
        <strong>Query:</strong> {{ lastQuerySummary }}
        <span class="filter-semantics">Filters combine with AND; values within a filter (and place labels) combine with OR.</span>
      </div>

      <div v-if="searching" class="loading-indicator searching-indicator">
        <span class="spinner" aria-hidden="true"></span>
        {{ searchStage }}
      </div>

      <div v-if="errorMessage" class="error-banner">
        <strong>Search failed.</strong> {{ errorMessage }}
      </div>

      <div v-if="results.length" class="results-list">
        <div class="results-toolbar">
          <h2 class="results-count">Results ({{ results.length }})</h2>
          <div class="toolbar-actions">
            <NuxtLink class="map-link" :to="exploreLink">View on map →</NuxtLink>
            <button type="button" @click="exportSearchResults(results, lastQuerySummary, 'csv')">Export CSV</button>
            <button type="button" @click="exportSearchResults(results, lastQuerySummary, 'json')">Export JSON</button>
          </div>
        </div>

        <div v-for="(row, idx) in visibleResults" :key="idx" class="result-card">
          <div class="card-header">
            <strong class="card-name">{{ displayName(row) || 'Unknown interviewee' }}</strong>
            <span v-if="row.score != null" class="card-score" :title="'Similarity ' + row.score">
              {{ row.score }}
              <span class="score-bar"><span class="score-fill" :style="{ width: scoreWidth(row.score) }"></span></span>
            </span>
          </div>
          <p class="card-meta">
            {{ row.rg }}<template v-if="row.birth_year"> · b. {{ row.birth_year }}</template><template v-if="row.birth_country"> · {{ row.birth_country }}</template><template v-if="row.gender"> · {{ row.gender }}</template><template v-if="row.experience_group"> · {{ row.experience_group }}</template>
          </p>
          <p class="excerpt" v-html="highlightExcerpt(row.text, lastQueryText)"></p>
          <div class="card-actions">
            <button type="button" class="link-btn" @click="openTranscript(row)">Open in transcript</button>
          </div>
        </div>

        <button
          v-if="visibleCount < results.length"
          type="button"
          class="show-more"
          @click="visibleCount += 20"
        >
          Show more ({{ results.length - visibleCount }} remaining)
        </button>
      </div>

      <div v-else-if="searched && !searching && !errorMessage" class="no-results">
        <p>No results found. Try broader phrasing, or switch to Semantic mode to match by meaning.</p>
      </div>

      <div v-else-if="!searched && !searching" class="intro-hint">
        <p>
          <strong>Semantic</strong> finds passages by meaning ("fear during transport" finds descriptions, not just those words).
          <strong>Keyword</strong> matches exact words. <strong>Hybrid</strong> blends both.
          Add biographic and place filters from the left panel.
        </p>
        <div class="example-chips">
          <button v-for="ex in exampleQueries" :key="ex" type="button" @click="runExample(ex)">{{ ex }}</button>
        </div>
      </div>
    </main>

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
import SearchForm from '@/components/SearchForm.vue'
import TranscriptModal from '@/components/TranscriptModal.vue'
import testimonySearch from '@/mixins/testimonySearch'

export default {
  name: "SearchPage",
  components: { SearchForm, TranscriptModal },
  mixins: [testimonySearch],
  data() {
    return {
      loading: true,
      searched: false,
      searching: false,
      searchStage: '',
      errorMessage: '',
      results: [],
      visibleCount: 20,
      lastQuerySummary: '',
      lastQueryText: '',
      transcriptModal: null,

      queryText: '',
      queryType: 'Vector',
      modes: [
        { value: 'Vector', label: 'Semantic', hint: 'Match by meaning, not exact words' },
        { value: 'Keyword', label: 'Keyword', hint: 'Match exact words (BM25)' },
        { value: 'Hybrid', label: 'Hybrid', hint: 'Blend of semantic and keyword' }
      ],
      exampleQueries: [
        'deportation by cattle car',
        'hunger in the ghetto',
        'hiding with a false identity',
        'liberation by the Americans'
      ],

      genders: [],
      countries: [],
      experienceGroups: [],
      birthYears: [],

      placeLabelOptions: [
        { label: "Regions" },
        { label: "Countries" },
        { label: "Populated Places" },
        { label: "Environmental Features" },
        { label: "Distinct Landscape Features" },
        { label: "Buildings" },
        { label: "Interior Spaces" },
        { label: "Spatial Objects" },
        { label: "Imaginary Places" }
      ]
    }
  },

  computed: {
    visibleResults() {
      return this.results.slice(0, this.visibleCount);
    },
    exploreLink() {
      return `/explore?q=${encodeURIComponent(this.lastQueryText)}`;
    }
  },

  async mounted() {
    await this.loadFilters();
    const q = decodeURIComponent(this.$route.query.q || '');
    if (q) {
      this.queryText = q;
      this.onQueryBarSubmit();
    }
  },

  watch: {
    '$route.query.q'(val) {
      const q = decodeURIComponent(val || '');
      if (q && q !== this.queryText) {
        this.queryText = q;
        this.onQueryBarSubmit();
      }
    }
  },

  methods: {
    openTranscript(row) {
      this.transcriptModal = {
        rg: (row.rg || '').toLowerCase(),
        sentenceId: (row.sentence_ids && row.sentence_ids[0]) || '',
        title: this.displayName(row)
      };
    },

    async loadFilters() {
      if (!process.client) return;
      try {
        const basePath = process.env.NUXT_PUBLIC_BASE_PATH || '';
        const origin = window.location.origin || '';
        const filterPath = basePath
          ? `${basePath.replace(/\/$/, '')}/data/filters.json`
          : `${origin}/data/filters.json`;
        const resp = await fetch(filterPath);
        const filterData = await resp.json();

        const rawGenders = filterData.genders || [];
        const rawCountries = filterData.countries || [];
        const rawExperience = filterData.experience_groups || [];
        const rawYears = filterData.birth_years || [];

        this.genders = [...new Set(rawGenders.map(g => (g ?? '').toString().trim()))].filter(Boolean);
        const trimmedCountries = rawCountries.map(c => (c ?? '').toString().trim()).filter(Boolean);
        this.countries = [...new Set(trimmedCountries)];
        this.experienceGroups = [...new Set(rawExperience.map(e => (e ?? '').toString().trim()))].filter(Boolean);
        const yearsNum = rawYears.map(y => Number(y)).filter(y => Number.isFinite(y));
        this.birthYears = [...new Set(yearsNum)].sort((a,b) => a - b);
      } catch (err) {
        console.error("Failed to load filters.json", err);
      } finally {
        this.loading = false;
      }
    },

    // Query bar submit: pull current filter state from the form (its emit
    // handler below merges in the query text and runs the search).
    onQueryBarSubmit() {
      if (!this.queryText.trim() || this.searching) return;
      const form = this.$refs.searchForm;
      if (form) {
        form.submitSearch();
      } else {
        // Filters not loaded yet — search without them.
        this.onSearchFormSubmitted({ queryType: this.queryType, queryText: this.queryText, numResults: 100 });
      }
    },

    runExample(q) {
      this.queryText = q;
      this.onQueryBarSubmit();
    },

    async onSearchFormSubmitted(formData) {
      const merged = {
        ...formData,
        queryText: this.queryText.trim(),
        queryType: this.queryType
      };
      if (!merged.queryText) return;

      this.searched = true;
      this.searching = true;
      this.errorMessage = '';
      this.results = [];
      this.visibleCount = 20;
      this.lastQueryText = merged.queryText;
      const filterPart = formData._summary ? `; ${formData._summary}` : '';
      this.lastQuerySummary = `q="${merged.queryText}"; type=${merged.queryType}${filterPart}`;

      if (process.client) {
        const url = `${this.$route.path}?q=${encodeURIComponent(merged.queryText)}`;
        window.history.replaceState(window.history.state, '', url);
      }

      try {
        this.results = await this.runTestimonySearch(merged);
      } catch (err) {
        console.error("Error during Weaviate query:", err);
        this.errorMessage = (err && err.message) || 'Unknown error.';
      } finally {
        this.searching = false;
        this.searchStage = '';
      }
    }
  }
}
</script>

<style scoped>
.search-page.layout-with-sidebar {
  display: flex;
  flex: 1;
  min-width: 0;
  height: calc(100vh - var(--site-header-height, 0px) - var(--site-footer-height, 0px));
  overflow: hidden;
}

.left-sidebar {
  width: 320px;
  padding: var(--space-m, 1rem);
  background: var(--color-bg, #fff);
  border-right: 1px solid #e2e2e2;
  overflow-y: auto;
}

.sidebar-title {
  font-size: 1.2rem;
  margin-bottom: var(--space-m, 1rem);
  font-weight: 600;
}

.content-area {
  flex: 1;
  padding: var(--space-m, 1rem) var(--space-l, 2rem);
  overflow-y: auto;
}

.page-heading {
  font-size: var(--font-xl, 1.75rem);
  margin-bottom: var(--space-m, 1rem);
}

/* --- Query bar --- */
.query-bar {
  max-width: 720px;
  margin-bottom: var(--space-m, 1rem);
}

.query-input {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 16px;
  font-size: 1.05rem;
  border: 1px solid #bbb;
  border-radius: 10px;
  background: #fff;
}
.query-input:focus {
  outline: 2px solid #000;
  outline-offset: -1px;
  border-color: #000;
}

.query-bar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  gap: 10px;
}

.mode-toggle {
  display: inline-flex;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.mode-toggle button {
  padding: 7px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.88rem;
  color: #444;
}
.mode-toggle button + button { border-left: 1px solid #e2e2e2; }
.mode-toggle button.active { background: #000; color: #fff; }

.search-btn {
  padding: 8px 22px;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
}
.search-btn:disabled { opacity: 0.45; cursor: default; }

/* --- Results --- */
.results-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-s, 0.75rem);
  margin-top: var(--space-m, 1rem);
  max-width: 860px;
  padding-bottom: var(--space-l, 2rem);
}

.results-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.results-count { font-size: var(--font-lg, 1.25rem); margin: 0; }

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-s, 0.5rem);
}

.map-link {
  color: #000;
  font-size: 0.9rem;
  margin-right: 6px;
}

.toolbar-actions button {
  color: #333;
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
}
.toolbar-actions button:hover { border-color: #000; }

.result-card {
  background: var(--color-bg, #fff);
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 14px 16px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.result-card:hover {
  border-color: #bbb;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}

.card-name { font-size: 1.02rem; text-transform: capitalize; }

.card-score {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.8rem;
  color: #666;
  flex: none;
}

.score-bar {
  display: inline-block;
  width: 90px;
  height: 7px;
  background: #ececec;
  border-radius: 4px;
  overflow: hidden;
}
.score-fill { display: block; height: 100%; background: #000; border-radius: 4px; }

.card-meta {
  margin: 3px 0 8px;
  font-size: 0.8rem;
  color: #777;
}

.excerpt {
  margin: 0 0 8px;
  font-size: 0.95rem;
  line-height: 1.55;
  color: #333;
}
.excerpt >>> mark {
  background: #f5e6a8;
  padding: 0 2px;
  border-radius: 2px;
}

.card-actions { font-size: 0.85rem; }
.card-actions a { color: #000; }
.link-btn {
  border: none;
  background: transparent;
  padding: 0;
  color: #000;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.85rem;
}

.show-more {
  color: #333;
  align-self: center;
  margin-top: 6px;
  padding: 9px 22px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9rem;
}
.show-more:hover { border-color: #000; }

/* --- States --- */
.no-results {
  margin-top: var(--space-m, 1rem);
  color: var(--color-secondary, #666);
  font-style: italic;
}

.intro-hint {
  max-width: 720px;
  margin-top: var(--space-s, 0.5rem);
  color: #555;
  font-size: 0.93rem;
  line-height: 1.55;
}

.example-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
}
.example-chips button {
  color: #333;
  padding: 5px 13px;
  border: 1px solid #ccc;
  border-radius: 15px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
}
.example-chips button:hover { border-color: #000; background: #f5f5f5; }

.loading-indicator {
  font-style: italic;
  color: var(--color-secondary, #777);
}

.searching-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: var(--space-m, 1rem) 0;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ccc;
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-banner {
  margin: var(--space-m, 1rem) 0;
  padding: 12px 14px;
  background: #fbecec;
  border: 1px solid #e5b4b4;
  border-radius: 6px;
  color: #7a2a2a;
  max-width: 720px;
}

.query-summary-inline {
  margin: var(--space-s, 0.5rem) 0 var(--space-m, 1rem);
  padding: 8px 10px;
  background: #f7f7fa;
  border: 1px solid #e3e3ec;
  border-radius: 6px;
  font-size: 0.9rem;
  max-width: 720px;
}

.filter-semantics {
  display: block;
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--color-secondary, #888);
}
</style>
