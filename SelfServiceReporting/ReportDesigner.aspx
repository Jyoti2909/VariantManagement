<%@ Page Title="Report Designer" Language="C#" MasterPageFile="Izenda.master" AutoEventWireup="true" CodeFile="ReportDesigner.aspx.cs" Inherits="ReportDesigner" %>
<%@ Import namespace="Izenda.AdHoc" %>

<%@ Import Namespace="System.Globalization" %>
<%@ Register TagPrefix="cc1" Namespace="Aras.Izenda.Reporting" Assembly="Aras.Izenda.Reporting" %>
<%@ Register Src="~/Resources/html/ReportDesigner-Head.ascx" TagPrefix="uc1" TagName="ReportDesignerHead" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadPlaceHolder" runat="Server">
	<link rel="stylesheet" type="text/css" href="./<%=AdHocSettings.ResourcesProviderUniqueUrlWithDelimiter%>extres=css.Filters.min.css" />
	<link rel="stylesheet" type="text/css" href="./<%=AdHocSettings.ResourcesProviderUniqueUrlWithDelimiter%>css=ModernStyles.jquery-ui" />
	<script type="text/javascript" src="./<%=AdHocSettings.ResourcesProviderUniqueUrlWithDelimiter%>extres=js.RichEditorPopup.js"></script>
	<style type="text/css">
		#<% = Adhocreportdesigner1.ClientID %>__MultiPage div table {
			display: none;
		}
	</style>
	<%-- should it be moved to ReportDesigner-Head.aspx? --%>
	<script id="server_generated_script" type="text/javascript">
		window.aras = window.frameElement ? window.parent.aras : window.opener.aras;

		function getClientUrl() {
			return '<% = Server.HtmlEncode(InnovatorClientUrl.ToString()) %>';
		}
		
		function reportDesignerContainerId() {
			return '<% = Adhocreportdesigner1.ClientID %>_ctl01';
		}
		
		var reportSet = "null";
		var clientReportSetData = {
						ItemTypeMode: '',
						SelectedItemTypes: '',
						metaData: ''
					};
		var reportItemExists = !window.parent.isNew;

		var isPostBack = <% = IsPostBack.ToString(CultureInfo.InvariantCulture).ToLowerInvariant() %>;
		var clientDataSelectedItemTypesName = '<% = Config.ClientDataSelectedItemTypesParamName %>';
		var innovatorReportMetadataName = '<% = Config.InnovatorReportMetadataName %>';

		if (reportItemExists) {
			<%
				var currentConfig = Aras.Izenda.Reporting.CustomAdHocConfig.Current; 
				var item = currentConfig.LoadReportItemById(InnovatorUtility.GetReportInfoReportId(null));
				if (item != null)
				{
					var reportSet = new Izenda.AdHoc.ReportSet();
					reportSet.ReadXml(item.getProperty("definition"));
			%>
			reportSet = <% = Config.SerializeToJson(Config.GetClientJoinedTables(reportSet)) %>;
			<%	} %>
		}
	</script>
	<uc1:ReportDesignerHead runat="server" id="ReportDesignerHead" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="PlaceHolder" runat="Server">
	<div class="report-page">
		<form id="form1" runat="server">
			<div id="repHeader"></div>

			<!-- #INCLUDE FILE="Resources/html/CommonVariables.inc" -->
			<input type="hidden" name="<% = Config.ClientDataSelectedItemTypesParamName %>" />
			<input type="hidden" id="<% = Config.InnovatorReportMetadataName %>" name="<% = Config.InnovatorReportMetadataName %>" />

			<cc1:InnovatorAdHocReportDesigner ID="Adhocreportdesigner1" runat="server">
			</cc1:InnovatorAdHocReportDesigner>
		</form>
	</div>
</asp:Content>