<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useVisible } from './visible'

// WBAC in one picture: alice saves a record at level 05; it lands in the level-05 key range.
// An agent key capped at 05 queries levels 00 to 05 and reads it; carol (level 00) queries level 00 only.
const root = ref<SVGElement | null>(null)
const playing = useVisible(root)

const rows = [
  { lvl: '99', y: 72, n: 9 },
  { lvl: '10', y: 132, n: 6 },
  { lvl: '05', y: 196, n: 4 },
  { lvl: '04', y: 226, n: 7 },
  { lvl: '03', y: 256, n: 5 },
  { lvl: '02', y: 286, n: 8 },
  { lvl: '01', y: 316, n: 3 },
  { lvl: '00', y: 346, n: 6 },
]
const gaps = [102, 164]

// Phones get a taller drawing: the writer above the store instead of beside it, so the text stays readable.
const narrow = ref(false)
let mq: MediaQueryList | null = null
const onMq = () => (narrow.value = !!mq?.matches)
onMounted(() => {
  mq = window.matchMedia('(max-width: 639px)')
  onMq()
  mq.addEventListener('change', onMq)
})
onBeforeUnmount(() => mq?.removeEventListener('change', onMq))
const box = computed(() => (narrow.value ? '0 0 350 524' : '0 0 540 400'))
const writerAt = computed(() => (narrow.value ? 'translate(-4 -132)' : ''))
const storeAt = computed(() => (narrow.value ? 'translate(-184 132)' : ''))
const chipW = computed(() => (narrow.value ? 124 : 132))
// where alice's record starts, relative to where it lands in row 05
const tokenFrom = computed(() => (narrow.value ? { '--tx': '-20px', '--ty': '-187px' } : { '--tx': '-122px', '--ty': '23px' }))
const trail = computed(() => (narrow.value ? { x1: 265, y1: 4, x2: 285, y2: 191 } : { x1: 158, y1: 219, x2: 280, y2: 196 }))
</script>

<template>
  <svg ref="root" class="hero-dia" :class="{ playing }" :viewBox="box" role="img"
    aria-labelledby="hero-dia-title hero-dia-desc">
    <title id="hero-dia-title">Writer-based access control</title>
    <desc id="hero-dia-desc">alice saves a record at access level 05. DDBD keeps one sorted key range per access level.
      An agent key capped at access level 05 queries access levels 00 to 05 and reads the record. carol, at access level 00,
      queries access level 00 only and never reaches it.</desc>

    <!-- writer -->
    <g :transform="writerAt">
    <text class="lbl" x="4" y="140">WRITER</text>
    <rect class="card" x="4" y="150" width="150" height="110" />
    <text class="strong" x="16" y="174">alice</text>
    <text class="muted" x="142" y="174" text-anchor="end">access 10</text>
    <line class="hair" x1="16" y1="186" x2="142" y2="186" />
    <text class="mono" x="16" y="206">products</text>
    <text class="mono" x="16" y="228">access <tspan class="strong">05</tspan></text>
    <text class="mono" x="16" y="250">tag   sale</text>
    </g>

    <g :transform="storeAt">

    <!-- the store: one key range per level -->
    <text class="strong" x="184" y="26">DDBD</text>
    <text class="muted" x="380" y="26" text-anchor="end">sorted by access</text>
    <rect class="store" x="184" y="40" width="196" height="330" />
    <g v-for="r in rows" :key="r.lvl">
      <rect class="band" x="192" :y="r.y - 11" width="180" height="22" />
      <text class="lvl" x="202" :y="r.y + 4">{{ r.lvl }}</text>
      <rect v-for="i in r.n" :key="i" class="blk" :x="228 + (i - 1) * 13" :y="r.y - 5" width="10" height="10" />
    </g>
    <text v-for="g in gaps" :key="g" class="muted dots" x="282" :y="g + 4" text-anchor="middle">· · ·</text>

    <!-- what each reader's query covers -->
    <rect class="hl hl-agent" x="192" y="185" width="180" height="172" />
    <rect class="hl hl-carol" x="192" y="335" width="180" height="22" />

    <!-- alice's record travels into level 05 -->
    <line class="trail" v-bind="trail" />
    <rect class="ring" x="280" y="191" width="10" height="10" />
    <rect class="token" x="280" y="191" width="10" height="10" :style="tokenFrom" />

    <!-- readers -->
    <text class="lbl" x="404" y="236">READERS</text>

    <g class="bracket br-agent">
      <path d="M384 185 H390 V357 H384" />
    </g>
    <line class="hair conn-agent" x1="390" y1="271" x2="404" y2="271" />
    <rect class="chip" x="404" y="253" :width="chipW" height="36" />
    <rect class="chip-on on-agent" x="404" y="253" :width="chipW" height="36" />
    <text class="strong" x="414" y="268">agent key</text>
    <text class="muted" x="414" y="282">max access 05</text>
    <g class="res res-agent">
      <path class="ok" d="M406 302 l4 4 l8 -9" />
      <text class="strong" x="424" y="307">reads it</text>
    </g>

    <g class="bracket br-carol">
      <path d="M384 335 H390 V357 H384" />
    </g>
    <line class="hair conn-carol" x1="390" y1="346" x2="404" y2="346" />
    <rect class="chip" x="404" y="328" :width="chipW" height="36" />
    <rect class="chip-on on-carol" x="404" y="328" :width="chipW" height="36" />
    <text class="strong" x="414" y="343">carol</text>
    <text class="muted" x="414" y="357">access 00</text>
    <g class="res res-carol">
      <path class="no" d="M407 375 l8 8 M415 375 l-8 8" />
      <text class="strong" x="424" y="384">never reads it</text>
    </g>
    </g>
  </svg>
