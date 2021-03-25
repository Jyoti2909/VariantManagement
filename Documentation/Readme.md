CRT documentation
=================

We are going to build the learning course smallest to largest - from the center of the circle outward. Each topic relies on the previous, therefore jumping over them is not recommended, especially, if you are reading this first time.

![Learning plan](images\LearningPlan.png)

#### After the reading of the article you will:
* Examine the Aras Innovator logical and structural schemas.
* Learn what is Aras Innovator baseline.
* See Aras.Deployment.Tool abilities and implementation details.
* Get familiarized with CustomerRepositoryTemplate structure.
* Understand the usual Aras Innovator instance lifecycle when CRT repository is used for development and deployment.
* Grasp how deployment package is being built.
* Get a basic understanding of how standard Aras CI pipeline looks like.
* Know what is Aras TAF and how to use it.

Table of Contents
-----------------
* #### [What is Aras Innovator?](#WhatIsArasInnovator)
    * ##### [Logical schema](#ArasInnovatorLogicalSchema)
    * ##### [Structural schema](#ArasInnovatorStructuralSchema)
    * ##### [Combined structural and logical schema](#ArasInnovatorCombinedStructuralAndLogicalSchema)
* #### [Baseline](#Baseline)
    * ##### [Definition](#BaselineDefinition)
    * ##### [Templates of setting files](#TemplatesOfSettingFiles)
    * ##### [Conclusion](#BaselineConclusion)
* #### [Aras.Deployment.Tool](#ArasDeploymentTool)
    * ##### [Definition](#ArasDeploymentToolDefinition)
    * ##### [Usage examples](#ArasDeploymentToolUsageExamples)
    * ##### [Conclusion](#ArasDeploymentToolConclusion)
* #### [How to update Aras Innovator?](#HowToUpdateArasInnovator)
    * ##### [Code tree updates](#ArasInnovatorCodeTreeUpdate)
    * ##### [Database updates](#ArasInnovatorDatabaseUpdate)
    * ##### [Data migration issue](#ArasInnovatorDataMigrationIssue)
    * ##### [Conclusion](#HowToUpdateArasInnovatorConclusion)
* #### [CustomerRepositoryTemplate](#CustomerRepositoryTemplate)
    * ##### [Definition](#CustomerRepositoryTemplateDefinition)
    * ##### [Repository structure](#CustomerRepositoryTemplateStructure)
    * ##### [Target Aras Innovator instance lifecycle](#CustomerRepositoryTemplateTargetArasInnovatorInstanceLifecycle)
    * ##### [Deployment Package](#CustomerRepositoryTemplateDeploymentPackage)
    * ##### [General CI/CD pipeline](#CustomerRepositoryTemplateGeneralCICDPipeline)
    * ##### [Conclusion](#CustomerRepositoryTemplateConclusion)
* #### [Integration and Selenium tests](#TAF)
* #### [Cookbook](#Cookbook)
* #### [Glossary](#Glossary)

<a name="WhatIsArasInnovator"></a>What is Aras Innovator?
---------------------------------------------------------

### <a name="ArasInnovatorLogicalSchema"></a>Logical schema

Aras Innovator is a software platform providing end-to-end Product Lifecycle Management, from Requirements and Engineering to Manufacturing and Operation. The main benefit of Aras Innovator is ability to easily extend the platform with custom applications/solutions required for your field of activity. This applications can be already implemented by Aras standard ones like Component Engineering (CE), Requirement Engineering (RE), Office Connector (OC), Digtal Twin Core (DTC) or customer-specific. And there can be dependencies between them. For better understanding, let's give the logical diagram of how it looks like:

![Innovator logical schema](images\InnovatorLogicalSchema.png)

Here we see a big dark grey block representing Aras Innovator platform, 2 standard solutions in red, and 1 teal custom solution. I want to note that order matters. In our schema, it means dependencies: the above block depends on below block(s). In our case, the "Custom Solution" depends on RE and CE applications and may also directly depend on the platform.

### <a name="ArasInnovatorStructuralSchema"></a>Structural schema

From terms of structure, the Aras Innovator platform has a semblance of microservice architecture and consists of the sevaral components:
* _Agent Service_ - is a Windows service designed to handle other add-on services such as Conversion Server and Vault Replication in a cluster environment. It works by actively listening to http/https requests from Aras Innovator Server on a dedicated port.
* _Conversion Server_ - is an IIS web application dealing with convertion of specific file types into another file format. For example, the Aras CAD to PDF Converter converts CAD drawing files into its PDF files for use as viewable files.
* _Database_ - is a database hosted on Microsoft SQL Server and containing all application data and metadata.
* _Innovator_ - is an IIS web application representing the main part of the platform that handles incoming requests and works with the Database.
* _Self-Service Reporting_ - is an IIS web application for generating reports.
* _OAuth Server_ - is an IIS web application responsible for the authorization. It generates the access token that should be used whenever you access other parts of the system.
* _Vault Server_ - is an IIS web application used as a file server providing functionality for files uploading and downloading.

In a simple scenario, all of these components are installed on the same server. In a complex case, there can be a distributed environment with load balancing and multiple replicas of some components. Look at the picture below (of course, the diagram is illustrative and simplified, hence may not contain all the details):

![Innovator structural schema](images\InnovatorStructuralSchema.png)

