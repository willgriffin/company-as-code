---
name: issue
description: Smart issue management - analyze and advance issues through workflow
usage: /issue <issue_number>
---

# Issue Workflow Command

Analyzes the current state of a GitHub issue and automatically advances it to the next appropriate workflow stage.

## Usage
```
/issue <issue_number>
```

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
- Check Definition of Ready (acceptance criteria, estimates, no blockers)
- Look for clarifying comments
- Decision: request missing info or move to todo
- If Definition of Ready is met: automatically progress to todo
- If not ready to progress: add comment explaining what's needed for Definition of Ready

**TO-DO:**
- Add implementation plan as comment if one doesn't exist
- If confidence in approach is low: add comment explaining concerns and questions
- Automatically assign to self
- Create feature branch (`issue-<number>`)
- Move to in-progress  
- Immediately begin full implementation (analyze codebase, implement solution, write tests, prepare for review)

**IN-PROGRESS:**
- Check for review comments or feedback
- If re-running, implement requested changes
- If ready, create PR and move to code-review

**CODE-REVIEW:**
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

## Example
```
/issue 1
```

This will analyze issue #1, determine its current state, and take the appropriate action to advance it through the workflow according to WORKFLOW.md.