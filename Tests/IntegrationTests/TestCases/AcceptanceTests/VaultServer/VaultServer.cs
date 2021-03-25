using System.IO;
using Aras.IOM;
using NUnit.Framework;

namespace IntegrationTests.AcceptanceTests
{
	/// <summary>
	/// This class contains acceptance tests that check that Vault Server is configured correctly.
	/// </summary>
	[TestFixture]
	[Category("AcceptanceTests")]
	public class VaultServer : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\AcceptanceTests\\VaultServer";
		private static string PathToAcceptanceTestsFolder => Path.Combine(TestContext.CurrentContext.TestDirectory, PathToTests);

		/// <summary>
		/// Upload text file to Vault Server and then checkout it.
		/// </summary>
		[Test]
		public static void UploadAndDownloadTextFile()
		{
			string testFileName = "TestFile.txt";
			FileInfo testFileInfo = new FileInfo(CombinePaths(PathToAcceptanceTestsFolder, testFileName));
			string fileId = CurrentInnovatorConnection.Innovator.getNewID();
			FileInfo downloadedFileInfo = new FileInfo(CombinePaths(PathToTestsOutputFolder, testFileName));

			Item testFile = null;
			try
			{
				testFile = AddFile(testFileInfo, fileId);
				Assert.IsFalse(testFile.isError(), testFile.ToString());

				testFile = testFile.checkout(downloadedFileInfo.Directory.FullName);
				Assert.IsFalse(testFile.isError(), testFile.ToString());
				Assert.IsTrue(downloadedFileInfo.Exists);
			}
			finally
			{
				if (testFile != null)
				{
					testFile.apply("delete");
				}
				if (downloadedFileInfo.Exists)
				{
					downloadedFileInfo.Delete();
				}
			}
		}

		private static Item AddFile(FileInfo fileInfo, string fileId)
		{
			Item fileItem = CurrentInnovatorConnection.Innovator.newItem("File", "add");
			fileItem.setAttribute("doGetItem", "0");
			fileItem.setID(fileId);
			fileItem.setProperty("filename", fileInfo.Name);
			fileItem.attachPhysicalFile(fileInfo.FullName);
			return fileItem.apply();
		}
	}
}