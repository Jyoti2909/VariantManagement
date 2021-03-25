using NUnit.Framework;

namespace IntegrationTests.Grammer.GECO.WorkflowMaps
{
	[TestFixture]
	[Category("GECO")]
	public class CadPreReleaseAffectedItems : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\GECO\\WorkflowMaps\\CadPreReleaseAffectedItems";

		[Test]
		public void ReleaseOfOneCAD()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "ReleaseOfOneCAD"));
		}

		[Test]
		public void ReviseOfOneCAD()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "ReviseOfOneCAD"));
		}

		[Test]
		public void PromotingCadTo10StateWhenActivityReturnedToCadTaskFromCPartCheck()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "PromotingCadTo10StateWhenActivityReturnedToCadTaskFromCPartCheck"));
		}

		[Test]
		public void CancelOfCadItemsFromCADTaskActivity()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "CancelOfCadItemsFromCADTaskActivity"));
		}
	}
}
