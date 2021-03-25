require([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dojo/text!Izenda/Views/Tabs/BaseTab.html'
], function (
	declare,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	template
) {
	declare(
		'Izenda.UI.Tab.Base',
		[_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
		{
			templateString: template,
			name: null,
			metadata: {
				breadcrumbs: {}
			},

			constructor: function (args) {
				this.args = args;
				this.name = this.args.name;
			},

			init: function (metadata) {
				this.startup();
				if (metadata) {
					this.metadata = metadata;
				}

				if (this.args.tabContent) {
					this.tabContent.appendChild(this.args.tabContent);
					Izenda.Utils.improveCheckboxes(
						this.tabContent,
						'input[type=checkbox], input[type=radio]'
					);
					Izenda.Utils.improveButtons(this.tabContent);
				}
			},

			onResize: function () {
				//this.domNode.style.height = domStyle.get(document.getElementById("mainContentDiv"), "height") + "px";
			},

			onSelect: function () {
				//this.borderContainer.resize();
			},

			getMetaData: function () {
				return null;
			}
		}
	);
});
