using Aras.IOM;
using NSubstitute;
using NUnit.Framework;
using SampleMethod = CSharpMethods.Methods.SampleMethod.ItemMethod;

namespace CSharpMethods.UnitTests
{

	public static class SampleUnitTest
	{
		[Test]
		public static void SampleMethodTest()
		{
			//fake data access layer here
			var fakeDataAccessLayer = Substitute.For<SampleMethod.IDataAccessLayer>();
			//instantiate BusinessLogic class with "fake" (not real) data access layer instance
			var businessLogic = new SampleMethod.BusinessLogic(fakeDataAccessLayer);

			const string testProperty = "login_name";
			const string testId = "1";
			Item item = ItemHelper.CreateItem("User", "");
			//fake response from data access layer to return "hardcoded" item above
			fakeDataAccessLayer.GetUser("1").Returns(x => item);

			item.setProperty(testProperty, "testuser");
			//check ValidateLoginName behavior with "testuser" value
			Assert.IsTrue(businessLogic.ValidateLoginName(testId));

			item.setProperty(testProperty, null);
			//check ValidateLoginName behavior with null value
			Assert.IsFalse(businessLogic.ValidateLoginName(testId));

			item.setProperty(testProperty, "ad");
			//check ValidateLoginName behavior with "ad" value
			Assert.IsFalse(businessLogic.ValidateLoginName(testId));

			item.setProperty(testProperty, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
			//check ValidateLoginName behavior with aa... value
			Assert.IsFalse(businessLogic.ValidateLoginName(testId));
		}
	}
}
