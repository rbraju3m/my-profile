# Phase 5: Testing report

Completed 13 Nov 2026. Builds on `docs/phase-2-plan.md` (roadmap, section 10).

## Summary

| Layer | Before | After | Result |
|---|---|---|---|
| Pest (backend) | 35 tests (55 with datasets) | **152** (904 assertions) | All pass |
| Vitest (components and logic) | 8 | **41** | All pass |
| Playwright (6 browser/screen setups × light and dark, with axe) | none | **127** (+11 skipped on purpose) | All pass |
| Lighthouse CI (3 pages × 3 runs) | none | Accessibility **100**, Best practices **100**, SEO **100** | Performance: home ~0.87–0.92, other pages 0.97–1.0 |
| Pint, Larastan level 6, tsc, ESLint | passing | passing | Clean |

The 11 skipped browser tests are intentional: mobile-menu tests skip on wide screens, the keyboard skip-link test skips on phones, and the test that changes data runs in one browser only.

## Bugs found and fixed

1. **Hero links broke after a project was renamed or hidden.** The hero's system map links to projects by slug. A rename, unpublish or delete left a link to a 404. Now a rename updates the hero, and flows pointing at a hidden or deleted project are left out.
2. **The rich-text cleaner deleted words, not only tags.** Text inside any tag outside the allow-list was lost on save. For example, `<u>` and `<s>`, which TipTap produces with Ctrl+U and the strike shortcut, or pasted headings and spans. Now those tags are unwrapped and the text kept. `<script>`, `<style>`, `<iframe>`, event handlers and `javascript:` links are still removed.
3. **Test files were bundled into production.** The page globs picked up `*.test.tsx` files, which pulled Vitest into the SSR bundle and crashed the SSR server on start. The globs now exclude tests, and CI fails if test code ever appears in a bundle.
4. **The page scrolled sideways on iPhone at `/projects`.** The filter `<fieldset>` kept the browser's default `min-width: min-content`, so the swipeable row of chips stretched the page to 1,535px. Fixed with `min-w-0`.
5. **Firefox logged a CSP error on the home page.** zod probes for `eval`, which the CSP rightly blocks. zod is gone (see the performance section).
6. **Accessibility (axe, WCAG 2.2 AA):**
   - The logo link's accessible name didn't contain its visible text (WCAG 2.5.3).
   - The metric source text failed colour contrast.
   - The admin login had no `<main>` landmark or `<h1>`.
   - Admin pages had no `<h1>`.
7. **Expired-session form posts** (CSRF 419) now return to the form with the typed text kept and a clear message, instead of an error page.
8. **The unbranded Laravel 404/500 page on the public site** is replaced with a branded error page that isn't indexed. It covers 403, 404, 419, 429, 500 and 503. The admin keeps Laravel's own pages, and with debug on, local 500s still show the full error screen.
9. **Duplicate React keys in the hero system map** when a step repeats.

## Performance work

Lighthouse uses mobile emulation with a 4× slower CPU. The home page started at 0.75.

| Change | Effect |
|---|---|
| Scroll-reveal animations moved from the `motion` library to a CSS transition and one shared IntersectionObserver | −86 KB of JS. Content no longer starts at `opacity: 0` in the server HTML. |
| zod replaced by a small, tested `validateContact()` | Home page chunk cut from 102 KB to 24 KB. Fixes item 5. |
| Hydration runs inside `startTransition` | React yields to the browser instead of hydrating in one long task. Every page benefits. |
| **Progressive hydration** (`site/components/Deferred.tsx`) | The home page's sections below the fold keep their server HTML and hydrate only when they come within 800 px of the viewport. Clicks on a section that isn't hydrated yet are replayed by React. |

**Results (Lighthouse, 3 runs per page, two passes):**

| Page | Performance | Accessibility | Best practices | SEO | Blocking time | LCP | CLS |
|---|---|---|---|---|---|---|---|
| `/` | 0.84–0.93, median ~0.87–0.92 (was 0.75) | 100 | 100 | 100 | ~300–400 ms (was ~1,000) | 1.9 s | 0 |
| `/projects` | 0.97–1.0 | 100 | 100 | 100 | ~85–190 ms | 1.3 s | 0.001 |
| `/projects/orbito-erp` | 0.99–1.0 (was 0.88) | 100 | 100 | 100 | ~80–150 ms | 1.0 s | 0 |

