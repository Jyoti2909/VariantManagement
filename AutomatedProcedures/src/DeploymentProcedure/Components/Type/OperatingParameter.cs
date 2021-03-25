using System.Globalization;
using System.Xml.Serialization;

namespace DeploymentProcedure.Components.Type
{
	public class OperatingParameter
	{
		[XmlAttribute("key")]
		public string Key { get; set; }
		[XmlAttribute("value")]
		public string Value { get; set; }

		public string ToXml => string.Format(CultureInfo.InvariantCulture, "<operating_parameter key=\"{0}\" value=\"{1}\" />", Key, Value);
	}
}
