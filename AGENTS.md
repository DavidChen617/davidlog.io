You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

---

## Project: davidlog.io

Personal tech notes site — pure static Angular SPA, no backend.

### Bootstrap

```
index.html → main.ts → bootstrapApplication(App, appConfig)
```

`appConfig` registers global providers:
- `provideZonelessChangeDetection()` — Zone.js is disabled; change detection is driven entirely by Signals
- `provideRouter()` — client-side routing
- `provideHttpClient()` — used to fetch markdown files and i18n JSON
- `provideMarkdown()` — ngx-markdown (marked + prismjs)
- `provideTranslateService()` + `provideTranslateHttpLoader()` — ngx-translate, loads `/i18n/{lang}.json`

### Sidebar / Manifest

The sidebar is **not hardcoded**. At build time, `scripts/gen-manifest.mjs` scans `public/docs/zh/`, reads the first `# heading` from each `.md` file and the `_meta.json` in each folder, then outputs `public/docs/manifest.json`. This script runs automatically via `pnpm start` and `pnpm build`.

On app init, `App.ngOnInit()` calls `DocsManifestService.load()`, which fetches the manifest via `HttpClient`. `DocsManifestService.groups` is a `computed()` that returns labels in the current language.

### Internationalisation

Two layers:

| Layer | Mechanism | Files |
|-------|-----------|-------|
| UI text (navbar, buttons, labels) | ngx-translate `TranslatePipe` | `public/i18n/zh.json`, `en.json` |
| Markdown content | Separate file per language | `public/docs/zh/`, `public/docs/en/` |

`LangService` holds a `current` signal (`'zh' \| 'en'`), persisted to `localStorage`. Toggling it triggers:
1. `translate.use(lang)` — re-renders all `TranslatePipe` bindings
2. `DocsManifestService.groups` recomputes — sidebar titles switch language
3. `DocComponent` reloads — `combineLatest([route.params, toObservable(lang.current)])` emits, fetches `/docs/{lang}/{path}.md`, falls back to `/docs/zh/{path}.md` if not found

### Dark Mode

`DarkModeService` reads `localStorage('theme')` or `prefers-color-scheme` on init. An `effect()` toggles `document.documentElement.classList` between `.dark` / no class. Tailwind is configured with `@custom-variant dark (&:where(.dark, .dark *))` so all `dark:` utilities respond to the class on `<html>`.

### Doc Page

Route: `/docs/:p1/:p2/:p3` → `DocComponent`

1. `loadDoc()` fetches the markdown file
2. ngx-markdown renders it to HTML (`(ready)` event fires)
3. `setupToc()` scans the rendered DOM for `h2/h3/h4`, builds the right-side TOC
4. `setupScrollObserver()` uses `IntersectionObserver` to highlight the active TOC entry as the user scrolls

### File Structure

```
public/
  i18n/zh.json, en.json       ← UI strings
  docs/
    manifest.json              ← auto-generated at build time
    zh/, en/
      _meta.json               ← folder display names (both languages)
      *.md                     ← articles

src/app/
  shared/
    dark-mode.service.ts       ← dark mode signal + effect
    lang.service.ts            ← language signal + localStorage
    docs-manifest.service.ts   ← loads manifest, exposes computed groups
    nav-config.ts              ← navbar link definitions
  layout/
    navbar/                    ← top bar (lang toggle, dark mode, GitHub)
    sidebar/                   ← left nav, driven by DocsManifestService
  pages/
    home/                      ← landing page
    doc/                       ← markdown render + TOC + scroll spy

scripts/
  gen-manifest.mjs             ← scans docs/zh/, outputs manifest.json
```

### Adding content

1. Write a `.md` file under `public/docs/zh/` (first line must be `# Title`)
2. Add a corresponding `.md` under `public/docs/en/` for the English version
3. New folders need a `_meta.json`: `{ "zh": "分類名", "en": "Category Name" }`
4. Run `pnpm start` or `pnpm build` — manifest regenerates automatically
