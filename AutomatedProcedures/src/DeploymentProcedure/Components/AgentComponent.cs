using DeploymentProcedure.Utility;
using System;
using System.IO;
using System.Xml.Serialization;
using DeploymentProcedure.Packages.Base;
using DeploymentProcedure.Utility.FileSystem.Base;

namespace DeploymentProcedure.Components
{
	[XmlType("agent")]
	public class AgentComponent : WindowsServiceComponent
	{
		public string ConversionManagerUser { get; set; } = "admin";
		public string ConversionManagerPassword { get; set; } = "innovator";
		public string Url { get; set; }
		public string PathToConversionConfig => Path.Combine(InstallationPath, "conversion.config");
		public string PathToConversionConfigTemplate => Path.Combine(Properties.PathToTemplates, "AgentService\\conversion.config");

		#region Overriding CodeTreeComponent properties
		public override string BaselineSourcePath { get; set; } = Path.Combine(Properties.PathToCodeTree, "AgentService");
		public override string DeploymentPackageDirectoryName { get; set; } = "AgentService";
		public override string OAuthCertificateName { get; set; } = "AgentService";
		public override string OAuthCertificatesTemplateDir { get; set; } = @"AgentService\App_Data\Certificates";
		public override string OAuthConfigTemplateFile { get; set; } = @"AgentService\OAuth.config";
		public override string OAuthConfigCertificatePasswordXpath { get; set; } = "/oauth/client/secret/certificate/@password";
		public override string PathToExecutable => Path.Combine(InstallationPath, "Aras.Server.Agent.Service.exe");
		public override string PathToCodeTreeTemplates => Path.Combine(Properties.PathToTemplates, "AgentService");
		public override string PathToConfig => Path.Combine(InstallationPath, "Aras.Server.Agent.Service.exe.config");
		public override string PathToConfigTemplate => Path.Combine(Properties.PathToTemplates, "Aras.Server.Agent.Service.exe.config");
		#endregion

		#region Implementing Setup logic
		public override void Setup()
		{
			base.Setup();

			SetupAgentServiceConfig();
			SetupConfigFromTemplate(PathToConversionConfig, PathToConversionConfigTemplate);
		}
		private void SetupAgentServiceConfig()
		{
			Url = EvaluateAgentServiceBindingEndpoint(Url);

			TargetFileSystem.XmlHelper.XmlPoke(PathToConfig, "/configuration/system.serviceModel/services/service[@name='Aras.Server.Agent.Service.InternalAgent']/host/baseAddresses/add/@baseAddress", Url);
		}

		private static string EvaluateAgentServiceBindingEndpoint(string url)
		{
			UriBuilder agentServiceUrl = new UriBuilder(url);
			agentServiceUrl.Port = url.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ? 8735 : 8734;
			return agentServiceUrl.Uri.ToString();
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
			package.ApplyToAgentComponent(this);
		}
		#endregion
	}
}
