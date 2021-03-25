#
# ESInstall.ps1
#
param (
	[Parameter(Mandatory = $True, position=0)]
	[ValidateNotNullorEmpty()]
	[string]$type,
	[Parameter(Mandatory = $True, position=1)]
	[ValidateNotNullorEmpty()]
	[string]$config,
	[Parameter(Mandatory = $True, position=2)]
	[ValidateNotNullorEmpty()]
	[string]$msiPath,
	[Parameter(position=3)]
	[AllowNull()]
	[string]$logfile
)

<# It used when the script is run not on the domain computer

$sessionopt = New-PSSessionOption -SkipCACheck -SkipCNCheck -SkipRevocationCheck
$User = "<Domain>\<User>"
$PWord = ConvertTo-SecureString -String "<Password>" -AsPlainText -Force
$cred = New-Object -TypeName "System.Management.Automation.PSCredential" -ArgumentList $User, $PWord

#>

function WriteLog
{
	[CmdLetBinding()]
	Param (
	[Parameter(Mandatory=$True, ValueFromPipeline=$True, ValueFromPipelinebyPropertyName=$True)]
	[ValidateNotNullorEmpty()]
	[System.String]$value
	)
	"$(Get-Date) - $value" | Out-File $GeneralLogPath -Append -Encoding ASCII
	write-host ("$(Get-Date) - $value")
}

function Unzip-File
{
	param (
		[Parameter(Mandatory = $True, position=0)]
		[ValidateNotNullorEmpty()]
		[string]$zipfile,
		[Parameter(Mandatory = $True, position=1)]
		[ValidateNotNullorEmpty()]
		[string]$destination
	)

	try
	{
		$fileInfo = Get-Item -Path $zipfile
		$appName = New-Object -ComObject Shell.Application
		$zipName = $appName.NameSpace($fileInfo.FullName)
		$dstFolder = $appName.NameSpace($destination)
		$dstFolder.Copyhere($zipName.Items())
	}
	catch 
	{
		"Unzip-File exception: $($_.Exception.Message)" | WriteLog
		Exit 1

	}
}

Function CheckWorkDirectory
{
	try
	{
		if (($type -eq "remove") -or
			((Test-Path $IndexMsiFile) -and
			 (Test-Path $AgentMsiFile) -and
			 (Test-Path $FileProcessorMsiFile))
		)
		{
			return $true
		}

		$null = New-Item -Path $ScriptWorkDir -ItemType Directory -Force
		if ($type -eq "install")
		{
			Unzip-File $msiPath $ScriptWorkDir
			if (!(Test-Path $IndexMsiFile))
			{
				"$($IndexMsiFile) was not found in the archive file" | WriteLog 
				return $false
			}
			if (!(Test-Path $AgentMsiFile))
			{
				"$($AgentMsiFile) was not found in the archive file" | WriteLog
				return $false
			}

			if (!(Test-Path $FileProcessorMsiFile))
			{
				"$($FileProcessorMsiFile) was not found in the archive file" | WriteLog
				return $false
			}
		}
		return $true
	}
	catch
	{
		Write-Host "Check work directory exception: " + $error[0].Exception
	}
	return $false
}

function CreateRemoteDirectoryIfItDoNotExist {
	[CmdLetBinding()]
	Param (
		[Parameter(Mandatory=$True, position=0)]
		[AllowNull()]
		[System.Management.Automation.Runspaces.PSSession]$session,
		[Parameter(Mandatory = $True, position=1)]
		[ValidateNotNullorEmpty()]
		[System.String]$dirPath
	)

	$createDirIfItDoNotExistScriptBlock = {
		$result= !(Test-Path -Path $args[0])
		if ($result) {
			New-Item -Path $args[0] -ItemType Directory
		}
		$result
	}
	if ($session)
	{
		Invoke-Command -session $session -ScriptBlock $createDirIfItDoNotExistScriptBlock -ArgumentList $dirPath
	}
	else
	{
		& $createDirIfItDoNotExistScriptBlock $dirPath
	}
}

