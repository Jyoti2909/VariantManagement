define([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/RendererFactory'
], function (declare, domConstruct, RendererFactory) {
	return declare('Aras.Client.Controls.TechDoc.UI.DOMRenderer', null, {
		_rendererFactory: null,

		constructor: function (args) {
			this._domapi = args.domapi;
			this._viewmodel = args.viewmodel;
			this._invalidationList = [];
			this._rendererFactory = new RendererFactory({
				viewmodel: this._viewmodel
			});
		},

		_isTopInvalidObject: function (/*WrappedObject*/ targetObject) {
			var objectToCheck = targetObject.Parent;

			while (objectToCheck) {
				if (this._invalidationList.indexOf(objectToCheck) >= 0) {
					return false;
				}

				objectToCheck = objectToCheck.Parent;
			}

			return true;
		},

		invalidate: function (/*WrappedObject*/ invalidObject) {
			this._invalidateObject(invalidObject);
		},

		_invalidateObject: function (/*WrapeedObject*/ invalidObject) {
			if (this._invalidationList.indexOf(invalidObject) == -1) {
				this._invalidationList.push(invalidObject);
			}
		},

		refresh: function (/*WrappedObject*/ targetElement) {
			if (!targetElement) {
				var invalidElement;
				var i;

				for (i = 0; i < this._invalidationList.length; i++) {
					invalidElement = this._invalidationList[i];

					if (this._isTopInvalidObject(invalidElement)) {
						this.refresh(invalidElement);
					}
				}

				this._invalidationList.length = 0;
			} else {
				var invalidNode = this._domapi.getNode(targetElement);

				// external element (row) that was added in Table and has different count of columns, doesn't belong to document's children.
				if (invalidNode) {
					var validNode = this.render(targetElement);
					var isInactiveRoot =
						invalidNode.className.indexOf('ArasXmlSchemaElementInactiveRoot') >
						-1;

					if (isInactiveRoot) {
						// if element is root of inactive content, then it will be wrapped in "InactiveContainer/InactiveContent" nodes
						// and we need to replace full this structure
						invalidNode = invalidNode.parentNode.parentNode;
					}

					invalidNode.parentNode.replaceChild(validNode, invalidNode);
				}
			}
		},

		render: function (/*WrappedObject*/ renderObject) {
			var renderedHtml = this.RenderHtml(renderObject);

			return domConstruct.toDom(renderedHtml);
		},

		RenderHtml: function (/*WrappedObject*/ renderObject, optionalParameters) {
			var renderer = this._rendererFactory.CreateRenderer(renderObject);
			var out = '';

			if (renderer) {
				out += renderer.RenderHtml(renderObject, null, optionalParameters);
			} else {
				this._viewmodel._aras.AlertError(
					aras.getResource(
						'../Modules/aras.innovator.TDF',
						'helper.unknown_render_object'
					)
				);
			}

			return out;
		}
	});
});
