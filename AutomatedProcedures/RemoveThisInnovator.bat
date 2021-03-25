@echo off

echo *********************************************************************************************************************************************************************
echo You are going to remove Innovator instance, that was configured by SetupInnovatorHere.bat. This action will remove IIS application, database and Agent Service
echo *********************************************************************************************************************************************************************

SET PathToThisBatFileFolder=%~dp0
CALL "%PathToThisBatFileFolder%BatchUtilityScripts\CheckAdminPrivileges.bat 
IF errorlevel 1 GOTO END
CALL "%PathToThisBatFileFolder%BatchUtilityScripts\GetMachineSpecificIncludes.bat
IF errorlevel 1 GOTO END
CALL "%PathToThisBatFileFolder%BatchUtilityScripts\SetupExternalTools.bat
IF errorlevel 1 GOTO END

SET WorkingDirectory=%CD%
CD /D "%PathToThisBatFileFolder%"

@REM Remove trailing backslash as it is interpreted as invalid character by NAnt
SET PathToThisBatFileFolder=%PathToThisBatFileFolder:~0,-1%

FOR /f "delims= " %%i in ('wmic computersystem get name') DO FOR /f "delims=" %%t in ("%%i") DO SET Local.Machine.Name=%%t
FOR /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD') DO SET Commit.Pointer=%%i
IF NOT "%1" == "" (
	SET Name.Of.Innovator.Instance=%1
)

SET MachineSpecific.Includes.Folder.Path=%MachineSpecificIncludesPath%

"%PathToNantExe%" ^
	"/f:%PathToThisBatFileFolder%\NantScript.xml" ^
	SetupParameters.For.Developer.Environment ^
	Clean.Up

:END
if not errorlevel 1 (
	powershell write-host -foregroundcolor green "SUCCESS!!!"
) else (
	powershell write-host -foregroundcolor red "FAILURE!!!"
)

CD /D "%WorkingDirectory%"
pause