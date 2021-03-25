function isItemEditable(itemNode) { // eslint-disable-line no-unused-vars
	if (aras.isNew(itemNode)) {
		return true;
	}
	if (aras.getItemProperty(itemNode, 'is_current') === '0') {
		return false;
	}
	let reqCanUpdateRequest = aras.newIOMItem('re_Requirement', 'getPermissions');
	reqCanUpdateRequest.setID(itemNode.getAttribute('id'));
	reqCanUpdateRequest.setAttribute('access_type', 'can_update');
	reqCanUpdateRequest = reqCanUpdateRequest.apply();

	return !(reqCanUpdateRequest.isError() || reqCanUpdateRequest.getResult() === '0');
}

function showRequirementItem(requirementNode, configId) { // eslint-disable-line no-unused-vars
	// Need to cleanup "config_id" property to avoid "Not a single item" exception for new items.
	// When SSVC license is applied, Sidebar is loaded at left side of window.
	// "getSsvcFormViewSettings" method is called. If "config_id" property no empty request on server will be done.
	// As result exception will be thrown because item is newly created and unsaved yet.
	// "config_id" should be restored after sidebar loading
	const isNewRequirement = aras.isNew(requirementNode);
	if (isNewRequirement) {
		aras.setItemProperty(requirementNode, 'config_id', '');
	}

	const showItemPromise = aras.uiShowItemEx(requirementNode, 'tab view');

	showItemPromise.then(function() {
		const newWnd = aras.uiFindWindowEx(requirementNode.getAttribute('id'));

		if (isNewRequirement) {
			const restoreConfigId = function() {
				aras.setItemProperty(requirementNode, 'config_id', configId);
				newWnd.removeEventListener('loadSideBar', restoreConfigId);
			};

			newWnd.addEventListener('loadSideBar', restoreConfigId);
		}

		const contentTabId = aras.getRelationshipTypeId('re_Req_Doc_Content');
		const tabIframe = relationships.iframesCollection[contentTabId];
		const Synchronizer = tabIframe.contentWindow.Synchronizer;
		const relationshipNode = requirementNode.parentNode.parentNode;

		newWnd.fromRelationships = itemID;
		new Synchronizer(relationshipNode.getAttribute('id'), newWnd);
	});
}

function requirementOnSaveAndExitCommand() { // eslint-disable-line no-unused-vars
	const msg = onBeforeCommandRun('save');
	if (msg && typeof (msg) == 'string') {
		aras.AlertError(msg);
		return Promise.resolve(false);
	}

	const SavedAttributes = {};
	function SaveItemAttributes(ItemNd) {
		//for now save only doGetItem attribute
		const attrNm = 'doGetItem';
		SavedAttributes[attrNm] = ItemNd.getAttribute(attrNm);
	}

	function RestoreItemAttributes(ItemNd) {
		for (let attrNm in SavedAttributes) {
			let attrVal = SavedAttributes[attrNm];
			if (attrVal == null) {
				ItemNd.removeAttribute(attrNm);
			} else {
				ItemNd.setAttribute(attrNm, attrVal);
			}
		}
	}

	let statusId = aras.showStatusMessage('status', aras.getResource('', 'common.saving'), '../images/Progress.gif');

	const isSpinnerNecessary = item.selectNodes('descendant-or-self::Item[@type="File" and (@action="add" or @action="update")]').length > 0;
	let spinner;
	if (isSpinnerNecessary) {
		spinner = document.getElementById('dimmer_spinner');
		spinner.classList.remove('disabled-spinner');
	}

	SaveItemAttributes(item);
	//to improve perfomance of save operation, because results of "get" will be discarded by "unlock" below.
	item.setAttribute('doGetItem', '1');
	return aras.saveItemExAsync(item, false, null, false).then(function(res) {
		aras.clearStatusMessage(statusId);
		if (isSpinnerNecessary) {
			spinner.classList.add('disabled-spinner');
		}
		if (!res) {
			RestoreItemAttributes(item);
			return true;
		}

		res.setAttribute('levels', '-1'); //invalidates cached item because there was no "get"

		onAfterCommandRun('save');

		res = aras.getItemById$skipServerCache(itemTypeName, res.getAttribute('id'), 0, 'locked_by_id');
		if (!res) {
			return true;
		}
		res.setAttribute('levels', '-1'); //invalidates cached item because there was no "get"

		statusId = aras.showStatusMessage('status', aras.getResource('', 'common.unlocking'), '../images/Progress.gif');
		aras.clearStatusMessage(statusId);
		if (!res) {
			return true;
		}
		window.item = res;
		updateItemsGrid(res);

		if (window.isTearOff) {
			window.close();
		}
		return true;
	});
}

