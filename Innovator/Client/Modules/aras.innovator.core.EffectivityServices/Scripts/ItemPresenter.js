(function (window) {
	'use strict';

	function ItemPresenter(aras) {
		this._aras = aras;
	}

	ItemPresenter.prototype = {
		constructor: ItemPresenter,

		_aras: null,

		showInFrame: function (formItemNode, frameElement, viewMode, itemNode) {
			const itemTypeName = itemNode.getAttribute('type');
			const itemTypeItemNode = this._aras.getItemTypeNodeForClient(
				itemTypeName,
				'name'
			);

			this._aras.uiShowItemInFrameEx(
				frameElement,
				itemNode,
				viewMode,
				0,
				formItemNode,
				itemTypeItemNode
			);
		},

		setViewModeInFrame: function (frameElement, isEditMode) {
			const frameContentDocument = frameElement.contentDocument;
			const fieldNodes = frameContentDocument.formNd.selectNodes(
				'Relationships/Item[@type="Body"]/Relationships/Item[@type="Field"]'
			);

			const fieldNodeCount = fieldNodes.length;
			for (let i = 0; i < fieldNodeCount; i++) {
				const fieldId = fieldNodes[i].getAttribute('id');
				const fieldSetExpressionHandler =
					frameElement.contentWindow[
						'expression_' + fieldId + '_setExpression'
					];

				if (fieldSetExpressionHandler) {
					fieldSetExpressionHandler(isEditMode);
				}
			}

			this._aras.uiPopulateFormWithItemEx(
				frameContentDocument.forms.MainDataForm,
				frameContentDocument.itemNd,
				frameContentDocument.itemTypeNd,
				isEditMode
			);
		}
	};

	window.ItemPresenter = ItemPresenter;
})(window);
