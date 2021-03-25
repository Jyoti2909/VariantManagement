using NSubstitute;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Aras.Ark.Common;
using Aras.Common;
using Aras.IOM;
using TestClass = CSharpMethods.Methods.GAG_DisableEditingMigrationFlag.ItemMethod.BusinessLogic;

namespace CSharpMethods.UnitTests.AMLPackages.Grammer.GAG_DisableEditingMigrationFlag
{
	[TestFixture]
	public class BusinessLogic
	{
		private const string EmptyResult = @"
<SOAP-ENV:Envelope xmlns:SOAP-ENV='http://schemas.xmlsoap.org/soap/envelope/'>
   <SOAP-ENV:Body>
      <SOAP-ENV:Fault xmlns:af='http://www.aras.com/InnovatorFault'>
         <faultcode>0</faultcode>
      </SOAP-ENV:Fault>
   </SOAP-ENV:Body>
</SOAP-ENV:Envelope>";

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Run_WhenContextItemHasDifferentFlagValue_ShouldThrowItemException()
		{
			//arrange
			const string expectedError = "The property gag_migration_edit_flag cannot be changed";
			Item fakeContextItem = ItemHelper.CreateItem("CAD", string.Empty);
			fakeContextItem.setProperty("gag_migration_edit_flag", "0");
			fakeContextItem.setProperty("config_id", GenerateConfigId());

			Item fakeLatestItem = ItemHelper.CreateItem("CAD", string.Empty);
			fakeLatestItem.setProperty("gag_migration_edit_flag", "1");
			fakeLatestItem.setProperty("config_id", GenerateConfigId());

			IDataAccessLayer fakeDal = Substitute.For<IDataAccessLayer>();
			fakeDal.ApplyItem(Arg.Any<Item>()).Returns(fakeLatestItem);
			fakeDal.NewItem(Arg.Any<string>(), Arg.Any<string>()).Returns(ItemHelper.CreateItem("CAD", string.Empty));

			var testClass = new TestClass(fakeDal);
			//act
			//assert
			ItemException exception = Assert.Throws<ItemException>(() => testClass.Run(fakeContextItem));
			string actualError = exception.Message;
			Assert.AreEqual(actualError, expectedError);
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Run_WhenContextItemHasTheSameFlagValue_ShouldReturnContextItem()
		{
			//arrange
			Item fakeContextItem = ItemHelper.CreateItem("CAD", string.Empty);
			fakeContextItem.setProperty("gag_migration_edit_flag", "1");
			fakeContextItem.setProperty("config_id", GenerateConfigId());
			fakeContextItem.setNewID();

			Item fakeLatestItem = ItemHelper.CreateItem("CAD", string.Empty);
			fakeLatestItem.setProperty("gag_migration_edit_flag", "1");
			fakeLatestItem.setProperty("config_id", GenerateConfigId());
			fakeLatestItem.setNewID();

			IDataAccessLayer fakeDal = Substitute.For<IDataAccessLayer>();
			fakeDal.ApplyItem(Arg.Any<Item>()).Returns(fakeLatestItem);
			fakeDal.NewItem(Arg.Any<string>(), Arg.Any<string>()).Returns(ItemHelper.CreateItem("CAD", string.Empty));
			var testClass = new TestClass(fakeDal);

			//act
			Item actualItem = testClass.Run(fakeContextItem);

			//assert
			Assert.AreEqual(actualItem.getID(), fakeContextItem.getID());
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Run_WhenLatestItemNotFound_ShouldReturnContextItem()
		{
			//arrange
			Item fakeContextItem = ItemHelper.CreateItem("CAD", string.Empty);
			fakeContextItem.setProperty("gag_migration_edit_flag", "1");
			fakeContextItem.setProperty("config_id", GenerateConfigId());
			fakeContextItem.setNewID();

			Item errorItem = ItemHelper.CreateItem(string.Empty, string.Empty);
			errorItem.loadAML(EmptyResult);

			IDataAccessLayer fakeDal = Substitute.For<IDataAccessLayer>();
			fakeDal.NewItem(Arg.Any<string>(), Arg.Any<string>()).Returns(ItemHelper.CreateItem("CAD", string.Empty));
			fakeDal.ApplyItem(Arg.Any<Item>()).Returns(errorItem);
			var testClass = new TestClass(fakeDal);

			//act
			Item actualItem = testClass.Run(fakeContextItem);

			//assert
			Assert.AreEqual(actualItem.getID(), fakeContextItem.getID());
		}

		private static string GenerateConfigId()
		{
			return Guid.NewGuid()
				.ToString("N")
				.ToUpper(CultureInfo.CurrentCulture);
		}
	}
}
