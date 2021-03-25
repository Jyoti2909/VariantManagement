using DeploymentProcedure.Logging;
using DeploymentProcedure.Steps.Base;
using System.Linq;
using System.Collections.Generic;
using System.Xml.Serialization;
using DeploymentProcedure.Components.Base;

namespace DeploymentProcedure.Steps
{
	[XmlType("configure")]
	public class ConfigureStep : BaseStep
	{
		[XmlAttribute("id")]
		public string ComponentId { get; set; } = string.Empty;
		[XmlAttribute("pathToTemplates")]
		public string PathToConfigTemplates { get; set; } = string.Empty;

		public override void Execute(IReadOnlyCollection<Component> instanceComponents)
		{
			CodeTreeComponent componentToConfigure = instanceComponents.OfType<CodeTreeComponent>().SingleOrDefault(c => c.Id == ComponentId);

			if (componentToConfigure != null)
			{
				Logger.Instance.Log(LogLevel.Info, "\tSetup configuration for '{0}' component", ComponentId);

				string pathToConfigTemplates = string.IsNullOrWhiteSpace(PathToConfigTemplates) ? componentToConfigure.PathToCodeTreeTemplates : PathToConfigTemplates;

				componentToConfigure.SetupCodeTreeTemplates(pathToConfigTemplates);
			}
		}
	}
}
