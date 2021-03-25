using DeploymentProcedure.Components;
using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Connectors.Base;
using DeploymentProcedure.Logging;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml.Serialization;

namespace DeploymentProcedure.Connectors
{
	[XmlType("winauth")]
	public class WinAuthConnector : BaseConnector
	{
		private const string ClientConfigNodeContent = "<ClientConfig AssemblyName=\"Aras.LogonHooks.WindowsAuth\"	AssemblyNameType=\"partial\" TypeName=\"Aras.LogonHooks.WindowsAuth\" />";
		private const string ClientLogonNodeContent = "<ClientLogon allowed_domain_names=\".+\"" +
																	" allowed_domain_users=\".+\"" +
																	" denied_domain_users=\"^admin$|^root$|^vadmin$|^PLM$|^pdftron_user$|^esadmin$|^authadmin$\"" +
																	" allowed_direct_users=\"^admin$|^root$|^pdftron_user$|^esadmin$|^authadmin$\"" +
																	" shared_secret=\"Your shared secret here\"" +
																	" empty_logon_user_allow_direct=\"false\" />";

		[XmlAttribute("innovator")]
		public string InnovatorComponentId { get; set; }
		[XmlAttribute("oauth")]
		public string OAuthComponentId { get; set; }

		public override void Connect(IReadOnlyCollection<Component> instanceComponents)
		{
			Logger.Instance.Log(LogLevel.Info, "\nConfiguring WinAuth for component ({0}):\n", InnovatorComponentId);

			InnovatorComponent innovatorComponent = instanceComponents.Single(c => c.Id == InnovatorComponentId) as InnovatorComponent;
			OAuthComponent oauthComponent = instanceComponents.Single(c => c.Id == OAuthComponentId) as OAuthComponent;

			Logger.Instance.Log(LogLevel.Info, "Enabling Windows authentication for login.aspx and IOMlogin.aspx");

			innovatorComponent.SetupWinAuth();

			if (!innovatorComponent.TargetFileSystem.XmlHelper.CheckIfExists(innovatorComponent.PathToConfig, "/Innovator/ClientConfig"))
			{
				Logger.Instance.Log(LogLevel.Info, "Appending 'ClientConfig' node to InnovatorServerConfig.xml");

				innovatorComponent.TargetFileSystem.XmlHelper.AppendFragment(ClientConfigNodeContent,
					innovatorComponent.TargetFileSystem.XmlHelper.GetNode(innovatorComponent.PathToConfig, "/Innovator"));
			}

			if (!innovatorComponent.TargetFileSystem.XmlHelper.CheckIfExists(innovatorComponent.PathToConfig, "/Innovator/ClientLogon"))
			{
				Logger.Instance.Log(LogLevel.Info, "Appending 'ClientLogon' node to InnovatorServerConfig.xml");

				innovatorComponent.TargetFileSystem.XmlHelper.AppendFragment(ClientLogonNodeContent,
					innovatorComponent.TargetFileSystem.XmlHelper.GetNode(innovatorComponent.PathToConfig, "/Innovator"));
			}

			string pathToClientOAuthConfig = Path.Combine(innovatorComponent.InstallationPath, "Client\\OAuth.config");
			if (!innovatorComponent.TargetFileSystem.XmlHelper.CheckIfExists(pathToClientOAuthConfig, "/oauth/client/serverLocation"))
			{
				Logger.Instance.Log(LogLevel.Info, "Specifying correct OAuth Url ({0}) in the Innovator\\Client\\OAuth.config", oauthComponent.Url);

				innovatorComponent.TargetFileSystem.XmlHelper.AppendFragment(string.Format("<serverLocation url=\"{0}\" />", oauthComponent.Url),
					innovatorComponent.TargetFileSystem.XmlHelper.GetNode(pathToClientOAuthConfig, "/oauth/client"));
			}
		}
	}
}
