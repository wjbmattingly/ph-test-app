<template>
  <transition name="modal-fade">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal-window" role="dialog" aria-modal="true" :aria-label="'Transcript ' + rg">
        <header class="modal-head">
          <div class="modal-title">
            <strong>{{ title || rg }}</strong>
            <span class="modal-rg">{{ rg }}</span>
          </div>
          <div class="modal-actions">
            <NuxtLink class="full-page-link" :to="fullPageLink">Open full page ↗</NuxtLink>
            <button type="button" class="modal-close" title="Close (Esc)" @click="$emit('close')">×</button>
          </div>
        </header>

        <div ref="modalBody" class="modal-body">
          <div v-if="loading" class="modal-loading">
            <span class="spinner" aria-hidden="true"></span> Loading transcript…
          </div>
          <div v-else-if="loadError" class="modal-error">
            Could not load this transcript. <NuxtLink :to="fullPageLink">Open the full page instead.</NuxtLink>
          </div>
          <div v-else class="transcript-html" v-html="htmlContent"></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'TranscriptModal',
  props: {
    rg: { type: String, required: true },      // slug, e.g. rg-50.030.0001
    sentenceId: { type: String, default: '' }, // sentence to scroll to
    title: { type: String, default: '' }       // display name of interviewee
  },
  data() {
    return { htmlContent: '', loading: true, loadError: false };
  },
  computed: {
    fullPageLink() {
      const sent = this.sentenceId ? `?sent=${encodeURIComponent(this.sentenceId)}` : '';
      return `/transcripts/${encodeURIComponent(this.rg)}${sent}`;
    }
  },
  async mounted() {
    document.addEventListener('keydown', this.onKeydown);
    document.body.style.overflow = 'hidden';
    try {
      const basePath = process.env.NUXT_PUBLIC_BASE_PATH || '';
      const resp = await fetch(`${basePath}/transcript-html/${this.rg}.html`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      this.htmlContent = await resp.text();
      this.loading = false;
      this.$nextTick(() => this.scrollToSentence());
    } catch (e) {
      this.loading = false;
      this.loadError = true;
    }
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.onKeydown);
    document.body.style.overflow = '';
  },
  methods: {
    onKeydown(e) {
      if (e.key === 'Escape') this.$emit('close');
    },
    scrollToSentence() {
      if (!this.sentenceId) return;
      const body = this.$refs.modalBody;
      if (!body) return;
      const el = body.querySelector(`sentence[id="${this.sentenceId}"], [id="${this.sentenceId}"]`);
      if (el) {
        el.classList.add('modal-target-sentence');
        el.scrollIntoView({ block: 'center' });
      }
    }
  }
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 20, 0.55);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4vh 4vw;
}

.modal-window {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  width: min(860px, 100%);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid #e6e6e6;
  background: #fafafa;
}

.modal-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}
.modal-title strong {
  font-size: 1.05rem;
  text-transform: capitalize;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.modal-rg {
  font-size: 0.8rem;
  color: #888;
  white-space: nowrap;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}
.full-page-link {
  font-size: 0.85rem;
  color: #000;
}
.modal-close {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #666;
  padding: 2px 8px;
}
.modal-close:hover { color: #000; }

.modal-body {
  overflow-y: auto;
  padding: 18px 26px 30px;
}

.modal-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-style: italic;
  padding: 30px 0;
}
.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid #ccc;
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.modal-error { color: #7a2a2a; padding: 20px 0; }

/* Transcript rendering (mirrors the full page, but without place colors) */
.transcript-html {
  line-height: 1.7;
  font-size: 0.97rem;
  color: #222;
}
.transcript-html :deep(dialogue) {
  display: block;
  margin-bottom: 0.9rem;
}
/* Transcripts carry literal "Q:"/"A:" prefixes in the text itself */
.transcript-html :deep(dialogue.Question) { color: #666; }
.transcript-html :deep(p) { margin: 0; }
/* Source HTML has no whitespace between adjacent <sentence> elements */
.transcript-html :deep(sentence + sentence)::before { content: ' '; }
.transcript-html :deep(span) { background: transparent; }

.transcript-html :deep(.modal-target-sentence) {
  background: #fff3bf;
  box-shadow: 0 0 0 4px #fff3bf;
  border-radius: 3px;
}

/* Transition */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.15s; }
.modal-fade-enter, .modal-fade-leave-to { opacity: 0; }
</style>
