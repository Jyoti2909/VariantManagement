(function (window) {
	'use strict';

	function EffectivityExpressionEditorViewController(parameters) {
		this.aras = parameters.aras;
		this._itemPresenter = parameters.itemPresenter;
		this.expressionItemNode = parameters.expressionItemNode;
		this._isEditMode = parameters.viewMode !== 'view';

		this._init(
			parameters.viewMode,
			parameters.applyButtonConnectId,
			parameters.applyButtonOnClickHandler,
			parameters.cancelButtonConnectId,
			parameters.cancelButtonOnClickHandler,
			parameters.editButtonConnectId,
			parameters.editorIframeConnectId
		);
	}

	EffectivityExpressionEditorViewController.prototype = {
		constructor: EffectivityExpressionEditorViewController,

		aras: null,

		_itemPresenter: null,

		expressionItemNode: null,

		get expressionItemId() {
			return this.expressionItemNode.getAttribute('id');
		},

		get expressionItemTypeId() {
			return this.expressionItemNode.getAttribute('typeId');
		},

		_applyButtonElement: null,

		_editorFrameElement: null,

		_isEditMode: false,

		_isScopeSelected: false,

		_isEffectivityExpressionValid: false,

		_effsModuleSolutionBasedRelativePath:
			'../Modules/aras.innovator.core.EffectivityServices',

		_init: function (
			viewMode,
			applyButtonConnectId,
			applyButtonOnClickHandler,
			cancelButtonConnectId,
			cancelButtonOnClickHandler,
			editButtonConnectId,
			editorIframeConnectId
		) {
			this._setupApplyButton(applyButtonConnectId, applyButtonOnClickHandler);
			this._setupCancelButton(
				cancelButtonConnectId,
				cancelButtonOnClickHandler
			);
			this._setupEditButton(editButtonConnectId);
			this._setupEditorPresentation(viewMode, editorIframeConnectId);
		},

		_setupApplyButton: function (
			applyButtonConnectId,
			applyButtonOnClickHandler
		) {
			this._applyButtonElement = document.getElementById(applyButtonConnectId);

			this._setupButton(
				this._applyButtonElement,
				'effectivity_expression_editor.apply_button_label',
				function () {
					applyButtonOnClickHandler(this.expressionItemNode);
				}.bind(this)
			);

			this._setElementState(this._applyButtonElement, false);
			this._setElementVisibility(this._applyButtonElement, this._isEditMode);
			this._setupListenerForUpdatingApplyButtonState();
		},

		_setupListenerForUpdatingApplyButtonState: function () {
			const updateApplyButtonState = function () {
				this._setElementState(
					this._applyButtonElement,
					this.isExpressionItemValid()
				);
			}.bind(this);

			document.addEventListener(
				'effectivityExpressionInputChange',
				function (e) {
					this._isEffectivityExpressionValid = e.detail.isInputExpressionValid;
					updateApplyButtonState();
				}.bind(this)
			);

			document.addEventListener(
				'effectivityScopeChange',
				function (e) {
					this._isScopeSelected = !!this.aras.uiGetItemByKeyedName(
						'effs_scope',
						e.detail.scopeInputValue,
						true
					);
					updateApplyButtonState();
				}.bind(this)
			);
		},

		_setupCancelButton: function (
			cancelButtonConnectId,
			cancelButtonOnClickHandler
		) {
			const cancelButtonElement = document.getElementById(
				cancelButtonConnectId
			);
			this._setupButton(
				cancelButtonElement,
				'effectivity_expression_editor.cancel_button_label',
				function () {
					cancelButtonOnClickHandler(
						this.expressionItemNode,
						this.isExpressionItemValid()
					);
				}.bind(this)
			);
		},

		_setupEditButton: function (editButtonConnectId) {
			const editButtonElement = document.getElementById(editButtonConnectId);

			this._setupButton(
				editButtonElement,
				'effectivity_expression_editor.edit_button_label',
				function () {
					this._isEditMode = true;

					this._itemPresenter.setViewModeInFrame(
						this._editorFrameElement,
						this._isEditMode
					);
					this._setElementVisibility(editButtonElement, !this._isEditMode);
					this._setElementVisibility(
						this._applyButtonElement,
						this._isEditMode
					);
				}.bind(this)
			);

			this._setElementVisibility(editButtonElement, !this._isEditMode);

			if (!this._isEditMode) {
				const isUpdateAccessPermitted = this._hasPermission(
					'can_update',
					this.expressionItemId,
					this.expressionItemTypeId
				);
				this._setElementState(editButtonElement, isUpdateAccessPermitted);
			}
		},

		_setupButton: function (
			buttonElement,
			textContentResource,
			onClickEventListener
		) {
			buttonElement.querySelector(
				'.aras-button__text'
			).textContent = this.aras.getResource(
				this._effsModuleSolutionBasedRelativePath,
				textContentResource
			);
			buttonElement.addEventListener('click', onClickEventListener);
		},

		_setupEditorPresentation: function (viewMode, editorIframeConnectId) {
			//Id represents the 'effs_expression' form
			const formItem = this.aras.getFormForDisplay(
				'5D991BF16A404420BC38D2C895C9E6E1'
			);
			const formItemNode = formItem.node.cloneNode(true);

			const cssNode = formItemNode.selectSingleNode(
				'Relationships/Item[@type="Body"]/css'
			);
			ArasModules.xml.setText(
				cssNode,
				'@import "../Modules/aras.innovator.core.EffectivityServices/Styles/effectivityExpressionForm.css"'
			);

			const itemTypeName = this.expressionItemNode.getAttribute('type');
			const itemTypeItemNode = this.aras.getItemTypeNodeForClient(
				itemTypeName,
				'name'
			);

			this._editorFrameElement = document.getElementById(editorIframeConnectId);

			this._bindFormItemFieldsToItemTypeItemProperties(
				formItemNode,
				itemTypeItemNode
			);

			this._itemPresenter.showInFrame(
				formItemNode,
				this._editorFrameElement,
				viewMode,
				this.expressionItemNode
			);
		},

		_setElementState: function (element, isEnabled) {
			element.disabled = !isEnabled;
		},

		_bindFormItemFieldsToItemTypeItemProperties: function (
			formItemNode,
			itemTypeItemNode
		) {
			const itemDataTypePropertyNodes = itemTypeItemNode.selectNodes(
				'Relationships/Item[@type="Property" and data_type="item"]'
			);
			if (!itemDataTypePropertyNodes.length) {
				return;
			}

			const itemDataTypePropertyIdsByNames = Array.prototype.reduce.call(
				itemDataTypePropertyNodes,
				function (accumulator, propertyItemNode) {
					const propertyId = this.aras.getItemProperty(propertyItemNode, 'id');
					const propertyName = this.aras.getItemProperty(
						propertyItemNode,
						'name'
					);
					accumulator[propertyName] = propertyId;

					return accumulator;
				}.bind(this),
				{}
			);

			const lookupFormItemFieldsCondition = Object.keys(
				itemDataTypePropertyIdsByNames
			)
				.map(function (propertyName) {
					return '@keyed_name="' + propertyName + '"';
				})
				.join(' or ');

			const formItemFieldNodes = formItemNode.selectNodes(
				'Relationships/Item[@type="Body"]' +
					'/Relationships/Item[@type="Field" and field_type="item" and propertytype_id[' +
					lookupFormItemFieldsCondition +
					']]'
			);
			Array.prototype.forEach.call(
				formItemFieldNodes,
				function (formItemFieldNode) {
					const propertyTypeIdNode = formItemFieldNode.selectSingleNode(
						'propertytype_id'
					);

					const propertyTypeIdKeyedNameAttributeValue = propertyTypeIdNode.getAttribute(
						'keyed_name'
					);
					ArasModules.xml.setText(
						propertyTypeIdNode,
						itemDataTypePropertyIdsByNames[
							propertyTypeIdKeyedNameAttributeValue
						]
					);
				}.bind(this)
			);
		},

		_setElementVisibility: function (element, isVisible) {
			element.classList.toggle('aras-hide', !isVisible);
		},

		isExpressionItemValid: function () {
			return this._isScopeSelected && this._isEffectivityExpressionValid;
		},

		_hasPermission: function (
			accessType,
			expressionItemId,
			expressionItemTypeId
		) {
			let getPermissionsItem = this.aras.newIOMItem(
				'Method',
				'effs_getExpressionPermissions'
			);
			getPermissionsItem.setProperty('access_type', accessType);
			getPermissionsItem.setProperty('expression_item_id', expressionItemId);
			getPermissionsItem.setProperty(
				'expression_itemtype_id',
				expressionItemTypeId
			);

			getPermissionsItem = getPermissionsItem.apply();

			if (getPermissionsItem.isError()) {
				this.aras.AlertError(getPermissionsItem);

				return false;
			}

			return getPermissionsItem.getResult() === '1';
		}
	};

	window.EffectivityExpressionEditorViewController = EffectivityExpressionEditorViewController;
})(window);
