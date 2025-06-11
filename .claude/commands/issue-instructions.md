# Claude Issue Automation Instructions

When these AI-powered commands are run, Claude should take the following actions:

## For `/project:issue:auto <issue_number>`

1. **Fetch Issue Data**
   - Use `gh issue view <number> --json title,body,labels,state,comments`
   - Analyze the current status label

2. **Based on Status, Take Action**:

### If `status:new-issue` or no status:
- Search for duplicates using key terms from title
- Analyze description completeness (length, clarity, reproducibility)
- Check if it aligns with project scope
- Make decision:
  - If duplicate: Close with reference to original
  - If unclear: Comment requesting specific information
  - If out of scope: Close with polite explanation
  - If valid but not priority: Label as `status:icebox` with explanation
  - If valid and actionable: Label as `status:backlog`

### If `status:backlog`:
- Check against Definition of Ready criteria
- If missing information: Comment with specific requests
- If ready: Move to `status:to-do`

### If `status:to-do`:
- Start implementation (see `/project:issue:implement`)

### If `status:in-progress`:
- Check for uncommitted changes
- If changes exist: Prepare for review
- If no changes: Continue implementation

## For `/project:issue:implement <issue_number>`

1. **Understand Requirements**
   - Read issue description and acceptance criteria
   - Identify files that need modification
   - Understand the technical approach

2. **Create/Checkout Branch**
   ```bash
   git checkout -b issue-<number>
   ```

3. **Implementation**
   - Search codebase for similar patterns
   - Write code following existing conventions
   - Add necessary imports
   - Handle error cases

4. **Testing**
   - Identify test file locations
   - Write unit tests for new functionality
   - Ensure existing tests still pass

5. **Documentation**
   - Update README if adding user-facing features
   - Add inline documentation for complex logic
   - Update configuration examples if needed

6. **Commit Changes**
   - Stage changes
   - Commit with descriptive message referencing issue

## For `/project:issue:triage:auto <issue_number>`

1. **Initial Analysis**
   ```bash
   ISSUE_DATA=$(gh issue view <number> --json title,body,labels)
   ```

2. **Duplicate Check**
   - Extract key terms from title (first 3-5 significant words)
   - Search: `gh issue list --search "<terms>" --state all`
   - If high similarity found: Close as duplicate

3. **Clarity Assessment**
   - For bugs: Check for steps to reproduce, expected vs actual
   - For features: Check for use case, acceptance criteria
   - If missing: Request specific information

4. **Validity Check**
   - Does it align with project goals?
   - Is it technically feasible?
   - Is it a genuine issue or misunderstanding?

5. **Priority Decision**
   - Security issues → `status:backlog` + `priority:high`
   - Breaking bugs → `status:backlog` + `priority:high`
   - Minor enhancements → `status:icebox`
   - Feature requests → Assess value vs effort

6. **Execute Decision**
   - Apply appropriate labels
   - Add explanatory comment
   - Update issue state if needed

## Important Patterns

1. **Always explain decisions** - When closing or moving issues, provide clear reasoning
2. **Be helpful** - When rejecting, suggest alternatives if possible
3. **Search before creating** - Always check for existing similar code/issues
4. **Follow conventions** - Match existing code style and patterns
5. **Test everything** - Ensure changes don't break existing functionality

## Example Behavior

When running `/project:issue:auto 123` on a new issue titled "Add dark mode":

1. Claude searches for existing dark mode issues
2. Finds none, analyzes the description
3. Sees it has clear requirements and mockups
4. Labels it `status:backlog` and `type:feature`
5. Comments: "Thanks for the suggestion! This feature request has been added to our backlog. The requirements are clear and align with our UX goals."

When running `/project:issue:implement 123` on a "Fix login error" issue:

1. Claude reads that login fails with 500 error
2. Searches for login-related files
3. Finds the bug in error handling
4. Implements proper error catching
5. Adds test for the error case
6. Commits with message "fix: handle null user data in login flow"