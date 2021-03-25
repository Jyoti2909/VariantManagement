using Aras.TAF.Core;

namespace Aras.TAF.ArasInnovator12.Customization.Actions.UI
{
	// This is a class example of UI Action

	// The more suitable name for this class according to the provided example is 'MaximizeCurrentWindow'
	public class SampleUiAction : ActionUnit/*<WebBrowser>*/
	{
		public override string Name => "Your action description";
		//public override string Name => "Maximize the current browser window";

		/// <inheritdoc/>
		protected override void ExecuteAttemptsTo(IInnerActorFacade actor /*, WebBrowser ability*/)
		{
			//The following lines of code can be an example of implementation of your action
			//Guard.ForNull(ability, nameof(ability));
			//ability.Driver.Manage().Window.Maximize();
		}
	}
}