function getDefaultLanguage() { // eslint-disable-line no-unused-vars
	return 'en';
}

require({packages: [{name: 'RE', location: '../../Solutions/RE'}]},
	['dojo/ready', 'dojo/parser', 'dijit/dijit', 'dojo/aspect',
		'RE/Scripts/UI/RequirementContainer'],
	function(ready, parser, dijit, aspect, RequirementContainer) {
		ready(function() {
			var topWindow = aras.getMostTopWindowWithAras(window);
			let isItemSet = false;
			let setItemSubscription;

			const showSpinner = function() {
				aras.browserHelper.toggleSpinner(topWindow.document, true);
			};

			const stopSpinner = function(forceStop) {
				if (!reqContainer.isEditorLoaded || forceStop) {
					setTimeout( function() {
						aras.browserHelper.toggleSpinner(topWindow.document, false);
					}, 0);
				}
			};

			aspect.before(topWindow, 'onLockCommand', function() {
				showSpinner();
				isItemSet = false;
				setItemSubscription = aspect.before(topWindow, 'setItem', function() {
					setItemSubscription.remove();
					isItemSet = true;
				});
			});

			aspect.after(topWindow, 'onLockCommand', function() {
				setItemSubscription.remove();
				stopSpinner(!isItemSet);
			});

			topWindow.registerCommandEventHandler(topWindow, showSpinner, 'before', 'unlock');

			topWindow.registerCommandEventHandler(topWindow, stopSpinner, 'after', 'unlock');

			topWindow.registerCommandEventHandler(topWindow, showSpinner, 'before', 'refresh');

			topWindow.registerCommandEventHandler(topWindow, stopSpinner, 'after', 'refresh');

			aspect.around(aras, 'applyItemWithFilesCheckAsync', function(originalApply) {
				return function(itemNd, win, statusMsg, XPath2ReturnedNd, isGridUpdate) {
					if (!XPath2ReturnedNd) {
						XPath2ReturnedNd = this.XPathResult('/Item');
					}

					let res;
					let promise;
					const files = itemNd.selectNodes('descendant-or-self::Item[@type="File" and (@action="add" or @action="update")]');

					let statusId;
					if (statusMsg) {
						statusId = this.showStatusMessage('status', statusMsg, system_progressbar1_gif);
					}
					if (files.length) {
						res = this.soapSend('generateNewGUID', '');
					} else {
						res = this.soapSend('ApplyItem', itemNd.xml, '', isGridUpdate);
					}

					if (res.getFaultCode() != 0) {
						var errorString = res.getFaultString();
						if (errorString != 'conflict') {
							this.AlertError(res, win);
						} else {
							var evnt = document.createEvent('Event');
							evnt.conflictResult = res;
							evnt.conflictItemId = topWindow.item.getAttribute('id');
							evnt.initEvent('RequirementConflict', true, false);
							topWindow.dispatchEvent(evnt);
						}

						promise = Promise.resolve(null);
					} else {
						if (files.length) {
							promise = this.sendFilesWithVaultAppletAsync(itemNd, statusMsg, XPath2ReturnedNd);
						} else {
							promise = Promise.resolve(res.results.selectSingleNode(XPath2ReturnedNd));
						}
					}

					return promise.then(function(res) {
						if (statusId) {
							this.clearStatusMessage(statusId);
						}
						return res;
					}.bind(this));
				};
			});

			var reqContainer = new RequirementContainer({itemTypeName: item.getAttribute('type')});

			let deferredRefreshContentGrid;
			const contentTabId = aras.getRelationshipTypeId('re_Req_Doc_Content');

			const refreshContentGrid = function() {
				var evnt = topWindow.document.createEvent('Event');
				evnt.initEvent('refreshContentGrid', true, false);
				topWindow.document.dispatchEvent(evnt);
			};

			dijit.byId('viewers').createTab(reqContainer, 'editor_container');
			topWindow.techDocContainer = reqContainer;

			if (aras.isNew(item)) {
				const afterSaveItemEventKey = topWindow.registerCommandEventHandler(window, function() {
					const sidebarControl = getSidebar();

					const editorSidebarButton = sidebarControl.getChildren().filter(function(childWidget) {
						return childWidget.id === topWindow.techDocContainer.currentItemTypeContext.sideBarButtonName;
					})[0];
					editorSidebarButton.domNode.style.display = 'block';
					topWindow.unregisterCommandEventHandler(afterSaveItemEventKey);
				}, 'after', 'save');
			}

			const editedRelationshipItems = [];
			if (item.getAttribute('type') === 're_Requirement_Document') {
				topWindow.registerCommandEventHandler(window, function() {
					editedRelationshipItems.length = 0;
					const allRequirements = item.selectNodes('Relationships/Item/related_id/Item[@type=\'re_Requirement\']');

					for (let i = 0; i < allRequirements.length; i++) {
						const req = allRequirements[i];
						if (aras.isLockedByUser(req) && !aras.isEditStateEx(req)) {
							editedRelationshipItems.push(req);
						}
					}
				}, 'before', 'save');

				topWindow.registerCommandEventHandler(window, function() {
					let requestAml = '';
					let lastVersionItems = [];
					let relatedItemIdsToReshow = {};

					editedRelationshipItems.forEach(function(editedRelatedItem) {
						const relatedItemId = editedRelatedItem.getAttribute('id');
						const relatedItemWindow = aras.uiFindWindowEx(relatedItemId);

						if (relatedItemWindow) {
							const relatedItemConfigId = aras.getItemProperty(editedRelatedItem, 'config_id', relatedItemId);
							let lastItemVersion = aras.newIOMItem('re_Requirement', 'getItemLastVersion');
							lastItemVersion.setAttribute('id', relatedItemId);
							requestAml += lastItemVersion.node.xml;

							if (relatedItemWindow && relatedItemConfigId) {
								relatedItemIdsToReshow[relatedItemConfigId] = relatedItemId;
							}
						} else {
							lastVersionItems.push(editedRelatedItem);
						}
					});

					if (requestAml) {
						const newItemIdResult = aras.soapSend('ApplyAML', '<AML>' + requestAml + '</AML>').getResult();
						lastVersionItems = lastVersionItems.concat(ArasModules.xml.selectNodes(newItemIdResult, 'Item'));
					}

					lastVersionItems.forEach(function(itemLastVersion) {
						const relatedItemId = itemLastVersion.getAttribute('id');
						const relatedItemConfigId = aras.getItemProperty(itemLastVersion, 'config_id', relatedItemId);
						const oldIdToReshow = relatedItemIdsToReshow[relatedItemConfigId];

						if (aras.uiFindWindowEx(oldIdToReshow)) {
							aras.uiReShowItemEx(oldIdToReshow, itemLastVersion);
						}

						if (!aras.getFromCache(relatedItemId)) {
							aras.addToCache(itemLastVersion);
						} else {
							aras.updateInCache(itemLastVersion);
						}
					});
				}, 'after', 'save');
			}

			document.addEventListener('onSelectSidebarTab', function(evnt) {
				if (dijit.byId('viewers').getCurrentTabId() == 'editor_container' && evnt.selectedTabType == 're_editor') {
					if (!reqContainer.isEditorLoaded) {
						aras.browserHelper.toggleSpinner(window.document, true);
					}
					dijit.byId('sidebar').switchSidebarButton(reqContainer.currentItemTypeContext.sideBarButtonName,
						reqContainer.currentItemTypeContext.imageEditOn, true);
				}
			});

			document.addEventListener('commandBarChanged', function(evnt) {
				if (evnt.commandBarTarget === reqContainer.currentItemTypeContext.sideBarButtonName &&
					evnt.changeType === 'click') {
					if (!reqContainer.isEditorLoaded) {
						var editorFrame = reqContainer.domNode;

						editorFrame.addEventListener('load', function(e) {
							topWindow.ITEM_WINDOW.registerStandardShortcuts(editorFrame.contentWindow, true);
						});

						reqContainer.loadEditor();
					} else {
						var evnt = document.createEvent('Event');
						evnt.initEvent('LoadEditorTab', true, false);
						document.dispatchEvent(evnt);
					}
				} else if (evnt.commandBarTarget === reqContainer.currentItemTypeContext.sideBarFormButtonName &&
					evnt.changeType === 'click' && topWindow.relationships) {
					if (deferredRefreshContentGrid) {
						deferredRefreshContentGrid.remove();
					}

					if (contentTabId === topWindow.relationships.currTabID) {
						refreshContentGrid();
					} else {
						deferredRefreshContentGrid = aspect.after(topWindow.relationships.relTabbar.tabs, 'selectTab', function(method, args) {
							if (args[0] === contentTabId) {
								refreshContentGrid();
								deferredRefreshContentGrid.remove();
								deferredRefreshContentGrid = null;
							}
						});
					}
				}
			});
		});
	});

