function Preview(userReports, criteria) {
	this._previewIds = [];
	this.initPreview(userReports, criteria);
	this.category = criteria;
}

require([
	'Aras/Client/Controls/Experimental/ContextMenu',
	'dojo/domReady!'
], function (ContextMenu) {
	var reportsPreview = document.getElementById('reportsPreview');
	if (!reportsPreview) {
		return;
	}
	reportsPreview.addEventListener('contextmenu', function (e) {
		var bool = e.target === reportsPreview;
		['runReport', 'editReport', 'deleteReport'].forEach(function (value) {
			contexMenu.setHide(value + '_', bool);
		});
		if (!bool) {
			var report = e.target.closest('.previewContainer');
			var id = preview.getIdByIdx(report.getAttribute('idx'));
			var item = getItemFirstEntry(id, preview.category);
			if (item && item.userdata) {
				onItemSelect(id, false, item.userdata);
				contexMenu.rowId = id;
				onMenuInit(id, item.userdata, contexMenu, '_');
			}
		}
	});
	var contexMenu = new ContextMenu(reportsPreview);
	setupContextMenu(contexMenu, '_');
	contexMenu.onItemClick = function (command, id) {
		onMenuClick(command.slice(0, -1), id);
	};
});

Preview.prototype.initPreview = function (userReports, criteria) {
	var self = this;
	var reportsPreview = document.getElementById('reportsPreview');
	if (reportsPreview) {
		var genPreview = generatePreview(userReports, criteria);
		reportsPreview.innerHTML = genPreview;
		if (genPreview) {
			require(['dojo/query'], function (query) {
				var previewEvents = {
					id: 'previewEvents',
					onClick: self.onPreviewItemSelect,
					onDoubleClick: self.onPreviewDoubleClick
				};
				query('.previewContainer').on('click', previewEvents.onClick);
				query('.previewContainer').on('dblclick', previewEvents.onDoubleClick);
			});
		}
	}

	function generatePreview(reports, category) {
		var previewTemplate =
			"<div class='previewContainer' idx='{0}'>" +
			"	<div class='userReportThumbnail'></div>" +
			"	<span class='userReportLabel'>{1}</span>" +
			'</div>';

		function getPreviewByRelshipCriteria(criteria, checkById) {
			var domResult = '';
			var userReportsItems = reports.getItemsByXPath(
				"//Item[@type='SelfServiceReport']"
			);
			var idx = 0;
			for (var i = 0; i < userReportsItems.getItemCount(); i++) {
				var currentReport = userReportsItems.getItemByIndex(i);
				var isNeedToShow = checkById
					? currentReport.getProperty('created_by_id') === criteria
					: currentReport.getRelationships(criteria).nodeList.length > 0;

				if (isNeedToShow) {
					var reportName = currentReport.getProperty('name');
					domResult += previewTemplate.Format(
						idx,
						reportName.replace(/</gi, '&lt;').replace(/>/gi, '&gt;')
					);
					self._previewIds[idx] = currentReport.getID();
					idx++;
				}
			}
			return domResult;
		}

		switch (category) {
			case 'sharedwithme':
				return getPreviewByRelshipCriteria(
					'SelfServiceReportSharedWith',
					false
				);
			case 'recent':
				return getPreviewByRelshipCriteria('RunReportByUser', false);
			case 'createdbyme':
				return getPreviewByRelshipCriteria(
					Izenda.Utils.getAras().getUserID(),
					true
				);
			default:
				return false;
		}
	}
};

Preview.prototype.getIdByIdx = function (idx) {
	return this._previewIds[idx];
};

Preview.prototype.onPreviewItemSelect = function (event) {
	var idx = event.currentTarget.getAttribute('idx');
	var id = preview.getIdByIdx(idx);
	selectItemInReportTree(id);
};

Preview.prototype.onPreviewDoubleClick = function (event) {
	var idx = event.currentTarget.getAttribute('idx');
	var id = preview.getIdByIdx(idx);
	onMenuClick('runReport', id);
};

Preview.prototype.previewItemSelectImpl = function (id) {
	var idx = this._previewIds.indexOf(id);
	var previewContainer = document.querySelector("[idx='{0}']".Format(idx));

	var otherContainers = document.querySelectorAll('[idx]');
	for (var i = 0; i < otherContainers.length; i++) {
		otherContainers[i].className = otherContainers[i].className.replace(
			' selectedPreviewContainer',
			''
		);
	}

	if (
		previewContainer &&
		previewContainer.className.indexOf('selectedPreviewContainer') === -1
	) {
		previewContainer.className += ' selectedPreviewContainer';

		require(['dojo/window'], function (win) {
			win.scrollIntoView(previewContainer);
		});
	}
};
