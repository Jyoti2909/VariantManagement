<!DOCTYPE html>
<!-- (c) Copyright by Aras Corporation, 2004-2014. -->
<!-- #INCLUDE FILE="include/utils.aspx" -->
<% 
	Dim slashAndSalt As String = ""
	If ClientConfig.GetServerConfig().UseCachingModule Then
		slashAndSalt = "/" + ClientHttpApplication.FullSaltForCachedContent
	End If

	Dim splash As String = Client_Config("login_splash")
	If (String.IsNullOrEmpty(splash) Or splash = "../images/aras-innovator.svg") Then
		splash = ".." + slashAndSalt + "/images/aras-innovator.svg"
	End If
%>
<html>
<head>
	<title></title>
	<link href="../styles/common.min.css" rel="stylesheet" />
	<link href="../styles/deepLinking.min.css" rel="stylesheet" />
</head>
<body>
	<div class="deep-linking">
		<div class="deep-linking__logo">
			<img class="logo" src="../<%=splash%>" alt="">
		</div>
		<div class="deep-linking__main">
			<p id="message"></p>
			<p>It is safe to close this helper window.</p>
		</div>
	</div>
</body>
</html>
