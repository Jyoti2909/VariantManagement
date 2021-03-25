var joinEditor, whereUseEditor;
var mainFrameArguments = null;

function initEditor(editorContainerId) {
	var editorContainerNode = document.getElementById(editorContainerId);
	var toolbarNode = editorContainerNode.querySelector('.toolbar');

	var editorApi = {};

	(function (arr) {
		arr.forEach(function (item) {
			item.remove =
				item.remove ||
				function () {
					this.parentNode.removeChild(this);
				};
		});
	})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);
	var frameArguments = null;
	var conditionsDataSource;
	var titleText;
	var currentlySelectedItem;
	var filterXml;
	var cacheText;
	var caret;
	var operations = [];
	var toolbar;
	var closePopupCallback;
	var conditionEditor;
	var availableOperations = [
		{ label: '<', value: 'lt' },
		{ label: '<=', value: 'le' },
		{ label: '=', value: 'eq' },
		{ label: '>', value: 'gt' },
		{ label: '>=', value: 'ge' },
		{ label: '!=', value: 'ne' },
		{ label: 'like', value: 'like' },
		{ label: 'is null', value: 'null' }
	];

	//queryReference variables
	var intelliSenseItems;

	var dijitMemory;
	var dijitComboBox;

	editorApi.start = function (args) {
		// fill form with args
		this.init(args);
		switch (frameArguments.evType) {
			case 'clickJoin': {
				editQueryReferenceConditions();
				break;
			}
			case 'hoverJoin': {
				showLabelConditions();
				break;
			}
			case 'clickWhereUse': {
				editConditions();
				break;
			}
			case 'hoverWhereUse': {
				showConditions();
				break;
			}
		}
	};

	editorApi.init = function (args) {
		frameArguments = args;
		window.aras = args.aras;
		closePopupCallback = args.close;
		conditionsDataSource = [];

		if (args.intelliSenseItems) {
			intelliSenseItems = args.intelliSenseItems;
			if (frameArguments.mode === 'editQueryReferenceConditions') {
				filterXml = aras.getItemProperty(
					frameArguments.queryReferenceItem,
					'filter_xml'
				);
				conditionsDataSource = args.intelliSenseItems.elements;
				return;
			}
			conditionsDataSource = intelliSenseItems.properties.concat(
				intelliSenseItems.aggregateConditions
			);
		}
		filterXml = aras.getItemProperty(
			frameArguments.currentElement.node,
			'filter_xml'
		);
	};

	editorApi.getResult = function () {
		if (frameArguments.mode === 'editQueryReferenceConditions') {
			return {
				newXml: getCurrentConditonXml(),
				queryReferenceItem: frameArguments.queryReferenceItem
			};
		} else {
			return getCurrentConditonXml();
		}
	};

	editorApi.setTitle = function (title) {
		editorContainerNode.querySelector('.title').textContent = title;
	};

	editorApi.setSaveButtonStatus = function () {
		if (conditionEditor) {
			setSaveButtonDisable(conditionEditor);
		}
	};

	function showConditions() {
		require(['QB/Scripts/ConditionsTree'], function (ConditionsTree) {
			var conditionsTree = new ConditionsTree();
			var showConditionsEl = editorContainerNode.querySelector(
				'.showConditions'
			);
			var conditionDom;
			if (filterXml) {
				conditionDom = new XmlDocument();
				conditionDom.loadXML(filterXml.replace(/\r?\n|\r|\t/g, ''));
			}
			conditionsTree.fromXml(conditionDom, conditionsDataSource);
			renderer.makePreview(
				showConditionsEl.querySelector('.content'),
				conditionsTree
			);
			showConditionsEl.style.display = 'block';
		});
	}

	function showLabelConditions() {
		var treeItem = frameArguments.currentElement;
		if (treeItem.id === 'root') {
			return null;
		}

		require(['QB/Scripts/ConditionsTree'], function (ConditionsTree) {
			var queryDefinitionItem = treeItem.node.selectSingleNode(
				'ancestor::Item[@type="qry_QueryDefinition"]'
			);
			var parentElement = frameArguments.tree.getTreeElementById(
				treeItem.parentId
			);
			var qrXPath =
				"Relationships/Item[@type='qry_QueryReference' and (ref_id='" +
				treeItem.referenceRefId +
				"')]";
			var queryReferenceItem = queryDefinitionItem.selectSingleNode(qrXPath);
			var filterXml = aras.getItemProperty(queryReferenceItem, 'filter_xml');
			var conditionDom = new XmlDocument();
			conditionDom.loadXML(filterXml.replace(/\r?\n|\r|\t/g, ''));
			var conditionsTree = new ConditionsTree();
			conditionsTree.fromXml(conditionDom, [
				parentElement._element,
				treeItem._element
			]);
			var showConditionsEl = editorContainerNode.querySelector(
				'.showConditions'
			);
			renderer.makePreview(
				showConditionsEl.querySelector('.content'),
				conditionsTree
			);
			showConditionsEl.style.display = 'block';
		});
	}

	function setSaveButtonDisable(aceEditor) {
		var saveButton = document.getElementById('buttonSave');
		aceEditor.getValidationStatus().then(function (isValid) {
			saveButton.disabled = !isValid;
		});
	}

	function getQueryReferencePathAutocompleteOptions(queryReferencePathArray) {
		var result = [];
		var queryDefinitionItem = frameArguments.currentElement.node.selectSingleNode(
			'ancestor::Item[@type="qry_QueryDefinition"]'
		);
		for (var i = 0; i < queryReferencePathArray.length; i++) {
			var pathItem = queryReferencePathArray[i];
			var lastReference = pathItem[pathItem.length - 1];
			var lastReferenceParentAliasNode = queryDefinitionItem.selectSingleNode(
				"Relationships/Item[@type='qry_QueryItem' and not(@action='delete')" +
					" and ref_id = ../Item[@type='qry_QueryReference' and not(@action='delete') and ref_id='" +
					lastReference +
					"'" +
					']/parent_ref_id]/alias'
			);
			var label = aras.getResource(
				'../Modules/aras.innovator.QueryBuilder/',
				'condition_editor.reference_id_from',
				lastReferenceParentAliasNode.text,
				lastReference
			);
			result.push({
				label: label,
				value: "'" + lastReference + "'",
				filterableValue: label
			});
			var referencePath = pathItem.join('/');
			label = aras.getResource(
				'../Modules/aras.innovator.QueryBuilder/',
				'condition_editor.reference_path_from',
				lastReferenceParentAliasNode.text,
				referencePath
			);
			result.push({
				label: label,
				value: "'/" + referencePath + "'",
				filterableValue: label
			});
		}
		if (intelliSenseItems && intelliSenseItems.parameters) {
			result = result.concat(
				intelliSenseItems.parameters.map(function (item) {
					return {
						label: item.name,
						value: item.name,
						meta: 'Parameter'
					};
				})
			);
		}
		return result;
	}

	function editConditions() {
		showAsDialog();
		require([
			'QB/Scripts/ConditionEditor/aceConditionEditor',
			'dojo/aspect'
		], function (AceConditionEditor, aspect) {
			var editConditionsEl = editorContainerNode.querySelector(
				'.editConditions'
			);
			var editArea = editConditionsEl.querySelector('.edit-area');
			var aceEditor = new AceConditionEditor(editArea, conditionsDataSource, {
				grammarCompleters: {
					Constant: getQueryReferencePathAutocompleteOptions(
						frameArguments.queryReferencePathArray
					)
				}
			});
			aspect.after(aceEditor, 'onChange', function (editor) {
				setSaveButtonDisable(aceEditor);
			});

			aceEditor.setContent(filterXml || '');

			conditionEditor = aceEditor;

			editConditionsEl.style.display = 'block';
		});
	}

	function editQueryReferenceConditions() {
		showAsDialog();
		require([
			'QB/Scripts/ConditionEditor/aceConditionEditor',
			'dojo/aspect'
		], function (AceConditionEditor, aspect) {
			var editConditionsElement = editorContainerNode.querySelector(
				'.editConditions'
			);
			var editArea = editConditionsElement.querySelector('.edit-area');
			editConditionsElement.style.display = 'block';
			var aceEditor = new AceConditionEditor(editArea, conditionsDataSource, {
				grammarCompleters: {
					Constant: getQueryReferencePathAutocompleteOptions(
						frameArguments.queryReferencePathArray
					)
				}
			});
			aspect.after(aceEditor, 'onChange', function (editor) {
				setSaveButtonDisable(aceEditor);
			});
			aceEditor.setContent(filterXml || '');
			conditionEditor = aceEditor;
		});
	}

	function updateToolbar(selectedElement, state) {
		toolbar
			.getActiveToolbar()
			.getItem('operatorAND')
			.setEnabled(state !== undefined ? state : true);
		toolbar
			.getActiveToolbar()
			.getItem('operatorNOT')
			.setEnabled(state !== undefined ? state : true);
		toolbar
			.getActiveToolbar()
			.getItem('operatorOR')
			.setEnabled(state !== undefined ? state : true);
		toolbar
			.getActiveToolbar()
			.getItem('remove')
			.setEnabled(
				state !== undefined
					? state
					: !selectedElement.classList.contains('placeholder')
			);
	}

	function showAsDialog() {
		clientControlsFactory.createControl(
			'Aras.Client.Controls.Public.ToolBar',
			{ id: 'top_toolbar' + editorContainerNode.id, connectId: toolbarNode.id },
			function (control) {
				toolbar = control;
				clientControlsFactory.on(toolbar, {
					onClick: onClickItem
				});
				loadToolbar();
			}
		);
	}

	function loadToolbar() {
		toolbar.showLabels(
			aras.getPreferenceItemProperty(
				'Core_GlobalLayout',
				null,
				'core_show_labels'
			) == 'true'
		);
		toolbar.loadXml(
			aras.getI18NXMLResource(
				'conditionsEditor_toolbar.xml',
				aras.getScriptsURL() + '../Modules/aras.innovator.QueryBuilder/'
			)
		);
		toolbar.show();
	}

	function onClickItem(btn) {
		var selectedItem = document.getElementsByClassName('selected');
		var cmdID = btn.getId();

		switch (cmdID) {
			case 'operatorNOT':
				conditionEditor && conditionEditor.applySnippet('not');
				break;
			case 'operatorAND':
				conditionEditor && conditionEditor.applySnippet('and');
				break;
			case 'operatorOR':
				conditionEditor && conditionEditor.applySnippet('or');
				break;
			case 'remove': //todo: never enabled, should be reviewed
				break;
			case 'return':
				closeWindow(getCurrentConditonXml());
		}

		currentlySelectedItem = null;
		toolbar.getActiveToolbar().getItem('remove').setEnabled(false);
		if (window.onChangeTextContent) {
			window.onChangeTextContent();
		}
	}

	function getCurrentConditonXml() {
		var conditionDom = new XmlDocument();
		var root = conditionDom.createElement('condition');

		// for editConditions. implements old logic which was used with old intellisense
		if (frameArguments.mode !== 'editQueryReferenceConditions') {
			conditionDom.appendChild(root);
		}

		if (document.querySelector('.aras-btn').disabled) {
			return;
		}

		if (
			editorContainerNode.querySelector('.edit-area').textContent.trim() === ''
		) {
			return '<condition/>';
		} else {
			return conditionEditor.getContent();
		}
	}

	return editorApi;
}

