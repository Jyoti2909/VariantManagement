using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Exceptions;
using DeploymentProcedure.Logging;
using DeploymentProcedure.Packages.Base;
using DeploymentProcedure.Steps;
using DeploymentProcedure.Steps.Base;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace DeploymentProcedure.Utility
{
	internal class InstanceConfigValidator
	{
		internal static void Validate(Instance instance)
		{
			Logger.Instance.Log(LogLevel.Info, "Validating Instance config:\n");

			ValidateComponents(instance);
			ValidateSteps(instance);
		}

		private static void ValidateComponents(Instance instance)
		{
			ValidateIds(instance);
			ValidateDependencies(instance);
		}

		private static void ValidateIds(Instance instance)
		{
			Logger.Instance.Log(LogLevel.Info, "Validating components ids");

			foreach (IGrouping<string, Component> group in instance.Components.GroupBy(c => c.Id))
			{
				int groupCount = group.Count();
				if (groupCount > 1)
				{
					throw new Exception(string.Format(CultureInfo.InvariantCulture, "Instance cannot contain multiple components with the same id. There are {0} components with '{1}' id.", groupCount, group.Key));
				}
			}

			Logger.Instance.Log(LogLevel.Info, "OK");
		}

		private static void ValidateDependencies(Instance instance)
		{
			Logger.Instance.Log(LogLevel.Info, "Validating components dependencies");

			ISet<string> componentIdSet = new HashSet<string>(instance.Components.Select(c => c.Id));
			foreach (Component component in instance.Components)
			{
				string[] dependencyNames = component.DependsOn.Split(new char[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries);
				foreach (string dependencyId in dependencyNames)
				{
					if (!componentIdSet.Contains(dependencyId))
					{
						throw new ValidationException(string.Format(CultureInfo.InvariantCulture, "Component '{0}' depends on non-existent component '{1}'. Check 'dependsOn' attribute of '{0}' component.", component.Id, dependencyId));
					}
				}
			}

			Logger.Instance.Log(LogLevel.Info, "OK");
		}

		private static void ValidateSteps(Instance instance)
		{
			foreach (BaseStep step in instance.Steps)
			{
				Type stepType = step.GetType();
				if (stepType == typeof(ApplyStep))
				{
					ValidateApplyStep(instance, step as ApplyStep);
				}
				else if (stepType == typeof(SetupStep))
				{
					ValidateSetupStep(instance, step as SetupStep);
				}
			}
		}

		private static void ValidateApplyStep(Instance instance, ApplyStep applyStep)
		{
			Logger.Instance.Log(LogLevel.Info, "Validating apply step");

			ISet<string> componentIdSet = new HashSet<string>(instance.Components.Select(c => c.Id));
			foreach (Package package in applyStep.Packages)
			{
				string[] componentIdsToApplyPackage = package.ApplyToComponents.Split(new char[] { ',', ';', ' ' }, StringSplitOptions.RemoveEmptyEntries);
				foreach (string componentIdToApplyPackage in componentIdsToApplyPackage)
				{
					if (!componentIdSet.Contains(componentIdToApplyPackage))
					{
						throw new ValidationException(string.Format(CultureInfo.InvariantCulture, "Component '{0}', where package should be applied, was not found in the <components>...</components> section.", componentIdToApplyPackage));
					}
				}
			}

			Logger.Instance.Log(LogLevel.Info, "OK");
		}

		private static void ValidateSetupStep(Instance instance, SetupStep setupStep)
		{
			Logger.Instance.Log(LogLevel.Info, "Validating setup step");

			ISet<string> componentIdSet = new HashSet<string>(instance.Components.Select(c => c.Id));
			foreach (string componentIdToSetup in setupStep.ComponentsIdList)
			{
				if (!componentIdSet.Contains(componentIdToSetup))
				{
					throw new ValidationException(string.Format(CultureInfo.InvariantCulture, "Component '{0}', which should be setup, was not found in the <components>...</components> section.", componentIdToSetup));
				}
			}

			Logger.Instance.Log(LogLevel.Info, "OK");
		}
	}
}
