@echo off

echo ConvertPackageMethodsFromCsToXml.bat
echo Target audience: Development team
echo Purpose: Updates method code of package methods from the directory AML-packages with code from .cs files from the project CSharpMethods.csproj
echo Note: The script does not creates new .xml files. The MethodConverter can update only a method_code node of a related method's xml file.

SET PathToThisBatFileFolder=%~dp0

"%PathToThisBatFileFolder%..\Tests\PackageMethods\MethodConverter\Aras.PackageMethods.MethodConverter.exe" ^
	/target="%PathToThisBatFileFolder%..\Tests\PackageMethods\CSharpMethods\CSharpMethods.csproj" ^
	/source="%PathToThisBatFileFolder%..\AML-packages" ^
	/converter=CS ^
	/strategy=MethodCsIsPrimary ^
	/exclude="%PathToThisBatFileFolder%..\Tests\PackageMethods\MethodConverter\.exclude" ^
	/methodconfig="%PathToThisBatFileFolder%..\Innovator\Server\method-config.xml"

if not errorlevel 1 (
	powershell write-host -foregroundcolor green "Methods successfully converted to XML and updated in AML-packages folder."
) else (
	powershell write-host -foregroundcolor red "Failure occured during convertion of C# methods from CSharpMethods project."
)

pause