function ExistsRemoteDirectoryOrFile {
	[CmdLetBinding()]
	Param (
		[Parameter(Mandatory=$True, position=0)]
		[AllowNull()]
		[System.Management.Automation.Runspaces.PSSession]$session,
		[Parameter(Mandatory = $True, position=1)]
		[ValidateNotNullorEmpty()]
		[string]$filePath
	)
	if ($session)
	{
		Invoke-Command -Session $session -ScriptBlock {Test-Path -path $args[0]} -ArgumentList $filePath
	}
	else
	{
		Test-Path $filePath
	}
}

function CopyItemToSession {
	param(
		[Parameter(Mandatory = $true)]
		[string]$Path,
		[Parameter(Mandatory = $true)]
		[string]$Destination,
		[Parameter(Mandatory = $true)]
		[System.Management.Automation.Runspaces.PSSession] $ToSession
	)

	$remoteScript = {
		param($destfile, $bytes)
		$file = [IO.File]::Open($destfile, "OpenOrCreate")
		$null = $file.Seek(0, "End")
		$null = $file.Write($bytes, 0, $bytes.Length)
		$file.Close()
	}

	$destinationFilePath = $Destination + "\" + (Split-Path -Path $Path -Leaf)
	$streamSize = 1MB
	$rawBytes = New-Object byte[] $streamSize
	$file = [IO.File]::OpenRead($Path)
	while(($read = $file.Read($rawBytes, 0, $streamSize)) -gt 0)
	{
		if($read -ne $rawBytes.Length)
		{
			$lastChunk = New-Object byte[] $read
			[Array]::Copy($rawBytes,$lastChunk,$read)
			Invoke-Command -Session $ToSession $remoteScript -ArgumentList $destinationFilePath,$lastChunk
			break
		}
		else
		{
			Invoke-Command -Session $ToSession $remoteScript -ArgumentList $destinationFilePath,$rawBytes
		}
	}
	$file.Close()
}

function PrepareInstall 
{
	[CmdLetBinding()]
	Param (
		[parameter(Mandatory=$True, position=0)]
		[AllowNull()]
		[System.Management.Automation.Runspaces.PSSession]$session,
		[Parameter(Mandatory=$True, position=1)]
		[ValidateNotNullorEmpty()]
		[string]$installFilePath,
		[Parameter(Mandatory=$True, position=2)]
		[ValidateNotNullorEmpty()]
		[string]$installDir
	)

	$ok = ExistsRemoteDirectoryOrFile -session $session -filePath $installDir
	if ($ok) 
	{
		"Directory: $($installDir) on the remote machine already exists" | WriteLog
		return $null
	}

	if (CreateRemoteDirectoryIfItDoNotExist -Session $session -DirPath $installDir) 
	{
		"Directory: $($installDir) successfully created" | WriteLog
		"Copy MSI installation package from $($installFilePath) to $($installDir)" | WriteLog
		if ($session)
		{
			CopyItemToSession -Path $installFilePath -Destination $installDir -ToSession $session
		}
		else
		{
			Copy-Item -Path $installFilePath -Destination $installDir
		}
		return Join-Path -Path $installDir -ChildPath (Split-Path -Path $installFilePath -Leaf)
	}
	 
	"Error in creating directory: $($installDir)" | WriteLog
	return $null
}

