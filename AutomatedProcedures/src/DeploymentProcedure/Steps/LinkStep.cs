using DeploymentProcedure.Connectors.Base;
using DeploymentProcedure.Steps.Base;
using System.Collections.Generic;
using System.Xml.Serialization;
using DeploymentProcedure.Components.Base;
using System.Collections.ObjectModel;

namespace DeploymentProcedure.Steps
{
	[XmlType("link")]
	public class LinkStep : BaseStep
	{
		public Collection<BaseConnector> Connectors { get; set; }

		public override void Execute(IReadOnlyCollection<Component> instanceComponents)
		{
			foreach (BaseConnector connector in Connectors)
			{
				connector.Connect(instanceComponents);
			}
		}
	}
}
