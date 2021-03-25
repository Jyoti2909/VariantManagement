function Validate-Workability ($path) {
	if (($path -ne $null) -and (Test-Path $path)) {
		try
		{
			& $path
			return $true
		}
		catch
		{
			return $false
		}
	}

	return $false
}

$toolsDir = $PSScriptRoot
$pathToNugetExe = Join-Path $toolsDir ".nuget\NuGet.exe"

if (!(Validate-Workability $pathToNugetExe)) {
	$externalPathToNuget = "C:\Program Files (x86)\NuGet\NuGet.exe"
	if (Validate-Workability $externalPathToNuget) {
		Copy $externalPathToNuget $pathToNugetExe
	} elseif (Validate-Workability $env:CRT_PATH_TO_NUGET_EXE) {
		Copy $env:CRT_PATH_TO_NUGET_EXE $pathToNugetExe
	} else {
		[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

		$nugetUrl = "https://dist.nuget.org/win-x86-commandline/latest/nuget.exe"
		Invoke-WebRequest -Method Get -Uri $nugetUrl -OutFile $pathToNugetExe
	}
}

& $pathToNugetExe install "NAnt" -OutputDirectory $toolsDir -ExcludeVersion