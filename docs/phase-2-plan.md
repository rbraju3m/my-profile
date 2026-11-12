# Phase 2: Website Plan (revision 2)

Prepared 12 Nov 2026. Builds on `docs/phase-1-discovery.md`. **Nothing has been built yet.** Building starts after you approve this plan.

**Changes in revision 2:**
- Laravel on your own VPS, as one app.
- A custom React + Mantine admin panel.
- Domain `rashedulraju.dev`.
- Vercel is dropped.

---

## 0. Your decisions, and how the plan uses them

| # | Decision | How the plan uses it |
|---|---|---|
| 1 | Show client names | Clients are named. Each project also has a **"show client name"** switch in the admin. |
| 2 | Senior Software Engineer | Used in the hero, page titles, structured data and footer. |
| 3 | Unverified claims: my call | The ERP line ("546 files / 156 entities / 41%") is left off the site. Every project has a **status badge** (*Live · Built · In development · Research*), starting at the status I could verify and editable by you. |
| 4 | Orbito is company work | Listed under Right Brain Solution. |
| 5 | Show all contact details | Email, phone, WhatsApp, LinkedIn, GitHub and location. The email and phone are assembled in the browser to keep simple spam bots from scraping them. |
| 6 | CV: my call | The CV is a file you upload in the admin, and `/cv` always serves the latest one. Fix the PDF first (§11). |
| 7 | Open to everything | An availability badge, editable in the admin. |
| 8 | **Laravel, as one app on a VPS** | §1 |
| 9 | Screenshots: my call | Local runs with demo data only; diagrams where there is no usable screen (§7). |
| 10 | **Domain `rashedulraju.dev`** | `.dev` requires HTTPS in all browsers, so SSL from day one (Let's Encrypt through Forge or Coolify). |
| 11 | **Custom React + Mantine admin** | §5 |
| ★ | Everything editable in the backend | No content is hard-coded. All text, projects, skills, diagrams, images, SEO and the CV come from the database. |
| – | Accent colour | You didn't answer this one, so I'll use **signal teal** for now. It's one token, easy to change later. |

---

## 1. Architecture

```
rashedulraju.dev ─► Cloudflare DNS (optional proxy) ─► VPS (Ubuntu 24.04)
   Nginx ─► PHP-FPM 8.4 ─► Laravel 13
                             ├─ Public site      Inertia 3 + React 19, server-side rendered (Node SSR process)
                             │                   and cached as full HTML; the cache is cleared when content changes
                             ├─ /admin           Inertia 3 + React 19 + Mantine 9 (its own JS/CSS bundle, never sent to visitors)
                             ├─ MySQL 8          all content, contact messages, admin user
                             ├─ Queue worker     sends contact emails, makes image versions, clears the cache  (Supervisor)
                             ├─ Scheduler        daily backup to Cloudflare R2, sitemap refresh
                             └─ storage/app/public   uploaded images and the CV (backed up to R2)
```

This is the same stack you already use in JonoJabab (Laravel 13, Inertia 3, Fortify, Mantine 9, React 19, SSR), so the conventions will feel familiar.

**Why it's one app:**
- One codebase, one deploy.
- No CORS and no webhooks between separate services.
- The site itself shows Laravel work: queues, cache invalidation, Fortify two-factor login, validation, tests.

**Two bundles, kept apart:**
- **Public site** (`resources/js/site/`): Tailwind 4 only, small, server-rendered.
- **Admin** (`resources/js/admin/`): Mantine 9.
- They use separate Vite entry points and root views, so visitors never download Mantine.

### Stack

| Layer | Choice |
|---|---|
| Backend | PHP 8.4, Laravel 13, Fortify (login + TOTP two-factor), Eloquent, FormRequests, Actions/Services, Observers |
| Public frontend | Inertia 3 SSR, React 19, TypeScript, Tailwind CSS 4, Motion (lazy-loaded), lucide-react |
| Admin | React 19, TypeScript, Mantine 9 (core, form, dates, notifications, dropzone, tiptap), @dnd-kit for drag-and-drop ordering, zod |
| Media | `spatie/laravel-medialibrary`: responsive WebP/AVIF versions created in a queue |
| Cache | `spatie/laravel-responsecache` for full-page HTML; cleared by model observers |
| Spam protection | Cloudflare Turnstile + honeypot field + minimum fill time + `RateLimiter` |
| Email | Queued Mailable through Resend SMTP, sent from the verified `rashedulraju.dev` domain |
| SEO | `spatie/laravel-sitemap`, Inertia `<Head>`, JSON-LD builder, Open Graph images (uploaded, or generated from a template with Intervention Image) |
| Backups | `spatie/laravel-backup` (database + uploads) to Cloudflare R2, daily, 30 days kept |
| Quality | Pest, Larastan level 6, Pint, Vitest, ESLint, Playwright, Lighthouse CI, GitHub Actions |

---

## 2. Sitemap

```
/                        Home: #hero #about #skills #experience #projects #engineering #architecture #contact
/projects                all projects: search, technology filter, category filter
/projects/{slug}         a case-study page for each project
/cv                      downloads the current CV PDF
/sitemap.xml  /robots.txt
/admin/login             Fortify login + 2FA (no-index)
/admin/*                 admin panel (§5)
```

- Each case study has its own URL, so it can be shared, ranked in search and previewed on social media.
- On the home page, clicking a project card opens it in an overlay (an Inertia modal), but the URL changes to the real page. A direct visit or refresh loads the full page.

---

## 3. UI and UX direction

- **Style:** precise and calm, in the style of Linear and Vercel. Plenty of space, a 12-column grid, thin 1px borders, cards with a soft glow on hover, one accent colour.
- **Hero: a "system map" built from your real work.** A slowly animating SVG of your actual data flows:
  - *Ultrasound → Gateway → HMS → Report*
  - *Invoice → OCR → Review → Purchase*
  - *WordPress → API → Build queue → App Store*

  Each label links to its case study.
- **Motion:**
  - Sections fade and rise 8px as they scroll in.
  - The navigation underline follows the active section.
  - Cards tilt slightly on hover.
  - Diagram lines animate their flow once.
  - All of this is turned off when `prefers-reduced-motion` is set.
- **Mobile first:**
  - The menu opens as a full-height sheet.
  - Diagrams become vertical step lists.
  - Filters become horizontal scrolling chips.
  - Touch targets are at least 44px.

---

## 4. Design system (public site)

### Colours (CSS variables, light and dark sets)

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#0A0B0D` | `#FAFAF9` | Page background |
| `--surface` | `#111317` | `#FFFFFF` | Cards |
| `--surface-2` | `#171A1F` | `#F4F4F5` | Raised and hover surfaces |
| `--border` | `#23272E` | `#E4E4E7` | 1px lines |
| `--text` | `#EDEEF0` | `#0B0D10` | Main text |
| `--muted` | `#9BA1A9` | `#5B616B` | Secondary text |
| `--accent` | `#5EEAD4` | `#0F766E` | Links, focus rings, active states ("signal teal") |
| `--accent-glow` | teal at 12% | teal at 8% | Subtle gradients |

Status badge colours:

| Status | Colour |
|---|---|
| Live | `#22C55E` |
| Built | `#60A5FA` |
| In development | `#F59E0B` |
| Research | `#A78BFA` |

Every text and background pair will be checked against WCAG AA (contrast of at least 4.5:1).

### Theme handling
- A small script in `<head>` reads `localStorage` and the system setting before the page draws, so the wrong theme never flashes.
- There is a light/dark toggle, and the choice is remembered.
- The admin uses Mantine's colour scheme, built from the same tokens.

### Typography
- **Geist Sans / Geist Mono**, served from the site itself as WOFF2 and preloaded.

| Element | Size |
|---|---|
| Display | 56–72px |
| H2 | 32–40px |
| H3 | 20–24px |
| Body | 16–17px |

- Line length is capped at about 68 characters.

### Spacing and shapes
- **Spacing:** 4px base scale. Sections are separated by 96–128px on desktop and 64px on mobile.
- **Corners:** 8px for inputs, 12px for cards, 16px for large panels.
- **Depth:** borders and gentle gradients, not shadows.

### Components
`Button` · `Badge` · `Tag` · `Card` · `Section` · `Container` · `Tabs` · `Sheet/Modal` · `Input` · `Textarea` · `Toast` · `ThemeToggle` · `Tooltip`.

---

## 5. Database and admin panel

### Tables

| Table | Key columns |
|---|---|
| `settings` | Key/value JSON groups: `site` (name, title, bio, location, email, phone, WhatsApp, socials, availability), `seo` (title template, description, OG image), `hero`, `about`, `nav`, `footer`, `integrations` (Turnstile on/off). The site reads them through a cached `Settings` service. |
| `projects` | title, slug, company, client, show_client, category, status, period, role, authorship_note, is_featured, sort_order, summary, problem, contribution (HTML), features (JSON), challenges (JSON: challenge/solution), metrics (JSON: label/value/source), public_links (JSON), seo (JSON), published_at |
| `technologies` | name, slug, icon, skill_category_id, show_in_skills, sort_order |
| `project_technology` | links projects to technologies (used by the filters) |
| `skill_categories` | name, description, icon, sort_order (the 8 categories) |
| `experiences` | company, title, location, started_at, ended_at (null means present), phases (JSON), achievements (JSON), sort_order |
| `experience_technology`, `experience_project` | links experiences to technologies and projects |
| `specializations` | title, summary, capabilities (JSON: text and status), diagram_id, sort_order |
| `specialization_project` | links specializations to projects |
| `diagrams` | title, slug, description, nodes (JSON: id, label, sublabel, type, col, row), edges (JSON: from, to, label, mode sync/async) |
| `diagram_project` | links diagrams to projects |
| `education` | degree, institution, started_year, ended_year, sort_order |
| `media` | spatie medialibrary (cover, gallery, CV, OG image, portrait). Alt text required. |
| `contact_messages` | name, email, subject, message, ip_hash, user_agent, status (new/read/replied/spam), created_at |
| `users` | admin account; Fortify with TOTP two-factor; locked after 5 failed logins |
| `activity_log` | who changed what, and when (spatie/laravel-activitylog) |

**Drafts:** `published_at` decides whether a project is visible. Leave it empty to keep a draft, or click "Preview" to see the draft on the site.

**Seed data:** `PortfolioSeeder` loads the verified Phase 1 content (projects, experience, skills and 6 diagrams), so the site and admin start fully filled in.

### Admin panel (custom React + Mantine, Inertia pages)

| Screen | What it does |
|---|---|
| **Dashboard** | New messages, recent edits, a link to "view site" |
| **Site settings** | Profile, contact, availability, socials, SEO defaults, upload and replace the CV |
| **Hero / About / Navigation & Footer** | Edit text, chips, buttons, the hero system-map flows, the rich-text bio (TipTap) |
| **Projects** | Table with search and filters, drag-to-reorder, featured and published switches. The edit form has tabs: *Basics · Story · Features · Challenges · Metrics · Tech · Diagrams · Media (dropzone + gallery order) · SEO*, plus preview. |
| **Experience** | Edit entries, with phases and achievements as lists you can reorder |
| **Skills** | Categories and technologies; drag between categories |
| **Specializations** | The three "Engineering Beyond" cards |
| **Diagrams** | Node and connection tables with a **live SVG preview** next to them |
| **Education** | List editor |
| **Media library** | Browse, edit alt text, see which pages use each file, delete files that nothing uses |
| **Messages** | Inbox: read, mark as replied or spam, reply by email (`mailto:`), delete |
| **Account** | Password, 2FA setup, recovery codes |

**Admin rules:**
- Every save goes through a FormRequest; Laravel's validation decides what is accepted.
- Rich text is cleaned on the server (`symfony/html-sanitizer`).
- Saving clears the page cache in a queued job, so the public site is updated within seconds.

---

## 6. Routes and backend structure

| Route | Purpose | Protection |
|---|---|---|
| `GET /`, `/projects`, `/projects/{slug}` | Public pages | Server-rendered and HTML-cached; only published content |
| `POST /contact` | Contact form | FormRequest validation, Turnstile check on the server, honeypot plus minimum fill time, 5 per IP per hour and 20 per day, length limits, plain text only. Saves the message, then sends a **queued** email to you with reply-to set to the sender. Returns field errors or a success toast. |
| `GET /cv` | Downloads the CV | Streams the current file as `Rashedul-Raju-CV.pdf`, with caching headers |
| `GET /sitemap.xml`, `/robots.txt` | Generated | The sitemap is rebuilt on a schedule and when content changes |
| `/admin/*` | Admin | `auth` + `verified` + 2FA, a single admin user, CSRF protection, `noindex` |

**Code layout:**
- Controllers stay thin and call Actions (e.g. `SubmitContactMessage`, `ReorderProjects`).
- Read models: `PortfolioQuery` builds the cached data for the home page.
- Observers clear the cache when content changes.

**Security headers** (middleware):
- CSP with nonces
- HSTS (required by `.dev`)
- `X-Frame-Options: DENY`
- `Referrer-Policy`
- `Permissions-Policy`

Secrets live only in `.env` on the server and are never committed.

---

## 7. How projects are presented

**Each case study follows the same structure:**
1. Overview
2. Problem
3. My role (with an honest note on ownership)
4. Architecture diagram
5. Key features
6. Challenges and solutions
7. Technologies
8. Verified metrics
9. Status
10. Gallery

**Featured order** (editable):

| # | Project | Status | Visual |
|---|---|---|---|
| 1 | Mindray ultrasound DICOM integration (Yashfeen) | Built, tested with simulators, rollout in progress | Diagram |
| 2 | Pharmacy invoice OCR: offline reader + AI fallback | Live | Diagram + demo-data screenshot |
| 3 | Appza platform: licensing, push and build pipeline | Live | Diagram |
| 4 | Real-time patient queue and TV display (Reverb) | Live | Demo-data screenshot |
| 5 | Orbito ERP: multi-tenant SaaS | Built | 83 existing screenshots |
| 6 | Orbito HMS + lab analyzer bridge (ASTM/HL7, Go) | Built | Screenshots + diagram |
| 7 | Appza 2.0: server-driven UI | In development | Screenshots |
| 8 | Nourish-PMS: procurement | Live | Demo-data screenshots |
| 9 | POSk: database-per-tenant migration + HR/payroll | Live | Diagram |

**Other projects:** Orbito LMS, SDMS, JonoJabab, the newspaper portal, the doctor-booking site, Amar Bangladesh, and earlier work (Quran app, exam system, Bagisto SaaS, bank reconciliation, and the uchbd, bssf and wehatbazar sites).

**"Engineering Beyond Traditional Web Development":**
- OCR & document intelligence
- Healthcare & medical device integration (each capability with its true status)
- Enterprise system architecture

**Architecture showcase (6 diagrams in tabs):**
1. Appza build pipeline
2. Mindray DICOM gateway
3. OCR pipeline
4. Reverb queue and TV
5. Database-per-tenant request flow
6. Lab analyzer bridge

**Screenshot rules:**
- Demo data only.
- No real names, phone numbers or server addresses.
- AVIF/WebP at 2× resolution.
- Alt text required.

---

## 8. SEO and performance

- **Server-rendered HTML:** search engines and social previews see the full content.
- **Per-page metadata** from the admin: title, description, canonical URL, Open Graph and Twitter fields.
- **Open Graph images** for each project: uploaded, or generated from a template.
- **Structured data (JSON-LD):**
  - **Person:** jobTitle "Senior Software Engineer", worksFor, alumniOf, knowsAbout, sameAs.
  - **ProfilePage** on the home page.
  - **CreativeWork + BreadcrumbList** on case studies.
- **`robots.txt`** blocks `/admin`.
- **HTML:** semantic markup, one `h1` per page, correct heading order.
- **Speed:**
  - Full-page HTML cache, Brotli/gzip compression, immutable cache headers on hashed assets.
  - Responsive `srcset`, lazy-loaded images below the fold, preloaded hero font.
  - Each page's code loaded only when needed.
- **Targets:** Lighthouse ≥ 95 in all four categories; LCP under 2.0 s; CLS under 0.05; under about 120 KB of JavaScript on the public home page.

---

## 9. Code structure

```
app/
  Actions/            SubmitContactMessage, ReorderItems, PublishProject …
  Http/Controllers/   Site/ (Home, Projects, Cv, Contact)  Admin/ (one per screen)
  Http/Requests/      Site/ + Admin/ FormRequests
  Models/             Project, Technology, SkillCategory, Experience, Specialization, Diagram, Education, ContactMessage, Setting
  Observers/          clear the page cache, rebuild the sitemap
  Services/           Settings, PortfolioQuery, Seo/JsonLd, Turnstile
  Mail/               NewContactMessage (queued)
database/seeders/     PortfolioSeeder (verified content)
resources/js/
  site/               app.tsx, ssr.tsx, pages/, components/{ui,sections,projects,diagrams}, styles (Tailwind)
  admin/              app.tsx, pages/, components/, theme.ts (Mantine)
  shared/             types, zod schemas, the diagram renderer (used by both bundles)
tests/                Feature/ (Pest)  Unit/   resources/js/**/*.test.tsx (Vitest)   e2e/ (Playwright)
deploy/               nginx.conf, supervisor (queue, SSR), deploy.sh, Forge/Coolify notes
```

---

## 10. Roadmap (approval gates between phases)

**Phase 3: Foundation and public site**
- **3.1 Setup:** Laravel 13 + Inertia 3 + React 19 + TypeScript, the two Vite bundles, SSR, Pest/Vitest/Larastan/Pint/ESLint, GitHub Actions CI.
- **3.2 Data:** database tables, models, links between them, the `Settings` service, `PortfolioSeeder` with verified content.
- **3.3 Design system:** colour tokens, fonts, theme toggle with no flash, base components, a hidden `/styleguide` page.
- **3.4 Page sections:** Nav, Hero (system map), About, Skills, Experience.
- **3.5 Projects:** cards, the `/projects` page with filters and search, case-study pages and the overlay.
- **3.6 Showcase sections:** Engineering cards, the diagram renderer and the architecture showcase.
- **3.7 Contact form (front end) and Footer.**

➜ **Review gate:** you review the site running locally.

**Phase 4: Admin panel and backend**
- **4.1 Admin login:** Fortify login, 2FA, the admin layout.
- **4.2 Content screens:** Settings, Hero, About, Nav and Footer screens.
- **4.3 Projects editor:** all the tabs, media uploads, drag-to-reorder.
- **4.4 Remaining editors:** Experience, Skills, Specializations, Education.
- **4.5 Diagram editor** with live preview.
- **4.6 Media library and Messages inbox.**
- **4.7 Contact backend:** every protection layer plus the queued email.
- **4.8 Publishing:** page cache and its clearing, CV download, SEO, JSON-LD, OG images, sitemap, security headers.
- **4.9 Screenshots:** captured from local apps with demo data.

➜ **Review gate.**

**Phase 5: Testing**
- Pest feature tests (every admin action, the contact form's protections, access rules).
- Vitest for components.
- Playwright across 3 screen sizes and both themes.
- axe accessibility checks and Lighthouse CI.
- Checks in Chrome, Firefox and WebKit.
- Fix everything found.

**Phase 6: Launch** (nothing is touched without your explicit OK)
- **VPS** (you choose the provider): Ubuntu 24.04 with Nginx, PHP 8.4-FPM, MySQL 8, Node (for SSR) and Supervisor, managed with Forge or Coolify.
- **DNS:** `rashedulraju.dev`, `www` redirects to the main domain, Let's Encrypt certificate.
- **Email:** Resend domain records (SPF, DKIM, DMARC) so mail isn't flagged as spam.
- **Deploys:** zero-downtime release switching, the same pattern as your Forge scripts.
- **Backups:** daily database and uploads to R2, with a monthly restore test.
- **Rollback:** switch back to the previous release, plus a `migrate:rollback` plan.
- **Server hardening:** UFW, fail2ban, SSH keys only, unattended security upgrades.

---

## 11. Corrections for the CV PDF before it goes on the site

| CV now | Change to |
|---|---|
| "four concurrently supported API versions" | **"three"** |
| "159 migrations" | **"178"** |
| "546 module files … 156 entities … 41%" | Remove, or confirm the source |
| "to live customers" | **"to production-ready"**, unless the customers are confirmed |
| Appza 2.0 "471 commits" | **"500+"** |
| Orbito "~990 tests" | **"1,200+"** |
| SDMS "274 Pest tests" | **"260+"** |
| Skills | Add **Python**, **Go**, **DICOM / HL7 / ASTM**, **Laravel Reverb** |

---

## 12. Approval

Reply **"approved"** to start Phase 3. Any changes you ask for will go into a revision 3 first.
