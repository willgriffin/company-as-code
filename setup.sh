#!/usr/bin/env bash
set -euo pipefail

# GitOps Template Setup Script Wrapper
# This script provides a fallback mechanism for running the TypeScript setup script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[setup]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[setup]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[setup]${NC} $1"
}

log_error() {
    echo -e "${RED}[setup]${NC} $1"
}

# Check if tsx is available locally or via npx
check_tsx() {
    if command -v tsx >/dev/null 2>&1; then
        return 0
    elif command -v npx >/dev/null 2>&1; then
        if npx tsx --version >/dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Main execution
main() {
    log "GitOps Template Setup"
    
    # Check if Node.js is available
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js is not installed"
        echo "Please install Node.js first:"
        echo "  - macOS: brew install node"
        echo "  - Ubuntu/Debian: apt install nodejs npm"
        echo "  - NixOS: nix-shell -p nodejs"
        echo "  - Or download from: https://nodejs.org/"
        exit 1
    fi

    # Check for TypeScript execution capability
    if check_tsx; then
        log "Running TypeScript setup script..."
        
        # Try local tsx first, then npx
        if command -v tsx >/dev/null 2>&1; then
            log "Using locally installed tsx"
            tsx setup.ts "$@"
        else
            log "Using tsx via npx (zero dependencies approach)"
            npx tsx setup.ts "$@"
        fi
        
        log_success "Setup completed successfully"
    else
        log_error "Unable to run TypeScript setup script"
        echo "tsx is not available locally or via npx"
        echo ""
        echo "To fix this:"
        echo "  1. Install tsx globally: npm install -g tsx"
        echo "  2. Or ensure npx is available: npm install -g npm"
        echo "  3. Or use nix-shell: nix-shell -p nodejs"
        echo ""
        echo "If you prefer, you can run the setup script directly:"
        echo "  npx tsx setup.ts $*"
        exit 1
    fi
}

# Show help if requested
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "GitOps Template Setup Script"
    echo ""
    echo "This is a wrapper script that runs the TypeScript setup script with fallback support."
    echo ""
    echo "Usage:"
    echo "  ./setup.sh [OPTIONS]"
    echo ""
    echo "Common options:"
    echo "  --dry-run           Preview what would be done"
    echo "  --no-interactive    Skip automatic login prompts (for CI/automation)"
    echo "  --skip-github       Skip GitHub setup entirely"
    echo "  --config PATH       Use custom config file"
    echo ""
    echo "Run './setup.sh --help' or 'npx tsx setup.ts --help' for all options."
    echo ""
    echo "Authentication:"
    echo "  The script will automatically prompt for login if credentials are missing."
    echo "  Token URLs will be provided when needed."
    echo ""
    echo "Requirements:"
    echo "  - Node.js (any recent version)"
    echo "  - tsx (installed globally or available via npx)"
    echo ""
    exit 0
fi

# Run main function with all arguments
main "$@"