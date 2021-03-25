@echo off

echo SetupEnterpriseSearch.bat:
echo Target audience: Development team, QA team;
echo Purpose: Setup Enterprise Search

SET PathToThisBatFileFolder=%~dp0
CALL "%PathToThisBatFileFolder%BatchUtilityScripts\GetMachineSpecificIncludes.bat 
IF errorlevel 1 GOTO END
CALL "%PathToThisBatFileFolder%BatchUtilityScripts\SetupExternalTools.bat
IF errorlevel 1 GOTO END

SET WorkingDirectory=%CD%
CD /D "%PathToThisBatFileFolder%\.."

FOR /f "delims= " %%i in ('wmic computersystem get name') DO FOR /f "delims=" %%t in ("%%i") DO SET Local.Machine.Name=%%t
FOR /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD') DO SET Commit.Pointer=%%i
SET Path.To.Installed.Innovator=%CD%

SET MachineSpecific.Includes.Folder.Path=%MachineSpecificIncludesPath%
SET Is.MachineSpecific.Includes.Mandatory=true

"%PathToNantExe%" ^
	"/f:AutomatedProcedures\NantScript.xml" ^
	SetupParameters.For.Developer.Environment ^
	Remove.ES

:END
if not errorlevel 1 (
	powershell write-host -foregroundcolor green "SUCCESS!!!"
) else (
	powershell write-host -foregroundcolor red "FAILURE!!!"
)

CD /D "%WorkingDirectory%"
pause