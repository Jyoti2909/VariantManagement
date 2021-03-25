using DeploymentProcedure.Packages.Base;
using DeploymentProcedure.Utility;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.IO;
using System.Xml.Serialization;

namespace DeploymentProcedure.Components
{
	[XmlType("conversion")]
	public class ConversionComponent : WebComponent
	{
		public string Name { get; set; } = "Default";
		public string ConversionServiceAsmxUrl => Url.TrimEnd('/') + "/ConversionService.asmx";

		public ConversionComponent()
		{
			ManagedRuntimeVersion = string.Empty;
		}

		#region Overriding CodeTreeComponent properties
		private string _pathToConfig;
		public override string PathToConfig
		{
			get { return _pathToConfig ?? Path.Combine(InstallationPath, "..\\ConversionServerConfig.xml"); }
			set { _pathToConfig = value; }
		}
		public override string PathToConfigTemplate => Path.Combine(Properties.PathToTemplates, "ConversionServerConfig.xml");
		public override string PathToBasicConfig => Path.Combine(InstallationPath, "ConversionServer.xml");
		public override string BaselineSourcePath { get; set; } = Path.Combine(Properties.PathToCodeTree, "ConversionServer");
		public override string DeploymentPackageDirectoryName { get; set; } = "ConversionServer";
		#endregion

		#region Implementing ApplyPackage
		public override void ApplyPackage(Package package)
		{
			if (package == null)
			{
				throw new ArgumentNullException(nameof(package));
			}

			TransformationUtil.ApplyTransformations(this, BaseFileSystem.CombinePaths(package.PathToDeploymentPackage, package.RelativePathToTransformations));
			package.ApplyToConversionComponent(this);
		}

		public override void HealthCheck()
		{
			ValidationHelper.CheckHostAvailability(ServerName);
		}
		#endregion
	}
}
