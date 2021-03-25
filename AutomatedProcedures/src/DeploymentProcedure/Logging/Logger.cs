using DeploymentProcedure.Utility;
using System;

namespace DeploymentProcedure.Logging
{
	internal class Logger
	{
		private static readonly object _consoleLock = new object();

		private static Logger _instance;
		public static Logger Instance => _instance ?? (_instance = new Logger());

		public static LogLevel GlobalLogLevel => ParseGlobalLogLevelFromSettings();

		private Logger()
		{
		}

		internal void Log(LogLevel logLevel, string messageFormat, params object[] arguments)
		{
			if (logLevel > GlobalLogLevel || logLevel == LogLevel.None)
			{
				return;
			}

			switch (logLevel)
			{
				case LogLevel.Error:
					ColoredLog(ConsoleColor.Red, messageFormat, arguments);
					break;
				case LogLevel.Warning:
					ColoredLog(ConsoleColor.Yellow, messageFormat, arguments);
					break;
				case LogLevel.Debug:
					ColoredLog(ConsoleColor.Cyan, messageFormat, arguments);
					break;
				case LogLevel.Info:
				default:
					ColoredLog(ConsoleColor.Gray, messageFormat, arguments);
					break;
			}
		}

		private static void ColoredLog(ConsoleColor consoleColor, string messageFormat, params object[] arguments)
		{
			lock (_consoleLock)
			{
				try
				{
					Console.ForegroundColor = consoleColor;
					Console.WriteLine(messageFormat, arguments);
				}
				finally
				{
					Console.ResetColor();
				}
			}
		}

		private static LogLevel ParseGlobalLogLevelFromSettings()
		{
			try
			{
				return (LogLevel)Enum.Parse(typeof(LogLevel), Properties.LogLevel);
			}
			catch (ArgumentException)
			{
				ColoredLog(ConsoleColor.Red, "Cannot convert {0} to LogLevel enum. The list of possible values are {1}.",
					Properties.LogLevel, string.Join(", ", Enum.GetNames(typeof(LogLevel))));

				throw;
			}
		}
	}
}
