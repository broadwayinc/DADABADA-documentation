<script setup lang="ts">
import { ref } from 'vue'
import { useVisible } from './visible'

// What an agent key may touch: one cell of collections x levels, read-only. Three requests from the
// user shell signed in with the key; the answers are the server's own messages.
const root = ref<SVGElement | null>(null)
const playing = useVisible(root)
const cols = ['products', 'orders', 'notes']
const rowsLbl = ['00 to 05', '06 to 99', 'private']
</script>

<template>
  <svg ref="root" class="agent-dia" :class="{ playing }" viewBox="0 0 460 344" role="img"
    aria-labelledby="agent-dia-title agent-dia-desc">
    <title id="agent-dia-title">An agent key's limits</title>
    <desc id="agent-dia-desc">The agent key shop-bot may read the products collection at access levels 00 to 05 and may not
      write. Reading products works; reading orders is refused because the key is not allowed that collection; saving
      a record is refused because the key is read-only.</desc>

    <!-- the key -->
    <text class="lbl" x="0" y="12">AGENT KEY</text>
    <rect class="card" x="0" y="22" width="178" height="128" />
    <text class="strong" x="12" y="46">shop-bot</text>
    <line class="hair" x1="12" y1="58" x2="166" y2="58" />
    <text x="12" y="78"><tspan class="muted">collections</tspan> products</text>
    <text x="12" y="98"><tspan class="muted">max_level  </tspan> 05</text>
    <text x="12" y="118"><tspan class="muted">read_only  </tspan> true</text>
    <text x="12" y="136"><tspan class="muted">expires    </tspan> 30d</text>

    <!-- what it covers -->
    <text class="lbl" x="200" y="12">WHAT IT CAN READ</text>
    <text v-for="(c, i) in cols" :key="c" class="colh" :x="300 + i * 60" y="36" text-anchor="middle">{{ c }}</text>
    <g v-for="(r, j) in rowsLbl" :key="r">
      <text class="rowh" x="200" :y="64 + j * 34">{{ r }}</text>
      <rect v-for="(c, i) in cols" :key="c" class="cell" :class="{ allow: i === 0 && j === 0 }"
        :x="272 + i * 60" :y="44 + j * 34" width="56" height="30" />
    </g>
    <path class="tick" d="M294 59 l5 5 l10 -11" transform="translate(-1 0)" />
    <rect class="flash fl1" x="272" y="44" width="56" height="30" />
    <rect class="flash fl2" x="332" y="44" width="56" height="30" />
    <rect class="flash fl3" x="6" y="104" width="166" height="20" />
    <path class="cross cr2" d="M354 53 l12 12 M366 53 l-12 12" />

    <!-- the agent's requests, as the user shell shows them -->
    <rect class="term" x="0" y="164" width="460" height="176" />
    <g class="line l1">
      <text x="12" y="188"><tspan class="prompt">alice/shop-bot&gt;</tspan> get products --index "price &gt;= 1000"</text>
      <text class="out" x="12" y="206">VZOat4bWCVbRBGAq  products/05  [price=1200 ...]</text>
    </g>
    <g class="line l2">
      <text x="12" y="234"><tspan class="prompt">alice/shop-bot&gt;</tspan> get orders</text>
      <text class="out" x="12" y="252">NO_ACCESS: This agent key is not allowed to</text>
      <text class="out" x="12" y="268">use the collection "orders".</text>
    </g>
    <g class="line l3">
      <text x="12" y="296"><tspan class="prompt">alice/shop-bot&gt;</tspan> post products --data '{"title":"Lamp"}'</text>
      <text class="out" x="12" y="314">NO_ACCESS: This agent key is read-only.</text>
    </g>
  </svg>
</template>

<style scoped>
.agent-dia { width: 100%; height: auto; display: block; overflow: visible; font-family: var(--vp-font-family-mono); font-variant-ligatures: none; font-feature-settings: "calt" 0, "liga" 0; }
text { fill: var(--dd-ink); font-size: 12.5px; white-space: pre; }
.lbl { fill: var(--dd-muted); font-size: 11px; letter-spacing: 0.12em; font-weight: 600; }
.strong { font-weight: 700; font-size: 14px; }
.muted { fill: var(--dd-muted); }
.colh, .rowh { fill: var(--dd-muted); font-size: 11px; }
.card { fill: var(--dd-paper); stroke: var(--dd-ink); stroke-width: 1.5; filter: drop-shadow(2px 2px 0 var(--dd-shadow)); }
.hair { stroke: var(--dd-line); }
.cell { fill: var(--dd-soft); stroke: var(--dd-paper); stroke-width: 2; }
.cell.allow { fill: var(--lp-allow); stroke: var(--dd-ink); stroke-width: 1.5; }
.tick { fill: none; stroke: var(--dd-ink); stroke-width: 2.2; stroke-linecap: square; }
.cross { fill: none; stroke: var(--dd-ink); stroke-width: 2.2; stroke-linecap: square; }
.flash { fill: none; stroke: var(--dd-ink); stroke-width: 3; }
.term { fill: #141414; stroke: #2a2a2a; }
:global(.dark) .term { fill: #000; }
.term ~ .line text { fill: #eeeeee; font-size: 11.5px; }
.term ~ .line .prompt { fill: #8f8f8f; }
.term ~ .line .out { fill: #b4b4b4; }

.line, .flash, .cross {
  animation-duration: 8s;
  animation-iteration-count: infinite;
  animation-timing-function: cubic-bezier(0.22, 0.9, 0.3, 1);
  animation-play-state: paused;
}
.playing :is(.line, .flash, .cross) { animation-play-state: running; }
.l1 { animation-name: l1; }
@keyframes l1 { 0%, 4% { opacity: 0; } 7%, 90% { opacity: 1; } 96%, 100% { opacity: 0; } }
.l2 { animation-name: l2; }
@keyframes l2 { 0%, 30% { opacity: 0; } 33%, 90% { opacity: 1; } 96%, 100% { opacity: 0; } }
.l3 { animation-name: l3; }
@keyframes l3 { 0%, 58% { opacity: 0; } 61%, 90% { opacity: 1; } 96%, 100% { opacity: 0; } }
.fl1 { animation-name: fl1; }
@keyframes fl1 { 0%, 7% { opacity: 0; } 10%, 22% { opacity: 1; } 26%, 100% { opacity: 0; } }
.fl2 { animation-name: fl2; }
@keyframes fl2 { 0%, 33% { opacity: 0; } 36%, 50% { opacity: 1; } 54%, 100% { opacity: 0; } }
.cr2 { animation-name: cr2; }
@keyframes cr2 { 0%, 34% { opacity: 0; } 37%, 90% { opacity: 1; } 96%, 100% { opacity: 0; } }
.fl3 { animation-name: fl3; }
@keyframes fl3 { 0%, 61% { opacity: 0; } 64%, 78% { opacity: 1; } 82%, 100% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .line, .flash, .cross { animation: none !important; }
  .flash { opacity: 0; }
}
</style>