function initConditionalView() {
	require([
		'QB/Scripts/conditionsTreeRenderer',
		'Vendors/inferno.min'
	], function (renderer, Inferno) {
		window.renderer = renderer;
		window.Inferno = Inferno;
		joinEditor = initEditor('containerJoin');
		whereUseEditor = initEditor('containerWhereUse');

		const cancelButton = document.getElementById('buttonCancel');
		cancelButton.addEventListener('click', function () {
			closeWindow(false);
		});

		const saveButton = document.getElementById('buttonSave');
		saveButton.addEventListener('click', function () {
			closeWindow(true);
		});
	});
}

function closeWindow(isSave) {
	const resultObj = {
		joinResult: null,
		whereUseResult: null
	};

	if (isSave) {
		resultObj.joinResult = mainFrameArguments.join && joinEditor.getResult();
		resultObj.whereUseResult =
			mainFrameArguments.whereUse && whereUseEditor.getResult();
	}

	if (mainFrameArguments.close) {
		mainFrameArguments.close(resultObj);
		return;
	}

	if (mainFrameArguments.closePopupCallback) {
		mainFrameArguments.closePopupCallback(resultObj);
		return;
	}
	if (mainFrameArguments.dialog) {
		mainFrameArguments.dialog.close(resultObj);
	} else {
		window.returnValue = resultObj;
		window.close();
	}
}

