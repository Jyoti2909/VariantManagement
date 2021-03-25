using NUnit.Framework;

namespace IntegrationTests.AcceptanceTests
{
	/// <summary>
	/// Check library availability and functionality.
	/// </summary>
	[TestFixture]
	[Category("AcceptanceTests")]
	public class ArasCommonIntegrity : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\AcceptanceTests\\Integrity";

		/// <summary>
		/// Basic Integrity test.
		/// </summary>
		[Test]
		public void ArasCommonIntegrityCheck()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "ArasCommonIntegrity"));
		}
	}
}
