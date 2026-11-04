<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import perf from './perf.json'

// Measured results (see "How this was measured"). The chart shows the tag query as the database grows,
// for the share of records the caller may read that is picked above it.
type Key = 'dd' | 'pg' | 'lite' | 'mongo'
const SERIES: { key: Key; name: string; short: string }[] = [
  { key: 'dd', name: perf.engines.dd, short: 'DDBD' },
  { key: 'pg', name: perf.engines.pg, short: 'PostgreSQL' },
  { key: 'lite', name: perf.engines.lite, short: 'SQLite' },
  { key: 'mongo', name: perf.engines.mongo, short: 'MongoDB' },
]
const LEVELS = [
  { level: '0', share: '0.1%' },
  { level: '1', share: '1%' },
  { level: '2', share: '10%' },
  { level: '3', share: '100%' },
]
const level = ref('1')
const points = computed(() => (perf.scaling as Record<string, any[]>)[level.value])
const at1m = computed(() => points.value[points.value.length - 1])
const share = computed(() => LEVELS.find((l) => l.level === level.value)!.share)
const fmt = (v: number) => (v >= 100 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2))
// one decimal below 10x, so a ratio is never rounded up into a bigger claim
const ratio = (a: number, b: number) => (b / a >= 10 ? `${Math.round(b / a)}×` : `${(b / a).toFixed(1)}×`)
const joinList = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
// the line under the tiles: DDBD against each other database, whichever way round it went
const footSlower = computed(() => SERIES.filter((s) => s.key !== 'dd' && at1m.value[s.key] > at1m.value.dd))
const footFaster = computed(() => SERIES.filter((s) => s.key !== 'dd' && at1m.value[s.key] <= at1m.value.dd))

// chart geometry: log y, three evenly spaced sizes on x. Phones get a narrower drawing, so its text stays readable.
const narrow = ref(false)
let mq: MediaQueryList | null = null
const onMq = () => (narrow.value = !!mq?.matches)
onMounted(() => {
  mq = window.matchMedia('(max-width: 639px)')
  onMq()
  mq.addEventListener('change', onMq)
})
onBeforeUnmount(() => mq?.removeEventListener('change', onMq))
const W = computed(() => (narrow.value ? 380 : 640))
const L = computed(() => (narrow.value ? 52 : 64))
const R = computed(() => (narrow.value ? 96 : 150))
const H = 340, T = 18, B = 46
const PW = computed(() => W.value - L.value - R.value)
const PH = H - T - B
const allVals = computed(() => points.value.flatMap((p: any) => SERIES.map((s) => p[s.key] as number)))
const lo = computed(() => Math.pow(10, Math.floor(Math.log10(Math.min(...allVals.value)))))
const hi = computed(() => Math.pow(10, Math.ceil(Math.log10(Math.max(...allVals.value)))))
const xOf = (i: number) => L.value + (i * PW.value) / 2
const yOf = (v: number) => T + ((Math.log10(hi.value) - Math.log10(v)) / (Math.log10(hi.value) - Math.log10(lo.value))) * PH
const ticks = computed(() => {
  const out: number[] = []
  for (let v = lo.value; v <= hi.value * 1.001; v *= 10) out.push(v)
  return out
})
const tickLabel = (v: number) => (v < 1 ? `${v} ms` : `${Math.round(v)} ms`)
const paths = computed(() =>
  SERIES.map((s) => ({ ...s, d: points.value.map((p: any, i: number) => `${i ? 'L' : 'M'}${xOf(i)} ${yOf(p[s.key])}`).join(' ') })),
)
// end labels, pushed apart when they would overlap
const endLabels = computed(() => {
  const last = points.value[points.value.length - 1]
  const ls = SERIES.map((s) => ({ ...s, v: last[s.key] as number, y: yOf(last[s.key]) })).sort((a, b) => a.y - b.y)
  for (let i = 1; i < ls.length; i++) if (ls[i].y - ls[i - 1].y < 30) ls[i].y = ls[i - 1].y + 30
  // pushed below the plot: move the whole stack up so the last label stays inside
  const over = ls[ls.length - 1].y - (T + PH)
  if (over > 0) ls.forEach((l) => (l.y -= over))
  return ls
})
const sizeLabel = (n: number) => (n >= 1e6 ? `${n / 1e6}M` : `${n / 1e3}k`)
// the tooltip opens to the right of the first point, to the left of the last, centred otherwise
const tipStyle = computed(() => {
  if (hover.value === null) return {}
  const left = `${(xOf(hover.value) / W.value) * 100}%`
  const shift = hover.value === 0 ? 'translateX(12px)' : hover.value === points.value.length - 1 ? 'translateX(calc(-100% - 12px))' : 'translateX(-50%)'
  return { left, transform: shift }
})
const hover = ref<number | null>(null)

