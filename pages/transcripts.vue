<template>
  <div class="transcripts-page">
    <template v-if="!$route.params.rg">
      <header class="page-header">
        <div>
          <p class="eyebrow">Transcripts</p>
          <h1>Interview Library</h1>
          <p class="lede">
            Browse the digitised testimony collection. Use the quick filters to narrow by country or experience group, or search by name or RG number.
          </p>
        </div>
        <div class="search-panel">
          <label class="sr-only" for="transcript-search">Search transcripts</label>
          <input
            id="transcript-search"
            v-model.trim="searchText"
            type="search"
            placeholder="Search by name, RG number, or keyword"
          />
          <div class="select-row">
            <label>
              Country
              <select v-model="countryFilter">
                <option value="">All</option>
                <option v-for="country in countries" :key="country" :value="country">{{ country }}</option>
              </select>
            </label>
            <label>
              Experience group
              <select v-model="experienceFilter">
                <option value="">All</option>
                <option v-for="group in experienceGroups" :key="group" :value="group">{{ group }}</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      <p class="results-count">
        Showing <strong>{{ filteredTranscripts.length }}</strong> of {{ transcripts.length }} transcripts
      </p>
    </template>

    <div v-if="!$route.params.rg && filteredTranscripts.length" class="transcripts-grid">
      <article v-for="item in filteredTranscripts" :key="item.slug" class="transcript-card">
        <div class="card-header">
          <h2>{{ capitalizeWords(displayName(item.interviewee)) || 'Unknown interviewee' }}</h2>
          <p class="rg-number">RG: {{ item.rg_number }}</p>
        </div>
        <ul class="card-meta">
          <li v-if="item.place_of_birth">
            <span class="label">Birthplace</span>
            <span>{{ capitalizeWords(item.place_of_birth) }}</span>
          </li>
          <li v-if="item.country">
            <span class="label">Country</span>
            <span>{{ capitalizeWords(item.country) }}</span>
          </li>
          <li v-if="item.experience_group">
            <span class="label">Experience</span>
            <span>{{ capitalizeWords(item.experience_group) }}</span>
          </li>
          <li v-if="item.birth_year">
            <span class="label">Birth year</span>
            <span>{{ item.birth_year }}</span>
          </li>
        </ul>
        <div class="card-actions">
          <NuxtLink class="primary-link" :to="`/transcripts/${item.slug}`">
            Open transcript
          </NuxtLink>
        </div>
      </article>
    </div>

    <div v-else-if="!$route.params.rg" class="empty-state">
      <p>No transcripts match your filters yet. Try clearing the search or selecting a different country.</p>
    </div>

    <!-- Detail view -->
    <NuxtChild v-if="$route.params.rg" />
  </div>
</template>

<script>
import { getTranscriptsManifest } from '@/utils/transcripts';

export default {
  name: 'TranscriptsPage',
  async asyncData() {
    try {
      const manifest = await getTranscriptsManifest('summary');
      return {
        transcripts: manifest?.items || []
      };
    } catch (err) {
      console.error('Failed to load transcripts manifest', err);
      return { transcripts: [] };
    }
  },
  data() {
    return {
      searchText: '',
      countryFilter: '',
      experienceFilter: ''
    };
  },
  computed: {
    countries() {
      const values = new Set(
        this.transcripts
          .map((item) => (item.country || '').trim())
          .filter(Boolean)
      );
      return Array.from(values).sort((a, b) => a.localeCompare(b));
    },
    experienceGroups() {
      const values = new Set(
        this.transcripts
          .map((item) => (item.experience_group || '').trim())
          .filter(Boolean)
      );
      return Array.from(values).sort((a, b) => a.localeCompare(b));
    },
    filteredTranscripts() {
      const term = this.searchText.toLowerCase();
      return this.transcripts.filter((item) => {
        const matchesTerm =
          !term ||
          item.interviewee?.toLowerCase().includes(term) ||
          item.rg_number?.toLowerCase().includes(term) ||
          item.excerpt?.toLowerCase().includes(term);

        const matchesCountry = !this.countryFilter || item.country === this.countryFilter;
        const matchesExperience =
          !this.experienceFilter || item.experience_group === this.experienceFilter;

        return matchesTerm && matchesCountry && matchesExperience;
      });
    }
  },
  methods: {
    displayName(name) {
      const cleaned = (name || '').replace(/\bNone\b/gi, '').replace(/\s+/g, ' ').trim();
      return cleaned;
    },
    capitalizeWords(text) {
      return (text || '')
        .toString()
        .split(' ')
        .map(w => w ? w[0].toUpperCase() + w.slice(1) : '')
        .join(' ')
        .trim();
    }
  }
};
</script>

<style scoped>
.transcripts-page {
  padding: 2rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  color: #666;
}

.lede {
  font-size: 1.05rem;
  color: #333;
}

.search-panel input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.select-row {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.select-row label {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
  color: #333;
}

.select-row select {
  margin-top: 0.35rem;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.results-count {
  font-size: 0.95rem;
  margin-bottom: 1rem;
  color: #444;
}

.transcripts-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.transcript-card {
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.025);
}

.card-header h2 {
  font-size: 1.3rem;
  margin: 0;
  color: #111;
}

.rg-number {
  font-size: 0.9rem;
  color: #555;
  margin: 0.2rem 0 0;
}

.card-meta {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.35rem;
}

.card-meta li {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #333;
}

.card-meta .label {
  font-weight: 600;
  color: #555;
  margin-right: 0.5rem;
}

.card-excerpt {
  font-size: 0.95rem;
  color: #222;
  line-height: 1.4;
}

.card-actions {
  margin-top: auto;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.primary-link,
.secondary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 0.9rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
}

.primary-link {
  background: #111;
  color: #fff;
}

.secondary-link {
  border: 1px solid #ccc;
  color: #111;
}

.empty-state {
  padding: 2rem;
  border: 1px dashed #ccc;
  border-radius: 10px;
  text-align: center;
  color: #555;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
