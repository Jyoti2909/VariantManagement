@echo off

echo ContinuousIntegration.bat:
echo Target audience: Build engeneer
echo Purpose: Run analog of ContinuousIntegration build locally

SET PathToThisBatFileFolder=%~dp0
CALL "%PathToThisBatFileFolder%AutomatedProcedures\BatchUtilityScripts\CheckAdminPrivileges.bat 
IF errorlevel 1 GOTO END
CALL "%PathToThisBatFileFolder%AutomatedProcedures\BatchUtilityScripts\GetMachineSpecificIncludes.bat
IF errorlevel 1 GOTO END
CALL "%PathToThisBatFileFolder%AutomatedProcedures\BatchUtilityScripts\SetupExternalTools.bat
IF errorlevel 1 GOTO END

SET WorkingDirectory=%CD%
CD /D "%PathToThisBatFileFolder%"

FOR /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD') DO SET Commit.Pointer=%%i

SET MachineSpecific.Includes.Folder.Path=%MachineSpecificIncludesPath%
SET Is.MachineSpecific.Includes.Mandatory=true

"%PathToNantExe%" ^
	"/f:%PathToThisBatFileFolder%AutomatedProcedures\NantScript.xml" ^
	ContinuousIntegration

:END
if not errorlevel 1 (
	powershell write-host -foregroundcolor green "SUCCESS!!!"
) else (
	powershell write-host -foregroundcolor red "FAILURE!!!"
)

CD /D "%WorkingDirectory%"
pause