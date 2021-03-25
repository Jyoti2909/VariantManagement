const { bind, wire } = HyperHTMLElement;
const icons = {
	properties: '../images/Properties.svg',
	relationshipType: '../images/RelationshipType.svg'
};

ArasModules.SvgManager.enqueue(Object.values(icons));

export default class ExpandSettingsMenu {
	constructor(arasObject) {
		this.arasObject = arasObject;
		this.containerNode = document.body;
		this.selectAllCheckbox = wire()`
			<input
				class="aras-checkbox__input"
				type="checkbox"
				onclick="${() => this._onToggleSelectAll()}"
			/>
		`;
		this.relationshipContainerNode = wire()`<div />`;
		this.propertyContainerNode = wire()`<div />`;
		const resources = {
			selectAll: this._getResource('expand_menu.select_all'),
			relationships: this._getResource('expand_menu.relationships'),
			properties: this._getResource('expand_menu.properties'),
			apply: this._getResource('expand_menu.apply'),
			cancel: this._getResource('expand_menu.cancel')
		};
		this.domNode = wire()`
			<div class="expand-menu">
				<label class="expand-menu__checkbox aras-checkbox">
					${this.selectAllCheckbox}
					<span class="aras-checkbox__check-button" />
					${resources.selectAll}
				</label>
				<div class="expand-menu__separator"></div>
				<div
					class="expand-menu__content"
					onchange="${() => this._updateSelectAllButton()}"
				>
					<div class="expand-menu__relationships-header">${resources.relationships}</div>
					${this.relationshipContainerNode}
					<div class="expand-menu__separator"></div>
					<div class="expand-menu__properties-header">${resources.properties}</div>
					${this.propertyContainerNode}
				</div>
				<div class="expand-menu__separator"></div>
				<div class="expand-menu__buttons-bar aras-buttons-bar aras-buttons-bar_right">
					<button
						class="aras-buttons-bar__button aras-button aras-button_primary"
						onclick="${() => this._onApply()}"
					>
						<span class="aras-button__text">${resources.apply}</span>
					</button>
					<button
						class="aras-buttons-bar__button aras-button aras-button_secondary"
						onclick="${() => this._onCancel()}"
					>
						<span class="aras-button__text">${resources.cancel}</span>
					</button>
				</div>
			</div>
		`;

		this.containerNode.appendChild(this.domNode);
	}

	_getRelatedItemRow(id, checked, image) {
		const relatedItemImage = ArasModules.SvgManager.createHyperHTMLNode(image, {
			class: 'expand-menu__checkbox-item-icon'
		});
		return wire()`
			<label class="expand-menu__checkbox aras-checkbox">
				<input
					id="${id}"
					class="aras-checkbox__input"
					type="checkbox"
					checked=${checked}
				/>
				<span class="aras-checkbox__check-button" />
				${relatedItemImage}
				${id}
			</label>
		`;
	}

	showPopupWindow(activeConnectors, hiddenConnectors, positionX, positionY) {
		this._activeConnectors = activeConnectors;
		this._hiddenConnectors = hiddenConnectors;
		this._relationships = [];
		this._properties = [];
		this._allConnectorsHash = {};

		const allConnectors = [...activeConnectors, ...hiddenConnectors];
		allConnectors.forEach((connectorKey) => {
			const connectorName = connectorKey.pname || connectorKey.rname;
			if (!this._allConnectorsHash[connectorName]) {
				this._allConnectorsHash[connectorName] = [];

				if (connectorKey.pname) {
					this._properties.push({
						name: connectorKey.pname,
						isChecked: !hiddenConnectors.includes(connectorKey)
					});
				}
				if (connectorKey.rname) {
					this._relationships.push({
						name: connectorKey.rname,
						isChecked: !hiddenConnectors.includes(connectorKey)
					});
				}
			}

			this._allConnectorsHash[connectorName].push(connectorKey);
		});
		this._renderPopupWindowContent();

		this.domNode.classList.add('expand-menu_active');
		if (positionX + this.domNode.clientWidth > this.containerNode.clientWidth) {
			positionX -= this.domNode.clientWidth;
		}

		const outOfScreenHeight =
			positionY + this.domNode.offsetHeight - this.containerNode.clientHeight;
		if (outOfScreenHeight > 0) {
			positionY -= outOfScreenHeight;
		}
		this.domNode.style.left = positionX + 'px';
		this.domNode.style.top = positionY + 'px';
		this.isActive = true;
	}

