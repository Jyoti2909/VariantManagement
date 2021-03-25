function initTDFItemView(container) {
	container.originDocumentItem = container.item;
	container.documentItem = container.item;
	container.topWindow = container.aras.getMostTopWindowWithAras(
		container.window
	);
	container.isTDFContainerView = true;
	container.tabViewsController = {
		views: {},
		activeViewer: null,
		isTabLoading: false,
		_currentUser: aras.getUserID(),
		controls: {
			tabViewContol: null,
			sidebar: null,
			editorSidebarButton: null
		},
		shareData: {
			tdfSettings: null
		},
		_originMethods: {
			setItem: container.setItem,
			setEditMode: container.setEditMode,
			setViewMode: container.setViewMode,
			onDoneCommand: container.onDoneCommand
		},
		specialFlags: {
			skipEditModeReload: false
		},
		addViewer: function (viewerName, viewerControl) {
			if (viewerName && viewerControl) {
				this.views[viewerName] = viewerControl;
			}
		},
		getViewer: function (viewerName) {
			return this.views[viewerName];
		},
		loadViewer: function (viewerName, targetItem) {
			if (viewerName && viewerName !== this.activeViewer) {
				var targetViewer = this.views[viewerName];

				this.unloadViewer(this.activeViewer);

				if (targetViewer) {
					aras.browserHelper.toggleSpinner(document, true);

					if (!targetViewer.isContentLoaded || targetViewer.isContentLoaded()) {
						this.activeViewer = viewerName;

						setTimeout(
							function () {
								var viewerWindow =
									targetViewer.domNode.contentWindow ||
									targetViewer.domNode.ownerDocument.defaultView;

								Promise.resolve(
									viewerWindow &&
										viewerWindow.loadView &&
										viewerWindow.loadView(targetItem)
								).then(function () {
									aras.browserHelper.toggleSpinner(document, false);
								});
							}.bind(this),
							0
						);
					} else {
						var onLoadHandler = function () {
							this.isTabLoading = false;
							this.loadViewer(viewerName, targetItem);

							targetViewer.domNode.removeEventListener('load', onLoadHandler);
						}.bind(this);

						targetViewer.domNode.addEventListener('load', onLoadHandler);

						isTabLoading = true;
					}
				}
			}
		},
		reloadActiveViewer: function (newItem) {
			if (this.activeViewer) {
				var targetViewer = this.views[this.activeViewer];

				if (targetViewer) {
					var viewerWindow =
						targetViewer.domNode.contentWindow ||
						targetViewer.domNode.ownerDocument.defaultView;

					if (viewerWindow && viewerWindow.reloadView) {
						viewerWindow.reloadView(newItem);
					}
				}
			}
		},
		unloadViewer: function (viewerName) {
			if (viewerName) {
				var targetViewer = this.views[viewerName];

				if (targetViewer) {
					var viewerWindow =
						targetViewer.domNode.contentWindow ||
						targetViewer.domNode.ownerDocument.defaultView;

					if (viewerWindow && viewerWindow.unloadView) {
						viewerWindow.unloadView();
					}
				}

				this.activeViewer = null;
			}
		},
		isViewEditable: function () {
			return (
				aras.isTempEx(container.documentItem) || container.topWindow.isEditMode
			);
		}
	};

	container.setItem = function (newItemNode) {
		var originMethod = container.tabViewsController._originMethods.setItem;
		var isOriginItem =
			newItemNode.getAttribute('id') ===
			container.originDocumentItem.getAttribute('id');

		if (originMethod) {
			originMethod(newItemNode);
		}

		container.documentItem = newItemNode;
		container.originDocumentItem = isOriginItem
			? newItemNode
			: container.originDocumentItem;
	};

	container.setEditMode = function () {
		const originMethod =
			container.tabViewsController._originMethods.setEditMode;
		const specialFlags = container.tabViewsController.specialFlags;

		if (originMethod) {
			originMethod.apply(container, arguments);
		}

		if (!specialFlags.skipEditModeReload) {
			container.tabViewsController.reloadActiveViewer(container.documentItem);
		}
		container.updateMenuState();
	};

	container.setViewMode = function () {
		const originMethod =
			container.tabViewsController._originMethods.setViewMode;

		if (originMethod) {
			originMethod.apply(container, arguments);
		}

		container.tabViewsController.reloadActiveViewer(container.documentItem);
		container.updateMenuState();
	};

	container.onDoneCommand = function () {
		const originMethod =
			container.tabViewsController._originMethods.onDoneCommand;
		const specialFlags = container.tabViewsController.specialFlags;

		specialFlags.skipEditModeReload = true;

		return Promise.resolve(
			originMethod && originMethod.apply(container, arguments)
		).then((doneResult) => {
			specialFlags.skipEditModeReload = false;
			return doneResult;
		});
	};

	container.prepareTdfSettings = function (sourceDocumentItem) {
		var tdfSettings = JSON.parse(
			sourceDocumentItem.getAttribute('TDFSettings') || '{}'
		);

		if (!tdfSettings.presentationConfigurationId) {
			var documentItemType = aras.getItemTypeDictionary(
				sourceDocumentItem.getAttribute('type')
			);
			var presentationRelationships = documentItemType.getRelationships(
				'ITPresentationConfiguration'
			);
			var foundPresentationRelationship =
				presentationRelationships.getItemCount() &&
				presentationRelationships.getItemByIndex(0);

			if (foundPresentationRelationship) {
				tdfSettings.presentationConfigurationId = foundPresentationRelationship.getRelatedItemID();
			} else {
				aras.AlertError(
					aras.getResource(
						'../Modules/aras.innovator.TDF',
						'initialization.presentationNotFound'
					)
				);
			}
		}

		return tdfSettings;
	};

	container.getSwitchOffButtonIds = function () {
		return ['tp_show_editor'];
	};

	container.getSwitchOffDisabledButtonIcons = function () {
		return ['../images/TechDocEditorOff.svg'];
	};

	container.showTabViewControl = function () {
		var tabControl = container.tabViewsController.controls.tabViewContol;

		if (tabControl) {
			tabControl.domNode.style.visibility = 'visible';
		} else {
			setTimeout(container.showTabViewControl, 100);
		}
	};

	container.afterSaveItem = function () {
		var editorSidebarButton =
			container.tabViewsController.controls.editorSidebarButton;

		editorSidebarButton.domNode.style.display = 'block';
	};

	container.onWidgetsLoadedHandler = function () {
		require(['dojo/_base/connect'], function (connect, ready) {
			var tabViewContol = container.window.getViewersTabs();
			var tabId;

			container.tabViewsController.shareData.tdfSettings = container.prepareTdfSettings(
				container.documentItem
			);

			const tabs = tabViewContol.getChildren();
			tabs.forEach((tab) => {
				container.tabViewsController.addViewer(tab.id, tab.getChildren()[0]);
			});
			// register events
			connect.connect(
				tabViewContol,
				'onPreSelectTab',
				container.onPreSelectTabHandler
			);
			document.addEventListener(
				'onSelectSidebarTab',
				container.onSelectTabHandler
			);
			container.tabViewsController.controls.tabViewContol = tabViewContol;

			// at this point, iframes from UrlViewers allready attached to document and shortcuts can be blocked
			returnBlockerHelper.blockInChildFrames(container.window, true);

			container.topWindow.registerCommandEventHandler(
				container.window,
				container.afterSaveItem,
				'after',
				'save'
			);
			container.topWindow.ITEM_WINDOW.registerStandardShortcuts(
				container.window,
				true,
				true
			);
		});
	};

	container.onPreSelectTabHandler = function (sender, eventArguments) {
		if (tabViewsController.isTabLoading) {
			return true;
		}

		if (eventArguments.id !== container.tabViewsController.activeViewer) {
			container.tabViewsController.unloadViewer(
				container.tabViewsController.activeViewer
			);
		}
	};

	container.onSelectTabHandler = function (sender, eventArguments) {
		const tabViewControl = container.window.getViewersTabs();
		const tabId = tabViewControl.getCurrentTabId();

		if (tabId == 'formTab') {
			// when formTab is selected, then item should be returned to initial state
			container.item = container.originDocumentItem;
			container.updateMenuState();
		}

		container.tabViewsController.loadViewer(tabId, container.documentItem);
	};

	container.commandBarChangedHandler = function (evnt) {
		if (
			evnt.locationName === 'ItemWindowSidebar' &&
			evnt.changeType === 'loaded'
		) {
			const sidebarControl = container.getSidebar();
			const editorTabId = 'tp_show_editor';

			container.tabViewsController.controls.sidebar = sidebarControl;
			container.tabViewsController.controls.editorSidebarButton = sidebarControl
				.getChildren()
				.filter(function (childWidget) {
					return childWidget.id === editorTabId;
				})[0];

			if (!aras.isTempEx(container.documentItem)) {
				const viewersTabs = sidebarControl.domNode;
				const editorTab = viewersTabs.querySelector(
					`.aras-tabs__tab[data-id="${editorTabId}"]`
				);
				if (editorTab) {
					editorTab.dispatchEvent(new CustomEvent('click', { bubbles: true }));
					viewersTabs.selectTab(editorTabId);
				}
			}

			container.showTabViewControl();
			document.removeEventListener(
				'commandBarChanged',
				container.commandBarChangedHandler
			);
		}
	};
}
