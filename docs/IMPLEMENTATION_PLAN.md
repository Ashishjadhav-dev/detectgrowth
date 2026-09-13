# DetectGrowth implementation plan

## Foundation
- Keep App Router, TypeScript strict mode, Tailwind tokens, and feature-first structure.
- UI primitives live in `src/components/ui`; feature compositions live in `src/features`.
- Mock domain data stays typed in `src/data` and can later be replaced by server/API adapters.

## Implemented routes
- `/dashboard`
- `/discover`
- `/opportunities/[id]`
- `/companies/[id]`
- `/people`
- `/signals`
- `/research`
- `/lists`
- `/icp`
- `/integrations`
- `/settings`

## Next production milestones
1. Add real filter state, sorting, pagination, and URL search params.
2. Add mobile navigation drawer and collapsed tablet sidebar.
3. Add API/query layer and authenticated server boundaries.
4. Add per-feature empty/error/partial-data states and toasts.
5. Add unit/component/e2e tests and Storybook or equivalent component QA.
6. Run visual regression at 1440, 1280, 1024, 768, and 390 px.
7. Run accessibility checks and keyboard-flow audit to WCAG AA.
