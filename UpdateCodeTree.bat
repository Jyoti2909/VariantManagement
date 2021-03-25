@echo off

SET PathToThisBatFileFolder=%~dp0

SET WorkingDirectory=%CD%
CD /D "%PathToThisBatFileFolder%"

for /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD') do set Commit.Pointer=%%i
for /f "delims=" %%i in ('dir Instances /b ^| findstr .*-%Commit.Pointer%') do set Name.Of.Innovator.Instance=%%i

if "%Name.Of.Innovator.Instance%"=="" (
	echo "Instance for '%Commit.Pointer%' branch doesn't exist. Use SetupInnovatorHere.bat for initial installation."
	goto end
)

for /f "delims=" %%i in ('dir Instances\%Name.Of.Innovator.Instance% /a:d /b') do (
	echo Updating Instances\%Name.Of.Innovator.Instance%\%%i && robocopy %%i Instances\%Name.Of.Innovator.Instance%\%%i /e /njh /nfl /ndl > nul
)

:end
CD /D "%WorkingDirectory%"
pause