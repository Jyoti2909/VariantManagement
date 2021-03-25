using NSubstitute;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Aras.Ark.Common;
using Aras.Common;
using Aras.IOM;
using TestClass = CSharpMethods.Methods.GAG_DsblAddingItmWithoutMgrFlag.ItemMethod.BusinessLogic;

namespace CSharpMethods.UnitTests.AMLPackages.Grammer.GAG_DsblAddingItmWithoutMgrFlag
{
	[TestFixture]
	public class BusinessLogic
	{
		private const string ErrorResultTemplate = @"
<SOAP-ENV:Envelope xmlns:SOAP-ENV='http://schemas.xmlsoap.org/soap/envelope/'>
   <SOAP-ENV:Body>
      <SOAP-ENV:Fault xmlns:af='http://www.aras.com/InnovatorFault'>
         <faultcode>SOAP-ENV:Server</faultcode>
         <faultstring><![CDATA[{0}]]></faultstring>
         <detail>
            <af:legacy_detail><![CDATA[{0}]]></af:legacy_detail>
            <af:exception message = '{0}' type='Aras.Ark.Common.ItemException' />
         </detail>
      </SOAP-ENV:Fault>
   </SOAP-ENV:Body>
</SOAP-ENV:Envelope>";

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Run_MigrationFlagIs0_ShouldThrowItemException()
		{
			//arrange
			const string expectedError = "An item with the gag_migration_edit_flag value of 0 cannot be added.";
			Item fakeContextItem = ItemHelper.CreateItem("GAG_GECO ChangeControlled", string.Empty);

			Item fakeAffectedItem = ItemHelper.CreateItem("GAG_GrammerChangeControlled", "get");
			fakeAffectedItem.setProperty("gag_migration_edit_flag", "0");

			IDataAccessLayer fakeDal = Substitute.For<IDataAccessLayer>();
			fakeDal.ApplyItem(Arg.Any<Item>()).Returns(fakeAffectedItem);
			fakeDal.NewItem("GAG_GrammerChangeControlled", "get").Returns(fakeAffectedItem);
			fakeDal.NewError(Arg.Any<string>()).Returns(ci =>
			{
				Item error = ItemHelper.CreateItem(string.Empty, string.Empty);
				error.loadAML(string.Format(CultureInfo.CurrentCulture, ErrorResultTemplate, ci.ArgAt<string>(0)));
				return error;
			});
			var testClass = new TestClass(fakeDal);
			
			//act
			//assert
			ItemException exception = Assert.Throws<ItemException>(() => testClass.Run(fakeContextItem));
			string actualError = exception?.ErrorItem?.getErrorString();
			Assert.AreEqual(actualError, expectedError);
		}

		[TestCase("")]
		[TestCase("     ")]
		[TestCase("	")]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Run_InvalidFlagValue_ShouldThrowItemException(string flagValue)
		{
			//arrange
			const string expectedError = "Unknown flag value";
			Item fakeContextItem = ItemHelper.CreateItem("GAG_GECO ChangeControlled", string.Empty);

			Item fakeAffectedItem = ItemHelper.CreateItem("GAG_GrammerChangeControlled", "get");
			fakeAffectedItem.setProperty("gag_migration_edit_flag", flagValue);

			IDataAccessLayer fakeDal = Substitute.For<IDataAccessLayer>();
			fakeDal.ApplyItem(Arg.Any<Item>()).Returns(fakeAffectedItem);
			fakeDal.NewItem("GAG_GrammerChangeControlled", "get").Returns(fakeAffectedItem);
			fakeDal.NewError(Arg.Any<string>()).Returns(ci =>
			{
				Item error = ItemHelper.CreateItem(string.Empty, string.Empty);
				error.loadAML(string.Format(CultureInfo.CurrentCulture, ErrorResultTemplate, ci.ArgAt<string>(0)));
				return error;
			});
			var testClass = new TestClass(fakeDal);

			//act
			//assert
			ItemException exception = Assert.Throws<ItemException>(() => testClass.Run(fakeContextItem));
			string actualError = exception?.ErrorItem?.getErrorString();
			Assert.AreEqual(actualError, expectedError);
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Run_MigrationFlagIs1_ShouldReturnContextItem()
		{
			//arrange
			Item fakeContextItem = ItemHelper.CreateItem("GAG_GECO ChangeControlled", string.Empty);
			fakeContextItem.setNewID();

			Item fakeAffectedItem = ItemHelper.CreateItem("GAG_GrammerChangeControlled", "get");
			fakeAffectedItem.setProperty("gag_migration_edit_flag", "1");

			IDataAccessLayer fakeDal = Substitute.For<IDataAccessLayer>();
			fakeDal.ApplyItem(Arg.Any<Item>()).Returns(fakeAffectedItem);
			fakeDal.NewItem("GAG_GrammerChangeControlled", "get").Returns(fakeAffectedItem);
			var testClass = new TestClass(fakeDal);

			//act
			Item result = testClass.Run(fakeContextItem);

			//assert
			Assert.AreEqual(result.getID(), fakeContextItem.getID());
		}
	}
}
