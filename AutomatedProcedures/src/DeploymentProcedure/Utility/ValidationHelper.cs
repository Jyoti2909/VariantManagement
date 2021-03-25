using Aras.IOM;
using DeploymentProcedure.Components;
using DeploymentProcedure.Components.Utility;
using DeploymentProcedure.Exceptions;
using DeploymentProcedure.Logging;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.Data.SqlClient;
using System.Globalization;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.NetworkInformation;
using System.Net.Sockets;

namespace DeploymentProcedure.Utility
{
	internal static class ValidationHelper
	{
		private static readonly Ping ping = new Ping();

		static ValidationHelper()
		{
			if (!Properties.DoVerifyCertificates)
			{
				ServicePointManager.ServerCertificateValidationCallback += (sender, cert, chain, sslPolicyErrors) => true;
			}
		}

		internal static void CheckAmlApplicability(DatabaseComponent databaseComponent)
		{
			Logger.Instance.Log(LogLevel.Info, "Checking that we can apply AML to '{0}' component", databaseComponent.Id);

			HttpServerConnection connection = ServerConnectionFactory.GetServerConnection(databaseComponent);
			Innovator innovator = new Innovator(connection);
			string aml = "<AML />";
			Item result = innovator.applyAML(aml);
			if (result.isError())
			{
				Logger.Instance.Log(LogLevel.Error, result.ToString());

				throw new ValidationException(string.Format(CultureInfo.InvariantCulture, "Failed to apply AML: {0}.", aml));
			}

			Logger.Instance.Log(LogLevel.Info, "OK");
		}

		internal static void CheckDirectoryExistence(IFileSystem fileSystem, string directoryPath)
		{
			Logger.Instance.Log(LogLevel.Info, "Checking '{0}' directory existence", fileSystem.GetFullPath(directoryPath));

			if (!fileSystem.DirectoryExists(directoryPath))
			{
				throw new ValidationException(string.Format(CultureInfo.InvariantCulture, "Directory '{0}' doesn't exist", fileSystem.GetFullPath(directoryPath)));
			}

			Logger.Instance.Log(LogLevel.Info, "OK");
		}

		internal static void CheckHostAvailability(string hostname)
		{
			Logger.Instance.Log(LogLevel.Info, "Checking '{0}' availability", hostname);

			PingReply reply = ping.Send(hostname);
			if (reply.Status != IPStatus.Success)
			{
				throw new ValidationException(string.Format(CultureInfo.InvariantCulture, "Host '{0}' is unreachable.", hostname));
			}

			Logger.Instance.Log(LogLevel.Info, "OK");
		}

		internal static void CheckServiceAvailability(string serverName, string serviceName)
		{
			Logger.Instance.Log(LogLevel.Info, "Checking service availability: '{0}'", serviceName);
			if (ProcessWrapper.Execute("cmd", "/c sc \\\\{0} query \"{1}\" | FIND \"STATE\"", serverName, serviceName) != 0)
			{
				throw new ValidationException(string.Format(CultureInfo.InvariantCulture, "Service '{0}' doesn't exist at '{1}' server.", serviceName, serverName));
			}
		}

		internal static void CheckSqlServerConnection(string connectionString)
		{
			Logger.Instance.Log(LogLevel.Info, "Checking SQL server connection through '{0}' connection string", connectionString);

			using (SqlConnection sqlConnection = new SqlConnection(connectionString))
			{
				sqlConnection.Open();

				Logger.Instance.Log(LogLevel.Info, "OK");
			}
		}

		internal static void CheckUrlAvailability(string url)
		{
			Logger.Instance.Log(LogLevel.Info, "Checking '{0}' availability", url);

			using (HttpClient healthCheckClient = new HttpClient())
			{
				HttpResponseMessage healthCheckResponse = healthCheckClient.GetAsync(url).Result;
				healthCheckResponse.EnsureSuccessStatusCode();

				Logger.Instance.Log(LogLevel.Info, "OK");
			}
		}

		internal static void CheckWebApplicationAvailability(WebComponent webComponent)
		{
			Logger.Instance.Log(LogLevel.Info, "Checking '{0}' web application availability", webComponent.Id);

			const string healthCheckPageContent = "I'm alright";
			const string healthCheckPageName = "HealthCheck.aspx";
			string healthCheckPagePath = Path.Combine(webComponent.InstallationPath, healthCheckPageName);
			string healthCheckPageUrl = string.Format(CultureInfo.InvariantCulture, "{0}/{1}", webComponent.Url, healthCheckPageName);

			try
			{
				webComponent.TargetFileSystem.WriteAllTextToFile(healthCheckPagePath, string.Format(CultureInfo.InvariantCulture, "<%= \"{0}\" %>", healthCheckPageContent));

				CheckUrlAvailability(healthCheckPageUrl);
			}
			finally
			{
				webComponent.TargetFileSystem.DeleteFile(healthCheckPagePath);
			}
		}

		internal static void CheckWritePermissionsToDirectory(IFileSystem fileSystem, string directoryPath)
		{
			Logger.Instance.Log(LogLevel.Info, "Checking write permissions to '{0}' directory", fileSystem.GetFullPath(directoryPath));

			directoryPath = directoryPath.TrimEnd(Path.DirectorySeparatorChar);
			while (!fileSystem.DirectoryExists(directoryPath))
			{
				Logger.Instance.Log(LogLevel.Warning, "Directory '{0}' doesn't exist", directoryPath);

				directoryPath = directoryPath.Substring(0, directoryPath.LastIndexOf(Path.DirectorySeparatorChar));

				Logger.Instance.Log(LogLevel.Warning, "Continue check for '{0}'", directoryPath);
			}

			string pathToTempFile = BaseFileSystem.CombinePaths(directoryPath, Path.GetRandomFileName());
			try
			{
				fileSystem.CreateFile(pathToTempFile);

				Logger.Instance.Log(LogLevel.Info, "OK");
			}
			finally
			{
				fileSystem.DeleteFile(pathToTempFile);
			}
		}
	}
}
