using DeploymentProcedure.Logging;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;

namespace DeploymentProcedure.Utility.FileSystem.Base
{
	internal abstract class BaseFileSystem : IFileSystem
	{
		public static string LocalServerName => "localhost";

		public abstract bool IsLocal { get; }
		public abstract string ServerName { get; }
		public XmlHelper XmlHelper { get; }

		public BaseFileSystem()
		{
			XmlHelper = new XmlHelper(this);
		}

		public void CopyDirectory(string sourceDirectoryPath, IFileSystem targetFileSystem, string targetDirectoryPath, bool overwrite = true)
		{
			string robocopyPath = "robocopy";
			int robocopySearchExitCode = ProcessWrapper.Execute(LogLevel.None, "cmd", "/C where {0}", robocopyPath);
			bool useRobocopy = robocopySearchExitCode == 0;

			if (useRobocopy)
			{
				//robocopy options explanation:
				// /E :: copy subdirectories, including Empty ones.
				// /NP :: No Progress - don't display percentage copied.
				// /NFL::No File List -don't log file names.
				// /NDL::No Directory List -don't log directory names.
				// /NJH::No Job Header.
				ProcessWrapper.Execute(robocopyPath, "\"{0}\" \"{1}\" /E /NP /NJH /NFL /NDL", GetFullPath(sourceDirectoryPath), targetFileSystem.GetFullPath(targetDirectoryPath));
			}
			else
			{
				Logger.Instance.Log(LogLevel.Info, "\tCopying files from '{0}' to '{1}'...", GetFullPath(sourceDirectoryPath), targetFileSystem.GetFullPath(targetDirectoryPath));

				int copiedFilesAmount = CopyFilesRecursively(sourceDirectoryPath, targetFileSystem, targetDirectoryPath, overwrite);

				Logger.Instance.Log(LogLevel.Info, "\t{0} files were copied", copiedFilesAmount);
			}
		}

		public abstract void CopyFile(string sourceFilePath, IFileSystem targetFileSystem, string targetFilePath, bool overwrite);
		public abstract void CreateDirectory(string directoryPath);
		public abstract void CreateFile(string filePath);
		public abstract void DeleteDirectory(string directoryPath);
		public abstract void DeleteFile(string filePath);
		public abstract bool DirectoryExists(string directoryPath);
		public abstract IEnumerable<string> EnumerateDirectories(string path, string searchPattern = "*", bool recursive = false);
		public abstract IEnumerable<string> EnumerateFiles(string path, string searchPattern = "*", bool recursive = false);
		public abstract bool FileExists(string filePath);
		public abstract string GetFullPath(string path);
		public abstract void MoveFile(string sourceFilePath, IFileSystem targetFileSystem, string targetFilePath);
		public abstract FileStream OpenFile(string filePath);
		public abstract string ReadAllText(string filePath);
		public abstract void WriteAllBytesToFile(string filePath, byte[] content);
		public abstract void WriteAllTextToFile(string filePath, string content);

		internal static string CombinePaths(string path, string childPath)
		{
			return path.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar + childPath;
		}

		internal static string GetCommonPath(string path1, string path2)
		{
			string[] path1Parts = path1.Split(Path.DirectorySeparatorChar);
			string[] path2Parts = path2.Split(Path.DirectorySeparatorChar);

			int i = 0;
			while (i < path1Parts.Length && i < path2Parts.Length && path1Parts[i].Equals(path2Parts[i]))
			{
				i++;
			}

			return string.Join(Convert.ToString(Path.DirectorySeparatorChar, CultureInfo.InvariantCulture), path1Parts, 0, i);
		}

		internal static string GetRelativePath(IFileSystem fileSystem, string relativeFrom, string relativeTo)
		{
			string relativeFromAbsolutePath = fileSystem.GetFullPath(relativeFrom).TrimEnd(Path.DirectorySeparatorChar);
			string relativeToAbsolutePath = fileSystem.GetFullPath(relativeTo).TrimEnd(Path.DirectorySeparatorChar);

			string commonPath = GetCommonPath(relativeFromAbsolutePath, relativeToAbsolutePath);

			StringBuilder relativePathPortionBuilder = new StringBuilder();
			for (int i = commonPath.Length; i < relativeFromAbsolutePath.Length; i++)
			{
				if (relativeFromAbsolutePath[i].Equals(Path.DirectorySeparatorChar))
				{
					relativePathPortionBuilder.AppendFormat("..{0}", Path.DirectorySeparatorChar);
				}
			}

			if (relativeToAbsolutePath.Length > commonPath.Length)
			{
				relativePathPortionBuilder.Append(relativeToAbsolutePath.Substring(commonPath.Length + 1));
			}

			return relativePathPortionBuilder.ToString();
		}

		internal static bool IsLocalMachine(string machineName)
		{
			if (string.Equals(machineName, LocalServerName, StringComparison.OrdinalIgnoreCase))
			{
				return true;
			}

			IPAddress[] machineIPs = Dns.GetHostAddresses(machineName);
			IPAddress[] localMachineIPs = Dns.GetHostAddresses(Dns.GetHostName());

			return machineIPs.Any(machineIP => IPAddress.IsLoopback(machineIP) || localMachineIPs.Contains(machineIP));
		}

		protected int CopyFilesRecursively(string sourceDirectoryPath, IFileSystem targetFileSystem, string targetDirectoryPath, bool overwrite)
		{
			if (string.Equals(sourceDirectoryPath, targetDirectoryPath, StringComparison.OrdinalIgnoreCase))
			{
				Logger.Instance.Log(LogLevel.Warning, "\tCannot copy directory {0} to itself.", sourceDirectoryPath);

				return 0;
			}

			if (!targetFileSystem.DirectoryExists(targetDirectoryPath))
			{
				targetFileSystem.CreateDirectory(targetDirectoryPath);
			}

			IEnumerable<string> filesToCopy = EnumerateFiles(sourceDirectoryPath, recursive: true);
			foreach (string sourceFilePath in filesToCopy)
			{
				string targetFilePath = CombinePaths(targetDirectoryPath, GetLastElementNameFromPath(sourceFilePath));
				CopyFile(sourceFilePath, targetFileSystem, targetFilePath, overwrite);
			}
			return filesToCopy.Count();
		}

		private static string GetLastElementNameFromPath(string path)
		{
			return path.Substring(path.LastIndexOf(Path.DirectorySeparatorChar) + 1);
		}
	}
}
