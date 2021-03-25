using TestedMethod = CSharpMethods.Methods.CheckIfUserEnabled.ItemMethod;
using NUnit.Framework;
using CSharpMethods.Methods.CheckIfUserEnabled;
using Aras.IOM;
using Aras.Server.Core;
using System.Xml;
using NSubstitute;
using System.Globalization;

namespace CSharpMethods.UnitTests.AMLPackages.samples
{
	[TestFixture]
	public class CheckIfUserEnabledTests
	{
		const string errorMessage = "No items of type User found.";
		string faultString = string.Format(CultureInfo.InvariantCulture,
			@"<SOAP-ENV:Envelope xmlns:SOAP-ENV=""http://schemas.xmlsoap.org/soap/envelope/"">
				<SOAP-ENV:Body>
					<SOAP-ENV:Fault xmlns:af=""http://www.aras.com/InnovatorFault"">
						<faultcode>SOAP-ENV:Server</faultcode>
						<faultstring><![CDATA[{0}]]></faultstring>
						<detail></detail>
					</SOAP-ENV:Fault>
				</SOAP-ENV:Body>
			</SOAP-ENV:Envelope>", errorMessage);

		private static TestedMethod.IDataAccessLayer fakeDataAccessLayer;
		private static Innovator innovator;

		[SetUp]
		public static void SetupEachTest()
		{
			fakeDataAccessLayer = Substitute.For<TestedMethod.IDataAccessLayer>();
			innovator = ItemHelper.CreateInnovator();

			fakeDataAccessLayer = Substitute.For<TestedMethod.IDataAccessLayer>();

			fakeDataAccessLayer.NewItem(Arg.Any<string>(), Arg.Any<string>())
				.Returns(@params => ItemHelper.CreateItem((string)@params[0], (string)@params[1]));

			fakeDataAccessLayer.NewError(Arg.Any<string>())
				.Returns(@params => innovator.newError((string)@params[0]));
		}

		[Test]
		public static void CheckThatInnovatorServerExceptionThrownWhenContextItemIsEmpty()
		{
			const string expectedExceptionMessage = "login_name is not defined";
			TestedMethod.BusinessLogic businessLogic = new TestedMethod.BusinessLogic(fakeDataAccessLayer);
			Innovator innovator = ItemHelper.CreateInnovator();

			Item contextItem = innovator.newItem();
			InnovatorServerException exception = Assert.Throws<InnovatorServerException>(() => businessLogic.Run(contextItem));
			Assert.AreEqual(expectedExceptionMessage, exception.Message);

			string amlOfContextItem =
				@"<AML>
					<Item type='User'>
						<login_name></login_name>
					</Item>
				</AML>";
			contextItem.loadAML(amlOfContextItem);
			exception = Assert.Throws<InnovatorServerException>(() => businessLogic.Run(contextItem));
			Assert.AreEqual(expectedExceptionMessage, exception.Message);
		}

		[Test]
		public void CheckThatMethodReturnsOriginalErrorFromServer()
		{
			const string loginName = "sample_user";
			TestedMethod.BusinessLogic businessLogic = new TestedMethod.BusinessLogic(fakeDataAccessLayer);

			fakeDataAccessLayer.ApplyItem(Arg.Is<Item>(item => item.getType() == "User" && item.getProperty("login_name") == loginName))
				.Returns(@params =>
				{
					Item errorItem = innovator.newItem();
					errorItem.loadAML(faultString);
					return errorItem;
				});

			Item contextItem = innovator.newItem();
			contextItem.setType("User");
			contextItem.setProperty("login_name", loginName);

			Item result = businessLogic.Run(contextItem);
			Assert.IsTrue(result.isError());
			Assert.AreEqual(errorMessage, result.getErrorString());
		}
	}
}
