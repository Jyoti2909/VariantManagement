(function () {
	var rm;

	window._getLocation = function () {
		return window.location;
	};

	window.selectStartPage = function selectStartPage() {
		const startingPage = aras.user.userInfo.startingPage;
		const tmpPage = aras.evalMethod('selectStartPage', '');
		const itemTypeName = tmpPage || startingPage;

		if (itemTypeName) {
			const itemTypeId = aras.getItemTypeId(itemTypeName);
			const mainTreeApplet = window.mainLayout.navigationPanel.nav;
			mainTreeApplet.data.forEach(function (value, key) {
				if (!mainTreeApplet.selected && itemTypeId === value.itemTypeId) {
					mainTreeApplet.expand(key, true);
					mainTreeApplet
						.querySelector('[data-key="' + key + '"] .aras-nav-leaf-ico')
						.dispatchEvent(new CustomEvent('click', { bubbles: true }));
				}
			});
		}

		const searchParams = new URLSearchParams(
			window.location.search.substr(1, window.location.search.length)
		);
		const startItemStr = searchParams.get('StartItem');
		if (startItemStr) {
			const startItemSetting = startItemStr.split(':');
			aras.evalMethod('runStartPage', '', {
				itemID: startItemSetting[1],
				itemTypeName: startItemSetting[0],
				versionModificator: startItemSetting[2]
			});
		}
	};

	window.updateTree = function () {
		window.mainLayout.observer.notify('UpdateTOC');
	};

	window.registerShortcutsAtMainWindowLocation = function (
		settings,
		itemTypeName,
		itemType
	) {
		if (settings) {
			var loadParams = {
				locationName: 'MainWindowShortcuts',
				item_classification: '%all_grouped_by_classification%',
				itemTypeName: itemTypeName,
				itemType: itemType
			};

			window.cui.loadShortcutsFromCommandBarsAsync(loadParams, settings);
		}
	};

	function checkCachingMechanism() {
		var checkCachingMechanismUrl =
			aras.getScriptsURL() + 'CheckCachingMechanism.aspx';
		var requestSettings = {
			url: checkCachingMechanismUrl,
			restMethod: 'GET',
			async: true
		};

		var firstRequestResponse;

		return ArasModules.soap('', requestSettings)
			.then(function (responseText) {
				firstRequestResponse = responseText;

				return ArasModules.soap('', requestSettings);
			})
			.then(function (secondRequestResponse) {
				return firstRequestResponse === secondRequestResponse;
			});
	}

	function disableFileDrop() {
		// disable drop file by all iframes in the window
		var prevent = function (e) {
			e.preventDefault();
		};
		// disable drag&drop for Innovator iframes
		// to prevent an attempt to open a dropped file in a browser
		// so as not to replace the Innovator itself
		[].forEach.call(
			window.document.querySelectorAll('#tz, #deepLinking, #dimmer_spinner'),
			function (elm) {
				elm.contentWindow.addEventListener('drop', prevent);
				elm.contentWindow.addEventListener('dragover', prevent);
			}
		);

		// disable drop file by window
		window.addEventListener('drop', prevent);
		window.addEventListener('dragover', prevent);
	}

	window.onLogoutCommand = function (event) {
		if (event) {
			event.preventDefault();
		}

		return new Promise(function (resolve) {
			if (
				!aras.getCommonPropertyValue('exitInProgress') &&
				window.aras.isDirtyItems()
			) {
				aras.dirtyItemsHandler();
				resolve();
			} else {
				// Close opened windows to have the same behaviour as in onunload handler.
				// Additionally this call helps to avoid warning that may be shown
				// in onbeforeunload when active tab is not home tab.
				aras.setCommonPropertyValue('exitInProgress', true);
				const tabscontainer = window.mainLayout.tabsContainer;
				tabscontainer.dockHeaderTabs.forceCloseAllTabs();
				tabscontainer.undockHeaderTabs.forceCloseAllTabs();

				aras.getOpenedWindowsCount(true);

				setTimeout(function () {
					// Logout at the first from Innovator.
					aras
						.logout()
						// And only then from OAuthServer.
						// Call to logout will trigger current document unloading.
						.then(function () {
							const url = new URL(window._getLocation().href);
							url.searchParams.delete('StartItem');
							aras.OAuthClient.logout({
								state: {
									returnUrl: url.toString()
								}
							});
						})
						.then(resolve);
					// We should reset onunload handler because all necessary logout logic done here.
					window.onunload = null;
				}, 0);
			}
		});
	};

	window.defineWorkElement = function () {
		Object.defineProperty(window, 'work', {
			configurable: true,
			get: function () {
				const arasTabsObj = window.document.querySelector(
					'aras-header-tabs.content-block__main-tabs_active'
				);
				const selectedTabId = arasTabsObj.selectedTab;

				if (!selectedTabId) {
					return window;
				}

				let tabContentWindow;
				const selectedTab = arasTabsObj.data.get(selectedTabId);
				const parentTabId = selectedTab && selectedTab.parentTab;
				if (
					selectedTabId.startsWith('search_') &&
					window.document.getElementById(selectedTabId)
				) {
					tabContentWindow = window.document.getElementById(selectedTabId)
						.contentWindow;
				} else if (
					parentTabId &&
					parentTabId.startsWith('search_') &&
					window.document.getElementById(parentTabId)
				) {
					tabContentWindow = window.document.getElementById(parentTabId)
						.contentWindow;
				} else if (
					selectedTab &&
					window.document.getElementById(selectedTabId)
				) {
					tabContentWindow = window.document.getElementById(selectedTabId)
						.contentWindow;
				}

				return tabContentWindow || window;
			}
		});
	};

	/**
	 * Initialize main window. Called from onSuccessfulLogin function of login.aspx.
	 *
	 * @returns {boolean}
	 */
	window.initialize = function () {
		fixDojoSettings();

		rm = new ResourceManager(
			new Solution('core'),
			'ui_resources.xml',
			aras.getSessionContextLanguageCode()
		);
		aras.setUserReportServiceBaseUrl(
			window._getLocation().href.replace(/(\/Client?)(\/|$)(.*)/i, '$1') +
				'/../SelfServiceReporting'
		);

		var userNd = aras.getLoggedUserItem(true);
		if (!userNd) {
			window.onbeforeunload = '';
			window.close();
			return false;
		}
		if (!document.frames) {
			document.frames = [];
		}

		aras.getPreferenceItemProperty(
			'Core_GlobalLayout',
			null,
			'core_append_items'
		);
		aras.getPreferenceItemProperty(
			'SSVC_Preferences',
			null,
			'default_bookmark'
		);
		aras.getPreferenceItemProperty('ES_Settings', null, 'max_analyzed_chars');

		aras.commonProperties.serverVersion =
			window.arasMainWindowInfo.serverVersion;

		var phoneHomeCall = new PhoneHomeCall(aras);
		phoneHomeCall.tryGetUpdateInfo();
		phoneHomeCall.tryStoreStatistics();

		defineWorkElement();

		var shortcutSettings = {
			windows: [window],
			context: window
		};

		registerShortcutsAtMainWindowLocation(shortcutSettings);

		checkCachingMechanism().then(function (isCachingMechanismWork) {
			if (!isCachingMechanismWork) {
				aras.AlertError(rm.getString('setup.cache_is_disabled'));
			}
		});

		aras.UpdateFeatureTreeIfNeed();

		document.corporateToLocalOffset = aras.getCorporateToLocalOffset();
		PopulateDocByLabels();

		disableFileDrop();

		window.arasTabs = document.getElementById('main-tab');

		window.favorites = new FavoritesManager(
			window.ArasModules,
			window.arasMainWindowInfo
		);

		return true;
	};
})();
