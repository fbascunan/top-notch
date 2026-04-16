/**
 * Local seed data — used as fallback when Supabase is not configured.
 * Mirrors the data in supabase/migrations/00003_seed_data.sql.
 */

import type { ProjectStatus, MilestoneStatus, RunStatus, HumanActionStatus } from "./database.types";

export interface SeedProject {
  id: number;
  name: string;
  folder: string;
  domain: string | null;
  status: ProjectStatus;
  priority: number;
  notes: string | null;
}

export interface SeedMilestone {
  id: number;
  project_id: number;
  number: number;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  blocking: string | null;
}

export interface SeedTask {
  id: number;
  milestone_id: number;
  description: string;
  done: boolean;
}

export interface SeedRunHistory {
  id: number;
  project_id: number;
  milestone_id: number;
  status: RunStatus;
  triggered_by: string | null;
  started_at: string;
  finished_at: string | null;
  logs: string | null;
  commit_sha: string | null;
  error: string | null;
  created_at: string;
}

export const seedProjects: SeedProject[] = [
  { id: 1, name: "ClimaTotal",        folder: "climatotal",        domain: "climatotal.netlify.app", status: "Active",  priority: 1, notes: "HVAC institutional site — deployed, new improvement milestones incoming" },
  { id: 2, name: "TopNotch",          folder: "top-notch",         domain: "topnotch.cl",            status: "Active",  priority: 2, notes: "Main agency website — remaining milestones need manual browser testing & credentials" },
  { id: 3, name: "NotPreocupeit",     folder: "not-preocupeit",    domain: null,                     status: "Active",  priority: 3, notes: "Language-learning mobile app (Expo + Firebase + MiniMax) — Android first" },
  { id: 4, name: "PAES o7",           folder: "paes-o7",           domain: null,                     status: "On Hold", priority: 4, notes: "PAES exam practice webapp — Vite+ (React + TS), TanStack Router, Supabase, MiniMax AI tutor" },
  { id: 5, name: "Notarías de Chile", folder: "notarías-de-chile", domain: null,                     status: "On Hold", priority: 5, notes: "Civic PWA exposing notary costs — TanStack Start, Drizzle + SQLite, crowdsourced data" },
];

