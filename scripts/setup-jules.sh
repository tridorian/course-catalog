#!/bin/bash
# Idempotent setup script for the Tridorian Course Catalog in Jules VM environments.
# Configured via the Jules Web UI Codebase Settings under "Initial Setup".
# This prepares dependencies and caches them in the VM snapshot.

set -e

echo "=== Tridorian Environment Setup ==="

# 1. Install regular dependencies
echo "Installing project dependencies..."
npm install

# 2. Install Puppeteer locally for screenshot capture scripts
echo "Installing Puppeteer for screenshot automation..."
npm install puppeteer --no-save

# 3. Confirm all tests pass locally in the sandbox
echo "Validating test suite..."
npm test -- --run

echo "=== Setup Completed Successfully ==="
