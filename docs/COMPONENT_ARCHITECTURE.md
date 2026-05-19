# Component Architecture

## Folder Structure

```
components/
  ui/              # Primitive, reusable UI atoms
    Button/
    Card/
    Input/
    Modal/
    Badge/
    ProgressBar/
    Icon/
    LanguageSwitcher/
    Spinner/
    index.ts

  layout/          # Layout wrappers and page shells
    AppLayout/
    AdminLayout/
    index.ts

  feature/         # Domain-specific feature components
    auth/
    quiz/
    onboarding/
    results/
    history/
    admin/
    index.ts

  providers/       # React context providers
    LanguageProvider/
    index.ts
```

## Rules

1. Every component lives in its own folder.
2. Every component folder exports its component and types via `index.ts`.
3. Prefer path aliases (`@/components/...`) over deep relative imports.
4. Use `React.lazy` + `Suspense` for heavy or route-specific components.
5. UI primitives should be stateless and configurable via props.
6. Business logic belongs in providers/hooks, not in UI primitives.

## Adding a New Component

Run the generator script:

```bash
npx tsx scripts/generate-component.ts ui MyComponent
```

Then update the parent category `index.ts` to include the new export.
