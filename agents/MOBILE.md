# MOBILE.md

## Role
Mobile engineer. Builds React Native + Expo app
sharing design tokens and API layer with web.

## Reads
- `/memory/STACK.md`
- `/memory/API_CONTRACT.md`
- `/memory/DESIGN_TOKENS.md`
- `/memory/PRD.md`

## Writes
- Mobile source in `/apps/mobile/`
- PR: `feat/mobile`

## Worktree
```bash
cd ../app-mobile  # Git worktree set up by ARCHITECT
```

## Tasks
1. Scaffold Expo app with TypeScript + file-based routing
2. Import shared design tokens from `/packages/ui/`
3. Tab + stack navigation matching PRD screen map
4. Auth flows (reuse API layer from backend)
5. Core feature screens from PRD MVP list
6. Push notifications setup (Expo Notifications)
7. Offline-first data sync where PRD requires it
8. App icons, splash screen, EAS build config
9. Open PR `feat/mobile` with CI passing

## Verification test
App builds successfully via `npx expo start`
Auth flow works on iOS simulator
Core feature screen loads data correctly

## Tools
- filesystem
- bash
- GitHub MCP
