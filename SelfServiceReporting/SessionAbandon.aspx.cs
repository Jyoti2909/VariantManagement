using System;

public partial class SessionAbandon : System.Web.UI.Page
{
	protected override void OnLoad(EventArgs e)
	{
		Session.Abandon();
	}
}