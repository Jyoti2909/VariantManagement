// -------------- Dictionary
Dictionary = function() {
	this.items = [];
	this.keys  = [];
	this.map   = [];
}
Dictionary.prototype = {
	
	addItem : function (key, value) {
		this.items.push(value);
		this.keys.push(key);
		this.map[key] = value;
	},
	
	indexOf : function(o) {
        for(var i = 0; i < this.items.length; i++)
		  if(this.items[i] == o) 
			 return i;
        return -1;
    },
    
    indexOfKey : function(k) {
        for(var i = 0; i < this.keys.length; i++)
		  if(this.keys[i] == k) 
			 return i;
        return -1;
    },
    
    containsKey : function(key) {
		return this.indexOfKey(key)!=-1;
    },
    
    getItems : function() {
		return this.items;
    },
    
    getItem : function(key) {
		return this.map[key];
    },
    
    removeItemFromArray : function(array, index) {
		array.splice(index,1);
    },
    
	removeItem : function (key) {
		var index = this.indexOfKey(key);
		this.removeItemFromArray(this.items, index);
		this.removeItemFromArray(this.keys, index);
		this.map[key] = null;
	}
}

// -------------- ScriptLoader

ScriptLoader = function() {
	this.downloadItems = new Dictionary();
}
ScriptLoader.prototype = {
	AddScript : function(url) {
		if (this.downloadItems.containsKey(url))
			return;
		this.downloadItems.addItem(url, new ScriptLoadItem(url, false));
	},
	
	DownloadScript : function(url, documentObject) {
	    var arrIncludeStr = ["<script type='text/javascript' language='Javascript1.2' src='", url, "'>" + "<" + "/script>"];
	    if (documentObject==null)
	        documentObject = document;
	   
	    if (documentObject.readyState != 'complete')
	        documentObject.write(arrIncludeStr.join(""));
	    else if (jq$ != undefined)
	        jq$(arrIncludeStr.join("")).appendTo("head");        
	},
	
	DownloadAllScripts : function(documentObject) {
		var items = this.downloadItems.getItems();
		var batchDownloadableComponents = [];
		var oneByOneDownloadableComponents = [];
		var prefix = "rp.aspx?js=";

		for (var i=0; i<items.length; i++) {
			var componentUrl = items[i].url;

			if (!componentUrl.indexOf(prefix) === 0) {
				oneByOneDownloadableComponents.push(componentUrl);
			}
			else if (componentUrl.indexOf("datepicker.langpack") !== -1) { //HACK: Izenda doesn't bundle components with empty content properly. Izenda bug id: 27020_m4t1h9v6. Fixed in 6.10.0.16
				oneByOneDownloadableComponents.push(componentUrl);
			}
			else {
				var componentName = componentUrl.replace(prefix, "");
				batchDownloadableComponents.push(componentName);
			}
		}

		if (batchDownloadableComponents.length > 0) {
			this.DownloadScript(prefix + batchDownloadableComponents.join(), documentObject);
		}

		for (var i=0; i<oneByOneDownloadableComponents.length; i++) {
			this.DownloadScript(oneByOneDownloadableComponents[i], documentObject);
		}
	}
}

ScriptLoadItem = function(url, downloaded)  {
	this.url = url;
	this.downloaded = downloaded;
}
// ----------------------------
