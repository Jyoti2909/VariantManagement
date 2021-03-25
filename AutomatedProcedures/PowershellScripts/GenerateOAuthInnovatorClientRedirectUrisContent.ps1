[CmdletBinding()]
param(
	[string]$OAuthInnovatorClientRedirectPaths,

	[string]$InnovatorServerUrl,

	[Parameter(Mandatory=$true)]
	[string]$RedirectUrisContentFile,

	[Parameter(Mandatory=$true)]
	[string]$PostLogoutRedirectUrisContentFile,

	[Parameter(Mandatory=$true)]
	[string]$ErrorLogFile
)

function ParseInnovatorServerWebAlias([System.URI]$innovatorServerUri)
{
	[int]$index = 0
	[string[]]$uriSegments = $innovatorServerUri.Segments
	# Set value to emtpy string to avoid extra space
	[string]$innovatorServerWebAlias = ""
	# Next comparison is case-insensitive.
	# To make it case-sensitive add 'c' to operator (for example -cne)
	while (($uriSegments[$index] -ne "Server/") -and
		($index -lt $uriSegments.Count) -and
		($uriSegments[$index] -notlike "*.aspx"))
	{
		$innovatorServerWebAlias += $uriSegments[$index]
		$index++
	}
	return $innovatorServerWebAlias
}

try
{
	$innovatorClientUrls = @()
	# "if ($variable)" returns $false when $variable is null or empty
	if ($OAuthInnovatorClientRedirectPaths)
	{
		$redirectPaths = $OAuthInnovatorClientRedirectPaths.Split(";")
		$notWellFormedUris = @();
		foreach ($redirectPath in $redirectPaths)
		{
			if ([System.URI]::IsWellFormedUriString($redirectPath, [System.UriKind]::Absolute))
			{
				$innovatorClientUrls += $redirectPath
			}
			else
			{
				$notWellFormedUris += $redirectPath;
			}
		}
		if ($notWellFormedUris.Count -gt 0)
		{
			Add-Content $ErrorLogFile "Not well-formed URI(s):`n${notWellFormedUris}"
		}
		if (-not $innovatorClientUrls)
		{
			throw "Cannot build Redirect URI(s)."
		}
	}
	elseif ($InnovatorServerUrl)
	{

			$innovatorServerUri = New-Object -TypeName System.URI -ArgumentList $InnovatorServerUrl
			# $innovatorServerUri.Host may contain localhost, IP, Computername or FQDN
			# GetHostEntry allow to get FQDN by any of this values
			$dnsHostName = [System.Net.Dns]::GetHostEntry($innovatorServerUri.Host).HostName
			$innovatorServerHosts = @()
			# Add always "localhost"
			$innovatorServerHosts += "localhost"
			# Add host name (computer name)
			$innovatorServerHosts += $dnsHostName.Split(".")[0]
			# Add FQDN
			$innovatorServerHosts += $dnsHostName
			# Get IP addresses for FQDN (IPv4 only)
			$innovatorServerHosts += [System.Net.Dns]::GetHostAddresses($dnsHostName) | Where { $_.AddressFamily -like "InterNetwork" }
			# Remove possible hosts duplicate
			$innovatorServerHosts = $innovatorServerHosts | Select -Unique

			[string]$webAlias = ParseInnovatorServerWebAlias $innovatorServerUri

			foreach ($innovatorServerHost in $innovatorServerHosts)
			{
				$innovatorClientUrls += "$($innovatorServerUri.Scheme)://${innovatorServerHost}${webAlias}Client"
			}
	}
	else
	{
		throw "Cannot build Redirect URI(s):`nOAuthInnovatorClientRedirectPaths and InnovatorServerUrl parameters are empty."
	}
	# Create redirectUris content based on redirectUris values
	$redirectUrisContent = @();
	$postLogoutRedirectUrisContent = @();
	foreach ($innovatorClientUrl in $innovatorClientUrls)
	{
		$redirectUrisContent += "`t`t`t`t`t<redirectUri value='${innovatorClientUrl}/OAuth/RedirectCallback' />"
		$redirectUrisContent += "`t`t`t`t`t<redirectUri value='${innovatorClientUrl}/OAuth/SilentCallback' />"
		$redirectUrisContent += "`t`t`t`t`t<redirectUri value='${innovatorClientUrl}/OAuth/PopupCallback' />"
		$postLogoutRedirectUrisContent += "`t`t`t`t`t<redirectUri value='${innovatorClientUrl}/OAuth/PostLogoutCallback' />"
	}
	$redirectUrisContent | Out-File $RedirectUrisContentFile
	$PostLogoutRedirectUrisContent | Out-File $PostLogoutRedirectUrisContentFile
}
catch
{
	# Write full exception with stack trace
	Add-Content $ErrorLogFile $_.Exception | Format-List -Force
}
