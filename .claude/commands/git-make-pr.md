Commit all changes on the current feature branch and open a pull request with a structured Korean description.

Steps:
1. Run `git branch --show-current` to check the current branch. If it is `main`, warn the user ("feature 브랜치에서 실행해야 합니다. main 브랜치에서는 PR을 만들 수 없습니다.") and stop immediately — do not proceed.
2. Run `git status` and `git diff --stat HEAD` to review what changed.
3. Before staging, check for sensitive files (`.env`, `.env.*`, `*credentials*`, `*secret*`). If any are present, warn the user and exclude them from staging.
4. Stage all remaining changes with `git add -A` (excluding any sensitive files identified above).
5. Compose a concise commit message in imperative form using conventional commits prefix (`feat`, `fix`, `refactor`, `docs`, `test`, or `chore`) based on what was implemented in this session. Example: `feat: add quest detail page`.
6. Commit with the composed message and append the Co-Authored-By trailer:
   ```
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```
7. Push the branch to origin. Use `git push -u origin <branch>` if it has no upstream yet, otherwise `git push`.
8. Create a PR with `gh pr create` using:
   - **Title**: concise feature summary under 70 characters (English, imperative)
   - **Body** (Korean, structured):
     ```
     ## 구현 내용
     <구현한 항목을 bullet point로 정리>

     ## 리뷰 포인트
     <주요 설계 결정, 비직관적인 로직, 꼼꼼히 봐야 할 부분>

     ## 테스트
     <변경 사항이 제대로 동작하는지 확인하는 방법>

     🤖 Generated with [Claude Code](https://claude.com/claude-code)
     ```
9. Print the PR URL returned by `gh pr create` for the user.