There are 2 sides: structural schema for single VM environment and for multiple VMs. On the 1st there is only 1 machine containing all Innovator components. It can be thought of as a schema of how Innovator is setup at local developer environment. The 2nd blueprint is more complex, perhaps even more reliable, so I assume this is what a real production system will look like.

### <a name="ArasInnovatorCombinedStructuralAndLogicalSchema"></a>Combined structural and logical schema

Now that you understand both logical and structural Aras Innovator views, we need to combine them all to see how they intersect. Examine the schema:

![Innovator structural and logical schema](images\InnovatorStructuralAndLogicalSchema.png)

It shows which logical blocks are placed in which structural components. To not clutter the schema I've keep the color of the logical blocks but cut the names by using only first letters of the solutions. We see that the solution can be distributed across multiple components. For example, consider the biggest "Custom Solution". Let's give an approximate mapping of what can be put on which components:
* _Agent Service_ - configuration of conversion tasks schedule.
* _Conversion Server_ - custom converters.
* _Database_ - some metadata, localication package and so on.
* _Innovator_ - client side logic, pages and styles.
* _OAuth Server_ - custom OAuth plugin, e. g. using 3rd party SSO for Aras Innovator authentication.

Hope that you got some understanding on the relationship between logical and structural Aras Innovator entities. It's time to introduce you to the concept that will be used throughout this document. It's called **_Baseline_**.

<a name="Baseline"></a>Baseline
-------------------------------

### <a name="BaselineDefinition"></a>Definition

Let's look at the above picture with "Innovator structural and logical schema" one more time. Imagine that we already have a working production instance and we need to extend existing functionality for some reason. As you might have guessed, the production environment will most likely look like the 2nd option with multiple VMs.

To begin our development we need some initial point - Aras Innovator that has the same solutions as our production. Theoretically, we can even start that process directly at production but it will be super dangerous. In the ideal case, we need to get a copy of production but in the local environment. It can be a challenge because the production is distributed while the local environment is a single machine by the definition. Here a **_Baseline_** appears on the picture.

![Innovator structural, logical and baseline schema](images\InnovatorStructuralAndLogicalAndBaselineSchema.png)

**_Baseline_** - a snapshot corresponding to some Aras Innovator instance state and consisting of the **_CodeTree.zip_** and **_DB.bak_** pair. It can be taken from different types of environments and we usually use environment name when saying about some **_Baseline_** (e. g. PROD baseline, UAT baseline, SIT baseline, etc) to make everything clear. Note that arrows on the schema are two-directional. It means that we can create a baseline from Aras Innovator installed on a one VM environment and restore it on the multiple VMs infrastructure, or vice versa.

**Important note:** a **_Baseline_** contains all logical blocks in a combined format. Looking at the above schema, you should notice that it has a single **_DB.bak_** file with all logical stuff mixed up (Aras Innovator, Requirement Engineering, Component Engineering, Custom Solution). It's considered as one indivisible whole because it doesn't matter how we got such state of the Aras Innovator. Only that state matters and should be used as a starting point for the further development. The same works for **_CodeTree.zip_**.

_CodeTree.zip_ is an archive, which contains all required Innovator libraries, HTML pages, images, icons, JavaScript files, etc. In other words, it is an archive created from the folder where Innovator is installed. The content of the archive is about the following:
* CodeTree.zip
    * AgentService
    * ConversionServer
    * Innovator
    * OAuthServer
    * SelfServiceReporting
    * VaultServer

_DB.bak_ is a backup of the current production Aras Innovator database. To reduce size of a backup use the following SQL query (it shrinks database log file and uses compression):
```
DBCC SHRINKDATABASE(N'InnovatorSolutions'); BACKUP DATABASE [InnovatorSolutions] TO DISK = 'C:\\Database Backups\\InnovatorSolutions.bak' WITH NOFORMAT, INIT, COMPRESSION;
```

In case if there is no existing production Aras Innovator instance, a **_Baseline_** can be taken from the clean Aras Innovator of a specific version (e. g. 12.0 SP8). By clean, we mean the instance that is installed from the MSI and doesn't contain any applications or data.

