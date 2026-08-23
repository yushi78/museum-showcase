@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: ===== 工具路径（managed 环境，已验证存在）=====
set "BLENDER=C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
set "PY=C:\Users\19437\.workbuddy\binaries\python\envs\default\Scripts\python.exe"
set "NODE=C:\Users\19437\.workbuddy\binaries\node\versions\22.22.2\node.exe"

:: 进入项目根目录（bat 放在 tools/ 下，%~dp0.. 即项目根）
cd /d "%~dp0.." || (echo 无法进入项目目录 & pause & exit /b 1)

echo ============================================
echo   博物馆展品模型 一键重建流水线
echo   现代馆 8 件 + 古典馆 11 件 + 自然馆 12 件 = 31 件
echo ============================================
echo.

echo [1/3] 生成程序化贴图 (texgen.py)...
"%PY%" tools\blender\texgen.py
if errorlevel 1 (echo [!] 贴图生成失败 & pause & exit /b 1)
echo [+] 贴图完成
echo.

echo [2/3] 用 Blender 无头导出全部 23 件 GLB...
set "SCRIPTS=modern_real import_unitree_g1 import_unitree_go2 fangding jadecong jade_seal silver_ewer bianzhong oracle-bone yuan-blue-vase chenghua-chicken-cup greek-amphora dragon-robe phoenix-crown nat_skeleton nat_mammal nat_geo nat_fossil nat_specimen"
set /a OK=0
set /a FAIL=0
if exist tools\blender\build.log del tools\blender\build.log
for %%s in (%SCRIPTS%) do (
  echo   -- %%s --
  "%BLENDER%" --background --python "tools\blender\%%s.py" >> tools\blender\build.log 2>&1
  if errorlevel 1 (echo     [!] %%s 失败 & set /a FAIL+=1) else (set /a OK+=1)
)
echo [+] 导出结束：成功 !OK! 件，失败 !FAIL! 件（详细日志见 tools\blender\build.log）
echo.

echo [3/3] 运行校验 (verify.mjs / verify-layout.mjs)...
"%NODE%" tools\verify.mjs
"%NODE%" tools\verify-layout.mjs
echo.

echo ============================================
echo   流水线完成。失败 !FAIL! 件。
echo   完成后可用 serve.bat 启动本地预览。
echo ============================================
pause
