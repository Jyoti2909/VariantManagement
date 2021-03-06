using System;
using System.Web;
using System.Web.UI;
using Izenda.AdHoc;
using Izenda.AdHoc.Toolkits;

public partial class MasterPage1 : MasterPage
{
  protected override void OnInit(EventArgs e)
	{
    Aras.Izenda.Reporting.CustomAdHocConfig.InitializeReporting();
		if (!AdHocSettings.ShowDesignLinks)
		{
			string script = "<script type=\"text/javascript\" language=\"javascript\">";
			script += "try { $(document).ready(function() {$('.designer-only').hide(); });}catch(e){}";
			script += " try{ jq$(document).ready(function() {jq$('.designer-only').hide(); });}catch(e){} ";
			script += "</script>";
			Page.Header.Controls.Add(new LiteralControl(script));
		}
		AdHocSettings.ShowSettingsButtonForNonAdmins = false;
	}
}