function Install 
{
	[CmdLetBinding()]
	Param
	(
		[parameter(Mandatory = $True, position=0)]
		[AllowNull()]
		[System.Management.Automation.Runspaces.PSSession]$session,
		[parameter(Mandatory = $True, position=1)]
		[ValidateNotNullorEmpty()]
		[System.String]$installFilePath,
		[parameter(Mandatory = $true, position=2)]
		[ValidateNotNullorEmpty()]
		[System.Collections.HashTable]$hashTableParameters
	)
	$logFilePath = Join-Path -Path (Split-Path -Path $installFilePath) -ChildPath "msilog_install.log"
		
	$arguments = "/i {0} /qn /log {1} /norestart" -f $installFilePath, $logFilePath
	$hashTableParameters.GetEnumerator() | % {
		$arguments += " {0}=`"{1}`"" -f $_.key, $_.value 
	}

	"Attempting to install $($installFilePath)" | WriteLog

	if ($session)
	{
		$exitCode = Invoke-Command -session $session -ScriptBlock {
			(Start-Process msiexec.exe -ArgumentList $args[0] -NoNewWindow -Wait -PassThru).ExitCode
		} -ArgumentList $arguments
	}
	else
	{
		$exitCode = (Start-Process msiexec.exe -ArgumentList $arguments -NoNewWindow -Wait -PassThru).ExitCode
	}
	if ($exitCode -eq 0)
	{
		"$($installFilePath) has been successfully installed" | WriteLog
		return $ExitCode
	} 
	else 
	{
		"Installer exit code $($exitCode) for file $($installFilePath)" | WriteLog
		return $exitCode
	}
}

function StartService 
{
	[CmdLetBinding()]
	Param 
	(
		[parameter(Mandatory=$True, position=0)]
		[AllowNull()]
		[System.Management.Automation.Runspaces.PSSession]$session,
		[Parameter(Mandatory=$True, position=1)]
		[ValidateNotNullorEmpty()]
		[System.String]$serviceName
	)

	try
	{
		if ($session)
		{
			Invoke-Command -Session $session -ScriptBlock {
				$service = Start-Service -name $args[0] -passThru
				$service.WaitForStatus('Running', (new-timespan -seconds 300))
			} -ArgumentList $serviceName
		}
		else
		{
			$service = Start-Service -name $serviceName -passThru
			$service.WaitForStatus('Running', (new-timespan -seconds 300))
		}
	}
	catch 
	{
		"StartService exception: $($_.Exception.Message)" | WriteLog
	} 
}

function WaitPing 
{
	[CmdLetBinding()]
	Param (
		[parameter(Mandatory = $True, position=0)]
		[AllowNull()]
		[System.Management.Automation.Runspaces.PSSession]$session,
		[Parameter(Mandatory = $True, position=1)]
		[ValidateNotNullOrEmpty()]
		[ValidateRange(1, 65535)]
		[System.String]$Port,
		[Parameter(position=2)]
		[ValidateNotNullOrEmpty()]
		[int]$maxNumberRequests  = 25,
		[Parameter(position=3)]
		[ValidateNotNullOrEmpty()]
		[int]$millisecondsForSleep = 1000,
		[Parameter(position=4)]
		[ValidateNotNullOrEmpty()]
		[int]$TCPtimeout = 10000,
		[string]$hostIP = "127.0.0.1"
	)
		$waitPingScriptBlock = { param($p,$num,$mill,$tout,$hostIP)
			do {
				$ping = New-Object System.Net.Sockets.TCPClient
				$connect = $ping.beginConnect($hostIP, $p, $null, $null)
				$connect.AsyncWaitHandle.WaitOne($tout, $false) | Out-Null
				$testPing = $ping.Connected
				$ping.Close()

				if (!($testPing)) {
					Start-Sleep -m $mill
				}
				if (++$attempts -eq $num) {
					$attempts = -1;
					break;
				}
			} until($testPing)
			$attempts
		}
	if ($session)
	{
		Invoke-Command -Session $session -ScriptBlock $waitPingScriptBlock -ArgumentList $Port, $maxNumberRequests, $millisecondsForSleep, $TCPtimeout, "127.0.0.1"
	}
	else
	{
		& $waitPingScriptBlock $Port $maxNumberRequests $millisecondsForSleep $TCPtimeout $hostIP
	}
}

function GenerateUnInstallPS1File 
{
	[CmdLetBinding()]
	Param 
	(
		[parameter(Mandatory=$True, position=0)]
		[AllowNull()]
		[System.Management.Automation.Runspaces.PSSession]$session,
		[Parameter(Mandatory=$True, position=1)]
		[ValidateNotNullorEmpty()]
		[string]$installDir,
		[Parameter(position=2)]
		[string]$PreviousCommand,
		[Parameter(position=3)]
		[string]$FollowCommand
	)
	
	$generatePS1FileScriptBlock = { param($dir,$prev,$follow)
		$configFilePath = Join-Path -Path $dir -ChildPath "\service.config"
		$logFile = Join-Path -Path $dir -ChildPath "..\msilog_uninstall.log"
		$unInstallFilePath = Join-Path -Path $dir -ChildPath "..\uninstall.ps1"

		if (Test-Path -Path $configFilePath) 
		{
			$serviceConfig = (Get-Content -Path $configFilePath) -as [Xml]
			$nodePorductCode = $serviceConfig.SelectSingleNode("configuration/ProductCode")
			if ($nodePorductCode) 
			{
				$command = ""
				if ($prev)
				{
					$command += $prev
				}
				$command += "`$res = (Start-Process msiexec.exe -ArgumentList `"/x {0} /qn /log {1} /norestart`" -NoNewWindow -Wait -PassThru).ExitCode" -f $nodePorductCode.InnerXml, $logFile
				if ($follow)
				{
					$command += "`n" + $follow
				}
				$command += "`n`$res"
				New-Item $unInstallFilePath -Type file -Force -Value $command
			}
		}
	}
	if ($session)
	{
		Invoke-Command -Session $session -ScriptBlock $generatePS1FileScriptBlock -ArgumentList $installDir,$PreviousCommand,$FollowCommand
	}
	else
	{
		& $generatePS1FileScriptBlock $installDir $PreviousCommand $FollowCommand
	}
}

