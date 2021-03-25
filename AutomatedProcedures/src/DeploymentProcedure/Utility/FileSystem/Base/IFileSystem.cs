using System.Collections.Generic;
using System.IO;

namespace DeploymentProcedure.Utility.FileSystem.Base
{
	internal interface IFileSystem
	{
		bool IsLocal { get; }
		string ServerName { get; }
		XmlHelper XmlHelper { get; }

		void CopyDirectory(string sourceDirectoryPath, IFileSystem targetFileSystem, string targetDirectoryPath, bool overwrite = true);
		void CopyFile(string sourceFilePath, IFileSystem targetFileSystem, string targetFilePath, bool overwrite);
		void CreateDirectory(string directoryPath);
		void CreateFile(string filePath);
		void DeleteDirectory(string directoryPath);
		void DeleteFile(string filePath);
		bool DirectoryExists(string directoryPath);
		IEnumerable<string> EnumerateDirectories(string path, string searchPattern = "*", bool recursive = false);
		IEnumerable<string> EnumerateFiles(string path, string searchPattern = "*", bool recursive = false);
		bool FileExists(string filePath);
		string GetFullPath(string path);
		void MoveFile(string sourceFilePath, IFileSystem targetFileSystem, string targetFilePath);
		FileStream OpenFile(string filePath);
		string ReadAllText(string filePath);
		void WriteAllBytesToFile(string filePath, byte[] content);
		void WriteAllTextToFile(string filePath, string content);
	}
}
