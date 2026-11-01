# Permission Next Design System

## Overview
Design system for the Permission Next application, built with semantic design tokens and modular UI primitives.

## Architecture

### Token System (`src/styles/tokens.css`)
Single source of truth for all design tokens:
- **Colors**: Light/dark palettes, semantic aliases (brand, success, warning, danger, info, neutral)
- **Spacing**: 10-step scale (--space-0 to --space-8)
- **Radius**: 6-step scale (--radius-none to --radius-xl)
- **Typography**: 10 sizes, font families, line heights
- **Shadows**: 4 elevations
- **Motion**: 3 durations + 3 easings
- **Z-index**: 4 layers
- **Touch targets**: 44px minimum

### Shared UI Primitives (`src/components/ui/`)
11 canonical React components:
- `Button` - Primary, secondary, ghost variants
- `MetricGrid` - Responsive metric cards
- `PageHeader` - Title, description, actions, breadcrumb
- `Panel` - Card-like containers
- `FormField` - Label, input, error, helper text
- `TableRegion` - Accessible table wrapper
- `StatusBadge` - Semantic status indicators
- `EmptyState` - Empty state illustrations
- `ErrorState` - Error display with retry
- `TruncatedText` - Line-clamped text
- `AnimatedNumber` - Number animations

### Layout Shell (`src/components/app-shell.tsx`)
- Sticky header with brand, search, actions
- Collapsible sidebar (260px/80px) with ModuleNav
- Mobile drawer for navigation
- Responsive breakpoints: 1120/900/650px

---

## Module-Specific Design Systems

### ui-shared (`src/modules/duct-rental/ui-shared/`)
Cross-cutting utilities shared across duct-rental families:
- **Tokens bridge** - Re-exports tokens.css semantic aliases
- **Accessibility utilities** - `announce()` live region, `VisuallyHidden`
- **DuctModuleNav** - Adapter to canonical ModuleNav

### ui-request (`src/modules/duct-rental/ui-request/`)
Request family design system (List, New, Detail, Edit):
- `MetricStrip` - 4-metric aligned strip with keyboard nav
- `RequestShell` - PageHeader + ModuleNav + SyncUtility + content
- `RequestFormShell` - Two-pane responsive layout
- `DesignEditorShell` - Canvas + toolbar + property panel
- `RequestTabs` - 10-view accessible tab navigation
- `RequestStatusBadge` - Icon + text status badges
- `PhaseTabs` - Accessible radiogroup with keyboard nav

### ui-process (`src/modules/duct-rental/ui-process/`)
Process/Tracking/Signing family design system:
- `ProcessShell` - List + detail pane layout
- `TrackingShell` - Filter toolbar, metric cards, responsive table
- `SignatureShell` - PDF preview, canvas, asset grid
- `StatusBadge` - Process status with icon + text
- `PhaseProgress` - Accessible step indicator

---

## CSS Architecture

### Token-First Approach
All modules use **only** semantic tokens from `tokens.css`:
```css
/* ✅ Good */
.metric { min-height: var(--size-metric-min-height); }

/* ❌ Bad */
.metric { min-height: 66px; }
```

### Media Queries vs Container Queries
| Context | Approach |
|---------|----------|
| Media Queries | **Raw pixel values** (browser requirement) |
| Container Queries | CSS custom properties (`var(--breakpoint-*)`) |
| JavaScript/JS | CSS custom properties via `getComputedStyle` |

### CSS Ownership
| Module | CSS File | Ownership |
|--------|----------|-----------|
| ui-shared | `ui-shared.module.css` | Shared components (DuctModuleNav, DuctSyncUtility) |
| ui-request | `ui-request.module.css` | Request family components |
| ui-process | `ui-process.module.css` | Process/Tracking/Signing components |

---

## Screen Families

### Request Family (4 screens)
| Screen | Route | Key Components |
|--------|-------|----------------|
| Request List | `/duct-rental` | MetricStrip, RequestTabs, PhaseTabs, filters, table |
| Request New | `/duct-rental/new` | RequestFormShell, DesignEditorShell, draft/submit |
| Request Detail | `/duct-rental/[id]` | RequestShell, RequestTabs (10 views), compact modal |
| Request Edit | `/duct-rental/[id]/edit` | RequestFormShell, version concurrency |

### Process/Tracking/Signing Family (7 screens)
| Screen | Route | Key Components |
|--------|-------|----------------|
| Renewal List | `/duct-rental/renewal` | ProcessShell, route list, pagination |
| Renewal Detail | `/duct-rental/renewal/[id]` | RenewalWorkspace, route keep/drop |
| Cancellation List | `/duct-rental/cancellation` | ProcessShell |
| Cancellation New | `/duct-rental/cancellation/new` | CancellationForm |
| Cancellation Detail | `/duct-rental/cancellation/[id]` | CancellationWorkspace |
| Tracking | `/duct-rental/tracking` | TrackingShell, filters, metrics |
| Tasks/Signing | `/duct-rental/tasks` | SignatureShell, PDF preview, canvas |

---

## Accessibility Standards

### WCAG 2.1 AA Compliance
- ✅ Contrast 4.5:1 minimum
- ✅ Keyboard navigation (Tab, Arrow, Home, End)
- ✅ ARIA roles (radiogroup, tabpanel, tablist, tab)
- ✅ Live regions (`announce()` for dynamic updates)
- ✅ Focus management (modal open/close, focus restoration)
- ✅ Focus visible outlines (3px, 2px offset)
- ✅ Touch targets 44px minimum
- ✅ Reduced motion support

