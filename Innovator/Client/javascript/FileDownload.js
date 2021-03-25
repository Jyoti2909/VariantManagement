var FileDownload = {
	downloadFile: function (fileUrl, filePath, headers) {
		var vault = aras.vault;

		vault.clearClientData();
		vault.clearFileList();

		vault.setClientData('SOAPACTION', 'GetFile');
		headers.forEach(function (headder) {
			if (headder.get_name() && headder.get_value()) {
				vault.setClientData(headder.get_name(), headder.get_value());
			}
		});

		var fileName = filePath.replace(/^.*[\\\/]/, '');
		vault.setLocalFileName(fileName);

		if (!vault.downloadFile(fileUrl)) {
			aras.AlertError(
				aras.getResource('', 'item_window.failed_download_file'),
				'item_window: ' + vault.getLastError(),
				aras.getResource('', 'common.client_side_err')
			);
		}
		return true;
	}
};
