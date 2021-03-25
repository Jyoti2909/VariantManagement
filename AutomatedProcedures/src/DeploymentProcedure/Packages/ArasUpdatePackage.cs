using DeploymentProcedure.Packages.Base;
using System;
using DeploymentProcedure.Components;
using DeploymentProcedure.Utility;
using System.Xml.Serialization;
using System.Collections.Generic;
using DeploymentProcedure.Components.Base;
using System.Reflection;
using DeploymentProcedure.Logging;
using System.Globalization;
using DeploymentProcedure.Components.Type;
using System.IO;
using System.Linq;

namespace DeploymentProcedure.Packages
{
	public class ArasUpdatePackage : Package
	{
		private static readonly Dictionary<Type, string> _componentToModuleMapping = new Dictionary<Type, string>
		{
			{ typeof(AgentComponent), "AG" },
			{ typeof(ConversionComponent), "CS" },
			{ typeof(DatabaseComponent), "DB" },
			{ typeof(InnovatorComponent), "IS" },
			{ typeof(OAuthComponent), "OAS" },
			{ typeof(SchedulerComponent), "SC" },
			{ typeof(SelfServiceReportingComponent), "SSR" },
			{ typeof(VaultComponent), "VS" }
		};

		private static readonly Dictionary<string, string> _commonProperties = new Dictionary<string, string>
		{
			{ "Path.To.IOM.dll", Path.Combine(Directory.GetParent(Properties.PathToArasUpdateCmd).FullName, "IOM.dll") },
			{ "Path.To.Language.Tool", Path.GetFullPath(Properties.PathToLanguageTool) }
		};

		[XmlAttribute("name")]
		public string PackageName { get; set; } = string.Empty;

		public override void ApplyToAgentComponent(AgentComponent agentComponent)
		{
			if (HasSomethingToDeploy(agentComponent))
			{
				RunArasUpdateCmdForComponent(agentComponent);
			}
		}

		public override void ApplyToConversionComponent(ConversionComponent conversionComponent)
		{
			if (HasSomethingToDeploy(conversionComponent))
			{
				RunArasUpdateCmdForComponent(conversionComponent);
			}
		}

		public override void ApplyToDatabaseComponent(DatabaseComponent databaseComponent)
		{
			Dictionary<string, string> propertyNameMapper = new Dictionary<string, string>
			{
				{ nameof(databaseComponent.InnovatorUrl), "Innovator.URL" },
				{ nameof(databaseComponent.DatabaseName), "Innovator.DB" },
				{ nameof(databaseComponent.LoginOfRootInnovatorUser), "Innovator.Username" },
				{ nameof(databaseComponent.PasswordOfRootInnovatorUser), "Innovator.Password" },
				{ nameof(databaseComponent.PreAmlDeploymentScriptsDirectoryName), "Pre.Aml.Deployment.Scripts.Name" },
				{ nameof(databaseComponent.PostAmlDeploymentScriptsDirectoryName), "Post.Aml.Deployment.Scripts.Name" },
				{ nameof(databaseComponent.SqlServer), "Server" },
				{ nameof(databaseComponent.InnovatorLogin), "Language.Pack.Innovator.Username" },
				{ nameof(databaseComponent.InnovatorPassword), "Language.Pack.Innovator.Password" }
			};

			const string pathToLanguagePackKey = "Path.To.Language.Packs";
			_commonProperties.Add(pathToLanguagePackKey, Path.Combine(PathToDeploymentPackage, databaseComponent.LanguagePacksDirectoryName));
			RunArasUpdateCmdForComponent(databaseComponent, propertyNameMapper);
			_commonProperties.Remove(pathToLanguagePackKey);
		}

		public override void ApplyToInnovatorComponent(InnovatorComponent innovatorComponent)
		{
			if (HasSomethingToDeploy(innovatorComponent))
			{
				RunArasUpdateCmdForComponent(innovatorComponent);
			}
		}

		public override void ApplyToOAuthComponent(OAuthComponent oauthComponent)
		{
			if (HasSomethingToDeploy(oauthComponent))
			{
				RunArasUpdateCmdForComponent(oauthComponent);
			}
		}

