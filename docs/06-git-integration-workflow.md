# Git Integration Workflow (No Pull Requests)

This project uses one feature branch per member and a shared `integration/mvp` branch. Pull requests are optional for this workflow, but only one designated integrator should update `integration/mvp`.

## Branches

| Member | Branch |
| --- | --- |
| Member 1 | `feature/member-1-teacher-shell-content` |
| Member 2 | `feature/member-2-assessment-speech` |
| Member 3 | `feature/member-3-reading-engine` |
| Member 4 | `feature/member-4-results-progress` |
| Shared integration | `integration/mvp` |

Recommended integration order:

```text
Member 1 → Member 3 → Member 2 → Member 4
```

## Start Member 3's branch

Create the branch from the latest integrated code:

```powershell
git fetch origin
git switch -c feature/member-3-reading-engine origin/integration/mvp
```

If the branch already exists locally, update it instead:

```powershell
git fetch origin
git switch feature/member-3-reading-engine
git merge origin/integration/mvp
```

## Member 3: Commit and push

Confirm the correct branch first:

```powershell
git branch --show-current
git status
```

The expected branch is:

```text
feature/member-3-reading-engine
```

Stage only Member 3's owned files. Do not use `git add .`:

```powershell
git add lib/reading
git status
```

Run the project checks:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Commit and push the feature branch:

```powershell
git commit -m "Build reading engine and fixtures"
git push -u origin feature/member-3-reading-engine
```

Member 3 should then tell the designated integrator that the branch is ready. Member 3 should not push directly to `integration/mvp` or `main`.

## Integrator: Merge Member 3

The integrator updates `integration/mvp`, merges Member 3, validates the combined code, and pushes the integration branch:

```powershell
git fetch origin
git switch integration/mvp
git pull --ff-only origin integration/mvp
git merge --no-ff origin/feature/member-3-reading-engine -m "Merge Member 3 reading engine"

npm.cmd test
npm.cmd run lint
npm.cmd run build

git push origin integration/mvp
```

If a merge conflict occurs, do not push until the conflict is resolved and all checks pass.

## Members 2 and 4

Members 2 and 4 follow the same workflow after the preceding member has been integrated:

1. Fetch from `origin`.
2. Create or update their feature branch from `origin/integration/mvp`.
3. Work only in their assigned files.
4. Stage specific files and review `git status`.
5. Run tests, lint, and build.
6. Commit and push their feature branch.
7. Ask the designated integrator to merge it into `integration/mvp`.

## Safety rules

- Only the designated integrator pushes `integration/mvp`.
- No member pushes directly to `main`.
- Never force-push shared branches.
- Pull the latest `integration/mvp` immediately before each merge.
- Merge and validate one member at a time.
- Review `git status` before every commit.
- Keep `.env` local; never commit Supabase secrets.
- Stage only files owned by that member.
