using NSubstitute;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using Aras.IOM;
using TestClass = CSharpMethods.Methods.GAG_SetMechPartIcon.ItemMethod.BusinessLogic;

namespace CSharpMethods.UnitTests.AMLPackages.Grammer_Common.GAG_SetMechPartIcon
{
	[TestFixture]
	public class BusinessLogic
	{
		[TestCase("Mechanical Part/D-Phantom", "../Images/Part_light.svg")]
		[TestCase("Mechanical Part/M-Phantom", "../Images/Part_light_green.svg")]
		[TestCase("Mechanical Part/MBOM only Part", "../Images/Part_green.svg")]
		[TestCase("Mechanical Part/Software", "../Images/Part.svg")]
		[TestCase("Mechanical Part/Assembly", "../Images/Part.svg")]
		[TestCase("Mechanical Part/Component", "../Images/Part.svg")]
		[TestCase("Mechanical Part/Material", "../Images/Part.svg")]
		[TestCase("Mechanical Part/Phantom", "../Images/Part.svg")]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Run_WhenClassificationIs_ShouldReturnExpectedIcon(string classification, string expectedIcon)
		{
			//arrange
			Item fakePart = ItemHelper.CreateItem(string.Empty, string.Empty);
			fakePart.setProperty("classification", classification);
			//act
			fakePart = TestClass.Run(fakePart);

			//assert
			string actualIcon = fakePart.getProperty("gag_icon");
			Assert.AreEqual(expectedIcon, actualIcon);
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Run_ItemAsNull_ShouldThrowArgumentNullException()
		{
			//assert
			Assert.Throws<ArgumentNullException>(() => TestClass.Run(null));
		}
	}
}
