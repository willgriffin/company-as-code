# Template Synchronization

This document explains how to keep your repository in sync with the latest template updates while preserving your local customizations.

## Quick Start

```bash
# See what would be updated (safe)
./scripts/sync-from-template --dry-run

# Apply updates to unmodified files
./scripts/sync-from-template

# Force update a specific file even if locally modified
./scripts/sync-from-template --force-file flux/clusters/cumulus/core/traefik/release.yaml
```

## How It Works

The sync script:

1. **Adds template as remote** - Sets up `template-upstream` remote pointing to the template repo
2. **Fetches latest changes** - Gets the current state of the template
3. **Analyzes local modifications** - Compares your repo against its initial state
4. **Smart file selection** - Only updates files you haven't modified
5. **Creates backup** - Makes a backup branch before applying changes
6. **Applies updates** - Updates only the safe files

## File Categories

### ✅ Auto-Updated Files
Files that will be automatically updated if you haven't modified them:
- Documentation (README.md, docs/*)
- Scripts (scripts/*)
- Default configurations (config.yaml.example)
- Flux base configurations
- CI/CD workflows

### ⏭️ Skipped Files  
Files that are skipped if you've modified them:
- Your custom configurations
- Environment-specific files
- Any file you've edited

### ⚠️ Force Update
You can force update specific files even if modified:
```bash
./scripts/sync-from-template --force-file path/to/file
```

## Example Workflow

### Initial Setup
```bash
# Create your repo from template (via GitHub UI or CLI)
gh repo create mycompany/my-infrastructure --template willgriffin/startup-gitops-template

# Clone and setup
git clone https://github.com/mycompany/my-infrastructure.git
cd my-infrastructure

# Customize your setup
./scripts/initial-setup
# Edit config.yaml, customize values, etc.
```

### Regular Sync Process
```bash
# Check for template updates (monthly/quarterly)
./scripts/sync-from-template --dry-run

# Review what would change
# If happy with changes:
./scripts/sync-from-template

# Test your infrastructure
# If everything works, you're done!
# If issues, revert:
git reset --hard backup-before-template-sync-YYYYMMDD-HHMMSS
```

### Handling Conflicts

If you need to update a file you've modified:

```bash
# Option 1: Force update and re-apply your changes
./scripts/sync-from-template --force-file path/to/file
# Then manually re-apply your customizations

# Option 2: Manual merge
git show template-upstream/main:path/to/file > temp-template-file
# Compare and merge manually
diff path/to/file temp-template-file
```

## Best Practices

### 1. Keep Customizations Minimal
- Use `config.yaml` for environment-specific values
- Put custom resources in separate files when possible
- Document your changes in commit messages

### 2. Regular Sync Schedule
- Check for template updates monthly
- Always test in a non-production environment first
- Keep backups of working configurations

### 3. Safe File Modification Strategy
```bash
# Instead of editing flux/clusters/cumulus/core/traefik/release.yaml
# Create an overlay or patch file:
flux/clusters/cumulus/core/traefik/patches/custom-values.yaml
```

### 4. Testing After Sync
```bash
# Validate Kubernetes manifests
kubectl --dry-run=client apply -f flux/

# Test Flux build
flux build kustomization apps --path flux/clusters/cumulus/

# Check for issues
./scripts/cluster-create --dry-run
```

## Troubleshooting

### Sync Fails with Git Errors
```bash
# Reset to clean state
git reset --hard HEAD
git clean -fd

# Try sync again
./scripts/sync-from-template
```

### Need to Ignore Specific Files
Add them to `.templatesyncignore` (if you create this file):
```
# Files to never sync from template
my-custom-config.yaml
secrets/my-secrets.yaml
```

### Undo a Sync
```bash
# Find your backup branch
git branch | grep backup-before-template-sync

# Reset to backup
git reset --hard backup-before-template-sync-20241210-143022

# Clean up
git branch -d backup-before-template-sync-20241210-143022
```

## Integration with Development Workflow

### When to Sync
- After template releases new features you want
- Before major infrastructure changes
- During regular maintenance windows
- When encountering issues that might be fixed in template

### Working with Teams
```bash
# Sync on a branch for review
git checkout -b template-sync-$(date +%Y%m%d)
./scripts/sync-from-template
git push -u origin template-sync-$(date +%Y%m%d)

# Create PR for team review
gh pr create --title "Sync from template" --body "Updates from template repository"
```