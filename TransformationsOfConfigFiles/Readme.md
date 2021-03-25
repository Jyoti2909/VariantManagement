How to use config files transformations?
========================================

### To update the configuration file, you need to create a file with the same name and place it here using the same nesting.

1. **XML:** For example, you need to modify the file "OAuthServer\Web.config" and add an attribute to the oauth tag in which the value of the "configSource" attribute is equal to "OAuth.config":

  - Read **[Transformation Syntax](https://docs.microsoft.com/en-us/previous-versions/aspnet/dd465326(v=vs.110))**
  - Create file "OAuthServer\Web.config" in this folder (TransformationsOfConfigFiles);
  - Fill it in according to the xdt rules;
  - Commit this to git;

 ### Sample xml transformation

```xml
<?xml version="1.0"?>
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
	<oauth configSource="OAuth.config" yourNewAttribute="value" xdt:Transform="SetAttributes" xdt:Locator="Match(configSource)" />
</configuration>
```
-----------------------------------------------------

2. **JSON:** Or maybe you want to add a new plugin to "OAuthServer\OAuthServer.Plugins.json":
  - Read **[Transformation Syntax](https://github.com/microsoft/json-document-transforms/wiki)**
  - Create file "OAuthServer\OAuthServer.Plugins.json" in this folder (TransformationsOfConfigFiles);
  - Fill it in according to the jdt rules;
  - Commit this to git;

 ### Sample json transformation

```json
{
    "@jdt.merge": {
        "@jdt.path": "$.['OAuthServer.Plugins']",
        "@jdt.value": [
            {
                "Name": "New.Aras.Plugin",
                "Enabled": true
            }
        ]
    }
}
```
-----------------------------------------------------