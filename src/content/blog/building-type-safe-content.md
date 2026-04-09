---
title: "Pipelines de contenido type-safe con Astro Collections"
slug: "building-type-safe-content"
author: "TopNotch Team"
date: 2026-03-14
tags: ["astro", "typescript", "tutorial"]
summary: "Aprende a usar las content collections de Astro con schemas Zod para construir un pipeline de contenido type-safe que detecta errores en build en lugar de producción."
coverImage: "/blog/type-safe-content.svg"
draft: false
---

## Por qué importa el type safety en el contenido

Todos hemos estado ahí: un post de blog sale a producción con una imagen de portada faltante, una fecha mal formateada o un tag que no coincide con ningún filtro existente. Estos bugs son sutiles, difíciles de detectar en revisión y vergonzosos en producción.

Las content collections de Astro resuelven esto validando cada campo del frontmatter contra un schema Zod en tiempo de build. Si algo no coincide, el build falla con un mensaje de error claro — no la experiencia de tus usuarios.

## Configurando una Content Collection

Así es como definimos la colección de blog para el sitio de TopNotch:

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

Cada campo está explícitamente tipado. `z.coerce.date()` maneja tanto el formato `2026-03-14` como `"2026-03-14T00:00:00Z"`. El campo `draft` tiene valor por defecto `false`, así que no necesitas especificarlo para posts publicados.

## Consultando colecciones

Obtener posts es directo y completamente tipado:

```typescript
import { getCollection } from "astro:content";

// Obtener todos los posts publicados, ordenados por fecha
const posts = (await getCollection("blog"))
  .filter((post) => !post.data.draft)
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
```

TypeScript conoce la forma exacta de `post.data` — el autocompletado funciona, los refactors se propagan y los errores tipográficos se detectan inmediatamente.

## Construyendo rutas dinámicas

El routing basado en archivos de Astro se combina con content collections para páginas dinámicas:

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

Cada post de blog obtiene su propia página generada estáticamente en tiempo de build. No se necesita runtime de servidor.

## Validando en el edge

El verdadero poder se muestra cuando algo sale mal. Intenta agregar un post sin un campo requerido:

```markdown
---
title: "Mi Nuevo Post"
# oops, olvidé slug, author, date y tags
---
```

El build falla inmediatamente con:

```
[ERROR] blog → my-new-post.md frontmatter does not match collection schema.
  "slug" Required
  "author" Required
  "date" Required
  "tags" Required
```

Esto es infinitamente mejor que descubrir el problema en producción cuando una página se renderiza con `undefined` disperso por todo el layout.

## Patrones avanzados

### Campos calculados

¿Necesitas tiempo de lectura? Calcúlalo desde el body al momento de la consulta:

```typescript
const posts = await getCollection("blog");
const postsWithReadingTime = posts.map((post) => ({
  ...post,
  readingTime: Math.ceil(post.body.split(/\s+/).length / 200),
}));
```

### Agregación de tags

Construye un índice de tags recopilando todos los tags únicos:

```typescript
const allTags = [...new Set(posts.flatMap((post) => post.data.tags))];
```

### Posts relacionados

Encuentra posts que comparten tags con el actual:

```typescript
const related = posts.filter(
  (p) =>
    p.data.slug !== currentPost.data.slug &&
    p.data.tags.some((tag) => currentPost.data.tags.includes(tag))
);
```

## Conclusión

Las content collections convierten tus archivos Markdown en una capa de datos type-safe. Combinado con la generación estática de Astro, obtienes un pipeline de contenido que es rápido de construir, imposible de romper silenciosamente y un placer para trabajar.

El blog de TopNotch que estás leyendo ahora mismo está construido exactamente así. Cada post es validado, cada ruta es generada estáticamente y el sitio entero se despliega en menos de 30 segundos.

¿Quieres aprender más sobre construir con Astro? Lee nuestro post sobre [por qué elegimos Astro](/blog/why-we-chose-astro) o [contáctanos](/contact) para discutir tu proyecto.
