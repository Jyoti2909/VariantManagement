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
var consts = rh.consts;


rh.model.subscribe(consts('EVT_PROJECT_LOADED'), function () {
  return rh.model.subscribe(consts('KEY_MERGED_PROJECT_MAP'), function () {
    var origin = _.getProjectName(_.filePath());
    return rh.model.publish(consts('KEY_TOPIC_ORIGIN'), origin);
  });
});

var ContentFilter = function () {
  var nonTextNodes = undefined;
  ContentFilter = function (_rh$Widget) {
    _inherits(ContentFilter, _rh$Widget);

    _createClass(ContentFilter, [{
      key: 'preventClick',
      value: function preventClick(e) {
        _.preventDefault(e);
        return false;
      }
    }], [{
      key: 'initClass',
      value: function initClass() {

        nonTextNodes = ['IMG', 'OBJECT', 'VIDEO'];
      }
    }]);

    function ContentFilter(config) {
      _classCallCheck(this, ContentFilter);

      var _this = _possibleConstructorReturn(this, (ContentFilter.__proto__ || Object.getPrototypeOf(ContentFilter)).call(this, config));

      _this.onTagExpr = _this.onTagExpr.bind(_this);
      _this.ids = config.ids;
      _this.className = config.className || 'rh-hide';
      _this.node = config.node;
      _this.hoverClass = 'rh-tag-content-hover';
      _this.supClass = 'rh-applied-tag';
      _this.createTagNode();

      if (_this.ids) {
        _this.subscribe(consts('KEY_TOPIC_ORIGIN'), function () {
          return _this.subscribe(consts('KEY_TAG_EXPRESSION'), _this.onTagExpr);
        });
      } else if (rh._debug) {
        rh._d('error', 'data-tags without any tag combination');
      }
      return _this;
    }

    _createClass(ContentFilter, [{
      key: 'onTagExpr',
      value: function onTagExpr(tagExprs) {
        var origin = this.get(consts('KEY_TOPIC_ORIGIN'));
        if (!this.get('tags')) {
          this.tags = _.union(this.ids, function (id) {
            return _.getTags(id, origin);
          });
          this.publish('tags', this.tags.join(','));
        }

        var apply = !_.any(this.ids, function (id) {
          return _.evalTagExpression(id, tagExprs, origin);
        });
        this.toggleClass(apply);
        if (this.className !== 'rh-hide') {
          this.toggleClick(apply);
        }
        return this.applied = apply;
      }
    }, {
      key: 'toggleClass',
      value: function toggleClass(apply) {
        if (apply) {
          if (!this.applied) {
            return $.addClass(this.node, this.className);
          }
        } else {
          return $.removeClass(this.node, this.className);
        }
      }
    }, {
      key: 'toggleClick',
      value: function toggleClick(addEvent) {
        if (addEvent) {
          if (!this.applied) {
            return _.addEventListener(this.node, 'click', this.preventClick);
          }
        } else {
          if (this.applied) {
            return _.removeEventListener(this.node, 'click', this.preventClick);
          }
        }
      }
    }, {
      key: 'onHover',
      value: function onHover() {
        return $.addClass(this.node, this.hoverClass);
      }
    }, {
      key: 'onMouseOut',
      value: function onMouseOut() {
        return $.removeClass(this.node, this.hoverClass);
      }
    }, {
      key: 'appendNode',
      value: function appendNode(supNode) {
        var parentNode = this.node;
        var sibling = null;
        if (nonTextNodes.indexOf(this.node.nodeName) !== -1) {
          parentNode = this.node.parentNode;

          sibling = this.node.nextSibling;
        }
        if (sibling) {
          parentNode.insertBefore(supNode, sibling);
        } else {
          parentNode.appendChild(supNode);
        }
        return this.resolveDataAttrs(supNode);
      }
    }, {
      key: 'getAptNames',
      value: function getAptNames() {
        var _this2 = this;

        return this.subscribe('tags', function () {
          var data = [];
          _.each(_this2.tags, function (current, idx) {
            return data.push(current.replace("att_sep", ":"));
          });
          return _this2.publish('showtags', data.join(','));
        });
      }
    }, {
      key: 'createTagNode',
      value: function createTagNode() {
        var _this3 = this;

        return this.subscribe(consts('KEY_SHOW_TAGS'), function (showTags) {
          if (!showTags || $.find(_this3.node, 'sup.' + _this3.supClass).length > 0) {
            return;
          }
          var supNode = document.createElement('sup');
          _this3.getAptNames();
          $.setAttribute(supNode, 'data-text', 'showtags');
          $.setAttribute(supNode, 'data-mouseover', 'this.onHover()');
          $.setAttribute(supNode, 'data-mouseout', 'this.onMouseOut()');
          $.setAttribute(supNode, 'class', _this3.supClass);
          return _this3.appendNode(supNode);
        });
      }
    }]);

    return ContentFilter;
  }(rh.Widget);
  ContentFilter.initClass();
  return ContentFilter;
}();

window.rh.widgets.ContentFilter = ContentFilter;

},{}],2:[function(require,module,exports){
'use strict';

/*
 Help for Edwidget
*/

var edWidget = window.rh.edWidget;

/*
 Tab edwidget
*/

edWidget('tab', {
  attrs: {
    'data-table': 'data',
    'data-rhwidget': 'Basic',
    'data-output': 'data: edw.data.#{@index}',
    class: 'print-only'
  },
  view: {
    tag: 'div',
    attrs: {
      'data-rhwidget': 'Basic: include: edwidgets/tab/tabLayout.js',
      'data-input': 'data: edw.data.#{@index}'
    },
    model: {
      tab: '0'
    }
  }
});

/*
 Gallary edwidget
*/
//edWidget 'Gallary'

},{}],3:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window,
    rh = _window.rh;
var $ = rh.$;
var _ = rh._;
var consts = rh.consts;


var Edwidget = function () {
  var valueSeperator = undefined;
  Edwidget = function () {
    _createClass(Edwidget, null, [{
      key: 'initClass',
      value: function initClass() {
        valueSeperator = {
          'data-rhwidget': ';',
          class: ' '
        };
      }
    }]);

    function Edwidget(node, index, arg) {
      _classCallCheck(this, Edwidget);

      this.node = node;
      this.index = index;

      var _parseArg = this.parseArg(arg),
          view = _parseArg.view,
          attrs = _parseArg.attrs,
          model = _parseArg.model,
          argModel = _parseArg.argModel;

      if (attrs) {
        this.setAttributes(this.node, attrs);
      }
      if (model) {
        this.setModelArg(this.node, _.extend({}, model, argModel));
      }
      if (view) {
        this.createView(view, argModel);
      }
    }

    _createClass(Edwidget, [{
      key: 'parseArg',
      value: function parseArg(arg) {
        var argModel = void 0,
            attrs = void 0,
            config = void 0,
            model = void 0,
            view = void 0;
        var wName = arg.wName,
            wArg = arg.wArg,
            pipedArgs = arg.pipedArgs;

        if (config = rh.edWidget(wName)) {
          var vars = void 0;
          var _config = config;
          view = _config.view;
          attrs = _config.attrs;
          vars = _config.vars;
          model = _config.model;

          argModel = _.resolveNiceJSON(pipedArgs.shift());
          this.vars = _.extend({}, vars, wArg);
        }
        return { view: view, attrs: attrs, model: model, argModel: argModel };
      }
    }, {
      key: 'createView',
      value: function createView(view, argModel) {
        var viewModel = _.extend({}, view.model, argModel);
        var viewNode = document.createElement(view.tag || 'div');
        if (view.attrs) {
          this.setAttributes(viewNode, view.attrs);
        }
        this.setModelArg(viewNode, viewModel);
        return this.node.parentNode.insertBefore(viewNode, this.node);
      }
    }, {
      key: 'setAttributes',
      value: function setAttributes(node, attrs) {
        return _.each(attrs, function (value, attr) {
          return $.setAttribute(node, attr, this.resolveValue(this.mergedValue(node, attr, value)));
        }, this);
      }
    }, {
      key: 'setModelArg',
      value: function setModelArg(node, model) {
        if (!_.isEmptyObject(model)) {
          var jsonString = this.resolveValue(JSON.stringify(model));
          return $.dataset(node, 'rhwidget', ($.dataset(node, 'rhwidget') || 'Basic') + ' | ' + jsonString);
        }
      }
    }, {
      key: 'mergedValue',
      value: function mergedValue(node, attrib, value) {
        var oldValue = void 0,
            seperator = void 0;
        if (!(seperator = valueSeperator[attrib])) {
          return value;
        }
        if (oldValue = $.getAttribute(node, attrib) || '') {
          return '' + oldValue + seperator + value;
        } else {
          return value;
        }
      }
    }, {
      key: 'resolveValue',
      value: function resolveValue(value) {
        var _this = this;

        return _.resolveEnclosedVar(value, function (varName) {
          switch (varName) {
            case 'this':
              return JSON.stringify(_this.vars);
            case '@index':
              return _this.index;
            default:
              return _this.vars[varName];
          }
        });
      }
    }]);

    return Edwidget;
  }();
  Edwidget.initClass();
  return Edwidget;
}();

/*
  <div data-edwidget="Tab: <name>: <string value>, <name>: <string value>
   | <json or niceJSON>"></div>
*/

rh.model.subscribe(consts('EVT_WIDGET_BEFORELOAD'), function () {
  return _.each($.find(document, '[data-edwidget]'), function (node, index) {
    var args = _.resolveWidgetArgs($.dataset(node, 'edwidget'));
    _.each(args, function (arg) {
      return new Edwidget(node, index, arg);
    });
    return $.dataset(node, 'edwidget', null);
  });
});

