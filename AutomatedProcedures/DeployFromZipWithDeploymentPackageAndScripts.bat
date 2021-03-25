@echo off

echo DeployFromZipArchiveWithPackageAndScripts.bat:
echo Target audience: Deployment engineer, QA team;
echo Purpose: Deploy upgrade to the target server from zip with diff

SET NAntTargetsToRun=Deploy.Package
SET PathToThisBatFileFolder=%~dp0
CALL "%PathToThisBatFileFolder%BatchUtilityScripts\SetupExternalTools.bat
IF errorlevel 1 GOTO END

SET Path.To.Instance.Deploy.Config=Instance.deploy.xml
SET /P Path.To.Instance.Deploy.Config=Enter Path.To.Instance.Deploy.Config (It describes Innovator instance structure and deployment steps. Default value is '%Path.To.Instance.Deploy.Config%'):

SET Path.To.Deployment.Package.Dir=%PathToThisBatFileFolder%..
SET Path.To.Instance.Deploy.Config=%Path.To.Instance.Deploy.Config%
SET Build.Type=Deployment

"%PathToNantExe%" ^
	"/f:%PathToThisBatFileFolder%NantScript.xml" ^
	%NAntTargetsToRun%

if not errorlevel 1 (
	powershell write-host -foregroundcolor green "EVERYTHING WAS DEPLOYED SUCCESSFULLY!!!"
)

pause