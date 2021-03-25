using System;
using System.Collections.Generic;
using System.Linq;
using NSubstitute;
using NUnit.Framework;
using Aras.IOM;
using CSharpMethods.Methods.GAG_PromoteGECOAffectedItems;
using TestClass = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.CurrentGECOValidator;
using ValidationContext = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.ValidationContext;
using IRelationshipNameProvider = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.IRelationshipNameProvider;
using IGECOProvider = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.IGECOProvider;
using IStep = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.IStep;
using ValidatorInfoModel = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.ValidatorInfoModel;

namespace CSharpMethods.UnitTests.AMLPackages.Grammer.GAG_PromoteGECOAffectedItems
{
	[TestFixture]
	public class CurrentGECOValidator
	{
		private const string TestRelationshipName = "Test relationship";
		private const string StatePropertyKey = "state";
		private const string TestType = "TestType";

		[TestCase("Release")]
		[TestCase("Revise")]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Handle_WhenRelationshipItemsWithAllowedStatesForCurrentGECO_ShouldReturnEmptyErrorCollection(string affectedItemAction)
		{
			//arrange
			var allowedStates = new[]
			{
				"10",
			};

			var tabItems = allowedStates.Select(state =>
			{
				Item item = ItemHelper.CreateItem(TestType, string.Empty);
				item.setProperty(StatePropertyKey, state);
				return item;
			});

			var relationshipItems = new Dictionary<string, IEnumerable<Item>>()
			{
				{ TestRelationshipName , tabItems },
			};

			Item currentGECO = ItemHelper.CreateItem(string.Empty, string.Empty);
			currentGECO.setNewID();

			var validationContext = new ValidationContext(relationshipItems)
			{
				CurrentGECO = currentGECO,
				RootItem = ItemHelper.CreateItem(string.Empty, string.Empty),
			};

			const int expectedErrorCounts = 0;
			IRelationshipNameProvider relationshipNameProvider = Substitute.For<IRelationshipNameProvider>();
			relationshipNameProvider.TabName.Returns(TestRelationshipName);
			Item anotherGECO = ItemHelper.CreateItem(string.Empty, string.Empty);
			anotherGECO.setNewID();
			Item affectedItem = ItemHelper.CreateItem(string.Empty, string.Empty);
			affectedItem.setProperty("gag_action", affectedItemAction);

			IGECOProvider gecoProvider = Substitute.For<IGECOProvider>();
			gecoProvider.GetRelatedGECOs(Arg.Any<Item>()).Returns(new[] { anotherGECO });
			gecoProvider.GECOContainsItem(Arg.Any<Item>(), Arg.Any<string>()).Returns(true);
			gecoProvider.FindAffectedItems(Arg.Any<Item>(), Arg.Any<string>()).Returns(new[] { affectedItem });

			var testClass = new TestClass(nameof(TestClass), gecoProvider, relationshipNameProvider, allowedStates);
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
		public void Handle_WhenRelationshipItemsOnCurrentGECOWithNotAllowedState_ShouldReturnErrorCollection()
		{
			//arrange
			var allowedStates = new[]
			{
				"10",
			};

			Item affectedItem = ItemHelper.CreateItem(string.Empty, string.Empty);
			affectedItem.setProperty("gag_action", "Release");

			Item item = ItemHelper.CreateItem(TestType, string.Empty);
			item.setProperty(StatePropertyKey, "invalid state");
			var relationshipItems = new Dictionary<string, IEnumerable<Item>>()
			{
				{ TestRelationshipName , new []{ item } },
			};

			Item currentGECO = ItemHelper.CreateItem(string.Empty, string.Empty);
			currentGECO.setNewID();

			var validationContext = new ValidationContext(relationshipItems)
			{
				CurrentGECO = currentGECO,
				RootItem = ItemHelper.CreateItem(string.Empty, string.Empty),
			};

			int expectedErrorCounts = allowedStates.Length;
			IRelationshipNameProvider relationshipNameProvider = Substitute.For<IRelationshipNameProvider>();
			relationshipNameProvider.TabName.Returns(TestRelationshipName);
			Item anotherGECO = ItemHelper.CreateItem(string.Empty, string.Empty);
			anotherGECO.setNewID();

			Item[] relatedItems = { anotherGECO };
			IGECOProvider gecoProvider = Substitute.For<IGECOProvider>();
			gecoProvider.GetRelatedGECOs(Arg.Any<Item>()).Returns(relatedItems);
			gecoProvider.GetActualItems(Arg.Any<Item>(), Arg.Any<Item>()).Returns(relatedItems);
			gecoProvider.GECOContainsItem(Arg.Any<Item>(), Arg.Any<string>()).Returns(true);
			gecoProvider.FindAffectedItems(Arg.Any<Item>(), Arg.Any<string>()).Returns(new[] { affectedItem });

			var testClass = new TestClass(nameof(TestClass), gecoProvider, relationshipNameProvider, allowedStates);
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
			var testClass = new TestClass(nameof(TestClass), Substitute.For<IGECOProvider>(), relationshipNameProvider, Array.Empty<string>());

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
			};

			var allowedOtherGECOsStates = new[]
			{
				"10",
				"25",
			};

			var tabItems = allowedStates.Select(state =>
			{
				Item item = ItemHelper.CreateItem(string.Empty, string.Empty);
				item.setProperty(StatePropertyKey, state);
				return item;
			});

			var relationshipItems = new Dictionary<string, IEnumerable<Item>>()
			{
				{ TestRelationshipName , tabItems },
			};

			Item currentGECO = ItemHelper.CreateItem(string.Empty, string.Empty);
			currentGECO.setNewID();

			var validationContext = new ValidationContext(relationshipItems)
			{
				CurrentGECO = currentGECO,
				RootItem = ItemHelper.CreateItem(string.Empty, string.Empty),
			};

			IRelationshipNameProvider relationshipNameProvider = Substitute.For<IRelationshipNameProvider>();
			relationshipNameProvider.TabName.Returns(TestRelationshipName);
			Item anotherGECO = ItemHelper.CreateItem(string.Empty, string.Empty);
			anotherGECO.setNewID();
			Item affectedItem = ItemHelper.CreateItem(string.Empty, string.Empty);
			affectedItem.setProperty("gag_action", "Release");

			IGECOProvider gecoProvider = Substitute.For<IGECOProvider>();
			gecoProvider.GetRelatedGECOs(Arg.Any<Item>()).Returns(new[] { anotherGECO });
			gecoProvider.GECOContainsItem(Arg.Any<Item>(), Arg.Any<string>()).Returns(false);
			gecoProvider.FindAffectedItems(Arg.Any<Item>(), Arg.Any<string>()).Returns(new[] { affectedItem });
			IStep nextStep = Substitute.For<IStep>();

			var testClass = new TestClass(nameof(TestClass), gecoProvider, relationshipNameProvider, allowedStates);
			testClass.SetNext(nextStep);

			//act
			testClass.Handle(validationContext);

			//assert
			nextStep.Received(1).Handle(Arg.Any<ValidationContext>());
		}
	}
}
