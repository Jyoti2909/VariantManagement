/*global dojo, define*/
define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dojo/dom-style',
	'dojo/dom-class',
	'dojox/dtl',
	'dojox/dtl/Context',
	'dojox/dtl/tag/logic'
], function (declare, _WidgetBase, domStyle, domClass) {
	return declare('DiscussionPanel', [_WidgetBase], {
		args: null,
		aras: null,
		itemId: null,
		discussionFeed: null,
		isStarted: false,

		constructor: function (args) {
			this.args = args;
			this.aras = args.aras;
			this.itemTypeName = this.args.params.itemTypeName;
			this.itemID = this.args.params.itemID;

			if (this.args.id) {
				this.id = this.args.id;
			}
		},

		postCreate: function () {
			this.inherited(arguments);
			if (this.args.isVisible) {
				domStyle.set(this.domNode, 'display', 'block');
			} else {
				domStyle.set(this.domNode, 'display', 'none');
			}
		},

		startup: function () {
			const that = this;
			if (this.visible()) {
				this.inherited(arguments);
				require([
					'dojo/ready',
					'../javascript/include.aspx?classes=DiscussionStatic',
					'../Modules/aras.innovator.SSVC/Scripts/Feed.js',
					'../Modules/aras.innovator.SSVC/Scripts/FilterPopup.js',
					'../Modules/aras.innovator.SSVC/Scripts/ReplyToolbar.js',
					'../Modules/aras.innovator.SSVC/Scripts/UserControl.js',
					'../Modules/aras.innovator.SSVC/Scripts/MessageEditor.js'
				], function (ready) {
					ready(function () {
						that.discussionFeed = new SSVC.UI.Feed.DiscussionFeed({
							params: that.args.params
						});
						that.discussionFeed.placeAt(that.domNode);
						that.discussionFeed.load();
						that.isStarted = true;
					});
				});
			}
		},

		reload: function (args) {
			if (this.discussionFeed) {
				this.discussionFeed.reload(args);
			}
		},

		resize: function (container) {
			if (container.w) {
				if (!this.visible()) {
					this.show(this);
				}
				if (this.discussionFeed) {
					if (this.onResize) {
						this.onResize();
					}
					this.discussionFeed.resize();
				}
			}
		},

		show: function () {
			domStyle.set(this.domNode, 'display', 'block');
			if (!this.isStarted) {
				this.startup();
			}
		},

		hide: function () {
			domStyle.set(this.domNode, 'display', 'none');
		},

		visible: function () {
			if (this.domNode && domStyle.get(this.domNode, 'display') === 'none') {
				return false;
			} else {
				return true;
			}
		}
	});
});
