var fileSystemAccess = {
	init: function (parentAras) {
		this.fileList = {};
		this.clientData = {};
		this.lastError = '';
		if (parentAras.vault) {
			this.associatedFileList = parentAras.vault.vault.associatedFileList;
			this.fileToMd5 = parentAras.vault.vault.fileToMd5;
		} else {
			this.associatedFileList = {};
			this.fileToMd5 = {};
		}
	},
	getFileChecksum: function (file) {
		if (typeof file === 'string') {
			var parts = file.split(/[\\\/]/);
			var fileID = parts[0];
			file = this.associatedFileList[fileID] || this.fileList[fileID];
		}

		return (
			fileSystemAccess.fileToMd5[
				file.size + '.' + file.name + '.' + file.lastModified
			] || ''
		);
	},
	getFileSize: function (file) {
		if (typeof file === 'string') {
			var parts = file.split(/[\\\/]/);
			var fileID = parts[0];
			return this.associatedFileList[fileID].size;
		} else {
			return file.size;
		}
	},
	sendFiles: function (strUrl) {
		const form = new FormData();

		const httpRequest = new XMLHttpRequest();
		httpRequest.open('POST', strUrl, false);

		const keys = Object.keys(this.clientData);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (key === aras.OAuthClient.authorizationHeaderName) {
				httpRequest.setRequestHeader(key, this.clientData[key]);
				continue;
			}
			form.append(key, this.clientData[key]);
		}

		const fileIds = Object.keys(this.fileList);
		for (let i = 0; i < fileIds.length; i++) {
			const fileId = fileIds[i];
			form.append(fileId, this.fileList[fileId]);
		}

		httpRequest.send(form);

		if (httpRequest.status !== 200) {
			Object.assign(this.associatedFileList, this.fileList);
			this.lastError =
				'Cannot upload file. Exception name: "WebException"; Exception message: "The remote server returned an error: ' +
				httpRequest.status +
				'"';
			return false;
		}
		const xml = httpRequest.responseXML;
		if (xml && xml.firstChild && xml.firstChild.firstChild) {
			const result = xml.firstChild.firstChild.firstChild;
			const isFault =
				result && result.nodeName.toLowerCase() === 'soap-env:fault';
			if (isFault) {
				Object.assign(this.associatedFileList, this.fileList);
			}
		}

		this.response = httpRequest.responseText;
		return true;
	},
	sendFilesAsync: function (serverUrl) {
		const res = Object.keys(aras.vault.vault.fileList).map(function (key) {
			return aras.vault.vault.fileList[key];
		});

		const clientData = this.clientData;
		const credentials = Object.keys(clientData).reduce(function (acc, key) {
			if (key !== 'XMLdata' && key !== 'SOAPACTION') {
				acc[key] = clientData[key];
			}
			return acc;
		}, {});

		let vaultModule;
		if (window.itemTypeName === 'File' && !window.frameElement) {
			const mainWnd = aras.getMainWindow();
			vaultModule = mainWnd.ArasModules.vault;
		} else {
			vaultModule = ArasModules.vault;
		}

		vaultModule.options.serverUrl = serverUrl;
		vaultModule.options.credentials = credentials;

		const handleResult = function (res) {
			this.response = res.xml || res.parentNode.xml;
			return true;
		}.bind(this);

		return vaultModule
			.send(res, clientData.XMLdata)
			.then(handleResult)
			.catch(function (res) {
				if (res instanceof Error) {
					res = aras.IomInnovator.newError(res.message).dom;
				}
				return handleResult(res);
			});
	},
	clearClientData: function () {
		this.clientData = {};
	},
	addFileToList: function (fileID, filepath) {
		if (!filepath) {
			this.lastError = 'Filename is empty';
			return false;
		}

		if (this.associatedFileList[fileID]) {
			this.fileList[fileID] = this.associatedFileList[fileID];
		} else if (typeof filepath !== 'string') {
			this.fileList[fileID] = filepath;
			this.associatedFileList[fileID] = filepath;
		}
		return true;
	},
	removeFileFromList: function (fileId) {
		if (this.associatedFileList[fileId]) {
			delete this.associatedFileList[fileId];
		}
		if (this.fileList[fileId]) {
			delete this.fileList[fileId];
		}
	},
	selectFile: function () {
		return ArasModules.vault
			.selectFile()
			.then(function (file) {
				aras.browserHelper.toggleSpinner(document, true, 'dimmer_spinner');
				return file;
			})
			.then(this.calculateMd5)
			.then(function (file) {
				aras.browserHelper.toggleSpinner(document, false, 'dimmer_spinner');
				return file;
			});
	},
	clearFileList: function () {
		this.fileList = {};
	},
	setClientData: function (name, valueRenamed) {
		this.clientData[name] = valueRenamed;
	},
	getClientData: function (name) {
		return this.clientData[name];
	},
	getResponse: function () {
		return this.response || '';
	},
	setLocalFileName: function (filename) {
		this.localFileName = filename;
	},
	downloadFile: function (strUrl) {
		var fileDownloadUrl = this.makeFileDownloadUrl(strUrl);
		window.ArasModules.vault
			.downloadFile(fileDownloadUrl)
			.catch(function (err) {
				var win = aras.getMostTopWindowWithAras(window);
				win.aras.AlertError(err.message);
			});
		return true;
	},
	makeFileDownloadUrl: function (strUrl) {
		var fileId = /fileID=([^&]+)/gi.exec(strUrl);
		if (!fileId) {
			return false;
		}
		fileId = fileId[1];

		var fileDownloadUrl = aras.IomInnovator.getFileUrl(
			fileId,
			aras.Enums.UrlType.SecurityToken
		);
		if (this.localFileName) {
			fileDownloadUrl = fileDownloadUrl.replace(
				/fileName=.*?(?=&|$)/,
				'fileName=' + encodeURIComponent(this.localFileName)
			);
		}

		fileDownloadUrl += '&contentDispositionAttachment=1';
		return fileDownloadUrl;
	},
	calculateMd5: function (file) {
		var md5Promise = new Promise(function (resolve, reject) {
			require([
				'../browsercode/common/javascript/spark-md5.js'
			], function (SparkMD5) {
				var fileReader = new FileReader();
				var frOnload = function (e) {
					spark.append(e.target.result);
					currentChunk++;
					if (currentChunk < chunks) {
						loadNext();
					} else {
						var md5 = spark.end();
						fileSystemAccess.fileToMd5[
							file.size + '.' + file.name + '.' + file.lastModified
						] = md5;
						resolve(file);
					}
				};
				var chunkSize = 2097152; // read in chunks of 2MB
				var chunks = Math.ceil(file.size / chunkSize);
				var currentChunk = 0;
				var spark = new SparkMD5.ArrayBuffer();
				function loadNext() {
					fileReader.onload = frOnload;
					fileReader.onerror = reject;
					var start = currentChunk * chunkSize;
					var end = Math.min(file.size, start + chunkSize);
					fileReader.readAsArrayBuffer(file.slice(start, end));
				}
				loadNext();
			});
		});

		return md5Promise;
	},
	getLastError: function () {
		return this.lastError;
	},
	readText: function (file, encoding) {
		var fileReader = new FileReader();
		return new Promise(function (resolve, reject) {
			fileReader.onload = function () {
				resolve(this.result);
			};
			fileReader.onerror = reject;
			fileReader.readAsText(file, encoding);
		});
	},
	readBase64: function (file, start, count) {
		return new Promise(function (resolve, reject) {
			var fileReader = new FileReader();
			fileReader.onload = function () {
				resolve(this.result);
			};
			fileReader.onerror = reject;
			fileReader.readAsDataURL(file.slice(start, start + count));
		});
	}
};
