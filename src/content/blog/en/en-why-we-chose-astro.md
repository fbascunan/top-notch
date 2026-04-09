---
title: "Why We Chose Astro for Our Agency Website"
slug: "why-we-chose-astro"
author: "TopNotch Team"
date: 2026-03-10
tags: ["astro", "web-development", "performance"]
summary: "A deep dive into why we picked Astro as the framework for our agency site — and how its static-first approach delivers blazing-fast performance without sacrificing developer experience."
coverImage: "/blog/why-we-chose-astro.svg"
draft: false
locale: "en"
---

## The Problem with Traditional Frameworks

When we set out to rebuild the TopNotch website, we had clear requirements: lightning-fast page loads, excellent SEO, and a great developer experience. Most JavaScript frameworks ship too much client-side code for what is essentially a content-driven site.

We evaluated Next.js, Nuxt, and SvelteKit — all excellent tools — but they come with a JavaScript runtime cost that felt unnecessary for a site that's 95% static content.

## Enter Astro

Astro's philosophy resonated with us immediately: **ship zero JavaScript by default**. Every page is server-rendered to static HTML at build time, and you only add client-side interactivity where you actually need it (the "islands architecture").

### What We Love

- **Content Collections** — Type-safe Markdown/MDX with Zod schemas. Adding a new blog post or portfolio entry is just creating a `.md` file.
- **Performance** — Our Lighthouse scores are consistently 95+ across all categories. No hydration cost on static pages.
- **Flexibility** — Need a React component for a complex form? Drop it in. Need Vue for a data visualization? Go for it. Astro doesn't lock you into one UI framework.
- **Tailwind v4 Integration** — The new CSS-first configuration in Tailwind v4 pairs beautifully with Astro's Vite-based build pipeline.

### Real Numbers

After deploying our Astro site, here's what we measured:

| Metric | Before (Next.js) | After (Astro) |
|--------|------------------|---------------|
| First Contentful Paint | 1.8s | 0.6s |
| Total Blocking Time | 320ms | 0ms |
| JS Bundle Size | 187KB | 12KB |
| Lighthouse Performance | 78 | 100 |

## When Astro Might Not Be Right

To be fair, Astro isn't the best choice for every project. If you're building a highly interactive SPA — think dashboards, real-time collaboration tools, or complex state management — a full-stack framework like Next.js or SvelteKit will serve you better.

But for content-driven sites, marketing pages, blogs, documentation, and portfolio sites? Astro is hard to beat.

## Our Stack

Here's the full stack we settled on for TopNotch:

- **Astro 6** — Static site generation with islands architecture
- **Tailwind CSS v4** — Utility-first styling with the new CSS-native config
- **TypeScript** — Strict mode for type safety
- **Content Collections** — Markdown with Zod-validated frontmatter
- **Cloudflare Pages** — Edge deployment with global CDN

## Conclusion

Choosing the right framework is about matching your tool to your problem. For an agency website that needs to be fast, SEO-friendly, and easy to maintain, Astro has been the perfect fit. We're shipping less JavaScript, loading faster, and spending more time on design and content instead of fighting framework complexity.

If you're considering Astro for your next project, [reach out](/en/contact) — we'd love to help.
