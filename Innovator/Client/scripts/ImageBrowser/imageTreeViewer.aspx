<!DOCTYPE html>
<!-- (c) Copyright by Aras Corporation, 2004-2013. -->
<%@ Page Language="C#" %>
<%@ Import Namespace="System.IO" %>
<html>
<head>
	<style type="text/css">
		@import "../../javascript/dojo/resources/dojo.css";
		@import "../../javascript/dijit/themes/claro/claro.css";

		body{
			height: 100%;
			width: 100%;
			padding: 0px; 
			margin: 0px;
		}
	</style>
	<script>
		var params = parent.parent.imageBrowserParams;
		var aras = params.aras;
	</script>
	<script type="text/javascript" src="../../javascript/include.aspx?classes=/dojo.js" data-dojo-config="isDebug: false, parseOnLoad: false, baseUrl:'../../javascript/dojo'"></script>
	<script src="../../javascript/cookie.js"></script>
	<script>
	var tree,
		dir = params.image;

	function onTreeClick(dir) {
		var date = new Date();
		date.setFullYear(date.getFullYear() + 1);
		SetCookie("innovator_imageBrowserFolder", dir, date, "/");

		var urlString = "imageViewer.aspx?path=" + encodeURI(dir);
		var files = parent.document.getElementById('files');
		files.src = urlString;
	}

	function GetServerFolderFilesComplete(res) {
		if (!res.xml) {
			// No direct access to XML string when not using IE, need to serialise to XML string
			var serializer = new XMLSerializer();
			var xml = serializer.serializeToString(res);
			tree.initXML(xml);
		} 
		else {
			tree.initXML(res.xml);
		}
		var dir = GetCookie("innovator_imageBrowserFolder");
		if(dir) {
			tree.selectItem(dir);
			onTreeClick(dir);
		}
	}

	function GetServerFolderFilesFailed(error) {
		aras.AlertError(error.get_exceptionType() + error.get_message() + error.get_stackTrace());
	}

	clientControlsFactory.createControl("Aras.Client.Controls.Experimental.Tree", {IconPath: "../../cbin/", persist: true }, function(control) {
		tree = control;
		document.body.appendChild(tree._tree.domNode);
		clientControlsFactory.on(tree, {
			"itemSelect": onTreeClick
		});
		Aras.Client.Core.InnovatorClientService.GetXmlForImageBrowserDirectoryViewer('<%=System.Web.Security.AntiXss.AntiXssEncoder.HtmlEncode(HttpContext.Current.Request.Params["path"],false) %>', GetServerFolderFilesComplete, GetServerFolderFilesFailed);
	});
</script>
</head>
<body class="claro">
	<form id="form1" runat="server">
	<asp:ScriptManager runat="server" ID="SM">
		<Services>
			<asp:ServiceReference Path="~/scripts/InnovatorClient.asmx" InlineScript="true" />
		</Services>
	</asp:ScriptManager>
	</form>
</body>
</html>
