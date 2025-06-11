# Definition of Ready

## Overview

An issue is considered "Ready" when it contains sufficient information and context for a developer to begin work without significant clarification or discovery. This definition ensures efficient development and reduces context switching.

## Criteria

### 1. User Story / Problem Statement
- [ ] Clear description of the problem being solved or feature being added
- [ ] User story follows format: "As a [user type], I want [goal] so that [benefit]" (for features)
- [ ] For bugs: Steps to reproduce, expected behavior, and actual behavior are documented

### 2. Acceptance Criteria
- [ ] Specific, measurable conditions that must be met for the issue to be considered complete
- [ ] Written in clear, testable language
- [ ] Edge cases and error scenarios are considered
- [ ] Performance requirements specified (if applicable)

### 3. Technical Approach
- [ ] High-level technical approach is defined or discussed
- [ ] Major architectural decisions are documented
- [ ] Dependencies on other issues or external systems are identified
- [ ] Breaking changes or migration requirements are noted

### 4. Design Assets (if applicable)
- [ ] UI mockups or wireframes provided for frontend changes
- [ ] API contracts defined for backend changes
- [ ] Database schema changes documented

### 5. Estimation
- [ ] Relative complexity estimated (e.g., story points, t-shirt sizes)
- [ ] Time estimate provided if using time-based planning

### 6. No Blockers
- [ ] All dependencies are resolved or have clear timelines
- [ ] Required permissions or access are available
- [ ] Prerequisite issues are completed or in progress

### 7. Testing Considerations
- [ ] Test scenarios outlined
- [ ] Test data requirements identified
- [ ] Integration test requirements specified

## Examples

### Good Acceptance Criteria
 "When a user clicks the 'Export' button, a CSV file containing all visible table data should download with columns matching the table headers"

### Poor Acceptance Criteria
L "Add export functionality"

### Good Bug Report
 
```
Steps to Reproduce:
1. Navigate to /dashboard
2. Click on "Add Widget"
3. Select "Chart" type
4. Click "Save" without entering a name

Expected: Validation error appears
Actual: Application crashes with 500 error
```

### Poor Bug Report
L "Dashboard is broken"

## Workflow Integration

Issues meeting this Definition of Ready can be moved from "Backlog" to "To Do" status, indicating they are ready for development to begin.