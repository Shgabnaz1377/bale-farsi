<script setup lang="ts">
import { computed } from 'vue'
import { APP } from '@/app.ts'

/**
 * Course text may use <b>, <i> and <span class="fa">…</span> only (enforced by the content checker).
 * Everything is escaped first and only those exact tags are restored, so nothing else can render as HTML.
 */
const props = defineProps<{ html: string; tag?: 'p' | 'span' }>()
const safe = computed(() => {
  const esc = props.html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return esc
    .replace(/&lt;(\/?)(b|i)&gt;/g, '<$1$2>')
    .replace(/&lt;span class=&quot;fa&quot;&gt;/g, `<span class="fa keep" lang="${APP.target}" dir="${APP.targetDir}">`)
    .replace(/&lt;\/span&gt;/g, '</span>')
})
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- escaped above; only b, i and span.fa survive -->
  <span v-if="tag === 'span'" class="rich" v-html="safe"></span>
  <p v-else class="rich" v-html="safe"></p>
  <!-- eslint-enable vue/no-v-html -->
</template>
