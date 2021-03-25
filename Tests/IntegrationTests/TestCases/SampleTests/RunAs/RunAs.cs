using NUnit.Framework;

namespace IntegrationTests.SampleTests
{
	/// <summary>
	/// This class contains sample tests that demonstrate how to send AML requests as different users using the 'runAs' attribute.
	/// </summary>
	[TestFixture]
	[Category("SampleTests")]
	public class RunAs : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\SampleTests\\RunAs";

		/// <summary>
		/// Create Item as Admin. To do so you may ommit runAs attribute.
		/// </summary>
		[Test]
		public void RunAsAdmin()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "RunAsAdmin"));
		}

		/// <summary>
		/// <![CDATA[Create Item as Test User. To do so you have to specify runAs attribute like so:
		/// <Request runAs="testuser:1">.]]>
		/// </summary>
		[Test]
		public void RunAsTestUser()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "RunAsTestUser"));
		}
	}
}