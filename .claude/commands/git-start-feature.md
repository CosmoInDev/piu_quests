Start a new feature branch from the latest main following gitflow strategy.

Steps:
1. Run `git status` to check for uncommitted changes. If there are any, warn the user and stop — do not proceed until the working tree is clean.
2. Run `git checkout main` to switch to the main branch.
3. Run `git pull origin main` to ensure main is up to date.
4. Ask the user for the feature name if not provided as an argument (`$ARGUMENTS`). The feature name should be short, lowercase, hyphen-separated (e.g. `quest-detail-page`).
5. Create and switch to a new branch named `feature/<name>` (e.g. `feature/quest-detail-page`).
6. Confirm to the user which branch was created and that they are now on it.
