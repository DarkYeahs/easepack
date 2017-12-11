@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\easepack.js" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\easepack.js" %*
)