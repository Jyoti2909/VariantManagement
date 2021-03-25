using Aras.Tests.Integration;
using NUnit.Framework;

namespace IntegrationTests
{
	/// <summary>
	/// 
	/// </summary>
	[SetUpFixture]
	public class MyIntegrationTestsSetup : IntegrationTestsSetup
	{
		/// <summary>
		/// 
		/// </summary>
		[OneTimeSetUp]
		public override void RunBeforeAnyTests()
		{
			base.RunBeforeAnyTests();
		}

		/// <summary>
		/// 
		/// </summary>
		[OneTimeTearDown]
		public override void RunAfterAnyTests()
		{
			base.RunAfterAnyTests();
		}
	}
}