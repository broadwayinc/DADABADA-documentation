<script setup lang="ts">
import { computed } from 'vue'
import CmdLine from './CmdLine.vue'
import HeroDiagram from './HeroDiagram.vue'
import KeysDiagram from './KeysDiagram.vue'
import { EXAMPLES, current } from './keysExamples'
import AgentDiagram from './AgentDiagram.vue'
import CryptoDiagram from './CryptoDiagram.vue'
import PerfSection from './PerfSection.vue'

// the postRecord body of the example the key diagram plays now
const ex = computed(() => EXAMPLES[current.value])
const dataPairs = computed(() => Object.entries(ex.value.data))
const INSTALL = 'curl -fsSL https://cdn.broadwayinc.com/get/dadabada/v1 | sh'

const access = [
  { t: 'Access levels', link: '/database/access-levels.html', d: 'Every user has an access\u00a0level from 00\u00a0to\u00a099, set by the admin. A record saved at access\u00a0level\u00a005 can be read by users at\u00a005 and above. Nobody saves above their own access\u00a0level.' },
  { t: 'Private records', link: '/database/access-levels.html#who-can-read-what', d: 'A record at access\u00a0level\u00a0** can be read only by its writer and the users the writer grants it to.' },
  { t: 'Grants and access keys', link: '/database/access-levels.html#granting-access-to-a-record', d: 'Share one record with named users, or hand out a private access key that opens it for a limited time.' },
  { t: 'Rules for references', link: '/database/referencing.html', d: 'A record decides who may point to it: how many records, one per user, or only with certain index values.' },
]

const simple = [
  { t: 'No schema', d: 'Save any JSON. Collections, indexes and tags exist as soon as a record uses them.' },
  { t: 'HTTP and JSON', d: 'Every call is POST\u00a0/v1/<method> with a bearer token. Any language with an HTTP client works.' },
  { t: 'One binary', d: 'RocksDB is compiled in. One command installs it; there is no other service to run.' },
  { t: 'Atomic writes', d: 'A record and all of its keys are written in one step, so no query sees half a record.' },
  { t: 'Live backups', d: 'Back up, export and import while the server keeps answering requests.' },
  { t: 'User shell', d: 'A terminal client to try any request as a user or as an agent key.' },
]

const steps = [
  { t: 'Install', cmd: INSTALL, note: 'Linux\u00a0x86_64 or arm64, glibc\u00a02.34 or newer. Puts ddbd in /usr/local/bin, or in ~/.local/bin without sudo.' },
  { t: 'Create a data folder', cmd: 'ddbd init --data ~/dadabada-data' },
  { t: 'Start the server', cmd: 'ddbd start --data ~/dadabada-data', note: 'Answers on http://localhost:7070.' },
  // the last step's follow-up is the one people miss, so it is body text, not a small grey note
  { t: 'Turn on the web admin', cmd: 'ddbd admin --data ~/dadabada-data web-password', open: 'http://localhost:7070', then: 'and add your first user.' },
]
</script>