		public override void ApplyToSchedulerComponent(SchedulerComponent schedulerComponent)
		{
			if (HasSomethingToDeploy(schedulerComponent))
			{
				RunArasUpdateCmdForComponent(schedulerComponent);
			}
		}

		public override void ApplyToSelfServiceReportingComponent(SelfServiceReportingComponent selfServiceReportingComponent)
		{
			if (HasSomethingToDeploy(selfServiceReportingComponent))
			{
				RunArasUpdateCmdForComponent(selfServiceReportingComponent);
			}
		}

		public override void ApplyToVaultComponent(VaultComponent vaultComponent)
		{
			if (HasSomethingToDeploy(vaultComponent))
			{
				RunArasUpdateCmdForComponent(vaultComponent);
			}
		}

		public override void ApplyToWebComponent(WebComponent webComponent)
		{
			throw new NotImplementedException();
		}

		public override void ApplyToWindowsServiceComponent(WindowsServiceComponent windowsServiceComponent)
		{
			throw new NotImplementedException();
		}

		private void RunArasUpdateCmdForComponent(Component component, Dictionary<string, string> propertyNameMapper = null)
		{
			Logger.Instance.Log(LogLevel.Info, "\nDeploying component ({0}):\n", component.Id);

			if (ProcessWrapper.Execute(Properties.PathToArasUpdateCmd, ObtainArasUpdateCmdArguments(component, propertyNameMapper)) != 0)
			{
				throw new Exception(string.Format(CultureInfo.InvariantCulture, "Failed to apply Aras Update package to component({0}).", component.Id));
			}
		}

		private string ConvertPropertiesToArasUpdateCmdArguments(Component component, Dictionary<string, string> propertyNameMapper)
		{
			List<string> componentProperties = new List<string>();
			foreach (PropertyInfo property in component.GetType().GetProperties())
			{
				string propertyValueString = null;
				if (property.PropertyType == typeof(string))
				{
					object propertyValue = property.GetValue(component);
					propertyValueString = propertyValue == null ? string.Empty : propertyValue.ToString();
				}
				else if (property.PropertyType == typeof(SecretString))
				{
					SecretString secretProperty = property.GetValue(component) as SecretString;
					propertyValueString = secretProperty?.Value;
				}

				if (propertyValueString != null)
				{
					componentProperties.Add(string.Format("-D:{0}=\"{1}\"",
						propertyNameMapper != null && propertyNameMapper.ContainsKey(property.Name)
						? propertyNameMapper[property.Name]
						: property.Name,
						propertyValueString));
				}
			}

			return string.Join(" ", componentProperties);
		}

		private string GetArasUpdateModuleName(Component component)
		{
			string moduleName;
			if (!_componentToModuleMapping.TryGetValue(component.GetType(), out moduleName))
			{
				Logger.Instance.Log(LogLevel.Warning, "\nAras.Update cannot apply this component ({0}):\n", component.Id);
				moduleName = component.GetType().Name.Replace("Component", string.Empty).ToUpperInvariant();
			}

			return moduleName;
		}

		private string ObtainArasUpdateCmdArguments(Component component, Dictionary<string, string> propertyNameMapper)
		{
			if (string.IsNullOrEmpty(PackageName))
			{
				throw new ArgumentNullException(nameof(PackageName));
			}

			if (string.IsNullOrEmpty(PathToDeploymentPackage))
			{
				throw new ArgumentNullException(nameof(PathToDeploymentPackage));
			}

			return string.Format("install {0} -logLevel:2 -modules:{1} -path:\"{2}\" {3}",
				PackageName,
				GetArasUpdateModuleName(component),
				PathToDeploymentPackage,
				string.Format("{0} {1}",
					ConvertPropertiesToArasUpdateCmdArguments(component, propertyNameMapper),
					string.Join(" ", _commonProperties.Select(x => $"-D:{x.Key}=\"{x.Value}\"").ToArray())));
		}
	}
}