</script>

<template>
  <section class="sec perf">
    <div class="wrap">
      <p class="num">05 · Performance</p>
      <h2>Query time grows with the answer, not with the database</h2>
      <p class="intro">How long DDBD, PostgreSQL, SQLite and MongoDB take to answer the same query as more records
        are stored.</p>

      <div class="filter" role="group" aria-label="Query to be fetched by share of the records">
        <span class="filter-lbl">Query to be fetched by</span>
        <!-- one group, so the four buttons wrap to the next line together -->
        <span class="filter-btns">
          <button v-for="l in LEVELS" :key="l.level" type="button" :class="{ on: level === l.level }"
            :aria-pressed="level === l.level" @click="level = l.level">{{ l.share }}</button>
        </span>
      </div>
      <p class="filter-note">100% is close to a full fetch with nothing filtered out. The low numbers are the queries
        that matter.</p>

      <div class="perf-grid">
        <div class="tiles">
          <p class="tiles-head">1,000,000&nbsp;records, median of {{ perf.repeats }}&nbsp;runs of {{ perf.runs }}&nbsp;queries</p>
          <div v-for="s in SERIES" :key="s.key" class="tile" :class="s.key">
            <span class="tile-name"><i class="mk" :class="s.key" />{{ s.name }}</span>
            <span class="tile-val">{{ fmt(at1m[s.key]) }} <small>ms</small></span>
          </div>
          <p class="tiles-foot">
            <template v-if="footSlower.length">DDBD answered
              {{ joinList(footSlower.map((s) => `${ratio(at1m.dd, at1m[s.key])}\u00a0faster than ${s.short}`)) }}.</template>
            <template v-for="s in footFaster" :key="s.key">{{ (footSlower.length ? ' ' : '') + s.short }} answered
              {{ ratio(at1m[s.key], at1m.dd) }}&nbsp;faster than DDBD.</template>
          </p>
        </div>

        <figure class="chart">
          <svg :viewBox="`0 0 ${W} ${H}`" role="img"
            :aria-label="`Median query time by number of records, caller may read ${share}`">
            <g class="grid">
              <g v-for="t in ticks" :key="t">
                <line :x1="L" :x2="L + PW" :y1="yOf(t)" :y2="yOf(t)" />
                <text :x="L - 10" :y="yOf(t) + 4" text-anchor="end">{{ tickLabel(t) }}</text>
              </g>
              <text v-for="(p, i) in points" :key="p.records" class="xl" :x="xOf(i)" :y="H - 18"
                text-anchor="middle">{{ sizeLabel(p.records) }}{{ narrow ? '' : ' records' }}</text>
            </g>
            <line v-if="hover !== null" class="cross" :x1="xOf(hover)" :x2="xOf(hover)" :y1="T" :y2="T + PH" />
            <g v-for="s in paths" :key="s.key" class="series" :class="s.key">
              <path :d="s.d" />
              <g v-for="(p, i) in points" :key="i">
                <rect v-if="s.key === 'dd'" :x="xOf(i) - 5" :y="yOf(p.dd) - 5" width="10" height="10" />
                <circle v-else-if="s.key === 'pg'" :cx="xOf(i)" :cy="yOf(p.pg)" r="5" />
                <path v-else-if="s.key === 'lite'" :d="`M${xOf(i)} ${yOf(p.lite) - 6} l6 10 h-12 z`" />
                <path v-else :d="`M${xOf(i)} ${yOf(p.mongo) - 6} l6 6 l-6 6 l-6 -6 z`" />
              </g>
            </g>
            <g class="ends">
              <g v-for="e in endLabels" :key="e.key">
                <text :x="L + PW + 12" :y="e.y + 4" class="end-name">{{ e.short }}</text>
                <text :x="L + PW + 12" :y="e.y + 18" class="end-val">{{ fmt(e.v) }} ms</text>
              </g>
            </g>
            <rect v-for="(p, i) in points" :key="'hit' + i" class="hit" :x="xOf(i) - PW / 4" :y="T"
              :width="PW / 2" :height="PH" tabindex="0" :aria-label="`${sizeLabel(p.records)} records`"
              @mouseenter="hover = i" @mouseleave="hover = null" @focus="hover = i" @blur="hover = null" />
          </svg>
          <div v-if="hover !== null" class="tip" :style="tipStyle">
            <strong>{{ points[hover].records.toLocaleString('en') }} records</strong>
            <span v-for="s in SERIES" :key="s.key"><i class="mk" :class="s.key" />{{ s.short }}
              <b>{{ fmt(points[hover][s.key]) }} ms</b></span>
            <span class="tip-rows">{{ points[hover].rows }} records per answer on average</span>
          </div>
          <figcaption>Median time per query, log scale, by number of records stored.</figcaption>
        </figure>
      </div>

      <details class="numbers">
        <summary>All results at 1,000,000 records</summary>
        <div class="tbl-wrap">
          <table>
            <thead>
              <tr><th>Query</th><th>Caller may read</th><th>Records returned</th><th>DDBD</th><th>PostgreSQL</th><th>SQLite</th><th>MongoDB</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in perf.table" :key="r.kind + r.level">
                <td>{{ r.kind === 'tag' ? 'tag sale, price >= X' : 'price >= X, no tag' }}</td>
                <td>{{ r.share }}</td>
                <td>{{ r.rows }}</td>
                <td :class="{ win: r.dd <= r.pg && r.dd <= r.lite && r.dd <= r.mongo }">{{ fmt(r.dd) }} ms</td>
                <td>{{ fmt(r.pg) }} ms</td>
                <td>{{ fmt(r.lite) }} ms</td>
                <td>{{ fmt(r.mongo) }} ms</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="tbl-note">Without a tag, an index on price alone serves the query well once the user may read
          10% or more of the records, and PostgreSQL and SQLite answer faster than DDBD. With a tag, a
          SQL database has to combine the tag index, the price order and the access filter at query time;
          DDBD wrote a key that already holds all three when the record was saved. When the user may read every
          record there is no access filter to combine, and PostgreSQL answers the tag query faster.
          MongoDB combines its indexes at query time as the SQL databases do, so it slows down with the tag and the
          access filter too; without them, when the user may read every record, it is faster than DDBD.</p>
      </details>

      <details class="numbers">
        <summary>How this was measured</summary>
        <ul class="method">
          <li><b>Machine:</b> Intel Core <span class="nw">i7-1160G7</span> laptop (4&nbsp;cores, 8&nbsp;threads), 15&nbsp;GB RAM, Linux&nbsp;7.0. All data in
            memory.</li>
          <li><b>Data:</b> 10,000, 100,000 and 1,000,000 products from one seeded generator: a price from 1 to
            1,000,000 and one of 20&nbsp;tags (<code>sale</code> on&nbsp;5%). Each record got an access level: 00 on 0.1% of
            the records, 01 on 0.9%, 02 on 9% and 03 on 90%. A user may read records at their own access level or
            below, so users at access&nbsp;level&nbsp;00, 01, 02 and&nbsp;03 may read 0.1%, 1%, 10% and 100% of the records.</li>
          <li><b>The same request for all four:</b> every query is the same HTTP <code>POST</code> with a JSON
            body and a session token, and every answer is the 50&nbsp;full records as JSON, the same bytes from each
            database. PostgreSQL, SQLite and MongoDB answer through a small HTTP server written for this test with
            the same libraries as DDBD's (hyper, tokio, serde_json). Like DDBD, it reads the token, looks up
            the user's access level, runs the query and writes the JSON answer.</li>
          <li><b>DDBD {{ perf.engines.dd.split(' ')[1] }}:</b> default settings; <code>getRecords</code>.</li>
          <li><b>{{ perf.engines.pg }}:</b> one table with the record id, collection, access level, price, tags and
            the record JSON; indexes on (collection, price, id), (collection, access level, price, id) and a GIN index
            on tags.
            2&nbsp;GB shared buffers, JIT off, a plan for each query's values. Its own process, reached by the HTTP
            server over its local socket, as any application reaches it.</li>
          <li><b>{{ perf.engines.lite }}:</b> the same table and two indexes, with the tags in their own indexed
            table; 2&nbsp;GB page cache. Runs inside the HTTP server's process, as RocksDB runs inside DDBD's.</li>
          <li><b>{{ perf.engines.mongo }}:</b> one document per record with the record id, collection, access level,
            price, tags and the record itself; the same indexes as PostgreSQL: (collection, price, id), (collection,
            access level, price, id) and tags. 2&nbsp;GB cache. Its own process, reached by the HTTP server over its local
            socket; a query is one <code>find</code> sorted by price and id.</li>
          <li><b>Runs:</b> one Python client on the same machine, one query at a time over a kept-alive
            connection: {{ perf.runs }}&nbsp;queries per case with random price values, after 30&nbsp;warm-up queries. The
            four databases took turns query by query, so any change in the machine's speed reached all four alike.
            The whole set was run {{ perf.repeats }}&nbsp;times; each number is the median of the runs' medians, because
            the laptop's speed changed by up to a third from one run to the next. All four returned the same records
            in the same order for every query.</li>
          <li><b>Settled databases:</b> after loading, DDBD was restarted and left idle until its storage engine
            had finished sorting the new data into place, and PostgreSQL was checkpointed and analyzed, so no
            database was still busy with its load while it answered.</li>
        </ul>
      </details>
    </div>
  </section>
