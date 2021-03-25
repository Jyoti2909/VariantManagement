<%@ Page CodePage="65001" Language="VB"  Explicit="true" Inherits="Aras.Client.Core.IncludeNamespaceResolver"%>
<% 
	' Returns requested javascript files or classes listed in JSNamesapceConfig.xml as plain text.
	' Usage example:
	' <script type="text/javascript" src="../javascript/include.aspx?classes=XmlUtils,ResourceManager"></script>
	
	' Supports links between classes and can resolve dependecy conflicts and add necessary files automaticaly.
	' For Example if ResourceManager depends on XmlUtils, Solution classes then their source code
	' will be added to response body in previous usage example.
	' Configuration of Javascript Namespace and declaration of all used claases and filescan be found in
	' JSNamespaceConfig.xml
%>