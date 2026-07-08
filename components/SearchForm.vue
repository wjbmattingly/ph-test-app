<template>
  <div :class="['search-form-container', { floating }]">
    <aside :class="['search-panel', { floating }]">
      <h2 v-if="!hideQuery">Search</h2>

      <form @submit.prevent="submitSearch">
        <!-- Query basics (hidden when the host page provides its own bar) -->
        <section v-if="!hideQuery" class="dataset-section">
          <div class="section-header">
            <h3>Query</h3>
          </div>
          <div class="field-group">
            <label for="qText">Query Text</label>
            <input id="qText" type="text" v-model="queryText" placeholder="Enter your search term" />
          </div>

          <div class="field-group">
            <label for="qType">Type of Search</label>
            <select id="qType" v-model="queryType">
              <option>Vector</option>
              <option>Keyword</option>
              <option>Hybrid</option>
            </select>
          </div>
        </section>

        <hr v-if="!hideQuery" class="section-divider" />

        <!-- Places -->
        <details class="dataset-section" :open="selectedPlaces.length > 0">
          <summary class="section-summary-toggle">
            <h3>Places Filter</h3>
            <span v-if="selectedPlaces.length" class="active-badge">{{ selectedPlaces.length }}</span>
          </summary>
          <div class="dataset-controls">
            <div class="control-collapsible">
              <div class="control-summary">
                <span class="filter-label">Select Place Labels</span>
                <span class="summary-count">
                  ({{ selectedPlaces.length }}/{{ placeOptions.length }})
                </span>
              </div>

              <div class="multi-select">
                <div class="multi-buttons">
                  <button
                    v-for="(pl, idx) in placeOptions"
                    :key="idx"
                    type="button"
                    :class="{ selected: selectedPlaces.includes(pl) }"
                    @click="toggleChip('selectedPlaces', pl)"
                  >
                    {{ pl }}
                  </button>
                </div>
                <div class="multi-actions">
                  <button type="button" @click="selectAll('selectedPlaces', placeOptions)">Select All</button>
                  <button type="button" @click="clearAll('selectedPlaces')">Clear</button>
                </div>
              </div>
            </div>
          </div>
        </details>

        <hr class="section-divider" />

        <!-- Testimony Filters -->
        <details class="dataset-section" :open="activeTestimonyFilterCount > 0">
          <summary class="section-summary-toggle">
            <h3>Testimony Filters</h3>
            <span v-if="activeTestimonyFilterCount" class="active-badge">{{ activeTestimonyFilterCount }}</span>
          </summary>

          <div class="dataset-controls">
            <!-- Category: multi-select chips -->
            <div class="control-collapsible">
              <div class="control-summary">
                <span class="filter-label">Category</span>
                <span class="summary-count">({{ category.length }}/{{ categoryOptions.length }})</span>
              </div>
              <div class="multi-select">
                <div class="multi-buttons">
                  <button
                    v-for="(c, i) in categoryOptions"
                    :key="i"
                    type="button"
                    :class="{ selected: category.includes(c) }"
                    @click="toggleChip('category', c)"
                  >
                    {{ c }}
                  </button>
                </div>
                <div class="multi-actions">
                  <button type="button" @click="selectAll('category', categoryOptions)">Select All</button>
                  <button type="button" @click="clearAll('category')">Clear</button>
                </div>
              </div>
            </div>

            <!-- Single-select dropdowns / inputs -->
            <div class="grid-two">
              <div class="field-group">
                <label for="gender">Gender</label>
                <select id="gender" v-model="selectedGender">
                  <option value="">All</option>
                  <option v-for="(g, i) in gendersSanitized" :key="i" :value="g">{{ g }}</option>
                </select>
              </div>

              <div class="field-group">
                <label for="country">Country</label>
                <select id="country" v-model="selectedCountry">
                  <option value="">All</option>
                  <option v-for="(c, i) in countriesSanitized" :key="i" :value="c">{{ c }}</option>
                </select>
              </div>

              <div class="field-group">
                <label for="experience">Experience Group</label>
                <select id="experience" v-model="selectedExperienceGroup">
                  <option value="">All</option>
                  <option v-for="(e, i) in experienceGroupsSanitized" :key="i" :value="e">{{ e }}</option>
                </select>
              </div>

              <div class="field-group">
                <label for="birthYear">Birth Year</label>
                <select id="birthYear" v-model.number="selectedBirthYear">
                  <option :value="''">All</option>
                  <option v-for="(y, i) in birthYearsSanitized" :key="i" :value="Number(y)">{{ Number(y) }}</option>
                </select>
              </div>
            </div>

            <div class="grid-two">
              <div class="field-group">
                <label for="rg">RG Number</label>
                <input id="rg" type="text" v-model.trim="rgNumber" placeholder="RG..." />
              </div>
              <div class="field-group">
                <label for="fullName">Full Name</label>
                <input id="fullName" type="text" v-model.trim="fullName" placeholder="Full name…" />
              </div>
            </div>
          </div>
        </details>

        <hr class="section-divider" />

        <!-- Advanced Options -->
        <details class="dataset-section">
          <summary class="section-summary-toggle">
            <h3>Advanced Options</h3>
          </summary>
          <div class="advanced-panel">
            <div class="field-group">
              <label for="num">Number of Results</label>
              <input id="num" type="number" v-model.number="numResults" min="1" max="5000" />
            </div>
          </div>
        </details>

        <!-- Submit -->
        <div class="actions">
          <button type="submit" class="primary" :disabled="busy">
            {{ busy ? 'Searching…' : (hideQuery ? 'Apply filters' : 'Search') }}
          </button>
          <button type="button" class="secondary" @click="resetForm">Reset</button>
        </div>
      </form>

      <div v-if="showQuerySummary && filterDescription" class="query-summary">
        <h4>Current Query</h4>
        <p>{{ filterDescription }}</p>
      </div>
    </aside>
  </div>
