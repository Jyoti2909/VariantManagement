require([
	'dojo/dom-style',
	'Aras/Client/Controls/Experimental/Tree',
	'dojo/_base/declare',
	'dojo/on',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/text!Izenda/Views/Widgets/ReportingStructure.html',
	'dojo/query',
	'dojo/dom-attr',
	'dojo/dom-geometry'
], function (
	domStyle,
	tree,
	declare,
	on,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	template,
	query,
	domAttr,
	domGeom
) {
	var aras = TopWindowHelper.getMostTopWindowWithAras(window).aras;

	function buildBottomPanelRow(
		property,
		selectorType,
		selectedItems,
		availableItems
	) {
		const itemTypeSuffix = property.itemTypeGuid
			? "'" + property.instanceData.toUpperCase() + '_' + property.itemTypeGuid
			: '';
		const key = format(
			Izenda.Utils.propertyNamingTemplate,
			property.instanceData,
			property.name.toUpperCase(),
			itemTypeSuffix
		);

		let bldNode = document.createDocumentFragment();
		if (availableItems && availableItems.indexOf(key) === -1) {
			return bldNode;
		}

		const isSelected = false; //selectedItems && selectedItems[key];
		const rowDiv = document.createElement('div');
		rowDiv.className =
			'bottom-panel-row' + (property.isHidden === '1' ? ' isHiddenField' : '');

		if (selectorType === 'checkbox') {
			const checkBoxContainer = document.createElement('div');
			checkBoxContainer.className = 'checkBoxContainer';

			const inputCheckbox = document.createElement('input');
			inputCheckbox.type = 'checkbox';
			inputCheckbox.className = 'aras_grid_input_checkbox arasCheckboxOrRadio';
			inputCheckbox.checked = isSelected;
			inputCheckbox.setAttribute(
				'data-property-name',
				escapeAttributeValue(property.name || '')
			);
			inputCheckbox.setAttribute('data-dojo-type', 'dijit/form/CheckBox');
			inputCheckbox.setAttribute('name', 'property');
			checkBoxContainer.appendChild(inputCheckbox);

			const checkbox = document.createElement('div');
			checkbox.className =
				'aras_grid_checkbox' + (isSelected ? ' checked' : ' unchecked');
			checkBoxContainer.appendChild(checkbox);

			rowDiv.appendChild(checkBoxContainer);
		} else if (selectorType === 'radio') {
			const inputRadio = document.createElement('input');
			inputRadio.type = 'radio';
			inputRadio.className =
				'arasCheckboxOrRadio' + (isSelected ? ' checked' : '');
			inputRadio.checked = isSelected;
			inputRadio.setAttribute(
				'data-property-name',
				escapeAttributeValue(property.name || '')
			);
			inputRadio.setAttribute('name', 'property');

			rowDiv.appendChild(inputRadio);
		}

		const label = document.createElement('label');
		const labelText = document.createTextNode(property.label || property.name);
		label.appendChild(labelText);
		rowDiv.appendChild(label);

		bldNode.appendChild(rowDiv);
		return bldNode;
	}

	var reportingStructure = declare(
		[_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
		{
			templateString: template,
			tree: null,
			isBottomPanelHidden: true,
			onBottomPanelRowSelectedCallback: null,
			selectedItems: {},
			selectedRowsMetadata: {
				selectedRows: {},
				rowsIdsCounter: {}
			},
			itemTypesProperties: {},
			additionalData: null,
			currentItemId: null,
			currentItemTypeId: null,

			constructor: function (args) {
				this.args = args;
				if (this.args.isBottomPanelHidden !== undefined) {
					this.isBottomPanelHidden = this.args.isBottomPanelHidden;
				}
				this.onBottomPanelRowSelectedCallback = this.args.onBottomPanelRowSelectedCallback;
			},

			init: function () {
				this.selectedItems = {};
				this.borderContainer.resize();
				if (this.isBottomPanelHidden) {
					this.hideBottomPanel();
				}
				this.initTree();
				this.borderContainer.resize();

				on(
					this.bottomPanelContainer,
					'.bottom-panel-row input:change, .bottom-panel-row label :dblclick',
					function (e) {
						this.handleSelection(
							this.args.selectorType,
							this.args.isLazySelect,
							this.args.dblclickEnabled,
							e
						);
					}.bind(this)
				);

				on(
					this.bottomPanelContainer,
					'.more_link:click',
					function (e) {
						this.bottomPanelContainer.classList.add('showAllProps');
					}.bind(this)
				);

				if (this.args.isLazySelect) {
					this.okButton.classList.add('ok-button');
					domStyle.set(this.okButton, 'display', '');
					this.okButton.parentNode.classList.add(
						'reporting-structure-ok-block'
					);
					on(this.okButton, 'click', this.onBottomPanelRowSelected.bind(this));
					if (this.args.buttonText) {
						this.okButton.value = this.args.buttonText;
					}
				}

				if (this.args.inputEl) {
					var availableOptions = [];
					for (var i = 0; i < this.args.inputEl.length; i++) {
						availableOptions.push(this.args.inputEl.options[i].value);
					}
					this.availableOptions = availableOptions;
				}
			},

			handleSelection: function (
				selectorType,
				isLazySelect,
				dblclickEnabled,
				e
			) {
				function getInput() {
					if (e.type === 'change') {
						return e.target;
					} else if (e.type === 'dblclick') {
						if (selectorType === 'radio') {
							return e.target.previousSibling;
						} else {
							return e.target.previousSibling.firstChild;
						}
					}
				}

				if (!dblclickEnabled && e.type === 'dblclick') {
					return;
				}

				var target = getInput();

				if (selectorType === 'checkbox' && e.type !== 'dblclick') {
					var innovatorCheckbox = target.parentNode.querySelector(
						'.aras_grid_checkbox'
					);
					if (innovatorCheckbox) {
						innovatorCheckbox.classList.toggle('checked');
						innovatorCheckbox.classList.toggle('unchecked');
					}
				}

				if (selectorType === 'radio') {
					this.selectedItems = {};
				}

				var propertyName = domAttr.get(target, 'data-property-name');
				var itemTypeProperties = this.itemTypesProperties[
					this.currentItemTypeId
				];
				var property = jq$.grep(itemTypeProperties, function (e) {
					return e.name === propertyName;
				})[0];
				var additionalData = this.additionalData;
				if (additionalData) {
					var keys = Object.keys(additionalData);
					for (var k = 0; k < keys.length; k++) {
						property[keys[k]] = additionalData[keys[k]];
					}
				}
				var itemTypeSuffix = property.itemTypeGuid
					? "'" +
					  property.instanceData.toUpperCase() +
					  '_' +
					  property.itemTypeGuid
					: '';
				var key = format(
					Izenda.Utils.propertyNamingTemplate,
					property.instanceData,
					propertyName.toUpperCase(),
					itemTypeSuffix
				);

				var selectedItem = {
					name: propertyName,
					itemType: property.instanceData.toUpperCase(),
					itemTypeLabel: property.typeLabel || '',
					propertyLabel: property.label || '',
					itemTypeName: property.typeName || '',
					propertyDataType: property.dataType,
					itemTypeSuffix: itemTypeSuffix,
					itemTypeCount: property.countSuffix,
					customLabel: property.label || property.name
				};

				if (dblclickEnabled && e.type === 'dblclick') {
					var tempSelectedItem = {};
					tempSelectedItem[key] = selectedItem;
					this.onBottomPanelRowSelected(null, tempSelectedItem);
					return;
				}

				if (this.selectedItems[key]) {
					delete this.selectedItems[key];
				} else {
					this.selectedItems[key] = selectedItem;
				}

				domAttr.remove(this.okButton, 'disabled');

				if (!isLazySelect || (dblclickEnabled && e.type === 'dblclick')) {
					this.onBottomPanelRowSelected();
				}
			},

			clearBottomPanelSelections: function () {
				this.selectedItems = {};
				domAttr.set(this.okButton, 'disabled', 'disabled');
				query('.aras_grid_checkbox', this.bottomPanelContainer).forEach(
					function (el) {
						el.classList.remove('checked');
						el.classList.add('unchecked');
					}
				);
				query('input:checked', this.bottomPanelContainer).forEach(function (
					el
				) {
					el.checked = false;
				});
			},

			onBottomPanelRowSelected: function (e, items) {
				if (this.onBottomPanelRowSelectedCallback) {
					this.onBottomPanelRowSelectedCallback(
						items ? items : this.selectedItems
					);
				}
				if (!items) {
					this.clearBottomPanelSelections();
				}
			},

			deselectBottomPanelItem: function (rowKey) {
				var data = this.selectedItems[rowKey];
				if (data) {
					delete this.selectedItems[rowKey];
				}
			},

			onResize: function (height) {
				domStyle.set(
					this.borderContainer.domNode,
					'height',
					height - domGeom.getMarginBox(this.okButtonBlock).h + 'px'
				);
				this.borderContainer.resize();
			},

			hideBottomPanel: function () {
				domStyle.set(this.bottomPanel.domNode, 'display', 'none');
				this.borderContainer.domNode.classList.add('with-hidden-bottom-panel');
			},

			showBottomPanel: function () {
				domStyle.set(this.bottomPanel.domNode, 'display', 'block');
				this.borderContainer.domNode.classList.remove(
					'with-hidden-bottom-panel'
				);
				this.borderContainer.resize();
			},

			selectItem: function (item) {
				this.selectedBreadCrumbPath = Izenda.UI.Widgets.Breadcrumbs.buildBreadcrumbPath(
					this.tree._tree.path
				);
				this.currentItemId = item.id;
				const itemTypeGuid = item.userdata.rule !== '-1' ? item.id : '';
				const additional = {
					countSuffix: item.userdata.countSuffix,
					itemTypeGuid: itemTypeGuid
				};
				const additionalData = {};
				const itemTypeId = item.userdata.itemTypeId;
				this.currentItemTypeId = itemTypeId;
				additionalData[itemTypeId] = additional;
				let properties = this.itemTypesProperties[itemTypeId];
				this.additionalData = additional;
				if (!properties) {
					properties = Izenda.Utils.getItemTypeProperties(
						[
							{
								itemTypeId: itemTypeId
							}
						],
						additionalData,
						this.args.skipItemTypeProperties
					)[itemTypeId];
					this.itemTypesProperties[itemTypeId] = properties;
				}
				this.reloadBottomPanel(properties, this.args.selectorType);
				this.showBottomPanel();
			},

			initTree: function () {
				this.tree = new Aras.Client.Controls.Experimental.Tree({
					IconPath: this.args.clientUrl,
					allowEmptyIcon: true
				});

				clientControlsFactory.on(this.tree, {
					menuClick: function () {}
				});

				this.tree._tree.placeAt(this.treeContainer);
				var self = this;
				on(this.tree._tree, 'click', function (item, node, evt) {
					self.selectItem(item);
				});
			},

			reloadTree: function (template) {
				this.tree.reload(template);
				this.tree._tree.expandAll().then(
					function () {
						this.borderContainer.resize();
					}.bind(this)
				);
				if (this.currentItemId) {
					const parentId = this.tree.GetParentId(this.currentItemId);
					if (!parentId) {
						const item = this.tree.GetAllItems()[0].children[0];
						this.tree.selectItem(item.id);
						this.selectItem(item);
					}
				}
			},

			reloadBottomPanel: function (properties, selectorType) {
				this.clearBottomPanelSelections();
				var bottomPanelNode = document.createDocumentFragment();
				for (var i = 0; i < properties.length; i++) {
					bottomPanelNode.appendChild(
						buildBottomPanelRow(
							properties[i],
							selectorType,
							this.selectedItems,
							this.availableOptions
						)
					);
				}
				const moreLink = document.createElement('div');
				moreLink.className = 'bottom-panel-row more_link';
				const moreLabel = Izenda.Utils.GetResource('reportingstructure.more');
				const text = document.createTextNode(moreLabel);
				moreLink.appendChild(text);
				bottomPanelNode.appendChild(moreLink);

				this.bottomPanelContainer.classList.remove('showAllProps');
				if (this.bottomPanelContainer.hasChildNodes()) {
					this.bottomPanelContainer.innerHTML = '';
				}
				this.bottomPanelContainer.appendChild(bottomPanelNode);
				this.startup();
				this.borderContainer.resize();
			},

			setSelectedItems: function (data) {
				this.selectedItems = data ? data : {};
			}
		}
	);

	dojo.setObject('Izenda.UI.Widgets.ReportingStructure', reportingStructure);
});
