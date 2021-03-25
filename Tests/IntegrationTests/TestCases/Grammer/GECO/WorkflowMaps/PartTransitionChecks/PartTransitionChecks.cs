using NUnit.Framework;

namespace IntegrationTests.Grammer.GECO.WorkflowMaps
{
	[TestFixture]
	[Category("GECO")]
	public class PartTransitionChecks : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\GECO\\WorkflowMaps\\PartTransitionChecks";

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores", Justification = "<Pending>")]
		public void GDIS174_1()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(GDIS174_1)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores", Justification = "<Pending>")]
		public void GDIS174_2()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(GDIS174_2)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores", Justification = "<Pending>")]
		public void Bug_32974()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(Bug_32974)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores", Justification = "<Pending>")]
		public void Bug_32985()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(Bug_32985)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores", Justification = "<Pending>")]
		public void GDIS174_R07()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(GDIS174_R07)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores", Justification = "<Pending>")]
		public void GDIS174_R08()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(GDIS174_R08)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores", Justification = "<Pending>")]
		public void GDIS174_R12()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(GDIS174_R12)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores", Justification = "<Pending>")]
		public void GDIS174_R15()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(GDIS174_R15)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores", Justification = "<Pending>")]
		public void GDIS174_R16()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(GDIS174_R16)));
		}
	}
}
