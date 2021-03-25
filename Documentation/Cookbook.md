CRT cookbook
============

That document contains different useful information on issues you may encounter while using the CRT.

All issues are documented in a standard shape and are listed in the TOC.

Table of Contents
-----------------
* #### [Known issues](#KnownIssues)
    * #### [Couldn't connect vault component 'Vault' with database 'Database'](#CouldntConnectVaultToDatabase)
* #### [Tips & tricks](#TipsAndTricks)
    * #### [Local Aras Innovator setup takes too long](#LocalArasInnovatorSetupTakesTooLong)

--------------------------------------------------------------------------------------------------------------

<a name="KnownIssues"></a>Known issues
--------------------------------------

List of known issues:

<a name="CouldntConnectVaultToDatabase"></a>Couldn't connect vault component 'Vault' with database 'Database'
-------------------------------------------------------------------------------------------------------------

### Where occurred

During Aras Innovator setup (in SetupInnovatorHere.bat, ContinuousIntegration.bat or Jenkins deployment).

### Error message

```
...
[exec]
[exec] FAILED.
[exec]
[exec] Couldn't connect vault component 'Vault' with database 'Database'. <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Body><SOAP-ENV:Fault xmlns:af="http://www.aras.com/InnovatorFault"><faultcode>SOAP-ENV:Server</faultcode><faultstring><![CDATA[The Database is not available:License Key is invalid.]]></faultstring><detail><af:legacy_detail><![CDATA[The Database is not available:License Key is invalid.]]></af:legacy_detail><af:exception message="The Database is not available:License Key is invalid." type="Aras.Server.Core.InnovatorServerException"><af:innerException message="License Key is invalid." type="Aras.Server.Core.ServerConfigException" /></af:exception></detail></SOAP-ENV:Fault></SOAP-ENV:Body></SOAP-ENV:Envelope>. See above stack trace for the details.
```

or

```
...
[exec] FAILED.
[exec]
[exec] Couldn't connect vault component 'Vault' with database 'Database'. <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:i18n="http://www.aras.com/I18N"><SOAP-ENV:Body><SOAP-ENV:Fault>
[exec]  <faultcode>999</faultcode>
[exec]  <faultstring>System.Net.WebException: The remote server returned an error: (404) Not Found.</faultstring>
[exec]  <faultactor>HttpServerConnection</faultactor>
[exec]  <detail>unknown error</detail>
[exec] </SOAP-ENV:Fault></SOAP-ENV:Body></SOAP-ENV:Envelope>. See above stack trace for the details.
```

or

```
...
[exec] FAILED.
[exec]
[exec] Couldn't connect vault component 'Vault' with database 'Database'. <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:i18n="http://www.aras.com/I18N"><SOAP-ENV:Body><SOAP-ENV:Fault>
[exec]  <faultcode>invalid_grant</faultcode>
[exec]  <faultstring>System.AggregateException: Cannot get OAuthServer discovery document.</faultstring>
[exec]  <faultactor>OAuthServer</faultactor>
[exec]  <detail>unknown error</detail>
[exec] </SOAP-ENV:Fault></SOAP-ENV:Body></SOAP-ENV:Envelope>. See above stack trace for the details.
```

### Error interpretation

As you see, you got usual Aras Innovator error in XML format. To get the original error, you need to take the value from the <faultstring>...</faultstring>. In our case it's:
* _The Database is not available:License Key is invalid._ - means that framework license that was used during installation doesn't fit some restrictions. Advise to double check that license in your **_Machine.Specific.include_** file, or in the Jenkins credentials if it was encuntered during Jenkins deployment.
* _System.Net.WebException: The remote server returned an error: (404) Not Found._ - means that Aras Innovator web application was not found. Perhaps, IIS is stopped.
* _System.AggregateException: Cannot get OAuthServer discovery document._ - means that OAuth server doesn't work. OAuth server is ASP.NET Core application and requires .NET Core Runtime & Windows Server Hosting bundle of a particular version to be installed. Also make sure that this "Windows Server Hosting bundle" is recognizable by IIS. Open IIS Manager -> Modules and make sure that "AspNetCoreModule" is in the list.

### Additional comments

Strictly speaking, in this step (connecting Vault to Database) we are trying to login to the Aras Innovator first time. It means that any error you face can evidence that installed Innovator doesn't work. For further troubleshooting we recommend:
* Open IIS manager and find out the name of the installed Innovator. Try to access it via any web browser and log in with default admin credentials (admin - innovator). Probably you will get the same error as the console showed but in graphical UI.
* Check all Aras Innovator prereuqsites. You can take them either from the "CD Image.zip" documentation or from "AutomatedProcedures\PowershellScripts\SetupEnvironment.ps1" script installing them.

--------------------------------------------------------------------------------------------------------------

<a name="TipsAndTricks"></a>Tips & tricks
-----------------------------------------

<a name="LocalArasInnovatorSetupTakesTooLong"></a>Local Aras Innovator setup takes too long
-------------------------------------------------------------------------------------------

### Where occurred

During local Aras Innovator setup (in SetupInnovatorHere.bat or ContinuousIntegration.bat).

### Description

Local Aras Innovator setup takes too long.
* &gt; 10 mins for SetupInnovatorHere.bat at the same Git point as the **_Baseline_** (i.e. with empty deployment package).
* &gt; 20 mins for ContinousIntegration.bat at the same Git point as the **_Baseline_** (i.e. with empty deployment package).

For information, a brief description of usual developer hardware is:
* Intel Core i7, 12 logical cores
* 16 RAM
* SSD M.2

### What can be done

The right answer will be to review your hardware and software. Probably, you can request more hardware resources to improve performance. Sometimes your computer has a lot of daemon processes that consume resources, or antivirus that scans all files, etc. With this approach, we can correct the situation as a whole. So try this first.

If it didn't work out, then we can try to perform some pinpoint fixes.
* Don't unzip the entire _CodeTree.zip_ each time we run local setup. It sounds reasonable, because _CodeTree.zip_ is rarely changed and we can unzip it one time and use this extracted code tree for local installation. To achieve this, you need to extend **_Machine.Specific.include_** file with an additional property that will point to the directory containing unzipped code tree. It is worth noting that this path must be local. Look:
```
<project name="Default.Settings">
    ...
    <property name="Path.To.Unzipped.Code.Tree" overwrite="true" value="c:\Baselines\CRT\CleanInnovator12SP8\CodeTree" />
    ...
</project>
```

--------------------------------------------------------------------------------------------------------------
