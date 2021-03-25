@echo off

SET MachineSpecificIncludesPath=C:\_machine_specific_includes\

powershell write-host -foregroundcolor yellow You are about to get path to Machine Specific Includes directory...

IF NOT EXIST %MachineSpecificIncludesPath% (
	GOTO DEFAULT_DIR_NOT_EXISTS
)

EXIT /b 0

:DEFAULT_DIR_NOT_EXISTS

REM Check Environment Variable MACHINE_SPECIFIC_INCLUDES_DIR in order to read machine specific location of that folder
IF "%MACHINE_SPECIFIC_INCLUDES_DIR%" == "" (
	powershell write-host -foregroundcolor yellow Both Default directory %MachineSpecificIncludesPath% and Environment Variable 'MACHINE_SPECIFIC_INCLUDES_DIR' do not exist
	GOTO CREATE_MACHINE_SPECIFIC_INCLUDES_DIR
)

IF NOT "%MACHINE_SPECIFIC_INCLUDES_DIR%" == "" (
	powershell write-host -foregroundcolor yellow Environment Variable 'MACHINE_SPECIFIC_INCLUDES_DIR' found. Script will read configuration files from %MACHINE_SPECIFIC_INCLUDES_DIR%
	SET MachineSpecificIncludesPath=%MACHINE_SPECIFIC_INCLUDES_DIR%
)

IF NOT EXIST %MachineSpecificIncludesPath% (
	powershell write-host -foregroundcolor yellow Custom Machine Specific Includes directory %MachineSpecificIncludesPath% does not exist
	GOTO CREATE_MACHINE_SPECIFIC_INCLUDES_DIR
)

EXIT /b 0

:CREATE_MACHINE_SPECIFIC_INCLUDES_DIR

CHOICE /M "Do you want to create directory %MachineSpecificIncludesPath%"
IF errorlevel 2 GOTO DO_NOT_CREATE
IF errorlevel 1 GOTO DO_CREATE

:DO_CREATE

MKDIR "%MachineSpecificIncludesPath%"
powershell write-host -foregroundcolor yellow Directory %MachineSpecificIncludesPath% created
EXIT /b 0

:DO_NOT_CREATE
powershell write-host -foregroundcolor red Directory not created. Please create it manually and specify its path to environment variable 'MACHINE_SPECIFIC_INCLUDES_DIR'
EXIT /b 1