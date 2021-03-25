define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTableXmlSchemaElement/ArasRowControllerElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, XmlSchemaElement, ArasRowControllerElement, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras._ArasTableXmlSchemaElement.ArasRowXmlSchemaElement',
		XmlSchemaElement,
		{
			cellOriginNodeName: null,
			_display: null,
			rowsController: null,

			constructor: function (args) {
				this.registerType('ArasRowXmlSchemaElement');
			},

			registerDocumentElement: function () {
				this.inherited(arguments);

				if (this.GetTable()) {
					this._tableObj.RegisterChildElement(this);
				}
			},

			unregisterDocumentElement: function () {
				if (this.GetTable()) {
					this._tableObj.UnregisterChildElement(this);
				}

				this.inherited(arguments);

				this._tableObj = null;
			},

			/* Overrided Methods */
			_parseOriginInternal: function () {
				this.inherited(arguments);

				if (!this.ChildItems().length()) {
					var cellOriginNodeName = this._getCellType();
					var newCellElement = this.ownerDocument.CreateElement('element', {
						type: cellOriginNodeName
					});

					this.ChildItems().add(newCellElement);
				}
			},

			/*Public Methods*/
			PushEmptyCellsInRow: function (/*int*/ cellCount) {
				if (cellCount > -1) {
					var cellOriginNodeName = this._getCellType();
					var childList = this.ChildItems();
					var viewModel = this.ownerDocument;
					var currentCount = childList.length();
					var newCellElement;
					var i;

					for (i = currentCount; i < cellCount; i++) {
						newCellElement = viewModel.CreateElement('element', {
							type: cellOriginNodeName
						});
						childList.add(newCellElement);
					}
				}
			},

			SetCell: function (/*int*/ position) {
				var cellOriginNodeName = this._getCellType();
				var newCellElement = this.ownerDocument.CreateElement('element', {
					type: cellOriginNodeName
				});

				this.ChildItems().insertAt(position, newCellElement);
			},

			DeleteCell: function (/*int*/ position) {
				this.ChildItems().splice(position, 1);
			},

			GetTable: function () {
				if (!this._tableObj) {
					var parent = this.Parent;

					while (parent && !parent.is('ArasTableXmlSchemaElement')) {
						parent = parent.Parent;
					}

					if (parent) {
						this._tableObj = parent;
					} else if (!parent) {
						// subscription to observe by controller
						this.GetRowsController();
					}
				}

				return this._tableObj;
			},

			GetRowsController: function () {
				var observer = this.rowsController;

				if (!observer) {
					var vm = this.ownerDocument;
					var elementList = vm._all;
					var element;
					var id;

					for (id in elementList) {
						element = elementList[id];

						if (element.rowsController) {
							observer = element.rowsController;
							this.rowsController = observer;
						}
					}

					this.rowsController =
						observer || new ArasRowControllerElement({ viewmodel: vm });
					this.rowsController.AddToControl(this);
				}

				return this.rowsController;
			},

			IsRowHidden: function () {
				if (this.internal.display === Enums.DisplayType.Hidden) {
					return true;
				} else {
					var parent = this.Parent;

					while (parent && !parent.is('ArasTableXmlSchemaElement')) {
						if (parent.Display() === Enums.DisplayType.Hidden) {
							return true;
						}

						parent = parent.Parent;
					}
				}

				return false;
			},

			/*Private Methods*/
			_getCellType: function () {
				if (!this.cellOriginNodeName) {
					this.cellOriginNodeName = this.ownerDocument.tableHelper.GetOriginCellNameForRow(
						this
					);
				}

				return this.cellOriginNodeName || 'aras:tablecell';
			},

			getLastCell: function () {
				var rowChilds = this.ChildItems();

				return rowChilds.get(rowChilds.length() - 1);
			}
		}
	);
});
