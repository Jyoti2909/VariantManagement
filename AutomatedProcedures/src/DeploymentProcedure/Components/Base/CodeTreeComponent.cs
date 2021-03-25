using DeploymentProcedure.Logging;
using DeploymentProcedure.Utility;
using DeploymentProcedure.Utility.FileSystem;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.IO;
using System.Text;
using System.Xml.Serialization;
using Ionic.Zip;

namespace DeploymentProcedure.Components.Base
{
	public abstract class CodeTreeComponent : Component
	{
		[XmlIgnore]
		internal IFileSystem LocalFileSystem => FileSystemFactory.Local;
		[XmlIgnore]
		internal IFileSystem TargetFileSystem => FileSystemFactory.GetFileSystem(ServerName);

		public string InstallationPath { get; set; }

		public virtual string BaselineSourcePath { get; set; }
		public virtual string DeploymentPackageDirectoryName { get; set; }
		public virtual bool IsOAuthPublicCertificateRequired { get; set; }
		public virtual string OAuthCertificateName { get; set; }
		public virtual string OAuthCertificatesTemplateDir { get; set; }
		public virtual string OAuthConfigTemplateFile { get; set; }
		public virtual string OAuthConfigCertificatePasswordXpath { get; set; }
		public virtual string OAuthCertificatePassword { get; set; }
		public string ServerName { get; set; } = InitializeServerNameFromEnvironment() ?? "localhost";
		public virtual string PathToCodeTreeTemplates { get; }
		public virtual string PathToConfig { get; set; }
		public virtual string PathToConfigTemplate { get; }
		public virtual string PathToBasicConfig { get; }

		#region Implementing Setup logic
		public override void RunPreSetupValidation()
		{
			base.RunPreSetupValidation();

			ValidationHelper.CheckHostAvailability(ServerName);
			ValidationHelper.CheckWritePermissionsToDirectory(TargetFileSystem, InstallationPath);
		}

		public override void Setup()
		{
			base.Setup();

			LocalFileSystem.CopyDirectory(BaselineSourcePath, TargetFileSystem, InstallationPath);
			SetupConfig();
			SetupCodeTreeTemplates(PathToCodeTreeTemplates);
		}

		public void SetupCodeTreeTemplates(string pathToCodeTreeTemplates)
		{
			if (LocalFileSystem.DirectoryExists(pathToCodeTreeTemplates))
			{
				LocalFileSystem.CopyDirectory(pathToCodeTreeTemplates, TargetFileSystem, InstallationPath);

				IEnumerable<string> configFileTemplatess = LocalFileSystem.EnumerateFiles(pathToCodeTreeTemplates, recursive: true);
				foreach (string configFileTemplate in configFileTemplatess)
				{
					string configRelativePath = BaseFileSystem.GetRelativePath(LocalFileSystem, pathToCodeTreeTemplates, configFileTemplate);
					string configPath = BaseFileSystem.CombinePaths(InstallationPath, configRelativePath);
					EnvironmentHelper.ExpandEnvironmentVariablesInConfig(configPath, TargetFileSystem);
				}
			}
		}

		protected void SetupConfigFromTemplate(string pathToConfig, string pathToTemplate)
		{
			if (LocalFileSystem.FileExists(pathToTemplate))
			{
				if (!TargetFileSystem.FileExists(pathToConfig))
				{
					Logger.Instance.Log(LogLevel.Info, "\tCreating config '{0}' from '{1}' template",
						TargetFileSystem.GetFullPath(pathToConfig),
						LocalFileSystem.GetFullPath(pathToTemplate));

					LocalFileSystem.CopyFile(pathToTemplate, TargetFileSystem, pathToConfig, true);
				}

				EnvironmentHelper.ExpandEnvironmentVariablesInConfig(pathToConfig, TargetFileSystem);
			}
		}

		protected void SetupNtfsPermissionsToFolder(string pathToFolder)
		{
			if (!TargetFileSystem.DirectoryExists(pathToFolder))
			{
				TargetFileSystem.CreateDirectory(pathToFolder);
			}

			ProcessWrapper.Execute("icacls", "\"{0}\" /grant *S-1-5-11:(OI)(CI)(M)", TargetFileSystem.GetFullPath(pathToFolder));
		}

		private void SetupConfig()
		{
			Logger.Instance.Log(LogLevel.Info, "\nSetting up config for component ({0}):\n", Id);

			SetupConfigFromTemplate(PathToConfig, PathToConfigTemplate);

			if (!string.IsNullOrEmpty(PathToBasicConfig))
			{
				Logger.Instance.Log(LogLevel.Info, "\tCreating basic config '{0}'",
					TargetFileSystem.GetFullPath(PathToBasicConfig));

				string configContent = string.Format(CultureInfo.InvariantCulture, "<ConfigFilePath value=\"{0}\" />", PathToConfig);
				TargetFileSystem.WriteAllTextToFile(PathToBasicConfig, configContent);
			}
		}
		#endregion

		#region Implementing Cleanup logic
		public override void Remove()
		{
			if (TargetFileSystem.FileExists(PathToConfig))
			{
				TargetFileSystem.DeleteFile(PathToConfig);
			}

			if (TargetFileSystem.DirectoryExists(InstallationPath)
				&& !string.Equals(LocalFileSystem.GetFullPath(BaselineSourcePath), TargetFileSystem.GetFullPath(InstallationPath), StringComparison.OrdinalIgnoreCase))
			{
				try
				{
					TargetFileSystem.DeleteDirectory(InstallationPath);
				}
				catch (UnauthorizedAccessException)
				{
					foreach (System.Diagnostics.Process p in Win32ProcessHelper.GetProcessesLockingFile(GetUnremovedFile(InstallationPath)))
					{
						Console.WriteLine("File is locked by Process(ID: {0}, NAME: {1}). Killing the process to unlock files", p.Id, p.ProcessName);
						if (!p.WaitForExit(1000))
						{
							Win32ProcessHelper.TerminateProcess(p);
							p.WaitForExit(5000);
						}
					}

					TargetFileSystem.DeleteDirectory(InstallationPath);
				}
			}
		}

		private string GetUnremovedFile(string dir)
		{
			foreach (string subdir in TargetFileSystem.EnumerateDirectories(dir))
			{
				return GetUnremovedFile(subdir);
			}

			return TargetFileSystem.EnumerateFiles(dir).FirstOrDefault();
		}
		#endregion

		#region Implementing ApplyPackage
		public override void HealthCheck()
		{
			ValidationHelper.CheckHostAvailability(ServerName);
			ValidationHelper.CheckDirectoryExistence(TargetFileSystem, InstallationPath);
			ValidationHelper.CheckWritePermissionsToDirectory(TargetFileSystem, InstallationPath);
		}
		#endregion

		#region Impementing Backup logic
		public override void Backup(string pathToBackupDir)
		{
			base.Backup(pathToBackupDir);

			string pathToCodeTreeArchive = BaseFileSystem.CombinePaths(pathToBackupDir, "CodeTree.zip");
			using (ZipFile zipFile = new ZipFile(pathToCodeTreeArchive, Encoding.UTF8))
			{
				zipFile.AddDirectory(InstallationPath, Path.GetFileName(InstallationPath));
				zipFile.Save();
			}
		}
		#endregion

		private static string InitializeServerNameFromEnvironment()
		{
			string urlOfDeploymentServer = Environment.GetEnvironmentVariable("Url.Of.Deployment.Server");
			return !string.IsNullOrEmpty(urlOfDeploymentServer) ? new Uri(urlOfDeploymentServer).Host : null;
		}
	}
}
