function FileUpload(aras, uri) {
	this._aras = aras;
	this._uri = uri;
}

FileUpload.prototype.uploadFiles = function FileUpload_uploadFiles(
	fileList,
	clientData,
	async
) {
	var $Promise = async ? Promise : ArasModules.SyncPromise;

	this._aras.vault.clearClientData();
	for (var i = 0; i < clientData.length; i++) {
		this._aras.vault.setClientData(
			clientData[i].get_name(),
			clientData[i].get_value()
		);
	}

	this._aras.vault.clearFileList();
	for (var fileId in fileList) {
		this._aras.vault.addFileToList(fileId, fileList[fileId]);
	}

	var response;
	var promise = (async
		? this._aras.vault.sendFilesAsync(this._uri)
		: $Promise.resolve(this._aras.vault.sendFiles(this._uri))
	).then(
		function (resolve) {
			response = this._aras.vault.getResponse();

			if (!resolve || !response) {
				this._aras.AlertError(
					this._aras.getResource(
						'',
						'item_methods_ex.failed_upload_file',
						this._uri
					)
				);
				if (!resolve) {
					response += this._aras.vault.getLastError();
				}
				this._aras.AlertError(
					this._aras.getResource('', 'item_methods_ex.internal_error_occured'),
					resolve + '\n' + response,
					this._aras.getResource('', 'common.client_side_err')
				);
				response = null;
			}

			return response;
		}.bind(this)
	);

	return async ? promise : response;
};
