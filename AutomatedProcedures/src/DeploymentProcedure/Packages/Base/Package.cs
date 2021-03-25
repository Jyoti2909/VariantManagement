using DeploymentProcedure.Components;
using DeploymentProcedure.Components.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Serialization;

namespace DeploymentProcedure.Packages.Base
{
	public abstract class Package
	{
		[XmlAttribute("applyTo")]
		public string ApplyToComponents { get; set; } = string.Empty;
		public string PathToDeploymentPackage { get; set; }
		public string RelativePathToTransformations { get; set; } = "TransformationsOfConfigFiles";

		public abstract void ApplyToAgentComponent(AgentComponent agentComponent);
		public abstract void ApplyToDatabaseComponent(DatabaseComponent databaseComponent);
		public abstract void ApplyToConversionComponent(ConversionComponent conversionComponent);
		public abstract void ApplyToInnovatorComponent(InnovatorComponent innovatorComponent);
		public abstract void ApplyToOAuthComponent(OAuthComponent oauthComponent);
		public abstract void ApplyToSchedulerComponent(SchedulerComponent schedulerComponent);
		public abstract void ApplyToSelfServiceReportingComponent(SelfServiceReportingComponent selfServiceReportingComponent);
		public abstract void ApplyToVaultComponent(VaultComponent vaultComponent);
		public abstract void ApplyToWebComponent(WebComponent webComponent);
		public abstract void ApplyToWindowsServiceComponent(WindowsServiceComponent windowsServiceComponent);

		internal IReadOnlyCollection<Component> GetFilteredInstanceComponents(IReadOnlyCollection<Component> instanceComponents)
		{
			if (!string.IsNullOrEmpty(ApplyToComponents))
			{
				string[] applyToComponentsIds = ApplyToComponents.Split(new char[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries);
				return instanceComponents.Where(c => applyToComponentsIds.Contains(c.Id)).ToList();
			}
			else
			{
				return instanceComponents;
			}
		}

		protected bool HasSomethingToDeploy(CodeTreeComponent codeTreeComponent)
		{
			string deploymentPackageSourcePath = Utility.FileSystem.Base.
				BaseFileSystem.CombinePaths(PathToDeploymentPackage, codeTreeComponent.DeploymentPackageDirectoryName);
			if (codeTreeComponent.LocalFileSystem.DirectoryExists(deploymentPackageSourcePath))
			{
				return true;
			}

			Logging.Logger.Instance.Log(Logging.LogLevel.Info, "\tNothing found to deploy to component ({0}):\n", codeTreeComponent.Id);
			return false;
		}

	}
}
