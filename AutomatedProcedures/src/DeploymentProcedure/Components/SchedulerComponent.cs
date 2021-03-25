using DeploymentProcedure.Packages.Base;
using DeploymentProcedure.Utility;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.Globalization;
using System.IO;
using System.Xml;
using System.Xml.Serialization;

namespace DeploymentProcedure.Components
{
	[XmlType("scheduler")]
	public class SchedulerComponent : WindowsServiceComponent
	{
		#region Overriding CodeTreeComponent properties
		public override string PathToExecutable => Path.Combine(InstallationPath, "InnovatorService.exe");
		public override string PathToCodeTreeTemplates => Path.Combine(Properties.PathToTemplates, "Scheduler");
		public override string PathToConfig => Path.Combine(InstallationPath, "InnovatorServiceConfig.xml");
		public override string PathToConfigTemplate => Path.Combine(PathToCodeTreeTemplates, "InnovatorServiceConfig.xml");
		public override string BaselineSourcePath { get; set; } = Path.Combine(Properties.PathToCodeTree, "Scheduler");
		public override string DeploymentPackageDirectoryName { get; set; } = "Scheduler";
		#endregion

		#region Implementing Setup logic
		public override void Setup()
		{
			base.Setup();

			TransferJobs(LocalFileSystem.GetFullPath(PathToConfigTemplate), TargetFileSystem.GetFullPath(PathToConfig));
		}

		private void TransferJobs(string pathToSourceInnovatorServiceConfig, string pathToTargetInnovatorServiceConfig)
		{
			const string templateInnovatorSectionXPath = "//innovator[{0}]";
			const string templateInnovatorSectionAllJobsXPath = "//innovator[{0}]/job";
			const string templateInnovatorSectionJobXPath = "//innovator[{0}]/job[method='{1}']";

			XmlDocument sourceInnovatorServiceConfig = new XmlDocument();
			XmlDocument targetInnovatorServiceConfig = new XmlDocument();
			sourceInnovatorServiceConfig.Load(pathToSourceInnovatorServiceConfig);
			targetInnovatorServiceConfig.Load(pathToTargetInnovatorServiceConfig);

			int innovatorSectionsAmount = sourceInnovatorServiceConfig.SelectNodes("//innovator").Count;
			for (int innovatorSectionIndex = 1; innovatorSectionIndex <= innovatorSectionsAmount; innovatorSectionIndex++)
			{
				XmlNodeList sourceConfigJobs =
					sourceInnovatorServiceConfig.SelectNodes(string.Format(CultureInfo.InvariantCulture, templateInnovatorSectionAllJobsXPath, innovatorSectionIndex));
				XmlNode targetConfigInnovatorSection =
					targetInnovatorServiceConfig.SelectSingleNode(string.Format(CultureInfo.InvariantCulture, templateInnovatorSectionXPath, innovatorSectionIndex));
				foreach (XmlNode sourceConfigJob in sourceConfigJobs)
				{
					string sourceConfigJobMethodName = sourceConfigJob.SelectSingleNode("./method").InnerText;
					XmlNode targetConfigJob =
						targetInnovatorServiceConfig.SelectSingleNode(string.Format(CultureInfo.InvariantCulture, templateInnovatorSectionJobXPath, innovatorSectionIndex, sourceConfigJobMethodName));

					if (targetConfigJob == null)
					{
						targetConfigJob = targetInnovatorServiceConfig.ImportNode(sourceConfigJob, true);
						targetConfigInnovatorSection.AppendChild(targetConfigJob);
					}
				}
			}

			targetInnovatorServiceConfig.Save(pathToTargetInnovatorServiceConfig);
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
			package.ApplyToSchedulerComponent(this);
		}
		#endregion
	}
}
