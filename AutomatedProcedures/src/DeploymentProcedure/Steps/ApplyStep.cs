using DeploymentProcedure.Packages;
using DeploymentProcedure.Packages.Base;
using DeploymentProcedure.Steps.Base;
using System.Collections.Generic;
using System.Xml.Serialization;
using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Logging;
using System.Collections.ObjectModel;
using System;

namespace DeploymentProcedure.Steps
{
	[XmlType("apply")]
	public class ApplyStep : BaseStep
	{
		[XmlElement("aupackage", typeof(ArasUpdatePackage))]
		[XmlElement("package", typeof(UsualCRTPackage))]
		public Collection<Package> Packages { get; set; }

		public override void Execute(IReadOnlyCollection<Component> instanceComponents)
		{
			if (instanceComponents == null)
			{
				throw new ArgumentNullException(nameof(instanceComponents));
			}

			Logger.Instance.Log(LogLevel.Info, "Running the health check of all components...\n");

			foreach (Component component in instanceComponents)
			{
				component.HealthCheck();
			}

			foreach (Package package in Packages)
			{
				foreach (Component component in package.GetFilteredInstanceComponents(instanceComponents))
				{
					component.ApplyPackage(package);
				}
			}
		}
	}
}
