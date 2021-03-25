@echo off

call %~dp0AutomatedProcedures\BatchUtilityScripts\CheckAdminPrivileges.bat 
if errorlevel 1 goto fail

if not exist %~dp0\Deployment-Package-Content (
	echo Folder Deployment-Package-Content not found - please extract Deployment-Package-Content.zip
	goto fail
)

set DeployVerb=-t Deploy
set PathToDeploymentToolFolder="%~dp0AutomatedProcedures\tools\Aras.Deployment.Tool"
set PathToInstanceDeployConfig="%~dp0InstanceTemplate.deploy.xml"
set /P PathToInstanceDeployConfig=Enter PathToInstanceDeployConfig (It describes Innovator instance structure and deployment steps. Default value is '%PathToInstanceDeployConfig%'):

set PathToDefaultSettingsInclude="%~dp0AutomatedProcedures\Default.Settings.include"
for /f "delims=" %%i in ('powershell "[xml] $f = Get-Content '%PathToDefaultSettingsInclude%'; $f.SelectSingleNode('/project/property[@name = ''Version.Of.Installed.Innovator'']/@value').Value"') do set InnovatorVersion="%%i"

set OriginalPath="%cd%"
cd %PathToDeploymentToolFolder%

for /f "delims=" %%i in ('powershell "(Get-Item Aras.Deployment.Tool.exe).VersionInfo.FileMajorPart"') do if %%i==1 set DeployVerb=deploy --innovator-version %InnovatorVersion%

Aras.Deployment.Tool.exe %DeployVerb% -c %PathToInstanceDeployConfig%

if errorlevel 0 (
	powershell Write-Host -ForegroundColor Green "EVERYTHING WAS DEPLOYED SUCCESSFULLY!!!"
) else (
	:fail
	powershell Write-Host -ForegroundColor Red "FAILURE!!!"
)

cd %OriginalPath%
pause