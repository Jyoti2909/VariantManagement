(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;


var Console = function () {
  var overrides = undefined;
  var colors = undefined;
  Console = function (_rh$Plugin) {
    _inherits(Console, _rh$Plugin);

    _createClass(Console, null, [{
      key: 'initClass',
      value: function initClass() {

        overrides = ['info', 'log', 'warn', 'debug', 'error'];

        colors = ['#00FF00', '#000000', '#0000FF', '#0000FF', '#FF0000'];
      }
    }]);

    function Console() {
      _classCallCheck(this, Console);

      var _this = _possibleConstructorReturn(this, (Console.__proto__ || Object.getPrototypeOf(Console)).call(this));

      _this.$el = $('#console', 0);

      if (_this.$el) {
        if (window.console == null) {
          window.console = {};
        }
        _this.attachOwner(window.console);
        _this.addOverrides(overrides);
        _.each(overrides, function (fnName, index) {
          return this[fnName] = function () {
            this.color = colors[index];
            return this.logger.apply(this, arguments);
          };
        }, _this);
        _this.createChildNodes();
        _this.setUpInputBox();
      }
      return _this;
    }

    _createClass(Console, [{
      key: 'ownerIsChanged',
      value: function ownerIsChanged() {
        var _this2 = this;

        return this.$el.style.display = function () {
          if (_this2.hasOwner()) {
            return '';
          } else if (_this2.$el) {
            return 'none';
          }
        }();
      }
    }, {
      key: 'logger',
      value: function logger(oldHandler, args, tag) {
        if (tag == null) {
          tag = 'span';
        }
        var messages = [];
        var node = document.createElement(tag);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Array.from(args)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var arg = _step.value;

            if (_.isFunction(arg) || _.isString(arg)) {
              messages.push(arg);
            } else if (arg != null) {
              var msg;
              try {
                msg = JSON.stringify(arg);
              } catch (e) {
                msg = e.name + ': ' + e.message;
              }
              messages.push(msg);
            } else {
              messages.push('undefined');
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        if (this.color === '#FF0000') {
          messages.push(_.stackTrace());
        }
        node.style.color = this.color;
        $.textContent(node, messages.join(' '));

        this.$logNode.appendChild(node);
        this.$logNode.appendChild(document.createElement('br'));
        this.$el.scrollTop = this.$el.scrollHeight;

        if (oldHandler) {
          return oldHandler(args);
        }
      }
    }, {
      key: 'createChildNodes',
      value: function createChildNodes() {
        this.$logNode = $.find(this.$el, 'p')[0];
        if (!this.$logNode) {
          this.$logNode = document.createElement('p');
          this.$logNode.className = 'console';
          this.$el.appendChild(this.$logNode);
        }

        this.$input = $.find(this.$el, 'input')[0];
        if (!this.$input) {
          var $lable = document.createElement('label');
          $.textContent($lable, '> ');
          $lable.style.color = 'blue';
          this.$input = document.createElement('input');
          this.$input.type = 'text';
          this.$input.className = 'console';
          this.$input.style.width = '98%';
          this.$input.style.border = '0';
          this.$input.style.padding = '2px';
          this.$input.placeholder = 'Enter a valid expression';
          $lable.appendChild(this.$input);
          return this.$el.appendChild($lable);
        }
      }
    }, {
      key: 'setUpInputBox',
      value: function setUpInputBox() {
        var _this3 = this;

        return this.$input.onkeydown = function (event) {
          if (event.keyCode === 13) {
            _this3.color = '#0000FF';
            var expr = _this3.$input.value;
            try {
              var retVal = Function('event', 'return ' + expr)(event);
              _this3.$input.value = '';
              _this3.logger(null, [expr], 'b');
              return _this3.logger(null, [retVal]);
            } catch (e) {
              _this3.color = '#FF1100';
              return _this3.logger(null, [e.name + ': ' + e.message], 'b');
            }
          }
        };
      }
    }]);

    return Console;
  }(rh.Plugin);
  Console.initClass();
  return Console;
}();

rh.Console = Console;

},{}],2:[function(require,module,exports){
'use strict';

var consts = void 0;
var _window = window,
    rh = _window.rh;

var cache = {};

rh.consts = consts = function consts(key, value) {
  if (arguments.length === 1) {
    if (rh._debug) {
      if (!(key in cache)) {
        rh._d('error', 'consts', key + ' is not available');
      }
    }
    return cache[key];
  } else if (key in cache) {
    if (rh._debug) {
      return rh._d('error', 'consts', key + ' is already registered');
    }
  } else {
    return cache[key] = value;
  }
};

// Temp keys
consts('KEY_TEMP_DATA', '.temp.data');

// iframe keys
consts('KEY_SHARED_INPUT', '._sharedkeys.input');
consts('KEY_SHARED_OUTPUT', '._sharedkeys.output');
consts('KEY_IFRAME_EVENTS', '.l.iframe_events');

// Screen specific
consts('KEY_SCREEN', '.l.screen');
consts('KEY_DEFAULT_SCREEN', '.l.default_screen');
consts('KEY_SCREEN_NAMES', '.l.screen_names');
consts('KEY_SCREEN_DESKTOP', consts('KEY_SCREEN') + '.desktop.attached');
consts('KEY_SCREEN_TABLET', consts('KEY_SCREEN') + '.tablet.attached');
consts('KEY_SCREEN_TABLET_PORTRAIT', consts('KEY_SCREEN') + '.tablet_portrait.attached');
consts('KEY_SCREEN_PHONE', consts('KEY_SCREEN') + '.phone.attached');
consts('KEY_SCREEN_IOS', consts('KEY_SCREEN') + '.ios.attached');
consts('KEY_SCREEN_IPAD', consts('KEY_SCREEN') + '.ipad.attached');
consts('KEY_SCREEN_PRINT', consts('KEY_SCREEN') + '.print.attached');

// Events
consts('EVT_ORIENTATION_CHANGE', '.e.orientationchange');
consts('EVT_HASH_CHANGE', '.e.hashchange');
consts('EVT_WIDGET_BEFORELOAD', '.e.widget_beforeload');
consts('EVT_WIDGET_LOADED', '.e.widget_loaded');
consts('EVT_BEFORE_UNLOAD', '.e.before_unload');
consts('EVT_UNLOAD', '.e.unload');
consts('EVT_MOUSEMOVE', '.e.mousemove');
consts('EVT_SWIPE_DIR', '.e.swipe_dir');
consts('EVT_FAST_CLICK', '.e.fast_click');
consts('EVT_CLICK_INSIDE_IFRAME', '.e.click_inside_iframe');
consts('EVT_SCROLL_INSIDE_IFRAME', '.e.scroll_inside_iframe');
consts('EVT_INSIDE_IFRAME_DOM_CONTENTLOADED', 'e.inside_iframe_dom_contentloaded');
consts('RHMAPNO', 'rhmapno');
consts('TOPIC_FILE', 'topic.htm');
consts('HOME_PAGE', 'index.htm');

},{}],3:[function(require,module,exports){
"use strict";

var _window = window,
    rh = _window.rh;
var _ = rh._;


rh.controller = _.cache(_.isFunction);

},{}],4:[function(require,module,exports){
'use strict';

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;
var model = rh.model;


var loadWidgets = function loadWidgets(parentNode, parent) {
  return _.each($.find(parentNode, '[data-rhwidget]'), function (node) {
    if ($.dataset(node, 'loaded')) {
      return;
    } //it can be empty string on old browser
    if (!$.isDescendent(parentNode, node)) {
      return;
    } //ignore nested widget data
    var config = $.dataset(node, 'config');
    config = config ? _.resolveNiceJSON(config) : {};
    return _.each(_.resolveWidgetArgs($.dataset(node, 'rhwidget')), function (wInfo) {
      var wName = wInfo.wName,
          wArg = wInfo.wArg,
          pipedArgs = wInfo.pipedArgs,
          rawArg = wInfo.rawArg;

      if (wName[0] === wName[0].toLowerCase()) {
        //data widget
        config.rawArg = rawArg;
      } else {
        if (pipedArgs.length > 0) {
          config.pipedArgs = pipedArgs;
        }
        if (wArg) {
          _.extend(config, wArg);
        }
      }
      config.node = node;
      var wclass = rh.widgets[wName];
      var widget = new wclass(config);
      return widget.init(parent);
    });
  });
};

//data-rhtags is synthatic suger(shortcut) for data-rhwidgets='ContentFilter' and
// data-config='{"id": "1"}'
var loadContentFilter = function loadContentFilter(parentNode) {
  return function () {
    var result = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Array.from($.find(parentNode, '[data-rhtags]'))[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var node = _step.value;

        var widget;
        if (!$.isDescendent(parentNode, node)) {
          continue;
        } //ignore nested widget data
        var config = $.dataset(node, 'config');
        config = config ? _.resolveNiceJSON(config) : {};
        config.ids = $.dataset(node, 'rhtags').split(',');
        config.node = node;
        result.push(widget = new rh.widgets.ContentFilter(config));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return result;
  }();
};

var loadDataHandlers = function loadDataHandlers(parentNode, parent) {
  loadWidgets(parentNode, parent);
  return loadContentFilter(parentNode);
};

_.loadWidgets = loadWidgets;
_.loadContentFilter = loadContentFilter;
_.loadDataHandlers = loadDataHandlers;

},{}],5:[function(require,module,exports){
'use strict';

var _window = window,
    rh = _window.rh;
var _ = rh._;


rh._params = _.urlParams();
rh._debugFilter = _.toRegExp(rh._params.rh_debug);
rh._debug = rh._debugFilter != null;

rh._testFilter = _.toRegExp(rh._params.rh_test);
rh._test = rh._testFilter != null;

rh._errorFilter = _.toRegExp(rh._params.rh_error);
rh._error = rh._errorFilter != null;

rh._breakFilter = _.toRegExp(rh._params.rh_break);
rh._break = rh._breakFilter != null;

var matchFilter = function matchFilter(messages, filter) {
  return messages.join(' ').match(filter);
};

rh._d = function () {
  var _window2 = window,
      console = _window2.console;

  if (rh._debug && console && _.isFunction(console.log)) {
    var fn = void 0;
    var args = [];var i = -1;
    while (++i < arguments.length) {
      args.push(arguments[i]);
    }
    if (['info', 'log', 'warn', 'debug', 'error'].indexOf(args[0]) > -1) {
      fn = console[args[0]];
      args = args.slice(1);
    } else {
      fn = console.debug;
    }

    var newArgs = ['[ ' + args[0] + ' ]:'].concat(args.slice(1));
    if (rh._debugFilter === '' || matchFilter(newArgs, rh._debugFilter)) {
      if (rh._break && matchFilter(newArgs, rh._breakFilter)) {
        return Function('', 'debugger')();
      } else if (rh._error && matchFilter(newArgs, rh._errorFilter)) {
        return console.error.apply(console, newArgs);
      } else {
        return fn.apply(console, newArgs);
      }
    }
  }
};

},{}],6:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;

var Guard = function () {
  function Guard() {
    _classCallCheck(this, Guard);

    this.guard = this.guard.bind(this);
  }

  _createClass(Guard, [{
    key: "guard",
    value: function guard(fn, guardName) {
      if (this.guardedNames == null) {
        this.guardedNames = [];
      }
      if (this.guardedNames.indexOf(guardName) === -1) {
        this.guardedNames.push(guardName);
        fn.call(this);
        return this.guardedNames.splice(this.guardedNames.indexOf(guardName), 1);
      }
    }
  }]);

  return Guard;
}();

rh.Guard = Guard;
rh.guard = new Guard().guard;

},{}],7:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;


var defaultOpts = { async: true };

var formData = rh.formData = function (opts) {
  var form_data = new window.FormData();
  _.each(opts, function (value, key) {
    return form_data.append(key, value);
  });
  return form_data;
};

//private class of http api

var Response = function () {
  function Response(xhr, opts) {
    _classCallCheck(this, Response);

    this.onreadystatechange = this.onreadystatechange.bind(this);
    this.xhr = xhr;
    this.opts = opts;
    if (this.opts.success != null) {
      this.success(this.opts.success);
    }
    if (this.opts.error != null) {
      this.error(this.opts.error);
    }
    this.xhr.onreadystatechange = this.onreadystatechange;
  }

  _createClass(Response, [{
    key: 'onreadystatechange',
    value: function onreadystatechange() {
      var _this = this;

      if (this.xhr.readyState !== 4) {
        return;
      }

      var text = this.xhr.responseText;
      var status = this.xhr.status;

      var headers = function headers(name) {
        return _this.xhr.getResponseHeader(name);
      };

      if (this.isSuccess(status)) {
        if (this.successFn) {
          this.successFn(text, status, headers, this.opts);
        }
      } else {
        if (this.errorFn) {
          this.errorFn(text, status, headers, this.opts);
        }
      }

      if (this.finallyFn) {
        return this.finallyFn(text, status, headers, this.opts);
      }
    }
  }, {
    key: 'isSuccess',
    value: function isSuccess(status) {
      return status >= 200 && status < 300 || status === 304;
    }
  }, {
    key: 'success',
    value: function success(fn) {
      this.successFn = fn;
      return this;
    }
  }, {
    key: 'error',
    value: function error(fn) {
      this.errorFn = fn;
      return this;
    }
  }, {
    key: 'finally',
    value: function _finally(fn) {
      this.finallyFn = fn;
      return this;
    }
  }]);

  return Response;
}();

var createRequest = function createRequest(opts) {
  var XHR = window.XMLHttpRequest || window.ActiveXObject('Microsoft.XMLHTTP');
  var xhr = new XHR();
  var response = new Response(xhr, opts);
  return { xhr: xhr, response: response };
};

// http apis
var http = rh.http = function (opts) {
  opts = _.extend({}, defaultOpts, opts);

  var _createRequest = createRequest(opts),
      xhr = _createRequest.xhr,
      response = _createRequest.response;

  xhr.open(opts.method, opts.url, opts.async);

  if (opts['Content-type']) {
    xhr.setRequestHeader('Content-type', opts['Content-type']);
  }

  xhr.send(opts.data);
  return response;
};

http.get = function (url, opts) {
  return http(_.extend({ url: url, method: 'GET' }, opts));
};

http.post = function (url, data, opts) {
  return http(_.extend({ url: url, method: 'POST', data: data }, opts));
};

http.put = function (url, data, opts) {
  return http(_.extend({ url: url, method: 'PUT', data: data }, opts));
};

http.jsonp = function (url, opts) {
  opts = _.extend({}, defaultOpts, opts);
  var node = $('script', 0) || document.head.children[0];
  var newNode = document.createElement('script');
  newNode.async = opts.async;
  newNode.src = url;
  return node.parentNode.insertBefore(newNode, node);
};

},{}],8:[function(require,module,exports){
'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;
var consts = rh.consts;

var Iframe = function (_rh$Guard) {
  _inherits(Iframe, _rh$Guard);

  _createClass(Iframe, [{
    key: 'toString',
    value: function toString() {
      return 'Iframe';
    }
  }]);

  function Iframe() {
    _classCallCheck(this, Iframe);

    var _this = _possibleConstructorReturn(this, (Iframe.__proto__ || Object.getPrototypeOf(Iframe)).call(this));

    _this.unsubscribe = _this.unsubscribe.bind(_this);
    _this.linkedSubs = {};
    if (_.isIframe()) {
      rh.model.subscribe(consts('EVT_BEFORE_UNLOAD'), _this.unsubscribe);
      rh.model.subscribe(consts('EVT_UNLOAD'), _this.unsubscribe);
    }
    return _this;
  }

  _createClass(Iframe, [{
    key: 'unsubscribe',
    value: function unsubscribe() {
      if (this.parent) {
        var msg = { id: this.id };
        this.parent.postMessage({ rhmodel_unsubscribe: msg }, '*');
        return this.parent = undefined;
      }
    }
  }, {
    key: 'init',
    value: function init() {
      if (this.id == null) {
        this.id = _.uniqueId();
      }
      this.parent = window.parent;
      if (_.isIframe()) {
        var input = rh.model.get('_sharedkeys.input');
        if (input) {
          var inputKeys = _.map(input, function (item) {
            if (_.isString(item)) {
              return { key: item };
            } else {
              return item;
            }
          });
          var msg = { input: inputKeys, id: this.id };
          this.parent.postMessage({ rhmodel_subscribe: msg }, '*');
        }
        var outputKeys = rh.model.get('_sharedkeys.output');
        if (outputKeys) {
          return this.linkModel(this.parent, this.id, outputKeys);
        }
      }
    }
  }, {
    key: 'clean',
    value: function clean(id) {
      var subs = this.linkedSubs[id];
      if (subs) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Array.from(subs)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var unsub = _step.value;
            unsub();
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        return delete this.linkedSubs[id];
      }
    }
  }, {
    key: 'linkModel',
    value: function linkModel(source, id, keys) {
      var _this2 = this;

      if (keys == null) {
        keys = [];
      }
      var subs = [];
      var callback = function callback(value, key) {
        return _this2.guard(function () {
          var msg = {};msg[key] = value;
          return source.postMessage({ rhmodel_publish: msg }, '*');
        }, id);
      };
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Array.from(keys)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var key = _step2.value;

          key = key.trim();
          subs.push(rh.model.subscribe(key, callback));
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      this.clean(id);
      return this.linkedSubs[id] = subs;
    }
  }, {
    key: 'publish',
    value: function publish(key, value, opts) {
      if (opts == null) {
        opts = {};
      }
      return this.guard(function () {
        return rh.model.publish(key, value, opts);
      });
    }
  }, {
    key: 'guard',
    value: function guard(fn, guardName) {
      if (guardName == null) {
        guardName = this.id;
      }
      return _get(Iframe.prototype.__proto__ || Object.getPrototypeOf(Iframe.prototype), 'guard', this).call(this, fn, guardName);
    }
  }]);

  return Iframe;
}(rh.Guard);

rh.iframe = new Iframe();

},{}],9:[function(require,module,exports){
'use strict';

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;
var consts = rh.consts;


var head = $('head', 0);
var style = document.createElement('style');
style.innerHTML = '.rh-hide:not(.rh-animate){display:none !important;}';
head.insertBefore(style, head.childNodes[0]);

_.addEventListener(document, 'DOMContentLoaded', _.one(function () {
  if (rh._debug) {
    if (rh.console == null) {
      rh.console = new rh.Console();
    }
  }

  rh.model.publish(consts('EVT_WIDGET_BEFORELOAD'), true, { sync: true });

  _.loadWidgets(document);

  _.loadContentFilter(document);

  return rh.model.publish(consts('EVT_WIDGET_LOADED'), true, { sync: true });
}));

if (_.isIframe()) {
  _.addEventListener(window, 'beforeunload', function () {
    rh.model.publish(consts('EVT_BEFORE_UNLOAD'), true, { sync: true });
    return undefined;
  });

  _.addEventListener(window, 'unload', function (event) {
    rh.model.publish(consts('EVT_UNLOAD'), true, { sync: true });
    return undefined;
  });
}

},{}],10:[function(require,module,exports){
'use strict';

var _window = window,
    rh = _window.rh;
var _ = rh._;


_.addEventListener(window, 'message', function (e) {
  var config = void 0,
      key = void 0;
  if (!_.isSameOrigin(e.origin)) {
    return;
  }

  var data = e.data;

  if (!_.isObject(data)) {
    return;
  }

  if (data.rhmodel_publish) {
    config = data.rhmodel_publish;
    if (config) {
      for (key in config) {
        var value = config[key];rh.iframe.publish(key, value, { sync: true });
      }
    }
  }

  if (data.rhmodel_subscribe) {
    config = data.rhmodel_subscribe;
    var input = config.input || [];
    var topContainer = !rh.model.get('_sharedkeys.input');
    var keys = _.reduce(input, function (result, item) {
      if (topContainer || item.nested !== false) {
        result.push(item.key);
      }
      return result;
    }, []);
    if (keys != null ? keys.length : undefined) {
      rh.iframe.linkModel(e.source, config.id, keys);
    }
  }

  if (data.rhmodel_unsubscribe) {
    config = data.rhmodel_unsubscribe;
    return rh.iframe.clean(config.id);
  }
});

},{}],11:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var consts = rh.consts;

// ChildNode private class for Model

var ChildNode = function () {
  function ChildNode(subscribers, children) {
    _classCallCheck(this, ChildNode);

    if (subscribers == null) {
      subscribers = [];
    }
    this.subscribers = subscribers;
    if (children == null) {
      children = {};
    }
    this.children = children;
  }

  // TODO: add key.* support in get


  _createClass(ChildNode, [{
    key: 'getSubscribers',
    value: function getSubscribers(keys, path, value, subs) {
      if (keys.length > 1) {
        var child = void 0;
        subs.push({ fnsInfo: this.subscribers, key: path, value: value });
        var childKey = keys[1];
        if (child = this.children[childKey]) {
          var newPath = path + '.' + childKey;
          child.getSubscribers(keys.slice(1), newPath, value != null ? value[childKey] : undefined, subs);
        }
      } else if (keys.length > 0) {
        this._getAllChildSubscribers(path, value, subs);
      }
      return subs;
    }
  }, {
    key: 'addSubscribers',
    value: function addSubscribers(fn, keys, opts) {
      if (keys.length === 1) {
        return this.subscribers.push([fn, opts]);
      } else if (keys.length > 1) {
        var childKey = keys[1];
        if (this.children[childKey] == null) {
          this.children[childKey] = new ChildNode();
        }
        return this.children[childKey].addSubscribers(fn, keys.slice(1), opts);
      }
    }
  }, {
    key: 'removeSubscriber',
    value: function removeSubscriber(fn, keys) {
      if (keys.length === 1) {
        return this._deleteSubscriber(fn);
      } else if (keys.length > 1) {
        return this.children[keys[1]].removeSubscriber(fn, keys.slice(1));
      }
    }
  }, {
    key: '_deleteSubscriber',
    value: function _deleteSubscriber(fn) {
      var index = _.findIndex(this.subscribers, function (item) {
        return item[0] === fn;
      });
      if (index != null && index !== -1) {
        return this.subscribers.splice(index, 1);
      } else if (rh._debug) {
        return rh._d('error', '_unsubscribe', this + '.{key} is not subscribed with ' + fn);
      }
    }
  }, {
    key: '_getAllChildSubscribers',
    value: function _getAllChildSubscribers(path, value, subs) {
      subs.push({ fnsInfo: this.subscribers, key: path, value: value });
      if (this.children) {
        if (value == null) {
          value = {};
        }
        for (var key in this.children) {
          var child = this.children[key];
          child._getAllChildSubscribers(path + '.' + key, value[key], subs);
        }
      }
      return subs;
    }
  }]);

  return ChildNode;
}();

//RootNode prive class for Model


var RootNode = function (_ChildNode) {
  _inherits(RootNode, _ChildNode);

  function RootNode(subscribers, children, data) {
    var _this;

    _classCallCheck(this, RootNode);

    var _this = _possibleConstructorReturn(this, (RootNode.__proto__ || Object.getPrototypeOf(RootNode)).call(this));

    _this.subscribers = subscribers;
    _this.children = children;
    if (data == null) {
      data = {};
    }
    _this.data = data;
    return _this = _possibleConstructorReturn(this, (RootNode.__proto__ || Object.getPrototypeOf(RootNode)).call(this, _this.subscribers, _this.childs));
  }

  _createClass(RootNode, [{
    key: 'getSubscribers',
    value: function getSubscribers(keys) {
      var childKey = keys[0];
      var child = this.children[childKey];
      if (child) {
        return child.getSubscribers(keys, '' + keys[0], this.data[keys[0]], []);
      } else {
        return [];
      }
    }
  }, {
    key: 'addSubscribers',
    value: function addSubscribers(fn, keys, opts) {
      var childKey = keys[0];
      if (this.children[childKey] == null) {
        this.children[childKey] = new ChildNode();
      }
      return this.children[childKey].addSubscribers(fn, keys, opts);
    }
  }, {
    key: 'removeSubscriber',
    value: function removeSubscriber(fn, keys) {
      var childKey = keys[0];
      return this.children[childKey] != null ? this.children[childKey].removeSubscriber(fn, keys) : undefined;
    }
  }, {
    key: 'getData',
    value: function getData(keys) {
      var value = void 0;
      var data = this.data;

      for (var index = 0; index < keys.length; index++) {
        var key = keys[index];
        if (_.isDefined(data)) {
          if (index === keys.length - 1) {
            value = data[key];
          } else {
            data = data[key];
          }
        } else {
          break;
        }
      }
      return value;
    }
  }, {
    key: 'setData',
    value: function setData(keys, value) {
      //a.b a.*
      var data = this.data;

      for (var index = 0; index < keys.length; index++) {
        var key = keys[index];
        if (index === keys.length - 1) {
          data[key] = value;
        } else {
          if (!_.isDefined(data[key])) {
            data[key] = {};
          }
          data = data[key];
        }
      }
    }
  }]);

  return RootNode;
}(ChildNode);

// Model class to read write local data using publish subscribe pattern


var Model = function () {
  var _count = undefined;
  Model = function () {
    _createClass(Model, [{
      key: 'toString',
      value: function toString() {
        return 'Model_' + this._count;
      }
    }], [{
      key: 'initClass',
      value: function initClass() {

        // private static variable
        _count = 0;
      }
    }]);

    function Model() {
      _classCallCheck(this, Model);

      this._rootNode = new RootNode();

      this._count = _count;
      _count += 1;
    }

    _createClass(Model, [{
      key: 'get',
      value: function get(key) {
        var value = void 0;
        if (this._isForGlobal(key)) {
          return rh.model.get(key);
        }

        if (_.isString(key)) {
          value = this._rootNode.getData(this._getKeys(key));
        } else {
          rh._d('error', 'Get', this + '.' + key + ' is not a string');
        }

        if (rh._debug) {
          rh._d('log', 'Get', this + '.' + key + ': ' + JSON.stringify(value));
        }

        return value;
      }
    }, {
      key: 'cget',
      value: function cget(key) {
        return this.get(consts(key));
      }

      // TODO: add options to detect change then only trigger the event

    }, {
      key: 'publish',
      value: function publish(key, value, opts) {
        var _this2 = this;

        if (opts == null) {
          opts = {};
        }
        if (this._isForGlobal(key)) {
          return rh.model.publish(key, value, opts);
        }
        if (rh._debug) {
          rh._d('log', 'Publish', this + '.' + key + ': ' + JSON.stringify(value));
        }
        if (_.isString(key)) {
          this._rootNode.setData(this._getKeys(key), value);
          var subs = this._rootNode.getSubscribers(this._getKeys(key));
          var keyLength = key[0] === '.' ? key.length - 1 : key.length;
          var filteredSubs = _.map(subs, function (sub) {
            var fnsInfo = _.filter(sub.fnsInfo, function (fnInfo) {
              return _.isDefined(fnInfo[0]) && (fnInfo[1].partial !== false || sub.key.length >= keyLength);
            });
            return {
              key: sub.key,
              value: sub.value,
              fns: _.map(fnsInfo, function (fnInfo) {
                return fnInfo[0];
              })
            };
          });

          _.each(filteredSubs, function (sub) {
            return _.each(sub.fns, function (fn) {
              if (rh._debug) {
                rh._d('log', 'Publish call', _this2 + '.' + sub.key + ': ' + JSON.stringify(sub.value));
              }
              var unsub = function unsub() {
                return _this2._unsubscribe(sub.key, fn);
              };
              if (opts.sync) {
                return fn(sub.value, sub.key, unsub);
              } else {
                return rh._.defer(fn, sub.value, sub.key, unsub);
              }
            });
          });
        } else {
          rh._d('error', 'Publish', this + '.' + key + ' is not a string');
        }
      }
    }, {
      key: 'cpublish',
      value: function cpublish(key, value, opts) {
        return this.publish(consts(key), value, opts);
      }
    }, {
      key: 'isSubscribed',
      value: function isSubscribed(key) {
        var found = void 0;
        if (this._isForGlobal(key)) {
          return rh.model.isSubscribed(key);
        }
        if (key[0] === '.') {
          key = key.substring(1);
        }
        var subs = this._rootNode.getSubscribers(this._getKeys(key));
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Array.from(subs)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var sub = _step.value;
            if (sub.key === key) {
              found = true;
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        return found === true;
      }
    }, {
      key: 'cisSubscribed',
      value: function cisSubscribed(key) {
        return this.isSubscribed(consts(key));
      }
    }, {
      key: 'subscribeOnce',
      value: function subscribeOnce(key, fn, opts) {
        var _this3 = this;

        if (opts == null) {
          opts = {};
        }
        var keys = _.isString(key) ? [key] : key;
        return this._subscribe(keys.splice(0, 1)[0], function (value, key, unsub) {
          if (keys.length === 0) {
            fn(value, key);
          } else {
            _this3.subscribeOnce(keys, fn, opts);
          }
          return unsub();
        }, opts);
      }
    }, {
      key: 'csubscribeOnce',
      value: function csubscribeOnce(key, fn, opts) {
        return this.subscribeOnce(consts(key), fn, opts);
      }
    }, {
      key: 'subscribe',
      value: function subscribe(key, fn, opts) {
        var _this4 = this;

        if (opts == null) {
          opts = {};
        }
        if (_.isString(key)) {
          return this._subscribe(key, fn, opts);
        } else {
          var unsubs = _.map(key, function (item) {
            return _this4._subscribe(item, fn, opts);
          });
          return function () {
            return _.each(unsubs, function (unsub) {
              return unsub();
            });
          };
        }
      }
    }, {
      key: 'csubscribe',
      value: function csubscribe(key, fn, opts) {
        return this.subscribe(consts(key), fn, opts);
      }
    }, {
      key: '_subscribe',
      value: function _subscribe(key, fn, opts) {
        var _this5 = this;

        if (opts == null) {
          opts = {};
        }
        if (this._isForGlobal(key)) {
          return rh.model.subscribe(key, fn, opts);
        }
        if (rh._debug) {
          rh._d('log', 'Subscribe', this + '.' + key);
        }

        this._rootNode.addSubscribers(fn, this._getKeys(key), opts);
        var value = this._rootNode.getData(this._getKeys(key));
        var unsub = function unsub() {
          return _this5._unsubscribe(key, fn);
        };
        if (opts.forceInit || value != null && !opts.initDone) {
          fn(value, key, unsub);
        }
        return unsub;
      }
    }, {
      key: '_unsubscribe',
      value: function _unsubscribe(key, fn) {
        if (this._isForGlobal(key)) {
          return rh.model._unsubscribe(key);
        }
        if (rh._debug) {
          rh._d('log', '_Unsubscribe', this + '.' + key);
        }
        return this._rootNode.removeSubscriber(fn, this._getKeys(key));
      }
    }, {
      key: 'isGlobal',
      value: function isGlobal() {
        return this === rh.model;
      }
    }, {
      key: 'isGlobalKey',
      value: function isGlobalKey(key) {
        return key && key[0] === '.';
      }
    }, {
      key: '_isForGlobal',
      value: function _isForGlobal(key) {
        return !this.isGlobal() && this.isGlobalKey(key);
      }
    }, {
      key: '_getKeys',
      value: function _getKeys(fullKey) {
        var keys = fullKey.split('.');
        if (keys[0] === '') {
          keys = keys.slice(1);
        } //strip first global key .
        if (rh._debug && keys.length === 0) {
          rh._d('error', 'Model', this + '.' + fullKey + ' is invalid');
        }
        return keys;
      }
    }]);

    return Model;
  }();
  Model.initClass();
  return Model;
}();

//global object
rh.Model = Model;
rh.model = new Model();
rh.model.toString = function () {
  return 'GlobalModel';
};

},{}],12:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var $ = rh.$;
var _ = rh._;

var NodeHolder = function () {
  function NodeHolder(nodes) {
    _classCallCheck(this, NodeHolder);

    this.nodes = nodes;
  }

  _createClass(NodeHolder, [{
    key: 'isVisible',
    value: function isVisible(node) {
      if (node == null) {
        node = this.nodes[0];
      }
      return !$.hasClass(node, 'rh-hide');
    }
  }, {
    key: 'show',
    value: function show() {
      return _.each(this.nodes, function (node) {
        if (!this.isVisible(node)) {
          $.removeClass(node, 'rh-hide');
          return node.hidden = false;
        }
      }, this);
    }
  }, {
    key: 'hide',
    value: function hide() {
      return _.each(this.nodes, function (node) {
        if (this.isVisible(node)) {
          $.addClass(node, 'rh-hide');
          return node.hidden = true;
        }
      }, this);
    }
  }, {
    key: 'accessible',
    value: function accessible(flag) {
      return _.each(this.nodes, function (node) {
        return node.hidden = flag;
      });
    }
  }, {
    key: 'updateClass',
    value: function updateClass(newClasses) {
      if (this.oldClasses == null) {
        this.oldClasses = [];
      }
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Array.from(this.nodes)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var node = _step.value;
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = Array.from(this.oldClasses)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var className = _step2.value;
              $.removeClass(node, className);
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = Array.from(newClasses)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              className = _step3.value;

              if (className.length > 0) {
                $.addClass(node, className);
                this.oldClasses.push(className);
              }
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'updateNodes',
    value: function updateNodes(newNodes) {
      var firstNode = this.nodes[0];
      var parentNode = firstNode.parentNode;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = Array.from(newNodes)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var node = _step4.value;
          parentNode.insertBefore(node, firstNode);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = Array.from(this.nodes)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          node = _step5.value;
          parentNode.removeChild(node);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      return this.nodes = newNodes;
    }
  }]);

  return NodeHolder;
}();

rh.NodeHolder = NodeHolder;

},{}],13:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var _ = rh._;

var Plugin = function () {
  function Plugin() {
    _classCallCheck(this, Plugin);
  }

  _createClass(Plugin, [{
    key: 'attachOwner',
    value: function attachOwner(obj) {
      if (this._ownerFns == null) {
        this._ownerFns = {};
      }
      if (this.hasOwner()) {
        this.detach(this.owner);
      }
      this.owner = obj;
      if (this._overrideNames) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = Array.from(this._overrideNames)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var fnName = _step.value;
            this._overrideOwnerFn(fnName);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
      return this.ownerIsChanged();
    }
  }, {
    key: 'detachOwner',
    value: function detachOwner() {
      if (this.hasOwner()) {
        if (this._ownerFns) {
          for (var fnName in this._ownerFns) {
            this._restoreOwnerFn(fnName);
          }
        }
        this.owner = null;
        this._ownerFns = {};
        return this.ownerIsChanged();
      }
    }

    // plugin should override this method to get the notification of owoner change

  }, {
    key: 'ownerIsChanged',
    value: function ownerIsChanged() {}
  }, {
    key: 'hasOwner',
    value: function hasOwner() {
      return this.owner != null;
    }
  }, {
    key: 'addOverrides',
    value: function addOverrides(fnNames) {
      var _this = this;

      if (this._overrideNames == null) {
        this._overrideNames = [];
      }
      return function () {
        var result = [];
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = Array.from(fnNames)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var fnName = _step2.value;

            _this._overrideNames.push(fnName);
            result.push(_this._overrideOwnerFn(fnName));
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        return result;
      }();
    }
  }, {
    key: 'removeOverrides',
    value: function removeOverrides(fnNames) {
      var _this2 = this;

      return function () {
        var result = [];
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = Array.from(fnNames)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var fnName = _step3.value;

            _this2._restoreOwnerFn(fnName);
            var index = _this2._overrideNames.indexOf(fnName);
            if (index > -1) {
              result.push(_this2._overrideNames.splice(index, 1));
            } else {
              result.push(undefined);
            }
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        return result;
      }();
    }
  }, {
    key: '_overrideOwnerFn',
    value: function _overrideOwnerFn(fnName) {
      if (this.hasOwner()) {
        var ownerFn = this.owner[fnName];
        this._ownerFns[fnName] = ownerFn;
        return this.owner[fnName] = function () {
          var _this3 = this;

          var args = [];var i = -1;
          while (++i < arguments.length) {
            args.push(arguments[i]);
          }
          var bindedFn = function bindedFn(newArgs) {
            return __guardMethod__(ownerFn, 'apply', function (o) {
              return o.apply(_this3.owner, newArgs);
            });
          };
          return this[fnName](bindedFn, args);
        }.bind(this);
      }
    }
  }, {
    key: '_restoreOwnerFn',
    value: function _restoreOwnerFn(fnName) {
      if (this.hasOwner()) {
        this.owner[fnName] = this._ownerFns[fnName];
        return delete this._ownerFns[fnName];
      }
    }
  }]);

  return Plugin;
}();

rh.Plugin = Plugin;

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}

},{}],14:[function(require,module,exports){
'use strict';

var _window = window,
    rh = _window.rh;
var _ = rh._;


var $ = rh.$ = function (selector, index) {
  if (index != null && index === 0) {
    return document.querySelector(selector);
  } else {
    var nodeList = document.querySelectorAll(selector);
    if (index != null && index < nodeList.length) {
      return nodeList[index];
    } else {
      return nodeList;
    }
  }
};

//arguments
// (parent, selector) ->
// or (selector) ->
$.find = function () {
  var parent = void 0,
      selector = void 0;
  if (arguments.length > 1) {
    parent = arguments[0];
    selector = arguments[1];
  } else {
    parent = document;
    selector = arguments[0];
  }
  return parent.querySelectorAll(selector);
};

$.traverseNode = function (node, preChild, postChild, onChild, context) {
  if (context == null) {
    context = window;
  }
  if (preChild && preChild.call(context, node)) {
    $.eachChildNode(node, function (child) {
      if (!onChild || onChild.call(context, child)) {
        return $.traverseNode(child, preChild, postChild, onChild, context);
      }
    });
    if (postChild) {
      postChild.call(context, node);
    }
  }
  return node;
};

$.eachChildNode = function (parent, fn, context) {
  if (context == null) {
    context = window;
  }
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Array.from(parent.children)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var child = _step.value;
      fn.call(context, child);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};

$.eachChild = function (parent, selector, fn, context) {
  if (context == null) {
    context = window;
  }
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = Array.from(this.find(parent, selector))[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var node = _step2.value;

      fn.call(context, node);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
};

$.eachDataNode = function (parent, dataAttr, fn, context) {
  if (context == null) {
    context = window;
  }
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = Array.from(this.find(parent, '[data-' + dataAttr + ']'))[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var node = _step3.value;

      fn.call(context, node, $.dataset(node, dataAttr));
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }
};

$.eachAttributes = function (node, fn, context) {
  var infos = Array.from(node.attributes).map(function (attr) {
    return [attr.specified, attr.name, attr.value];
  });
  var i = -1;
  while (++i < infos.length) {
    //here length can be increased in between
    var info = infos[i];
    if (info[0] !== false) {
      fn.call(context || window, info[1], info[2], infos);
    }
  }
};

$.getAttribute = function (node, attrName) {
  if (node.getAttribute != null) {
    return node.getAttribute(attrName);
  }
};

$.setAttribute = function (node, attrName, value) {
  if (node.setAttribute != null) {
    return node.setAttribute(attrName, value);
  }
};

$.removeAttribute = function (node, attrName) {
  if (node.removeAttribute != null) {
    return node.removeAttribute(attrName);
  }
};

$.hasAttribute = function (node, attrName) {
  if (node.hasAttribute != null) {
    return node.hasAttribute(attrName);
  } else {
    return false;
  }
};

$.dataset = function (node, attrName, value) {
  if (arguments.length === 3) {
    if (value !== null) {
      return $.setAttribute(node, 'data-' + attrName, value);
    } else {
      return $.removeAttribute(node, 'data-' + attrName);
    }
  } else {
    return $.getAttribute(node, 'data-' + attrName);
  }
};

$.isDescendent = function (parent, child) {
  var node = child.parentNode;
  while (true) {
    if (!node || node === parent) {
      break;
    }
    node = node.parentNode;
  }
  return node === parent;
};

$.addClass = function (node, className) {
  if (node.classList != null) {
    return node.classList.add(className);
  } else {
    return node.className = node.className + ' ' + className;
  }
};

$.removeClass = function (node, className) {
  if (node.classList != null) {
    return node.classList.remove(className);
  } else {
    return node.className = node.className.replace(className, '');
  }
};

$.hasClass = function (node, className) {
  if (node.classList != null) {
    return node.classList.contains(className);
  } else if (node.className) {
    return node.className.match(new RegExp(className + '($| )')) !== null;
  }
};

$.toggleClass = function (node, className) {
  if ($.hasClass(node, className)) {
    return $.removeClass(node, className);
  } else {
    return $.addClass(node, className);
  }
};

$.computedStyle = function (node) {
  return node.currentStyle || window.getComputedStyle(node, null);
};

$.isVisibleNode = function (node) {
  var computedStyle = $.computedStyle(node);
  return 'none' !== computedStyle['display'] && !_.isZeroCSSValue(computedStyle['opacity']) && !_.isZeroCSSValue(computedStyle['max-height']);
};

$.textContent = function (node, content) {
  if (arguments.length === 2) {
    if (node.textContent != null) {
      return node.textContent = content;
    } else {
      return node.innerText = content;
    }
  } else {
    return node.textContent || node.innerText;
  }
};

$.innerHTML = function (node, content) {
  if (arguments.length === 2) {
    return node.innerHTML = content;
  } else {
    return node.innerHTML;
  }
};

$.css = function (node, styleName, value) {
  if (arguments.length === 3) {
    return node.style[styleName] = value;
  } else {
    return node.style[styleName];
  }
};

$.nodeName = function (node) {
  return node.nodeName;
};

$.pageHeight = function () {
  var height = void 0;
  var de = document.documentElement;
  if (de) {
    height = de.scrollHeight || de.clientHeight || de.offsetHeight;
  }
  if (!height) {
    height = window.innerHeight;
  }
  var _document = document,
      body = _document.body;

  var bodyHeight = body.scrollHeight || body.clientHeight || body.offsetHeight;
  height = Math.max(height, bodyHeight);
  return height + 'px';
};

$.createElement = function (tag, innerHtml) {
  var tagNode = document.createElement(tag);
  tagNode.innerHTML = innerHtml;
  return tagNode;
};

},{}],15:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var consts = rh.consts;
var model = rh.model;

var Responsive = function () {
  _createClass(Responsive, [{
    key: 'toString',
    value: function toString() {
      return 'Responsive';
    }
  }]);

  function Responsive() {
    var _this = this;

    _classCallCheck(this, Responsive);

    this.subs = [];
    model.subscribe(consts('EVT_ORIENTATION_CHANGE'), function () {
      return _.each(_this.subs, function (sub) {
        return sub.eventHandler(sub.mql);
      });
    });

    if (rh._debug && !this.isSupported()) {
      rh._d('error', 'Browser Issue', 'matchMedia is not supported.');
    }
  }

  _createClass(Responsive, [{
    key: 'isSupported',
    value: function isSupported() {
      return window.matchMedia != null;
    }
  }, {
    key: 'attach',
    value: function attach(media_query, onFn, offFn) {
      if (this.isSupported) {
        var mql = window.matchMedia(media_query);
        var eventHandler = function eventHandler(mql) {
          if (mql.matches) {
            return onFn();
          } else {
            return offFn();
          }
        };
        eventHandler(mql);
        mql.addListener(eventHandler);
        return this.subs.push({ mql: mql, on: onFn, off: offFn, eventHandler: eventHandler });
      }
    }
  }, {
    key: 'detach',
    value: function detach(media_query, onFn, offFn) {
      for (var index = 0; index < this.subs.length; index++) {
        var sub = this.subs[index];
        if (sub.mql.media === media_query && sub.on === onFn && sub.off === offFn) {
          sub.mql.removeListener(sub.eventHandler);
          this.subs.splice(index);
          break;
        }
      }
    }
  }]);

  return Responsive;
}();

rh.responsive = new Responsive();

},{}],16:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;
var consts = rh.consts;
var model = rh.model;
var http = rh.http;

var formdata = rh.formData;

var RoboHelpServer = function () {
  _createClass(RoboHelpServer, [{
    key: 'toString',
    value: function toString() {
      return 'RoboHelpServer';
    }
  }]);

  function RoboHelpServer() {
    _classCallCheck(this, RoboHelpServer);
  }

  _createClass(RoboHelpServer, [{
    key: 'area',
    value: function area() {
      return _.urlParam('area', _.extractParamString());
    }
  }, {
    key: 'type',
    value: function type() {
      return _.urlParam('type', _.extractParamString());
    }
  }, {
    key: 'project',
    value: function project() {
      return _.urlParam('project', _.extractParamString());
    }
  }, {
    key: 'logTopicView',
    value: function logTopicView(topic) {
      var _this = this;

      return model.subscribe(consts('EVT_PROJECT_LOADED'), function () {
        var baseUrl = model.get(consts('KEY_PUBLISH_BASE_URL'));
        var parentPath = _.parentPath(_.filePath(_.getRootUrl()));
        var tpcUrl = _.isRelativeUrl(topic) ? parentPath + topic : topic;
        if (baseUrl && !_.isEmptyString(baseUrl)) {
          var hashString = _.mapToEncodedString(_.extend(consts('RHS_LOG_TOPIC_VIEW'), { area: _this.area(), tpc: _.filePath(tpcUrl) }));
          return http.get(baseUrl + '?' + hashString);
        }
      });
    }
  }, {
    key: 'preSearch',
    value: function preSearch() {
      var hashString = void 0;
      var searchText = model.get(consts('KEY_SEARCH_TERM'));
      if (searchText && !_.isEmptyString(searchText)) {
        hashString = _.mapToEncodedString(_.extend(consts('RHS_DO_SEARCH'), _.addPathNameKey({
          area: this.area(), type: this.type(), project: this.project(), quesn: searchText,
          oldquesn: '', quesnsyn: ''
        })));

        model.publish(consts('KEY_SEARCHED_TERM'), searchText);
        model.publish(consts('EVT_SEARCH_IN_PROGRESS'), true);
        model.publish(consts('KEY_SEARCH_PROGRESS'), 0);
      }

      return { searchText: searchText, hashString: hashString };
    }
  }, {
    key: 'postSearch',
    value: function postSearch(searchText, resultsText) {
      var searchResults = JSON.parse(resultsText);
      if (searchResults && searchResults.clientIndex) {
        var hashString = _.mapToEncodedString(_.addPathNameKey({ area: this.area(), type: this.type(),
          project: this.project(), quesn: searchText, cmd: 'clientindex' }));
        model.subscribeOnce(consts('KEY_SEARCH_RESULTS'), function (data) {
          var baseUrl = model.get(consts('KEY_PUBLISH_BASE_URL'));
          return http.post(baseUrl + '?' + hashString, JSON.stringify(data), { 'Content-type': 'application/json' }).error(function () {
            var result = void 0;
            return result = false;
          }).success(function () {
            var result = void 0;
            return result = true;
          });
        }, { initDone: true });
        return window.doSearch();
      }
      model.publish(consts('EVT_SEARCH_IN_PROGRESS'), false);
      model.publish(consts('KEY_SEARCH_PROGRESS'), null);

      if (searchResults) {
        var searchTopics = searchResults.topics;
        if (searchTopics && searchTopics.length > 0) {
          window.setResultsStringHTML(searchTopics.length, window._textToHtml_nonbsp(searchText));
        }

        var resultsParams = '?' + _.mapToEncodedString(_.extend({ rhhlterm: searchText }, { rhsyns: searchResults.syns }));

        model.publish(consts('KEY_SEARCH_RESULT_PARAMS'), resultsParams);
        model.publish(consts('KEY_SEARCH_RESULTS'), searchTopics);
      }

      if (!searchResults || !(searchResults.topics != null ? searchResults.topics.length : undefined)) {
        return window.displayMsg(window.gsNoTopics);
      }
    }
  }, {
    key: 'doSearch',
    value: function doSearch() {
      var _this2 = this;

      var result = model.get(consts('KEY_PUBLISH_MODE'));
      var baseUrl = model.get(consts('KEY_PUBLISH_BASE_URL'));
      if (baseUrl && !_.isEmptyString(baseUrl)) {
        var _preSearch = this.preSearch(),
            searchText = _preSearch.searchText,
            hashString = _preSearch.hashString;

        http.get(baseUrl + '?' + hashString).error(function () {
          return result = false;
        }).success(function (resultsText) {
          _this2.postSearch(searchText, resultsText);
          return result = true;
        });
      }
      return result;
    }
  }]);

  return RoboHelpServer;
}();

rh.rhs = new RoboHelpServer();

},{}],17:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var consts = rh.consts;
var model = rh.model;


var defaultScreens = {
  desktop: {
    media_query: 'screen and (min-width: 1296px)'
  },
  tablet: {
    media_query: 'screen and (min-width: 942px) and (max-width: 1295px)'
  },
  phone: {
    media_query: 'screen and (max-width: 941px)'
  },
  ios: {
    user_agent: /(iPad|iPhone|iPod)/g
  },
  ipad: {
    user_agent: /(iPad)/g
  },
  print: {
    media_query: 'print'
  }
};

var Screen = function () {
  _createClass(Screen, [{
    key: 'attachedKey',
    value: function attachedKey(name) {
      return consts('KEY_SCREEN') + '.' + name + '.attached';
    }
  }]);

  function Screen() {
    _classCallCheck(this, Screen);

    this.subscribeScreen = this.subscribeScreen.bind(this);
    this.onScreen = this.onScreen.bind(this);
    this.offScreen = this.offScreen.bind(this);
    var data = _.extend({}, defaultScreens, model.get(consts('KEY_SCREEN')));
    if (data) {
      _.each(data, this.subscribeScreen);
    }
  }

  _createClass(Screen, [{
    key: 'subscribeScreen',
    value: function subscribeScreen(info, name) {
      var _this = this;

      if (info.user_agent && !window.navigator.userAgent.match(_.toRegExp(info.user_agent))) {
        return this.offScreen(name);
      } else if (info.media_query) {
        if (rh.responsive.isSupported()) {
          return rh.responsive.attach(info.media_query, function () {
            return _this.onScreen(name);
          }, function () {
            return _this.offScreen(name);
          });
        } else if (name === model.get(consts('KEY_DEFAULT_SCREEN'))) {
          return this.onScreen(name);
        } else {
          return this.offScreen(name);
        }
      } else {
        return this.onScreen(name);
      }
    }
  }, {
    key: 'onScreen',
    value: function onScreen(name) {
      var key = this.attachedKey(name);
      return model.publish(key, true);
    }
  }, {
    key: 'offScreen',
    value: function offScreen(name) {
      var key = this.attachedKey(name);
      if (false !== model.get(key)) {
        return model.publish(key, false);
      }
    }
  }]);

  return Screen;
}();

model.subscribe(consts('EVT_WIDGET_BEFORELOAD'), function () {
  var screen = null;
  return function () {
    return screen != null ? screen : screen = new Screen();
  };
}());

model.publish(consts('KEY_SCREEN_NAMES'), ['desktop', 'tablet', 'phone']);
model.publish(consts('KEY_SCREEN'), defaultScreens);
model.publish(consts('KEY_DEFAULT_SCREEN'), 'phone');

},{}],18:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var _ = rh._;

// Storage class to persist key value pairs to localDB/cookies

var Storage = function () {
  function Storage() {
    _classCallCheck(this, Storage);
  }

  _createClass(Storage, [{
    key: 'toString',
    value: function toString() {
      return 'Storage';
    }
  }, {
    key: 'init',
    value: function init(namespace) {
      if (this.namespace) {
        if (rh._debug && this.namespace !== namespace) {
          return rh._d('error', 'Storage', 'Namespace cann\'t be changed');
        }
      } else {
        var jsonString = void 0;
        this.namespace = namespace;
        if (_.canUseLocalDB()) {
          jsonString = localStorage.getItem(this.namespace);
        } else {
          var rawData = _.explodeAndMap(document.cookie, ';', '=');
          if (rawData[this.namespace]) {
            jsonString = unescape(rawData[this.namespace]);
          }
        }
        return this.storageMap = jsonString ? JSON.parse(jsonString) : {};
      }
    }
  }, {
    key: 'isValid',
    value: function isValid() {
      if (rh._debug && !this.storageMap) {
        rh._d('error', 'Storage', 'Namespace is not set yet.');
      }
      return this.storageMap != null;
    }
  }, {
    key: 'persist',
    value: function persist(key, value) {
      if (this.isValid()) {
        this.storageMap[key] = value;
        return this.dump();
      }
    }
  }, {
    key: 'fetch',
    value: function fetch(key) {
      if (this.isValid()) {
        return this.storageMap[key];
      }
    }
  }, {
    key: 'dump',
    value: function dump() {
      if (this.isValid()) {
        if (_.canUseLocalDB()) {
          return localStorage.setItem(this.namespace, JSON.stringify(this.storageMap));
        } else {
          return document.cookie = this.namespace + '=' + escape(JSON.stringify(this.storageMap));
        }
      }
    }
  }]);

  return Storage;
}();

rh.Storage = Storage;
rh.storage = new Storage();

},{}],19:[function(require,module,exports){
'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;
var consts = rh.consts;

//Widget class for any custom behavior on dom node

var Widget = function () {
  var _count = undefined;
  Widget = function (_rh$Guard) {
    _inherits(Widget, _rh$Guard);

    _createClass(Widget, [{
      key: 'toString',
      value: function toString() {
        return this.constructor.name + '_' + this._count;
      }
    }, {
      key: 'mapDataAttrMethods',
      value: function mapDataAttrMethods(attrs) {
        return _.reduce(attrs, function (map, value) {
          map['data-' + value] = 'data_' + value;
          return map;
        }, {});
      }
    }], [{
      key: 'initClass',
      value: function initClass() {

        //private static variable
        _count = 0;

        this.prototype.dataAttrs = ['repeat', 'init', 'stext', 'shtml', 'controller', 'class', 'animate', 'css', 'attr', 'value', 'checked', 'html', 'text', 'if', 'hidden', 'keydown', 'keyup', 'scroll', 'change', 'toggle', 'toggleclass', 'method', 'trigger', 'click', 'load', 'mouseover', 'mouseout', 'focus', 'blur', 'swipeleft', 'swiperight', 'swipeup', 'swipedown', 'screenvar'];

        this.prototype.dataAttrMethods = function () {
          return Widget.prototype.mapDataAttrMethods(Widget.prototype.dataAttrs);
        }();

        //all list/data-reapeat items data-i attribute are support
        //this is the list of special list item attribute.
        //That means attributes like data-ihref, data-iid etc will
        // be supported without listing here.
        this.prototype.dataIAttrs = ['itext', 'ihtml', 'iclass', 'irepeat'];
        this.prototype.dataIAttrMethods = function () {
          return Widget.prototype.mapDataAttrMethods(Widget.prototype.dataIAttrs);
        }();

        this.prototype.supportedArgs = ['node', 'model', 'key', 'user_vars', 'templateExpr', 'include'];

        this.prototype.resolveEventRawExpr = _.memoize(function (rawExpr) {
          var _$resolveExprOptions = _.resolveExprOptions(rawExpr),
              expr = _$resolveExprOptions.expr,
              opts = _$resolveExprOptions.opts;

          expr = this.patchRawExpr(expr, opts);
          var exprFn = this._function('event, node', expr);
          var callback = _.safeExec(exprFn);
          callback = _.applyCallbackOptions(callback, opts);
          return { callback: callback, opts: opts };
        });

        this.prototype.resolveRawExprWithValue = _.memoize(function (rawExpr) {
          var keys = [];

          var _$resolveExprOptions2 = _.resolveExprOptions(rawExpr),
              expr = _$resolveExprOptions2.expr,
              opts = _$resolveExprOptions2.opts;

          expr = this.patchRawExpr(expr, opts);
          var exprFn = this._evalFunction('', expr, keys);
          var callback = _.safeExec(exprFn);
          callback = _.applyCallbackOptions(callback, opts);
          return { callback: callback, keys: keys, opts: opts };
        });

        //######### Heleper function to create functions in widget #################
        this.prototype.resolveExpression = _.memoize(function (expr) {
          var keys = [];
          return {
            expr: _.resolveModelKeys(_.resolveNamedVar(expr), keys),
            keys: keys
          };
        });

        this.prototype._safeFunction = _.memoize(function (arg, expr) {
          var fn = void 0;
          try {
            fn = new Function(arg, expr);
          } catch (error) {
            fn = function fn() {};
            if (rh._debug) {
              rh._d('error', 'Expression: ' + expr, error.message);
            }
          }
          return fn;
        });

        this.prototype._eventCallBackData = {};

        this.prototype.resolveAttr = function () {
          var cache = {};
          return function (attrsData) {
            var props = cache[attrsData];
            if (props == null) {
              props = _.resolveAttr(attrsData);
              cache[attrsData] = props;
            }
            return props;
          };
        }();

        /*
         * Toggle model variable on click
         * Example: data-toggle='showhide'
         *          data-toggle='showLeftBar:true'
         *          data-toggle='showLeftBar:true;showRightBar:false'
         */
        this.prototype._toggleData = {};

        /*
         * Example: data-load='test.js'
         *          data-load='test.js:key'
         */
        this.prototype._loadData = {};
      }
    }]);

    function Widget(opts) {
      _classCallCheck(this, Widget);

      var _this = _possibleConstructorReturn(this, (Widget.__proto__ || Object.getPrototypeOf(Widget)).call(this));

      _this.reRender = _this.reRender.bind(_this);
      _count += 1;
      _this._count = _count;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Array.from(_this.supportedArgs)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var key = _step.value;
          if (opts[key]) {
            _this[key] = opts[key];
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      if (_this.templateExpr || _this.include) {
        _this.useTemplate = true;
      }
      _this.parseOpts(opts);
      if (!_this.node) {
        rh._d('error', 'constructor', _this + ' does not have a node');
      }
      return _this;
    }

    _createClass(Widget, [{
      key: 'destruct',
      value: function destruct() {
        this.resetContent();
        if (this._subscriptions) {
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = Array.from(this._subscriptions)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var unsub = _step2.value;
              unsub();
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        }
        this._subscriptions = [];
        delete this.model;
        return delete this.controllers;
      }
    }, {
      key: 'parseOpts',
      value: function parseOpts(opts) {
        this.opts = opts;
        if (opts.arg) {
          this.key = opts.arg;
        }
        return this.parsePipedArg();
      }
    }, {
      key: 'parsePipedArg',
      value: function parsePipedArg() {
        var args = this.opts.pipedArgs;
        if (args != null ? args.shift : undefined) {
          //first piped argument is default Model
          return this.modelArgs = _.resolveNiceJSON(args.shift());
        }
      }
    }, {
      key: 'get',
      value: function get(key) {
        if (this.model == null) {
          this.model = new rh.Model();
        }
        return this.model.get(key);
      }
    }, {
      key: 'publish',
      value: function publish(key, value, opts) {
        if (this.model == null) {
          this.model = new rh.Model();
        }
        return this.model.publish(key, value, opts);
      }
    }, {
      key: 'subscribe',
      value: function subscribe(key, fn, opts) {
        if (key == null) {
          return;
        }
        if (this.model == null) {
          this.model = new rh.Model();
        }
        var unsub = this.model.subscribe(key, fn, opts);
        if (this.model.isGlobal() || this.model.isGlobal(key)) {
          unsub = this.storeSubscribe(unsub);
        }
        return unsub;
      }
    }, {
      key: 'subscribeOnly',
      value: function subscribeOnly(key, fn, opts) {
        if (opts == null) {
          opts = {};
        }
        opts['initDone'] = true;
        return this.subscribe(key, fn, opts);
      }
    }, {
      key: 'storeSubscribe',
      value: function storeSubscribe(unsub) {
        var _this2 = this;

        if (this._subscriptions == null) {
          this._subscriptions = [];
        }
        var newUnsub = function newUnsub() {
          var index = _this2._subscriptions.indexOf(newUnsub);
          if (index != null && index !== -1) {
            _this2._subscriptions.splice(index, 1);
          }
          return unsub();
        };
        this._subscriptions.push(newUnsub);
        return newUnsub;
      }

      /*
       * data-if="@sidebar_open | screen: desktop"
       * data-if="@screen.desktop.attached === true && @sidebar_open"
       */

    }, {
      key: 'patchScreenOptions',
      value: function patchScreenOptions(expr, screen) {
        var names = _.isString(screen) ? [screen] : screen;
        var screenExpr = _.map(names, function (name) {
          return '@' + consts('KEY_SCREEN') + '.' + name + '.attached';
        }).join(' || ');
        if (screenExpr) {
          return screenExpr + ' ? (' + expr + ') : null';
        } else {
          return expr;
        }
      }
    }, {
      key: 'patchDirOptions',
      value: function patchDirOptions(expr, dir) {
        return '@' + consts('KEY_DIR') + ' == \'' + dir + '\' ? (' + expr + ') : null';
      }
    }, {
      key: 'patchRawExprOptions',
      value: function patchRawExprOptions(expr, opts) {
        if (opts.screen) {
          expr = this.patchScreenOptions(expr, opts.screen);
        }
        if (opts.dir != null) {
          expr = this.patchDirOptions(expr, opts.dir);
        }
        return expr;
      }
    }, {
      key: 'patchRawExpr',
      value: function patchRawExpr(expr, opts) {
        if (expr && _.isValidModelKey(expr)) {
          expr = '@' + expr;
        }
        if (opts) {
          expr = this.patchRawExprOptions(expr, opts);
        }
        return expr;
      }
    }, {
      key: 'subscribeExpr',
      value: function subscribeExpr(rawExpr, fn, subs, opts) {
        var _this3 = this;

        if (rawExpr == null) {
          return;
        }

        var _resolveRawExprWithVa = this.resolveRawExprWithValue(rawExpr),
            callback = _resolveRawExprWithVa.callback,
            keys = _resolveRawExprWithVa.keys,
            expOpts = _resolveRawExprWithVa.expOpts;

        var subsFn = function subsFn() {
          return fn.call(_this3, callback.call(_this3), expOpts);
        };

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = Array.from(keys)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var key = _step3.value;

            var unsub = this.subscribeOnly(key, subsFn, opts);
            if (subs) {
              subs.push(unsub);
            }
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        return subsFn();
      }
    }, {
      key: 'resetContent',
      value: function resetContent() {
        if (this.children) {
          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = Array.from(this.children)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var child = _step4.value;
              child.destruct();
            }
          } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion4 && _iterator4.return) {
                _iterator4.return();
              }
            } finally {
              if (_didIteratorError4) {
                throw _iteratorError4;
              }
            }
          }
        }
        if (this.htmlSubs) {
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = Array.from(this.htmlSubs)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var unsub = _step5.value;
              unsub();
            }
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }
        }
        this.children = [];
        return this.htmlSubs = [];
      }
    }, {
      key: 'addChild',
      value: function addChild(child) {
        if (this.children == null) {
          this.children = [];
        }
        return this.children.push(child);
      }
    }, {
      key: 'linkModel',
      value: function linkModel(fromModel, fromKey, toModel, toKey, opts) {
        var _this4 = this;

        if (opts == null) {
          opts = {};
        }
        var partial = opts.partial != null ? opts.partial : false;
        return this.storeSubscribe(fromModel.subscribe(fromKey, function (value) {
          return _this4.guard(function () {
            return toModel.publish(toKey, value, { sync: true });
          }, _this4.toString());
        }, { partial: partial }));
      }
    }, {
      key: 'init',
      value: function init(parent) {
        var initExpr = void 0;
        if (this.initDone) {
          return;
        }
        this.initDone = true;
        this.initParent(parent);
        this.initModel();

        if (initExpr = $.dataset(this.node, 'init')) {
          this.data_init(this.node, initExpr);
          $.dataset(this.node, 'init', null);
        }

        this.render();
        return this.subscribeOnly(this.opts.renderkey, this.reRender, { partial: false });
      }
    }, {
      key: 'initParent',
      value: function initParent(parent) {
        if (parent) {
          parent.addChild(this);
        }
        var parentModel = (parent != null ? parent.model : undefined) || rh.model;
        var input = __guard__($.dataset(this.node, 'input'), function (x) {
          return x.trim();
        });
        var output = __guard__($.dataset(this.node, 'output'), function (x1) {
          return x1.trim();
        });

        if (input === '.' || output === '.') {
          return this.model = parentModel;
        } else {
          var keys = void 0,
              opts = void 0;
          if (input || output || this.key) {
            if (this.model == null) {
              this.model = new rh.Model();
            }
          }
          if (input) {
            var _$resolveInputKeys = _.resolveInputKeys(input);

            keys = _$resolveInputKeys.keys;
            opts = _$resolveInputKeys.opts;

            _.each(keys, function (parentKey, key) {
              if (parentKey == null) {
                parentKey = key;
              }
              return this.linkModel(parentModel, parentKey, this.model, key, opts);
            }, this);
          }
          if (output) {
            var _$resolveInputKeys2 = _.resolveInputKeys(output);

            keys = _$resolveInputKeys2.keys;
            opts = _$resolveInputKeys2.opts;

            return _.each(keys, function (parentKey, key) {
              if (parentKey == null) {
                parentKey = key;
              }
              return this.linkModel(this.model, key, parentModel, parentKey, opts);
            }, this);
          }
        }
      }
    }, {
      key: 'initModel',
      value: function initModel() {
        if (this.modelArgs) {
          _.each(this.modelArgs, function (value, key) {
            return this.publish(key, value);
          }, this);
          return delete this.modelArgs;
        }
      }
    }, {
      key: 'initUI',
      value: function initUI() {
        if (rh._debug) {
          var loadedWidgets = $.dataset(this.node, 'loaded');
          if (loadedWidgets) {
            loadedWidgets = loadedWidgets + ';' + this;
          }
          $.dataset(this.node, 'loaded', loadedWidgets || this);
        } else {
          $.dataset(this.node, 'loaded', true);
        }

        if (this.templateExpr) {
          this.subscribeTemplateExpr();
        }
        if (this.include) {
          this.subscribeIncludePath();
        }
        if (this.tplNode == null) {
          this.tplNode = this.node;
        }
        return this.resetContent();
      }
    }, {
      key: 'subscribeTemplateExpr',
      value: function subscribeTemplateExpr() {
        var constructing = true;
        this.subscribeExpr(this.templateExpr, function (template) {
          this.tplNode = $.createElement('div', template).firstChild;
          if (!constructing) {
            return this.reRender(true);
          }
        });
        constructing = false;
        return this.templateExpr = undefined;
      }
    }, {
      key: 'subscribeIncludePath',
      value: function subscribeIncludePath() {
        var _this5 = this;

        _.require(this.include, function (template) {
          return _this5.setTemplate(template);
        });
        return this.include = undefined;
      }
    }, {
      key: 'setTemplate',
      value: function setTemplate(template) {
        this.useTemplate = true;
        this.tplNode = $.createElement('div', template).firstChild;
        return this.reRender(true);
      }
    }, {
      key: 'reRender',
      value: function reRender(render) {
        if (render != null && this.tplNode) {
          return this.render();
        }
      }
    }, {
      key: 'preRender',
      value: function preRender() {
        var oldNode = void 0;
        if (this.useTemplate) {
          oldNode = this.node;
          this.node = this.tplNode.cloneNode(true);
        }
        return oldNode;
      }
    }, {
      key: 'postRender',
      value: function postRender(oldNode) {
        if (oldNode && oldNode.parentNode) {
          return oldNode.parentNode.replaceChild(this.node, oldNode);
        }
      }
    }, {
      key: 'alterNodeContent',
      value: function alterNodeContent() {}
    }, {
      key: 'render',
      value: function render() {
        if (rh._test) {
          rh.model.publish('test.' + this + '.render.begin', _.time());
        }
        this.initUI();
        var oldNode = this.preRender();
        this.nodeHolder = new rh.NodeHolder([this.node]);
        this.alterNodeContent();
        this.resolveDataAttrs(this.node);
        _.loadDataHandlers(this.node, this);
        this.postRender(oldNode);
        if (rh._test) {
          return rh.model.publish('test.' + this + '.render.end', _.time());
        }
      }
    }, {
      key: 'isVisible',
      value: function isVisible() {
        return this.nodeHolder.isVisible();
      }
    }, {
      key: 'show',
      value: function show() {
        return this.nodeHolder.show();
      }
    }, {
      key: 'hide',
      value: function hide() {
        return this.nodeHolder.hide();
      }
    }, {
      key: 'toggle',
      value: function toggle() {
        if (this.isVisible()) {
          return this.hide();
        } else {
          return this.show();
        }
      }
    }, {
      key: 'isWidgetNode',
      value: function isWidgetNode(node) {
        return $.dataset(node, 'rhwidget');
      }
    }, {
      key: 'isDescendent',
      value: function isDescendent(node) {
        var nestedWidget = void 0;
        var child = node;
        while (true) {
          var parent = child.parentNode;
          if (!parent) {
            break;
          }
          if (this.isWidgetNode(child)) {
            nestedWidget = parent;
            break;
          }
          if (this.node === parent) {
            break;
          }
          child = parent;
        }
        return nestedWidget != null;
      }
    }, {
      key: 'eachChild',
      value: function eachChild(selector, fn) {
        return $.eachChild(this.node, selector, function (node) {
          if (!this.isDescendent(node)) {
            return fn.call(this, node);
          }
        }, this);
      }
    }, {
      key: 'eachDataNode',
      value: function eachDataNode(dataAttr, fn) {
        return $.eachDataNode(this.node, dataAttr, function (node, value) {
          if (!this.isDescendent(node)) {
            return fn.call(this, node, value);
          }
        }, this);
      }
    }, {
      key: 'traverseNode',
      value: function traverseNode(node, pre, post) {
        return $.traverseNode(node, pre, post, function (child) {
          return !this.isDescendent(child);
        }, this);
      }
    }, {
      key: 'resolveDataAttrs',
      value: function resolveDataAttrs(pnode) {
        return this.traverseNode(pnode, function (node) {
          var repeatVal = void 0;
          if (_.isString(repeatVal = $.dataset(node, 'repeat'))) {
            this.data_repeat(node, repeatVal);
            return false;
          } else {
            $.eachAttributes(node, function (name, value) {
              var fnName = this.dataAttrMethods[name];
              if (fnName && value) {
                return this[fnName].call(this, node, value);
              }
            }, this);
            return true;
          }
        });
      }
    }, {
      key: 'resolveRepeatExpr',
      value: function resolveRepeatExpr(rawExpr) {
        var values = _.resolvePipedExpression(rawExpr);
        var opts = values[1] && _.resolveNiceJSON(values[1]);
        var data = _.resolveLoopExpr(values[0]);
        if (opts != null ? opts.filter : undefined) {
          data['filter'] = this._evalFunction('item, index', opts.filter);
        }
        data['step'] = (opts != null ? opts.step : undefined) || 1;
        return data;
      }

      /*
       * varName: Ex: #{@data.title} means item.data.title
       */

    }, {
      key: 'resolveRepeatVar',
      value: function resolveRepeatVar(expr, item, index, cache, node) {
        var _this6 = this;

        return cache[expr] = cache[expr] || function () {
          switch (expr) {
            case '@index':
              return index;
            case '@size':
              return item.length;
            case 'this':
              return item;
            default:
              if (_.isValidModelKey(expr)) {
                return _.get(item, expr);
              } else {
                return _this6.subscribeIDataExpr(node, expr, item, index);
              }
          }
        }();
      }
    }, {
      key: 'resolveEnclosedVar',
      value: function resolveEnclosedVar(value, item, index, itemCache, node) {
        return _.resolveEnclosedVar(value, function (varName) {
          return this.resolveRepeatVar(varName, item, index, itemCache, node);
        }, this);
      }
    }, {
      key: 'updateEncloseVar',
      value: function updateEncloseVar(name, value, item, index, itemCache, node) {
        var newValue = this.resolveEnclosedVar(value, item, index, itemCache, node);
        if (newValue === '') {
          $.removeAttribute(node, name);
        } else if (newValue !== value) {
          $.setAttribute(node, name, newValue);
        }
        return newValue;
      }
    }, {
      key: 'updateWidgetEncloseVar',
      value: function updateWidgetEncloseVar(item, index, itemCache, node) {
        return _.each(['rhwidget', 'input', 'output', 'init'], function (name) {
          var value = void 0;
          if (value = $.dataset(node, name)) {
            return this.updateEncloseVar('data-' + name, value, item, index, itemCache, node);
          }
        }, this);
      }
    }, {
      key: 'isRepeat',
      value: function isRepeat(node) {
        return $.dataset(node, 'repeat') || $.dataset(node, 'irepeat');
      }
    }, {
      key: 'resolveNestedRepeat',
      value: function resolveNestedRepeat(node, item, index, itemCache) {
        return _.each(['repeat', 'irepeat'], function (name) {
          var value = void 0;
          if (value = $.dataset(node, name)) {
            value = this.updateEncloseVar('data-' + name, value, item, index, itemCache, node);
            if (value !== '') {
              return typeof this['data_' + name] === 'function' ? this['data_' + name](node, value, item, index) : undefined;
            }
          }
        }, this);
      }
    }, {
      key: 'resolveItemIndex',
      value: function resolveItemIndex(pnode, item, index) {
        var _this7 = this;

        if (!pnode.children) {
          return;
        }
        var itemCache = {};
        return $.traverseNode(pnode, function (node) {
          if (node !== pnode && $.dataset(node, 'rhwidget')) {
            _this7.updateWidgetEncloseVar(item, index, itemCache, node);
            return false;
          }

          if (_this7.isRepeat(node)) {
            _this7.resolveNestedRepeat(node, item, index, itemCache);
            return false;
          }

          $.eachAttributes(node, function (name, value, attrsInfo) {
            if (_.isString(value)) {
              var fnName = void 0;
              if (0 === name.search('data-')) {
                value = this.updateEncloseVar(name, value, item, index, itemCache, node);
              }
              if (value === '') {
                return;
              }

              if (fnName = this.dataIAttrMethods[name]) {
                if (this[fnName].call(this, node, value, item, index, attrsInfo)) {
                  return $.removeAttribute(node, name);
                }
              } else if (0 === name.search('data-i-')) {
                this.data_iHandler(node, value, item, index, name.substring(7));
                return $.removeAttribute(node, name);
              }
            }
          }, _this7);
          return true;
        });
      }
    }, {
      key: 'guard',
      value: function guard(fn, guardName) {
        if (guardName == null) {
          guardName = 'ui';
        }
        return _get(Widget.prototype.__proto__ || Object.getPrototypeOf(Widget.prototype), 'guard', this).call(this, fn, guardName);
      }
    }, {
      key: 'data_repeat',
      value: function data_repeat(node, rawExpr) {
        var _this8 = this;

        $.dataset(node, 'repeat', null);
        node.removeAttribute('data-repeat');
        var opts = this.resolveRepeatExpr(rawExpr);

        var nodeHolder = new rh.NodeHolder([node]);
        this.subscribeDataExpr(opts.expr, function (result) {
          //TODO usub old subs using stack of html subs
          return _this8._repeatNodes(nodeHolder, result, opts, node);
        }, { partial: false });
        return true;
      }

      //if statement for data-repeat like structure

    }, {
      key: 'resolve_rif',
      value: function resolve_rif(node, item, index) {
        var callback = void 0,
            cloneNode = void 0,
            rawExpr = void 0;
        if (rawExpr = $.dataset(node, 'rif')) {
          callback = this._evalFunction('item, index', rawExpr);
        }

        if (!callback || callback.call(this, item, index)) {
          cloneNode = node.cloneNode(false);
          $.dataset(cloneNode, 'rif', null);
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = Array.from(node.childNodes)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var child = _step6.value;

              var cloneChild = this.resolve_rif(child, item, index);
              if (cloneChild) {
                cloneNode.appendChild(cloneChild);
              }
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }
        }
        return cloneNode;
      }
    }, {
      key: '_function',
      value: function _function(arg, expr, keys) {
        var data = this.resolveExpression(expr);
        if (keys) {
          var _iteratorNormalCompletion7 = true;
          var _didIteratorError7 = false;
          var _iteratorError7 = undefined;

          try {
            for (var _iterator7 = Array.from(data.keys)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
              var key = _step7.value;
              keys.push(key);
            }
          } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion7 && _iterator7.return) {
                _iterator7.return();
              }
            } finally {
              if (_didIteratorError7) {
                throw _iteratorError7;
              }
            }
          }
        }
        return this._safeFunction(arg, data.expr);
      }
    }, {
      key: '_evalFunction',
      value: function _evalFunction(arg, expr, keys) {
        return this._function(arg, 'return ' + expr + ';', keys);
      }

      //########## list or repeat items data attributes handling ############

    }, {
      key: '_setLoopVar',
      value: function _setLoopVar(opts, item, index) {
        var oldValue = {};
        if (opts.item) {
          oldValue['item'] = this.user_vars[opts.item];
          this.user_vars[opts.item] = item;
        }
        if (opts.index) {
          oldValue['index'] = this.user_vars[opts.index];
          this.user_vars[opts.index] = index;
        }
        return oldValue;
      }
    }, {
      key: '_repeatNodes',
      value: function _repeatNodes(nodeHolder, result, opts, tmplNode) {
        var cloneNode = void 0;
        if (result == null) {
          result = [];
        }
        if (this.user_vars == null) {
          this.user_vars = {};
        }
        var newNodes = [];
        var filter = opts.filter,
            step = opts.step;

        for (var step1 = step, asc = step1 > 0, index = asc ? 0 : result.length - 1; asc ? index < result.length : index >= 0; index += step1) {
          var item = result[index];
          var oldValue = this._setLoopVar(opts, item, index);
          if (!filter || filter.call(this, item, index)) {
            if (cloneNode = this.resolve_rif(tmplNode, item, index)) {
              newNodes.push(cloneNode);
              this.resolveItemIndex(cloneNode, item, index);
              this.resolveDataAttrs(cloneNode);
            }
          }
          this._setLoopVar(opts, oldValue.item, oldValue.index);
        }

        if (newNodes.length === 0) {
          var tempNode = tmplNode.cloneNode(false);
          $.addClass(tempNode, 'rh-hide');
          newNodes.push(tempNode);
        }

        return nodeHolder.updateNodes(newNodes);
      }
    }, {
      key: 'data_irepeat',
      value: function data_irepeat(node, rawExpr, item, index, attrsInfo) {
        $.dataset(node, 'irepeat', null);
        var opts = this.resolveRepeatExpr(rawExpr);
        var nodeHolder = new rh.NodeHolder([node]);
        var result = this.subscribeIDataExpr(node, opts.expr, item, index);
        this._repeatNodes(nodeHolder, result, opts, node);
        return true;
      }

      /*
       * helper method for r(repeat) attributes
       */

    }, {
      key: 'subscribeIDataExpr',
      value: function subscribeIDataExpr(node, rawExpr, item, index, attrsInfo) {
        var exprFn = this._evalFunction('item, index, node', rawExpr);
        try {
          return exprFn.call(this, item, index, node);
        } catch (error) {
          if (rh._debug) {
            return rh._d('error', 'iExpression: ' + rawExpr, error.message);
          }
        }
      }

      /*
       * get the key value and fills its value as text content
       * Example: <a data-itext="item.title">temp value</a>
       *          <div data-itext="@key">temp value</div>
       */

    }, {
      key: 'data_itext',
      value: function data_itext(node, rawExpr, item, index, attrsInfo) {
        $.textContent(node, this.subscribeIDataExpr(node, rawExpr, item, index));
        return true;
      }

      /*
       * get the key value and fills its value as HTML content
       * Example: <a data-ihtml="item.data">temp value</a>
       *          <div data-ihtml="@key">temp value</div>
       */

    }, {
      key: 'data_ihtml',
      value: function data_ihtml(node, rawExpr, item, index, attrsInfo) {
        node.innerHTML = this.subscribeIDataExpr(node, rawExpr, item, index);
        return true;
      }

      /*
       * get the key value and fills its value as text content
       * Example: <a data-iclass="item.data?'enabled':'disabled'">temp value</a>
       *          <div data-iclass="@key">temp value</div>
       */

    }, {
      key: 'data_iclass',
      value: function data_iclass(node, rawExpr, item, index, attrsInfo) {
        var className = this.subscribeIDataExpr(node, rawExpr, item, index);
        if (className) {
          $.addClass(node, className);
        }
        return true;
      }

      /*
       * get the key value and fills its value as text content
       * Example: <a data-ihref="item.url">temp value</a>
       *          <div data-iid="item.id">temp value</div>
       */

    }, {
      key: 'data_iHandler',
      value: function data_iHandler(node, rawExpr, item, index, attrName) {
        var attrValue = this.subscribeIDataExpr(node, rawExpr, item, index);
        if (attrValue) {
          $.setAttribute(node, attrName, attrValue);
        }
        return true;
      }

      //################ Static data attributes handling ##########################
      /* get the key value at the time of rendering
       * and fills its value as html content
       * Example: <a data-shtml="key">temp value</a>
       *          <div data-shtml="key">temp value</div>
       */

    }, {
      key: 'data_shtml',
      value: function data_shtml(node, key) {
        $.removeAttribute(node, 'data-shtml');
        return node.innerHTML = this.get(key);
      }

      /*
       * get the key value and fills its value as text content
       * Example: <a data-stext="key">temp value</a>
       *          <div data-stext="key">temp value</div>
       */

    }, {
      key: 'data_stext',
      value: function data_stext(node, key) {
        $.removeAttribute(node, 'data-stext');
        return $.textContent(node, this.get(key) || '');
      }

      //################ Generic data attributes handling ##########################
      /*
       * evaluates expression value to init
       * Example: data-init="@key(true)"
       *          data-init="rh._.loadScript('p.toc')"
       */

    }, {
      key: 'data_init',
      value: function data_init(node, rawExpr) {
        var resolvedData = _.resolveExprOptions(rawExpr);
        var callback = this._function('node', resolvedData.expr);
        callback = _.applyCallbackOptions(callback, resolvedData.opts);
        return callback.call(this, node);
      }

      /*
       * helper method for data methods having expression like data-if
       */

    }, {
      key: 'subscribeDataExpr',
      value: function subscribeDataExpr(rawExpr, handler, opts) {
        return this.subscribeExpr(rawExpr, handler, this.htmlSubs, opts);
      }
    }, {
      key: '_data_event_callback',
      value: function _data_event_callback(rawExpr) {
        var data = Widget.prototype._eventCallBackData[rawExpr];
        if (data == null) {
          data = {};
          var value = _.resolvePipedExpression(rawExpr);
          data.callback = this._function('event, node', value[0]);
          if (value[1]) {
            data.opts = _.resolveNiceJSON(value[1]);
          }
          Widget.prototype._eventCallBackData[rawExpr] = data;
        }
        return data;
      }

      /*
       * subscribes to keys and evaluates expression value to show or hide
       * Example: data-if="@key"
       *          data-if="!@key&&@key2"
       *          data-if='this.get("key", "value")'
       *          data-if="@key==value"
       *          data-if="@key!==value"
       */

    }, {
      key: 'data_if',
      value: function data_if(node, rawExpr) {
        var nodeHolder = new rh.NodeHolder([node]);
        return this.subscribeDataExpr(rawExpr, function (result) {
          if (result) {
            return nodeHolder.show();
          } else {
            return nodeHolder.hide();
          }
        });
      }
    }, {
      key: 'data_hidden',
      value: function data_hidden(node, rawExpr) {
        var nodeHolder = new rh.NodeHolder([node]);
        return this.subscribeDataExpr(rawExpr, function (result) {
          return nodeHolder.accessible(!result);
        });
      }

      /*
       * subscribes to a key and fills its value as html content
       * Example: <a data-html="@key">temp value</a>
       *          <div data-html="@key['url']">temp value</div>
       */

    }, {
      key: 'data_html',
      value: function data_html(node, rawExpr) {
        return this.subscribeDataExpr(rawExpr, function (result) {
          var _this9 = this;

          if (result == null) {
            result = '';
          }
          node.innerHTML = result;
          //TODO unsub old subscribes
          return $.eachChildNode(node, function (child) {
            return _this9.resolveDataAttrs(child);
          });
        });
      }

      /*
       * subscribes to a key and fills its value as text content
       * Example: <a data-text="@key">temp value</a>
       *          <div data-text="@key['title']">temp value</div>
       */

    }, {
      key: 'data_text',
      value: function data_text(node, rawExpr) {
        return this.subscribeDataExpr(rawExpr, function (result) {
          if (result == null) {
            result = '';
          }
          return $.textContent(node, result);
        });
      }
      /*
       * provide expression to update the class attribute
       * Example: data-class="selected: #{@index} == @.dataidx"
       * data-class="selected: @key1; bold: @key2"
       */

    }, {
      key: 'data_class',
      value: function data_class(node, attrsData) {
        return _.each(this.resolveAttr(attrsData), function (rawExpr, className) {
          var nodeHolder = new rh.NodeHolder([node]);
          return this.subscribeDataExpr(rawExpr, function (result) {
            var addRemoveClass = result ? [className] : [];
            return nodeHolder.updateClass(addRemoveClass);
          });
        }, this);
      }

      /*
       * To update any html tag attribute.
       * Example: <a data-attr="href:link_key">Google</a>
       *          <button data-attr="disabled:key">temp value</button>
       */

    }, {
      key: 'data_attr',
      value: function data_attr(node, attrsData) {
        return _.each(this.resolveAttr(attrsData), function (rawExpr, attr_name) {
          return this.subscribeDataExpr(rawExpr, function (result) {
            if (result != null) {
              return $.setAttribute(node, attr_name, result);
            } else if ($.hasAttribute(node, attr_name)) {
              return $.removeAttribute(node, attr_name);
            }
          });
        }, this);
      }

      /*
       * To update style attribute of HTML node.
       * Example:
       * <span style="visible: true;" data-css="visible: @key"> some text </span>
       * <li style="color: blue; display: block;" data-css="color:
       * @.selected_color; display: @.dataidx > 10 ? 'none' : 'block'"></li>
       */

    }, {
      key: 'data_css',
      value: function data_css(node, attrsData) {
        return _.each(this.resolveAttr(attrsData), function (rawExpr, styleName) {
          return this.subscribeDataExpr(rawExpr, function () {
            var result = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
            return (// null to force set css
              $.css(node, styleName, result)
            );
          });
        }, this);
      }

      /*
       * works like data-if but sets the states checked
       * Example:
       * <input type="radio" name="group1" value="Print" data-checked="key" />
       * <input type="radio" name="group1" value="Online" data-checked="key" />
       */

    }, {
      key: 'data_checked',
      value: function data_checked(node, key) {
        var _this10 = this;

        if (_.isValidModelConstKey(key)) {
          key = consts(key);
        }
        var type = node.getAttribute('type');
        if (type === 'checkbox' || type === 'radio') {
          var nodeValue = void 0;
          if ($.getAttribute(node, 'checked')) {
            this.guard(function () {
              return this.publish(key, node.getAttribute('value', { sync: true }));
            });
          }

          node.onclick = function () {
            nodeValue = node.getAttribute('value');
            var value = nodeValue === null ? node.checked : node.checked ? nodeValue : undefined;
            return _this10.guard(function () {
              return this.publish(key, value, { sync: true });
            });
          };
          return this.htmlSubs.push(this.subscribe(key, function (value) {
            nodeValue = node.getAttribute('value');
            if (nodeValue != null) {
              return node.checked = value === nodeValue;
            } else {
              return node.checked = value === true;
            }
          }));
        }
      }

      /*
       * subscribes to a key and fills its value as html content
       * Example:
       * <input type="text" data-value="key" />
       * <input type="text" value="Online" data-value="key" />
       */

    }, {
      key: 'data_value',
      value: function data_value(node, key) {
        var _this11 = this;

        if (_.isValidModelConstKey(key)) {
          key = consts(key);
        }
        var nodeGuard = Math.random();
        if (node.value) {
          this.guard(function () {
            return this.publish(key, node.value, { sync: true });
          }, nodeGuard);
        }

        node.onchange = function () {
          return _this11.guard(function () {
            return this.guard(function () {
              return this.publish(key, node.value, { sync: true });
            });
          }, nodeGuard);
        };

        return this.htmlSubs.push(this.subscribe(key, function (value) {
          return _this11.guard(function () {
            return node.value = value;
          }, nodeGuard);
        }));
      }
    }, {
      key: '_register_event_with_rawExpr',
      value: function _register_event_with_rawExpr(name, node, rawExpr) {
        var _this12 = this;

        var _resolveEventRawExpr = this.resolveEventRawExpr(rawExpr),
            callback = _resolveEventRawExpr.callback;

        _.addEventListener(node, name, function (e) {
          return callback.call(_this12, e, e.currentTarget);
        });
        return callback;
      }

      /*
       * Example: data-click='@key("value")'
       *          data-click='this.publish("key", "value")'
       *          data-click='@key("value"); event.preventDefault();'
       */

    }, {
      key: 'data_click',
      value: function data_click(node, rawExpr) {
        return this._register_event_with_rawExpr('click', node, rawExpr);
      }

      /*
       * Example: data-mouseover='@key("value")'
       *          data-mouseover='this.publish("key", "value")'
       *          data-mouseover='@key("value"); event.preventDefault();'
       */

    }, {
      key: 'data_mouseover',
      value: function data_mouseover(node, rawExpr) {
        return this._register_event_with_rawExpr('mouseover', node, rawExpr);
      }
    }, {
      key: 'data_mouseout',
      value: function data_mouseout(node, rawExpr) {
        return this._register_event_with_rawExpr('mouseout', node, rawExpr);
      }
    }, {
      key: 'data_focus',
      value: function data_focus(node, rawExpr) {
        return this._register_event_with_rawExpr('focus', node, rawExpr);
      }
    }, {
      key: 'data_blur',
      value: function data_blur(node, rawExpr) {
        return this._register_event_with_rawExpr('blur', node, rawExpr);
      }

      /*
       * trigger
       * Example: data-trigger='.l.go_to_top'
       *          data-trigger='EVT_SEARCH_PAGE'
       */

    }, {
      key: 'data_trigger',
      value: function data_trigger(node, key) {
        var _this13 = this;

        if (_.isValidModelConstKey(key)) {
          key = consts(key);
        }
        return _.addEventListener(node, 'click', function () {
          return _this13.publish(key, null);
        });
      }

      /*
       * call member or global method on click
       * advantage is you will get event as argument
       * Example: data-method='handleSave' => data-click='this.handleSave(event)'
       *          data-method='handleCancel'
       */

    }, {
      key: 'data_method',
      value: function data_method(node, method) {
        var _this14 = this;

        return _.addEventListener(node, 'click', function (event) {
          if (!event.defaultPrevented) {
            return (_this14[method] || window[method])(event);
          }
        });
      }
    }, {
      key: 'data_toggle',
      value: function data_toggle(node, rawArgs) {
        var _this15 = this;

        var opts = void 0;
        var keys = [];
        var data = Widget.prototype._toggleData[rawArgs];
        if (data == null) {
          var pipedArgs = _.resolvePipedExpression(rawArgs);
          var config = pipedArgs.shift() || '';
          config = _.explodeAndMap(config, ';', ':', { trim: true });
          if (pipedArgs[0]) {
            opts = _.resolveNiceJSON(pipedArgs[0]);
          }
          data = { keyValues: config, opts: opts };
          Widget.prototype._toggleData[rawArgs] = data;
        }

        _.each(data.keyValues, function (value, key) {
          keys.push(key);
          if (value != null) {
            return this.guard(function () {
              return this.publish(key, value === 'true', { sync: true });
            });
          }
        }, this);

        var callback = function callback(key) {
          return _this15.guard(function () {
            return this.publish(key, !this.get(key), { sync: true });
          });
        };
        if (data.opts) {
          callback = _.applyCallbackOptions(callback, data.opts);
        }

        return _.addEventListener(node, 'click', function (event) {
          return _.each(keys, function (key) {
            if (!event.defaultPrevented) {
              return callback(key);
            }
          });
        });
      }

      /*
       * Toggle model variable on click
       * Example: data-toggleclass='rh-hide'
       *          data-toggleclass='open'
       *          <div class="open" data-toggleclass='open,closed'>
       */

    }, {
      key: 'data_toggleclass',
      value: function data_toggleclass(node, classNames) {
        var newClasses = _.splitAndTrim(classNames, ',');
        return _.addEventListener(node, 'click', function (event) {
          if (!event.defaultPrevented) {
            node = event.currentTarget;
            return _.each(newClasses, function (className) {
              if ($.hasClass(node, className)) {
                return $.removeClass(node, className);
              } else {
                return $.addClass(node, className);
              }
            });
          }
        });
      }

      /*
       * Example: data-change='@key("value")'
       *          data-change='this.publish("key", "value")'
       */

    }, {
      key: 'data_change',
      value: function data_change(node, rawExpr) {
        var _this16 = this;

        var data = this._data_event_callback(rawExpr);
        var callback = _.applyCallbackOptions(data.callback, data.opts);
        return node.onchange = function (event) {
          return callback.call(_this16, event, event.currentTarget);
        };
      }

      /*
       * Example: data-keydown='@text(node.value); | keyCode: 13'
       *          data-keydown='event.keyCode == 13 && @text(node.value)'
       *          data-keydown='this.publish("key", "myvalue");'
       *          data-keydownoptions='debounce:300'
       */

    }, {
      key: 'data_keydown',
      value: function data_keydown(node, rawExpr) {
        var _this17 = this;

        var data = this._data_event_callback(rawExpr);
        var callback = _.applyCallbackOptions(data.callback, data.opts);
        var keyCode = data.opts && data.opts.keyCode;

        return node.onkeydown = function (event) {
          if (!keyCode || keyCode === event.keyCode) {
            return callback.call(_this17, event, event.currentTarget);
          }
        };
      }

      /*
       * Example: data-keyup='if(key == 13)@text(node.value);'
       *          data-keyup='@text(node.value) | keyCode: 13'
       *          data-keyup='this.publish("key", "myvalue") | debounce:300'
       */

    }, {
      key: 'data_keyup',
      value: function data_keyup(node, rawExpr) {
        var _this18 = this;

        var data = this._data_event_callback(rawExpr);
        var callback = _.applyCallbackOptions(data.callback, data.opts);
        var keyCode = data.opts && data.opts.keyCode;

        return node.onkeyup = function (event) {
          if (!keyCode || keyCode === event.keyCode) {
            return callback.call(_this18, event, event.currentTarget);
          }
        };
      }

      /*
       * Example: data-scroll='@text(node.value) | debounce:300'
       *          data-scroll='this.publish("key", "myvalue")'
       */

    }, {
      key: 'data_scroll',
      value: function data_scroll(node, rawExpr) {
        var _this19 = this;

        var data = this._data_event_callback(rawExpr);
        var opts = data.opts;

        var delta = opts && opts.delta || 100;
        var callback = function callback(event) {
          var rect = node.getBoundingClientRect();
          if (node.scrollTop > node.scrollHeight - (rect.height + delta)) {
            return data.callback.call(_this19, event, node);
          }
        };

        if (opts) {
          callback = _.applyCallbackOptions(callback, opts);
        }
        return _.addEventListener(node, 'scroll', callback);
      }
    }, {
      key: 'data_load',
      value: function data_load(node, value) {
        var _this20 = this;

        var pair = value.split(':');
        var jsPath = pair[0];
        var key = pair[1];
        if (!Widget.prototype._loadData[jsPath]) {
          return _.addEventListener(node, 'click', function (event) {
            if (!Widget.prototype._loadData[jsPath]) {
              Widget.prototype._loadData[jsPath] = true;
              if (key) {
                $.addClass(node, 'loading');
                var unsub = _this20.subscribeOnly(key, function () {
                  $.removeClass(node, 'loading');
                  return unsub();
                });
              }
              return _.loadScript(jsPath);
            }
          });
        }
      }
    }, {
      key: 'data_controller',
      value: function data_controller(node, value) {
        if (this.user_vars == null) {
          this.user_vars = {};
        }
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = Array.from(_.splitAndTrim(value, ';'))[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var data = _step8.value;

            var ctrlClass, opts;
            var pair = _.resolvePipedExpression(data);
            if (pair[1]) {
              opts = _.resolveNiceJSON(pair[1]);
            }
            pair = _.splitAndTrim(pair[0], ':');
            if (pair.length === 0) {
              pair = _.splitAndTrim(pair[0], ' as ');
            }
            if (pair[0] != null) {
              ctrlClass = rh.controller(pair[0]);
            }
            var ctrlName = pair[1];
            if (ctrlClass && !this.user_vars[ctrlName]) {
              var controller = new ctrlClass(this, opts);
              if (ctrlName) {
                this.user_vars[ctrlName] = controller;
              }
            } else if (rh._debug && !ctrlClass) {
              rh._d('error', 'Controller ' + ctrlClass + ' not found');
            }
          }
        } catch (err) {
          _didIteratorError8 = true;
          _iteratorError8 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
              _iterator8.return();
            }
          } finally {
            if (_didIteratorError8) {
              throw _iteratorError8;
            }
          }
        }
      }
    }, {
      key: 'data_screenvar',
      value: function data_screenvar(node, value) {
        var sVars = _.splitAndTrim(value, ',');
        var current_screen = _.findIndex(this.get(consts('KEY_SCREEN')), function (v, k) {
          return v.attached;
        });
        var cache = {};
        cache[current_screen] = {};

        var screenKeys = this.get(consts('KEY_SCREEN'));
        return _.each(_.keys(screenKeys), function (key) {
          var _this21 = this;

          return this.subscribeOnly(consts('KEY_SCREEN') + '.' + key + '.attached', function (attached) {
            var name = void 0;
            if (!attached) {
              return;
            }
            _.each(sVars, function (sVar) {
              cache[current_screen][sVar] = this.get(sVar);
              if (cache[key] != null) {
                return this.publish(sVar, cache[key][sVar]);
              }
            }, _this21);
            return cache[name = current_screen = key] != null ? cache[name] : cache[name] = {};
          });
        }, this);
      }
    }]);

    return Widget;
  }(rh.Guard);
  Widget.initClass();
  return Widget;
}();

//######################### Utility methods #########################

rh.widgets = {};
rh.Widget = Widget;
rh.widgets.Basic = Widget;

function __guard__(value, transform) {
  return typeof value !== 'undefined' && value !== null ? transform(value) : undefined;
}

},{}],20:[function(require,module,exports){
"use strict";

var _window = window,
    rh = _window.rh;


rh.registerDataAttr = function (attrName, DataAttrHandler, Widget) {
  if (Widget == null) {
    Widget = rh.Widget;
  }
  var methodName = "data_" + attrName;
  Widget.prototype.dataAttrMethods["data-" + attrName] = methodName;
  Widget.prototype.dataAttrs.push(attrName);
  return Widget.prototype[methodName] = function (node, attrValue) {
    return new DataAttrHandler(this, node, attrValue);
  };
};

},{}],21:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;
var consts = rh.consts;

var Resize = function () {
  function Resize(widget, node, rawExpr) {
    _classCallCheck(this, Resize);

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.widget = widget;
    this.node = node;

    var _widget$resolveRawExp = this.widget.resolveRawExprWithValue(rawExpr),
        callback = _widget$resolveRawExp.callback,
        opts = _widget$resolveRawExp.opts;

    this.opts = opts;
    this.callback = function () {
      return callback.call(this.widget);
    };

    if (opts.maxx == null) {
      opts.maxx = 1;
    }
    if (opts.minx == null) {
      opts.minx = 0;
    }
    if (opts.maxy == null) {
      opts.maxy = 1;
    }
    if (opts.miny == null) {
      opts.miny = 0;
    }
    this.resize = false;

    _.initMouseMove();
    _.addEventListener(this.node, 'mousedown', this.handleMouseDown);
    this.widget.subscribe(consts('EVT_MOUSEMOVE'), this.handleMouseMove);
  }

  _createClass(Resize, [{
    key: 'handleMouseDown',
    value: function handleMouseDown(evt) {
      if (evt.which !== 1) {
        return;
      }
      this.resize = evt.target === this.node && !evt.defaultPrevented;
      if (this.resize) {
        var result = this.callback();
        return this.resize = result !== false && result !== null;
      }
    }
  }, {
    key: 'handleMouseMove',
    value: function handleMouseMove(obj) {
      if (obj.defaultPrevented) {
        this.resize = false;
      }
      if (!this.resize) {
        return;
      }

      obj.defaultPrevented = true;
      if (obj.which === 1) {
        return this.publish(obj);
      } else {
        return this.resize = false;
      }
    }
  }, {
    key: 'getBaseWidth',
    value: function getBaseWidth() {
      return this.opts.basex || document.body.offsetWidth;
    }
  }, {
    key: 'getBaseHeight',
    value: function getBaseHeight() {
      return this.opts.basey || document.body.offsetHeight;
    }
  }, {
    key: 'publish',
    value: function publish(obj) {
      var base = this.getBaseWidth();
      var rtl = 'rtl' === this.widget.get(consts('KEY_DIR'));
      var newValue = rtl ? base - obj.x : obj.x;
      if (!this.publishPos(base, this.opts.minx, this.opts.maxx, this.opts.x, newValue)) {
        base = this.getBaseHeight();
        newValue = rtl ? base - obj.y : obj.y;
        return this.publishPos(base, this.opts.miny, this.opts.maxy, this.opts.y, newValue);
      }
    }
  }, {
    key: 'publishPos',
    value: function publishPos(base, min, max, key, newValue) {
      if (key != null && newValue != null) {
        var oldValue = this.widget.get(key);
        if (oldValue !== newValue) {
          if (max * base < newValue) {
            newValue = max * base;
          } else if (min * base > newValue) {
            newValue = min * base;
          }
          this.widget.publish(key, newValue + 'px');
          this.callback();
          return true;
        }
      }
    }
  }]);

  return Resize;
}();

rh.registerDataAttr('resize', Resize);

},{}],22:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;

var Table = function () {
  function Table(widget, node, key) {
    _classCallCheck(this, Table);

    this.widget = widget;
    this.node = node;
    this.widget.publish(key, this.extractRowColumnMatrix(this.node));
  }

  _createClass(Table, [{
    key: 'extractRowColumnMatrix',
    value: function extractRowColumnMatrix(node) {
      var rowColMatrix = [];
      var rowElements = [];
      this.widget.traverseNode(node, function (node) {
        if ('TD' === $.nodeName(node)) {
          rowElements.push($.innerHTML(node));
          return false;
        } else if ('TR' === $.nodeName(node)) {
          if (rowElements.length !== 0) {
            rowColMatrix.push(rowElements);
          }
          rowElements = [];
        }
        return true;
      });
      if (rowElements.length !== 0) {
        rowColMatrix.push(rowElements);
      }
      return rowColMatrix;
    }
  }]);

  return Table;
}();

rh.registerDataAttr('table', Table);

},{}],23:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;

var TableNestedData = function (_rh$Widget) {
  _inherits(TableNestedData, _rh$Widget);

  function TableNestedData(opts) {
    _classCallCheck(this, TableNestedData);

    var _this = _possibleConstructorReturn(this, (TableNestedData.__proto__ || Object.getPrototypeOf(TableNestedData)).call(this, opts));

    _this.rowColMatrix = _this.extractRowColumnMatrix(_this.node);
    return _this;
  }

  _createClass(TableNestedData, [{
    key: 'extractRowColumnMatrix',
    value: function extractRowColumnMatrix(node) {
      var rowColMatrix = [];
      var rowElements = [];
      this.traverseNode(node, function (node) {
        if ('TD' === $.nodeName(node)) {
          if (this.hasOnlyTable(node)) {
            var childMatrix = this.extractRowColumnMatrix(node.children[0]);
            if (childMatrix.length !== 0) {
              rowElements.push({ child: childMatrix });
            }
          } else {
            rowElements.push({ html: $.innerHTML(node) });
          }
          return false;
        } else if ('TR' === $.nodeName(node)) {
          if (rowElements.length !== 0) {
            rowColMatrix.push(rowElements);
          }
          rowElements = [];
        }
        return true;
      });
      if (rowElements.length !== 0) {
        rowColMatrix.push(rowElements);
      }
      return rowColMatrix;
    }
  }, {
    key: 'hasOnlyTable',
    value: function hasOnlyTable(node) {
      return (node.children != null ? node.children.length : undefined) === 1 && 'TABLE' === $.nodeName(node.children[0]);
    }
  }]);

  return TableNestedData;
}(rh.Widget);

//rh.registerDataAttr 'tabler', TableNestedData


window.rh.widgets.TableNestedData = TableNestedData;

},{}],24:[function(require,module,exports){
"use strict";

//JavaScript handler.
var rh = require("../../src/lib/rh");

rh.IndigoSetSidebar = function () {
	var sideBarToSet = rh.model.get(rh.consts('SIDEBAR_STATE'));

	var body = document.getElementsByTagName("body")[0];
	var toc = document.getElementById("toc-holder");
	var idx = document.getElementById("idx-holder");
	var glo = document.getElementById("glo-holder");
	var fts = document.getElementById("fts-holder");
	var filter = document.getElementById("filter-holder");
	var fav = document.getElementById("favorites-holder");
	var mobileMenu = document.getElementById("mobile-menu-holder");

	var visibleClass = "layout-visible";

	var setVisible = function setVisible(elem) {
		if (typeof elem != "undefined" && elem != null) {
			elem.classList.add(visibleClass);

			//Keyboard focus on first link element in the popup-visible. This allows better keyboard access.
			var input = elem.getElementsByTagName("input")[0];
			if (typeof input != "undefined" && rh.model.get(rh.consts('KEY_SCREEN_DESKTOP'))) {
				if (input.classList.contains("wSearchField")) {
					rh.model.cpublish('EVT_CLOSE_SEARCH_SUGGESTION', true);
					setTimeout(function () {
						input.focus();
					}, 300);
				} else {
					input.focus();
				}
			} else if (rh.model.get(rh.consts('KEY_SCREEN_DESKTOP'))) {
				var list = elem.getElementsByTagName("li");

				if (typeof list[0] != "undefined") {
					list[0].focus();
				} else {

					var links = elem.getElementsByTagName("a");
					if (typeof links[1] != "undefined") {
						links[1].focus();
					} else if (typeof links[0] != "undefined") {
						links[0].focus();
					}
				}
			}
		}
	};
	var setHidden = function setHidden(elem) {
		if (typeof elem != "undefined" && elem != null) {
			elem.classList.remove(visibleClass);
		}
	};

	var menuDelay = "has-delay";
	var menuImmediate = "no-transform";

	var showOtherMenu = function showOtherMenu() {
		mobileMenu.classList.add(menuDelay);

		setTimeout(function () {
			mobileMenu.classList.remove(menuDelay);
			mobileMenu.classList.add(menuImmediate);
		}, 750);
	};

	var hideOtherMenu = function hideOtherMenu() {
		setTimeout(function () {
			mobileMenu.classList.remove(menuImmediate);
		}, 750);
	};

	body.classList.add("popup-visible");

	switch (sideBarToSet) {
		case "toc":
			showOtherMenu();
			setVisible(toc);
			setHidden(idx);
			setHidden(glo);
			setHidden(fts);
			setHidden(filter);
			setHidden(fav);
			setHidden(mobileMenu);
			break;
		case "idx":
			showOtherMenu();
			setVisible(idx);
			setHidden(toc);
			setHidden(glo);
			setHidden(fts);
			setHidden(filter);
			setHidden(fav);
			setHidden(mobileMenu);
			break;
		case "glo":
			showOtherMenu();
			setVisible(glo);
			setHidden(idx);
			setHidden(toc);
			setHidden(fts);
			setHidden(filter);
			setHidden(fav);
			setHidden(mobileMenu);
			break;
		case "fts":
			showOtherMenu();
			setVisible(fts);
			setHidden(idx);
			setHidden(glo);
			setHidden(toc);
			setHidden(filter);
			setHidden(fav);
			setHidden(mobileMenu);
			break;
		case "filter":
			showOtherMenu();
			setVisible(filter);
			setHidden(idx);
			setHidden(glo);
			setHidden(fts);
			setHidden(toc);
			setHidden(fav);
			setHidden(mobileMenu);
			break;
		case "favorites":
			showOtherMenu();
			setVisible(fav);
			setHidden(idx);
			setHidden(glo);
			setHidden(fts);
			setHidden(toc);
			setHidden(filter);
			setHidden(mobileMenu);
			break;
		case "menu":
			setVisible(mobileMenu);
			hideOtherMenu();
			setHidden(idx);
			setHidden(glo);
			setHidden(fts);
			setHidden(toc);
			setHidden(fav);
			setHidden(filter);
			break;
		default:
			//Nothing. Show topic
			setHidden(idx);
			setHidden(glo);
			setHidden(fts);
			setHidden(toc);
			setHidden(filter);
			setHidden(fav);
			setHidden(mobileMenu);
			hideOtherMenu();
			body.classList.remove("popup-visible");
			if (rh.model.get(rh.consts('KEY_SCREEN_DESKTOP'))) {
				rh.IndigoSetFocusOnSearch();
			}
	}
};
rh.IndigoSetFocusOnSearch = function () {
	var input = document.getElementsByTagName("input");
	for (var i = 0; i < input.length; i++) {
		if (input[i].classList.contains("wSearchField")) {
			rh.model.cpublish('EVT_CLOSE_SEARCH_SUGGESTION', true);
			setTimeout(function () {
				input[i].focus();
			}, 300);
			break;
		}
	}
};
rh.IndigoSetSidebarSearch = function () {
	rh.model.publish(rh.consts("SIDEBAR_STATE"), "fts");
};
rh.IndigoSetTransitionAllow = function () {
	var body = document.getElementsByTagName("body")[0];

	var allowPhone = "allow-phone-transitions";
	var allowTablet = "allow-tablet-transitions";
	var allowDesktop = "allow-desktop-transitions";

	body.classList.remove(allowPhone);
	body.classList.remove(allowTablet);
	body.classList.remove(allowDesktop);

	var toSet = false;
	if (rh.model.get(rh.consts('KEY_SCREEN_PHONE')) == true) {
		toSet = allowPhone;
	} else if (rh.model.get(rh.consts('KEY_SCREEN_TABLET')) == true) {
		toSet = allowTablet;
	} else if (rh.model.get(rh.consts('KEY_SCREEN_DESKTOP')) == true) {
		toSet = allowDesktop;
	}

	setTimeout(function () {

		body.classList.remove(allowPhone); //Always make sure there is only 1
		body.classList.remove(allowTablet);
		body.classList.remove(allowDesktop);

		body.classList.add(toSet);
	}, 10);
};

rh.initIndigo = function () {

	rh.model.subscribe(rh.consts("SIDEBAR_STATE"), rh.IndigoSetSidebar);
	rh.model.subscribe(rh.consts("EVT_SEARCH_IN_PROGRESS"), rh.IndigoSetSidebarSearch);
	rh.model.subscribe(rh.consts("KEY_SCREEN"), rh.IndigoSetTransitionAllow);

	//When opening the page, check whether there is a highlight term.
	//If found, add it to the search box
	setTimeout(function () {
		var highlight = getUrlParameter(RHHIGHLIGHTTERM);
		if (highlight != "") {
			var input = document.getElementsByTagName("input");
			for (var i = 0; i < input.length; i++) {
				if (input[i].classList.contains("wSearchField")) {
					input[i].value = highlight;
					break;
				}
			}
			rh.model.publish(rh.consts('KEY_SEARCH_TERM'), highlight);
		}
	}, 250);

	//For Keyboard accessibility, get the ESC key to close overlays
	document.onkeydown = function (evt) {
		evt = evt || window.event;
		if (evt.keyCode == 27) {
			rh.model.publish(rh.consts('SIDEBAR_STATE'), false);
			rh.IndigoSetFocusOnSearch(); //Focus on the search for keyboard accessibility
		}
	};
};

},{"../../src/lib/rh":40}],25:[function(require,module,exports){
'use strict';

var _ = window.rh._;


_.stackTrace = function () {
  var err = new Error();
  return err.stack;
};

_.safeExec = function (fn) {
  return function () {
    try {
      return fn.apply(this, arguments);
    } catch (error) {
      if (rh._debug) {
        rh._d('error', 'Function: ' + fn, error.message);
      }
      return undefined;
    }
  };
};

},{}],26:[function(require,module,exports){
'use strict';

var _ = window.rh._;


_.addEventListener = function (obj, eventName, callback) {
  if (obj == null) {
    obj = window;
  }
  if (obj.addEventListener != null) {
    return obj.addEventListener(eventName, callback, false);
  } else if (obj.attachEvent != null) {
    return obj.attachEvent('on' + eventName, callback);
  }
};

_.removeEventListener = function (obj, eventName, callback) {
  if (obj == null) {
    obj = window;
  }
  if (obj.removeEventListener != null) {
    return obj.removeEventListener(eventName, callback, false);
  } else if (obj.detachEvent != null) {
    return obj.detachEvent('on' + eventName, callback);
  }
};

_.isTouchEnabled = function () {
  return 'ontouchstart' in document.documentElement;
};

_.preventDefault = function (e) {
  if (e.preventDefault != null) {
    return e.preventDefault();
  } else {
    return e.returnValue = false;
  }
};

_.mouseButton = function (e) {
  if ('buttons' in e) {
    return e.buttons;
  } else if ('which' in e) {
    return e.which;
  } else {
    return e.button;
  }
};

_.initMouseMove = function () {
  var initDone = false;
  return function () {
    if (!initDone) {
      initDone = true;
      return _.addEventListener(document, 'mousemove', function (e) {
        if (!e.defaultPrevented) {
          var obj = { x: e.clientX, y: e.clientY, which: _.mouseButton(e) };
          rh.model.publish(rh.consts('EVT_MOUSEMOVE'), obj, { sync: true });
          if (obj.defaultPrevented) {
            return _.preventDefault(e);
          }
        }
      });
    }
  };
}();

_.initTouchEvent = function () {
  var initDone = false;
  return function () {
    if (!initDone && _.isTouchEnabled()) {
      var x = void 0,
          y = void 0,
          y1 = void 0;
      initDone = true;
      var x1 = y1 = x = y = 0;

      var calculateDirection = _.debounce(function () {
        var direction = void 0;
        var angle = Math.atan((y1 - y) / (x1 - x));
        if (x1 > x) {
          direction = angle > Math.PI / 4 ? 'down' : angle < -Math.PI / 4 ? 'up' : 'right';
        } else {
          direction = angle > Math.PI / 4 ? 'up' : angle < -Math.PI / 4 ? 'down' : 'left';
        }
        rh.model.publish('.touchmove', { x: x, y: y, x1: x1, y1: y1 });
        rh.model.publish(rh.consts('EVT_SWIPE_DIR'), direction, { sync: true });
        rh.model.publish(rh.consts('EVT_SWIPE_DIR'), null);
        return x = y = 0;
      }, 200);

      return _.addEventListener(document, 'touchmove', function (e) {
        x1 = (e.touches[0] != null ? e.touches[0].pageX : undefined) || 0;
        y1 = (e.touches[0] != null ? e.touches[0].pageY : undefined) || 0;
        if (x === 0 && y === 0) {
          x = x1;
          y = y1;
        }

        calculateDirection();
        return _.preventDefault(e);
      });
    }
  };
}();

},{}],27:[function(require,module,exports){
'use strict';

var _ = window.rh._;

// Regular Expressions

// Ex: @key('wow') => this.publish('key', 'wow');

var publishRegx = /(^|[^\\])@([\w\.]*)\((.*)\)/;

// Ex: x = @key => x = this.get('key');
var getRegx = /(^|[^\\])@([\w\.]*)/;

// Ex: x = @KEY => x = rh.consts('KEY')
var modelConstsRegx = /@([A-Z][_A-Z0-9]*)/;

_.resolvePublish = function (expression) {
  var regex = new RegExp(publishRegx);
  while (true) {
    var match = regex.exec(expression);
    if (!match) {
      break;
    }
    expression = expression.replace(match[0], match[1] + ' this.publish(\'' + match[2] + '\', ' + match[3] + ')');
  }
  return expression;
};

_.resolveGet = function (expression, keys) {
  var regex = new RegExp(getRegx);
  while (true) {
    var match = regex.exec(expression);
    if (!match) {
      break;
    }
    if (keys && -1 === keys.indexOf(match[2])) {
      keys.push(match[2]);
    }
    expression = expression.replace(match[0], match[1] + ' this.get(\'' + match[2] + '\')');
  }
  return expression;
};

_.resolveModelConst = function (expression) {
  var subexp = '';
  var regex = new RegExp(modelConstsRegx);
  while (true) {
    var match = regex.exec(expression);
    if (!match) {
      break;
    }
    var key = rh.consts(match[1]);
    if (key != null) {
      expression = expression.replace(match[0], '@' + key);
    } else {
      var index = match.index + match[1].length + 1;
      subexp += expression.substring(0, index);
      expression = expression.substring(index);
    }
  }
  return subexp + expression;
};

_.resolveModelKeys = function (expression, keys) {
  return this.resolveGet(this.resolvePublish(this.resolveModelConst(expression)), keys);
};

_.isValidModelKey = function (key) {
  if (key === 'true' || key === 'false') {
    return false;
  }
  var match = key.match(/[._a-zA-Z][._a-zA-Z0-9 ]*/);
  return match && match[0] === key;
};

_.isValidModelConstKey = function (key) {
  var match = key.match(/[A-Z][_A-Z0-9]*/);
  return match && match[0] === key;
};

_.get = function (obj, itemKey) {
  var value = void 0;
  var keys = itemKey.split('.');
  for (var index = 0; index < keys.length; index++) {
    var key = keys[index];
    if (index === 0) {
      value = obj[key];
    } else if (value) {
      value = value[key];
    } else {
      break;
    }
  }
  return value;
};

_.isScreenAttached = function (scrrenName) {
  return true === rh.model.get(rh.consts('KEY_SCREEN') + '.' + scrrenName + '.attached');
};

_.parentKey = function (fullKey) {
  var keys = fullKey.split('.');
  keys.pop();
  return keys.join('.');
};

_.lastKey = function (fullKey) {
  var keys = fullKey.split('.');
  return keys[keys.length - 1];
};

_.splitKey = function (fullKey) {
  var keys = fullKey.split('.');
  var key = keys.pop();
  var parentKey = keys.join('.');
  return { key: key, parentKey: parentKey };
};

},{}],28:[function(require,module,exports){
'use strict';

var _ = window.rh._;

//Regular Expressions

//Ex: "abc #{var1}"

var enclosedVarRegx = /\#{([^}]*)\}/g;
var userVarRegx = /\$([_a-zA-Z][_a-zA-Z0-9]*)/g;
var regxStringRegx = /\B\/([^\/]*)\//g;

_.toRegExp = function (str) {
  var regx = void 0;
  if (!str || !_.isString(str)) {
    return str;
  }
  var matches = str.match(regxStringRegx);
  var match = matches && matches[0];
  if (match) {
    var pattern = match.substring(1, match.length - 1);
    var flag = str.substring(match.length);
    regx = new RegExp(pattern, flag);
  }
  return regx || str;
};

_.splitAndTrim = function (string, splitKey) {
  if (string == null) {
    string = '';
  }
  return _.map(string.split(splitKey), function (value) {
    return value.trim();
  });
};

/*
 * Explodes a string based on explodeKey then
 * creates a map using the exploded strings by splitting them further on mapKey
 */
_.explodeAndMap = function (string, explodeKey, mapKey, opts) {
  if (string == null) {
    string = ' ';
  }
  if (opts == null) {
    opts = {};
  }
  var pairs = string.split(explodeKey);
  var regex = new RegExp(mapKey + '(.+)?');
  var map = {};

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Array.from(pairs)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var rawPair = _step.value;

      var pair = rawPair.split(regex);
      var key = pair[0].trim();
      var value = pair[1];

      if (opts.caseInsensitive) {
        key = key.toLowerCase();
      }
      if (opts.trim) {
        value = value && value.trim();
      }
      if (opts.default != null && value == null) {
        value = opts.default;
      }

      if (key !== '') {
        map[key] = value;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return map;
};

_.resolveNamedVar = function (expr) {
  var matches = void 0;
  if (matches = expr.match(userVarRegx)) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = Array.from(matches)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var match = _step2.value;

        expr = expr.replace(match, 'this.user_vars.' + match.substring(1));
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  }
  return expr;
};

_.resolveEnclosedVar = function (expr, callback, context) {
  var matches = void 0;
  if (context == null) {
    context = this;
  }
  if (matches = expr.match(enclosedVarRegx)) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = Array.from(matches)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var match = _step3.value;

        var name = match.substring(2, match.length - 1).trim();
        var value = callback.call(context, name);
        expr = expr.replace(match, value != null ? value : '');
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }
  }
  return expr;
};

// use '.' as attrib name to pass opts for attrs data
_.resolveAttr = function (string) {
  return _.reduce(_.explodeAndMap(string, ';', ':'), function (r, v, k) {
    _.each(k.split(','), function (key) {
      return r[key.trim()] = v;
    });
    return r;
  }, {});
};

_.resolveNiceJSON = function (string) {
  if (string == null) {
    string = '';
  }
  string = string.trim();
  if (!string) {
    return {};
  }
  if (string[0] === '{') {
    return JSON.parse(string);
  } else {
    string = string.replace(/'/g, '"');
    string = '{' + string + '}';
    return JSON.parse(string.replace(/(\{|,)\s*(.+?)\s*:/g, '$1 "$2":'));
  }
};

_.resolvePipedExpression = function (string) {
  if (string == null) {
    string = '';
  }
  var concatNext = false;
  return _.reduce(string.split('|'), function (result, item) {
    var mergedItem = void 0;
    if (concatNext && result.length > 0) {
      mergedItem = result[result.length - 1] + ' ||' + item;
      result.length = result.length - 1;
    }

    concatNext = item.length === 0;
    if (mergedItem) {
      item = mergedItem;
    }

    if (item.length !== 0) {
      result.push(item.trim());
    }
    return result;
  }, []);
};

_.resolveLoopExpr = function (config) {
  var value = config.split(':');
  if (value.length > 1) {
    var vars = _.splitAndTrim(value.shift(), ',');
    return { expr: value[0], index: vars[0], item: vars[1] };
  } else {
    return { expr: value[0] };
  }
};

_.resolveWidgetArgs = function (rawArgs) {
  var pairs = rawArgs.split(';');
  return _.map(pairs, function (pair) {
    var wArg = void 0;
    var pipedArgs = _.resolvePipedExpression(pair);
    var args = pipedArgs.shift() || '';
    args = args.split(/:(.+)?/);
    var wName = args[0].trim();
    var rawArg = pair.substring(wName.length).trim();
    if (rawArg[0] === ':') {
      rawArg = rawArg.substring(1);
    }
    if (wArg = args[1]) {
      if (-1 !== wArg.search(':')) {
        wArg = _.explodeAndMap(wArg, ',', ':', { trim: true });
      } else {
        wArg = { arg: wArg };
      }
    }
    return { wName: wName, wArg: wArg, pipedArgs: pipedArgs, rawArg: rawArg };
  });
};

_.resolveExprOptions = function (rawArgs) {
  var opts = void 0;
  var values = _.resolvePipedExpression(rawArgs);
  if (values[1]) {
    opts = _.resolveNiceJSON(values[1]);
  }
  return { expr: values[0], opts: opts };
};

_.resolveInputKeys = function (rawArgs) {
  var opts = void 0;
  var values = _.resolvePipedExpression(rawArgs);
  if (values[1]) {
    opts = _.resolveNiceJSON(values[1]);
  }
  var keys = _.explodeAndMap(values[0], ',', ':', { trim: true });
  return { keys: keys, opts: opts };
};

_.applyCallbackOptions = function (callback, opts) {
  var newCallback = callback;
  if (opts && opts.debounce) {
    newCallback = _.debounce(newCallback, opts.debounce);
  }

  if (opts && opts.toggleTimeout) {
    newCallback = _.toggleTimeout(newCallback, opts.toggleTimeout);
  }

  if (opts && opts.timeout) {
    newCallback = _.timeout(newCallback, opts.timeout);
  }

  if (opts && opts.defer) {
    newCallback = _.timeout(newCallback, 1);
  }

  return newCallback;
};

_.parseInt = function (string, defaultValue, base) {
  if (base == null) {
    base = 10;
  }
  if (string != null && string !== '') {
    return parseInt(string, base);
  } else if (defaultValue != null) {
    return defaultValue;
  } else {
    return string;
  }
};

},{}],29:[function(require,module,exports){
'use strict';

var _ = window.rh._;


_.hasNonAsciiChar = function (str) {
  if (str == null) {
    str = '';
  }return _.any(str, function (ch) {
    return ch.charCodeAt(0) > 127;
  });
};

},{}],30:[function(require,module,exports){
'use strict';

var _ = window.rh._;
var consts = window.rh.consts;


_.mapToEncodedString = function (map, explodeKey, mapKey) {
  if (explodeKey == null) {
    explodeKey = '&';
  }
  if (mapKey == null) {
    mapKey = '=';
  }
  return _.reduce(map, function (result, value, key) {
    if (value != null) {
      if (result.length > 0) {
        result += explodeKey;
      }
      result += '' + key + mapKey + encodeURIComponent(value);
    }
    return result;
  }, '');
};

_.encodedStringToMap = function (string, explodeKey, mapKey) {
  if (explodeKey == null) {
    explodeKey = '&';
  }
  if (mapKey == null) {
    mapKey = '=';
  }
  var map = _.explodeAndMap(string, explodeKey, mapKey, { default: '' });
  _.each(map, function (value, key) {
    return map[key] = decodeURIComponent(value);
  });
  return map;
};

_.urlParams = function (query) {
  if (query == null) {
    query = location.search.substring(1);
  }
  return _.encodedStringToMap(query);
};

_.urlParam = function (key, query) {
  if (query == null) {
    query = location.search.substring(1);
  }
  return key && _.urlParams(query)[key];
};

_.hashParams = function (hash) {
  if (hash == null) {
    hash = location.hash.substring(1);
  }
  return _.encodedStringToMap(hash);
};

_.hashParam = function (key) {
  return key && _.hashParams()[key];
};

_.updateHashMap = function (changeMap, addToHistory) {
  var newMap = _.extend({}, _.hashParams(), changeMap);
  var hash = _.mapToEncodedString(newMap);
  if (hash.length > 0) {
    hash = '#' + hash;
  }

  if (addToHistory) {
    return location.hash = hash;
  } else if (hash !== '' && location.hash !== hash) {
    return location.replace(hash);
  }
};

_.queueUpdateHashMap = function (hashMap, addToHistory) {
  return _.defer(function () {
    return _.updateHashMap(hashMap, addToHistory);
  });
};

_.stripStringBetween = function (str, startChar, endChar) {
  var newStr = void 0;
  var start = str.indexOf(startChar);
  if (start !== -1) {
    var end = str.indexOf(endChar);
    if (end < start) {
      end = str.length;
    }
    newStr = '' + str.substring(0, start) + str.substring(end, str.length);
  }
  return newStr || str;
};

_.stripParam = function (url) {
  if (url == null) {
    url = document.location.href;
  }
  return _.stripStringBetween(url, '?', '#');
};

_.stripBookmark = function (url) {
  if (url == null) {
    url = document.location.href;
  }
  return _.stripStringBetween(url, '#', '?');
};

_.extractStringBetween = function (str, startChar, endChar) {
  var substring = void 0;
  var start = str.indexOf(startChar);
  if (start !== -1) {
    var end = str.indexOf(endChar);
    if (end < start) {
      end = str.length;
    }
    substring = str.substring(start + 1, end);
  }
  return substring || '';
};

_.extractParamString = function (url) {
  if (url == null) {
    url = document.location.href;
  }
  return _.extractStringBetween(url, '?', '#');
};

_.extractHashString = function (url) {
  if (url == null) {
    url = document.location.href;
  }
  return _.extractStringBetween(url, '#', '?');
};

//#####
// pathTraverseTo(fromPath, toPath)
// Takes in two absolute paths and simulates
// traversal from fromPath to toPath.
// Returns the steps neeed to traverse from
// fromPath to toPath.
//#####
// TODO: Complete this method
_.traverseToPath = function (fromPath, toPath) {
  return '';
};

var processPathUnit = function processPathUnit(fullPath, pathUnit, separator) {
  if (separator == null) {
    separator = '/';
  }
  switch (pathUnit) {
    case '.':
      return fullPath;
    case '..':
      return fullPath.substring(0, fullPath.lastIndexOf(separator));
    default:
      return fullPath + separator + pathUnit;
  }
};

//#####
// pathTraverseBy(fromPath, traverseBy)
// Takes in two path components and simulates
// traversal from fromPath by traverseBy.
// Returns the resulting path after the traversal.
// Eg: 'C:/a/b/c/', '../../' retuns 'C:/a/'
//#####
_.traverseByPath = function (fromPath, traverseBy, separator) {
  if (separator == null) {
    separator = '/';
  }
  fromPath = fromPath.substring(0, fromPath.lastIndexOf(separator));
  var parts = traverseBy.split(separator);

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Array.from(parts)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var part = _step.value;

      if (part.length > 0) {
        fromPath = processPathUnit(fromPath, part, separator);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return fromPath + separator;
};

_.scheme = function (url) {
  var scheme = void 0;
  var index = url.indexOf(':');
  if (index !== -1) {
    scheme = url.substring(0, index + 1).toLowerCase().trim();
  }
  return scheme;
};

_.protocol = function (url) {
  var protocol = void 0;
  var index = url.trim().indexOf(':');
  if (index !== -1) {
    protocol = url.substring(0, index + 1).toLowerCase();
  }
  if (protocol) {
    var match = protocol.match(/^[a-z]+:/);
    if (!match || match[0].length !== protocol.length) {
      protocol = undefined;
    }
  }
  return protocol;
};

_.isInternal = function (urlName) {
  return urlName.indexOf('//') !== 0 && urlName.indexOf('/&#47;') !== 0 && urlName.indexOf('&#47;/') !== 0 && urlName.indexOf('&#47;&#47;') !== 0;
};

_.isJavaScriptUrl = function (url) {
  return 'javascript:' === _.scheme(url);
};

_.isRelativeUrl = function (url) {
  return !_.scheme(url) && url.trim().indexOf('/');
};

_.isValidFileUrl = function (url) {
  if (url[0] === '#') {
    return false;
  }
  var scheme = _.scheme(url);
  return !scheme || ['http:', 'https:', 'ftp:', 'file:'].indexOf(scheme) !== -1;
};

_.makeRelativeUrl = function (absUrl, baseUrl) {
  if (baseUrl == null) {
    baseUrl = decodeURI(document.location.href);
  }
  if (absUrl === baseUrl) {
    return '';
  }
  var absPath = _.filePath(absUrl);
  var basePath = _.filePath(baseUrl);
  var relPath = _.makeRelativePath(absPath, basePath);
  return '' + relPath + absUrl.substring(absPath.length);
};

_.makeRelativePath = function (absUrl, baseUrl) {
  var relUrl = void 0;
  if (baseUrl == null) {
    baseUrl = _.filePath();
  }
  if (absUrl && !_.isRelativeUrl(absUrl) && !_.isRelativeUrl(baseUrl)) {
    var srcParts = absUrl.split('/');
    var baseParts = baseUrl.split('/');
    var idx = 0;
    while (true) {
      if (srcParts.length === idx || baseParts.length === idx) {
        break;
      }
      if (srcParts[idx] !== baseParts[idx]) {
        break;
      }
      idx++;
    }

    var relParts = srcParts.slice(idx);
    relUrl = '';
    var dotdotcount = baseParts.length - idx - 1;
    while (true) {
      if (dotdotcount <= 0) {
        break;
      }
      relUrl += '../';
      dotdotcount--;
    }
    relUrl += relParts.join('/');
  } else {
    relUrl = absUrl;
  }
  return relUrl;
};

_.makeFullUrl = function (relUrl, parentPath) {
  if (parentPath == null) {
    parentPath = rh._.parentPath();
  }
  if (_.isRelativeUrl(relUrl)) {
    return window._getFullPath(parentPath, relUrl);
  } else {
    return relUrl;
  }
};

_.isLocal = function () {
  return window.location.protocol === 'file:';
};

_.isRemote = function () {
  return window.location.protocol !== 'file:';
};

var curOrigin = null;
_.isSameOrigin = function (origin) {
  if (_.isLocal()) {
    return true;
  }
  var _window = window,
      location = _window.location;

  if (curOrigin == null) {
    curOrigin = location.origin;
  }
  if (curOrigin == null) {
    curOrigin = location.protocol + '//' + location.hostname;
    if (location.port) {
      curOrigin += ':' + location.port;
    }
  }
  return curOrigin === origin;
};

_.filePath = function (url) {
  if (url == null) {
    url = decodeURI(document.location.href);
  }
  var index = url.indexOf('?');
  if (index !== -1) {
    url = url.substring(0, index);
  }
  index = url.indexOf('#');
  if (index !== -1) {
    url = url.substring(0, index);
  }
  return url;
};

_.parentPath = function (filePath) {
  if (filePath == null) {
    filePath = _.filePath();
  }
  var index = filePath.lastIndexOf('/');
  if (index !== -1) {
    filePath = filePath.substring(0, index + 1);
  }
  return filePath;
};

_.getFileName = function (absUrl) {
  var filePath = _.filePath(absUrl);
  var idx = filePath.lastIndexOf('/');
  var fiileName = idx !== -1 ? filePath.substring(idx + 1) : filePath;
  return fiileName || '';
};

_.getFileExtention = function (absUrl) {
  var ext = void 0;
  var fiileName = _.getFileName(absUrl);
  var idx = fiileName != null ? fiileName.lastIndexOf('.') : undefined;
  if (idx !== -1) {
    ext = fiileName.substring(idx);
  }
  return ext || '';
};

},{}],31:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

if (window.rh == null) {
  window.rh = {};
}
var _window = window,
    rh = _window.rh;

if (rh._ == null) {
  rh._ = {};
}
rh.util = rh._;
var _ = rh._;


var nativeForEach = Array.prototype.forEach;
var nativeKeys = Object.keys;
var hasOwnProperty = Object.prototype.hasOwnProperty;


_.time = function () {
  return new Date().getTime();
};

_.delay = function (fn, wait) {
  var args = [];var i = 1;
  while (++i < arguments.length) {
    args.push(arguments[i]);
  }
  return setTimeout(function () {
    return fn.apply(null, args);
  }, wait);
};

_.defer = function (fn) {
  var args = [];var i = 0;
  while (++i < arguments.length) {
    args.push(arguments[i]);
  }
  return this.delay.apply(this, [fn, 1].concat(args));
};

_.debounce = function (fn, threshold, execAsap) {
  var timeout = null;
  return function () {
    var args = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Array.from(arguments)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var arg = _step.value;
        args.push(arg);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    var obj = this;
    var delayed = function delayed() {
      if (!execAsap) {
        fn.apply(obj, args);
      }
      return timeout = null;
    };
    if (timeout) {
      clearTimeout(timeout);
    } else if (execAsap) {
      fn.apply(obj, args);
    }
    return timeout = setTimeout(delayed, threshold || 100);
  };
};

_.throttle = function (fn, threshold) {
  var timeout = null;
  var fnExecuted = false;
  return function () {
    var args = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = Array.from(arguments)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var arg = _step2.value;
        args.push(arg);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    var obj = this;
    var delayed = function delayed() {
      if (!fnExecuted) {
        fn.apply(obj, args);
      }
      return timeout = null;
    };
    if (timeout) {
      clearTimeout(timeout);
      fnExecuted = false;
    } else {
      fn.apply(obj, args);
      fnExecuted = true;
    }

    return timeout = setTimeout(delayed, threshold || 100);
  };
};

_.timeout = function (fn, wait) {
  return function () {
    var args = [];
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = Array.from(arguments)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var arg = _step3.value;
        args.push(arg);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    var obj = this;
    var delayed = function delayed() {
      return fn.apply(obj, args);
    };
    return setTimeout(delayed, wait);
  };
};

_.toggleTimeout = function (fn, wait, toggle) {
  return function () {
    var args = [];
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = Array.from(arguments)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var arg = _step4.value;
        args.push(arg);
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }

    var obj = this;
    var delayed = function delayed() {
      return fn.apply(obj, args);
    };
    if (toggle) {
      if (rh._debug) {
        args.push(_.stackTrace());
      }
      setTimeout(delayed, wait);
    } else {
      delayed();
    }
    return toggle = !toggle;
  };
};

// Object methods

_.has = function (obj, key) {
  return obj != null && hasOwnProperty.call(obj, key);
};

_.keys = function (obj) {
  var keys = [];
  if (!_.isObject(obj)) {
    return keys;
  }
  if (nativeKeys) {
    return nativeKeys(obj);
  }
  for (var key in obj) {
    if (_.has(obj, key)) {
      keys.push(key);
    }
  }
  return keys;
};

//Iterators

_.any = function (obj, fn, context) {
  if (context == null) {
    context = this;
  }
  if (obj == null) {
    return false;
  }
  var keys = obj.length !== +obj.length && _.keys(obj);

  var _ref = keys || obj,
      length = _ref.length;

  var index = 0;
  while (true) {
    if (index >= length) {
      break;
    }
    var key = keys ? keys[index] : index;
    if (fn.call(context, obj[key], key, obj)) {
      return true;
    }
    index++;
  }
  return false;
};

_.each = function (obj, fn, context) {
  var value = void 0;
  if (context == null) {
    context = this;
  }
  if (obj == null) {
    return;
  }
  if (nativeForEach === obj.forEach) {
    obj.forEach(fn, context);
  } else if (obj.length === +obj.length) {
    for (var index = 0; index < obj.length; index++) {
      value = obj[index];fn.call(context, value, index, obj);
    }
  } else {
    for (var key in obj) {
      value = obj[key];fn.call(context, value, key, obj);
    }
  }
  return obj;
};

_.map = function (obj, fn, context) {
  if (context == null) {
    context = this;
  }
  var result = [];
  _.each(obj, function (value, key, obj) {
    return result.push(fn.call(context, value, key, obj));
  });
  return result;
};

_.reduce = function (obj, fn, initial, context) {
  if (context == null) {
    context = this;
  }
  _.each(obj, function (value, key) {
    return initial = fn.call(context, initial, value, key);
  });
  return initial;
};

_.find = function (obj, fn, context) {
  if (context == null) {
    context = this;
  }
  var result = undefined;
  _.any(obj, function (value, key, obj) {
    if (fn.call(context, value, key, obj)) {
      result = value;
      return true;
    }
  });
  return result;
};

_.findIndex = function (obj, fn, context) {
  if (context == null) {
    context = this;
  }
  var result = -1;
  _.any(obj, function (value, key, obj) {
    if (fn.call(context, value, key, obj)) {
      result = key;
      return true;
    }
  });
  return result;
};

_.findParentNode = function (node, rootNode, fn, context) {
  if (rootNode == null) {
    rootNode = document;
  }
  if (context == null) {
    context = this;
  }
  var result = null;
  while (true) {
    if (!node || node === rootNode) {
      break;
    }
    if (fn.call(context, node)) {
      result = node;
      break;
    }
    node = node.parentNode;
  }
  return result;
};

_.filter = function (obj, fn, context) {
  if (context == null) {
    context = this;
  }
  var result = [];
  _.each(obj, function (value, key, obj) {
    if (fn.call(context, value, key, obj)) {
      return result.push(value);
    }
  });
  return result;
};

_.flatten = function (obj) {
  return _.reduce(obj, function (result, elem) {
    return result.concat(elem);
  }, []);
};

_.unique = function (obj, fn, context) {
  if (context == null) {
    context = this;
  }
  if (fn) {
    obj = _.map(obj, fn, context);
  }
  return _.filter(obj, function (value, index) {
    return obj.indexOf(value) === index;
  });
};

_.union = function (obj, fn, context) {
  if (context == null) {
    context = this;
  }
  if (fn) {
    obj = _.map(obj, fn, context);
  }
  return _.unique(_.flatten(obj));
};

_.count = function (obj, fn, context) {
  if (context == null) {
    context = this;
  }
  var count = 0;
  _.each(obj, function (value, key, obj) {
    if (fn.call(context, value, key, obj)) {
      return count++;
    }
  });
  return count;
};

_.extend = function (obj, oldObj, newObj) {
  if (oldObj) {
    _.each(oldObj, function (value, key) {
      return obj[key] = value;
    });
  }
  if (newObj) {
    _.each(newObj, function (value, key) {
      return obj[key] = value;
    });
  }
  return obj;
};

_.addPathNameKey = function (obj) {
  return _.extend(obj, { 'pathname': decodeURIComponent(window.location.pathname) });
};

_.clone = function (obj) {
  if (!_.isObject(obj)) {
    return obj;
  }
  return _.reduce(obj, function (result, value, key) {
    result[key] = _.clone(value);
    return result;
  }, {});
};

_.compact = function (array) {
  return _.filter(array, function (item) {
    return item;
  });
};

_.compactObject = function (obj) {
  if (obj == null) {
    obj = {};
  }
  return _.reduce(obj, function (result, value, key) {
    if (value != null) {
      if (_.isObject(value)) {
        value = _.compactObject(value);
        if (!_.isEmptyObject(value)) {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }
    return result;
  }, {});
};

_.isString = function (value) {
  return typeof value === 'string';
};

_.isFunction = function (value) {
  return typeof value === 'function';
};

_.isObject = function (value) {
  return value !== null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
};

_.isDefined = function (value) {
  return value !== null && value !== undefined;
};

_.isEmptyString = function (value) {
  return value.length === 0;
};

_.isUsefulString = function (value) {
  return _.isDefined(value) && !_.isEmptyString(value);
};

_.isEmptyObject = function (value) {
  return Object.keys(value).length === 0;
};

_.isEqual = function (obj1, obj2) {
  if ((typeof obj1 === 'undefined' ? 'undefined' : _typeof(obj1)) !== (typeof obj2 === 'undefined' ? 'undefined' : _typeof(obj2))) {
    return false;
  }
  if (!_.isDefined(obj1) || !_.isDefined(obj2)) {
    return obj1 === obj2;
  }

  switch (typeof obj1 === 'undefined' ? 'undefined' : _typeof(obj1)) {
    case 'object':
      return _.isEqualObject(obj1, obj2);
    case 'array':
      return !_.any(obj1, function (value, index) {
        return !_.isEqual(value, obj2[index]);
      });
    default:
      return obj1 === obj2;
  }
};

_.isEqualObject = function (obj1, obj2) {
  var keys1 = _.filter(_.keys(obj1), function (key) {
    return obj1[key] !== undefined;
  });
  var keys2 = _.filter(_.keys(obj2), function (key) {
    return obj2[key] !== undefined;
  });
  if (keys1.length !== keys2.length) {
    return false;
  }
  return !_.any(keys1, function (key) {
    return !_.isEqual(obj1[key], obj2[key]);
  });
};

_.isZeroCSSValue = function (value) {
  return value === '0' || value === '0px' || value === '0em' || value === '0%';
};

//Helper methods

(function () {
  var localDB = void 0;
  try {
    localStorage.setItem('testLocalDB', true);
    localDB = localStorage.getItem('testLocalDB') != null;
    localStorage.removeItem('testLocalDB');
  } catch (error) {
    localDB = false;
  }

  return _.canUseLocalDB = function () {
    return localDB;
  };
})();

_.isIframe = function () {
  return parent !== window;
};

_.loadScript = function (jsPath) {
  var async = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var onload = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var autodelete = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = async === true;
  script.src = jsPath;
  script.onerror = script.onload = function (args) {
    if (autodelete) {
      document.body.removeChild(script);
    }
    return onload && onload.apply(null, args);
  };

  return document.body.appendChild(script);
};

(function () {
  var randomStr = function randomStr() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(32).substring(1);
  };

  return _.uniqueId = function () {
    return _.time().toString(32) + '_' + randomStr() + randomStr() + randomStr();
  };
})();

_.one = function (fn) {
  return function () {
    if ('function' === typeof fn) {
      var fn1 = fn;
      fn = null;
      return fn1.apply(this, arguments);
    }
  };
};

_.cache = function (isValid, cache) {
  if (cache == null) {
    cache = {};
  }
  return function (name, value) {
    if (arguments.length === 1) {
      return cache[name];
    } else if (!isValid || isValid(value)) {
      return cache[name] = value;
    }
  };
};

_.memoize = function (generator, cache) {
  if (cache == null) {
    cache = {};
  }
  return function () {
    var fullkey = void 0;
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = Array.from(arguments)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var arg = _step5.value;

        var key = _.isString(arg) ? arg : JSON.stringify(arg);
        fullkey = fullkey != null ? fullkey + ', ' + key : key;
      }
    } catch (err) {
      _didIteratorError5 = true;
      _iteratorError5 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return();
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5;
        }
      }
    }

    if (fullkey in cache) {
      return cache[fullkey];
    } else {
      return cache[fullkey] = generator.apply(this, arguments);
    }
  };
};

// last argument of generator function should be callback function
_.memoizeAsync = function (generator, cache) {
  if (cache == null) {
    cache = {};
  }
  return function () {
    var callback = void 0;
    var args = [];
    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = Array.from(arguments)[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var arg = _step6.value;
        args.push(arg);
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6.return) {
          _iterator6.return();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }

    if (args.length > 1) {
      callback = args.pop();
    }
    var fullkey = args.join(', ');
    if (fullkey in cache) {
      return typeof callback === 'function' ? callback(cache[fullkey]) : undefined;
    } else {
      args.push(function (data) {
        cache[fullkey] = data;
        return typeof callback === 'function' ? callback(data) : undefined;
      });
      return generator.apply(this, args);
    }
  };
};

_.require = _.memoizeAsync(function (jsPath, callback) {
  return _.loadScript(jsPath, true, function () {
    return callback(_.exports());
  });
});

(function () {
  var cache = undefined;
  return _.exports = function (value) {
    var retValue = cache;
    cache = value != null ? value : undefined;
    return retValue;
  };
})();

},{}],32:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _window = window,
    rh = _window.rh;

var util = rh._;
var $ = rh.$;


var dataWidget = function dataWidget(attr) {
    var DataWidget = function (_rh$Widget) {
        _inherits(DataWidget, _rh$Widget);

        _createClass(DataWidget, [{
            key: "toString",
            value: function toString() {
                return attr + "_" + this._count;
            }
        }], [{
            key: "initClass",
            value: function initClass() {

                this.prototype.dataAttrMethods = function () {
                    var map = {};
                    map["data-" + attr] = "data_" + attr;
                    return map;
                }();
            }
        }]);

        function DataWidget(opts) {
            _classCallCheck(this, DataWidget);

            // Use global model unless someone gives you in javascript
            var _this = _possibleConstructorReturn(this, (DataWidget.__proto__ || Object.getPrototypeOf(DataWidget)).call(this, opts));

            if (_this.model == null) {
                _this.model = rh.model;
            }
            $.dataset(_this.node, attr, opts.rawArg);
            return _this;
        }

        _createClass(DataWidget, [{
            key: "init",
            value: function init(parent) {
                if (this.initDone) {
                    return;
                }
                this.initDone = true;
                this.initParent(parent);
                this.initUI();
                return this.resolveDataAttrs(this.node);
            }
        }]);

        return DataWidget;
    }(rh.Widget);

    DataWidget.initClass();

    return DataWidget;
};

var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
    for (var _iterator = Array.from(rh.Widget.prototype.dataAttrs)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var attr = _step.value;
        window.rh.widgets[attr] = dataWidget(attr);
    }
} catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
} finally {
    try {
        if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
        }
    } finally {
        if (_didIteratorError) {
            throw _iteratorError;
        }
    }
}

},{}],33:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _window = window,
    rh = _window.rh;

var util = rh._;
var $ = rh.$;

var Global = function (_rh$Widget) {
  _inherits(Global, _rh$Widget);

  function Global(opts) {
    _classCallCheck(this, Global);

    var _this = _possibleConstructorReturn(this, (Global.__proto__ || Object.getPrototypeOf(Global)).call(this, opts));

    if (_this.model == null) {
      _this.model = rh.model;
    }
    return _this;
  }

  return Global;
}(rh.Widget);

window.rh.widgets.Global = Global;

},{}],34:[function(require,module,exports){
'use strict';

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;
var consts = rh.consts;
var Widget = rh.Widget;

var List = function (_Widget) {
  _inherits(List, _Widget);

  _createClass(List, null, [{
    key: 'initClass',
    value: function initClass() {

      this.prototype.dataIAttrs = ['child'].concat(Widget.prototype.dataIAttrs);
      this.prototype.dataIAttrMethods = function () {
        return Widget.prototype.mapDataAttrMethods(List.prototype.dataIAttrs);
      }();

      this.prototype.supportedArgs = ['node', 'model', 'key', 'user_vars', 'filter', 'spliton', 'path', 'tplNode', 'tplChildNodes'];
    }
  }]);

  function List(opts) {
    _classCallCheck(this, List);

    var _this = _possibleConstructorReturn(this, (List.__proto__ || Object.getPrototypeOf(List)).call(this, opts));

    _this.reRender = _this.reRender.bind(_this);
    _this.renderChunck = _this.renderChunck.bind(_this);

    if (_this.key == null) {
      _this.key = '_' + _this;
    }
    if (_this.path == null) {
      _this.path = [];
    }
    if (_this.children == null) {
      _this.children = [];
    }
    if (_this.user_vars == null) {
      _this.user_vars = {};
    }
    _this.useTemplate = true;
    _this.renderedIndex = 0;
    _this.renderedCount = 0;
    return _this;
  }

  _createClass(List, [{
    key: 'init',
    value: function init(parent) {
      if (this.initDone) {
        return;
      }
      _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'init', this).call(this, parent);
      this.subscribeOnly(this.key, this.reRender, { partial: false });
      this.subscribeExpr(this.keyexpr, function (result) {
        if (result == null) {
          result = [];
        }return this.publish(this.key, result, { sync: true });
      });
      return this.subscribeOnly(this.opts.loadmore, this.renderChunck);
    }
  }, {
    key: 'parseOpts',
    value: function parseOpts(opts) {
      _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'parseOpts', this).call(this, opts);
      if (this.key) {
        if (_.isValidModelConstKey(this.key)) {
          this.key = consts(this.key);
        }
        if (!_.isValidModelKey(this.key)) {
          this.keyexpr = this.key;
          return this.key = null;
        }
      }
    }
  }, {
    key: 'parsePipedArg',
    value: function parsePipedArg() {
      var args = this.opts.pipedArgs;
      if (args != null ? args.shift : undefined) {
        var arg = void 0;
        if (arg = args.shift()) {
          this.filter = arg;
        }
        if (arg = args.shift()) {
          this.spliton = arg;
        }
      }

      if (_.isString(this.filter)) {
        this.filter = this.listItemExpr(this.filter);
      }
      if (_.isString(this.spliton)) {
        return this.spliton = this.listItemExpr(this.spliton);
      }
    }
  }, {
    key: 'notifyLoading',
    value: function notifyLoading(value) {
      if (this.opts.loading) {
        return this.publish(this.opts.loading, value);
      }
    }
  }, {
    key: 'listItemExpr',
    value: function listItemExpr(expr) {
      return this._evalFunction('item, index', expr);
    }
  }, {
    key: 'isWidgetNode',
    value: function isWidgetNode(node) {
      return _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'isWidgetNode', this).apply(this, arguments) || $.dataset(node, 'child');
    }
  }, {
    key: 'reRender',
    value: function reRender(render) {
      this.data = null;
      this.renderedIndex = 0;
      this.renderedCount = 0;
      return _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'reRender', this).call(this, render);
    }
  }, {
    key: 'preRender',
    value: function preRender() {
      var _this2 = this;

      var node = void 0;
      var oldNode = this.node;
      if (this.tplChildNodes == null) {
        this.tplChildNodes = function () {
          var result = [];
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = Array.from(_this2.tplNode.childNodes)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              node = _step.value;
              result.push(node);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          return result;
        }();
      }

      this.node = this.tplNode.cloneNode(false);
      return oldNode;
    }
  }, {
    key: 'alterNodeContent',
    value: function alterNodeContent() {
      if (this.data == null) {
        this.data = this.get(this.key) || [];
      }
      return this.renderChunck();
    }
  }, {
    key: 'renderChunck',
    value: function renderChunck() {
      var i = void 0;
      var end = void 0;
      this.notifyLoading(false);
      for (i = this.renderedIndex, end = this.data.length - 1; i <= end; i++) {
        var item = this.data[i];
        if (this.filter && !this.filter(item, i)) {
          continue;
        }
        if (this.spliton && i !== this.renderedIndex && this.spliton(item, this.renderedCount)) {
          this.notifyLoading(true);
          break;
        } else {
          this.renderOneItem(item, i);
        }
      }
      this.renderedIndex = i;
      if (this.renderedCount === 0) {
        this.hide();
      } else if (!this.isVisible()) {
        this.show();
      }
      if (this.opts.loaded && i === this.data.length) {
        return this.publish(this.opts.loaded, true);
      }
    }
  }, {
    key: 'renderOneItem',
    value: function renderOneItem(item, index) {
      this.renderedIndex = index;
      var generateindex = this.opts.generateindex || rh._debug;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Array.from(this.tplChildNodes)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var node = _step2.value;

          var newNode;
          if (newNode = this.resolve_rif(node, item, index)) {
            if (incremented == null) {
              this.renderedCount++;
              var incremented = true;
            }
            if (generateindex) {
              $.dataset(newNode, 'listindex', this.renderedCount - 1);
            }
            if (newNode.hasChildNodes()) {
              this.renderChildList(newNode, item, index);
            }
            this.node.appendChild(newNode);
            this.resolveItemIndex(newNode, item, index);
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: 'convertToListContainer',
    value: function convertToListContainer(node) {}
  }, {
    key: '_pathId',
    value: function _pathId(index) {
      var id = '_';
      id += this.path.join('_');
      if (index != null) {
        if (this.path.length > 0) {
          id += '_';
        }
        id += index;
      }
      return id;
    }
  }, {
    key: '_pathKey',
    value: function _pathKey(subpath) {
      if (subpath == null) {
        subpath = '';
      }
      subpath = subpath.toString();
      var path = this.path.join('.');
      if (subpath.length > 0 && path.length > 0) {
        return '.' + path + '.' + subpath;
      } else if (subpath.length > 0) {
        return '.' + subpath;
      } else {
        return '.' + path;
      }
    }

    /*
     * @path: unique path for list
     * @ppath: unique path of parent
     */

  }, {
    key: 'resolveRepeatVar',
    value: function resolveRepeatVar(expr, item, index, cache, node) {
      var _this3 = this;

      return cache[expr] = cache[expr] || function () {
        switch (expr) {
          case '@itemkey':
            return _this3.key + '.' + index;
          case '@key':
            return _this3.key;
          case '@id':
            return _this3._pathId(index);
          case '@pid':
            return _this3._pathId();
          case '@path':
            return _this3._pathKey(index);
          case '@ppath':
            return _this3._pathKey();
          case '@level':
            return _this3.path.length;
          default:
            return _get(List.prototype.__proto__ || Object.getPrototypeOf(List.prototype), 'resolveRepeatVar', _this3).call(_this3, expr, item, index, cache, node);
        }
      }();
    }
  }, {
    key: 'data_child',
    value: function data_child(node, rawExpr, item, index, attrsInfo) {
      if (!_.isValidModelKey(rawExpr)) {
        $.dataset(node, 'child', this.subscribeIDataExpr(node, rawExpr, item, index));
      }
      return false;
    }

    /*
     * it can be key or expression
     * data-child="value"
     * data-child="@.p.value"
     */

  }, {
    key: 'renderChildList',
    value: function renderChildList(node, item, index) {
      return $.eachDataNode(node, 'child', function (childNode, value) {
        this.convertToListContainer(node);
        this.resolveItemIndex(childNode, item, index);

        value = $.dataset(childNode, 'child'); //get updated value
        if (value === 'undefined' || value === '') {
          return childNode.parentNode.removeChild(childNode);
        } else {
          var args = value.split('|');
          var filter = args[1];
          var childkey = args[0];

          var childList = new List({
            node: childNode,
            model: this.model,
            key: childkey,
            user_vars: this.user_vars,
            path: this.path.concat([this.renderedCount - 1]),
            filter: filter,
            tplNode: childNode.cloneNode(false),
            tplChildNodes: this.tplChildNodes
          });

          childList.init(this);
          return this.children.push(childList);
        }
      }, this);
    }
  }]);

  return List;
}(Widget);

List.initClass();

window.rh.widgets.List = List;

},{}],35:[function(require,module,exports){
"use strict";

require("../lib/rh");
require("../../lenient_src/utils/utils");
require("../../lenient_src/common/query");
require("../../lenient_src/utils/url_utils");

},{"../../lenient_src/common/query":14,"../../lenient_src/utils/url_utils":30,"../../lenient_src/utils/utils":31,"../lib/rh":40}],36:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var rh = require('../../lib/rh');

var OnLoad = function OnLoad(widget, node, rawExpr) {
  _classCallCheck(this, OnLoad);

  var _widget$resolveRawExp = widget.resolveRawExprWithValue(rawExpr),
      callback = _widget$resolveRawExp.callback;

  node.onload = function () {
    return callback.call(widget);
  };
};

rh.registerDataAttr('onload', OnLoad);

},{"../../lib/rh":40}],37:[function(require,module,exports){
"use strict";

require("../lib/rh");
require("../../lenient_src/utils/parse_utils");
require("../../lenient_src/utils/debug_utils");
require("../../lenient_src/utils/event_utils");
require("../../lenient_src/utils/model_utils");
require("../../lenient_src/utils/unicode_utils");
require("../../lenient_src/common/debug");
require("../../lenient_src/common/consts");
require("../../lenient_src/common/model");
require("../../lenient_src/common/data_util");
require("../../lenient_src/common/guard");
require("../../lenient_src/common/plugin");
require("../../lenient_src/common/console");
require("../../lenient_src/common/widget");
require("../../lenient_src/common/init");
require("../../lenient_src/common/message");
require("../../lenient_src/common/iframe");
require("../../lenient_src/common/storage");
require("../../lenient_src/common/responsive");
require("../../lenient_src/common/screen");
require("../../lenient_src/common/node_holder");
require("../../lenient_src/common/controller");
require("../../lenient_src/common/http");
require("../../lenient_src/data_attributes/data_attr");
require("../../lenient_src/data_attributes/resize");
require("../../lenient_src/data_attributes/table");
require("../../lenient_src/data_attributes/table_recursive");
require("../../lenient_src/widgets/global");
require("../../lenient_src/widgets/list");
require("../../lenient_src/widgets/data_widgets");
require("./data_attributes/onload");
require("./utils/operator_search");
require("./utils/collections");
require("../../lenient_src/indigo/handlers");
require("../../lenient_src/common/rhs");

},{"../../lenient_src/common/console":1,"../../lenient_src/common/consts":2,"../../lenient_src/common/controller":3,"../../lenient_src/common/data_util":4,"../../lenient_src/common/debug":5,"../../lenient_src/common/guard":6,"../../lenient_src/common/http":7,"../../lenient_src/common/iframe":8,"../../lenient_src/common/init":9,"../../lenient_src/common/message":10,"../../lenient_src/common/model":11,"../../lenient_src/common/node_holder":12,"../../lenient_src/common/plugin":13,"../../lenient_src/common/responsive":15,"../../lenient_src/common/rhs":16,"../../lenient_src/common/screen":17,"../../lenient_src/common/storage":18,"../../lenient_src/common/widget":19,"../../lenient_src/data_attributes/data_attr":20,"../../lenient_src/data_attributes/resize":21,"../../lenient_src/data_attributes/table":22,"../../lenient_src/data_attributes/table_recursive":23,"../../lenient_src/indigo/handlers":24,"../../lenient_src/utils/debug_utils":25,"../../lenient_src/utils/event_utils":26,"../../lenient_src/utils/model_utils":27,"../../lenient_src/utils/parse_utils":28,"../../lenient_src/utils/unicode_utils":29,"../../lenient_src/widgets/data_widgets":32,"../../lenient_src/widgets/global":33,"../../lenient_src/widgets/list":34,"../lib/rh":40,"./data_attributes/onload":36,"./utils/collections":38,"./utils/operator_search":39}],38:[function(require,module,exports){
"use strict";

},{}],39:[function(require,module,exports){
"use strict";

var rh = require('../../lib/rh');
var _ = rh._;
_.isAND = function (a_strOp, enableOperatorSearch) {
  return enableOperatorSearch && (a_strOp === "and" || a_strOp === "&" || a_strOp === "AND") || a_strOp === "\xACand\xAC";
};

_.isOR = function (a_strOp, enableOperatorSearch) {
  return enableOperatorSearch && (a_strOp === "or" || a_strOp === "|" || a_strOp === "OR");
};

_.isNOT = function (a_strOp, enableOperatorSearch) {
  return enableOperatorSearch && (a_strOp === "not" || a_strOp === "~" || a_strOp === "NOT");
};

_.isOperator = function (strOp, enableOperatorSearch) {
  if (strOp === "\xACand\xAC" || enableOperatorSearch && (strOp === "and" || strOp === "or" || strOp === "not")) {
    return true;
  }
  return false;
};

},{"../../lib/rh":40}],40:[function(require,module,exports){
(function (global){
"use strict";

//Gunjan
if (global.rh === undefined) {
  global.rh = {};
}

module.exports = global.rh;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},[35,37])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsZW5pZW50X3NyY1xcY29tbW9uXFxjb25zb2xlLmpzIiwibGVuaWVudF9zcmNcXGNvbW1vblxcY29uc3RzLmpzIiwibGVuaWVudF9zcmNcXGNvbW1vblxcY29udHJvbGxlci5qcyIsImxlbmllbnRfc3JjXFxjb21tb25cXGRhdGFfdXRpbC5qcyIsImxlbmllbnRfc3JjXFxjb21tb25cXGRlYnVnLmpzIiwibGVuaWVudF9zcmNcXGNvbW1vblxcZ3VhcmQuanMiLCJsZW5pZW50X3NyY1xcY29tbW9uXFxodHRwLmpzIiwibGVuaWVudF9zcmNcXGNvbW1vblxcaWZyYW1lLmpzIiwibGVuaWVudF9zcmNcXGNvbW1vblxcaW5pdC5qcyIsImxlbmllbnRfc3JjXFxjb21tb25cXG1lc3NhZ2UuanMiLCJsZW5pZW50X3NyY1xcY29tbW9uXFxtb2RlbC5qcyIsImxlbmllbnRfc3JjXFxjb21tb25cXG5vZGVfaG9sZGVyLmpzIiwibGVuaWVudF9zcmNcXGNvbW1vblxccGx1Z2luLmpzIiwibGVuaWVudF9zcmNcXGNvbW1vblxccXVlcnkuanMiLCJsZW5pZW50X3NyY1xcY29tbW9uXFxyZXNwb25zaXZlLmpzIiwibGVuaWVudF9zcmNcXGNvbW1vblxccmhzLmpzIiwibGVuaWVudF9zcmNcXGNvbW1vblxcc2NyZWVuLmpzIiwibGVuaWVudF9zcmNcXGNvbW1vblxcc3RvcmFnZS5qcyIsImxlbmllbnRfc3JjXFxjb21tb25cXHdpZGdldC5qcyIsImxlbmllbnRfc3JjXFxkYXRhX2F0dHJpYnV0ZXNcXGRhdGFfYXR0ci5qcyIsImxlbmllbnRfc3JjXFxkYXRhX2F0dHJpYnV0ZXNcXHJlc2l6ZS5qcyIsImxlbmllbnRfc3JjXFxkYXRhX2F0dHJpYnV0ZXNcXHRhYmxlLmpzIiwibGVuaWVudF9zcmNcXGRhdGFfYXR0cmlidXRlc1xcdGFibGVfcmVjdXJzaXZlLmpzIiwibGVuaWVudF9zcmNcXGluZGlnb1xcaGFuZGxlcnMuanMiLCJsZW5pZW50X3NyY1xcdXRpbHNcXGRlYnVnX3V0aWxzLmpzIiwibGVuaWVudF9zcmNcXHV0aWxzXFxldmVudF91dGlscy5qcyIsImxlbmllbnRfc3JjXFx1dGlsc1xcbW9kZWxfdXRpbHMuanMiLCJsZW5pZW50X3NyY1xcdXRpbHNcXHBhcnNlX3V0aWxzLmpzIiwibGVuaWVudF9zcmNcXHV0aWxzXFx1bmljb2RlX3V0aWxzLmpzIiwibGVuaWVudF9zcmNcXHV0aWxzXFx1cmxfdXRpbHMuanMiLCJsZW5pZW50X3NyY1xcdXRpbHNcXHV0aWxzLmpzIiwibGVuaWVudF9zcmNcXHdpZGdldHNcXGRhdGFfd2lkZ2V0cy5qcyIsImxlbmllbnRfc3JjXFx3aWRnZXRzXFxnbG9iYWwuanMiLCJsZW5pZW50X3NyY1xcd2lkZ2V0c1xcbGlzdC5qcyIsInNyY1xcZnJhbWV3b3Jrc1xcYWFkaGFyLmpzIiwic3JjXFxmcmFtZXdvcmtzXFxkYXRhX2F0dHJpYnV0ZXNcXG9ubG9hZC5qcyIsInNyY1xcZnJhbWV3b3Jrc1xccmguanMiLCJzcmMvZnJhbWV3b3Jrcy91dGlscy9jb2xsZWN0aW9ucy5qcyIsInNyY1xcZnJhbWV3b3Jrc1xcdXRpbHNcXG9wZXJhdG9yX3NlYXJjaC5qcyIsInNyY1xcbGliXFxzcmNcXGxpYlxccmguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7O2NDQWEsTTtJQUFQLEUsV0FBQSxFO0lBQ0EsQyxHQUFNLEUsQ0FBTixDO0lBQ0EsQyxHQUFNLEUsQ0FBTixDOzs7QUFFTixJQUFJLFVBQVcsWUFBVztBQUN4QixNQUFJLFlBQVksU0FBaEI7QUFDQSxNQUFJLFNBQVMsU0FBYjtBQUNBO0FBQUE7O0FBQUE7QUFBQTtBQUFBLGtDQUNxQjs7QUFFakIsb0JBQVksQ0FBQyxNQUFELEVBQVMsS0FBVCxFQUFnQixNQUFoQixFQUF3QixPQUF4QixFQUFpQyxPQUFqQyxDQUFaOztBQUVBLGlCQUFTLENBQUMsU0FBRCxFQUFZLFNBQVosRUFBdUIsU0FBdkIs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QVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLFVBQVY7QUFDQTtBQUNELE9BQUssS0FBTDtBQUNDO0FBQ0EsY0FBVyxHQUFYO0FBQ0EsYUFBVSxHQUFWO0FBQ0EsYUFBVSxHQUFWO0FBQ0EsYUFBVSxHQUFWO0FBQ0EsYUFBVSxNQUFWO0FBQ0EsYUFBVSxHQUFWO0FBQ0EsYUFBVSxVQUFWO0FBQ0E7QUFDRCxPQUFLLEtBQUw7QUFDQztBQUNBLGNBQVcsR0FBWDtBQUNBLGFBQVUsR0FBVjtBQUNBLGFBQVUsR0FBVjtBQUNBLGFBQVUsR0FBVjtBQUNBLGFBQVUsTUFBVjtBQUNBLGFBQVUsR0FBVjtBQUNBLGFBQVUsVUFBVjtBQUNBO0FBQ0QsT0FBSyxLQUFMO0FBQ0M7QUFDQSxjQUFXLEdBQVg7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLE1BQVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLFVBQVY7QUFDQTtBQUNELE9BQUssUUFBTDtBQUNDO0FBQ0EsY0FBVyxNQUFYO0FBQ0EsYUFBVSxHQUFWO0FBQ0EsYUFBVSxHQUFWO0FBQ0EsYUFBVSxHQUFWO0FBQ0EsYUFBVSxHQUFWO0FBQ0EsYUFBVSxHQUFWO0FBQ0EsYUFBVSxVQUFWO0FBQ0E7QUFDRCxPQUFLLFdBQUw7QUFDQztBQUNBLGNBQVcsR0FBWDtBQUNBLGFBQVUsR0FBVjtBQUNBLGFBQVUsR0FBVjtBQUNBLGFBQVUsR0FBVjtBQUNBLGFBQVUsR0FBVjtBQUNBLGFBQVUsTUFBVjtBQUNBLGFBQVUsVUFBVjtBQUNBO0FBQ0QsT0FBSyxNQUFMO0FBQ0MsY0FBVyxVQUFYO0FBQ0E7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLE1BQVY7QUFDQTtBQUNEO0FBQVM7QUFDUixhQUFVLEdBQVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLE1BQVY7QUFDQSxhQUFVLEdBQVY7QUFDQSxhQUFVLFVBQVY7QUFDQTtBQUNBLFFBQUssU0FBTCxDQUFlLE1BQWYsQ0FBc0IsZUFBdEI7QUFDQSxPQUFHLEdBQUcsS0FBSCxDQUFTLEdBQVQsQ0FBYSxHQUFHLE1BQUgsQ0FBVSxvQkFBVixDQUFiLENBQUgsRUFBa0Q7QUFDakQsT0FBRyxzQkFBSDtBQUNBO0FBbkZIO0FBcUZBLENBOUpEO0FBK0pBLEdBQUcsc0JBQUgsR0FBNEIsWUFBVztBQUN0QyxLQUFJLFFBQVEsU0FBUyxvQkFBVCxDQUE4QixPQUE5QixDQUFaO0FBQ0EsTUFBSSxJQUFJLElBQUUsQ0FBVixFQUFZLElBQUUsTUFBTSxNQUFwQixFQUEyQixHQUEzQixFQUErQjtBQUM5QixNQUFHLE1BQU0sQ0FBTixFQUFTLFNBQVQsQ0FBbUIsUUFBbkIsQ0FBNEIsY0FBNUIsQ0FBSCxFQUErQztBQUM5QyxNQUFHLEtBQUgsQ0FBUyxRQUFULENBQWtCLDZCQUFsQixFQUFpRCxJQUFqRDtBQUNBLGNBQVcsWUFBSTtBQUNkLFVBQU0sQ0FBTixFQUFTLEtBQVQ7QUFDQSxJQUZELEVBRUUsR0FGRjtBQUdBO0FBQ0E7QUFDRDtBQUNELENBWEQ7QUFZQSxHQUFHLHNCQUFILEdBQTRCLFlBQVc7QUFDdEMsSUFBRyxLQUFILENBQVMsT0FBVCxDQUFpQixHQUFHLE1BQUgsQ0FBVSxlQUFWLENBQWpCLEVBQTZDLEtBQTdDO0FBQ0EsQ0FGRDtBQUdBLEdBQUcsd0JBQUgsR0FBOEIsWUFBVztBQUN4QyxLQUFJLE9BQU8sU0FBUyxvQkFBVCxDQUE4QixNQUE5QixFQUFzQyxDQUF0QyxDQUFYOztBQUVBLEtBQUksYUFBYSx5QkFBakI7QUFDQSxLQUFJLGNBQWMsMEJBQWxCO0FBQ0EsS0FBSSxlQUFlLDJCQUFuQjs7QUFFQSxNQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXNCLFVBQXRCO0FBQ0EsTUFBSyxTQUFMLENBQWUsTUFBZixDQUFzQixXQUF0QjtBQUNBLE1BQUssU0FBTCxDQUFlLE1BQWYsQ0FBc0IsWUFBdEI7O0FBRUEsS0FBSSxRQUFRLEtBQVo7QUFDQSxLQUFHLEdBQUcsS0FBSCxDQUFTLEdBQVQsQ0FBYSxHQUFHLE1BQUgsQ0FBVSxrQkFBVixDQUFiLEtBQStDLElBQWxELEVBQXdEO0FBQ3ZELFVBQVEsVUFBUjtBQUNBLEVBRkQsTUFFTyxJQUFHLEdBQUcsS0FBSCxDQUFTLEdBQVQsQ0FBYSxHQUFHLE1BQUgsQ0FBVSxtQkFBVixDQUFiLEtBQWdELElBQW5ELEVBQXlEO0FBQy9ELFVBQVEsV0FBUjtBQUNBLEVBRk0sTUFFQSxJQUFHLEdBQUcsS0FBSCxDQUFTLEdBQVQsQ0FBYSxHQUFHLE1BQUgsQ0FBVSxvQkFBVixDQUFiLEtBQWlELElBQXBELEVBQTBEO0FBQ2hFLFVBQVEsWUFBUjtBQUNBOztBQUVELFlBQVcsWUFBVTs7QUFFcEIsT0FBSyxTQUFMLENBQWUsTUFBZixDQUFzQixVQUF0QixFQUZvQixDQUVjO0FBQ2xDLE9BQUssU0FBTCxDQUFlLE1BQWYsQ0FBc0IsV0FBdEI7QUFDQSxPQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXNCLFlBQXRCOztBQUVBLE9BQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsS0FBbkI7QUFFQSxFQVJELEVBUUcsRUFSSDtBQVVBLENBOUJEOztBQWdDQSxHQUFHLFVBQUgsR0FBZ0IsWUFBTTs7QUFFckIsSUFBRyxLQUFILENBQVMsU0FBVCxDQUFtQixHQUFHLE1BQUgsQ0FBVSxlQUFWLENBQW5CLEVBQStDLEdBQUcsZ0JBQWxEO0FBQ0EsSUFBRyxLQUFILENBQVMsU0FBVCxDQUFtQixHQUFHLE1BQUgsQ0FBVSx3QkFBVixDQUFuQixFQUF3RCxHQUFHLHNCQUEzRDtBQUNBLElBQUcsS0FBSCxDQUFTLFNBQVQsQ0FBbUIsR0FBRyxNQUFILENBQVUsWUFBVixDQUFuQixFQUE0QyxHQUFHLHdCQUEvQzs7QUFFQTtBQUNBO0FBQ0EsWUFBVyxZQUFVO0FBQ3BCLE1BQUksWUFBWSxnQkFBZ0IsZUFBaEIsQ0FBaEI7QUFDQSxNQUFHLGFBQWEsRUFBaEIsRUFBb0I7QUFDbkIsT0FBSSxRQUFRLFNBQVMsb0JBQVQsQ0FBOEIsT0FBOUIsQ0FBWjtBQUNBLFFBQUksSUFBSSxJQUFFLENBQVYsRUFBWSxJQUFFLE1BQU0sTUFBcEIsRUFBMkIsR0FBM0IsRUFBK0I7QUFDOUIsUUFBRyxNQUFNLENBQU4sRUFBUyxTQUFULENBQW1CLFFBQW5CLENBQTRCLGNBQTVCLENBQUgsRUFBK0M7QUFDOUMsV0FBTSxDQUFOLEVBQVMsS0FBVCxHQUFpQixTQUFqQjtBQUNBO0FBQ0E7QUFDRDtBQUNBLE1BQUcsS0FBSCxDQUFTLE9BQVQsQ0FBaUIsR0FBRyxNQUFILENBQVUsaUJBQVYsQ0FBakIsRUFBK0MsU0FBL0M7QUFDQTtBQUNELEVBWkYsRUFZSSxHQVpKOztBQWNBO0FBQ0EsVUFBUyxTQUFULEdBQXFCLFVBQVMsR0FBVCxFQUFjO0FBQ2xDLFFBQU0sT0FBTyxPQUFPLEtBQXBCO0FBQ0EsTUFBSSxJQUFJLE9BQUosSUFBZSxFQUFuQixFQUF1QjtBQUN0QixNQUFHLEtBQUgsQ0FBUyxPQUFULENBQWlCLEdBQUcsTUFBSCxDQUFVLGVBQVYsQ0FBakIsRUFBNkMsS0FBN0M7QUFDQSxNQUFHLHNCQUFILEdBRnNCLENBRU07QUFDNUI7QUFDRCxFQU5EO0FBT0EsQ0E5QkQ7Ozs7O0lDak5NLEMsR0FBTSxPQUFPLEUsQ0FBYixDOzs7QUFHTixFQUFFLFVBQUYsR0FBZSxZQUFXO0FBQ3hCLE1BQUksTUFBTSxJQUFJLEtBQUosRUFBVjtBQUNBLFNBQU8sSUFBSSxLQUFYO0FBQ0QsQ0FIRDs7QUFLQSxFQUFFLFFBQUYsR0FBYTtBQUFBLFNBQ1gsWUFBVztBQUNULFFBQUk7QUFDRixhQUFPLEdBQUcsS0FBSCxDQUFTLElBQVQsRUFBZSxTQUFmLENBQVA7QUFDRCxLQUZELENBRUUsT0FBTyxLQUFQLEVBQWM7QUFDZCxVQUFJLEdBQUcsTUFBUCxFQUFlO0FBQUUsV0FBRyxFQUFILENBQU0sT0FBTixpQkFBNEIsRUFBNUIsRUFBa0MsTUFBTSxPQUF4QztBQUFtRDtBQUNwRSxhQUFPLFNBQVA7QUFDRDtBQUNGLEdBUlU7QUFBQSxDQUFiOzs7OztJQ1JNLEMsR0FBTSxPQUFPLEUsQ0FBYixDOzs7QUFHTixFQUFFLGdCQUFGLEdBQXFCLFVBQVMsR0FBVCxFQUFjLFNBQWQsRUFBeUIsUUFBekIsRUFBbUM7QUFDdEQsTUFBSSxPQUFPLElBQVgsRUFBaUI7QUFBRSxVQUFNLE1BQU47QUFBZTtBQUNsQyxNQUFJLElBQUksZ0JBQUosSUFBd0IsSUFBNUIsRUFBa0M7QUFDaEMsV0FBTyxJQUFJLGdCQUFKLENBQXFCLFNBQXJCLEVBQWdDLFFBQWhDLEVBQTBDLEtBQTFDLENBQVA7QUFDRCxHQUZELE1BRU8sSUFBSSxJQUFJLFdBQUosSUFBbUIsSUFBdkIsRUFBNkI7QUFDbEMsV0FBTyxJQUFJLFdBQUosUUFBcUIsU0FBckIsRUFBa0MsUUFBbEMsQ0FBUDtBQUNEO0FBQ0YsQ0FQRDs7QUFTQSxFQUFFLG1CQUFGLEdBQXdCLFVBQVMsR0FBVCxFQUFjLFNBQWQsRUFBeUIsUUFBekIsRUFBbUM7QUFDekQsTUFBSSxPQUFPLElBQVgsRUFBaUI7QUFBRSxVQUFNLE1BQU47QUFBZTtBQUNsQyxNQUFJLElBQUksbUJBQUosSUFBMkIsSUFBL0IsRUFBcUM7QUFDbkMsV0FBTyxJQUFJLG1CQUFKLENBQXdCLFNBQXhCLEVBQW1DLFFBQW5DLEVBQTZDLEtBQTdDLENBQVA7QUFDRCxHQUZELE1BRU8sSUFBSSxJQUFJLFdBQUosSUFBbUIsSUFBdkIsRUFBNkI7QUFDbEMsV0FBTyxJQUFJLFdBQUosUUFBcUIsU0FBckIsRUFBa0MsUUFBbEMsQ0FBUDtBQUNEO0FBQ0YsQ0FQRDs7QUFTQSxFQUFFLGNBQUYsR0FBbUI7QUFBQSxTQUFNLGtCQUFrQixTQUFTLGVBQWpDO0FBQUEsQ0FBbkI7O0FBRUEsRUFBRSxjQUFGLEdBQW1CLFVBQVMsQ0FBVCxFQUFZO0FBQzdCLE1BQUksRUFBRSxjQUFGLElBQW9CLElBQXhCLEVBQThCO0FBQzVCLFdBQU8sRUFBRSxjQUFGLEVBQVA7QUFDRCxHQUZELE1BRU87QUFDTCxXQUFPLEVBQUUsV0FBRixHQUFnQixLQUF2QjtBQUNEO0FBQ0YsQ0FORDs7QUFRQSxFQUFFLFdBQUYsR0FBZ0IsVUFBUyxDQUFULEVBQVk7QUFDMUIsTUFBSSxhQUFhLENBQWpCLEVBQW9CO0FBQ2xCLFdBQU8sRUFBRSxPQUFUO0FBQ0QsR0FGRCxNQUVPLElBQUksV0FBVyxDQUFmLEVBQWtCO0FBQ3ZCLFdBQU8sRUFBRSxLQUFUO0FBQ0QsR0FGTSxNQUVBO0FBQ0wsV0FBTyxFQUFFLE1BQVQ7QUFDRDtBQUNGLENBUkQ7O0FBVUEsRUFBRSxhQUFGLEdBQW1CLFlBQVc7QUFDNUIsTUFBSSxXQUFXLEtBQWY7QUFDQSxTQUFPLFlBQVc7QUFDaEIsUUFBSSxDQUFDLFFBQUwsRUFBZTtBQUNiLGlCQUFXLElBQVg7QUFDQSxhQUFPLEVBQUUsZ0JBQUYsQ0FBbUIsUUFBbkIsRUFBNkIsV0FBN0IsRUFBMEMsVUFBUyxDQUFULEVBQVk7QUFDM0QsWUFBSSxDQUFDLEVBQUUsZ0JBQVAsRUFBeUI7QUFDdkIsY0FBSSxNQUFNLEVBQUMsR0FBRyxFQUFFLE9BQU4sRUFBZSxHQUFHLEVBQUUsT0FBcEIsRUFBNkIsT0FBTyxFQUFFLFdBQUYsQ0FBYyxDQUFkLENBQXBDLEVBQVY7QUFDQSxhQUFHLEtBQUgsQ0FBUyxPQUFULENBQWlCLEdBQUcsTUFBSCxDQUFVLGVBQVYsQ0FBakIsRUFBNkMsR0FBN0MsRUFBa0QsRUFBQyxNQUFNLElBQVAsRUFBbEQ7QUFDQSxjQUFJLElBQUksZ0JBQVIsRUFBMEI7QUFBRSxtQkFBTyxFQUFFLGNBQUYsQ0FBaUIsQ0FBakIsQ0FBUDtBQUE2QjtBQUMxRDtBQUNGLE9BTk0sQ0FBUDtBQU9EO0FBQ0YsR0FYRDtBQVlELENBZGlCLEVBQWxCOztBQWdCQSxFQUFFLGNBQUYsR0FBb0IsWUFBVztBQUM3QixNQUFJLFdBQVcsS0FBZjtBQUNBLFNBQU8sWUFBVztBQUNoQixRQUFJLENBQUMsUUFBRCxJQUFhLEVBQUUsY0FBRixFQUFqQixFQUFxQztBQUNuQyxVQUFJLFVBQUo7QUFBQSxVQUFPLFVBQVA7QUFBQSxVQUFVLFdBQVY7QUFDQSxpQkFBVyxJQUFYO0FBQ0EsVUFBSSxLQUFNLEtBQU0sSUFBSyxJQUFJLENBQXpCOztBQUVBLFVBQUkscUJBQXFCLEVBQUUsUUFBRixDQUFXLFlBQVc7QUFDN0MsWUFBSSxrQkFBSjtBQUNBLFlBQUksUUFBUSxLQUFLLElBQUwsQ0FBVSxDQUFDLEtBQUssQ0FBTixLQUFZLEtBQUssQ0FBakIsQ0FBVixDQUFaO0FBQ0EsWUFBSSxLQUFLLENBQVQsRUFBWTtBQUNWLHNCQUNFLFFBQVMsS0FBSyxFQUFMLEdBQVUsQ0FBbkIsR0FDRSxNQURGLEdBRUUsUUFBUyxDQUFDLEtBQUssRUFBTixHQUFXLENBQXBCLEdBQ0EsSUFEQSxHQUdBLE9BTko7QUFPRCxTQVJELE1BUU87QUFDTCxzQkFDRSxRQUFTLEtBQUssRUFBTCxHQUFVLENBQW5CLEdBQ0UsSUFERixHQUVFLFFBQVMsQ0FBQyxLQUFLLEVBQU4sR0FBVyxDQUFwQixHQUNBLE1BREEsR0FHQSxNQU5KO0FBT0Q7QUFDRCxXQUFHLEtBQUgsQ0FBUyxPQUFULENBQWlCLFlBQWpCLEVBQStCLEVBQUMsSUFBRCxFQUFJLElBQUosRUFBTyxNQUFQLEVBQVcsTUFBWCxFQUEvQjtBQUNBLFdBQUcsS0FBSCxDQUFTLE9BQVQsQ0FBaUIsR0FBRyxNQUFILENBQVUsZUFBVixDQUFqQixFQUE2QyxTQUE3QyxFQUF3RCxFQUFDLE1BQU0sSUFBUCxFQUF4RDtBQUNBLFdBQUcsS0FBSCxDQUFTLE9BQVQsQ0FBaUIsR0FBRyxNQUFILENBQVUsZUFBVixDQUFqQixFQUE2QyxJQUE3QztBQUNBLGVBQU8sSUFBSyxJQUFJLENBQWhCO0FBQ0QsT0F4QndCLEVBeUJ2QixHQXpCdUIsQ0FBekI7O0FBMkJBLGFBQU8sRUFBRSxnQkFBRixDQUFtQixRQUFuQixFQUE2QixXQUE3QixFQUEwQyxVQUFTLENBQVQsRUFBWTtBQUMzRCxhQUFLLENBQUMsRUFBRSxPQUFGLENBQVUsQ0FBVixLQUFnQixJQUFoQixHQUF1QixFQUFFLE9BQUYsQ0FBVSxDQUFWLEVBQWEsS0FBcEMsR0FBNEMsU0FBN0MsS0FBMkQsQ0FBaEU7QUFDQSxhQUFLLENBQUMsRUFBRSxPQUFGLENBQVUsQ0FBVixLQUFnQixJQUFoQixHQUF1QixFQUFFLE9BQUYsQ0FBVSxDQUFWLEVBQWEsS0FBcEMsR0FBNEMsU0FBN0MsS0FBMkQsQ0FBaEU7QUFDQSxZQUFLLE1BQU0sQ0FBUCxJQUFjLE1BQU0sQ0FBeEIsRUFBNEI7QUFDMUIsY0FBSSxFQUFKO0FBQ0EsY0FBSSxFQUFKO0FBQ0Q7O0FBRUQ7QUFDQSxlQUFPLEVBQUUsY0FBRixDQUFpQixDQUFqQixDQUFQO0FBQ0QsT0FWTSxDQUFQO0FBV0Q7QUFDRixHQTdDRDtBQThDRCxDQWhEa0IsRUFBbkI7Ozs7O0lDekRNLEMsR0FBTSxPQUFPLEUsQ0FBYixDOztBQUVOOztBQUVBOztBQUNBLElBQUksY0FBYyw2QkFBbEI7O0FBRUE7QUFDQSxJQUFJLFVBQVUscUJBQWQ7O0FBRUE7QUFDQSxJQUFJLGtCQUFrQixvQkFBdEI7O0FBR0EsRUFBRSxjQUFGLEdBQW1CLFVBQVMsVUFBVCxFQUFxQjtBQUN0QyxNQUFJLFFBQVEsSUFBSSxNQUFKLENBQVcsV0FBWCxDQUFaO0FBQ0EsU0FBTyxJQUFQLEVBQWE7QUFDWCxRQUFJLFFBQVEsTUFBTSxJQUFOLENBQVcsVUFBWCxDQUFaO0FBQ0EsUUFBSSxDQUFDLEtBQUwsRUFBWTtBQUFFO0FBQVE7QUFDdEIsaUJBQWEsV0FBVyxPQUFYLENBQW1CLE1BQU0sQ0FBTixDQUFuQixFQUNSLE1BQU0sQ0FBTixDQURRLHdCQUNrQixNQUFNLENBQU4sQ0FEbEIsWUFDZ0MsTUFBTSxDQUFOLENBRGhDLE9BQWI7QUFFRDtBQUNELFNBQU8sVUFBUDtBQUNELENBVEQ7O0FBV0EsRUFBRSxVQUFGLEdBQWUsVUFBUyxVQUFULEVBQXFCLElBQXJCLEVBQTJCO0FBQ3hDLE1BQUksUUFBUSxJQUFJLE1BQUosQ0FBVyxPQUFYLENBQVo7QUFDQSxTQUFPLElBQVAsRUFBYTtBQUNYLFFBQUksUUFBUSxNQUFNLElBQU4sQ0FBVyxVQUFYLENBQVo7QUFDQSxRQUFJLENBQUMsS0FBTCxFQUFZO0FBQUU7QUFBUTtBQUN0QixRQUFJLFFBQVMsQ0FBQyxDQUFELEtBQU8sS0FBSyxPQUFMLENBQWEsTUFBTSxDQUFOLENBQWIsQ0FBcEIsRUFBNkM7QUFBRSxXQUFLLElBQUwsQ0FBVSxNQUFNLENBQU4sQ0FBVjtBQUFzQjtBQUNyRSxpQkFBYSxXQUFXLE9BQVgsQ0FBbUIsTUFBTSxDQUFOLENBQW5CLEVBQ1IsTUFBTSxDQUFOLENBRFEsb0JBQ2MsTUFBTSxDQUFOLENBRGQsU0FBYjtBQUVEO0FBQ0QsU0FBTyxVQUFQO0FBQ0QsQ0FWRDs7QUFZQSxFQUFFLGlCQUFGLEdBQXNCLFVBQVMsVUFBVCxFQUFxQjtBQUN6QyxNQUFJLFNBQVMsRUFBYjtBQUNBLE1BQUksUUFBUSxJQUFJLE1BQUosQ0FBVyxlQUFYLENBQVo7QUFDQSxTQUFPLElBQVAsRUFBYTtBQUNYLFFBQUksUUFBUSxNQUFNLElBQU4sQ0FBVyxVQUFYLENBQVo7QUFDQSxRQUFJLENBQUMsS0FBTCxFQUFZO0FBQUU7QUFBUTtBQUN0QixRQUFJLE1BQU0sR0FBRyxNQUFILENBQVUsTUFBTSxDQUFOLENBQVYsQ0FBVjtBQUNBLFFBQUksT0FBTyxJQUFYLEVBQWlCO0FBQ2YsbUJBQWEsV0FBVyxPQUFYLENBQW1CLE1BQU0sQ0FBTixDQUFuQixRQUFpQyxHQUFqQyxDQUFiO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsVUFBSSxRQUFRLE1BQU0sS0FBTixHQUFjLE1BQU0sQ0FBTixFQUFTLE1BQXZCLEdBQWdDLENBQTVDO0FBQ0EsZ0JBQVUsV0FBVyxTQUFYLENBQXFCLENBQXJCLEVBQXdCLEtBQXhCLENBQVY7QUFDQSxtQkFBYSxXQUFXLFNBQVgsQ0FBcUIsS0FBckIsQ0FBYjtBQUNEO0FBQ0Y7QUFDRCxTQUFPLFNBQVMsVUFBaEI7QUFDRCxDQWhCRDs7QUFrQkEsRUFBRSxnQkFBRixHQUFxQixVQUFTLFVBQVQsRUFBcUIsSUFBckIsRUFBMkI7QUFDOUMsU0FBTyxLQUFLLFVBQUwsQ0FBZ0IsS0FBSyxjQUFMLENBQW9CLEtBQUssaUJBQUwsQ0FBdUIsVUFBdkIsQ0FBcEIsQ0FBaEIsRUFBeUUsSUFBekUsQ0FBUDtBQUNELENBRkQ7O0FBSUEsRUFBRSxlQUFGLEdBQW9CLFVBQVMsR0FBVCxFQUFjO0FBQ2hDLE1BQUssUUFBUSxNQUFULElBQXFCLFFBQVEsT0FBakMsRUFBMkM7QUFBRSxXQUFPLEtBQVA7QUFBZTtBQUM1RCxNQUFJLFFBQVEsSUFBSSxLQUFKLENBQVUsMkJBQVYsQ0FBWjtBQUNBLFNBQU8sU0FBVSxNQUFNLENBQU4sTUFBYSxHQUE5QjtBQUNELENBSkQ7O0FBTUEsRUFBRSxvQkFBRixHQUF5QixVQUFTLEdBQVQsRUFBYztBQUNyQyxNQUFJLFFBQVEsSUFBSSxLQUFKLENBQVUsaUJBQVYsQ0FBWjtBQUNBLFNBQU8sU0FBVSxNQUFNLENBQU4sTUFBYSxHQUE5QjtBQUNELENBSEQ7O0FBS0EsRUFBRSxHQUFGLEdBQVEsVUFBUyxHQUFULEVBQWMsT0FBZCxFQUF1QjtBQUM3QixNQUFJLGNBQUo7QUFDQSxNQUFJLE9BQU8sUUFBUSxLQUFSLENBQWMsR0FBZCxDQUFYO0FBQ0EsT0FBSyxJQUFJLFFBQVEsQ0FBakIsRUFBb0IsUUFBUSxLQUFLLE1BQWpDLEVBQXlDLE9BQXpDLEVBQWtEO0FBQ2hELFFBQUksTUFBTSxLQUFLLEtBQUwsQ0FBVjtBQUNBLFFBQUksVUFBVSxDQUFkLEVBQWlCO0FBQ2YsY0FBUSxJQUFJLEdBQUosQ0FBUjtBQUNELEtBRkQsTUFFTyxJQUFJLEtBQUosRUFBVztBQUNoQixjQUFRLE1BQU0sR0FBTixDQUFSO0FBQ0QsS0FGTSxNQUVBO0FBQ0w7QUFDRDtBQUNGO0FBQ0QsU0FBTyxLQUFQO0FBQ0QsQ0FkRDs7QUFnQkEsRUFBRSxnQkFBRixHQUFxQjtBQUFBLFNBQWMsU0FBUyxHQUFHLEtBQUgsQ0FBUyxHQUFULENBQWdCLEdBQUcsTUFBSCxDQUFVLFlBQVYsQ0FBaEIsU0FBMkMsVUFBM0MsZUFBdkI7QUFBQSxDQUFyQjs7QUFFQSxFQUFFLFNBQUYsR0FBYyxVQUFTLE9BQVQsRUFBa0I7QUFDOUIsTUFBSSxPQUFPLFFBQVEsS0FBUixDQUFjLEdBQWQsQ0FBWDtBQUNDLE9BQUssR0FBTjtBQUNBLFNBQU8sS0FBSyxJQUFMLENBQVUsR0FBVixDQUFQO0FBQ0QsQ0FKRDs7QUFNQSxFQUFFLE9BQUYsR0FBWSxVQUFTLE9BQVQsRUFBa0I7QUFDNUIsTUFBSSxPQUFPLFFBQVEsS0FBUixDQUFjLEdBQWQsQ0FBWDtBQUNBLFNBQU8sS0FBSyxLQUFLLE1BQUwsR0FBYyxDQUFuQixDQUFQO0FBQ0QsQ0FIRDs7QUFLQSxFQUFFLFFBQUYsR0FBYSxVQUFTLE9BQVQsRUFBa0I7QUFDN0IsTUFBSSxPQUFPLFFBQVEsS0FBUixDQUFjLEdBQWQsQ0FBWDtBQUNBLE1BQUksTUFBTyxLQUFLLEdBQU4sRUFBVjtBQUNBLE1BQUksWUFBWSxLQUFLLElBQUwsQ0FBVSxHQUFWLENBQWhCO0FBQ0EsU0FBTyxFQUFDLFFBQUQsRUFBTSxvQkFBTixFQUFQO0FBQ0QsQ0FMRDs7Ozs7SUNuR00sQyxHQUFNLE9BQU8sRSxDQUFiLEM7O0FBRU47O0FBRUE7O0FBQ0EsSUFBSSxrQkFBa0IsZUFBdEI7QUFDQSxJQUFJLGNBQWMsNkJBQWxCO0FBQ0EsSUFBSSxpQkFBaUIsaUJBQXJCOztBQUVBLEVBQUUsUUFBRixHQUFhLFVBQVMsR0FBVCxFQUFjO0FBQ3pCLE1BQUksYUFBSjtBQUNBLE1BQUksQ0FBQyxHQUFELElBQVEsQ0FBQyxFQUFFLFFBQUYsQ0FBVyxHQUFYLENBQWIsRUFBOEI7QUFBRSxXQUFPLEdBQVA7QUFBYTtBQUM3QyxNQUFJLFVBQVUsSUFBSSxLQUFKLENBQVUsY0FBVixDQUFkO0FBQ0EsTUFBSSxRQUFRLFdBQVcsUUFBUSxDQUFSLENBQXZCO0FBQ0EsTUFBSSxLQUFKLEVBQVc7QUFDVCxRQUFJLFVBQVUsTUFBTSxTQUFOLENBQWdCLENBQWhCLEVBQW1CLE1BQU0sTUFBTixHQUFlLENBQWxDLENBQWQ7QUFDQSxRQUFJLE9BQU8sSUFBSSxTQUFKLENBQWMsTUFBTSxNQUFwQixDQUFYO0FBQ0EsV0FBTyxJQUFJLE1BQUosQ0FBVyxPQUFYLEVBQW9CLElBQXBCLENBQVA7QUFDRDtBQUNELFNBQU8sUUFBUSxHQUFmO0FBQ0QsQ0FYRDs7QUFhQSxFQUFFLFlBQUYsR0FBaUIsVUFBUyxNQUFULEVBQWlCLFFBQWpCLEVBQTJCO0FBQzFDLE1BQUksVUFBVSxJQUFkLEVBQW9CO0FBQUUsYUFBUyxFQUFUO0FBQWM7QUFDcEMsU0FBTyxFQUFFLEdBQUYsQ0FBTSxPQUFPLEtBQVAsQ0FBYSxRQUFiLENBQU4sRUFBOEI7QUFBQSxXQUFTLE1BQU0sSUFBTixFQUFUO0FBQUEsR0FBOUIsQ0FBUDtBQUNELENBSEQ7O0FBS0E7Ozs7QUFJQSxFQUFFLGFBQUYsR0FBa0IsVUFBUyxNQUFULEVBQWlCLFVBQWpCLEVBQTZCLE1BQTdCLEVBQXFDLElBQXJDLEVBQTJDO0FBQzNELE1BQUksVUFBVSxJQUFkLEVBQW9CO0FBQUUsYUFBUyxHQUFUO0FBQWU7QUFDckMsTUFBSSxRQUFRLElBQVosRUFBa0I7QUFBRSxXQUFPLEVBQVA7QUFBWTtBQUNoQyxNQUFJLFFBQVEsT0FBTyxLQUFQLENBQWEsVUFBYixDQUFaO0FBQ0EsTUFBSSxRQUFRLElBQUksTUFBSixDQUFjLE1BQWQsV0FBWjtBQUNBLE1BQUksTUFBTSxFQUFWOztBQUwyRDtBQUFBO0FBQUE7O0FBQUE7QUFPM0QseUJBQW9CLE1BQU0sSUFBTixDQUFXLEtBQVgsQ0FBcEIsOEhBQXVDO0FBQUEsVUFBOUIsT0FBOEI7O0FBQ3JDLFVBQUksT0FBTyxRQUFRLEtBQVIsQ0FBYyxLQUFkLENBQVg7QUFDQSxVQUFJLE1BQU0sS0FBSyxDQUFMLEVBQVEsSUFBUixFQUFWO0FBQ0EsVUFBSSxRQUFRLEtBQUssQ0FBTCxDQUFaOztBQUVBLFVBQUksS0FBSyxlQUFULEVBQTBCO0FBQUUsY0FBTSxJQUFJLFdBQUosRUFBTjtBQUEwQjtBQUN0RCxVQUFJLEtBQUssSUFBVCxFQUFlO0FBQUUsZ0JBQVEsU0FBUyxNQUFNLElBQU4sRUFBakI7QUFBZ0M7QUFDakQsVUFBSyxLQUFLLE9BQUwsSUFBZ0IsSUFBakIsSUFBMkIsU0FBUyxJQUF4QyxFQUErQztBQUFFLGdCQUFRLEtBQUssT0FBYjtBQUF1Qjs7QUFFeEUsVUFBSSxRQUFRLEVBQVosRUFBZ0I7QUFBRSxZQUFJLEdBQUosSUFBVyxLQUFYO0FBQW1CO0FBQ3RDO0FBakIwRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQWtCM0QsU0FBTyxHQUFQO0FBQ0QsQ0FuQkQ7O0FBcUJBLEVBQUUsZUFBRixHQUFvQixVQUFTLElBQVQsRUFBZTtBQUNqQyxNQUFJLGdCQUFKO0FBQ0EsTUFBSSxVQUFVLEtBQUssS0FBTCxDQUFXLFdBQVgsQ0FBZCxFQUF1QztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUNyQyw0QkFBa0IsTUFBTSxJQUFOLENBQVcsT0FBWCxDQUFsQixtSUFBdUM7QUFBQSxZQUE5QixLQUE4Qjs7QUFDckMsZUFBTyxLQUFLLE9BQUwsQ0FBYSxLQUFiLHNCQUFzQyxNQUFNLFNBQU4sQ0FBZ0IsQ0FBaEIsQ0FBdEMsQ0FBUDtBQUNEO0FBSG9DO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFJdEM7QUFDRCxTQUFPLElBQVA7QUFDRCxDQVJEOztBQVVBLEVBQUUsa0JBQUYsR0FBdUIsVUFBUyxJQUFULEVBQWUsUUFBZixFQUF5QixPQUF6QixFQUFrQztBQUN2RCxNQUFJLGdCQUFKO0FBQ0EsTUFBSSxXQUFXLElBQWYsRUFBcUI7QUFBRSxjQUFVLElBQVY7QUFBaUI7QUFDeEMsTUFBSSxVQUFVLEtBQUssS0FBTCxDQUFXLGVBQVgsQ0FBZCxFQUEyQztBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUN6Qyw0QkFBa0IsTUFBTSxJQUFOLENBQVcsT0FBWCxDQUFsQixtSUFBdUM7QUFBQSxZQUE5QixLQUE4Qjs7QUFDckMsWUFBSSxPQUFPLE1BQU0sU0FBTixDQUFnQixDQUFoQixFQUFtQixNQUFNLE1BQU4sR0FBZSxDQUFsQyxFQUFxQyxJQUFyQyxFQUFYO0FBQ0EsWUFBSSxRQUFRLFNBQVMsSUFBVCxDQUFjLE9BQWQsRUFBdUIsSUFBdkIsQ0FBWjtBQUNBLGVBQU8sS0FBSyxPQUFMLENBQWEsS0FBYixFQUFxQixTQUFTLElBQVYsR0FBa0IsS0FBbEIsR0FBMEIsRUFBOUMsQ0FBUDtBQUNEO0FBTHdDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFNMUM7QUFDRCxTQUFPLElBQVA7QUFDRCxDQVhEOztBQWFBO0FBQ0EsRUFBRSxXQUFGLEdBQWdCO0FBQUEsU0FDZCxFQUFFLE1BQUYsQ0FBUyxFQUFFLGFBQUYsQ0FBZ0IsTUFBaEIsRUFBd0IsR0FBeEIsRUFBNkIsR0FBN0IsQ0FBVCxFQUE0QyxVQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQjtBQUM1RCxNQUFFLElBQUYsQ0FBTyxFQUFFLEtBQUYsQ0FBUSxHQUFSLENBQVAsRUFBcUI7QUFBQSxhQUFPLEVBQUUsSUFBSSxJQUFKLEVBQUYsSUFBZ0IsQ0FBdkI7QUFBQSxLQUFyQjtBQUNBLFdBQU8sQ0FBUDtBQUNELEdBSEQsRUFJRSxFQUpGLENBRGM7QUFBQSxDQUFoQjs7QUFRQSxFQUFFLGVBQUYsR0FBb0IsVUFBUyxNQUFULEVBQWlCO0FBQ25DLE1BQUksVUFBVSxJQUFkLEVBQW9CO0FBQUUsYUFBUyxFQUFUO0FBQWM7QUFDcEMsV0FBVSxPQUFPLElBQVIsRUFBVDtBQUNBLE1BQUksQ0FBQyxNQUFMLEVBQWE7QUFBRSxXQUFPLEVBQVA7QUFBWTtBQUMzQixNQUFJLE9BQU8sQ0FBUCxNQUFjLEdBQWxCLEVBQXVCO0FBQ3JCLFdBQU8sS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFQO0FBQ0QsR0FGRCxNQUVPO0FBQ0wsYUFBUyxPQUFPLE9BQVAsQ0FBZSxJQUFmLEVBQXFCLEdBQXJCLENBQVQ7QUFDQSxtQkFBYSxNQUFiO0FBQ0EsV0FBTyxLQUFLLEtBQUwsQ0FBVyxPQUFPLE9BQVAsQ0FBZSxxQkFBZixFQUFzQyxVQUF0QyxDQUFYLENBQVA7QUFDRDtBQUNGLENBWEQ7O0FBYUEsRUFBRSxzQkFBRixHQUEyQixVQUFTLE1BQVQsRUFBaUI7QUFDMUMsTUFBSSxVQUFVLElBQWQsRUFBb0I7QUFBRSxhQUFTLEVBQVQ7QUFBYztBQUNwQyxNQUFJLGFBQWEsS0FBakI7QUFDQSxTQUFPLEVBQUUsTUFBRixDQUFTLE9BQU8sS0FBUCxDQUFhLEdBQWIsQ0FBVCxFQUE0QixVQUFTLE1BQVQsRUFBaUIsSUFBakIsRUFBdUI7QUFDeEQsUUFBSSxtQkFBSjtBQUNBLFFBQUksY0FBZSxPQUFPLE1BQVAsR0FBZ0IsQ0FBbkMsRUFBdUM7QUFDckMsbUJBQWdCLE9BQU8sT0FBTyxNQUFQLEdBQWdCLENBQXZCLENBQWhCLFdBQStDLElBQS9DO0FBQ0EsYUFBTyxNQUFQLEdBQWdCLE9BQU8sTUFBUCxHQUFnQixDQUFoQztBQUNEOztBQUVELGlCQUFhLEtBQUssTUFBTCxLQUFnQixDQUE3QjtBQUNBLFFBQUksVUFBSixFQUFnQjtBQUFFLGFBQU8sVUFBUDtBQUFvQjs7QUFFdEMsUUFBSSxLQUFLLE1BQUwsS0FBZ0IsQ0FBcEIsRUFBdUI7QUFBRSxhQUFPLElBQVAsQ0FBWSxLQUFLLElBQUwsRUFBWjtBQUEyQjtBQUNwRCxXQUFPLE1BQVA7QUFDRCxHQVpNLEVBYUwsRUFiSyxDQUFQO0FBY0QsQ0FqQkQ7O0FBbUJBLEVBQUUsZUFBRixHQUFvQixVQUFTLE1BQVQsRUFBaUI7QUFDbkMsTUFBSSxRQUFRLE9BQU8sS0FBUCxDQUFhLEdBQWIsQ0FBWjtBQUNBLE1BQUksTUFBTSxNQUFOLEdBQWUsQ0FBbkIsRUFBc0I7QUFDcEIsUUFBSSxPQUFPLEVBQUUsWUFBRixDQUFlLE1BQU0sS0FBTixFQUFmLEVBQThCLEdBQTlCLENBQVg7QUFDQSxXQUFPLEVBQUMsTUFBTSxNQUFNLENBQU4sQ0FBUCxFQUFpQixPQUFPLEtBQUssQ0FBTCxDQUF4QixFQUFpQyxNQUFNLEtBQUssQ0FBTCxDQUF2QyxFQUFQO0FBQ0QsR0FIRCxNQUdPO0FBQ0wsV0FBTyxFQUFDLE1BQU0sTUFBTSxDQUFOLENBQVAsRUFBUDtBQUNEO0FBQ0YsQ0FSRDs7QUFVQSxFQUFFLGlCQUFGLEdBQXNCLFVBQVMsT0FBVCxFQUFrQjtBQUN0QyxNQUFJLFFBQVEsUUFBUSxLQUFSLENBQWMsR0FBZCxDQUFaO0FBQ0EsU0FBTyxFQUFFLEdBQUYsQ0FBTSxLQUFOLEVBQWEsVUFBUyxJQUFULEVBQWU7QUFDakMsUUFBSSxhQUFKO0FBQ0EsUUFBSSxZQUFZLEVBQUUsc0JBQUYsQ0FBeUIsSUFBekIsQ0FBaEI7QUFDQSxRQUFJLE9BQVEsVUFBVSxLQUFYLE1BQXVCLEVBQWxDO0FBQ0EsV0FBTyxLQUFLLEtBQUwsQ0FBVyxRQUFYLENBQVA7QUFDQSxRQUFJLFFBQVEsS0FBSyxDQUFMLEVBQVEsSUFBUixFQUFaO0FBQ0EsUUFBSSxTQUFTLEtBQUssU0FBTCxDQUFlLE1BQU0sTUFBckIsRUFBNkIsSUFBN0IsRUFBYjtBQUNBLFFBQUksT0FBTyxDQUFQLE1BQWMsR0FBbEIsRUFBdUI7QUFBRSxlQUFTLE9BQU8sU0FBUCxDQUFpQixDQUFqQixDQUFUO0FBQStCO0FBQ3hELFFBQUksT0FBTyxLQUFLLENBQUwsQ0FBWCxFQUFvQjtBQUNsQixVQUFJLENBQUMsQ0FBRCxLQUFPLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBWCxFQUE2QjtBQUMzQixlQUFPLEVBQUUsYUFBRixDQUFnQixJQUFoQixFQUFzQixHQUF0QixFQUEyQixHQUEzQixFQUFnQyxFQUFDLE1BQU0sSUFBUCxFQUFoQyxDQUFQO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsZUFBTyxFQUFDLEtBQUssSUFBTixFQUFQO0FBQ0Q7QUFDRjtBQUNELFdBQU8sRUFBQyxZQUFELEVBQVEsVUFBUixFQUFjLG9CQUFkLEVBQXlCLGNBQXpCLEVBQVA7QUFDSCxHQWhCUSxDQUFQO0FBaUJELENBbkJEOztBQXFCQSxFQUFFLGtCQUFGLEdBQXVCLFVBQVMsT0FBVCxFQUFrQjtBQUN2QyxNQUFJLGFBQUo7QUFDQSxNQUFJLFNBQVMsRUFBRSxzQkFBRixDQUF5QixPQUF6QixDQUFiO0FBQ0EsTUFBSSxPQUFPLENBQVAsQ0FBSixFQUFlO0FBQUUsV0FBTyxFQUFFLGVBQUYsQ0FBa0IsT0FBTyxDQUFQLENBQWxCLENBQVA7QUFBc0M7QUFDdkQsU0FBTyxFQUFDLE1BQU0sT0FBTyxDQUFQLENBQVAsRUFBa0IsVUFBbEIsRUFBUDtBQUNELENBTEQ7O0FBT0EsRUFBRSxnQkFBRixHQUFxQixVQUFTLE9BQVQsRUFBa0I7QUFDckMsTUFBSSxhQUFKO0FBQ0EsTUFBSSxTQUFTLEVBQUUsc0JBQUYsQ0FBeUIsT0FBekIsQ0FBYjtBQUNBLE1BQUksT0FBTyxDQUFQLENBQUosRUFBZTtBQUFFLFdBQU8sRUFBRSxlQUFGLENBQWtCLE9BQU8sQ0FBUCxDQUFsQixDQUFQO0FBQXNDO0FBQ3ZELE1BQUksT0FBTyxFQUFFLGFBQUYsQ0FBZ0IsT0FBTyxDQUFQLENBQWhCLEVBQTJCLEdBQTNCLEVBQWdDLEdBQWhDLEVBQXFDLEVBQUMsTUFBTSxJQUFQLEVBQXJDLENBQVg7QUFDQSxTQUFPLEVBQUMsVUFBRCxFQUFPLFVBQVAsRUFBUDtBQUNELENBTkQ7O0FBUUEsRUFBRSxvQkFBRixHQUF5QixVQUFTLFFBQVQsRUFBbUIsSUFBbkIsRUFBeUI7QUFDaEQsTUFBSSxjQUFjLFFBQWxCO0FBQ0EsTUFBSSxRQUFRLEtBQUssUUFBakIsRUFBMkI7QUFDekIsa0JBQWMsRUFBRSxRQUFGLENBQVcsV0FBWCxFQUF3QixLQUFLLFFBQTdCLENBQWQ7QUFDRDs7QUFFRCxNQUFJLFFBQVEsS0FBSyxhQUFqQixFQUFnQztBQUM5QixrQkFBYyxFQUFFLGFBQUYsQ0FBZ0IsV0FBaEIsRUFBNkIsS0FBSyxhQUFsQyxDQUFkO0FBQ0Q7O0FBRUQsTUFBSSxRQUFRLEtBQUssT0FBakIsRUFBMEI7QUFDeEIsa0JBQWMsRUFBRSxPQUFGLENBQVUsV0FBVixFQUF1QixLQUFLLE9BQTVCLENBQWQ7QUFDRDs7QUFFRCxNQUFJLFFBQVEsS0FBSyxLQUFqQixFQUF3QjtBQUN0QixrQkFBYyxFQUFFLE9BQUYsQ0FBVSxXQUFWLEVBQXVCLENBQXZCLENBQWQ7QUFDRDs7QUFFRCxTQUFPLFdBQVA7QUFDRCxDQW5CRDs7QUFxQkEsRUFBRSxRQUFGLEdBQWEsVUFBUyxNQUFULEVBQWlCLFlBQWpCLEVBQStCLElBQS9CLEVBQXFDO0FBQ2hELE1BQUksUUFBUSxJQUFaLEVBQWtCO0FBQUUsV0FBTyxFQUFQO0FBQVk7QUFDaEMsTUFBSyxVQUFVLElBQVgsSUFBcUIsV0FBVyxFQUFwQyxFQUF5QztBQUN2QyxXQUFPLFNBQVMsTUFBVCxFQUFpQixJQUFqQixDQUFQO0FBQ0QsR0FGRCxNQUVPLElBQUksZ0JBQWdCLElBQXBCLEVBQTBCO0FBQy9CLFdBQU8sWUFBUDtBQUNELEdBRk0sTUFFQTtBQUNMLFdBQU8sTUFBUDtBQUNEO0FBQ0YsQ0FURDs7Ozs7SUN2TE0sQyxHQUFNLE9BQU8sRSxDQUFiLEM7OztBQUVOLEVBQUUsZUFBRixHQUFvQixVQUFTLEdBQVQsRUFBYztBQUFFLE1BQUksT0FBTyxJQUFYLEVBQWlCO0FBQUUsVUFBTSxFQUFOO0FBQVcsR0FBQyxPQUFPLEVBQUUsR0FBRixDQUFNLEdBQU4sRUFBVztBQUFBLFdBQU0sR0FBRyxVQUFILENBQWMsQ0FBZCxJQUFtQixHQUF6QjtBQUFBLEdBQVgsQ0FBUDtBQUFrRCxDQUFySDs7Ozs7SUNGTSxDLEdBQU0sT0FBTyxFLENBQWIsQztJQUNBLE0sR0FBVyxPQUFPLEUsQ0FBbEIsTTs7O0FBR04sRUFBRSxrQkFBRixHQUF1QixVQUFTLEdBQVQsRUFBYyxVQUFkLEVBQTBCLE1BQTFCLEVBQWtDO0FBQ3ZELE1BQUksY0FBYyxJQUFsQixFQUF3QjtBQUFFLGlCQUFhLEdBQWI7QUFBbUI7QUFDN0MsTUFBSSxVQUFVLElBQWQsRUFBb0I7QUFBRSxhQUFTLEdBQVQ7QUFBZTtBQUNyQyxTQUFPLEVBQUUsTUFBRixDQUFTLEdBQVQsRUFBYyxVQUFTLE1BQVQsRUFBaUIsS0FBakIsRUFBd0IsR0FBeEIsRUFBNkI7QUFDaEQsUUFBSSxTQUFTLElBQWIsRUFBbUI7QUFDakIsVUFBSSxPQUFPLE1BQVAsR0FBZ0IsQ0FBcEIsRUFBdUI7QUFBRSxrQkFBVSxVQUFWO0FBQXVCO0FBQ2hELHFCQUFhLEdBQWIsR0FBbUIsTUFBbkIsR0FBNEIsbUJBQW1CLEtBQW5CLENBQTVCO0FBQ0Q7QUFDRCxXQUFPLE1BQVA7QUFDRCxHQU5NLEVBT0wsRUFQSyxDQUFQO0FBUUQsQ0FYRDs7QUFhQSxFQUFFLGtCQUFGLEdBQXVCLFVBQVMsTUFBVCxFQUFpQixVQUFqQixFQUE2QixNQUE3QixFQUFxQztBQUMxRCxNQUFJLGNBQWMsSUFBbEIsRUFBd0I7QUFBRSxpQkFBYSxHQUFiO0FBQW1CO0FBQzdDLE1BQUksVUFBVSxJQUFkLEVBQW9CO0FBQUUsYUFBUyxHQUFUO0FBQWU7QUFDckMsTUFBSSxNQUFNLEVBQUUsYUFBRixDQUFnQixNQUFoQixFQUF3QixVQUF4QixFQUFvQyxNQUFwQyxFQUE0QyxFQUFDLFNBQVMsRUFBVixFQUE1QyxDQUFWO0FBQ0EsSUFBRSxJQUFGLENBQU8sR0FBUCxFQUFZLFVBQUMsS0FBRCxFQUFRLEdBQVI7QUFBQSxXQUFnQixJQUFJLEdBQUosSUFBVyxtQkFBbUIsS0FBbkIsQ0FBM0I7QUFBQSxHQUFaO0FBQ0EsU0FBTyxHQUFQO0FBQ0QsQ0FORDs7QUFRQSxFQUFFLFNBQUYsR0FBYyxVQUFTLEtBQVQsRUFBZ0I7QUFDNUIsTUFBSSxTQUFTLElBQWIsRUFBbUI7QUFBRSxZQUFRLFNBQVMsTUFBVCxDQUFnQixTQUFoQixDQUEwQixDQUExQixDQUFSO0FBQXVDO0FBQzVELFNBQU8sRUFBRSxrQkFBRixDQUFxQixLQUFyQixDQUFQO0FBQ0QsQ0FIRDs7QUFLQSxFQUFFLFFBQUYsR0FBYSxVQUFTLEdBQVQsRUFBYyxLQUFkLEVBQXFCO0FBQ2hDLE1BQUksU0FBUyxJQUFiLEVBQW1CO0FBQUUsWUFBUSxTQUFTLE1BQVQsQ0FBZ0IsU0FBaEIsQ0FBMEIsQ0FBMUIsQ0FBUjtBQUF1QztBQUM1RCxTQUFPLE9BQU8sRUFBRSxTQUFGLENBQVksS0FBWixFQUFtQixHQUFuQixDQUFkO0FBQ0QsQ0FIRDs7QUFLQSxFQUFFLFVBQUYsR0FBZSxVQUFTLElBQVQsRUFBZTtBQUM1QixNQUFJLFFBQVEsSUFBWixFQUFrQjtBQUFFLFdBQU8sU0FBUyxJQUFULENBQWMsU0FBZCxDQUF3QixDQUF4QixDQUFQO0FBQW9DO0FBQ3hELFNBQU8sRUFBRSxrQkFBRixDQUFxQixJQUFyQixDQUFQO0FBQ0QsQ0FIRDs7QUFLQSxFQUFFLFNBQUYsR0FBYztBQUFBLFNBQU8sT0FBTyxFQUFFLFVBQUYsR0FBZSxHQUFmLENBQWQ7QUFBQSxDQUFkOztBQUVBLEVBQUUsYUFBRixHQUFrQixVQUFTLFNBQVQsRUFBb0IsWUFBcEIsRUFBa0M7QUFDbEQsTUFBSSxTQUFTLEVBQUUsTUFBRixDQUFTLEVBQVQsRUFBYSxFQUFFLFVBQUYsRUFBYixFQUE2QixTQUE3QixDQUFiO0FBQ0EsTUFBSSxPQUFPLEVBQUUsa0JBQUYsQ0FBcUIsTUFBckIsQ0FBWDtBQUNBLE1BQUksS0FBSyxNQUFMLEdBQWMsQ0FBbEIsRUFBcUI7QUFBRSxpQkFBVyxJQUFYO0FBQW9COztBQUUzQyxNQUFJLFlBQUosRUFBa0I7QUFDaEIsV0FBTyxTQUFTLElBQVQsR0FBZ0IsSUFBdkI7QUFDRCxHQUZELE1BRU8sSUFBSyxTQUFTLEVBQVYsSUFBa0IsU0FBUyxJQUFULEtBQWtCLElBQXhDLEVBQStDO0FBQ3BELFdBQU8sU0FBUyxPQUFULENBQWlCLElBQWpCLENBQVA7QUFDRDtBQUNGLENBVkQ7O0FBWUEsRUFBRSxrQkFBRixHQUF1QixVQUFDLE9BQUQsRUFBVSxZQUFWO0FBQUEsU0FBMkIsRUFBRSxLQUFGLENBQVE7QUFBQSxXQUFNLEVBQUUsYUFBRixDQUFnQixPQUFoQixFQUF5QixZQUF6QixDQUFOO0FBQUEsR0FBUixDQUEzQjtBQUFBLENBQXZCOztBQUVBLEVBQUUsa0JBQUYsR0FBdUIsVUFBUyxHQUFULEVBQWMsU0FBZCxFQUF5QixPQUF6QixFQUFrQztBQUN2RCxNQUFJLGVBQUo7QUFDQSxNQUFJLFFBQVEsSUFBSSxPQUFKLENBQVksU0FBWixDQUFaO0FBQ0EsTUFBSSxVQUFVLENBQUMsQ0FBZixFQUFrQjtBQUNoQixRQUFJLE1BQU0sSUFBSSxPQUFKLENBQVksT0FBWixDQUFWO0FBQ0EsUUFBSSxNQUFNLEtBQVYsRUFBaUI7QUFBRSxZQUFNLElBQUksTUFBVjtBQUFtQjtBQUN0QyxrQkFBWSxJQUFJLFNBQUosQ0FBYyxDQUFkLEVBQWlCLEtBQWpCLENBQVosR0FBc0MsSUFBSSxTQUFKLENBQWMsR0FBZCxFQUFtQixJQUFJLE1BQXZCLENBQXRDO0FBQ0Q7QUFDRCxTQUFPLFVBQVUsR0FBakI7QUFDRCxDQVREOztBQVdBLEVBQUUsVUFBRixHQUFlLFVBQVMsR0FBVCxFQUFjO0FBQzNCLE1BQUksT0FBTyxJQUFYLEVBQWlCO0FBQUUsVUFBTSxTQUFTLFFBQVQsQ0FBa0IsSUFBeEI7QUFBK0I7QUFDbEQsU0FBTyxFQUFFLGtCQUFGLENBQXFCLEdBQXJCLEVBQTBCLEdBQTFCLEVBQStCLEdBQS9CLENBQVA7QUFDRCxDQUhEOztBQUtBLEVBQUUsYUFBRixHQUFrQixVQUFTLEdBQVQsRUFBYztBQUM5QixNQUFJLE9BQU8sSUFBWCxFQUFpQjtBQUFFLFVBQU0sU0FBUyxRQUFULENBQWtCLElBQXhCO0FBQStCO0FBQ2xELFNBQU8sRUFBRSxrQkFBRixDQUFxQixHQUFyQixFQUEwQixHQUExQixFQUErQixHQUEvQixDQUFQO0FBQ0QsQ0FIRDs7QUFLQSxFQUFFLG9CQUFGLEdBQXlCLFVBQVMsR0FBVCxFQUFjLFNBQWQsRUFBeUIsT0FBekIsRUFBa0M7QUFDekQsTUFBSSxrQkFBSjtBQUNBLE1BQUksUUFBUSxJQUFJLE9BQUosQ0FBWSxTQUFaLENBQVo7QUFDQSxNQUFJLFVBQVUsQ0FBQyxDQUFmLEVBQWtCO0FBQ2hCLFFBQUksTUFBTSxJQUFJLE9BQUosQ0FBWSxPQUFaLENBQVY7QUFDQSxRQUFJLE1BQU0sS0FBVixFQUFpQjtBQUFFLFlBQU0sSUFBSSxNQUFWO0FBQW1CO0FBQ3RDLGdCQUFZLElBQUksU0FBSixDQUFjLFFBQVEsQ0FBdEIsRUFBeUIsR0FBekIsQ0FBWjtBQUNEO0FBQ0QsU0FBTyxhQUFhLEVBQXBCO0FBQ0QsQ0FURDs7QUFXQSxFQUFFLGtCQUFGLEdBQXVCLFVBQVMsR0FBVCxFQUFjO0FBQ25DLE1BQUksT0FBTyxJQUFYLEVBQWlCO0FBQUUsVUFBTSxTQUFTLFFBQVQsQ0FBa0IsSUFBeEI7QUFBK0I7QUFDbEQsU0FBTyxFQUFFLG9CQUFGLENBQXVCLEdBQXZCLEVBQTRCLEdBQTVCLEVBQWlDLEdBQWpDLENBQVA7QUFDRCxDQUhEOztBQUtBLEVBQUUsaUJBQUYsR0FBc0IsVUFBUyxHQUFULEVBQWM7QUFDbEMsTUFBSSxPQUFPLElBQVgsRUFBaUI7QUFBRSxVQUFNLFNBQVMsUUFBVCxDQUFrQixJQUF4QjtBQUErQjtBQUNsRCxTQUFPLEVBQUUsb0JBQUYsQ0FBdUIsR0FBdkIsRUFBNEIsR0FBNUIsRUFBaUMsR0FBakMsQ0FBUDtBQUNELENBSEQ7O0FBTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUUsY0FBRixHQUFtQixVQUFDLFFBQUQsRUFBVyxNQUFYO0FBQUEsU0FBc0IsRUFBdEI7QUFBQSxDQUFuQjs7QUFFQSxJQUFJLGtCQUFrQixTQUFsQixlQUFrQixDQUFTLFFBQVQsRUFBbUIsUUFBbkIsRUFBNkIsU0FBN0IsRUFBd0M7QUFDNUQsTUFBSSxhQUFhLElBQWpCLEVBQXVCO0FBQUUsZ0JBQVksR0FBWjtBQUFrQjtBQUMzQyxVQUFRLFFBQVI7QUFDRSxTQUFLLEdBQUw7QUFBVSxhQUFPLFFBQVA7QUFDVixTQUFLLElBQUw7QUFBVyxhQUFPLFNBQVMsU0FBVCxDQUFtQixDQUFuQixFQUFzQixTQUFTLFdBQVQsQ0FBcUIsU0FBckIsQ0FBdEIsQ0FBUDtBQUNYO0FBQVMsYUFBTyxXQUFXLFNBQVgsR0FBdUIsUUFBOUI7QUFIWDtBQUtELENBUEQ7O0FBU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFLGNBQUYsR0FBbUIsVUFBUyxRQUFULEVBQW1CLFVBQW5CLEVBQStCLFNBQS9CLEVBQTBDO0FBQzNELE1BQUksYUFBYSxJQUFqQixFQUF1QjtBQUFFLGdCQUFZLEdBQVo7QUFBa0I7QUFDM0MsYUFBVyxTQUFTLFNBQVQsQ0FBbUIsQ0FBbkIsRUFBc0IsU0FBUyxXQUFULENBQXFCLFNBQXJCLENBQXRCLENBQVg7QUFDQSxNQUFJLFFBQVEsV0FBVyxLQUFYLENBQWlCLFNBQWpCLENBQVo7O0FBSDJEO0FBQUE7QUFBQTs7QUFBQTtBQUszRCx5QkFBaUIsTUFBTSxJQUFOLENBQVcsS0FBWCxDQUFqQiw4SEFBb0M7QUFBQSxVQUEzQixJQUEyQjs7QUFDbEMsVUFBSSxLQUFLLE1BQUwsR0FBYyxDQUFsQixFQUFxQjtBQUNuQixtQkFBVyxnQkFBZ0IsUUFBaEIsRUFBMEIsSUFBMUIsRUFBZ0MsU0FBaEMsQ0FBWDtBQUNEO0FBQ0Y7QUFUMEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFXM0QsU0FBTyxXQUFXLFNBQWxCO0FBQ0QsQ0FaRDs7QUFjQSxFQUFFLE1BQUYsR0FBVyxVQUFTLEdBQVQsRUFBYztBQUN2QixNQUFJLGVBQUo7QUFDQSxNQUFJLFFBQVEsSUFBSSxPQUFKLENBQVksR0FBWixDQUFaO0FBQ0EsTUFBSSxVQUFVLENBQUMsQ0FBZixFQUFrQjtBQUFFLGFBQVMsSUFBSSxTQUFKLENBQWMsQ0FBZCxFQUFpQixRQUFRLENBQXpCLEVBQTRCLFdBQTVCLEdBQTBDLElBQTFDLEVBQVQ7QUFBNEQ7QUFDaEYsU0FBTyxNQUFQO0FBQ0QsQ0FMRDs7QUFPQSxFQUFFLFFBQUYsR0FBYSxVQUFTLEdBQVQsRUFBYztBQUN6QixNQUFJLGlCQUFKO0FBQ0EsTUFBSSxRQUFRLElBQUksSUFBSixHQUFXLE9BQVgsQ0FBbUIsR0FBbkIsQ0FBWjtBQUNBLE1BQUksVUFBVSxDQUFDLENBQWYsRUFBa0I7QUFBRSxlQUFXLElBQUksU0FBSixDQUFjLENBQWQsRUFBaUIsUUFBUSxDQUF6QixFQUE0QixXQUE1QixFQUFYO0FBQXVEO0FBQzNFLE1BQUksUUFBSixFQUFjO0FBQ1osUUFBSSxRQUFRLFNBQVMsS0FBVCxDQUFlLFVBQWYsQ0FBWjtBQUNBLFFBQUksQ0FBQyxLQUFELElBQVcsTUFBTSxDQUFOLEVBQVMsTUFBVCxLQUFvQixTQUFTLE1BQTVDLEVBQXFEO0FBQUUsaUJBQVcsU0FBWDtBQUF1QjtBQUMvRTtBQUNELFNBQU8sUUFBUDtBQUNELENBVEQ7O0FBV0EsRUFBRSxVQUFGLEdBQWU7QUFBQSxTQUNaLFFBQVEsT0FBUixDQUFnQixJQUFoQixNQUEwQixDQUEzQixJQUFrQyxRQUFRLE9BQVIsQ0FBZ0IsUUFBaEIsTUFBOEIsQ0FBaEUsSUFDQyxRQUFRLE9BQVIsQ0FBZ0IsUUFBaEIsTUFBOEIsQ0FEL0IsSUFDc0MsUUFBUSxPQUFSLENBQWdCLFlBQWhCLE1BQWtDLENBRjNEO0FBQUEsQ0FBZjs7QUFLQSxFQUFFLGVBQUYsR0FBb0I7QUFBQSxTQUFPLGtCQUFrQixFQUFFLE1BQUYsQ0FBUyxHQUFULENBQXpCO0FBQUEsQ0FBcEI7O0FBRUEsRUFBRSxhQUFGLEdBQWtCO0FBQUEsU0FBTyxDQUFDLEVBQUUsTUFBRixDQUFTLEdBQVQsQ0FBRCxJQUFrQixJQUFJLElBQUosR0FBVyxPQUFYLENBQW1CLEdBQW5CLENBQXpCO0FBQUEsQ0FBbEI7O0FBRUEsRUFBRSxjQUFGLEdBQW1CLFVBQVMsR0FBVCxFQUFjO0FBQy9CLE1BQUksSUFBSSxDQUFKLE1BQVcsR0FBZixFQUFvQjtBQUFFLFdBQU8sS0FBUDtBQUFlO0FBQ3JDLE1BQUksU0FBUyxFQUFFLE1BQUYsQ0FBUyxHQUFULENBQWI7QUFDQSxTQUFPLENBQUMsTUFBRCxJQUFZLENBQUMsT0FBRCxFQUFVLFFBQVYsRUFBb0IsTUFBcEIsRUFBNEIsT0FBNUIsRUFBcUMsT0FBckMsQ0FBNkMsTUFBN0MsTUFBeUQsQ0FBQyxDQUE3RTtBQUNELENBSkQ7O0FBTUEsRUFBRSxlQUFGLEdBQW9CLFVBQVMsTUFBVCxFQUFpQixPQUFqQixFQUEwQjtBQUM1QyxNQUFJLFdBQVcsSUFBZixFQUFxQjtBQUFFLGNBQVUsVUFBVSxTQUFTLFFBQVQsQ0FBa0IsSUFBNUIsQ0FBVjtBQUE4QztBQUNyRSxNQUFJLFdBQVcsT0FBZixFQUF3QjtBQUFFLFdBQU8sRUFBUDtBQUFZO0FBQ3RDLE1BQUksVUFBVSxFQUFFLFFBQUYsQ0FBVyxNQUFYLENBQWQ7QUFDQSxNQUFJLFdBQVcsRUFBRSxRQUFGLENBQVcsT0FBWCxDQUFmO0FBQ0EsTUFBSSxVQUFVLEVBQUUsZ0JBQUYsQ0FBbUIsT0FBbkIsRUFBNEIsUUFBNUIsQ0FBZDtBQUNBLGNBQVUsT0FBVixHQUFvQixPQUFPLFNBQVAsQ0FBaUIsUUFBUSxNQUF6QixDQUFwQjtBQUNELENBUEQ7O0FBU0EsRUFBRSxnQkFBRixHQUFxQixVQUFTLE1BQVQsRUFBaUIsT0FBakIsRUFBMEI7QUFDN0MsTUFBSSxlQUFKO0FBQ0EsTUFBSSxXQUFXLElBQWYsRUFBcUI7QUFBRSxjQUFVLEVBQUUsUUFBRixFQUFWO0FBQXlCO0FBQ2hELE1BQUksVUFBVSxDQUFDLEVBQUUsYUFBRixDQUFnQixNQUFoQixDQUFYLElBQXNDLENBQUMsRUFBRSxhQUFGLENBQWdCLE9BQWhCLENBQTNDLEVBQXFFO0FBQ25FLFFBQUksV0FBVyxPQUFPLEtBQVAsQ0FBYSxHQUFiLENBQWY7QUFDQSxRQUFJLFlBQVksUUFBUSxLQUFSLENBQWMsR0FBZCxDQUFoQjtBQUNBLFFBQUksTUFBTSxDQUFWO0FBQ0EsV0FBTyxJQUFQLEVBQWE7QUFDWCxVQUFLLFNBQVMsTUFBVCxLQUFvQixHQUFyQixJQUE4QixVQUFVLE1BQVYsS0FBcUIsR0FBdkQsRUFBNkQ7QUFBRTtBQUFRO0FBQ3ZFLFVBQUksU0FBUyxHQUFULE1BQWtCLFVBQVUsR0FBVixDQUF0QixFQUFzQztBQUFFO0FBQVE7QUFDaEQ7QUFDRDs7QUFFRCxRQUFJLFdBQVcsU0FBUyxLQUFULENBQWUsR0FBZixDQUFmO0FBQ0EsYUFBUyxFQUFUO0FBQ0EsUUFBSSxjQUFjLFVBQVUsTUFBVixHQUFtQixHQUFuQixHQUF5QixDQUEzQztBQUNBLFdBQU8sSUFBUCxFQUFhO0FBQ1gsVUFBSSxlQUFlLENBQW5CLEVBQXNCO0FBQUU7QUFBUTtBQUNoQyxnQkFBVSxLQUFWO0FBQ0E7QUFDRDtBQUNELGNBQVUsU0FBUyxJQUFULENBQWMsR0FBZCxDQUFWO0FBQ0QsR0FuQkQsTUFtQk87QUFDTCxhQUFTLE1BQVQ7QUFDRDtBQUNELFNBQU8sTUFBUDtBQUNELENBMUJEOztBQTRCQSxFQUFFLFdBQUYsR0FBZ0IsVUFBUyxNQUFULEVBQWlCLFVBQWpCLEVBQTZCO0FBQzNDLE1BQUksY0FBYyxJQUFsQixFQUF3QjtBQUFFLGlCQUFhLEdBQUcsQ0FBSCxDQUFLLFVBQUwsRUFBYjtBQUFpQztBQUMzRCxNQUFJLEVBQUUsYUFBRixDQUFnQixNQUFoQixDQUFKLEVBQTZCO0FBQzNCLFdBQU8sT0FBTyxZQUFQLENBQW9CLFVBQXBCLEVBQWdDLE1BQWhDLENBQVA7QUFDRCxHQUZELE1BRU87QUFDTCxXQUFPLE1BQVA7QUFDRDtBQUNGLENBUEQ7O0FBU0EsRUFBRSxPQUFGLEdBQVk7QUFBQSxTQUFNLE9BQU8sUUFBUCxDQUFnQixRQUFoQixLQUE2QixPQUFuQztBQUFBLENBQVo7O0FBRUEsRUFBRSxRQUFGLEdBQWE7QUFBQSxTQUFNLE9BQU8sUUFBUCxDQUFnQixRQUFoQixLQUE2QixPQUFuQztBQUFBLENBQWI7O0FBRUEsSUFBSSxZQUFZLElBQWhCO0FBQ0EsRUFBRSxZQUFGLEdBQWlCLFVBQVMsTUFBVCxFQUFpQjtBQUNoQyxNQUFJLEVBQUUsT0FBRixFQUFKLEVBQWlCO0FBQUUsV0FBTyxJQUFQO0FBQWM7QUFERCxnQkFFYixNQUZhO0FBQUEsTUFFMUIsUUFGMEIsV0FFMUIsUUFGMEI7O0FBR2hDLE1BQUksYUFBYSxJQUFqQixFQUF1QjtBQUFFLGdCQUFZLFNBQVMsTUFBckI7QUFBOEI7QUFDdkQsTUFBSSxhQUFhLElBQWpCLEVBQXVCO0FBQ3JCLGdCQUFlLFNBQVMsUUFBeEIsVUFBcUMsU0FBUyxRQUE5QztBQUNBLFFBQUksU0FBUyxJQUFiLEVBQW1CO0FBQUUseUJBQWlCLFNBQVMsSUFBMUI7QUFBbUM7QUFDekQ7QUFDRCxTQUFPLGNBQWMsTUFBckI7QUFDRCxDQVREOztBQVdBLEVBQUUsUUFBRixHQUFhLFVBQVMsR0FBVCxFQUFjO0FBQ3pCLE1BQUksT0FBTyxJQUFYLEVBQWlCO0FBQUUsVUFBTSxVQUFVLFNBQVMsUUFBVCxDQUFrQixJQUE1QixDQUFOO0FBQTBDO0FBQzdELE1BQUksUUFBUSxJQUFJLE9BQUosQ0FBWSxHQUFaLENBQVo7QUFDQSxNQUFJLFVBQVUsQ0FBQyxDQUFmLEVBQWtCO0FBQUUsVUFBTSxJQUFJLFNBQUosQ0FBYyxDQUFkLEVBQWlCLEtBQWpCLENBQU47QUFBZ0M7QUFDcEQsVUFBUSxJQUFJLE9BQUosQ0FBWSxHQUFaLENBQVI7QUFDQSxNQUFJLFVBQVUsQ0FBQyxDQUFmLEVBQWtCO0FBQUUsVUFBTSxJQUFJLFNBQUosQ0FBYyxDQUFkLEVBQWlCLEtBQWpCLENBQU47QUFBZ0M7QUFDcEQsU0FBTyxHQUFQO0FBQ0QsQ0FQRDs7QUFTQSxFQUFFLFVBQUYsR0FBZSxVQUFTLFFBQVQsRUFBbUI7QUFDaEMsTUFBSSxZQUFZLElBQWhCLEVBQXNCO0FBQUUsZUFBVyxFQUFFLFFBQUYsRUFBWDtBQUEwQjtBQUNsRCxNQUFJLFFBQVEsU0FBUyxXQUFULENBQXFCLEdBQXJCLENBQVo7QUFDQSxNQUFJLFVBQVUsQ0FBQyxDQUFmLEVBQWtCO0FBQUUsZUFBVyxTQUFTLFNBQVQsQ0FBbUIsQ0FBbkIsRUFBc0IsUUFBUSxDQUE5QixDQUFYO0FBQThDO0FBQ2xFLFNBQU8sUUFBUDtBQUNELENBTEQ7O0FBT0EsRUFBRSxXQUFGLEdBQWdCLFVBQVMsTUFBVCxFQUFpQjtBQUMvQixNQUFJLFdBQVcsRUFBRSxRQUFGLENBQVcsTUFBWCxDQUFmO0FBQ0EsTUFBSSxNQUFNLFNBQVMsV0FBVCxDQUFxQixHQUFyQixDQUFWO0FBQ0EsTUFBSSxZQUFZLFFBQVEsQ0FBQyxDQUFULEdBQWEsU0FBUyxTQUFULENBQW1CLE1BQU0sQ0FBekIsQ0FBYixHQUEyQyxRQUEzRDtBQUNBLFNBQU8sYUFBYSxFQUFwQjtBQUNELENBTEQ7O0FBT0EsRUFBRSxnQkFBRixHQUFxQixVQUFTLE1BQVQsRUFBaUI7QUFDcEMsTUFBSSxZQUFKO0FBQ0EsTUFBSSxZQUFZLEVBQUUsV0FBRixDQUFjLE1BQWQsQ0FBaEI7QUFDQSxNQUFJLE1BQU0sYUFBYSxJQUFiLEdBQW9CLFVBQVUsV0FBVixDQUFzQixHQUF0QixDQUFwQixHQUFpRCxTQUEzRDtBQUNBLE1BQUksUUFBUSxDQUFDLENBQWIsRUFBZ0I7QUFBRSxVQUFNLFVBQVUsU0FBVixDQUFvQixHQUFwQixDQUFOO0FBQWlDO0FBQ25ELFNBQU8sT0FBTyxFQUFkO0FBQ0QsQ0FORDs7Ozs7OztBQ2pRQSxJQUFJLE9BQU8sRUFBUCxJQUFhLElBQWpCLEVBQXVCO0FBQUUsU0FBTyxFQUFQLEdBQVksRUFBWjtBQUFpQjtjQUMzQixNO0lBQVAsRSxXQUFBLEU7O0FBQ1IsSUFBSSxHQUFHLENBQUgsSUFBUSxJQUFaLEVBQWtCO0FBQUUsS0FBRyxDQUFILEdBQU8sRUFBUDtBQUFZO0FBQ2hDLEdBQUcsSUFBSCxHQUFVLEdBQUcsQ0FBYjtJQUNRLEMsR0FBTSxFLENBQU4sQzs7O0FBRVIsSUFBTSxnQkFBa0IsTUFBTSxTQUFOLENBQWdCLE9BQXhDO0FBQ0EsSUFBTSxhQUFrQixPQUFPLElBQS9CO0lBQ1EsYyxHQUFvQixPQUFPLFMsQ0FBM0IsYzs7O0FBRVIsRUFBRSxJQUFGLEdBQVM7QUFBQSxTQUFPLElBQUksSUFBSixFQUFELENBQWEsT0FBYixFQUFOO0FBQUEsQ0FBVDs7QUFFQSxFQUFFLEtBQUYsR0FBVSxVQUFTLEVBQVQsRUFBYSxJQUFiLEVBQW1CO0FBQzNCLE1BQU0sT0FBTyxFQUFiLENBQWlCLElBQUksSUFBSSxDQUFSO0FBQ2pCLFNBQU8sRUFBRSxDQUFGLEdBQU0sVUFBVSxNQUF2QixFQUErQjtBQUFFLFNBQUssSUFBTCxDQUFVLFVBQVUsQ0FBVixDQUFWO0FBQTBCO0FBQzNELFNBQU8sV0FBVztBQUFBLFdBQU0sR0FBRyxLQUFILENBQVMsSUFBVCxFQUFlLElBQWYsQ0FBTjtBQUFBLEdBQVgsRUFDTCxJQURLLENBQVA7QUFFRCxDQUxEOztBQU9BLEVBQUUsS0FBRixHQUFVLFVBQVMsRUFBVCxFQUFhO0FBQ3JCLE1BQU0sT0FBTyxFQUFiLENBQWlCLElBQUksSUFBSSxDQUFSO0FBQ2pCLFNBQU8sRUFBRSxDQUFGLEdBQU0sVUFBVSxNQUF2QixFQUErQjtBQUFFLFNBQUssSUFBTCxDQUFVLFVBQVUsQ0FBVixDQUFWO0FBQTBCO0FBQzNELFNBQU8sS0FBSyxLQUFMLENBQVcsS0FBWCxDQUFpQixJQUFqQixFQUF1QixDQUFDLEVBQUQsRUFBSyxDQUFMLEVBQVEsTUFBUixDQUFlLElBQWYsQ0FBdkIsQ0FBUDtBQUNELENBSkQ7O0FBTUEsRUFBRSxRQUFGLEdBQWEsVUFBUyxFQUFULEVBQWEsU0FBYixFQUF3QixRQUF4QixFQUFrQztBQUM3QyxNQUFJLFVBQVUsSUFBZDtBQUNBLFNBQU8sWUFBVztBQUNoQixRQUFNLE9BQU8sRUFBYjtBQURnQjtBQUFBO0FBQUE7O0FBQUE7QUFFaEIsMkJBQWdCLE1BQU0sSUFBTixDQUFXLFNBQVgsQ0FBaEIsOEhBQXVDO0FBQUEsWUFBOUIsR0FBOEI7QUFBRSxhQUFLLElBQUwsQ0FBVSxHQUFWO0FBQWlCO0FBRjFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBR2hCLFFBQU0sTUFBTSxJQUFaO0FBQ0EsUUFBTSxVQUFVLFNBQVYsT0FBVSxHQUFXO0FBQ3pCLFVBQUksQ0FBQyxRQUFMLEVBQWU7QUFBRSxXQUFHLEtBQUgsQ0FBUyxHQUFULEVBQWMsSUFBZDtBQUFzQjtBQUN2QyxhQUFPLFVBQVUsSUFBakI7QUFDRCxLQUhEO0FBSUEsUUFBSSxPQUFKLEVBQWE7QUFDWCxtQkFBYSxPQUFiO0FBQ0QsS0FGRCxNQUVPLElBQUksUUFBSixFQUFjO0FBQ25CLFNBQUcsS0FBSCxDQUFTLEdBQVQsRUFBYyxJQUFkO0FBQ0Q7QUFDRCxXQUFPLFVBQVUsV0FBVyxPQUFYLEVBQW9CLGFBQWEsR0FBakMsQ0FBakI7QUFDRCxHQWREO0FBZUQsQ0FqQkQ7O0FBbUJBLEVBQUUsUUFBRixHQUFhLFVBQVMsRUFBVCxFQUFhLFNBQWIsRUFBd0I7QUFDbkMsTUFBSSxVQUFVLElBQWQ7QUFDQSxNQUFJLGFBQWEsS0FBakI7QUFDQSxTQUFPLFlBQVc7QUFDaEIsUUFBTSxPQUFPLEVBQWI7QUFEZ0I7QUFBQTtBQUFBOztBQUFBO0FBRWhCLDRCQUFnQixNQUFNLElBQU4sQ0FBVyxTQUFYLENBQWhCLG1JQUF1QztBQUFBLFlBQTlCLEdBQThCO0FBQUUsYUFBSyxJQUFMLENBQVUsR0FBVjtBQUFpQjtBQUYxQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUdoQixRQUFNLE1BQU0sSUFBWjtBQUNBLFFBQU0sVUFBVSxTQUFWLE9BQVUsR0FBVztBQUN6QixVQUFJLENBQUMsVUFBTCxFQUFpQjtBQUFFLFdBQUcsS0FBSCxDQUFTLEdBQVQsRUFBYyxJQUFkO0FBQXNCO0FBQ3pDLGFBQU8sVUFBVSxJQUFqQjtBQUNELEtBSEQ7QUFJQSxRQUFJLE9BQUosRUFBYTtBQUNYLG1CQUFhLE9BQWI7QUFDQSxtQkFBYSxLQUFiO0FBQ0QsS0FIRCxNQUdPO0FBQ0wsU0FBRyxLQUFILENBQVMsR0FBVCxFQUFjLElBQWQ7QUFDQSxtQkFBYSxJQUFiO0FBQ0Q7O0FBRUQsV0FBTyxVQUFVLFdBQVcsT0FBWCxFQUFvQixhQUFhLEdBQWpDLENBQWpCO0FBQ0QsR0FqQkQ7QUFrQkQsQ0FyQkQ7O0FBdUJBLEVBQUUsT0FBRixHQUFZLFVBQUMsRUFBRCxFQUFLLElBQUw7QUFBQSxTQUNWLFlBQVc7QUFDVCxRQUFNLE9BQU8sRUFBYjtBQURTO0FBQUE7QUFBQTs7QUFBQTtBQUVULDRCQUFnQixNQUFNLElBQU4sQ0FBVyxTQUFYLENBQWhCLG1JQUF1QztBQUFBLFlBQTlCLEdBQThCO0FBQUUsYUFBSyxJQUFMLENBQVUsR0FBVjtBQUFpQjtBQUZqRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUdULFFBQU0sTUFBTSxJQUFaO0FBQ0EsUUFBTSxVQUFVLFNBQVYsT0FBVTtBQUFBLGFBQU0sR0FBRyxLQUFILENBQVMsR0FBVCxFQUFjLElBQWQsQ0FBTjtBQUFBLEtBQWhCO0FBQ0EsV0FBTyxXQUFXLE9BQVgsRUFBb0IsSUFBcEIsQ0FBUDtBQUNELEdBUFM7QUFBQSxDQUFaOztBQVVBLEVBQUUsYUFBRixHQUFrQixVQUFDLEVBQUQsRUFBSyxJQUFMLEVBQVcsTUFBWDtBQUFBLFNBQ2hCLFlBQVc7QUFDVCxRQUFNLE9BQU8sRUFBYjtBQURTO0FBQUE7QUFBQTs7QUFBQTtBQUVULDRCQUFnQixNQUFNLElBQU4sQ0FBVyxTQUFYLENBQWhCLG1JQUF1QztBQUFBLFlBQTlCLEdBQThCO0FBQUUsYUFBSyxJQUFMLENBQVUsR0FBVjtBQUFpQjtBQUZqRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUdULFFBQU0sTUFBTSxJQUFaO0FBQ0EsUUFBTSxVQUFVLFNBQVYsT0FBVTtBQUFBLGFBQU0sR0FBRyxLQUFILENBQVMsR0FBVCxFQUFjLElBQWQsQ0FBTjtBQUFBLEtBQWhCO0FBQ0EsUUFBSSxNQUFKLEVBQVk7QUFDVixVQUFJLEdBQUcsTUFBUCxFQUFlO0FBQUUsYUFBSyxJQUFMLENBQVUsRUFBRSxVQUFGLEVBQVY7QUFBNEI7QUFDN0MsaUJBQVcsT0FBWCxFQUFvQixJQUFwQjtBQUNELEtBSEQsTUFHTztBQUNMO0FBQ0Q7QUFDRCxXQUFPLFNBQVMsQ0FBQyxNQUFqQjtBQUNELEdBYmU7QUFBQSxDQUFsQjs7QUFnQkE7O0FBRUEsRUFBRSxHQUFGLEdBQVEsVUFBQyxHQUFELEVBQU0sR0FBTjtBQUFBLFNBQWUsT0FBTyxJQUFSLElBQWlCLGVBQWUsSUFBZixDQUFvQixHQUFwQixFQUF5QixHQUF6QixDQUEvQjtBQUFBLENBQVI7O0FBRUEsRUFBRSxJQUFGLEdBQVMsVUFBUyxHQUFULEVBQWM7QUFDckIsTUFBTSxPQUFPLEVBQWI7QUFDQSxNQUFJLENBQUMsRUFBRSxRQUFGLENBQVcsR0FBWCxDQUFMLEVBQXNCO0FBQUUsV0FBTyxJQUFQO0FBQWM7QUFDdEMsTUFBSSxVQUFKLEVBQWdCO0FBQUUsV0FBTyxXQUFXLEdBQVgsQ0FBUDtBQUF5QjtBQUMzQyxPQUFLLElBQUksR0FBVCxJQUFnQixHQUFoQixFQUFxQjtBQUFFLFFBQUksRUFBRSxHQUFGLENBQU0sR0FBTixFQUFXLEdBQVgsQ0FBSixFQUFxQjtBQUFFLFdBQUssSUFBTCxDQUFVLEdBQVY7QUFBaUI7QUFBRTtBQUNqRSxTQUFPLElBQVA7QUFDRCxDQU5EOztBQVFBOztBQUVBLEVBQUUsR0FBRixHQUFRLFVBQVMsR0FBVCxFQUFjLEVBQWQsRUFBa0IsT0FBbEIsRUFBMkI7QUFDakMsTUFBSSxXQUFXLElBQWYsRUFBcUI7QUFBRSxjQUFVLElBQVY7QUFBaUI7QUFDeEMsTUFBSSxPQUFPLElBQVgsRUFBaUI7QUFBRSxXQUFPLEtBQVA7QUFBZTtBQUNsQyxNQUFNLE9BQVEsSUFBSSxNQUFKLEtBQWUsQ0FBQyxJQUFJLE1BQXJCLElBQWdDLEVBQUUsSUFBRixDQUFPLEdBQVAsQ0FBN0M7O0FBSGlDLGFBSWIsUUFBUSxHQUpLO0FBQUEsTUFJekIsTUFKeUIsUUFJekIsTUFKeUI7O0FBS2pDLE1BQUksUUFBUSxDQUFaO0FBQ0EsU0FBTyxJQUFQLEVBQWE7QUFDWCxRQUFJLFNBQVMsTUFBYixFQUFxQjtBQUFFO0FBQVE7QUFDL0IsUUFBTSxNQUFNLE9BQU8sS0FBSyxLQUFMLENBQVAsR0FBcUIsS0FBakM7QUFDQSxRQUFJLEdBQUcsSUFBSCxDQUFRLE9BQVIsRUFBaUIsSUFBSSxHQUFKLENBQWpCLEVBQTJCLEdBQTNCLEVBQWdDLEdBQWhDLENBQUosRUFBMEM7QUFBRSxhQUFPLElBQVA7QUFBYztBQUMxRDtBQUNEO0FBQ0QsU0FBTyxLQUFQO0FBQ0QsQ0FiRDs7QUFlQSxFQUFFLElBQUYsR0FBUyxVQUFTLEdBQVQsRUFBYyxFQUFkLEVBQWtCLE9BQWxCLEVBQTJCO0FBQ2xDLE1BQUksY0FBSjtBQUNBLE1BQUksV0FBVyxJQUFmLEVBQXFCO0FBQUUsY0FBVSxJQUFWO0FBQWlCO0FBQ3hDLE1BQUksT0FBTyxJQUFYLEVBQWlCO0FBQUU7QUFBUztBQUM1QixNQUFJLGtCQUFrQixJQUFJLE9BQTFCLEVBQW1DO0FBQ2pDLFFBQUksT0FBSixDQUFZLEVBQVosRUFBZ0IsT0FBaEI7QUFDRCxHQUZELE1BRU8sSUFBSSxJQUFJLE1BQUosS0FBZSxDQUFDLElBQUksTUFBeEIsRUFBZ0M7QUFDckMsU0FBSyxJQUFJLFFBQVEsQ0FBakIsRUFBb0IsUUFBUSxJQUFJLE1BQWhDLEVBQXdDLE9BQXhDLEVBQWlEO0FBQUUsY0FBUSxJQUFJLEtBQUosQ0FBUixDQUFvQixHQUFHLElBQUgsQ0FBUSxPQUFSLEVBQWlCLEtBQWpCLEVBQXdCLEtBQXhCLEVBQStCLEdBQS9CO0FBQXNDO0FBQzlHLEdBRk0sTUFFQTtBQUNMLFNBQUssSUFBSSxHQUFULElBQWdCLEdBQWhCLEVBQXFCO0FBQUUsY0FBUSxJQUFJLEdBQUosQ0FBUixDQUFrQixHQUFHLElBQUgsQ0FBUSxPQUFSLEVBQWlCLEtBQWpCLEVBQXdCLEdBQXhCLEVBQTZCLEdBQTdCO0FBQW9DO0FBQzlFO0FBQ0QsU0FBTyxHQUFQO0FBQ0QsQ0FaRDs7QUFjQSxFQUFFLEdBQUYsR0FBUSxVQUFTLEdBQVQsRUFBYyxFQUFkLEVBQWtCLE9BQWxCLEVBQTJCO0FBQ2pDLE1BQUksV0FBVyxJQUFmLEVBQXFCO0FBQUUsY0FBVSxJQUFWO0FBQWlCO0FBQ3hDLE1BQU0sU0FBUyxFQUFmO0FBQ0EsSUFBRSxJQUFGLENBQU8sR0FBUCxFQUFZLFVBQUMsS0FBRCxFQUFRLEdBQVIsRUFBYSxHQUFiO0FBQUEsV0FBcUIsT0FBTyxJQUFQLENBQVksR0FBRyxJQUFILENBQVEsT0FBUixFQUFpQixLQUFqQixFQUF3QixHQUF4QixFQUE2QixHQUE3QixDQUFaLENBQXJCO0FBQUEsR0FBWjtBQUNBLFNBQU8sTUFBUDtBQUNELENBTEQ7O0FBT0EsRUFBRSxNQUFGLEdBQVcsVUFBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixPQUFsQixFQUEyQixPQUEzQixFQUFvQztBQUM3QyxNQUFJLFdBQVcsSUFBZixFQUFxQjtBQUFFLGNBQVUsSUFBVjtBQUFpQjtBQUN4QyxJQUFFLElBQUYsQ0FBTyxHQUFQLEVBQVksVUFBQyxLQUFELEVBQVEsR0FBUjtBQUFBLFdBQWdCLFVBQVUsR0FBRyxJQUFILENBQVEsT0FBUixFQUFpQixPQUFqQixFQUEwQixLQUExQixFQUFpQyxHQUFqQyxDQUExQjtBQUFBLEdBQVo7QUFDQSxTQUFPLE9BQVA7QUFDRCxDQUpEOztBQU1BLEVBQUUsSUFBRixHQUFTLFVBQVMsR0FBVCxFQUFjLEVBQWQsRUFBa0IsT0FBbEIsRUFBMkI7QUFDbEMsTUFBSSxXQUFXLElBQWYsRUFBcUI7QUFBRSxjQUFVLElBQVY7QUFBaUI7QUFDeEMsTUFBSSxTQUFTLFNBQWI7QUFDQSxJQUFFLEdBQUYsQ0FBTSxHQUFOLEVBQVcsVUFBUyxLQUFULEVBQWdCLEdBQWhCLEVBQXFCLEdBQXJCLEVBQTBCO0FBQ25DLFFBQUksR0FBRyxJQUFILENBQVEsT0FBUixFQUFpQixLQUFqQixFQUF3QixHQUF4QixFQUE2QixHQUE3QixDQUFKLEVBQXVDO0FBQ3JDLGVBQVMsS0FBVDtBQUNBLGFBQU8sSUFBUDtBQUNEO0FBQ0YsR0FMRDtBQU1BLFNBQU8sTUFBUDtBQUNELENBVkQ7O0FBWUEsRUFBRSxTQUFGLEdBQWMsVUFBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixPQUFsQixFQUEyQjtBQUN2QyxNQUFJLFdBQVcsSUFBZixFQUFxQjtBQUFFLGNBQVUsSUFBVjtBQUFpQjtBQUN4QyxNQUFJLFNBQVMsQ0FBQyxDQUFkO0FBQ0EsSUFBRSxHQUFGLENBQU0sR0FBTixFQUFXLFVBQVMsS0FBVCxFQUFnQixHQUFoQixFQUFxQixHQUFyQixFQUEwQjtBQUNuQyxRQUFJLEdBQUcsSUFBSCxDQUFRLE9BQVIsRUFBaUIsS0FBakIsRUFBd0IsR0FBeEIsRUFBNkIsR0FBN0IsQ0FBSixFQUF1QztBQUNyQyxlQUFTLEdBQVQ7QUFDQSxhQUFPLElBQVA7QUFDRDtBQUNGLEdBTEQ7QUFNQSxTQUFPLE1BQVA7QUFDRCxDQVZEOztBQVlBLEVBQUUsY0FBRixHQUFtQixVQUFTLElBQVQsRUFBZSxRQUFmLEVBQXlCLEVBQXpCLEVBQTZCLE9BQTdCLEVBQXNDO0FBQ3ZELE1BQUksWUFBWSxJQUFoQixFQUFzQjtBQUFFLGVBQVcsUUFBWDtBQUFzQjtBQUM5QyxNQUFJLFdBQVcsSUFBZixFQUFxQjtBQUFFLGNBQVUsSUFBVjtBQUFpQjtBQUN4QyxNQUFJLFNBQVMsSUFBYjtBQUNBLFNBQU8sSUFBUCxFQUFhO0FBQ1gsUUFBSSxDQUFDLElBQUQsSUFBVSxTQUFTLFFBQXZCLEVBQWtDO0FBQUU7QUFBUTtBQUM1QyxRQUFJLEdBQUcsSUFBSCxDQUFRLE9BQVIsRUFBaUIsSUFBakIsQ0FBSixFQUE0QjtBQUMxQixlQUFTLElBQVQ7QUFDQTtBQUNEO0FBQ0QsV0FBTyxLQUFLLFVBQVo7QUFDRDtBQUNELFNBQU8sTUFBUDtBQUNELENBYkQ7O0FBZUEsRUFBRSxNQUFGLEdBQVcsVUFBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixPQUFsQixFQUEyQjtBQUNwQyxNQUFJLFdBQVcsSUFBZixFQUFxQjtBQUFFLGNBQVUsSUFBVjtBQUFpQjtBQUN4QyxNQUFNLFNBQVMsRUFBZjtBQUNBLElBQUUsSUFBRixDQUFPLEdBQVAsRUFBWSxVQUFTLEtBQVQsRUFBZ0IsR0FBaEIsRUFBcUIsR0FBckIsRUFBMEI7QUFDcEMsUUFBSSxHQUFHLElBQUgsQ0FBUSxPQUFSLEVBQWlCLEtBQWpCLEVBQXdCLEdBQXhCLEVBQTZCLEdBQTdCLENBQUosRUFBdUM7QUFBRSxhQUFPLE9BQU8sSUFBUCxDQUFZLEtBQVosQ0FBUDtBQUE0QjtBQUN0RSxHQUZEO0FBR0EsU0FBTyxNQUFQO0FBQ0QsQ0FQRDs7QUFTQSxFQUFFLE9BQUYsR0FBWTtBQUFBLFNBQ1YsRUFBRSxNQUFGLENBQVMsR0FBVCxFQUFjLFVBQUMsTUFBRCxFQUFTLElBQVQ7QUFBQSxXQUFrQixPQUFPLE1BQVAsQ0FBYyxJQUFkLENBQWxCO0FBQUEsR0FBZCxFQUNFLEVBREYsQ0FEVTtBQUFBLENBQVo7O0FBS0EsRUFBRSxNQUFGLEdBQVcsVUFBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixPQUFsQixFQUEyQjtBQUNwQyxNQUFJLFdBQVcsSUFBZixFQUFxQjtBQUFFLGNBQVUsSUFBVjtBQUFpQjtBQUN4QyxNQUFJLEVBQUosRUFBUTtBQUFFLFVBQU0sRUFBRSxHQUFGLENBQU0sR0FBTixFQUFXLEVBQVgsRUFBZSxPQUFmLENBQU47QUFBZ0M7QUFDMUMsU0FBTyxFQUFFLE1BQUYsQ0FBUyxHQUFULEVBQWMsVUFBQyxLQUFELEVBQVEsS0FBUjtBQUFBLFdBQWtCLElBQUksT0FBSixDQUFZLEtBQVosTUFBdUIsS0FBekM7QUFBQSxHQUFkLENBQVA7QUFDRCxDQUpEOztBQU1BLEVBQUUsS0FBRixHQUFVLFVBQVMsR0FBVCxFQUFjLEVBQWQsRUFBa0IsT0FBbEIsRUFBMkI7QUFDbkMsTUFBSSxXQUFXLElBQWYsRUFBcUI7QUFBRSxjQUFVLElBQVY7QUFBaUI7QUFDeEMsTUFBSSxFQUFKLEVBQVE7QUFBRSxVQUFNLEVBQUUsR0FBRixDQUFNLEdBQU4sRUFBVyxFQUFYLEVBQWUsT0FBZixDQUFOO0FBQWdDO0FBQzFDLFNBQU8sRUFBRSxNQUFGLENBQVMsRUFBRSxPQUFGLENBQVUsR0FBVixDQUFULENBQVA7QUFDRCxDQUpEOztBQU1BLEVBQUUsS0FBRixHQUFVLFVBQVMsR0FBVCxFQUFjLEVBQWQsRUFBa0IsT0FBbEIsRUFBMkI7QUFDbkMsTUFBSSxXQUFXLElBQWYsRUFBcUI7QUFBRSxjQUFVLElBQVY7QUFBaUI7QUFDeEMsTUFBSSxRQUFRLENBQVo7QUFDQSxJQUFFLElBQUYsQ0FBTyxHQUFQLEVBQVksVUFBUyxLQUFULEVBQWdCLEdBQWhCLEVBQXFCLEdBQXJCLEVBQTBCO0FBQUUsUUFBSSxHQUFHLElBQUgsQ0FBUSxPQUFSLEVBQWlCLEtBQWpCLEVBQXdCLEdBQXhCLEVBQTZCLEdBQTdCLENBQUosRUFBdUM7QUFBRSxhQUFPLE9BQVA7QUFBaUI7QUFBRSxHQUFwRztBQUNBLFNBQU8sS0FBUDtBQUNELENBTEQ7O0FBT0EsRUFBRSxNQUFGLEdBQVcsVUFBUyxHQUFULEVBQWMsTUFBZCxFQUFzQixNQUF0QixFQUE4QjtBQUN2QyxNQUFJLE1BQUosRUFBWTtBQUFFLE1BQUUsSUFBRixDQUFPLE1BQVAsRUFBZSxVQUFDLEtBQUQsRUFBUSxHQUFSO0FBQUEsYUFBZ0IsSUFBSSxHQUFKLElBQVcsS0FBM0I7QUFBQSxLQUFmO0FBQW1EO0FBQ2pFLE1BQUksTUFBSixFQUFZO0FBQUUsTUFBRSxJQUFGLENBQU8sTUFBUCxFQUFlLFVBQUMsS0FBRCxFQUFRLEdBQVI7QUFBQSxhQUFnQixJQUFJLEdBQUosSUFBVyxLQUEzQjtBQUFBLEtBQWY7QUFBbUQ7QUFDakUsU0FBTyxHQUFQO0FBQ0QsQ0FKRDs7QUFNQSxFQUFFLGNBQUYsR0FBbUIsVUFBUyxHQUFULEVBQWM7QUFDL0IsU0FBTyxFQUFFLE1BQUYsQ0FBUyxHQUFULEVBQWMsRUFBQyxZQUFZLG1CQUFtQixPQUFPLFFBQVAsQ0FBZ0IsUUFBbkMsQ0FBYixFQUFkLENBQVA7QUFDRCxDQUZEOztBQUlBLEVBQUUsS0FBRixHQUFVLFVBQVMsR0FBVCxFQUFjO0FBQ3RCLE1BQUksQ0FBQyxFQUFFLFFBQUYsQ0FBVyxHQUFYLENBQUwsRUFBc0I7QUFBRSxXQUFPLEdBQVA7QUFBYTtBQUNyQyxTQUFPLEVBQUUsTUFBRixDQUFTLEdBQVQsRUFBYyxVQUFTLE1BQVQsRUFBaUIsS0FBakIsRUFBd0IsR0FBeEIsRUFBNkI7QUFDaEQsV0FBTyxHQUFQLElBQWMsRUFBRSxLQUFGLENBQVEsS0FBUixDQUFkO0FBQ0EsV0FBTyxNQUFQO0FBQ0QsR0FITSxFQUlMLEVBSkssQ0FBUDtBQUtELENBUEQ7O0FBU0EsRUFBRSxPQUFGLEdBQVk7QUFBQSxTQUFTLEVBQUUsTUFBRixDQUFTLEtBQVQsRUFBZ0I7QUFBQSxXQUFRLElBQVI7QUFBQSxHQUFoQixDQUFUO0FBQUEsQ0FBWjs7QUFFQSxFQUFFLGFBQUYsR0FBa0IsVUFBUyxHQUFULEVBQWM7QUFDOUIsTUFBSSxPQUFPLElBQVgsRUFBaUI7QUFBRSxVQUFNLEVBQU47QUFBVztBQUM5QixTQUFPLEVBQUUsTUFBRixDQUFTLEdBQVQsRUFBYyxVQUFTLE1BQVQsRUFBaUIsS0FBakIsRUFBd0IsR0FBeEIsRUFBNkI7QUFDaEQsUUFBSSxTQUFTLElBQWIsRUFBbUI7QUFDakIsVUFBSSxFQUFFLFFBQUYsQ0FBVyxLQUFYLENBQUosRUFBdUI7QUFDckIsZ0JBQVEsRUFBRSxhQUFGLENBQWdCLEtBQWhCLENBQVI7QUFDQSxZQUFJLENBQUMsRUFBRSxhQUFGLENBQWdCLEtBQWhCLENBQUwsRUFBNkI7QUFBRSxpQkFBTyxHQUFQLElBQWMsS0FBZDtBQUFzQjtBQUN0RCxPQUhELE1BR087QUFDTCxlQUFPLEdBQVAsSUFBZSxLQUFmO0FBQ0Q7QUFDRjtBQUNELFdBQU8sTUFBUDtBQUNELEdBVk0sRUFXTCxFQVhLLENBQVA7QUFZRCxDQWREOztBQWdCQSxFQUFFLFFBQUYsR0FBYTtBQUFBLFNBQVMsT0FBTyxLQUFQLEtBQWlCLFFBQTFCO0FBQUEsQ0FBYjs7QUFFQSxFQUFFLFVBQUYsR0FBZTtBQUFBLFNBQVMsT0FBTyxLQUFQLEtBQWlCLFVBQTFCO0FBQUEsQ0FBZjs7QUFFQSxFQUFFLFFBQUYsR0FBYTtBQUFBLFNBQVUsVUFBVSxJQUFYLElBQXFCLFFBQU8sS0FBUCx5Q0FBTyxLQUFQLE9BQWlCLFFBQS9DO0FBQUEsQ0FBYjs7QUFFQSxFQUFFLFNBQUYsR0FBYztBQUFBLFNBQVUsVUFBVSxJQUFYLElBQXFCLFVBQVUsU0FBeEM7QUFBQSxDQUFkOztBQUVBLEVBQUUsYUFBRixHQUFrQjtBQUFBLFNBQVMsTUFBTSxNQUFOLEtBQWlCLENBQTFCO0FBQUEsQ0FBbEI7O0FBRUEsRUFBRSxjQUFGLEdBQW1CO0FBQUEsU0FBUyxFQUFFLFNBQUYsQ0FBWSxLQUFaLEtBQXNCLENBQUMsRUFBRSxhQUFGLENBQWdCLEtBQWhCLENBQWhDO0FBQUEsQ0FBbkI7O0FBRUEsRUFBRSxhQUFGLEdBQWtCO0FBQUEsU0FBUyxPQUFPLElBQVAsQ0FBWSxLQUFaLEVBQW1CLE1BQW5CLEtBQThCLENBQXZDO0FBQUEsQ0FBbEI7O0FBRUEsRUFBRSxPQUFGLEdBQVksVUFBUyxJQUFULEVBQWUsSUFBZixFQUFxQjtBQUMvQixNQUFJLFFBQU8sSUFBUCx5Q0FBTyxJQUFQLGVBQXVCLElBQXZCLHlDQUF1QixJQUF2QixFQUFKLEVBQWlDO0FBQUUsV0FBTyxLQUFQO0FBQWU7QUFDbEQsTUFBSSxDQUFDLEVBQUUsU0FBRixDQUFZLElBQVosQ0FBRCxJQUFzQixDQUFDLEVBQUUsU0FBRixDQUFZLElBQVosQ0FBM0IsRUFBOEM7QUFBRSxXQUFPLFNBQVMsSUFBaEI7QUFBdUI7O0FBRXZFLGlCQUFlLElBQWYseUNBQWUsSUFBZjtBQUNFLFNBQUssUUFBTDtBQUNFLGFBQU8sRUFBRSxhQUFGLENBQWdCLElBQWhCLEVBQXNCLElBQXRCLENBQVA7QUFDRixTQUFLLE9BQUw7QUFDRSxhQUFPLENBQUMsRUFBRSxHQUFGLENBQU0sSUFBTixFQUFZLFVBQUMsS0FBRCxFQUFRLEtBQVI7QUFBQSxlQUFrQixDQUFDLEVBQUUsT0FBRixDQUFVLEtBQVYsRUFBaUIsS0FBSyxLQUFMLENBQWpCLENBQW5CO0FBQUEsT0FBWixDQUFSO0FBQ0Y7QUFDRSxhQUFPLFNBQVMsSUFBaEI7QUFOSjtBQVFELENBWkQ7O0FBY0EsRUFBRSxhQUFGLEdBQWtCLFVBQVMsSUFBVCxFQUFlLElBQWYsRUFBcUI7QUFDckMsTUFBTSxRQUFRLEVBQUUsTUFBRixDQUFTLEVBQUUsSUFBRixDQUFPLElBQVAsQ0FBVCxFQUF1QjtBQUFBLFdBQU8sS0FBSyxHQUFMLE1BQWMsU0FBckI7QUFBQSxHQUF2QixDQUFkO0FBQ0EsTUFBTSxRQUFRLEVBQUUsTUFBRixDQUFTLEVBQUUsSUFBRixDQUFPLElBQVAsQ0FBVCxFQUF1QjtBQUFBLFdBQU8sS0FBSyxHQUFMLE1BQWMsU0FBckI7QUFBQSxHQUF2QixDQUFkO0FBQ0EsTUFBSSxNQUFNLE1BQU4sS0FBaUIsTUFBTSxNQUEzQixFQUFtQztBQUFFLFdBQU8sS0FBUDtBQUFlO0FBQ3BELFNBQU8sQ0FBQyxFQUFFLEdBQUYsQ0FBTSxLQUFOLEVBQWE7QUFBQSxXQUFPLENBQUMsRUFBRSxPQUFGLENBQVUsS0FBSyxHQUFMLENBQVYsRUFBcUIsS0FBSyxHQUFMLENBQXJCLENBQVI7QUFBQSxHQUFiLENBQVI7QUFDRCxDQUxEOztBQVFBLEVBQUUsY0FBRixHQUFtQjtBQUFBLFNBQVUsVUFBVSxHQUFYLElBQW9CLFVBQVUsS0FBOUIsSUFBeUMsVUFBVSxLQUFuRCxJQUE4RCxVQUFVLElBQWpGO0FBQUEsQ0FBbkI7O0FBRUE7O0FBRUEsQ0FBQyxZQUFXO0FBQ1YsTUFBSSxnQkFBSjtBQUNBLE1BQUk7QUFDRixpQkFBYSxPQUFiLENBQXFCLGFBQXJCLEVBQW9DLElBQXBDO0FBQ0EsY0FBVyxhQUFhLE9BQWIsQ0FBcUIsYUFBckIsS0FBdUMsSUFBbEQ7QUFDQSxpQkFBYSxVQUFiLENBQXdCLGFBQXhCO0FBQ0QsR0FKRCxDQUlFLE9BQU8sS0FBUCxFQUFjO0FBQ2QsY0FBVSxLQUFWO0FBQ0Q7O0FBRUQsU0FBTyxFQUFFLGFBQUYsR0FBbUI7QUFBQSxXQUFNLE9BQU47QUFBQSxHQUExQjtBQUNELENBWEQ7O0FBYUEsRUFBRSxRQUFGLEdBQWE7QUFBQSxTQUFNLFdBQVcsTUFBakI7QUFBQSxDQUFiOztBQUVBLEVBQUUsVUFBRixHQUFlLFVBQUMsTUFBRCxFQUE0RDtBQUFBLE1BQW5ELEtBQW1ELHVFQUEzQyxJQUEyQztBQUFBLE1BQXJDLE1BQXFDLHVFQUE1QixJQUE0QjtBQUFBLE1BQXRCLFVBQXNCLHVFQUFULEtBQVM7O0FBQ3pFLE1BQU0sU0FBUyxTQUFTLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBZjtBQUNBLFNBQU8sSUFBUCxHQUFjLGlCQUFkO0FBQ0EsU0FBTyxLQUFQLEdBQWUsVUFBVSxJQUF6QjtBQUNBLFNBQU8sR0FBUCxHQUFhLE1BQWI7QUFDQSxTQUFPLE9BQVAsR0FBa0IsT0FBTyxNQUFQLEdBQWdCLFVBQVMsSUFBVCxFQUFlO0FBQy9DLFFBQUksVUFBSixFQUFnQjtBQUFFLGVBQVMsSUFBVCxDQUFjLFdBQWQsQ0FBMEIsTUFBMUI7QUFBb0M7QUFDdEQsV0FBTyxVQUFVLE9BQU8sS0FBUCxDQUFhLElBQWIsRUFBbUIsSUFBbkIsQ0FBakI7QUFDRCxHQUhEOztBQUtBLFNBQU8sU0FBUyxJQUFULENBQWMsV0FBZCxDQUEwQixNQUExQixDQUFQO0FBQ0QsQ0FYRDs7QUFhQSxDQUFDLFlBQVc7QUFDVixNQUFNLFlBQVksU0FBWixTQUFZO0FBQUEsV0FBTSxLQUFLLEtBQUwsQ0FBVyxDQUFDLElBQUksS0FBSyxNQUFMLEVBQUwsSUFBc0IsT0FBakMsRUFBMEMsUUFBMUMsQ0FBbUQsRUFBbkQsRUFBdUQsU0FBdkQsQ0FBaUUsQ0FBakUsQ0FBTjtBQUFBLEdBQWxCOztBQUVBLFNBQU8sRUFBRSxRQUFGLEdBQWE7QUFBQSxXQUFTLEVBQUUsSUFBRixHQUFTLFFBQVQsQ0FBa0IsRUFBbEIsQ0FBVCxTQUFrQyxXQUFsQyxHQUFnRCxXQUFoRCxHQUE4RCxXQUE5RDtBQUFBLEdBQXBCO0FBQ0QsQ0FKRDs7QUFNQSxFQUFFLEdBQUYsR0FBUTtBQUFBLFNBQ04sWUFBVztBQUNULFFBQUksZUFBZSxPQUFPLEVBQTFCLEVBQThCO0FBQzVCLFVBQU0sTUFBTSxFQUFaO0FBQ0EsV0FBSyxJQUFMO0FBQ0EsYUFBTyxJQUFJLEtBQUosQ0FBVSxJQUFWLEVBQWdCLFNBQWhCLENBQVA7QUFDRDtBQUNGLEdBUEs7QUFBQSxDQUFSOztBQVVBLEVBQUUsS0FBRixHQUFVLFVBQVMsT0FBVCxFQUFrQixLQUFsQixFQUF5QjtBQUNqQyxNQUFJLFNBQVMsSUFBYixFQUFtQjtBQUFFLFlBQVEsRUFBUjtBQUFhO0FBQ2xDLFNBQU8sVUFBUyxJQUFULEVBQWUsS0FBZixFQUFzQjtBQUMzQixRQUFJLFVBQVUsTUFBVixLQUFxQixDQUF6QixFQUE0QjtBQUMxQixhQUFPLE1BQU0sSUFBTixDQUFQO0FBQ0QsS0FGRCxNQUVPLElBQUksQ0FBQyxPQUFELElBQVksUUFBUSxLQUFSLENBQWhCLEVBQWdDO0FBQ3JDLGFBQU8sTUFBTSxJQUFOLElBQWMsS0FBckI7QUFDRDtBQUNGLEdBTkQ7QUFPRCxDQVREOztBQVdBLEVBQUUsT0FBRixHQUFZLFVBQVMsU0FBVCxFQUFvQixLQUFwQixFQUEyQjtBQUNyQyxNQUFJLFNBQVMsSUFBYixFQUFtQjtBQUFFLFlBQVEsRUFBUjtBQUFhO0FBQ2xDLFNBQU8sWUFBVztBQUNoQixRQUFJLGdCQUFKO0FBRGdCO0FBQUE7QUFBQTs7QUFBQTtBQUVoQiw0QkFBZ0IsTUFBTSxJQUFOLENBQVcsU0FBWCxDQUFoQixtSUFBdUM7QUFBQSxZQUE5QixHQUE4Qjs7QUFDckMsWUFBTSxNQUFNLEVBQUUsUUFBRixDQUFXLEdBQVgsSUFBa0IsR0FBbEIsR0FBd0IsS0FBSyxTQUFMLENBQWUsR0FBZixDQUFwQztBQUNBLGtCQUFXLFdBQVcsSUFBWixHQUF1QixPQUF2QixVQUFtQyxHQUFuQyxHQUEyQyxHQUFyRDtBQUNEO0FBTGU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFPaEIsUUFBSSxXQUFXLEtBQWYsRUFBc0I7QUFDcEIsYUFBTyxNQUFNLE9BQU4sQ0FBUDtBQUNELEtBRkQsTUFFTztBQUNMLGFBQU8sTUFBTSxPQUFOLElBQWlCLFVBQVUsS0FBVixDQUFnQixJQUFoQixFQUFzQixTQUF0QixDQUF4QjtBQUNEO0FBQ0YsR0FaRDtBQWFELENBZkQ7O0FBaUJBO0FBQ0EsRUFBRSxZQUFGLEdBQWlCLFVBQVMsU0FBVCxFQUFvQixLQUFwQixFQUEyQjtBQUMxQyxNQUFJLFNBQVMsSUFBYixFQUFtQjtBQUFFLFlBQVEsRUFBUjtBQUFhO0FBQ2xDLFNBQU8sWUFBVztBQUNoQixRQUFJLGlCQUFKO0FBQ0EsUUFBTSxPQUFPLEVBQWI7QUFGZ0I7QUFBQTtBQUFBOztBQUFBO0FBR2hCLDRCQUFnQixNQUFNLElBQU4sQ0FBVyxTQUFYLENBQWhCLG1JQUF1QztBQUFBLFlBQTlCLEdBQThCO0FBQUUsYUFBSyxJQUFMLENBQVUsR0FBVjtBQUFpQjtBQUgxQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUloQixRQUFJLEtBQUssTUFBTCxHQUFjLENBQWxCLEVBQXFCO0FBQUUsaUJBQVksS0FBSyxHQUFOLEVBQVg7QUFBMEI7QUFDakQsUUFBTSxVQUFVLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBaEI7QUFDQSxRQUFJLFdBQVcsS0FBZixFQUFzQjtBQUNwQixhQUFRLE9BQU8sUUFBUCxLQUFvQixVQUFwQixHQUFpQyxTQUFTLE1BQU0sT0FBTixDQUFULENBQWpDLEdBQTRELFNBQXBFO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsV0FBSyxJQUFMLENBQVUsVUFBUyxJQUFULEVBQWU7QUFDdkIsY0FBTSxPQUFOLElBQWlCLElBQWpCO0FBQ0EsZUFBUSxPQUFPLFFBQVAsS0FBb0IsVUFBcEIsR0FBaUMsU0FBUyxJQUFULENBQWpDLEdBQWtELFNBQTFEO0FBQ0QsT0FIRDtBQUlBLGFBQU8sVUFBVSxLQUFWLENBQWdCLElBQWhCLEVBQXNCLElBQXRCLENBQVA7QUFDRDtBQUNGLEdBZkQ7QUFnQkQsQ0FsQkQ7O0FBb0JBLEVBQUUsT0FBRixHQUFZLEVBQUUsWUFBRixDQUFlLFVBQUMsTUFBRCxFQUFTLFFBQVQ7QUFBQSxTQUFzQixFQUFFLFVBQUYsQ0FBYSxNQUFiLEVBQXFCLElBQXJCLEVBQTJCO0FBQUEsV0FBTSxTQUFTLEVBQUUsT0FBRixFQUFULENBQU47QUFBQSxHQUEzQixDQUF0QjtBQUFBLENBQWYsQ0FBWjs7QUFFQSxDQUFDLFlBQVc7QUFDVixNQUFJLFFBQVEsU0FBWjtBQUNBLFNBQU8sRUFBRSxPQUFGLEdBQVksVUFBUyxLQUFULEVBQWdCO0FBQ2pDLFFBQU0sV0FBVyxLQUFqQjtBQUNBLFlBQVMsU0FBUyxJQUFWLEdBQWtCLEtBQWxCLEdBQTBCLFNBQWxDO0FBQ0EsV0FBTyxRQUFQO0FBQ0QsR0FKRDtBQUtELENBUEQ7Ozs7Ozs7Ozs7Ozs7Y0N6WWEsTTtJQUFQLEUsV0FBQSxFOztBQUNOLElBQUksT0FBTyxHQUFHLENBQWQ7SUFDTSxDLEdBQU0sRSxDQUFOLEM7OztBQUVOLElBQUksYUFBYSxTQUFiLFVBQWEsQ0FBUyxJQUFULEVBQWU7QUFBQSxRQUN4QixVQUR3QjtBQUFBOztBQUFBO0FBQUE7QUFBQSx1Q0FXakI7QUFBRSx1QkFBVSxJQUFWLFNBQWtCLEtBQUssTUFBdkI7QUFBa0M7QUFYbkI7QUFBQTtBQUFBLHdDQUVUOztBQUVqQixxQkFBSyxTQUFMLENBQWUsZUFBZixHQUFrQyxZQUFXO0FBQzNDLHdCQUFJLE1BQU0sRUFBVjtBQUNBLGtDQUFZLElBQVosY0FBOEIsSUFBOUI7QUFDQSwyQkFBTyxHQUFQO0FBQ0MsaUJBSjhCLEVBQWpDO0FBS0Q7QUFUMkI7O0FBYTVCLDRCQUFZLElBQVosRUFBa0I7QUFBQTs7QUFHaEI7QUFIZ0IsZ0lBQ1YsSUFEVTs7QUFJaEIsZ0JBQUksTUFBSyxLQUFMLElBQWMsSUFBbEIsRUFBd0I7QUFBRSxzQkFBSyxLQUFMLEdBQWEsR0FBRyxLQUFoQjtBQUF3QjtBQUNsRCxjQUFFLE9BQUYsQ0FBVSxNQUFLLElBQWYsRUFBcUIsSUFBckIsRUFBMkIsS0FBSyxNQUFoQztBQUxnQjtBQU1qQjs7QUFuQjJCO0FBQUE7QUFBQSxpQ0FxQnZCLE1BckJ1QixFQXFCZjtBQUNYLG9CQUFJLEtBQUssUUFBVCxFQUFtQjtBQUFFO0FBQVM7QUFDOUIscUJBQUssUUFBTCxHQUFnQixJQUFoQjtBQUNBLHFCQUFLLFVBQUwsQ0FBZ0IsTUFBaEI7QUFDQSxxQkFBSyxNQUFMO0FBQ0EsdUJBQU8sS0FBSyxnQkFBTCxDQUFzQixLQUFLLElBQTNCLENBQVA7QUFDRDtBQTNCMkI7O0FBQUE7QUFBQSxNQUNMLEdBQUcsTUFERTs7QUE2QjlCLGVBQVcsU0FBWDs7QUFFQSxXQUFPLFVBQVA7QUFDRCxDQWhDRDs7Ozs7OztBQWtDQSx5QkFBaUIsTUFBTSxJQUFOLENBQVcsR0FBRyxNQUFILENBQVUsU0FBVixDQUFvQixTQUEvQixDQUFqQiw4SEFBNEQ7QUFBQSxZQUFuRCxJQUFtRDtBQUFFLGVBQU8sRUFBUCxDQUFVLE9BQVYsQ0FBa0IsSUFBbEIsSUFBMkIsV0FBVyxJQUFYLENBQTNCO0FBQThDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2NDdEMvRixNO0lBQVAsRSxXQUFBLEU7O0FBQ04sSUFBSSxPQUFPLEdBQUcsQ0FBZDtJQUNNLEMsR0FBTSxFLENBQU4sQzs7SUFFQSxNOzs7QUFFSixrQkFBWSxJQUFaLEVBQWtCO0FBQUE7O0FBQUEsZ0hBQ1YsSUFEVTs7QUFFaEIsUUFBSSxNQUFLLEtBQUwsSUFBYyxJQUFsQixFQUF3QjtBQUFFLFlBQUssS0FBTCxHQUFhLEdBQUcsS0FBaEI7QUFBd0I7QUFGbEM7QUFHakI7OztFQUxrQixHQUFHLE07O0FBUXhCLE9BQU8sRUFBUCxDQUFVLE9BQVYsQ0FBa0IsTUFBbEIsR0FBMkIsTUFBM0I7Ozs7Ozs7Ozs7Ozs7OztjQ1phLE07SUFBUCxFLFdBQUEsRTtJQUNBLEMsR0FBTSxFLENBQU4sQztJQUNBLEMsR0FBTSxFLENBQU4sQztJQUNBLE0sR0FBVyxFLENBQVgsTTtJQUNBLE0sR0FBVyxFLENBQVgsTTs7SUFFQSxJOzs7OztnQ0FDZTs7QUFFakIsV0FBSyxTQUFMLENBQWUsVUFBZixHQUE0QixDQUFDLE9BQUQsRUFBVSxNQUFWLENBQWlCLE9BQU8sU0FBUCxDQUFpQixVQUFsQyxDQUE1QjtBQUNBLFdBQUssU0FBTCxDQUFlLGdCQUFmLEdBQW1DO0FBQUEsZUFBTSxPQUFPLFNBQVAsQ0FBaUIsa0JBQWpCLENBQW9DLEtBQUssU0FBTCxDQUFlLFVBQW5ELENBQU47QUFBQSxPQUFELEVBQWxDOztBQUVBLFdBQUssU0FBTCxDQUFlLGFBQWYsR0FBK0IsQ0FBQyxNQUFELEVBQVMsT0FBVCxFQUFrQixLQUFsQixFQUF5QixXQUF6QixFQUFzQyxRQUF0QyxFQUM5QixTQUQ4QixFQUNuQixNQURtQixFQUNYLFNBRFcsRUFDQSxlQURBLENBQS9CO0FBRUQ7OztBQUVELGdCQUFZLElBQVosRUFBa0I7QUFBQTs7QUFBQSw0R0FDVixJQURVOztBQUVoQixVQUFLLFFBQUwsR0FBZ0IsTUFBSyxRQUFMLENBQWMsSUFBZCxPQUFoQjtBQUNBLFVBQUssWUFBTCxHQUFvQixNQUFLLFlBQUwsQ0FBa0IsSUFBbEIsT0FBcEI7O0FBRUEsUUFBSSxNQUFLLEdBQUwsSUFBWSxJQUFoQixFQUFzQjtBQUFFLFlBQUssR0FBTDtBQUF3QjtBQUNoRCxRQUFJLE1BQUssSUFBTCxJQUFhLElBQWpCLEVBQXVCO0FBQUUsWUFBSyxJQUFMLEdBQVksRUFBWjtBQUFpQjtBQUMxQyxRQUFJLE1BQUssUUFBTCxJQUFpQixJQUFyQixFQUEyQjtBQUFFLFlBQUssUUFBTCxHQUFnQixFQUFoQjtBQUFxQjtBQUNsRCxRQUFJLE1BQUssU0FBTCxJQUFrQixJQUF0QixFQUE0QjtBQUFFLFlBQUssU0FBTCxHQUFpQixFQUFqQjtBQUFzQjtBQUNwRCxVQUFLLFdBQUwsR0FBbUIsSUFBbkI7QUFDQSxVQUFLLGFBQUwsR0FBcUIsQ0FBckI7QUFDQSxVQUFLLGFBQUwsR0FBcUIsQ0FBckI7QUFYZ0I7QUFZakI7Ozs7eUJBRUksTSxFQUFRO0FBQ1gsVUFBSSxLQUFLLFFBQVQsRUFBbUI7QUFBRTtBQUFTO0FBQzlCLHVHQUFXLE1BQVg7QUFDQSxXQUFLLGFBQUwsQ0FBbUIsS0FBSyxHQUF4QixFQUE2QixLQUFLLFFBQWxDLEVBQTRDLEVBQUMsU0FBUyxLQUFWLEVBQTVDO0FBQ0EsV0FBSyxhQUFMLENBQW1CLEtBQUssT0FBeEIsRUFBaUMsVUFBUyxNQUFULEVBQWlCO0FBQUUsWUFBSSxVQUFVLElBQWQsRUFBb0I7QUFBRSxtQkFBUyxFQUFUO0FBQWMsU0FBQyxPQUFPLEtBQUssT0FBTCxDQUFhLEtBQUssR0FBbEIsRUFBdUIsTUFBdkIsRUFBK0IsRUFBQyxNQUFNLElBQVAsRUFBL0IsQ0FBUDtBQUFzRCxPQUEvSTtBQUNBLGFBQU8sS0FBSyxhQUFMLENBQW1CLEtBQUssSUFBTCxDQUFVLFFBQTdCLEVBQXVDLEtBQUssWUFBNUMsQ0FBUDtBQUNEOzs7OEJBRVMsSSxFQUFNO0FBQ2QsNEdBQWdCLElBQWhCO0FBQ0EsVUFBSSxLQUFLLEdBQVQsRUFBYztBQUNaLFlBQUksRUFBRSxvQkFBRixDQUF1QixLQUFLLEdBQTVCLENBQUosRUFBc0M7QUFBRSxlQUFLLEdBQUwsR0FBVyxPQUFPLEtBQUssR0FBWixDQUFYO0FBQThCO0FBQ3RFLFlBQUksQ0FBQyxFQUFFLGVBQUYsQ0FBa0IsS0FBSyxHQUF2QixDQUFMLEVBQWtDO0FBQ2hDLGVBQUssT0FBTCxHQUFlLEtBQUssR0FBcEI7QUFDQSxpQkFBTyxLQUFLLEdBQUwsR0FBVyxJQUFsQjtBQUNEO0FBQ0Y7QUFDRjs7O29DQUVlO0FBQ2QsVUFBSSxPQUFPLEtBQUssSUFBTCxDQUFVLFNBQXJCO0FBQ0EsVUFBSSxRQUFRLElBQVIsR0FBZSxLQUFLLEtBQXBCLEdBQTRCLFNBQWhDLEVBQTJDO0FBQ3pDLFlBQUksWUFBSjtBQUNBLFlBQUksTUFBTSxLQUFLLEtBQUwsRUFBVixFQUF3QjtBQUFFLGVBQUssTUFBTCxHQUFjLEdBQWQ7QUFBb0I7QUFDOUMsWUFBSSxNQUFNLEtBQUssS0FBTCxFQUFWLEVBQXdCO0FBQUUsZUFBSyxPQUFMLEdBQWUsR0FBZjtBQUFxQjtBQUNoRDs7QUFFRCxVQUFJLEVBQUUsUUFBRixDQUFXLEtBQUssTUFBaEIsQ0FBSixFQUE2QjtBQUFFLGFBQUssTUFBTCxHQUFjLEtBQUssWUFBTCxDQUFrQixLQUFLLE1BQXZCLENBQWQ7QUFBK0M7QUFDOUUsVUFBSSxFQUFFLFFBQUYsQ0FBVyxLQUFLLE9BQWhCLENBQUosRUFBOEI7QUFBRSxlQUFPLEtBQUssT0FBTCxHQUFlLEtBQUssWUFBTCxDQUFrQixLQUFLLE9BQXZCLENBQXRCO0FBQXdEO0FBQ3pGOzs7a0NBRWEsSyxFQUFPO0FBQUUsVUFBSSxLQUFLLElBQUwsQ0FBVSxPQUFkLEVBQXVCO0FBQUUsZUFBTyxLQUFLLE9BQUwsQ0FBYSxLQUFLLElBQUwsQ0FBVSxPQUF2QixFQUFnQyxLQUFoQyxDQUFQO0FBQWdEO0FBQUU7OztpQ0FFckYsSSxFQUFNO0FBQUUsYUFBTyxLQUFLLGFBQUwsQ0FBbUIsYUFBbkIsRUFBa0MsSUFBbEMsQ0FBUDtBQUFpRDs7O2lDQUV6RCxJLEVBQU07QUFBRSxhQUFPLDBHQUFzQixTQUF0QixLQUFvQyxFQUFFLE9BQUYsQ0FBVSxJQUFWLEVBQWdCLE9BQWhCLENBQTNDO0FBQXNFOzs7NkJBRWxGLE0sRUFBUTtBQUNmLFdBQUssSUFBTCxHQUFZLElBQVo7QUFDQSxXQUFLLGFBQUwsR0FBcUIsQ0FBckI7QUFDQSxXQUFLLGFBQUwsR0FBcUIsQ0FBckI7QUFDQSxrSEFBc0IsTUFBdEI7QUFDRDs7O2dDQUVXO0FBQUE7O0FBQ1YsVUFBSSxhQUFKO0FBQ0EsVUFBSSxVQUFVLEtBQUssSUFBbkI7QUFDQSxVQUFJLEtBQUssYUFBTCxJQUFzQixJQUExQixFQUFnQztBQUM5QixhQUFLLGFBQUwsR0FBdUIsWUFBTTtBQUMzQixjQUFJLFNBQVMsRUFBYjtBQUQyQjtBQUFBO0FBQUE7O0FBQUE7QUFFM0IsaUNBQWEsTUFBTSxJQUFOLENBQVcsT0FBSyxPQUFMLENBQWEsVUFBeEIsQ0FBYiw4SEFBa0Q7QUFBN0Msa0JBQTZDO0FBQVkscUJBQU8sSUFBUCxDQUFZLElBQVo7QUFDN0Q7QUFIMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFJM0IsaUJBQU8sTUFBUDtBQUNELFNBTHFCLEVBQXRCO0FBTUQ7O0FBRUQsV0FBSyxJQUFMLEdBQVksS0FBSyxPQUFMLENBQWEsU0FBYixDQUF1QixLQUF2QixDQUFaO0FBQ0EsYUFBTyxPQUFQO0FBQ0Q7Ozt1Q0FFa0I7QUFDakIsVUFBSSxLQUFLLElBQUwsSUFBYSxJQUFqQixFQUF1QjtBQUFFLGFBQUssSUFBTCxHQUFZLEtBQUssR0FBTCxDQUFTLEtBQUssR0FBZCxLQUFzQixFQUFsQztBQUF1QztBQUNoRSxhQUFRLEtBQUssWUFBTixFQUFQO0FBQ0Q7OzttQ0FFYztBQUNiLFVBQUksVUFBSjtBQUNBLFVBQUksWUFBSjtBQUNBLFdBQUssYUFBTCxDQUFtQixLQUFuQjtBQUNBLFdBQUssSUFBSSxLQUFLLGFBQVQsRUFBd0IsTUFBTSxLQUFLLElBQUwsQ0FBVSxNQUFWLEdBQW1CLENBQXRELEVBQXlELEtBQUssR0FBOUQsRUFBbUUsR0FBbkUsRUFBd0U7QUFDdEUsWUFBSSxPQUFPLEtBQUssSUFBTCxDQUFVLENBQVYsQ0FBWDtBQUNBLFlBQUksS0FBSyxNQUFMLElBQWUsQ0FBQyxLQUFLLE1BQUwsQ0FBWSxJQUFaLEVBQWtCLENBQWxCLENBQXBCLEVBQTBDO0FBQUU7QUFBVztBQUN2RCxZQUFJLEtBQUssT0FBTCxJQUFpQixNQUFNLEtBQUssYUFBNUIsSUFBOEMsS0FBSyxPQUFMLENBQWEsSUFBYixFQUFtQixLQUFLLGFBQXhCLENBQWxELEVBQTBGO0FBQ3hGLGVBQUssYUFBTCxDQUFtQixJQUFuQjtBQUNBO0FBQ0QsU0FIRCxNQUdPO0FBQ0wsZUFBSyxhQUFMLENBQW1CLElBQW5CLEVBQXlCLENBQXpCO0FBQ0Q7QUFDRjtBQUNELFdBQUssYUFBTCxHQUFxQixDQUFyQjtBQUNBLFVBQUksS0FBSyxhQUFMLEtBQXVCLENBQTNCLEVBQThCO0FBQUUsYUFBSyxJQUFMO0FBQWMsT0FBOUMsTUFBb0QsSUFBSSxDQUFDLEtBQUssU0FBTCxFQUFMLEVBQXVCO0FBQUUsYUFBSyxJQUFMO0FBQWM7QUFDM0YsVUFBSSxLQUFLLElBQUwsQ0FBVSxNQUFWLElBQXFCLE1BQU0sS0FBSyxJQUFMLENBQVUsTUFBekMsRUFBa0Q7QUFBRSxlQUFPLEtBQUssT0FBTCxDQUFhLEtBQUssSUFBTCxDQUFVLE1BQXZCLEVBQStCLElBQS9CLENBQVA7QUFBOEM7QUFDbkc7OztrQ0FFYSxJLEVBQU0sSyxFQUFPO0FBQ3pCLFdBQUssYUFBTCxHQUFxQixLQUFyQjtBQUNBLFVBQUksZ0JBQWdCLEtBQUssSUFBTCxDQUFVLGFBQVYsSUFBMkIsR0FBRyxNQUFsRDtBQUZ5QjtBQUFBO0FBQUE7O0FBQUE7QUFHekIsOEJBQWlCLE1BQU0sSUFBTixDQUFXLEtBQUssYUFBaEIsQ0FBakIsbUlBQWlEO0FBQUEsY0FBeEMsSUFBd0M7O0FBQy9DLGNBQUksT0FBSjtBQUNBLGNBQUssVUFBVSxLQUFLLFdBQUwsQ0FBaUIsSUFBakIsRUFBdUIsSUFBdkIsRUFBNkIsS0FBN0IsQ0FBZixFQUFxRDtBQUNuRCxnQkFBSSxlQUFlLElBQW5CLEVBQXlCO0FBQ3ZCLG1CQUFLLGFBQUw7QUFDQSxrQkFBSSxjQUFjLElBQWxCO0FBQ0Q7QUFDRCxnQkFBSSxhQUFKLEVBQW1CO0FBQUUsZ0JBQUUsT0FBRixDQUFVLE9BQVYsRUFBbUIsV0FBbkIsRUFBZ0MsS0FBSyxhQUFMLEdBQXFCLENBQXJEO0FBQTBEO0FBQy9FLGdCQUFJLFFBQVEsYUFBUixFQUFKLEVBQTZCO0FBQUUsbUJBQUssZUFBTCxDQUFxQixPQUFyQixFQUE4QixJQUE5QixFQUFvQyxLQUFwQztBQUE2QztBQUM1RSxpQkFBSyxJQUFMLENBQVUsV0FBVixDQUFzQixPQUF0QjtBQUNBLGlCQUFLLGdCQUFMLENBQXNCLE9BQXRCLEVBQStCLElBQS9CLEVBQXFDLEtBQXJDO0FBQ0Q7QUFDRjtBQWZ3QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBZ0IxQjs7OzJDQUVzQixJLEVBQU0sQ0FBRTs7OzRCQUV2QixLLEVBQU87QUFDYixVQUFJLEtBQUssR0FBVDtBQUNBLFlBQU0sS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLEdBQWYsQ0FBTjtBQUNBLFVBQUksU0FBUyxJQUFiLEVBQW1CO0FBQ2pCLFlBQUksS0FBSyxJQUFMLENBQVUsTUFBVixHQUFtQixDQUF2QixFQUEwQjtBQUFFLGdCQUFNLEdBQU47QUFBWTtBQUN4QyxjQUFNLEtBQU47QUFDRDtBQUNELGFBQU8sRUFBUDtBQUNEOzs7NkJBRVEsTyxFQUFTO0FBQ2hCLFVBQUksV0FBVyxJQUFmLEVBQXFCO0FBQUUsa0JBQVUsRUFBVjtBQUFlO0FBQ3RDLGdCQUFVLFFBQVEsUUFBUixFQUFWO0FBQ0EsVUFBSSxPQUFPLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBZSxHQUFmLENBQVg7QUFDQSxVQUFLLFFBQVEsTUFBUixHQUFpQixDQUFsQixJQUF5QixLQUFLLE1BQUwsR0FBYyxDQUEzQyxFQUErQztBQUM3QyxxQkFBVyxJQUFYLFNBQW1CLE9BQW5CO0FBQ0QsT0FGRCxNQUVPLElBQUksUUFBUSxNQUFSLEdBQWlCLENBQXJCLEVBQXdCO0FBQzdCLHFCQUFXLE9BQVg7QUFDRCxPQUZNLE1BRUE7QUFDTCxxQkFBVyxJQUFYO0FBQ0Q7QUFDRjs7QUFFRDs7Ozs7OztxQ0FJaUIsSSxFQUFNLEksRUFBTSxLLEVBQU8sSyxFQUFPLEksRUFBTTtBQUFBOztBQUMvQyxhQUFPLE1BQU0sSUFBTixJQUFjLE1BQU0sSUFBTixLQUFnQixZQUFNO0FBQUUsZ0JBQVEsSUFBUjtBQUMzQyxlQUFLLFVBQUw7QUFBaUIsbUJBQVUsT0FBSyxHQUFmLFNBQXNCLEtBQXRCO0FBQ2pCLGVBQUssTUFBTDtBQUFhLG1CQUFPLE9BQUssR0FBWjtBQUNiLGVBQUssS0FBTDtBQUFZLG1CQUFPLE9BQUssT0FBTCxDQUFhLEtBQWIsQ0FBUDtBQUNaLGVBQUssTUFBTDtBQUFhLG1CQUFPLE9BQUssT0FBTCxFQUFQO0FBQ2IsZUFBSyxPQUFMO0FBQWMsbUJBQU8sT0FBSyxRQUFMLENBQWMsS0FBZCxDQUFQO0FBQ2QsZUFBSyxRQUFMO0FBQWUsbUJBQU8sT0FBSyxRQUFMLEVBQVA7QUFDZixlQUFLLFFBQUw7QUFBZSxtQkFBTyxPQUFLLElBQUwsQ0FBVSxNQUFqQjtBQUNmO0FBQVMsb0lBQThCLElBQTlCLEVBQW9DLElBQXBDLEVBQTBDLEtBQTFDLEVBQWlELEtBQWpELEVBQXdELElBQXhEO0FBUmtDO0FBUzFDLE9BVGlDLEVBQXBDO0FBVUQ7OzsrQkFFVSxJLEVBQU0sTyxFQUFTLEksRUFBTSxLLEVBQU8sUyxFQUFXO0FBQ2hELFVBQUksQ0FBQyxFQUFFLGVBQUYsQ0FBa0IsT0FBbEIsQ0FBTCxFQUFpQztBQUMvQixVQUFFLE9BQUYsQ0FBVSxJQUFWLEVBQWdCLE9BQWhCLEVBQXlCLEtBQUssa0JBQUwsQ0FBd0IsSUFBeEIsRUFBOEIsT0FBOUIsRUFBdUMsSUFBdkMsRUFBNkMsS0FBN0MsQ0FBekI7QUFDRDtBQUNELGFBQU8sS0FBUDtBQUNEOztBQUVEOzs7Ozs7OztvQ0FLZ0IsSSxFQUFNLEksRUFBTSxLLEVBQU87QUFDakMsYUFBTyxFQUFFLFlBQUYsQ0FBZSxJQUFmLEVBQXFCLE9BQXJCLEVBQThCLFVBQVMsU0FBVCxFQUFvQixLQUFwQixFQUEyQjtBQUM5RCxhQUFLLHNCQUFMLENBQTRCLElBQTVCO0FBQ0EsYUFBSyxnQkFBTCxDQUFzQixTQUF0QixFQUFpQyxJQUFqQyxFQUF1QyxLQUF2Qzs7QUFFQSxnQkFBUSxFQUFFLE9BQUYsQ0FBVSxTQUFWLEVBQXFCLE9BQXJCLENBQVIsQ0FKOEQsQ0FJdkI7QUFDdkMsWUFBSyxVQUFVLFdBQVgsSUFBNEIsVUFBVSxFQUExQyxFQUErQztBQUM3QyxpQkFBTyxVQUFVLFVBQVYsQ0FBcUIsV0FBckIsQ0FBaUMsU0FBakMsQ0FBUDtBQUNELFNBRkQsTUFFTztBQUNMLGNBQUksT0FBTyxNQUFNLEtBQU4sQ0FBWSxHQUFaLENBQVg7QUFDQSxjQUFJLFNBQVMsS0FBSyxDQUFMLENBQWI7QUFDQSxjQUFJLFdBQVcsS0FBSyxDQUFMLENBQWY7O0FBRUEsY0FBSSxZQUFZLElBQUksSUFBSixDQUFTO0FBQ3ZCLGtCQUFNLFNBRGlCO0FBRXZCLG1CQUFPLEtBQUssS0FGVztBQUd2QixpQkFBSyxRQUhrQjtBQUl2Qix1QkFBVyxLQUFLLFNBSk87QUFLdkIsa0JBQU0sS0FBSyxJQUFMLENBQVUsTUFBVixDQUFpQixDQUFDLEtBQUssYUFBTCxHQUFxQixDQUF0QixDQUFqQixDQUxpQjtBQU12QiwwQkFOdUI7QUFPdkIscUJBQVMsVUFBVSxTQUFWLENBQW9CLEtBQXBCLENBUGM7QUFRdkIsMkJBQWUsS0FBSztBQVJHLFdBQVQsQ0FBaEI7O0FBV0Esb0JBQVUsSUFBVixDQUFlLElBQWY7QUFDQSxpQkFBTyxLQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLFNBQW5CLENBQVA7QUFDRDtBQUNGLE9BMUJNLEVBMkJMLElBM0JLLENBQVA7QUE0QkQ7Ozs7RUFqTmdCLE07O0FBbU5uQixLQUFLLFNBQUw7O0FBRUEsT0FBTyxFQUFQLENBQVUsT0FBVixDQUFrQixJQUFsQixHQUF5QixJQUF6Qjs7Ozs7QUMzTkEsUUFBUSxXQUFSO0FBQ0EsUUFBUSwrQkFBUjtBQUNBLFFBQVEsZ0NBQVI7QUFDQSxRQUFRLG1DQUFSOzs7Ozs7O0FDSEEsSUFBSSxLQUFLLFFBQVEsY0FBUixDQUFUOztJQUVNLE0sR0FDSixnQkFBWSxNQUFaLEVBQW9CLElBQXBCLEVBQTBCLE9BQTFCLEVBQW1DO0FBQUE7O0FBQUEsOEJBQ2hCLE9BQU8sdUJBQVAsQ0FBK0IsT0FBL0IsQ0FEZ0I7QUFBQSxNQUM1QixRQUQ0Qix5QkFDNUIsUUFENEI7O0FBRWpDLE9BQUssTUFBTCxHQUFjO0FBQUEsV0FBTSxTQUFTLElBQVQsQ0FBYyxNQUFkLENBQU47QUFBQSxHQUFkO0FBQ0QsQzs7QUFHSCxHQUFHLGdCQUFILENBQW9CLFFBQXBCLEVBQThCLE1BQTlCOzs7OztBQ1RBLFFBQVEsV0FBUjtBQUNBLFFBQVEscUNBQVI7QUFDQSxRQUFRLHFDQUFSO0FBQ0EsUUFBUSxxQ0FBUjtBQUNBLFFBQVEscUNBQVI7QUFDQSxRQUFRLHVDQUFSO0FBQ0EsUUFBUSxnQ0FBUjtBQUNBLFFBQVEsaUNBQVI7QUFDQSxRQUFRLGdDQUFSO0FBQ0EsUUFBUSxvQ0FBUjtBQUNBLFFBQVEsZ0NBQVI7QUFDQSxRQUFRLGlDQUFSO0FBQ0EsUUFBUSxrQ0FBUjtBQUNBLFFBQVEsaUNBQVI7QUFDQSxRQUFRLCtCQUFSO0FBQ0EsUUFBUSxrQ0FBUjtBQUNBLFFBQVEsaUNBQVI7QUFDQSxRQUFRLGtDQUFSO0FBQ0EsUUFBUSxxQ0FBUjtBQUNBLFFBQVEsaUNBQVI7QUFDQSxRQUFRLHNDQUFSO0FBQ0EsUUFBUSxxQ0FBUjtBQUNBLFFBQVEsK0JBQVI7QUFDQSxRQUFRLDZDQUFSO0FBQ0EsUUFBUSwwQ0FBUjtBQUNBLFFBQVEseUNBQVI7QUFDQSxRQUFRLG1EQUFSO0FBQ0EsUUFBUSxrQ0FBUjtBQUNBLFFBQVEsZ0NBQVI7QUFDQSxRQUFRLHdDQUFSO0FBQ0EsUUFBUSwwQkFBUjtBQUNBLFFBQVEseUJBQVI7QUFDQSxRQUFRLHFCQUFSO0FBQ0EsUUFBUSxtQ0FBUjtBQUNBLFFBQVEsOEJBQVI7OztBQ2xDQTtBQUNBOzs7O0FDREEsSUFBSSxLQUFLLFFBQVEsY0FBUixDQUFUO0FBQ0EsSUFBSSxJQUFJLEdBQUcsQ0FBWDtBQUNBLEVBQUUsS0FBRixHQUFVLFVBQUUsT0FBRixFQUFXLG9CQUFYLEVBQW9DO0FBQzVDLFNBQVEseUJBQ0csWUFBWSxLQUFaLElBQXFCLFlBQVksR0FBakMsSUFBdUMsWUFBWSxLQUR0RCxDQUFELElBRUcsWUFBWSxhQUZ0QjtBQUdELENBSkQ7O0FBTUEsRUFBRSxJQUFGLEdBQVMsVUFBRSxPQUFGLEVBQVcsb0JBQVgsRUFBb0M7QUFDM0MsU0FBUyx5QkFDTixZQUFXLElBQVgsSUFBbUIsWUFBWSxHQUEvQixJQUFzQyxZQUFZLElBRDVDLENBQVQ7QUFFRCxDQUhEOztBQUtBLEVBQUUsS0FBRixHQUFVLFVBQUUsT0FBRixFQUFXLG9CQUFYLEVBQW1DO0FBQzNDLFNBQVEseUJBQ0gsWUFBWSxLQUFaLElBQXFCLFlBQVksR0FBakMsSUFBd0MsWUFBWSxLQURqRCxDQUFSO0FBRUQsQ0FIRDs7QUFLQSxFQUFFLFVBQUYsR0FBZSxVQUFFLEtBQUYsRUFBUyxvQkFBVCxFQUFrQztBQUMvQyxNQUFLLFVBQVUsYUFBVixJQUNFLHlCQUNKLFVBQVUsS0FBVixJQUFtQixVQUFVLElBQTdCLElBQXFDLFVBQVUsS0FEM0MsQ0FEUCxFQUUyRDtBQUN6RCxXQUFPLElBQVA7QUFDRDtBQUNELFNBQU8sS0FBUDtBQUNELENBUEQ7Ozs7OztBQ2xCQTtBQUNBLElBQUksT0FBTyxFQUFQLEtBQWMsU0FBbEIsRUFBNkI7QUFDM0IsU0FBTyxFQUFQLEdBQVksRUFBWjtBQUNEOztBQUVELE9BQU8sT0FBUCxHQUFpQixPQUFPLEVBQXhCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCB7IF8gfSA9IHJoO1xyXG5sZXQgeyAkIH0gPSByaDtcclxuXHJcbnZhciBDb25zb2xlID0gKGZ1bmN0aW9uKCkge1xyXG4gIGxldCBvdmVycmlkZXMgPSB1bmRlZmluZWQ7XHJcbiAgbGV0IGNvbG9ycyA9IHVuZGVmaW5lZDtcclxuICBDb25zb2xlID0gY2xhc3MgQ29uc29sZSBleHRlbmRzIHJoLlBsdWdpbiB7XHJcbiAgICBzdGF0aWMgaW5pdENsYXNzKCkge1xyXG4gIFxyXG4gICAgICBvdmVycmlkZXMgPSBbJ2luZm8nLCAnbG9nJywgJ3dhcm4nLCAnZGVidWcnLCAnZXJyb3InXTtcclxuICBcclxuICAgICAgY29sb3JzID0gWycjMDBGRjAwJywgJyMwMDAwMDAnLCAnIzAwMDBGRicsICcjMDAwMEZGJywgJyNGRjAwMDAnXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgc3VwZXIoKTtcclxuICAgICAgdGhpcy4kZWwgPSAkKCcjY29uc29sZScsIDApO1xyXG5cclxuICAgICAgaWYgKHRoaXMuJGVsKSB7XHJcbiAgICAgICAgaWYgKHdpbmRvdy5jb25zb2xlID09IG51bGwpIHsgd2luZG93LmNvbnNvbGUgPSB7fTsgfVxyXG4gICAgICAgIHRoaXMuYXR0YWNoT3duZXIod2luZG93LmNvbnNvbGUpO1xyXG4gICAgICAgIHRoaXMuYWRkT3ZlcnJpZGVzKG92ZXJyaWRlcyk7XHJcbiAgICAgICAgXy5lYWNoKG92ZXJyaWRlcywgZnVuY3Rpb24oZm5OYW1lLCBpbmRleCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXNbZm5OYW1lXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbG9yID0gY29sb3JzW2luZGV4XTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9nZ2VyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICAsIHRoaXMpO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlQ2hpbGROb2RlcygpO1xyXG4gICAgICAgIHRoaXMuc2V0VXBJbnB1dEJveCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb3duZXJJc0NoYW5nZWQoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLiRlbC5zdHlsZS5kaXNwbGF5ID0gKCgpID0+IHtcclxuICAgICAgICBpZiAodGhpcy5oYXNPd25lcigpKSB7IHJldHVybiAnJzsgfSBlbHNlIGlmICh0aGlzLiRlbCkgeyByZXR1cm4gJ25vbmUnOyB9XHJcbiAgICAgIH0pKCk7XHJcbiAgICB9XHJcblxyXG4gICAgbG9nZ2VyKG9sZEhhbmRsZXIsIGFyZ3MsIHRhZykge1xyXG4gICAgICBpZiAodGFnID09IG51bGwpIHsgdGFnID0gJ3NwYW4nOyB9XHJcbiAgICAgIGxldCBtZXNzYWdlcyA9IFtdO1xyXG4gICAgICBsZXQgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnKTtcclxuICAgICAgZm9yIChsZXQgYXJnIG9mIEFycmF5LmZyb20oYXJncykpIHtcclxuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGFyZykgfHwgXy5pc1N0cmluZyhhcmcpKSB7XHJcbiAgICAgICAgICBtZXNzYWdlcy5wdXNoKGFyZyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChhcmcgIT0gbnVsbCkge1xyXG4gICAgICAgICAgdmFyIG1zZztcclxuICAgICAgICAgIHRyeSB7IG1zZyA9IEpTT04uc3RyaW5naWZ5KGFyZyk7IH1cclxuICAgICAgICAgIGNhdGNoIChlKSB7IG1zZyA9IGAke2UubmFtZX06ICR7ZS5tZXNzYWdlfWA7IH1cclxuICAgICAgICAgIG1lc3NhZ2VzLnB1c2gobXNnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgbWVzc2FnZXMucHVzaCgndW5kZWZpbmVkJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLmNvbG9yID09PSAnI0ZGMDAwMCcpIHsgbWVzc2FnZXMucHVzaChfLnN0YWNrVHJhY2UoKSk7IH1cclxuICAgICAgbm9kZS5zdHlsZS5jb2xvciA9IHRoaXMuY29sb3I7XHJcbiAgICAgICQudGV4dENvbnRlbnQobm9kZSwgbWVzc2FnZXMuam9pbignICcpKTtcclxuXHJcbiAgICAgIHRoaXMuJGxvZ05vZGUuYXBwZW5kQ2hpbGQobm9kZSk7XHJcbiAgICAgIHRoaXMuJGxvZ05vZGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnInKSk7XHJcbiAgICAgIHRoaXMuJGVsLnNjcm9sbFRvcCA9IHRoaXMuJGVsLnNjcm9sbEhlaWdodDtcclxuXHJcbiAgICAgIGlmIChvbGRIYW5kbGVyKSB7IHJldHVybiBvbGRIYW5kbGVyKGFyZ3MpOyB9XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlQ2hpbGROb2RlcygpIHtcclxuICAgICAgdGhpcy4kbG9nTm9kZSA9ICQuZmluZCh0aGlzLiRlbCwgJ3AnKVswXTtcclxuICAgICAgaWYgKCF0aGlzLiRsb2dOb2RlKSB7XHJcbiAgICAgICAgdGhpcy4kbG9nTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcclxuICAgICAgICB0aGlzLiRsb2dOb2RlLmNsYXNzTmFtZSA9ICdjb25zb2xlJztcclxuICAgICAgICB0aGlzLiRlbC5hcHBlbmRDaGlsZCh0aGlzLiRsb2dOb2RlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy4kaW5wdXQgPSAkLmZpbmQodGhpcy4kZWwsICdpbnB1dCcpWzBdO1xyXG4gICAgICBpZiAoIXRoaXMuJGlucHV0KSB7XHJcbiAgICAgICAgbGV0ICRsYWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xhYmVsJyk7XHJcbiAgICAgICAgJC50ZXh0Q29udGVudCgkbGFibGUsICc+ICcpO1xyXG4gICAgICAgICRsYWJsZS5zdHlsZS5jb2xvciA9ICdibHVlJztcclxuICAgICAgICB0aGlzLiRpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgdGhpcy4kaW5wdXQudHlwZSA9ICd0ZXh0JztcclxuICAgICAgICB0aGlzLiRpbnB1dC5jbGFzc05hbWUgPSAnY29uc29sZSc7XHJcbiAgICAgICAgdGhpcy4kaW5wdXQuc3R5bGUud2lkdGggPSAnOTglJztcclxuICAgICAgICB0aGlzLiRpbnB1dC5zdHlsZS5ib3JkZXIgPSAnMCc7XHJcbiAgICAgICAgdGhpcy4kaW5wdXQuc3R5bGUucGFkZGluZyA9ICcycHgnO1xyXG4gICAgICAgIHRoaXMuJGlucHV0LnBsYWNlaG9sZGVyID0gJ0VudGVyIGEgdmFsaWQgZXhwcmVzc2lvbic7XHJcbiAgICAgICAgJGxhYmxlLmFwcGVuZENoaWxkKHRoaXMuJGlucHV0KTtcclxuICAgICAgICByZXR1cm4gdGhpcy4kZWwuYXBwZW5kQ2hpbGQoJGxhYmxlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldFVwSW5wdXRCb3goKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLiRpbnB1dC5vbmtleWRvd24gPSBldmVudCA9PiB7XHJcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XHJcbiAgICAgICAgICB0aGlzLmNvbG9yID0gJyMwMDAwRkYnO1xyXG4gICAgICAgICAgbGV0IGV4cHIgPSB0aGlzLiRpbnB1dC52YWx1ZTtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxldCByZXRWYWwgPSBGdW5jdGlvbignZXZlbnQnLCBgcmV0dXJuICR7ZXhwcn1gKShldmVudCk7XHJcbiAgICAgICAgICAgIHRoaXMuJGlucHV0LnZhbHVlID0gJyc7XHJcbiAgICAgICAgICAgIHRoaXMubG9nZ2VyKG51bGwsIFtleHByXSwgJ2InKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9nZ2VyKG51bGwsIFtyZXRWYWxdKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgdGhpcy5jb2xvciA9ICcjRkYxMTAwJztcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9nZ2VyKG51bGwsIFtgJHtlLm5hbWV9OiAke2UubWVzc2FnZX1gXSwgJ2InKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcbiAgfTtcclxuICBDb25zb2xlLmluaXRDbGFzcygpO1xyXG4gIHJldHVybiBDb25zb2xlO1xyXG59KSgpO1xyXG5cclxucmguQ29uc29sZSA9IENvbnNvbGU7XHJcbiIsImxldCBjb25zdHM7XHJcbmxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCBjYWNoZSA9IHt9O1xyXG5cclxucmguY29uc3RzID0gKGNvbnN0cyA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcclxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgaWYgKHJoLl9kZWJ1Zykge1xyXG4gICAgICBpZiAoIShrZXkgaW4gY2FjaGUpKSB7IHJoLl9kKCdlcnJvcicsICdjb25zdHMnLCBgJHtrZXl9IGlzIG5vdCBhdmFpbGFibGVgKTsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNhY2hlW2tleV07XHJcbiAgfSBlbHNlIGlmIChrZXkgaW4gY2FjaGUpIHtcclxuICAgIGlmIChyaC5fZGVidWcpIHsgcmV0dXJuIHJoLl9kKCdlcnJvcicsICdjb25zdHMnLCBgJHtrZXl9IGlzIGFscmVhZHkgcmVnaXN0ZXJlZGApOyB9XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBjYWNoZVtrZXldID0gdmFsdWU7XHJcbiAgfVxyXG59KTtcclxuXHJcbi8vIFRlbXAga2V5c1xyXG5jb25zdHMoJ0tFWV9URU1QX0RBVEEnLCAgICAgICAgICAgICAgICAgICcudGVtcC5kYXRhJyk7XHJcblxyXG4vLyBpZnJhbWUga2V5c1xyXG5jb25zdHMoJ0tFWV9TSEFSRURfSU5QVVQnLCAgICAgICAgICAgICAgJy5fc2hhcmVka2V5cy5pbnB1dCcpO1xyXG5jb25zdHMoJ0tFWV9TSEFSRURfT1VUUFVUJywgICAgICAgICAgICAgJy5fc2hhcmVka2V5cy5vdXRwdXQnKTtcclxuY29uc3RzKCdLRVlfSUZSQU1FX0VWRU5UUycsICAgICAgICAgICAgICcubC5pZnJhbWVfZXZlbnRzJyk7XHJcblxyXG4vLyBTY3JlZW4gc3BlY2lmaWNcclxuY29uc3RzKCdLRVlfU0NSRUVOJywgICAgICAgICAgICAgICAgICAgICcubC5zY3JlZW4nKTtcclxuY29uc3RzKCdLRVlfREVGQVVMVF9TQ1JFRU4nLCAgICAgICAgICAgICcubC5kZWZhdWx0X3NjcmVlbicpO1xyXG5jb25zdHMoJ0tFWV9TQ1JFRU5fTkFNRVMnLCAgICAgICAgICAgICAgJy5sLnNjcmVlbl9uYW1lcycpO1xyXG5jb25zdHMoJ0tFWV9TQ1JFRU5fREVTS1RPUCcsXHJcbiAgICAgICBgJHtjb25zdHMoJ0tFWV9TQ1JFRU4nKX0uZGVza3RvcC5hdHRhY2hlZGApO1xyXG5jb25zdHMoJ0tFWV9TQ1JFRU5fVEFCTEVUJyxcclxuICBgJHtjb25zdHMoJ0tFWV9TQ1JFRU4nKX0udGFibGV0LmF0dGFjaGVkYCk7XHJcbmNvbnN0cygnS0VZX1NDUkVFTl9UQUJMRVRfUE9SVFJBSVQnLFxyXG4gIGAke2NvbnN0cygnS0VZX1NDUkVFTicpfS50YWJsZXRfcG9ydHJhaXQuYXR0YWNoZWRgKTtcclxuY29uc3RzKCdLRVlfU0NSRUVOX1BIT05FJyxcclxuICBgJHtjb25zdHMoJ0tFWV9TQ1JFRU4nKX0ucGhvbmUuYXR0YWNoZWRgKTtcclxuY29uc3RzKCdLRVlfU0NSRUVOX0lPUycsXHJcbiAgYCR7Y29uc3RzKCdLRVlfU0NSRUVOJyl9Lmlvcy5hdHRhY2hlZGApO1xyXG5jb25zdHMoJ0tFWV9TQ1JFRU5fSVBBRCcsXHJcbiAgYCR7Y29uc3RzKCdLRVlfU0NSRUVOJyl9LmlwYWQuYXR0YWNoZWRgKTtcclxuY29uc3RzKCdLRVlfU0NSRUVOX1BSSU5UJyxcclxuICBgJHtjb25zdHMoJ0tFWV9TQ1JFRU4nKX0ucHJpbnQuYXR0YWNoZWRgKTtcclxuXHJcbi8vIEV2ZW50c1xyXG5jb25zdHMoJ0VWVF9PUklFTlRBVElPTl9DSEFOR0UnLCAgICAgICAgICcuZS5vcmllbnRhdGlvbmNoYW5nZScpO1xyXG5jb25zdHMoJ0VWVF9IQVNIX0NIQU5HRScsICAgICAgICAgICAgICAgICcuZS5oYXNoY2hhbmdlJyk7XHJcbmNvbnN0cygnRVZUX1dJREdFVF9CRUZPUkVMT0FEJywgICAgICAgICAgJy5lLndpZGdldF9iZWZvcmVsb2FkJyk7XHJcbmNvbnN0cygnRVZUX1dJREdFVF9MT0FERUQnLCAgICAgICAgICAgICAgJy5lLndpZGdldF9sb2FkZWQnKTtcclxuY29uc3RzKCdFVlRfQkVGT1JFX1VOTE9BRCcsICAgICAgICAgICAgICAnLmUuYmVmb3JlX3VubG9hZCcpO1xyXG5jb25zdHMoJ0VWVF9VTkxPQUQnLCAgICAgICAgICAgICAgICAgICAgICcuZS51bmxvYWQnKTtcclxuY29uc3RzKCdFVlRfTU9VU0VNT1ZFJywgICAgICAgICAgICAgICAgICAnLmUubW91c2Vtb3ZlJyk7XHJcbmNvbnN0cygnRVZUX1NXSVBFX0RJUicsICAgICAgICAgICAgICAgICAgJy5lLnN3aXBlX2RpcicpO1xyXG5jb25zdHMoJ0VWVF9GQVNUX0NMSUNLJywgICAgICAgICAgICAgICAgICcuZS5mYXN0X2NsaWNrJyk7XHJcbmNvbnN0cygnRVZUX0NMSUNLX0lOU0lERV9JRlJBTUUnLCAgICAgICAgJy5lLmNsaWNrX2luc2lkZV9pZnJhbWUnKTtcclxuY29uc3RzKCdFVlRfU0NST0xMX0lOU0lERV9JRlJBTUUnLCAgICAgICAnLmUuc2Nyb2xsX2luc2lkZV9pZnJhbWUnKTtcclxuY29uc3RzKCdFVlRfSU5TSURFX0lGUkFNRV9ET01fQ09OVEVOVExPQURFRCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2UuaW5zaWRlX2lmcmFtZV9kb21fY29udGVudGxvYWRlZCcpO1xyXG5jb25zdHMoJ1JITUFQTk8nLCAgICAgICAgICAgICAgICAgICAgICAgICAncmhtYXBubycpO1xyXG5jb25zdHMoJ1RPUElDX0ZJTEUnLCAgICAgICAgICAgICAgICAgICAgICAndG9waWMuaHRtJyk7XHJcbmNvbnN0cygnSE9NRV9QQUdFJywgICAgICAgICAgICAgICAgICAgICAgICdpbmRleC5odG0nKTtcclxuIiwibGV0IHsgcmggfSA9IHdpbmRvdztcclxubGV0IHsgXyB9ID0gcmg7XHJcblxyXG5yaC5jb250cm9sbGVyID0gXy5jYWNoZShfLmlzRnVuY3Rpb24pO1xyXG4iLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5sZXQgeyBfIH0gPSByaDtcclxubGV0IHsgJCB9ID0gcmg7XHJcbmxldCB7IG1vZGVsIH0gPSByaDtcclxuXHJcbmxldCBsb2FkV2lkZ2V0cyA9IChwYXJlbnROb2RlLCBwYXJlbnQpID0+XHJcbiAgXy5lYWNoKCQuZmluZChwYXJlbnROb2RlLCAnW2RhdGEtcmh3aWRnZXRdJyksIGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIGlmICgkLmRhdGFzZXQobm9kZSwgJ2xvYWRlZCcpKSB7IHJldHVybjsgfSAvL2l0IGNhbiBiZSBlbXB0eSBzdHJpbmcgb24gb2xkIGJyb3dzZXJcclxuICAgIGlmICghJC5pc0Rlc2NlbmRlbnQocGFyZW50Tm9kZSwgbm9kZSkpIHsgcmV0dXJuOyB9IC8vaWdub3JlIG5lc3RlZCB3aWRnZXQgZGF0YVxyXG4gICAgbGV0IGNvbmZpZyA9ICQuZGF0YXNldChub2RlLCAnY29uZmlnJyk7XHJcbiAgICBjb25maWcgPSBjb25maWcgPyBfLnJlc29sdmVOaWNlSlNPTihjb25maWcpIDoge307XHJcbiAgICByZXR1cm4gXy5lYWNoKF8ucmVzb2x2ZVdpZGdldEFyZ3MoJC5kYXRhc2V0KG5vZGUsICdyaHdpZGdldCcpKSwgZnVuY3Rpb24od0luZm8pIHtcclxuICAgICAgbGV0IHt3TmFtZSwgd0FyZywgcGlwZWRBcmdzLCByYXdBcmd9ID0gd0luZm87XHJcbiAgICAgIGlmICh3TmFtZVswXSA9PT0gd05hbWVbMF0udG9Mb3dlckNhc2UoKSkgeyAvL2RhdGEgd2lkZ2V0XHJcbiAgICAgICAgY29uZmlnLnJhd0FyZyA9IHJhd0FyZztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAocGlwZWRBcmdzLmxlbmd0aCA+IDApIHsgY29uZmlnLnBpcGVkQXJncyA9IHBpcGVkQXJnczsgfVxyXG4gICAgICAgIGlmICh3QXJnKSB7IF8uZXh0ZW5kKGNvbmZpZywgd0FyZyk7IH1cclxuICAgICAgfVxyXG4gICAgICBjb25maWcubm9kZSA9IG5vZGU7XHJcbiAgICAgIGxldCB3Y2xhc3MgPSByaC53aWRnZXRzW3dOYW1lXTtcclxuICAgICAgbGV0IHdpZGdldCA9IG5ldyB3Y2xhc3MoY29uZmlnKTtcclxuICAgICAgcmV0dXJuIHdpZGdldC5pbml0KHBhcmVudCk7XHJcbiAgICB9KTtcclxuICB9KVxyXG47XHJcbiAgXHJcbi8vZGF0YS1yaHRhZ3MgaXMgc3ludGhhdGljIHN1Z2VyKHNob3J0Y3V0KSBmb3IgZGF0YS1yaHdpZGdldHM9J0NvbnRlbnRGaWx0ZXInIGFuZFxyXG4vLyBkYXRhLWNvbmZpZz0ne1wiaWRcIjogXCIxXCJ9J1xyXG5sZXQgbG9hZENvbnRlbnRGaWx0ZXIgPSBwYXJlbnROb2RlID0+XHJcbiAgKCgpID0+IHtcclxuICAgIGxldCByZXN1bHQgPSBbXTtcclxuICAgIGZvciAobGV0IG5vZGUgb2YgQXJyYXkuZnJvbSgkLmZpbmQocGFyZW50Tm9kZSwgJ1tkYXRhLXJodGFnc10nKSkpIHtcclxuICAgICAgdmFyIHdpZGdldDtcclxuICAgICAgaWYgKCEkLmlzRGVzY2VuZGVudChwYXJlbnROb2RlLCBub2RlKSkgeyBjb250aW51ZTsgfSAvL2lnbm9yZSBuZXN0ZWQgd2lkZ2V0IGRhdGFcclxuICAgICAgbGV0IGNvbmZpZyA9ICQuZGF0YXNldChub2RlLCAnY29uZmlnJyk7XHJcbiAgICAgIGNvbmZpZyA9IGNvbmZpZyA/IF8ucmVzb2x2ZU5pY2VKU09OKGNvbmZpZykgOiB7fTtcclxuICAgICAgY29uZmlnLmlkcyA9ICQuZGF0YXNldChub2RlLCAncmh0YWdzJykuc3BsaXQoJywnKTtcclxuICAgICAgY29uZmlnLm5vZGUgPSBub2RlO1xyXG4gICAgICByZXN1bHQucHVzaCh3aWRnZXQgPSBuZXcgcmgud2lkZ2V0cy5Db250ZW50RmlsdGVyKGNvbmZpZykpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9KSgpXHJcbjtcclxuXHJcbmxldCBsb2FkRGF0YUhhbmRsZXJzID0gZnVuY3Rpb24ocGFyZW50Tm9kZSwgcGFyZW50KSB7XHJcbiAgbG9hZFdpZGdldHMocGFyZW50Tm9kZSwgcGFyZW50KTtcclxuICByZXR1cm4gbG9hZENvbnRlbnRGaWx0ZXIocGFyZW50Tm9kZSk7XHJcbn07XHJcblxyXG5fLmxvYWRXaWRnZXRzID0gbG9hZFdpZGdldHM7XHJcbl8ubG9hZENvbnRlbnRGaWx0ZXIgPSBsb2FkQ29udGVudEZpbHRlcjtcclxuXy5sb2FkRGF0YUhhbmRsZXJzID0gbG9hZERhdGFIYW5kbGVycztcclxuIiwibGV0IHsgcmggfSA9IHdpbmRvdztcclxubGV0IHsgXyB9ID0gcmg7XHJcblxyXG5yaC5fcGFyYW1zID0gXy51cmxQYXJhbXMoKTtcclxucmguX2RlYnVnRmlsdGVyID0gXy50b1JlZ0V4cChyaC5fcGFyYW1zLnJoX2RlYnVnKTtcclxucmguX2RlYnVnID0gKHJoLl9kZWJ1Z0ZpbHRlciAhPSBudWxsKTtcclxuXHJcbnJoLl90ZXN0RmlsdGVyID0gXy50b1JlZ0V4cChyaC5fcGFyYW1zLnJoX3Rlc3QpO1xyXG5yaC5fdGVzdCA9IChyaC5fdGVzdEZpbHRlciAhPSBudWxsKTtcclxuXHJcbnJoLl9lcnJvckZpbHRlciA9IF8udG9SZWdFeHAocmguX3BhcmFtcy5yaF9lcnJvcik7XHJcbnJoLl9lcnJvciA9IChyaC5fZXJyb3JGaWx0ZXIgIT0gbnVsbCk7XHJcblxyXG5yaC5fYnJlYWtGaWx0ZXIgPSBfLnRvUmVnRXhwKHJoLl9wYXJhbXMucmhfYnJlYWspO1xyXG5yaC5fYnJlYWsgPSAocmguX2JyZWFrRmlsdGVyICE9IG51bGwpO1xyXG5cclxubGV0IG1hdGNoRmlsdGVyID0gKG1lc3NhZ2VzLCBmaWx0ZXIpID0+IG1lc3NhZ2VzLmpvaW4oJyAnKS5tYXRjaChmaWx0ZXIpO1xyXG5cclxucmguX2QgPSBmdW5jdGlvbigpIHtcclxuICBsZXQgeyBjb25zb2xlIH0gPSB3aW5kb3c7XHJcbiAgaWYgKHJoLl9kZWJ1ZyAmJiBjb25zb2xlICYmIF8uaXNGdW5jdGlvbihjb25zb2xlLmxvZykpIHtcclxuICAgIGxldCBmbjtcclxuICAgIGxldCBhcmdzID0gW107IGxldCBpID0gLTE7XHJcbiAgICB3aGlsZSAoKytpIDwgYXJndW1lbnRzLmxlbmd0aCkgeyBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTsgfVxyXG4gICAgaWYgKFsnaW5mbycsICdsb2cnLCAnd2FybicsICdkZWJ1ZycsICdlcnJvciddLmluZGV4T2YoYXJnc1swXSkgPiAtMSkge1xyXG4gICAgICBmbiA9IGNvbnNvbGVbYXJnc1swXV07XHJcbiAgICAgIGFyZ3MgPSBhcmdzLnNsaWNlKDEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZm4gPSBjb25zb2xlLmRlYnVnO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBuZXdBcmdzID0gW2BbICR7YXJnc1swXX0gXTpgXS5jb25jYXQoYXJncy5zbGljZSgxKSk7XHJcbiAgICBpZiAoKHJoLl9kZWJ1Z0ZpbHRlciA9PT0gJycpIHx8IG1hdGNoRmlsdGVyKG5ld0FyZ3MsIHJoLl9kZWJ1Z0ZpbHRlcikpIHtcclxuICAgICAgaWYgKHJoLl9icmVhayAmJiBtYXRjaEZpbHRlcihuZXdBcmdzLCByaC5fYnJlYWtGaWx0ZXIpKSB7XHJcbiAgICAgICAgcmV0dXJuIEZ1bmN0aW9uKCcnLCAnZGVidWdnZXInKSgpO1xyXG4gICAgICB9IGVsc2UgaWYgKHJoLl9lcnJvciAmJiBtYXRjaEZpbHRlcihuZXdBcmdzLCByaC5fZXJyb3JGaWx0ZXIpKSB7XHJcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IuYXBwbHkoY29uc29sZSwgbmV3QXJncyk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KGNvbnNvbGUsIG5ld0FyZ3MpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG4iLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5cclxuY2xhc3MgR3VhcmQge1xyXG4gIFxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5ndWFyZCA9IHRoaXMuZ3VhcmQuYmluZCh0aGlzKTtcclxuICB9XHJcblxyXG4gIGd1YXJkKGZuLCBndWFyZE5hbWUpIHtcclxuICAgIGlmICh0aGlzLmd1YXJkZWROYW1lcyA9PSBudWxsKSB7IHRoaXMuZ3VhcmRlZE5hbWVzID0gW107IH1cclxuICAgIGlmICh0aGlzLmd1YXJkZWROYW1lcy5pbmRleE9mKGd1YXJkTmFtZSkgPT09IC0xKSB7XHJcbiAgICAgIHRoaXMuZ3VhcmRlZE5hbWVzLnB1c2goZ3VhcmROYW1lKTtcclxuICAgICAgZm4uY2FsbCh0aGlzKTtcclxuICAgICAgcmV0dXJuIHRoaXMuZ3VhcmRlZE5hbWVzLnNwbGljZSh0aGlzLmd1YXJkZWROYW1lcy5pbmRleE9mKGd1YXJkTmFtZSksIDEpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxucmguR3VhcmQgPSBHdWFyZDtcclxucmguZ3VhcmQgPSAobmV3IEd1YXJkKCkpLmd1YXJkO1xyXG4gICIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCB7IF8gfSA9IHJoO1xyXG5sZXQgeyAkIH0gPSByaDtcclxuXHJcbmxldCBkZWZhdWx0T3B0cyA9XHJcbiAge2FzeW5jOiB0cnVlfTtcclxuXHJcbmxldCBmb3JtRGF0YSA9IChyaC5mb3JtRGF0YSA9IGZ1bmN0aW9uKG9wdHMpIHtcclxuICBsZXQgZm9ybV9kYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YTtcclxuICBfLmVhY2gob3B0cywgKHZhbHVlLCBrZXkpID0+IGZvcm1fZGF0YS5hcHBlbmQoa2V5LCB2YWx1ZSkpO1xyXG4gIHJldHVybiBmb3JtX2RhdGE7XHJcbn0pO1xyXG5cclxuLy9wcml2YXRlIGNsYXNzIG9mIGh0dHAgYXBpXHJcbmNsYXNzIFJlc3BvbnNlIHtcclxuXHJcbiAgY29uc3RydWN0b3IoeGhyLCBvcHRzKSB7XHJcbiAgICB0aGlzLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHRoaXMub25yZWFkeXN0YXRlY2hhbmdlLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLnhociA9IHhocjtcclxuICAgIHRoaXMub3B0cyA9IG9wdHM7XHJcbiAgICBpZiAodGhpcy5vcHRzLnN1Y2Nlc3MgIT0gbnVsbCkgeyB0aGlzLnN1Y2Nlc3ModGhpcy5vcHRzLnN1Y2Nlc3MpOyB9XHJcbiAgICBpZiAodGhpcy5vcHRzLmVycm9yICE9IG51bGwpIHsgdGhpcy5lcnJvcih0aGlzLm9wdHMuZXJyb3IpOyB9XHJcbiAgICB0aGlzLnhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSB0aGlzLm9ucmVhZHlzdGF0ZWNoYW5nZTtcclxuICB9XHJcbiAgICBcclxuICBvbnJlYWR5c3RhdGVjaGFuZ2UoKSB7XHJcbiAgICBpZiAodGhpcy54aHIucmVhZHlTdGF0ZSAhPT0gNCkgeyByZXR1cm47IH1cclxuXHJcbiAgICBsZXQgdGV4dCA9IHRoaXMueGhyLnJlc3BvbnNlVGV4dDtcclxuICAgIGxldCB7IHN0YXR1cyB9ID0gdGhpcy54aHI7XHJcbiAgICBsZXQgaGVhZGVycyA9IG5hbWUgPT4gdGhpcy54aHIuZ2V0UmVzcG9uc2VIZWFkZXIobmFtZSk7XHJcbiAgICBcclxuICAgIGlmICh0aGlzLmlzU3VjY2VzcyhzdGF0dXMpKSB7XHJcbiAgICAgIGlmICh0aGlzLnN1Y2Nlc3NGbikgeyB0aGlzLnN1Y2Nlc3NGbih0ZXh0LCBzdGF0dXMsIGhlYWRlcnMsIHRoaXMub3B0cyk7IH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh0aGlzLmVycm9yRm4pIHsgdGhpcy5lcnJvckZuKHRleHQsIHN0YXR1cywgaGVhZGVycywgdGhpcy5vcHRzKTsgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmZpbmFsbHlGbikgeyByZXR1cm4gdGhpcy5maW5hbGx5Rm4odGV4dCwgc3RhdHVzLCBoZWFkZXJzLCB0aGlzLm9wdHMpOyB9XHJcbiAgfVxyXG5cclxuICBpc1N1Y2Nlc3Moc3RhdHVzKSB7IHJldHVybiAoKHN0YXR1cyA+PSAyMDApICYmIChzdGF0dXMgPCAzMDApKSB8fCAoc3RhdHVzID09PSAzMDQpOyB9XHJcblxyXG4gIHN1Y2Nlc3MoZm4pIHtcclxuICAgIHRoaXMuc3VjY2Vzc0ZuID0gZm47XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIGVycm9yKGZuKSB7XHJcbiAgICB0aGlzLmVycm9yRm4gPSBmbjtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgZmluYWxseShmbikge1xyXG4gICAgdGhpcy5maW5hbGx5Rm4gPSBmbjtcclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxufVxyXG4gIFxyXG5sZXQgY3JlYXRlUmVxdWVzdCA9IGZ1bmN0aW9uKG9wdHMpIHtcclxuICBsZXQgWEhSID0gd2luZG93LlhNTEh0dHBSZXF1ZXN0IHx8IHdpbmRvdy5BY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MSFRUUCcpO1xyXG4gIGxldCB4aHIgPSBuZXcgWEhSO1xyXG4gIGxldCByZXNwb25zZSA9IG5ldyBSZXNwb25zZSh4aHIsIG9wdHMpO1xyXG4gIHJldHVybiB7eGhyLCByZXNwb25zZX07XHJcbn07XHJcblxyXG4vLyBodHRwIGFwaXNcclxubGV0IGh0dHAgPSAocmguaHR0cCA9IGZ1bmN0aW9uKG9wdHMpIHtcclxuICBvcHRzID0gXy5leHRlbmQoe30sIGRlZmF1bHRPcHRzLCBvcHRzKTtcclxuICBsZXQge3hociwgcmVzcG9uc2V9ID0gY3JlYXRlUmVxdWVzdChvcHRzKTtcclxuICB4aHIub3BlbihvcHRzLm1ldGhvZCwgb3B0cy51cmwsIG9wdHMuYXN5bmMpO1xyXG4gIFxyXG4gIGlmIChvcHRzWydDb250ZW50LXR5cGUnXSkge1xyXG4gICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtdHlwZScsIG9wdHNbJ0NvbnRlbnQtdHlwZSddKTtcclxuICB9XHJcblxyXG4gIHhoci5zZW5kKG9wdHMuZGF0YSk7XHJcbiAgcmV0dXJuIHJlc3BvbnNlO1xyXG59KTtcclxuXHJcbmh0dHAuZ2V0ID0gKHVybCwgb3B0cykgPT4gaHR0cChfLmV4dGVuZCh7dXJsLCBtZXRob2Q6ICdHRVQnfSwgb3B0cykpO1xyXG5cclxuaHR0cC5wb3N0ID0gKHVybCwgZGF0YSwgb3B0cykgPT4gaHR0cChfLmV4dGVuZCh7dXJsLCBtZXRob2Q6ICdQT1NUJywgZGF0YX0sIG9wdHMpKTtcclxuXHJcbmh0dHAucHV0ID0gKHVybCwgZGF0YSwgb3B0cykgPT4gaHR0cChfLmV4dGVuZCh7dXJsLCBtZXRob2Q6ICdQVVQnLCBkYXRhfSwgb3B0cykpO1xyXG5cclxuaHR0cC5qc29ucCA9IGZ1bmN0aW9uKHVybCwgb3B0cykge1xyXG4gIG9wdHMgPSBfLmV4dGVuZCh7fSwgZGVmYXVsdE9wdHMsIG9wdHMpO1xyXG4gIGxldCBub2RlID0gJCgnc2NyaXB0JywgMCkgfHwgZG9jdW1lbnQuaGVhZC5jaGlsZHJlblswXTtcclxuICBsZXQgbmV3Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gIG5ld05vZGUuYXN5bmMgPSBvcHRzLmFzeW5jO1xyXG4gIG5ld05vZGUuc3JjID0gdXJsO1xyXG4gIHJldHVybiBub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIG5vZGUpO1xyXG59O1xyXG4iLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5sZXQgeyBfIH0gPSByaDtcclxubGV0IHsgJCB9ID0gcmg7XHJcbmxldCB7IGNvbnN0cyB9ID0gcmg7XHJcblxyXG5jbGFzcyBJZnJhbWUgZXh0ZW5kcyByaC5HdWFyZCB7XHJcblxyXG4gIHRvU3RyaW5nKCkgeyByZXR1cm4gJ0lmcmFtZSc7IH1cclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgdGhpcy51bnN1YnNjcmliZSA9IHRoaXMudW5zdWJzY3JpYmUuYmluZCh0aGlzKTtcclxuICAgIHRoaXMubGlua2VkU3VicyA9IHt9O1xyXG4gICAgaWYgKF8uaXNJZnJhbWUoKSkge1xyXG4gICAgICByaC5tb2RlbC5zdWJzY3JpYmUoY29uc3RzKCdFVlRfQkVGT1JFX1VOTE9BRCcpLCB0aGlzLnVuc3Vic2NyaWJlKTtcclxuICAgICAgcmgubW9kZWwuc3Vic2NyaWJlKGNvbnN0cygnRVZUX1VOTE9BRCcpLCB0aGlzLnVuc3Vic2NyaWJlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHVuc3Vic2NyaWJlKCkge1xyXG4gICAgaWYgKHRoaXMucGFyZW50KSB7XHJcbiAgICAgIGxldCBtc2cgPSB7aWQ6IHRoaXMuaWR9O1xyXG4gICAgICB0aGlzLnBhcmVudC5wb3N0TWVzc2FnZSh7cmhtb2RlbF91bnN1YnNjcmliZTogbXNnfSwgJyonKTtcclxuICAgICAgcmV0dXJuIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaW5pdCgpIHtcclxuICAgIGlmICh0aGlzLmlkID09IG51bGwpIHsgdGhpcy5pZCA9IF8udW5pcXVlSWQoKTsgfVxyXG4gICAgdGhpcy5wYXJlbnQgPSB3aW5kb3cucGFyZW50O1xyXG4gICAgaWYgKF8uaXNJZnJhbWUoKSkge1xyXG4gICAgICBsZXQgaW5wdXQgPSByaC5tb2RlbC5nZXQoJ19zaGFyZWRrZXlzLmlucHV0Jyk7XHJcbiAgICAgIGlmIChpbnB1dCkge1xyXG4gICAgICAgIGxldCBpbnB1dEtleXMgPSBfLm1hcChpbnB1dCwgZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgaWYgKF8uaXNTdHJpbmcoaXRlbSkpIHsgcmV0dXJuIHtrZXk6IGl0ZW19OyB9IGVsc2UgeyByZXR1cm4gaXRlbTsgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGxldCBtc2cgPSB7aW5wdXQ6IGlucHV0S2V5cywgaWQ6IHRoaXMuaWR9O1xyXG4gICAgICAgIHRoaXMucGFyZW50LnBvc3RNZXNzYWdlKHtyaG1vZGVsX3N1YnNjcmliZTogbXNnfSwgJyonKTtcclxuICAgICAgfVxyXG4gICAgICBsZXQgb3V0cHV0S2V5cyA9IHJoLm1vZGVsLmdldCgnX3NoYXJlZGtleXMub3V0cHV0Jyk7XHJcbiAgICAgIGlmIChvdXRwdXRLZXlzKSB7IHJldHVybiB0aGlzLmxpbmtNb2RlbCh0aGlzLnBhcmVudCwgdGhpcy5pZCwgb3V0cHV0S2V5cyk7IH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNsZWFuKGlkKSB7XHJcbiAgICBsZXQgc3VicyA9IHRoaXMubGlua2VkU3Vic1tpZF07XHJcbiAgICBpZiAoc3Vicykge1xyXG4gICAgICBmb3IgKGxldCB1bnN1YiBvZiBBcnJheS5mcm9tKHN1YnMpKSB7IHVuc3ViKCk7IH1cclxuICAgICAgcmV0dXJuIGRlbGV0ZSB0aGlzLmxpbmtlZFN1YnNbaWRdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGlua01vZGVsKHNvdXJjZSwgaWQsIGtleXMpIHtcclxuICAgIGlmIChrZXlzID09IG51bGwpIHsga2V5cyA9IFtdOyB9XHJcbiAgICBsZXQgc3VicyA9IFtdO1xyXG4gICAgbGV0IGNhbGxiYWNrID0gKHZhbHVlLCBrZXkpID0+IHtcclxuICAgICAgcmV0dXJuIHRoaXMuZ3VhcmQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbGV0IG1zZyA9IHt9OyBtc2dba2V5XSA9IHZhbHVlO1xyXG4gICAgICAgIHJldHVybiBzb3VyY2UucG9zdE1lc3NhZ2Uoe3JobW9kZWxfcHVibGlzaDogbXNnfSwgJyonKTtcclxuICAgICAgfVxyXG4gICAgICAsIGlkKTtcclxuICAgIH07XHJcbiAgICBmb3IgKGxldCBrZXkgb2YgQXJyYXkuZnJvbShrZXlzKSkge1xyXG4gICAgICBrZXkgPSBrZXkudHJpbSgpO1xyXG4gICAgICBzdWJzLnB1c2gocmgubW9kZWwuc3Vic2NyaWJlKGtleSwgY2FsbGJhY2spKTtcclxuICAgIH1cclxuICAgIHRoaXMuY2xlYW4oaWQpO1xyXG4gICAgcmV0dXJuIHRoaXMubGlua2VkU3Vic1tpZF0gPSBzdWJzO1xyXG4gIH1cclxuXHJcbiAgcHVibGlzaChrZXksIHZhbHVlLCBvcHRzKSB7XHJcbiAgICBpZiAob3B0cyA9PSBudWxsKSB7IG9wdHMgPSB7fTsgfVxyXG4gICAgcmV0dXJuIHRoaXMuZ3VhcmQoKCkgPT4gcmgubW9kZWwucHVibGlzaChrZXksIHZhbHVlLCBvcHRzKSk7XHJcbiAgfVxyXG5cclxuICBndWFyZChmbiwgZ3VhcmROYW1lKSB7XHJcbiAgICBpZiAoZ3VhcmROYW1lID09IG51bGwpIHsgZ3VhcmROYW1lID0gdGhpcy5pZDsgfVxyXG4gICAgcmV0dXJuIHN1cGVyLmd1YXJkKGZuLCBndWFyZE5hbWUpO1xyXG4gIH1cclxufVxyXG5cclxucmguaWZyYW1lID0gbmV3IElmcmFtZSgpO1xyXG4iLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5sZXQgeyBfIH0gPSByaDtcclxubGV0IHsgJCB9ID0gcmg7XHJcbmxldCB7IGNvbnN0cyB9ID0gcmg7XHJcblxyXG5cclxubGV0IGhlYWQgPSAkKCdoZWFkJywgMCk7XHJcbmxldCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbnN0eWxlLmlubmVySFRNTCA9ICcucmgtaGlkZTpub3QoLnJoLWFuaW1hdGUpe2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50O30nO1xyXG5oZWFkLmluc2VydEJlZm9yZShzdHlsZSwgaGVhZC5jaGlsZE5vZGVzWzBdKTtcclxuXHJcbl8uYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ0RPTUNvbnRlbnRMb2FkZWQnLCBfLm9uZShmdW5jdGlvbigpIHtcclxuICBpZiAocmguX2RlYnVnKSB7IGlmIChyaC5jb25zb2xlID09IG51bGwpIHsgcmguY29uc29sZSA9IG5ldyByaC5Db25zb2xlKCk7IH0gfVxyXG5cclxuICByaC5tb2RlbC5wdWJsaXNoKGNvbnN0cygnRVZUX1dJREdFVF9CRUZPUkVMT0FEJyksIHRydWUsIHtzeW5jOiB0cnVlfSk7XHJcbiAgXHJcbiAgXy5sb2FkV2lkZ2V0cyhkb2N1bWVudCk7XHJcbiAgXHJcbiAgXy5sb2FkQ29udGVudEZpbHRlcihkb2N1bWVudCk7XHJcblxyXG4gIHJldHVybiByaC5tb2RlbC5wdWJsaXNoKGNvbnN0cygnRVZUX1dJREdFVF9MT0FERUQnKSwgdHJ1ZSwge3N5bmM6IHRydWV9KTtcclxufSlcclxuKTtcclxuXHJcbmlmIChfLmlzSWZyYW1lKCkpIHtcclxuICBfLmFkZEV2ZW50TGlzdGVuZXIod2luZG93LCAnYmVmb3JldW5sb2FkJywgZnVuY3Rpb24oKSB7XHJcbiAgICByaC5tb2RlbC5wdWJsaXNoKGNvbnN0cygnRVZUX0JFRk9SRV9VTkxPQUQnKSwgdHJ1ZSwge3N5bmM6IHRydWV9KTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfSk7XHJcblxyXG4gIF8uYWRkRXZlbnRMaXN0ZW5lcih3aW5kb3csICd1bmxvYWQnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgcmgubW9kZWwucHVibGlzaChjb25zdHMoJ0VWVF9VTkxPQUQnKSwgdHJ1ZSwge3N5bmM6IHRydWV9KTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfSk7XHJcbn1cclxuIiwibGV0IHsgcmggfSA9IHdpbmRvdztcclxubGV0IHsgXyB9ID0gcmg7XHJcblxyXG5fLmFkZEV2ZW50TGlzdGVuZXIod2luZG93LCAnbWVzc2FnZScsIGZ1bmN0aW9uKGUpIHtcclxuICBsZXQgY29uZmlnLCBrZXk7XHJcbiAgaWYgKCFfLmlzU2FtZU9yaWdpbihlLm9yaWdpbikpIHsgcmV0dXJuOyB9XHJcblxyXG4gIGxldCB7IGRhdGEgfSA9IGU7XHJcbiAgaWYgKCFfLmlzT2JqZWN0KGRhdGEpKSB7IHJldHVybjsgfVxyXG5cclxuICBpZiAoZGF0YS5yaG1vZGVsX3B1Ymxpc2gpIHtcclxuICAgIGNvbmZpZyA9IGRhdGEucmhtb2RlbF9wdWJsaXNoO1xyXG4gICAgaWYgKGNvbmZpZykgeyBmb3IgKGtleSBpbiBjb25maWcpIHsgbGV0IHZhbHVlID0gY29uZmlnW2tleV07IHJoLmlmcmFtZS5wdWJsaXNoKGtleSwgdmFsdWUsIHtzeW5jOiB0cnVlfSk7IH0gfVxyXG4gIH1cclxuICBcclxuICBpZiAoZGF0YS5yaG1vZGVsX3N1YnNjcmliZSkge1xyXG4gICAgY29uZmlnID0gZGF0YS5yaG1vZGVsX3N1YnNjcmliZTtcclxuICAgIGxldCBpbnB1dCA9IGNvbmZpZy5pbnB1dCB8fCBbXTtcclxuICAgIGxldCB0b3BDb250YWluZXIgPSAhcmgubW9kZWwuZ2V0KCdfc2hhcmVka2V5cy5pbnB1dCcpO1xyXG4gICAgbGV0IGtleXMgPSBfLnJlZHVjZShpbnB1dCwgZnVuY3Rpb24ocmVzdWx0LCBpdGVtKSB7XHJcbiAgICAgIGlmICh0b3BDb250YWluZXIgfHwgKGl0ZW0ubmVzdGVkICE9PSBmYWxzZSkpIHsgcmVzdWx0LnB1c2goaXRlbS5rZXkpOyB9XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbiAgICAsIFtdKTtcclxuICAgIGlmIChrZXlzICE9IG51bGwgPyBrZXlzLmxlbmd0aCA6IHVuZGVmaW5lZCkgeyByaC5pZnJhbWUubGlua01vZGVsKGUuc291cmNlLCBjb25maWcuaWQsIGtleXMpOyB9XHJcbiAgfVxyXG4gIFxyXG4gIGlmIChkYXRhLnJobW9kZWxfdW5zdWJzY3JpYmUpIHtcclxuICAgIGNvbmZpZyA9IGRhdGEucmhtb2RlbF91bnN1YnNjcmliZTtcclxuICAgIHJldHVybiByaC5pZnJhbWUuY2xlYW4oY29uZmlnLmlkKTtcclxuICB9XHJcbn0pO1xyXG4iLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5sZXQgeyBfIH0gPSByaDtcclxubGV0IHsgY29uc3RzIH0gPSByaDtcclxuXHJcbi8vIENoaWxkTm9kZSBwcml2YXRlIGNsYXNzIGZvciBNb2RlbFxyXG5jbGFzcyBDaGlsZE5vZGUge1xyXG5cclxuICBjb25zdHJ1Y3RvcihzdWJzY3JpYmVycywgY2hpbGRyZW4pIHtcclxuICAgIGlmIChzdWJzY3JpYmVycyA9PSBudWxsKSB7IHN1YnNjcmliZXJzID0gW107IH1cclxuICAgIHRoaXMuc3Vic2NyaWJlcnMgPSBzdWJzY3JpYmVycztcclxuICAgIGlmIChjaGlsZHJlbiA9PSBudWxsKSB7IGNoaWxkcmVuID0ge307IH1cclxuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcclxuICB9XHJcblxyXG4gIC8vIFRPRE86IGFkZCBrZXkuKiBzdXBwb3J0IGluIGdldFxyXG4gIGdldFN1YnNjcmliZXJzKGtleXMsIHBhdGgsIHZhbHVlLCBzdWJzKSB7XHJcbiAgICBpZiAoa2V5cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIGxldCBjaGlsZDtcclxuICAgICAgc3Vicy5wdXNoKHtmbnNJbmZvOiB0aGlzLnN1YnNjcmliZXJzLCBrZXk6IHBhdGgsIHZhbHVlfSk7XHJcbiAgICAgIGxldCBjaGlsZEtleSA9IGtleXNbMV07XHJcbiAgICAgIGlmIChjaGlsZCA9IHRoaXMuY2hpbGRyZW5bY2hpbGRLZXldKSB7XHJcbiAgICAgICAgbGV0IG5ld1BhdGggPSBgJHtwYXRofS4ke2NoaWxkS2V5fWA7XHJcbiAgICAgICAgY2hpbGQuZ2V0U3Vic2NyaWJlcnMoa2V5cy5zbGljZSgxKSwgbmV3UGF0aCwgdmFsdWUgIT0gbnVsbCA/IHZhbHVlW2NoaWxkS2V5XSA6IHVuZGVmaW5lZCwgc3Vicyk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoa2V5cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHRoaXMuX2dldEFsbENoaWxkU3Vic2NyaWJlcnMocGF0aCwgdmFsdWUsIHN1YnMpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN1YnM7XHJcbiAgfVxyXG5cclxuICBhZGRTdWJzY3JpYmVycyhmbiwga2V5cywgb3B0cykge1xyXG4gICAgaWYgKGtleXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZXJzLnB1c2goW2ZuLCBvcHRzXSk7XHJcbiAgICB9IGVsc2UgaWYgKGtleXMubGVuZ3RoID4gMSkge1xyXG4gICAgICBsZXQgY2hpbGRLZXkgPSBrZXlzWzFdO1xyXG4gICAgICBpZiAodGhpcy5jaGlsZHJlbltjaGlsZEtleV0gPT0gbnVsbCkgeyB0aGlzLmNoaWxkcmVuW2NoaWxkS2V5XSA9IG5ldyBDaGlsZE5vZGUoKTsgfVxyXG4gICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbltjaGlsZEtleV0uYWRkU3Vic2NyaWJlcnMoZm4sIGtleXMuc2xpY2UoMSksIG9wdHMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmVtb3ZlU3Vic2NyaWJlcihmbiwga2V5cykge1xyXG4gICAgaWYgKGtleXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9kZWxldGVTdWJzY3JpYmVyKGZuKTtcclxuICAgIH0gZWxzZSBpZiAoa2V5cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuW2tleXNbMV1dLnJlbW92ZVN1YnNjcmliZXIoZm4sIGtleXMuc2xpY2UoMSkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgX2RlbGV0ZVN1YnNjcmliZXIoZm4pIHtcclxuICAgIGxldCBpbmRleCA9IF8uZmluZEluZGV4KHRoaXMuc3Vic2NyaWJlcnMsIGl0ZW0gPT4gaXRlbVswXSA9PT0gZm4pO1xyXG4gICAgaWYgKChpbmRleCAhPSBudWxsKSAmJiAoaW5kZXggIT09IC0xKSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVycy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgfSBlbHNlIGlmIChyaC5fZGVidWcpIHtcclxuICAgICAgcmV0dXJuIHJoLl9kKCdlcnJvcicsICdfdW5zdWJzY3JpYmUnLFxyXG4gICAgICAgIGAke3RoaXN9LntrZXl9IGlzIG5vdCBzdWJzY3JpYmVkIHdpdGggJHtmbn1gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9nZXRBbGxDaGlsZFN1YnNjcmliZXJzKHBhdGgsIHZhbHVlLCBzdWJzKSB7XHJcbiAgICBzdWJzLnB1c2goe2Zuc0luZm86IHRoaXMuc3Vic2NyaWJlcnMsIGtleTogcGF0aCwgdmFsdWV9KTtcclxuICAgIGlmICh0aGlzLmNoaWxkcmVuKSB7XHJcbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7IHZhbHVlID0ge307IH1cclxuICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuY2hpbGRyZW4pIHtcclxuICAgICAgICBsZXQgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2tleV07XHJcbiAgICAgICAgY2hpbGQuX2dldEFsbENoaWxkU3Vic2NyaWJlcnMoYCR7cGF0aH0uJHtrZXl9YCwgdmFsdWVba2V5XSwgc3Vicyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBzdWJzO1xyXG4gIH1cclxufVxyXG5cclxuLy9Sb290Tm9kZSBwcml2ZSBjbGFzcyBmb3IgTW9kZWxcclxuY2xhc3MgUm9vdE5vZGUgZXh0ZW5kcyBDaGlsZE5vZGUge1xyXG5cclxuICBjb25zdHJ1Y3RvcihzdWJzY3JpYmVycywgY2hpbGRyZW4sIGRhdGEpIHtcclxuICAgIHN1cGVyKClcclxuICAgIHRoaXMuc3Vic2NyaWJlcnMgPSBzdWJzY3JpYmVycztcclxuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcclxuICAgIGlmIChkYXRhID09IG51bGwpIHsgZGF0YSA9IHt9OyB9XHJcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgc3VwZXIodGhpcy5zdWJzY3JpYmVycywgdGhpcy5jaGlsZHMpO1xyXG4gIH1cclxuXHJcbiAgZ2V0U3Vic2NyaWJlcnMoa2V5cykge1xyXG4gICAgbGV0IGNoaWxkS2V5ID0ga2V5c1swXTtcclxuICAgIGxldCBjaGlsZCA9IHRoaXMuY2hpbGRyZW5bY2hpbGRLZXldO1xyXG4gICAgaWYgKGNoaWxkKSB7XHJcbiAgICAgIHJldHVybiBjaGlsZC5nZXRTdWJzY3JpYmVycyhrZXlzLCBgJHtrZXlzWzBdfWAsIHRoaXMuZGF0YVtrZXlzWzBdXSwgW10pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYWRkU3Vic2NyaWJlcnMoZm4sIGtleXMsIG9wdHMpIHtcclxuICAgIGxldCBjaGlsZEtleSA9IGtleXNbMF07XHJcbiAgICBpZiAodGhpcy5jaGlsZHJlbltjaGlsZEtleV0gPT0gbnVsbCkgeyB0aGlzLmNoaWxkcmVuW2NoaWxkS2V5XSA9IG5ldyBDaGlsZE5vZGUoKTsgfVxyXG4gICAgcmV0dXJuIHRoaXMuY2hpbGRyZW5bY2hpbGRLZXldLmFkZFN1YnNjcmliZXJzKGZuLCBrZXlzLCBvcHRzKTtcclxuICB9XHJcblxyXG4gIHJlbW92ZVN1YnNjcmliZXIoZm4sIGtleXMpIHtcclxuICAgIGxldCBjaGlsZEtleSA9IGtleXNbMF07XHJcbiAgICByZXR1cm4gKHRoaXMuY2hpbGRyZW5bY2hpbGRLZXldICE9IG51bGwgPyB0aGlzLmNoaWxkcmVuW2NoaWxkS2V5XS5yZW1vdmVTdWJzY3JpYmVyKGZuLCBrZXlzKSA6IHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICBnZXREYXRhKGtleXMpIHtcclxuICAgIGxldCB2YWx1ZTtcclxuICAgIGxldCB7IGRhdGEgfSA9IHRoaXM7XHJcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwga2V5cy5sZW5ndGg7IGluZGV4KyspIHtcclxuICAgICAgbGV0IGtleSA9IGtleXNbaW5kZXhdO1xyXG4gICAgICBpZiAoXy5pc0RlZmluZWQoZGF0YSkpIHtcclxuICAgICAgICBpZiAoaW5kZXggPT09IChrZXlzLmxlbmd0aCAtIDEpKSB7XHJcbiAgICAgICAgICB2YWx1ZSA9IGRhdGFba2V5XTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZGF0YSA9IGRhdGFba2V5XTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB2YWx1ZTtcclxuICB9XHJcblxyXG4gIHNldERhdGEoa2V5cywgdmFsdWUpIHsgLy9hLmIgYS4qXHJcbiAgICBsZXQgeyBkYXRhIH0gPSB0aGlzO1xyXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGtleXMubGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgIGxldCBrZXkgPSBrZXlzW2luZGV4XTtcclxuICAgICAgaWYgKGluZGV4ID09PSAoa2V5cy5sZW5ndGggLSAxKSkge1xyXG4gICAgICAgIGRhdGFba2V5XSA9IHZhbHVlO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmICghXy5pc0RlZmluZWQoZGF0YVtrZXldKSkgeyBkYXRhW2tleV0gPSB7fTsgfVxyXG4gICAgICAgIGRhdGEgPSBkYXRhW2tleV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbi8vIE1vZGVsIGNsYXNzIHRvIHJlYWQgd3JpdGUgbG9jYWwgZGF0YSB1c2luZyBwdWJsaXNoIHN1YnNjcmliZSBwYXR0ZXJuXHJcbnZhciBNb2RlbCA9IChmdW5jdGlvbigpIHtcclxuICBsZXQgX2NvdW50ID0gdW5kZWZpbmVkO1xyXG4gIE1vZGVsID0gY2xhc3MgTW9kZWwge1xyXG4gICAgc3RhdGljIGluaXRDbGFzcygpIHtcclxuXHJcbiAgICAgIC8vIHByaXZhdGUgc3RhdGljIHZhcmlhYmxlXHJcbiAgICAgIF9jb3VudCA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgdG9TdHJpbmcoKSB7IHJldHVybiBgTW9kZWxfJHt0aGlzLl9jb3VudH1gOyB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgIHRoaXMuX3Jvb3ROb2RlID0gbmV3IFJvb3ROb2RlKCk7XHJcblxyXG4gICAgICB0aGlzLl9jb3VudCA9IF9jb3VudDtcclxuICAgICAgX2NvdW50ICs9IDE7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KGtleSkge1xyXG4gICAgICBsZXQgdmFsdWU7XHJcbiAgICAgIGlmICh0aGlzLl9pc0Zvckdsb2JhbChrZXkpKSB7IHJldHVybiByaC5tb2RlbC5nZXQoa2V5KTsgfVxyXG5cclxuICAgICAgaWYgKF8uaXNTdHJpbmcoa2V5KSkge1xyXG4gICAgICAgIHZhbHVlID0gdGhpcy5fcm9vdE5vZGUuZ2V0RGF0YSh0aGlzLl9nZXRLZXlzKGtleSkpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJoLl9kKCdlcnJvcicsICdHZXQnLCBgJHt0aGlzfS4ke2tleX0gaXMgbm90IGEgc3RyaW5nYCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChyaC5fZGVidWcpIHtcclxuICAgICAgICByaC5fZCgnbG9nJywgJ0dldCcsIGAke3RoaXN9LiR7a2V5fTogJHtKU09OLnN0cmluZ2lmeSh2YWx1ZSl9YCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBjZ2V0KGtleSkgeyByZXR1cm4gdGhpcy5nZXQoY29uc3RzKGtleSkpOyB9XHJcblxyXG4gICAgLy8gVE9ETzogYWRkIG9wdGlvbnMgdG8gZGV0ZWN0IGNoYW5nZSB0aGVuIG9ubHkgdHJpZ2dlciB0aGUgZXZlbnRcclxuICAgIHB1Ymxpc2goa2V5LCB2YWx1ZSwgb3B0cykge1xyXG4gICAgICBpZiAob3B0cyA9PSBudWxsKSB7IG9wdHMgPSB7fTsgfVxyXG4gICAgICBpZiAodGhpcy5faXNGb3JHbG9iYWwoa2V5KSkgeyByZXR1cm4gcmgubW9kZWwucHVibGlzaChrZXksIHZhbHVlLCBvcHRzKTsgfVxyXG4gICAgICBpZiAocmguX2RlYnVnKSB7XHJcbiAgICAgICAgcmguX2QoJ2xvZycsICdQdWJsaXNoJywgYCR7dGhpc30uJHtrZXl9OiAke0pTT04uc3RyaW5naWZ5KHZhbHVlKX1gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoXy5pc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgdGhpcy5fcm9vdE5vZGUuc2V0RGF0YSh0aGlzLl9nZXRLZXlzKGtleSksIHZhbHVlKTtcclxuICAgICAgICBsZXQgc3VicyA9IHRoaXMuX3Jvb3ROb2RlLmdldFN1YnNjcmliZXJzKHRoaXMuX2dldEtleXMoa2V5KSk7XHJcbiAgICAgICAgbGV0IGtleUxlbmd0aCA9IGtleVswXSA9PT0gJy4nID8ga2V5Lmxlbmd0aCAtIDEgOiBrZXkubGVuZ3RoO1xyXG4gICAgICAgIGxldCBmaWx0ZXJlZFN1YnMgPSBfLm1hcChzdWJzLCBmdW5jdGlvbihzdWIpIHtcclxuICAgICAgICAgIGxldCBmbnNJbmZvID0gXy5maWx0ZXIoc3ViLmZuc0luZm8sIGZuSW5mbyA9PiBfLmlzRGVmaW5lZChmbkluZm9bMF0pICYmXHJcbiAgICAgICAgICAgICgoZm5JbmZvWzFdLnBhcnRpYWwgIT09IGZhbHNlKSB8fCAoc3ViLmtleS5sZW5ndGggPj0ga2V5TGVuZ3RoKSlcclxuICAgICAgICAgICApO1xyXG4gICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAga2V5OiBzdWIua2V5LFxyXG4gICAgICAgICAgICB2YWx1ZTogc3ViLnZhbHVlLFxyXG4gICAgICAgICAgICBmbnM6IF8ubWFwKGZuc0luZm8sIGZuSW5mbyA9PiBmbkluZm9bMF0pXHJcbiAgICAgICAgICB9O1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgICAgXy5lYWNoKGZpbHRlcmVkU3Vicywgc3ViID0+IHtcclxuICAgICAgICAgIHJldHVybiBfLmVhY2goc3ViLmZucywgZm4gPT4ge1xyXG4gICAgICAgICAgICBpZiAocmguX2RlYnVnKSB7XHJcbiAgICAgICAgICAgICAgcmguX2QoJ2xvZycsICdQdWJsaXNoIGNhbGwnLFxyXG4gICAgICAgICAgICAgICAgYCR7dGhpc30uJHtzdWIua2V5fTogJHtKU09OLnN0cmluZ2lmeShzdWIudmFsdWUpfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxldCB1bnN1YiA9ICgpID0+IHRoaXMuX3Vuc3Vic2NyaWJlKHN1Yi5rZXksIGZuKTtcclxuICAgICAgICAgICAgaWYgKG9wdHMuc3luYykge1xyXG4gICAgICAgICAgICAgIHJldHVybiBmbihzdWIudmFsdWUsIHN1Yi5rZXksIHVuc3ViKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICByZXR1cm4gcmguXy5kZWZlcihmbiwgc3ViLnZhbHVlLCBzdWIua2V5LCB1bnN1Yik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJoLl9kKCdlcnJvcicsICdQdWJsaXNoJywgYCR7dGhpc30uJHtrZXl9IGlzIG5vdCBhIHN0cmluZ2ApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY3B1Ymxpc2goa2V5LCB2YWx1ZSwgb3B0cykge1xyXG4gICAgICByZXR1cm4gdGhpcy5wdWJsaXNoKGNvbnN0cyhrZXkpLCB2YWx1ZSwgb3B0cyk7XHJcbiAgICB9XHJcblxyXG4gICAgaXNTdWJzY3JpYmVkKGtleSkge1xyXG4gICAgICBsZXQgZm91bmQ7XHJcbiAgICAgIGlmICh0aGlzLl9pc0Zvckdsb2JhbChrZXkpKSB7IHJldHVybiByaC5tb2RlbC5pc1N1YnNjcmliZWQoa2V5KTsgfVxyXG4gICAgICBpZiAoa2V5WzBdID09PSAnLicpIHsga2V5ID0ga2V5LnN1YnN0cmluZygxKTsgfVxyXG4gICAgICBsZXQgc3VicyA9IHRoaXMuX3Jvb3ROb2RlLmdldFN1YnNjcmliZXJzKHRoaXMuX2dldEtleXMoa2V5KSk7XHJcbiAgICAgIGZvciAobGV0IHN1YiBvZiBBcnJheS5mcm9tKHN1YnMpKSB7IGlmIChzdWIua2V5ID09PSBrZXkpIHsgZm91bmQgPSB0cnVlOyB9IH1cclxuICAgICAgcmV0dXJuIGZvdW5kID09PSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGNpc1N1YnNjcmliZWQoa2V5KSB7IHJldHVybiB0aGlzLmlzU3Vic2NyaWJlZChjb25zdHMoa2V5KSk7IH1cclxuXHJcbiAgICBzdWJzY3JpYmVPbmNlKGtleSwgZm4sIG9wdHMpIHtcclxuICAgICAgaWYgKG9wdHMgPT0gbnVsbCkgeyBvcHRzID0ge307IH1cclxuICAgICAgbGV0IGtleXMgPSBfLmlzU3RyaW5nKGtleSkgPyBba2V5XSA6IGtleTtcclxuICAgICAgcmV0dXJuIHRoaXMuX3N1YnNjcmliZShrZXlzLnNwbGljZSgwLCAxKVswXSwgKHZhbHVlLCBrZXksIHVuc3ViKSA9PiB7XHJcbiAgICAgICAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBmbih2YWx1ZSwga2V5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5zdWJzY3JpYmVPbmNlKGtleXMsIGZuLCBvcHRzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVuc3ViKCk7XHJcbiAgICAgIH1cclxuICAgICAgLCBvcHRzKTtcclxuICAgIH1cclxuXHJcbiAgICBjc3Vic2NyaWJlT25jZShrZXksIGZuLCBvcHRzKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZU9uY2UoY29uc3RzKGtleSksIGZuLCBvcHRzKTtcclxuICAgIH1cclxuXHJcbiAgICBzdWJzY3JpYmUoa2V5LCBmbiwgb3B0cykge1xyXG4gICAgICBpZiAob3B0cyA9PSBudWxsKSB7IG9wdHMgPSB7fTsgfVxyXG4gICAgICBpZiAoXy5pc1N0cmluZyhrZXkpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N1YnNjcmliZShrZXksIGZuLCBvcHRzKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgdW5zdWJzID0gXy5tYXAoa2V5LCBpdGVtID0+IHRoaXMuX3N1YnNjcmliZShpdGVtLCBmbiwgb3B0cykpO1xyXG4gICAgICAgIHJldHVybiAoKSA9PiBfLmVhY2godW5zdWJzLCB1bnN1YiA9PiB1bnN1YigpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNzdWJzY3JpYmUoa2V5LCBmbiwgb3B0cykgeyByZXR1cm4gdGhpcy5zdWJzY3JpYmUoY29uc3RzKGtleSksIGZuLCBvcHRzKTsgfVxyXG5cclxuICAgIF9zdWJzY3JpYmUoa2V5LCBmbiwgb3B0cykge1xyXG4gICAgICBpZiAob3B0cyA9PSBudWxsKSB7IG9wdHMgPSB7fTsgfVxyXG4gICAgICBpZiAodGhpcy5faXNGb3JHbG9iYWwoa2V5KSkgeyByZXR1cm4gcmgubW9kZWwuc3Vic2NyaWJlKGtleSwgZm4sIG9wdHMpOyB9XHJcbiAgICAgIGlmIChyaC5fZGVidWcpIHsgcmguX2QoJ2xvZycsICdTdWJzY3JpYmUnLCBgJHt0aGlzfS4ke2tleX1gKTsgfVxyXG5cclxuICAgICAgdGhpcy5fcm9vdE5vZGUuYWRkU3Vic2NyaWJlcnMoZm4sIHRoaXMuX2dldEtleXMoa2V5KSwgb3B0cyk7XHJcbiAgICAgIGxldCB2YWx1ZSA9IHRoaXMuX3Jvb3ROb2RlLmdldERhdGEodGhpcy5fZ2V0S2V5cyhrZXkpKTtcclxuICAgICAgbGV0IHVuc3ViID0gKCkgPT4gdGhpcy5fdW5zdWJzY3JpYmUoa2V5LCBmbik7XHJcbiAgICAgIGlmIChvcHRzLmZvcmNlSW5pdCB8fCAoKHZhbHVlICE9IG51bGwpICYmICFvcHRzLmluaXREb25lKSkgeyBmbih2YWx1ZSwga2V5LCB1bnN1Yik7IH1cclxuICAgICAgcmV0dXJuIHVuc3ViO1xyXG4gICAgfVxyXG5cclxuICAgIF91bnN1YnNjcmliZShrZXksIGZuKSB7XHJcbiAgICAgIGlmICh0aGlzLl9pc0Zvckdsb2JhbChrZXkpKSB7IHJldHVybiByaC5tb2RlbC5fdW5zdWJzY3JpYmUoa2V5KTsgfVxyXG4gICAgICBpZiAocmguX2RlYnVnKSB7IHJoLl9kKCdsb2cnLCAnX1Vuc3Vic2NyaWJlJywgYCR7dGhpc30uJHtrZXl9YCk7IH1cclxuICAgICAgcmV0dXJuIHRoaXMuX3Jvb3ROb2RlLnJlbW92ZVN1YnNjcmliZXIoZm4sIHRoaXMuX2dldEtleXMoa2V5KSk7XHJcbiAgICB9XHJcblxyXG4gICAgaXNHbG9iYWwoKSB7IHJldHVybiB0aGlzID09PSByaC5tb2RlbDsgfVxyXG5cclxuICAgIGlzR2xvYmFsS2V5KGtleSkgeyByZXR1cm4ga2V5ICYmIChrZXlbMF0gPT09ICcuJyk7IH1cclxuXHJcbiAgICBfaXNGb3JHbG9iYWwoa2V5KSB7IHJldHVybiAhdGhpcy5pc0dsb2JhbCgpICYmIHRoaXMuaXNHbG9iYWxLZXkoa2V5KTsgfVxyXG5cclxuICAgIF9nZXRLZXlzKGZ1bGxLZXkpIHtcclxuICAgICAgbGV0IGtleXMgPSBmdWxsS2V5LnNwbGl0KCcuJyk7XHJcbiAgICAgIGlmIChrZXlzWzBdID09PSAnJykgeyBrZXlzID0ga2V5cy5zbGljZSgxKTsgfSAvL3N0cmlwIGZpcnN0IGdsb2JhbCBrZXkgLlxyXG4gICAgICBpZiAocmguX2RlYnVnICYmIChrZXlzLmxlbmd0aCA9PT0gMCkpIHtcclxuICAgICAgICByaC5fZCgnZXJyb3InLCAnTW9kZWwnLCBgJHt0aGlzfS4ke2Z1bGxLZXl9IGlzIGludmFsaWRgKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ga2V5cztcclxuICAgIH1cclxuICB9O1xyXG4gIE1vZGVsLmluaXRDbGFzcygpO1xyXG4gIHJldHVybiBNb2RlbDtcclxufSkoKTtcclxuXHJcbi8vZ2xvYmFsIG9iamVjdFxyXG5yaC5Nb2RlbCA9IE1vZGVsO1xyXG5yaC5tb2RlbCA9IG5ldyBNb2RlbCgpO1xyXG5yaC5tb2RlbC50b1N0cmluZyA9ICgpID0+ICdHbG9iYWxNb2RlbCc7XHJcbiIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCB7ICQgfSA9IHJoO1xyXG5sZXQgeyBfIH0gPSByaDtcclxuXHJcbmNsYXNzIE5vZGVIb2xkZXIge1xyXG5cclxuICBjb25zdHJ1Y3Rvcihub2Rlcykge1xyXG4gICAgdGhpcy5ub2RlcyA9IG5vZGVzO1xyXG4gIH1cclxuXHJcbiAgaXNWaXNpYmxlKG5vZGUpIHtcclxuICAgIGlmIChub2RlID09IG51bGwpIHsgbm9kZSA9IHRoaXMubm9kZXNbMF07IH1cclxuICAgIHJldHVybiAhJC5oYXNDbGFzcyhub2RlLCAncmgtaGlkZScpO1xyXG4gIH1cclxuXHJcbiAgc2hvdygpIHtcclxuICAgIHJldHVybiBfLmVhY2godGhpcy5ub2RlcywgZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICBpZiAoIXRoaXMuaXNWaXNpYmxlKG5vZGUpKSB7XHJcbiAgICAgICAgJC5yZW1vdmVDbGFzcyhub2RlLCAncmgtaGlkZScpO1xyXG4gICAgICAgIHJldHVybiBub2RlLmhpZGRlbiA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICAsIHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgaGlkZSgpIHtcclxuICAgIHJldHVybiBfLmVhY2godGhpcy5ub2RlcywgZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICBpZiAodGhpcy5pc1Zpc2libGUobm9kZSkpIHtcclxuICAgICAgICAkLmFkZENsYXNzKG5vZGUsICdyaC1oaWRlJyk7XHJcbiAgICAgICAgcmV0dXJuIG5vZGUuaGlkZGVuID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLCB0aGlzKTtcclxuICB9XHJcbiAgXHJcbiAgYWNjZXNzaWJsZShmbGFnKSB7XHJcbiAgICByZXR1cm4gXy5lYWNoKHRoaXMubm9kZXMsIG5vZGUgPT4gbm9kZS5oaWRkZW4gPSBmbGFnKTtcclxuICB9XHJcblxyXG4gIHVwZGF0ZUNsYXNzKG5ld0NsYXNzZXMpIHtcclxuICAgIGlmICh0aGlzLm9sZENsYXNzZXMgPT0gbnVsbCkgeyB0aGlzLm9sZENsYXNzZXMgPSBbXTsgfVxyXG4gICAgZm9yIChsZXQgbm9kZSBvZiBBcnJheS5mcm9tKHRoaXMubm9kZXMpKSB7XHJcbiAgICAgIGZvciAodmFyIGNsYXNzTmFtZSBvZiBBcnJheS5mcm9tKHRoaXMub2xkQ2xhc3NlcykpIHsgJC5yZW1vdmVDbGFzcyhub2RlLCBjbGFzc05hbWUpOyB9XHJcbiAgICAgIGZvciAoY2xhc3NOYW1lIG9mIEFycmF5LmZyb20obmV3Q2xhc3NlcykpIHtcclxuICAgICAgICBpZiAoY2xhc3NOYW1lLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICQuYWRkQ2xhc3Mobm9kZSwgY2xhc3NOYW1lKTtcclxuICAgICAgICAgIHRoaXMub2xkQ2xhc3Nlcy5wdXNoKGNsYXNzTmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB1cGRhdGVOb2RlcyhuZXdOb2Rlcykge1xyXG4gICAgbGV0IGZpcnN0Tm9kZSA9IHRoaXMubm9kZXNbMF07XHJcbiAgICBsZXQgeyBwYXJlbnROb2RlIH0gPSBmaXJzdE5vZGU7XHJcbiAgICBmb3IgKHZhciBub2RlIG9mIEFycmF5LmZyb20obmV3Tm9kZXMpKSB7IHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5vZGUsIGZpcnN0Tm9kZSk7IH1cclxuICAgIGZvciAobm9kZSBvZiBBcnJheS5mcm9tKHRoaXMubm9kZXMpKSB7IHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7IH1cclxuICAgIHJldHVybiB0aGlzLm5vZGVzID0gbmV3Tm9kZXM7XHJcbiAgfVxyXG59XHJcblxyXG5yaC5Ob2RlSG9sZGVyID0gTm9kZUhvbGRlcjsiLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5sZXQgeyBfIH0gPSByaDtcclxuXHJcbmNsYXNzIFBsdWdpbiB7XHJcblxyXG4gIGF0dGFjaE93bmVyKG9iaikge1xyXG4gICAgaWYgKHRoaXMuX293bmVyRm5zID09IG51bGwpIHsgdGhpcy5fb3duZXJGbnMgPSB7fTsgfVxyXG4gICAgaWYgKHRoaXMuaGFzT3duZXIoKSkgeyB0aGlzLmRldGFjaCh0aGlzLm93bmVyKTsgfVxyXG4gICAgdGhpcy5vd25lciA9IG9iajtcclxuICAgIGlmICh0aGlzLl9vdmVycmlkZU5hbWVzKSB7IGZvciAobGV0IGZuTmFtZSBvZiBBcnJheS5mcm9tKHRoaXMuX292ZXJyaWRlTmFtZXMpKSB7IHRoaXMuX292ZXJyaWRlT3duZXJGbihmbk5hbWUpOyB9IH1cclxuICAgIHJldHVybiB0aGlzLm93bmVySXNDaGFuZ2VkKCk7XHJcbiAgfVxyXG5cclxuICBkZXRhY2hPd25lcigpIHtcclxuICAgIGlmICh0aGlzLmhhc093bmVyKCkpIHtcclxuICAgICAgaWYgKHRoaXMuX293bmVyRm5zKSB7IGZvciAobGV0IGZuTmFtZSBpbiB0aGlzLl9vd25lckZucykgeyB0aGlzLl9yZXN0b3JlT3duZXJGbihmbk5hbWUpOyB9IH1cclxuICAgICAgdGhpcy5vd25lciA9IG51bGw7XHJcbiAgICAgIHRoaXMuX293bmVyRm5zID0ge307XHJcbiAgICAgIHJldHVybiB0aGlzLm93bmVySXNDaGFuZ2VkKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBwbHVnaW4gc2hvdWxkIG92ZXJyaWRlIHRoaXMgbWV0aG9kIHRvIGdldCB0aGUgbm90aWZpY2F0aW9uIG9mIG93b25lciBjaGFuZ2VcclxuICBvd25lcklzQ2hhbmdlZCgpIHt9XHJcblxyXG4gIGhhc093bmVyKCkgeyByZXR1cm4gKHRoaXMub3duZXIgIT0gbnVsbCk7IH1cclxuXHJcbiAgYWRkT3ZlcnJpZGVzKGZuTmFtZXMpIHtcclxuICAgIGlmICh0aGlzLl9vdmVycmlkZU5hbWVzID09IG51bGwpIHsgdGhpcy5fb3ZlcnJpZGVOYW1lcyA9IFtdOyB9XHJcbiAgICByZXR1cm4gKCgpID0+IHtcclxuICAgICAgbGV0IHJlc3VsdCA9IFtdO1xyXG4gICAgICBmb3IgKGxldCBmbk5hbWUgb2YgQXJyYXkuZnJvbShmbk5hbWVzKSkge1xyXG4gICAgICAgIHRoaXMuX292ZXJyaWRlTmFtZXMucHVzaChmbk5hbWUpO1xyXG4gICAgICAgIHJlc3VsdC5wdXNoKHRoaXMuX292ZXJyaWRlT3duZXJGbihmbk5hbWUpKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSkoKTtcclxuICB9XHJcblxyXG4gIHJlbW92ZU92ZXJyaWRlcyhmbk5hbWVzKSB7XHJcbiAgICByZXR1cm4gKCgpID0+IHtcclxuICAgICAgbGV0IHJlc3VsdCA9IFtdO1xyXG4gICAgICBmb3IgKGxldCBmbk5hbWUgb2YgQXJyYXkuZnJvbShmbk5hbWVzKSkge1xyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmVPd25lckZuKGZuTmFtZSk7XHJcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5fb3ZlcnJpZGVOYW1lcy5pbmRleE9mKGZuTmFtZSk7XHJcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHsgcmVzdWx0LnB1c2godGhpcy5fb3ZlcnJpZGVOYW1lcy5zcGxpY2UoaW5kZXgsIDEpKTsgfSBlbHNlIHtcclxuICAgICAgICAgIHJlc3VsdC5wdXNoKHVuZGVmaW5lZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9KSgpO1xyXG4gIH1cclxuXHJcbiAgX292ZXJyaWRlT3duZXJGbihmbk5hbWUpIHtcclxuICAgIGlmICh0aGlzLmhhc093bmVyKCkpIHtcclxuICAgICAgbGV0IG93bmVyRm4gPSB0aGlzLm93bmVyW2ZuTmFtZV07XHJcbiAgICAgIHRoaXMuX293bmVyRm5zW2ZuTmFtZV0gPSBvd25lckZuO1xyXG4gICAgICByZXR1cm4gdGhpcy5vd25lcltmbk5hbWVdID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgbGV0IGFyZ3MgPSBbXTsgbGV0IGkgPSAtMTtcclxuICAgICAgICB3aGlsZSAoKytpIDwgYXJndW1lbnRzLmxlbmd0aCkgeyBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTsgfVxyXG4gICAgICAgIGxldCBiaW5kZWRGbiA9IG5ld0FyZ3MgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIF9fZ3VhcmRNZXRob2RfXyhvd25lckZuLCAnYXBwbHknLCBvID0+IG8uYXBwbHkodGhpcy5vd25lciwgbmV3QXJncykpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHRoaXNbZm5OYW1lXShiaW5kZWRGbiwgYXJncyk7XHJcbiAgICAgIH0uYmluZCh0aGlzKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9yZXN0b3JlT3duZXJGbihmbk5hbWUpIHtcclxuICAgIGlmICh0aGlzLmhhc093bmVyKCkpIHtcclxuICAgICAgdGhpcy5vd25lcltmbk5hbWVdID0gdGhpcy5fb3duZXJGbnNbZm5OYW1lXTtcclxuICAgICAgcmV0dXJuIGRlbGV0ZSB0aGlzLl9vd25lckZuc1tmbk5hbWVdO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxucmguUGx1Z2luID0gUGx1Z2luO1xyXG5cclxuZnVuY3Rpb24gX19ndWFyZE1ldGhvZF9fKG9iaiwgbWV0aG9kTmFtZSwgdHJhbnNmb3JtKSB7XHJcbiAgaWYgKHR5cGVvZiBvYmogIT09ICd1bmRlZmluZWQnICYmIG9iaiAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqW21ldGhvZE5hbWVdID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICByZXR1cm4gdHJhbnNmb3JtKG9iaiwgbWV0aG9kTmFtZSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG59IiwibGV0IHsgcmggfSA9IHdpbmRvdztcclxubGV0IHsgXyB9ID0gcmg7XHJcblxyXG5sZXQgJCA9IChyaC4kID0gZnVuY3Rpb24oc2VsZWN0b3IsIGluZGV4KSB7XHJcbiAgaWYgKChpbmRleCAhPSBudWxsKSAmJiAoaW5kZXggPT09IDApKSB7XHJcbiAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XHJcbiAgfSBlbHNlIHtcclxuICAgIGxldCBub2RlTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xyXG4gICAgaWYgKChpbmRleCAhPSBudWxsKSAmJiAoaW5kZXggPCBub2RlTGlzdC5sZW5ndGgpKSB7XHJcbiAgICAgIHJldHVybiBub2RlTGlzdFtpbmRleF07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gbm9kZUxpc3Q7XHJcbiAgICB9XHJcbiAgfVxyXG59KTtcclxuXHJcbi8vYXJndW1lbnRzXHJcbi8vIChwYXJlbnQsIHNlbGVjdG9yKSAtPlxyXG4vLyBvciAoc2VsZWN0b3IpIC0+XHJcbiQuZmluZCA9IGZ1bmN0aW9uKCkge1xyXG4gIGxldCBwYXJlbnQsIHNlbGVjdG9yO1xyXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xyXG4gICAgcGFyZW50ID0gYXJndW1lbnRzWzBdO1xyXG4gICAgc2VsZWN0b3IgPSBhcmd1bWVudHNbMV07XHJcbiAgfSBlbHNlIHtcclxuICAgIHBhcmVudCA9IGRvY3VtZW50O1xyXG4gICAgc2VsZWN0b3IgPSBhcmd1bWVudHNbMF07XHJcbiAgfVxyXG4gIHJldHVybiBwYXJlbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XHJcbn07XHJcblxyXG4kLnRyYXZlcnNlTm9kZSA9IGZ1bmN0aW9uKG5vZGUsIHByZUNoaWxkLCBwb3N0Q2hpbGQsIG9uQ2hpbGQsIGNvbnRleHQpIHtcclxuICBpZiAoY29udGV4dCA9PSBudWxsKSB7IGNvbnRleHQgPSB3aW5kb3c7IH1cclxuICBpZiAocHJlQ2hpbGQgJiYgcHJlQ2hpbGQuY2FsbChjb250ZXh0LCBub2RlKSkge1xyXG4gICAgJC5lYWNoQ2hpbGROb2RlKG5vZGUsIGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgIGlmICghb25DaGlsZCB8fCBvbkNoaWxkLmNhbGwoY29udGV4dCwgY2hpbGQpKSB7XHJcbiAgICAgICAgcmV0dXJuICQudHJhdmVyc2VOb2RlKGNoaWxkLCBwcmVDaGlsZCwgcG9zdENoaWxkLCBvbkNoaWxkLCBjb250ZXh0KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBpZiAocG9zdENoaWxkKSB7IHBvc3RDaGlsZC5jYWxsKGNvbnRleHQsIG5vZGUpOyB9XHJcbiAgfVxyXG4gIHJldHVybiBub2RlO1xyXG59O1xyXG5cclxuJC5lYWNoQ2hpbGROb2RlID0gZnVuY3Rpb24ocGFyZW50LCBmbiwgY29udGV4dCkge1xyXG4gIGlmIChjb250ZXh0ID09IG51bGwpIHsgY29udGV4dCA9IHdpbmRvdzsgfVxyXG4gIGZvciAobGV0IGNoaWxkIG9mIEFycmF5LmZyb20ocGFyZW50LmNoaWxkcmVuKSkgeyBmbi5jYWxsKGNvbnRleHQsIGNoaWxkKTsgfVxyXG59O1xyXG5cclxuJC5lYWNoQ2hpbGQgPSBmdW5jdGlvbihwYXJlbnQsIHNlbGVjdG9yLCBmbiwgY29udGV4dCkge1xyXG4gIGlmIChjb250ZXh0ID09IG51bGwpIHsgY29udGV4dCA9IHdpbmRvdzsgfVxyXG4gIGZvciAobGV0IG5vZGUgb2YgQXJyYXkuZnJvbSh0aGlzLmZpbmQocGFyZW50LCBzZWxlY3RvcikpKSB7XHJcbiAgICBmbi5jYWxsKGNvbnRleHQsIG5vZGUpO1xyXG4gIH1cclxufTtcclxuXHJcbiQuZWFjaERhdGFOb2RlID0gZnVuY3Rpb24ocGFyZW50LCBkYXRhQXR0ciwgZm4sIGNvbnRleHQpIHtcclxuICBpZiAoY29udGV4dCA9PSBudWxsKSB7IGNvbnRleHQgPSB3aW5kb3c7IH1cclxuICBmb3IgKGxldCBub2RlIG9mIEFycmF5LmZyb20odGhpcy5maW5kKHBhcmVudCwgYFtkYXRhLSR7ZGF0YUF0dHJ9XWApKSkge1xyXG4gICAgZm4uY2FsbChjb250ZXh0LCBub2RlLCAkLmRhdGFzZXQobm9kZSwgZGF0YUF0dHIpKTtcclxuICB9XHJcbn07XHJcblxyXG4kLmVhY2hBdHRyaWJ1dGVzID0gZnVuY3Rpb24obm9kZSwgZm4sIGNvbnRleHQpIHtcclxuICBsZXQgaW5mb3MgPSAoQXJyYXkuZnJvbShub2RlLmF0dHJpYnV0ZXMpLm1hcCgoYXR0cikgPT4gW2F0dHIuc3BlY2lmaWVkLCBhdHRyLm5hbWUsIGF0dHIudmFsdWVdKSk7XHJcbiAgbGV0IGkgPSAtMTtcclxuICB3aGlsZSAoKytpIDwgaW5mb3MubGVuZ3RoKSB7IC8vaGVyZSBsZW5ndGggY2FuIGJlIGluY3JlYXNlZCBpbiBiZXR3ZWVuXHJcbiAgICBsZXQgaW5mbyA9IGluZm9zW2ldO1xyXG4gICAgaWYgKGluZm9bMF0gIT09IGZhbHNlKSB7IGZuLmNhbGwoY29udGV4dCB8fCB3aW5kb3csIGluZm9bMV0sIGluZm9bMl0sIGluZm9zKTsgfVxyXG4gIH1cclxufTtcclxuXHJcbiQuZ2V0QXR0cmlidXRlID0gZnVuY3Rpb24obm9kZSwgYXR0ck5hbWUpIHtcclxuICBpZiAobm9kZS5nZXRBdHRyaWJ1dGUgIT0gbnVsbCkgeyByZXR1cm4gbm9kZS5nZXRBdHRyaWJ1dGUoYXR0ck5hbWUpOyB9XHJcbn07XHJcblxyXG4kLnNldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5vZGUsIGF0dHJOYW1lLCB2YWx1ZSkge1xyXG4gIGlmIChub2RlLnNldEF0dHJpYnV0ZSAhPSBudWxsKSB7IHJldHVybiBub2RlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgdmFsdWUpOyB9XHJcbn07XHJcblxyXG4kLnJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5vZGUsIGF0dHJOYW1lKSB7XHJcbiAgaWYgKG5vZGUucmVtb3ZlQXR0cmlidXRlICE9IG51bGwpIHsgcmV0dXJuIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTsgfVxyXG59O1xyXG5cclxuJC5oYXNBdHRyaWJ1dGUgPSBmdW5jdGlvbihub2RlLCBhdHRyTmFtZSkge1xyXG4gIGlmIChub2RlLmhhc0F0dHJpYnV0ZSAhPSBudWxsKSB7IHJldHVybiBub2RlLmhhc0F0dHJpYnV0ZShhdHRyTmFtZSk7IH0gZWxzZSB7IHJldHVybiBmYWxzZTsgfVxyXG59O1xyXG5cclxuJC5kYXRhc2V0ID0gZnVuY3Rpb24obm9kZSwgYXR0ck5hbWUsIHZhbHVlKSB7XHJcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcclxuICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xyXG4gICAgICByZXR1cm4gJC5zZXRBdHRyaWJ1dGUobm9kZSwgYGRhdGEtJHthdHRyTmFtZX1gLCB2YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gJC5yZW1vdmVBdHRyaWJ1dGUobm9kZSwgYGRhdGEtJHthdHRyTmFtZX1gKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuICQuZ2V0QXR0cmlidXRlKG5vZGUsIGBkYXRhLSR7YXR0ck5hbWV9YCk7XHJcbiAgfVxyXG59O1xyXG5cclxuJC5pc0Rlc2NlbmRlbnQgPSBmdW5jdGlvbihwYXJlbnQsIGNoaWxkKSB7XHJcbiAgbGV0IG5vZGUgPSBjaGlsZC5wYXJlbnROb2RlO1xyXG4gIHdoaWxlICh0cnVlKSB7XHJcbiAgICBpZiAoIW5vZGUgfHwgKG5vZGUgPT09IHBhcmVudCkpIHsgYnJlYWs7IH1cclxuICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XHJcbiAgfVxyXG4gIHJldHVybiBub2RlID09PSBwYXJlbnQ7XHJcbn07XHJcblxyXG4kLmFkZENsYXNzID0gZnVuY3Rpb24obm9kZSwgY2xhc3NOYW1lKSB7XHJcbiAgaWYgKG5vZGUuY2xhc3NMaXN0ICE9IG51bGwpIHtcclxuICAgIHJldHVybiBub2RlLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIG5vZGUuY2xhc3NOYW1lID0gYCR7bm9kZS5jbGFzc05hbWV9ICR7Y2xhc3NOYW1lfWA7XHJcbiAgfVxyXG59O1xyXG5cclxuJC5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uKG5vZGUsIGNsYXNzTmFtZSkge1xyXG4gIGlmIChub2RlLmNsYXNzTGlzdCAhPSBudWxsKSB7XHJcbiAgICByZXR1cm4gbm9kZS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBub2RlLmNsYXNzTmFtZSA9IG5vZGUuY2xhc3NOYW1lLnJlcGxhY2UoY2xhc3NOYW1lLCAnJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuJC5oYXNDbGFzcyA9IGZ1bmN0aW9uKG5vZGUsIGNsYXNzTmFtZSkge1xyXG4gIGlmIChub2RlLmNsYXNzTGlzdCAhPSBudWxsKSB7XHJcbiAgICByZXR1cm4gbm9kZS5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKTtcclxuICB9IGVsc2UgaWYgKG5vZGUuY2xhc3NOYW1lKSB7XHJcbiAgICByZXR1cm4gbm9kZS5jbGFzc05hbWUubWF0Y2gobmV3IFJlZ0V4cChgJHtjbGFzc05hbWV9KCR8IClgKSkgIT09IG51bGw7XHJcbiAgfVxyXG59O1xyXG5cclxuJC50b2dnbGVDbGFzcyA9IGZ1bmN0aW9uKG5vZGUsIGNsYXNzTmFtZSkge1xyXG4gIGlmICgkLmhhc0NsYXNzKG5vZGUsIGNsYXNzTmFtZSkpIHtcclxuICAgIHJldHVybiAkLnJlbW92ZUNsYXNzKG5vZGUsIGNsYXNzTmFtZSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiAkLmFkZENsYXNzKG5vZGUsIGNsYXNzTmFtZSk7XHJcbiAgfVxyXG59O1xyXG5cclxuJC5jb21wdXRlZFN0eWxlID0gbm9kZSA9PiBub2RlLmN1cnJlbnRTdHlsZSB8fCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShub2RlLCBudWxsKTtcclxuXHJcbiQuaXNWaXNpYmxlTm9kZSA9IGZ1bmN0aW9uKG5vZGUpIHtcclxuICBsZXQgY29tcHV0ZWRTdHlsZSA9ICQuY29tcHV0ZWRTdHlsZShub2RlKTtcclxuICByZXR1cm4gKCdub25lJyAhPT0gY29tcHV0ZWRTdHlsZVsnZGlzcGxheSddKSAmJlxyXG4gICFfLmlzWmVyb0NTU1ZhbHVlKGNvbXB1dGVkU3R5bGVbJ29wYWNpdHknXSkgJiZcclxuICAhXy5pc1plcm9DU1NWYWx1ZShjb21wdXRlZFN0eWxlWydtYXgtaGVpZ2h0J10pO1xyXG59O1xyXG5cclxuJC50ZXh0Q29udGVudCA9IGZ1bmN0aW9uKG5vZGUsIGNvbnRlbnQpIHtcclxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgaWYgKG5vZGUudGV4dENvbnRlbnQgIT0gbnVsbCkge1xyXG4gICAgICByZXR1cm4gbm9kZS50ZXh0Q29udGVudCA9IGNvbnRlbnQ7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gbm9kZS5pbm5lclRleHQgPSBjb250ZW50O1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gbm9kZS50ZXh0Q29udGVudCB8fCBub2RlLmlubmVyVGV4dDtcclxuICB9XHJcbn07XHJcblxyXG4kLmlubmVySFRNTCA9IGZ1bmN0aW9uKG5vZGUsIGNvbnRlbnQpIHtcclxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xyXG4gICAgcmV0dXJuIG5vZGUuaW5uZXJIVE1MID0gY29udGVudDtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIG5vZGUuaW5uZXJIVE1MO1xyXG4gIH1cclxufTtcclxuXHJcbiQuY3NzID0gZnVuY3Rpb24obm9kZSwgc3R5bGVOYW1lLCB2YWx1ZSkge1xyXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XHJcbiAgICByZXR1cm4gbm9kZS5zdHlsZVtzdHlsZU5hbWVdID0gdmFsdWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBub2RlLnN0eWxlW3N0eWxlTmFtZV07XHJcbiAgfVxyXG59O1xyXG5cclxuJC5ub2RlTmFtZSA9IG5vZGUgPT4gbm9kZS5ub2RlTmFtZTtcclxuXHJcbiQucGFnZUhlaWdodCA9IGZ1bmN0aW9uKCkge1xyXG4gIGxldCBoZWlnaHQ7XHJcbiAgbGV0IGRlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG4gIGlmIChkZSkgeyBoZWlnaHQgPSBkZS5zY3JvbGxIZWlnaHQgfHwgZGUuY2xpZW50SGVpZ2h0IHx8IGRlLm9mZnNldEhlaWdodDsgfVxyXG4gIGlmICghaGVpZ2h0KSB7IGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDsgfVxyXG4gIGxldCB7IGJvZHkgfSA9IGRvY3VtZW50O1xyXG4gIGxldCBib2R5SGVpZ2h0ID0gYm9keS5zY3JvbGxIZWlnaHQgfHwgYm9keS5jbGllbnRIZWlnaHQgfHwgYm9keS5vZmZzZXRIZWlnaHQ7XHJcbiAgaGVpZ2h0ID0gTWF0aC5tYXgoaGVpZ2h0LCBib2R5SGVpZ2h0KTtcclxuICByZXR1cm4gYCR7aGVpZ2h0fXB4YDtcclxufTtcclxuXHJcbiQuY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKHRhZywgaW5uZXJIdG1sKSB7XHJcbiAgbGV0IHRhZ05vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XHJcbiAgdGFnTm9kZS5pbm5lckhUTUwgPSBpbm5lckh0bWw7XHJcbiAgcmV0dXJuIHRhZ05vZGU7XHJcbn07IiwibGV0IHsgcmggfSA9IHdpbmRvdztcclxubGV0IHsgXyB9ID0gcmg7XHJcbmxldCB7IGNvbnN0cyB9ID0gcmg7XHJcbmxldCB7IG1vZGVsIH0gPSByaDtcclxuXHJcbmNsYXNzIFJlc3BvbnNpdmUge1xyXG5cclxuICB0b1N0cmluZygpIHsgcmV0dXJuICdSZXNwb25zaXZlJzsgfVxyXG5cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHRoaXMuc3VicyA9IFtdO1xyXG4gICAgbW9kZWwuc3Vic2NyaWJlKGNvbnN0cygnRVZUX09SSUVOVEFUSU9OX0NIQU5HRScpLCAoKSA9PiB7XHJcbiAgICAgIHJldHVybiBfLmVhY2godGhpcy5zdWJzLCBzdWIgPT4gc3ViLmV2ZW50SGFuZGxlcihzdWIubXFsKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAocmguX2RlYnVnICYmICF0aGlzLmlzU3VwcG9ydGVkKCkpIHtcclxuICAgICAgcmguX2QoJ2Vycm9yJywgJ0Jyb3dzZXIgSXNzdWUnLCAnbWF0Y2hNZWRpYSBpcyBub3Qgc3VwcG9ydGVkLicpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaXNTdXBwb3J0ZWQoKSB7IHJldHVybiAod2luZG93Lm1hdGNoTWVkaWEgIT0gbnVsbCk7IH1cclxuXHJcbiAgYXR0YWNoKG1lZGlhX3F1ZXJ5LCBvbkZuLCBvZmZGbikge1xyXG4gICAgaWYgKHRoaXMuaXNTdXBwb3J0ZWQpIHtcclxuICAgICAgbGV0IG1xbCA9IHdpbmRvdy5tYXRjaE1lZGlhKG1lZGlhX3F1ZXJ5KTtcclxuICAgICAgbGV0IGV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKG1xbCkgeyBpZiAobXFsLm1hdGNoZXMpIHsgcmV0dXJuIG9uRm4oKTsgfSBlbHNlIHsgcmV0dXJuIG9mZkZuKCk7IH0gfTtcclxuICAgICAgZXZlbnRIYW5kbGVyKG1xbCk7XHJcbiAgICAgIG1xbC5hZGRMaXN0ZW5lcihldmVudEhhbmRsZXIpO1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJzLnB1c2goe21xbCwgb246IG9uRm4sIG9mZjogb2ZmRm4sIGV2ZW50SGFuZGxlcn0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZGV0YWNoKG1lZGlhX3F1ZXJ5LCBvbkZuLCBvZmZGbikge1xyXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHRoaXMuc3Vicy5sZW5ndGg7IGluZGV4KyspIHtcclxuICAgICAgbGV0IHN1YiA9IHRoaXMuc3Vic1tpbmRleF07XHJcbiAgICAgIGlmICgoc3ViLm1xbC5tZWRpYSA9PT0gbWVkaWFfcXVlcnkpICYmIChzdWIub24gPT09IG9uRm4pICYmIChzdWIub2ZmID09PSBvZmZGbikpIHtcclxuICAgICAgICBzdWIubXFsLnJlbW92ZUxpc3RlbmVyKHN1Yi5ldmVudEhhbmRsZXIpO1xyXG4gICAgICAgIHRoaXMuc3Vicy5zcGxpY2UoaW5kZXgpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5yaC5yZXNwb25zaXZlID0gbmV3IFJlc3BvbnNpdmUoKTsiLCJjb25zdCB7IHJoIH0gPSB3aW5kb3c7XHJcbmNvbnN0IHsgXyB9ID0gcmg7XHJcbmNvbnN0IHsgJCB9ID0gcmg7XHJcbmNvbnN0IHsgY29uc3RzIH0gPSByaDtcclxuY29uc3QgeyBtb2RlbCB9ID0gcmg7XHJcbmNvbnN0IHsgaHR0cCB9ID0gcmg7XHJcbmNvbnN0IGZvcm1kYXRhID0gcmguZm9ybURhdGE7XHJcblxyXG5jbGFzcyBSb2JvSGVscFNlcnZlciB7XHJcblxyXG4gIHRvU3RyaW5nKCkgeyByZXR1cm4gJ1JvYm9IZWxwU2VydmVyJzsgfVxyXG5cclxuICBjb25zdHJ1Y3RvcigpIHt9XHJcblxyXG4gIGFyZWEoKSB7XHJcbiAgICByZXR1cm4gXy51cmxQYXJhbSgnYXJlYScsIF8uZXh0cmFjdFBhcmFtU3RyaW5nKCkpO1xyXG4gIH1cclxuXHJcbiAgdHlwZSgpIHtcclxuICAgIHJldHVybiBfLnVybFBhcmFtKCd0eXBlJywgXy5leHRyYWN0UGFyYW1TdHJpbmcoKSk7XHJcbiAgfVxyXG5cclxuICBwcm9qZWN0KCkge1xyXG4gICAgcmV0dXJuIF8udXJsUGFyYW0oJ3Byb2plY3QnLCBfLmV4dHJhY3RQYXJhbVN0cmluZygpKTtcclxuICB9XHJcblxyXG4gIGxvZ1RvcGljVmlldyh0b3BpYykge1xyXG4gICAgcmV0dXJuIG1vZGVsLnN1YnNjcmliZShjb25zdHMoJ0VWVF9QUk9KRUNUX0xPQURFRCcpLCAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGJhc2VVcmwgPSBtb2RlbC5nZXQoY29uc3RzKCdLRVlfUFVCTElTSF9CQVNFX1VSTCcpKTtcclxuICAgICAgY29uc3QgcGFyZW50UGF0aCA9IF8ucGFyZW50UGF0aChfLmZpbGVQYXRoKF8uZ2V0Um9vdFVybCgpKSk7XHJcbiAgICAgIGNvbnN0IHRwY1VybCA9IF8uaXNSZWxhdGl2ZVVybCh0b3BpYykgPyBwYXJlbnRQYXRoICsgdG9waWMgOiB0b3BpYztcclxuICAgICAgaWYgKGJhc2VVcmwgJiYgIV8uaXNFbXB0eVN0cmluZyhiYXNlVXJsKSkge1xyXG4gICAgICAgIGNvbnN0IGhhc2hTdHJpbmcgPSBfLm1hcFRvRW5jb2RlZFN0cmluZyhfLmV4dGVuZChjb25zdHMoJ1JIU19MT0dfVE9QSUNfVklFVycpLFxyXG4gICAgICAgICAge2FyZWE6IHRoaXMuYXJlYSgpLCB0cGM6IF8uZmlsZVBhdGgodHBjVXJsKX0pXHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gaHR0cC5nZXQoYCR7YmFzZVVybH0/JHtoYXNoU3RyaW5nfWApO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByZVNlYXJjaCgpIHtcclxuICAgIGxldCBoYXNoU3RyaW5nO1xyXG4gICAgY29uc3Qgc2VhcmNoVGV4dCA9IG1vZGVsLmdldChjb25zdHMoJ0tFWV9TRUFSQ0hfVEVSTScpKTtcclxuICAgIGlmIChzZWFyY2hUZXh0ICYmICFfLmlzRW1wdHlTdHJpbmcoc2VhcmNoVGV4dCkpIHtcclxuICAgICAgaGFzaFN0cmluZyA9IF8ubWFwVG9FbmNvZGVkU3RyaW5nKF8uZXh0ZW5kKGNvbnN0cygnUkhTX0RPX1NFQVJDSCcpLCBfLmFkZFBhdGhOYW1lS2V5KHtcclxuICAgICAgICBhcmVhOiB0aGlzLmFyZWEoKSwgdHlwZTogdGhpcy50eXBlKCksIHByb2plY3Q6IHRoaXMucHJvamVjdCgpLCBxdWVzbjogc2VhcmNoVGV4dCxcclxuICAgICAgICBvbGRxdWVzbjogJycsIHF1ZXNuc3luOiAnJ1xyXG4gICAgICB9KVxyXG4gICAgICApXHJcbiAgICAgICk7XHJcblxyXG4gICAgICBtb2RlbC5wdWJsaXNoKGNvbnN0cygnS0VZX1NFQVJDSEVEX1RFUk0nKSwgc2VhcmNoVGV4dCk7XHJcbiAgICAgIG1vZGVsLnB1Ymxpc2goY29uc3RzKCdFVlRfU0VBUkNIX0lOX1BST0dSRVNTJyksIHRydWUpO1xyXG4gICAgICBtb2RlbC5wdWJsaXNoKGNvbnN0cygnS0VZX1NFQVJDSF9QUk9HUkVTUycpLCAwKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4ge3NlYXJjaFRleHQsIGhhc2hTdHJpbmd9O1xyXG4gIH1cclxuXHJcbiAgcG9zdFNlYXJjaChzZWFyY2hUZXh0LCByZXN1bHRzVGV4dCkge1xyXG4gICAgY29uc3Qgc2VhcmNoUmVzdWx0cyA9IEpTT04ucGFyc2UocmVzdWx0c1RleHQpO1xyXG4gICAgaWYgKHNlYXJjaFJlc3VsdHMgJiYgc2VhcmNoUmVzdWx0cy5jbGllbnRJbmRleCkge1xyXG4gICAgICBjb25zdCBoYXNoU3RyaW5nID0gXy5tYXBUb0VuY29kZWRTdHJpbmcoXy5hZGRQYXRoTmFtZUtleSh7YXJlYTogdGhpcy5hcmVhKCksIHR5cGU6IHRoaXMudHlwZSgpLFxyXG4gICAgICBwcm9qZWN0OiB0aGlzLnByb2plY3QoKSwgcXVlc246IHNlYXJjaFRleHQsIGNtZDogJ2NsaWVudGluZGV4J30pKTtcclxuICAgICAgbW9kZWwuc3Vic2NyaWJlT25jZShjb25zdHMoJ0tFWV9TRUFSQ0hfUkVTVUxUUycpLCBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgY29uc3QgYmFzZVVybCA9IG1vZGVsLmdldChjb25zdHMoJ0tFWV9QVUJMSVNIX0JBU0VfVVJMJykpO1xyXG4gICAgICAgIHJldHVybiBodHRwLnBvc3QoYCR7YmFzZVVybH0/JHtoYXNoU3RyaW5nfWAsIEpTT04uc3RyaW5naWZ5KGRhdGEpLFxyXG4gICAgICAgIHsnQ29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfSlcclxuICAgICAgICAuZXJyb3IoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBsZXQgcmVzdWx0O1xyXG4gICAgICAgICAgcmV0dXJuIHJlc3VsdCA9IGZhbHNlO30pLnN1Y2Nlc3MoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBsZXQgcmVzdWx0O1xyXG4gICAgICAgICAgcmV0dXJuIHJlc3VsdCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgLCB7aW5pdERvbmU6IHRydWV9KTtcclxuICAgICAgcmV0dXJuIHdpbmRvdy5kb1NlYXJjaCgpO1xyXG4gICAgfVxyXG4gICAgbW9kZWwucHVibGlzaChjb25zdHMoJ0VWVF9TRUFSQ0hfSU5fUFJPR1JFU1MnKSwgZmFsc2UpO1xyXG4gICAgbW9kZWwucHVibGlzaChjb25zdHMoJ0tFWV9TRUFSQ0hfUFJPR1JFU1MnKSwgbnVsbCk7XHJcblxyXG4gICAgaWYgKHNlYXJjaFJlc3VsdHMpIHtcclxuICAgICAgY29uc3Qgc2VhcmNoVG9waWNzID0gc2VhcmNoUmVzdWx0cy50b3BpY3M7XHJcbiAgICAgIGlmIChzZWFyY2hUb3BpY3MgJiYgKHNlYXJjaFRvcGljcy5sZW5ndGggPiAwKSkge1xyXG4gICAgICAgIHdpbmRvdy5zZXRSZXN1bHRzU3RyaW5nSFRNTChzZWFyY2hUb3BpY3MubGVuZ3RoLFxyXG4gICAgICAgIHdpbmRvdy5fdGV4dFRvSHRtbF9ub25ic3Aoc2VhcmNoVGV4dCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCByZXN1bHRzUGFyYW1zID0gJz8nICsgXy5tYXBUb0VuY29kZWRTdHJpbmcoXy5leHRlbmQoe3JoaGx0ZXJtOiBzZWFyY2hUZXh0fSxcclxuICAgICAgICB7cmhzeW5zOiBzZWFyY2hSZXN1bHRzLnN5bnN9KVxyXG4gICAgICApO1xyXG5cclxuICAgICAgbW9kZWwucHVibGlzaChjb25zdHMoJ0tFWV9TRUFSQ0hfUkVTVUxUX1BBUkFNUycpLCByZXN1bHRzUGFyYW1zKTtcclxuICAgICAgbW9kZWwucHVibGlzaChjb25zdHMoJ0tFWV9TRUFSQ0hfUkVTVUxUUycpLCBzZWFyY2hUb3BpY3MpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghc2VhcmNoUmVzdWx0cyB8fCAhKHNlYXJjaFJlc3VsdHMudG9waWNzICE9IG51bGwgPyBzZWFyY2hSZXN1bHRzLnRvcGljcy5sZW5ndGggOiB1bmRlZmluZWQpKSB7XHJcbiAgICAgIHJldHVybiB3aW5kb3cuZGlzcGxheU1zZyh3aW5kb3cuZ3NOb1RvcGljcyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBkb1NlYXJjaCgpIHtcclxuICAgIGxldCByZXN1bHQgPSBtb2RlbC5nZXQoY29uc3RzKCdLRVlfUFVCTElTSF9NT0RFJykpO1xyXG4gICAgY29uc3QgYmFzZVVybCA9IG1vZGVsLmdldChjb25zdHMoJ0tFWV9QVUJMSVNIX0JBU0VfVVJMJykpO1xyXG4gICAgaWYgKGJhc2VVcmwgJiYgIV8uaXNFbXB0eVN0cmluZyhiYXNlVXJsKSkge1xyXG4gICAgICBjb25zdCB7c2VhcmNoVGV4dCwgaGFzaFN0cmluZ30gPSB0aGlzLnByZVNlYXJjaCgpO1xyXG5cclxuICAgICAgaHR0cC5nZXQoYCR7YmFzZVVybH0/JHtoYXNoU3RyaW5nfWApXHJcbiAgICAgIC5lcnJvcigoKSA9PiByZXN1bHQgPSBmYWxzZSkuc3VjY2VzcyhyZXN1bHRzVGV4dCA9PiB7XHJcbiAgICAgICAgdGhpcy5wb3N0U2VhcmNoKHNlYXJjaFRleHQsIHJlc3VsdHNUZXh0KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0ID0gdHJ1ZTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxufVxyXG5cclxucmgucmhzID0gbmV3IFJvYm9IZWxwU2VydmVyKCk7XHJcbiIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCB7IF8gfSA9IHJoO1xyXG5sZXQgeyBjb25zdHMgfSA9IHJoO1xyXG5sZXQgeyBtb2RlbCB9ID0gcmg7XHJcblxyXG5sZXQgZGVmYXVsdFNjcmVlbnMgPSB7XHJcbiAgZGVza3RvcDoge1xyXG4gICAgbWVkaWFfcXVlcnk6ICdzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEyOTZweCknXHJcbiAgfSxcclxuICB0YWJsZXQ6IHtcclxuICAgIG1lZGlhX3F1ZXJ5OiAnc2NyZWVuIGFuZCAobWluLXdpZHRoOiA5NDJweCkgYW5kIChtYXgtd2lkdGg6IDEyOTVweCknXHJcbiAgfSxcclxuICBwaG9uZToge1xyXG4gICAgbWVkaWFfcXVlcnk6ICdzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk0MXB4KSdcclxuICB9LFxyXG4gIGlvczoge1xyXG4gICAgdXNlcl9hZ2VudDogLyhpUGFkfGlQaG9uZXxpUG9kKS9nXHJcbiAgfSxcclxuICBpcGFkOiB7XHJcbiAgICB1c2VyX2FnZW50OiAvKGlQYWQpL2dcclxuICB9LFxyXG4gIHByaW50OiB7XHJcbiAgICBtZWRpYV9xdWVyeTogJ3ByaW50J1xyXG4gIH1cclxufTtcclxuXHJcblxyXG5jbGFzcyBTY3JlZW4ge1xyXG5cclxuICBhdHRhY2hlZEtleShuYW1lKSB7IHJldHVybiBgJHtjb25zdHMoJ0tFWV9TQ1JFRU4nKX0uJHtuYW1lfS5hdHRhY2hlZGA7IH1cclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLnN1YnNjcmliZVNjcmVlbiA9IHRoaXMuc3Vic2NyaWJlU2NyZWVuLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLm9uU2NyZWVuID0gdGhpcy5vblNjcmVlbi5iaW5kKHRoaXMpO1xyXG4gICAgdGhpcy5vZmZTY3JlZW4gPSB0aGlzLm9mZlNjcmVlbi5iaW5kKHRoaXMpO1xyXG4gICAgbGV0IGRhdGEgPSBfLmV4dGVuZCh7fSwgZGVmYXVsdFNjcmVlbnMsIG1vZGVsLmdldChjb25zdHMoJ0tFWV9TQ1JFRU4nKSkpO1xyXG4gICAgaWYgKGRhdGEpIHsgXy5lYWNoKGRhdGEsIHRoaXMuc3Vic2NyaWJlU2NyZWVuKTsgfVxyXG4gIH1cclxuXHJcbiAgc3Vic2NyaWJlU2NyZWVuKGluZm8sIG5hbWUpIHtcclxuICAgIGlmIChpbmZvLnVzZXJfYWdlbnQgJiZcclxuICAgICF3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaChfLnRvUmVnRXhwKGluZm8udXNlcl9hZ2VudCkpKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm9mZlNjcmVlbihuYW1lKTtcclxuICAgIH0gZWxzZSBpZiAoaW5mby5tZWRpYV9xdWVyeSkge1xyXG4gICAgICBpZiAocmgucmVzcG9uc2l2ZS5pc1N1cHBvcnRlZCgpKSB7XHJcbiAgICAgICAgcmV0dXJuIHJoLnJlc3BvbnNpdmUuYXR0YWNoKGluZm8ubWVkaWFfcXVlcnksICgpID0+IHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLm9uU2NyZWVuKG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAsICgpID0+IHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLm9mZlNjcmVlbihuYW1lKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBtb2RlbC5nZXQoY29uc3RzKCdLRVlfREVGQVVMVF9TQ1JFRU4nKSkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vblNjcmVlbihuYW1lKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vZmZTY3JlZW4obmFtZSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm9uU2NyZWVuKG5hbWUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgb25TY3JlZW4obmFtZSkge1xyXG4gICAgbGV0IGtleSA9IHRoaXMuYXR0YWNoZWRLZXkobmFtZSk7XHJcbiAgICByZXR1cm4gbW9kZWwucHVibGlzaChrZXksIHRydWUpO1xyXG4gIH1cclxuICBcclxuICBvZmZTY3JlZW4obmFtZSkge1xyXG4gICAgbGV0IGtleSA9IHRoaXMuYXR0YWNoZWRLZXkobmFtZSk7XHJcbiAgICBpZiAoZmFsc2UgIT09IG1vZGVsLmdldChrZXkpKSB7IHJldHVybiBtb2RlbC5wdWJsaXNoKGtleSwgZmFsc2UpOyB9XHJcbiAgfVxyXG59XHJcblxyXG5tb2RlbC5zdWJzY3JpYmUoY29uc3RzKCdFVlRfV0lER0VUX0JFRk9SRUxPQUQnKSwgKGZ1bmN0aW9uKCkge1xyXG4gIGxldCBzY3JlZW4gPSBudWxsO1xyXG4gIHJldHVybiAoKSA9PiBzY3JlZW4gIT0gbnVsbCA/IHNjcmVlbiA6IChzY3JlZW4gPSBuZXcgU2NyZWVuKCkpO1xyXG59KSgpXHJcbik7XHJcblxyXG5tb2RlbC5wdWJsaXNoKGNvbnN0cygnS0VZX1NDUkVFTl9OQU1FUycpLCBbJ2Rlc2t0b3AnLCAndGFibGV0JywgJ3Bob25lJ10pO1xyXG5tb2RlbC5wdWJsaXNoKGNvbnN0cygnS0VZX1NDUkVFTicpLCBkZWZhdWx0U2NyZWVucyk7XHJcbm1vZGVsLnB1Ymxpc2goY29uc3RzKCdLRVlfREVGQVVMVF9TQ1JFRU4nKSwgJ3Bob25lJyk7XHJcbiIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCB7IF8gfSA9IHJoO1xyXG5cclxuLy8gU3RvcmFnZSBjbGFzcyB0byBwZXJzaXN0IGtleSB2YWx1ZSBwYWlycyB0byBsb2NhbERCL2Nvb2tpZXNcclxuY2xhc3MgU3RvcmFnZSB7XHJcblxyXG4gIHRvU3RyaW5nKCkgeyByZXR1cm4gJ1N0b3JhZ2UnOyB9XHJcblxyXG4gIGluaXQobmFtZXNwYWNlKSB7XHJcbiAgICBpZiAodGhpcy5uYW1lc3BhY2UpIHtcclxuICAgICAgaWYgKHJoLl9kZWJ1ZyAmJiAodGhpcy5uYW1lc3BhY2UgIT09IG5hbWVzcGFjZSkpIHtcclxuICAgICAgICByZXR1cm4gcmguX2QoJ2Vycm9yJywgJ1N0b3JhZ2UnLCAnTmFtZXNwYWNlIGNhbm5cXCd0IGJlIGNoYW5nZWQnKTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbGV0IGpzb25TdHJpbmc7XHJcbiAgICAgIHRoaXMubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xyXG4gICAgICBpZiAoXy5jYW5Vc2VMb2NhbERCKCkpIHtcclxuICAgICAgICBqc29uU3RyaW5nID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0odGhpcy5uYW1lc3BhY2UpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCByYXdEYXRhID0gXy5leHBsb2RlQW5kTWFwKGRvY3VtZW50LmNvb2tpZSwgJzsnLCAnPScpO1xyXG4gICAgICAgIGlmIChyYXdEYXRhW3RoaXMubmFtZXNwYWNlXSkgeyBqc29uU3RyaW5nID0gdW5lc2NhcGUocmF3RGF0YVt0aGlzLm5hbWVzcGFjZV0pOyB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRoaXMuc3RvcmFnZU1hcCA9IGpzb25TdHJpbmcgPyBKU09OLnBhcnNlKGpzb25TdHJpbmcpIDoge307XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpc1ZhbGlkKCkge1xyXG4gICAgaWYgKHJoLl9kZWJ1ZyAmJiAhdGhpcy5zdG9yYWdlTWFwKSB7XHJcbiAgICAgIHJoLl9kKCdlcnJvcicsICdTdG9yYWdlJywgJ05hbWVzcGFjZSBpcyBub3Qgc2V0IHlldC4nKTtcclxuICAgIH1cclxuICAgIHJldHVybiAodGhpcy5zdG9yYWdlTWFwICE9IG51bGwpO1xyXG4gIH1cclxuXHJcbiAgcGVyc2lzdChrZXksIHZhbHVlKSB7XHJcbiAgICBpZiAodGhpcy5pc1ZhbGlkKCkpIHtcclxuICAgICAgdGhpcy5zdG9yYWdlTWFwW2tleV0gPSB2YWx1ZTtcclxuICAgICAgcmV0dXJuIHRoaXMuZHVtcCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZmV0Y2goa2V5KSB7IGlmICh0aGlzLmlzVmFsaWQoKSkgeyByZXR1cm4gdGhpcy5zdG9yYWdlTWFwW2tleV07IH0gfVxyXG5cclxuICBkdW1wKCkge1xyXG4gICAgaWYgKHRoaXMuaXNWYWxpZCgpKSB7XHJcbiAgICAgIGlmIChfLmNhblVzZUxvY2FsREIoKSkge1xyXG4gICAgICAgIHJldHVybiBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0aGlzLm5hbWVzcGFjZSwgSlNPTi5zdHJpbmdpZnkodGhpcy5zdG9yYWdlTWFwKSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNvb2tpZSA9IGAke3RoaXMubmFtZXNwYWNlfT0ke2VzY2FwZShKU09OLnN0cmluZ2lmeSh0aGlzLnN0b3JhZ2VNYXApKX1gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5yaC5TdG9yYWdlID0gU3RvcmFnZTtcclxucmguc3RvcmFnZSA9IG5ldyBTdG9yYWdlKCk7XHJcbiIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCB7IF8gfSA9IHJoO1xyXG5sZXQgeyAkIH0gPSByaDtcclxubGV0IHsgY29uc3RzIH0gPSByaDtcclxuXHJcbi8vV2lkZ2V0IGNsYXNzIGZvciBhbnkgY3VzdG9tIGJlaGF2aW9yIG9uIGRvbSBub2RlXHJcbnZhciBXaWRnZXQgPSAoZnVuY3Rpb24oKSB7XHJcbiAgbGV0IF9jb3VudCA9IHVuZGVmaW5lZDtcclxuICBXaWRnZXQgPSBjbGFzcyBXaWRnZXQgZXh0ZW5kcyByaC5HdWFyZCB7XHJcbiAgICBzdGF0aWMgaW5pdENsYXNzKCkge1xyXG5cclxuICAgICAgIC8vcHJpdmF0ZSBzdGF0aWMgdmFyaWFibGVcclxuICAgICAgX2NvdW50ID0gMDtcclxuXHJcbiAgICAgIHRoaXMucHJvdG90eXBlLmRhdGFBdHRycyA9IFsncmVwZWF0JywgJ2luaXQnLCAnc3RleHQnLCAnc2h0bWwnLFxyXG4gICAgICAgICdjb250cm9sbGVyJywgJ2NsYXNzJywgJ2FuaW1hdGUnLCAnY3NzJywgJ2F0dHInLCAndmFsdWUnLCAnY2hlY2tlZCcsXHJcbiAgICAgICAgJ2h0bWwnLCAndGV4dCcsICdpZicsICdoaWRkZW4nLCAna2V5ZG93bicsICdrZXl1cCcsICdzY3JvbGwnLFxyXG4gICAgICAgICdjaGFuZ2UnLCAndG9nZ2xlJywgJ3RvZ2dsZWNsYXNzJywgJ21ldGhvZCcsICd0cmlnZ2VyJywgJ2NsaWNrJywgJ2xvYWQnLFxyXG4gICAgICAgICdtb3VzZW92ZXInLCAnbW91c2VvdXQnLCAnZm9jdXMnLCAnYmx1cicsXHJcbiAgICAgICAgJ3N3aXBlbGVmdCcsICdzd2lwZXJpZ2h0JywgJ3N3aXBldXAnLCAnc3dpcGVkb3duJywgJ3NjcmVlbnZhciddO1xyXG5cclxuICAgICAgdGhpcy5wcm90b3R5cGUuZGF0YUF0dHJNZXRob2RzID0gKCgpID0+IFdpZGdldC5wcm90b3R5cGUubWFwRGF0YUF0dHJNZXRob2RzKFdpZGdldC5wcm90b3R5cGUuZGF0YUF0dHJzKSkoKTtcclxuXHJcbiAgICAgIC8vYWxsIGxpc3QvZGF0YS1yZWFwZWF0IGl0ZW1zIGRhdGEtaSBhdHRyaWJ1dGUgYXJlIHN1cHBvcnRcclxuICAgICAgLy90aGlzIGlzIHRoZSBsaXN0IG9mIHNwZWNpYWwgbGlzdCBpdGVtIGF0dHJpYnV0ZS5cclxuICAgICAgLy9UaGF0IG1lYW5zIGF0dHJpYnV0ZXMgbGlrZSBkYXRhLWlocmVmLCBkYXRhLWlpZCBldGMgd2lsbFxyXG4gICAgICAvLyBiZSBzdXBwb3J0ZWQgd2l0aG91dCBsaXN0aW5nIGhlcmUuXHJcbiAgICAgIHRoaXMucHJvdG90eXBlLmRhdGFJQXR0cnMgPSBbJ2l0ZXh0JywgJ2lodG1sJywgJ2ljbGFzcycsICdpcmVwZWF0J107XHJcbiAgICAgIHRoaXMucHJvdG90eXBlLmRhdGFJQXR0ck1ldGhvZHMgPSAoKCkgPT4gV2lkZ2V0LnByb3RvdHlwZS5tYXBEYXRhQXR0ck1ldGhvZHMoV2lkZ2V0LnByb3RvdHlwZS5kYXRhSUF0dHJzKSkoKTtcclxuXHJcbiAgICAgIHRoaXMucHJvdG90eXBlLnN1cHBvcnRlZEFyZ3MgPSBbJ25vZGUnLCAnbW9kZWwnLCAna2V5JywgJ3VzZXJfdmFycycsXHJcbiAgICAgICAgJ3RlbXBsYXRlRXhwcicsICdpbmNsdWRlJ107XHJcblxyXG4gICAgICB0aGlzLnByb3RvdHlwZS5yZXNvbHZlRXZlbnRSYXdFeHByID0gXy5tZW1vaXplKGZ1bmN0aW9uKHJhd0V4cHIpIHtcclxuICAgICAgICBsZXQge2V4cHIsIG9wdHN9ID0gXy5yZXNvbHZlRXhwck9wdGlvbnMocmF3RXhwcik7XHJcbiAgICAgICAgZXhwciA9IHRoaXMucGF0Y2hSYXdFeHByKGV4cHIsIG9wdHMpO1xyXG4gICAgICAgIGxldCBleHByRm4gPSB0aGlzLl9mdW5jdGlvbignZXZlbnQsIG5vZGUnLCBleHByKTtcclxuICAgICAgICBsZXQgY2FsbGJhY2sgPSBfLnNhZmVFeGVjKGV4cHJGbik7XHJcbiAgICAgICAgY2FsbGJhY2sgPSBfLmFwcGx5Q2FsbGJhY2tPcHRpb25zKGNhbGxiYWNrLCBvcHRzKTtcclxuICAgICAgICByZXR1cm4ge2NhbGxiYWNrLCBvcHRzfTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICB0aGlzLnByb3RvdHlwZS5yZXNvbHZlUmF3RXhwcldpdGhWYWx1ZSA9IF8ubWVtb2l6ZShmdW5jdGlvbihyYXdFeHByKSB7XHJcbiAgICAgICAgbGV0IGtleXMgPSBbXTtcclxuICAgICAgICBsZXQge2V4cHIsIG9wdHN9ID0gXy5yZXNvbHZlRXhwck9wdGlvbnMocmF3RXhwcik7XHJcbiAgICAgICAgZXhwciA9IHRoaXMucGF0Y2hSYXdFeHByKGV4cHIsIG9wdHMpO1xyXG4gICAgICAgIGxldCBleHByRm4gPSB0aGlzLl9ldmFsRnVuY3Rpb24oJycsIGV4cHIsIGtleXMpO1xyXG4gICAgICAgIGxldCBjYWxsYmFjayA9IF8uc2FmZUV4ZWMoZXhwckZuKTtcclxuICAgICAgICBjYWxsYmFjayA9IF8uYXBwbHlDYWxsYmFja09wdGlvbnMoY2FsbGJhY2ssIG9wdHMpO1xyXG4gICAgICAgIHJldHVybiB7Y2FsbGJhY2ssIGtleXMsIG9wdHN9O1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAvLyMjIyMjIyMjIyBIZWxlcGVyIGZ1bmN0aW9uIHRvIGNyZWF0ZSBmdW5jdGlvbnMgaW4gd2lkZ2V0ICMjIyMjIyMjIyMjIyMjIyMjXHJcbiAgICAgIHRoaXMucHJvdG90eXBlLnJlc29sdmVFeHByZXNzaW9uID0gXy5tZW1vaXplKGZ1bmN0aW9uKGV4cHIpIHtcclxuICAgICAgICBsZXQga2V5cyA9IFtdO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBleHByOiBfLnJlc29sdmVNb2RlbEtleXMoXy5yZXNvbHZlTmFtZWRWYXIoZXhwciksIGtleXMpLFxyXG4gICAgICAgICAga2V5c1xyXG4gICAgICAgIH07XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdGhpcy5wcm90b3R5cGUuX3NhZmVGdW5jdGlvbiA9IF8ubWVtb2l6ZShmdW5jdGlvbihhcmcsIGV4cHIpIHtcclxuICAgICAgICBsZXQgZm47XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGZuID0gbmV3IEZ1bmN0aW9uKGFyZywgZXhwcik7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIGZuID0gZnVuY3Rpb24oKSB7fTtcclxuICAgICAgICAgIGlmIChyaC5fZGVidWcpIHsgcmguX2QoJ2Vycm9yJywgYEV4cHJlc3Npb246ICR7ZXhwcn1gLCBlcnJvci5tZXNzYWdlKTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZm47XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdGhpcy5wcm90b3R5cGUuX2V2ZW50Q2FsbEJhY2tEYXRhID0ge307XHJcblxyXG4gICAgICB0aGlzLnByb3RvdHlwZS5yZXNvbHZlQXR0ciA9IChmdW5jdGlvbigpIHtcclxuICAgICAgICBsZXQgY2FjaGUgPSB7fTtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYXR0cnNEYXRhKSB7XHJcbiAgICAgICAgICBsZXQgcHJvcHMgPSBjYWNoZVthdHRyc0RhdGFdO1xyXG4gICAgICAgICAgaWYgKHByb3BzID09IG51bGwpIHtcclxuICAgICAgICAgICAgcHJvcHMgPSBfLnJlc29sdmVBdHRyKGF0dHJzRGF0YSk7XHJcbiAgICAgICAgICAgIGNhY2hlW2F0dHJzRGF0YV0gPSBwcm9wcztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBwcm9wcztcclxuICAgICAgICB9O1xyXG4gICAgICB9KSgpO1xyXG5cclxuICAgICAgLypcclxuICAgICAgICogVG9nZ2xlIG1vZGVsIHZhcmlhYmxlIG9uIGNsaWNrXHJcbiAgICAgICAqIEV4YW1wbGU6IGRhdGEtdG9nZ2xlPSdzaG93aGlkZSdcclxuICAgICAgICogICAgICAgICAgZGF0YS10b2dnbGU9J3Nob3dMZWZ0QmFyOnRydWUnXHJcbiAgICAgICAqICAgICAgICAgIGRhdGEtdG9nZ2xlPSdzaG93TGVmdEJhcjp0cnVlO3Nob3dSaWdodEJhcjpmYWxzZSdcclxuICAgICAgICovXHJcbiAgICAgIHRoaXMucHJvdG90eXBlLl90b2dnbGVEYXRhID0ge307XHJcblxyXG5cclxuICAgICAgLypcclxuICAgICAgICogRXhhbXBsZTogZGF0YS1sb2FkPSd0ZXN0LmpzJ1xyXG4gICAgICAgKiAgICAgICAgICBkYXRhLWxvYWQ9J3Rlc3QuanM6a2V5J1xyXG4gICAgICAgKi9cclxuICAgICAgdGhpcy5wcm90b3R5cGUuX2xvYWREYXRhID0ge307XHJcbiAgICB9XHJcblxyXG4gICAgdG9TdHJpbmcoKSB7IHJldHVybiBgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9XyR7dGhpcy5fY291bnR9YDsgfVxyXG5cclxuICAgIG1hcERhdGFBdHRyTWV0aG9kcyhhdHRycykge1xyXG4gICAgICByZXR1cm4gXy5yZWR1Y2UoYXR0cnMsIGZ1bmN0aW9uKG1hcCwgdmFsdWUpIHtcclxuICAgICAgICBtYXBbYGRhdGEtJHt2YWx1ZX1gXSA9IGBkYXRhXyR7dmFsdWV9YDtcclxuICAgICAgICByZXR1cm4gbWFwO1xyXG4gICAgICB9XHJcbiAgICAgICwge30pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcclxuICAgICAgc3VwZXIoKTtcclxuICAgICAgdGhpcy5yZVJlbmRlciA9IHRoaXMucmVSZW5kZXIuYmluZCh0aGlzKTtcclxuICAgICAgX2NvdW50ICs9IDE7XHJcbiAgICAgIHRoaXMuX2NvdW50ID0gX2NvdW50O1xyXG4gICAgICBmb3IgKGxldCBrZXkgb2YgQXJyYXkuZnJvbSh0aGlzLnN1cHBvcnRlZEFyZ3MpKSB7IGlmIChvcHRzW2tleV0pIHsgdGhpc1trZXldID0gb3B0c1trZXldOyB9IH1cclxuICAgICAgaWYgKHRoaXMudGVtcGxhdGVFeHByIHx8IHRoaXMuaW5jbHVkZSkgeyB0aGlzLnVzZVRlbXBsYXRlID0gdHJ1ZTsgfVxyXG4gICAgICB0aGlzLnBhcnNlT3B0cyhvcHRzKTtcclxuICAgICAgaWYgKCF0aGlzLm5vZGUpIHsgcmguX2QoJ2Vycm9yJywgJ2NvbnN0cnVjdG9yJywgYCR7dGhpc30gZG9lcyBub3QgaGF2ZSBhIG5vZGVgKTsgfVxyXG4gICAgfVxyXG5cclxuICAgIGRlc3RydWN0KCkge1xyXG4gICAgICB0aGlzLnJlc2V0Q29udGVudCgpO1xyXG4gICAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9ucykgeyBmb3IgKGxldCB1bnN1YiBvZiBBcnJheS5mcm9tKHRoaXMuX3N1YnNjcmlwdGlvbnMpKSB7IHVuc3ViKCk7IH0gfVxyXG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gW107XHJcbiAgICAgIGRlbGV0ZSB0aGlzLm1vZGVsO1xyXG4gICAgICByZXR1cm4gZGVsZXRlIHRoaXMuY29udHJvbGxlcnM7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VPcHRzKG9wdHMpIHtcclxuICAgICAgdGhpcy5vcHRzID0gb3B0cztcclxuICAgICAgaWYgKG9wdHMuYXJnKSB7IHRoaXMua2V5ID0gb3B0cy5hcmc7IH1cclxuICAgICAgcmV0dXJuICh0aGlzLnBhcnNlUGlwZWRBcmcpKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcGFyc2VQaXBlZEFyZygpIHtcclxuICAgICAgbGV0IGFyZ3MgPSB0aGlzLm9wdHMucGlwZWRBcmdzO1xyXG4gICAgICBpZiAoYXJncyAhPSBudWxsID8gYXJncy5zaGlmdCA6IHVuZGVmaW5lZCkgeyAvL2ZpcnN0IHBpcGVkIGFyZ3VtZW50IGlzIGRlZmF1bHQgTW9kZWxcclxuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbEFyZ3MgPSBfLnJlc29sdmVOaWNlSlNPTihhcmdzLnNoaWZ0KCkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KGtleSkge1xyXG4gICAgICBpZiAodGhpcy5tb2RlbCA9PSBudWxsKSB7IHRoaXMubW9kZWwgPSBuZXcgcmguTW9kZWwoKTsgfVxyXG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5nZXQoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaXNoKGtleSwgdmFsdWUsIG9wdHMpIHtcclxuICAgICAgaWYgKHRoaXMubW9kZWwgPT0gbnVsbCkgeyB0aGlzLm1vZGVsID0gbmV3IHJoLk1vZGVsKCk7IH1cclxuICAgICAgcmV0dXJuIHRoaXMubW9kZWwucHVibGlzaChrZXksIHZhbHVlLCBvcHRzKTtcclxuICAgIH1cclxuXHJcbiAgICBzdWJzY3JpYmUoa2V5LCBmbiwgb3B0cykge1xyXG4gICAgICBpZiAoa2V5ID09IG51bGwpIHsgcmV0dXJuOyB9XHJcbiAgICAgIGlmICh0aGlzLm1vZGVsID09IG51bGwpIHsgdGhpcy5tb2RlbCA9IG5ldyByaC5Nb2RlbCgpOyB9XHJcbiAgICAgIGxldCB1bnN1YiA9IHRoaXMubW9kZWwuc3Vic2NyaWJlKGtleSwgZm4sIG9wdHMpO1xyXG4gICAgICBpZiAodGhpcy5tb2RlbC5pc0dsb2JhbCgpIHx8IHRoaXMubW9kZWwuaXNHbG9iYWwoa2V5KSkgeyB1bnN1YiA9IHRoaXMuc3RvcmVTdWJzY3JpYmUodW5zdWIpOyB9XHJcbiAgICAgIHJldHVybiB1bnN1YjtcclxuICAgIH1cclxuXHJcbiAgICBzdWJzY3JpYmVPbmx5KGtleSwgZm4sIG9wdHMpIHtcclxuICAgICAgaWYgKG9wdHMgPT0gbnVsbCkgeyBvcHRzID0ge307IH1cclxuICAgICAgb3B0c1snaW5pdERvbmUnXSA9IHRydWU7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZShrZXksIGZuLCBvcHRzKTtcclxuICAgIH1cclxuXHJcbiAgICBzdG9yZVN1YnNjcmliZSh1bnN1Yikge1xyXG4gICAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9ucyA9PSBudWxsKSB7IHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBbXTsgfVxyXG4gICAgICB2YXIgbmV3VW5zdWIgPSAoKSA9PiB7XHJcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5fc3Vic2NyaXB0aW9ucy5pbmRleE9mKG5ld1Vuc3ViKTtcclxuICAgICAgICBpZiAoKGluZGV4ICE9IG51bGwpICYmIChpbmRleCAhPT0gLTEpKSB7XHJcbiAgICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1bnN1YigpO1xyXG4gICAgICB9O1xyXG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnB1c2gobmV3VW5zdWIpO1xyXG4gICAgICByZXR1cm4gbmV3VW5zdWI7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIGRhdGEtaWY9XCJAc2lkZWJhcl9vcGVuIHwgc2NyZWVuOiBkZXNrdG9wXCJcclxuICAgICAqIGRhdGEtaWY9XCJAc2NyZWVuLmRlc2t0b3AuYXR0YWNoZWQgPT09IHRydWUgJiYgQHNpZGViYXJfb3BlblwiXHJcbiAgICAgKi9cclxuICAgIHBhdGNoU2NyZWVuT3B0aW9ucyhleHByLCBzY3JlZW4pIHtcclxuICAgICAgbGV0IG5hbWVzID0gXy5pc1N0cmluZyhzY3JlZW4pID8gW3NjcmVlbl0gIDogc2NyZWVuO1xyXG4gICAgICBsZXQgc2NyZWVuRXhwciA9IF8ubWFwKG5hbWVzLCBuYW1lID0+IGBAJHtjb25zdHMoJ0tFWV9TQ1JFRU4nKX0uJHtuYW1lfS5hdHRhY2hlZGApLmpvaW4oJyB8fCAnKTtcclxuICAgICAgaWYgKHNjcmVlbkV4cHIpIHtcclxuICAgICAgICByZXR1cm4gYCR7c2NyZWVuRXhwcn0gPyAoJHtleHByfSkgOiBudWxsYDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZXhwcjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHBhdGNoRGlyT3B0aW9ucyhleHByLCBkaXIpIHtcclxuICAgICAgcmV0dXJuIGBAJHtjb25zdHMoJ0tFWV9ESVInKX0gPT0gJyR7ZGlyfScgPyAoJHtleHByfSkgOiBudWxsYDtcclxuICAgIH1cclxuXHJcbiAgICBwYXRjaFJhd0V4cHJPcHRpb25zKGV4cHIsIG9wdHMpIHtcclxuICAgICAgaWYgKG9wdHMuc2NyZWVuKSB7IGV4cHIgPSB0aGlzLnBhdGNoU2NyZWVuT3B0aW9ucyhleHByLCBvcHRzLnNjcmVlbik7IH1cclxuICAgICAgaWYgKG9wdHMuZGlyICE9IG51bGwpIHsgZXhwciA9IHRoaXMucGF0Y2hEaXJPcHRpb25zKGV4cHIsIG9wdHMuZGlyKTsgfVxyXG4gICAgICByZXR1cm4gZXhwcjtcclxuICAgIH1cclxuXHJcbiAgICBwYXRjaFJhd0V4cHIoZXhwciwgb3B0cykge1xyXG4gICAgICBpZiAoZXhwciAmJiBfLmlzVmFsaWRNb2RlbEtleShleHByKSkgeyBleHByID0gYEAke2V4cHJ9YDsgfVxyXG4gICAgICBpZiAob3B0cykgeyBleHByID0gdGhpcy5wYXRjaFJhd0V4cHJPcHRpb25zKGV4cHIsIG9wdHMpOyB9XHJcbiAgICAgIHJldHVybiBleHByO1xyXG4gICAgfVxyXG5cclxuICAgIHN1YnNjcmliZUV4cHIocmF3RXhwciwgZm4sIHN1YnMsIG9wdHMpIHtcclxuICAgICAgaWYgKHJhd0V4cHIgPT0gbnVsbCkgeyByZXR1cm47IH1cclxuICAgICAgbGV0IHtjYWxsYmFjaywga2V5cywgZXhwT3B0c30gPSB0aGlzLnJlc29sdmVSYXdFeHByV2l0aFZhbHVlKHJhd0V4cHIpO1xyXG4gICAgICBsZXQgc3Vic0ZuID0gKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGNhbGxiYWNrLmNhbGwodGhpcyksIGV4cE9wdHMpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgZm9yIChsZXQga2V5IG9mIEFycmF5LmZyb20oa2V5cykpIHtcclxuICAgICAgICBsZXQgdW5zdWIgPSB0aGlzLnN1YnNjcmliZU9ubHkoa2V5LCBzdWJzRm4sIG9wdHMpO1xyXG4gICAgICAgIGlmIChzdWJzKSB7IHN1YnMucHVzaCh1bnN1Yik7IH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gc3Vic0ZuKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzZXRDb250ZW50KCkge1xyXG4gICAgICBpZiAodGhpcy5jaGlsZHJlbikgeyBmb3IgKGxldCBjaGlsZCBvZiBBcnJheS5mcm9tKHRoaXMuY2hpbGRyZW4pKSB7IGNoaWxkLmRlc3RydWN0KCk7IH0gfVxyXG4gICAgICBpZiAodGhpcy5odG1sU3VicykgeyBmb3IgKGxldCB1bnN1YiBvZiBBcnJheS5mcm9tKHRoaXMuaHRtbFN1YnMpKSB7IHVuc3ViKCk7IH0gfVxyXG4gICAgICB0aGlzLmNoaWxkcmVuID0gW107XHJcbiAgICAgIHJldHVybiB0aGlzLmh0bWxTdWJzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgYWRkQ2hpbGQoY2hpbGQpIHtcclxuICAgICAgaWYgKHRoaXMuY2hpbGRyZW4gPT0gbnVsbCkgeyB0aGlzLmNoaWxkcmVuID0gW107IH1cclxuICAgICAgcmV0dXJuIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcbiAgICB9XHJcblxyXG4gICAgbGlua01vZGVsKGZyb21Nb2RlbCwgZnJvbUtleSwgdG9Nb2RlbCwgdG9LZXksIG9wdHMpIHtcclxuICAgICAgaWYgKG9wdHMgPT0gbnVsbCkgeyBvcHRzID0ge307IH1cclxuICAgICAgbGV0IHBhcnRpYWwgPSAob3B0cy5wYXJ0aWFsICE9IG51bGwpID8gb3B0cy5wYXJ0aWFsIDogZmFsc2U7XHJcbiAgICAgIHJldHVybiB0aGlzLnN0b3JlU3Vic2NyaWJlKGZyb21Nb2RlbC5zdWJzY3JpYmUoZnJvbUtleSwgdmFsdWUgPT4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmd1YXJkKCgoKSA9PiB0b01vZGVsLnB1Ymxpc2godG9LZXksIHZhbHVlLCB7c3luYzogdHJ1ZX0pKSwgdGhpcy50b1N0cmluZygpKTtcclxuICAgICAgfVxyXG4gICAgICAsIHtwYXJ0aWFsfSlcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0KHBhcmVudCkge1xyXG4gICAgICBsZXQgaW5pdEV4cHI7XHJcbiAgICAgIGlmICh0aGlzLmluaXREb25lKSB7IHJldHVybjsgfVxyXG4gICAgICB0aGlzLmluaXREb25lID0gdHJ1ZTtcclxuICAgICAgdGhpcy5pbml0UGFyZW50KHBhcmVudCk7XHJcbiAgICAgICh0aGlzLmluaXRNb2RlbCkoKTtcclxuXHJcbiAgICAgIGlmIChpbml0RXhwciA9ICQuZGF0YXNldCh0aGlzLm5vZGUsICdpbml0JykpIHtcclxuICAgICAgICB0aGlzLmRhdGFfaW5pdCh0aGlzLm5vZGUsIGluaXRFeHByKTtcclxuICAgICAgICAkLmRhdGFzZXQodGhpcy5ub2RlLCAnaW5pdCcsIG51bGwpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnJlbmRlcigpO1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVPbmx5KHRoaXMub3B0cy5yZW5kZXJrZXksIHRoaXMucmVSZW5kZXIsIHtwYXJ0aWFsOiBmYWxzZX0pO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRQYXJlbnQocGFyZW50KSB7XHJcbiAgICAgIGlmIChwYXJlbnQpIHsgcGFyZW50LmFkZENoaWxkKHRoaXMpOyB9XHJcbiAgICAgIGxldCBwYXJlbnRNb2RlbCA9IChwYXJlbnQgIT0gbnVsbCA/IHBhcmVudC5tb2RlbCA6IHVuZGVmaW5lZCkgfHwgcmgubW9kZWw7XHJcbiAgICAgIGxldCBpbnB1dCA9IF9fZ3VhcmRfXygkLmRhdGFzZXQodGhpcy5ub2RlLCAnaW5wdXQnKSwgeCA9PiB4LnRyaW0oKSk7XHJcbiAgICAgIGxldCBvdXRwdXQgPSBfX2d1YXJkX18oJC5kYXRhc2V0KHRoaXMubm9kZSwgJ291dHB1dCcpLCB4MSA9PiB4MS50cmltKCkpO1xyXG5cclxuICAgICAgaWYgKChpbnB1dCA9PT0gJy4nKSB8fCAob3V0cHV0ID09PSAnLicpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwgPSBwYXJlbnRNb2RlbDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQga2V5cywgb3B0cztcclxuICAgICAgICBpZiAoaW5wdXQgfHwgb3V0cHV0IHx8IHRoaXMua2V5KSB7IGlmICh0aGlzLm1vZGVsID09IG51bGwpIHsgdGhpcy5tb2RlbCA9IG5ldyByaC5Nb2RlbCgpOyB9IH1cclxuICAgICAgICBpZiAoaW5wdXQpIHtcclxuICAgICAgICAgICh7a2V5cywgb3B0c30gPSBfLnJlc29sdmVJbnB1dEtleXMoaW5wdXQpKTtcclxuICAgICAgICAgIF8uZWFjaChrZXlzLCBmdW5jdGlvbihwYXJlbnRLZXksIGtleSkge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50S2V5ID09IG51bGwpIHsgcGFyZW50S2V5ID0ga2V5OyB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxpbmtNb2RlbChwYXJlbnRNb2RlbCwgcGFyZW50S2V5LCB0aGlzLm1vZGVsLCBrZXksIG9wdHMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLCB0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG91dHB1dCkge1xyXG4gICAgICAgICAgKHtrZXlzLCBvcHRzfSA9IF8ucmVzb2x2ZUlucHV0S2V5cyhvdXRwdXQpKTtcclxuICAgICAgICAgIHJldHVybiBfLmVhY2goa2V5cywgZnVuY3Rpb24ocGFyZW50S2V5LCBrZXkpIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudEtleSA9PSBudWxsKSB7IHBhcmVudEtleSA9IGtleTsgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5saW5rTW9kZWwodGhpcy5tb2RlbCwga2V5LCBwYXJlbnRNb2RlbCwgcGFyZW50S2V5LCBvcHRzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgICwgdGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdE1vZGVsKCkge1xyXG4gICAgICBpZiAodGhpcy5tb2RlbEFyZ3MpIHtcclxuICAgICAgICBfLmVhY2godGhpcy5tb2RlbEFyZ3MsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLnB1Ymxpc2goa2V5LCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICwgdGhpcyk7XHJcbiAgICAgICAgcmV0dXJuIGRlbGV0ZSB0aGlzLm1vZGVsQXJncztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluaXRVSSgpIHtcclxuICAgICAgaWYgKHJoLl9kZWJ1Zykge1xyXG4gICAgICAgIGxldCBsb2FkZWRXaWRnZXRzID0gJC5kYXRhc2V0KHRoaXMubm9kZSwgJ2xvYWRlZCcpO1xyXG4gICAgICAgIGlmIChsb2FkZWRXaWRnZXRzKSB7IGxvYWRlZFdpZGdldHMgPSBgJHtsb2FkZWRXaWRnZXRzfTske3RoaXN9YDsgfVxyXG4gICAgICAgICQuZGF0YXNldCh0aGlzLm5vZGUsICdsb2FkZWQnLCBsb2FkZWRXaWRnZXRzIHx8IHRoaXMpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgICQuZGF0YXNldCh0aGlzLm5vZGUsICdsb2FkZWQnLCB0cnVlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHRoaXMudGVtcGxhdGVFeHByKSB7ICh0aGlzLnN1YnNjcmliZVRlbXBsYXRlRXhwcikoKTsgfVxyXG4gICAgICBpZiAodGhpcy5pbmNsdWRlKSB7ICh0aGlzLnN1YnNjcmliZUluY2x1ZGVQYXRoKSgpOyB9XHJcbiAgICAgIGlmICh0aGlzLnRwbE5vZGUgPT0gbnVsbCkgeyB0aGlzLnRwbE5vZGUgPSB0aGlzLm5vZGU7IH1cclxuICAgICAgcmV0dXJuICh0aGlzLnJlc2V0Q29udGVudCkoKTtcclxuICAgIH1cclxuXHJcbiAgICBzdWJzY3JpYmVUZW1wbGF0ZUV4cHIoKSB7XHJcbiAgICAgIGxldCBjb25zdHJ1Y3RpbmcgPSB0cnVlO1xyXG4gICAgICB0aGlzLnN1YnNjcmliZUV4cHIodGhpcy50ZW1wbGF0ZUV4cHIsIGZ1bmN0aW9uKHRlbXBsYXRlKSB7XHJcbiAgICAgICAgdGhpcy50cGxOb2RlID0gJC5jcmVhdGVFbGVtZW50KCdkaXYnLCB0ZW1wbGF0ZSkuZmlyc3RDaGlsZDtcclxuICAgICAgICBpZiAoIWNvbnN0cnVjdGluZykgeyByZXR1cm4gdGhpcy5yZVJlbmRlcih0cnVlKTsgfVxyXG4gICAgICB9KTtcclxuICAgICAgY29uc3RydWN0aW5nID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlRXhwciA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBzdWJzY3JpYmVJbmNsdWRlUGF0aCgpIHtcclxuICAgICAgXy5yZXF1aXJlKHRoaXMuaW5jbHVkZSwgdGVtcGxhdGUgPT4gdGhpcy5zZXRUZW1wbGF0ZSh0ZW1wbGF0ZSkpO1xyXG4gICAgICByZXR1cm4gdGhpcy5pbmNsdWRlID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRlbXBsYXRlKHRlbXBsYXRlKSB7XHJcbiAgICAgIHRoaXMudXNlVGVtcGxhdGUgPSB0cnVlO1xyXG4gICAgICB0aGlzLnRwbE5vZGUgPSAkLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHRlbXBsYXRlKS5maXJzdENoaWxkO1xyXG4gICAgICByZXR1cm4gdGhpcy5yZVJlbmRlcih0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICByZVJlbmRlcihyZW5kZXIpIHsgaWYgKChyZW5kZXIgIT0gbnVsbCkgJiYgdGhpcy50cGxOb2RlKSB7IHJldHVybiB0aGlzLnJlbmRlcigpOyB9IH1cclxuXHJcbiAgICBwcmVSZW5kZXIoKSB7XHJcbiAgICAgIGxldCBvbGROb2RlO1xyXG4gICAgICBpZiAodGhpcy51c2VUZW1wbGF0ZSkge1xyXG4gICAgICAgIG9sZE5vZGUgPSB0aGlzLm5vZGU7XHJcbiAgICAgICAgdGhpcy5ub2RlID0gdGhpcy50cGxOb2RlLmNsb25lTm9kZSh0cnVlKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gb2xkTm9kZTtcclxuICAgIH1cclxuXHJcbiAgICBwb3N0UmVuZGVyKG9sZE5vZGUpIHtcclxuICAgICAgaWYgKG9sZE5vZGUgJiYgb2xkTm9kZS5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIG9sZE5vZGUucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQodGhpcy5ub2RlLCBvbGROb2RlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFsdGVyTm9kZUNvbnRlbnQoKSB7fVxyXG5cclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgaWYgKHJoLl90ZXN0KSB7IHJoLm1vZGVsLnB1Ymxpc2goYHRlc3QuJHt0aGlzfS5yZW5kZXIuYmVnaW5gLCBfLnRpbWUoKSk7IH1cclxuICAgICAgdGhpcy5pbml0VUkoKTtcclxuICAgICAgbGV0IG9sZE5vZGUgPSB0aGlzLnByZVJlbmRlcigpO1xyXG4gICAgICB0aGlzLm5vZGVIb2xkZXIgPSBuZXcgcmguTm9kZUhvbGRlcihbdGhpcy5ub2RlXSk7XHJcbiAgICAgICh0aGlzLmFsdGVyTm9kZUNvbnRlbnQpKCk7XHJcbiAgICAgIHRoaXMucmVzb2x2ZURhdGFBdHRycyh0aGlzLm5vZGUpO1xyXG4gICAgICBfLmxvYWREYXRhSGFuZGxlcnModGhpcy5ub2RlLCB0aGlzKTtcclxuICAgICAgdGhpcy5wb3N0UmVuZGVyKG9sZE5vZGUpO1xyXG4gICAgICBpZiAocmguX3Rlc3QpIHsgcmV0dXJuIHJoLm1vZGVsLnB1Ymxpc2goYHRlc3QuJHt0aGlzfS5yZW5kZXIuZW5kYCwgXy50aW1lKCkpOyB9XHJcbiAgICB9XHJcblxyXG4gICAgaXNWaXNpYmxlKCkgeyByZXR1cm4gdGhpcy5ub2RlSG9sZGVyLmlzVmlzaWJsZSgpOyB9XHJcblxyXG4gICAgc2hvdygpIHsgcmV0dXJuIHRoaXMubm9kZUhvbGRlci5zaG93KCk7IH1cclxuXHJcbiAgICBoaWRlKCkgeyByZXR1cm4gdGhpcy5ub2RlSG9sZGVyLmhpZGUoKTsgfVxyXG5cclxuICAgIHRvZ2dsZSgpIHsgaWYgKHRoaXMuaXNWaXNpYmxlKCkpIHsgcmV0dXJuIHRoaXMuaGlkZSgpOyB9IGVsc2UgeyByZXR1cm4gdGhpcy5zaG93KCk7IH0gfVxyXG5cclxuICAgIGlzV2lkZ2V0Tm9kZShub2RlKSB7IHJldHVybiAkLmRhdGFzZXQobm9kZSwgJ3Jod2lkZ2V0Jyk7IH1cclxuXHJcbiAgICBpc0Rlc2NlbmRlbnQobm9kZSkge1xyXG4gICAgICBsZXQgbmVzdGVkV2lkZ2V0O1xyXG4gICAgICBsZXQgY2hpbGQgPSBub2RlO1xyXG4gICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgIGxldCBwYXJlbnQgPSBjaGlsZC5wYXJlbnROb2RlO1xyXG4gICAgICAgIGlmICghcGFyZW50KSB7IGJyZWFrOyB9XHJcbiAgICAgICAgaWYgKHRoaXMuaXNXaWRnZXROb2RlKGNoaWxkKSkge1xyXG4gICAgICAgICAgbmVzdGVkV2lkZ2V0ID0gcGFyZW50O1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm5vZGUgPT09IHBhcmVudCkgeyBicmVhazsgfVxyXG4gICAgICAgIGNoaWxkID0gcGFyZW50O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiAobmVzdGVkV2lkZ2V0ICE9IG51bGwpO1xyXG4gICAgfVxyXG5cclxuICAgIGVhY2hDaGlsZChzZWxlY3RvciwgZm4pIHtcclxuICAgICAgcmV0dXJuICQuZWFjaENoaWxkKHRoaXMubm9kZSwgc2VsZWN0b3IsIGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNEZXNjZW5kZW50KG5vZGUpKSB7IHJldHVybiBmbi5jYWxsKHRoaXMsIG5vZGUpOyB9XHJcbiAgICAgIH1cclxuICAgICAgLCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBlYWNoRGF0YU5vZGUoZGF0YUF0dHIsIGZuKSB7XHJcbiAgICAgIHJldHVybiAkLmVhY2hEYXRhTm9kZSh0aGlzLm5vZGUsIGRhdGFBdHRyLCBmdW5jdGlvbihub2RlLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmICghdGhpcy5pc0Rlc2NlbmRlbnQobm9kZSkpIHsgcmV0dXJuIGZuLmNhbGwodGhpcywgbm9kZSwgdmFsdWUpOyB9XHJcbiAgICAgIH1cclxuICAgICAgLCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICB0cmF2ZXJzZU5vZGUobm9kZSwgcHJlLCBwb3N0KSB7XHJcbiAgICAgIHJldHVybiAkLnRyYXZlcnNlTm9kZShub2RlLCBwcmUsIHBvc3QsIGZ1bmN0aW9uKGNoaWxkKSB7XHJcbiAgICAgICAgcmV0dXJuICF0aGlzLmlzRGVzY2VuZGVudChjaGlsZCk7XHJcbiAgICAgIH1cclxuICAgICAgLCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICByZXNvbHZlRGF0YUF0dHJzKHBub2RlKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnRyYXZlcnNlTm9kZShwbm9kZSwgZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIGxldCByZXBlYXRWYWw7XHJcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcocmVwZWF0VmFsID0gJC5kYXRhc2V0KG5vZGUsICdyZXBlYXQnKSkpIHtcclxuICAgICAgICAgIHRoaXMuZGF0YV9yZXBlYXQobm9kZSwgcmVwZWF0VmFsKTtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgJC5lYWNoQXR0cmlidXRlcyhub2RlLCBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBsZXQgZm5OYW1lID0gdGhpcy5kYXRhQXR0ck1ldGhvZHNbbmFtZV07XHJcbiAgICAgICAgICAgIGlmIChmbk5hbWUgJiYgdmFsdWUpIHsgcmV0dXJuIHRoaXNbZm5OYW1lXS5jYWxsKHRoaXMsIG5vZGUsIHZhbHVlKTsgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLCB0aGlzKTtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzb2x2ZVJlcGVhdEV4cHIocmF3RXhwcikge1xyXG4gICAgICBsZXQgdmFsdWVzID0gXy5yZXNvbHZlUGlwZWRFeHByZXNzaW9uKHJhd0V4cHIpO1xyXG4gICAgICBsZXQgb3B0cyA9IHZhbHVlc1sxXSAmJiBfLnJlc29sdmVOaWNlSlNPTih2YWx1ZXNbMV0pO1xyXG4gICAgICBsZXQgZGF0YSA9IF8ucmVzb2x2ZUxvb3BFeHByKHZhbHVlc1swXSk7XHJcbiAgICAgIGlmIChvcHRzICE9IG51bGwgPyBvcHRzLmZpbHRlciA6IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGRhdGFbJ2ZpbHRlciddID0gdGhpcy5fZXZhbEZ1bmN0aW9uKCdpdGVtLCBpbmRleCcsIG9wdHMuZmlsdGVyKTtcclxuICAgICAgfVxyXG4gICAgICBkYXRhWydzdGVwJ10gPSAob3B0cyAhPSBudWxsID8gb3B0cy5zdGVwIDogdW5kZWZpbmVkKSB8fCAxO1xyXG4gICAgICByZXR1cm4gZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogdmFyTmFtZTogRXg6ICN7QGRhdGEudGl0bGV9IG1lYW5zIGl0ZW0uZGF0YS50aXRsZVxyXG4gICAgICovXHJcbiAgICByZXNvbHZlUmVwZWF0VmFyKGV4cHIsIGl0ZW0sIGluZGV4LCBjYWNoZSwgbm9kZSkge1xyXG4gICAgICByZXR1cm4gY2FjaGVbZXhwcl0gPSBjYWNoZVtleHByXSB8fCAoKCkgPT4geyBzd2l0Y2ggKGV4cHIpIHtcclxuICAgICAgICBjYXNlICdAaW5kZXgnOiByZXR1cm4gaW5kZXg7XHJcbiAgICAgICAgY2FzZSAnQHNpemUnOiByZXR1cm4gaXRlbS5sZW5ndGg7XHJcbiAgICAgICAgY2FzZSAndGhpcyc6IHJldHVybiBpdGVtO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBpZiAoXy5pc1ZhbGlkTW9kZWxLZXkoZXhwcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIF8uZ2V0KGl0ZW0sIGV4cHIpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlSURhdGFFeHByKG5vZGUsIGV4cHIsIGl0ZW0sIGluZGV4KTtcclxuICAgICAgICAgIH1cclxuICAgICAgfSB9KSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc29sdmVFbmNsb3NlZFZhcih2YWx1ZSwgaXRlbSwgaW5kZXgsIGl0ZW1DYWNoZSwgbm9kZSkge1xyXG4gICAgICByZXR1cm4gXy5yZXNvbHZlRW5jbG9zZWRWYXIodmFsdWUsIGZ1bmN0aW9uKHZhck5hbWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlUmVwZWF0VmFyKHZhck5hbWUsIGl0ZW0sIGluZGV4LCBpdGVtQ2FjaGUsIG5vZGUpO1xyXG4gICAgICB9XHJcbiAgICAgICwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlRW5jbG9zZVZhcihuYW1lLCB2YWx1ZSwgaXRlbSwgaW5kZXgsIGl0ZW1DYWNoZSwgbm9kZSkge1xyXG4gICAgICBsZXQgbmV3VmFsdWUgPSB0aGlzLnJlc29sdmVFbmNsb3NlZFZhcih2YWx1ZSwgaXRlbSwgaW5kZXgsIGl0ZW1DYWNoZSwgbm9kZSk7XHJcbiAgICAgIGlmIChuZXdWYWx1ZSA9PT0gJycpIHtcclxuICAgICAgICAkLnJlbW92ZUF0dHJpYnV0ZShub2RlLCBuYW1lKTtcclxuICAgICAgfSBlbHNlIGlmIChuZXdWYWx1ZSAhPT0gdmFsdWUpIHtcclxuICAgICAgICAkLnNldEF0dHJpYnV0ZShub2RlLCBuYW1lLCBuZXdWYWx1ZSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG5ld1ZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZVdpZGdldEVuY2xvc2VWYXIoaXRlbSwgaW5kZXgsIGl0ZW1DYWNoZSwgbm9kZSkge1xyXG4gICAgICByZXR1cm4gXy5lYWNoKFsncmh3aWRnZXQnLCAnaW5wdXQnLCAnb3V0cHV0JywgJ2luaXQnXSwgZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIGxldCB2YWx1ZTtcclxuICAgICAgICBpZiAodmFsdWUgPSAkLmRhdGFzZXQobm9kZSwgbmFtZSkpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUVuY2xvc2VWYXIoYGRhdGEtJHtuYW1lfWAsIHZhbHVlLCBpdGVtLCBpbmRleCwgaXRlbUNhY2hlLCBub2RlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgLCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBpc1JlcGVhdChub2RlKSB7XHJcbiAgICAgIHJldHVybiAkLmRhdGFzZXQobm9kZSwgJ3JlcGVhdCcpIHx8ICQuZGF0YXNldChub2RlLCAnaXJlcGVhdCcpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc29sdmVOZXN0ZWRSZXBlYXQobm9kZSwgaXRlbSwgaW5kZXgsIGl0ZW1DYWNoZSkge1xyXG4gICAgICByZXR1cm4gXy5lYWNoKFsncmVwZWF0JywgJ2lyZXBlYXQnXSwgZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICAgIGxldCB2YWx1ZTtcclxuICAgICAgICBpZiAodmFsdWUgPSAkLmRhdGFzZXQobm9kZSwgbmFtZSkpIHtcclxuICAgICAgICAgIHZhbHVlID0gdGhpcy51cGRhdGVFbmNsb3NlVmFyKGBkYXRhLSR7bmFtZX1gLCB2YWx1ZSxcclxuICAgICAgICAgICAgaXRlbSwgaW5kZXgsIGl0ZW1DYWNoZSwgbm9kZSk7XHJcbiAgICAgICAgICBpZiAodmFsdWUgIT09ICcnKSB7IHJldHVybiAodHlwZW9mIHRoaXNbYGRhdGFfJHtuYW1lfWBdID09PSAnZnVuY3Rpb24nID8gdGhpc1tgZGF0YV8ke25hbWV9YF0obm9kZSwgdmFsdWUsIGl0ZW0sIGluZGV4KSA6IHVuZGVmaW5lZCk7IH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgLCB0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICByZXNvbHZlSXRlbUluZGV4KHBub2RlLCBpdGVtLCBpbmRleCkge1xyXG4gICAgICBpZiAoIXBub2RlLmNoaWxkcmVuKSB7IHJldHVybjsgfVxyXG4gICAgICBsZXQgaXRlbUNhY2hlID0ge307XHJcbiAgICAgIHJldHVybiAkLnRyYXZlcnNlTm9kZShwbm9kZSwgbm9kZSA9PiB7XHJcbiAgICAgICAgaWYgKChub2RlICE9PSBwbm9kZSkgJiYgJC5kYXRhc2V0KG5vZGUsICdyaHdpZGdldCcpKSB7XHJcbiAgICAgICAgICB0aGlzLnVwZGF0ZVdpZGdldEVuY2xvc2VWYXIoaXRlbSwgaW5kZXgsIGl0ZW1DYWNoZSwgbm9kZSk7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5pc1JlcGVhdChub2RlKSkge1xyXG4gICAgICAgICAgdGhpcy5yZXNvbHZlTmVzdGVkUmVwZWF0KG5vZGUsIGl0ZW0sIGluZGV4LCBpdGVtQ2FjaGUpO1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJC5lYWNoQXR0cmlidXRlcyhub2RlLCBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgYXR0cnNJbmZvKSB7XHJcbiAgICAgICAgICBpZiAoXy5pc1N0cmluZyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgbGV0IGZuTmFtZTtcclxuICAgICAgICAgICAgaWYgKDAgPT09IG5hbWUuc2VhcmNoKCdkYXRhLScpKSB7XHJcbiAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzLnVwZGF0ZUVuY2xvc2VWYXIobmFtZSwgdmFsdWUsXHJcbiAgICAgICAgICAgICAgICBpdGVtLCBpbmRleCwgaXRlbUNhY2hlLCBub2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICcnKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGZuTmFtZSA9IHRoaXMuZGF0YUlBdHRyTWV0aG9kc1tuYW1lXSkge1xyXG4gICAgICAgICAgICAgIGlmICh0aGlzW2ZuTmFtZV0uY2FsbCh0aGlzLCBub2RlLCB2YWx1ZSwgaXRlbSwgaW5kZXgsIGF0dHJzSW5mbykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAkLnJlbW92ZUF0dHJpYnV0ZShub2RlLCBuYW1lKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoMCA9PT0gbmFtZS5zZWFyY2goJ2RhdGEtaS0nKSkge1xyXG4gICAgICAgICAgICAgIHRoaXMuZGF0YV9pSGFuZGxlcihub2RlLCB2YWx1ZSwgaXRlbSwgaW5kZXgsIG5hbWUuc3Vic3RyaW5nKDcpKTtcclxuICAgICAgICAgICAgICByZXR1cm4gJC5yZW1vdmVBdHRyaWJ1dGUobm9kZSwgbmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLCB0aGlzKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ3VhcmQoZm4sIGd1YXJkTmFtZSkge1xyXG4gICAgICBpZiAoZ3VhcmROYW1lID09IG51bGwpIHsgZ3VhcmROYW1lID0gJ3VpJzsgfVxyXG4gICAgICByZXR1cm4gc3VwZXIuZ3VhcmQoZm4sIGd1YXJkTmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZGF0YV9yZXBlYXQobm9kZSwgcmF3RXhwcikge1xyXG4gICAgICAkLmRhdGFzZXQobm9kZSwgJ3JlcGVhdCcsIG51bGwpO1xyXG4gICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1yZXBlYXQnKTtcclxuICAgICAgbGV0IG9wdHMgPSB0aGlzLnJlc29sdmVSZXBlYXRFeHByKHJhd0V4cHIpO1xyXG5cclxuICAgICAgbGV0IG5vZGVIb2xkZXIgPSBuZXcgcmguTm9kZUhvbGRlcihbbm9kZV0pO1xyXG4gICAgICB0aGlzLnN1YnNjcmliZURhdGFFeHByKG9wdHMuZXhwciwgcmVzdWx0ID0+IHtcclxuICAgICAgICAvL1RPRE8gdXN1YiBvbGQgc3VicyB1c2luZyBzdGFjayBvZiBodG1sIHN1YnNcclxuICAgICAgICByZXR1cm4gdGhpcy5fcmVwZWF0Tm9kZXMobm9kZUhvbGRlciwgcmVzdWx0LCBvcHRzLCBub2RlKTtcclxuICAgICAgfVxyXG4gICAgICAsIHtwYXJ0aWFsOiBmYWxzZX0pO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvL2lmIHN0YXRlbWVudCBmb3IgZGF0YS1yZXBlYXQgbGlrZSBzdHJ1Y3R1cmVcclxuICAgIHJlc29sdmVfcmlmKG5vZGUsIGl0ZW0sIGluZGV4KSB7XHJcbiAgICAgIGxldCBjYWxsYmFjaywgY2xvbmVOb2RlLCByYXdFeHByO1xyXG4gICAgICBpZiAocmF3RXhwciA9ICQuZGF0YXNldChub2RlLCAncmlmJykpIHtcclxuICAgICAgICBjYWxsYmFjayA9IHRoaXMuX2V2YWxGdW5jdGlvbignaXRlbSwgaW5kZXgnLCByYXdFeHByKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKCFjYWxsYmFjayB8fCBjYWxsYmFjay5jYWxsKHRoaXMsIGl0ZW0sIGluZGV4KSkge1xyXG4gICAgICAgIGNsb25lTm9kZSA9IG5vZGUuY2xvbmVOb2RlKGZhbHNlKTtcclxuICAgICAgICAkLmRhdGFzZXQoY2xvbmVOb2RlLCAncmlmJywgbnVsbCk7XHJcbiAgICAgICAgZm9yIChsZXQgY2hpbGQgb2YgQXJyYXkuZnJvbShub2RlLmNoaWxkTm9kZXMpKSB7XHJcbiAgICAgICAgICBsZXQgY2xvbmVDaGlsZCA9IHRoaXMucmVzb2x2ZV9yaWYoY2hpbGQsIGl0ZW0sIGluZGV4KTtcclxuICAgICAgICAgIGlmIChjbG9uZUNoaWxkKSB7IGNsb25lTm9kZS5hcHBlbmRDaGlsZChjbG9uZUNoaWxkKTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gY2xvbmVOb2RlO1xyXG4gICAgfVxyXG5cclxuICAgIF9mdW5jdGlvbihhcmcsIGV4cHIsIGtleXMpIHtcclxuICAgICAgbGV0IGRhdGEgPSB0aGlzLnJlc29sdmVFeHByZXNzaW9uKGV4cHIpO1xyXG4gICAgICBpZiAoa2V5cykgeyBmb3IgKGxldCBrZXkgb2YgQXJyYXkuZnJvbShkYXRhLmtleXMpKSB7IGtleXMucHVzaChrZXkpOyB9IH1cclxuICAgICAgcmV0dXJuIHRoaXMuX3NhZmVGdW5jdGlvbihhcmcsIGRhdGEuZXhwcik7XHJcbiAgICB9XHJcblxyXG4gICAgX2V2YWxGdW5jdGlvbihhcmcsIGV4cHIsIGtleXMpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2Z1bmN0aW9uKGFyZywgYHJldHVybiAke2V4cHJ9O2AsIGtleXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIyMjIyMjIyMjIyBsaXN0IG9yIHJlcGVhdCBpdGVtcyBkYXRhIGF0dHJpYnV0ZXMgaGFuZGxpbmcgIyMjIyMjIyMjIyMjXHJcbiAgICBfc2V0TG9vcFZhcihvcHRzLCBpdGVtLCBpbmRleCkge1xyXG4gICAgICBsZXQgb2xkVmFsdWUgPSB7fTtcclxuICAgICAgaWYgKG9wdHMuaXRlbSkge1xyXG4gICAgICAgIG9sZFZhbHVlWydpdGVtJ10gPSB0aGlzLnVzZXJfdmFyc1tvcHRzLml0ZW1dO1xyXG4gICAgICAgIHRoaXMudXNlcl92YXJzW29wdHMuaXRlbV0gPSBpdGVtO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChvcHRzLmluZGV4KSB7XHJcbiAgICAgICAgb2xkVmFsdWVbJ2luZGV4J10gPSB0aGlzLnVzZXJfdmFyc1tvcHRzLmluZGV4XTtcclxuICAgICAgICB0aGlzLnVzZXJfdmFyc1tvcHRzLmluZGV4XSA9IGluZGV4O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBvbGRWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBfcmVwZWF0Tm9kZXMobm9kZUhvbGRlciwgcmVzdWx0LCBvcHRzLCB0bXBsTm9kZSkge1xyXG4gICAgICBsZXQgY2xvbmVOb2RlO1xyXG4gICAgICBpZiAocmVzdWx0ID09IG51bGwpIHsgcmVzdWx0ID0gW107IH1cclxuICAgICAgaWYgKHRoaXMudXNlcl92YXJzID09IG51bGwpIHsgdGhpcy51c2VyX3ZhcnMgPSB7fTsgfVxyXG4gICAgICBsZXQgbmV3Tm9kZXMgPSBbXTtcclxuICAgICAgbGV0IHtmaWx0ZXIsIHN0ZXB9ID0gb3B0cztcclxuICAgICAgZm9yIChsZXQgc3RlcDEgPSBzdGVwLCBhc2MgPSBzdGVwMSA+IDAsIGluZGV4ID0gYXNjID8gMCA6IHJlc3VsdC5sZW5ndGggLSAxOyBhc2MgPyBpbmRleCA8IHJlc3VsdC5sZW5ndGggOiBpbmRleCA+PSAwOyBpbmRleCArPSBzdGVwMSkge1xyXG4gICAgICAgIGxldCBpdGVtID0gcmVzdWx0W2luZGV4XTtcclxuICAgICAgICBsZXQgb2xkVmFsdWUgPSB0aGlzLl9zZXRMb29wVmFyKG9wdHMsIGl0ZW0sIGluZGV4KTtcclxuICAgICAgICBpZiAoIWZpbHRlciB8fCBmaWx0ZXIuY2FsbCh0aGlzLCBpdGVtLCBpbmRleCkpIHtcclxuICAgICAgICAgIGlmIChjbG9uZU5vZGUgPSB0aGlzLnJlc29sdmVfcmlmKHRtcGxOb2RlLCBpdGVtLCBpbmRleCkpIHtcclxuICAgICAgICAgICAgbmV3Tm9kZXMucHVzaChjbG9uZU5vZGUpO1xyXG4gICAgICAgICAgICB0aGlzLnJlc29sdmVJdGVtSW5kZXgoY2xvbmVOb2RlLCBpdGVtLCBpbmRleCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZURhdGFBdHRycyhjbG9uZU5vZGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9zZXRMb29wVmFyKG9wdHMsIG9sZFZhbHVlLml0ZW0sIG9sZFZhbHVlLmluZGV4KTtcclxuICAgICAgfVxyXG5cclxuXHJcbiAgICAgIGlmIChuZXdOb2Rlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBsZXQgdGVtcE5vZGUgPSB0bXBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xyXG4gICAgICAgICQuYWRkQ2xhc3ModGVtcE5vZGUsICdyaC1oaWRlJyk7XHJcbiAgICAgICAgbmV3Tm9kZXMucHVzaCh0ZW1wTm9kZSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBub2RlSG9sZGVyLnVwZGF0ZU5vZGVzKG5ld05vZGVzKTtcclxuICAgIH1cclxuXHJcbiAgICBkYXRhX2lyZXBlYXQobm9kZSwgcmF3RXhwciwgaXRlbSwgaW5kZXgsIGF0dHJzSW5mbykge1xyXG4gICAgICAkLmRhdGFzZXQobm9kZSwgJ2lyZXBlYXQnLCBudWxsKTtcclxuICAgICAgbGV0IG9wdHMgPSB0aGlzLnJlc29sdmVSZXBlYXRFeHByKHJhd0V4cHIpO1xyXG4gICAgICBsZXQgbm9kZUhvbGRlciA9IG5ldyByaC5Ob2RlSG9sZGVyKFtub2RlXSk7XHJcbiAgICAgIGxldCByZXN1bHQgPSB0aGlzLnN1YnNjcmliZUlEYXRhRXhwcihub2RlLCBvcHRzLmV4cHIsIGl0ZW0sIGluZGV4KTtcclxuICAgICAgdGhpcy5fcmVwZWF0Tm9kZXMobm9kZUhvbGRlciwgcmVzdWx0LCBvcHRzLCBub2RlKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIGhlbHBlciBtZXRob2QgZm9yIHIocmVwZWF0KSBhdHRyaWJ1dGVzXHJcbiAgICAgKi9cclxuICAgIHN1YnNjcmliZUlEYXRhRXhwcihub2RlLCByYXdFeHByLCBpdGVtLCBpbmRleCwgYXR0cnNJbmZvKSB7XHJcbiAgICAgIGxldCBleHByRm4gPSB0aGlzLl9ldmFsRnVuY3Rpb24oJ2l0ZW0sIGluZGV4LCBub2RlJywgcmF3RXhwcik7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIGV4cHJGbi5jYWxsKHRoaXMsIGl0ZW0sIGluZGV4LCBub2RlKTtcclxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBpZiAocmguX2RlYnVnKSB7IHJldHVybiByaC5fZCgnZXJyb3InLCBgaUV4cHJlc3Npb246ICR7cmF3RXhwcn1gLCBlcnJvci5tZXNzYWdlKTsgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIGdldCB0aGUga2V5IHZhbHVlIGFuZCBmaWxscyBpdHMgdmFsdWUgYXMgdGV4dCBjb250ZW50XHJcbiAgICAgKiBFeGFtcGxlOiA8YSBkYXRhLWl0ZXh0PVwiaXRlbS50aXRsZVwiPnRlbXAgdmFsdWU8L2E+XHJcbiAgICAgKiAgICAgICAgICA8ZGl2IGRhdGEtaXRleHQ9XCJAa2V5XCI+dGVtcCB2YWx1ZTwvZGl2PlxyXG4gICAgICovXHJcbiAgICBkYXRhX2l0ZXh0KG5vZGUsIHJhd0V4cHIsIGl0ZW0sIGluZGV4LCBhdHRyc0luZm8pIHtcclxuICAgICAgJC50ZXh0Q29udGVudChub2RlLCB0aGlzLnN1YnNjcmliZUlEYXRhRXhwcihub2RlLCByYXdFeHByLCBpdGVtLCBpbmRleCkpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogZ2V0IHRoZSBrZXkgdmFsdWUgYW5kIGZpbGxzIGl0cyB2YWx1ZSBhcyBIVE1MIGNvbnRlbnRcclxuICAgICAqIEV4YW1wbGU6IDxhIGRhdGEtaWh0bWw9XCJpdGVtLmRhdGFcIj50ZW1wIHZhbHVlPC9hPlxyXG4gICAgICogICAgICAgICAgPGRpdiBkYXRhLWlodG1sPVwiQGtleVwiPnRlbXAgdmFsdWU8L2Rpdj5cclxuICAgICAqL1xyXG4gICAgZGF0YV9paHRtbChub2RlLCByYXdFeHByLCBpdGVtLCBpbmRleCwgYXR0cnNJbmZvKSB7XHJcbiAgICAgIG5vZGUuaW5uZXJIVE1MID0gdGhpcy5zdWJzY3JpYmVJRGF0YUV4cHIobm9kZSwgcmF3RXhwciwgaXRlbSwgaW5kZXgpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogZ2V0IHRoZSBrZXkgdmFsdWUgYW5kIGZpbGxzIGl0cyB2YWx1ZSBhcyB0ZXh0IGNvbnRlbnRcclxuICAgICAqIEV4YW1wbGU6IDxhIGRhdGEtaWNsYXNzPVwiaXRlbS5kYXRhPydlbmFibGVkJzonZGlzYWJsZWQnXCI+dGVtcCB2YWx1ZTwvYT5cclxuICAgICAqICAgICAgICAgIDxkaXYgZGF0YS1pY2xhc3M9XCJAa2V5XCI+dGVtcCB2YWx1ZTwvZGl2PlxyXG4gICAgICovXHJcbiAgICBkYXRhX2ljbGFzcyhub2RlLCByYXdFeHByLCBpdGVtLCBpbmRleCwgYXR0cnNJbmZvKSB7XHJcbiAgICAgIGxldCBjbGFzc05hbWUgPSB0aGlzLnN1YnNjcmliZUlEYXRhRXhwcihub2RlLCByYXdFeHByLCBpdGVtLCBpbmRleCk7XHJcbiAgICAgIGlmIChjbGFzc05hbWUpIHsgJC5hZGRDbGFzcyhub2RlLCBjbGFzc05hbWUpOyB9XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBnZXQgdGhlIGtleSB2YWx1ZSBhbmQgZmlsbHMgaXRzIHZhbHVlIGFzIHRleHQgY29udGVudFxyXG4gICAgICogRXhhbXBsZTogPGEgZGF0YS1paHJlZj1cIml0ZW0udXJsXCI+dGVtcCB2YWx1ZTwvYT5cclxuICAgICAqICAgICAgICAgIDxkaXYgZGF0YS1paWQ9XCJpdGVtLmlkXCI+dGVtcCB2YWx1ZTwvZGl2PlxyXG4gICAgICovXHJcbiAgICBkYXRhX2lIYW5kbGVyKG5vZGUsIHJhd0V4cHIsIGl0ZW0sIGluZGV4LCBhdHRyTmFtZSkge1xyXG4gICAgICBsZXQgYXR0clZhbHVlID0gdGhpcy5zdWJzY3JpYmVJRGF0YUV4cHIobm9kZSwgcmF3RXhwciwgaXRlbSwgaW5kZXgpO1xyXG4gICAgICBpZiAoYXR0clZhbHVlKSB7ICQuc2V0QXR0cmlidXRlKG5vZGUsIGF0dHJOYW1lLCBhdHRyVmFsdWUpOyB9XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIyMjIyMjIyMjIyMjIyMjIyBTdGF0aWMgZGF0YSBhdHRyaWJ1dGVzIGhhbmRsaW5nICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXHJcbiAgICAvKiBnZXQgdGhlIGtleSB2YWx1ZSBhdCB0aGUgdGltZSBvZiByZW5kZXJpbmdcclxuICAgICAqIGFuZCBmaWxscyBpdHMgdmFsdWUgYXMgaHRtbCBjb250ZW50XHJcbiAgICAgKiBFeGFtcGxlOiA8YSBkYXRhLXNodG1sPVwia2V5XCI+dGVtcCB2YWx1ZTwvYT5cclxuICAgICAqICAgICAgICAgIDxkaXYgZGF0YS1zaHRtbD1cImtleVwiPnRlbXAgdmFsdWU8L2Rpdj5cclxuICAgICAqL1xyXG4gICAgZGF0YV9zaHRtbChub2RlLCBrZXkpIHtcclxuICAgICAgJC5yZW1vdmVBdHRyaWJ1dGUobm9kZSwgJ2RhdGEtc2h0bWwnKTtcclxuICAgICAgcmV0dXJuIG5vZGUuaW5uZXJIVE1MID0gdGhpcy5nZXQoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogZ2V0IHRoZSBrZXkgdmFsdWUgYW5kIGZpbGxzIGl0cyB2YWx1ZSBhcyB0ZXh0IGNvbnRlbnRcclxuICAgICAqIEV4YW1wbGU6IDxhIGRhdGEtc3RleHQ9XCJrZXlcIj50ZW1wIHZhbHVlPC9hPlxyXG4gICAgICogICAgICAgICAgPGRpdiBkYXRhLXN0ZXh0PVwia2V5XCI+dGVtcCB2YWx1ZTwvZGl2PlxyXG4gICAgICovXHJcbiAgICBkYXRhX3N0ZXh0KG5vZGUsIGtleSkge1xyXG4gICAgICAkLnJlbW92ZUF0dHJpYnV0ZShub2RlLCAnZGF0YS1zdGV4dCcpO1xyXG4gICAgICByZXR1cm4gJC50ZXh0Q29udGVudChub2RlLCB0aGlzLmdldChrZXkpIHx8ICcnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyMjIyMjIyMjIyMjIyMjIyMgR2VuZXJpYyBkYXRhIGF0dHJpYnV0ZXMgaGFuZGxpbmcgIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcclxuICAgIC8qXHJcbiAgICAgKiBldmFsdWF0ZXMgZXhwcmVzc2lvbiB2YWx1ZSB0byBpbml0XHJcbiAgICAgKiBFeGFtcGxlOiBkYXRhLWluaXQ9XCJAa2V5KHRydWUpXCJcclxuICAgICAqICAgICAgICAgIGRhdGEtaW5pdD1cInJoLl8ubG9hZFNjcmlwdCgncC50b2MnKVwiXHJcbiAgICAgKi9cclxuICAgIGRhdGFfaW5pdChub2RlLCByYXdFeHByKSB7XHJcbiAgICAgIGxldCByZXNvbHZlZERhdGEgPSBfLnJlc29sdmVFeHByT3B0aW9ucyhyYXdFeHByKTtcclxuICAgICAgbGV0IGNhbGxiYWNrID0gdGhpcy5fZnVuY3Rpb24oJ25vZGUnLCByZXNvbHZlZERhdGEuZXhwcik7XHJcbiAgICAgIGNhbGxiYWNrID0gXy5hcHBseUNhbGxiYWNrT3B0aW9ucyhjYWxsYmFjaywgcmVzb2x2ZWREYXRhLm9wdHMpO1xyXG4gICAgICByZXR1cm4gY2FsbGJhY2suY2FsbCh0aGlzLCBub2RlKTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogaGVscGVyIG1ldGhvZCBmb3IgZGF0YSBtZXRob2RzIGhhdmluZyBleHByZXNzaW9uIGxpa2UgZGF0YS1pZlxyXG4gICAgICovXHJcbiAgICBzdWJzY3JpYmVEYXRhRXhwcihyYXdFeHByLCBoYW5kbGVyLCBvcHRzKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZUV4cHIocmF3RXhwciwgaGFuZGxlciwgdGhpcy5odG1sU3Vicywgb3B0cyk7XHJcbiAgICB9XHJcbiAgICBfZGF0YV9ldmVudF9jYWxsYmFjayhyYXdFeHByKSB7XHJcbiAgICAgIGxldCBkYXRhID0gV2lkZ2V0LnByb3RvdHlwZS5fZXZlbnRDYWxsQmFja0RhdGFbcmF3RXhwcl07XHJcbiAgICAgIGlmIChkYXRhID09IG51bGwpIHtcclxuICAgICAgICBkYXRhID0ge307XHJcbiAgICAgICAgbGV0IHZhbHVlID0gXy5yZXNvbHZlUGlwZWRFeHByZXNzaW9uKHJhd0V4cHIpO1xyXG4gICAgICAgIGRhdGEuY2FsbGJhY2sgPSB0aGlzLl9mdW5jdGlvbignZXZlbnQsIG5vZGUnLCB2YWx1ZVswXSk7XHJcbiAgICAgICAgaWYgKHZhbHVlWzFdKSB7IGRhdGEub3B0cyA9IF8ucmVzb2x2ZU5pY2VKU09OKHZhbHVlWzFdKTsgfVxyXG4gICAgICAgIFdpZGdldC5wcm90b3R5cGUuX2V2ZW50Q2FsbEJhY2tEYXRhW3Jhd0V4cHJdID0gZGF0YTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogc3Vic2NyaWJlcyB0byBrZXlzIGFuZCBldmFsdWF0ZXMgZXhwcmVzc2lvbiB2YWx1ZSB0byBzaG93IG9yIGhpZGVcclxuICAgICAqIEV4YW1wbGU6IGRhdGEtaWY9XCJAa2V5XCJcclxuICAgICAqICAgICAgICAgIGRhdGEtaWY9XCIhQGtleSYmQGtleTJcIlxyXG4gICAgICogICAgICAgICAgZGF0YS1pZj0ndGhpcy5nZXQoXCJrZXlcIiwgXCJ2YWx1ZVwiKSdcclxuICAgICAqICAgICAgICAgIGRhdGEtaWY9XCJAa2V5PT12YWx1ZVwiXHJcbiAgICAgKiAgICAgICAgICBkYXRhLWlmPVwiQGtleSE9PXZhbHVlXCJcclxuICAgICAqL1xyXG4gICAgZGF0YV9pZihub2RlLCByYXdFeHByKSB7XHJcbiAgICAgIGxldCBub2RlSG9sZGVyID0gbmV3IHJoLk5vZGVIb2xkZXIoW25vZGVdKTtcclxuICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlRGF0YUV4cHIocmF3RXhwciwgZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgaWYgKHJlc3VsdCkgeyByZXR1cm4gbm9kZUhvbGRlci5zaG93KCk7IH0gZWxzZSB7IHJldHVybiBub2RlSG9sZGVyLmhpZGUoKTsgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBkYXRhX2hpZGRlbihub2RlLCByYXdFeHByKSB7XHJcbiAgICAgIGxldCBub2RlSG9sZGVyID0gbmV3IHJoLk5vZGVIb2xkZXIoW25vZGVdKTtcclxuICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlRGF0YUV4cHIocmF3RXhwciwgcmVzdWx0ID0+IG5vZGVIb2xkZXIuYWNjZXNzaWJsZSghcmVzdWx0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIHN1YnNjcmliZXMgdG8gYSBrZXkgYW5kIGZpbGxzIGl0cyB2YWx1ZSBhcyBodG1sIGNvbnRlbnRcclxuICAgICAqIEV4YW1wbGU6IDxhIGRhdGEtaHRtbD1cIkBrZXlcIj50ZW1wIHZhbHVlPC9hPlxyXG4gICAgICogICAgICAgICAgPGRpdiBkYXRhLWh0bWw9XCJAa2V5Wyd1cmwnXVwiPnRlbXAgdmFsdWU8L2Rpdj5cclxuICAgICAqL1xyXG4gICAgZGF0YV9odG1sKG5vZGUsIHJhd0V4cHIpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlRGF0YUV4cHIocmF3RXhwciwgZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgaWYgKHJlc3VsdCA9PSBudWxsKSB7IHJlc3VsdCA9ICcnOyB9XHJcbiAgICAgICAgbm9kZS5pbm5lckhUTUwgPSByZXN1bHQ7XHJcbiAgICAgICAgLy9UT0RPIHVuc3ViIG9sZCBzdWJzY3JpYmVzXHJcbiAgICAgICAgcmV0dXJuICQuZWFjaENoaWxkTm9kZShub2RlLCBjaGlsZCA9PiB0aGlzLnJlc29sdmVEYXRhQXR0cnMoY2hpbGQpKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIHN1YnNjcmliZXMgdG8gYSBrZXkgYW5kIGZpbGxzIGl0cyB2YWx1ZSBhcyB0ZXh0IGNvbnRlbnRcclxuICAgICAqIEV4YW1wbGU6IDxhIGRhdGEtdGV4dD1cIkBrZXlcIj50ZW1wIHZhbHVlPC9hPlxyXG4gICAgICogICAgICAgICAgPGRpdiBkYXRhLXRleHQ9XCJAa2V5Wyd0aXRsZSddXCI+dGVtcCB2YWx1ZTwvZGl2PlxyXG4gICAgICovXHJcbiAgICBkYXRhX3RleHQobm9kZSwgcmF3RXhwcikge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVEYXRhRXhwcihyYXdFeHByLCBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICBpZiAocmVzdWx0ID09IG51bGwpIHsgcmVzdWx0ID0gJyc7IH1cclxuICAgICAgICByZXR1cm4gJC50ZXh0Q29udGVudChub2RlLCByZXN1bHQpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIC8qXHJcbiAgICAgKiBwcm92aWRlIGV4cHJlc3Npb24gdG8gdXBkYXRlIHRoZSBjbGFzcyBhdHRyaWJ1dGVcclxuICAgICAqIEV4YW1wbGU6IGRhdGEtY2xhc3M9XCJzZWxlY3RlZDogI3tAaW5kZXh9ID09IEAuZGF0YWlkeFwiXHJcbiAgICAgKiBkYXRhLWNsYXNzPVwic2VsZWN0ZWQ6IEBrZXkxOyBib2xkOiBAa2V5MlwiXHJcbiAgICAgKi9cclxuICAgIGRhdGFfY2xhc3Mobm9kZSwgYXR0cnNEYXRhKSB7XHJcbiAgICAgIHJldHVybiBfLmVhY2godGhpcy5yZXNvbHZlQXR0cihhdHRyc0RhdGEpLCBmdW5jdGlvbihyYXdFeHByLCBjbGFzc05hbWUpIHtcclxuICAgICAgICBsZXQgbm9kZUhvbGRlciA9IG5ldyByaC5Ob2RlSG9sZGVyKFtub2RlXSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlRGF0YUV4cHIocmF3RXhwciwgZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICAgICAgICBsZXQgYWRkUmVtb3ZlQ2xhc3MgPSByZXN1bHQgPyBbY2xhc3NOYW1lXSA6IFtdO1xyXG4gICAgICAgICAgcmV0dXJuIG5vZGVIb2xkZXIudXBkYXRlQ2xhc3MoYWRkUmVtb3ZlQ2xhc3MpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgICwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIFRvIHVwZGF0ZSBhbnkgaHRtbCB0YWcgYXR0cmlidXRlLlxyXG4gICAgICogRXhhbXBsZTogPGEgZGF0YS1hdHRyPVwiaHJlZjpsaW5rX2tleVwiPkdvb2dsZTwvYT5cclxuICAgICAqICAgICAgICAgIDxidXR0b24gZGF0YS1hdHRyPVwiZGlzYWJsZWQ6a2V5XCI+dGVtcCB2YWx1ZTwvYnV0dG9uPlxyXG4gICAgICovXHJcbiAgICBkYXRhX2F0dHIobm9kZSwgYXR0cnNEYXRhKSB7XHJcbiAgICAgIHJldHVybiBfLmVhY2godGhpcy5yZXNvbHZlQXR0cihhdHRyc0RhdGEpLCBmdW5jdGlvbihyYXdFeHByLCBhdHRyX25hbWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVEYXRhRXhwcihyYXdFeHByLCBmdW5jdGlvbihyZXN1bHQpIHtcclxuICAgICAgICAgIGlmIChyZXN1bHQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJC5zZXRBdHRyaWJ1dGUobm9kZSwgYXR0cl9uYW1lLCByZXN1bHQpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICgkLmhhc0F0dHJpYnV0ZShub2RlLCBhdHRyX25hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkLnJlbW92ZUF0dHJpYnV0ZShub2RlLCBhdHRyX25hbWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgICwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIFRvIHVwZGF0ZSBzdHlsZSBhdHRyaWJ1dGUgb2YgSFRNTCBub2RlLlxyXG4gICAgICogRXhhbXBsZTpcclxuICAgICAqIDxzcGFuIHN0eWxlPVwidmlzaWJsZTogdHJ1ZTtcIiBkYXRhLWNzcz1cInZpc2libGU6IEBrZXlcIj4gc29tZSB0ZXh0IDwvc3Bhbj5cclxuICAgICAqIDxsaSBzdHlsZT1cImNvbG9yOiBibHVlOyBkaXNwbGF5OiBibG9jaztcIiBkYXRhLWNzcz1cImNvbG9yOlxyXG4gICAgICogQC5zZWxlY3RlZF9jb2xvcjsgZGlzcGxheTogQC5kYXRhaWR4ID4gMTAgPyAnbm9uZScgOiAnYmxvY2snXCI+PC9saT5cclxuICAgICAqL1xyXG4gICAgZGF0YV9jc3Mobm9kZSwgYXR0cnNEYXRhKSB7XHJcbiAgICAgIHJldHVybiBfLmVhY2godGhpcy5yZXNvbHZlQXR0cihhdHRyc0RhdGEpLCBmdW5jdGlvbihyYXdFeHByLCBzdHlsZU5hbWUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVEYXRhRXhwcihyYXdFeHByLCAocmVzdWx0ID0gbnVsbCkgPT4gLy8gbnVsbCB0byBmb3JjZSBzZXQgY3NzXHJcbiAgICAgICAgICAkLmNzcyhub2RlLCBzdHlsZU5hbWUsIHJlc3VsdClcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICAgICwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIHdvcmtzIGxpa2UgZGF0YS1pZiBidXQgc2V0cyB0aGUgc3RhdGVzIGNoZWNrZWRcclxuICAgICAqIEV4YW1wbGU6XHJcbiAgICAgKiA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cImdyb3VwMVwiIHZhbHVlPVwiUHJpbnRcIiBkYXRhLWNoZWNrZWQ9XCJrZXlcIiAvPlxyXG4gICAgICogPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJncm91cDFcIiB2YWx1ZT1cIk9ubGluZVwiIGRhdGEtY2hlY2tlZD1cImtleVwiIC8+XHJcbiAgICAgKi9cclxuICAgIGRhdGFfY2hlY2tlZChub2RlLCBrZXkpIHtcclxuICAgICAgaWYgKF8uaXNWYWxpZE1vZGVsQ29uc3RLZXkoa2V5KSkgeyBrZXkgPSBjb25zdHMoa2V5KTsgfVxyXG4gICAgICBsZXQgdHlwZSA9IG5vZGUuZ2V0QXR0cmlidXRlKCd0eXBlJyk7XHJcbiAgICAgIGlmICgodHlwZSA9PT0gJ2NoZWNrYm94JykgfHwgKHR5cGUgPT09ICdyYWRpbycpKSB7XHJcbiAgICAgICAgbGV0IG5vZGVWYWx1ZTtcclxuICAgICAgICBpZiAoJC5nZXRBdHRyaWJ1dGUobm9kZSwgJ2NoZWNrZWQnKSkge1xyXG4gICAgICAgICAgdGhpcy5ndWFyZChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMucHVibGlzaChrZXksIG5vZGUuZ2V0QXR0cmlidXRlKCd2YWx1ZScsIHtzeW5jOiB0cnVlfSkpOyB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5vZGUub25jbGljayA9ICgpID0+IHtcclxuICAgICAgICAgIG5vZGVWYWx1ZSA9IG5vZGUuZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgICAgICAgbGV0IHZhbHVlID1cclxuICAgICAgICAgICAgbm9kZVZhbHVlID09PSBudWxsID9cclxuICAgICAgICAgICAgICBub2RlLmNoZWNrZWRcclxuICAgICAgICAgICAgOiBub2RlLmNoZWNrZWQgP1xyXG4gICAgICAgICAgICAgIG5vZGVWYWx1ZVxyXG4gICAgICAgICAgICA6XHJcbiAgICAgICAgICAgICAgdW5kZWZpbmVkO1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuZ3VhcmQoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnB1Ymxpc2goa2V5LCB2YWx1ZSwge3N5bmM6IHRydWV9KTsgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gdGhpcy5odG1sU3Vicy5wdXNoKHRoaXMuc3Vic2NyaWJlKGtleSwgZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICAgIG5vZGVWYWx1ZSA9IG5vZGUuZ2V0QXR0cmlidXRlKCd2YWx1ZScpO1xyXG4gICAgICAgICAgaWYgKG5vZGVWYWx1ZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBub2RlLmNoZWNrZWQgPSB2YWx1ZSA9PT0gbm9kZVZhbHVlO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5vZGUuY2hlY2tlZCA9IHZhbHVlID09PSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBzdWJzY3JpYmVzIHRvIGEga2V5IGFuZCBmaWxscyBpdHMgdmFsdWUgYXMgaHRtbCBjb250ZW50XHJcbiAgICAgKiBFeGFtcGxlOlxyXG4gICAgICogPGlucHV0IHR5cGU9XCJ0ZXh0XCIgZGF0YS12YWx1ZT1cImtleVwiIC8+XHJcbiAgICAgKiA8aW5wdXQgdHlwZT1cInRleHRcIiB2YWx1ZT1cIk9ubGluZVwiIGRhdGEtdmFsdWU9XCJrZXlcIiAvPlxyXG4gICAgICovXHJcbiAgICBkYXRhX3ZhbHVlKG5vZGUsIGtleSkge1xyXG4gICAgICBpZiAoXy5pc1ZhbGlkTW9kZWxDb25zdEtleShrZXkpKSB7IGtleSA9IGNvbnN0cyhrZXkpOyB9XHJcbiAgICAgIGxldCBub2RlR3VhcmQgPSBNYXRoLnJhbmRvbSgpO1xyXG4gICAgICBpZiAobm9kZS52YWx1ZSkgeyB0aGlzLmd1YXJkKChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMucHVibGlzaChrZXksIG5vZGUudmFsdWUsIHtzeW5jOiB0cnVlfSk7IH0pLCBub2RlR3VhcmQpOyB9XHJcblxyXG4gICAgICBub2RlLm9uY2hhbmdlID0gKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmd1YXJkKChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuZ3VhcmQoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnB1Ymxpc2goa2V5LCBub2RlLnZhbHVlLCB7c3luYzogdHJ1ZX0pOyB9KTtcclxuICAgICAgICAgfSksIG5vZGVHdWFyZCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5odG1sU3Vicy5wdXNoKHRoaXMuc3Vic2NyaWJlKGtleSwgdmFsdWUgPT4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmd1YXJkKCgoKSA9PiBub2RlLnZhbHVlID0gdmFsdWUpLCBub2RlR3VhcmQpO1xyXG4gICAgICB9KVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBfcmVnaXN0ZXJfZXZlbnRfd2l0aF9yYXdFeHByKG5hbWUsIG5vZGUsIHJhd0V4cHIpIHtcclxuICAgICAgbGV0IHtjYWxsYmFja30gPSB0aGlzLnJlc29sdmVFdmVudFJhd0V4cHIocmF3RXhwcik7XHJcbiAgICAgIF8uYWRkRXZlbnRMaXN0ZW5lcihub2RlLCBuYW1lLCBlID0+IGNhbGxiYWNrLmNhbGwodGhpcywgZSwgZS5jdXJyZW50VGFyZ2V0KSk7XHJcbiAgICAgIHJldHVybiBjYWxsYmFjaztcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogRXhhbXBsZTogZGF0YS1jbGljaz0nQGtleShcInZhbHVlXCIpJ1xyXG4gICAgICogICAgICAgICAgZGF0YS1jbGljaz0ndGhpcy5wdWJsaXNoKFwia2V5XCIsIFwidmFsdWVcIiknXHJcbiAgICAgKiAgICAgICAgICBkYXRhLWNsaWNrPSdAa2V5KFwidmFsdWVcIik7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7J1xyXG4gICAgICovXHJcbiAgICBkYXRhX2NsaWNrKG5vZGUsIHJhd0V4cHIpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX3JlZ2lzdGVyX2V2ZW50X3dpdGhfcmF3RXhwcignY2xpY2snLCBub2RlLCByYXdFeHByKTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogRXhhbXBsZTogZGF0YS1tb3VzZW92ZXI9J0BrZXkoXCJ2YWx1ZVwiKSdcclxuICAgICAqICAgICAgICAgIGRhdGEtbW91c2VvdmVyPSd0aGlzLnB1Ymxpc2goXCJrZXlcIiwgXCJ2YWx1ZVwiKSdcclxuICAgICAqICAgICAgICAgIGRhdGEtbW91c2VvdmVyPSdAa2V5KFwidmFsdWVcIik7IGV2ZW50LnByZXZlbnREZWZhdWx0KCk7J1xyXG4gICAgICovXHJcbiAgICBkYXRhX21vdXNlb3Zlcihub2RlLCByYXdFeHByKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9yZWdpc3Rlcl9ldmVudF93aXRoX3Jhd0V4cHIoJ21vdXNlb3ZlcicsIG5vZGUsIHJhd0V4cHIpO1xyXG4gICAgfVxyXG5cclxuICAgIGRhdGFfbW91c2VvdXQobm9kZSwgcmF3RXhwcikge1xyXG4gICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJfZXZlbnRfd2l0aF9yYXdFeHByKCdtb3VzZW91dCcsIG5vZGUsIHJhd0V4cHIpO1xyXG4gICAgfVxyXG5cclxuICAgIGRhdGFfZm9jdXMobm9kZSwgcmF3RXhwcikge1xyXG4gICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJfZXZlbnRfd2l0aF9yYXdFeHByKCdmb2N1cycsIG5vZGUsIHJhd0V4cHIpO1xyXG4gICAgfVxyXG5cclxuICAgIGRhdGFfYmx1cihub2RlLCByYXdFeHByKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9yZWdpc3Rlcl9ldmVudF93aXRoX3Jhd0V4cHIoJ2JsdXInLCBub2RlLCByYXdFeHByKTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogdHJpZ2dlclxyXG4gICAgICogRXhhbXBsZTogZGF0YS10cmlnZ2VyPScubC5nb190b190b3AnXHJcbiAgICAgKiAgICAgICAgICBkYXRhLXRyaWdnZXI9J0VWVF9TRUFSQ0hfUEFHRSdcclxuICAgICAqL1xyXG4gICAgZGF0YV90cmlnZ2VyKG5vZGUsIGtleSkge1xyXG4gICAgICBpZiAoXy5pc1ZhbGlkTW9kZWxDb25zdEtleShrZXkpKSB7IGtleSA9IGNvbnN0cyhrZXkpOyB9XHJcbiAgICAgIHJldHVybiBfLmFkZEV2ZW50TGlzdGVuZXIobm9kZSwgJ2NsaWNrJywgKCkgPT4gdGhpcy5wdWJsaXNoKGtleSwgbnVsbCkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBjYWxsIG1lbWJlciBvciBnbG9iYWwgbWV0aG9kIG9uIGNsaWNrXHJcbiAgICAgKiBhZHZhbnRhZ2UgaXMgeW91IHdpbGwgZ2V0IGV2ZW50IGFzIGFyZ3VtZW50XHJcbiAgICAgKiBFeGFtcGxlOiBkYXRhLW1ldGhvZD0naGFuZGxlU2F2ZScgPT4gZGF0YS1jbGljaz0ndGhpcy5oYW5kbGVTYXZlKGV2ZW50KSdcclxuICAgICAqICAgICAgICAgIGRhdGEtbWV0aG9kPSdoYW5kbGVDYW5jZWwnXHJcbiAgICAgKi9cclxuICAgIGRhdGFfbWV0aG9kKG5vZGUsIG1ldGhvZCkge1xyXG4gICAgICByZXR1cm4gXy5hZGRFdmVudExpc3RlbmVyKG5vZGUsICdjbGljaycsIGV2ZW50ID0+IHtcclxuICAgICAgICBpZiAoIWV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHsgcmV0dXJuICh0aGlzW21ldGhvZF0gfHwgd2luZG93W21ldGhvZF0pKGV2ZW50KTsgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGRhdGFfdG9nZ2xlKG5vZGUsIHJhd0FyZ3MpIHtcclxuICAgICAgbGV0IG9wdHM7XHJcbiAgICAgIGxldCBrZXlzID0gW107XHJcbiAgICAgIGxldCBkYXRhID0gV2lkZ2V0LnByb3RvdHlwZS5fdG9nZ2xlRGF0YVtyYXdBcmdzXTtcclxuICAgICAgaWYgKGRhdGEgPT0gbnVsbCkge1xyXG4gICAgICAgIGxldCBwaXBlZEFyZ3MgPSBfLnJlc29sdmVQaXBlZEV4cHJlc3Npb24ocmF3QXJncyk7XHJcbiAgICAgICAgbGV0IGNvbmZpZyA9IHBpcGVkQXJncy5zaGlmdCgpIHx8ICcnO1xyXG4gICAgICAgIGNvbmZpZyA9IF8uZXhwbG9kZUFuZE1hcChjb25maWcsICc7JywgJzonLCB7dHJpbTogdHJ1ZX0pO1xyXG4gICAgICAgIGlmIChwaXBlZEFyZ3NbMF0pIHsgb3B0cyA9IF8ucmVzb2x2ZU5pY2VKU09OKHBpcGVkQXJnc1swXSk7IH1cclxuICAgICAgICBkYXRhID0ge2tleVZhbHVlczogY29uZmlnLCBvcHRzfTtcclxuICAgICAgICBXaWRnZXQucHJvdG90eXBlLl90b2dnbGVEYXRhW3Jhd0FyZ3NdID0gZGF0YTtcclxuICAgICAgfVxyXG5cclxuICAgICAgXy5lYWNoKGRhdGEua2V5VmFsdWVzLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XHJcbiAgICAgICAga2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcclxuICAgICAgICAgIHJldHVybiB0aGlzLmd1YXJkKGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5wdWJsaXNoKGtleSwgdmFsdWUgPT09ICd0cnVlJywge3N5bmM6IHRydWV9KTsgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgICwgdGhpcyk7XHJcblxyXG4gICAgICBsZXQgY2FsbGJhY2sgPSBrZXkgPT4gdGhpcy5ndWFyZChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMucHVibGlzaChrZXksICF0aGlzLmdldChrZXkpLCB7c3luYzogdHJ1ZX0pOyB9KTtcclxuICAgICAgaWYgKGRhdGEub3B0cykgeyBjYWxsYmFjayA9IF8uYXBwbHlDYWxsYmFja09wdGlvbnMoY2FsbGJhY2ssIGRhdGEub3B0cyk7IH1cclxuXHJcbiAgICAgIHJldHVybiBfLmFkZEV2ZW50TGlzdGVuZXIobm9kZSwgJ2NsaWNrJywgZXZlbnQgPT4gXy5lYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkgeyBpZiAoIWV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHsgcmV0dXJuIGNhbGxiYWNrKGtleSk7IH0gfSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBUb2dnbGUgbW9kZWwgdmFyaWFibGUgb24gY2xpY2tcclxuICAgICAqIEV4YW1wbGU6IGRhdGEtdG9nZ2xlY2xhc3M9J3JoLWhpZGUnXHJcbiAgICAgKiAgICAgICAgICBkYXRhLXRvZ2dsZWNsYXNzPSdvcGVuJ1xyXG4gICAgICogICAgICAgICAgPGRpdiBjbGFzcz1cIm9wZW5cIiBkYXRhLXRvZ2dsZWNsYXNzPSdvcGVuLGNsb3NlZCc+XHJcbiAgICAgKi9cclxuICAgIGRhdGFfdG9nZ2xlY2xhc3Mobm9kZSwgY2xhc3NOYW1lcykge1xyXG4gICAgICBsZXQgbmV3Q2xhc3NlcyA9IF8uc3BsaXRBbmRUcmltKGNsYXNzTmFtZXMsICcsJyk7XHJcbiAgICAgIHJldHVybiBfLmFkZEV2ZW50TGlzdGVuZXIobm9kZSwgJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAoIWV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcclxuICAgICAgICAgIG5vZGUgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xyXG4gICAgICAgICAgcmV0dXJuIF8uZWFjaChuZXdDbGFzc2VzLCBmdW5jdGlvbihjbGFzc05hbWUpIHtcclxuICAgICAgICAgICAgaWYgKCQuaGFzQ2xhc3Mobm9kZSwgY2xhc3NOYW1lKSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiAkLnJlbW92ZUNsYXNzKG5vZGUsIGNsYXNzTmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICQuYWRkQ2xhc3Mobm9kZSwgY2xhc3NOYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogRXhhbXBsZTogZGF0YS1jaGFuZ2U9J0BrZXkoXCJ2YWx1ZVwiKSdcclxuICAgICAqICAgICAgICAgIGRhdGEtY2hhbmdlPSd0aGlzLnB1Ymxpc2goXCJrZXlcIiwgXCJ2YWx1ZVwiKSdcclxuICAgICAqL1xyXG4gICAgZGF0YV9jaGFuZ2Uobm9kZSwgcmF3RXhwcikge1xyXG4gICAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGFfZXZlbnRfY2FsbGJhY2socmF3RXhwcik7XHJcbiAgICAgIGxldCBjYWxsYmFjayA9IF8uYXBwbHlDYWxsYmFja09wdGlvbnMoZGF0YS5jYWxsYmFjaywgZGF0YS5vcHRzKTtcclxuICAgICAgcmV0dXJuIG5vZGUub25jaGFuZ2UgPSBldmVudCA9PiBjYWxsYmFjay5jYWxsKHRoaXMsIGV2ZW50LCBldmVudC5jdXJyZW50VGFyZ2V0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgICogRXhhbXBsZTogZGF0YS1rZXlkb3duPSdAdGV4dChub2RlLnZhbHVlKTsgfCBrZXlDb2RlOiAxMydcclxuICAgICAqICAgICAgICAgIGRhdGEta2V5ZG93bj0nZXZlbnQua2V5Q29kZSA9PSAxMyAmJiBAdGV4dChub2RlLnZhbHVlKSdcclxuICAgICAqICAgICAgICAgIGRhdGEta2V5ZG93bj0ndGhpcy5wdWJsaXNoKFwia2V5XCIsIFwibXl2YWx1ZVwiKTsnXHJcbiAgICAgKiAgICAgICAgICBkYXRhLWtleWRvd25vcHRpb25zPSdkZWJvdW5jZTozMDAnXHJcbiAgICAgKi9cclxuICAgIGRhdGFfa2V5ZG93bihub2RlLCByYXdFeHByKSB7XHJcbiAgICAgIGxldCBkYXRhID0gdGhpcy5fZGF0YV9ldmVudF9jYWxsYmFjayhyYXdFeHByKTtcclxuICAgICAgbGV0IGNhbGxiYWNrID0gXy5hcHBseUNhbGxiYWNrT3B0aW9ucyhkYXRhLmNhbGxiYWNrLCBkYXRhLm9wdHMpO1xyXG4gICAgICBsZXQga2V5Q29kZSA9IGRhdGEub3B0cyAmJiBkYXRhLm9wdHMua2V5Q29kZTtcclxuXHJcbiAgICAgIHJldHVybiBub2RlLm9ua2V5ZG93biA9IGV2ZW50ID0+IHtcclxuICAgICAgICBpZiAoIWtleUNvZGUgfHwgKGtleUNvZGUgPT09IGV2ZW50LmtleUNvZGUpKSB7XHJcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2suY2FsbCh0aGlzLCBldmVudCwgZXZlbnQuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBFeGFtcGxlOiBkYXRhLWtleXVwPSdpZihrZXkgPT0gMTMpQHRleHQobm9kZS52YWx1ZSk7J1xyXG4gICAgICogICAgICAgICAgZGF0YS1rZXl1cD0nQHRleHQobm9kZS52YWx1ZSkgfCBrZXlDb2RlOiAxMydcclxuICAgICAqICAgICAgICAgIGRhdGEta2V5dXA9J3RoaXMucHVibGlzaChcImtleVwiLCBcIm15dmFsdWVcIikgfCBkZWJvdW5jZTozMDAnXHJcbiAgICAgKi9cclxuICAgIGRhdGFfa2V5dXAobm9kZSwgcmF3RXhwcikge1xyXG4gICAgICBsZXQgZGF0YSA9IHRoaXMuX2RhdGFfZXZlbnRfY2FsbGJhY2socmF3RXhwcik7XHJcbiAgICAgIGxldCBjYWxsYmFjayA9IF8uYXBwbHlDYWxsYmFja09wdGlvbnMoZGF0YS5jYWxsYmFjaywgZGF0YS5vcHRzKTtcclxuICAgICAgbGV0IGtleUNvZGUgPSBkYXRhLm9wdHMgJiYgZGF0YS5vcHRzLmtleUNvZGU7XHJcblxyXG4gICAgICByZXR1cm4gbm9kZS5vbmtleXVwID0gZXZlbnQgPT4ge1xyXG4gICAgICAgIGlmICgha2V5Q29kZSB8fCAoa2V5Q29kZSA9PT0gZXZlbnQua2V5Q29kZSkpIHtcclxuICAgICAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHRoaXMsIGV2ZW50LCBldmVudC5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAqIEV4YW1wbGU6IGRhdGEtc2Nyb2xsPSdAdGV4dChub2RlLnZhbHVlKSB8IGRlYm91bmNlOjMwMCdcclxuICAgICAqICAgICAgICAgIGRhdGEtc2Nyb2xsPSd0aGlzLnB1Ymxpc2goXCJrZXlcIiwgXCJteXZhbHVlXCIpJ1xyXG4gICAgICovXHJcbiAgICBkYXRhX3Njcm9sbChub2RlLCByYXdFeHByKSB7XHJcbiAgICAgIGxldCBkYXRhID0gdGhpcy5fZGF0YV9ldmVudF9jYWxsYmFjayhyYXdFeHByKTtcclxuICAgICAgbGV0IHsgb3B0cyB9ID0gZGF0YTtcclxuICAgICAgbGV0IGRlbHRhID0gKG9wdHMgJiYgb3B0cy5kZWx0YSkgfHwgMTAwO1xyXG4gICAgICBsZXQgY2FsbGJhY2sgPSBldmVudCA9PiB7XHJcbiAgICAgICAgbGV0IHJlY3QgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIGlmIChub2RlLnNjcm9sbFRvcCA+IChub2RlLnNjcm9sbEhlaWdodCAtIChyZWN0LmhlaWdodCArIGRlbHRhKSkpIHtcclxuICAgICAgICAgIHJldHVybiBkYXRhLmNhbGxiYWNrLmNhbGwodGhpcywgZXZlbnQsIG5vZGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmIChvcHRzKSB7IGNhbGxiYWNrID0gXy5hcHBseUNhbGxiYWNrT3B0aW9ucyhjYWxsYmFjaywgb3B0cyk7IH1cclxuICAgICAgcmV0dXJuIF8uYWRkRXZlbnRMaXN0ZW5lcihub2RlLCAnc2Nyb2xsJywgY2FsbGJhY2spO1xyXG4gICAgfVxyXG4gICAgZGF0YV9sb2FkKG5vZGUsIHZhbHVlKSB7XHJcbiAgICAgIGxldCBwYWlyID0gdmFsdWUuc3BsaXQoJzonKTtcclxuICAgICAgbGV0IGpzUGF0aCA9IHBhaXJbMF07XHJcbiAgICAgIGxldCBrZXkgPSBwYWlyWzFdO1xyXG4gICAgICBpZiAoIVdpZGdldC5wcm90b3R5cGUuX2xvYWREYXRhW2pzUGF0aF0pIHtcclxuICAgICAgICByZXR1cm4gXy5hZGRFdmVudExpc3RlbmVyKG5vZGUsICdjbGljaycsIGV2ZW50ID0+IHtcclxuICAgICAgICAgIGlmICghV2lkZ2V0LnByb3RvdHlwZS5fbG9hZERhdGFbanNQYXRoXSkge1xyXG4gICAgICAgICAgICBXaWRnZXQucHJvdG90eXBlLl9sb2FkRGF0YVtqc1BhdGhdID0gdHJ1ZTtcclxuICAgICAgICAgICAgaWYgKGtleSkge1xyXG4gICAgICAgICAgICAgICQuYWRkQ2xhc3Mobm9kZSwgJ2xvYWRpbmcnKTtcclxuICAgICAgICAgICAgICB2YXIgdW5zdWIgPSB0aGlzLnN1YnNjcmliZU9ubHkoa2V5LCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICQucmVtb3ZlQ2xhc3Mobm9kZSwgJ2xvYWRpbmcnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB1bnN1YigpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBfLmxvYWRTY3JpcHQoanNQYXRoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRhdGFfY29udHJvbGxlcihub2RlLCB2YWx1ZSkge1xyXG4gICAgICBpZiAodGhpcy51c2VyX3ZhcnMgPT0gbnVsbCkgeyB0aGlzLnVzZXJfdmFycyA9IHt9OyB9XHJcbiAgICAgIGZvciAobGV0IGRhdGEgb2YgQXJyYXkuZnJvbShfLnNwbGl0QW5kVHJpbSh2YWx1ZSwgJzsnKSkpIHtcclxuICAgICAgICB2YXIgY3RybENsYXNzLCBvcHRzO1xyXG4gICAgICAgIGxldCBwYWlyID0gXy5yZXNvbHZlUGlwZWRFeHByZXNzaW9uKGRhdGEpO1xyXG4gICAgICAgIGlmIChwYWlyWzFdKSB7IG9wdHMgPSBfLnJlc29sdmVOaWNlSlNPTihwYWlyWzFdKTsgfVxyXG4gICAgICAgIHBhaXIgPSBfLnNwbGl0QW5kVHJpbShwYWlyWzBdLCAnOicpO1xyXG4gICAgICAgIGlmIChwYWlyLmxlbmd0aCA9PT0gMCkgeyBwYWlyID0gXy5zcGxpdEFuZFRyaW0ocGFpclswXSwgJyBhcyAnKTsgfVxyXG4gICAgICAgIGlmIChwYWlyWzBdICE9IG51bGwpIHsgY3RybENsYXNzID0gcmguY29udHJvbGxlcihwYWlyWzBdKTsgfVxyXG4gICAgICAgIGxldCBjdHJsTmFtZSA9IHBhaXJbMV07XHJcbiAgICAgICAgaWYgKGN0cmxDbGFzcyAmJiAhdGhpcy51c2VyX3ZhcnNbY3RybE5hbWVdKSB7XHJcbiAgICAgICAgICBsZXQgY29udHJvbGxlciA9IG5ldyBjdHJsQ2xhc3ModGhpcywgb3B0cyk7XHJcbiAgICAgICAgICBpZiAoY3RybE5hbWUpIHsgdGhpcy51c2VyX3ZhcnNbY3RybE5hbWVdID0gY29udHJvbGxlcjsgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAocmguX2RlYnVnICYmICFjdHJsQ2xhc3MpIHtcclxuICAgICAgICAgIHJoLl9kKCdlcnJvcicsIGBDb250cm9sbGVyICR7Y3RybENsYXNzfSBub3QgZm91bmRgKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkYXRhX3NjcmVlbnZhcihub2RlLCB2YWx1ZSkge1xyXG4gICAgICBsZXQgc1ZhcnMgPSBfLnNwbGl0QW5kVHJpbSh2YWx1ZSwgJywnKTtcclxuICAgICAgbGV0IGN1cnJlbnRfc2NyZWVuID0gXy5maW5kSW5kZXgodGhpcy5nZXQoY29uc3RzKCdLRVlfU0NSRUVOJykpLCAodiwgaykgPT4gdi5hdHRhY2hlZCk7XHJcbiAgICAgIGxldCBjYWNoZSA9IHt9O1xyXG4gICAgICBjYWNoZVtjdXJyZW50X3NjcmVlbl0gPSB7fTtcclxuXHJcbiAgICAgIGxldCBzY3JlZW5LZXlzID0gdGhpcy5nZXQoY29uc3RzKCdLRVlfU0NSRUVOJykpO1xyXG4gICAgICByZXR1cm4gXy5lYWNoKChfLmtleXMoc2NyZWVuS2V5cykpLCBmdW5jdGlvbihrZXkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmVPbmx5KGAke2NvbnN0cygnS0VZX1NDUkVFTicpfS4ke2tleX0uYXR0YWNoZWRgLCBhdHRhY2hlZCA9PiB7XHJcbiAgICAgICAgICBsZXQgbmFtZTtcclxuICAgICAgICAgIGlmICghYXR0YWNoZWQpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgICBfLmVhY2goc1ZhcnMsIGZ1bmN0aW9uKHNWYXIpIHtcclxuICAgICAgICAgICAgY2FjaGVbY3VycmVudF9zY3JlZW5dW3NWYXJdID0gdGhpcy5nZXQoc1Zhcik7XHJcbiAgICAgICAgICAgIGlmIChjYWNoZVtrZXldICE9IG51bGwpIHsgcmV0dXJuIHRoaXMucHVibGlzaChzVmFyLCBjYWNoZVtrZXldW3NWYXJdKTsgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLCB0aGlzKTtcclxuICAgICAgICAgIHJldHVybiBjYWNoZVtuYW1lID0gKGN1cnJlbnRfc2NyZWVuID0ga2V5KV0gIT0gbnVsbCA/IGNhY2hlW25hbWVdIDogKGNhY2hlW25hbWVdID0ge30pO1xyXG4gICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICAsIHRoaXMpO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgV2lkZ2V0LmluaXRDbGFzcygpO1xyXG4gIHJldHVybiBXaWRnZXQ7XHJcbn0pKCk7XHJcblxyXG4gIC8vIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyBVdGlsaXR5IG1ldGhvZHMgIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xyXG5cclxucmgud2lkZ2V0cyA9IHt9O1xyXG5yaC5XaWRnZXQgPSBXaWRnZXQ7XHJcbnJoLndpZGdldHMuQmFzaWMgPSBXaWRnZXQ7XHJcblxyXG5mdW5jdGlvbiBfX2d1YXJkX18odmFsdWUsIHRyYW5zZm9ybSkge1xyXG4gIHJldHVybiAodHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJyAmJiB2YWx1ZSAhPT0gbnVsbCkgPyB0cmFuc2Zvcm0odmFsdWUpIDogdW5kZWZpbmVkO1xyXG59XHJcbiIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcblxyXG5yaC5yZWdpc3RlckRhdGFBdHRyICA9IGZ1bmN0aW9uKGF0dHJOYW1lLCBEYXRhQXR0ckhhbmRsZXIsIFdpZGdldCkge1xyXG4gIGlmIChXaWRnZXQgPT0gbnVsbCkgeyAoeyBXaWRnZXQgfSA9IHJoKTsgfVxyXG4gIGxldCBtZXRob2ROYW1lID0gYGRhdGFfJHthdHRyTmFtZX1gO1xyXG4gIFdpZGdldC5wcm90b3R5cGUuZGF0YUF0dHJNZXRob2RzW2BkYXRhLSR7YXR0ck5hbWV9YF0gPSBtZXRob2ROYW1lO1xyXG4gIFdpZGdldC5wcm90b3R5cGUuZGF0YUF0dHJzLnB1c2goYXR0ck5hbWUpO1xyXG4gIHJldHVybiBXaWRnZXQucHJvdG90eXBlW21ldGhvZE5hbWVdID0gZnVuY3Rpb24obm9kZSwgYXR0clZhbHVlKSB7XHJcbiAgICByZXR1cm4gbmV3IERhdGFBdHRySGFuZGxlcih0aGlzLCBub2RlLCBhdHRyVmFsdWUpO1xyXG4gIH07XHJcbn07XHJcbiIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCB7IF8gfSA9IHJoO1xyXG5sZXQgeyAkIH0gPSByaDtcclxubGV0IHsgY29uc3RzIH0gPSByaDtcclxuXHJcbmNsYXNzIFJlc2l6ZSB7XHJcbiAgY29uc3RydWN0b3Iod2lkZ2V0LCBub2RlLCByYXdFeHByKSB7XHJcbiAgICB0aGlzLmhhbmRsZU1vdXNlRG93biA9IHRoaXMuaGFuZGxlTW91c2VEb3duLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLmhhbmRsZU1vdXNlTW92ZSA9IHRoaXMuaGFuZGxlTW91c2VNb3ZlLmJpbmQodGhpcyk7XHJcbiAgICB0aGlzLndpZGdldCA9IHdpZGdldDtcclxuICAgIHRoaXMubm9kZSA9IG5vZGU7XHJcbiAgICBsZXQge2NhbGxiYWNrLCBvcHRzfSA9IHRoaXMud2lkZ2V0LnJlc29sdmVSYXdFeHByV2l0aFZhbHVlKHJhd0V4cHIpO1xyXG4gICAgdGhpcy5vcHRzID0gb3B0cztcclxuICAgIHRoaXMuY2FsbGJhY2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGNhbGxiYWNrLmNhbGwodGhpcy53aWRnZXQpOyB9O1xyXG5cclxuICAgIGlmIChvcHRzLm1heHggPT0gbnVsbCkgeyBvcHRzLm1heHggPSAxOyB9XHJcbiAgICBpZiAob3B0cy5taW54ID09IG51bGwpIHsgb3B0cy5taW54ID0gMDsgfVxyXG4gICAgaWYgKG9wdHMubWF4eSA9PSBudWxsKSB7IG9wdHMubWF4eSA9IDE7IH1cclxuICAgIGlmIChvcHRzLm1pbnkgPT0gbnVsbCkgeyBvcHRzLm1pbnkgPSAwOyB9XHJcbiAgICB0aGlzLnJlc2l6ZSA9IGZhbHNlO1xyXG4gICAgXHJcbiAgICBfLmluaXRNb3VzZU1vdmUoKTtcclxuICAgIF8uYWRkRXZlbnRMaXN0ZW5lcih0aGlzLm5vZGUsICdtb3VzZWRvd24nLCB0aGlzLmhhbmRsZU1vdXNlRG93bik7XHJcbiAgICB0aGlzLndpZGdldC5zdWJzY3JpYmUoY29uc3RzKCdFVlRfTU9VU0VNT1ZFJyksIHRoaXMuaGFuZGxlTW91c2VNb3ZlKTtcclxuICB9XHJcblxyXG4gIGhhbmRsZU1vdXNlRG93bihldnQpIHtcclxuICAgIGlmIChldnQud2hpY2ggIT09IDEpIHsgcmV0dXJuOyB9XHJcbiAgICB0aGlzLnJlc2l6ZSA9IChldnQudGFyZ2V0ID09PSB0aGlzLm5vZGUpICYmICFldnQuZGVmYXVsdFByZXZlbnRlZDtcclxuICAgIGlmICh0aGlzLnJlc2l6ZSkge1xyXG4gICAgICBsZXQgcmVzdWx0ID0gKHRoaXMuY2FsbGJhY2spKCk7XHJcbiAgICAgIHJldHVybiB0aGlzLnJlc2l6ZSA9IChyZXN1bHQgIT09IGZhbHNlKSAmJiAocmVzdWx0ICE9PSBudWxsKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGhhbmRsZU1vdXNlTW92ZShvYmopIHtcclxuICAgIGlmIChvYmouZGVmYXVsdFByZXZlbnRlZCkgeyB0aGlzLnJlc2l6ZSA9IGZhbHNlOyB9XHJcbiAgICBpZiAoIXRoaXMucmVzaXplKSB7IHJldHVybjsgfVxyXG5cclxuICAgIG9iai5kZWZhdWx0UHJldmVudGVkID0gdHJ1ZTtcclxuICAgIGlmIChvYmoud2hpY2ggPT09IDEpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucHVibGlzaChvYmopO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMucmVzaXplID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXRCYXNlV2lkdGgoKSB7IHJldHVybiB0aGlzLm9wdHMuYmFzZXggfHwgZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aDsgfVxyXG4gICAgXHJcbiAgZ2V0QmFzZUhlaWdodCgpIHsgcmV0dXJuIHRoaXMub3B0cy5iYXNleSB8fCBkb2N1bWVudC5ib2R5Lm9mZnNldEhlaWdodDsgfVxyXG4gIFxyXG4gIHB1Ymxpc2gob2JqKSB7XHJcbiAgICBsZXQgYmFzZSA9IHRoaXMuZ2V0QmFzZVdpZHRoKCk7XHJcbiAgICBsZXQgcnRsID0gJ3J0bCcgPT09IHRoaXMud2lkZ2V0LmdldChjb25zdHMoJ0tFWV9ESVInKSk7XHJcbiAgICBsZXQgbmV3VmFsdWUgPSBydGwgPyBiYXNlIC0gb2JqLnggOiBvYmoueDtcclxuICAgIGlmICghdGhpcy5wdWJsaXNoUG9zKGJhc2UsIHRoaXMub3B0cy5taW54LCB0aGlzLm9wdHMubWF4eCwgdGhpcy5vcHRzLngsIG5ld1ZhbHVlKSkge1xyXG4gICAgICBiYXNlID0gdGhpcy5nZXRCYXNlSGVpZ2h0KCk7XHJcbiAgICAgIG5ld1ZhbHVlID0gcnRsID8gYmFzZSAtIG9iai55IDogb2JqLnk7XHJcbiAgICAgIHJldHVybiB0aGlzLnB1Ymxpc2hQb3MoYmFzZSwgdGhpcy5vcHRzLm1pbnksIHRoaXMub3B0cy5tYXh5LCB0aGlzLm9wdHMueSwgbmV3VmFsdWUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGlzaFBvcyhiYXNlLCBtaW4sIG1heCwga2V5LCBuZXdWYWx1ZSkge1xyXG4gICAgaWYgKChrZXkgIT0gbnVsbCkgJiYgKG5ld1ZhbHVlICE9IG51bGwpKSB7XHJcbiAgICAgIGxldCBvbGRWYWx1ZSA9IHRoaXMud2lkZ2V0LmdldChrZXkpO1xyXG4gICAgICBpZiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgaWYgKChtYXggKiBiYXNlKSA8IG5ld1ZhbHVlKSB7XHJcbiAgICAgICAgICBuZXdWYWx1ZSA9IG1heCAqIGJhc2U7XHJcbiAgICAgICAgfSBlbHNlIGlmICgobWluICogYmFzZSkgPiBuZXdWYWx1ZSkge1xyXG4gICAgICAgICAgbmV3VmFsdWUgPSBtaW4gKiBiYXNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndpZGdldC5wdWJsaXNoKGtleSwgYCR7bmV3VmFsdWV9cHhgKTtcclxuICAgICAgICAodGhpcy5jYWxsYmFjaykoKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxucmgucmVnaXN0ZXJEYXRhQXR0cigncmVzaXplJywgUmVzaXplKTtcclxuIiwibGV0IHsgcmggfSA9IHdpbmRvdztcclxubGV0IHsgXyB9ID0gcmg7XHJcbmxldCB7ICQgfSA9IHJoO1xyXG5cclxuY2xhc3MgVGFibGUge1xyXG5cclxuICBjb25zdHJ1Y3Rvcih3aWRnZXQsIG5vZGUsIGtleSkge1xyXG4gICAgdGhpcy53aWRnZXQgPSB3aWRnZXQ7XHJcbiAgICB0aGlzLm5vZGUgPSBub2RlO1xyXG4gICAgdGhpcy53aWRnZXQucHVibGlzaChrZXksIHRoaXMuZXh0cmFjdFJvd0NvbHVtbk1hdHJpeCh0aGlzLm5vZGUpKTtcclxuICB9XHJcbiBcclxuICBleHRyYWN0Um93Q29sdW1uTWF0cml4KG5vZGUpIHtcclxuICAgIGxldCByb3dDb2xNYXRyaXggPSBbXTtcclxuICAgIGxldCByb3dFbGVtZW50cyA9IFtdO1xyXG4gICAgdGhpcy53aWRnZXQudHJhdmVyc2VOb2RlKG5vZGUsIGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgaWYgKCdURCcgPT09ICQubm9kZU5hbWUobm9kZSkpIHtcclxuICAgICAgICByb3dFbGVtZW50cy5wdXNoKCQuaW5uZXJIVE1MKG5vZGUpKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH0gZWxzZSBpZiAoJ1RSJyA9PT0gJC5ub2RlTmFtZShub2RlKSkge1xyXG4gICAgICAgIGlmIChyb3dFbGVtZW50cy5sZW5ndGggIT09IDApIHsgcm93Q29sTWF0cml4LnB1c2gocm93RWxlbWVudHMpOyB9XHJcbiAgICAgICAgcm93RWxlbWVudHMgPSBbXTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgaWYgKHJvd0VsZW1lbnRzLmxlbmd0aCAhPT0gMCkgeyByb3dDb2xNYXRyaXgucHVzaChyb3dFbGVtZW50cyk7IH1cclxuICAgIHJldHVybiByb3dDb2xNYXRyaXg7XHJcbiAgfVxyXG59XHJcblxyXG5yaC5yZWdpc3RlckRhdGFBdHRyKCd0YWJsZScsIFRhYmxlKTtcclxuIiwibGV0IHsgcmggfSA9IHdpbmRvdztcclxubGV0IHsgXyB9ID0gcmg7XHJcbmxldCB7ICQgfSA9IHJoO1xyXG5cclxuY2xhc3MgVGFibGVOZXN0ZWREYXRhIGV4dGVuZHMgcmguV2lkZ2V0IHtcclxuXHJcbiAgY29uc3RydWN0b3Iob3B0cykge1xyXG4gICAgc3VwZXIob3B0cyk7XHJcbiAgICB0aGlzLnJvd0NvbE1hdHJpeCA9IHRoaXMuZXh0cmFjdFJvd0NvbHVtbk1hdHJpeCh0aGlzLm5vZGUpO1xyXG4gIH1cclxuIFxyXG4gIGV4dHJhY3RSb3dDb2x1bW5NYXRyaXgobm9kZSkge1xyXG4gICAgbGV0IHJvd0NvbE1hdHJpeCA9IFtdO1xyXG4gICAgbGV0IHJvd0VsZW1lbnRzID0gW107XHJcbiAgICB0aGlzLnRyYXZlcnNlTm9kZShub2RlLCBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgIGlmICgnVEQnID09PSAkLm5vZGVOYW1lKG5vZGUpKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzT25seVRhYmxlKG5vZGUpKSB7XHJcbiAgICAgICAgICBsZXQgY2hpbGRNYXRyaXggPSB0aGlzLmV4dHJhY3RSb3dDb2x1bW5NYXRyaXgobm9kZS5jaGlsZHJlblswXSk7XHJcbiAgICAgICAgICBpZiAoY2hpbGRNYXRyaXgubGVuZ3RoICE9PSAwKSB7IHJvd0VsZW1lbnRzLnB1c2goe2NoaWxkOiBjaGlsZE1hdHJpeH0pOyB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJvd0VsZW1lbnRzLnB1c2goe2h0bWw6ICQuaW5uZXJIVE1MKG5vZGUpfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfSBlbHNlIGlmICgnVFInID09PSAkLm5vZGVOYW1lKG5vZGUpKSB7XHJcbiAgICAgICAgaWYgKHJvd0VsZW1lbnRzLmxlbmd0aCAhPT0gMCkgeyByb3dDb2xNYXRyaXgucHVzaChyb3dFbGVtZW50cyk7IH1cclxuICAgICAgICByb3dFbGVtZW50cyA9IFtdO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICBpZiAocm93RWxlbWVudHMubGVuZ3RoICE9PSAwKSB7IHJvd0NvbE1hdHJpeC5wdXNoKHJvd0VsZW1lbnRzKTsgfVxyXG4gICAgcmV0dXJuIHJvd0NvbE1hdHJpeDtcclxuICB9XHJcblxyXG4gIGhhc09ubHlUYWJsZShub2RlKSB7XHJcbiAgICByZXR1cm4gKChub2RlLmNoaWxkcmVuICE9IG51bGwgPyBub2RlLmNoaWxkcmVuLmxlbmd0aCA6IHVuZGVmaW5lZCkgPT09IDEpICYmICgnVEFCTEUnID09PSAkLm5vZGVOYW1lKG5vZGUuY2hpbGRyZW5bMF0pKTtcclxuICB9XHJcbn1cclxuXHJcbi8vcmgucmVnaXN0ZXJEYXRhQXR0ciAndGFibGVyJywgVGFibGVOZXN0ZWREYXRhXHJcbndpbmRvdy5yaC53aWRnZXRzLlRhYmxlTmVzdGVkRGF0YSA9IFRhYmxlTmVzdGVkRGF0YTsiLCIvL0phdmFTY3JpcHQgaGFuZGxlci5cclxubGV0IHJoID0gcmVxdWlyZShcIi4uLy4uL3NyYy9saWIvcmhcIilcclxuXHJcbnJoLkluZGlnb1NldFNpZGViYXIgPSBmdW5jdGlvbigpIHtcclxuXHR2YXIgc2lkZUJhclRvU2V0ID0gcmgubW9kZWwuZ2V0KHJoLmNvbnN0cygnU0lERUJBUl9TVEFURScpKTtcclxuXHJcblx0dmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJvZHlcIilbMF07XHJcblx0dmFyIHRvYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidG9jLWhvbGRlclwiKTtcclxuXHR2YXIgaWR4ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJpZHgtaG9sZGVyXCIpO1xyXG5cdHZhciBnbG8gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdsby1ob2xkZXJcIik7XHJcblx0dmFyIGZ0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZnRzLWhvbGRlclwiKTtcclxuXHR2YXIgZmlsdGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaWx0ZXItaG9sZGVyXCIpO1xyXG5cdHZhciBmYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZhdm9yaXRlcy1ob2xkZXJcIik7XHJcblx0dmFyIG1vYmlsZU1lbnUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vYmlsZS1tZW51LWhvbGRlclwiKTtcclxuXHJcblx0dmFyIHZpc2libGVDbGFzcyA9IFwibGF5b3V0LXZpc2libGVcIjtcclxuXHJcblx0dmFyIHNldFZpc2libGUgPSBmdW5jdGlvbihlbGVtKSB7XHJcblx0XHRpZih0eXBlb2YoZWxlbSkgIT0gXCJ1bmRlZmluZWRcIiAmJiBlbGVtICE9IG51bGwpIHtcclxuXHRcdFx0ZWxlbS5jbGFzc0xpc3QuYWRkKHZpc2libGVDbGFzcyk7XHJcblxyXG5cdFx0XHQvL0tleWJvYXJkIGZvY3VzIG9uIGZpcnN0IGxpbmsgZWxlbWVudCBpbiB0aGUgcG9wdXAtdmlzaWJsZS4gVGhpcyBhbGxvd3MgYmV0dGVyIGtleWJvYXJkIGFjY2Vzcy5cclxuXHRcdFx0dmFyIGlucHV0ID0gZWxlbS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImlucHV0XCIpWzBdO1xyXG5cdFx0XHRpZih0eXBlb2YoaW5wdXQpICE9IFwidW5kZWZpbmVkXCIgJiYgcmgubW9kZWwuZ2V0KHJoLmNvbnN0cygnS0VZX1NDUkVFTl9ERVNLVE9QJykpKSB7XHJcblx0XHRcdFx0aWYgKGlucHV0LmNsYXNzTGlzdC5jb250YWlucyhcIndTZWFyY2hGaWVsZFwiKSkge1xyXG5cdFx0XHRcdFx0cmgubW9kZWwuY3B1Ymxpc2goJ0VWVF9DTE9TRV9TRUFSQ0hfU1VHR0VTVElPTicsIHRydWUpO1xyXG5cdFx0XHRcdFx0c2V0VGltZW91dCgoKT0+e1xyXG5cdFx0XHRcdFx0XHRpbnB1dC5mb2N1cygpO1xyXG5cdFx0XHRcdFx0fSwzMDApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRlbHNle1xyXG5cdFx0XHRcdFx0aW5wdXQuZm9jdXMoKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSBpZiAocmgubW9kZWwuZ2V0KHJoLmNvbnN0cygnS0VZX1NDUkVFTl9ERVNLVE9QJykpKSB7XHJcblx0XHRcdFx0dmFyIGxpc3QgPSBlbGVtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwibGlcIik7XHJcblxyXG5cdFx0XHRcdGlmKHR5cGVvZihsaXN0WzBdKSAhPSBcInVuZGVmaW5lZFwiKSB7XHJcblx0XHRcdFx0XHRsaXN0WzBdLmZvY3VzKCk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdFx0XHR2YXIgbGlua3MgPSBlbGVtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYVwiKTtcclxuXHRcdFx0XHRcdGlmKHR5cGVvZihsaW5rc1sxXSkgIT0gXCJ1bmRlZmluZWRcIikge1xyXG5cdFx0XHRcdFx0XHRsaW5rc1sxXS5mb2N1cygpO1xyXG5cdFx0XHRcdFx0fSBlbHNlIGlmKHR5cGVvZihsaW5rc1swXSkgIT0gXCJ1bmRlZmluZWRcIikge1xyXG5cdFx0XHRcdFx0XHRsaW5rc1swXS5mb2N1cygpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHR2YXIgc2V0SGlkZGVuID0gZnVuY3Rpb24oZWxlbSkge1xyXG5cdFx0aWYodHlwZW9mKGVsZW0pICE9IFwidW5kZWZpbmVkXCIgJiYgZWxlbSAhPSBudWxsKSB7XHJcblx0XHRcdGVsZW0uY2xhc3NMaXN0LnJlbW92ZSh2aXNpYmxlQ2xhc3MpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIG1lbnVEZWxheSA9IFwiaGFzLWRlbGF5XCI7XHJcblx0dmFyIG1lbnVJbW1lZGlhdGUgPSBcIm5vLXRyYW5zZm9ybVwiO1xyXG5cclxuXHR2YXIgc2hvd090aGVyTWVudSA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0bW9iaWxlTWVudS5jbGFzc0xpc3QuYWRkKG1lbnVEZWxheSk7XHJcblxyXG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0XHRtb2JpbGVNZW51LmNsYXNzTGlzdC5yZW1vdmUobWVudURlbGF5KTtcclxuXHRcdFx0bW9iaWxlTWVudS5jbGFzc0xpc3QuYWRkKG1lbnVJbW1lZGlhdGUpO1xyXG5cdFx0fSw3NTApO1xyXG5cdH1cclxuXHJcblx0dmFyIGhpZGVPdGhlck1lbnUgPSBmdW5jdGlvbigpIHtcclxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0bW9iaWxlTWVudS5jbGFzc0xpc3QucmVtb3ZlKG1lbnVJbW1lZGlhdGUpO1xyXG5cdFx0fSwgNzUwKTtcclxuXHR9XHJcblxyXG5cdGJvZHkuY2xhc3NMaXN0LmFkZChcInBvcHVwLXZpc2libGVcIik7XHJcblxyXG5cdHN3aXRjaChzaWRlQmFyVG9TZXQpIHtcclxuXHRcdGNhc2UgXCJ0b2NcIjpcclxuXHRcdFx0c2hvd090aGVyTWVudSgpO1xyXG5cdFx0XHRzZXRWaXNpYmxlKHRvYyk7XHJcblx0XHRcdHNldEhpZGRlbihpZHgpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZ2xvKTtcclxuXHRcdFx0c2V0SGlkZGVuKGZ0cyk7XHJcblx0XHRcdHNldEhpZGRlbihmaWx0ZXIpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZmF2KTtcclxuXHRcdFx0c2V0SGlkZGVuKG1vYmlsZU1lbnUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgXCJpZHhcIjpcclxuXHRcdFx0c2hvd090aGVyTWVudSgpO1xyXG5cdFx0XHRzZXRWaXNpYmxlKGlkeCk7XHJcblx0XHRcdHNldEhpZGRlbih0b2MpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZ2xvKTtcclxuXHRcdFx0c2V0SGlkZGVuKGZ0cyk7XHJcblx0XHRcdHNldEhpZGRlbihmaWx0ZXIpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZmF2KTtcclxuXHRcdFx0c2V0SGlkZGVuKG1vYmlsZU1lbnUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgXCJnbG9cIjpcclxuXHRcdFx0c2hvd090aGVyTWVudSgpO1xyXG5cdFx0XHRzZXRWaXNpYmxlKGdsbyk7XHJcblx0XHRcdHNldEhpZGRlbihpZHgpO1xyXG5cdFx0XHRzZXRIaWRkZW4odG9jKTtcclxuXHRcdFx0c2V0SGlkZGVuKGZ0cyk7XHJcblx0XHRcdHNldEhpZGRlbihmaWx0ZXIpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZmF2KTtcclxuXHRcdFx0c2V0SGlkZGVuKG1vYmlsZU1lbnUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgXCJmdHNcIjpcclxuXHRcdFx0c2hvd090aGVyTWVudSgpO1xyXG5cdFx0XHRzZXRWaXNpYmxlKGZ0cyk7XHJcblx0XHRcdHNldEhpZGRlbihpZHgpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZ2xvKTtcclxuXHRcdFx0c2V0SGlkZGVuKHRvYyk7XHJcblx0XHRcdHNldEhpZGRlbihmaWx0ZXIpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZmF2KTtcclxuXHRcdFx0c2V0SGlkZGVuKG1vYmlsZU1lbnUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgXCJmaWx0ZXJcIjpcclxuXHRcdFx0c2hvd090aGVyTWVudSgpO1xyXG5cdFx0XHRzZXRWaXNpYmxlKGZpbHRlcik7XHJcblx0XHRcdHNldEhpZGRlbihpZHgpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZ2xvKTtcclxuXHRcdFx0c2V0SGlkZGVuKGZ0cyk7XHJcblx0XHRcdHNldEhpZGRlbih0b2MpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZmF2KTtcclxuXHRcdFx0c2V0SGlkZGVuKG1vYmlsZU1lbnUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgXCJmYXZvcml0ZXNcIjpcclxuXHRcdFx0c2hvd090aGVyTWVudSgpO1xyXG5cdFx0XHRzZXRWaXNpYmxlKGZhdik7XHJcblx0XHRcdHNldEhpZGRlbihpZHgpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZ2xvKTtcclxuXHRcdFx0c2V0SGlkZGVuKGZ0cyk7XHJcblx0XHRcdHNldEhpZGRlbih0b2MpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZmlsdGVyKTtcclxuXHRcdFx0c2V0SGlkZGVuKG1vYmlsZU1lbnUpO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgXCJtZW51XCI6XHJcblx0XHRcdHNldFZpc2libGUobW9iaWxlTWVudSk7XHJcblx0XHRcdGhpZGVPdGhlck1lbnUoKTtcclxuXHRcdFx0c2V0SGlkZGVuKGlkeCk7XHJcblx0XHRcdHNldEhpZGRlbihnbG8pO1xyXG5cdFx0XHRzZXRIaWRkZW4oZnRzKTtcclxuXHRcdFx0c2V0SGlkZGVuKHRvYyk7XHJcblx0XHRcdHNldEhpZGRlbihmYXYpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZmlsdGVyKTtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRkZWZhdWx0OiAvL05vdGhpbmcuIFNob3cgdG9waWNcclxuXHRcdFx0c2V0SGlkZGVuKGlkeCk7XHJcblx0XHRcdHNldEhpZGRlbihnbG8pO1xyXG5cdFx0XHRzZXRIaWRkZW4oZnRzKTtcclxuXHRcdFx0c2V0SGlkZGVuKHRvYyk7XHJcblx0XHRcdHNldEhpZGRlbihmaWx0ZXIpO1xyXG5cdFx0XHRzZXRIaWRkZW4oZmF2KTtcclxuXHRcdFx0c2V0SGlkZGVuKG1vYmlsZU1lbnUpO1xyXG5cdFx0XHRoaWRlT3RoZXJNZW51KCk7XHJcblx0XHRcdGJvZHkuY2xhc3NMaXN0LnJlbW92ZShcInBvcHVwLXZpc2libGVcIik7XHJcblx0XHRcdGlmKHJoLm1vZGVsLmdldChyaC5jb25zdHMoJ0tFWV9TQ1JFRU5fREVTS1RPUCcpKSkge1xyXG5cdFx0XHRcdHJoLkluZGlnb1NldEZvY3VzT25TZWFyY2goKTtcclxuXHRcdFx0fVxyXG5cdH1cclxufVxyXG5yaC5JbmRpZ29TZXRGb2N1c09uU2VhcmNoID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKTtcclxuXHRmb3IodmFyIGk9MDtpPGlucHV0Lmxlbmd0aDtpKyspe1xyXG5cdFx0aWYoaW5wdXRbaV0uY2xhc3NMaXN0LmNvbnRhaW5zKFwid1NlYXJjaEZpZWxkXCIpKXtcclxuXHRcdFx0cmgubW9kZWwuY3B1Ymxpc2goJ0VWVF9DTE9TRV9TRUFSQ0hfU1VHR0VTVElPTicsIHRydWUpO1xyXG5cdFx0XHRzZXRUaW1lb3V0KCgpPT57XHJcblx0XHRcdFx0aW5wdXRbaV0uZm9jdXMoKTtcclxuXHRcdFx0fSwzMDApO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcbn1cclxucmguSW5kaWdvU2V0U2lkZWJhclNlYXJjaCA9IGZ1bmN0aW9uKCkge1xyXG5cdHJoLm1vZGVsLnB1Ymxpc2gocmguY29uc3RzKFwiU0lERUJBUl9TVEFURVwiKSwgXCJmdHNcIik7XHJcbn1cclxucmguSW5kaWdvU2V0VHJhbnNpdGlvbkFsbG93ID0gZnVuY3Rpb24oKSB7XHJcblx0dmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJvZHlcIilbMF07XHJcblxyXG5cdHZhciBhbGxvd1Bob25lID0gXCJhbGxvdy1waG9uZS10cmFuc2l0aW9uc1wiO1xyXG5cdHZhciBhbGxvd1RhYmxldCA9IFwiYWxsb3ctdGFibGV0LXRyYW5zaXRpb25zXCI7XHJcblx0dmFyIGFsbG93RGVza3RvcCA9IFwiYWxsb3ctZGVza3RvcC10cmFuc2l0aW9uc1wiO1xyXG5cclxuXHRib2R5LmNsYXNzTGlzdC5yZW1vdmUoYWxsb3dQaG9uZSk7XHJcblx0Ym9keS5jbGFzc0xpc3QucmVtb3ZlKGFsbG93VGFibGV0KTtcclxuXHRib2R5LmNsYXNzTGlzdC5yZW1vdmUoYWxsb3dEZXNrdG9wKTtcclxuXHJcblx0dmFyIHRvU2V0ID0gZmFsc2U7XHJcblx0aWYocmgubW9kZWwuZ2V0KHJoLmNvbnN0cygnS0VZX1NDUkVFTl9QSE9ORScpKSA9PSB0cnVlKSB7XHJcblx0XHR0b1NldCA9IGFsbG93UGhvbmU7XHJcblx0fSBlbHNlIGlmKHJoLm1vZGVsLmdldChyaC5jb25zdHMoJ0tFWV9TQ1JFRU5fVEFCTEVUJykpID09IHRydWUpIHtcclxuXHRcdHRvU2V0ID0gYWxsb3dUYWJsZXQ7XHJcblx0fSBlbHNlIGlmKHJoLm1vZGVsLmdldChyaC5jb25zdHMoJ0tFWV9TQ1JFRU5fREVTS1RPUCcpKSA9PSB0cnVlKSB7XHJcblx0XHR0b1NldCA9IGFsbG93RGVza3RvcDtcclxuXHR9XHJcblxyXG5cdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHJcblx0XHRib2R5LmNsYXNzTGlzdC5yZW1vdmUoYWxsb3dQaG9uZSk7Ly9BbHdheXMgbWFrZSBzdXJlIHRoZXJlIGlzIG9ubHkgMVxyXG5cdFx0Ym9keS5jbGFzc0xpc3QucmVtb3ZlKGFsbG93VGFibGV0KTtcclxuXHRcdGJvZHkuY2xhc3NMaXN0LnJlbW92ZShhbGxvd0Rlc2t0b3ApO1xyXG5cclxuXHRcdGJvZHkuY2xhc3NMaXN0LmFkZCh0b1NldCk7XHJcblxyXG5cdH0sIDEwKTtcclxuXHJcbn1cclxuXHJcbnJoLmluaXRJbmRpZ28gPSAoKSA9PiB7XHJcblxyXG5cdHJoLm1vZGVsLnN1YnNjcmliZShyaC5jb25zdHMoXCJTSURFQkFSX1NUQVRFXCIpLCByaC5JbmRpZ29TZXRTaWRlYmFyKTtcclxuXHRyaC5tb2RlbC5zdWJzY3JpYmUocmguY29uc3RzKFwiRVZUX1NFQVJDSF9JTl9QUk9HUkVTU1wiKSwgcmguSW5kaWdvU2V0U2lkZWJhclNlYXJjaCk7XHJcblx0cmgubW9kZWwuc3Vic2NyaWJlKHJoLmNvbnN0cyhcIktFWV9TQ1JFRU5cIiksIHJoLkluZGlnb1NldFRyYW5zaXRpb25BbGxvdyk7XHJcblxyXG5cdC8vV2hlbiBvcGVuaW5nIHRoZSBwYWdlLCBjaGVjayB3aGV0aGVyIHRoZXJlIGlzIGEgaGlnaGxpZ2h0IHRlcm0uXHJcblx0Ly9JZiBmb3VuZCwgYWRkIGl0IHRvIHRoZSBzZWFyY2ggYm94XHJcblx0c2V0VGltZW91dChmdW5jdGlvbigpe1xyXG5cdFx0dmFyIGhpZ2hsaWdodCA9IGdldFVybFBhcmFtZXRlcihSSEhJR0hMSUdIVFRFUk0pO1xyXG5cdFx0aWYoaGlnaGxpZ2h0ICE9IFwiXCIpIHtcclxuXHRcdFx0dmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJpbnB1dFwiKTtcclxuXHRcdFx0Zm9yKHZhciBpPTA7aTxpbnB1dC5sZW5ndGg7aSsrKXtcclxuXHRcdFx0XHRpZihpbnB1dFtpXS5jbGFzc0xpc3QuY29udGFpbnMoXCJ3U2VhcmNoRmllbGRcIikpe1xyXG5cdFx0XHRcdFx0aW5wdXRbaV0udmFsdWUgPSBoaWdobGlnaHQ7XHJcblx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuICAgIHJoLm1vZGVsLnB1Ymxpc2gocmguY29uc3RzKCdLRVlfU0VBUkNIX1RFUk0nKSwgaGlnaGxpZ2h0KTtcclxuXHQgIH1cclxuICB9LCAyNTApO1xyXG5cclxuXHQvL0ZvciBLZXlib2FyZCBhY2Nlc3NpYmlsaXR5LCBnZXQgdGhlIEVTQyBrZXkgdG8gY2xvc2Ugb3ZlcmxheXNcclxuXHRkb2N1bWVudC5vbmtleWRvd24gPSBmdW5jdGlvbihldnQpIHtcclxuXHRcdGV2dCA9IGV2dCB8fCB3aW5kb3cuZXZlbnQ7XHJcblx0XHRpZiAoZXZ0LmtleUNvZGUgPT0gMjcpIHtcclxuXHRcdFx0cmgubW9kZWwucHVibGlzaChyaC5jb25zdHMoJ1NJREVCQVJfU1RBVEUnKSwgZmFsc2UpO1xyXG5cdFx0XHRyaC5JbmRpZ29TZXRGb2N1c09uU2VhcmNoKCk7Ly9Gb2N1cyBvbiB0aGUgc2VhcmNoIGZvciBrZXlib2FyZCBhY2Nlc3NpYmlsaXR5XHJcblx0XHR9XHJcblx0fTtcclxufVxyXG4iLCJsZXQgeyBfIH0gPSB3aW5kb3cucmg7XHJcblxyXG5cclxuXy5zdGFja1RyYWNlID0gZnVuY3Rpb24oKSB7XHJcbiAgbGV0IGVyciA9IG5ldyBFcnJvcigpO1xyXG4gIHJldHVybiBlcnIuc3RhY2s7XHJcbn07XHJcblxyXG5fLnNhZmVFeGVjID0gZm4gPT5cclxuICBmdW5jdGlvbigpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgaWYgKHJoLl9kZWJ1ZykgeyByaC5fZCgnZXJyb3InLCBgRnVuY3Rpb246ICR7Zm59YCwgZXJyb3IubWVzc2FnZSk7IH1cclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICB9XHJcbjtcclxuIiwibGV0IHsgXyB9ID0gd2luZG93LnJoO1xyXG5cclxuXHJcbl8uYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKG9iaiwgZXZlbnROYW1lLCBjYWxsYmFjaykge1xyXG4gIGlmIChvYmogPT0gbnVsbCkgeyBvYmogPSB3aW5kb3c7IH1cclxuICBpZiAob2JqLmFkZEV2ZW50TGlzdGVuZXIgIT0gbnVsbCkge1xyXG4gICAgcmV0dXJuIG9iai5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgY2FsbGJhY2ssIGZhbHNlKTtcclxuICB9IGVsc2UgaWYgKG9iai5hdHRhY2hFdmVudCAhPSBudWxsKSB7XHJcbiAgICByZXR1cm4gb2JqLmF0dGFjaEV2ZW50KGBvbiR7ZXZlbnROYW1lfWAsIGNhbGxiYWNrKTtcclxuICB9XHJcbn07XHJcblxyXG5fLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihvYmosIGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcclxuICBpZiAob2JqID09IG51bGwpIHsgb2JqID0gd2luZG93OyB9XHJcbiAgaWYgKG9iai5yZW1vdmVFdmVudExpc3RlbmVyICE9IG51bGwpIHtcclxuICAgIHJldHVybiBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrLCBmYWxzZSk7XHJcbiAgfSBlbHNlIGlmIChvYmouZGV0YWNoRXZlbnQgIT0gbnVsbCkge1xyXG4gICAgcmV0dXJuIG9iai5kZXRhY2hFdmVudChgb24ke2V2ZW50TmFtZX1gLCBjYWxsYmFjayk7XHJcbiAgfVxyXG59O1xyXG5cclxuXy5pc1RvdWNoRW5hYmxlZCA9ICgpID0+ICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcclxuXHJcbl8ucHJldmVudERlZmF1bHQgPSBmdW5jdGlvbihlKSB7XHJcbiAgaWYgKGUucHJldmVudERlZmF1bHQgIT0gbnVsbCkge1xyXG4gICAgcmV0dXJuIGUucHJldmVudERlZmF1bHQoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG5fLm1vdXNlQnV0dG9uID0gZnVuY3Rpb24oZSkge1xyXG4gIGlmICgnYnV0dG9ucycgaW4gZSkge1xyXG4gICAgcmV0dXJuIGUuYnV0dG9ucztcclxuICB9IGVsc2UgaWYgKCd3aGljaCcgaW4gZSkge1xyXG4gICAgcmV0dXJuIGUud2hpY2g7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBlLmJ1dHRvbjtcclxuICB9XHJcbn07XHJcblxyXG5fLmluaXRNb3VzZU1vdmUgPSAoZnVuY3Rpb24oKSB7XHJcbiAgbGV0IGluaXREb25lID0gZmFsc2U7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKCFpbml0RG9uZSkge1xyXG4gICAgICBpbml0RG9uZSA9IHRydWU7XHJcbiAgICAgIHJldHVybiBfLmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgaWYgKCFlLmRlZmF1bHRQcmV2ZW50ZWQpIHtcclxuICAgICAgICAgIGxldCBvYmogPSB7eDogZS5jbGllbnRYLCB5OiBlLmNsaWVudFksIHdoaWNoOiBfLm1vdXNlQnV0dG9uKGUpfTtcclxuICAgICAgICAgIHJoLm1vZGVsLnB1Ymxpc2gocmguY29uc3RzKCdFVlRfTU9VU0VNT1ZFJyksIG9iaiwge3N5bmM6IHRydWV9KTtcclxuICAgICAgICAgIGlmIChvYmouZGVmYXVsdFByZXZlbnRlZCkgeyByZXR1cm4gXy5wcmV2ZW50RGVmYXVsdChlKTsgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxufSkoKTtcclxuXHJcbl8uaW5pdFRvdWNoRXZlbnQgPSAoZnVuY3Rpb24oKSB7XHJcbiAgbGV0IGluaXREb25lID0gZmFsc2U7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgaWYgKCFpbml0RG9uZSAmJiBfLmlzVG91Y2hFbmFibGVkKCkpIHtcclxuICAgICAgbGV0IHgsIHksIHkxO1xyXG4gICAgICBpbml0RG9uZSA9IHRydWU7XHJcbiAgICAgIGxldCB4MSA9ICh5MSA9ICh4ID0gKHkgPSAwKSkpO1xyXG4gIFxyXG4gICAgICBsZXQgY2FsY3VsYXRlRGlyZWN0aW9uID0gXy5kZWJvdW5jZShmdW5jdGlvbigpIHtcclxuICAgICAgICBsZXQgZGlyZWN0aW9uO1xyXG4gICAgICAgIGxldCBhbmdsZSA9IE1hdGguYXRhbigoeTEgLSB5KSAvICh4MSAtIHgpKTtcclxuICAgICAgICBpZiAoeDEgPiB4KSB7XHJcbiAgICAgICAgICBkaXJlY3Rpb24gPVxyXG4gICAgICAgICAgICBhbmdsZSA+IChNYXRoLlBJIC8gNCkgP1xyXG4gICAgICAgICAgICAgICdkb3duJ1xyXG4gICAgICAgICAgICA6IGFuZ2xlIDwgKC1NYXRoLlBJIC8gNCkgP1xyXG4gICAgICAgICAgICAgICd1cCdcclxuICAgICAgICAgICAgOlxyXG4gICAgICAgICAgICAgICdyaWdodCc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGRpcmVjdGlvbiA9XHJcbiAgICAgICAgICAgIGFuZ2xlID4gKE1hdGguUEkgLyA0KSA/XHJcbiAgICAgICAgICAgICAgJ3VwJ1xyXG4gICAgICAgICAgICA6IGFuZ2xlIDwgKC1NYXRoLlBJIC8gNCkgP1xyXG4gICAgICAgICAgICAgICdkb3duJ1xyXG4gICAgICAgICAgICA6XHJcbiAgICAgICAgICAgICAgJ2xlZnQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICByaC5tb2RlbC5wdWJsaXNoKCcudG91Y2htb3ZlJywge3gsIHksIHgxLCB5MX0pO1xyXG4gICAgICAgIHJoLm1vZGVsLnB1Ymxpc2gocmguY29uc3RzKCdFVlRfU1dJUEVfRElSJyksIGRpcmVjdGlvbiwge3N5bmM6IHRydWV9KTtcclxuICAgICAgICByaC5tb2RlbC5wdWJsaXNoKHJoLmNvbnN0cygnRVZUX1NXSVBFX0RJUicpLCBudWxsKTtcclxuICAgICAgICByZXR1cm4geCA9ICh5ID0gMCk7XHJcbiAgICAgIH1cclxuICAgICAgLCAyMDApO1xyXG5cclxuICAgICAgcmV0dXJuIF8uYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ3RvdWNobW92ZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICB4MSA9IChlLnRvdWNoZXNbMF0gIT0gbnVsbCA/IGUudG91Y2hlc1swXS5wYWdlWCA6IHVuZGVmaW5lZCkgfHwgMDtcclxuICAgICAgICB5MSA9IChlLnRvdWNoZXNbMF0gIT0gbnVsbCA/IGUudG91Y2hlc1swXS5wYWdlWSA6IHVuZGVmaW5lZCkgfHwgMDtcclxuICAgICAgICBpZiAoKHggPT09IDApICYmICh5ID09PSAwKSkge1xyXG4gICAgICAgICAgeCA9IHgxO1xyXG4gICAgICAgICAgeSA9IHkxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2FsY3VsYXRlRGlyZWN0aW9uKCk7XHJcbiAgICAgICAgcmV0dXJuIF8ucHJldmVudERlZmF1bHQoZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcbn0pKCk7XHJcbiIsImxldCB7IF8gfSA9IHdpbmRvdy5yaDtcclxuXHJcbi8vIFJlZ3VsYXIgRXhwcmVzc2lvbnNcclxuXHJcbi8vIEV4OiBAa2V5KCd3b3cnKSA9PiB0aGlzLnB1Ymxpc2goJ2tleScsICd3b3cnKTtcclxubGV0IHB1Ymxpc2hSZWd4ID0gLyhefFteXFxcXF0pQChbXFx3XFwuXSopXFwoKC4qKVxcKS87XHJcblxyXG4vLyBFeDogeCA9IEBrZXkgPT4geCA9IHRoaXMuZ2V0KCdrZXknKTtcclxubGV0IGdldFJlZ3ggPSAvKF58W15cXFxcXSlAKFtcXHdcXC5dKikvO1xyXG5cclxuLy8gRXg6IHggPSBAS0VZID0+IHggPSByaC5jb25zdHMoJ0tFWScpXHJcbmxldCBtb2RlbENvbnN0c1JlZ3ggPSAvQChbQS1aXVtfQS1aMC05XSopLztcclxuXHJcblxyXG5fLnJlc29sdmVQdWJsaXNoID0gZnVuY3Rpb24oZXhwcmVzc2lvbikge1xyXG4gIGxldCByZWdleCA9IG5ldyBSZWdFeHAocHVibGlzaFJlZ3gpO1xyXG4gIHdoaWxlICh0cnVlKSB7XHJcbiAgICBsZXQgbWF0Y2ggPSByZWdleC5leGVjKGV4cHJlc3Npb24pO1xyXG4gICAgaWYgKCFtYXRjaCkgeyBicmVhazsgfVxyXG4gICAgZXhwcmVzc2lvbiA9IGV4cHJlc3Npb24ucmVwbGFjZShtYXRjaFswXSxcclxuICAgICAgYCR7bWF0Y2hbMV19IHRoaXMucHVibGlzaCgnJHttYXRjaFsyXX0nLCAke21hdGNoWzNdfSlgKTtcclxuICB9XHJcbiAgcmV0dXJuIGV4cHJlc3Npb247XHJcbn07XHJcblxyXG5fLnJlc29sdmVHZXQgPSBmdW5jdGlvbihleHByZXNzaW9uLCBrZXlzKSB7XHJcbiAgbGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChnZXRSZWd4KTtcclxuICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgbGV0IG1hdGNoID0gcmVnZXguZXhlYyhleHByZXNzaW9uKTtcclxuICAgIGlmICghbWF0Y2gpIHsgYnJlYWs7IH1cclxuICAgIGlmIChrZXlzICYmICgtMSA9PT0ga2V5cy5pbmRleE9mKG1hdGNoWzJdKSkpIHsga2V5cy5wdXNoKG1hdGNoWzJdKTsgfVxyXG4gICAgZXhwcmVzc2lvbiA9IGV4cHJlc3Npb24ucmVwbGFjZShtYXRjaFswXSxcclxuICAgICAgYCR7bWF0Y2hbMV19IHRoaXMuZ2V0KCcke21hdGNoWzJdfScpYCk7XHJcbiAgfVxyXG4gIHJldHVybiBleHByZXNzaW9uO1xyXG59O1xyXG5cclxuXy5yZXNvbHZlTW9kZWxDb25zdCA9IGZ1bmN0aW9uKGV4cHJlc3Npb24pIHtcclxuICBsZXQgc3ViZXhwID0gJyc7XHJcbiAgbGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChtb2RlbENvbnN0c1JlZ3gpO1xyXG4gIHdoaWxlICh0cnVlKSB7XHJcbiAgICBsZXQgbWF0Y2ggPSByZWdleC5leGVjKGV4cHJlc3Npb24pO1xyXG4gICAgaWYgKCFtYXRjaCkgeyBicmVhazsgfVxyXG4gICAgbGV0IGtleSA9IHJoLmNvbnN0cyhtYXRjaFsxXSk7XHJcbiAgICBpZiAoa2V5ICE9IG51bGwpIHtcclxuICAgICAgZXhwcmVzc2lvbiA9IGV4cHJlc3Npb24ucmVwbGFjZShtYXRjaFswXSwgYEAke2tleX1gKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGxldCBpbmRleCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMV0ubGVuZ3RoICsgMTtcclxuICAgICAgc3ViZXhwICs9IGV4cHJlc3Npb24uc3Vic3RyaW5nKDAsIGluZGV4KTtcclxuICAgICAgZXhwcmVzc2lvbiA9IGV4cHJlc3Npb24uc3Vic3RyaW5nKGluZGV4KTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHN1YmV4cCArIGV4cHJlc3Npb247XHJcbn07XHJcblxyXG5fLnJlc29sdmVNb2RlbEtleXMgPSBmdW5jdGlvbihleHByZXNzaW9uLCBrZXlzKSB7XHJcbiAgcmV0dXJuIHRoaXMucmVzb2x2ZUdldCh0aGlzLnJlc29sdmVQdWJsaXNoKHRoaXMucmVzb2x2ZU1vZGVsQ29uc3QoZXhwcmVzc2lvbikpLCBrZXlzKTtcclxufTtcclxuXHJcbl8uaXNWYWxpZE1vZGVsS2V5ID0gZnVuY3Rpb24oa2V5KSB7XHJcbiAgaWYgKChrZXkgPT09ICd0cnVlJykgfHwgKGtleSA9PT0gJ2ZhbHNlJykpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgbGV0IG1hdGNoID0ga2V5Lm1hdGNoKC9bLl9hLXpBLVpdWy5fYS16QS1aMC05IF0qLyk7XHJcbiAgcmV0dXJuIG1hdGNoICYmIChtYXRjaFswXSA9PT0ga2V5KTtcclxufTtcclxuXHJcbl8uaXNWYWxpZE1vZGVsQ29uc3RLZXkgPSBmdW5jdGlvbihrZXkpIHtcclxuICBsZXQgbWF0Y2ggPSBrZXkubWF0Y2goL1tBLVpdW19BLVowLTldKi8pO1xyXG4gIHJldHVybiBtYXRjaCAmJiAobWF0Y2hbMF0gPT09IGtleSk7XHJcbn07XHJcblxyXG5fLmdldCA9IGZ1bmN0aW9uKG9iaiwgaXRlbUtleSkge1xyXG4gIGxldCB2YWx1ZTtcclxuICBsZXQga2V5cyA9IGl0ZW1LZXkuc3BsaXQoJy4nKTtcclxuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwga2V5cy5sZW5ndGg7IGluZGV4KyspIHtcclxuICAgIGxldCBrZXkgPSBrZXlzW2luZGV4XTtcclxuICAgIGlmIChpbmRleCA9PT0gMCkge1xyXG4gICAgICB2YWx1ZSA9IG9ialtrZXldO1xyXG4gICAgfSBlbHNlIGlmICh2YWx1ZSkge1xyXG4gICAgICB2YWx1ZSA9IHZhbHVlW2tleV07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHZhbHVlO1xyXG59O1xyXG5cclxuXy5pc1NjcmVlbkF0dGFjaGVkID0gc2NycmVuTmFtZSA9PiB0cnVlID09PSByaC5tb2RlbC5nZXQoYCR7cmguY29uc3RzKCdLRVlfU0NSRUVOJyl9LiR7c2NycmVuTmFtZX0uYXR0YWNoZWRgKTtcclxuXHJcbl8ucGFyZW50S2V5ID0gZnVuY3Rpb24oZnVsbEtleSkge1xyXG4gIGxldCBrZXlzID0gZnVsbEtleS5zcGxpdCgnLicpO1xyXG4gIChrZXlzLnBvcCkoKTtcclxuICByZXR1cm4ga2V5cy5qb2luKCcuJyk7XHJcbn07XHJcblxyXG5fLmxhc3RLZXkgPSBmdW5jdGlvbihmdWxsS2V5KSB7XHJcbiAgbGV0IGtleXMgPSBmdWxsS2V5LnNwbGl0KCcuJyk7XHJcbiAgcmV0dXJuIGtleXNba2V5cy5sZW5ndGggLSAxXTtcclxufTtcclxuXHJcbl8uc3BsaXRLZXkgPSBmdW5jdGlvbihmdWxsS2V5KSB7XHJcbiAgbGV0IGtleXMgPSBmdWxsS2V5LnNwbGl0KCcuJyk7XHJcbiAgbGV0IGtleSA9IChrZXlzLnBvcCkoKTtcclxuICBsZXQgcGFyZW50S2V5ID0ga2V5cy5qb2luKCcuJyk7XHJcbiAgcmV0dXJuIHtrZXksIHBhcmVudEtleX07XHJcbn07XHJcbiIsImxldCB7IF8gfSA9IHdpbmRvdy5yaDtcclxuXHJcbi8vUmVndWxhciBFeHByZXNzaW9uc1xyXG5cclxuLy9FeDogXCJhYmMgI3t2YXIxfVwiXHJcbmxldCBlbmNsb3NlZFZhclJlZ3ggPSAvXFwjeyhbXn1dKilcXH0vZztcclxubGV0IHVzZXJWYXJSZWd4ID0gL1xcJChbX2EtekEtWl1bX2EtekEtWjAtOV0qKS9nO1xyXG5sZXQgcmVneFN0cmluZ1JlZ3ggPSAvXFxCXFwvKFteXFwvXSopXFwvL2c7XHJcblxyXG5fLnRvUmVnRXhwID0gZnVuY3Rpb24oc3RyKSB7XHJcbiAgbGV0IHJlZ3g7XHJcbiAgaWYgKCFzdHIgfHwgIV8uaXNTdHJpbmcoc3RyKSkgeyByZXR1cm4gc3RyOyB9XHJcbiAgbGV0IG1hdGNoZXMgPSBzdHIubWF0Y2gocmVneFN0cmluZ1JlZ3gpO1xyXG4gIGxldCBtYXRjaCA9IG1hdGNoZXMgJiYgbWF0Y2hlc1swXTtcclxuICBpZiAobWF0Y2gpIHtcclxuICAgIGxldCBwYXR0ZXJuID0gbWF0Y2guc3Vic3RyaW5nKDEsIG1hdGNoLmxlbmd0aCAtIDEpO1xyXG4gICAgbGV0IGZsYWcgPSBzdHIuc3Vic3RyaW5nKG1hdGNoLmxlbmd0aCk7XHJcbiAgICByZWd4ID0gbmV3IFJlZ0V4cChwYXR0ZXJuLCBmbGFnKTtcclxuICB9XHJcbiAgcmV0dXJuIHJlZ3ggfHwgc3RyO1xyXG59O1xyXG5cclxuXy5zcGxpdEFuZFRyaW0gPSBmdW5jdGlvbihzdHJpbmcsIHNwbGl0S2V5KSB7XHJcbiAgaWYgKHN0cmluZyA9PSBudWxsKSB7IHN0cmluZyA9ICcnOyB9XHJcbiAgcmV0dXJuIF8ubWFwKHN0cmluZy5zcGxpdChzcGxpdEtleSksIHZhbHVlID0+IHZhbHVlLnRyaW0oKSk7XHJcbn07XHJcblxyXG4vKlxyXG4gKiBFeHBsb2RlcyBhIHN0cmluZyBiYXNlZCBvbiBleHBsb2RlS2V5IHRoZW5cclxuICogY3JlYXRlcyBhIG1hcCB1c2luZyB0aGUgZXhwbG9kZWQgc3RyaW5ncyBieSBzcGxpdHRpbmcgdGhlbSBmdXJ0aGVyIG9uIG1hcEtleVxyXG4gKi9cclxuXy5leHBsb2RlQW5kTWFwID0gZnVuY3Rpb24oc3RyaW5nLCBleHBsb2RlS2V5LCBtYXBLZXksIG9wdHMpIHtcclxuICBpZiAoc3RyaW5nID09IG51bGwpIHsgc3RyaW5nID0gJyAnOyB9XHJcbiAgaWYgKG9wdHMgPT0gbnVsbCkgeyBvcHRzID0ge307IH1cclxuICBsZXQgcGFpcnMgPSBzdHJpbmcuc3BsaXQoZXhwbG9kZUtleSk7XHJcbiAgbGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChgJHttYXBLZXl9KC4rKT9gKTtcclxuICBsZXQgbWFwID0ge307XHJcblxyXG4gIGZvciAobGV0IHJhd1BhaXIgb2YgQXJyYXkuZnJvbShwYWlycykpIHtcclxuICAgIGxldCBwYWlyID0gcmF3UGFpci5zcGxpdChyZWdleCk7XHJcbiAgICBsZXQga2V5ID0gcGFpclswXS50cmltKCk7XHJcbiAgICBsZXQgdmFsdWUgPSBwYWlyWzFdO1xyXG5cclxuICAgIGlmIChvcHRzLmNhc2VJbnNlbnNpdGl2ZSkgeyBrZXkgPSBrZXkudG9Mb3dlckNhc2UoKTsgfVxyXG4gICAgaWYgKG9wdHMudHJpbSkgeyB2YWx1ZSA9IHZhbHVlICYmIHZhbHVlLnRyaW0oKTsgfVxyXG4gICAgaWYgKChvcHRzLmRlZmF1bHQgIT0gbnVsbCkgJiYgKHZhbHVlID09IG51bGwpKSB7IHZhbHVlID0gb3B0cy5kZWZhdWx0OyB9XHJcblxyXG4gICAgaWYgKGtleSAhPT0gJycpIHsgbWFwW2tleV0gPSB2YWx1ZTsgfVxyXG4gIH1cclxuICByZXR1cm4gbWFwO1xyXG59O1xyXG5cclxuXy5yZXNvbHZlTmFtZWRWYXIgPSBmdW5jdGlvbihleHByKSB7XHJcbiAgbGV0IG1hdGNoZXM7XHJcbiAgaWYgKG1hdGNoZXMgPSBleHByLm1hdGNoKHVzZXJWYXJSZWd4KSkge1xyXG4gICAgZm9yIChsZXQgbWF0Y2ggb2YgQXJyYXkuZnJvbShtYXRjaGVzKSkge1xyXG4gICAgICBleHByID0gZXhwci5yZXBsYWNlKG1hdGNoLCBgdGhpcy51c2VyX3ZhcnMuJHttYXRjaC5zdWJzdHJpbmcoMSl9YCk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBleHByO1xyXG59O1xyXG5cclxuXy5yZXNvbHZlRW5jbG9zZWRWYXIgPSBmdW5jdGlvbihleHByLCBjYWxsYmFjaywgY29udGV4dCkge1xyXG4gIGxldCBtYXRjaGVzO1xyXG4gIGlmIChjb250ZXh0ID09IG51bGwpIHsgY29udGV4dCA9IHRoaXM7IH1cclxuICBpZiAobWF0Y2hlcyA9IGV4cHIubWF0Y2goZW5jbG9zZWRWYXJSZWd4KSkge1xyXG4gICAgZm9yIChsZXQgbWF0Y2ggb2YgQXJyYXkuZnJvbShtYXRjaGVzKSkge1xyXG4gICAgICBsZXQgbmFtZSA9IG1hdGNoLnN1YnN0cmluZygyLCBtYXRjaC5sZW5ndGggLSAxKS50cmltKCk7XHJcbiAgICAgIGxldCB2YWx1ZSA9IGNhbGxiYWNrLmNhbGwoY29udGV4dCwgbmFtZSk7XHJcbiAgICAgIGV4cHIgPSBleHByLnJlcGxhY2UobWF0Y2gsICh2YWx1ZSAhPSBudWxsKSA/IHZhbHVlIDogJycpO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZXhwcjtcclxufTtcclxuXHJcbi8vIHVzZSAnLicgYXMgYXR0cmliIG5hbWUgdG8gcGFzcyBvcHRzIGZvciBhdHRycyBkYXRhXHJcbl8ucmVzb2x2ZUF0dHIgPSBzdHJpbmcgPT5cclxuICBfLnJlZHVjZShfLmV4cGxvZGVBbmRNYXAoc3RyaW5nLCAnOycsICc6JyksIGZ1bmN0aW9uKHIsIHYsIGspIHtcclxuICAgIF8uZWFjaChrLnNwbGl0KCcsJyksIGtleSA9PiByW2tleS50cmltKCldID0gdik7XHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcbiAgLCB7fSlcclxuO1xyXG5cclxuXy5yZXNvbHZlTmljZUpTT04gPSBmdW5jdGlvbihzdHJpbmcpIHtcclxuICBpZiAoc3RyaW5nID09IG51bGwpIHsgc3RyaW5nID0gJyc7IH1cclxuICBzdHJpbmcgPSAoc3RyaW5nLnRyaW0pKCk7XHJcbiAgaWYgKCFzdHJpbmcpIHsgcmV0dXJuIHt9OyB9XHJcbiAgaWYgKHN0cmluZ1swXSA9PT0gJ3snKSB7XHJcbiAgICByZXR1cm4gSlNPTi5wYXJzZShzdHJpbmcpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzdHJpbmcgPSBzdHJpbmcucmVwbGFjZSgvJy9nLCAnXCInKTtcclxuICAgIHN0cmluZyA9IGB7JHtzdHJpbmd9fWA7XHJcbiAgICByZXR1cm4gSlNPTi5wYXJzZShzdHJpbmcucmVwbGFjZSgvKFxce3wsKVxccyooLis/KVxccyo6L2csICckMSBcIiQyXCI6JykpO1xyXG4gIH1cclxufTtcclxuXHJcbl8ucmVzb2x2ZVBpcGVkRXhwcmVzc2lvbiA9IGZ1bmN0aW9uKHN0cmluZykge1xyXG4gIGlmIChzdHJpbmcgPT0gbnVsbCkgeyBzdHJpbmcgPSAnJzsgfVxyXG4gIGxldCBjb25jYXROZXh0ID0gZmFsc2U7XHJcbiAgcmV0dXJuIF8ucmVkdWNlKHN0cmluZy5zcGxpdCgnfCcpLCBmdW5jdGlvbihyZXN1bHQsIGl0ZW0pIHtcclxuICAgIGxldCBtZXJnZWRJdGVtO1xyXG4gICAgaWYgKGNvbmNhdE5leHQgJiYgKHJlc3VsdC5sZW5ndGggPiAwKSkge1xyXG4gICAgICBtZXJnZWRJdGVtID0gYCR7cmVzdWx0W3Jlc3VsdC5sZW5ndGggLSAxXX0gfHwke2l0ZW19YDtcclxuICAgICAgcmVzdWx0Lmxlbmd0aCA9IHJlc3VsdC5sZW5ndGggLSAxO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjb25jYXROZXh0ID0gaXRlbS5sZW5ndGggPT09IDA7XHJcbiAgICBpZiAobWVyZ2VkSXRlbSkgeyBpdGVtID0gbWVyZ2VkSXRlbTsgfVxyXG4gICAgXHJcbiAgICBpZiAoaXRlbS5sZW5ndGggIT09IDApIHsgcmVzdWx0LnB1c2goaXRlbS50cmltKCkpOyB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuICAsIFtdKTtcclxufTtcclxuXHJcbl8ucmVzb2x2ZUxvb3BFeHByID0gZnVuY3Rpb24oY29uZmlnKSB7XHJcbiAgbGV0IHZhbHVlID0gY29uZmlnLnNwbGl0KCc6Jyk7XHJcbiAgaWYgKHZhbHVlLmxlbmd0aCA+IDEpIHtcclxuICAgIGxldCB2YXJzID0gXy5zcGxpdEFuZFRyaW0odmFsdWUuc2hpZnQoKSwgJywnKTtcclxuICAgIHJldHVybiB7ZXhwcjogdmFsdWVbMF0sIGluZGV4OiB2YXJzWzBdLCBpdGVtOiB2YXJzWzFdfTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHtleHByOiB2YWx1ZVswXX07XHJcbiAgfVxyXG59O1xyXG5cclxuXy5yZXNvbHZlV2lkZ2V0QXJncyA9IGZ1bmN0aW9uKHJhd0FyZ3MpIHtcclxuICBsZXQgcGFpcnMgPSByYXdBcmdzLnNwbGl0KCc7Jyk7XHJcbiAgcmV0dXJuIF8ubWFwKHBhaXJzLCBmdW5jdGlvbihwYWlyKSB7XHJcbiAgICBsZXQgd0FyZztcclxuICAgIGxldCBwaXBlZEFyZ3MgPSBfLnJlc29sdmVQaXBlZEV4cHJlc3Npb24ocGFpcik7XHJcbiAgICBsZXQgYXJncyA9IChwaXBlZEFyZ3Muc2hpZnQpKCkgfHwgJyc7XHJcbiAgICBhcmdzID0gYXJncy5zcGxpdCgvOiguKyk/Lyk7XHJcbiAgICBsZXQgd05hbWUgPSBhcmdzWzBdLnRyaW0oKTtcclxuICAgIGxldCByYXdBcmcgPSBwYWlyLnN1YnN0cmluZyh3TmFtZS5sZW5ndGgpLnRyaW0oKTtcclxuICAgIGlmIChyYXdBcmdbMF0gPT09ICc6JykgeyByYXdBcmcgPSByYXdBcmcuc3Vic3RyaW5nKDEpOyB9XHJcbiAgICBpZiAod0FyZyA9IGFyZ3NbMV0pIHtcclxuICAgICAgaWYgKC0xICE9PSB3QXJnLnNlYXJjaCgnOicpKSB7XHJcbiAgICAgICAgd0FyZyA9IF8uZXhwbG9kZUFuZE1hcCh3QXJnLCAnLCcsICc6Jywge3RyaW06IHRydWV9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB3QXJnID0ge2FyZzogd0FyZ307XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB7d05hbWUsIHdBcmcsIHBpcGVkQXJncywgcmF3QXJnfTtcclxufSk7XHJcbn07XHJcblxyXG5fLnJlc29sdmVFeHByT3B0aW9ucyA9IGZ1bmN0aW9uKHJhd0FyZ3MpIHtcclxuICBsZXQgb3B0cztcclxuICBsZXQgdmFsdWVzID0gXy5yZXNvbHZlUGlwZWRFeHByZXNzaW9uKHJhd0FyZ3MpO1xyXG4gIGlmICh2YWx1ZXNbMV0pIHsgb3B0cyA9IF8ucmVzb2x2ZU5pY2VKU09OKHZhbHVlc1sxXSk7IH1cclxuICByZXR1cm4ge2V4cHI6IHZhbHVlc1swXSwgb3B0c307XHJcbn07XHJcblxyXG5fLnJlc29sdmVJbnB1dEtleXMgPSBmdW5jdGlvbihyYXdBcmdzKSB7XHJcbiAgbGV0IG9wdHM7XHJcbiAgbGV0IHZhbHVlcyA9IF8ucmVzb2x2ZVBpcGVkRXhwcmVzc2lvbihyYXdBcmdzKTtcclxuICBpZiAodmFsdWVzWzFdKSB7IG9wdHMgPSBfLnJlc29sdmVOaWNlSlNPTih2YWx1ZXNbMV0pOyB9XHJcbiAgbGV0IGtleXMgPSBfLmV4cGxvZGVBbmRNYXAodmFsdWVzWzBdLCAnLCcsICc6Jywge3RyaW06IHRydWV9KTtcclxuICByZXR1cm4ge2tleXMsIG9wdHN9O1xyXG59O1xyXG5cclxuXy5hcHBseUNhbGxiYWNrT3B0aW9ucyA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBvcHRzKSB7XHJcbiAgbGV0IG5ld0NhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgaWYgKG9wdHMgJiYgb3B0cy5kZWJvdW5jZSkge1xyXG4gICAgbmV3Q2FsbGJhY2sgPSBfLmRlYm91bmNlKG5ld0NhbGxiYWNrLCBvcHRzLmRlYm91bmNlKTtcclxuICB9XHJcbiAgICBcclxuICBpZiAob3B0cyAmJiBvcHRzLnRvZ2dsZVRpbWVvdXQpIHtcclxuICAgIG5ld0NhbGxiYWNrID0gXy50b2dnbGVUaW1lb3V0KG5ld0NhbGxiYWNrLCBvcHRzLnRvZ2dsZVRpbWVvdXQpO1xyXG4gIH1cclxuXHJcbiAgaWYgKG9wdHMgJiYgb3B0cy50aW1lb3V0KSB7XHJcbiAgICBuZXdDYWxsYmFjayA9IF8udGltZW91dChuZXdDYWxsYmFjaywgb3B0cy50aW1lb3V0KTtcclxuICB9XHJcblxyXG4gIGlmIChvcHRzICYmIG9wdHMuZGVmZXIpIHtcclxuICAgIG5ld0NhbGxiYWNrID0gXy50aW1lb3V0KG5ld0NhbGxiYWNrLCAxKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBuZXdDYWxsYmFjaztcclxufTtcclxuXHJcbl8ucGFyc2VJbnQgPSBmdW5jdGlvbihzdHJpbmcsIGRlZmF1bHRWYWx1ZSwgYmFzZSkge1xyXG4gIGlmIChiYXNlID09IG51bGwpIHsgYmFzZSA9IDEwOyB9XHJcbiAgaWYgKChzdHJpbmcgIT0gbnVsbCkgJiYgKHN0cmluZyAhPT0gJycpKSB7XHJcbiAgICByZXR1cm4gcGFyc2VJbnQoc3RyaW5nLCBiYXNlKTtcclxuICB9IGVsc2UgaWYgKGRlZmF1bHRWYWx1ZSAhPSBudWxsKSB7XHJcbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gc3RyaW5nO1xyXG4gIH1cclxufTtcclxuIiwibGV0IHsgXyB9ID0gd2luZG93LnJoO1xyXG5cclxuXy5oYXNOb25Bc2NpaUNoYXIgPSBmdW5jdGlvbihzdHIpIHsgaWYgKHN0ciA9PSBudWxsKSB7IHN0ciA9ICcnOyB9IHJldHVybiBfLmFueShzdHIsIGNoID0+IGNoLmNoYXJDb2RlQXQoMCkgPiAxMjcpOyB9O1xyXG4iLCJsZXQgeyBfIH0gPSB3aW5kb3cucmg7XHJcbmxldCB7IGNvbnN0cyB9ID0gd2luZG93LnJoO1xyXG5cclxuXHJcbl8ubWFwVG9FbmNvZGVkU3RyaW5nID0gZnVuY3Rpb24obWFwLCBleHBsb2RlS2V5LCBtYXBLZXkpIHtcclxuICBpZiAoZXhwbG9kZUtleSA9PSBudWxsKSB7IGV4cGxvZGVLZXkgPSAnJic7IH1cclxuICBpZiAobWFwS2V5ID09IG51bGwpIHsgbWFwS2V5ID0gJz0nOyB9XHJcbiAgcmV0dXJuIF8ucmVkdWNlKG1hcCwgZnVuY3Rpb24ocmVzdWx0LCB2YWx1ZSwga2V5KSB7XHJcbiAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xyXG4gICAgICBpZiAocmVzdWx0Lmxlbmd0aCA+IDApIHsgcmVzdWx0ICs9IGV4cGxvZGVLZXk7IH1cclxuICAgICAgcmVzdWx0ICs9IGAke2tleX0ke21hcEtleX0ke2VuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSl9YDtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG4gICwgJycpO1xyXG59O1xyXG5cclxuXy5lbmNvZGVkU3RyaW5nVG9NYXAgPSBmdW5jdGlvbihzdHJpbmcsIGV4cGxvZGVLZXksIG1hcEtleSkge1xyXG4gIGlmIChleHBsb2RlS2V5ID09IG51bGwpIHsgZXhwbG9kZUtleSA9ICcmJzsgfVxyXG4gIGlmIChtYXBLZXkgPT0gbnVsbCkgeyBtYXBLZXkgPSAnPSc7IH1cclxuICBsZXQgbWFwID0gXy5leHBsb2RlQW5kTWFwKHN0cmluZywgZXhwbG9kZUtleSwgbWFwS2V5LCB7ZGVmYXVsdDogJyd9KTtcclxuICBfLmVhY2gobWFwLCAodmFsdWUsIGtleSkgPT4gbWFwW2tleV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpKTtcclxuICByZXR1cm4gbWFwO1xyXG59O1xyXG5cclxuXy51cmxQYXJhbXMgPSBmdW5jdGlvbihxdWVyeSkge1xyXG4gIGlmIChxdWVyeSA9PSBudWxsKSB7IHF1ZXJ5ID0gbG9jYXRpb24uc2VhcmNoLnN1YnN0cmluZygxKTsgfVxyXG4gIHJldHVybiBfLmVuY29kZWRTdHJpbmdUb01hcChxdWVyeSk7XHJcbn07XHJcblxyXG5fLnVybFBhcmFtID0gZnVuY3Rpb24oa2V5LCBxdWVyeSkge1xyXG4gIGlmIChxdWVyeSA9PSBudWxsKSB7IHF1ZXJ5ID0gbG9jYXRpb24uc2VhcmNoLnN1YnN0cmluZygxKTsgfVxyXG4gIHJldHVybiBrZXkgJiYgXy51cmxQYXJhbXMocXVlcnkpW2tleV07XHJcbn07XHJcblxyXG5fLmhhc2hQYXJhbXMgPSBmdW5jdGlvbihoYXNoKSB7XHJcbiAgaWYgKGhhc2ggPT0gbnVsbCkgeyBoYXNoID0gbG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSk7IH1cclxuICByZXR1cm4gXy5lbmNvZGVkU3RyaW5nVG9NYXAoaGFzaCk7XHJcbn07XHJcblxyXG5fLmhhc2hQYXJhbSA9IGtleSA9PiBrZXkgJiYgXy5oYXNoUGFyYW1zKClba2V5XTtcclxuXHJcbl8udXBkYXRlSGFzaE1hcCA9IGZ1bmN0aW9uKGNoYW5nZU1hcCwgYWRkVG9IaXN0b3J5KSB7XHJcbiAgbGV0IG5ld01hcCA9IF8uZXh0ZW5kKHt9LCBfLmhhc2hQYXJhbXMoKSwgY2hhbmdlTWFwKTtcclxuICBsZXQgaGFzaCA9IF8ubWFwVG9FbmNvZGVkU3RyaW5nKG5ld01hcCk7XHJcbiAgaWYgKGhhc2gubGVuZ3RoID4gMCkgeyBoYXNoID0gYCMke2hhc2h9YDsgfVxyXG5cclxuICBpZiAoYWRkVG9IaXN0b3J5KSB7XHJcbiAgICByZXR1cm4gbG9jYXRpb24uaGFzaCA9IGhhc2g7XHJcbiAgfSBlbHNlIGlmICgoaGFzaCAhPT0gJycpICYmIChsb2NhdGlvbi5oYXNoICE9PSBoYXNoKSkge1xyXG4gICAgcmV0dXJuIGxvY2F0aW9uLnJlcGxhY2UoaGFzaCk7XHJcbiAgfVxyXG59O1xyXG5cclxuXy5xdWV1ZVVwZGF0ZUhhc2hNYXAgPSAoaGFzaE1hcCwgYWRkVG9IaXN0b3J5KSA9PiBfLmRlZmVyKCgpID0+IF8udXBkYXRlSGFzaE1hcChoYXNoTWFwLCBhZGRUb0hpc3RvcnkpKTtcclxuXHJcbl8uc3RyaXBTdHJpbmdCZXR3ZWVuID0gZnVuY3Rpb24oc3RyLCBzdGFydENoYXIsIGVuZENoYXIpIHtcclxuICBsZXQgbmV3U3RyO1xyXG4gIGxldCBzdGFydCA9IHN0ci5pbmRleE9mKHN0YXJ0Q2hhcik7XHJcbiAgaWYgKHN0YXJ0ICE9PSAtMSkge1xyXG4gICAgbGV0IGVuZCA9IHN0ci5pbmRleE9mKGVuZENoYXIpO1xyXG4gICAgaWYgKGVuZCA8IHN0YXJ0KSB7IGVuZCA9IHN0ci5sZW5ndGg7IH1cclxuICAgIG5ld1N0ciA9IGAke3N0ci5zdWJzdHJpbmcoMCwgc3RhcnQpfSR7c3RyLnN1YnN0cmluZyhlbmQsIHN0ci5sZW5ndGgpfWA7XHJcbiAgfVxyXG4gIHJldHVybiBuZXdTdHIgfHwgc3RyO1xyXG59O1xyXG5cclxuXy5zdHJpcFBhcmFtID0gZnVuY3Rpb24odXJsKSB7XHJcbiAgaWYgKHVybCA9PSBudWxsKSB7IHVybCA9IGRvY3VtZW50LmxvY2F0aW9uLmhyZWY7IH1cclxuICByZXR1cm4gXy5zdHJpcFN0cmluZ0JldHdlZW4odXJsLCAnPycsICcjJyk7XHJcbn07XHJcblxyXG5fLnN0cmlwQm9va21hcmsgPSBmdW5jdGlvbih1cmwpIHtcclxuICBpZiAodXJsID09IG51bGwpIHsgdXJsID0gZG9jdW1lbnQubG9jYXRpb24uaHJlZjsgfVxyXG4gIHJldHVybiBfLnN0cmlwU3RyaW5nQmV0d2Vlbih1cmwsICcjJywgJz8nKTtcclxufTtcclxuXHJcbl8uZXh0cmFjdFN0cmluZ0JldHdlZW4gPSBmdW5jdGlvbihzdHIsIHN0YXJ0Q2hhciwgZW5kQ2hhcikge1xyXG4gIGxldCBzdWJzdHJpbmc7XHJcbiAgbGV0IHN0YXJ0ID0gc3RyLmluZGV4T2Yoc3RhcnRDaGFyKTtcclxuICBpZiAoc3RhcnQgIT09IC0xKSB7XHJcbiAgICBsZXQgZW5kID0gc3RyLmluZGV4T2YoZW5kQ2hhcik7XHJcbiAgICBpZiAoZW5kIDwgc3RhcnQpIHsgZW5kID0gc3RyLmxlbmd0aDsgfVxyXG4gICAgc3Vic3RyaW5nID0gc3RyLnN1YnN0cmluZyhzdGFydCArIDEsIGVuZCk7XHJcbiAgfVxyXG4gIHJldHVybiBzdWJzdHJpbmcgfHwgJyc7XHJcbn07XHJcblxyXG5fLmV4dHJhY3RQYXJhbVN0cmluZyA9IGZ1bmN0aW9uKHVybCkge1xyXG4gIGlmICh1cmwgPT0gbnVsbCkgeyB1cmwgPSBkb2N1bWVudC5sb2NhdGlvbi5ocmVmOyB9XHJcbiAgcmV0dXJuIF8uZXh0cmFjdFN0cmluZ0JldHdlZW4odXJsLCAnPycsICcjJyk7XHJcbn07XHJcblxyXG5fLmV4dHJhY3RIYXNoU3RyaW5nID0gZnVuY3Rpb24odXJsKSB7XHJcbiAgaWYgKHVybCA9PSBudWxsKSB7IHVybCA9IGRvY3VtZW50LmxvY2F0aW9uLmhyZWY7IH1cclxuICByZXR1cm4gXy5leHRyYWN0U3RyaW5nQmV0d2Vlbih1cmwsICcjJywgJz8nKTtcclxufTtcclxuXHJcblxyXG4vLyMjIyMjXHJcbi8vIHBhdGhUcmF2ZXJzZVRvKGZyb21QYXRoLCB0b1BhdGgpXHJcbi8vIFRha2VzIGluIHR3byBhYnNvbHV0ZSBwYXRocyBhbmQgc2ltdWxhdGVzXHJcbi8vIHRyYXZlcnNhbCBmcm9tIGZyb21QYXRoIHRvIHRvUGF0aC5cclxuLy8gUmV0dXJucyB0aGUgc3RlcHMgbmVlZWQgdG8gdHJhdmVyc2UgZnJvbVxyXG4vLyBmcm9tUGF0aCB0byB0b1BhdGguXHJcbi8vIyMjIyNcclxuLy8gVE9ETzogQ29tcGxldGUgdGhpcyBtZXRob2RcclxuXy50cmF2ZXJzZVRvUGF0aCA9IChmcm9tUGF0aCwgdG9QYXRoKSA9PiAnJztcclxuXHJcbmxldCBwcm9jZXNzUGF0aFVuaXQgPSBmdW5jdGlvbihmdWxsUGF0aCwgcGF0aFVuaXQsIHNlcGFyYXRvcikge1xyXG4gIGlmIChzZXBhcmF0b3IgPT0gbnVsbCkgeyBzZXBhcmF0b3IgPSAnLyc7IH1cclxuICBzd2l0Y2ggKHBhdGhVbml0KSB7XHJcbiAgICBjYXNlICcuJzogcmV0dXJuIGZ1bGxQYXRoO1xyXG4gICAgY2FzZSAnLi4nOiByZXR1cm4gZnVsbFBhdGguc3Vic3RyaW5nKDAsIGZ1bGxQYXRoLmxhc3RJbmRleE9mKHNlcGFyYXRvcikpO1xyXG4gICAgZGVmYXVsdDogcmV0dXJuIGZ1bGxQYXRoICsgc2VwYXJhdG9yICsgcGF0aFVuaXQ7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8jIyMjI1xyXG4vLyBwYXRoVHJhdmVyc2VCeShmcm9tUGF0aCwgdHJhdmVyc2VCeSlcclxuLy8gVGFrZXMgaW4gdHdvIHBhdGggY29tcG9uZW50cyBhbmQgc2ltdWxhdGVzXHJcbi8vIHRyYXZlcnNhbCBmcm9tIGZyb21QYXRoIGJ5IHRyYXZlcnNlQnkuXHJcbi8vIFJldHVybnMgdGhlIHJlc3VsdGluZyBwYXRoIGFmdGVyIHRoZSB0cmF2ZXJzYWwuXHJcbi8vIEVnOiAnQzovYS9iL2MvJywgJy4uLy4uLycgcmV0dW5zICdDOi9hLydcclxuLy8jIyMjI1xyXG5fLnRyYXZlcnNlQnlQYXRoID0gZnVuY3Rpb24oZnJvbVBhdGgsIHRyYXZlcnNlQnksIHNlcGFyYXRvcikge1xyXG4gIGlmIChzZXBhcmF0b3IgPT0gbnVsbCkgeyBzZXBhcmF0b3IgPSAnLyc7IH1cclxuICBmcm9tUGF0aCA9IGZyb21QYXRoLnN1YnN0cmluZygwLCBmcm9tUGF0aC5sYXN0SW5kZXhPZihzZXBhcmF0b3IpKTtcclxuICBsZXQgcGFydHMgPSB0cmF2ZXJzZUJ5LnNwbGl0KHNlcGFyYXRvcik7XHJcblxyXG4gIGZvciAobGV0IHBhcnQgb2YgQXJyYXkuZnJvbShwYXJ0cykpIHtcclxuICAgIGlmIChwYXJ0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgZnJvbVBhdGggPSBwcm9jZXNzUGF0aFVuaXQoZnJvbVBhdGgsIHBhcnQsIHNlcGFyYXRvcik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZnJvbVBhdGggKyBzZXBhcmF0b3I7XHJcbn07XHJcblxyXG5fLnNjaGVtZSA9IGZ1bmN0aW9uKHVybCkge1xyXG4gIGxldCBzY2hlbWU7XHJcbiAgbGV0IGluZGV4ID0gdXJsLmluZGV4T2YoJzonKTtcclxuICBpZiAoaW5kZXggIT09IC0xKSB7IHNjaGVtZSA9IHVybC5zdWJzdHJpbmcoMCwgaW5kZXggKyAxKS50b0xvd2VyQ2FzZSgpLnRyaW0oKTsgfVxyXG4gIHJldHVybiBzY2hlbWU7XHJcbn07XHJcbiAgXHJcbl8ucHJvdG9jb2wgPSBmdW5jdGlvbih1cmwpIHtcclxuICBsZXQgcHJvdG9jb2w7XHJcbiAgbGV0IGluZGV4ID0gdXJsLnRyaW0oKS5pbmRleE9mKCc6Jyk7XHJcbiAgaWYgKGluZGV4ICE9PSAtMSkgeyBwcm90b2NvbCA9IHVybC5zdWJzdHJpbmcoMCwgaW5kZXggKyAxKS50b0xvd2VyQ2FzZSgpOyB9XHJcbiAgaWYgKHByb3RvY29sKSB7XHJcbiAgICBsZXQgbWF0Y2ggPSBwcm90b2NvbC5tYXRjaCgvXlthLXpdKzovKTtcclxuICAgIGlmICghbWF0Y2ggfHwgKG1hdGNoWzBdLmxlbmd0aCAhPT0gcHJvdG9jb2wubGVuZ3RoKSkgeyBwcm90b2NvbCA9IHVuZGVmaW5lZDsgfVxyXG4gIH1cclxuICByZXR1cm4gcHJvdG9jb2w7XHJcbn07XHJcblxyXG5fLmlzSW50ZXJuYWwgPSB1cmxOYW1lID0+XHJcbiAgKHVybE5hbWUuaW5kZXhPZignLy8nKSAhPT0gMCkgJiYgKHVybE5hbWUuaW5kZXhPZignLyYjNDc7JykgIT09IDApICYmXHJcbiAgKHVybE5hbWUuaW5kZXhPZignJiM0NzsvJykgIT09IDApICYmICh1cmxOYW1lLmluZGV4T2YoJyYjNDc7JiM0NzsnKSAhPT0gMClcclxuO1xyXG5cclxuXy5pc0phdmFTY3JpcHRVcmwgPSB1cmwgPT4gJ2phdmFzY3JpcHQ6JyA9PT0gXy5zY2hlbWUodXJsKTtcclxuXHJcbl8uaXNSZWxhdGl2ZVVybCA9IHVybCA9PiAhXy5zY2hlbWUodXJsKSAmJiB1cmwudHJpbSgpLmluZGV4T2YoJy8nKTtcclxuXHJcbl8uaXNWYWxpZEZpbGVVcmwgPSBmdW5jdGlvbih1cmwpIHtcclxuICBpZiAodXJsWzBdID09PSAnIycpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgbGV0IHNjaGVtZSA9IF8uc2NoZW1lKHVybCk7XHJcbiAgcmV0dXJuICFzY2hlbWUgfHwgKFsnaHR0cDonLCAnaHR0cHM6JywgJ2Z0cDonLCAnZmlsZTonXS5pbmRleE9mKHNjaGVtZSkgIT09IC0xKTtcclxufTtcclxuXHJcbl8ubWFrZVJlbGF0aXZlVXJsID0gZnVuY3Rpb24oYWJzVXJsLCBiYXNlVXJsKSB7XHJcbiAgaWYgKGJhc2VVcmwgPT0gbnVsbCkgeyBiYXNlVXJsID0gZGVjb2RlVVJJKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYpOyB9XHJcbiAgaWYgKGFic1VybCA9PT0gYmFzZVVybCkgeyByZXR1cm4gJyc7IH1cclxuICBsZXQgYWJzUGF0aCA9IF8uZmlsZVBhdGgoYWJzVXJsKTtcclxuICBsZXQgYmFzZVBhdGggPSBfLmZpbGVQYXRoKGJhc2VVcmwpO1xyXG4gIGxldCByZWxQYXRoID0gXy5tYWtlUmVsYXRpdmVQYXRoKGFic1BhdGgsIGJhc2VQYXRoKTtcclxuICByZXR1cm4gYCR7cmVsUGF0aH0ke2Fic1VybC5zdWJzdHJpbmcoYWJzUGF0aC5sZW5ndGgpfWA7XHJcbn07XHJcblxyXG5fLm1ha2VSZWxhdGl2ZVBhdGggPSBmdW5jdGlvbihhYnNVcmwsIGJhc2VVcmwpIHtcclxuICBsZXQgcmVsVXJsO1xyXG4gIGlmIChiYXNlVXJsID09IG51bGwpIHsgYmFzZVVybCA9IF8uZmlsZVBhdGgoKTsgfVxyXG4gIGlmIChhYnNVcmwgJiYgIV8uaXNSZWxhdGl2ZVVybChhYnNVcmwpICYmICFfLmlzUmVsYXRpdmVVcmwoYmFzZVVybCkpIHtcclxuICAgIGxldCBzcmNQYXJ0cyA9IGFic1VybC5zcGxpdCgnLycpO1xyXG4gICAgbGV0IGJhc2VQYXJ0cyA9IGJhc2VVcmwuc3BsaXQoJy8nKTtcclxuICAgIGxldCBpZHggPSAwO1xyXG4gICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgaWYgKChzcmNQYXJ0cy5sZW5ndGggPT09IGlkeCkgfHwgKGJhc2VQYXJ0cy5sZW5ndGggPT09IGlkeCkpIHsgYnJlYWs7IH1cclxuICAgICAgaWYgKHNyY1BhcnRzW2lkeF0gIT09IGJhc2VQYXJ0c1tpZHhdKSB7IGJyZWFrOyB9XHJcbiAgICAgIGlkeCsrO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBsZXQgcmVsUGFydHMgPSBzcmNQYXJ0cy5zbGljZShpZHgpO1xyXG4gICAgcmVsVXJsID0gJyc7XHJcbiAgICBsZXQgZG90ZG90Y291bnQgPSBiYXNlUGFydHMubGVuZ3RoIC0gaWR4IC0gMTtcclxuICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgIGlmIChkb3Rkb3Rjb3VudCA8PSAwKSB7IGJyZWFrOyB9XHJcbiAgICAgIHJlbFVybCArPSAnLi4vJztcclxuICAgICAgZG90ZG90Y291bnQtLTtcclxuICAgIH1cclxuICAgIHJlbFVybCArPSByZWxQYXJ0cy5qb2luKCcvJyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJlbFVybCA9IGFic1VybDtcclxuICB9XHJcbiAgcmV0dXJuIHJlbFVybDtcclxufTtcclxuXHJcbl8ubWFrZUZ1bGxVcmwgPSBmdW5jdGlvbihyZWxVcmwsIHBhcmVudFBhdGgpIHtcclxuICBpZiAocGFyZW50UGF0aCA9PSBudWxsKSB7IHBhcmVudFBhdGggPSByaC5fLnBhcmVudFBhdGgoKTsgfVxyXG4gIGlmIChfLmlzUmVsYXRpdmVVcmwocmVsVXJsKSkge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5fZ2V0RnVsbFBhdGgocGFyZW50UGF0aCwgcmVsVXJsKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHJlbFVybDtcclxuICB9XHJcbn07XHJcblxyXG5fLmlzTG9jYWwgPSAoKSA9PiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09ICdmaWxlOic7XHJcblxyXG5fLmlzUmVtb3RlID0gKCkgPT4gd2luZG93LmxvY2F0aW9uLnByb3RvY29sICE9PSAnZmlsZTonO1xyXG5cclxubGV0IGN1ck9yaWdpbiA9IG51bGw7XHJcbl8uaXNTYW1lT3JpZ2luID0gZnVuY3Rpb24ob3JpZ2luKSB7XHJcbiAgaWYgKF8uaXNMb2NhbCgpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgbGV0IHsgbG9jYXRpb24gfSA9IHdpbmRvdztcclxuICBpZiAoY3VyT3JpZ2luID09IG51bGwpIHsgY3VyT3JpZ2luID0gbG9jYXRpb24ub3JpZ2luOyB9XHJcbiAgaWYgKGN1ck9yaWdpbiA9PSBudWxsKSB7XHJcbiAgICBjdXJPcmlnaW4gPSBgJHtsb2NhdGlvbi5wcm90b2NvbH0vLyR7bG9jYXRpb24uaG9zdG5hbWV9YDtcclxuICAgIGlmIChsb2NhdGlvbi5wb3J0KSB7IGN1ck9yaWdpbiArPSBgOiR7bG9jYXRpb24ucG9ydH1gOyB9XHJcbiAgfVxyXG4gIHJldHVybiBjdXJPcmlnaW4gPT09IG9yaWdpbjtcclxufTtcclxuXHJcbl8uZmlsZVBhdGggPSBmdW5jdGlvbih1cmwpIHtcclxuICBpZiAodXJsID09IG51bGwpIHsgdXJsID0gZGVjb2RlVVJJKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYpOyB9XHJcbiAgbGV0IGluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcclxuICBpZiAoaW5kZXggIT09IC0xKSB7IHVybCA9IHVybC5zdWJzdHJpbmcoMCwgaW5kZXgpOyB9XHJcbiAgaW5kZXggPSB1cmwuaW5kZXhPZignIycpO1xyXG4gIGlmIChpbmRleCAhPT0gLTEpIHsgdXJsID0gdXJsLnN1YnN0cmluZygwLCBpbmRleCk7IH1cclxuICByZXR1cm4gdXJsO1xyXG59O1xyXG5cclxuXy5wYXJlbnRQYXRoID0gZnVuY3Rpb24oZmlsZVBhdGgpIHtcclxuICBpZiAoZmlsZVBhdGggPT0gbnVsbCkgeyBmaWxlUGF0aCA9IF8uZmlsZVBhdGgoKTsgfVxyXG4gIGxldCBpbmRleCA9IGZpbGVQYXRoLmxhc3RJbmRleE9mKCcvJyk7XHJcbiAgaWYgKGluZGV4ICE9PSAtMSkgeyBmaWxlUGF0aCA9IGZpbGVQYXRoLnN1YnN0cmluZygwLCBpbmRleCArIDEpOyB9XHJcbiAgcmV0dXJuIGZpbGVQYXRoO1xyXG59O1xyXG5cclxuXy5nZXRGaWxlTmFtZSA9IGZ1bmN0aW9uKGFic1VybCkge1xyXG4gIGxldCBmaWxlUGF0aCA9IF8uZmlsZVBhdGgoYWJzVXJsKTtcclxuICBsZXQgaWR4ID0gZmlsZVBhdGgubGFzdEluZGV4T2YoJy8nKTtcclxuICBsZXQgZmlpbGVOYW1lID0gaWR4ICE9PSAtMSA/IGZpbGVQYXRoLnN1YnN0cmluZyhpZHggKyAxKSA6IGZpbGVQYXRoO1xyXG4gIHJldHVybiBmaWlsZU5hbWUgfHwgJyc7XHJcbn07XHJcblxyXG5fLmdldEZpbGVFeHRlbnRpb24gPSBmdW5jdGlvbihhYnNVcmwpIHtcclxuICBsZXQgZXh0O1xyXG4gIGxldCBmaWlsZU5hbWUgPSBfLmdldEZpbGVOYW1lKGFic1VybCk7XHJcbiAgbGV0IGlkeCA9IGZpaWxlTmFtZSAhPSBudWxsID8gZmlpbGVOYW1lLmxhc3RJbmRleE9mKCcuJykgOiB1bmRlZmluZWQ7XHJcbiAgaWYgKGlkeCAhPT0gLTEpIHsgZXh0ID0gZmlpbGVOYW1lLnN1YnN0cmluZyhpZHgpOyB9XHJcbiAgcmV0dXJuIGV4dCB8fCAnJztcclxufTtcclxuIiwiaWYgKHdpbmRvdy5yaCA9PSBudWxsKSB7IHdpbmRvdy5yaCA9IHt9OyB9XHJcbmNvbnN0IHsgcmggfSA9IHdpbmRvdztcclxuaWYgKHJoLl8gPT0gbnVsbCkgeyByaC5fID0ge307IH1cclxucmgudXRpbCA9IHJoLl87XHJcbmNvbnN0IHsgXyB9ID0gcmg7XHJcblxyXG5jb25zdCBuYXRpdmVGb3JFYWNoICAgPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaDtcclxuY29uc3QgbmF0aXZlS2V5cyAgICAgID0gT2JqZWN0LmtleXM7XHJcbmNvbnN0IHsgaGFzT3duUHJvcGVydHkgfSAgPSBPYmplY3QucHJvdG90eXBlO1xyXG5cclxuXy50aW1lID0gKCkgPT4gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuXHJcbl8uZGVsYXkgPSBmdW5jdGlvbihmbiwgd2FpdCkge1xyXG4gIGNvbnN0IGFyZ3MgPSBbXTsgbGV0IGkgPSAxO1xyXG4gIHdoaWxlICgrK2kgPCBhcmd1bWVudHMubGVuZ3RoKSB7IGFyZ3MucHVzaChhcmd1bWVudHNbaV0pOyB9XHJcbiAgcmV0dXJuIHNldFRpbWVvdXQoKCkgPT4gZm4uYXBwbHkobnVsbCwgYXJncylcclxuICAsIHdhaXQpO1xyXG59O1xyXG5cclxuXy5kZWZlciA9IGZ1bmN0aW9uKGZuKSB7XHJcbiAgY29uc3QgYXJncyA9IFtdOyBsZXQgaSA9IDA7XHJcbiAgd2hpbGUgKCsraSA8IGFyZ3VtZW50cy5sZW5ndGgpIHsgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7IH1cclxuICByZXR1cm4gdGhpcy5kZWxheS5hcHBseSh0aGlzLCBbZm4sIDFdLmNvbmNhdChhcmdzKSk7XHJcbn07XHJcblxyXG5fLmRlYm91bmNlID0gZnVuY3Rpb24oZm4sIHRocmVzaG9sZCwgZXhlY0FzYXApIHtcclxuICBsZXQgdGltZW91dCA9IG51bGw7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgYXJncyA9IFtdO1xyXG4gICAgZm9yIChsZXQgYXJnIG9mIEFycmF5LmZyb20oYXJndW1lbnRzKSkgeyBhcmdzLnB1c2goYXJnKTsgfVxyXG4gICAgY29uc3Qgb2JqID0gdGhpcztcclxuICAgIGNvbnN0IGRlbGF5ZWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKCFleGVjQXNhcCkgeyBmbi5hcHBseShvYmosIGFyZ3MpOyB9XHJcbiAgICAgIHJldHVybiB0aW1lb3V0ID0gbnVsbDtcclxuICAgIH07XHJcbiAgICBpZiAodGltZW91dCkge1xyXG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XHJcbiAgICB9IGVsc2UgaWYgKGV4ZWNBc2FwKSB7XHJcbiAgICAgIGZuLmFwcGx5KG9iaiwgYXJncyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGltZW91dCA9IHNldFRpbWVvdXQoZGVsYXllZCwgdGhyZXNob2xkIHx8IDEwMCk7XHJcbiAgfTtcclxufTtcclxuXHJcbl8udGhyb3R0bGUgPSBmdW5jdGlvbihmbiwgdGhyZXNob2xkKSB7XHJcbiAgbGV0IHRpbWVvdXQgPSBudWxsO1xyXG4gIGxldCBmbkV4ZWN1dGVkID0gZmFsc2U7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgYXJncyA9IFtdO1xyXG4gICAgZm9yIChsZXQgYXJnIG9mIEFycmF5LmZyb20oYXJndW1lbnRzKSkgeyBhcmdzLnB1c2goYXJnKTsgfVxyXG4gICAgY29uc3Qgb2JqID0gdGhpcztcclxuICAgIGNvbnN0IGRlbGF5ZWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKCFmbkV4ZWN1dGVkKSB7IGZuLmFwcGx5KG9iaiwgYXJncyk7IH1cclxuICAgICAgcmV0dXJuIHRpbWVvdXQgPSBudWxsO1xyXG4gICAgfTtcclxuICAgIGlmICh0aW1lb3V0KSB7XHJcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcclxuICAgICAgZm5FeGVjdXRlZCA9IGZhbHNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZm4uYXBwbHkob2JqLCBhcmdzKTtcclxuICAgICAgZm5FeGVjdXRlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHRocmVzaG9sZCB8fCAxMDApO1xyXG4gIH07XHJcbn07XHJcblxyXG5fLnRpbWVvdXQgPSAoZm4sIHdhaXQpID0+XHJcbiAgZnVuY3Rpb24oKSB7XHJcbiAgICBjb25zdCBhcmdzID0gW107XHJcbiAgICBmb3IgKGxldCBhcmcgb2YgQXJyYXkuZnJvbShhcmd1bWVudHMpKSB7IGFyZ3MucHVzaChhcmcpOyB9XHJcbiAgICBjb25zdCBvYmogPSB0aGlzO1xyXG4gICAgY29uc3QgZGVsYXllZCA9ICgpID0+IGZuLmFwcGx5KG9iaiwgYXJncyk7XHJcbiAgICByZXR1cm4gc2V0VGltZW91dChkZWxheWVkLCB3YWl0KTtcclxuICB9XHJcbjtcclxuXHJcbl8udG9nZ2xlVGltZW91dCA9IChmbiwgd2FpdCwgdG9nZ2xlKSA9PlxyXG4gIGZ1bmN0aW9uKCkge1xyXG4gICAgY29uc3QgYXJncyA9IFtdO1xyXG4gICAgZm9yIChsZXQgYXJnIG9mIEFycmF5LmZyb20oYXJndW1lbnRzKSkgeyBhcmdzLnB1c2goYXJnKTsgfVxyXG4gICAgY29uc3Qgb2JqID0gdGhpcztcclxuICAgIGNvbnN0IGRlbGF5ZWQgPSAoKSA9PiBmbi5hcHBseShvYmosIGFyZ3MpO1xyXG4gICAgaWYgKHRvZ2dsZSkge1xyXG4gICAgICBpZiAocmguX2RlYnVnKSB7IGFyZ3MucHVzaChfLnN0YWNrVHJhY2UoKSk7IH1cclxuICAgICAgc2V0VGltZW91dChkZWxheWVkLCB3YWl0KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGRlbGF5ZWQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0b2dnbGUgPSAhdG9nZ2xlO1xyXG4gIH1cclxuO1xyXG5cclxuLy8gT2JqZWN0IG1ldGhvZHNcclxuXHJcbl8uaGFzID0gKG9iaiwga2V5KSA9PiAob2JqICE9IG51bGwpICYmIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xyXG5cclxuXy5rZXlzID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgY29uc3Qga2V5cyA9IFtdO1xyXG4gIGlmICghXy5pc09iamVjdChvYmopKSB7IHJldHVybiBrZXlzOyB9XHJcbiAgaWYgKG5hdGl2ZUtleXMpIHsgcmV0dXJuIG5hdGl2ZUtleXMob2JqKTsgfVxyXG4gIGZvciAobGV0IGtleSBpbiBvYmopIHsgaWYgKF8uaGFzKG9iaiwga2V5KSkgeyBrZXlzLnB1c2goa2V5KTsgfSB9XHJcbiAgcmV0dXJuIGtleXM7XHJcbn07XHJcblxyXG4vL0l0ZXJhdG9yc1xyXG5cclxuXy5hbnkgPSBmdW5jdGlvbihvYmosIGZuLCBjb250ZXh0KSB7XHJcbiAgaWYgKGNvbnRleHQgPT0gbnVsbCkgeyBjb250ZXh0ID0gdGhpczsgfVxyXG4gIGlmIChvYmogPT0gbnVsbCkgeyByZXR1cm4gZmFsc2U7IH1cclxuICBjb25zdCBrZXlzID0gKG9iai5sZW5ndGggIT09ICtvYmoubGVuZ3RoKSAmJiBfLmtleXMob2JqKTtcclxuICBjb25zdCB7IGxlbmd0aCB9ID0gKGtleXMgfHwgb2JqKTtcclxuICBsZXQgaW5kZXggPSAwO1xyXG4gIHdoaWxlICh0cnVlKSB7XHJcbiAgICBpZiAoaW5kZXggPj0gbGVuZ3RoKSB7IGJyZWFrOyB9XHJcbiAgICBjb25zdCBrZXkgPSBrZXlzID8ga2V5c1tpbmRleF0gOiBpbmRleDtcclxuICAgIGlmIChmbi5jYWxsKGNvbnRleHQsIG9ialtrZXldLCBrZXksIG9iaikpIHsgcmV0dXJuIHRydWU7IH1cclxuICAgIGluZGV4Kys7XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbl8uZWFjaCA9IGZ1bmN0aW9uKG9iaiwgZm4sIGNvbnRleHQpIHtcclxuICBsZXQgdmFsdWU7XHJcbiAgaWYgKGNvbnRleHQgPT0gbnVsbCkgeyBjb250ZXh0ID0gdGhpczsgfVxyXG4gIGlmIChvYmogPT0gbnVsbCkgeyByZXR1cm47IH1cclxuICBpZiAobmF0aXZlRm9yRWFjaCA9PT0gb2JqLmZvckVhY2gpIHtcclxuICAgIG9iai5mb3JFYWNoKGZuLCBjb250ZXh0KTtcclxuICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XHJcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgb2JqLmxlbmd0aDsgaW5kZXgrKykgeyB2YWx1ZSA9IG9ialtpbmRleF07IGZuLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBvYmopOyB9XHJcbiAgfSBlbHNlIHtcclxuICAgIGZvciAobGV0IGtleSBpbiBvYmopIHsgdmFsdWUgPSBvYmpba2V5XTsgZm4uY2FsbChjb250ZXh0LCB2YWx1ZSwga2V5LCBvYmopOyB9XHJcbiAgfVxyXG4gIHJldHVybiBvYmo7XHJcbn07XHJcblxyXG5fLm1hcCA9IGZ1bmN0aW9uKG9iaiwgZm4sIGNvbnRleHQpIHtcclxuICBpZiAoY29udGV4dCA9PSBudWxsKSB7IGNvbnRleHQgPSB0aGlzOyB9XHJcbiAgY29uc3QgcmVzdWx0ID0gW107XHJcbiAgXy5lYWNoKG9iaiwgKHZhbHVlLCBrZXksIG9iaikgPT4gcmVzdWx0LnB1c2goZm4uY2FsbChjb250ZXh0LCB2YWx1ZSwga2V5LCBvYmopKSk7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbl8ucmVkdWNlID0gZnVuY3Rpb24ob2JqLCBmbiwgaW5pdGlhbCwgY29udGV4dCkge1xyXG4gIGlmIChjb250ZXh0ID09IG51bGwpIHsgY29udGV4dCA9IHRoaXM7IH1cclxuICBfLmVhY2gob2JqLCAodmFsdWUsIGtleSkgPT4gaW5pdGlhbCA9IGZuLmNhbGwoY29udGV4dCwgaW5pdGlhbCwgdmFsdWUsIGtleSkpO1xyXG4gIHJldHVybiBpbml0aWFsO1xyXG59O1xyXG5cclxuXy5maW5kID0gZnVuY3Rpb24ob2JqLCBmbiwgY29udGV4dCkge1xyXG4gIGlmIChjb250ZXh0ID09IG51bGwpIHsgY29udGV4dCA9IHRoaXM7IH1cclxuICBsZXQgcmVzdWx0ID0gdW5kZWZpbmVkO1xyXG4gIF8uYW55KG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqKSB7XHJcbiAgICBpZiAoZm4uY2FsbChjb250ZXh0LCB2YWx1ZSwga2V5LCBvYmopKSB7XHJcbiAgICAgIHJlc3VsdCA9IHZhbHVlO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gcmVzdWx0O1xyXG59O1xyXG5cclxuXy5maW5kSW5kZXggPSBmdW5jdGlvbihvYmosIGZuLCBjb250ZXh0KSB7XHJcbiAgaWYgKGNvbnRleHQgPT0gbnVsbCkgeyBjb250ZXh0ID0gdGhpczsgfVxyXG4gIGxldCByZXN1bHQgPSAtMTtcclxuICBfLmFueShvYmosIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iaikge1xyXG4gICAgaWYgKGZuLmNhbGwoY29udGV4dCwgdmFsdWUsIGtleSwgb2JqKSkge1xyXG4gICAgICByZXN1bHQgPSBrZXk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5fLmZpbmRQYXJlbnROb2RlID0gZnVuY3Rpb24obm9kZSwgcm9vdE5vZGUsIGZuLCBjb250ZXh0KSB7XHJcbiAgaWYgKHJvb3ROb2RlID09IG51bGwpIHsgcm9vdE5vZGUgPSBkb2N1bWVudDsgfVxyXG4gIGlmIChjb250ZXh0ID09IG51bGwpIHsgY29udGV4dCA9IHRoaXM7IH1cclxuICBsZXQgcmVzdWx0ID0gbnVsbDtcclxuICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgaWYgKCFub2RlIHx8IChub2RlID09PSByb290Tm9kZSkpIHsgYnJlYWs7IH1cclxuICAgIGlmIChmbi5jYWxsKGNvbnRleHQsIG5vZGUpKSB7XHJcbiAgICAgIHJlc3VsdCA9IG5vZGU7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcclxuICB9XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufTtcclxuXHJcbl8uZmlsdGVyID0gZnVuY3Rpb24ob2JqLCBmbiwgY29udGV4dCkge1xyXG4gIGlmIChjb250ZXh0ID09IG51bGwpIHsgY29udGV4dCA9IHRoaXM7IH1cclxuICBjb25zdCByZXN1bHQgPSBbXTtcclxuICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmopIHtcclxuICAgIGlmIChmbi5jYWxsKGNvbnRleHQsIHZhbHVlLCBrZXksIG9iaikpIHsgcmV0dXJuIHJlc3VsdC5wdXNoKHZhbHVlKTsgfVxyXG4gIH0pO1xyXG4gIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG5fLmZsYXR0ZW4gPSBvYmogPT5cclxuICBfLnJlZHVjZShvYmosIChyZXN1bHQsIGVsZW0pID0+IHJlc3VsdC5jb25jYXQoZWxlbSlcclxuICAsIFtdKVxyXG47XHJcblxyXG5fLnVuaXF1ZSA9IGZ1bmN0aW9uKG9iaiwgZm4sIGNvbnRleHQpIHtcclxuICBpZiAoY29udGV4dCA9PSBudWxsKSB7IGNvbnRleHQgPSB0aGlzOyB9XHJcbiAgaWYgKGZuKSB7IG9iaiA9IF8ubWFwKG9iaiwgZm4sIGNvbnRleHQpOyB9XHJcbiAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgKHZhbHVlLCBpbmRleCkgPT4gb2JqLmluZGV4T2YodmFsdWUpID09PSBpbmRleCk7XHJcbn07XHJcblxyXG5fLnVuaW9uID0gZnVuY3Rpb24ob2JqLCBmbiwgY29udGV4dCkge1xyXG4gIGlmIChjb250ZXh0ID09IG51bGwpIHsgY29udGV4dCA9IHRoaXM7IH1cclxuICBpZiAoZm4pIHsgb2JqID0gXy5tYXAob2JqLCBmbiwgY29udGV4dCk7IH1cclxuICByZXR1cm4gXy51bmlxdWUoXy5mbGF0dGVuKG9iaikpO1xyXG59O1xyXG5cclxuXy5jb3VudCA9IGZ1bmN0aW9uKG9iaiwgZm4sIGNvbnRleHQpIHtcclxuICBpZiAoY29udGV4dCA9PSBudWxsKSB7IGNvbnRleHQgPSB0aGlzOyB9XHJcbiAgbGV0IGNvdW50ID0gMDtcclxuICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmopIHsgaWYgKGZuLmNhbGwoY29udGV4dCwgdmFsdWUsIGtleSwgb2JqKSkgeyByZXR1cm4gY291bnQrKzsgfSB9KTtcclxuICByZXR1cm4gY291bnQ7XHJcbn07XHJcblxyXG5fLmV4dGVuZCA9IGZ1bmN0aW9uKG9iaiwgb2xkT2JqLCBuZXdPYmopIHtcclxuICBpZiAob2xkT2JqKSB7IF8uZWFjaChvbGRPYmosICh2YWx1ZSwga2V5KSA9PiBvYmpba2V5XSA9IHZhbHVlKTsgfVxyXG4gIGlmIChuZXdPYmopIHsgXy5lYWNoKG5ld09iaiwgKHZhbHVlLCBrZXkpID0+IG9ialtrZXldID0gdmFsdWUpOyB9XHJcbiAgcmV0dXJuIG9iajtcclxufTtcclxuXHJcbl8uYWRkUGF0aE5hbWVLZXkgPSBmdW5jdGlvbihvYmopIHtcclxuICByZXR1cm4gXy5leHRlbmQob2JqLCB7J3BhdGhuYW1lJzogZGVjb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSl9KVxyXG59XHJcblxyXG5fLmNsb25lID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHsgcmV0dXJuIG9iajsgfVxyXG4gIHJldHVybiBfLnJlZHVjZShvYmosIGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGtleSkge1xyXG4gICAgcmVzdWx0W2tleV0gPSBfLmNsb25lKHZhbHVlKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG4gICwge30pO1xyXG59O1xyXG5cclxuXy5jb21wYWN0ID0gYXJyYXkgPT4gXy5maWx0ZXIoYXJyYXksIGl0ZW0gPT4gaXRlbSk7XHJcblxyXG5fLmNvbXBhY3RPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcclxuICBpZiAob2JqID09IG51bGwpIHsgb2JqID0ge307IH1cclxuICByZXR1cm4gXy5yZWR1Y2Uob2JqLCBmdW5jdGlvbihyZXN1bHQsIHZhbHVlLCBrZXkpIHtcclxuICAgIGlmICh2YWx1ZSAhPSBudWxsKSB7XHJcbiAgICAgIGlmIChfLmlzT2JqZWN0KHZhbHVlKSkge1xyXG4gICAgICAgIHZhbHVlID0gXy5jb21wYWN0T2JqZWN0KHZhbHVlKTtcclxuICAgICAgICBpZiAoIV8uaXNFbXB0eU9iamVjdCh2YWx1ZSkpIHsgcmVzdWx0W2tleV0gPSB2YWx1ZTsgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlc3VsdFtrZXldID0gIHZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuICAsIHt9KTtcclxufTtcclxuXHJcbl8uaXNTdHJpbmcgPSB2YWx1ZSA9PiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xyXG5cclxuXy5pc0Z1bmN0aW9uID0gdmFsdWUgPT4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xyXG5cclxuXy5pc09iamVjdCA9IHZhbHVlID0+ICh2YWx1ZSAhPT0gbnVsbCkgJiYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpO1xyXG5cclxuXy5pc0RlZmluZWQgPSB2YWx1ZSA9PiAodmFsdWUgIT09IG51bGwpICYmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKTtcclxuXHJcbl8uaXNFbXB0eVN0cmluZyA9IHZhbHVlID0+IHZhbHVlLmxlbmd0aCA9PT0gMDtcclxuXHJcbl8uaXNVc2VmdWxTdHJpbmcgPSB2YWx1ZSA9PiBfLmlzRGVmaW5lZCh2YWx1ZSkgJiYgIV8uaXNFbXB0eVN0cmluZyh2YWx1ZSk7XHJcblxyXG5fLmlzRW1wdHlPYmplY3QgPSB2YWx1ZSA9PiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoID09PSAwO1xyXG5cclxuXy5pc0VxdWFsID0gZnVuY3Rpb24ob2JqMSwgb2JqMikge1xyXG4gIGlmICh0eXBlb2Ygb2JqMSAhPT0gdHlwZW9mIG9iajIpIHsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgaWYgKCFfLmlzRGVmaW5lZChvYmoxKSB8fCAhXy5pc0RlZmluZWQob2JqMikpIHsgcmV0dXJuIG9iajEgPT09IG9iajI7IH1cclxuXHJcbiAgc3dpdGNoICh0eXBlb2Ygb2JqMSkge1xyXG4gICAgY2FzZSAnb2JqZWN0JzpcclxuICAgICAgcmV0dXJuIF8uaXNFcXVhbE9iamVjdChvYmoxLCBvYmoyKTtcclxuICAgIGNhc2UgJ2FycmF5JzpcclxuICAgICAgcmV0dXJuICFfLmFueShvYmoxLCAodmFsdWUsIGluZGV4KSA9PiAhXy5pc0VxdWFsKHZhbHVlLCBvYmoyW2luZGV4XSkpO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuIG9iajEgPT09IG9iajI7XHJcbiAgfVxyXG59O1xyXG5cclxuXy5pc0VxdWFsT2JqZWN0ID0gZnVuY3Rpb24ob2JqMSwgb2JqMikge1xyXG4gIGNvbnN0IGtleXMxID0gXy5maWx0ZXIoXy5rZXlzKG9iajEpLCBrZXkgPT4gb2JqMVtrZXldICE9PSB1bmRlZmluZWQpO1xyXG4gIGNvbnN0IGtleXMyID0gXy5maWx0ZXIoXy5rZXlzKG9iajIpLCBrZXkgPT4gb2JqMltrZXldICE9PSB1bmRlZmluZWQpO1xyXG4gIGlmIChrZXlzMS5sZW5ndGggIT09IGtleXMyLmxlbmd0aCkgeyByZXR1cm4gZmFsc2U7IH1cclxuICByZXR1cm4gIV8uYW55KGtleXMxLCBrZXkgPT4gIV8uaXNFcXVhbChvYmoxW2tleV0sIG9iajJba2V5XSkpO1xyXG59O1xyXG5cclxuXHJcbl8uaXNaZXJvQ1NTVmFsdWUgPSB2YWx1ZSA9PiAodmFsdWUgPT09ICcwJykgfHwgKHZhbHVlID09PSAnMHB4JykgfHwgKHZhbHVlID09PSAnMGVtJykgfHwgKHZhbHVlID09PSAnMCUnKTtcclxuXHJcbi8vSGVscGVyIG1ldGhvZHNcclxuXHJcbihmdW5jdGlvbigpIHtcclxuICBsZXQgbG9jYWxEQjtcclxuICB0cnkge1xyXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Rlc3RMb2NhbERCJywgdHJ1ZSk7XHJcbiAgICBsb2NhbERCID0gKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0ZXN0TG9jYWxEQicpICE9IG51bGwpO1xyXG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rlc3RMb2NhbERCJyk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGxvY2FsREIgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIHJldHVybiBfLmNhblVzZUxvY2FsREIgID0gKCkgPT4gbG9jYWxEQjtcclxufSkoKTtcclxuXHJcbl8uaXNJZnJhbWUgPSAoKSA9PiBwYXJlbnQgIT09IHdpbmRvdztcclxuXHJcbl8ubG9hZFNjcmlwdCA9IChqc1BhdGgsIGFzeW5jID0gdHJ1ZSwgb25sb2FkID0gbnVsbCwgYXV0b2RlbGV0ZSA9IGZhbHNlKSA9PntcclxuICBjb25zdCBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xyXG4gIHNjcmlwdC5hc3luYyA9IGFzeW5jID09PSB0cnVlO1xyXG4gIHNjcmlwdC5zcmMgPSBqc1BhdGg7XHJcbiAgc2NyaXB0Lm9uZXJyb3IgPSAoc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uKGFyZ3MpIHtcclxuICAgIGlmIChhdXRvZGVsZXRlKSB7IGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoc2NyaXB0KTsgfVxyXG4gICAgcmV0dXJuIG9ubG9hZCAmJiBvbmxvYWQuYXBwbHkobnVsbCwgYXJncyk7XHJcbiAgfSk7XHJcbiAgXHJcbiAgcmV0dXJuIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcclxufTtcclxuXHJcbihmdW5jdGlvbigpIHtcclxuICBjb25zdCByYW5kb21TdHIgPSAoKSA9PiBNYXRoLmZsb29yKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKS50b1N0cmluZygzMikuc3Vic3RyaW5nKDEpO1xyXG5cclxuICByZXR1cm4gXy51bmlxdWVJZCA9ICgpID0+IGAke18udGltZSgpLnRvU3RyaW5nKDMyKX1fJHtyYW5kb21TdHIoKX0ke3JhbmRvbVN0cigpfSR7cmFuZG9tU3RyKCl9YDtcclxufSkoKTtcclxuXHJcbl8ub25lID0gZm4gPT5cclxuICBmdW5jdGlvbigpIHtcclxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm4pIHtcclxuICAgICAgY29uc3QgZm4xID0gZm47XHJcbiAgICAgIGZuID0gbnVsbDtcclxuICAgICAgcmV0dXJuIGZuMS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfVxyXG4gIH1cclxuO1xyXG5cclxuXy5jYWNoZSA9IGZ1bmN0aW9uKGlzVmFsaWQsIGNhY2hlKSB7XHJcbiAgaWYgKGNhY2hlID09IG51bGwpIHsgY2FjaGUgPSB7fTsgfVxyXG4gIHJldHVybiBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgcmV0dXJuIGNhY2hlW25hbWVdO1xyXG4gICAgfSBlbHNlIGlmICghaXNWYWxpZCB8fCBpc1ZhbGlkKHZhbHVlKSkge1xyXG4gICAgICByZXR1cm4gY2FjaGVbbmFtZV0gPSB2YWx1ZTtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG5cclxuXy5tZW1vaXplID0gZnVuY3Rpb24oZ2VuZXJhdG9yLCBjYWNoZSkge1xyXG4gIGlmIChjYWNoZSA9PSBudWxsKSB7IGNhY2hlID0ge307IH1cclxuICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICBsZXQgZnVsbGtleTtcclxuICAgIGZvciAobGV0IGFyZyBvZiBBcnJheS5mcm9tKGFyZ3VtZW50cykpIHtcclxuICAgICAgY29uc3Qga2V5ID0gXy5pc1N0cmluZyhhcmcpID8gYXJnIDogSlNPTi5zdHJpbmdpZnkoYXJnKTtcclxuICAgICAgZnVsbGtleSA9IChmdWxsa2V5ICE9IG51bGwpID8gYCR7ZnVsbGtleX0sICR7a2V5fWAgOiBrZXk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGZ1bGxrZXkgaW4gY2FjaGUpIHtcclxuICAgICAgcmV0dXJuIGNhY2hlW2Z1bGxrZXldO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGNhY2hlW2Z1bGxrZXldID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICB9XHJcbiAgfTtcclxufTtcclxuXHJcbi8vIGxhc3QgYXJndW1lbnQgb2YgZ2VuZXJhdG9yIGZ1bmN0aW9uIHNob3VsZCBiZSBjYWxsYmFjayBmdW5jdGlvblxyXG5fLm1lbW9pemVBc3luYyA9IGZ1bmN0aW9uKGdlbmVyYXRvciwgY2FjaGUpIHtcclxuICBpZiAoY2FjaGUgPT0gbnVsbCkgeyBjYWNoZSA9IHt9OyB9XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xyXG4gICAgbGV0IGNhbGxiYWNrO1xyXG4gICAgY29uc3QgYXJncyA9IFtdO1xyXG4gICAgZm9yIChsZXQgYXJnIG9mIEFycmF5LmZyb20oYXJndW1lbnRzKSkgeyBhcmdzLnB1c2goYXJnKTsgfVxyXG4gICAgaWYgKGFyZ3MubGVuZ3RoID4gMSkgeyBjYWxsYmFjayA9IChhcmdzLnBvcCkoKTsgfVxyXG4gICAgY29uc3QgZnVsbGtleSA9IGFyZ3Muam9pbignLCAnKTtcclxuICAgIGlmIChmdWxsa2V5IGluIGNhY2hlKSB7XHJcbiAgICAgIHJldHVybiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nID8gY2FsbGJhY2soY2FjaGVbZnVsbGtleV0pIDogdW5kZWZpbmVkKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFyZ3MucHVzaChmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgY2FjaGVbZnVsbGtleV0gPSBkYXRhO1xyXG4gICAgICAgIHJldHVybiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nID8gY2FsbGJhY2soZGF0YSkgOiB1bmRlZmluZWQpO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIGdlbmVyYXRvci5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG5cclxuXy5yZXF1aXJlID0gXy5tZW1vaXplQXN5bmMoKGpzUGF0aCwgY2FsbGJhY2spID0+IF8ubG9hZFNjcmlwdChqc1BhdGgsIHRydWUsICgpID0+IGNhbGxiYWNrKF8uZXhwb3J0cygpKSkpO1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG4gIGxldCBjYWNoZSA9IHVuZGVmaW5lZDtcclxuICByZXR1cm4gXy5leHBvcnRzID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIGNvbnN0IHJldFZhbHVlID0gY2FjaGU7XHJcbiAgICBjYWNoZSA9ICh2YWx1ZSAhPSBudWxsKSA/IHZhbHVlIDogdW5kZWZpbmVkO1xyXG4gICAgcmV0dXJuIHJldFZhbHVlO1xyXG4gIH07XHJcbn0pKCk7XHJcbiIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCB1dGlsID0gcmguXztcclxubGV0IHsgJCB9ID0gcmg7XHJcblxyXG5sZXQgZGF0YVdpZGdldCA9IGZ1bmN0aW9uKGF0dHIpIHtcclxuICBjbGFzcyBEYXRhV2lkZ2V0IGV4dGVuZHMgcmguV2lkZ2V0IHtcclxuICAgIHN0YXRpYyBpbml0Q2xhc3MoKSB7XHJcbiAgXHJcbiAgICAgIHRoaXMucHJvdG90eXBlLmRhdGFBdHRyTWV0aG9kcyA9IChmdW5jdGlvbigpIHtcclxuICAgICAgICBsZXQgbWFwID0ge307XHJcbiAgICAgICAgbWFwW2BkYXRhLSR7YXR0cn1gXSA9IGBkYXRhXyR7YXR0cn1gO1xyXG4gICAgICAgIHJldHVybiBtYXA7XHJcbiAgICAgICAgfSkoKTtcclxuICAgIH1cclxuXHJcbiAgICB0b1N0cmluZygpIHsgcmV0dXJuIGAke2F0dHJ9XyR7dGhpcy5fY291bnR9YDsgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcclxuICAgICAgc3VwZXIob3B0cyk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBVc2UgZ2xvYmFsIG1vZGVsIHVubGVzcyBzb21lb25lIGdpdmVzIHlvdSBpbiBqYXZhc2NyaXB0XHJcbiAgICAgIGlmICh0aGlzLm1vZGVsID09IG51bGwpIHsgdGhpcy5tb2RlbCA9IHJoLm1vZGVsOyB9XHJcbiAgICAgICQuZGF0YXNldCh0aGlzLm5vZGUsIGF0dHIsIG9wdHMucmF3QXJnKTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0KHBhcmVudCkge1xyXG4gICAgICBpZiAodGhpcy5pbml0RG9uZSkgeyByZXR1cm47IH1cclxuICAgICAgdGhpcy5pbml0RG9uZSA9IHRydWU7XHJcbiAgICAgIHRoaXMuaW5pdFBhcmVudChwYXJlbnQpO1xyXG4gICAgICB0aGlzLmluaXRVSSgpO1xyXG4gICAgICByZXR1cm4gdGhpcy5yZXNvbHZlRGF0YUF0dHJzKHRoaXMubm9kZSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIERhdGFXaWRnZXQuaW5pdENsYXNzKCk7XHJcbiAgICAgIFxyXG4gIHJldHVybiBEYXRhV2lkZ2V0O1xyXG59O1xyXG4gICAgXHJcbmZvciAobGV0IGF0dHIgb2YgQXJyYXkuZnJvbShyaC5XaWRnZXQucHJvdG90eXBlLmRhdGFBdHRycykpIHsgd2luZG93LnJoLndpZGdldHNbYXR0cl0gPSAgZGF0YVdpZGdldChhdHRyKTsgfSIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCB1dGlsID0gcmguXztcclxubGV0IHsgJCB9ID0gcmg7XHJcblxyXG5jbGFzcyBHbG9iYWwgZXh0ZW5kcyByaC5XaWRnZXQge1xyXG5cclxuICBjb25zdHJ1Y3RvcihvcHRzKSB7XHJcbiAgICBzdXBlcihvcHRzKTtcclxuICAgIGlmICh0aGlzLm1vZGVsID09IG51bGwpIHsgdGhpcy5tb2RlbCA9IHJoLm1vZGVsOyB9XHJcbiAgfVxyXG59XHJcbiAgICBcclxud2luZG93LnJoLndpZGdldHMuR2xvYmFsID0gR2xvYmFsOyIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCB7IF8gfSA9IHJoO1xyXG5sZXQgeyAkIH0gPSByaDtcclxubGV0IHsgY29uc3RzIH0gPSByaDtcclxubGV0IHsgV2lkZ2V0IH0gPSByaDtcclxuXHJcbmNsYXNzIExpc3QgZXh0ZW5kcyBXaWRnZXQge1xyXG4gIHN0YXRpYyBpbml0Q2xhc3MoKSB7XHJcblxyXG4gICAgdGhpcy5wcm90b3R5cGUuZGF0YUlBdHRycyA9IFsnY2hpbGQnXS5jb25jYXQoV2lkZ2V0LnByb3RvdHlwZS5kYXRhSUF0dHJzKTtcclxuICAgIHRoaXMucHJvdG90eXBlLmRhdGFJQXR0ck1ldGhvZHMgPSAoKCkgPT4gV2lkZ2V0LnByb3RvdHlwZS5tYXBEYXRhQXR0ck1ldGhvZHMoTGlzdC5wcm90b3R5cGUuZGF0YUlBdHRycykpKCk7XHJcblxyXG4gICAgdGhpcy5wcm90b3R5cGUuc3VwcG9ydGVkQXJncyA9IFsnbm9kZScsICdtb2RlbCcsICdrZXknLCAndXNlcl92YXJzJywgJ2ZpbHRlcicsXHJcbiAgICAgJ3NwbGl0b24nLCAncGF0aCcsICd0cGxOb2RlJywgJ3RwbENoaWxkTm9kZXMnXTtcclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKG9wdHMpIHtcclxuICAgIHN1cGVyKG9wdHMpO1xyXG4gICAgdGhpcy5yZVJlbmRlciA9IHRoaXMucmVSZW5kZXIuYmluZCh0aGlzKTtcclxuICAgIHRoaXMucmVuZGVyQ2h1bmNrID0gdGhpcy5yZW5kZXJDaHVuY2suYmluZCh0aGlzKTtcclxuXHJcbiAgICBpZiAodGhpcy5rZXkgPT0gbnVsbCkgeyB0aGlzLmtleSA9IGBfJHt0aGlzfWA7IH1cclxuICAgIGlmICh0aGlzLnBhdGggPT0gbnVsbCkgeyB0aGlzLnBhdGggPSBbXTsgfVxyXG4gICAgaWYgKHRoaXMuY2hpbGRyZW4gPT0gbnVsbCkgeyB0aGlzLmNoaWxkcmVuID0gW107IH1cclxuICAgIGlmICh0aGlzLnVzZXJfdmFycyA9PSBudWxsKSB7IHRoaXMudXNlcl92YXJzID0ge307IH1cclxuICAgIHRoaXMudXNlVGVtcGxhdGUgPSB0cnVlO1xyXG4gICAgdGhpcy5yZW5kZXJlZEluZGV4ID0gMDtcclxuICAgIHRoaXMucmVuZGVyZWRDb3VudCA9IDA7XHJcbiAgfVxyXG5cclxuICBpbml0KHBhcmVudCkge1xyXG4gICAgaWYgKHRoaXMuaW5pdERvbmUpIHsgcmV0dXJuOyB9XHJcbiAgICBzdXBlci5pbml0KHBhcmVudCk7XHJcbiAgICB0aGlzLnN1YnNjcmliZU9ubHkodGhpcy5rZXksIHRoaXMucmVSZW5kZXIsIHtwYXJ0aWFsOiBmYWxzZX0pO1xyXG4gICAgdGhpcy5zdWJzY3JpYmVFeHByKHRoaXMua2V5ZXhwciwgZnVuY3Rpb24ocmVzdWx0KSB7IGlmIChyZXN1bHQgPT0gbnVsbCkgeyByZXN1bHQgPSBbXTsgfSByZXR1cm4gdGhpcy5wdWJsaXNoKHRoaXMua2V5LCByZXN1bHQsIHtzeW5jOiB0cnVlfSk7IH0pO1xyXG4gICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlT25seSh0aGlzLm9wdHMubG9hZG1vcmUsIHRoaXMucmVuZGVyQ2h1bmNrKTtcclxuICB9XHJcblxyXG4gIHBhcnNlT3B0cyhvcHRzKSB7XHJcbiAgICBzdXBlci5wYXJzZU9wdHMob3B0cyk7XHJcbiAgICBpZiAodGhpcy5rZXkpIHtcclxuICAgICAgaWYgKF8uaXNWYWxpZE1vZGVsQ29uc3RLZXkodGhpcy5rZXkpKSB7IHRoaXMua2V5ID0gY29uc3RzKHRoaXMua2V5KTsgfVxyXG4gICAgICBpZiAoIV8uaXNWYWxpZE1vZGVsS2V5KHRoaXMua2V5KSkge1xyXG4gICAgICAgIHRoaXMua2V5ZXhwciA9IHRoaXMua2V5O1xyXG4gICAgICAgIHJldHVybiB0aGlzLmtleSA9IG51bGw7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHBhcnNlUGlwZWRBcmcoKSB7XHJcbiAgICBsZXQgYXJncyA9IHRoaXMub3B0cy5waXBlZEFyZ3M7XHJcbiAgICBpZiAoYXJncyAhPSBudWxsID8gYXJncy5zaGlmdCA6IHVuZGVmaW5lZCkge1xyXG4gICAgICBsZXQgYXJnO1xyXG4gICAgICBpZiAoYXJnID0gYXJncy5zaGlmdCgpKSB7IHRoaXMuZmlsdGVyID0gYXJnOyB9XHJcbiAgICAgIGlmIChhcmcgPSBhcmdzLnNoaWZ0KCkpIHsgdGhpcy5zcGxpdG9uID0gYXJnOyB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKF8uaXNTdHJpbmcodGhpcy5maWx0ZXIpKSB7IHRoaXMuZmlsdGVyID0gdGhpcy5saXN0SXRlbUV4cHIodGhpcy5maWx0ZXIpOyB9XHJcbiAgICBpZiAoXy5pc1N0cmluZyh0aGlzLnNwbGl0b24pKSB7IHJldHVybiB0aGlzLnNwbGl0b24gPSB0aGlzLmxpc3RJdGVtRXhwcih0aGlzLnNwbGl0b24pOyB9XHJcbiAgfVxyXG5cclxuICBub3RpZnlMb2FkaW5nKHZhbHVlKSB7IGlmICh0aGlzLm9wdHMubG9hZGluZykgeyByZXR1cm4gdGhpcy5wdWJsaXNoKHRoaXMub3B0cy5sb2FkaW5nLCB2YWx1ZSk7IH0gfVxyXG5cclxuICBsaXN0SXRlbUV4cHIoZXhwcikgeyByZXR1cm4gdGhpcy5fZXZhbEZ1bmN0aW9uKCdpdGVtLCBpbmRleCcsIGV4cHIpOyB9XHJcblxyXG4gIGlzV2lkZ2V0Tm9kZShub2RlKSB7IHJldHVybiBzdXBlci5pc1dpZGdldE5vZGUoLi4uYXJndW1lbnRzKSB8fCAkLmRhdGFzZXQobm9kZSwgJ2NoaWxkJyk7IH1cclxuXHJcbiAgcmVSZW5kZXIocmVuZGVyKSB7XHJcbiAgICB0aGlzLmRhdGEgPSBudWxsO1xyXG4gICAgdGhpcy5yZW5kZXJlZEluZGV4ID0gMDtcclxuICAgIHRoaXMucmVuZGVyZWRDb3VudCA9IDA7XHJcbiAgICByZXR1cm4gc3VwZXIucmVSZW5kZXIocmVuZGVyKTtcclxuICB9XHJcblxyXG4gIHByZVJlbmRlcigpIHtcclxuICAgIGxldCBub2RlO1xyXG4gICAgbGV0IG9sZE5vZGUgPSB0aGlzLm5vZGU7XHJcbiAgICBpZiAodGhpcy50cGxDaGlsZE5vZGVzID09IG51bGwpIHtcclxuICAgICAgdGhpcy50cGxDaGlsZE5vZGVzID0gKCgoKSA9PiB7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IFtdO1xyXG4gICAgICAgIGZvciAobm9kZSBvZiBBcnJheS5mcm9tKHRoaXMudHBsTm9kZS5jaGlsZE5vZGVzKSkgeyAgICAgICAgICAgcmVzdWx0LnB1c2gobm9kZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgIH0pKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubm9kZSA9IHRoaXMudHBsTm9kZS5jbG9uZU5vZGUoZmFsc2UpO1xyXG4gICAgcmV0dXJuIG9sZE5vZGU7XHJcbiAgfVxyXG5cclxuICBhbHRlck5vZGVDb250ZW50KCkge1xyXG4gICAgaWYgKHRoaXMuZGF0YSA9PSBudWxsKSB7IHRoaXMuZGF0YSA9IHRoaXMuZ2V0KHRoaXMua2V5KSB8fCBbXTsgfVxyXG4gICAgcmV0dXJuICh0aGlzLnJlbmRlckNodW5jaykoKTtcclxuICB9XHJcblxyXG4gIHJlbmRlckNodW5jaygpIHtcclxuICAgIGxldCBpO1xyXG4gICAgbGV0IGVuZDtcclxuICAgIHRoaXMubm90aWZ5TG9hZGluZyhmYWxzZSk7XHJcbiAgICBmb3IgKGkgPSB0aGlzLnJlbmRlcmVkSW5kZXgsIGVuZCA9IHRoaXMuZGF0YS5sZW5ndGggLSAxOyBpIDw9IGVuZDsgaSsrKSB7XHJcbiAgICAgIGxldCBpdGVtID0gdGhpcy5kYXRhW2ldO1xyXG4gICAgICBpZiAodGhpcy5maWx0ZXIgJiYgIXRoaXMuZmlsdGVyKGl0ZW0sIGkpKSB7IGNvbnRpbnVlOyB9XHJcbiAgICAgIGlmICh0aGlzLnNwbGl0b24gJiYgKGkgIT09IHRoaXMucmVuZGVyZWRJbmRleCkgJiYgdGhpcy5zcGxpdG9uKGl0ZW0sIHRoaXMucmVuZGVyZWRDb3VudCkpIHtcclxuICAgICAgICB0aGlzLm5vdGlmeUxvYWRpbmcodHJ1ZSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJPbmVJdGVtKGl0ZW0sIGkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnJlbmRlcmVkSW5kZXggPSBpO1xyXG4gICAgaWYgKHRoaXMucmVuZGVyZWRDb3VudCA9PT0gMCkgeyB0aGlzLmhpZGUoKTsgfSBlbHNlIGlmICghdGhpcy5pc1Zpc2libGUoKSkgeyB0aGlzLnNob3coKTsgfVxyXG4gICAgaWYgKHRoaXMub3B0cy5sb2FkZWQgJiYgKGkgPT09IHRoaXMuZGF0YS5sZW5ndGgpKSB7IHJldHVybiB0aGlzLnB1Ymxpc2godGhpcy5vcHRzLmxvYWRlZCwgdHJ1ZSk7IH1cclxuICB9XHJcblxyXG4gIHJlbmRlck9uZUl0ZW0oaXRlbSwgaW5kZXgpIHtcclxuICAgIHRoaXMucmVuZGVyZWRJbmRleCA9IGluZGV4O1xyXG4gICAgbGV0IGdlbmVyYXRlaW5kZXggPSB0aGlzLm9wdHMuZ2VuZXJhdGVpbmRleCB8fCByaC5fZGVidWc7XHJcbiAgICBmb3IgKGxldCBub2RlIG9mIEFycmF5LmZyb20odGhpcy50cGxDaGlsZE5vZGVzKSkge1xyXG4gICAgICB2YXIgbmV3Tm9kZTtcclxuICAgICAgaWYgKChuZXdOb2RlID0gdGhpcy5yZXNvbHZlX3JpZihub2RlLCBpdGVtLCBpbmRleCkpKSB7XHJcbiAgICAgICAgaWYgKGluY3JlbWVudGVkID09IG51bGwpIHtcclxuICAgICAgICAgIHRoaXMucmVuZGVyZWRDb3VudCsrO1xyXG4gICAgICAgICAgdmFyIGluY3JlbWVudGVkID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGdlbmVyYXRlaW5kZXgpIHsgJC5kYXRhc2V0KG5ld05vZGUsICdsaXN0aW5kZXgnLCB0aGlzLnJlbmRlcmVkQ291bnQgLSAxKTsgfVxyXG4gICAgICAgIGlmIChuZXdOb2RlLmhhc0NoaWxkTm9kZXMoKSkgeyB0aGlzLnJlbmRlckNoaWxkTGlzdChuZXdOb2RlLCBpdGVtLCBpbmRleCk7IH1cclxuICAgICAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQobmV3Tm9kZSk7XHJcbiAgICAgICAgdGhpcy5yZXNvbHZlSXRlbUluZGV4KG5ld05vZGUsIGl0ZW0sIGluZGV4KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29udmVydFRvTGlzdENvbnRhaW5lcihub2RlKSB7fVxyXG5cclxuICBfcGF0aElkKGluZGV4KSB7XHJcbiAgICBsZXQgaWQgPSAnXyc7XHJcbiAgICBpZCArPSB0aGlzLnBhdGguam9pbignXycpO1xyXG4gICAgaWYgKGluZGV4ICE9IG51bGwpIHtcclxuICAgICAgaWYgKHRoaXMucGF0aC5sZW5ndGggPiAwKSB7IGlkICs9ICdfJzsgfVxyXG4gICAgICBpZCArPSBpbmRleDtcclxuICAgIH1cclxuICAgIHJldHVybiBpZDtcclxuICB9XHJcblxyXG4gIF9wYXRoS2V5KHN1YnBhdGgpIHtcclxuICAgIGlmIChzdWJwYXRoID09IG51bGwpIHsgc3VicGF0aCA9ICcnOyB9XHJcbiAgICBzdWJwYXRoID0gc3VicGF0aC50b1N0cmluZygpO1xyXG4gICAgbGV0IHBhdGggPSB0aGlzLnBhdGguam9pbignLicpO1xyXG4gICAgaWYgKChzdWJwYXRoLmxlbmd0aCA+IDApICYmIChwYXRoLmxlbmd0aCA+IDApKSB7XHJcbiAgICAgIHJldHVybiBgLiR7cGF0aH0uJHtzdWJwYXRofWA7XHJcbiAgICB9IGVsc2UgaWYgKHN1YnBhdGgubGVuZ3RoID4gMCkge1xyXG4gICAgICByZXR1cm4gYC4ke3N1YnBhdGh9YDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBgLiR7cGF0aH1gO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLypcclxuICAgKiBAcGF0aDogdW5pcXVlIHBhdGggZm9yIGxpc3RcclxuICAgKiBAcHBhdGg6IHVuaXF1ZSBwYXRoIG9mIHBhcmVudFxyXG4gICAqL1xyXG4gIHJlc29sdmVSZXBlYXRWYXIoZXhwciwgaXRlbSwgaW5kZXgsIGNhY2hlLCBub2RlKSB7XHJcbiAgICByZXR1cm4gY2FjaGVbZXhwcl0gPSBjYWNoZVtleHByXSB8fCAoKCkgPT4geyBzd2l0Y2ggKGV4cHIpIHtcclxuICAgICAgY2FzZSAnQGl0ZW1rZXknOiByZXR1cm4gYCR7dGhpcy5rZXl9LiR7aW5kZXh9YDtcclxuICAgICAgY2FzZSAnQGtleSc6IHJldHVybiB0aGlzLmtleTtcclxuICAgICAgY2FzZSAnQGlkJzogcmV0dXJuIHRoaXMuX3BhdGhJZChpbmRleCk7XHJcbiAgICAgIGNhc2UgJ0BwaWQnOiByZXR1cm4gdGhpcy5fcGF0aElkKCk7XHJcbiAgICAgIGNhc2UgJ0BwYXRoJzogcmV0dXJuIHRoaXMuX3BhdGhLZXkoaW5kZXgpO1xyXG4gICAgICBjYXNlICdAcHBhdGgnOiByZXR1cm4gdGhpcy5fcGF0aEtleSgpO1xyXG4gICAgICBjYXNlICdAbGV2ZWwnOiByZXR1cm4gdGhpcy5wYXRoLmxlbmd0aDtcclxuICAgICAgZGVmYXVsdDogcmV0dXJuIHN1cGVyLnJlc29sdmVSZXBlYXRWYXIoZXhwciwgaXRlbSwgaW5kZXgsIGNhY2hlLCBub2RlKTtcclxuICAgIH0gfSkoKTtcclxuICB9XHJcblxyXG4gIGRhdGFfY2hpbGQobm9kZSwgcmF3RXhwciwgaXRlbSwgaW5kZXgsIGF0dHJzSW5mbykge1xyXG4gICAgaWYgKCFfLmlzVmFsaWRNb2RlbEtleShyYXdFeHByKSkge1xyXG4gICAgICAkLmRhdGFzZXQobm9kZSwgJ2NoaWxkJywgdGhpcy5zdWJzY3JpYmVJRGF0YUV4cHIobm9kZSwgcmF3RXhwciwgaXRlbSwgaW5kZXgpKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8qXHJcbiAgICogaXQgY2FuIGJlIGtleSBvciBleHByZXNzaW9uXHJcbiAgICogZGF0YS1jaGlsZD1cInZhbHVlXCJcclxuICAgKiBkYXRhLWNoaWxkPVwiQC5wLnZhbHVlXCJcclxuICAgKi9cclxuICByZW5kZXJDaGlsZExpc3Qobm9kZSwgaXRlbSwgaW5kZXgpIHtcclxuICAgIHJldHVybiAkLmVhY2hEYXRhTm9kZShub2RlLCAnY2hpbGQnLCBmdW5jdGlvbihjaGlsZE5vZGUsIHZhbHVlKSB7XHJcbiAgICAgIHRoaXMuY29udmVydFRvTGlzdENvbnRhaW5lcihub2RlKTtcclxuICAgICAgdGhpcy5yZXNvbHZlSXRlbUluZGV4KGNoaWxkTm9kZSwgaXRlbSwgaW5kZXgpO1xyXG5cclxuICAgICAgdmFsdWUgPSAkLmRhdGFzZXQoY2hpbGROb2RlLCAnY2hpbGQnKTsgLy9nZXQgdXBkYXRlZCB2YWx1ZVxyXG4gICAgICBpZiAoKHZhbHVlID09PSAndW5kZWZpbmVkJykgfHwgKHZhbHVlID09PSAnJykpIHtcclxuICAgICAgICByZXR1cm4gY2hpbGROb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2hpbGROb2RlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgYXJncyA9IHZhbHVlLnNwbGl0KCd8Jyk7XHJcbiAgICAgICAgbGV0IGZpbHRlciA9IGFyZ3NbMV07XHJcbiAgICAgICAgbGV0IGNoaWxka2V5ID0gYXJnc1swXTtcclxuXHJcbiAgICAgICAgbGV0IGNoaWxkTGlzdCA9IG5ldyBMaXN0KHtcclxuICAgICAgICAgIG5vZGU6IGNoaWxkTm9kZSxcclxuICAgICAgICAgIG1vZGVsOiB0aGlzLm1vZGVsLFxyXG4gICAgICAgICAga2V5OiBjaGlsZGtleSxcclxuICAgICAgICAgIHVzZXJfdmFyczogdGhpcy51c2VyX3ZhcnMsXHJcbiAgICAgICAgICBwYXRoOiB0aGlzLnBhdGguY29uY2F0KFt0aGlzLnJlbmRlcmVkQ291bnQgLSAxXSksXHJcbiAgICAgICAgICBmaWx0ZXIsXHJcbiAgICAgICAgICB0cGxOb2RlOiBjaGlsZE5vZGUuY2xvbmVOb2RlKGZhbHNlKSxcclxuICAgICAgICAgIHRwbENoaWxkTm9kZXM6IHRoaXMudHBsQ2hpbGROb2Rlc1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjaGlsZExpc3QuaW5pdCh0aGlzKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkTGlzdCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgICwgdGhpcyk7XHJcbiAgfVxyXG59XHJcbkxpc3QuaW5pdENsYXNzKCk7XHJcblxyXG53aW5kb3cucmgud2lkZ2V0cy5MaXN0ID0gTGlzdDtcclxuIiwicmVxdWlyZShcIi4uL2xpYi9yaFwiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvdXRpbHMvdXRpbHNcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL2NvbW1vbi9xdWVyeVwiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvdXRpbHMvdXJsX3V0aWxzXCIpXHJcbiIsImxldCByaCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9yaCcpXHJcblxyXG5jbGFzcyBPbkxvYWQge1xyXG4gIGNvbnN0cnVjdG9yKHdpZGdldCwgbm9kZSwgcmF3RXhwcikge1xyXG4gICAgbGV0IHtjYWxsYmFja30gPSB3aWRnZXQucmVzb2x2ZVJhd0V4cHJXaXRoVmFsdWUocmF3RXhwcilcclxuICAgIG5vZGUub25sb2FkID0gKCkgPT4gY2FsbGJhY2suY2FsbCh3aWRnZXQpXHJcbiAgfVxyXG59XHJcblxyXG5yaC5yZWdpc3RlckRhdGFBdHRyKCdvbmxvYWQnLCBPbkxvYWQpXHJcbiIsInJlcXVpcmUoXCIuLi9saWIvcmhcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL3V0aWxzL3BhcnNlX3V0aWxzXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy91dGlscy9kZWJ1Z191dGlsc1wiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvdXRpbHMvZXZlbnRfdXRpbHNcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL3V0aWxzL21vZGVsX3V0aWxzXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy91dGlscy91bmljb2RlX3V0aWxzXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9jb21tb24vZGVidWdcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL2NvbW1vbi9jb25zdHNcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL2NvbW1vbi9tb2RlbFwiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvY29tbW9uL2RhdGFfdXRpbFwiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvY29tbW9uL2d1YXJkXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9jb21tb24vcGx1Z2luXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9jb21tb24vY29uc29sZVwiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvY29tbW9uL3dpZGdldFwiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvY29tbW9uL2luaXRcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL2NvbW1vbi9tZXNzYWdlXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9jb21tb24vaWZyYW1lXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9jb21tb24vc3RvcmFnZVwiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvY29tbW9uL3Jlc3BvbnNpdmVcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL2NvbW1vbi9zY3JlZW5cIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL2NvbW1vbi9ub2RlX2hvbGRlclwiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvY29tbW9uL2NvbnRyb2xsZXJcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL2NvbW1vbi9odHRwXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9kYXRhX2F0dHJpYnV0ZXMvZGF0YV9hdHRyXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9kYXRhX2F0dHJpYnV0ZXMvcmVzaXplXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9kYXRhX2F0dHJpYnV0ZXMvdGFibGVcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL2RhdGFfYXR0cmlidXRlcy90YWJsZV9yZWN1cnNpdmVcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL3dpZGdldHMvZ2xvYmFsXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy93aWRnZXRzL2xpc3RcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL3dpZGdldHMvZGF0YV93aWRnZXRzXCIpXHJcbnJlcXVpcmUoXCIuL2RhdGFfYXR0cmlidXRlcy9vbmxvYWRcIilcclxucmVxdWlyZShcIi4vdXRpbHMvb3BlcmF0b3Jfc2VhcmNoXCIpXHJcbnJlcXVpcmUoXCIuL3V0aWxzL2NvbGxlY3Rpb25zXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9pbmRpZ28vaGFuZGxlcnNcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL2NvbW1vbi9yaHNcIilcclxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklpSXNJbVpwYkdVaU9pSmpiMnhzWldOMGFXOXVjeTVxY3lJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYlhYMD0iLCJsZXQgcmggPSByZXF1aXJlKCcuLi8uLi9saWIvcmgnKVxyXG5sZXQgXyA9IHJoLl9cclxuXy5pc0FORCA9ICggYV9zdHJPcCwgZW5hYmxlT3BlcmF0b3JTZWFyY2ggKSA9PntcclxuICByZXR1cm4gKGVuYWJsZU9wZXJhdG9yU2VhcmNoICYmXHJcbiAgICAgICAgICAgIChhX3N0ck9wID09PSBcImFuZFwiIHx8IGFfc3RyT3AgPT09IFwiJlwifHwgYV9zdHJPcCA9PT0gXCJBTkRcIikpfHxcclxuICAgICAgICAgICAgYV9zdHJPcCA9PT0gXCJcXHUwMEFDYW5kXFx1MDBBQ1wiIDtcclxufVxyXG5cclxuXy5pc09SID0gKCBhX3N0ck9wLCBlbmFibGVPcGVyYXRvclNlYXJjaCApID0+e1xyXG4gIHJldHVybiAoIGVuYWJsZU9wZXJhdG9yU2VhcmNoICYmXHJcblx0XHRcdFx0KGFfc3RyT3AgPT09XCJvclwiIHx8IGFfc3RyT3AgPT09IFwifFwiIHx8IGFfc3RyT3AgPT09IFwiT1JcIikpO1xyXG59XHJcblxyXG5fLmlzTk9UID0gKCBhX3N0ck9wLCBlbmFibGVPcGVyYXRvclNlYXJjaCkgPT57XHJcbiAgcmV0dXJuICBlbmFibGVPcGVyYXRvclNlYXJjaCAmJlxyXG5cdFx0XHRcdFx0XHQoYV9zdHJPcCA9PT0gXCJub3RcIiB8fCBhX3N0ck9wID09PSBcIn5cIiB8fCBhX3N0ck9wID09PSBcIk5PVFwiKVxyXG59XHJcblxyXG5fLmlzT3BlcmF0b3IgPSAoIHN0ck9wLCBlbmFibGVPcGVyYXRvclNlYXJjaCApID0+e1xyXG4gIGlmICggc3RyT3AgPT09IFwiXFx1MDBBQ2FuZFxcdTAwQUNcInx8XHJcbiAgICAgICAgKGVuYWJsZU9wZXJhdG9yU2VhcmNoICYmXHJcblx0XHRcdFx0KHN0ck9wID09PSBcImFuZFwiIHx8IHN0ck9wID09PSBcIm9yXCIgfHwgc3RyT3AgPT09IFwibm90XCIgKSkpe1xyXG4gICAgcmV0dXJuIHRydWVcclxuICB9XHJcbiAgcmV0dXJuIGZhbHNlICAgICAgXHJcbn1cclxuIiwiLy9HdW5qYW5cclxuaWYgKGdsb2JhbC5yaCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgZ2xvYmFsLnJoID0ge307XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2xvYmFsLnJoXHJcbiJdfQ==
