# Template Workflow Management

This document explains how GitHub Actions workflows are managed in this template repository to prevent unwanted executions while keeping them fully functional for users.

## The Challenge

GitHub template repositories need to include workflows that:
- Should NOT run in the template repository itself
- MUST run automatically in repositories created from the template
- Should be clean and maintainable without hardcoded repository names

## The Solution: Repository Variables

This template uses GitHub Repository Variables to elegantly control workflow execution.

### How It Works

1. **In the template repository**: A repository variable `IS_TEMPLATE` is set to `true`
2. **In workflows**: Jobs check if `vars.IS_TEMPLATE != 'true'` before running
3. **In new repositories**: The variable doesn't exist, so workflows run normally

### Example

```yaml
jobs:
  deploy:
    # This job will not run if the 'IS_TEMPLATE' variable is 'true'
    if: vars.IS_TEMPLATE != 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... rest of the job
```

## Setting Up the Template Repository

If you're maintaining this template repository:

1. Go to **Settings → Secrets and variables → Actions**
2. Select the **Variables** tab
3. Click **New repository variable**
4. Create a variable named `IS_TEMPLATE` with value `true`

## Benefits

- **No hardcoded names**: Workflows don't contain specific usernames or repository names
- **Clean configuration**: Behavior is controlled through settings, not code
- **Automatic for users**: Repository variables are NOT copied when creating from template
- **Professional approach**: Separates configuration from logic

## Affected Workflows

The following workflows have automatic triggers that are disabled in the template:

- `cluster-deploy.yml` - Deploys on push to main
- `terraform-apply.yml` - Applies Terraform on push
- `secrets-management.yml` - Manages secrets on push
- `terraform-validate.yml` - Validates on pull requests
- `terraform-plan.yml` - Plans on pull requests

All workflows remain available for manual triggering via `workflow_dispatch`.

## For Template Users

When you create a repository from this template:
- You don't need to do anything special
- Workflows will run automatically as designed
- The `IS_TEMPLATE` variable won't exist in your repository
- Everything will work out of the box

## Alternative Approaches (Not Recommended)

### Hardcoded Repository Check
```yaml
if: github.repository != 'username/template-repo'
```
❌ Contains hardcoded values that don't belong in a template

### Disabling Actions
Disabling Actions in repository settings doesn't propagate to new repositories and can be confusing.

### Removing Workflow Files
This defeats the purpose of a template repository.

## Conclusion

The repository variable approach provides a clean, professional way to manage workflow execution in template repositories while ensuring a seamless experience for users creating new projects from the template.