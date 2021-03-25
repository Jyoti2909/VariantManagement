define(['dojo/_base/declare', 'dijit/_WidgetBase', 'dijit/_TemplatedMixin'], function(declare, _WidgetBase, _TemplatedMixin) {
	return declare('Aras.Client.Controls.RE.RequirementContainer', [_WidgetBase, _TemplatedMixin], {
		isEditorLoaded: false,
		currentItemTypeContext: null,
		_itemTypeName: null,
		templateString: '<iframe id="techdoc_editor" src="" frameborder="0" scrolling="auto" style="width: 100%; height: 100%;"></iframe>',
		_itemtypes: null,

		constructor: function(args) {
			this.args = args;
			this._itemTypeName = args.itemTypeName;
			this._itemtypes = {'re_Requirement': 'Requirement', 're_Requirement_Document': 'RequirementDocument'};
			this.initContext();
			this.set('fixedSidebarButtonId', this.currentItemTypeContext.sideBarButtonName);
			this.set('declaredClass', 're_editor');
		},

		loadEditor: function() {
			// RequirementTextEditor or RequirementDocumentTextEditor
			var editorName = this._itemtypes[this._itemTypeName] + 'TextEditor';
			this.domNode.src = '../Solutions/RE/' + editorName;
			this.isEditorLoaded = true;
		},

		initContext: function() {
			var itemTypeNameInLowerCase = this._itemtypes[this._itemTypeName].toLowerCase();
			this.currentItemTypeContext = {
				itemTypeName: itemTypeNameInLowerCase,
				sideBarFormButtonName: 'show_form',
				sideBarButtonName: itemTypeNameInLowerCase + '_show_editor',
				imageEditOn: itemTypeNameInLowerCase == 'requirement' ?
					'../Solutions/RE/Images/RequirementEditOn.svg' :
					'../Solutions/RE/Images/ReqDocumentEditOn.svg',
				imageEditOff: itemTypeNameInLowerCase == 'requirement' ?
					'../Solutions/RE/Images/RequirementEditOff.svg' :
					'../Solutions/RE/Images/ReqDocumentEditOff.svg'
			};
		},

		getSwitchOffButtonIds: function() {
			return [this.currentItemTypeContext.sideBarButtonName];
		},

		getSwitchOffDisabledButtonIcons: function() {
			return [this.currentItemTypeContext.imageEditOff];
		}
	});
});