</template>

<style scoped>
.sec { padding: 112px 0; border-bottom: 1px solid var(--dd-line); }
.wrap { max-width: 1152px; margin: 0 auto; padding: 0 32px; }
.num { font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--dd-muted); margin: 0 0 18px; }
h2 { font-size: clamp(28px, 3.6vw, 42px); line-height: 1.12; font-weight: 700; letter-spacing: -0.03em; margin: 0 0 24px; max-width: 52rem; }
.intro { max-width: 50rem; color: var(--dd-muted); font-size: 16px; line-height: 1.75; margin: 0 0 36px; }
code { font-size: 0.9em; background: var(--dd-soft); padding: 2px 6px; }

.perf {
  --pf-dd: var(--dd-ink);
  --pf-pg: #6b6b6b;
  --pf-lite: #a3a3a3;
  --pf-mongo: #8a8a8a;
}
:global(.dark) .perf { --pf-pg: #a3a3a3; --pf-lite: #646464; --pf-mongo: #8a8a8a; }

.filter { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; }
.filter-note { max-width: 50rem; font-size: 14px; line-height: 1.7; color: var(--dd-muted); margin: 0 0 28px; }
.filter-lbl { font-size: 13px; color: var(--dd-muted); margin-right: 6px; white-space: nowrap; }
.filter-btns { display: flex; flex-wrap: nowrap; gap: 8px; }
.filter button {
  font: 600 13px/1 var(--vp-font-family-mono);
  padding: 9px 14px;
  border: 1.5px solid var(--vp-c-border);
  background: var(--dd-paper);
  color: var(--dd-ink);
  white-space: nowrap;
}
.filter button.on { background: var(--dd-ink); color: var(--dd-paper); border-color: var(--dd-ink); }
@media (hover: hover) and (pointer: fine) { .filter button:not(.on):hover { border-color: var(--dd-ink); } }

.perf-grid { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.6fr); gap: 40px; align-items: start; }
.tiles { display: grid; gap: 12px; }
.tiles-head { font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--dd-muted); margin: 0 0 4px; }
.tile { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 16px 18px; border: 1px solid var(--vp-c-border); background: var(--dd-paper); }
.tile.dd { border: 1.5px solid var(--dd-ink); box-shadow: 4px 4px var(--dd-shadow); }
.tile-name { font-size: 13px; color: var(--dd-muted); display: inline-flex; align-items: center; gap: 10px; white-space: nowrap; }
.tile.dd .tile-name { color: var(--dd-ink); font-weight: 600; }
.tile-val { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; white-space: nowrap; }
.tile:not(.dd) .tile-val { font-size: 24px; font-weight: 600; color: var(--dd-muted); }
.tile-val small { font-size: 14px; font-weight: 600; color: var(--dd-muted); }
.tiles-foot { font-size: 14px; line-height: 1.65; color: var(--dd-muted); margin: 8px 0 0; }

