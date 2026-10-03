# Product Requirements Document — Muhammad Nur Rahman Portfolio

**Status:** Active implementation specification
**Product:** Personal portfolio website
**Owner:** Muhammad Nur Rahman
**Positioning:** Mahasiswa Ilmu Komputer & Full-stack Developer
**Implementation:** Static HTML, CSS, vanilla JavaScript
**Source of truth:** Owner-approved Porto1.0/Biodata data and public `RahmannCH` repositories; claim scope must be reviewed before release.

## Problem statement

Visitors currently need one clear place to understand Rahman’s identity, education, full-stack direction, projects, experience, and contact paths. The `porto3.0` source previously described Kabinet Rahman 25 and did not function as his personal portfolio. The goal is to convert the existing lightweight static site into an accurate, navigable personal portfolio without adding an unnecessary application backend or framework.

## Goals

- Identify Rahman and his agreed role in the first viewport.
- Make 3–4 real projects easy to inspect through genuine previews, repository links, and available demos.
- Explain background and experience in clear Indonesian, without borrowing reference-site copy.
- Provide direct, working email and social links.
- Offer consistent light/dark themes and restrained, purposeful interactions.
- Keep essential page content usable without JavaScript, external font services, or animation.
- Pass responsive, accessibility, and Playwright regression checks.

## Non-goals

- Public guestbook/comments, fake testimonials, job-availability badges without approval, calendar filler, fake metrics, skill percentages, fake certificates, or invented project impacts.
- Form submission without a real receiving endpoint, privacy notice, validation, and abuse handling.
- CMS, admin, login, database, API, analytics, PWA, newsletter, or search before a demonstrated need.
- Migrating to React/Next.js only for style preference; retain native static architecture unless requirements materially change.

## Audiences and primary flows

| Audience | Goal | Primary flow |
|---|---|---|
| Recruiter/reviewer | Understand identity, technical direction, and evidence | Hero → projects → education/experience → contact |
| Developer/collaborator | Inspect real implementation and demos | Projects → demo/source → GitHub/contact |
| Campus/community contact | Understand background and communication experience | About → journey → email/social |

## Information architecture

1. **Hero (`#home`)** — full name, “Mahasiswa Ilmu Komputer & Full-stack Developer,” short summary, project/GitHub actions, local portrait, study/background strip.
2. **Selected projects (`#projects`)** — Zadify, CodeChrome, Game Farm 2.0, VirtualPet TeKom. Each with actual preview, factual summary, stack only when repository supports it, demo and source URLs.
3. **About (`#about`)** — current ULM study, TJKT foundation at SMKN 1 Banjarmasin, interests and concise personal narrative.
4. **Capabilities (`#capabilities`)** — web development; systems/networking/security; interaction/media/communication. No unsupported numeric rating.
5. **Journey (`#journey`)** — ULM education, TJKT education, campus activities and speaking roles where supported by personal source records.
6. **Contact (`#contact`)** — email, GitHub, Instagram, and only other verified channels.
7. **Footer** — owner identity, appropriate copyright year, back-to-top anchor.

No sidebar. Sticky top navigation fits single-page information architecture. Mobile navigation is a disclosure, not an application menu.

## Content evidence rules

- Personal biography/education/experience source: local `Porto1.0/src/data/portfolio.ts` and `Biodata-Saya-main/index.html`. These are owner-provided statements; confirm exact event dates and wording before publication.
- Project descriptions and preview images: public profile/repositories `https://github.com/RahmannCH` and its README. Current candidates: Zadify, CodeChrome, Game-Farm-2.0, VirtualPet_TeKom.
- Use only real project preview captures. Do not invent contribution scope, client status, users, impact metrics, Lighthouse/SEO scores, GPA, certificates, or skill proficiency.
- Avoid publishing NIM unless there is a clear purpose and explicit owner approval.
- Use `assets/ProfileRahman.jpeg` only as the provided portrait. Do not treat organization logos as personal identity assets.
- Keep unsupported details omitted. An unknown field is not a design gap to fill with sample content.

## Interaction requirements

### Theme

- Initial theme: saved explicit choice, otherwise OS preference, with dark fallback.
- Toggle switches theme without page reload and saves choice under one localStorage key.
- If storage is unavailable, toggle still changes the current page theme without throwing.
- Avoid flash of the wrong theme during load. Test dark/light contrast independently.

### Navigation

- Anchor links have valid targets and descriptive names.
- Mobile menu button exposes `aria-expanded` and `aria-controls`, opens/closes with keyboard, closes after navigation and Escape, and returns focus to trigger after Escape.
- Fixed header must not obscure anchor headings or keyboard focus.

### Draggable labels

