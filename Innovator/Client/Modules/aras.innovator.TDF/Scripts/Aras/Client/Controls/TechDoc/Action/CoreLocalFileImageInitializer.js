define([
	'dojo/_base/declare',
	'TDF/Scripts/Aras/Client/Controls/TechDoc/Action/LocalFileInitializer'
], function (declare, LocalFileInitializer) {
	return declare(LocalFileInitializer, {
		_allowedExtensions: 'image/*',

		_setupFileProperties: function (targetItem, fileNode) {
			if (fileNode) {
				const fileId = fileNode.getAttribute('id');
				let fileName = this.aras.getItemProperty(fileNode, 'filename');

				fileName = this._truncateFileName(fileName);

				targetItem.setProperty('src', 'vault:///?fileId=' + fileId);

				targetItem.setProperty('name', fileName);
			}
		},

		_truncateFileName: function (fileName) {
			const fileNameLength = fileName.length;
			if (fileNameLength > 128) {
				const extensionStartIndex = fileName.lastIndexOf('.');

				if (extensionStartIndex === -1) {
					fileName = fileName.substring(0, 128);
				} else {
					const extensionLength = fileNameLength - extensionStartIndex;

					fileName =
						fileName.substring(0, 128 - extensionLength) +
						fileName.substring(extensionStartIndex);
				}
			}
			return fileName;
		},

		createFile: function () {
			return this.inherited(arguments).then(
				function (fileNode) {
					this.aras.browserHelper.toggleSpinner(this._topWindow.document, true);

					return this.aras.saveItemExAsync(fileNode).then(
						function (savedFileNode) {
							const unlockedItem =
								savedFileNode && this.aras.unlockItemEx(savedFileNode);
							this.aras.browserHelper.toggleSpinner(
								this._topWindow.document,
								false
							);
							return unlockedItem;
						}.bind(this)
					);
				}.bind(this)
			);
		}
	});
});
