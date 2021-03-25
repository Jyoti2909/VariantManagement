using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Logging;
using DeploymentProcedure.Packages.Base;
using DeploymentProcedure.Utility;
using System;
using System.Threading;
using System.Xml.Serialization;

namespace DeploymentProcedure.Components
{
	[XmlType("service")]
	public class WindowsServiceComponent : CodeTreeComponent
	{
		public string ServiceName { get; set; }
		public virtual string PathToExecutable { get; set; }
		public string StartMode { get; set; } = "demand";
		public string DisplayServiceName { get; set; }
		public bool DoStartOnSetup { get; set; }

		#region Implementing Setup logic
		public override void Setup()
		{
			StopWindowsService();

			base.Setup();

			SetupWindowsService();
			if (DoStartOnSetup)
			{
				StartWindowsService();
			}
		}
		#endregion

		#region Implementing Cleanup logic
		public override void Remove()
		{
			Logger.Instance.Log(LogLevel.Info, "\nRemoving component ({0}):\n", Id);

			RemoveWindowsService();

			base.Remove();
		}
		#endregion

		#region Implementing ApplyPackage
		public override void HealthCheck()
		{
			base.HealthCheck();

			ValidationHelper.CheckServiceAvailability(ServerName, ServiceName);
		}

		public override void ApplyPackage(Package package)
		{
			if (package == null)
			{
				throw new ArgumentNullException(nameof(package));
			}

			package.ApplyToWindowsServiceComponent(this);
		}
		#endregion

		#region Common methods
		private void SetupWindowsService()
		{
			ProcessWrapper.Execute("sc", "\\\\{0} create \"{1}\" binPath= \"{2}\" start= \"{3}\" DisplayName= \"{4}\"", ServerName, ServiceName, PathToExecutable, StartMode, DisplayServiceName);
		}

		private void RemoveWindowsService()
		{
			StopWindowsService();

			ProcessWrapper.Execute("sc", "\\\\{0} delete \"{1}\"", ServerName, ServiceName);
		}

		public void StopWindowsService()
		{
			if (ProcessWrapper.Execute("sc", "\\\\{0} stop \"{1}\"", ServerName, ServiceName) == 0)
			{
				Thread.Sleep(30000);
			}
		}

		public void StartWindowsService()
		{
			ProcessWrapper.Execute("sc", "\\\\{0} start \"{1}\"", ServerName, ServiceName);
		}
		#endregion
	}
}
