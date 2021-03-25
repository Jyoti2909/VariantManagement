function WebFile() {
	/// <summary>
	///	 WebFile keeps static methods for working with files on Web.
	///  Is planned as something like System.IO.File class in .NET Framework.
	/// </summary>
	/// <summary locid="M:J#Aras.Client.JS.WebFile.#ctor">
	/// This is summary for constructor.
	/// </summary>
}

WebFile.Exists = function WebFileExists(url) {
	/// <summary locid="M:J#Aras.Client.JS.WebFile.Exists">
	///  Checks wheather resource under specified URL is availiable or not.
	///  Sends HEAD request to the server and analyses response.
	/// <param locid="M:J#Aras.Client.JS.WebFile.Exists" name="url" type="string" mayBeNull="false">
	///	 URL of resource beeeing checked.
	/// </param>
	/// </summary>
	/// <returns type="Boolean">Returs "true" if resource under specified URL is available and "false" otherwise.</returns>
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('HEAD', url, false);
	xmlhttp.send();
	return !(xmlhttp.status == 404 || xmlhttp.statusText == 'Not Found');
};
