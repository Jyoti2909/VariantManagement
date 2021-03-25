//using Aras.TAF.Core.DI;
//using Ninject;

namespace Aras.TAF.ArasInnovator12.Customization.Questions.States
{
	/// <summary>
	/// Represents as per example a Facade of sample questions
	/// </summary>
	public class SampleState
	{
		/// <summary>
		/// Sample question
		/// </summary>
		//public QuestionSample1 State1 =>
		//	Ioc.Container.Get<QuestionSample1>();

		/// <summary>
		/// Sample question with parameters
		/// </summary>
		/// <param name="parameter1"></param>
		/// <param name="parameter2"></param>
		/// <returns></returns>
		//public QuestionSampleWithParameters2 State2(string parameter1, string parameter2)
		//{
		//	Ioc.Container.GetWithParameter<QuestionSampleWithParameters2>(
		//		(key: nameof(parameter1), value: parameter1),
		//		(key: nameof(parameter2), value: parameter2));
		//}
	}

	// Example of usage
	// Actor.AsksFor(SampleState.State1());
	// Actor.AsksFor(SampleState.State2(Parameter1, Parameter2));
}
