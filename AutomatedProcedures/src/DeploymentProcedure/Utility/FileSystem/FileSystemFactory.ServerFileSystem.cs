using DeploymentProcedure.Utility.FileSystem.Base;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;

namespace DeploymentProcedure.Utility.FileSystem
{
	internal partial class FileSystemFactory
	{
		private class ServerFileSystem : BaseFileSystem
		{
			public override bool IsLocal { get; }
			public override string ServerName { get; }

			public ServerFileSystem(string serverName)
			{
				IsLocal = IsLocalMachine(serverName);
				ServerName = serverName;
			}

			public override void CopyFile(string sourceFilePath, IFileSystem targetFileSystem, string targetFilePath, bool overwrite)
			{
				File.Copy(GetFullPath(sourceFilePath), targetFileSystem.GetFullPath(targetFilePath), overwrite);
			}

			public override void CreateDirectory(string directoryPath)
			{
				Directory.CreateDirectory(GetFullPath(directoryPath));
			}

			public override void CreateFile(string filePath)
			{
				using (FileStream fileStream = File.Create(GetFullPath(filePath)))
				{
					// To correctly close file
				}
			}

			public override void DeleteDirectory(string directoryPath)
			{
				Directory.Delete(GetFullPath(directoryPath), true);
			}

			public override void DeleteFile(string filePath)
			{
				File.Delete(GetFullPath(filePath));
			}
			public override bool DirectoryExists(string directoryPath)
			{
				return Directory.Exists(GetFullPath(directoryPath));
			}
			public override IEnumerable<string> EnumerateDirectories(string path, string searchPattern = "*", bool recursive = false)
			{
				return Directory.EnumerateDirectories(GetFullPath(path), searchPattern, recursive ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly);
			}

			public override IEnumerable<string> EnumerateFiles(string path, string searchPattern = "*", bool recursive = false)
			{
				return Directory.EnumerateFiles(GetFullPath(path), searchPattern, recursive ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly);
			}

			public override bool FileExists(string filePath)
			{
				return File.Exists(GetFullPath(filePath));
			}

			public override string GetFullPath(string path)
			{
				return string.Format(CultureInfo.InvariantCulture, "\\\\{0}\\{1}", ServerName, path.Replace(':', '$'));
			}

			public override void MoveFile(string sourceFilePath, IFileSystem targetFileSystem, string targetFilePath)
			{
				File.Move(GetFullPath(sourceFilePath), targetFileSystem.GetFullPath(targetFilePath));
			}

			public override FileStream OpenFile(string filePath)
			{
				return File.Open(GetFullPath(filePath), FileMode.OpenOrCreate, FileAccess.ReadWrite);
			}

			public override string ReadAllText(string filePath)
			{
				return File.ReadAllText(GetFullPath(filePath), Encoding.Default);
			}

			public override void WriteAllBytesToFile(string filePath, byte[] content)
			{
				File.WriteAllBytes(GetFullPath(filePath), content);
			}

			public override void WriteAllTextToFile(string filePath, string content)
			{
				File.WriteAllText(GetFullPath(filePath), content);
			}
		}
	}
}
