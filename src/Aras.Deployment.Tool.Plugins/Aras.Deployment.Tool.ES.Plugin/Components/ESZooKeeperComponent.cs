using Aras.Deployment.Tool.Core.Installers;
using Aras.Deployment.Tool.StandardPlugin.Components;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Xml.Serialization;

namespace Aras.Deployment.Tool.ES.Plugin.Components
{
	[XmlType("esZookeeper")]
	public class ESZooKeeperComponent : WindowsServiceComponent
	{
		protected override IReadOnlyCollection<IInstaller> CreateInstallers()
		{
			return new ReadOnlyCollection<IInstaller>(null);
		}
	}
}
