using DeploymentProcedure.Packages.Base;
using DeploymentProcedure.Utility;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.IO;
using System.Xml.Serialization;

namespace DeploymentProcedure.Components
{
	[XmlType("vault")]
	public class VaultComponent : WebComponent
	{
		public string Name { get; set; } = "Default";
		public string PathToVaultFolder { get; set; }
		public string VaultServerAspxUrl => Url.TrimEnd('/') + "/VaultServer.aspx";

		public VaultComponent()
		{
			ManagedRuntimeVersion = string.Empty;
		}

		#region Overriding CodeTreeComponent properties
		public override string BaselineSourcePath { get; set; } = Path.Combine(Properties.PathToCodeTree, "VaultServer");
		public override string DeploymentPackageDirectoryName { get; set; } = "VaultServer";
		public override bool IsOAuthPublicCertificateRequired { get; set; } = true;
		public override string OAuthCertificateName { get; set; } = "VaultServer";
		public override string OAuthCertificatesTemplateDir { get; set; } = @"VaultServer\App_Data\Certificates";
		public override string OAuthConfigTemplateFile { get; set; } = @"VaultServer\OAuth.config";
		public override string OAuthConfigCertificatePasswordXpath { get; set; } = "/oauth/client/secret/certificate/@password";
		private string _pathToConfig;
		public override string PathToConfig
		{
			get { return _pathToConfig ?? Path.Combine(InstallationPath, "vault.config"); }
			set { _pathToConfig = value; }
		}
		public override string PathToCodeTreeTemplates => Path.Combine(Properties.PathToTemplates, "VaultServer");
		#endregion

		#region Implementing Setup logic
		public override void Setup()
		{
			base.Setup();

			SetupVaultServerConfig();
			ConfigureInnovatorIISWebApplication(SiteName + VirtualDirectoryPath);
		}

		private void SetupVaultServerConfig()
		{
			Directory.CreateDirectory(PathToVaultFolder);
			TargetFileSystem.XmlHelper.XmlPoke(PathToConfig, "/configuration/appSettings/add[@key = 'LocalPath']/@value", PathToVaultFolder);
			ProcessWrapper.Execute("icacls", "{0} /grant *S-1-5-11:(OI)(CI)(M)", TargetFileSystem.GetFullPath(PathToVaultFolder));
		}
		#endregion

		#region Implementing Clenaup logic
		public override void Remove()
		{
			base.Remove();

			if (TargetFileSystem.DirectoryExists(PathToVaultFolder))
			{
				TargetFileSystem.DeleteDirectory(PathToVaultFolder);
			}
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
			package.ApplyToVaultComponent(this);
		}

		public override void HealthCheck()
		{
			ValidationHelper.CheckHostAvailability(ServerName);
		}
		#endregion
	}
}
