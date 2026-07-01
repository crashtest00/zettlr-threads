# WSL2 Development Environment Setup

This setup reference applies across Zettlr Threads prototype releases.

## Prerequisites

- Windows 11 (recommended) or Windows 10 with WSL2 enabled
- WSL2 with a Linux distribution installed (Ubuntu recommended)

---

## Display Server (Electron GUI)

Electron requires a display server to run its GUI from WSL2.

### Windows 11 — WSLg (recommended)
WSLg is built into Windows 11 and requires no extra setup. Verify it is working:

```bash
echo $DISPLAY
# should return something like :0
```

### Windows 10 — X Server
Install a third-party X server such as VcXsrv or X410, then set the display variable in your shell profile:

```bash
export DISPLAY=:0
```

---

## File System

Keep the entire project inside the WSL2 filesystem, not on the Windows mount:

```bash
# correct
~/projects/zettlr-fork

# avoid — slow and causes file watcher issues
/mnt/c/projects/zettlr-fork
```

File watchers used by Electron's hot reload do not work reliably across the WSL2/Windows filesystem boundary.

---

## VS Code

Install the **Remote - WSL** extension in VS Code on Windows. This lets you open and edit files inside WSL2 seamlessly from the Windows VS Code instance.

Claude Code works well in this setup.

---

## Git Line Endings

Run these inside your WSL2 environment to prevent line ending issues with Markdown and HTML comment blocks:

```bash
git config --global core.autocrlf false
git config --global core.eol lf
```

---

## Node Version Management

Use the repo's pinned Node version inside WSL2. If you add or update an `.nvmrc`, install from it with nvm:

```bash
# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# enable Corepack and activate the repo's Yarn version
corepack enable
corepack prepare yarn@4.11.0 --activate

# install and use the pinned Node version
nvm install
nvm use
```

---

## Project Setup

```bash
# clone the fork
git clone https://github.com/YOUR_USERNAME/Zettlr.git
cd Zettlr

# ensure the pinned Node version is active
nvm use

# install dependencies
yarn install --immutable

# start the dev build
yarn start
```

---

## Troubleshooting

**Electron window does not appear**
- Confirm `echo $DISPLAY` returns a value
- On Windows 11, ensure WSLg is enabled and up to date via Windows Update

**File watcher not picking up changes**
- Confirm the project is inside the WSL2 filesystem, not under `/mnt/c/`

**Native module build errors**
- Ensure build tools are available: `sudo apt install build-essential`
- Confirm you are using the Node version specified in Zettlr's `.nvmrc` or `package.json`

**Slow performance**
- Move the project directory into the WSL2 filesystem if it is currently on `/mnt/c/`