<template>
  <div class="lp">
    <!-- hero -->
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-text">
          <p class="eyebrow">Open source database&nbsp;· <span class="nw">Apache-2.0</span></p>
          <h1 class="name">DADABADA</h1>
          <p class="lead">Schemaless record database with <span class="nw">writer-based</span> access control&nbsp;(WBAC).</p>
          <p class="sub">Let your agents work on your data without an admin in the loop.</p>
          <CmdLine class="hero-cmd" :cmd="INSTALL" />
          <div class="actions">
            <a class="btn brand" href="/introduction/getting-started.html">Get started</a>
            <a class="btn alt" href="/introduction/what-is-dadabada.html">What is DADABADA?</a>
          </div>
          <ul class="hero-facts">
            <li>Linux&nbsp;x86_64 and&nbsp;arm64</li>
            <li>One&nbsp;binary</li>
            <li>HTTP and&nbsp;JSON</li>
          </ul>
        </div>
        <figure class="hero-fig">
          <HeroDiagram />
          <figcaption>The writer sets each record's access level. A reader's query covers only the access levels that reader
            may read, so it never reaches the rest.</figcaption>
        </figure>
      </div>
    </section>

    <!-- 01 storage -->
    <section class="sec">
      <div class="wrap">
        <p class="num">01 · Storage</p>
        <div class="split storage">
          <div>
            <h2>Save JSON. Query it at once.</h2>
            <p>There is no schema and no index to set up. With each record, the user who saves it names its collection,
              access level, tags and indexes. DADABADA turns those into sorted keys and writes them together with the
              record in one atomic step.</p>
            <p>A query reads one range of those keys for each access level the reader may read, merged in order. It starts at
              the first match and stops when the page is full, so its cost follows the page, not the size of the
              collection.</p>
            <pre class="code"><code :key="current" class="swap"><span class="cm">// postRecord body</span>
{
  <span class="ck">"data"</span>: { <template v-for="([k, v], i) in dataPairs" :key="k"><span class="ck">"{{ k }}"</span>: <span v-if="typeof v === 'string'" class="cs">"{{ v }}"</span><span v-else class="cn">{{ v }}</span>{{ i < dataPairs.length - 1 ? ', ' : '' }}</template> },
  <span class="ck">"config"</span>: {
    <span class="ck">"collection"</span>: { <span class="ck">"name"</span>: <span class="cs">"{{ ex.coll }}"</span>, <span class="ck">"access_level"</span>: <span class="cs">"{{ ex.lvl }}"</span> },
    <span class="ck">"index"</span>: [{ <span class="ck">"name"</span>: <span class="cs">"{{ ex.ix }}"</span>, <span class="ck">"value"</span>: <span v-if="typeof ex.value === 'string'" class="cs">"{{ ex.value }}"</span><span v-else class="cn">{{ ex.value }}</span> }],
    <span class="ck">"tags"</span>: [<span class="cs">"{{ ex.tag }}"</span>]
  }
}</code></pre>
          </div>
          <figure class="fig">
            <KeysDiagram />
            <figcaption>The saved record's key goes in at its place in the sorted list. The query reads one range,
              from the first match to the last, and never touches keys of other tags or of access levels the reader may
              not read.</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- 02 access -->
    <section class="sec alt-bg">
      <div class="wrap">
        <p class="num">02 · Access</p>
        <h2>Access rules belong to each record</h2>
        <p class="intro">The user who writes a record decides who can read it, and DADABADA checks it on every read.
          There are no access policies for an admin to write or keep up to date.</p>
        <div class="cards four">
          <a v-for="c in access" :key="c.t" class="card" :href="c.link">
            <h3>{{ c.t }}</h3>
            <p>{{ c.d }}</p>
          </a>
        </div>
      </div>
    </section>

    <!-- 03 agents -->
    <section class="sec">
      <div class="wrap">
        <p class="num">03 · Agents</p>
        <div class="split reverse agents">
          <figure class="fig">
            <AgentDiagram />
            <figcaption>An agent key signed in to the user shell. The answers are the server's own.</figcaption>
          </figure>
          <div>
            <h2>Agents get a key, not a password</h2>
            <p>A user makes a key for each agent or script, without asking the admin, and can revoke it at any time. A key
              can be limited to some collections, to a highest access level, to <span class="nw">read-only</span>, to private records or not,
              and to an expiry date.</p>
            <p>An agent reads only what its user may read, within the key's limits. What it saves belongs to the user
              and names the key that saved it.</p>
            <pre class="code"><code><span class="cm">// createAgentKey body</span>
{
  <span class="ck">"name"</span>: <span class="cs">"shop-bot"</span>,
  <span class="ck">"collections"</span>: [<span class="cs">"products"</span>],
  <span class="ck">"max_level"</span>: <span class="cs">"05"</span>,
  <span class="ck">"read_only"</span>: <span class="cn">true</span>,
  <span class="ck">"expires"</span>: <span class="cs">"30d"</span>
}

