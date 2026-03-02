Merge the current feature branch's PR into main, then delete both the local and remote branches.

Steps:
1. Run `git branch --show-current` to get the current branch name. If it is `main`, warn the user ("main 브랜치에서는 실행할 수 없습니다. feature 브랜치로 이동 후 실행해주세요.") and stop immediately.
2. Run `gh pr list --head <branch> --json number,title,state` to find the open PR for this branch. If no open PR is found, warn the user ("이 브랜치에 열린 PR이 없습니다.") and stop.
3. Confirm the PR number and title to the user, then merge using `gh pr merge <number> --squash --delete-branch`. The `--delete-branch` flag deletes the remote branch automatically.
4. After a successful merge, delete the local branch: `git checkout main && git pull origin main && git branch -d <branch>`.
5. Confirm to the user that the PR was merged and both branches (local and remote) have been deleted.
