using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.PinChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SetChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.AuthorizationChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.CloseChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.DisposeChain;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SearchChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.UpdateChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Enums;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
using Aras.TAF.ArasInnovatorBase.Extensions;
using Aras.TAF.ArasInnovatorBase.Locators.Dialogs;
using Aras.TAF.ArasInnovatorBase.Locators.Dialogs.AlertDialog;
using Aras.TAF.ArasInnovatorBase.Locators.Dialogs.PromoteDialog;
using Aras.TAF.ArasInnovatorBase.Models.UserModel;
using Aras.TAF.ArasInnovatorBase.Questions.Contents;
using Aras.TAF.ArasInnovatorBase.Questions.States;
using Aras.TAF.ArasInnovatorBase.Questions.States.Localization;
using Aras.TAF.Core;
using Aras.TAF.Core.NUnit.Extensions;
using Aras.TAF.Core.Selenium.Questions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.IO;
using Select = Aras.TAF.ArasInnovatorBase.Actions.Chains.SelectChains.Select;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	[TestFixture]
	public class S_1_016_PromoteAnObject : SingleTestBase
	{
		#region SetUp & TearDown

		private const string AmlPath = @"DataContainer\CoreSmoke\S_1_016\";
		private const string AmlSetupName = "S_1_016_Setup.xml";
		private const string AmlItemTypeInstanceSetupName = "S_1_016_Item_Setup.xml";
		private const string AmlCleanupName = "S_1_016_Cleanup.xml";

		private readonly Dictionary<string, string> replacementMap = new Dictionary<string, string>();
		private Dictionary<string, string> amlOnlyProperties;
		private IActorFacade<IUserInfo> Actor2 { get; set; }
		private string dialogAlertText, columnLabel, woodType, confirmingState, creatingState, completedState, promoteDialogTitle, propertiesPanelTitle;

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(AmlPath, "Resources"), Settings.CultureInfo);
		}

		protected override void RunSetUpAmls()
		{
			woodType = TestData.Get("WoodType");
			confirmingState = TestData.Get("ConfirmingStateLabel");
			creatingState = TestData.Get("CreatingState");
			completedState = TestData.Get("CompletedStateLabel");

			replacementMap.Add("{WoodType}", woodType);
			replacementMap.Add("{today}", DateTime.Today.ToShortInnovatorDateTimeString(Settings.CultureInfo));
			replacementMap.Add("{ConfirmingStateLabel}", confirmingState);
			replacementMap.Add("{CreatingState}", creatingState);
			replacementMap.Add("{CompletedStateLabel}", completedState);

			amlOnlyProperties = TestData.Get<Dictionary<string, string>>("amlOnlyProperties");

			foreach (var property in amlOnlyProperties)
			{
				replacementMap.Add(FormattableString.Invariant($"{{{property.Key}}}"), property.Value);
			}

			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(AmlPath + AmlSetupName, replacementMap));
			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(AmlPath + AmlItemTypeInstanceSetupName, replacementMap));
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(Apply.Aml.WithPermissions(UserType.Root).FromParameterizedFile(AmlPath + AmlCleanupName, replacementMap));

			Actor2.ActorInfo.ManagerId = null;
			SystemActor.AttemptsTo(Update.UserAndIdentityInfo.To(Actor2.ActorInfo));
		}

		protected override void InitActor()
		{
			Actor = SystemActor.AttemptsTo(Create.Actor(UserType.RegularUser));

			var userCarpenter = TestData.Get<UserInfo>("FirstUserInfo");
			var userWoods = TestData.Get<UserInfo>("SecondUserInfo");

			Actor.ActorInfo.FirstName = userCarpenter.FirstName;
			Actor.ActorInfo.LastName = userCarpenter.LastName;
			Actor.ActorInfo.LoginName = userCarpenter.LoginName;

			Actor.AttemptsTo(Update.UserAndIdentityInfo.To(Actor.ActorInfo));

			replacementMap.Add("{userAliasId1}", Actor.ActorInfo.AliasId);

			Actor2 = SystemActor.AttemptsTo(Create.Actor(UserType.RegularUser));
			replacementMap.Add("{userAliasId2}", Actor2.ActorInfo.AliasId);

			Actor2.ActorInfo.ManagerId = Actor.ActorInfo.Id;

			Actor2.ActorInfo.FirstName = userWoods.FirstName;
			Actor2.ActorInfo.LastName = userWoods.LastName;
			Actor2.ActorInfo.LoginName = userWoods.LoginName;

			Actor.AttemptsTo(Update.UserAndIdentityInfo.To(Actor2.ActorInfo));
		}

		protected override void DisposeActor()
		{
			SystemActor.AttemptsTo(Dispose.Actors(Actor, Actor2));
		}

		protected override void InitTestData()
		{
			const string messageKey = LocaleKeys.Innovator.Dialog.Promote.NoPromoteError;
			dialogAlertText = Actor.AsksFor(LocaleState.MessageIn.Alert(messageKey));
			columnLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn("Chair016", "wood_type"));
			promoteDialogTitle = TestData.Get("PromoteDialogTitle");
			propertiesPanelTitle = TestData.Get("PropertiesPanelTitle");
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
			Promote an Object
			S-1-016
			Precondition:
				------Applied by AML--------------		
				1.	Create new item (by aml)
					a.	Hover over a Chairs in TOC -> RMB -> Create New Chair
					b.	Enter:
						i.	Type of wood(Type of Wood_木材の種類): Maple (Maple_紅葉)
						ii.	Chair Number(Chair Number_チェアナンバ): Server Assigned (cannot modify)
						iii.	Paint Color(Paint Color_塗装色): Green
						iv.	Date Created(Date Created_作成日): Today - 1
					c.	Click   and close tabs
				------Applied by AML--------------	
				Log into Innovator as jwoods/jwoods
				Open and Pin Navigation Panel

			2.	Change Preview option from “Hide” to “Properties”
				a.	Hover over a Chairs in TOC -> Click loupe icon. Click 'Run Search'
				b.	Click 'Display' button in Search Command Bar -> hover over a Preview in expanded Button’s menu and select “Properties”
					i.	Verify that Properties pane was shown
			3.	Promote item
				a.	Select the Item in Chairs search grid.
					i.	Verify the item’s state is Start in Properties pane.
				b.	Right Click on the Item and select Promote
					i.	Confirm that Promote dialog appears
				c.	Select Confirming State Label(Confirming State Label_州ラベルの確認) and click 'Accept' button
					i.	Verify that that Promote dialog was closed
				d.	Select Item in Chairs search grid
					i.	Verify that the state is Confirming State Label(Confirming State Label_州ラベルの確認)
				e.	Promote the item again
					i.	Verify that you get the message “No Promotions Available” (because the next state is owned by Joe Carpenter)
				f.	Logout as jwoods (jwoods_渡辺謙)
				g.	Log into Innovator as jcarp/jcarp (jcarp_小島秀夫)
				h.	Pin the Navigation Panel
				i.	Hover over a Chairs in TOC. Click 'Run Search' button.
				j.	Select the object created by jwoods at the beginning of this test 
				k.	Right Click on the Item and select Promote
				l.	Double-click Creating(Creating_作成) in the Promote dialog appeared
				m.	Select the Item -> RMB -> Properties
					i.	Verify that the state is Creating in opened dialog
				n.	Close the dialog
				o.	Promote the item again
					i.	Verify that you get the message “No Promotions Available”
				p.	Logout as jcarp (jcarp_小島秀夫)
				q.	Log into Innovator as jwoods/jwoods (jwoods_渡辺謙)
				r.	Pin the Navigation Panel
				s.	Hover over a Chairs in TOC. Click 'Run Search' button.
				t.	Select the object created by jwoods at the beginning of this test.
				u.	Right click and select Promote
				v.	Select the state Completed State Label(Completed State Label_完成した州のラベル) in Promote dialog and click  
					i.	Verify that the state is Completed State Label(Completed State Label_完成した州のラベル) Properties pane
		")]
		#endregion

		public void S_1_016_PromoteAnObjectTest()
		{
			// precondition, 2a
			OpenNavAndSelectChairs();

			//2.b
			Actor.AttemptsTo(Set.PreviewMode(PreviewMode.Properties).InMainGrid);

			var propertiesPanel = Actor.AsksFor(SearchPanelContent.PropertiesPanel);

			Actor.ChecksThat(Displayed.Of(propertiesPanel), Is.True);

			//3. Promote item
			//a
			Actor.AttemptsTo(Select.Item.InMainGrid.WithValueInColumn(columnLabel, woodType));
			Actor.ChecksThat(PropertiesPanelState.ValueOfProperty(PropertyType.State, propertiesPanel), Is.EqualTo("Start"));
			Actor.ChecksThat(PropertiesPanelState.Title(propertiesPanel), Is.EqualTo(propertiesPanelTitle));

			//b,c,d
			PromoteTo(confirmingState);

			Actor.ChecksThat(PropertiesPanelState.ValueOfProperty(PropertyType.State, propertiesPanel), Is.EqualTo(confirmingState));

			//e,f
			TryToPromoteAndLogout();

			//g
			Actor.AttemptsTo(LogIn.ToInnovator.As(Actor2.ActorInfo));

			//h, i
			OpenNavAndSelectChairs();
			var dialogContainer = Actor.AsksFor(SearchPanelContent.DialogsContainer);

			//j, k, l
			Actor.AttemptsTo(Open.Dialog.Promote.ForItem.WithValue(woodType).InMainGridColumn(columnLabel).ByContextMenu);

			Actor.ChecksThat(TextContent.Of(PromoteDialogElements.Title(dialogContainer)), x => x.Contains(promoteDialogTitle));

			Actor.AttemptsTo(Select.PromoteState.WithValue(creatingState).InDialog(dialogContainer).ByDoubleClick);

			//m, n
			var rowNumber = Actor.AsksFor(MainGridState.IndexOfSelectedRow);

			Actor.AttemptsTo(Open.Dialog.Properties.FromMainGrid.ByContextMenuOnRow(rowNumber));

			propertiesPanel = PropertiesDialogElements.PropertiesPanel(dialogContainer);
			Actor.ChecksThat(PropertiesPanelState.ValueOfProperty(PropertyType.State, propertiesPanel), Is.EqualTo(creatingState));

			Actor.AttemptsTo(Close.Dialog(dialogContainer).ByCloseButton);

			//o, p
			TryToPromoteAndLogout();

			//q
			Actor.AttemptsTo(LogIn.ToInnovator.As(Actor.ActorInfo));

			//r, s
			OpenNavAndSelectChairs();

			//t, u, v
			Actor.AttemptsTo(Select.Item.InMainGrid.WithValueInColumn(columnLabel, woodType));

			PromoteTo(completedState);

			Actor.AttemptsTo(Set.PreviewMode(PreviewMode.Properties).InMainGrid);

			propertiesPanel = Actor.AsksFor(SearchPanelContent.PropertiesPanel);
			Actor.ChecksThat(PropertiesPanelState.ValueOfProperty(PropertyType.State, propertiesPanel), Is.EqualTo(completedState));
		}

		private void OpenNavAndSelectChairs()
		{
			Actor.AttemptsTo(Open.NavigationPanel, Pin.NavigationPanel);

			Actor.AttemptsTo(Open.SearchPanel.OfTocItemWithPath("Chair016").ByLoupeIcon,
				Search.WithCurrentSearchCriteria.InMainGrid);
		}

		private void PromoteTo(string promoteState)
		{
			var dialogContainer = Actor.AsksFor(SearchPanelContent.DialogsContainer);

			Actor.AttemptsTo(
				Open.Dialog.Promote.ForItem.WithValue(woodType).InMainGridColumn(columnLabel).ByContextMenu,
				Select.PromoteState.WithValue(promoteState).InDialog(dialogContainer).ByAcceptButton);
		}

		private void TryToPromoteAndLogout()
		{
			Actor.AttemptsTo(Open.Dialog.Promote.ForItem.WithValue(woodType).InMainGridColumn(columnLabel).ByContextMenu);

			var dialogContainer = Actor.AsksFor(SearchPanelContent.DialogsContainer);

			Actor.ChecksThat(TextContent.Of(AlertDialogElements.AlertText(dialogContainer)),
				Is.EqualTo(dialogAlertText));

			Actor.AttemptsTo(Close.Dialog(dialogContainer).ByCloseButton,
				LogOut.FromInnovator);
		}
	}
}
