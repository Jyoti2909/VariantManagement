function XClass(id, name, xClassTreeId, parentId) {
	this.id = id;
	this.name = name;
	this.xClassTreeId = xClassTreeId;
	this.parentId = parentId;
	this.children = [];
	this.isFiltered = false;
	this.checkbox = new XClassSearchCheckbox();
	this.isRelationship = false;
}

XClass.prototype = {
	constructor: XClass,
	addChildXClass: function (xClass, logicState) {
		this.children.push(xClass);
		if (this.children.length === 1) {
			this.checkbox.generateOrderStates(
				true,
				logicState === XClassSearchCheckbox.LogicStates.AND
			);
		}
	},
	nextStateCheckbox: function () {
		const previousState = this.checkbox.state;
		this.checkbox.nextState();
		this.updateChildrenState(this.checkbox.state, previousState);
	},
	setCheckboxState: function (state) {
		let previousState;
		if (state !== this.checkbox.state) {
			previousState = this.checkbox.state;
			this.checkbox.state = state;
		}
		this.updateChildrenState(state, previousState);
	},
	updateChildrenState: function (currentState, previousState) {
		switch (previousState) {
			case XClassSearchCheckbox.States.STATE_HARD_CHECKED:
			case XClassSearchCheckbox.States.STATE_SOFT_CHECKED:
			case XClassSearchCheckbox.States.STATE_HARD_UNCHECKED:
			case XClassSearchCheckbox.States.STATE_SOFT_UNCHECKED:
				this.setChildrenState(XClassSearchCheckbox.States.STATE_DEFAULT);
				break;
		}
		switch (currentState) {
			case XClassSearchCheckbox.States.STATE_HARD_CHECKED:
			case XClassSearchCheckbox.States.STATE_SOFT_CHECKED:
				this.setChildrenState(XClassSearchCheckbox.States.STATE_SOFT_CHECKED);
				break;
			case XClassSearchCheckbox.States.STATE_HARD_UNCHECKED:
			case XClassSearchCheckbox.States.STATE_SOFT_UNCHECKED:
				this.setChildrenState(XClassSearchCheckbox.States.STATE_SOFT_UNCHECKED);
				break;
		}
	},
	setChildrenState: function (state) {
		this.children.forEach(function (xClass) {
			xClass.setCheckboxState(state);
		});
	},
	toogleFilter: function () {
		this.isFiltered = !this.isFiltered;
		xClassSearchWrapper.updateColumnSelection();
	},
	isNameContains: function (searchText) {
		this.clearSearchData();
		let answer = false;
		const nameLower = this.name.toLowerCase();
		const searchIndex = nameLower.indexOf(searchText.toLowerCase());
		if (searchIndex > -1) {
			const searchLength = searchText.length;
			this.searchText = this.name.substring(
				searchIndex,
				searchIndex + searchLength
			);
			answer = true;
		}
		return answer;
	},
	clearSearchData: function () {
		this.searchText = '';
	},
	getFormatterData: function (isFilteredMode) {
		const filterFormater = {
			tag: 'label',
			className: 'filter' + (this.isFiltered ? ' apply-filter' : ''),
			children: [
				{
					tag: 'input',
					attrs: {
						type: 'checkbox',
						checked: this.isFiltered
					}
				},
				{
					tag: 'span'
				}
			]
		};
		const titleFormatter = {
			tag: 'div',
			className: 'checkbox-title'
		};
		if (this.searchText) {
			const indexStartFoundText = this.name.indexOf(this.searchText);
			const indexEndFoundText = indexStartFoundText + this.searchText.length;
			titleFormatter.children = [
				this.name.slice(0, indexStartFoundText),
				{
					tag: 'mark',
					children: [this.name.slice(indexStartFoundText, indexEndFoundText)]
				},
				this.name.slice(indexEndFoundText)
			];
		} else {
			titleFormatter.children = [this.name];
		}
		if (this.level > 1 && !isFilteredMode) {
			titleFormatter.children.unshift({
				tag: 'span',
				className: 'icon selected-value-img'
			});
			titleFormatter.style = { 'margin-left': 15 * (this.level - 1) + 'px' };
		}
		return {
			className: 'aras-grid-row-cell_boolean',
			children: [
				{
					tag: 'div',
					children: [filterFormater, titleFormatter]
				},
				this.checkbox.formatter
			]
		};
	}
};
