import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';

export default defineConfig({
  integrations: [
    starlight({
      title: 'TLSCheck',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/secanis/tlscheck',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/secanis/tlscheck/edit/main/',
      },
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
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/getting-started/' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'Environment Variables', link: '/configuration/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'UI Colors', link: '/ui-colors/' },
            { label: 'Container', link: '/docker/' },
            { label: 'CI/CD', link: '/tests/' },
            { label: 'License', link: '/license/' },
            { label: 'Privacy Policy', link: '/privacy/' },
            ...openAPISidebarGroups,
          ],
        },
      ],
    }),
  ],
});