</template>

<script>
export default {
  name: "SearchForm",
  props: {
    genders: { type: Array, default: () => [] },
    countries: { type: Array, default: () => [] },
    experienceGroups: { type: Array, default: () => [] },
    birthYears: { type: Array, default: () => [] },
    placeLabelOptions: { type: Array, default: () => [] },
    showQuerySummary: { type: Boolean, default: false },
    floating: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    initialQueryText: { type: String, default: '' },
    hideQuery: { type: Boolean, default: false }
  },
  data() {
    return {
      queryType: "Vector",
      queryText: this.initialQueryText || "",
      togglePlaces: false,
      selectedPlaces: [],
      toggleTestimonyFilters: false,
      category: [],
      selectedGender: "",
      selectedCountry: "",
      selectedExperienceGroup: "",
      selectedBirthYear: "",
      rgNumber: "",
      fullName: "",
      toggleAdvanced: false,
      numResults: 1000,
      categoryOptions: ["question", "answer"]
    };
  },
  watch: {
    initialQueryText(val) {
      this.queryText = val || "";
    }
  },
  computed: {
    // Sanitize/normalize props for robust matching
    gendersSanitized() {
      const xs = (this.genders || []).map(g => (g ?? '').toString().trim());
      return [...new Set(xs)].filter(Boolean);
    },
    countriesSanitized() {
      const xs = (this.countries || []).map(c => (c ?? '').toString().trim());
      return [...new Set(xs)].filter(Boolean);
    },
    experienceGroupsSanitized() {
      const xs = (this.experienceGroups || []).map(e => (e ?? '').toString().trim());
      return [...new Set(xs)].filter(Boolean);
    },
    birthYearsSanitized() {
      const ys = (this.birthYears || [])
        .map(y => Number(y))
        .filter(y => Number.isFinite(y));
      return [...new Set(ys)].sort((a,b) => a - b);
    },
    placeOptions() {
      return (this.placeLabelOptions || []).map(pl => pl.label);
    },
    activeTestimonyFilterCount() {
      let n = this.category.length ? 1 : 0;
      if ((this.selectedGender || '').trim()) n++;
      if ((this.selectedCountry || '').trim()) n++;
      if ((this.selectedExperienceGroup || '').trim()) n++;
      if (this.selectedBirthYear !== '') n++;
      if ((this.rgNumber || '').trim()) n++;
      if ((this.fullName || '').trim()) n++;
      return n;
    },
    filterDescription() {
      const parts = [];
      // In hideQuery mode the host page owns query text/type and reports them
      if (!this.hideQuery) {
        if (this.queryText) parts.push(`q="${this.queryText}"`);
        if (this.queryType) parts.push(`type=${this.queryType}`);
      }
      if (this.selectedPlaces.length) parts.push(`places=[${this.selectedPlaces.join(", ")}] (any of)`);
      if (this.category.length) parts.push(`category=[${this.category.join(", ")}]`);
      if (this.selectedGender) parts.push(`gender=${this.selectedGender}`);
      if (this.selectedCountry) parts.push(`country=${this.selectedCountry}`);
      if (this.selectedExperienceGroup) parts.push(`exp=${this.selectedExperienceGroup}`);
      if (this.selectedBirthYear) parts.push(`birthYear=${this.selectedBirthYear}`);
      if (this.rgNumber) parts.push(`RG=${this.rgNumber}`);
      if (this.fullName) parts.push(`name="${this.fullName}"`);
      if (this.numResults !== 1000) parts.push(`n=${this.numResults}`);
      return parts.join("; ");
    }
  },
  methods: {
    toggleChip(fieldName, value) {
      const arr = this[fieldName];
      const i = arr.indexOf(value);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(value);
    },
    selectAll(fieldName, options) {
      this[fieldName] = [...options];
    },
    clearAll(fieldName) {
      this[fieldName] = [];
    },
    resetForm() {
      this.queryType = "Vector";
      this.queryText = "";
      this.togglePlaces = false;
      this.selectedPlaces = [];
      this.toggleTestimonyFilters = false;
      this.category = [];
      this.selectedGender = "";
      this.selectedCountry = "";
      this.selectedExperienceGroup = "";
      this.selectedBirthYear = "";
      this.rgNumber = "";
      this.fullName = "";
      this.toggleAdvanced = false;
      this.numResults = 1000;
    },
    submitSearch() {
      const hasTestimonyFilters = !!(
        this.category.length ||
        (this.selectedGender || '').trim() ||
        (this.selectedCountry || '').trim() ||
        (this.selectedExperienceGroup || '').trim() ||
        this.selectedBirthYear !== '' ||
        (this.rgNumber || '').trim() ||
        (this.fullName || '').trim()
      );
      const filters = {
        queryType: this.queryType,
        queryText: (this.queryText || '').trim(),
        // Activate filter groups whenever the user has actually set values.
        // (Previously these relied on toggle flags that no UI ever set,
        // so every filter was silently ignored.)
        placesHeader: this.selectedPlaces.length > 0,
        labels: this.selectedPlaces.slice(),
        testimonyFilters: hasTestimonyFilters,
        category: this.category.slice(),
        gender: (this.selectedGender || '').trim(),
        country: (this.selectedCountry || '').trim(),
        experienceGroup: (this.selectedExperienceGroup || '').trim(),
        // Ensure number (or blank) for birthYear
        birthYear: this.selectedBirthYear === '' ? '' : Number(this.selectedBirthYear),
        rgNumber: (this.rgNumber || '').trim(),
        fullName: (this.fullName || '').trim(),
        advanced: !!this.toggleAdvanced,
        numResults: Number(this.numResults) || 100
      };
      this.$emit("search-submitted", { ...filters, _summary: this.filterDescription });
    }
  }
};
</script>

