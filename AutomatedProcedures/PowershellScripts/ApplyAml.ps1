Param(
	[Parameter(Mandatory = $true)]
	[String]
	$InnovatorUrl,

	[Parameter(Mandatory = $true)]
	[String]
	$DatabaseName,

	[Parameter(Mandatory = $true)]
	[String]
	$DatabaseUser,

	[Parameter(Mandatory = $true)]
	[String]
	$DatabasePassword,

	[Parameter(Mandatory = $true)]
	[String]
	$PathToIomDll,

	[Parameter(Mandatory = $true)]
	[String]
	$PathToAmlScripts
)

function ApplyAmlsFromFolderRecursively([String]$root, [Aras.IOM.Innovator]$innovator)
{
	$files = Get-ChildItem -File *.xml -Path $root
	foreach ($file in $files){
		Write-Host "Applying script $($file.FullName)..."
		$aml = Get-Content $file.FullName -Raw
		$result = $innovator.applyAML($aml)
		if ($result.isError()) {
			Write-Host $result.ToString()
			exit 1
		}
	}

	$directories = Get-ChildItem -Directory -Path $root

	foreach ($dir in $directories){
		ApplyAmlsFromFolderRecursively -root $dir.FullName -innovator $innovator
	}
}

if (!(Test-Path $PathToAmlScripts)) {
	Write-Host "Path '$PathToAmlScripts' was not found. Skip applying AML scripts"
	exit 0
}

try
{
	[System.Reflection.Assembly]::LoadFrom($PathToIomDll)
}
catch [System.Exception]
{
	Write-Host "Error Message: $($_.Exception.Message)"
	Write-Host "StackTrace: $($_.Exception.StackTrace)"
	exit 1
}

$connection = [Aras.IOM.IomFactory]::CreateHttpServerConnection($InnovatorUrl, $DatabaseName, $DatabaseUser, $DatabasePassword)

try {
	$connection.Login()
	$innovator = New-Object "Aras.IOM.Innovator" -ArgumentList $connection
	ApplyAmlsFromFolderRecursively -root $PathToAmlScripts -innovator $innovator
} finally {
	$connection.Logout()
}
