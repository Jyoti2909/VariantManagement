var ViewerAgent = function () {
	this.activeViewer = null;
	var comparisonManager = null;
	var self = this;
	var viewManager = null;
	var tooltopStr = '{0} (page {1}) from {2} v{3}';
	var discussionFeed = null;

	this.onMarkupModeActivateHandler = function () {};
	this.onViewModeActivateHandler = function () {};
	this.markupCheckbox = function () {};

	var tabsControl = null;
	Object.defineProperty(this, 'tabsControl', {
		get: function () {
			if (tabsControl === null) {
				tabsControl = parent.getViewersTabs();
			}
			return tabsControl;
		}
	});

	Object.defineProperty(this, 'comparisonManager', {
		get: function () {
			if (comparisonManager === null) {
				VC.Utils.Page.LoadModules(['ComparisonManager']);
				comparisonManager = new VC.ComparisonManager();
			}
			return comparisonManager;
		}
	});

	Object.defineProperty(this, 'viewManager', {
		get: function () {
			if (viewManager === null) {
				viewManager = parent.getViewManager();
			}
			return viewManager;
		}
	});

	Object.defineProperty(this, 'discussionFeed', {
		get: function () {
			if (discussionFeed === null) {
				discussionFeed = parent.getDiscussionPanel().discussionFeed;
			}
			return discussionFeed;
		}
	});

	this.getTopArgs = function () {
		var args = this.tabsControl
			.getTabById(tabsControl.getCurrentTabId())
			.getChildren()[0].args.params;
	};

	this.initTemporaryViewer = function (loaderName, args) {
		var temporaryViewerTooltip = 'Comparison of ';
		for (var i = 0; i < self.comparisonManager.fileList.length; i++) {
			var fileInfo = self.comparisonManager.fileList[i];
			var fileName = fileInfo.fileName;
			if (fileName.lastIndexOf('.') > 0) {
				fileName = fileName.substring(0, fileName.lastIndexOf('.'));
			}

			temporaryViewerTooltip += tooltopStr.Format(
				fileName,
				fileInfo.filePage,
				fileInfo.mhitemName,
				fileInfo.fileVersion
			);
			if (i !== this.comparisonManager.fileList.length - 1) {
				temporaryViewerTooltip += ' and ';
			}
		}

		// We should clone original viewer's arguments which are needed for Secure Massages creation
		var viewerArgs = self.tabsControl
			.getTabById(tabsControl.getCurrentTabId())
			.getChildren()[0].args.params;
		var params = Object.create(viewerArgs, {
			fileInfo1: { value: self.comparisonManager.fileList[0] },
			fileInfo2: { value: self.comparisonManager.fileList[1] },
			settings: { value: {} },
			maxZoom: { value: args.maxZoom },
			diffVersion: { value: args.diffVersion },
			fromSnapshot: { value: args.fromSnapshot },
			viewStateData: { value: args.viewStateData }
		});

		//create widget on the tear-off dojo window context
		VC.Utils.registerModulePaths(parent);
		parent.dojo.require('Scripts/' + loaderName);
		parent.require(['dojo/ready'], function (ready) {
			ready(function () {
				var viewer = new parent.ComparisonLoader({
					baseClass: 'dijitContentPaneNoPadding',
					style: 'height:100%;width:100%;',
					params: params
				});

				self.showTemporaryViewer(
					viewer,
					'sidebarIconComparison',
					temporaryViewerTooltip,
					VC.Utils.GetResource('cv_hasnotbeensaved')
				);
			});
		});
	};
	this.showTemporaryViewer = function (
		viewer,
		sidebarButtonClass,
		tooltip,
		lostMessage
	) {
		const newTabId = parent.aras.generateNewGUID();
		const sidebar = parent.getSidebar();

		let tabsControl;
		if (parent.getViewersTabs) {
			tabsControl = parent.getViewersTabs();
		} else {
			const mainWin = parent.aras.getCurrentWindow();
			tabsControl = mainWin.getViewersTabs();
		}

		const sidebarTempButton = {
			id: newTabId,
			iconClass: sidebarButtonClass,
			label: tooltip
		};
		sidebar.addChild(sidebarTempButton);

		tabsControl.createTab(viewer, newTabId);
		const tab = tabsControl.getTabById(newTabId);
		tabsControl.selectTab(newTabId);
		parent.isTempViewerShown = true;
		sidebar.setWidgetSelected(tab);
		tabsControl.onPreSelectTab = function () {
			if (!tabsControl.getTabById(newTabId)) {
				sidebar.removeChild(sidebarTempButton);
				return false;
			}
			if (parent.aras.confirm(lostMessage, parent) !== true) {
				return true;
			}
			tabsControl.closeTab(newTabId);
			sidebar.removeChild(sidebarTempButton);
			tabsControl.onPreSelectTab = function () {};
			return false;
		};
		return newTabId;
	};

	// IR-033425 "SSVC: Scrolled state of PDF is not saved when reopen viewer"
	this.handleScrollState = function (args) {
		var viewStateData = args.viewStateData;
		var docViewerEl = args.docViewerEl;

		if (self.tabsControl) {
			curTab = self.tabsControl.getTabById(self.tabsControl.getCurrentTabId());

			if (curTab) {
				curTab.onTabEnabled = function () {
					var scroll_top = viewStateData.getValue('scroll_top');
					if (scroll_top !== '') {
						docViewerEl.scrollTop = scroll_top;
					}

					var scroll_left = viewStateData.getValue('scroll_left');
					if (scroll_left !== '') {
						docViewerEl.scrollLeft = scroll_left;
					}
				};
			}
		}
	};

	this.getVariable = function (variableName) {
		var variable = parent.aras.getItemFromServerByName(
			'Variable',
			variableName,
			'value,default_value'
		);
		var returnValue = null;

		if (variable) {
			returnValue = variable.getProperty('value');

			if (!returnValue) {
				returnValue = variable.getProperty('default_value');
			}

			if (!returnValue) {
				returnValue = null;
			}
		}

		return returnValue;
	};

	this.getBooleanVariable = function (variableName) {
		return this.getVariable(variableName) === '1';
	};

	this.sendMeasurmentMessage = function (smProperties) {
		var secureMessage = SSVC.ArasHelper.newDefaultMarkupMessage(smProperties);

		if (self.discussionFeed) {
			self.discussionFeed.refreshPanel();
		}
	};

	this.setHighlightText = function (message) {
		if (self.discussionFeed && message) {
			var input = self.getToolbarCommentArea();
			input.focus();
			input.innerText = message;
		}
	};

	this.getDiscussionFeedText = function () {
		var returnedValue = null;

		if (self.discussionFeed) {
			var input = self.getToolbarCommentArea();
			returnedValue = input.innerText;
		}

		return returnedValue;
	};

	this.setDiscussionFeedText = function (value) {
		if (self.discussionFeed && !value) {
			var input = self.getToolbarCommentArea();
			input.innerText = value;
		}
	};

	this.getToolbarCommentArea = function () {
		return self.discussionFeed.domNode.querySelector(
			'.ssvc-toolbar-addComment .ssvc-toolbar-addComment-area'
		);
	};

	this.addComparisonDataToCache = function (data) {
		if (data.updateFromCache) {
			comparisonManager = null;
		}
		var args = self.tabsControl
			.getTabById(tabsControl.getCurrentTabId())
			.getChildren()[0].args.params;

		if (data.currentList) {
			self.comparisonManager.setCurrent(data.currentList);
		} else if (args.fileId === self.comparisonManager.fileList[0].fileId) {
			self.comparisonManager.setCurrent(0);
		}

		self.comparisonManager.setFileProperty(
			'mhitemType',
			args.markupHolderItemtypeName
		);
		self.comparisonManager.setFileProperty('mhitemId', args.markupHolderId);
		self.comparisonManager.setFileProperty(
			'mhitemName',
			parent.item.selectSingleNode('keyed_name').text
		);
		self.comparisonManager.setFileProperty(
			'mhitemConfigId',
			args.markupHolderConfigId
		);
		self.comparisonManager.setFileProperty(
			'fileSelectorId',
			args.fileSelectorId
		);
		self.comparisonManager.setFileProperty('fileName', args.fileName);
		self.comparisonManager.setFileProperty(
			'fileVersion',
			self.getDocumentVersion(
				args.markupHolderItemtypeName,
				args.markupHolderId
			)
		);
		self.comparisonManager.setFileProperty(
			'documentName',
			args.holderKeyedName
		);

		var propertyName = self.getFileSelectorRef(args.fileSelectorId);
		var fileId = self.getPropertyFileId(
			args.markupHolderItemtypeName,
			args.markupHolderConfigId,
			data.fileVersion,
			propertyName
		);
		if (fileId) {
			self.comparisonManager.setFileProperty('fileId', fileId);
			self.comparisonManager.setFileProperty(
				'fileUrl',
				parent.aras.IomInnovator.getFileUrl(
					fileId,
					parent.aras.Enums.UrlType.SecurityToken
				)
			);
		} else {
			self.comparisonManager.setFileProperty('fileId', args.fileId);
		}

		for (var field in data) {
			self.comparisonManager.setFileProperty(field, data[field]);
		}

		return self.comparisonManager;
	};

	this.restoreData = function (fileInfo1, fileInfo2) {
		comparisonManager = null;
		self.comparisonManager.restoreData(fileInfo1, fileInfo2);

		return self.comparisonManager;
	};

	this.getDocumentVersion = function (itemType, itemId) {
		var itm = parent.aras.newIOMItem(itemType, 'get');
		itm.setAttribute('id', itemId);
		itm.setAttribute('select', 'generation');
		itm = itm.apply();

		if (itm.isError()) {
			return null;
		}

		return itm.getProperty('generation');
	};

	this.getPropertyFileId = function (
		itemType,
		itemConfigId,
		generation,
		propertyName
	) {
		if (!generation || !propertyName) {
			return null;
		}

		var itm = parent.aras.newIOMItem(itemType, 'get');
		itm.setAttribute('select', propertyName);
		itm.setProperty('config_id', itemConfigId);
		itm.setProperty('generation', generation);
		itm = itm.apply();

		if (itm.isError()) {
			return null;
		}

		return itm.getProperty(propertyName);
	};

	this.getFileSelectorRef = function (fileSelectorId) {
		if (!fileSelectorId) {
			return null;
		}

		var itm = parent.aras.newIOMItem('FileSelectorTemplate', 'get');
		itm.setAttribute('id', fileSelectorId);
		itm.setAttribute('select', 'reference');
		itm = itm.apply();

		if (itm.isError()) {
			return null;
		}

		var ref = itm.getProperty('reference');
		if (!ref) {
			itm = parent.aras.newIOMItem('FileSelector', 'get');
			itm.setAttribute('id', fileSelectorId);
			itm.setAttribute('select', 'reference');
			itm = itm.apply();

			if (itm.isError()) {
				return null;
			}

			ref = itm.getProperty('reference');
		}

		return ref;
	};

	this.getDocumentVersionsList = function (
		itemType,
		itemConfigId,
		itemVersion,
		fileSelectorId
	) {
		// IR-033191 ITG Viewer:Disable cross-version comparing for relationship file
		// It's enabled only when FileSelectorTemplate.reference or FileSelector.reference contains proprerty's name.
		// The syntax of the reference is the following:
		//  reference := property | relationshipPath(property)
		//  property := {name of property of type Item}
		//  relatinshipPath := relationshipName | relationshipName/relationshipPath
		//  relationshipName := { name of a Relationship Type }
		//   - p1
		//   - R1(p1)
		//   - R1/R2/R3/R4(p1)
		var propertyName = self.getFileSelectorRef(fileSelectorId);
		if (
			!propertyName ||
			propertyName.indexOf('(') !== -1 ||
			propertyName.indexOf(')') !== -1 ||
			propertyName.indexOf('/') !== -1
		) {
			return null;
		}

		var aml =
			"<Item type='" +
			itemType +
			"' action='get' select='generation, " +
			propertyName +
			" (keyed_name)' orderBy='generation'>" +
			'	<config_id>' +
			itemConfigId +
			'</config_id>' +
			"	<generation condition='ne'>" +
			itemVersion +
			'</generation>' +
			"	<id condition='is not'>null</id>" +
			'	<' +
			propertyName +
			'>' +
			"		<Item type='File' action='get'>" +
			"			<file_type condition='in'>'7869D76D50ED4BD4985BECB20B1102F7','7C057517BC7E4C869B6DA6B6E8C2F76B','7093FE421FAB4BD9887FF8B571D48429'</file_type>" +
			'		</Item>' +
			'	</' +
			propertyName +
			'>' +
			'</Item>';
		var itm = parent.aras.newIOMItem(itemType, 'get');
		itm.loadAML(aml);
		itm = itm.apply();

		if (itm.isError()) {
			return null;
		}

		var genArray = [];
		var genCount = itm.getItemCount();
		for (var i = 0; i < genCount; i++) {
			var curItem = itm.getItemByIndex(i);

			genArray.push({
				generation: curItem.getProperty('generation'),
				fileName: curItem
					.getPropertyItem(propertyName)
					.getProperty('keyed_name')
			});
		}

		return JSON.stringify(genArray);
	};
};

dojo.setObject('VC.ViewerAgent', new ViewerAgent());
