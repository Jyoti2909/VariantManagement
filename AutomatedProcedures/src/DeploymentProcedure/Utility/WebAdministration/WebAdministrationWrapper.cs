using DeploymentProcedure.Utility.WebAdministration.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using DeploymentProcedure.Components.Type;
using Microsoft.Web.Administration;
using DeploymentProcedure.Logging;

namespace DeploymentProcedure.Utility.WebAdministration
{
	internal class WebAdministrationWrapper : IWebAdministration
	{
		public void SetupApplication(string serverName, string siteName, string virtualDirectoryName, string apppoolName, string physicalPath)
		{
			using (ServerManager serverManager = ServerManager.OpenRemote(serverName))
			{
				Application app = serverManager.Sites[siteName].Applications[virtualDirectoryName];
				if (app != null)
				{
					Logger.Instance.Log(LogLevel.Info, "\tRemoving '{0}' application from '{1}'...", virtualDirectoryName, serverName);

					serverManager.Sites[siteName].Applications.Remove(app);
				}

				Logger.Instance.Log(LogLevel.Info, "\tCreaing new '{0}' application with '{1}' application pool.", virtualDirectoryName, apppoolName);

				app = serverManager.Sites[siteName].Applications.Add(virtualDirectoryName, physicalPath);
				app.ApplicationPoolName = apppoolName;

				serverManager.CommitChanges();

				Logger.Instance.Log(LogLevel.Info, "\tChanges were commited.");
			}
		}

		public void SetupApplicationPool(string serverName, string apppoolName, string managedRuntimeVersion, string managedPipelineMode, string appPoolUser, SecretString appPoolUserPassword)
		{
			using (ServerManager serverManager = ServerManager.OpenRemote(serverName))
			{
				ApplicationPool appPool = serverManager.ApplicationPools[apppoolName];
				if (appPool == null)
				{
					Logger.Instance.Log(LogLevel.Info, "\tCreating new '{0}' application pool on '{1}'...", apppoolName, serverName);

					appPool = serverManager.ApplicationPools.Add(apppoolName);
				}
				else
				{
					Logger.Instance.Log(LogLevel.Info, "\tRecycling '{0}' application pool on '{1}'...", apppoolName, serverName);

					appPool.Recycle();
				}

				Logger.Instance.Log(LogLevel.Info, "\tSetting up '{0}' managed runtime version and '{1}' managed pipeline mode '{2}' application pool.",
					managedRuntimeVersion, managedPipelineMode, apppoolName);

				appPool.ManagedRuntimeVersion = managedRuntimeVersion;
				appPool.ManagedPipelineMode = ParseManagedPipelineMode(managedPipelineMode);


				if (!string.IsNullOrEmpty(appPoolUser) && appPoolUserPassword != null)
				{
					Logger.Instance.Log(LogLevel.Info, "\tSetting up '{0}' user for '{1}' application pool.", appPoolUser, apppoolName);

					appPool.ProcessModel.IdentityType = ProcessModelIdentityType.SpecificUser;
					appPool.ProcessModel.UserName = appPoolUser;
					appPool.ProcessModel.Password = appPoolUserPassword.Value;
				}

				serverManager.CommitChanges();

				Logger.Instance.Log(LogLevel.Info, "\tChanges were commited.");
			}
		}

		public void SetupWinAuth(string serverName, string locationPath)
		{
			using (ServerManager serverManager = ServerManager.OpenRemote(serverName))
			{
				Configuration config = serverManager.GetApplicationHostConfiguration();

				ConfigurationSection anonymousAuthenticationSection = config.GetSection("system.webServer/security/authentication/anonymousAuthentication", locationPath);
				anonymousAuthenticationSection["enabled"] = false;

				ConfigurationSection windowsAuthenticationSection = config.GetSection("system.webServer/security/authentication/windowsAuthentication", locationPath);
				windowsAuthenticationSection["enabled"] = true;

				serverManager.CommitChanges();
			}
		}

		public void RemoveApplicationPoolWithApplications(string serverName, string apppoolName)
		{
			using (ServerManager serverManager = ServerManager.OpenRemote(serverName))
			{
				foreach (Site site in serverManager.Sites)
				{
					List<Application> applicationsToRemoveList = site.Applications.Where(app => app.ApplicationPoolName.Equals(apppoolName)).ToList();
					foreach (Application applicationToRemove in applicationsToRemoveList)
					{
						Logger.Instance.Log(LogLevel.Info, "\tRemoving '{0}' application '{1}'...", applicationToRemove.Path, serverName);

						site.Applications.Remove(applicationToRemove);

					}
				}

				List<ApplicationPool> applicationPoolsToRemoveList = serverManager.ApplicationPools.Where(apppool => apppool.Name.Equals(apppoolName)).ToList();
				foreach (ApplicationPool applicationPoolToRemove in applicationPoolsToRemoveList)
				{
					Logger.Instance.Log(LogLevel.Info, "\tRemoving '{0}' application pool '{1}'...", applicationPoolToRemove.Name, serverName);

					serverManager.ApplicationPools.Remove(applicationPoolToRemove);

				}

				serverManager.CommitChanges();
			}
		}

		public void RemoveWinAuth(string serverName, string locationPath)
		{
			using (ServerManager serverManager = ServerManager.OpenRemote(serverName))
			{
				Configuration config = serverManager.GetApplicationHostConfiguration();

				config.RemoveLocationPath(locationPath);
				serverManager.CommitChanges();
			}
		}

		private static ManagedPipelineMode ParseManagedPipelineMode(string managedPipelineModeString)
		{
			return (ManagedPipelineMode)Enum.Parse(typeof(ManagedPipelineMode), managedPipelineModeString);
		}
	}
}
