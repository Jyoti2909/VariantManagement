function initializeLifecycleToolFunctions(container) {
	const setViewModeBase = container.setViewMode;
	const setEditModeBase = container.setEditMode;

	container.getFrameWindow = function getFrameWindow(frameId) {
		return container.document.getElementById(frameId).contentWindow;
	};

	container.initFormsCache = function initFormsCache(defaultContainerId) {
		container.formsCache = {};
		container.formsCache.defaultMode = 'view';
		container.formsCache.defaultContainerId = defaultContainerId;
		container.formsCache.cache = {};
	};

	container.getItemForm = function getItemForm(itemTypeName, formMode) {
		if (container.formsCache) {
			if (container.formsCache.cache.hasOwnProperty(itemTypeName))
				return container.formsCache.cache[itemTypeName][formMode];
		}

		return undefined;
	};

	container.hideAllItemForms = function hideAllItemForms(formContainer) {
		var itemFormCache, form;

		for (var itemTypeName in container.formsCache.cache) {
			itemFormCache = container.formsCache.cache[itemTypeName];

			for (var modeName in itemFormCache) {
				form = itemFormCache[modeName];
				if (form && form.containerElement === formContainer) {
					form.style.display = 'none';
				}
			}
		}
	};

	// returns first visible form in container
	container.getVisibleItemForm = function getVisibleItemForm(containerElement) {
		var itemFormCache, form;

		containerElement =
			containerElement ||
			container.document.getElementById(
				container.formsCache.defaultContainerId
			);
		for (var itemTypeName in container.formsCache.cache) {
			itemFormCache = container.formsCache.cache[itemTypeName];

			for (var modeName in itemFormCache) {
				form = itemFormCache[modeName];
				if (
					form &&
					form.containerElement == containerElement &&
					form.style.display !== 'none'
				) {
					return form;
				}
			}
		}
		return null;
	};

	// adds form for itemTypeName in formMode to cache
	container.addFormToCache = function addFormToCache(
		itemTypeName,
		formMode,
		form
	) {
		if (itemTypeName && formMode) {
			if (!container.formsCache.cache.hasOwnProperty(itemTypeName))
				container.formsCache.cache[itemTypeName] = {};

			container.formsCache.cache[itemTypeName][formMode] = form;
		}
	};

	// descriptionNode: xmlElement with item description, containerElement: domElement which form will be attached to
	container.showItemForm = function showItemForm(
		itemTypeName,
		formMode,
		descriptionNode,
		containerElement,
		userChangeHandler
	) {
		if (container.formsCache) {
			var cachedForm = null;
			itemTypeName = itemTypeName || '';
			formMode = formMode || container.formsCache.defaultMode;
			containerElement =
				containerElement ||
				container.document.getElementById(
					container.formsCache.defaultContainerId
				);

			if (itemTypeName) {
				cachedForm = container.getItemForm(itemTypeName, formMode);

				if (!cachedForm) {
					var formId = itemTypeName + '_' + formMode;

					cachedForm = document.createElement('iframe');
					cachedForm.setAttribute('id', formId);
					cachedForm.setAttribute('frameBorder', '0');
					cachedForm.setAttribute('width', '100%');
					cachedForm.setAttribute('height', '100%');
					cachedForm.setAttribute('scrolling', 'no');
					cachedForm.style.position = 'relative';

					cachedForm.formContentLoaded = false;
					cachedForm.itemTypeName = itemTypeName;
					containerElement.appendChild(cachedForm);
					cachedForm.containerElement = containerElement;
					container.addFormToCache(itemTypeName, formMode, cachedForm);
				}
				// if user send description then fill form with item properties
				if (descriptionNode) {
					if (cachedForm.formContentLoaded) {
						container.parent.aras.uiPopulateFormWithItemEx(
							cachedForm.contentDocument,
							descriptionNode,
							'',
							formMode == 'edit'
						);
					} else {
						container.parent.aras.uiShowItemInFrameEx(
							cachedForm.contentWindow,
							descriptionNode,
							formMode
						);
						cachedForm.onload = function () {
							container.parent.ITEM_WINDOW.registerStandardShortcuts(
								this.contentWindow
							);
							if (container.parent.returnBlockerHelper) {
								container.parent.returnBlockerHelper.attachBlocker(
									this.contentWindow
								);
							}

							cachedForm.contentDocument.userChangeHandler = userChangeHandler;
							cachedForm.contentDocument.documentElement.focus();
							cachedForm.formContentLoaded = true;
						};
					}
				}
			}

			container.hideAllItemForms(containerElement);
			if (cachedForm) {
				cachedForm.style.display = '';
			}

			return cachedForm;
		}
	};

	container.setMode = function setMode(mode) {
		container.item = container.parent.aras.getItemById(
			'Life Cycle Map',
			container.itemID,
			1,
			'Life Cycle State|Life Cycle Transition'
		);

		container.showItemForm(
			'Life Cycle Map',
			container.isEditMode ? 'edit' : 'view',
			container.item,
			container.lcFormPanel
		);
		container.getFrameWindow('editor').populateWorkflow();
	};

	container.setEditMode = function setEditMode(...args) {
		setEditModeBase(args);

		container.setMode('edit');
	};

	container.setViewMode = function setViewMode(...args) {
		setViewModeBase(args);

		container.setMode('view');
	};

	container.setFlag = function setFlag(flagName, state) {
		container.window[flagName] = state;
	};

	container.setupToolOnLoad = function setupToolOnLoad() {
		container.ITEM_WINDOW.registerStandardShortcuts(container, true);
	};

	container.createTabbar = function createTabbar() {
		container.clientControlsFactory.createControl(
			'Aras.Client.Controls.Experimental.SimpleTabbar',
			undefined,
			function (control) {
				tabbar = control;
				container.clientControlsFactory.on(tabbar, {
					onClick: onTab
				});
				container.initTabbar();
			}
		);
	};

	container.initTabbar = function initTabbar() {
		var tabsRoot = container.parent.aras.uiGenerateRelationshipsTabbar(
				'Life Cycle Map',
				container.itemID
			),
			tabNodes = tabsRoot.selectNodes('/tabbar/tab'),
			currentTab = null;

		for (var i = tabNodes.length - 1; i >= 0; i--) {
			currentTab = tabNodes[i];
			container.tabbar.addTab(
				currentTab.getAttribute('id'),
				currentTab.getAttribute('label')
			);
		}

		container.currTabID = container.tabbar.GetSelectedTab();
		container.setFlag('tabsFReady', true);
	};

	container.onTab = function onTab(tabID) {
		if (container.performOnTabAction) {
			var editor = container.getFrameWindow('editor');
			var isActivityTab = tabID == container.lcstate_id_const;

			if (isActivityTab) {
				editor.showActivity(editor.lastSelectedActivityID);
				editor.workflowApplet.nodes.select(editor.lastSelectedActivityID, true);
			} else {
				editor.showTransition(editor.lastSelectedTransID);
				editor.workflowApplet.transitions.select(
					editor.lastSelectedTransID,
					true
				);
			}
		}

		container.currTabID = tabID;
		container.performOnTabAction = true;
	};
}
