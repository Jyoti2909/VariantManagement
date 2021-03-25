using DeploymentProcedure.Logging;
using System.Diagnostics;
using System.Globalization;

namespace DeploymentProcedure.Utility
{
	internal class ProcessWrapper
	{
		internal static int Execute(string pathToTool, string argumentsFormat, params object[] arguments)
		{
			return Execute(LogLevel.Info, pathToTool, argumentsFormat, arguments);
		}

		public static int Execute(LogLevel wrapperLogLevel, string pathToTool, string argumentsFormat, params object[] arguments)
		{
			ProcessStartInfo toolProcessStartInfo = new ProcessStartInfo
			{
				FileName = pathToTool,
				UseShellExecute = false,
				CreateNoWindow = true,
				RedirectStandardError = true,
				RedirectStandardOutput = true,
				Arguments = string.Format(CultureInfo.InvariantCulture, argumentsFormat, arguments)
			};
			Process toolProcess = new Process
			{
				StartInfo = toolProcessStartInfo
			};
			toolProcess.OutputDataReceived += (s, e) => Logger.Instance.Log(LogLevel.Info, "\t{0}", e.Data);
			toolProcess.ErrorDataReceived += (s, e) => Logger.Instance.Log(LogLevel.Error, "\t{0}", e.Data);

			Logger.Instance.Log(wrapperLogLevel, "\tStarting '{0} ({1})' in '{2}'", toolProcessStartInfo.FileName, toolProcessStartInfo.Arguments, toolProcessStartInfo.WorkingDirectory);

			toolProcess.Start();
			toolProcess.BeginOutputReadLine();
			toolProcess.BeginErrorReadLine();
			toolProcess.WaitForExit();

			Logger.Instance.Log(wrapperLogLevel, "\tFinishing '{0}' with {1} exit code.", toolProcessStartInfo.FileName, toolProcess.ExitCode);

			return toolProcess.ExitCode;
		}
	}
}
