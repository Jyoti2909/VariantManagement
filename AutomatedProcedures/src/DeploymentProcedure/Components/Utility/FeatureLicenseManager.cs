using Aras.IOM;

namespace DeploymentProcedure.Components.Utility
{
	public class FeatureLicenseManager : HttpServerConnection
	{
		public FeatureLicenseManager(string innovatorServerUrl, string database, string userName, string password) 
			: base(innovatorServerUrl, database, userName, password, null, null)
		{
		}

		public void ImportFeatureLicense(string encryptedFeatureLicense)
		{
			try
			{
				Login();

				GetLicenseManagerWebService().ImportFeatureLicense(encryptedFeatureLicense);
			}
			finally
			{
				Logout();
			}
		}
	}
}
