using IntegrationTests;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IntegrationTests.Grammer
{
	[TestFixture]
	[Category("MechanicalPart")]
	public class MechanicalPartDeletion : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\MechanicalPartDeletion";

		[Test]
		public void DeleteMechanicalPartWithoutRelationshipAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithoutRelationshipAsIndustrialEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithBOMRelationshipAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithBOMRelationshipAsProductEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithAlternatesRelationshipAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithAlternatesRelationshipAsProductEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithBOMRelationshipAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithBOMRelationshipAsIndustrialEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithAlternatesRelationshipAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithAlternatesRelationshipAsIndustrialEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithDocumentRelationshipAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithDocumentRelationshipAsProductEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithDocumentRelationshipAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithDocumentRelationshipAsIndustrialEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithCADDocumentRelationshipAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithCADDocumentRelationshipAsProductEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithCADDocumentRelationshipAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithCADDocumentRelationshipAsIndustrialEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithGoalRelationshipAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithGoalRelationshipAsProductEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithGoalRelationshipAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithGoalRelationshipAsIndustrialEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithPartSubmissionWarrantRelationshipAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithPartSubmissionWarrantRelationshipAsProductEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithPartSubmissionWarrantRelationshipAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithPartSubmissionWarrantRelationshipAsIndustrialEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithRequirementRelationshipAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithRequirementRelationshipAsProductEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithRequirementRelationshipAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithRequirementRelationshipAsIndustrialEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithRequirementsDocumentsRelationshipAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithRequirementsDocumentsRelationshipAsProductEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithRequirementsDocumentsRelationshipAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithRequirementsDocumentsRelationshipAsIndustrialEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithManufacturerPartsRelationshipAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithManufacturerPartsRelationshipAsIndustrialEngineer"));
		}

		[Test]
		public void DeleteMechanicalPartWithProjectRelationshipAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "DeleteMechanicalPartWithProjectRelationshipAsIndustrialEngineer"));
		}
	}
}