<span class="cm">// a record the key saved (some fields)</span>
{
  <span class="ck">"record_id"</span>: <span class="cs">"VZYu683bLzapjrgk"</span>,
  <span class="ck">"user_id"</span>: <span class="cs">"JFeCedoO"</span>,
  <span class="ck">"agent"</span>: { <span class="ck">"key_id"</span>: <span class="cs">"mtxBMs"</span>, <span class="ck">"name"</span>: <span class="cs">"shop-bot"</span> },
  <span class="ck">"data"</span>: { <span class="ck">"title"</span>: <span class="cs">"Desk Lamp"</span> }
}</code></pre>
            <a class="more" href="/users/agent-keys.html">Agent keys</a>
          </div>
        </div>
      </div>
    </section>

    <!-- 04 encryption -->
    <section class="sec alt-bg">
      <div class="wrap">
        <p class="num">04 · Encryption</p>
        <div class="split">
          <div>
            <h2>Data the admin cannot read</h2>
            <p>Access levels decide who can fetch a record. For data that must stay secret even from the admin and from
              backups, the app encrypts it before saving.</p>
            <p>DADABADA gives every user a salt and the settings to derive a key from their password with Argon2id. The
              key is made and used on the user's device, the same on every device they sign in on. The server stores
              only the result.</p>
            <a class="more" href="/users/encryption.html">Client-side encryption</a>
          </div>
          <figure class="fig">
            <CryptoDiagram />
          </figure>
        </div>
      </div>
    </section>

    <!-- 05 performance -->
    <PerfSection />

    <!-- 06 simple -->
    <section class="sec alt-bg">
      <div class="wrap">
        <p class="num">06 · Operation</p>
        <h2>Small to run</h2>
        <div class="cards grid3">
          <div v-for="c in simple" :key="c.t" class="card flat">
            <h3>{{ c.t }}</h3>
            <p>{{ c.d }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 07 web admin -->
    <section class="sec">
      <div class="wrap">
        <p class="num">07 · Web admin</p>
        <div class="admin-head">
          <h2>Run it from a browser</h2>
          <div>
            <p>The web admin comes with the server, on the same address and port as the API. See every record, run any
              query, add users and agent keys, change settings, take backups, and stop or restart the server.</p>
            <p>It stays off until the operating system user who runs DADABADA sets its password on the server. Nobody
              can turn it on from the outside.</p>
            <a class="more" href="/admin/web-admin.html">Web admin</a>
          </div>
        </div>
        <figure class="shot">
          <img src="/images/web-admin/records.png" width="2400" height="1400" loading="lazy"
            alt="The web admin's Records screen: a table of records with their collection, access level, owner, indexes and tags" />
        </figure>
      </div>
    </section>

    <!-- 08 install -->
    <section class="sec alt-bg" id="install">
      <div class="wrap">
        <p class="num">08 · Install</p>
        <h2>Running in a minute</h2>
        <ol class="steps">
          <li v-for="(s, i) in steps" :key="s.t">
            <span class="step-n">{{ i + 1 }}</span>
            <div class="step-body">
              <h3>{{ s.t }}</h3>
              <CmdLine :cmd="s.cmd" />
              <p v-if="s.note" class="note">{{ s.note }}</p>
              <p v-if="s.open" class="next">Then open <a :href="s.open" target="_blank" rel="noopener">{{ s.open }}</a> {{ s.then }}</p>
            </div>
          </li>
        </ol>
        <p class="after">DADABADA speaks plain HTTP by default: run it behind HTTPS, or set it up with
          <code>--tls</code>. <a href="/introduction/getting-started.html">Getting started</a> walks through the first
          user, record and query.</p>
      </div>
    </section>

    <!-- skapi -->
    <section class="sec skapi">
      <div class="wrap skapi-grid">
        <div>
          <img class="skapi-logo" src="/images/skapi-logo.png" alt="Skapi logo" width="49" height="60" loading="lazy" />
          <h2>The database design behind Skapi</h2>
        </div>
        <div>
          <p>skapi.com is built on the Dadabada record design. It serves developers worldwide and handles rapidly growing traffic from AI agents.</p>
          <a class="more inv" href="https://www.skapi.com" target="_blank" rel="noopener">skapi.com</a>
        </div>
      </div>
    </section>

    <!-- end -->
    <section class="sec end">
      <div class="wrap end-box">
        <h2>Free and open source</h2>
        <p>DADABADA is licensed under <span class="nw">Apache-2.0</span>. Use it, read it, change it.</p>
        <div class="actions center">
          <a class="btn brand" href="/introduction/getting-started.html">Get started</a>
          <a class="btn alt" href="/introduction/what-is-dadabada.html">Read the docs</a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.lp {
  --lp-block: #c6c6c6;
  --lp-allow: #e2e2e2;
  --lp-grid: rgba(17, 17, 17, 0.045);
  color: var(--dd-ink);
  font-family: var(--vp-font-family-base);
  /* JetBrains Mono would draw >= as one sign; on this page >= is syntax, so it stays two characters */
  font-variant-ligatures: none;
  font-feature-settings: "calt" 0, "liga" 0;
}
:global(.dark) .lp { --lp-block: #4a4a4a; --lp-allow: #3a3a3a; --lp-grid: rgba(236, 236, 236, 0.05); }

.wrap { max-width: 1152px; margin: 0 auto; padding: 0 32px; }
@media (max-width: 639px) { .wrap { padding: 0 16px; } }

/* ---------- hero ---------- */
.hero {
  border-bottom: 1px solid var(--dd-line);
  background-image:
    linear-gradient(var(--lp-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--lp-grid) 1px, transparent 1px);
  background-size: 32px 32px;
  background-position: -1px -1px;
}
.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: 48px;
  align-items: center;
  padding-top: 88px;
  padding-bottom: 96px;
}
.eyebrow, .num {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dd-muted);
  margin: 0 0 18px;
}
.name {
  font-size: clamp(52px, 8.4vw, 104px);
  line-height: 0.95;
  font-weight: 700;
  letter-spacing: -0.045em;
  margin: 0;
}
.lead { font-size: clamp(19px, 2.2vw, 24px); line-height: 1.4; font-weight: 600; letter-spacing: -0.01em; margin: 28px 0 0; }
.sub { font-size: 17px; line-height: 1.6; color: var(--dd-muted); margin: 12px 0 0; max-width: 34rem; }
.hero-cmd { margin-top: 32px; max-width: 34rem; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
.actions.center { justify-content: center; }
.hero-facts { list-style: none; padding: 0; margin: 28px 0 0; display: flex; flex-wrap: wrap; gap: 8px 22px; font-size: 13px; color: var(--dd-muted); }
.hero-facts li::before { content: ""; display: inline-block; width: 7px; height: 7px; margin-right: 9px; vertical-align: 1px; background: var(--dd-ink); }
.hero-fig { margin: 0; padding: 22px 22px 18px; background: var(--dd-paper); border: 1.5px solid var(--dd-ink); box-shadow: 6px 6px var(--dd-shadow); }
figcaption { font-size: 13px; line-height: 1.6; color: var(--dd-muted); margin-top: 18px; }

.btn {
  display: inline-flex;
  align-items: center;
  height: 46px;
  padding: 0 22px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border: 1.5px solid var(--dd-ink);
  box-shadow: 3px 3px var(--dd-shadow);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  text-decoration: none;
}
.btn.brand { background: var(--dd-ink); color: var(--dd-paper); }
.btn.alt { background: var(--dd-paper); color: var(--dd-ink); }
@media (hover: hover) and (pointer: fine) { .btn:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px var(--dd-shadow); } }
.btn:active { transform: translate(3px, 3px); box-shadow: none; }

