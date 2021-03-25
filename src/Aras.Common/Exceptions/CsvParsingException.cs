using System;

namespace Aras.Common
{
	public class CsvParsingException : Exception
	{
		public CsvParsingException(string errorMessage)
			: base(errorMessage)
		{
		}
	}
}