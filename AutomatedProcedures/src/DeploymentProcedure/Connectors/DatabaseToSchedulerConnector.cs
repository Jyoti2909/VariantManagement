using DeploymentProcedure.Components;
using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Connectors.Base;
using DeploymentProcedure.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using System.Xml.Serialization;
using DeploymentProcedure.Components.Type;

namespace DeploymentProcedure.Connectors
{
	[XmlType("database2scheduler")]
	public class DatabaseToSchedulerConnector : BaseConnector
	{
		[XmlAttribute("database")]
		public string DatabaseComponentId { get; set; }
		[XmlAttribute("scheduler")]
		public string SchedulerComponentId { get; set; }
		public string SchedulerManagerUser { get; set; } = "admin";
		public SecretString SchedulerManagerPassword { get; set; } = new SecretString() { Value = "innovator" };

		public override void Connect(IReadOnlyCollection<Component> instanceComponents)
		{
			Logger.Instance.Log(LogLevel.Info, "\nConfiguring component ({0}) to work with component({1}):\n", DatabaseComponentId, SchedulerComponentId);

			DatabaseComponent databaseComponent = instanceComponents.Single(c => c.Id == DatabaseComponentId) as DatabaseComponent;
			SchedulerComponent schedulerComponent = instanceComponents.Single(c => c.Id == SchedulerComponentId) as SchedulerComponent;

			XmlDocument innovatorServiceConfig = schedulerComponent.TargetFileSystem.XmlHelper.OpenDocument(schedulerComponent.PathToConfig);

			XmlNodeList innovatorNodes = innovatorServiceConfig.SelectNodes("/innovators/innovator");
			for (int i = 0; i < innovatorNodes.Count; i++)
			{
				XmlNode innovatorNode = innovatorNodes[i];

				XmlNode serverNode = innovatorNode.SelectSingleNode("server");
				XmlNode databaseNode = innovatorNode.SelectSingleNode("database");
				XmlNode usernameNode = innovatorNode.SelectSingleNode("username");
				XmlNode passwordNode = innovatorNode.SelectSingleNode("password");

				Logger.Instance.Log(LogLevel.Info, "\tSetting the '{0}' value for innovator[{1}]/server node.", databaseComponent.InnovatorUrl, i);

				serverNode.InnerText = databaseComponent.InnovatorUrl;

				Logger.Instance.Log(LogLevel.Info, "\tSetting the '{0}' value for innovator[{1}]/database node.", databaseComponent.DatabaseName, i);

				databaseNode.InnerText = databaseComponent.DatabaseName;

				if (string.Equals(usernameNode.InnerText, "{user}", StringComparison.OrdinalIgnoreCase))
				{
					Logger.Instance.Log(LogLevel.Info, "\tSetting the '{0}' value for innovator[{1}]/username node.", SchedulerManagerUser, i);

					usernameNode.InnerText = SchedulerManagerUser;
				}

				if (string.Equals(passwordNode.InnerText, "{password}", StringComparison.OrdinalIgnoreCase))
				{
					Logger.Instance.Log(LogLevel.Info, "\tSetting the '{0}' value for innovator[{1}]/password node.", SchedulerManagerPassword.Value, i);

					passwordNode.InnerText = SchedulerManagerPassword.Value;
				}
			}

			schedulerComponent.TargetFileSystem.XmlHelper.SaveXmlDocument(innovatorServiceConfig);
		}
	}
}
