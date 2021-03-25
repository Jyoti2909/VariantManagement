using Aras.IOM;
using Aras.Deployment.Tool.StandardPlugin.Utility.FileSystem;
using Aras.Deployment.Tool.ES.Plugin.Components;
using Aras.Deployment.Tool.Core.Components;
using Aras.Deployment.Tool.StandardPlugin.Components;
using Aras.Deployment.Tool.Core.Connectors;
using Aras.Deployment.Tool.Core.Logging;
using Aras.Deployment.Tool.StandardPlugin.Utility;
using Aras.Deployment.Tool.Core.Exceptions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Xml.Serialization;
using System.Globalization;

namespace Aras.Deployment.Tool.ES.Plugin.Connectors
{
	[XmlType("es2database")]
	public class EnterpriseSearchToDatabaseConnector : BaseConnector
	{
		[XmlAttribute("esAgent")]
		public string ESAgentComponentId { get; set; }
		[XmlAttribute("esIndex")]
		public string ESIndexComponentId { get; set; }
		[XmlAttribute("esZookeeper")]
		public string ESZookeeperComponentId { get; set; }
		[XmlAttribute("esFileprocessor")]
		public string ESFileProcessorComponentId { get; set; }
		[XmlAttribute("database")]
		public string DatabaseComponentId { get; set; }

		public override void Connect(IReadOnlyCollection<Component> instanceComponents)
		{
			Logger.Instance.Log(LogLevel.Info, "\nConfiguring components ({0}, {1}, {2}, {3}) to work with component({4}):\n", ESAgentComponentId, ESIndexComponentId, ESZookeeperComponentId, ESFileProcessorComponentId, DatabaseComponentId);

			ESAgentComponent esAgent = instanceComponents.Single(c => c.Id == ESAgentComponentId) as ESAgentComponent;
			ESIndexComponent esIndex = instanceComponents.Single(c => c.Id == ESIndexComponentId) as ESIndexComponent;
			ESZooKeeperComponent esZooKeeper = instanceComponents.Single(c => c.Id == ESZookeeperComponentId) as ESZooKeeperComponent;
			ESFileProcessorComponent esFileProcessor = instanceComponents.Single(c => c.Id == ESFileProcessorComponentId) as ESFileProcessorComponent;
			DatabaseComponent databaseComponent = instanceComponents.Single(c => c.Id == DatabaseComponentId) as DatabaseComponent;

			DropSolrIndex(esIndex);

			string serviceNameXPath = "/configuration/ServiceName";

			esFileProcessor.ServiceName = FileSystemFactory.GetFileSystem(esFileProcessor.ServerName).XmlHelper.XmlPeek(esFileProcessor.PathToConfig, serviceNameXPath);
			WindowsServiceHelper.StopService(esFileProcessor.ServerName, esFileProcessor.ServiceName);

			esAgent.ServiceName = FileSystemFactory.GetFileSystem(esAgent.ServerName).XmlHelper.XmlPeek(esAgent.PathToConfig, serviceNameXPath);
			WindowsServiceHelper.StopService(esAgent.ServerName, esAgent.ServiceName);

			esIndex.ServiceName = FileSystemFactory.GetFileSystem(esIndex.ServerName).XmlHelper.XmlPeek(esIndex.PathToConfig, serviceNameXPath);
			WindowsServiceHelper.StopService(esIndex.ServerName, esIndex.ServiceName);

			esZooKeeper.ServiceName = FileSystemFactory.GetFileSystem(esZooKeeper.ServerName).XmlHelper.XmlPeek(esZooKeeper.PathToConfig, serviceNameXPath);
			WindowsServiceHelper.StopService(esZooKeeper.ServerName, esZooKeeper.ServiceName);

			//Wait Until services are stopped for 30 seconds
			Thread.Sleep(30000);

			HttpServerConnection connection = IomFactory.CreateHttpServerConnection(databaseComponent.InnovatorUrl, databaseComponent.DatabaseName, databaseComponent.LoginOfRootInnovatorUser, databaseComponent.PasswordOfRootInnovatorUser.Value);
			try
			{
				connection.Login();

				Innovator innovator = new Innovator(connection);

				EditVariable(innovator, "ES_SolrUrl", esIndex.ESAIClusterUrl);
				EditVariable(innovator, "ES_AIClusterUrl", esIndex.ESAIClusterUrl);
				EditCryptoPwd(innovator, esAgent);
			}
			finally
			{
				connection.Logout();
			}

			UpdateESZooKeeperServiceConfig(esZooKeeper, databaseComponent);
			WindowsServiceHelper.StartService(esZooKeeper.ServerName, esZooKeeper.ServiceName);

			UpdateESIndexServiceConfig(esIndex, databaseComponent);
			WindowsServiceHelper.StartService(esIndex.ServerName, esIndex.ServiceName);

			UpdateESAgentServiceConfig(esAgent, databaseComponent);
			WindowsServiceHelper.StartService(esAgent.ServerName, esAgent.ServiceName);

			UpdateESFileProcessorServiceConfig(esFileProcessor, databaseComponent);
			WindowsServiceHelper.StartService(esFileProcessor.ServerName, esFileProcessor.ServiceName);

			ReloadSolrCollection(esIndex);
		}

