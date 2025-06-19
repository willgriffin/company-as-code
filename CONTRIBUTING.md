# Contributing to Enterprise GitOps Template

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing to the enterprise-grade GitOps template.

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

## Development Environment

### Prerequisites

Before contributing, ensure you have the following tools installed:

- **Node.js 22+** - Required for CDKTF infrastructure and setup scripts
- **PNPM** - Package manager for monorepo workspace
- **Docker** - For testing and development containers
- **kubectl** - Kubernetes CLI for cluster interaction
- **flux** - GitOps CLI for Flux operations

```bash
# Verify prerequisites
node --version    # Should be 22.0.0 or higher
pnpm --version    # Install with: npm install -g pnpm
docker --version
kubectl version --client
flux version --client
```

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/your-repo.git
   cd your-repo
   ```

2. **Install dependencies**:
   ```bash
   # Root dependencies (for setup script)
   pnpm install
   
   # Platform dependencies (for CDKTF)
   cd platform
   pnpm install
   cd ..
   ```

3. **Set up development configuration**:
   ```bash
   # Copy example configuration
   cp platform/config.json.example platform/config.json
   
   # Edit configuration for your development environment
   # Use minimal resources for cost-effective development
   ```

## Coding Standards

### General Guidelines

- Write clear, self-documenting code
- Follow existing patterns in the codebase
- Keep changes focused and atomic
- Update documentation as needed
- Use TypeScript for type safety where applicable

### CDKTF/Infrastructure Code

- **Type Safety**: Use TypeScript for all infrastructure code
- **Validation**: Implement Zod schemas for configuration validation
- **Resource Naming**: Follow consistent naming patterns across stacks
- **Documentation**: Include JSDoc comments for complex infrastructure logic
- **Testing**: Write unit tests for CDKTF constructs

### Kubernetes/GitOps Specific

- Use Kustomize for configuration management
- Follow GitOps principles (declarative, versioned, automated)
- Validate YAML files before committing
- Use External Secrets Operator (not SOPS) for secret management
- Use Kong Gateway HTTPRoute resources instead of legacy Ingress
- Follow CloudNativePG patterns for database clusters

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

1. **Install and validate dependencies**:
   ```bash
   # Install all dependencies
   pnpm install
   cd platform && pnpm install && cd ..
   
   # Run type checking
   cd platform && pnpm run type-check && cd ..
   ```

2. **Validate YAML syntax**:
   ```bash
   find manifests -name "*.yaml" -o -name "*.yml" | xargs yamllint
   ```

3. **Check Kubernetes manifests**:
   ```bash
   kubectl --dry-run=client apply -f <your-file>
   ```

4. **Test Flux kustomizations**:
   ```bash
   flux build kustomization <name> --path <path>
   ```

5. **Validate CDKTF configuration**:
   ```bash
   cd platform
   npx cdktf synth  # Validate TypeScript compilation and Terraform generation
   npx cdktf plan   # Preview infrastructure changes (if connected to cloud)
   ```

6. **Test External Secrets (if modifying secrets)**:
   ```bash
   # Validate ExternalSecret resources
   kubectl --dry-run=client apply -f manifests/applications/*/externalsecret.yaml
   
   # Check secret store configurations
   kubectl --dry-run=client apply -f manifests/infrastructure/external-secrets.yaml
   ```

7. **Validate configuration schema**:
   ```bash
   cd platform
   npx tsx -e "
     import { validateConfig } from './src/config/schema';
     import config from './config.json';
     console.log('Config validation:', validateConfig(config));
   "
   ```

### Integration Testing

- Changes are automatically tested in CI when PR is created
- Monitor the GitHub Actions workflow for results
- Address any failures before requesting review

## Documentation

When contributing changes, ensure documentation is updated:

- **README.md**: Update for user-facing functionality changes
- **Architecture Documentation**: Update [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for structural changes
- **Deployment Guide**: Update [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for setup process changes
- **Application Guide**: Update [docs/APPLICATIONS.md](docs/APPLICATIONS.md) for application modifications
- **Secret Management**: Update [docs/SECRETS.md](docs/SECRETS.md) for External Secrets changes
- **Configuration Guide**: Update [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for schema changes
- **Script Documentation**: Add JSDoc headers for new TypeScript functions
- **Inline Comments**: Document complex CDKTF constructs and Kubernetes configurations

### Documentation Standards

- Use clear, concise language
- Include code examples for complex procedures
- Update version numbers when changing tool requirements
- Add troubleshooting sections for common issues
- Include links between related documentation sections

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