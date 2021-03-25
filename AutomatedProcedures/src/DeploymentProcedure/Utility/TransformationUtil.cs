using DeploymentProcedure.Components.Base;
using DeploymentProcedure.Exceptions;
using DeploymentProcedure.Logging;
using DeploymentProcedure.Utility.FileSystem.Base;
using Microsoft.VisualStudio.Jdt;
using Microsoft.Web.XmlTransform;
using System.Collections.Generic;
using System.IO;

namespace DeploymentProcedure.Utility
{
	internal static class TransformationUtil
	{
		internal static MemoryStream ApplyXmlTransformations(Stream configInputStream, Stream transformInputStream)
		{
			using (XmlTransformableDocument configXmlDoc = new XmlTransformableDocument())
			{
				configXmlDoc.Load(configInputStream);
				transformInputStream = EnvironmentHelper.ExpandEnvironmentVariablesInConfig(transformInputStream);
				using (XmlTransformation xmlTransformation = new XmlTransformation(transformInputStream, null))
				{
					if (xmlTransformation.Apply(configXmlDoc))
					{
						MemoryStream configOutputStream = new MemoryStream();
						configXmlDoc.Save(configOutputStream);

						configOutputStream.Flush();
						configOutputStream.Position = 0;

						return configOutputStream;
					}
				}
			}

			return null;
		}

		internal static MemoryStream ApplyJsonTransformations(Stream configInputStream, Stream transformInputStream)
		{
			transformInputStream = EnvironmentHelper.ExpandEnvironmentVariablesInConfig(transformInputStream);

			JsonTransformation jsonTransformation = new JsonTransformation(transformInputStream);
			using (Stream configResultStream = jsonTransformation.Apply(configInputStream))
			{
				MemoryStream configOutputStream = new MemoryStream();
				configResultStream.CopyTo(configOutputStream);
				configOutputStream.Seek(0, SeekOrigin.Begin);
				return configOutputStream;
			}
		}

		internal static void ApplyTransformations(CodeTreeComponent component, string pathToTransformations)
		{
			string pathToComponentTranformations = BaseFileSystem.CombinePaths(pathToTransformations, component.DeploymentPackageDirectoryName);
			string pathToOuterConfig = BaseFileSystem.CombinePaths(pathToComponentTranformations, component.PathToConfig);

			List<string> tranformations = new List<string>();
			if (component.LocalFileSystem.DirectoryExists(pathToComponentTranformations))
			{
				tranformations.AddRange(component.LocalFileSystem.EnumerateFiles(pathToComponentTranformations, "*", true));
			}

			if (component.LocalFileSystem.FileExists(pathToOuterConfig))
			{
				tranformations.Add(pathToOuterConfig);
			}

			if (tranformations.Count == 0)
			{
				Logger.Instance.Log(LogLevel.Info, $"No transformations found for {component.Id}.");
				return;
			}

			foreach (string tranformationPath in tranformations)
			{
				string trimmedInstallationPath = component.InstallationPath.TrimEnd(Path.DirectorySeparatorChar);
				string trimmedPathToComponentTranformations = pathToTransformations.TrimEnd(Path.DirectorySeparatorChar);
				string pathToConfig = tranformationPath.Replace(
					trimmedPathToComponentTranformations,
					trimmedInstallationPath.Remove(trimmedInstallationPath.Length - component.DeploymentPackageDirectoryName.Length - 1));

				if (!component.TargetFileSystem.FileExists(pathToConfig))
				{
					throw new ValidationException($"Configuration file '{pathToConfig}' not found. No transformation applied.");
				}

				MemoryStream configOutputStream = null;
				using (FileStream configInputStream = component.TargetFileSystem.OpenFile(pathToConfig))
				{
					using (FileStream transformInputStream = component.TargetFileSystem.OpenFile(tranformationPath))
					{
						if (tranformationPath.EndsWith(".json"))
						{
							configOutputStream = ApplyJsonTransformations(configInputStream, transformInputStream);
						}
						else
						{
							configOutputStream = ApplyXmlTransformations(configInputStream, transformInputStream);
						}
					}
				}

				if (configOutputStream != null)
				{
					component.TargetFileSystem.WriteAllBytesToFile(pathToConfig, configOutputStream.ToArray());
					Logger.Instance.Log(LogLevel.Info, $"Transformation applied to the config file '{pathToConfig}'.");
					configOutputStream.Dispose();
				}
				else
				{
					Logger.Instance.Log(LogLevel.Warning, $"Error applying a transformation to the configuration file '{pathToConfig}'.");
				}
			}
		}
	}
}
