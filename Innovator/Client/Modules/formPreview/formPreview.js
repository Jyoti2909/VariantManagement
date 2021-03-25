var formPreview = {
	errorMessage: '',
	defaultMessage: '',
	clearForm: function (message) {
		document.getElementById('preview-iframe').src = '';
		document.querySelector('#form-preview-disable p').textContent =
			message || formPreview.defaultMessage;
		document.getElementById('form-preview-disable').style.display = 'block';
	},

	onErrorHandler: function () {
		formPreview.clearForm(formPreview.errorMessage);
	},

	subscribeErrors: function (frame) {
		var frameWin = frame.contentWindow;
		frameWin.addEventListener('error', formPreview.onErrorHandler);
		var frames = frameWin.document.querySelectorAll('iframe');
		for (var i = 0; i < frames.length; i++) {
			arguments.callee(frames[i]);
		}
	},

	showItem: function (itemTypeName, itemId, parentAras) {
		parent = window;
		var gettedItem = parentAras.getItemById(itemTypeName, itemId);
		aras = new Aras(parentAras);
		aras.commonProperties = Object.assign({}, aras.commonProperties);
		aras.commonProperties.mainWindow = window;
		aras.getMostTopWindowWithAras = function () {
			return window;
		};
		aras.newIOMInnovator = function () {
			return TopWindowHelper.getMostTopWindowWithAras(
				nativeParent
			).aras.newIOMInnovator();
		};
		aras.uiShowItemEx = function ArasUiShowItemEx(
			itemNd,
			viewMode,
			isOpenInTearOff
		) {
			return TopWindowHelper.getMostTopWindowWithAras(
				nativeParent
			).aras.uiShowItemEx(itemNd, viewMode, isOpenInTearOff);
		};

		ArasModules.Dialog.show = function (type, options) {
			if (
				!options ||
				(options.type !== 'ManageFileProperty' &&
					options.type !== 'Multilingual')
			) {
				aras.AlertError();
				return {
					promise: Promise.reject()
				};
			}

			options.onchange = undefined;
			options.editable = false;
			return TopWindowHelper.getMostTopWindowWithAras(
				nativeParent
			).ArasModules.Dialog.show(type, options);
		};

		aras.AlertError = function () {
			formPreview.onErrorHandler();
		};
		var formFrame = document.getElementById('preview-iframe');
		var isDiscoverOnly = gettedItem.getAttribute('discover_only');

		if (isDiscoverOnly) {
			formPreview.clearForm();
			return;
		}

		if (
			aras.uiShowItemInFrameEx(
				formFrame.contentWindow,
				gettedItem,
				'preview',
				0
			) === false
		) {
			formPreview.onErrorHandler();
			return;
		}
		this.subscribeErrors(formFrame);
		document.getElementById('form-preview-disable').style.display = 'none';
	}
};
