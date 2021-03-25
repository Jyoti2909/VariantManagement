require([
	'dojo',
	'dojox',
	'dojo/on',
	'dojo/has',
	'dojo/_base/sniff',
	'dojo/_base/Color'
], function (dojo, dojox, on, has, sniff, Color) {
	var VC = {};
	var aras = parent.aras;

	dojo.setObject('VC.Utils', {
		StaticStr: {
			fillShapeRgbValue: 'rgba(255, 255, 255, 0)',
			namespaceURI: 'http://www.w3.org/2000/svg',
			textFontFamily: 'Arial',

			undefinedToolbarError: 'Undefined toolbar type',
			unfoundViewerToolbarsNodeError:
				"The main node 'viewerToolbars' was not found in xml file",
			unfoundHandlerError:
				"Xml is not suitable for javascript code. The handler for event '{0}' was not found"
		},

		Constants: {
			radix: 10,

			xmlTags: {
				viewerToolbars: 'viewerToolbars',
				button: 'button'
			},

			htmlTags: {
				div: 'div',
				img: 'img',
				span: 'span',
				select: 'select',
				option: 'option'
			},

			xmlAttributes: {
				name: 'name',
				type: 'type',
				src: 'src',
				tooltip: 'tooltip',
				event: 'event',
				advanced: 'advanced',
				paletteName: 'palettename',
				parentId: 'parent-id'
			},

			htmlAttributes: {
				advanced: 'advanced',
				title: 'title',
				dataDojoAttachPoint: 'data-dojo-attach-point',
				dataDojoAttachEvent: 'data-dojo-attach-event',
				id: 'id',
				src: 'src',
				toolbarName: 'toolbarname',
				swapselection: 'swapselection',
				value: 'value'
			},

			cssClasses: {
				viewerToolbarContainer: 'ViewerToolbarContainer',
				viewerButtonContainer: 'ViewerButtonContainer',
				menuButtonContainer: 'MenuButtonContainer',
				menuViewerContainer: 'MenuViewerContainer',
				menuButton: 'MenuButton',
				toolbarBeginning: 'ToolbarBeginning',
				current: 'Current',
				hiddenClass: 'hidden',
				onlyButtons: 'OnlyButtons'
			},

			nodeTypes: {
				elementNode: 1,
				attributeNode: 2
			}
		},

		Page: {
			AddEvent: function (elem, type, handler) {
				if (elem.addEventListener) {
					elem.addEventListener(type, handler, false);
				} else {
					elem.attachEvent('on' + type, handler);
				}
			},

			RemoveEvent: function (elem, type, handler) {
				if (elem.removeEventListener) {
					elem.removeEventListener(type, handler, false);
				} else {
					elem.detachEvent('on' + type, handler);
				}
			},

			Style: function (stylename, stylestring) {
				this.StyleName = '';
				this.StyleString = '';

				this.addStyle = function () {
					this.StyleName = stylename
						? stylename
						: 'cssClass' + VC.Utils.MakeName(5);
					this.StyleString = stylestring;

					var styleSheets = document.styleSheets[0];
					styleSheets.insertRule(
						'.' + this.StyleName + '{' + this.StyleString + '}',
						styleSheets.cssRules.length
					);
					return this;
				};

				this.getStyle = function (selectorName) {
					var rules = document.styleSheets[0].cssRules;
					selectorName = '.' + selectorName;

					var style = VC.Utils.Page.GetStyleBySelectorText(selectorName);
					if (style !== undefined) {
						this.StyleString = style.cssText.matchRegExp(/(?:{.*?})/);
						this.StyleName = style.selectorText.ltrim();
						return this;
					}
					return null;
				};

				this.addHoverStyle = function (stylestring) {
					return new VC.Utils.Page.Style(
						this.StyleName + ':hover',
						stylestring
					).addStyle();
				};

				this.addStyle();
			},

			GetStyleBySelectorText: function (selectorText, fileClass) {
				var rules;
				if (fileClass) {
					for (var i = 0; i < document.styleSheets.length; i++) {
						if (document.styleSheets[i].href.indexOf(fileClass) !== -1) {
							rules = document.styleSheets[i];
							break;
						}
					}
				} else {
					rules = document.styleSheets[0].cssRules;
				}
				for (var j in rules) {
					if (rules[j].selectorText === selectorText) {
						return rules[j];
					}
				}
				return null;
			},

			IsPostBack: Object.keys(VC).length > 2 ? true : false,

			preloadScripts: function (strArr, shortpath) {
				var newarr = [];
				var checkProp = function (obj, prop) {
					if (obj[prop] !== undefined) {
						return obj[prop];
					}

					return false;
				};

				if (typeof strArr === 'object') {
					for (var i = 0; i < strArr.length; i++) {
						var current = strArr[i];
						var isExist = false;

						current = current.split('/');
						var checkObj = VC;
						for (var j = 0; j < current.length; j++) {
							checkObj = checkProp(checkObj, current[j]);
							if (!checkObj) {
								isExist = false;
								break;
							}
							isExist = true;
						}

						if (!isExist) {
							newarr.push(shortpath + '/' + strArr[i]);
						}
					}
				} else {
					newarr = strArr;
				}
				return newarr;
			},

			LoadModules: function (strArr) {
				require(this.preloadScripts(strArr, 'Scripts'));
			},

			LoadGeometry: function () {
				this.LoadModules([
					'SVG/Geometry',
					'SVG/SvgElement',
					'SVG/SvgLabelElement',
					'SVG/SvgScribbleElement',
					'SVG/SvgContainer'
				]);
			},

			LoadStyles: function (document, sheetPath) {
				var link = document.createElement('link');

				link.setAttribute('rel', 'stylesheet');
				link.setAttribute('type', 'text/css');
				link.setAttribute('href', sheetPath);

				document.getElementsByTagName('head')[0].appendChild(link);
			},

			LoadScripts: function (context, scriptPath) {
				var list = context.getElementsByTagName('script');
				var i = list.length;
				var flag = false;
				while (i--) {
					if (list[i].src == scriptPath) {
						return list[i];
					}
				}

				var tag = context.createElement('script');
				tag.src = scriptPath;
				context.body.appendChild(tag);
				return tag;
			},

			LoadWidgets: function (strArr) {
				require(this.preloadScripts(strArr, 'itgWidgets'));
			},

			GetInstanceDocument: function () {
				if (!top.instance) {
					return;
				}
				return VC.Utils.isIE()
					? top.instance.document
					: top.instance.contentDocument;
			},

			GetParams: function () {
				return window.params;
			},

			IncludeFile: function (path, type) {
				if (type === 'css') {
					var head_node = document.getElementsByTagName('head')[0];
					var link_tag = document.createElement('link');
					link_tag.setAttribute('rel', 'stylesheet');
					link_tag.setAttribute('type', 'text/css');
					link_tag.setAttribute('href', path);
					head_node.appendChild(link_tag);
				}
			},

			getScrollbarWidth: function () {
				var outer = document.createElement('div');
				outer.style.visibility = 'hidden';
				outer.style.width = '100px';
				outer.style.msOverflowStyle = 'scrollbar';

				document.body.appendChild(outer);

				var widthNoScroll = outer.offsetWidth;
				// force scrollbars
				outer.style.overflow = 'scroll';

				// add innerdiv
				var inner = document.createElement('div');
				inner.style.width = '100%';
				outer.appendChild(inner);

				var widthWithScroll = inner.offsetWidth;

				// remove divs
				outer.parentNode.removeChild(outer);

				return widthNoScroll - widthWithScroll;
			},

			EncodeHTML: function (html) {
				if (!html) {
					return '';
				}
				var encodedHTML = html.replace(/&/g, '&amp');
				encodedHTML = encodedHTML.replace(/"/g, '&quot');
				encodedHTML = encodedHTML.replace(/'/g, '&#39');
				encodedHTML = encodedHTML.replace(/</g, '&lt;');
				encodedHTML = encodedHTML.replace(/>/g, '&gt;');
				return encodedHTML;
			}
		},

		PositionDialogManager: {
			availablePlaces: [0, 0, 0],

			getDialogPosition: function () {
				for (var i = 0; i < this.availablePlaces.length; i++) {
					if (this.availablePlaces[i] === 0) {
						this.availablePlaces[i] = 1;

						return i;
					}
				}

				this.availablePlaces.push(0);

				return this.availablePlaces.length - 1;
			},

			resetDialogPosition: function (currentPlace) {
				this.availablePlaces[currentPlace] = 0;
			}
		},

		Enums: {
			// Selected area tops:
			//  1........7........4
			//  .                 .
			//  .                 .
			//  2                 5
			//  .                 .
			//  .                 .
			//  3........8........6

			ResizingSides: {
				LEFT: +2,
				RIGHT: +5,
				TOP: +7,
				BOTTOM: +8,
				LEFT_TOP: +1,
				RIGHT_TOP: +4,
				LEFT_BOTTOM: +3,
				RIGHT_BOTTOM: +6
			},

			ElementType: {
				ELLIPSE: 'ellipse',
				RECT: 'rect',
				LINE: 'line',
				TEXT: 'text'
			},

			ResizingTops: {
				top1: 'TopLeftCircleResizeElement',
				top2: 'MiddleLeftCircleResizeElement',
				top3: 'BottomLeftCircleResizeElement',
				top4: 'TopRightCircleResizeElement',
				top5: 'MiddleRightCircleResizeElement',
				top6: 'BottomRightCircleResizeElement',
				top7: 'TopMiddleCircleResizeElement',
				top8: 'BottomMiddleCircleResizeElement',

				topLeft: 'Circle1ResizeElement',
				topRight: 'Circle2ResizeElement'
			},

			ActionMode: {
				Resizing: +1,
				Moving: +2,
				Deactivate: +3
			},

			AffectedKey: {
				BACKSPACE: 8,
				ENTER: 13,
				SHIFT: 16,
				CTRL: 17,
				ALT: 18,
				ESCAPE: 27,
				SPACE: 32,
				PAGEUP: 33,
				PAGEDOWN: 34,
				END: 35,
				HOME: 36,
				LEFT_ARROW: 37,
				UP_ARROW: 38,
				RIGHT_ARROW: 39,
				DOWN_ARROW: 40,
				DELETE: 46,
				ZERO: 48,
				C: 67,
				V: 86,
				Z: 90,
				NUMPAD0: 96,
				DIVIDE: 111,
				SEMICOLON: 186,
				SIGNLE_QUOTE: 222
			},

			KeybordsCharacter: {
				SLASH: '/',
				SPACE: ' '
			},

			Cursors: {
				Move: 'move',
				Default: 'default'
			},

			ToolbarElementType: {
				Button: 'button',
				NumberTextbox: 'numbertextbox',
				PaletteButton: 'palettebutton'
			},

			Dialogs: {
				Find: 'find',
				Exploded: 'exploded',
				CrossSection: 'crossSection',
				ModelBrowser: 'modelBrowserPanel',
				DynamicModelBrowser: 'dynamicModelBrowserPanel',
				Measure: 'measure',
				Layers: 'layers',
				Measurement: 'measurement',
				ComparePallete: 'comparePallete',
				CompareFiles: 'compareFiles',
				Preferences: 'preferences',
				DisplayStyle: 'displayStyle'
			},

			Palettes: {
				Scribble: 'scribblePalette',
				Highlight: 'highlightPalette',
				Label: 'labelPalette'
			},

			TNames: {
				MainButtons: 'mainButtons',
				SwitchButtons: 'switchButtons',
				ImageViewerToolbar: 'imageViewerToolbar',
				MarkupViewerToolbar: 'markupViewerToolbar',
				HoopsViewerToolbar: 'hoopsViewerToolbar',
				DynamicHoopsViewerToolbar: 'dynamicHoopsViewerToolbar',
				PdfViewerToolbar: 'pdfViewerToolbar',
				ComparizonViewerToolbar: 'comparizonViewerToolbar',
				AdvancedImageViewerToolbar: 'advancedImageViewerToolbar',
				ExtendedMarkupViewerToolbar: 'extendedMarkupViewerToolbar'
			},

			TButtonNames: {
				btnView: 'btnView',
				btnMarkup: 'btnMarkup',
				btnSwitch: 'btnSwitch',
				tbxZoomPercentage: 'tbxZoomPercentage'
			},

			TPropertyName: {
				currentValue: 'currentValue',
				maxValue: 'maxValue'
			},

			TButtonEvents: {
				btnViewClick: 'btnViewClick',
				btnMarkupClick: 'btnMarkupClick',
				btnSwitchClick: 'btnSwitchClick',
				btnBasicSwitchClick: 'btnBasicSwitchClick',
				btnZoomUpClick: 'btnZoomUpClick',
				btnZoomDownClick: 'btnZoomDownClick',
				btnScribbleClick: 'btnScribbleClick',
				btnRectangleClick: 'btnRectangleClick',
				btnLabelClick: 'btnLabelClick',
				btnSelectClick: 'btnSelectClick',
				btnDeleteClick: 'btnDeleteClick',
				btnResetViewClick: 'btnResetViewClick',
				btnPageDownClick: 'btnPageDownClick',
				btnPageUpClick: 'btnPageUpClick',
				ntbPageNumberChange: 'ntbPageNumberChange',
				tbxZoomPercentageChange: 'tbxZoomPercentageChange',
				btnFitWidthClick: 'btnFitWidthClick',
				btnFitHeightClick: 'btnFitHeightClick',
				btnZoomWindowClick: 'btnZoomWindowClick',
				btnComparisonPalleteClick: 'btnComparisonPalleteClick',
				btnOrientToFaceClick: 'btnOrientToFaceClick',
				btnDisplayStyleClick: 'btnDisplayStyleClick',
				btnMeasureClick: 'btnMeasureClick',
				btnExplodedViewClick: 'btnExplodedViewClick',
				btnCrossSectionClick: 'btnCrossSectionClick',
				btnModelBrowserClick: 'btnModelBrowserClick',
				btnSelectTextClick: 'btnSelectTextClick',
				btnPanClick: 'btnPanClick',
				btnFindClick: 'btnFindClick',
				btnLayersClick: 'btnLayersClick',
				btnCompareClick: 'btnCompareClick',
				btnDownloadClick: 'btnDownloadClick',
				btnViewFileClick: 'btnViewFileClick',
				btnDownloadMarkupClick: 'btnDownloadMarkupClick',
				btnViewFileMarkupClick: 'btnViewFileMarkupClick',
				btnPMIClick: 'btnPMIClick',
				btnClockwiseClick: 'btnClockwiseClick',
				btnCounterClockwiseClick: 'btnCounterClockwiseClick',
				btnPreferencesClick: 'btnPreferencesClick',
				ddModelConfigurations: 'ddModelConfigurationsChange',
				ddViewModes: 'ddViewModesChange'
			},

			PdfHandlerActions: {
				PdfToXod: '&action=to_xod',
				PageToPng: '&action=to_png',
				GetLayers: '&action=get_layers',
				GetProperty: '&action=get_property',
				PageCount: '&action=page_count',
				CheckCache: '&action=check_cache',
				ClientData: '&action=client_data',
				ImageToPdf: '&action=to_pdf',
				CheckEncrypt: '&action=check_encrypt',
				CheckUnlock: '&action=check_unlock'
			},

			ViewStateParameters: {
				Position: 'position'
			},

			ViewerViewMode: {
				View: 'view',
				Markup: 'markup'
			},

			PalleteMode: {
				draw: 'draw',
				select: 'select'
			},

			ServerVariable: {
				PDFMaxZoom: 'PDF_MaxZoom',
				PDFEnableAnnotations: 'PDF_EnableAnnotations',
				HOOPSServerUrl: 'HOOPS_ServerUrl',
				HOOPSViewerRendererType: 'HOOPS_Viewer_Renderer_Type',
				HOOPSViewerTimeout: 'HOOPS_Viewer_Timeout'
			},

			MeasurementUtils: {
				PDFViewer: 'PDF Viewer',
				AdvancedImageViewer: 'Advanced Image Viewer'
			},

			CommandBarItemTypes: {
				CommandBarButton: 'CommandBarButton',
				CommandBarSeparator: 'CommandBarSeparator',
				CommandBarEdit: 'CommandBarEdit',
				CommandBarDropDown: 'CommandBarDropDown'
			},

			AxisIndex: {
				X: 0,
				Y: 1,
				Z: 2,
				Face: 3
			},

			CuttingPlaneStatuses: {
				Hidden: 0,
				Visible: 1,
				Inverted: 2
			},

			XMLHttpRequest: {
				readyState: {
					unsent: 0,
					opened: 1,
					headers: 2,
					loading: 3,
					done: 4
				},
				status: {
					ok: 200
				}
			},

			InvalidParametersErrorType: {
				noParamInTgvd: 1,
				noParamInSavedView: 2
			},

			ViewerOutModes: {
				Standard: 0,
				Versioned: 1,
				Limited: 2,
				DifferentItemTypeContext: 3
			}
		},

		Viewers: {
			PDFViewerSettings: {
				pdfBackend: 'ems'
			},
			PDFViewerToolMode: {
				Pan: 'Pan',
				TextSelect: 'TextSelect'
			},
			HoopsViewerMode: {
				ScsProcessing: '0',
				SczStreaming: '1'
			}
		},

		GetResource: function (key) {
			return aras.getResource('../Modules/aras.innovator.Viewers/', key);
		},

		getLocalizedXML: function (fileName) {
			var locale = aras.getSessionContextLanguageCode();
			var localizedUrl =
				'xml' + (locale === 'en' ? '' : '.' + locale) + '/' + fileName + '.xml';
			var url =
				aras.getBaseURL() + '/Modules/aras.innovator.Viewers/' + localizedUrl;
			return aras.getFileText(url);
		},

		getLoggedIdentityId: function () {
			return aras.getIsAliasIdentityIDForLoggedUser();
		},

		removeVariable: function (varName) {
			return aras.removeVariable(varName);
		},

		confirm: function (message) {
			return aras.confirm(message);
		},

		AlertError: function (
			errorMessage,
			technicalErrorMessage,
			stackTrace,
			argwin
		) {
			aras.AlertError(errorMessage, technicalErrorMessage, stackTrace, argwin);
		},

		AlertWarning: function (msg, argwin) {
			aras.AlertWarning(msg, argwin);
		},

		createXMLDocument: function () {
			return aras.createXMLDocument();
		},

		getBaseURL: function () {
			return aras.getBaseURL();
		},

		getBaseUrlWithoutSalt: function (aras) {
			return (
				new ClientUrlsUtility(aras.getBaseURL()).getBaseUrlWithoutSalt() + '/'
			);
		},

		getUseStandartToolbar: function () {
			return Boolean(
				+aras.getPreferenceItemProperty(
					'SSVC_Preferences',
					null,
					'use_standard_toolbar_for_viewers'
				)
			);
		},

		setUseStandartToolbar: function (val) {
			aras.setPreferenceItemProperties('SSVC_Preferences', null, {
				use_standard_toolbar_for_viewers: val ? '1' : '0'
			});
			aras.savePreferenceItems();
		},

		getUseLegacy3DFiles: function () {
			return Boolean(
				+aras.getPreferenceItemProperty(
					'SSVC_Preferences',
					null,
					'use_legacy_3d_view_files'
				)
			);
		},

		getHighlightTextPrefix: function () {
			var value = null;
			var pref = aras.newIOMItem('Preference', 'get');
			var ssvc_pref = aras.newIOMItem('SSVC_Preferences', 'get');

			pref.setProperty('keyed_name', 'World');
			pref.addRelationship(ssvc_pref);
			pref = pref.apply();

			if (pref.isError()) {
				return null;
			}

			var ssvc_prefs = pref.getRelationships();
			if (ssvc_prefs && ssvc_prefs.getItemCount() > 0) {
				ssvc_pref = ssvc_prefs.getItemByIndex(0);
				value = ssvc_pref.getProperty('prefix_for_highlight_text_markup');
			}

			if (value === '' || value === null) {
				var item = aras.getItemByName('ItemType', 'SSVC_Preferences');
				var property = aras.newIOMItem('Property', 'get');
				property.setAttribute(
					'WHERE',
					'[Property].source_id=' + item.getAttribute('id') + "'"
				);
				property.setProperty('name', 'prefix_for_highlight_text_markup');
				property = property.apply();
				value = property.getProperty('default_value');
			}

			return value;
		},

		getItemTypeLabelbyName: function (name) {
			var item = aras.newIOMItem('ItemType', 'get');
			item.setProperty('name', name);
			item.setAttribute('select', 'label');
			item = item.apply();

			if (item.isError()) {
				return null;
			}

			return item.getProperty('label');
		},

		getItemNameById: function (type, id) {
			var item = aras.newIOMItem(type, 'get');
			item.setProperty('id', id);
			item.setAttribute('select', 'item_number');
			item = item.apply();

			if (item.isError()) {
				return null;
			}

			return item.getProperty('item_number');
		},

		isIE: function () {
			return dojo.isIE !== undefined || this.isIE11();
		},

		isIE11: function () {
			return !window.ActiveXObject && 'ActiveXObject' in window;
		},

		isFirefox: function () {
			return dojo.isFF !== undefined;
		},

		isEdge: function () {
			return aras.Browser.isEdge();
		},

		isChrome: function () {
			return window.chrome ? true : false;
		},

		isNotNullOrUndefined: function (varObject) {
			return typeof varObject !== 'undefined' && varObject !== null;
		},

		isNullOrUndefined: function (obj) {
			return typeof obj === 'undefined' || obj === null;
		},

		GetDateTimeInNeutralFormat: function (dateTimePar) {
			function pad(x) {
				return x < 10 ? '0' + x : '' + x;
			}

			var cntx = aras.newIOMInnovator().getI18NSessionContext();
			var corporateToLocalOffset = cntx.GetCorporateToLocalOffset();

			var dateTime = dateTimePar !== undefined ? dateTimePar : new Date();
			//Convert to Corporate Time
			dateTime.setMinutes(dateTime.getMinutes() + corporateToLocalOffset);

			var months = dateTime.getMonth() + 1;
			var days = dateTime.getDate();
			var years = dateTime.getFullYear();
			var hours = dateTime.getHours();
			var minutes = dateTime.getMinutes();
			var seconds = dateTime.getSeconds();
			var ampm = hours >= 12 ? 'PM' : 'AM';
			hours = hours % 12;
			hours = hours ? hours : 12; // the hour "0" should be "12"

			var dateTimeStr =
				pad(months) +
				'/' +
				pad(days) +
				'/' +
				years +
				' ' +
				pad(hours) +
				':' +
				pad(minutes) +
				':' +
				pad(seconds) +
				' ' +
				ampm;
			return cntx.ConvertToNeutral(dateTimeStr, 'date', 'short_date_time');
		},

		MakeName: function (length) {
			var text = '';
			var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

			for (var i = 0; i < length; i++) {
				text += possible.charAt(Math.floor(Math.random() * possible.length));
			}
			return text;
		},

		convertHexToRGBA: function (hexColor, alpha) {
			var color = new dojo.Color(hexColor);
			var res = color.toRgb();
			return 'rgba(' + res[0] + ',' + res[1] + ',' + res[2] + ',' + alpha + ')';
		},

		convertXsltToHtml: function (xml, xslt, target) {
			var xmlDocument = aras.createXMLDocument();
			var regExp = new RegExp('{%0%}', 'g');
			var xsltFull = null;
			var html = null;

			xmlDocument.loadXML(xml);
			xsltFull = xslt.replace(regExp, target);
			html = aras.applyXsltString(xmlDocument, xsltFull);
			html = html
				.replace('<?xml version="1.0"?>', '')
				.replace('<?xml version="1.0" encoding="UTF-8"?>', '');

			return html;
		},

		getObjectNodes: function (node) {
			var children = node.childNodes;
			var objectNodes = [];

			for (var i = 0; i < children.length; i++) {
				if (children[i].nodeType == VC.Utils.Constants.nodeTypes.elementNode) {
					objectNodes.push(children[i]);
				}
			}

			return objectNodes;
		},

		getAttributeNodes: function (node) {
			var inputAttributes = node.attributes;
			var outputAttributes = {};

			for (var i = 0; i < inputAttributes.length; i++) {
				outputAttributes[inputAttributes[i].nodeName] =
					inputAttributes[i].nodeValue;
			}

			return outputAttributes;
		},

		getTimestampString: function () {
			var minRange = 1;
			var maxRange = 9999;
			var dateTime = new Date();
			var year = dateTime.getFullYear().toString();
			var month = dateTime.getMonth().toString();
			var day = dateTime.getDate().toString();
			var hours = dateTime.getHours().toString();
			var minutes = dateTime.getMinutes().toString();
			var seconds = dateTime.getSeconds().toString();
			var milliseconds = dateTime.getMilliseconds().toString();
			var random =
				Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;

			return year.concat(
				month,
				day,
				hours,
				minutes,
				seconds,
				milliseconds,
				random.toString()
			);
		},

		//function adds 'className' to the 'class' attribute
		//created in order to avoid incorrect using dojo function in case of the svg element
		//which className is SVGAnimatedString  while for other elements className is string
		//the function considers this moment and it is universal for any DOM elements
		addClass: function (element, className) {
			this.removeClass(element, className); // prevents adding of existing class name
			var classList = element.getAttribute('class') || '';

			if (classList.length !== 0) {
				classList += ' ';
			}
			classList += className;

			element.setAttribute('class', classList);
		},

		removeClass: function (element, className) {
			var classList = element.getAttribute('class') || '';
			var regexp = new RegExp('\\s*' + className, 'g');
			var hasElementClass = this.hasClass(element, className);

			if (hasElementClass) {
				classList = classList.replace(regexp, '');
				element.setAttribute('class', classList);
			}
		},

		hasClass: function (element, className) {
			var classList = element.getAttribute('class') || '';
			var regexp = new RegExp('\\s*' + className, 'g');

			return !!classList.match(regexp);
		},

		setAttribute: function (selectorResult, attrName, value) {
			if (selectorResult.length !== null) {
				for (var i = 0; i < selectorResult.length; i++) {
					selectorResult[i].setAttribute(attrName, value);
				}
			} else {
				selectorResult.setAttribute(attrName, value);
			}
		},

		parseFileUrl: function (filePath) {
			var regex = new RegExp('^.*[\\/]');
			var fileNameWithExtension = null;
			var returnedValue = null;
			var pathString = null;

			if (!filePath || filePath === '') {
				return null;
			}

			pathString = filePath.match(regex);

			if (pathString !== null) {
				returnedValue = {};
				fileNameWithExtension = filePath.replace(regex, '');
				returnedValue.pathString = pathString[0];
				returnedValue.fileName = fileNameWithExtension.split('.').shift();
				returnedValue.fileExtension = fileNameWithExtension.split('.').pop();
			}

			return returnedValue;
		},

		getXYDPIs: function () {
			// Create 1" square div using points
			var testDiv = document.createElement('div');
			testDiv.style.height = '72pt';
			testDiv.style.width = '72pt';
			testDiv.style.visibility = 'hidden';
			document.body.appendChild(testDiv);

			// Retrieve pixel measurements
			var xRes = testDiv.offsetWidth;
			var yRes = testDiv.offsetHeight;

			// Remove the test element
			testDiv.parentNode.removeChild(testDiv);

			// Return results in an array
			return Array(xRes, yRes);
		},

		// Parameter fileInfo should be either CompareFileInfo object or simple file URL
		getPdfFileInfo: function (fileInfo, parameters, errorInfo) {
			if (!parameters || (typeof fileInfo === 'object' && !fileInfo.fileUrl)) {
				return null;
			}

			var tryAgain = false;
			var fileUrl = fileInfo.fileUrl ? fileInfo.fileUrl : fileInfo;

			do {
				var url =
					this.getBaseUrlWithoutSalt(parent.aras) +
					'HttpHandlers/ConvertPdfToXOD.ashx?file=' +
					encodeURIComponent(fileUrl) +
					parameters;
				var xmlHttp = parent.aras.XmlHttpRequestManager.CreateRequest();
				xmlHttp.open('GET', url, false);
				xmlHttp.send(null);

				if (xmlHttp.status === 200) {
					var xmlDoc = xmlHttp.responseXML;
					var resultEl = xmlDoc.getElementsByTagName('Result')[0];
					if (resultEl && resultEl.childNodes.length > 0) {
						return resultEl.childNodes[0].nodeValue;
					} else {
						resultEl = xmlDoc.getElementsByTagName('Error')[0];
						var errorMsg = 'Unknown server error occurred';
						if (resultEl && resultEl.childNodes.length > 0) {
							var errorMsgSelector = xmlDoc.querySelector('Error>Message');
							if (errorMsgSelector != null) {
								errorMsg = errorMsgSelector.innerHTML;
							}
						}

						if (errorMsg.indexOf('Time out for this token') >= 0) {
							tryAgain = true;

							fileUrl = aras.IomInnovator.getFileUrl(
								fileInfo.fileId,
								aras.Enums.UrlType.SecurityToken
							);
							fileInfo.fileUrl = fileUrl;
						} else {
							if (errorInfo != null) {
								errorInfo.errorMsg = errorMsg;
							}
							aras.AlertError(errorMsg);
							return null;
						}
					}
				} else {
					if (!tryAgain && fileInfo.fileId) {
						tryAgain = true;

						fileUrl = aras.IomInnovator.getFileUrl(
							fileInfo.fileId,
							aras.Enums.UrlType.SecurityToken
						);
						fileInfo.fileUrl = fileUrl;
					} else {
						return null;
					}
				}
			} while (tryAgain);

			return null;
		},

		roundZoomValue: function (value) {
			if (value < 1.0) {
				return 1.0;
			} else {
				return Math.round(value);
			}
		},

		getScript: function (url, callback) {
			if (!$) {
				throw new Error('Jquery was not included to page.');
			}

			$.ajax({
				url: url,
				dataType: 'script',
				success: function () {
					if (callback) {
						callback();
					}
				}
			});
		},

		inheritClass: function (sub, base) {
			function SurrogateCtor() {}

			SurrogateCtor.prototype = base.prototype;
			sub.prototype = new SurrogateCtor();
			sub.prototype.constructor = sub;
		},

		// returns object { canvas, context }
		createCanvas: function (width, height) {
			var canvas = document.createElement('canvas');
			canvas.setAttribute('width', width);
			canvas.setAttribute('height', height);
			var ctx = canvas.getContext('2d');

			return {
				canvas: canvas,
				context: ctx
			};
		},

		registerModulePaths: function (context) {
			var scriptPath =
				aras.getBaseURL() + '/Modules/aras.innovator.Viewers/Scripts';
			var widgetPath =
				aras.getBaseURL() + '/Modules/aras.innovator.Viewers/Scripts/Widgets';

			if (!context) {
				context = window;
			}

			context.dojo.registerModulePath('Scripts', scriptPath);
			context.dojo.registerModulePath(
				'Views',
				aras.getBaseURL() + '/Modules/aras.innovator.Viewers/Views'
			);
			context.dojo.registerModulePath('itgWidgets', widgetPath);
		}
	});

	//Extensions

	/// <summary>Sets visibility to element.</summary>
	/// <param name="visible" type="Boolean">Does element set visible or not.</param>
	if (!Element.prototype.visible) {
		Element.prototype.visible = function (visible) {
			if (this.style) {
				this.style.display = visible ? 'block' : 'none';
			}
		};
	}

	/// <summary>Sets disabling to element.</summary>
	/// <param name="disable" type="Boolean">Does element set disable or not.</param>
	if (!Element.prototype.disable) {
		Element.prototype.disable = function (disable) {
			if (this.attributes) {
				if (disable) {
					this.setAttribute('disabled', 'disabled');
				} else {
					this.removeAttribute('disabled');
				}
			}
		};
	}
	if (!String.prototype.IsNullOrEmpty) {
		String.prototype.IsNullOrEmpty = function () {
			return VC.Utils.isNullOrUndefined(this) || this === '';
		};
	}

	if (!String.prototype.ltrim) {
		String.prototype.ltrim = function () {
			return this.replace(/^\.+/, '').replace(/^\s+/, '');
		};
	}

	if (!String.prototype.trim) {
		String.prototype.ltrim = function () {
			return this.replace(/^\s+|\s+$/g, '');
		};
	}
	if (!String.prototype.matchRegExp) {
		String.prototype.matchRegExp = function (regexp) {
			var VRegExp = new RegExp(regexp);
			var VResult = this.match(VRegExp);
			return VResult;
		};
	}

	if (!String.prototype.Format) {
		String.prototype.Format = function () {
			var args = arguments;
			return this.replace(/{(\d+)}/g, function (match, number) {
				return typeof args[number] !== 'undefined' ? args[number] : '';
			});
		};
	}

	if (!Array.prototype.Find) {
		Object.defineProperty(Array.prototype, 'Find', {
			value: function (param, value) {
				for (var i = 0; i < this.length; i++) {
					var entry = this[i];
					if (entry[param] === value) {
						return entry;
					}
				}
			}
		});
	}
	if (!Array.prototype.Remove) {
		Object.defineProperty(Array.prototype, 'Remove', {
			value: function (param, value) {
				this.forEach(function (entry) {
					if (entry[param] === value) {
						this.splice(this.indexOf(entry), 1);
					}
				});
			}
		});
	}
	if (!Array.prototype.FindAll) {
		Object.defineProperty(Array.prototype, 'FindAll', {
			value: function (param, value) {
				var list = [];
				this.forEach(function (entry) {
					if (entry[param] === value) {
						list.push(entry);
					}
				});
				return list;
			}
		});
	}
	if (!Array.prototype.FindAllAndRemove) {
		Object.defineProperty(Array.prototype, 'FindAllAndRemove', {
			value: function (param, value) {
				var list = [];
				this.forEach(function (entry) {
					if (entry[param] === value) {
						list.push(entry);
					}
					this.splice(this.indexOf(entry), 1);
				});
				return list;
			}
		});
	}
	if (!Array.prototype.FindDepth) {
		Object.defineProperty(Array.prototype, 'FindDepth', {
			value: function (param, childsProperyName, value) {
				for (var i = 0; i < this.length; i++) {
					var entry = this[i];
					if (entry[param] === value) {
						return entry;
					} else {
						if (entry[childsProperyName]) {
							var result = entry[childsProperyName].Find(param, value);
							if (result) {
								return result;
							}
						}
					}
				}
				return null;
			}
		});
	}

	if (!Array.prototype.PushRange) {
		Object.defineProperty(Array.prototype, 'PushRange', {
			value: function (array) {
				var self = this;
				array.forEach(function (entry) {
					self.push(entry);
				});
			}
		});
	}

	if (!Array.prototype.GetIndex) {
		Object.defineProperty(Array.prototype, 'GetIndex', {
			value: function (element, strProperty) {
				for (var i in this) {
					if (this[i][strProperty] === element[strProperty]) {
						return i;
					}
				}
				return -1;
			}
		});
	}

	if (!Array.prototype.IsExist) {
		Object.defineProperty(Array.prototype, 'IsExist', {
			value: function (element, property) {
				var index = this.GetIndex(element, property);
				if (index === -1) {
					return false;
				} else {
					return true;
				}
			}
		});
	}
});
