/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Inline the small local stylesheets into <head> at build time so first paint
// needs zero render-blocking CSS round-trips. Dev keeps the <link>s (HMR).
function inlineCriticalCss() {
  return {
    name: 'inline-critical-css',
    apply: 'build' as const,
    transformIndexHtml(html: string) {
      const css = ['public/styles.css', 'public/css/carousel.css']
        .map((f) => readFileSync(resolve(process.cwd(), f), 'utf8'))
        .join('\n')
      return html
        .replace(/\s*<link rel="stylesheet" href="\/css\/carousel\.css"[^>]*>/, '')
        .replace(/\s*<link rel="stylesheet" href="\/styles\.css[^"]*"[^>]*>/, '')
        .replace('</head>', `    <style>${css}</style>\n  </head>`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), inlineCriticalCss()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || 'dev'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
