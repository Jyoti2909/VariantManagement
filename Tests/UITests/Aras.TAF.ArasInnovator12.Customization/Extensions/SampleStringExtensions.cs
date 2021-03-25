namespace Aras.TAF.ArasInnovator12.Customization.Extensions
{
	/// Example of class that provides the extension for string class functionality
	public class SampleStringExtensions
	{
		/// <summary>
		/// Changes first letter of string to lower case
		/// </summary>
		/// <param name="valueToChange"></param>
		/// <returns></returns>
		//public static string ChangeFirstLetterToLower(this string valueToChange)
		//{
		//	return valueToChange.ChangeFirstLetter(char.ToLower);
		//}

		//private static string ChangeFirstLetter(this string sourceString, Func<char, CultureInfo, char> convertMethod)
		//{
		//	Guard.ForNull(sourceString, nameof(sourceString));

		//	return string.IsNullOrEmpty(sourceString)
		//		? sourceString
		//		: convertMethod.Invoke(sourceString[0], CultureInfo.InvariantCulture) + sourceString.Substring(1);
		//}
	}
}
