<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// One terminal command with a copy button. The `$` is shown but not copied.
const props = defineProps<{ cmd: string; comment?: string }>()
const copied = ref(false)
// The command never wraps: a long one scrolls sideways inside its box, and the copy button stays put beside
// it, behind a divider. While part of the command is out of view, its right edge fades, so the cut reads as
// "scroll for more", not as the button covering the text.

// Colors as in the docs' code theme (github-dark): the command (first word and the word after a pipe),
// flags, URLs and paths, and the pipe. Only how it looks: the copy button copies the text as it is.
const tokens = computed(() => {
  const out: { s: string; c: string }[] = []
  let cmdNext = true
  for (const s of props.cmd.split(/(\s+)/)) {
    if (!s) continue
    let c = ''
    if (/^\s+$/.test(s)) c = ''
    else if (s === '|') { c = 'op'; cmdNext = true; out.push({ s, c }); continue }
    else if (cmdNext) { c = 'fn'; cmdNext = false }
    else if (s.startsWith('-')) c = 'flag'
    else if (s.includes('://') || /^[~/.]/.test(s)) c = 'str'
    out.push({ s, c })
  }
  return out
})

const box = ref<HTMLElement | null>(null)
const more = ref(false)
const measure = () => {
  const el = box.value
  more.value = !!el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}
let ro: ResizeObserver | null = null
onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  if (box.value) ro.observe(box.value)
})
onBeforeUnmount(() => ro?.disconnect())

function copy() {
  navigator.clipboard.writeText(props.cmd).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  })
}
</script>

<template>
  <div class="cmd">
    <div class="cmd-view" :class="{ more }">
      <div ref="box" class="cmd-text" @scroll.passive="measure">
        <span v-if="comment" class="cmd-comment"># {{ comment }}</span>
        <code><span class="cmd-prompt" aria-hidden="true">$ </span><span v-for="(t, i) in tokens" :key="i" :class="t.c">{{ t.s }}</span></code>
      </div>
    </div>
    <button type="button" class="cmd-copy" :class="{ done: copied }" :aria-label="copied ? 'Copied' : 'Copy command'"
      :title="copied ? 'Copied' : 'Copy command'" @click="copy">
      <svg v-if="!copied" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="1" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </button>
  </div>
</template>

<style scoped>
.cmd {
  display: flex;
  align-items: stretch;
  background: #141414;
  color: #e1e4e8;
  border: 1px solid #2a2a2a;
  box-shadow: 3px 3px var(--dd-shadow);
  min-width: 0;
}
.dark .cmd { background: #000; }
.cmd-view { position: relative; flex: 1; min-width: 0; display: flex; }
/* part of the command is out of view: its right edge fades out */
.cmd-view.more::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 32px;
  background: linear-gradient(to right, transparent, #141414);
  pointer-events: none;
}
.dark .cmd-view.more::after { background: linear-gradient(to right, transparent, #000); }
/* the text area carries the box's padding and reaches its bottom edge, so a scrollbar runs along the
   bottom of the box, not inside its padding */
.cmd-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 12px 14px 12px 14px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #555 transparent;
}
.cmd-comment { font-size: 12px; color: #8f8f8f; }
.cmd code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.55;
  white-space: pre;
  background: none;
  padding: 0;
  color: inherit;
}
.cmd-prompt { color: #6a737d; user-select: none; }
/* github-dark, the docs' code theme */
.cmd .fn { color: #b392f0; }
.cmd .flag { color: #79b8ff; }
.cmd .str { color: #9ecbff; }
.cmd .op { color: #f97583; }
/* the copy button sits behind a divider, never over the text */
.cmd-copy {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  border: 0;
  border-left: 1px solid #2a2a2a;
  background: transparent;
  color: #b4b4b4;
  cursor: pointer;
}
.cmd-copy svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.cmd-copy.done { color: #85e89d; }
.cmd-copy:focus-visible { outline: 2px solid #eeeeee; outline-offset: -4px; }
@media (hover: hover) and (pointer: fine) { .cmd-copy:hover { color: #ffffff; background: #1f1f1f; } }
</style>
