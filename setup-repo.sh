#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DEFAULT_REGION="nyc3"
DEFAULT_SPACES_REGION="nyc3"
DEFAULT_KEYCLOAK_REALM="master"
DEFAULT_BACKUP_RETENTION="7d"

# Get cluster name from domain (fallback)
get_cluster_name_from_domain() {
    local domain="$1"
    echo "${domain%%.*}" | tr '.' '-' | tr '[:upper:]' '[:lower:]'
}

# Function to prompt for input with validation
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local value=""
    
    if [[ -n "$default" ]]; then
        read -p "$prompt [$default]: " value
        value="${value:-$default}"
    else
        while [[ -z "$value" ]]; do
            read -p "$prompt: " value
            if [[ -z "$value" ]]; then
                echo -e "${RED}This field is required${NC}"
            fi
        done
    fi
    
    eval "$var_name='$value'"
}

# Function to validate email
validate_email() {
    local email="$1"
    local regex="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    [[ "$email" =~ $regex ]]
}

# Function to validate domain
validate_domain() {
    local domain="$1"
    local regex="^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$"
    [[ "$domain" =~ $regex ]]
}

# Function to replace placeholders in files
replace_placeholders() {
    echo -e "${BLUE}Replacing template placeholders...${NC}"
    
    # Find all relevant files and replace placeholders
    find . -type f \( -name "*.yaml" -o -name "*.yml" -o -name "*.tf" -o -name "*.md" \) \
        -not -path "./.git/*" \
        -exec grep -l "{{SETUP_REPO_" {} \; | while read -r file; do
        echo "  Processing: $file"
        
        # Use temporary file for atomic replacement
        temp_file="${file}.tmp"
        sed \
            -e "s|{{SETUP_REPO_DOMAIN}}|$SETUP_REPO_DOMAIN|g" \
            -e "s|{{SETUP_REPO_EMAIL}}|$SETUP_REPO_EMAIL|g" \
            -e "s|{{SETUP_REPO_CLUSTER_NAME}}|$SETUP_REPO_CLUSTER_NAME|g" \
            -e "s|{{SETUP_REPO_PROJECT_NAME}}|$SETUP_REPO_PROJECT_NAME|g" \
            -e "s|{{SETUP_REPO_REGION}}|$SETUP_REPO_REGION|g" \
            -e "s|{{SETUP_REPO_KEYCLOAK_REALM}}|$SETUP_REPO_KEYCLOAK_REALM|g" \
            -e "s|{{SETUP_REPO_BACKUP_RETENTION}}|$SETUP_REPO_BACKUP_RETENTION|g" \
            -e "s|{{SETUP_REPO_SPACES_REGION}}|$SETUP_REPO_SPACES_REGION|g" \
            -e "s|{{SETUP_REPO_LETSENCRYPT_EMAIL}}|$SETUP_REPO_LETSENCRYPT_EMAIL|g" \
            "$file" > "$temp_file"
        
        mv "$temp_file" "$file"
    done
    
    echo -e "${GREEN}✓ Placeholders replaced successfully${NC}"
}

