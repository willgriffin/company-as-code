# Claude Project Issue Commands

Custom slash commands for managing GitHub issues through their workflow states. By default, these commands trigger Claude to actively perform the work, not just provide guidance.

## Primary Commands (Claude Does the Work)

### `/project:issue <issue_number>`
**Claude automatically analyzes and executes the appropriate workflow action.**

This is the main command that intelligently advances issues through the workflow:

**Behavior by State:**
- **New Issue/No Status** → Triages (search duplicates, assess clarity, move to backlog/icebox)
- **Icebox** → Reviews relevance, moves to backlog or closes if stale
- **Backlog** → Checks Definition of Ready, requests info or moves to todo
- **To-Do** → Assigns self, creates branch, starts implementation
- **In Progress** → Implements solution or creates PR when ready
- **Code Review** → Handles feedback or merges when approved
- **Testing** → Monitors CI/CD, fixes failures or advances
- **Ready for Deploy** → Triggers deployment if automated
- **Deployed** → Monitors for issues, closes when stable

**Re-run Behavior:**
When run again on the same issue, Claude checks for new comments/feedback and acts accordingly:
- Implements requested changes
- Addresses review feedback
- Updates based on new information

### `/project:issue:implement <issue_number>`
**Claude reads the issue and implements the solution.**

Claude will:
- Understand requirements from the issue
- Analyze codebase patterns
- Write the implementation
- Create tests
- Update documentation
- Prepare changes for review

### `/project:issue:triage <issue_number>`
**Claude automatically triages new issues.**

Claude will:
- Analyze issue clarity and completeness
- Search for duplicates
- Assess validity and priority
- Make and execute triage decisions
- Add appropriate labels and comments

## Guidance Commands (Instructions Only)

### `/project:issue:guide <issue_number>`
Provides context-specific guidance and suggested actions based on workflow status without Claude taking action.

**Example:**
```
/project:issue 123
```

This will:
- Fetch issue #123 from GitHub
- Detect its current status label (e.g., `status:new-issue`, `status:in-progress`)
- Provide relevant actions and commands for that specific state

## Helper Commands

### `/project:issue:triage <issue_number> <action> [options]`
Handles new issue triage actions.

**Actions:**
- `duplicate <original_issue>` - Close as duplicate of another issue
- `unclear` - Request more information
- `invalid` - Close as invalid
- `backlog` - Move to backlog (ready for prioritization)
- `icebox` - Move to icebox (valid but not current priority)

**Examples:**
```
/project:issue:triage 123 duplicate 100
/project:issue:triage 123 unclear
/project:issue:triage 123 backlog
```

### `/project:issue:start <issue_number>`
Start working on an issue from the to-do lane.

**Actions performed:**
1. Assigns the issue to you
2. Updates status from `to-do` to `in-progress`
3. Creates and checks out a feature branch named `issue-<number>`

**Example:**
```
/project:issue:start 123
```

### `/project:issue:review <issue_number> [pr_title]`
Submit work for code review.

**Actions performed:**
1. Pushes current branch to origin
2. Creates a pull request
3. Updates issue status to `code-review`

**Example:**
```
/project:issue:review 123 "Add user authentication feature"
```

### `/project:issue:transition <issue_number> <new_status>`
Manually transition an issue to any workflow state.

**Valid statuses:**
- `new-issue`
- `icebox`
- `backlog`
- `to-do`
- `in-progress`
- `code-review`
- `testing`
- `ready-for-deployment`
- `deployed`

**Example:**
```
/project:issue:transition 123 testing
```

## Workflow States

The commands follow this workflow progression:

1. **New Issues** → Triage (duplicate/unclear/invalid/backlog/icebox)
2. **Icebox** → Review relevance → Backlog or close
3. **Backlog** → Refine → To Do
4. **To Do** → Start work → In Progress
5. **In Progress** → Submit PR → Code Review
6. **Code Review** → Merge → Testing
7. **Testing** → Pass tests → Ready for Deployment
8. **Ready for Deployment** → Deploy → Deployed
9. **Deployed** → Monitor production

## Requirements

- GitHub CLI (`gh`) must be installed and authenticated
- Git repository with proper remote configuration
- Appropriate permissions to manage issues and create PRs

## Setup

These commands are automatically available in Claude when working in this repository. They follow the workflow defined in `docs/WORKFLOW.md`.