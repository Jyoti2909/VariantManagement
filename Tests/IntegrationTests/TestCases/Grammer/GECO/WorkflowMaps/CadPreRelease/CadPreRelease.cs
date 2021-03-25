using NUnit.Framework;

namespace IntegrationTests.Grammer.GECO.WorkflowMaps
{
	[TestFixture]
	[Category("GECO")]
	public class CadPreRelease : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\GECO\\WorkflowMaps\\CadPreRelease";

		[Test]
		public void WF1DynamicAssignmentsFromPlanningToRelease()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "WF1DynamicAssignmentsFromPlanningToRelease"));
		}
	}
}
