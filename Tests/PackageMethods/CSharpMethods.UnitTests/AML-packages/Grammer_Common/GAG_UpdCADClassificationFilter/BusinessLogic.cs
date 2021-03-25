using NSubstitute;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using Aras.IOM;
using TestClass = CSharpMethods.Methods.GAG_UpdCADClassificationFilter.ItemMethod.BusinessLogic;

namespace CSharpMethods.UnitTests.AMLPackages.Grammer_Common.GAG_UpdCADClassificationFilter
{
	[TestFixture]
	public class BusinessLogic
	{
		[TestCase("Mechanical/Assembly", "3D")]
		[TestCase("Mechanical/Component", "3D")]
		[TestCase("Mechanical/Drawing", "DWG")]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Run_WhenClassificationIsMechanical_ShouldSetExpectedClassificationFilter(string classification, string expectedClassificationFilter)
		{
			//arrange
			Item fakeCad = ItemHelper.CreateItem("CAD", string.Empty);
			fakeCad.setProperty("classification", classification);

			//act
			Item result = TestClass.Run(fakeCad);
			string classificationFilter = result.getProperty("gag_classification_filter");

			//assert
			Assert.AreEqual(expectedClassificationFilter, classificationFilter);
		}

		[TestCase("gag_classification_filter")]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Run_WhenClassificationIsNotMechanical_ShouldClearProperty(string cleanableProperty)
		{
			//arrange
			const string classification = "Test classification";

			string expectedClassificationFilter = string.Empty;
			Item fakeCad = ItemHelper.CreateItem("CAD", string.Empty);
			fakeCad.setProperty("classification", classification);

			//act
			Item result = TestClass.Run(fakeCad);
			string classificationFilter = result.getProperty(cleanableProperty);

			//assert
			Assert.AreEqual(expectedClassificationFilter, classificationFilter);
		}
	}
}
