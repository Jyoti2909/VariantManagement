using Aras.IOM;

namespace Aras.Common
{
	public interface IServerConnectionProvider
	{
		IServerConnection Get(string innovatorServerUrl, string database, string userName, string password);
	}
}