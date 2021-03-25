using NUnit.Framework;

namespace IntegrationTests.Grammer.GECO.WorkflowMaps
{
	[TestFixture]
	[Category("GECO")]
	public class MechanicalPartRelease : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\GECO\\WorkflowMaps\\MechanicalPartRelease";

		[Test]
		public void WF4DynamicAssignmentsFromPlanningToEnd()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF4DynamicAssignmentsFromPlanningToEnd)));
		}
	}
}
