using DeploymentProcedure.Utility.FileSystem.Base;
using System.Collections.Generic;

namespace DeploymentProcedure.Utility.FileSystem
{
	internal partial class FileSystemFactory
	{
		private static IDictionary<string, IFileSystem> _usedFileSystems = new Dictionary<string, IFileSystem>
		{
			{ BaseFileSystem.LocalServerName, new LocalFileSystem(BaseFileSystem.LocalServerName) }
		};

		internal static IFileSystem Local => _usedFileSystems[BaseFileSystem.LocalServerName];

		internal static IFileSystem GetFileSystem(string serverName)
		{
			if (_usedFileSystems.ContainsKey(serverName))
			{
				return _usedFileSystems[serverName];
			}
			else if (BaseFileSystem.IsLocalMachine(serverName))
			{
				return Local;
			}
			else
			{
				ServerFileSystem serverFileSystem = new ServerFileSystem(serverName);
				_usedFileSystems.Add(serverName, serverFileSystem);
				return serverFileSystem;
			}
		}
	}
}
