Param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('Deployment', 'ContinuosIntegration')]
    [string]$EnvironmentType = 'ContinuosIntegration'
)

# Disable IE customization windows during first run to allow client unit tests
New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Internet Explorer\\Main" -Force;
New-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Internet Explorer\\Main" -Name "DisableFirstRunCustomize" -Value 1 -Force

# Setup NetFx3
Invoke-WebRequest -UseBasicParsing -Uri https://dotnetbinaries.blob.core.windows.net/dockerassets/microsoft-windows-netfx3-1809.zip -OutFile microsoft-windows-netfx3.zip
Expand-Archive microsoft-windows-netfx3.zip
Remove-Item -Force microsoft-windows-netfx3.zip
Add-WindowsPackage -Online -PackagePath .\\microsoft-windows-netfx3\\microsoft-windows-netfx3-ondemand-package~31bf3856ad364e35~amd64~~.cab
Remove-Item -Force -Recurse microsoft-windows-netfx3

# Enable .Net and IIS Features
@(
    "IIS-WebServer",
    "IIS-ASP",
    "IIS-ASPNET",
    "IIS-ASPNET45",
    "IIS-NetFxExtensibility",
    "IIS-ISAPIExtensions",
    "IIS-ISAPIFilter",
    "IIS-WindowsAuthentication") | Foreach-Object { Write-Host "Enabling $_ Windows optional feature..."; Enable-WindowsOptionalFeature -Online -FeatureName $_ -All }

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072

# Download chocolatey
Invoke-Expression (New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1')

# Install chocolatey packages
@(
    "dotnetfx --version 4.7.2.20180712",
    "dotnetcore-runtime --version 2.1.9",
    "dotnetcore-windowshosting --version 2.1.9",
    "dotnetcore-runtime --version 3.1.4",
    "dotnetcore-windowshosting --version 3.1.4",
    "firefoxesr",
    "googlechrome",
    "vcredist2010 --version 10.0.40219.2"
) | Foreach-Object { Invoke-Expression "choco install $_ -y" }

if ($EnvironmentType -eq 'ContinuosIntegration') {
    @(
        "git.install",
        "visualstudio2019buildtools --version 16.4.5.0",
        "visualstudio2019-workload-databuildtools",
        "visualstudio2019-workload-webbuildtools",
        "netfx-4.7.2-devpack",
        "nodejs --version 10.15.1"
    ) | Foreach-Object { Invoke-Expression "choco install $_ -y" }

    # Enhance a limit for a filename to 4096 characters to avaoid long path issues
    & 'C:\\Program Files\\Git\\bin\\git.exe' config --global core.longpaths true
}