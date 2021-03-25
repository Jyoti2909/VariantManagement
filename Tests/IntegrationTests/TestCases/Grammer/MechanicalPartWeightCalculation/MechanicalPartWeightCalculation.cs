using NUnit.Framework;

namespace IntegrationTests.Grammer
{
	[TestFixture]
	[Category("MechanicalPart")]
	public class MechanicalPartWeightCalculation : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\MechanicalPartWeightCalculation";

		[Test]
		public void GDIS295()
		{
			ExecuteTestCase(CombinePaths(PathToTests, "GDIS295"));
		}
	}
}
