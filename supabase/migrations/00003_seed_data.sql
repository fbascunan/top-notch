-- Seed data from MANIFEST.md and all subproject MILESTONES.md files
-- Generated 2026-04-09

------------------------------------------------------------
-- PROJECTS (from MANIFEST.md)
------------------------------------------------------------
INSERT INTO projects (name, folder, domain, status, priority, notes) VALUES
  ('ClimaTotal',        'climatotal',          'climatotal.netlify.app',  'Active',  1, 'HVAC institutional site — deployed, new improvement milestones incoming'),
  ('TopNotch',          'top-notch',           'topnotch.cl',             'Active',  2, 'Main agency website — remaining milestones need manual browser testing & credentials'),
  ('NotPreocupeit',     'not-preocupeit',      NULL,                      'Active',  3, 'Language-learning mobile app (Expo + Firebase + MiniMax) — Android first'),
  ('PAES o7',           'paes-o7',             NULL,                      'On Hold', 4, 'PAES exam practice webapp — Vite+ (React + TS), TanStack Router, Supabase, MiniMax AI tutor'),
  ('Notarías de Chile', 'notarías-de-chile',   NULL,                      'On Hold', 5, 'Civic PWA exposing notary costs — TanStack Start, Drizzle + SQLite, crowdsourced data');

------------------------------------------------------------
-- MILESTONES — ClimaTotal (project_id = 1)
------------------------------------------------------------
INSERT INTO milestones (project_id, number, title, description, status, blocking, completed_at) VALUES
  (1, 1,  'Project Scaffolding & Base Layout',         'Bootstrap Astro project with Tailwind CSS, configure Netlify deployment, create base layout with responsive navbar and footer.', 'Done', NULL, now()),
  (1, 2,  'Content Collections & CMS Setup',           'Set up Astro Content Collections, configure Decap CMS with Netlify Identity.', 'Done', 'M1', now()),
  (1, 3,  'Hero & Services Sections',                  'Build the Hero and Services sections using CMS content.', 'Done', 'M2', now()),
  (1, 4,  'Products & Gallery Sections',               'Build product catalog and work gallery with filtering and lightbox.', 'Done', 'M2', now()),
  (1, 5,  'Scheduling Form & WhatsApp Integration',    'Build the visit scheduling form with Netlify Forms and WhatsApp link.', 'Done', 'M1', now()),
  (1, 6,  'UI/UX Overhaul & Visual Identity',          'Redesign key sections to give the site a professional, cohesive personality.', 'Done', 'M3, M5', now()),
  (1, 7,  'Polish & SEO',                              'Final polish, meta tags, performance optimization.', 'Done', 'M6', now()),
  (1, 8,  'Deployment & CMS Auth',                     'Production deployment and CMS workflow validation.', 'Done', 'M7', now());

------------------------------------------------------------
-- MILESTONES — TopNotch (project_id = 2)
------------------------------------------------------------
INSERT INTO milestones (project_id, number, title, description, status, blocking, completed_at) VALUES
  (2, 1,  'Project Setup',                             'Initialize the repo, lock the stack, and get a working dev server with CI.', 'Done', NULL, now()),
  (2, 2,  'Branding & Design System',                  'Define the visual identity and build the component primitives everything else uses.', 'Done', 'M1', now()),
  (2, 3,  'Landing Page',                              'The first deployable version. Ship it and iterate.', 'Done', 'M2', now()),
  (2, 4,  'Services & Portfolio',                      'Detailed content pages using Astro content collections.', 'Done', 'M2', now()),
  (2, 5,  'Contact & Lead Capture',                    'Contact form with Formspree integration and spam prevention.', 'Done', 'M3', now()),
  (2, 6,  'Blog & Content',                            'Blog engine with content collection, pagination, RSS feed.', 'Done', 'M2', now()),
  (2, 7,  'SEO & Analytics',                           'SEO meta tags, sitemap, robots.txt, JSON-LD, and Umami analytics.', 'Done', 'M3', now()),
  (2, 8,  'Pre-Launch QA',                             'Pre-launch checklist — 404 page, favicons, accessibility fixes.', 'Done', 'M3-M7', now()),
  (2, 9,  'Internationalization (i18n)',                'Multi-language support. Spanish default, English secondary.', 'Done', 'M8', now()),
  (2, 10, 'Netlify Deployment',                        'Deploy to Netlify — site live at topnotch-cl.netlify.app.', 'Done', 'M9', now()),
  (2, 11, 'Supabase Setup & Project Database',         'Set up Supabase with Postgres schema for subprojects, milestones, and run history.', 'Planned', 'M10', NULL),
  (2, 12, 'Project Showcase & Dynamic Landing Pages',  'Display subprojects and milestone progress on the TopNotch site from Supabase.', 'Planned', 'M11', NULL);

