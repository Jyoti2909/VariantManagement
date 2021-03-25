Param(
    [Parameter(Mandatory = $false)]
    [String]
    $MachineSpecificIncludeFileName,

    [Parameter(Mandatory = $false)]
    [String]
    $PathToRepository = $pwd,

    [Parameter(Mandatory = $false)]
    [String]
    $PathToMachineSpecificIncludes = "C:\_machine_specific_includes",

    [Parameter(Mandatory = $false)]
    [String]
    $DockerImage = "local-crt-image"
)

if (!(Test-Path $PathToMachineSpecificIncludes)) {
    Write-Host -foregroundcolor red "Path '$PathToMachineSpecificIncludes' was not found. Set 'PathToMachineSpecificIncludes'"
    exit 1
}

if ([string]::IsNullOrEmpty($MachineSpecificIncludeFileName)) {
    $pathToDefaultSettingsXml = Join-Path $PathToRepository -ChildPath "AutomatedProcedures\Default.Settings.include"
    $defaultSettingsXml = [xml](get-content $pathToDefaultSettingsXml)
    $defaultSettingsXml.Load($pathToDefaultSettingsXml)

    $projectPrefix = $defaultSettingsXml.selectNodes("/project/property[@name = 'Project.Prefix']/@value").value
    $branchName = Invoke-Expression "git rev-parse --abbrev-ref HEAD"
    $MachineSpecificIncludeFileName = $projectPrefix + "-" + $branchName + ".Settings.include"
}

$pathToMachineSpecificIncludeFile = Join-Path $PathToMachineSpecificIncludes -ChildPath $MachineSpecificIncludeFileName
if (!(Test-Path $pathToMachineSpecificIncludeFile)) {
    Write-Host -foregroundcolor red "Path '$pathToMachineSpecificIncludeFile' was not found. Set 'MachineSpecificIncludeFileName'"
    exit 1
}

$machineSpecificXml = [xml](get-content $pathToMachineSpecificIncludeFile)
$machineSpecificXml.Load($pathToMachineSpecificIncludeFile)

$licenseType = $machineSpecificXml.selectNodes("/project/property[@name = 'Innovator.License.Type']/@value").value
$licenseCompany = $machineSpecificXml.selectNodes("/project/property[@name = 'Innovator.License.Company']/@value").value
$licenseKey = $machineSpecificXml.selectNodes("/project/property[@name = 'Innovator.License.Key']/@value").value
$activationKey = $machineSpecificXml.selectNodes("/project/property[@name = 'Innovator.Activation.Key']/@value").value
$pathToCodeTreeZip = $machineSpecificXml.selectNodes("/project/property[@name = 'Path.To.CodeTree.Zip']/@value").value
$pathToDBBak = $machineSpecificXml.selectNodes("/project/property[@name = 'Path.To.DB.Bak']/@value").value
$verifiedLicense = $null

if (!$licenseType -or !$licenseCompany -or !$licenseKey -or !$activationKey -or !$pathToCodeTreeZip -or !$pathToDBBak) {
    Write-Host -foregroundcolor red "
    Machine.Settings.Include does not contain some data.
    Required:
        - Innovator.License.Type;
        - Innovator.License.Company;
        - Innovator.License.Key;
        - Innovator.Activation.Key;
        - Path.To.CodeTree.Zip;
        - Path.To.DB.Bak;
    "
    exit 1
}

if ($licenseType -ne "Verified") {
    Write-Host -foregroundcolor red "'Verified' license required"
    exit 1
}

$pathToCodeTreeZipParentFolder = Split-Path $pathToCodeTreeZip -Parent
$pathToDBBakParentFolder = Split-Path $pathToDBBak -Parent

if ($pathToCodeTreeZipParentFolder -ne $pathToDBBakParentFolder) {
    Write-Host -foregroundcolor red "CodeTree.Zip and DB.Bak must be in the same folder"
    exit 1
}

$verifiedLicense = '<License lic_type=\"Verified\" lic_key=\"' + $licenseKey + '\" company=\"' + $licenseCompany + '\" act_key=\"' + $activationKey + '\" />'

Write-Host -foregroundcolor yellow "Create docker image '$DockerImage' from dockerfile"
docker build -t $DockerImage $PathToRepository

Write-Host -foregroundcolor yellow "Create docker container from image '$DockerImage'"
docker run -it `
    --rm `
    -v ${PathToMachineSpecificIncludes}:${PathToMachineSpecificIncludes}:ro `
    -v ${pathToCodeTreeZipParentFolder}:${pathToCodeTreeZipParentFolder}:ro `
    -v ${PathToRepository}:C:\Repository `
    --env Innovator.License.String=$VerifiedLicense `
    $DockerImage `
    "C:\Repository\ContinuousIntegration.bat"
