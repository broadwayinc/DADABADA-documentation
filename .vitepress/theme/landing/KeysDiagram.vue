<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useVisible } from './visible'
import { EXAMPLES, current } from './keysExamples'

// How a record is stored and found, in the examples of keysExamples.ts, played one after another: the key
// list appears, the saved record's key is inserted at its place, the query reads one range of the list, and
// the whole list goes away before the next example. The code block beside it shows the same example.
const root = ref<SVGElement | null>(null)
const playing = useVisible(root)
const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// 0 hidden, 1 list shown, 2 new key in, 3 reading, 4 leaving
const step = ref(reduced ? 3 : 0)
const cursor = ref(reduced ? EXAMPLES[0].range[1] : -1)
const e = computed(() => EXAMPLES[current.value])

const ROW = 28
const TOP = 82
const rows = computed(() => {
  let n = 0
  return e.value.rows.map((r, i) => {
    const shown = !r.fresh || step.value >= 2
    const y = TOP + n * ROW
    if (shown) n++
    return { ...r, i, y, on: shown && step.value >= 1 && step.value < 4 }
  })
})
const yOf = (i: number) => rows.value[i].y
const bracket = computed(() => `M18 ${yOf(e.value.range[0]) - 13} H11 V${yOf(e.value.range[1]) + 13} H18`)
const cursorY = computed(() => yOf(Math.max(cursor.value, e.value.range[0])))
const hit = (i: number) => step.value === 3 && i >= e.value.range[0] && i <= cursor.value
// one outline around the keys read so far (one border per row would double where two rows meet)
const readBox = computed(() => {
  const top = yOf(e.value.range[0]) - 13
  return { y: top, h: cursorY.value + 13 - top }
})
const value = (x: string | number) => (typeof x === 'string' ? `"${x}"` : String(x))

let timers: ReturnType<typeof setTimeout>[] = []
const at = (ms: number, f: () => void) => timers.push(setTimeout(f, ms))
function stop() {
  timers.forEach(clearTimeout)
  timers = []
}
function play() {
  stop()
  const [a, b] = EXAMPLES[current.value].range
  step.value = 0
  cursor.value = -1
  // quick moves and short holds: the list is in at once, the new key soon after, the read is fast, and the
  // result stays just long enough to read before the next example
  at(80, () => (step.value = 1))
  at(1000, () => (step.value = 2))
  at(1650, () => (step.value = 3))
  const STEP = 180
  for (let i = a; i <= b; i++) at(1800 + (i - a) * STEP, () => (cursor.value = i))
  const done = 1800 + (b - a) * STEP + 1700
  at(done, () => (step.value = 4))
  at(done + 300, () => {
    current.value = (current.value + 1) % EXAMPLES.length
    play()
  })
}
if (!reduced) {
  watch(playing, (p) => (p ? play() : stop()))
}
onBeforeUnmount(stop)
</script>

<template>
  <svg ref="root" class="keys-dia" viewBox="0 0 500 300" role="img" aria-labelledby="keys-dia-title keys-dia-desc">
    <title id="keys-dia-title">How a record is stored and found</title>
    <desc id="keys-dia-desc">Saving a record inserts its key at its place in a sorted list, and a query reads one
      contiguous range of that list. {{ EXAMPLES.length }} examples: {{ EXAMPLES.map((x) => x.desc).join(' ') }}</desc>

    <text class="phase" :class="{ on: step >= 1 && step <= 2 }" x="24" y="20"><tspan class="strong">postRecord</tspan>  {{ e.coll }} · {{ e.lvl }} · {{ e.tag }} · {{ e.ix }} {{ value(e.value) }}</text>
    <text class="phase" :class="{ on: step === 3 }" x="24" y="20"><tspan class="strong">getRecords</tspan>  {{ e.read }}</text>

    <g class="head">
      <text x="30" y="54">COLLECTION</text>
      <text x="108" y="54">ACCESS</text>
      <text x="158" y="54">TAG</text>
      <text x="226" y="54">INDEX</text>
      <text x="300" y="54">VALUE</text>
      <text x="400" y="54">RECORD</text>
    </g>
    <line class="hair" x1="24" y1="62" x2="480" y2="62" />

    <g v-for="r in rows" :key="`${current}-${r.i}`" class="row" :class="{ fresh: r.fresh, on: r.on, hit: hit(r.i) }"
      :style="{ transform: `translateY(${r.y}px)`, transitionDelay: step === 1 && !r.fresh ? `${r.i * 35}ms` : '0ms' }">
      <rect class="row-bg" x="24" y="-13" width="456" height="26" />
      <text x="30" y="4">{{ e.coll }}</text>
      <text x="108" y="4">{{ r.lvl }}</text>
      <text x="158" y="4">{{ r.tag }}</text>
      <text x="226" y="4">{{ e.ix }}</text>
      <text x="300" y="4">{{ r.val }}</text>
      <text class="id" x="400" y="4">{{ r.id }}…</text>
    </g>

    <rect class="read-box" :class="{ on: step === 3 && cursor >= 0 }" x="24" :y="readBox.y" width="456" :height="readBox.h" />

    <g class="range" :class="{ on: step === 3 }">
      <path :d="bracket" />
      <!-- the cursor steps from key to key, in step with each key being read -->
      <path class="cursor" d="M2 -6 L8 0 L2 6 Z" :style="{ transform: `translateY(${cursorY}px)` }" />
    </g>
  </svg>
</template>

<style scoped>
.keys-dia { width: 100%; height: auto; display: block; overflow: visible; font-family: var(--vp-font-family-mono); font-variant-ligatures: none; font-feature-settings: "calt" 0, "liga" 0; }
text { fill: var(--dd-ink); font-size: 12px; white-space: pre; }
.strong { font-weight: 700; }
.head text { fill: var(--dd-muted); font-size: 10px; letter-spacing: 0.1em; font-weight: 600; }
.hair { stroke: var(--dd-line); }
.row-bg { fill: var(--dd-soft); }
.id { fill: var(--dd-muted); }
.fresh .row-bg { fill: var(--dd-ink); }
.fresh text { fill: var(--dd-paper); }
.hit text { font-weight: 700; }
.range path { fill: none; stroke: var(--dd-ink); stroke-width: 2; }
.range .cursor { fill: var(--dd-ink); stroke: none; }
.read-box { fill: none; stroke: var(--dd-ink); stroke-width: 2; opacity: 0; transition: opacity 0.15s ease-out; }
.read-box.on { opacity: 1; }

/* rows move to their place (making room for the new key) and fade in and out */
.row { opacity: 0; transition: transform 0.28s cubic-bezier(0.22, 0.9, 0.3, 1), opacity 0.22s ease-out; }
.row.on { opacity: 1; }
.phase, .range { opacity: 0; transition: opacity 0.2s ease-out; }
.phase.on, .range.on { opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .row, .phase, .range { transition: none; }
}
</style>
