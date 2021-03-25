var deepLinking = (function () {
	var storage;
	let deepLinkingResolve;

	function deepLinkingStorageListener(storageEvent) {
		var changeMessage = function (frame) {
			var win = frame.contentWindow;
			var msg = win.document.getElementById('message');
			if (!msg) {
				frame.addEventListener('load', function () {
					var msg = win.document.getElementById('message');
					msg.textContent = deepLinking.currentMsg;
				});
			} else {
				msg.textContent = deepLinking.currentMsg;
			}
		};

		var setDeepLinkingMessage = function (msg) {
			deepLinking.currentMsg = msg;
			var deepWindowIframe = document.getElementById('deepLinking');
			deepWindowIframe.style.display = 'block';
			document.getElementById('dimmer_spinner').classList.add('aras-hide');
			if (!deepWindowIframe.src) {
				deepWindowIframe.src = 'deepLinking.aspx';
			}
			changeMessage(deepWindowIframe);

			if (deepLinkingResolve) {
				deepLinkingResolve({
					startItemHandled: true
				});
			}
		};

		if (
			storageEvent.key === 'DeepLinkingMainMenu' &&
			storageEvent.newValue === 'opening'
		) {
			storage.removeItem('DeepLinkingMainMenu');
			setDeepLinkingMessage(
				aras.getResource('', 'deep_link.start_opening_item')
			);
		}

		if (
			storageEvent.key === 'DeepLinkingResultOpenItem' &&
			storageEvent.newValue
		) {
			storage.removeItem('DeepLinkingResultOpenItem');
			storage.removeItem('DeepLinkingOpenStartItem');
			setDeepLinkingMessage(storageEvent.newValue);
			window.removeEventListener('storage', deepLinkingStorageListener);
		}
	}

	function mainWindowListener(storageEvent) {
		if (
			storageEvent.key !== 'DeepLinkingOpenStartItem' ||
			!storageEvent.newValue
		) {
			return;
		}
		var item = JSON.parse(storageEvent.newValue);
		var itemTypeName = item.itemTypeName;
		var itemID = item.itemID;

		if (
			!itemTypeName ||
			!itemID ||
			!aras.getLoginName ||
			aras.getLoginName() === ''
		) {
			return;
		}

		storage.removeItem('DeepLinkingOpenStartItem');
		storage.removeItem('DeepLinkingResultOpenItem');
		storage.removeItem('DeepLinkingMainMenu');
		storage.setItem('DeepLinkingMainMenu', 'opening');
		var resultOpenItem = aras.evalMethod('runStartPage', '', {
			itemID: itemID,
			itemTypeName: itemTypeName,
			versionModificator: item.versionModificator
		});

		resultOpenItem
			.then(function (message) {
				storage.setItem('DeepLinkingResultOpenItem', message);
			})
			.catch(function (message) {
				if (message.stack) {
					message =
						aras.getResource('', 'common.an_internal_error_has_occured') +
						' ' +
						message.toString();
				}
				storage.setItem('DeepLinkingResultOpenItem', message);
			});
	}

	function getDeepLinkItemData() {
		var itemData = {
			itemTypeName: null,
			itemID: null,
			versionModificator: null
		};
		var searchParams = new URLSearchParams(
			location.search.substr(1, location.search.length)
		);
		var StartItemStr = searchParams.get('StartItem');
		if (StartItemStr) {
			var arr = StartItemStr.split(':');
			itemData.itemTypeName = arr[0];
			itemData.itemID = arr[1];
			itemData.versionModificator = arr[2];

			if (itemData.itemTypeName && itemData.itemID) {
				return itemData;
			}
		}
	}

	return {
		/*Constant that determines what time DeepLinkingWindow may look MainWindow*/
		SEARCH_TIME_THE_MAIN_WINDOW: 2000,
		currentMsg: '',
		onSuccessfulLogin: function () {
			storage = this.getStorage();
			window.addEventListener('storage', mainWindowListener);
			window.removeEventListener('storage', deepLinkingStorageListener);
		},
		beforeInitializeLoginForm: function () {
			storage = this.getStorage();
			var startItem = getDeepLinkItemData();
			if (startItem) {
				window.addEventListener('storage', deepLinkingStorageListener);
				storage.removeItem('DeepLinkingOpenStartItem');
				storage.setItem('DeepLinkingOpenStartItem', JSON.stringify(startItem));
			}

			window.addEventListener('beforeunload', function () {
				storage.removeItem('DeepLinkingOpenStartItem');
				storage.removeItem('DeepLinkingResultOpenItem');
				storage.removeItem('DeepLinkingMainMenu');
			});

			return new Promise(
				function (resolve) {
					deepLinkingResolve = resolve;
					if (getDeepLinkItemData()) {
						setTimeout(
							function () {
								if (this.currentMsg === '') {
									window.removeEventListener(
										'storage',
										deepLinkingStorageListener
									);
									resolve({
										startItemHandled: false
									});
								}
								resolve({
									startItemHandled: true
								});
							}.bind(this),
							this.SEARCH_TIME_THE_MAIN_WINDOW
						);
					} else {
						resolve({
							startItemHandled: false
						});
					}
				}.bind(this)
			);
		},
		getStorage: function () {
			return window.localStorage;
		}
	};
})();
