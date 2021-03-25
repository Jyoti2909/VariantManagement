var CuiMenu = (function () {
	this.aspect;
	require(['dojo/aspect'], function (_aspect) {
		aspect = _aspect;
	});

	function CuiMenu() {
		this.menusDict = [];
		//'private' object must be created at ConfigurableUI module.
		//If CuiMenu module is used separately from ConfigurableUI module, 'private' object should be created in CuiMenu constructor
		if (!this.private) {
			var self = this;
			this.private = {
				declare: function (fieldName, func) {
					var boundFunc = func.bind(self);
					this[fieldName] = boundFunc;
				}
			};
		}

		this.private.declare('getExistMenuBarIdImplementation', function (
			locationName,
			contextParams,
			async
		) {
			var hash = this.menusDict[contextParams.menuId];
			if (hash) {
				return async
					? Promise.resolve(hash)
					: ArasModules.SyncPromise.resolve(hash);
			}

			return this.dataLoader
				.loadCommandBarImplementation(locationName, contextParams, async)
				.then(
					function (items) {
						// using context.xml for MSXML node list
						var xml = items.context
							? items.context.xml
							: items
									.map(function (elt) {
										return elt.xml;
									})
									.join();

						var hash = this.utils.getHashCode(xml);
						this.menusDict[contextParams.menuId] = hash;
						return hash;
					}.bind(this)
				);
		});

		// Dictionary of menu items. Id is used as key
		this.private.menuItemsById = {};

		this.private.declare('loadMenuImplementation', function (
			locationName,
			menuContext,
			async
		) {
			var contextParams = Object.assign(
				this.utils.getDefaultContextItem(),
				menuContext
			);

			return this.dataLoader
				.loadCommandBarImplementation(locationName, contextParams, async)
				.then(
					function (items) {
						var i = 0;

						// Create array of all CommandBarItems
						var itemsArray = [];
						for (i = 0; i < items.length; i++) {
							var currentItem = items[i];
							var name = aras.escapeXMLAttribute(
								currentItem.selectSingleNode('name').text
							);
							var idx = currentItem.getAttribute('id');
							var label = currentItem.selectSingleNode('label');
							label = label ? label.text : '';
							var image = currentItem.selectSingleNode('image');
							image = image ? image.text : '';
							var groupId = currentItem.selectSingleNode('group_id');
							groupId = groupId ? groupId.text : '';
							var parentMenu = currentItem.selectSingleNode('parent_menu');
							parentMenu = parentMenu ? parentMenu.text : '';
							var includeEvents = currentItem.selectSingleNode(
								'include_events'
							);
							includeEvents = includeEvents ? includeEvents.text : '';
							var additionalData = currentItem.selectSingleNode(
								'additional_data'
							);
							additionalData = additionalData ? additionalData.text : '';

							var menuItem = {
								name: name,
								label: label ? aras.escapeXMLAttribute(label) : name,
								id: idx,
								type: currentItem.getAttribute('type'),
								image: image,
								group: groupId,
								parentMenuId: parentMenu,
								additionalData: additionalData,
								includeEvents: includeEvents,
								onClick: aras.getItemPropertyAttribute(
									currentItem,
									'on_click_handler',
									'keyed_name'
								),
								onInit: aras.getItemPropertyAttribute(
									currentItem,
									'on_init_handler',
									'keyed_name'
								)
							};
							itemsArray.push(menuItem);
							this.private.menuItemsById[idx] = menuItem;
						}

						var menuItems = [];
						// Currently supported only one root menubar. Related issue IR-038695 "CUI: Can't add Menu without parent to Main Window Main Menu"
						// Create object for menu with submenus as childs.
						for (i = 0; i < itemsArray.length; i++) {
							if (!itemsArray[i].parentMenuId) {
								var rootItem = itemsArray[i];
								rootItem.childs = this._getChildMenus(rootItem.id, itemsArray);
								menuItems.push(itemsArray[i]);
							}
						}

						var showMenuId =
							this.menusDict[contextParams.menuId] || locationName;
						var xml =
							'<menuapplet show="' +
							showMenuId +
							'">' +
							'<menubar id="' +
							locationName +
							'" name="' +
							locationName +
							'">' +
							this._loadMenuFromCommandBars(menuItems, contextParams) +
							'</menubar>' +
							'</menuapplet>';

						return xml;
					}.bind(this)
				);
		});
	}

	CuiMenu.prototype.getExistMenuBarId = function (locationName, contextParams) {
		var hash;
		this.private
			.getExistMenuBarIdImplementation(locationName, contextParams, false)
			.then(function (res) {
				hash = res;
			});
		return hash;
	};

	CuiMenu.prototype.getExistMenuBarIdAsync = function (
		locationName,
		contextParams
	) {
		return this.private.getExistMenuBarIdImplementation(
			locationName,
			contextParams,
			true
		);
	};

	CuiMenu.prototype.loadMenuAppletFromCommandBars = function (
		locationName,
		menuContext
	) {
		var xml;
		this.private
			.loadMenuImplementation(locationName, menuContext, false)
			.then(function (res) {
				xml = res;
			});
		return xml;
	};

	CuiMenu.prototype.loadMenuFromCommandBarsAsync = function (
		locationName,
		menuContext
	) {
		return this.private.loadMenuImplementation(locationName, menuContext, true);
	};

	CuiMenu.prototype._getChildMenus = function (rootId, allItems) {
		var childs = [];
		for (var i = 0; i < allItems.length; i++) {
			var item = allItems[i];
			if (rootId === item.parentMenuId) {
				var childsOfCurrentItem = this._getChildMenus(item.id, allItems);
				if (childsOfCurrentItem.length > 0) {
					item.childs = childsOfCurrentItem;
				}
				childs.push(item);
			}
		}
		return childs;
	};

	CuiMenu.prototype._loadMenuFromCommandBars = function (items, contextParams) {
		var xml = '';
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var initData = null;
			if (item.onInit) {
				var initContextParams = { control: item };
				initContextParams = Object.assign(initContextParams, contextParams);
				initData = this.utils.evalCommandBarItemMethod(
					item.onInit,
					initContextParams
				);
			}

			var additionalData = this.utils._getCommandBarItemAdditionalData(
				item.additionalData,
				initData
			);

			var attributesMapping = {
				icon: item.image,
				idx: item.id,
				id: item.name,
				name: item.label
			};
			if (additionalData) {
				attributesMapping.disabled = additionalData['cui_disabled'];
				attributesMapping.invisible = additionalData['cui_invisible'];
				attributesMapping.checked = additionalData['cui_checked'];
				attributesMapping.style = additionalData['cui_style'];
				attributesMapping.class = additionalData['cui_class'];
			}

			var attributes = this.utils._mapExtraControlPropsToXml(attributesMapping);
			switch (item.type) {
				case 'CommandBarMenu':
					var res = !item.childs
						? ''
						: this._loadMenuFromCommandBars(item.childs, contextParams);
					xml += this.utils.format('<menu {0}>', attributes) + res + '</menu>';
					break;
				case 'CommandBarMenuButton':
					xml += this.utils.format('<item {0} />', attributes);
					break;
				case 'CommandBarMenuCheckbox':
					xml += this.utils.format(
						'<{0} {1} group="{2}" />',
						item.group ? 'radioitem' : 'checkitem',
						attributes,
						item.group
					);
					break;
				case 'CommandBarSeparator':
				case 'CommandBarMenuSeparator':
					xml += this.utils.format('<separator {0}/>', attributes);
					break;
			}
		}
		return xml;
	};

	CuiMenu.prototype.callInitHandlersForMenu = function (eventState, eventType) {
		var menuPromise;
		var topWindow = aras.getMostTopWindowWithAras(window);
		var contextParams = {
			eventState: eventState,
			eventType: eventType,
			isReinit: true
		};
		if (topWindow.isTearOff) {
			contextParams.itemId = topWindow.itemID;
			if (topWindow.itemType) {
				contextParams.itemTypeId = topWindow.itemType.getAttribute('id');
			}

			menuPromise = topWindow.tearOffMenuController
				? topWindow.tearOffMenuController.when('MainMenuInitialized')
				: Promise.resolve();
		} else if (
			topWindow.work &&
			topWindow.work.menu &&
			topWindow.work.menu.menuApplet
		) {
			var workFrame = topWindow.work;
			contextParams.itemTypeId = workFrame.itemTypeID;
			if (workFrame.grid) {
				contextParams.itemId = workFrame.grid['getSelectedId_Experimental']();
			}

			menuPromise = Promise.resolve(topWindow.work.menu.menuApplet);
		}

		if (menuPromise) {
			menuPromise.then(
				function (menu) {
					var activeMenuBar = menu.getMenuBarById(menu.activeMenuBarId);
					var handleNestedMenu = function (parentMenuWidget) {
						for (var i = 0; i < parentMenuWidget.getItemsCount(); i++) {
							var widget = parentMenuWidget.getItemAt(i);
							runOnInitHandler(widget);
						}
					}.bind(this);

					var runOnInitHandler = function (widget) {
						var itemId = widget.item.get('idx');
						var item = this.private.menuItemsById[itemId];
						// item could be undefined because not all controls are created through CUI (for example separator at Actions menu).

						if (
							item &&
							item.includeEvents &&
							item.includeEvents.indexOf(eventType) !== -1 &&
							item.onInit
						) {
							var initContextParams = { control: item };
							initContextParams = Object.assign(
								initContextParams,
								contextParams
							);
							var reinitData = this.utils.evalCommandBarItemMethod(
								item.onInit,
								initContextParams
							);
							if (reinitData) {
								if (reinitData['cui_class']) {
									widget.item.domNode.classList.add(reinitData['cui_class']);
									delete reinitData['cui_class'];
								}
								var domNodeForRestyle = widget.item.domNode;
								domNodeForRestyle.style.display = reinitData['cui_invisible']
									? 'none'
									: '';
								delete reinitData['cui_invisible'];

								if (reinitData['cui_style']) {
									var cuiStyle = reinitData['cui_style'].split(';');

									for (var j = 0; j < cuiStyle.length; j++) {
										var trimmedStyle = cuiStyle[j].trim();
										if (trimmedStyle) {
											var keyValue = trimmedStyle.split(':');
											domNodeForRestyle.style[
												keyValue[0].trim()
											] = keyValue[1].trim();
										}
									}

									delete reinitData['cui_style'];
								}

								if (reinitData['cui_disabled'] !== undefined) {
									widget.item.set('disabled', reinitData['cui_disabled']);
									delete reinitData['cui_disabled'];
								}

								if (reinitData['cui_checked'] !== undefined) {
									widget.setState(reinitData['cui_checked']);
									delete reinitData['cui_checked'];
								}

								var keys = Object.keys(reinitData);
								for (var i = 0; i < keys.length; i++) {
									var key = keys[i];
									widget.item.set(key, reinitData[key]);
								}
							}
						}

						handleNestedMenu(widget);
					}.bind(this);

					for (var i = 0; i < activeMenuBar.length; i++) {
						var parentMenuNode = activeMenuBar[i];
						var parentMenuId = parentMenuNode.id;
						var parentMenuWidget = menu.findMenu(parentMenuId);

						runOnInitHandler(parentMenuWidget);
					}
				}.bind(this)
			);
		}
	};

	CuiMenu.prototype.resetMenuCache = function () {
		this.menusDict = [];
		aras.MetadataCache.DeleteConfigurableUiDatesFromCache();
	};

	CuiMenu.prototype.initMenuEvents = function (menu, params) {
		var self = this;
		var runHandler = function (menuItem, type) {
			var itemId = menuItem.item.idx || menuItem.item.get('idx');
			var item = self.private.menuItemsById[itemId];
			if (item && item.onClick) {
				aras.evalMethod(item.onClick, '', menuItem);
			} else if (params && params[type]) {
				params[type](menuItem);
			}
		};

		clientControlsFactory.on(menu, {
			onSelect: function (menuItem) {
				runHandler(menuItem, 'onSelect');
			},
			onCheck: function (menuItem) {
				runHandler(menuItem, 'onCheck');
			}
		});

		aspect.around(menu, 'findItem', function (compatibilityFindItemAspect) {
			return function (id) {
				var menuItem = compatibilityFindItemAspect(id);
				if (!menuItem && params) {
					menuItem = compatibilityFindItemAspect(params.prefix + id);
				}

				return menuItem;
			};
		});
	};

	return CuiMenu;
})();
