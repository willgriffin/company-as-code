# Claude Issue Command

Simple, powerful issue management that automatically advances issues through the complete workflow.

## Command

### `/issue <issue_number>`

**Claude automatically analyzes and executes the appropriate workflow action.**

This command intelligently advances issues through the workflow by detecting the current state and performing the next appropriate action:

**Workflow Progression:**
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
When run again on the same issue, Claude checks for new comments/feedback and acts accordingly.

## Examples

```
/issue 1    # Analyze and advance issue #1
/issue 22   # Work on issue #22
```

## Setup

This command automatically follows the workflow defined in `WORKFLOW.md` and requires:
- GitHub CLI (`gh`) authenticated
- Git repository with proper remote configuration
- Appropriate permissions to manage issues and create PRs