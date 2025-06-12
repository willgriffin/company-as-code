# PR Workflow Command

This command follows the established workflow for managing pull requests according to the project's Kanban workflow.

## Usage
```
/pr <pr_number>
```

## Description
Manages a pull request through the workflow stages, updating labels and project status as appropriate.

## Instructions for Claude

When this command is used with a PR number:

1. **Get PR Information**
   - Use `gh pr view <pr_number>` to get the current PR status, labels, and details
   - Check if the PR is draft, ready for review, or merged

2. **Follow Workflow Progression**
   Based on current PR state and labels:
   
   - **New PR (no status label)**: Add `status:code-review` label
   - **Draft PR**: Add `status:in-progress` label
   - **Ready for Review**: Add `status:code-review` label
   - **Approved PR**: Add `status:ready-for-deployment` label
   - **Merged PR**: Add `status:deployed` label and remove other status labels

3. **Update Project Board**
   - Move the associated issue(s) to the corresponding status column
   - Link PR to related issues if not already linked

4. **Review Management**
   - If PR needs review and no reviewers assigned, suggest adding reviewers
   - Check for failing CI/CD checks and report status
   - Verify all conversations are resolved if approved

5. **Provide Status Summary**
   Give a concise summary of:
   - Current PR status and workflow stage
   - Any actions taken (labels added/removed)
   - Next steps or blockers
   - Related issues and their status

## Workflow Stage Mapping

| PR State | Workflow Label | Project Status | Next Action |
|----------|----------------|----------------|-------------|
| Draft | `status:in-progress` | In Progress | Complete development |
| Ready for Review | `status:code-review` | Code Review | Request/await review |
| Approved | `status:ready-for-deployment` | Ready for Deployment | Merge PR |
| Merged | `status:deployed` | Deployed | Close related issues |

## Example Usage

```
/pr 123
```

This will:
1. Check PR #123 status
2. Update appropriate workflow labels
3. Move related issues on project board
4. Report current status and next steps