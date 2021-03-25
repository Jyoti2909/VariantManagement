using System.Globalization;
using System.Xml.Serialization;

namespace DeploymentProcedure.Packages
{
	public class Variable
	{
		[XmlAttribute("id")]
		public virtual string Id { get; set; } = string.Empty;
		[XmlAttribute("name")]
		public virtual string Name { get; set; } = string.Empty;
		[XmlAttribute("value")]
		public virtual string Value { get; set; } = string.Empty;

		public string Aml
		{
			get
			{
				string amlTemplate = @"<AML><Item type='Variable' action='merge' id='{0}'>
<name>{1}</name>
<value>{2}</value>
</Item>
</AML>";
				return string.Format(CultureInfo.InvariantCulture, amlTemplate, Id, Name, Value);
			}
		}
	}
}
