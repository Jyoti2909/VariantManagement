using Aras.TAF.Core;

namespace Aras.TAF.ArasInnovator12.Customization.Actions.UI.Extensions
{
	// This is a class example of extension for SampleUiAction class
	public class SampleUiActionExtension : SampleUiAction
	{
		public override string Name => "Your action extension description";

		/// <inheritdoc/>
		protected override void ExecuteAttemptsTo(IInnerActorFacade actor /*, WebBrowser ability*/)
		{
			//The following lines of code can be an example of extending of your action by setting the current window to full screen 
			//Guard.ForNull(ability, nameof(ability));
			//ability.Driver.Manage().Window.FullScreen();
		}
	}

	// After your Extension action is ready, navigate to SampleDefaultConfiguration.cs and add rebind to this extension class
	// Rebind<SampleUiAction>().To<SampleUiActionExtension>();
}