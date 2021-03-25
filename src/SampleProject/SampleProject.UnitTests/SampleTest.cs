using NUnit.Framework;

namespace SampleProject.UnitTests
{
	[TestFixture]
	public static class SampleTest
	{
		[Test]
		public static void GetSampleStringUnitTest()
		{
			const string expectedResult = "Hello World";
			Assert.AreEqual(expectedResult, Sample.GetSampleString);
		}
	}
}
