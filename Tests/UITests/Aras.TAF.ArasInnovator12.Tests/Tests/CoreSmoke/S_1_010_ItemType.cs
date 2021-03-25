using Aras.TAF.ArasInnovator12.Actions.Chains.AddChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.CloseChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.PinChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SaveChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SelectChains;
using Aras.TAF.ArasInnovator12.Locators.NavigationPanel;
using Aras.TAF.ArasInnovator12.Questions.States;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SetChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Enums;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
using Aras.TAF.ArasInnovatorBase.Locators;
using Aras.TAF.ArasInnovatorBase.Models.ItemTypeModels;
using Aras.TAF.ArasInnovatorBase.Models.RelationshipsPanelModel;
using Aras.TAF.ArasInnovatorBase.Models.TocModel;
using Aras.TAF.ArasInnovatorBase.Models.UserModel;
using Aras.TAF.ArasInnovatorBase.Questions.Contents;
using Aras.TAF.ArasInnovatorBase.Questions.States.Localization;
using Aras.TAF.Core;
using Aras.TAF.Core.NUnit.Extensions;
using Aras.TAF.Core.Selenium.Questions;
using NUnit.Framework;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	[TestFixture]
	public class S_1_010_ItemType : SingleTestBase
	{
		#region SetUp & TearDown

		private readonly string dataContainer = Path.Combine("DataContainer", "CoreSmoke", "S_1_010");
		private ItemTypeModel chairItemType;
		private System.Drawing.Size smallIconSize, largeIconSize;

		private List<ItemTypePropertyModel> itemProperties;

		private ItemTypePropertyModel woodTypeProperties,
									chairNumberProperties,
									paintColorProperties,
									dateCreatedProperties,
									blueprintProperties,
									woodTypePropertyTestData,
									chairNumberPropertyTestData,
									paintColorPropertyTestData;

		private List<(string RelationshipName, string DataItemType, string Value)> relatedItemData;
		private readonly Dictionary<string, string> replacementMap = new Dictionary<string, string>();
		private List<string> expectedColumnNames;

		private string openIconProperty;
		private string largeIconProperty;
		private string shopWorkersIdentity;
		private string shopWorkersPermission;
		private string chairLifeCycle;
		private string chairWorkflow;
		private string administrationLabel;
		private string itemTypeLabel;
		private string createNewOption;
		private string searchOption;

		private const string ItemName = "ChairItemTypeTest";
		private const string WoodTypeProperty = "wood_type";
		private const string ChairNumberProperty = "chair_number";
		private const string PaintColorProperty = "paint_color";
		private const string DateCreatedProperty = "date_created";
		private const string BlueprintProperty = "blueprint";

		private RelationshipsPanel relationshipsPanel;

		protected override void InitActor()
		{
			Actor = SystemActor.AttemptsTo(Create.Actor(UserType.Admin));
			replacementMap.Add("{userAliasId}", Actor.ActorInfo.AliasId);
		}

		protected override void InitTestData()
		{
			openIconProperty = "open_icon";
			largeIconProperty = "large_icon";
			administrationLabel = TestData.Get("AdministrationLabel");
			itemTypeLabel = TestData.Get("ItemTypeLabel");

			chairItemType = new ItemTypeModel(ItemName)
			{
				SingularLabel = TestData.Get<ItemTypeModel>(ItemName).SingularLabel,
				PluralLabel = TestData.Get<ItemTypeModel>(ItemName).PluralLabel,
				SmallIcon = "3DViewerOn.svg",
				LargeIcon = "3DViewerOn.svg"
			};

			smallIconSize = new System.Drawing.Size
			{ Height = 16, Width = 16 };

			largeIconSize = new System.Drawing.Size
			{ Height = 32, Width = 32 };

			woodTypeProperties = new ItemTypePropertyModel(WoodTypeProperty)
			{
				Label = woodTypePropertyTestData.Label,
				DataType = PropertyDataType.List,
				DataSource = woodTypePropertyTestData.DataSource,
				Required = true
			};

			chairNumberProperties = new ItemTypePropertyModel(ChairNumberProperty)
			{
				Label = chairNumberPropertyTestData.Label,
				DataType = PropertyDataType.Sequence,
				DataSource = chairNumberPropertyTestData.DataSource
			};

			paintColorProperties = new ItemTypePropertyModel(PaintColorProperty)
			{
				Label = paintColorPropertyTestData.Label,
				DataType = PropertyDataType.Color_List,
				DataSource = paintColorPropertyTestData.DataSource,
				Required = true
			};

			dateCreatedProperties = new ItemTypePropertyModel(DateCreatedProperty)
			{
				Label = TestData.Get<ItemTypePropertyModel>(DateCreatedProperty).Label,
				DataType = PropertyDataType.Date,
				Pattern = TestData.Get<ItemTypePropertyModel>(DateCreatedProperty).Pattern,
				Required = true
			};

			blueprintProperties = new ItemTypePropertyModel(BlueprintProperty)
			{
				Label = TestData.Get<ItemTypePropertyModel>(BlueprintProperty).Label,
				DataType = PropertyDataType.Item,
				DataSource = "File"
			};

			itemProperties = new List<ItemTypePropertyModel>(new[]
			{
				woodTypeProperties,
				chairNumberProperties,
				paintColorProperties,
				dateCreatedProperties,
				blueprintProperties
			});

			relatedItemData = new List<(string RelationshipName, string DataItemType, string Value)>()
			{
				("ItemType Life Cycle", "Life Cycle Map", chairLifeCycle),
				("Allowed Workflow", "Workflow Map", chairWorkflow),
				("TOC Access", "Identity", shopWorkersIdentity),
				("Can Add", "Identity", shopWorkersIdentity),
				("Allowed Permission", "Permission", shopWorkersPermission)
			};

			var columnWithItemPickerNameExtension = " [...]";

			expectedColumnNames = new List<string>
			{
				woodTypeProperties.Label, chairNumberProperties.Label, paintColorProperties.Label,
				dateCreatedProperties.Label + columnWithItemPickerNameExtension,
				blueprintProperties.Label + columnWithItemPickerNameExtension
			};

			createNewOption = string.Format(Settings.CultureInfo,
											Actor.AsksFor(LocaleState.LabelOf.SecondaryMenuOption(
															LocaleKeys.Innovator.SecondaryMenu.CreateNew)),
											chairItemType.SingularLabel);

			searchOption = string.Format(Settings.CultureInfo,
										Actor.AsksFor(LocaleState.LabelOf.SecondaryMenuOption(
														LocaleKeys.Innovator.SecondaryMenu.Search)),
										chairItemType.PluralLabel);
		}

		protected override void RunSetUpAmls()
		{
			woodTypePropertyTestData = TestData.Get<ItemTypePropertyModel>(WoodTypeProperty);
			chairNumberPropertyTestData = TestData.Get<ItemTypePropertyModel>(ChairNumberProperty);
			paintColorPropertyTestData = TestData.Get<ItemTypePropertyModel>(PaintColorProperty);

			shopWorkersIdentity = TestData.Get("ShopWorkersIdentity");
			shopWorkersPermission = TestData.Get("ShopWorkersPermission");
			chairLifeCycle = TestData.Get("ChairLifeCycle");
			chairWorkflow = TestData.Get("ChairWorkflow");

			replacementMap.Add("{shopWorkersIdentity}", shopWorkersIdentity);
			replacementMap.Add("{shopWorkersPermission}", shopWorkersPermission);
			replacementMap.Add("{chairLifeCycle}", chairLifeCycle);
			replacementMap.Add("{chairWorkflow}", chairWorkflow);

			replacementMap.Add("{woodTypeDataSource}", woodTypePropertyTestData.DataSource);
			replacementMap.Add("{paintColorDataSource}", paintColorPropertyTestData.DataSource);
			replacementMap.Add("{chairNumberDataSource}", chairNumberPropertyTestData.DataSource);

			SystemActor.AttemptsTo(
				Apply.Aml.FromParameterizedFile(Path.Combine(dataContainer, "S_1_010_Setup.xml"), replacementMap));
		}

		protected override TestDataProvider InitTestDataProvider()
		{
			const string filenamePattern = "S_1_010_{0}{1}.json";

			var languagePostfix = Settings.CultureInfo.ToString().Substring(0, 2);

			var versionPostfix =
				(Settings.CultureInfo.Equals(new CultureInfo("ja-JP")) &&
				Settings.InnovatorVersion >= InnovatorVersion.I12Sp3)
					? "_sp3"
					: string.Empty;

			var assemblyDir = Path.GetDirectoryName(typeof(TestDataProviderFactory).Assembly.Location);
			var filename = string.Format(CultureInfo.InvariantCulture, filenamePattern, languagePostfix, versionPostfix);
			var folderName = Path.Combine(dataContainer, "Resources");
			var filePath = Path.Combine(assemblyDir, folderName, filename);

			return new TestDataProvider(filePath, Settings.CultureInfo);
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(Apply.Aml.FromParameterizedFile(
										Path.Combine(dataContainer, "S_1_010_Cleanup.xml"),
										replacementMap));
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
			S-1-010 Item Type
				Preconditions:
					a.	Log into Innovator as Admin
					b.	Pin Navigation Panel
				Scenario:
				1.	Create ItemType:
					a.	Select ItemTypes in expanded Administration Tree
					b.	Click the Create New ItemType
					c.	Enter:
						i.	Name: Chair
						ii.	Singular Label: Chair (Chair_椅子)
						iii.	Plural Label: Chairs (Chairs_多くの椅子)
						iv.	Small Icon: Select an Image: Select Innovator tab, Images, and choose any image icon
						v.	Large Icon: Select an Image: Select Innovator tab, Images and choose any image icon
							Ensure that selected images are displayed. Small icon size is 16*16. Large icon size is 64*64.

					d.	In the properties tab click on 'Add Row' button
						i.	Name: wood_type
						ii.	Label: Type of Wood (Type of Wood_木材の種類)
						iii.	Data Type: List
						iv.	Data Source: Type of Wood (Type of Wood_木材の種類) (which we created earlier)

					e.	In the properties tab click on 'Add Row' button
						i.	Name: chair_number
						ii.	Label: Chair Number (Chair Number_チェアナンバー)
						iii.	Data Type: Sequence
						iv.	Data Source: Chair Numbers (Chair Numbers_チェアナンバー)

					f.	In the properties tab click on 'Add Row' button
						i.	Name: paint_color
						ii.	Label: Paint Color (Paint Color_塗装色)
						iii.	Data Type: Color List
						iv.	Data Source: Paint Color (Paint Color_塗装色)

					g.	In the properties tab click on 'Add Row' button
						i.	Name: date_created
						ii.	Label: Date Created (Date Created_作成日)
						iii.	Data Type: Date
						iv.	Pattern: Short Date

					h.	In the properties tab click on 'Add Row' button
						i.	Name: blueprint
						ii.	Label: Blueprint (Blueprint_青写真)
						iii.	Data Type: Item
						iv.	Data Source: File (Type it in)

					i.	Check the Required Check box for: Type of Wood, Paint Color, Date Created
					j.	Select the Life Cycles tab
						i.	Click on 'Select Items' button and add ChairLifeCycleS1010 (ChairLifeCycleS1010_椅子のライフサイクル)

					k.	Select the WorkFlows tab
						i.	Click on 'Select Items' button and add ChairWorkflowS1010 (ChairWorkflowS1010_議長のワークフロー)
						ii.	Check 'Default'

					l.	Select the TOC Access tab
						i.	Click on 'Select Items' button and add Shop Workers S1010 (Shop Workers S1010_店員)

					m.	Select the Can Add tab
						i.	Click on 'Select Items' button and add Shop Workers S1010 (Shop Workers S1010_店員)

					n.	Select the Permissions tab
						i.	Click on 'Select Items' button and add ShopWorkersForIT S1010 (ShopWorkersForIT S1010_私のための店員)
						ii.	Check 'Is Default' check-box

					o.	Click 'Done' and close tab
					P.	Select Chairs in TOC.
						i. Verify TOC label is Chairs (Chairs_多くの椅子).
						ii. Verify labels in secondary menu.
						iii.Verify column names in Chair grid.
					q.	Close tabs and return to primary Menu TOC
		")]

		#endregion

		public void S_1_010_ItemTypeTest()
		{
			//Preconditions:
			Actor.AttemptsTo(
				Open.NavigationPanel,
				Pin.NavigationPanel
			);

			//Scenario:
			//a,b
			var tocFromUI = NavigationPanelState.TocFromUi;

			Actor.ChecksThat(tocFromUI,
				x =>
				{
					CollectionAssert.Contains(x.Content.Select(node => node.Label).ToList(),
						administrationLabel);

					Assert.IsTrue(IsItemTypeInToc(x, administrationLabel, itemTypeLabel));
				});

			Actor.AttemptsTo(Create.Item.OfItemType("Administration/ItemType").BySecondaryMenu());

			//c.i - c.iii
			var form = Actor.AsksFor(ItemPageContent.Form);

			Actor.AttemptsTo(
				Set.NewValue(chairItemType.Name).ForProperty("name").OnForm(form),
				Set.NewValue(chairItemType.SingularLabel).ForProperty("label").OnForm(form),
				Set.NewValue(chairItemType.PluralLabel).ForProperty("label_plural").OnForm(form)
			);

			//c.iv - c.v
			var dialogContainer = Actor.AsksFor(ItemPageContent.DialogsContainer);

			Actor.AttemptsTo(
				Open.Dialog.Image.FromForm(form).ForProperty(openIconProperty),
				Select.InnovatorIcon.InImageDialog(dialogContainer).ById(chairItemType.SmallIcon),
				Open.Dialog.Image.FromForm(form).ForProperty(largeIconProperty),
				Select.InnovatorIcon.InImageDialog(dialogContainer).ById(chairItemType.LargeIcon)
			);

			//Ensure that selected images are displayed. Small icon size is 16*16. Large icon size is 64*64.
			Actor.ChecksThat(HtmlAttribute.Of(BaseFormElements.ImageOfField(openIconProperty, form)).Named("src"),
							Does.Contain(chairItemType.SmallIcon));

			Actor.ChecksThat(Size.Of(BaseFormElements.ImageOfField(openIconProperty, form)),
							Is.EqualTo(smallIconSize));

			Actor.ChecksThat(HtmlAttribute.Of(BaseFormElements.ImageOfField(largeIconProperty, form)).Named("src"),
							Does.Contain(chairItemType.LargeIcon));

			Actor.ChecksThat(Size.Of(BaseFormElements.ImageOfField(largeIconProperty, form)),
							Is.EqualTo(largeIconSize));

			//d - i
			foreach (var property in itemProperties)
			{
				Actor.AttemptsTo(Add.Property.ToItemType.With(property));
			}

			relationshipsPanel = Actor.AsksFor(ItemPageContent.RelationshipsPanel);

			//j - n
			foreach (var (tabName, dataItemType, value) in relatedItemData)
			{
				var tabLabel = Actor.AsksFor(LocaleState.LabelOf.RelationshipTab(tabName));

				Actor.AttemptsTo(Select.RelationshipTab.WithName(tabLabel).InRelationshipsPanel(relationshipsPanel));

				var searchDialogColumnLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn(dataItemType, "name"));

				Actor.AttemptsTo(Create.Relationship.InRelationshipsPanel(relationshipsPanel).
										ViaSelectItems(
											new Dictionary<string, string> { { searchDialogColumnLabel, value } }).
										ByReturnSelected);

				//Set Default checkbox for workflow and IsDefault for permission
				if (tabName.Contains("Workflow") || tabName.Contains("Permission"))
					SetDefaultFor(tabName);
			}

			//o
			Actor.AttemptsTo(
				Save.OpenedItem.ByDoneButton(),
				Close.ActiveItemPage.ByCloseButton
			);

			//p
			Actor.AttemptsTo(Open.SecondaryMenu.OfTocItemWithPath(ItemName));

			Actor.ChecksThat(TextContent.Of(NavigationPanelElements.CreateNewButton), Is.EqualTo(createNewOption));
			Actor.ChecksThat(TextContent.Of(NavigationPanelElements.SearchButton), Is.EqualTo(searchOption));
			Actor.ChecksThat(TextContent.Of(NavigationPanelElements.Header), Is.EqualTo(chairItemType.PluralLabel));

			Actor.AttemptsTo(Open.SearchPanel.OfCurrentItemType.BySelectedSecondaryMenu);

			Actor.ChecksThat(tocFromUI, x => Assert.Contains(chairItemType.PluralLabel, x.Content.Select(node => node.Label).ToList()));
			Actor.ChecksThat(MainGridState.Unfrozen.ColumnsNames, Is.EquivalentTo(expectedColumnNames));

			//q
			Actor.AttemptsTo(Close.ActiveItemPage.ByCloseButton);
		}

		private bool IsItemTypeInToc(Toc toc, string tocNodeName, string itemTypeName)
		{
			var tocItem = toc.Content.FirstOrDefault(node => node.Label.Contains(tocNodeName));
			var relatedItem = tocItem?.Relationships.RelatedItems.FirstOrDefault(it => it.RelatedId.Item.Label == itemTypeName);

			return !(relatedItem is null);
		}

		private void SetDefaultFor(string tabName)
		{
			var columnLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn(tabName, "is_default"));

			Actor.AttemptsTo(Set.NewValue(true).
								ForCheckboxInCell(1, columnLabel).
								OfRelationshipGrid(relationshipsPanel));
		}
	}
}