------------------------------------------------------------
-- MILESTONES — NotPreocupeit (project_id = 3)
------------------------------------------------------------
INSERT INTO milestones (project_id, number, title, description, status, blocking, completed_at) VALUES
  (3, 1,  'Project Scaffolding & Base Setup',          'Set up Expo project with TypeScript, configure navigation, design system, Firebase.', 'Done', NULL, now()),
  (3, 2,  'Home Screen & Learning Path',               'Build dashboard with language selector, progress tracking, streak counter, learning path.', 'Done', 'M1', now()),
  (3, 3,  'Pronunciation Studio',                      'Core feature — phrase translation with TTS playback and speech-to-score analysis via MiniMax.', 'Done', 'M1', now()),
  (3, 4,  'AI Visual Dictionary',                      'Text-to-image flashcard generator using MiniMax image generation.', 'Done', 'M1', now()),
  (3, 5,  'Profile & Gamification',                    'Trophy room with XP tracking, streak display, achievement unlocks.', 'Done', 'M2, M3', now()),
  (3, 6,  'Polish, Testing & Release',                 'Final quality pass — performance, accessibility, edge cases, Android release build.', 'Done', 'M2, M3, M4, M5', now());

------------------------------------------------------------
-- MILESTONES — PAES o7 (project_id = 4)
------------------------------------------------------------
INSERT INTO milestones (project_id, number, title, description, status, blocking, completed_at) VALUES
  (4, 1,  'Project Scaffolding & Base Setup',          'Scaffold Vite+React, TypeScript, TanStack Router, Tailwind, Supabase.', 'Done', NULL, now()),
  (4, 2,  'Question Bank & Data Layer',                'Define question schema, create Supabase tables, seed initial questions.', 'Done', 'M1', now()),
  (4, 3,  'Quiz Engine (Chill Mode)',                  'Build core quiz flow: category selection, full-screen questions, answer selection.', 'Done', 'M2', now()),
  (4, 4,  'Diehard Mode (Timed Exam)',                 'Add timed exam mode with timer, question count, final score screen.', 'Done', 'M3', now()),
  (4, 5,  'AI Tutor',                                  'Integrate MiniMax to explain wrong answers in context.', 'Done', 'M2', now()),
  (4, 6,  'Authentication & User Progress',            'Add Google login and persist user progress/scores.', 'Done', 'M1', now()),
  (4, 7,  'Polish, Testing & Deployment',              'Final QA, accessibility, performance, deploy to Netlify.', 'Done', 'M3, M4, M5, M6', now()),
  (4, 8,  'Header Cleanup & UI Fix',                   'Remove navigation links, keep logo + user section only.', 'Done', NULL, now()),
  (4, 9,  'Intermediate Mode',                         'Add "Modo Simple" — 10 questions, proportional time limit.', 'Done', 'M4', now()),
  (4, 10, 'Pause & Resume Exam',                       'Allow pausing timed exams, save state to Supabase, resume later.', 'Done', 'M6, M9', now()),
  (4, 11, 'User Profile View',                         'Add profile page with user info, stats, recent exam history.', 'Done', 'M6', now()),
  (4, 12, 'AI Tutor Personality',                      'Refine tutor — concise, encouraging, direct tone.', 'Done', 'M5', now()),
  (4, 13, 'Interactive AI Tutor Chat',                  'Upgrade tutor to interactive chat with follow-up questions.', 'Done', 'M12', now()),
  (4, 14, 'Fix Tutor "Missing Fields" Error',          'Fix request payload construction for tutor chat follow-ups.', 'Done', 'M13', now()),
  (4, 15, 'Rename Intermediate → Modo Simple',         'Rename "Intermedio" to "Modo Simple" across entire app.', 'Done', 'M9', now()),
  (4, 16, 'Tutor Full-Screen Modal',                   'Make tutor a full-screen modal overlay, disable quiz shortcuts while open.', 'Done', 'M14', now()),
  (4, 17, 'Elevate Tutor to Feature',                  'Make AI tutor always-accessible from any quiz point.', 'Done', 'M16', now()),
  (4, 18, 'Reposition Tutor & Restyle',                'Move tutor from FAB to inline above question, use primary palette.', 'Done', 'M17', now()),
  (4, 19, 'Pre-authored Clues & Context-Aware Followups', 'Add tutor_clue field per question, context-aware AI follow-ups.', 'Done', 'M18', now()),
  (4, 20, 'Persist Tutor Chat in Session',             'Keep tutor chat in-memory per question, persist for logged-in users.', 'Done', 'M19', now()),
  (4, 21, 'Resume Previous Tutor Threads',             'Logged-in users can resume previous tutor conversations.', 'Done', 'M20', now()),
  (4, 22, 'Enter Key Sends Messages',                  'Make Enter key send tutor chat messages.', 'Done', 'M18', now()),
  (4, 23, 'Fix Modo Simple Label',                     'Fix "Modo Simple" displaying wrong label in quiz UI.', 'Done', 'M15', now()),
  (4, 24, 'Keep Chat Input Editable',                  'Keep tutor chat input editable while AI responds.', 'Done', 'M18', now()),
  (4, 25, 'Tutor Opens Regardless of Answer',          'Tutor shows same behavior regardless of answer state.', 'Done', 'M19, M20', now()),
  (4, 26, 'Fix Enter Key Not Sending',                 'Fix event propagation so Enter sends messages in tutor chat.', 'Done', 'M16', now()),
  (4, 27, 'Tutor Personalization (Socratic)',           'Rewrite tutor as Socratic guide — no answer reveal, concise, responsive.', 'Done', 'M12', now()),
  (4, 28, 'Raise Chat Limit 5→50',                     'Increase tutor exchange limit from 5 to 50 conversations.', 'Done', 'M13', now()),
  (4, 29, 'Show Chat Input Immediately',               'Make chat input visible and focused when tutor modal opens.', 'Done', 'M16', now()),
  (4, 30, 'Free Chat Mode from Home',                  'Open tutor from Home page in free-chat mode (no question context).', 'Done', 'M17', now());

