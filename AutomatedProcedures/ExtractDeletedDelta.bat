@echo off

echo ExtractDeletedDelta.bat:
echo Target audience: Development team;
echo Purpose: Create AML files containing deleted items that should be analyzed and moved to appropriate folder in AmlDeploymentScripts

SET NAntTargetsToRun=Extract.Deleted.Delta
SET PathToThisBatFileFolder=%~dp0

CALL "%PathToThisBatFileFolder%BatchUtilityScripts\SetupExternalTools.bat
IF errorlevel 1 GOTO END

SET Deleted.Delta.Last.Commits.Number=
SET /P Deleted.Delta.Last.Commits.Number=Enter Deleted.Delta.Last.Commits.Number (It will be used to get deleted items within last number of commits. Otherwise delta will be calculated from Last.Commit.Before.Current.Release to current branch HEAD commit):

"%PathToNantExe%" ^
	"/f:%PathToThisBatFileFolder%NantScript.xml" ^
	%NAntTargetsToRun%

if not errorlevel 1 (
	powershell write-host -foregroundcolor green "SUCCESS!!!"
) else (
	powershell write-host -foregroundcolor red "FAILURE!!!"
)

pause