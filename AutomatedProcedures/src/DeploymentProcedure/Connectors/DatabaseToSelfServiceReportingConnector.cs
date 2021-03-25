using DeploymentProcedure.Components;
using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Connectors.Base;
using DeploymentProcedure.Logging;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Xml.Serialization;

namespace DeploymentProcedure.Connectors
{
	[XmlType("database2ssr")]
	public class DatabaseToSelfServiceReportingConnector : BaseConnector
	{
		[XmlAttribute("database")]
		public string DatabaseComponentId { get; set; }
		[XmlAttribute("ssr")]
		public string SelfServiceReportingComponentId { get; set; }

		public override void Connect(IReadOnlyCollection<Component> instanceComponents)
		{
			Logger.Instance.Log(LogLevel.Info, "\nConfiguring component ({0}) to work with component({1}):\n", DatabaseComponentId, SelfServiceReportingComponentId);

			DatabaseComponent databaseComponent = instanceComponents.Single(c => c.Id == DatabaseComponentId) as DatabaseComponent;
			SelfServiceReportingComponent selfServiceReportingComponent = instanceComponents.Single(c => c.Id == SelfServiceReportingComponentId) as SelfServiceReportingComponent;

			selfServiceReportingComponent.TargetFileSystem.XmlHelper.AppendFragment(
				GetConnectionString(databaseComponent),
				selfServiceReportingComponent.TargetFileSystem.XmlHelper.GetNode(selfServiceReportingComponent.PathToConfig,
				"/configuration/connectionStrings/add/@connectionString"));
			selfServiceReportingComponent.TargetFileSystem.XmlHelper.AppendFragment(
				databaseComponent.DatabaseName, 
				selfServiceReportingComponent.TargetFileSystem.XmlHelper.GetNode(selfServiceReportingComponent.PathToConfig,
				"/configuration/connectionStrings/add/@name"));
			selfServiceReportingComponent.TargetFileSystem.XmlHelper.XmlPoke(
				selfServiceReportingComponent.PathToConfig,
				"/configuration/appSettings/add[@key = 'inn_server_url']/@value",
				databaseComponent.InnovatorServerAspxUrl);
		}

		private string GetConnectionString(DatabaseComponent databaseComponent)
		{
			const string dbConnectionTemplate = "Data Source={0};Initial Catalog={1};Persist Security Info=True;Pooling=False;User ID={2};Password={3};";
			return string.Format(
				CultureInfo.InvariantCulture, 
				dbConnectionTemplate,
				databaseComponent.SqlServer,
				databaseComponent.DatabaseName,
				databaseComponent.InnovatorLogin,
				databaseComponent.InnovatorPassword.Value);
		}
	}
}
