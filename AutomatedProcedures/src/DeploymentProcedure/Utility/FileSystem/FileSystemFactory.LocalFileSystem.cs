using DeploymentProcedure.Utility.FileSystem.Base;
using Microsoft.Experimental.IO;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;

namespace DeploymentProcedure.Utility.FileSystem
{
	internal partial class FileSystemFactory
	{
		private class LocalFileSystem : BaseFileSystem
		{
			public override bool IsLocal { get; }
			public override string ServerName { get; }

			public LocalFileSystem(string serverName)
			{
				if (!IsLocalMachine(serverName))
				{
					throw new ArgumentException(string.Format(CultureInfo.InvariantCulture, "Specified server '{0}' is not local", serverName));
				}

				ServerName = serverName;
				IsLocal = true;
			}

			public override void CopyFile(string sourceFilePath, IFileSystem targetFileSystem, string targetFilePath, bool overwrite)
			{
				if (targetFileSystem.IsLocal)
				{
					LongPathFile.Copy(sourceFilePath, targetFilePath, overwrite);
				}
				else
				{
					File.Copy(GetFullPath(sourceFilePath), targetFileSystem.GetFullPath(targetFilePath), overwrite);
				}
			}

			public override void CreateDirectory(string directoryPath)
			{
				LongPathDirectory.Create(directoryPath);
			}

			public override void CreateFile(string filePath)
			{
				using (FileStream fileStream = LongPathFile.Open(filePath, FileMode.Create, FileAccess.Write))
				{
					// due to the absence of LongPathFile.Create method we had to invent bycycle
					// this logic creates file stream, writes nothing there then saves and closes it
				}
			}

			public override void DeleteDirectory(string directoryPath)
			{
				foreach (string subdirectoryPathToDelete in EnumerateDirectories(directoryPath))
				{
					DeleteDirectory(subdirectoryPathToDelete);
				}

				foreach (string filePathToDelete in EnumerateFiles(directoryPath))
				{
					DeleteFile(filePathToDelete);
				}

				LongPathDirectory.Delete(directoryPath);
			}

			public override void DeleteFile(string filePath)
			{
				LongPathFile.Delete(filePath);
			}

			public override bool DirectoryExists(string directoryPath)
			{
				return LongPathDirectory.Exists(directoryPath);
			}

			public override IEnumerable<string> EnumerateDirectories(string path, string searchPattern = "*", bool recursive = false)
			{
				IEnumerable<string> directories = LongPathDirectory.EnumerateDirectories(path, searchPattern);
				foreach (string directory in directories)
				{
					yield return directory;
				}

				if (recursive)
				{
					foreach (string directory in directories)
					{
						foreach (string subdirectory in EnumerateDirectories(directory, searchPattern, recursive: true))
						{
							yield return subdirectory;
						}
					}
				}
			}

			public override IEnumerable<string> EnumerateFiles(string path, string searchPattern = "*", bool recursive = false)
			{
				foreach (string file in LongPathDirectory.EnumerateFiles(path, searchPattern))
				{
					yield return file;
				}

				if (recursive)
				{
					foreach (string directory in EnumerateDirectories(path, searchPattern, recursive: false))
					{
						foreach (string file in EnumerateFiles(directory, searchPattern, recursive: true))
						{
							yield return file;
						}
					}
				}
			}

			public override bool FileExists(string filePath)
			{
				return LongPathFile.Exists(filePath);
			}

			public override string GetFullPath(string path)
			{
				return Path.GetFullPath(path);
			}

			public override void MoveFile(string sourceFilePath, IFileSystem targetFileSystem, string targetFilePath)
			{
				if (targetFileSystem.IsLocal)
				{
					LongPathFile.Move(sourceFilePath, targetFilePath);
				}
				else
				{
					File.Move(GetFullPath(sourceFilePath), targetFileSystem.GetFullPath(targetFilePath));
				}
			}

			public override FileStream OpenFile(string filePath)
			{
				return LongPathFile.Open(filePath, FileMode.OpenOrCreate, FileAccess.ReadWrite);
			}

			public override string ReadAllText(string filePath)
			{
				using (FileStream fileStream = LongPathFile.Open(filePath, FileMode.Open, FileAccess.Read))
				{
					using (StreamReader fileStreamReader = new StreamReader(fileStream, Encoding.Default))
					{
						return fileStreamReader.ReadToEnd();
					}
				}
			}

			public override void WriteAllBytesToFile(string filePath, byte[] content)
			{
				using (FileStream fileStream = LongPathFile.Open(filePath, FileMode.Create, FileAccess.Write))
				{
					fileStream.Write(content, 0, content.Length);
				}
			}

			public override void WriteAllTextToFile(string filePath, string content)
			{
				using (FileStream fileStream = LongPathFile.Open(filePath, FileMode.Create, FileAccess.Write))
				{
					fileStream.Write(Encoding.Default.GetBytes(content), 0, content.Length);
				}
			}
		}
	}
}