/* ---------- sections ---------- */
.sec { padding: 112px 0; border-bottom: 1px solid var(--dd-line); }
.alt-bg { background: var(--vp-c-bg-alt); }
h2 { font-size: clamp(28px, 3.6vw, 42px); line-height: 1.12; font-weight: 700; letter-spacing: -0.03em; margin: 0 0 24px; }
h3 { font-size: 16px; line-height: 1.35; font-weight: 700; letter-spacing: -0.01em; margin: 0 0 10px; }
p { font-size: 15.5px; line-height: 1.75; margin: 0 0 16px; }
.intro { max-width: 46rem; color: var(--dd-muted); font-size: 16.5px; margin-bottom: 48px; }
.nw { white-space: nowrap; }
.after code { white-space: nowrap; }
.split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 72px; align-items: center; }
/* Storage: on a desktop the postRecord body never needs a scrollbar. Its column grows to fit the longest line
   of every example (63 characters, the "collection" line) plus the block's padding and border; the diagram
   takes the rest. One column below 960px, where the block has the full width. */
@media (min-width: 960px) {
  .split.storage { grid-template-columns: minmax(auto, 1fr) minmax(0, 1fr); }
  .split.storage .code { min-width: calc(64ch + 42px); }
  /* Agents: the same for the createAgentKey body, whose longest line (the "agent" line) has 54 characters;
     here the code is in the second column */
  .split.agents { grid-template-columns: minmax(0, 1fr) minmax(auto, 1fr); }
  .split.agents .code { min-width: calc(55ch + 42px); }
}
.split > div > p { color: var(--dd-muted); }
.fig { margin: 0; padding: 28px; border: 1.5px solid var(--dd-ink); background: var(--dd-paper); box-shadow: 6px 6px var(--dd-shadow); }

