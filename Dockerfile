FROM mcr.microsoft.com/windows:1809

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

# Disable IE customization windows during first run to allow client unit tests
RUN New-Item -Path "\"HKLM:\\SOFTWARE\\Policies\\Microsoft\\Internet Explorer\\Main\"" -Force; \
    New-ItemProperty -Path "\"HKLM:\\SOFTWARE\\Policies\\Microsoft\\Internet Explorer\\Main\"" -Name "DisableFirstRunCustomize" -Value 1 -Force

# Setup NetFx3
RUN Invoke-WebRequest -UseBasicParsing -Uri https://dotnetbinaries.blob.core.windows.net/dockerassets/microsoft-windows-netfx3-1809.zip -OutFile microsoft-windows-netfx3.zip; \
    Expand-Archive microsoft-windows-netfx3.zip; \
    Remove-Item -Force microsoft-windows-netfx3.zip; \
    Add-WindowsPackage -Online -PackagePath .\\microsoft-windows-netfx3\\microsoft-windows-netfx3-ondemand-package~31bf3856ad364e35~amd64~~.cab; \
    Remove-Item -Force -Recurse microsoft-windows-netfx3

# Enable .Net and IIS Features
RUN Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer,IIS-ASP,IIS-ASPNET,IIS-ASPNET45,IIS-NetFxExtensibility,IIS-ISAPIExtensions,IIS-ISAPIFilter,IIS-WindowsAuthentication -All

# Download chocolatey
RUN Set-ExecutionPolicy Unrestricted -Force; \
    Invoke-Expression (New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1')

# Install chocolatey packages
RUN choco install git.install -y
# Since Google maintains only last version of Google Chrome
RUN choco install googlechrome -y
RUN choco install dotnetfx --version 4.7.2.20180712 -y
RUN choco install netfx-4.7.2-devpack -y
RUN choco install visualstudio2019buildtools --version 16.4.5.0 -y
RUN choco install dotnetcore-runtime --version 2.1.9 -y; \
    choco install dotnetcore-windowshosting --version 2.1.9 -y
RUN choco install dotnetcore-runtime --version 3.1.4 -y; \
    choco install dotnetcore-windowshosting --version 3.1.4 -y
RUN choco install nodejs --version 10.15.1 -y
RUN choco install firefoxesr --version 60.0 -y
RUN choco install vcredist2010 --version 10.0.40219.2 -y
RUN choco install visualstudio2019-workload-webbuildtools -y
RUN choco install visualstudio2019-workload-databuildtools -y

# Enhance a limit for a filename to 4096 characters to avaoid long path issues
# Allow Windows to handle paths more than 260 characters
RUN & 'C:\\Program Files\\Git\\bin\\git.exe' config --global core.longpaths true;