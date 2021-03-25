using NSubstitute;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using Aras.IOM;
using TestClass = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.ItemTabStatesValidator;
using ValidationContext = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.ValidationContext;
using IRelationshipNameProvider = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.IRelationshipNameProvider;
using IStep = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.IStep;
using ValidatorInfoModel = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.ValidatorInfoModel;

namespace CSharpMethods.UnitTests.AMLPackages.Grammer.GAG_PromoteGECOAffectedItems
{
	[TestFixture]
	public class ItemTabStatesValidator
	{
		private const string TestRelationshipName = "Test relationship";
		private const string StatePropertyKey = "state";
		private const string TestType = "TestType";

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Handle_WhenStatesOfThreeRelationshipItemAreNotInAllowedStates_ShouldReturnCollectionWithThreeErrorMessages()
		{
			//arrange
			var invalidStates = new[]
			{
				"15",
				"1",
				"30",
			};

			var allowedStates = new[]
			{
				"10",
				"20",
			};

			int expectedErrorCounts = invalidStates.Length;
			var items = invalidStates.Select(state =>
			{
				Item item = ItemHelper.CreateItem(TestType, string.Empty);
				item.setProperty(StatePropertyKey, state);
				return item;
			});
			var relationshipItems = new Dictionary<string, IEnumerable<Item>>()
			{
				{ TestRelationshipName , items},
			};

			var validationContext = new ValidationContext(relationshipItems)
			{
				CurrentGECO = ItemHelper.CreateItem(string.Empty, string.Empty),
				RootItem = ItemHelper.CreateItem(string.Empty, string.Empty),
			};

			IRelationshipNameProvider relationshipNameProvider = Substitute.For<IRelationshipNameProvider>();
			relationshipNameProvider.TabName.Returns(TestRelationshipName);
			var testClass = new TestClass(nameof(TestClass), relationshipNameProvider, allowedStates);
			IReadOnlyCollection<ValidatorInfoModel> validatorInfo
				= new[]
				{
					new ValidatorInfoModel
					{
						AllowedStates = allowedStates,
						Name = testClass.Name,
						Type = TestType,
					},
				};

			StepHelper.ApplyFinalStep(testClass, validatorInfo);

			//act
			IList<string> result = testClass.Handle(validationContext).ToList();

			//assert
			Assert.AreEqual(expectedErrorCounts, result.Count);
		}

		[TestCase("10")]
		[TestCase("20")]
		[TestCase("10", "20")]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Handle_WhenStateOfRelationshipItems_ShouldReturnEmptyCollection(params string[] states)
		{
			//arrange
			var allowedStates = new[]
			{
				"10",
				"20",
			};

			const int expectedErrorCounts = 0;
			var items = states.Select(state =>
			{
				Item item = ItemHelper.CreateItem(TestType, string.Empty);
				item.setProperty(StatePropertyKey, state);
				return item;
			});
			var relationshipItems = new Dictionary<string, IEnumerable<Item>>()
			{
				{ TestRelationshipName , items},
			};

			var validationContext = new ValidationContext(relationshipItems)
			{
				CurrentGECO = ItemHelper.CreateItem(string.Empty, string.Empty),
				RootItem = ItemHelper.CreateItem(string.Empty, string.Empty),
			};

			IRelationshipNameProvider relationshipNameProvider = Substitute.For<IRelationshipNameProvider>();
			relationshipNameProvider.TabName.Returns(TestRelationshipName);
			var testClass = new TestClass(nameof(TestClass), relationshipNameProvider, allowedStates);
			IReadOnlyCollection<ValidatorInfoModel> validatorInfo
				= new[]
				{
					new ValidatorInfoModel
					{
						AllowedStates = allowedStates,
						Name = testClass.Name,
						Type = TestType,
					},
				};

			StepHelper.ApplyFinalStep(testClass, validatorInfo);
			//act
			IList<string> result = testClass.Handle(validationContext).ToList();

			//assert
			Assert.AreEqual(expectedErrorCounts, result.Count);
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Handle_WhenValidationContextDoesNotHaveRelationshipItems_ShouldThrowInvalidOperationException()
		{
			//arrange
			var relationshipItems = new Dictionary<string, IEnumerable<Item>>()
			{
				{ TestRelationshipName , Array.Empty<Item>()},
			};

			var validationContext = new ValidationContext(relationshipItems)
			{
				CurrentGECO = ItemHelper.CreateItem(string.Empty, string.Empty),
				RootItem = ItemHelper.CreateItem(string.Empty, string.Empty),
			};

			IRelationshipNameProvider relationshipNameProvider = Substitute.For<IRelationshipNameProvider>();
			relationshipNameProvider.TabName.Returns("Another relationship name");
			var testClass = new TestClass(nameof(TestClass), relationshipNameProvider, Array.Empty<string>());

			//act
			//assert
			Assert.Throws<InvalidOperationException>(() => testClass.Handle(validationContext));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Handle_WhenNextStepIsDefined_ShouldCallNextStep()
		{
			//arrange
			var allowedStates = new[]
			{
				"10",
				"20",
			};

			var items = allowedStates.Select(state =>
			{
				Item item = ItemHelper.CreateItem("Test item", string.Empty);
				item.setProperty(StatePropertyKey, state);
				return item;
			});
			var relationshipItems = new Dictionary<string, IEnumerable<Item>>()
			{
				{ TestRelationshipName , items},
			};

			var validationContext = new ValidationContext(relationshipItems)
			{
				CurrentGECO = ItemHelper.CreateItem(string.Empty, string.Empty),
				RootItem = ItemHelper.CreateItem(string.Empty, string.Empty),
			};

			IRelationshipNameProvider relationshipNameProvider = Substitute.For<IRelationshipNameProvider>();
			relationshipNameProvider.TabName.Returns(TestRelationshipName);
			IStep nextStep = Substitute.For<IStep>();

			var testClass = new TestClass(nameof(TestClass), relationshipNameProvider, allowedStates);
			testClass.SetNext(nextStep);

			//act
			testClass.Handle(validationContext);

			//assert
			nextStep.Received(1).Handle(Arg.Any<ValidationContext>());
		}
	}
}
