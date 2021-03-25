function initializeWorkflowToolFunctions(container) {
	const baseSetEditMode = window.setEditMode;
	const baseSetViewMode = window.setViewMode;

	container.getFrameWindow = function (frameId) {
		return document.getElementById(frameId).contentWindow;
	};

	container.setAnyMode = function (vORe) {
		container.updateWorkflowItem();
		container.getFrameWindow('tabs')['set' + vORe + 'Mode']();
		container.getFrameWindow('editor').populateWorkflow();
	};

	container.setEditMode = function (...args) {
		baseSetEditMode(args);

		container.setAnyMode('Edit');
	};

	container.setViewMode = function (newID, ...args) {
		baseSetViewMode(newID, args);

		container.setAnyMode('View');
	};

	container.initFormsCache = function (defaultContainerId) {
		formsCache = {};
		formsCache.defaultMode = 'view';
		formsCache.defaultContainerId = defaultContainerId;
		formsCache.cache = {};
	};

	container.getItemForm = function (itemTypeName, formMode) {
		if (formsCache) {
			if (formsCache.cache.hasOwnProperty(itemTypeName)) {
				return formsCache.cache[itemTypeName][formMode];
			}
		}

		return undefined;
	};

	container.hideAllItemForms = function (formContainer) {
		var itemFormCache;
		var form;

		for (var itemTypeName in formsCache.cache) {
			itemFormCache = formsCache.cache[itemTypeName];

			for (var modeName in itemFormCache) {
				form = itemFormCache[modeName];
				if (form && form.containerElement === formContainer) {
					form.style.display = 'none';
				}
			}
		}
	};

	// returns first visible form in container
	container.getVisibleItemForm = function (containerElement) {
		var itemFormCache;
		var form;

		containerElement =
			containerElement ||
			document.getElementById(formsCache.defaultContainerId);
		for (var itemTypeName in formsCache.cache) {
			itemFormCache = formsCache.cache[itemTypeName];

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
	container.addFormToCache = function (itemTypeName, formMode, form) {
		if (itemTypeName && formMode) {
			if (!formsCache.cache.hasOwnProperty(itemTypeName)) {
				formsCache.cache[itemTypeName] = {};
			}

			formsCache.cache[itemTypeName][formMode] = form;
		}
	};

	// descriptionNode: xmlElement with item description, containerElement: domElement which form will be attached to
	container.showItemForm = function (
		itemTypeName,
		formMode,
		descriptionNode,
		containerElement,
		userChangeHandler
	) {
		if (formsCache) {
			var cachedForm = null;
			itemTypeName = itemTypeName || '';
			formMode = formMode || formsCache.defaultMode;
			containerElement =
				containerElement ||
				document.getElementById(formsCache.defaultContainerId);

			if (itemTypeName) {
				cachedForm = container.getItemForm(itemTypeName, formMode);

				if (!cachedForm) {
					var formId = itemTypeName + '_' + formMode;

					cachedForm = document.createElement('iframe');
					cachedForm.setAttribute('id', formId);
					cachedForm.setAttribute('frameBorder', '0');
					cachedForm.setAttribute('width', '100%');
					cachedForm.setAttribute('height', '100%');
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
						aras.uiPopulateFormWithItemEx(
							cachedForm.contentDocument,
							descriptionNode,
							'',
							formMode == 'edit'
						);
					} else {
						aras.uiShowItemInFrameEx(
							cachedForm.contentWindow,
							descriptionNode,
							formMode
						);
						cachedForm.onload = function () {
							ITEM_WINDOW.registerStandardShortcuts(this.contentWindow);
							if (returnBlockerHelper) {
								returnBlockerHelper.attachBlocker(this.contentWindow);
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

	container.setupToolOnLoad = function () {
		const frameWindow = container.getFrameWindow('editor');

		frameWindow.frameElement.addEventListener('load', function () {
			aras.browserHelper.toggleSpinner(document, false);
		});

		frameWindow.location.replace(urlToResources.workflowEditor);

		//register standart chortcuts
		ITEM_WINDOW.registerStandardShortcuts(window, true);
	};

	/* remove from cache old workflow, get new from server, put to cache,store in currWFNode */
	container.updateWorkflowItem = function () {
		//---------------------------------------------------------------------
		//Added during "Consolidate Delegated check box" bug fixing
		//In "ActivityTemplate_Request" below the "select" attribute had not contained field "consolidate_ondelegate", so I append it.
		//But name of this field may be changed by Innovator's administrator in 'Forms' table.
		//May be, should delete the "select" atrribute completely? I did it and save the
		//"select" atrribute in comments.
		//select='timeout_duration,priority,reminder_interval,expected_duration,reminder_count,escalate_to,can_delegate,
		//keyed_name,x,y,is_end,message,wait_for_all_votes,wait_for_all_inputs,icon,is_start,is_auto,can_refuse,name,subflow,consolidate_ondelegate'
		//---------------------------------------------------------------------
		var workflowRqBody =
			'' +
			'<id>' +
			itemID +
			'</id>' +
			'<Relationships>' +
			'<Item type="Workflow Map Activity" action="get" isCriteria="0" select="related_id">' +
			'<related_id>' +
			'<Item type="Activity Template" action="get">' +
			'<Relationships>' +
			'<Item type="Workflow Map Path" action="get" isCriteria="0" select="is_override,' +
			'authentication, x, y, name, label, segments, related_id, source_id, is_default" />' +
			'</Relationships>' +
			'</Item>' +
			'</related_id>' +
			'</Item>' +
			'</Relationships>';
		var workflowItem = aras.getItem(
			'Workflow Map',
			"@id='" + itemID + "'",
			workflowRqBody,
			0,
			'',
			'description,node_label1_color,node_label2_font,node_bg_color,transition_line_color,node_name_color,node_label1_font,' +
				'transition_name_color,node_name_font,node_label2_color,node_size,state,name,not_lockable,locked_by_id,keyed_name,process_owner,label'
		);
		if (!workflowItem) {
			return;
		}

		item = workflowItem;
		aras.itemsCache.updateItem(item);
	};

	container.initializeTabbars = function (typesArray) {
		for (var i = 0; i < typesArray.length; i++) {
			var tmpTabbar = [];
			var tabsRoot = aras.uiGenerateRelationshipsTabbar(
				typesArray[i],
				aras.getItemTypeId(typesArray[i])
			);
			var tabNds = tabsRoot.selectNodes('/tabbar/tab');
			for (var j = 0; j < tabNds.length; j++) {
				var tab = tabNds[j];
				tmpTabbar[j] = {
					type_name: tab.getAttribute('type_name'),
					label: tab.getAttribute('label'),
					id: tab.getAttribute('id')
				};
			}

			tabbars[typesArray[i]] = tmpTabbar;
		}
	};
}
