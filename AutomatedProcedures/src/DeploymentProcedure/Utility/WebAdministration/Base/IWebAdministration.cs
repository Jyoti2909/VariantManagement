using DeploymentProcedure.Components.Type;

namespace DeploymentProcedure.Utility.WebAdministration.Base
{
	public interface IWebAdministration
	{
		void SetupApplication(string serverName, string siteName, string virtualDirectoryName, string apppoolName, string physicalPath);
		void SetupApplicationPool(string serverName, string apppoolName, string managedRuntimeVersion, string managedPipelineMode, string appPoolUser, SecretString appPoolUserPassword);
		void SetupWinAuth(string serverName, string locationPath);
		void RemoveApplicationPoolWithApplications(string serverName, string apppoolName);
		void RemoveWinAuth(string serverName, string locationPath);
	}
}
