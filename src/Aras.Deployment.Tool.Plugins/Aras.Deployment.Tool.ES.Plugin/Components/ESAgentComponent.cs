using Aras.Deployment.Tool.StandardPlugin.Components;
using Aras.Deployment.Tool.Core.Installers;
using Aras.Deployment.Tool.Core.Components.Type;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Xml.Serialization;

namespace Aras.Deployment.Tool.ES.Plugin.Components
{
	[XmlType("esAgent")]
	public class ESAgentComponent : WindowsServiceComponent
	{
		public SecretString CryptoPwd { get; set; } = new SecretString() { Value = "innovator" };
		public string Name { get; set; } = "ES Agent";

		protected override IReadOnlyCollection<IInstaller> CreateInstallers()
		{
			return new ReadOnlyCollection<IInstaller>(null);
		}
	}
}
