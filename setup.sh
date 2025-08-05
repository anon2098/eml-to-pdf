#!/bin/bash

# EML to PDF Converter Setup Script
# This script helps set up the EML to PDF converter

set -e  # Exit on any error

echo "🚀 EML to PDF Converter Setup"
echo "=============================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js installation
echo
echo "📦 Checking Node.js installation..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js found: $NODE_VERSION"
    
    # Check if version is recent enough (v16+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 16 ]; then
        echo "⚠️  Warning: Node.js v16+ recommended, found v$NODE_MAJOR"
        echo "   Consider updating Node.js for best compatibility"
    fi
else
    echo "❌ Node.js not found!"
    echo
    echo "Please install Node.js first:"
    echo "📋 Visit: https://nodejs.org/"
    echo "Or use your package manager:"
    echo "  Ubuntu/Debian: sudo apt install nodejs npm"
    echo "  macOS: brew install node"
    echo "  Windows: choco install nodejs"
    exit 1
fi

# Check npm
echo
echo "📦 Checking npm..."
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm found: v$NPM_VERSION"
else
    echo "❌ npm not found!"
    echo "npm should come with Node.js. Please reinstall Node.js."
    exit 1
fi

# Check for Brave browser
echo
echo "🌐 Checking Brave browser..."
BRAVE_PATHS=(
    "/usr/bin/brave-browser"
    "/usr/bin/brave"
    "/opt/brave.com/brave/brave"
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
    "/snap/bin/brave"
)

BRAVE_FOUND=""
for path in "${BRAVE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        BRAVE_FOUND="$path"
        break
    fi
done

if [ -n "$BRAVE_FOUND" ]; then
    echo "✅ Brave browser found: $BRAVE_FOUND"
else
    echo "⚠️  Brave browser not found in common locations"
    echo "   Please install Brave browser:"
    echo "   📋 Visit: https://brave.com/download/"
    echo "   Or use package manager:"
    echo "     Ubuntu/Debian: Download .deb from brave.com"
    echo "     macOS: brew install --cask brave-browser"
    echo "     Windows: choco install brave"
    echo
    echo "   You can specify the browser path later with --brave-path option"
fi

# Install dependencies
echo
echo "📚 Installing dependencies..."
if npm install; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    echo "Please check your internet connection and try again"
    exit 1
fi

# Make script executable on Unix systems
if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" ]]; then
    echo
    echo "🔧 Making script executable..."
    chmod +x index.js
    echo "✅ Script is now executable"
fi

# Create example directory structure
echo
echo "📁 Creating example directory structure..."
mkdir -p example/{input,output}
cat > example/README.txt << 'EOF'
Example Directory Structure
===========================

Place your EML files in the 'input' directory.
The 'output' directory will contain the generated PDFs.

Usage:
  node ../index.js ./input

This will:
1. Process all .eml files in the input directory
2. Create PDFs in the output directory
3. Merge any PDF attachments

File naming convention:
  yyyy_mm_dd_sender_to_receiver.pdf
EOF

echo "✅ Example directories created in ./example/"

# Display success message and usage instructions
echo
echo "🎉 Setup Complete!"
echo "=================="
echo
echo "✅ Node.js: Ready"
echo "✅ Dependencies: Installed"
echo "✅ Script: Executable"
if [ -n "$BRAVE_FOUND" ]; then
    echo "✅ Brave Browser: Found"
else
    echo "⚠️  Brave Browser: Please install manually"
fi
echo
echo "📋 Quick Start:"
echo "  1. Place EML files in a directory"
echo "  2. Run: node index.js /path/to/eml/files"
echo "  3. Find PDFs in the output/ subdirectory"
echo
echo "📖 For detailed usage instructions, see README.md"
echo
echo "🔧 Test the installation:"
echo "  node index.js --help"
echo
echo "Happy converting! 📧 → 📄"