using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Logging;
using DeploymentProcedure.Serialization;
using DeploymentProcedure.Steps.Base;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Xml;
using System.Xml.Serialization;
using DeploymentProcedure.Utility;
using DeploymentProcedure.Utility.FileSystem;
using DeploymentProcedure.Components;

namespace DeploymentProcedure
{
	public class Instance
	{
		private List<Component> _sortedByDependencyComponents;
		
		[XmlAttribute("configVersion")]
		public string ConfigVersion { get; set; } = "1.0";

		public Collection<Component> Components { get; set; }

		[XmlIgnore]
		public IReadOnlyCollection<Component> ComponentsInOrderOfDependency
		{
			get
			{
				if (_sortedByDependencyComponents == null)
				{
					_sortedByDependencyComponents = new List<Component>();

					HashSet<string> visited = new HashSet<string>();
					foreach (Component component in Components)
					{
						TopologicalSort(component, visited, _sortedByDependencyComponents);
					}
				}

				return _sortedByDependencyComponents;
			}
		}

		public Collection<BaseStep> Steps { get; set; }

		#region Implementing Deploy logic
		public void Deploy()
		{
			foreach (BaseStep step in Steps)
			{
				step.Execute(ComponentsInOrderOfDependency);
			}

			PrintInstanceUrls();
		}
		#endregion

		#region Implementing Cleanup logic
		public void Remove()
		{
			foreach (Component component in ComponentsInOrderOfDependency)
			{
				try
				{
					component.Remove();
				}
				catch
				{
					Logger.Instance.Log(LogLevel.Warning, "Cannot remove {0} component because it doesn't respond to health check.", component.Id);
				}
			}
		}
		#endregion

		#region Impementing Backup logic
		public void Backup()
		{
			FileSystemFactory.Local.CreateDirectory(Properties.PathToBackupFolder);

			HashSet<Type> alreadyBackedUpComponents = new HashSet<Type>();
			foreach (var component in Components)
			{
				if (alreadyBackedUpComponents.Add(component.GetType()))
				{
					component.Backup(Properties.PathToBackupFolder);
				}
			}
		}
		#endregion

		private void TopologicalSort(Component component, HashSet<string> visited, List<Component> sortedByDependencyComponents)
		{
			if (visited.Add(component.Id))
			{
				string[] dependencyNames = component.DependsOn.Split(new char[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries);
				foreach (string dependencyName in dependencyNames)
				{
					TopologicalSort(Components.Single(c => c.Id == dependencyName), visited, sortedByDependencyComponents);
				}

				sortedByDependencyComponents.Add(component);
			}
		}

		private void PrintInstanceUrls()
		{
			Logger.Instance.Log(LogLevel.Info, "\n\nPrint.Url.Of.Installed.Innovator:\n");
			Logger.Instance.Log(LogLevel.Info, "********************************************************************************");

			HashSet<string> printedUrls = new HashSet<string>();
			foreach (Component component in Components)
			{
				DatabaseComponent databaseComponent = component as DatabaseComponent;
				if (databaseComponent != null && printedUrls.Add(databaseComponent.InnovatorUrl))
				{
					Logger.Instance.Log(LogLevel.Info, "URL of configured Innovator is: {0}", databaseComponent.InnovatorUrl);
				}
			}

			Logger.Instance.Log(LogLevel.Info, "********************************************************************************");
		}

		public static Instance FromXml(string pathToConfig)
		{
			using (XmlReader xmlReader = XmlReader.Create(pathToConfig))
			{
				InstanceXmlSerializer serializer = new InstanceXmlSerializer(typeof(Instance));
				return serializer.Deserialize(xmlReader) as Instance;
			}
		}
	}
}
