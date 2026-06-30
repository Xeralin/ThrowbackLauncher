# -*- mode: python ; coding: utf-8 -*-
import os
import sys

sys.path.insert(0, os.path.abspath("app"))

from PyInstaller.utils.hooks import collect_submodules

datas = []
for src, dst in [
    ("web/out", "web/out"),
    ("media", "media"),
    ("manifest.toml", "."),
    ("web/assets/splash", "web/assets/splash"),
    ("bin/Liberator.exe", "bin"),
    ("bin/Liberator.exe.config", "bin"),
]:
    if os.path.exists(src):
        datas.append((src, dst))

hiddenimports = collect_submodules("core") + collect_submodules("bridge")

icon = "media/otb_icon.ico" if os.path.exists("media/otb_icon.ico") else None

a = Analysis(
    ["app/main.py"],
    pathex=["app"],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=[
        "tkinter",
        "PySide6.Qt3DCore", "PySide6.Qt3DRender", "PySide6.Qt3DInput",
        "PySide6.Qt3DLogic", "PySide6.Qt3DAnimation", "PySide6.Qt3DExtras",
        "PySide6.QtQuick3D",
        "PySide6.QtCharts", "PySide6.QtGraphs", "PySide6.QtDataVisualization",
        "PySide6.QtMultimedia", "PySide6.QtMultimediaWidgets", "PySide6.QtSpatialAudio",
        "PySide6.QtBluetooth", "PySide6.QtNfc", "PySide6.QtPositioning",
        "PySide6.QtSensors", "PySide6.QtSerialPort", "PySide6.QtSerialBus",
        "PySide6.QtSql", "PySide6.QtTest", "PySide6.QtDesigner", "PySide6.QtUiTools",
        "PySide6.QtHelp", "PySide6.QtPdf", "PySide6.QtPdfWidgets",
        "PySide6.QtScxml", "PySide6.QtStateMachine", "PySide6.QtRemoteObjects",
        "PySide6.QtTextToSpeech",
    ],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="throwback-launcher",
    console=False,
    icon=icon,
    contents_directory="app",
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    name="throwback-launcher",
)
