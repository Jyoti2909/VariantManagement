function initializeLifeCycleEditor(container) {
	container.workflowApplet = null;
	container.lastSelectedActivityID = '';
	container.lastSelectedTransID = '';
	container.lastSelectedActivityNd = null;
	container.lastSelectedTransNd = null;
	container.selectedNodeID = '';
	container.selectedNode = null;

	container.contextMenu = [
		{
			id: 'Add State',
			name: aras.getResource('', 'lc.cntxt_menu.add_state'),
			onClick: function (args) {
				const newLState = aras.newRelationship(
					parent.lcstate_id_const,
					parent.item,
					false
				);
				if (!newLState) return false;

				aras.setNodeElement(
					newLState,
					'name',
					aras.getResource('', 'lc.new_state.new_state')
				);
				aras.setNodeElement(newLState, 'image', '../images/LifeCycleState.svg');
				aras.setNodeElement(
					newLState,
					'x',
					container.float2Int(args.location.x)
				);
				aras.setNodeElement(
					newLState,
					'y',
					container.float2Int(args.location.y)
				);

				const id = newLState.getAttribute('id');
				container.workflowApplet.nodes.add({
					uniqueId: id,
					label: aras.getResource('', 'lc.new_state.new_state'),
					x: container.float2Int(args.location.x),
					y: container.float2Int(args.location.y),
					img: '../images/LifeCycleState.svg'
				});
				container.workflowApplet.nodes.select(id, true);
				container.onClick(id);
			}
		},
		{
			id: 'Remove State',
			name: aras.getResource('', 'lc.cntxt_menu.remove_state'),
			onClick: function (args) {
				const links = container.workflowApplet.nodes.get(args.id, 'link');
				const startId = aras.getNodeElement(parent.item, 'start_state');
				const stateNd = parent.item.selectSingleNode(
					'Relationships/Item[@id="' + args.id + '"]'
				);

				if (links.length || startId === args.id) {
					aras.AlertError(
						aras.getResource(
							'',
							links.length
								? 'lc.remove_dependent_transitions'
								: 'lc.cant_remove_start'
						)
					);
					return;
				} else if (!stateNd) {
					return;
				}

				if (stateNd.getAttribute('isTemp') == '1') {
					stateNd.parentNode.removeChild(stateNd);
				} else {
					stateNd.setAttribute('action', 'delete');
					aras.setItemProperty(stateNd, 'isDirty', '0');
				}

				container.workflowApplet.nodes.remove(args.id);
				if (args.id == container.lastSelectedActivityID) {
					container.lastSelectedActivityID = '';
					container.lastSelectedActivityNd = null;
				}

				if (args.id == container.selectedNodeID) {
					container.selectedNodeID = '';
					container.selectedNode = null;
				}
				container.moveTransitionsToTop(parent.item);
				container.workflowApplet.nodes.select(startId, true);
				container.onClick(startId);
			}
		},
		{
			id: 'Add Transition',
			name: aras.getResource('', 'lc.cntxt_menu.add_transition'),
			onClick: function (args) {
				container.workflowApplet.transitions.startAdd(args.id);
			}
		},
		{
			id: 'Set as Start state',
			name: aras.getResource('', 'lc.cntxt_menu.set_start_state'),
			onClick: function (args) {
				if (
					container.workflowApplet.nodes.get(args.id, 'link', false, true)
						.length
				) {
					aras.AlertError(
						aras.getResource('', 'lc.cant_set_start_remove_transitions')
					);
					return;
				}

				const startNodeID = aras.getNodeElement(parent.item, 'start_state');
				if (startNodeID) {
					container.workflowApplet.nodes.set(startNodeID, 'state', '');
				}

				container.workflowApplet.nodes.set(args.id, 'state', 'start');
				aras.setNodeElement(parent.item, 'start_state', args.id);
			}
		},
		{
			id: 'Remove Transition',
			name: aras.getResource('', 'lc.cntxt_menu.remove_transition'),
			onClick: function (args) {
				const transitionID = args.id;
				const tranNd = parent.item.selectSingleNode(
					'Relationships/Item[@id="' + transitionID + '"]'
				);
				if (tranNd.getAttribute('isTemp') === '1') {
					tranNd.parentNode.removeChild(tranNd);
				} else {
					tranNd.setAttribute('action', 'delete');
					aras.setItemProperty(tranNd, 'isDirty', '0');
					container.moveTransitionsToTop(parent.item);
				}
				if (!aras.isTempEx(parent.item))
					parent.item.setAttribute('isDirty', '1');

				container.workflowApplet.transitions.remove(transitionID);
				if (transitionID === container.lastSelectedTransID) {
					container.lastSelectedTransID = '';
					container.lastSelectedTransNd = null;
				}

				if (transitionID === container.selectedNodeID) {
					container.selectedNodeID = '';
					container.selectedNode = null;
					if (parent.currTabID === parent.lctransition_id_const) {
						parent.showItemForm();
					}
				}
			}
		},
		{
			id: 'Insert State',
			name: aras.getResource('', 'lc.cntxt_menu.insert_state'),
			onClick: function (args) {
				const tr = parent.item.selectSingleNode(
					'Relationships/Item[@id="' + args.id + '"]'
				);
				const destNode = container.workflowApplet.transitions.get(
					args.id,
					'destination'
				);

				const newLState = aras.newRelationship(
					parent.lcstate_id_const,
					parent.item,
					false
				);
				if (!newLState) return;
				const newLStateID = newLState.getAttribute('id');

				aras.setNodeElement(
					newLState,
					'name',
					aras.getResource('', 'lc.new_state.new_state')
				);
				aras.setNodeElement(newLState, 'image', '../images/LifeCycleState.svg');
				aras.setNodeElement(
					newLState,
					'x',
					container.float2Int(args.location.x)
				);
				aras.setNodeElement(
					newLState,
					'y',
					container.float2Int(args.location.y)
				);
				aras.setNodeElement(tr, 'to_state', newLStateID);

				if (tr.getAttribute('action') !== 'add') {
					tr.setAttribute('action', 'update');
				}

				container.workflowApplet.nodes.add({
					uniqueId: newLStateID,
					label: aras.getResource('', 'lc.new_state.new_state'),
					x: container.float2Int(args.location.x),
					y: container.float2Int(args.location.y),
					img: '../images/LifeCycleState.svg'
				});
				container.workflowApplet.transitions.set(
					args.id,
					'destination',
					newLStateID
				);

				const newTran = aras.newRelationship(
					parent.lctransition_id_const,
					parent.item,
					false
				);
				if (!newTran) return;

				aras.setNodeElement(newTran, 'from_state', newLStateID);
				aras.setNodeElement(newTran, 'to_state', destNode);

				container.workflowApplet.transitions.add({
					uniqueId: newTran.getAttribute('id'),
					source: newLStateID,
					destination: destNode
				});

				container.workflowApplet.nodes.select(newLStateID, true);
				container.onClick(newLStateID);
			}
		},
		{ separator: true },
		{
			id: 'Add Break',
			name: aras.getResource('', 'common.cntxt_menu.add_break'),
			onClick: function (args) {
				container.handleBreak('add', args.id, args.location.x, args.location.y);
			}
		},
		{
			id: 'Remove Break',
			name: aras.getResource('', 'common.cntxt_menu.remove_break'),
			onClick: function (args) {
				container.handleBreak(
					'remove',
					args.id,
					args.location.x,
					args.location.y
				);
			}
		}
	];

	container.workflowControlLoaded = function (control) {
		container.workflowApplet = control;
		container.clientControlsFactory.on(container.workflowApplet, {
			onClick: container.onClick,
			onMenuInit: container.onMenuShow,
			onDrop: container.onDrop
		});
		container.clientControlsFactory.on(container.workflowApplet.transitions, {
			endAdd: container.addNewTransition
		});
		container.workflowApplet.contextMenu.addRange(container.contextMenu);
		container.populateWorkflow();
	};

	container.float2Int = function (floatValue) {
		return floatValue | 0;
	};

	container.populateWorkflow = function () {
		if (!parent.tabsFReady) {
			setTimeout(container.populateWorkflow, 100);
			return;
		}

		let lcXML = '<Process nodeSize="25" nodeBGColor="#FFFFFF">';
		lcXML += '<Menu default="yes"/>';

		const lcNode = parent.item;
		const states = lcNode.selectNodes(
			'Relationships/Item[@type="Life Cycle State" and (not(@action) or (@action!="delete" and @action!="purge"))]'
		);
		const startStateID = aras.getNodeElement(lcNode, 'start_state');

		// if no one activity was selected before then save "start|first" activity as lastSelected,
		// else refresh lastSelectedActivityNd
		if (!container.lastSelectedActivityNd) {
			if (startStateID) {
				container.lastSelectedActivityNd = lcNode.selectSingleNode(
					'Relationships/Item[@type="Life Cycle State" and @id="' +
						startStateID +
						'"]'
				);
			}
			if (!container.lastSelectedActivityNd) {
				container.lastSelectedActivityNd = states[0];
			}

			container.lastSelectedActivityID = container.lastSelectedActivityNd.getAttribute(
				'id'
			);
		} else {
			container.lastSelectedActivityNd = lcNode.selectSingleNode(
				'Relationships/Item[@type="Life Cycle State" and @id="' +
					container.lastSelectedActivityID +
					'"]'
			);
		}

		const tmpDom = aras.createXMLDocument();
		let lcStateImg;
		let lcStateID;
		for (let i = 0; i < states.length; i++) {
			const lcState = states[i];
			lcStateID = lcState.getAttribute('id');

			lcStateImg = aras.getNodeElement(lcState, 'image');
			if (lcStateImg) {
				lcXML += '<img id="img' + lcStateID + '" src="' + lcStateImg + '" />';
			}

			const tmpNd = tmpDom.createElement('Node');
			tmpNd.setAttribute('id', lcStateID);

			let stateName = aras.getItemProperty(lcState, 'label');
			if (!stateName) {
				stateName = aras.getItemProperty(lcState, 'name');
			}

			tmpNd.setAttribute('name', stateName);
			tmpNd.setAttribute('x', aras.getItemProperty(lcState, 'x') || '20');
			tmpNd.setAttribute('y', aras.getItemProperty(lcState, 'y') || '20');

			if (lcStateImg != '') {
				tmpNd.setAttribute('img', 'img' + lcStateID);
			}
			if (startStateID == lcStateID) {
				tmpNd.setAttribute('label2', 'start');
			}
			lcXML += tmpNd.xml;
		}

		const trans = lcNode.selectNodes(
			'Relationships/Item[@type="Life Cycle Transition" and (not(@action) or (@action!="delete" and @action!="purge"))]'
		);
		if (trans.length > 0 && !container.lastSelectedTransNd) {
			if (startStateID) {
				container.lastSelectedTransNd = lcNode.selectSingleNode(
					'Relationships/Item[@type="Life Cycle Transition" and from_state="' +
						startStateID +
						'"]'
				);
			}

			if (!container.lastSelectedTransNd) {
				container.lastSelectedTransNd = trans[0];
			}
			container.lastSelectedTransID = container.lastSelectedTransNd.getAttribute(
				'id'
			);
		} else {
			container.lastSelectedTransNd = parent.item.selectSingleNode(
				'Relationships/Item[@type="Life Cycle Transition" and @id="' +
					container.lastSelectedTransID +
					'"]'
			);
		}

		let tranID;
		let tranName;
		let nameX;
		let nameY;
		let segments;
		for (let i = 0; i < trans.length; i++) {
			const tran = trans[i];
			tranID = tran.getAttribute('id');
			tranName = tran.selectSingleNode('role') || '';
			if (tranName) {
				tranName = aras.preserveTags(tranName.getAttribute('keyed_name')) || '';
			}

			nameX = aras.getNodeElement(tran, 'x');
			nameY = aras.getNodeElement(tran, 'y');
			segments = aras.getNodeElement(tran, 'segments');
			lcXML +=
				'<Transition sourceNode="' +
				aras.getNodeElement(tran, 'from_state') +
				'" destinationNode="' +
				aras.getNodeElement(tran, 'to_state') +
				'" id="' +
				tranID +
				'" name="' +
				tranName +
				'" nameX="' +
				nameX +
				'" nameY="' +
				nameY +
				'" >';

			if (segments) {
				segments = segments.split('|');
				for (let j = 0; j < segments.length; j += 1) {
					const segment = segments[j].split(',');
					lcXML += '<Segment x="' + segment[0] + '" y="' + segment[1] + '"/>';
				}
			}

			lcXML += '</Transition>';
		}
		lcXML += '</Process>';

		const rels = lcNode.selectSingleNode('Relationships');
		if (!rels) {
			lcNode.appendChild(lcNode.ownerDocument.createElement('Relationships'));
		}

		// if nothing wasn't selected before populateWorkflow then select "start" state,
		// else just refresh selectedNode
		if (!container.selectedNode) {
			container.selectedNode = container.lastSelectedActivityNd;
			container.selectedNodeID = container.lastSelectedActivityID;
		} else if (
			container.lastSelectedActivityID &&
			!container.lastSelectedActivityNd &&
			startStateID
		) {
			container.selectedNodeID = startStateID;
		} else {
			container.selectedNode =
				container.selectedNodeID == container.lastSelectedActivityID
					? container.lastSelectedActivityNd
					: container.lastSelectedTransNd;
		}

		container.workflowApplet.load(lcXML);
		container.showLifeCycleMap();
	};

	container.onMenuShow = function (id, location, isBreak) {
		container.workflowApplet.set('showMenu', parent.isEditMode);
		if (!parent.isEditMode) {
			return false;
		}

		const menu = container.workflowApplet.contextMenu;
		const isNode = !container.workflowApplet.nodes.is(id);
		const isTr = !container.workflowApplet.transitions.is(id);

		menu.setHide('Add State', !(isNode && isTr));
		menu.setHide('Remove State', isNode);
		menu.setHide('Add Transition', isNode);
		menu.setHide('Set as Start state', isNode);
		menu.setHide('Remove Transition', isTr);
		menu.setHide('Insert State', isTr);
		menu.setHide('Add Break', isTr);
		menu.setHide('Remove Break', !isBreak);

		container.onClick(id);
	};

	container.handleActivityChange = function (propNm, propVal, activityID) {
		const lyfeCycleNode = parent.item;
		if (lyfeCycleNode.getAttribute('isDirty') != '1') {
			lyfeCycleNode.setAttribute('isDirty', '1');
			if (lyfeCycleNode.getAttribute('action') != 'add') {
				lyfeCycleNode.setAttribute('action', 'update');
			}
		}

		if (propNm === 'name') {
			container.workflowApplet.nodes.set(
				container.lastSelectedActivityID,
				'label',
				propVal
			);
		} else if (propNm === 'image') {
			container.workflowApplet.nodes.set(
				container.lastSelectedActivityID,
				'img',
				propVal
			);
		}

		if (parent.updateItemsGrid) {
			parent.updateItemsGrid(lyfeCycleNode);
		}
	};

	container.handlePathChange = function (propNm, propVal, pathID) {
		const lyfeCycleNode = parent.item;
		if (lyfeCycleNode.getAttribute('isDirty') != '1') {
			lyfeCycleNode.setAttribute('isDirty', '1');

			if (lyfeCycleNode.getAttribute('action') != 'add') {
				lyfeCycleNode.setAttribute('action', 'update');
			}
		}

		if (propNm === 'role') {
			const label = propVal.xml
				? aras.getKeyedNameEx(propVal)
				: aras.getKeyedName(propVal);
			container.workflowApplet.transitions.set(
				container.lastSelectedTransID,
				'label',
				label
			);
		}

		if (parent.updateItemsGrid) {
			parent.updateItemsGrid(lyfeCycleNode);
		}
	};

	container.addNewTransition = function (tr) {
		const newPath = aras.newRelationship(
			parent.lctransition_id_const,
			parent.item,
			false
		);
		if (!newPath) {
			return;
		}

		aras.setNodeElement(newPath, 'from_state', tr.source);
		aras.setNodeElement(newPath, 'to_state', tr.destination);

		tr.uniqueId = newPath.getAttribute('id');
		tr.label = '';
		container.workflowApplet.transitions.add(tr);
		container.workflowApplet.transitions.select(tr.uniqueId, true);
		container.onClick(tr.uniqueId);
	};

	container.showLifeCycleMap = function () {
		if (
			parent.currTabID == parent.lctransition_id_const &&
			container.lastSelectedTransNd
		) {
			container.showTransition(container.selectedNodeID, null, true);
			container.workflowApplet.transitions.select(
				container.selectedNodeID,
				true
			);
		} else {
			container.showActivity(container.selectedNodeID, true);
			container.workflowApplet.nodes.select(container.selectedNodeID, true);
		}
	};

	container.showActivity = function (id, forceRefresh) {
		const isActivityTab = parent.currTabID === parent.lcstate_id_const;
		if (!forceRefresh && container.selectedNodeID == id && isActivityTab)
			return;

		container.selectedNodeID = id;
		container.selectedNode = parent.item.selectSingleNode(
			'Relationships/Item[@type="Life Cycle State" and @id="' +
				container.selectedNodeID +
				'"]'
		);

		if (container.selectedNode) {
			container.lastSelectedActivityID = container.selectedNodeID;
			container.lastSelectedActivityNd = container.selectedNode;

			parent.showItemForm(
				'Life Cycle State',
				parent.isEditMode ? 'edit' : 'view',
				container.selectedNode,
				null,
				container.handleActivityChange
			);
		} else {
			parent.showItemForm();
		}

		if (!isActivityTab) {
			parent.performOnTabAction = false;
			parent.tabbar.selectTab(parent.lcstate_id_const);
		}
	};

	container.showTransition = function (id, event, forceRefresh) {
		if (parent.isEditMode && event && event.ctrlKey) {
			const parentElement = container.workflowApplet._values.surface._parent;
			container.handleBreak(
				'add',
				id,
				event.clientX + parentElement.scrollLeft,
				event.clientY + parentElement.scrollTop
			);
		}

		const isTransitionTab = parent.currTabID === parent.lctransition_id_const;
		if (!forceRefresh && container.selectedNodeID == id && isTransitionTab) {
			return;
		}

		container.selectedNodeID = id;
		container.selectedNode = parent.item.selectSingleNode(
			'Relationships/Item[@type="Life Cycle Transition" and @id="' +
				container.selectedNodeID +
				'"]'
		);

		if (container.selectedNode) {
			container.lastSelectedTransID = container.selectedNodeID;
			container.lastSelectedTransNd = container.selectedNode;

			parent.showItemForm(
				'Life Cycle Transition',
				parent.isEditMode ? 'edit' : 'view',
				container.selectedNode,
				null,
				container.handlePathChange
			);
		} else {
			parent.showItemForm();
		}

		if (!isTransitionTab) {
			parent.performOnTabAction = false;
			parent.tabbar.selectTab(parent.lctransition_id_const);
		}
	};

	container.onClick = function (id, event) {
		container.blurPropertiesFrame();
		if (container.workflowApplet.nodes.is(id)) {
			container.showActivity(id);
		} else if (container.workflowApplet.transitions.is(id)) {
			container.showTransition(id, event);
		}
	};

	container.handleBreak = function (action, tranID, pX, pY) {
		container.workflowApplet.transitions[action + 'Break'](tranID, pX, pY);
		const segments = container.workflowApplet.transitions.get(
			tranID,
			'segments'
		);
		const curNode = parent.item.selectSingleNode(
			'Relationships/Item[@type="Life Cycle Transition" and @id="' +
				tranID +
				'"]'
		);
		let res = segments.length
			? container.float2Int(segments[0].x) +
			  ',' +
			  container.float2Int(segments[0].y)
			: '';
		for (let i = 1, l = segments.length; i < l; i++) {
			res +=
				'|' +
				container.float2Int(segments[i].x) +
				',' +
				container.float2Int(segments[i].y);
		}
		aras.setNodeElementWithAction(curNode, 'segments', res);
	};

	// It is needed to allow the transition items to be deleted before the state items
	container.moveTransitionsToTop = function (currLCNode) {
		const relNode = currLCNode.selectSingleNode('Relationships');
		const refNode = currLCNode.selectSingleNode(
			'Relationships/Item[not(@type) or @type!="Life Cycle Transition"]'
		);
		if (!refNode) {
			return;
		}

		const lctNodes = currLCNode.selectNodes(
			'Relationships/Item[@type="Life Cycle Transition"]'
		);
		for (let i = 0; i < lctNodes.length; i++) {
			relNode.insertBefore(relNode.removeChild(lctNodes[i]), refNode);
		}
	};

	container.blurPropertiesFrame = function () {
		const visibleForm = parent.getVisibleItemForm();
		if (visibleForm && visibleForm.formContentLoaded) {
			const activeField = visibleForm.contentDocument.activeElement;
			if (
				activeField &&
				['input', 'select', 'textarea'].indexOf(
					activeField.tagName.toLowerCase()
				) > -1
			) {
				activeField.blur();
			}
		}
	};

	container.onDrop = function (id) {
		const isNode = container.workflowApplet.nodes.is(id);
		// if user has dropped not current selectedNode, then selectedNode will be changed to node with "id"
		if (container.selectedNodeID != id) {
			container.blurPropertiesFrame();
			isNode ? container.showActivity(id) : container.showTransition(id);
		}

		if (container.selectedNode) {
			if (parent.isEditMode) {
				if (container.selectedNode.getAttribute('action') != 'add') {
					container.selectedNode.setAttribute('action', 'update');
				}

				let point;
				if (isNode) {
					point = container.workflowApplet.nodes.get(id, 'XY');
				} else {
					point = container.workflowApplet.transitions.get(id, 'labelXY');
					const segments = container.workflowApplet.transitions.get(
						id,
						'segments'
					);
					let res = segments.length
						? container.float2Int(segments[0].x) +
						  ',' +
						  container.float2Int(segments[0].y)
						: '';

					for (let i = 1, l = segments.length; i < l; i++) {
						res +=
							'|' +
							container.float2Int(segments[i].x) +
							',' +
							container.float2Int(segments[i].y);
					}
					aras.setNodeElementWithAction(
						container.selectedNode,
						'segments',
						res
					);
				}
				aras.setNodeElementWithAction(
					container.selectedNode,
					'x',
					container.float2Int(point.x)
				);
				aras.setNodeElementWithAction(
					container.selectedNode,
					'y',
					container.float2Int(point.y)
				);
			}
		}
	};

	container.resizeHandler = function () {
		if (parent.tabsFReady) {
			container.workflowApplet._resizeCanvas();
		}
	};
}
