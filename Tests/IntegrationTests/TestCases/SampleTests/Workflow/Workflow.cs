using NUnit.Framework;

namespace IntegrationTests.SampleTests
{
	/// <summary>
	/// This class contains sample tests that demonstrate how to write integration tests for Workflows.
	/// </summary>
	[TestFixture]
	[Category("SampleTests")]
	public class Workflow : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\SampleTests\\Workflow";

		/// <summary>
		/// Basic Workflow Map test.
		/// </summary>
		[Test]
		public void WorkflowMap()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "WorkflowMap"));
		}
	}
}