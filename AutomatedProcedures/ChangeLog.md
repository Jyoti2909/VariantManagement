<a name="1.8"></a>1.8 version [2020-12-08]
------------------------------------------

 - Build Script: Allow ArasUpdate packages applying during SetupInnovatorHere.
 - Build Script: Fix Deploy.bat to work with ADT from both package and src.
 - Build Script: Ignore encoding validation for obj folders inside Tests.
 - Build Script: Update Aras.Deployment.Tool to a newer version that enables plugins usage.
 - Build Script: Use -AllVersions for NuGet to retrieve all available versions when obtain existing deployment packages.
 - Build Script: Use Jenkins Folder Properties plugin during deployment.
 - Documentation: Create a new "Documentation/Readme.md" document on the basis of "CRT overview.md". Delete "CRT overview.md".
 - Documentation: Introduce "Documentation/Cookbook.md" with FAQ and tips & tricks.
 - Tests: Output expected & actual requests on Integration tests fail.

<a name="1.7"></a>1.7 version [2020-11-12]
------------------------------------------

 - Azure: Update build definition
 - Azure: Upload built packages to storage account and Azure Artifacts
 - Build Script: Add an opportunity to modify XML and JSON configuration files using transformations
 - Build Script: Add validation for TAF license
 - Build Script: Add validation for licenses existence in FeatureTree
 - Build Script: Create single nuget deployment package with all for deploy
 - Build Script: Use Aras.Common package in CRT repository instead of source code
 - Documentation: Improvements for CRT overview.md

<a name="1.6"></a>1.6 version [2020-10-06]
------------------------------------------

 - Docker: Improve local docker build experience
 - Azure: Add build definition for Azure pipelines
 - Jenkins: Add timestamps
 - Documentation: Improvements for DeploymentGuide.txt
 - Build Script: Cleanup and Refactor Nant script
 - Build Script: Use Aras.Deployment.Tool as a nuget package. It is still possible to use local compilable tool using Do.Build.Deployment.Tool parameter
 - Build Script: Fix bug that causes to prepare deployment package content twice

<a name="1.5"></a>1.5 version [2020-09-01]
------------------------------------------

 - Add ability to define custom properties in InstanceConfig, for various Steps.
 - Add an opportunity to modify the configuration files during deployment.
 - Prepare Sample Data as a fully independent package.
 - Add ability to use verified license locally.
 - Fix missing DeltaExtraction tool in case of the creation of a new repository for customers.
 - Fix bug with including "Machine.Settings.include" and overwriting properties on deploy.
 - Add logic to stop Integration tests on the first fail if it's a pull request.
 - Add ability to use categories for Integration tests.
 - Update license generation URL to include valid MAC address.


<a name="1.4"></a>1.4 version [2020-06-08]
------------------------------------------

 - Integrate docker for pull requests.
 - Fix batch scripts behavior when they launched as an admin.
 - Fix error message for Deploy.bat in manual package.
 - Always clean workspace for CI builds before a build.
 - Remove RemoteDeploy.groovy, since it is outdated.
 - Use ITAF instead of Aras.IntegrationTests.Framework.dll.
 - Add selenium tests initial project.
 - Enable using TLS1.2 for nuget downloading.
 - Delta Extraction Tools for AML packages.


<a name="1.3"></a>1.3 version [2020-05-19]
------------------------------------------

- Add Docker CI script
- Remove unused batch and powershell scripts.
- Improved error message for vault2database connector.
- Fix ArasUpdateCmd integration bugs.
- Fix NuGet package integration bugs
- Fix Jenkins artifacts upload.
- Fix behavior when CI tried to set a tag based on CRT version in a CRT based repository.

<a name="1.2"></a>1.2 version [2020-04-29]
------------------------------------------

- Add ability to use ArasUpdateCmd to apply deployment packages.
- For Jenkins deployment use nuget repository to store deployment packages and reuse them if one already exists.
- Get AML deployment scripts from a folder recursively, including all subfolders.
- Show what feature licenses are being applied.
- Fix some places to avoid long path issue.

<a name="1.1"></a>1.1 version [2020-04-10]
------------------------------------------

- Put correct IOM SDK for 11.0 SP9.
- Disable CA1020 AvoidNamespacesWithFewTypes FxCop rule.
- Refine 'ContinuousIntegration' output to not litter Jenkins log with useless data.
- Validate that all Aras binaries and tools have the same version.
- Remove Scheduler from committed code tree to be able to include it to a deployment package.
- Implement a prototype of deployment package caching with NuGet.
- Improve baseline validation targets to give more understandable messages.
- Redirect output from 'Clean.Up' and 'Create.Log.Package.Zip' targets to files instead of null during 'ContinuousIntegration' target execution.

<a name="1.0"></a>Initial 1.0 version [2020-03-27]
--------------------------------------------------

- :fire: First CRT release! Now you know the version you use.
