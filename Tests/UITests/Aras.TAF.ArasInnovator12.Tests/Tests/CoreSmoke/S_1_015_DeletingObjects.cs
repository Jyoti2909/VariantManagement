using Aras.TAF.ArasInnovator12.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.PinChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SearchChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
using Aras.TAF.ArasInnovatorBase.Models.UserModel;
using Aras.TAF.ArasInnovatorBase.Questions.Contents;
using Aras.TAF.ArasInnovatorBase.Questions.States;
using Aras.TAF.ArasInnovatorBase.Questions.States.Localization;
using Aras.TAF.Core;
using Aras.TAF.Core.NUnit.Extensions;
using NUnit.Framework;
using System.Collections.Generic;
using System.IO;
using Close = Aras.TAF.ArasInnovator12.Actions.Chains.CloseChains.Close;
using Delete = Aras.TAF.ArasInnovatorBase.Actions.Chains.DeleteChains.Delete;
using Select = Aras.TAF.ArasInnovatorBase.Actions.Chains.SelectChains.Select;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	[TestFixture]
	public class S_1_015_DeletingObjects : SingleTestBase
	{
		#region SetUp & TearDown

		private readonly string dataContainer = Path.Combine("DataContainer", "CoreSmoke", "S_1_015");
		private const string AmlSetupFileName = "S_1_015_Setup.xml";
		private const string AmlSetupItemInstanceFileName = "S_1_015_ItemType_Setup.xml";
		private const string AmlCleanupFileName = "S_1_015_Cleanup.xml";

		private readonly Dictionary<string, string> replacementMap = new Dictionary<string, string>();

		private const string ItemTypeName = "S015 Chair";
		private const string ChairNumberProperty = "chair_number";
		private string chairNumberColumnLabel;
		private string deleteAllVersions;
		private string oakTypeValue, birchTypeValue, mapleTypeValue;

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(dataContainer, "Resources"), Settings.CultureInfo);
		}

		protected override void RunSetUpAmls()
		{
			oakTypeValue = TestData.Get("oakTypeValue");
			birchTypeValue = TestData.Get("birchTypeValue");
			mapleTypeValue = TestData.Get("mapleTypeValue");
			replacementMap.Add("{oakTypeValue}", oakTypeValue);
			replacementMap.Add("{birchTypeValue}", birchTypeValue);
			replacementMap.Add("{mapleTypeValue}", mapleTypeValue);
			replacementMap.Add("{LocaleLabel}", TestData.Get("LocaleLabel"));
			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(Path.Combine(dataContainer, AmlSetupFileName), replacementMap));
			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(Path.Combine(dataContainer, AmlSetupItemInstanceFileName), replacementMap));
		}

		protected override void InitTestData()
		{
			chairNumberColumnLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn(ItemTypeName, ChairNumberProperty));
			deleteAllVersions = Actor.AsksFor(LocaleState.LabelOf.ContextMenuOption(LocaleKeys.Innovator.ContextMenu.MainGrid.DeleteAllVersions));
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(Path.Combine(dataContainer, AmlCleanupFileName), replacementMap));
		}

		protected override void InitActor()
		{
			Actor = SystemActor.AttemptsTo(Create.Actor(UserType.RegularUser));
			replacementMap.Add("{userAliasId1}", Actor.ActorInfo.AliasId);
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
			Deleting Objects
			S-1-015
			Precondition:
				a.	Log into Innovator as jwoods/jwoods
				b.	Open and Pin Navigation Panel

			1.	Delete items
				a.	Hover over a Chairs in TOC. Click loupe icon. Click Run Search 
				b.	Select the first Chair Item -> RMB -> choose Delete All Versions
				c.	Click OK in delete dialog
				d.	Click 'Run Search'
					i.	Verify that the object was deleted
				e.	Select a Chair Item -> RMB -> choose Delete All Versions
				f.	Click Cancel in delete dialog
					i.	Verify that item is not deleted.
				g.	Click on any Item and then press Ctrl+A (Mac OS: Cmd+A) on keyboard -> RMB > choose Delete All Versions. 
					Click Yes for All button.
				h.	Click 'Run Search'
					i.	Verify that the objects are deleted
						Note: Item can be deleted only if it is unclaimed.
				i.	Close tabs
		")]

		#endregion

		public void S_1_015_DeletingObjectsTest()
		{
			//Precondition
			Actor.AttemptsTo(Open.NavigationPanel,
					Pin.NavigationPanel);

			//a
			Actor.AttemptsTo(Open.SearchPanel.OfTocItemWithPath(ItemTypeName).ByLoupeIcon,
					Search.WithCurrentSearchCriteria.InMainGrid);

			Actor.ChecksThat(MainGridState.VisibleRowsCount, Is.EqualTo(6));

			//b,c,d
			Actor.AttemptsTo(Delete.Item.InMainGrid.WithValueInCell(chairNumberColumnLabel, "1K3A").ByContextMenu,
							Search.WithCurrentSearchCriteria.InMainGrid);

			Actor.ChecksThat(MainGridState.VisibleRowsCount, Is.EqualTo(5));
			Actor.ChecksThat(MainGridState.Unfrozen.HasItemWithValueInColumn("1K3A", chairNumberColumnLabel), Is.False);

			//e, f
			Actor.AttemptsTo(Select.Item.InMainGrid.WithValueInColumn(chairNumberColumnLabel, "1K9A"));

			var rowNumber = Actor.AsksFor(MainGridState.IndexOfSelectedRow);
			var dialogContainer = Actor.AsksFor(SearchPanelContent.DialogsContainer);

			Actor.AttemptsTo(Select.ContextMenuOption(deleteAllVersions).OnMainGridRow(rowNumber),
				Close.Dialog(dialogContainer).ByCancelButton);

			Actor.ChecksThat(MainGridState.VisibleRowsCount, Is.EqualTo(5));

			//g, h
			Actor.AttemptsTo(Select.MultipleItems.InMainGrid.ByCtrlA,
				Delete.SelectedItems.InMainGrid.ByContextMenu.ConfirmingAll,
				Search.WithCurrentSearchCriteria.InMainGrid);

			Actor.ChecksThat(MainGridState.VisibleRowsCount, Is.EqualTo(0));

			//i
			Actor.AttemptsTo(Close.Tab.Current);
		}
	}
}
