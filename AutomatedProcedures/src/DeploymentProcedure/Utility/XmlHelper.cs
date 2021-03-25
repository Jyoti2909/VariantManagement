using DeploymentProcedure.Logging;
using DeploymentProcedure.Utility.FileSystem.Base;
using System;
using System.Globalization;
using System.Xml;

namespace DeploymentProcedure.Utility
{
	internal class XmlHelper
	{
		private readonly IFileSystem _fileSystem;

		internal XmlHelper(IFileSystem fileSystem)
		{
			_fileSystem = fileSystem;
		}

		internal XmlNode GetNode(string pathToXmlDocument, string xPath)
		{
			XmlNode obtainedNode = OpenDocument(pathToXmlDocument).SelectSingleNode(xPath);
			if (obtainedNode == null)
			{
				throw new ArgumentException(string.Format(CultureInfo.InvariantCulture, "The node by given XPath '{0}' doesn't exist in the '{1}'.", xPath, _fileSystem.GetFullPath(pathToXmlDocument)));
			}
			return obtainedNode;
		}

		internal bool CheckIfExists(string pathToXmlDocument, string xPath)
		{
			return OpenDocument(pathToXmlDocument).SelectSingleNode(xPath) != null;
		}

		internal string XmlPeek(string pathToXmlDocument, string xPath)
		{
			Logger.Instance.Log(LogLevel.Info, "\tTrying to get value from '{0}' file by '{1}' XPath", _fileSystem.GetFullPath(pathToXmlDocument), xPath);

			return GetNode(pathToXmlDocument, xPath).InnerText;
		}

		internal void XmlPoke(string pathToXmlDocument, string xPath, string value)
		{
			Logger.Instance.Log(LogLevel.Info, "\tTrying to set '{0}' value to '{1}' file by '{2}' XPath", value, _fileSystem.GetFullPath(pathToXmlDocument), xPath);

			XmlNode targetNode = GetNode(pathToXmlDocument, xPath);
			targetNode.InnerText = value;
			SaveXmlDocument(targetNode.OwnerDocument);
		}

		internal void AppendNode(XmlNode nodeToAppend, XmlNode targetNode)
		{
			XmlDocument targetDocument = targetNode.OwnerDocument;
			targetNode.AppendChild(targetDocument.ImportNode(nodeToAppend, true));
			SaveXmlDocument(targetDocument);
		}

		internal void AppendFragment(string fragmentInnerXml, XmlNode targetNode)
		{
			XmlDocumentFragment nodeToAppend = targetNode.OwnerDocument.CreateDocumentFragment();
			nodeToAppend.InnerXml = System.Net.WebUtility.HtmlDecode(fragmentInnerXml);
			AppendNode(nodeToAppend, targetNode);
		}

		internal void RemoveNode(XmlNode nodeToRemove)
		{
			XmlDocument xmlDocument = nodeToRemove.OwnerDocument;
			nodeToRemove.ParentNode.RemoveChild(nodeToRemove);
			SaveXmlDocument(xmlDocument);
		}

		internal XmlDocument OpenDocument(string pathToXmlDocument)
		{
			XmlDocument xmlDocument = new XmlDocument();
			xmlDocument.Load(_fileSystem.GetFullPath(pathToXmlDocument));
			return xmlDocument;
		}

		internal void SaveXmlDocument(XmlDocument xmlDocument)
		{
			string pathToXmlDocument = new Uri(xmlDocument.BaseURI).LocalPath;
			xmlDocument.Save(pathToXmlDocument);
		}
	}
}
