import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { inBrowser } from 'vitepress'
import './custom.css'
import Landing from './landing/Landing.vue'

// User shell examples (```text [User shell] blocks) are sessions: `alice> post products ...`,
// `alice/shop-bot> ...` (signed in with an agent key) or `$ dadabada connect ...`, followed by what
// the program prints. Their copy button copies only the commands, without the prompt and without
// the output. Every other block copies as VitePress does.
const PROMPT = /^(\$|[A-Za-z0-9_.@/-]+>) /

function commandsOnly(text: string): string | null {
  const lines = text.split('\n')
  if (!lines.some((l) => PROMPT.test(l))) return null
  return lines.filter((l) => PROMPT.test(l)).map((l) => l.replace(PROMPT, '')).join('\n')
}

if (inBrowser) {
  window.addEventListener(
    'click',
    (e) => {
      const btn = e.target as HTMLElement
      if (!btn.matches?.('div[class*="language-"] > button.copy')) return
      if (!btn.parentElement?.classList.contains('language-text')) return
      const code = btn.parentElement.querySelector('pre code')
      const text = code ? commandsOnly(code.textContent || '') : null
      if (text === null) return
      e.stopImmediatePropagation()
      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('copied')
        setTimeout(() => btn.classList.remove('copied'), 2000)
      })
    },
    true,
  )
}

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // the home page: index.md names this component as its layout
    app.component('DadabadaLanding', Landing)
  },
} satisfies Theme
