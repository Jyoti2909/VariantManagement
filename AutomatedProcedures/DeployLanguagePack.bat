@echo off

echo DeployLanguagePack.bat:
echo Target Audience: Technical Writer, Translator;
echo Purpose: Upgrade Multiligual Fields to the target server

IF "%NAntTargetsToRun%"=="" ( SET NAntTargetsToRun=Import.Language.Pack )
SET PathToThisBatFileFolder=%~dp0
SET NAntParameters=%*

CALL "%PathToThisBatFileFolder%BatchUtilityScripts\SetupExternalTools.bat
IF errorlevel 1 GOTO END

Call:InputPassword "Enter password of root Innovator user" InnovatorRootPassword

SET Password.Of.Root.Innovator.User=%InnovatorRootPassword%

"%PathToNantExe%" "/f:%PathToThisBatFileFolder%NantScript.xml" %NAntTargetsToRun% %NAntParameters%

if not errorlevel 1 (
	powershell write-host -foregroundcolor green "SUCCESS!!!"
) else (
	powershell write-host -foregroundcolor red "FAILURE!!!"
)

pause
goto :eof

:InputPassword
echo.
set "psCommand=powershell -command "$pword = read-host '%1' -AsSecureString ; ^
    $BSTR=[System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pword); ^
      [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)""
        for /f "usebackq delims=" %%p in (`%psCommand%`) do set %2=%%p
)
goto :eof