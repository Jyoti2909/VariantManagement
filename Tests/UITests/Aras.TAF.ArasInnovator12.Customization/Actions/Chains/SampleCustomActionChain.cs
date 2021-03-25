namespace Aras.TAF.ArasInnovator12.Customization.Actions.Chains
{
	// This is a class example of Action Chain
	// With the help of it you can call needed Action in your test method
	public class SampleCustomActionChain
	{
		//public class CloseSomethingChain
		//{
		//	public ActionUnit ByCloseButton()
		//	{
		//		return Ioc.Container.Get<CloseSomethingByCloseButton>();
		//	}

		//public CloseSomethingWithTitleChain WithTitle(string title)
		//{
		//	return new CloseSomethingWithTitleChain(title);
		//}

		//	{
		//		return Ioc.Container.GetWithParameter<CloseSomethingWithTitle>(
		//			(key: nameof(title), value: title));
		//	}
		//}

		//public class CloseSomethingWithTitleChain
		//{
		//public ActionUnit WithTitle(string title)
		//{
		//	return Ioc.Container.GetWithParameter<CloseSomethingWithTitle>(
		//		(key: nameof(title), value: title));
		//}

		//public ActionUnit WithSomethingElse()
		//{
		//...
		//}
		//}

		//Examples of usage
		// In Close.cs creating of
		// public static CloseSomethingChain Something => new CloseSomethingChain();
		// gives you the possibilities to close something in different ways (due to the extension) like:
		//	Close.Something.ByCloseButton();
		//	Close.Something.WithTitle(title);
	}
}
