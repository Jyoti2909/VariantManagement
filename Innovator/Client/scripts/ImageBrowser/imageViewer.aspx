<!DOCTYPE html>
<!-- (c) Copyright by Aras Corporation, 2004-2013. -->
<%@ Page Language="C#" %>
<%@ Import Namespace="System.IO" %>
<html>
<head>
	<title></title>
	<style type="text/css">
		@import "../../javascript/dojo/resources/dojo.css";
		@import "../../javascript/dijit/themes/claro/claro.css";
		@import "../../javascript/dojox/grid/resources/claroGrid.css";
		@import "../../javascript/include.aspx?classes=common.css";

		html,body{
			overflow: hidden;
			width: 100%;
			height: 100%;
			margin: 0px;
			padding: 0px;
		}
	</style>
	<script>
		var aras = parent.parent.imageBrowserParams.aras;
	</script>
	<script type="text/javascript" src="../../javascript/include.aspx?classes=/dojo.js" data-dojo-config="isDebug: false, parseOnLoad: false, baseUrl:'../../javascript/dojo'"></script>
	<script type="text/javascript" src="../../javascript/cookie.js"></script>
	<script type="text/javascript" src="../../javascript/include.aspx?classes=XmlDocument"></script>
	<script type="text/javascript">
		var currSelId = ""; //path to the currently selected folder or file

		function centerImg()
		{
			var image = this;
			var td = document.getElementById("image_preview").parentNode;
			var tdWidth = td.clientWidth;
			var tdHeight = td.clientHeight;

			var imgWidth = image.width;
			var imgHeight = image.height;
			var k = imgWidth/imgHeight;

			if (imgWidth > tdWidth) {
				imgWidth = tdWidth;
				imgHeight = imgWidth / k;
			}

			if (imgHeight > tdHeight) {
				imgHeight = tdHeight;
				imgWidth = imgHeight * k;
			}

			var realImg = document.getElementById("image_preview");
			realImg.width = imgWidth;
			realImg.height = imgHeight;
			realImg.src = this.src;
		}

		function preview(url, flg)
		{
			if (!flg)
			{
				if (currSelId) try
				{
					document.icons_list.document.getElementById(currSelId).className = "unselectedTable";
				}
				catch (e0) { }

				var id = document.grid.getSelectedId();
				if (url) try
				{
					if (id) document.icons_list.document.getElementById(id).className = "selectedTable";
				}
				catch (e1) { }
				currSelId = id;
			}

			if (url.search(/^imageBrowser/) == 0)
			{
				document.getElementById("image_preview").src = "";
				document.getElementById("image_preview").style.visibility = "hidden";
			}
			else
			{
				var image = new Image();
				image.onload = centerImg;
				image.src = url;
				document.getElementById("image_preview").style.visibility = "visible";
			}
		}

		function onDblClick(rowId)
		{
			if (!rowId) return false;

			var url = grid.getUserData(rowId, "url");
			if (url.search(/^'imageBrowser/) == 0)
				location.href = url;
			else
			{
				parent.parent.closeWindow(url.substr(3));
			}
		}

		var toolbarReady = false;
		var ITb_tmt = null;
		var iconslistReady = false;
		var iconslistCont = '';

		function onToolbarLoad()
		{
			toolbarReady = true;
		}

		function iconslistLoad()
		{
			iconslistReady = true;
		}

		function onIconsListClick(event)
		{
			var ev = event ? event : document.icons_list.window.event;
			if (!ev) return false;
			var el = ev.target ? ev.target : ev.srcElement;
			if (!el) return false;
			var tn = el.tagName;
			tn = tn.toLowerCase();
			var id = '';
			if (tn == 'body') return true;
			else if (tn == 'table')
			{
				id = el.id;
			}
			else if (tn == 'tbody' || tn == 'tr' || tn == 'td' || tn == 'img')
			{
				if (tn == 'tbody') id = el.parentNode.id;
				else if (tn == 'tr') id = el.parentNode.parentNode.id;
				else if (tn == 'td') id = el.parentNode.parentNode.parentNode.id;
				else if (tn == 'img') id = el.parentNode.parentNode.parentNode.parentNode.id;
			}

			if (currSelId) document.icons_list.document.getElementById(currSelId).className = "unselectedTable";

			var tmp = null;

			if (id) {
				document.icons_list.document.getElementById(id).className = "selectedTable";
				document.grid.setSelectedRow(id, false, false);
				var url = grid.getUserData(id, "url");
				if (url) preview(url, true);
			}

			currSelId = id;
		}

		function onIconsListDblClick(event)
		{
			var ev = event || document.icons_list.window.event;
			if (!ev) return false;
			var el = ev.target || ev.srcElement;
			if (!el) return false;
			if (el.tagName.toLowerCase() == "body") return true;

			if (currSelId) onDblClick(currSelId);
		}

		function initToolbar()
		{
			var doc = document.icons_list.document || document.icons_list.contentWindow.document;

			var styleTag = doc.createElement ("style");
			var head = doc.getElementsByTagName ("head")[0];
			head.appendChild (styleTag);
			var ss = styleTag.sheet ? styleTag.sheet : styleTag.styleSheet;

			ss.insertRule('table {float:left; table-layout:fixed; margin-left:5; margin-bottom:5; height:40; width:40;}', 0);
			ss.insertRule('.selectedTable {background-color:#0000ff; color:#ffffff;}', 0);
			ss.insertRule('.unselectedTable {background-color:; color:;}', 0);

			doc.onclick = onIconsListClick;
			doc.ondblclick = onIconsListDblClick;
		}

		setViewMode = function()
		{
			var isIconView = (parent.currViewMode == "icons_view");
			document.getElementById("iconsTable").style.display = isIconView ? "" : "none";
			document.getElementById("detailsTable").style.display = isIconView ? "none" : "";
		}

		function GetViewDataCompleted(res)
		{
			if (!res.xml) {
				var serializer = new XMLSerializer();
				var xml = serializer.serializeToString(res);
				res = aras.createXMLDocument();
				res.loadXML(xml);
			}
			var bodyHtml = res.selectSingleNode("ImageBrowserViewData/BodyHtml").text;
			if(bodyHtml){
				document.icons_list.document.body.innerHTML = bodyHtml;
			}
			grid.grid_Experimental.rowsPerPage = res.selectNodes("ImageBrowserViewData/GridXml/table/tr").length;
			grid.InitXML_Experimental(res.selectSingleNode("ImageBrowserViewData/GridXml/*").xml);
		}

		function GetServerFolderFilesFailed(error)
		{
			aras.AlertError(error.get_exceptionType() + error.get_message() + error.get_stackTrace());
		}

		var grid = null;

		onload = function() {
			if (!document.icons_list) {
				document.icons_list = document.getElementById("icons_list");
			}
			if (!document.icons_list.document) {
				document.icons_list.document = document.icons_list.contentDocument;
			}
			clientControlsFactory.createControl("Aras.Client.Controls.Public.GridContainer", undefined, function(control) {
				grid = document.grid = control;
				clientControlsFactory.on(grid, {
					"gridClick": function (rowID) { 
						preview(grid.getUserData(rowID, "url"));
					},
					"gridDoubleClick": onDblClick,
					"gridXmlLoaded": setViewMode
				});
			});

			// Load Grid Data
			Aras.Client.Core.InnovatorClientService.GetDataForImageViewer('<%=System.Web.Security.AntiXss.AntiXssEncoder.HtmlEncode(HttpContext.Current.Request.Params["path"],false) %>', GetViewDataCompleted, GetServerFolderFilesFailed);
			initToolbar();
		}
	</script>
</head>
<body class="claro">
	<form id="form1" runat="server" style="display:none">
	<asp:ScriptManager runat="server" ID="SM">
		<Services>
			<asp:ServiceReference Path="~/scripts/InnovatorClient.asmx" InlineScript="true" />
		</Services>
	</asp:ScriptManager>
	</form>
	<div id="iconsTable" style="position:absolute; left:0px; right:0px; top:0px; bottom:0px;">
		<iframe width="100%" height="100%" id="icons_list" name="icons_list" src="" frameborder="0"></iframe>
	</div>
	<div id="detailsTable" style="position:absolute; left:0px; right:0px; top:0px; bottom:0px;">
		<table border="0" cellspacing="0" cellpadding="0" style="width: 100%; height: 100%;">
			<tr>
				<td width="40%" style="height: 100%;" valign="center" align="center">
					<img id="image_preview" src="" style="visibility: hidden"></img>
				</td>
				<td id="gridTD" width="60%" style="height: 100%;" ></td>
			</tr>
		</table>
	</div>
</body>
</html>
