var PasteImageManager = function () {
	this.onPasteImageValidate = function () {};
	this.onPasteImage = function (imageUrl) {};

	Object.defineProperty(this, 'isBrowserSupported', {
		// supported only chrome browser
		get: function () {
			return window.chrome;
		}
	});

	this.pasteImageHandler = function (event) {
		var self = this;
		var isValid = self.onPasteImageValidate();

		if (isValid) {
			var items = (event.clipboardData || event.originalEvent.clipboardData)
				.items;
			var blob = null;

			for (var i = 0; i < items.length; i++) {
				if (items[i].type.indexOf('image') === 0) {
					blob = items[i].getAsFile();
				}
			}

			if (blob !== null) {
				var reader = new FileReader();
				reader.onload = function (event) {
					self.onPasteImage(event.target.result);
				};
				reader.readAsDataURL(blob);
			}
		}
	};

	this.pastEventHandler = dojo.hitch(this, this.pasteImageHandler);

	this.bindPasteEventTo = function (element) {
		if (this.isBrowserSupported) {
			element.addEventListener('paste', this.pastEventHandler);
		}
	};

	this.unbindPasteEventTo = function (element) {
		if (this.isBrowserSupported) {
			element.removeEventListener('paste', this.pastEventHandler);
		}
	};
};

dojo.setObject('VC.PasteImageManager', new PasteImageManager());
