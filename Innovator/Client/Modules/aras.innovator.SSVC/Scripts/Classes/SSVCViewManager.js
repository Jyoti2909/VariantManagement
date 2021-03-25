function promisifiedRequire(requiredModules) {
	return new Promise(function (resolve, reject) {
		require(requiredModules, function () {
			// Resolve the arguments as an array.
			resolve(Array.prototype.slice.call(arguments, 0));
		}, reject);
	});
}

function getViewersData(filesForViewing) {
	function processFile(file) {
		const viewerData = {
			params: {
				fileId: file.id,
				...file
			},
			viewer: { ...file.viewer }
		};
		viewersData.push(viewerData);
	}

	const viewersData = [];

	filesForViewing.forEach((files) => {
		files.forEach(processFile);
	});
	return viewersData;
}
const ssvcViewManager = {
	// params = {
	//   fileId, fileSelectorTypeId, fileSelectorId,
	//   fileName,
	//   markupHolderId, markupHolderItemtypeName, markupHolderConfigId, markupHolderKeyedName
	// }
	createViewer: function (module, viewerName, params) {
		params._fileUrl = null;
		params.itemWindow = window;
		const argsForWidget = {
			baseClass: 'dijitContentPaneNoPadding',
			style: 'height:100%;width:100%;',
			params: params
		};
		Object.defineProperty(params, 'fileUrl', {
			get: function () {
				// 'tgvd_id' is set in VC_SelectDynamicAssemblyFile server method which is called
				// from appropriate FileSelectorTemplate assigned to particular item type.
				// Presence of 'tgvd_id' means that dynamic assembly file is returned for dynamic viewer.
				// Dynamic assembly file is fake file item, because no real file exists.
				// So, fake URL "DynamicCadAssemblyFileUrl" is used for such files.
				if (this.tgvdId) {
					this._fileUrl = 'DynamicCadAssemblyFileUrl';
					return this._fileUrl;
				} else if (this._fileUrl && isUrlValid(this._fileUrl)) {
					return this._fileUrl;
				} else {
					this._fileUrl = getNewFileUrl(this.fileId);
					return this._fileUrl;
				}
				function isUrlValid(fileUrl) {
					const xmlhttp = aras.XmlHttpRequestManager.CreateRequest();
					xmlhttp.open('GET', fileUrl, false);
					xmlhttp.send(null);
					if (xmlhttp.status !== 200) {
						return false;
					} else {
						return true;
					}
				}
				function getNewFileUrl(fileId) {
					return aras.IomInnovator.getFileUrl(
						fileId,
						aras.Enums.UrlType.SecurityToken
					);
				}
			},
			set: function (newValue) {
				this._fileUrl = newValue;
			},
			enumerable: true,
			configurable: true
		});
		const requireViewerPromise = new Promise(function (resolve, reject) {
			require([module + '/' + viewerName], function (Viewer) {
				const result = new Viewer(argsForWidget);
				resolve(result);
			});
		});
		return requireViewerPromise;
	},

	//args = { isVisible: ... , sidebar: ... , discussionContainer: ..., isSSVCEnabled: bool }
	setDiscussionPanel: async function (args) {
		let discussionPanel = getDiscussionPanel();
		const discussionContainer = args.discussionContainer;
		let isVisible = args.isVisible;

		if (discussionPanel) {
			const panelArgs = discussionPanel.args;

			if (panelArgs.isVisible !== isVisible) {
				// If visibility argument differs from disscussionPanel initial visibility then it should be applied
				// to support case: panel with 'Discussion On' is hidden for new items, but should be opened after save
				panelArgs.isVisible = isVisible;
			} else {
				// In other case it should be ignored and discussion panel current visibility state should be taken
				isVisible = discussionPanel.visible();
			}
		}

		const toolbar = await window.tearOffMenuController.when(
			'ToolbarInitialized'
		);
		const discussionButton =
			toolbar &&
			toolbar.getActiveToolbar().getItem('ssvc_discussion_button')[
				'_item_Experimental'
			];

		const discussionPanelArgs = {
			aras: args.aras,
			itemID: itemID,
			itemTypeName: itemTypeName,
			item: getIOMItem()
		};

		if (discussionPanel) {
			discussionPanel.reload(discussionPanelArgs);
		} else {
			const modules = await promisifiedRequire([
				'SSVC/Scripts/Controls/DiscussionPanel'
			]);
			const DiscussionPanel = modules[0];
			discussionPanel = new DiscussionPanel({
				id: 'discussion',
				isVisible: isVisible,
				style: 'width:100%; height:100%;',
				params: discussionPanelArgs
			});
		}
		discussionContainer.appendChild(discussionPanel.domNode);

		discussionPanel.onResize = function () {
			if (
				discussionButton &&
				discussionButton.domNode &&
				discussionPanel.visible() !==
					discussionButton.domNode.classList.contains(
						'ssv-button-activeDisscussion'
					)
			) {
				discussionButton.domNode.classList.toggle(
					'ssv-button-activeDisscussion'
				);

				const isOpening = discussionButton.domNode.classList.contains(
					'ssv-button-activeDisscussion'
				);
				const prefixResource = isOpening ? 'hide' : 'show';
				const btnTitle = aras.getResource(
					'',
					'ssvc.' + prefixResource + '_dpanel'
				);
				discussionButton.setLabel(btnTitle);
				discussionButton.titleNode.setAttribute('title', btnTitle);
			}
		};

		if (isVisible) {
			const ssvcSplitter = document.getElementById('ssvc-splitter');
			ssvcSplitter.style.display = 'block';
			discussionContainer.style.display = 'block';
			discussionPanel.show();
			const centerContainer = dijit.byId('CenterBorderContainer');
			if (centerContainer) {
				centerContainer.resize();
			}

			const relationshipsContainer = dijit.byId('centerMiddle');
			if (relationshipsContainer) {
				relationshipsContainer.resize();
				window.dispatchEvent(new CustomEvent('resize'));
			}
		}
	},

	//args = { tabContainer: ... , viewObjects: ... }
	setTabs: async function (args) {
		const tabContainer = args.tabContainer;
		const viewObjects = args.viewObjects;
		const tabsPromises = [];
		viewObjects.forEach((viewObject) => {
			const viewerParams = viewObject.params;
			let viewerPromise = this.createViewer(
				viewObject.viewer.module,
				viewObject.viewer.name,
				viewerParams
			);
			viewerPromise = viewerPromise.then(function (viewer) {
				tabContainer.createTab(viewer, viewerParams.fileId);
			});
			tabsPromises.push(viewerPromise);
		});

		const dispatchTabsLoadedEvent = function () {
			const event = document.createEvent('Event');
			event.initEvent('ssvcSideBarTabsLoaded', true, false);
			document.dispatchEvent(event);
		};
		await Promise.all(tabsPromises).then(dispatchTabsLoadedEvent);
	},

	//args =
	//	{
	//		dataManager: ...,
	//		discussionContainer: ... ,
	//		isSSVCEnabled: ...,
	//		aras: ...
	//	}
	// TODO: IR-052075 "SSVC: viewManager.fillContainers double called on opening SSVC"
	fillContainers: async function (args) {
		const discussionContainer = args.discussionContainer;
		const filesForViewing = args.dataManager.getFilesForViewing();
		const viewSettings = args.dataManager.getSsvcFormViewSettings();

		await this.setDiscussionPanel({
			isVisible: viewSettings.discussionPanel && args.isSSVCEnabled,
			discussionContainer: discussionContainer,
			isSSVCEnabled: args.isSSVCEnabled,
			aras: args.aras
		});

		const viewers = dijit.byId('viewers');
		const viewObjects = getViewersData(filesForViewing);

		await this.setTabs({
			tabContainer: viewers,
			viewObjects: viewObjects
		});
	},

	//args =
	//	{
	//		sidebarContainer: ... ,
	//		tabContainer: ...
	//	}
	clearContainers: async function (args) {
		const tabContainer = args.tabContainer;
		const viewersChildren = tabContainer.getChildren();
		for (const child of viewersChildren) {
			// don't close fixed tabs
			if (
				child.id !== 'formTab' &&
				!(
					child.declaredClass === 'Tab' &&
					child.getChildren()[0].get('fixedSidebarButtonId')
				)
			) {
				if (child.declaredClass === 'Tab') {
					tabContainer.closeTab(child.id);
				}
				child.destroyRecursive();
			}
		}
	},
	getViewerInfoById: async function (id) {
		const dataManager = window.dataManager;
		const files = dataManager.getFilesForViewing();
		for (const [, viewerFiles] of files) {
			if (viewerFiles.has(id)) {
				return viewerFiles.get(id).viewer;
			}
		}

		const serverUrl = aras.getServerBaseURL();
		const odataPath = `odata/File('${id}')/file_type/View With?$select=id&$expand=related_id($select=viewer_url)`;

		const response = await ArasModules.fetch(serverUrl + odataPath);
		const data = await response.json();

		if (!data?.value) {
			return;
		}

		for (const viewer of data.value) {
			const viewerUrl = viewer?.related_id?.viewer_url;
			if (viewerUrl) {
				const url = new URL(viewerUrl);
				const searchParams = url.searchParams;
				const viewerInfo = {
					module: searchParams.get('module'),
					name: searchParams.get('name')
				};
				return viewerInfo;
			}
		}
	}
};

export default ssvcViewManager;
