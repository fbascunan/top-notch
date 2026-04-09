---
title: "Por qué elegimos Astro para nuestro sitio web"
slug: "why-we-chose-astro"
author: "TopNotch Team"
date: 2026-03-10
tags: ["astro", "web-development", "performance"]
summary: "Un análisis profundo de por qué elegimos Astro como framework para nuestro sitio — y cómo su enfoque static-first entrega rendimiento ultra rápido sin sacrificar experiencia de desarrollo."
coverImage: "/blog/why-we-chose-astro.svg"
draft: false
---

## El problema con los frameworks tradicionales

Cuando nos propusimos reconstruir el sitio de TopNotch, teníamos requisitos claros: carga de página ultrarrápida, excelente SEO y una gran experiencia de desarrollo. La mayoría de los frameworks JavaScript envían demasiado código del lado del cliente para lo que es esencialmente un sitio orientado a contenido.

Evaluamos Next.js, Nuxt y SvelteKit — todas herramientas excelentes — pero vienen con un costo de runtime JavaScript que se sentía innecesario para un sitio que es 95% contenido estático.

## Entra Astro

La filosofía de Astro resonó con nosotros inmediatamente: **no enviar JavaScript por defecto**. Cada página se renderiza como HTML estático en tiempo de build, y solo agregas interactividad del lado del cliente donde realmente la necesitas (la "arquitectura de islas").

### Lo que nos encanta

- **Content Collections** — Markdown/MDX con type safety y schemas Zod. Agregar un nuevo post de blog o entrada de portafolio es simplemente crear un archivo `.md`.
- **Rendimiento** — Nuestros puntajes de Lighthouse son consistentemente 95+ en todas las categorías. Sin costo de hidratación en páginas estáticas.
- **Flexibilidad** — ¿Necesitas un componente React para un formulario complejo? Agrégalo. ¿Necesitas Vue para una visualización de datos? Adelante. Astro no te encierra en un solo framework de UI.
- **Integración con Tailwind v4** — La nueva configuración CSS-first de Tailwind v4 se complementa perfectamente con el pipeline de build basado en Vite de Astro.

### Números reales

Después de desplegar nuestro sitio con Astro, esto es lo que medimos:

| Métrica | Antes (Next.js) | Después (Astro) |
|---------|-----------------|-----------------|
| First Contentful Paint | 1.8s | 0.6s |
| Total Blocking Time | 320ms | 0ms |
| Tamaño del bundle JS | 187KB | 12KB |
| Lighthouse Performance | 78 | 100 |

## Cuándo Astro podría no ser la opción correcta

Para ser justos, Astro no es la mejor opción para cada proyecto. Si estás construyendo una SPA altamente interactiva — piensa en dashboards, herramientas de colaboración en tiempo real o gestión de estado compleja — un framework full-stack como Next.js o SvelteKit te servirá mejor.

Pero para sitios orientados a contenido, páginas de marketing, blogs, documentación y portafolios, Astro es difícil de superar.

## Nuestro stack

Este es el stack completo que elegimos para TopNotch:

- **Astro 6** — Generación de sitios estáticos con arquitectura de islas
- **Tailwind CSS v4** — Estilos utility-first con la nueva configuración CSS nativa
- **TypeScript** — Modo estricto para type safety
- **Content Collections** — Markdown con frontmatter validado con Zod
- **Cloudflare Pages** — Despliegue en el edge con CDN global

## Conclusión

Elegir el framework correcto se trata de emparejar tu herramienta con tu problema. Para un sitio web de agencia que necesita ser rápido, amigable con SEO y fácil de mantener, Astro ha sido la elección perfecta. Estamos enviando menos JavaScript, cargando más rápido y dedicando más tiempo al diseño y contenido en lugar de pelear con la complejidad del framework.

Si estás considerando Astro para tu próximo proyecto, [contáctanos](/contact) — nos encantaría ayudarte.
