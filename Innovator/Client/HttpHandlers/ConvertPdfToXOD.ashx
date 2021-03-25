<%@ WebHandler Language="C#" Class="ConvertPdfToXOD" %>

using System;
using System.IO;
using System.Web;
using System.Xml;
using System.Reflection;
using System.Collections.Specialized;
using System.Text.RegularExpressions;

public class ConvertPdfToXOD : IHttpHandler
{
	const string annotationOutputOption = "PDF_AnnotationOutput";
	const string dpiOption = "PDF_DPI";
	const string elementLimitOption = "PDF_ElementLimit";
	const string flattenOption = "PDF_Flatten";
	const string flattenThresholdOption = "PDF_FlattenThreshold";
	const string jpgQualityOption = "PDF_JPGQuality";
	const string maxImageValueOption = "PDF_MaxImageValue";
	const string preferJPGOption = "PDF_PreferJPG";
	const string thickenLinesOption = "PDF_ThickenLines";
	const string overprintSimulationOption = "PDF_OverprintSimulation";

	private void SetConverterOptions(Aras.PDFTron.XODConverter convertInst, HttpContext context)
	{
		string annotationOutput = context.Request[annotationOutputOption];
		string dpi = context.Request[dpiOption];
		string elementLimit = context.Request[elementLimitOption];
		string flatten = context.Request[flattenOption];
		string flattenThreshold = context.Request[flattenThresholdOption];
		string jpgQuality = context.Request[jpgQualityOption];
		string maxImageValue = context.Request[maxImageValueOption];
		string preferJPG = context.Request[preferJPGOption];
		string thickenLines = context.Request[thickenLinesOption];
		string overprintSimulation = context.Request[overprintSimulationOption];

		convertInst.SetDpi(dpi);
		convertInst.SetElementLimit(elementLimit);
		convertInst.SetJpgQuality(jpgQuality);
		convertInst.SetMaxImageValue(maxImageValue);
		convertInst.SetPreferJpg(preferJPG);
		convertInst.SetThickenLines(thickenLines);
		convertInst.SetAnnotationOutput(annotationOutput);
		convertInst.SetFlatten(flatten);
		convertInst.SetFlattenThreshold(flattenThreshold);
		convertInst.SetOverprintSimulation(overprintSimulation);
	}

	private static void AppendXmlNodeToParent(XmlDocument xmlDoc, XmlNode parentNode, string nodeName, string innerText)
	{
		XmlNode node = xmlDoc.CreateNode("element", nodeName, "");
		node.InnerText = innerText;
		parentNode.AppendChild(node);
	}

	[System.Diagnostics.CodeAnalysis.SuppressMessage("Aras.Rules", "ArasRule2:DoNotCreateXmlDocument")]
	protected static void ErrorMessageToResponse(HttpResponse response, Exception exception)
	{
		if (response != null)
		{
			XmlWriterSettings xws = new XmlWriterSettings { OmitXmlDeclaration = true };
			XmlDocument xmlDoc = new XmlDocument { XmlResolver = null };

			XmlNode resultNode = xmlDoc.CreateNode("element", "Error", "");

			AppendXmlNodeToParent(xmlDoc, resultNode, "Message", exception.Message);
			AppendXmlNodeToParent(xmlDoc, resultNode, "InnerException",
				exception.InnerException != null ? exception.InnerException.Message : "");
			AppendXmlNodeToParent(xmlDoc, resultNode, "StackTrace", exception.StackTrace);

			xmlDoc.AppendChild(resultNode);
			using (XmlWriter xw = XmlWriter.Create(response.Output, xws))
			{
				xmlDoc.Save(xw);
			}
		}
	}

	public void ProcessRequest(HttpContext context)
	{
		try
		{
			string fileUrl = context.Request["file"];
			string action = context.Request["action"];
			Uri fileUri = new Uri(fileUrl);
			Uri requestUrl = context.Request.Url;

			Aras.Client.Core.ClientConfig clientConfig = Aras.Client.Core.ClientConfig.GetServerConfig();
			string innovatorServerBaseUrl = (string)clientConfig.GetOperatingParameter("innovator_server_loopback_url");
			if (!String.IsNullOrEmpty(innovatorServerBaseUrl))
			{
				innovatorServerBaseUrl = innovatorServerBaseUrl.ToLowerInvariant().Replace("innovatorserver.aspx", "");
			}
			else
			{
				innovatorServerBaseUrl = requestUrl.Scheme + "://" + requestUrl.Host + ":" + requestUrl.Port;
				var i = 0;
				while (!String.Equals(requestUrl.Segments[i], "Client/"))
				{
					innovatorServerBaseUrl += requestUrl.Segments[i];
					i++;
				}
				innovatorServerBaseUrl += "Server/";
			}

			Aras.PDFTron.XODConverter convertInst = new Aras.PDFTron.XODConverter(new Uri(innovatorServerBaseUrl), fileUri);
			convertInst.SetFilePassword(context.Request["ac"]);
			switch (action)
			{
				case "to_xod":
					SetConverterOptions(convertInst, context);
					string layers = context.Request["hiddenLayers"];
					layers = context.Server.UrlDecode(layers);
					convertInst.ConvertDocument(layers, context);
					break;
				case "to_png":
					string page = context.Request["page"];
					string percents = context.Request["percents"];
					string angle = context.Request["angle"];
					string rectX = context.Request["rectX"];
					string rectY = context.Request["rectY"];
					string rectW = context.Request["rectW"];
					string rectH = context.Request["rectH"];
					string dpi = context.Request["dpi"];
					layers = context.Request["layers"];
					layers = context.Server.UrlDecode(layers);
					convertInst.ConvertPageToImage(page, percents, angle, rectX, rectY, rectW, rectH, dpi, layers, context);
					break;
				case "to_pdf":
					convertInst.ConvertImageToPdf(context);
					break;
				case "get_layers":
					convertInst.GetLayers(context);
					break;
				case "get_property":
					string property = context.Request["property"];
					string dictionary = context.Request["dictionary"];
					convertInst.GetDocumentProperty(property, dictionary, context);
					break;
				case "page_count":
					convertInst.GetPageCount(context);
					break;
				case "check_cache":
					page = context.Request["page"];
					angle = context.Request["angle"];
					layers = context.Request["layers"];
					layers = context.Server.UrlDecode(layers);
					convertInst.CheckDocInCache(page, angle, layers, context);
					break;
				case "client_data":
					convertInst.GetClientLicense(context);
					break;
				case "check_encrypt":
					convertInst.IsDocEncrypted(context);
					break;
				case "check_unlock":
					convertInst.IsDocUnlocked(context);
					break;
			}
		}
		catch (Exception e)
		{
			context.Response.ContentType = "text/xml";
			context.Response.Clear();
			ErrorMessageToResponse(context.Response, e);
		}

		HttpContext.Current.ApplicationInstance.CompleteRequest();
	}

	public bool IsReusable
	{
		get
		{
			return false;
		}
	}
}