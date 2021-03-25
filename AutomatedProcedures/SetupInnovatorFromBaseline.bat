@echo off

echo SetupInnovatorFromBaseline.bat:
echo Target audience: Developer team, QA team
echo Purpose: Setup local instance of Innovator from production backups

SET PathToThisBatFileFolder=%~dp0
CALL "%PathToThisBatFileFolder%BatchUtilityScripts\CheckAdminPrivileges.bat 
IF errorlevel 1 GOTO END
CALL "%PathToThisBatFileFolder%BatchUtilityScripts\SetupExternalTools.bat
IF errorlevel 1 GOTO END

SET Path.To.Sandbox.Directory=C:\Aras\Innovator
SET /P Path.To.Sandbox.Directory=Enter Path.To.Sandbox.Directory (It will be used as root folder where Innovator will be installed. Default value is '%Path.To.Sandbox.Directory%'):

SET Name.Of.Innovator.Instance=InnovatorServer
SET /P Name.Of.Innovator.Instance=Enter Name.Of.Innovator.Instance (It will be used for folder name, IIS virtual directory name and database name. Default value is '%Name.Of.Innovator.Instance%'):

ECHO "********************************************************************************"
ECHO "You are about to install Innovator to '%Path.To.Sandbox.Directory%' with '%Name.Of.Innovator.Instance%' web alias"
ECHO "Are You Sure?"
ECHO "********************************************************************************"

CHOICE /c YN
IF errorlevel 2 GOTO END

"%PathToNantExe%" ^
	"/f:%PathToThisBatFileFolder%NantScript.xml" ^
	SetupParameters.For.Common.Task ^
	Setup.Innovator.From.Backups ^
	%NAntParameters%

if not errorlevel 1 (
	powershell write-host -foregroundcolor green "SUCCESS!!!"
) else (
	powershell write-host -foregroundcolor red "FAILURE!!!"
)

pause