aras.refreshWindows = function(message, results, saveChanges) {
	if (saveChanges == undefined) {
		saveChanges = true;
	}

	// Skip the refresh if this is the unlock portion of the "Save, Unlock and Close" operation.
	if (!saveChanges) {
		return;
	}

	// If no IDs modified then nothing to refresh.
	var nodeWithIDs = message.selectSingleNode('event[@name=\'ids_modified\']');
	if (!(nodeWithIDs && results)) {
		return;
	}

	// Get list of modified IDs
	var IDsArray = nodeWithIDs.getAttribute('value').split('|');

	// Refresh changed items in search tabs grid
	const topWin = this.getMainWindow();
	IDsArray.forEach((function(itemNodeId) {
		//new item
		const itemNode = results.selectSingleNode('//Item[@id=\'' + itemNodeId + '\']');
		if (!itemNode) {
			return;
		}

		const itemTypeId = itemNode.getAttribute('typeId');
		const itemsGrids = topWin.arasTabs.getSearchGridTabs(itemTypeId);
		itemsGrids.forEach((function(itemsGrid) {
			const grid = itemsGrid.grid;
			if (grid.getRowIndex(itemNodeId) === -1) {
				return;
			}
			//old item
			this.refreshItemsGrid(itemNode.getAttribute('type'), itemNodeId, itemNode, itemsGrid);
		}).bind(this));
	}).bind(this));

	// Check if there are any other opened windows, that must be refreshed.
	var doRefresh = false;
	for (var winId in this.windowsByName) {
		var win = null;
		try {
			if (this.windowsByName.hasOwnProperty(winId)) {
				win = this.windowsByName[winId];
				if (this.isWindowClosed(win)) {
					this.deletePropertyFromObject(this.windowsByName, winId);
					continue;
				}

				// Item doesn't updated if it was changed by action(Manual Release, Create New Revision)
				/*if (win.top_ == top_) added "_" to "top" because we removed all the "top" in this file.
				continue;*/

				doRefresh = true;
				break;
			}
		} catch (excep) {
			continue;
		}
	}
	// Return if there are no windows to refresh.
	if (!doRefresh) {
		return;
	}

	// Get changed item ID (new Item) or new id=0 if item was deleted.
	var itemNode = results.selectSingleNode('//Item');
	var currentID = 0;
	if (itemNode) {
		currentID = itemNode.getAttribute('id');
	}

	var RefreshedRelatedItems = [];
	var RefreshedItems = {};
	var alreadyRefreshedWindows = {};
	var self = this;

	function refreshWindow(oldItemId, itemNd) {
		if (alreadyRefreshedWindows[oldItemId]) {
			return;
		}

		var win = self.uiFindWindowEx(oldItemId);
		if (!win) {
			return;
		}

		alreadyRefreshedWindows[oldItemId] = true;
		alreadyRefreshedWindows[itemNd.getAttribute('id')] = true; //just fo a case item is versionable
		self.uiReShowItemEx(oldItemId, itemNd);
	}
	var dependency = getTypeIdDependencyForRefreshing(IDsArray);
	refreshVersionableItem(dependency);

	function getTypeIdDependencyForRefreshing(IDsArray) {
		var result = {};

		const unLockedItemsNodes = self.itemsCache.getItemsByXPath('//Item[string(locked_by_id)=\'\']');
		const unLockedItemsNodesCollection = {};
		for (let index = 0; index < unLockedItemsNodes.length; index++) {
			const unLockedItemsNode = unLockedItemsNodes[index];
			const unLockedItemId = unLockedItemsNode.getAttribute('id');
			if (!unLockedItemsNodesCollection[unLockedItemId]) {
				unLockedItemsNodesCollection[unLockedItemId] = [];
			}
			unLockedItemsNodesCollection[unLockedItemId].push(unLockedItemsNode);
		}

		for (var i in IDsArray) {
			var itemID = IDsArray[i];
			if (currentID == itemID) {
				continue;
			}

			//not locked items with id=itemID *anywhere* in the cache
			const nodes = unLockedItemsNodesCollection[itemID] || [];
			for (var j = 0; j < nodes.length; j++) {
				itemFromDom = nodes[j];
				var type = itemFromDom.getAttribute('type');
				//if type if LCM, Form, WFM, IT or RelshipType or id already refreshed skip adding it to array
				if (type == 'Life Cycle Map' || type == 'Form' || type == 'Workflow Map' || type == 'ItemType'
					|| type == 'RelationshipType' || RefreshedItems[itemID]) {
					continue;
				}

				var cid = itemFromDom.selectSingleNode('config_id');
				var value;
				if (cid) {
					value = {id: itemID, config_id: cid.text};
				} else {
					value = {id: itemID, config_id: undefined};
				}
				if (result[type]) {
					//get structure: type  = Array of {id, config_id}
					result[type].push(value);
				} else {
					result[type] = [];
					result[type].push(value);
				}
			}
		}
		return result;
	}

	function refreshVersionableItem(dependency) {
		for (let e in dependency) {
			const element = dependency[e];
			//e - type. Type contains multiple ids
			//create server request for data:
			/*
			<Item type="e" action="get">
				<config_id condition="in">id1, id2...</config_id>
				<is_current>1</is_current>
			</Item>
			*/
			const configIds = getConfigIdsForRequest(element);
			if (configIds === '') {
				continue;
			}

			const itemsToRefresh = self.loadItems(e, '<config_id condition=\'in\'>' + configIds + '</config_id>' + '<is_current>1</is_current>', 0);
			itemsToRefresh.forEach(function(itemNode) {
				const configId = itemNode.selectSingleNode('config_id').text;
				const id = getOldIdForRefresh(element, configId);
				refreshWindow(id, itemNode);
				const mainWindow = self.getMainWindow();
				self.refreshItemsGrid(e, id, itemNode, mainWindow);
			});
		}
	}

	function getOldIdForRefresh(dependencyArray, configID) {
		for (var i = 0; i < dependencyArray.length; i++) {
			if (dependencyArray[i].config_id == configID) {
				return dependencyArray[i].id;
			}
		}
	}

	function getConfigIdsForRequest(dependencyArray) {
		var preResult = []; //create array of ids for request in order to make request string in the end
		var result = '';
		for (var i = 0; i < dependencyArray.length; i++) {
			if (dependencyArray[i].config_id) {
				preResult.push('\'' + dependencyArray[i].config_id + '\'');
			}
		}
		if (preResult.length > 0) {
			while (preResult.length > 1) {
				result += preResult.pop() + ',';
			}
			result += preResult.pop();
		}
		return result;
	}

	const nodesCache = this.itemsCache.getItemsByXPath('//Item[count(descendant::Item[@isTemp=\'1\'])=0 and string(@isDirty)!=\'1\']');
	const nodesCacheCollection = {};
	for (let sourceIndex = 0; sourceIndex < nodesCache.length; sourceIndex++) {
		const nodeCache = nodesCache[sourceIndex];
		const relatedItemNodes = nodeCache.selectNodes('Relationships/Item/related_id/Item');
		for (let relatedIndex = 0; relatedIndex < relatedItemNodes.length; relatedIndex++) {
			const relatedItemNode = relatedItemNodes[relatedIndex];
			const relatedItemId = relatedItemNode.getAttribute('id');
			if (!nodesCacheCollection[relatedItemId]) {
				nodesCacheCollection[relatedItemId] = [];
			}
			nodesCacheCollection[relatedItemId].push(nodeCache);
		}
	}

	for (var i in IDsArray) {
		var itemID = IDsArray[i];
		//items with related_id=itemID
		const nodesWithRelatedItems = nodesCacheCollection[itemID] || [];

		// processing of items with related_id=itemID
		for (var j = 0; j < nodesWithRelatedItems.length; j++) {
			var itemNd = nodesWithRelatedItems[j];
			var id = itemNd.getAttribute('id');
			var type = itemNd.getAttribute('type');
			var bAlreadyRefreshed = false;
			for (var k = 0; k < RefreshedRelatedItems.length; k++) {
				if (id == RefreshedRelatedItems[k]) {
					bAlreadyRefreshed = true;
					break;
				}
			}

			if (bAlreadyRefreshed) {
				continue;
			} else {
				RefreshedRelatedItems.push(id);
			}

			if (id == currentID) {
				continue;
			}

			if (type == 'Life Cycle Map' || type == 'Form' || type == 'Workflow Map' || type == 'ItemType') {
				continue;
			}

			//IR-006509
			if (!this.isDirtyEx(itemNd)) {
				var relatedIds = itemNd.selectNodes('Relationships/Item/related_id[Item/@id="' + currentID + '"]');

				//update related_id nodes in cache
				for (var relatedIndex = 0, L = relatedIds.length; relatedIndex < L; relatedIndex++) {
					var relshipItem = relatedIds[relatedIndex].parentNode;
					var relshipId = relshipItem.getAttribute('id');
					var relshipType = relshipItem.getAttribute('type');
					var res = this.soapSend('GetItem', '<Item type="' + relshipType + '" id="' + relshipId + '" select="related_id"/>', undefined, false);

					if (res.getFaultCode() == 0) {
						var resRelatedId = res.getResult().selectSingleNode('Item/related_id/Item[@id="' + currentID + '"]');
						if (resRelatedId == null) {
							continue;
						}

						//update attributes and child nodes
						var attr;
						for (var attributeIndex = 0; attributeIndex < resRelatedId.attributes.length; attributeIndex++) {
							attr = resRelatedId.attributes[attributeIndex];
							relatedIds[relatedIndex].setAttribute(attr.nodeName, attr.nodeValue);
						}

						//it more safe than replace node. Because it is possible that there are places where reference to releated_id/Item node
						//is chached in local variable. The replacement would just break the code.
						//mergeItem does not merge attributes in its current implementation. Thus the attributes are copied with the legacy code above.
						this.mergeItem(relshipItem.selectSingleNode('related_id/Item[@id="' + currentID + '"]'), resRelatedId);
					}
				}
			}

			const win = this.uiFindWindowEx(id);
			if (win !== window) {
				refreshWindow(id, itemNd);
			}
		} // ^^^ processing of items with related_id=itemID
	}
};
