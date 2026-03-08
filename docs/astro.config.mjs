import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';
import astroMermaid from 'astro-mermaid';

export default defineConfig({
  integrations: [
    astroMermaid({
      theme: 'base',
      autoTheme: true
    }),
    starlight({
      title: 'TLSCheck',
      plugins: [
        starlightOpenAPI([
          {
            base: '/api-reference/',
            schema: './openapi.json',
            sidebar: {
              label: 'API Reference',
            },
          },
        ]),
      ],
      markdown: {
        rehypePlugins: [
          astroMermaid,
        ],
      },
      editLink: {
        baseUrl: 'https://github.com/secanis/tlscheck/edit/main/',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/getting-started/' },
            { label: 'How It Works', link: '/how-it-works/' },
            { label: 'Privacy Policy', link: '/privacy/' },
            { label: 'License', link: '/license/' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'Environment Variables', link: '/configuration/' },
            { label: 'API Metrics', link: '/metrics/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'UI Colors', link: '/ui-colors/' },
            { label: 'Container', link: '/container/' },
            { label: 'CI/CD', link: '/cicd/' },
            ...openAPISidebarGroups,
          ],
        },
      ],
    }),
  ],
});
