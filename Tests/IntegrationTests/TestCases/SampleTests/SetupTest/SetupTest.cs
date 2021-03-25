using NUnit.Framework;

namespace IntegrationTests.SampleTests
{
	/// <summary>
	/// This class contains sample tests that demonstrate how to use 'Setup Test.xml'.
	/// The 'Setup Test.xml' executes some setup actions before a run of the first test in a Category.
	/// Usually the 'Setup Test.xml' prepares metadata for test cases, but 
	/// After all tests in a Category finished - TestCaseCleanUp section it the 'Setup Test.xml' is called.
	/// 
	/// NOTE: keep in mind that relative path to the 'Setup Test.xml' evaluated based on a type's full name ([namespace].[type_name]; e.g. 'IntegrationTests.SampleTests.SetupTest').
	/// Prerequisites to use the 'Setup Test.xml':
	/// 1) A name of a class, marked with [TestFixture] attribute, should be the same as a name of a folder, that contains 'Setup Test.xml' file
	/// 2) A namespace should reflect relative path from the 'TestsCases' directory to a parent directory from step 1, separated by dots]
	///    Example: IntegrationTests.SampleTests
	///    'IntegrationTests' replaced by 'TestCases', dots replaced by slashes, class name and the 'Setup Test.xml' file name added to end. Result path is:
	///    TestCases\SampleTests\SetupTest\Setup Test.xml.
	/// </summary>
	[TestFixture]
	[Category("SampleTests")]
	public class SetupTest : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\SampleTests\\SetupTest";

		/// <summary>
		/// The first test to run in this category.
		/// The test will use metadata created by 'Setup Test.xml'
		/// 'Setup Test.xml' will setup metadata right before this test.
		/// </summary>
		[Test]
		public void SetupTestExample1()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "Test"));
		}

		/// <summary>
		/// <![CDATA[The second and the last test to run in this category.
		/// The test will also use metadata created by 'Setup Test.xml'.
		/// <TestCaseCleanUp> section of 'Setup Test.xml' will be performed right after this (last) test.]]>
		/// </summary>
		[Test]
		public void SetupTestExample2()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "Test2"));
		}
	}
}