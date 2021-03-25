using Aras.TAF.Core;

namespace Aras.TAF.ArasInnovator12.Customization.Questions.API
{
	/// <summary>
	/// Sample class for an API question
	/// </summary>
	public class SampleApiQuestion /* : Question<TAnswer> */
	{
		/// <inheritdoc/>
		public /* override */ string Name => "Your question description";

		/// <inheritdoc/>
		protected /* override */ string Answer(IInnerActorFacade actor)
		{
			//Guard.ForNull(actor, nameof(actor));

			//var answer1 = actor.AsksFor(ApiQuestion1);

			//return string.Concat("some text ", answer1);
			return null;
		}
	}
}
