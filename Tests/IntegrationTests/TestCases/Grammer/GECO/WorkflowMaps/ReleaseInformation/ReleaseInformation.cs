using NUnit.Framework;

namespace IntegrationTests.Grammer.GECO.WorkflowMaps
{
	[TestFixture]
	[Category("GECO")]
	public class ReleaseInformation : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\GECO\\WorkflowMaps\\ReleaseInformation";
		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores", Justification = "<Pending>")]
		public void GDIS346_03()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(GDIS346_03)));
		}
	}
}
