<script setup lang="ts">
import { ref } from 'vue'
import { useVisible } from './visible'

// Client-side encryption: the server hands out the salt and the key-derivation settings; the key is
// derived and used on the device; only ciphertext is saved.
const root = ref<SVGElement | null>(null)
const playing = useVisible(root)
</script>

<template>
  <svg ref="root" class="crypto-dia" :class="{ playing }" viewBox="0 0 460 250" role="img"
    aria-labelledby="crypto-dia-title crypto-dia-desc">
    <title id="crypto-dia-title">Client-side encryption</title>
    <desc id="crypto-dia-desc">DADABADA sends the user's enc_salt and key-derivation settings. On the device, Argon2id
      turns the password and the salt into a key, and AES-GCM encrypts the record data with it. Only the ciphertext is
      saved in DADABADA; the key never leaves the device.</desc>

    <text class="lbl" x="0" y="14">ON THE USER'S DEVICE</text>
    <rect class="frame" x="0" y="24" width="300" height="218" />
    <text class="lbl" x="340" y="14">DADABADA</text>
    <rect class="frame" x="340" y="24" width="120" height="218" />

    <!-- inputs -->
    <rect class="chip" x="12" y="38" width="128" height="40" />
    <text class="k" x="22" y="54">password</text>
    <text x="22" y="70">correct-horse</text>
    <g class="salt">
      <rect class="chip" x="160" y="38" width="128" height="40" />
      <text class="k" x="170" y="54">enc_salt, kdf</text>
      <text x="170" y="70">9f2c… argon2id</text>
    </g>
    <rect class="chip src" x="352" y="38" width="96" height="40" />
    <text class="k" x="362" y="54">enc_salt</text>
    <text x="362" y="70">9f2c…</text>
    <path class="arrow" d="M352 58 H294" />
    <circle class="dot dot-salt" cx="352" cy="58" r="4" />

    <!-- derive -->
    <path class="hair" d="M76 78 V100 M224 78 V100 M76 100 H224 M150 100 V108" />
    <rect class="box kdf" x="96" y="108" width="108" height="26" />
    <text x="150" y="125" text-anchor="middle" class="b">Argon2id</text>
    <path class="hair" d="M150 134 V146" />
    <g class="key">
      <rect class="chip keychip" x="96" y="146" width="108" height="26" />
      <text x="150" y="163" text-anchor="middle" class="b inv">key</text>
    </g>

    <!-- encrypt -->
    <rect class="chip" x="12" y="190" width="104" height="40" />
    <text class="k" x="22" y="206">data</text>
    <text x="22" y="222">secret note</text>
    <path class="hair" d="M116 210 H122 M150 172 V200 M178 210 H198" />
    <rect class="box aes" x="122" y="200" width="56" height="20" />
    <text x="150" y="214" text-anchor="middle" class="s">AES-GCM</text>
    <g class="cipher">
      <rect class="chip" x="198" y="190" width="90" height="40" />
      <text class="k" x="208" y="206">data</text>
      <text x="208" y="222">u2Vq9L…</text>
    </g>
    <path class="arrow" d="M288 210 H346" />
    <circle class="dot dot-cipher" cx="290" cy="210" r="4" />
    <g class="stored">
      <rect class="chip" x="352" y="190" width="96" height="40" />
      <text class="k" x="362" y="206">saved</text>
      <text x="362" y="222">u2Vq9L…</text>
    </g>
    <text class="k" x="400" y="118" text-anchor="middle">no key</text>
    <text class="k" x="400" y="134" text-anchor="middle">here</text>
  </svg>
</template>

<style scoped>
.crypto-dia { width: 100%; height: auto; display: block; overflow: visible; font-family: var(--vp-font-family-mono); font-variant-ligatures: none; font-feature-settings: "calt" 0, "liga" 0; }
text { fill: var(--dd-ink); font-size: 12.5px; }
.lbl { fill: var(--dd-muted); font-size: 11px; letter-spacing: 0.12em; font-weight: 600; }
.k { fill: var(--dd-muted); font-size: 11px; }
.b { font-weight: 700; }
.s { font-size: 11px; font-weight: 600; }
.inv { fill: var(--dd-paper); }
.frame { fill: none; stroke: var(--dd-ink); stroke-width: 1.5; }
.chip { fill: var(--dd-paper); stroke: var(--dd-ink); stroke-width: 1.2; }
.src { fill: var(--dd-soft); }
.keychip { fill: var(--dd-ink); }
.box { fill: var(--dd-soft); stroke: var(--dd-ink); stroke-width: 1.2; }
.hair { fill: none; stroke: var(--dd-muted); stroke-width: 1; }
.arrow { fill: none; stroke: var(--dd-ink); stroke-width: 1; stroke-dasharray: 3 4; }
.dot { fill: var(--dd-ink); }

.salt, .key, .cipher, .stored, .dot, .kdf, .aes {
  animation-duration: 7s;
  animation-iteration-count: infinite;
  animation-timing-function: cubic-bezier(0.22, 0.9, 0.3, 1);
  animation-play-state: paused;
}
.playing :is(.salt, .key, .cipher, .stored, .dot, .kdf, .aes) { animation-play-state: running; }
.dot-salt { animation-name: dot-salt; }
@keyframes dot-salt { 0%, 4% { opacity: 0; transform: translateX(0); } 6% { opacity: 1; } 16% { opacity: 1; transform: translateX(-60px); } 18%, 100% { opacity: 0; transform: translateX(-60px); } }
.salt { animation-name: salt; }
@keyframes salt { 0%, 15% { opacity: 0.15; } 19%, 92% { opacity: 1; } 100% { opacity: 0.15; } }
.kdf { animation-name: kdf; }
@keyframes kdf { 0%, 22% { stroke-width: 1.2; } 26%, 32% { stroke-width: 3; } 36%, 100% { stroke-width: 1.2; } }
.key { animation-name: key; }
@keyframes key { 0%, 32% { opacity: 0; } 36%, 92% { opacity: 1; } 100% { opacity: 0; } }
.aes { animation-name: aes; }
@keyframes aes { 0%, 42% { stroke-width: 1.2; } 46%, 52% { stroke-width: 3; } 56%, 100% { stroke-width: 1.2; } }
.cipher { animation-name: cipher; }
@keyframes cipher { 0%, 52% { opacity: 0; } 56%, 92% { opacity: 1; } 100% { opacity: 0; } }
.dot-cipher { animation-name: dot-cipher; }
@keyframes dot-cipher { 0%, 58% { opacity: 0; transform: translateX(0); } 60% { opacity: 1; } 70% { opacity: 1; transform: translateX(56px); } 72%, 100% { opacity: 0; transform: translateX(56px); } }
.stored { animation-name: stored; }
@keyframes stored { 0%, 70% { opacity: 0; } 74%, 92% { opacity: 1; } 100% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .salt, .key, .cipher, .stored, .dot, .kdf, .aes { animation: none !important; }
  .dot { opacity: 0; }
}
</style>
