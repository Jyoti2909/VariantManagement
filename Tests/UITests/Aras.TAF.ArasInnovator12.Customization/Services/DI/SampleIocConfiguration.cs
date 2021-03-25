using Aras.TAF.ArasInnovator12.Customization.Actions.API;
using Aras.TAF.ArasInnovator12.Customization.Actions.API.Extensions;
using Aras.TAF.ArasInnovator12.Customization.Actions.UI;
using Aras.TAF.ArasInnovator12.Customization.Actions.UI.Extensions;
using Ninject.Modules;

namespace Aras.TAF.ArasInnovator12.Customization.Services.DI
{
	/// <summary>
	/// Container for storing the default bindings related to some specific cases
	/// </summary>
	public class SampleIocConfiguration : NinjectModule
	{
		/// <inheritdoc />
		public override void Load()
		{
			Rebind<SampleUiAction>().To<SampleUiActionExtension>();
			Rebind<SampleApiAction>().To<SampleApiActionExtension>();
		}
	}
}
