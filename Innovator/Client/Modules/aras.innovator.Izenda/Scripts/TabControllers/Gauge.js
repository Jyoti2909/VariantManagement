require(['dojo/_base/declare', 'dojo/query'], function (declare, query) {
	var that;

	function improveIzendaUI(container, djUiSqlBridge, metadata) {
		var firstContentTable = query(
			'#ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_gauge',
			container
		)[0];
		var secondContentTable = firstContentTable.nextSibling;

		var titleAndResultsRow = firstContentTable.firstChild;
		titleAndResultsRow.classList.add('titleAndResultsRow');
		secondContentTable.classList.add('secondTable');
		var el;
		var breadcrumbContainer;

		var onEllipsisClickFunction = function (e) {
			if (e.target.previousSibling.length) {
				Izenda.Utils.showReportingStructurePopup(
					Izenda.Utils.GetResource('reportingstructure.select') +
						query(e.target).closest('tr').children('td')[0].textContent,
					djUiSqlBridge.htmlToTree(),
					e.target.previousSibling,
					Izenda.UI.Widgets.Breadcrumbs.setBreadcrumb.bind(that, e.target)
				);
			}
		};
		for (var i = 1; i <= 3; i++) {
			var row = query('.titleAndResultsRow', container).children('tr')[i];
			el = query('select', row)[0];
			Izenda.Utils.improveSelectInput(el);
			Izenda.Utils.improveInnovatorSelectWithEllipsis(
				el,
				onEllipsisClickFunction
			);
			breadcrumbContainer = Izenda.UI.Widgets.Breadcrumbs.addBreadcrumbContainer(
				el
			);
			el.boundBreadcrumbContainer = breadcrumbContainer;
			el.boundMetadata = metadata.breadcrumbs;
		}
	}

	dojo.setObject(
		'Izenda.UI.Tab.Gauge',
		declare(Izenda.UI.Tab.Base, {
			metadata: {
				breadcrumbs: {}
			},
			init: function (metadata) {
				that = this;
				this.inherited(arguments);
				improveIzendaUI(this.tabContent, this.args.djUiSqlBridge, metadata);
			},

			getMetaData: function () {
				return this.metadata;
			}
		})
	);
});
