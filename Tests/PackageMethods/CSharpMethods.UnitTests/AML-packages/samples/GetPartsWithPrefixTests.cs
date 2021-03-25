using TestedMethod = CSharpMethods.Methods.GetPartsWithPrefix.ItemMethod;
using NUnit.Framework;
using Aras.IOM;
using Aras.Server.Core;
using System.Xml;
using NSubstitute;
using System.Globalization;
using System.Collections.Generic;
using System;

namespace CSharpMethods.UnitTests.AMLPackages.samples
{
	[TestFixture]
	public static class GetPartsWithPrefixTests
	{
		private static TestedMethod.IDataAccessLayer fakeDataAccessLayer;
		private static TestedMethod.BusinessLogic businessLogic;
		private static Innovator innovator;
		private static LinkedList<Func<Item, Item>> applyProcessor;

		[SetUp]
		public static void SetupEachTest()
		{
			// Before each test execution we reinitialize fake DAL and businessLogic
			// so tests won't conflict between themselves
			fakeDataAccessLayer = Substitute.For<TestedMethod.IDataAccessLayer>();
			businessLogic = new TestedMethod.BusinessLogic(fakeDataAccessLayer);
			innovator = ItemHelper.CreateInnovator();

			fakeDataAccessLayer.NewItem(Arg.Any<string>(), Arg.Any<string>())
				.Returns(@params => ItemHelper.CreateItem((string)@params[0], (string)@params[1]));

			fakeDataAccessLayer.NewResult(Arg.Any<string>())
				.Returns(@params => innovator.newResult((string)@params[0]));

			// We use applyProcessor List to store fake AML responces
			applyProcessor = InitializeApplyProcessor();
			fakeDataAccessLayer.ApplyItem(Arg.Any<Item>())
				.Returns(@params =>
				{
					Item paramItem = (Item)@params[0];
					foreach (Func<Item, Item> processor in applyProcessor)
					{
						Item result = processor(paramItem);
						if (result != null)
						{
							return result;
						}
					}
					return null;
				});
		}

		[Test]
		public static void DemoPositiveCaseOneItem()
		{
			// We add fake responce for positive case in the end of list.
			// It is also possible to add several fake responses
			applyProcessor.AddLast(item =>
			{
				if (item.getType() != "Part" ||
					item.getAction() != "get" ||
					item.getAttribute("select") != "id" ||
					item.getProperty("name") != "PRE-*")
				{
					return null;
				}

				Item result = ItemHelper.CreateItem("Part", string.Empty);
				return result;
			});

			// In method we don't use context item so we can pass any parameter
			Item actualResult = businessLogic.Run(null);

			Assert.AreEqual(actualResult.getResult(), "1");
		}

		[Test]
		public static void DemoPositiveCaseThreeItem()
		{
			// We add fake responce for positive case in the end of list
			applyProcessor.AddLast(item =>
			{
				if (item.getType() != "Part" ||
					item.getAction() != "get" ||
					item.getAttribute("select") != "id" ||
					item.getProperty("name") != "PRE-*")
				{
					return null;
				}

				Item result = ItemHelper.CreateItem("Part", string.Empty);
				result.appendItem(ItemHelper.CreateItem("Part", string.Empty));
				result.appendItem(ItemHelper.CreateItem("Part", string.Empty));
				return result;
			});

			Item actualResult = businessLogic.Run(null);

			Assert.AreEqual(actualResult.getResult(), "3");
		}

		[Test]
		public static void DemoNegativeCaseNoItems()
		{
			// We add fake responce for negative case in the begining
			// of list (with highest priority)
			applyProcessor.AddFirst(item =>
			{
				if (item.getType() != "Part" ||
					item.getAction() != "get" ||
					item.getAttribute("select") != "id" ||
					item.getProperty("name") != "PRE-*")
				{
					return null;
				}

				Item result = ItemHelper.CreateItem("Part", string.Empty);
				result.loadAML(
					"<SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
						"<SOAP-ENV:Body>" +
							"<SOAP-ENV:Fault xmlns:af=\"http://www.aras.com/InnovatorFault\">" +
								"<faultcode>0</faultcode>" +
								"<faultstring>" +
									"<![CDATA[No items of type Part found.]]>" +
								"</faultstring>" +
							"</SOAP-ENV:Fault>" +
						"</SOAP-ENV:Body>" +
					"</SOAP-ENV:Envelope>");
				return result;
			});

			Item actualResult = businessLogic.Run(null);

			Assert.AreEqual(actualResult.getResult(), "0");
		}

		[Test]
		public static void DemoNegativeCaseError()
		{
			Item result = ItemHelper.CreateItem("Part", string.Empty);

			// We add fake responce for negative case in the begining
			// of list (with highest priority)
			applyProcessor.AddFirst(item =>
			{
				if (item.getType() != "Part" ||
					item.getAction() != "get" ||
					item.getAttribute("select") != "id" ||
					item.getProperty("name") != "PRE-*")
				{
					return null;
				}

				result.loadAML(
					"<SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
						"<SOAP-ENV:Body>" +
							"<SOAP-ENV:Fault xmlns:af=\"http://www.aras.com/InnovatorFault\">" +
								"<faultcode>SOAP-ENV:Server.PermissionsNoCanGetFoundException</faultcode>" +
								"<faultstring>" +
									"<![CDATA[Get access is denied for Part.]]>" +
								"</faultstring>" +
							"</SOAP-ENV:Fault>" +
						"</SOAP-ENV:Body>" +
					"</SOAP-ENV:Envelope>");
				return result;
			});

			Item error = Assert.Throws<TestedMethod.InnovatorItemException>(() => businessLogic.Run(null)).ErrorItem;
			Assert.AreEqual(error, result);
		}

		private static LinkedList<Func<Item, Item>> InitializeApplyProcessor()
		{
			LinkedList<Func<Item, Item>> applyProcessors = new LinkedList<Func<Item, Item>>();

			return applyProcessors;
		}
	}
}
