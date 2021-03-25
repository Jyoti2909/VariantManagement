require([
	'dojo/_base/declare',
	'dojo/on',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/text!Izenda/Views/Widgets/BaseItemTypeTree.html'
], function (declare, on, _WidgetBase, _TemplatedMixin, template) {
	var aras = TopWindowHelper.getMostTopWindowWithAras(window).aras;
	var baseItemTypeTree = declare([_WidgetBase, _TemplatedMixin], {
		self: null,
		templateString: template,
		tmrBITSearch: null,
		searchingBIT: null,
		lastSearchString: null,

		constructor: function (args) {
			this.args = args;
			this.self = this;
		},

		init: function () {
			var buildedTemplate = this.buildTemplate(this.args.itemTypesList);
			if (this.baseItemTypes.hasChildNodes()) {
				this.baseItemTypes.innerHTML = '';
			}
			this.baseItemTypes.appendChild(buildedTemplate);
			this.setupBaseItemTypesFilter();
			on(this.searchButton, 'click', this.filterBaseItemTypes.bind(this, true));
		},

		buildTemplate: function (itemTypesList) {
			var bldNode = document.createDocumentFragment();
			var tempList = [];
			if (itemTypesList) {
				const items = itemTypesList.getItemsByXPath(aras.XPathResult('/Item'));
				const itemsCount = items.getItemCount();
				for (let i = 0; i < itemsCount; i++) {
					const it = items.getItemByIndex(i);
					const id = it.getProperty('id');
					const label = it.getAttribute('aliasForSsrUI');
					let img = (it.getProperty('open_icon') || '').substr(3);
					if (img === '') {
						img = 'images/DefaultItemType.svg';
					}
					tempList.push({
						id: id,
						i: i,
						img: img,
						label: label
					});
				}
			}
			tempList.sort(function (a, b) {
				if (a.label < b.label) {
					return -1;
				} else if (a.label > b.label) {
					return 1;
				}
				return 0;
			});
			tempList.forEach(
				function (item, idx) {
					bldNode.appendChild(
						this.buildRow(
							item.id,
							item.i,
							item.img,
							item.label,
							this.args.clientUrl
						)
					);
				}.bind(this)
			);

			return bldNode;
		},

		buildRow: function (id, i, imgFileName, label, clientUrl) {
			const rowDiv = document.createElement('div');
			rowDiv.className = 'base-item-type';
			rowDiv.setAttribute('data-itemtypeid', id);

			const radio = document.createElement('span');
			radio.className = 'arasRadioSpec';
			rowDiv.appendChild(radio);

			const img = document.createElement('img');
			img.setAttribute('src', clientUrl + '/' + imgFileName);
			rowDiv.appendChild(img);

			const text = document.createElement('span');
			text.className = 'bit_text';
			text.appendChild(document.createTextNode(label));
			rowDiv.appendChild(text);

			return rowDiv;
		},

		selectBaseItemType: function (event) {
			var node = event.target;
			while (node && !node.classList.contains('base-item-type')) {
				node = node.parentElement;
			}

			if (!node) {
				return;
			}

			if (this.args.onItemTypeClick) {
				this.args.onItemTypeClick(node);
			}
			event.preventDefault();
			event.stopPropagation();
		},

		setupBaseItemTypesFilter: function () {
			// alert("setupBaseItemTypesFilter");
			var cont = this.searchContainer;
			var img = cont.querySelector('img');
			img.alt = Izenda.Utils.GetResource('reportdesigner.bitt_img_search');
			img.src =
				this.args.clientUrl +
				'/modules/aras.innovator.izenda/images/searchicon.png';

			var fld = cont.querySelector('input');
			fld.placeholder = Izenda.Utils.GetResource(
				'reportdesigner.bitt_input_search'
			);
			on(fld, 'keyup', this.setTmrSearch.bind(this));
			on(fld, 'change', this.setTmrSearch.bind(this));
			on(cont.querySelector('img'), 'change', this.setTmrSearch.bind(this));
		},

		setTmrSearch: function (evnt) {
			if (evnt.keyCode == 13) {
				this.forceFilterBaseItemTypes();
				return;
			}
			if (this.searchingBIT) {
				return;
			}
			//uncomment if need autosearch after N ms
			/*if (this.tmrBITSearch) {
					clearTimeout(this.tmrBITSearch);
				}
				this.tmrBITSearch = setTimeout(this.filterBaseItemTypes, 2500);*/
		},

		forceFilterBaseItemTypes: function () {
			this.filterBaseItemTypes(true);
		},

		filterBaseItemTypes: function (force) {
			var bitHLStart = '<div class="highlight-bit-substr">';
			var bitHLEnd = '</div>';

			this.searchingBIT = true;
			var searchString = document
				.querySelector('#itemTypesNProps #search input')
				.value.toUpperCase();
			if (
				!force &&
				(searchString.length < 3 || this.lastSearchString == searchString)
			) {
				return;
			}
			var cont = document.getElementById('baseItemTypes');
			cont.style.visibility = 'hidden';
			var items = document.querySelectorAll('#baseItemTypes .base-item-type');
			for (var i = 0; i < items.length; ++i) {
				var el = items[i];
				var label = el.querySelector('.bit_text');
				label.innerHTML = label.innerHTML
					.replaceAll(bitHLStart, '')
					.replaceAll(bitHLEnd, '');
				var su = label.innerHTML.toUpperCase();
				var ind = su.indexOf(searchString);
				var match = ind > -1;
				el.style.display = match ? 'block' : 'none';

				if (match && searchString.length > 0) {
					var s = label.innerHTML;
					s2 = '';
					var improvedLabel = s.replace(
						new RegExp(searchString, 'ig'),
						bitHLStart + '$&' + bitHLEnd
					);
					label.innerHTML = improvedLabel;
				}
			}
			this.lastSearchString = searchString;
			cont.style.visibility = 'visible';
			this.searchingBIT = false;
		}
	});

	dojo.setObject('Izenda.UI.Widgets.BaseItemTypeTree', baseItemTypeTree);
});
