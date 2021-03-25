AutomatedProcedures folder contains tools for automated tasks such as restoration of Innovator instance and deploy upgrade.
Contents of the folder:
	- ConfigureNpmToWorkWithProxy.bat:
		Target audience: Deployment engineer;
		Purpose: Setup proxy server for NodeJs for environment without intenet access
	- ConvertPackageMethodsFromCsToXml.bat:
		Target audience: Development team;
		Purpose: Updates method code of package methods from the directory AML-packages with code from .cs files from the project CSharpMethods.csproj;
		Details: Documentation\For Developers\Developer Tools Overview.docx
	- ConvertPackageMethodsFromXmlToCs.bat:
		Target audience: Development team;
		Purpose: Converts package methods from the directory AML-packages to .cs files and includes them to the project CSharpMethods.csproj;
		Details: Documentation\For Developers\Developer Tools Overview.docx
	- CreateZipWithDeploymentPackageAndScripts.bat:
		Target audience: Deployment engineer;
		Purpose: Create Zip archive with deployment script that can be used to upgrade the target server;
		Details: Documentation\Misc\Deploy & CI.docx
	- Deploy.bat:
		Target audience: QA team, Deployment engineer;
		Purpose: Deploy upgrade to the target server
		Details: Documentation\Misc\Deploy & CI.docx
	- DeployFromZipArchiveWithPackageAndScripts.bat:
		Target audience: Deployment engineer, QA team;
		Purpose: Deploy upgrade to the target server from zip with diff
		Details: Documentation\Misc\Deploy & CI.docx
	- DeployToCustomEnvironment.bat:
		Target audience: QA team, Deployment engineer;
		Purpose: Deploy upgrade to a different from Deploy.bat target server
	- NantScript.xml:
		Target audience: Deployment engineer;
		Purpose: Contains nant scripts with targets used by the mentioned batch files.
	- PublishCodeTreeBackup.bat:
		Target audience: Deployment engineer;
		Purpose: Create CodeTree.zip based on current innovator state and publish it
	- PublishDatabaseBackup.bat:
		Target audience: Deployment engineer;
		Purpose: Create DB.bak based on current innovator state and publish it
	- PublishNewBaseline.bat:
		Target audience: Deployment engineer;
		Purpose: Create CodeTree.zip and DB.bak based on current innovator state and publishes it using Path.To.CodeTree.Zip and Path.To.DB.Bak properties.	
	- RemoveThisInnovator.bat:
		Target audience: Development team;
		Purpose: Remove instance of Innovator, that was configured by SetupInnovatorHere.bat. This action will remove IIS application, database and Agent Service
		Details: Documentation\For Developers\Developer Tools Overview.docx
	- RestoreInnovatorFromBackups.bat:
		Target audience: QA team;
		Purpose: Restore instance of Innovator from code tree and database backups;
		Details: Documentation\Misc\Deploy & CI.docx
	- SetupInnovatorFromBaseline.bat:
		Target audience: Developer team, QA team
		Purpose: Setup local instance of Innovator from production backups
		Details: Documentation\Misc\Deploy & CI.docx
	- SetupPrerequisitesForOfflineCI.ps1:
		Target audience: Deployment engineer;
		Purpose: Setup prerequisites for running CI build of CustomRepositoryTemplate or related forks.

DEBUG NOTES
If you want to run the scripts on a *local machine* without real access to machine prod-backups-server, while using default values
from Default.Settings.include then do the following:
1) Put a record for name prod-backups-server into C:\Windows\System32\drivers\etc\hosts
	127.0.0.1 prod-backups-server

2) Make prod-backups-server an optional NetBIOS name for the local machine. This can be made via Windows registry
	2.1) Set OptionalNames manually ("New -> String Value" if you need one optional name, or "New -> Multi-String Value" if	you need several names)
	Windows Registry Editor Version 5.00

	[HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters]
	"OptionalNames"="prod-backups-server"

	2.2) Restart Server service (Supports file, print, and named-pipe sharing over the network for the computer.)

3) Create a network share with name "prod-backups" on local machine and give READ access to the share for Windows account
which will run restoration process (most likely your Windows account) AND for Windows account under which SQL Server will
connect to the network share.