rh.edWidget = _.cache(_.isObject);

},{}],4:[function(require,module,exports){
'use strict';

var _window = window,
    rh = _window.rh;
var _ = rh._;
var $ = rh.$;
var consts = rh.consts;
var model = rh.model;


_.hookClick = function (event) {
  var href = void 0;
  if ('button' in event && event.button !== 0) {
    return;
  }
  if (event.defaultPrevented) {
    return;
  }

  var _document = document,
      body = _document.body;

  var node = event.target;
  while (true) {
    if (!node || node === document) {
      break;
    }
    href = $.getAttribute(node, 'href');
    if (href) {
      break;
    }
    node = node.parentNode;
  }
  if (!href) {
    return;
  }
  href = decodeURI(href);
  var mobileAppMode = model.get(consts('KEY_MOBILE_APP_MODE'));

  var target = $.getAttribute(node, 'target');
  if (target && target !== '_self' && !mobileAppMode) {
    return;
  }

  if (href[0] === '#' && _.isRootUrl()) {
    if (href.length > 1) {
      var bookmarkKey = '' + consts('EVT_BOOKMARK') + href;
      if (model.isSubscribed(bookmarkKey)) {
        model.publish(bookmarkKey, '');
      } else {
        model.publish(consts('EVT_NAVIGATE_TO_URL'), { absUrl: '' + _.getRootUrl() + href });
      }
    }
    return _.preventDefault(event);
  } else if (_.isValidFileUrl(href)) {
    var absUrl = void 0;
    if (_.isRelativeUrl(href)) {
      absUrl = window._getFullPath(_.parentPath(), href);
    }
    if (absUrl == null) {
      absUrl = href;
    }

    if ((mobileAppMode || !target) && !_.isUrlAllowdInIframe(absUrl)) {
      return $.setAttribute(node, 'target', '_blank');
    } else {
      model.publish(consts('EVT_NAVIGATE_TO_URL'), { absUrl: absUrl });
      if (!target) {
        return _.preventDefault(event);
      }
    }
  }
};

},{}],5:[function(require,module,exports){
'use strict';

var _window = window,
    rh = _window.rh;
var consts = rh.consts;

// Project specific model keys

consts('KEY_PROJECT_TOPICLIST', '.p.topiclist');
consts('KEY_PROJECT_BRSLIST', '.p.brslist');
consts('KEY_PROJECT_TAG_COMBINATIONS', '.p.tag_combinations');
consts('KEY_PROJECT_TAG_STATES', '.p.tag_states');
consts('KEY_MERGED_FILTER_KEY', '.p.tags');
consts('KEY_PROJECT_FILTER_CAPTION', '.p.filter_caption');
consts('KEY_PROJECT_FILTER_TYPE', '.p.filter_type');
consts('KEY_PROJECT_LIST', '.p.projects');
consts('KEY_MASTER_PROJECT_LIST', '.p.masterprojects');
consts('KEY_SEARCH_RESULTS', '.p.searchresults');
consts('KEY_SEARCH_RESULT_PARAMS', '.p.searchresultparams');
consts('KEY_ONSEARCH_TAG_STATES', '.p.onsearchtagstates');
consts('KEY_LNG', '.p.lng_db');
consts('KEY_DEFAULT_FILTER', '.p.deffilter');
consts('PROJECT_GLOSSARY_DATA', '.p.glodata');
consts('PROJECT_INDEX_DATA', '.p.idxdata');

// Merged Project specific
consts('KEY_MERGED_PROJECT_MAP', '.mp.tmap');

// Topic specific model keys
consts('KEY_TOPIC_URL', '.t.topicurl');
consts('KEY_TOPIC_ID', '.t.topicid');
consts('KEY_TOPIC_TITLE', '.t.topictitle');
consts('KEY_TOPIC_BRSMAP', '.t.brsmap');
consts('KEY_TOPIC_ORIGIN', '.t.origin');
consts('KEY_TOPIC_HEIGHT', '.t.topic_height');

// Layout specific model keys
consts('KEY_SEARCH_TERM', '.l.searchterm');
consts('KEY_SEARCHED_TERM', '.l.searched_term');
consts('KEY_TAG_EXPRESSION', '.l.tag_expression');
consts('KEY_UI_MODE', '.l.uimode'); // RH11
consts('KEY_BASE_IFRAME_NAME', '.l.base_iframe_name');
consts('KEY_CAN_HANDLE_SERCH', '.l.can_handle_search'); // RH11
consts('KEY_CAN_HANDLE_SEARCH', '.l.can_handle_search');
consts('KEY_CSH_MODE', '.l.csh_mode');
consts('KEY_ONSEARCH_TAG_EXPR', '.l.onsearchtagexpr');
consts('KEY_AND_SEARCH', '.l.andsearch');
consts('KEY_FEATURE', '.l.features');
consts('KEY_SEARCH_PROGRESS', '.l.search_progress');
consts('KEY_LAYOUT_VERSION', '.l.layout_version');
consts('KEY_TOPIC_IN_IFRAME', '.l.topic_in_iframe');
consts('KEY_SHOW_TAGS', '.l.showtags');
consts('KEY_DIR', '.l.dir');
consts('KEY_SEARCH_LOCATION', '.l.search_location');
consts('KEY_DEFAULT_SEARCH_LOCATION', '.l.default_search_location');
consts('KEY_FILTER_LOCATION', '.l.filter_location');
consts('KEY_ACTIVE_TAB', '.l.active_tab');
consts('KEY_DEFAULT_TAB', '.l.default_tab');
consts('KEY_ACTIVE_TOPIC_TAB', '.l.active_topic_tab');
consts('KEY_TOC_DRILL_DOWN', '.l.toc_drilldown');
consts('KEY_MOBILE_TOC_DRILL_DOWN', '.l.mobile_toc_drilldown');
consts('KEY_PUBLISH_MODE', '.l.publish_mode');
consts('KEY_PUBLISH_BASE_URL', '.l.publish_base_url');
consts('KEY_PROJECTS_BASE_URL', '.l.projects_base_url');
consts('KEY_INDEX_FILTER', '.l.idxfilter');

// Events
consts('EVT_BASE_IFRAME_LOAD', '.e.base_iframe_load');
consts('EVT_SCROLL_TO_TOP', '.e.scroll_to_top');
consts('EVT_SEARCH_TERM', '.e.search_term');
consts('EVT_NAVIGATE_TO_URL', '.e.navigate_to_url');
consts('EVT_PROJECT_LOADED', '.e.project_loaded');
consts('EVT_TOC_LOADED', '.e.toc_loaded');
consts('EVT_TOPIC_LOADED', '.e.topic_loaded');
consts('EVT_TOPIC_LOADING', '.e.topic_loading');
consts('EVT_BOOKMARK', '.e.bookmark.');
consts('EVT_PRINT_TOPIC', '.e.print_topic');
consts('EVT_SEARCH_IN_PROGRESS', '.e.search_in_progress');
consts('EVT_RELOAD_TOPIC', '.e.reload_topic');
consts('EVT_QUERY_SEARCH_RESULTS', '.e.query_search_results');
consts('EVT_LOAD_IDX', '.e.load_idx');
consts('EVT_LOAD_GLO', '.e.load_glo');

// Hash and query keys
consts('HASH_KEY_RH_HIGHLIGHT', 'rhhlterm');
consts('HASH_KEY_RH_SYNS', 'rhsyns');
consts('HASH_KEY_RH_SEARCH', 'rhsearch');
consts('HASH_KEY_RH_TOCID', 'rhtocid');

// Hash keys
consts('HASH_KEY_TOPIC', 't');
consts('HASH_KEY_UIMODE', 'ux');
consts('HASH_KEY_RANDOM', 'random');

consts('PATH_PROJECT_TAGDATA_FILE', 'whxdata/whtagdata.js');
consts('CORDOVA_JS_URL', 'cordova.js');
consts('RHS_LOG_TOPIC_VIEW', { mgr: 'sys', cmd: 'logtpc' });
consts('RHS_DO_SEARCH', { mgr: 'agm', agt: 'nls', cmd: 'search' });
consts('KEY_MOBILE_APP_MODE', '.m.mobileapp');

},{}],6:[function(require,module,exports){
'use strict';

var _window = window,
    rh = _window.rh;
var _ = rh._;
var model = rh.model;
var consts = rh.consts;


var KEY_MERGED_PROJECT_MAP = consts('KEY_MERGED_PROJECT_MAP');

_.parseProjectName = function (project) {
  return project.replace(/\.\//g, '').replace(/\.$/, '').replace(/\/$/, '');
};

_.mapTagIndex = function (idx, project) {
  if (project == null) {
    project = '';
  }
  if (idx) {
    return idx + '+' + project;
  }
  return idx;
};

_.getTags = function (idx, project) {
  if (project == null) {
    project = '';
  }
  if (idx == null) {
    return idx;
  }
  var idmap = model.get(KEY_MERGED_PROJECT_MAP);
  var len = idx.indexOf('+');
  if (len !== -1) {
    project = idx.substring(len + 1, idx.length);
    idx = idx.substring(0, len);
  }
  project = _.parseProjectName(project);
  if ((idmap[project] != null ? idmap[project][idx] : undefined) != null) {
    return idmap[project][idx];
  }
  return idx;
};

_.getProjectName = function (url) {
  var idmap = model.get(KEY_MERGED_PROJECT_MAP);
  if (url != null && idmap != null) {
    url = _.parentPath(url);
    var relUrl = _.makeRelativePath(url, _.getHostFolder());
    relUrl = _.parseProjectName(relUrl);
    while (idmap[relUrl] == null) {
      var n = relUrl.lastIndexOf('/');
      if (n < 0) {
        relUrl = '';
        break;
      }
      relUrl = relUrl.substring(0, n);
    }
    url = relUrl;
  }
  return url;
};

_.evalTagExpression = function (index, groupExprs, project) {
  if (project == null) {
    project = '';
  }
  if (!groupExprs || groupExprs.length === 0) {
    return true;
  }

  var tags = _.getTags(index, project);
  if (!tags || tags.length === 0) {
    return true;
  }

  // TODO: fix empty string in robohelp
  if (tags.length === 1 && (tags[0] === '' || tags[0] === '$')) {
    return true;
  }

  var trueFlag = false;
  var falseFlag = _.any(groupExprs, function (item) {
    if (_.evalMultipleTagExpression(item.c, tags)) {
      trueFlag = true;
    } else if (item.c.length) {
      if (_.evalMultipleTagExpression(item.u, tags)) {
        return true;
      }
    }
    return false;
  });

  if (falseFlag) {
    return false;
  } else {
    return trueFlag;
  }
};

_.evalMultipleTagExpression = function (exprs, tags) {
  return _.any(exprs, function (expr) {
    return _.evalSingleTagExpression(expr, tags);
  });
};

_.evalSingleTagExpression = function () {
  var cache = {};
  var operators = ['&', '|', '!'];
  var evalAnd = function evalAnd(stack) {
    var items = stack.splice(stack.length - 2);
    return stack.push(items[0] === 1 && items[1] === 1 ? 1 : 0);
  };

  var evalOr = function evalOr(stack) {
    var items = stack.splice(stack.length - 2);
    return stack.push(items[0] === 1 || items[1] === 1 ? 1 : 0);
  };

  var evalNot = function evalNot(stack, tags) {
    var items = stack.splice(stack.length - 1);
    return stack.push(items[0] === 1 ? 0 : 1);
  };

  return function (expr, tags) {
    var key = expr + ':' + tags; // TODO: now robohelp should export tags as string
    var result = cache[key];
    if (result != null) {
      return result;
    }

    var tokens = _.map(expr.split(' '), function (item) {
      if (-1 !== operators.indexOf(item)) {
        return item;
      }
      if (-1 === tags.indexOf(item)) {
        return 0;
      } else {
        return 1;
      }
    });

    if (tokens.length > 1) {
      var stack = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Array.from(tokens)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var token = _step.value;

          switch (token) {
            case '&':
              evalAnd(stack);break;
            case '|':
              evalOr(stack);break;
            case '!':
              evalNot(stack);break;
            default:
              stack.push(token);
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

      result = stack[0];
    } else {
      result = tokens[0];
    }

    return cache[key] = result;
  };
}();

},{}],7:[function(require,module,exports){
'use strict';

var rh = window.rh;
var _ = rh._;
var consts = rh.consts;

_.getHostFolder = function () {
  var hostFolder = void 0;
  hostFolder = null;
  return function () {
    if (hostFolder == null) {
      hostFolder = _.isLocal() ? window.gHostPath : document.location.protocol + '//' + window.gHost + window.gHostPath;
    }
    return hostFolder;
  };
}();

_.getHostData = function (rootPath) {
  var absFolder = void 0;
  absFolder = window._getFullPath(_.parentPath(), rootPath + '/');
  if (window._isHTTPUrl(absFolder)) {
    return {
      gHost: window._getHostNameFromURL(absFolder),
      gHostPath: window._getPathFromURL(absFolder)
    };
  } else {
    return {
      gHost: '',
      gHostPath: absFolder
    };
  }
};

_.getHashMapForRoot = function (relUrl, bCsh) {
  var hashMap = void 0;
  var urlhashMap = void 0;
  if (bCsh == null) {
    bCsh = null;
  }
  relUrl = _.fixRelativeUrl(relUrl);
  urlhashMap = _.urlParams(_.extractParamString(relUrl));
  if (bCsh) {
    urlhashMap[consts('RHMAPID')] = null;
    urlhashMap[consts('RHMAPNO')] = null;
  }
  hashMap = _.extend(_.urlParams(), urlhashMap);
  hashMap = _.fixHashMapForRoot(hashMap);
  //hashMap = _.addRHSParams(hashMap);
  return hashMap;
};

_.getParamsForRoot = function (relUrl, bCsh) {
  var queryMap = void 0;
  var queryString = void 0;
  if (bCsh == null) {
    bCsh = null;
  }
  queryMap = _.getHashMapForRoot(relUrl, bCsh);
  queryString = _.mapToEncodedString(queryMap);
  if (queryString.length === 0) {
    return '';
  } else {
    return '?' + queryString;
  }
};

_.isRootUrl = function (absUrl) {
  var fileName = void 0;
  var filePath = void 0;
  var rootUrl = void 0;
  if (absUrl == null) {
    absUrl = decodeURI(document.location.href);
  }
  rootUrl = _.getRootUrl();
  filePath = _.filePath(absUrl);
  if (filePath === _.filePath(rootUrl)) {
    return true;
  }
  fileName = _.getFileName(rootUrl);
  return (fileName === 'index.htm' || fileName === 'index.html') && filePath === _.parentPath(rootUrl);
};

_.isExternalUrl = function (absUrl) {
  var hostFolder = void 0;
  var targetFolder = void 0;
  if (rh.model.get(rh.consts('KEY_PUBLISH_MODE'))) {
    hostFolder = rh.model.get(rh.consts('KEY_PROJECTS_BASE_URL'));
  } else {
    hostFolder = _.getHostFolder();
  }
  targetFolder = absUrl.substring(0, hostFolder.length);
  return targetFolder !== hostFolder;
};

_.fixHashMapForRoot = function (hashMap) {
  var HASH_KEY_RANDOM = void 0;
  var HASH_KEY_RH_HIGHLIGHT = void 0;
  var HASH_KEY_RH_SEARCH = void 0;
  var HASH_KEY_RH_TOCID = void 0;
  var HASH_KEY_TOPIC = void 0;
  var HASH_KEY_UIMODE = void 0;
  if (hashMap == null) {
    hashMap = {};
  }
  HASH_KEY_RH_SEARCH = consts('HASH_KEY_RH_SEARCH');
  HASH_KEY_TOPIC = consts('HASH_KEY_TOPIC');
  HASH_KEY_UIMODE = consts('HASH_KEY_UIMODE');
  HASH_KEY_RH_TOCID = consts('HASH_KEY_RH_TOCID');
  HASH_KEY_RH_HIGHLIGHT = consts('HASH_KEY_RH_HIGHLIGHT');
  HASH_KEY_RANDOM = consts('HASH_KEY_RANDOM');
  if (!hashMap[HASH_KEY_UIMODE]) {
    hashMap[HASH_KEY_UIMODE] = null;
  }
  hashMap[HASH_KEY_RANDOM] = null;
  if (!hashMap[HASH_KEY_RH_TOCID]) {
    hashMap[HASH_KEY_RH_TOCID] = null;
  }
  if (!hashMap[HASH_KEY_RH_HIGHLIGHT]) {
    hashMap[HASH_KEY_RH_HIGHLIGHT] = null;
  }
  if (!hashMap[HASH_KEY_RH_SEARCH]) {
    hashMap[HASH_KEY_RH_SEARCH] = null;
  }
  return hashMap;
};

_.fixRelativeUrl = function (filePath) {
  if (filePath == null) {
    filePath = '';
  }
  filePath = filePath.replace(/\/\.\//g, '/');
  if (filePath[0] === '.' && filePath[1] === '/') {
    filePath = filePath.substring(2);
  }
  return filePath;
};

_.ensureSlash = function (url) {
  if (url != null && url.substr(-1) !== '/') {
    url += '/';
  }
  return url;
};

_.isUrlAllowdInIframe = function () {
  var ALLOWED_EXTS_IN_IFRAME = void 0;
  ALLOWED_EXTS_IN_IFRAME = ['', '.htm', '.html', '.asp', '.aspx'];
  return function (absUrl) {
    var ext = void 0;
    var relUrl = void 0;
    if (_.isExternalUrl(absUrl)) {
      return false;
    }
    relUrl = absUrl.substring(_.getHostFolder().length);
    ext = _.getFileExtention(relUrl).toLowerCase();
    return ALLOWED_EXTS_IN_IFRAME.includes(ext);
  };
}();

},{}],8:[function(require,module,exports){
'use strict';

var rh = require("./rh");
var consts = rh.consts;

consts('RHMAPID', 'rhmapid');
consts('RH_FULL_LAYOUT_PARAM', 'rhfulllayout');

consts('EVT_TOPIC_WIDGET_LOADED', '.e.topic_widget_loaded');
consts('EVT_CLOSE_SEARCH_SUGGESTION', '.e.close_search_suggestion');

consts('KEY_TOC_BREADCRUMBS', '.p.toc_breadcrumbs');
consts('KEY_TOC_SELECT_ITEM', '.p.toc_select_item');
consts('KEY_TOC_ORDER', '.p.toc_order');
consts('KEY_TOC_CHILD_ORDER', '.p.toc_child_order');
//Search specific
consts('SEARCH_MAP_ADDR', "whxdata/search_auto_map_0.js");
consts('SEARCH_MODEL_ADDR', "whxdata/search_auto_model_");
consts('SEARCH_INDEX_DATA', ".l.search_index_data");
consts('SEARCH_INDEX_FILE', "whxdata/search_auto_index.js");
consts('SEARCH_DB_FILE', "whxdata/search_db.js");
consts('SEARCH_METADATA_FILE', "whxdata/search_topics.js");
consts('SEARCH_TEXT_FILE', "whxdata/text");

consts('SEARCH_MODEL_KEY', '.l.search_model.');
consts('SEARCH_MAP_KEY', '.l.search_map.');
consts('SEARCH_MAX_TOPICS', 20);
consts('SEARCH_RESULTS_KEY', 'search_results');
consts('STOP_NAVIGATE_TO_TOPIC', '.l.stoptopicnav');
consts('SEARCH_WORDS_MAP', '.l.search_words_map');
consts("MAX_SEARCH_INPUT", 3);
consts("KEY_BREADCRUMBS", '.l.breadcrumbs');
consts('HASH_HOMEPAGE_MODE', 'homepage');
consts('KEY_VIEW_MODE', '.l.mode');
consts('HELP_LAYOUT_MODE', 'layout');
consts('HELP_SEARCH_MODE', 'search');
consts('HELP_TOPIC_MODE', 'topic');
consts('PREV_SEARCH_KEY', 'data-prev-search'

/* favorites constants */
);consts('FAVATTRIBUTE', 'data-favwidget');
consts('FAVBUTTON', 'fav-button');
consts('FAVLIST', 'fav-list');
consts('FAVSTORAGE', 'fav-store');

consts('FAVLINKCLASS', 'favorite');
consts('UNFAVLINKCLASS', 'unfavorite');
consts('FAVTABLECLASS', 'favoritesholder');
consts('FAVTABLETITLECLASS', 'favorite');
consts('FAVTABLEREMOVECLASS', 'removelink');
consts('FAVLISTINTROCLASS', 'favoritesintro');
consts('FAVLISTTABLEINTROCLASS', 'favoritestableintro');
consts('EVENTFAVCHANGE', 'favorite-changed-in-script');
consts('TOPIC_FAVORITE', '.l.topic_favorite');
consts('KEY_FAVORITES', '.l.favorites');
consts('FAVORITES_BUTTON_TITLE', '.l.favorites_title');
consts('KEY_GLOSSARY_RESULT', '.p.glossary_search_result');
consts('KEY_GLOSSARY_RESULT_TERM', '.p.glossary_search_term');

consts('EVT_WINDOW_LOADED', '.e.win_loaded');

consts('KEY_LNG_NAME', '.p.lng_name');
consts('SHOW_MODAL', '.l.show_modal');

consts('KEY_HEADER_LOGO_PATH', '.l.header.logo');
consts('KEY_HEADER_TITLE', '.l.header.title');
consts('KEY_HEADER_TITLE_COLOR', '.l.header.title_color');
consts('KEY_HEADER_BACKGROUND_COLOR', '.l.header.background_color');
consts('KEY_LAYOUT_FONT_FAMILY', '.l.layout.font_family');
consts('KEY_HEADER_HTML', '.l.header.html');
consts('KEY_HEADER_CSS', '.l.header.css');
consts('KEY_HEADER_DEFAULT_BACKGROUND_COLOR', '.l.header.default_background_color');
consts('KEY_HEADER_DEFAULT_TITLE_COLOR', '.l.header.default_title_color');
consts('KEY_LAYOUT_DEFAULT_FONT_FAMILY', '.l.layout.default_font_family');

consts('KEY_CUSTOM_BUTTONS', '.l.custom_buttons');
consts('KEY_CUSTOM_BUTTONS_CONFIG', '.l.custom_buttons_config');
consts('KEY_SEARCH_HIGHLIGHT_COLOR', '.l.search_result.highlight_color');
consts('KEY_SEARCH_BG_COLOR', '.l.search_result.highlight_bccolor');
consts('TOPIC_HIGHLIGHTED', '.l.search_result.topic_highlighted');
consts('EVT_REMOVE_HIGHLIGHT', '.e.remove_highlight');

consts('EVT_EXPAND_COLLAPSE_ALL', '.e.expand_collapse_all');
consts('EVT_EXPAND_ALL', '.e.expand_all');
consts('EVT_COLLAPSE_ALL', '.e.collapse_all');
consts('ALL_ARE_EXPANDED', '.l.all_are_expanded');

},{"./rh":9}],9:[function(require,module,exports){
(function (global){
"use strict";

//Gunjan
if (global.rh === undefined) {
  global.rh = {};
}

module.exports = global.rh;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],10:[function(require,module,exports){
"use strict";

require("../lib/rh");
require("../../lenient_src/robohelp/common/rh_consts");
require("../../lenient_src/robohelp/common/tag_expression_utils");
require("../../lenient_src/robohelp/common/hook_click");
require("../../lenient_src/robohelp/common/content_filter");
require("../../lenient_src/robohelp/common/ed_widgets");
require("../../lenient_src/robohelp/common/ed_widget_configs");
require("../../lenient_src/robohelp/common/url_utils");
require("../../lenient_src/robohelp/common/tag_expression_utils");
require("../../lenient_src/robohelp/common/hook_click");
require("../../lenient_src/robohelp/common/content_filter");
require("../../lenient_src/robohelp/common/ed_widgets");
require("../../lenient_src/robohelp/common/ed_widget_configs");
require("../lib/consts");
require("../../lenient_src/robohelp/common/url_utils");
require("./utils/home_utils");
require("./utils/url_utils");
require("./utils/io_utils");
require("./utils/html_resolver");
require("./utils/iframe_utils");
require("./layout/data_attrs/popup_image");
require("./layout/data_attrs/focusif");
require("./common/init");

},{"../../lenient_src/robohelp/common/content_filter":1,"../../lenient_src/robohelp/common/ed_widget_configs":2,"../../lenient_src/robohelp/common/ed_widgets":3,"../../lenient_src/robohelp/common/hook_click":4,"../../lenient_src/robohelp/common/rh_consts":5,"../../lenient_src/robohelp/common/tag_expression_utils":6,"../../lenient_src/robohelp/common/url_utils":7,"../lib/consts":8,"../lib/rh":9,"./common/init":11,"./layout/data_attrs/focusif":12,"./layout/data_attrs/popup_image":13,"./utils/home_utils":14,"./utils/html_resolver":15,"./utils/iframe_utils":16,"./utils/io_utils":17,"./utils/url_utils":19}],11:[function(require,module,exports){
'use strict';

var rh = require("../../lib/rh");
var consts = rh.consts;
var $ = rh.$;
var model = rh.model;

model.subscribe(consts('EVT_PROJECT_LOADED'), function () {
  var $html = $('html', 0);
  var lang = model.get(consts('KEY_LNG_NAME'));
  if ($html && lang && lang !== '') {
    $.setAttribute($html, 'lang', lang);
  }
});

model.subscribe(consts('KEY_AND_SEARCH'), function (value) {
  return value === '' && model.publish(consts('KEY_AND_SEARCH'), '1');
});

},{"../../lib/rh":9}],12:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var rh = require("../../../lib/rh");

var Focusif = function Focusif(widget, node, rawExpr) {
  _classCallCheck(this, Focusif);

  widget.subscribeDataExpr(rawExpr, function (result) {
    if (result) {
      node.focus();
    }
  });
};

rh.registerDataAttr('focusif', Focusif);

},{"../../../lib/rh":9}],13:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var rh = require("../../../lib/rh");
var _ = rh._;
var $ = rh.$;
var HtmlResolver = require("../../utils/html_resolver");
var nodeUtils = require("../../utils/node_utils");

var PopupImage = function () {
  function PopupImage(widget, node, rawExpr) {
    _classCallCheck(this, PopupImage);

    $.addClass(node, "popup-image-thumbnail");
    this.node = node;
    rh.model.csubscribe('EVT_PROJECT_LOADED', this._addEnlargeButton.bind(this));
    this._clickFn = this._getClickFn(rawExpr);
    _.addEventListener(node, "click", this._clickFn);
  }

  _createClass(PopupImage, [{
    key: "_content",
    value: function _content(rawExpr) {
      var nodes = [];
      var imgNode = $.createElement('img');
      $.setAttribute(imgNode, 'src', rawExpr);
      nodes.push(imgNode);

      if ($.hasAttribute(this.node, "usemap")) {
        var mapId = $.getAttribute(this.node, "usemap");
        $.setAttribute(imgNode, 'usemap', mapId);
        nodes.push($(mapId, 0));
      }

      var html_resolver = new HtmlResolver();
      return html_resolver.resolve(_.map(nodes, function (node) {
        return nodeUtils.outerHTML(node);
      }).join(' '));
    }
  }, {
    key: "_getClickFn",
    value: function _getClickFn(rawExpr) {
      var _this = this;

      return function () {
        rh.model.cpublish('SHOW_MODAL', { content: _this._content(rawExpr), isImage: true });
      };
    }
  }, {
    key: "_addEnlargeButton",
    value: function _addEnlargeButton() {

      var img = $.createElement('img', this.node);
      $.setAttribute(img, "src", this.expandImagePath);
      $.addClass(img, "rh-expand-icon");
      nodeUtils.insertAfter(this.node, img);
      _.addEventListener(img, "click", this._clickFn);
    }
  }, {
    key: "expandImagePath",
    get: function get() {
      var html_resolver = new HtmlResolver();
      var fullImagePath = html_resolver.makeFullPath('template/images/expand.png', _.getRootUrl());
      return _.makeRelativeUrl(fullImagePath);
    }
  }]);

  return PopupImage;
}();

rh.registerDataAttr('popupimage', PopupImage);

},{"../../../lib/rh":9,"../../utils/html_resolver":15,"../../utils/node_utils":18}],14:[function(require,module,exports){
'use strict';

var rh = require("../../lib/rh");
var _ = rh._;
var consts = rh.consts;

_.goToHome = function (hash_map, params_map) {
  var home_path = consts('HOME_FILEPATH');
  if (home_path) {
    var home_url = _.makeFullUrl(home_path);
    var paramsStr = params_map === undefined ? '' : '?' + _.mapToEncodedString(params_map);
    var hashStr = hash_map === undefined ? '' : '#' + _.mapToEncodedString(hash_map);

    home_url = '' + home_url + paramsStr + hashStr;
    document.location = home_url;
  }
};

_.isHomeUrl = function (url) {
  var home_path = consts('HOME_FILEPATH');
  var rootUrl = _.getRootUrl();
  var relativePath = _.makeRelativePath(url, rootUrl);
  var filePath = _.filePath(relativePath);
  return home_path === filePath;
};

_.compare = function (word1, word2) {
  return word1 === word2 ? 0 : -1;
};

},{"../../lib/rh":9}],15:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var rh = require("../../lib/rh");
var $ = rh.$;
var _ = rh._;
var nodeUtils = require("./node_utils");
var util = {
  scheme: function scheme(url) {
    var index = void 0,
        scheme = void 0;
    index = url.indexOf(':');
    if (index !== -1) {
      scheme = url.substring(0, index + 1).toLowerCase().trim();
    }
    return scheme;
  }
};

var HtmlResolver = function () {
  _createClass(HtmlResolver, [{
    key: "paths",
    get: function get() {
      return ['src', 'href'];
    }
  }, {
    key: "links",
    get: function get() {
      return ['href'];
    }
  }]);

  function HtmlResolver() {
    _classCallCheck(this, HtmlResolver);
  }

  _createClass(HtmlResolver, [{
    key: "resolve",
    value: function resolve(html) {
      var _this = this;

      var nodes = nodeUtils.toHtmlNode(html);
      _.each(nodes, function (node) {
        if (nodeUtils.isElementNode(node)) {
          $.traverseNode(node, function (node) {
            return _this.resolveNode(node);
          });
        }
      });
      return _.reduce(nodes, function (result, node) {
        result += nodeUtils.outerHTML(node);
        return result;
      }, '');
    }
  }, {
    key: "resolveNode",
    value: function resolveNode(node) {
      var _this2 = this;

      _.each(this.paths, function (attribute) {
        return _this2.resovePaths(node, attribute);
      });
      _.each(this.links, function (attribute) {
        return _this2.resoveLinks(node, attribute);
      });
      return true;
    }
  }, {
    key: "resovePaths",
    value: function resovePaths(node, attribute) {
      if (!$.hasAttribute(node, attribute)) {
        return;
      }
      var value = $.getAttribute(node, attribute);
      $.setAttribute(node, attribute, this.resovePath(value));
    }
  }, {
    key: "resoveLinks",
    value: function resoveLinks(node, attribute) {
      if (!$.hasAttribute(node, attribute)) {
        return;
      }
      $.setAttribute(node, "data-click", "@close(true)");
    }
  }, {
    key: "resovePath",
    value: function resovePath(path) {
      if (!_.isRelativeUrl(path)) {
        return path;
      }
      var baseUrl = _.getRootUrl();
      var fullUrl = _.makeFullUrl(path);
      return _.makeRelativeUrl(fullUrl, baseUrl);
    }
  }, {
    key: "makeFullPath",
    value: function makeFullPath(relUrl, baseUrl) {
      if (!this.isRelativeUrl(relUrl) || this.isRelativeUrl(baseUrl)) {
        return relUrl;
      }
      var baseParts = this.filePath(baseUrl).split('/'),
          relPath = this.filePath(relUrl),
          params = relUrl.substring(relPath.length),
          relParts = relPath.split('/');

      if (relParts.length > 1 || relParts[0]) {
        baseParts.pop();
        _.each(relParts, function (relPart) {
          if (relPart === '..') {
            baseParts.pop();
          } else if (relPart !== '.') {
            baseParts.push(relPart);
          }
        });
      }

      return "" + baseParts.join('/') + params;
    }
  }, {
    key: "isRelativeUrl",
    value: function isRelativeUrl(url) {
      return !url || !util.scheme(url) && url.trim().indexOf('/');
    }
  }, {
    key: "filePath",
    value: function filePath(url) {
      var index = void 0;
      url = url || '';
      index = url.indexOf('?');
      if (index !== -1) {
        url = url.substring(0, index);
      }
      index = url.indexOf('#');
      if (index !== -1) {
        url = url.substring(0, index);
      }
      return url;
    }
  }]);

  return HtmlResolver;
}();

module.exports = HtmlResolver;

},{"../../lib/rh":9,"./node_utils":18}],16:[function(require,module,exports){
'use strict';

var rh = require('../../lib/rh'),
    _ = rh._,
    $ = rh.$;

_.resetIframeSize = function (selector) {
  var iframe = $(selector, 0);
  return iframe;
};

},{"../../lib/rh":9}],17:[function(require,module,exports){
"use strict";

var rh = require("../../lib/rh");
var _ = rh._;
var keyHash = {
  8: "backspace",
  13: "return",
  27: "escape",
  38: "down",
  40: "up",
  39: "right"
};

_.getKeyIndex = function (keyCode) {
  if (keyHash[keyCode]) {
    return keyHash[keyCode];
  } else {
    return "default";
  }
};

},{"../../lib/rh":9}],18:[function(require,module,exports){
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

},{"../../lib/rh":9}],19:[function(require,module,exports){
'use strict';

var rh = require("../../lib/rh");
var _ = rh._;

_.addParam = function (url, key, value) {
  var hashStr = _.extractHashString(url);
  var paramsStr = _.extractParamString(url);
  var paramsMap = _.urlParams(paramsStr);
  paramsMap[key] = value;
  var strippedUrl = _.stripBookmark(url);
  strippedUrl = _.stripParam(strippedUrl);

  var urlHashStr = hashStr === '' ? hashStr : '#' + hashStr;

  var updatedParamsStr = rh._.mapToEncodedString(paramsMap);
  var urlParamsStr = updatedParamsStr === '' ? updatedParamsStr : '?' + updatedParamsStr;
  return strippedUrl + urlParamsStr + urlHashStr;
};

_.removeParam = function (url, param) {
  var hashStr = _.extractHashString(url);
  var paramsStr = _.extractParamString(url);
  var paramsMap = _.urlParams(paramsStr);
  paramsMap[param] = null;
  var strippedUrl = _.stripBookmark(url);
  strippedUrl = _.stripParam(strippedUrl);

  var urlHashStr = hashStr === '' ? hashStr : '#' + hashStr;

  var updatedParamsStr = rh._.mapToEncodedString(paramsMap);
  var urlParamsStr = updatedParamsStr === '' ? updatedParamsStr : '?' + updatedParamsStr;
  return strippedUrl + urlParamsStr + urlHashStr;
};

_.createHashedUrl = function (url) {
  //let hashedUrl = url
  var relUrl = void 0,
      params = void 0;
  if (!_.isRootUrl(url)) {
    var rootUrl = _.getRootUrl();
    if (_.isExternalUrl(url)) {
      relUrl = url;
    } else {
      params = _.getParamsForRoot(url, true);
      relUrl = _.fixRelativeUrl(_.makeRelativePath(url, rootUrl));
      url = '' + rootUrl + params + '#t=' + encodeURIComponent(relUrl);
    }
  }
  return url;
};

},{"../../lib/rh":9}]},{},[10])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsZW5pZW50X3NyY1xccm9ib2hlbHBcXGNvbW1vblxcY29udGVudF9maWx0ZXIuanMiLCJsZW5pZW50X3NyY1xccm9ib2hlbHBcXGNvbW1vblxcZWRfd2lkZ2V0X2NvbmZpZ3MuanMiLCJsZW5pZW50X3NyY1xccm9ib2hlbHBcXGNvbW1vblxcZWRfd2lkZ2V0cy5qcyIsImxlbmllbnRfc3JjXFxyb2JvaGVscFxcY29tbW9uXFxob29rX2NsaWNrLmpzIiwibGVuaWVudF9zcmNcXHJvYm9oZWxwXFxjb21tb25cXHJoX2NvbnN0cy5qcyIsImxlbmllbnRfc3JjXFxyb2JvaGVscFxcY29tbW9uXFx0YWdfZXhwcmVzc2lvbl91dGlscy5qcyIsImxlbmllbnRfc3JjXFxyb2JvaGVscFxcY29tbW9uXFx1cmxfdXRpbHMuanMiLCJzcmNcXGxpYlxcY29uc3RzLmpzIiwic3JjXFxsaWJcXHNyY1xcbGliXFxyaC5qcyIsInNyY1xccmVzcG9uc2l2ZV9oZWxwXFxjb21tb24uanMiLCJzcmNcXHJlc3BvbnNpdmVfaGVscFxcY29tbW9uXFxpbml0LmpzIiwic3JjXFxyZXNwb25zaXZlX2hlbHBcXGxheW91dFxcZGF0YV9hdHRyc1xcZm9jdXNpZi5qcyIsInNyY1xccmVzcG9uc2l2ZV9oZWxwXFxsYXlvdXRcXGRhdGFfYXR0cnNcXHBvcHVwX2ltYWdlLmpzIiwic3JjXFxyZXNwb25zaXZlX2hlbHBcXHV0aWxzXFxob21lX3V0aWxzLmpzIiwic3JjXFxyZXNwb25zaXZlX2hlbHBcXHV0aWxzXFxodG1sX3Jlc29sdmVyLmpzIiwic3JjXFxyZXNwb25zaXZlX2hlbHBcXHV0aWxzXFxpZnJhbWVfdXRpbHMuanMiLCJzcmNcXHJlc3BvbnNpdmVfaGVscFxcdXRpbHNcXGlvX3V0aWxzLmpzIiwic3JjXFxyZXNwb25zaXZlX2hlbHBcXHV0aWxzXFxub2RlX3V0aWxzLmpzIiwic3JjXFxyZXNwb25zaXZlX2hlbHBc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QUFILENBQUssa0JBQUwsQ0FBd0IsU0FBeEIsQ0FBdkI7QUFDQSxNQUFJLGVBQWdCLHFCQUFxQixFQUF0QixHQUEwQixnQkFBMUIsR0FBNEMsTUFBTSxnQkFBckU7QUFDQSxTQUFPLGNBQWMsWUFBZCxHQUE2QixVQUFwQztBQUNELENBYkQ7O0FBZUEsRUFBRSxlQUFGLEdBQW9CLFVBQUMsR0FBRCxFQUFRO0FBQzFCO0FBQ0EsTUFBSSxlQUFKO0FBQUEsTUFBWSxlQUFaO0FBQ0EsTUFBRyxDQUFDLEVBQUUsU0FBRixDQUFZLEdBQVosQ0FBSixFQUFxQjtBQUNuQixRQUFJLFVBQVUsRUFBRSxVQUFGLEVBQWQ7QUFDQSxRQUFHLEVBQUUsYUFBRixDQUFnQixHQUFoQixDQUFILEVBQXdCO0FBQ3RCLGVBQVMsR0FBVDtBQUNELEtBRkQsTUFHSTtBQUNGLGVBQVMsRUFBRSxnQkFBRixDQUFtQixHQUFuQixFQUF3QixJQUF4QixDQUFUO0FBQ0EsZUFBUyxFQUFFLGNBQUYsQ0FBa0IsRUFBRSxnQkFBRixDQUFvQixHQUFwQixFQUF5QixPQUF6QixDQUFsQixDQUFUO0FBQ0EsaUJBQVMsT0FBVCxHQUFtQixNQUFuQixXQUErQixtQkFBbUIsTUFBbkIsQ0FBL0I7QUFDRDtBQUNGO0FBQ0QsU0FBTyxHQUFQO0FBQ0QsQ0FmRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5sZXQgeyBfIH0gPSByaDtcclxubGV0IHsgJCB9ID0gcmg7XHJcbmxldCB7IGNvbnN0cyB9ID0gcmg7XHJcblxyXG5yaC5tb2RlbC5zdWJzY3JpYmUoY29uc3RzKCdFVlRfUFJPSkVDVF9MT0FERUQnKSwgICgpID0+XHJcbiAgcmgubW9kZWwuc3Vic2NyaWJlKGNvbnN0cygnS0VZX01FUkdFRF9QUk9KRUNUX01BUCcpLCBmdW5jdGlvbigpIHtcclxuICAgIGxldCBvcmlnaW4gPSBfLmdldFByb2plY3ROYW1lKF8uZmlsZVBhdGgoKSk7XHJcbiAgICByZXR1cm4gcmgubW9kZWwucHVibGlzaChjb25zdHMoJ0tFWV9UT1BJQ19PUklHSU4nKSwgb3JpZ2luKTtcclxuICB9KVxyXG4pO1xyXG5cclxudmFyIENvbnRlbnRGaWx0ZXIgPSAoZnVuY3Rpb24oKSB7XHJcbiAgbGV0IG5vblRleHROb2RlcyA9IHVuZGVmaW5lZDtcclxuICBDb250ZW50RmlsdGVyID0gY2xhc3MgQ29udGVudEZpbHRlciBleHRlbmRzIHJoLldpZGdldCB7XHJcbiAgICBzdGF0aWMgaW5pdENsYXNzKCkge1xyXG5cclxuICAgICAgbm9uVGV4dE5vZGVzID0gWydJTUcnLCdPQkpFQ1QnLCdWSURFTyddO1xyXG4gICAgfVxyXG5cclxuICAgIHByZXZlbnRDbGljayhlKSB7XHJcbiAgICAgIF8ucHJldmVudERlZmF1bHQoZSk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcclxuICAgICAgc3VwZXIoY29uZmlnKTtcclxuICAgICAgdGhpcy5vblRhZ0V4cHIgPSB0aGlzLm9uVGFnRXhwci5iaW5kKHRoaXMpO1xyXG4gICAgICB0aGlzLmlkcyA9IGNvbmZpZy5pZHM7XHJcbiAgICAgIHRoaXMuY2xhc3NOYW1lID0gY29uZmlnLmNsYXNzTmFtZSB8fCAncmgtaGlkZSc7XHJcbiAgICAgIHRoaXMubm9kZSA9IGNvbmZpZy5ub2RlO1xyXG4gICAgICB0aGlzLmhvdmVyQ2xhc3MgPSAncmgtdGFnLWNvbnRlbnQtaG92ZXInO1xyXG4gICAgICB0aGlzLnN1cENsYXNzID0gJ3JoLWFwcGxpZWQtdGFnJztcclxuICAgICAgdGhpcy5jcmVhdGVUYWdOb2RlKCk7XHJcblxyXG4gICAgICBpZiAodGhpcy5pZHMpIHtcclxuICAgICAgICB0aGlzLnN1YnNjcmliZShjb25zdHMoJ0tFWV9UT1BJQ19PUklHSU4nKSwgKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuc3Vic2NyaWJlKGNvbnN0cygnS0VZX1RBR19FWFBSRVNTSU9OJyksIHRoaXMub25UYWdFeHByKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIGlmIChyaC5fZGVidWcpIHtcclxuICAgICAgICByaC5fZCgnZXJyb3InLCAnZGF0YS10YWdzIHdpdGhvdXQgYW55IHRhZyBjb21iaW5hdGlvbicpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb25UYWdFeHByKHRhZ0V4cHJzKSB7XHJcbiAgICAgIGxldCBvcmlnaW4gPSB0aGlzLmdldChjb25zdHMoJ0tFWV9UT1BJQ19PUklHSU4nKSk7XHJcbiAgICAgIGlmICghdGhpcy5nZXQoJ3RhZ3MnKSkge1xyXG4gICAgICAgIHRoaXMudGFncyA9IF8udW5pb24odGhpcy5pZHMsIGlkID0+IF8uZ2V0VGFncyhpZCwgb3JpZ2luKSk7XHJcbiAgICAgICAgdGhpcy5wdWJsaXNoKCd0YWdzJywgdGhpcy50YWdzLmpvaW4oJywnKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCBhcHBseSA9ICFfLmFueSh0aGlzLmlkcywgaWQgPT4gXy5ldmFsVGFnRXhwcmVzc2lvbihpZCwgdGFnRXhwcnMsIG9yaWdpbikpO1xyXG4gICAgICB0aGlzLnRvZ2dsZUNsYXNzKGFwcGx5KTtcclxuICAgICAgaWYgKHRoaXMuY2xhc3NOYW1lICE9PSAncmgtaGlkZScpIHsgdGhpcy50b2dnbGVDbGljayhhcHBseSk7IH1cclxuICAgICAgcmV0dXJuIHRoaXMuYXBwbGllZCA9IGFwcGx5O1xyXG4gICAgfVxyXG5cclxuICAgIHRvZ2dsZUNsYXNzKGFwcGx5KSB7XHJcbiAgICAgIGlmIChhcHBseSkge1xyXG4gICAgICAgIGlmICghdGhpcy5hcHBsaWVkKSB7IHJldHVybiAkLmFkZENsYXNzKHRoaXMubm9kZSwgdGhpcy5jbGFzc05hbWUpOyB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuICQucmVtb3ZlQ2xhc3ModGhpcy5ub2RlLCB0aGlzLmNsYXNzTmFtZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0b2dnbGVDbGljayhhZGRFdmVudCkge1xyXG4gICAgICBpZiAoYWRkRXZlbnQpIHtcclxuICAgICAgICBpZiAoIXRoaXMuYXBwbGllZCkgeyByZXR1cm4gXy5hZGRFdmVudExpc3RlbmVyKHRoaXMubm9kZSwgJ2NsaWNrJywgdGhpcy5wcmV2ZW50Q2xpY2spOyB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHRoaXMuYXBwbGllZCkgeyByZXR1cm4gXy5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMubm9kZSwgJ2NsaWNrJywgdGhpcy5wcmV2ZW50Q2xpY2spOyB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvbkhvdmVyKCkge1xyXG4gICAgICByZXR1cm4gJC5hZGRDbGFzcyh0aGlzLm5vZGUsIHRoaXMuaG92ZXJDbGFzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgb25Nb3VzZU91dCgpIHtcclxuICAgICAgcmV0dXJuICQucmVtb3ZlQ2xhc3ModGhpcy5ub2RlLCB0aGlzLmhvdmVyQ2xhc3MpO1xyXG4gICAgfVxyXG5cclxuICAgIGFwcGVuZE5vZGUoc3VwTm9kZSkge1xyXG4gICAgICBsZXQgcGFyZW50Tm9kZSA9IHRoaXMubm9kZTtcclxuICAgICAgbGV0IHNpYmxpbmcgPSBudWxsO1xyXG4gICAgICBpZiAobm9uVGV4dE5vZGVzLmluZGV4T2YodGhpcy5ub2RlLm5vZGVOYW1lKSAhPT0gLTEpIHtcclxuICAgICAgICAoeyBwYXJlbnROb2RlIH0gPSB0aGlzLm5vZGUpO1xyXG4gICAgICAgIHNpYmxpbmcgPSB0aGlzLm5vZGUubmV4dFNpYmxpbmc7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHNpYmxpbmcpIHtcclxuICAgICAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZShzdXBOb2RlLCBzaWJsaW5nKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBwYXJlbnROb2RlLmFwcGVuZENoaWxkKHN1cE5vZGUpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzLnJlc29sdmVEYXRhQXR0cnMoc3VwTm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QXB0TmFtZXMoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN1YnNjcmliZSgndGFncycsICgpID0+IHtcclxuICAgICAgICBsZXQgZGF0YSA9IFtdO1xyXG4gICAgICAgIF8uZWFjaCh0aGlzLnRhZ3MsIChjdXJyZW50LCBpZHgpID0+IGRhdGEucHVzaChjdXJyZW50LnJlcGxhY2UoXCJhdHRfc2VwXCIsIFwiOlwiKSkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnB1Ymxpc2goJ3Nob3d0YWdzJywgZGF0YS5qb2luKCcsJykpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVUYWdOb2RlKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdWJzY3JpYmUoY29uc3RzKCdLRVlfU0hPV19UQUdTJyksICBzaG93VGFncyA9PiB7XHJcbiAgICAgICAgaWYgKCFzaG93VGFncyB8fCAoJC5maW5kKHRoaXMubm9kZSwgYHN1cC4ke3RoaXMuc3VwQ2xhc3N9YCkubGVuZ3RoID4gMCkpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgbGV0IHN1cE5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdXAnKTtcclxuICAgICAgICAodGhpcy5nZXRBcHROYW1lcykoKTtcclxuICAgICAgICAkLnNldEF0dHJpYnV0ZShzdXBOb2RlLCAnZGF0YS10ZXh0JywgJ3Nob3d0YWdzJyk7XHJcbiAgICAgICAgJC5zZXRBdHRyaWJ1dGUoc3VwTm9kZSwgJ2RhdGEtbW91c2VvdmVyJywgJ3RoaXMub25Ib3ZlcigpJyk7XHJcbiAgICAgICAgJC5zZXRBdHRyaWJ1dGUoc3VwTm9kZSwgJ2RhdGEtbW91c2VvdXQnLCAndGhpcy5vbk1vdXNlT3V0KCknKTtcclxuICAgICAgICAkLnNldEF0dHJpYnV0ZShzdXBOb2RlLCAnY2xhc3MnLCB0aGlzLnN1cENsYXNzKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5hcHBlbmROb2RlKHN1cE5vZGUpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG4gIENvbnRlbnRGaWx0ZXIuaW5pdENsYXNzKCk7XHJcbiAgcmV0dXJuIENvbnRlbnRGaWx0ZXI7XHJcbn0pKCk7XHJcblxyXG53aW5kb3cucmgud2lkZ2V0cy5Db250ZW50RmlsdGVyID0gQ29udGVudEZpbHRlcjtcclxuIiwiLypcclxuIEhlbHAgZm9yIEVkd2lkZ2V0XHJcbiovXHJcblxyXG5sZXQgeyBlZFdpZGdldCB9ID0gd2luZG93LnJoO1xyXG5cclxuLypcclxuIFRhYiBlZHdpZGdldFxyXG4qL1xyXG5lZFdpZGdldCgndGFiJywge1xyXG4gIGF0dHJzOiB7XHJcbiAgICAnZGF0YS10YWJsZSc6ICdkYXRhJyxcclxuICAgICdkYXRhLXJod2lkZ2V0JzogJ0Jhc2ljJyxcclxuICAgICdkYXRhLW91dHB1dCc6ICdkYXRhOiBlZHcuZGF0YS4je0BpbmRleH0nLFxyXG4gICAgY2xhc3M6ICdwcmludC1vbmx5J1xyXG4gIH0sXHJcbiAgdmlldzoge1xyXG4gICAgdGFnOiAnZGl2JyxcclxuICAgIGF0dHJzOiB7XHJcbiAgICAgICdkYXRhLXJod2lkZ2V0JzogJ0Jhc2ljOiBpbmNsdWRlOiBlZHdpZGdldHMvdGFiL3RhYkxheW91dC5qcycsXHJcbiAgICAgICdkYXRhLWlucHV0JzogJ2RhdGE6IGVkdy5kYXRhLiN7QGluZGV4fSdcclxuICAgIH0sXHJcbiAgICBtb2RlbDoge1xyXG4gICAgICB0YWI6ICcwJ1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG4pO1xyXG5cclxuLypcclxuIEdhbGxhcnkgZWR3aWRnZXRcclxuKi9cclxuLy9lZFdpZGdldCAnR2FsbGFyeSciLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5sZXQgeyAkIH0gPSByaDtcclxubGV0IHsgXyB9ID0gcmg7XHJcbmxldCB7IGNvbnN0cyB9ID0gcmg7XHJcblxyXG52YXIgRWR3aWRnZXQgPSAoZnVuY3Rpb24oKSB7XHJcbiAgbGV0IHZhbHVlU2VwZXJhdG9yID0gdW5kZWZpbmVkO1xyXG4gIEVkd2lkZ2V0ID0gY2xhc3MgRWR3aWRnZXQge1xyXG4gICAgc3RhdGljIGluaXRDbGFzcygpIHtcclxuICAgICAgdmFsdWVTZXBlcmF0b3IgPSB7XHJcbiAgICAgICAgJ2RhdGEtcmh3aWRnZXQnOiAnOycsXHJcbiAgICAgICAgY2xhc3M6ICcgJ1xyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKG5vZGUsIGluZGV4LCBhcmcpIHtcclxuICAgICAgdGhpcy5ub2RlID0gbm9kZTtcclxuICAgICAgdGhpcy5pbmRleCA9IGluZGV4O1xyXG4gICAgICBsZXQge3ZpZXcsIGF0dHJzLCBtb2RlbCwgYXJnTW9kZWx9ID0gdGhpcy5wYXJzZUFyZyhhcmcpO1xyXG4gICAgICBpZiAoYXR0cnMpIHsgdGhpcy5zZXRBdHRyaWJ1dGVzKHRoaXMubm9kZSwgYXR0cnMpOyB9XHJcbiAgICAgIGlmIChtb2RlbCkgeyB0aGlzLnNldE1vZGVsQXJnKHRoaXMubm9kZSwgXy5leHRlbmQoe30sIG1vZGVsLCBhcmdNb2RlbCkpOyB9XHJcbiAgICAgIGlmICh2aWV3KSB7IHRoaXMuY3JlYXRlVmlldyh2aWV3LCBhcmdNb2RlbCk7IH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgcGFyc2VBcmcoYXJnKSB7XHJcbiAgICAgIGxldCBhcmdNb2RlbCwgYXR0cnMsIGNvbmZpZywgbW9kZWwsIHZpZXc7XHJcbiAgICAgIGxldCB7d05hbWUsIHdBcmcsIHBpcGVkQXJnc30gPSBhcmc7XHJcbiAgICAgIGlmIChjb25maWcgPSByaC5lZFdpZGdldCh3TmFtZSkpIHtcclxuICAgICAgICBsZXQgdmFycztcclxuICAgICAgICAoe3ZpZXcsIGF0dHJzLCB2YXJzLCBtb2RlbH0gPSBjb25maWcpO1xyXG4gICAgICAgIGFyZ01vZGVsID0gXy5yZXNvbHZlTmljZUpTT04ocGlwZWRBcmdzLnNoaWZ0KCkpO1xyXG4gICAgICAgIHRoaXMudmFycyA9IF8uZXh0ZW5kKHt9LCB2YXJzLCB3QXJnKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4ge3ZpZXcsIGF0dHJzLCBtb2RlbCwgYXJnTW9kZWx9O1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZVZpZXcodmlldywgYXJnTW9kZWwpIHtcclxuICAgICAgbGV0IHZpZXdNb2RlbCA9IF8uZXh0ZW5kKHt9LCB2aWV3Lm1vZGVsLCBhcmdNb2RlbCk7XHJcbiAgICAgIGxldCB2aWV3Tm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodmlldy50YWcgfHwgJ2RpdicpO1xyXG4gICAgICBpZiAodmlldy5hdHRycykgeyB0aGlzLnNldEF0dHJpYnV0ZXModmlld05vZGUsIHZpZXcuYXR0cnMpOyB9XHJcbiAgICAgIHRoaXMuc2V0TW9kZWxBcmcodmlld05vZGUsIHZpZXdNb2RlbCk7XHJcbiAgICAgIHJldHVybiB0aGlzLm5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodmlld05vZGUsIHRoaXMubm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0QXR0cmlidXRlcyhub2RlLCBhdHRycykge1xyXG4gICAgICByZXR1cm4gXy5lYWNoKGF0dHJzLCBmdW5jdGlvbih2YWx1ZSwgYXR0cikge1xyXG4gICAgICAgIHJldHVybiAkLnNldEF0dHJpYnV0ZShub2RlLCBhdHRyLCB0aGlzLnJlc29sdmVWYWx1ZSh0aGlzLm1lcmdlZFZhbHVlKG5vZGUsIGF0dHIsIHZhbHVlKSkpO1xyXG4gICAgICB9XHJcbiAgICAgICwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0TW9kZWxBcmcobm9kZSwgbW9kZWwpIHtcclxuICAgICAgaWYgKCFfLmlzRW1wdHlPYmplY3QobW9kZWwpKSB7XHJcbiAgICAgICAgbGV0IGpzb25TdHJpbmcgPSB0aGlzLnJlc29sdmVWYWx1ZShKU09OLnN0cmluZ2lmeShtb2RlbCkpO1xyXG4gICAgICAgIHJldHVybiAkLmRhdGFzZXQobm9kZSwgJ3Jod2lkZ2V0JyxcclxuICAgICAgICAgIGAkeyQuZGF0YXNldChub2RlLCAncmh3aWRnZXQnKSB8fCAnQmFzaWMnfSB8ICR7anNvblN0cmluZ31gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1lcmdlZFZhbHVlKG5vZGUsIGF0dHJpYiwgdmFsdWUpIHtcclxuICAgICAgbGV0IG9sZFZhbHVlLCBzZXBlcmF0b3I7XHJcbiAgICAgIGlmICghKHNlcGVyYXRvciA9IHZhbHVlU2VwZXJhdG9yW2F0dHJpYl0pKSB7IHJldHVybiB2YWx1ZTsgfVxyXG4gICAgICBpZiAoKG9sZFZhbHVlID0gJC5nZXRBdHRyaWJ1dGUobm9kZSwgYXR0cmliKSB8fCAnJykpIHtcclxuICAgICAgICByZXR1cm4gYCR7b2xkVmFsdWV9JHtzZXBlcmF0b3J9JHt2YWx1ZX1gO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlc29sdmVWYWx1ZSh2YWx1ZSkge1xyXG4gICAgICByZXR1cm4gXy5yZXNvbHZlRW5jbG9zZWRWYXIodmFsdWUsIHZhck5hbWUgPT4ge1xyXG4gICAgICAgIHN3aXRjaCAodmFyTmFtZSkge1xyXG4gICAgICAgICAgY2FzZSAndGhpcyc6XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnZhcnMpO1xyXG4gICAgICAgICAgY2FzZSAnQGluZGV4JzpcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5kZXg7XHJcbiAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy52YXJzW3Zhck5hbWVdO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgRWR3aWRnZXQuaW5pdENsYXNzKCk7XHJcbiAgcmV0dXJuIEVkd2lkZ2V0O1xyXG59KSgpO1xyXG5cclxuLypcclxuICA8ZGl2IGRhdGEtZWR3aWRnZXQ9XCJUYWI6IDxuYW1lPjogPHN0cmluZyB2YWx1ZT4sIDxuYW1lPjogPHN0cmluZyB2YWx1ZT5cclxuICAgfCA8anNvbiBvciBuaWNlSlNPTj5cIj48L2Rpdj5cclxuKi9cclxuXHJcbnJoLm1vZGVsLnN1YnNjcmliZShjb25zdHMoJ0VWVF9XSURHRVRfQkVGT1JFTE9BRCcpLCAoKSA9PlxyXG4gIF8uZWFjaCgkLmZpbmQoZG9jdW1lbnQsICdbZGF0YS1lZHdpZGdldF0nKSwgZnVuY3Rpb24obm9kZSwgaW5kZXgpIHtcclxuICAgIGxldCBhcmdzID0gXy5yZXNvbHZlV2lkZ2V0QXJncygkLmRhdGFzZXQobm9kZSwgJ2Vkd2lkZ2V0JykpO1xyXG4gICAgXy5lYWNoKGFyZ3MsIGFyZyA9PiBuZXcgRWR3aWRnZXQobm9kZSwgaW5kZXgsIGFyZykpO1xyXG4gICAgcmV0dXJuICQuZGF0YXNldChub2RlLCAnZWR3aWRnZXQnLCBudWxsKTtcclxuICB9KVxyXG4pO1xyXG5cclxucmguZWRXaWRnZXQgPSBfLmNhY2hlKF8uaXNPYmplY3QpO1xyXG4iLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5sZXQgeyBfIH0gPSByaDtcclxubGV0IHsgJCB9ID0gcmg7XHJcbmxldCB7IGNvbnN0cyB9ID0gcmg7XHJcbmxldCB7IG1vZGVsIH0gPSByaDtcclxuXHJcbl8uaG9va0NsaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcclxuICBsZXQgaHJlZjtcclxuICBpZiAoJ2J1dHRvbicgaW4gZXZlbnQgJiYgKGV2ZW50LmJ1dHRvbiAhPT0gMCkpIHsgcmV0dXJuOyB9XHJcbiAgaWYgKGV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHsgcmV0dXJuOyB9XHJcbiAgXHJcbiAgbGV0IHsgYm9keSB9ID0gZG9jdW1lbnQ7XHJcbiAgbGV0IG5vZGUgPSBldmVudC50YXJnZXQ7XHJcbiAgd2hpbGUgKHRydWUpIHtcclxuICAgIGlmICghbm9kZSB8fCAobm9kZSA9PT0gZG9jdW1lbnQpKSB7IGJyZWFrOyB9XHJcbiAgICBocmVmID0gJC5nZXRBdHRyaWJ1dGUobm9kZSwgJ2hyZWYnKTtcclxuICAgIGlmIChocmVmKSB7IGJyZWFrOyB9XHJcbiAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xyXG4gIH1cclxuICBpZiAoIWhyZWYpIHsgcmV0dXJuOyB9XHJcbiAgaHJlZiA9IGRlY29kZVVSSShocmVmKTtcclxuICBsZXQgbW9iaWxlQXBwTW9kZSA9IG1vZGVsLmdldChjb25zdHMoJ0tFWV9NT0JJTEVfQVBQX01PREUnKSk7XHJcblxyXG4gIGxldCB0YXJnZXQgPSAkLmdldEF0dHJpYnV0ZShub2RlLCAndGFyZ2V0Jyk7XHJcbiAgaWYgKHRhcmdldCAmJiAodGFyZ2V0ICE9PSAnX3NlbGYnKSAmJiAhbW9iaWxlQXBwTW9kZSkgeyByZXR1cm47IH1cclxuICBcclxuICBpZiAoKGhyZWZbMF0gPT09ICcjJykgJiYgXy5pc1Jvb3RVcmwoKSkge1xyXG4gICAgaWYgKGhyZWYubGVuZ3RoID4gMSkge1xyXG4gICAgICBsZXQgYm9va21hcmtLZXkgPSBgJHtjb25zdHMoJ0VWVF9CT09LTUFSSycpfSR7aHJlZn1gO1xyXG4gICAgICBpZiAobW9kZWwuaXNTdWJzY3JpYmVkKGJvb2ttYXJrS2V5KSkge1xyXG4gICAgICAgIG1vZGVsLnB1Ymxpc2goYm9va21hcmtLZXksICcnKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBtb2RlbC5wdWJsaXNoKGNvbnN0cygnRVZUX05BVklHQVRFX1RPX1VSTCcpLFxyXG4gICAgICAgICAge2Fic1VybDogYCR7KF8uZ2V0Um9vdFVybCkoKX0ke2hyZWZ9YH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gXy5wcmV2ZW50RGVmYXVsdChldmVudCk7XHJcbiAgfSBlbHNlIGlmIChfLmlzVmFsaWRGaWxlVXJsKGhyZWYpKSB7XHJcbiAgICBsZXQgYWJzVXJsO1xyXG4gICAgaWYgKF8uaXNSZWxhdGl2ZVVybChocmVmKSkgeyBhYnNVcmwgPSB3aW5kb3cuX2dldEZ1bGxQYXRoKF8ucGFyZW50UGF0aCgpLCBocmVmKTsgfVxyXG4gICAgaWYgKGFic1VybCA9PSBudWxsKSB7IGFic1VybCA9IGhyZWY7IH1cclxuXHJcbiAgICBpZiAoKG1vYmlsZUFwcE1vZGUgfHwgIXRhcmdldCkgJiYgIV8uaXNVcmxBbGxvd2RJbklmcmFtZShhYnNVcmwpKSB7XHJcbiAgICAgIHJldHVybiAkLnNldEF0dHJpYnV0ZShub2RlLCAndGFyZ2V0JywgJ19ibGFuaycpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbW9kZWwucHVibGlzaChjb25zdHMoJ0VWVF9OQVZJR0FURV9UT19VUkwnKSwge2Fic1VybH0pO1xyXG4gICAgICBpZiAoIXRhcmdldCkgeyByZXR1cm4gXy5wcmV2ZW50RGVmYXVsdChldmVudCk7IH1cclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4iLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5sZXQgeyBjb25zdHMgfSA9IHJoO1xyXG5cclxuLy8gUHJvamVjdCBzcGVjaWZpYyBtb2RlbCBrZXlzXHJcbmNvbnN0cygnS0VZX1BST0pFQ1RfVE9QSUNMSVNUJywgICAgICAgICAgJy5wLnRvcGljbGlzdCcpO1xyXG5jb25zdHMoJ0tFWV9QUk9KRUNUX0JSU0xJU1QnLCAgICAgICAgICAgICcucC5icnNsaXN0Jyk7XHJcbmNvbnN0cygnS0VZX1BST0pFQ1RfVEFHX0NPTUJJTkFUSU9OUycsICAgJy5wLnRhZ19jb21iaW5hdGlvbnMnKTtcclxuY29uc3RzKCdLRVlfUFJPSkVDVF9UQUdfU1RBVEVTJywgICAgICAgICAnLnAudGFnX3N0YXRlcycpO1xyXG5jb25zdHMoJ0tFWV9NRVJHRURfRklMVEVSX0tFWScsICAgICAgICAgICcucC50YWdzJyk7XHJcbmNvbnN0cygnS0VZX1BST0pFQ1RfRklMVEVSX0NBUFRJT04nLCAgICAgJy5wLmZpbHRlcl9jYXB0aW9uJyk7XHJcbmNvbnN0cygnS0VZX1BST0pFQ1RfRklMVEVSX1RZUEUnLCAgICAgICAgJy5wLmZpbHRlcl90eXBlJyk7XHJcbmNvbnN0cygnS0VZX1BST0pFQ1RfTElTVCcsICAgICAgICAgICAgICAgJy5wLnByb2plY3RzJyk7XHJcbmNvbnN0cygnS0VZX01BU1RFUl9QUk9KRUNUX0xJU1QnLCAgICAgICAgJy5wLm1hc3RlcnByb2plY3RzJyk7XHJcbmNvbnN0cygnS0VZX1NFQVJDSF9SRVNVTFRTJywgICAgICAgICAgICAgJy5wLnNlYXJjaHJlc3VsdHMnKTtcclxuY29uc3RzKCdLRVlfU0VBUkNIX1JFU1VMVF9QQVJBTVMnLCAgICAgICAnLnAuc2VhcmNocmVzdWx0cGFyYW1zJyk7XHJcbmNvbnN0cygnS0VZX09OU0VBUkNIX1RBR19TVEFURVMnLCAgICAgICAgJy5wLm9uc2VhcmNodGFnc3RhdGVzJyk7XHJcbmNvbnN0cygnS0VZX0xORycsICAgICAgICAgICAgICAgICAgICAgICAgJy5wLmxuZ19kYicpO1xyXG5jb25zdHMoJ0tFWV9ERUZBVUxUX0ZJTFRFUicsICAgICAgICAgICAgICcucC5kZWZmaWx0ZXInKTtcclxuY29uc3RzKCdQUk9KRUNUX0dMT1NTQVJZX0RBVEEnLCAgICAgICAgICAnLnAuZ2xvZGF0YScpO1xyXG5jb25zdHMoJ1BST0pFQ1RfSU5ERVhfREFUQScsICAgICAgICAgICAgICcucC5pZHhkYXRhJyk7XHJcblxyXG4vLyBNZXJnZWQgUHJvamVjdCBzcGVjaWZpY1xyXG5jb25zdHMoJ0tFWV9NRVJHRURfUFJPSkVDVF9NQVAnLCAgICAgICAgICcubXAudG1hcCcpO1xyXG5cclxuLy8gVG9waWMgc3BlY2lmaWMgbW9kZWwga2V5c1xyXG5jb25zdHMoJ0tFWV9UT1BJQ19VUkwnLCAgICAgICAgICAgICAgICAgJy50LnRvcGljdXJsJyk7XHJcbmNvbnN0cygnS0VZX1RPUElDX0lEJywgICAgICAgICAgICAgICAgICAnLnQudG9waWNpZCcpO1xyXG5jb25zdHMoJ0tFWV9UT1BJQ19USVRMRScsICAgICAgICAgICAgICAgJy50LnRvcGljdGl0bGUnKTtcclxuY29uc3RzKCdLRVlfVE9QSUNfQlJTTUFQJywgICAgICAgICAgICAgICcudC5icnNtYXAnKTtcclxuY29uc3RzKCdLRVlfVE9QSUNfT1JJR0lOJywgICAgICAgICAgICAgICcudC5vcmlnaW4nKTtcclxuY29uc3RzKCdLRVlfVE9QSUNfSEVJR0hUJywgICAgICAgICAgICAgICcudC50b3BpY19oZWlnaHQnKTtcclxuXHJcbi8vIExheW91dCBzcGVjaWZpYyBtb2RlbCBrZXlzXHJcbmNvbnN0cygnS0VZX1NFQVJDSF9URVJNJywgICAgICAgICAgICAgICAnLmwuc2VhcmNodGVybScpO1xyXG5jb25zdHMoJ0tFWV9TRUFSQ0hFRF9URVJNJywgICAgICAgICAgICAgJy5sLnNlYXJjaGVkX3Rlcm0nKTtcclxuY29uc3RzKCdLRVlfVEFHX0VYUFJFU1NJT04nLCAgICAgICAgICAgICcubC50YWdfZXhwcmVzc2lvbicpO1xyXG5jb25zdHMoJ0tFWV9VSV9NT0RFJywgICAgICAgICAgICAgICAgICAgJy5sLnVpbW9kZScpOyAgICAgICAgICAgIC8vIFJIMTFcclxuY29uc3RzKCdLRVlfQkFTRV9JRlJBTUVfTkFNRScsICAgICAgICAgICcubC5iYXNlX2lmcmFtZV9uYW1lJyk7XHJcbmNvbnN0cygnS0VZX0NBTl9IQU5ETEVfU0VSQ0gnLCAgICAgICAgICAnLmwuY2FuX2hhbmRsZV9zZWFyY2gnKTsgLy8gUkgxMVxyXG5jb25zdHMoJ0tFWV9DQU5fSEFORExFX1NFQVJDSCcsICAgICAgICAgJy5sLmNhbl9oYW5kbGVfc2VhcmNoJyk7XHJcbmNvbnN0cygnS0VZX0NTSF9NT0RFJywgICAgICAgICAgICAgICAgICAnLmwuY3NoX21vZGUnKTtcclxuY29uc3RzKCdLRVlfT05TRUFSQ0hfVEFHX0VYUFInLCAgICAgICAgICcubC5vbnNlYXJjaHRhZ2V4cHInKTtcclxuY29uc3RzKCdLRVlfQU5EX1NFQVJDSCcsICAgICAgICAgICAgICAgICcubC5hbmRzZWFyY2gnKTtcclxuY29uc3RzKCdLRVlfRkVBVFVSRScsICAgICAgICAgICAgICAgICAgICcubC5mZWF0dXJlcycpO1xyXG5jb25zdHMoJ0tFWV9TRUFSQ0hfUFJPR1JFU1MnLCAgICAgICAgICAgJy5sLnNlYXJjaF9wcm9ncmVzcycpO1xyXG5jb25zdHMoJ0tFWV9MQVlPVVRfVkVSU0lPTicsICAgICAgICAgICAgJy5sLmxheW91dF92ZXJzaW9uJyk7XHJcbmNvbnN0cygnS0VZX1RPUElDX0lOX0lGUkFNRScsICAgICAgICAgICAnLmwudG9waWNfaW5faWZyYW1lJyk7XHJcbmNvbnN0cygnS0VZX1NIT1dfVEFHUycsICAgICAgICAgICAgICAgICAnLmwuc2hvd3RhZ3MnKTtcclxuY29uc3RzKCdLRVlfRElSJywgICAgICAgICAgICAgICAgICAgICAgICcubC5kaXInKTtcclxuY29uc3RzKCdLRVlfU0VBUkNIX0xPQ0FUSU9OJywgICAgICAgICAgICcubC5zZWFyY2hfbG9jYXRpb24nKTtcclxuY29uc3RzKCdLRVlfREVGQVVMVF9TRUFSQ0hfTE9DQVRJT04nLCAgICcubC5kZWZhdWx0X3NlYXJjaF9sb2NhdGlvbicpO1xyXG5jb25zdHMoJ0tFWV9GSUxURVJfTE9DQVRJT04nLCAgICAgICAgICAgJy5sLmZpbHRlcl9sb2NhdGlvbicpO1xyXG5jb25zdHMoJ0tFWV9BQ1RJVkVfVEFCJywgICAgICAgICAgICAgICAgJy5sLmFjdGl2ZV90YWInKTtcclxuY29uc3RzKCdLRVlfREVGQVVMVF9UQUInLCAgICAgICAgICAgICAgICcubC5kZWZhdWx0X3RhYicpO1xyXG5jb25zdHMoJ0tFWV9BQ1RJVkVfVE9QSUNfVEFCJywgICAgICAgICAgJy5sLmFjdGl2ZV90b3BpY190YWInKTtcclxuY29uc3RzKCdLRVlfVE9DX0RSSUxMX0RPV04nLCAgICAgICAgICAgICcubC50b2NfZHJpbGxkb3duJyk7XHJcbmNvbnN0cygnS0VZX01PQklMRV9UT0NfRFJJTExfRE9XTicsICAgICAnLmwubW9iaWxlX3RvY19kcmlsbGRvd24nKTtcclxuY29uc3RzKCdLRVlfUFVCTElTSF9NT0RFJywgICAgICAgICAgICAgICcubC5wdWJsaXNoX21vZGUnKTtcclxuY29uc3RzKCdLRVlfUFVCTElTSF9CQVNFX1VSTCcsICAgICAgICAgICcubC5wdWJsaXNoX2Jhc2VfdXJsJyk7XHJcbmNvbnN0cygnS0VZX1BST0pFQ1RTX0JBU0VfVVJMJywgICAgICAgICAnLmwucHJvamVjdHNfYmFzZV91cmwnKTtcclxuY29uc3RzKCdLRVlfSU5ERVhfRklMVEVSJywgICAgICAgICAgICAgICcubC5pZHhmaWx0ZXInKTtcclxuXHJcbi8vIEV2ZW50c1xyXG5jb25zdHMoJ0VWVF9CQVNFX0lGUkFNRV9MT0FEJywgICAgICAgICAgICcuZS5iYXNlX2lmcmFtZV9sb2FkJyk7XHJcbmNvbnN0cygnRVZUX1NDUk9MTF9UT19UT1AnLCAgICAgICAgICAgICAgJy5lLnNjcm9sbF90b190b3AnKTtcclxuY29uc3RzKCdFVlRfU0VBUkNIX1RFUk0nLCAgICAgICAgICAgICAgICAnLmUuc2VhcmNoX3Rlcm0nKTtcclxuY29uc3RzKCdFVlRfTkFWSUdBVEVfVE9fVVJMJywgICAgICAgICAgICAnLmUubmF2aWdhdGVfdG9fdXJsJyk7XHJcbmNvbnN0cygnRVZUX1BST0pFQ1RfTE9BREVEJywgICAgICAgICAgICAgJy5lLnByb2plY3RfbG9hZGVkJyk7XHJcbmNvbnN0cygnRVZUX1RPQ19MT0FERUQnLCAgICAgICAgICAgICAgICAgJy5lLnRvY19sb2FkZWQnKTtcclxuY29uc3RzKCdFVlRfVE9QSUNfTE9BREVEJywgICAgICAgICAgICAgICAnLmUudG9waWNfbG9hZGVkJyk7XHJcbmNvbnN0cygnRVZUX1RPUElDX0xPQURJTkcnLCAgICAgICAgICAgICAgJy5lLnRvcGljX2xvYWRpbmcnKTtcclxuY29uc3RzKCdFVlRfQk9PS01BUksnLCAgICAgICAgICAgICAgICAgICAnLmUuYm9va21hcmsuJyk7XHJcbmNvbnN0cygnRVZUX1BSSU5UX1RPUElDJywgICAgICAgICAgICAgICAgJy5lLnByaW50X3RvcGljJyk7XHJcbmNvbnN0cygnRVZUX1NFQVJDSF9JTl9QUk9HUkVTUycsICAgICAgICAgJy5lLnNlYXJjaF9pbl9wcm9ncmVzcycpO1xyXG5jb25zdHMoJ0VWVF9SRUxPQURfVE9QSUMnLCAgICAgICAgICAgICAgICcuZS5yZWxvYWRfdG9waWMnKTtcclxuY29uc3RzKCdFVlRfUVVFUllfU0VBUkNIX1JFU1VMVFMnLCAgICAgICAnLmUucXVlcnlfc2VhcmNoX3Jlc3VsdHMnKTtcclxuY29uc3RzKCdFVlRfTE9BRF9JRFgnLCAgICAgICAgICAgICAgICAgICAnLmUubG9hZF9pZHgnKTtcclxuY29uc3RzKCdFVlRfTE9BRF9HTE8nLCAgICAgICAgICAgICAgICAgICAnLmUubG9hZF9nbG8nKTtcclxuXHJcbi8vIEhhc2ggYW5kIHF1ZXJ5IGtleXNcclxuY29uc3RzKCdIQVNIX0tFWV9SSF9ISUdITElHSFQnLCAgICAgICAgICAncmhobHRlcm0nKTtcclxuY29uc3RzKCdIQVNIX0tFWV9SSF9TWU5TJywgICAgICAgICAgICAgICAncmhzeW5zJyk7XHJcbmNvbnN0cygnSEFTSF9LRVlfUkhfU0VBUkNIJywgICAgICAgICAgICAgJ3Joc2VhcmNoJyk7XHJcbmNvbnN0cygnSEFTSF9LRVlfUkhfVE9DSUQnLCAgICAgICAgICAgICAgJ3JodG9jaWQnKTtcclxuXHJcbi8vIEhhc2gga2V5c1xyXG5jb25zdHMoJ0hBU0hfS0VZX1RPUElDJywgICAgICAgICAgICAgICAgICd0Jyk7XHJcbmNvbnN0cygnSEFTSF9LRVlfVUlNT0RFJywgICAgICAgICAgICAgICAgJ3V4Jyk7XHJcbmNvbnN0cygnSEFTSF9LRVlfUkFORE9NJywgICAgICAgICAgICAgICAgJ3JhbmRvbScpO1xyXG5cclxuY29uc3RzKCdQQVRIX1BST0pFQ1RfVEFHREFUQV9GSUxFJywgICAgICAnd2h4ZGF0YS93aHRhZ2RhdGEuanMnKTtcclxuY29uc3RzKCdDT1JET1ZBX0pTX1VSTCcsICAgICAgICAgICAgICAgICAnY29yZG92YS5qcycpO1xyXG5jb25zdHMoJ1JIU19MT0dfVE9QSUNfVklFVycsICAgICAgICAgICAgICB7bWdyOiAnc3lzJywgY21kOiAnbG9ndHBjJ30pO1xyXG5jb25zdHMoJ1JIU19ET19TRUFSQ0gnLCAgICAgICAgICAgICAgICAgICB7bWdyOiAnYWdtJywgYWd0OiAnbmxzJywgY21kOiAnc2VhcmNoJ30pO1xyXG5jb25zdHMoJ0tFWV9NT0JJTEVfQVBQX01PREUnLCAgICAgICAgICAgJy5tLm1vYmlsZWFwcCcpO1xyXG4iLCJsZXQgeyByaCB9ID0gd2luZG93O1xyXG5sZXQgeyBfIH0gPSByaDtcclxubGV0IHsgbW9kZWwgfSA9IHJoO1xyXG5sZXQgeyBjb25zdHMgfSA9IHJoO1xyXG5cclxubGV0IEtFWV9NRVJHRURfUFJPSkVDVF9NQVAgPSBjb25zdHMoJ0tFWV9NRVJHRURfUFJPSkVDVF9NQVAnKTtcclxuXHJcbl8ucGFyc2VQcm9qZWN0TmFtZSA9IHByb2plY3QgPT4gcHJvamVjdC5yZXBsYWNlKC9cXC5cXC8vZywgJycpLnJlcGxhY2UoL1xcLiQvLCAnJykucmVwbGFjZSgvXFwvJC8sICcnKTtcclxuXHJcbl8ubWFwVGFnSW5kZXggPSBmdW5jdGlvbihpZHgsIHByb2plY3QpIHtcclxuICBpZiAocHJvamVjdCA9PSBudWxsKSB7IHByb2plY3QgPSAnJzsgfVxyXG4gIGlmIChpZHgpIHtcclxuICAgIHJldHVybiBpZHggKyAnKycgKyBwcm9qZWN0O1xyXG4gIH1cclxuICByZXR1cm4gaWR4O1xyXG59O1xyXG5cclxuXy5nZXRUYWdzID0gZnVuY3Rpb24oaWR4LCBwcm9qZWN0KSB7XHJcbiAgaWYgKHByb2plY3QgPT0gbnVsbCkgeyBwcm9qZWN0ID0gJyc7IH1cclxuICBpZiAoaWR4ID09IG51bGwpIHsgcmV0dXJuIGlkeDsgfVxyXG4gIGxldCBpZG1hcCA9IG1vZGVsLmdldChLRVlfTUVSR0VEX1BST0pFQ1RfTUFQKTtcclxuICBsZXQgbGVuID0gaWR4LmluZGV4T2YoJysnKTtcclxuICBpZiAobGVuICE9PSAtMSkge1xyXG4gICAgcHJvamVjdCA9IGlkeC5zdWJzdHJpbmcobGVuICsgMSwgaWR4Lmxlbmd0aCk7XHJcbiAgICBpZHggPSBpZHguc3Vic3RyaW5nKDAsIGxlbik7XHJcbiAgfVxyXG4gIHByb2plY3QgPSBfLnBhcnNlUHJvamVjdE5hbWUocHJvamVjdCk7XHJcbiAgaWYgKChpZG1hcFtwcm9qZWN0XSAhPSBudWxsID8gaWRtYXBbcHJvamVjdF1baWR4XSA6IHVuZGVmaW5lZCkgIT0gbnVsbCkgeyByZXR1cm4gaWRtYXBbcHJvamVjdF1baWR4XTsgfVxyXG4gIHJldHVybiBpZHg7XHJcbn07XHJcblxyXG5fLmdldFByb2plY3ROYW1lID0gZnVuY3Rpb24odXJsKSB7XHJcbiAgbGV0IGlkbWFwID0gbW9kZWwuZ2V0KEtFWV9NRVJHRURfUFJPSkVDVF9NQVApO1xyXG4gIGlmICgodXJsICE9IG51bGwpICYmIChpZG1hcCAhPSBudWxsKSkge1xyXG4gICAgdXJsID0gXy5wYXJlbnRQYXRoKHVybCk7XHJcbiAgICBsZXQgcmVsVXJsID0gXy5tYWtlUmVsYXRpdmVQYXRoKHVybCwgXy5nZXRIb3N0Rm9sZGVyKCkpO1xyXG4gICAgcmVsVXJsID0gXy5wYXJzZVByb2plY3ROYW1lKHJlbFVybCk7XHJcbiAgICB3aGlsZSAoKGlkbWFwW3JlbFVybF0gPT0gbnVsbCkpIHtcclxuICAgICAgbGV0IG4gPSByZWxVcmwubGFzdEluZGV4T2YoJy8nKTtcclxuICAgICAgaWYgKG4gPCAwKSB7XHJcbiAgICAgICAgcmVsVXJsID0gJyc7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgcmVsVXJsID0gcmVsVXJsLnN1YnN0cmluZygwLG4pO1xyXG4gICAgfVxyXG4gICAgdXJsID0gcmVsVXJsO1xyXG4gIH1cclxuICByZXR1cm4gdXJsO1xyXG59O1xyXG5cclxuXy5ldmFsVGFnRXhwcmVzc2lvbiA9IGZ1bmN0aW9uKGluZGV4LCBncm91cEV4cHJzLCBwcm9qZWN0KSB7XHJcbiAgaWYgKHByb2plY3QgPT0gbnVsbCkgeyBwcm9qZWN0ID0gJyc7IH1cclxuICBpZiAoIWdyb3VwRXhwcnMgfHwgKGdyb3VwRXhwcnMubGVuZ3RoID09PSAwKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gIFxyXG4gIGxldCB0YWdzID0gXy5nZXRUYWdzKGluZGV4LCBwcm9qZWN0KTtcclxuICBpZiAoIXRhZ3MgfHwgKHRhZ3MubGVuZ3RoID09PSAwKSkgeyByZXR1cm4gdHJ1ZTsgfVxyXG4gIFxyXG4gIC8vIFRPRE86IGZpeCBlbXB0eSBzdHJpbmcgaW4gcm9ib2hlbHBcclxuICBpZiAoKHRhZ3MubGVuZ3RoID09PSAxKSAmJiAoKHRhZ3NbMF0gPT09ICcnKSB8fCAodGFnc1swXSA9PT0gJyQnKSkpIHsgcmV0dXJuIHRydWU7IH1cclxuXHJcbiAgbGV0IHRydWVGbGFnID0gZmFsc2U7XHJcbiAgbGV0IGZhbHNlRmxhZyA9IF8uYW55KGdyb3VwRXhwcnMsIGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgIGlmIChfLmV2YWxNdWx0aXBsZVRhZ0V4cHJlc3Npb24oaXRlbS5jLCB0YWdzKSkge1xyXG4gICAgICB0cnVlRmxhZyA9IHRydWU7XHJcbiAgICB9IGVsc2UgaWYgKGl0ZW0uYy5sZW5ndGgpIHtcclxuICAgICAgaWYgKF8uZXZhbE11bHRpcGxlVGFnRXhwcmVzc2lvbihpdGVtLnUsIHRhZ3MpKSB7IHJldHVybiB0cnVlOyB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcbiAgXHJcbiAgaWYgKGZhbHNlRmxhZykgeyByZXR1cm4gZmFsc2U7IH0gZWxzZSB7IHJldHVybiB0cnVlRmxhZzsgfVxyXG59O1xyXG5cclxuXy5ldmFsTXVsdGlwbGVUYWdFeHByZXNzaW9uID0gKGV4cHJzLCB0YWdzKSA9PiBfLmFueShleHBycywgZXhwciA9PiBfLmV2YWxTaW5nbGVUYWdFeHByZXNzaW9uKGV4cHIsIHRhZ3MpKTtcclxuXHJcbl8uZXZhbFNpbmdsZVRhZ0V4cHJlc3Npb24gPSAoZnVuY3Rpb24oKSB7XHJcbiAgbGV0IGNhY2hlID0ge307XHJcbiAgbGV0IG9wZXJhdG9ycyA9IFsnJicsICd8JywgJyEnXTtcclxuICBsZXQgZXZhbEFuZCA9IGZ1bmN0aW9uKHN0YWNrKSB7XHJcbiAgICBsZXQgaXRlbXMgPSBzdGFjay5zcGxpY2Uoc3RhY2subGVuZ3RoIC0gMik7XHJcbiAgICByZXR1cm4gc3RhY2sucHVzaCgoaXRlbXNbMF0gPT09IDEpICYmIChpdGVtc1sxXSA9PT0gMSkgPyAxIDogMCk7XHJcbiAgfTtcclxuXHJcbiAgbGV0IGV2YWxPciA9IGZ1bmN0aW9uKHN0YWNrKSB7XHJcbiAgICBsZXQgaXRlbXMgPSBzdGFjay5zcGxpY2Uoc3RhY2subGVuZ3RoIC0gMik7XHJcbiAgICByZXR1cm4gc3RhY2sucHVzaCgoaXRlbXNbMF0gPT09IDEpIHx8IChpdGVtc1sxXSA9PT0gMSkgPyAxIDogMCk7XHJcbiAgfTtcclxuXHJcbiAgbGV0IGV2YWxOb3QgPSBmdW5jdGlvbihzdGFjaywgdGFncykge1xyXG4gICAgbGV0IGl0ZW1zID0gc3RhY2suc3BsaWNlKHN0YWNrLmxlbmd0aCAtIDEpO1xyXG4gICAgcmV0dXJuIHN0YWNrLnB1c2goaXRlbXNbMF0gPT09IDEgPyAwIDogMSk7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uKGV4cHIsIHRhZ3MpIHtcclxuICAgIGxldCBrZXkgPSBgJHtleHByfToke3RhZ3N9YDsgLy8gVE9ETzogbm93IHJvYm9oZWxwIHNob3VsZCBleHBvcnQgdGFncyBhcyBzdHJpbmdcclxuICAgIGxldCByZXN1bHQgPSBjYWNoZVtrZXldO1xyXG4gICAgaWYgKHJlc3VsdCAhPSBudWxsKSB7IHJldHVybiByZXN1bHQ7IH1cclxuXHJcbiAgICBsZXQgdG9rZW5zID0gXy5tYXAoZXhwci5zcGxpdCgnICcpLCBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgIGlmICgtMSAhPT0gb3BlcmF0b3JzLmluZGV4T2YoaXRlbSkpIHsgcmV0dXJuIGl0ZW07IH1cclxuICAgICAgaWYgKC0xID09PSB0YWdzLmluZGV4T2YoaXRlbSkpIHsgcmV0dXJuIDA7IH0gZWxzZSB7IHJldHVybiAxOyB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAodG9rZW5zLmxlbmd0aCA+IDEpIHtcclxuICAgICAgbGV0IHN0YWNrID0gW107XHJcbiAgICAgIGZvciAobGV0IHRva2VuIG9mIEFycmF5LmZyb20odG9rZW5zKSkge1xyXG4gICAgICAgIHN3aXRjaCAodG9rZW4pIHtcclxuICAgICAgICAgIGNhc2UgJyYnOiBldmFsQW5kKHN0YWNrKTsgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICd8JzogZXZhbE9yKHN0YWNrKTsgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICchJzogZXZhbE5vdChzdGFjayk7IGJyZWFrO1xyXG4gICAgICAgICAgZGVmYXVsdDogc3RhY2sucHVzaCh0b2tlbik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJlc3VsdCA9IHN0YWNrWzBdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVzdWx0ID0gdG9rZW5zWzBdO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gY2FjaGVba2V5XSA9IHJlc3VsdDtcclxuICB9O1xyXG59KSgpO1xyXG4iLCJcclxubGV0IHJoID0gd2luZG93LnJoO1xyXG5sZXQgXyA9IHJoLl87XHJcbmxldCBjb25zdHMgPSByaC5jb25zdHM7XHJcblxyXG5fLmdldEhvc3RGb2xkZXIgPSAoKCgpID0+IHtcclxuICBsZXQgaG9zdEZvbGRlcjtcclxuICBob3N0Rm9sZGVyID0gbnVsbDtcclxuICByZXR1cm4gKCkgPT4ge1xyXG4gICAgaWYgKGhvc3RGb2xkZXIgPT0gbnVsbCkge1xyXG4gICAgICBob3N0Rm9sZGVyID0gXy5pc0xvY2FsKCkgPyB3aW5kb3cuZ0hvc3RQYXRoIDogYCR7ZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2x9Ly8ke3dpbmRvdy5nSG9zdH0ke3dpbmRvdy5nSG9zdFBhdGh9YDtcclxuICAgIH1cclxuICAgIHJldHVybiBob3N0Rm9sZGVyO1xyXG4gIH07XHJcbn0pKSgpO1xyXG5cclxuXy5nZXRIb3N0RGF0YSA9IHJvb3RQYXRoID0+IHtcclxuICBsZXQgYWJzRm9sZGVyO1xyXG4gIGFic0ZvbGRlciA9IHdpbmRvdy5fZ2V0RnVsbFBhdGgoXy5wYXJlbnRQYXRoKCksIGAke3Jvb3RQYXRofS9gKTtcclxuICBpZiAod2luZG93Ll9pc0hUVFBVcmwoYWJzRm9sZGVyKSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgZ0hvc3Q6IHdpbmRvdy5fZ2V0SG9zdE5hbWVGcm9tVVJMKGFic0ZvbGRlciksXHJcbiAgICAgIGdIb3N0UGF0aDogd2luZG93Ll9nZXRQYXRoRnJvbVVSTChhYnNGb2xkZXIpXHJcbiAgICB9O1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBnSG9zdDogJycsXHJcbiAgICAgIGdIb3N0UGF0aDogYWJzRm9sZGVyXHJcbiAgICB9O1xyXG4gIH1cclxufTtcclxuXHJcbl8uZ2V0SGFzaE1hcEZvclJvb3QgPSAocmVsVXJsLCBiQ3NoKSA9PiB7XHJcbiAgbGV0IGhhc2hNYXA7XHJcbiAgbGV0IHVybGhhc2hNYXA7XHJcbiAgaWYgKGJDc2ggPT0gbnVsbCkge1xyXG4gICAgYkNzaCA9IG51bGw7XHJcbiAgfVxyXG4gIHJlbFVybCA9IF8uZml4UmVsYXRpdmVVcmwocmVsVXJsKTtcclxuICB1cmxoYXNoTWFwID0gXy51cmxQYXJhbXMoXy5leHRyYWN0UGFyYW1TdHJpbmcocmVsVXJsKSk7XHJcbiAgaWYgKGJDc2gpIHtcclxuICAgIHVybGhhc2hNYXBbY29uc3RzKCdSSE1BUElEJyldID0gbnVsbDtcclxuICAgIHVybGhhc2hNYXBbY29uc3RzKCdSSE1BUE5PJyldID0gbnVsbDtcclxuICB9XHJcbiAgaGFzaE1hcCA9IF8uZXh0ZW5kKF8udXJsUGFyYW1zKCksIHVybGhhc2hNYXApO1xyXG4gIGhhc2hNYXAgPSBfLmZpeEhhc2hNYXBGb3JSb290KGhhc2hNYXApO1xyXG4gIC8vaGFzaE1hcCA9IF8uYWRkUkhTUGFyYW1zKGhhc2hNYXApO1xyXG4gIHJldHVybiBoYXNoTWFwO1xyXG59O1xyXG5cclxuXy5nZXRQYXJhbXNGb3JSb290ID0gKHJlbFVybCwgYkNzaCkgPT4ge1xyXG4gIGxldCBxdWVyeU1hcDtcclxuICBsZXQgcXVlcnlTdHJpbmc7XHJcbiAgaWYgKGJDc2ggPT0gbnVsbCkge1xyXG4gICAgYkNzaCA9IG51bGw7XHJcbiAgfVxyXG4gIHF1ZXJ5TWFwID0gXy5nZXRIYXNoTWFwRm9yUm9vdChyZWxVcmwsIGJDc2gpO1xyXG4gIHF1ZXJ5U3RyaW5nID0gXy5tYXBUb0VuY29kZWRTdHJpbmcocXVlcnlNYXApO1xyXG4gIGlmIChxdWVyeVN0cmluZy5sZW5ndGggPT09IDApIHtcclxuICAgIHJldHVybiAnJztcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGA/JHtxdWVyeVN0cmluZ31gO1xyXG4gIH1cclxufTtcclxuXHJcbl8uaXNSb290VXJsID0gYWJzVXJsID0+IHtcclxuICBsZXQgZmlsZU5hbWU7XHJcbiAgbGV0IGZpbGVQYXRoO1xyXG4gIGxldCByb290VXJsO1xyXG4gIGlmIChhYnNVcmwgPT0gbnVsbCkge1xyXG4gICAgYWJzVXJsID0gZGVjb2RlVVJJKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYpO1xyXG4gIH1cclxuICByb290VXJsID0gXy5nZXRSb290VXJsKCk7XHJcbiAgZmlsZVBhdGggPSBfLmZpbGVQYXRoKGFic1VybCk7XHJcbiAgaWYgKGZpbGVQYXRoID09PSBfLmZpbGVQYXRoKHJvb3RVcmwpKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcbiAgZmlsZU5hbWUgPSBfLmdldEZpbGVOYW1lKHJvb3RVcmwpO1xyXG4gIHJldHVybiAoZmlsZU5hbWUgPT09ICdpbmRleC5odG0nIHx8IGZpbGVOYW1lID09PSAnaW5kZXguaHRtbCcpICYmIGZpbGVQYXRoID09PSBfLnBhcmVudFBhdGgocm9vdFVybCk7XHJcbn07XHJcblxyXG5fLmlzRXh0ZXJuYWxVcmwgPSBhYnNVcmwgPT4ge1xyXG4gIGxldCBob3N0Rm9sZGVyO1xyXG4gIGxldCB0YXJnZXRGb2xkZXI7XHJcbiAgaWYgKHJoLm1vZGVsLmdldChyaC5jb25zdHMoJ0tFWV9QVUJMSVNIX01PREUnKSkpIHtcclxuICAgIGhvc3RGb2xkZXIgPSByaC5tb2RlbC5nZXQocmguY29uc3RzKCdLRVlfUFJPSkVDVFNfQkFTRV9VUkwnKSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGhvc3RGb2xkZXIgPSBfLmdldEhvc3RGb2xkZXIoKTtcclxuICB9XHJcbiAgdGFyZ2V0Rm9sZGVyID0gYWJzVXJsLnN1YnN0cmluZygwLCBob3N0Rm9sZGVyLmxlbmd0aCk7XHJcbiAgcmV0dXJuIHRhcmdldEZvbGRlciAhPT0gaG9zdEZvbGRlcjtcclxufTtcclxuXHJcbl8uZml4SGFzaE1hcEZvclJvb3QgPSBoYXNoTWFwID0+IHtcclxuICBsZXQgSEFTSF9LRVlfUkFORE9NO1xyXG4gIGxldCBIQVNIX0tFWV9SSF9ISUdITElHSFQ7XHJcbiAgbGV0IEhBU0hfS0VZX1JIX1NFQVJDSDtcclxuICBsZXQgSEFTSF9LRVlfUkhfVE9DSUQ7XHJcbiAgbGV0IEhBU0hfS0VZX1RPUElDO1xyXG4gIGxldCBIQVNIX0tFWV9VSU1PREU7XHJcbiAgaWYgKGhhc2hNYXAgPT0gbnVsbCkge1xyXG4gICAgaGFzaE1hcCA9IHt9O1xyXG4gIH1cclxuICBIQVNIX0tFWV9SSF9TRUFSQ0ggPSBjb25zdHMoJ0hBU0hfS0VZX1JIX1NFQVJDSCcpO1xyXG4gIEhBU0hfS0VZX1RPUElDID0gY29uc3RzKCdIQVNIX0tFWV9UT1BJQycpO1xyXG4gIEhBU0hfS0VZX1VJTU9ERSA9IGNvbnN0cygnSEFTSF9LRVlfVUlNT0RFJyk7XHJcbiAgSEFTSF9LRVlfUkhfVE9DSUQgPSBjb25zdHMoJ0hBU0hfS0VZX1JIX1RPQ0lEJyk7XHJcbiAgSEFTSF9LRVlfUkhfSElHSExJR0hUID0gY29uc3RzKCdIQVNIX0tFWV9SSF9ISUdITElHSFQnKTtcclxuICBIQVNIX0tFWV9SQU5ET00gPSBjb25zdHMoJ0hBU0hfS0VZX1JBTkRPTScpO1xyXG4gIGlmICghaGFzaE1hcFtIQVNIX0tFWV9VSU1PREVdKSB7XHJcbiAgICBoYXNoTWFwW0hBU0hfS0VZX1VJTU9ERV0gPSBudWxsO1xyXG4gIH1cclxuICBoYXNoTWFwW0hBU0hfS0VZX1JBTkRPTV0gPSBudWxsO1xyXG4gIGlmICghaGFzaE1hcFtIQVNIX0tFWV9SSF9UT0NJRF0pIHtcclxuICAgIGhhc2hNYXBbSEFTSF9LRVlfUkhfVE9DSURdID0gbnVsbDtcclxuICB9XHJcbiAgaWYgKCFoYXNoTWFwW0hBU0hfS0VZX1JIX0hJR0hMSUdIVF0pIHtcclxuICAgIGhhc2hNYXBbSEFTSF9LRVlfUkhfSElHSExJR0hUXSA9IG51bGw7XHJcbiAgfVxyXG4gIGlmICghaGFzaE1hcFtIQVNIX0tFWV9SSF9TRUFSQ0hdKSB7XHJcbiAgICBoYXNoTWFwW0hBU0hfS0VZX1JIX1NFQVJDSF0gPSBudWxsO1xyXG4gIH1cclxuICByZXR1cm4gaGFzaE1hcDtcclxufTtcclxuXHJcbl8uZml4UmVsYXRpdmVVcmwgPSBmaWxlUGF0aCA9PiB7XHJcbiAgaWYgKGZpbGVQYXRoID09IG51bGwpIHtcclxuICAgIGZpbGVQYXRoID0gJyc7XHJcbiAgfVxyXG4gIGZpbGVQYXRoID0gZmlsZVBhdGgucmVwbGFjZSgvXFwvXFwuXFwvL2csICcvJyk7XHJcbiAgaWYgKGZpbGVQYXRoWzBdID09PSAnLicgJiYgZmlsZVBhdGhbMV0gPT09ICcvJykge1xyXG4gICAgZmlsZVBhdGggPSBmaWxlUGF0aC5zdWJzdHJpbmcoMik7XHJcbiAgfVxyXG4gIHJldHVybiBmaWxlUGF0aDtcclxufTtcclxuXHJcbl8uZW5zdXJlU2xhc2ggPSB1cmwgPT4ge1xyXG4gIGlmICgodXJsICE9IG51bGwpICYmIHVybC5zdWJzdHIoLTEpICE9PSAnLycpIHtcclxuICAgIHVybCArPSAnLyc7XHJcbiAgfVxyXG4gIHJldHVybiB1cmw7XHJcbn07XHJcblxyXG5fLmlzVXJsQWxsb3dkSW5JZnJhbWUgPSAoKCgpID0+IHtcclxuICBsZXQgQUxMT1dFRF9FWFRTX0lOX0lGUkFNRTtcclxuICBBTExPV0VEX0VYVFNfSU5fSUZSQU1FID0gWycnLCAnLmh0bScsICcuaHRtbCcsICcuYXNwJywgJy5hc3B4J107XHJcbiAgcmV0dXJuIGFic1VybCA9PiB7XHJcbiAgICBsZXQgZXh0O1xyXG4gICAgbGV0IHJlbFVybDtcclxuICAgIGlmIChfLmlzRXh0ZXJuYWxVcmwoYWJzVXJsKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICByZWxVcmwgPSBhYnNVcmwuc3Vic3RyaW5nKF8uZ2V0SG9zdEZvbGRlcigpLmxlbmd0aCk7XHJcbiAgICBleHQgPSBfLmdldEZpbGVFeHRlbnRpb24ocmVsVXJsKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgcmV0dXJuIEFMTE9XRURfRVhUU19JTl9JRlJBTUUuaW5jbHVkZXMoZXh0KTtcclxuICB9O1xyXG59KSkoKTtcclxuIiwibGV0IHJoID0gcmVxdWlyZShcIi4vcmhcIilcclxubGV0IGNvbnN0cyA9IHJoLmNvbnN0c1xyXG5cclxuY29uc3RzKCdSSE1BUElEJywgJ3JobWFwaWQnKTtcclxuY29uc3RzKCdSSF9GVUxMX0xBWU9VVF9QQVJBTScsICdyaGZ1bGxsYXlvdXQnKTtcclxuXHJcbmNvbnN0cygnRVZUX1RPUElDX1dJREdFVF9MT0FERUQnLCAnLmUudG9waWNfd2lkZ2V0X2xvYWRlZCcpO1xyXG5jb25zdHMoJ0VWVF9DTE9TRV9TRUFSQ0hfU1VHR0VTVElPTicsICcuZS5jbG9zZV9zZWFyY2hfc3VnZ2VzdGlvbicpO1xyXG5cclxuY29uc3RzKCdLRVlfVE9DX0JSRUFEQ1JVTUJTJywgJy5wLnRvY19icmVhZGNydW1icycpO1xyXG5jb25zdHMoJ0tFWV9UT0NfU0VMRUNUX0lURU0nLCAnLnAudG9jX3NlbGVjdF9pdGVtJyk7XHJcbmNvbnN0cygnS0VZX1RPQ19PUkRFUicsICcucC50b2Nfb3JkZXInKTtcclxuY29uc3RzKCdLRVlfVE9DX0NISUxEX09SREVSJywgJy5wLnRvY19jaGlsZF9vcmRlcicpO1xyXG4vL1NlYXJjaCBzcGVjaWZpY1xyXG5jb25zdHMoJ1NFQVJDSF9NQVBfQUREUicsIFwid2h4ZGF0YS9zZWFyY2hfYXV0b19tYXBfMC5qc1wiKTtcclxuY29uc3RzKCdTRUFSQ0hfTU9ERUxfQUREUicsIFwid2h4ZGF0YS9zZWFyY2hfYXV0b19tb2RlbF9cIik7XHJcbmNvbnN0cygnU0VBUkNIX0lOREVYX0RBVEEnLCBcIi5sLnNlYXJjaF9pbmRleF9kYXRhXCIpO1xyXG5jb25zdHMoJ1NFQVJDSF9JTkRFWF9GSUxFJywgXCJ3aHhkYXRhL3NlYXJjaF9hdXRvX2luZGV4LmpzXCIpO1xyXG5jb25zdHMoJ1NFQVJDSF9EQl9GSUxFJywgXCJ3aHhkYXRhL3NlYXJjaF9kYi5qc1wiKTtcclxuY29uc3RzKCdTRUFSQ0hfTUVUQURBVEFfRklMRScsIFwid2h4ZGF0YS9zZWFyY2hfdG9waWNzLmpzXCIpXHJcbmNvbnN0cygnU0VBUkNIX1RFWFRfRklMRScsIFwid2h4ZGF0YS90ZXh0XCIpXHJcblxyXG5jb25zdHMoJ1NFQVJDSF9NT0RFTF9LRVknLCcubC5zZWFyY2hfbW9kZWwuJyk7XHJcbmNvbnN0cygnU0VBUkNIX01BUF9LRVknLCAnLmwuc2VhcmNoX21hcC4nKTtcclxuY29uc3RzKCdTRUFSQ0hfTUFYX1RPUElDUycsIDIwKTtcclxuY29uc3RzKCdTRUFSQ0hfUkVTVUxUU19LRVknLCAnc2VhcmNoX3Jlc3VsdHMnKTtcclxuY29uc3RzKCdTVE9QX05BVklHQVRFX1RPX1RPUElDJywgJy5sLnN0b3B0b3BpY25hdicpO1xyXG5jb25zdHMoJ1NFQVJDSF9XT1JEU19NQVAnLCAnLmwuc2VhcmNoX3dvcmRzX21hcCcpO1xyXG5jb25zdHMoXCJNQVhfU0VBUkNIX0lOUFVUXCIsIDMpO1xyXG5jb25zdHMoXCJLRVlfQlJFQURDUlVNQlNcIiwgJy5sLmJyZWFkY3J1bWJzJyk7XHJcbmNvbnN0cygnSEFTSF9IT01FUEFHRV9NT0RFJywgJ2hvbWVwYWdlJyk7XHJcbmNvbnN0cygnS0VZX1ZJRVdfTU9ERScsICcubC5tb2RlJyk7XHJcbmNvbnN0cygnSEVMUF9MQVlPVVRfTU9ERScsICdsYXlvdXQnKTtcclxuY29uc3RzKCdIRUxQX1NFQVJDSF9NT0RFJywgJ3NlYXJjaCcpXHJcbmNvbnN0cygnSEVMUF9UT1BJQ19NT0RFJywgJ3RvcGljJylcclxuY29uc3RzKCdQUkVWX1NFQVJDSF9LRVknLCAnZGF0YS1wcmV2LXNlYXJjaCcpXHJcblxyXG5cclxuXHJcblx0LyogZmF2b3JpdGVzIGNvbnN0YW50cyAqL1xyXG5jb25zdHMoJ0ZBVkFUVFJJQlVURScsJ2RhdGEtZmF2d2lkZ2V0Jyk7XHJcbmNvbnN0cygnRkFWQlVUVE9OJywnZmF2LWJ1dHRvbicpO1xyXG5jb25zdHMoJ0ZBVkxJU1QnLCdmYXYtbGlzdCcpO1xyXG5jb25zdHMoJ0ZBVlNUT1JBR0UnLCAnZmF2LXN0b3JlJyk7XHJcblxyXG5jb25zdHMoJ0ZBVkxJTktDTEFTUycsJ2Zhdm9yaXRlJyk7XHJcbmNvbnN0cygnVU5GQVZMSU5LQ0xBU1MnLCd1bmZhdm9yaXRlJyk7XHJcbmNvbnN0cygnRkFWVEFCTEVDTEFTUycsICdmYXZvcml0ZXNob2xkZXInKTtcclxuY29uc3RzKCdGQVZUQUJMRVRJVExFQ0xBU1MnLCAnZmF2b3JpdGUnKTtcclxuY29uc3RzKCdGQVZUQUJMRVJFTU9WRUNMQVNTJywgJ3JlbW92ZWxpbmsnKTtcclxuY29uc3RzKCdGQVZMSVNUSU5UUk9DTEFTUycsICdmYXZvcml0ZXNpbnRybycpO1xyXG5jb25zdHMoJ0ZBVkxJU1RUQUJMRUlOVFJPQ0xBU1MnLCAnZmF2b3JpdGVzdGFibGVpbnRybycpO1xyXG5jb25zdHMoJ0VWRU5URkFWQ0hBTkdFJywgJ2Zhdm9yaXRlLWNoYW5nZWQtaW4tc2NyaXB0Jyk7XHJcbmNvbnN0cygnVE9QSUNfRkFWT1JJVEUnLCAnLmwudG9waWNfZmF2b3JpdGUnKTtcclxuY29uc3RzKCdLRVlfRkFWT1JJVEVTJywgJy5sLmZhdm9yaXRlcycpO1xyXG5jb25zdHMoJ0ZBVk9SSVRFU19CVVRUT05fVElUTEUnLCAnLmwuZmF2b3JpdGVzX3RpdGxlJyk7XHJcbmNvbnN0cygnS0VZX0dMT1NTQVJZX1JFU1VMVCcsICcucC5nbG9zc2FyeV9zZWFyY2hfcmVzdWx0Jyk7XHJcbmNvbnN0cygnS0VZX0dMT1NTQVJZX1JFU1VMVF9URVJNJywgJy5wLmdsb3NzYXJ5X3NlYXJjaF90ZXJtJyk7XHJcblxyXG5cclxuY29uc3RzKCdFVlRfV0lORE9XX0xPQURFRCcsICcuZS53aW5fbG9hZGVkJylcclxuXHJcbmNvbnN0cygnS0VZX0xOR19OQU1FJywgJy5wLmxuZ19uYW1lJyk7XHJcbmNvbnN0cygnU0hPV19NT0RBTCcsICcubC5zaG93X21vZGFsJylcclxuXHJcbmNvbnN0cygnS0VZX0hFQURFUl9MT0dPX1BBVEgnLCAnLmwuaGVhZGVyLmxvZ28nKTtcclxuY29uc3RzKCdLRVlfSEVBREVSX1RJVExFJywgJy5sLmhlYWRlci50aXRsZScpO1xyXG5jb25zdHMoJ0tFWV9IRUFERVJfVElUTEVfQ09MT1InLCAnLmwuaGVhZGVyLnRpdGxlX2NvbG9yJyk7XHJcbmNvbnN0cygnS0VZX0hFQURFUl9CQUNLR1JPVU5EX0NPTE9SJywgJy5sLmhlYWRlci5iYWNrZ3JvdW5kX2NvbG9yJyk7XHJcbmNvbnN0cygnS0VZX0xBWU9VVF9GT05UX0ZBTUlMWScsICcubC5sYXlvdXQuZm9udF9mYW1pbHknKTtcclxuY29uc3RzKCdLRVlfSEVBREVSX0hUTUwnLCAnLmwuaGVhZGVyLmh0bWwnKTtcclxuY29uc3RzKCdLRVlfSEVBREVSX0NTUycsICcubC5oZWFkZXIuY3NzJyk7XHJcbmNvbnN0cygnS0VZX0hFQURFUl9ERUZBVUxUX0JBQ0tHUk9VTkRfQ09MT1InLCAnLmwuaGVhZGVyLmRlZmF1bHRfYmFja2dyb3VuZF9jb2xvcicpO1xyXG5jb25zdHMoJ0tFWV9IRUFERVJfREVGQVVMVF9USVRMRV9DT0xPUicsICcubC5oZWFkZXIuZGVmYXVsdF90aXRsZV9jb2xvcicpO1xyXG5jb25zdHMoJ0tFWV9MQVlPVVRfREVGQVVMVF9GT05UX0ZBTUlMWScsICcubC5sYXlvdXQuZGVmYXVsdF9mb250X2ZhbWlseScpO1xyXG5cclxuY29uc3RzKCdLRVlfQ1VTVE9NX0JVVFRPTlMnLCAnLmwuY3VzdG9tX2J1dHRvbnMnKTtcclxuY29uc3RzKCdLRVlfQ1VTVE9NX0JVVFRPTlNfQ09ORklHJywgJy5sLmN1c3RvbV9idXR0b25zX2NvbmZpZycpO1xyXG5jb25zdHMoJ0tFWV9TRUFSQ0hfSElHSExJR0hUX0NPTE9SJywgJy5sLnNlYXJjaF9yZXN1bHQuaGlnaGxpZ2h0X2NvbG9yJyk7XHJcbmNvbnN0cygnS0VZX1NFQVJDSF9CR19DT0xPUicsICcubC5zZWFyY2hfcmVzdWx0LmhpZ2hsaWdodF9iY2NvbG9yJyk7XHJcbmNvbnN0cygnVE9QSUNfSElHSExJR0hURUQnLCAnLmwuc2VhcmNoX3Jlc3VsdC50b3BpY19oaWdobGlnaHRlZCcpO1xyXG5jb25zdHMoJ0VWVF9SRU1PVkVfSElHSExJR0hUJywgJy5lLnJlbW92ZV9oaWdobGlnaHQnKTtcclxuXHJcblxyXG5jb25zdHMoJ0VWVF9FWFBBTkRfQ09MTEFQU0VfQUxMJywgJy5lLmV4cGFuZF9jb2xsYXBzZV9hbGwnKTtcclxuY29uc3RzKCdFVlRfRVhQQU5EX0FMTCcsICcuZS5leHBhbmRfYWxsJyk7XHJcbmNvbnN0cygnRVZUX0NPTExBUFNFX0FMTCcsICcuZS5jb2xsYXBzZV9hbGwnKTtcclxuY29uc3RzKCdBTExfQVJFX0VYUEFOREVEJywgJy5sLmFsbF9hcmVfZXhwYW5kZWQnKTtcclxuXHJcbiIsIi8vR3VuamFuXHJcbmlmIChnbG9iYWwucmggPT09IHVuZGVmaW5lZCkge1xyXG4gIGdsb2JhbC5yaCA9IHt9O1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdsb2JhbC5yaFxyXG4iLCJyZXF1aXJlKFwiLi4vbGliL3JoXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9yb2JvaGVscC9jb21tb24vcmhfY29uc3RzXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9yb2JvaGVscC9jb21tb24vdGFnX2V4cHJlc3Npb25fdXRpbHNcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL3JvYm9oZWxwL2NvbW1vbi9ob29rX2NsaWNrXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9yb2JvaGVscC9jb21tb24vY29udGVudF9maWx0ZXJcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL3JvYm9oZWxwL2NvbW1vbi9lZF93aWRnZXRzXCIpXHJcbnJlcXVpcmUoXCIuLi8uLi9sZW5pZW50X3NyYy9yb2JvaGVscC9jb21tb24vZWRfd2lkZ2V0X2NvbmZpZ3NcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL3JvYm9oZWxwL2NvbW1vbi91cmxfdXRpbHNcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL3JvYm9oZWxwL2NvbW1vbi90YWdfZXhwcmVzc2lvbl91dGlsc1wiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvcm9ib2hlbHAvY29tbW9uL2hvb2tfY2xpY2tcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL3JvYm9oZWxwL2NvbW1vbi9jb250ZW50X2ZpbHRlclwiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvcm9ib2hlbHAvY29tbW9uL2VkX3dpZGdldHNcIilcclxucmVxdWlyZShcIi4uLy4uL2xlbmllbnRfc3JjL3JvYm9oZWxwL2NvbW1vbi9lZF93aWRnZXRfY29uZmlnc1wiKVxyXG5yZXF1aXJlKFwiLi4vbGliL2NvbnN0c1wiKVxyXG5yZXF1aXJlKFwiLi4vLi4vbGVuaWVudF9zcmMvcm9ib2hlbHAvY29tbW9uL3VybF91dGlsc1wiKVxyXG5yZXF1aXJlKFwiLi91dGlscy9ob21lX3V0aWxzXCIpXHJcbnJlcXVpcmUoXCIuL3V0aWxzL3VybF91dGlsc1wiKVxyXG5yZXF1aXJlKFwiLi91dGlscy9pb191dGlsc1wiKVxyXG5yZXF1aXJlKFwiLi91dGlscy9odG1sX3Jlc29sdmVyXCIpXHJcbnJlcXVpcmUoXCIuL3V0aWxzL2lmcmFtZV91dGlsc1wiKVxyXG5yZXF1aXJlKFwiLi9sYXlvdXQvZGF0YV9hdHRycy9wb3B1cF9pbWFnZVwiKVxyXG5yZXF1aXJlKFwiLi9sYXlvdXQvZGF0YV9hdHRycy9mb2N1c2lmXCIpXHJcbnJlcXVpcmUoXCIuL2NvbW1vbi9pbml0XCIpXHJcbiIsImxldCByaCA9IHJlcXVpcmUoXCIuLi8uLi9saWIvcmhcIik7XHJcbmxldCBjb25zdHMgPSByaC5jb25zdHM7XHJcbmxldCAkID0gcmguJDtcclxubGV0IG1vZGVsID0gcmgubW9kZWw7XHJcblxyXG5tb2RlbC5zdWJzY3JpYmUoY29uc3RzKCdFVlRfUFJPSkVDVF9MT0FERUQnKSwgKCkgPT57XHJcbiAgbGV0ICRodG1sID0gJCgnaHRtbCcsMCk7XHJcbiAgbGV0IGxhbmcgPSBtb2RlbC5nZXQoY29uc3RzKCdLRVlfTE5HX05BTUUnKSlcclxuICBpZigkaHRtbCAmJiBsYW5nICYmIGxhbmcgIT09ICcnKXsgIFxyXG4gICAgJC5zZXRBdHRyaWJ1dGUoJGh0bWwsICdsYW5nJywgbGFuZylcclxuICB9XHJcbn0pXHJcblxyXG5tb2RlbC5zdWJzY3JpYmUoY29uc3RzKCdLRVlfQU5EX1NFQVJDSCcpLCB2YWx1ZSA9PiB2YWx1ZSA9PT0gJycgJiYgbW9kZWwucHVibGlzaChjb25zdHMoJ0tFWV9BTkRfU0VBUkNIJyksICcxJykpXHJcbiIsImNvbnN0IHJoID0gcmVxdWlyZShcIi4uLy4uLy4uL2xpYi9yaFwiKVxyXG5cclxuY2xhc3MgRm9jdXNpZiB7XHJcbiAgY29uc3RydWN0b3IgKHdpZGdldCwgbm9kZSwgcmF3RXhwcikge1xyXG4gICAgd2lkZ2V0LnN1YnNjcmliZURhdGFFeHByKHJhd0V4cHIsIHJlc3VsdCA9PiB7XHJcbiAgICAgIGlmKHJlc3VsdCkge1xyXG4gICAgICAgIG5vZGUuZm9jdXMoKVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxufVxyXG5cclxucmgucmVnaXN0ZXJEYXRhQXR0cignZm9jdXNpZicsIEZvY3VzaWYpIiwiY29uc3QgcmggPSByZXF1aXJlKFwiLi4vLi4vLi4vbGliL3JoXCIpXHJcbmNvbnN0IF8gPSByaC5fO1xyXG5sZXQgJCA9IHJoLiQ7XHJcbmxldCBIdG1sUmVzb2x2ZXIgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvaHRtbF9yZXNvbHZlclwiKVxyXG5sZXQgbm9kZVV0aWxzID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL25vZGVfdXRpbHNcIilcclxuXHJcblxyXG5jbGFzcyBQb3B1cEltYWdle1xyXG4gIGNvbnN0cnVjdG9yKHdpZGdldCwgbm9kZSwgcmF3RXhwcikge1xyXG4gICAgJC5hZGRDbGFzcyhub2RlLCBcInBvcHVwLWltYWdlLXRodW1ibmFpbFwiKVxyXG4gICAgdGhpcy5ub2RlID0gbm9kZTtcclxuICAgIHJoLm1vZGVsLmNzdWJzY3JpYmUoJ0VWVF9QUk9KRUNUX0xPQURFRCcsIHRoaXMuX2FkZEVubGFyZ2VCdXR0b24uYmluZCh0aGlzKSlcclxuICAgIHRoaXMuX2NsaWNrRm4gPSB0aGlzLl9nZXRDbGlja0ZuKHJhd0V4cHIpXHJcbiAgICBfLmFkZEV2ZW50TGlzdGVuZXIobm9kZSwgXCJjbGlja1wiLCB0aGlzLl9jbGlja0ZuKTtcclxuICB9XHJcblxyXG4gIF9jb250ZW50KHJhd0V4cHIpe1xyXG4gICAgbGV0IG5vZGVzID0gW11cclxuICAgIGxldCBpbWdOb2RlID0gJC5jcmVhdGVFbGVtZW50KCdpbWcnKVxyXG4gICAgJC5zZXRBdHRyaWJ1dGUoaW1nTm9kZSwgJ3NyYycsIHJhd0V4cHIpXHJcbiAgICBub2Rlcy5wdXNoKGltZ05vZGUpXHJcblxyXG4gICAgaWYoJC5oYXNBdHRyaWJ1dGUodGhpcy5ub2RlLCBcInVzZW1hcFwiKSkge1xyXG4gICAgICBsZXQgbWFwSWQgPSAkLmdldEF0dHJpYnV0ZSh0aGlzLm5vZGUsIFwidXNlbWFwXCIpXHJcbiAgICAgICQuc2V0QXR0cmlidXRlKGltZ05vZGUsICd1c2VtYXAnLCBtYXBJZClcclxuICAgICAgbm9kZXMucHVzaCgkKG1hcElkLCAwKSlcclxuICAgIH1cclxuXHJcbiAgICBsZXQgaHRtbF9yZXNvbHZlciA9IG5ldyBIdG1sUmVzb2x2ZXIoKTtcclxuICAgIHJldHVybiBodG1sX3Jlc29sdmVyLnJlc29sdmUoXy5tYXAobm9kZXMsIG5vZGUgPT4gbm9kZVV0aWxzLm91dGVySFRNTChub2RlKSkuam9pbignICcpKVxyXG4gIH1cclxuXHJcbiAgX2dldENsaWNrRm4ocmF3RXhwcil7XHJcbiAgICByZXR1cm4gKCkgPT4ge1xyXG4gICAgICByaC5tb2RlbC5jcHVibGlzaCgnU0hPV19NT0RBTCcsIHtjb250ZW50OiB0aGlzLl9jb250ZW50KHJhd0V4cHIpLCBpc0ltYWdlOnRydWV9KVxyXG4gICAgfTtcclxuICB9XHJcbiAgX2FkZEVubGFyZ2VCdXR0b24oKXtcclxuXHJcbiAgICBsZXQgaW1nID0gJC5jcmVhdGVFbGVtZW50KCdpbWcnLCB0aGlzLm5vZGUpXHJcbiAgICAkLnNldEF0dHJpYnV0ZShpbWcsXCJzcmNcIiwgdGhpcy5leHBhbmRJbWFnZVBhdGgpXHJcbiAgICAkLmFkZENsYXNzKGltZywgXCJyaC1leHBhbmQtaWNvblwiKVxyXG4gICAgbm9kZVV0aWxzLmluc2VydEFmdGVyKHRoaXMubm9kZSwgaW1nKVxyXG4gICAgXy5hZGRFdmVudExpc3RlbmVyKGltZywgXCJjbGlja1wiLCB0aGlzLl9jbGlja0ZuKTtcclxuICB9XHJcbiAgZ2V0IGV4cGFuZEltYWdlUGF0aCAoKXtcclxuICAgIGxldCBodG1sX3Jlc29sdmVyID0gbmV3IEh0bWxSZXNvbHZlcigpO1xyXG4gICAgbGV0IGZ1bGxJbWFnZVBhdGggPSBodG1sX3Jlc29sdmVyLm1ha2VGdWxsUGF0aCgndGVtcGxhdGUvaW1hZ2VzL2V4cGFuZC5wbmcnLCBfLmdldFJvb3RVcmwoKSkgXHJcbiAgICByZXR1cm4gXy5tYWtlUmVsYXRpdmVVcmwoZnVsbEltYWdlUGF0aClcclxuICB9XHJcbn1cclxuXHJcbnJoLnJlZ2lzdGVyRGF0YUF0dHIoJ3BvcHVwaW1hZ2UnLCBQb3B1cEltYWdlKSIsImxldCByaCA9IHJlcXVpcmUoXCIuLi8uLi9saWIvcmhcIilcclxubGV0IF8gPSByaC5fXHJcbmxldCBjb25zdHMgPSByaC5jb25zdHNcclxuXHJcbl8uZ29Ub0hvbWUgPSAoaGFzaF9tYXAsIHBhcmFtc19tYXApID0+IHtcclxuICBsZXQgaG9tZV9wYXRoID0gY29uc3RzKCdIT01FX0ZJTEVQQVRIJylcclxuICBpZihob21lX3BhdGgpIHtcclxuICAgIGxldCBob21lX3VybCA9IF8ubWFrZUZ1bGxVcmwoaG9tZV9wYXRoKVxyXG4gICAgbGV0IHBhcmFtc1N0ciA9IChwYXJhbXNfbWFwID09PSB1bmRlZmluZWQpPyAnJyA6ICc/JysgXy5tYXBUb0VuY29kZWRTdHJpbmcocGFyYW1zX21hcClcclxuICAgIGxldCBoYXNoU3RyID0gKGhhc2hfbWFwID09PSB1bmRlZmluZWQpPyAnJyA6ICcjJysgXy5tYXBUb0VuY29kZWRTdHJpbmcoaGFzaF9tYXApXHJcblxyXG4gICAgaG9tZV91cmwgPSBgJHtob21lX3VybH0ke3BhcmFtc1N0cn0ke2hhc2hTdHJ9YFxyXG4gICAgZG9jdW1lbnQubG9jYXRpb24gPSBob21lX3VybFxyXG4gIH1cclxufTtcclxuXHJcbl8uaXNIb21lVXJsID0odXJsKSA9PntcclxuICBsZXQgaG9tZV9wYXRoID0gY29uc3RzKCdIT01FX0ZJTEVQQVRIJylcclxuICBsZXQgcm9vdFVybCA9IF8uZ2V0Um9vdFVybCgpXHJcbiAgbGV0IHJlbGF0aXZlUGF0aCA9IF8ubWFrZVJlbGF0aXZlUGF0aCh1cmwsIHJvb3RVcmwpXHJcbiAgbGV0IGZpbGVQYXRoID0gXy5maWxlUGF0aChyZWxhdGl2ZVBhdGgpXHJcbiAgcmV0dXJuIChob21lX3BhdGggPT09IGZpbGVQYXRoKVxyXG59XHJcblxyXG5fLmNvbXBhcmUgPSAod29yZDEsIHdvcmQyKSA9PiB7XHJcbiAgcmV0dXJuICh3b3JkMSA9PT0gd29yZDIpID8gMCA6LTE7XHJcbn07XHJcbiIsImxldCByaCA9IHJlcXVpcmUoXCIuLi8uLi9saWIvcmhcIilcclxubGV0ICQgPSByaC4kXHJcbmxldCBfID0gcmguX1xyXG5sZXQgbm9kZVV0aWxzID0gcmVxdWlyZShcIi4vbm9kZV91dGlsc1wiKVxyXG5jb25zdCB1dGlsID0geyBcclxuICBzY2hlbWUodXJsKSB7XHJcbiAgICBsZXQgaW5kZXgsIHNjaGVtZVxyXG4gICAgaW5kZXggPSB1cmwuaW5kZXhPZignOicpXHJcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XHJcbiAgICAgIHNjaGVtZSA9IHVybC5zdWJzdHJpbmcoMCwgaW5kZXggKyAxKS50b0xvd2VyQ2FzZSgpLnRyaW0oKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNjaGVtZVxyXG4gIH1cclxufVxyXG5jbGFzcyBIdG1sUmVzb2x2ZXIge1xyXG5cclxuICBnZXQgcGF0aHMoKXtcclxuICAgIHJldHVybiBbJ3NyYycsICdocmVmJ107XHJcbiAgfVxyXG5cclxuICBnZXQgbGlua3MoKXtcclxuICAgIHJldHVybiBbJ2hyZWYnXTtcclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKCl7XHJcbiAgfVxyXG4gIFxyXG4gIHJlc29sdmUoaHRtbCl7XHJcbiAgICBsZXQgbm9kZXMgPSBub2RlVXRpbHMudG9IdG1sTm9kZShodG1sKVxyXG4gICAgXy5lYWNoKG5vZGVzLCBub2RlID0+IHtcclxuICAgICAgaWYobm9kZVV0aWxzLmlzRWxlbWVudE5vZGUobm9kZSkpIHtcclxuICAgICAgICAkLnRyYXZlcnNlTm9kZShub2RlLCBub2RlID0+IHRoaXMucmVzb2x2ZU5vZGUobm9kZSkpXHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICByZXR1cm4gXy5yZWR1Y2Uobm9kZXMsIChyZXN1bHQsIG5vZGUpID0+IHtcclxuICAgICAgcmVzdWx0ICs9IG5vZGVVdGlscy5vdXRlckhUTUwobm9kZSlcclxuICAgICAgcmV0dXJuIHJlc3VsdFxyXG4gICAgfSwgJycpXHJcbiAgfVxyXG5cclxuICByZXNvbHZlTm9kZShub2RlKXtcclxuICAgIF8uZWFjaCh0aGlzLnBhdGhzLCBhdHRyaWJ1dGUgPT4gdGhpcy5yZXNvdmVQYXRocyhub2RlLCBhdHRyaWJ1dGUpKVxyXG4gICAgXy5lYWNoKHRoaXMubGlua3MsIGF0dHJpYnV0ZSA9PiB0aGlzLnJlc292ZUxpbmtzKG5vZGUsIGF0dHJpYnV0ZSkpXHJcbiAgICByZXR1cm4gdHJ1ZVxyXG4gIH1cclxuXHJcbiAgcmVzb3ZlUGF0aHMobm9kZSwgYXR0cmlidXRlKSB7XHJcbiAgICBpZighJC5oYXNBdHRyaWJ1dGUobm9kZSwgYXR0cmlidXRlKSkge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIGxldCB2YWx1ZSA9ICQuZ2V0QXR0cmlidXRlKG5vZGUsIGF0dHJpYnV0ZSlcclxuICAgICQuc2V0QXR0cmlidXRlKG5vZGUsIGF0dHJpYnV0ZSwgdGhpcy5yZXNvdmVQYXRoKHZhbHVlKSkgIFxyXG4gIH1cclxuXHJcbiAgcmVzb3ZlTGlua3Mobm9kZSwgYXR0cmlidXRlKXtcclxuICAgIGlmKCEkLmhhc0F0dHJpYnV0ZShub2RlLCBhdHRyaWJ1dGUpKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgJC5zZXRBdHRyaWJ1dGUobm9kZSwgXCJkYXRhLWNsaWNrXCIsIFwiQGNsb3NlKHRydWUpXCIpXHJcbiAgfVxyXG5cclxuICByZXNvdmVQYXRoKHBhdGgpIHtcclxuICAgIGlmKCFfLmlzUmVsYXRpdmVVcmwocGF0aCkpe1xyXG4gICAgICByZXR1cm4gcGF0aDtcclxuICAgIH1cclxuICAgIGxldCBiYXNlVXJsID0gXy5nZXRSb290VXJsKCk7XHJcbiAgICBsZXQgZnVsbFVybCA9IF8ubWFrZUZ1bGxVcmwocGF0aCk7XHJcbiAgICByZXR1cm4gXy5tYWtlUmVsYXRpdmVVcmwoZnVsbFVybCwgYmFzZVVybCk7XHJcbiAgfVxyXG4gIG1ha2VGdWxsUGF0aChyZWxVcmwsIGJhc2VVcmwpIHtcclxuICAgIGlmKCF0aGlzLmlzUmVsYXRpdmVVcmwocmVsVXJsKSB8fCB0aGlzLmlzUmVsYXRpdmVVcmwoYmFzZVVybCkpIHtcclxuICAgICAgcmV0dXJuIHJlbFVybFxyXG4gICAgfVxyXG4gICAgbGV0IGJhc2VQYXJ0cyA9IHRoaXMuZmlsZVBhdGgoYmFzZVVybCkuc3BsaXQoJy8nKSxcclxuICAgICAgcmVsUGF0aCA9IHRoaXMuZmlsZVBhdGgocmVsVXJsKSxcclxuICAgICAgcGFyYW1zID0gcmVsVXJsLnN1YnN0cmluZyhyZWxQYXRoLmxlbmd0aCksXHJcbiAgICAgIHJlbFBhcnRzID0gcmVsUGF0aC5zcGxpdCgnLycpXHJcblxyXG4gICAgaWYocmVsUGFydHMubGVuZ3RoID4gMSB8fCByZWxQYXJ0c1swXSkge1xyXG4gICAgICBiYXNlUGFydHMucG9wKClcclxuICAgICAgXy5lYWNoKHJlbFBhcnRzLCByZWxQYXJ0ID0+IHtcclxuICAgICAgICBpZihyZWxQYXJ0ID09PSAnLi4nKSB7XHJcbiAgICAgICAgICBiYXNlUGFydHMucG9wKClcclxuICAgICAgICB9IGVsc2UgaWYocmVsUGFydCAhPT0gJy4nKSB7XHJcbiAgICAgICAgICBiYXNlUGFydHMucHVzaChyZWxQYXJ0KVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIGAke2Jhc2VQYXJ0cy5qb2luKCcvJyl9JHtwYXJhbXN9YFxyXG4gIH1cclxuICBcclxuICBpc1JlbGF0aXZlVXJsKHVybCkge1xyXG4gICAgcmV0dXJuICF1cmwgfHwgIXV0aWwuc2NoZW1lKHVybCkgJiYgdXJsLnRyaW0oKS5pbmRleE9mKCcvJylcclxuICB9XHJcblxyXG4gIGZpbGVQYXRoKHVybCkge1xyXG4gICAgbGV0IGluZGV4O1xyXG4gICAgdXJsID0gdXJsIHx8ICcnXHJcbiAgICBpbmRleCA9IHVybC5pbmRleE9mKCc/JylcclxuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcclxuICAgICAgdXJsID0gdXJsLnN1YnN0cmluZygwLCBpbmRleClcclxuICAgIH1cclxuICAgIGluZGV4ID0gdXJsLmluZGV4T2YoJyMnKVxyXG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xyXG4gICAgICB1cmwgPSB1cmwuc3Vic3RyaW5nKDAsIGluZGV4KVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVybFxyXG4gIH1cclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSHRtbFJlc29sdmVyOyIsImxldCByaCA9IHJlcXVpcmUoJy4uLy4uL2xpYi9yaCcpLFxyXG4gIF8gPSByaC5fLFxyXG4gICQgPSByaC4kXHJcblxyXG5fLnJlc2V0SWZyYW1lU2l6ZSA9IHNlbGVjdG9yID0+IHtcclxuICBsZXQgaWZyYW1lID0gJChzZWxlY3RvciwgMClcclxuICByZXR1cm4gaWZyYW1lXHJcbn1cclxuIiwibGV0IHJoID0gcmVxdWlyZShcIi4uLy4uL2xpYi9yaFwiKVxyXG5sZXQgXyA9IHJoLl9cclxubGV0IGtleUhhc2ggPSB7XHJcbiAgODogIFwiYmFja3NwYWNlXCIsXHJcbiAgMTM6IFwicmV0dXJuXCIsXHJcbiAgMjc6IFwiZXNjYXBlXCIsXHJcbiAgMzg6IFwiZG93blwiLFxyXG4gIDQwOiBcInVwXCIsXHJcbiAgMzk6IFwicmlnaHRcIlxyXG59XHJcblxyXG5fLmdldEtleUluZGV4ID0gKGtleUNvZGUpID0+IHtcclxuICBpZihrZXlIYXNoW2tleUNvZGVdKSB7XHJcbiAgICByZXR1cm4ga2V5SGFzaFtrZXlDb2RlXVxyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gXCJkZWZhdWx0XCJcclxuICB9XHJcbn1cclxuIiwibGV0IHJoID0gcmVxdWlyZShcIi4uLy4uL2xpYi9yaFwiKVxyXG5sZXQgJCA9IHJoLiRcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gIG5vZGVUeXBlOiB7XHJcbiAgICBFTEVNRU5UX05PREU6IDEsXHJcbiAgICBBVFRSSUJVVEVfTk9ERTogMixcclxuICAgIFRFWFRfTk9ERTogMyxcclxuICAgIENEQVRBX1NFQ1RJT05fTk9ERTogNCxcclxuICAgIEVOVElUWV9SRUZFUkVOQ0VfTk9ERTogNSxcclxuICAgIEVOVElUWV9OT0RFOiA2LFxyXG4gICAgUFJPQ0VTU0lOR19JTlNUUlVDVElPTl9OT0RFOiA3LFxyXG4gICAgQ09NTUVOVF9OT0RFOiA4LFxyXG4gICAgRE9DVU1FTlRfTk9ERTogOSxcclxuICAgIERPQ1VNRU5UX1RZUEVfTk9ERTogMTAsXHJcbiAgICBET0NVTUVOVF9GUkFHTUVOVF9OT0RFOiAxMSxcclxuICAgIE5PVEFUSU9OX05PREU6IDEyXHJcbiAgfSxcclxuXHJcbiAgcmVtb3ZlQ2hpbGQobm9kZSwgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlKG5vZGUpKSB7XHJcbiAgICByZXR1cm4gcGFyZW50ICYmIHBhcmVudC5yZW1vdmVDaGlsZCAmJiBwYXJlbnQucmVtb3ZlQ2hpbGQobm9kZSlcclxuICB9LFxyXG4gIGFwcGVuZENoaWxkKHBhcmVudCwgbmV3Tm9kZSkge1xyXG4gICAgcmV0dXJuIHBhcmVudCAmJiBwYXJlbnQuYXBwZW5kQ2hpbGQgJiYgcGFyZW50LmFwcGVuZENoaWxkKG5ld05vZGUpXHJcbiAgfSxcclxuICBwYXJlbnROb2RlKG5vZGUpIHtcclxuICAgIHJldHVybiBub2RlICYmIG5vZGUucGFyZW50Tm9kZVxyXG4gIH0sXHJcbiAgY2hpbGROb2Rlcyhub2RlKSB7XHJcbiAgICByZXR1cm4gbm9kZSAmJiBub2RlLmNoaWxkTm9kZXMgfHwgW11cclxuICB9LFxyXG4gIHRvSHRtbE5vZGUoaHRtbCkge1xyXG4gICAgcmV0dXJuIHRoaXMuY2hpbGROb2RlcygkLmNyZWF0ZUVsZW1lbnQoJ2RpdicsIGh0bWwpKVxyXG4gIH0sXHJcbiAgb3V0ZXJIVE1MKG5vZGUpIHtcclxuICAgIHJldHVybiBub2RlICYmIG5vZGUub3V0ZXJIVE1MIHx8ICcnXHJcbiAgfSxcclxuICBpbnNlcnRBZnRlcihub2RlLCBuZXdOb2RlKXtcclxuICAgIHJldHVybiBub2RlLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIG5vZGUubmV4dFNpYmxpbmcpXHJcbiAgfSxcclxuICB2YWx1ZShub2RlKSB7XHJcbiAgICByZXR1cm4gbm9kZSAmJiBub2RlLm5vZGVWYWx1ZVxyXG4gIH0sXHJcbiAgbmFtZShub2RlKSB7XHJcbiAgICByZXR1cm4gbm9kZSAmJiBub2RlLm5vZGVOYW1lXHJcbiAgfSxcclxuICB0eXBlKG5vZGUpIHtcclxuICAgIHJldHVybiBub2RlICYmIG5vZGUubm9kZVR5cGVcclxuICB9LFxyXG4gIGlzRWxlbWVudE5vZGUobm9kZSkge1xyXG4gICAgcmV0dXJuIHRoaXMudHlwZShub2RlKSA9PT0gdGhpcy5ub2RlVHlwZS5FTEVNRU5UX05PREVcclxuICB9LFxyXG4gIGlzVGV4dE5vZGUobm9kZSkge1xyXG4gICAgcmV0dXJuIHRoaXMudHlwZShub2RlKSA9PT0gdGhpcy5ub2RlVHlwZS5URVhUX05PREVcclxuICB9XHJcbn0iLCJsZXQgcmggPSByZXF1aXJlKFwiLi4vLi4vbGliL3JoXCIpXHJcbmxldCBfID0gcmguX1xyXG5cclxuXy5hZGRQYXJhbSA9ICh1cmwsIGtleSwgdmFsdWUpID0+IHtcclxuICBsZXQgaGFzaFN0ciA9IF8uZXh0cmFjdEhhc2hTdHJpbmcodXJsKVxyXG4gIGxldCBwYXJhbXNTdHIgPSBfLmV4dHJhY3RQYXJhbVN0cmluZyh1cmwpXHJcbiAgbGV0IHBhcmFtc01hcCA9IF8udXJsUGFyYW1zKHBhcmFtc1N0cilcclxuICBwYXJhbXNNYXBba2V5XSA9IHZhbHVlXHJcbiAgbGV0IHN0cmlwcGVkVXJsID0gXy5zdHJpcEJvb2ttYXJrKHVybClcclxuICBzdHJpcHBlZFVybCA9IF8uc3RyaXBQYXJhbShzdHJpcHBlZFVybClcclxuXHJcbiAgbGV0IHVybEhhc2hTdHIgPSAoaGFzaFN0ciA9PT0gJycpPyBoYXNoU3RyIDogJyMnKyBoYXNoU3RyXHJcblxyXG4gIGxldCB1cGRhdGVkUGFyYW1zU3RyID0gcmguXy5tYXBUb0VuY29kZWRTdHJpbmcocGFyYW1zTWFwKVxyXG4gIGxldCB1cmxQYXJhbXNTdHIgPSAodXBkYXRlZFBhcmFtc1N0ciA9PT0gJycpP3VwZGF0ZWRQYXJhbXNTdHI6ICc/JyArIHVwZGF0ZWRQYXJhbXNTdHJcclxuICByZXR1cm4gc3RyaXBwZWRVcmwgKyB1cmxQYXJhbXNTdHIgKyB1cmxIYXNoU3RyXHJcbn1cclxuXHJcbl8ucmVtb3ZlUGFyYW0gPSAodXJsLCBwYXJhbSkgPT4ge1xyXG4gIGxldCBoYXNoU3RyID0gXy5leHRyYWN0SGFzaFN0cmluZyh1cmwpXHJcbiAgbGV0IHBhcmFtc1N0ciA9IF8uZXh0cmFjdFBhcmFtU3RyaW5nKHVybClcclxuICBsZXQgcGFyYW1zTWFwID0gXy51cmxQYXJhbXMocGFyYW1zU3RyKVxyXG4gIHBhcmFtc01hcFtwYXJhbV0gPSBudWxsXHJcbiAgbGV0IHN0cmlwcGVkVXJsID0gXy5zdHJpcEJvb2ttYXJrKHVybClcclxuICBzdHJpcHBlZFVybCA9IF8uc3RyaXBQYXJhbShzdHJpcHBlZFVybClcclxuXHJcbiAgbGV0IHVybEhhc2hTdHIgPSAoaGFzaFN0ciA9PT0gJycpPyBoYXNoU3RyIDogJyMnKyBoYXNoU3RyXHJcblxyXG4gIGxldCB1cGRhdGVkUGFyYW1zU3RyID0gcmguXy5tYXBUb0VuY29kZWRTdHJpbmcocGFyYW1zTWFwKVxyXG4gIGxldCB1cmxQYXJhbXNTdHIgPSAodXBkYXRlZFBhcmFtc1N0ciA9PT0gJycpP3VwZGF0ZWRQYXJhbXNTdHI6ICc/JyArIHVwZGF0ZWRQYXJhbXNTdHJcclxuICByZXR1cm4gc3RyaXBwZWRVcmwgKyB1cmxQYXJhbXNTdHIgKyB1cmxIYXNoU3RyXHJcbn1cclxuXHJcbl8uY3JlYXRlSGFzaGVkVXJsID0gKHVybCkgPT57XHJcbiAgLy9sZXQgaGFzaGVkVXJsID0gdXJsXHJcbiAgbGV0IHJlbFVybCwgcGFyYW1zXHJcbiAgaWYoIV8uaXNSb290VXJsKHVybCkpe1xyXG4gICAgbGV0IHJvb3RVcmwgPSBfLmdldFJvb3RVcmwoKVxyXG4gICAgaWYoXy5pc0V4dGVybmFsVXJsKHVybCkpe1xyXG4gICAgICByZWxVcmwgPSB1cmxcclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgIHBhcmFtcyA9IF8uZ2V0UGFyYW1zRm9yUm9vdCh1cmwsIHRydWUpXHJcbiAgICAgIHJlbFVybCA9IF8uZml4UmVsYXRpdmVVcmwoIF8ubWFrZVJlbGF0aXZlUGF0aCAodXJsLCByb290VXJsKSlcclxuICAgICAgdXJsID0gYCR7cm9vdFVybH0ke3BhcmFtc30jdD0ke2VuY29kZVVSSUNvbXBvbmVudChyZWxVcmwpfWBcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHVybFxyXG59XHJcbiJdfQ==
