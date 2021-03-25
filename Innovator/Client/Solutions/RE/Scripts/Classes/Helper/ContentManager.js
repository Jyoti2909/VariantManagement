define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOMRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOM'
],
function(declare, DOMRenderer, DOMapi) {
	return declare('Aras.Client.Controls.RE.Helper.ContentManager', null, {
		_viewmodel: null,
		aras: null,
		_invalidationList: null,
		_domapi: null,
		domRenderer: null,

		constructor: function(args) {
			this._viewmodel = args.viewmodel;
			this.aras = args.aras;
			this._invalidationList = [];
		},

		init: function(args) {
			this._domapi = new DOMapi({document: args.document, viewmodel: this._viewmodel});
			this.domRenderer = new DOMRenderer({domapi: this._domapi, viewmodel: this._viewmodel});
		},

		_isTopInvalidObject: function(/*WrappedObject*/ targetObject) {
			let objectToCheck = targetObject.Parent;

			while (objectToCheck) {
				if (this._invalidationList.indexOf(objectToCheck) >= 0) {
					return false;
				}

				objectToCheck = objectToCheck.Parent;
			}

			return true;
		},

		invalidate: function(/*WrappedObject*/ invalidObject) {
			this._invalidateObject(invalidObject);
		},

		_invalidateObject: function(/*WrapeedObject*/ invalidObject) {
			if (this._invalidationList.indexOf(invalidObject) == -1) {
				this._invalidationList.push(invalidObject);
			}
		},

		refresh: function(/*WrappedObject*/ targetElement) {
			if (!targetElement) {
				let invalidElement;
				let i;

				for (i = 0; i < this._invalidationList.length; i++) {
					invalidElement = this._invalidationList[i];

					if (this._isTopInvalidObject(invalidElement)) {
						this.refresh(invalidElement);
					}
				}

				this._invalidationList.length = 0;
			} else {
				this._refreshElement(targetElement);
			}
		},

		_refreshElement: function(targetElement) {
			let invalidNode = this._domapi.getNode(targetElement);

			// external element (row) that was added in Table and has different count of columns, doesn't belong to document's children.
			if (invalidNode) {
				let validNode = this.domRenderer.render(targetElement);
				let isInactiveRoot = invalidNode.className.indexOf('ArasXmlSchemaElementInactiveRoot') > -1;

				if (isInactiveRoot) {
					// if element is root of inactive content, then it will be wrapped in "InactiveContainer/InactiveContent" nodes
					// and we need to replace full this structure
					invalidNode = invalidNode.parentNode.parentNode;
				}

				invalidNode.parentNode.replaceChild(validNode, invalidNode);
			}
		},

		renderAll: function(/*WrappedObject*/ renderObject) {
			return this.domRenderer.RenderHtml(renderObject);
		}
	});
});
