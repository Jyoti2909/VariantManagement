define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/BaseItemInitializer'
], function (declare, BaseItemInitializer) {
	return declare(BaseItemInitializer, {
		_topWindow: null,
		_selectControl: null,
		_allowedExtensions: '',

		constructor: function (initialParameters) {
			initialParameters = initialParameters || {};
			this._topWindow = this.aras.getMostTopWindowWithAras();
			this._allowedExtensions =
				initialParameters.allowedExtensions || this._allowedExtensions;
		},

		_processInitialization: function (targetItem, optionalParameters) {
			return this.createFile().then(
				function (fileNode) {
					if (fileNode) {
						this._setupFileProperties(targetItem, fileNode, optionalParameters);
						return targetItem;
					}
				}.bind(this)
			);
		},

		_setupFileProperties: function (targetItem, fileNode, optionalParameters) {
			optionalParameters = optionalParameters || {};
			if (optionalParameters.fileProperty) {
				this.aras.setItemProperty(
					targetItem.node,
					optionalParameters.fileProperty,
					fileNode
				);
			}
		},

		_createFileInput: function (optionalParameters) {
			optionalParameters = optionalParameters || {};

			const controlNode = document.createElement('input');
			const allowedExtensions =
				optionalParameters.allowedExtensions || this._allowedExtensions;

			controlNode.style.display = 'none';
			controlNode.type = 'file';

			if (allowedExtensions) {
				controlNode.accept = allowedExtensions;
			}

			return controlNode;
		},

		createFile: function () {
			return this.selectFile().then(
				function (selectedFile) {
					if (selectedFile) {
						return this.aras.newItem('File', selectedFile);
					}
				}.bind(this)
			);
		},

		selectFile: function (optionalParameters) {
			const fileInput = this._createFileInput(optionalParameters);
			// File selection dialog doesn't have cancel event and hidden input will be used as workaround to track
			// that dialog was closed (focus can be moved somewere else from file selection dialog)
			const hiddenInput = document.createElement('input');
			hiddenInput.style.position = 'absolute';
			hiddenInput.style.top = '-1000px';

			document.body.appendChild(fileInput);
			document.body.appendChild(hiddenInput);

			hiddenInput.focus();

			return new Promise(
				function (resolve) {
					let isResolved = false;
					let focusSwitchCounter = 0;

					const resolveSelectedFile = function () {
						if (!isResolved) {
							isResolved = true;
							removeControl();
							resolve(fileInput.files.length && fileInput.files[0]);
						}
					};
					const removeControl = function () {
						document.body.focus();

						hiddenInput.removeEventListener('focus', resolveSelectedFile);
						fileInput.removeEventListener('change', resolveSelectedFile);

						document.body.removeChild(fileInput);
						document.body.removeChild(hiddenInput);
					};

					fileInput.addEventListener('change', resolveSelectedFile);
					hiddenInput.addEventListener('focus', function () {
						focusSwitchCounter++;

						if (focusSwitchCounter === 1) {
							// Focus event can appear before change, so trying to wait for change event or next focus event
							hiddenInput.blur();
							return setTimeout(trySwitchFocus, 400);
						}
						resolveSelectedFile();
					});

					const trySwitchFocus = function () {
						hiddenInput.focus();

						setTimeout(function () {
							if (!focusSwitchCounter) {
								trySwitchFocus();
							}
						}, 200);
					};

					trySwitchFocus();

					fileInput.click();
				}.bind(this)
			);
		}
	});
});
