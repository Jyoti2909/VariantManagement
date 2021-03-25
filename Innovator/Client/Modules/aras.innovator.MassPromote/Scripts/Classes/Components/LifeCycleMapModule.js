define([
	'dojo/_base/declare',
	'MassPromote/Scripts/Classes/Controls/Dropdown'
], function (declare, Dropdown) {
	return declare('MassPromote.LifeCycleMapModule', null, {
		_controlEnabled: true,

		constructor: function (mediator, lifeCycleMapProvider) {
			this._mediator = mediator;
			this._initControls();
			this._lifeCycleMapProvider = lifeCycleMapProvider;
		},

		update: function (items) {
			if (!this._controlEnabled) {
				return;
			}

			var itemTypeIds = this._getUniqueItemTypesIds(items);
			var lifeCycleMaps = this._lifeCycleMapProvider
				.getLifeCycleMapsByTypeIds(itemTypeIds)
				.sort(this._sortLifeCycleMaps);

			this._comboBox.setData(lifeCycleMaps);

			if (lifeCycleMaps.length === 1 && !this.getCurrent()) {
				this._comboBox.selectElement(lifeCycleMaps[0].id);
			}

			if (lifeCycleMaps.length === 0) {
				this._setButtonState(false);
			}

			this._setVisibility(lifeCycleMaps.length !== 1);
		},

		_setVisibility: function (isVisible) {
			document
				.getElementById('lifeCycleMap')
				.classList.toggle('aras-hide', !isVisible);
		},

		_sortLifeCycleMaps: function _sortLifeCycleMaps(a, b) {
			if (a.name < b.name) {
				return -1;
			}
			if (a.name > b.name) {
				return 1;
			}
			return 0;
		},

		_getUniqueItemTypesIds: function _getUniqueItemTypesIds(items) {
			var itemTypesIds = items.map(function (el) {
				return el.getAttribute('typeId');
			});

			var uniqItemIds = itemTypesIds.filter(function (el, position, array) {
				return array.indexOf(el) === position;
			});

			return uniqItemIds;
		},

		getCurrent: function () {
			// return current lifecyclemap object, which contains name and id
			return this._comboBox.getSelectedObject();
		},

		freeze: function () {
			// disable module
			this._controlEnabled = false;
			this._comboBox.setDisabled(true);
		},

		_initControls: function () {
			this._setHeaderLabel();
			var self = this;

			this._comboBox = new Dropdown({
				connectId: 'lifeCycleMapSelect',
				placeholder: this._mediator.getResource('dropdown_select'),
				store: [],
				onchange: function (element) {
					self._setButtonState(!!element);
					self._mediator.onLifeCycleChanged({ selectedItem: element });
				}
			});

			this._showLifeCycleMapButton = document.getElementById(
				'showLifeCycleMapButton'
			);
			this._showLifeCycleMapButton.addEventListener(
				'click',
				self._onShowLifeCycleMapButton.bind(this)
			);
			this._setButtonState(false);
			this._loadIcons();
		},

		_setButtonState: function (enabled) {
			this._showLifeCycleMapButton.classList.toggle(
				'aras-compat-toolbar_disabled',
				!enabled
			);
		},

		_onShowLifeCycleMapButton: function () {
			if (
				!this._showLifeCycleMapButton.classList.contains(
					'aras-compat-toolbar_disabled'
				)
			) {
				const lifeCycleMapId = this._comboBox.getSelectedObject().id;

				this.onViewLifeCycleMapTrigger({
					lifeCycleMapId: lifeCycleMapId
				});
			}
		},

		_loadIcons: function () {
			const svgIcon = this._showLifeCycleMapButton.firstElementChild;
			const url = '../images/ViewLifecycleMap.svg';
			ArasModules.SvgManager.load([url]).then(function () {
				let svgId = ArasModules.SvgManager.getSymbolId(url);
				if (svgId) {
					svgId = '#' + svgId;
					svgIcon.firstElementChild.setAttribute('href', svgId);
				}
			});
		},

		onViewLifeCycleMapTrigger: function (overrides) {
			const params = {
				aras: aras,
				lifeCycleMapId: null,
				item: null,
				title: aras.getResource(
					'',
					'lifecycledialog.lc',
					aras.getKeyedNameEx(item)
				),
				dialogHeight: 400,
				dialogWidth: 600,
				resizable: true,
				content: 'LifeCycleDialog.html',
				disabledPromotion: true
			};

			Object.assign(params, overrides);
			window.ArasModules.Dialog.show('iframe', params);
		},

		_setHeaderLabel: function () {
			const moduleElement = document.getElementById('lifeCycleMap');
			const header = moduleElement.getElementsByClassName(
				'mpo-settings-module-header'
			)[0];
			header.textContent = this._mediator.getResource('life_cycle_map');
		}
	});
});
