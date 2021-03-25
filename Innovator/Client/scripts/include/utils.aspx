<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="Aras.Client.Core" %>
<%@ Import Namespace="System.Reflection" %>
<%@ Import Namespace="Aras.Web.Configuration" %>
<script language="VB" runat="Server">
	'++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	'
	' (c) Copyright by Aras Corporation, 2004-2007.
	'
	' $FileName: utils.aspx
	' $Purpose:  utilities to support client ASPX
	' $Routines:
	'------------------------------------------------------------------------------

	' In order to make it easier to tweek the client configuration
	' we will not use Application state, and instead read our configuration
	' xml file every time.

	Dim ApplicationXML As XmlDocument

	Private Sub init_application()
		Dim clientConfig As ClientConfig = ClientConfig.GetServerConfig()
		ApplicationXML = clientConfig.GetXmlConfig()
		
		Dim nodes As XmlNodeList = ApplicationXML.SelectNodes("/Innovator/DB-Connection[@database]")
		Dim node As XmlElement
		For Each node In nodes
			'Adjust for legacy configuration files.
			If node.GetAttribute("id") = "" Then
				node.SetAttribute("id", node.GetAttribute("database"))
			End If
		Next
	End Sub

	Public Function Client_Config(ByVal inKey As String) As Object
		Dim value As Object
		Dim tmp As XmlElement
		Dim key As String = inKey.ToLowerInvariant()
		If key = "branding_img" OrElse _
		 key = "login_splash" OrElse key = "product_name" Then
			tmp = CType(ApplicationXML.SelectSingleNode("/Innovator/UI-Tailoring"), XmlElement)
			If tmp Is Nothing Then
				value = ""
			Else
				value = tmp.GetAttribute(key)
			End If
		ElseIf key = "setup_qs" Then
			value = Request.ServerVariables("QUERY_STRING")
		Else
			tmp = CType(ApplicationXML.SelectSingleNode("/Innovator/operating_parameter[translate(@key, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-', 'abcdefghijklmnopqrstuvwxyz0123456789_-')=translate('" + key + "', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-', 'abcdefghijklmnopqrstuvwxyz0123456789_-')]"), XmlElement) ' attempt case-insensitive search
			If tmp Is Nothing Then
				tmp = CType(ApplicationXML.SelectSingleNode("/Innovator/operating_parameter[@key='" + key + "']"), XmlElement)
				If tmp Is Nothing Then				
					value = ""
				Else
					value = tmp.GetAttribute("value")
				End If
			Else
				value = tmp.GetAttribute("value")
			End If
		End If
		
		If value Is Nothing Then
			value = ""
		End If

		Trace.Write(key, CType(value, String))
		Return value
	End Function
</script>
<%
	init_application()
%>
