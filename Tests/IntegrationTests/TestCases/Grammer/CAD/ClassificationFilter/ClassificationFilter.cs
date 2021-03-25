using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;

namespace IntegrationTests.Grammer.CAD
{
	[TestFixture]
	[Category("CAD")]
	public class ClassificationFilter : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\CAD\\ClassificationFilter";

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Bug_32029_01()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(Bug_32029_01)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Bug_32029_02()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(Bug_32029_02)));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Bug_32029_03()
		{
			ExecuteTestCase(CombinePaths(PathToTests, nameof(Bug_32029_03)));
		}
	}
}
