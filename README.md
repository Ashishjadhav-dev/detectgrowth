# DetectGrowth

A clean Next.js + TypeScript + Tailwind starter implementing the DetectGrowth product direction from the supplied reference.

## Stack
- Next.js 15 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS
- Lucide icons
- Reusable feature + UI component architecture

## Run
```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Quality checks
```bash
npm run typecheck
npm run build
```

## Structure
- `src/app` routes
- `src/components/ui` primitives
- `src/components/layout` shell
- `src/features` feature-level sections
- `src/data` realistic mock data
- `src/lib` shared utilities

The mock UI intentionally keeps data local and typed so an API layer can replace it later without changing presentation components.

## Backend contract
- `docs/architecture/BACKEND_OVERVIEW.md`
- `docs/architecture/API_CONTRACTS.md`
- `docs/architecture/DATABASE_SCHEMA.md`

These docs define the backend shape for the product so the implementation can stay consistent with the UI and multi-tenant model.
