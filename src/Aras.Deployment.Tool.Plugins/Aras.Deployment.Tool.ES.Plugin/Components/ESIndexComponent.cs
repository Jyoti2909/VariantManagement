using Aras.Deployment.Tool.StandardPlugin.Components;
using Aras.Deployment.Tool.Core.Installers;
using Aras.Deployment.Tool.Core.Components.Type;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Xml.Serialization;

namespace Aras.Deployment.Tool.ES.Plugin.Components
{
	[XmlType("esIndex")]
	public class ESIndexComponent : WindowsServiceComponent
	{
		public string ESSolrUrl { get; set; }
		public string ESAIClusterUrl { get; set; }
		public string ESSolrAdminLogin { get; set; }
		public SecretString ESSolrAdminPassword { get; set; } = new SecretString() { Value = "innovator" };
		public string ESSolrCollectionLogin { get; set; }
		public string ESSolrCollectionName { get; set; }
		public SecretString ESSolrCollectionPassword { get; set; } = new SecretString() { Value = "innovator" };

		protected override IReadOnlyCollection<IInstaller> CreateInstallers()
		{
			return new ReadOnlyCollection<IInstaller>(null);
		}
	}
}
