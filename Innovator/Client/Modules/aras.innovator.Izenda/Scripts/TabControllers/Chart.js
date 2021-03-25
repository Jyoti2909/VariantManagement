require(['dojo/dom-style', 'dojo/_base/declare', 'dojo/query'], function (
	domStyle,
	declare,
	query
) {
	function improveIzendaUI() {
		var advancedPropsBtn;
		advancedPropsBtn = query(
			'div[chartname=Chart],div[chartname=Chart2]',
			this.tabContent
		).children('button')[0];
		var bottomButtons = query('input[type=button]', this.tabContent);
		if (advancedPropsBtn) {
			advancedPropsBtn = bottomButtons[0].parentNode.insertBefore(
				advancedPropsBtn,
				bottomButtons[0]
			);
			bottomButtons[0].parentNode.insertBefore(
				document.createTextNode(' '),
				bottomButtons[0]
			);
			domStyle.set(advancedPropsBtn, 'display', 'none');
		}
		return advancedPropsBtn;
	}

	dojo.setObject(
		'Izenda.UI.Tab.Chart',
		declare(Izenda.UI.Tab.Base, {
			advancedPropsBtn: null,
			metadata: {
				breadcrumbs: {}
			},

			init: function (metadata) {
				this.inherited(arguments);
				this.advancedPropsBtn = improveIzendaUI.bind(this)();
				var that = this;

				var onEllipsisClickFunction = function (e) {
					Izenda.Utils.showReportingStructurePopup(
						Izenda.Utils.GetResource('reportingstructure.select') +
							query('div', query(e.target).closest('td')[0].previousSibling)[0]
								.innerHTML,
						djUiSqlBridge.htmlToTree(),
						e.target.previousSibling,
						Izenda.UI.Widgets.Breadcrumbs.setBreadcrumb.bind(that, e.target)
					);
				};

				var namesOfCharts = [];
				namesOfCharts[0] =
					'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_chc_Column';
				namesOfCharts[1] =
					'ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_chc2_Column';
				//set ellipsis for Chart and Chart2 tabs
				query('select', this.tabContent).forEach(function (el, idx) {
					for (var i = 0; i < namesOfCharts.length; i++) {
						if (el.name === namesOfCharts[i]) {
							Izenda.Utils.improveSelectInput(el);
							Izenda.Utils.improveInnovatorSelectWithEllipsis(
								el,
								onEllipsisClickFunction
							);
							var container = Izenda.UI.Widgets.Breadcrumbs.addBreadcrumbContainer(
								el
							);
							el.boundBreadcrumbContainer = container;
							el.boundMetadata = metadata.breadcrumbs;
						}
					}
				});
			},

			onSelect: function () {
				window[
					'CHC_ChartTypeChangeHandlerByUser'
				] = Izenda.Utils.extendMethodWithFuncs(
					window['CHC_ChartTypeChangeHandlerByUser'],
					null,
					function () {
						var advancedPropsBtn = query(
							'.btn',
							query(arguments[0]).parents(
								'div[data-dojo-attach-point=tabContent]'
							)[0]
						)[0];
						if (arguments[0].value) {
							domStyle.set(advancedPropsBtn, 'display', 'inline-block');
						} else {
							domStyle.set(advancedPropsBtn, 'display', 'none');
						}
					}
				);
			},

			getMetaData: function () {
				return this.metadata;
			}
		})
	);
});
