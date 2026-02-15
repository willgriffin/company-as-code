# Kanban CI/CD Workflow Specification

This document specifies the end-to-end workflow for managing issues within a Kanban system, from initial creation through to deployment. An "issue" represents any single unit of work, such as a feature, bug fix, or enhancement.

The flow is designed to ensure that work is properly vetted, prioritized, and developed with high quality, leveraging automation wherever possible. Each lane in the Kanban board has a distinct purpose and a defined set of actions to guide the process.

## Project Setup and Automation

To implement this workflow effectively in a tool like GitHub, specific setup is required for the repository and its associated project board. This section outlines the necessary labels, board configuration, and automation rules that enable the workflow.

### Label Conventions

A consistent labeling strategy is crucial for categorization and automation.

**Status Labels:**
These labels directly correspond to the lanes on the Kanban board and drive the automation. The `status:` prefix is used for clarity and to easily target these labels in scripts.

* `status:new-issue`
* `status:icebox`
* `status:backlog`
* `status:to-do`
* `status:in-progress`
* `status:code-review`
* `status:testing`
* `status:ready-for-deployment`
* `status:deployed`

**Type Labels:**
These labels provide metadata about the nature of the work.

* `type:bug`
* `type:feature`
* `type:enhancement`
* `type:tech-debt`
* `type:epic`

### Project Board Configuration

The project board is the visual representation of this workflow.

1. Create a new Project and select the **Board** layout.
2. Configure the board's columns to be grouped by a custom field. Create a new **Single select** field named `Status`.
3. Add options to the `Status` field that exactly match the names of the workflow lanes (e.g., "New Issues", "Icebox", "In Progress", etc.). This links the visual columns to a data field on the issue.

### Automation Workflows

To ensure dragging cards and changing labels are always in sync, two key automations should be implemented.

**Workflow 1: Lane Change Updates Label**
This ensures that manually dragging a card on the board updates the corresponding issue's label.

* **Trigger:** An item's `Status` field is changed within the project (this happens when a card is dragged to a new column).
* **Action:**
  1. Remove any existing `status:*` labels from the corresponding issue.
  2. Add the new `status:` label that matches the new column name (e.g., moving to the "In Progress" column adds the `status:in-progress` label).
* **Note:** This is often a built-in, configurable automation in modern project management tools like GitHub Projects.

**Workflow 2: Label Change Updates Lane**
This allows for updating an issue's status from anywhere (e.g., the issue page, a script) by simply changing its label.

* **Trigger:** A label with the prefix `status:` is added to an issue that is part of the project.
* **Action:**
  1. Update the issue's `Status` field in the project to match the name of the added label (e.g., adding the `status:code-review` label sets the `Status` field to "Code Review", automatically moving the card).
* **Note:** This typically requires a custom workflow, such as a GitHub Actions YAML file.

## Triage Lanes

Triage lanes are used to process, evaluate, and prioritize incoming work before it is committed to active development.

### New Issues

This is the single entry point for all new work. The primary goal here is to perform initial triage, ensuring the issue is valid, clear, and actionable.

### Icebox

This lane holds valid issues that are not a priority for the immediate future. It prevents backlog clutter while retaining potentially valuable ideas.

### Backlog

This is the prioritized list of work that has been vetted and is ready for development consideration. The goal is to refine the items at the top of the backlog to ensure they are fully ready to be worked on.

## Development & CI/CD Lanes

These lanes represent the active workflow for developing, testing, and deploying an issue.

### To Do / Ready for Dev

This lane contains fully refined and prioritized issues that are ready for a developer to begin working on. Each issue should have an implementation gameplan already established.

### In Progress

This is the active development stage. The goal is to write high-quality code, create corresponding tests, and prepare the work for a peer review.

### Code Review

The submitted Pull Request (PR) is reviewed by peers. The goal is to ensure code quality, correctness, and adherence to team standards before it is merged.

### Testing (QA)

The CI (Continuous Integration) pipeline automatically builds and tests the merged code. The goal is to catch any integration errors or regressions before deployment.

### Ready for Deployment

The code has passed all automated checks and is staged to be released to the production environment.

### Deployed

The work is now live in production. The final goal is to monitor for any unexpected issues resulting from the change.