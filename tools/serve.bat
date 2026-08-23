@echo off
chcp 65001 >nul
setlocal

:: 本地 Python venv（managed）
set "PY=C:\Users\19437\.workbuddy\binaries\python\envs\default\Scripts\python.exe"

:: 进入项目根目录（bat 放在 tools/ 下，%~dp0.. 即项目根）
cd /d "%~dp0.." || (echo 无法进入项目目录 & pause & exit /b 1)

echo 正在启动本地预览服务器 (端口 8777)...
start "MuseumPreview" "%PY%" -m http.server 8777 --directory site
timeout /t 2 >nul
start "" http://127.0.0.1:8777/index.html

echo.
echo 已打开浏览器: http://127.0.0.1:8777/
echo 服务器在名为 "MuseumPreview" 的新窗口中运行，关闭该窗口即可停止服务。
echo.
pause
