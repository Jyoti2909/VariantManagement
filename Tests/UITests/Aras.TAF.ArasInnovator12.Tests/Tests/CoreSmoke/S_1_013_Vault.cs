using Aras.TAF.ArasInnovator12.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.DownloadChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SaveChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SetChains;
using Aras.TAF.ArasInnovator12.Questions.Contents;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SearchChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
using Aras.TAF.ArasInnovatorBase.Extensions;
using Aras.TAF.ArasInnovatorBase.Locators.Dialogs;
using Aras.TAF.ArasInnovatorBase.Models.UserModel;
using Aras.TAF.ArasInnovatorBase.Questions.States;
using Aras.TAF.ArasInnovatorBase.Questions.States.Localization;
using Aras.TAF.Core;
using Aras.TAF.Core.FileActions;
using Aras.TAF.Core.FileQuestions;
using Aras.TAF.Core.NUnit.Extensions;
using Aras.TAF.Core.Selenium.Domain.Enums;
using Aras.TAF.Core.Selenium.Questions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using Close = Aras.TAF.ArasInnovator12.Actions.Chains.CloseChains.Close;
using Select = Aras.TAF.ArasInnovatorBase.Actions.Chains.SelectChains.Select;

namespace Aras.TAF.ArasInnovator12.Tests.Tests.CoreSmoke
{
	[TestFixture]
	public class S_1_013_Vault : SingleTestBase
	{
		#region variables

		private const string FileFolderPath = @"DataContainer\CoreSmoke";
		private const string AmlFolderPath = @"DataContainer\CoreSmoke\S_1_013";
		private const string SetupAmlName = "S_1_013_Setup.xml";
		private const string CleanupAmlName = "S_1_013_Cleanup.xml";
		private const string UploadFolderName = "upload";

		private readonly Dictionary<string, string> replacementMap = new Dictionary<string, string>();

		private string fileName, sourceFilePath, uploadFilePath, workDirPath, typeOfWoodValue, colorValue, dateValue, blueprintColumnLabel;

		private Dictionary<string, string> simpleSearchCriteria, itemTypeProperties;

		#endregion