.code {
  margin: 28px 0 0;
  padding: 18px 20px;
  background: #141414;
  color: #e1e4e8;
  border: 1px solid #2a2a2a;
  font-size: 13px;
  line-height: 1.65;
  overflow-x: auto;
}
:global(.dark) .lp .code { background: #000; }
.code code { font-family: var(--vp-font-family-mono); background: none; padding: 0; color: inherit; font-size: inherit; }
/* syntax colors of the docs' code theme (github-dark), so code reads the same on every page */
.code .cm { color: #6a737d; }
.code .cn { color: #79b8ff; }
/* the body changes with the example the key diagram plays */
.code .swap { display: block; animation: code-swap 0.45s ease; }
@keyframes code-swap { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .code .swap { animation: none; } }
.code .ck { color: #79b8ff; }
.code .cs { color: #9ecbff; }

.more {
  display: inline-block;
  margin-top: 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--dd-ink);
  text-decoration: underline;
  text-underline-offset: 4px;
}
.more::after {
  content: "";
  display: inline-block;
  width: 0.42em;
  height: 0.42em;
  margin-left: 0.5em;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(45deg);
  vertical-align: 0.1em;
}

.cards { display: grid; gap: 20px; }
.cards.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.cards.grid4 { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 40px; }
.cards.grid3 { grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 40px; }
.admin-head { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 72px; align-items: start; margin-bottom: 48px; }
.admin-head h2 { margin: 0; }
.admin-head p { color: var(--dd-muted); }
.admin-head p:first-child { margin-top: 0; }
.shot { margin: 0; border: 1.5px solid var(--dd-ink); background: var(--dd-paper); box-shadow: 6px 6px var(--dd-shadow); }
.shot img { display: block; width: 100%; height: auto; }
.card {
  display: block;
  padding: 26px 24px 22px;
  background: var(--dd-paper);
  border: 1px solid var(--vp-c-border);
  box-shadow: 3px 3px var(--dd-shadow);
  color: inherit;
  text-decoration: none;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
a.card { border-top: 3px solid var(--dd-ink); }
@media (hover: hover) and (pointer: fine) { a.card:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px var(--dd-shadow); } }
.card p { font-size: 14px; line-height: 1.65; color: var(--dd-muted); margin: 0; }
.card.flat { box-shadow: none; }

/* install */
.steps { list-style: none; padding: 0; margin: 40px 0 0; display: grid; gap: 28px; counter-reset: none; }
.steps li { display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 20px; align-items: start; }
.step-n {
  width: 44px; height: 44px;
  display: grid; place-items: center;
  border: 1.5px solid var(--dd-ink);
  font-weight: 700;
  font-size: 16px;
}
.step-body h3 { margin: 10px 0 12px; }
.note { font-size: 13px; color: var(--dd-muted); margin: 10px 0 0; }
.next { margin: 12px 0 0; color: var(--dd-ink); }
.next a { color: inherit; text-decoration: underline; text-underline-offset: 3px; }
.after { margin-top: 40px; color: var(--dd-muted); max-width: 52rem; }
.after a { color: var(--dd-ink); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
.after code, .intro code { font-size: 0.9em; background: var(--dd-soft); padding: 2px 6px; }

/* skapi */
.skapi { background: var(--dd-ink); color: var(--dd-paper); border-bottom: 0; }
.skapi h2 { color: var(--dd-paper); margin: 0; }
.skapi-logo { display: block; width: 49px; height: 60px; margin: 0 0 28px; }
.skapi p { color: var(--dd-paper); opacity: 0.86; }
.num.inv { color: var(--dd-paper); opacity: 0.7; }
.more.inv { color: var(--dd-paper); }
.skapi-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 72px; align-items: end; }

/* end */
.end { border-bottom: 0; }
.end-box { text-align: center; }
.end-box p { color: var(--dd-muted); }

/* ---------- small screens ---------- */
@media (max-width: 1023px) {
  .cards.four, .cards.grid4, .cards.grid3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .admin-head { grid-template-columns: minmax(0, 1fr); gap: 24px; }
}
@media (max-width: 959px) {
  .hero-grid { grid-template-columns: minmax(0, 1fr); gap: 48px; padding-top: 56px; padding-bottom: 64px; }
  .split, .skapi-grid { grid-template-columns: minmax(0, 1fr); gap: 40px; }
  .split.reverse > :first-child { order: 2; }
  .sec { padding: 80px 0; }
}
@media (max-width: 639px) {
  .cards.four, .cards.grid4, .cards.grid3 { grid-template-columns: minmax(0, 1fr); }
  /* on a phone the whole screen would be too small to read: show its left part (menu and records) larger */
  .shot { box-shadow: 4px 4px var(--dd-shadow); overflow: hidden; }
  .shot img { width: 190%; max-width: none; }
  .hero-fig, .fig { padding: 16px; box-shadow: 4px 4px var(--dd-shadow); }
  .sec { padding: 64px 0; }
  .btn { flex: 1 1 auto; justify-content: center; }
}
</style>

<style>
/* the landing page has no outline, so VitePress's phone bar ("Return to top") has nothing to offer here */
body:has(.lp) .VPLocalNav { display: none; }
</style>
