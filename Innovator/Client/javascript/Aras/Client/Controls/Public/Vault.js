function Vault(vaultInstance) {
	/// <summary>
	/// "aras.vault" instance of the class can be used in custom JavaScript code.
	/// Vault provides batch file uploading/downloading capabilities together with related
	/// file manipulation routines.
	/// </summary>
	/// <remarks>
	/// It has user friendly interface, displays a progress bar during time consuming upload/download
	/// process and has warning/error messages system to inform the user about any collisions.<br/>
	/// User has a possibility to add/remove files to the batch list, rename files and folders,
	/// cancel current job.<br/>
	/// User may select files from both local and network-mapped folders, optionally including all
	/// sub-folders.
	/// Additionally, he can enter any valid network path and browse it in the file selection dialog.
	/// <p>
	/// File transfer works over http, SSL (https) with or without proxy. This is achieved
	/// by using browser's native connection classes.<br/>
	/// And the most attractive feature is the possibility to upload huge files (unlimited file size)
	/// with no timeouts or memory leacks (known java bug).<br/>
	/// We use all available network traffic, so the transfer will go as fast as your LAN/WAN allows.<br/>
	/// You can submit your form data together with the file. It is usually required to send the state
	/// information back to the server.
	/// </p>
	/// <p>
	/// What else can I do with Vault applet that I can't with a usual FILE form input field?
	/// - Well, you can control, filter and preprocess the file list that user has selected.
	/// You can enable or disable to transfer some file types basing on your application logic,
	/// and you can collect additional information related to those files.
	/// And finally, you don't need to reload your page while you transferring the files.
	/// </p>
	/// <p>
	/// We use the standard "multipart/form-data" content encoding, so the applet is compatible
	/// with any server-side uploading component.
	/// The quality of the server-side component as well as the hard-drive performance
	/// will also affect the resulting transfer rate.
	/// </p>
	/// </remarks>

	this.vault = vaultInstance;

	for (var funcName in this) {
		var obj = this[funcName];
		var firstChar = funcName.charAt(0);

		if (
			typeof obj == 'function' &&
			!this.hasOwnProperty(funcName) &&
			firstChar.toLowerCase() == firstChar
		) {
			var newFuncName = firstChar.toUpperCase() + funcName.slice(1);
			this[newFuncName] = obj;
		}
	}
}

Vault.prototype.setClientData = function (name, value_Renamed) {
	/// <summary>
	/// Set userdata (form fields) for uploading.<br/>
	/// Mode: upload.
	/// </summary>
	/// <param name="name" type="string"></param>
	/// <param name="value_Renamed" type="string"></param>
	return this.vault.setClientData(name, value_Renamed);
};

Vault.prototype.getClientData = function (name) {
	/// <summary>
	/// Gets userdata (form fields) for uploading.
	/// </summary>
	/// <param name="name" type="string"></param>
	/// <returns>string</returns>
	return this.vault.getClientData(name);
};

Vault.prototype.selectFile = function () {
	/// <summary>
	/// Displays a file selection dialog box that allows the user to browse the local file system and select a file.
	/// The WorkingDir property for the applet is also set if the user browses to a directory.
	/// The working directory for the dialog box is initialized to the working directory for the applet.
	/// </summary>
	/// <returns>
	/// Promise. Returns the Promise object which will be resolved with selected file if user selects file.
	/// </returns>
	return this.vault.selectFile();
};

Vault.prototype.getFileChecksum = function (fileName) {
	/// <summary>
	/// Gets checksum of the current file.
	/// </summary>
	/// <param name="fileName" type="string"></param>
	/// <returns>string</returns>
	return this.vault.getFileChecksum(fileName);
};

Vault.prototype.addFileToList = function (fileID, filename) {
	/// <summary>
	/// Add the specified file URL to the fileList.
	/// </summary>
	/// <param name="fileID" type="string"></param>
	/// <param name="filename" type="string"></param>
	/// <returns>bool</returns>
	return this.vault.addFileToList(fileID, filename);
};

Vault.prototype.sendFiles = function (serverUrl) {
	/// <summary>
	/// Send files from clientData to specified url.
	/// </summary>
	/// <param name="serverUrl" type="string"></param>
	/// <returns>bool</returns>
	return this.vault.sendFiles(serverUrl);
};

Vault.prototype.sendFilesAsync = function (serverUrl) {
	/// <summary>
	/// Send files from clientData to specified url in asynchronous mode
	/// </summary>
	/// <param name="serverUrl" type="string"></param>
	/// <returns>Promise object</returns>
	return this.vault.sendFilesAsync(serverUrl);
};

Vault.prototype.getResponse = function () {
	/// <summary>
	/// Returns the Response property, which is set with the server response data from the upload() method call.
	/// </summary>
	/// <returns>string</returns>
	return this.vault.getResponse();
};

Vault.prototype.getLastError = function () {
	/// <summary>
	/// Get the error message from the last operation.
	/// </summary>
	/// <returns>string</returns>
	return this.vault.getLastError();
};

Vault.prototype.clearClientData = function () {
	/// <summary>
	/// Clear all userdata values.
	/// </summary>
	return this.vault.clearClientData();
};

Vault.prototype.clearFileList = function () {
	/// <summary>
	/// Clears fileList.
	/// </summary>
	return this.vault.clearFileList();
};

Vault.prototype.setLocalFileName = function (filename) {
	/// <summary>
	/// Sets local file name.
	/// </summary>
	/// <param name="filename" type="string"></param>
	return this.vault.setLocalFileName(filename);
};

Vault.prototype.downloadFile = function (strUrl) {
	/// <summary>
	/// Download file from fileUrl to working directory with specified credentials and post data.
	/// To use this method call <see cref="M:SetLocalFileName"/>.
	/// </summary>
	/// <param name="strUrl" type="string">Url to download file from.</param>
	/// <returns>bool, true if file downloaded successfully, false otherwise.</returns>
	return this.vault.downloadFile(strUrl);
};

Vault.prototype.getFileSize = function (fileName) {
	/// <summary>
	///  Gets the size of the current file.
	/// </summary>
	/// <param name="fileName" type="string"></param>
	/// <returns></returns>
	return this.vault.getFileSize(fileName);
};

Vault.prototype.readText = function (path, encoding) {
	/// <summary>
	/// Reads the stream from the current position to the end of the stream.
	/// </summary>
	/// <param name="fname" type="string"></param>
	/// <param name="encoding" type="string">Parameter for System.Text.Encoding.GetEncoding method. "UTF-8" is default.</param>
	/// <returns>
	/// string. The rest of the stream as a string, from the current position to the end.
	/// If the current position is at the end of the stream, returns the empty string("").
	/// </returns>
	return this.vault.readText(path, encoding);
};

Vault.prototype.readBase64 = function (path, offset, count) {
	/// <summary>
	/// Reads the string of base64 encoding bytes from the offset position to the offset + count of the stream.
	/// </summary>
	/// <param name="offset" type="int">start position</param>
	/// <param name="count" type="int">count of bytes</param>
	/// <param name="fname" type="string">path</param>
	/// <returns>
	/// string. Specified count of base64 encoded bytes from specified offset
	/// </returns>
	return this.vault.readBase64(path, offset, count);
};
