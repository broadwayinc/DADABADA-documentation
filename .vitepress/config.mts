import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "DADABADA",
  description: "Database for AI agents. Schemaless record database with writer-based access control (WBAC). Let your agents share one store without an admin in the loop.",
  cleanUrls: true,
  // one code theme for both modes: light text on a dark block, so code reads the same everywhere
  markdown: { theme: 'github-dark' },
  lastUpdated: false,
  // light by default, whatever the system prefers; the toggle still switches to dark and remembers the choice.
  // VitePress types list only 'dark' for initialValue, but the value goes to its pre-paint script and to useDark as is.
  appearance: { initialValue: 'light' } as any,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#ffffff' }],
  ],
  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo-dark.svg', alt: 'DADABADA' },
    siteTitle: 'DADABADA',
    nav: [
      { text: 'Getting Started', link: '/introduction/getting-started', activeMatch: '^/introduction/' },
      { text: 'API Reference', link: '/api-reference/database', activeMatch: '^/api-reference/' },
      { text: 'Command Line', link: '/admin/command-line', activeMatch: '^/admin/' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is DADABADA?', link: '/introduction/what-is-dadabada' },
          { text: 'Getting started', link: '/introduction/getting-started' },
        ],
      },
      {
        text: 'Database',
        items: [
          { text: 'Introduction', link: '/database/introduction' },
          { text: 'Creating records', link: '/database/create' },
          { text: 'Fetching records', link: '/database/fetch' },
          { text: 'Access levels', link: '/database/access-levels' },
          { text: 'Indexing', link: '/database/indexing' },
          { text: 'Tags', link: '/database/tags' },
          { text: 'Unique ID', link: '/database/unique-id' },
          { text: 'Updating records', link: '/database/update' },
          { text: 'Deleting records', link: '/database/delete' },
          { text: 'Referencing', link: '/database/referencing' },
          { text: 'Subscriptions and feed', link: '/database/subscription' },
        ],
      },
      {
        text: 'Users',
        items: [
          { text: 'Introduction', link: '/users/introduction' },
          { text: 'Login and sessions', link: '/users/login' },
          { text: 'Agent keys', link: '/users/agent-keys' },
          { text: 'Client-side encryption', link: '/users/encryption' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Connection', link: '/api-reference/connection' },
          { text: 'Database', link: '/api-reference/database' },
          { text: 'Agent keys', link: '/api-reference/agent-keys' },
          { text: 'Data types', link: '/api-reference/data-types' },
        ],
      },
      {
        text: 'Admin',
        items: [
          { text: 'Command line', link: '/admin/command-line' },
          { text: 'Admin shell', link: '/admin/admin-shell' },
          { text: 'User shell', link: '/admin/user-shell' },
          { text: 'Web admin', link: '/admin/web-admin' },
          { text: 'Settings', link: '/admin/settings' },
          { text: 'Operations', link: '/admin/operations' },
        ],
      },
    ],
    outline: { level: [2, 3] },
    search: { provider: 'local' },
    footer: { message: 'Released under the Apache License 2.0.', copyright: 'Copyright 2026 BROADWAYINC PTE. LTD.' },
  },
  vite: {
    server: {
      allowedHosts: ['seoul.broadwayinc.computer', 'us.broadwayinc.computer', 'us-dev.broadwayinc.computer', 'dev.broadwayinc.computer'],
    },
  },
})
