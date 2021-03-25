using System;
using System.Net;
using System.Text;
using DeploymentProcedure.Connectors.Base;
using DeploymentProcedure.Components;
using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Logging;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Xml.Serialization;
using DeploymentProcedure.Utility.FileSystem.Base;

namespace DeploymentProcedure.Connectors
{
	[XmlType("oauth2innovator")]
	public class OAuthToInnovatorConnector : BaseConnector
	{
		[XmlAttribute("oauth")]
		public string OAuthComponentId { get; set; }
		[XmlAttribute("innovator")]
		public string InnovatorComponentId { get; set; }

		public override void Connect(IReadOnlyCollection<Component> instanceComponents)
		{
			Logger.Instance.Log(LogLevel.Info, "\nConfiguring component ({0}) to work with component({1}):\n", OAuthComponentId, InnovatorComponentId);

			OAuthComponent oauthComponent = instanceComponents.Single(c => c.Id == OAuthComponentId) as OAuthComponent;
			InnovatorComponent innovatorComponent = instanceComponents.Single(c => c.Id == InnovatorComponentId) as InnovatorComponent;

			SetupRedirectUris(oauthComponent, innovatorComponent);
		}

		private void SetupRedirectUris(OAuthComponent oauthComponent, InnovatorComponent innovatorComponent)
		{
			ICollection<string> innovatorClientUrls = new List<string>();

			Uri innovatorServerUri = new Uri(innovatorComponent.Url);
			// innovatorServerUri.Host may contain localhost, IP, Computername or FQDN
			// GetHostEntry allow to get FQDN by any of this values
			string dnsHostName = Dns.GetHostEntry(innovatorServerUri.Host).HostName;
			ICollection<string> innovatorServerHosts = new HashSet<string>();
			// Add always "localhost"
			innovatorServerHosts.Add("localhost");
			// Add host name (computer name)
			innovatorServerHosts.Add(dnsHostName.Split('.')[0]);
			// Add FQDN
			innovatorServerHosts.Add(dnsHostName);
			// Get IP addresses for FQDN (IPv4 only)
			foreach (IPAddress ipAddress in Dns.GetHostAddresses(dnsHostName).Where(hostName => IsInterNetwork(hostName)))
			{
				innovatorServerHosts.Add(ipAddress.ToString());
			}

			string webAlias = ParseInnovatorServerWebAlias(innovatorServerUri);

			foreach (string innovatorServerHost in innovatorServerHosts)
			{
				innovatorClientUrls.Add(string.Format(CultureInfo.InvariantCulture, "{0}://{1}{2}Client", innovatorServerUri.Scheme, innovatorServerHost, webAlias));
			}

			// Create redirectUris content based on redirectUris values
			StringBuilder redirectUrisContent = new StringBuilder();
			StringBuilder postLogoutRedirectUrisContent = new StringBuilder();
			foreach (string innovatorClientUrl in innovatorClientUrls)
			{
				redirectUrisContent.AppendLine(string.Format(CultureInfo.InvariantCulture, "\t\t\t\t\t<redirectUri value='{0}/OAuth/RedirectCallback' />", innovatorClientUrl));
				redirectUrisContent.AppendLine(string.Format(CultureInfo.InvariantCulture, "\t\t\t\t\t<redirectUri value='{0}/OAuth/SilentCallback' />", innovatorClientUrl));
				redirectUrisContent.AppendLine(string.Format(CultureInfo.InvariantCulture, "\t\t\t\t\t<redirectUri value='{0}/OAuth/PopupCallback' />", innovatorClientUrl));
				postLogoutRedirectUrisContent.AppendLine(string.Format(CultureInfo.InvariantCulture, "\t\t\t\t\t<redirectUri value='{0}/OAuth/PostLogoutCallback' />", innovatorClientUrl));
			}

			string pathToOAuthConfig = BaseFileSystem.CombinePaths(oauthComponent.InstallationPath, "OAuth.config");
			oauthComponent.TargetFileSystem.XmlHelper.AppendFragment(
				redirectUrisContent.ToString(),
				oauthComponent.TargetFileSystem.XmlHelper.GetNode(pathToOAuthConfig, "/oauth/server/clientRegistries/clientRegistry[@id='InnovatorClient']/redirectUris"));
			oauthComponent.TargetFileSystem.XmlHelper.AppendFragment(
				postLogoutRedirectUrisContent.ToString(),
				oauthComponent.TargetFileSystem.XmlHelper.GetNode(pathToOAuthConfig, "/oauth/server/clientRegistries/clientRegistry[@id='InnovatorClient']/postLogoutRedirectUris"));
		}

		private static bool IsInterNetwork(IPAddress hostName)
		{
			return string.Compare(hostName.AddressFamily.ToString(), "InterNetwork", StringComparison.InvariantCultureIgnoreCase) == 0;
		}

		private static string ParseInnovatorServerWebAlias(Uri innovatorServerUri)
		{
			string innovatorServerWebAlias = string.Join(string.Empty, innovatorServerUri.Segments);
			return innovatorServerWebAlias.TrimEnd('/') + '/';
		}
	}
}
