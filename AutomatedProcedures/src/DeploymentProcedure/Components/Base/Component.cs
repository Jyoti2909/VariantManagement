using DeploymentProcedure.Logging;
using DeploymentProcedure.Packages.Base;
using System;
using System.Xml.Serialization;

namespace DeploymentProcedure.Components.Base
{
	public abstract class Component
	{
		[XmlAttribute("id")]
		public string Id { get; set; } = Guid.NewGuid().ToString("N");
		[XmlAttribute("depends")]
		public string DependsOn { get; set; } = string.Empty;

		#region Implementing Setup logic
		public virtual void RunPreSetupValidation()
		{
			Logger.Instance.Log(LogLevel.Info, "\nRunning validation before setup ({0}):\n", Id);
		}

		public virtual void Setup()
		{
			Logger.Instance.Log(LogLevel.Info, "\nSetting up component ({0}):\n", Id);
		}
		#endregion

		#region Implementing Cleanup logic
		public abstract void Remove();
		#endregion

		#region Implementing ApplyPackage
		public abstract void ApplyPackage(Package package);

		public abstract void HealthCheck();
		#endregion 

		#region Implementing Backup logic
		public virtual void Backup(string pathToBackupDir)
		{
			Logger.Instance.Log(LogLevel.Info, "\nBackup component ({0}):\n", Id);
		}
		#endregion
	}
}