function onTabClick(id, event) {
	if (id == 'containerWhereUse') {
		containerWhereUse.style.display = 'block';
		containerJoin.style.display = 'none';
		whereUseEditor.setSaveButtonStatus();
	} else {
		containerWhereUse.style.display = 'none';
		containerJoin.style.display = 'block';
		joinEditor.setSaveButtonStatus();
	}
}

function start(args) {
	const cancelButton = document.getElementById('buttonCancel');
	const saveButton = document.getElementById('buttonSave');

	saveButton.textContent = args.aras.getResource(
		'../Modules/aras.innovator.QueryBuilder/',
		'condition_editor.save'
	);
	cancelButton.textContent = args.aras.getResource(
		'../Modules/aras.innovator.QueryBuilder/',
		'condition_editor.cancel'
	);

	mainFrameArguments = args;

	if (args.evType === 'hover') {
		document.body.classList.add('read-only-mode');
	} else if (args.isStartExecution) {
		document.body.classList.add('start-execution');
	} else {
		saveButton.style.display = 'inline';
		cancelButton.style.display = 'inline';

		var Tab = args.tab;
		const tabEx = document.getElementById('qb-tabs');

		if (args.whereUse) {
			tabEx.addTab('containerWhereUse', { closable: false });
			tabEx.setTabContent('containerWhereUse', {
				label: args.aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'condition_editor.where_condition_title'
				)
			});
		}

		if (args.join) {
			tabEx.addTab('containerJoin', { closable: false });
			tabEx.setTabContent('containerJoin', {
				label: args.aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'condition_editor.join_condition_title'
				)
			});
		}

		let containerJoin = document.getElementById('containerJoin');
		containerJoin.style.display = 'none';
		tabEx.on('click', onTabClick);
		tabEx.selectTab('containerWhereUse');
	}

	if (args.join) {
		args.join.close = args.close;
		joinEditor.start(args.join);

		if (args.evType === 'hover') {
			joinEditor.setTitle(
				args.aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'condition_editor.join_condition_title'
				)
			);
		}
	}

	if (args.whereUse) {
		args.whereUse.close = args.close;
		whereUseEditor.start(args.whereUse);
		if (args.evType === 'hover') {
			whereUseEditor.setTitle(
				args.aras.getResource(
					'../Modules/aras.innovator.QueryBuilder/',
					'condition_editor.where_condition_title'
				)
			);
		}
	}
}
