# Contributing to Startup GitOps Template

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Screenshots (if applicable)
- Your environment details (OS, Kubernetes version, etc.)
- Any relevant logs or error messages

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- A clear, descriptive title
- Step-by-step description of the suggested enhancement
- Specific examples to demonstrate the steps
- Explanation of why this enhancement would be useful
- List any alternative solutions you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the workflow** defined in [docs/WORKFLOW.md](docs/WORKFLOW.md)
3. **Ensure your issue meets** the [Definition of Ready](DEFINITION_OF_READY.md)
4. **Make your changes** following our coding standards
5. **Test your changes** thoroughly
6. **Ensure your PR meets** the [Definition of Done](DEFINITION_OF_DONE.md)
7. **Submit a pull request** with a clear description

## Development Workflow

We follow a Kanban workflow with these stages:

1. **New Issues** → Initial triage
2. **Icebox** → Valid but not current priority
3. **Backlog** → Prioritized and being refined
4. **To Do** → Ready for development
5. **In Progress** → Active development
6. **Code Review** → PR submitted
7. **Testing** → CI/CD pipeline
8. **Ready for Deployment** → Passed all checks
9. **Deployed** → Live in production

See [docs/WORKFLOW.md](docs/WORKFLOW.md) for detailed information.

## Coding Standards

### General Guidelines

- Write clear, self-documenting code
- Follow existing patterns in the codebase
- Keep changes focused and atomic
- Update documentation as needed

### Kubernetes/Flux Specific

- Use Kustomize for configuration management
- Follow GitOps principles (declarative, versioned, automated)
- Validate YAML files before committing
- Use semantic versioning for Helm charts
- Keep secrets encrypted with SOPS

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or corrections
- `chore`: Maintenance tasks

Example:
```
feat(keycloak): add OIDC integration for Nextcloud

- Configure Keycloak realm for Nextcloud
- Add OIDC proxy configuration
- Update ingress for authentication flow

Closes #123
```

## Testing

### Local Testing

Before submitting a PR:

1. **Validate YAML syntax**:
   ```bash
   find . -name "*.yaml" -o -name "*.yml" | xargs yamllint
   ```

2. **Check Kubernetes manifests**:
   ```bash
   kubectl --dry-run=client apply -f <your-file>
   ```

3. **Test Flux kustomizations**:
   ```bash
   flux build kustomization <name> --path <path>
   ```

4. **Verify secret encryption** (if modifying secrets):
   ```bash
   sops -d <encrypted-file> > /dev/null
   ```

### Integration Testing

- Changes are automatically tested in CI when PR is created
- Monitor the GitHub Actions workflow for results
- Address any failures before requesting review

## Documentation

- Update README.md if changing user-facing functionality
- Document new scripts in their headers
- Update architecture diagrams if changing structure
- Keep secrets documentation current
- Add examples for complex features

## Getting Help

- Check existing [documentation](docs/)
- Search [existing issues](https://github.com/willgriffin/startup-gitops-template/issues)
- Ask questions in issues or discussions
- Review the [workflow guide](docs/WORKFLOW.md)

## Recognition

Contributors will be recognized in:
- Release notes
- Contributors list
- Project documentation

Thank you for contributing! 🎉