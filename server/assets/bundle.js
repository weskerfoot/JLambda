(function () {
'use strict';

var __TAGS_CACHE = [];
var __TAG_IMPL = {};
var GLOBAL_MIXIN = '__global_mixin';
var ATTRS_PREFIX = 'riot-';
var REF_DIRECTIVES = ['ref', 'data-ref'];
var IS_DIRECTIVE = 'data-is';
var CONDITIONAL_DIRECTIVE = 'if';
var LOOP_DIRECTIVE = 'each';
var LOOP_NO_REORDER_DIRECTIVE = 'no-reorder';
var SHOW_DIRECTIVE = 'show';
var HIDE_DIRECTIVE = 'hide';
var RIOT_EVENTS_KEY = '__riot-events__';
var T_STRING = 'string';
var T_OBJECT = 'object';
var T_UNDEF  = 'undefined';
var T_FUNCTION = 'function';
var XLINK_NS = 'http://www.w3.org/1999/xlink';
var SVG_NS = 'http://www.w3.org/2000/svg';
var XLINK_REGEX = /^xlink:(\w+)/;
var WIN = typeof window === T_UNDEF ? undefined : window;
var RE_SPECIAL_TAGS = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?|opt(?:ion|group))$/;
var RE_SPECIAL_TAGS_NO_OPTION = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?)$/;
var RE_EVENTS_PREFIX = /^on/;
var RE_RESERVED_NAMES = /^(?:_(?:item|id|parent)|update|root|(?:un)?mount|mixin|is(?:Mounted|Loop)|tags|refs|parent|opts|trigger|o(?:n|ff|ne))$/;
var RE_HTML_ATTRS = /([-\w]+) ?= ?(?:"([^"]*)|'([^']*)|({[^}]*}))/g;
var CASE_SENSITIVE_ATTRIBUTES = { 'viewbox': 'viewBox' };
var RE_BOOL_ATTRS = /^(?:disabled|checked|readonly|required|allowfullscreen|auto(?:focus|play)|compact|controls|default|formnovalidate|hidden|ismap|itemscope|loop|multiple|muted|no(?:resize|shade|validate|wrap)?|open|reversed|seamless|selected|sortable|truespeed|typemustmatch)$/;
var IE_VERSION = (WIN && WIN.document || {}).documentMode | 0;

/**
 * Check Check if the passed argument is undefined
 * @param   { String } value -
 * @returns { Boolean } -
 */
function isBoolAttr(value) {
  return RE_BOOL_ATTRS.test(value)
}

/**
 * Check if passed argument is a function
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isFunction(value) {
  return typeof value === T_FUNCTION
}

/**
 * Check if passed argument is an object, exclude null
 * NOTE: use isObject(x) && !isArray(x) to excludes arrays.
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isObject(value) {
  return value && typeof value === T_OBJECT // typeof null is 'object'
}

/**
 * Check if passed argument is undefined
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isUndefined(value) {
  return typeof value === T_UNDEF
}

/**
 * Check if passed argument is a string
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isString(value) {
  return typeof value === T_STRING
}

/**
 * Check if passed argument is empty. Different from falsy, because we dont consider 0 or false to be blank
 * @param { * } value -
 * @returns { Boolean } -
 */
function isBlank(value) {
  return isUndefined(value) || value === null || value === ''
}

/**
 * Check if passed argument is a kind of array
 * @param   { * } value -
 * @returns { Boolean } -
 */
function isArray(value) {
  return Array.isArray(value) || value instanceof Array
}

/**
 * Check whether object's property could be overridden
 * @param   { Object }  obj - source object
 * @param   { String }  key - object property
 * @returns { Boolean } -
 */
function isWritable(obj, key) {
  var descriptor = Object.getOwnPropertyDescriptor(obj, key);
  return isUndefined(obj[key]) || descriptor && descriptor.writable
}

/**
 * Check if passed argument is a reserved name
 * @param   { String } value -
 * @returns { Boolean } -
 */
function isReservedName(value) {
  return RE_RESERVED_NAMES.test(value)
}

var check = Object.freeze({
	isBoolAttr: isBoolAttr,
	isFunction: isFunction,
	isObject: isObject,
	isUndefined: isUndefined,
	isString: isString,
	isBlank: isBlank,
	isArray: isArray,
	isWritable: isWritable,
	isReservedName: isReservedName
});

/**
 * Shorter and fast way to select multiple nodes in the DOM
 * @param   { String } selector - DOM selector
 * @param   { Object } ctx - DOM node where the targets of our search will is located
 * @returns { Object } dom nodes found
 */
function $$(selector, ctx) {
  return Array.prototype.slice.call((ctx || document).querySelectorAll(selector))
}

/**
 * Shorter and fast way to select a single node in the DOM
 * @param   { String } selector - unique dom selector
 * @param   { Object } ctx - DOM node where the target of our search will is located
 * @returns { Object } dom node found
 */
function $(selector, ctx) {
  return (ctx || document).querySelector(selector)
}

/**
 * Create a document fragment
 * @returns { Object } document fragment
 */
function createFrag() {
  return document.createDocumentFragment()
}

/**
 * Create a document text node
 * @returns { Object } create a text node to use as placeholder
 */
function createDOMPlaceholder() {
  return document.createTextNode('')
}

/**
 * Check if a DOM node is an svg tag
 * @param   { HTMLElement }  el - node we want to test
 * @returns {Boolean} true if it's an svg node
 */
function isSvg(el) {
  return !!el.ownerSVGElement
}

/**
 * Create a generic DOM node
 * @param   { String } name - name of the DOM node we want to create
 * @param   { Boolean } isSvg - true if we need to use an svg node
 * @returns { Object } DOM node just created
 */
function mkEl(name) {
  return name === 'svg' ? document.createElementNS(SVG_NS, name) : document.createElement(name)
}

/**
 * Set the inner html of any DOM node SVGs included
 * @param { Object } container - DOM node where we'll inject new html
 * @param { String } html - html to inject
 */
/* istanbul ignore next */
function setInnerHTML(container, html) {
  if (!isUndefined(container.innerHTML))
    { container.innerHTML = html; }
    // some browsers do not support innerHTML on the SVGs tags
  else {
    var doc = new DOMParser().parseFromString(html, 'application/xml');
    var node = container.ownerDocument.importNode(doc.documentElement, true);
    container.appendChild(node);
  }
}

/**
 * Toggle the visibility of any DOM node
 * @param   { Object }  dom - DOM node we want to hide
 * @param   { Boolean } show - do we want to show it?
 */

function toggleVisibility(dom, show) {
  dom.style.display = show ? '' : 'none';
  dom['hidden'] = show ? false : true;
}

/**
 * Remove any DOM attribute from a node
 * @param   { Object } dom - DOM node we want to update
 * @param   { String } name - name of the property we want to remove
 */
function remAttr(dom, name) {
  dom.removeAttribute(name);
}

/**
 * Convert a style object to a string
 * @param   { Object } style - style object we need to parse
 * @returns { String } resulting css string
 * @example
 * styleObjectToString({ color: 'red', height: '10px'}) // => 'color: red; height: 10px'
 */
function styleObjectToString(style) {
  return Object.keys(style).reduce(function (acc, prop) {
    return (acc + " " + prop + ": " + (style[prop]) + ";")
  }, '')
}

/**
 * Get the value of any DOM attribute on a node
 * @param   { Object } dom - DOM node we want to parse
 * @param   { String } name - name of the attribute we want to get
 * @returns { String | undefined } name of the node attribute whether it exists
 */
function getAttr(dom, name) {
  return dom.getAttribute(name)
}

/**
 * Set any DOM attribute
 * @param { Object } dom - DOM node we want to update
 * @param { String } name - name of the property we want to set
 * @param { String } val - value of the property we want to set
 */
function setAttr(dom, name, val) {
  var xlink = XLINK_REGEX.exec(name);
  if (xlink && xlink[1])
    { dom.setAttributeNS(XLINK_NS, xlink[1], val); }
  else
    { dom.setAttribute(name, val); }
}

/**
 * Insert safely a tag to fix #1962 #1649
 * @param   { HTMLElement } root - children container
 * @param   { HTMLElement } curr - node to insert
 * @param   { HTMLElement } next - node that should preceed the current node inserted
 */
function safeInsert(root, curr, next) {
  root.insertBefore(curr, next.parentNode && next);
}

/**
 * Minimize risk: only zero or one _space_ between attr & value
 * @param   { String }   html - html string we want to parse
 * @param   { Function } fn - callback function to apply on any attribute found
 */
function walkAttrs(html, fn) {
  if (!html)
    { return }
  var m;
  while (m = RE_HTML_ATTRS.exec(html))
    { fn(m[1].toLowerCase(), m[2] || m[3] || m[4]); }
}

/**
 * Walk down recursively all the children tags starting dom node
 * @param   { Object }   dom - starting node where we will start the recursion
 * @param   { Function } fn - callback to transform the child node just found
 * @param   { Object }   context - fn can optionally return an object, which is passed to children
 */
function walkNodes(dom, fn, context) {
  if (dom) {
    var res = fn(dom, context);
    var next;
    // stop the recursion
    if (res === false) { return }

    dom = dom.firstChild;

    while (dom) {
      next = dom.nextSibling;
      walkNodes(dom, fn, res);
      dom = next;
    }
  }
}

var dom = Object.freeze({
	$$: $$,
	$: $,
	createFrag: createFrag,
	createDOMPlaceholder: createDOMPlaceholder,
	isSvg: isSvg,
	mkEl: mkEl,
	setInnerHTML: setInnerHTML,
	toggleVisibility: toggleVisibility,
	remAttr: remAttr,
	styleObjectToString: styleObjectToString,
	getAttr: getAttr,
	setAttr: setAttr,
	safeInsert: safeInsert,
	walkAttrs: walkAttrs,
	walkNodes: walkNodes
});

var styleNode;
var cssTextProp;
var byName = {};
var remainder = [];
var needsInject = false;

// skip the following code on the server
if (WIN) {
  styleNode = (function () {
    // create a new style element with the correct type
    var newNode = mkEl('style');
    setAttr(newNode, 'type', 'text/css');

    // replace any user node or insert the new one into the head
    var userNode = $('style[type=riot]');
    /* istanbul ignore next */
    if (userNode) {
      if (userNode.id) { newNode.id = userNode.id; }
      userNode.parentNode.replaceChild(newNode, userNode);
    }
    else { document.getElementsByTagName('head')[0].appendChild(newNode); }

    return newNode
  })();
  cssTextProp = styleNode.styleSheet;
}

/**
 * Object that will be used to inject and manage the css of every tag instance
 */
var styleManager = {
  styleNode: styleNode,
  /**
   * Save a tag style to be later injected into DOM
   * @param { String } css - css string
   * @param { String } name - if it's passed we will map the css to a tagname
   */
  add: function add(css, name) {
    if (name) { byName[name] = css; }
    else { remainder.push(css); }
    needsInject = true;
  },
  /**
   * Inject all previously saved tag styles into DOM
   * innerHTML seems slow: http://jsperf.com/riot-insert-style
   */
  inject: function inject() {
    if (!WIN || !needsInject) { return }
    needsInject = false;
    var style = Object.keys(byName)
      .map(function(k) { return byName[k] })
      .concat(remainder).join('\n');
    /* istanbul ignore next */
    if (cssTextProp) { cssTextProp.cssText = style; }
    else { styleNode.innerHTML = style; }
  }
};

/**
 * The riot template engine
 * @version v3.0.8
 */

