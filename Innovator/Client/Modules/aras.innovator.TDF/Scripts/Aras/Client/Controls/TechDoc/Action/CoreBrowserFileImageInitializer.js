define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/BaseItemInitializer',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/FormDialogItemInitializer'
], function (declare, BaseItemInitializer, FormDialogItemInitializer) {
	return declare(
		'Aras.Client.Controls.TechDoc.Action.CoreBrowserFileImageInitializer',
		BaseItemInitializer,
		{
			_topWindow: null,
			_formDialogItemInitializer: null,

			constructor: function () {
				this._topWindow = this.aras.getMostTopWindowWithAras();
				this._formDialogItemInitializer = new FormDialogItemInitializer({
					aras: this.aras
				});
			},

			_processInitialization: function (targetItem, optionalParameters) {
				const sourceFile = optionalParameters && optionalParameters.sourceFile;

				return this.createImageFile(sourceFile)
					.then(
						function (fileItem) {
							if (fileItem) {
								this._setupFileProperties(targetItem, fileItem);
								return targetItem;
							}
						}.bind(this)
					)
					.then(
						function (initedItem) {
							return this._formDialogItemInitializer.initItem(
								initedItem,
								optionalParameters
							);
						}.bind(this)
					);
			},

			_setupFileProperties: function (targetItem, fileItem) {
				const fileId = fileItem.getId();

				targetItem.setProperty('src', 'vault:///?fileId=' + fileId);
			},

			createImageFile: function (sourceFile) {
				const imageExtension = this._getImageExtensionFromMimeType(
					sourceFile.type
				);

				if (imageExtension) {
					this.aras.browserHelper.toggleSpinner(this._topWindow.document, true);

					return this._readFileData(sourceFile, 'dataurl').then(
						function (fileData) {
							const fileItem = this._saveFileData(fileData, imageExtension);

							this.aras.browserHelper.toggleSpinner(
								this._topWindow.document,
								false
							);

							return fileItem;
						}.bind(this)
					);
				}
			},

			_saveFileData: function (fileData, fileExtension) {
				let base64Data = fileData.replace(/^data:(.*;base64,)?/, '');

				if (base64Data.length % 4 > 0) {
					base64Data += '='.repeat(4 - (base64Data.length % 4));
				}

				let requestItem = this.aras.newIOMItem(
					'Method',
					'tp_CreateFileFromBase64'
				);
				requestItem.setProperty('data', base64Data);
				requestItem.setProperty('extension', fileExtension);
				requestItem = requestItem.apply();

				if (requestItem.isError()) {
					this.aras.AlertError(requestItem);
				} else {
					return requestItem;
				}
			},

			_readFileData: function (targetFile, readType) {
				return new Promise(function (resolve, reject) {
					const fileReader = new FileReader();

					fileReader.onload = function () {
						resolve(fileReader.result);
					};

					fileReader.onerror = function (error) {
						reject(error);
					};

					switch (readType) {
						case 'buffer':
							fileReader.readAsArrayBuffer(targetFile);
							break;
						case 'dataurl':
							fileReader.readAsDataURL(targetFile);
							break;
						default:
							fileReader.readAsText(targetFile);
							break;
					}
				});
			},

			_getImageExtensionFromMimeType: function (mimeType) {
				if (mimeType && mimeType.startsWith('image')) {
					const imageFormat = mimeType.substr(6);

					switch (imageFormat) {
						case 'svg+xml':
							return 'svg';
						default:
							return imageFormat;
					}
				}
			}
		}
	);
});
