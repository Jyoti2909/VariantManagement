(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var model = rh.model;
var consts = rh.consts;
var _ = rh._;

var PhoneGap = function () {
  function PhoneGap() {
    _classCallCheck(this, PhoneGap);

    this.addJsToTopics();
  }

  _createClass(PhoneGap, [{
    key: 'addJsToTopics',
    value: function addJsToTopics() {
      return model.subscribeOnce(consts('KEY_MOBILE_APP_MODE'), function (val) {
        if (val) {
          return model.subscribe(consts('EVT_WIDGET_LOADED'), function () {
            return _.loadScript(consts('CORDOVA_JS_URL'), false, function () {
              if (rh.debug) {
                return rh._d('info', 'loaded Cordova.js');
              }
            });
          });
        }
      });
    }
  }]);

  return PhoneGap;
}();

new PhoneGap();

},{}],2:[function(require,module,exports){
'use strict';

var _window = window,
    rh = _window.rh;
var consts = rh.consts;


rh.model.subscribe(consts('EVT_SCROLL_TO_TOP'), function (dummy) {
  return window.scrollTo(0, 0);
});

rh.model.subscribe(consts('EVT_PRINT_TOPIC'), function () {
  window.focus();
  return window.print();
});

},{}],3:[function(require,module,exports){
'use strict';

var _window = window,
    rh = _window.rh;
var _ = rh._;
var consts = rh.consts;


_.getRootUrl = function () {
  var rootUrl = null;
  return function () {
    if (rootUrl == null) {
      var rootInfo = window.gScreenRelPathMap[window.gFinalCommonRootRelPath];
      rootUrl = '' + _.getHostFolder() + _.fixRelativeUrl(rootInfo != null ? rootInfo.defaultURL : undefined);
    }
    return rootUrl;
  };
}();

_.redirectToLayout = function () {
  var hostFolder = _.getHostFolder();
  var query = '';
  var relUrl = window._getRelativeFileName(hostFolder, decodeURI(document.location.href));
  var ref = document.referrer;
  if (ref && !_.isExternalUrl(ref)) {
    var queryMap = _.urlParams(_.extractParamString(ref));
    if (!_.isEmptyObject(queryMap)) {
      query = '?' + _.mapToEncodedString(queryMap);
    }
  }

  var hashMap = _.urlParams(_.extractParamString(relUrl));
  hashMap[consts('HASH_KEY_TOPIC')] = _.stripParam(relUrl);
  hashMap[consts('HASH_KEY_UIMODE')] = null;
  var hash = '#' + _.mapToEncodedString(hashMap);
  return document.location.replace('' + _.getRootUrl() + query + hash);
};

_.goToFullLayout = function () {
  var hostFolder = _.getHostFolder();
  var query = '';
  var relUrl = window._getRelativeFileName(hostFolder, decodeURI(document.location.href));
  var ref = document.referrer;
  if (ref && !_.isExternalUrl(ref)) {
    var queryMap = _.urlParams(_.extractParamString(ref));
    queryMap[consts('RHMAPID')] = null;
    queryMap[consts('RHMAPNO')] = null;
    if (!_.isEmptyObject(queryMap)) {
      query = '?' + _.mapToEncodedString(queryMap);
    }
  }

  var topicPagePath = consts('START_FILEPATH');
  if (topicPagePath && topicPagePath !== '') {
    var rootUrl = '' + hostFolder + _.fixRelativeUrl(topicPagePath);
    var hashMap = _.urlParams(_.extractParamString(relUrl));
    hashMap[consts('HASH_KEY_TOPIC')] = _.stripParam(relUrl);
    hashMap[consts('HASH_KEY_UIMODE')] = null;
    var hash = '#' + _.mapToEncodedString(hashMap);
    return document.location.replace('' + rootUrl + query + hash);
  }
};

},{}],4:[function(require,module,exports){
(function (global){
"use strict";

//Gunjan
if (global.rh === undefined) {
  global.rh = {};
}

module.exports = global.rh;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],5:[function(require,module,exports){
"use strict";

require("../lib/rh");
require("../../lenient_src/robohelp/topic/url_utils");
require("../../lenient_src/robohelp/topic/topic_events");
require("../../lenient_src/robohelp/topic/phonegap");
require("./topic/init");
require("./topic/widgets/dropdown_text");
require("./topic/widgets/expanding_text");
require("./topic/widgets/popover");
require("./topic/widgets/hyperlink_popover");
require("./topic/widgets/text_popover");
require("./topic/widgets/trigger");
require("./topic/highlight");
require("../../lenient_src/robohelp/topic/topic_events");

},{"../../lenient_src/robohelp/topic/phonegap":1,"../../lenient_src/robohelp/topic/topic_events":2,"../../lenient_src/robohelp/topic/url_utils":3,"../lib/rh":4,"./topic/highlight":6,"./topic/init":7,"./topic/widgets/dropdown_text":8,"./topic/widgets/expanding_text":9,"./topic/widgets/hyperlink_popover":10,"./topic/widgets/popover":11,"./topic/widgets/text_popover":12,"./topic/widgets/trigger":13}],6:[function(require,module,exports){
'use strict';

var rh = require("../../lib/rh");
var _ = rh._;
var $ = rh.$;

_.removeHighlight = function () {
  var $body = $('body', 0);
  var $highlight_elements = $.find($body, 'span[data-highlight]') || [];
  _.each($highlight_elements, function (node) {
    $.removeAttribute(node, 'style');
  });
};

rh.model.csubscribe('EVT_REMOVE_HIGHLIGHT', _.removeHighlight);

},{"../../lib/rh":4}],7:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var rh = require("../../lib/rh");
var _ = rh._;
var consts = rh.consts;
var $ = rh.$;
var model = rh.model;
var EventHandlers = void 0,
    eHandlers = void 0,
    registeredEvents = void 0;

_.onTopicLoad = function () {
  var paramsStr = _.extractParamString(document.location.href);
  var paramsMap = _.urlParams(paramsStr);
  var redirectattr = consts('RH_FULL_LAYOUT_PARAM');
  if (redirectattr in paramsMap) {
    _.addProjectData(_.goToFullLayout);
  } else {
    _.addGoToLayout();
    _.remove_cbt();
  }
};

_.remove_cbt = function () {
  var $body = $('body', 0);
  var $cbt_elements = $.find($body, '[data-rhtags]');
  if ($cbt_elements) {
    _.each($cbt_elements, function (node) {
      $.removeClass(node, 'rh-hide');
    });
  }
};

_.getRelativeTopicPath = function () {
  var path = _.makeRelativeUrl(_.getRootUrl(), _.filePath());
  var index = path.lastIndexOf('/');
  return index !== -1 ? _.parentPath(path) : "";
};

_.addLayoutHTML = function () {

  model.subscribeOnce([consts('KEY_HEADER_HTML')], function () {
    var format = model.get(consts('KEY_HEADER_HTML'));

    if (format && format !== "") {

      model.subscribeOnce([consts('KEY_HEADER_TITLE'), consts('KEY_LNG')], function () {
        var title = model.get(consts('KEY_HEADER_TITLE'));
        var label = model.get(consts('KEY_LNG')).ShowTopicInContext;
        label = label ? label : "Click here to see this page in full context";
        var tooltip = label;
        var logo = model.get(consts('KEY_HEADER_LOGO_PATH'));
        logo = _.getRelativeTopicPath() + logo;
        var html = _.resolveEnclosedVar(format, function (variable) {
          if (variable === "label") {
            return label;
          } else if (variable === "tooltip") {
            return tooltip;
          } else if (variable === "title") {
            return title;
          } else if (variable === "logo") {
            return logo;
          }
        });
        var $body = $('body', 0);
        var $div = document.createElement("div");
        $div.innerHTML = html;
        $body.insertBefore($div, $body.childNodes[0]);
      });
    }
  });
};

_.addLayoutCSS = function () {

  model.subscribeOnce([consts('KEY_HEADER_CSS')], function () {
    var format = model.get(consts('KEY_HEADER_CSS'));

    if (format && format !== "") {

      model.subscribeOnce([consts('KEY_HEADER_LOGO_PATH'), consts('KEY_HEADER_TITLE_COLOR'), consts('KEY_HEADER_BACKGROUND_COLOR'), consts('KEY_LAYOUT_FONT_FAMILY')], function () {
        var backgroundColor = model.get(consts('KEY_HEADER_BACKGROUND_COLOR'));
        backgroundColor = backgroundColor ? backgroundColor : model.get(consts('KEY_HEADER_DEFAULT_BACKGROUND_COLOR'));
        var color = model.get(consts('KEY_HEADER_TITLE_COLOR'));
        color = color ? color : model.get(consts('KEY_HEADER_DEFAULT_TITLE_COLOR'));
        var fontFamily = model.get(consts('KEY_LAYOUT_FONT_FAMILY'));
        fontFamily = fontFamily ? fontFamily : model.get(consts('KEY_LAYOUT_DEFAULT_FONT_FAMILY'));
        var css = _.resolveEnclosedVar(format, function (variable) {
          if (variable === "background-color") {
            return backgroundColor;
          } else if (variable === "color") {
            return color;
          } else if (variable === "font-family") {
            return fontFamily;
          }
        });
        var $style = document.createElement("style");
        $style.type = 'text/css';
        $style.innerHTML = css;
        document.head.appendChild($style);
      });
    }
  });
};

_.addProjectData = function (callback) {
  callback = callback || function () {};
  var src = _.getRelativeTopicPath() + "template/scripts/projectdata.js";
  _.loadScript(src, null, callback);
};

_.addGoToLayout = function () {
  _.addProjectData();
  _.addLayoutHTML();
  _.addLayoutCSS();
};

model.publish(consts('KEY_SHARED_INPUT'), [consts('KEY_PROJECT_TAG_COMBINATIONS'), consts('KEY_TAG_EXPRESSION'), {
  key: consts('EVT_SCROLL_TO_TOP'),
  nested: false
}, consts('EVT_PRINT_TOPIC'), consts('KEY_MERGED_PROJECT_MAP'), consts('KEY_PROJECT_LIST'), consts('KEY_SHOW_TAGS'), consts('KEY_IFRAME_EVENTS'), consts('EVT_RELOAD_TOPIC'), consts('KEY_MOBILE_APP_MODE'), consts('KEY_HEADER_LOGO_PATH'), consts('KEY_HEADER_TITLE'), consts('KEY_HEADER_TITLE_COLOR'), consts('KEY_HEADER_BACKGROUND_COLOR'), consts('KEY_LAYOUT_FONT_FAMILY'), consts('KEY_HEADER_HTML'), consts('KEY_HEADER_CSS'), consts('KEY_HEADER_DEFAULT_BACKGROUND_COLOR'), consts('KEY_HEADER_DEFAULT_TITLE_COLOR'), consts('KEY_LAYOUT_DEFAULT_FONT_FAMILY'), consts('KEY_TOC_ORDER'), consts('EVT_COLLAPSE_ALL'), consts('EVT_EXPAND_ALL'), consts('KEY_SEARCH_HIGHLIGHT_COLOR'), consts('KEY_SEARCH_BG_COLOR'), consts('EVT_REMOVE_HIGHLIGHT')]);

model.publish(consts('KEY_SHARED_OUTPUT'), [consts('KEY_TOPIC_URL'), consts('KEY_TOPIC_ID'), consts('KEY_TOPIC_TITLE'), consts('KEY_TOPIC_BRSMAP'), consts('SHOW_MODAL'), consts('EVT_NAVIGATE_TO_URL'), consts('EVT_CLICK_INSIDE_IFRAME'), consts('EVT_SCROLL_INSIDE_IFRAME'), consts('EVT_INSIDE_IFRAME_DOM_CONTENTLOADED'), consts('KEY_TOPIC_HEIGHT'), consts('EVT_TOPIC_WIDGET_LOADED')]);

rh.iframe.init();

EventHandlers = function () {
  var lastScrollTop = void 0,
      publishScrollInfo = void 0;

  var EventHandlers = function () {
    function EventHandlers() {
      _classCallCheck(this, EventHandlers);
    }

    _createClass(EventHandlers, [{
      key: 'handle_click',
      value: function handle_click(event) {
        if (!event.defaultPrevented) {
          model.publish(consts('EVT_CLICK_INSIDE_IFRAME'), null);
          return _.hookClick(event);
        }
      }
    }, {
      key: 'handle_scroll',
      value: function handle_scroll() {
        var curScrollTop = void 0,
            dir = void 0;
        curScrollTop = document.body.scrollTop;
        if (curScrollTop > lastScrollTop) {
          dir = 'down';
        } else {
          dir = 'up';
        }
        lastScrollTop = curScrollTop;
        return publishScrollInfo(dir);
      }
    }]);

    return EventHandlers;
  }();

  lastScrollTop = -1;

  publishScrollInfo = _.throttle(function (dir) {
    var body = void 0,
        info = void 0;
    body = document.body;
    info = {
      scrollTop: body.scrollTop,
      scrollHeight: body.scrollHeight,
      dir: dir
    };
    return model.publish(consts('EVT_SCROLL_INSIDE_IFRAME'), info);
  }, 200);

  return EventHandlers;
}();

eHandlers = new EventHandlers();

registeredEvents = {};

model.subscribe(consts('EVT_WIDGET_LOADED'), _.one(function () {
  model.subscribe(consts('KEY_IFRAME_EVENTS'), function (obj) {
    if (obj === null) {
      obj = {};
    }
    return _.each(['click', 'scroll'], function (eName) {
      if (obj[eName]) {
        _.addEventListener(document, eName, eHandlers['handle_' + eName]);
        registeredEvents[eName] = true;
      } else if (registeredEvents[eName]) {
        _.removeEventListener(document, eName, eHandlers['handle_' + eName]);
        registeredEvents[eName] = false;
      }
    });
  });
  return _.delay(function () {
    return model.publish(consts('KEY_TOPIC_HEIGHT'), $.pageHeight());
  }, 100);
}));

model.subscribeOnce([rh.consts('KEY_TOC_ORDER'), rh.consts('EVT_PROJECT_LOADED')], function () {
  var orderData = rh.model.get(rh.consts('KEY_TOC_ORDER'));
  var url = rh._.parentPath(rh._.filePath().substring(rh._.getHostFolder().length));
  url = url.length && url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url;
  while (orderData[url] === undefined) {
    url = url.substring(0, url.lastIndexOf('/'));
  }
  var order = url && orderData[url].order;
  rh.model.publish(rh.consts('KEY_TOC_CHILD_ORDER'), order);
});

model.subscribe(consts('EVT_RELOAD_TOPIC'), function () {
  return document.location.reload();
});

model.subscribeOnce([consts('EVT_WINDOW_LOADED'), consts('KEY_TAG_EXPRESSION'), consts('KEY_TOPIC_ORIGIN')], function () {
  return _.defer(function () {
    var bookmark = document.location.hash;
    if (bookmark !== undefined && bookmark !== "" && bookmark !== "#") {
      var bookmark_name = bookmark.substring(1);
      var $elements = rh.$(bookmark + ",a[name=" + bookmark_name + "]");
      if ($elements.length > 0) {
        $elements[0].scrollIntoView(true);
      }
    }
  });
});

model.subscribe(consts('KEY_TOPIC_HEIGHT'), function () {
  _.delay(function () {
    model.publish(consts('EVT_WINDOW_LOADED'), null);
  }, 1000);
});

_.addEventListener(document, 'DOMContentLoaded', function () {
  return model.publish(consts('EVT_INSIDE_IFRAME_DOM_CONTENTLOADED'), null);
});

_.addEventListener(window, 'resize', function () {
  var triggeredByMe = void 0;
  triggeredByMe = false;
  return _.debounce(function () {
    var height = void 0;
    if (triggeredByMe) {
      triggeredByMe = false;
      return triggeredByMe;
    } else {
      height = $.pageHeight();
      if (height !== model.get(consts('KEY_TOPIC_HEIGHT'))) {
        triggeredByMe = true;
        return model.publish(consts('KEY_TOPIC_HEIGHT'), $.pageHeight());
      }
    }
  }, 250);
}());

},{"../../lib/rh":4}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var rh = require("../../../lib/rh"),
    $ = rh.$,
    _ = rh._;

var DropdownText = function (_rh$Widget) {
  _inherits(DropdownText, _rh$Widget);

  function DropdownText(config) {
    _classCallCheck(this, DropdownText);

    var _this = _possibleConstructorReturn(this, (DropdownText.__proto__ || Object.getPrototypeOf(DropdownText)).call(this, config));

    _this.contentClass = 'dropdown-content';
    _this.titleClass = 'dropdown-title';
    _this.initNodes();
    return _this;
  }

  _createClass(DropdownText, [{
    key: 'initNodes',
    value: function initNodes() {
      var _this2 = this;

      var contentNodes = [];
      $.eachChildNode(this.node, function (child) {
        if ($.hasClass(child, _this2.contentClass)) {
          contentNodes.push(child);
        }
      });
      var nodeHolder = new rh.NodeHolder(contentNodes);
      nodeHolder.hide();
      $.eachChildNode(this.node, function (child) {
        if ($.hasClass(child, _this2.titleClass)) {
          _.addEventListener(child, 'click', function (evt) {
            if (!evt.defaultPrevented) {
              _this2.toggleState(nodeHolder);
              return _.preventDefault(evt);
            }
          });
        }
      });

      rh.model.csubscribe('EVT_COLLAPSE_ALL', function () {
        _this2.hide(nodeHolder);
      });

      rh.model.csubscribe('EVT_EXPAND_ALL', function () {
        _this2.show(nodeHolder);
      });
    }
  }, {
    key: 'hide',
    value: function hide(nodeHolder) {
      $.removeClass(this.node, 'expanded');
      nodeHolder.hide();
    }
  }, {
    key: 'show',
    value: function show(nodeHolder) {
      if (!$.hasClass(this.node, 'expanded')) {
        $.addClass(this.node, 'expanded');
      }
      nodeHolder.show();
    }
  }, {
    key: 'toggleState',
    value: function toggleState(nodeHolder) {
      if ($.hasClass(this.node, 'expanded')) {
        this.hide(nodeHolder);
      } else {
        this.show(nodeHolder);
      }
    }
  }]);

  return DropdownText;
}(rh.Widget);

exports.default = DropdownText;


rh.widgets.DropdownText = DropdownText;

},{"../../../lib/rh":4}],9:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _rh = require('../../../lib/rh');

var _rh2 = _interopRequireDefault(_rh);

var _dropdown_text = require('./dropdown_text');

var _dropdown_text2 = _interopRequireDefault(_dropdown_text);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ExpandingText = function (_DropdownText) {
  _inherits(ExpandingText, _DropdownText);

  function ExpandingText() {
    _classCallCheck(this, ExpandingText);

    return _possibleConstructorReturn(this, (ExpandingText.__proto__ || Object.getPrototypeOf(ExpandingText)).apply(this, arguments));
  }

  _createClass(ExpandingText, [{
    key: 'initNodes',
    value: function initNodes() {
      this.contentClass = 'expanding-content';
      this.titleClass = 'expanding-title';
      _get(ExpandingText.prototype.__proto__ || Object.getPrototypeOf(ExpandingText.prototype), 'initNodes', this).call(this);
    }
  }]);

  return ExpandingText;
}(_dropdown_text2.default);

_rh2.default.widgets.ExpandingText = ExpandingText;

},{"../../../lib/rh":4,"./dropdown_text":8}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var rh = require("../../../lib/rh"),
    nodeUtils = require("../../utils/node_utils"),
    $ = rh.$,
    _ = rh._,
    instanceCount = 0;

var HyperlinkPopover = function (_rh$Widget) {
  _inherits(HyperlinkPopover, _rh$Widget);

  function HyperlinkPopover(config) {
    _classCallCheck(this, HyperlinkPopover);

    var _this = _possibleConstructorReturn(this, (HyperlinkPopover.__proto__ || Object.getPrototypeOf(HyperlinkPopover)).call(this, config));

    instanceCount = instanceCount + 1;
    _.addEventListener(_this.node, 'click', function (evt) {
      _this.showPopover();
      return _.preventDefault(evt);
    });
    return _this;
  }

  _createClass(HyperlinkPopover, [{
    key: "createPopupNode",
    value: function createPopupNode() {
      var node = $.createElement('div');
      $.addClass(node, 'rh-popover');
      $.dataset(node, 'height', $.dataset(this.node, 'height'));
      $.dataset(node, 'width', $.dataset(this.node, 'width'));
      $.dataset(node, 'placement', $.dataset(this.node, 'placement'));

      node.innerHTML = "<div class=\"rh-popover-content\">\n      <iframe class=\"popover-topic\" id=\"" + this.iframeID + "\" src=\"" + this.hyperlink + "\" frameborder=\"0\" scrolling=\"auto\"\n      onload=\"rh._.resetIframeSize('#" + this.iframeID + "')\" ></iframe>\n    </div>";
      return node;
    }
  }, {
    key: "showPopover",
    value: function showPopover() {
      var node = this.createPopupNode();
      nodeUtils.appendChild(document.body, node);
      this.popoverWidget = new rh.widgets.Popover({ node: node });
      this.popoverWidget.init();
      this.popoverWidget.initPosition(this.node);
    }
  }, {
    key: "hyperlink",
    get: function get() {
      return $.getAttribute(this.node, 'href');
    }
  }, {
    key: "iframeID",
    get: function get() {
      return "RhPopoverIframe" + instanceCount;
    }
  }]);

  return HyperlinkPopover;
}(rh.Widget);

exports.default = HyperlinkPopover;


rh.widgets.HyperlinkPopover = HyperlinkPopover;

},{"../../../lib/rh":4,"../../utils/node_utils":14}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var rh = require("../../../lib/rh"),
    nodeUtils = require("../../utils/node_utils"),
    pageUtil = require("../../utils/page_utils"),
    _ = rh._,
    $ = rh.$;