var skipRegex = (function () { //eslint-disable-line no-unused-vars

  var beforeReChars = '[{(,;:?=|&!^~>%*/';

  var beforeReWords = [
    'case',
    'default',
    'do',
    'else',
    'in',
    'instanceof',
    'prefix',
    'return',
    'typeof',
    'void',
    'yield'
  ];

  var wordsLastChar = beforeReWords.reduce(function (s, w) {
    return s + w.slice(-1)
  }, '');

  var RE_REGEX = /^\/(?=[^*>/])[^[/\\]*(?:(?:\\.|\[(?:\\.|[^\]\\]*)*\])[^[\\/]*)*?\/[gimuy]*/;
  var RE_VN_CHAR = /[$\w]/;

  function prev (code, pos) {
    while (--pos >= 0 && /\s/.test(code[pos])){  }
    return pos
  }

  function _skipRegex (code, start) {

    var re = /.*/g;
    var pos = re.lastIndex = start++;
    var match = re.exec(code)[0].match(RE_REGEX);

    if (match) {
      var next = pos + match[0].length;

      pos = prev(code, pos);
      var c = code[pos];

      if (pos < 0 || ~beforeReChars.indexOf(c)) {
        return next
      }

      if (c === '.') {

        if (code[pos - 1] === '.') {
          start = next;
        }

      } else if (c === '+' || c === '-') {

        if (code[--pos] !== c ||
            (pos = prev(code, pos)) < 0 ||
            !RE_VN_CHAR.test(code[pos])) {
          start = next;
        }

      } else if (~wordsLastChar.indexOf(c)) {

        var end = pos + 1;

        while (--pos >= 0 && RE_VN_CHAR.test(code[pos])){  }
        if (~beforeReWords.indexOf(code.slice(pos + 1, end))) {
          start = next;
        }
      }
    }

    return start
  }

  return _skipRegex

})();

/**
 * riot.util.brackets
 *
 * - `brackets    ` - Returns a string or regex based on its parameter
 * - `brackets.set` - Change the current riot brackets
 *
 * @module
 */

/* global riot */

var brackets = (function (UNDEF) {

  var
    REGLOB = 'g',

    R_MLCOMMS = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,

    R_STRINGS = /"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'|`[^`\\]*(?:\\[\S\s][^`\\]*)*`/g,

    S_QBLOCKS = R_STRINGS.source + '|' +
      /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/.source + '|' +
      /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?([^<]\/)[gim]*/.source,

    UNSUPPORTED = RegExp('[\\' + 'x00-\\x1F<>a-zA-Z0-9\'",;\\\\]'),

    NEED_ESCAPE = /(?=[[\]()*+?.^$|])/g,

    S_QBLOCK2 = R_STRINGS.source + '|' + /(\/)(?![*\/])/.source,

    FINDBRACES = {
      '(': RegExp('([()])|'   + S_QBLOCK2, REGLOB),
      '[': RegExp('([[\\]])|' + S_QBLOCK2, REGLOB),
      '{': RegExp('([{}])|'   + S_QBLOCK2, REGLOB)
    },

    DEFAULT = '{ }';

  var _pairs = [
    '{', '}',
    '{', '}',
    /{[^}]*}/,
    /\\([{}])/g,
    /\\({)|{/g,
    RegExp('\\\\(})|([[({])|(})|' + S_QBLOCK2, REGLOB),
    DEFAULT,
    /^\s*{\^?\s*([$\w]+)(?:\s*,\s*(\S+))?\s+in\s+(\S.*)\s*}/,
    /(^|[^\\]){=[\S\s]*?}/
  ];

  var
    cachedBrackets = UNDEF,
    _regex,
    _cache = [],
    _settings;

  function _loopback (re) { return re }

  function _rewrite (re, bp) {
    if (!bp) { bp = _cache; }
    return new RegExp(
      re.source.replace(/{/g, bp[2]).replace(/}/g, bp[3]), re.global ? REGLOB : ''
    )
  }

  function _create (pair) {
    if (pair === DEFAULT) { return _pairs }

    var arr = pair.split(' ');

    if (arr.length !== 2 || UNSUPPORTED.test(pair)) {
      throw new Error('Unsupported brackets "' + pair + '"')
    }
    arr = arr.concat(pair.replace(NEED_ESCAPE, '\\').split(' '));

    arr[4] = _rewrite(arr[1].length > 1 ? /{[\S\s]*?}/ : _pairs[4], arr);
    arr[5] = _rewrite(pair.length > 3 ? /\\({|})/g : _pairs[5], arr);
    arr[6] = _rewrite(_pairs[6], arr);
    arr[7] = RegExp('\\\\(' + arr[3] + ')|([[({])|(' + arr[3] + ')|' + S_QBLOCK2, REGLOB);
    arr[8] = pair;
    return arr
  }

  function _brackets (reOrIdx) {
    return reOrIdx instanceof RegExp ? _regex(reOrIdx) : _cache[reOrIdx]
  }

  _brackets.split = function split (str, tmpl, _bp) {
    // istanbul ignore next: _bp is for the compiler
    if (!_bp) { _bp = _cache; }

    var
      parts = [],
      match,
      isexpr,
      start,
      pos,
      re = _bp[6];

    var qblocks = [];
    var prevStr = '';
    var mark, lastIndex;

    isexpr = start = re.lastIndex = 0;

    while ((match = re.exec(str))) {

      lastIndex = re.lastIndex;
      pos = match.index;

      if (isexpr) {

        if (match[2]) {

          var ch = match[2];
          var rech = FINDBRACES[ch];
          var ix = 1;

          rech.lastIndex = lastIndex;
          while ((match = rech.exec(str))) {
            if (match[1]) {
              if (match[1] === ch) { ++ix; }
              else if (!--ix) { break }
            } else {
              rech.lastIndex = pushQBlock(match.index, rech.lastIndex, match[2]);
            }
          }
          re.lastIndex = ix ? str.length : rech.lastIndex;
          continue
        }

        if (!match[3]) {
          re.lastIndex = pushQBlock(pos, lastIndex, match[4]);
          continue
        }
      }

      if (!match[1]) {
        unescapeStr(str.slice(start, pos));
        start = re.lastIndex;
        re = _bp[6 + (isexpr ^= 1)];
        re.lastIndex = start;
      }
    }

    if (str && start < str.length) {
      unescapeStr(str.slice(start));
    }

    parts.qblocks = qblocks;

    return parts

    function unescapeStr (s) {
      if (prevStr) {
        s = prevStr + s;
        prevStr = '';
      }
      if (tmpl || isexpr) {
        parts.push(s && s.replace(_bp[5], '$1'));
      } else {
        parts.push(s);
      }
    }

    function pushQBlock(_pos, _lastIndex, slash) { //eslint-disable-line
      if (slash) {
        _lastIndex = skipRegex(str, _pos);
      }

      if (tmpl && _lastIndex > _pos + 2) {
        mark = '\u2057' + qblocks.length + '~';
        qblocks.push(str.slice(_pos, _lastIndex));
        prevStr += str.slice(start, _pos) + mark;
        start = _lastIndex;
      }
      return _lastIndex
    }
  };

  _brackets.hasExpr = function hasExpr (str) {
    return _cache[4].test(str)
  };

  _brackets.loopKeys = function loopKeys (expr) {
    var m = expr.match(_cache[9]);

    return m
      ? { key: m[1], pos: m[2], val: _cache[0] + m[3].trim() + _cache[1] }
      : { val: expr.trim() }
  };

  _brackets.array = function array (pair) {
    return pair ? _create(pair) : _cache
  };

  function _reset (pair) {
    if ((pair || (pair = DEFAULT)) !== _cache[8]) {
      _cache = _create(pair);
      _regex = pair === DEFAULT ? _loopback : _rewrite;
      _cache[9] = _regex(_pairs[9]);
    }
    cachedBrackets = pair;
  }

  function _setSettings (o) {
    var b;

    o = o || {};
    b = o.brackets;
    Object.defineProperty(o, 'brackets', {
      set: _reset,
      get: function () { return cachedBrackets },
      enumerable: true
    });
    _settings = o;
    _reset(b);
  }

  Object.defineProperty(_brackets, 'settings', {
    set: _setSettings,
    get: function () { return _settings }
  });

  /* istanbul ignore next: in the browser riot is always in the scope */
  _brackets.settings = typeof riot !== 'undefined' && riot.settings || {};
  _brackets.set = _reset;
  _brackets.skipRegex = skipRegex;

  _brackets.R_STRINGS = R_STRINGS;
  _brackets.R_MLCOMMS = R_MLCOMMS;
  _brackets.S_QBLOCKS = S_QBLOCKS;
  _brackets.S_QBLOCK2 = S_QBLOCK2;

  return _brackets

})();

/**
 * @module tmpl
 *
 * tmpl          - Root function, returns the template value, render with data
 * tmpl.hasExpr  - Test the existence of a expression inside a string
 * tmpl.loopKeys - Get the keys for an 'each' loop (used by `_each`)
 */

var tmpl = (function () {

  var _cache = {};

  function _tmpl (str, data) {
    if (!str) { return str }

    return (_cache[str] || (_cache[str] = _create(str))).call(
      data, _logErr.bind({
        data: data,
        tmpl: str
      })
    )
  }

  _tmpl.hasExpr = brackets.hasExpr;

  _tmpl.loopKeys = brackets.loopKeys;

  // istanbul ignore next
  _tmpl.clearCache = function () { _cache = {}; };

  _tmpl.errorHandler = null;

  function _logErr (err, ctx) {

    err.riotData = {
      tagName: ctx && ctx.__ && ctx.__.tagName,
      _riot_id: ctx && ctx._riot_id  //eslint-disable-line camelcase
    };

    if (_tmpl.errorHandler) { _tmpl.errorHandler(err); }
    else if (
      typeof console !== 'undefined' &&
      typeof console.error === 'function'
    ) {
      console.error(err.message);
      console.log('<%s> %s', err.riotData.tagName || 'Unknown tag', this.tmpl); // eslint-disable-line
      console.log(this.data); // eslint-disable-line
    }
  }

  function _create (str) {
    var expr = _getTmpl(str);

    if (expr.slice(0, 11) !== 'try{return ') { expr = 'return ' + expr; }

    return new Function('E', expr + ';')    // eslint-disable-line no-new-func
  }

  var RE_DQUOTE = /\u2057/g;
  var RE_QBMARK = /\u2057(\d+)~/g;

  function _getTmpl (str) {
    var parts = brackets.split(str.replace(RE_DQUOTE, '"'), 1);
    var qstr = parts.qblocks;
    var expr;

    if (parts.length > 2 || parts[0]) {
      var i, j, list = [];

      for (i = j = 0; i < parts.length; ++i) {

        expr = parts[i];

        if (expr && (expr = i & 1

            ? _parseExpr(expr, 1, qstr)

            : '"' + expr
                .replace(/\\/g, '\\\\')
                .replace(/\r\n?|\n/g, '\\n')
                .replace(/"/g, '\\"') +
              '"'

          )) { list[j++] = expr; }

      }

      expr = j < 2 ? list[0]
           : '[' + list.join(',') + '].join("")';

    } else {

      expr = _parseExpr(parts[1], 0, qstr);
    }

    if (qstr.length) {
      expr = expr.replace(RE_QBMARK, function (_, pos) {
        return qstr[pos]
          .replace(/\r/g, '\\r')
          .replace(/\n/g, '\\n')
      });
    }
    return expr
  }

  var RE_CSNAME = /^(?:(-?[_A-Za-z\xA0-\xFF][-\w\xA0-\xFF]*)|\u2057(\d+)~):/;
  var
    RE_BREND = {
      '(': /[()]/g,
      '[': /[[\]]/g,
      '{': /[{}]/g
    };

  function _parseExpr (expr, asText, qstr) {

    expr = expr
      .replace(/\s+/g, ' ').trim()
      .replace(/\ ?([[\({},?\.:])\ ?/g, '$1');

    if (expr) {
      var
        list = [],
        cnt = 0,
        match;

      while (expr &&
            (match = expr.match(RE_CSNAME)) &&
            !match.index
        ) {
        var
          key,
          jsb,
          re = /,|([[{(])|$/g;

        expr = RegExp.rightContext;
        key  = match[2] ? qstr[match[2]].slice(1, -1).trim().replace(/\s+/g, ' ') : match[1];

        while (jsb = (match = re.exec(expr))[1]) { skipBraces(jsb, re); }

        jsb  = expr.slice(0, match.index);
        expr = RegExp.rightContext;

        list[cnt++] = _wrapExpr(jsb, 1, key);
      }

      expr = !cnt ? _wrapExpr(expr, asText)
           : cnt > 1 ? '[' + list.join(',') + '].join(" ").trim()' : list[0];
    }
    return expr

    function skipBraces (ch, re) {
      var
        mm,
        lv = 1,
        ir = RE_BREND[ch];

      ir.lastIndex = re.lastIndex;
      while (mm = ir.exec(expr)) {
        if (mm[0] === ch) { ++lv; }
        else if (!--lv) { break }
      }
      re.lastIndex = lv ? expr.length : ir.lastIndex;
    }
  }

  // istanbul ignore next: not both
  var // eslint-disable-next-line max-len
    JS_CONTEXT = '"in this?this:' + (typeof window !== 'object' ? 'global' : 'window') + ').',
    JS_VARNAME = /[,{][\$\w]+(?=:)|(^ *|[^$\w\.{])(?!(?:typeof|true|false|null|undefined|in|instanceof|is(?:Finite|NaN)|void|NaN|new|Date|RegExp|Math)(?![$\w]))([$_A-Za-z][$\w]*)/g,
    JS_NOPROPS = /^(?=(\.[$\w]+))\1(?:[^.[(]|$)/;

  function _wrapExpr (expr, asText, key) {
    var tb;

    expr = expr.replace(JS_VARNAME, function (match, p, mvar, pos, s) {
      if (mvar) {
        pos = tb ? 0 : pos + match.length;

        if (mvar !== 'this' && mvar !== 'global' && mvar !== 'window') {
          match = p + '("' + mvar + JS_CONTEXT + mvar;
          if (pos) { tb = (s = s[pos]) === '.' || s === '(' || s === '['; }
        } else if (pos) {
          tb = !JS_NOPROPS.test(s.slice(pos));
        }
      }
      return match
    });

    if (tb) {
      expr = 'try{return ' + expr + '}catch(e){E(e,this)}';
    }

    if (key) {

      expr = (tb
          ? 'function(){' + expr + '}.call(this)' : '(' + expr + ')'
        ) + '?"' + key + '":""';

    } else if (asText) {

      expr = 'function(v){' + (tb
          ? expr.replace('return ', 'v=') : 'v=(' + expr + ')'
        ) + ';return v||v===0?v:""}.call(this)';
    }

    return expr
  }

  _tmpl.version = brackets.version = 'v3.0.8';

  return _tmpl

})();

var observable$1 = function(el) {

  /**
   * Extend the original object or create a new empty one
   * @type { Object }
   */

  el = el || {};

  /**
   * Private variables
   */
  var callbacks = {},
    slice = Array.prototype.slice;

  /**
   * Public Api
   */

  // extend the el object adding the observable methods
  Object.defineProperties(el, {
    /**
     * Listen to the given `event` ands
     * execute the `callback` each time an event is triggered.
     * @param  { String } event - event id
     * @param  { Function } fn - callback function
     * @returns { Object } el
     */
    on: {
      value: function(event, fn) {
        if (typeof fn == 'function')
          { (callbacks[event] = callbacks[event] || []).push(fn); }
        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Removes the given `event` listeners
     * @param   { String } event - event id
     * @param   { Function } fn - callback function
     * @returns { Object } el
     */
    off: {
      value: function(event, fn) {
        if (event == '*' && !fn) { callbacks = {}; }
        else {
          if (fn) {
            var arr = callbacks[event];
            for (var i = 0, cb; cb = arr && arr[i]; ++i) {
              if (cb == fn) { arr.splice(i--, 1); }
            }
          } else { delete callbacks[event]; }
        }
        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Listen to the given `event` and
     * execute the `callback` at most once
     * @param   { String } event - event id
     * @param   { Function } fn - callback function
     * @returns { Object } el
     */
    one: {
      value: function(event, fn) {
        function on() {
          el.off(event, on);
          fn.apply(el, arguments);
        }
        return el.on(event, on)
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Execute all callback functions that listen to
     * the given `event`
     * @param   { String } event - event id
     * @returns { Object } el
     */
    trigger: {
      value: function(event) {
        var arguments$1 = arguments;


        // getting the arguments
        var arglen = arguments.length - 1,
          args = new Array(arglen),
          fns,
          fn,
          i;

        for (i = 0; i < arglen; i++) {
          args[i] = arguments$1[i + 1]; // skip first argument
        }

        fns = slice.call(callbacks[event] || [], 0);

        for (i = 0; fn = fns[i]; ++i) {
          fn.apply(el, args);
        }

        if (callbacks['*'] && event != '*')
          { el.trigger.apply(el, ['*', event].concat(args)); }

        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    }
  });

  return el

};

/**
 * Specialized function for looping an array-like collection with `each={}`
 * @param   { Array } list - collection of items
 * @param   {Function} fn - callback function
 * @returns { Array } the array looped
 */
function each(list, fn) {
  var len = list ? list.length : 0;
  var i = 0;
  for (; i < len; ++i) {
    fn(list[i], i);
  }
  return list
}

/**
 * Check whether an array contains an item
 * @param   { Array } array - target array
 * @param   { * } item - item to test
 * @returns { Boolean } -
 */
function contains(array, item) {
  return array.indexOf(item) !== -1
}

/**
 * Convert a string containing dashes to camel case
 * @param   { String } str - input string
 * @returns { String } my-string -> myString
 */
function toCamel(str) {
  return str.replace(/-(\w)/g, function (_, c) { return c.toUpperCase(); })
}

/**
 * Faster String startsWith alternative
 * @param   { String } str - source string
 * @param   { String } value - test string
 * @returns { Boolean } -
 */
function startsWith(str, value) {
  return str.slice(0, value.length) === value
}

/**
 * Helper function to set an immutable property
 * @param   { Object } el - object where the new property will be set
 * @param   { String } key - object key where the new property will be stored
 * @param   { * } value - value of the new property
 * @param   { Object } options - set the propery overriding the default options
 * @returns { Object } - the initial object
 */
function defineProperty(el, key, value, options) {
  Object.defineProperty(el, key, extend({
    value: value,
    enumerable: false,
    writable: false,
    configurable: true
  }, options));
  return el
}

/**
 * Extend any object with other properties
 * @param   { Object } src - source object
 * @returns { Object } the resulting extended object
 *
 * var obj = { foo: 'baz' }
 * extend(obj, {bar: 'bar', foo: 'bar'})
 * console.log(obj) => {bar: 'bar', foo: 'bar'}
 *
 */
function extend(src) {
  var obj, args = arguments;
  for (var i = 1; i < args.length; ++i) {
    if (obj = args[i]) {
      for (var key in obj) {
        // check if this property of the source object could be overridden
        if (isWritable(src, key))
          { src[key] = obj[key]; }
      }
    }
  }
  return src
}

var misc = Object.freeze({
	each: each,
	contains: contains,
	toCamel: toCamel,
	startsWith: startsWith,
	defineProperty: defineProperty,
	extend: extend
});

var settings$1 = extend(Object.create(brackets.settings), {
  skipAnonymousTags: true,
  // handle the auto updates on any DOM event
  autoUpdate: true
});

/**
 * Trigger DOM events
 * @param   { HTMLElement } dom - dom element target of the event
 * @param   { Function } handler - user function
 * @param   { Object } e - event object
 */
function handleEvent(dom, handler, e) {
  var ptag = this.__.parent,
    item = this.__.item;

  if (!item)
    { while (ptag && !item) {
      item = ptag.__.item;
      ptag = ptag.__.parent;
    } }

  // override the event properties
  /* istanbul ignore next */
  if (isWritable(e, 'currentTarget')) { e.currentTarget = dom; }
  /* istanbul ignore next */
  if (isWritable(e, 'target')) { e.target = e.srcElement; }
  /* istanbul ignore next */
  if (isWritable(e, 'which')) { e.which = e.charCode || e.keyCode; }

  e.item = item;

  handler.call(this, e);

  // avoid auto updates
  if (!settings$1.autoUpdate) { return }

  if (!e.preventUpdate) {
    var p = getImmediateCustomParentTag(this);
    // fixes #2083
    if (p.isMounted) { p.update(); }
  }
}

/**
 * Attach an event to a DOM node
 * @param { String } name - event name
 * @param { Function } handler - event callback
 * @param { Object } dom - dom node
 * @param { Tag } tag - tag instance
 */
function setEventHandler(name, handler, dom, tag) {
  var eventName,
    cb = handleEvent.bind(tag, dom, handler);

  // avoid to bind twice the same event
  // possible fix for #2332
  dom[name] = null;

  // normalize event name
  eventName = name.replace(RE_EVENTS_PREFIX, '');

  // cache the listener into the listeners array
  if (!contains(tag.__.listeners, dom)) { tag.__.listeners.push(dom); }
  if (!dom[RIOT_EVENTS_KEY]) { dom[RIOT_EVENTS_KEY] = {}; }
  if (dom[RIOT_EVENTS_KEY][name]) { dom.removeEventListener(eventName, dom[RIOT_EVENTS_KEY][name]); }

  dom[RIOT_EVENTS_KEY][name] = cb;
  dom.addEventListener(eventName, cb, false);
}

/**
 * Update dynamically created data-is tags with changing expressions
 * @param { Object } expr - expression tag and expression info
 * @param { Tag }    parent - parent for tag creation
 * @param { String } tagName - tag implementation we want to use
 */
function updateDataIs(expr, parent, tagName) {
  var conf, isVirtual, head, ref;

  if (expr.tag && expr.tagName === tagName) {
    expr.tag.update();
    return
  }

  isVirtual = expr.dom.tagName === 'VIRTUAL';
  // sync _parent to accommodate changing tagnames
  if (expr.tag) {
    // need placeholder before unmount
    if(isVirtual) {
      head = expr.tag.__.head;
      ref = createDOMPlaceholder();
      head.parentNode.insertBefore(ref, head);
    }

    expr.tag.unmount(true);
  }

  if (!isString(tagName)) { return }

  expr.impl = __TAG_IMPL[tagName];
  conf = {root: expr.dom, parent: parent, hasImpl: true, tagName: tagName};
  expr.tag = initChildTag(expr.impl, conf, expr.dom.innerHTML, parent);
  each(expr.attrs, function (a) { return setAttr(expr.tag.root, a.name, a.value); });
  expr.tagName = tagName;
  expr.tag.mount();
  if (isVirtual)
    { makeReplaceVirtual(expr.tag, ref || expr.tag.root); } // root exist first time, after use placeholder

  // parent is the placeholder tag, not the dynamic tag so clean up
  parent.__.onUnmount = function() {
    var delName = expr.tag.opts.dataIs,
      tags = expr.tag.parent.tags,
      _tags = expr.tag.__.parent.tags;
    arrayishRemove(tags, delName, expr.tag);
    arrayishRemove(_tags, delName, expr.tag);
    expr.tag.unmount();
  };
}

/**
 * Nomalize any attribute removing the "riot-" prefix
 * @param   { String } attrName - original attribute name
 * @returns { String } valid html attribute name
 */
function normalizeAttrName(attrName) {
  if (!attrName) { return null }
  attrName = attrName.replace(ATTRS_PREFIX, '');
  if (CASE_SENSITIVE_ATTRIBUTES[attrName]) { attrName = CASE_SENSITIVE_ATTRIBUTES[attrName]; }
  return attrName
}

/**
 * Update on single tag expression
 * @this Tag
 * @param { Object } expr - expression logic
 * @returns { undefined }
 */
function updateExpression(expr) {
  if (this.root && getAttr(this.root,'virtualized')) { return }

  var dom = expr.dom,
    // remove the riot- prefix
    attrName = normalizeAttrName(expr.attr),
    isToggle = contains([SHOW_DIRECTIVE, HIDE_DIRECTIVE], attrName),
    isVirtual = expr.root && expr.root.tagName === 'VIRTUAL',
    parent = dom && (expr.parent || dom.parentNode),
    // detect the style attributes
    isStyleAttr = attrName === 'style',
    isClassAttr = attrName === 'class',
    hasValue,
    isObj,
    value;

  // if it's a tag we could totally skip the rest
  if (expr._riot_id) {
    if (expr.isMounted) {
      expr.update();
    // if it hasn't been mounted yet, do that now.
    } else {
      expr.mount();
      if (isVirtual) {
        makeReplaceVirtual(expr, expr.root);
      }
    }
    return
  }
  // if this expression has the update method it means it can handle the DOM changes by itself
  if (expr.update) { return expr.update() }

  // ...it seems to be a simple expression so we try to calculat its value
  value = tmpl(expr.expr, isToggle ? extend({}, Object.create(this.parent), this) : this);
  hasValue = !isBlank(value);
  isObj = isObject(value);

  // convert the style/class objects to strings
  if (isObj) {
    isObj = !isClassAttr && !isStyleAttr;
    if (isClassAttr) {
      value = tmpl(JSON.stringify(value), this);
    } else if (isStyleAttr) {
      value = styleObjectToString(value);
    }
  }

  // remove original attribute
  if (expr.attr && (!expr.isAttrRemoved || !hasValue || value === false)) {
    remAttr(dom, expr.attr);
    expr.isAttrRemoved = true;
  }

  // for the boolean attributes we don't need the value
  // we can convert it to checked=true to checked=checked
  if (expr.bool) { value = value ? attrName : false; }
  if (expr.isRtag) { return updateDataIs(expr, this, value) }
  if (expr.wasParsedOnce && expr.value === value) { return }

  // update the expression value
  expr.value = value;
  expr.wasParsedOnce = true;

  // if the value is an object we can not do much more with it
  if (isObj && !isToggle) { return }
  // avoid to render undefined/null values
  if (isBlank(value)) { value = ''; }

  // textarea and text nodes have no attribute name
  if (!attrName) {
    // about #815 w/o replace: the browser converts the value to a string,
    // the comparison by "==" does too, but not in the server
    value += '';
    // test for parent avoids error with invalid assignment to nodeValue
    if (parent) {
      // cache the parent node because somehow it will become null on IE
      // on the next iteration
      expr.parent = parent;
      if (parent.tagName === 'TEXTAREA') {
        parent.value = value;                    // #1113
        if (!IE_VERSION) { dom.nodeValue = value; }  // #1625 IE throws here, nodeValue
      }                                         // will be available on 'updated'
      else { dom.nodeValue = value; }
    }
    return
  }


  // event handler
  if (isFunction(value)) {
    setEventHandler(attrName, value, dom, this);
  // show / hide
  } else if (isToggle) {
    toggleVisibility(dom, attrName === HIDE_DIRECTIVE ? !value : value);
  // handle attributes
  } else {
    if (expr.bool) {
      dom[attrName] = value;
    }

    if (attrName === 'value' && dom.value !== value) {
      dom.value = value;
    }

    if (hasValue && value !== false) {
      setAttr(dom, attrName, value);
    }

    // make sure that in case of style changes
    // the element stays hidden
    if (isStyleAttr && dom.hidden) { toggleVisibility(dom, false); }
  }
}

/**
 * Update all the expressions in a Tag instance
 * @this Tag
 * @param { Array } expressions - expression that must be re evaluated
 */
function updateAllExpressions(expressions) {
  each(expressions, updateExpression.bind(this));
}

var IfExpr = {
  init: function init(dom, tag, expr) {
    remAttr(dom, CONDITIONAL_DIRECTIVE);
    this.tag = tag;
    this.expr = expr;
    this.stub = createDOMPlaceholder();
    this.pristine = dom;

    var p = dom.parentNode;
    p.insertBefore(this.stub, dom);
    p.removeChild(dom);

    return this
  },
  update: function update() {
    this.value = tmpl(this.expr, this.tag);

    if (this.value && !this.current) { // insert
      this.current = this.pristine.cloneNode(true);
      this.stub.parentNode.insertBefore(this.current, this.stub);
      this.expressions = [];
      parseExpressions.apply(this.tag, [this.current, this.expressions, true]);
    } else if (!this.value && this.current) { // remove
      unmountAll(this.expressions);
      if (this.current._tag) {
        this.current._tag.unmount();
      } else if (this.current.parentNode) {
        this.current.parentNode.removeChild(this.current);
      }
      this.current = null;
      this.expressions = [];
    }

    if (this.value) { updateAllExpressions.call(this.tag, this.expressions); }
  },
  unmount: function unmount() {
    unmountAll(this.expressions || []);
  }
};

var RefExpr = {
  init: function init(dom, parent, attrName, attrValue) {
    this.dom = dom;
    this.attr = attrName;
    this.rawValue = attrValue;
    this.parent = parent;
    this.hasExp = tmpl.hasExpr(attrValue);
    return this
  },
  update: function update() {
    var old = this.value;
    var customParent = this.parent && getImmediateCustomParentTag(this.parent);
    // if the referenced element is a custom tag, then we set the tag itself, rather than DOM
    var tagOrDom = this.dom.__ref || this.tag || this.dom;

    this.value = this.hasExp ? tmpl(this.rawValue, this.parent) : this.rawValue;

    // the name changed, so we need to remove it from the old key (if present)
    if (!isBlank(old) && customParent) { arrayishRemove(customParent.refs, old, tagOrDom); }
    if (!isBlank(this.value) && isString(this.value)) {
      // add it to the refs of parent tag (this behavior was changed >=3.0)
      if (customParent) { arrayishAdd(
        customParent.refs,
        this.value,
        tagOrDom,
        // use an array if it's a looped node and the ref is not an expression
        null,
        this.parent.__.index
      ); }

      if (this.value !== old) {
        setAttr(this.dom, this.attr, this.value);
      }
    } else {
      remAttr(this.dom, this.attr);
    }

    // cache the ref bound to this dom node
    // to reuse it in future (see also #2329)
    if (!this.dom.__ref) { this.dom.__ref = tagOrDom; }
  },
  unmount: function unmount() {
    var tagOrDom = this.tag || this.dom;
    var customParent = this.parent && getImmediateCustomParentTag(this.parent);
    if (!isBlank(this.value) && customParent)
      { arrayishRemove(customParent.refs, this.value, tagOrDom); }
  }
};

/**
 * Convert the item looped into an object used to extend the child tag properties
 * @param   { Object } expr - object containing the keys used to extend the children tags
 * @param   { * } key - value to assign to the new object returned
 * @param   { * } val - value containing the position of the item in the array
 * @param   { Object } base - prototype object for the new item
 * @returns { Object } - new object containing the values of the original item
 *
 * The variables 'key' and 'val' are arbitrary.
 * They depend on the collection type looped (Array, Object)
 * and on the expression used on the each tag
 *
 */
function mkitem(expr, key, val, base) {
  var item = base ? Object.create(base) : {};
  item[expr.key] = key;
  if (expr.pos) { item[expr.pos] = val; }
  return item
}

/**
 * Unmount the redundant tags
 * @param   { Array } items - array containing the current items to loop
 * @param   { Array } tags - array containing all the children tags
 */
function unmountRedundant(items, tags) {
  var i = tags.length,
    j = items.length;

  while (i > j) {
    i--;
    remove.apply(tags[i], [tags, i]);
  }
}


/**
 * Remove a child tag
 * @this Tag
 * @param   { Array } tags - tags collection
 * @param   { Number } i - index of the tag to remove
 */
function remove(tags, i) {
  tags.splice(i, 1);
  this.unmount();
  arrayishRemove(this.parent, this, this.__.tagName, true);
}

/**
 * Move the nested custom tags in non custom loop tags
 * @this Tag
 * @param   { Number } i - current position of the loop tag
 */
function moveNestedTags(i) {
  var this$1 = this;

  each(Object.keys(this.tags), function (tagName) {
    moveChildTag.apply(this$1.tags[tagName], [tagName, i]);
  });
}

/**
 * Move a child tag
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Tag } nextTag - instance of the next tag preceding the one we want to move
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function move(root, nextTag, isVirtual) {
  if (isVirtual)
    { moveVirtual.apply(this, [root, nextTag]); }
  else
    { safeInsert(root, this.root, nextTag.root); }
}

/**
 * Insert and mount a child tag
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Tag } nextTag - instance of the next tag preceding the one we want to insert
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function insert(root, nextTag, isVirtual) {
  if (isVirtual)
    { makeVirtual.apply(this, [root, nextTag]); }
  else
    { safeInsert(root, this.root, nextTag.root); }
}

/**
 * Append a new tag into the DOM
 * @this Tag
 * @param   { HTMLElement } root - dom node containing all the loop children
 * @param   { Boolean } isVirtual - is it a virtual tag?
 */
function append(root, isVirtual) {
  if (isVirtual)
    { makeVirtual.call(this, root); }
  else
    { root.appendChild(this.root); }
}

/**
 * Manage tags having the 'each'
 * @param   { HTMLElement } dom - DOM node we need to loop
 * @param   { Tag } parent - parent tag instance where the dom node is contained
 * @param   { String } expr - string contained in the 'each' attribute
 * @returns { Object } expression object for this each loop
 */
function _each(dom, parent, expr) {

  // remove the each property from the original tag
  remAttr(dom, LOOP_DIRECTIVE);

  var mustReorder = typeof getAttr(dom, LOOP_NO_REORDER_DIRECTIVE) !== T_STRING || remAttr(dom, LOOP_NO_REORDER_DIRECTIVE),
    tagName = getTagName(dom),
    impl = __TAG_IMPL[tagName],
    parentNode = dom.parentNode,
    placeholder = createDOMPlaceholder(),
    child = getTag(dom),
    ifExpr = getAttr(dom, CONDITIONAL_DIRECTIVE),
    tags = [],
    oldItems = [],
    hasKeys,
    isLoop = true,
    isAnonymous = !__TAG_IMPL[tagName],
    isVirtual = dom.tagName === 'VIRTUAL';

  // parse the each expression
  expr = tmpl.loopKeys(expr);
  expr.isLoop = true;

  if (ifExpr) { remAttr(dom, CONDITIONAL_DIRECTIVE); }

  // insert a marked where the loop tags will be injected
  parentNode.insertBefore(placeholder, dom);
  parentNode.removeChild(dom);

  expr.update = function updateEach() {
    // get the new items collection
    expr.value = tmpl(expr.val, parent);

    var frag = createFrag(),
      items = expr.value,
      isObject$$1 = !isArray(items) && !isString(items),
      root = placeholder.parentNode;

    // if this DOM was removed the update here is useless
    // this condition fixes also a weird async issue on IE in our unit test
    if (!root) { return }

    // object loop. any changes cause full redraw
    if (isObject$$1) {
      hasKeys = items || false;
      items = hasKeys ?
        Object.keys(items).map(function (key) {
          return mkitem(expr, items[key], key)
        }) : [];
    } else {
      hasKeys = false;
    }

    if (ifExpr) {
      items = items.filter(function(item, i) {
        if (expr.key && !isObject$$1)
          { return !!tmpl(ifExpr, mkitem(expr, item, i, parent)) }

        return !!tmpl(ifExpr, extend(Object.create(parent), item))
      });
    }

    // loop all the new items
    each(items, function(item, i) {
      // reorder only if the items are objects
      var
        doReorder = mustReorder && typeof item === T_OBJECT && !hasKeys,
        oldPos = oldItems.indexOf(item),
        isNew = oldPos === -1,
        pos = !isNew && doReorder ? oldPos : i,
        // does a tag exist in this position?
        tag = tags[pos],
        mustAppend = i >= oldItems.length,
        mustCreate =  doReorder && isNew || !doReorder && !tag;

      item = !hasKeys && expr.key ? mkitem(expr, item, i) : item;

      // new tag
      if (mustCreate) {
        tag = new Tag$1(impl, {
          parent: parent,
          isLoop: isLoop,
          isAnonymous: isAnonymous,
          tagName: tagName,
          root: dom.cloneNode(isAnonymous),
          item: item,
          index: i,
        }, dom.innerHTML);

        // mount the tag
        tag.mount();

        if (mustAppend)
          { append.apply(tag, [frag || root, isVirtual]); }
        else
          { insert.apply(tag, [root, tags[i], isVirtual]); }

        if (!mustAppend) { oldItems.splice(i, 0, item); }
        tags.splice(i, 0, tag);
        if (child) { arrayishAdd(parent.tags, tagName, tag, true); }
      } else if (pos !== i && doReorder) {
        // move
        if (contains(items, oldItems[pos])) {
          move.apply(tag, [root, tags[i], isVirtual]);
          // move the old tag instance
          tags.splice(i, 0, tags.splice(pos, 1)[0]);
          // move the old item
          oldItems.splice(i, 0, oldItems.splice(pos, 1)[0]);
        }

        // update the position attribute if it exists
        if (expr.pos) { tag[expr.pos] = i; }

        // if the loop tags are not custom
        // we need to move all their custom tags into the right position
        if (!child && tag.tags) { moveNestedTags.call(tag, i); }
      }

      // cache the original item to use it in the events bound to this node
      // and its children
      tag.__.item = item;
      tag.__.index = i;
      tag.__.parent = parent;

      if (!mustCreate) { tag.update(item); }
    });

    // remove the redundant tags
    unmountRedundant(items, tags);

    // clone the items array
    oldItems = items.slice();

    // this condition is weird u
    root.insertBefore(frag, placeholder);
  };

  expr.unmount = function() {
    each(tags, function(t) { t.unmount(); });
  };

  return expr
}

/**
 * Walk the tag DOM to detect the expressions to evaluate
 * @this Tag
 * @param   { HTMLElement } root - root tag where we will start digging the expressions
 * @param   { Array } expressions - empty array where the expressions will be added
 * @param   { Boolean } mustIncludeRoot - flag to decide whether the root must be parsed as well
 * @returns { Object } an object containing the root noode and the dom tree
 */
function parseExpressions(root, expressions, mustIncludeRoot) {
  var this$1 = this;

  var tree = {parent: {children: expressions}};

  walkNodes(root, function (dom, ctx) {
    var type = dom.nodeType, parent = ctx.parent, attr, expr, tagImpl;
    if (!mustIncludeRoot && dom === root) { return {parent: parent} }

    // text node
    if (type === 3 && dom.parentNode.tagName !== 'STYLE' && tmpl.hasExpr(dom.nodeValue))
      { parent.children.push({dom: dom, expr: dom.nodeValue}); }

    if (type !== 1) { return ctx } // not an element

    var isVirtual = dom.tagName === 'VIRTUAL';

    // loop. each does it's own thing (for now)
    if (attr = getAttr(dom, LOOP_DIRECTIVE)) {
      if(isVirtual) { setAttr(dom, 'loopVirtual', true); } // ignore here, handled in _each
      parent.children.push(_each(dom, this$1, attr));
      return false
    }

    // if-attrs become the new parent. Any following expressions (either on the current
    // element, or below it) become children of this expression.
    if (attr = getAttr(dom, CONDITIONAL_DIRECTIVE)) {
      parent.children.push(Object.create(IfExpr).init(dom, this$1, attr));
      return false
    }

    if (expr = getAttr(dom, IS_DIRECTIVE)) {
      if (tmpl.hasExpr(expr)) {
        parent.children.push({isRtag: true, expr: expr, dom: dom, attrs: [].slice.call(dom.attributes)});
        return false
      }
    }

    // if this is a tag, stop traversing here.
    // we ignore the root, since parseExpressions is called while we're mounting that root
    tagImpl = getTag(dom);
    if(isVirtual) {
      if(getAttr(dom, 'virtualized')) {dom.parentElement.removeChild(dom); } // tag created, remove from dom
      if(!tagImpl && !getAttr(dom, 'virtualized') && !getAttr(dom, 'loopVirtual'))  // ok to create virtual tag
        { tagImpl = { tmpl: dom.outerHTML }; }
    }

    if (tagImpl && (dom !== root || mustIncludeRoot)) {
      if(isVirtual && !getAttr(dom, IS_DIRECTIVE)) { // handled in update
        // can not remove attribute like directives
        // so flag for removal after creation to prevent maximum stack error
        setAttr(dom, 'virtualized', true);

        var tag = new Tag$1({ tmpl: dom.outerHTML },
          {root: dom, parent: this$1},
          dom.innerHTML);
        parent.children.push(tag); // no return, anonymous tag, keep parsing
      } else {
        var conf = {root: dom, parent: this$1, hasImpl: true};
        parent.children.push(initChildTag(tagImpl, conf, dom.innerHTML, this$1));
        return false
      }
    }

    // attribute expressions
    parseAttributes.apply(this$1, [dom, dom.attributes, function(attr, expr) {
      if (!expr) { return }
      parent.children.push(expr);
    }]);

    // whatever the parent is, all child elements get the same parent.
    // If this element had an if-attr, that's the parent for all child elements
    return {parent: parent}
  }, tree);
}

/**
 * Calls `fn` for every attribute on an element. If that attr has an expression,
 * it is also passed to fn.
 * @this Tag
 * @param   { HTMLElement } dom - dom node to parse
 * @param   { Array } attrs - array of attributes
 * @param   { Function } fn - callback to exec on any iteration
 */
function parseAttributes(dom, attrs, fn) {
  var this$1 = this;

  each(attrs, function (attr) {
    if (!attr) { return false }

    var name = attr.name, bool = isBoolAttr(name), expr;

    if (contains(REF_DIRECTIVES, name)) {
      expr =  Object.create(RefExpr).init(dom, this$1, name, attr.value);
    } else if (tmpl.hasExpr(attr.value)) {
      expr = {dom: dom, expr: attr.value, attr: name, bool: bool};
    }

    fn(attr, expr);
  });
}

/*
  Includes hacks needed for the Internet Explorer version 9 and below
  See: http://kangax.github.io/compat-table/es5/#ie8
       http://codeplanet.io/dropping-ie8/
*/

var reHasYield  = /<yield\b/i;
var reYieldAll  = /<yield\s*(?:\/>|>([\S\s]*?)<\/yield\s*>|>)/ig;
var reYieldSrc  = /<yield\s+to=['"]([^'">]*)['"]\s*>([\S\s]*?)<\/yield\s*>/ig;
var reYieldDest = /<yield\s+from=['"]?([-\w]+)['"]?\s*(?:\/>|>([\S\s]*?)<\/yield\s*>)/ig;
var rootEls = { tr: 'tbody', th: 'tr', td: 'tr', col: 'colgroup' };
var tblTags = IE_VERSION && IE_VERSION < 10 ? RE_SPECIAL_TAGS : RE_SPECIAL_TAGS_NO_OPTION;
var GENERIC = 'div';
var SVG = 'svg';


/*
  Creates the root element for table or select child elements:
  tr/th/td/thead/tfoot/tbody/caption/col/colgroup/option/optgroup
*/
function specialTags(el, tmpl, tagName) {

  var
    select = tagName[0] === 'o',
    parent = select ? 'select>' : 'table>';

  // trim() is important here, this ensures we don't have artifacts,
  // so we can check if we have only one element inside the parent
  el.innerHTML = '<' + parent + tmpl.trim() + '</' + parent;
  parent = el.firstChild;

  // returns the immediate parent if tr/th/td/col is the only element, if not
  // returns the whole tree, as this can include additional elements
  /* istanbul ignore next */
  if (select) {
    parent.selectedIndex = -1;  // for IE9, compatible w/current riot behavior
  } else {
    // avoids insertion of cointainer inside container (ex: tbody inside tbody)
    var tname = rootEls[tagName];
    if (tname && parent.childElementCount === 1) { parent = $(tname, parent); }
  }
  return parent
}

/*
  Replace the yield tag from any tag template with the innerHTML of the
  original tag in the page
*/
function replaceYield(tmpl, html) {
  // do nothing if no yield
  if (!reHasYield.test(tmpl)) { return tmpl }

  // be careful with #1343 - string on the source having `$1`
  var src = {};

  html = html && html.replace(reYieldSrc, function (_, ref, text) {
    src[ref] = src[ref] || text;   // preserve first definition
    return ''
  }).trim();

  return tmpl
    .replace(reYieldDest, function (_, ref, def) {  // yield with from - to attrs
      return src[ref] || def || ''
    })
    .replace(reYieldAll, function (_, def) {        // yield without any "from"
      return html || def || ''
    })
}

/**
 * Creates a DOM element to wrap the given content. Normally an `DIV`, but can be
 * also a `TABLE`, `SELECT`, `TBODY`, `TR`, or `COLGROUP` element.
 *
 * @param   { String } tmpl  - The template coming from the custom tag definition
 * @param   { String } html - HTML content that comes from the DOM element where you
 *           will mount the tag, mostly the original tag in the page
 * @param   { Boolean } isSvg - true if the root node is an svg
 * @returns { HTMLElement } DOM element with _tmpl_ merged through `YIELD` with the _html_.
 */
function mkdom(tmpl, html, isSvg$$1) {
  var match   = tmpl && tmpl.match(/^\s*<([-\w]+)/),
    tagName = match && match[1].toLowerCase(),
    el = mkEl(isSvg$$1 ? SVG : GENERIC);

  // replace all the yield tags with the tag inner html
  tmpl = replaceYield(tmpl, html);

  /* istanbul ignore next */
  if (tblTags.test(tagName))
    { el = specialTags(el, tmpl, tagName); }
  else
    { setInnerHTML(el, tmpl); }

  return el
}

/**
 * Another way to create a riot tag a bit more es6 friendly
 * @param { HTMLElement } el - tag DOM selector or DOM node/s
 * @param { Object } opts - tag logic
 * @returns { Tag } new riot tag instance
 */
function Tag$2(el, opts) {
  // get the tag properties from the class constructor
  var ref = this;
  var name = ref.name;
  var tmpl = ref.tmpl;
  var css = ref.css;
  var attrs = ref.attrs;
  var onCreate = ref.onCreate;
  // register a new tag and cache the class prototype
  if (!__TAG_IMPL[name]) {
    tag$1(name, tmpl, css, attrs, onCreate);
    // cache the class constructor
    __TAG_IMPL[name].class = this.constructor;
  }

  // mount the tag using the class instance
  mountTo(el, name, opts, this);
  // inject the component css
  if (css) { styleManager.inject(); }

  return this
}

/**
 * Create a new riot tag implementation
 * @param   { String }   name - name/id of the new riot tag
 * @param   { String }   tmpl - tag template
 * @param   { String }   css - custom tag css
 * @param   { String }   attrs - root tag attributes
 * @param   { Function } fn - user function
 * @returns { String } name/id of the tag just created
 */
function tag$1(name, tmpl, css, attrs, fn) {
  if (isFunction(attrs)) {
    fn = attrs;

    if (/^[\w\-]+\s?=/.test(css)) {
      attrs = css;
      css = '';
    } else
      { attrs = ''; }
  }

  if (css) {
    if (isFunction(css))
      { fn = css; }
    else
      { styleManager.add(css); }
  }

  name = name.toLowerCase();
  __TAG_IMPL[name] = { name: name, tmpl: tmpl, attrs: attrs, fn: fn };

  return name
}

/**
 * Create a new riot tag implementation (for use by the compiler)
 * @param   { String }   name - name/id of the new riot tag
 * @param   { String }   tmpl - tag template
 * @param   { String }   css - custom tag css
 * @param   { String }   attrs - root tag attributes
 * @param   { Function } fn - user function
 * @returns { String } name/id of the tag just created
 */
function tag2$1(name, tmpl, css, attrs, fn) {
  if (css) { styleManager.add(css, name); }

  __TAG_IMPL[name] = { name: name, tmpl: tmpl, attrs: attrs, fn: fn };

  return name
}

/**
 * Mount a tag using a specific tag implementation
 * @param   { * } selector - tag DOM selector or DOM node/s
 * @param   { String } tagName - tag implementation name
 * @param   { Object } opts - tag logic
 * @returns { Array } new tags instances
 */
function mount$1(selector, tagName, opts) {
  var tags = [];
  var elem, allTags;

  function pushTagsTo(root) {
    if (root.tagName) {
      var riotTag = getAttr(root, IS_DIRECTIVE), tag;

      // have tagName? force riot-tag to be the same
      if (tagName && riotTag !== tagName) {
        riotTag = tagName;
        setAttr(root, IS_DIRECTIVE, tagName);
      }

      tag = mountTo(root, riotTag || root.tagName.toLowerCase(), opts);

      if (tag)
        { tags.push(tag); }
    } else if (root.length)
      { each(root, pushTagsTo); } // assume nodeList
  }

  // inject styles into DOM
  styleManager.inject();

  if (isObject(tagName)) {
    opts = tagName;
    tagName = 0;
  }

  // crawl the DOM to find the tag
  if (isString(selector)) {
    selector = selector === '*' ?
      // select all registered tags
      // & tags found with the riot-tag attribute set
      allTags = selectTags() :
      // or just the ones named like the selector
      selector + selectTags(selector.split(/, */));

    // make sure to pass always a selector
    // to the querySelectorAll function
    elem = selector ? $$(selector) : [];
  }
  else
    // probably you have passed already a tag or a NodeList
    { elem = selector; }

  // select all the registered and mount them inside their root elements
  if (tagName === '*') {
    // get all custom tags
    tagName = allTags || selectTags();
    // if the root els it's just a single tag
    if (elem.tagName)
      { elem = $$(tagName, elem); }
    else {
      // select all the children for all the different root elements
      var nodeList = [];

      each(elem, function (_el) { return nodeList.push($$(tagName, _el)); });

      elem = nodeList;
    }
    // get rid of the tagName
    tagName = 0;
  }

  pushTagsTo(elem);

  return tags
}

// Create a mixin that could be globally shared across all the tags
var mixins = {};
var globals = mixins[GLOBAL_MIXIN] = {};
var mixins_id = 0;

/**
 * Create/Return a mixin by its name
 * @param   { String }  name - mixin name (global mixin if object)
 * @param   { Object }  mix - mixin logic
 * @param   { Boolean } g - is global?
 * @returns { Object }  the mixin logic
 */
function mixin$1(name, mix, g) {
  // Unnamed global
  if (isObject(name)) {
    mixin$1(("__" + (mixins_id++) + "__"), name, true);
    return
  }

  var store = g ? globals : mixins;

  // Getter
  if (!mix) {
    if (isUndefined(store[name]))
      { throw new Error(("Unregistered mixin: " + name)) }

    return store[name]
  }

  // Setter
  store[name] = isFunction(mix) ?
    extend(mix.prototype, store[name] || {}) && mix :
    extend(store[name] || {}, mix);
}

/**
 * Update all the tags instances created
 * @returns { Array } all the tags instances
 */
function update$1() {
  return each(__TAGS_CACHE, function (tag) { return tag.update(); })
}

function unregister$1(name) {
  __TAG_IMPL[name] = null;
}

var version$1 = 'WIP';


var core = Object.freeze({
	Tag: Tag$2,
	tag: tag$1,
	tag2: tag2$1,
	mount: mount$1,
	mixin: mixin$1,
	update: update$1,
	unregister: unregister$1,
	version: version$1
});

// counter to give a unique id to all the Tag instances
var __uid = 0;

/**
 * We need to update opts for this tag. That requires updating the expressions
 * in any attributes on the tag, and then copying the result onto opts.
 * @this Tag
 * @param   {Boolean} isLoop - is it a loop tag?
 * @param   { Tag }  parent - parent tag node
 * @param   { Boolean }  isAnonymous - is it a tag without any impl? (a tag not registered)
 * @param   { Object }  opts - tag options
 * @param   { Array }  instAttrs - tag attributes array
 */
function updateOpts(isLoop, parent, isAnonymous, opts, instAttrs) {
  // isAnonymous `each` tags treat `dom` and `root` differently. In this case
  // (and only this case) we don't need to do updateOpts, because the regular parse
  // will update those attrs. Plus, isAnonymous tags don't need opts anyway
  if (isLoop && isAnonymous) { return }

  var ctx = !isAnonymous && isLoop ? this : parent || this;
  each(instAttrs, function (attr) {
    if (attr.expr) { updateAllExpressions.call(ctx, [attr.expr]); }
    // normalize the attribute names
    opts[toCamel(attr.name).replace(ATTRS_PREFIX, '')] = attr.expr ? attr.expr.value : attr.value;
  });
}


/**
 * Tag class
 * @constructor
 * @param { Object } impl - it contains the tag template, and logic
 * @param { Object } conf - tag options
 * @param { String } innerHTML - html that eventually we need to inject in the tag
 */
function Tag$1(impl, conf, innerHTML) {
  if ( impl === void 0 ) impl = {};
  if ( conf === void 0 ) conf = {};

  var opts = extend({}, conf.opts),
    parent = conf.parent,
    isLoop = conf.isLoop,
    isAnonymous = !!conf.isAnonymous,
    skipAnonymous = settings$1.skipAnonymousTags && isAnonymous,
    item = cleanUpData(conf.item),
    index = conf.index, // available only for the looped nodes
    instAttrs = [], // All attributes on the Tag when it's first parsed
    implAttrs = [], // expressions on this type of Tag
    expressions = [],
    root = conf.root,
    tagName = conf.tagName || getTagName(root),
    isVirtual = tagName === 'virtual',
    isInline = !isVirtual && !impl.tmpl,
    propsInSyncWithParent = [],
    dom;

  // make this tag observable
  if (!skipAnonymous) { observable$1(this); }
  // only call unmount if we have a valid __TAG_IMPL (has name property)
  if (impl.name && root._tag) { root._tag.unmount(true); }

  // not yet mounted
  this.isMounted = false;

  defineProperty(this, '__', {
    isAnonymous: isAnonymous,
    instAttrs: instAttrs,
    innerHTML: innerHTML,
    tagName: tagName,
    index: index,
    isLoop: isLoop,
    isInline: isInline,
    // tags having event listeners
    // it would be better to use weak maps here but we can not introduce breaking changes now
    listeners: [],
    // these vars will be needed only for the virtual tags
    virts: [],
    tail: null,
    head: null,
    parent: null,
    item: null
  });

  // create a unique id to this tag
  // it could be handy to use it also to improve the virtual dom rendering speed
  defineProperty(this, '_riot_id', ++__uid); // base 1 allows test !t._riot_id
  defineProperty(this, 'root', root);
  extend(this, { opts: opts }, item);
  // protect the "tags" and "refs" property from being overridden
  defineProperty(this, 'parent', parent || null);
  defineProperty(this, 'tags', {});
  defineProperty(this, 'refs', {});

  if (isInline || isLoop && isAnonymous) {
    dom = root;
  } else {
    if (!isVirtual) { root.innerHTML = ''; }
    dom = mkdom(impl.tmpl, innerHTML, isSvg(root));
  }

  /**
   * Update the tag expressions and options
   * @param   { * }  data - data we want to use to extend the tag properties
   * @returns { Tag } the current tag instance
   */
  defineProperty(this, 'update', function tagUpdate(data) {
    var nextOpts = {},
      canTrigger = this.isMounted && !skipAnonymous;

    // make sure the data passed will not override
    // the component core methods
    data = cleanUpData(data);
    extend(this, data);
    updateOpts.apply(this, [isLoop, parent, isAnonymous, nextOpts, instAttrs]);

    if (canTrigger && this.isMounted && isFunction(this.shouldUpdate) && !this.shouldUpdate(data, nextOpts)) {
      return this
    }

    // inherit properties from the parent, but only for isAnonymous tags
    if (isLoop && isAnonymous) { inheritFrom.apply(this, [this.parent, propsInSyncWithParent]); }
    extend(opts, nextOpts);
    if (canTrigger) { this.trigger('update', data); }
    updateAllExpressions.call(this, expressions);
    if (canTrigger) { this.trigger('updated'); }

    return this

  }.bind(this));

  /**
   * Add a mixin to this tag
   * @returns { Tag } the current tag instance
   */
  defineProperty(this, 'mixin', function tagMixin() {
    var this$1 = this;

    each(arguments, function (mix) {
      var instance, obj;
      var props = [];

      // properties blacklisted and will not be bound to the tag instance
      var propsBlacklist = ['init', '__proto__'];

      mix = isString(mix) ? mixin$1(mix) : mix;

      // check if the mixin is a function
      if (isFunction(mix)) {
        // create the new mixin instance
        instance = new mix();
      } else { instance = mix; }

      var proto = Object.getPrototypeOf(instance);

      // build multilevel prototype inheritance chain property list
      do { props = props.concat(Object.getOwnPropertyNames(obj || instance)); }
      while (obj = Object.getPrototypeOf(obj || instance))

      // loop the keys in the function prototype or the all object keys
      each(props, function (key) {
        // bind methods to this
        // allow mixins to override other properties/parent mixins
        if (!contains(propsBlacklist, key)) {
          // check for getters/setters
          var descriptor = Object.getOwnPropertyDescriptor(instance, key) || Object.getOwnPropertyDescriptor(proto, key);
          var hasGetterSetter = descriptor && (descriptor.get || descriptor.set);

          // apply method only if it does not already exist on the instance
          if (!this$1.hasOwnProperty(key) && hasGetterSetter) {
            Object.defineProperty(this$1, key, descriptor);
          } else {
            this$1[key] = isFunction(instance[key]) ?
              instance[key].bind(this$1) :
              instance[key];
          }
        }
      });

      // init method will be called automatically
      if (instance.init)
        { instance.init.bind(this$1)(); }
    });
    return this
  }.bind(this));

  /**
   * Mount the current tag instance
   * @returns { Tag } the current tag instance
   */
  defineProperty(this, 'mount', function tagMount() {
    var this$1 = this;

    root._tag = this; // keep a reference to the tag just created

    // Read all the attrs on this instance. This give us the info we need for updateOpts
    parseAttributes.apply(parent, [root, root.attributes, function (attr, expr) {
      if (!isAnonymous && RefExpr.isPrototypeOf(expr)) { expr.tag = this$1; }
      attr.expr = expr;
      instAttrs.push(attr);
    }]);

    // update the root adding custom attributes coming from the compiler
    implAttrs = [];
    walkAttrs(impl.attrs, function (k, v) { implAttrs.push({name: k, value: v}); });
    parseAttributes.apply(this, [root, implAttrs, function (attr, expr) {
      if (expr) { expressions.push(expr); }
      else { setAttr(root, attr.name, attr.value); }
    }]);

    // initialiation
    updateOpts.apply(this, [isLoop, parent, isAnonymous, opts, instAttrs]);

    // add global mixins
    var globalMixin = mixin$1(GLOBAL_MIXIN);

    if (globalMixin && !skipAnonymous) {
      for (var i in globalMixin) {
        if (globalMixin.hasOwnProperty(i)) {
          this$1.mixin(globalMixin[i]);
        }
      }
    }

    if (impl.fn) { impl.fn.call(this, opts); }

    if (!skipAnonymous) { this.trigger('before-mount'); }

    // parse layout after init. fn may calculate args for nested custom tags
    parseExpressions.apply(this, [dom, expressions, isAnonymous]);

    this.update(item);

    if (!isAnonymous && !isInline) {
      while (dom.firstChild) { root.appendChild(dom.firstChild); }
    }

    defineProperty(this, 'root', root);
    defineProperty(this, 'isMounted', true);

    if (skipAnonymous) { return }

    // if it's not a child tag we can trigger its mount event
    if (!this.parent) {
      this.trigger('mount');
    }
    // otherwise we need to wait that the parent "mount" or "updated" event gets triggered
    else {
      var p = getImmediateCustomParentTag(this.parent);
      p.one(!p.isMounted ? 'mount' : 'updated', function () {
        this$1.trigger('mount');
      });
    }

    return this

  }.bind(this));

  /**
   * Unmount the tag instance
   * @param { Boolean } mustKeepRoot - if it's true the root node will not be removed
   * @returns { Tag } the current tag instance
   */
  defineProperty(this, 'unmount', function tagUnmount(mustKeepRoot) {
    var this$1 = this;

    var el = this.root,
      p = el.parentNode,
      ptag,
      tagIndex = __TAGS_CACHE.indexOf(this);

    if (!skipAnonymous) { this.trigger('before-unmount'); }

    // clear all attributes coming from the mounted tag
    walkAttrs(impl.attrs, function (name) {
      if (startsWith(name, ATTRS_PREFIX))
        { name = name.slice(ATTRS_PREFIX.length); }

      remAttr(root, name);
    });

    // remove all the event listeners
    this.__.listeners.forEach(function (dom) {
      Object.keys(dom[RIOT_EVENTS_KEY]).forEach(function (eventName) {
        dom.removeEventListener(eventName, dom[RIOT_EVENTS_KEY][eventName]);
      });
    });

    // remove this tag instance from the global virtualDom variable
    if (tagIndex !== -1)
      { __TAGS_CACHE.splice(tagIndex, 1); }

    if (p || isVirtual) {
      if (parent) {
        ptag = getImmediateCustomParentTag(parent);

        if (isVirtual) {
          Object.keys(this.tags).forEach(function (tagName) {
            arrayishRemove(ptag.tags, tagName, this$1.tags[tagName]);
          });
        } else {
          arrayishRemove(ptag.tags, tagName, this);
          // remove from _parent too
          if(parent !== ptag) {
            arrayishRemove(parent.tags, tagName, this);
          }
        }
      } else {
        // remove the tag contents
        setInnerHTML(el, '');
      }

      if (p && !mustKeepRoot) { p.removeChild(el); }
    }

    if (this.__.virts) {
      each(this.__.virts, function (v) {
        if (v.parentNode) { v.parentNode.removeChild(v); }
      });
    }

    // allow expressions to unmount themselves
    unmountAll(expressions);
    each(instAttrs, function (a) { return a.expr && a.expr.unmount && a.expr.unmount(); });

    // custom internal unmount function to avoid relying on the observable
    if (this.__.onUnmount) { this.__.onUnmount(); }

    if (!skipAnonymous) {
      this.trigger('unmount');
      this.off('*');
    }

    defineProperty(this, 'isMounted', false);

    delete this.root._tag;

    return this

  }.bind(this));
}

/**
 * Detect the tag implementation by a DOM node
 * @param   { Object } dom - DOM node we need to parse to get its tag implementation
 * @returns { Object } it returns an object containing the implementation of a custom tag (template and boot function)
 */
function getTag(dom) {
  return dom.tagName && __TAG_IMPL[getAttr(dom, IS_DIRECTIVE) ||
    getAttr(dom, IS_DIRECTIVE) || dom.tagName.toLowerCase()]
}

/**
 * Inherit properties from a target tag instance
 * @this Tag
 * @param   { Tag } target - tag where we will inherit properties
 * @param   { Array } propsInSyncWithParent - array of properties to sync with the target
 */
function inheritFrom(target, propsInSyncWithParent) {
  var this$1 = this;

  each(Object.keys(target), function (k) {
    // some properties must be always in sync with the parent tag
    var mustSync = !isReservedName(k) && contains(propsInSyncWithParent, k);

    if (isUndefined(this$1[k]) || mustSync) {
      // track the property to keep in sync
      // so we can keep it updated
      if (!mustSync) { propsInSyncWithParent.push(k); }
      this$1[k] = target[k];
    }
  });
}

/**
 * Move the position of a custom tag in its parent tag
 * @this Tag
 * @param   { String } tagName - key where the tag was stored
 * @param   { Number } newPos - index where the new tag will be stored
 */
function moveChildTag(tagName, newPos) {
  var parent = this.parent,
    tags;
  // no parent no move
  if (!parent) { return }

  tags = parent.tags[tagName];

  if (isArray(tags))
    { tags.splice(newPos, 0, tags.splice(tags.indexOf(this), 1)[0]); }
  else { arrayishAdd(parent.tags, tagName, this); }
}

/**
 * Create a new child tag including it correctly into its parent
 * @param   { Object } child - child tag implementation
 * @param   { Object } opts - tag options containing the DOM node where the tag will be mounted
 * @param   { String } innerHTML - inner html of the child node
 * @param   { Object } parent - instance of the parent tag including the child custom tag
 * @returns { Object } instance of the new child tag just created
 */
function initChildTag(child, opts, innerHTML, parent) {
  var tag = new Tag$1(child, opts, innerHTML),
    tagName = opts.tagName || getTagName(opts.root, true),
    ptag = getImmediateCustomParentTag(parent);
  // fix for the parent attribute in the looped elements
  defineProperty(tag, 'parent', ptag);
  // store the real parent tag
  // in some cases this could be different from the custom parent tag
  // for example in nested loops
  tag.__.parent = parent;

  // add this tag to the custom parent tag
  arrayishAdd(ptag.tags, tagName, tag);

  // and also to the real parent tag
  if (ptag !== parent)
    { arrayishAdd(parent.tags, tagName, tag); }

  return tag
}

/**
 * Loop backward all the parents tree to detect the first custom parent tag
 * @param   { Object } tag - a Tag instance
 * @returns { Object } the instance of the first custom parent tag found
 */
function getImmediateCustomParentTag(tag) {
  var ptag = tag;
  while (ptag.__.isAnonymous) {
    if (!ptag.parent) { break }
    ptag = ptag.parent;
  }
  return ptag
}

/**
 * Trigger the unmount method on all the expressions
 * @param   { Array } expressions - DOM expressions
 */
function unmountAll(expressions) {
  each(expressions, function(expr) {
    if (expr instanceof Tag$1) { expr.unmount(true); }
    else if (expr.tagName) { expr.tag.unmount(true); }
    else if (expr.unmount) { expr.unmount(); }
  });
}

/**
 * Get the tag name of any DOM node
 * @param   { Object } dom - DOM node we want to parse
 * @param   { Boolean } skipDataIs - hack to ignore the data-is attribute when attaching to parent
 * @returns { String } name to identify this dom node in riot
 */
function getTagName(dom, skipDataIs) {
  var child = getTag(dom),
    namedTag = !skipDataIs && getAttr(dom, IS_DIRECTIVE);
  return namedTag && !tmpl.hasExpr(namedTag) ?
                namedTag :
              child ? child.name : dom.tagName.toLowerCase()
}

/**
 * With this function we avoid that the internal Tag methods get overridden
 * @param   { Object } data - options we want to use to extend the tag instance
 * @returns { Object } clean object without containing the riot internal reserved words
 */
function cleanUpData(data) {
  if (!(data instanceof Tag$1) && !(data && isFunction(data.trigger)))
    { return data }

  var o = {};
  for (var key in data) {
    if (!RE_RESERVED_NAMES.test(key)) { o[key] = data[key]; }
  }
  return o
}

/**
 * Set the property of an object for a given key. If something already
 * exists there, then it becomes an array containing both the old and new value.
 * @param { Object } obj - object on which to set the property
 * @param { String } key - property name
 * @param { Object } value - the value of the property to be set
 * @param { Boolean } ensureArray - ensure that the property remains an array
 * @param { Number } index - add the new item in a certain array position
 */
function arrayishAdd(obj, key, value, ensureArray, index) {
  var dest = obj[key];
  var isArr = isArray(dest);
  var hasIndex = !isUndefined(index);

  if (dest && dest === value) { return }

  // if the key was never set, set it once
  if (!dest && ensureArray) { obj[key] = [value]; }
  else if (!dest) { obj[key] = value; }
  // if it was an array and not yet set
  else {
    if (isArr) {
      var oldIndex = dest.indexOf(value);
      // this item never changed its position
      if (oldIndex === index) { return }
      // remove the item from its old position
      if (oldIndex !== -1) { dest.splice(oldIndex, 1); }
      // move or add the item
      if (hasIndex) {
        dest.splice(index, 0, value);
      } else {
        dest.push(value);
      }
    } else { obj[key] = [dest, value]; }
  }
}

/**
 * Removes an item from an object at a given key. If the key points to an array,
 * then the item is just removed from the array.
 * @param { Object } obj - object on which to remove the property
 * @param { String } key - property name
 * @param { Object } value - the value of the property to be removed
 * @param { Boolean } ensureArray - ensure that the property remains an array
*/
function arrayishRemove(obj, key, value, ensureArray) {
  if (isArray(obj[key])) {
    var index = obj[key].indexOf(value);
    if (index !== -1) { obj[key].splice(index, 1); }
    if (!obj[key].length) { delete obj[key]; }
    else if (obj[key].length === 1 && !ensureArray) { obj[key] = obj[key][0]; }
  } else
    { delete obj[key]; } // otherwise just delete the key
}

/**
 * Mount a tag creating new Tag instance
 * @param   { Object } root - dom node where the tag will be mounted
 * @param   { String } tagName - name of the riot tag we want to mount
 * @param   { Object } opts - options to pass to the Tag instance
 * @param   { Object } ctx - optional context that will be used to extend an existing class ( used in riot.Tag )
 * @returns { Tag } a new Tag instance
 */
function mountTo(root, tagName, opts, ctx) {
  var impl = __TAG_IMPL[tagName],
    implClass = __TAG_IMPL[tagName].class,
    tag = ctx || (implClass ? Object.create(implClass.prototype) : {}),
    // cache the inner HTML to fix #855
    innerHTML = root._innerHTML = root._innerHTML || root.innerHTML;

  var conf = extend({ root: root, opts: opts }, { parent: opts ? opts.parent : null });

  if (impl && root) { Tag$1.apply(tag, [impl, conf, innerHTML]); }

  if (tag && tag.mount) {
    tag.mount(true);
    // add this tag to the virtualDom variable
    if (!contains(__TAGS_CACHE, tag)) { __TAGS_CACHE.push(tag); }
  }

  return tag
}

/**
 * makes a tag virtual and replaces a reference in the dom
 * @this Tag
 * @param { tag } the tag to make virtual
 * @param { ref } the dom reference location
 */
function makeReplaceVirtual(tag, ref) {
  var frag = createFrag();
  makeVirtual.call(tag, frag);
  ref.parentNode.replaceChild(frag, ref);
}

/**
 * Adds the elements for a virtual tag
 * @this Tag
 * @param { Node } src - the node that will do the inserting or appending
 * @param { Tag } target - only if inserting, insert before this tag's first child
 */
function makeVirtual(src, target) {
  var this$1 = this;

  var head = createDOMPlaceholder(),
    tail = createDOMPlaceholder(),
    frag = createFrag(),
    sib, el;

  this.root.insertBefore(head, this.root.firstChild);
  this.root.appendChild(tail);

  this.__.head = el = head;
  this.__.tail = tail;

  while (el) {
    sib = el.nextSibling;
    frag.appendChild(el);
    this$1.__.virts.push(el); // hold for unmounting
    el = sib;
  }

  if (target)
    { src.insertBefore(frag, target.__.head); }
  else
    { src.appendChild(frag); }
}

/**
 * Move virtual tag and all child nodes
 * @this Tag
 * @param { Node } src  - the node that will do the inserting
 * @param { Tag } target - insert before this tag's first child
 */
function moveVirtual(src, target) {
  var this$1 = this;

  var el = this.__.head,
    frag = createFrag(),
    sib;

  while (el) {
    sib = el.nextSibling;
    frag.appendChild(el);
    el = sib;
    if (el === this$1.__.tail) {
      frag.appendChild(el);
      src.insertBefore(frag, target.__.head);
      break
    }
  }
}

/**
 * Get selectors for tags
 * @param   { Array } tags - tag names to select
 * @returns { String } selector
 */
function selectTags(tags) {
  // select all tags
  if (!tags) {
    var keys = Object.keys(__TAG_IMPL);
    return keys + selectTags(keys)
  }

  return tags
    .filter(function (t) { return !/[^-\w]/.test(t); })
    .reduce(function (list, t) {
      var name = t.trim().toLowerCase();
      return list + ",[" + IS_DIRECTIVE + "=\"" + name + "\"]"
    }, '')
}


var tags = Object.freeze({
	getTag: getTag,
	inheritFrom: inheritFrom,
	moveChildTag: moveChildTag,
	initChildTag: initChildTag,
	getImmediateCustomParentTag: getImmediateCustomParentTag,
	unmountAll: unmountAll,
	getTagName: getTagName,
	cleanUpData: cleanUpData,
	arrayishAdd: arrayishAdd,
	arrayishRemove: arrayishRemove,
	mountTo: mountTo,
	makeReplaceVirtual: makeReplaceVirtual,
	makeVirtual: makeVirtual,
	moveVirtual: moveVirtual,
	selectTags: selectTags
});

/**
 * Riot public api
 */
var settings = settings$1;
var util = {
  tmpl: tmpl,
  brackets: brackets,
  styleManager: styleManager,
  vdom: __TAGS_CACHE,
  styleNode: styleManager.styleNode,
  // export the riot internal utils as well
  dom: dom,
  check: check,
  misc: misc,
  tags: tags
};

// export the core props/methods










var riot$1 = extend({}, core, {
  observable: observable$1,
  settings: settings,
  util: util,
});

/*
 * This file defines common error objects
 * for reporting on syntax errors, type errors,
 * and perhaps runtime exceptions although I have
 * not thought about how that will work much
 */

function JSyntaxError(linenum, charnum, message) {
  this.linenum = linenum;
  this.charnum = charnum;
  this.errormessage = message;
  this.stxerror = function() {
    console.log("Syntax Error\n",
                "Line #", this.linenum,"\n",
                "Near character #", this.charnum, "\n",
                this.errormessage);
  };
  return this;
}

function JTypeError(linenum, charnum, token, message) {
  this.linenum = linenum;
  this.charnum = charnum;
  this.errormessage = message;
  this.token = token;
  return this;
}

function JInternalError(message) {
  this.errormessage = message;
  return this;
}

var errors = {JSyntaxError : JSyntaxError,
   JTypeError : JTypeError,
   JInternalError : JInternalError
  };

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var underscore = createCommonjsModule(function (module, exports) {
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) { return obj; }
    if (!(this instanceof _)) { return new _(obj); }
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  {
    if ('object' !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) { return func; }
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) { return _.identity; }
    if (_.isFunction(value)) { return optimizeCb(value, context, argCount); }
    if (_.isObject(value)) { return _.matcher(value); }
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var arguments$1 = arguments;

      var length = arguments.length;
      if (length < 2 || obj == null) { return obj; }
      for (var index = 1; index < length; index++) {
        var source = arguments$1[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) { obj[key] = source[key]; }
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) { return {}; }
    if (nativeCreate) { return nativeCreate(prototype); }
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) { return obj[key]; }
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) { results.push(value); }
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) { return false; }
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) { return true; }
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) { obj = _.values(obj); }
    if (typeof fromIndex != 'number' || guard) { fromIndex = 0; }
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) { shuffled[index] = shuffled[rand]; }
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) { obj = _.values(obj); }
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) { return 1; }
        if (a < b || b === void 0) { return -1; }
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) { result[key].push(value); } else { result[key] = [value]; }
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) { result[key]++; } else { result[key] = 1; }
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) { return []; }
    if (_.isArray(obj)) { return slice.call(obj); }
    if (isArrayLike(obj)) { return _.map(obj, _.identity); }
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) { return 0; }
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) { return void 0; }
    if (n == null || guard) { return array[0]; }
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) { return void 0; }
    if (n == null || guard) { return array[array.length - 1]; }
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) { value = flatten(value, shallow, strict); }
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) { iteratee = cb(iteratee, context); }
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) { result.push(value); }
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var arguments$1 = arguments;

    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) { continue; }
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments$1[j], item)) { break; }
      }
      if (j === argsLength) { result.push(item); }
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) { return index; }
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) { low = mid + 1; } else { high = mid; }
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) { return idx; }
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) { return sourceFunc.apply(context, args); }
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) { return result; }
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) { return nativeBind.apply(func, slice.call(arguments, 1)); }
    if (!_.isFunction(func)) { throw new TypeError('Bind must be called on a function'); }
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var arguments$1 = arguments;

      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments$1[position++] : boundArgs[i];
      }
      while (position < arguments.length) { args.push(arguments$1[position++]); }
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var arguments$1 = arguments;

    var i, length = arguments.length, key;
    if (length <= 1) { throw new Error('bindAll must be passed function names'); }
    for (i = 1; i < length; i++) {
      key = arguments$1[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) { cache[address] = func.apply(this, arguments); }
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) { options = {}; }
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) { context = args = null; }
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) { previous = now; }
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) { context = args = null; }
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) { context = args = null; }
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) { timeout = setTimeout(later, wait); }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var this$1 = this;

      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) { result = args[i].call(this$1, result); }
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) { func = null; }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) { keys.push(prop); }

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) { return []; }
    if (nativeKeys) { return nativeKeys(obj); }
    var keys = [];
    for (var key in obj) { if (_.has(obj, key)) { keys.push(key); } }
    // Ahem, IE < 9.
    if (hasEnumBug) { collectNonEnumProps(obj, keys); }
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) { return []; }
    var keys = [];
    for (var key in obj) { keys.push(key); }
    // Ahem, IE < 9.
    if (hasEnumBug) { collectNonEnumProps(obj, keys); }
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) { names.push(key); }
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) { return key; }
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) { return result; }
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) { result[key] = value; }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) { _.extendOwn(result, props); }
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) { return obj; }
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) { return !length; }
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) { return false; }
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) { return a !== 0 || 1 / a === 1 / b; }
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) { return a === b; }
    // Unwrap any wrapped objects.
    if (a instanceof _) { a = a._wrapped; }
    if (b instanceof _) { b = b._wrapped; }
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) { return false; }
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) { return +b !== +b; }
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') { return false; }

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) { return bStack[length] === b; }
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) { return false; }
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) { return false; }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) { return false; }
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) { return false; }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) { return true; }
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) { return obj.length === 0; }
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) { accum[i] = iteratee(i); }
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) { settings = oldSettings; }
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) { source = 'with(obj||{}){\n' + source + '}\n'; }

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) { delete obj[0]; }
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof undefined === 'function' && undefined.amd) {
    undefined('underscore', [], function() {
      return _;
    });
  }
}.call(commonjsGlobal));
});

