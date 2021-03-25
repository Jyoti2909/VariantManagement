<%@ Control Language="C#" AutoEventWireup="true" CodeFile="ReportDesigner-Head.ascx.cs" Inherits="Innovator_ReportDesigner" %>
<%@ Import Namespace="Aras.Izenda.Reporting" %>
<% string clientUrl = Server.HtmlEncode(InnovatorPage.InnovatorClientUrl.ToString()); %>

<link rel="stylesheet" type="text/css" href="<% = clientUrl %>/javascript/include.aspx?classes=arasClaro.css,common.css,FF_ESR31_MAC" />
<link rel="stylesheet" type="text/css" href="<% = clientUrl %>/styles/default.css" />
<link rel="stylesheet" type="text/css" href="<% = clientUrl %>/Modules/aras.innovator.Izenda/Styles/IEfixes.css" />

<script type="text/javascript" src="<% = clientUrl %>/javascript/include.aspx?classes=ArasModules,SelfServiceReporting" data-dojo-config="baseUrl:'<% = clientUrl %>/javascript/dojo', isDebug: true, packages: [{ location: '../../javascript/Aras', name: 'Aras' }]"></script>
<script src="<% = clientUrl %>/Modules/aras.innovator.Izenda/Scripts/ReportDesigner.js" type="text/javascript" id="innovator_report_designer"></script>

<link rel="stylesheet" type="text/css" href="<% = clientUrl %>/javascript/include.aspx?classes=InnovatorIzendaUI.css" />
<link rel="stylesheet" type="text/css" href="<% = clientUrl %>/Modules/aras.innovator.Izenda/Styles/tabsToolbar.css" />
<link rel="stylesheet" type="text/css" href="<% = clientUrl %>/Modules/aras.innovator.Izenda/Styles/Tabs/ItemTypes.css" />
<link rel="stylesheet" type="text/css" href="<% = clientUrl %>/styles/common.min.css" />

<script type="text/javascript" id="izenda_overrides">
	function EBC_GetRow_(elem) {
		if (!elem)
			elem = (ebc_mozillaEvent ? (ebc_mozillaEvent.target || ebc_mozillaEvent.srcElement || ebc_mozillaEvent) :
				window.event ? window.event.srcElement : null);
		while (elem != null && elem.tagName != 'TR')
			elem = elem.parentNode;
		return elem;
	}
</script>
