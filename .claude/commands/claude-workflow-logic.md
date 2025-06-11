# Claude Workflow Logic for /project:issue

This document defines the exact logic Claude should follow when the `/project:issue <number>` command is run.

## Core Logic Flow

```python
# Pseudo-code for Claude's decision making
def handle_issue(issue_number):
    issue = fetch_issue(issue_number)
    current_state = get_current_state(issue)
    
    # Check for recent activity
    if has_new_comments_since_last_action(issue):
        handle_feedback(issue, current_state)
    
    # Progress to next state
    advance_workflow(issue, current_state)
```

## State Handlers

### 1. NEW ISSUE (status:new-issue or no status)

```bash
# Fetch issue
ISSUE_DATA=$(gh issue view $ISSUE_NUMBER --json title,body,labels,assignees,comments)

# Extract key terms for duplicate search
TITLE_KEYWORDS=$(echo "$TITLE" | head -3 words)
DUPLICATES=$(gh issue list --search "$TITLE_KEYWORDS" --state all --limit 10)

# Decision tree:
if found_exact_duplicate():
    gh issue close $ISSUE_NUMBER -c "Duplicate of #$ORIGINAL_ISSUE"
    gh issue edit $ISSUE_NUMBER --add-label "duplicate"
elif description_too_short() or missing_key_info():
    gh issue comment $ISSUE_NUMBER -b "Thanks for reporting! Could you provide:
    - Steps to reproduce
    - Expected vs actual behavior
    - Environment details"
    gh issue edit $ISSUE_NUMBER --add-label "needs-info"
elif out_of_scope():
    gh issue close $ISSUE_NUMBER -c "This is outside the scope of this project"
    gh issue edit $ISSUE_NUMBER --add-label "wontfix"
elif low_priority():
    gh issue edit $ISSUE_NUMBER --add-label "status:icebox" --remove-label "status:new-issue"
    gh issue comment $ISSUE_NUMBER -b "Valid request but not immediate priority"
else:
    gh issue edit $ISSUE_NUMBER --add-label "status:backlog" --remove-label "status:new-issue"
    # Add type label based on content
    add_type_label(issue)
```

### 2. ICEBOX (status:icebox)

```bash
# Check time in icebox
CREATED_DATE=$(gh issue view $ISSUE_NUMBER --json createdAt -q .createdAt)
DAYS_OLD=$(calculate_days_since $CREATED_DATE)

# Check for renewed interest
RECENT_COMMENTS=$(gh issue view $ISSUE_NUMBER --json comments -q '.comments[-3:]')

if days_old > 180 and no_recent_activity():
    gh issue close $ISSUE_NUMBER -c "Closing stale issue. Feel free to reopen if still needed."
elif has_community_interest() or priority_changed():
    gh issue edit $ISSUE_NUMBER --add-label "status:backlog" --remove-label "status:icebox"
    gh issue comment $ISSUE_NUMBER -b "Moving to backlog due to renewed interest"
else:
    # Stay in icebox but acknowledge review
    gh issue comment $ISSUE_NUMBER -b "Reviewed: Still valid but not immediate priority"
```

### 3. BACKLOG (status:backlog)

```bash
# Check Definition of Ready
READY_CHECKLIST = {
    "has_clear_description": len(body) > 100,
    "has_acceptance_criteria": "acceptance" in body or "criteria" in body,
    "has_technical_approach": "approach" in comments or "solution" in body,
    "no_blockers": not has_blocking_labels(),
    "estimated": has_size_label() or "points" in body
}

missing = [k for k,v in READY_CHECKLIST.items() if not v]

if not missing:
    gh issue edit $ISSUE_NUMBER --add-label "status:to-do" --remove-label "status:backlog"
    gh issue comment $ISSUE_NUMBER -b "✅ Meets Definition of Ready. Ready for development!"
else:
    gh issue comment $ISSUE_NUMBER -b "Needs before ready:
    $(format_missing_items(missing))
    Please update the issue description or add comments."
```

### 4. TO-DO (status:to-do)

```bash
# Start work
gh issue edit $ISSUE_NUMBER --add-assignee @me
gh issue edit $ISSUE_NUMBER --add-label "status:in-progress" --remove-label "status:to-do"

# Create branch
BRANCH="issue-$ISSUE_NUMBER"
git checkout -b $BRANCH || git checkout $BRANCH

# Begin implementation based on issue type
if is_bug_fix():
    # Find the bug location
    search_codebase_for_error()
    implement_fix()
elif is_feature():
    # Implement based on requirements
    analyze_requirements()
    implement_feature()
    
gh issue comment $ISSUE_NUMBER -b "Started implementation in branch \`$BRANCH\`"
```

### 5. IN-PROGRESS (status:in-progress)