var Popover = function (_rh$Widget) {
  _inherits(Popover, _rh$Widget);

  function Popover(config) {
    _classCallCheck(this, Popover);

    var _this = _possibleConstructorReturn(this, (Popover.__proto__ || Object.getPrototypeOf(Popover)).call(this, config));

    _this.placement = $.dataset(_this.node, 'placement');
    _this.height = _.parseInt($.dataset(_this.node, 'height'), 300);
    _this.width = _.parseInt($.dataset(_this.node, 'width'), 400);

    _.delay(function () {
      _this.handleClick = function (evt) {
        return _this._handleClick(evt);
      };
      _.addEventListener(document, 'click', _this.handleClick);
    }, 250);
    return _this;
  }

  _createClass(Popover, [{
    key: "destruct",
    value: function destruct() {
      _.removeEventListener(document, 'click', this.handleClick);
      _get(Popover.prototype.__proto__ || Object.getPrototypeOf(Popover.prototype), "destruct", this).call(this);
      nodeUtils.removeChild(this.node);
    }
  }, {
    key: "initPosition",
    value: function initPosition(target) {
      var rect = target && target.getClientRects()[0];
      if (rect) {
        this.setPosition(rect);
        if (this.height) {
          this.node.style.height = this.height;
        }
        if (this.width) {
          this.node.style.width = this.width;
        }
      }
    }
  }, {
    key: "setPosition",
    value: function setPosition(rect) {
      var pageHeight = pageUtil.innerHeight(),
          pageWidth = pageUtil.innerWidth();
      if (this.placement === 'top') {
        this.showTop(rect, pageHeight);
        this.setAutoHorizontalPosition(rect, pageWidth);
      } else if (this.placement === 'bottom') {
        this.showBottom(rect);
        this.setAutoHorizontalPosition(rect, pageWidth);
      } else if (this.placement === 'left') {
        this.setAutoVerticalPosition(rect, pageHeight);
        this.showLeft(rect, pageWidth);
      } else if (this.placement === 'right') {
        this.setAutoVerticalPosition(rect, pageHeight);
        this.showRight(rect);
      } else {
        this.setAutoHorizontalPosition(rect, pageWidth);
        this.setAutoVerticalPosition(rect, pageHeight);
      }
    }
  }, {
    key: "canShowTop",
    value: function canShowTop(rect) {
      return rect.top - this.height > 0;
    }
  }, {
    key: "canShowBottom",
    value: function canShowBottom(rect, pageHeight) {
      return pageHeight - rect.bottom - this.height > 0;
    }
  }, {
    key: "canShowLeft",
    value: function canShowLeft(rect) {
      return rect.left - this.width > 0;
    }
  }, {
    key: "canShowRight",
    value: function canShowRight(rect, pageWidth) {
      return pageWidth - rect.right - this.width > 0;
    }
  }, {
    key: "showTop",
    value: function showTop(rect, pageHeight) {
      this.node.style.bottom = pageHeight - rect.top + 2;
    }
  }, {
    key: "showBottom",
    value: function showBottom(rect) {
      this.node.style.top = rect.bottom;
    }
  }, {
    key: "showRight",
    value: function showRight(rect) {
      this.node.style.left = rect.right + 2;
    }
  }, {
    key: "showLeft",
    value: function showLeft(rect, pageWidth) {
      this.node.style.right = pageWidth - rect.left + 2;
    }
  }, {
    key: "setAutoHorizontalPosition",
    value: function setAutoHorizontalPosition(rect, pageWidth) {
      if (this.canShowRight(rect, pageWidth)) {
        this.showRight(rect);
      } else if (this.canShowLeft(rect)) {
        this.showLeft(rect, pageWidth);
      } else {
        this.node.style.left = pageWidth - this.width + 2;
      }
    }
  }, {
    key: "setAutoVerticalPosition",
    value: function setAutoVerticalPosition(rect, pageHeight) {
      if (this.canShowBottom(rect, pageHeight)) {
        this.showBottom(rect);
      } else if (this.canShowTop(rect)) {
        this.showTop(rect, pageHeight);
      } else {
        this.node.style.top = pageHeight - this.height + 2;
      }
    }
  }, {
    key: "_handleClick",
    value: function _handleClick(evt) {
      this.destruct();
      return _.preventDefault(evt);
    }
  }]);

  return Popover;
}(rh.Widget);

exports.default = Popover;


rh.widgets.Popover = Popover;

},{"../../../lib/rh":4,"../../utils/node_utils":14,"../../utils/page_utils":15}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var rh = require("../../../lib/rh"),
    nodeUtils = require("../../utils/node_utils"),
    $ = rh.$,
    _ = rh._,
    instanceCount = 0;

var TextPopOver = function (_rh$Widget) {
  _inherits(TextPopOver, _rh$Widget);

  function TextPopOver(config) {
    _classCallCheck(this, TextPopOver);

    var _this = _possibleConstructorReturn(this, (TextPopOver.__proto__ || Object.getPrototypeOf(TextPopOver)).call(this, config));

    instanceCount = instanceCount + 1;
    _.addEventListener(_this.node, 'click', function (evt) {
      _this.showPopover();
      return _.preventDefault(evt);
    });
    return _this;
  }

  _createClass(TextPopOver, [{
    key: "createPopupNode",
    value: function createPopupNode() {
      var node = $.createElement('div');
      $.addClass(node, 'rh-popover');
      $.dataset(node, 'height', $.dataset(this.node, 'height'));
      $.dataset(node, 'width', $.dataset(this.node, 'width'));
      $.dataset(node, 'placement', $.dataset(this.node, 'placement'));

      node.innerHTML = "<div class=\"rh-popover-content\">\n      <div class=\"popover-text\" id=\"" + this.contentID + "\">" + this.text + "</div>\n    </div>";
      return node;
    }
  }, {
    key: "showPopover",
    value: function showPopover() {
      var node = this.createPopupNode();
      nodeUtils.appendChild(document.body, node);
      this.popoverWidget = new rh.widgets.Popover({ node: node });
      this.popoverWidget.init();
      this.popoverWidget.initPosition(this.node);
    }
  }, {
    key: "text",
    get: function get() {
      return $.dataset(this.node, 'popovertext');
    }
  }, {
    key: "contentID",
    get: function get() {
      return "Rh-textPopOver" + instanceCount;
    }
  }]);

  return TextPopOver;
}(rh.Widget);

exports.default = TextPopOver;


rh.widgets.TextPopOver = TextPopOver;

/*<a data-rhwidget="TextPopOver" data-popovertext="this is definition" href="#"> term </a> */

},{"../../../lib/rh":4,"../../utils/node_utils":14}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var rh = require("../../../lib/rh"),
    $ = rh.$,
    _ = rh._;

var Trigger = function (_rh$Widget) {
  _inherits(Trigger, _rh$Widget);

  function Trigger(config) {
    _classCallCheck(this, Trigger);

    var _this = _possibleConstructorReturn(this, (Trigger.__proto__ || Object.getPrototypeOf(Trigger)).call(this, config));

    _this.initTargets();
    return _this;
  }

  _createClass(Trigger, [{
    key: 'getTargetNodes',
    value: function getTargetNodes() {
      var targetNames = _.splitAndTrim($.dataset(this.node, 'target'), ' ');
      var targetNodes = [];
      _.each(targetNames, function (targetName) {
        var nodes = $.find(document, '[data-targetname="' + targetName + '"]');
        _.each(nodes, function (node) {
          targetNodes.push(node);
        });
      });
      return targetNodes;
    }
  }, {
    key: 'initTargets',
    value: function initTargets() {
      var _this2 = this;

      var targetNodes = this.getTargetNodes();
      _.each(targetNodes, function (node) {
        if (!$.dataset(node, 'targetset')) {
          $.dataset(node, 'targetset', true);
        }
      });
      var nodeHolder = new rh.NodeHolder(targetNodes);
      nodeHolder.hide();
      _.addEventListener(this.node, 'click', function (evt) {
        if (!evt.defaultPrevented) {
          _this2.toggleState(nodeHolder);
          return _.preventDefault(evt);
        }
      });
      rh.model.csubscribe('EVT_COLLAPSE_ALL', function () {
        _this2.hide(nodeHolder);
      });

      rh.model.csubscribe('EVT_EXPAND_ALL', function () {
        _this2.show(nodeHolder);
      });
    }
  }, {
    key: 'hide',
    value: function hide(nodeHolder) {
      $.removeClass(this.node, 'pressed');
      nodeHolder.hide();
      nodeHolder.updateClass([]);
    }
  }, {
    key: 'show',
    value: function show(nodeHolder) {
      if (!$.hasClass(this.node, 'pressed')) {
        $.addClass(this.node, 'pressed');
      }
      nodeHolder.show();
      nodeHolder.updateClass(['show']);
    }
  }, {
    key: 'toggleState',
    value: function toggleState(nodeHolder) {
      if ($.hasClass(this.node, 'pressed')) {
        this.hide(nodeHolder);
      } else {
        this.show(nodeHolder);
      }
    }
  }]);

  return Trigger;
}(rh.Widget);

exports.default = Trigger;


