#!/bin/bash
set -e

# Ensure wails is in PATH
export PATH=$PATH:$(go env GOPATH)/bin

# Build Server-Only Version
# This uses the default build tags (!desktop)
echo "Building Server Mode (natsman-server)..."
go build -o natsman-server
echo "✅ Server build complete: ./natsman-server"

# Build Desktop/Hybrid Version
# This enables the 'desktop' tag
echo "Building Desktop Mode (natsman-desktop)..."
if command -v wails &> /dev/null; then
    # Linux Build (current platform)
    wails build -clean -devtools -skipbindings -o natsman-desktop
    echo "✅ Linux Desktop build complete: ./build/bin/natsman-desktop"

    # Windows Build (Cross-compile)
    echo "Building Windows Desktop (natsman-desktop.exe)..."
    wails build -skipbindings -platform windows/amd64 -o natsman-desktop.exe
    echo "✅ Windows Desktop build complete: ./build/bin/natsman-desktop.exe"
else
    # Fallback to standard Go build with tags
    # Note: On Linux, Wails requires CGO and GTK dev headers.
    echo "⚠️ 'wails' command not found, using 'go build -tags desktop'..."
    go build -tags desktop -o natsman-desktop
    echo "✅ Desktop build complete: ./natsman-desktop"
    
    echo "⚠️ Skipping Windows build (requires Wails CLI for cross-compilation setup)"
fi

echo "----------------------------------------"
echo "Builds finished."
echo "1. ./natsman-server  -> Lightweight, Server Logic Only."
echo "2. ./build/bin/natsman-desktop (or ./natsman-desktop) -> Full Desktop UI + Server Logic."
