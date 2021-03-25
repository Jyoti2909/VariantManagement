@echo off

echo RunClientUnitTests.bat:
echo Target audience: Developers
echo Purpose: Run JavaScript unit tests

SET PathToThisBatFileFolder=%~dp0

SET WorkingDirectory=%CD%
CD /D "%PathToThisBatFileFolder%\AutomatedProcedures\tools\NodeJS"

CALL npm ci
CALL npm test

CD /D "%WorkingDirectory%"
pause