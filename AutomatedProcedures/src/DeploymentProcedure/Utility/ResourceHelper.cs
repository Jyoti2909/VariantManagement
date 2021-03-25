using System;
using System.IO;
using System.Linq;
using System.Reflection;

namespace DeploymentProcedure.Utility
{
	internal static class ResourceHelper
	{
		internal static string RetrieveResource(string resourceName)
		{
			Assembly currentAssembly = Assembly.GetExecutingAssembly();
			string restoreDatabaseResourceName = currentAssembly.GetManifestResourceNames()
				.Single(str => str.EndsWith(resourceName, StringComparison.OrdinalIgnoreCase));
			using (Stream stream = currentAssembly.GetManifestResourceStream(restoreDatabaseResourceName))
			using (StreamReader reader = new StreamReader(stream))
			{
				return reader.ReadToEnd();
			}
		}
	}
}
