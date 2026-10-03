---
version: 2.0
name: Muhammad Nur Rahman Personal Portfolio
description: Creative, accessible static portfolio for a Computer Science student and full-stack developer.
colors:
  dark-canvas: '#0B0D10'
  dark-surface: '#12161B'
  dark-ink: '#F4F6F8'
  light-canvas: '#F6F8FA'
  light-surface: '#FFFFFF'
  light-ink: '#14191E'
  accent-dark: '#A9E2F6'
  accent-light: '#397B99'
  line-dark: '#2A323B'
  line-light: '#D7E0E6'
typography:
  display: system sans stack
  body: system sans stack
  mono: system monospace
---

# Design System: Muhammad Nur Rahman

## 1. Visual direction

Personal full-stack portfolio for recruiters, collaborators, and curious visitors. Creative and editorial, but direct. Use a monochrome base with restrained pastel blue, large confident type, genuine project screenshots, asymmetric hierarchy, and documented personal experience. Reference sites inform interaction and composition only; never reuse their copy, metrics, people, or project data.

Keep the static HTML/CSS/JS architecture. No UI framework, CMS, form backend, analytics, or database until a real need exists.

## 2. Color roles

| Token | Dark theme | Light theme | Role |
|---|---|---|---|
| Canvas | `#0B0D10` | `#F6F8FA` | Page background |
| Surface | `#12161B` | `#FFFFFF` | Header and content surfaces |
| Raised surface | `#1A2027` | `#EAF0F4` | Selected controls and panels |
| Ink | `#F4F6F8` | `#14191E` | Main text |
| Muted | `#A4ADB8` | `#4F5C67` | Paragraphs and secondary text |
| Subtle | `#7C8793` | `#667582` | Metadata; verify contrast |
| Line | `#2A323B` | `#D7E0E6` | Dividers and control borders |
| Accent | `#A9E2F6` | `#397B99` | Focus, links, selected labels |
| Accent strong | `#67B9D8` | `#286A87` | Accent text and interactive states |

Accent never communicates status by color alone. Any future error/success state needs semantic text/icon and accessible contrast. Keep same hierarchy and palette logic in both themes. Verify body text contrast ≥4.5:1 and large text ≥3:1 against actual surfaces.

These twelve values are the single source of truth for colour. The scroll animation engine ships its own six (`--sc-canvas`, `--sc-surface`, `--sc-ink`, `--sc-ink-soft`, `--sc-accent`, `--sc-accent-ink`) in `css/scrollcraft.css`, and they must mirror this table in both themes rather than carry an independent palette. Two palettes on one page means the progress bar, selection and caret disagree with every other component. A test asserts `--sc-accent` equals `--accent` in both themes.

## 3. Type and spacing

- Use system sans fonts with robust fallbacks; no external font request required for core rendering. The stack must begin at `system-ui` rather than naming a substitute face: naming Arial as a stand-in for Helvetica is what produces the generic default this system exists to avoid.
- Display name: fluid 52–132px, tight but readable line-height, no clipped descenders.
- Section title: fluid 40–80px. Body: 16px minimum where practical, line-height 1.65–1.85. Metadata: 10–13px only when nonessential.
- 4px spacing base; common rhythm 8, 12, 16, 24, 32, 48, 64, 96.
- Content width 1240–1320px. Body measure 55–70 characters.
- One radius system: square/editorial panels, pill tags, modest control radius. Avoid nested card stacks.

## 4. Layout and content hierarchy

1. Sticky header: personal monogram, Projects/About/Capabilities/Journey/Contact, theme control, accessible mobile menu. Every nav item has a real section behind it; a section that exists but is unreachable from the header is a defect.
2. Hero: identity and agreed role, short plain-language positioning, project/GitHub actions, owner portrait, bounded draggable tags, factual profile strip with a print control. The strip carries facts, not scroll cues: a cue that repeats the hero call to action adds no information.
3. Selected projects: four current GitHub candidates with genuine repository screenshots, verified stack, summary, explicit demo/source links.
4. About: study, TJKT background, interests, concise narrative.
5. Capabilities: three grouped domains, no unsupported percentage bars or proficiency scores.
6. Journey: education and sourced organization/speaking experience.
7. Contact: verified email and social destinations only, plus a status strip stating location, timezone, current local time, and a print control. Status is a labelled fact, never a bare coloured dot and never an availability claim the owner has not made.
8. Footer: identity, location if owner approved, return-to-top.

The page is the CV. There is no hosted PDF to keep in sync and no file to go stale, so "print this profile" is a first-class action in the hero strip and the contact status. `css/print.css` turns the page into a document: chrome is dropped, fixed-height sections return to normal flow, the portrait is the only image kept, every project prints as a compact block, outbound URLs are printed after their links, and reveal animations resolve to fully visible.

Desktop uses asymmetric editorial compositions; mobile collapses to readable single column with no horizontal overflow. Draggable decorations become a wrapping label row on phone. Projects and copy remain useful without animation or JavaScript.

## 5. Interaction and motion

- Theme toggle: system preference on first use; explicit choice saved in localStorage; no visible flash; gracefully handle storage failure.
- Mobile nav: native links, `aria-expanded`/`aria-controls`, Escape, focus restoration, closes after anchor selection.
- Draggable hero labels: bounded pointer movement; keyboard arrows nudge and Home resets. Labels are decorative and carry no essential information.
- Scroll reveal: IntersectionObserver, opacity/transform, once per item; content remains visible without JS and under reduced motion.
- Mascot is decorative only, can be paused with a labeled button, pauses under reduced motion, and is omitted on narrow screens where it can obstruct content.
- No scroll hijacking, autoplay media, endlessly cycling project content, or animation that delays the primary action.

## 6. Assets

- Owner portrait: local `assets/ProfileRahman.jpeg`, meaningful alt text, intrinsic dimensions and stable aspect ratio.
- Project preview images: locally stored real preview screenshots sourced from the owner’s public GitHub profile, with descriptive alt text and dimensions.
- Existing cabinet logos remain unused legacy files until safe cleanup; they must not appear in the personal portfolio.
- `assets/rahman-mark.svg` is a simple initials favicon/monogram.
- No stock face or stock image framed as a project screenshot, certificate, or personal event photo.
- Lazy-load below-fold project images; prioritize the hero image. Keep source attribution/URL in PRD/data record.

## 7. Accessibility and quality target

Target WCAG 2.2 AA. Test keyboard, visible/unobscured focus, 320px reflow, text/interactive contrast, reduced motion, screen-reader headings/landmarks, and touch targets. The mascot and draggable labels must never be necessary for understanding or navigating the site.

Release checks: Playwright viewports 1440, 768, 390, 320; theme persistence; keyboard menu/drag; image decoding; internal anchors; 404; no console/page errors; accent parity between the design tokens and the animation engine in both themes; print controls reach `window.print()`; print media hides chrome and resolves reveal opacity; manual contrast and copy review. See `PRD_KabinetRahman25.md` for the product requirements and evidence policy.
