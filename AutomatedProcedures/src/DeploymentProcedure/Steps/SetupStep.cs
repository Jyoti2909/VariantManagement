using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Logging;
using DeploymentProcedure.Steps.Base;
using DeploymentProcedure.Utility;
using DeploymentProcedure.Utility.FileSystem;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Xml.Serialization;

namespace DeploymentProcedure.Steps
{
	[XmlType("setup")]
	public class SetupStep : BaseStep
	{
		private IList<string> _componentsIdList;

		[XmlAttribute("components")]
		public string ComponentsIds { get; set; }

		public IList<string> ComponentsIdList => _componentsIdList ?? (_componentsIdList = ComponentsIds.Split(new char[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries));

		public bool ContainsComponent(string componentId)
		{
			return ComponentsIdList.Contains(componentId);
		}

		public override void Execute(IReadOnlyCollection<Component> instanceComponents)
		{
			if (instanceComponents == null)
			{
				throw new ArgumentNullException(nameof(instanceComponents));
			}

			ReadOnlyCollection<Component> componentsForSetup = Array.AsReadOnly(instanceComponents.Where(c => ComponentsIdList.Contains(c.Id)).ToArray());

			foreach (Component component in componentsForSetup)
			{
				component.RunPreSetupValidation();
			}

			Logger.Instance.Log(LogLevel.Info, "\nGenerating OAuth certificates:\n");

			OAuthCertificatesManager oAuthCertificatesManager = new OAuthCertificatesManager(
				FileSystemFactory.Local,
				componentsForSetup,
				"Aras Innovator",
				DateTime.Now.AddYears(5));

			oAuthCertificatesManager.GenerateCertificates();

			foreach (Component component in componentsForSetup)
			{
				component.Setup();
			}
		}
	}
}
