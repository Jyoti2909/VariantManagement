using NUnit.Framework;

namespace IntegrationTests.Grammer.GECO.WorkflowMaps
{
	[TestFixture]
	[Category("GECO")]
	public class CadTransitionChecks : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\GECO\\WorkflowMaps\\CadTransitionChecks";

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void WF2_Bug_32052()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF2_Bug_32052)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void WF2_Bug_32051()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF2_Bug_32051)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void WF2_Bug_32050()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF2_Bug_32050)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void WF2_Bug_32051_02()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF2_Bug_32051_02)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void WF1_GDIS202_01()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF1_GDIS202_01)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void WF1_GDIS202_02()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF1_GDIS202_02)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void WF1_GDIS202_03()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF1_GDIS202_03)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void WF1_GDIS202_04()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF1_GDIS202_04)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void WF1_GDIS202_05()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF1_GDIS202_05)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void WF1_Bug_32949()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(WF1_Bug_32949)));
		}
	}
}
