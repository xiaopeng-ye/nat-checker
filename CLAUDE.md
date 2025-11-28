# nat-checker Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-20

## Active Technologies

- TypeScript 5+ (strict mode), Node.js 20+ LTS + Next.js 6 (App Router), React 19, shadcn/ui, Tailwind CSS 4, WebRTC APIs (native browser) (001-nat-checker)

## Project Structure

```
src/
tests/
```

## Commands

pnpm test && pnpm run lint

## Code Style

TypeScript 5+ (strict mode), Node.js 20+ LTS: Follow standard conventions

## Styling Standards (Constitution III)

**IMPORTANT**: When using Tailwind CSS 4 and shadcn components:

- ALWAYS use CSS variables from `/app/globals.css` (e.g., `bg-background`, `text-foreground`, `border-border`)
- NEVER hardcode colors (avoid `bg-white`, `text-black`, `bg-[#ffffff]`, etc.)
- Use semantic tokens: `primary`, `secondary`, `muted`, `accent`, `destructive`, `card`, `popover`
- Use radius variables: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` (avoid `rounded-[8px]`)
- Support dark mode with `.dark` class and CSS variables
- For charts, use `--chart-1` through `--chart-5`
- For sidebars, use `--sidebar-*` tokens

**Rationale**: Ensures theme consistency, runtime theme switching, and proper dark mode support

## Recent Changes

- 001-nat-checker: Added TypeScript 5+ (strict mode), Node.js 20+ LTS + Next.js 6 (App Router), React 19, shadcn/ui, Tailwind CSS 4, WebRTC APIs (native browser)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