<style scoped>
/* Container supports inline *and* floating modes */
.search-form-container {
  position: relative;
  height: 100%;
  box-sizing: border-box;
}
.search-form-container.floating { height: auto; }

/* Panel */
.search-panel {
  width: 100%;
  max-width: 100%;
  background: rgba(255,255,255,0.95);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  overflow: visible;
}
.search-panel.floating {
  position: absolute;
  top: 20px; left: 20px;
  width: 360px;
  max-height: calc(100vh - 40px);
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 2;
}

h2 { margin: 0 0 8px; font-size: 1.2rem; }

/* Sections */
.dataset-section { margin-top: 8px; }
.section-summary {
  display: flex; align-items: center; justify-content: space-between;
  font-weight: 600; padding: 4px 0;
}
.summary-switch { margin-left: 10px; }
.section-divider { border: none; border-top: 1px solid #ccc; margin: 12px 0 8px; }

/* Fields */
.field-group { margin-bottom: 12px; }
.field-group label { font-weight: 600; margin-bottom: 6px; display: block; }
.field-group input[type="text"],
.field-group input[type="number"],
.field-group select { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; background: #fff; box-sizing: border-box; }
.grid-two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

/* Collapsible chips */
.control-collapsible {
  border: 1px solid #e3e3e3; border-radius: 8px; padding: 6px 8px;
  background: rgba(250,250,250,0.9); margin-bottom: 10px;
}
.control-summary { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; }
.filter-label { font-weight: 600; }
.summary-count { font-size: 0.85em; color: #555; }

/* Chips */
.multi-buttons { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 6px; }
.multi-buttons button {
  padding: 4px 10px; border: none; border-radius: 14px;
  background: #e6e6e7; color: #000; cursor: pointer;
}
.multi-buttons button.selected { background: #000; color: #fff; }
.multi-actions { display: flex; gap: 8px; }
.multi-actions button {
  font-size: 0.8em; background: #f4f4f4; border: none; border-radius: 6px; padding: 4px 8px; cursor: pointer;
}
.section-header { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; }
.section-summary-toggle {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; padding: 4px 0; list-style: none;
}
.section-summary-toggle::-webkit-details-marker { display: none; }
.section-summary-toggle::before {
  content: '▸'; font-size: 0.8em; color: #666; transition: transform 0.15s;
}
details[open] > .section-summary-toggle::before { transform: rotate(90deg); }
.section-summary-toggle h3 { margin: 0; font-size: 1rem; }
.active-badge {
  background: #000; color: #fff; border-radius: 10px;
  font-size: 0.72rem; padding: 1px 8px; font-weight: 600;
}
.toggle { font-size:0.9em; color:#444; }
.query-summary { margin-top:12px; padding:8px 10px; background:#f7f7fa; border:1px solid #e3e3ec; border-radius:6px; font-size:0.9rem; color:#333; }

/* Actions */
.actions { display: flex; gap: 8px; margin-top: 8px; }
button.primary {
  padding: 10px 12px; background: #000; color: #fff; border: none; border-radius: 6px; cursor: pointer;
}
button.secondary {
  padding: 10px 12px; background: #f4f4f4; color: #000; border: none; border-radius: 6px; cursor: pointer;
}

/* Legend-like box (only when floating) */
.legend-like {
  position: absolute; top: 20px; right: 20px;
  max-width: 360px; max-height: calc(100vh - 40px); overflow: auto;
  background: rgba(255,255,255,0.95); padding: 10px 12px; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 2;
}
.legend-like h3 { margin: 0 0 6px; font-size: 1rem; }
.legend-like p { margin: 0; font-size: 0.9rem; color: #333; }
</style>