rh.widgets.Trigger = Trigger;
rh.widgets.DropSpot = Trigger;
rh.widgets.ExpandSpot = Trigger;

},{"../../../lib/rh":4}],14:[function(require,module,exports){
'use strict';

var rh = require("../../lib/rh");
var $ = rh.$;
module.exports = {

  nodeType: {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
  },

  removeChild: function removeChild(node) {
    var parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.parentNode(node);

    return parent && parent.removeChild && parent.removeChild(node);
  },
  appendChild: function appendChild(parent, newNode) {
    return parent && parent.appendChild && parent.appendChild(newNode);
  },
  parentNode: function parentNode(node) {
    return node && node.parentNode;
  },
  childNodes: function childNodes(node) {
    return node && node.childNodes || [];
  },
  toHtmlNode: function toHtmlNode(html) {
    return this.childNodes($.createElement('div', html));
  },
  outerHTML: function outerHTML(node) {
    return node && node.outerHTML || '';
  },
  insertAfter: function insertAfter(node, newNode) {
    return node.parentNode.insertBefore(newNode, node.nextSibling);
  },
  value: function value(node) {
    return node && node.nodeValue;
  },
  name: function name(node) {
    return node && node.nodeName;
  },
  type: function type(node) {
    return node && node.nodeType;
  },
  isElementNode: function isElementNode(node) {
    return this.type(node) === this.nodeType.ELEMENT_NODE;
  },
  isTextNode: function isTextNode(node) {
    return this.type(node) === this.nodeType.TEXT_NODE;
  }
};

},{"../../lib/rh":4}],15:[function(require,module,exports){
(function (global){
'use strict';

var rh = require("../../lib/rh"),
    _ = rh._;

module.exports = {
  innerWidth: function innerWidth() {
    var innerWidth = global.innerWidth;
    if (!_.isDefined(innerWidth)) {
      var clientWidth = _.get(document, 'documentElement.clientWidth');
      clientWidth = _.isDefined(clientWidth) ? clientWidth : _.get(document, 'body.clientWidth');
      if (_.isDefined(clientWidth)) {
        innerWidth = clientWidth;
      }
    }
    return innerWidth;
  },
  innerHeight: function innerHeight() {
    var innerHeight = global.innerHeight;
    if (!_.isDefined(innerHeight)) {
      var clientHeight = _.get(document, 'documentElement.clientHeight');
      clientHeight = _.isDefined(clientHeight) ? clientHeight : _.get(document, 'body.clientHeight');
      if (_.isDefined(clientHeight)) {
        innerHeight = clientHeight;
      }
    }
    return innerHeight;
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../lib/rh":4}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsZW5pZW50X3NyY1xccm9ib2hlbHBcXHRvcGljXFxwaG9uZWdhcC5qcyIsImxlbmllbnRfc3JjXFxyb2JvaGVscFxcdG9waWNcXHRvcGljX2V2ZW50cy5qcyIsImxlbmllbnRfc3JjXFxyb2JvaGVscFxcdG9waWNcXHVybF91dGlscy5qcyIsInNyY1xcbGliXFxzcmNcXGxpYlxccmguanMiLCJzcmNcXHJlc3BvbnNpdmVfaGVscFxcdG9waWMuanMiLCJzcmNcXHJlc3BvbnNpdmVfaGVscFxcdG9waWNcXGhpZ2hsaWdodC5qcyIsInNyY1xccmVzcG9uc2l2ZV9oZWxwXFx0b3BpY1xcaW5pdC5qcyIsInNyY1xccmVzcG9uc2l2ZV9oZWxwXFx0b3BpY1xcd2lkZ2V0c1xcZHJvcGRvd25fdGV4dC5qcyIsInNyY1xccmVzcG9uc2l2ZV9oZWxwXFx0b3BpY1xcd2lkZ2V0c1xcZXhwYW5kaW5nX3RleHQuanMiLCJzcmNcXHJlc3BvbnNpdmVfaGVscFxcdG9waWNcXHdpZGdldHNcXGh5cGVybGlua19wb3BvdmVyLmpzIiwic3JjXFxyZXNwb25zaXZlX2hlbHBcXHRvcGljXFx3aWRnZXRzXFxwb3BvdmVyLmpzIiwic3JjXFxyZXNwb25zaXZlX2hlbHBcXHRvcGljXFx3aWRnZXRzXFx0ZXh0X3BvcG92ZXIuanMiLCJzcmNcXHJlc3BvbnNpdmVfaGVscFxcdG9waWNcXHdpZGdldHNcXHRyaWdnZXIuanMiLCJzcmNcXHJlc3BvbnNpdmVfaGVscFxcdXRpbHNcXG5vZGVfdXRpbHMuanMiLCJzcmNcXHJlc3BvbnNpdmVfaGVscFxcdXRpbHNcXHNyY1xccmVzcG9uc2l2ZV9oZWxwXFx1dGlsc1xccGFnZV91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztjQ0FhLE07SUFBUCxFLFdBQUEsRTtJQUNBLEssR0FBVSxFLENBQVYsSztJQUNBLE0sR0FBVyxFLENBQVgsTTtJQUNBLEMsR0FBTSxFLENBQU4sQzs7SUFFQSxRO0FBQ0osc0JBQWM7QUFBQTs7QUFDWCxTQUFLLGFBQU47QUFDRDs7OztvQ0FFZTtBQUNkLGFBQU8sTUFBTSxhQUFOLENBQW9CLE9BQU8scUJBQVAsQ0FBcEIsRUFBbUQsVUFBUyxHQUFULEVBQWM7QUFDdEUsWUFBSSxHQUFKLEVBQVM7QUFDUCxpQkFBTyxNQUFNLFNBQU4sQ0FBZ0IsT0FBTyxtQkFBUCxDQUFoQixFQUE2QztBQUFBLG1CQUNsRCxFQUFFLFVBQUYsQ0FBYSxPQUFPLGdCQUFQLENBQWIsRUFBdUMsS0FBdkMsRUFBOEMsWUFBVztBQUN2RCxrQkFBSSxHQUFHLEtBQVAsRUFBYztBQUFFLHVCQUFPLEdBQUcsRUFBSCxDQUFNLE1BQU4sRUFBYyxtQkFBZCxDQUFQO0FBQTRDO0FBQzdELGFBRkQsQ0FEa0Q7QUFBQSxXQUE3QyxDQUFQO0FBS0Q7QUFDRixPQVJNLENBQVA7QUFTRDs7Ozs7O0FBSUgsSUFBSSxRQUFKOzs7OztjQ3hCYSxNO0lBQVAsRSxXQUFBLEU7SUFDQSxNLEdBQVcsRSxDQUFYLE07OztBQUVOLEdBQUcsS0FBSCxDQUFTLFNBQVQsQ0FBbUIsT0FBTyxtQkFBUCxDQUFuQixFQUFnRDtBQUFBLFNBQVMsT0FBTyxRQUFQLENBQWdCLENBQWhCLEVBQW1CLENBQW5CLENBQVQ7QUFBQSxDQUFoRDs7QUFFQSxHQUFHLEtBQUgsQ0FBUyxTQUFULENBQW1CLE9BQU8saUJBQVAsQ0FBbkIsRUFBOEMsWUFBVztBQUN0RCxTQUFPLEtBQVI7QUFDQSxTQUFRLE9BQU8sS0FBUixFQUFQO0FBQ0QsQ0FIRDs7Ozs7Y0NMYSxNO0lBQVAsRSxXQUFBLEU7SUFDQSxDLEdBQU0sRSxDQUFOLEM7SUFDQSxNLEdBQVcsRSxDQUFYLE07OztBQUVOLEVBQUUsVUFBRixHQUFnQixZQUFXO0FBQ3pCLE1BQUksVUFBVSxJQUFkO0FBQ0EsU0FBTyxZQUFXO0FBQ2hCLFFBQUksV0FBVyxJQUFmLEVBQXFCO0FBQ25CLFVBQUksV0FBVyxPQUFPLGlCQUFQLENBQXlCLE9BQU8sdUJBQWhDLENBQWY7QUFDQSxxQkFBYSxFQUFFLGFBQUYsRUFBYixHQUFpQyxFQUFFLGNBQUYsQ0FBaUIsWUFBWSxJQUFaLEdBQW1CLFNBQVMsVUFBNUIsR0FBeUMsU0FBMUQsQ0FBakM7QUFDRDtBQUNELFdBQU8sT0FBUDtBQUNELEdBTkQ7QUFPRCxDQVRjLEVBQWY7O0FBV0EsRUFBRSxnQkFBRixHQUFxQixZQUFXO0FBQzlCLE1BQUksYUFBYSxFQUFFLGFBQUYsRUFBakI7QUFDQSxNQUFJLFFBQVEsRUFBWjtBQUNBLE1BQUksU0FBUyxPQUFPLG9CQUFQLENBQTRCLFVBQTVCLEVBQ1gsVUFBVSxTQUFTLFFBQVQsQ0FBa0IsSUFBNUIsQ0FEVyxDQUFiO0FBRUEsTUFBSSxNQUFNLFNBQVMsUUFBbkI7QUFDQSxNQUFJLE9BQU8sQ0FBQyxFQUFFLGFBQUYsQ0FBZ0IsR0FBaEIsQ0FBWixFQUFrQztBQUNoQyxRQUFJLFdBQVcsRUFBRSxTQUFGLENBQVksRUFBRSxrQkFBRixDQUFxQixHQUFyQixDQUFaLENBQWY7QUFDQSxRQUFJLENBQUMsRUFBRSxhQUFGLENBQWdCLFFBQWhCLENBQUwsRUFBZ0M7QUFBRSxvQkFBWSxFQUFFLGtCQUFGLENBQXFCLFFBQXJCLENBQVo7QUFBK0M7QUFDbEY7O0FBRUQsTUFBSSxVQUFVLEVBQUUsU0FBRixDQUFZLEVBQUUsa0JBQUYsQ0FBcUIsTUFBckIsQ0FBWixDQUFkO0FBQ0EsVUFBUSxPQUFPLGdCQUFQLENBQVIsSUFBb0MsRUFBRSxVQUFGLENBQWEsTUFBYixDQUFwQztBQUNBLFVBQVEsT0FBTyxpQkFBUCxDQUFSLElBQXFDLElBQXJDO0FBQ0EsTUFBSSxhQUFXLEVBQUUsa0JBQUYsQ0FBcUIsT0FBckIsQ0FBZjtBQUNBLFNBQU8sU0FBUyxRQUFULENBQWtCLE9BQWxCLE1BQTZCLEVBQUUsVUFBRixFQUE3QixHQUE4QyxLQUE5QyxHQUFzRCxJQUF0RCxDQUFQO0FBQ0QsQ0FoQkQ7O0FBbUJBLEVBQUUsY0FBRixHQUFtQixZQUFXO0FBQzVCLE1BQUksYUFBYSxFQUFFLGFBQUYsRUFBakI7QUFDQSxNQUFJLFFBQVEsRUFBWjtBQUNBLE1BQUksU0FBUyxPQUFPLG9CQUFQLENBQTRCLFVBQTVCLEVBQ1gsVUFBVSxTQUFTLFFBQVQsQ0FBa0IsSUFBNUIsQ0FEVyxDQUFiO0FBRUEsTUFBSSxNQUFNLFNBQVMsUUFBbkI7QUFDQSxNQUFJLE9BQU8sQ0FBQyxFQUFFLGFBQUYsQ0FBZ0IsR0FBaEIsQ0FBWixFQUFrQztBQUNoQyxRQUFJLFdBQVcsRUFBRSxTQUFGLENBQVksRUFBRSxrQkFBRixDQUFxQixHQUFyQixDQUFaLENBQWY7QUFDQSxhQUFTLE9BQU8sU0FBUCxDQUFULElBQThCLElBQTlCO0FBQ0EsYUFBUyxPQUFPLFNBQVAsQ0FBVCxJQUE4QixJQUE5QjtBQUNBLFFBQUksQ0FBQyxFQUFFLGFBQUYsQ0FBZ0IsUUFBaEIsQ0FBTCxFQUFnQztBQUFFLG9CQUFZLEVBQUUsa0JBQUYsQ0FBcUIsUUFBckIsQ0FBWjtBQUErQztBQUNsRjs7QUFFRCxNQUFJLGdCQUFnQixPQUFPLGdCQUFQLENBQXBCO0FBQ0EsTUFBRyxpQkFBa0Isa0JBQWtCLEVBQXZDLEVBQTRDO0FBQzFDLFFBQUksZUFBYSxVQUFiLEdBQTBCLEVBQUUsY0FBRixDQUFpQixhQUFqQixDQUE5QjtBQUNBLFFBQUksVUFBVSxFQUFFLFNBQUYsQ0FBWSxFQUFFLGtCQUFGLENBQXFCLE1BQXJCLENBQVosQ0FBZDtBQUNBLFlBQVEsT0FBTyxnQkFBUCxDQUFSLElBQW9DLEVBQUUsVUFBRixDQUFhLE1BQWIsQ0FBcEM7QUFDQSxZQUFRLE9BQU8saUJBQVAsQ0FBUixJQUFxQyxJQUFyQztBQUNBLFFBQUksYUFBVyxFQUFFLGtCQUFGLENBQXFCLE9BQXJCLENBQWY7QUFDQSxXQUFPLFNBQVMsUUFBVCxDQUFrQixPQUFsQixNQUE2QixPQUE3QixHQUF1QyxLQUF2QyxHQUErQyxJQUEvQyxDQUFQO0FBQ0Q7QUFDRixDQXRCRDs7Ozs7O0FDbENBO0FBQ0EsSUFBSSxPQUFPLEVBQVAsS0FBYyxTQUFsQixFQUE2QjtBQUMzQixTQUFPLEVBQVAsR0FBWSxFQUFaO0FBQ0Q7O0FBRUQsT0FBTyxPQUFQLEdBQWlCLE9BQU8sRUFBeEI7Ozs7Ozs7QUNMQSxRQUFRLFdBQVI7QUFDQSxRQUFRLDRDQUFSO0FBQ0EsUUFBUSwrQ0FBUjtBQUNBLFFBQVEsMkNBQVI7QUFDQSxRQUFRLGNBQVI7QUFDQSxRQUFRLCtCQUFSO0FBQ0EsUUFBUSxnQ0FBUjtBQUNBLFFBQVEseUJBQVI7QUFDQSxRQUFRLG1DQUFSO0FBQ0EsUUFBUSw4QkFBUjtBQUNBLFFBQVEseUJBQVI7QUFDQSxRQUFRLG1CQUFSO0FBQ0EsUUFBUSwrQ0FBUjs7Ozs7QUNaQSxJQUFJLEtBQUssUUFBUSxjQUFSLENBQVQ7QUFDQSxJQUFJLElBQUksR0FBRyxDQUFYO0FBQ0EsSUFBSSxJQUFJLEdBQUcsQ0FBWDs7QUFFQSxFQUFFLGVBQUYsR0FBb0IsWUFBTTtBQUN4QixNQUFJLFFBQVEsRUFBRSxNQUFGLEVBQVUsQ0FBVixDQUFaO0FBQ0EsTUFBSSxzQkFBc0IsRUFBRSxJQUFGLENBQU8sS0FBUCxFQUFjLHNCQUFkLEtBQXlDLEVBQW5FO0FBQ0EsSUFBRSxJQUFGLENBQU8sbUJBQVAsRUFBNEIsVUFBQyxJQUFELEVBQVU7QUFDcEMsTUFBRSxlQUFGLENBQWtCLElBQWxCLEVBQXdCLE9BQXhCO0FBQ0QsR0FGRDtBQUdELENBTkQ7O0FBUUEsR0FBRyxLQUFILENBQVMsVUFBVCxDQUFvQixzQkFBcEIsRUFBNEMsRUFBRSxlQUE5Qzs7Ozs7Ozs7O0FDWkEsSUFBSSxLQUFLLFFBQVEsY0FBUixDQUFUO0FBQ0EsSUFBSSxJQUFJLEdBQUcsQ0FBWDtBQUNBLElBQUksU0FBUyxHQUFHLE1BQWhCO0FBQ0EsSUFBSSxJQUFJLEdBQUcsQ0FBWDtBQUNBLElBQUksUUFBUSxHQUFHLEtBQWY7QUFDQSxJQUFJLHNCQUFKO0FBQUEsSUFBbUIsa0JBQW5CO0FBQUEsSUFBOEIseUJBQTlCOztBQUVBLEVBQUUsV0FBRixHQUFnQixZQUFNO0FBQ3BCLE1BQUksWUFBWSxFQUFFLGtCQUFGLENBQXFCLFNBQVMsUUFBVCxDQUFrQixJQUF2QyxDQUFoQjtBQUNBLE1BQUksWUFBWSxFQUFFLFNBQUYsQ0FBWSxTQUFaLENBQWhCO0FBQ0EsTUFBSSxlQUFlLE9BQU8sc0JBQVAsQ0FBbkI7QUFDQSxNQUFJLGdCQUFnQixTQUFwQixFQUErQjtBQUM3QixNQUFFLGNBQUYsQ0FBaUIsRUFBRSxjQUFuQjtBQUNELEdBRkQsTUFHSTtBQUNGLE1BQUUsYUFBRjtBQUNBLE1BQUUsVUFBRjtBQUNEO0FBQ0YsQ0FYRDs7QUFhQSxFQUFFLFVBQUYsR0FBZSxZQUFLO0FBQ2xCLE1BQUksUUFBUSxFQUFFLE1BQUYsRUFBUyxDQUFULENBQVo7QUFDQSxNQUFJLGdCQUFnQixFQUFFLElBQUYsQ0FBTyxLQUFQLEVBQWMsZUFBZCxDQUFwQjtBQUNBLE1BQUcsYUFBSCxFQUFpQjtBQUNmLE1BQUUsSUFBRixDQUFPLGFBQVAsRUFBc0IsVUFBQyxJQUFELEVBQVM7QUFDN0IsUUFBRSxXQUFGLENBQWMsSUFBZCxFQUFvQixTQUFwQjtBQUNELEtBRkQ7QUFHRDtBQUNGLENBUkQ7O0FBVUEsRUFBRSxvQkFBRixHQUF5QixZQUFNO0FBQzdCLE1BQUksT0FBTyxFQUFFLGVBQUYsQ0FBa0IsRUFBRSxVQUFGLEVBQWxCLEVBQWtDLEVBQUUsUUFBRixFQUFsQyxDQUFYO0FBQ0EsTUFBSSxRQUFRLEtBQUssV0FBTCxDQUFpQixHQUFqQixDQUFaO0FBQ0EsU0FBTyxVQUFVLENBQUMsQ0FBWCxHQUFlLEVBQUUsVUFBRixDQUFhLElBQWIsQ0FBZixHQUFvQyxFQUEzQztBQUNELENBSkQ7O0FBTUEsRUFBRSxhQUFGLEdBQWtCLFlBQUs7O0FBRXJCLFFBQU0sYUFBTixDQUFvQixDQUFDLE9BQU8saUJBQVAsQ0FBRCxDQUFwQixFQUFpRCxZQUFNO0FBQ3JELFFBQUksU0FBUyxNQUFNLEdBQU4sQ0FBVSxPQUFPLGlCQUFQLENBQVYsQ0FBYjs7QUFFQSxRQUFHLFVBQVUsV0FBVyxFQUF4QixFQUEyQjs7QUFFekIsWUFBTSxhQUFOLENBQW9CLENBQUMsT0FBTyxrQkFBUCxDQUFELEVBQTZCLE9BQU8sU0FBUCxDQUE3QixDQUFwQixFQUFxRSxZQUFNO0FBQ3pFLFlBQUksUUFBUSxNQUFNLEdBQU4sQ0FBVSxPQUFPLGtCQUFQLENBQVYsQ0FBWjtBQUNBLFlBQUksUUFBUSxNQUFNLEdBQU4sQ0FBVSxPQUFPLFNBQVAsQ0FBVixFQUE2QixrQkFBekM7QUFDQSxnQkFBUSxRQUFRLEtBQVIsR0FBZ0IsNkNBQXhCO0FBQ0EsWUFBSSxVQUFVLEtBQWQ7QUFDQSxZQUFJLE9BQU8sTUFBTSxHQUFOLENBQVUsT0FBTyxzQkFBUCxDQUFWLENBQVg7QUFDQSxlQUFPLEVBQUUsb0JBQUYsS0FBMkIsSUFBbEM7QUFDQSxZQUFJLE9BQU8sRUFBRSxrQkFBRixDQUFxQixNQUFyQixFQUE2QixVQUFDLFFBQUQsRUFBYztBQUNwRCxjQUFHLGFBQWEsT0FBaEIsRUFBeUI7QUFDdkIsbUJBQU8sS0FBUDtBQUNELFdBRkQsTUFFTyxJQUFJLGFBQWEsU0FBakIsRUFBMkI7QUFDaEMsbUJBQU8sT0FBUDtBQUNELFdBRk0sTUFFQSxJQUFJLGFBQWEsT0FBakIsRUFBeUI7QUFDOUIsbUJBQU8sS0FBUDtBQUNELFdBRk0sTUFFQSxJQUFJLGFBQWEsTUFBakIsRUFBd0I7QUFDN0IsbUJBQU8sSUFBUDtBQUNEO0FBQ0YsU0FWVSxDQUFYO0FBV0EsWUFBSSxRQUFRLEVBQUUsTUFBRixFQUFTLENBQVQsQ0FBWjtBQUNBLFlBQUksT0FBTyxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBWDtBQUNBLGFBQUssU0FBTCxHQUFpQixJQUFqQjtBQUNBLGNBQU0sWUFBTixDQUFtQixJQUFuQixFQUF5QixNQUFNLFVBQU4sQ0FBaUIsQ0FBakIsQ0FBekI7QUFDRCxPQXRCRDtBQXVCRDtBQUNGLEdBN0JEO0FBOEJELENBaENEOztBQWtDQSxFQUFFLFlBQUYsR0FBaUIsWUFBSzs7QUFFcEIsUUFBTSxhQUFOLENBQW9CLENBQUMsT0FBTyxnQkFBUCxDQUFELENBQXBCLEVBQWdELFlBQU07QUFDcEQsUUFBSSxTQUFTLE1BQU0sR0FBTixDQUFVLE9BQU8sZ0JBQVAsQ0FBVixDQUFiOztBQUVBLFFBQUcsVUFBVSxXQUFXLEVBQXhCLEVBQTJCOztBQUV6QixZQUFNLGFBQU4sQ0FBb0IsQ0FBQyxPQUFPLHNCQUFQLENBQUQsRUFDbEIsT0FBTyx3QkFBUCxDQURrQixFQUNnQixPQUFPLDZCQUFQLENBRGhCLEVBQ3VELE9BQU8sd0JBQVAsQ0FEdkQsQ0FBcEIsRUFDOEcsWUFBTTtBQUNsSCxZQUFJLGtCQUFrQixNQUFNLEdBQU4sQ0FBVSxPQUFPLDZCQUFQLENBQVYsQ0FBdEI7QUFDQSwwQkFBa0Isa0JBQWtCLGVBQWxCLEdBQW9DLE1BQU0sR0FBTixDQUFVLE9BQU8scUNBQVAsQ0FBVixDQUF0RDtBQUNBLFlBQUksUUFBUSxNQUFNLEdBQU4sQ0FBVSxPQUFPLHdCQUFQLENBQVYsQ0FBWjtBQUNBLGdCQUFRLFFBQVEsS0FBUixHQUFnQixNQUFNLEdBQU4sQ0FBVSxPQUFPLGdDQUFQLENBQVYsQ0FBeEI7QUFDQSxZQUFJLGFBQWEsTUFBTSxHQUFOLENBQVUsT0FBTyx3QkFBUCxDQUFWLENBQWpCO0FBQ0EscUJBQWEsYUFBYSxVQUFiLEdBQTBCLE1BQU0sR0FBTixDQUFVLE9BQU8sZ0NBQVAsQ0FBVixDQUF2QztBQUNBLFlBQUksTUFBTSxFQUFFLGtCQUFGLENBQXFCLE1BQXJCLEVBQTZCLFVBQUMsUUFBRCxFQUFjO0FBQ25ELGNBQUcsYUFBYSxrQkFBaEIsRUFBb0M7QUFDbEMsbUJBQU8sZUFBUDtBQUNELFdBRkQsTUFFTyxJQUFJLGFBQWEsT0FBakIsRUFBeUI7QUFDOUIsbUJBQU8sS0FBUDtBQUNELFdBRk0sTUFFQSxJQUFJLGFBQWEsYUFBakIsRUFBK0I7QUFDcEMsbUJBQU8sVUFBUDtBQUNEO0FBQ0YsU0FSUyxDQUFWO0FBU0EsWUFBSSxTQUFTLFNBQVMsYUFBVCxDQUF1QixPQUF2QixDQUFiO0FBQ0EsZUFBTyxJQUFQLEdBQWMsVUFBZDtBQUNBLGVBQU8sU0FBUCxHQUFtQixHQUFuQjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxXQUFkLENBQTBCLE1BQTFCO0FBQ0QsT0FyQkQ7QUFzQkQ7QUFDRixHQTVCRDtBQTZCRCxDQS9CRDs7QUFpQ0EsRUFBRSxjQUFGLEdBQW1CLFVBQUMsUUFBRCxFQUFjO0FBQy9CLGFBQVcsWUFBYSxZQUFLLENBQUUsQ0FBL0I7QUFDQSxNQUFJLE1BQU0sRUFBRSxvQkFBRixLQUEyQixpQ0FBckM7QUFDQSxJQUFFLFVBQUYsQ0FBYSxHQUFiLEVBQWtCLElBQWxCLEVBQXdCLFFBQXhCO0FBQ0QsQ0FKRDs7QUFNQSxFQUFFLGFBQUYsR0FBa0IsWUFBTTtBQUN0QixJQUFFLGNBQUY7QUFDQSxJQUFFLGFBQUY7QUFDQSxJQUFFLFlBQUY7QUFDRCxDQUpEOztBQU1BLE1BQU0sT0FBTixDQUFjLE9BQU8sa0JBQVAsQ0FBZCxFQUEwQyxDQUN4QyxPQUFPLDhCQUFQLENBRHdDLEVBRXhDLE9BQU8sb0JBQVAsQ0FGd0MsRUFHeEM7QUFDRSxPQUFLLE9BQU8sbUJBQVAsQ0FEUDtBQUVFLFVBQVE7QUFGVixDQUh3QyxFQU94QyxPQUFPLGlCQUFQLENBUHdDLEVBUXhDLE9BQU8sd0JBQVAsQ0FSd0MsRUFTeEMsT0FBTyxrQkFBUCxDQVR3QyxFQVV4QyxPQUFPLGVBQVAsQ0FWd0MsRUFXeEMsT0FBTyxtQkFBUCxDQVh3QyxFQVl4QyxPQUFPLGtCQUFQLENBWndDLEVBYXhDLE9BQU8scUJBQVAsQ0Fid0MsRUFjeEMsT0FBTyxzQkFBUCxDQWR3QyxFQWV4QyxPQUFPLGtCQUFQLENBZndDLEVBZ0J4QyxPQUFPLHdCQUFQLENBaEJ3QyxFQWlCeEMsT0FBTyw2QkFBUCxDQWpCd0MsRUFrQnhDLE9BQU8sd0JBQVAsQ0FsQndDLEVBbUJ4QyxPQUFPLGlCQUFQLENBbkJ3QyxFQW9CeEMsT0FBTyxnQkFBUCxDQXBCd0MsRUFxQnhDLE9BQU8scUNBQVAsQ0FyQndDLEVBc0J4QyxPQUFPLGdDQUFQLENBdEJ3QyxFQXVCeEMsT0FBTyxnQ0FBUCxDQXZCd0MsRUF3QnhDLE9BQU8sZUFBUCxDQXhCd0MsRUF5QnhDLE9BQU8sa0JBQVAsQ0F6QndDLEVBMEJ4QyxPQUFPLGdCQUFQLENBMUJ3QyxFQTJCeEMsT0FBTyw0QkFBUCxDQTNCd0MsRUE0QnhDLE9BQU8scUJBQVAsQ0E1QndDLEVBNkJ4QyxPQUFPLHNCQUFQLENBN0J3QyxDQUExQzs7QUFnQ0EsTUFBTSxPQUFOLENBQWMsT0FBTyxtQkFBUCxDQUFkLEVBQTJDLENBQ3pDLE9BQU8sZUFBUCxDQUR5QyxFQUV6QyxPQUFPLGNBQVAsQ0FGeUMsRUFHekMsT0FBTyxpQkFBUCxDQUh5QyxFQUl6QyxPQUFPLGtCQUFQLENBSnlDLEVBS3pDLE9BQU8sWUFBUCxDQUx5QyxFQU16QyxPQUFPLHFCQUFQLENBTnlDLEVBT3pDLE9BQU8seUJBQVAsQ0FQeUMsRUFRekMsT0FBTywwQkFBUCxDQVJ5QyxFQVN6QyxPQUFPLHFDQUFQLENBVHlDLEVBVXpDLE9BQU8sa0JBQVAsQ0FWeUMsRUFXekMsT0FBTyx5QkFBUCxDQVh5QyxDQUEzQzs7QUFhQSxHQUFHLE1BQUgsQ0FBVSxJQUFWOztBQUVBLGdCQUFrQixZQUFNO0FBQ3RCLE1BQUksc0JBQUo7QUFBQSxNQUFtQiwwQkFBbkI7O0FBRHNCLE1BR2hCLGFBSGdCO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQSxtQ0FJUCxLQUpPLEVBSUE7QUFDbEIsWUFBSSxDQUFDLE1BQU0sZ0JBQVgsRUFBNkI7QUFDM0IsZ0JBQU0sT0FBTixDQUFjLE9BQU8seUJBQVAsQ0FBZCxFQUFpRCxJQUFqRDtBQUNBLGlCQUFPLEVBQUUsU0FBRixDQUFZLEtBQVosQ0FBUDtBQUNEO0FBQ0Y7QUFUbUI7QUFBQTtBQUFBLHNDQVdKO0FBQ2QsWUFBSSxxQkFBSjtBQUFBLFlBQWtCLFlBQWxCO0FBQ0EsdUJBQWUsU0FBUyxJQUFULENBQWMsU0FBN0I7QUFDQSxZQUFJLGVBQWUsYUFBbkIsRUFBa0M7QUFDaEMsZ0JBQU0sTUFBTjtBQUNELFNBRkQsTUFFTztBQUNMLGdCQUFNLElBQU47QUFDRDtBQUNELHdCQUFnQixZQUFoQjtBQUNBLGVBQU8sa0JBQWtCLEdBQWxCLENBQVA7QUFDRDtBQXJCbUI7O0FBQUE7QUFBQTs7QUF3QnRCLGtCQUFnQixDQUFDLENBQWpCOztBQUVBLHNCQUFvQixFQUFFLFFBQUYsQ0FBVyxlQUFPO0FBQ3BDLFFBQUksYUFBSjtBQUFBLFFBQVUsYUFBVjtBQUNBLFdBQU8sU0FBUyxJQUFoQjtBQUNBLFdBQU87QUFDTCxpQkFBVyxLQUFLLFNBRFg7QUFFTCxvQkFBYyxLQUFLLFlBRmQ7QUFHTDtBQUhLLEtBQVA7QUFLQSxXQUFPLE1BQU0sT0FBTixDQUFjLE9BQU8sMEJBQVAsQ0FBZCxFQUFrRCxJQUFsRCxDQUFQO0FBQ0QsR0FUbUIsRUFTakIsR0FUaUIsQ0FBcEI7O0FBV0EsU0FBTyxhQUFQO0FBQ0QsQ0F0Q2UsRUFBaEI7O0FBd0NBLFlBQVksSUFBSSxhQUFKLEVBQVo7O0FBRUEsbUJBQW1CLEVBQW5COztBQUVBLE1BQU0sU0FBTixDQUFnQixPQUFPLG1CQUFQLENBQWhCLEVBQTZDLEVBQUUsR0FBRixDQUFNLFlBQU07QUFDdkQsUUFBTSxTQUFOLENBQWdCLE9BQU8sbUJBQVAsQ0FBaEIsRUFBNkMsZUFBTztBQUNsRCxRQUFJLFFBQVEsSUFBWixFQUFrQjtBQUNoQixZQUFNLEVBQU47QUFDRDtBQUNELFdBQU8sRUFBRSxJQUFGLENBQU8sQ0FBQyxPQUFELEVBQVUsUUFBVixDQUFQLEVBQTRCLGlCQUFTO0FBQzFDLFVBQUksSUFBSSxLQUFKLENBQUosRUFBZ0I7QUFDZCxVQUFFLGdCQUFGLENBQW1CLFFBQW5CLEVBQTZCLEtBQTdCLEVBQW9DLHNCQUFvQixLQUFwQixDQUFwQztBQUNBLHlCQUFpQixLQUFqQixJQUEwQixJQUExQjtBQUNELE9BSEQsTUFHTyxJQUFJLGlCQUFpQixLQUFqQixDQUFKLEVBQTZCO0FBQ2xDLFVBQUUsbUJBQUYsQ0FBc0IsUUFBdEIsRUFBZ0MsS0FBaEMsRUFBdUMsc0JBQW9CLEtBQXBCLENBQXZDO0FBQ0EseUJBQWlCLEtBQWpCLElBQTBCLEtBQTFCO0FBQ0Q7QUFDRixLQVJNLENBQVA7QUFTRCxHQWJEO0FBY0EsU0FBTyxFQUFFLEtBQUYsQ0FBUTtBQUFBLFdBQU0sTUFBTSxPQUFOLENBQWMsT0FBTyxrQkFBUCxDQUFkLEVBQTBDLEVBQUUsVUFBRixFQUExQyxDQUFOO0FBQUEsR0FBUixFQUF5RSxHQUF6RSxDQUFQO0FBQ0QsQ0FoQjRDLENBQTdDOztBQWtCQSxNQUFNLGFBQU4sQ0FBb0IsQ0FBQyxHQUFHLE1BQUgsQ0FBVSxlQUFWLENBQUQsRUFBNkIsR0FBRyxNQUFILENBQVUsb0JBQVYsQ0FBN0IsQ0FBcEIsRUFBbUYsWUFBTTtBQUN2RixNQUFJLFlBQVksR0FBRyxLQUFILENBQVMsR0FBVCxDQUFhLEdBQUcsTUFBSCxDQUFVLGVBQVYsQ0FBYixDQUFoQjtBQUNBLE1BQUksTUFBTSxHQUFHLENBQUgsQ0FBSyxVQUFMLENBQWdCLEdBQUcsQ0FBSCxDQUFLLFFBQUwsR0FBZ0IsU0FBaEIsQ0FBMEIsR0FBRyxDQUFILENBQUssYUFBTCxHQUFxQixNQUEvQyxDQUFoQixDQUFWO0FBQ0EsUUFBTyxJQUFJLE1BQUosSUFBYyxJQUFJLElBQUksTUFBSixHQUFXLENBQWYsTUFBc0IsR0FBckMsR0FBNEMsSUFBSSxTQUFKLENBQWMsQ0FBZCxFQUFpQixJQUFJLE1BQUosR0FBVyxDQUE1QixDQUE1QyxHQUE2RSxHQUFuRjtBQUNBLFNBQU0sVUFBVSxHQUFWLE1BQW1CLFNBQXpCLEVBQW9DO0FBQ2xDLFVBQU8sSUFBSSxTQUFKLENBQWMsQ0FBZCxFQUFpQixJQUFJLFdBQUosQ0FBZ0IsR0FBaEIsQ0FBakIsQ0FBUDtBQUNEO0FBQ0QsTUFBSSxRQUFRLE9BQU8sVUFBVSxHQUFWLEVBQWUsS0FBbEM7QUFDQSxLQUFHLEtBQUgsQ0FBUyxPQUFULENBQWlCLEdBQUcsTUFBSCxDQUFVLHFCQUFWLENBQWpCLEVBQW1ELEtBQW5EO0FBQ0QsQ0FURDs7QUFXQSxNQUFNLFNBQU4sQ0FBZ0IsT0FBTyxrQkFBUCxDQUFoQixFQUE0QztBQUFBLFNBQU0sU0FBUyxRQUFULENBQWtCLE1BQWxCLEVBQU47QUFBQSxDQUE1Qzs7QUFFQSxNQUFNLGFBQU4sQ0FBb0IsQ0FBQyxPQUFPLG1CQUFQLENBQUQsRUFBOEIsT0FBTyxvQkFBUCxDQUE5QixFQUE0RCxPQUFPLGtCQUFQLENBQTVELENBQXBCLEVBQ0U7QUFBQSxTQUFNLEVBQUUsS0FBRixDQUFRLFlBQU07QUFDbEIsUUFBSSxXQUFXLFNBQVMsUUFBVCxDQUFrQixJQUFqQztBQUNBLFFBQUksYUFBYSxTQUFiLElBQTBCLGFBQWEsRUFBdkMsSUFBNkMsYUFBYSxHQUE5RCxFQUFrRTtBQUNoRSxVQUFJLGdCQUFnQixTQUFTLFNBQVQsQ0FBbUIsQ0FBbkIsQ0FBcEI7QUFDQSxVQUFJLFlBQWEsR0FBRyxDQUFILENBQUssV0FBUyxVQUFULEdBQXNCLGFBQXRCLEdBQXFDLEdBQTFDLENBQWpCO0FBQ0EsVUFBRyxVQUFVLE1BQVYsR0FBbUIsQ0FBdEIsRUFBd0I7QUFDdEIsa0JBQVUsQ0FBVixFQUFhLGNBQWIsQ0FBNEIsSUFBNUI7QUFDRDtBQUNGO0FBQ0YsR0FUSyxDQUFOO0FBQUEsQ0FERjs7QUFhQSxNQUFNLFNBQU4sQ0FBZ0IsT0FBTyxrQkFBUCxDQUFoQixFQUE0QyxZQUFNO0FBQ2hELElBQUUsS0FBRixDQUFRLFlBQU07QUFDWixVQUFNLE9BQU4sQ0FBYyxPQUFPLG1CQUFQLENBQWQsRUFBMkMsSUFBM0M7QUFDRCxHQUZELEVBRUcsSUFGSDtBQUlELENBTEQ7O0FBT0EsRUFBRSxnQkFBRixDQUFtQixRQUFuQixFQUE2QixrQkFBN0IsRUFBaUQ7QUFBQSxTQUFNLE1BQU0sT0FBTixDQUFjLE9BQU8scUNBQVAsQ0FBZCxFQUE2RCxJQUE3RCxDQUFOO0FBQUEsQ0FBakQ7O0FBRUEsRUFBRSxnQkFBRixDQUFtQixNQUFuQixFQUEyQixRQUEzQixFQUF1QyxZQUFNO0FBQzNDLE1BQUksc0JBQUo7QUFDQSxrQkFBZ0IsS0FBaEI7QUFDQSxTQUFPLEVBQUUsUUFBRixDQUFXLFlBQU07QUFDdEIsUUFBSSxlQUFKO0FBQ0EsUUFBSSxhQUFKLEVBQW1CO0FBQ2pCLHNCQUFnQixLQUFoQjtBQUNBLGFBQU8sYUFBUDtBQUNELEtBSEQsTUFHTztBQUNMLGVBQVMsRUFBRSxVQUFGLEVBQVQ7QUFDQSxVQUFJLFdBQVcsTUFBTSxHQUFOLENBQVUsT0FBTyxrQkFBUCxDQUFWLENBQWYsRUFBc0Q7QUFDcEQsd0JBQWdCLElBQWhCO0FBQ0EsZUFBTyxNQUFNLE9BQU4sQ0FBYyxPQUFPLGtCQUFQLENBQWQsRUFBMEMsRUFBRSxVQUFGLEVBQTFDLENBQVA7QUFDRDtBQUNGO0FBQ0YsR0FaTSxFQVlKLEdBWkksQ0FBUDtBQWFELENBaEJvQyxFQUFyQzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNuUUEsSUFBSSxLQUFLLFFBQVEsaUJBQVIsQ0FBVDtBQUFBLElBQ0UsSUFBSSxHQUFHLENBRFQ7QUFBQSxJQUVFLElBQUksR0FBRyxDQUZUOztJQUlxQixZOzs7QUFDbkIsd0JBQVksTUFBWixFQUFvQjtBQUFBOztBQUFBLDRIQUNaLE1BRFk7O0FBRWxCLFVBQUssWUFBTCxHQUFvQixrQkFBcEI7QUFDQSxVQUFLLFVBQUwsR0FBa0IsZ0JBQWxCO0FBQ0EsVUFBSyxTQUFMO0FBSmtCO0FBS25COzs7O2dDQUVXO0FBQUE7O0FBQ1YsVUFBSSxlQUFlLEVBQW5CO0FBQ0EsUUFBRSxhQUFGLENBQWdCLEtBQUssSUFBckIsRUFBMkIsaUJBQVM7QUFDbEMsWUFBRyxFQUFFLFFBQUYsQ0FBVyxLQUFYLEVBQWtCLE9BQUssWUFBdkIsQ0FBSCxFQUF5QztBQUN2Qyx1QkFBYSxJQUFiLENBQWtCLEtBQWxCO0FBQ0Q7QUFDRixPQUpEO0FBS0EsVUFBSSxhQUFhLElBQUksR0FBRyxVQUFQLENBQWtCLFlBQWxCLENBQWpCO0FBQ0EsaUJBQVcsSUFBWDtBQUNBLFFBQUUsYUFBRixDQUFnQixLQUFLLElBQXJCLEVBQTJCLGlCQUFTO0FBQ2xDLFlBQUcsRUFBRSxRQUFGLENBQVcsS0FBWCxFQUFrQixPQUFLLFVBQXZCLENBQUgsRUFBdUM7QUFDckMsWUFBRSxnQkFBRixDQUFtQixLQUFuQixFQUEwQixPQUExQixFQUFtQyxlQUFPO0FBQ3hDLGdCQUFHLENBQUMsSUFBSSxnQkFBUixFQUEwQjtBQUN4QixxQkFBSyxXQUFMLENBQWlCLFVBQWpCO0FBQ0EscUJBQU8sRUFBRSxjQUFGLENBQWlCLEdBQWpCLENBQVA7QUFDRDtBQUNGLFdBTEQ7QUFNRDtBQUNGLE9BVEQ7O0FBV0EsU0FBRyxLQUFILENBQVMsVUFBVCxDQUFvQixrQkFBcEIsRUFBd0MsWUFBTTtBQUM1QyxlQUFLLElBQUwsQ0FBVSxVQUFWO0FBQ0QsT0FGRDs7QUFJQSxTQUFHLEtBQUgsQ0FBUyxVQUFULENBQW9CLGdCQUFwQixFQUFzQyxZQUFNO0FBQzFDLGVBQUssSUFBTCxDQUFVLFVBQVY7QUFDRCxPQUZEO0FBR0Q7Ozt5QkFFSSxVLEVBQVk7QUFDZixRQUFFLFdBQUYsQ0FBYyxLQUFLLElBQW5CLEVBQXlCLFVBQXpCO0FBQ0EsaUJBQVcsSUFBWDtBQUNEOzs7eUJBRUksVSxFQUFZO0FBQ2YsVUFBRyxDQUFDLEVBQUUsUUFBRixDQUFXLEtBQUssSUFBaEIsRUFBc0IsVUFBdEIsQ0FBSixFQUF1QztBQUNyQyxVQUFFLFFBQUYsQ0FBVyxLQUFLLElBQWhCLEVBQXNCLFVBQXRCO0FBQ0Q7QUFDRCxpQkFBVyxJQUFYO0FBQ0Q7OztnQ0FFVyxVLEVBQVk7QUFDdEIsVUFBRyxFQUFFLFFBQUYsQ0FBVyxLQUFLLElBQWhCLEVBQXNCLFVBQXRCLENBQUgsRUFBc0M7QUFDcEMsYUFBSyxJQUFMLENBQVUsVUFBVjtBQUNELE9BRkQsTUFFTztBQUNMLGFBQUssSUFBTCxDQUFVLFVBQVY7QUFDRDtBQUNGOzs7O0VBdkR1QyxHQUFHLE07O2tCQUF4QixZOzs7QUEwRHJCLEdBQUcsT0FBSCxDQUFXLFlBQVgsR0FBMEIsWUFBMUI7Ozs7Ozs7OztBQzlEQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7SUFFTSxhOzs7Ozs7Ozs7OztnQ0FDUTtBQUNWLFdBQUssWUFBTCxHQUFvQixtQkFBcEI7QUFDQSxXQUFLLFVBQUwsR0FBa0IsaUJBQWxCO0FBQ0E7QUFDRDs7Ozs7O0FBR0gsYUFBRyxPQUFILENBQVcsYUFBWCxHQUEyQixhQUEzQjs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNYQSxJQUFJLEtBQUssUUFBUSxpQkFBUixDQUFUO0FBQUEsSUFDRSxZQUFZLFFBQVEsd0JBQVIsQ0FEZDtBQUFBLElBRUUsSUFBSSxHQUFHLENBRlQ7QUFBQSxJQUdFLElBQUksR0FBRyxDQUhUO0FBQUEsSUFJRSxnQkFBZ0IsQ0FKbEI7O0lBTXFCLGdCOzs7QUFDbkIsNEJBQVksTUFBWixFQUFvQjtBQUFBOztBQUFBLG9JQUNaLE1BRFk7O0FBRWxCLG9CQUFnQixnQkFBZ0IsQ0FBaEM7QUFDQSxNQUFFLGdCQUFGLENBQW1CLE1BQUssSUFBeEIsRUFBOEIsT0FBOUIsRUFBdUMsZUFBTztBQUM1QyxZQUFLLFdBQUw7QUFDQSxhQUFPLEVBQUUsY0FBRixDQUFpQixHQUFqQixDQUFQO0FBQ0QsS0FIRDtBQUhrQjtBQU9uQjs7OztzQ0FVaUI7QUFDaEIsVUFBSSxPQUFPLEVBQUUsYUFBRixDQUFnQixLQUFoQixDQUFYO0FBQ0EsUUFBRSxRQUFGLENBQVcsSUFBWCxFQUFpQixZQUFqQjtBQUNBLFFBQUUsT0FBRixDQUFVLElBQVYsRUFBZ0IsUUFBaEIsRUFBMEIsRUFBRSxPQUFGLENBQVUsS0FBSyxJQUFmLEVBQXFCLFFBQXJCLENBQTFCO0FBQ0EsUUFBRSxPQUFGLENBQVUsSUFBVixFQUFnQixPQUFoQixFQUF5QixFQUFFLE9BQUYsQ0FBVSxLQUFLLElBQWYsRUFBcUIsT0FBckIsQ0FBekI7QUFDQSxRQUFFLE9BQUYsQ0FBVSxJQUFWLEVBQWdCLFdBQWhCLEVBQTZCLEVBQUUsT0FBRixDQUFVLEtBQUssSUFBZixFQUFxQixXQUFyQixDQUE3Qjs7QUFFQSxXQUFLLFNBQUwsdUZBQ3NDLEtBQUssUUFEM0MsaUJBQzZELEtBQUssU0FEbEUsdUZBRW1DLEtBQUssUUFGeEM7QUFJQSxhQUFPLElBQVA7QUFDRDs7O2tDQUVhO0FBQ1osVUFBSSxPQUFPLEtBQUssZUFBTCxFQUFYO0FBQ0EsZ0JBQVUsV0FBVixDQUFzQixTQUFTLElBQS9CLEVBQXFDLElBQXJDO0FBQ0EsV0FBSyxhQUFMLEdBQXFCLElBQUksR0FBRyxPQUFILENBQVcsT0FBZixDQUF1QixFQUFDLE1BQU0sSUFBUCxFQUF2QixDQUFyQjtBQUNBLFdBQUssYUFBTCxDQUFtQixJQUFuQjtBQUNBLFdBQUssYUFBTCxDQUFtQixZQUFuQixDQUFnQyxLQUFLLElBQXJDO0FBQ0Q7Ozt3QkE1QmU7QUFDZCxhQUFPLEVBQUUsWUFBRixDQUFlLEtBQUssSUFBcEIsRUFBMEIsTUFBMUIsQ0FBUDtBQUNEOzs7d0JBRWM7QUFDYixpQ0FBeUIsYUFBekI7QUFDRDs7OztFQWhCMkMsR0FBRyxNOztrQkFBNUIsZ0I7OztBQXlDckIsR0FBRyxPQUFILENBQVcsZ0JBQVgsR0FBOEIsZ0JBQTlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDL0NBLElBQUksS0FBSyxRQUFRLGlCQUFSLENBQVQ7QUFBQSxJQUNFLFlBQVksUUFBUSx3QkFBUixDQURkO0FBQUEsSUFFRSxXQUFXLFFBQVEsd0JBQVIsQ0FGYjtBQUFBLElBR0UsSUFBSSxHQUFHLENBSFQ7QUFBQSxJQUlFLElBQUksR0FBRyxDQUpUOztJQU1xQixPOzs7QUFDbkIsbUJBQVksTUFBWixFQUFvQjtBQUFBOztBQUFBLGtIQUNaLE1BRFk7O0FBRWxCLFVBQUssU0FBTCxHQUFpQixFQUFFLE9BQUYsQ0FBVSxNQUFLLElBQWYsRUFBcUIsV0FBckIsQ0FBakI7QUFDQSxVQUFLLE1BQUwsR0FBYyxFQUFFLFFBQUYsQ0FBVyxFQUFFLE9BQUYsQ0FBVSxNQUFLLElBQWYsRUFBcUIsUUFBckIsQ0FBWCxFQUEyQyxHQUEzQyxDQUFkO0FBQ0EsVUFBSyxLQUFMLEdBQWEsRUFBRSxRQUFGLENBQVcsRUFBRSxPQUFGLENBQVUsTUFBSyxJQUFmLEVBQXFCLE9BQXJCLENBQVgsRUFBMEMsR0FBMUMsQ0FBYjs7QUFFQSxNQUFFLEtBQUYsQ0FBUSxZQUFNO0FBQ1osWUFBSyxXQUFMLEdBQW1CO0FBQUEsZUFBTyxNQUFLLFlBQUwsQ0FBa0IsR0FBbEIsQ0FBUDtBQUFBLE9BQW5CO0FBQ0EsUUFBRSxnQkFBRixDQUFtQixRQUFuQixFQUE2QixPQUE3QixFQUFzQyxNQUFLLFdBQTNDO0FBQ0QsS0FIRCxFQUdHLEdBSEg7QUFOa0I7QUFVbkI7Ozs7K0JBRVU7QUFDVCxRQUFFLG1CQUFGLENBQXNCLFFBQXRCLEVBQWdDLE9BQWhDLEVBQXlDLEtBQUssV0FBOUM7QUFDQTtBQUNBLGdCQUFVLFdBQVYsQ0FBc0IsS0FBSyxJQUEzQjtBQUNEOzs7aUNBRVksTSxFQUFRO0FBQ25CLFVBQUksT0FBTyxVQUFVLE9BQU8sY0FBUCxHQUF3QixDQUF4QixDQUFyQjtBQUNBLFVBQUcsSUFBSCxFQUFTO0FBQ1AsYUFBSyxXQUFMLENBQWlCLElBQWpCO0FBQ0EsWUFBRyxLQUFLLE1BQVIsRUFBZ0I7QUFDZCxlQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLE1BQWhCLEdBQXlCLEtBQUssTUFBOUI7QUFDRDtBQUNELFlBQUcsS0FBSyxLQUFSLEVBQWU7QUFDYixlQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLEtBQWhCLEdBQXdCLEtBQUssS0FBN0I7QUFDRDtBQUNGO0FBQ0Y7OztnQ0FFVyxJLEVBQU07QUFDaEIsVUFBSSxhQUFhLFNBQVMsV0FBVCxFQUFqQjtBQUFBLFVBQXlDLFlBQVksU0FBUyxVQUFULEVBQXJEO0FBQ0EsVUFBRyxLQUFLLFNBQUwsS0FBbUIsS0FBdEIsRUFBNkI7QUFDM0IsYUFBSyxPQUFMLENBQWEsSUFBYixFQUFtQixVQUFuQjtBQUNBLGFBQUsseUJBQUwsQ0FBK0IsSUFBL0IsRUFBcUMsU0FBckM7QUFDRCxPQUhELE1BR08sSUFBRyxLQUFLLFNBQUwsS0FBbUIsUUFBdEIsRUFBZ0M7QUFDckMsYUFBSyxVQUFMLENBQWdCLElBQWhCO0FBQ0EsYUFBSyx5QkFBTCxDQUErQixJQUEvQixFQUFxQyxTQUFyQztBQUNELE9BSE0sTUFHQSxJQUFHLEtBQUssU0FBTCxLQUFtQixNQUF0QixFQUE4QjtBQUNuQyxhQUFLLHVCQUFMLENBQTZCLElBQTdCLEVBQW1DLFVBQW5DO0FBQ0EsYUFBSyxRQUFMLENBQWMsSUFBZCxFQUFvQixTQUFwQjtBQUNELE9BSE0sTUFHQSxJQUFHLEtBQUssU0FBTCxLQUFtQixPQUF0QixFQUErQjtBQUNwQyxhQUFLLHVCQUFMLENBQTZCLElBQTdCLEVBQW1DLFVBQW5DO0FBQ0EsYUFBSyxTQUFMLENBQWUsSUFBZjtBQUNELE9BSE0sTUFHQTtBQUNMLGFBQUsseUJBQUwsQ0FBK0IsSUFBL0IsRUFBcUMsU0FBckM7QUFDQSxhQUFLLHVCQUFMLENBQTZCLElBQTdCLEVBQW1DLFVBQW5DO0FBQ0Q7QUFDRjs7OytCQUVVLEksRUFBTTtBQUNmLGFBQVEsS0FBSyxHQUFMLEdBQVcsS0FBSyxNQUFqQixHQUEyQixDQUFsQztBQUNEOzs7a0NBRWEsSSxFQUFNLFUsRUFBWTtBQUM5QixhQUFRLGFBQWEsS0FBSyxNQUFsQixHQUEyQixLQUFLLE1BQWpDLEdBQTJDLENBQWxEO0FBQ0Q7OztnQ0FFVyxJLEVBQU07QUFDaEIsYUFBUSxLQUFLLElBQUwsR0FBWSxLQUFLLEtBQWxCLEdBQTJCLENBQWxDO0FBQ0Q7OztpQ0FFWSxJLEVBQU0sUyxFQUFXO0FBQzVCLGFBQVEsWUFBWSxLQUFLLEtBQWpCLEdBQXlCLEtBQUssS0FBL0IsR0FBd0MsQ0FBL0M7QUFDRDs7OzRCQUVPLEksRUFBTSxVLEVBQVk7QUFDeEIsV0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixNQUFoQixHQUF5QixhQUFhLEtBQUssR0FBbEIsR0FBd0IsQ0FBakQ7QUFDRDs7OytCQUVVLEksRUFBTTtBQUNmLFdBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsR0FBaEIsR0FBc0IsS0FBSyxNQUEzQjtBQUNEOzs7OEJBRVMsSSxFQUFNO0FBQ2QsV0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixJQUFoQixHQUF1QixLQUFLLEtBQUwsR0FBYSxDQUFwQztBQUNEOzs7NkJBRVEsSSxFQUFNLFMsRUFBVztBQUN4QixXQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLEtBQWhCLEdBQXdCLFlBQVksS0FBSyxJQUFqQixHQUF3QixDQUFoRDtBQUNEOzs7OENBRXlCLEksRUFBTSxTLEVBQVc7QUFDekMsVUFBRyxLQUFLLFlBQUwsQ0FBa0IsSUFBbEIsRUFBd0IsU0FBeEIsQ0FBSCxFQUF1QztBQUNyQyxhQUFLLFNBQUwsQ0FBZSxJQUFmO0FBQ0QsT0FGRCxNQUVPLElBQUcsS0FBSyxXQUFMLENBQWlCLElBQWpCLENBQUgsRUFBMkI7QUFDaEMsYUFBSyxRQUFMLENBQWMsSUFBZCxFQUFvQixTQUFwQjtBQUNELE9BRk0sTUFFQTtBQUNMLGFBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsSUFBaEIsR0FBdUIsWUFBWSxLQUFLLEtBQWpCLEdBQXlCLENBQWhEO0FBQ0Q7QUFDRjs7OzRDQUV1QixJLEVBQU0sVSxFQUFZO0FBQ3hDLFVBQUcsS0FBSyxhQUFMLENBQW1CLElBQW5CLEVBQXlCLFVBQXpCLENBQUgsRUFBeUM7QUFDdkMsYUFBSyxVQUFMLENBQWdCLElBQWhCO0FBQ0QsT0FGRCxNQUVPLElBQUcsS0FBSyxVQUFMLENBQWdCLElBQWhCLENBQUgsRUFBMEI7QUFDL0IsYUFBSyxPQUFMLENBQWEsSUFBYixFQUFtQixVQUFuQjtBQUNELE9BRk0sTUFFQTtBQUNMLGFBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsR0FBaEIsR0FBc0IsYUFBYSxLQUFLLE1BQWxCLEdBQTJCLENBQWpEO0FBQ0Q7QUFDRjs7O2lDQUVZLEcsRUFBSztBQUNoQixXQUFLLFFBQUw7QUFDQSxhQUFPLEVBQUUsY0FBRixDQUFpQixHQUFqQixDQUFQO0FBQ0Q7Ozs7RUEzR2tDLEdBQUcsTTs7a0JBQW5CLE87OztBQThHckIsR0FBRyxPQUFILENBQVcsT0FBWCxHQUFxQixPQUFyQjs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNwSEEsSUFBSSxLQUFLLFFBQVEsaUJBQVIsQ0FBVDtBQUFBLElBQ0UsWUFBWSxRQUFRLHdCQUFSLENBRGQ7QUFBQSxJQUVFLElBQUksR0FBRyxDQUZUO0FBQUEsSUFHRSxJQUFJLEdBQUcsQ0FIVDtBQUFBLElBSUUsZ0JBQWdCLENBSmxCOztJQU1xQixXOzs7QUFDbkIsdUJBQVksTUFBWixFQUFvQjtBQUFBOztBQUFBLDBIQUNaLE1BRFk7O0FBRWxCLG9CQUFnQixnQkFBZ0IsQ0FBaEM7QUFDQSxNQUFFLGdCQUFGLENBQW1CLE1BQUssSUFBeEIsRUFBOEIsT0FBOUIsRUFBdUMsZUFBTztBQUM1QyxZQUFLLFdBQUw7QUFDQSxhQUFPLEVBQUUsY0FBRixDQUFpQixHQUFqQixDQUFQO0FBQ0QsS0FIRDtBQUhrQjtBQU9uQjs7OztzQ0FVaUI7QUFDaEIsVUFBSSxPQUFPLEVBQUUsYUFBRixDQUFnQixLQUFoQixDQUFYO0FBQ0EsUUFBRSxRQUFGLENBQVcsSUFBWCxFQUFpQixZQUFqQjtBQUNBLFFBQUUsT0FBRixDQUFVLElBQVYsRUFBZ0IsUUFBaEIsRUFBMEIsRUFBRSxPQUFGLENBQVUsS0FBSyxJQUFmLEVBQXFCLFFBQXJCLENBQTFCO0FBQ0EsUUFBRSxPQUFGLENBQVUsSUFBVixFQUFnQixPQUFoQixFQUF5QixFQUFFLE9BQUYsQ0FBVSxLQUFLLElBQWYsRUFBcUIsT0FBckIsQ0FBekI7QUFDQSxRQUFFLE9BQUYsQ0FBVSxJQUFWLEVBQWdCLFdBQWhCLEVBQTZCLEVBQUUsT0FBRixDQUFVLEtBQUssSUFBZixFQUFxQixXQUFyQixDQUE3Qjs7QUFFQSxXQUFLLFNBQUwsbUZBQ2tDLEtBQUssU0FEdkMsV0FDcUQsS0FBSyxJQUQxRDtBQUdBLGFBQU8sSUFBUDtBQUNEOzs7a0NBRWE7QUFDWixVQUFJLE9BQU8sS0FBSyxlQUFMLEVBQVg7QUFDQSxnQkFBVSxXQUFWLENBQXNCLFNBQVMsSUFBL0IsRUFBcUMsSUFBckM7QUFDQSxXQUFLLGFBQUwsR0FBcUIsSUFBSSxHQUFHLE9BQUgsQ0FBVyxPQUFmLENBQXVCLEVBQUMsTUFBTSxJQUFQLEVBQXZCLENBQXJCO0FBQ0EsV0FBSyxhQUFMLENBQW1CLElBQW5CO0FBQ0EsV0FBSyxhQUFMLENBQW1CLFlBQW5CLENBQWdDLEtBQUssSUFBckM7QUFDRDs7O3dCQTNCVTtBQUNULGFBQU8sRUFBRSxPQUFGLENBQVUsS0FBSyxJQUFmLEVBQXFCLGFBQXJCLENBQVA7QUFDRDs7O3dCQUVlO0FBQ2QsZ0NBQXdCLGFBQXhCO0FBQ0Q7Ozs7RUFoQnNDLEdBQUcsTTs7a0JBQXZCLFc7OztBQXdDckIsR0FBRyxPQUFILENBQVcsV0FBWCxHQUF5QixXQUF6Qjs7QUFFQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNoREEsSUFBSSxLQUFLLFFBQVEsaUJBQVIsQ0FBVDtBQUFBLElBQ0UsSUFBSSxHQUFHLENBRFQ7QUFBQSxJQUVFLElBQUksR0FBRyxDQUZUOztJQUlxQixPOzs7QUFDbkIsbUJBQVksTUFBWixFQUFvQjtBQUFBOztBQUFBLGtIQUNaLE1BRFk7O0FBRWxCLFVBQUssV0FBTDtBQUZrQjtBQUduQjs7OztxQ0FFZ0I7QUFDZixVQUFJLGNBQWMsRUFBRSxZQUFGLENBQWUsRUFBRSxPQUFGLENBQVUsS0FBSyxJQUFmLEVBQXFCLFFBQXJCLENBQWYsRUFBK0MsR0FBL0MsQ0FBbEI7QUFDQSxVQUFJLGNBQWMsRUFBbEI7QUFDQSxRQUFFLElBQUYsQ0FBTyxXQUFQLEVBQW9CLHNCQUFjO0FBQ2hDLFlBQUksUUFBUSxFQUFFLElBQUYsQ0FBTyxRQUFQLHlCQUFzQyxVQUF0QyxRQUFaO0FBQ0EsVUFBRSxJQUFGLENBQU8sS0FBUCxFQUFjLGdCQUFRO0FBQ3BCLHNCQUFZLElBQVosQ0FBaUIsSUFBakI7QUFDRCxTQUZEO0FBR0QsT0FMRDtBQU1BLGFBQU8sV0FBUDtBQUNEOzs7a0NBRWM7QUFBQTs7QUFDYixVQUFJLGNBQWMsS0FBSyxjQUFMLEVBQWxCO0FBQ0EsUUFBRSxJQUFGLENBQU8sV0FBUCxFQUFvQixnQkFBUTtBQUMxQixZQUFHLENBQUMsRUFBRSxPQUFGLENBQVUsSUFBVixFQUFnQixXQUFoQixDQUFKLEVBQWtDO0FBQ2hDLFlBQUUsT0FBRixDQUFVLElBQVYsRUFBZ0IsV0FBaEIsRUFBNkIsSUFBN0I7QUFDRDtBQUNGLE9BSkQ7QUFLQSxVQUFJLGFBQWEsSUFBSSxHQUFHLFVBQVAsQ0FBa0IsV0FBbEIsQ0FBakI7QUFDQSxpQkFBVyxJQUFYO0FBQ0EsUUFBRSxnQkFBRixDQUFtQixLQUFLLElBQXhCLEVBQThCLE9BQTlCLEVBQXVDLGVBQU87QUFDNUMsWUFBRyxDQUFDLElBQUksZ0JBQVIsRUFBMEI7QUFDeEIsaUJBQUssV0FBTCxDQUFpQixVQUFqQjtBQUNBLGlCQUFPLEVBQUUsY0FBRixDQUFpQixHQUFqQixDQUFQO0FBQ0Q7QUFDRixPQUxEO0FBTUEsU0FBRyxLQUFILENBQVMsVUFBVCxDQUFvQixrQkFBcEIsRUFBd0MsWUFBTTtBQUM1QyxlQUFLLElBQUwsQ0FBVSxVQUFWO0FBQ0QsT0FGRDs7QUFJQSxTQUFHLEtBQUgsQ0FBUyxVQUFULENBQW9CLGdCQUFwQixFQUFzQyxZQUFNO0FBQzFDLGVBQUssSUFBTCxDQUFVLFVBQVY7QUFDRCxPQUZEO0FBR0Q7Ozt5QkFFSSxVLEVBQVk7QUFDZixRQUFFLFdBQUYsQ0FBYyxLQUFLLElBQW5CLEVBQXlCLFNBQXpCO0FBQ0EsaUJBQVcsSUFBWDtBQUNBLGlCQUFXLFdBQVgsQ0FBdUIsRUFBdkI7QUFDRDs7O3lCQUVJLFUsRUFBWTtBQUNmLFVBQUcsQ0FBQyxFQUFFLFFBQUYsQ0FBVyxLQUFLLElBQWhCLEVBQXNCLFNBQXRCLENBQUosRUFBc0M7QUFDcEMsVUFBRSxRQUFGLENBQVcsS0FBSyxJQUFoQixFQUFzQixTQUF0QjtBQUNEO0FBQ0QsaUJBQVcsSUFBWDtBQUNBLGlCQUFXLFdBQVgsQ0FBdUIsQ0FBQyxNQUFELENBQXZCO0FBQ0Q7OztnQ0FFVyxVLEVBQVk7QUFDdEIsVUFBRyxFQUFFLFFBQUYsQ0FBVyxLQUFLLElBQWhCLEVBQXNCLFNBQXRCLENBQUgsRUFBcUM7QUFDbkMsYUFBSyxJQUFMLENBQVUsVUFBVjtBQUNELE9BRkQsTUFFTztBQUNMLGFBQUssSUFBTCxDQUFVLFVBQVY7QUFDRDtBQUNGOzs7O0VBOURrQyxHQUFHLE07O2tCQUFuQixPOzs7QUFpRXJCLEdBQUcsT0FBSCxDQUFXLE9BQVgsR0FBcUIsT0FBckI7QUFDQSxHQUFHLE9BQUgsQ0FBVyxRQUFYLEdBQXNCLE9BQXRCO0FBQ0EsR0FBRyxPQUFILENBQVcsVUFBWCxHQUF3QixPQUF4Qjs7Ozs7QUN2RUEsSUFBSSxLQUFLLFFBQVEsY0FBUixDQUFUO0FBQ0EsSUFBSSxJQUFJLEdBQUcsQ0FBWDtBQUNBLE9BQU8sT0FBUCxHQUFpQjs7QUFFZixZQUFVO0FBQ1Isa0JBQWMsQ0FETjtBQUVSLG9CQUFnQixDQUZSO0FBR1IsZUFBVyxDQUhIO0FBSVIsd0JBQW9CLENBSlo7QUFLUiwyQkFBdUIsQ0FMZjtBQU1SLGlCQUFhLENBTkw7QUFPUixpQ0FBNkIsQ0FQckI7QUFRUixrQkFBYyxDQVJOO0FBU1IsbUJBQWUsQ0FUUDtBQVVSLHdCQUFvQixFQVZaO0FBV1IsNEJBQXdCLEVBWGhCO0FBWVIsbUJBQWU7QUFaUCxHQUZLOztBQWlCZixhQWpCZSx1QkFpQkgsSUFqQkcsRUFpQm1DO0FBQUEsUUFBaEMsTUFBZ0MsdUVBQXZCLEtBQUssVUFBTCxDQUFnQixJQUFoQixDQUF1Qjs7QUFDaEQsV0FBTyxVQUFVLE9BQU8sV0FBakIsSUFBZ0MsT0FBTyxXQUFQLENBQW1CLElBQW5CLENBQXZDO0FBQ0QsR0FuQmM7QUFvQmYsYUFwQmUsdUJBb0JILE1BcEJHLEVBb0JLLE9BcEJMLEVBb0JjO0FBQzNCLFdBQU8sVUFBVSxPQUFPLFdBQWpCLElBQWdDLE9BQU8sV0FBUCxDQUFtQixPQUFuQixDQUF2QztBQUNELEdBdEJjO0FBdUJmLFlBdkJlLHNCQXVCSixJQXZCSSxFQXVCRTtBQUNmLFdBQU8sUUFBUSxLQUFLLFVBQXBCO0FBQ0QsR0F6QmM7QUEwQmYsWUExQmUsc0JBMEJKLElBMUJJLEVBMEJFO0FBQ2YsV0FBTyxRQUFRLEtBQUssVUFBYixJQUEyQixFQUFsQztBQUNELEdBNUJjO0FBNkJmLFlBN0JlLHNCQTZCSixJQTdCSSxFQTZCRTtBQUNmLFdBQU8sS0FBSyxVQUFMLENBQWdCLEVBQUUsYUFBRixDQUFnQixLQUFoQixFQUF1QixJQUF2QixDQUFoQixDQUFQO0FBQ0QsR0EvQmM7QUFnQ2YsV0FoQ2UscUJBZ0NMLElBaENLLEVBZ0NDO0FBQ2QsV0FBTyxRQUFRLEtBQUssU0FBYixJQUEwQixFQUFqQztBQUNELEdBbENjO0FBbUNmLGFBbkNlLHVCQW1DSCxJQW5DRyxFQW1DRyxPQW5DSCxFQW1DVztBQUN4QixXQUFPLEtBQUssVUFBTCxDQUFnQixZQUFoQixDQUE2QixPQUE3QixFQUFzQyxLQUFLLFdBQTNDLENBQVA7QUFDRCxHQXJDYztBQXNDZixPQXRDZSxpQkFzQ1QsSUF0Q1MsRUFzQ0g7QUFDVixXQUFPLFFBQVEsS0FBSyxTQUFwQjtBQUNELEdBeENjO0FBeUNmLE1BekNlLGdCQXlDVixJQXpDVSxFQXlDSjtBQUNULFdBQU8sUUFBUSxLQUFLLFFBQXBCO0FBQ0QsR0EzQ2M7QUE0Q2YsTUE1Q2UsZ0JBNENWLElBNUNVLEVBNENKO0FBQ1QsV0FBTyxRQUFRLEtBQUssUUFBcEI7QUFDRCxHQTlDYztBQStDZixlQS9DZSx5QkErQ0QsSUEvQ0MsRUErQ0s7QUFDbEIsV0FBTyxLQUFLLElBQUwsQ0FBVSxJQUFWLE1BQW9CLEtBQUssUUFBTCxDQUFjLFlBQXpDO0FBQ0QsR0FqRGM7QUFrRGYsWUFsRGUsc0JBa0RKLElBbERJLEVBa0RFO0FBQ2YsV0FBTyxLQUFLLElBQUwsQ0FBVSxJQUFWLE1BQW9CLEtBQUssUUFBTCxDQUFjLFNBQXpDO0FBQ0Q7QUFwRGMsQ0FBakI7Ozs7OztBQ0ZBLElBQUksS0FBSyxRQUFRLGNBQVIsQ0FBVDtBQUFBLElBQ0UsSUFBSSxHQUFHLENBRFQ7O0FBR0EsT0FBTyxPQUFQLEdBQWlCO0FBQ2YsWUFEZSx3QkFDRjtBQUNYLFFBQUksYUFBYSxPQUFPLFVBQXhCO0FBQ0EsUUFBRyxDQUFDLEVBQUUsU0FBRixDQUFZLFVBQVosQ0FBSixFQUE2QjtBQUMzQixVQUFJLGNBQWMsRUFBRSxHQUFGLENBQU0sUUFBTixFQUFnQiw2QkFBaEIsQ0FBbEI7QUFDQSxvQkFBYyxFQUFFLFNBQUYsQ0FBWSxXQUFaLElBQTJCLFdBQTNCLEdBQXlDLEVBQUUsR0FBRixDQUFNLFFBQU4sRUFBZ0Isa0JBQWhCLENBQXZEO0FBQ0EsVUFBRyxFQUFFLFNBQUYsQ0FBWSxXQUFaLENBQUgsRUFBNkI7QUFDM0IscUJBQWEsV0FBYjtBQUNEO0FBQ0Y7QUFDRCxXQUFPLFVBQVA7QUFFRCxHQVpjO0FBYWYsYUFiZSx5QkFhRDtBQUNaLFFBQUksY0FBYyxPQUFPLFdBQXpCO0FBQ0EsUUFBRyxDQUFDLEVBQUUsU0FBRixDQUFZLFdBQVosQ0FBSixFQUE4QjtBQUM1QixVQUFJLGVBQWUsRUFBRSxHQUFGLENBQU0sUUFBTixFQUFnQiw4QkFBaEIsQ0FBbkI7QUFDQSxxQkFBZSxFQUFFLFNBQUYsQ0FBWSxZQUFaLElBQTRCLFlBQTVCLEdBQTJDLEVBQUUsR0FBRixDQUFNLFFBQU4sRUFBZ0IsbUJBQWhCLENBQTFEO0FBQ0EsVUFBRyxFQUFFLFNBQUYsQ0FBWSxZQUFaLENBQUgsRUFBOEI7QUFDNUIsc0JBQWMsWUFBZDtBQUNEO0FBQ0Y7QUFDRCxXQUFPLFdBQVA7QUFDRDtBQXZCYyxDQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5sZXQgeyBtb2RlbCB9ID0gcmg7XHJcbmxldCB7IGNvbnN0cyB9ID0gcmg7XHJcbmxldCB7IF8gfSA9IHJoO1xyXG5cclxuY2xhc3MgUGhvbmVHYXAge1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgKHRoaXMuYWRkSnNUb1RvcGljcykoKTtcclxuICB9XHJcblxyXG4gIGFkZEpzVG9Ub3BpY3MoKSB7XHJcbiAgICByZXR1cm4gbW9kZWwuc3Vic2NyaWJlT25jZShjb25zdHMoJ0tFWV9NT0JJTEVfQVBQX01PREUnKSwgZnVuY3Rpb24odmFsKSB7XHJcbiAgICAgIGlmICh2YWwpIHtcclxuICAgICAgICByZXR1cm4gbW9kZWwuc3Vic2NyaWJlKGNvbnN0cygnRVZUX1dJREdFVF9MT0FERUQnKSwgKCkgPT5cclxuICAgICAgICAgIF8ubG9hZFNjcmlwdChjb25zdHMoJ0NPUkRPVkFfSlNfVVJMJyksIGZhbHNlLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHJoLmRlYnVnKSB7IHJldHVybiByaC5fZCgnaW5mbycsICdsb2FkZWQgQ29yZG92YS5qcycpOyB9XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuXHJcbm5ldyBQaG9uZUdhcDtcclxuIiwibGV0IHsgcmggfSA9IHdpbmRvdztcclxubGV0IHsgY29uc3RzIH0gPSByaDtcclxuXHJcbnJoLm1vZGVsLnN1YnNjcmliZShjb25zdHMoJ0VWVF9TQ1JPTExfVE9fVE9QJyksIGR1bW15ID0+IHdpbmRvdy5zY3JvbGxUbygwLCAwKSk7XHJcblxyXG5yaC5tb2RlbC5zdWJzY3JpYmUoY29uc3RzKCdFVlRfUFJJTlRfVE9QSUMnKSwgZnVuY3Rpb24oKSB7XHJcbiAgKHdpbmRvdy5mb2N1cykoKTtcclxuICByZXR1cm4gKHdpbmRvdy5wcmludCkoKTtcclxufSk7XHJcbiIsImxldCB7IHJoIH0gPSB3aW5kb3c7XHJcbmxldCB7IF8gfSA9IHJoO1xyXG5sZXQgeyBjb25zdHMgfSA9IHJoO1xyXG5cclxuXy5nZXRSb290VXJsID0gKGZ1bmN0aW9uKCkge1xyXG4gIGxldCByb290VXJsID0gbnVsbDtcclxuICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAocm9vdFVybCA9PSBudWxsKSB7XHJcbiAgICAgIGxldCByb290SW5mbyA9IHdpbmRvdy5nU2NyZWVuUmVsUGF0aE1hcFt3aW5kb3cuZ0ZpbmFsQ29tbW9uUm9vdFJlbFBhdGhdO1xyXG4gICAgICByb290VXJsID0gYCR7Xy5nZXRIb3N0Rm9sZGVyKCl9JHtfLmZpeFJlbGF0aXZlVXJsKHJvb3RJbmZvICE9IG51bGwgPyByb290SW5mby5kZWZhdWx0VVJMIDogdW5kZWZpbmVkKX1gO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJvb3RVcmw7XHJcbiAgfTtcclxufSkoKTtcclxuXHJcbl8ucmVkaXJlY3RUb0xheW91dCA9IGZ1bmN0aW9uKCkge1xyXG4gIGxldCBob3N0Rm9sZGVyID0gXy5nZXRIb3N0Rm9sZGVyKCk7XHJcbiAgbGV0IHF1ZXJ5ID0gJyc7XHJcbiAgbGV0IHJlbFVybCA9IHdpbmRvdy5fZ2V0UmVsYXRpdmVGaWxlTmFtZShob3N0Rm9sZGVyLFxyXG4gICAgZGVjb2RlVVJJKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYpKTtcclxuICBsZXQgcmVmID0gZG9jdW1lbnQucmVmZXJyZXI7XHJcbiAgaWYgKHJlZiAmJiAhXy5pc0V4dGVybmFsVXJsKHJlZikpIHtcclxuICAgIGxldCBxdWVyeU1hcCA9IF8udXJsUGFyYW1zKF8uZXh0cmFjdFBhcmFtU3RyaW5nKHJlZikpO1xyXG4gICAgaWYgKCFfLmlzRW1wdHlPYmplY3QocXVlcnlNYXApKSB7IHF1ZXJ5ID0gYD8ke18ubWFwVG9FbmNvZGVkU3RyaW5nKHF1ZXJ5TWFwKX1gOyB9XHJcbiAgfVxyXG5cclxuICBsZXQgaGFzaE1hcCA9IF8udXJsUGFyYW1zKF8uZXh0cmFjdFBhcmFtU3RyaW5nKHJlbFVybCkpO1xyXG4gIGhhc2hNYXBbY29uc3RzKCdIQVNIX0tFWV9UT1BJQycpXSA9IF8uc3RyaXBQYXJhbShyZWxVcmwpO1xyXG4gIGhhc2hNYXBbY29uc3RzKCdIQVNIX0tFWV9VSU1PREUnKV0gPSBudWxsO1xyXG4gIGxldCBoYXNoID0gYCMke18ubWFwVG9FbmNvZGVkU3RyaW5nKGhhc2hNYXApfWA7XHJcbiAgcmV0dXJuIGRvY3VtZW50LmxvY2F0aW9uLnJlcGxhY2UoYCR7Xy5nZXRSb290VXJsKCl9JHtxdWVyeX0ke2hhc2h9YCk7XHJcbn07XHJcblxyXG5cclxuXy5nb1RvRnVsbExheW91dCA9IGZ1bmN0aW9uKCkge1xyXG4gIGxldCBob3N0Rm9sZGVyID0gXy5nZXRIb3N0Rm9sZGVyKCk7XHJcbiAgbGV0IHF1ZXJ5ID0gJyc7XHJcbiAgbGV0IHJlbFVybCA9IHdpbmRvdy5fZ2V0UmVsYXRpdmVGaWxlTmFtZShob3N0Rm9sZGVyLFxyXG4gICAgZGVjb2RlVVJJKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYpKTtcclxuICBsZXQgcmVmID0gZG9jdW1lbnQucmVmZXJyZXI7XHJcbiAgaWYgKHJlZiAmJiAhXy5pc0V4dGVybmFsVXJsKHJlZikpIHtcclxuICAgIGxldCBxdWVyeU1hcCA9IF8udXJsUGFyYW1zKF8uZXh0cmFjdFBhcmFtU3RyaW5nKHJlZikpO1xyXG4gICAgcXVlcnlNYXBbY29uc3RzKCdSSE1BUElEJyldID0gbnVsbDtcclxuICAgIHF1ZXJ5TWFwW2NvbnN0cygnUkhNQVBOTycpXSA9IG51bGw7XHJcbiAgICBpZiAoIV8uaXNFbXB0eU9iamVjdChxdWVyeU1hcCkpIHsgcXVlcnkgPSBgPyR7Xy5tYXBUb0VuY29kZWRTdHJpbmcocXVlcnlNYXApfWA7IH1cclxuICB9XHJcblxyXG4gIGxldCB0b3BpY1BhZ2VQYXRoID0gY29uc3RzKCdTVEFSVF9GSUxFUEFUSCcpO1xyXG4gIGlmKHRvcGljUGFnZVBhdGggJiYgKHRvcGljUGFnZVBhdGggIT09ICcnKSkge1xyXG4gICAgbGV0IHJvb3RVcmwgPSBgJHtob3N0Rm9sZGVyfSR7Xy5maXhSZWxhdGl2ZVVybCh0b3BpY1BhZ2VQYXRoKX1gO1xyXG4gICAgbGV0IGhhc2hNYXAgPSBfLnVybFBhcmFtcyhfLmV4dHJhY3RQYXJhbVN0cmluZyhyZWxVcmwpKTtcclxuICAgIGhhc2hNYXBbY29uc3RzKCdIQVNIX0tFWV9UT1BJQycpXSA9IF8uc3RyaXBQYXJhbShyZWxVcmwpO1xyXG4gICAgaGFzaE1hcFtjb25zdHMoJ0hBU0hfS0VZX1VJTU9ERScpXSA9IG51bGw7XHJcbiAgICBsZXQgaGFzaCA9IGAjJHtfLm1hcFRvRW5jb2RlZFN0cmluZyhoYXNoTWFwKX1gO1xyXG4gICAgcmV0dXJuIGRvY3VtZW50LmxvY2F0aW9uLnJlcGxhY2UoYCR7cm9vdFVybH0ke3F1ZXJ5fSR7aGFzaH1gKTtcclxuICB9XHJcbn07XHJcbiAiLCIvL0d1bmphblxyXG5pZiAoZ2xvYmFsLnJoID09PSB1bmRlZmluZWQpIHtcclxuICBnbG9iYWwucmggPSB7fTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnbG9iYWwucmhcclxuIiwicmVxdWlyZShcIi4uL2xpYi9yaFwiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvcm9ib2hlbHAvdG9waWMvdXJsX3V0aWxzXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9yb2JvaGVscC90b3BpYy90b3BpY19ldmVudHNcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL3JvYm9oZWxwL3RvcGljL3Bob25lZ2FwXCIpXHJcbnJlcXVpcmUoXCIuL3RvcGljL2luaXRcIilcclxucmVxdWlyZShcIi4vdG9waWMvd2lkZ2V0cy9kcm9wZG93bl90ZXh0XCIpXHJcbnJlcXVpcmUoXCIuL3RvcGljL3dpZGdldHMvZXhwYW5kaW5nX3RleHRcIilcclxucmVxdWlyZShcIi4vdG9waWMvd2lkZ2V0cy9wb3BvdmVyXCIpXHJcbnJlcXVpcmUoXCIuL3RvcGljL3dpZGdldHMvaHlwZXJsaW5rX3BvcG92ZXJcIilcclxucmVxdWlyZShcIi4vdG9waWMvd2lkZ2V0cy90ZXh0X3BvcG92ZXJcIilcclxucmVxdWlyZShcIi4vdG9waWMvd2lkZ2V0cy90cmlnZ2VyXCIpXHJcbnJlcXVpcmUoXCIuL3RvcGljL2hpZ2hsaWdodFwiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvcm9ib2hlbHAvdG9waWMvdG9waWNfZXZlbnRzXCIpXHJcbiIsImxldCByaCA9IHJlcXVpcmUoXCIuLi8uLi9saWIvcmhcIilcclxubGV0IF8gPSByaC5fXHJcbmxldCAkID0gcmguJFxyXG5cclxuXy5yZW1vdmVIaWdobGlnaHQgPSAoKSA9PiB7XHJcbiAgbGV0ICRib2R5ID0gJCgnYm9keScsIDApXHJcbiAgbGV0ICRoaWdobGlnaHRfZWxlbWVudHMgPSAkLmZpbmQoJGJvZHksICdzcGFuW2RhdGEtaGlnaGxpZ2h0XScpIHx8IFtdXHJcbiAgXy5lYWNoKCRoaWdobGlnaHRfZWxlbWVudHMsIChub2RlKSA9PiB7XHJcbiAgICAkLnJlbW92ZUF0dHJpYnV0ZShub2RlLCAnc3R5bGUnKVxyXG4gIH0pXHJcbn1cclxuXHJcbnJoLm1vZGVsLmNzdWJzY3JpYmUoJ0VWVF9SRU1PVkVfSElHSExJR0hUJywgXy5yZW1vdmVIaWdobGlnaHQpXHJcblxyXG4iLCJsZXQgcmggPSByZXF1aXJlKFwiLi4vLi4vbGliL3JoXCIpO1xyXG5sZXQgXyA9IHJoLl87XHJcbmxldCBjb25zdHMgPSByaC5jb25zdHM7XHJcbmxldCAkID0gcmguJDtcclxubGV0IG1vZGVsID0gcmgubW9kZWw7XHJcbmxldCBFdmVudEhhbmRsZXJzLCBlSGFuZGxlcnMsIHJlZ2lzdGVyZWRFdmVudHM7XHJcblxyXG5fLm9uVG9waWNMb2FkID0gKCkgPT4ge1xyXG4gIGxldCBwYXJhbXNTdHIgPSBfLmV4dHJhY3RQYXJhbVN0cmluZyhkb2N1bWVudC5sb2NhdGlvbi5ocmVmKTtcclxuICBsZXQgcGFyYW1zTWFwID0gXy51cmxQYXJhbXMocGFyYW1zU3RyKTtcclxuICBsZXQgcmVkaXJlY3RhdHRyID0gY29uc3RzKCdSSF9GVUxMX0xBWU9VVF9QQVJBTScpO1xyXG4gIGlmIChyZWRpcmVjdGF0dHIgaW4gcGFyYW1zTWFwKSB7XHJcbiAgICBfLmFkZFByb2plY3REYXRhKF8uZ29Ub0Z1bGxMYXlvdXQpXHJcbiAgfVxyXG4gIGVsc2V7XHJcbiAgICBfLmFkZEdvVG9MYXlvdXQoKTtcclxuICAgIF8ucmVtb3ZlX2NidCgpO1xyXG4gIH1cclxufTtcclxuXHJcbl8ucmVtb3ZlX2NidCA9ICgpID0+e1xyXG4gIGxldCAkYm9keSA9ICQoJ2JvZHknLDApO1xyXG4gIGxldCAkY2J0X2VsZW1lbnRzID0gJC5maW5kKCRib2R5LCAnW2RhdGEtcmh0YWdzXScpO1xyXG4gIGlmKCRjYnRfZWxlbWVudHMpe1xyXG4gICAgXy5lYWNoKCRjYnRfZWxlbWVudHMsIChub2RlKSA9PntcclxuICAgICAgJC5yZW1vdmVDbGFzcyhub2RlLCAncmgtaGlkZScpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuXy5nZXRSZWxhdGl2ZVRvcGljUGF0aCA9ICgpID0+IHtcclxuICBsZXQgcGF0aCA9IF8ubWFrZVJlbGF0aXZlVXJsKF8uZ2V0Um9vdFVybCgpLCBfLmZpbGVQYXRoKCkpO1xyXG4gIGxldCBpbmRleCA9IHBhdGgubGFzdEluZGV4T2YoJy8nKTtcclxuICByZXR1cm4gaW5kZXggIT09IC0xID8gXy5wYXJlbnRQYXRoKHBhdGgpIDogXCJcIjtcclxufVxyXG5cclxuXy5hZGRMYXlvdXRIVE1MID0gKCkgPT57XHJcblxyXG4gIG1vZGVsLnN1YnNjcmliZU9uY2UoW2NvbnN0cygnS0VZX0hFQURFUl9IVE1MJyldLCAoKSA9PiB7XHJcbiAgICBsZXQgZm9ybWF0ID0gbW9kZWwuZ2V0KGNvbnN0cygnS0VZX0hFQURFUl9IVE1MJykpO1xyXG5cclxuICAgIGlmKGZvcm1hdCAmJiBmb3JtYXQgIT09IFwiXCIpe1xyXG5cclxuICAgICAgbW9kZWwuc3Vic2NyaWJlT25jZShbY29uc3RzKCdLRVlfSEVBREVSX1RJVExFJyksIGNvbnN0cygnS0VZX0xORycpXSwgKCkgPT4ge1xyXG4gICAgICAgIGxldCB0aXRsZSA9IG1vZGVsLmdldChjb25zdHMoJ0tFWV9IRUFERVJfVElUTEUnKSk7XHJcbiAgICAgICAgbGV0IGxhYmVsID0gbW9kZWwuZ2V0KGNvbnN0cygnS0VZX0xORycpKS5TaG93VG9waWNJbkNvbnRleHQ7XHJcbiAgICAgICAgbGFiZWwgPSBsYWJlbCA/IGxhYmVsIDogXCJDbGljayBoZXJlIHRvIHNlZSB0aGlzIHBhZ2UgaW4gZnVsbCBjb250ZXh0XCI7XHJcbiAgICAgICAgbGV0IHRvb2x0aXAgPSBsYWJlbDtcclxuICAgICAgICBsZXQgbG9nbyA9IG1vZGVsLmdldChjb25zdHMoJ0tFWV9IRUFERVJfTE9HT19QQVRIJykpO1xyXG4gICAgICAgIGxvZ28gPSBfLmdldFJlbGF0aXZlVG9waWNQYXRoKCkgKyBsb2dvO1xyXG4gICAgICAgIGxldCBodG1sID0gXy5yZXNvbHZlRW5jbG9zZWRWYXIoZm9ybWF0LCAodmFyaWFibGUpID0+IHtcclxuICAgICAgICAgIGlmKHZhcmlhYmxlID09PSBcImxhYmVsXCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGxhYmVsO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICh2YXJpYWJsZSA9PT0gXCJ0b29sdGlwXCIpe1xyXG4gICAgICAgICAgICByZXR1cm4gdG9vbHRpcDtcclxuICAgICAgICAgIH0gZWxzZSBpZiAodmFyaWFibGUgPT09IFwidGl0bGVcIil7XHJcbiAgICAgICAgICAgIHJldHVybiB0aXRsZTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAodmFyaWFibGUgPT09IFwibG9nb1wiKXtcclxuICAgICAgICAgICAgcmV0dXJuIGxvZ287XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgbGV0ICRib2R5ID0gJCgnYm9keScsMCk7XHJcbiAgICAgICAgbGV0ICRkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICRkaXYuaW5uZXJIVE1MID0gaHRtbDtcclxuICAgICAgICAkYm9keS5pbnNlcnRCZWZvcmUoJGRpdiwgJGJvZHkuY2hpbGROb2Rlc1swXSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG5cclxuXy5hZGRMYXlvdXRDU1MgPSAoKSA9PntcclxuXHJcbiAgbW9kZWwuc3Vic2NyaWJlT25jZShbY29uc3RzKCdLRVlfSEVBREVSX0NTUycpXSwgKCkgPT4ge1xyXG4gICAgbGV0IGZvcm1hdCA9IG1vZGVsLmdldChjb25zdHMoJ0tFWV9IRUFERVJfQ1NTJykpO1xyXG5cclxuICAgIGlmKGZvcm1hdCAmJiBmb3JtYXQgIT09IFwiXCIpe1xyXG5cclxuICAgICAgbW9kZWwuc3Vic2NyaWJlT25jZShbY29uc3RzKCdLRVlfSEVBREVSX0xPR09fUEFUSCcpLFxyXG4gICAgICAgIGNvbnN0cygnS0VZX0hFQURFUl9USVRMRV9DT0xPUicpLCBjb25zdHMoJ0tFWV9IRUFERVJfQkFDS0dST1VORF9DT0xPUicpLCBjb25zdHMoJ0tFWV9MQVlPVVRfRk9OVF9GQU1JTFknKV0sICgpID0+IHtcclxuICAgICAgICBsZXQgYmFja2dyb3VuZENvbG9yID0gbW9kZWwuZ2V0KGNvbnN0cygnS0VZX0hFQURFUl9CQUNLR1JPVU5EX0NPTE9SJykpO1xyXG4gICAgICAgIGJhY2tncm91bmRDb2xvciA9IGJhY2tncm91bmRDb2xvciA/IGJhY2tncm91bmRDb2xvciA6IG1vZGVsLmdldChjb25zdHMoJ0tFWV9IRUFERVJfREVGQVVMVF9CQUNLR1JPVU5EX0NPTE9SJykpO1xyXG4gICAgICAgIGxldCBjb2xvciA9IG1vZGVsLmdldChjb25zdHMoJ0tFWV9IRUFERVJfVElUTEVfQ09MT1InKSk7XHJcbiAgICAgICAgY29sb3IgPSBjb2xvciA/IGNvbG9yIDogbW9kZWwuZ2V0KGNvbnN0cygnS0VZX0hFQURFUl9ERUZBVUxUX1RJVExFX0NPTE9SJykpO1xyXG4gICAgICAgIGxldCBmb250RmFtaWx5ID0gbW9kZWwuZ2V0KGNvbnN0cygnS0VZX0xBWU9VVF9GT05UX0ZBTUlMWScpKTtcclxuICAgICAgICBmb250RmFtaWx5ID0gZm9udEZhbWlseSA/IGZvbnRGYW1pbHkgOiBtb2RlbC5nZXQoY29uc3RzKCdLRVlfTEFZT1VUX0RFRkFVTFRfRk9OVF9GQU1JTFknKSk7XHJcbiAgICAgICAgbGV0IGNzcyA9IF8ucmVzb2x2ZUVuY2xvc2VkVmFyKGZvcm1hdCwgKHZhcmlhYmxlKSA9PiB7XHJcbiAgICAgICAgICBpZih2YXJpYWJsZSA9PT0gXCJiYWNrZ3JvdW5kLWNvbG9yXCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGJhY2tncm91bmRDb2xvcjtcclxuICAgICAgICAgIH0gZWxzZSBpZiAodmFyaWFibGUgPT09IFwiY29sb3JcIil7XHJcbiAgICAgICAgICAgIHJldHVybiBjb2xvcjtcclxuICAgICAgICAgIH0gZWxzZSBpZiAodmFyaWFibGUgPT09IFwiZm9udC1mYW1pbHlcIil7XHJcbiAgICAgICAgICAgIHJldHVybiBmb250RmFtaWx5O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGxldCAkc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XHJcbiAgICAgICAgJHN0eWxlLnR5cGUgPSAndGV4dC9jc3MnXHJcbiAgICAgICAgJHN0eWxlLmlubmVySFRNTCA9IGNzcztcclxuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKCRzdHlsZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG5cclxuXy5hZGRQcm9qZWN0RGF0YSA9IChjYWxsYmFjaykgPT4ge1xyXG4gIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgKCgpID0+e30pXHJcbiAgbGV0IHNyYyA9IF8uZ2V0UmVsYXRpdmVUb3BpY1BhdGgoKSArIFwidGVtcGxhdGUvc2NyaXB0cy9wcm9qZWN0ZGF0YS5qc1wiO1xyXG4gIF8ubG9hZFNjcmlwdChzcmMsIG51bGwsIGNhbGxiYWNrKVxyXG59XHJcblxyXG5fLmFkZEdvVG9MYXlvdXQgPSAoKSA9PiB7XHJcbiAgXy5hZGRQcm9qZWN0RGF0YSgpO1xyXG4gIF8uYWRkTGF5b3V0SFRNTCgpO1xyXG4gIF8uYWRkTGF5b3V0Q1NTKCk7XHJcbn07XHJcblxyXG5tb2RlbC5wdWJsaXNoKGNvbnN0cygnS0VZX1NIQVJFRF9JTlBVVCcpLCBbXHJcbiAgY29uc3RzKCdLRVlfUFJPSkVDVF9UQUdfQ09NQklOQVRJT05TJyksXHJcbiAgY29uc3RzKCdLRVlfVEFHX0VYUFJFU1NJT04nKSxcclxuICB7XHJcbiAgICBrZXk6IGNvbnN0cygnRVZUX1NDUk9MTF9UT19UT1AnKSxcclxuICAgIG5lc3RlZDogZmFsc2VcclxuICB9LFxyXG4gIGNvbnN0cygnRVZUX1BSSU5UX1RPUElDJyksXHJcbiAgY29uc3RzKCdLRVlfTUVSR0VEX1BST0pFQ1RfTUFQJyksXHJcbiAgY29uc3RzKCdLRVlfUFJPSkVDVF9MSVNUJyksXHJcbiAgY29uc3RzKCdLRVlfU0hPV19UQUdTJyksXHJcbiAgY29uc3RzKCdLRVlfSUZSQU1FX0VWRU5UUycpLFxyXG4gIGNvbnN0cygnRVZUX1JFTE9BRF9UT1BJQycpLFxyXG4gIGNvbnN0cygnS0VZX01PQklMRV9BUFBfTU9ERScpLFxyXG4gIGNvbnN0cygnS0VZX0hFQURFUl9MT0dPX1BBVEgnKSxcclxuICBjb25zdHMoJ0tFWV9IRUFERVJfVElUTEUnKSxcclxuICBjb25zdHMoJ0tFWV9IRUFERVJfVElUTEVfQ09MT1InKSxcclxuICBjb25zdHMoJ0tFWV9IRUFERVJfQkFDS0dST1VORF9DT0xPUicpLFxyXG4gIGNvbnN0cygnS0VZX0xBWU9VVF9GT05UX0ZBTUlMWScpLFxyXG4gIGNvbnN0cygnS0VZX0hFQURFUl9IVE1MJyksXHJcbiAgY29uc3RzKCdLRVlfSEVBREVSX0NTUycpLFxyXG4gIGNvbnN0cygnS0VZX0hFQURFUl9ERUZBVUxUX0JBQ0tHUk9VTkRfQ09MT1InKSxcclxuICBjb25zdHMoJ0tFWV9IRUFERVJfREVGQVVMVF9USVRMRV9DT0xPUicpLFxyXG4gIGNvbnN0cygnS0VZX0xBWU9VVF9ERUZBVUxUX0ZPTlRfRkFNSUxZJyksXHJcbiAgY29uc3RzKCdLRVlfVE9DX09SREVSJyksXHJcbiAgY29uc3RzKCdFVlRfQ09MTEFQU0VfQUxMJyksXHJcbiAgY29uc3RzKCdFVlRfRVhQQU5EX0FMTCcpLFxyXG4gIGNvbnN0cygnS0VZX1NFQVJDSF9ISUdITElHSFRfQ09MT1InKSxcclxuICBjb25zdHMoJ0tFWV9TRUFSQ0hfQkdfQ09MT1InKSxcclxuICBjb25zdHMoJ0VWVF9SRU1PVkVfSElHSExJR0hUJylcclxuXSk7XHJcblxyXG5tb2RlbC5wdWJsaXNoKGNvbnN0cygnS0VZX1NIQVJFRF9PVVRQVVQnKSwgW1xyXG4gIGNvbnN0cygnS0VZX1RPUElDX1VSTCcpLFxyXG4gIGNvbnN0cygnS0VZX1RPUElDX0lEJyksXHJcbiAgY29uc3RzKCdLRVlfVE9QSUNfVElUTEUnKSxcclxuICBjb25zdHMoJ0tFWV9UT1BJQ19CUlNNQVAnKSxcclxuICBjb25zdHMoJ1NIT1dfTU9EQUwnKSxcclxuICBjb25zdHMoJ0VWVF9OQVZJR0FURV9UT19VUkwnKSxcclxuICBjb25zdHMoJ0VWVF9DTElDS19JTlNJREVfSUZSQU1FJyksXHJcbiAgY29uc3RzKCdFVlRfU0NST0xMX0lOU0lERV9JRlJBTUUnKSxcclxuICBjb25zdHMoJ0VWVF9JTlNJREVfSUZSQU1FX0RPTV9DT05URU5UTE9BREVEJyksXHJcbiAgY29uc3RzKCdLRVlfVE9QSUNfSEVJR0hUJyksXHJcbiAgY29uc3RzKCdFVlRfVE9QSUNfV0lER0VUX0xPQURFRCcpXSk7XHJcblxyXG5yaC5pZnJhbWUuaW5pdCgpO1xyXG5cclxuRXZlbnRIYW5kbGVycyA9ICgoKCkgPT4ge1xyXG4gIGxldCBsYXN0U2Nyb2xsVG9wLCBwdWJsaXNoU2Nyb2xsSW5mbztcclxuXHJcbiAgY2xhc3MgRXZlbnRIYW5kbGVycyB7XHJcbiAgICBoYW5kbGVfY2xpY2soZXZlbnQpIHtcclxuICAgICAgaWYgKCFldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XHJcbiAgICAgICAgbW9kZWwucHVibGlzaChjb25zdHMoJ0VWVF9DTElDS19JTlNJREVfSUZSQU1FJyksIG51bGwpO1xyXG4gICAgICAgIHJldHVybiBfLmhvb2tDbGljayhldmVudCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBoYW5kbGVfc2Nyb2xsKCkge1xyXG4gICAgICBsZXQgY3VyU2Nyb2xsVG9wLCBkaXI7XHJcbiAgICAgIGN1clNjcm9sbFRvcCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wO1xyXG4gICAgICBpZiAoY3VyU2Nyb2xsVG9wID4gbGFzdFNjcm9sbFRvcCkge1xyXG4gICAgICAgIGRpciA9ICdkb3duJztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBkaXIgPSAndXAnO1xyXG4gICAgICB9XHJcbiAgICAgIGxhc3RTY3JvbGxUb3AgPSBjdXJTY3JvbGxUb3A7XHJcbiAgICAgIHJldHVybiBwdWJsaXNoU2Nyb2xsSW5mbyhkaXIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbGFzdFNjcm9sbFRvcCA9IC0xO1xyXG5cclxuICBwdWJsaXNoU2Nyb2xsSW5mbyA9IF8udGhyb3R0bGUoZGlyID0+IHtcclxuICAgIGxldCBib2R5LCBpbmZvO1xyXG4gICAgYm9keSA9IGRvY3VtZW50LmJvZHk7XHJcbiAgICBpbmZvID0ge1xyXG4gICAgICBzY3JvbGxUb3A6IGJvZHkuc2Nyb2xsVG9wLFxyXG4gICAgICBzY3JvbGxIZWlnaHQ6IGJvZHkuc2Nyb2xsSGVpZ2h0LFxyXG4gICAgICBkaXJcclxuICAgIH07XHJcbiAgICByZXR1cm4gbW9kZWwucHVibGlzaChjb25zdHMoJ0VWVF9TQ1JPTExfSU5TSURFX0lGUkFNRScpLCBpbmZvKTtcclxuICB9LCAyMDApO1xyXG5cclxuICByZXR1cm4gRXZlbnRIYW5kbGVycztcclxufSkpKCk7XHJcblxyXG5lSGFuZGxlcnMgPSBuZXcgRXZlbnRIYW5kbGVycygpO1xyXG5cclxucmVnaXN0ZXJlZEV2ZW50cyA9IHt9O1xyXG5cclxubW9kZWwuc3Vic2NyaWJlKGNvbnN0cygnRVZUX1dJREdFVF9MT0FERUQnKSwgXy5vbmUoKCkgPT4ge1xyXG4gIG1vZGVsLnN1YnNjcmliZShjb25zdHMoJ0tFWV9JRlJBTUVfRVZFTlRTJyksIG9iaiA9PiB7XHJcbiAgICBpZiAob2JqID09PSBudWxsKSB7XHJcbiAgICAgIG9iaiA9IHt9O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF8uZWFjaChbJ2NsaWNrJywgJ3Njcm9sbCddLCBlTmFtZSA9PiB7XHJcbiAgICAgIGlmIChvYmpbZU5hbWVdKSB7XHJcbiAgICAgICAgXy5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCBlTmFtZSwgZUhhbmRsZXJzW2BoYW5kbGVfJHtlTmFtZX1gXSk7XHJcbiAgICAgICAgcmVnaXN0ZXJlZEV2ZW50c1tlTmFtZV0gPSB0cnVlO1xyXG4gICAgICB9IGVsc2UgaWYgKHJlZ2lzdGVyZWRFdmVudHNbZU5hbWVdKSB7XHJcbiAgICAgICAgXy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCBlTmFtZSwgZUhhbmRsZXJzW2BoYW5kbGVfJHtlTmFtZX1gXSk7XHJcbiAgICAgICAgcmVnaXN0ZXJlZEV2ZW50c1tlTmFtZV0gPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIF8uZGVsYXkoKCkgPT4gbW9kZWwucHVibGlzaChjb25zdHMoJ0tFWV9UT1BJQ19IRUlHSFQnKSwgJC5wYWdlSGVpZ2h0KCkpLCAxMDApO1xyXG59KSk7XHJcblxyXG5tb2RlbC5zdWJzY3JpYmVPbmNlKFtyaC5jb25zdHMoJ0tFWV9UT0NfT1JERVInKSwgcmguY29uc3RzKCdFVlRfUFJPSkVDVF9MT0FERUQnKV0sICgpID0+IHtcclxuICBsZXQgb3JkZXJEYXRhID0gcmgubW9kZWwuZ2V0KHJoLmNvbnN0cygnS0VZX1RPQ19PUkRFUicpKVxyXG4gIGxldCB1cmwgPSByaC5fLnBhcmVudFBhdGgocmguXy5maWxlUGF0aCgpLnN1YnN0cmluZyhyaC5fLmdldEhvc3RGb2xkZXIoKS5sZW5ndGgpKVxyXG4gIHVybCA9ICh1cmwubGVuZ3RoICYmIHVybFt1cmwubGVuZ3RoLTFdID09PSAnLycpID8gdXJsLnN1YnN0cmluZygwLCB1cmwubGVuZ3RoLTEpIDogdXJsXHJcbiAgd2hpbGUob3JkZXJEYXRhW3VybF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgdXJsID0gIHVybC5zdWJzdHJpbmcoMCwgdXJsLmxhc3RJbmRleE9mKCcvJykpXHJcbiAgfVxyXG4gIGxldCBvcmRlciA9IHVybCAmJiBvcmRlckRhdGFbdXJsXS5vcmRlclxyXG4gIHJoLm1vZGVsLnB1Ymxpc2gocmguY29uc3RzKCdLRVlfVE9DX0NISUxEX09SREVSJyksIG9yZGVyKVxyXG59KTtcclxuXHJcbm1vZGVsLnN1YnNjcmliZShjb25zdHMoJ0VWVF9SRUxPQURfVE9QSUMnKSwgKCkgPT4gZG9jdW1lbnQubG9jYXRpb24ucmVsb2FkKCkpO1xyXG5cclxubW9kZWwuc3Vic2NyaWJlT25jZShbY29uc3RzKCdFVlRfV0lORE9XX0xPQURFRCcpLCBjb25zdHMoJ0tFWV9UQUdfRVhQUkVTU0lPTicpLCBjb25zdHMoJ0tFWV9UT1BJQ19PUklHSU4nKV0sXHJcbiAgKCkgPT4gXy5kZWZlcigoKSA9PiB7XHJcbiAgICBsZXQgYm9va21hcmsgPSBkb2N1bWVudC5sb2NhdGlvbi5oYXNoO1xyXG4gICAgaWYgKGJvb2ttYXJrICE9PSB1bmRlZmluZWQgJiYgYm9va21hcmsgIT09IFwiXCIgJiYgYm9va21hcmsgIT09IFwiI1wiKXtcclxuICAgICAgbGV0IGJvb2ttYXJrX25hbWUgPSBib29rbWFyay5zdWJzdHJpbmcoMSk7XHJcbiAgICAgIGxldCAkZWxlbWVudHMgPSAocmguJChib29rbWFyaytcIixhW25hbWU9XCIgKyBib29rbWFya19uYW1lICtcIl1cIikpO1xyXG4gICAgICBpZigkZWxlbWVudHMubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgJGVsZW1lbnRzWzBdLnNjcm9sbEludG9WaWV3KHRydWUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSlcclxuKTtcclxuXHJcbm1vZGVsLnN1YnNjcmliZShjb25zdHMoJ0tFWV9UT1BJQ19IRUlHSFQnKSwgKCkgPT4ge1xyXG4gIF8uZGVsYXkoKCkgPT4ge1xyXG4gICAgbW9kZWwucHVibGlzaChjb25zdHMoJ0VWVF9XSU5ET1dfTE9BREVEJyksIG51bGwpXHJcbiAgfSwgMTAwMClcclxuXHJcbn0pO1xyXG5cclxuXy5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnRE9NQ29udGVudExvYWRlZCcsICgpID0+IG1vZGVsLnB1Ymxpc2goY29uc3RzKCdFVlRfSU5TSURFX0lGUkFNRV9ET01fQ09OVEVOVExPQURFRCcpLCBudWxsKSk7XHJcblxyXG5fLmFkZEV2ZW50TGlzdGVuZXIod2luZG93LCAncmVzaXplJywgKCgoKSA9PiB7XHJcbiAgbGV0IHRyaWdnZXJlZEJ5TWU7XHJcbiAgdHJpZ2dlcmVkQnlNZSA9IGZhbHNlO1xyXG4gIHJldHVybiBfLmRlYm91bmNlKCgpID0+IHtcclxuICAgIGxldCBoZWlnaHQ7XHJcbiAgICBpZiAodHJpZ2dlcmVkQnlNZSkge1xyXG4gICAgICB0cmlnZ2VyZWRCeU1lID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiB0cmlnZ2VyZWRCeU1lO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGVpZ2h0ID0gJC5wYWdlSGVpZ2h0KCk7XHJcbiAgICAgIGlmIChoZWlnaHQgIT09IG1vZGVsLmdldChjb25zdHMoJ0tFWV9UT1BJQ19IRUlHSFQnKSkpIHtcclxuICAgICAgICB0cmlnZ2VyZWRCeU1lID0gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gbW9kZWwucHVibGlzaChjb25zdHMoJ0tFWV9UT1BJQ19IRUlHSFQnKSwgJC5wYWdlSGVpZ2h0KCkpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSwgMjUwKTtcclxufSkpKCkpO1xyXG4iLCJsZXQgcmggPSByZXF1aXJlKFwiLi4vLi4vLi4vbGliL3JoXCIpLFxyXG4gICQgPSByaC4kLFxyXG4gIF8gPSByaC5fXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBEcm9wZG93blRleHQgZXh0ZW5kcyByaC5XaWRnZXQge1xyXG4gIGNvbnN0cnVjdG9yKGNvbmZpZykge1xyXG4gICAgc3VwZXIoY29uZmlnKVxyXG4gICAgdGhpcy5jb250ZW50Q2xhc3MgPSAnZHJvcGRvd24tY29udGVudCdcclxuICAgIHRoaXMudGl0bGVDbGFzcyA9ICdkcm9wZG93bi10aXRsZSdcclxuICAgIHRoaXMuaW5pdE5vZGVzKClcclxuICB9XHJcblxyXG4gIGluaXROb2RlcygpIHtcclxuICAgIGxldCBjb250ZW50Tm9kZXMgPSBbXVxyXG4gICAgJC5lYWNoQ2hpbGROb2RlKHRoaXMubm9kZSwgY2hpbGQgPT4ge1xyXG4gICAgICBpZigkLmhhc0NsYXNzKGNoaWxkLCB0aGlzLmNvbnRlbnRDbGFzcykpIHtcclxuICAgICAgICBjb250ZW50Tm9kZXMucHVzaChjaGlsZClcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIGxldCBub2RlSG9sZGVyID0gbmV3IHJoLk5vZGVIb2xkZXIoY29udGVudE5vZGVzKVxyXG4gICAgbm9kZUhvbGRlci5oaWRlKClcclxuICAgICQuZWFjaENoaWxkTm9kZSh0aGlzLm5vZGUsIGNoaWxkID0+IHtcclxuICAgICAgaWYoJC5oYXNDbGFzcyhjaGlsZCwgdGhpcy50aXRsZUNsYXNzKSkge1xyXG4gICAgICAgIF8uYWRkRXZlbnRMaXN0ZW5lcihjaGlsZCwgJ2NsaWNrJywgZXZ0ID0+IHtcclxuICAgICAgICAgIGlmKCFldnQuZGVmYXVsdFByZXZlbnRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZVN0YXRlKG5vZGVIb2xkZXIpXHJcbiAgICAgICAgICAgIHJldHVybiBfLnByZXZlbnREZWZhdWx0KGV2dClcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIHJoLm1vZGVsLmNzdWJzY3JpYmUoJ0VWVF9DT0xMQVBTRV9BTEwnLCAoKSA9PiB7XHJcbiAgICAgIHRoaXMuaGlkZShub2RlSG9sZGVyKVxyXG4gICAgfSlcclxuXHJcbiAgICByaC5tb2RlbC5jc3Vic2NyaWJlKCdFVlRfRVhQQU5EX0FMTCcsICgpID0+IHtcclxuICAgICAgdGhpcy5zaG93KG5vZGVIb2xkZXIpXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgaGlkZShub2RlSG9sZGVyKSB7XHJcbiAgICAkLnJlbW92ZUNsYXNzKHRoaXMubm9kZSwgJ2V4cGFuZGVkJylcclxuICAgIG5vZGVIb2xkZXIuaGlkZSgpXHJcbiAgfVxyXG5cclxuICBzaG93KG5vZGVIb2xkZXIpIHtcclxuICAgIGlmKCEkLmhhc0NsYXNzKHRoaXMubm9kZSwgJ2V4cGFuZGVkJykpIHtcclxuICAgICAgJC5hZGRDbGFzcyh0aGlzLm5vZGUsICdleHBhbmRlZCcpXHJcbiAgICB9XHJcbiAgICBub2RlSG9sZGVyLnNob3coKVxyXG4gIH1cclxuXHJcbiAgdG9nZ2xlU3RhdGUobm9kZUhvbGRlcikge1xyXG4gICAgaWYoJC5oYXNDbGFzcyh0aGlzLm5vZGUsICdleHBhbmRlZCcpKSB7XHJcbiAgICAgIHRoaXMuaGlkZShub2RlSG9sZGVyKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zaG93KG5vZGVIb2xkZXIpXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5yaC53aWRnZXRzLkRyb3Bkb3duVGV4dCA9IERyb3Bkb3duVGV4dFxyXG4iLCJpbXBvcnQgcmggZnJvbSAnLi4vLi4vLi4vbGliL3JoJ1xyXG5pbXBvcnQgRHJvcGRvd25UZXh0IGZyb20gJy4vZHJvcGRvd25fdGV4dCdcclxuXHJcbmNsYXNzIEV4cGFuZGluZ1RleHQgZXh0ZW5kcyBEcm9wZG93blRleHQge1xyXG4gIGluaXROb2RlcygpIHtcclxuICAgIHRoaXMuY29udGVudENsYXNzID0gJ2V4cGFuZGluZy1jb250ZW50J1xyXG4gICAgdGhpcy50aXRsZUNsYXNzID0gJ2V4cGFuZGluZy10aXRsZSdcclxuICAgIHN1cGVyLmluaXROb2RlcygpXHJcbiAgfVxyXG59XHJcblxyXG5yaC53aWRnZXRzLkV4cGFuZGluZ1RleHQgPSBFeHBhbmRpbmdUZXh0XHJcbiIsImxldCByaCA9IHJlcXVpcmUoXCIuLi8uLi8uLi9saWIvcmhcIiksXHJcbiAgbm9kZVV0aWxzID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL25vZGVfdXRpbHNcIiksXHJcbiAgJCA9IHJoLiQsXHJcbiAgXyA9IHJoLl8sXHJcbiAgaW5zdGFuY2VDb3VudCA9IDBcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEh5cGVybGlua1BvcG92ZXIgZXh0ZW5kcyByaC5XaWRnZXQge1xyXG4gIGNvbnN0cnVjdG9yKGNvbmZpZykge1xyXG4gICAgc3VwZXIoY29uZmlnKVxyXG4gICAgaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlQ291bnQgKyAxXHJcbiAgICBfLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5ub2RlLCAnY2xpY2snLCBldnQgPT4ge1xyXG4gICAgICB0aGlzLnNob3dQb3BvdmVyKClcclxuICAgICAgcmV0dXJuIF8ucHJldmVudERlZmF1bHQoZXZ0KVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIGdldCBoeXBlcmxpbmsoKSB7XHJcbiAgICByZXR1cm4gJC5nZXRBdHRyaWJ1dGUodGhpcy5ub2RlLCAnaHJlZicpXHJcbiAgfVxyXG5cclxuICBnZXQgaWZyYW1lSUQoKSB7XHJcbiAgICByZXR1cm4gYFJoUG9wb3ZlcklmcmFtZSR7aW5zdGFuY2VDb3VudH1gXHJcbiAgfVxyXG5cclxuICBjcmVhdGVQb3B1cE5vZGUoKSB7XHJcbiAgICBsZXQgbm9kZSA9ICQuY3JlYXRlRWxlbWVudCgnZGl2JylcclxuICAgICQuYWRkQ2xhc3Mobm9kZSwgJ3JoLXBvcG92ZXInKVxyXG4gICAgJC5kYXRhc2V0KG5vZGUsICdoZWlnaHQnLCAkLmRhdGFzZXQodGhpcy5ub2RlLCAnaGVpZ2h0JykpXHJcbiAgICAkLmRhdGFzZXQobm9kZSwgJ3dpZHRoJywgJC5kYXRhc2V0KHRoaXMubm9kZSwgJ3dpZHRoJykpXHJcbiAgICAkLmRhdGFzZXQobm9kZSwgJ3BsYWNlbWVudCcsICQuZGF0YXNldCh0aGlzLm5vZGUsICdwbGFjZW1lbnQnKSlcclxuXHJcbiAgICBub2RlLmlubmVySFRNTCA9IGA8ZGl2IGNsYXNzPVwicmgtcG9wb3Zlci1jb250ZW50XCI+XHJcbiAgICAgIDxpZnJhbWUgY2xhc3M9XCJwb3BvdmVyLXRvcGljXCIgaWQ9XCIke3RoaXMuaWZyYW1lSUR9XCIgc3JjPVwiJHt0aGlzLmh5cGVybGlua31cIiBmcmFtZWJvcmRlcj1cIjBcIiBzY3JvbGxpbmc9XCJhdXRvXCJcclxuICAgICAgb25sb2FkPVwicmguXy5yZXNldElmcmFtZVNpemUoJyMke3RoaXMuaWZyYW1lSUR9JylcIiA+PC9pZnJhbWU+XHJcbiAgICA8L2Rpdj5gXHJcbiAgICByZXR1cm4gbm9kZVxyXG4gIH1cclxuXHJcbiAgc2hvd1BvcG92ZXIoKSB7XHJcbiAgICBsZXQgbm9kZSA9IHRoaXMuY3JlYXRlUG9wdXBOb2RlKClcclxuICAgIG5vZGVVdGlscy5hcHBlbmRDaGlsZChkb2N1bWVudC5ib2R5LCBub2RlKTtcclxuICAgIHRoaXMucG9wb3ZlcldpZGdldCA9IG5ldyByaC53aWRnZXRzLlBvcG92ZXIoe25vZGU6IG5vZGV9KVxyXG4gICAgdGhpcy5wb3BvdmVyV2lkZ2V0LmluaXQoKVxyXG4gICAgdGhpcy5wb3BvdmVyV2lkZ2V0LmluaXRQb3NpdGlvbih0aGlzLm5vZGUpXHJcbiAgfVxyXG59XHJcblxyXG5yaC53aWRnZXRzLkh5cGVybGlua1BvcG92ZXIgPSBIeXBlcmxpbmtQb3BvdmVyXHJcbiIsImxldCByaCA9IHJlcXVpcmUoXCIuLi8uLi8uLi9saWIvcmhcIiksXHJcbiAgbm9kZVV0aWxzID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL25vZGVfdXRpbHNcIiksXHJcbiAgcGFnZVV0aWwgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvcGFnZV91dGlsc1wiKSxcclxuICBfID0gcmguXyxcclxuICAkID0gcmguJFxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUG9wb3ZlciBleHRlbmRzIHJoLldpZGdldCB7XHJcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XHJcbiAgICBzdXBlcihjb25maWcpXHJcbiAgICB0aGlzLnBsYWNlbWVudCA9ICQuZGF0YXNldCh0aGlzLm5vZGUsICdwbGFjZW1lbnQnKVxyXG4gICAgdGhpcy5oZWlnaHQgPSBfLnBhcnNlSW50KCQuZGF0YXNldCh0aGlzLm5vZGUsICdoZWlnaHQnKSwgMzAwKVxyXG4gICAgdGhpcy53aWR0aCA9IF8ucGFyc2VJbnQoJC5kYXRhc2V0KHRoaXMubm9kZSwgJ3dpZHRoJyksIDQwMClcclxuXHJcbiAgICBfLmRlbGF5KCgpID0+IHtcclxuICAgICAgdGhpcy5oYW5kbGVDbGljayA9IGV2dCA9PiB0aGlzLl9oYW5kbGVDbGljayhldnQpXHJcbiAgICAgIF8uYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ2NsaWNrJywgdGhpcy5oYW5kbGVDbGljaylcclxuICAgIH0sIDI1MClcclxuICB9XHJcblxyXG4gIGRlc3RydWN0KCkge1xyXG4gICAgXy5yZW1vdmVFdmVudExpc3RlbmVyKGRvY3VtZW50LCAnY2xpY2snLCB0aGlzLmhhbmRsZUNsaWNrKVxyXG4gICAgc3VwZXIuZGVzdHJ1Y3QoKVxyXG4gICAgbm9kZVV0aWxzLnJlbW92ZUNoaWxkKHRoaXMubm9kZSlcclxuICB9XHJcblxyXG4gIGluaXRQb3NpdGlvbih0YXJnZXQpIHtcclxuICAgIGxldCByZWN0ID0gdGFyZ2V0ICYmIHRhcmdldC5nZXRDbGllbnRSZWN0cygpWzBdXHJcbiAgICBpZihyZWN0KSB7XHJcbiAgICAgIHRoaXMuc2V0UG9zaXRpb24ocmVjdClcclxuICAgICAgaWYodGhpcy5oZWlnaHQpIHtcclxuICAgICAgICB0aGlzLm5vZGUuc3R5bGUuaGVpZ2h0ID0gdGhpcy5oZWlnaHRcclxuICAgICAgfVxyXG4gICAgICBpZih0aGlzLndpZHRoKSB7XHJcbiAgICAgICAgdGhpcy5ub2RlLnN0eWxlLndpZHRoID0gdGhpcy53aWR0aFxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRQb3NpdGlvbihyZWN0KSB7XHJcbiAgICBsZXQgcGFnZUhlaWdodCA9IHBhZ2VVdGlsLmlubmVySGVpZ2h0KCksIHBhZ2VXaWR0aCA9IHBhZ2VVdGlsLmlubmVyV2lkdGgoKVxyXG4gICAgaWYodGhpcy5wbGFjZW1lbnQgPT09ICd0b3AnKSB7XHJcbiAgICAgIHRoaXMuc2hvd1RvcChyZWN0LCBwYWdlSGVpZ2h0KVxyXG4gICAgICB0aGlzLnNldEF1dG9Ib3Jpem9udGFsUG9zaXRpb24ocmVjdCwgcGFnZVdpZHRoKVxyXG4gICAgfSBlbHNlIGlmKHRoaXMucGxhY2VtZW50ID09PSAnYm90dG9tJykge1xyXG4gICAgICB0aGlzLnNob3dCb3R0b20ocmVjdClcclxuICAgICAgdGhpcy5zZXRBdXRvSG9yaXpvbnRhbFBvc2l0aW9uKHJlY3QsIHBhZ2VXaWR0aClcclxuICAgIH0gZWxzZSBpZih0aGlzLnBsYWNlbWVudCA9PT0gJ2xlZnQnKSB7XHJcbiAgICAgIHRoaXMuc2V0QXV0b1ZlcnRpY2FsUG9zaXRpb24ocmVjdCwgcGFnZUhlaWdodClcclxuICAgICAgdGhpcy5zaG93TGVmdChyZWN0LCBwYWdlV2lkdGgpXHJcbiAgICB9IGVsc2UgaWYodGhpcy5wbGFjZW1lbnQgPT09ICdyaWdodCcpIHtcclxuICAgICAgdGhpcy5zZXRBdXRvVmVydGljYWxQb3NpdGlvbihyZWN0LCBwYWdlSGVpZ2h0KVxyXG4gICAgICB0aGlzLnNob3dSaWdodChyZWN0KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5zZXRBdXRvSG9yaXpvbnRhbFBvc2l0aW9uKHJlY3QsIHBhZ2VXaWR0aClcclxuICAgICAgdGhpcy5zZXRBdXRvVmVydGljYWxQb3NpdGlvbihyZWN0LCBwYWdlSGVpZ2h0KVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY2FuU2hvd1RvcChyZWN0KSB7XHJcbiAgICByZXR1cm4gKHJlY3QudG9wIC0gdGhpcy5oZWlnaHQpID4gMFxyXG4gIH1cclxuXHJcbiAgY2FuU2hvd0JvdHRvbShyZWN0LCBwYWdlSGVpZ2h0KSB7XHJcbiAgICByZXR1cm4gKHBhZ2VIZWlnaHQgLSByZWN0LmJvdHRvbSAtIHRoaXMuaGVpZ2h0KSA+IDBcclxuICB9XHJcblxyXG4gIGNhblNob3dMZWZ0KHJlY3QpIHtcclxuICAgIHJldHVybiAocmVjdC5sZWZ0IC0gdGhpcy53aWR0aCkgPiAwXHJcbiAgfVxyXG5cclxuICBjYW5TaG93UmlnaHQocmVjdCwgcGFnZVdpZHRoKSB7XHJcbiAgICByZXR1cm4gKHBhZ2VXaWR0aCAtIHJlY3QucmlnaHQgLSB0aGlzLndpZHRoKSA+IDBcclxuICB9XHJcblxyXG4gIHNob3dUb3AocmVjdCwgcGFnZUhlaWdodCkge1xyXG4gICAgdGhpcy5ub2RlLnN0eWxlLmJvdHRvbSA9IHBhZ2VIZWlnaHQgLSByZWN0LnRvcCArIDJcclxuICB9XHJcblxyXG4gIHNob3dCb3R0b20ocmVjdCkge1xyXG4gICAgdGhpcy5ub2RlLnN0eWxlLnRvcCA9IHJlY3QuYm90dG9tXHJcbiAgfVxyXG5cclxuICBzaG93UmlnaHQocmVjdCkge1xyXG4gICAgdGhpcy5ub2RlLnN0eWxlLmxlZnQgPSByZWN0LnJpZ2h0ICsgMlxyXG4gIH1cclxuXHJcbiAgc2hvd0xlZnQocmVjdCwgcGFnZVdpZHRoKSB7XHJcbiAgICB0aGlzLm5vZGUuc3R5bGUucmlnaHQgPSBwYWdlV2lkdGggLSByZWN0LmxlZnQgKyAyXHJcbiAgfVxyXG5cclxuICBzZXRBdXRvSG9yaXpvbnRhbFBvc2l0aW9uKHJlY3QsIHBhZ2VXaWR0aCkge1xyXG4gICAgaWYodGhpcy5jYW5TaG93UmlnaHQocmVjdCwgcGFnZVdpZHRoKSkge1xyXG4gICAgICB0aGlzLnNob3dSaWdodChyZWN0KVxyXG4gICAgfSBlbHNlIGlmKHRoaXMuY2FuU2hvd0xlZnQocmVjdCkpIHtcclxuICAgICAgdGhpcy5zaG93TGVmdChyZWN0LCBwYWdlV2lkdGgpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm5vZGUuc3R5bGUubGVmdCA9IHBhZ2VXaWR0aCAtIHRoaXMud2lkdGggKyAyXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBzZXRBdXRvVmVydGljYWxQb3NpdGlvbihyZWN0LCBwYWdlSGVpZ2h0KSB7XHJcbiAgICBpZih0aGlzLmNhblNob3dCb3R0b20ocmVjdCwgcGFnZUhlaWdodCkpIHtcclxuICAgICAgdGhpcy5zaG93Qm90dG9tKHJlY3QpXHJcbiAgICB9IGVsc2UgaWYodGhpcy5jYW5TaG93VG9wKHJlY3QpKSB7XHJcbiAgICAgIHRoaXMuc2hvd1RvcChyZWN0LCBwYWdlSGVpZ2h0KVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5ub2RlLnN0eWxlLnRvcCA9IHBhZ2VIZWlnaHQgLSB0aGlzLmhlaWdodCArIDJcclxuICAgIH1cclxuICB9XHJcblxyXG4gIF9oYW5kbGVDbGljayhldnQpIHtcclxuICAgIHRoaXMuZGVzdHJ1Y3QoKVxyXG4gICAgcmV0dXJuIF8ucHJldmVudERlZmF1bHQoZXZ0KVxyXG4gIH1cclxufVxyXG5cclxucmgud2lkZ2V0cy5Qb3BvdmVyID0gUG9wb3ZlclxyXG4iLCJsZXQgcmggPSByZXF1aXJlKFwiLi4vLi4vLi4vbGliL3JoXCIpLFxyXG4gIG5vZGVVdGlscyA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9ub2RlX3V0aWxzXCIpLFxyXG4gICQgPSByaC4kLFxyXG4gIF8gPSByaC5fLFxyXG4gIGluc3RhbmNlQ291bnQgPSAwXHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXh0UG9wT3ZlciBleHRlbmRzIHJoLldpZGdldCB7XHJcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XHJcbiAgICBzdXBlcihjb25maWcpXHJcbiAgICBpbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VDb3VudCArIDFcclxuICAgIF8uYWRkRXZlbnRMaXN0ZW5lcih0aGlzLm5vZGUsICdjbGljaycsIGV2dCA9PiB7XHJcbiAgICAgIHRoaXMuc2hvd1BvcG92ZXIoKVxyXG4gICAgICByZXR1cm4gXy5wcmV2ZW50RGVmYXVsdChldnQpXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgZ2V0IHRleHQoKSB7XHJcbiAgICByZXR1cm4gJC5kYXRhc2V0KHRoaXMubm9kZSwgJ3BvcG92ZXJ0ZXh0JylcclxuICB9XHJcblxyXG4gIGdldCBjb250ZW50SUQoKSB7XHJcbiAgICByZXR1cm4gYFJoLXRleHRQb3BPdmVyJHtpbnN0YW5jZUNvdW50fWBcclxuICB9XHJcblxyXG4gIGNyZWF0ZVBvcHVwTm9kZSgpIHtcclxuICAgIGxldCBub2RlID0gJC5jcmVhdGVFbGVtZW50KCdkaXYnKVxyXG4gICAgJC5hZGRDbGFzcyhub2RlLCAncmgtcG9wb3ZlcicpXHJcbiAgICAkLmRhdGFzZXQobm9kZSwgJ2hlaWdodCcsICQuZGF0YXNldCh0aGlzLm5vZGUsICdoZWlnaHQnKSlcclxuICAgICQuZGF0YXNldChub2RlLCAnd2lkdGgnLCAkLmRhdGFzZXQodGhpcy5ub2RlLCAnd2lkdGgnKSlcclxuICAgICQuZGF0YXNldChub2RlLCAncGxhY2VtZW50JywgJC5kYXRhc2V0KHRoaXMubm9kZSwgJ3BsYWNlbWVudCcpKVxyXG5cclxuICAgIG5vZGUuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCJyaC1wb3BvdmVyLWNvbnRlbnRcIj5cclxuICAgICAgPGRpdiBjbGFzcz1cInBvcG92ZXItdGV4dFwiIGlkPVwiJHt0aGlzLmNvbnRlbnRJRH1cIj4ke3RoaXMudGV4dH08L2Rpdj5cclxuICAgIDwvZGl2PmBcclxuICAgIHJldHVybiBub2RlXHJcbiAgfVxyXG5cclxuICBzaG93UG9wb3ZlcigpIHtcclxuICAgIGxldCBub2RlID0gdGhpcy5jcmVhdGVQb3B1cE5vZGUoKVxyXG4gICAgbm9kZVV0aWxzLmFwcGVuZENoaWxkKGRvY3VtZW50LmJvZHksIG5vZGUpO1xyXG4gICAgdGhpcy5wb3BvdmVyV2lkZ2V0ID0gbmV3IHJoLndpZGdldHMuUG9wb3Zlcih7bm9kZTogbm9kZX0pXHJcbiAgICB0aGlzLnBvcG92ZXJXaWRnZXQuaW5pdCgpXHJcbiAgICB0aGlzLnBvcG92ZXJXaWRnZXQuaW5pdFBvc2l0aW9uKHRoaXMubm9kZSlcclxuICB9XHJcbn1cclxuXHJcbnJoLndpZGdldHMuVGV4dFBvcE92ZXIgPSBUZXh0UG9wT3ZlclxyXG5cclxuLyo8YSBkYXRhLXJod2lkZ2V0PVwiVGV4dFBvcE92ZXJcIiBkYXRhLXBvcG92ZXJ0ZXh0PVwidGhpcyBpcyBkZWZpbml0aW9uXCIgaHJlZj1cIiNcIj4gdGVybSA8L2E+ICovIiwibGV0IHJoID0gcmVxdWlyZShcIi4uLy4uLy4uL2xpYi9yaFwiKSxcclxuICAkID0gcmguJCxcclxuICBfID0gcmguX1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVHJpZ2dlciBleHRlbmRzIHJoLldpZGdldCB7XHJcbiAgY29uc3RydWN0b3IoY29uZmlnKSB7XHJcbiAgICBzdXBlcihjb25maWcpXHJcbiAgICB0aGlzLmluaXRUYXJnZXRzKClcclxuICB9XHJcblxyXG4gIGdldFRhcmdldE5vZGVzKCkge1xyXG4gICAgbGV0IHRhcmdldE5hbWVzID0gXy5zcGxpdEFuZFRyaW0oJC5kYXRhc2V0KHRoaXMubm9kZSwgJ3RhcmdldCcpLCAnICcpXHJcbiAgICBsZXQgdGFyZ2V0Tm9kZXMgPSBbXVxyXG4gICAgXy5lYWNoKHRhcmdldE5hbWVzLCB0YXJnZXROYW1lID0+IHtcclxuICAgICAgbGV0IG5vZGVzID0gJC5maW5kKGRvY3VtZW50LCBgW2RhdGEtdGFyZ2V0bmFtZT1cIiR7dGFyZ2V0TmFtZX1cIl1gKVxyXG4gICAgICBfLmVhY2gobm9kZXMsIG5vZGUgPT4ge1xyXG4gICAgICAgIHRhcmdldE5vZGVzLnB1c2gobm9kZSlcclxuICAgICAgfSlcclxuICAgIH0pXHJcbiAgICByZXR1cm4gdGFyZ2V0Tm9kZXNcclxuICB9XHJcblxyXG4gIGluaXRUYXJnZXRzKCkgIHtcclxuICAgIGxldCB0YXJnZXROb2RlcyA9IHRoaXMuZ2V0VGFyZ2V0Tm9kZXMoKVxyXG4gICAgXy5lYWNoKHRhcmdldE5vZGVzLCBub2RlID0+IHtcclxuICAgICAgaWYoISQuZGF0YXNldChub2RlLCAndGFyZ2V0c2V0JykpIHtcclxuICAgICAgICAkLmRhdGFzZXQobm9kZSwgJ3RhcmdldHNldCcsIHRydWUpXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICBsZXQgbm9kZUhvbGRlciA9IG5ldyByaC5Ob2RlSG9sZGVyKHRhcmdldE5vZGVzKVxyXG4gICAgbm9kZUhvbGRlci5oaWRlKClcclxuICAgIF8uYWRkRXZlbnRMaXN0ZW5lcih0aGlzLm5vZGUsICdjbGljaycsIGV2dCA9PiB7XHJcbiAgICAgIGlmKCFldnQuZGVmYXVsdFByZXZlbnRlZCkge1xyXG4gICAgICAgIHRoaXMudG9nZ2xlU3RhdGUobm9kZUhvbGRlcilcclxuICAgICAgICByZXR1cm4gXy5wcmV2ZW50RGVmYXVsdChldnQpXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICByaC5tb2RlbC5jc3Vic2NyaWJlKCdFVlRfQ09MTEFQU0VfQUxMJywgKCkgPT4ge1xyXG4gICAgICB0aGlzLmhpZGUobm9kZUhvbGRlcilcclxuICAgIH0pXHJcblxyXG4gICAgcmgubW9kZWwuY3N1YnNjcmliZSgnRVZUX0VYUEFORF9BTEwnLCAoKSA9PiB7XHJcbiAgICAgIHRoaXMuc2hvdyhub2RlSG9sZGVyKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIGhpZGUobm9kZUhvbGRlcikge1xyXG4gICAgJC5yZW1vdmVDbGFzcyh0aGlzLm5vZGUsICdwcmVzc2VkJylcclxuICAgIG5vZGVIb2xkZXIuaGlkZSgpXHJcbiAgICBub2RlSG9sZGVyLnVwZGF0ZUNsYXNzKFtdKVxyXG4gIH1cclxuXHJcbiAgc2hvdyhub2RlSG9sZGVyKSB7XHJcbiAgICBpZighJC5oYXNDbGFzcyh0aGlzLm5vZGUsICdwcmVzc2VkJykpIHtcclxuICAgICAgJC5hZGRDbGFzcyh0aGlzLm5vZGUsICdwcmVzc2VkJylcclxuICAgIH1cclxuICAgIG5vZGVIb2xkZXIuc2hvdygpXHJcbiAgICBub2RlSG9sZGVyLnVwZGF0ZUNsYXNzKFsnc2hvdyddKVxyXG4gIH1cclxuXHJcbiAgdG9nZ2xlU3RhdGUobm9kZUhvbGRlcikge1xyXG4gICAgaWYoJC5oYXNDbGFzcyh0aGlzLm5vZGUsICdwcmVzc2VkJykpIHtcclxuICAgICAgdGhpcy5oaWRlKG5vZGVIb2xkZXIpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLnNob3cobm9kZUhvbGRlcilcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbnJoLndpZGdldHMuVHJpZ2dlciA9IFRyaWdnZXJcclxucmgud2lkZ2V0cy5Ecm9wU3BvdCA9IFRyaWdnZXJcclxucmgud2lkZ2V0cy5FeHBhbmRTcG90ID0gVHJpZ2dlclxyXG4iLCJsZXQgcmggPSByZXF1aXJlKFwiLi4vLi4vbGliL3JoXCIpXHJcbmxldCAkID0gcmguJFxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcbiAgbm9kZVR5cGU6IHtcclxuICAgIEVMRU1FTlRfTk9ERTogMSxcclxuICAgIEFUVFJJQlVURV9OT0RFOiAyLFxyXG4gICAgVEVYVF9OT0RFOiAzLFxyXG4gICAgQ0RBVEFfU0VDVElPTl9OT0RFOiA0LFxyXG4gICAgRU5USVRZX1JFRkVSRU5DRV9OT0RFOiA1LFxyXG4gICAgRU5USVRZX05PREU6IDYsXHJcbiAgICBQUk9DRVNTSU5HX0lOU1RSVUNUSU9OX05PREU6IDcsXHJcbiAgICBDT01NRU5UX05PREU6IDgsXHJcbiAgICBET0NVTUVOVF9OT0RFOiA5LFxyXG4gICAgRE9DVU1FTlRfVFlQRV9OT0RFOiAxMCxcclxuICAgIERPQ1VNRU5UX0ZSQUdNRU5UX05PREU6IDExLFxyXG4gICAgTk9UQVRJT05fTk9ERTogMTJcclxuICB9LFxyXG5cclxuICByZW1vdmVDaGlsZChub2RlLCBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGUobm9kZSkpIHtcclxuICAgIHJldHVybiBwYXJlbnQgJiYgcGFyZW50LnJlbW92ZUNoaWxkICYmIHBhcmVudC5yZW1vdmVDaGlsZChub2RlKVxyXG4gIH0sXHJcbiAgYXBwZW5kQ2hpbGQocGFyZW50LCBuZXdOb2RlKSB7XHJcbiAgICByZXR1cm4gcGFyZW50ICYmIHBhcmVudC5hcHBlbmRDaGlsZCAmJiBwYXJlbnQuYXBwZW5kQ2hpbGQobmV3Tm9kZSlcclxuICB9LFxyXG4gIHBhcmVudE5vZGUobm9kZSkge1xyXG4gICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5wYXJlbnROb2RlXHJcbiAgfSxcclxuICBjaGlsZE5vZGVzKG5vZGUpIHtcclxuICAgIHJldHVybiBub2RlICYmIG5vZGUuY2hpbGROb2RlcyB8fCBbXVxyXG4gIH0sXHJcbiAgdG9IdG1sTm9kZShodG1sKSB7XHJcbiAgICByZXR1cm4gdGhpcy5jaGlsZE5vZGVzKCQuY3JlYXRlRWxlbWVudCgnZGl2JywgaHRtbCkpXHJcbiAgfSxcclxuICBvdXRlckhUTUwobm9kZSkge1xyXG4gICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5vdXRlckhUTUwgfHwgJydcclxuICB9LFxyXG4gIGluc2VydEFmdGVyKG5vZGUsIG5ld05vZGUpe1xyXG4gICAgcmV0dXJuIG5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobmV3Tm9kZSwgbm9kZS5uZXh0U2libGluZylcclxuICB9LFxyXG4gIHZhbHVlKG5vZGUpIHtcclxuICAgIHJldHVybiBub2RlICYmIG5vZGUubm9kZVZhbHVlXHJcbiAgfSxcclxuICBuYW1lKG5vZGUpIHtcclxuICAgIHJldHVybiBub2RlICYmIG5vZGUubm9kZU5hbWVcclxuICB9LFxyXG4gIHR5cGUobm9kZSkge1xyXG4gICAgcmV0dXJuIG5vZGUgJiYgbm9kZS5ub2RlVHlwZVxyXG4gIH0sXHJcbiAgaXNFbGVtZW50Tm9kZShub2RlKSB7XHJcbiAgICByZXR1cm4gdGhpcy50eXBlKG5vZGUpID09PSB0aGlzLm5vZGVUeXBlLkVMRU1FTlRfTk9ERVxyXG4gIH0sXHJcbiAgaXNUZXh0Tm9kZShub2RlKSB7XHJcbiAgICByZXR1cm4gdGhpcy50eXBlKG5vZGUpID09PSB0aGlzLm5vZGVUeXBlLlRFWFRfTk9ERVxyXG4gIH1cclxufSIsImxldCByaCA9IHJlcXVpcmUoXCIuLi8uLi9saWIvcmhcIiksXHJcbiAgXyA9IHJoLl9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGlubmVyV2lkdGgoKSB7XHJcbiAgICBsZXQgaW5uZXJXaWR0aCA9IGdsb2JhbC5pbm5lcldpZHRoXHJcbiAgICBpZighXy5pc0RlZmluZWQoaW5uZXJXaWR0aCkpIHtcclxuICAgICAgbGV0IGNsaWVudFdpZHRoID0gXy5nZXQoZG9jdW1lbnQsICdkb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgnKVxyXG4gICAgICBjbGllbnRXaWR0aCA9IF8uaXNEZWZpbmVkKGNsaWVudFdpZHRoKSA/IGNsaWVudFdpZHRoIDogXy5nZXQoZG9jdW1lbnQsICdib2R5LmNsaWVudFdpZHRoJylcclxuICAgICAgaWYoXy5pc0RlZmluZWQoY2xpZW50V2lkdGgpKSB7XHJcbiAgICAgICAgaW5uZXJXaWR0aCA9IGNsaWVudFdpZHRoXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBpbm5lcldpZHRoXHJcblxyXG4gIH0sXHJcbiAgaW5uZXJIZWlnaHQoKSB7XHJcbiAgICBsZXQgaW5uZXJIZWlnaHQgPSBnbG9iYWwuaW5uZXJIZWlnaHRcclxuICAgIGlmKCFfLmlzRGVmaW5lZChpbm5lckhlaWdodCkpIHtcclxuICAgICAgbGV0IGNsaWVudEhlaWdodCA9IF8uZ2V0KGRvY3VtZW50LCAnZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCcpXHJcbiAgICAgIGNsaWVudEhlaWdodCA9IF8uaXNEZWZpbmVkKGNsaWVudEhlaWdodCkgPyBjbGllbnRIZWlnaHQgOiBfLmdldChkb2N1bWVudCwgJ2JvZHkuY2xpZW50SGVpZ2h0JylcclxuICAgICAgaWYoXy5pc0RlZmluZWQoY2xpZW50SGVpZ2h0KSkge1xyXG4gICAgICAgIGlubmVySGVpZ2h0ID0gY2xpZW50SGVpZ2h0XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBpbm5lckhlaWdodFxyXG4gIH1cclxufVxyXG4iXX0=
