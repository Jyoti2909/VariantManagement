let confirmationDialogPromise;

function initializeCuiLayoutFunctions(container) {
	container.confirmExitEditMode = () => {
		if (
			!container.aras.isDirtyEx(container.item) ||
			container.aras.isTempEx(container.item)
		) {
			return Promise.resolve(true);
		}

		container.cuiWindowFocusHandler();

		const confirmDialogParams = {
			additionalButton: [
				{
					text: container.aras.getResource('', 'common.discard'),
					actionName: 'discard'
				}
			],
			okButtonText: container.aras.getResource('', 'common.save'),
			title: container.aras.getResource('', 'item_methods_ex.unsaved_changes'),
			buttonsOrdering: ['ok', 'discard', 'cancel']
		};
		const confirmDialogMessage = container.aras.getResource(
			'',
			'item_methods_ex.changes_not_saved'
		);
		return container.ArasModules.Dialog.confirm(
			confirmDialogMessage,
			confirmDialogParams
		).then(function (dialogResult) {
			if (!dialogResult || dialogResult === 'cancel') {
				return false;
			}

			container.ignorePageCloseHooks = true;
			if (dialogResult === 'ok') {
				return container.onDoneCommand();
			}

			return container.onUnlockCommand(false);
		});
	};

	container.cuiWindowBeforeUnloadHandler = (e) => {
		if (
			container.aras.getCommonPropertyValue('exitInProgress') === true ||
			container.ignorePageCloseHooks ||
			!container.aras.isDirtyEx(window.item) ||
			container.aras.isTempEx(window.item)
		) {
			return;
		}

		if (!confirmationDialogPromise) {
			confirmationDialogPromise = container
				.confirmExitEditMode()
				.then(function (shouldCloseWindow) {
					if (shouldCloseWindow) {
						container.close();
					}

					confirmationDialogPromise = null;
				});
		}

		if (!container.arasTabsobj) {
			e.returnValue = container.aras.getResource(
				'',
				'item_methods_ex.unsaved_changes'
			);
			return e.returnValue;
		}
	};

	container.cuiWindowUnloadHandler = () => {
		if (!container.aras) {
			return;
		}

		const item = container.item;
		if (
			container.aras.getCommonPropertyValue('exitInProgress') !== true &&
			!container.ignorePageCloseHooks &&
			container.isEditMode &&
			container.aras.isLockedByUser(item)
		) {
			const beforeCommandRunResult = container.onBeforeCommandRun('unlock');
			if (
				!beforeCommandRunResult ||
				typeof beforeCommandRunResult !== 'string'
			) {
				const unlockItemFromMainWindow = (item, mainWin) => {
					const aras = mainWin.aras;
					const unlockResult = aras.unlockItemEx(item, false);
					if (unlockResult) {
						container.onAfterCommandRun('unlock');
					}
				};
				const mainWindow = container.aras.getMainWindow();
				if (container.frameElement) {
					unlockItemFromMainWindow(item, mainWindow);
				} else {
					mainWindow.setTimeout(unlockItemFromMainWindow, 0, item, mainWindow);
				}
			}
		}

		if (container.itemID) {
			container.aras.uiUnregWindowEx(container.itemID);
		}
	};

	container.cuiWindowFocusHandler = () => {
		const frameId = container.frameElement.id;
		const tabsContainer = container.aras.getMainWindow().mainLayout
			.tabsContainer;
		const tabbar = tabsContainer.getTabbarByTabId(frameId);

		if (tabbar.selectedTab !== frameId) {
			tabbar.selectTab(frameId);
		} else {
			tabbar.focusTab(frameId);
		}
	};

	container.cuiWindowCloseHandler = (callback, ignorePageCloseHooks) => {
		if (
			!callback ||
			container.aras.getCommonPropertyValue('exitInProgress') === true
		) {
			const tabId = container.frameElement.id;
			const tabsContainer = container.aras.getMainWindow().mainLayout
				.tabsContainer;
			const tabBar = tabsContainer.getTabbarByTabId(tabId);
			tabBar.removeTab(tabId, ignorePageCloseHooks);
			return;
		}

		if (confirmationDialogPromise) {
			return;
		}

		if (ignorePageCloseHooks) {
			container.ignorePageCloseHooks = true;
			callback(true);
			return;
		}

		confirmationDialogPromise = container
			.confirmExitEditMode()
			.then((shouldClose) => {
				confirmationDialogPromise = null;
				if (shouldClose) {
					container.cuiWindowUnloadHandler();
					container.removeEventListener(
						'unload',
						container.cuiWindowUnloadHandler
					);
				}

				callback(shouldClose);
			});
	};

	container.initRelationshipsControl = () => {
		container.relationshipsControl = new RelationshipsControlWrapper({
			className: 'aras-item-view__relationship-content',
			id: 'centerMiddle',
			queryString: {
				db: container.databaseName,
				ITName: container.itemTypeName,
				itemID: container.itemID,
				editMode: container.isEditMode,
				toolbar: '1',
				where: 'tabview'
			},
			region: 'center',
			window: container,
			aras: container.aras
		});
	};

	container.getRelationshipPromise = () => {
		const accordion = container.layout.dom.querySelector(
			'.aras-item-view__relationship-accordion'
		);
		if (!accordion) {
			return Promise.resolve();
		}

		container.relationshipsControl.startup();
		container.relationships = new RelationshipsWrapper(
			window.relationshipsControl
		);

		return container.relationshipsControl.loadPromise;
	};

	container.dispatchCustomEvent = (eventName) => {
		const event = new CustomEvent(eventName, { bubbles: true });
		document.dispatchEvent(event);
	};

	const compareItemsByConfigId = (firstItem, secondItem) => {
		const firstItemConfigId = container.aras.getItemProperty(
			firstItem,
			'config_id',
			firstItem.id
		);
		const secondItemConfigId = container.aras.getItemProperty(
			secondItem,
			'config_id',
			secondItem.id
		);

		return firstItemConfigId === secondItemConfigId;
	};

	const itemVersionChangeListener = function (params) {
		const { itemLastVersion } = params;

		if (!compareItemsByConfigId(container.item, itemLastVersion)) {
			return;
		}

		container.layout.actions.updateItemId(itemLastVersion.id);
	};

	const itemLockListener = function (params) {
		const { itemNd } = params;

		if (!compareItemsByConfigId(container.item, itemNd)) {
			return;
		}

		container.item = itemNd;
		container.itemID = itemNd.id;
		container.layout.observer.notify('UpdateTearOffWindowState');
	};

	container.initCuiLayout = () => {
		const layoutNode = document.getElementById('formTab');
		const options = container.getDefaultOptions(
			container.itemID,
			container.itemTypeName
		);
		container.layout = new ItemViewCuiLayout(layoutNode, 'ItemView', options);
		container.addEventListener('unload', () => {
			container.aras.unregisterEventHandler(
				'ItemVersion',
				container,
				itemVersionChangeListener
			);
			container.aras.unregisterEventHandler(
				'ItemLock',
				container,
				itemLockListener
			);

			container.layout.destroy();
		});
		container.aras.registerEventHandler(
			'ItemVersion',
			container,
			itemVersionChangeListener
		);
		container.aras.registerEventHandler(
			'ItemLock',
			container,
			itemLockListener
		);
		return container.layout.init().then(function () {
			const commandBarNode = document.querySelector(
				'#top-toolbars .aras-commandbar'
			);
			if (commandBarNode) {
				const itemTypeColor = container.aras.getItemTypeColor(
					container.itemTypeName,
					'name'
				);
				commandBarNode.style.borderBottom = '4px solid ' + itemTypeColor;
			}
		});
	};

	container.initTearOffMenuController = () => {
		const tearOffMenuController = new TearOffMenuController({
			view: viewType,
			aras: window.aras
		});
		tearOffMenuController.menuFrameReady = true;
		tearOffMenuController.initSvgManager();
		tearOffMenuController.initController();
		container.tearOffMenuController = tearOffMenuController;
		return clientControlsFactory.createControl(
			'Aras.Client.Frames.TearOffMenu',
			{ tearOffMenuController: tearOffMenuController }
		);
	};

	container.initTabContainer = (widgets) => {
		const sidebarSwitcher = document.querySelector('aras-switcher#viewers');
		if (!sidebarSwitcher) {
			return;
		}

		container.tabContainer = new TabContainerWrapper(sidebarSwitcher);
		for (const widget of widgets) {
			if (
				widget.domNode &&
				widget.domNode.parentElement === tabContainer.switcher
			) {
				container.tabContainer.createTab(widget, widget.id);
			}
		}
	};

	container.parseDojoLayout = (parser) => {
		return parser.parse({ noStart: true });
	};
}
