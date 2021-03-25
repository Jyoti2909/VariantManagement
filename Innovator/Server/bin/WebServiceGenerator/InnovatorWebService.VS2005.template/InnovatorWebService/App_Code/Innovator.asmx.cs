using System;
using System.Xml;
using System.Collections;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Globalization;
using System.Reflection;
using System.Web;
using System.Web.Services;

using Aras.IOM;

namespace Aras.Tools.WebServices
{
    /// <summary>
    /// Summary description for Service1.
    /// </summary>
    [WebService(Namespace = "http://www.aras.com/", Name = "ServiceName")]
    public class InnovatorWS : WebService
    {
        private Innovator inn;

        public InnovatorWS()
        {
            //CODEGEN: This call is required by the ASP.NET Web Services Designer
            InitializeComponent();
        }

        #region Component Designer generated code
        //Required by the Web Services Designer 
        private IContainer components;

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
        }

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        protected override void Dispose(bool disposing)
        {
            if (disposing && components != null)
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }
        #endregion

        #region "ALWAYS THERE" WEB METHODS
        [WebMethod(EnableSession = true, Description = "Log on to Innovator.")]
        public void LogOn(string userName, string userPassword, string locale, string timeZone)
        {
            this._Login(userName, userPassword, locale, timeZone);
            Session.Add("INNOVATOR", this.inn);
        }

        [WebMethod(EnableSession = true, Description = "Applies AML.")]
        public string ApplyAml(string aml)
        {
            if (aml == null)
                throw new ArgumentNullException("aml");

            if (aml.Trim().Length == 0)
                throw new ArgumentException("Method argument is an empty string");

            return this._Apply(null, aml);
        }

        [WebMethod(EnableSession = true, Description = "Applies Method.")]
        public string ApplyMethod(string methodName, string methodData)
        {
            if (methodName == null || methodName.Trim().Length == 0)
                throw new ArgumentException("Method name is not specified");

            if (methodData == null)
                methodData = string.Empty;

            return this._Apply(methodName, methodData);
        }
        #endregion

        // Code for web methods is generated. Please don't change!
        #region GENERATED WEB METHODS
        #endregion

        #region Private methods
        /// <summary>
        /// Checks if client is authorized
        /// </summary>
        private void CheckAuthorization()
        {
            inn = (Innovator)Session["INNOVATOR"];
            if (inn == null)
                throw new LogOnException("ERROR: You are not logged in to Innovator.");
        }


        /// <summary>
        /// Creates and throws an exception from Item object.
        /// </summary>
        /// <param name="response">Response Item object.</param>
        private void ThrowException(Item response)
        {
            string error = response.getErrorString();
            error = (error != null && error.Trim().Length > 0) ?
              string.Format(CultureInfo.InvariantCulture, "ERROR: {0}\n", error) : "ERROR:\n";

            string code = response.getErrorCode();
            code = (code != null && code.Trim().Length > 0) ?
              string.Format(CultureInfo.InvariantCulture, "\tERROR CODE: {0}\n", code) : string.Empty;

            string details = response.getErrorDetail();
            details = (details != null && details.Trim().Length > 0) ?
              string.Format(CultureInfo.InvariantCulture, "\tERROR DETAILD: {0}\n", details) : string.Empty;

            string source = response.getErrorSource();
            source = (source != null && source.Trim().Length > 0) ?
              string.Format(CultureInfo.InvariantCulture, "\tERROR SOURCE: {0}\n", source) : string.Empty;

            throw new CustomException(string.Format(CultureInfo.InvariantCulture, "{0}{1}{2}{3}", error, code, details, source));
        }


        /// <summary>
        /// Logon to Innovator.
        /// </summary>
        /// <param name="userName">string</param>
        /// <param name="userPassword">string</param>
        /// <param name="locale">string</param>
        /// <param name="timeZone">string</param>
        private void _Login(string userName, string userPassword, string locale, string timeZone)
        {
            string url = string.Format(CultureInfo.InvariantCulture, "{0}/server/innovatorserver.aspx", System.Configuration.ConfigurationSettings.AppSettings["url"]);
            string db = System.Configuration.ConfigurationSettings.AppSettings["db"];

            HttpServerConnection conn = IomFactory.CreateHttpServerConnection(url, db, userName, Innovator.ScalcMD5(userPassword));
            SetLocale(conn, locale, timeZone);

            Item logResult = conn.Login();
            if (logResult.isError())
                throw new LogOnException("Failed to logon to Innovator");

            inn = new Innovator(conn);
        }


        /// <summary>
        /// We need use reflection here, because now it is impossible to set locale and time_zone in HttpServerConnection in any
        /// other way.
        /// </summary>
        /// <param name="obj">instance of HttpServerConnection.</param>
        /// <param name="locale">locale string</param>
        /// <param name="timeZone">timeZone string</param>
        private void SetLocale(HttpServerConnection obj, string locale, string timeZone)
        {
            try
            {
                PropertyInfo propLocale = obj.GetType().BaseType.GetProperty("Locale", BindingFlags.Instance | BindingFlags.NonPublic);
                propLocale.SetValue(obj, locale, null);

                PropertyInfo propTimeZone = obj.GetType().BaseType.GetProperty("TimeZoneName", BindingFlags.Instance | BindingFlags.NonPublic);
                propTimeZone.SetValue(obj, timeZone, null);
            }
            catch (Exception exc)
            {
                throw new CustomException("Failed to set locale and time_zone properties", exc);
            }
        }


        /// <summary>
        /// Sends request to Innovator server.
        /// </summary>
        /// <param name="request">IInnovatorWSO object.</param>
        /// <param name="action">string</param>
        /// <param name="levels">int</param>
        /// <returns>Response Item object.</returns>
        private Item _SendRequest(IInnovatorWSO request, string action, int levels)
        {
            if (request == null)
                throw new ArgumentNullException("request");

            CheckAuthorization();

            Item requestItem = request.ConvertToItem(inn, action, levels);
            Item response = requestItem.apply();
            if (response.isError())
                this.ThrowException(response);

            return response;
        }


        /// <summary>
        /// Sends aml request to Innovator server.
        /// </summary>
        /// <param name="aml">Aml string.</param>
        /// <returns>Response Item object.</returns>
        private Item _SendRequest(string aml)
        {
            if (aml == null)
                throw new ArgumentNullException("aml");

            CheckAuthorization();

            Item requestItem = inn.newItem();
            requestItem.loadAML(aml);
            Item response = requestItem.apply();
            if (response.isError())
                this.ThrowException(response);

            return response;
        }


        /// <summary>
        /// Applies methodName or aml string.
        /// </summary>
        /// <param name="methodName">Method Name. if empty - applies aml</param>
        /// <param name="aml">Aml string.</param>
        /// <returns>Response Item object.</returns>
        private string _Apply(string methodName, string aml)
        {
            CheckAuthorization();

            Item response = (methodName == null) ? inn.applyAML(aml) : inn.applyMethod(methodName, aml);
            if (response.isError())
                this.ThrowException(response);

            XmlNode resultNode =
              response.dom.DocumentElement.SelectSingleNode("/*[local-name()='Envelope']/*[local-name()='Body']/*[local-name(.)='Result']");
            if (resultNode != null)
                return resultNode.OuterXml;
            else
            {
                XmlNode bodyNode = response.dom.DocumentElement.SelectSingleNode("/*[local-name()='Envelope']/*[local-name()='Body']");
                if (bodyNode != null)
                    return bodyNode.InnerXml;
                else
                    return response.dom.OuterXml;
            }
        }
        #endregion
    }
}
