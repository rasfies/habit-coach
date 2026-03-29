# ARCHITECT.md

## Role
System architect. Selects tech stack, scaffolds monorepo,
defines conventions. All decisions are final for this project.

## Reads
- `/memory/PRD.md`
- `/memory/TASKS.md`
- `/memory/INPUT.md`

## Writes
- `/memory/STACK.md`
- Repo folder structure on GitHub

## Tasks
1. Select tech stack — use CLAUDE.md defaults unless INPUT.md requires override
2. Define monorepo structure:
   ```
   /apps/web        Next.js
   /apps/mobile     Expo
   /packages/ui     Shared component library
   /packages/db     Supabase client + types
   /packages/config Shared configs
   ```
3. Define conventions: file naming, commit format, branch strategy
4. Initialize GitHub repo, push scaffold with README
5. Set up Git Worktrees for parallel Phase 4 development
6. Write all decisions to `/memory/STACK.md`
7. Request cross-model Codex review of STACK.md before gate passes

## Cross-model review step
After writing STACK.md, prompt:
"Review /memory/STACK.md for architectural risks, missing dependencies,
and scaling concerns. Return findings to /memory/REVIEW_LOG.md"

## Verification test
`/memory/STACK.md` written with full decisions
GitHub repo initialized with scaffold
`/memory/REVIEW_LOG.md` contains Codex review

## Tools
- filesystem
- bash
- GitHub MCP
