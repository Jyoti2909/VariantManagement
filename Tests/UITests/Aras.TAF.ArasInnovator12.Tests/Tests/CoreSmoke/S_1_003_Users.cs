using Aras.TAF.ArasInnovator12.Actions.Chains.CloseChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.CollapseChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.PinChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SaveChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SetChains;
using Aras.TAF.ArasInnovator12.Locators.ItemPage;
using Aras.TAF.ArasInnovator12.Questions.Contents;
using Aras.TAF.ArasInnovator12.Questions.States;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.AuthorizationChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SearchChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.UpdateChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
using Aras.TAF.ArasInnovatorBase.Locators.Page;
using Aras.TAF.ArasInnovatorBase.Models;
using Aras.TAF.ArasInnovatorBase.Models.UserModel;
using Aras.TAF.ArasInnovatorBase.Questions.States.Localization;
using Aras.TAF.Core;
using Aras.TAF.Core.NUnit.CustomConstraints;
using Aras.TAF.Core.NUnit.Extensions;
using Aras.TAF.Core.Selenium.Actions;
using Aras.TAF.Core.Selenium.Domain.Enums;
using Aras.TAF.Core.Selenium.Questions;
using NUnit.Framework;
using System.Collections.Generic;
using System.IO;
using Clear = Aras.TAF.ArasInnovatorBase.Actions.Chains.ClearChains.Clear;
using Delete = Aras.TAF.ArasInnovatorBase.Actions.Chains.DeleteChains.Delete;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	[TestFixture]
	public class S_1_003_Users : SingleTestBase
	{
		private const string TestDataFolder = @"DataContainer\CoreSmoke\S_1_003";
		private UserInfo userCarpenter, userWoods;
		private SavingResultModel expectedSavingInfo;
		private Dictionary<string, string> actorData;
		private Dictionary<string, string> itemProperties;
		private string columnLabel;
		private int expectedDistance;

		#region Setup and Teardown

		protected override void RunOtherApiPreconditions()
		{
			userWoods = TestData.Get<UserInfo>("JaneUserInfo");
			Actor.ActorInfo.FirstName = userWoods.FirstName;
			Actor.ActorInfo.LastName = userWoods.LastName;
			Actor.AttemptsTo(Update.UserAndIdentityInfo.To(Actor.ActorInfo));
		}

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(TestDataFolder, "Resources"), Settings.CultureInfo);
		}

		protected override void InitTestData()
		{
			columnLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn("User", "login_name"));

			userCarpenter = TestData.Get<UserInfo>("JoeUserInfo");
			userCarpenter.DatabaseName = Actor.ActorInfo.DatabaseName;

			itemProperties = new Dictionary<string, string>()
			{
				["first_name"] = userCarpenter.FirstName,
				["last_name"] = userCarpenter.LastName,
				["login_name"] = userCarpenter.LoginName,
				["password"] = userCarpenter.Password,
				["confirm_password"] = userCarpenter.Password,
				["logon_enabled"] = "True"
			};

			var localeAlertTemplate = Actor.AsksFor(LocaleState.MessageIn.Alert(LocaleKeys.Innovator.Alert.ItemSavedSuccessfullyTemplate));

			expectedSavingInfo = new SavingResultModel(TestData.Get("ExpectedSavingInfo"), localeAlertTemplate);
			expectedDistance = TestData.Get<int>("ExpectedDistance");

			actorData = new Dictionary<string, string> { [columnLabel] = Actor.ActorInfo.LoginName };
		}

		protected override void SetApiPostconditions()
		{
			base.SetApiPostconditions();
			Actor.AttemptsTo(Delete.Item.ViaApi.ByTypeAndProperty("User", "login_name", userCarpenter.LoginName));
			Actor.ActorInfo.FirstName = string.Empty;
			Actor.ActorInfo.LastName = string.Empty;
			Actor.AttemptsTo(Update.UserAndIdentityInfo.To(Actor.ActorInfo));
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
			S-1-003
				Precondition:
					a.	Log into Innovator as Admin

				Create Users:
					a.	Pin Navigation Panel
					b.	Expand the Administration tree in TOC > select Users > click the Create New User button in Users Secondary Menu:

					-------------------------------------------
					Skipped for Selenium (with QA approval)
					-------------------------------------------
					c.	Enter:
							First Name: Jane (Jane_謙)
							Last Name: Woods (Woods_渡辺)
							Login Name: jwoods (jwoods_渡辺謙)
							Password: jwoods
							Logon Enabled: check

					d.	Click 'Done' to save your newly created user and then 'x' to close opened tab
					e.	Click the 'Create New User' button
					-------------------------------------------

					f.	Enter: 
							First Name: Joe (Joe_秀夫)
							Last Name: Carpenter (Carpenter_小島)
							Login Name: jcarp (jcarp_小島秀夫)
							Password: jcarp (1)
							Logon Enabled: check
						i. Click the button '...' next to the Manager field, search and double-click on Jane Woods (Jane_謙 Woods_渡辺) for his manager

					g.	Click 'Save' to save your newly created user
						i.	Confirm that popup message appears in the top right corner of the page
					h.	Click on the message
						i.	Confirm that it disappears
					i.	Click 'Done' and close tab
					j.	Click the 'Search Users' button in the Users Secondary Menu and click 'Run Search button' in Search Command Bar
					k.	Locate jcarp (jcarp_小島秀夫) in Users Search grid > RMB > click Open in context menu
						i.	Confirm that the item with all added data saved successfully
					l.	Close opened tabs
					m.	Click '<-' in Navigation Panel for returning to primary Menu TOC
					n.	Logout from innovator and login as just created user.
		")]

		#endregion

		public void S_1_003_UsersTest()
		{
			//a
			Actor.AttemptsTo(
				Open.NavigationPanel,
				Pin.NavigationPanel
			);

			//b
			Actor.AttemptsTo(Create.Item.OfItemType("Administration/User").BySecondaryMenu());

			//f
			var userForm = Actor.AsksFor(ItemPageContent.Form);

			foreach (var property in itemProperties)
			{
				Actor.AttemptsTo(Set.NewValue(property.Value).ForProperty(property.Key).OnForm(userForm));
			}

			//f.i
			Actor.AttemptsTo(Set.ItemWithData(actorData).ForProperty("manager").OnForm(userForm).ByButton.AndDoubleClick);

			//g
			var commandBar = Actor.AsksFor(ItemPageContent.CommandBar);
			Actor.AttemptsTo(Click.On(ItemCommandBarElements.SaveButtonOf(commandBar)));

			//g.i
			Actor.ChecksThat(ItemPageState.SavingResult, Is.EqualTo(expectedSavingInfo));

			var messageBox = Actor.AsksFor(ItemPageContent.NotificationPopup);

			Actor.ChecksThat(Distance.From(PageElements.Header).To(Side.Bottom).Of(messageBox), CustomIs.InRangeFor(expectedDistance, expectedDistance));
			Actor.ChecksThat(Distance.From(messageBox).To(Side.Right).Of(PageElements.Body), CustomIs.InRangeFor(11, 11));

			//h
			Actor.AttemptsTo(Close.NotificationPopup.ByClickOnIt);

			//h.i
			Actor.ChecksThat(Presence.Of(messageBox), Is.False);

			//i
			Actor.AttemptsTo(
				Save.OpenedItem.ByDoneButton(),
				Close.ActiveItemPage.ByCloseButton
			);

			//j
			Actor.AttemptsTo(
				Open.SearchPanel.OfCurrentItemType.BySelectedSecondaryMenu,
				Clear.SearchCriteria.InMainGrid,
				Search.Simple.InMainGrid.With(new Dictionary<string, string> { [columnLabel] = userCarpenter.LoginName })
			);

			//k
			Actor.AttemptsTo(Open.Item.InMainGrid.WithValueInCell(columnLabel, userCarpenter.LoginName).ByContextMenu);

			//k.i
			itemProperties["password"] = "***";
			itemProperties["confirm_password"] = "***";
			itemProperties["manager"] = userWoods.FirstName + " " + userWoods.LastName;

			foreach (var property in itemProperties)
			{
				Actor.ChecksThat(ItemPageState.FieldValue(property.Key), a => Assert.AreEqual(a.ToString(), property.Value));
			}

			//l
			Actor.AttemptsTo(Close.ActiveItemPage.ByCloseButton);

			//m
			Actor.AttemptsTo(Collapse.SecondaryMenu);

			//n
			Actor.AttemptsTo(
				LogOut.FromInnovator,
				LogIn.ToInnovator.As(userCarpenter));
		}
	}
}