------------------------------------------------------------
-- MILESTONES — Notarías de Chile (project_id = 5)
------------------------------------------------------------
INSERT INTO milestones (project_id, number, title, description, status, blocking, completed_at) VALUES
  (5, 1,  'Scaffolding & Base Setup',                  'Scaffold TanStack Start project, Tailwind, PWA, Drizzle+SQLite, base layout.', 'Done', NULL, now()),
  (5, 2,  'Notary Listing & Filtering',                'Core feature — display notaries with sortable/filterable list by cost, location, ratings.', 'Done', 'M1', now()),
  (5, 3,  'Map Integration',                           'Google Maps embed showing notary locations with clickable markers.', 'Done', 'M1', now()),
  (5, 4,  'User Cost Reports',                         'Allow users to report charged costs, building crowdsourced database.', 'Done', 'M2', now()),
  (5, 5,  'Notary Detail Page',                        'Dedicated page per notary with full info, procedures, cost history, user reports.', 'Done', 'M2', now()),
  (5, 6,  'Ads, Visual Identity & UX',                 'Polish "exposing abuse" brand identity, integrate non-intrusive ads.', 'Done', 'M5', now()),
  (5, 7,  'Testing, SEO & Deployment',                 'Final testing, SEO optimization, production deployment to Netlify.', 'Done', 'M6', now());

------------------------------------------------------------
-- MILESTONE_TASKS — representative tasks per milestone
-- Including tasks for TopNotch milestones (most relevant)
------------------------------------------------------------

-- TopNotch M11 tasks (current milestone)
INSERT INTO milestone_tasks (milestone_id, description, done) VALUES
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 11), 'Install @supabase/supabase-js as project dependency', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 11), 'Create Supabase client config with env var fallback', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 11), 'Design and write SQL migration for core schema', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 11), 'Add RLS policies (all tables read/write scoped to authenticated service role)', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 11), 'Write seed migration with current data from MANIFEST.md and all subproject MILESTONES.md files', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 11), 'Create sync utility (src/lib/milestones-sync.ts)', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 11), 'Verify: seed data loads, queries return correct projects/milestones, RLS policies work', false);

-- TopNotch M12 tasks
INSERT INTO milestone_tasks (milestone_id, description, done) VALUES
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 12), 'Create /projects index page from Supabase projects table', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 12), 'Build ProjectCard.astro component', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 12), 'Create dynamic /projects/[slug] pages', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 12), 'Build MilestoneTimeline.astro component', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 12), 'Add Supabase data fetching at build time', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 12), 'Add Projects link to Navbar.astro', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 12), 'Responsive layout for project grid and landing pages', false),
  ((SELECT id FROM milestones WHERE project_id = 2 AND number = 12), 'Fallback to seed/static data when Supabase env vars are missing', false);
