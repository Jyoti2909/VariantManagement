using Aras.Izenda.Reporting;
using Izenda.AdHoc;

public partial class ReportViewer : InnovatorPage
{
	protected override void OnPreInit(System.EventArgs e)
	{
		Aras.Izenda.Reporting.CustomAdHocConfig.InitializeReporting();
		Izenda.AdHoc.Utility.CheckUserName();
		var rs = Aras.Izenda.Reporting.CustomAdHocConfig.LoadReportSetSpecifiedInRequestParameter();
		if (rs != null)
		{
			Title = rs.Title + " - Report Viewer";
		}
	}

	public override string AccessRights
	{
		get
		{
			return Aras.Izenda.Reporting.CustomAdHocConfig.Current.GetAccessRightsByReportId(ReportId);
		}
	}
}