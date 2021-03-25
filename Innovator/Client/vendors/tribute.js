(function(f)
{ if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this } g.Tribute = f() } })(function() {
	var define, module, exports; return (function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function(e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++) s(r[o]); return s })({
		1: [function(require, module, exports) {
			"use strict";

			Object.defineProperty(exports, "__esModule", {
				value: true
			});

			var _createClass = function() { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function(Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

			var _utils = require("./utils");

			var _utils2 = _interopRequireDefault(_utils);

			var _TributeEvents = require("./TributeEvents");

			var _TributeEvents2 = _interopRequireDefault(_TributeEvents);

			var _TributeMenuEvents = require("./TributeMenuEvents");

			var _TributeMenuEvents2 = _interopRequireDefault(_TributeMenuEvents);

			var _TributeRange = require("./TributeRange");

			var _TributeRange2 = _interopRequireDefault(_TributeRange);

			var _TributeSearch = require("./TributeSearch");

			var _TributeSearch2 = _interopRequireDefault(_TributeSearch);

			function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

			function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

			var Tribute = function() {
				function Tribute(_ref) {
					var _this = this;

					var _ref$values = _ref.values,
						values = _ref$values === undefined ? null : _ref$values,
						_ref$iframe = _ref.iframe,
						iframe = _ref$iframe === undefined ? null : _ref$iframe,
						_ref$selectClass = _ref.selectClass,
						selectClass = _ref$selectClass === undefined ? 'highlight' : _ref$selectClass,
						_ref$trigger = _ref.trigger,
						trigger = _ref$trigger === undefined ? '@' : _ref$trigger,
						_ref$selectTemplate = _ref.selectTemplate,
						selectTemplate = _ref$selectTemplate === undefined ? null : _ref$selectTemplate,
						_ref$menuItemTemplate = _ref.menuItemTemplate,
						menuItemTemplate = _ref$menuItemTemplate === undefined ? null : _ref$menuItemTemplate,
						_ref$lookup = _ref.lookup,
						lookup = _ref$lookup === undefined ? 'key' : _ref$lookup,
						_ref$fillAttr = _ref.fillAttr,
						fillAttr = _ref$fillAttr === undefined ? 'value' : _ref$fillAttr,
						_ref$collection = _ref.collection,
						collection = _ref$collection === undefined ? null : _ref$collection,
						_ref$menuContainer = _ref.menuContainer,
						menuContainer = _ref$menuContainer === undefined ? null : _ref$menuContainer,
						_ref$noMatchTemplate = _ref.noMatchTemplate,
						noMatchTemplate = _ref$noMatchTemplate === undefined ? null : _ref$noMatchTemplate,
						_ref$requireLeadingSp = _ref.requireLeadingSpace,
						requireLeadingSpace = _ref$requireLeadingSp === undefined ? true : _ref$requireLeadingSp,
						_ref$allowSpaces = _ref.allowSpaces,
						allowSpaces = _ref$allowSpaces === undefined ? false : _ref$allowSpaces,
						_ref$container = _ref.container,
						container = _ref$container === undefined ? null : _ref$container,
						_ref$replaceTextSuffi = _ref.replaceTextSuffix,
						replaceTextSuffix = _ref$replaceTextSuffi === undefined ? null : _ref$replaceTextSuffi;

					_classCallCheck(this, Tribute);

					this.menuSelected = 0;
					this.current = {};
					this.inputEvent = false;
					this.isActive = false;
					this.menuContainer = menuContainer;
					this.allowSpaces = allowSpaces;
					this.replaceTextSuffix = replaceTextSuffix;

					if (values) {
						this.collection = [{
							// symbol that starts the lookup
							trigger: trigger,

							iframe: iframe,

							selectClass: selectClass,

							// function called on select that retuns the content to insert
							selectTemplate: (selectTemplate || Tribute.defaultSelectTemplate).bind(this),

							// function called that returns content for an item
							menuItemTemplate: (menuItemTemplate || Tribute.defaultMenuItemTemplate).bind(this),

							// function called when menu is empty, disables hiding of menu.
							noMatchTemplate: function(t) {
								if (typeof t === 'function') {
									return t.bind(_this);
								}

								return null;
							}(noMatchTemplate),

							// column to search against in the object
							lookup: lookup,

							// column that contains the content to insert by default
							fillAttr: fillAttr,

							// array of objects or a function returning an array of objects
							values: values,

							requireLeadingSpace: requireLeadingSpace
						}];
					} else if (collection) {
						this.collection = collection.map(function(item) {
							return {
								trigger: item.trigger || trigger,
								iframe: item.iframe || iframe,
								selectClass: item.selectClass || selectClass,
								selectTemplate: (item.selectTemplate || Tribute.defaultSelectTemplate).bind(_this),
								menuItemTemplate: (item.menuItemTemplate || Tribute.defaultMenuItemTemplate).bind(_this),
								// function called when menu is empty, disables hiding of menu.
								noMatchTemplate: function(t) {
									if (typeof t === 'function') {
										return t.bind(_this);
									}

									return null;
								}(noMatchTemplate),
								lookup: item.lookup || lookup,
								fillAttr: item.fillAttr || fillAttr,
								values: item.values,
								requireLeadingSpace: item.requireLeadingSpace
							};
						});
					} else {
						throw new Error('[Tribute] No collection specified.');
					}

					new _TributeRange2.default(this);
					new _TributeEvents2.default(this);
					new _TributeMenuEvents2.default(this);
					new _TributeSearch2.default(this);
				}

				_createClass(Tribute, [{
					key: "triggers",
					value: function triggers() {
						return this.collection.map(function(config) {
							return config.trigger;
						});
					}
				}, {
					key: "attach",
					value: function attach(el) {
						if (!el) {
							throw new Error('[Tribute] Must pass in a DOM node or NodeList.');
						}

						// Check if it is a jQuery collection
						if (typeof jQuery !== 'undefined' && el instanceof jQuery) {
							el = el.get();
						}

						// Is el an Array/Array-like object?
						if (el.constructor === NodeList || el.constructor === HTMLCollection || el.constructor === Array) {
							var length = el.length;
							for (var i = 0; i < length; ++i) {
								this._attach(el[i]);
							}
						} else {
							this._attach(el);
						}
					}
				}, {
					key: "_attach",
					value: function _attach(el) {
						if (el.hasAttribute('data-tribute')) {
							console.warn('Tribute was already bound to ' + el.nodeName);
						}

						this.ensureEditable(el);
						this.events.bind(el);
						el.setAttribute('data-tribute', true);
						this.container = el;
					}
				}, {
					key: "ensureEditable",
					value: function ensureEditable(element) {
						if (Tribute.inputTypes().indexOf(element.nodeName) === -1) {
							if (element.contentEditable) {
								element.contentEditable = true;
							} else {
								throw new Error('[Tribute] Cannot bind to ' + element.nodeName);
							}
						}
					}
				}, {
					key: "createMenu",
					value: function createMenu() {
						var wrapper = this.range.getDocument().createElement('div');
						wrapper.className = 'tribute-container';
						var popupWrapper = this.range.getDocument().createElement('div');
						popupWrapper.className = 'popup-container';
						wrapper.appendChild(popupWrapper);
						var ul = this.range.getDocument().createElement('ul');
						popupWrapper.appendChild(ul);

						if (this.menuContainer) {
							return this.menuContainer.appendChild(wrapper);
						}

						return this.range.getDocument().body.appendChild(wrapper);
					}
				}, {
					key: "showMenuFor",
					value: function showMenuFor(element, scrollTo) {
						var _this2 = this;

						// Only proceed if menu isn't already shown for the current element & mentionText
						if (this.isActive && this.current.element === element && this.current.mentionText === this.currentMentionTextSnapshot) {
							return;
						}
						this.currentMentionTextSnapshot = this.current.mentionText;

						// create the menu if it doesn't exist.
						if (!this.menu) {
							this.menu = this.createMenu();
							this.menuEvents.bind(this.menu);
						}

						this.isActive = true;
						this.menuSelected = 0;

						if (!this.current.mentionText) {
							this.current.mentionText = '';
						}

						var processValues = function processValues(values) {
							// Tribute may not be active any more by the time the value callback returns
							if (!_this2.isActive) {
								return;
							}
							var items = _this2.search.filter(_this2.current.mentionText, values, {
								pre: '<span>',
								post: '</span>',
								extract: function extract(el) {
									if (typeof _this2.current.collection.lookup === 'string') {
										return el[_this2.current.collection.lookup];
									} else if (typeof _this2.current.collection.lookup === 'function') {
										return _this2.current.collection.lookup(el);
									} else {
										throw new Error('Invalid lookup attribute, lookup must be string or function.');
									}
								}
							});

							_this2.current.filteredItems = items;

							var ul = _this2.menu.querySelector('ul');

							if (!items.length) {
								if (!_this2.current.collection.noMatchTemplate) {
									_this2.hideMenu();
								} else {
									ul.innerHTML = _this2.current.collection.noMatchTemplate();
								}

								return;
							}

							ul.innerHTML = '';
							_this2.menuSelected = -1;
							items.forEach(function(item, index) {
								var li = _this2.range.getDocument().createElement('li');
								li.setAttribute('data-index', index);
								li.addEventListener('mouseenter', function(e) {
									var li = e.target;
									var index = li.getAttribute('data-index');
									_this2.events.setActiveLi(index);
								});
								if (_this2.menuSelected === index) {
									li.className = _this2.current.collection.selectClass;
								}
								li.innerHTML = _this2.current.collection.menuItemTemplate(item);
								ul.appendChild(li);
							});

							_this2.range.positionMenuAtCaret(scrollTo);
							
							if (_this2.menu.firstChild) {
								_this2.menu.firstChild.scrollTop = 0;
							}
						};

						if (typeof this.current.collection.values === 'function') {
							this.current.collection.values(this.current.mentionText, processValues);
						} else {
							processValues(this.current.collection.values);
						}
					}
				}, {
					key: "hideMenu",
					value: function hideMenu() {
						if (this.menu) {
							this.menu.style.cssText = 'display: none;';
							this.isActive = false;
							this.menuSelected = 0;
							this.current = {};
						}
					}
				}, {
					key: "selectItemAtIndex",
					value: function selectItemAtIndex(index) {
						index = parseInt(index);
						if (typeof index !== 'number') return;
						var item = this.current.filteredItems[index];
						var content = this.current.collection.selectTemplate(item);
						this.replaceText(content);
					}
				}, {
					key: "replaceText",
					value: function replaceText(content) {
						this.range.replaceTriggerText(content, true, true);
					}
				}, {
					key: "_append",
					value: function _append(collection, newValues, replace) {
						if (typeof collection.values === 'function') {
							throw new Error('Unable to append to values, as it is a function.');
						} else if (!replace) {
							collection.values = collection.values.concat(newValues);
						} else {
							collection.values = newValues;
						}
					}
				}, {
					key: "append",
					value: function append(collectionIndex, newValues, replace) {
						var index = parseInt(collectionIndex);
						if (typeof index !== 'number') throw new Error('please provide an index for the collection to update.');

						var collection = this.collection[index];

						this._append(collection, newValues, replace);
					}
				}, {
					key: "appendCurrent",
					value: function appendCurrent(newValues, replace) {
						if (this.isActive) {
							this._append(this.current.collection, newValues, replace);
						} else {
							throw new Error('No active state. Please use append instead and pass an index.');
						}
					}
				}], [{
					key: "defaultSelectTemplate",
					value: function defaultSelectTemplate(item) {
						if (this.range.isContentEditable(this.current.element)) {
							return '<span class="tribute-mention">' + (this.current.collection.trigger + item.original[this.current.collection.fillAttr]) + '</span>';
						}

						return this.current.collection.trigger + item.original[this.current.collection.fillAttr];
					}
				}, {
					key: "defaultMenuItemTemplate",
					value: function defaultMenuItemTemplate(matchItem) {
						return matchItem.string;
					}
				}, {
					key: "inputTypes",
					value: function inputTypes() {
						return ['TEXTAREA', 'INPUT'];
					}
				}]);

				return Tribute;
			}();

			exports.default = Tribute;
			module.exports = exports["default"];

		}, { "./TributeEvents": 2, "./TributeMenuEvents": 3, "./TributeRange": 4, "./TributeSearch": 5, "./utils": 7 }], 2: [function(require, module, exports) {
			'use strict';

			Object.defineProperty(exports, "__esModule", {
				value: true
			});

			var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) { return typeof obj; } : function(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

			var _createClass = function() { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function(Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

			function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

			var TributeEvents = function() {
				function TributeEvents(tribute) {
					_classCallCheck(this, TributeEvents);

					this.tribute = tribute;
					this.tribute.events = this;
				}

				_createClass(TributeEvents, [{
					key: 'bind',
					value: function bind(element) {
						element.addEventListener('keydown', this.keydown.bind(element, this), false);
						element.addEventListener('keyup', this.keyup.bind(element, this), false);
						element.addEventListener('input', this.input.bind(element, this), false);
					}
				}, {
					key: 'keydown',
					value: function keydown(instance, event) {
						if (this === undefined && !instance.shouldDeactivate) {
							event.preventDefault();
							event.stopPropagation();
							return;
						}

						if (instance.shouldDeactivate(event)) {
							instance.tribute.isActive = false;
						}

						var element = this;
						instance.commandEvent = false;
						function callCharEventWithIME(o, value, keyCode) {
							if (o.value.toLowerCase() === value && event.keyCode === 229 && event.code === keyCode) {
								instance.commandEvent = true;
								instance.callbacks()[o.value.toLowerCase()](event, element);
							}
						}

						TributeEvents.keys().forEach(function(o) {
							callCharEventWithIME(o, 'down', 'ArrowDown');
							callCharEventWithIME(o, 'up', 'ArrowUp');
							callCharEventWithIME(o, 'enter', 'Enter');
							if (o.key === event.keyCode) {
								instance.commandEvent = true;
								instance.callbacks()[o.value.toLowerCase()](event, element);
							}
						});
					}
				}, {
					key: 'input',
					value: function input(instance, event) {
						instance.inputEvent = true;
						instance.keyup.call(this, instance, event);
					}
				}, {
					key: 'click',
					value: function click(instance, event) {
						var tribute = instance.tribute;

						if (tribute.menu && tribute.menu.contains(event.target)) {
							var li = event.target;
							while (li.nodeName.toLowerCase() !== 'li') {
								li = li.parentNode;
								if (!li || li === tribute.menu) {
									throw new Error('cannot find the <li> container for the click');
								}
							}
							tribute.selectItemAtIndex(li.getAttribute('data-index'));
							tribute.hideMenu();
						} else if (tribute.current.element) {
							tribute.hideMenu();
						}
					}
				}, {
					key: 'keyup',
					value: function keyup(instance, event, isComposing) {
						var _this = this;

						if (instance.inputEvent) {
							instance.inputEvent = false;
						}
						instance.updateSelection(this);

						if (event.keyCode === 27 || event.keyCode === 39 || event.keyCode === 37) {
							return;
						}

						if (!instance.tribute.isActive) {
							var _ret = function() {
								var keyCode = instance.getKeyCode(instance, _this, event);

								if (isNaN(keyCode) || !keyCode) return {
									v: void 0
								};

								var trigger = instance.tribute.triggers().find(function(trigger) {
									return trigger.charCodeAt(0) === keyCode;
								});

								if (typeof trigger !== 'undefined') {
									instance.callbacks().triggerChar(event, _this, trigger);
								}
							}();

							if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
						}

						if (instance.tribute.current.trigger && (instance.commandEvent === false || event.keyCode === 8 || isComposing)) {
							if (event.keyCode === 32 && !instance.tribute.current.mentionText) {
								// ignore space keycode in case when we choose symbol by composing
								return;
							}

							if (aras.Browser.getBrowserCode() === 'ie' && isComposing && event.keyCode !== 13) {
								// ignore all keycode for ja locale except 'enter'(end of typing 1 symbol)
								return;
							}

							if (!event.keyCode && event.isComposing && event.type === 'input') {
								// ignore input event when we didn't finish typing a composing symbol (ff)
								return;
							}

							if (aras.Browser.getBrowserCode() === 'ch' && event.isComposing && !isComposing) {
								// ignore all keycode for ja locale except 'enter'(end of typing 1 symbol)
								return;
							}

							instance.tribute.showMenuFor(this, true);
						}
					}
				}, {
					key: 'shouldDeactivate',
					value: function shouldDeactivate(event) {
						if (!this.tribute.isActive) return false;

						if (this.tribute.current.mentionText.length === 0) {
							var eventKeyPressed = false;
							TributeEvents.keys().forEach(function(o) {
								if (event.keyCode === o.key) eventKeyPressed = true;

								// if we choose a symbol by composing and then press enter
								// keyCode would always 229, so we should see on property code.
								if (event.keyCode === 229 && event.code === 'Enter') {
									eventKeyPressed = true;
								}
							});

							return !eventKeyPressed;
						}

						return false;
					}
				}, {
					key: 'getKeyCode',
					value: function getKeyCode(instance, el, event) {
						var char = void 0;
						var tribute = instance.tribute;
						var info = tribute.range.getTriggerInfo(false, false, true, tribute.allowSpaces);

						if (info) {
							return info.mentionTriggerChar.charCodeAt(0);
						} else {
							return false;
						}
					}
				}, {
					key: 'updateSelection',
					value: function updateSelection(el) {
						this.tribute.current.element = el;
						var info = this.tribute.range.getTriggerInfo(false, false, true, this.tribute.allowSpaces);

						if (info) {
							this.tribute.current.selectedPath = info.mentionSelectedPath;
							this.tribute.current.mentionText = info.mentionText;
							this.tribute.current.selectedOffset = info.mentionSelectedOffset;
						}
					}
				}, {
					key: 'callbacks',
					value: function callbacks() {
						var _this2 = this;

						return {
							triggerChar: function triggerChar(e, el, trigger) {
								var tribute = _this2.tribute;
								tribute.current.trigger = trigger;

								var collectionItem = tribute.collection.find(function(item) {
									return item.trigger === trigger;
								});

								tribute.current.collection = collectionItem;
								if (tribute.inputEvent) tribute.showMenuFor(el, true);
							},
							enter: function enter(e, el) {
								// choose selection
								if (_this2.tribute.isActive) {
									if (_this2.tribute.menuSelected > -1) {
										e.preventDefault();
										setTimeout(function () {
											_this2.tribute.selectItemAtIndex(_this2.tribute.menuSelected);
											_this2.tribute.hideMenu();
										}, 0);
									}
								}
							},
							escape: function escape(e, el) {
								if (_this2.tribute.isActive) {
									e.preventDefault();
									_this2.tribute.hideMenu();
								}
							},
							tab: function tab(e, el) {
								// choose first match
								_this2.callbacks().enter(e, el);
							},
							up: function up(e, el) {
								// navigate up ul
								if (_this2.tribute.isActive) {
									e.preventDefault();
									var count = _this2.tribute.current.filteredItems.length,
										selected = _this2.tribute.menuSelected;

									if (count > selected && selected > 0) {
										_this2.tribute.menuSelected--;
										_this2.setActiveLi();
									} else if (selected === 0) {
										return;
									}
								}
							},
							down: function down(e, el) {
								// navigate down ul
								if (_this2.tribute.isActive) {
									e.preventDefault();
									var count = _this2.tribute.current.filteredItems.length - 1,
										selected = _this2.tribute.menuSelected;

									if (count > selected) {
										_this2.tribute.menuSelected++;
										_this2.setActiveLi();
									} else if (count === selected) {
										return;
									}
								}
							},
							delete: function _delete(e, el) {
								if (_this2.tribute.isActive && _this2.tribute.current.mentionText.length < 1) {
									_this2.tribute.hideMenu();
								} else if (_this2.tribute.isActive) {
									_this2.tribute.showMenuFor(el);
								}
							}
						};
					}
				}, {
					key: 'setActiveLi',
					value: function setActiveLi(index) {
						var lis = this.tribute.menu.querySelectorAll('li');
						var length = lis.length >>> 0;

						// get heights
						var menuFullHeight = this.getFullHeight(this.tribute.menu);
						var liHeight = this.getFullHeight(lis[0]);

						if (index) {
							this.tribute.menuSelected = index;
						}

						for (var i = 0; i < length; i++) {
							var li = lis[i];
							if (i === this.tribute.menuSelected) {
								var offset = liHeight * (i + 1);
								var scrollTop = this.tribute.menu.firstChild.scrollTop;
								var totalScroll = scrollTop + menuFullHeight;

								if (offset > totalScroll) {
									this.tribute.menu.firstChild.scrollTop += liHeight;
								} else if (offset < totalScroll) {
									this.tribute.menu.firstChild.scrollTop -= liHeight;
								}

								li.className = this.tribute.current.collection.selectClass;
							} else {
								li.className = '';
							}
						}
					}
				}, {
					key: 'getFullHeight',
					value: function getFullHeight(elem, includeMargin) {
						var height = elem.getBoundingClientRect().height;

						if (includeMargin) {
							var style = elem.currentStyle || window.getComputedStyle(elem);
							return height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
						}

						return height;
					}
				}], [{
					key: 'keys',
					value: function keys() {
						return [{
							key: 9,
							value: 'TAB'
						}, {
							key: 8,
							value: 'DELETE'
						}, {
							key: 13,
							value: 'ENTER'
						}, {
							key: 27,
							value: 'ESCAPE'
						}, {
							key: 38,
							value: 'UP'
						}, {
							key: 40,
							value: 'DOWN'
						}];
					}
				}]);

				return TributeEvents;
			}();

			exports.default = TributeEvents;
			module.exports = exports['default'];

		}, {}], 3: [function(require, module, exports) {
			'use strict';

			Object.defineProperty(exports, "__esModule", {
				value: true
			});

			var _createClass = function() { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function(Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

			function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

			var TributeMenuEvents = function() {
				function TributeMenuEvents(tribute) {
					_classCallCheck(this, TributeMenuEvents);

					this.tribute = tribute;
					this.tribute.menuEvents = this;
					this.menu = this.tribute.menu;
				}

				_createClass(TributeMenuEvents, [{
					key: 'bind',
					value: function bind(menu) {
						var _this = this;

						menu.addEventListener('keydown', this.tribute.events.keydown.bind(this.menu, this), false);
						this.tribute.range.getDocument().addEventListener('click', this.tribute.events.click.bind(null, this), false);
						window.addEventListener('resize', this.debounce(function() {
							if (_this.tribute.isActive) {
								_this.tribute.showMenuFor(_this.tribute.current.element, true);
							}
						}, 300, false));

						if (this.menuContainer) {
							this.menuContainer.addEventListener('scroll', this.debounce(function() {
								if (_this.tribute.isActive) {
									_this.tribute.showMenuFor(_this.tribute.current.element, false);
								}
							}, 300, false), false);
						} else {
							window.onscroll = this.debounce(function() {
								if (_this.tribute.isActive) {
									_this.tribute.showMenuFor(_this.tribute.current.element, false);
								}
							}, 300, false);
						}
					}
				}, {
					key: 'debounce',
					value: function debounce(func, wait, immediate) {
						var _this2 = this,
							_arguments = arguments;

						var timeout;
						return function() {
							var context = _this2,
								args = _arguments;
							var later = function later() {
								timeout = null;
								if (!immediate) func.apply(context, args);
							};
							var callNow = immediate && !timeout;
							clearTimeout(timeout);
							timeout = setTimeout(later, wait);
							if (callNow) func.apply(context, args);
						};
					}
				}]);

				return TributeMenuEvents;
			}();

			exports.default = TributeMenuEvents;
			module.exports = exports['default'];

		}, {}], 4: [function(require, module, exports) {
			'use strict';

			Object.defineProperty(exports, "__esModule", {
				value: true
			});

			var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) { return typeof obj; } : function(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

			var _createClass = function() { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function(Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

			function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

			// Thanks to https://github.com/jeff-collins/ment.io
			var TributeRange = function() {
				function TributeRange(tribute) {
					_classCallCheck(this, TributeRange);

					this.tribute = tribute;
					this.tribute.range = this;
				}

				_createClass(TributeRange, [{
					key: 'getDocument',
					value: function getDocument() {
						var iframe = void 0;
						if (this.tribute.current.collection) {
							iframe = this.tribute.current.collection.iframe;
						}

						if (!iframe) {
							return document;
						}

						return iframe.contentWindow.document;
					}
				}, {
					key: 'positionMenuAtCaret',
					value: function positionMenuAtCaret(scrollTo) {
						var _this = this;

						var context = this.tribute.current,
							coordinates = void 0;
						var info = this.getTriggerInfo(false, false, true, this.tribute.allowSpaces);

						if (info !== undefined) {
							if (!this.isContentEditable(context.element)) {
								coordinates = this.getTextAreaOrInputUnderlinePosition(this.getDocument().activeElement, info.mentionPosition);
							} else {
								coordinates = this.getContentEditableCaretPosition(info.mentionPosition);
							}

							// Move the button into place.
							this.tribute.menu.style.cssText = 'top: ' + coordinates.top + 'px;\n                                       left: ' + coordinates.left + 'px;\n                                       position: absolute;\n                                       zIndex: 10000;\n                                       display: block;';

							setTimeout(function() {
								if (scrollTo) _this.scrollIntoView(_this.getDocument().activeElement);
							}, 0);
						} else {
							this.tribute.menu.style.cssText = 'display: none';
						}
					}
				}, {
					key: 'selectElement',
					value: function selectElement(targetElement, path, offset) {
						var cursorInformation = this.tribute.lastCursorInfo;
						if (cursorInformation !== undefined) {
							this.focusByPath(cursorInformation);
						} else {
							var range = void 0;
							var elem = targetElement;

							if (path) {
								for (var i = 0; i < path.length; i++) {
									elem = elem.childNodes[path[i]];
									if (elem === undefined) {
										return;
									}
									while (elem.length < offset) {
										offset -= elem.length;
										elem = elem.nextSibling;
									}
									if (elem.childNodes.length === 0 && !elem.length) {
										elem = elem.previousSibling;
									}
								}
							}
							var sel = this.getWindowSelection();

							range = this.getDocument().createRange();
							range.setStart(elem, offset);
							range.setEnd(elem, offset);
							range.collapse(true);

							try {
								sel.removeAllRanges();
							} catch (error) { }

							sel.addRange(range);
							targetElement.focus();
						}
					}
				}, {
					key: 'resetSelection',
					value: function resetSelection(targetElement, path, offset) {
						if (!this.isContentEditable(targetElement)) {
							if (targetElement !== this.getDocument().activeElement) {
								targetElement.focus();
							}
						} else {
							this.selectElement(targetElement, path, offset);
						}
					}
				}, {
					key: 'getNodeContentLength',
					value: function getNodeContentLength(node) {
						var innerText = (node.nodeType === 3) ? node.nodeValue : node.textContent;
						if (innerText !== null) {
							return innerText.length;
						}
						return 0;
					}
				}, {
					key: 'focusByPath',
					value: function focusByPath(cursorInfo) {
						cursorInfo.selected.focus();
						var range = document.createRange();
						var sel = window.getSelection();

						var nodeLength = this.getNodeContentLength(cursorInfo.currentNode);
						if (nodeLength < cursorInfo.offset) {
							if (cursorInfo.currentNode.nextSibling) {
								cursorInfo.offset = cursorInfo.offset - nodeLength;
								cursorInfo.currentNode = cursorInfo.currentNode.nextSibling;
							}
						}
						if (cursorInfo.currentNode.nodeType === 1) {
							range.selectNodeContents(cursorInfo.currentNode);

						} else {
							range.setStart(cursorInfo.currentNode, cursorInfo.offset);
						}
						range.setStart(cursorInfo.currentNode, cursorInfo.offset);
						range.collapse(true);
						sel.removeAllRanges();
						sel.addRange(range);
					}
				}, {
					key: 'replaceTriggerText',
					value: function replaceTriggerText(text, requireLeadingSpace, hasTrailingSpace) {
						var context = this.tribute.current;
						this.resetSelection(context.element, context.selectedPath, context.selectedOffset);

						var info = this.getTriggerInfo(true, hasTrailingSpace, requireLeadingSpace, this.tribute.allowSpaces);

						// Create the event
						var replaceEvent = new CustomEvent('tribute-replaced', {
							detail: text
						});

						if (info !== undefined) {
							if (!this.isContentEditable(context.element)) {
								var myField = this.getDocument().activeElement;
								var textSuffix = typeof this.tribute.replaceTextSuffix == 'string' ? this.tribute.replaceTextSuffix : ' ';
								text += textSuffix;
								var startPos = info.mentionPosition;
								var endPos = info.mentionPosition + info.mentionText.length + textSuffix.length;
								myField.value = myField.value.substring(0, startPos) + text + myField.value.substring(endPos, myField.value.length);
								myField.selectionStart = startPos + text.length;
								myField.selectionEnd = startPos + text.length;
							} else {
								// add a space to the end of the pasted text
								var _textSuffix = typeof this.tribute.replaceTextSuffix == 'string' ? this.tribute.replaceTextSuffix : '\xA0';
								text += _textSuffix;
								this.pasteHtml(text, info.mentionPosition, info.mentionPosition + info.mentionText.length + 1);
							}

							context.element.dispatchEvent(replaceEvent);
						}
					}
				}, {
					key: 'pasteHtml',
					value: function pasteHtml(html, startPos, endPos) {
						var range = void 0,
							sel = void 0;
						sel = this.getWindowSelection();
						range = this.getDocument().createRange();
						range.setStart(sel.anchorNode, startPos);
						range.setEnd(sel.anchorNode, endPos);
						range.deleteContents();

						var el = this.getDocument().createElement('div');
						el.innerHTML = html;
						var frag = this.getDocument().createDocumentFragment(),
							node = void 0,
							lastNode = void 0;
						while (node = el.firstChild) {
							lastNode = frag.appendChild(node);
						}
						range.insertNode(frag);

						// Preserve the selection
						if (lastNode) {
							range = range.cloneRange();
							range.setStartAfter(lastNode);
							range.collapse(true);
							sel.removeAllRanges();
							sel.addRange(range);
						}
					}
				}, {
					key: 'getWindowSelection',
					value: function getWindowSelection() {
						if (this.tribute.collection.iframe) {
							return this.tribute.collection.iframe.contentWindow.getSelection();
						}

						var selection = window.getSelection();

						if (!selection.anchorNode) {
							var nodes = [];
							var range = document.createRange();
							var el = this.tribute.container.firstElementChild;

							if (el) {
								 Array.prototype.forEach.call(el.childNodes, function(node) {
									if (node.nodeType === 3 && node.textContent.indexOf('@') !== -1) {
										nodes.push(node);
									}
								});
								if (nodes.length > 0) {
									range.selectNodeContents(nodes.pop());
									range.collapse(false);
									selection.addRange(range);
								}
							}
						}

						return selection;
					}
				}, {
					key: 'getNodePositionInParent',
					value: function getNodePositionInParent(element) {
						if (element.parentNode === null) {
							return 0;
						}

						for (var i = 0; i < element.parentNode.childNodes.length; i++) {
							var node = element.parentNode.childNodes[i];

							if (node === element) {
								return i;
							}
						}
					}
				}, {
					key: 'getContentEditableSelectedPath',
					value: function getContentEditableSelectedPath() {
						// content editable
						var position = this.getCaretCharacterOffsetWithin(this.tribute.container);
						var expectedContainer = this.getNodeByCaret(this.tribute.container);
						var info = this.getCursorPosition(this.tribute.container, position, expectedContainer);
						return info;
					}
				}, {
					key: 'getCaretCharacterOffsetWithin',
					value: function getCaretCharacterOffsetWithin(element) {
						var caretOffset = 0;
						var doc = element.ownerDocument || element.document;
						var win = doc.defaultView || doc.parentWindow;
						var sel;
						if (typeof win.getSelection != 'undefined') {
							sel = win.getSelection();
							if (sel.rangeCount > 0) {
								var range = win.getSelection().getRangeAt(0);
								var preCaretRange = range.cloneRange();
								preCaretRange.selectNodeContents(element);
								preCaretRange.setEnd(range.endContainer, range.endOffset);
								caretOffset = preCaretRange.toString().length;
							}
						} else if ((sel = doc.selection) && sel.type != 'Control') {
							var textRange = sel.createRange();
							var preCaretTextRange = doc.body.createTextRange();
							preCaretTextRange.moveToElementText(element);
							preCaretTextRange.setEndPoint('EndToEnd', textRange);
							caretOffset = preCaretTextRange.text.length;
						}
						return caretOffset;
					}
				}, {
					key: 'getNodeByCaret',
					value: function getNodeByCaret(element) {
						var caretOffset = 0;
						var doc = element.ownerDocument || element.document;
						var win = doc.defaultView || doc.parentWindow;
						var sel;
						if (typeof win.getSelection != 'undefined') {
							sel = win.getSelection();
							if (sel.rangeCount > 0) {
								var range = win.getSelection().getRangeAt(0);
								var preCaretRange = range.cloneRange();
								preCaretRange.selectNodeContents(element);
								preCaretRange.setEnd(range.endContainer, range.endOffset);
								return preCaretRange.endContainer;
							}
						}
						return element;
					}
				}, {
					key: 'getCursorPosition',
					value: function getCursorPosition(container, position, expectedContainer) {
						var currentPosition = 0;
						var resultNode;
						var path = [];
						var offset = 0;

						for (var i = 0; i < container.childNodes.length; i++) {
							var node = container.childNodes[i];

							if (i === 0 && position === 0) {
								path.push(i);
								if (node.nodeName === 'P') {
									path.push(i);
									node = node.childNodes[0];
								}
								return {
									selected: container,
									path: path,
									offset: i,
									currentNode: node
								};
							}

							var innerText = (node.nodeType === 3) ? node.nodeValue : node.textContent;

							if (innerText !== null) {
								if (currentPosition < position && currentPosition + innerText.length >= position) {
									path.push(i);
									resultNode = node;

									if (node.nodeName === 'P') {
										var curPos = 0;
										for (var j = 0; j < node.childNodes.length; j++) {
											var childNode = node.childNodes[j];
											innerText = (childNode.nodeType === 3) ? childNode.nodeValue : childNode.textContent;

											if (currentPosition + innerText.length >= position) {
												path.push(j);
												resultNode = childNode;
												break;
											}
											currentPosition += innerText.length;
										}
									}

									offset = position - currentPosition;
									return {
										selected: container,
										path: path,
										offset: offset,
										currentNode: resultNode
									};

								}
								currentPosition += innerText.length;
							}
						}
						return {
							selected: container,
							path: path,
							offset: offset,
							currentNode: container
						};
					}
				}, {
					key: 'getTextPrecedingCurrentSelection',
					value: function getTextPrecedingCurrentSelection() {
						var context = this.tribute.current,
							text = void 0;

						if (!this.isContentEditable(context.element)) {
							var textComponent = this.getDocument().activeElement;
							var startPos = textComponent.selectionStart;
							text = textComponent.value.substring(0, startPos);
						} else {
							var selectedElem = this.getWindowSelection().anchorNode;

							if (selectedElem != null) {
								var workingNodeContent = selectedElem.textContent;
								var selectStartOffset = this.getWindowSelection().getRangeAt(0).startOffset;

								if (selectedElem.nodeName === 'P' && selectStartOffset > 0) {
									selectedElem = selectedElem.childNodes[selectStartOffset - 1];
									workingNodeContent = selectedElem.textContent;
									if (selectedElem.nodeName === 'SPAN') {
										selectStartOffset = workingNodeContent.length - 1;
									} else {
										selectStartOffset = selectedElem.textContent.length;
									}
								}

								if (selectStartOffset >= 0) {
									text = workingNodeContent.substring(0, selectStartOffset);
								}
							}
						}

						return text;
					}
				}, {
					key: 'getTriggerInfo',
					value: function getTriggerInfo(menuAlreadyActive, hasTrailingSpace, requireLeadingSpace, allowSpaces) {
						var _this2 = this;

						var ctx = this.tribute.current;
						var selected = void 0,
							path = void 0,
							offset = void 0;

						if (!this.isContentEditable(ctx.element)) {
							selected = this.getDocument().activeElement;
						} else {
							// content editable
							var selectionInfo = this.getContentEditableSelectedPath();

							if (selectionInfo) {
								selected = selectionInfo.selected;
								path = selectionInfo.path;
								offset = selectionInfo.offset;
							}
						}

						var effectiveRange = this.getTextPrecedingCurrentSelection();

						if (effectiveRange !== undefined && effectiveRange !== null) {
							var _ret = function() {
								var mostRecentTriggerCharPos = -1;
								var triggerChar = void 0;

								_this2.tribute.collection.forEach(function(config) {
									var c = config.trigger;
									var idx = config.requireLeadingSpace ? _this2.lastIndexWithLeadingSpace(effectiveRange, c) : effectiveRange.lastIndexOf(c);

									if (idx > mostRecentTriggerCharPos) {
										mostRecentTriggerCharPos = idx;
										triggerChar = c;
										requireLeadingSpace = config.requireLeadingSpace;
									}
								});

								if (mostRecentTriggerCharPos >= 0 && (mostRecentTriggerCharPos === 0 || !requireLeadingSpace || /[\xA0\s]/g.test(effectiveRange.substring(mostRecentTriggerCharPos - 1, mostRecentTriggerCharPos)))) {
									var currentTriggerSnippet = effectiveRange.substring(mostRecentTriggerCharPos + 1, effectiveRange.length);

									triggerChar = effectiveRange.substring(mostRecentTriggerCharPos, mostRecentTriggerCharPos + 1);
									var firstSnippetChar = currentTriggerSnippet.substring(0, 1);
									var leadingSpace = currentTriggerSnippet.length > 0 && (firstSnippetChar === ' ' || firstSnippetChar === '\xA0');
									if (hasTrailingSpace) {
										currentTriggerSnippet = currentTriggerSnippet.trim();
									}

									var regex = allowSpaces ? /[^\S ]/g : /[\xA0\s]/g;

									if (!leadingSpace && (menuAlreadyActive || !regex.test(currentTriggerSnippet))) {
										return {
											v: {
												mentionPosition: mostRecentTriggerCharPos,
												mentionText: currentTriggerSnippet,
												mentionSelectedElement: selected,
												mentionSelectedPath: path,
												mentionSelectedOffset: offset,
												mentionTriggerChar: triggerChar
											}
										};
									}
								}
							}();

							if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
						}
					}
				}, {
					key: 'lastIndexWithLeadingSpace',
					value: function lastIndexWithLeadingSpace(str, char) {
						var reversedStr = str.split('').reverse().join('');
						var index = -1;

						for (var cidx = 0, len = str.length; cidx < len; cidx++) {
							var firstChar = cidx === str.length - 1;
							var leadingSpace = /\s/.test(reversedStr[cidx + 1]);
							var match = char === reversedStr[cidx];

							if (match && (firstChar || leadingSpace)) {
								index = str.length - 1 - cidx;
								break;
							}
						}

						return index;
					}
				}, {
					key: 'isContentEditable',
					value: function isContentEditable(element) {
						return element.nodeName !== 'INPUT' && element.nodeName !== 'TEXTAREA';
					}
				}, {
					key: 'getTextAreaOrInputUnderlinePosition',
					value: function getTextAreaOrInputUnderlinePosition(element, position) {
						var properties = ['direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing'];

						var isFirefox = window.mozInnerScreenX !== null;

						var div = this.getDocument().createElement('div');
						div.id = 'input-textarea-caret-position-mirror-div';
						this.getDocument().body.appendChild(div);

						var style = div.style;
						var computed = window.getComputedStyle ? getComputedStyle(element) : element.currentStyle;

						style.whiteSpace = 'pre-wrap';
						if (element.nodeName !== 'INPUT') {
							style.wordWrap = 'break-word';
						}

						// position off-screen
						style.position = 'absolute';
						style.visibility = 'hidden';

						// transfer the element's properties to the div
						properties.forEach(function(prop) {
							style[prop] = computed[prop];
						});

						if (isFirefox) {
							style.width = parseInt(computed.width) - 2 + 'px';
							if (element.scrollHeight > parseInt(computed.height)) style.overflowY = 'scroll';
						} else {
							style.overflow = 'hidden';
						}

						div.textContent = element.value.substring(0, position);

						if (element.nodeName === 'INPUT') {
							div.textContent = div.textContent.replace(/\s/g, ' ');
						}

						var span = this.getDocument().createElement('span');
						span.textContent = element.value.substring(position) || '.';
						div.appendChild(span);

						var rect = element.getBoundingClientRect();
						var doc = document.documentElement;
						var windowLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
						var windowTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

						var coordinates = {
							top: rect.top + windowTop + span.offsetTop + parseInt(computed.borderTopWidth) + parseInt(computed.fontSize) - element.scrollTop,
							left: rect.left + windowLeft + span.offsetLeft + parseInt(computed.borderLeftWidth)
						};

						this.getDocument().body.removeChild(div);

						return coordinates;
					}
				}, {
					key: 'getContentEditableCaretPosition',
					value: function getContentEditableCaretPosition(selectedNodePosition) {
						var markerEl = void 0;
						var markerId = 'sel_' + new Date().getTime() + '_' + Math.random().toString().substr(2);
						var range = void 0;
						var sel = this.getWindowSelection();
						var prevRange = sel.getRangeAt(0);

						range = this.getDocument().createRange();
						range.setStart(sel.anchorNode, selectedNodePosition);
						range.setEnd(sel.anchorNode, selectedNodePosition);

						range.collapse(false);

						// Create the marker element containing a single invisible character using DOM methods and insert it
						markerEl = this.getDocument().createElement('span');
						markerEl.id = markerId;
						markerEl.appendChild(this.getDocument().createTextNode(''));
						range.insertNode(markerEl);
						sel.removeAllRanges();
						sel.addRange(prevRange);

						var rect = markerEl.getBoundingClientRect();
						var doc = document.documentElement;
						var windowLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
						var windowTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

						var userDivWidth = 322;
						var menuContainer = this.tribute.container.parentNode;
						var menuContainerWidth = menuContainer.offsetWidth;

						function getPos(el) {
							// yay readability
							for (var lx = 0, ly = 0; el !== null; lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent) { }
							return { x: lx, y: ly };
						}

						var menuContainerPosition = getPos(menuContainer);

						var nextLineHeight = 30;
						var menuTopPosition = rect.top + nextLineHeight;

						if (menuTopPosition > menuContainerPosition.y + menuContainer.offsetHeight) {
							menuTopPosition = menuContainerPosition.y + menuContainer.offsetHeight + 2;
						}

						var coordinates = {
							left: menuContainerPosition.x + 3,
							top: menuTopPosition
						};

						markerEl.parentNode.removeChild(markerEl);
						return coordinates;
					}
				}, {
					key: 'scrollIntoView',
					value: function scrollIntoView(elem) {
						var reasonableBuffer = 20,
							clientRect = void 0;
						var maxScrollDisplacement = 100;
						var e = elem;

						while (clientRect === undefined || clientRect.height === 0) {
							clientRect = e.getBoundingClientRect();

							if (clientRect.height === 0) {
								e = e.childNodes[0];
								if (e === undefined || !e.getBoundingClientRect) {
									return;
								}
							}
						}

						var elemTop = clientRect.top;
						var elemBottom = elemTop + clientRect.height;

						if (elemTop < 0) {
							window.scrollTo(0, window.pageYOffset + clientRect.top - reasonableBuffer);
						} else if (elemBottom > window.innerHeight) {
							var maxY = window.pageYOffset + clientRect.top - reasonableBuffer;

							if (maxY - window.pageYOffset > maxScrollDisplacement) {
								maxY = window.pageYOffset + maxScrollDisplacement;
							}

							var targetY = window.pageYOffset - (window.innerHeight - elemBottom);

							if (targetY > maxY) {
								targetY = maxY;
							}

							window.scrollTo(0, targetY);
						}
					}
				}]);

				return TributeRange;
			}();

			exports.default = TributeRange;
			module.exports = exports['default'];

		}, {}], 5: [function(require, module, exports) {
			'use strict';

			Object.defineProperty(exports, "__esModule", {
				value: true
			});

			var _createClass = function() { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function(Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

			function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

			// Thanks to https://github.com/mattyork/fuzzy
			var TributeSearch = function() {
				function TributeSearch(tribute) {
					_classCallCheck(this, TributeSearch);

					this.tribute = tribute;
					this.tribute.search = this;
				}

				_createClass(TributeSearch, [{
					key: 'simpleFilter',
					value: function simpleFilter(pattern, array) {
						var _this = this;

						return array.filter(function(string) {
							return _this.test(pattern, string);
						});
					}
				}, {
					key: 'test',
					value: function test(pattern, string) {
						return this.match(pattern, string) !== null;
					}
				}, {
					key: 'match',
					value: function match(pattern, string, opts) {
						opts = opts || {};
						var patternIdx = 0,
							result = [],
							len = string.length,
							totalScore = 0,
							currScore = 0,
							pre = opts.pre || '',
							post = opts.post || '',
							compareString = opts.caseSensitive && string || string.toLowerCase(),
							ch = void 0,
							compareChar = void 0;

						pattern = opts.caseSensitive && pattern || pattern.toLowerCase();

						var patternCache = this.traverse(compareString, pattern, 0, 0, []);
						if (!patternCache) {
							return null;
						}

						return {
							rendered: this.render(string, patternCache.cache, pre, post),
							score: patternCache.score
						};
					}
				}, {
					key: 'traverse',
					value: function traverse(string, pattern, stringIndex, patternIndex, patternCache) {
						// if the pattern search at end
						if (pattern.length === patternIndex) {

							// calculate socre and copy the cache containing the indices where it's found
							return {
								score: this.calculateScore(patternCache),
								cache: patternCache.slice()
							};
						}

						// if string at end or remaining pattern > remaining string
						if (string.length === stringIndex || pattern.length - patternIndex > string.length - stringIndex) {
							return undefined;
						}

						var c = pattern[patternIndex];
						var index = string.indexOf(c, stringIndex);
						var best = void 0,
							temp = void 0;

						while (index > -1) {
							patternCache.push(index);
							temp = this.traverse(string, pattern, index + 1, patternIndex + 1, patternCache);
							patternCache.pop();

							// if downstream traversal failed, return best answer so far
							if (!temp) {
								return best;
							}

							if (!best || best.score < temp.score) {
								best = temp;
							}

							index = string.indexOf(c, index + 1);
						}

						return best;
					}
				}, {
					key: 'calculateScore',
					value: function calculateScore(patternCache) {
						var score = 0;
						var temp = 1;

						patternCache.forEach(function(index, i) {
							if (i > 0) {
								if (patternCache[i - 1] + 1 === index) {
									temp += temp + 1;
								} else {
									temp = 1;
								}
							}

							score += temp;
						});

						return score;
					}
				}, {
					key: 'render',
					value: function render(string, indices, pre, post) {
						var rendered = string.substring(0, indices[0]);

						indices.forEach(function(index, i) {
							rendered += pre + string[index] + post + string.substring(index + 1, indices[i + 1] ? indices[i + 1] : string.length);
						});

						return rendered;
					}
				}, {
					key: 'filter',
					value: function filter(pattern, arr, opts) {
						var _this2 = this;

						opts = opts || {};
						return arr.reduce(function(prev, element, idx, arr) {
							var str = element;

							if (opts.extract) {
								str = opts.extract(element);

								if (!str) {
									// take care of undefineds / nulls / etc.
									str = '';
								}
							}

							var rendered = _this2.match(pattern, str, opts);

							if (rendered != null) {
								prev[prev.length] = {
									string: rendered.rendered,
									score: rendered.score,
									index: idx,
									original: element
								};
							}

							return prev;
						}, []).sort(function(a, b) {
							var compare = b.score - a.score;
							if (compare) return compare;
							return a.index - b.index;
						});
					}
				}]);

				return TributeSearch;
			}();

			exports.default = TributeSearch;
			module.exports = exports['default'];

		}, {}], 6: [function(require, module, exports) {
			"use strict";

			Object.defineProperty(exports, "__esModule", {
				value: true
			});

			var _Tribute = require("./Tribute");

			var _Tribute2 = _interopRequireDefault(_Tribute);

			function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

			exports.default = _Tribute2.default; /**
                                     * Tribute.js
                                     * Native ES6 JavaScript @mention Plugin
                                     **/

			module.exports = exports["default"];

		}, { "./Tribute": 1 }], 7: [function(require, module, exports) {
			'use strict';

			if (!Array.prototype.find) {
				Array.prototype.find = function(predicate) {
					if (this === null) {
						throw new TypeError('Array.prototype.find called on null or undefined');
					}
					if (typeof predicate !== 'function') {
						throw new TypeError('predicate must be a function');
					}
					var list = Object(this);
					var length = list.length >>> 0;
					var thisArg = arguments[1];
					var value;

					for (var i = 0; i < length; i++) {
						value = list[i];
						if (predicate.call(thisArg, value, i, list)) {
							return value;
						}
					}
					return undefined;
				};
			}

			if (window && typeof window.CustomEvent !== "function") {
				var CustomEvent = function CustomEvent(event, params) {
					params = params || {
						bubbles: false,
						cancelable: false,
						detail: undefined
					};
					var evt = document.createEvent('CustomEvent');
					evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
					return evt;
				};

				if (typeof window.Event !== 'undefined') {
					CustomEvent.prototype = window.Event.prototype;
				}

				window.CustomEvent = CustomEvent;
			}

		}, {}]
	}, {}, [6])(6)
});
