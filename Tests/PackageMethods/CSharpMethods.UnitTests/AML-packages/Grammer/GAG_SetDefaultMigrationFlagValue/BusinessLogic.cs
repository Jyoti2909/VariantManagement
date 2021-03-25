using NSubstitute;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Aras.Ark.Common;
using Aras.Common;
using Aras.IOM;
using TestClass = CSharpMethods.Methods.GAG_SetDefaultMigrationFlagValue.ItemMethod.BusinessLogic;

namespace CSharpMethods.UnitTests.AMLPackages.Grammer.GAG_SetDefaultMigrationFlagValue
{
	[TestFixture]
	public class BusinessLogic
	{
		[TestCase("1")]
		[TestCase("0")]
		[TestCase("Test")]
		[TestCase("")]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Run_AnyMigrationFlagValue_ShouldSetMigrationFlagValueAs1(string initialFlagValue)
		{
			//arrange
			const string expectedFlagValue = "1";
			Item fakeContextItem = ItemHelper.CreateItem("CAD", string.Empty);
			fakeContextItem.setProperty("gag_migration_edit_flag", initialFlagValue);
			//act
			Item result = TestClass.Run(fakeContextItem);
			//assert
			string actualFlagValue = result.getProperty("gag_migration_edit_flag");
			Assert.AreEqual(actualFlagValue, expectedFlagValue);
		}
	}
}
