using NUnit.Framework;

namespace IntegrationTests.Grammer.GECO.WorkflowMaps
{
	[TestFixture]
	[Category("GECO")]
	public class AlternativeRevision : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\GECO\\WorkflowMaps\\AlternativeRevision";

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void GDIS309_07()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(GDIS309_07)));
		}
	}
}
