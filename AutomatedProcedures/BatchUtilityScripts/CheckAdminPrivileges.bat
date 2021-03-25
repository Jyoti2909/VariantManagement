@echo off
powershell if ((New-Object Security.Principal.WindowsPrincipal ([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)) { exit 0 } else { exit 1 }
if errorlevel 1 (
	echo You do not have required privileges to run this script. Run the script as Administrator.
	exit /b 5
) else (
	exit /b 0
)