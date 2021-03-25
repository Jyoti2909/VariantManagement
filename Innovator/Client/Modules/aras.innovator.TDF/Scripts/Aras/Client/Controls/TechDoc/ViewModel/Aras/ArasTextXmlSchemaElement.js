define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTextXmlSchemaElement/ArasTextStash',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTextXmlSchemaElement/ArasEmphText',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTextXmlSchemaElement/ArasTextSelection',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTextXmlSchemaElement/ArasTextHighlightning'
], function (
	declare,
	XmlSchemaElement,
	ArasTextStash,
	ArasEmphText,
	ArasTextSelection,
	ArasTextHighlightning
) {
	return declare(
		'Aras.Client.Controls.TechDoc.ViewModel.Aras.ArasTextXmlSchemaElement',
		XmlSchemaElement,
		{
			_textStash: null,
			_cursorSurround: null,
			_gaugeText: null,
			_rangeSelected: null,
			_ownerStyleSelected: null,
			_freezzyStyleHelper: null,
			// AllowedStyles
			_allowedStyles: {
				normal: 0,
				bold: 1,
				italic: 2,
				under: 4,
				strike: 8,
				sub: 16,
				sup: 32
			},
			_aras: null,
			_textHighlightning: null,

			constructor: function (args) {
				this._aras = this.ownerDocument._aras;
				if (!args.origin) {
					throw new Error(
						"Origin is not defined, don't know what type of origin should be created"
					);
				}

				this.selection = new ArasTextSelection(this);
				this._textHighlightning = new ArasTextHighlightning(this);
				this.registerType('ArasTextXmlSchemaElement');
			},

			getTextHighlightning: function () {
				return this._textHighlightning;
			},

			getStyleKeysFromDom: function (targetNode) {
				var styleKeys = [];

				if (targetNode) {
					var parentNode = targetNode.parentNode;
					var parentNodeName = parentNode && parentNode.nodeName.toLowerCase();
					var fontSize;

					while (
						parentNodeName &&
						parentNodeName !== 'span' &&
						parentNodeName !== 'div'
					) {
						switch (parentNodeName) {
							case 'u':
								styleKeys.push('under');
								break;
							case 'strong':
							case 'b':
								styleKeys.push('bold');
								break;
							case 'i':
								styleKeys.push('italic');
								break;
							case 'strike':
								styleKeys.push('strike');
								break;
							case 'font':
								fontSize = parentNode.getAttribute('size');
								styleKeys.push(fontSize == '1' ? 'sub' : 'normal');
								break;
						}

						parentNode = parentNode.parentNode;
						parentNodeName = parentNode && parentNode.nodeName.toLowerCase();
					}
				}

				return styleKeys;
			},

			getEmphDataFromDom: function (domElement, emphData) {
				emphData = emphData || [];

				if (domElement) {
					var currentChildNode = domElement.firstChild;
					var parentId = domElement.getAttribute('id');
					var parentStyle = domElement.getAttribute('data-style');
					var textContent = '';
					var nodeType;
					var nodeName;
					var prevNodeName;
					var i;

					parentStyle = parentStyle ? parentStyle.split(' ') : [];

					while (currentChildNode) {
						nodeType = currentChildNode.nodeType;
						nodeName = currentChildNode.nodeName.toLowerCase();

						if (nodeType === Node.ELEMENT_NODE) {
							switch (nodeName) {
								case 'br':
									textContent += '\n';

									break;
								case 'hlr':
									if (
										currentChildNode.childNodes.length === 1 &&
										currentChildNode.firstChild.nodeType === Node.TEXT_NODE
									) {
										textContent += this._getNormalizedTextContent(
											currentChildNode
										);
									} else {
										this.getEmphDataFromDom(currentChildNode, emphData);
									}
									break;
								default:
									if (nodeName === 'p') {
										if (currentChildNode !== domElement.firstChild) {
											textContent += '\n';
										}

										if (nodeName === prevNodeName) {
											textContent += '\n';
										}
									}

									if (textContent) {
										emphData.push({
											id: parentId,
											data: textContent,
											style: parentId
												? parentStyle
												: this.getStyleKeysFromDom(currentChildNode)
										});
										textContent = '';
									}

									this.getEmphDataFromDom(currentChildNode, emphData);
									break;
							}
						} else if (nodeType !== Node.COMMENT_NODE) {
							textContent += this._getNormalizedTextContent(currentChildNode);
						}

						prevNodeName = nodeName;
						currentChildNode = currentChildNode.nextSibling;
					}

					if (textContent) {
						emphData.push({
							id: parentId,
							data: textContent,
							style: parentId
								? parentStyle
								: this.getStyleKeysFromDom(domElement.firstChild)
						});
					}
				}

				return emphData;
			},

			updateFromDom: function (targetDomNode) {
				//after cancelling the last step generated HTML (node can not be found)
				if (!targetDomNode) {
					return;
				}

				var emphsData = targetDomNode.textContent
					? this.getEmphDataFromDom(targetDomNode)
					: [];
				var stash = this._textStash.Stash();
				var isModified = false;
				var stashIdList = {};
				var removedEmphs = [];
				var emphText;
				var emphObj;
				var emphData;
				var emphId;
				var nextEmph;
				var emphUid;
				var i;
				var j;

				for (i = 0; i < emphsData.length; i++) {
					emphData = emphsData[i];
					emphId = emphData.id;

					if (
						emphId &&
						!stashIdList[emphId] &&
						(emphObj = this._textStash.GetEmphObjById(emphId))
					) {
						emphText = emphObj.Text();

						if (emphText !== emphData.data) {
							if (emphData.data) {
								emphObj.Text(emphData.data);
								emphObj.Invalidate();

								stashIdList[emphId] = true;
							}

							isModified = true;
						} else if (emphText) {
							stashIdList[emphId] = true;
						}
					} else {
						emphObj = this.CreateNewEmphObject();
						emphObj.Text(emphData.data);
						emphId = emphObj.Id();

						for (j = 0; j < emphData.style.length; j++) {
							emphObj.Style(emphData.style[j], true);
						}

						this._textStash.RegisterEmph(emphObj, i);
						nextEmph = this.GetNextEmphObject(emphId);
						emphObj.SetBefore(nextEmph && nextEmph.Id());
						emphObj.Invalidate();

						stashIdList[emphId] = true;
						isModified = true;
					}
				}

				// searching for removed stash items
				for (i = 0; i < stash.length; i++) {
					emphUid = stash[i];

					if (!stashIdList[emphUid]) {
						removedEmphs.push(this._textStash.GetEmphObjById(emphUid));
						isModified = true;
					}
				}

				if (isModified) {
					this.ownerDocument.SuspendInvalidation();

					// unregister unused stash items
					for (i = removedEmphs.length - 1; i >= 0; i--) {
						removedEmphs[i].Delete();
					}

					this._invalidGaugeText();
					this.InvalidRange(this.ownerDocument.Cursor());

					this.NotifyChanged();
					this.ownerDocument.ResumeInvalidation();
				}

				return isModified;
			},

			syncTextStash: function (domApi) {
				// method is left for backward compatibility
				this.updateFromDom(domApi.getNodeById(this.Id()));
			},

			DeleteText: function (deleteBack) {
				var emphList = this.GetEmphRange();
				var count = emphList.length;

				if (count > 0) {
					var _viewmodel = this.ownerDocument;
					var cursor = _viewmodel.Cursor();
					var cursorPos = {
						startOffset: cursor.startOffset,
						endOffset: cursor.endOffset
					};
					var startPosition = this.selection.From().offset;
					var endPosition = this.selection.To().offset;
					var oldEmph = emphList[0];

					_viewmodel.SuspendInvalidation();
					this._invalidGaugeText();

					// if text is delete in one emph
					if (count == 1) {
						// when keyhandle is delete or  backspace
						if (startPosition == endPosition) {
							if (deleteBack) {
								// when  cursor stay on start of emph
								if (startPosition === 0) {
									var prevEmph = this.GetPreviousEmphObject(oldEmph.Id());

									if (prevEmph) {
										oldEmph = prevEmph;
										var lengthOfText = oldEmph.TextLength();
										startPosition = lengthOfText - 1;
										endPosition = lengthOfText;
									} else {
										_viewmodel.ResumeInvalidation();
										return; // Note : Because, we havn't previos emph node.
									}
								} else {
									startPosition--;
									cursorPos.startOffset--;
								}
							} else {
								// when cursor stay in end of emph
								if (endPosition == oldEmph.TextLength()) {
									var nextEmph = this.GetNextEmphObject(oldEmph.Id());

									if (nextEmph) {
										oldEmph = nextEmph;
										startPosition = 0;
										endPosition = 1;
									} else {
										_viewmodel.ResumeInvalidation();
										return; // Note : Because, we havn't next emph node.
									}
								} else {
									endPosition++;
									cursorPos.endOffset++;
								}
							}
						}
						oldEmph.CutText(startPosition, endPosition);
					} else {
						var emph;
						var i;

						if (startPosition > 0) {
							emphList[0] = emphList[0].Break(startPosition);
						}

						if (endPosition > 0) {
							emphList[count - 1].Break(endPosition);
						}

						for (i = 0; i < count; i++) {
							emph = emphList[i];

							if (emph) {
								emph.Delete();
							}
						}
					}

					this._freezzyStyleHelper = null;
					this._normalize();

					cursor.Set(this, cursorPos.startOffset, this, cursorPos.startOffset);
					this.InvalidRange(cursor);
					_viewmodel.ResumeInvalidation();
				}
			},

			InsertText: function (text) {
				function createNewInst() {
					emphObj = this.CreateNewEmphObject();
					isNewEmphCreate = true;
					startPosition = 0;
				}

				var isNewEmphCreate = false;
				var viewmodel = this.ownerDocument;
				var modelCursor = viewmodel.Cursor();
				var fromElement = this.selection.From();
				var startPosition;
				var emphObj;
				var emphId;

				if (!this.selection.IsValid()) {
					// If  selection is not set (pxtx is empty)
					if (this._textStash.IsInitialized()) {
						return;
					} else {
						createNewInst.apply(this);
					}
				} else {
					emphId = fromElement.id;
					startPosition = fromElement.offset;
				}

				if (this._freezzyStyleHelper) {
					// If presaved style (exp set cursor to end of word and apply style to next typing text)
					var cursorState = this._freezzyStyleHelper.cursorState;

					if (
						cursorState.id === this.Id() &&
						(!this._textStash.IsInitialized() ||
							(cursorState.position === modelCursor.startOffset &&
								cursorState.position === modelCursor.endOffset))
					) {
						var dataOfFreezedEmph = this._freezzyStyleHelper;
						var nextEmph;
						var curEmph;

						emphObj = this.GetEmphObjectById(emphId);

						if (fromElement) {
							curEmph = this.GetEmphObjectById(fromElement.id);
							nextEmph = curEmph.Break(fromElement.offset);

							if (!nextEmph) {
								nextEmph = this.GetNextEmphObject(curEmph.Id());
							}
						}

						createNewInst.apply(this);
						for (var _style in dataOfFreezedEmph.style) {
							if (dataOfFreezedEmph.style[_style]) {
								emphObj.Style(_style, true);
							}
						}

						if (nextEmph) {
							emphObj.SetBefore(nextEmph.Id());
						}

						if (curEmph) {
							curEmph.SetBefore(emphObj.Id());
						}

						emphObj.Invalidate();
					}
					// if start of emph and new emph
					// is not create or prev emph don't link
					// than move cursor to previous emph
				} else if (startPosition === 0 && !isNewEmphCreate) {
					var prevEmph = this.GetPreviousEmphObject(emphId);

					if (prevEmph && !prevEmph.IsLink()) {
						startPosition = prevEmph.TextLength();
						emphObj = prevEmph;
					}
				}

				this._freezzyStyleHelper = null;

				if (!emphObj && emphId) {
					// else if standart behavior
					emphObj = this.GetEmphObjectById(emphId);
				}

				emphId = emphObj.Id();
				viewmodel.SuspendInvalidation();

				this._preSaveCursorSurround();
				this._invalidGaugeText();
				var surrRes = this._getSurroundEmph(emphId);

				if (this.selection.IsRange()) {
					this.DeleteText();

					if (this.selection.IsValid()) {
						fromElement = this.selection.From();
						emphId = fromElement.id;
						startPosition = fromElement.offset;
						emphObj = this.GetEmphObjectById(emphId);
					} else {
						createNewInst.apply(this);
						emphId = emphObj.Id();
					}
				}

				if (!emphObj) {
					// get presaved emph from neighboring emphs
					if (surrRes) {
						emphObj = surrRes.obj;
						startPosition = surrRes.pos;
					}
				}

				if (!emphObj) {
					this.AlertError(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'viewmodel.nodewasntcreated'
						)
					);
					return;
				}

				var textofNode = emphObj.Text();
				if (!textofNode.length) {
					emphObj.Text(text);
				} else {
					emphObj.Text(
						[
							textofNode.slice(0, startPosition),
							text,
							textofNode.slice(startPosition)
						].join('')
					);
				}

				emphObj.Invalidate(true);

				var nextOffset = isNewEmphCreate
					? text.length
					: startPosition + text.length;
				this.selection.From(emphObj.Id(), nextOffset);
				this.selection.To(emphObj.Id(), nextOffset);

				var prevStartOffset = modelCursor.startOffset + text.length;
				modelCursor.Set(this, prevStartOffset, this, prevStartOffset);

				this.NotifyChanged();

				viewmodel.ResumeInvalidation();

				this.InvalidRange();
			},

			copyEmphStyle: function (sourceEmph, targetEmph) {
				var sourceStyle = sourceEmph.Style();
				var propertyName;

				for (propertyName in sourceStyle) {
					targetEmph.Style(propertyName, sourceStyle[propertyName]);
				}
			},

			InsertEmphs: function (/*Emph Array*/ emphArray) {
				var cursor = this.ownerDocument.Cursor();
				var sourcePos = {
					startOffset: cursor.startOffset,
					endOffset: cursor.endOffset
				};
				var textLength = 0;
				var currentEmphId = '';
				var cloneArr = [];
				var newEmph;
				var i;

				if (this.selection.IsRange()) {
					this.DeleteText();
				}

				for (i = 0; i < emphArray.length; i++) {
					newEmph = this.ImportEmph(emphArray[i]);
					cloneArr.push(newEmph);
					textLength += newEmph.TextLength();
				}

				if (this.selection.IsValid()) {
					//split by cursor position
					var fromElement = this.selection.From();
					var currentEmph = this.GetEmphObjectById(fromElement.id);
					var sourceText = currentEmph.Text();
					var curEmphText = sourceText.substring(fromElement.offset);
					var firstPartEmphText = sourceText.substring(0, fromElement.offset);
					var firstEmph = this.CreateNewEmphObject();

					currentEmphId = fromElement.id;
					currentEmph.Text(curEmphText);
					currentEmph.Invalidate();

					firstEmph.Text(firstPartEmphText);
					firstEmph.SetBefore(currentEmphId);
					this.copyEmphStyle(currentEmph, firstEmph);
					this.copyEmphLink(currentEmph, firstEmph);

					firstEmph.Invalidate();
				}

				//add emphs
				for (i = cloneArr.length - 1; i >= 0; i--) {
					newEmph = cloneArr[i];

					newEmph.SetBefore(currentEmphId);
					currentEmphId = newEmph.Id();
					newEmph.Invalidate();
				}

				//set cursor position
				cursor.Set(
					this,
					sourcePos.startOffset + textLength,
					this,
					sourcePos.startOffset + textLength
				);
				this._normalize();
				this.NotifyChanged();
			},

			ImportEmph: function (emph) {
				var cloneEmph = this.CreateNewEmphObject();

				cloneEmph.Text(emph.Text());
				cloneEmph._style = emph.CloneStyleObj();
				this.copyEmphLink(emph, cloneEmph);
				return cloneEmph;
			},

			GetStyleOfRange: function () {
				if (this._ownerStyleSelected) {
					return this._ownerStyleSelected;
				}

				if (this._freezzyStyleHelper) {
					return (this._ownerStyleSelected = this._freezzyStyleHelper.style);
				}

				if (this._rangeSelected && this._rangeSelected.length > 0) {
					/// TODO REFACTORING !!!!!!  Insert object with range of selected ids and if ids didn't change than don't reselect
					var items = this._rangeSelected.slice(0);
					var ownStyle = this.getStyleFlags();
					var fromElement = this.selection.From();
					var styleCount;
					var styleProperty;
					var cache;
					var item;
					var i;
					var j;

					if (
						items.length > 1 &&
						fromElement.offset === items[0].Text().length
					) {
						items = items.slice(1);
					}

					for (i = 0; i < items.length; i++) {
						item = items[i].Style();
						styleCount = 0;
						cache = [];

						for (styleProperty in ownStyle) {
							if (!item[styleProperty]) {
								cache.push(styleProperty);
							}

							styleCount++;
						}

						// If no own style
						if (cache.length == styleCount) {
							ownStyle = {};
							break;
						}

						// delete incuse styles from cache object
						for (j = 0; j < cache.length; j++) {
							delete ownStyle[cache[j]];
						}
					}

					this._ownerStyleSelected = ownStyle;
				}

				return this._ownerStyleSelected;
			},

			getStyleFlags: function () {
				var styleFlags = {};
				var styleName;

				for (styleName in this._allowedStyles) {
					styleFlags[styleName] = 1;
				}

				return styleFlags;
			},

			SetStyleForRange: function (strStyleToSet) {
				var self = this;
				var endOfWord = /[\s;,.?:!]/;
				var currentText = this.GetTextAsString();

				function isLetter(char) {
					return char && !endOfWord.test(char);
				}

				function setStyleForSingleEmph(emph, strStyleToSet, state) {
					emph.Style(strStyleToSet, state);

					if (state) {
						switch (strStyleToSet) {
							case 'sub':
								emph.Style('sup', false);
								break;
							case 'sup':
								emph.Style('sub', false);
								break;
						}
					}

					emph.Invalidate();
				}

				function setStyleForRangeEmph(emphList, selection) {
					var endPosition = selection.To().offset;
					var startPosition = selection.From().offset;

					function getCurrentStateForStyle(emphList, strStyleToSet) {
						var isSet = true;

						emphList.forEach(function (emph) {
							var style = emph.Style();

							if (!style[strStyleToSet]) {
								isSet = false;
							}
						});

						return isSet;
					}

					var nextId = self.GetNextEmphObject(
						emphList[emphList.length - 1].Id()
					);
					var secondPartOfEmph = emphList[emphList.length - 1].Break(
						endPosition
					);

					if (secondPartOfEmph) {
						secondPartOfEmph.SetBefore(nextId);
						secondPartOfEmph.Invalidate();
						nextId = secondPartOfEmph.Id();
					}

					if (startPosition === emphList[0].TextLength()) {
						emphList.splice(0, 1);
					} else if (startPosition !== 0) {
						emphList[0] = emphList[0].Break(startPosition);
					}

					var state = !getCurrentStateForStyle(emphList, strStyleToSet);

					emphList.forEach(function (emph) {
						setStyleForSingleEmph(emph, strStyleToSet, state);
					});

					for (var i = 0; i < emphList.length - 1; i++) {
						emphList[i].SetBefore(emphList[i + 1].Id());
					}

					emphList[emphList.length - 1].SetBefore(nextId);
				}

				function setStyleForSingleWord(cursorPosition) {
					var ptxtText = currentText;
					var startWordPosition = cursorPosition;
					var endWordPosition = cursorPosition;
					var isFound = false;

					//find the beginning of a word
					while (!isFound) {
						if (
							isLetter(ptxtText[startWordPosition]) &&
							startWordPosition > 0
						) {
							startWordPosition--;
						} else {
							if (!isLetter(ptxtText[startWordPosition])) {
								startWordPosition++;
							}

							isFound = true;
						}
					}

					//find the ending of a word
					isFound = false;
					while (!isFound) {
						if (
							isLetter(ptxtText[endWordPosition]) &&
							endWordPosition < ptxtText.length
						) {
							endWordPosition++;
						} else {
							isFound = true;
						}
					}

					var cursor = self.ownerDocument.Cursor();
					cursor.Set(self, startWordPosition, self, endWordPosition);
					self.InvalidRange(cursor);

					var startId = self.selection.From().id;
					var endId = self.selection.To().id;

					setStyleForRangeEmph(
						self.GetEmphRange(startId, endId),
						self.selection
					);
				}

				function setFreezzyStyleIfNeed(
					emphList,
					startPosition,
					cursorPositionStart
				) {
					if (!self._freezzyStyleHelper) {
						var isEndOfEmph = emphList[0].TextLength() == startPosition;
						var nextChar = -1;
						var prevChar = -1;
						var gaugeStr = currentText;

						if (gaugeStr.length > 0) {
							prevChar = gaugeStr[cursorPositionStart - 1];
							nextChar = gaugeStr[cursorPositionStart];
						}

						if (
							prevChar === undefined ||
							nextChar === undefined ||
							endOfWord.test(nextChar) ||
							endOfWord.test(prevChar)
						) {
							self._freezzyStyleHelper = {
								cursorState: { id: self.Id(), position: cursorPositionStart },
								style: isEndOfEmph ? emphList[0].CloneStyleObj() : {}
							};
						}
					}

					if (self._freezzyStyleHelper) {
						var switchStyle = styleCache[strStyleToSet] ? false : true;

						self._freezzyStyleHelper.style[strStyleToSet] = switchStyle;
						self._ownerStyleSelected[strStyleToSet] = switchStyle;
					}
				}

				function setFreezzyStyleForEmptyPtxt() {
					if (!self._freezzyStyleHelper) {
						self._freezzyStyleHelper = {
							cursorState: { id: self.Id(), position: 0 },
							style: {}
						};
					}

					if (!self._ownerStyleSelected) {
						self._ownerStyleSelected = {};
					}

					if (self._freezzyStyleHelper) {
						var switchStyle = !self._freezzyStyleHelper.style[strStyleToSet];

						self._freezzyStyleHelper.style[strStyleToSet] = switchStyle;
						self._ownerStyleSelected[strStyleToSet] = switchStyle;
					}
				}

				var emphList = this.GetEmphRange();
				var styleCache = this.GetStyleOfRange();
				var viewmodel = this.ownerDocument;
				var selection = this.selection;
				var cursor = viewmodel.Cursor();
				var sourceCursorOffset = {
					startOffset: cursor.startOffset,
					endOffset: cursor.endOffset
				};

				if (emphList.length > 0) {
					var startPosition = selection.From().offset;
					var endPosition = selection.To().offset;
					var oldEmph = emphList[0];

					viewmodel.SuspendInvalidation();

					// check for link on ultra emph's
					if (emphList[0].IsLink()) {
						startPosition = 0;
					}

					if (emphList[emphList.length - 1].IsLink()) {
						endPosition = emphList[emphList.length - 1].TextLength();
					}

					if (
						emphList.length == 1 &&
						startPosition === 0 &&
						endPosition == oldEmph.TextLength()
					) {
						var style = emphList[0].Style();
						var state = !style[strStyleToSet];

						setStyleForSingleEmph(emphList[0], strStyleToSet, state);
					} else if (emphList.length == 1 && startPosition == endPosition) {
						var ptxtText = currentText;
						var cursorPosition = sourceCursorOffset.startOffset;

						if (
							isLetter(ptxtText[cursorPosition - 1]) &&
							isLetter(ptxtText[cursorPosition])
						) {
							setStyleForSingleWord(sourceCursorOffset.startOffset);
						} else {
							setFreezzyStyleIfNeed(emphList, startPosition, cursorPosition);
						}
					} else {
						setStyleForRangeEmph(emphList, selection);
					}

					this._ownerStyleSelected = null;
					cursor.Set(
						this,
						sourceCursorOffset.startOffset,
						this,
						sourceCursorOffset.endOffset
					);

					this._normalize();
					viewmodel.ResumeInvalidation();
				} else {
					setFreezzyStyleForEmptyPtxt();
					cursor.Set(this, cursor.startOffset, this, cursor.endOffset);
				}
			},

			getFreezyStyle: function () {
				return this._freezzyStyleHelper && this._freezzyStyleHelper.style;
			},

			dropFreezyStyle: function () {
				this._freezzyStyleHelper = null;
			},

			LinkingText: function (linkData) {
				var viewmodel = this.ownerDocument;
				var emphList = this._rangeSelected;
				var isSet = linkData.set;
				var linkedEmphsCount = this.GetSelectedLinksCount();
				var emphCount = emphList.length;
				var emph;
				var i;

				if (linkedEmphsCount > 2) {
					this.AlertError(
						this._aras.getResource(
							'../Modules/aras.innovator.TDF',
							'viewmodel.selectionhasmanylinks'
						)
					);
					return;
				} else if (linkedEmphsCount == 1 && isSet) {
					viewmodel.SuspendInvalidation();

					for (i = 0; i < emphList.length; i++) {
						emph = emphList[i];

						if (emph.IsLink()) {
							emph.setLink(linkData.type, linkData);
							emph.Invalidate();
						}
					}

					this.NotifyChanged();
					viewmodel.ResumeInvalidation();
					return;
				}

				if (emphCount > 0) {
					var _selection = this.selection;
					var startPosition = this.selection.From().offset;
					var endPosition = this.selection.To().offset;
					var firstEmph = emphList[0];

					viewmodel.SuspendInvalidation();

					if (isSet) {
						if (
							emphCount == 1 &&
							startPosition === 0 &&
							endPosition == firstEmph.TextLength()
						) {
							if (firstEmph.IsLink()) {
								firstEmph.DeleteLink();
							} else {
								firstEmph.setLink(linkData.type, linkData);
							}
						} else if (emphCount == 1 && startPosition != endPosition) {
							emphList[0] = emphList[0].Break(startPosition);
							emphList[0].Break(endPosition - startPosition);
						} else if (emphCount == 1 && startPosition == endPosition) {
							var isSfind = true;
							var isEfind = true;
							var index;
							var sUid;
							var eUid;
							var text;
							var tmpEmph = firstEmph;
							var fixEmph;

							while (isSfind) {
								text = tmpEmph.Text();
								sUid = tmpEmph.Id();
								index = text.lastIndexOf(' ', startPosition);

								if (index > -1) {
									startPosition = index + 1;
									isSfind = false;

									if (startPosition == tmpEmph.TextLength()) {
										startPosition = 0;
										sUid = fixEmph.Id();
									}
								} else {
									fixEmph = tmpEmph;
									tmpEmph = this.GetPreviousEmphObject(sUid);

									if (!tmpEmph) {
										isSfind = false;
										startPosition = 0;
									} else {
										startPosition = tmpEmph.TextLength();
									}
								}
							}

							tmpEmph = firstEmph;
							while (isEfind) {
								text = tmpEmph.Text();
								eUid = tmpEmph.Id();
								index = text.indexOf(' ', endPosition);

								if (index > -1) {
									endPosition = index;
									isEfind = false;

									if (endPosition === 0) {
										endPosition = fixEmph.TextLength();
										eUid = fixEmph.Id();
									}
								} else {
									fixEmph = tmpEmph;
									tmpEmph = this.GetNextEmphObject(eUid);

									if (!tmpEmph) {
										isEfind = false;
										endPosition = fixEmph.TextLength();
									} else {
										endPosition = 0;
									}
								}
							}

							if (sUid != eUid) {
								emphList = this.GetEmphRange(sUid, eUid);
								emphCount = emphList.length;
							}

							if (startPosition > 0) {
								emphList[0] = emphList[0].Break(startPosition);
							}

							if (endPosition > 0) {
								if (sUid != eUid) {
									emphList[emphCount - 1].Break(endPosition);
								} else {
									emphList[emphCount - 1].Break(endPosition - startPosition);
								}
							}
						} else if (emphCount > 1) {
							if (startPosition > 0) {
								emphList[0] = emphList[0].Break(startPosition);

								if (!emphList[0]) {
									emphList.splice(0, 1);
									emphCount--;
								}
							}

							if (endPosition > 0) {
								emphList[emphCount - 1].Break(endPosition);
							}
						}

						firstEmph = emphList[0];
						firstEmph.setLink(linkData.type, linkData);

						for (i = 1; i < emphCount; i++) {
							emph = emphList[i];

							firstEmph.AppendText(emph.Text());
							emph.Delete();
						}
					} else {
						firstEmph.DeleteLink();
					}

					firstEmph.Invalidate();

					var offset = firstEmph.TextLength() - 1;
					var uid = firstEmph.Id();

					this.selection.From(uid, offset);
					this.selection.To(uid, offset);

					if (!isSet) {
						this._preSaveCursorSurround();
						this._normalize();
					}

					this.NotifyChanged();
					viewmodel.ResumeInvalidation();
					this.InvalidRange();
				}
			},

			DeleteLink: function () {
				var emphList = this._rangeSelected;

				if (emphList.length == 1) {
					var firstEmph = emphList[0];

					if (firstEmph.IsLink()) {
						this.ownerDocument.SuspendInvalidation();

						firstEmph.DeleteLink();
						firstEmph.Invalidate();

						this._preSaveCursorSurround();
						this._normalize();

						this.NotifyChanged();
						this.ownerDocument.ResumeInvalidation();

						this.InvalidRange();
					}
				}
			},

			InvalidRange: function (cursor) {
				var self = this;

				function LessComparer(lvalue, rvalue) {
					return lvalue < rvalue;
				}

				function LessEqualComparer(lvalue, rvalue) {
					return lvalue <= rvalue;
				}

				function getActualOffsetAndUId(offset, comparer) {
					var values = { uid: null, offset: offset };

					for (i = 0; i < count; i++) {
						var id = stash[i];
						var emphObj = self.GetEmphObjectById(id);

						textlength = emphObj.TextLength();

						if (comparer(textlength, offset)) {
							offset -= textlength;
						} else {
							values.uid = id;
							values.offset = offset;
							break;
						}
					}
					return values;
				}

				if (
					cursor &&
					cursor.commonAncestor &&
					cursor.commonAncestor.Id() === this.Id()
				) {
					var startOffset = cursor.startOffset;
					var endOffset = cursor.endOffset;
					var stash = this._textStash.Stash();
					var count = stash.length;
					var startUid;
					var endUid;
					var textlength;
					var actualHash;
					var i;

					// Drop _freezzyStyleHelper - presaved style
					if (
						this._freezzyStyleHelper &&
						startOffset != this._freezzyStyleHelper.cursorState.position &&
						this._textStash.IsInitialized()
					) {
						this._freezzyStyleHelper = null;
					}

					if (startOffset == endOffset) {
						actualHash = getActualOffsetAndUId(startOffset, LessComparer);
						endUid = startUid = actualHash.uid;
						startOffset = endOffset = actualHash.offset;
					} else {
						actualHash = getActualOffsetAndUId(startOffset, LessEqualComparer);
						startOffset = actualHash.offset;
						startUid = actualHash.uid;
						actualHash = getActualOffsetAndUId(endOffset, LessComparer);
						endOffset = actualHash.offset;
						endUid = actualHash.uid;
					}

					this.selection.From(startUid, startOffset);
					this.selection.To(endUid, endOffset);
				}

				this._rangeSelected = this.GetEmphRange();
				this._ownerStyleSelected = null;
			},

			GetEmphRange: function (startId, endId) {
				var range = [];

				if (this.selection.IsValid()) {
					var stash = this._textStash.Stash();

					startId = startId || this.selection.From().id;
					endId = endId || this.selection.To().id;

					if (startId == endId) {
						var emphObj = this._textStash.GetEmphObjById(startId);

						if (emphObj) {
							range.push(emphObj);
						}
					} else {
						var isStartFound = false;
						var emphId;
						var i;

						for (i = 0; i < stash.length; i++) {
							emphId = stash[i];
							isStartFound = isStartFound || emphId == startId;

							if (isStartFound) {
								range.push(this._textStash.GetEmphObjById(emphId));
							}

							if (emphId == endId) {
								break;
							}
						}
					}
				}

				return range;
			},

			GetEmphObjectById: function (uid) {
				return uid ? this._textStash.GetEmphObjById(uid) : null;
			},

			GetPreviousEmphObject: function (uid) {
				return uid
					? this._textStash.GetEmphObjById(
							this._textStash.GetSurroundForCursor(uid, 'prev')
					  )
					: null;
			},

			GetNextEmphObject: function (uid) {
				return uid
					? this._textStash.GetEmphObjById(
							this._textStash.GetSurroundForCursor(uid, 'next')
					  )
					: null;
			},

			copyEmphLink: function (sourceEmph, targetEmph) {
				if (sourceEmph.IsLink()) {
					const link = sourceEmph.Link();
					targetEmph.setLink(link.type, link);
				}
			},

			getEmphObjectByIndex: function (emphIndex) {
				if (emphIndex >= 0 && emphIndex <= this._textStash.Count() - 1) {
					var emphStash = this._textStash.Stash();

					return this._textStash.GetEmphObjById(emphStash[emphIndex]);
				}
			},

			getEmphsCount: function () {
				return this._textStash.Count();
			},

			CreateNewEmphObject: function (node) {
				return new ArasEmphText(this, node);
			},

			GetAttachedEmphObject: function () {
				return this.emph ? this.GetEmphObjectById(this.emph.id) : null;
			},

			GetTextAsString: function () {
				if (!this._gaugeText) {
					var stash = this._textStash.Stash();
					var gtext = '';
					var uid;
					var i;

					for (i = 0; i < stash.length; i++) {
						uid = stash[i];
						gtext += this._textStash.GetEmphObjById(uid).Text();
					}

					this._gaugeText = gtext;
				}

				return this._gaugeText;
			},

			GetSelectedLinksCount: function () {
				var emphList = this.GetEmphRange();
				var linksCount = 0;
				var emph;

				for (i = 0; i < emphList.length; i++) {
					emph = emphList[i];

					if (emph.IsLink() && emph.Link().type) {
						linksCount++;
					}
				}

				return linksCount;
			},

			IsHasEmphes: function () {
				return this._textStash.IsInitialized();
			},

			/* Overwritten Methods */
			_parseOriginInternal: function () {
				this._invalidGaugeText();
				this._textStash = new ArasTextStash(this);
				this.selection = new ArasTextSelection(this);
				this.InvalidRange(this.ownerDocument.Cursor());

				// init condition property
				this.internal.condition = this.Attribute('aras:condition');
			},

			NotifyChilds: function (notificationMessage) {},

			registerDocumentElement: function () {
				this.ownerDocument._RegisterElement(this);
			},

			unregisterDocumentElement: function () {
				this.ownerDocument._UnregisterElement(this);
			},

			ChildItems: function () {
				return {
					length: function () {
						return -1;
					}
				};
			},

			_normalize: function () {
				function compareStyles(a, b) {
					var style;

					for (style in a) {
						if (Boolean(a[style]) !== Boolean(b[style])) {
							return false;
						}
					}

					for (style in b) {
						if (Boolean(a[style]) !== Boolean(b[style])) {
							return false;
						}
					}

					return true;
				}

				var stash = this._textStash.Stash();
				var cursor = this.ownerDocument.Cursor();
				var sourceOffset = {
					startOffset: cursor.startOffset,
					endOffset: cursor.endOffset
				};
				var emphsToDelete = [];
				var i = 0;

				while (i < stash.length - 1) {
					var curEmphId = stash[i];
					var curEmph = this.GetEmphObjectById(curEmphId);
					var j = i + 1;

					if (!curEmph.IsLink()) {
						do {
							var nextEmphId = stash[j];
							var nextEmph = this.GetEmphObjectById(nextEmphId);

							if (nextEmph.IsLink()) {
								break;
							}

							var curEmphStyle = curEmph.Style();
							var nextEmphStyle = nextEmph.Style();

							if (compareStyles(curEmphStyle, nextEmphStyle)) {
								var newText = curEmph.Text() + nextEmph.Text();

								curEmph.Text(newText);
								curEmph.Invalidate(true);
								emphsToDelete.push(nextEmph);
							} else {
								break;
							}

							j++;
						} while (j < stash.length);
					}

					i = j;
				}

				emphsToDelete.forEach(function (emph) {
					emph.Delete();
				});

				this.ownerDocument
					.Cursor()
					.Set(this, sourceOffset.startOffset, this, sourceOffset.endOffset);
				this.InvalidRange(cursor);

				this.NotifyChanged();
			},

			_onEmphDelete: function (emph) {
				this._textStash.UnRegisterEmph(emph);
			},

			_onEmphAdd: function (emph, SetBeforeId) {
				var stash = this._textStash;
				var index = stash.GetNextPositionForSet(SetBeforeId);

				stash.RegisterEmph(emph, index);
			},

			_invalidGaugeText: function () {
				this._gaugeText = null;
			},

			_getSurroundEmph: function (uid) {
				var tmpEmph = this.GetPreviousEmphObject(uid);

				if (tmpEmph) {
					return { obj: tmpEmph, pos: tmpEmph.TextLength() };
				} else {
					tmpEmph = this.GetNextEmphObject(uid);

					if (tmpEmph) {
						return { obj: tmpEmph, pos: 0 };
					}
				}
			},

			_preSaveCursorSurround: function (key, value) {
				if (key) {
					this._cursorSurround[key] = value;
					return;
				}

				var from = this.selection.From();
				var to = this.selection.To();

				this._cursorSurround = this.selection.IsValid()
					? {
							first: this._textStash.GetSurroundForCursor(from.id, 'prev'),
							second: from.id,
							prev: to.id,
							last: this._textStash.GetSurroundForCursor(to.id, 'next'),
							sOffset: from.offset,
							eOffset: to.offset
					  }
					: {};
			}
		}
	);
});
