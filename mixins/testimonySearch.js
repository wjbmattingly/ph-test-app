// mixins/testimonySearch.js
//
// Shared testimony-search logic used by /search and /explore: local
// embedding via /api/embed, GraphQL construction, the Weaviate proxy call,
// and small presentation helpers. Components using this mixin must have
// `searchStage` in data() if they want stage messages.

const escQuotes = (s) => (s || '').toString().replace(/"/g, '\\"');

// Place-label properties (region, building, etc.) are ints holding the
// number of tagged terms in the window (confirmed against the live schema);
// filter with GreaterThan 0.
export const PLACE_LABEL_MAP = {
  Regions: 'region',
  Countries: 'country',
  'Populated Places': 'populated_place',
  'Environmental Features': 'env_features',
  'Distinct Landscape Features': 'dlf',
  Buildings: 'building',
  'Interior Spaces': 'int_space',
  'Spatial Objects': 'spatial_obj',
  'Imaginary Places': 'npip'
};

export default {
  methods: {
    // --- Query pipeline ---

    async generateEmbedding(text) {
      const t = (text || '').trim();
      if (!t) return null;
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(`Embedding service error: ${data.error || response.status}${data.detail ? ' - ' + data.detail : ''}`);
      }
      const vec = data.vector;
      if (!Array.isArray(vec) || !vec.length || !Number.isFinite(vec[0])) {
        throw new Error('Embedding service returned an unexpected payload.');
      }
      return vec;
    },

    async postWeaviate(query) {
      const resp = await fetch('/api/weaviate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(json.error ? `${json.error}${json.detail ? ' - ' + json.detail : ''}` : `HTTP ${resp.status} from proxy`);
      }
      return json;
    },

    // formData: { queryType, queryText, numResults, and optional filter
    // fields understood by buildTestimonyWhereClause }
    async runTestimonySearch(formData) {
      const queryText = (formData.queryText || '').trim();
      const wantsVector = (formData.queryType === 'Vector' || formData.queryType === 'Hybrid');
      let queryVector = null;
      if (wantsVector && queryText) {
        this.searchStage = 'Embedding query locally (first search downloads the model)...';
        queryVector = await this.generateEmbedding(queryText);
      }

      this.searchStage = 'Querying testimony database...';
      const gqlQuery = this.buildTestimonyQuery(formData, queryVector);
      const json = await this.postWeaviate(gqlQuery);

      if (json.errors && json.errors.length) {
        throw new Error('Weaviate: ' + json.errors.map(e => e.message).join('; '));
      }

      const testimonies = json.data?.Get?.HolocaustTestimonies || [];
      return testimonies.map(t => {
        if (t._additional?.distance != null) {
          t.score = Number((1 - t._additional.distance).toFixed(3));
        } else if (t._additional?.score != null) {
          t.score = Number(Number(t._additional.score).toFixed(3));
        } else {
          t.score = null;
        }
        return t;
      });
    },

    buildTestimonyQuery(formData, queryVector) {
      const whereClause = this.buildTestimonyWhereClause(formData);
      const limit = Number(formData.numResults) || 100;
      const args = [`limit: ${limit}`];
      if (whereClause) args.push(whereClause);

      const queryText = (formData.queryText || '').trim();
      const escaped = escQuotes(queryText);
      const vectorReady = Array.isArray(queryVector) && queryVector.length;

      if (formData.queryType === 'Keyword' && escaped) {
        args.push(`bm25: { query: "${escaped}" }`);
      } else if (formData.queryType === 'Hybrid' && escaped && vectorReady) {
        args.push(`hybrid: { query: "${escaped}", vector: [${queryVector.join(',')}], alpha: 0.5 }`);
      } else if (vectorReady) {
        args.push(`nearVector: { vector: [${queryVector.join(',')}] }`);
      }

      return `{
        Get {
          HolocaustTestimonies(
            ${args.join(',\n            ')}
          ) {
            rg
            full_name
            birth_year
            birth_country
            gender
            experience_group
            sentence_ids
            text
            _additional { id distance score }
          }
        }
      }`;
    },

    buildTestimonyWhereClause(filters) {
      const ops = [];
      const trimOrEmpty = (s) => (s ?? '').toString().trim();
      const isNonEmpty = (s) => trimOrEmpty(s).length > 0;

      const useTestimony = !!filters.testimonyFilters;
      const usePlaces = !!filters.placesHeader;

      if (useTestimony) {
        if (Array.isArray(filters.category) && filters.category.length) {
          const catOps = filters.category
            .map(c => trimOrEmpty(c))
            .filter(Boolean)
            .map(c => `{ operator: Equal, path: ["category"], valueText: "${escQuotes(c)}" }`);
          if (catOps.length === 1) ops.push(catOps[0]);
          else if (catOps.length) ops.push(`{ operator: Or, operands: [${catOps.join(',')}] }`);
        }

        if (isNonEmpty(filters.gender)) {
          ops.push(`{ operator: Equal, path: ["gender"], valueText: "${escQuotes(filters.gender)}" }`);
        }

        if (isNonEmpty(filters.country)) {
          ops.push(`{ operator: Equal, path: ["birth_country"], valueText: "${escQuotes(filters.country)}" }`);
        }

        if (isNonEmpty(filters.experienceGroup)) {
          ops.push(`{ operator: Equal, path: ["experience_group"], valueText: "${escQuotes(filters.experienceGroup)}" }`);
        }

        if (isNonEmpty(filters.birthYear)) {
          const by = Number(filters.birthYear);
          if (Number.isFinite(by)) {
            ops.push(`{ operator: Equal, path: ["birth_year"], valueInt: ${by} }`);
          }
        }

        if (isNonEmpty(filters.rgNumber)) {
          ops.push(`{ operator: Equal, path: ["rg"], valueText: "${escQuotes(filters.rgNumber)}" }`);
        }

        if (isNonEmpty(filters.fullName)) {
          const name = escQuotes(filters.fullName);
          ops.push(`{ operator: Like, path: ["full_name"], valueText: "*${name}*" }`);
        }
      }

      if (usePlaces && Array.isArray(filters.labels) && filters.labels.length) {
        const orOps = filters.labels
          .map(lbl => PLACE_LABEL_MAP[lbl])
          .filter(Boolean)
          .map(prop => `{ operator: GreaterThan, path: ["${prop}"], valueInt: 0 }`);

        if (orOps.length === 1) ops.push(orOps[0]);
        else if (orOps.length) ops.push(`{ operator: Or, operands: [${orOps.join(',')}] }`);
      }

      return ops.length ? `where: { operator: And, operands: [${ops.join(',')}] }` : '';
    },

    // --- Presentation helpers ---

    displayName(row) {
      const name = (row?.full_name || '').replace(/\bNone\b/gi, '').replace(/\s+/g, ' ').trim();
      return name || (row?.full_name || '');
    },

    makeTranscriptLink(row) {
      const rg = encodeURIComponent(row?.rg || '');
      const sid = encodeURIComponent((row?.sentence_ids && row.sentence_ids[0]) || '');
      return `/transcripts/${rg}?sent=${sid}`;
    },

    scoreWidth(score) {
      const s = Math.max(0, Math.min(1, Number(score) || 0));
      return `${Math.round(s * 100)}%`;
    },

    escapeHtml(s) {
      return (s || '').toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    // Highlight literal query-term matches in the excerpt. Semantic matches
    // won't necessarily contain the terms, so this is a hint, not a guarantee.
    highlightExcerpt(text, queryText) {
      const safe = this.escapeHtml(text);
      const stop = new Set(['the', 'and', 'was', 'were', 'with', 'for', 'that',
        'this', 'from', 'into', 'they', 'them', 'their', 'his', 'her', 'had',
        'have', 'has', 'are', 'not', 'you', 'all', 'one', 'our', 'out', 'who',
        'when', 'what', 'where', 'how', 'why', 'did', 'does', 'about']);
      const terms = (queryText || '')
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length > 2 && !stop.has(t.toLowerCase()));
      if (!terms.length) return safe;
      const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const re = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
      return safe.replace(re, '<mark>$1</mark>');
    },

    exportSearchResults(results, querySummary, format) {
      if (!results.length) return;
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const meta = { query: querySummary, exported_at: new Date().toISOString(), result_count: results.length };
      const rows = results.map(r => ({
        rg: r.rg,
        full_name: r.full_name,
        birth_year: r.birth_year,
        birth_country: r.birth_country,
        gender: r.gender,
        experience_group: r.experience_group,
        score: r.score,
        sentence_ids: Array.isArray(r.sentence_ids) ? r.sentence_ids.join('|') : r.sentence_ids,
        text: r.text
      }));

      let blob, filename;
      if (format === 'json') {
        blob = new Blob([JSON.stringify({ ...meta, results: rows }, null, 2)], { type: 'application/json' });
        filename = `placing-holocaust-search-${stamp}.json`;
      } else {
        const headers = Object.keys(rows[0]);
        const csvEscape = (v) => {
          const s = (v ?? '').toString();
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines = [
          `# Query: ${querySummary}`,
          `# Exported: ${meta.exported_at}`,
          headers.join(','),
          ...rows.map(r => headers.map(h => csvEscape(r[h])).join(','))
        ];
        blob = new Blob([lines.join('\n')], { type: 'text/csv' });
        filename = `placing-holocaust-search-${stamp}.csv`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
};
