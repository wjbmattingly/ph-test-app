<template>
  <div class="transcript-page" v-if="transcript">
    <!-- Header -->
    <header class="page-head">
      <NuxtLink class="back-link" to="/transcripts">← Back to library</NuxtLink>
      <h1 class="interviewee">{{ capitalizeWords(displayName(transcript.interviewee)) || 'Unknown interviewee' }}</h1>
      <p class="meta-line">
        {{ transcript.rg_number }}<template v-if="transcript.birth_year"> · b. {{ transcript.birth_year }}</template><template v-if="transcript.place_of_birth"> · {{ capitalizeWords(transcript.place_of_birth) }}</template><template v-if="transcript.country">, {{ capitalizeWords(transcript.country) }}</template><template v-if="transcript.experience_group"> · {{ transcript.experience_group }}</template><template v-if="transcript.gender"> · {{ transcript.gender }}</template>
      </p>
      <p class="external-links">
        <a v-if="transcript.ushmm_url" :href="transcript.ushmm_url" target="_blank" rel="noopener">USHMM record ↗</a>
        <a v-if="transcript.pdf_url" :href="transcript.pdf_url" target="_blank" rel="noopener">Original PDF ↗</a>
      </p>
    </header>

    <div class="transcript-layout">
      <!-- Sticky sidebar: place categories -->
      <aside class="side-panel">
        <div class="panel-card">
          <label class="master-toggle">
            <input v-model="highlightsOn" type="checkbox" />
            Show place highlights
          </label>
        </div>

        <div class="panel-card places-card">
          <h2 class="panel-title">Places in this testimony</h2>
          <details
            v-for="cat in categoryEntries"
            :key="cat.key"
            class="cat-group"
            :open="selectedTerm && selectedTerm.category === cat.key"
          >
            <summary class="cat-summary">
              <span class="cat-dot" :style="{ background: categoryColors[cat.key] }"></span>
              <span class="cat-label">{{ cat.label }}</span>
              <span class="cat-count">{{ cat.values.length }}</span>
            </summary>
            <div class="term-list">
              <button
                v-for="value in cat.values"
                :key="value"
                type="button"
                class="term-btn"
                :class="{ active: isActiveTerm(cat.key, value) }"
                @click="toggleTerm(cat.key, value)"
              >
                {{ value }}
              </button>
            </div>
          </details>
        </div>
      </aside>

      <!-- Transcript -->
      <div class="content-col">
        <!-- Focus toolbar -->
        <div v-if="selectedTerm" class="focus-toolbar">
          <div class="focus-info">
            <span class="focus-dot" :style="{ background: categoryColors[selectedTerm.category] }"></span>
            <strong>{{ selectedTerm.term }}</strong>
            <span class="focus-count">{{ hitCount }} {{ hitCount === 1 ? 'mention' : 'mentions' }}</span>
          </div>
          <div class="focus-controls">
            <div class="view-toggle">
              <button
                type="button"
                :class="{ active: viewMode === 'excerpts' }"
                title="Show only passages around each mention"
                @click="viewMode = 'excerpts'"
              >
                Excerpts
              </button>
              <button
                type="button"
                :class="{ active: viewMode === 'full' }"
                title="Show the whole transcript with mentions highlighted"
                @click="viewMode = 'full'"
              >
                Full text
              </button>
            </div>
            <div v-if="viewMode === 'full' && hitCount" class="hit-nav">
              <button type="button" title="Previous mention" @click="navHit(-1)">↑</button>
              <span class="hit-pos">{{ hitIndex + 1 }} / {{ hitCount }}</span>
              <button type="button" title="Next mention" @click="navHit(1)">↓</button>
            </div>
            <button type="button" class="focus-clear" title="Clear selection" @click="clearTerm">×</button>
          </div>
        </div>

        <div
          ref="transcriptBody"
          class="transcript-body"
          :class="{ 'highlights-off': !highlightsOn }"
          v-html="htmlContent"
          @click="onBodyClick"
        ></div>
      </div>
    </div>

    <!-- Place-term action popover -->
    <div
      v-if="termPopover"
      class="term-popover"
      :style="{ left: termPopover.x + 'px', top: termPopover.y + 'px' }"
    >
      <div class="term-popover-head">
        <span class="cat-dot" :style="{ background: categoryColors[termPopover.category] }"></span>
        <strong>{{ termPopover.term }}</strong>
        <span class="term-popover-cat">{{ categoryLabels[termPopover.category] }}</span>
      </div>
      <button type="button" @click="popoverFocus">Focus in this transcript</button>
      <NuxtLink :to="`/explore?q=${encodeURIComponent(termPopover.term)}`">
        Search all testimonies →
      </NuxtLink>
    </div>
    <div v-if="termPopover" class="term-popover-backdrop" @click="termPopover = null"></div>
  </div>

  <div v-else class="transcript-page">
    <NuxtLink class="back-link" to="/transcripts">← Back to library</NuxtLink>
    <p v-if="manifestError">Transcript data is unavailable right now. Please check your connection and try again.</p>
    <p v-else>We couldn’t find that transcript.</p>
  </div>