```bash
# Check for existing PR
PR=$(gh pr list --head "issue-$ISSUE_NUMBER" --json number -q '.[0].number')

if [ -n "$PR" ]; then
    # PR exists, check for feedback
    REVIEWS=$(gh pr view $PR --json reviews)
    if has_change_requests():
        implement_requested_changes()
        git add -A && git commit -m "Address review feedback"
        git push
    fi
else:
    # No PR yet, check if ready
    if implementation_complete():
        # Create PR
        git add -A && git commit -m "Implement #$ISSUE_NUMBER: $TITLE"
        git push -u origin issue-$ISSUE_NUMBER
        
        PR_URL=$(gh pr create \
            --title "Fix #$ISSUE_NUMBER: $TITLE" \
            --body "Closes #$ISSUE_NUMBER\n\n## Changes\n$CHANGE_SUMMARY" \
            --assignee @me)
            
        gh issue edit $ISSUE_NUMBER --add-label "status:code-review" --remove-label "status:in-progress"
    else:
        # Continue implementation
        implement_remaining_work()
    fi
fi
```

### 6. CODE-REVIEW (status:code-review)

```bash
PR=$(gh pr list --search "$ISSUE_NUMBER" --json number,reviews,mergeable -q '.[0]')

if pr_has_approvals() and is_mergeable():
    gh pr merge $PR_NUMBER --merge
    # Auto-transitions to testing via webhook
elif has_requested_changes():
    gh issue edit $ISSUE_NUMBER --add-label "status:in-progress" --remove-label "status:code-review"
    # Implement changes (handled by IN-PROGRESS logic)
else:
    # Waiting for review
    gh pr comment $PR_NUMBER -b "Ready for review @team"
fi
```

### 7. TESTING (status:testing)

```bash
# Check CI status
WORKFLOW_RUNS=$(gh run list --limit 5 --json status,conclusion,headSha)
LATEST_RUN=$(get_run_for_issue $ISSUE_NUMBER)

if all_tests_passed():
    gh issue edit $ISSUE_NUMBER --add-label "status:ready-for-deployment" --remove-label "status:testing"
elif tests_failed():
    # Analyze failure
    FAILURE_LOGS=$(gh run view $RUN_ID --log-failed)
    
    if is_flaky_test():
        gh run rerun $RUN_ID
    else:
        # Fix the issue
        git checkout issue-$ISSUE_NUMBER
        fix_test_failures()
        git add -A && git commit -m "Fix failing tests"
        git push
        gh issue edit $ISSUE_NUMBER --add-label "status:in-progress" --remove-label "status:testing"
    fi
fi
```

### 8. READY-FOR-DEPLOYMENT (status:ready-for-deployment)

```bash
# Check if CD is configured
if has_auto_deployment():
    trigger_deployment()
    gh issue edit $ISSUE_NUMBER --add-label "status:deployed" --remove-label "status:ready-for-deployment"
else:
    gh issue comment $ISSUE_NUMBER -b "Ready for manual deployment. Run deployment when ready."
fi
```

### 9. DEPLOYED (status:deployed)

```bash
# Monitor for issues
if is_recently_deployed():
    check_error_logs()
    check_metrics()
    
    if found_regression():
        BUG_ISSUE=$(gh issue create \
            --title "Regression from #$ISSUE_NUMBER: $ERROR_DESC" \
            --body "Related to #$ISSUE_NUMBER\n\nError: $ERROR_DETAILS" \
            --label "type:bug,priority:high")
        gh issue comment $ISSUE_NUMBER -b "⚠️ Regression detected: #$BUG_ISSUE"
    else:
        gh issue comment $ISSUE_NUMBER -b "✅ Deployed successfully. No issues detected."
        gh issue close $ISSUE_NUMBER -c "Completed and deployed!"
    fi
fi
```

## Feedback Handling

When re-running on an issue in the same state:

```bash
# Get comments since last bot action
LAST_BOT_COMMENT=$(gh issue view $ISSUE_NUMBER --json comments -q '.comments[] | select(.author.login == "github-actions[bot]") | .createdAt' | tail -1)
NEW_COMMENTS=$(get_comments_since $LAST_BOT_COMMENT)

if has_new_feedback():
    case $CURRENT_STATE in
        "backlog")
            # Add requested information
            update_issue_description()
            ;;
        "in-progress")
            # Implement requested changes
            implement_feedback()
            ;;
        "code-review")
            # Address review comments
            implement_review_changes()
            ;;
    esac
fi
```

## Smart Implementation Logic

For `status:to-do` and `status:in-progress`, Claude should:

1. **Analyze Issue Type**:
   - Bug: Find root cause, implement fix, add regression test
   - Feature: Create components, implement logic, add tests
   - Enhancement: Modify existing code, maintain compatibility

2. **Follow Project Patterns**:
   ```bash
   # Search for similar implementations
   similar_files=$(gh search code "similar_pattern" --repo $REPO)
   analyze_code_style()
   follow_conventions()
   ```

3. **Write Tests**:
   ```bash
   # Find test patterns
   test_files=$(find . -name "*test*" -o -name "*spec*")
   create_appropriate_tests()
   ```

4. **Update Documentation**:
   - Update README for user-facing changes
   - Add code comments for complex logic
   - Update API docs if applicable