<script setup lang="ts">
import { ref } from 'vue'
import { useVisible } from './visible'

// The problem in one picture. Usually access to data is decided outside the database: a server in the middle
// checks every request against rules someone wrote, and someone has to build, host and scale it. With
// DADABADA's writer-based access control (WBAC), the writer of each record sets who may read it and the
// database enforces it, so browsers, functions and agents call it directly, each with its own sign-in. A
// request dot travels each path: held up in the server above, straight through below.
const root = ref<SVGElement | null>(null)
const playing = useVisible(root)
const CLIENTS = [
  { t: 'browser', s: 'own sign-in' },
  { t: 'function', s: 'own sign-in' },
  { t: 'AI agent', s: 'agent key' },
]
</script>

<template>
  <svg ref="root" class="prob-dia" :class="{ playing }" viewBox="0 0 520 340" role="img"
    aria-labelledby="prob-dia-title prob-dia-desc">
    <title id="prob-dia-title">Without a server in the middle</title>
    <desc id="prob-dia-desc">Usually, an app or an AI agent reaches its data through a server in the middle that checks
      every request against rules someone wrote, and which someone has to build, host and scale. With DADABADA's
      writer-based access control, the writer of each record sets who may read it, and DADABADA enforces it on every
      request, so a browser, a serverless function and an AI agent each call it directly with their own sign-in.</desc>

    <!-- usually -->
    <text class="lbl" x="20" y="22">USUALLY</text>
    <rect class="box" x="20" y="38" width="110" height="64" />
    <text class="strong" x="32" y="64">app or</text>
    <text class="strong" x="32" y="82">agent</text>

    <line class="wire" x1="130" y1="70" x2="174" y2="70" />
    <rect class="box mid" x="174" y="32" width="174" height="76" />
    <text class="strong" x="186" y="54">server in the middle</text>
    <text class="muted" x="186" y="74">checks every request</text>
    <text class="muted" x="186" y="92">against your rules</text>
    <text class="note" x="174" y="126">you build, host and scale it</text>

    <line class="wire" x1="348" y1="70" x2="392" y2="70" />
    <rect class="box" x="392" y="38" width="108" height="64" />
    <text class="strong" x="404" y="62">database</text>
    <text class="muted" x="404" y="80">trusts the</text>
    <text class="muted" x="404" y="94">server</text>

    <circle class="dot dot-top" cx="130" cy="70" r="5" />

    <line class="split-line" x1="20" y1="152" x2="500" y2="152" />

    <!-- with DADABADA -->
    <text class="lbl" x="20" y="180">WITH DADABADA</text>
    <g v-for="(c, i) in CLIENTS" :key="c.t">
      <rect class="box" x="20" :y="194 + i * 46" width="110" height="38" />
      <text class="strong" x="32" :y="210 + i * 46">{{ c.t }}</text>
      <text class="muted sm" x="32" :y="225 + i * 46">{{ c.s }}</text>
      <line class="wire" x1="130" :y1="213 + i * 46" x2="300" :y2="213 + i * 46" />
      <circle class="dot" :class="`dot-b${i}`" cx="130" :cy="213 + i * 46" r="5" />
    </g>
    <text class="note" x="146" y="186">nothing in the middle</text>
    <rect class="box dd" x="300" y="194" width="200" height="130" />
    <text class="strong big" x="314" y="220">DADABADA</text>
    <text class="muted" x="314" y="244">WBAC: the writer of</text>
    <text class="muted" x="314" y="262">each record sets who</text>
    <text class="muted" x="314" y="280">may read it, checked</text>
    <text class="muted" x="314" y="298">on every request</text>
    <rect class="flash" x="300" y="194" width="200" height="130" />
  </svg>
</template>

<style scoped>
.prob-dia { width: 100%; height: auto; display: block; overflow: visible; font-family: var(--vp-font-family-mono); }
text { fill: var(--dd-ink); font-size: 12.5px; }
.lbl { fill: var(--dd-muted); font-size: 10.5px; letter-spacing: 0.12em; font-weight: 600; }
.strong { font-weight: 700; }
.big { font-size: 14px; }
.muted { fill: var(--dd-muted); font-size: 11.5px; }
.sm { font-size: 10.5px; }
.note { fill: var(--dd-muted); font-size: 11px; font-style: italic; }
.box { fill: var(--dd-paper); stroke: var(--dd-ink); stroke-width: 1.5; }
.box.mid { fill: var(--dd-soft); stroke-dasharray: 5 4; }
.box.dd { stroke-width: 2.5; }
.wire { stroke: var(--dd-ink); stroke-width: 1.5; }
.split-line { stroke: var(--dd-line); stroke-width: 1; }
.dot { fill: var(--dd-ink); opacity: 0; }
.flash { fill: var(--dd-ink); opacity: 0; pointer-events: none; }

/* one 4.8 s loop, paused while off screen: quick moves, short holds */
.dot, .flash {
  animation-duration: 4.8s;
  animation-iteration-count: infinite;
  animation-timing-function: cubic-bezier(0.25, 0.8, 0.3, 1);
  animation-play-state: paused;
}
.playing :is(.dot, .flash) { animation-play-state: running; }

/* above: to the backend, held there while it checks, then on to the database */
.dot-top { animation-name: dot-top; }
@keyframes dot-top {
  0%, 4% { opacity: 0; transform: translateX(0); }
  6% { opacity: 1; transform: translateX(0); }
  14% { opacity: 1; transform: translateX(58px); }
  44% { opacity: 1; transform: translateX(58px); }
  54% { opacity: 1; transform: translateX(254px); }
  62%, 100% { opacity: 0; transform: translateX(254px); }
}
/* below: each client straight to DADABADA */
.dot-b0 { animation-name: dot-b; animation-delay: 0s; }
.dot-b1 { animation-name: dot-b; animation-delay: 0.18s; }
.dot-b2 { animation-name: dot-b; animation-delay: 0.36s; }
@keyframes dot-b {
  0%, 4% { opacity: 0; transform: translateX(0); }
  6% { opacity: 1; transform: translateX(0); }
  16% { opacity: 1; transform: translateX(166px); }
  20%, 100% { opacity: 0; transform: translateX(166px); }
}
.flash { animation-name: flash; }
@keyframes flash { 0%, 15% { opacity: 0; } 19% { opacity: 0.08; } 30%, 100% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .dot, .flash { animation: none !important; }
}
</style>
