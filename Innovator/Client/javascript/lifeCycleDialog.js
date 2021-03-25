function initializeLifeCycleDialogFunctions(container) {
	container.onload_handler = function () {
		var lcXML = "<Process nodeSize='25' nodeBGColor='#FFFFFF'>";
		lcXML += "<Menu default='no'/>";

		const lcMap = container.tryGetLifeCycleMap();

		if (!lcMap) {
			aras.AlertError(
				aras.getResource(
					'',
					'lifecycledialog.no_lc',
					aras.getKeyedNameEx(item)
				),
				'',
				'',
				window
			);
			container.closeWindow();
			return;
		}

		var states = lcMap.selectNodes(
			"Relationships/Item[@type='Life Cycle State']"
		);
		for (let i = 0; i < states.length; i++) {
			var lcState = states[i],
				lcStateID = lcState.getAttribute('id'),
				imgSrc = aras.getItemProperty(lcState, 'image'),
				stateName = aras.getItemProperty(lcState, 'label');
			if (!stateName) {
				stateName = aras.getItemProperty(lcState, 'name');
			}
			lcXML +=
				imgSrc != ''
					? "<img id='img" + lcStateID + "' src='" + imgSrc + "' />"
					: '';
			lcXML +=
				"<Node id='" +
				lcStateID +
				"' name='" +
				aras.escapeXMLAttribute(stateName) +
				"' x='" +
				aras.getItemProperty(lcState, 'x') +
				(imgSrc != '' ? "' img='img" + lcStateID : '') +
				"' y='" +
				aras.getItemProperty(lcState, 'y') +
				"' " +
				(current_state == lcStateID ? "isCurrentState='1' " : '') +
				'/>';
		}

		var trans = lcMap.selectNodes(
			"Relationships/Item[@type='Life Cycle Transition']"
		);
		for (let i = 0; i < trans.length; i++) {
			var tran = trans[i],
				tranID = tran.getAttribute('id');
			if (tran.getAttribute('action') == 'delete') {
				continue;
			}
			var tranName = aras.getItemProperty(tran, 'role'),
				a = aras.getItemById('Identity', tranName, 0);
			tranName = aras.getKeyedName(tranName);
			var nameX = aras.getItemProperty(tran, 'x'),
				nameY = aras.getItemProperty(tran, 'y'),
				segments = aras.getItemProperty(tran, 'segments');
			lcXML +=
				"<Transition sourceNode='" +
				aras.getItemProperty(tran, 'from_state') +
				"' destinationNode='" +
				aras.getItemProperty(tran, 'to_state') +
				"' id='" +
				tranID +
				"' name='" +
				aras.escapeXMLAttribute(tranName) +
				"' nameX='" +
				nameX +
				"' nameY='" +
				nameY +
				"' >";
			if (segments != '') {
				segments = segments.split('|');
				for (var j = 0; j < segments.length; j++) {
					var segment = segments[j].split(',');
					lcXML += "<Segment x='" + segment[0] + "' y='" + segment[1] + "'/>";
				}
			}
			lcXML += '</Transition>';
		}
		lcXML += '</Process>';

		workflowApplet.load(lcXML);
		if (!disabledPromotion) {
			container.loadToolbar();
			container.initToolbar();
		}
		container.onresize_handler();
	};

	container.loadPromoteDialogJS = function () {
		const head = document.getElementsByTagName('head')[0];
		const scriptNode = document.createElement('script');
		scriptNode.type = 'text/javascript';
		scriptNode.src = '../javascript/promoteDialog.js';
		head.appendChild(scriptNode);
	};

	container.tryGetLifeCycleMap = function () {
		if (dialogArguments.lifeCycleMapId) {
			return container.getLifeCycleMapById(dialogArguments.lifeCycleMapId);
		}

		if (!current_state) {
			var itemType = aras.getItemTypeDictionary(
				item.getAttribute('type'),
				'name'
			);
			if (!itemType) {
				return;
			}
			return container.getDefaultLifeCycleMapForItemType(itemType);
		}
		return container.getLifeCycleMapByCurrentState(current_state);
	};

	container.getDefaultLifeCycleMapForItemType = function (itemType) {
		var default_lifecycle = itemType.getProperty('default_lifecycle');
		return container.getLifeCycleMapById(default_lifecycle);
	};

	container.getLifeCycleMapByCurrentState = function () {
		const lcState = aras.getItemById(
			'Life Cycle State',
			current_state,
			0,
			'',
			'source_id'
		);
		const lifeCycleMapId = aras.getItemProperty(lcState, 'source_id');
		return container.getLifeCycleMapById(lifeCycleMapId);
	};

	container.getLifeCycleMapById = function (lifeCycleMapId) {
		if (lifeCycleMapId) {
			return aras.getItemById('Life Cycle Map', lifeCycleMapId, 1);
		}
	};

	container.initPromoteChoice = function () {
		if (
			aras.isTempID(itemID) ||
			isFunctionDisabled(item.getAttribute('type'), 'Promote')
		) {
			return false;
		}

		const nextStates = aras.getItemNextStates(itemTypeName, itemID);
		const transitions = nextStates
			? nextStates.selectNodes('//Item[@type="Life Cycle Transition"]')
			: [];
		if (transitions.length === 0) {
			return false;
		}

		const statesComboBox = toolbar.getActiveToolbar().getItem('promote_choice');
		let result = false;

		transitions.forEach((transitionNode, index) => {
			const toStateItem = transitionNode.selectSingleNode('to_state/Item');
			if (!toStateItem) {
				return;
			}
			const stateName = aras.getItemProperty(toStateItem, 'name');
			if (!stateName) {
				return;
			}

			const stateLabel = aras.getItemProperty(toStateItem, 'label');
			getComments[statesComboBox.getItemCount()] =
				aras.getItemProperty(transitionNode, 'get_comment') === '1';
			statesComboBox.Add(stateName, stateLabel || stateName);
			if (index === 0 && !statesComboBox.GetSelectedItem()) {
				statesComboBox.SetSelected(stateName);
			}
			result = true;
		});

		return result;
	};

	container.initToolbar = function () {
		const res = container.initPromoteChoice();
		if (!res) {
			toolbar.getItem('promote').setEnabled(false);
			toolbar.getItem('promote_choice').setEnabled(false);
		}
		toolbar._toolbar.on('click', function (itemId) {
			const item = toolbar.getItem(itemId);
			if (!item || !item.getEnabled()) {
				return;
			}
			container.onToolbarButtonClick(item);
		});
	};

	container.onToolbarButtonClick = function (btn) {
		btn.setEnabled(false);
		if (btn.getId() == 'promote') {
			container.promote();
			return;
		}
		btn.setEnabled(true);
	};

	container.promote = function () {
		var statesComboBox = toolbar.getActiveToolbar().getItem('promote_choice'),
			stateName = statesComboBox.getSelectedItem(),
			rowInd = statesComboBox.getSelectedIndex();
		if (getComments[rowInd]) {
			aras
				.prompt(
					aras.getResource('', 'lifecycledialog.please_enter_comments'),
					''
				)
				.then(function (comments) {
					promoteWithComments(stateName, comments);
				});
		} else {
			promoteWithComments(stateName, '');
		}
	};

	container.closeWindow = function (value) {
		if (dialogArguments.dialog) {
			dialogArguments.dialog.close(value);
		} else {
			window.returnValue = value;
			window.close();
		}
	};

	container.loadToolbar = function () {
		toolbar.loadXml(aras.getI18NXMLResource('lcDialog_toolbar.xml'));
		toolbar.show();
	};

	container.onresize_handler = function () {
		workflowApplet._resizeCanvas();
	};
}