function OpenPSSession 
{
	[CmdLetBinding()]
	Param
	(
		[Parameter(Mandatory=$True, position=0)]
		[ValidateNotNullorEmpty()]
		[string]$computerName
	)

	if ($computerName -eq [environment]::MachineName)
	{
		return $null
	}
		
	<# It used when the script is run not on the domain computer
	$session = New-PSSession -ComputerName $computerName -Credential $cred -Authentication Negotiate -UseSSL:$true -SessionOption $sessionopt
	#>
	$session = New-PSSession -ComputerName $computerName
	if(!($session)) 
	{
		throw "Fails to connect to $($computername)"
	}
	return $session 
}

function InstallIndex {
	[CmdLetBinding()]
	Param (
		[Parameter(Mandatory=$True, position=0)]
		[ValidateNotNullorEmpty()]
		[string]$computerName,
		[Parameter(Mandatory=$True, position=1)]
		[ValidateNotNullorEmpty()]
		[string]$installDir,
		[Parameter(Mandatory=$True, position=2)]
		[ValidateNotNullorEmpty()]
		[string]$installFilePath,
		[Parameter(Mandatory=$true, position=3)]
		[ValidateNotNullorEmpty()]
		[System.Collections.HashTable]$hashTableParameters
	)

	try 
	{
		$session = OpenPSSession $computerName
		$installRemoteFilePath = PrepareInstall -Session $session -InstallFilePath $installFilePath -InstallDir $installDir
		if (!$installRemoteFilePath)
		{
			return $false
		}

		if ((Install -Session  $session -InstallFilePath $installRemoteFilePath -hashTableParameters $hashTableParameters) -eq 0) 
		{
			StartService -Session  $session -ServiceName $hashTableParameters.Get_Item("SERVICE_NAME")
			$Previous = "get-service '$($hashTableParameters.Get_Item("ZOO_SERVICE_NAME"))' | stop-service | Out-Null`n" + 
				"get-service '$($hashTableParameters.Get_Item("SERVICE_NAME"))' | stop-service | Out-Null`n"
#			$Follow = "Stop-Process -name java -force"
#			if (GenerateUnInstallPS1File $session $hashTableParameters.Get_Item("INSTALLFOLDER_INDEX") $Previous $Follow)
			if (GenerateUnInstallPS1File $session $hashTableParameters.Get_Item("INSTALLFOLDER_INDEX") $Previous)
			{
				$numberRequestsSolr = WaitPing -Session  $session -Port $hashTableParameters.Get_Item("SOLR_PORT") -millisecondsForSleep 20000 -hostIP $hashTableParameters.Get_Item("IP_HOSTNAME")
				if ($numberRequestsSolr -gt 0) 
				{
					"Connection with Solr is established after $($numberRequestsSolr) attempts" | WriteLog
				}
				else
				{
					"Could not establish a connection with Solr" | WriteLog
					return $false
				}

#				if (Test-Port $hashTableParameters.Get_Item("IP_HOSTNAME") $hashTableParameters.Get_Item("SERVICE_PORT") 140000)
				$numberRequestsClusterService = WaitPing -Session  $session -Port $hashTableParameters.Get_Item("SERVICE_PORT") -hostIP $hashTableParameters.Get_Item("IP_HOSTNAME")
				if ($numberRequestsClusterService -gt 0) 
				{
					"Connection with Cluster Service is established after $($numberRequestsClusterService) attempts" | WriteLog
					return $true
				}
				else
				{
					"Could not establish a connection with Cluster Service" | WriteLog
				}
			}
		}
	} 
	catch 
	{
		"Install index exception: $($_.Exception.Message)" | WriteLog
	} 
	finally 
	{
		if ($session) 
		{
			Remove-PSSession -Session $session
		}
	}
	return $false
}