	hidePopupWindow() {
		if (this.isActive) {
			this._activeConnectors = null;
			this._hiddenConnectors = null;
			this._properties = null;
			this._relationships = null;
			this._allConnectorsHash = null;
			this.domNode.classList.remove('expand-menu_active');

			this.isActive = false;
		}
	}

	onApplyButtonClick() {}

	onCancelButtonClick() {}

	_renderPopupWindowContent() {
		if (this._relationships.length) {
			const relationshipsNode = this._relationships
				.sort()
				.map((relationship) => {
					return this._getRelatedItemRow(
						relationship.name,
						relationship.isChecked,
						icons.relationshipType
					);
				});
			bind(this.relationshipContainerNode)`
				${relationshipsNode}
			`;
		} else {
			const label = this._getResource('expand_menu.relationships_not_found');
			bind(this.relationshipContainerNode)`
				<div class="expand-menu__no-relationships">${label}</div>
			`;
		}

		if (this._properties.length) {
			const propertiesNode = this._properties
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((property) => {
					return this._getRelatedItemRow(
						property.name,
						property.isChecked,
						icons.properties
					);
				});
			bind(this.propertyContainerNode)`
				${propertiesNode}
			`;
		} else {
			const label = this._getResource('expand_menu.properties_not_found');
			bind(this.propertyContainerNode)`
				<div class="expand-menu__no-properties">${label}</div>
			`;
		}

		this._updateSelectAllButton();
	}

	_onToggleSelectAll() {
		const allSelectionItems = this._getSelectItems();
		allSelectionItems.forEach((selectItem) => {
			selectItem.checked = this.selectAllCheckbox.checked;
		});

		if (!this.selectAllCheckbox.checked) {
			this.selectAllCheckbox.indeterminate = false;
		}
	}

	_updateSelectAllButton() {
		const allSelectionItems = this._getSelectItems();
		const selectedItemsCount = this._getCheckedItemsCount(allSelectionItems);

		if (selectedItemsCount === allSelectionItems.length) {
			this.selectAllCheckbox.checked = true;
			this.selectAllCheckbox.indeterminate = false;
		} else if (
			selectedItemsCount < allSelectionItems.length &&
			selectedItemsCount
		) {
			this.selectAllCheckbox.checked = false;
			this.selectAllCheckbox.indeterminate = true;
		} else {
			this.selectAllCheckbox.checked = false;
			this.selectAllCheckbox.indeterminate = false;
		}
	}

	_onApply() {
		this._activeConnectors.length = 0;
		this._hiddenConnectors.length = 0;
		this._getSelectItems().forEach((selectItem) => {
			const targetOutgoingConnectors = selectItem.checked
				? this._activeConnectors
				: this._hiddenConnectors;

			this._allConnectorsHash[selectItem.getAttribute('id')].forEach(
				(selectedConnector) => {
					targetOutgoingConnectors.push(selectedConnector);
				}
			);
		});

		this.onApplyButtonClick();
		this.hidePopupWindow();
	}

	_onCancel() {
		this.onCancelButtonClick();
		this.hidePopupWindow();
	}

	_getSelectItems() {
		return this.domNode.querySelectorAll(
			'.expand-menu__content .aras-checkbox__input'
		);
	}

	_getCheckedItemsCount(selectItems) {
		return Array.prototype.reduce.call(
			selectItems,
			(sum, item) => (item.checked ? sum + 1 : sum),
			0
		);
	}

	_getResource(key) {
		return this.arasObject.getResource(
			'../Modules/aras.innovator.GraphView',
			key
		);
	}
}
