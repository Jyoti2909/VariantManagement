/////////////////// WORK WITH FORM VIEW  /////////////////////////
/////////////////// copy from workflowtool.js ////////////////////
(function (cmfObject) {
	var itemForm = {
		formsCache: null
	};

	itemForm.initFormsCache = function (defaultContainerId) {
		this.formsCache = {};
		this.formsCache.defaultMode = 'view';
		this.formsCache.defaultContainerId = defaultContainerId;
		this.formsCache.cache = {};
	};

	itemForm.getItemForm = function (itemTypeName, formMode, classification) {
		if (this.formsCache) {
			if (this.formsCache.cache.hasOwnProperty(itemTypeName)) {
				if (this.formsCache.cache[itemTypeName].hasOwnProperty(formMode)) {
					if (classification) {
						return this.formsCache.cache[itemTypeName][formMode][
							classification
						];
					} else {
						return this.formsCache.cache[itemTypeName][formMode]['default'];
					}
				}
			}
		}

		return undefined;
	};

	itemForm.addFormToCache = function (
		itemTypeName,
		formMode,
		form,
		classification
	) {
		if (itemTypeName && formMode) {
			if (!this.formsCache.cache.hasOwnProperty(itemTypeName)) {
				this.formsCache.cache[itemTypeName] = {};
			}

			if (!this.formsCache.cache[itemTypeName].hasOwnProperty(formMode)) {
				this.formsCache.cache[itemTypeName][formMode] = {};
			}

			if (classification) {
				this.formsCache.cache[itemTypeName][formMode][classification] = form;
			} else {
				this.formsCache.cache[itemTypeName][formMode]['default'] = form;
			}
		}
	};

	itemForm.hideAllItemForms = function (formContainer) {
		var itemFormCache;
		var form;

		for (var itemTypeName in this.formsCache.cache) {
			itemFormCache = this.formsCache.cache[itemTypeName];
			for (var modeName in itemFormCache) {
				form = itemFormCache[modeName];
				for (var classification in form) {
					var classificationForm = form[classification];
					if (
						classificationForm &&
						classificationForm.containerElement === formContainer
					) {
						classificationForm.style.display = 'none';
					}
				}
			}
		}
	};

	itemForm.getCachedFormWithClassification = function (
		itemTypeName,
		formMode,
		descriptionNode
	) {
		if (this.formsCache) {
			itemTypeName = itemTypeName || '';
			formMode = formMode || this.formsCache.defaultMode;

			if (itemTypeName) {
				var classification;
				var classificationNode = descriptionNode.getElementsByTagName(
					'classification'
				);
				if (classificationNode && classificationNode.length > 0) {
					classification = classificationNode[0].text;
					if (classification) {
						classification = classification.replace(' ', '_');
					}
				}
				return {
					form: this.getItemForm(itemTypeName, formMode, classification),
					classification: classification
				};
			}
		}
		return null;
	};

	itemForm.showItemForm = function (
		itemTypeName,
		formMode,
		descriptionNode,
		propertyChangeHandler,
		containerElement,
		userChangeHandler
	) {
		if (this.formsCache) {
			var cachedForm = null;
			containerElement =
				containerElement ||
				document.getElementById(this.formsCache.defaultContainerId);
			if (itemTypeName) {
				var cachedObject = this.getCachedFormWithClassification(
					itemTypeName,
					formMode,
					descriptionNode
				);
				var classification = null;
				if (cachedObject) {
					classification = cachedObject.classification;
					cachedForm = cachedObject.form;
				}
				if (!cachedForm) {
					cachedForm = this.createForm(
						itemTypeName,
						formMode,
						classification,
						containerElement
					);
					this.addFormToCache(
						itemTypeName,
						formMode,
						cachedForm,
						classification
					);
				}
				// if user send description then fill form with item properties
				if (descriptionNode) {
					propsFReady = false;
					var topWindow = aras.getMostTopWindowWithAras();
					if (cachedForm.formContentLoaded) {
						this.populateFormWithItemEx(
							topWindow,
							cachedForm,
							descriptionNode,
							formMode
						);
						propsFReady = true;
					} else {
						topWindow.aras.uiShowItemInFrameEx(
							cachedForm.contentWindow,
							descriptionNode,
							formMode
						);
						cachedForm.onload = this.onFormLoadHandler.bind(
							this,
							topWindow,
							cachedForm,
							userChangeHandler,
							propertyChangeHandler
						);
					}
				}
			}
			this.hideAllItemForms(containerElement);
			if (cachedForm) {
				cachedForm.style.display = '';
			}

			return cachedForm;
		} else {
			return null;
		}
	};

	itemForm.createForm = function (
		itemTypeName,
		formMode,
		classification,
		containerElement
	) {
		var formId =
			itemTypeName +
			'_' +
			formMode +
			(classification ? '_' + classification : '');

		var form = document.createElement('iframe');
		form.setAttribute('id', formId);
		form.setAttribute('frameBorder', '0');
		form.setAttribute('width', '100%');
		form.setAttribute('height', '100%');

		form.formContentLoaded = false;
		form.itemTypeName = itemTypeName;
		containerElement.appendChild(form);
		form.containerElement = containerElement;
		return form;
	};

	itemForm.attachChangeListeners = function (
		cachedForm,
		propertyChangeHandler
	) {
		// add event listtener on change event for all fields on the form
		var formNode = cachedForm.contentWindow.params.formNd;
		var properties = formNode.selectNodes(
			'Relationships/Item[@type="Body"]/Relationships/Item[@type="Field" and is_visible = "1"]'
		);
		for (var k = 0; k < properties.length; k++) {
			var keyedName = properties[k]
				.selectSingleNode('propertytype_id')
				.getAttribute('keyed_name');
			if (keyedName) {
				var observerObject = cachedForm.contentWindow.observersHash.getElementById(
					keyedName + '_system'
				);
				if (observerObject) {
					observerObject.attachEvent('onchange', propertyChangeHandler);
				}
			}
		}
	};

	itemForm.populateFormWithItemEx = function (
		topWindow,
		cachedForm,
		descriptionNode,
		formMode
	) {
		window.startPopulateFormWithItemEx = true;
		topWindow.aras.uiPopulateFormWithItemEx(
			cachedForm.contentDocument,
			descriptionNode,
			'',
			formMode == 'edit'
		);
		delete window.startPopulateFormWithItemEx;
	};

	itemForm.onFormLoadHandler = function (
		topWindow,
		cachedForm,
		userChangeHandler,
		propertyChangeHandler
	) {
		topWindow.ITEM_WINDOW.registerStandardShortcuts(cachedForm.contentWindow);
		if (topWindow.returnBlockerHelper) {
			topWindow.returnBlockerHelper.attachBlocker(cachedForm.contentWindow);
		}

		cachedForm.contentDocument.userChangeHandler = userChangeHandler;
		cachedForm.contentDocument.documentElement.focus();
		cachedForm.formContentLoaded = true;
		propsFReady = true;

		this.attachChangeListeners(cachedForm, propertyChangeHandler);
	};

	cmfObject.ItemForm = itemForm;
	window.CMF = cmfObject;
})(typeof CMF !== 'undefined' ? CMF : {});
/////////////////// END WORK WITH FORM VIEW  /////////////////////////
