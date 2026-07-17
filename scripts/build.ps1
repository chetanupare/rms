# Step 1: Copy logo for splash screen
Copy-Item ".\public\logo.png" ".\electron\logo.png" -Force

# Step 2: Vite build
npm run build
if (-not $?) { exit 1 }

# Step 3: Package the Electron app (creates dist/win-unpacked/)
npx electron-builder --win --config --x64
if (-not $?) { exit 1 }

# Step 4: Build NSIS installer from the fixed package
npx electron-builder --win --config --prepackaged="dist\win-unpacked"