</template>

<style scoped>
.hero-dia { width: 100%; height: auto; display: block; overflow: visible; font-family: var(--vp-font-family-mono); font-variant-ligatures: none; font-feature-settings: "calt" 0, "liga" 0; }
text { fill: var(--dd-ink); font-size: 13px; }
.lbl { fill: var(--dd-muted); font-size: 11px; letter-spacing: 0.12em; font-weight: 600; }
.strong { font-weight: 700; }
.muted { fill: var(--dd-muted); font-size: 11.5px; }
.mono { font-size: 13px; }
.lvl { fill: var(--dd-muted); font-size: 12px; font-weight: 600; }
.dots { font-size: 14px; }
.card, .store, .chip { fill: var(--dd-paper); stroke: var(--dd-ink); stroke-width: 1.5; }
.store { filter: drop-shadow(3px 3px 0 var(--dd-shadow)); }
.card, .chip { filter: drop-shadow(2px 2px 0 var(--dd-shadow)); }
.hair { stroke: var(--dd-line); stroke-width: 1; }
.band { fill: var(--dd-soft); }
.blk { fill: var(--lp-block); }
.token { fill: var(--dd-ink); }
.ring { fill: none; stroke: var(--dd-ink); stroke-width: 1.5; transform-box: fill-box; transform-origin: center; }
.trail { stroke: var(--dd-ink); stroke-width: 1; stroke-dasharray: 3 4; }
.hl { fill: var(--dd-ink); }
.bracket path { fill: none; stroke: var(--dd-ink); stroke-width: 2; }
.bracket { transform-box: fill-box; transform-origin: 50% 100%; }
.chip-on { fill: none; stroke: var(--dd-ink); stroke-width: 3; }
.ok, .no { fill: none; stroke: var(--dd-ink); stroke-width: 2.2; stroke-linecap: square; }

/* one 7.5 s timeline, paused while off screen: quick moves that settle, short holds */
.token, .ring, .trail, .hl, .bracket, .chip-on, .res, .conn-agent, .conn-carol {
  animation-duration: 7.5s;
  animation-iteration-count: infinite;
  animation-timing-function: cubic-bezier(0.22, 0.9, 0.3, 1);
  animation-play-state: paused;
}
.playing :is(.token, .ring, .trail, .hl, .bracket, .chip-on, .res, .conn-agent, .conn-carol) { animation-play-state: running; }

/* alice's record lands in the level-05 range */
.token { animation-name: token; }
@keyframes token {
  0%, 2% { transform: translate(var(--tx), var(--ty)); opacity: 0; }
  4% { transform: translate(var(--tx), var(--ty)); opacity: 1; }
  14%, 92% { transform: translate(0, 0); opacity: 1; }
  100% { transform: translate(0, 0); opacity: 0; }
}
.trail { animation-name: trail; }
@keyframes trail { 0%, 3% { opacity: 0; } 6%, 13% { opacity: 0.6; } 18%, 100% { opacity: 0; } }
/* the agent key's query covers levels 00 to 05 and reads it */
.hl-agent { animation-name: hl-agent; }
@keyframes hl-agent { 0%, 20% { opacity: 0; } 24%, 50% { opacity: 0.08; } 55%, 100% { opacity: 0; } }
.br-agent, .conn-agent, .on-agent { animation-name: br-agent; }
@keyframes br-agent {
  0%, 20% { transform: scaleY(0); opacity: 0; }
  21% { opacity: 1; }
  25%, 50% { transform: scaleY(1); opacity: 1; }
  55%, 100% { transform: scaleY(1); opacity: 0; }
}
.conn-agent, .on-agent { transform: none !important; }
.ring { animation-name: ring; }
@keyframes ring {
  0%, 27% { opacity: 0; transform: scale(1); }
  30% { opacity: 1; transform: scale(1.6); }
  37%, 100% { opacity: 0; transform: scale(2.6); }
}
.res-agent { animation-name: res-agent; }
@keyframes res-agent { 0%, 28% { opacity: 0; } 31%, 92% { opacity: 1; } 100% { opacity: 0; } }
/* carol, at level 00, queries level 00 only and never reaches it */
.hl-carol { animation-name: hl-carol; }
@keyframes hl-carol { 0%, 55% { opacity: 0; } 59%, 80% { opacity: 0.08; } 85%, 100% { opacity: 0; } }
.br-carol, .conn-carol, .on-carol { animation-name: br-carol; }
@keyframes br-carol {
  0%, 55% { transform: scaleY(0); opacity: 0; }
  56% { opacity: 1; }
  59%, 80% { transform: scaleY(1); opacity: 1; }
  85%, 100% { transform: scaleY(1); opacity: 0; }
}
.conn-carol, .on-carol { transform: none !important; }
.res-carol { animation-name: res-carol; }
@keyframes res-carol { 0%, 60% { opacity: 0; } 63%, 92% { opacity: 1; } 100% { opacity: 0; } }

/* without motion: the finished picture */
@media (prefers-reduced-motion: reduce) {
  .token, .ring, .trail, .hl, .bracket, .chip-on, .res, .conn-agent, .conn-carol { animation: none !important; }
  .ring, .trail, .hl-carol, .br-carol, .on-carol, .on-agent { opacity: 0; }
  .hl-agent { opacity: 0.08; }
}
</style>
