<h1 align="center">Throwback Launcher</h1>

<p align="center">
  <a href="https://github.com/Xeralin/ThrowbackLauncher/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/Xeralin/ThrowbackLauncher?style=flat&color=c0152a" /></a>
  <a href="https://github.com/Xeralin/ThrowbackLauncher/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/Xeralin/ThrowbackLauncher/total?style=flat&color=e0405a" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/Xeralin/ThrowbackLauncher?style=flat&color=e8e0d5" /></a>
</p>

### What is Throwback Launcher?

Throwback Launcher downloads, manages and launches every older season of Rainbow Six Siege, built for **Operation Throwback** and **Heated Metal**. It runs on Linux and Windows and includes Liberator and Discord Rich Presence.

> [!IMPORTANT]
> **Throwback Launcher is in beta!** Expect bugs and changes.

<br>

### 📋 Requirements

- A Steam account that owns Tom Clancy’s Rainbow Six® Siege
- Native Steam (no Flatpak, no Snap) on Linux

<br>

### 🔧 Installation

**Windows**

1. Download `Launcher.exe` from the [latest release](https://github.com/Xeralin/ThrowbackLauncher/releases/latest)
2. Run it — the launcher installs itself and creates a Start menu entry

**Linux**

1. Download `Launcher.AppImage` from the [latest release](https://github.com/Xeralin/ThrowbackLauncher/releases/latest)
2. Run `chmod +x Launcher.AppImage && ./Launcher.AppImage`

<br>

### 🍿 Usage

Pick a season under **Download** and log in with your Steam account. For supported seasons, the launcher offers **Heated Metal** before the download starts.

- **Linux**: click *Add to Steam*, pick a compatibility layer and play the season through Steam
- **Windows**: click *Start* — Steam is optional

<br>

### 🧬 Building

For a local development run, you need [pnpm](https://pnpm.io/) and Python 3.12 or newer:

```sh
git clone https://github.com/Xeralin/ThrowbackLauncher.git
cd ThrowbackLauncher
pnpm -C web install
python -m venv .venv && .venv/bin/pip install -r app/requirements.txt
./run.sh
```
