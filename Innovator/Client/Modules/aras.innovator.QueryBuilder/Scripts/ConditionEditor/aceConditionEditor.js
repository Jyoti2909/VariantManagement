define([
	'dojo/_base/declare',
	'QB/Scripts/ConditionsTree',
	'../../../vendors/peg-0.10.0.min.js',
	'dojo/text!QB/Scripts/ConditionEditor/conditionsTreeGrammar.pegjs',
	'QB/Scripts/ConditionEditor/completersBuilder',
	'./snippets',
	'./ContextCompleter'
], function (
	declare,
	ConditionsTree,
	pegjs,
	grammar,
	completersBuilder,
	SnippetManager,
	ContextCompleter
) {
	var initAceControl = function (element, options) {
		var promise = new Promise(function (resolve, reject) {
			require(['../../../vendors/ace-editor/ace.js'], function () {
				require([
					'../../../vendors/ace-editor/ext-language_tools.js'
				], function () {
					var editor = ace.edit(element);
					ace.require('ace/ext/language_tools');
					editor.setTheme('ace/theme/textmate');
					ace.config.set(
						'modePath',
						'../../../Modules/aras.innovator.QueryBuilder/Scripts/ConditionEditor/'
					);
					editor.session.setOption('useWorker', false);
					var editorSession = editor.getSession();
					editorSession.setMode('ace/mode/conditionEditor');
					editor.setOptions({
						enableBasicAutocompletion: true,
						enableSnippets: false,
						enableLiveAutocompletion: true,
						selectionStyle: 'text',
						showGutter: true,
						highlightActiveLine: false,
						showPrintMargin: false,
						showLineNumbers: false
					});
					editorSession.setUseWrapMode(true);
					editor.setReadOnly(options.isReadonly);
					editor.execCommand('gotolineend');
					resolve(editor);
				});
			});
		});
		return promise;
	};
	var configureCompleters = function (editor, dataSource, parser, options) {
		editor.completers = completersBuilder.build(dataSource);
		if (options && options.grammarCompleters) {
			editor.completers.push(new ContextCompleter(parser, options));
		}
		editor.getSession().on('change', function () {
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
	};
	return declare(null, {
		constructor: function (element, dataSource, options) {
			var self = this;
			self._editorElement = element;
			self._dataSource = dataSource;
			self._conditionsTree = new ConditionsTree();
			self._parser = pegjs.generate(grammar);
			self._isValid = true;
			self._initPromise = initAceControl(element, options || {}).then(function (
				control
			) {
				self._initPromise = null;
				self._aceControl = control;
				control.getSession().on('change', function () {
					self.validate();
				});
				control.getSession().on('change', function () {
					self.onChange(control);
				});
				configureCompleters(control, dataSource, self._parser, options);
				var snippetManager = ace.require('ace/snippets').snippetManager;
				self._snippets = new SnippetManager(snippetManager).getSnippets();
				control.focus();
				return control;
			});
		},
		_getAceControl: function () {
			return this._initPromise
				? this._initPromise
				: this._aceControl
				? Promise.resolve(this._aceControl)
				: Promise.reject('Cant get ace editor control');
		},
		setContent: function (xml) {
			var self = this;
			this._getAceControl().then(function (editor) {
				var conditionDom = new XmlDocument();
				conditionDom.loadXML(xml.replace(/\r?\n|\r|\t/g, ''));
				self._conditionsTree.fromXml(conditionDom, self._dataSource);
				editor.setValue(self._conditionsTree.toString());
			});
		},
		getContent: function () {
			var editor = this._aceControl;
			if (!editor) {
				return null;
			}
			var result = editor.getValue();
			if (result.trim() === '') {
				return '<condition/>';
			}
			try {
				result = this._parser.parse(result);
			} catch (e) {
				return null;
			}
			if (result) {
				this._conditionsTree.fillUnknown(result, this._dataSource);
				this._conditionsTree.synchronize(result);
			}
			return this._conditionsTree.toXml().xml;
		},
		validate: function () {
			var self = this;
			self._validationPromise = self._getAceControl().then(function (editor) {
				var session = editor.getSession();
				session.clearAnnotations();
				self._isValid = true;
				var result = editor.getValue();
				if (result.trim() === '') {
					return;
				}
				try {
					var syntaxTree = self._parser.parse(result);
					self._conditionsTree.fillUnknown(syntaxTree, self._dataSource);
				} catch (e) {
					self._isValid = false;
					session.setAnnotations([
						{
							row: e.location.start.line - 1,
							column: e.location.start.column - 1,
							text: e.message,
							type: 'error'
						}
					]);
				}
				self._validationPromise = null;
			});
		},
		applySnippet: function (snippetName) {
			var snippet = this._snippets[(snippetName || '').toLowerCase()];
			if (!snippet) {
				return;
			}
			this._getAceControl().then(function (editor) {
				editor.insertSnippet(snippet);
				editor.focus();
			});
		},
		getValidationStatus: function () {
			var self = this;
			return !self._validationPromise
				? Promise.resolve(self._isValid)
				: self._validationPromise.then(function () {
						return self._isValid;
				  });
		},
		onChange: function (editor) {
			// onChangeEvent
		}
	});
});
