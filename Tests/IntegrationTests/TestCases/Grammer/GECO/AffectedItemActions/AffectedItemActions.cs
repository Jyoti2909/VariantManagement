using NUnit.Framework;

namespace IntegrationTests.Grammer.GECO
{
	[TestFixture]
	[Category("GECO")]
	public class AffectedItemActions : CustomIntegrationTestsBaseClass
	{
		private const string PathToTests = "TestCases\\Grammer\\GECO\\AffectedItemActions";

		[Test]
		public void ActionsValidationOnLeavingPlanningStateInCadPreReleaseGeco()
		{
			DoTests(CombinePaths(PathToTests, "ValidateAffectedItemActionsCadPreRelease"), 1, 2);
			SetVariable("Geco.Classification", "Pre-Release & Change/CAD Document");
			SetCadGecoVariables();
			SetAffectedItemActionVariables();
			DoTests(CombinePaths(PathToTests, "ValidateAffectedItemActionsCadPreRelease"), 3, 16);
		}

		[Test]
		public void ActionsValidationOnLeavingPlanningStateInCadReleaseGeco()
		{
			DoTests(CombinePaths(PathToTests, "ValidateAffectedItemActionsCadRelease"), 1, 2);
			SetVariable("Geco.Classification", "Release & Change/CAD Document");
			SetCadGecoVariables();
			SetAffectedItemActionVariables();
			DoTests(CombinePaths(PathToTests, "ValidateAffectedItemActionsCadRelease"), 3, 16);
		}

		[Test]
		public void ActionsValidationOnLeavingPlanningStateInPartPreReleaseGeco()
		{
			DoTests(CombinePaths(PathToTests, "ValidateAffectedItemActionsPartPreRelease"), 1, 2);
			SetVariable("Geco.Classification", "Pre-Release & Change/Mechanical Part");
			SetPartGecoVariables();
			SetAffectedItemActionVariables();
			DoTests(CombinePaths(PathToTests, "ValidateAffectedItemActionsPartPreRelease"), 3, 16);
		}

		[Test]
		public void ActionsValidationOnLeavingPlanningStateInPartReleaseGeco()
		{
			DoTests(CombinePaths(PathToTests, "ValidateAffectedItemActionsPartRelease"), 1, 2);
			SetVariable("Geco.Classification", "Release & Change/Mechanical Part");
			SetPartGecoVariables();
			SetAffectedItemActionVariables();
			DoTests(CombinePaths(PathToTests, "ValidateAffectedItemActionsPartRelease"), 3, 16);
		}

		private void SetCadGecoVariables()
		{
			SetVariable("Workflow.Path", "Start CAD Task");
			SetVariable("Active.10", GetVariable("CAD.10"));
			SetVariable("Active.30", GetVariable("CAD.30"));
			SetVariable("Active.50", GetVariable("CAD.50"));
			SetVariable("Active.Other", GetVariable("CAD.Other"));
			SetVariable("Inactive.10", GetVariable("Part.10"));
		}

		private void SetPartGecoVariables()
		{
			SetVariable("Workflow.Path", "Start Mechanical Part Task");
			SetVariable("Active.10", GetVariable("Part.10"));
			SetVariable("Active.30", GetVariable("Part.30"));
			SetVariable("Active.50", GetVariable("Part.50"));
			SetVariable("Active.Other", GetVariable("Part.Other"));
			SetVariable("Inactive.10", GetVariable("CAD.10"));
		}

		private void SetAffectedItemActionVariables()
		{
			SetVariable("Active.10.Incorrect.Action", "Revise");
			SetVariable("Active.10.Correct.Action", "Release");
			SetVariable("Active.30.Incorrect.Action", "Release");
			SetVariable("Active.30.Correct.Action", "Revise");
		}
	}
}
