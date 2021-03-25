@echo off

echo CreateZipWithDeploymentPackageAndScripts.bat:
echo Target audience: Deployment engineer;
echo Purpose: Create Zip archive with deployment script that can be used to upgrade the target server

SET NAntTargetsToRun=CreateZipWithDeploymentPackageAndScripts
SET PathToThisBatFileFolder=%~dp0
CALL "%PathToThisBatFileFolder%BatchUtilityScripts\SetupExternalTools.bat
IF errorlevel 1 GOTO END

"%PathToNantExe%" ^
	"/f:%PathToThisBatFileFolder%NantScript.xml" ^
	%NAntTargetsToRun%

if not errorlevel 1 (
	powershell write-host -foregroundcolor green "SUCCESS!!!"
) else (
	powershell write-host -foregroundcolor red "FAILURE!!!"
)

pause