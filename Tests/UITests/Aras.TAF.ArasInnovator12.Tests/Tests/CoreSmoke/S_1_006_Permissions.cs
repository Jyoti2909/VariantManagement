using Aras.TAF.ArasInnovator12.Actions.Chains.CloseChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SaveChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SetChains;
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

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	[TestFixture]
	public class S_1_006_Permissions : SingleTestBase
	{
		private const string DataContainer = @"DataContainer\CoreSmoke\S_1_006";
		private Dictionary<string, string> shopWorkersSearchCriteria;
		private Dictionary<string, string> replacementMap;
		private string[] shopWorkersForLcmPermissions;
		private string shopWorkersForLcm;
		private string propertyName;
		private string canDiscoverLabel;

		protected override void InitTestData()
		{
			shopWorkersSearchCriteria = new Dictionary<string, string>
			{
				{Actor.AsksFor(LocaleState.LabelOf.GridColumn("Identity", "Name")), Actor.ActorInfo.LoginName}
			};

			shopWorkersForLcmPermissions = new[] {
				Actor.AsksFor(LocaleState.LabelOf.GridColumn("Access", "can_get")),
				Actor.AsksFor(LocaleState.LabelOf.GridColumn("Access", "can_update"))
			};

			shopWorkersForLcm = TestData.Get("ShopWorkersForLCMPermissions");
			canDiscoverLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn("Access", "can_discover"));
			propertyName = "name";
		}

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(DataContainer, "Resources"), Settings.CultureInfo);
		}

		protected override void InitActor()
		{
			Actor = SystemActor.AttemptsTo(Create.Actor(UserType.Admin));

			replacementMap = new Dictionary<string, string>
			{
				["{ShopWorkersForLCMPermissions}"] = TestData.Get("ShopWorkersForLCMPermissions")
			};
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(
				Apply.Aml.FromParameterizedFile(Path.Combine(DataContainer, "S_1_006_Cleanup.xml"), replacementMap));
		}

		[Test]
		[Category(TestCategories.Product.Innovator12)]
		[Category(TestCategories.Product.Innovator12Sp1)]
		[Category(TestCategories.Product.Innovator12Sp2)]
		[Category(TestCategories.Product.Innovator12Sp3)]
		[Category(TestCategories.Product.Innovator12Sp4)]
		[Category(TestCategories.Product.Innovator12Sp5)]
		[Category(TestCategories.Product.Innovator12Sp6)]
		[Description(@"
			S-1-006
			1. Create a Permissions
				a. Select Permissions in expanded Administration Tree
				b. Click the Create New Permission
				c. Enter:
					i. Name: ShopWorkersForLCMPermissionsTest
				d. Select Access tab and click on 'Select Items' button
				e. Search and Return Selected Admin
				f. Check Get, Update
				g. Click Save icon
					i. Verify Can Discover checked automatically
				h. Click 'Done' and close tab
		")]
		public void S_1_006_PermissionsTest()
		{
			//1a,b
			Actor.AttemptsTo(Create.Item.OfItemType("Administration/Permission").BySecondaryMenu());

			//c
			var form = Actor.AsksFor(ItemPageContent.Form);
			Actor.AttemptsTo(Set.NewValue(shopWorkersForLcm).ForProperty(propertyName).OnForm(form));

			var relationshipsPanel = Actor.AsksFor(ItemPageContent.RelationshipsPanel);

			//d.e
			Actor.AttemptsTo(Create.Relationship.InRelationshipsPanel(relationshipsPanel).
									ViaSelectItems(shopWorkersSearchCriteria).
									ByReturnSelected);

			foreach (var permissionColumn in shopWorkersForLcmPermissions)
			{
				Actor.AttemptsTo(Set.NewValue(true).
									ForCheckboxInCell(1, permissionColumn).
									OfRelationshipGrid(relationshipsPanel));
			}

			//g
			Actor.AttemptsTo(Save.OpenedItem.BySaveButton);
			//i
			var relationship = Actor.AsksFor(ItemPageContent.CurrentRelationship);
			Actor.ChecksThat(RelationshipGridState.Unfrozen.IsCheckboxChecked(relationship, 1, canDiscoverLabel), Is.True);

			//h
			Actor.AttemptsTo(
				Save.OpenedItem.ByDoneButton(),
				Close.ActiveItemPage.ByCloseButton
			);
		}
	}
}