You can create a **_Baseline_** either manually, or via **_Aras.Deployment.Tool_**. See [Aras.Deployment.Tool usage examples](#ArasDeploymentToolUsageExamples) for more details.

### <a name="TemplatesOfSettingFiles"></a>Templates of setting files

Some Aras Innovator config files may contain different sensitive data. For example, licenses, server names, credentials, URLs and so on. And some customers prefer to not share such information with anyone due to security concerns. Hence, they intentionally exclude config files from the **_Baseline_** during its creation. There are several config files stored in the root of the installed Innovator and users may just forget to include them into **_Baseline_**. With all this in mind, we decided to use config file templates as a separate entity called **_TemplatesOfSettingFiles_** in addition to our **_Baseline_**. There are two approaches to building this set of config templates:
* Generally speaking, we need exactly the same config files as the production uses because these settings may theoretically affect the system behavior.
* If it's not possible, we may still get a minimum working Aras Innovator instance. Config files from the clean Innovator (the same version on which the production is based) will be suffice for this.

### <a name="BaselineConclusion"></a>Conclusion

Seems like we learned how can we restore a copy of the production environment locally. Not certainly in that way, we haven't yet discussed how these **_TemplatesOfSettingFiles_** and **_Baseline_** which are just a set of files will become a working Aras Innovator application. No one is stopping us from simply restoring the _DB.bak_, extracting the _CodeTree.zip_, putting **_TemplatesOfSettingFiles_** into appropriate folders and manually configuring all necessary IIS applications. But it's a repetitive annoying task and it makes sense to automate it. As a result, we have implemented **_Aras.Deployment.Tool_** command-line utility that makes possible Aras Innovator installation from a certain baseline.

<a name="ArasDeploymentTool"></a>Aras.Deployment.Tool
--------------------------------------------

### <a name="ArasDeploymentToolDefinition"></a>Definition

It is a C# tool with CLI that allows us to deploy or cleanup Aras Innovator instance, which is described in the XML config file called **_Instance.Config_**. Through this config file, we can specify a distributed Innovator instance structure, including multiple servers, some custom components(e. g. web services), their relationships, and what packages solutions should be applied to which components.

![Aras.Deployment.Tool workflow](images\ArasDeploymentToolWorkflow.png)

As you see, the tool takes **_Baseline_**, **_TemplatesOfSettingFiles_** and **_Instance.Config_** as input and performs some action with Aras Innovator instance. This particualr schema shows how installation on a single VM environment will occur. In case when you need to restore Aras Innovator instance from the same baseline but on different environment (e. g. multiple VM), all you need to do is just pass a different **_Instance.Config_** file.

Run **_Aras.Deployment.Tool_** without arguments to get help screen:
```
>Aras.Deployment.Tool.exe
```
or run **_Aras.Deployment.Tool_** with some verb to get possible options for that particular verb, for example:
```
>Aras.Deployment.Tool.exe deploy
```

Some **_Aras.Deployment.Tool_** implementation details:
* It's written on .NET Framework using C#.
* It can handle Aras Innovator instance on multiple servers. See:

![How Aras.Deployment.Tool hanldes multiple servers](images\ArasDeploymentToolMultiServer.png)

* Microsoft.Web.Administration.dll is used to handle IIS applications on remote Windows servers.
* It uses _robocopy_ if it exists to operate files copying. Otherwise, it uses Microsoft.Experimental.IO.dll at the local system and standard System.IO at remote servers.
* It uses UNC paths to handle components. If _ServerName_ property from **_Instance.Config_** is not a local machine, it combines _ServerName_ with _InstallationPath_ in the following way. \\\\_ServerName_\\_InstallationPath_ (also, it replaces ':' character to '$' sign). For example, if _ServerName_ is 'application.production.net' and _InstallationPath_ is 'C:\\Program Files (x86)\\Aras\\Innovator\\Innovator' then the path to the component will be '\\\\application.proudction.net\\C$\\Program Files (x86)\\Aras\\Innovator\\Innovator'. Note that the user as which **_Aras.Deployment.Tool_** is running should be admin at target _ServerName_ to perform certain operations like IIS Management, Windows Services Management, Folder permission management, etc.
* Before applying the package it runs some health checks validations (ping _ServerName_, check write permissions to _InstallationPath_ folder, IIS application working condition, etc).

### <a name="ArasDeploymentToolUsageExamples"></a>Usage examples

Command to install clean Aras Innovator version 12.0 SP8:
```
>Aras.Deployment.Tool.exe deploy ^
    --config InstanceTemplate.deploy.xml ^
    --code-tree C:\Baselines\CleanInnovator12SP8\CodeTree ^
    --config-templates C:\Baselines\CleanInnovator12SP8\TemplatesOfSettingFiles ^
    --db-bak C:\Baselines\CleanInnovator12SP8\DB.bak ^
    --innovator-version "12.0 SP8"
```
Arguments:
* --config - a path to the **_Instance.Config_** describing the target Aras Innovator instance structure.
* --code-tree - an absolute path to the UNZIPPED code tree part of a **_Baseline_**.
* --config-templates - an absolute path to the folder with corresponding Innovator config files - **_TemplatesOfSettingFiles_**.
* --db-bak - an absolute path to the database backup part of a **_Baseline_**. Note: that path should be accessible by SQL Server.
* --innovator-version - a version of the Innovator which should be restored from a **_Baseline_**.

Command to uninstall Aras Innovator instance:
```
>Aras.Deployment.Tool.exe cleanup ^
    --config InstanceTemplate.deploy.xml ^
    --innovator-version "12.0 SP8"
```
Arguments:
* --config - a path to the **_Instance.Config_** describing the target Aras Innovator instance structure.
* --innovator-version - a version of the Innovator which should be deleted.

Command to create a **_Baseline_** of Aras Innovator instance:
```
>Aras.Deployment.Tool.exe backup ^
    --config InstanceTemplate.deploy.xml ^
    --backup-code-tree-folder C:\Baselines\production-1 ^
    --backup-db-folder C:\Baselines\production-1
```
Arguments:
* --config - a path to the **_Instance.Config_** describing the target Aras Innovator instance structure.
* --backup-code-tree-folder - an absolute path to a storage where CodeTree.zip part of a **_Baseline_** will be placed.
* --backup-db-folder - an absolute path to a storage where DB.bak part of a **_Baseline_** will be placed. Note: that path should be accessible by SQL Server.

### <a name="ArasDeploymentToolConclusion"></a>Conclusion

After that chapter you should understand how Aras Innovator instance can be installed from a certain **_Baseline_**. And as a result, you will get a copy of target production instance with the up-to-date metadata. Now you can easily start the development because you will see how it will affect the real production system. But what will be the result of the development? And how it can be applied to the Aras Innovator instance? We will look at this in the next chapter.

<a name="HowToUpdateArasInnovator"></a>How to update Aras Innovator?
--------------------------------------------------------------------

As you know, a **_Baseline_** consists of two parts: _CodeTree.zip_ and _DB.bak_. And using them we can restore a working Innovator instance that will contain code tree files (dlls, client files, configuration files, etc) and deployed database. And if we need to update this instance we have to update code tree files or database. Let's consider these sorts of updates separately. If you have both code tree and database updates, you have to apply the code tree changes first because the database updates may depend on them.

### <a name="ArasInnovatorCodeTreeUpdate"></a>Code tree updates

Imagine that we have found some bug in the production system related to the client side. We addressed it to a development team and got fix from them that includes single JavaScript file. To apply such fix, all we need to do is replace that file on the production and then reset IIS and/or browser cache, as easy as pie.

### <a name="ArasInnovatorDatabaseUpdate"></a>Database updates

Much more interesting is how we update the database. Despite the fact that Aras Innovator uses relational database and hence support SQL queries, it's highly discouraged to use them directly. Aras recommends using XML-based format for defining data called AML (Adaptive Markup Language). Such AML files can be grouped into **_AML package_** (an aggregate of AML files, which is used as a delivery unit) based on AML files relations. After that we need to create an XML manifest file which is usually called _imports.mf_ where all developed **_AML packages_** and their dependencies are specified. Ultimately, we can use **_Aras Import Tool_** to apply these **_AML packages_** to the Aras Innovator instance. Of course, under the hood these AMLs will be transformed into SQL queries by Aras Innovator Server but it will be not our responsibilities. Look at the schema for better understanding:

![ImportTool workflow](images\ImportToolWorkflow.png)

On the schema we see that there are two **_AML packages_**: _A_ and _B_. The first contains 3 AML files while the second only 1. Package _A_ depends on the _B_ and it's defined in the _imports.mf_. **_Aras Import Tool_** takes that manifest file and send AMLs from the listed packages to Aras Innovator, that forms corresponding SQL queries and execute them on the database in its turn. Other Aras Innovator components like Vault or Conversion aren't shown on the figure because they are not involved into that process.

In addition to the **_Aras Import Tool_** responsible for the deployment, there is a **_Aras Export Tool_** that allows you to extract AML packages from the database. Both of them are GUI. For automation lovers there is a combination of both import and export tools called **_ConsoleUpgrade_** that provides command-line interface.

The other thing that can be applied to the database is localization. Aras uses term **_Language packs_** meaning group of localization resources that can be applied to the database via **_LanguageTool_** utility. Unlike **_Aras Import Tool_** it communicates with the database directly through direct SQL queries bypassing the Innovator Server.

### <a name="ArasInnovatorDataMigrationIssue"></a>Data migration issue

If we hadn't used a particular **_Baseline_** and developed our solution in a vacuum (clean Aras Innovator of the same version that is used in production), we would definetely face the situation where our solution will not be applied on the existing Aras Innovator production system. Imagine that we decided to extend some Aras Innovator Item definition (e. g. Part) with a required property. Let it be a string property "review". As a result, we have one **_AML package_** with single AML file where only one line has been added. Before deploying this to production, we of course try to import it to some Innovator instance. And as I have already mentioned, we developed that solution based on clean Aras Innovator, hence we apply that **_AML package_** without any issues. Then we put that artifact to the operation team and ask them to apply it on production.

And the deployment may or may not work. It depends on the the following factor: does the production system already have objects of type Part or not? If not, the deployment will work. Otherwise, it will fail. The root cause of this is that we changed the definition of the Part object (added required "review" property) but didn't take into account already existing objects. They live quietly in the database and doesn't even suspect about that coming new property "review". We could detect that problem much more earlier if we had used **_Baseline_** for the development that contained these Part objects.

### <a name="HowToUpdateArasInnovatorConclusion"></a>Conclusion

Now you should know how to update the Aras Innovator instance. We need to:
* Manually copy the code tree modification to the corresponing directories.
* Apply **_AML packages_** to the database changes via **_Aras Import Tool_**.
* Apply **_Language packs_** through **_LanguageTool_**.

But we need to carefully prepare these updates, put them all into some delivery package, and then provide it to the operation team with well-explained instructions of what to do. There are several potential risks like:
* The structure of that delivery package is undefined and therefore some folders can be mixed.
* Issues can arise if the order of the deployment algorithm is not followed.
* The history of such updates is untracked.
* etc.

We tried to solve these issues by introducing a repository template for custom development called **_CustomerRepositoryTemplate_** or **_CRT_**.

<a name="CustomerRepositoryTemplate"></a>CustomerRepositoryTemplate
-------------------------------------------------------------------

### <a name="CustomerRepositoryTemplateBeforeStart"></a>Before start

Since the material in this chapter is based on basic understanding of how Git works, what are Continuous Integration and Conituous Delivery we highly recommend you to get familiarized with the following topics:
* At least first 3 chapters (Getting Started, Git Basics, Git Branching) of the Pro Git book: https://git-scm.com/book/en/v2
* Martin Fowler's article on **_Continuous Integration (CI)_**: https://martinfowler.com/articles/continuousIntegration.html
* **_Continuous Delivery (CD)_** basics on the https://continuousdelivery.com/

### <a name="CustomerRepositoryTemplateDefinition"></a>Definition

**_CustomerRepositoryTemplate_** or **_CRT_** is a Git repository containing branches for all released Innovator versions. The main idea of using CRT is to have a standard repository with a clear structure, useful automation, and easily configurable CI/CD process. In some sense **_CRT_** is a CI/CD framework.

The best real association for CRT in the real world I found is the motherboard. It combines all Aras artifacts like the platform itself, standard applications and tools and provide the defined structure.

![CRT is a motherboard](images\CRTIsAMotherboard.png)

From the picture you should understand what does **_CRT_** consists of. It's the entire Aras Innovator platform in a **_Baseline_** format, but instead of storing the _DB.bak_ that can be huge, we export all **_AML packages_** **metadata** via **_Aras Export Tool_** and commit them. The crucial word here is **metadata** that means only Items definitions without thousands of instanciated objects. As you know, the **_Baseline_** doesn't separate logical blocks, and therefore RE and ARK (Aras Reusable Kit - a common name of the internal reusable Aras solutions) blocks from the schema will be in the **_CRT_** as a **_Baseline_** part. **_Aras Import Tool_** as well as **_Aras Export Tool_**, **_ConsoleUpgrade_** and **_LanguageTool_** are stored in the **_CRT_** as they are.

### <a name="CustomerRepositoryTemplateStructure"></a>Repository structure

Let's look carefully at the repository structure. It is accurately prepared and each folder has its own destination.

#### Automation
* _AutomatedProcedures_ - all automation scripts, tools, configuration files, and so on.
    * _JenkinsScripts_ - Groovy pipelines definitions for Jenkins.
    * _TemplatesOfInnovatorInstances_ - **_Instance.Config_** templates for **_Aras.Deployment.Tool_** describing target Aras Innovator structure that should be deployed.
    * _TemplatesOfSettingFiles_ - set of Aras Innovator config files templates that will be taken and filled during deployment.
    * _tools_ - folder with committed Aras tools and _packages.config_ describing tools that should be restored before automation launch.
    * _ChangeLog.md_ - file containing **_CRT_** versions changelog.
    * _Default.Settings.include_ - default automation properties. That file is used as a source for **_Machine.Specific.include_** creating per each branch.
    * _NantScript*xml_ - NAnt scripts forming the CI/CD API that can be then just called from different clients like simple batch files, Jenkins, or something else.
    * _package.exclude_ - list of files that should be excluded from a package even though they are in git delta.
    * _package.include_ - list of files that should be included in a package even though they are not in git delta.

#### Batch files
* _AutomatedProcedures_
    * _CreateZipWithDeploymentPackageAndScripts.bat_ - builds **_Deployment Package_** and puts in the root of the repository.
    * _RemoveThisInnovator.bat_ - deletes local branch-specific Aras Innovator instance installed via **_SetupInnovatorHere.bat_**. You can also remove other Aras Innovator branch-specific or CI instances one by one by passing the necessary name as the first command-line argument to that batch file. For example, I have a waste old branch-specific Aras Innovator instance called "COMPUTERNAME-CRT-I-XXXXXX", then I can pass that name to the batch and it will be removed. Look:
    ```
    C:\Repository\AutomatedProcedures>RemoveThisInnovator.bat COMPUTERNAME-CRT-I-XXXXXX
    ```
* _ContinuousIntegration.bat_ - launches CI process locally (building "src\CustomSolutions.sln" Visual Studio solution, running both client and server unit tests as well as code style validations, installing local Aras Innovator CI instance from a **_Baseline_** into "Instances" folder, building the **_Deployment Package_**, applying it on top of just installed Aras Innovator CI instance and run integration tests in the end).
* _RunClientUnitTests.bat_ - converts AML package client methods into JavaScript source files using "AutomatedProcedures\tools\NodeJS\parseAMLMethods.js" script and launches client unit tests using [Karma framework](https://karma-runner.github.io/) in web browsers.
* _RunIntegrationTests.bat_ - converts AML package server methods into C# sources using **_MethodConverter_**, adds them to "CSharpMethods.csproj" project of the "src\CustomSolutions.sln" Visual Studio solution, then builds that solution including both methods and tests, runs code analysis using FxCop ruleset, and launches integration tests using [TAF](#TAF). **Requires installed local branch-specific Aras Innovator instance via SetupInnovatorHere.bat before running that kind of tests**.
* _RunUnitTests.bat_ - converts AML package server methods into C# sources  using **_MethodConverter_**, adds them to "CSharpMethods.csproj" project of the "src\CustomSolutions.sln" Visual Studio solution, then builds that solution including both methods and tests, runs code analysis using FxCop ruleset and launches unit tests using [NUnit](https://nunit.org/).
* _SetupInnovatorHere.bat_ - installs local branch-specific Aras Innovator instance (building "src\CustomSolutions.sln" Visual Studio solution, installing local Aras Innovator branch-specific instance from a **_Baseline_** into "Instances" folder, building the **_Deployment Package_** and applying it on top of just installed Aras Innovator branch instance).

#### Code tree state
* _AgentService_ - the state of Agent service code tree files.
* _ConversionServer_ - the state of Conversion server code tree files.
* _Innovator_
    * _Client_ - the state of Innovator client code tree files.
    * _Server_ - the state of Innovator server code tree files.
* _OAuthServer_ - the state of OAuth server code tree files.
* _Scheduler_ - the state of OAuth server code tree files. (May not exist by default)
* _SelfServiceReporting_ - the state of SelfServiceReporting code tree files.
* _VaultServer_ - the state of Vault code tree files.

#### Config files transformations
* _TransformationsOfConfigFiles_ - XML transformations that are being applied to the corresponding config files based on the relative paths. Documentation can be found [here](..\TransformationsOfConfigFiles\Readme.md).

#### Documentation
* _Documentation_ - some documentation.
    * _CRT User Manual.docx_ - may contain outdated information. We recommend be careful with it and prefer this overview if "CRT User Manual.docx" contradicts it.

#### Exported database state
* _AmlDeploymentScripts_ - AML scripts that used to resolve special cases during database update (resolving circular dependencies, data migration, etc).
    * _1-BeforeAmlPackagesImport_ - AML scripts that should be applied before AML packages import.
	* _2-AfterAmlPackagesImport_  - AML scripts that should be applied after AML packages import.
* _AML-packages_ - AML packages with ItemTypes, Methods, Identities and so on that are usually used for database update.
    * _imports.mf_ - default manifest with packages list that should be imported to the database during deployment.
* _Language packs_ - localization packages applying to the database.

#### Sample Data
* _Sample Data_ - a special form of **_Deployment Package_** with data like Users, Items, and so on. Unlike **_Deployment Package_** it will contain exactly data rather than solution/functionality. Such a package is being applied to Aras Innovator instance once **_Deployment Package_** is imported. As a result, you will get both solution and data in the instance.

#### Sandbox
* _AutomatedProceduresOutput_ - temporary files and logs generated by CI/CD.
* _Instances_ - all Aras Innovator branch-specific and CI instances. Is created automatically and ignored by git.

#### Source code
* _src_ - all source code with custom C# projects. If you will need to develop your own library as part of the solution then it must be placed here.
    * _CustomSolutions.sln_ - single Visual Studio solution that contains all C# projects in the repository (libraries source code, tests, plugins, etc). The idea behind using one Visual Studio solution is to have a clear entry point, build all projects at once and be able to resolve dependencies on projects level. If you decided to add your custom project it must be included in that solution.

#### Tests
* _Tests_ - contains all repository tests and their configuration files.
    * _ClientTests_ - tests for JavaScript code in the repository. Keep in mind that client code may be part of AML packages and therefore needs conversion to JavaScript files before using them in tests. We use custom Node.js script ("AutomatedProcedures\tools\NodeJS\parseAMLMethods.js") for that purpose. Tests itself are located in the "tests" folder. We use [Karma framework](https://karma-runner.github.io/) to run tests and, as you might have guessed, "karma.conf.js" is its config file.
    * _IntegrationTests_ - C# project with integration test cases in AML format. We are just sending requests to Innovator Server, getting a response, and comparing it with expected results. [TAF](#TAF) is used for launching them. And "IntegrationTests\app.config" is a config file with properties required for tests work. If you are running tests using _RunIntegrationTests.bat_ then config will be automatically filled based on your **_Machine.Specific.include_** file, otherwise you need to fill that config manually. (e. g. if you are going to run tests through Visual Studio)
    * _PackageMethods_
        * _CSharpMethods_ - C# project containing converted AML methods into C# files by **_MethodConverter_** tool.
        * _CSharpMethods.UnitTests_ - project with unit tests for _CSharpMethods_ project.
        * _MethodConverter_ - containing **_MethodConverter_** tool. By default, it converts all C# methods from _AML-packages_ folder and injects them into _CSharpMethods_ project as well as references from "Innovator\Server\method-config.xml". If you need to exclude some methods or references from handling, please use ".exclude" file.

### <a name="CustomerRepositoryTemplateTargetArasInnovatorInstanceLifecycle"></a>Target Aras Innovator instance lifecycle

Development and deployment are highly interrelated: deployment applies development results on the one hand, and development is based on the latest deployed state on the other hand. An overall schema of how the development process flows into a deployment and vice versa is below:

![Target Aras Innovator instance lifecycle](images\TargetArasInnovatorInstanceLifecycle.png)

On the schema we consider the 12.0 SP8 version, but the process is the same for others. This process is iterative and the detailed description of the events on the timeline is presented below:
1. At t0 moment, assume that it is a project start, we have:
    * a working Aras Innovator instance 12.0 SP8 without any customization.
    * a **_Baseline_** taken from this instance.
    * a clean Git repository with a _CleanInnovator12SP8_ tag corresponding to clean 12.0 SP8 version of Aras Innovator. Such tag name is called **_Last.Commit.Before.Current.Release_** and it's defined in the _Default.Settings.include_ config in the repository.
  It is worth noting that all these 3 entities are in the same state. In other words, all code tree files and exported **_AML packages_** from the production instance are committed to the Git repository and _CleanInnovator12SP8_ tag is set on that commit. Besides this **_Baseline_** is created exactly from the same production instance at the same moment of the time.
2. At t1 moment, we got some development results and need to apply them to the existing production. We perform the following steps:
    * put _R1.0_ Git tag on the point that contains the final state of the updates we are going to apply on the production instance.
    * build the package called **_Deployment Package_** with changes since **_Last.Commit.Before.Current.Release_** (from _CleanInnovator12SP8_ till _R1.0_).
    * apply the package prepared on the previous step on the top of production instance.
    * capture a new **_Baseline_** corresponding to the updated Aras Innovator instance state. Let's name it the same as the version of the last deployed package - _R1.0_.
    * (optional) export this new _R1.0_ **_Baseline_** into the repository if something was deployed to production bypassing the repository.
    * update the **_Last.Commit.Before.Current.Release_** to _R1.0_.
3. At t2 moment, we got some development results and need to apply them to the existing production. We perform the following steps:
    * put _R1.1_ Git tag on the point that contains the final state of the updates we are going to apply on the production instance.
    * build the package called **_Deployment Package_** with changes since **_Last.Commit.Before.Current.Release_** (from _R1.0_ till _R1.1_).
    * apply the package prepared on the previous step on the top of production instance.
    * capture a new **_Baseline_** corresponding to the updated Aras Innovator instance state. Let's name it the same as the version of the last deployed package - _R1.1_.
    * (optional) export this new _R1.1_ **_Baseline_** into the repository if something was deployed to production bypassing the repository.
    * update the **_Last.Commit.Before.Current.Release_** to _R1.1_.
4. And so on.

I expect that all used entities should be familiar to you. Otherwise you need to return to the previous chapters to fill the blanks. The only thing that we didn't deep dive is the **_Deployment Package_** structure and the process for building it.

### <a name="CustomerRepositoryTemplateDeploymentPackage"></a>Deployment package

_Deployment Package_ is a zip archive containing Deployment-Package-Content.zip alongside with procedure, which can apply that delta to the Aras Innovator instance and update it from the **_Last.Commit.Before.Current.Release_** state to a desirable state.

![CRT deployment package delta calculation](images\CRTDeploymentPackageDeltaCalculation.png)

The detailed content of the _Deployment Package_ is:
* Deployment-Package-Content.zip - a zip archive with a delta which is calculated using **git diff** between the **_Last.Commit.Before.Current.Release_** and the **_HEAD_**.
    * AmlDeploymentScripts delta.
    * CodeTree delta.
    * AML-packages delta.
    * Language packs delta.
    
  Besides the files that are got into **git diff** there are _package.include_ and _package.exclude_ which list the files that should be included/excluded unconditionally.
* Deployment procedure - is taken by including necessary files from _AutomatedProcedures_ folder.

As a rule, the deployment process should reuse the _Deployment Package_ provided by CI, which ensures that the package passed all validations and tests. In our case it's organized in the following way: if during deployment the version of deployment package content already exists at some package storage then procedure will download it instead of building from scratch, otherwise, the procedure will create and upload the deployment package content before continuing. In other words, the deployment is smart and uses some cache to not repeat the same package building twice. The version of the deployment package is defined by the Jenkins CI job build number.

For now, all this caching is organized with NuGet package format since we already use NuGet in CRT for other purposes like retrieving 3rd party tools and libraries from nuget.org. But keep in mind that the format of the deployment package is still zip archive, NuGet is used only for organizing versioning and caching. See the schema below which illustrates this behavior:

![Image of deployment package caching behavior](images\DeploymentPackageCaching.png)

By default, this mechanism doesn't work properly since it doesn't know about the shared NuGet storage. In order to configure it setup `Nuget.Publishing.Source` as Jenkins global environment variable pointing to NuGet source. It can be NuGet storage provided by Repository Manager like Nexus, Artifactory etc or some network share which is accessible for all Jenkins agents involved in CI/CD.

In case when you are going to use NuGet storage provided by Repository Manager you have to specify credentials for a user which will be able to upload artifacts there. It can be done by setting the Jenkins 'Username with password' credentials with `Nuget.Uploader.Credentials` id.

For more details see _CreateZipWithDeploymentPackageAndScripts_ target in the _AutomatedProcedures\NantScript.DeploymentPackageHelper.xml_ file.
As a result, it provides a package that can be applied by the **_Aras.Deployment.Tool_** or manually.

### <a name="CustomerRepositoryTemplateGeneralCICDPipeline"></a>General CI/CD pipeline

What does **_Continuous Integration (CI)_** do?
* Validates development team work.
* Makes build artifacts.
* **Doesn't deploy anything to the end user.**

What does **_Continuous Delivery (CD)_** do?
* Extends **Continuous Integration** to make sure that you can release new changes to your customers quickly in a sustainable way.
* Provides reliable, repeatable automatic procedure of deployment.

CI/CD key practices:
* Store all kind of data under version control system (e. g. sources, tests, documentation, scripts etc).
* Code review.
* Automate everything: code validation, tests, deployment.
* Use the same deployment procedure at all stages: SIT, UAT, Pre-PROD, PROD.

An abstract CI/CD pipeline which is used in CRT is presented below:

![Image of CI/CD pipeline](images\CICDPipeline.png)

As you can see the pipeline consists of the stages. In CRT all these stages logic is implemented in NAnt, which, in turn, run a lot of Aras (black boxes on the schema below) and 3rd party tools.

![Image of CI/CD pipeline tools](images\CICDPipelineTools.png)

### <a name="CustomerRepositoryTemplateConclusion"></a>Conclusion

In a conclusion I would say the following: "CRT is not a tool, it's rather a framework for establishing CI/CD processes". And as each framework, it's flexible and won't keep you from making mistakes. It takes time to learn how to work with it correctly.

We have tried to collect some general rules or best practices that we follow when using CRT:
* Prevent all manual changes of production instance like described in some [previous chapter](#HowToUpdateArasInnovator) and do all stuff using a Git repository. In that case, the repository will be a mirror of all metadata from production and we can use git features to the fullest for package calculation. It leads to simplifying the development process and making deployment more reliable. In a way, you know the current production AML packages state and can change them appropriately.
* Use a **_Baseline_** which is as close to production as possible. At least it should reflect a real production use data but should be much smaller.
* Establish the same deployment process at all environments (local, SIT, UAT, PROD). To ensure that changes in both Aras Innovator solution and deployment procedure are validated as earlier as possible.
* Develop automated tests and integrate them into CI pipeline in order to reduce the cost of validation  in the future.
* Use Git to the fullest. We use Git not only for storing modifications but for calculating changes since the last deployment. As a result, we will have a small delta that should be applied on top of the target instance in order to update it.
* Don't tie to specific tools and technologies. In our case, there are many CI/CD scripts providing API that can be just called from the local environment as well as some CI server.

<a name="TAF"></a>Integration and Selenium tests
------------------------------------------------
To support the critical task of efficiently testing a system release, Aras created web ui framework called Test Automation Framework (TAF).

#### License Validation

To be able to run Selenium (UI) tests in the TAF (Test Automation Framework) you must have an appropriate license in the Innovator instance: Aras.TestAutomationFramework. Thus, if the Innovator where TAF tests are run doesn't have it test execution will be aborted and an exception will be thrown.

#### Documentation

Complete documentation about TAF, integration and selenium tests setup, run and analysing of results can be found at <a href="ftp://ftp.aras.com/ArasTestAutomationFramework/1.0/Aras Test Automation Framework 1.0 CD Image/Documentation.zip">ftp web server</a>

<a name="Cookbook"></a>Cookbook
-------------------------------

As was already mentioned, **_CRT_** is a framework and you can use it in a variety of ways. We tried to gather all common questions, tips & tricks and over useful infromation in a [**_Cookbook_**](./Cookbook.md).

<a name="Glossary"></a>Glossary
-------------------------------

* **_AML package_** - an aggregate of AML files, which is used as a delivery unit.
* **_Aras.Deployment.Tool_** - a C# tool that was written to simplify setup, configuration and deployment process. Project is located in the 'AutomatedProcedures\src\DeploymentProcedure' directory.
* **_Baseline_** - a pair of **_CodeTree.zip_** and **_DB.bak_** corresponding the current production Innovator instance state. (See **Baseline** section for more details).
* **_ConsoleUpgrade_** - an Innovator tool for AML packages import/export. Located by the 'AutomatedProcedures\tools\PackageImportExportUtilities\consoleUpgrade\consoleUpgrade.exe' path.
* **_Cookbook_** - a document containing frequently asked questions that arises when working with **_CRT_**.
* **_CRT_** - stands for CustomerRepositoryTemplate.git repository, which contains branches for all released Innovator versions. All *\_work.git repositories are created from the corresponding branch from the **_CRT_**.
* **_Continuous Integration (CI)_** - _a **software development practice** where members of a team integrate their work frequently, usually each person integrates at least daily - leading to multiple integrations per day. Each integration is verified by an automated build (including test) to detect integration errors as quickly as possible. Many teams find that this approach leads to significantly reduced integration problems and allows a team to develop cohesive software more rapidly. (Matrin Fowler)_.
* **_Continuous Delivery (CD)_** - an ability to get changes of all types including new features, configuration changes, bug fixes and experiments into production, or into the hands of users, safely and quickly in a sustainable way.
* **_Default.Settings.include_** - an XML file with settings for build/deployment procedure located by 'AutomatedProcedures\Default.Settings.include' path.
* **_Deployment Package_** - a zip archive containing delta, which can be applied to an Innovator instance to update it from the **_Last.Commit.Before.Current.Release_** state to a desirable state.
* **_HEAD_** - a synonym of the current branch/tag in the repository.
* **_Instance_** - as a rule, it means Innovator instance.
* **_Instance.Config_** - an XML-like config for **_DeploymentTool_**, describing the Innovator instance structure and steps to apply to it.
* **_LanguageTool_** - an Innovator tool for applying **_Language packs_**. Located by the 'AutomatedProcedures\tools\LanguagePackManagementUtility\LanguageTool.exe' path.
* **_Language packs_** - a group of localization resources that can be applied to the database via **_LanguageTool_** utility.
* **_Last.Commit.Before.Current.Release_** - a **_Default.Settings.include_** property. ID of the last commit before current release. This is the commit that is used as a baseline to figure out which files were changed during current release. These files define code tree and AML packages changes, which should be deployed to a target server.
* **_Machine.Specific.include_** - an XML file with the same settings as in the **_Default.Settings.include_**, but overwriting them for the local machine. It's created automatically after run **_SetupInnovatorHere.bat_** first time. A path to it is generated as 'c:\\_machine_specific_includes\\**_Project.Prefix_**-**_HEAD_**.Settings.include'.
* **_MethodConverter_** - Aras Internal tool that converting server methods from AML to C# format and vice versa. Located by the 'Tests\PackageMethods\MethodConverter\Aras.PackageMethods.MethodConverter.exe' path.
* **_Project.Prefix_** - a **_Default.Settings.include_** property means the name of the current repository which is used as a prefix for generated Innovator instance names, in order to not cause conflict if there are several CustomerRepositoryTemplate based repositories.
* **_SetupInnovatorHere.bat_** - a batch file which installs Innovator instance inside the repository. It uses the code tree directly from the repository and database, which is specified in the **_Machine.Specific.include_** file. You can find the batch file in the root of a repository.
