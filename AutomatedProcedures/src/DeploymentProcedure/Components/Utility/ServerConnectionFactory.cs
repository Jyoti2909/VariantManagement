using Aras.IOM;
using System.Collections.Generic;

namespace DeploymentProcedure.Components.Utility
{
	internal class ServerConnectionFactory
	{
		private static ServerConnectionFactory _instance;

		private static ServerConnectionFactory Instance => _instance ?? (_instance = new ServerConnectionFactory());

		private IDictionary<string, HttpServerConnection> _usedServerConnections = new Dictionary<string, HttpServerConnection>();

		private ServerConnectionFactory()
		{
		}

		~ServerConnectionFactory()
		{
			foreach (HttpServerConnection serverConnection in _usedServerConnections.Values)
			{
				serverConnection.Logout();
			}
		}

		internal static HttpServerConnection GetServerConnection(DatabaseComponent databaseComponent)
		{
			if (Instance._usedServerConnections.ContainsKey(databaseComponent.Id))
			{
				return Instance._usedServerConnections[databaseComponent.Id];
			}

			HttpServerConnection serverConnection = IomFactory.CreateHttpServerConnection(
				databaseComponent.InnovatorUrl,
				databaseComponent.DatabaseName,
				databaseComponent.LoginOfRootInnovatorUser,
				databaseComponent.PasswordOfRootInnovatorUser.Value);
			serverConnection.Login();

			Instance._usedServerConnections.Add(databaseComponent.Id, serverConnection);

			return serverConnection;
		}
	}
}
