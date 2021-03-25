[string]$pathToATFFolder = $args[0];

$ErrorActionPreference = "Stop";

try {
	Push-Location -Path $pathToATFFolder -StackName "ATF";

	.\AddFirewallRuleESAgent.ps1
	.\AddFirewallRuleESFileProcessor.ps1
	.\AddFirewallRuleESIndex.ps1

	Pop-Location -StackName "ATF";
}
catch {
	$_
	exit 1
}
