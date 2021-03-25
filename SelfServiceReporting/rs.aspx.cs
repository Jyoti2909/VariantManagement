using Izenda.AdHoc;

public partial class rs : Izenda.AdHoc.ResponseServer
{
	protected override void OnPreInit(System.EventArgs e)
	{
		Aras.Izenda.Reporting.CustomAdHocConfig.InitializeReporting();
	}

	override protected void OnInit(System.EventArgs e)
	{
		var rawUrl = System.Web.HttpContext.Current.Request.RawUrl.ToLower();
		if (rawUrl.Contains("copy=") || rawUrl.Contains("wscmd=refreshlog4netconfig") || rawUrl.Contains("wscmd=initiatemaintenancesession") || rawUrl.Contains("wscmd=invalidatemaintenancesession") || rawUrl.Contains("wscmd=maintenancesessioncmd"))
		{
			System.Web.HttpContext.Current.Response.End();
		}
	}
}