</template>

<script>
import { getTranscriptsManifest } from '@/utils/transcripts';

const CATEGORY_LABELS = {
  REGION: 'Regions',
  COUNTRY: 'Countries',
  POPULATED_PLACE: 'Populated places',
  ENV_FEATURES: 'Environmental features',
  DLF: 'Distinct landscape features',
  BUILDING: 'Buildings',
  INT_SPACE: 'Interior spaces',
  SPATIAL_OBJ: 'Spatial objects',
  NPIP: 'Imaginary places'
};

const CATEGORY_COLORS = {
  REGION: '#8fa3b5',
  COUNTRY: '#7f9370',
  POPULATED_PLACE: '#0aa3d6',
  ENV_FEATURES: '#0aa93a',
  DLF: '#d9a800',
  BUILDING: '#e56f00',
  INT_SPACE: '#8a63d6',
  SPATIAL_OBJ: '#c952cc',
  NPIP: '#d6003e'
};

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

// Words of context to keep on each side of a mention in excerpt view
const CONTEXT_WORDS = 100;

export default {
  name: 'TranscriptDetailPage',
  async asyncData({ params }) {
    try {
      const manifest = await getTranscriptsManifest();
      const items = manifest?.items || [];
      const slug = params.rg?.toLowerCase() || '';
      const transcript = items.find((item) => item.slug === slug);
      if (!transcript) {
        return { transcript: null, htmlContent: '', manifestError: false };
      }

      let htmlContent = '';
      if (process.server) {
        const fs = eval('require')('fs');
        const path = eval('require')('path');
        const htmlPath = path.join(process.cwd(), 'static', 'transcript-html', `${transcript.slug}.html`);
        if (fs.existsSync(htmlPath)) {
          htmlContent = fs.readFileSync(htmlPath, 'utf8');
        }
      } else {
        const basePath = process.env.NUXT_PUBLIC_BASE_PATH || '';
        const url = `${basePath}/transcript-html/${transcript.slug}.html`;
        try {
          const response = await fetch(url);
          if (response.ok) {
            htmlContent = await response.text();
          }
        } catch (e) {
          console.warn('Transcript HTML fetch failed for', transcript.slug, e);
        }
      }

      return { transcript, htmlContent, manifestError: false };
    } catch (e) {
      console.warn('Failed to load transcript data', e);
      return { transcript: null, htmlContent: '', manifestError: true };
    }
  },
  head() {
    const title = this.transcript
      ? `${this.transcript.interviewee || 'Transcript'} · RG ${this.transcript.rg_number}`
      : 'Transcript';
    return { title };
  },
  data() {
    return {
      transcript: this.transcript || null,
      htmlContent: this.htmlContent || '',
      manifestError: this.manifestError || false,
      highlightsOn: true,
      selectedTerm: null,      // { category, term }
      viewMode: 'excerpts',    // 'excerpts' | 'full'
      hitIndex: 0,
      hitCount: 0,
      termPopover: null,   // { term, category, x, y }
      categoryColors: CATEGORY_COLORS,
      categoryLabels: CATEGORY_LABELS
    };
  },
  computed: {
    categoryEntries() {
      if (!this.transcript || !this.transcript.category_summary) return [];
      const entries = Object.entries(this.transcript.category_summary).map(([key, values]) => ({
        key,
        label: CATEGORY_LABELS[key] || key,
        values
      }));
      entries.sort((a, b) => CATEGORY_ORDER.indexOf(a.key) - CATEGORY_ORDER.indexOf(b.key));
      return entries;
    }
  },
  watch: {
    '$route.query.sent'() { this.scrollToSentenceParam(); },
    '$route.hash'() { this.scrollToSentenceParam(); },
    viewMode() { this.applyTermView(); }
  },
  mounted() {
    this.loadClientData();
  },
  methods: {
    displayName(name) {
      return (name || '').replace(/\bNone\b/gi, '').replace(/\s+/g, ' ').trim();
    },
    capitalizeWords(text) {
      return (text || '')
        .toString()
        .split(' ')
        .map(w => (w ? w[0].toUpperCase() + w.slice(1) : ''))
        .join(' ')
        .trim();
    },

    async loadClientData() {
      try {
        const basePath = process.env.NUXT_PUBLIC_BASE_PATH || '';
        const origin = (typeof window !== 'undefined' && window.location) ? window.location.origin : '';
        const prefix = basePath || origin;
        const resp = await fetch(`${prefix}/data/transcripts.json`);
        if (resp.ok) {
          const data = await resp.json();
          const slug = this.$route.params.rg?.toLowerCase() || '';
          const transcript = (data?.items || []).find(item => item.slug === slug);
          if (transcript) this.transcript = transcript;
        }
        if (this.transcript && !this.htmlContent) {
          const htmlResp = await fetch(`${prefix}/transcript-html/${this.transcript.slug}.html`);
          if (htmlResp.ok) this.htmlContent = await htmlResp.text();
        }
      } catch (e) {
        console.warn('Client transcript fetch failed', e);
      } finally {
        this.$nextTick(() => {
          this.indexSentences();
          this.scrollToSentenceParam();
        });
      }
    },

    // ---- sentence index (for excerpt view word math) ----
    indexSentences() {
      const body = this.$refs.transcriptBody;
      if (!body) return;
      this._sentences = Array.from(body.querySelectorAll('sentence')).map(el => ({
        el,
        words: (el.textContent || '').trim().split(/\s+/).filter(Boolean).length
      }));
      this._hits = [];
    },

    // ---- term selection ----
    isActiveTerm(category, term) {
      return !!this.selectedTerm &&
        this.selectedTerm.category === category &&
        this.selectedTerm.term === term;
    },
    toggleTerm(category, term) {
      if (this.isActiveTerm(category, term)) {
        this.clearTerm();
        return;
      }
      this.selectedTerm = { category, term };
      this.applyTermView();
    },
    clearTerm() {
      this.selectedTerm = null;
      this.hitCount = 0;
      this.clearTermDom();
    },

    normalize(s) {
      return (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    },

    findHitSpans() {
      const body = this.$refs.transcriptBody;
      if (!body || !this.selectedTerm) return [];
      const { category, term } = this.selectedTerm;
      const want = this.normalize(term);
      return Array.from(body.querySelectorAll(`span.${category}`))
        .filter(span => this.normalize(span.textContent) === want);
    },

    clearTermDom() {
      const body = this.$refs.transcriptBody;
      if (!body) return;
      body.querySelectorAll('.term-hit, .term-hit-current').forEach(el => {
        el.classList.remove('term-hit', 'term-hit-current');
      });
      body.querySelectorAll('.ts-hide').forEach(el => el.classList.remove('ts-hide'));
      body.querySelectorAll('.ts-gap').forEach(el => el.remove());
    },

    applyTermView() {
      if (!this.selectedTerm) return;
      this.clearTermDom();
      if (!this._sentences || !this._sentences.length) this.indexSentences();

      const hits = this.findHitSpans();
      this._hits = hits;
      this.hitCount = hits.length;
      this.hitIndex = 0;
      hits.forEach(el => el.classList.add('term-hit'));
      if (!hits.length) return;

      if (this.viewMode === 'excerpts') {
        this.applyExcerptView(hits);
      } else {
        this.setCurrentHit(0, true);
      }
    },

    applyExcerptView(hits) {
      const sentences = this._sentences;
      const idxOf = new Map(sentences.map((s, i) => [s.el, i]));

      // Sentence index of each hit
      const hitIdxs = hits
        .map(h => idxOf.get(h.closest('sentence')))
        .filter(i => i != null);

      // Expand each hit to ±CONTEXT_WORDS words at sentence granularity
      const keep = new Set();
      for (const i of hitIdxs) {
        keep.add(i);
        let w = 0;
        for (let j = i - 1; j >= 0 && w < CONTEXT_WORDS; j--) {
          keep.add(j);
          w += sentences[j].words;
        }
        w = 0;
        for (let j = i + 1; j < sentences.length && w < CONTEXT_WORDS; j++) {
          keep.add(j);
          w += sentences[j].words;
        }
      }

      // Absorb tiny gaps: a "40 words omitted" separator is noisier than
      // simply showing those 40 words.
      let g = 0;
      while (g < sentences.length) {
        if (keep.has(g)) { g++; continue; }
        const start = g;
        let words = 0;
        while (g < sentences.length && !keep.has(g)) {
          words += sentences[g].words;
          g++;
        }
        if (words < 60 && start > 0 && g < sentences.length) {
          for (let j = start; j < g; j++) keep.add(j);
        }
      }

      // Hide everything else
      sentences.forEach((s, i) => {
        if (!keep.has(i)) s.el.classList.add('ts-hide');
      });

      // Hide dialogues whose sentences are all hidden (kills stray margins)
      const body = this.$refs.transcriptBody;
      body.querySelectorAll('dialogue').forEach(d => {
        const sents = d.querySelectorAll('sentence');
        if (sents.length && Array.from(sents).every(s => s.classList.contains('ts-hide'))) {
          d.classList.add('ts-hide');
        }
      });

      // Insert "N words omitted" separators before each visible run
      let i = 0;
      while (i < sentences.length) {
        if (keep.has(i)) { i++; continue; }
        let gapWords = 0;
        const gapStart = i;
        while (i < sentences.length && !keep.has(i)) {
          gapWords += sentences[i].words;
          i++;
        }
        const anchorSentence = i < sentences.length ? sentences[i].el : null;
        const gapEl = document.createElement('div');
        gapEl.className = 'ts-gap';
        gapEl.textContent = `· · ·  ${gapWords.toLocaleString()} words omitted  · · ·`;
        if (anchorSentence) {
          const dialogue = anchorSentence.closest('dialogue') || anchorSentence;
          dialogue.parentNode.insertBefore(gapEl, dialogue);
        } else if (gapStart > 0) {
          const lastVisible = sentences[gapStart - 1].el.closest('dialogue');
          if (lastVisible && lastVisible.parentNode) {
            lastVisible.parentNode.insertBefore(gapEl, lastVisible.nextSibling);
          }
        }
      }

      // Bring the first excerpt into view
      const first = hits[0];
      if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },

    // ---- full-view hit navigation ----
    navHit(delta) {
      if (!this._hits || !this._hits.length) return;
      const n = this._hits.length;
      this.setCurrentHit(((this.hitIndex + delta) % n + n) % n, true);
    },
    setCurrentHit(index, scroll) {
      if (!this._hits || !this._hits.length) return;
      this._hits.forEach(el => el.classList.remove('term-hit-current'));
      this.hitIndex = index;
      const el = this._hits[index];
      el.classList.add('term-hit-current');
      if (scroll) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },

    // ---- clicking a tagged span in the text ----
    onBodyClick(e) {
      const span = e.target.closest && e.target.closest('span[class]');
      if (!span || !CATEGORY_LABELS[span.className]) return;
      const term = (span.textContent || '').replace(/\s+/g, ' ').trim();
      if (!term) return;
      const rect = span.getBoundingClientRect();
      const width = 230;
      this.termPopover = {
        term,
        category: span.className,
        x: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8),
        y: rect.bottom + 6
      };
    },
    popoverFocus() {
      if (!this.termPopover) return;
      this.selectedTerm = { category: this.termPopover.category, term: this.termPopover.term };
      this.termPopover = null;
      this.applyTermView();
    },

    // ---- deep link (?sent=ID or #ID) ----
    scrollToSentenceParam() {
      if (!process.client) return;
      const id = this.$route.query.sent || this.$route.hash.replace('#', '');
      if (!id) return;
      const body = this.$refs.transcriptBody;
      if (!body) return;
      const el = body.querySelector(`sentence[id="${id}"], [id="${id}"]`);
      if (el) {
        el.classList.add('linked-sentence');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
};
</script>

<style scoped>
.transcript-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 3rem;
}

/* --- Header --- */
.page-head {
  border-bottom: 1px solid #e6e6e6;
  padding-bottom: 1rem;
  margin-bottom: 1.25rem;
}
.back-link {
  display: inline-block;
  text-decoration: none;
  color: #555;
  font-size: 0.88rem;
  margin-bottom: 0.5rem;
}
.back-link:hover { color: #000; }
.interviewee {
  margin: 0 0 0.25rem;
  font-size: 1.7rem;
  text-transform: capitalize;
}
.meta-line {
  margin: 0 0 0.4rem;
  color: #666;
  font-size: 0.92rem;
}
.external-links {
  margin: 0;
  display: flex;
  gap: 14px;
}
.external-links a {
  font-size: 0.84rem;
  color: #000;
}

/* --- Layout --- */
.transcript-layout {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 1.75rem;
  align-items: start;
}

/* --- Sidebar --- */
.side-panel {
  position: sticky;
  top: 14px;
  max-height: calc(100vh - 28px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-right: 2px;
}

.panel-card {
  border: 1px solid #e4e4e4;
  border-radius: 10px;
  background: #fcfcfc;
  padding: 10px 12px;
}

.master-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.panel-title {
  margin: 2px 0 8px;
  font-size: 0.95rem;
}

.cat-group {
  border-top: 1px solid #ececec;
}
.cat-group:first-of-type { border-top: none; }

.cat-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 2px;
  cursor: pointer;
  list-style: none;
  font-size: 0.88rem;
}
.cat-summary::-webkit-details-marker { display: none; }
.cat-summary::after {
  content: '▸';
  margin-left: auto;
  font-size: 0.75em;
  color: #999;
  transition: transform 0.15s;
}
.cat-group[open] > .cat-summary::after { transform: rotate(90deg); }

.cat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: none;
}
.cat-label { font-weight: 600; color: #333; }
.cat-count {
  font-size: 0.75rem;
  color: #888;
  background: #efefef;
  border-radius: 9px;
  padding: 0 7px;
}

.term-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 2px 0 10px;
  max-height: 180px;
  overflow-y: auto;
}
.term-btn {
  border: 1px solid #ddd;
  border-radius: 12px;
  background: #fff;
  color: #333;
  padding: 2px 10px;
  font-size: 0.78rem;
  cursor: pointer;
  text-align: left;
}
.term-btn:hover { border-color: #000; }
.term-btn.active {
  background: #000;
  border-color: #000;
  color: #fff;
}

/* --- Focus toolbar --- */
.focus-toolbar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  background: #fff;
  border: 1px solid #e2e2e2;
  border-radius: 10px;
  padding: 8px 14px;
  margin-bottom: 0.9rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.focus-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}
.focus-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.focus-count { color: #777; font-size: 0.85rem; }

.focus-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.view-toggle {
  display: inline-flex;
  border: 1px solid #ccc;
  border-radius: 7px;
  overflow: hidden;
}
.view-toggle button {
  border: none;
  background: #fff;
  color: #444;
  padding: 4px 12px;
  font-size: 0.82rem;
  cursor: pointer;
}
.view-toggle button + button { border-left: 1px solid #e2e2e2; }
.view-toggle button.active { background: #000; color: #fff; }

.hit-nav {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.hit-nav button {
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  color: #333;
  width: 26px;
  height: 26px;
  cursor: pointer;
  font-size: 0.85rem;
  line-height: 1;
}
.hit-nav button:hover { border-color: #000; }
.hit-pos { font-size: 0.8rem; color: #666; min-width: 46px; text-align: center; }

.focus-clear {
  border: none;
  background: transparent;
  color: #777;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px;
}
.focus-clear:hover { color: #000; }

/* --- Transcript body --- */
.transcript-body {
  max-width: 74ch;
  font-size: 1rem;
  line-height: 1.75;
  color: #1c1c1c;
}

.transcript-body :deep(dialogue) {
  display: block;
  margin-bottom: 0.95rem;
}
.transcript-body :deep(dialogue.Question) { color: #61605c; }
.transcript-body :deep(p) { margin: 0; }
/* Source HTML has no whitespace between adjacent <sentence> elements */
.transcript-body :deep(sentence + sentence)::before { content: ' '; }

/* Place tags: quiet colored underlines instead of solid blocks */
.transcript-body :deep(span[class]) {
  border-bottom: 2px solid transparent;
  padding-bottom: 1px;
  transition: background-color 0.12s;
  cursor: pointer;
}
.transcript-body :deep(span.REGION)          { border-bottom-color: #8fa3b5; }
.transcript-body :deep(span.COUNTRY)         { border-bottom-color: #7f9370; }
.transcript-body :deep(span.POPULATED_PLACE) { border-bottom-color: #0aa3d6; }
.transcript-body :deep(span.ENV_FEATURES)    { border-bottom-color: #0aa93a; }
.transcript-body :deep(span.DLF)             { border-bottom-color: #d9a800; }
.transcript-body :deep(span.BUILDING)        { border-bottom-color: #e56f00; }
.transcript-body :deep(span.INT_SPACE)       { border-bottom-color: #8a63d6; }
.transcript-body :deep(span.SPATIAL_OBJ)     { border-bottom-color: #c952cc; }
.transcript-body :deep(span.NPIP)            { border-bottom-color: #d6003e; }

.transcript-body :deep(span.REGION:hover)          { background: #8fa3b52e; }
.transcript-body :deep(span.COUNTRY:hover)         { background: #7f93702e; }
.transcript-body :deep(span.POPULATED_PLACE:hover) { background: #0aa3d62e; }
.transcript-body :deep(span.ENV_FEATURES:hover)    { background: #0aa93a2e; }
.transcript-body :deep(span.DLF:hover)             { background: #d9a8002e; }
.transcript-body :deep(span.BUILDING:hover)        { background: #e56f002e; }
.transcript-body :deep(span.INT_SPACE:hover)       { background: #8a63d62e; }
.transcript-body :deep(span.SPATIAL_OBJ:hover)     { background: #c952cc2e; }
.transcript-body :deep(span.NPIP:hover)            { background: #d6003e2e; }

/* Master toggle off: no decorations at all */
.transcript-body.highlights-off :deep(span[class]) {
  border-bottom-color: transparent !important;
  background: transparent !important;
}

/* Selected-term hits (always visible, even with highlights off) */
.transcript-body :deep(.term-hit) {
  background: #ffe9a8 !important;
  border-bottom-color: #c79600 !important;
  border-radius: 3px;
  padding: 0 2px;
}
.transcript-body :deep(.term-hit-current) {
  outline: 2px solid #000;
  outline-offset: 1px;
}

/* Excerpt view */
.transcript-body :deep(.ts-hide) { display: none; }
.transcript-body :deep(.ts-gap) {
  text-align: center;
  color: #9a9a9a;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  border-top: 1px dashed #ddd;
  border-bottom: 1px dashed #ddd;
  padding: 7px 0;
  margin: 1.1rem 0;
  user-select: none;
}

/* Place-term popover */
.term-popover {
  position: fixed;
  z-index: 60;
  width: 230px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 9px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.term-popover-backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
}
.term-popover-head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.9rem;
}
.term-popover-cat {
  font-size: 0.7rem;
  color: #888;
  margin-left: auto;
}
.term-popover button,
.term-popover a {
  display: block;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  padding: 6px 9px;
  border: 1px solid #ddd;
  border-radius: 7px;
  background: #fff;
  color: #111;
  font-size: 0.82rem;
  cursor: pointer;
  text-decoration: none;
}
.term-popover button:hover,
.term-popover a:hover {
  border-color: #000;
  background: #f7f7f7;
}

/* Deep-linked sentence from search */
.transcript-body :deep(.linked-sentence) {
  background: #fff3bf;
  box-shadow: 0 0 0 4px #fff3bf;
  border-radius: 3px;
}

@media (max-width: 900px) {
  .transcript-layout { grid-template-columns: 1fr; }
  .side-panel { position: static; max-height: none; }
}
</style>
