using DeploymentProcedure.Connectors.Base;
using DeploymentProcedure.Components;
using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Serialization;

namespace DeploymentProcedure.Connectors
{
	[XmlType("agent2innovator")]
	public class AgentToInnovatorConnector : BaseConnector
	{
		[XmlAttribute("agent")]
		public string AgentComponentId { get; set; }
		[XmlAttribute("innovator")]
		public string InnovatorComponentId { get; set; }

		public override void Connect(IReadOnlyCollection<Component> instanceComponents)
		{
			Logger.Instance.Log(LogLevel.Info, "\nConfiguring component ({0}) to work with component({1}):\n", AgentComponentId, InnovatorComponentId);

			AgentComponent agentComponent = instanceComponents.Single(c => c.Id == AgentComponentId) as AgentComponent;
			InnovatorComponent innovatorComponent = instanceComponents.Single(c => c.Id == InnovatorComponentId) as InnovatorComponent;

			innovatorComponent.TargetFileSystem.XmlHelper.XmlPoke(innovatorComponent.PathToConfig, "/Innovator/AgentService/@InnovatorToServiceAddress", agentComponent.Url);
		}
	}
}
