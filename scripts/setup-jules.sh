#!/usr/bin/env bash
# ==============================================================================
# tridorian Course Catalog - Jules VM Environment Setup
# Enforces a clean, reproducible setup, warms dev caches, registers developer
# aliases, autoconfigures Git credentials, and automates GCP credentials sync.
# ==============================================================================

set -euo pipefail

# --- Color Codes for Logging ---
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO] $(date +'%H:%M:%S') - $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}[WARN] $(date +'%H:%M:%S') - $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $(date +'%H:%M:%S') - $1${NC}" >&2
}

log_step() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

log_step "tridorian Jules VM Environment Setup & Optimization"

# 1. System Diagnostics
log_info "Node.js version: $(node --version)"
log_info "npm version: $(npm --version)"
if command -v free &>/dev/null; then
    log_info "Available Memory: $(free -h | awk '/^Mem:/ {print $4 \" / \" $2}')"
fi

# 2. Clean Up Zombie Processes on Port 5173
log_info "Checking for zombie processes on port 5173..."
if command -v lsof &>/dev/null; then
    PORT_PID=$(lsof -t -i:5173 || true)
    if [[ -n "$PORT_PID" ]]; then
        log_warn "Port 5173 is occupied by PID(s): $PORT_PID. Terminating..."
        kill -9 $PORT_PID || true
    fi
else
    # Fallback to fuser
    if command -v fuser &>/dev/null; then
        fuser -k 5173/tcp &>/dev/null || true
    fi
fi

# 3. Install Standard Dependencies
log_info "Installing project dependencies..."
npm install

# 4. Install Puppeteer locally for screenshot capture scripts
log_info "Installing Puppeteer for screenshot automation..."
npm install puppeteer --no-save

# 5. Git Autoconfiguration inside VM
log_info "Configuring Git identity inside Jules VM..."
git config --global user.name "Jules Agent"
git config --global user.email "jules-agent@google.com"
git config --global init.defaultBranch main

# 6. GCP/GWS Credentials Automation
# Checks if the user passed GOOGLE_SERVICE_ACCOUNT_KEY in the Jules settings env
if [[ -n "${GOOGLE_SERVICE_ACCOUNT_KEY:-}" ]]; then
    log_info "GOOGLE_SERVICE_ACCOUNT_KEY detected in environment variables."
    ADC_DIR="$HOME/.gcloud_config"
    ADC_PATH="$ADC_DIR/application_default_credentials.json"
    log_info "Creating credentials directory at: $ADC_DIR"
    mkdir -p "$ADC_DIR"
    echo "$GOOGLE_SERVICE_ACCOUNT_KEY" > "$ADC_PATH"
    log_info "Successfully wrote Application Default Credentials to $ADC_PATH"
    export GOOGLE_APPLICATION_CREDENTIALS="$ADC_PATH"
else
    log_warn "GOOGLE_SERVICE_ACCOUNT_KEY not found in environment."
    log_warn "Google Drive / Docs sync scripts will fall back to local mock data unless authorized."
fi

# 7. Pre-build Vite Client (Warms up pre-bundling caches)
log_info "Running a production compilation dry-run to warm up bundler caches..."
npm run build

# 8. Validate Course Catalog Schema
if [[ -f "scripts/validate-catalog.js" ]]; then
    log_info "Validating course catalog schema..."
    node scripts/validate-catalog.js || log_warn "Catalog schema validation found discrepancies."
fi

# 9. Register Helpful Shell Aliases
log_info "Registering custom dev aliases in ~/.bashrc..."
{
    echo ""
    echo "# --- tridorian Dev Shortcuts ---"
    echo "alias test-catalog='npm test -- --run'"
    echo "alias build-catalog='npm run build'"
    echo "alias snap='node scripts/take-screenshots.js'"
    echo "alias validate-catalog='node scripts/validate-catalog.js'"
    echo "export PS1=\"\[\033[0;32m\][Jules-VM] \[\033[0;34m\]\w\[\033[0m\]\\$ \""
} >> ~/.bashrc || log_warn "Unable to append aliases to ~/.bashrc"

# 10. Confirm Test Suite Passes
log_info "Running local Vitest suite verification..."
npm test -- --run

log_step "Setup Completed Successfully"
