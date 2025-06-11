# Workflow Command Examples

## Example 1: New Issue Triage

**User runs:** `/project:issue 123`

**Issue #123:** "Add dark mode" (no status label)

**Claude's actions:**
1. Fetches issue data
2. Searches for existing dark mode issues
3. Finds none, analyzes description
4. Sees clear requirements with mockups
5. Executes:
   ```bash
   gh issue edit 123 --add-label "status:backlog" --add-label "type:feature"
   gh issue comment 123 -b "Thanks for the feature request! This has been added to our backlog. The requirements are clear and align with our UX goals."
   ```

## Example 2: Backlog to Todo

**User runs:** `/project:issue 45`

**Issue #45:** Bug report with `status:backlog`

**Claude's actions:**
1. Checks Definition of Ready
2. Finds missing reproduction steps
3. Executes:
   ```bash
   gh issue comment 45 -b "To move this forward, we need:
   - [ ] Steps to reproduce the issue
   - [ ] Browser/OS information
   - [ ] Example code or screenshot
   
   Please update the issue description with these details."
   ```

**User adds info and runs again:** `/project:issue 45`

**Claude's actions:**
1. Sees new information in comments
2. Validates Definition of Ready is now met
3. Executes:
   ```bash
   gh issue edit 45 --add-label "status:to-do" --remove-label "status:backlog"
   gh issue comment 45 -b "✅ All information provided. Ready for development!"
   ```

## Example 3: Implementation Flow

**User runs:** `/project:issue 67`

**Issue #67:** "Fix login error" with `status:to-do`

**Claude's actions:**
1. Assigns issue and creates branch:
   ```bash
   gh issue edit 67 --add-assignee @me
   gh issue edit 67 --add-label "status:in-progress" --remove-label "status:to-do"
   git checkout -b issue-67
   ```
2. Analyzes the bug from description
3. Searches codebase for login logic
4. Finds bug in `src/auth/login.js`
5. Implements fix
6. Writes test for the edge case
7. Commits changes

**User runs again:** `/project:issue 67`

**Claude's actions:**
1. Sees issue is still in-progress
2. Checks if implementation is complete
3. Creates PR:
   ```bash
   git add -A
   git commit -m "fix: handle null user data in login flow
   
   - Add null check before accessing user properties
   - Return appropriate error message
   - Add test for null user scenario
   
   Fixes #67"
   git push -u origin issue-67
   gh pr create --title "Fix #67: Handle null user in login" --body "..."
   gh issue edit 67 --add-label "status:code-review" --remove-label "status:in-progress"
   ```

## Example 4: Handling Review Feedback

**User runs:** `/project:issue 67`

**Issue #67:** Now in `status:code-review` with PR comments requesting changes

**Claude's actions:**
1. Finds associated PR
2. Reads review comments: "Please add error logging"
3. Implements requested changes:
   ```bash
   git checkout issue-67
   # Adds logging to the error handler
   git add -A
   git commit -m "Add error logging as requested in review"
   git push
   gh pr comment 89 -b "Added error logging as requested. Ready for re-review."
   ```

## Example 5: Icebox Review

**User runs:** `/project:issue 12`

**Issue #12:** Feature request in `status:icebox` for 6 months

**Claude's actions:**
1. Checks age and activity
2. No comments in 6 months
3. Executes:
   ```bash
   gh issue close 12 -c "Closing this feature request due to inactivity. If this is still needed, please feel free to reopen with updated requirements."
   ```

## Example 6: Test Failure

**User runs:** `/project:issue 99`

**Issue #99:** In `status:testing` with failing CI

**Claude's actions:**
1. Checks CI logs
2. Finds test failure in new code
3. Executes:
   ```bash
   git checkout issue-99
   # Fixes the failing test
   git add -A
   git commit -m "Fix failing test for edge case"
   git push
   gh issue edit 99 --add-label "status:in-progress" --remove-label "status:testing"
   gh issue comment 99 -b "Fixed failing test. Changes pushed to PR."
   ```

## Key Principles

1. **Always explain actions** - Comment on issues when making decisions
2. **Check for feedback** - On re-run, look for new information
3. **Follow the workflow** - Respect the defined state transitions
4. **Be helpful** - Provide clear next steps when requesting information
5. **Implement intelligently** - Actually write code, don't just move labels