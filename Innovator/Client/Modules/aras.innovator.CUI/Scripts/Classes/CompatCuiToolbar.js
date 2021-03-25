var CompatCuiToolbar = (function () {
	function CompatCuiToolbar() {
		this.toolbarsDict = [];
		//'private' object must be created at ConfigurableUI module.
		//If CompatCuiToolbar module is used separately from ConfigurableUI module, 'private' object should be created in CompatCuiToolbar constructor
		if (!this.private) {
			var self = this;
			this.private = {
				declare: function (fieldName, func) {
					var boundFunc = func.bind(self);
					this[fieldName] = boundFunc;
				}
			};
		}

		this.private.declare('loadToolbarImplementation', function (
			contextItem,
			initData,
			async
		) {
			/// <returns>XML for toolbar</returns>
			contextItem = Object.assign(
				this.utils.getDefaultContextItem(),
				contextItem
			);
			var promise;
			if (!contextItem.items) {
				if (!contextItem['item_classification']) {
					contextItem['item_classification'] =
						aras.getItemProperty(contextItem.item, 'classification') ||
						'%all_grouped_by_classification%';
				}

				promise = this.dataLoader
					.loadCommandBarImplementation(
						contextItem.locationName,
						contextItem,
						async
					)
					.then(function (items) {
						contextItem.items = items;
						return contextItem;
					});
			} else {
				promise = async
					? Promise.resolve(contextItem)
					: ArasModules.SyncPromise.resolve(contextItem);
			}

			return promise.then(
				function (contextItem) {
					var xml = this._loadToolbarFromCommandBars(
						contextItem,
						initData || {}
					);

					if (contextItem.mainSubPrefix) {
						xml = xml.replace(contextItem.mainSubPrefix, '');
					}

					if (contextItem.subPrefix) {
						xml = xml.replace(contextItem.subPrefix, '');
					}

					contextItem.toolbarApplet.loadToolbarFromStr(xml);
				}.bind(this)
			);
		});

		this.private.declare('getExistToolbarIdImplementation', function (
			locationName,
			contextParams,
			async
		) {
			var hash = this.toolbarsDict[contextParams.toolbarId];
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
						this.toolbarsDict[contextParams.toolbarId] = hash;
						return hash;
					}.bind(this)
				);
		});

		this.private.declare('runOnInitHandler', function (
			onInitHandler,
			tbItem,
			inArgs
		) {
			try {
				return onInitHandler(tbItem, inArgs);
			} catch (ex) {
				aras.AlertError(
					aras.getResource('', 'item_methods.event_handler_failed'),
					aras.getResource(
						'../Modules/aras.innovator.cui/',
						'cui_on_init_handler_error',
						ex.description
					),
					aras.getResource('', 'common.client_side_err')
				);
			}
		});
	}

	CompatCuiToolbar.prototype.createConfigurableToolbar = function (
		toolbarId,
		connectId,
		locationName,
		contextParams,
		contextItemOverride
	) {
		///<summary>Top-level func</summary>
		///<returns>Bool; true if non-empty toolbar was created</returns>

		var i = 0;
		var contextItem = contextItemOverride || this.utils.getDefaultContextItem();

		var items = this.dataLoader.loadCommandBar(locationName, contextItem);
		if (this.utils.noItems(items)) {
			return Promise.resolve(false);
		}

		var toolbarApplet;
		var self = this;

		var args = { id: toolbarId };
		if (typeof connectId === 'string') {
			args.connectId = connectId;
		} else {
			args.connectNode = connectId;
		}

		return clientControlsFactory
			.createControl('Aras.Client.Controls.Public.ToolBar', args, function (
				toolbar
			) {
				toolbarApplet = toolbar;

				var initData = [];
				self.initToolbarEvents(toolbarApplet, contextItem, contextParams);
				contextItem.toolbarApplet = toolbarApplet;
				contextItem.toolbarId = toolbarId;
				contextItem.items = items;
				contextItem.contextParams = contextParams;
				self.loadToolbarFromCommandBars(contextItem, initData);
				toolbarApplet.show();

				for (i = 0; i < items.length; ++i) {
					// after toolbar.show()
					var currentItem = items[i];
					var controlId = currentItem.selectSingleNode('name');
					controlId = controlId ? controlId.text : null;
					var widget = toolbarApplet.GetItem(controlId);
					if (widget) {
						self.utils.applyAdditionalData(widget, initData[controlId], true);
					}
				}

				self.dispatchCommandBarLoadedEvent(locationName, toolbarApplet);

				return toolbar;
			})
			.catch(function (e) {
				aras.AlertError('createConfigurableToolbar: ' + e);
			});
	};

	CompatCuiToolbar.prototype.dispatchCommandBarLoadedEvent = function (
		locationName,
		commandBar
	) {
		const event = document.createEvent('Event');
		event.locationName = locationName;
		event.changeType = 'loaded';
		event.commandBar = commandBar;
		event.initEvent('commandBarChanged', true, false);
		document.dispatchEvent(event);
	};

	CompatCuiToolbar.prototype._getOnKeyDownHandler = function (item) {
		var methodId = this.utils.getHandlerName(item, null, 'on_keydown_handler');
		var evalOnKeyDownHandler = function evalOnKeyDownHandler(methodParams) {
			this.utils.evalCommandBarItemMethod(methodId, methodParams);
		}.bind(this);

		return methodId ? evalOnKeyDownHandler : null;
	};

	CompatCuiToolbar.prototype._getToolbarsSplitByItemClassification = function (
		allItems,
		classification
	) {
		var toolbars = [];
		var initHandlers = this.utils.prepareInitHandlers(allItems);

		for (var i = 0; i < allItems.length; i++) {
			var currentItem = allItems[i];
			var itemClassification = currentItem.selectSingleNode(
				'item_classification'
			).text;
			var type = currentItem.getAttribute('type');
			if (classification && itemClassification === classification) {
				itemClassification = '';
			}
			var name = currentItem.selectSingleNode('name').text;
			if (itemClassification) {
				name = name.replace(itemClassification + '_', '');
			} else {
				itemClassification = '$EmptyClassification';
			}

			var label = currentItem.selectSingleNode('label');
			label = label ? label.text : '';
			var tooltip = currentItem.selectSingleNode('tooltip_template');
			tooltip = tooltip ? tooltip.text : null;
			var initData = currentItem.selectSingleNode('additional_data');
			initData = initData ? initData.text : '';
			var image = currentItem.selectSingleNode('image');
			image = image ? image.text : '';
			var includeEvents = currentItem.selectSingleNode('include_events');
			includeEvents = includeEvents ? includeEvents.text : '';

			if (
				!label &&
				type !== 'CommandBarEdit' &&
				type !== 'CommandBarDropDown'
			) {
				label = name;
			}
			var idx = currentItem.getAttribute('id'); //CommandBarButton id
			var toolbarItem = {
				idx: idx,
				type: type,
				name: name,
				label: aras.escapeXMLAttribute(label),
				tooltip: tooltip,
				onClickHandler: this.utils.getOnClickHandler(currentItem),
				onInitHandler: initHandlers[idx],
				includeEvents: includeEvents,
				onKeyDownHandler: this._getOnKeyDownHandler(currentItem),
				initData: initData,
				image: image
			};

			if (!toolbars[itemClassification]) {
				toolbars[itemClassification] = [];
			}

			toolbars[itemClassification].push(toolbarItem);
		}
		return toolbars;
	};

	CompatCuiToolbar.prototype.loadToolbarFromCommandBars = function (
		contextItem,
		initData
	) {
		this.private.loadToolbarImplementation(contextItem, initData, false);
	};

	CompatCuiToolbar.prototype.loadToolbarFromCommandBarsAsync = function (
		contextParams,
		initData
	) {
		return this.private.loadToolbarImplementation(
			contextParams,
			initData,
			true
		);
	};

	CompatCuiToolbar.prototype._loadToolbarFromCommandBars = function (
		contextItem,
		outInitData
	) {
		/// <returns>XML for toolbar</returns>
		if (this.utils.noItems(contextItem.items)) {
			return null;
		}

		if (!contextItem.toolbarApplet.handlersMap) {
			contextItem.toolbarApplet.handlersMap = [];
		}

		if (!contextItem.toolbarApplet.initHandlersMap) {
			contextItem.toolbarApplet.initHandlersMap = [];
		}

		var defaultOnClickHandler = contextItem.defaultOnClick
			? function (inArgs) {
					return contextItem.defaultOnClick(inArgs.control);
			  }
			: null;

		var itemClassification = '';
		if (
			contextItem['item_classification'] &&
			contextItem['item_classification'] !== '%all_grouped_by_location%' &&
			contextItem['item_classification'] !== '%all_grouped_by_classification%'
		) {
			itemClassification = contextItem['item_classification'];
		}

		var toolbars = this._getToolbarsSplitByItemClassification(
			contextItem.items,
			itemClassification
		);
		var toolbarsClassifications = Object.keys(toolbars);

		var xml = '<toolbarapplet buttonstyle="windows" buttonsize="26,25">';
		for (var i = 0; i < toolbarsClassifications.length; i++) {
			var classification = toolbarsClassifications[i];
			var toolbarItems = toolbars[classification];
			var toolbarId =
				classification === '$EmptyClassification' && contextItem.toolbarId
					? contextItem.toolbarId
					: classification;
			xml += this.utils.format('<toolbar id="{0}">', toolbarId);

			for (var j = 0; j < toolbarItems.length; j++) {
				var currentItem = toolbarItems[j];
				var initHandlerResult = undefined;
				if (currentItem.onInitHandler) {
					var itemTypeId = contextItem.itemType
						? contextItem.itemType.getAttribute('id')
						: null;
					var inArgs = {
						itemType: contextItem.itemType,
						itemTypeId: itemTypeId,
						itemId: contextItem.itemID,
						item: contextItem.item,
						controlId: name,
						isReinit: false,
						contextParams: contextItem.contextParams,
						currentItem: currentItem
					};
					initHandlerResult = this.private.runOnInitHandler(
						currentItem.onInitHandler,
						null,
						inArgs
					);
				}

				if (
					initHandlerResult &&
					initHandlerResult.hasOwnProperty('cui_visible') &&
					!initHandlerResult['cui_visible']
				) {
					continue;
				}
				outInitData[
					currentItem.name
				] = this.utils._getCommandBarItemAdditionalData(
					currentItem.initData,
					initHandlerResult
				);
				var tooltip = currentItem.tooltip
					? this._getTooltipFromTooltipTemplate(currentItem.tooltip)
					: '';

				var attributesMapping = {
					image: currentItem.image,
					id: currentItem.name,
					tooltip: tooltip,
					idx: currentItem.idx
				};
				if (outInitData[currentItem.name]) {
					attributesMapping.disabled =
						outInitData[currentItem.name]['cui_disabled'];
					attributesMapping.invisible =
						outInitData[currentItem.name]['cui_invisible'];
					attributesMapping.style = outInitData[currentItem.name]['cui_style'];
					attributesMapping.class = outInitData[currentItem.name]['cui_class'];
					attributesMapping.placeholder =
						outInitData[currentItem.name]['cui_placeholder'];
					attributesMapping.type = outInitData[currentItem.name]['cui_type'];
					attributesMapping.right = outInitData[currentItem.name].right;
					attributesMapping.state = outInitData[currentItem.name].state;
					attributesMapping['label_position'] =
						outInitData[currentItem.name]['label_position'];
				}

				var initContext;
				var attributesAsString;
				switch (currentItem.type) {
					case 'CommandBarButton':
						attributesAsString = this.utils._mapExtraControlPropsToXml(
							attributesMapping
						);
						xml += this.utils.format(
							'<button {0}>{1}</button>',
							attributesAsString,
							currentItem.label
						);

						contextItem.toolbarApplet.handlersMap[currentItem.idx] =
							currentItem.onClickHandler || defaultOnClickHandler;
						initContext = {
							events: currentItem.includeEvents,
							handler: currentItem.onInitHandler
						};
						contextItem.toolbarApplet.initHandlersMap[
							currentItem.idx
						] = initContext;
						break;
					case 'CommandBarDropDown':
						attributesMapping.label = currentItem.label;
						attributesAsString = this.utils._mapExtraControlPropsToXml(
							attributesMapping
						);
						xml += this.utils.format('<choice {0} >', attributesAsString);

						var dropDownItems = outInitData[currentItem.name];
						if (
							outInitData[currentItem.name] &&
							outInitData[currentItem.name]['cui_items']
						) {
							dropDownItems = outInitData[currentItem.name]['cui_items'];
						}

						if (dropDownItems && dropDownItems.length) {
							for (var k = 0; k < dropDownItems.length; ++k) {
								dropDownItems[k].tooltip = tooltip;
								xml += this.utils.format(
									'<choiceitem {0}>{1}</choiceitem>',
									this.utils._mapExtraControlPropsToXml(dropDownItems[k]),
									dropDownItems[k].label || dropDownItems[k].name
								);
							}
						}
						xml += '</choice>';
						initContext = {
							events: currentItem.includeEvents,
							handler: currentItem.onInitHandler
						};
						contextItem.toolbarApplet.initHandlersMap[
							currentItem.idx
						] = initContext;
						break;
					case 'CommandBarSeparator':
						xml += '<separator/>';
						break;
					case 'CommandBarEdit':
						attributesMapping.label = currentItem.label;
						attributesAsString = this.utils._mapExtraControlPropsToXml(
							attributesMapping
						);
						xml += this.utils.format('<edit {0} />', attributesAsString);
						if (currentItem.onKeyDownHandler) {
							contextItem.toolbarApplet.handlersMap[currentItem.idx] =
								currentItem.onKeyDownHandler;
						}
						initContext = {
							events: currentItem.includeEvents,
							handler: currentItem.onInitHandler
						};
						contextItem.toolbarApplet.initHandlersMap[
							currentItem.idx
						] = initContext;
						break;
				}
			}
			xml += '</toolbar>';
		}
		xml += '</toolbarapplet>';

		return toolbarsClassifications.length > 0 ? xml : null;
	};

	CompatCuiToolbar.prototype.initToolbarEvents = function (
		toolbarApplet,
		contextItem,
		contextParams
	) {
		clientControlsFactory.on(toolbarApplet, {
			onClick: function (button) {
				var idx = button['_item_Experimental'].idx;
				if (idx && this.handlersMap[idx]) {
					this.handlersMap[idx]({
						control: button,
						contextItem: contextItem,
						contextParams: contextParams
					});
				}
			},
			onKeyDown: function (textBox, evt) {
				if (textBox['_item_Experimental'].type === 'button') {
					return;
				}
				var idx = textBox['_item_Experimental'].idx;
				if (idx && this.handlersMap[idx]) {
					this.handlersMap[idx]({
						control: textBox,
						event: evt,
						contextItem: contextItem,
						contextParams: contextParams
					});
				}
			}
		});
	};

	CompatCuiToolbar.prototype.getExistToolbarId = function (
		locationName,
		contextParams
	) {
		var hash;
		this.private
			.getExistToolbarIdImplementation(locationName, contextParams, false)
			.then(function (res) {
				hash = res;
			});
		return hash;
	};

	CompatCuiToolbar.prototype.getExistToolbarIdAsync = function (
		locationName,
		contextParams
	) {
		return this.private.getExistToolbarIdImplementation(
			locationName,
			contextParams,
			true
		);
	};

	CompatCuiToolbar.prototype.callInitHandlersForToolbar = function (
		eventState,
		eventType
	) {
		var topWindow = aras.getMostTopWindowWithAras(window);
		var toolbarPromise;
		//Main Window toolbar
		const itemsGridToolbar = window.toolbar;

		if (
			itemsGridToolbar &&
			itemsGridToolbar.getToolbarInstance &&
			itemsGridToolbar.getToolbarInstance()
		) {
			toolbarPromise = Promise.resolve(itemsGridToolbar);
		} else if (topWindow.tearOffMenuController) {
			toolbarPromise = topWindow.tearOffMenuController.when(
				'ToolbarInitialized'
			);
		}

		if (toolbarPromise) {
			toolbarPromise.then(
				function (toolbar) {
					if (toolbar) {
						this.updateToolbarItems(toolbar, eventState, eventType);
					}
				}.bind(this)
			);
		}
	};

	CompatCuiToolbar.prototype.updateToolbarItems = function (
		toolbar,
		eventState,
		eventType,
		skipCheckEvents,
		contextParams
	) {
		let buttons = toolbar.getButtons('$');
		buttons = buttons.split('$');
		const inArgs = {
			eventState: eventState,
			eventType: eventType,
			isReinit: true,
			contextParams: contextParams
		};
		for (let i = 0; i < buttons.length; i++) {
			const tbItem = toolbar.getItem(buttons[i]);
			if (tbItem) {
				let widget = tbItem['_item_Experimental'];
				const idx = widget.idx;
				if (
					idx &&
					toolbar.initHandlersMap[idx] &&
					toolbar.initHandlersMap[idx].handler
				) {
					const initContext = toolbar.initHandlersMap[idx];
					const events = initContext.events
						? initContext.events.split(',')
						: null;
					if (skipCheckEvents || (events && events.indexOf(eventType) !== -1)) {
						const reinitData = this.private.runOnInitHandler(
							initContext.handler,
							tbItem,
							inArgs
						);
						if (!reinitData) {
							continue;
						}
						if (tbItem._widget) {
							widget = tbItem._widget;
						}

						if (reinitData['cui_disabled'] !== undefined) {
							tbItem.setEnabled(!reinitData['cui_disabled']);
						}
						delete reinitData['cui_disabled'];

						if (reinitData['cui_class']) {
							widget.domNode.classList.add(reinitData['cui_class']);
							delete reinitData['cui_class'];
						}

						if (reinitData['cui_style']) {
							widget.set(
								'style',
								widget.get('style') + '; ' + reinitData['cui_style']
							);
							delete reinitData['cui_style'];
						}

						if (reinitData['cui_placeholder']) {
							widget.setPlaceholder(reinitData['cui_placeholder']);
							delete reinitData['cui_placeholder'];
						}

						const keys = Object.keys(reinitData);
						for (let j = 0; j < keys.length; j++) {
							const key = keys[i];
							widget.set(key, reinitData[key]);
						}
					}
				}
			}
		}
	};

	return CompatCuiToolbar;
})();
