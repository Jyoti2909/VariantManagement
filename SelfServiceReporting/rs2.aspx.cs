using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Xml;
using ASP;
using Aras.Izenda.Reporting;
using IzendaUtility = Izenda.AdHoc.Utility;
using Izenda.AdHoc;
using Izenda.AdHoc.Database;

public partial class rs2 : System.Web.UI.Page
{
	protected override void OnPreInit(System.EventArgs e)
	{
		Aras.Izenda.Reporting.CustomAdHocConfig.InitializeReporting();
	}

	/// <summary>
	/// Caching copied from rs.aspx-ResponseServer.cs
	/// </summary>
	protected override void OnLoad(EventArgs e)
	{
		base.OnLoad(e);

		string data = ""; // otherwise rs2 md5 funcs fail
		switch ((Request.Params["op"] ?? "").ToUpperInvariant())
		{
			case "MAP_CONTEXT_ITEM_IDS":
				using (var stream = new StreamReader(HttpContext.Current.Request.InputStream, Encoding.UTF8, false, 1024, true))
				{
					Aras.Izenda.Reporting.CustomAdHocConfig.Current.ReportContextItemIds[Request[Config.ItemIdParamName]] = stream.ReadToEnd();
				}
				break;
			case "EXPORT_REPORTS":
				var inn = Aras.Izenda.Reporting.CustomAdHocConfig.Current.InnovatorProxy;
				var itemIds = Request["ITEMIDS"];
				if (!string.IsNullOrWhiteSpace(itemIds) && Config.ItemIdsPattern.IsMatch(itemIds))
				{
					var rtn = inn.applyMethod("GetReportsForExport", "<itemids>{0}</itemids>".FormatInvariant(itemIds));
					Response.ContentType = "text/aml";
					Response.AddHeader("Content-Disposition", "attachment; filename=Reports.aml");
					if (!rtn.isError() && !rtn.isEmpty())
					{
						data = rtn.dom.SelectSingleNode("//Result").OuterXml.Replace("<Result>", "<AML>").Replace("</Result>", "</AML>");
					}
					if (rtn.isError())
					{
						data = rtn.dom.OuterXml;
					}
				}
				break;
			case "IMPORT_REPORTS": // nash.aspx-like
				HttpPostedFile amlToImport = Request.Files["IMPORT_REPORTS"];
				if (amlToImport.ContentLength < 1)
				{
					break;
				}
				var inn2 = Aras.Izenda.Reporting.CustomAdHocConfig.Current.InnovatorProxy;
				using (var sr = new StreamReader(amlToImport.InputStream))
				{
					inn2.applyAML(sr.ReadToEnd());
				}
				break;
			default: throw new HttpException((int)HttpStatusCode.BadRequest, "Unknown request");
		}

		#region caching support
		Response.Cache.SetCacheability(HttpCacheability.Public);
		Response.Cache.SetETag("\"" + GetMd5Sum(data) + "\"");
		Response.Cache.SetLastModified(DateTime.Now);
		Response.Cache.SetExpires(DateTime.Now.AddDays(30.0));
		if (isContentModified("\"" + GetMd5Sum(data) + "\"", Request))
		{
			Response.Write(data);
		}
		else
		{
			Response.StatusCode = 304;
			Response.StatusDescription = "Not Modified";
			Response.AddHeader("Content-Length", "0");
			Response.SuppressContent = false;
			Response.ClearContent();
		}
		#endregion caching support
	}

	#region copied from IzendaUtility for caching support
	internal static string GetMd5Sum(byte[] data)
	{
		byte[] hash = new MD5CryptoServiceProvider().ComputeHash(data);
		StringBuilder stringBuilder = new StringBuilder();
		for (int index = 0; index < hash.Length; ++index)
			stringBuilder.Append(hash[index].ToString("X2"));
		return stringBuilder.ToString();
	}

	internal static string GetMd5Sum(string str)
	{
		System.Text.Encoder encoder = Encoding.Unicode.GetEncoder();
		byte[] numArray = new byte[str.Length * 2];
		encoder.GetBytes(str.ToCharArray(), 0, str.Length, numArray, 0, true);
		return GetMd5Sum(numArray);
	}

	internal static bool isContentModified(string etag, HttpRequest request)
	{
		bool flag = true;
		DateTime result1;
		DateTime result2;
		if (!string.IsNullOrEmpty(request.Headers["If-Modified-Since"]) && DateTime.TryParse(request.Headers["If-Modified-Since"], out result1) && (DateTime.TryParse(request.Headers["Expires"], out result2) && result1 > result2))
			flag = false;
		if (!string.IsNullOrEmpty(request.Headers["If-None-Match"]))
			flag = request.Headers["If-None-Match"] != etag;
		return flag;
	}
	#endregion copied from IzendaUtility for caching support
}