using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;

namespace IntegrationTests.Grammer
{
	[TestFixture]
	[Category("MechanicalPart")]
	public class MechanicalPartCADDocuments : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\MechanicalPartCADDocuments";

		[Test]
		public void ChangeCADClassificationToMaster()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "ChangeCADClassificationToMaster"));
		}

		[Test]
		public void AssignToMechanicalPartTwoMasterCAD()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "AssignToMechanicalPartTwoMasterCAD"));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Bug_33041()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(Bug_33041)));
		}
	}
}
