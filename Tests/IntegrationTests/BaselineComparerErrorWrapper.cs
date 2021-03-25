using Aras.Tests.Integration;
using NUnit.Framework;
using NUnit.Framework.Interfaces;
using NUnit.Framework.Internal;
using System;
using System.Text;
using System.Xml;

namespace IntegrationTests
{
	public class BaselineComparerErrorWrapper : IBaselineComparer
	{
		private readonly IBaselineComparer _baselineComparer;

		public BaselineComparerErrorWrapper(IBaselineComparer baselineComparer)
		{
			_baselineComparer = baselineComparer;
		}

		public void CompareTo(string baseName, XmlElement expectedRequest, XmlElement actualRequest)
		{
			if (expectedRequest == null)
			{
				throw new ArgumentNullException(nameof(expectedRequest));
			}

			if (actualRequest == null)
			{
				throw new ArgumentNullException(nameof(actualRequest));
			}

			try
			{
				_baselineComparer.CompareTo(baseName, expectedRequest, actualRequest);
			}
			catch (AssertionException ex)
			{
				StringBuilder sb = new StringBuilder(ex.Message);

				sb.AppendLine("\nExpected request:");
				sb.AppendLine(ConvertXmlToStringWithIndentations(expectedRequest));

				sb.AppendLine("\nActual request:");
				sb.AppendLine(ConvertXmlToStringWithIndentations(actualRequest));

				ExtendCurrentAssetionResultMessage(sb.ToString());

				throw;
			}
		}

		public AssertResultModel CompareXmlNodes(XmlNode expected, XmlNode actual)
		{
			return _baselineComparer.CompareXmlNodes(expected, actual);
		}

		private static string ConvertXmlToStringWithIndentations(XmlElement xmlElement)
		{
			StringBuilder sb = new StringBuilder();
			XmlWriterSettings xmlWriterSettings = new XmlWriterSettings
			{
				Indent = true,
				OmitXmlDeclaration = true
			};

			using (XmlWriter xmlWriter = XmlWriter.Create(sb, xmlWriterSettings))
			{
				xmlElement.WriteTo(xmlWriter);
				xmlWriter.Flush();

				return sb.ToString();
			}
		}

		private static void ExtendCurrentAssetionResultMessage(string additionalInformation)
		{
			TestResult currentTestResult = TestExecutionContext.CurrentContext.CurrentResult;

			// don't know how it will behave with concurrency.
			AssertionResult currentAssertionResult = currentTestResult.AssertionResults[currentTestResult.AssertionResults.Count - 1];
			currentTestResult.AssertionResults.Remove(currentAssertionResult);

			currentTestResult.RecordAssertion(
				currentAssertionResult.Status,
				currentAssertionResult.Message + additionalInformation,
				currentAssertionResult.StackTrace);
		}
	}
}
