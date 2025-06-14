---
name: issue
description: Smart issue management - analyze and advance issues through workflow, or create new issues
usage: /issue <issue_number> OR /issue "<description>"
---

# Issue Workflow Command

Analyzes the current state of a GitHub issue and automatically advances it to the next appropriate workflow stage, or creates a new issue from a description.

## Usage
```
/issue <issue_number>
/issue "<description>"
```

### Create New Issue
When passed a string description instead of a number:
- Analyze the description to understand the request
- Generate appropriate title, body, and labels
- Create the issue using `gh issue create`
- Apply initial `status:new-issue` label
- Return the new issue number and URL

### Manage Existing Issue
When passed an issue number:

## Behavior by Current Status

**NEW ISSUE or NO STATUS:**
- Search for duplicates using title keywords
- Assess clarity (check for repro steps, acceptance criteria)
- Determine validity for this project
- Decision: close as duplicate/invalid, request info, or move to icebox/backlog
- If issue is clear, valid, and actionable now: automatically progress to backlog
- If not ready to progress: add comment explaining what's missing or unclear

**ICEBOX:**
- Check latest comments for priority changes
- Assess if still relevant to project
- Decision: close as stale, keep in icebox with update, or move to backlog

**BACKLOG:**
- Check Definition of Ready (acceptance criteria, estimates, gameplan, no blockers)
- Look for clarifying comments
- If acceptance criteria missing: analyze issue and generate reasonable defaults based on problem description and proposed solution
- If estimation missing: provide complexity estimate (S/M/L) based on scope analysis
- If implementation gameplan missing: create detailed gameplan comment on issue outlining approach, key changes, and considerations
- Decision: request missing info or move to todo
- If Definition of Ready is met: automatically progress to todo
- If not ready to progress: add comment explaining what's needed for Definition of Ready

**TO-DO:**
- Review existing implementation gameplan from backlog stage
- If clarification needed on gameplan: add comment with questions for discussion
- Wait for gameplan finalization if questions exist
- Once gameplan is finalized:
  - Create feature branch from main (`feature/<issue-description>`)
  - Automatically assign to self
  - Move to in-progress  
  - Begin full implementation following the agreed gameplan

**IN-PROGRESS:**
- Check for review comments or feedback
- If re-running, implement requested changes
- If ready, create PR and move to code-review

**CODE-REVIEW:**
- Send review request to copilot for the PR
- Check PR review status
- If changes requested, implement them
- If approved but not merged, check why
- If merged, should auto-move to testing

**TESTING:**
- Check CI/CD pipeline status
- If failed, analyze errors and fix or create bug issue
- If passed, move to ready-for-deployment

**READY-FOR-DEPLOYMENT:**
- Check deployment readiness
- Trigger deployment if automated
- Move to deployed

**DEPLOYED:**
- Check for production issues
- Create follow-up bugs if needed
- Mark complete if stable

## Re-run Behavior
When run again on the same issue, checks for new comments/feedback and acts accordingly:
- Implements requested changes
- Addresses review feedback
- Updates based on new information

## Examples

### Managing existing issue
```
/issue 1
```
This will analyze issue #1, determine its current state, and take the appropriate action to advance it through the workflow according to WORKFLOW.md.

### Creating new issue
```
/issue "Add dark mode toggle to user settings"
```
This will create a new issue with an appropriate title and body, apply initial labels, and return the issue number.

```
/issue "The login form doesn't work on mobile Safari - users can't submit credentials"
```
This will create a bug report with relevant details and appropriate bug labels.