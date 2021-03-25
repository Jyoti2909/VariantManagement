using Aras.TAF.ArasInnovator12.Actions.Chains.CloseChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SearchChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
using Aras.TAF.ArasInnovatorBase.Extensions;
using Aras.TAF.ArasInnovatorBase.Models.UserModel;
using Aras.TAF.ArasInnovatorBase.Questions.Contents;
using Aras.TAF.ArasInnovatorBase.Questions.States;
using Aras.TAF.Core;
using Aras.TAF.Core.NUnit.Extensions;
using Aras.TAF.Core.Selenium.Questions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	[TestFixture]
	public class S_1_014_BasicFilteringAndSearching : SingleTestBase
	{
		#region SetUpAndTearDown

		private const string DataContainer = @"DataContainer\CoreSmoke\S_1_014\";
		private readonly string amlSetupPath = Path.Combine(DataContainer, "S_1_014_Setup.xml");
		private readonly string amlItemsPath = Path.Combine(DataContainer, "S_1_014_Items_SetUp.xml");
		private readonly string amlCleanupPath = Path.Combine(DataContainer, "S_1_014_Cleanup.xml");

		private readonly Dictionary<string, string> replacementMap = new Dictionary<string, string>();

		private Dictionary<string, string> typeOfWoodSearchCriteria,
											chairNumberSearchCriteria,
											paintColorSearchCriteria,
											dateCreatedSearchCriteria;

		private string redColorValue, blueColorValue, greenColorValue;
		private string woodPropertyValue, paintColorLabel, chairNumberLabel, dateCreatedLabel, typeOfWoodLabel;

		private string todayDate;

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(DataContainer, "Resources"), Settings.CultureInfo);
		}

		protected override void InitActor()
		{
			Actor = SystemActor.AttemptsTo(Create.Actor(UserType.RegularUser));
		}

		protected override void InitTestData()
		{
			todayDate = DateTime.Today.ToShortInnovatorDateString(Settings.CultureInfo);

			typeOfWoodSearchCriteria = new Dictionary<string, string>
			{
				[typeOfWoodLabel] = woodPropertyValue
			};

			chairNumberSearchCriteria = new Dictionary<string, string>
			{
				[chairNumberLabel] = "*6*"
			};

			paintColorSearchCriteria = new Dictionary<string, string>
			{
				[paintColorLabel] = redColorValue
			};

			dateCreatedSearchCriteria = new Dictionary<string, string>
			{
				[dateCreatedLabel + " [...]"] = todayDate
			};
		}

		protected override void RunSetUpAmls()
		{
			woodPropertyValue = TestData.Get(nameof(woodPropertyValue));
			chairNumberLabel = TestData.Get(nameof(chairNumberLabel));
			dateCreatedLabel = TestData.Get(nameof(dateCreatedLabel));
			paintColorLabel = TestData.Get(nameof(paintColorLabel));
			typeOfWoodLabel = TestData.Get(nameof(typeOfWoodLabel));
			redColorValue = TestData.Get("redLabel");
			blueColorValue = TestData.Get("blueLabel");
			greenColorValue = TestData.Get("greenLabel");

			replacementMap.Add("{userAliasId1}", Actor.ActorInfo.AliasId);
			replacementMap.Add("{dateToday}", DateTime.Today.ToShortInnovatorDateTimeString(Settings.CultureInfo));
			replacementMap.Add("{dateToday+3}", DateTime.Today.AddDays(3).ToShortInnovatorDateTimeString(Settings.CultureInfo));
			replacementMap.Add("{woodPropertyValue}", woodPropertyValue);
			replacementMap.Add("{redLabel}", redColorValue);
			replacementMap.Add("{blueLabel}", blueColorValue);
			replacementMap.Add("{greenLabel}", greenColorValue);
			replacementMap.Add("{chairNumberLabel}", chairNumberLabel);
			replacementMap.Add("{dateCreatedLabel}", dateCreatedLabel);
			replacementMap.Add("{paintColorLabel}", paintColorLabel);
			replacementMap.Add("{typeOfWoodLabel}", typeOfWoodLabel);
			replacementMap.Add("{LocaleLabel}", TestData.Get("LocaleLabel"));
			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(amlSetupPath, replacementMap));
			SystemActor.AttemptsTo(Apply.Aml.WithPermissions(Actor.ActorInfo).FromParameterizedFile(amlItemsPath, replacementMap));
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(Apply.Aml.FromFile(amlCleanupPath));
		}

		#endregion

		[Test]
		[Category(TestCategories.Product.Innovator12)]
		[Category(TestCategories.Product.Innovator12Sp1)]
		[Category(TestCategories.Product.Innovator12Sp2)]
		[Category(TestCategories.Product.Innovator12Sp3)]
		[Category(TestCategories.Product.Innovator12Sp4)]
		[Category(TestCategories.Product.Innovator12Sp5)]
		[Category(TestCategories.Product.Innovator12Sp6)]

		#region Description

		[Description(@"
			1.	Search items by the different conditions
				a.	Hover over a Chairs in TOC -> click 'Search' icon -> Run Search
					i.	Verify that all just created items are returned
				b.	In Type of Wood (Type of Wood_木材の種類) search criteria select 'Oak' ('Oak_オーク') and click 'Run search' button
					i.	Verify that only items with Type of Wood (Type of Wood_木材の種類) 'Oak' ('Oak_オーク') are returned
				c.	Click the 'Clear Search' button to clear the search criteria.
				d.	In the Chair Number search criteria enter: *6* (or a number that you see fit) and click 'Run search' button
					i.	Verify that only items with number 6 in Chair Number are returned
				e.	Click the 'Clear Search' button to clear the search criteria.
				f.	In the Paint Color search criteria select 'Red' ('Red_アナ') and click 'Run search' button
					i.	Verify that only items with Paint Color 'Red' ('Red_アナ') are returned
				g.	Click the 'Clear Search' button to clear the search criteria.
				h.	In Date Created search criteria, select Today in the appeared search dialog and click 'Run search' button
				i.	Verify that only items with Date Created “Today” are returned
				j.	Close tabs")]

		#endregion

		public void S_1_014_BasicFilteringAndSearchingTest()
		{
			//a
			Actor.AttemptsTo(
				Open.NavigationPanel,
				Open.SearchPanel.OfTocItemWithPath("S014 Chair").ByLoupeIcon,
				Search.WithCurrentSearchCriteria.InMainGrid);

			Actor.ChecksThat(MainGridState.Unfrozen.ColumnData(typeOfWoodSearchCriteria.Keys.First()),
							Is.EqualTo(new[] { "Birch", "Maple", woodPropertyValue }));

			CheckBackgroundColorsOfCells(
				new[] { redColorValue, blueColorValue, greenColorValue },
				new[] { "#EF0808", "#1908EF", "#1A8804" });

			//b
			SearchAndCheckResult(typeOfWoodSearchCriteria, woodPropertyValue, 1);

			//c-d
			SearchAndCheckResult(chairNumberSearchCriteria, "1K6A", 1);

			//e-f
			SearchAndCheckResult(paintColorSearchCriteria, redColorValue, 1);

			//g-h
			SearchAndCheckResult(dateCreatedSearchCriteria, todayDate, 2);

			Actor.AttemptsTo(Close.Tab.Current);
		}

		private void SearchAndCheckResult(
			Dictionary<string, string> searchCriteria,
			string expectedResult,
			int expectedRowsNumber)
		{
			Actor.AttemptsTo(Search.Simple.InMainGrid.With(searchCriteria));
			var columnNumber = Actor.AsksFor(MainGridState.Unfrozen.IndexOfColumn(searchCriteria.Keys.First()));
			Actor.ChecksThat(MainGridState.VisibleRowsCount, Is.EqualTo(expectedRowsNumber));

			for (var i = 1; i <= expectedRowsNumber; i++)
			{
				Actor.ChecksThat(MainGridState.Unfrozen.CellValue(i, columnNumber), Is.EqualTo(expectedResult));
			}
		}

		private void CheckBackgroundColorsOfCells(string[] cellValues, string[] expectedHtmlBackgrounds)
		{
			var gridContainer = Actor.AsksFor(SearchPanelContent.MainGrid);
			var columnNumber = Actor.AsksFor(MainGridState.Unfrozen.IndexOfColumn(paintColorLabel));

			for (var i = 0; i < expectedHtmlBackgrounds.Length; i++)
			{
				var cell = Actor.AsksFor(MainGridContent.Unfrozen.CellByValueInColumn(columnNumber, cellValues[i]));

				Actor.ChecksThat(
					ColorValue.Of(cell).AndTheProperty("background-color"),
					Is.EqualTo(ColorTranslator.FromHtml(expectedHtmlBackgrounds[i])));
			}
		}
	}
}
