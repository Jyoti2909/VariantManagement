require(['dojo/query'], function (query) {
	var breadcrumbs = {
		addBreadcrumbContainer: function (el) {
			var tr = document.createElement('div');
			tr.classList.add('breadcrumb-tr-like');
			var td = document.createElement('div');
			td.classList.add('breadcrumb-container');
			td.appendChild(document.createTextNode(''));
			var nbspDiv = document.createElement('div');
			nbspDiv.innerHTML = '\u00a0'; //whitespace
			tr.appendChild(nbspDiv);
			tr.appendChild(td);
			return query(el)
				.closest('tr')[0]
				.parentNode.insertBefore(tr, query(el).closest('tr')[0]);
		},

		setBreadcrumb: function (el, properties) {
			var breadcrumbRow = query(el).closest('tr')[0].previousSibling;
			if (breadcrumbRow.classList.contains('breadcrumb-tr-like')) {
				breadcrumbs.fillBreadcrumbContainer(
					breadcrumbRow,
					properties.selectedBreadCrumbPath
				);
				//breadcrumbRow.lastChild.innerHTML = properties.selectedBreadCrumbPath;
				this.metadata.breadcrumbs[el.previousSibling.value] =
					properties.selectedBreadCrumbPath;
			}
		},

		buildBreadcrumbPath: function (objPath) {
			var pathArr = [];
			objPath.forEach(function (el, idx) {
				if (idx > 0) {
					pathArr.push(
						el.label
							.replace('<p class="delete-node-btn" />', '')
							.replace('<p class="delete-node-btn"/>', '')
					);
				}
			});
			return pathArr.join(' ' + '\u2192' + ' ');
		},

		fillBreadcrumbContainer: function (breadcrumbContainer, text) {
			if (text) {
				breadcrumbContainer.lastChild.textContent = text;
			}
		}
	};

	dojo.setObject('Izenda.UI.Widgets.Breadcrumbs', breadcrumbs);
});
