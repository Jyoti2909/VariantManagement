@echo off

echo RunTests.bat
echo Target audience: QA team, Development team
echo Purpose: Run Unit tests.

SET PathToThisBatFileFolder=%~dp0
CALL "%PathToThisBatFileFolder%AutomatedProcedures\BatchUtilityScripts\CheckAdminPrivileges.bat
IF errorlevel 1 GOTO END
CALL "%PathToThisBatFileFolder%AutomatedProcedures\BatchUtilityScripts\SetupExternalTools.bat
IF errorlevel 1 GOTO END

SET WorkingDirectory=%CD%
CD /D "%PathToThisBatFileFolder%"

"%PathToNantExe%" ^
	"/f:%PathToThisBatFileFolder%AutomatedProcedures\NantScript.xml" ^
	RunUnitTests

:END
if not errorlevel 1 (
	powershell write-host -foregroundcolor green "SUCCESS!!!"
) else (
	powershell write-host -foregroundcolor red "FAILURE!!!"
)

CD /D "%WorkingDirectory%"
pause