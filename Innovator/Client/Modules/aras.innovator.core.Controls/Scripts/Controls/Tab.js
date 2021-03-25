/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_Container',
	'dijit/layout/_LayoutWidget',
	'dojo/dom-class',
	'Aras/Client/Controls/Experimental/LazyLoaderBase'
], function (
	declare,
	_WidgetBase,
	_Container,
	_LayoutWidget,
	domClass,
	LazyLoaderBase
) {
	return declare(
		'Tab',
		[_WidgetBase, _Container, _LayoutWidget, LazyLoaderBase],
		{
			args: null,
			isStarted: false,

			constructor: function (args) {
				this.args = args;
			},

			postCreate: function () {
				this.inherited(arguments);
				domClass.add(this.domNode, 'tab');
				if (this.selected) {
					domClass.add(this.domNode, 'dijitVisible');
				} else {
					domClass.add(this.domNode, 'dijitHidden');
				}
			},

			startup: function () {
				if (this.selected) {
					this.inherited(arguments);

					var children = this.getChildren();
					for (var i = 0, l = children.length; i < l; i++) {
						var child = children[i];
						if (!child._started) {
							child.startup();
						}
					}

					this.isStarted = true;
				}
			},

			hide: function () {
				domClass.remove(this.domNode, 'dijitVisible');
				domClass.add(this.domNode, 'dijitHidden');
				this.selected = false;
				this.onTabDisabled(this, { id: this.id });
			},

			show: function () {
				domClass.remove(this.domNode, 'dijitHidden');
				domClass.add(this.domNode, 'dijitVisible');
				this.selected = true;
				if (!this.isStarted) {
					this.startup();
				}
				this.onTabEnabled(this, { id: this.id });
			},

			onTabDisabled: function (sender, args) {},
			onTabEnabled: function (sender, args) {}
		}
	);
});
