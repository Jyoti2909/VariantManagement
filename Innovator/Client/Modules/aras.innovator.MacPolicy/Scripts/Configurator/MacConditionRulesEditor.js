/* global ace, editor */
define([
	'QB/Scripts/qbTreeStore',
	'MacPolicy/Scripts/Configurator/MacCondition',
	'QB/Scripts/ConditionsTree',
	'MacPolicy/Scripts/Editor/completersBuilder',
	'QB/Scripts/ConditionEditor/ContextCompleter',
	'QB/Scripts/ConditionEditor/snippets',
	'MacPolicy/Scripts/Configurator/GenerateConditionCode',
	'MacPolicy/Scripts/Configurator/MacConditionValidator',
	'MacPolicy/Scripts/Configurator/MacConditionParser'
], function (
	qbTreeStore,
	MacCondition,
	ConditionsTree,
	completersBuilder,
	ContextCompleter,
	SnippetManager,
	generateConditionCode,
	macConditionValidator,
	macConditionParser
) {
	'use strict';

	const modulePath = '../Modules/aras.innovator.MacPolicy/';

	const MacConditionRulesEditor = (function () {
		function MacConditionRulesEditor(args) {
			qbTreeStore.loadItems(args.store);
			this.dataLoader = args.loader;
			this.treeStore = qbTreeStore;
			this.parameters = MacCondition.getPossibleParameters();
			this.showFrame();
		}

		MacConditionRulesEditor.prototype.showFrame = function () {
			function getPossibleParameters(parameters) {
				return Array.prototype.map.call(parameters, function (parameter) {
					return {
						name: '$' + parameter.name,
						value: '$' + parameter.name,
						meta: aras.getResource(
							modulePath,
							'condition_editor.autocomplete.environment_attribute.meta'
						),
						type: parameter.type,
						description: parameter.description
					};
				});
			}
			const currentTreeItem = this.treeStore.dataStore.treeModelCollection[1];
			const queryDefinitionItem = currentTreeItem.node.selectSingleNode(
				'ancestor::Item[@type="qry_QueryDefinition"]'
			);
			this.items = this.treeStore.dataStore.treeModelCollection;
			const qrXPath =
				"Relationships/Item[@type='qry_QueryReference' and (ref_id='" +
				currentTreeItem.referenceRefId +
				"')]";
			const queryReferenceItem = queryDefinitionItem.selectSingleNode(qrXPath);
			const formWindow = window;
			const mainWindow = formWindow.parent;
			const isEditMode = mainWindow.isEditMode;
			this.MacConditionEditor =
				mainWindow.MacPolicyDefinitionView.MacConditionEditor;
			this.conditionsTree = new ConditionsTree();
			const filterXml = aras.getItemProperty(queryReferenceItem, 'filter_xml');
			let conditionString;
			try {
				if (filterXml) {
					const conditionDom = new XmlDocument();
					conditionDom.loadXML(filterXml.replace(/\r?\n|\r|\t/g, ''));
					if (!MacCondition.validateProperties(conditionDom.xml)) {
						conditionDom.loadXML('<condition></condition>');
					}
					this.conditionsTree.fromXml(conditionDom, this.items);
					MacCondition.transformAstBeforeOpen(this.conditionsTree.root);
				}
				conditionString = generateConditionCode(this.conditionsTree.root);
			} catch (e) {
				conditionString = '';
			}
			editor.setReadOnly(!isEditMode);
			editor.completers = completersBuilder.build(this.items);
			const options = {
				grammarCompleters: {
					Constant: getPossibleParameters(this.parameters)
				}
			};
			editor.completers.push(new ContextCompleter(macConditionParser, options));
			editor.setValue(conditionString);
			editor.execCommand('gotolineend');
			editor.focus();
			const self = this;
			editor.getSession().on('change', function (e) {
				const item = self.MacConditionEditor.form.getItem();
				item.setAttribute('isDirty', '1');
				self.validate();
			});
			editor.getSession().on('change', function (e) {
				// Don't show autocomplete if inserts more than one lines, it's helps to prevent autocomplete when 'enter' pressed.
				const changedLines = e.lines;
				if (changedLines.length > 1) {
					return;
				}
				if (
					editor.completer &&
					editor.completer.popup &&
					!editor.completer.popup.isOpen
				) {
					setTimeout(function () {
						editor.execCommand('startAutocomplete');
					}, 1);
				}
			});
			const snippetManager = ace.require('ace/snippets').snippetManager;
			this._snippets = new SnippetManager(snippetManager).getSnippets();
		};

		MacConditionRulesEditor.prototype.validate = function () {
			editor.getSession().clearAnnotations();
			let result = editor.getValue();
			if (!result) {
				return;
			}
			result = macConditionValidator.validate(
				result,
				this.items,
				this.conditionsTree
			);
			if (result.isSuccess) {
				this.MacConditionEditor.form.setEnabledToolbarButton('save', true);
			} else {
				this.MacConditionEditor.form.setEnabledToolbarButton('save', false);
				editor.getSession().setAnnotations([
					{
						row: result.error.location.start.line - 1,
						column: result.error.location.start.column - 1,
						text: result.error.message,
						type: 'error'
					}
				]);
			}
		};

		MacConditionRulesEditor.prototype.addOperator = function (snippetName) {
			const snippet = this._snippets[(snippetName || '').toLowerCase()];
			if (!snippet) {
				return;
			}
			editor.insertSnippet(snippet);
			editor.focus();
		};

		MacConditionRulesEditor.prototype.getCondition = function () {
			let result = editor.getValue();
			if (!result) {
				return '<condition/>';
			}
			result = macConditionValidator.validate(
				result,
				this.items,
				this.conditionsTree
			);
			if (result.isSuccess) {
				return result.condition;
			} else {
				const message = aras.getResource(
					modulePath,
					'condition_editor.validation_failed'
				);
				const timeClose = parseInt(
					aras.getPreferenceItemProperty(
						'Core_GlobalLayout',
						null,
						'core_popupmessage_timeout'
					)
				);
				const notify = aras.getNotifyByContext(window.parent);
				notify(message, {
					timeout: timeClose || 5000
				});
				return false;
			}
		};
		return MacConditionRulesEditor;
	})();
	return MacConditionRulesEditor;
});
