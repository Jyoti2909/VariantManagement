require([
	'dojo/request/xhr',
	'dojo/dom-construct',
	'dojo/dom-style',
	'dojo/on',
	'dojo/query',
	'dojo/dom-attr'
], function (xhr, domConstruct, domStyle, on, query, domAttr) {
	var aras = TopWindowHelper.getMostTopWindowWithAras(window).aras;
	var resourceUrl = '../Modules/aras.innovator.Izenda/';

	var utils = {
		propertyNamingTemplate: '[innovator].[{0}].[{1}]{2}',
		clientUrl: '',
		getDefaultMetadataObject: function () {
			return {
				breadcrumbs: {}
			};
		},
		GetThumbnailUrl: function (fileId) {
			return aras.IomInnovator.getFileUrl(
				fileId,
				aras.Enums.UrlType.SecurityToken
			);
		},

		fireCustomEvent: function (name) {
			var event; // The custom event that will be created

			if (document.createEvent) {
				event = document.createEvent('HTMLEvents');
				event.initEvent(name, true, true);
			} else {
				event = document.createEventObject();
				event.eventType = name;
			}

			event.eventName = name;

			if (document.createEvent) {
				document.dispatchEvent(event);
			} else {
				document.fireEvent('on' + event.eventType, event);
			}
		},

		FireOnchange: function (el) {
			if ('createEvent' in document) {
				var evt = document.createEvent('HTMLEvents');
				evt.initEvent('change', false, true);
				el.dispatchEvent(evt);
			} else {
				el.fireEvent('onchange');
			}
		},

		GetResource: function (key) {
			return aras.getResource(resourceUrl, key);
		},

		GetMyReportsWindow: function () {
			try {
				if (window.opener && window.opener.main) {
					const mainwindow = window.opener.main;
					if (
						mainwindow.work &&
						mainwindow.work.location.href.toLowerCase().indexOf('/myreports?') >
							-1
					) {
						return mainwindow.work;
					}
				}
			} catch (ex) {
				return undefined;
			}
		},

		improveSelectInput: function (selectEl) {
			if (!selectEl.classList.contains('sys_f_select')) {
				if (domAttr.has(selectEl, 'onchange')) {
					domAttr.set(
						selectEl,
						'data-callback',
						domAttr.get(selectEl, 'onchange')
					);
				}
				selectEl.classList.add('sys_f_select');
				var newSelectBlock = selectEl.parentNode.insertBefore(
					document.createElement('div'),
					selectEl
				);
				newSelectBlock.classList.add('ssvc-toolbar-mode');
				newSelectBlock.classList.add('sys_f_div_select');
				newSelectBlock.style.cssText = selectEl.parentNode.style.cssText;
				newSelectBlock.appendChild(selectEl);
				var span = document.createElement('span');
				if (selectEl.selectedIndex !== -1) {
					span.textContent =
						selectEl.options[selectEl.selectedIndex].textContent;
				}
				span.classList.add('sys_f_span_select');
				newSelectBlock.appendChild(span);
			} else {
				if (selectEl.selectedIndex !== -1) {
					selectEl.nextSibling.textContent =
						selectEl.options[selectEl.selectedIndex].textContent;
				}
			}
		},

		unimproveSelectInput: function (inputEl) {
			if (inputEl.classList.contains('sys_f_select')) {
				domConstruct.destroy(inputEl.nextSibling);
				var insertedEl = inputEl.parentElement.parentElement.insertBefore(
					inputEl,
					inputEl.parentElement
				);
				domConstruct.destroy(insertedEl.nextSibling);
				insertedEl.classList.remove('sys_f_select');
			}
		},

		unimproveSelectInputs: function (container, selector) {
			query(selector, container).forEach(function (element, idx) {
				utils.unimproveSelectInput(element);
			});
		},

		setCheckboxState: function (checkbox, state) {
			checkbox.checked = state;
			var changeEvent = document.createEvent('Event');
			changeEvent.initEvent('change', false, true);
			checkbox.dispatchEvent(changeEvent);
		},

		improveCheckbox: function (checkboxEl) {
			if (!checkboxEl.parentNode.classList.contains('aras-form-boolean')) {
				var labelNode = document.createElement('label');
				checkboxEl.parentNode.replaceChild(labelNode, checkboxEl);
				labelNode.classList.add('aras-form-boolean');
				labelNode.appendChild(checkboxEl);
				labelNode.appendChild(document.createElement('span'));
			}
		},

		improveCheckboxes: function (container, selector) {
			query(selector, container).forEach(function (el, idx) {
				utils.improveCheckbox(el);
			});
		},

		unimproveCheckboxes: function (container, selector) {
			query(selector, container).forEach(function (checkboxEl) {
				var labelNode = checkboxEl.parentNode;
				labelNode.parentNode.replaceChild(checkboxEl, labelNode);
			});
		},

		improveSelectInputs: function (container, selector) {
			query(selector, container).forEach(function (el, idx) {
				utils.improveSelectInput(el);
			});
			on(container, 'select.sys_f_select:change', utils.selectInputOnChange);
		},

		improveInnovatorSelectWithEllipsis: function (el, onEllipsisClickFunction) {
			var div = el.parentNode;
			if (!div.classList.contains('sys_f_div_select')) {
				return;
			}
			div.setAttribute('ellipsis_select', '1');
			var spanArray = div.getElementsByClassName('sys_f_span_select');
			spanArray[0].onclick = onEllipsisClickFunction;
		},

		generateIzendaStyleHeaderElement: function (title) {
			var th = document.createElement('th');
			th.classList.add('iz-label');
			var span = document.createElement('span');
			span.appendChild(document.createTextNode(title));
			th.appendChild(span);
			return th;
		},

		fixHeaders: function (thead) {
			var headers = thead.children;
			for (var i = 0; i < headers.length; i++) {
				var prev = headers[i];
				if (prev.tagName.toUpperCase() !== 'TH') {
					var th = document.createElement('th');
					var attributes = prev.attributes;
					for (var j = 0; j < attributes.length; j++) {
						var attr = attributes[j];
						th.setAttribute(attr.name, attr.value);
					}
					var children = prev.children;
					while (children.length > 0) {
						th.appendChild(children[0]);
					}
					th.classList.add('iz-label');

					thead.replaceChild(th, prev);
				}
			}
		},

		removeEllipsisFromInnovatorSelect: function (el) {
			var div = el.parentNode;
			if (!div.classList.contains('sys_f_div_select')) {
				return;
			}
			div.setAttribute('ellipsis_select', '0');
			var spanArray = div.getElementsByClassName('sys_f_span_select');
			spanArray[0].onclick = null;
		},

		selectInputOnChange: function (evt) {
			if (this.selectedIndex === -1) {
				return;
			}
			var innovatorSelectVisiblePlaceholder = this.parentNode.querySelector(
				'.sys_f_span_select'
			);
			if (innovatorSelectVisiblePlaceholder) {
				innovatorSelectVisiblePlaceholder.textContent = this.options[
					this.selectedIndex
				].textContent;
			}
			if (this.boundBreadcrumbContainer && this.boundMetadata) {
				Izenda.UI.Widgets.Breadcrumbs.fillBreadcrumbContainer(
					this.boundBreadcrumbContainer,
					this.boundMetadata[this.options[this.selectedIndex].value]
				);
			}
		},

		improveButtons: function (container) {
			query(".iz-button, button, input[type='button']", container).forEach(
				function (el, idx) {
					domStyle.set(el, 'background-color', '');
					el.classList.add('btn');
				}
			);
		},

		improvePopupDialog: function (title, callback) {
			var wholeDialog = jq$('body > div.izenda-vis-tooltip')[0];
			var stdCloseIcon = wholeDialog.getElementsByClassName('close-button')[0];
			var stdTitle = wholeDialog.getElementsByClassName('title')[0];
			stdTitle.textContent = title;

			//hide standard close button
			stdCloseIcon.style.display = 'none';

			var popupCloseIcon = document.createElement('img');
			popupCloseIcon.src = this.clientUrl + '/images/ic-close.svg';
			popupCloseIcon.classList.add('popupCloseIcon');

			stdTitle.appendChild(popupCloseIcon);

			if (callback) {
				on(popupCloseIcon, 'click', function (e) {
					callback();
				});
			}
		},

		showReportingStructurePopup: function (title, RSdata, inputEl, callback) {
			var widget = new Izenda.UI.Widgets.ReportingStructure({
				selectorType: 'radio',
				onBottomPanelRowSelectedCallback: function (propertiesList, isDelete) {
					var keys = Object.keys(propertiesList);
					for (var i = 0; i < 1; i++) {
						var key = keys[i];
						var properties = propertiesList[key];
						inputEl.value = key;
						utils.FireOnchange(inputEl);
						if (inputEl.selectedIndex !== -1) {
							inputEl.nextSibling.textContent =
								inputEl.options[inputEl.selectedIndex].textContent;
						}
						ReportingServices.hideTip();
						if (callback) {
							callback(properties);
						}
					}
				},
				isLazySelect: true,
				dblclickEnabled: true,
				inputEl: inputEl,
				clientUrl: this.clientUrl,
				buttonText: Izenda.Utils.GetResource('reportingstructure.OK')
			});

			domStyle.set(widget.borderContainer.domNode, 'height', '400px');
			domStyle.set(widget.borderContainer.domNode, 'width', '250px');
			widget.init();
			widget.reloadTree(RSdata);
			ReportingServices.showModal(
				widget.domNode,
				utility.defaults({
					movable: true,
					showCaption: true
				})
			);
			utils.improvePopupDialog(title, ReportingServices.hideTip);
			widget.startup();
			widget.borderContainer.resize();
		},

		// extends with before and/or after function calls
		extendMethodWithFuncs: function (funcToExtend, funcBefore, funcAfter) {
			if (funcToExtend.isOverriden) {
				return funcToExtend;
			}
			var oldFunc = funcToExtend;
			funcToExtend = function extendsInit() {
				if (funcBefore) {
					funcBefore.apply(this, arguments);
				}
				var result = oldFunc.apply(this, arguments);
				if (funcAfter) {
					funcAfter.apply(this, arguments);
				}
				return result;
			};
			funcToExtend.isOverriden = true;
			return funcToExtend;
		},

		//in additionalCallback func 'this' is 'arguments' of funcToExtend
		extendAsyncMethodWithFunc: function (
			funcToExtend,
			additionalCallback,
			idxOfLegacyCallback
		) {
			if (funcToExtend.isOverriden) {
				return funcToExtend;
			}

			funcToExtend = (function (old) {
				function extendsInit() {
					var tempArgs = arguments;
					if (tempArgs[idxOfLegacyCallback]) {
						tempArgs[idxOfLegacyCallback] = utils.extendMethodWithFuncs(
							tempArgs[idxOfLegacyCallback],
							null,
							additionalCallback.bind(tempArgs)
						);
					}
					old.apply(this, tempArgs);
				}
				return extendsInit;
			})(funcToExtend);
			funcToExtend.isOverriden = true;
			return funcToExtend;
		},

		getAras: function () {
			return aras;
		},

		submitFormByAjax: function (formId, callback) {
			var jq$frm = jq$('#aspnetForm');
			// TODO: Combine url like in other places.
			var action = jq$frm.attr('action');
			var search = action.replace('ReportDesigner.aspx?', '');
			var searchParams = new URLSearchParams(search);

			// actualize access token
			// in case of POST request OAuth access token should pass via header and avoid of its presence in url
			searchParams.delete('access_token');
			const authorizationHeader = aras.OAuthClient.getAuthorizationHeader();

			xhr(location.pathname + '?' + searchParams.toString(), {
				data: jq$frm.serialize(),
				preventCache: true,
				headers: authorizationHeader,
				method: 'POST',
				sync: true
			}).then(function (data) {
				if (callback) {
					callback();
				}
			});
		},

		getI18NText: function (key) {
			return utils
				.getAras()
				.getResource('../Modules/aras.innovator.Izenda', key);
		},

		getItemTypeProperties: function (
			itemTypesWithPropsToSelect,
			itemTypesAdditionalData,
			skipItemTypeProperties
		) {
			var body = '';
			if (skipItemTypeProperties) {
				body = '<skipItemTypeProperties>true</skipItemTypeProperties>';
			}

			if (itemTypesWithPropsToSelect.length > 0) {
				body += '<Relationships>';
			}
			itemTypesWithPropsToSelect.forEach(function (item, idx) {
				var itemTypeId = item.itemTypeId;
				var propsToSelect = item.properties;
				body += "<Item type='ItemType' id='" + itemTypeId + "'>";
				if (propsToSelect) {
					body += '<props_to_select>' + propsToSelect + '</props_to_select>';
				}
				body += '</Item>';
			});

			if (itemTypesWithPropsToSelect.length > 0) {
				body += '</Relationships>';
			}

			var constructedData = {};
			if (body) {
				var itemTypes = aras.applyMethod('GetItemTypeProperties', body);
				var resDom = XmlDocument();
				resDom.loadXML(itemTypes);

				var resIOMItem = aras.newIOMItem();
				resIOMItem.nodeList = resDom.selectNodes("//Item[@type='ItemType']");

				for (var i = 0; i < resIOMItem.getItemCount(); i++) {
					var itemType = resIOMItem.getItemByIndex(i);

					var instanceData = itemType.getProperty('instance_data');
					var typeLabel = itemType.getProperty('label');
					var typeName = itemType.getProperty('name');
					var itemTypeId = itemType.getProperty('id');

					var propertiesArr = [];
					var properties = itemType.getRelationships('Property');
					var additionalData = itemTypesAdditionalData[itemTypeId];
					for (var j = 0; j < properties.getItemCount(); j++) {
						var prop = properties.getItemByIndex(j);
						var propObj = {};
						propObj.name = prop.getProperty('name');
						propObj.isHidden = prop.getProperty('is_hidden');
						propObj.label = prop.getProperty('label');
						propObj.typeId = prop.getProperty('typeId');
						propObj.dataType = prop.getProperty('data_type');
						propObj.typeLabel = typeLabel;
						propObj.typeName = typeName;
						propObj.instanceData = instanceData;
						propObj.id = prop.getProperty('id');
						if (additionalData) {
							var keys = Object.keys(additionalData);
							for (var k = 0; k < keys.length; k++) {
								propObj[keys[k]] = additionalData[keys[k]];
							}
						}

						propertiesArr.push(propObj);
					}

					propertiesArr.sort(function (a, b) {
						var aLabelForSort = a.label || a.name;
						var bLabelForSort = b.label || b.name;
						if (aLabelForSort > bLabelForSort) {
							return 1;
						} else if (aLabelForSort < bLabelForSort) {
							return 0;
						}
						return;
					});

					constructedData[itemTypeId] = propertiesArr;
				}
			}
			return constructedData;
		},

		improveReportLinks: function (clientUrl, accessRights) {
			var container = document.getElementById('renderedReportDiv');
			var evt = '.ReportTable a:click';

			if (!container) {
				container = document;
			}

			on(container, evt, function (e) {
				var target = e.target || e.srcElement;
				if (target && target.href) {
					//handle opening in popup window
					// We should to ignore of JSHint verification for this code because
					// the value for the href attribute is generated by Izenda and we cannot affect this.
					/* jshint -W107 */
					if (target.href === 'javascript:void(0)') {
						return true;
					}
					/* jshint +W107 */
					var partUrl = target.href.substring(target.href.indexOf('&master'));
					var noMasterUrl = target.href.replace(partUrl, '');
					//noMasterUrl = noMasterUrl.replace("(AUTO)_", "").replace("(SELF", "");
					var pos = noMasterUrl.lastIndexOf(')');
					var subReportId = noMasterUrl.substring(pos, pos - 32); //32 - guid length;

					if (!clientUrl) {
						clientUrl = '&CLIENTURL=' + encodeURIComponent(utils.clientUrl); // CLIENTURL
					}

					var accessRights = ''; // AccessRights
					var url =
						'ReportViewer.aspx?rn=' +
						subReportId +
						'&itemid=' +
						subReportId +
						'&access_token=' +
						aras.OAuthClient.getToken() +
						'&ITEMTYPEMODE=itm_all' +
						clientUrl +
						'&' +
						partUrl;

					//handle opening in current window
					if (target.target === '') {
						target.href = url;
						return true;
					}

					//handle opening in new window
					if (target.target === '_blank') {
						var report = aras.getItemFromServer(
							'SelfServiceReport',
							subReportId
						);
						var win = aras.targetReport(report.node, 'service', url, '', true);
						win.getItem = function () {
							return report.node;
						};
					}
				}

				e.preventDefault();
				e.stopPropagation();
				return false;
			});
		},

		getOperatingLastRow: function (tabName) {
			var operatingTab = Izenda.UI.Widgets.TabsAggregator.getTab(tabName);
			var rightContentTbody = query(
				'#ctl00_PlaceHolder_Adhocreportdesigner1_ctl01_sc',
				operatingTab.rightPanelContent
			).children('tbody')[0];
			return rightContentTbody.rows[rightContentTbody.rows.length - 1];
		},

		getOperatingLastRowSelect: function (tabName) {
			return query('td select', utils.getOperatingLastRow(tabName))[0];
		},

		processImages: function () {
			var imageClickHandler = function () {
				var styles = this.style;

				styles.height = styles.height ? null : '20px';
				styles.width = styles.width ? null : '20px';
			};
			var makeUrlString = function (imagePath) {
				// check if image has vault server url
				if (imagePath.indexOf('=File:') > 0) {
					// if it's so get image url with token from innovator server
					var fileId = imagePath.split('=File:')[1];
					return aras.IomInnovator.getFileUrl(
						fileId,
						parent.aras.Enums.UrlType.SecurityToken
					);
				} else {
					// if it isn't so concatenate clientUrl and image url
					return imagePath.replace(
						'?__REPLACE_TEXT_WITH_CLICKABLE_IMAGE20x20__',
						''
					);
				}
			};
			var imageLinks = jq$(
				'a[href*="__REPLACE_TEXT_WITH_CLICKABLE_IMAGE20x20__"]'
			);

			if (imageLinks.length > 0) {
				var currentLink = null;
				var imageSrc = '';
				var imageElement = null;
				var tdElement = null;

				for (var i = 0; i < imageLinks.length; i++) {
					currentLink = imageLinks[i];
					imageSrc = makeUrlString(currentLink.href);
					imageAlt = currentLink.textContent;
					tdElement = currentLink.parentNode;
					imageElement = Izenda.Utils.createImageElement(
						imageSrc,
						imageAlt,
						imageClickHandler
					);
					tdElement.removeChild(currentLink);
					tdElement.appendChild(imageElement);
				}
			}
		},

		createImageElement: function (srcValue, altValue, imageClickHandler) {
			var imageElement = document.createElement('img');

			imageElement.src = srcValue;
			imageElement.alt = altValue;
			imageElement.onclick = imageClickHandler;

			imageElement.style.height = '20px';
			imageElement.style.width = '20px';
			imageElement.style.cursor = 'pointer';

			return imageElement;
		},

		createReportTableMutationObserver: function (reportDiv) {
			var observer = new MutationObserver(function (mutations) {
				mutations.forEach(function (mutation) {
					if (mutation.addedNodes !== null) {
						// If there are new nodes added
						var reportTables = jq$('.ReportTable');
						if (reportTables.length > 0) {
							Izenda.Utils.processImages();
						}
					}
				});
			});
			// Configuration of the observer:
			var config = {
				childList: true
			};
			observer.observe(reportDiv, config);
		},

		setViewOfActionSectionInTableWithFields: function (rowTDs, clientUrl) {
			var countOfColumns = rowTDs.length;
			var deleteImg = rowTDs[countOfColumns - 7].firstChild;
			var insertRowAboveImg = rowTDs[countOfColumns - 6].firstChild;
			var insertRowBelowImg = rowTDs[countOfColumns - 5].firstChild;
			var advancedSettingImg = rowTDs[countOfColumns - 4].firstChild;
			var advancedSettingTable = rowTDs[countOfColumns - 3].firstChild;
			var dragDropImg = rowTDs[countOfColumns - 2].firstChild;
			//last column is hidden service column FldId

			//change order of action icons
			rowTDs[countOfColumns - 7].appendChild(advancedSettingImg);
			rowTDs[countOfColumns - 4].appendChild(deleteImg);

			//Hide InsertAfter/Below action icons
			domStyle.set(insertRowAboveImg.parentElement, 'display', 'none');
			domStyle.set(insertRowBelowImg.parentElement, 'display', 'none');
			domStyle.set(insertRowAboveImg, 'display', 'none');
			domStyle.set(insertRowBelowImg, 'display', 'none');

			//hide advanced setting table
			domStyle.set(advancedSettingTable.parentElement, 'display', 'none');
			domStyle.set(advancedSettingTable, 'display', 'none');

			//beautify drag and drop
			domStyle.set(dragDropImg.parentElement, 'display', 'none');
			domStyle.set(dragDropImg, 'display', 'none');
			domAttr.remove(dragDropImg.parentElement, 'name');

			//change action images
			// advanced-settings highlighs changes from default
			let advSetImgName = 'advanced-settings.png';
			if (advancedSettingImg.src.endsWith('image=advanced-settings-dot.png')) {
				advSetImgName = 'advanced-settings-dot.png';
			}
			advancedSettingImg.src =
				clientUrl + '/modules/aras.innovator.izenda/images/' + advSetImgName;
			deleteImg.src = clientUrl + '/images/Delete.svg';
		},

		createReportExtension: function (
			itemTypeMode,
			selectedItemTypes,
			metaData
		) {
			var escape = ArasModules.xml.escape;
			return (
				'<ReportSetExtension xmlns="http://schemas.datacontract.org/2004/07/Aras.Izenda.Reporting" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">' +
				'<ClientData>' +
				'<InnovatorReportMetadata>' +
				escape(metaData) +
				'</InnovatorReportMetadata>' +
				'<ItemTypeMode>' +
				escape(itemTypeMode) +
				'</ItemTypeMode>' +
				'<SelectedItemTypes>' +
				escape(selectedItemTypes) +
				'</SelectedItemTypes>' +
				'</ClientData>' +
				'<ReportExtensions i:nil="true" xmlns:d2p1="http://schemas.microsoft.com/2003/10/Serialization/Arrays" />' +
				'</ReportSetExtension>'
			);
		},

		/**
		 * Localization for divNode. Does localization for all spans in all div tags by
		 * itemTypeId. Function getLocalizedLabelFunction must accept 2 string params -
		 * itemTypeId and default value for case if no localization in DB for this item type.
		 *
		 * @param {element} divNode
		 * @param {Function} getLocalizedLabelFunction
		 */
		selectedItemTypeLocalization: function (
			divNode,
			getLocalizedLabelFunction
		) {
			if (!divNode || !getLocalizedLabelFunction) {
				return divNode.parentNode.xml;
			}

			var getNodeValueByXpath = function (node, xPath, defValue) {
				var value;
				var findedNode = ArasModules.xml.selectSingleNode(node, xPath);
				if (findedNode) {
					value = findedNode.getAttribute('data-value');
				}
				return value || defValue || '';
			};

			var itemTypeId = getNodeValueByXpath(
				divNode,
				"label[@data-key='itemTypeId']",
				''
			);
			if (itemTypeId) {
				var span = ArasModules.xml.selectSingleNode(divNode, 'span');

				if (span && span.childNodes.length > 0) {
					for (var i = 0; i < span.childNodes.length; i++) {
						var spanChild = span.childNodes[i];
						if (spanChild.nodeType === 3) {
							//3 - text
							var suffix = getNodeValueByXpath(
								divNode,
								"label[@data-key='countSuffix']",
								''
							);
							var columnName = getNodeValueByXpath(
								divNode,
								"label[@data-key='columnName']",
								''
							);
							var label = getLocalizedLabelFunction(
								itemTypeId,
								spanChild.nodeValue
							);
							spanChild.nodeValue = columnName
								? columnName + ' (' + label + ')' + suffix
								: label + suffix;
							break;
						}
					}
				}
			}

			var divArray = ArasModules.xml.selectNodes(divNode, 'div');
			for (var j = 0; j < divArray.length; j++) {
				this.selectedItemTypeLocalization(
					divArray[j],
					getLocalizedLabelFunction
				);
			}

			return divNode.parentNode.xml;
		},

		showCalendar: function (element) {
			const elementId = element.previousSibling.id;
			const param = {
				date: element.previousSibling.value,
				aras: Izenda.Utils.getAras(),
				format: Izenda.Utils.getAras().getDotNetDatePattern('short_date')
			};
			param.type = 'Date';
			const dialog = window.parent.ArasModules.Dialog.show('iframe', param);
			return dialog.promise.then(function (newDate) {
				document.getElementById(elementId).value = newDate || '';
			});
		}
	};
	dojo.setObject('Izenda.Utils', utils);
});

//Extensions
if (!String.prototype.Format) {
	String.prototype.Format = function () {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function (match, number) {
			return typeof args[number] !== 'undefined' ? args[number] : '';
		});
	};
}

function format() {
	return arguments[0].Format.apply(
		arguments[0],
		Array.prototype.splice.call(arguments, 1, arguments.length - 1)
	);
}

function escapeAttributeValue(input) {
	if (!input) {
		return input;
	}
	return input
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