		private static void EditVariable(Innovator innovator, string variableName, string variableValue)
		{
			EditPropertyForItem(innovator,
				"Variable",
				string.Format(CultureInfo.InvariantCulture, "[name]='{0}'", variableName),
				"value",
				variableValue);
		}

		private static void EditCryptoPwd(Innovator innovator, ESAgentComponent esAgent)
		{
			EditPropertyForItem(innovator,
				"ES_Agent",
				string.Format(CultureInfo.InvariantCulture, "[agent_name]='{0}'", esAgent.Name),
				"crypto_pwd",
				esAgent.CryptoPwd.Value);
		}

		private static void EditPropertyForItem(Innovator innovator, string itemTypeName, string whereClause, string propertyName, string propertyValue)
		{
			Item item = innovator.newItem(itemTypeName, "edit");
			item.setAttribute("where", whereClause);
			item.setProperty(propertyName, propertyValue);
			item = item.apply();

			if (item.isError())
			{
				throw new CommonException(item.ToString());
			}
		}

		private static void UpdateESZooKeeperServiceConfig(ESZooKeeperComponent esZooKeeper, DatabaseComponent databaseComponent)
		{
			string innovatorUrlXPath = "/configuration/ArasInnovatorURL";
			string innovatorDBPath = "/configuration/ArasInnovatorDB";

			IFileSystem targetFileSystem = FileSystemFactory.GetFileSystem(esZooKeeper.ServerName);

			targetFileSystem.XmlHelper.XmlPoke(esZooKeeper.PathToConfig, innovatorUrlXPath, databaseComponent.InnovatorUrl);
			targetFileSystem.XmlHelper.XmlPoke(esZooKeeper.PathToConfig, innovatorDBPath, databaseComponent.DatabaseName);
		}

		private static void UpdateESIndexServiceConfig(ESIndexComponent esIndex, DatabaseComponent databaseComponent)
		{
			string innovatorUrlXPath = "/configuration/ArasInnovatorURL";
			string innovatorDBPath = "/configuration/ArasInnovatorDB";

			IFileSystem targetFileSystem = FileSystemFactory.GetFileSystem(esIndex.ServerName);

			targetFileSystem.XmlHelper.XmlPoke(esIndex.PathToConfig, innovatorUrlXPath, databaseComponent.InnovatorUrl);
			targetFileSystem.XmlHelper.XmlPoke(esIndex.PathToConfig, innovatorDBPath, databaseComponent.DatabaseName);
		}

		private static void UpdateESAgentServiceConfig(ESAgentComponent esAgent, DatabaseComponent databaseComponent)
		{
			string innovatorUrlXPath = "/configuration/Aras_Innovator_URL";
			string innovatorDBPath = "/configuration/Aras_Innovator_DB";

			IFileSystem targetFileSystem = FileSystemFactory.GetFileSystem(esAgent.ServerName);

			targetFileSystem.XmlHelper.XmlPoke(esAgent.PathToConfig, innovatorUrlXPath, databaseComponent.InnovatorUrl);
			targetFileSystem.XmlHelper.XmlPoke(esAgent.PathToConfig, innovatorDBPath, databaseComponent.DatabaseName);
		}