var Expression = {
  display :
    function() {
      return this.exprType + " " + this.val;
    },
  type :
    function () {
      return this.exprType;
    },
  linenum : 0,
  charnum : 0
};

var TypeExpression = {
  unify :
    function (t) {
      if (this.expr === t.expr) {
        return t.expr;
      }
      else {
        console.log("Could not unify " + this.expr + " with " + t.expr);
      }
    },
  isTypeExpr : true,
  linenum : 0,
  charnum : 0
};

function flattenTypeDecl(stx) {
  if (isTypeExpr(stx)) {
    return true;
  }
  if (stx.exprType === "Application") {
    /* it might be a type application so recursively check it */
    if (stx.p !== undefined) {
      return  underscore.flatten([flattenTypeDecl(stx.p), flattenTypeDecl(stx.func)]);
    }
    else {
      return underscore.flatten([flattenTypeDecl(stx.func)]);
    }
  }
  if (stx.exprType === "Name") {
    /*
     * Either it is a type operator
     * or we assume it is a type variable
     * since it was not capitalized
     */
    return true;
  }
  return {
    failed : true,
    stx : stx
  };
}


function isTypeExprRec(stx) {
  var flattened = flattenTypeDecl(stx);
  for(var i = 0; i < flattened.length; i++) {
    if (flattened[i].failed !== undefined &&
        flattened[i].failed) {
          return flattened[i];
        }
  }
  return true;
}

