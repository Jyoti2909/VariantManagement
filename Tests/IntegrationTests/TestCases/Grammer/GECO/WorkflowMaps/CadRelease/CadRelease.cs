using NUnit.Framework;

namespace IntegrationTests.Grammer.GECO.WorkflowMaps
{
	[TestFixture]
	[Category("GECO")]
	public class CadRelease : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\GECO\\WorkflowMaps\\CadRelease";

		[Test]
		public void WF2DynamicAssignmentsFromPlanningToEnd()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF2DynamicAssignmentsFromPlanningToEnd)));
		}

		[Test]
		public void WF2CancelGeco()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF2CancelGeco)));
		}
	}
}
