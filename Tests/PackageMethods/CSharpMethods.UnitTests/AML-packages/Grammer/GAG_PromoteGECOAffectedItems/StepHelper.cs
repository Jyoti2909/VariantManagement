using System;
using System.Collections.Generic;
using IStep = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.IStep;
using FinalStep = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.FinalStep;
using ValidatorInfoModel = CSharpMethods.Methods.GAG_PromoteGECOAffectedItems.ItemMethod.ValidatorInfoModel;

namespace CSharpMethods.UnitTests.AMLPackages.Grammer.GAG_PromoteGECOAffectedItems
{
	internal static class StepHelper
	{
		public static void ApplyFinalStep(IStep step, IReadOnlyCollection<ValidatorInfoModel> validatorInfo, params string[] ignoreStates)
		{
			step.SetNext(new FinalStep(validatorInfo, ignoreStates));
		}
	}
}
