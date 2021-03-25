var LocationSearches = {};

var item = window.opener[paramObjectName].item;
var itemID = window.opener[paramObjectName].itemID;
var itemTypeName = window.opener[paramObjectName].itemTypeName;
var itemType = window.opener[paramObjectName].itemType;
var viewMode = window.opener[paramObjectName].viewMode;
var isEditMode = window.opener[paramObjectName].isEditMode;
var isTearOff = window.opener[paramObjectName].isTearOff;
var isNew = window.opener[paramObjectName].isNew;
var itemTypeLabel = window.opener[paramObjectName].itemTypeLabel;
var databaseName = window.opener[paramObjectName].databaseName;
var isSSVCEnabled = window.opener[paramObjectName].isSSVCEnabled;
var reserveSpaceForSidebar =
	window.opener[paramObjectName].reserveSpaceForSidebar;
var formHeight = window.opener[paramObjectName].formHeight;
var formWidth = window.opener[paramObjectName].formWidth;
window.opener[paramObjectName] = undefined;
var viewManager = null;
var topWindow = aras.getMostTopWindowWithAras(window);

const isCuiLayout = !!window.CuiLayout;
if (!isCuiLayout && (aras.isTempEx(item) || aras.isLockedByUser(item))) {
	isEditMode = true;
}

var windowStateObject = {
	isVisible: true,
	state: 'tabs on',

	resizeContainer: function () {
		var rels = dijit.byId('centerMiddle');
		if (
			!rels ||
			!document.getElementById('formContentPane').offsetHeight ||
			rels.domNode.offsetHeight < 30 ||
			this.state === 'tabs on'
		) {
			return;
		}
		this.state = 'tabs on';
		rels.domNode.classList.remove('centerMiddle__hidden');
		var tabs = document.getElementById('tabs-container');
		tabs.classList.remove('tabs__hidden');

		this.updateButtons();
		rels._layout();
	},

	setExpand: function () {
		this.state = 'tabs max';

		var rels = dijit.byId('centerMiddle');
		if (!rels) {
			return;
		}

		const isCuiLayout =
			!rels || rels.domNode.closest('.aras-item-view__relationship-accordion');

		rels.domNode.classList.remove('centerMiddle__hidden');
		var tabs = document.getElementById('tabs-container');
		tabs.classList.remove('tabs__hidden');
		document.getElementById('formContentPane').style.height = isCuiLayout
			? ''
			: '0';

		if (!rels) {
			return;
		}

		const relationshipIframe = document.getElementById(relationships.currTabID);
		const relationshipsGrid = relationshipIframe.contentWindow.grid;

		rels.resize();

		if (relationshipsGrid) {
			relationshipsGrid.grid_Experimental.update();
		}
	},

	setCollapse: function () {
		var that = this;
		require(['dojo/dom-geometry'], function (domGeom) {
			if (that.isVisible) {
				that.state = 'tabs min';
			}
			var bc = document.getElementById('CenterBorderContainer');
			var lc = document.getElementById('formContentPane');
			var rels = dijit.byId('centerMiddle');
			var relsTabBar = dijit.byId('centerMiddle_relTabbar');
			var tabs = document.getElementById('tabs-container');
			const isCuiLayout = that.isVisible && Boolean(window.layout);

			if (rels) {
				rels.domNode.classList.toggle('centerMiddle__hidden', !isCuiLayout);
				tabs.classList.toggle('tabs__hidden', !isCuiLayout);
			}

			var btns = document.getElementById('relationshipExpandButtons');

			var boxBc = domGeom.getContentBox(bc);
			const boxBtns = btns && domGeom.getContentBox(btns);
			const h = boxBc.h - ((that.isVisible && boxBtns && boxBtns.h + 8) || 0);
			lc.style.height = isCuiLayout ? '' : h + 'px';

			if (!relsTabBar) {
				return;
			}

			const relationshipIframe = document.getElementById(
				relationships.currTabID
			);
			const relationshipsGrid = relationshipIframe.contentWindow.grid;

			relsTabBar.resize();

			if (relationshipsGrid) {
				relationshipsGrid.grid_Experimental.update();
			}
		});
	},

	setHidden: function () {
		// should be called only from SimpleTabContainer.js when we switched between tabs (in a left sideBar) to remember current state of tabs in a form
		this.isVisible = false;
		const formSplitter = document.getElementById('form-splitter');

		if (formSplitter) {
			formSplitter.classList.add('aras-hide');
		}

		this.setCollapse();
	},

	setVisible: function () {
		// should be called only from SimpleTabContainer.js when we switched between tabs to restore state of tabs in a form
		this.isVisible = true;
		const formSplitter = document.getElementById('form-splitter');

		if (formSplitter) {
			formSplitter.classList.remove('aras-hide');
		}

		switch (this.state) {
			case 'tabs min':
				this.setCollapse();
				break;
			case 'tabs max':
				this.setExpand();
				break;
			case 'tabs on':
				this.setNormal();
				break;
			default:
				throw new Error(
					"Cannot make tabs visible when the state is 'tabs off'"
				);
		}

		this.updateButtons();
	},

	setNormal: function () {
		this.state = 'tabs on';

		const rels = dijit.byId('centerMiddle');
		const lc = document.getElementById('formContentPane');
		if (!rels) {
			if (isCuiLayout) {
				lc.style.height = '';
			} else {
				lc.style.height = '100%';
			}
			return;
		}

		rels.domNode.classList.remove('centerMiddle__hidden');
		var tabs = document.getElementById('tabs-container');
		tabs.classList.remove('tabs__hidden');

		var form = dijit.byId('form');
		if (!form) {
			const relationshipIframe = document.getElementById(
				relationships.currTabID
			);
			const relationshipGrid = relationshipIframe.contentWindow.grid;
			rels.resize();

			if (relationshipGrid) {
				relationshipGrid.grid_Experimental.update();
			}
			return;
		}
		var formSize = form.getFormSize();
		lc.style.height = formSize.h + 'px';
		rels.resize();
	},

	setOff: function () {
		this.state = 'tabs off';
	},

	resizeByState: function () {
		if (this.state === 'tabs max') {
			this.setExpand();
		} else if (this.state === 'tabs min' || this.isVisible === false) {
			this.setCollapse();
		}
	},

	updateButtons: function () {
		var that = this;
		require(['dojo/dom-class'], function (domClass) {
			var expandBtn = dijit.byId('expandBtn');
			var collapseBtn = dijit.byId('collapseBtn');
			var normalBtn = dijit.byId('normalBtn');

			if (!expandBtn || !collapseBtn || !normalBtn) {
				return;
			}
			switch (that.state) {
				case 'tabs on':
					domClass.remove(expandBtn.domNode, 'dijitHidden');
					domClass.remove(collapseBtn.domNode, 'dijitHidden');
					domClass.add(normalBtn.domNode, 'dijitHidden');
					break;
				case 'tabs max':
					domClass.remove(collapseBtn.domNode, 'dijitHidden');
					domClass.remove(normalBtn.domNode, 'dijitHidden');
					domClass.add(expandBtn.domNode, 'dijitHidden');
					break;
				case 'tabs min':
					domClass.remove(expandBtn.domNode, 'dijitHidden');
					domClass.remove(normalBtn.domNode, 'dijitHidden');
					domClass.add(collapseBtn.domNode, 'dijitHidden');
					break;
			}
		});
	}
};

