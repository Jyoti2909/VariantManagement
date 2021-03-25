using NUnit.Framework;

namespace IntegrationTests.Grammer.GECO.WorkflowMaps
{
	[TestFixture]
	[Category("GECO")]
	public class MechanicalPartPreRelease : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\GECO\\WorkflowMaps\\MechanicalPartPreRelease";

		[Test]
		public void WF3DynamicAssignmentsFromPlanningToEnd()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF3DynamicAssignmentsFromPlanningToEnd)));
		}
	}
}