		protected override void InitInnovatorTestRunSettings()
		{
			base.InitInnovatorTestRunSettings();

			// we don't have an approach to work with files on Mac yet
			if (Settings.ClientOs == ClientOS.Mac)
			{
				Assert.Ignore("Test can't be executed on Mac OS.");
			}
		}

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(AmlFolderPath, "Resources"), Settings.CultureInfo);
		}

		protected override void InitTestData()
		{
			typeOfWoodValue = itemTypeProperties["mapleTypeValue"];

			fileName = TestData.Get("FileName");

			colorValue = TestData.Get("ColorValue");

			dateValue = DateTime.Today.AddDays(1).ToShortInnovatorDateString(Settings.CultureInfo);

			var typeOfWoodColumnLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn("S013 Chair", "wood_type"));

			blueprintColumnLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn("S013 Chair", "blueprint")) + " [...]";

			simpleSearchCriteria = new Dictionary<string, string>
			{
				[typeOfWoodColumnLabel] = typeOfWoodValue
			};

			var sourceDirectoryPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

			sourceFilePath = Path.Combine(sourceDirectoryPath, FileFolderPath, fileName);

			workDirPath = Settings.WorkDir;

			uploadFilePath = Path.Combine(workDirPath, UploadFolderName, fileName);

			Actor.AttemptsTo(Copy.File(sourceFilePath, uploadFilePath));
		}

		protected override void InitActor()
		{
			Actor = SystemActor.AttemptsTo(Create.Actor(UserType.RegularUser));
			replacementMap.Add("{userAliasId}", Actor.ActorInfo.AliasId);
		}

		protected override void RunSetUpAmls()
		{
			itemTypeProperties = TestData.Get<Dictionary<string, string>>("ItemTypeProperties");

			foreach (var property in itemTypeProperties)
			{
				replacementMap.Add(FormattableString.Invariant($"{{{property.Key}}}"), property.Value);
			}

			replacementMap.Add("{LocaleLabel}", TestData.Get("LocaleLabel"));

			SystemActor.AttemptsTo(
				Apply.Aml.FromParameterizedFile(Path.Combine(AmlFolderPath, SetupAmlName), replacementMap));
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(
				Apply.Aml.FromParameterizedFile(Path.Combine(AmlFolderPath, CleanupAmlName), replacementMap));

			var deleteFileAml = FormattableString.Invariant(
				$"<AML><Item type= \"File\" action = \"delete\" where = \"[FILE].created_by_id='{Actor.ActorInfo.Id}'\" /></AML>");

			SystemActor.AttemptsTo(Apply.Aml.FromString(deleteFileAml));

			SystemActor.AttemptsTo(Delete.File(uploadFilePath));
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
			1.	Create Chairs item with attached file
				a.	Hover over a Chairs in TOC -> RMB -> Create New Chair
				b.	Enter:
					i.	Type of wood (Type of Wood_木材の種類): Maple (Maple_紅葉)
					ii.	Chair Number (Chair Number_チェアナンバー): Server Assigned (cannot modify)
					iii. Paint Color (Paint Color_塗装色): Green
					iv.	Date Created (Date Created_作成日): Today +1
					v.	Blueprint (Blueprint_青写真): Click Select file... link and select any .xls(x) file to upload
				c.	Click Done button and close tab
				d.	Hover over a Chairs in TOC -> search Chairs by button
				e.	In main grid check that link text in Blueprint cell is equal selected file.
				f.	Click Manage file property icon in Blueprint (Blueprint_青写真) cell of the item with file in Chairs search grid:
					i.	Ensure Manage File dialog appears
					ii.	“Select new file” and “Delete file” buttons disabled in the dialog
				g.	Click “Download File” icon
					i.	Ensure file downloaded successfully and it is in Downloads directory of current browser 
					(note that dependently on browser’s option “Ask where to save file before downloading” “Save file” dialog can appear beforehand)
				h.	Close the Manage File dialog
				i.	Close tabs")]

		#endregion

		public void S_1_013_VaultTest()
		{
			//a.
			Actor.AttemptsTo(Create.Item.OfItemType("S013 Chair").ByContextMenu);

			//b
			var form = Actor.AsksFor(ItemPageContent.Form);

			Actor.AttemptsTo(Set.NewValue(typeOfWoodValue).ForProperty("wood_type").OnForm(form),
							Select.Option(colorValue).ForDropdownProperty("paint_color").OnForm(form),
							Set.NewValue(dateValue).ForProperty("date_created").OnForm(form));

			//b.v.
			Actor.AttemptsTo(Select.NewFile(uploadFilePath).
									WithSettings(Settings.MachineExecutionContext).
									ForProperty("blueprint").
									ByLinkOnForm(form));

			//c.
			Actor.AttemptsTo(Save.OpenedItem.ByDoneButton(),
							Close.ActiveItemPage.ByCloseButton);

			//d.
			Actor.AttemptsTo(Open.NavigationPanel,
							Open.SearchPanel.OfTocItemWithPath("S013 Chair").ByLoupeIcon,
							Search.Simple.InMainGrid.With(simpleSearchCriteria));

			//e.	In main grid check that link text in Blueprint cell is equal selected file.
			var columnNumberOfBlueprint = Actor.AsksFor(MainGridState.Unfrozen.IndexOfColumn(blueprintColumnLabel));
			Actor.ChecksThat(MainGridState.Unfrozen.CellValue(1, columnNumberOfBlueprint), Is.EqualTo(fileName));

			//f.
			var cell = Actor.AsksFor(MainGridContent.Unfrozen.Cell(1, columnNumberOfBlueprint));
			var dialogContainer = Actor.AsksFor(SearchPanelContent.DialogsContainer);
			Actor.AttemptsTo(Open.Dialog.ManageFile.FromMainGrid.ByManageFilePropertyIconInCell(cell));

			//f.i.
			Actor.VerifiesThat(Visibility.Of(ManageFileDialogElements.Title(dialogContainer)), Is.True);

			//ii.
			Actor.ChecksThat(
				ManageFileDialogState.IsButtonEnabled(ManageFileDialogElements.SelectNewFileButton(dialogContainer)),
				Is.False);

			Actor.ChecksThat(
				ManageFileDialogState.IsButtonEnabled(ManageFileDialogElements.DeleteFileButton(dialogContainer)),
				Is.False);

			//g.
			var targetFilePath = Path.Combine(workDirPath, fileName);
			Actor.AttemptsTo(Download.File.InManageFileDialog(Settings.MachineExecutionContext, dialogContainer, targetFilePath));

			//g.i.
			Actor.ChecksThat(FileState.ExistsAndNotEmpty(targetFilePath), Is.True);
			Actor.AttemptsTo(Delete.File(targetFilePath));

			//h.
			Actor.AttemptsTo(Close.Dialog(dialogContainer).ByCloseButton);

			//h.i.
			Actor.AttemptsTo(Close.Tab.Current);
		}
	}
}