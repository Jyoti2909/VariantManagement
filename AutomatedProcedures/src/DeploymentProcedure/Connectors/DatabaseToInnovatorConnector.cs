using DeploymentProcedure.Connectors.Base;
using DeploymentProcedure.Components;
using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Serialization;
using System.Globalization;

namespace DeploymentProcedure.Connectors
{
	[XmlType("database2innovator")]
	public class DatabaseToInnovatorConnector : BaseConnector
	{
		[XmlAttribute("database")]
		public string DatabaseComponentId { get; set; }
		[XmlAttribute("innovator")]
		public string InnovatorComponentId { get; set; }

		public override void Connect(IReadOnlyCollection<Component> instanceComponents)
		{
			Logger.Instance.Log(LogLevel.Info, "\nConfiguring component ({0}) to work with component({1}):\n", DatabaseComponentId, InnovatorComponentId);

			DatabaseComponent databaseComponent = instanceComponents.Single(c => c.Id == DatabaseComponentId) as DatabaseComponent;
			InnovatorComponent innovatorComponent = instanceComponents.Single(c => c.Id == InnovatorComponentId) as InnovatorComponent;

			innovatorComponent.TargetFileSystem.XmlHelper.AppendFragment(
				GetDBConnectionString(databaseComponent),
				innovatorComponent.TargetFileSystem.XmlHelper.GetNode(innovatorComponent.PathToConfig, "/Innovator"));
		}

		private string GetDBConnectionString(DatabaseComponent databaseComponent)
		{
			const string dbConnectionTemplate = "<DB-Connection dbType=\"SQL Server\" provider=\"MSDASQL\" driver=\"{{SQL Server}}\" id=\"{0}\" server=\"{1}\" database=\"{2}\" dbo_uid=\"{3}\" dbo_pwd=\"{4}\" regular_uid=\"{5}\" regular_pwd=\"{6}\" />";
			return string.Format(
				CultureInfo.InvariantCulture, 
				dbConnectionTemplate,
				databaseComponent.DatabaseName,
				databaseComponent.SqlServer,
				databaseComponent.DatabaseName,
				databaseComponent.InnovatorLogin,
				databaseComponent.InnovatorPassword.Value,
				databaseComponent.InnovatorRegularLogin,
				databaseComponent.InnovatorRegularPassword.Value);
		}
	}
}
