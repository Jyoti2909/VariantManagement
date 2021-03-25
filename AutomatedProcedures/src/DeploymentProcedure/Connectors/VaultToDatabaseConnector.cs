using Aras.IOM;
using DeploymentProcedure.Connectors.Base;
using DeploymentProcedure.Components;
using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Serialization;
using DeploymentProcedure.Components.Utility;
using System.Globalization;
using DeploymentProcedure.Exceptions;

namespace DeploymentProcedure.Connectors
{
	[XmlType("vault2database")]
	public class VaultToDatabaseConnector : BaseConnector
	{
		[XmlAttribute("vault")]
		public string VaultComponentId { get; set; }
		[XmlAttribute("database")]
		public string DatabaseComponentId { get; set; }

		public override void Connect(IReadOnlyCollection<Component> instanceComponents)
		{
			Logger.Instance.Log(LogLevel.Info, "\nConfiguring component ({0}) to work with component({1}):\n", VaultComponentId, DatabaseComponentId);

			VaultComponent vaultComponent = instanceComponents.Single(c => c.Id == VaultComponentId) as VaultComponent;
			DatabaseComponent databaseComponent = instanceComponents.Single(c => c.Id == DatabaseComponentId) as DatabaseComponent;

			HttpServerConnection connection = ServerConnectionFactory.GetServerConnection(databaseComponent);
			Innovator innovator = new Innovator(connection);

			Item vaultItem = innovator.newItem("Vault", "merge");
			vaultItem.setAttribute("where", string.Format(CultureInfo.InvariantCulture, "[name]='{0}'", vaultComponent.Name));
			vaultItem.setProperty("name", vaultComponent.Name);
			vaultItem.setProperty("vault_url_pattern", vaultComponent.VaultServerAspxUrl);
			vaultItem = vaultItem.apply();

			if (vaultItem.isError())
			{
				throw new ConnectException(
					string.Format(CultureInfo.InvariantCulture, "Couldn't connect vault component '{0}' with database '{1}'. {2}",
					VaultComponentId,
					DatabaseComponentId,
					vaultItem.ToString()));
			}

			vaultComponent.TargetFileSystem.XmlHelper.XmlPoke(vaultComponent.PathToConfig, "/configuration/appSettings/add[@key = 'InnovatorServerUrl']/@value", databaseComponent.InnovatorServerAspxUrl);
		}
	}
}
