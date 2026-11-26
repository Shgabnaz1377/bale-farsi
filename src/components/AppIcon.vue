<script setup lang="ts">
const props = defineProps<{ name: string }>()

const PATHS: Record<string, string> = {
  flame: '<path fill="currentColor" d="M12.3 1.5c1.2 3.7 5.7 5.9 5.7 11.4a6 6 0 0 1-12 0c0-2.8 1.4-4.8 2.8-6.1.3 2.1 1.3 3.3 2.6 3.3-.6-3.8.3-6.4.9-8.6z"/>',
  star: '<polygon fill="currentColor" points="12,0 15.67,3.13 20.49,3.51 20.87,8.33 24,12 20.87,15.67 20.49,20.49 15.67,20.87 12,24 8.33,20.87 3.51,20.49 3.13,15.67 0,12 3.13,8.33 3.51,3.51 8.33,3.13"/>',
  heart: '<path fill="currentColor" d="M12 21s-7.4-4.5-9.4-9.2C1.2 8.4 3.3 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5c3.3 0 5.4 3.4 4 6.8C19.4 16.5 12 21 12 21z"/>',
  x: '<path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/>',
  check: '<path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/>',
  lock: '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></g>',
  speaker: '<path fill="currentColor" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  slow: '<path fill="currentColor" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M15.5 9a4 4 0 0 1 0 6"/>',
  path: '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></g>',
  letter: '<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M5 13c0 3 2.5 4.5 7 4.5s7-1.5 7-4.5M12 20.5v.01M9 6.5v3"/>',
  book: '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></g>',
  chart: '<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/>',
  gear: '<g fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3.2"/><path stroke-linecap="round" d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></g>',
  user: '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></g>',
  arrow: '<path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/>',
  review: '<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5"/>',
  trophy: '<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3.5 3.5 0 0 0 3.6 4M16 6h3.5a3.5 3.5 0 0 1-3.6 4M12 13v4M8.5 20h7"/>',
}
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- static icon markup from the table above -->
  <span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24" v-html="PATHS[props.name] ?? ''"></svg></span>
</template>
