var CuiContextMenu = (function () {
	var aspect;
	require(['dojo/aspect'], function (_aspect) {
		aspect = _aspect;
	});

	function CuiContextMenu() {
		if (!this.private) {
			this.private = {
				declare: function (fieldName, func) {
					var boundFunc = func.bind(self);
					this[fieldName] = boundFunc;
				}
			};
		}
		this.private.aspectItems = [];
		this.private.popupMenuReinitDataById = {};

		this.private.declare('_getDataForPopupMenu', function (
			popupMenu,
			items,
			itemStates,
			contextParams,
			contextItem
		) {
			const onClickHandlerMap = {};
			const menuItemsList = {};
			let isPreviousSeparator = false;
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				const type = item.getAttribute('type');
				if (!type) {
					continue;
				}
				const isSeparator =
					type.toLowerCase() === 'commandbarseparator' ||
					type.toLowerCase() === 'commandbarmenuseparator';

				// logic to prevent showing two consecutive separators
				if (isSeparator) {
					if (isPreviousSeparator) {
						continue;
					} else {
						isPreviousSeparator = true;
					}
				}

				const commandIdNode = item.selectSingleNode('name');
				let commandId = commandIdNode ? commandIdNode.text : '';

				const initMethodName = this.utils.getOnInitHandlerName(item);
				this.private.popupMenuReinitDataById[commandId] = {
					handler: initMethodName,
					cuiItem: item
				};

				if (
					!itemStates ||
					itemStates[commandId] ||
					itemStates[commandId] === undefined
				) {
					const iconNode = item.selectSingleNode('image');
					const icon = iconNode ? iconNode.text : '';
					let additionalData = this.utils.getCommandBarItemAdditionalData(item);
					if (initMethodName) {
						contextItem.controlId = commandId;
						contextItem.contextParams = contextParams;
						contextItem.additionalData = additionalData;
						const initData = this.utils.evalCommandBarItemMethod(
							initMethodName,
							contextItem
						);
						additionalData = Object.assign(additionalData || {}, initData);
					}
					let label = null;
					if (!isSeparator) {
						const labelNode = item.selectSingleNode('label');
						label = labelNode ? labelNode.text : '';
						if (
							!label &&
							additionalData &&
							additionalData['cui_resource_key']
						) {
							label = aras.getResource(
								additionalData['cui_resource_solution'] || '',
								additionalData['cui_resource_key']
							);
						}
						const clickHandler = this.utils.getOnClickHandler(item);
						if (clickHandler) {
							onClickHandlerMap[commandId] = clickHandler;
						}
						isPreviousSeparator = false;
					}

					let key = item.getAttribute('id') || commandId;
					// Separator without id and name can be obtained from builder method. So some identificator is needed to distinguish separators
					if (!key && isSeparator) {
						commandId = key = 'separator' + i;
					}
					const parentElementId = this.utils.getParentMenuId(item);
					const isItemDisabled =
						additionalData &&
						(additionalData.disabled || additionalData['cui_disabled']);
					menuItemsList[key] = {
						id: commandId,
						name: label || commandId,
						icon: icon,
						parentId: parentElementId,
						disable: isItemDisabled,
						additionalData: additionalData,
						separator: isSeparator
					};
				}
			}
			const menuData = [];
			for (let key in menuItemsList) {
				const menuItem = menuItemsList[key];
				const parentElementId = menuItem.parentId;
				if (parentElementId) {
					const parentElement = menuItemsList[parentElementId];
					if (parentElement) {
						if (!parentElement.subMenu) {
							parentElement.subMenu = [];
						}
						parentElement.subMenu.push(menuItem);
					}
				} else {
					menuData.push(menuItem);
				}
			}
			popupMenu.onClickHandlerMap = onClickHandlerMap;
			delete contextItem.controlId;

			return {
				dataList: menuItemsList,
				dataTree: menuData
			};
		});

		this.private.declare('_setPopupMenuItemsVisibility', function (
			popupMenu,
			menuItemsList
		) {
			for (let key in menuItemsList) {
				const menuItem = menuItemsList[key];
				if (menuItem.additionalData) {
					const isInvisible =
						menuItem.additionalData.hidden ||
						menuItem.additionalData['cui_invisible'];
					if (isInvisible) {
						if (menuItem.separator) {
							popupMenu.setHideSeparator(menuItem.id, isInvisible);
						} else {
							popupMenu.setHide(menuItem.id, isInvisible);
						}
					}
				}
			}
		});
	}

	CuiContextMenu.prototype.initPopupMenu = function (
		popupMenu,
		contextItem,
		contextParams
	) {
		///<summary>Have to be called right after creating ContextMenu in order to set handlers on the menu and etc.
		///Used for both contextMenu and popupMenu
		///For mainTree.html, ItemGrid, inBasketTaskGrid, relationshipsGrid</summary>
		var customClickHandler = function (commandId, rowId, col) {
			if (this.onClickHandlerMap && this.onClickHandlerMap[commandId]) {
				var clickHandler = this.onClickHandlerMap[commandId];
				var args = {
					commandId: commandId,
					rowId: rowId,
					col: col
				};
				const menuItem = this.getItemById(commandId);
				const additionalData = menuItem.additionalData;
				if (additionalData) {
					args.additionalData = additionalData;
				}
				if (contextItem) {
					args.contextItem = contextItem;
				}
				if (contextParams) {
					args.contextParams = contextParams;
				}
				clickHandler(args);
			}
		};
		var aspectItems = this.private.aspectItems.filter(function (item) {
			return item.menu === popupMenu;
		});
		var aspectItem = aspectItems.length && aspectItems[0];
		if (aspectItem) {
			aspectItem.aspect.remove();
			this.private.aspectItems = this.private.aspectItems.filter(function (
				item
			) {
				return item !== aspectItem;
			});
		}
		aspectItem = {
			aspect: aspect.after(popupMenu, 'onItemClick', customClickHandler, true),
			menu: popupMenu
		};
		this.private.aspectItems.push(aspectItem);
	};

	CuiContextMenu.prototype.fillContextMenu = function (
		locationName,
		contextMenu
	) {
		///<summary>For mainTree.html</summary>
		var contextItem = this.utils.getDefaultContextItem();
		if (!contextItem.itemType && contextMenu.rowId) {
			var itemTypeFromCache = aras.MetadataCache.GetItemType(
				contextMenu.rowId,
				'name'
			);
			var result = itemTypeFromCache.getResult();
			if (!itemTypeFromCache.isFault() && result.childNodes[0]) {
				contextItem.itemType = result.childNodes[0];
			}
		}

		var items = this.dataLoader.loadCommandBar(locationName, contextItem);
		contextMenu.removeAll();
		if (this.utils.noItems(items)) {
			return;
		}
		var menuData = [];
		var onClickHandlerMap = {};

		for (var i = 0; i < items.length; ++i) {
			var item = items[i];

			var initMethodName = this.utils.getOnInitHandlerName(item);
			var initData = null;
			if (initMethodName) {
				initData = this.utils.evalCommandBarItemMethod(
					initMethodName,
					contextItem
				);
				if (
					initData &&
					initData.hasOwnProperty('cui_visible') &&
					!initData['cui_visible']
				) {
					continue;
				}
			}

			var label = item.selectSingleNode('label');
			label = label ? label.text : '';
			var additionalData = this.utils.getCommandBarItemAdditionalData(
				item,
				initData
			);
			if (!label && additionalData && additionalData['cui_resource_key']) {
				label = aras.getResource(
					additionalData['cui_resource_solution'] || '',
					additionalData['cui_resource_key']
				);
			}

			var controlId = item.selectSingleNode('name');
			controlId = controlId ? controlId.text : '';
			var clickHandler = this.utils.getOnClickHandler(item);
			if (clickHandler) {
				onClickHandlerMap[controlId] = clickHandler;
			}

			menuData.push({ id: controlId, name: label || controlId });
		}
		contextMenu.addRange(menuData);
		contextMenu.onClickHandlerMap = onClickHandlerMap;
	};

	CuiContextMenu.prototype.fillPopupMenu = function (
		locationName,
		popupMenu,
		contextItemOverride,
		itemStates,
		dontClearMenu,
		contextParams
	) {
		///<summary></summary>
		///<param name='locationName'></param>
		///<param name='popupMenu'>Innovator\Client\Modules\components\contextMenu.js instance</param>
		///<param name='contextItemOverride'></param>
		///<param name='itemStates'>id:enabled map</param>
		///<param name='dontClearMenu'></param>
		///<param name='contextParams'></param>
		///<returns>Bool; true if menu should be shown</returns>
		const contextItem = Object.assign(
			this.utils.getDefaultContextItem(),
			contextItemOverride
		);
		const items = this.dataLoader.loadCommandBar(
			locationName,
			contextItem,
			contextParams
		);
		if (!dontClearMenu) {
			popupMenu.removeAll();
		}

		if (this.utils.noItems(items)) {
			return false;
		}

		const menuData = this.private._getDataForPopupMenu(
			popupMenu,
			items,
			itemStates,
			contextParams,
			contextItem
		);

		popupMenu.addRange(menuData.dataTree);

		this.private._setPopupMenuItemsVisibility(popupMenu, menuData.dataList);
		return true;
	};

	CuiContextMenu.prototype.onGridHeaderContextMenu = function (
		e,
		grid,
		isAtCell
	) {
		var getCountVisibleColunms = function (grid) {
			var result = 0;
			for (var i = 0; i < grid.getColumnCount(); i++) {
				if (grid.isColumnVisible(i)) {
					result++;
				}
			}
			return result;
		};

		if (e.rowIndex == '-1') {
			var headerMenu = grid['getHeaderMenu_Experimental']();
			if (isAtCell && !headerMenu.initialized) {
				// fill menu if it hasn't items and click was at the header cell
				this.fillPopupMenu('PopupMenuGridHeader', headerMenu);
				// disable 'hideCol' item if number visible columns = 1
				if (
					headerMenu.collectionMenu &&
					headerMenu.collectionMenu.hideCol &&
					getCountVisibleColunms(grid) === 1
				) {
					headerMenu.setDisable('hideCol', true);
				}
				if (e.view && e.view.isMainGrid) {
					headerMenu.setHide('insertCol', true);
				}
			} else if (!isAtCell && headerMenu.initialized) {
				// clear menu (don't show) if menu has items and click was not at the header cell
				headerMenu.removeAll();
			}
			headerMenu.initialized = isAtCell;
		}

		return true;
	};

	CuiContextMenu.prototype.callInitHandlersForPopupMenu = function (
		eventState,
		eventType
	) {
		var topWnd = aras.getMostTopWindowWithAras();
		if (topWnd && topWnd.main && topWnd.main.work && topWnd.main.work.grid) {
			var grid = topWnd.main.work.grid;
			var popupMenu = grid.getMenu();
			var contextParams = {
				eventState: eventState,
				eventType: eventType,
				isReinit: true
			};
			var doReinit = function (collectionName, isSeparator) {
				var menuItemsIds = Object.keys(popupMenu[collectionName]);
				for (var i = 0; i < menuItemsIds.length; i++) {
					var id = menuItemsIds[i];
					var menuItem = popupMenu[collectionName][id];

					var reinitData = this.private.popupMenuReinitDataById[id];
					if (reinitData && reinitData.cuiItem && reinitData.handler) {
						var additionalDataNode = reinitData.cuiItem.selectSingleNode(
							'additional_data'
						);
						var additionalData = additionalDataNode
							? additionalDataNode.text
							: '';

						contextParams.control = {
							item: menuItem,
							additionalData: additionalData
						};
						reinitData = this.utils.evalCommandBarItemMethod(
							reinitData.handler,
							contextParams
						);
						if (reinitData) {
							popupMenu[isSeparator ? 'setHideSeparator' : 'setHide'](
								id,
								reinitData['cui_invisible']
							);
							if (!isSeparator && reinitData['cui_disabled'] !== undefined) {
								popupMenu.setDisable(id, reinitData['cui_disabled']);
							}
						}
					}
				}
			}.bind(this);

			if (popupMenu) {
				if (popupMenu.collectionMenu) {
					doReinit('collectionMenu');
				}
				if (popupMenu.collectionSeparator) {
					doReinit('collectionSeparator', true);
				}
			}
		}
	};

	return CuiContextMenu;
})();