function Closure(bound_vars, free_vars, body, env) {
  this.bound_vars = bound_vars;
  this.free_vars = free_vars;
  this.body = body;
  this.env = env;
  this.exprType = "Closure";
  return this;
}

function LetExp(pairs, body) {
  if (!pairs.every(function(x) {
    return (x.exprType === "Definition" ||
            x.exprType === "FunctionDefinition");
  })) {
    throw errors.JInternalError(
      "let can only be used to bind things to names or functions"
      );
  }
  this.exprType = "Let";
  this.val = [pairs, body];
  this.pairs = pairs;
  this.body = body;
  return this;
}
LetExp.prototype = Expression;

function UnaryOp(op, v) {
  this.exprType = "Unary";
  this.val = v;
  this.op = op;
  return this;
}
UnaryOp.prototype = Expression;

function IntT(v) {
  this.exprType = "Integer";
  this.val = parseInt(v, 10);
  return this;
}
IntT.prototype = Expression;

function FloatT(v) {
  this.exprType = "Float";
  this.val = parseFloat(v, 10);
  return this;
}

FloatT.prototype = Expression;

function StrT(v) {
  this.exprType = "String";
  this.val = v;
  return this;
}

StrT.prototype = Expression;

function BoolT(b) {
  if (b === "true") {
    this.val = true;
  }
  else {
    this.val = false;
  }
  this.exprType = "Bool";
  return this;
}

