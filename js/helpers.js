
jQuery.fn.reverse = [].reverse;									// add reverse function to array objects

Array.prototype.clone = function() { return this.slice(0); };	// e-z array clone function

Array.prototype.random = function() { 							// returns a random element from array
	var weiner = this[Math.floor(Math.random() * this.length)];
	while (!weiner) weiner = this[Math.floor(Math.random() * this.length)];		// re-spin if we got any sort of "false" value.
	return weiner;
}	

Array.prototype.shuffle = function() {
	var array = this;
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}

var ENTER = String.fromCharCode(10);
var ENTERENTER = String.fromCharCode(10) + String.fromCharCode(10);
var gENTER = new RegExp(ENTER, 'g');
var gTAB = new RegExp(String.fromCharCode(9), 'g');

window.size = function() {
	// var halfBuckets = ['music', 'vids'];		// if width is <320px, split height in 2 for these buckets

	var width = Math.min(window.innerWidth, document.documentElement.clientWidth);
	var height = Math.min(window.innerHeight, document.documentElement.clientHeight);
	var halfSize = false;
	if (width <= height / 4 * 3) {
		height /= 2;
		halfSize = true;
	}
	else height -= 40;	// make room for the header

	if (width <= 0) width = 800;
	if (height <= 0) height = 600;

	return {'width': width, 'height': height, 'halfSize': halfSize};
}


/* Meh, doesn't work so well.
window.holdYPos = function(duration, step) {
	if (duration === undefined) var duration = 2000;
	if (step === undefined) var step = 100;
	var checks = Math.round(duration / step);

	var startYpos = $('div.container.links').position().top;

	// Sometimes related functions move everything below 'about'.  If one of those is the active section, adjust the scroll.
	setTimeout(function() {
		(function yAdjust(cnt)
		{
			var diff = startYpos - $('div.container.links').position().top;

			if (diff != 0) $('html,body').animate({ scrollTop:  $(window).scrollTop() + diff }, 0);
			else if (cnt < checks) setTimeout(function() { yAdjust(cnt + 1); }, step);
		})(0);
	}, step);
}
*/

String.prototype.toMMSS = function () {	
	// expects youtube's funky format: 
	// E.g. PT15M51S  (https://developers.google.com/youtube/v3/docs/videos#contentDetails)
	var str = this.replace('PT', '');

	var hours = str.split('H')[0];
	if (hours === str) hours = 0;
	else str = str.replace(hours + 'H', '');

	var minutes = str.split('M')[0];
	if (minutes === str) minutes = 0;
	else str = str.replace(minutes + 'M', '');

	var seconds = str.split('S')[0];
	if (seconds === str) seconds = 0;
	else str = str.replace(seconds + 'S', '');

	// return MM:SS
	minutes = parseInt(minutes) + (parseInt(hours) * 60);

	if (parseInt(minutes) < 10) minutes = "0"+minutes;
	if (parseInt(seconds) < 10) seconds = "0"+seconds;

	return minutes + ':' + seconds;
}

Number.prototype.toMMSS = function () {	// expects a number
	var sec_numb    = Math.ceil(parseInt(this));
	// var hours   = Math.floor(sec_numb / 3600);
	var hours = 0;
	var minutes = Math.floor((sec_numb - (hours * 3600)) / 60);
	var seconds = sec_numb - (hours * 3600) - (minutes * 60);

	//if (hours   < 10) {hours   = "0"+hours;}
	if (minutes < 10) minutes = "0"+minutes;
	if (seconds < 10) seconds = "0"+seconds;

	return minutes + ':' + seconds;
}



//// Parses youtube URLs to find start time ////////////
String.prototype.parseYoutubeTime = function () {
	var str = this;
	if (str == '') return 0;
	
	var hours = 0;
	var mins = 0;
	var secs = 0;
	
	if (str.indexOf('#t=') > -1 || str.indexOf('?t=') > -1 || str.indexOf('&t=') > -1)
	{
		var tPos = str.indexOf('#t=') + 3;
		if (tPos == 2) tPos = str.indexOf('?t=') + 3;
		if (tPos == 2) tPos = str.indexOf('&t=') + 3;
		
		var hPos = str.indexOf("h", tPos);
		var mPos = str.indexOf("m", tPos);
		var sPos = str.indexOf("s", tPos);

		if (hPos == -1 && mPos == -1 && sPos == -1) {
			secs = str.substring(tPos);
			if (secs.indexOf('&') > -1) secs = secs.substring(0, secs.indexOf('&'));
		}

		if (hPos > -1) hours = str.substring(tPos, hPos);

		if (hPos > -1 && mPos > -1) mins = str.substring(hPos + 1, mPos);
		else if (mPos > -1) mins = str.substring(tPos, mPos);

		if (sPos > -1 && mPos > -1) secs = str.substring(mPos + 1, sPos);
		else if (sPos > -1 && hPos > -1) secs = str.substring(hPos + 1, sPos);
		else if (sPos > -1) secs = str.substring(tPos, sPos);
	}
	
	return (parseInt(hours) * 60 * 60) + (parseInt(mins) * 60) + parseInt(secs);
};


//// Parses blah=val&bleh=val into key-value pairs //////////////
String.prototype.params = function () {
    var params = {}, queries;
 
    // Split into key/value pairs
    queries = this.split("&");
 
    // Convert the array of strings into an object
    for (var i = 0, l = queries.length; i < l; i++ ) {
        var temp = queries[i].split('=');
        params[temp[0]] = temp[1];
    }
 
    return params;
};

// Returns string w/ passed characters removed from start/ end.
String.prototype.cTrim = function (nix) { // nix -- string of chars to remove from start/ end of a string.
	var str = this;
	var len = str.length;
	for(var i = 0; i < len; i++) if (nix.indexOf(str.charAt(0)) !== -1) str = str.substr(1);
	for(var i = len; i > 0; i--) if (nix.indexOf(str.charAt(str.length - 1)) !== -1) str = str.substr(0, str.length - 1);

	return str;
}

String.prototype.htmlDecode = function() { return $("<div/>").html(String(this)).text(); }
String.prototype.htmlEncode = function() {
	var str = this;
	return String(str)
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		//.replace(/\?/g, '%3F;')
		//.replace(/&/g, '&#38;')
	;
}


/* moved to links.push()
String.prototype.scrubTitle = function () {
	var tit = this;

	if (listr.bucket === 'music') {
		var pos = tit.indexOf('(20');
		if (pos === -1) pos = tit.indexOf('(19');
		if (pos === -1) pos = tit.indexOf('(18');
		if (pos === -1) pos = tit.indexOf('(17');
		if (pos === -1) pos = tit.indexOf('(16');

		if (pos !== -1) tit = tit.substr(0, pos + 6);

		pos = tit.indexOf(' -');
		if (pos !== -1) {
			tit = '<b>' + $.trim(tit.substr(0, pos) + '</b><br>' + tit.substr(pos + 2));
			while (tit.substr(0, 1) === '-' || tit.substr(0, 1) === ' ') tit = tit.substr(1);
		}

		var bPos = tit.indexOf(' [');
		if (pos !== -1 && bPos > pos) {
			pos = tit.indexOf('</b><br>') + 8;
			tit = tit.substr(0, pos) + '<i>' + tit.substr(pos, bPos - pos) + '</i><br>' +  tit.substr(bPos + 2).replace('] ', ' ').replace('](', ' (');
		}
	}

	// return tit.substr(0, 90) + (tit.length > 90 ? '...' : '');
	return tit;
}
*/
