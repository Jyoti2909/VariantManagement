using Aras.TAF.ArasInnovator12.Actions.Chains.CloseChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.CollapseChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.PinChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SaveChains;
using Aras.TAF.ArasInnovator12.Questions.States;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SearchChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SetChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
using Aras.TAF.ArasInnovatorBase.Questions.Contents;
using Aras.TAF.ArasInnovatorBase.Questions.States.Localization;
using Aras.TAF.Core;
using Aras.TAF.Core.NUnit.Extensions;
using NUnit.Framework;
using System.Collections.Generic;
using System.IO;
using Select = Aras.TAF.ArasInnovator12.Actions.Chains.SelectChains.Select;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	public class S_1_005_Lists : SingleTestBase
	{
		private const string TestDataFolder = @"DataContainer\CoreSmoke\S_1_005";
		private const string PropertyName = "name";
		private const string PropertyDescription = "description";
		private const string SourceItemTypeForColumns = "Value";
		private string listName, listDescription, tabValueName, columnLabelName, columnValueName, columnSortOrderName, columnName;
		private List<Dictionary<string, string>> gridValues;

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(TestDataFolder, "Resources"), Settings.CultureInfo);
		}

		protected override void InitTestData()
		{
			tabValueName = Actor.AsksFor(LocaleState.LabelOf.RelationshipTab("Value"));
			columnLabelName = Actor.AsksFor(LocaleState.LabelOf.GridColumn(SourceItemTypeForColumns, "label"));
			columnValueName = Actor.AsksFor(LocaleState.LabelOf.GridColumn(SourceItemTypeForColumns, "value"));
			columnSortOrderName = Actor.AsksFor(LocaleState.LabelOf.GridColumn(SourceItemTypeForColumns, "sort_order"));
			columnName = Actor.AsksFor(LocaleState.LabelOf.GridColumn("List", "name"));

			listName = TestData.Get("listName");
			listDescription = TestData.Get("listDescription");

			gridValues = new List<Dictionary<string, string>>
			{
				new Dictionary<string, string>
				{
					[columnLabelName] = TestData.Get("firstColumnLabel"),
					[columnValueName] = TestData.Get("firstColumnValue"),
					[columnSortOrderName] = TestData.Get("firstColumnOrder"),
				},
				new Dictionary<string, string>
				{
					[columnLabelName] = TestData.Get("secondColumnLabel"),
					[columnValueName] = TestData.Get("secondColumnValue"),
					[columnSortOrderName] = TestData.Get("secondColumnOrder"),
				},
				new Dictionary<string, string>
				{
					[columnLabelName] = TestData.Get("thirdColumnLabel"),
					[columnValueName] = TestData.Get("thirdColumnValue"),
					[columnSortOrderName] = TestData.Get("thirdColumnOrder"),
				}
			};
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(Apply.Aml.WithPermissions(Actor.ActorInfo).
										FromFile(Path.Combine(TestDataFolder, "S_1_005_Cleanup.xml")));
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
			S-1-005
			Precondition:
				a.	Log into Innovator as Admin.
				b.	Open and pin Navigation Panel

			1. Create a List:
				a.	Select Lists in expanded Administration Tree
				b.	Click the Create New List

				----------------------------------------
				Skipped for Selenium (with QA approval):
				----------------------------------------
				c.	Enter:
					• Name: Type of Wood (Type of Wood_木材の種類)
					• Description: Wood used in construction (Wood used in construction_建築用木材)
				d.	Select the Value tab and click on   button 3 times
				e.	Enter the following
					• Label: Oak (Oak_オーク), Value: Oak (Oak_オーク)
					• Label: Birch (Birch_樺), Value: Birch (Birch_樺)
					• Label: Maple (Maple_紅葉), Value: Maple (Maple_紅葉)
				f.	Save
					i.	Confirm Sort order set automatically in Value Tab
				g.	Click 'Done' and close tab
				h.	Click the Create New List
				----------------------------------------

				i.	Enter:
					• Name: Paint Color (Paint Color_塗装色)
					• Description: Paint color for chairs (Paint color for chairs_椅子の塗装色).
				j.	Select the Value tab and click on '+' button 3 times.
				k.	Enter the following
					• Label: Red (Red_あか), Value: #EF0808
					• Label: Blue (Blue_あお), Value: #1908EF
					• Label: Green (Green_みどり), Value: #1A8804
				l.	Save
					i. Confirm Sort order set automatically in Value Tab
					ii.  Click 'Done' and close tab
				m.	Search and open Paint Color (Paint Color_塗装色) in Lists Search Grid
					i.	Confirm that the item with all added data saved successfully
				n.	Close tabs and return to primary Menu TOC
		")]

		#endregion

		public void S_1_005_ListsTest()
		{
			//Precondition:
			Actor.AttemptsTo(Open.NavigationPanel);
			Actor.AttemptsTo(Pin.NavigationPanel);

			//1
			//a, b
			Actor.AttemptsTo(Create.Item.OfItemType("Administration/List").BySecondaryMenu());

			//i
			var form = Actor.AsksFor(ItemPageContent.Form);

			Actor.AttemptsTo(
				Set.NewValue(listName).ForProperty(PropertyName).OnForm(form),
				Set.NewValue(listDescription).ForProperty(PropertyDescription).OnForm(form)
			);

			//j
			var relationshipsPanel = Actor.AsksFor(ItemPageContent.RelationshipsPanel);
			Actor.AttemptsTo(Select.RelationshipTab.WithName(tabValueName).InRelationshipsPanel(relationshipsPanel));

			var relationship = Actor.AsksFor(ItemPageContent.CurrentRelationship);

			for (var i = 0; i < gridValues.Count; i++)
			{
				Actor.AttemptsTo(Create.Relationship.InRelationshipsPanel(relationshipsPanel).ViaAddRow());
			}

			//k
			for (var i = 0; i < gridValues.Count; i++)
			{
				Actor.AttemptsTo(Select.Item.InRelationshipGrid(relationship).WithRowNumber(i + 1));
				Actor.AttemptsTo(Set.NewValue(gridValues[i][columnLabelName]).ForStringPropertyInCell(i + 1, columnLabelName).OfRelationshipGrid(relationshipsPanel));
				Actor.AttemptsTo(Set.NewValue(gridValues[i][columnValueName]).ForStringPropertyInCell(i + 1, columnValueName).OfRelationshipGrid(relationshipsPanel));
			}

			//l
			Actor.AttemptsTo(Save.OpenedItem.BySaveButton);

			for (var i = 0; i < gridValues.Count; i++)
			{
				Actor.ChecksThat(RelationshipGridState.Unfrozen.CellValue(relationship, i + 1, columnSortOrderName), Is.EqualTo(gridValues[i][columnSortOrderName]));
			}

			Actor.ChecksThat(RelationshipGridState.GridData(relationship), Is.EquivalentTo(gridValues));

			Actor.AttemptsTo(
				Save.OpenedItem.ByDoneButton(),
				Close.ActiveItemPage.ByCloseButton
			);

			//m
			Actor.AttemptsTo(
				Open.SearchPanel.OfCurrentItemType.BySelectedSecondaryMenu,
				Search.Simple.InMainGrid.With(new Dictionary<string, string> { [columnName] = listName }),
				Open.Item.InMainGrid.WithRowNumber(1).ByDoubleClick
			);

			Actor.ChecksThat(ItemPageState.FieldValue(PropertyName), Is.EqualTo(listName));
			Actor.ChecksThat(ItemPageState.FieldValue(PropertyDescription), Is.EqualTo(listDescription));
			Actor.ChecksThat(RelationshipGridState.GridData(relationship), Is.EquivalentTo(gridValues));

			//n
			Actor.AttemptsTo(
				Close.ActiveItemPage.ByCloseButton,
				Collapse.SecondaryMenu
			);
		}
	}
}
