using System;
using System.Xml.Serialization;

namespace DeploymentProcedure.Components.Type
{
	public class SecretString
	{
		private string _value;

		[XmlAttribute("type")]
		public SecretStringType SecretType { get; set; } = SecretStringType.Plaintext;

		[XmlText]
		public string Value
		{
			get
			{
				switch (SecretType)
				{
					case SecretStringType.Plaintext:
						return _value;
					case SecretStringType.EnvironmentVariable:
						return Environment.GetEnvironmentVariable(_value);
					default:
						return null;
				}
			}
			set
			{
				_value = value;
			}
		}
	}
}
