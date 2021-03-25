using Aras.TAF.ArasInnovator12.Actions.Chains.CloseChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.EditChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.PinChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SaveChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SearchChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SelectChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SetChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
using Aras.TAF.ArasInnovatorBase.Locators;
using Aras.TAF.ArasInnovatorBase.Models.UserModel;
using Aras.TAF.ArasInnovatorBase.Questions.Contents;
using Aras.TAF.ArasInnovatorBase.Questions.States;
using Aras.TAF.ArasInnovatorBase.Questions.States.Localization;
using Aras.TAF.Core;
using Aras.TAF.Core.NUnit.Extensions;
using Aras.TAF.Core.Selenium.Questions;
using NUnit.Framework;
using NUnit.Framework.Constraints;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	[TestFixture]
	public class S_1_012_CreateNewItems : SingleTestBase
	{
		#region Variables

		private readonly string dataContainer = Path.Combine("DataContainer", "CoreSmoke", "S_1_012");
		private readonly Dictionary<string, string> replacementMap = new Dictionary<string, string>();

		private const string woodTypeProperty = "wood_type";
		private const string chairNumberProperty = "chair_number";
		private const string paintColorProperty = "paint_color";
		private const string dateCreatedProperty = "date_created";
		private const string itemTypeName = "S012 Chair";
		private string redColorValue, blueColorValue, greenColorValue;
		private string columnLabel;
		private string cellValue;
		private string oakTypeValue;
		private string birchTypeValue;
		private string sequencePadWith;

		#endregion

		protected override void InitActor()
		{
			Actor = SystemActor.AttemptsTo(Create.Actor(UserType.RegularUser));
		}

		protected override void RunSetUpAmls()
		{
			replacementMap.Add("{userAliasId1}", Actor.ActorInfo.AliasId);
			cellValue = TestData.Get("mapleTypeValue");
			oakTypeValue = TestData.Get("oakTypeValue");
			birchTypeValue = TestData.Get("birchTypeValue");
			redColorValue = TestData.Get("redLabel");
			blueColorValue = TestData.Get("blueLabel");
			greenColorValue = TestData.Get("greenLabel");
			sequencePadWith = TestData.Get("sequencePadWith");

			replacementMap.Add("{oakTypeValue}", oakTypeValue);
			replacementMap.Add("{mapleTypeValue}", cellValue);
			replacementMap.Add("{birchTypeValue}", birchTypeValue);
			replacementMap.Add("{redLabel}", redColorValue);
			replacementMap.Add("{blueLabel}", blueColorValue);
			replacementMap.Add("{greenLabel}", greenColorValue);
			replacementMap.Add("{sequencePadWith}", sequencePadWith);

			var propertiesInExpectedOrder = TestData.Get<Dictionary<string, string>>("PropertiesInExpectedOrder");

			foreach (var property in propertiesInExpectedOrder)
			{
				replacementMap.Add(FormattableString.Invariant($"{{{property.Key}}}"), property.Value);
			}

			replacementMap.Add("{LocaleLabel}", TestData.Get("LocaleLabel"));

			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(
										Path.Combine(dataContainer, "S_1_012_Setup.xml"),
										replacementMap)
			);
		}

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(dataContainer, "Resources"), Settings.CultureInfo);
		}

		protected override void InitTestData()
		{
			columnLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn(itemTypeName, woodTypeProperty));
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(Apply.Aml.FromFile(Path.Combine(dataContainer, "S_1_012_Cleanup.xml")));
		}

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
			Preconditions:
				1.	Log into Innovator as jwoods/jwoods

			Scenario:
				2.	Pin Navigation Panel
				3.	Create new Items
					a.	Hover over a Chairs in TOC -> RMB -> Create New Chair
					b.Enter:
						i. Type of wood (Type of Wood_木材の種類): Oak (Oak_オーク)
						ii. Chair Number (Chair Number_チェアナンバー): Server Assigned (cannot modify)
						iii. Paint Color (Paint Color_塗装色): Red (Red_アナ)
						iv.	Date Created (Date Created_作成日): Today
					c.	Click 'Done' and close tab
					d.	Hover over a Chairs in TOC -> RMB -> Search Chairs
					e.	Run Search in Search Command Bar and open created item in Chairs Search Grid
						i.	Confirm that the item with all added data saved successfully
					f.	Close tabs
					g.	Select Chairs in TOC
					h.	Click the Create New Chair in secondary menu
					i.	Enter:
						i. Type of wood (Type of Wood_木材の種類): Birch (Birch_樺)
						ii. Chair Number (Chair Number_チェアナンバー): Server Assigned (cannot modify)
						iii. Paint Color (Paint Color_塗装色): Blue (Blue_ナン)
						iv.	Date Created (Date Created_作成日): Now + 7
					j.	Click 'Done' and close tab
					k.	Click the Create New Chair in secondary menu again
					l.	Enter:
						i.	Type of wood (Type of Wood_木材の種類): Maple (Maple_紅葉)
						ii.	Chair Number (Chair Number_チェアナンバー): Server Assigned (cannot modify)
						iii. Paint Color (Paint Color_塗装色): Green (Green_チェ)
						iv.	Date Created (Date Created_作成日): Now - 7
					m.	Click 'Done' and close tab
				4.	Edit created Items
					a.	Click Search Chair in secondary menu and Run Search 
					b.	Select any Item in Chairs search grid -> RMB ->  Open ->  modify properties values
						i.	Confirm that you can’t change values of properties until the item is opened for view.
					c.	Close tab of opened Item.
					d.	Select any Item in Chairs search grid -> RMB -> Open -> Click 'Edit' button to edit item -> modify properties values
						i.	Confirm that you can change properties values (except Chair Number) until Item is in edit mode.
					e.	Save item and Close tabs.
				5.	Chair Number increment in new added item by sequence 
					a.	Search created Chair items in Chairs Search Grid
						i.	Verify the Chair Number values of added items are incremented by the created sequence: 
							1K3A, 1K6A, 1K9A, 1K12A… (1カ3A, 1カ6A, 1カ9A, 1カ12A…) Note, the numbers before ‘A’ are incremented by 3
		")]

		#endregion

		public void S_1_012_CreateNewItemsTest()
		{
			var today = DateTime.Today;

			const string greenColor = "#1A8804";
			const string blueColor = "#1908EF";
			const string redColor = "#EF0808";

			//2
			Actor.AttemptsTo(
				Open.NavigationPanel,
				Pin.NavigationPanel
			);

			//3.a

			Actor.AttemptsTo(Create.Item.OfItemType(itemTypeName).ByContextMenu);

			//3.b
			var form = Actor.AsksFor(ItemPageContent.Form);
			FillItemValues(oakTypeValue, redColorValue, today);
			Actor.ChecksThat(Readonly.Of(BaseFormElements.InputOfField(chairNumberProperty, form)), Is.True);

			//3.c
			Actor.AttemptsTo(
				Save.OpenedItem.ByDoneButton(),
				Close.ActiveItemPage.ByCloseButton
			);

			//3.d
			Actor.AttemptsTo(Open.SearchPanel.OfTocItemWithPath(itemTypeName).ByContextMenu);

			//3.e
			Actor.AttemptsTo(
				Search.Simple.InMainGrid.With(new Dictionary<string, string>() { [columnLabel] = oakTypeValue }),
				Open.Item.InMainGrid.WithRowNumber(1).ByContextMenu.ForView
			);

			var firstChairNumber = FormattableString.Invariant($"1{sequencePadWith}3A");

			form = Actor.AsksFor(ItemPageContent.Form);
			Actor.ChecksThat(Value.Of(BaseFormElements.InputOfField(woodTypeProperty, form)), Is.EqualTo(oakTypeValue));
			Actor.ChecksThat(SelectedOptionName.Of(BaseFormElements.SelectOfField(paintColorProperty, form)), Is.EqualTo(redColorValue));
			Actor.ChecksThat(Value.Of(BaseFormElements.InputOfField(chairNumberProperty, form)), Is.EqualTo(firstChairNumber));

			var dropdownParent = Actor.AsksFor(Parent.Of(BaseFormElements.SelectOfField(paintColorProperty, form)));
			Actor.ChecksThat(ColorValue.Of(dropdownParent).AndTheProperty("background-color"), Is.EqualTo(ColorTranslator.FromHtml(redColor)));
			CheckPaintColorOption(blueColorValue, blueColor);
			CheckPaintColorOption(greenColorValue, greenColor);

			Actor.ChecksThat(Value.Of(BaseFormElements.InputOfField(dateCreatedProperty, form)), Is.EqualTo(today.ToString("d", Settings.CultureInfo)));

			//3.f
			Actor.AttemptsTo(
				Close.ActiveItemPage.ByCloseButton,
				Close.ActiveItemPage.ByCloseButton
			);

			//3.g - 3.h
			Actor.AttemptsTo(Create.Item.OfItemType(itemTypeName).BySecondaryMenu());

			//3.i
			FillItemValues(birchTypeValue, blueColorValue, today.AddDays(7));

			//3.j
			Actor.AttemptsTo(
				Save.OpenedItem.ByDoneButton(),
				Close.ActiveItemPage.ByCloseButton
			);

			//3.k
			Actor.AttemptsTo(Create.Item.OfItemType(itemTypeName).BySecondaryMenu());

			//3.l
			FillItemValues(cellValue, greenColorValue, today.AddDays(-7));

			//3.m
			Actor.AttemptsTo(
				Save.OpenedItem.ByDoneButton(),
				Close.ActiveItemPage.ByCloseButton
			);

			//4.a
			Actor.AttemptsTo(
				Open.SearchPanel.OfTocItemWithPath(itemTypeName).BySecondaryMenu,
				Search.WithCurrentSearchCriteria.InMainGrid
			);

			//4.b
			Actor.AttemptsTo(Open.Item.InMainGrid.WithValueInCell(columnLabel, cellValue).ByDoubleClick);

			CheckItemValues(new Dictionary<string, Constraint>
			{
				{woodTypeProperty, Is.True},
				{paintColorProperty, Is.False},
				{dateCreatedProperty, Is.False},
				{chairNumberProperty, Is.True}
			});

			//4.c
			Actor.AttemptsTo(Close.ActiveItemPage.ByCloseButton);

			//4.d
			Actor.AttemptsTo(Open.Item.InMainGrid.WithValueInCell(columnLabel, cellValue).ByContextMenu);
			Actor.AttemptsTo(Edit.OpenedItem.ByButton);

			CheckItemValues(new Dictionary<string, Constraint>
			{
				{woodTypeProperty, Is.False},
				{paintColorProperty, Is.True},
				{dateCreatedProperty, Is.True},
				{chairNumberProperty, Is.True}
			});

			//4.e
			Actor.AttemptsTo(Save.OpenedItem.BySaveButton);
			Actor.AttemptsTo(Close.ActiveItemPage.ByCloseButton);

			//5.a
			Actor.AttemptsTo(Search.WithCurrentSearchCriteria.InMainGrid);

			//5.a.i
			columnLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn(itemTypeName, chairNumberProperty));
			Actor.ChecksThat(MainGridState.Unfrozen.HasItemWithValueInColumn(firstChairNumber, columnLabel), Is.True);
			Actor.ChecksThat(MainGridState.Unfrozen.HasItemWithValueInColumn(FormattableString.Invariant($"1{sequencePadWith}6A"), columnLabel), Is.True);
			Actor.ChecksThat(MainGridState.Unfrozen.HasItemWithValueInColumn(FormattableString.Invariant($"1{sequencePadWith}9A"), columnLabel), Is.True);
		}

		private void CheckPaintColorOption(string optionName, string expectedColor)
		{
			var form = Actor.AsksFor(ItemPageContent.Form);

			Actor.ChecksThat(
				ColorValue.Of(DropdownSelectElements.OptionOf(BaseFormElements.SelectOfField(paintColorProperty, form), optionName)).
				AndTheProperty("background-color"),
				Is.EqualTo(ColorTranslator.FromHtml(expectedColor))
			);
		}

		private void FillItemValues(string woodType, string paintColor, DateTime dateCreated)
		{
			var form = Actor.AsksFor(ItemPageContent.Form);

			Actor.AttemptsTo(Set.NewValue(woodType).ForProperty(woodTypeProperty).OnForm(form));
			Actor.AttemptsTo(Select.Option(paintColor).ForDropdownProperty(paintColorProperty).OnForm(form));
			Actor.AttemptsTo(Set.NewValue(dateCreated.ToString("d", Settings.CultureInfo)).ForProperty(dateCreatedProperty).OnForm(form));
		}

		private void CheckItemValues(Dictionary<string, Constraint> elementsList)
		{
			var form = Actor.AsksFor(ItemPageContent.Form);

			Actor.ChecksThat(Readonly.Of(BaseFormElements.InputOfField(woodTypeProperty, form)),
							elementsList[woodTypeProperty]);

			Actor.ChecksThat(Enabled.Of(BaseFormElements.SelectOfField(paintColorProperty, form)),
							elementsList[paintColorProperty]);

			Actor.ChecksThat(Enabled.Of(BaseFormElements.InputOfField(dateCreatedProperty, form)),
							elementsList[dateCreatedProperty]);

			Actor.ChecksThat(Readonly.Of(BaseFormElements.InputOfField(chairNumberProperty, form)),
							elementsList[chairNumberProperty]);
		}
	}
}
