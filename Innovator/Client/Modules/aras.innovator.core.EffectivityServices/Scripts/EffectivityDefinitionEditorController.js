function EffectivityDefinitionEditorController(
	RuleEditorControl,
	RenderUtils,
	ExpressionSerializerControl,
	ExpressionGrammar,
	aras
) {
	this.RuleEditorControl = RuleEditorControl;
	this.RenderUtils = RenderUtils;
	this.ExpressionSerializerControl = ExpressionSerializerControl;
	this.ExpressionGrammar = ExpressionGrammar;
	this.aras = aras;
}

EffectivityDefinitionEditorController.prototype = {
	constructor: EffectivityDefinitionEditorController,

	_ruleGrammarTemplateName: 'RuleConditionGroup',

	_initialized: false,

	_isEditMode: false,

	_editorControlContainer: null,

	init: function (expressionItem, isEditMode) {
		this._isEditMode = isEditMode;
		this._initialize();
		this._setupItemContext(expressionItem);
		this._setupEditorEnabledState();
		this.loadEditorState(
			this.aras.getItemProperty(expressionItem, 'effs_scope_id')
		);
	},

	loadEditorState: function (scopeId) {
		this.expressionSerializer = new this.ExpressionSerializerControl({
			aras: this.aras,
			renderUtils: this.RenderUtils.HTML,
			scopeId: scopeId
		});

		const grammar = new this.ExpressionGrammar({
			groupName: this._ruleGrammarTemplateName,
			scope: this.expressionSerializer.getScope(),
			grammarFile: 'EffectivityServices/RuleGrammar/RuleGrammar.txt'
		});

		this._setupEditor(grammar);
	},

	_setupItemContext: function (item) {
		this._expressionItem = item;
		if (this._expressionItem.getAttribute('isTemp') === '1') {
			this._setDefinitionValue('<expression />');
		}
	},

	_setupEditorEnabledState: function () {
		this._editorControlContainer.classList.toggle(
			'effs-definition-editor_disabled',
			!this._isEditMode
		);
		this.editorControl.setEditState(this._isEditMode);
	},

	_initialize: function () {
		if (this._initialized) {
			return;
		}

		this._editorControlContainer = document.getElementById(
			'editorControlContainer'
		);
		this._messageContainer = document.getElementById('editorMessageContainer');
		this.editorControl = new this.RuleEditorControl({
			connectId: 'ruleEditorContainer',
			isEditable: true,
			aras: this.aras
		});

		this.editorControl.addEventListener(
			this,
			null,
			'onStateChanged',
			this._onEditorStateChanged
		);
		this.editorControl.addEventListener(
			this,
			null,
			'onStateChanged',
			this._markExpressionItemAsDirty
		);
		this.editorControl.addEventListener(
			this,
			null,
			'onGroupValueEntered',
			this._onEditorGroupValueEntered
		);

		this._editorControlContainer.addEventListener(
			'click',
			function (event) {
				if (
					this._isEditMode &&
					(event.target === this._editorControlContainer ||
						event.target === this._messageContainer)
				) {
					this.editorControl.focus();
				}
			}.bind(this)
		);

		this._initialized = true;
	},

	_onEditorGroupValueEntered: function () {
		const group = this.editorControl.getGroupByName(
			this._ruleGrammarTemplateName
		);
		const expressionData = group.getParsedExpression();
		const value = this.expressionSerializer.serializeExpressionDataToXml(
			expressionData
		);
		this._setDefinitionValue(value);
	},

	_onEditorStateChanged: function () {
		if (this.editorControl.isInputValid()) {
			this._messageContainer.style.opacity = '0';
		} else {
			this._messageContainer.textContent = this.editorControl.getErrorString();
			this._messageContainer.style.opacity = '1';
		}
	},

	_setDefinitionValue: function (value) {
		this.aras.setItemProperty(this._expressionItem, 'definition', value);
	},

	_markExpressionItemAsDirty: function () {
		if (
			this.editorControl.isInputStarted() &&
			this.editorControl.isValueModified()
		) {
			this._expressionItem.setAttribute('isDirty', '1');
		}
	},

	_getDefinitionValue: function () {
		const definitionValue = {};
		definitionValue[
			this._ruleGrammarTemplateName
		] = this.expressionSerializer.deserializeExpressionToString(
			this.aras.getItemProperty(this._expressionItem, 'definition')
		);
		return definitionValue;
	},

	_setupEditor: function (grammar) {
		const grammarTemplate = grammar.getGrammarTemplate();
		const grammarData = grammar.getGrammarData();
		this.editorControl.setInputTemplate(grammarTemplate);
		this.editorControl.startNewInput();

		const grammarGroup = this.editorControl.getGroupByName(
			this._ruleGrammarTemplateName
		);
		grammarGroup.setParserProperty('_VariableNames', grammarData);
		grammarGroup.setParserProperty('_arasObj', this.aras);

		this.editorControl.setValue(this._getDefinitionValue() || '');
	}
};