# Function to create cleanup issue
create_cleanup_issue() {
    echo -e "${BLUE}Creating template cleanup issue...${NC}"
    
    local issue_body="## Template Cleanup Required

This issue was automatically created after repository setup to track cleanup of template artifacts.

### Cleanup Tasks
- [ ] Review generated configuration files
- [ ] Test deployment pipeline
- [ ] Remove template-specific files when ready
- [ ] Verify all placeholders were replaced correctly

### Eject Template Artifacts

When you're ready to remove all template artifacts and convert this to a standalone repository, run:

\`\`\`bash
./setup-repo.sh --eject
\`\`\`

This will:
- Remove the GitHub template workflow
- Delete template marker files  
- Remove example configuration files
- Clean up .gitignore entries
- Remove this setup script

/cc @claude"

    # Try to create GitHub issue if gh CLI is available
    if command -v gh >/dev/null 2>&1; then
        if gh issue create \
            --title "Template Cleanup and Eject" \
            --body "$issue_body" \
            --label "template-cleanup" 2>/dev/null; then
            echo -e "${GREEN}✓ GitHub issue created successfully${NC}"
        else
            echo -e "${YELLOW}⚠ Could not create GitHub issue (may need to authenticate with 'gh auth login')${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ GitHub CLI not found - skipping issue creation${NC}"
    fi
}

# Function to eject template artifacts
eject_template() {
    echo -e "${BLUE}Ejecting template artifacts...${NC}"
    
    # Remove template workflow
    echo "  Removing template workflow..."
    rm -f .github/workflows/setup-form.yml
    
    # Remove template marker files
    echo "  Removing template marker files..."
    rm -f .github/template.yml
    rm -f TEMPLATE_SETUP.md
    
    # Remove example files
    echo "  Removing example files..."
    rm -f config.yaml.example
    
    # Update .gitignore to remove template-specific entries
    echo "  Updating .gitignore..."
    if [[ -f .gitignore ]]; then
        # Remove template-specific gitignore entries
        sed -i '/# Template setup artifacts/,/^$/d' .gitignore 2>/dev/null || true
    fi
    
    # Remove this setup script last
    echo "  Removing setup script..."
    rm -f setup-repo.sh
    
    echo -e "${GREEN}✓ Template artifacts removed successfully${NC}"
    echo -e "${GREEN}This is now a standalone GitOps repository!${NC}"
}

# Function for interactive setup
interactive_setup() {
    echo -e "${BLUE}=== GitOps Template Setup ===${NC}"
    echo
    echo "This script will configure your repository from the template."
    echo "Press Ctrl+C at any time to cancel."
    echo
    
    # Collect configuration
    prompt_with_default "Primary domain (e.g., example.com)" "" "SETUP_REPO_DOMAIN"
    while ! validate_domain "$SETUP_REPO_DOMAIN"; do
        echo -e "${RED}Invalid domain format${NC}"
        prompt_with_default "Primary domain (e.g., example.com)" "" "SETUP_REPO_DOMAIN"
    done
    
    prompt_with_default "Admin email address" "" "SETUP_REPO_EMAIL"
    while ! validate_email "$SETUP_REPO_EMAIL"; do
        echo -e "${RED}Invalid email format${NC}"
        prompt_with_default "Admin email address" "" "SETUP_REPO_EMAIL"
    done
    
    prompt_with_default "Cluster name" "$(get_cluster_name_from_domain "$SETUP_REPO_DOMAIN")" "SETUP_REPO_CLUSTER_NAME"
    prompt_with_default "Project name" "$SETUP_REPO_CLUSTER_NAME" "SETUP_REPO_PROJECT_NAME"
    prompt_with_default "DigitalOcean region" "$DEFAULT_REGION" "SETUP_REPO_REGION"
    prompt_with_default "Keycloak realm name" "$DEFAULT_KEYCLOAK_REALM" "SETUP_REPO_KEYCLOAK_REALM"
    prompt_with_default "Backup retention period" "$DEFAULT_BACKUP_RETENTION" "SETUP_REPO_BACKUP_RETENTION"
    prompt_with_default "Spaces region" "$DEFAULT_SPACES_REGION" "SETUP_REPO_SPACES_REGION"
    prompt_with_default "Let's Encrypt email" "$SETUP_REPO_EMAIL" "SETUP_REPO_LETSENCRYPT_EMAIL"
    
    # Process the configuration
    replace_placeholders
    create_cleanup_issue
}

# Function for non-interactive setup
non_interactive_setup() {
    echo -e "${BLUE}=== GitOps Template Setup ===${NC}"
    echo
    echo "Running in non-interactive mode..."
    
    # Check required variables
    required_vars=(
        "SETUP_REPO_DOMAIN"
        "SETUP_REPO_EMAIL"
        "SETUP_REPO_CLUSTER_NAME"
        "SETUP_REPO_PROJECT_NAME"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            echo -e "${RED}Error: $var is not set${NC}"
            exit 1
        fi
    done
    
    # Set defaults for optional variables
    SETUP_REPO_REGION="${SETUP_REPO_REGION:-$DEFAULT_REGION}"
    SETUP_REPO_KEYCLOAK_REALM="${SETUP_REPO_KEYCLOAK_REALM:-$DEFAULT_KEYCLOAK_REALM}"
    SETUP_REPO_BACKUP_RETENTION="${SETUP_REPO_BACKUP_RETENTION:-$DEFAULT_BACKUP_RETENTION}"
    SETUP_REPO_SPACES_REGION="${SETUP_REPO_SPACES_REGION:-$DEFAULT_SPACES_REGION}"
    SETUP_REPO_LETSENCRYPT_EMAIL="${SETUP_REPO_LETSENCRYPT_EMAIL:-$SETUP_REPO_EMAIL}"
    
    # Validate required inputs
    if ! validate_domain "$SETUP_REPO_DOMAIN"; then
        echo -e "${RED}Error: Invalid domain format: $SETUP_REPO_DOMAIN${NC}"
        exit 1
    fi
    
    if ! validate_email "$SETUP_REPO_EMAIL"; then
        echo -e "${RED}Error: Invalid email format: $SETUP_REPO_EMAIL${NC}"
        exit 1
    fi
    
    # Process the configuration
    replace_placeholders
    create_cleanup_issue
}

# Main script logic
case "${1:-}" in
    --eject)
        eject_template
        ;;
    --non-interactive)
        non_interactive_setup
        ;;
    --help|-h)
        echo "Usage: $0 [--non-interactive|--eject|--help]"
        echo
        echo "Options:"
        echo "  --non-interactive  Use environment variables (SETUP_REPO_*)"
        echo "  --eject           Remove template artifacts"
        echo "  --help, -h        Show this help message"
        echo
        echo "Required environment variables for non-interactive mode:"
        echo "  SETUP_REPO_DOMAIN        Primary domain"
        echo "  SETUP_REPO_EMAIL         Admin email address"
        echo "  SETUP_REPO_CLUSTER_NAME  Cluster name"
        echo "  SETUP_REPO_PROJECT_NAME  Project name"
        echo
        echo "Optional environment variables:"
        echo "  SETUP_REPO_REGION             DigitalOcean region (default: $DEFAULT_REGION)"
        echo "  SETUP_REPO_KEYCLOAK_REALM     Keycloak realm (default: $DEFAULT_KEYCLOAK_REALM)"
        echo "  SETUP_REPO_BACKUP_RETENTION   Backup retention (default: $DEFAULT_BACKUP_RETENTION)"
        echo "  SETUP_REPO_SPACES_REGION      Spaces region (default: $DEFAULT_SPACES_REGION)"
        echo "  SETUP_REPO_LETSENCRYPT_EMAIL  Let's Encrypt email (default: same as SETUP_REPO_EMAIL)"
        ;;
    *)
        interactive_setup
        ;;
esac