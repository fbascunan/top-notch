---
title: "Building Type-Safe Content Pipelines with Astro Collections"
slug: "building-type-safe-content"
author: "TopNotch Team"
date: 2026-03-14
tags: ["astro", "typescript", "tutorial"]
summary: "Learn how to use Astro's content collections with Zod schemas to build a type-safe content pipeline that catches errors at build time instead of production."
coverImage: "/blog/type-safe-content.svg"
draft: false
locale: "en"
---

## Why Type Safety Matters for Content

We've all been there: a blog post goes live with a missing cover image, a malformed date, or a tag that doesn't match any existing filter. These bugs are subtle, hard to catch in review, and embarrassing in production.

Astro's content collections solve this by validating every piece of frontmatter against a Zod schema at build time. If something doesn't match, the build fails with a clear error message — not your users' experience.

## Setting Up a Content Collection

Here's how we define the blog collection for the TopNotch website:

```typescript
// src/content.config.ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    author: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    summary: z.string(),
    coverImage: z.string(),
    draft: z.boolean().default(false),
  }),
});
```

Every field is explicitly typed. The `z.coerce.date()` handles both `2026-03-14` and `"2026-03-14T00:00:00Z"` formats. The `draft` field defaults to `false`, so you don't need to specify it for published posts.

## Querying Collections

Fetching posts is straightforward and fully typed:

```typescript
import { getCollection } from "astro:content";

// Get all published posts, sorted by date
const posts = (await getCollection("blog"))
  .filter((post) => !post.data.draft)
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
```

TypeScript knows the exact shape of `post.data` — autocomplete works, refactors propagate, and typos are caught immediately.

## Building Dynamic Routes

Astro's file-based routing combines with content collections for dynamic pages:

```typescript
// src/pages/blog/[slug].astro
export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts
    .filter((post) => !post.data.draft)
    .map((post) => ({
      params: { slug: post.data.slug },
      props: { post },
    }));
}
```

Each blog post gets its own statically-generated page at build time. No server runtime needed.

## Conclusion

Content collections turn your Markdown files into a type-safe data layer. Combined with Astro's static generation, you get a content pipeline that's fast to build, impossible to break silently, and a joy to work with.

The TopNotch blog you're reading right now is built exactly this way. Every post is validated, every route is statically generated, and the entire site deploys in under 30 seconds.

Want to learn more about building with Astro? Check out our post on [why we chose Astro](/en/blog/why-we-chose-astro) or [get in touch](/en/contact) to discuss your project.
