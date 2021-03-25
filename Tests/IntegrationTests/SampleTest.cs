using NUnit.Framework;

namespace IntegrationTests
{
	[TestFixture]
	public class SampleTest : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\SampleTests";

		[Test]
		public void Test()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "Test"));
		}
	}
}