window.addEventListener('load', function () {
	require(['dijit/Tooltip'], function () {
		new dijit.Tooltip({
			connectId: ['expandBtn', 'collapseBtn', 'normalBtn'],
			getContent: function (node) {
				var text = aras.getResource('', 'Tearoff.showTab');
				if (node.id === 'collapseBtn') {
					text = aras.getResource('', 'Tearoff.minimizeTabs');
				} else if (node.id === 'expandBtn') {
					text = aras.getResource('', 'Tearoff.maximizeTabs');
				}
				return '<span style="white-space: nowrap;">' + text + '</span>';
			}
		});
	});
});

var relationshipsGridInfoProvider = {
	getInstance: function (relshipsGridId) {
		return this;
	},
	getMenu: function () {
		return window.tearOffMenuController;
	},
	waitForMenu: true
};

var statusbar;
var relationships;
var relationshipsControl;

(function () {
	const resizeByState = function () {
		windowStateObject.resizeByState();
	};

	const loadWidgetsListener = function () {
		const tabContainer = dijit.byId('viewers');
		if (tabContainer) {
			tabContainer.startup();
		}

		createSplitters();

		const centerMiddle = dijit.byId('centerMiddle');
		if (centerMiddle) {
			centerMiddle.resize();
		}

		resizeByState();
		window.addEventListener('resize', resizeByState);

		turnWindowReadyOn();

		if (window.layout) {
			initViewersTabs();
		}
		aras.browserHelper.toggleSpinner(document, false);
	};

	document.addEventListener('loadWidgets', loadWidgetsListener);
})();
