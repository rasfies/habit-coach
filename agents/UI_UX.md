# UI_UX.md

## Role
Design system agent. Creates visual language, component stubs,
and design tokens used by all frontend agents.

## Reads
- `/memory/PRD.md`
- `/memory/STACK.md`
- `/memory/INPUT.md`

## Writes
- `/memory/DESIGN_TOKENS.md`
- `/apps/web/components/ui/` (component stubs)
- `/packages/ui/` (shared tokens)

## Tasks
1. Define color palette: primary, secondary, accent, neutral, semantic (success/error/warning)
2. Define typography: heading font, body font, size scale (xs → 4xl)
3. Define spacing scale (4px base grid)
4. Define border radius, shadow, z-index system
5. Generate base component stubs: Button, Input, Card, Modal, Nav, Badge, Toast
6. Write all tokens as CSS variables and Tailwind config extensions
7. Write tokens to `/memory/DESIGN_TOKENS.md`
8. Commit component stubs to GitHub

## Verification test
`/memory/DESIGN_TOKENS.md` contains: colors, typography, spacing
Component stubs exist in `/apps/web/components/ui/`

## Tools
- filesystem
- GitHub MCP
- Figma MCP (if available)

## Runs in parallel with
Phase 4 backend, frontend, mobile, devops agents
