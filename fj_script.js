ï»¿
"use strict";
!function () {
	if (!window.FJWidgets) {
		var obj = {

			createWidget: function (options) {
				
				var widgetType = options.widgetType;
				var mode = options.mode;
				var container = options.container;
				var width = options.width;
				var height = options.height;
				var backC = options.backColor;
				var fontC = options.fontColor;
				var preview = options.preview;
				var affURL = '';
				if (typeof (options.affURL) != 'undefined' && options.affURL != '')
					affURL = encodeURIComponent(options.affURL);


				var qs = 'wtype=' + widgetType + '&mode=' + mode + '&container=' + container + '&width=' + width + '&height=' + height + '&backC=' + backC + '&fontC=' + fontC;

				if (preview)
					qs += '&preview=true'

				qs += '&affurl=' + affURL;

				if (widgetType.toLowerCase() === 'ecocal') {
					if (mode.toLowerCase() == 'standard')
						width = '340px';
					var playerURL = '<iframe scrolling="no" src="https://feed.financialjuice.com/widgets/ecocal.aspx?' + qs + '" height="' + height + '" width="' + width + '" frameborder="0" style="width:' + width + ';height:"' + height + '""></iframe>';
					var div = document.getElementById(container);
					if (div != null) {
						div.style.width = width;
						div.innerHTML = playerURL;

					}
				}
				else if (widgetType.toLowerCase() === 'news') {
					
					var playerURL = '<iframe scrolling="no" src="https://feed.financialjuice.com/widgets/headlines.aspx?' + qs + '" height="' + height + '" width="' + width + '" frameborder="0" style="width:' + width + ';height:"' + height + '""></iframe>';
					var div = document.getElementById(container);
					if (div != null) {
						div.style.width = width;
						div.innerHTML = playerURL;

					}
				}
				else if (widgetType.toLowerCase() === 'voice') {

					var info = options.info;
					var display = '1'//options.display;
					if (info == '' || typeof(info) == "undefined")
						info = window.location.host;

					if (mode== '' || typeof (mode) == "undefined")
						mode = 'inline';

					var query = 'partner=' + info + '&mode=' + mode + '&info=' + info + '&display=' + display + '&container=' + container;
					if (query)
						qs += '&preview=true'

					query += '&affurl=' + affURL;
					if (mode == 'sticky') {
						var playerURL = '<iframe src="https://feed.financialjuice.com/voice-player.aspx?' + query + '" height=132 frameborder="2"  width=41 scrolling="no" style="z-index:99999;border:2px;position:fixed;bottom:50px;left:0; background-color: rgba(255,255,255,0);filter: progid:DXImageTransform.Microsoft.Gradient(GradientType=1,startColorStr="#E6FFFFFF",endColorStr="#E6FFFFFF");-ms-filter: progid:DXImageTransform.Microsoft.Gradient(GradientType=1,startColorStr="#E6FFFFFF",endColorStr="#E6FFFFFF");"></iframe>';
						var div = document.createElement("dic");
						div.innerHTML = playerURL;
						document.getElementsByTagName("body")[0].appendChild(div);
					}
					else {
						var playerURL = '<iframe scrolling="no" src="https://feed.financialjuice.com/voice-player.aspx?' + query + '" height=90 width=100% frameborder="0"></iframe>';
						var div = document.getElementById(container);
						if (div != null) {
							div.style.width = width;
							div.innerHTML = playerURL;
						}
					}
				}
				else if (widgetType.toLowerCase() === 'ts') {
					
					var playerURL = '<iframe scrolling="no" src="https://www.financialjuice.com/widgets/ts.aspx?' + qs + '" height="' + height + '" width="' + width + '" frameborder="0" style="width:' + width + ';height:"' + height + '""></iframe>';
					var div = document.getElementById(container);
					if (div != null) {
						div.style.width = width;
						div.innerHTML = playerURL;

					}
				}


            }
		};

		window.FJWidgets = obj;
	}
}();


//OldMethod
(function () {

	function getQueryStrings(url) {
		var assoc = {};
		var index = url.indexOf("?");
		if (index > 0) {
			url = url.substring(index + 1, url.length);
			var queryString = url;
			var keyValues = queryString.split('&');

			for (var i in keyValues) {
				var key = keyValues[i].split('=');
				if (key.length > 1) {
					assoc[key[0]] = key[1];
				}
			}
		}
		return assoc;
	}
	var scriptObj = document.getElementById('FJ-Widgets');	

	if (scriptObj != null ) {
		var options = getQueryStrings(scriptObj.src);

		
		var widgetType = options['wtype'];

		if (typeof (widgetType) == "undefined")
			return;
		var mode = options['mode'];
		var container = options['container'];
		var width = options['width'];
		var height = options['height'];
		var backC = options['backC'];
		var fontC = options['fontC'];
		var preview = options['preview'];
		var qs = 'wtype=' + widgetType + '&mode=' + mode + '&container=' + container + '&width=' + width + '&height=' + height + '&backC=' + backC + '&fontC=' + fontC;
		
		if (preview)
			qs += '&preview=true'
		

		if (widgetType.toLowerCase() === 'ecocal') {
			if (mode.toLowerCase() == 'standard')
				width = '340px';
			var playerURL = '<iframe scrolling="no" src="https://feed.financialjuice.com/widgets/ecocal.aspx?' + qs + '" height="' + height + '" width="' + width + '" frameborder="0" style="width:' + width + ';height:"' + height + '""></iframe>';
			var div = document.getElementById(container);
			if (div != null) {
				div.innerHTML = playerURL;
			}
		}
	}
    
})();
