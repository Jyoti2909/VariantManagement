/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dojo/dom-style',
	'./SimpleTabbar',
	'dojo/has',
	'dijit/layout/ContentPane',
	'Aras/Client/Controls/Experimental/LazyLoaderBase'
], function (
	declare,
	connect,
	DomStyle,
	SimpleTabbar,
	has,
	ContentPane,
	LazyLoaderBase
) {
	//https://bugzilla.mozilla.org/show_bug.cgi?id=548397 - window.getComputedStyle() returns null inside an iframe with display: none
	//add loadIframe for wait loaded iframes
	var CustomSimpleTabbar = declare(SimpleTabbar, {
		loadIframe: null,

		constructor: function (args) {
			this.loadIframe = false;
		},

		selectChild: function (page, animate) {
			if (!this.loadIframe) {
				return this.inherited(arguments);
			}
		},

		isRelationshipTab: function (tabId) {
			if (!tabId) {
				tabId = this.GetSelectedTab();
			}

			const relationshipIframe = document.getElementById(tabId);
			if (!relationshipIframe) {
				return false;
			}
			const frameScc = relationshipIframe.src;
			const isRelGridSrc =
				frameScc.includes('relationshipsGrid.html') ||
				frameScc.includes('relationshipsInfernoGrid.html');
			return isRelGridSrc;
		}
	});

	return declare(
		'Aras.Client.Controls.Experimental.Relationships',
		[ContentPane, LazyLoaderBase],
		{
			args: null,
			relTabbarReady: false,

			constructor: function (args) {
				this.args = args;
			},

			postCreate: function () {
				var args = this.args;
				/*jslint vars:true*/
				var dijitData = {
						id: args.id + '_relTabbar',
						region: 'bottom',
						layoutPriority: 2,
						splitter: false,
						style:
							'height: 100%;' +
							(args.queryString.tabbar === '1' ? '' : 'display:none')
					},
					self = this;
				/*jslint vars:false*/
				this.relTabbar = new CustomSimpleTabbar(
					dijitData,
					args.queryString.tabbar === '1' ? 'container' : undefined
				);
				this.domNode.appendChild(this.relTabbar.domNode);
			},

			_listenFirstIframeLoaded: function () {
				const self = this;
				const firstInitIFrame = this.iframesCollection[this.currTabID];
				if (firstInitIFrame) {
					//if we have at least one tab in relationships, then attach to onload of that tab
					firstInitIFrame.onload = function () {
						self.onloaded();
					};
				} else {
					//if we don't have relationship types on that IT, then signal widget onloaded right now (end of startup)
					//need to use setTimeout because splitter become collapsed into one line and can't be draged
					setTimeout(function () {
						self.onloaded();
					}, 50);
				}
			},

			startup: function () {
				var args = this.args;

				var alwaysViewMode = false,
					exclusionTabs,
					tabbarApplet,
					tabs_root,
					tabNds,
					RelType_ID,
					parent,
					topWindow,
					item,
					itemTypeName,
					itemID,
					queryString,
					iframesCollection,
					isEditMode,
					aras,
					currTabID = '',
					document = null,
					firstInitIFrame = null;
				//+++ to customize relationships.html +++
				//Note: if a custom function returns undefined then the corresponding function is not aborted.
				/*jslint vars:true*/
				var OverriddenFunctions,
					OverriddenFunctionsParams,
					parentOverriddenFunctionsKey = 'RelationshipsOverriddenFunctions';
				/*jslint vars:false*/
				/*
				code example in parent to support customization:
				function myInitItem()
				{
				document.frames['relationships_frame_id'].item = someMyItem;
				return true;
				}
				RelationshipsOverriddenFunctions = new Object();
				RelationshipsOverriddenFunctions['initItem'] = myInitItem;
				*/

				/*jslint vars:true*/
				var relsDivCurHeight,
					relsDivHeight,
					relsSplitterHeight = '5px';

				var self = this;
				/*jslint vars:true*/

				function initOverriddenFunctions() {
					var obj = parent[parentOverriddenFunctionsKey];
					if (obj && typeof obj === 'object') {
						OverriddenFunctions = obj;
					} else if (window.dialogArguments) {
						obj = window.dialogArguments[parentOverriddenFunctionsKey];
						if (obj && typeof obj === 'object') {
							OverriddenFunctions = obj;
						}
					}
				}

				function fireOverriddenFunction(funcName, paramsArr) {
					if (!OverriddenFunctions || typeof OverriddenFunctions !== 'object') {
						return;
					}
					if (paramsArr && !Array.isArray(paramsArr)) {
						return;
					}
					var func = OverriddenFunctions[funcName],
						code = 'OverriddenFunctions["' + funcName + '"](',
						argsStr = '',
						i,
						r;
					if (func && typeof func === 'function') {
						OverriddenFunctionsParams = paramsArr || [];
						if (OverriddenFunctionsParams.length) {
							for (i = 0; i < OverriddenFunctionsParams.length; i++) {
								argsStr += ',OverriddenFunctionsParams[' + i + ']';
							}
						}
						if (argsStr) {
							argsStr = argsStr.substr(1);
						}
						code += argsStr + ');';
						r = eval(code);
						return r;
					}
				}

				//need to rewrite
				function initItem() {
					var fofRes = fireOverriddenFunction('initItem'),
						where,
						dialogArgs;
					if (fofRes !== undefined) {
						item = parent.item;
						return fofRes;
					}
					where = queryString.where;

					const tools = ['formtool', 'workflowtool', 'lifecycletool'];
					if (tools.includes(where)) {
						if (itemTypeName === 'Form') {
							item = topWindow.item;
						} else {
							item = topWindow.item.selectSingleNode(
								'.//Item[@id="' + itemID + '"]'
							);
						}
					} else if (where === 'configureEMail') {
						item = topWindow.item;
						if (itemTypeName === 'State Distribution') {
							item = item.selectSingleNode(
								'Relationships/Item[@type="State EMail" and @id="' +
									itemID +
									'"]'
							);
							itemTypeName = 'State EMail';
						} else if (itemTypeName === 'Transition Distribution') {
							item = item.selectSingleNode(
								'Relationships/Item[@type="Transition EMail" and @id="' +
									itemID +
									'"]'
							);
							itemTypeName = 'Transition EMail';
						}
					} else if (where === 'dialog') {
						dialogArgs =
							window.dialogArguments || topWindow.window.dialogArguments;
						if (dialogArgs) {
							item = dialogArgs.item;
						}
					} else if (where === 'tabview') {
						item = parent.item;
					} else if (where === 'AccessManager') {
						item = topWindow.PermissionItem;
					} else {
						item = aras.getItemById(itemTypeName, itemID, 0);
					}
					if (!item) {
						aras.AlertError(
							aras.getResource('', 'relationships.lost_reference')
						);
						return;
					}
					// Init thisItem - instance of IOM Item
					if (item.node) {
						item = item.node;
					}
					parent.thisItem = aras.IomInnovator.newItem();
					parent.thisItem.dom = item.ownerDocument;
					parent.thisItem.node = item;
				}

				function getFirstEnabledTabID(ignoreParamTab) {
					var fofRes = fireOverriddenFunction('getFirstEnabledTabID', [
							ignoreParamTab
						]),
						i,
						j,
						tab,
						tabID;
					if (fofRes !== undefined) {
						return fofRes;
					}
					if (!tabNds) {
						return '';
					}
					for (i = 0; i < tabNds.length; i++) {
						tab = tabNds[i];
						tabID = tab.getAttribute('id');
						if (tab.selectSingleNode('exclusions')) {
							for (j = 0; j < exclusionTabs.length; j++) {
								if (exclusionTabs[j].id === tabID) {
									if (exclusionTabs[j].enabled) {
										return tabID;
									}
									break;
								}
							}
						} else if (!(ignoreParamTab && tabID === 'Parameters')) {
							return tabID;
						}
					}
					return '';
				}

				function getTabbar() {
					// this function is separate to allow override getTabbar.
					var fofRes = fireOverriddenFunction('getTabbar');
					if (fofRes !== undefined) {
						return fofRes;
					}
					return aras.uiGenerateRelationshipsTabbar(itemTypeName, itemID);
				}

				function updateTabbarState(callerID) {
					/*----------------------------------------
					 * updateTabbarState
					 *
					 * Purpose:
					 * Update state of tabbar (exclusions related update).
					 *
					 * Arguments:
					 * callerID - id of tab (RelationshipType) from which the function was called.
					 *
					 */
					var fofRes = fireOverriddenFunction('updateTabbarState', [callerID]),
						type_name = '',
						fromInd = 0,
						toInd = exclusionTabs.length,
						i,
						j,
						k,
						exclusions,
						excludeID,
						items_on_tab_count,
						plus_count,
						minus_count;
					if (fofRes !== undefined) {
						return fofRes;
					}
					if (!tabbarApplet) {
						return;
					}
					if (callerID === undefined) {
						callerID = '';
					}
					if (callerID) {
						for (i = 0; i < exclusionTabs.length; i++) {
							if (exclusionTabs[i].id === callerID) {
								fromInd = i;
								toInd = i + 1;
								type_name = exclusionTabs[i].type_name;
								break;
							}
						}
						if (!type_name) {
							return;
						}
					}
					// +++ enable tabs
					if (type_name) {
						exclusions = tabs_root.selectNodes(
							'/tabbar/tab[@id="' +
								exclusionTabs[fromInd].id +
								'"]/exclusions/exclude_tab'
						);
						for (i = 0; i < exclusions.length; i++) {
							excludeID = exclusions.item(i).getAttribute('id');
							for (j = 0; j < exclusionTabs.length; j++) {
								if (exclusionTabs[j].id === excludeID) {
									exclusionTabs[j].enabled = true;
								}
							}
						}
					} else {
						for (j = 0; j < exclusionTabs.length; j++) {
							exclusionTabs[j].enabled = true;
						}
					}
					// ^^^ enable tabs
					// +++ disable tabs
					for (i = fromInd; i < toInd; i++) {
						type_name = exclusionTabs[i].type_name;
						items_on_tab_count = parseInt(
							exclusionTabs[i].relationships_count,
							10
						);
						plus_count = item.selectNodes(
							'Relationships/Item[@type="' +
								type_name +
								'" and (@action="add" or @action="create")]'
						).length;
						minus_count = item.selectNodes(
							'Relationships/Item[@type="' +
								type_name +
								'" and (@action="delete" or @action="purge")]'
						).length;
						items_on_tab_count += plus_count - minus_count;
						if (items_on_tab_count > 0) {
							exclusions = tabs_root.selectNodes(
								'/tabbar/tab[@id="' +
									exclusionTabs[i].id +
									'"]/exclusions/exclude_tab'
							);
							for (j = 0; j < exclusions.length; j++) {
								excludeID = exclusions.item(j).getAttribute('id');
								for (k = 0; k < exclusionTabs.length; k++) {
									if (exclusionTabs[k].id === excludeID) {
										exclusionTabs[k].enabled = false;
									}
								}
							}
						}
					}
					// ^^^ disable tabs
					for (i = 0; i < exclusionTabs.length; i++) {
						tabbarApplet.setTabEnabled(
							exclusionTabs[i].id,
							exclusionTabs[i].enabled
						);
					}
				}

				function getIFrameSrc(tabID) {
					var fofRes = fireOverriddenFunction('getIFrameSrc', [tabID]),
						db,
						where,
						toolbar,
						editMode,
						WorkFlowProc,
						itemType,
						RelationshipView,
						url = '',
						parameters = '',
						qs,
						form,
						grid,
						parameters_res = '',
						bDoAddParams2Url = false;
					if (fofRes !== undefined) {
						return fofRes;
					}
					db = queryString.db;
					where = queryString.where;
					toolbar = queryString.toolbar;
					const isEditMode = self.isEditMode;
					editMode =
						isEditMode === 1 || isEditMode === true || isEditMode === '1'
							? 1
							: 0;
					WorkFlowProc = queryString.WorkFlowProc;
					if (tabID === 'Parameters') {
						qs =
							'?db=' +
							db +
							'&ITName=' +
							itemTypeName +
							'&itemID=' +
							itemID +
							'&editMode=' +
							editMode +
							'&toolbar=' +
							toolbar +
							'&where=' +
							where;
						window.LocationSearches[tabID] = qs;
						return 'parametersGrid.html';
					}
					itemType = aras.getRelationshipType(tabID);
					if (!itemType) {
						return 'blank.html';
					}
					RelationshipView = aras.uiGetRelationshipView4ItemTypeEx(
						itemType.node
					);
					if (RelationshipView) {
						form = aras.getItemProperty(RelationshipView, 'form');
						grid = aras.getItemProperty(RelationshipView, 'grid');
						if (form) {
							url = 'ShowFormInFrame.html';
							parameters =
								"'formId=" +
								form +
								'&formType=' +
								(editMode ? 'edit' : 'view') +
								"'";
						} else if (grid) {
							url = 'ConfigurableGrid.html';
							parameters = "'grid=" + grid + "'";
							bDoAddParams2Url = true;
						} else {
							url = aras.getItemProperty(RelationshipView, 'start_page');
							parameters = aras.getItemProperty(RelationshipView, 'parameters');
							bDoAddParams2Url = true;
						}
					}
					if (url === '') {
						url = aras.getScriptsURL() + 'relationshipsInfernoGrid.html';
					}
					if (parameters === '') {
						parameters =
							"'db='+db+'&ITName='+itemTypeName+'&itemID='+itemID+'&relTypeID='+tabID+'&editMode='+editMode+'&toolbar='+toolbar+'&where='+where+'&WorkFlowProc='+WorkFlowProc+'&arasCacheControl=NoCache'";
					}
					try {
						parameters_res = eval(parameters);
					} catch (excep) {
						aras.AlertError(
							aras.getResource(
								'',
								'relationships.parameters_not_valid',
								parameters
							)
						);
						return 'blank.html';
					}

					if (bDoAddParams2Url) {
						url += '?' + parameters_res;
					} else {
						window.LocationSearches[tabID] = '?' + parameters_res;
					}

					return url;
				}

				function registerShortcuts(event) {
					/*----------------------------------------
					 * registerShortcuts
					 *
					 * Purpose:
					 * Registers shortcuts for window
					 *
					 * Arguments: Event
					 *
					 */
					var aWindow = event.target.defaultView;
					var loadParams = {
						locationName: 'ItemWindowRelationshipsShortcuts',
						item_classification: '%all_grouped_by_classification%'
					};
					var settings = {
						windows: [aWindow],
						context: aWindow,
						registerChildFrames: true
					};
					topWindow.cui.loadShortcutsFromCommandBarsAsync(loadParams, settings);

					if (topWindow !== aWindow) {
						if (topWindow.ITEM_WINDOW) {
							topWindow.ITEM_WINDOW.registerStandardShortcuts(
								aWindow,
								true,
								true
							);
						}

						if (topWindow.returnBlockerHelper) {
							topWindow.returnBlockerHelper.attachBlocker(aWindow);
						}
					}
				}

				function iframeLoading() {
					var iframes = this.contentWindow.document.querySelectorAll('iframe'),
						loadIframe = false;
					Array.prototype.forEach.call(iframes, function (iframe) {
						if (iframe.contentWindow.document.readyState !== 'complete') {
							loadIframe = true;
						}
					});
					if (loadIframe) {
						window.setTimeout(iframeLoading.bind(this), 100);
					} else {
						tabbarApplet.loadIframe = false;
					}
				}

				// creates "spinner" in current container because it makes dynamically
				function showSpinner(container) {
					var spinnerId = 'dimmer_spinner_relship';
					var isSpinnerExist = aras.browserHelper.toggleSpinner(
						container,
						true,
						spinnerId
					);

					if (isSpinnerExist) {
						return;
					}

					var spinner = document.createElement('iframe');

					spinner.id = 'dimmer_spinner_relship';
					spinner.className = 'aras-hide';
					spinner.src = '../scripts/spinner.html';
					spinner.style.border = '0';

					container.appendChild(spinner);
				}

				function onTab(tabID) {
					var fofRes = fireOverriddenFunction('onTab', [tabID]);

					if (fofRes !== undefined) {
						return fofRes;
					}
					if (!tabID || currTabID === tabID) {
						return;
					}

					var prevIFrame = currTabID ? iframesCollection[currTabID] : null,
						newIFrame = iframesCollection[tabID],
						iframeSrc,
						onTabSelected;

					currTabID = tabID;
					if (prevIFrame) {
						prevIFrame.style.display = 'none';

						if (
							prevIFrame.contentWindow &&
							prevIFrame.contentWindow.searchContainer
						) {
							prevIFrame.contentWindow.searchContainer.onEndSearchContainer();
						}
					}

					if (!newIFrame) {
						var spinnerContainer =
							self.relTabbar.containerNode || newIFrame.parentElement.document;

						iframeSrc = getIFrameSrc(tabID);
						newIFrame = document.getElementById(tabID);

						if (newIFrame) {
							showSpinner(spinnerContainer);
							newIFrame.src = iframeSrc;
						} else {
							newIFrame = document.createElement('iframe');
							newIFrame.setAttribute('id', tabID);
							newIFrame.setAttribute('src', iframeSrc);
							newIFrame.setAttribute('frameBorder', '0');
							newIFrame.setAttribute('width', '100%');
							newIFrame.setAttribute('height', '100%');
							newIFrame.setAttribute('scrolling', 'no');
							newIFrame.style.display = 'block';
							newIFrame.style.position = 'absolute';

							/*jslint nomen: true*/
							if (tabbarApplet) {
								tabbarApplet.selectTab(tabID);
								tabbarApplet._getTab(tabID).domNode.appendChild(newIFrame);
							} else {
								document.body.appendChild(newIFrame);
							}

							showSpinner(spinnerContainer);

							//register shortcuts
							var onDOMContentLoadedHandler = function (e) {
								newIFrame.contentWindow.removeEventListener(
									'DOMContentLoaded',
									onDOMContentLoadedHandler
								);
								registerShortcuts(e);
							};
							newIFrame.contentWindow.addEventListener(
								'DOMContentLoaded',
								onDOMContentLoadedHandler,
								false
							);
							/*jslint nomen: false*/

							// Handler hides "spinner" every time on (re)load iframe
							// in the window where the script will be included
							var onLoadHandler = function () {
								aras.browserHelper.toggleSpinner(
									spinnerContainer,
									false,
									'dimmer_spinner_relship'
								);
							};

							window.addEventListener(
								'unload',
								function () {
									newIFrame.removeEventListener('load', onLoadHandler);
								},
								false
							);
							newIFrame.addEventListener('load', onLoadHandler);

							//https://bugzilla.mozilla.org/show_bug.cgi?id=548397 - window.getComputedStyle() returns null inside an iframe with display: none
							if (tabbarApplet && has('ff')) {
								tabbarApplet.loadIframe = true;
								newIFrame.addEventListener('load', iframeLoading, false);
							}
						}
						iframesCollection[tabID] = newIFrame;
					}

					newIFrame.style.display = '';
					onTabSelected = newIFrame.contentWindow.onTabSelected;

					if (onTabSelected) {
						onTabSelected();
					}
					if (newIFrame.contentWindow.searchContainer) {
						newIFrame.contentWindow.searchContainer.onStartSearchContainer();
					}

					if (!newIFrame._isIframeResized) {
						const isIframeLoaded = !!(
							newIFrame.contentDocument.body &&
							newIFrame.contentDocument.body.firstChild
						);
						if (isIframeLoaded) {
							newIFrame._isIframeResized = true;
							newIFrame.contentWindow.dispatchEvent(new CustomEvent('resize'));
						}
					}
				}

				function initRelTabbar(tabId) {
					/*----------------------------------------
					 * initRelTabbar
					 *
					 * Purpose:
					 * Initialize tabbar for relationships grid
					 *
					 * Arguments: none
					 *
					 */
					var fofRes = fireOverriddenFunction('initRelTabbar'),
						i,
						tab,
						tabInfo,
						doShowCurTab,
						doNotIgnoreParamTab,
						firstTabID;
					if (fofRes !== undefined) {
						return fofRes;
					}
					if (!tabbarApplet) {
						return;
					}
					tabs_root = getTabbar();
					tabNds = tabs_root.selectNodes('/tabbar/tab');
					for (i = 0; i < tabNds.length; i++) {
						tab = tabNds[i];
						if (tab.selectSingleNode('exclusions') !== null) {
							tabInfo = {};
							tabInfo.id = tab.getAttribute('id');
							tabInfo.relationships_count = parseInt(
								tab.getAttribute('relationships_in_db'),
								10
							);
							tabInfo.type_name = tab.getAttribute('type_name');
							tabInfo.enabled = true;
							exclusionTabs.push(tabInfo);
						}
						var paramTabProperties = null;
						if (tab.getAttribute('id') === 'Parameters') {
							paramTabProperties = aras.uiIsParamTabVisibleEx(
								item,
								itemTypeName
							);
							doShowCurTab = paramTabProperties.show;
						} else {
							doShowCurTab = true;
						}
						if (!paramTabProperties || paramTabProperties.mode !== '0') {
							tabbarApplet.addTab(
								tab.getAttribute('id'),
								tab.getAttribute('label')
							);
						}
						if (!doShowCurTab) {
							tabbarApplet.setTabVisible(tab.getAttribute('id'), false);
						}
					}
					updateTabbarState();
					if (tabId) {
						firstTabID = tabId;
					} else {
						doNotIgnoreParamTab = aras.uiIsParamTabVisible(item, itemTypeName);
						firstTabID = getFirstEnabledTabID(!doNotIgnoreParamTab);
					}
					if (firstTabID) {
						onTab(firstTabID);
					}
				}

				function initIframesCollection(currIFrameID) {
					var fofRes = fireOverriddenFunction('initIframesCollection', [
							currIFrameID
						]),
						iframeID,
						frm;
					if (fofRes !== undefined) {
						return fofRes;
					}
					if (!iframesCollection) {
						iframesCollection = {};
					}

					for (iframeID in iframesCollection) {
						if (iframesCollection.hasOwnProperty(iframeID)) {
							if (!currIFrameID || iframeID !== currIFrameID) {
								frm = iframesCollection[iframeID];
								frm.src = 'blank.html';
								aras.deletePropertyFromObject(iframesCollection, iframeID);
							}
						}
					}
				}

				function initialize(queryStringData) {
					exclusionTabs = [];
					window.LocationSearches = window.LocationSearches || {};
					tabs_root = null;
					tabNds = null;
					item = null;
					itemTypeName = null;
					itemID = null;
					iframesCollection = null;
					isEditMode = false;
					OverriddenFunctions = {};
					OverriddenFunctionsParams = null;
					currTabID = '';

					queryString = queryStringData;
					isEditMode = queryStringData.editMode;
					RelType_ID = queryStringData.relTypeID;

					if (alwaysViewMode) {
						isEditMode = false;
					}
					itemID = queryString.itemID;
					itemTypeName = queryString.ITName;
					initOverriddenFunctions();
					initItem();
					initIframesCollection();
				}

				function initTabbar(tabbar) {
					if ('1' === queryString.tabbar) {
						tabbarApplet = tabbar;
						tabbarApplet.onClick = onTab;
						initRelTabbar(queryString.relTypeID);
					} else if ('' !== queryString.relTypeID) {
						onTab(queryString.relTypeID);
					}
				}

				if (args.relationshipsGridAlwaysViewMode) {
					alwaysViewMode = true;
				}

				parent = args.window;
				aras = parent.aras;
				topWindow = aras.getMostTopWindowWithAras(parent);
				document = args.window.document;
				initialize(args.queryString);
				/*jslint vars:true*/
				var fofRes = fireOverriddenFunction('onload_handler');
				/*jslint vars:false*/
				if (fofRes !== undefined) {
					return fofRes;
				}

				if (args.queryString.tabbar !== '1') {
					this.domNode.style.display = 'none';
				}

				Object.defineProperty(this, 'item', {
					get: function () {
						return item;
					}
				});
				Object.defineProperty(this, 'itemTypeName', {
					get: function () {
						return itemTypeName;
					}
				});
				Object.defineProperty(this, 'isEditMode', {
					get: function () {
						return isEditMode;
					},
					configurable: true
				});
				Object.defineProperty(this, 'iframesCollection', {
					get: function () {
						return iframesCollection;
					}
				});
				Object.defineProperty(this, 'currTabID', {
					get: function () {
						return currTabID;
					},
					configurable: true
				});

				connect.connect(this.relTabbar, 'startup', function () {
					self.relTabbarReady = true;
					initTabbar(this);
				});
				this.inherited(arguments);

				this.setViewMode = function (updatedItem) {
					var fofRes = fireOverriddenFunction('setViewMode', [updatedItem]),
						currIFrame;
					if (fofRes !== undefined) {
						return fofRes;
					}
					initItem();
					isEditMode = false;
					initIframesCollection(currTabID);
					currIFrame = iframesCollection[currTabID];
					if (
						currIFrame &&
						currIFrame.contentWindow &&
						currIFrame.contentWindow.setViewMode
					) {
						currIFrame.contentWindow.setViewMode(item);
					}
				};
				this.setEditMode = function (updatedItem) {
					var fofRes = fireOverriddenFunction('setEditMode', [updatedItem]),
						currIFrame;
					if (fofRes !== undefined) {
						return fofRes;
					}
					initItem();
					isEditMode = true;
					if (alwaysViewMode) {
						isEditMode = false;
					}
					initIframesCollection(currTabID);
					currIFrame = iframesCollection[currTabID];
					if (
						currIFrame &&
						currIFrame.contentWindow &&
						currIFrame.contentWindow.setEditMode
					) {
						currIFrame.contentWindow.setEditMode(item);
					}
				};
				this.updateTabbarState = function (callerID) {
					updateTabbarState(callerID);
				};

				this.reload = function (queryStringData) {
					queryString = queryStringData;
					this.relTabbar.clear();
					initialize(queryStringData);
					initTabbar(this.relTabbar);
				};

				this._initItem = initItem;
				this._fireOverriddenFunction = fireOverriddenFunction;
				this._getIFrameSrc = getIFrameSrc;
				this._registerShortcuts = registerShortcuts;
				this.getFirstEnabledTabID = getFirstEnabledTabID;

				this.hide = function () {
					relsDivCurHeight = DomStyle.get(this.domNode, 'height');
					relsDivHeight = relsDivCurHeight
						? relsDivCurHeight + 'px'
						: relsDivHeight;

					DomStyle.set(this.domNode, 'visibility', 'hidden');
					DomStyle.set(this.domNode, 'height', '0px');
					if (this._splitterWidget) {
						DomStyle.set(this._splitterWidget.domNode, 'visibility', 'hidden');
						DomStyle.set(this._splitterWidget.domNode, 'height', '0px');
					}
				};

				this.show = function () {
					DomStyle.set(this.domNode, {
						visibility: 'visible',
						height: relsDivHeight
					});
					if (this._splitterWidget) {
						DomStyle.set(this._splitterWidget.domNode, {
							visibility: 'visible',
							height: relsSplitterHeight
						});
					}
				};

				this._listenFirstIframeLoaded();
			}
		}
	);
});
