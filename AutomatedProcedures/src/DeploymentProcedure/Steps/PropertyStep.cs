using DeploymentProcedure.Steps.Base;
using System;
using System.Collections.Generic;
using System.Xml.Serialization;
using DeploymentProcedure.Components.Base;

namespace DeploymentProcedure.Steps
{
	[XmlType("property")]
	public class PropertyStep : BaseStep
	{
		[XmlAttribute("name")]
		public string Name { get; set; } = string.Empty;
		[XmlAttribute("value")]
		public string Value { get; set; } = string.Empty;

		public override void Execute(IReadOnlyCollection<Component> instanceComponents)
		{
			Environment.SetEnvironmentVariable(Name, Value);
		}
	}
}