BoolT.prototype = Expression;

function ListT(xs) {
  this.xs = xs;
  this.val = xs;
  this.exprType = "List";
  return this;
}

ListT.prototype = Expression;

function Nil() {
  this.exprType = "Nil";
  return this;
}

Nil.prototype = Expression;


function FuncT(p, body) {
  this.p = p;
  this.body = body;
  this.val = [p, body];
  this.exprType = "Function";
  return this;
}

FuncT.prototype = Expression;

//Wrapper for function objects
function OpT(operator) {
  this.op = operator;
  this.val = this.op;
  this.exprType = "Function";
  return this;
}

OpT.prototype = Expression;

// Applications separate from other types
function App(func, p) {
  this.func = func;
  this.exprType = "Application";
  if (p)
    { this.p = p; }
  return this;
}

App.prototype = Expression;

// Names are not types
function Name(identifier) {
  this.ident = identifier;
  this.val = this.ident;
  this.exprType = "Name";
  return this;
}

Name.prototype = Expression;

function Def(ident, exp) {
  this.ident = ident;
  this.val = exp;
  this.exprType = "Definition";
  return this;
}

Def.prototype = Expression;

function DefFunc(ident, params, body) {
  this.ident = ident;
  this.val = this.ident;
  this.params = params;
  this.body = body;
  this.exprType = "FunctionDefinition";
  return this;
}

