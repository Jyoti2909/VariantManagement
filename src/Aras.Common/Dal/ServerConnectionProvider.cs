using Aras.IOM;

namespace Aras.Common
{
	public class ServerConnectionProvider : IServerConnectionProvider
	{
		private const int DefaultTimeout = 60 * 60 * 1000; //time in milliseconds

		public IServerConnection Get(string innovatorServerUrl, string database, string userName, string password)
		{
			HttpServerConnection connectionToRemote = IomFactory.CreateHttpServerConnection(
				innovatorServerUrl,
				database,
				userName,
				password
			);

			connectionToRemote.Timeout = DefaultTimeout;

			return connectionToRemote;
		}
	}
}