- Hero identity labels can be dragged within a safe bounded region on pointer-capable desktop.
- Keyboard alternative: arrow keys nudge in fixed increments; Home resets position.
- Labels are decorative; role/name remains represented in ordinary text. On small screens labels wrap statically.

### Scroll reveal and mascot

- Reveal uses IntersectionObserver and transform/opacity only; no content depends on it becoming visible.
- Without JavaScript or under `prefers-reduced-motion`, content renders visible and the walking mascot is stopped.
- Mascot is decorative, non-interactive, pausable using an accessible button, and hidden where it could obstruct mobile content.

## Responsive design

- Supported widths include 320 CSS px through wide desktop.
- Header adapts to mobile disclosure menu; hero portrait and content stack; tags wrap; project list becomes single column; timeline dates move above details.
- No page-level horizontal scroll, clipped CTA, image overflow, or essential information revealed only by hover.
- Touch controls aim for at least 44×44 CSS px. Drag interaction must not be sole method of operating a function.

## Visual system

Use monochrome surfaces and text with one restrained pastel blue accent. Dark/light tokens, type scale, spacing, and layout are specified in `DESIGN.md`. Accent is not a status code. Maintain AA contrast; use separate accessible accent text variants for each theme. Font loading has system fallbacks. Avoid glow, stock project imagery, fake terminal UIs, placeholder cards, and repetitive eyebrow labels.

## Error and offline behavior

- Core content is local/static and remains readable without JavaScript.
- No API request is required for page content.
- Image decode failure leaves a styled neutral cover/title instead of a broken icon; alt text still conveys image purpose.
- External repositories/demos are checked before release. If demo is unavailable, keep source link and omit or accurately label the demo action.
- Email link remains visible if no local email client is configured.
- Unknown route returns an actual HTTP 404 and a useful local recovery path, not a false portfolio page with 200 status.
- No success toast, loading skeleton, or error messaging for operations that do not exist.

## Metadata and privacy

- Indonesian page language and accurate title/description.
- Open Graph title/description/image match personal portfolio; production canonical URL is added only after the real domain is known.
- Local owner/project assets preferred. Do not expose private identifiers, secrets, unapproved documents, or image metadata that reveals sensitive information.
- External links opened in new tabs include `rel="noreferrer"`.
- No visitor content collection, analytics, or form processing in this phase.

## Architecture and test strategy

- Retain static HTML/CSS/vanilla JS; shared behavior stays in `js/main.js`, theme tokens/layout in `css/style.css`, factual visible content in `index.html` while the site remains one page.
- Keep interactions isolated and small. Avoid premature component framework/data abstraction for one static page.
- Use local assets for owner portrait and actual repository previews; preserve image dimensions and lazy-load below-the-fold previews.
- `npm run dev` serves static files via `scripts/serve.mjs`; `npm run test:e2e` runs `scripts/smoke.spec.js` through the existing Playwright dependency.
- Smoke coverage: four viewports, title/content, all images decode, no horizontal overflow, valid anchors/destinations, no local/page/console errors, mobile menu keyboard + Escape/focus, theme persistence, drag keyboard controls, reduced-motion behavior, 404.
- Manual checks: keyboard walkthrough, screen-reader structure, WCAG 2.2 AA text/UI contrast, OS reduced-motion, mobile touch behavior, external URLs, copy/factual review, and Lighthouse/Core Web Vitals.

## Acceptance criteria

- No Kabinet/HIMAKOM organizational-site copy, draft banner, organizational logos, program/aspiration UI, or cabinet metadata remains in the live personal portfolio.
- Personal name/role, study, work, contact, and project claims reflect owner-provided/public sources and no fabricated numbers.
- 3–4 selected GitHub projects have genuine preview images, functional source/demo links, correct alt text and coherent descriptions.
- Light/dark theme follows saved/system preference and remains usable if storage is disabled.
- Navigation, labels, and theme control are keyboard-operable; reduced motion removes nonessential animation.
- `npm run test:e2e` passes all test cases and viewports; static server returns HTTP 404 for unknown paths.
- No horizontal overflow at 320px; critical content visible when JavaScript/animation is unavailable.
- No unresolved severe contrast, focus, broken-link, or asset-rights issue before publication.

## Release checklist

- [ ] Owner reviews bio, institution/faculty wording, period dates, activity descriptions, and contacts.
- [ ] Check GitHub README/source and demo health for every selected project.
- [ ] Confirm project preview images are genuine and permitted for reuse; source currently is owner’s public GitHub preview assets.
- [ ] Confirm LinkedIn/TikTok/Discord links before adding them; omit channels not explicitly selected by owner.
- [ ] Add deployment canonical URL only when the production domain is known.
- [ ] Run Playwright, keyboard/reduced-motion checks, manual contrast review and a final visible-copy audit.
