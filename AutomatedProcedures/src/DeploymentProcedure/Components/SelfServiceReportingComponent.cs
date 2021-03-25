using DeploymentProcedure.Packages.Base;
using DeploymentProcedure.Utility;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.IO;
using System.Xml.Serialization;

namespace DeploymentProcedure.Components
{
	[XmlType("ssr")]
	public class SelfServiceReportingComponent : WebComponent
	{
		#region Overriding CodeTreeComponent properties
		public override string BaselineSourcePath { get; set; } = Path.Combine(Properties.PathToCodeTree, "SelfServiceReporting");
		public override string DeploymentPackageDirectoryName { get; set; } = "SelfServiceReporting";
		public override bool IsOAuthPublicCertificateRequired { get; set; } = true;
		public override string OAuthCertificateName { get; set; } = "SelfServiceReporting";
		public override string OAuthCertificatesTemplateDir { get; set; } = @"SelfServiceReporting\App_Data\Certificates";
		public override string OAuthConfigTemplateFile { get; set; } = @"SelfServiceReporting\OAuth.config";
		public override string OAuthConfigCertificatePasswordXpath { get; set; } = "/oauth/client/secret/certificate/@password";
		private string _pathToConfig;
		public override string PathToConfig
		{
			get { return _pathToConfig ?? Path.Combine(InstallationPath, "..\\SelfServiceReportConfig.xml"); }
			set { _pathToConfig = value; }
		}
		public override string PathToCodeTreeTemplates => Path.Combine(Properties.PathToTemplates, "SelfServiceReporting");
		public override string PathToConfigTemplate => Path.Combine(Properties.PathToTemplates, "SelfServiceReportConfig.xml");
		public override string PathToBasicConfig => Path.Combine(InstallationPath, "SelfServiceReport.xml");
		#endregion

		#region Implementing ApplyPackage
		public override void ApplyPackage(Package package)
		{
			if (package == null)
			{
				throw new ArgumentNullException(nameof(package));
			}

			TransformationUtil.ApplyTransformations(this, BaseFileSystem.CombinePaths(package.PathToDeploymentPackage, package.RelativePathToTransformations));
			package.ApplyToSelfServiceReportingComponent(this);
		}
		#endregion

		public override void Setup()
		{
			base.Setup();

			ConfigureInnovatorIISWebApplication(SiteName + VirtualDirectoryPath);
		}
	}
}
