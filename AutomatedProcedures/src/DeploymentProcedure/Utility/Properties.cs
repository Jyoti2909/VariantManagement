using DeploymentProcedure.Logging;
using System;
using System.Collections;
using System.Globalization;
using System.Text.RegularExpressions;

namespace DeploymentProcedure.Utility
{
	internal static class Properties
	{
		public static bool DoVerifyCertificates
		{
			get
			{
				bool result;
				return bool.TryParse(Environment.GetEnvironmentVariable("Do.Verify.Certificates"), out result) ? result : true;
			}
		}
		public static string LogLevel => Environment.GetEnvironmentVariable("Log.Level") ?? "Debug";
		public static string InnovatorVersion => Environment.GetEnvironmentVariable("Version.Of.Installed.Innovator") ?? "11.0 SP9";
		public static string PathToArasUpdateCmd => Environment.GetEnvironmentVariable("Path.To.Aras.Update.Cmd") ?? "..\\ArasUpdateCmd\\ArasUpdateCmd.exe";
		public static string PathToCodeTree => Environment.GetEnvironmentVariable("Path.To.CodeTree") ?? string.Empty;
		public static string PathToConsoleUpgrade => Environment.GetEnvironmentVariable("Path.To.Console.Upgrade") ?? "..\\PackageImportExportUtilities\\consoleUpgrade\\consoleUpgrade.exe";
		public static string PathToDBBak => Environment.GetEnvironmentVariable("Path.To.DB.Bak") ?? string.Empty;
		public static string PathToLanguageTool => Environment.GetEnvironmentVariable("Path.To.Language.Tool") ?? "..\\LanguagePackManagementUtility\\LanguageTool.exe";
		public static string PathToLogs => Environment.GetEnvironmentVariable("Path.To.Logs") ?? "..\\..\\..\\AutomatedProceduresOutput\\TemporaryFilesAndLogs";
		public static string PathToTemplates => Environment.GetEnvironmentVariable("Path.To.Templates") ?? "..\\..\\TemplatesOfSettingFiles";
		public static string PathToBackupFolder => Environment.GetEnvironmentVariable("Path.To.BackupFolder") ?? string.Empty;

		/// <summary>
		/// Evaluates and replaces all entries of properties, matching property regular expression
		/// and that start with startReplaceToken and end with endReplaceToken
		/// </summary>
		/// <param name="input">string instance to expand with variable values</param>
		/// <param name="startReplaceToken">string defining start of a token</param>
		/// <param name="endReplaceToken">string defining end of a token</param>
		/// <returns>string where tokens are replaced with actual values</returns>
		internal static string ExpandEnvironmentVariables(string input, string startReplaceToken = "${", string endReplaceToken = "}")
		{
			string resultString = input;

			IDictionary propertiesSource = Environment.GetEnvironmentVariables();
			foreach (DictionaryEntry property in propertiesSource)
			{
				string propertyPattern = string.Format(CultureInfo.InvariantCulture, "{0}{1}{2}",
					Regex.Escape(startReplaceToken),
					property.Key,
					Regex.Escape(endReplaceToken));
				string replacedString = Regex.Replace(resultString, propertyPattern, property.Value.ToString());
				if (!replacedString.Equals(resultString))
				{
					Logger.Instance.Log(Logging.LogLevel.Debug, "\tProperty '{0}' found by the '{1}' regex and will be replaced",
							property.Key.ToString(),
							propertyPattern);
					resultString = replacedString;
				}
			}

			return resultString;
		}
	}
}