DefFunc.prototype = Expression;

function If(condition, thenexp, elseexp) {
  this.condition = condition;
  this.thenexp = thenexp;
  this.elseexp = elseexp;
  this.exprType = "If";
  return this;
}

If.prototype = Expression;

function TypeVar(name) {
  this.exprtype = "TypeVar";
  this.name = name;
  this.exprType = "TypeVar";
  return this;
}

TypeVar.prototype = TypeExpression;

function TypeOp(name) {
  this.name = name;
  this.val = name;
  this.exprType = "TypeOperator";
  return this;
}

TypeOp.prototype = TypeExpression;

function isTypeExpr(expr) {
  if (!expr.exprType) {
    throw errors.JInternalError(expr);
  }
  return ((expr.exprType === "TypeOperator") ||
          (expr.exprType === "TypeVar") ||
          (expr.exprType === "TypeDeclaration"));
}

function TypeDecl(expression, type) {
  if (isTypeExprRec(expression) &&
      expression.exprType !== "Name") {
    throw errors.JSyntaxError(
      expression.linenum,
      expression.charnum,
      "Left-hand-side of type declaration must not be in the type language"
      );
  }
  if (isTypeExprRec(type).failed) {
    throw errors.JInternalError(
      "Right-hand-side of type declaration must be a type expression"
      );
  }
  this.expression = expression;
  this.type = type;
  this.exprType = "TypeDeclaration";
  return this;
}

TypeDecl.prototype = TypeExpression;

function DefType(lhs, rhs) {
  /* Both rhs and lhs are expected
   * to be fully desugared already
   */
  if (isTypeExprRec(rhs).failed ||
      !isTypeExpr(lhs)) {
        throw errors.JSyntaxError(
          rhs.linenum,
          rhs.charnum,
          "Illegal type definition, both sides must be valid type expressions");
      }
  this.rhs = rhs;
  this.lhs = lhs;
  this.exprType = "TypeDefinition";
  return this;
}

DefType.prototype = Expression;

function checkName(exp) {
  if (exp.exprType !== "Name") {
    throw errors.JSyntaxError(
      exp.linenum,
      exp.charnum,
      "Expected a type variable (an identifier starting with a lowercase character), got " + exp.val);
  }
}

function DataType(name, params, type) {
  /* Params is a list of type variables
   * type is a type expression
   */
  if (name.exprType !== "TypeOperator") {
    throw errors.JSyntaxError(
      name.linenum,
      name.charnum,
      "First element in a data type definition must be its name " +
      "which is a type operator");
  }
  underscore.each(params, checkName);
  if (isTypeExprRec(type).failed) {
    throw errors.JSyntaxError(
      type.linenum,
      type.charnum,
      "Body of a type definition must be a valid type expression");
  }
  this.name = name;
  this.params = params;
  this.type = type;
  this.exprType = "TypeFuncDefinition";
  return this;
}


/* Applies the function ``name'' to the list of parameters */
function makeApp(name, parameters) {
  if (parameters) {
    return parameters.slice(1).reduce(function(f, ident) {
      return new App(f, ident);
    }, new App(name, parameters[0]));
  }
  else {
    return new App(name);
  }
}

function makeGensym() {
  var n = 0;
  return function() {
    var x = "G"+n;
    n = n + 1;
    return x;
  };
}

var gensym = makeGensym();

var OPInfo = {
          "::" : [2, "Left"],
          "," : [1, "Left"],
          "->" : [1, "Right"]
         };

var rep = {
     IntT   : IntT,
     FloatT : FloatT,
     StrT   : StrT,
     BoolT  : BoolT,
     ListT  : ListT,
     FuncT  : FuncT,
     App    : App,
     Name   : Name,
     Def    : Def,
     OpT   : OpT,
     OPInfo : OPInfo,
     makeApp : makeApp,
     If : If,
     DefFunc : DefFunc,
     UnaryOp : UnaryOp,
     Nil : Nil,
     LetExp : LetExp,
     gensym : gensym,
     TypeVar : TypeVar,
     TypeOp : TypeOp,
     TypeDecl : TypeDecl,
     Closure : Closure,
     isTypeExpr : isTypeExprRec,
     DefType : DefType,
     DataType : DataType
   };

function empty(xs) {
  return underscore.size(xs) < 1;
}

function not(x) {
  return !x;
}

function min(a, b) {
  if (a < b) {
    return 1;
  }
  else if (a > b) {
    return -1;
  }
  else {
    return 0;
  }
}

function groupOps(ops) {
  return underscore.groupBy(ops.sort(), underscore.isEqual);
}

function dict(pairs) {
  var o = {};
  pairs.map(function(p) {
    o[p[0]] = p[1];
  });
  return o;
}

function extend$2(xs, ys) {
  var result = underscore.clone(xs);
  result.push.apply(result, ys);
  return result;
}

