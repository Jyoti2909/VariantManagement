using DeploymentProcedure.Packages.Base;
using DeploymentProcedure.Utility;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.IO;
using System.Xml.Serialization;

namespace DeploymentProcedure.Components
{
	[XmlType("oauth")]
	public class OAuthComponent : WebComponent
	{
		public string InnovatorUrl { get; set; }

		#region Overriding CodeTreeComponent properties
		public override string BaselineSourcePath { get; set; } = Path.Combine(Properties.PathToCodeTree, "OAuthServer");
		public override string DeploymentPackageDirectoryName { get; set; } = "OAuthServer";
		public override string OAuthCertificateName { get; set; } = "OAuthServer";
		public override string OAuthCertificatesTemplateDir { get; set; } = @"OAuthServer\App_Data\Certificates";
		public override string OAuthConfigTemplateFile { get; set; } = @"OAuthServer\OAuth.config";
		public override string OAuthConfigCertificatePasswordXpath { get; set; } = "/oauth/server/tokenSigning/certificate/@password";
		public override string PathToCodeTreeTemplates => Path.Combine(Properties.PathToTemplates, "OAuthServer");
		public override string PathToConfig => Path.Combine(InstallationPath, "OAuthServer.config");
		#endregion
		public OAuthComponent()
		{
			ManagedRuntimeVersion = string.Empty;
		}

		#region Implementing ISetupable
		public override void Setup()
		{
			base.Setup();

			SetupNtfsPermissionsToFolder(Path.Combine(InstallationPath, "App_Data"));
			WebAdministration.SetupWinAuth(ServerName, SiteName + VirtualDirectoryPath + "/signin-windows");
			ConfigureInnovatorIISWebApplication(SiteName + VirtualDirectoryPath);
			SetupConfigurationFiles();
		}

		private void SetupConfigurationFiles()
		{
			TargetFileSystem.XmlHelper.XmlPoke(PathToConfig, "/configuration/appSettings/add[@key = 'InnovatorServerUrl']/@value", InnovatorUrl);
		}
		#endregion

		#region Implementing IRemovable
		public override void Remove()
		{
			WebAdministration.RemoveWinAuth(ServerName, SiteName + VirtualDirectoryPath + "/signin-windows");

			base.Remove();
		}
		#endregion

		#region Implementing ApplyPackage
		public override void ApplyPackage(Package package)
		{
			if (package == null)
			{
				throw new ArgumentNullException(nameof(package));
			}

			TransformationUtil.ApplyTransformations(this, BaseFileSystem.CombinePaths(package.PathToDeploymentPackage, package.RelativePathToTransformations));
			package.ApplyToOAuthComponent(this);
		}

		public override void HealthCheck()
		{
			ValidationHelper.CheckHostAvailability(ServerName);
			ValidationHelper.CheckUrlAvailability($"{Url}/.well-known/openid-configuration");
		}
		#endregion
	}
}
