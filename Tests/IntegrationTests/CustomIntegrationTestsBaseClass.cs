using Aras.Tests.Integration;
using System.Xml;

namespace IntegrationTests
{
	public class CustomIntegrationTestsBaseClass : Aras.Tests.Integration.InnovatorServerTests
	{
		public static string PathToTestsOutputFolder => ConnectionInfo.TestsOutputDirectory;

		protected override string RelativePathToIntegrationTestsDirectory => "..\\..\\IntegrationTests\\";
		protected override string CustomRelativePathToIntegrationTestsTestCasesDirectory => "IntegrationTests";
		protected override string DefaultRelativePathToIntegrationTestsTestCasesDirectory => "TestCases";

		protected override IBaselineComparer GetBaselineComparer(XmlElement request)
		{
			return new BaselineComparerErrorWrapper(base.GetBaselineComparer(request));
		}
	}
}
