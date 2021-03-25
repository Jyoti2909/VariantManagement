<%@ Page Title="" Language="C#" MasterPageFile="Izenda.master" AutoEventWireup="true" CodeFile="ReportViewer.aspx.cs" Inherits="ReportViewer" %>
<%@ Import Namespace="Aras.Izenda.Reporting" %>
<%@ Register Src="Resources/html/ReportViewer-Head.ascx" TagName="ccn1" TagPrefix="ccp1" %>
<%@ Register Src="Resources/html/ReportViewer-Body.ascx" TagName="ccn2" TagPrefix="ccp2" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadPlaceHolder" Runat="Server">
	<link rel="stylesheet" type="text/css" href="<% = Server.HtmlEncode(InnovatorClientUrl.ToString()) %>/javascript/include.aspx?classes=ReportViewer.css"/>
	
		<script type="text/javascript">
			function getClientUrl() {
				var innovatorClientUrl = "<% = Server.HtmlEncode(InnovatorClientUrl.ToString()) %>";
			return innovatorClientUrl;
		}

		function getReportId() {
			return "<% = Server.HtmlEncode(ReportId) %>";
		}

		function getAccessRights() {
			return "<% = Server.HtmlEncode(AccessRights) %>";
		}

	</script>
	<ccp1:ccn1 runat="server" />
</asp:Content>

<asp:Content ID="Content2" ContentPlaceHolderID="PlaceHolder" Runat="Server">
	<ccp2:ccn2 runat="server" />
</asp:Content>