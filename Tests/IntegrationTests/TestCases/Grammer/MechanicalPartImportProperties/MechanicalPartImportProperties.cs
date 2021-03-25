using System;
using System.IO;
using NUnit.Framework;

namespace IntegrationTests.Grammer
{
	[TestFixture]
	[Category("MechanicalPart")]
	public class MechanicalPartImportProperties : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\MechanicalPartImportProperties";

		[Test]
		public void ImportPropertiesFromSapCsvFile()
		{
			ImportPropertiesFromCsvFile("ImportPropertiesFromSapCsvFile");
		}

		[Test]
		public void ImportPropertiesFromMatCsvFile()
		{
			ImportPropertiesFromCsvFile("ImportPropertiesFromMatCsvFile");
		}

		[Test]
		public void ImportPropertiesFromToleranzCsvFile()
		{
			ImportPropertiesFromCsvFile("ImportPropertiesFromToleranzCsvFile");
		}

		private void ImportPropertiesFromCsvFile(string xmlName)
		{
			string baseName = CombinePaths(PathToTests, xmlName);

			SetVariable("Path.To.Csv.Folder", Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "TestCases\\Grammer\\MechanicalPartImportProperties\\csv\\Valid"));
			DoTests(baseName, 1, 2);
			SetVariable("Path.To.Csv.Folder", Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "TestCases\\Grammer\\MechanicalPartImportProperties\\csv\\WrongLinesNumber"));
			DoTests(baseName, 3, 4);
			SetVariable("Path.To.Csv.Folder", Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "TestCases\\Grammer\\MechanicalPartImportProperties\\csv\\WrongPropertiesNumber"));
			DoTests(baseName, 5, 6);
		}
	}
}
