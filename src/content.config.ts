import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Custom generateId uses the file path (not frontmatter slug) to avoid
// duplicate IDs when ES and EN files share the same slug value.
const generateId: (opts: { entry: string }) => string = ({ entry }) =>
  entry.replace(/\.md$/, "");

const services = defineCollection({
  loader: glob({ base: "./src/content/services", pattern: "**/*.md", generateId }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string(),
    icon: z.string(),
    order: z.number().optional(),
    locale: z.enum(["es", "en"]).optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md", generateId }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    author: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    summary: z.string(),
    coverImage: z.string(),
    draft: z.boolean().default(false),
    locale: z.enum(["es", "en"]).optional(),
  }),
});

export const collections = { services, blog };