.mk { display: inline-block; width: 10px; height: 10px; flex: none; }
.mk.dd { background: var(--pf-dd); }
.mk.pg { background: var(--pf-pg); border-radius: 50%; }
.mk.lite { width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 10px solid var(--pf-lite); }
.mk.mongo { width: 9px; height: 9px; background: var(--pf-mongo); transform: rotate(45deg); }

.chart { position: relative; margin: 0; padding: 20px 20px 16px; border: 1.5px solid var(--dd-ink); background: var(--dd-paper); box-shadow: 6px 6px var(--dd-shadow); }
.chart svg { width: 100%; height: auto; display: block; overflow: visible; font-family: var(--vp-font-family-mono); }
.grid line { stroke: var(--dd-line); stroke-width: 1; }
.grid text { fill: var(--dd-muted); font-size: 12px; }
.grid .xl { fill: var(--dd-ink); font-size: 12.5px; }
.cross { stroke: var(--dd-ink); stroke-width: 1; }
.series path:first-child { fill: none; stroke-width: 2; stroke-linejoin: round; }
.series.dd path:first-child { stroke: var(--pf-dd); stroke-width: 3; }
.series.pg path:first-child { stroke: var(--pf-pg); }
.series.lite path:first-child { stroke: var(--pf-lite); }
.series.mongo path:first-child { stroke: var(--pf-mongo); stroke-dasharray: 6 4; }
.series.dd rect { fill: var(--pf-dd); stroke: var(--dd-paper); stroke-width: 2; }
.series.pg circle { fill: var(--pf-pg); stroke: var(--dd-paper); stroke-width: 2; }
.series.lite g path { fill: var(--pf-lite); stroke: var(--dd-paper); stroke-width: 2; }
.series.mongo g path { fill: var(--pf-mongo); stroke: var(--dd-paper); stroke-width: 2; }
.end-name { fill: var(--dd-ink); font-size: 12.5px; font-weight: 700; }
.end-val { fill: var(--dd-muted); font-size: 12px; }
.hit { fill: transparent; outline: none; cursor: crosshair; }
.tip {
  position: absolute;
  top: 24px;
  display: grid;
  gap: 4px;
  min-width: 210px;
  padding: 10px 12px;
  background: var(--dd-paper);
  border: 1.5px solid var(--dd-ink);
  box-shadow: 3px 3px var(--dd-shadow);
  font-size: 12.5px;
  pointer-events: none;
}
.tip span { display: flex; align-items: center; gap: 8px; }
.tip b { margin-left: auto; }
.tip-rows { color: var(--dd-muted); font-size: 11.5px; }
figcaption { font-size: 13px; line-height: 1.6; color: var(--dd-muted); margin-top: 12px; }

