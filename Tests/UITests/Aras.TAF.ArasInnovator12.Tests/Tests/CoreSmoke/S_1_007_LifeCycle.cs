using Aras.TAF.ArasInnovator12.Actions.Chains.AddChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.FillChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SaveChains;
using Aras.TAF.ArasInnovator12.Questions.States;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SearchChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
using Aras.TAF.ArasInnovatorBase.Models.MapModel.LifeCycle;
using Aras.TAF.ArasInnovatorBase.Questions.States.Localization;
using Aras.TAF.Core;
using Aras.TAF.Core.NUnit.Extensions;
using Aras.TAF.Core.Selenium;
using Aras.TAF.Core.Selenium.Questions;
using NUnit.Framework;
using OpenQA.Selenium;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Aras.TAF.ArasInnovatorBase.Questions.States;
using Select = Aras.TAF.ArasInnovator12.Actions.Chains.SelectChains.Select;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	[TestFixture]
	public class S_1_007_Lifecycle : SingleTestBase
	{
		#region testData

		private const string FileFolder = @"DataContainer\CoreSmoke\S_1_007";

		private readonly string amlSetupPath = Path.Combine(FileFolder, "S_1_007_Setup.xml");
		private readonly string amlCleanupPath = Path.Combine(FileFolder, "S_1_007_Cleanup.xml");

		private readonly Dictionary<string, string> replacementMap = new Dictionary<string, string>();

		private Dictionary<string, string> searchData;

		private string shopWorkersPermissionName;
		private string lcmPermissionName;

		private const string TocPath = "Administration/Life Cycle Map";

		private LifeCycleMap lifeCycleMap;
		private LifeCycleState startState;
		private LifeCycleState confirmingState;
		private LifeCycleState creatingState;
		private LifeCycleState completedState;
		private LifeCycleTransition startConfirmTransition;
		private LifeCycleTransition confirmCreatingTransition;
		private LifeCycleTransition creatingCompletedTransition;

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(FileFolder, "Resources"), Settings.CultureInfo);
		}

		protected override void InitTestData()
		{
			startState = new LifeCycleState(TestData.Get("StartName"), 20, 20);

			confirmingState = new LifeCycleState(TestData.Get("ConfirmingName"), 300, 20)
			{
				Label = TestData.Get("ConfirmingLabel"),
				Icon = "PackageDefinition.svg",
				Permissions = shopWorkersPermissionName
			};

			creatingState = new LifeCycleState(TestData.Get("CreatingName"), 600, 20)
			{
				Permissions = shopWorkersPermissionName
			};

			completedState = new LifeCycleState(TestData.Get("CompletedName"), 900, 20)
			{
				Label = TestData.Get("CompletedLabel"),
				Permissions = lcmPermissionName
			};

			startConfirmTransition = new LifeCycleTransition(startState, confirmingState)
			{
				Role = Actor.ActorInfo.LoginName
			};

			confirmCreatingTransition = new LifeCycleTransition(confirmingState, creatingState)
			{
				Role = "Innovator Admin"
			};

			creatingCompletedTransition = new LifeCycleTransition(creatingState, completedState)
			{
				Role = Actor.ActorInfo.LoginName
			};

			lifeCycleMap = new LifeCycleMap(TestData.Get("MapName"))
			{
				Description = TestData.Get("MapDescription"),
				States = new List<LifeCycleState> { startState, confirmingState, creatingState, completedState },
				Transitions = new List<LifeCycleTransition> { startConfirmTransition, confirmCreatingTransition, creatingCompletedTransition }
			};

			var lifeCycleMapColumnLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn("Life Cycle Map", "name"));

			searchData = new Dictionary<string, string>
			{
				[lifeCycleMapColumnLabel] = lifeCycleMap.Name
			};
		}

		protected override void RunSetUpAmls()
		{
			shopWorkersPermissionName = TestData.Get("ShopWorkerPermissionName");
			lcmPermissionName = TestData.Get("LcmPermissionName");

			replacementMap.Add("{shopWorkerPermissionName}", shopWorkersPermissionName);
			replacementMap.Add("{lcmPermissionName}", lcmPermissionName);

			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(amlSetupPath, replacementMap));
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(amlCleanupPath, replacementMap));
		}

		#endregion

		#region testDescription

		[Test]
		[Category(TestCategories.Product.Innovator12)]
		[Category(TestCategories.Product.Innovator12Sp1)]
		[Category(TestCategories.Product.Innovator12Sp2)]
		[Category(TestCategories.Product.Innovator12Sp3)]
		[Category(TestCategories.Product.Innovator12Sp4)]
		[Category(TestCategories.Product.Innovator12Sp5)]
		[Category(TestCategories.Product.Innovator12Sp6)]
		[Description(@"4.7	Lifecycle
				Test #	S-1-007
				Purpose:	to create a simple life cycle

				a.	Select Life Cycle Maps in expanded Administration Tree
				b.	Click the Create New Life Cycle Map
				c.	Enter:
					•	Name: Chair Life Cycle
					•	Description: Life cycle of a chair.
				d.	Right Click on the map / Add State (Add 3 new states)
				e.	Right click on the start state, select Add Transition, drag the arrow to the 2nd state and click on it. Repeat until all states are connected:
				f.	Select the 2nd state:
					•	Name: Confirming
					•	English Label: Confirming State Label
					•	Image: Select an image -> Select Innovator tab, Images. Double-click an image icon
					•	Select State Permissions, F2 in the field, search and add ShopWorkersForLCM
				g.	Select the 3rd state:
					•	Name: Creating
					•	Select State Permissions, click ellipse button, search and add ShopWorkersForLCM
				h.	Select the 4th state:
					•	Name: Completed
					•	English Label: Completed State Label
					•	Select State Permissions, search and add Jane Woods
				i.	Select the arrow between Start and Confirming
					•	Select the Transition tab
					•	Set the Role to Jane Woods
				j.	Select the arrow between Confirming and Creating
					•	Select the Transition tab
					•	Set the Role to Joe Carpenter
				k.	Select the arrow between Creating and Completed
					•	Select the Transition tab
					•	Set the Role to Jane Woods
				l.	Click (Save, Unlock and Close)
				m.	Search and open created item in Life Cycle Maps Search Grid
					i.	Confirm that the item with all added data saved successfully
		")]

		#endregion

		public void S_1_007_LifecycleTest()
		{
			//1a,b.
			Actor.AttemptsTo(Create.Item.OfItemType(TocPath).BySecondaryMenu());

			//c.
			Actor.AttemptsTo(Fill.LifeCycleMapProperties.With(lifeCycleMap));

			//d.	Right Click on the map / Add State (Add 3 new states)
			Actor.AttemptsTo(
				Add.LifeCycleState(confirmingState).InMapEditor,
				Add.LifeCycleState(creatingState).InMapEditor,
				Add.LifeCycleState(completedState).InMapEditor
			);

			//e.	Right click on the start state, select Add Transition ... Repeat until all states are connected
			Actor.AttemptsTo(
				Add.LifeCycleTransition(startConfirmTransition).InMapEditor,
				Add.LifeCycleTransition(confirmCreatingTransition).InMapEditor,
				Add.LifeCycleTransition(creatingCompletedTransition).InMapEditor
			);

			//f.	Select the 2nd state:  --> h.	Select the 4th state:
			SelectAndFillState(confirmingState, creatingState, completedState);

			CheckLabels(false);

			//i.	Select the arrow between Start and Confirming --> k.	Select the arrow between Creating and Completed
			SelectAndFillTransition(startConfirmTransition, confirmCreatingTransition, creatingCompletedTransition);

			//l.	Click (Save, Unlock and Close)
			Actor.AttemptsTo(
				Save.OpenedItem.BySaveUnlockAndCloseButton);

			//m.	Search and open created item in Life Cycle Maps Search Grid
			Actor.AttemptsTo(Open.NavigationPanel,
				Open.SearchPanel.OfTocItemWithPath(TocPath).ByLoupeIcon,
				Search.Simple.InMainGrid.With(searchData),
				Open.Item.InMainGrid.WithRowNumber(1).ByContextMenu.ForView
				);

			//i.	Confirm that item with all added data saved successfully
			Actor.ChecksThat(LifeCyclePageState.SavedData,
							mapData =>
							{
								Assert.AreEqual(lifeCycleMap, mapData);
								Assert.IsTrue(lifeCycleMap.States.SequenceEqual(mapData.States));
								Assert.IsTrue(lifeCycleMap.Transitions.SequenceEqual(mapData.Transitions));
							});

			CheckLabels(true);
		}

		private void CheckLabels(bool isItemSaved)
		{
			var selectedState = Actor.AttemptsTo(Select.LifeCycleState(confirmingState));
			var expectedLabel = isItemSaved ? confirmingState.Label : confirmingState.Name;
			CheckLabelOfElement(selectedState, expectedLabel);

			var selectedTransition = Actor.AttemptsTo(Select.LifeCycleTransition(startConfirmTransition));
			expectedLabel = isItemSaved ? startConfirmTransition.Role : string.Empty;
			CheckLabelOfElement(selectedTransition, expectedLabel);
		}

		private void CheckLabelOfElement(ITarget element, string expectedLabel)
		{
			var labelContainer = Actor.AsksFor(Children.Of(element).Located(By.TagName("text"))).First();
			Actor.ChecksThat(TextContent.Of(labelContainer), Is.EqualTo(expectedLabel));
		}

		private void SelectAndFillState(params LifeCycleState[] stateModels)
		{
			foreach (var state in stateModels)
			{
				Actor.AttemptsTo(Select.LifeCycleState(state));
				Actor.AttemptsTo(Fill.LifeCycleStateProperties.With(state));
			}
		}

		private void SelectAndFillTransition(params LifeCycleTransition[] transitionModel)
		{
			foreach (var transition in transitionModel)
			{
				Actor.AttemptsTo(Select.LifeCycleTransition(transition));
				Actor.AttemptsTo(Fill.LifeCycleTransitionProperties.With(transition));
			}
		}
	}
}