		private static void UpdateESFileProcessorServiceConfig(ESFileProcessorComponent esFileProcessor, DatabaseComponent databaseComponent)
		{
			string innovatorUrlXPath = "/configuration/FileProcessor/ArasInnovatorURL";
			string innovatorDBPath = "/configuration/FileProcessor/ArasInnovatorDB";

			IFileSystem targetFileSystem = FileSystemFactory.GetFileSystem(esFileProcessor.ServerName);

			targetFileSystem.XmlHelper.XmlPoke(esFileProcessor.PathToConfig, innovatorUrlXPath, databaseComponent.InnovatorUrl);
			targetFileSystem.XmlHelper.XmlPoke(esFileProcessor.PathToConfig, innovatorDBPath, databaseComponent.DatabaseName);
		}

		private static void DropSolrIndex(ESIndexComponent esIndex)
		{
			const string indexDropQuery = "update?commit=true&stream.body=<delete><query>*%3A*</query></delete>";

			Uri esDropIndexSolrCollectionUrl = new Uri(string.Format(CultureInfo.InvariantCulture, 
				"{0}/{1}/{2}",
				esIndex.ESSolrUrl.TrimEnd('/'),
				esIndex.ESSolrCollectionName,
				indexDropQuery));

			CreateHttpRequest(esDropIndexSolrCollectionUrl, esIndex.ESSolrCollectionLogin, esIndex.ESSolrCollectionPassword.Value)
				.GetResponse();
		}

		private static HttpWebRequest CreateHttpRequest(Uri uri, string login, string password)
		{
			HttpWebRequest webRequest = WebRequest.CreateHttp(uri);
			webRequest.Credentials = new NetworkCredential(login, password);

			return webRequest;
		}

		private static void ReloadSolrCollection(ESIndexComponent esIndex)
		{
			const string reloadCollectionQuery = "admin/collections?action=RELOAD&name=";

			Uri esDropIndexSolrCollectionUrl = new Uri(string.Format(CultureInfo.InvariantCulture, 
				"{0}/{1}{2}",
				esIndex.ESSolrUrl.TrimEnd('/'),
				reloadCollectionQuery,
				esIndex.ESSolrCollectionName));
			Uri esDropIndexSolrCollectionQueueUrl = new Uri(string.Format(CultureInfo.InvariantCulture, 
				"{0}/{1}{2}",
				esIndex.ESSolrUrl.TrimEnd('/'),
				reloadCollectionQuery,
				esIndex.ESSolrCollectionName + "_QUEUE"));

			HttpWebRequest reloadCollectionRequest = WebRequest.CreateHttp(esDropIndexSolrCollectionUrl);
			reloadCollectionRequest.Credentials = new NetworkCredential(esIndex.ESSolrAdminLogin, esIndex.ESSolrAdminPassword.Value);

			SendRetriableWebRequest(
				CreateHttpRequest(esDropIndexSolrCollectionUrl, esIndex.ESSolrAdminLogin, esIndex.ESSolrAdminPassword.Value),
				15000,
				3);

			CreateHttpRequest(esDropIndexSolrCollectionQueueUrl, esIndex.ESSolrAdminLogin, esIndex.ESSolrAdminPassword.Value)
				.GetResponse();
		}

		private static void SendRetriableWebRequest(HttpWebRequest webRequest, int millisecondDelayBeforeAttempt, int maxAttempts)
		{
			int attemptCount = 0;
			AggregateException aggregateException = new AggregateException();

			do
			{
				Thread.Sleep(millisecondDelayBeforeAttempt);
				try
				{
					webRequest.GetResponse();
					return;
				}
				catch (WebException webException)
				{
					attemptCount++;
					aggregateException.InnerExceptions.Append(webException);
				}
			} while (attemptCount < maxAttempts);

			throw aggregateException;
		}

		public override void PreConnectValidation(IReadOnlyCollection<Component> instanceComponents)
		{
			// TODO: Validate ES before connector execution
		}
	}
}