RegExp.escape= function(s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function operatorMatch(ops) {
  ops = underscore.filter(ops,
                 function (op) {
                   return op.length > 0;
                 });
  ops.sort(min);
  var rstring = ops.reduce(
  function(acc, x) {
    if (!x || x.length < 1) {
      return "";
    }
    return acc + "(" + RegExp.escape(x) + ")|";
  }, "");
  var reg = new RegExp(rstring);
  return function(x) {
    var matched = reg.exec(x);
    if ((!(underscore.isNull(matched))) && matched[0]) {
      return matched[0];
    }
    else {
      return false;
    }
  };
}

function debugPrint(stx) {
  console.log("%j\n", stx);
}


var $$1 = {
  not  : not,
  groupOps : groupOps,
  opMatch : operatorMatch,
  dict: dict,
  extend : extend$2,
  empty : empty,
  debugPrint : debugPrint
};

var src = "\n;; This file declares the various types used by intrinsic/prelude definitions\n;; It is sort of special in that it doesn't care whether there are any associated definitions\n;; just that there are type definitions for that particular binding's name\n\n\n;; Type definitions\ndeftype String (Vector Char)\n\ndeftype (Int) Intrinsic\n\ndeftype (Float) Intrinsic\n\ndeftype (Char) Intrinsic\n\ndeftype (Byte) Intrinsic\n\ndeftype (Void) Intrinsic\n\ndeftype (IO a) Intrinsic\n\ndeftype (Vector a) Intrinsic\n\ndeftype (List a)\n  (Empty |\n   (Cons a (List a)))\n\ndeftype (Bottom)\n  Undefined\n\ndeftype (Maybe a)\n  (Nothing |\n   (Just a))\n\ndeftype (Either a b)\n  ((Left a) |\n   (Right b))\n\n;; List functions\n\n(: :: (a -> (List a) -> (List a)))\n\n(map :: ((a -> b) -> (List a) -> (List b)))\n\n(head :: ((List a) -> a))\n\n(tail :: ((List a) -> (List a)))\n\n(!! :: (Int -> (List a) -> a))\n\n(take :: (Int -> (List a) -> (Maybe (List a))))\n\n(drop :: (Int -> (List a) -> (Maybe (List a))))\n\n;; Optional functions\n\n(maybe :: (b -> (a -> b) -> (Maybe a) -> b))\n\n(either :: ((b -> c) -> (b -> c) -> (Either a b) -> c))\n\n;; I/O functions\n\n(print :: (String -> (IO Void)))\n\n;; Operator definitions\n\ndefop 1 Left (a + b)\n  (add a b)\n\ndefop 1 Left (a - b)\n  (minus a b)\n\ndefop 2 Left (a * b)\n  (mul a b)\n\ndefop 2 Left (a / b)\n  (div a b)\n\ndefop 2 Right (a ^ b)\n  (pow a b)\n\ndefop 3 Left (a ++ b)\n  (listConcat a b)\n\ndefop 3 Left (a == b)\n  (eq a b)\n\ndefop 3 Left (a > b)\n  (gt a b)\n\ndefop 3 Left (a >= b)\n  (gte a b)\n\ndefop 3 Left (a < b)\n  (lt a b)\n\ndefop 3 Left (a <= b)\n  (lte a b)\n\ndefop 3 Left (a && b)\n  (and a b)\n\ndefop 3 Left (a || b)\n  (or a b)\n\ndefop 4 Right (x : xs)\n  (cons x xs)\n\ndefop 5 Left (f $ x)\n  (fapply f x)\n\ndefop 5 Left (f . g)\n  (compose f g)\n\ndefop 3 Left (a | b)\n  (bitwiseOr a b)\n\ndefop 3 Left (a & b)\n  (bitwiseAnd a b)";

var prelude = {
  "src" : src
};

var operators = Object.keys(rep.OPInfo);

function isDigit(c) {
  if (!c)
    { return false; }
  var code = c.charCodeAt();
  if (isNaN(code)) {
    return false;
  }
  return (47 < code) && (code < 58)
}

function isWhitespace(c) {
  if (!c)
    { return true; }

  var code = c.charCodeAt();
  if (isNaN(code)) {
    return true;
  }
  return (code === 9 ||
          code === 32 ||
          code === 10 ||
          code === 13 ||
          code === 11);
}

function isIdentifier(c) {
  var code = c.charCodeAt();
  return (!isNaN(code) &&
          code !== 41 &&
          code !== 40 &&
          code !== 125 &&
          code !== 123 &&
          code !== 93 &&
          code !== 91 &&
          code !== 44 &&
          code !== 34 &&
          code > 32);
}

function isUpper(c) {
  var code = c.charCodeAt();
  return (!isNaN(code) &&
          (code >= 65) &&
          (code <= 90));
}

function tokenizeNum(tokstream, charnum, linenum) {
  var number = [];
  var code = tokstream[0].charCodeAt();
  var isFloat = false;
  var n = 0;
  // + -
  // might want to remove this since it probably won't ever get run?
  if (code === 43 || code === 45) { // + or -
    number.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    n++;
  }
  else if (code === 46) { // .
    tokstream = tokstream.substr(1);
    n++;
    charnum++;
    number.push('0');
    number.push('.');
    isFloat = true;
  }

  while (isDigit(tokstream[0]) && tokstream.length !== 0) {
    number.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    charnum++;
    n++;
  }
  if (tokstream[0] === '.' && isDigit(tokstream[1])) {
    number.push('.');
    number.push(tokstream[1]);
    tokstream = tokstream.substr(2);
    charnum++; charnum++;
    n++; n++;
    while (isDigit(tokstream[0]) && tokstream.length !== 0) {
      number.push(tokstream[0]);
      tokstream = tokstream.substr(1);
      n++;
      charnum++;
    }
    return [n, ["float", parseFloat(number.join(''), 10), charnum, linenum]];
  }
  if (!isFloat)
    { return [n, ["integer", parseInt(number.join(''), 10), charnum, linenum]]; }
  else
    { return [n, ["float", parseFloat(number.join(''), 10), charnum, linenum]]; }
}

/* Split up the tokenized identifier if an operator appears in it
 * prefer longer identifiers that start with the same character(s) as shorter ones
 * e.g. ++ over +
 * Everything after the operator goes back on to the token stream
 */

function tokenizeIdent(tokstream,
                       matchop,
                       charnum,
                       linenum) {
  var identifier = [];
  var n = 0;
  while ((!isWhitespace(tokstream[0])) && isIdentifier(tokstream[0]) && !matchop(tokstream)) {
    identifier.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    n++;
    charnum++;
  }
  identifier = identifier.join('');

  return [[n, ["identifier", identifier, charnum, linenum]]];
}

function tokenizeCtor(tokstream,
                      matchop,
                      charnum,
                      linenum) {
    var ident = tokenizeIdent(tokstream,
                              matchop,
                              charnum,
                              linenum);
    ident[0][1][0] = "constructor";
    return ident;
}

function tokenizeStr(tokstream, charnum, linenum) {
  var stringlit = [];
  var n = 1;
  var new_charnum = charnum;
  tokstream = tokstream.substr(1);
  while (tokstream[0].charCodeAt() !== 34) {
    stringlit.push(tokstream[0]);
    tokstream = tokstream.substr(1);
    n++;
    new_charnum++;
    if (tokstream.length < 1) {
      throw errors.JSyntaxError(linenum, charnum, "Error: missing quotation mark");
    }
  }
  n++;
  return [n, ["stringlit", stringlit.join(''), new_charnum, linenum]];

}

function tokenizeT(tokstream, charnum, linenum) {
  if (tokstream.length < 4)
    { return false; }
  var next4 = tokstream.substr(0,4);
  if (next4 === "then")
    { return ["thenexp", "then"]; }
  else if (next4 === "true")
    { return ["truelit", "true"]; }
  return false;
}

function peek(tokstream, toktype, word, charnum, linenum) {
  var n = word.length;
  if (tokstream.length < n)
    { return false; }
  var nextN = tokstream.substr(0, n);
  if (nextN == word) {
    return [toktype, word];
  }
  return false;
}


function tokenize(tokstream, matchop) {
  var tokens = [];
  var charnum = 1;
  var linenum = 1;
  var i, result, lambda, num, comment;

  while (tokstream) {
    switch (tokstream[0].charCodeAt()) {
      /* falls through */
      case 59: // ;
        while (tokstream[0].charCodeAt() !== 10) {
          tokstream = tokstream.substr(1);
        }
        break;
      case 9: // '\t'
        charnum++;
        tokens.push(["whitespace", '\t', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 32: // ' '
        charnum++;
        tokens.push(["whitespace", ' ', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 10: // '\n'
        linenum++;
        charnum = 1; /* Reset the character number for each line to 1 */
        tokens.push(["whitespace", '\n', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 44: // ','
        charnum++;
        tokens.push(["comma", ",", charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 40: // '('
        charnum++;
        tokens.push(["left_paren", '(', charnum, linenum]);
        tokstream = tokstream.substr(1);

        break;
      /* falls through */
      case 41: // ')'
        charnum++;
        tokens.push(["right_paren", ')', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 123: // '{'
        charnum++;
        tokens.push(["left_brace", '{', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 125: // '}'
        charnum++;
        tokens.push(["right_brace", '}', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 91: // '['
        charnum++;
        tokens.push(["left_square", '[', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 93: // ']'
        charnum++;
        tokens.push(["right_square", ']', charnum, linenum]);
        tokstream = tokstream.substr(1);
        break;
      /* falls through */
      case 34: // '"'
        result = tokenizeStr(tokstream, charnum, linenum);
        var str = result[1];
        i = result[0];
        tokens.push(str);
        tokstream = tokstream.substr(i);
        break;

      /* falls through */
      case 46: // '.'
        if (isDigit(tokstream[1])) {
          result = tokenizeNum(tokstream, charnum, linenum);
          num = result[1];
          i = result[0];
          if (!isNaN(num[1])) {
            tokens.push(num);
          }
          tokstream = tokstream.substr(i);
          break;
        }
      /* falls through */
      case 116: // 't'
        result = tokenizeT(tokstream);
        if (result) {
          tokens.push($$1.extend(result, [charnum, linenum]));
          tokstream = tokstream.substr(4); // 4 = length of either token
          break;
        }
      /* falls through */
      case 105: // 'i'
        var ifexp = peek(tokstream, "ifexp", "if");
        if (ifexp) {
          tokens.push($$1.extend(ifexp, [charnum, linenum]));
          tokstream = tokstream.substr(2);
          break;
        }
        var inkeyword = peek(tokstream, "in", "in ");
        if (inkeyword) {
          tokens.push($$1.extend(inkeyword, [charnum, linenum]));
          tokstream = tokstream.substr(3);
          break;
        }

      /* falls through */
      case 100: // 'd'
        var defop = peek(tokstream, "defop", "defop");
        if (defop) {
          tokens.push(["defop", "defop", charnum, linenum]);
          tokstream = tokstream.substr(5);
          break;
        }
        var deftype = peek(tokstream, "deftype", "deftype");
        if (deftype) {
          tokens.push(["deftype", "deftype", charnum, linenum]);
          tokstream = tokstream.substr(7);
          break;
        }
        var def = peek(tokstream, "def", "def");
        if (def) {
          tokens.push(["def", "def", charnum, linenum]);
          tokstream = tokstream.substr(3);
          break;
        }
      /* falls through */
      case 101: // e
        result = peek(tokstream, "elsexp", "else");
        if (result) {
          tokens.push($$1.extend(result, [charnum, linenum]));
          tokstream = tokstream.substr(4);
          break;
        }
      /* falls through */
      case 102: // f
        result = peek(tokstream, "falselit", "false");
        if (result) {
          tokens.push($$1.extend(result, [charnum, linenum]));
          tokstream = tokstream.substr(5);
          break;
        }
      /* falls through */
      case 108: // l
        lambda = peek(tokstream, "lambda", "lambda");
        if (lambda) {
          tokens.push($$1.extend(lambda, [charnum, linenum]));
          tokstream = tokstream.substr(6);
          break;
        }
        var letexp = peek(tokstream, "let", "let");
        if (letexp) {
          tokens.push($$1.extend(letexp, [charnum, linenum]));
          tokstream = tokstream.substr(3);
          break;
        }

      /* falls through */
      default:
        if (isDigit(tokstream[0])) {
          result = tokenizeNum(tokstream, charnum, linenum);
          num = result[1];
          i = result[0];
          if (!isNaN(num[1])) {
            tokens.push(num);
          }
          tokstream = tokstream.substr(i);
          break;
        }
        var op = matchop(tokstream);
        if (op) {
          var l = op.length;
          charnum = charnum + l;
          tokstream = tokstream.substr(l);
          tokens.push(["identifier", op, charnum, linenum]);
        }
        else {
          if (isUpper(tokstream[0])) {
            result = tokenizeCtor(tokstream, matchop, charnum, linenum);
          }
          else {
            result = tokenizeIdent(tokstream, matchop, charnum, linenum);
          }
          for(var index = 0; index < result.length; index++) {
            charnum++;
            tokens.push(result[index][1]);
            tokstream = tokstream.substr(result[index][0]);
          }
        }
     }
  }
  return tokens;
}

function tokenizeHelp(input, matchop, strip_whitespace) {
  return tokenize(input, matchop).reverse().filter(function(x) {
    if (strip_whitespace) {
      return x[0] !== "whitespace";
    }
    else {
      return true;
    }
  });
}

var defop_pattern = ["defop", "integer", "constructor",
                     "left_paren", "identifier",
                     "identifier", "identifier", "right_paren"];

function checkPattern(x, i) {
  return x === defop_pattern[i];
}

function tokenizeFull(input) {
  var preludeSrc = prelude.src;
  var matchop;
  input = [preludeSrc, input].join("");
  var initialPass = tokenizeHelp(input, underscore.constant(false), true).reverse();

  for (var i = 0; i < initialPass.length; i++) {
    if (initialPass.slice(i, i+8).
        map(underscore.first).
        every(checkPattern)) {
          rep.OPInfo[initialPass[i+5][1]] =
            [parseInt(initialPass[i+1][1], 10),
            initialPass[i+2][1]];
         }
  }
  operators = Object.keys(rep.OPInfo);
  matchop = $$1.opMatch(operators);
  return tokenizeHelp(input, matchop, true);
}

var tokenizer = {tokenize : tokenizeFull,
                  isIdentifier : isIdentifier};

/*
 * This module takes a parse tree in a surface format
 * and transforms it into the "core" language which is
 * much simpler and easier to type-check, optimize, and evaluate
 */

function isAtomicNumber(stx) {
  return stx.exprType == "Integer" || stx.exprType == "Float";
}

// Lists get desugared to nested function calls
// i.e. (cons (cons (cons ...)))
function desugarList(lst) {
  if (lst.xs.length <= 0) {
    return new rep.Nil();
  }
  else {
    var x = desugar(lst.xs[0]);
    var rest = lst.xs.slice(1);
    return new rep.App(new rep.App(new rep.Name(":"), x), desugarList(new rep.ListT(rest)));
  }
}

function curryFunc(ps, body) {
  var result;
  if (underscore.isEmpty(ps)) {
    return desugar(body);
  }
  else {
    result = new rep.FuncT(desugar(underscore.first(ps)),
                         curryFunc(underscore.rest(ps), body));
    result.charnum = ps.charnum;
    result.linenum = ps.linenum;
    return result;
  }
}


function desugarLet(stx) {
  var values = stx.pairs.map(desugar);
  return new rep.LetExp(values, desugar(stx.body));
}

function sugarTypeDecl(stx) {
  var type;
  var expression;
  type = stx.p;
  expression = desugar(stx.func.p);
  expression.linenum = stx.linenum;
  expression.charnum = stx.charnum;
  return new rep.TypeDecl(expression, type);
}

function desugarDefType(stx, typeEnv) {
  var result;
  var rhs = desugar(stx.rhs);
  var name = stx.lhs.name;
  typeEnv[name] = rhs;

  result = new rep.DefType(stx.lhs, desugar(stx.rhs));
  result.linenum = stx.linenum;
  result.charnum = stx.charnum;
  return result;
}

function desugar(stx, typeEnv) {
 var typeExpTest;

 switch (stx.exprType) {
    case "If":
      if (stx.elseexp) {
        return new rep.If(desugar(stx.condition, typeEnv), desugar(stx.thenexp, typeEnv), desugar(stx.elseexp, typeEnv));
      }
      return new rep.If(desugar(stx.condition, typeEnv), desugar(stx.thenexp, typeEnv));
    /* FIXME closures not yet working */
    //case "FunctionDefinition":
      //return desugarDefFunc(stx);
    case "Definition":
      return new rep.Def(stx.ident, desugar(stx.val, typeEnv));
    case "TypeDefinition":
      return desugarDefType(stx, typeEnv);
    case "Name":
      return stx;
    case "Application":
      if ((stx.func.func !== undefined ) &&
          (stx.func.func.ident === "::")) {
            /* It's a type declaration probably (will be verified later)
             * In this case we actually *add* syntax here to differentiate type declarations
             * from normal function application
             */
            typeExpTest = rep.isTypeExpr(stx.p);

            if (typeExpTest.failed !== undefined &&
                typeExpTest.failed) {
              throw errors.JInternalError(
                "Type declaration error near line " + stx.linenum + " at character #"+stx.charnum +
                "\n"+typeExpTest.stx.exprType+" (" + typeExpTest.stx.val + ") found where a type operator or type application was expected");
            }
            return sugarTypeDecl(stx);
          }

      if (false &&
          stx.p && isAtomicNumber(stx.p)) {
            return new rep.UnaryOp(desugar(stx.func, typeEnv), desugar(stx.p, typeEnv));
          }
      if (stx.p) {
        return new rep.App(desugar(stx.func, typeEnv), desugar(stx.p, typeEnv));
      }
      return new rep.App(stx.func);
    case "Function":
      return curryFunc(stx.p, stx.body);
    case "List":
      return desugarList(stx);
    case "Bool":
      return stx;
    case "String":
      return stx;
    case "Float":
      return stx;
    case "Integer":
      return stx;
    case "Let":
      return desugarLet(stx);
    default:
      return stx;
  }
}

var desugarer = { desugar : desugar };
//var test = typ.ListT([1,2,3]);

//console.log(desugarList(test));

/* Takes an AST and converts all of the functions into "closures"
 * A closure is a triple of:
 *  the bound variables in a function or let
 *  the free variables in a function or let
 *  a function body or let body and bound values (if it is an escaping closure only)
 * The closure has the property that all of the free variables of the function or let
 * are in the environment, or an exception is raised because the variable is not bound
 * in the current environment.
 * A free variable is simply those that are not in the list of formal parameters or bound variables if it is a let
 *
 * Therefore in order to call a closure one must first extract the actual function and then
 * call the function with the environment associated with it.
 * For the purposes of type checking it does not matter how the function gets called, the environment
 * is only used for looking up the types of names. Formal parameters are given type variables.
 *
 * The first phase of closure conversion is not really closure conversion exactly.
 * All it does is find out the free variables in scope and tie those up into a data structure with their types later.
 * The second phase will be done to the CPS language and closures will actually lambda-lifted out potentially.
 */

var notEmpty = underscore.compose($$1.not, underscore.partial(underscore.equal, []));

function fvs(stx) {
  switch (stx.exprType) {
    case "Integer":
      return [];
    case "Float":
      return [];
    case "String":
      return [];
    case "Function":
      return [];
    case "Nil":
      return [];
    case "Bool":
      return [];
    case "Let":
      return [];
    case "Unary":
      return underscore.flatten([stx.op.ident, fvs(stx.val)]);
    case "Definition":
      return underscore.flatten(fvs(stx.val));
    case "Application":
      var vs = underscore.flatten(fvs(stx.p));
      var f_fvs = underscore.flatten(fvs(stx.func));
      return underscore.flatten([vs, f_fvs]);
    case "If":
      if (stx.elseexp) {
        var cond_fvs = fvs(stx.condition);
        var then_fvs = fvs(stx.thenexp);
        var else_fvs = fvs(stx.elseexp);
        return underscore.flatten([cond_fvs, then_fvs, else_fvs]);
      }
      else {
        return underscore.flatten([fvs(stx.condition), fvs(stx.thenexp)]);
      }
      break;
    case "Name":
      return [stx.ident];
  }
}

function annotate_fvs(stx) {
  /* Takes a stx object that is either
   * a lambda
   * a let
   * and returns a closure wrapped around that stx object
   */
  if (stx.exprType !== "Function" &&
      stx.exprType !== "Let") {
    throw errors.JInternalError(
           ["Tried to calculate the free variables of",
           "something that was not a function or let.\n",
           "That something was a: " + stx.exprType +"\n"].reduce(
                function (a,b) {
                  return a+" "+b;
                }, ""));
  }
  var variables, free_variables, bound_vars, stx_type;

  switch (stx.exprType) {
    case "Let":
      bound_vars = stx.pairs.map(
         function (stx) {
           return stx.ident.ident;
         });
      var let_fvs = stx.pairs.map(fvs);
      var body_fvs = fvs(stx.body);
      variables = underscore.flatten(let_fvs);
      $$1.extend(variables, underscore.flatten(body_fvs));
      break;
    case "Function":
      bound_vars = [stx.p.ident ];
      variables = fvs(stx.body);
      break;
  }
  free_variables = underscore.difference(underscore.uniq(variables), bound_vars);
  return new rep.Closure(bound_vars, free_variables, stx, []);
}

/*
 * This traverse the tree and gathers up all of the free variables of various functions/let bindings
 */
function annotate_fvs_all(stx) {
  var closure;
  switch (stx.exprType) {
    case "Let":
      closure = annotate_fvs(stx);
      closure.body.pairs = closure.body.pairs.map(annotate_fvs_all);
      closure.body = annotate_fvs_all(closure.body.body);
      return closure;
    case "Function":
      closure = annotate_fvs(stx);
      closure.body.body = annotate_fvs_all(closure.body.body);
      return closure;
    case "Unary":
      stx.val = annotate_fvs_all(stx.val);
      return stx;
    case "Application":
      stx.func = annotate_fvs_all(stx.func);
      stx.p = annotate_fvs_all(stx.p);
      return stx;
    case "If":
      if (stx.elseexp) {
        stx.condition = annotate_fvs_all(stx.condition);
        stx.thenexp = annotate_fvs_all(stx.thenexp);
        stx.elseexp = annotate_fvs_all(stx.elseexp);
        return stx;
      }
      else {
        stx.condition = annotate_fvs_all(stx.condition);
        stx.thenexp = annotate_fvs_all(stx.thenexp);
        return stx;
      }
      break;
    case "Definition":
      stx.val = annotate_fvs_all(stx.val);
      return stx;
    default:
      return stx;
  }
}


//console.log(test("if something then if a then if b then c else d else rtrrt else some_other_thing"));
var closure = {
  annotate_fvs : annotate_fvs_all
};

function sourcePos(tokens, linenum, charnum) {
  if (!tokens || tokens.length === 0) {
    return { linenum : linenum,
             charnum : charnum
    };
  }
  return {
    linenum : fst(tokens)[3],
    charnum : fst(tokens)[2]
  };
}

function addSrcPos(stx, tokens, linenum, charnum) {
  var pos = sourcePos(tokens, linenum, charnum);
  stx.linenum = pos.linenum;
  stx.charnum = pos.charnum;
  return stx;
}

/* Gets the first token from the right side of the stack */
function fst(ts) {
  return ts[ts.length-1];
}

/* Gets the second token from the right side of the stack */
function snd(ts) {
  return ts[ts.length-2];
}

/*Checks if the next token is not followed by any of ``checks'' */
function notFollowedBy(tokens, checks, linenum, charnum) {
  if (!fst(tokens)) {
    throw errors.JSyntaxError(0,0,"unexpected end of source");
  }
  var nextT = fst(tokens)[0];
  if (checks.some(function (x) {
    return x === nextT;
  }))
    { return false; }
  else
    { return true; }
}

/* returns a function that takes a parameter and
   checks if it is in the array ``props''*/
function makeChecker(props) {
  return function(x) {
    return x && props.some(function (y) {return y(x);});
  };
}

function tokTypeCheck(name) {
  return function(tok) {
    return tok[0] === name;
  };
}

function formTypeCheck(stxtype) {
  return function(stx) {
    return stx.exprType === stxtype;
  };
}

/*Tries to parse until the prediction ``valid'' fails or the wrong type is parsed
  Collects the results into an array and returns it*/
function parseMany(parse, exprType, valid, tokens, charnum, linenum) {
  if (!fst(tokens)) {
    throw errors.JSyntaxError(charnum,
                             linenum,
                             "Unexpected end of source");
  }
  var current = fst(tokens)[0];
  var results = [];
  var parsed;

  if (valid(fst(tokens))) {
    parsed = parse(tokens);
  }
  else {
    throw errors.JSyntaxError(fst(tokens)[3],
                             fst(tokens)[2],
                             "Unexpected token: ``"+fst(tokens)[0]+"''");
  }
  results.push(parsed);

  //make sure there are at least 2 tokens to parse
  if (tokens.length > 1 && fst(tokens) && valid(fst(tokens))) {
    while (valid(snd(tokens))) {
      if (!(valid(fst(tokens)))) {
        break;
      }
      results.push(parse(tokens));
      if (!exprType(fst(results).exprType)) {
        break;
      }
      if (fst(tokens)) {
        current = fst(tokens)[0];
      }
      else {
        throw errors.JSyntaxError(linenum,
                                 charnum,
                                 "Unexpected end of source");
      }
      if (tokens.length <= 1) {
        break;
      }
    }
  }
  //do the same validity check as before and in the loop
  if (!fst(tokens)) {
    throw errors.JSyntaxError(fst(tokens)[3],
                             fst(tokens)[2],
                             "unexpected end of source");
  }
  if (valid(fst(tokens))) {
    results.push(parse(tokens));
  }
  return results;
}


/* Tries to parse exprType separated by the token between
 * e.g. <identifier>,<identifier>,...
 */
function parseBetween(exprType, between, tokens, charnum, linenum) {
  var first = parse(tokens);
  var items;
  var parsed;

  if (!exprType(first)) {
    throw errors.JSyntaxError(fst(tokens)[2], fst(tokens)[3], "Unexpected token: ``"+fst(tokens)[0]+"''");
  }

  items = [first];

  if (tokens.length > 1 && fst(tokens)[0] === between) {
    while (fst(tokens)[0] === between) {
      tokens.pop();
      parsed = parse(tokens);
      if (!fst(tokens))
        { throw errors.JSyntaxError(fst(tokens)[3],
                                 fst(tokens)[2],
                                 "Missing terminator: "+between); }
      items.push(parsed);
    }
    return items;
  }
  return items;
}

function parseList(tokens, linenum, charnum) {
  var xs;
  var result;

  if (fst(tokens)[0] === "right_square") {
      xs = [];
  }
  else if (fst(tokens)[0] === "comma") {
    tokens.pop();
    xs = [];
  }
  else {
    xs = parseBetween(function (x) {
      return true;
    }, "comma", tokens, fst(tokens)[3], fst(tokens)[2]);
  }
  if (!fst(tokens) || fst(tokens)[0] !== "right_square") {
    throw errors.JSyntaxError(fst(tokens)[3],
                             fst(tokens)[2],
                             "list must be terminated by ]");
  }
  tokens.pop();
  result = addSrcPos(new rep.ListT(xs), tokens, linenum, charnum);
  return result;
}


function parseDefFunction(tokens, linenum, charnum) {
  var fname = parse(tokens);
  var parameters;
  var result;
  var body;

  if (fname.exprType !== "Name") {
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "Expected an identifier in function definition");
  }
  if (fst(tokens)[0] === "right_paren") {
    parameters = [];
  }
  else {
    parameters = parseMany(parse,
                           validName,
                           validFormPar,
                           tokens,
                           charnum,
                           linenum);
  }
  if (!tokens || (fst(tokens)[0]) !== "right_paren") {
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "Formal parameters must be followed by )");
  }
  tokens.pop();
  body = parse(tokens);
  result = addSrcPos(new rep.DefFunc(fname, parameters, body), tokens, body.linenum, body.charnum);
  return result;
}

var validLet = makeChecker(["Definition", "FunctionDefinition"].map(formTypeCheck));
var letEnd = underscore.compose($$1.not, makeChecker(["right_brace"].map(tokTypeCheck)));

function parseLetForm(tokens, linenum, charnum) {
  var result;
  var pairs;
  var body;

  if (!fst(tokens)) {
    errors.JSyntaxError(linenum,
                       charnum,
                       "Unexpected end of source");
  }
  pairs = parseMany(parseLetItem,
                        validLet,
                        letEnd,
                        tokens,
                        charnum,
                        linenum);
  if (fst(tokens) && fst(tokens)[0] !== "right_brace") {
    throw errors.JSyntaxError(fst(tokens)[2],
                             fst(tokens)[3],
                             "let/def form must have a closing }");
  }
  if (!fst(tokens)) {
    throw errors.JSyntaxError(underscore.last(pairs).linenum,
                             underscore.last(pairs).charnum,
                             "Unexpected end of source");
  }
  tokens.pop();
  if (tokens.length <= 0) {
    throw errors.JSyntaxError(underscore.last(pairs).linenum,
                             underscore.last(pairs).charnum,
                             "let/def form must have a body");
  }
  body = parse(tokens);
  if (body.exprType === "Definition" ||
      body.exprType === "FunctionDefinition") {
        throw errors.JSyntaxError(body.linenum,
                                 body.charnum,
                                 "Body of a let/def expression cannot be a definition");
      }
  result = addSrcPos(new rep.LetExp(pairs, body), tokens, body.linenum, body.charnum);
  return result;

}

function parseLetFunction(tokens, linenum, charnum) {
  var fname = parse(tokens);
  var parameters;
  var result;
  var body;

  if (fname.exprType != "Name") {
    throw errors.JSyntaxError(fst(tokens)[3],
                             fst(tokens)[2],
                             "Expected an identifier in function definition");
  }
  if (fst(tokens)[0] === "right_paren") {
    parameters = [];
  }
  else {
    parameters = parseMany(parse,
                           validName,
                           validFormPar,
                           tokens,
                           charnum,
                           linenum);
  }
  if ((fst(tokens)[0]) !== "right_paren") {
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "Formal parameters must be followed by )");
  }
  tokens.pop();
  if (fst(tokens)[1] !== "->") {
    throw errors.JSyntaxError(fst(tokens)[3],
                             fst(tokens)[2],
                             "Function parameters in let/def form must be followed by ->");
  }
  tokens.pop();
  body = parse(tokens);
  result = addSrcPos(new rep.DefFunc(fname, parameters, body), tokens, body.linenum, body.charnum);
  return result;
}

function parseLetBinding(tokens, linenum, charnum) {
  var name = parse(tokens);
  var result;
  var bound;

  if (name.exprType != "Name") {
    throw errors.JSyntaxError(name.linenum,
                             name.charnum,
                             "Expected an identifier in let/def binding");
  }
  if (!fst(tokens) || fst(tokens)[1] !== "=") {
    throw errors.JSyntaxError(name.linenum,
                             name.charnum,
                             "An identifier in a let/def binding must be followed by ``=''");
  }
  tokens.pop();
  if (!notFollowedBy(tokens,
                       ["comma", "arrow", "right_brace", "right_square"],
                       name.linenum,
                       name.charnum)) {
      throw errors.JSyntaxError(name.linenum,
                               name.charnum,
                               "The binding of " + identifier.val + " must not be followed by " + fst(tokens)[0]);
                       }
  bound = parse(tokens);
  if (bound.exprType === "Definition" ||
      bound.exprType === "FunctionDefinition") {
        throw errors.JSyntaxError(bound.linenum,
                                 bound.charnum,
                                 "A definition cannot be the value of a binding");
      }
  result = addSrcPos(new rep.Def(name, bound), tokens, bound.linenum, bound.charnum);
  return result;
}

function parseLetItem(tokens) {
  var linenum = fst(tokens)[3];
  var charnum = fst(tokens)[2];

  if (fst(tokens) && fst(tokens)[0] === "left_paren") {
    tokens.pop();
    return parseLetFunction(tokens,
                            linenum,
                            charnum);
  }
  else {
    return parseLetBinding(tokens,
                           linenum,
                           charnum);
  }
}

function parseDataType(tokens, linenum, charnum) {
  var typeName = parse(tokens, linenum, charnum);
  var typeParams;
  var typeBody;
  var result;

  if (typeName.exprType !== "TypeOperator") {
    throw errors.JSyntaxError(typeName.linenum,
                             typeName.charnum,
                             "Expected a type operator in data type definition");
  }
  if (fst(tokens)[0] !== "right_paren") {
    var parameters = parseMany(parse,
                         validName,
                         validFormPar,
                         tokens,
                         charnum,
                         linenum);
  }
  else {
    var parameters = [];
  }
  if (!tokens || (fst(tokens)[0]) !== "right_paren") {
    throw errors.JSyntaxError(underscore.last(parameters).linenum,
                             underscore.last(parameters).charnum,
                             "Data type parameters must be followed by )");
  }
  tokens.pop();
  typeBody = parse(tokens);
  result = addSrcPos(new rep.DataType(typeName, parameters, typeBody), tokens, typeBody.linenum, typeBody.charnum);

  return result;
}



function parseDefType(tokens, linenum, charnum) {
  var result;
  var rhs;
  var lhs;

  if (tokens.length < 2) {
    /* Minimal number of tokens required is 2
     * because it could be 'deftype Foo Blah'
     */
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "Unexpected end of source");
  }
  if (fst(tokens)[0] === "left_paren") {
    /* It's an actual data type definition
     * i.e. not just an alias
     */
    tokens.pop();
    return parseDataType(tokens, linenum, charnum);
  }

  if (notFollowedBy(tokens, ["constructor"], linenum, charnum)) {
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "deftype must be followed by a single constructor" +
                             " if it is not a data type definition with type variables");
  }
  else {
    lhs = parse(tokens, linenum, charnum);
    if (!tokens) {
      throw errors.JSyntaxError(lhs.linenum,
                               lhs.charnum,
                               "Unexpected end of source");
    }
    if (lhs.exprType !== "TypeOperator") {
      throw errors.JSyntaxError(lhs.linenum,
                               lhs.charnum,
                               "left-hand side of type alias was not a type operator");
    }
    rhs = parse(tokens, linenum, charnum);

    if (rhs.exprType !== "Application" &&
        rhs.exprType !== "TypeOperator") {
      throw errors.JSyntaxError(rhs.linenum,
                               rhs.charnum,
                               "was expecting an application or type operator on the right-hand side of a type alias");
    }
    result = addSrcPos(new rep.DefType(lhs, rhs), tokens, rhs.linenum, rhs.charnum);
    return result;
  }
}





function parseDef(tokens, linenum, charnum) {
  var result;
  var identifier;
  var bound;

  if (tokens.length < 2) {
    /* Minimal number of tokens required is 2
     * because it could be 'def foo blah'
     */
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "Unexpected end of source");
  }
  if (fst(tokens)[0] === "left_paren") {
    /* It's a function definition */
    tokens.pop();
    return parseDefFunction(tokens, linenum, charnum);
  }

  if (fst(tokens)[0] === "left_brace") {
    /* It's a let/def form */
    tokens.pop();
    return parseLetForm(tokens,
                        fst(tokens)[3],
                        fst(tokens)[2]);
  }

  if (notFollowedBy(tokens, ["identifier"], linenum, charnum)) {
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "def must be followed by identifier, not "+fst(tokens)[0]);
  }
  else {
    identifier = parse(tokens);
    if (!fst(tokens))
      { throw errors.JSyntaxError(identifier.linenum,
                               identifier.charnum,
                               "Unexpected end of source"); }
    if (!notFollowedBy(tokens,
                       ["comma", "arrow", "right_brace", "right_square"],
                       identifier.linenum,
                       identifier.charnum)) {
      throw errors.JSyntaxError(identifier.linenum,
                               identifier.charnum,
                               "def " + identifier.val + " must not be followed by " + fst(tokens)[0]);
    }
    bound = parse(tokens);
    if (bound.exprType === "Definition" ||
      bound.exprType === "FunctionDefinition") {
        throw errors.JSyntaxError(bound.linenum,
                                 bound.charnum,
                                 "A definition cannot be the value of a binding");
      }
    result = addSrcPos(new rep.Def(identifier, bound), tokens, bound.linenum, bound.charnum);
    return result;
  }
 }

function parseDefOp(tokens, linenum, charnum) {
  var result;
  var names;
  var pattern;

  if (fst(tokens)[0] !== "integer" ||
      fst(tokens)[1] < 1) {
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "defop must be followed by integer precedence >= 1");
      }
  tokens.pop();

  if (fst(tokens)[1] !== "Left" && fst(tokens)[1] !== "Right") {
         throw errors.JSyntaxError(linenum,
                                  charnum,
                                  "defop must be followed by precedence and then either Left or Right");
       }
  tokens.pop();
  if (fst(tokens)[0] !== "left_paren") {
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "defop arguments must start with (");
  }
  tokens.pop();
  if (!(tokens.slice(tokens.length-3,
                    tokens.length).every(function(x) {
                      return x[0] === "identifier";
                    }))) {
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "defop must be surrounded by exactly 3 identifiers");
    }
  pattern = tokens.slice(tokens.length-3,
                             tokens.length);
  tokens.pop(); tokens.pop(); tokens.pop();
  if (fst(tokens)[0] !== "right_paren") {
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "defop pattern must be terminated with )");
  }
  tokens.pop();
  names = [new rep.Name(pattern[1][1]),
           new rep.Name(pattern[0][1]),
           new rep.Name(pattern[2][1])];
  names.map(function(name) {
    name.linenum = linenum;
    name.charnum = charnum;
    return name;
  });

  result = addSrcPos(new rep.DefFunc(names[0],
                                    names.slice(1,3),
                                    parse(tokens)),
                     tokens,
                     underscore.last(names).linenum,
                     underscore.last(names).charnum);
  return result;
}



function parseIf(tokens, linenum, charnum) {
  var result;
  var ifC;
  var thenC;
  var elseC;

  if (!notFollowedBy(tokens,
                     ["def","comma","lambda"],
                     linenum,
                     charnum)) {
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "``if'' cannot be followed by "+fst(tokens)[0]) ;
  }
  else {
    ifC = parse(tokens);
    if (!fst(tokens) || fst(tokens)[0] !== "thenexp") {
      throw errors.JSyntaxError(ifC.linenum,
                               ifC.charnum,
                               "if ``exp'' must be folowed by ``then'' exp, not "+snd(tokens)[0]);
    }
    else {
      tokens.pop();
      thenC = parse(tokens);

      if (fst(tokens) && fst(tokens)[0] === "elsexp") {
        tokens.pop();
        if (underscore.size(tokens) < 1) {
          throw errors.JSyntaxError(thenC.linenum,
                                   thenC.charnum,
                                   "Unexpected end of source");
        }
      else {
        elseC = parse(tokens);
        result = addSrcPos(new rep.If(ifC, thenC, elseC), tokens, elseC.linenum, elseC.charnum);
        return result;
        }
      }
      else {
        throw errors.JSyntaxError(thenC.linenum,
                                 thenC.charnum,
                                 "If expression must include an else variant");
      }
    }
  }
}

var validName = makeChecker(["Name"].map(formTypeCheck));

function validFormPar(tok) {
  return tok[0] === "identifier" &&
         tok[1] !== "->";
}

function parseLambda(tokens, linenum, charnum) {
  var result;
  var parameters = parseMany(parse,
                             validName,
                             validFormPar,
                             tokens,
                             charnum,
                             linenum);
  if (fst(tokens)[1] !== "->") {
    throw errors.JSyntaxError(underscore.last(parameters).linenum,
                             underscore.last(parameters).charnum,
                             "arrow must follow parameters in lambda, not "+fst(tokens)[0]);
  }
  tokens.pop();
  var body = parse(tokens);
  result = addSrcPos(new rep.FuncT(parameters, body), tokens, body.linenum, body.charnum);
  return result;
}

var invalidArguments = ["def", "comma", "right_paren", "right_square", "right_brace", "left_brace", "right_brace"].map(tokTypeCheck);
var validArgument = underscore.compose($$1.not, makeChecker(invalidArguments));
var validArgTypes = underscore.compose($$1.not, makeChecker(["Definition"].map(formTypeCheck)));

/* Parses function application (either infix or prefix) */
function computeApp(tokens, charnum, linenum) {
  var lhs = parse(tokens);
  var next;
  var result;
  var parameters;

  if (fst(tokens)) {
    next = fst(tokens);
  }
  else {
    throw errors.JSyntaxError(lhs.linenum,
                             lhs.charnum,
                             "Unexpected end of source");
  }

  if (rep.OPInfo[next[1]]) {
    /* it's an infix expression */
    result = parseInfix(tokens, 1, lhs, lhs.linenum, lhs.charnum);
    if (!fst(tokens) || fst(tokens)[0] !== "right_paren") {
      throw errors.JSyntaxError(lhs.linenum,
                               lhs.charnum,
                               "Mismatched parentheses or missing parenthesis on right-hand side");
    }
    else {
      tokens.pop();
      return result;
    }
  }
  else {
    /* it's a prefix application */
    if (fst(tokens)[0] !== "right_paren") {
      parameters = parseMany(parse,
                             validArgTypes,
                             validArgument,
                             tokens,
                             fst(tokens)[2],
                             fst(tokens)[3]);
    }
    else {
      parameters = [];
    }
    if ((!fst(tokens)) || fst(tokens)[0] !== "right_paren") {
      throw errors.JSyntaxError(fst(tokens)[3],
                               fst(tokens)[2],
                               "Mismatched parentheses or missing parenthesis on right-hand side");
    }
    else {
      tokens.pop();
      return addSrcPos(rep.makeApp(lhs, parameters), tokens, linenum, charnum);
    }
  }
}

/*Parses infix expressions by precedence climbing
 * console.log(stx);
  See this for more info and an implementation in python
  http://eli.thegreenplace.net/2012/08/02/parsing-expressions-by-precedence-climbing/
*/
function parseInfix(tokens, minPrec, lhs, linenum, charnum) {
  if (!lhs) {
    lhs = parse(tokens);
  }
  while (true) {
    var cur = fst(tokens);
    if (!cur) {
      throw errors.JSyntaxError(linenum,
                               charnum,
                               "Unexpected end of source");
    }
    var opinfo = rep.OPInfo[cur[1]];

    if (!opinfo || opinfo[0] < minPrec)
      { break; }

    var op = addSrcPos(new rep.Name(cur[1]), tokens, linenum, charnum);
    var prec = opinfo[0];
    var assoc = opinfo[1];
    var nextMinPrec = assoc === "Left" ? prec + 1 : prec;
    tokens.pop();
    /*remove the operator token*/
    var rhs = parseInfix(tokens, nextMinPrec);
    lhs = addSrcPos(rep.makeApp(op, [lhs, rhs]), tokens, rhs.linenum, rhs.charnum);
  }
  return lhs;
}

function parse(tokens) {
  var charnum = fst(tokens)[2];
  var linenum = fst(tokens)[3];
  var toktype;
  var result;
  if (fst(tokens)) {
    toktype = fst(tokens)[0];
  }
  else {
    console.error("Tokenization error");
  }
  var token = fst(tokens)[1];
  tokens.pop();
  if (toktype === "stringlit") {
    result = addSrcPos(new rep.StrT(token), tokens, linenum, charnum);
    return result;
  }
  else if (toktype === "left_square") {
    return parseList(tokens, linenum, charnum);
  }
  else if (toktype === "lambda") {
    return parseLambda(tokens, linenum, charnum);
  }
  else if (toktype === "integer") {
    result = addSrcPos(new rep.IntT(token), tokens, linenum, charnum);
    return result;
  }
  else if (toktype === "float") {
    result = addSrcPos(new rep.FloatT(token), tokens, linenum, charnum);
    return result;
  }
  else if (toktype === "identifier") {
    result = addSrcPos(new rep.Name(token), tokens, linenum, charnum);
    return result;
  }
  else if (toktype === "constructor") {
    result = addSrcPos(new rep.TypeOp(token), tokens, linenum, charnum);
    return result;
  }
  else if (toktype === "truelit" || toktype === "falselit") {
    result = addSrcPos(new rep.BoolT(token), tokens, linenum, charnum);
    return result;
  }
  else if (toktype === "def" ||
           toktype === "let") {
    return parseDef(tokens, linenum, charnum);
  }
  else if (toktype === "deftype") {
    return parseDefType(tokens, linenum, charnum);
  }
  else if (toktype === "defop") {
    return parseDefOp(tokens, linenum, charnum);
  }
  else if (toktype === "ifexp") {
    return parseIf(tokens, linenum, charnum);
  }
  else if (toktype === "left_paren") {
    if (tokens.length == 0) {
      throw errors.JSyntaxError(linenum,
                               charnum,
                               "Unexpected end of source");
    }
    if (fst(tokens)[0] === "lambda") {
      tokens.pop();
      var parsed = parseLambda(tokens, linenum, charnum);
      tokens.pop();
      return parsed;
    }
    else
      { return computeApp(tokens, linenum, charnum); }
  }
  else {
    throw errors.JSyntaxError(linenum,
                             charnum,
                             "Unexpected token: ``" + toktype+"''");
  }
}


function parseFull(tokenized) {
  var ast = [];
  var typeBindings = {};
  var current;
  while (tokenized.length > 0) {
    current = closure.annotate_fvs(desugarer.desugar(parse(tokenized), typeBindings));
    ast.push(current);
  }
  return {
    "ast" : ast,
    "types" : typeBindings
  };
}

var parser = { parse : function(str) {
                              return parseFull(tokenizer.tokenize(str));
                            },
                  tokenize : tokenizer.tokenize,
                  parseFull : parseFull,
                 };
//var testParse = parseFull(tokenizer.tokenize(istr));
//console.log(testParse[1]);
//console.log(testParse[0].map(pprint.pprint));

/*
 * An environment is just an object that maps identifiers to JLambda expressions
 * with a few built-in (a standard Prelude environment)
 */

// creates a new environment initialized with the pairs in values
function makeEnv(name, values) {
  var env = {};
  env.name = name;
  env.bindings = {};
  for (var i = 0; i < values.length; i++) {
    name = values[i][0];
    var val = values[i][1];
    env.bindings[name] = val;
  }
  return env;
}

function lookup$1(name, env) {
  var value = env.bindings[name];
  if (!value) {
    throw errors.JUnboundError(name, env.name);
  }
  return value;
}

var env = {
  lookup : lookup$1,
  makeEnv : makeEnv
};

function cons(x) {
  return function(xs) {
    if (xs.exprType == "Nil") {
      return [x];
    }
    xs.unshift(x);
    return xs;
  };
}

function car(xs) {
  return xs[0];
}

function cdr(xs) {
  return xs.slice(1);
}

var testenv = env.makeEnv("toplevel",
                      [
                       ["car", car],
                       ["cdr", cdr],
                       ["len", function(xs) { return xs.length; }],
                       ["+", function(a) { return function(b) { return a + b; } }],
                       ["*", function(a) { return function(b) { return a * b; } }],
                       ["-", function(a) { return function(b) { return a - b; } }],
                       ["/", function(a) { return function(b) { return a / b; } }],
                       [":", cons],
                       ["a", 2],
                       ["b", 3]]);

function lookup(ident, env$$1) {
  var value = env$$1.bindings[ident];
  if (value.exprType !== undefined) {
    var result = evaluate(value, env$$1);
    return result;
  }
  return value;
}

function evaluateString(input) {
  var ast = parser.parseFull(tokenizer.tokenize(input));
  return evaluateAll(ast.ast, testenv);
}

function apply(func, p) {
  return func(p);
}

function evaluateAll(ast, environment) {
  var l = ast.length;
  var evaled = [];
  for (var i = 0; i < l; i++) {
    // should look for closures?
    evaled.push(evaluate(ast[i], environment));
  }
  return evaled[evaled.length-1];
}

function extend$1(def, env$$1) {
  env$$1.bindings[def.ident.val] = evaluate(def.val, env$$1);
  return;
}

function evaluate(ast, environment) {
  if (ast.exprType == "Application") {
    var func = evaluate(ast.func, environment);
    return apply(
              func,
              evaluate(ast.p, environment));
  }
  else if (ast.exprType === "Unary") {
    /* Unary function application */
    var func = evaluate(ast.op, environment);
    return apply(
              func,
              evaluate(ast.val, environment));
  }
  else if (ast.exprType === "Name") {
    return lookup(ast.ident, environment);
  }
  else if (ast.exprType === "If") {
    if (evaluate(ast.condition, environment)) {
      return evaluate(ast.thenexp, environment);
    }
    else {
      return evaluate(ast.elseexp, environment);
    }
  }
  else if (ast.exprType === "Definition") {
    extend$1(ast, environment);
    return;
  }
  else if (ast.exprType === "Integer" ||
           ast.exprType === "Float"   ||
           ast.exprType === "String") {
    /* Return an atom */
    return ast.val;
  }
  else if (ast.exprType === "Closure") {
    /* return evaluateClosure(ast); */
    return "Closure";
  }
  else {
    return ast;
  }
}

var vm = {
  evaluateString : evaluateString
};

riot$1.tag2('test', '<p each="{v, i in outputs}"> <span> {v} </span> </p> <form ref="inputform" onsubmit="{evaluate}"> <input riot-value="{default}" class="evaluator" ref="input" type="text"> </input> </form>', '', '', function(opts) {

var self = this;
self.outputs = [];
self.default = "";

this.evaluate = function(ev) {
  ev.preventDefault();
  var input = self.refs.input;
  if (!input.value) {
    return;
  }
  else {
    try {
      self.outputs.push(JSON.stringify(vm.evaluateString(input.value)));
    }
    catch (e) {
      self.outputs.push(("Error: " + (e.errormessage)));
    }
  }
  self.refs.input.value = self.default;
  self.update();
}.bind(this);

});

riot$1.mount("test");

}());