function InstallAgent 
{
	[CmdLetBinding()]
	Param (
		[Parameter(Mandatory=$True, position=0)]
		[ValidateNotNullorEmpty()]
		[string]$computerName,
		[Parameter(Mandatory=$True, position=1)]
		[ValidateNotNullorEmpty()]
		[string]$installDir,
		[Parameter(Mandatory=$True, position=2)]
		[ValidateNotNullorEmpty()]
		[string]$installFilePath,
		[Parameter(Mandatory=$true, position=3)]
		[ValidateNotNullorEmpty()]
		[System.Collections.HashTable]$hashTableParameters
	)
	
	try 
	{
		$session = OpenPSSession $computerName
		$installRemoteFilePath = PrepareInstall -Session $session -InstallFilePath $installFilePath -InstallDir $InstallDir
		if (!$installRemoteFilePath)
		{
			return $false
		}
		
		if ((Install -Session  $session -InstallFilePath $installRemoteFilePath -hashTableParameters $hashTableParameters) -eq 0) 
		{
			$Previous = "get-service '$($hashTableParameters.Get_Item("SERVICE_NAME"))' | stop-service | Out-Null`n"
			if (GenerateUnInstallPS1File $session $hashTableParameters.Get_Item("INSTALLFOLDER_AGENT") $Previous)
			{
				return $true
			}
		}
	} 
	catch 
	{
		"Install agent exception: $($_.Exception.Message)" | WriteLog
	} 
	finally 
	{
		if ($session) 
		{
			Remove-PSSession -Session $session
		}
	}
	return $false
}

function InstallFileProcessor 
{
	[CmdLetBinding()]
	Param (
		[Parameter(Mandatory=$True, position=0)]
		[ValidateNotNullorEmpty()]
		[string]$computerName,
		[Parameter(Mandatory=$True, position=1)]
		[ValidateNotNullorEmpty()]
		[string]$installDir,
		[Parameter(Mandatory=$True, position=2)]
		[ValidateNotNullorEmpty()]
		[string]$installFilePath,
		[Parameter(Mandatory=$true, position=3)]
		[ValidateNotNullorEmpty()]
		[System.Collections.HashTable]$hashTableParameters
	)
	
	try 
	{
		$session = OpenPSSession $computerName
		$installRemoteFilePath = PrepareInstall -Session $session -InstallFilePath $installFilePath -InstallDir $InstallDir
		if (!$installRemoteFilePath)
		{
			return $false
		}

		if ((Install -Session  $session -InstallFilePath $installRemoteFilePath -hashTableParameters $hashTableParameters) -eq 0) 
		{
			$Previous = "get-service '$($hashTableParameters.Get_Item("SERVICE_NAME"))' | stop-service | Out-Null`n"
			if (GenerateUnInstallPS1File $session $hashTableParameters.Get_Item("INSTALLFOLDER_INDEX") $Previous)
			{
				$numberRequestsFileProcessor = WaitPing -Session  $session -Port $hashTableParameters.Get_Item("SERVICE_PORT")
				if ($numberRequestsFileProcessor -gt 0) 
				{
					"Connection with File Processor is established after $($numberRequestsFileProcessor) attempts" | WriteLog
					return $true
				}
				else
				{
					"Could not establish a connection with File Processor" | WriteLog
				}
			}
		}
	}
	catch 
	{
		"Install file processor exception: $($_.Exception.Message)" | WriteLog
	} 
	finally 
	{
		if ($session) 
		{
			Remove-PSSession -Session $session
		}
	}
	return $false
}

