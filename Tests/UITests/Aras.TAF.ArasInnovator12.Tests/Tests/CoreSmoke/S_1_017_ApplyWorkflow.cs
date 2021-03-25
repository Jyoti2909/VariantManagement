using Aras.TAF.ArasInnovator12.Actions.Chains.CloseChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.PinChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SetChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.AuthorizationChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ClearChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.CompleteChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.DisposeChain;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SearchChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.UpdateChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Enums;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
using Aras.TAF.ArasInnovatorBase.Extensions;
using Aras.TAF.ArasInnovatorBase.Locators.Dialogs;
using Aras.TAF.ArasInnovatorBase.Models;
using Aras.TAF.ArasInnovatorBase.Models.UserModel;
using Aras.TAF.ArasInnovatorBase.Questions.Contents;
using Aras.TAF.ArasInnovatorBase.Questions.States;
using Aras.TAF.ArasInnovatorBase.Questions.States.Localization;
using Aras.TAF.Core;
using Aras.TAF.Core.NUnit.Extensions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Click = Aras.TAF.Core.Selenium.Actions.Click;
using MainGridState = Aras.TAF.ArasInnovatorBase.Questions.States.MainGridState;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	public class S_1_017_ApplyWorkflow : SingleTestBase
	{
		#region SetUp and TearDown

		private readonly string dataContainer = Path.Combine("DataContainer", "CoreSmoke", "S_1_017");

		private const string AmlSetupName = "S_1_017_Setup.xml";
		private const string AmlInstanceSetupName = "S_1_017_ItemInstance_Setup.xml";
		private const string AmlCleanupName = "S_1_017_Cleanup.xml";

		private readonly Dictionary<string, string> replacementMap = new Dictionary<string, string>();
		private IActorFacade<IUserInfo> Actor2 { get; set; }

		private string votingComment;
		private WorkflowHistoryReport expectedReport;

		private string localeLabel,
						woodPropertyValue,
						paintColorLabel,
						chairNumberLabel,
						dateCreatedLabel,
						typeOfWoodLabel,
						confirmPathLabel,
						planningActivityLabel,
						confirmingActivityName,
						confirmPathName,
						finishVote,
						inBasketTocPath,
						sourceItemTypeName;

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(dataContainer, "Resources"),
															Settings.CultureInfo);
		}

		protected override void InitActor()
		{
			Actor = SystemActor.AttemptsTo(Create.Actor(UserType.RegularUser));

			var userCarpenter = TestData.Get<UserInfo>("FirstUserInfo");
			var userWoods = TestData.Get<UserInfo>("SecondUserInfo");

			Actor2 = SystemActor.AttemptsTo(Create.Actor(UserType.RegularUser));

			Actor2.ActorInfo.FirstName = userWoods.FirstName;
			Actor2.ActorInfo.LastName = userWoods.LastName;
			Actor2.ActorInfo.LoginName = userWoods.LoginName;
			Actor.AttemptsTo(Update.UserAndIdentityInfo.To(Actor2.ActorInfo));

			replacementMap.Add("{userAliasId2}", Actor2.ActorInfo.AliasId);

			Actor.ActorInfo.FirstName = userCarpenter.FirstName;
			Actor.ActorInfo.LastName = userCarpenter.LastName;
			Actor.ActorInfo.LoginName = userCarpenter.LoginName;
			Actor.ActorInfo.ManagerId = Actor2.ActorInfo.Id;

			Actor.AttemptsTo(Update.UserAndIdentityInfo.To(Actor.ActorInfo));

			replacementMap.Add("{userAliasId1}", Actor.ActorInfo.AliasId);
		}

		protected override void RunSetUpAmls()
		{
			localeLabel = TestData.Get(nameof(localeLabel));
			woodPropertyValue = TestData.Get(nameof(woodPropertyValue));
			chairNumberLabel = TestData.Get(nameof(chairNumberLabel));
			dateCreatedLabel = TestData.Get(nameof(dateCreatedLabel));
			paintColorLabel = TestData.Get(nameof(paintColorLabel));
			typeOfWoodLabel = TestData.Get(nameof(typeOfWoodLabel));
			confirmPathLabel = TestData.Get(nameof(confirmPathLabel));
			planningActivityLabel = TestData.Get(nameof(planningActivityLabel));
			confirmingActivityName = TestData.Get(nameof(confirmingActivityName));
			confirmPathName = TestData.Get(nameof(confirmPathName));
			finishVote = TestData.Get(nameof(finishVote));

			replacementMap.Add("{woodPropertyValue}", woodPropertyValue);
			replacementMap.Add("{chairNumberLabel}", chairNumberLabel);
			replacementMap.Add("{dateCreatedLabel}", dateCreatedLabel);
			replacementMap.Add("{paintColorLabel}", paintColorLabel);
			replacementMap.Add("{typeOfWoodLabel}", typeOfWoodLabel);
			replacementMap.Add("{confirmPathLabel}", confirmPathLabel);
			replacementMap.Add("{planningActivityLabel}", planningActivityLabel);
			replacementMap.Add("{confirmingActivityName}", confirmingActivityName);
			replacementMap.Add("{confirmPathName}", confirmPathName);
			replacementMap.Add("{finishVote}", finishVote);
			replacementMap.Add("{LocaleLabel}", localeLabel);

			SystemActor.AttemptsTo(
				Apply.Aml.FromParameterizedFile(Path.Combine(dataContainer, AmlSetupName), replacementMap));

			replacementMap.Add("{todayDate}", DateTime.Today.ToShortInnovatorDateTimeString(Settings.CultureInfo));

			SystemActor.AttemptsTo(
				Apply.Aml.FromParameterizedFile(Path.Combine(dataContainer, AmlInstanceSetupName), replacementMap));
		}

		protected override void InitTestData()
		{
			sourceItemTypeName = "InBasket Task";

			inBasketTocPath = FormattableString.Invariant($"My Innovator/{sourceItemTypeName}");

			votingComment = FormattableString.Invariant($"Updated by {Actor.ActorInfo.LoginName}");

			expectedReport = new WorkflowHistoryReport
			{
				WfProcessItemName = "A8ADCDE540D24D3FB3F3D00DA2A2E333",
				StartedBy = "Innovator Admin",
				CurrentStatus = "Active"
			};

			expectedReport.Add(new WfHistoryActivity
			{
				Label = planningActivityLabel,
				State = ActivityStatus.Closed.ToString(),
				AssignedTo = Actor.ActorInfo.LoginName,
				CompletedBy = Actor.ActorInfo.LoginName,
				HowVoted = confirmPathName,
				Comments = votingComment
			});

			expectedReport.Add(new WfHistoryActivity
			{
				Label = confirmingActivityName,
				State = ActivityStatus.Active.ToString(),
				AssignedTo = Actor2.ActorInfo.LoginName
			});
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(
				Apply.Aml.FromParameterizedFile(Path.Combine(dataContainer, AmlCleanupName), replacementMap));
		}

		protected override void DisposeActor()
		{
			SystemActor.AttemptsTo(Dispose.Actors(Actor, Actor2));
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
			Apply Workflow
			S-1-017
			1.	Apply WorkFlow
				a.	Log into Innovator as jcarp/jcarp (RegularUser_... - Actor 1).
				b.	Pin the Navigation Panel

				------Applied by AML--------------		
				c.	Hover over a Chairs in TOC -> RMB -> Create New Chair
				d.	Enter:
						i. Type of wood (Type of Wood_木材の種類): Oak (Oak_オーク)
						ii. Chair Number (Chair Number_チェアナンバー): Server Assigned (cannot modify)
						iii. Paint Color (Paint Color_塗装色): Blue
						iv.	Date Created (Date Created_作成日): Today
				e.	Click   and close tab
				------Applied by AML--------------	
				
				f.	Hover over a Chairs in TOC -> Click loupe icon. Click 'Run Search'
				g.	Select just created item in Chairs search grid -> RMB -> Properties
					i.	Confirm Properties dialog appears
				h.	Remember ID and close Properties dialog
				i.	Expand My Innovator and hover over a My InBasket in TOC -> Click loupe icon.
				j.	Select the activity of just created item in My InBasket search grid (by ID number just remembered).
				k.	Right-click on activity and select Complete Task.
					i.	Confirm Workflow Activity Completion dialog appears
				l.	From the Vote dropdown list select “Confirm Path Label” (“Confirm Path Label_パスラベルを確認”).
				m.	Enter Comment: Updated by Joe Carpenter.
				n.	Click Complete button.
					i.	Confirm that the activity no longer appears in My InBasket.
				o.	Select Logout from User Menu.
				p.	Log into Innovator as jwoods/jwoods (RegularUser_... - Actor 2).
				q.	Pin the Navigation Panel.
				r.	Expand My Innovator and hover over a My InBasket in TOC -> Click loupe icon.
				s.	Select the activity in My InBasket search grid you just completed.
				t.	Click on Source Item’s ID to open started Workflow Process. 
					i.	Confirm the Active item is Confirming (Confirming_確認中), it is highlighted in Yellow.
				u.	Click on View Sign-Offs icon.
					i.	Verify that correct Workflow History Report is displayed.
				v.	Close Workflow History Report tab and Workflow Process dialog.
				w.	Right-click on instance in the grid and select Complete Task.
					i.	Confirm Workflow Activity Completion dialog appears
				x.	Select “Finish” (“Finish_終了”) in the Vote dropdown list.
				y.	Click Complete button.
					i.	Confirm that the activity no longer appears in My InBasket search grid.
				z.	Close. 
		")]

		#endregion

		public void S_1_017_ApplyWorkflowTest()
		{
			//TODO delete this after issue IR-077818 "Some columns aren't displayed multilingual label in InBasket" will be fixed
			if (localeLabel.Equals("ja") || localeLabel.Equals("fr"))
			{
				planningActivityLabel = "S_017_Planning";
			}

			//b, f
			Actor.AttemptsTo(
				Open.NavigationPanel,
				Pin.NavigationPanel,
				Open.SearchPanel.OfTocItemWithPath("S1017 Chair").ByLoupeIcon,
				Clear.SearchCriteria.InMainGrid,
				Search.WithCurrentSearchCriteria.InMainGrid);

			//g, h
			var rowNumber = Actor.AsksFor(
				MainGridState.Unfrozen.IndexOfRowByValueInColumn(DateTime.Today.ToShortInnovatorDateString(Settings.CultureInfo),
														dateCreatedLabel + " [...]"));

			var dialogContainer = Actor.AsksFor(SearchPanelContent.DialogsContainer);

			Actor.AttemptsTo(
				Open.Dialog.Properties.FromMainGrid.ByContextMenuOnRow(rowNumber),
				Click.On(PropertiesDialogElements.CopyIdButton(dialogContainer)),
				Close.Dialog(dialogContainer).ByCloseButton);

			//i
			//Now this test is failed here because of I-002119 "Translations of the same resources are different in dif. places"
			Actor.AttemptsTo(
				Open.SearchPanel.OfTocItemWithPath(inBasketTocPath).ByLoupeIcon);

			//j-n
			Actor.AttemptsTo(Open.Dialog.WfActivityCompletion.FromMainGrid.ForActivityWithLabel(planningActivityLabel).
								ByContextMenu);

			var dialogTitle =
				Actor.AsksFor(
					LocaleState.LabelOf.DialogTitle(LocaleKeys.Innovator.Dialog.WfActivityCompletion.Title));

			Actor.ChecksThat(WfActivityCompletionDialogState.Title(dialogContainer),
							Is.EqualTo(dialogTitle));

			Actor.AttemptsTo(Set.VotingTo(confirmPathLabel).InActivityCompletionDialog(dialogContainer),
							Set.Comment(votingComment).InActivityCompletionDialog(dialogContainer),
							Click.On(WfActivityCompletionDialogElements.CompleteButton(dialogContainer)));

			expectedReport.ActivityItems.ElementAt(0).WhenVoted = DateTime.Now;

			Actor.ChecksThat(MainGridState.VisibleRowsCount, Is.EqualTo(0));

			//o, p, q, r
			Actor.AttemptsTo(
				LogOut.FromInnovator,
				LogIn.ToInnovator.As(Actor2.ActorInfo),
				Open.NavigationPanel,
				Pin.NavigationPanel,
				Open.SearchPanel.OfTocItemWithPath(inBasketTocPath).ByLoupeIcon);

			//s
			var columnActivityLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn(sourceItemTypeName, "name"));

			var columnAssignedToLabel =
				string.Concat(Actor.AsksFor(LocaleState.LabelOf.GridColumn(sourceItemTypeName, "assigned_to")),
							" [...]");

			var searchForConfirming = new Dictionary<string, string>
			{
				[columnActivityLabel] = confirmingActivityName,
				[columnAssignedToLabel] = Actor2.ActorInfo.LoginName
			};

			Actor.AttemptsTo(
				Clear.SearchCriteria.InMainGrid,
				Search.Simple.InMainGrid.With(searchForConfirming));

			//t
			var columnSourceItemLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn(sourceItemTypeName, "container"));
			var columnNumber = Actor.AsksFor(MainGridState.Unfrozen.IndexOfColumn(columnSourceItemLabel));
			Actor.AttemptsTo(Open.Dialog.WfProcess.FromMainGrid.ByLinkInCell(1, columnNumber));

			dialogContainer = Actor.AsksFor(SearchPanelContent.DialogsContainer);
			var mapEditor = WfProcessDialogElements.MapEditor(dialogContainer);

			Actor.ChecksThat(MapEditorState.YellowHighlightedElement(mapEditor),
							wfActivity => Assert.AreEqual(wfActivity.Label, confirmingActivityName));

			//u
			Actor.AttemptsTo(
				Click.On(WfProcessDialogElements.ViewSignOffsButton(dialogContainer)),
				Close.Dialog(dialogContainer).ByCloseButton);

			var currentPageContainer = Actor.AsksFor(PagesContent.CurrentPageContainer);

			Actor.ChecksThat(WfHistoryPanelState.WorkflowHistoryReport(currentPageContainer),
							report => Assert.AreEqual(expectedReport, report));

			//v
			Actor.AttemptsTo(Close.Tab.Current);

			//w, x, y
			Actor.AttemptsTo(
				Clear.SearchCriteria.InMainGrid,
				Search.WithCurrentSearchCriteria.InMainGrid,
				Complete.Activity.WithLabel(confirmingActivityName).VotingTo(finishVote).ByContextMenu);

			Actor.ChecksThat(
				MainGridState.Unfrozen.HasItemWithValueInColumn(Actor2.ActorInfo.LoginName, columnAssignedToLabel),
				Is.False);

			//z
			Actor.AttemptsTo(Close.Tab.Current);
		}
	}
}