export const seedMilestones: SeedMilestone[] = [
  // ClimaTotal
  { id: 1,  project_id: 1, number: 1,  title: "Project Scaffolding & Base Layout",      description: "Bootstrap Astro project with Tailwind CSS, configure Netlify deployment, create base layout.", status: "Done", blocking: null },
  { id: 2,  project_id: 1, number: 2,  title: "Content Collections & CMS Setup",        description: "Set up Astro Content Collections, configure Decap CMS with Netlify Identity.",                  status: "Done", blocking: "M1" },
  { id: 3,  project_id: 1, number: 3,  title: "Hero & Services Sections",               description: "Build the Hero and Services sections using CMS content.",                                       status: "Done", blocking: "M2" },
  { id: 4,  project_id: 1, number: 4,  title: "Products & Gallery Sections",             description: "Build product catalog and work gallery with filtering and lightbox.",                            status: "Done", blocking: "M2" },
  { id: 5,  project_id: 1, number: 5,  title: "Scheduling Form & WhatsApp Integration", description: "Build the visit scheduling form with Netlify Forms and WhatsApp link.",                          status: "Done", blocking: "M1" },
  { id: 6,  project_id: 1, number: 6,  title: "UI/UX Overhaul & Visual Identity",       description: "Redesign key sections for professional, cohesive personality.",                                  status: "Done", blocking: "M3, M5" },
  { id: 7,  project_id: 1, number: 7,  title: "Polish & SEO",                           description: "Final polish, meta tags, performance optimization.",                                             status: "Done", blocking: "M6" },
  { id: 8,  project_id: 1, number: 8,  title: "Deployment & CMS Auth",                  description: "Production deployment and CMS workflow validation.",                                              status: "Done", blocking: "M7" },

  // TopNotch
  { id: 9,  project_id: 2, number: 1,  title: "Project Setup",                          description: "Initialize the repo, lock the stack, and get a working dev server with CI.",                    status: "Done", blocking: null },
  { id: 10, project_id: 2, number: 2,  title: "Branding & Design System",               description: "Define the visual identity and build the component primitives.",                                 status: "Done", blocking: "M1" },
  { id: 11, project_id: 2, number: 3,  title: "Landing Page",                           description: "The first deployable version.",                                                                  status: "Done", blocking: "M2" },
  { id: 12, project_id: 2, number: 4,  title: "Services & Portfolio",                   description: "Detailed content pages using Astro content collections.",                                        status: "Done", blocking: "M2" },
  { id: 13, project_id: 2, number: 5,  title: "Contact & Lead Capture",                 description: "Contact form with Formspree integration and spam prevention.",                                    status: "Done", blocking: "M3" },
  { id: 14, project_id: 2, number: 6,  title: "Blog & Content",                         description: "Blog engine with content collection, pagination, RSS feed.",                                     status: "Done", blocking: "M2" },
  { id: 15, project_id: 2, number: 7,  title: "SEO & Analytics",                        description: "SEO meta tags, sitemap, robots.txt, JSON-LD, and Umami analytics.",                              status: "Done", blocking: "M3" },
  { id: 16, project_id: 2, number: 8,  title: "Pre-Launch QA",                          description: "Pre-launch checklist — 404 page, favicons, accessibility fixes.",                                status: "Done", blocking: "M3-M7" },
  { id: 17, project_id: 2, number: 9,  title: "Internationalization (i18n)",             description: "Multi-language support. Spanish default, English secondary.",                                     status: "Done", blocking: "M8" },
  { id: 18, project_id: 2, number: 10, title: "Netlify Deployment",                     description: "Deploy to Netlify — site live at topnotch-cl.netlify.app.",                                      status: "Done", blocking: "M9" },
  { id: 19, project_id: 2, number: 11, title: "Supabase Setup & Project Database",      description: "Set up Supabase with Postgres schema for subprojects, milestones, and run history.",              status: "Done", blocking: "M10" },
  { id: 20, project_id: 2, number: 12, title: "Project Showcase & Dynamic Landing Pages", description: "Display subprojects and milestone progress on the TopNotch site from Supabase.",               status: "Done", blocking: "M11" },

  // NotPreocupeit
  { id: 21, project_id: 3, number: 1,  title: "Project Scaffolding & Base Setup",       description: "Set up Expo project with TypeScript, configure navigation, design system, Firebase.",            status: "Done", blocking: null },
  { id: 22, project_id: 3, number: 2,  title: "Home Screen & Learning Path",            description: "Build dashboard with language selector, progress tracking, streak counter.",                     status: "Done", blocking: "M1" },
  { id: 23, project_id: 3, number: 3,  title: "Pronunciation Studio",                   description: "Core feature — phrase translation with TTS playback and speech-to-score analysis.",               status: "Done", blocking: "M1" },
  { id: 24, project_id: 3, number: 4,  title: "AI Visual Dictionary",                   description: "Text-to-image flashcard generator using MiniMax image generation.",                              status: "Done", blocking: "M1" },
  { id: 25, project_id: 3, number: 5,  title: "Profile & Gamification",                 description: "Trophy room with XP tracking, streak display, achievement unlocks.",                             status: "Done", blocking: "M2, M3" },
  { id: 26, project_id: 3, number: 6,  title: "Polish, Testing & Release",              description: "Final quality pass — performance, accessibility, edge cases, Android release build.",              status: "Done", blocking: "M2, M3, M4, M5" },

  // PAES o7
  { id: 27, project_id: 4, number: 1,  title: "Project Scaffolding & Base Setup",       description: "Scaffold Vite+React, TypeScript, TanStack Router, Tailwind, Supabase.",                         status: "Done", blocking: null },
  { id: 28, project_id: 4, number: 2,  title: "Question Bank & Data Layer",             description: "Define question schema, create Supabase tables, seed initial questions.",                        status: "Done", blocking: "M1" },
  { id: 29, project_id: 4, number: 3,  title: "Quiz Engine (Chill Mode)",               description: "Build core quiz flow: category selection, full-screen questions, answer selection.",              status: "Done", blocking: "M2" },
  { id: 30, project_id: 4, number: 4,  title: "Diehard Mode (Timed Exam)",              description: "Add timed exam mode with timer, question count, final score screen.",                            status: "Done", blocking: "M3" },
  { id: 31, project_id: 4, number: 5,  title: "AI Tutor",                               description: "Integrate MiniMax to explain wrong answers in context.",                                         status: "Done", blocking: "M2" },
  { id: 32, project_id: 4, number: 6,  title: "Authentication & User Progress",         description: "Add Google login and persist user progress/scores.",                                             status: "Done", blocking: "M1" },
  { id: 33, project_id: 4, number: 7,  title: "Polish, Testing & Deployment",           description: "Final QA, accessibility, performance, deploy to Netlify.",                                       status: "Done", blocking: "M3, M4, M5, M6" },
  { id: 34, project_id: 4, number: 8,  title: "Header Cleanup & UI Fix",               description: "Remove navigation links, keep logo + user section only.",                                        status: "Done", blocking: null },
  { id: 35, project_id: 4, number: 9,  title: "Intermediate Mode",                      description: "Add Modo Simple — 10 questions, proportional time limit.",                                      status: "Done", blocking: "M4" },
  { id: 36, project_id: 4, number: 10, title: "Pause & Resume Exam",                    description: "Allow pausing timed exams, save state to Supabase, resume later.",                               status: "Done", blocking: "M6, M9" },
  { id: 37, project_id: 4, number: 11, title: "User Profile View",                      description: "Add profile page with user info, stats, recent exam history.",                                   status: "Done", blocking: "M6" },
  { id: 38, project_id: 4, number: 12, title: "AI Tutor Personality",                   description: "Refine tutor — concise, encouraging, direct tone.",                                              status: "Done", blocking: "M5" },
  { id: 39, project_id: 4, number: 13, title: "Interactive AI Tutor Chat",              description: "Upgrade tutor to interactive chat with follow-up questions.",                                     status: "Done", blocking: "M12" },
  { id: 40, project_id: 4, number: 14, title: "Fix Tutor Missing Fields Error",         description: "Fix request payload construction for tutor chat follow-ups.",                                    status: "Done", blocking: "M13" },
  { id: 41, project_id: 4, number: 15, title: "Rename Intermediate → Modo Simple",      description: "Rename Intermedio to Modo Simple across entire app.",                                            status: "Done", blocking: "M9" },
  { id: 42, project_id: 4, number: 16, title: "Tutor Full-Screen Modal",                description: "Make tutor a full-screen modal overlay, disable quiz shortcuts while open.",                      status: "Done", blocking: "M14" },
  { id: 43, project_id: 4, number: 17, title: "Elevate Tutor to Feature",               description: "Make AI tutor always-accessible from any quiz point.",                                           status: "Done", blocking: "M16" },
  { id: 44, project_id: 4, number: 18, title: "Reposition Tutor & Restyle",             description: "Move tutor from FAB to inline above question, use primary palette.",                              status: "Done", blocking: "M17" },
  { id: 45, project_id: 4, number: 19, title: "Pre-authored Clues & Context-Aware Followups", description: "Add tutor_clue field per question, context-aware AI follow-ups.",                           status: "Done", blocking: "M18" },
  { id: 46, project_id: 4, number: 20, title: "Persist Tutor Chat in Session",          description: "Keep tutor chat in-memory per question, persist for logged-in users.",                            status: "Done", blocking: "M19" },
  { id: 47, project_id: 4, number: 21, title: "Resume Previous Tutor Threads",          description: "Logged-in users can resume previous tutor conversations.",                                       status: "Done", blocking: "M20" },
  { id: 48, project_id: 4, number: 22, title: "Enter Key Sends Messages",               description: "Make Enter key send tutor chat messages.",                                                       status: "Done", blocking: "M18" },
  { id: 49, project_id: 4, number: 23, title: "Fix Modo Simple Label",                  description: "Fix Modo Simple displaying wrong label in quiz UI.",                                             status: "Done", blocking: "M15" },
  { id: 50, project_id: 4, number: 24, title: "Keep Chat Input Editable",               description: "Keep tutor chat input editable while AI responds.",                                              status: "Done", blocking: "M18" },
  { id: 51, project_id: 4, number: 25, title: "Tutor Opens Regardless of Answer",       description: "Tutor shows same behavior regardless of answer state.",                                          status: "Done", blocking: "M19, M20" },
  { id: 52, project_id: 4, number: 26, title: "Fix Enter Key Not Sending",              description: "Fix event propagation so Enter sends messages in tutor chat.",                                    status: "Done", blocking: "M16" },
  { id: 53, project_id: 4, number: 27, title: "Tutor Personalization (Socratic)",        description: "Rewrite tutor as Socratic guide — no answer reveal, concise, responsive.",                       status: "Done", blocking: "M12" },
  { id: 54, project_id: 4, number: 28, title: "Raise Chat Limit 5→50",                  description: "Increase tutor exchange limit from 5 to 50 conversations.",                                      status: "Done", blocking: "M13" },
  { id: 55, project_id: 4, number: 29, title: "Show Chat Input Immediately",            description: "Make chat input visible and focused when tutor modal opens.",                                     status: "Done", blocking: "M16" },
  { id: 56, project_id: 4, number: 30, title: "Free Chat Mode from Home",               description: "Open tutor from Home page in free-chat mode (no question context).",                              status: "Done", blocking: "M17" },

  // Notarías de Chile
  { id: 57, project_id: 5, number: 1,  title: "Scaffolding & Base Setup",               description: "Scaffold TanStack Start project, Tailwind, PWA, Drizzle+SQLite, base layout.",                  status: "Done", blocking: null },
  { id: 58, project_id: 5, number: 2,  title: "Notary Listing & Filtering",             description: "Core feature — display notaries with sortable/filterable list.",                                  status: "Done", blocking: "M1" },
  { id: 59, project_id: 5, number: 3,  title: "Map Integration",                        description: "Google Maps embed showing notary locations with clickable markers.",                              status: "Done", blocking: "M1" },
  { id: 60, project_id: 5, number: 4,  title: "User Cost Reports",                      description: "Allow users to report charged costs, building crowdsourced database.",                            status: "Done", blocking: "M2" },
  { id: 61, project_id: 5, number: 5,  title: "Notary Detail Page",                     description: "Dedicated page per notary with full info, procedures, cost history.",                             status: "Done", blocking: "M2" },
  { id: 62, project_id: 5, number: 6,  title: "Ads, Visual Identity & UX",              description: "Polish brand identity, integrate non-intrusive ads.",                                             status: "Done", blocking: "M5" },
  { id: 63, project_id: 5, number: 7,  title: "Testing, SEO & Deployment",              description: "Final testing, SEO optimization, production deployment to Netlify.",                              status: "Done", blocking: "M6" },
];