Function InstallComponents
{
	try
	{
		$NodeExists = $xml.ESInstall.Indexes.Component
		if ($NodeExists)
		{
			$nodes = $xml.ESInstall.Indexes.SelectNodes("Component")
			foreach ($node in $nodes) 
			{
				$ht = @{}
				$node.MSIParams.Attributes | Foreach {$ht[$_.Name] = $_.Value}
				$nstallHost = $node.Host
				if ($nstallHost -eq [string]::Empty)
				{
					$nstallHost = $env:computername
				}
				"Install ArasESIndex, host: $($nstallHost), Folder: $($node.Folder)" | WriteLog
				$ok = InstallIndex $nstallHost $node.Folder $IndexMsiFile $ht
				if ($ok -eq $false)
				{
					return $false
				}
				"Install ArasESIndex succeeded" | WriteLog
			}
		}

		$NodeExists = $xml.ESInstall.Agents.Component
		if ($NodeExists)
		{
			$nodes = $xml.ESInstall.Agents.SelectNodes("Component")
			foreach ($node in $nodes) 
			{
				$ht = @{}
				$node.MSIParams.Attributes | Foreach {$ht[$_.Name] = $_.Value}
				$nstallHost = $node.Host
				if ($nstallHost -eq [string]::Empty)
				{
					$nstallHost = $env:computername
				}
				"Install ArasESAgent, host: $($nstallHost), Folder: $($node.Folder)" | WriteLog
				$ok = InstallAgent $nstallHost $node.Folder $AgentMsiFile $ht
				if ($ok -eq $false)
				{
					return $false
				}
				"Install ArasESAgent succeeded" | WriteLog
			}
		}

		$NodeExists = $xml.ESInstall.FileProcessors.Component
		if ($NodeExists)
		{
			$nodes = $xml.ESInstall.FileProcessors.SelectNodes("Component")
			foreach ($node in $nodes) 
			{
				$ht = @{}
				$node.MSIParams.Attributes | Foreach {$ht[$_.Name] = $_.Value}
				$nstallHost = $node.Host
				if ($nstallHost -eq [string]::Empty)
				{
					$nstallHost = $env:computername
				}
				"Install ArasESFileProcessor, host: $($nstallHost), Folder: $($node.Folder)" | WriteLog
				$ok = InstallFileProcessor $nstallHost $node.Folder $FileProcessorMsiFile $ht
				if ($ok -eq $false)
				{
					return $false
				}
				"Install ArasESFileProcessor succeeded" | WriteLog
			}
		}
		return $true
	}
	catch
	{
		"Install components exception: $($_.Exception.Message)" | WriteLog
	}
	return $false
}

function RemoveComponent 
{
	[CmdLetBinding()]
	Param
	(
	[Parameter(Mandatory=$True, position=0)]
	[ValidateNotNullorEmpty()]
	[string]$computerName,
	[Parameter(Mandatory=$True, position=1)]
	[ValidateNotNullorEmpty()]
	[string]$installDir
	)

	try 
	{
		$session = OpenPSSession $computerName
		$uninstallFilePath = Join-Path -Path $installDir -ChildPath "uninstall.ps1"
		if (!(ExistsRemoteDirectoryOrFile -session $session -filePath $uninstallFilePath)) 
		{
			"$($uninstallFilePath) - script is absent" | WriteLog
			return $true
		}

		"Running  $($uninstallFilePath)" | WriteLog
		if ($session)
		{
			$res = Invoke-Command -Session $session -ScriptBlock {& $args[0]} -ArgumentList $uninstallFilePath
		}
		else
		{
			$res = & "$($uninstallFilePath)"
		}
		"Remove script result: $($res)" | WriteLog
		if (($res -eq 0 ) -or ($res -eq 3010))
		{
			if ($session)
			{
				Invoke-Command -Session $session -ScriptBlock {
					Remove-Item -Path (Split-Path -Path $args[0]) -Force -Recurse
				} -ArgumentList $uninstallFilePath
			}
			else
			{
				Remove-Item -Path (Split-Path -Path $uninstallFilePath) -Force -Recurse
			}

			"$($uninstallFilePath) - script has been executed successfully" | WriteLog
			return $true
		} 
		else 
		{
			"$($uninstallFilePath) - script has been finished with exit code $($exitCode)" | WriteLog
		}
	} 
	catch 
	{
		"Remove component exception: $($_.Exception.Message)" | WriteLog
	}
	finally 
	{
		if($session) 
		{
			Remove-PSSession -Session $session
		}
	}

	return $false
}

