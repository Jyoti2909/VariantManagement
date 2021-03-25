<%
	Dim qs As String = Request.ServerVariables("QUERY_STRING")
	If qs <> "" Then qs = "?" + qs
	Response.Redirect("Client/" + qs)
%>