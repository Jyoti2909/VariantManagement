(function () {
	const pathToResource = '../Modules/aras.innovator.ExtendedClassification/';

	function XClassSearchCheckbox(state, xClassHaveChild) {
		this.state = state || XClassSearchCheckbox.States.STATE_DEFAULT;
		this.generateOrderStates(!!xClassHaveChild);
	}

	XClassSearchCheckbox.prototype = {
		generateOrderStates: function (xClassHaveChild, conditionIsAND) {
			if (xClassHaveChild && !!conditionIsAND) {
				this.orderStates = [
					XClassSearchCheckbox.States.STATE_CHECKED,
					XClassSearchCheckbox.States.STATE_HARD_CHECKED,
					XClassSearchCheckbox.States.STATE_UNCHECKED,
					XClassSearchCheckbox.States.STATE_HARD_UNCHECKED,
					XClassSearchCheckbox.States.STATE_DEFAULT
				];
			} else {
				this.orderStates = [
					XClassSearchCheckbox.States.STATE_CHECKED,
					XClassSearchCheckbox.States.STATE_UNCHECKED,
					XClassSearchCheckbox.States.STATE_DEFAULT
				];
				if (
					(!xClassHaveChild &&
						!!conditionIsAND &&
						(this.state === XClassSearchCheckbox.States.STATE_HARD_CHECKED ||
							this.state ===
								XClassSearchCheckbox.States.STATE_HARD_UNCHECKED)) ||
					(!conditionIsAND &&
						(this.state === XClassSearchCheckbox.States.STATE_SOFT_CHECKED ||
							this.state === XClassSearchCheckbox.States.STATE_SOFT_UNCHECKED ||
							this.state === XClassSearchCheckbox.States.STATE_HARD_CHECKED ||
							this.state === XClassSearchCheckbox.States.STATE_HARD_UNCHECKED))
				) {
					this.state = XClassSearchCheckbox.States.STATE_DEFAULT;
				}
			}
		},
		nextState: function () {
			let index = this.orderStates.indexOf(this.state);
			if (index === -1 || index === this.orderStates.length - 1) {
				index = 0;
			} else {
				index++;
			}
			this.state = this.orderStates[index];
		},
		get formatter() {
			return {
				tag: 'label',
				className: 'aras-form-boolean ' + this.state.class,
				children: [
					{
						tag: 'input',
						attrs: {
							type: 'checkbox',
							checked: this.state.value
						}
					},
					{
						tag: 'span'
					}
				]
			};
		}
	};

	XClassSearchCheckbox.States = {
		STATE_DEFAULT: new CheckboxState(
			true,
			'xClassSearchControl.checkbox_label.default',
			'mixed'
		),
		STATE_CHECKED: new CheckboxState(
			true,
			'xClassSearchControl.checkbox_label.checked',
			'checked',
			function (insertNode, id, itemTypeName, logicState) {
				let pathToInsertNode;
				const targetNodeXmlDoc = aras.createXMLDocument();
				if (logicState === XClassSearchCheckbox.LogicStates.AND) {
					pathToInsertNode = 'self::' + logicState.tagName + '/Relationships';
					targetNodeXmlDoc.loadXML(
						'<Item type="' +
							itemTypeName +
							'_xClass" action="get">' +
							'<related_id>' +
							id +
							'</related_id>' +
							'</Item>'
					);
				} else if (logicState === XClassSearchCheckbox.LogicStates.OR) {
					pathToInsertNode =
						'self::' +
						logicState.tagName +
						'/Relationships/' +
						'Item[@type="' +
						itemTypeName +
						'_xClass" and @action="get"]/OR';
					targetNodeXmlDoc.loadXML('<related_id>' + id + '</related_id>');
				}
				if (pathToInsertNode) {
					this.insertToNode(
						pathToInsertNode,
						targetNodeXmlDoc.documentElement,
						insertNode
					);
					return true;
				}
				return false;
			},
			function (logicState, itemTypeName, relItemTypeName) {
				const additionalPath = this.getMarkerCheckboxStateAdditionalPath(
					itemTypeName,
					relItemTypeName
				);
				if (logicState === XClassSearchCheckbox.LogicStates.AND) {
					return (
						'.' +
						additionalPath +
						'/Relationships/' +
						'Item[@type="' +
						itemTypeName +
						'_xClass" and @action="get"]/related_id'
					);
				}
				if (logicState === XClassSearchCheckbox.LogicStates.OR) {
					return (
						'.' +
						additionalPath +
						'/Relationships/' +
						'Item[@type="' +
						itemTypeName +
						'_xClass" and @action="get"]/OR/related_id'
					);
				}
			}
		),
		STATE_HARD_CHECKED: new CheckboxState(
			true,
			'xClassSearchControl.checkbox_label.hard_checked',
			'hard_checked',
			function (insertNode, id, itemTypeName, logicState) {
				const targetNodeXmlDoc = aras.createXMLDocument();
				const pathToInsertNode =
					'self::' + logicState.tagName + '/Relationships';
				targetNodeXmlDoc.loadXML(
					'<Item type="' +
						itemTypeName +
						'_xClass" action="get" select="related_id(id)">' +
						'<related_id>' +
						'<Item type="xClass" action="getXClassAndAllDescendants" select="id">' +
						'<id>' +
						id +
						'</id>' +
						'</Item>' +
						'</related_id>' +
						'</Item>'
				);
				this.insertToNode(
					pathToInsertNode,
					targetNodeXmlDoc.documentElement,
					insertNode
				);
				return true;
			},
			function (logicState, itemTypeName, relItemTypeName) {
				const additionalPath = this.getMarkerCheckboxStateAdditionalPath(
					itemTypeName,
					relItemTypeName
				);
				return (
					'.' +
					additionalPath +
					'/Relationships/' +
					'Item[@type="' +
					itemTypeName +
					'_xClass" and @action="get"]/related_id/Item[@type="xClass" and @action="getXClassAndAllDescendants"]/id'
				);
			}
		),
		STATE_SOFT_CHECKED: new CheckboxState(true, '', 'soft_checked'),
		STATE_UNCHECKED: new CheckboxState(
			false,
			'xClassSearchControl.checkbox_label.unchecked',
			'unchecked',
			function (insertNode, id, itemTypeName, logicState) {
				let pathToInsertNode;
				const targetNodeXmlDoc = aras.createXMLDocument();
				if (logicState === XClassSearchCheckbox.LogicStates.AND) {
					pathToInsertNode =
						'self::' + logicState.tagName + '/NOT/Relationships';
					targetNodeXmlDoc.loadXML(
						'<Item type="' +
							itemTypeName +
							'_xClass" action="get">' +
							'<related_id>' +
							id +
							'</related_id>' +
							'</Item>'
					);
				} else if (logicState === XClassSearchCheckbox.LogicStates.OR) {
					pathToInsertNode =
						'self::' +
						logicState.tagName +
						'/NOT/Relationships/' +
						'Item[@type="' +
						itemTypeName +
						'_xClass" and @action="get"]/OR';
					targetNodeXmlDoc.loadXML('<related_id>' + id + '</related_id>');
				}
				if (pathToInsertNode) {
					this.insertToNode(
						pathToInsertNode,
						targetNodeXmlDoc.documentElement,
						insertNode
					);
					return true;
				}
				return false;
			},
			function (logicState, itemTypeName, relItemTypeName) {
				const additionalPath = this.getMarkerCheckboxStateAdditionalPath(
					itemTypeName,
					relItemTypeName
				);
				if (logicState === XClassSearchCheckbox.LogicStates.AND) {
					return (
						'.' +
						additionalPath +
						'/NOT/Relationships/' +
						'Item[@type="' +
						itemTypeName +
						'_xClass" and @action="get"]/related_id'
					);
				}
				if (logicState === XClassSearchCheckbox.LogicStates.OR) {
					return (
						'.' +
						additionalPath +
						'/NOT/Relationships/' +
						'Item[@type="' +
						itemTypeName +
						'_xClass" and @action="get"]/OR/related_id'
					);
				}
			}
		),
		STATE_HARD_UNCHECKED: new CheckboxState(
			false,
			'xClassSearchControl.checkbox_label.hard_unchecked',
			'hard_unchecked',
			function (insertNode, id, itemTypeName, logicState) {
				const pathToInsertNode =
					'self::' +
					logicState.tagName +
					'/NOT/Relationships/Item[@type="' +
					itemTypeName +
					'_xClass" and @action="get" and @select="related_id(id)"]' +
					'/related_id/Item[@type="xClass" and @action="getXClassAndAllDescendants" and @select="id"]/OR';
				const targetNodeXmlDoc = aras.createXMLDocument();
				targetNodeXmlDoc.loadXML('<id>' + id + '</id>');
				this.insertToNode(
					pathToInsertNode,
					targetNodeXmlDoc.documentElement,
					insertNode
				);
				return true;
			},
			function (logicState, itemTypeName, relItemTypeName) {
				const additionalPath = this.getMarkerCheckboxStateAdditionalPath(
					itemTypeName,
					relItemTypeName
				);
				return (
					'.' +
					additionalPath +
					'/NOT/Relationships/Item[@type="' +
					itemTypeName +
					'_xClass" and @action="get" and @select="related_id(id)"]' +
					'/related_id/Item[@type="xClass" and @action="getXClassAndAllDescendants" and @select="id"]/OR/id'
				);
			}
		),
		STATE_SOFT_UNCHECKED: new CheckboxState(false, '', 'soft_unchecked'),
		getStateByClassName: function (value) {
			const checkbox = Object.keys(this).find(function (checkbox) {
				return this[checkbox].class === value;
			}, this);
			return this[checkbox];
		}
	};

	Object.defineProperty(XClassSearchCheckbox.States, 'getStateByClassName', {
		enumerable: false
	});

	XClassSearchCheckbox.LogicStates = {
		AND: {
			class: 'condition-and',
			tagName: 'AND'
		},
		OR: {
			class: 'condition-or',
			tagName: 'OR'
		}
	};

	window.XClassSearchCheckbox = XClassSearchCheckbox;
})();
