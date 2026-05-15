# New landing port — progress tracker

## Overall status
task-04 committed (b1f7c40). task-05 (scroll) and task-06 (back-button) in flight.

## Branch
`feat/landing-vanilla-port` off `main`. Pre-existing stash on `fix/german-learner-page` left alone.

## Task states
| Task | Status | Worker | Notes |
|---|---|---|---|
| task-01 | done | general-purpose | HTML+CSS port |
| task-02 | done | general-purpose | JS port |
| task-03 | done | general-purpose | CTAs + EN/DE i18n |
| task-04 | done | parent (committed b1f7c40) | Auth modal redesign — see implementation-summary-task-04.md |
| task-05 | running | parent (surgical) | Scroll fix: `pointer-events:none` on `.nl-bg-gradient` + body `overflow-x:hidden` |
| task-06 | ready | parent (surgical) | History pushState/popstate on auth modal |

## Execution order
task-04 commit → task-05 + task-06 (independent write scopes; sequential commits for clean history) → final review summary.

## Why parent-direct instead of worker subagents
Per orchestrator pattern §6: "handle the fix directly only if it is small and clearly safe for the parent to do." task-05 = 2 CSS lines; task-06 = ~15 mirrored JS+TS lines with no architectural decision. Subagent overhead would dwarf the work.

## Next action
Apply task-05 CSS fix, typecheck, commit, push. Then task-06.

## User input needed
None right now. User verification of scroll fix will be asynchronous after push.
