@echo off
cd /d "%~dp0"
taskkill /IM RainbowSixGame.exe /F /T >nul 2>&1
taskkill /IM RainbowSix.exe /F /T >nul 2>&1
taskkill /IM RainbowSix_DX11.exe /F /T >nul 2>&1
taskkill /IM RainbowSix_DX12.exe /F /T >nul 2>&1
taskkill /IM RainbowSix_Vulkan.exe /F /T >nul 2>&1
for %%F in (
    "RainbowSixGame.exe"
    "RainbowSix_DX11.exe"
    "RainbowSix.exe"
    "RainbowSix_Vulkan.exe"
) do (
    if exist %%F (
        start "" %%F /belaunch /nologo
        goto :eof
    )
)
