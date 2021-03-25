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
	[XmlType("conversion2database")]
	public class ConversionToDatabaseConnector : BaseConnector
	{
		[XmlAttribute("conversion")]
		public string ConversionComponentId { get; set; }
		[XmlAttribute("database")]
		public string DatabaseComponentId { get; set; }

		public override void Connect(IReadOnlyCollection<Component> instanceComponents)
		{
			Logger.Instance.Log(LogLevel.Info, "\nConfiguring component ({0}) to work with component({1}):\n", ConversionComponentId, DatabaseComponentId);

			ConversionComponent conversionComponent = instanceComponents.Single(c => c.Id == ConversionComponentId) as ConversionComponent;
			DatabaseComponent databaseComponent = instanceComponents.Single(c => c.Id == DatabaseComponentId) as DatabaseComponent;

			HttpServerConnection connection = ServerConnectionFactory.GetServerConnection(databaseComponent);
			Innovator innovator = new Innovator(connection);

			Item conversionItem = innovator.newItem("ConversionServer", "merge");
			conversionItem.setAttribute("where", string.Format(CultureInfo.InvariantCulture, "[name]='{0}'", conversionComponent.Name));
			conversionItem.setProperty("name", conversionComponent.Name);
			conversionItem.setProperty("url", conversionComponent.ConversionServiceAsmxUrl);
			conversionItem.setProperty("impersonation_user_id", "EB2D5AA617FB41A28F081345B8B5FECB");
			conversionItem = conversionItem.apply();

			if (conversionItem.isError())
			{
				throw new ConnectException(
					string.Format(CultureInfo.InvariantCulture, "Couldn't connect conversion component '{0}' with database '{1}'. {2}",
					ConversionComponentId,
					DatabaseComponentId,
					conversionItem.ToString()));
			}

			conversionComponent.TargetFileSystem.XmlHelper.XmlPoke(conversionComponent.PathToConfig, "/configuration/ConversionServer/InnovatorServer/@url", databaseComponent.InnovatorServerAspxUrl);
		}
	}
}
