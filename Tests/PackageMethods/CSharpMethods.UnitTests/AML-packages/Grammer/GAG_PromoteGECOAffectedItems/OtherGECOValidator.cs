using System;
using System.Collections.Generic;
using System.Linq;
using NSubstitute;
using NUnit.Framework;
using Aras.IOM;
using TestClass = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.OtherGECOValidator;
using ValidationContext = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.ValidationContext;
using IRelationshipNameProvider = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.IRelationshipNameProvider;
using IGECOProvider = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.IGECOProvider;
using IStep = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.IStep;
using ValidatorInfoModel = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.ValidatorInfoModel;

namespace CSharpMethods.UnitTests.AMLPackages.Grammer.GAG_PromoteGECOAffectedItems
{
	[TestFixture]
	public class OtherGECOValidator
	{
		private const string TestRelationshipName = "Test relationship";
		private const string StatePropertyKey = "state";
		private const string TestType = "TestType";

		[TestCase("Release")]
		[TestCase("Revise")]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Handle_WhenRelationshipItemsWithAllowedStatesContainsOnOtherActiveGECOsWithNotCadReleaseClassification_ShouldReturnCollectionWithMessages(string affectedItemAction)
		{
			//arrange
			var states = new[]
			{
				"10",
				"20",
			};

			var tabItems = states.Select(state =>
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

			Item affectedItem = ItemHelper.CreateItem(string.Empty, string.Empty);
			affectedItem.setProperty("gag_action", affectedItemAction);

			int expectedErrorCounts = states.Length;
			IRelationshipNameProvider relationshipNameProvider = Substitute.For<IRelationshipNameProvider>();
			relationshipNameProvider.TabName.Returns(TestRelationshipName);
			Item anotherGECO = ItemHelper.CreateItem(string.Empty, string.Empty);
			anotherGECO.setNewID();
			anotherGECO.setProperty("classification", "invalid classification");

			IGECOProvider gecoProvider = Substitute.For<IGECOProvider>();
			gecoProvider.GetRelatedGECOs(Arg.Any<Item>()).Returns(new[] { anotherGECO });
			gecoProvider.GECOIsActive(Arg.Any<Item>()).Returns(true);
			gecoProvider.FindAffectedItems(Arg.Any<Item>(), Arg.Any<string>()).Returns(new[] { affectedItem });

			string[] availableClassifications = { "available classification" };
			var testClass = new TestClass(nameof(TestClass), gecoProvider, relationshipNameProvider, availableClassifications, states);
			IReadOnlyCollection<ValidatorInfoModel> validatorInfo
				= new[]
				{
					new ValidatorInfoModel
					{
						AllowedStates = states,
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

		[TestCase("Release")]
		[TestCase("Revise")]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Handle_WhenRelationshipItemsWithAllowedStatesContainsOnOtherActiveGECOsWithCadReleaseClassificationWithAvailableAction_ShouldReturnEmptyCollectionWithMessages(string affectedItemAction)
		{
			//arrange
			var states = new[]
			{
				"10",
				"20",
			};

			var tabItems = states.Select(state =>
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
			anotherGECO.setProperty("classification", "Release & Change/CAD Document");
			Item affectedItem = ItemHelper.CreateItem(string.Empty, string.Empty);
			affectedItem.setProperty("gag_action", affectedItemAction);

			IGECOProvider gecoProvider = Substitute.For<IGECOProvider>();
			gecoProvider.GetRelatedGECOs(Arg.Any<Item>()).Returns(new[] { anotherGECO });
			gecoProvider.GECOIsActive(Arg.Any<Item>()).Returns(true);
			gecoProvider.FindAffectedItems(Arg.Any<Item>(), Arg.Any<string>()).Returns(new[] { affectedItem });

			string[] availableClassifications = { "Release & Change/CAD Document" };
			var testClass = new TestClass(nameof(TestClass), gecoProvider, relationshipNameProvider, availableClassifications, states);
			IReadOnlyCollection<ValidatorInfoModel> validatorInfo
				= new[]
				{
					new ValidatorInfoModel
					{
						AllowedStates = states,
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

		[TestCase("")]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Handle_WhenRelationshipItemsWithAllowedStatesContainsOnOtherActiveGECOsWithCadReleaseClassificationWithNotAvailableAction_ShouldReturnCollectionWithMessages(string affectedItemAction)
		{
			//arrange
			var states = new[]
			{
				"10",
				"20",
			};

			var tabItems = states.Select(state =>
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

			int expectedErrorCounts = states.Length;
			IRelationshipNameProvider relationshipNameProvider = Substitute.For<IRelationshipNameProvider>();
			relationshipNameProvider.TabName.Returns(TestRelationshipName);
			Item anotherGECO = ItemHelper.CreateItem(string.Empty, string.Empty);
			anotherGECO.setNewID();
			anotherGECO.setProperty("classification", "Release & Change/CAD Document");
			Item affectedItem = ItemHelper.CreateItem(string.Empty, string.Empty);
			affectedItem.setProperty("gag_action", affectedItemAction);

			IGECOProvider gecoProvider = Substitute.For<IGECOProvider>();
			gecoProvider.GetRelatedGECOs(Arg.Any<Item>()).Returns(new[] { anotherGECO });
			gecoProvider.GECOIsActive(Arg.Any<Item>()).Returns(true);
			gecoProvider.FindAffectedItems(Arg.Any<Item>(), Arg.Any<string>()).Returns(new[] { affectedItem });

			string[] availableClassifications = { "Release & Change/CAD Document" };
			var testClass = new TestClass(nameof(TestClass), gecoProvider, relationshipNameProvider, availableClassifications, states);
			IReadOnlyCollection<ValidatorInfoModel> validatorInfo
				= new[]
				{
					new ValidatorInfoModel
					{
						AllowedStates = states,
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
		public void Handle_WhenRelationshipItemsWithAllowedStatesContainsOnOtherNotActiveGECOs_ShouldReturnCollectionWithMessages()
		{
			//arrange
			var states = new[]
			{
				"10",
				"20",
			};

			var tabItems = states.Select(state =>
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

			int expectedErrorCounts = states.Length;
			IRelationshipNameProvider relationshipNameProvider = Substitute.For<IRelationshipNameProvider>();
			relationshipNameProvider.TabName.Returns(TestRelationshipName);
			Item anotherGECO = ItemHelper.CreateItem(string.Empty, string.Empty);
			anotherGECO.setNewID();

			IGECOProvider gecoProvider = Substitute.For<IGECOProvider>();
			gecoProvider.GetRelatedGECOs(Arg.Any<Item>()).Returns(new[] { anotherGECO });
			gecoProvider.GECOIsActive(Arg.Any<Item>()).Returns(false);

			string[] availableClassifications = { "Release & Change/CAD Document" };
			var testClass = new TestClass(nameof(TestClass), gecoProvider, relationshipNameProvider, availableClassifications, states);
			IReadOnlyCollection<ValidatorInfoModel> validatorInfo
				= new[]
				{
					new ValidatorInfoModel
					{
						AllowedStates = states,
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

			string[] availableClassifications = { "Release & Change/CAD Document" };
			var testClass = new TestClass(nameof(TestClass), Substitute.For<IGECOProvider>(), relationshipNameProvider, availableClassifications, Array.Empty<string>());

			//act
			//assert
			Assert.Throws<InvalidOperationException>(() => testClass.Handle(validationContext));
		}

		[Test]
		[System.Diagnostics.CodeAnalysis.SuppressMessage("Naming", "CA1707:Identifiers should not contain underscores")]
		public void Handle_WhenNextStepIsDefined_ShouldCallNextStep()
		{
			//arrange
			var ignoreStates = new[]
			{
				"10",
				"20",
			};

			var tabItems = ignoreStates.Select(state =>
			{
				Item item = ItemHelper.CreateItem(string.Empty, string.Empty);
				item.setProperty(StatePropertyKey, state);
				return item;
			});

			//arrange
			var relationshipItems = new Dictionary<string, IEnumerable<Item>>()
			{
				{ TestRelationshipName , tabItems },
			};

			var validationContext = new ValidationContext(relationshipItems)
			{
				CurrentGECO = ItemHelper.CreateItem(string.Empty, string.Empty),
				RootItem = ItemHelper.CreateItem(string.Empty, string.Empty),
			};

			Item anotherGECO = ItemHelper.CreateItem(string.Empty, string.Empty);
			IRelationshipNameProvider relationshipNameProvider = Substitute.For<IRelationshipNameProvider>();
			relationshipNameProvider.TabName.Returns(TestRelationshipName);
			IGECOProvider gecoProvider = Substitute.For<IGECOProvider>();
			gecoProvider.GetRelatedGECOs(anotherGECO);
			IStep nextStep = Substitute.For<IStep>();

			string[] availableClassifications = { "Release & Change/CAD Document" };
			var testClass = new TestClass(nameof(TestClass), gecoProvider, relationshipNameProvider, availableClassifications, ignoreStates);
			testClass.SetNext(nextStep);

			//act
			testClass.Handle(validationContext);

			//assert
			nextStep.Received(1).Handle(Arg.Any<ValidationContext>());
		}
	}
}
