//CheckExternalBockElementBelong
define(['dojo/_base/declare', 'dojo/aspect'], function (declare, aspect) {
	return declare(
		'Aras.Client.Controls.TechDoc.Helper.ExternalBlockHelper',
		null,
		{
			_elementsIdsList: null,

			constructor: function (args) {
				this._viewmodel = args.viewmodel;
				this.Reset();

				aspect.after(
					this._viewmodel,
					'OnElementUnregistered',
					this._OnElementUnregistered.bind(this),
					true
				);
			},

			isExternalBlockContains: function (
				/*WrappedObject | Array*/ targetElements
			) {
				if (targetElements) {
					targetElements = Array.isArray(targetElements)
						? targetElements
						: [targetElements];

					for (var i = 0; i < targetElements.length; i++) {
						if (this._CheckWrappedObject(targetElements[i])) {
							return true;
						}
					}
				}

				return false;
			},

			DropValidationCache: function (/* string */ elementId) {
				if (this._elementsIdsList[elementId] !== undefined) {
					delete this._elementsIdsList[elementId];
				}
			},

			_OnElementUnregistered: function (/*StructuredDocument*/ sender, earg) {
				var element = earg.unregisteredObject;

				this.DropValidationCache(element.Id());
			},

			_CheckWrappedObject: function (wrappedObject) {
				// someday it should be refactored
				function setIdsToList(flag) {
					if (vm.GetElementById(wid)) {
						parentsIds.forEach(function (id) {
							list[id] = flag;
						});
					}
				}

				var vm = this._viewmodel;
				var parentsIds = [];
				var list = this._elementsIdsList;
				var wid = wrappedObject.Id();
				var parentWrappedObj = wrappedObject;
				var parentId = parentWrappedObj.Id();

				do {
					if (list[parentId] !== undefined) {
						if (parentsIds.length) {
							setIdsToList(list[parentId]);
						}

						return list[wid];
					}

					parentsIds.push(parentId);
					parentWrappedObj = parentWrappedObj.Parent;

					if (parentWrappedObj) {
						parentId = parentWrappedObj.Id();

						if (
							parentWrappedObj.is('ArasBlockXmlSchemaElement') &&
							parentWrappedObj.isExternal()
						) {
							setIdsToList(true);

							if (parentWrappedObj.Parent) {
								this._CheckWrappedObject(parentWrappedObj);
							} else {
								list[parentId] = false;
							}

							return list[wid];
						}
					}
				} while (parentWrappedObj && parentWrappedObj.Parent);

				setIdsToList(false);
				return list[wid];
			},

			Reset: function () {
				this._elementsIdsList = {};
			}
		}
	);
});