.numbers { margin-top: 28px; border-top: 1px solid var(--dd-line); padding-top: 18px; }
.numbers summary { cursor: pointer; font-weight: 600; font-size: 14.5px; }
.tbl-wrap { overflow-x: auto; margin-top: 16px; }
table { width: 100%; border-collapse: collapse; font-size: 13.5px; font-variant-numeric: tabular-nums; }
th { text-align: left; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dd-muted); font-weight: 600; padding: 10px 12px; border-bottom: 1.5px solid var(--dd-ink); white-space: nowrap; }
td { padding: 10px 12px; border-bottom: 1px solid var(--dd-line); white-space: nowrap; }
td.win { font-weight: 700; background: var(--dd-ink); color: var(--dd-paper); }
.tbl-note { font-size: 14px; line-height: 1.7; color: var(--dd-muted); margin: 16px 0 0; max-width: 52rem; }
.method { margin: 16px 0 0; padding-left: 18px; font-size: 14px; line-height: 1.7; color: var(--dd-muted); display: grid; gap: 8px; max-width: 56rem; }
.method b { color: var(--dd-ink); white-space: nowrap; }
.nw { white-space: nowrap; }


@media (max-width: 959px) {
  .perf-grid { grid-template-columns: minmax(0, 1fr); }
  .sec { padding: 80px 0; }
}
@media (max-width: 639px) {
  .wrap { padding: 0 16px; }
  .sec { padding: 64px 0; }
  .chart { padding: 12px; box-shadow: 4px 4px var(--dd-shadow); }
  .tip { min-width: 180px; }
}
</style>
