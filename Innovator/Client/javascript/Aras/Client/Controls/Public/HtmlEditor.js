/*global define, dojox*/
/*jslint nomen: true*/
/*jshint scripturl:true*/
define([
	'dojo/_base/declare',
	'dojo',
	'dijit/dijit',
	'dijit/Editor',
	'Aras/Client/Controls/Experimental/_htmlEditor/HtmlFilterManager',
	'dojo/string',
	'dijit/_editor/plugins/LinkDialog',
	'dojox/editor/plugins/Preview',
	'dijit/focus',
	'dojo/on',
	'dojo/sniff', // has("ie") has("mozilla") has("opera") has("safari") has("webkit")
	'dojox/editor/plugins/TablePlugins',
	'dijit/_editor/plugins/ToggleDir',
	'dijit/_editor/plugins/ViewSource',
	'dojox/editor/plugins/FindReplace',
	'dijit/_editor/plugins/FontChoice',
	'dijit/_editor/plugins/TextColor',
	'dojox/editor/plugins/PrettyPrint',
	'dojox/editor/plugins/NormalizeIndentOutdent',
	'dojox/editor/plugins/NormalizeStyle',
	'dojox/editor/plugins/PrettyPrint',
	'Aras/Client/Controls/Experimental/_htmlEditor/plugins/BackgroundColor',
	'Aras/Client/Controls/Experimental/_htmlEditor/plugins/ImageBrowser',
	'dijit/a11y'
], function (
	declare,
	dojo,
	dijit,
	dojoEditor,
	HtmlFilterManager,
	stringModule,
	LinkDialog,
	PreviewPlugin,
	focus,
	on,
	has,
	a11y
) {
	//this variable is used to build documentation in ExtractJSApiDocs.wsf file
	if (typeof arasDocumentationHelper === 'undefined') {
		var privateProps = {},
			getBodyBgColor = (function () {
				var bodyBgColorRegEx = /<body[^>]*style\s*=\s*['"].*[;]?background-color:\s*(#[\d\w]{6})[;'"][^>]*>/i;
				return function (source) {
					var bgColorRes;
					if (source instanceof Editor) {
						return source.iframe.contentDocument.getElementsByTagName('body')[0]
							.style.backgroundColor;
					}
					if (typeof source == 'string') {
						bgColorRes = bodyBgColorRegEx.exec(source);
						if (bgColorRes) {
							return bgColorRes[1];
						}
					}
					return null;
				};
			})();

		dojo.extend(PreviewPlugin, {
			_preview: function () {
				// summary:
				//		Function to trigger previewing of the editor document
				// tags:
				//		private
				try {
					var content = this.editor.get('value'),
						head =
							"\t\t<meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>\n",
						i,
						bodyBgColor = getBodyBgColor(this.editor);
					// Apply the stylesheets, then apply the styles.
					if (this.stylesheets) {
						for (i = 0; i < this.stylesheets.length; i++) {
							head +=
								"\t\t<link rel='stylesheet' type='text/css' href='" +
								this.stylesheets[i] +
								"'>\n";
						}
					}
					if (this.styles) {
						head += '\t\t<style>' + this.styles + '</style>\n';
					}

					content =
						'<html>\n\t<head>\n' +
						head +
						'\t</head>\n\t<body' +
						(!bodyBgColor
							? ''
							: ' style="background-color:' + colorToHex(bodyBgColor) + '"') +
						'>\n' +
						content +
						'\n\t</body>\n</html>';
					var win = window.open(
						"javascript:''",
						this._nlsResources.preview,
						'status=1,menubar=0,location=0,toolbar=0'
					);
					win.document.open();
					win.document.write(content);
					win.document.close();
				} catch (e) {
					console.warn(e);
				}
			}
		});

		dojo.extend(dojox.editor.plugins.InsertTable, {
			modTable: function () {
				var dialog = new dojox.editor.plugins.EditorTableDialog({}),
					handle;
				dialog.show();
				handle = dojo.connect(dialog, 'onBuildTable', this, function (obj) {
					dojo.disconnect(handle);
					this.editor.execCommand('inserthtmlex', obj.htmlText);
				});
			}
		});

		dojo.extend(LinkDialog, {
			linkDialogTemplate: [
				'<table><tr><td>',
				"<label for='${id}_urlInput'>${url}</label>",
				'</td><td>',
				"<input data-dojo-type='dijit.form.ValidationTextBox' required='true' ",
				"id='${id}_urlInput' name='urlInput' data-dojo-props='intermediateChanges:true'/>",
				'</td></tr><tr><td>',
				"<label for='${id}_textInput'>${text}</label>",
				'</td><td>',
				"<input data-dojo-type='dijit.form.ValidationTextBox' required='true' id='${id}_textInput' ",
				"name='textInput' data-dojo-props='intermediateChanges:true'/>",
				'</td></tr><tr><td>',
				"<label for='${id}_targetSelect'>${target}</label>",
				'</td><td>',
				"<select id='${id}_targetSelect' name='targetSelect' data-dojo-type='dijit.form.Select'>",
				"<option value='_blank'>${newWindow}</option>",
				'</select>',
				"</td></tr><tr><td colspan='2'>",
				"<button data-dojo-type='dijit.form.Button' type='submit' id='${id}_setButton'>${set}</button>",
				"<button data-dojo-type='dijit.form.Button' type='button' id='${id}_cancelButton'>${buttonCancel}</button>",
				'</td></tr></table>'
			].join('')
		});

		var Editor = declare(dojoEditor, {
			arasObj: null,
			//images urls dictionary
			urlsDic: null,

			constructor: function (args) {
				this.urlsDic = { vaultUrls: [], tempUrls: [], Count: 0 };
				this.arasObj = args.arasObj;
				this.inherited(arguments);
			},

			postscript: function (args) {
				var self = this;
				this.inherited(arguments);
				if (args.initHandler) {
					this.onLoadDeferred.addCallback(function (response) {
						args.initHandler.call();
						return response;
					});
				}
				//summary: override calling onpaste event only through dijit.editor API
				this.onLoadDeferred.addCallback(function (response) {
					dojo.connect(self.editNode, 'onkeydown', function (e) {
						if (e.ctrlKey && e.keyCode === 86) {
							if (aras.Browser.isIe()) {
								self.onAfterPaste();
							}
						}
					});
					return response;
				});

				this.onLoadDeferred.addCallback(function (response) {
					dojo.connect(self.editNode, 'onpaste', function (e) {
						if (aras.Browser.isCh()) {
							self.onAfterPaste();
						}
					});
					return response;
				});

				this.onLoadDeferred.addCallback(function (response) {
					dojo.mixin(self._tablePluginHandler, {
						onDragStart: function (e) {
							e.preventDefault();
							e.stopPropagation();
						}
					});
					return response;
				});
			},
			onAfterPaste: function () {},

			_inserthtmlexImpl: function (html) {
				if (html) {
					this.editNode.focus();
					var editDocument = this.editNode.ownerDocument;
					var selectedContent = editDocument.getSelection();
					if (selectedContent.rangeCount) {
						var range = selectedContent.getRangeAt(0);
						var bookmarkRange = this._createBookmarkRange(range, true);
						if (!range.collapsed) {
							range.deleteContents();
						}
						selectedContent.removeAllRanges();

						var htmlContainer = editDocument.createElement('div'),
							index;
						htmlContainer.innerHTML = html;

						var lastNode;
						for (
							index = htmlContainer.childNodes.length - 1;
							index >= 0;
							index--
						) {
							lastNode = htmlContainer.childNodes[index];
							bookmarkRange.insertNode(lastNode);
						}

						bookmarkRange.setStartAfter(lastNode);
						bookmarkRange.collapse(true);
						selectedContent.addRange(bookmarkRange);
					}
				}
				return true;
			},
			_createBookmarkRange: function (range, atStart) {
				var bookmarkRange = null;
				if (range) {
					bookmarkRange = range.cloneRange();
					if (atStart) {
						bookmarkRange.setStart(range.startContainer, range.startOffset);
						bookmarkRange.setEnd(range.startContainer, range.startOffset);
					} else {
						bookmarkRange.setStart(range.endContainer, range.endOffset);
						bookmarkRange.setStart(range.endContainer, range.endOffset);
					}
				}
				return bookmarkRange;
			},
			_getSelectedHtml: function () {
				this.editNode.focus();
				var editDocument = this.editNode.ownerDocument;
				var selectedContent = editDocument.getSelection();

				if (selectedContent.rangeCount) {
					var html = '';
					for (var i = 0; i < selectedContent.rangeCount; i++) {
						var frag = selectedContent.getRangeAt(i).cloneContents();
						var div = editDocument.createElement('div');
						div.appendChild(frag);
						html += div.innerHTML;
					}
					return html;
				}
				return null;
			}
		});
	}

	function addPluginsCSS() {
		var pluginsCSS = [
				'dojox/editor/plugins/resources/editorPlugins.css',
				'dojox/editor/plugins/resources/css/FindReplace.css',
				'dojox/editor/plugins/resources/css/Preview.css',
				'Aras/Client/Controls/Experimental/_htmlEditor/plugins/resources/css/BackgroundColor.css',
				'Aras/Client/Controls/Experimental/_htmlEditor/plugins/resources/css/ImageBrowser.css'
			],
			resultCss = '',
			style = dojo.doc.createElement('style'),
			headElt = dojo.query('head')[0],
			rootPath = dojo.baseUrl.replace(/dojo\/?$/, '');
		dojo.forEach(pluginsCSS, function (cssPath) {
			resultCss = stringModule.substitute('${0} @import "${1}${2}";\n', [
				resultCss,
				rootPath,
				cssPath
			]);
		});
		resultCss =
			resultCss + '.dijitEditor, .dijitEditorIFrameContainer {height:100%;}';
		style.type = 'text/css';
		if (style.styleSheet) {
			// IE
			style.styleSheet.cssText = resultCss;
		} else {
			// the others
			style.appendChild(dojo.doc.createTextNode(resultCss));
		}
		headElt.appendChild(style);
	}

	function colorToHex(color) {
		if ('#' === color.substr(0, 1)) {
			return color;
		}
		var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color),
			red = parseInt(digits[2], 10),
			green = parseInt(digits[3], 10),
			blue = parseInt(digits[4], 10),
			rgb = blue | (green << 8) | (red << 16);
		return digits[1] + '#' + rgb.toString(16);
	}

	return declare('Aras.Client.Controls.Public.HtmlEditor', null, {
		//don't add property here without "_Experimental" - it will be shown as field in documentation, properties are defined in constructor using defineProperties

		constructor: function (args) {
			/// <summary>
			/// HTML Editor control.
			/// </summary>
			//this variable is used to build documentation in ExtractJSApiDocs.wsf file
			if (typeof arasDocumentationHelper !== 'undefined') {
				arasDocumentationHelper.registerProperties({});
				arasDocumentationHelper.registerEvents(
					'onAfterPaste, onBlur, onChange'
				);
				return;
			}
			this.propsId_Experimental = args.id;
			var counter = 1;
			while (privateProps[this.propsId_Experimental]) {
				this.propsId_Experimental = args.id + counter;
				counter = counter + 1;
			}

			//Instance-Specific private props:
			privateProps[this.propsId_Experimental] = {
				editor: null //don't use "," after the last property all over the file, e.g, here because documentation will not be built
			};

			addPluginsCSS();
			var plugins = [
				'selectAll',
				'delete',
				'|',
				'findreplace',
				'|',
				'undo',
				'redo',
				'||',
				'formatBlock',
				'fontName',
				'fontSize',
				'|',
				'foreColor',
				'hiliteColor',
				'|',
				'bold',
				'italic',
				'underline',
				'strikethrough',
				'|',
				'justifyLeft',
				'justifyCenter',
				'justifyRight',
				'|',
				'indent',
				'outdent',
				'|',
				'insertOrderedList',
				'insertUnorderedList',
				'|',
				'subscript',
				'superscript',
				'|',
				'createLink',
				'unlink',
				'imageBrowser',
				'|',
				'preview',
				{
					name: 'viewsource',
					stripScripts: false,
					stripComments: false,
					stripIFrames: false
				},
				'|',
				'insertTable',
				'normalizeindentoutdent',
				{ name: 'normalizestyle', mode: 'semantic' },
				'backgroundColor',
				{
					name: 'dijit._editor.plugins.EnterKeyHandling',
					blockNodeForEnter: 'BR'
				}
			];

			var editor = new Editor(
				{
					plugins: plugins,
					lang: 'en',
					height: '100%',
					arasObj: args.arasObj,
					initHandler: args.initHandler,
					disabled: args.disabled || false
				},
				document.getElementById(args.id)
			);

			var htmlFilterMgr = new HtmlFilterManager();
			editor.contentPreFilters.push(function (html) {
				return htmlFilterMgr.filter(html, ['strip_tags', 'paste_word']).content;
			});
			var self = this;

			function validateContent() {
				var filterRes = htmlFilterMgr.filter(editor.getValue());
				if (filterRes.isModified) {
					editor.setValue(filterRes.content);
				}
			}
			privateProps[this.propsId_Experimental].validateContent = validateContent;

			dojo.connect(editor, 'onBlur', function () {
				self.onBlur();
			});
			dojo.connect(editor, 'onChange', function (newContent) {
				self.onChange(newContent);
			});
			dojo.connect(editor, 'onAfterPaste', function () {
				validateContent();
				self.onAfterPaste();
			});

			if (has('mozilla')) {
				focus.registerWin = function (
					/*Window?*/ targetWindow,
					/*DomNode?*/ effectiveNode
				) {
					// summary:
					//		Registers listeners on the specified window (either the main
					//		window or an iframe's window) to detect when the user has clicked somewhere
					//		or focused somewhere.
					// description:
					//		Users should call registerIframe() instead of this method.
					// targetWindow:
					//		If specified this is the window associated with the iframe,
					//		i.e. iframe.contentWindow.
					// effectiveNode:
					//		If specified, report any focus events inside targetWindow as
					//		an event on effectiveNode, rather than on evt.target.
					// returns:
					//		Handle with remove() method to deregister.

					// TODO: make this function private in 2.0; Editor/users should call registerIframe(),

					// Listen for blur and focus events on targetWindow's document.
					var _this = this,
						body = targetWindow.document;

					if (body) {
						var mdh = on(
							targetWindow.document,
							'mousedown, touchstart',
							function (evt) {
								_this._justMouseDowned = true;
								setTimeout(function () {
									_this._justMouseDowned = false;
								}, 0);

								// workaround weird IE bug where the click is on an orphaned node
								// (first time clicking a Select/DropDownButton inside a TooltipDialog).
								// actually, strangely this is happening on latest chrome too.
								if (evt && evt.target && evt.target.parentNode == null) {
									return;
								}

								_this._onTouchNode(effectiveNode || evt.target, 'mouse');
							}
						);

						var fih = on(body, 'focusin', function (evt) {
							lastFocusin = new Date().getTime();

							// When you refocus the browser window, IE gives an event with an empty srcElement
							if (!evt.target.tagName) {
								return;
							}

							// IE reports that nodes like <body> have gotten focus, even though they have tabIndex=-1,
							// ignore those events
							var tag = evt.target.tagName.toLowerCase();
							if (tag == '#document' || tag == 'body') {
								return;
							}

							if (dijit.isTabNavigable(evt.target)) {
								// If condition doesn't seem quite right, but it is correctly preventing focus events for
								// clicks on disabled buttons.  (TODO: it doesn't register clicks on TabContainer tabs because
								// they are tabIndex="-1")
								_this._onFocusNode(effectiveNode || evt.target);
							} else {
								// Previous code called _onTouchNode() for any activate event on a non-focusable node.   Can
								// probably just ignore such an event as it will be handled by onmousedown handler above, but
								// leaving the code for now.
								_this._onTouchNode(effectiveNode || evt.target);
							}
						});

						var foh = on(body, 'focusout', function (evt) {
							// IE9+ has a problem where focusout events come after the corresponding focusin event.  At least
							// when moving focus from the Editor's <iframe> to a normal DOMNode.
							if (new Date().getTime() < lastFocusin + 100) {
								return;
							}

							_this._onBlurNode(effectiveNode || evt.target);
						});

						return {
							remove: function () {
								mdh.remove();
								fih.remove();
								foh.remove();
								mdh = fih = foh = null;
								body = null; // prevent memory leak (apparent circular reference via closure)
							}
						};
					}
				};
			}

			editor.startup();
			//call editor resize event, param is mandatory, otherwise function do nothing. after that scroll start working without first manual window resizing
			editor.resize({
				width: editor.ownerDocument.body.offsetWidth,
				height: editor.ownerDocument.body.offsetHeight
			});
			// call method onNormalizedDisplayChanged without setTimeout (this.defer)
			// (method queryCommandEnable returns a false value in Firefox)
			editor.onDisplayChanged = function () {
				this.onNormalizedDisplayChanged();
			};

			privateProps[this.propsId_Experimental].editor = editor;
		},

		set: function (value, content) {
			/// <summary>
			/// Obsolete. Works only for value "disabled". Use setDisabled instead.
			/// </summary>
			var editor = privateProps[this.propsId_Experimental].editor;
			switch (value) {
				case 'disabled':
					editor.set(value, content);
					break;
				default:
					break;
			}
		},

		setDisabled: function (value) {
			/// <summary>
			/// Disables/Enables Html Editor.
			/// </summary>
			/// <param name="value" type="bool"></param>
			var editor = privateProps[this.propsId_Experimental].editor;
			editor._setDisabledAttr(value);
		},

		insertImage: function (src, altText, align, border, hSpace, vSpace) {
			/// <summary>
			/// Adds an Html image tag.
			/// </summary>
			/// <param name="src" type="string">Url of Image</param>
			/// <param name="altText" type="string">Alternate text for an image</param>
			/// <param name="align" type="string">Alignment of an image according to surrounding elements</param>
			/// <param name="border" type="int">Width of the border around an image, pixels</param>
			/// <param name="hSpace" type="int">Whitespace on left and right side of an image, pixels</param>
			/// <param name="vSpace" type="int">Whitespace on "top" and "bottom" of an image, pixels</param>
			privateProps[this.propsId_Experimental].editor.execCommand(
				'inserthtmlex',
				stringModule.substitute('<image ${0} ${1} ${2} ${3} ${4} ${5} />', [
					src ? 'src = "' + src + '" ' : '',
					altText ? 'alt = "' + altText + '" ' : '',
					align ? 'align = "' + align + '" ' : '',
					border ? 'border = "' + border + '" ' : '',
					hSpace ? 'hspace = "' + hSpace + '" ' : '',
					vSpace ? 'vspace = "' + vSpace + '" ' : ''
				])
			);
		},

		getHTMLSource: function (bodyOnly) {
			/// <summary>
			/// Gets the current content of the editing area.
			/// </summary>
			/// <param name="bodyOnly" type="bool"></param>
			privateProps[this.propsId_Experimental].validateContent();
			var editor = privateProps[this.propsId_Experimental].editor,
				bodyBgColor = getBodyBgColor(editor),
				resultHTML = bodyOnly
					? editor.getValue()
					: stringModule.substitute(
							'<html>\n<head></head>\n<body ${1}>\n${0}</body>\n</html>',
							[
								editor.getValue(),
								!bodyBgColor
									? ''
									: 'style="background-color:' + colorToHex(bodyBgColor) + '"'
							]
					  );
			// replace the absolute portion of the URL with a relative protion  (..)
			if (editor.arasObj && editor.arasObj.getBaseURL) {
				var tmpBaseUrl = editor.arasObj.getBaseURL() + '/',
					escapedBaseUrl = tmpBaseUrl.replace(/\//g, '\\/'),
					urlsDic = editor.urlsDic,
					index;

				resultHTML = resultHTML.replace(new RegExp(escapedBaseUrl, 'g'), '../');

				// Replace formed urls with its origin vault urls
				for (index = 0; index < urlsDic.Count; index++) {
					resultHTML = resultHTML.replace(
						urlsDic.tempUrls[index],
						urlsDic.vaultUrls[index]
					);
				}
			}

			return resultHTML;
		},

		setHTMLSource: function (bodyOnly, source) {
			/// <summary>
			/// Sets the content of the editing area.
			/// </summary>
			/// <param name="bodyOnly" type="bool"></param>
			/// <param name="source" type="string"></param>
			var editor = privateProps[this.propsId_Experimental].editor,
				aras = editor.arasObj;

			if (aras && aras.getBaseURL) {
				source = source.replace(/src="\.\./g, 'src="' + aras.getBaseURL());
			}

			// Form dictionary and replace vault urls
			//we add tokens to urls, in getHtml we removed the tokens.
			var substr = 'vault:///?fileid=',
				urlsDic = editor.urlsDic,
				fileIdpos = source.toLowerCase().indexOf(substr),
				fileId,
				vaultUrlwithToken;

			if (aras && aras.IomInnovator) {
				while (fileIdpos != -1) {
					var vaultUrl = source.substring(
						fileIdpos,
						fileIdpos + substr.length + 32
					);
					fileIdpos += substr.length;
					fileId = vaultUrl.replace(/vault:\/\/\/\?fileid\=/i, '');
					vaultUrlwithToken = aras.IomInnovator.getFileUrl(
						fileId,
						aras.Enums.UrlType.SecurityToken
					);
					vaultUrlwithToken = vaultUrlwithToken.replace(/&/g, '&amp;');
					source = source.replace(vaultUrl, vaultUrlwithToken);
					urlsDic.vaultUrls[urlsDic.Count] = vaultUrl;
					urlsDic.tempUrls[urlsDic.Count] = vaultUrlwithToken;
					urlsDic.Count++;
					fileIdpos = source.toLowerCase().indexOf(substr, fileIdpos + 32);
				}
			}
			var bodyBgColor = getBodyBgColor(source),
				bodyContentRes = /<body[^>]*>((.|[\n\r])*)<\/body>/gi.exec(source);
			if (bodyBgColor) {
				editor.iframe.contentDocument.getElementsByTagName(
					'body'
				)[0].style.backgroundColor = bodyBgColor;
			}
			return bodyOnly && bodyContentRes
				? editor.setValue(bodyContentRes[1])
				: editor.setValue(source);
		},

		onLoadDeferred: function (callback) {
			/// <summary>
			/// Obsolete. In fact, it's onLoadDeferred.addCallback method, to eliminate it see an example of usage of initHandler parameter, e.g., in HTMLEditorDialog.html.
			/// </summary>
			/// <param name="callback" type="function"></param>
			var editor = privateProps[this.propsId_Experimental].editor;
			dijit.byId(editor.id).onLoadDeferred.addCallback(callback);
		},

		onBlur: function () {
			/// <summary>
			/// onBlur event.
			/// </summary>
		},

		onChange: function (newContent) {
			/// <summary>
			/// onChange event.
			/// </summary>
			/// <param name="newContent" type="string"></param>
		},

		onAfterPaste: function () {
			/// <summary>
			/// onAfterPaste event.
			/// </summary>
		}
		//don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
