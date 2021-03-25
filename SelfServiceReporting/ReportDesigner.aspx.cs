using System;
using System.Web;
using Aras.Izenda.Reporting;
using Izenda.AdHoc;

public partial class ReportDesigner : InnovatorPage
{
	protected void Page_Load(object sender, EventArgs e)
	{
		((Driver)AdHocContext.Driver).RefreshDatabaseSchemaIfNeeded();
	}

	protected override void OnPreInit(EventArgs e)
	{
		Aras.Izenda.Reporting.CustomAdHocConfig.InitializeReporting();
	}

	protected void Page_PreRender() 
	{
	}

	public override string AccessRights
	{
		get
		{
			return HttpContext.Current.Request.Params["AccessRights"];
		}
	}
}