export interface SeedHumanAction {
  id: number;
  project_id: number;
  milestone: string;
  description: string;
  is_blocker: boolean;
  status: HumanActionStatus;
  completed_at: string | null;
}

export const seedHumanActions: SeedHumanAction[] = [
  { id: 1,  project_id: 2, milestone: "M10", description: "Formspree — Create account at formspree.io → set form ID in src/components/ContactForm.astro (replace {YOUR_FORM_ID})", is_blocker: false, status: "pending", completed_at: null },
  { id: 2,  project_id: 2, milestone: "M10", description: "Umami — Create account at cloud.umami.is → set website ID in src/layouts/BaseLayout.astro (replace UMAMI_WEBSITE_ID)", is_blocker: false, status: "pending", completed_at: null },
  { id: 3,  project_id: 2, milestone: "M14", description: "Google Search Console — Set up for topnotch.cl", is_blocker: false, status: "pending", completed_at: null },
  { id: 4,  project_id: 2, milestone: "M14", description: "DNS — Configure topnotch.cl domain to point to Netlify (currently live at topnotch-cl.netlify.app)", is_blocker: false, status: "pending", completed_at: null },
  { id: 5,  project_id: 2, milestone: "M14", description: "Responsive QA — Spot-check at 375px, 768px, 1280px, 1920px", is_blocker: false, status: "pending", completed_at: null },
  { id: 6,  project_id: 2, milestone: "M19", description: "Apply migration — Run supabase db push to apply 00007_run_history.sql", is_blocker: true, status: "done", completed_at: "2026-04-14T00:00:00Z" },
  { id: 7,  project_id: 2, milestone: "M20", description: "Anthropic API Key — (OBSOLETE: replaced by Claude Code Routines in M24)", is_blocker: false, status: "done", completed_at: "2026-04-15T00:00:00Z" },
  { id: 8,  project_id: 2, milestone: "M20", description: "First test run — (OBSOLETE: old GitHub Actions workflow removed in M27)", is_blocker: false, status: "done", completed_at: "2026-04-15T00:00:00Z" },
  { id: 9,  project_id: 2, milestone: "M21", description: "Supabase Secrets in GitHub — Still needed by routine-webhook.yml", is_blocker: false, status: "done", completed_at: "2026-04-14T00:00:00Z" },
  { id: 10, project_id: 2, milestone: "M21", description: "Apply migration — Run supabase db push to apply 00007_run_history.sql (from M19)", is_blocker: true, status: "done", completed_at: "2026-04-14T00:00:00Z" },
  { id: 11, project_id: 2, milestone: "M22", description: "GitHub token for website — (OBSOLETE: replaced by ROUTINE_BEARER_TOKEN in M24)", is_blocker: false, status: "done", completed_at: "2026-04-15T00:00:00Z" },
];

export const seedRunHistory: SeedRunHistory[] = [
  {
    id: 1,
    project_id: 2,
    milestone_id: 9,
    status: "completed",
    triggered_by: null,
    started_at: "2026-03-15T01:19:00Z",
    finished_at: "2026-03-15T01:25:00Z",
    logs: "Scaffolded Astro 6 project with TS strict, Tailwind CSS v4.",
    commit_sha: null,
    error: null,
    created_at: "2026-03-15T01:19:00Z",
  },
  {
    id: 2,
    project_id: 2,
    milestone_id: 10,
    status: "completed",
    triggered_by: null,
    started_at: "2026-03-15T02:00:00Z",
    finished_at: "2026-03-15T02:08:00Z",
    logs: "Built full design system — design tokens, components, /design page.",
    commit_sha: null,
    error: null,
    created_at: "2026-03-15T02:00:00Z",
  },
  {
    id: 3,
    project_id: 2,
    milestone_id: 9,
    status: "failed",
    triggered_by: null,
    started_at: "2026-03-15T01:00:00Z",
    finished_at: "2026-03-15T01:05:00Z",
    logs: null,
    commit_sha: null,
    error: "Could not extract milestone content",
    created_at: "2026-03-15T01:00:00Z",
  },
];
