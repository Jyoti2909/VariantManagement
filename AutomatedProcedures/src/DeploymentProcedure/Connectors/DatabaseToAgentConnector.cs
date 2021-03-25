using DeploymentProcedure.Components;
using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Connectors.Base;
using DeploymentProcedure.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using System.Xml.Serialization;

namespace DeploymentProcedure.Connectors
{
	[XmlType("database2agent")]
	public class DatabaseToAgentConnector : BaseConnector
	{
		[XmlAttribute("database")]
		public string DatabaseComponentId { get; set; }
		[XmlAttribute("agent")]
		public string AgentComponentId { get; set; }

		public override void Connect(IReadOnlyCollection<Component> instanceComponents)
		{
			Logger.Instance.Log(LogLevel.Info, "\nConfiguring component ({0}) to work with component({1}):\n", DatabaseComponentId, AgentComponentId);

			DatabaseComponent databaseComponent = instanceComponents.Single(c => c.Id == DatabaseComponentId) as DatabaseComponent;
			AgentComponent agentComponent = instanceComponents.Single(c => c.Id == AgentComponentId) as AgentComponent;

			SetupConversionTasksForAgentService(agentComponent, databaseComponent);
			agentComponent.TargetFileSystem.XmlHelper.XmlPoke(agentComponent.PathToConfig, "/configuration/appSettings/add[@key='InnovatorServer']/@value", databaseComponent.InnovatorServerAspxUrl);
		}

		private void SetupConversionTasksForAgentService(AgentComponent agentComponent, DatabaseComponent databaseComponent)
		{
			XmlDocument conversionConfig = agentComponent.TargetFileSystem.XmlHelper.OpenDocument(agentComponent.PathToConversionConfig);

			foreach (XmlNode cycleNode in conversionConfig.SelectNodes("/configuration/Innovator/Conversion/ProcessingCycles/cycle"))
			{
				XmlNode dbAttribute = cycleNode.SelectSingleNode("@DB");
				XmlNode userAttribute = cycleNode.SelectSingleNode("@User");
				XmlNode passwordAttribute = cycleNode.SelectSingleNode("@Password");

				Logger.Instance.Log(LogLevel.Info, "\tSetting the '{0}' value for @DB attribute for cycle element.", databaseComponent.DatabaseName);

				dbAttribute.InnerText = databaseComponent.DatabaseName;
				if (string.Equals(userAttribute.InnerText, "{user}", StringComparison.OrdinalIgnoreCase))
				{
					Logger.Instance.Log(LogLevel.Info, "\tSetting the '{0}' value for @User attribute for cycle element.", agentComponent.ConversionManagerUser);

					userAttribute.InnerText = agentComponent.ConversionManagerUser;
				}
				if (passwordAttribute != null && string.Equals(passwordAttribute.InnerText, "{password}", StringComparison.OrdinalIgnoreCase))
				{
					Logger.Instance.Log(LogLevel.Info, "\tSetting the '{0}' value for @Password attribute for cycle element.", agentComponent.ConversionManagerPassword);

					passwordAttribute.InnerText = agentComponent.ConversionManagerPassword;
				}
			}

			agentComponent.TargetFileSystem.XmlHelper.SaveXmlDocument(conversionConfig);
		}
	}
}
