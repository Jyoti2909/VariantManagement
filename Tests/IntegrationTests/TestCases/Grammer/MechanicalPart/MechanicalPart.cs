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
	public class MechanicalPart : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\MechanicalPart";

		[Test]
		public void CreateMechanicalPartAssemblyClassificationAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "CreateMechanicalPartAssemblyClassificationAsProductEngineer"));
		}

		[Test]
		public void CreateMechanicalPartComponentClassificationAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "CreateMechanicalPartComponentClassificationAsProductEngineer"));
		}

		[Test]
		public void CreateMechanicalPartMBOMonlyPartClassificationAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "CreateMechanicalPartMBOMonlyPartClassificationAsProductEngineer"));
		}

		[Test]
		public void CreateMechanicalPartPhantomClassificationAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "CreateMechanicalPartPhantomClassificationAsProductEngineer"));
		}

		[Test]
		public void CreateMechanicalPartAssemblyClassificationAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "CreateMechanicalPartAssemblyClassificationAsIndustrialEngineer"));
		}

		[Test]
		public void CreateMechanicalPartComponentClassificationAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "CreateMechanicalPartComponentClassificationAsIndustrialEngineer"));
		}

		[Test]
		public void CreateMechanicalPartMBOMonlyPartClassificationAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "CreateMechanicalPartMBOMonlyPartClassificationAsIndustrialEngineer"));
		}

		[Test]
		public void CreateMechanicalPartPhantomClassificationAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "CreateMechanicalPartPhantomClassificationAsIndustrialEngineer"));
		}

		[Test]
		public void CreateMechanicalPartMBOMonlyPartClassificationAsIndustrialEngineerDeleteAsProductEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "CreateMechanicalPartMBOMonlyPartClassificationAsIndustrialEngineerDeleteAsProductEngineer"));
		}

		[Test]
		public void CreateMechanicalPartAssemblyClassificationAsProductEngineerDeleteAsIndustrialEngineer()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "CreateMechanicalPartAssemblyClassificationAsProductEngineerDeleteAsIndustrialEngineer"));
		}

		[Test]
		public void NameChecksForFlagPropsOnMechanicalPart()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "NameChecksForFlagPropsOnMechanicalPart"));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Bug_33702()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(Bug_33702)));
		}
	}
}
