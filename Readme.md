Getting started
===============

Assume that you just cloned this repository before you can start to work you need a local instance of Innovator.

Repository structure
--------------------
To get familiarized with repository structure refer to **[RepositoryStructure section](./Documentation/Readme.md#CustomerRepositoryTemplateStructure)**.

Prerequisites to setup innovator locally
----------------------------------------
* MSSQL Server 2008 R2 or higher. It can be either local instance or remote.
* Software can be installed through 'AutomatedProcedures\PowershellScripts\SetupEnvironment.ps1' script execution. It uses Chocolatey tool to download and install reuqired software from the Internet. Open PowerShell console as admin in the root of the repository and run the command:
```
Set-ExecutionPolicy Bypass -Scope Process -Force; & ".\AutomatedProcedures\PowershellScripts\SetupEnvironment.ps1"
```

* Baseline (both code tree and database backup). See details on what is baseline in the **[baseline section](./Documentation/Readme.md#Baseline)**.

SetupInnovatorHere.bat
----------------------
* Checkout development branch:
```
git checkout development
```
* Run SetupInnovatorHere.bat as Administrator to setup Innovator instance to the 'Instances' folder. This will perform the following steps:
    * Create your machine and branch specific settings file in the 'C:\\_machine_specific_includes' folder if that file doesn't exist.
    * Use the machine and branch specific settings to get common properties.
    * Verify your configuration (This step can lead to failures if configuration has errors. In case of errors fix them and re-run the SetupInnovatorHere.bat as Administrator).
    * Restore code tree from CodeTree.zip which is specified as 'Path.To.CodeTree.Zip' property in the machine and branch specific settings file.
    * Restore Innovator database from backup which is specified as 'Path.To.DB.Bak' property in the machine and branch specific settings file.
    * Create Web Application in local IIS with which you can work.
    * Calculate a deployment package and apply it to just installed Instance.
* A flow chart of how does SetupInnovatorHere.bat work is presented below:

![SetupInnovatorHere.bat flow chart](Documentation\images\SetupInnovatorHereFlow.png)

* Navigate to just created instance using browser (the link will be provided in SetupInnovatorHere.bat output). You can also navigate to the 'IIS Manager' and locate new instance in expanded 'Default Web Site'. The name of the instance is a http://localhost/[machine_name]-[project_prefix]-[branch_name]. For example http://localhost/%COMPUTERNAME%-CRT-development

References
----------
To familiarize with terminology and workflow we recommend you to read the following document: **[CRT documentation](./Documentation/Readme.md)**