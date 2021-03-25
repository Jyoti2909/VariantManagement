/*jslint plusplus: true, evil: true */
/*global dojo, define*/
define([
	'dojo/_base/array', // array.forEach array.indexOf array.some
	'dojo/string' // string.substitute
], function (array, string) {
	'use strict';

	//++++++ Base classes (Abstractions)

	var Filter = function () {};

	Filter.prototype.apply = function (context) {
		// summary:
		//Function to handle setting the contents
		// context: Object
		// context has two properties: context.content(String) - text that have to filter; context.isModified(Boolean) - flag that indicate the content was modified
		var i = 0,
			filter;
		for (i = 0; i < this._filters.length; i++) {
			filter = this._filters[i];
			if (filter.regexp.test(context.content)) {
				context.content = context.content.replace(
					filter.regexp,
					filter.handler
				);
				context.isModified = true;
			}
		}
	};

	var FilterManager = function () {};

	Filter.prototype._filters = [];

	FilterManager.prototype.addFilter = function (name, filter) {
		if (!this.filters[name] && filter instanceof Filter) {
			this.filters[name] = filter;
			return true;
		}
		return false;
	};

	FilterManager.prototype.removeFilter = function (name) {
		delete this.filters[name];
	};

	FilterManager.prototype.filters = {};

	FilterManager.prototype.filter = function (content, filterNames) {
		//summary:
		//Function to apply filters
		var filters = {},
			context = {
				content: content,
				isModified: false
			};
		if (filterNames) {
			array.forEach(
				filterNames,
				function (name) {
					if (this.filters.hasOwnProperty(name)) {
						filters[name] = this.filters[name];
					}
				},
				this
			);
		} else {
			filters = this.filters;
		}
		for (var name in filters) {
			filters[name].apply(context);
		}
		return context;
	};

	//----- Base classes

	// ++++++ Specific implementation

	var StriptTagsFilter = function () {
		// summary:
		//Class to perform some filtering of specific elements on the HTML.
		var _getTagsRegExp = function () {
			// summary:
			//Private function to perform RegExp for filtering of specific elements on the HTML.
			var tags = [
					'applet',
					'audio',
					'button',
					'canvas',
					'command',
					'datalist',
					'embed',
					'fieldset',
					'form',
					'frame',
					'frameset',
					'iframe',
					'input',
					'object',
					'optgroup',
					'option',
					'param',
					'script',
					'select',
					'source',
					'textarea',
					'track',
					'video'
				],
				pattern = '';
			array.forEach(tags, function (tag) {
				pattern = string.substitute('${0}|${1}', [
					pattern,
					string.substitute(
						'((<\\s*${0}[^/>]*>((.|\\s)*?)<\\\\?/\\s*${0}\\s*>)|(<\\s*${0}\\b([^<>]|\\s)*>?))',
						[tag]
					)
				]);
			});
			return new RegExp(pattern.slice(1), 'ig');
		};
		this._filters = [
			// Scripts (if any)
			{
				regexp: /(<\s*script[^>]*>((.|\s)*?)<\\?\/\s*script\s*>)|(<\s*script\b([^<>]|\s)*>?)|(<[^>]*=(\s|)*[("|')]javascript:[^$1][(\s|.)]*[$1][^>]*>)/gi,
				handler: ''
			},
			// Comments (if any)
			{ regexp: /(<!--(.|\s){1,}?-->)/gi, handler: '' },
			//Specific tags
			{ regexp: _getTagsRegExp(), handler: '' }
		];
	};

	StriptTagsFilter.prototype = new Filter();

	StriptTagsFilter.prototype.constructor = StriptTagsFilter;

	var PasteFromWordFilter = function () {
		// summary:
		//Class to perform some filtering of specific MS Word content.
		this._filters = [
			// Meta tags, link tags, and prefixed tags
			{
				regexp: /(<meta\s*[^>]*\s*>)|(<\s*link\s* href="file:[^>]*\s*>)|(<\/?\s*\w+:[^>]*\s*>)/gi,
				handler: ''
			},
			// Style tags
			{
				regexp: /(?:<style([^>]*)>([\s\S]*?)<\/style>|<link\s+(?=[^>]*rel=['"]?stylesheet)([^>]*?href=(['"])([^>]*?)\4[^>\/]*)\/?>)/gi,
				handler: ''
			},
			// MS class tags and comment tags.
			{ regexp: /(class="Mso[^"]*")|(<!--(.|\s){1,}?-->)/gi, handler: '' },
			// blank p tags
			{
				regexp: /(<p[^>]*>\s*(\&nbsp;|\u00A0)*\s*<\/p[^>]*>)|(<p[^>]*>\s*<font[^>]*>\s*(\&nbsp;|\u00A0)*\s*<\/\s*font\s*>\s<\/p[^>]*>)/gi,
				handler: ''
			},
			// Strip out styles containing mso defs and margins, as likely added in IE and are not good to have as it mangles presentation.
			{
				regexp: /(style="[^"]*mso-[^;][^"]*")|(style="margin:\s*[^;"]*;")/gi,
				handler: ''
			},
			// Escape event handlers from html source
			{ regexp: /([<"']\w*\s*)on\w*\s*=/gi, handler: '$1notvalid=' }
		];
	};

	PasteFromWordFilter.prototype = new Filter();

	PasteFromWordFilter.prototype.constructor = PasteFromWordFilter;

	var HtmlFilterManager = function () {
		this.filters = {
			strip_tags: new StriptTagsFilter(),
			paste_word: new PasteFromWordFilter()
		};
	};

	HtmlFilterManager.prototype = new FilterManager();

	HtmlFilterManager.prototype.constructor = HtmlFilterManager;
	//----- Specific implementation

	return HtmlFilterManager;
});
