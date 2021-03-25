using DeploymentProcedure.Logging;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.IO;
using System.Text;

namespace DeploymentProcedure.Utility
{
	internal static class EnvironmentHelper
	{
		internal static void ExpandEnvironmentVariablesInConfig(string pathToConfig, IFileSystem targetFileSystem)
		{
			Logger.Instance.Log(LogLevel.Info, "\tLooking for properties to replace in the '{0}' file ...", targetFileSystem.GetFullPath(pathToConfig));

			string configContents = targetFileSystem.ReadAllText(pathToConfig);
			string expandedConfigContents = Properties.ExpandEnvironmentVariables(configContents);
			if (!string.Equals(configContents, expandedConfigContents, StringComparison.OrdinalIgnoreCase))
			{
				targetFileSystem.WriteAllTextToFile(pathToConfig, expandedConfigContents);
			}

			Logger.Instance.Log(LogLevel.Info, "\tProperties replacement is complete.");
		}

		internal static Stream ExpandEnvironmentVariablesInConfig(Stream configInputStream)
		{
			Logger.Instance.Log(LogLevel.Info, "\tLooking for properties to replace in a stream ...");

			using (Stream configCopiedStream = new MemoryStream())
			{
				configInputStream.CopyTo(configCopiedStream);
				configInputStream.Seek(0, SeekOrigin.Begin);
				configCopiedStream.Seek(0, SeekOrigin.Begin);

				using (StreamReader reader = new StreamReader(configCopiedStream))
				{
					string configContents = reader.ReadToEnd();
					string expandedConfigContents = Properties.ExpandEnvironmentVariables(configContents);

					MemoryStream configOutputStream = null;
					if (!string.Equals(configContents, expandedConfigContents, StringComparison.OrdinalIgnoreCase))
					{
						byte[] byteArray = Encoding.UTF8.GetBytes(expandedConfigContents);
						configOutputStream = new MemoryStream(byteArray);
						configOutputStream.Flush();
						configOutputStream.Position = 0;
					}

					Logger.Instance.Log(LogLevel.Info, "\tProperties replacement is complete.");
					return configOutputStream ?? configInputStream;
				}
			}
		}
	}
}
