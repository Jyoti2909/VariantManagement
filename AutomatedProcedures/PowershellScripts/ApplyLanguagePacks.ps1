Param(
	[Parameter(Mandatory = $true)]
	[String]
	$PathToLanguageTool,

	[Parameter(Mandatory = $true)]
	[String]
	$PathToLanguagePacks,

	[Parameter(Mandatory = $true)]
	[String]
	$Server,

	[Parameter(Mandatory = $true)]
	[String]
	$DatabaseName,

	[Parameter(Mandatory = $true)]
	[String]
	$DatabaseUser,

	[Parameter(Mandatory = $true)]
	[String]
	$DatabasePassword
)

if (!(Test-Path $PathToLanguagePacks)) {
	Write-Host "Path '$PathToLanguagePacks' was not found. Skip applying Language packs"
	exit 0
}

$directories = Get-ChildItem -Directory -Path $PathToLanguagePacks
foreach ($dir in $directories) {
	$languageCodeFolder = $dir.FullName
	$languageCode = $languageCodeFolder.Substring($languageCodeFolder.LastIndexOf('\') + 1)

	Write-Host "Applying language packs.. '$languageCode'"

	$importConfigFiles = Get-ChildItem -File ImportConfig.xml -Path $languageCodeFolder

	foreach ($pathToLanguageToolConfig in $importConfigFiles) {
		$pathToLanguagePacksXmlDir = Join-Path -Path $pathToLanguageToolConfig.Directory.FullName -ChildPath "xml"
		$args = "-import -config_file:`"$($pathToLanguageToolConfig.FullName)`" -folder:`"$pathToLanguagePacksXmlDir`" -language_code:`"$languageCode`" -server:`"$Server`" -db:`"$DatabaseName`" -login:`"$DatabaseUser`" -pwd:`"$DatabasePassword`""

		$process = Start-Process -FilePath $PathToLanguageTool -NoNewWindow -PassThru -Wait -ArgumentList $args
		if ($process.ExitCode -ne 0) {
			Write-Host "Failed to apply Language packs from '$PathToLanguagePacks', LangugeTool.exe returned exit code '$($process.ExitCode)'."
			exit $process.ExitCode
		}
	}
}