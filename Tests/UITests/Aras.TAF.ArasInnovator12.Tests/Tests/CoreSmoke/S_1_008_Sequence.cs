using Aras.TAF.ArasInnovator12.Actions.Chains.CloseChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.CreateChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.OpenChains;
using Aras.TAF.ArasInnovator12.Actions.Chains.SaveChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.ApplyChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SearchChains;
using Aras.TAF.ArasInnovatorBase.Actions.Chains.SetChains;
using Aras.TAF.ArasInnovatorBase.Domain;
using Aras.TAF.ArasInnovatorBase.Domain.Locale;
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
	public class S_1_008_Sequence : SingleTestBase
	{
		#region SetUpAndTearDown

		private const string TestDataFolder = @"DataContainer\CoreSmoke\S_1_008";
		private const string NameProp = "name";
		private const string PrefixProp = "prefix";
		private const string CurrentValueProp = "current_value";
		private const string SuffixProp = "suffix";
		private const string PadWithProp = "pad_with";
		private const string PadToProp = "pad_to";
		private const string InitialValueProp = "initial_value";
		private const string StepProp = "step";
		private const string SequenceTocPath = "Administration/Sequence";

		private string namePropertyLabel;

		private Dictionary<string, string> properties, expectedCellsValues;

		protected override TestDataProvider InitTestDataProvider()
		{
			return TestDataProviderFactory.GetDataProvider(Path.Combine(TestDataFolder, "Resources"), Settings.CultureInfo);
		}

		protected override void InitTestData()
		{
			properties = new Dictionary<string, string>
			{
				{NameProp, TestData.Get("NameProp")},
				{PrefixProp, TestData.Get("PrefixProp")},
				{CurrentValueProp, TestData.Get("CurrentValueProp")},
				{SuffixProp, TestData.Get("SuffixProp")},
				{PadWithProp, TestData.Get("PadWithProp")},
				{PadToProp, TestData.Get("PadToProp")},
				{InitialValueProp, TestData.Get("InitialValueProp")},
				{StepProp, TestData.Get("StepProp")}
			};

			const string sequenceItemTypeName = "Sequence";

			expectedCellsValues = new Dictionary<string, string>
			{
				{Actor.AsksFor(LocaleState.LabelOf.GridColumn(sequenceItemTypeName, NameProp)), properties[NameProp]},
				{
					Actor.AsksFor(LocaleState.LabelOf.GridColumn(sequenceItemTypeName, PrefixProp)),
					properties[PrefixProp]
				},
				{
					Actor.AsksFor(LocaleState.LabelOf.GridColumn(sequenceItemTypeName, CurrentValueProp)),
					properties[CurrentValueProp]
				},
				{
					Actor.AsksFor(LocaleState.LabelOf.GridColumn(sequenceItemTypeName, SuffixProp)),
					properties[SuffixProp]
				},
				{
					Actor.AsksFor(LocaleState.LabelOf.GridColumn(sequenceItemTypeName, PadWithProp)),
					properties[PadWithProp]
				},
				{Actor.AsksFor(LocaleState.LabelOf.GridColumn(sequenceItemTypeName, PadToProp)), properties[PadToProp]},
				{
					Actor.AsksFor(LocaleState.LabelOf.GridColumn(sequenceItemTypeName, InitialValueProp)),
					properties[InitialValueProp]
				}
			};

			namePropertyLabel = Actor.AsksFor(LocaleState.LabelOf.GridColumn(sequenceItemTypeName, NameProp));
		}

		protected override void RunTearDownAmls()
		{
			SystemActor.AttemptsTo(Apply.Aml.FromFile(Path.Combine(TestDataFolder, "S_1_008_Cleanup.xml")));
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
		[Description(@"
		1. Create Sequence
			a.	Select Sequences in expanded Administration Tree
			b.	Click the Create New Sequence
			c.	Enter:
				i.	Name: Chair Numbers (Chair Numbers_チェアナンバー)
				ii.	Prefix: 1
				iii.	Initial Value: 0
				iv.	Current Value: 0
				v.	Suffix: A
				vi.	Pad With: K (カ)
				vii.	Pad To: 2
				viii.	Step: 3
			d.	Click Done button to save the sequence.
			e.	Close tabs
				i.	Open created item and confirm that all added data saved successfully
		")]
		public void S_1_008_SequenceTest()
		{
			Actor.AttemptsTo(Create.Item.OfItemType(SequenceTocPath).BySecondaryMenu());

			var form = Actor.AsksFor(ItemPageContent.Form);

			foreach (var property in properties)
			{
				Actor.AttemptsTo(Set.NewValue(property.Value).ForProperty(property.Key).OnForm(form));
			}

			Actor.AttemptsTo(Save.OpenedItem.ByDoneButton(),
							Close.ActiveItemPage.ByCloseButton);

			Actor.AttemptsTo(Open.NavigationPanel,
							Open.SearchPanel.OfTocItemWithPath(SequenceTocPath).BySecondaryMenu,
							Search.Simple.InMainGrid.With(
								new Dictionary<string, string> { [namePropertyLabel] = expectedCellsValues[namePropertyLabel] }));

			Actor.ChecksThat(MainGridState.Unfrozen.CellsValues(1), Is.EquivalentTo(expectedCellsValues));
		}
	}
}