Function RemoveComponents
{
	try
	{
		$NodeExists = $xml.ESInstall.FileProcessors.Component
		if ($NodeExists)
		{
			$nodes = $xml.ESInstall.FileProcessors.SelectNodes("Component")
			foreach ($node in $nodes) 
			{
				$nstallHost = $node.Host
				if ($nstallHost -eq [string]::Empty)
				{
					$nstallHost = $env:computername
				}
				"Remove ArasESFileProcessor, host: $($nstallHost), Folder: $($node.Folder)" | WriteLog
				$ok = RemoveComponent $nstallHost $node.Folder
				if ($ok -eq $false)
				{
					return $false
				}
				"Remove ArasESFileProcessor succeeded" | WriteLog
			}
		}

		$NodeExists = $xml.ESInstall.Agents.Component
		if ($NodeExists)
		{
			$nodes = $xml.ESInstall.Agents.SelectNodes("Component")
			foreach ($node in $nodes) 
			{
				$nstallHost = $node.Host
				if ($nstallHost -eq [string]::Empty)
				{
					$nstallHost = $env:computername
				}
				"Remove ArasESAgent, host: $($nstallHost), Folder: $($node.Folder)" | WriteLog
				$ok = RemoveComponent $nstallHost $node.Folder
				if ($ok -eq $false)
				{
					return $false
				}
				"Remove ArasESAgent succeeded" | WriteLog
			}
		}

		$NodeExists = $xml.ESInstall.Indexes.Component
		if ($NodeExists)
		{
			$nodes = $xml.ESInstall.Indexes.SelectNodes("Component")
			foreach ($node in $nodes) 
			{
				$nstallHost = $node.Host
				if ($nstallHost -eq [string]::Empty)
				{
					$nstallHost = $env:computername
				}
				"Remove ArasESIndex, host: $($nstallHost), Folder: $($node.Folder)" | WriteLog
				$ok = RemoveComponent $nstallHost $node.Folder
				if ($ok -eq $false)
				{
					return $false
				}
				"Remove ArasESIndex succeeded" | WriteLog
			}
		}

		return $true
	}
	catch
	{
		"Remove components exception: $($_.Exception.Message)" | WriteLog
	}
	return $false
}

If ($PSVersionTable.PSVersion.Major -lt 3) 
{
	If ($PSVersionTable.PSVersion.Major -ge 2)
	{
		$PSScriptRoot = Split-Path $MyInvocation.MyCommand.Path -Parent
	}
	else
	{
		Write-Host "Please execute this script from a system that has PowerShell 3.0 or newer installed."
		Write-Host "Current version is " + $PSVersionTable.PSVersion
		Exit 1
	}
}

cd $PSScriptRoot

if ((Get-Item -Path $msiPath).PSIscontainer)
{
	$ScriptWorkDir = $msiPath
}
else
{
	$ScriptWorkDir = $PSScriptRoot + "\ESInstall_" + [io.path]::GetFileNameWithoutExtension($config) + "_" + [io.path]::GetFileNameWithoutExtension($msiPath)
}
$IndexMsiFile = Join-Path $ScriptWorkDir "ArasESIndexSetup.msi"
$AgentMsiFile = Join-Path $ScriptWorkDir "ArasESAgentSetup.msi"
$FileProcessorMsiFile = Join-Path $ScriptWorkDir "ArasESFileProcessorSetup.msi"

if (!$logfile) 
{
	$GeneralLogPath = Join-Path $ScriptWorkDir "ESInstall.log"
}
else
{
	$GeneralLogPath = $logfile
}

[xml]$xml = Get-Content $config

if (($type -ne "install") -and ($type -ne "remove"))
{
	Write-Host "The unrecognized type of the operation: " + $type
	Exit 1
}

$ok = CheckWorkDirectory
if ($ok -eq $false)
{
	Write-Host "Failed to create the working directory"
	Exit 1
}

"Start operation: $($type)" | WriteLog

if ($type -eq "install")
{
	$ok = InstallComponents
}
else
{
	$ok = RemoveComponents
}
if ($ok -eq $false)
{
	"ESInstall failed!" | WriteLog
	Exit 1
}
"ESInstall succeeded." | WriteLog
