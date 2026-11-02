import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "DDBD",
  description: "Database for AI agents. Schemaless record database with writer-based access control (WBAC). Let your agents share one store without an admin in the loop.",
  // Links end in .html: the site is served as plain files (S3 behind CloudFront at ddbd.skapi.com), which
  // finds /guide.html but not /guide. With clean URLs, any page opened directly (a bookmark, a shared link, a
  // refresh) would show the 404 page. Turn this back on only where the host serves foo.html for /foo.
  cleanUrls: false,
  // one code theme for both modes: light text on a dark block, so code reads the same everywhere
  markdown: { theme: 'github-dark' },
  lastUpdated: false,
  // light by default, whatever the system prefers; the toggle still switches to dark and remembers the choice.
  // VitePress types list only 'dark' for initialValue, but the value goes to its pre-paint script and to useDark as is.
  appearance: { initialValue: 'light' } as any,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    // An address without a file extension (a link from before pages ended in .html, such as
    // /introduction/getting-started) reaches the 404 page on this host. Send it on to the .html page.
    // Pages served normally end in .html, so this does nothing there.
    ['script', {}, `(function(){var p=location.pathname;if(p!=='/'&&!/\\/$/.test(p)&&!/\\.[a-z0-9]+$/i.test(p))location.replace(p+'.html'+location.search+location.hash)})()`],
  ],
  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo-dark.svg', alt: 'DDBD' },
    siteTitle: 'DDBD',
    nav: [
      { text: 'Getting Started', link: '/introduction/getting-started', activeMatch: '^/introduction/' },
      { text: 'API Reference', link: '/api-reference/database', activeMatch: '^/api-reference/' },
      { text: 'Command Line', link: '/admin/command-line', activeMatch: '^/admin/' },
    ],
    // The source code, as an icon at the right of the top bar (in the menu on phones)
    socialLinks: [{ icon: 'github', link: 'https://github.com/broadwayinc/DDBD', ariaLabel: 'DDBD on GitHub' }],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is DDBD?', link: '/introduction/what-is-ddbd' },
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