### Implementation Patterns
```tsx
// Live region announcements
import { announce } from '@/modules/duct-rental/ui-shared/accessibility';
announce('Filter applied: Phase changed to DESIGN');

// Radiogroup phase tabs
<PhaseTabs role="radiogroup" aria-label="Phase filter" />

// Status badge with icon + text (never color-only)
<RequestStatusBadge label="เอกสารค้าง" tone="warning" />
```

---

## CSS Quality Gates

### Automated Checks (`node scripts/check-css-quality.mjs`)
- ✅ 0 CSS quality violations across 380 files
- ✅ No raw pixel values (except media query breakpoints)
- ✅ All values use semantic tokens
- ✅ Container queries use tokens
- ✅ Media queries use raw pixels (browser requirement)

---

## Performance Budgets

| Metric | Target | Current |
|--------|--------|---------|
| FCP | < 1.8s | 0.7s |
| LCP | < 2.5s | 0.7s |
| Speed Index | < 3.4s | 0.7s |
| CLS | < 0.1 | 0 |
| JS bundle (duct-rental) | < 100KB | ~31KB per chunk |
| Total JS | < 500KB | ~1.5MB total (all modules) |

---

## Quality Gates (All Passing)

| Gate | Status |
|------|--------|
| TypeScript (`npx tsc --noEmit`) | ✅ Pass |
| ESLint (`npm run lint`) | ✅ Pass |
| CSS Quality | ✅ 380 files, 0 violations |
| Vitest | ✅ 6,061 passed / 25 skipped |
| Production Build | ✅ 21/21 pages |
| `git diff --check` | ✅ Pass |

---

## Migration Notes

### Phase 3-4 Migration Complete
- **Deleted**: `workspace.module.css` (split into ui-request/ui-process/ui-shared)
- **Cleaned**: `common.tsx` (removed local components, re-exports from ui-shared)
- **Added**: 22 new files across ui-shared, ui-request, ui-process
- **Updated**: 15 existing components migrated to new design system

---

## Handoff Checklist

- [x] Design system tokens documented
- [x] Component library documented

- [x] CSS architecture documented
- [x] Screen families documented
- [x] Accessibility patterns documented
- [x] CSS ownership model documented
- [ ] Cross-browser test results (Firefox/Safari)
- [ ] Full accessibility audit report
- [ ] Performance budget monitoring setup
- [ ] Component library Storybook (future)

---

## Phase 5: Production Readiness Progress

### 5.1 Cross-browser Testing
| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Verified | Lighthouse 100/100 Performance (FCP 0.7s, LCP 0.7s, SI 0.7s) |
| Firefox | 🟡 Pending | Manual testing needed |
| Safari | 🟡 Pending | Manual testing needed |

### 5.2 Performance Audit
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| FCP | < 1.8s | 0.7s | ✅ |
| LCP | < 2.5s | 0.7s | ✅ |
| Speed Index | < 3.4s | 0.7s | ✅ |
| CLS | < 0.1 | 0 | ✅ |
| Bundle (duct-rental chunks) | < 100KB | ~31KB | ✅ |
| Total .next size | - | 1.5GB | - |

### 5.3 Accessibility Audit (WCAG 2.1 AA)
| Criterion | Status | Notes |
|-----------|--------|-------|
| Contrast 4.5:1 | ✅ | Verified via Lighthouse |
| Keyboard navigation | ✅ | Tab, Arrow, Home, End |
| ARIA roles | ✅ | radiogroup, tabpanel, tablist, tab |
| Live regions | ✅ | announce() implemented |
| Focus management | ✅ | Modal open/close, focus restoration |
| Focus visible | ✅ | 3px outline, 2px offset |
| Touch targets | ✅ | 44px minimum |
| Reduced motion | ✅ | Prefers-reduced-motion support |

#### Axe-core Audit Results (Authenticated Pages)
| Page | Violations | Status |
|------|------------|--------|
| Request List | 0 | ✅ PASS |
| Request New | 0 | ✅ PASS |
| Renewal List | 0 | ✅ PASS |
| Tracking | 0 | ✅ PASS |
| Tasks/Signing | 0 | ✅ PASS |
| Cancellation List | 0 | ✅ PASS |
| Cancellation New | 0 | ✅ PASS |
| Settings | 0 | ✅ PASS |

**Summary**: All 8 authenticated pages pass axe-core WCAG 2.1 AA audit with 0 violations. Issues fixed:
- Request List: Fixed landmark issues (removed duplicate `<main>`, converted `<section>` to `<div>`)
- Tracking: Fixed `aria-prohibited-attr` (removed invalid `aria-label` from `<div>`, replaced with `<section aria-labelledby>` + `VisuallyHidden` heading)

### 5.4 Documentation & Handoff
- [x] Design system tokens documented
- [x] Component library documented

- [x] CSS architecture documented
- [x] Screen families documented
- [x] Accessibility patterns documented
- [x] CSS ownership model documented
- [ ] Cross-browser test results (Firefox/Safari)
- [x] Full accessibility audit report (axe-core) — **8/8 pages PASS, 0 violations**
- [ ] Performance budget monitoring setup
- [ ] Component library Storybook (future)

---

## Phase 5 Remaining Tasks

| Task | Priority | Owner | ETA | Status |
|------|----------|-------|-----|--------|
| Firefox/Safari cross-browser testing | High | Dev/QA | - | 🟡 Pending |
| Full axe-core accessibility audit (authenticated pages) | High | Dev/QA | - | ✅ **COMPLETE** (8/8 pages, 0 violations) |
| Performance budget monitoring setup | Medium | DevOps | - | 🟡 Pending |
| Documentation & handoff package | Medium | Dev | - | 🟢 In Progress |
| Component library Storybook | Low | Future | - | 🔵 Future |