**Budgets** (`lighthouserc.cjs`):
- **Hard failures:** median performance ≥ 0.85, accessibility = 100, best practices ≥ 95, SEO ≥ 95, LCP ≤ 2.5 s, CLS ≤ 0.1.
- **Warning only:** median blocking time over 300 ms. The home page currently sits around this line.
- The performance floor is below the home page's run-to-run noise (0.84–0.93), so CI isn't flaky.

**Progressive hydration: problems found and handled along the way** (each one now has a test):
- **Inertia re-renders the page once after mount**, with identical props in new objects. A re-render that reaches a section not yet hydrated makes React throw away the server HTML and render it from scratch, which silently undid the whole benefit. `Deferred` now skips re-renders when the section's data is unchanged. If the data really changes, it renders at once instead of leaving the section empty.
- **Typing into a form that isn't hydrated yet is lost when hydration runs.** The WebKit test caught this. The contact form is therefore not deferred.
- **Reveal animations in a section that hydrated after the visitor scrolled past it** waited for the visitor to scroll back up. Items that are already above the viewport now reveal straight away.

## What the tests cover

**Pest** (`tests/`):
- `Feature/Admin/AccessTest.php`:
  - Every admin route (found from the router, so new routes are covered automatically) blocks guests.
  - There is no registration or email password reset.
  - Login works, and repeated wrong passwords get locked out.
  - The full TOTP challenge works.
  - The 2FA gate blocks writes, not only pages.
  - Password change needs the current password, and logout works.
- `Feature/Admin/EditorsTest.php`:
  - Each settings group accepts its own seeded content back, with no lost fields, and field validation works (bad URLs, `javascript:` and `data:` links, icons, phone, `%s` in the title template).
  - Project validation, deletion, uploads and gallery ordering work.
  - Experience, education, skills, technologies, specializations and diagrams each have create, update and delete tests.
  - Diagram input that isn't valid is rejected without crashing.
  - Reordering works for every list, including moving technologies between categories.
  - Inbox filters, spam handling, and media alt text and deletion work.
- `Feature/ContactFormTest.php`:
  - Both rate limits work (5 per hour, 20 per day) and are counted per address.
  - Length limits, markup stripping, the honeypot (no email sent), and Turnstile pass, fail and outage cases all work.
- `Feature/SeoAndSecurityTest.php`:
  - The security headers and CSP are in place; every inline script carries the nonce and there is no `unsafe-inline` or `unsafe-eval`.
  - HSTS is sent over HTTPS.
  - Canonical and social tags, and per-project SEO overrides, are correct.
  - The sitemap lists published projects only; robots.txt is right in production and outside it.
  - The branded 404 and the 419 handling work, and no admin-only fields leak to the site.
- `Unit/RichTextTest.php`: the sanitiser.

**Vitest:**
- `FlowDiagram`: accessible SVG name and description, the step-list order, async marking, unique marker ids.
- `ProjectCard`.
- `Contact`: browser-side validation, focus, the honeypot, Turnstile, success.
- `useDecoded`: never in the server HTML.
- `useTheme`: still works with storage blocked.
- `validateContact`.
- The error page.

**Playwright** (`e2e/`):
- **Setups:** Chromium at 1440, 820 and 412 px; Firefox desktop; WebKit desktop and iPhone.
- **Every test:** fails on any console error, uncaught exception, hydration mismatch or CSP violation.
- **On each page, in light and dark:** server-rendered HTML, no sideways scrolling, zero axe violations.
- **Progressive hydration:** while scrolling the whole home page, every section becomes visible and the last form is interactive.
- **Behaviour:** theme toggle and persistence, mobile menu with Escape, filters with a shareable URL that renders the same on reload, Inertia navigation updating the title, the skip link, contact-form validation and sending, CSP nonce through the page cache, and an admin edit appearing on the site straight away (page-cache clearing).

## How to run

```bash
vendor/bin/pest
npm test
npm run build && npm run e2e                     # browsers: npx playwright install chromium firefox webkit
CHROME_PATH=... npm run lighthouse               # any Chrome; Playwright's works
scripts/e2e-server.sh                            # the same server by hand, at http://127.0.0.1:8124
```

The browser tests use their own SQLite database (`database/e2e.sqlite`), port 8124 and an SSR server on port 13715. They never touch the development database or a dev SSR server on 13714. CI runs all of this in a new `browser` job and uploads the Playwright and Lighthouse reports.
