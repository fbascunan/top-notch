import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const services = defineCollection({
  loader: glob({ base: "./src/content/services", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string(),
    icon: z.string(),
    order: z.number().optional(),
  }),
});

const portfolio = defineCollection({
  loader: glob({ base: "./src/content/portfolio", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    client: z.string(),
    summary: z.string(),
    techStack: z.array(z.string()),
    date: z.coerce.date(),
    featured: z.boolean().default(false),
    color: z.string().optional(),
  }),
});

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

export const collections = { services, portfolio, blog };
