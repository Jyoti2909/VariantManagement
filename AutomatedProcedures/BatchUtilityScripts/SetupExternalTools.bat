powershell "Set-ExecutionPolicy Bypass -Scope Process -Force; & \"%~dp0..\tools\SetupExternalTools.ps1\""

SET PathToNantExe="%~dp0..\tools\NAnt\tools\NAnt.exe"