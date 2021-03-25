using Aras.TAF.Core;
using Aras.TAF.Core.Selenium;

namespace Aras.TAF.ArasInnovator12.Customization.Questions.UI
{
	/// <summary>
	/// Sample class for an UI question
	/// </summary>
	public class SampleUiQuestion /* : Question<ITarget> */
	{
		/// <inheritdoc />
		public /* override */ string Name => "Your question description";

		/// <inheritdoc/>
		protected /* override */ ITarget Answer(IInnerActorFacade actor)
		{
			//Guard.ForNull(actor, nameof(actor));

			//var answer1 = actor.AsksFor(SampleUiQuestion1);
			//var answer2 = actor.AsksFor(SampleUiQuestion2(answer1));

			//return answer2;
			return null;
		}
	}
}
