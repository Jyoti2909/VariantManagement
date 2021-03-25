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
using Aras.TAF.ArasInnovatorBase.Models.UserModel;
using Aras.TAF.ArasInnovatorBase.Questions.Contents;
using Aras.TAF.ArasInnovatorBase.Questions.States.Localization;
using Aras.TAF.Core;
using Aras.TAF.Core.NUnit.Extensions;
using NUnit.Framework;
using System.Collections.Generic;
using System.IO;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	[TestFixture]
	public class S_1_004_Identities : SingleTestBase
	{
		#region SetUpAndTearDown

		private const string DataContainer = @"DataContainer\CoreSmoke\S_1_004";
		private Dictionary<string, string> firstUserSearchCriteria;
		private Dictionary<string, string> secondUserSearchCriteria;
		private Dictionary<string, string> identitiesSearchCriteria;
		private List<string> userList;
		private Dictionary<string, string> replacementMap;
		private Dictionary<string, string> itemProperties;
		private const string NameProp = "Name";
		private string namePropLabel;
		private string nameValue;

		protected override void InitTestData()
		{
			nameValue = TestData.Get("NameValue");
			string descriptionValue = TestData.Get("DescriptionValue");

			itemProperties = new Dictionary<string, string>
			{
				["name"] = nameValue,
				["description"] = descriptionValue
			};

			userList = new List<string>
			{
				string.Concat(TestData.Get("JaneFirstName")," ",TestData.Get("JaneLastName")),
				string.Concat(TestData.Get("JoeFirstName")," ",TestData.Get("JoeLastName"))
			};

			namePropLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn("Identity", NameProp));

			firstUserSearchCriteria = new Dictionary<string, string>
			{
				[namePropLabel] = userList[0]
			};

			secondUserSearchCriteria = new Dictionary<string, string>
			{
				[namePropLabel] = userList[1]
			};

			identitiesSearchCriteria = new Dictionary<string, string>
			{
				[namePropLabel] = nameValue
			};
		}

		protected override void InitActor()
		{
			Actor = SystemActor.AttemptsTo(Create.Actor(UserType.Admin));
			replacementMap = new Dictionary<string, string>
			{
				["{JaneFirstName}"] = TestData.Get("JaneFirstName"),
				["{JoeFirstName}"] = TestData.Get("JoeFirstName"),
				["{JaneLastName}"] = TestData.Get("JaneLastName"),
				["{JoeLastName}"] = TestData.Get("JoeLastName"),
				["{nameValue}"] = TestData.Get("NameValue")
			};
		}

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(DataContainer, "Resources"), Settings.CultureInfo);
		}

		protected override void RunSetUpAmls()
		{
			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(Path.Combine(DataContainer, "S_1_004_Setup.xml"), replacementMap));
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(Path.Combine(DataContainer, "S_1_004_Cleanup.xml"), replacementMap));
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
		S-1-004
			Precondition:
				a.	Log into Innovator as Admin
				b.	Open and Pin Navigation Panel

			1. Create an Identity with users:
				a.	Select Identities in expanded Administration Tree
				b.	Click the 'Create New Identity'
				c.	Enter the Name: 'Shop Workers', Description: 'A group of shop workers'
				d.	Click on 'Select items' button in the relationship grid to select Items
				e.	Click on 'Run Search' to Run Search Items and double-click on Jane Woods
				f.	Close the search dialog
				g.	Click on 'Select items' button in the relationship grid again
				h.	Click on 'Run Search', select Joe Carpenter and click 'Return Selected'
				i.	Click 'Done' and close tab
				j.	Search created item in Identities Search Grid and double-click it
					i.	Confirm that the item with all added data saved successfully
				k.	Close tabs and return to primary Menu TOC
		")]

		#endregion

		public void S_1_004_IdentitiesTest()
		{
			//Precondition
			Actor.AttemptsTo(
				Open.NavigationPanel,
				Pin.NavigationPanel
			);

			//1
			//a, b
			Actor.AttemptsTo(Create.Item.OfItemType("Administration/Identity").BySecondaryMenu());

			//c
			var itemForm = Actor.AsksFor(ItemPageContent.Form);

			foreach (var prop in itemProperties)
			{
				Actor.AttemptsTo(Set.NewValue(prop.Value).ForProperty(prop.Key).OnForm(itemForm));
			}

			//d - f
			var relationshipsPanel = Actor.AsksFor(ItemPageContent.RelationshipsPanel);

			Actor.AttemptsTo(Create.Relationship.InRelationshipsPanel(relationshipsPanel).ViaSelectItems(firstUserSearchCriteria).ByDoubleClick);

			//g, h
			Actor.AttemptsTo(Create.Relationship.InRelationshipsPanel(relationshipsPanel).ViaSelectItems(secondUserSearchCriteria).ByReturnSelected);

			//i
			Actor.AttemptsTo(
				Save.OpenedItem.ByDoneButton(),
				Close.ActiveItemPage.ByCloseButton
			);

			//j
			Actor.AttemptsTo(
				Open.SearchPanel.OfCurrentItemType.BySelectedSecondaryMenu,
				Search.Simple.InMainGrid.With(identitiesSearchCriteria),
				Open.Item.InMainGrid.WithRowNumber(1).ByDoubleClick
			);

			//j.i
			foreach (var prop in itemProperties)
			{
				Actor.ChecksThat(ItemPageState.FieldValue(prop.Key), Is.EqualTo(prop.Value));
			}

			var relationship = Actor.AsksFor(ItemPageContent.CurrentRelationship);

			foreach (var user in userList)
			{
				Actor.ChecksThat(RelationshipGridState.Unfrozen.HasItemWithValueInColumn(relationship, user, namePropLabel), Is.True);
			}

			//k
			Actor.AttemptsTo(
				Close.ActiveItemPage.ByCloseButton,
				Collapse.SecondaryMenu
			);
		}
	}
}
