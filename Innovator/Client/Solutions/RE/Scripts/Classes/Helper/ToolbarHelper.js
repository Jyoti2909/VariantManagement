define([
	'dojo/_base/declare'
],
function(declare) {
	return declare('Aras.Client.Controls.RequirementDocument.ToolbarHelper', null, {
		reqDocChapterTree: null,
		toolbar: null,

		constructor: function(args) {
			this.reqDocChapterTree = args.reqDocChapterTree;
			this.toolbar = args.toolbar;

			this.controlsMap = {
				're_new': this.reqDocChapterTree,
				're_delete_req': this.reqDocChapterTree,
				're_delete_section': this.reqDocChapterTree,
				're_replace': this.reqDocChapterTree,
				're_moveUp': this.reqDocChapterTree,
				're_moveDown': this.reqDocChapterTree,
				're_moveIndent': this.reqDocChapterTree,
				're_moveUnindent': this.reqDocChapterTree,
				're_bold': this.toolbar,
				're_italic': this.toolbar,
				're_strike': this.toolbar,
				're_under': this.toolbar,
				're_sub': this.toolbar,
				're_sup': this.toolbar,
				're_bottom': this.toolbar,
				're_middle': this.toolbar,
				're_top': this.toolbar,
				're_left': this.toolbar,
				're_right': this.toolbar,
				're_center': this.toolbar,
				're_justify': this.toolbar,
				're_bullet': this.toolbar,
				're_numeric': this.toolbar,
				're_alpha': this.toolbar,
				're_char_table': this.toolbar
			};
		},

		GetControl: function(toolbarElemetId) {
			return this.controlsMap[toolbarElemetId];
		}
	});
});
