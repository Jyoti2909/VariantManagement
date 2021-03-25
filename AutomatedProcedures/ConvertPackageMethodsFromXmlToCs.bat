@echo off

IF /I noui==%1 ( GOTO main )

echo ConvertPackageMethodsFromXmlToCs.bat
echo Target audience: Development team
echo Purpose: Converts package methods from the directory AML-packages to .cs files and includes them to the project CSharpMethods.csproj

:main

SET PathToThisBatFileFolder=%~dp0

"%PathToThisBatFileFolder%..\Tests\PackageMethods\MethodConverter\Aras.PackageMethods.MethodConverter.exe" ^
	/target="%PathToThisBatFileFolder%..\Tests\PackageMethods\CSharpMethods\CSharpMethods.csproj" ^
	/source="%PathToThisBatFileFolder%..\AML-packages" ^
	/converter=CS ^
	/strategy=MethodXmlIsPrimary ^
	/exclude="%PathToThisBatFileFolder%..\Tests\PackageMethods\MethodConverter\.exclude" ^
	/methodconfig="%PathToThisBatFileFolder%..\Innovator\Server\method-config.xml"

if not errorlevel 1 (
	powershell write-host -foregroundcolor green "Methods successfully converted to C# and embedded to CSharpMethods project."
) else (
	powershell write-host -foregroundcolor red "Failure occured during convertion of XML methods from AML-packages folder or during embedding them to CSharpMethods project."
)

IF /I NOT noui==%1 ( pause )