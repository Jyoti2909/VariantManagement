using Aras.TAF.Core;

namespace Aras.TAF.ArasInnovator12.Customization.Actions.API.Extensions
{
	// This is a class example of extension for SampleApiAction class
	public class SampleApiActionExtension : SampleApiAction
	{
		public override string Name => "Your action extension description";

		/// <inheritdoc/>
		protected override void ExecuteAttemptsTo(IInnerActorFacade actor)
		{
			//InnovatorUserHelper.AddUserToIdentity(UserInfo, IdentityName);
			//Put here some extra logic
		}

		// After your Extension action is ready, navigate to SampleDefaultConfiguration.cs and add rebind to this extension class
		// Rebind<SampleApiAction>().To<SampleApiActionExtension>();
	}
}
