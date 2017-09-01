// Sources handle displaying media and retreiving metadata from other sites.                     /////////////////////////////////
// Extensions (jpg, png, etc..) are sorted alphabetically beneath sources.  
// Porn sites are beneath the other sites and extensions.
// Links that don't match a source on domain try to find a source with the extension.
//
// Currently supported: 
// 		vids -- dailymotion, youtube, vimeo, twitch.tv
// 		music -- above plus bandcamp, soundcloud, hypem
// 		pics -- imgur, flickr, gfycat, gyazo
// 		eyecandy -- same as "pics"
// 		nsfw -- same as "pics" and "vids" plus... 
//
// Others:
//		google -- no media support, just translates search results into proper URLs.

/* //////////// Sites to be supported:

////////////////////////////////////////////
//////////// Maybes:

dailymotion playlists

vimeo playlists -- https://vimeo.com/couchmode/album/3348364/sort:preset/76874277



-- Not very poopular:
tudou.com
http://www.tudou.com/listplay/v7n4PJk-U_A/vS4e1wP6Z-w.html
<iframe src="http://www.tudou.com/programs/view/html5embed.action?type=1&code=vS4e1wP6Z-w&lcode=v7n4PJk-U_A&resourceId=0_06_05_99" allowtransparency="true" allowfullscreen="true" scrolling="no" border="0" frameborder="0" style="width:480px;height:400px;"></iframe>

youku.com
http://v.youku.com/v_show/id_XOTExNzYzNzA0.html?f=23562830
<iframe height=498 width=510 src="http://player.youku.com/embed/XOTExNzYzNzA0" frameborder=0 allowfullscreen></iframe>

http://www.hitbox.tv/nightvisionhawk
stream-- <iframe width="640" height="360" src="http://www.hitbox.tv/embed/nightvisionhawk" frameborder="0" allowfullscreen></iframe>
chat-- <iframe width="340" height="700" src="http://www.hitbox.tv/embedchat/nightvisionhawk" frameborder="0" allowfullscreen></iframe>


////////////////////////////////////////////
//////////// Probably nots:

hulu.com
bop.fm
giftoslideshow.com
imgrush.com
tumblr.com
vaughnlive.tv
http://replygif.net/1368 --> http://replygif.net/i/1368.gif
liveleak.com -- requires embedly (or using media_embed data)

////////////////////////////////////////////
//////////// Nevers:

grooveshark.com -- went offline :(
imagesious.com -- banned on reddit
mediacru.sh -- went offline :(
puu.sh -- not needed, apparently only direct image links
spotify.com -- doesn't stream w/out opening a window
soundgasm.net -- doesn't embed, yo.
video.fc2.com -- embedded player too clunky
vidzi.tv -- too damn many ads!!
*/


//////////////// This structure is not actually used in the code.  It's just here for reference. /////////////////////////////////
/*
listr.sources.defaults = {
	buckets : []				// Array of buckets that use this source
	, _ads : false 				// TRUE if source injects ads w/ the media
	, _pauses : false 			// TRUE if source can be paused/ resumed (youtube, soundcloud)
	, _streams : false			// TRUE if source autoplays/ skips to next or FALSE otherwise.
	, _https : true				// TRUE if content is available via HTTPS

	, _events : 0				// tracks number of AJAX calls to stagger calls
	, _init : false				// has this source been initialized?
	, _loaded : false			// has player object/ api/ javascript/ whatever been loaded?
	, _player : false			// player (usually an object) for this source

	, defaults : function(link) {}	// Called when a link to this source is added.  Returns source-specific values for that link.
	, error : function(err) {}	// Error-handler for this source.
	, init : function() {}		// Run once when a link to this source is added
	, load : function(link) {}	// Called when a link to this source is loaded
	, msg : function(json) {}			// Handles (JSON) messages from the source.
	, post : function(event, args) {} 	// Sends messages to the source.
	, pause : function(onOff) {}	// if _pauses is TRUE, this function is called when user clicks the pause button.
	, search : function(query, callback) { callback([]); }	// Search source for 'query' and passes results to 'callback' function
	, stop : function() {}		// Called before a new link is loaded to stop any running media
};
*/

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// All sources are sorted alphabetically with properties before functions.                       /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources = {};

///////// archive.org ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['archive.org'] = {
	buckets : ['vids', 'music']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		if (link.url.indexOf('/details/') == -1) return {};

// https://archive.org/details/TheStarWarsHolidaySpecial1978
// <iframe src="https://archive.org/embed/TheStarWarsHolidaySpecial1978" width="640" height="480" frameborder="0" webkitallowfullscreen="true" mozallowfullscreen="true" allowfullscreen></iframe>
		var props = {};
		props.kind = 'vid';
		props.source = 'Archive.Org';
		props.id_source = link.url.split('/details/')[1].split('/')[0].split('?')[0];
		props.id_uni = 'arc|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-archiveorg"> </div>');
	}
	, load : function(link) {
		$('#media-archiveorg').html('<iframe src="https://archive.org/embed/' + link.id_source + '?autoplay=1" allowfullscreen></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-archiveorg').html('');
	}
};

///////// audiomack ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['audiomack.com'] = {
	buckets : ['music']
	, bgColor: 'white'

	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : true // nothing to load
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		if (
			link.url.indexOf('/song/') == -1
			&& link.url.indexOf('/album/') == -1
			&& link.url.indexOf('/playlist/') == -1
		) return {};	// reject non-song/album links

		var props = {};
		props.kind = (link.url.indexOf('/album/') == -1 ? 'music' : 'album');
		props.source = 'Audiomack';
		props.id_source = link.url.substr(link.url.indexOf('.com/') + 5).split('?')[0].split('#')[0];
		props.id_uni = 'amk|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-audiomack"> </div>');
	}
	, load : function(link) {
		// <iframe src='http://www.audiomack.com/embed3/rreggaeton/gira-de-amor-prod-by-menes-y-nekxum-1?c1=fc881e&bg=f2f2f2&c2=222222' scrolling='no' width='100%' height='144' scrollbars='no' frameborder='0'></iframe>
		// <iframe src="http://www.audiomack.com/embed4-album/illmixtapescom/clipse-exclusive-audio-footage-1999" scrolling="no" width="100%" height="350" scrollbars="no" frameborder="0"></iframe>
		// <iframe src="http://www.audiomack.com/embed4-playlist/dj-t-gut/best-hip-hoprap-songs-of-february-2015" scrolling="no" width="100%" height="355" scrollbars="no" frameborder="0"></iframe>
		$('#media-audiomack').html(
			'<iframe src="https://www.audiomack.com/' 
				+ link.id_source.replace('song/', 'embed4/').replace('album/', 'embed4-album/').replace('playlist/', 'embed4-playlist/')
			+ '?play=true"></iframe>'
		).show();
	}
	, msg : function(json) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() { $('#media-audiomack').html(''); }
};

///////// bandcamp   /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['bandcamp.com'] = {
	buckets : ['music']
	// , bgColor: '#666'

	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		// Now handled in links.push()
		// if (listr.opts['onlyStreaming']) return {};		// If "only include streaming sites" is true, reject all links.

		if (link.url.indexOf('daily.bandcamp.com') != -1) return {};	// bandcamp's blog

		var props = {};
		props.url = link.url.replace('http://', 'https://');
		props.kind = 'page';
		props.source = 'Bandcamp';
		props.id_source = props.url.replace('https://', '').replace('.bandcamp.com/', '').replace('bandcamp.com/', '');
		props.id_uni = 'bcp|' + props.id_source;

		return props;
	}

	, error : function(err) {}	// Not used w/ bandcamp.  No API == no errors.

	, init : function() {
		if (this._init) return; this._init = true;
		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-bandcamp"> </div>');
	}

	, load : function(link) {
		$('#media-bandcamp').html(
			'<iframe src="' + link.url + (link.url.indexOf('?') == -1 ? '?' : '&') + 'output=embed"'
			+ ' width="100%" height="100%" frameborder="0" allowFullScreen style="overflow-x:hidden;">'
			+ '</iframe>'
		).show();

	}

	, msg : function(json) {}	// Not used w/ bandcamp.

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() {
		$('#media-bandcamp').html('');
	}
}

///////// coub.com  ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['coub.com'] = {
	buckets : ['vids', 'nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		// https://coub.com/view/7wa36
		if (link.url.indexOf('coub.com/view/') == 1) return {};

		var props = {};
		props.kind = 'vid';
		props.source = 'coub.com';
		props.id_source = link.url.split('coub.com/view/')[1].split('/')[0].split('?')[0].split('#')[0];
		props.id_uni = 'cou|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-coub"> </div>');
	}
	, load : function(link) {
		// <iframe src="https://coub.com/embed/7wa36?muted=false&autostart=true&originalSize=false&hideTopBar=false&startWithHD=true"></iframe>
		$('#media-coub').html('<iframe src="https://coub.com/embed/' + link.id_source + '?muted=false&autostart=true&originalSize=false&hideTopBar=false&startWithHD=true"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-coub').html('');
	}
};

///////// clyp.it ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['clyp.it'] = {
	buckets : ['music']
	, bgColor : '#F2A15A'

	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'music';
		props.source = 'clyp.it';
		// https://clyp.it/xrejdub2
		props.id_source = link.url.split('clyp.it/')[1].split('/')[0].split('?')[0].split('#')[0];
		props.id_uni = 'cit|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;
		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-clypit"> </div>');
	}

	, load : function(link) {
		// <iframe width="100%" height="160" src="https://clyp.it/xrejdub2/widget" frameborder="0"></iframe>
		$('#media-clypit').html('<iframe src="https://clyp.it/' + link.id_source  + '/widget"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() { $('#media-clypit').html(''); }
};

///////// dailymotion ////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['dailymotion.com'] = {
	buckets : ['music', 'vids', 'nsfw', 'gaynsfw']
	, bgColor: 'black'

	, _ads : true
	, _pauses : true
	, _streams : true
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false
	, _progress : false

	, defaults : function(link) {
		if (link.url.indexOf('/video/') == -1) return {};

		if (!this._init) this.init();	// initialize source if not already done.

		var props = {};
		props.kind = 'vid';
		props.source = 'DailyMotion';

		// http://www.dailymotion.com/video/x1z5nuq_meghan-trainor-all-about-that-bass_music
		props.id_source = link.url.split('/video/')[1].split('?')[0].split('#')[0];
		props.id_uni = 'dmn|' + props.id_source;

		return props;
	}
	, error : function(err) {}	// Called when an error is sent from the source.
	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-dailymotion"> </div>');
	}
	, load : function(link) {
		$("#media-dailymotion").html(
			'<iframe src="https://www.dailymotion.com/embed/video/' + link.id_source + '?autoplay=1&id=media-dailymotion&info=0&logo=0&webkit-playsinline=1&api=postMessage" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>'
		).show();

		if (window.addEventListener) window.addEventListener('message', listr.sources['dailymotion.com'].msg, false);
	    else window.attachEvent('onmessage', listr.sources['dailymotion.com'].msg, false);
	}

	, msg : function(json) {
		if (json.data === undefined || json.origin === undefined || json.origin.indexOf('dailymotion.com') == -1) return;
		var params = json.data.params();

// console.log(params);

		if (params.event == 'ended') listr.links.next();
		else if (params.event == 'error') console.log('dailymotion error', params, json);
		else if (params.event == 'canplay') {
			// $('div.media div.opts div.progressBar').css({
			// 	'display': 'inline-block'
			// 	// ,'-webkit-mask-box-image': 'url(/img/waveform.png)'
			// });

			$('div.media div.opts div.progressBar').show();
			$('#progress').width(0);
		}

		else if (params.event == 'durationchange') {
			listr.links.current.meta.length = parseInt(params.duration.replace('sc', ''));
			listr.links.update(listr.links.current);
		}
		else if (params.event == 'timeupdate') {
			var cur = params.time;
			var dur = listr.links.current.meta.length;

			if ($.isNumeric(cur) && $.isNumeric(dur) && dur > 0) {
				var pct = cur / dur;
				// $('#progress').width(Math.round(pct * $('div.progressBar').width()));
				$('#progress').stop().animate({'width': Math.round(pct * $('div.progressBar').width())}, 999, 'linear');
				listr.broadcast({ 'action': 'progress', 'target': 'links', 'link': listr.links.current, 'pct': pct, 'cur': Math.round(cur).toMMSS() });
			}

		}
	}

	, pause : function(onOff) {
		if (onOff)
			$("#media-dailymotion iframe")[0].contentWindow.postMessage(
				'pause'
				, $('#media-dailymotion iframe').attr('src').split('?')[0]
			);
		else
			$("#media-dailymotion iframe")[0].contentWindow.postMessage(
				'play'
				, $('#media-dailymotion iframe').attr('src').split('?')[0]
			);
	}
	
	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) {
		var dur = listr.links.current.meta.length;

		if ($.isNumeric(dur) && dur > 0)
			$("#media-dailymotion iframe")[0].contentWindow.postMessage(
				'seek=' + Math.round(dur * seekPct)
				, $('#media-dailymotion iframe').attr('src').split('?')[0]
			);
	}

	, stop : function() {
		$("#media-dailymotion").html('');

		// remove window listeners
		if (window.addEventListener) window.removeEventListener('message', listr.sources['dailymotion.com'].msg);
	    else window.detachEvent('onmessage', listr.sources['dailymotion.com'].msg, false);
	}
};

///////// deviantart //////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['deviantart.com'] = {
	buckets : ['pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : true
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		if (link.url.indexOf('/art/') == -1) return {};	// <Zoidberg> Reject link if it's not to an art!

		var props = {};
		props.kind = 'pic';
		props.source = 'DeviantArt';
		props.id_source = link.url.split('?')[0].split('#')[0];
		props.id_uni = 'dva|' + props.id_source;
		props._loaded = false;

		setTimeout(function() {
		    $.ajax({
		      dataType: "json"
		      , url: 
		      	'https://backend.deviantart.com/oembed?url=' + props.id_source + '&format=jsonp&callback=?'	// 
		      , success: function(json) {
					listr.sources['deviantart.com']._events--;
		      		link._loaded = true;

					if (json.type !== undefined && json.type == "photo") 
					{
						if (json.url !== undefined) link.url = json.url;
						if (json.thumbnail_url_200h !== undefined) link.thumbnail = json.thumbnail_url_200h;
						listr.links.update(link);
					}
				}
			});
		}, ++this._events * listr.opts.ajaxDelay);

		return props;
	}

	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-pic').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-pic"> </div>');
	}

	, load : function(link) {
		if (link._loaded) $('#media-pic').html('<img src="' + link.url + '">').show();
		else if (link.idx == listr.links.current.idx)
			setTimeout(function() { listr.sources['deviantart.com'].load(link); }, 100);
	}

	, msg : function(json) {}

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() {
		$('#media-pic').html('');
	}
};

///////// flickr     /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['flickr.com'] = {
	buckets : ['pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false			
	, _https : true
	
	, _events : 0
	, _init : false
	, _loaded : true // nothing to load for flickr
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'pic';
		props.source = 'flickr';
		props._loaded = false;	// all flickr links marked inactive until thier API returns results?


		if (link.url.indexOf('/sets/') != -1) {
			return {};	// not yet supported.
		}
		else if (link.url.indexOf('flic.kr/p/') != -1 || link.url.indexOf('/photos/') != -1)
		{
			if (link.url.indexOf('flic.kr/p/') != -1) props.id_source = link.url.split('.kr/p/')[1].split('/')[0];	// Short URL: https://flic.kr/p/oB28Yi
			else props.id_source = link.url.split('/photos/')[1].split('/')[1].split('/')[0];	// Full URL: https://www.flickr.com/photos/ianagrimis/16029524353/
			props.id_uni = 'fkr|' + props.id_source;

			setTimeout(function() {
			    $.ajax({
			      dataType: "json"
			      , url: 'https://api.flickr.com/services/rest/?&method=flickr.photos.getInfo&api_key=d205f63a767091de503b53f1bd93639a&format=json&jsoncallback=?&photo_id=' + props.id_source
			      , success: function(json) {
					listr.sources['flickr.com']._events--;

					if(json.stat == 'fail' || json.photo === undefined) {
						link.active = false;
						link.descrip = 'Flickr error';
					}
					else
					{
						var photoset = json.photo;
						link.url = 'https://farm'+photoset.farm+'.static.flickr.com/'+photoset.server+'/'+photoset.id+'_'+photoset.secret+'_b.jpg';
						link.thumb = 'https://farm'+photoset.farm+'.static.flickr.com/'+photoset.server+'/'+photoset.id+'_'+photoset.secret+'_t.jpg';
					}

					link._loaded = true;	// Success or not, marked this link as loaded.
			      }
				});
			}, ++this._events * listr.opts.ajaxDelay);
		}

		return props;
	}

	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-pic').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-pic"> </div>');
	}

	, load : function(link) {
		if (link._loaded) $('#media-pic').html('<img src="' + link.url + '">').show();
		else if (link.idx == listr.links.current.idx)
			setTimeout(function() { listr.sources['flickr.com'].load(link); }, 100);
	}

	, msg : function(json) {}

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-pic').html(''); }
};

///////// google     /////////////////////////////////////////////////////////////////////////////////////////////////////////////
// No actual google support.  Used to translate search results to real URLs.
listr.sources['google.com'] = { 
	buckets : ['music', 'vids', 'pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : true 		// no init
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) { 
		var params = link.url.params();
		if (params.url === undefined) return {};	// reject if no URL found.

		link.url = decodeURIComponent(params.url);
		if (link.url.lastIndexOf('/') == link.url.length - 1) link.url = link.url.substr(0, link.url.length - 1);

		link.domain = link.url.split('/')[2]; 	// get domain and extension from URL
		while (link.domain.split('.').length > 2 && link.domain.indexOf('.') < link.domain.length - 6)
			link.domain = link.domain.substr(link.domain.indexOf('.') + 1);	// remove any prefix from domain

		link.ext = '';
		if (link.url.indexOf('?') == -1 && link.url.lastIndexOf('.') > link.url.lastIndexOf('/')) link.ext = link.url.substr(link.url.lastIndexOf('.') + 1);

		if (listr.sources[link.domain] !== undefined) link.key = link.domain;
		else if (listr.sources[link.ext] !== undefined) link.key = link.ext;
		else return {}; 	// reject if no handler for this source.

		return listr.sources[link.key].defaults(link);
	}

	, error : function(err) { }
	, init : function() { }
	, load : function(link) { }
	, msg : function(json) { }
	, pause : function(onOff) { }
	, post : function(event, args) { }
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() { }
}

///////// gfycat      /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['gfycat.com'] = {
	buckets : ['pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'webm';
		props.source = 'GfyCat';

		// http://giant.gfycat.com/BlushingNaiveBlackpanther.gif
		props.id_source = link.url.split('/')[3].split('?')[0].split('#')[0].split('.')[0];
		if (props.id_source.length < 10) return {};	// reject the 'about' and other non-image pages
		else if (props.id_source.indexOf('Identifier') == 0) return {};		// reject albusm and other non-direct links

		props.id_uni = 'gfc|' + props.id_source;
		props.thumb = 'https://thumbs.gfycat.com/' + props.id_source + '-poster.jpg';

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;
		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-gfycat"> </div>');
	}

	, load : function(link) {
		$('#media-gfycat').html(
			'<video style="height:100%;max-width:100%;" preload="" autoplay="" poster="' + link.thumb + '" webkit-playsinline="" controls="" onerror="setTimeout(function() { listr.links.current.descrip=\'Not found on host.\';listr.links.current.active=false;listr.links.update(listr.links.current);listr.links.next();},500);"'
				+ (listr.bucket == 'media' || listr.bucket == 'music' || listr.bucket == 'vids' ? ' onended="listr.links.next();"' : ' loop=""')
			+ '>'
				+ '<source src="https://fat.gfycat.com/' + link.id_source + '.mp4" type="video/mp4">'
				+ '<source src="https://giant.gfycat.com/' + link.id_source + '.mp4" type="video/mp4">'
				+ '<source src="https://fat.gfycat.com/' + link.id_source + '.webm" type="video/webm">'
				+ '<source src="https://giant.gfycat.com/' + link.id_source + '.webm" type="video/webm">'
				+ '<source src="https://zippy.gfycat.com/' + link.id_source + '.mp4" type="video/mp4">'
				+ '<source src="https://zippy.gfycat.com/' + link.id_source + '.webm" type="video/webm">'
			+ '</video>'
		).show();
	}

	, pause : function(onOff) {
		if (onOff === undefined) var onOff = true;
console.log('gfy pause ' + onOff);
		if (onOff) $('#media-gfycat video').trigger('pause');
		else $('#media-gfycat video').trigger('play');
	}

	, msg : function(json) {}

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-gfycat').html(''); }
};

///////// gyazo     ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['gyazo.com'] = {
	buckets : ['pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : true
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.source = 'Gyazo';
		props.id_source = link.url.split('/')[3].split('.')[0].split('?')[0].split('#')[0];
		props.id_uni = 'gya|' + props.id_source;

		if (link.ext == 'mp4' || link.ext == 'webm' || link.ext == 'gif') props.kind = 'webm';
		else if (link.ext == 'jpg' || link.ext == 'png') props.kind = 'pic';
		else props.kind = 'link';

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-pic').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-pic"> </div>');

		// gyazo also gets its own <div> for webm's
		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-gyazo"> </div>');
	}
	, load : function(link) {
		if (link.kind == 'webm')
			$('#media-gyazo').html(
				'<video style="height:100%;max-width:100%;" preload="" autoplay="" poster="' + link.thumb + '" webkit-playsinline="" controls="" onerror="setTimeout(function() { listr.links.current.descrip=\'Not found on host.\';listr.links.current.active=false;listr.links.update(listr.links.current);listr.links.next();},500);"'
					+ (listr.bucket == 'media' || listr.bucket == 'music' || listr.bucket == 'vids' ? ' onended="listr.links.next();"' : ' loop=""')
				+ '>'
					+ '<source src="' + link.url.replace('.gif', '.mp4') + '" type="video/mp4">'
				+ "</video>"
			).show();
		else if (link.kind == 'pic') $('#media-pic').html('<img src="' + link.url + '">').show();
		else {	// link of unknown format, try it until we find it.
			$('<img/>').attr('src', 'https://i.gyazo.com/' + link.id_source + '.png')	// first, check for .png
				.load(function() { 
					link.kind = 'pic';
					link.url = 'https://i.gyazo.com/' + link.id_source + '.png';
					listr.links.update(link);

					$('#media-pic').html('<img src="https://i.gyazo.com/' + link.id_source + '.png">').show();
					$(this).remove(); 
				})

				.error(function() {
					$('<img/>').attr('src', 'https://i.gyazo.com/' + link.id_source + '.jpg')	// if that fails, try .jpg
						.load(function() {
							link.kind = 'pic';
							link.url = 'https://i.gyazo.com/' + link.id_source + '.jpg';
							listr.links.update(link);

							$('#media-pic').html('<img src="https://i.gyazo.com/' + link.id_source + '.jpg">').show();
							$(this).remove(); 
						})

						// if both fail, it must be a mp4 (might be a .gif, but we want the mp4 if that's the case)
						.error(function() {	
							link.kind = 'webm';
							link.url = 'https://i.gyazo.com/' + link.id_source + '.mp4';
							listr.links.update(link);

							$('#media-gyazo').html(
								'<video style="height:100%;max-width:100%;" preload="" autoplay="" poster="' + link.thumb + '" webkit-playsinline="" controls="" onerror="setTimeout(function() { listr.links.current.descrip=\'Not found on host.\';listr.links.current.active=false;listr.links.update(listr.links.current);listr.links.next();},500);"'
									+ (listr.bucket == 'media' || listr.bucket == 'music' || listr.bucket == 'vids' ? ' onended="listr.links.next();"' : ' loop=""')
								+ '>'
									+ '<source src="https://i.gyazo.com/' + link.id_source + '.mp4" type="video/mp4">'
								+ "</video>"
							).show();
						});
				});
		}

	}

	, pause : function(onOff) {
		if (onOff === undefined) var onOff = true;
		if (onOff) $('#media-gyazo video').trigger('pause');
		else $('#media-gyazo video').trigger('play');
	}

	, msg : function(json) {}

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-pic,#media-gyazo').html(''); }
};

///////// hypem      /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['hypem.com'] = {
	buckets : ['music']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : true // nothing to load
	, _player : false

	, defaults : function(link) {
		if (link.url.indexOf('/premiere') == -1) return {};	// reject non-/premiere/ links

		if (!this._init) this.init();

		var props = {};
		props.url = link.url.replace('/premiere/', '/premiere-embed/').replace('http:', 'https:');
		props.kind = 'music';
		props.source = 'HypeMachine';
		props.id_source = props.url.split('/premiere-embed/')[1].split('?')[0].split('#')[0];
		props.id_uni = 'hpm|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-hypem"> </div>');
	}
	, load : function(link) {
		$('#media-hypem').html(
			'<iframe src="' 
				+ link.url
			+ '?play=true"></iframe>'
		).show();
	}
	, msg : function(json) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() { $('#media-hypem').html(''); }
};

///////// imgur      /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['imgflip.com'] = {
	buckets : ['pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, bgColor: '#121211'

	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();	// initialize source if not already done.

		var props = {};
		props.kind = 'pic';
		props.source = 'ImgFlip';

		// https://imgflip.com/i/qea4a#oc9p31LP6GDLKSRU.16 -> https://i.imgflip.com/qea4a.jpg
		if (link.url.indexOf('i.imgflip.com') != -1) {
			props.id_source = link.url.split('imgflip.com/')[1].split('/')[0].split('.')[0].split('?')[0].split('#')[0];
			props.url = link.url.replace('http://', 'https://');
		}
		else if (link.url.indexOf('imgflip.com/gif/') != -1) {
			props.id_source = link.url.split('imgflip.com/gif/')[1].split('/')[0].split('.')[0].split('?')[0].split('#')[0];
			props.url = 'https://i.imgflip.com/' + props.id_source + '.gif';
		}
		else if (link.url.indexOf('imgflip.com/i/') != -1) {
			props.id_source = link.url.split('imgflip.com/i/')[1].split('/')[0].split('.')[0].split('?')[0].split('#')[0];
			props.url = 'https://i.imgflip.com/' + props.id_source + '.jpg';
		}
		else return {};	// reject other imgflip links

		props.id_uni = 'imf|' + props.id_source;
		return props;
	}
	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-pic').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-pic"> </div>');
	}

	, load : function(link) {
		$('#media-pic').html('<img src="' + link.url + '">').show();
	}

	, msg : function(json) { }	// no msgs

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-pic').html(''); }
}

///////// imgur      /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['imgur.com'] = {
	buckets : ['pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, bgColor: '#121211'

	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();	// initialize source if not already done.

		var curURL = link.url.replace('http://', 'https://').replace('Imgur.com','imgur.com').replace('www.', '').split('?')[0].split('&')[0].split('#')[0];

		var props = {};
		props.source = 'Imgur';
		props.id_source = curURL.split('imgur.com/')[1].split('/')[0].split('.')[0];

		if (curURL.indexOf('/gallery/') != -1) {
			// Img: http://imgur.com/gallery/V9FjP
			props.id_source = curURL.split('/gallery/')[1].split('/')[0].split('.')[0].split('?')[0];	// E.g. http://imgur.com/gallery/mnlyyj2/new

			if (props.id_source.length < 6) {
				props.kind = 'album';
				props.explodable = 'imgur-album';
				curURL = 'https://imgur.com/a/' + props.id_source + '/embed';
			}
			else {
				props.kind = 'pic';
				props.ext = 'png';
				curURL = 'https://i.imgur.com/' + props.id_source + '.png';
			}
		}

		//// albums 	/////////////////////////////////////////////////////////////
		else if (curURL.indexOf('/t/') != -1) { // http://imgur.com/t/neil_degrasse_tyson/OTg5n
			try {
				props.id_source = curURL.split('/t/')[1].split('/')[1].split('?')[0];
				props.kind = 'album';
				props.explodable = 'imgur-album';

				curURL = 'https://imgur.com/a/' + props.id_source + '/embed';
			}
			catch(e) { return {}; }
		}

		else if (curURL.indexOf('/a/') != -1) {
			if (curURL.indexOf('/embed') == -1) curURL += '/embed';

			props.id_source = curURL.split('/a/')[1].split('/')[0].split('?')[0];	// E.g. http://imgur.com/gallery/mnlyyj2/new
			props.kind = 'album';
			props.explodable = 'imgur-album';
		}

		// http://imgur.com/r/PrettyGirls/PpccAzh
		else if (curURL.indexOf('/r/') != -1) {
			props.id_source = curURL.substr(curURL.lastIndexOf('/') + 1).split('.')[0].split('?')[0];
			props.kind = 'pic'
			props.ext = 'png';
			curURL = 'https://i.imgur.com/' + props.id_source + '.png';
		}

		// http://imgur.com/topic/Aww/XEhkV
		else if (curURL.indexOf('/topic/') != -1) {
			props.id_source = curURL.substr(curURL.lastIndexOf('/') + 1).split('.')[0].split('?')[0];
			props.kind = 'album';
			props.explodable = 'imgur-album';
			curURL = 'https://imgur.com/a/' + props.id_source + '/embed';
		}

		else if (curURL.lastIndexOf(',') > curURL.lastIndexOf('/')) 	// comma-seperated list of images
		{	// http://imgur.com/Axe2ZH9,16j4Iwu -> http://i.imgur.com/Axe2ZH9.png and http://i.imgur.com/16j4Iwu.png
			// if there's a .JPG or other extension in the URL, remove it.  Yes, people do this.
			if (curURL.lastIndexOf('.') > curURL.lastIndexOf(',')) curURL = curURL.substr(curURL.lastIndexOf('.'));

			// Get 1st image in list.
			props.id_source = curURL.split('imgur.com/')[1].split(',')[0];

			var otherIDs = curURL.split('imgur.com/')[1].replace(props.id_source + ',', '').split(',');

			props.related = {}; // link.related;
			props.related.permalink = link.related.permalink;	// don't lose the permalink!
			props.related.links = [];
			$.each(otherIDs, function(i, id) {
				props.related.links.push({
					'url': 'https://i.imgur.com/' + id + '.png'
					, 'title': link.title + ' #' + (i + 2)
					, 'author': link.author
					, 'source': link.source
					, 'related': { 'permalink': link.related.permalink }
				});
			});

			props.ext = 'png';
			props.kind = 'pic';
			curURL = 'https://i.imgur.com/' + props.id_source + '.png';
		}

		//// pics 	    /////////////////////////////////////////////////////////////
		else if (link.ext == 'gif') {					// change .gif to the new HTML5 .gifv format
			curURL += 'v';
			props.ext = 'gifv';	
			props.kind = 'webm';
		}
		else if (link.ext == 'gifv' || link.ext == 'webm') props.kind = 'webm';
		else if (link.ext == '') {						// http://imgur.com/Axe2ZH9 -> http://i.imgur.com/Axe2ZH9.png
			// Thumbnail suffixes: s b t m l h
			curURL = curURL.replace('//imgur.com', '//i.imgur.com') + '.png';
			props.ext = 'png';
			props.kind = 'pic';
		}
		else props.kind = 'pic'; 	// direct image link

		props.url = curURL;	// overwrite given URL

		if (props.url.indexOf('/a/') == -1) {
			props.thumb = curURL.substr(0, curURL.lastIndexOf('.')) + 'm.jpg';
			props.id_source = curURL.split('/')[3].split('.')[0].split('?')[0];
		}
		else {
			props.id_source = 'a/' + curURL.split('/')[4].split('?')[0];
			// https://imgur.com/a/u8UHV/embed?referrer=https%3A%2F%2Fwww.redditmedia.com%2Fmediaembed%2F5qk0ul
			// <blockquote class="imgur-embed-pub" lang="en" data-id="a/u8UHV"><a href="//imgur.com/u8UHV">Taking Llamas to the End</a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>
			// props.url += '?referrer=' + encodeURIComponent(window.location.href);
		}

		props.id_uni = 'imr|' + props.id_source;

		return props;
	}

	, error : function(err) { }

	, explode : function(url) {
		if ($('table thead th.sorting_desc').length > 0 || $('table thead th.sorting_asc').not('th.pos').length > 0) $('th.pos').click();

		// var loaded = [];
		// if (listr.links.current.idx + 1 < listr.links.list.length)
		// 	loaded = listr.links.list.splice(listr.links.current.idx + 1, listr.links.list.length - listr.links.current.idx - 1);

		var id_album = url.split('/a/')[1].split('/')[0].split('?')[0];
		var albumAPI = "https://api.imgur.com/3/album/" + id_album + "/images";

		$.ajax({
			url: albumAPI
			, type: 'GET'
			, dataType: 'json'
			, success: function(json) { 
// console.log(json);
				var fImgs = json.data;
				var fCnt = json.data.length;

				listr.links.stash();				

				listr.links.batchPush(true);
				$.each(fImgs, function(index, value) {
					listr.links.push({
						url: value.link
						// , title: (index < 10 ? '0' : '') + index + ") " + listr.links.current.title
						, title: (value.title == null ? (index < 10 ? '0' : '') + index + ") " + listr.links.current.title : value.title)
						, descrip: (value.description == null ? '' : value.description)

						, author: listr.links.current.author
						, score: listr.links.current.score
						, related: listr.links.current.related
					});
				});
				listr.links.batchPush(false);

				listr.links.restore();
				listr.links.update();
			}
		  	, error: function() { 
		  		listr.links.restore();
		  		listr.links.update();
		  		alert('Retreiving image filenames failed. :/'); 
		  	}
			, beforeSend: function(xhrObj) {
	            xhrObj.setRequestHeader("Content-Type","application/json");
	            xhrObj.setRequestHeader("Accept","application/json");
	            xhrObj.setRequestHeader("Authorization","Client-ID 64143810fbfc67d");
	        }
		});	


	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-pic').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-pic"> </div>');

		// imgur also gets its own media holder for albums
		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-imgur"> </div>');
	}

	, load : function(link) {
		if (link.kind == 'pic') $('#media-pic').html('<img src="' + link.url + '">').show();
		else if (link.kind == 'webm')
		{
			var size = window.size();
			var url = link.url; //.replace('.gifv', '').replace('.webm', '');
			if (url.lastIndexOf('.') > url.lastIndexOf('/')) url = url.substr(0, url.lastIndexOf('.'));

			$("#media-imgur").html(
				'<video style="height:100%;max-width:100%;" preload="" autoplay="" poster="' + link.thumb + '" webkit-playsinline="" controls="" onerror="setTimeout(function() { listr.links.current.descrip=\'Not found on host.\';listr.links.current.active=false;listr.links.update(listr.links.current);listr.links.next();},500);"'
					+ (listr.bucket == 'media' || listr.bucket == 'music' || listr.bucket == 'vids' ? ' onended="listr.links.next();"' : ' loop=""')
				+ '>'
	                + '<source src="' + url + '.mp4" type="video/mp4">'
	                // + '<source src="' + curURL + '.webm" type="video/webm">'

	                // Flash back-up <object>
	                + '<object style="max-width:100%;height:100%" type="application/x-shockwave-flash" data="https://s.imgur.com/include/flash/gifplayer.swf?imgur_video=' + url + '.mp4&amp;imgur_width=' + size.width + '&amp;imgur_height=' + $('div.container.media div.content').height() + '&amp;imgur_url=">'
	                    + '<param name="movie" value="https://s.imgur.com/include/flash/gifplayer.swf?imgur_video=' + url + '.mp4&amp;imgur_width=' + size.width + '&amp;imgur_height=' + $('div.container.media div.content').height() + '">'
	                    + '<param name="allowscriptaccess" value="never">'
	                    + '<param name="flashvars" value="height=' + $('div.container.media div.content').height() + '&amp;width=' + size.width + '">'
	                    + '<param name="width" value="' + size.width + '">'
	                    + '<param name="height" value="' + $('div.container.media div.content').height() + '">'
	                    + '<param name="version" value="0">'
	                    + '<param name="scale" value="scale">'
	                    + '<param name="salign" value="tl">'
	                    + '<param name="wmode" value="opaque">'
	                 + '</object>'
	            + '</video>'
			).show();
		}
		else {	// album
			// var id_album = url.split('/a/')[1].split('/')[0].split('?')[0];
			var albumAPI = "https://api.imgur.com/3/album/" + link.id_source.replace('a/', '') + "/images";
// console.log('trying to get ' + albumAPI);
			$.ajax({
				url: albumAPI
				, type: 'GET'
				, dataType: 'json'
				, success: function(json) { 
	// console.log(json);
					var fImgs = json.data;
					// var fCnt = json.data.length;
// console.log('imgur returned', fImgs);
					// listr.links.stash();				

					$.each(fImgs, function(index, value) {
						if (index) { // 	push to related
							if (link.related.links === undefined) link.related.links = [];

							link.related.links.push({
								url: value.link
								// , title: (index < 10 ? '0' : '') + index + ") " + listr.links.current.title
								, title: (value.title == null ? (index < 10 ? '0' : '') + index + ") " + link.title : value.title)
								, descrip: (value.description == null ? '' : value.description)

								, author: link.author
								, score: link.score
								// , 'related': { 'permalink': link.related.permalink }
								, related: link.related
							});
						}
						else { 		// convert this link to first pic
							link.url = value.link;
							link.descrip = (value.description == null ? '' : value.description);
							link.kind = 'pic';
// console.log('updated this link to...', link);
						}
					});

					setTimeout(function() { listr.links.load(link); })
				}
			  	, error: function() { 
			  		alert('Retreiving image filenames failed. :/'); 
			  	}
				, beforeSend: function(xhrObj) {
		            xhrObj.setRequestHeader("Content-Type","application/json");
		            xhrObj.setRequestHeader("Accept","application/json");
		            xhrObj.setRequestHeader("Authorization","Client-ID 64143810fbfc67d");
		        }
			});	

			// $('#media-imgur').html('<iframe src="' + link.url.replace('http://', 'https://') + '"></iframe>').show();
			// 
			// $('#media-imgur').html('<blockquote class="imgur-embed-pub" lang="en" data-id="' + link.id_source + '"></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>').show();
			// 
			// $('a.imgurDownload')
			// 	.unbind('click')
			// 	.click(function(event) { window.open(link.url.replace('//imgur.com', '//s.imgur.com').replace('/embed', '/zip'), '_blank'); })
			// 	.show()
			// ;
		}
	}

	, pause : function(onOff) {
		if (onOff === undefined) var onOff = true;
		if (onOff) $('#media-imgur video').trigger('pause');
		else $('#media-imgur video').trigger('play');
	}

	, msg : function(json) { }	// no msgs

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-pic,#media-imgur').html(''); }
};

///////// jpg /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['jpg'] = {
	buckets : ['pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, _ads : false 				
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true			
	, _player : false			// no player for direct images

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.url = link.url;
		props.kind = 'pic';
		props.source = 'Direct';
		props.id_uni = 'img|' + link.domain + '|' + props.url.substr(props.url.lastIndexOf('/') + 1).split('.')[0].split('?')[0];

		return props;
	}
	, error : function(err) {}	// no errors w/ direct images

	, init : function() {
		if (this._init) return; this._init = true;
		if ($('#media-pic').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-pic"> </div>');
	}

	, load : function(link) { $('#media-pic').html('<img src="' + link.url + '">').show(); }

	, msg : function(json) {}	// no msgs w/ direct images

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-pic').html(''); }
};

listr.sources['jpeg'] = listr.sources['jpg'];	// Copy above for .jpeg
listr.sources['png'] = listr.sources['jpg'];	// Copy above for .png
listr.sources['gif'] = listr.sources['jpg'];	// Copy above for .GIF

///////// gifyoutube/ gifs.com  ////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['gifyoutube.com'] = {
	buckets : ['pics', 'eyecandy', 'nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();
		
		var props = {};
		props.kind = 'pic';
		props.source = 'GIFYoutube';
		// https://www.gifyoutube.com/gif/yArz69
		// https://share.gifyoutube.com/yArz69.gif

		// https://gifs.com/gif/yArz69
		// <iframe src="http://gifs.com/embed/yArz69" frameborder="0" scrolling="no" width='480' height='270' style="-webkit-backface-visibility: hidden;-webkit-transform: scale(1);" ></iframe>
		props.id_source = link.url.split('.com/')[1].replace('gif/', '').replace('.gif', '').split('?')[0].split('#')[0];

		props.id_uni = 'gyt|' + props.id_source;
		// props.url = 'http://gifs.com/embed/' + props.id_source;
		// if (link.url.indexOf('.gif') == -1) props.url = 'https://share.gifyoutube.com/' + props.id_source + '.gif';

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-gifyoutube"> </div>');
	}
	, load : function(link) {
		$('#media-gifyoutube').html('<iframe src="https://gifs.com/embed/' + link.id_source + '" frameborder="0" scrolling="no" width="100%" height="100%" style="-webkit-backface-visibility: hidden;-webkit-transform: scale(1);" ></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-gifyoutube').html('');
	}
}

listr.sources['gifs.com'] = listr.sources['gifyoutube.com'];

///////// livecap.tv ///////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['livecap.tv'] = {
	buckets : ['vids']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();
		// https://www.livecap.tv/t/eternalenvyy/ulNHsRhNpG6
		// <iframe src="https://www.livecap.tv/s/embed/eternalenvyy/ulNHsRhNpG6" width="640" height="360" frameborder="0"></iframe>
		if (link.url.indexOf('livecap.tv/t/') == -1) return {};

		var props = {};
		props.kind = 'vid';
		props.source = 'livecap.tv';
		props.id_source = link.url.split('livecap.tv/t/')[1];
		props.id_uni = 'lct|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-livecap"> </div>');
	}
	, load : function(link) {
		$('#media-livecap').html('<iframe src="https://www.livecap.tv/s/embed/' + link.id_source + '"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-livecap').html('');
	}
};


///////// mixcloud ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['mixcloud.com'] = {
	buckets : ['music']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

// https://www.mixcloud.com/bassbird/summertime-done-raindrops-falling-liquid-dnb-mix/
// width="660" height="180" src="https://www.mixcloud.com/widget/iframe/?embed_type=widget_standard&amp;embed_uuid=1492c67c-9d24-4fd7-ae5e-caaca9c7730d&amp;feed=https%3A%2F%2Fwww.mixcloud.com%2Fbassbird%2Fsummertime-done-raindrops-falling-liquid-dnb-mix%2F&amp;hide_cover=1&amp;hide_tracklist=1&amp;replace=0" frameborder="0"></iframe><div style="clear: both; height: 3px; width: 652px;"></div><p style="display: block; font-size: 11px; font-family: 'Open Sans', Helvetica, Arial, sans-serif; margin: 0px; padding: 3px 4px; color: rgb(153, 153, 153); width: 652px;"><a href="https://www.mixcloud.com/bassbird/summertime-done-raindrops-falling-liquid-dnb-mix/?utm_source=widget&amp;utm_medium=web&amp;utm_campaign=base_links&amp;utm_term=resource_link" target="_blank" style="color:#808080; font-weight:bold;">Summertime Done Raindrops Falling - Liquid DnB Mix</a><span> by </span><a href="https://www.mixcloud.com/bassbird/?utm_source=widget&amp;utm_medium=web&amp;utm_campaign=base_links&amp;utm_term=profile_link" target="_blank" style="color:#808080; font-weight:bold;">Bassbird</a><span> on </span><a href="https://www.mixcloud.com/?utm_source=widget&amp;utm_medium=web&amp;utm_campaign=base_links&amp;utm_term=homepage_link" target="_blank" style="color:#808080; font-weight:bold;"> Mixcloud</a></p><div style="clear: both; height: 3px; width: 652px;"></div>

// https://www.mixcloud.com/widget/iframe/?autoplay=1&embed_type=widget_standard&hide_cover=1&replace=0&feed=https://www.mixcloud.com/bassbird/summertime-done-raindrops-falling-liquid-dnb-mix
// <iframe width="660" height="180" src="https://www.mixcloud.com/widget/iframe/?embed_type=widget_standard&amp;embed_uuid=72451121-c201-4f0e-9516-d57d8250ff93&amp;feed=https%3A%2F%2Fwww.mixcloud.com%2Fbassbird%2Fsummertime-done-raindrops-falling-liquid-dnb-mix%2F&amp;hide_cover=1&amp;hide_tracklist=1&amp;replace=0" frameborder="0"></iframe><div style="clear: both; height: 3px; width: 652px;"></div><p style="display: block; font-size: 11px; font-family: 'Open Sans', Helvetica, Arial, sans-serif; margin: 0px; padding: 3px 4px; color: rgb(153, 153, 153); width: 652px;"><a href="https://www.mixcloud.com/bassbird/summertime-done-raindrops-falling-liquid-dnb-mix/?utm_source=widget&amp;utm_medium=web&amp;utm_campaign=base_links&amp;utm_term=resource_link" target="_blank" style="color:#808080; font-weight:bold;">Summertime Done Raindrops Falling - Liquid DnB Mix</a><span> by </span><a href="https://www.mixcloud.com/bassbird/?utm_source=widget&amp;utm_medium=web&amp;utm_campaign=base_links&amp;utm_term=profile_link" target="_blank" style="color:#808080; font-weight:bold;">Bassbird</a><span> on </span><a href="https://www.mixcloud.com/?utm_source=widget&amp;utm_medium=web&amp;utm_campaign=base_links&amp;utm_term=homepage_link" target="_blank" style="color:#808080; font-weight:bold;"> Mixcloud</a></p><div style="clear: both; height: 3px; width: 652px;"></div>
		var props = {};
		props.kind = '';
		props.source = 'Mixcloud';
		props.id_source = link.url.split('mixcloud.com/')[1].cTrim('/');
		props.id_uni = 'mxc|' + props.id_source;

		if (link.url.substr(-1) != '/') props.url = link.url + '/';

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="embed-mixcloud"> </div>');
	}

	, load : function(link) {
		// Doesn't show playlist, sadly:
		// $('#embed-mixcloud').html('<iframe width="100%" height="100%" src="https://www.mixcloud.com/widget/iframe/?autoplay=1&amp;embed_type=widget_standard&amp;replace=0&amp;feed=' + encodeURIComponent(link.url) + '"></iframe>').show();

		// The old-school way.
		$('#embed-mixcloud').html(
			'<object width="100%" height="100%"><param name="movie" value="https://www.mixcloud.com/media/swf/player/mixcloudLoader.swf?autoplay=1&amp;embed_type=widget_standard&amp;feed=' + encodeURIComponent(link.url) + '&amp;hide_cover=1&amp;mini=1&amp;replace=0"><param name="allowFullScreen" value="true"><param name="wmode" value="opaque"><param name="allowscriptaccess" value="always"><embed src="https://www.mixcloud.com/media/swf/player/mixcloudLoader.swf?autoplay=1&amp;embed_type=widget_standard&amp;feed=' + encodeURIComponent(link.url) + '&amp;hide_cover=1&amp;mini=1&amp;replace=0" type="application/x-shockwave-flash" wmode="opaque" allowscriptaccess="always" allowfullscreen="true" width="100%" height="100%"></object>'
		).show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#embed-mixcloud').html('');
	}
};

///////// oddshot.tv ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['oddshot.tv'] = {
	buckets : ['vids']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (link.url.indexOf('/shot/') == -1) return {};
		else if (!this._init) this.init();

		// http://oddshot.tv/shot/esl_csgo_38_201507021707587978
		// <iframe src="http://oddshot.tv/shot/esl_csgo_38_201507021707587978/embed" width="640" height="360" frameborder="0"></iframe>
		var props = {};
		props.kind = 'vid';
		props.source = 'Oddshot.TV';
		props.id_source = link.url.split('/shot/')[1].split('/')[0].split('?')[0].split('#')[0];
		props.id_uni = 'otv|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-oddshot"> </div>');
	}
	, load : function(link) {
		$('#media-oddshot').html('<iframe src="https://oddshot.tv/shot/' + link.id_source + '/embed" width="100%" height="100%" frameborder="0"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() { $('#media-oddshot').html(''); }
};


///////// openload.co ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['openload.co'] = {
	buckets : ['vids']
	, _ads : true
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		// https://openload.co/f/usAnhc_G_HE/The.Hunger.Games.Mockingjay.Part.2.2015.1080p.BluRay.mp4
		// https://openload.co/embed/usAnhc_G_HE/
		if (link.url.indexOf('/f/') == -1) return {};

		var props = {};
		props.kind = 'vid';
		props.source = 'Openload.co';
		props.id_source = link.url.split('/f/')[1].split('/')[0].split('?')[0];
		props.id_uni = 'old|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-openload"> </div>');
	}
	, load : function(link) {
		window.popAdsLoaded = true;
		$('#media-openload').html('<iframe src="https://openload.co/embed/' + link.id_source + '" frameborder="0"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-openload').html('');
	}
};

listr.sources['openload.io'] = listr.sources['openload.co'];


///////// plays.tv ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['plays.tv'] = {
	buckets : ['vids']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		// http://plays.tv/video/564b892b0e85b759af
		if (link.url.indexOf('/video/') == -1) return {};

		var props = {};
		props.kind = 'vid';
		props.source = 'Plays.TV';
		props.id_source = link.url.split('/video/')[1].split('/')[0].split('?')[0].split('#')[0];
		props.id_uni = 'ptv|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-playstv"> </div>');
	}
	, load : function(link) {
		// http://plays.tv/embed/564b892b0e85b759af?autostart=1
		$('#media-playstv').html('<iframe src="https://plays.tv/embed/' + link.id_source + '" frameborder="0"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-playstv').html('');
	}
};

///////// reddit /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This source is (currently) just to handle reddit search requests.
// Loading listings (subreddits, posts, etc..) is handled in feeds.js
listr.sources['reddit.com'] = {
	buckets : ['music', 'vids', 'pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _player : false
	, _init : true
	, _loaded : true
	, _events : 0

	, defaults : function(link) {
		if (!this._init) this.init();

		// Maybe handle links to subreddits here in the future?
		return {};	// For now, reject all links.
	}

	, error : function(err) {}

	, init : function() { if (this._init) return; this._init = true; }

	, load : function(link) {}

	, msg : function(json) {}

	, search : function(query, callback) {
		var url = '';
		var cnt = 0;

		if (listr.opts['onlySearchFeeds'])
		{
			var maxLen = 4048;

			// Get all subreddits loaded as feeds.
			$.each(listr.feeds.list, function(i, feed) {
				var sub = feed.url.replace('/r/', '');

				if (
					feed.source == 'reddit'
					&& feed.cat != 'Suggested'
					&& feed.url.indexOf('/r/') == 0
					&& ('+' + url + '+').indexOf('+' + sub + '+') == -1
					&& url.length + sub.length < maxLen
				) {
					url += (cnt > 0 ? '+' : '') + sub;
					cnt++;
				}
			});

			// Then add any subreddits we've loaded (esp. from multis) to the list.
			$.each(listr.feeds.subs, function(i, sub) {
				if (('+' + url + '+').indexOf('+' + sub + '+') == -1 && url.length + sub.length < maxLen) {
					url += (cnt > 0 ? '+' : '') + sub;
					cnt++;
				}
			});

			if (url == '') {
				alert('No reddit feeds found!  Search all of reddit for ' + query + '.');
				console.log('Search error: no reddit feeds found.', feeds);
			}
			else url = 'https://www.reddit.com/r/' + url;
		}
		else url = 'https://www.reddit.com';

		url += '/search.json?limit=100&sort=relevance&t=year&q=' + encodeURIComponent(query);
		if (cnt > 0) url += '&restrict_sr=on';

// console.log('search url: ' + url);
	    $.ajax({
			dataType: "json"
			, url: url
			, cache: true
			, error : function(err) { alert('reddit returned an error for that search.' + ENTER + ENTER + 'Try searching for something more specific.'); }
			, success: function(json) {
        		if (json.kind == "Listing" && json.data != undefined) {
					var results = [];

					$.each(json.data.children, function(idx, link) {
			            if (listr.opts['allowNSFW'] || !link.data.over_18) {
							var thumb = link.data.thumbnail;
							try { thumb = link.data.media.oembed.thumbnail_url; } catch(e) { }  // update w/ source thumbnail if available
			            	
							var descrip = '<br><b>posted to /r/' + link.data.subreddit + '</b>';
							try { descrip = link.data.media.oembed.description + '<br>' + descrip; } catch(e) { }

							var uploader_title = '';
							try { uploader_title = link.data.media.oembed.title; } catch(e) { }

							results.push({
								'url' : link.data.url
								, 'title' : link.data.title
								, 'uploader_title' : uploader_title
								, 'author' : link.data.author
								, 'related' : {'permalink' : link.data.permalink }
								, 'thumb' : thumb
								, 'descrip' : descrip

								, 'feed' : 'reddit'
								// , 'source' : 'reddit'
							});
			            }
					});

					callback(results);
				}
			}
		});
	}

	, seek : function(seekPct) { }

	, stop : function() { }
};

///////// http://ishare.rediff.com/ ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['rediff.com'] = {
	buckets : ['vids']
	, bgColor: 'black'

	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();
		if (link.url.indexOf('ishare.rediff.com/video/') == -1) return {};
		// http://ishare.rediff.com/video/entertainment/star-trek-tng-1x14-angel-one/2361485
		var props = {};
		props.kind = 'vid';
		props.source = 'rediff';

		props.id_source = link.url.substr(link.url.lastIndexOf('/') + 1).split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};

		props.id_uni = 'rdf|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-rediff"> </div>');
	}
	, load : function(link) {
		$('#media-rediff').html('<iframe src="http://ishare.rediff.com/video/embed/' + link.id_source + '"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-rediff').html('');
	}
};

///////// rt.com ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['rt.com'] = {
	buckets : ['vids']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();
		if (link.url.indexOf('rtd.rt.com') == -1 || link.url.indexOf('/films/') == -1) return {};

		// https://rtd.rt.com/films/the-invisible-women/
		var props = {};
		props.kind = 'vid';
		props.source = 'rt.com';
		props.id_source = link.url.split('/films/')[1].split('/')[0].split('?')[0].split('#')[0];
		props.id_uni = 'rtc|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-rtc"> </div>');
	}
	, load : function(link) {
		$('#media-rtc').html('<object type="application/x-shockwave-flash" data="https://rtd.rt.com/s/jwplayer/player.swf" width="100%" height="100%"><param name="menu" value="false"><param name="wmode" value="transparent"><param name="src" value="https://rtd.rt.com/s/jwplayer/player.swf"><param name="flashvars" value="playlistfile=https://rtd.rt.com/films/' + link.id_source + '/playlist.xml&repeat=list&skin=https://rtd.rt.com/s/skin/skin.zip&stretching=uniform&controlbar.position=over"><embed id="video_object" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" src="https://rtd.rt.com/s/jwplayer/player.swf" width="100%" height="100%" flashvars="playlistfile=https://rtd.rt.com/films/' + link.id_source + '/playlist.xml&repeat=list&skin=https://rtd.rt.com/s/skin/skin.zip&stretching=uniform&controlbar.position=over"></embed></object>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-rtc').html('');
	}
};


///////// sendvid.com ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['sendvid.com'] = {
	buckets : ['vids', 'music', 'nsfw', 'gaynsfw']
	, _ads : true
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'SendVids';

		// https://sendvid.com/<id>
		props.id_source = link.url.split('sendvid.com/')[1].split('/')[0].split('.')[0].split('?')[0].split('#')[0];
		props.id_uni = 'svd|' + props.id_source;
	
		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-sendvid"> </div>');
	}
	, load : function(link) {
		$('#media-sendvid').html('<iframe src="https://sendvid.com/embed/' + link.id_source + '" allowfullscreen></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-sendvid').html('');
	}
};


///////// streamable ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['streamable.com'] = {
	buckets : ['vids']
	, _ads : false
	, _pauses : true
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();
		// https://streamable.com/jwr1
		var props = {};
		props.kind = 'vid';
		props.source = 'Streamable';
		try { props.id_source = link.url.split('streamable.com/')[1].split('/')[0].split('?')[0].split('#')[0].split('.')[0]; }
		catch (e) { return {}; }
		if (props.id_source.length < 4 || props.id_source.length > 6) return {};

		props.id_uni = 'sbl|' + props.id_source;
		props.thumbnail = 'https://cdn.streamable.com/image/' + link.id_source;

// console.log('streamable', props.id_source, link);
		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-streamable"> </div>');
	}
	, load : function(link) {
		$('#media-streamable').html(
			'<video style="height:100%;max-width:100%;" poster="' + link.thumb + '" preload="" autoplay="" webkit-playsinline="" controls="" onerror="setTimeout(function() { listr.links.current.descrip=\'Not found on host.\';listr.links.current.active=false;listr.links.update(listr.links.current);listr.links.next();},500);"'
			+ ' onplay="if ($(\'span.btns a.resume\').css(\'display\') != \'hidden\') { $(\'span.btns a.resume\').hide(); $(\'span.btns a.pause\').show(); }"'
			+ ' onpause="if ($(\'span.btns a.pause\').css(\'display\') != \'hidden\') { $(\'span.btns a.pause\').hide(); $(\'span.btns a.resume\').show(); }"'
				+ (listr.bucket == 'media' || listr.bucket == 'music' || listr.bucket == 'vids' ? ' onended="listr.links.next();"' : ' loop=""')
			+ '>'
    			+ '<source src="https://cdn.streamable.com/video/mp4/' + link.id_source + '.mp4" type="video/mp4" class="mp4-source">'
			+ '</video>').show();
	}
	, msg : function(json) {}

	, pause : function(onOff) {
		if (onOff === undefined) var onOff = true;
		if (onOff) $('#media-streamable video').trigger('pause');
		else $('#media-streamable video').trigger('play');
	}

	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-streamable').html('');
	}
};

///////// soundcloud /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['soundcloud.com'] = {
	buckets : ['music']
	, bgColor: '#121211'	// rgb(242, 242, 242)

	, _ads : false
	, _pauses : true
	, _streams : true
	, _https : true

	, _player : false			// player (usually an object) for this source
	, _init : false				// has this source been initialized?
	, _loaded : false			// has API been loaded?
	, _events : 0
	, _progress : false

	, _playcheck : false 		// soundcloud-only hack to fix non-playing tracks

	, defaults : function(link) {
		if (!this._init) this.init();	// initialize source if not already done.

		var props = {};
		props.source = 'Soundcloud';
		if (link.url.split("/").length > 4 && link.url.indexOf('/sets/') == -1)
			props.kind = 'track';
		else props.kind = 'playlist';

		var str = link.url;
		if (str.indexOf('w.soundcloud.com/') != -1 && str.indexOf('?url=') != -1)
			str = str.split('?url=')[1].split('&')[0].split('%3F')[0];
		else if (str.indexOf('soundcloud.com/') != -1) 
			str = str.split('soundcloud.com/')[1].split('?')[0].split('#')[0];

		props.id_source = str;
		props.id_uni = "sc|" + props.id_source;

		return props;
	}

	, error : function(err) { }

	, init : function() {
		if (this._init) return;
		this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-soundcloud"> </div>');

		$.ajax({ 	// player API
			url: 'https://w.soundcloud.com/player/api.js', dataType: 'script', cache: true 
			, success: function() { listr.sources['soundcloud.com']._loaded = true; }
		});

		$.ajax({ 	// search/ data API
			url: 'https://connect.soundcloud.com/sdk.js', dataType: 'script', cache: true 
			, success: function() { SC.initialize({ client_id: '5585776362d6e8c7e18b41ef1e3315ff' }); }
		});
	}
	
	, load : function(link) {
		if (this._loaded) {
			if (link.url.indexOf('w.soundcloud.com/player') == -1)
				$('#media-soundcloud').html(
					'<iframe id="sc-widget" src="https://w.soundcloud.com/player/?visual=true&auto_play=true&url=' + link.url
					+ '" width="100%" height="97%" scrolling="no" frameborder="no"></iframe>'
				);
			else
				$('#media-soundcloud').html('<iframe id="sc-widget" src="' + link.url.replace('http:', 'https:') + '" width="100%" height="97%" scrolling="no" frameborder="no"></iframe>');
			
			$('#media-soundcloud').show();

			$('#sc-widget').load(function() {
				var scIdx = 0;
				var scLen = 0;
					
				// On ready, get # of tracks loaded.
				SC.Widget('sc-widget').bind(SC.Widget.Events.READY, function() { 
					setTimeout(function() {
						SC.Widget('sc-widget').getSounds(function(data) { scLen = data.length; });

						SC.Widget('sc-widget').getCurrentSound(function(data) {
							if (data == null || data.embeddable_by === undefined || data.embeddable_by == 'none') {
								link.active = false;
								link.descrip = "Not embeddable.";
								listr.links.update(link);

								listr.links.next();
							}
							else {
								link.uploader = data.user.username;

								if (data.artwork_url !== undefined && data.artwork_url !== null && data.artwork_url.indexOf('http') == 0) 
									link.thumb = data.artwork_url;
									
								link.meta.length = Math.round(data.duration / 1000);

								listr.links.update(link);

								// $('div.media div.opts div.progressBar').css({
								// 	'display': 'inline-block'
								// 	// ,'-webkit-mask-box-image': 'url(' + data.waveform_url + ')'
								// });

								$('div.media div.opts div.progressBar').show();
								$('#progress').width(0);

								// listr.sources["soundcloud.com"]._playcheck = true;
								listr.sources["soundcloud.com"]._progress = setInterval(function() {
									SC.Widget('sc-widget').getPosition(function(cur) {
	// 									if ($.isNumeric(cur)) {
	// 										if (listr.sources["soundcloud.com"]._playcheck) {
	// 											listr.sources["soundcloud.com"]._playcheck = false;

	// 											// track didn't start, jumpstart it
	// 											if (cur == 0) {
	// 												// SC.Widget('sc-widget').seekTo(1);
	// console.log('soundcloud kickstarted!');
	// 											}
	// 										}
	// 									}

										cur = Math.round(cur / 1000);	// ms to sec
										var dur = listr.links.current.meta.length;

										if ($.isNumeric(cur) && $.isNumeric(dur) && dur > 0) {
											var pct = cur / dur;
											// $('#progress').width(Math.round(pct * $('div.progressBar').width()));
											$('#progress').stop().animate({'width': Math.round(pct * $('div.progressBar').width())}, 999, 'linear');
											listr.broadcast({ 'action': 'progress', 'target': 'links', 'link': listr.links.current, 'pct': pct, 'cur': Math.round(cur).toMMSS() });
										}
									});
								}, 1000);

								$(window).resize();
							}
						});
					}, 999);
				});

				// On play, get index of current track.
				SC.Widget('sc-widget').bind(SC.Widget.Events.PLAY, function() { 
					SC.Widget('sc-widget').getCurrentSoundIndex(function(data) { scIdx = data; });

					if ($('span.btns a.resume').css('display') != 'hidden') {
						$('span.btns a.resume').hide();
						$('span.btns a.pause').show();
					}	
				});

				SC.Widget('sc-widget').bind(SC.Widget.Events.PAUSE, function() { 
					if ($('span.btns a.pause').css('display') != 'hidden') {
						$('span.btns a.pause').hide();
						$('span.btns a.resume').show();
					}
				});

				// On (track) finish, skip to the next link if it's the last one.
				SC.Widget('sc-widget').bind(SC.Widget.Events.FINISH, function() { 
					if (scIdx + 1 >= scLen) listr.links.next();
					else {
						SC.Widget('sc-widget').getCurrentSound(function(data) {
							link.meta.length = Math.round(data.duration / 1000);

							// $('div.media div.opts div.progressBar').css({
							// 	'display': 'inline-block'
							// 	,'-webkit-mask-box-image': 'url(' + data.waveform_url + ')'
							// });	
						});

						$('div.media div.opts div.progressBar').show();
						$('#progress').width(0);

						clearInterval(listr.sources["soundcloud.com"]._progress);
						listr.sources["soundcloud.com"]._progress = setInterval(function() {
							SC.Widget('sc-widget').getPosition(function(cur) {
								cur = Math.round(cur / 1000);	// ms to sec
								var dur = listr.links.current.meta.length;

								if ($.isNumeric(cur) && $.isNumeric(dur) && dur > 0) {
									var pct = cur / dur;
									// $('#progress').width(Math.round(pct * $('div.progressBar').width()));
									$('#progress').stop().animate({'width': Math.round(pct * $('div.progressBar').width())}, 999, 'linear');
									listr.broadcast({ 'action': 'progress', 'target': 'links', 'link': listr.links.current, 'pct': pct, 'cur': Math.round(cur).toMMSS() });
								}
							});
						}, 1000);
					}
				});
			});
		}
		else if (link.idx == listr.links.current.idx)
			setTimeout(function() { listr.sources['soundcloud.com'].load(link); }, 100);
	}

	, pause : function(onOff) {
		if (onOff === undefined) var onOff = true;
		if (onOff) SC.Widget('sc-widget').pause();
		else SC.Widget('sc-widget').play();
	}

	, search : function(query, callback) {
		// Make sure soundcloud is initialized before searching it.
		var initCheck = true;
		try { var SCcheck = SC; }
		catch (e) { initCheck = false; }

		if (initCheck) {
			SC.get('/tracks', { q: query, streamable: true }, function(tracks) {
				var results = [];
				$.each(tracks, function(i, entry) {
					if (entry != null)
						results.push({
							'url' : entry.permalink_url
							, 'title' :  entry.title
							, 'descrip' : (entry.description === null ? '' : entry.description.substr(0, 255) + (entry.description.length > 255 ? '&hellip;' : ''))
							, 'thumb' : (entry.artwork_url === null ? '' : entry.artwork_url)
							, 'feed' : 'soundcloud'
							, 'domain' : 'soundcloud.com'
							, 'source' : 'Soundcloud'
						});
				});

				callback(results);
			});
		}
		else { callback([]); return; }		// can't search if soundcloud API not intialized.
	}

	, seek : function(seekPct) {
		var dur = listr.links.current.meta.length;
		if ($.isNumeric(dur) && dur > 0) SC.Widget('sc-widget').seekTo(seekPct * dur * 1000);	// sec to ms
	}

	, stop : function() { 
		clearInterval(listr.sources["soundcloud.com"]._progress);
		$('#media-soundcloud').html(''); 
	}
};

///////// Triple J ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['triplejunearthed.com'] = {
	buckets : ['music']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		if (link.url.indexOf('/track/') == -1) return {};

// https://www.triplejunearthed.com/jukebox/track/4659256
// https://www.triplejunearthed.com/jukebox/play/track/4659256
		var props = {};
		props.kind = 'track';
		props.source = 'Triple J';
		props.id_source = link.url.split('/track/')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};
		props.id_uni = 'jjj|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-jjj"> </div>');
	}
	, load : function(link) {
// <iframe src="https://www.triplejunearthed.com/embed/4659256" scrolling="no" style="border: medium none; overflow: hidden; height: 160px; width: 455px;">triple j Unearthed Embedded Player</iframe>
		$('#media-jjj').html('<iframe src="https://www.triplejunearthed.com/embed/' + link.id_source + '"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-jjj').html('');
	}
};

///////// twitch.tv  ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['twitch.tv'] = {
	buckets : ['vids']
	// , bgColor: '#3E3E3E'
	, bgColor: 'black'

	, _ads : true
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.source = 'TwitchTV';
		props.id_source = link.url.split('.tv/')[1].split('?')[0].split('#')[0];
		props.id_uni = 'ttv|' + props.id_source;

		var slashCnt = link.url.split('/').length;
		if (slashCnt == 4) {
			props.kind = 'channel';
			props.related = {};
			props.related['chat'] = link.url + '/chat?popout=true';
		}
		// http://www.twitch.tv/clashtournaments/v/3851410
		else if (slashCnt == 6) props.kind = 'vid';
		else return {};	// reject non-channel, non-stream links

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;
		window.__flash__toXML = function() { return true; }
		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-twitchtv"></div>');
	}
	, load : function(link) {
		if (link.kind == 'channel') $('#media-twitchtv').html('<iframe src="' + link.url + '/embed?auto_play=true"></iframe>').show();
		else // direct vid stream, no chat.
			$('#media-twitchtv').html(
				'<object data="http://www.twitch.tv/swflibs/TwitchPlayer.swf" width="100%" height="100%" id="clip_embed_player_flash" type="application/x-shockwave-flash">'
					+ '<param name="movie" value="http://www.twitch.tv/swflibs/TwitchPlayer.swf" />'
					+ '<param name="allowScriptAccess" value="always" />'
					+ '<param name="allowNetworking" value="all" />'
					+ '<param name="allowFullScreen" value="true" />'
					+ '<param name="flashvars" value="channel=' + link.id_source.split('/')[0] + '&videoId=' + link.id_source.split('/')[1] + link.id_source.split('/')[2] + '&auto_play=true&start_volume=100" />'
				+ '</object>'
			).show();
	}

	, msg : function(json) {}

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { 
		$('#media-twitchtv').html('');
		$('#chat').remove();	// remove chat box and chat-added max-width
		$('div.container.media div.content div.media-dsp').css('max-width', '');
	}
};

///////// uploadica ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['uploadica.com'] = {
	buckets : ['pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'pic';
		props.source = 'Uploadica';

		if (link.url.indexOf('uploadica.com/images/') == -1 && link.url.indexOf('uploadica.com/?v=') != -1) 
		{
			// http://www.uploadica.com/?v=vaKA.jpg to http://www.uploadica.com/images/vaKA.jpg
			props.id_source = link.url.split('?v=')[1].split('&')[0].split('#')[0];
			props.url = 'http://www.uploadica.com/images/' + props.id_source;
		}
		else {
			props.id_source = links.url.split('/images/')[1].split('?')[0].split('#')[0];
			props.url = link.url.replace('https:', 'http:');	// no HTTPS on uploadica.
		}

		// reject link if not (translated) into direct image
		if (props.url.lastIndexOf('.') < props.url.lastIndexOf('/')) return {};

		props.id_uni = 'uca|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;
		if ($('#media-pic').length == 0)	// pic media holder is shared across all direct image links, like this comment.
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-pic"> </div>');
	}

	, load : function(link) { $('#media-pic').html('<img src="' + link.url + '">').show(); }

	, msg : function(json) {}	// no msgs w/ direct images

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-pic').html(''); }
};

///////// vidble    /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['vidble.com'] = {
	buckets : ['pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : true
	, _player : false

	, defaults : function(link) {
	if (!this._init) this.init();

	var props = {};
		props.url = link.url.replace('http:', 'https:');
		props.kind = 'pic';
		props.id_source = false;

		if (props.url.indexOf('/album/') != -1) {
			props.kind = 'album';
			props.id_source = 'album:' + props.url.split('/album/')[1].split('/')[0].split('?')[0];

		}
		else if (link.ext == '') {	// http://vidble.com/show/ZlRiViQFTB -> http://vidble.com/ZlRiViQFTB.jpg
			if (props.url.indexOf('vidble.com/show/') != -1) {
				props.url = props.url.replace('/show/', '/') + '.jpg';	// Could be wrong ext?
				props.ext = 'jpg';
			}
			else return {};
			
		}
		else if (props.url.indexOf('vidble.com/explore/') != -1) props.url = props.url.replace('/explore/', '/');

		if (!props.id_source) props.id_source = props.url.split('.com/')[1].split('/')[0].split('?')[0];
		props.source = 'Vidble';
		props.id_uni = 'vbl|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-pic').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-pic"> </div>');

		// imgur also gets its own media holder for albums
		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-vidble"> </div>');
	}

	, load : function(link) {
		if (link.kind == 'pic') $('#media-pic').html('<img src="' + link.url + '">').show();
		else $('#media-vidble').html('<iframe src="' + link.url + '"></iframe>').show();
	}

	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() { $('#media-pic,#media-vidble').html(''); }
};

///////// vimeo      /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['vimeo.com'] = {
	buckets : ['music', 'vids', 'nsfw', 'gaynsfw']
	, bgColor: 'black'

	, _ads : false
	, _pauses : true
	, _streams : true
	, _https : true

	, _events : 0				// tracks number of AJAX calls to stagger calls
	, _init : false				// has this source been initialized?
	, _loaded : false			// has player object/ api/ javascript/ whatever been loaded?
	, _player : false			// player (usually an object) for this source
	, _progress : false

	, defaults : function(link) {
		if (listr.opts.hidden) return {};		// vimeo won't autostart when hidden

		if (!this._init) this.init();

		var props = {};
		props.meta = link.meta;
		props.kind = 'vid';
		props.source = 'Vimeo';

		props.id_source = link.url.split('?')[0];
		props.id_source = props.id_source.substr(props.id_source.lastIndexOf('/') + 1);
		if (!$.isNumeric(props.id_source)) return {};	// if we can't find a numeric vid ID, reject the link

		props.id_uni = "vmo|" + props.id_source;

		setTimeout(function() {
			$.getJSON('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(link.url), function(json) {
				listr.sources["vimeo.com"]._events--;

				link.descrip = json.description;
				link.thumb = json.thumbnail_url;
				link.meta.length = json.duration;

				link.uploader_title = json.title;
				if (
					link.title.isBadTitle()
					|| (listr.bucket == 'music' && link.meta.artist == '')
				) link.title = json.title;

				// Bucket-specific tweaks to metadata.
				if (listr.bucket == 'music') {
					var meta = link.uploader_title.parseMeta();
					if (link.meta.artist == '' && meta.artist != '') {
						link.meta.artist = meta.artist;
						if (meta.track != '') link.meta.track = meta.track;
					}
					if (link.meta.genre == '' && meta.genre != '') link.meta.genre = meta.genre;
					if (link.meta.year == '' && meta.year != '') link.meta.year = meta.year;
				}

				listr.links.update(link);
			}); 
		}, ++this._events * listr.opts.ajaxDelay);

		return props;
	}
	
	, error : function(err) { }

	, init : function() {
		if (this._init) return;
		this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-vimeo"> </div>');
	}

	, load : function(link) {

		$("#media-vimeo").html('<iframe id="vimeo-iframe" src="https://player.vimeo.com/video/' + link.id_source + '?api=1&player_id=vimeo-iframe&autoplay=true" width="100%" height="100%" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>').show();
		listr.sources['vimeo.com']._player = $('#vimeo-iframe')[0];

		if (window.addEventListener) window.addEventListener('message', listr.sources['vimeo.com'].msg, false);
	    else window.attachEvent('onmessage', listr.sources['vimeo.com'].msg, false);

		// $('div.media div.opts div.progressBar').css({
		// 	'display': 'inline-block'
		// 	// ,'-webkit-mask-box-image': 'url(/img/waveform.png)'
		// });

		$('div.media div.opts div.progressBar').show();
		$('#progress').width(0);

		listr.sources["vimeo.com"]._progress = setInterval(function() {
	        listr.sources['vimeo.com']._player.contentWindow.postMessage(
	        	{'method' : 'getCurrentTime'}
	        	, $('#vimeo-iframe').attr('src').split('?')[0]
	        );
		}, 1000);
	}

	, msg : function(json) {
		if (json.data === undefined || json.origin === undefined || json.origin.indexOf('vimeo.com') == -1)
			return;	// do nothing if not from vimeo.


		var msg = $.parseJSON(json.data);
// console.log(msg);
		if (msg.method !== undefined) {
			if (msg.method = 'getCurrentTime') {
				var cur = Math.round(msg.value);
				var dur = listr.links.current.meta.length;

				if ($.isNumeric(cur) && $.isNumeric(dur) && dur > 0) {
					var pct = cur / dur;
					// $('#progress').width(Math.round(pct * $('div.progressBar').width()));
					$('#progress').stop().animate({'width': Math.round(pct * $('div.progressBar').width())}, 999, 'linear');
					listr.broadcast({ 'action': 'progress', 'target': 'links', 'link': listr.links.current, 'pct': pct, 'cur': Math.round(cur).toMMSS() });
				}
			}
		}
		else if (msg.event !== undefined) {
			if (msg.event == 'ready') {		// on ready msg, add listener for finish event too.
		        listr.sources['vimeo.com'].post('addEventListener', 'finish');
		        listr.sources['vimeo.com'].post('addEventListener', 'pause');
		        listr.sources['vimeo.com'].post('addEventListener', 'play');
			}

			if (msg.event == 'pause' && $('span.btns a.pause').css('display') != 'hidden') {
				$('span.btns a.pause').hide();
				$('span.btns a.resume').show();
			}
			else if (msg.event == 'play' && $('span.btns a.resume').css('display') != 'hidden') {
				$('span.btns a.resume').hide();
				$('span.btns a.pause').show();
			}
			else if (msg.event == 'finish') listr.links.next();
		}
	}

	, post : function(action, value) {
        var data = { method : action };	        
        if (value) data.value = value;
        
        listr.sources['vimeo.com']._player.contentWindow.postMessage(
        	data
        	, $('#vimeo-iframe').attr('src').split('?')[0]
        );
    }

	, pause : function(onOff) {
		if (onOff) listr.sources['vimeo.com'].post('pause');
		else listr.sources['vimeo.com'].post('play');
	}

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) {
        listr.sources['vimeo.com']._player.contentWindow.postMessage(
        	{'method' : 'seekTo', 'value': listr.links.current.meta.length * seekPct }
        	, $('#vimeo-iframe').attr('src').split('?')[0]
        );
	}

	, stop : function() {
		$("#media-vimeo").html('');

		// remove window listeners
		if (window.addEventListener) window.removeEventListener('message', listr.sources['vimeo.com'].msg);
	    else window.detachEvent('onmessage', listr.sources['vimeo.com'].msg, false);

	    clearInterval(listr.sources['vimeo.com']._progress);
	}
};

///////// xboxdvr.com     /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['xboxdvr.com'] = {
	buckets : ['vids']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();
		// http://xboxdvr.com/gamer/RandomGamer67/video/3295949
		if (link.url.indexOf('/video/') == -1) return {};

		var props = {};
		props.url = link.url;
		if (props.url.substr(-1) == '/') props.url = props.url.substr(0, props.url.length - 1);

		props.kind = 'vid';
		props.source = 'Xbox DVR';
		props.id_source = link.url.split('/video/')[1].split('/')[0].split('?')[0];
		props.id_uni = 'xdr|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-xboxdvr"> </div>');
	}
	, load : function(link) {
		$('#media-xboxdvr').html('<iframe src="' + link.url + '/embed"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-xboxdvr').html('');
	}
};
      
///////// vine.co     /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['vine.co'] = {
	buckets : ['vids']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		if (link.url.indexOf('/v/') == -1) return {};

		// https://vine.co/v/MlvJzmeQwpv
		var props = {};
		props.kind = 'vine';
		props.source = 'vine.co';
		props.id_source = link.url.split('/v/')[1].split('/')[0].split('?')[0];
		props.id_uni = 'vne|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-vine" </div>');
	}
	, load : function(link) {
		// <iframe src="https://vine.co/v/MlvJzmeQwpv/embed/postcard?audio=1" width="600" height="600" frameborder="0"></iframe><script src="https://platform.vine.co/static/scripts/embed.js"></script>
		$('#media-vine').html(
			'<iframe src="https://vine.co/v/' + link.id_source + '/embed/postcard?audio=1"></iframe>'
		).show();

		$('<script>')
			.attr('type', 'text/javascript')
			.attr('src', 'https://platform.vine.co/static/scripts/embed.js')
			.appendTo('#media-vine')
		;
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-vine').html('');
	}
};

///////// webm   ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['webm'] = {
	buckets : ['vids', 'music', 'pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, _ads : false 				
	, _pauses : true
	, _streams : true
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true			
	, _player : false			// no player for direct images

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'webm';
		props.source = 'Direct';
		props.id_uni = 'wbm|' + link.domain + '|' + link.url.split('/')[3].split('?')[0];

		// http://pornwebms.com/webm/1463357729805%20painal.webm
		// http://pornwebms.com/video/1463357729805%20painal.webm
		if (link.url.indexOf('pornwebms.com/webm') != -1) {
			props.url = link.url.replace('pornwebms.com/webm/', 'pornwebms.com/video/');
			props.id_uni = 'pwm|' + props.url.split('/video/')[1].split('.')[0];
		}

		return props;
	}
	, error : function(err) {}	// no errors w/ direct images

	, init : function() {
		if (this._init) return; this._init = true;
		if ($('#media-embed').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-embed"> </div>');
	}


	, load : function(link) { 
		$('#media-embed').html(
			'<video style="height:100%;max-width:100%;" preload="" autoplay="" poster="' + link.thumb + '" webkit-playsinline="" controls="" onerror="setTimeout(function() { listr.links.current.descrip=\'Not found on host.\';listr.links.current.active=false;listr.links.update(listr.links.current);listr.links.next();},500);"'
			+ ' onplay="if ($(\'span.btns a.resume\').css(\'display\') != \'hidden\') { $(\'span.btns a.resume\').hide(); $(\'span.btns a.pause\').show(); }"'
			+ ' onpause="if ($(\'span.btns a.pause\').css(\'display\') != \'hidden\') { $(\'span.btns a.pause\').hide(); $(\'span.btns a.resume\').show(); }"'
				+ (listr.bucket == 'media' || listr.bucket == 'music' || listr.bucket == 'vids' ? ' onended="listr.links.next();"' : ' loop=""')
			+ '>'
				+ '<source src="' + link.url + '" type="video/webm">'
			+ '</video>'
		).show();
	}

	, msg : function(json) {}	// no msgs w/ direct images

	, pause : function(onOff) {
		if (onOff === undefined) var onOff = true;
		if (onOff) $('#media-embed video').trigger('pause');
		else $('#media-embed video').trigger('play');
	}

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-embed').html(''); }
};


///////// webm.land    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['webm.land'] = $.extend({}, listr.sources['webm']);

listr.sources['webm.land'].defaults = function(link) {
	if (!this._init) this.init();

// http://webm.land/media/28VL.webm
// http://webm.land/w/FsAN/
	if (link.url.indexOf('/media/') == -1 && link.url.indexOf('/w/') == -1) return {};	// reject unrecognized URLs

	var props = {};
	props.kind = 'webm';
	props.source = 'WebM.land';
	props.id_source = link.url.split('webm.land/')[1].split('/')[1].split('.')[0].split('?')[0].split('#')[0];
	props.id_uni = 'wbm|' + props.id_source;
	props.url = 'http://webm.land/media/' + props.id_source + '.webm';
	props.thumb = 'http://webm.land/media/thumbnails/' + props.id_source + '.jpeg';

	return props;
}

///////// webm.land    ///////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['webmshare.com'] = $.extend({}, listr.sources['webm']);

listr.sources['webmshare.com'].defaults = function(link) {
	if (!this._init) this.init();

// http://webmshare.com/play/YL1Ea
// http://s1.webmshare.com/YL1Ea.webm
	// if (link.url.indexOf('/play/') == -1 && link.url.indexOf('.webm') == -1) return {};	// reject unrecognized URLs

	var props = {};
	props.kind = 'webm';
	props.source = 'WebM.land';
	props.id_source = link.url.split('webmshare.com/')[1].split('?')[0].split('#')[0].replace('play/', '').replace('.webm', '').split('/')[0];
	props.id_uni = 'wbm|' + props.id_source;
	if (link.url.indexOf('.webm') == -1) props.url = 'http://s1.webmshare.com/' + props.id_source + '.webm';
	// props.thumb = 'http://webm.land/media/thumbnails/' + props.id_source + '.jpeg';

	return props;
}

// listr.youtubeTimer = false;
///////// youtube    /////////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['youtube.com'] = {
	buckets : ["vids", "music", "nsfw", "gaynsfw"]
	, bgColor: 'black'

	, _ads : false
	, _pauses : true
	, _streams : true
	, _https : true

	, _events : 0
	, _init : false			
	, _loaded : false
	, _player : false
	, _progress : false
	
	// Called from links.push() when a new link from this source is added.  
	// Returns an object of default values for links from this source.
	, defaults : function(link) {		
		if (!this._init) this.init();	// initialize source if not already done.

		var props = {};
		props.meta = link.meta;
		props.source = 'Youtube';
		props.url = link.url
			.replace('youtu.be/', 'youtube.com/watch?v=')
			.replace('youtube.com/embed/', 'youtube.com/watch?v=')
			.replace('watch%3Fv%3D', 'watch?v=')
			.replace('/list/', '/playlist?list=')
		;

		if (props.url.indexOf('list=') != -1) props.explodable = 'youtube-playlist';

		//// youtube vid     	///////////////////////////////////////////////////
		if (props.url.indexOf('youtube.com/watch') != -1 && props.url.indexOf('v=') != -1)
		{
			props.kind = 'vid';
			props.id_source = props.url.split('v=')[1].split('?')[0].split('&')[0].split('#')[0];
			props.id_uni = "ytv|" + props.id_source;
			props.meta.start = link.url.parseYoutubeTime();

			if (link._defaults === undefined) return props;	// Don't do lookups below if it's just a search result or related link.
			else {
			// if (link.meta._loaded === undefined) {
				// props.meta._loaded = true;

				//// Ask youtube about this vid. //////////////
				setTimeout(function() {
				    $.ajax({
				      dataType: "json"
				      , url: 													// youtube API v3
				      	'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails'
				      	+ '&key=AIzaSyCZwSZBG0DReBq7-EZT_EWRQbLe7v_yL1o'
						+ '&id=' + encodeURIComponent(props.id_source)

					    , success: function(json) {
					    	listr.sources["youtube.com"]._events--;

							if (json.items !== undefined && json.items.length > 0) {
								var vid = json.items[0].snippet;
								// console.log('youtube vid', vid);

								// Update link description (if not populated)
								if (link.descrip == '') link.descrip = vid.description;

								// Update video length. Not in snippets.  Format like: PT15M51S  (https://developers.google.com/youtube/v3/docs/videos#contentDetails)
								link.meta.length = json.items[0].contentDetails.duration.toMMSS();

								// Removed: too many dead images from restricted videos.
								// Update thumbnail.
								if (link.thumb.indexOf('http') != 0) {
									if (vid.thumbnails.high !== undefined) link.thumb = vid.thumbnails.high.url;
									else if (vid.thumbnails.medium !== undefined) link.thumb = vid.thumbnails.medium.url;
									else if (vid.thumbnails.standard !== undefined) link.thumb = vid.thumbnails.standard.url;
								}

								// Copy title from youtube.
								link.uploader_title = vid.title;
								if (
									link.title.isBadTitle()
									|| (listr.bucket == 'music' && link.meta.artist == '')
								) link.title = vid.title;

								// Bucket-specific tweaks to metadata.
								if (listr.bucket == 'music') {
									var meta = link.uploader_title.parseMeta();
									if (link.meta.artist == '' && meta.artist != '') {
										link.meta.artist = meta.artist;
										if (meta.track != '') link.meta.track = meta.track;
									}
									if (link.meta.genre == '' && meta.genre != '') link.meta.genre = meta.genre;
									if (link.meta.year == '' && meta.year != '') link.meta.year = meta.year;
								}

								listr.links.update(link);
							}
						}
					});
				}, ++this._events * listr.opts.ajaxDelay);
			}
		}


		//// youtube playlist 	///////////////////////////////////////////////////
		else if (props.url.indexOf('list=') > -1 || props.url.indexOf('/channel/') != -1)
		{
			props.kind = 'playlist';

			if (props.url.indexOf('/channel/') != -1) {
				props.id_source = props.url.split('/channel/')[1].split('/')[0].split('?')[0].split('#')[0].replace('UC', 'UU');
				props.id_uni = "ytc|" + props.id_source;
			}
			else {
				props.id_source = props.url.split('list=')[1].split('&')[0].split('#')[0];
				if (
					props.id_source.substr(0, 2) != 'PL'
					&& props.id_source.substr(0, 2) != 'LL'	// user liked playlists
				) props.id_source = 'PL' + props.id_source;
				props.id_uni = "ytp|" + props.id_source;
			}

			if (link._defaults === undefined) return props;	// Don't do lookups below if it's just a search result or related link.
			else {
			// if (link.meta._loaded === undefined) {
				//// Ask youtube about this playlist. //////////////
				// props.meta._loaded = true;

				setTimeout(function() {
				    $.ajax({
				      dataType: "json"
				      , url: 													// youtube API v3
				      	'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails'
				      	+ '&key=AIzaSyCZwSZBG0DReBq7-EZT_EWRQbLe7v_yL1o'
						+ '&id=' + encodeURIComponent(props.id_source)

					    , success: function(json) {
					    	listr.sources["youtube.com"]._events--;

							if (json.items !== undefined && json.items.length > 0) {
								if (
									link.title.isBadTitle()
									|| (listr.bucket == 'music' && link.meta.artist == '')
								) link.title = json.items[0].snippet.title;

								if (json.items[0].contentDetails.itemCount == 0) {
									listr.links.current.descrip = "No vids found in playlist.";
									listr.links.current.active = false;
								}
								else {
									link.descrip = json.items[0].snippet.description;
									link.meta.length = json.items[0].contentDetails.itemCount + ' vids';
								}

								listr.links.update(link);
							}
					    }
					});
				}, ++this._events * listr.opts.ajaxDelay);
			}
		}

		//// youtube user 	///////////////////////////////////////////////////
		else if (props.url.indexOf('/user/') > -1)
		{			// https://www.youtube.com/user/LastWeekTonight/channels
			props.kind = 'user';
			props.id_source = props.url.split('/user/')[1].split('/')[0].split('?')[0];
			props.id_uni = "ytu|" + props.id_source;

			if (link._defaults === undefined) return props;	// Don't do lookups below if it's just a search result or related link.
			else {
			// if (link.meta._loaded === undefined) {
				//// Get user's "uploaded vids" playlist. //////////////
				// props.meta._loaded = true;

				setTimeout(function() {
				    $.ajax({
				      dataType: "json"
				      , url: 													// youtube API v3
				      	'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails'
				      	+ '&key=AIzaSyCZwSZBG0DReBq7-EZT_EWRQbLe7v_yL1o'
						+ '&forUsername=' + encodeURIComponent(props.id_source)

					    , success: function(json) {
					    	listr.sources["youtube.com"]._events--;

							if (json.items !== undefined && json.items.length > 0) {
								var first = json.items[0];

								if (
									link.title.isBadTitle()
									|| (listr.bucket == 'music' && link.meta.artist == '')
								) link.title = first.snippet.title;

								link.descrip = first.snippet.description;

								link.id_source = first.contentDetails.relatedPlaylists.uploads;
								link.url = 'https://youtube.com/playlist?list=' + link.id_source;
								link.kind = 'playlist';

								listr.links.update(link);
							}
					    }
					});
				}, ++this._events * listr.opts.ajaxDelay);
			}
		}

		return props;
	}

	, explode : function(url) {
		if ($('table thead th.sorting_desc').length > 0 || $('table thead th.sorting_asc').not('th.pos').length > 0) $('th.pos').click();

		listr.links.stash();

		var wuz = listr.opts['clearOnLoad'];
		listr.opts['clearOnLoad'] = false;

		var startLen = listr.links.list.length;
		listr.feeds['youtube-playlist'].load(url, function() {
			listr.links.restore();
			listr.links.update();
		});

		listr.opts['clearOnLoad'] = wuz;
	}

	, error : function(err) {
		var msg = '';

		if (err.data == 0) msg = 'Could not connect.';
		else if (err.data == 2) msg = 'Invalid parameters.';
		else if (err.data == 100) msg = 'Video deleted.';
		else if (err.data == 101 || err.data == 105) msg = 'Not embeddable.';
		else if (err.data == 150) msg = 'Restricted in your region.';	// err.data == 0 || 
		// else if (err.data == 5) { }	// HTML5 error.  Do nothing, it'll revert to the Flash player.

		if (err.data != 0 && err.data != 5)
		{
			if (msg == '') console.log('unknown youtube error', err);

			// dead video autoreplace
			if (listr.opts['replaceYoutube'] && listr.links.current.kind == 'vid' && listr.bucket == 'music')
			{
				var query = listr.links.current.title;
				if (listr.bucket == 'music') query = listr.links.current.meta.artist + ' ' + listr.links.current.meta.track;
				query = query.toLowerCase().replace(/\W+/g, ' ').replace(/\//g, ' ').replace(/-/g, ' ').replace(' featuring ', ' ').replace(' feat. ', ' ').replace(' ft. ', ' ').replace(' ft ', ' ').replace(' with ', ' ').replace(' w/ ', ' ').replace(' and ', ' ').replace('&', ' ').replace('!', ' ');

				var splitTit = query.replace(/  /g, ' ').split(' ');
				query = '';
				$.each(splitTit, function(i, val) { if (!$.isNumeric(val)) query += (i > 0 ? ' ' : '') + val; });
 // console.log('find new: ' + query);

			    $.ajax({
			      dataType: "json"
			      , url: 													// youtube API v3
			      	'https://www.googleapis.com/youtube/v3/search?part=snippet'
			      	+ '&maxResults=50&order=relevance&safeSearch=none&type=video'
  				    + '&videoSyndicated=true&videoEmbeddable=true'
			      	+ '&key=AIzaSyCZwSZBG0DReBq7-EZT_EWRQbLe7v_yL1o'
					+ '&q=' + encodeURIComponent(query)
					+ (listr.bucket == 'music' ? '&videoCategoryId=10' : '')
/*
  {
   "kind": "youtube#videoCategory",
   "etag": "\"DsOZ7qVJA4mxdTxZeNzis6uE6ck/nqRIq97-xe5XRZTxbknKFVe5Lmg\"",
   "id": "10",
   "snippet": {
    "channelId": "UCBR8-60-B28hp2BmDPdntcQ",
    "title": "Music",
    "assignable": true
   }
  },
*/
					, error : function(err) { 
						listr.links.current.descrip = "Video could not be found or replaced.";
						listr.links.current.active = false;
						listr.links.update(listr.links.current);

						listr.links.next();
					}

			      	, success: function(json) {
 // console.log('replace', json);
						if (json.items !== undefined && json.items.length > 0) {
							var splitQuery = query.replace(/  /g, ' ').split(' ');

							var prollyLive = false;
							if (
								query.indexOf('live') != -1 
								|| query.indexOf('concert') != -1
								// || query.indexOf(' 19') != -1
								|| query.indexOf(' 1') != -1
								|| query.indexOf(' 0') != -1
								|| query.indexOf(' 20') != -1
								|| query.indexOf('at the') != -1
								|| query.indexOf('perform') != -1
								|| query.indexOf('preform') != -1
								|| query.indexOf('sings') != -1
							) prollyLive = true;

							var prollyRemix = false;
							if (query.indexOf('remix') != -1 || query.indexOf('cover') != -1 || query.indexOf('demo') != -1) prollyRemix = true;

							var prollyAlbum = false;
							if (
								query.indexOf('full ') != -1
								|| query.indexOf('album') != -1
								|| query.indexOf('concert') != -1
								|| query.indexOf('soundcheck') != -1
							) prollyAlbum = true;

							// var minScore = Math.round(splitQuery.length * 1.5); // + Math.ceil(splitQuery.length / 2); // Math.floor(splitQuery.length / 2) + 1;
							// if (minScore < 20) minScore = 20;
							var minScore = splitQuery.length + 2;

							var results = [];
							var highScore = -1;
							var highIdx = -1;

							var artist = false;
							var track = false;
							if (listr.bucket == 'music') {
								artist = $.trim(listr.links.current.meta.artist.toLowerCase().replace(/\W+/g, " "));
								track = $.trim(listr.links.current.meta.track.toLowerCase().replace(/\W+/g, " "));
							}

							$.each(json.items, function(i, entry) {
								var score = 0;

								var data = entry.snippet;
								var tit = $.trim(data.title.toLowerCase().replace(/\W+/g, ' ').replace(/\//g, ' ').replace(/-/g, ' ').replace('featuring ', ' ').replace(' feat ', ' ').replace(' ft. ', ' ').replace(' ft ', ' ').replace(' with ', ' ').replace(' w ', ' ').replace(' and ', ' ').replace('the ', ' ').replace(/  /g, ' '));
								var desc = $.trim(data.description.toLowerCase().replace(/\W+/g, ' ').replace(/\//g, ' ').replace(/-/g, ' ').replace('featuring ', ' ').replace(' feat ', ' ').replace(' ft. ', ' ').replace(' ft ', ' ').replace(' with ', ' ').replace(' w ', ' ').replace(' and ', ' ').replace('the ', ' ').replace(/  /g, ' '));
								var splitTit = tit.split(' ');

								if (	// try to eliminate all karaoke vids
									tit.indexOf('you sing') != -1 || tit.indexOf('karaoke') != -1 || tit.indexOf('kareoke') != -1 || tit.indexOf('singalong') != -1 || tit.indexOf('no vocal') != -1 || tit.indexOf('virtual') != -1 || tit.indexOf('how to') != -1 || tit.indexOf('drumming') != -1 || tit.indexOf('s only') != -1
									|| desc.indexOf('you sing') != -1 || desc.indexOf('karaoke') != -1 || desc.indexOf('kareoke') != -1 || desc.indexOf('singalong') != -1 || desc.indexOf('no vocal') != -1 || desc.indexOf('virtual') != -1 || desc.indexOf('how to') != -1 || desc.indexOf('drumming') != -1 || desc.indexOf('s only') != -1
								) score-=3;

								if (prollyLive) {
									if (
										tit.indexOf('live') != -1 || tit.indexOf('concert') != -1 || tit.indexOf(' 0') != -1 || tit.indexOf(' 1') != -1 || tit.indexOf(' 2') != -1 || tit.indexOf('at the') != -1 || tit.indexOf('on the') != -1 || tit.indexOf('perform') != -1 || tit.indexOf('preform') != -1 || tit.indexOf('sings') != -1
										|| desc.indexOf('live') != -1 || desc.indexOf('concert') != -1 || desc.indexOf(' 0') != -1 || desc.indexOf(' 1') != -1 || desc.indexOf(' 2') != -1 || desc.indexOf('at the') != -1 || desc.indexOf('on the') != -1 || desc.indexOf('perform') != -1 || desc.indexOf('preform') != -1 || desc.indexOf('sings') != -1
									) score++; else score--;
								}
								else {
									if (
										tit.indexOf('live') == -1 && tit.indexOf('concert') == -1 && tit.indexOf(' 0') == -1 && tit.indexOf(' 1') == -1 && tit.indexOf(' 2') == -1 && tit.indexOf('at the') == -1 && tit.indexOf('perform') == -1 && tit.indexOf('preform') == -1 && tit.indexOf('sings') == -1
										&& desc.indexOf('live') == -1 && desc.indexOf('concert') == -1 && desc.indexOf(' 0') == -1 && desc.indexOf(' 1') == -1 && desc.indexOf(' 2') == -1 && desc.indexOf('at the') == -1 && desc.indexOf('perform') == -1 && desc.indexOf('preform') == -1 && desc.indexOf('sings') == -1
									) score++; else score -= 3;
								}

								if (prollyRemix) {
									if (
										tit.indexOf('remix') != -1 || tit.indexOf('cover') != -1 || tit.indexOf('demo') != -1
										|| desc.indexOf('remix') != -1 || desc.indexOf('cover') != -1 || desc.indexOf('demo') != -1
									) score++; else score--;
								}
								else {
									if (
										tit.indexOf('remix') == -1 && tit.indexOf('cover') == -1 && tit.indexOf('demo') == -1
										&& desc.indexOf('remix') == -1 && desc.indexOf('cover') == -1 && desc.indexOf('demo') == -1
									) score++; else score--;
								}

								if (prollyAlbum) {
									if (
										tit.indexOf('full ') != -1
										|| tit.indexOf('album') != -1
										|| tit.indexOf('concert') != -1
										|| tit.indexOf('soundcheck') != -1
										|| desc.indexOf('full ') != -1
										|| desc.indexOf('album') != -1
										|| desc.indexOf('concert') != -1
										|| desc.indexOf('soundcheck') != -1
									)  score++; else score--;
								}
								else {
									if (
										tit.indexOf('full ') == -1
										&& tit.indexOf('album') == -1
										&& tit.indexOf('concert') == -1
										&& tit.indexOf('soundcheck') == -1

										&& desc.indexOf('full ') == -1
										&& desc.indexOf('album') == -1
										&& desc.indexOf('concert') == -1
										&& desc.indexOf('soundcheck') == -1
									)  score++; else score--;
								}

								if (listr.bucket == 'music') {
									if (tit.indexOf(artist) == -1 && desc.indexOf(artist) == -1) score -= 10;
									if (tit.indexOf(track) == -1 && desc.indexOf(track) == -1 ) score -= 10;
								}

								$.each(splitTit, function(i, tVal) { 
									$.each(splitQuery, function(i, qVal) { 
										if (tVal == qVal) score++;
									});
								});

								if (splitTit.length > splitQuery.length) score -= (splitTit.length - splitQuery.length);

								if (score > highScore) {
									highScore = score;
									highIdx = i;
								}
							});

 // console.log('minScore: ' + minScore);
 // console.log('highScore: ' + highScore);
 // console.log('Winner:', json.items[highIdx]);

							if (highScore > minScore && json.items[highIdx] !== undefined) {
								var weiner = json.items[highIdx];

								listr.links.current.descrip = 'The original link could not be found.  This link was automatically replaced with the best match.';

								listr.links.current.id_source = weiner.id.videoId;
								listr.links.current.url = 'https://youtube.com/watch?v=' + weiner.id.videoId;

								listr.links.current.title += ' *';
								if (listr.bucket == 'music') listr.links.current.meta.track  += ' *';

								try { listr.links.current.thumb = weiner.snippet.thumbnails.high.url; }
								catch(e) { listr.links.current.thumb = weiner.snippet.thumbnails.default.url; }

								listr.links.update(listr.links.current);

								listr.links.load(listr.links.current);
							}
							else {
								listr.links.current.descrip = "Video could not be found or replaced.";
								listr.links.current.active = false;
								listr.links.update(listr.links.current);

								listr.links.next();
							}
						}
						else {
							listr.links.current.descrip = "Youtube error: " + msg;
							listr.links.current.active = false;
							listr.links.update(listr.links.current);

							listr.links.next();
						}
					}
				});
			}
			else {
				listr.links.current.descrip = "Youtube error: " + msg;
				listr.links.current.active = false;
				listr.links.update(listr.links.current);

				listr.links.next();
			}
		}
	}

	, init : function() {
		if (this._init) return;
		this._init = true;

		if ($('#media-youtube').length == 0) {		// make sure we don't init() twice via youtu.be
			var size = window.size();
			$('<script>')
				.attr('type', 'text/javascript')
				.text(
						'function onYouTubeIframeAPIReady() {'
					+		'listr.sources["youtube.com"]._player = new YT.Player("media-youtube", {'
					+			'height: ' + (size.height - 65)
					+			',width: ' + size.width
					+			',playerVars: { '
					+ 				'"autoplay": 1, "modestbranding": 1, "rel": 0, "showinfo": 1, "playsinline": 1, "cc_load_policy": 0, "iv_load_policy": 3, "controls": 2, "color": "white", "html5": 1, "disablekb": 1, "autohide": 1'
					+			'}'
					+		  ',events: {'
					+			'"onError": listr.sources["youtube.com"].error'
					+			',"onReady": function() {'
					+ 				' listr.sources["youtube.com"]._player.addEventListener("onStateChange", listr.sources["youtube.com"].msg);'
					+ 				' listr.sources["youtube.com"]._player.setVolume(100); '
					+ 				' listr.sources["youtube.com"]._loaded = true;'
					+			'}'
					+		  '}'
					+		'});'
					+	'}'
				)
				.appendTo('body')
			;

			$('div.container.media div.content').append(
				'<div id="media-youtube" class="media-dsp hidden hide-on-load"><span><br><br><br><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;youtube loading..</span></div>'
			);

			window.adModuleLoaded = true;
			$.ajax({ url: '//www.youtube.com/iframe_api', dataType: 'script', cache: true });
		}
	}
	
	, load : function(link) {
		if (this._loaded) {
			if (link.kind == 'vid') this._player.loadVideoById(link.id_source, link.meta.start);
			else if (link.kind == 'playlist') this._player.loadPlaylist({'list' : link.id_source, 'listType': 'playlist'});

			$("#media-youtube").show();

			// $('div.media div.opts div.progressBar').css({
			// 	'display': 'inline-block'
			// 	// ,'-webkit-mask-box-image': 'url(/img/waveform.png)'
			// });

			$('div.media div.opts div.progressBar').show();
			$('#progress').width(0);

			listr.sources["youtube.com"]._progress = setInterval(function() {
				var player = listr.sources['youtube.com']._player;
				var cur = player.getCurrentTime();
				var dur = player.getDuration();

				if ($.isNumeric(cur) && $.isNumeric(dur) && dur > 0) {
					var pct = cur / dur;
					// $('#progress').width(Math.round(pct * $('div.progressBar').width()));
					$('#progress').stop().animate({'width': Math.round(pct * $('div.progressBar').width())}, 999, 'linear');
					listr.broadcast({ 'action': 'progress', 'target': 'links', 'link': listr.links.current, 'pct': pct, 'cur': Math.round(cur).toMMSS() });
				}

			}, 1000);


// 			listr.youtubeTimer = setInterval(function() {
// // console.log('youtubeTimer');
// 				if (
// 					$.isNumeric(listr.sources['youtube.com']._player.getDuration())
// 					&& listr.sources['youtube.com']._player.getDuration() > 2
// 					&& (!$.isNumeric(link.meta.start) || listr.sources['youtube.com']._player.getCurrentTime() > link.meta.start / 100)
// 					&& listr.sources['youtube.com']._player.getCurrentTime() >= listr.sources['youtube.com']._player.getDuration() - 1
// 				) {
// // console.log('youtubeTimer DONE!');
// 					clearInterval(listr.youtubeTimer);

// 					// if (link.idx == listr.links.current.idx) {
// // console.log('skipping...');
// 						if (
// 							link.kind == 'vid'
// 							|| listr.sources["youtube.com"]._player.getPlaylistIndex() + 1 == listr.sources["youtube.com"]._player.getPlaylist().length
// 						) setTimeout(function() { if (link.idx == listr.links.current.idx) listr.links.next(); }, 1000);
// 						else setTimeout(function() { listr.sources["youtube.com"]._player.nextVideo(); }, 1000);
// 					}
// 				// }
// 			}, 999);
		}
		else if (link.idx == listr.links.current.idx) // If youtube isn't ready yet and this is still the current link, wait & try again.
			setTimeout(function() { listr.sources['youtube.com'].load(link); }, 100);
	}

	, msg : function(json) {
		if (json.data == -1) {			// loaded but unstarted
			if (listr.links.current.kind == 'playlist' && listr.sources["youtube.com"]._player.getPlaylistIndex() > 0)
				setTimeout(function() { listr.sources["youtube.com"]._player.playVideo(); }, 250);
		} 		
///* Moved to hacky bit until youtube fixes their shit.
		else if (json.data == 0) {		// video ended
			try {	// try..catch() because youtube doesn't reload a playlist on playback after (timeout) errors, it just loads the vid.
				if (		// if it's a single video or the end of the playlist, skip to the next link
					listr.links.current.kind == 'vid'
					|| listr.sources["youtube.com"]._player.getPlaylistIndex() + 1 == listr.sources["youtube.com"]._player.getPlaylist().length
				) listr.links.next();
			} catch(e) { }
		} 
//*/
		else if (json.data == 1) { 		// (playing)
			if ($('span.btns a.resume').css('display') != 'hidden') {
				$('span.btns a.resume').hide();
				$('span.btns a.pause').show();
			}		

			if (listr.links.current.kind == 'playlist') {
				if (listr.links.current.meta.length == '') {
					listr.links.current.meta.length = listr.sources["youtube.com"]._player.getPlaylist().length + ' vids';
					listr.links.update(listr.links.current);
				}

				var loaded = $.extend({}, listr.links.current);
				var ytdata = listr.sources["youtube.com"]._player.getVideoData();

				loaded.kind = 'vid';
				loaded.id_uni  = 'ytv|' + ytdata.video_id;
				loaded.url = 'https://youtube.com/watch?v=' + ytdata.video_id;
				loaded.title = ytdata.title;
				loaded.meta = ytdata.title.parseMeta();
				listr.broadcast({ 'action': 'load', 'target': 'links', 'link': loaded });
			} 
		}
		else if (json.data == 2) {		// (paused)	
			if ($('span.btns a.pause').css('display') != 'hidden') {
				$('span.btns a.pause').hide();
				$('span.btns a.resume').show();
			}
		} 
		// else if (json.data == 3) {	 	// (buffering)
		// }
		// else if (json.data == 5) {		// (video cued).
		// }
	}

	, pause : function(onOff) {
		if (onOff === undefined) var onOff = true;
		if (onOff) listr.sources["youtube.com"]._player.pauseVideo();
		else listr.sources["youtube.com"]._player.playVideo();
	}

	, search : function(query, callback, opts) { 
		// query -- text to search for
		// callback -- function to process results
		if (opts === undefined) var opts = { 'types' : 'video,playlist,channel' };	// 

	    $.ajax({
	      dataType: "json"
	      , url: 													// youtube API v3
	      	'https://www.googleapis.com/youtube/v3/search?part=snippet'
	      	+ '&maxResults=50&order=relevance&safeSearch=none&type=' + opts.types
			+ (opts.types == 'video' ? '&videoEmbeddable=true' : '')
	      	+ '&key=AIzaSyCZwSZBG0DReBq7-EZT_EWRQbLe7v_yL1o'
			+ '&q=' + encodeURIComponent(query)

	      , success: function(json) {
				if (json.items !== undefined && json.items.length > 0) {
					var results = [];
					var splitQuery = query.toLowerCase().split(' ');
					var minMatch = Math.floor(splitQuery.length / 2);

					$.each(json.items, function(i, entry) {
						if (entry.id.kind == 'youtube#video')
							results.push({
								'url' : 'https://youtube.com/watch?v=' + entry.id.videoId
								, 'title' :  entry.snippet.title
								, 'descrip' : entry.snippet.description
								, 'thumb' : entry.snippet.thumbnails.default.url
								, 'feed' : 'youtube'
								, 'domain' : 'youtube.com'
								// , 'source' : 'Youtube'
							});
						else if (entry.id.kind == 'youtube#playlist')
							results.push({
								'url' : 'https://www.youtube.com/playlist?list=' + entry.id.playlistId
								, 'title' :  entry.snippet.title
								, 'descrip' : 
									(entry.snippet.channelTitle.length > 0 ? '<b>/u/' + entry.snippet.channelTitle + '</b> ' : '')
									+ entry.snippet.description
								, 'thumb' : entry.snippet.thumbnails.default.url
								, 'feed' : 'youtube'
								, 'domain' : 'youtube.com'
								// , 'source' : 'Youtube'
							});
						else if (entry.id.kind == 'youtube#channel')
							results.push({
								'url' : 'https://www.youtube.com/channel/' + entry.id.channelId
								, 'title' :  entry.snippet.title
								, 'descrip' : 
									(entry.snippet.channelTitle.length > 0 ? '<b>/u/' + entry.snippet.channelTitle + '</b> ' : '')
									+ entry.snippet.description
								, 'thumb' : entry.snippet.thumbnails.default.url
								, 'feed' : 'youtube'
								, 'domain' : 'youtube.com'
								// , 'source' : 'Youtube'
							});
					});

					setTimeout(function() { callback(results); }, 666);	// youtube too quick, give others a chance to reply first
				}
	      	}
	    });
	}

	, seek : function(seekPct) { 
// console.log('youtube seek: ' + seekPct);
		var player = listr.sources['youtube.com']._player;
		var dur = player.getDuration();

		if ($.isNumeric(dur) && dur > 0) player.seekTo(seekPct * dur);
	}

	, stop : function() { 
		clearInterval(listr.sources["youtube.com"]._progress);

		try { listr.sources["youtube.com"]._player.stopVideo(); } catch(e) { } 
	}
};

listr.sources['youtu.be'] = $.extend({}, listr.sources['youtube.com']);	// copy the above into the youtu.be scope as well
// overwrite search() and stop() to prevent them firing twice
listr.sources['youtu.be'].search = function(query, callback) { callback([]) };
listr.sources['youtu.be'].stop = function() { };

///////// veoh.com ///////////////////////////////////////////////////////////////////////////////////////////////////////
// http://www.veoh.com/watch/v16439142GRyZJsPn
// <object width="410" height="341" id="veohFlashPlayer" name="veohFlashPlayer"><param name="movie" value="http://www.veoh.com/swf/webplayer/WebPlayer.swf?version=AFrontend.5.7.0.1492&permalinkId=v16439142GRyZJsPn&player=videodetailsembedded&videoAutoPlay=0&id=anonymous"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.veoh.com/swf/webplayer/WebPlayer.swf?version=AFrontend.5.7.0.1492&permalinkId=v16439142GRyZJsPn&player=videodetailsembedded&videoAutoPlay=0&id=anonymous" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="410" height="341" id="veohFlashPlayerEmbed" name="veohFlashPlayerEmbed"></embed></object><br /><font size="1">Watch <a href="http://www.veoh.com/watch/v16439142GRyZJsPn">Hollywoodism.avi.AVI</a> in <a href="http://www.veoh.com/browse/videos/category/culture">Culture</a>  |  View More <a href="http://www.veoh.com">Free Videos Online at Veoh.com</a></font>
listr.sources['veoh.com'] = {
	buckets : ['vids', 'music', 'nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		if (link.url.indexOf('/watch/') == -1) return {};

		var props = {};
		props.kind = 'vid';
		props.source = 'Veoh';
		props.id_source = link.url.split('/watch/')[1].split('/')[0].split('?')[0];
		props.id_uni = 'veo|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-veoh"> </div>');
	}
	, load : function(link) {
		$('#media-veoh').html('<object id="veohFlashPlayer" name="veohFlashPlayer" width="100%" height="100%"><param name="movie" value="http://www.veoh.com/swf/webplayer/WebPlayer.swf?version=AFrontend.5.7.0.1492&permalinkId=' + link.id_source + '&player=videodetailsembedded&videoAutoPlay=1&id=anonymous"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.veoh.com/swf/webplayer/WebPlayer.swf?version=AFrontend.5.7.0.1492&permalinkId=v16439142GRyZJsPn&player=videodetailsembedded&videoAutoPlay=0&id=anonymous" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="100%" height="100%" id="veohFlashPlayerEmbed" name="veohFlashPlayerEmbed"></embed></object>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-veoh').html('');
	}
}

///////// vid.me ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['vid.me'] = {
	buckets : ['vids', 'nsfw', 'gaynsfw']
	, bgColor: 'black'

	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'vid.me';
		props.id_source = link.url.replace('.me/e/', '.me/').split('vid.me/')[1].split('/')[0].split('?')[0].split('#')[0];
		if (props.id_source.length < 4 || props.id_source.length > 6) return {};
		props.id_uni = 'vme|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;
		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-vidme"> </div>');
	}

	, load : function(link) {
		// <iframe src="https://vid.me/e/EL8q?autoplay=1" width="640" height="640" frameborder="0" allowfullscreen webkitallowfullscreen mozallowfullscreen scrolling="no"></iframe><div><a href="undefined?source=embed" style="font-size: 11pt; text-decoration: none;"></a></div>
		$('#media-vidme').html('<iframe src="https://vid.me/e/' + link.id_source  + '?autoplay=1"></iframe>').show();
	}

	, seek : function(seekPct) { }

	, stop : function() { $('#media-vidme').html(''); }

	, error : function(err) {}
	, msg : function(json) {}
	, search : function(query, callback) { callback([]); }
};


/////////////////////////////////////////////////// extensions ////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////// music
///////////// mp3
listr.sources['mp3'] = {
	buckets : ['music', 'nsfw', 'gaynsfw']
	, _ads : false 				
	, _pauses : true
	, _streams : true
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true			
	, _player : false			// no player for direct images

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'mp3';
		props.source = 'Direct';
		props.id_uni = 'mp3|' + link.domain + '|' + link.url.split('/')[3].split('?')[0];

		return props;
	}
	, error : function(err) {}	// no errors w/ direct images

	, init : function() {
		if (this._init) return; this._init = true;
		if ($('#media-embed').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-embed"> </div>');
	}

	, load : function(link) { 
		$('#media-embed').html(
			'<audio style="height:100%;max-width:100%;" preload="" autoplay="" poster="' + link.thumb + '"  controls="" onended="listr.links.next();"'
			+ ' onplay="if ($(\'span.btns a.resume\').css(\'display\') != \'hidden\') { $(\'span.btns a.resume\').hide(); $(\'span.btns a.pause\').show(); }"'
			+ ' onpause="if ($(\'span.btns a.pause\').css(\'display\') != \'hidden\') { $(\'span.btns a.pause\').hide(); $(\'span.btns a.resume\').show(); }"'
			+ '>'
				+ '<source src="' + link.url + '" type="audio/mp3">'
			+ '</audio>'
		).show();
	}

	, msg : function(json) {}	// no msgs w/ direct images

	, pause : function(onOff) {
		if (onOff === undefined) var onOff = true;
		if (onOff) $('#media-embed audio').trigger('pause');
		else $('#media-embed audio').trigger('play');
	}

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-embed').html(''); }
};

/////////////// wav
listr.sources['wav'] = {
	buckets : ['music', 'nsfw', 'gaynsfw']
	, _ads : false 				
	, _pauses : true
	, _streams : true
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true			
	, _player : false			// no player for direct images

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'wav';
		props.source = 'Direct';
		props.id_uni = 'wav|' + link.domain + '|' + link.url.split('/')[3].split('?')[0];

		return props;
	}
	, error : function(err) {}	// no errors w/ direct images

	, init : function() {
		if (this._init) return; this._init = true;
		if ($('#media-embed').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-embed"> </div>');
	}

	, load : function(link) { 
		$('#media-embed').html(
			'<audio style="height:100%;max-width:100%;" preload="" autoplay="" poster="' + link.thumb + '"  controls="" onended="listr.links.next();"'
			+ ' onplay="if ($(\'span.btns a.resume\').css(\'display\') != \'hidden\') { $(\'span.btns a.resume\').hide(); $(\'span.btns a.pause\').show(); }"'
			+ ' onpause="if ($(\'span.btns a.pause\').css(\'display\') != \'hidden\') { $(\'span.btns a.pause\').hide(); $(\'span.btns a.resume\').show(); }"'
			+ '>'
				+ '<source src="' + link.url + '" type="audio/wav">'
			+ '</audio>'
		).show();
	}

	, msg : function(json) {}	// no msgs w/ direct images

	, pause : function(onOff) {
		if (onOff === undefined) var onOff = true;
		if (onOff) $('#media-embed audio').trigger('pause');
		else $('#media-embed audio').trigger('play');
	}

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-embed').html(''); }
};

/////////////// ogg
listr.sources['ogg'] = {
	buckets : ['music', 'nsfw', 'gaynsfw']
	, _ads : false 				
	, _pauses : true
	, _streams : true
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true			
	, _player : false			// no player for direct images

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'ogg';
		props.source = 'Direct';
		props.id_uni = 'ogg|' + link.domain + '|' + link.url.split('/')[3].split('?')[0];

		return props;
	}
	, error : function(err) {}	// no errors w/ direct images

	, init : function() {
		if (this._init) return; this._init = true;
		if ($('#media-embed').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-embed"> </div>');
	}

	, load : function(link) { 
		$('#media-embed').html(
			'<audio style="height:100%;max-width:100%;" preload="" autoplay="" poster="' + link.thumb + '"  controls="" onended="listr.links.next();"'
			+ ' onplay="if ($(\'span.btns a.resume\').css(\'display\') != \'hidden\') { $(\'span.btns a.resume\').hide(); $(\'span.btns a.pause\').show(); }"'
			+ ' onpause="if ($(\'span.btns a.pause\').css(\'display\') != \'hidden\') { $(\'span.btns a.pause\').hide(); $(\'span.btns a.resume\').show(); }"'
			+ '>'
				+ '<source src="' + link.url + '" type="audio/ogg">'
			+ '</audio>'
		).show();
	}

	, msg : function(json) {}	// no msgs w/ direct images

	, pause : function(onOff) {
		if (onOff === undefined) var onOff = true;
		if (onOff) $('#media-embed audio').trigger('pause');
		else $('#media-embed audio').trigger('play');
	}

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-embed').html(''); }
};


/////////////////////////////////////////////////// video
///////// mp4 ///////////////////////////////////////////
listr.sources['mp4'] = {
	buckets : ['vids', 'music', 'pics', 'eyecandy', 'ladycandy', 'nsfw', 'gaynsfw']
	, _ads : false 				
	, _pauses : true
	, _streams : true
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true			
	, _player : false			// no player for direct images

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'mp4';
		props.source = 'Direct';
		props.id_uni = 'mp4|' + link.domain + '|' + link.url.split('/')[3].split('?')[0];

		return props;
	}
	, error : function(err) {}	// no errors w/ direct images

	, init : function() {
		if (this._init) return; this._init = true;
		if ($('#media-embed').length == 0)	// pic media holder is shared across all direct image links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="media-embed"> </div>');
	}

	, load : function(link) { 
		$('#media-embed').html(
			'<video style="height:100%;max-width:100%;" preload="" autoplay="" poster="' + link.thumb + '" webkit-playsinline="" controls="" onerror="setTimeout(function() { listr.links.current.descrip=\'Not found on host.\';listr.links.current.active=false;listr.links.update(listr.links.current);listr.links.next();},500);"'
			+ ' onplay="if ($(\'span.btns a.resume\').css(\'display\') != \'hidden\') { $(\'span.btns a.resume\').hide(); $(\'span.btns a.pause\').show(); }"'
			+ ' onpause="if ($(\'span.btns a.pause\').css(\'display\') != \'hidden\') { $(\'span.btns a.pause\').hide(); $(\'span.btns a.resume\').show(); }"'
				+ (listr.bucket == 'media' || listr.bucket == 'music' || listr.bucket == 'vids' ? ' onended="listr.links.next();"' : ' loop=""')
			+ '>'
				+ '<source src="' + link.url + '" type="video/mp4">'
			+ '</video>'
		).show();
	}

	, msg : function(json) {}	// no msgs w/ direct images

	, pause : function(onOff) {
		if (onOff === undefined) var onOff = true;
		if (onOff) $('#media-embed video').trigger('pause');
		else $('#media-embed video').trigger('play');
	}

	, search : function(query, callback) { callback([]); }

	, seek : function(seekPct) { }

	, stop : function() { $('#media-embed').html(''); }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// NSFW sites ////////////////////////////////////////////////////////////

///////// bitporno.sx ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['bitporno.sx'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : true
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		// https://www.bitporno.sx/?v=nN2knE2aN
		// <iframe width="640" height="360" src="https://www.bitporno.sx/embed/nN2knE2aN" frameborder="0" marginwidth=0 marginheight=0 scrolling=no allowfullscreen></iframe>
		if (link.url.indexOf('v=') == -1) { console.log('no id found!', link.url.indexOf('v=')); return {}; }

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'BitPorno';
		props.id_source = link.url.split('v=')[1].split('/')[0].split('&')[0].split('#')[0];
		props.id_uni = 'bpo|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="https://www.bitporno.sx/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

///////// cliphunter.com ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['cliphunter.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		// http://www.cliphunter.com/w/1957376/tiffany_thompson_sex_with_a_supermodel
		// <iframe width="640" height="400" src="http://www.cliphunter.com/embed/1957376" frameborder="0" scrolling="no" allowfullscreen></iframe>
		if (link.url.indexOf('cliphunter.com/w/') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'ClipHunter';
		props.id_source = link.url.split('/w/')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};
		props.id_uni = 'chr|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="http://www.cliphunter.com/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

///////// drtuber  ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['drtuber.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (link.url.indexOf('/video/') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'Dr Tuber';

		// http://www.drtuber.com/video/215762/cute-and-sexy-18-year-old-pretty-girl
		props.id_source = link.url.split('/video/')[1].split('/')[0].split('.')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};

		props.id_uni = 'drt|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="http://www.drtuber.com/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

///////// eroshare /////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['eroshare.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
// https://eroshare.com/9wlcwj3j
// <iframe width="550" height="550" src="https://eroshare.com/embed/9wlcwj3j" scrolling="no" frameborder="0" allowfullscreen></iframe>
		if (!this._init) this.init();

		var props = {};
		props.kind = 'media';
		props.source = 'Eroshare';
		props.id_source = link.url.split('eroshare.com/')[1].split('.')[0].split('/')[0].split('?')[0].split('#')[0];
		if (props.id_source.length < 5) return {};
		props.id_uni = 'ero|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}
	, load : function(link) {
		$('#media-nsfw').html('<iframe src="https://eroshare.com/embed/' + link.id_source + '"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-nsfw').html('');
	}
};

///////// eporner /////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['eporner.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'ePorner';

		// http://www.eporner.com/hd-porn/184370/Charming-Girl-Sucks-Cock/
		// <iframe width="1920" height="1080" src="http://www.eporner.com/embed/184370" frameborder="0" allowfullscreen></iframe> 
		props.id_source = false;
		try { props.id_source = link.url.split('/')[4].split('/')[0].split('.')[0].split('/')[0].split('?')[0].split('#')[0]; }
		catch(e) {}
		if (!$.isNumeric(props.id_source)) return {};

		props.id_uni = 'epr|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {		// No HTTPS support.
		$('#media-nsfw').html('<iframe src="http://www.eporner.com/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

/* embedded player doesn't work!
///////// nofakestars  /////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['nofakestars.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'nofakestars';

		// http://www.nofakestars.com/video/5659/i-gave-my-man-blowjob-with-pleasure-and-passion
		// <iframe width="540" height="380" src="http://www.nofakestars.com/embed/5659" frameborder="0" allowfullscreen></iframe>
		if (link.url.indexOf('/video/') == -1) return {};
		props.id_source = link.url.split('/video/')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};

		props.id_uni = 'nfs|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {		// No HTTPS support.
		$('#media-nsfw').html('<iframe src="http://www.nofakestars.com/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};
*/

///////// PlayVids ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['playvids.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		if (link.url.indexOf('/v/') == -1) return {};

		// https://www.playvids.com/v/Wo3oPaWknZV
		var props = {};
		props.kind = 'vid';
		props.source = 'PlayVids';
		props.id_source = link.url.split('/v/')[1].split('/')[0].split('?')[0].split('#')[0];
		props.id_uni = 'pvd|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		// <iframe width="640" height="360" src="https://www.playvids.com/embed/Wo3oPaWknZV" frameborder="0" allowfullscreen></iframe>
		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}
	, load : function(link) {
		$('#media-nsfw').html('<iframe src="https://www.playvids.com/embed/' + link.id_source + '"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-nsfw').html('');
	}
};


///////// porndoo.com ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['porndoo.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();
		if (link.url.indexOf('porndoo.com/video/') == -1) return {};
		// http://porndoo.com/video/2578/molly-lolly-daddy-039-s-gonna-be-proud-of-her-pegasproduction/

		var props = {};
		props.kind = 'vid';
		props.source = 'porndoo';
		props.id_source = link.url.split('porndoo.com/video/')[1].split('/')[0].split('?')[0].split('#')[0];
		props.id_uni = 'pdo|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}
	, load : function(link) {
		// omitted: <script type="text/javascript" src="http://porndoo.com/tpl/main/js/vid.js"></script>
		$('#media-nsfw').html('<iframe src="http://porndoo.com/embed/' + link.id_source + '/"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-nsfw').html('');
	}
};

///////// pornhd ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['pornhd.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (link.url.indexOf('pornhd.com/videos/') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'PornHD';
		props.id_source = link.url.split('pornhd.com/videos/')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};
		props.id_uni = 'phd|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {	// HTTPS not available.
		$('#media-nsfw').html('<iframe src="http://www.pornhd.com/video/embed/' + link.id_source  + '?highquality=1"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

///////// pornhub ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['pornhub.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false 	// works via HTTPS but something internal is only HTTP

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (link.url.indexOf('pornhub.com/view_video.php?viewkey=') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'Pornhub';
		props.id_source = link.url.split('pornhub.com/view_video.php?viewkey=')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};
		props.id_uni = 'phb|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="https://pornhub.com/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

///////// porntrex ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['porntrex.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		// http://www.porntrex.com/video/4481/czech-amateurs-104
		// <iframe width="540" height="380" src="http://www.porntrex.com/embed/4481" frameborder="0" allowfullscreen></iframe>
		if (link.url.indexOf('porntrex.com/video/') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'PornTrex';
		props.id_source = link.url.split('/video/')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};
		props.id_uni = 'ptx|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="http://www.porntrex.com/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

///////// pornxs ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['pornxs.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : true
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		// http://pornxs.com/teen-amateur/1344702-teen-rainbow-socks-masturbation.html
		// <iframe src="http://embed.pornxs.com/embed.php?id=1344702" frameborder="0" width="640" height="480" scrolling=no></iframe>
                    
		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'PornXS';

		try { 
			props.id_source = link.url.split('pornxs.com/')[1].split('/')[1].split('-')[0].split('.')[0].split('?')[0].split('#')[0];
		} catch(e) { props.id_source = false; }
		if (!$.isNumeric(props.id_source)) return {};

		props.id_uni = 'pxs|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="http://embed.pornxs.com/embed.php?id=' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

///////// redtube ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['redtube.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'RedTube';
		// http://www.redtube.com/582763
		props.id_source = link.url.split('redtube.com/')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};
		props.id_uni = 'rte|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {	// No HTTPS support.
		$('#media-nsfw').html('<iframe src="http://embed.redtube.com/?id=' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

/*
spankbang.com
http://spankbang.com/2zbh/video/opposites+attract+karla+kush
<iframe width="560" height="315" src="http://spankbang.com/2zbh/embed/" frameborder="0" scrolling="no" allowfullscreen></iframe>
*/

///////// spankbang //////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['spankbang.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : true
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		var props = {};
		props.kind = 'vid';
		props.source = 'SpankBang';

		if (link.url.indexOf('/video/') != -1)		// http://spankbang.com/2zbh/video/opposites+attract+karla+kush
			props.id_source = link.url.split('spankbang.com/')[1].split('/video/')[0];
		else if (link.url.indexOf('/play/') != -1)		// http://m.spankbang.com/lxg0/play/riley+nixon/480p/
			props.id_source = link.url.split('spankbang.com/')[1].split('/play/')[0];
		else return {};

		if (!this._init) this.init();

		props.id_uni = 'sbg|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {		// No HTTPS support.
		$('#media-nsfw').html('<iframe src="http://spankbang.com/' + link.id_source + '/embed/"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

///////// sunporno ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['sunporno.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : true
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (link.url.indexOf('sunporno.com/videos/') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'SunPorno';

		// http://www.sunporno.com/videos/602375/
		props.id_source = link.url.split('sunporno.com/videos/')[1].split('.')[0].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};

		props.id_uni = 'spo|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {		// No HTTPS support.
		$('#media-nsfw').html('<iframe src="http://embeds.sunporno.com/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};


///////// tnaflix ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['tnaflix.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (link.url.indexOf('/video') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'TNA Flix';

		// http://www.tnaflix.com/hardcore-porn/Spicing-it-up-with-kinky-sex/video796330
		props.id_source = link.url.split('/video')[1].split('.')[0].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};

		props.id_uni = 'tfx|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="https://player.tnaflix.com/video/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};


///////// tube8.com   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['tube8.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();
		// http://www.tube8.com/hardcore/remy-lacroix:-extreme-humiliation/25443901/

		var props = {};
		props.kind = 'vid';
		props.source = 'Tube8';

		if (link.url.substr(-1) == '/') link.url = link.url.substr(0, link.url.length - 1);
		props.id_source = link.url.substr(link.url.lastIndexOf('/') + 1);
		if (!$.isNumeric(props.id_source)) return {};

		props.id_uni = 'tb8|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}
	, load : function(link) {
		// <iframe src="http://www.tube8.com/embed/hardcore/remy-lacroix%3A-extreme-humiliation/25443901/" frameborder="0" height="481" width="608" scrolling="no" name="t8_embed_video"></iframe>
		$('#media-nsfw').html('<iframe src="' + link.url.replace('tube8.com/', 'tube8.com/embed/') + '"></iframe>').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#media-nsfw').html('');
	}
};

///////// xnxx ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['xnxx.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
// http://www.xnxx.com/video9448035/disgrace_that_bitch_-_fucking_around_and_fucking_hard
// <iframe src="http://flashservice.xvideos.com/embedframe/9448035" frameborder=0 width=510 height=400 scrolling=no></iframe>

		if (link.url.indexOf('xnxx.com/video') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'xnxx';
		props.id_source = link.url.split('/video')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};
		props.id_uni = 'xnx|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="http://flashservice.xvideos.com/embedframe/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

/* removed: stop streaming thru embeds
///////// xhamster ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['xhamster.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (link.url.indexOf('xhamster.com/movies/') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'XHamster';
		props.id_source = link.url.split('/movies/')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};
		props.id_uni = 'xhr|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="https://xhamster.com/xembed.php?video=' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};
*/


///////// xvideos //////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['xvideos.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (
			link.url.indexOf('xvideos.com/video') == -1
			&& link.url.indexOf('xvideos.com/embedframe/') == -1
		) return {};
		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'XVideos';

		// http://flashservice.xvideos.com/embedframe/11099961
		// http://www.xvideos.com/video8650667/ebony_can_t_take_the_white_horse_dong_1_
		if (link.url.indexOf('xvideos.com/embedframe/') != -1) props.id_source = link.url.split('xvideos.com/embedframe/')[1].split('/')[0].split('?')[0].split('#')[0];
		else props.id_source = link.url.split('xvideos.com/video')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};

		props.id_uni = 'xvd|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {	//  HTTPS doesn't work on xvideo.
		$('#media-nsfw').html('<iframe src="http://flashservice.xvideos.com/embedframe/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};


///////// viptube ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['viptube.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		// http://www.viptube.com/video/1501063/cute-nerd-chick-loves-her-new-vibrating-toy
		// <iframe src="http://www.viptube.com/embed/1501063" width="608" height="454" frameborder="0" scrolling="no"></iframe>
		if (link.url.indexOf('viptube.com/video/') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'VIPtube';
		props.id_source = link.url.split('/video/')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};
		props.id_uni = 'vtb|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="http://www.viptube.com/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

///////// xxxyours ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['xxxyours.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : true

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		// https://xxxyours.com/video/17758/e159-nicole-angeline-morales-19-years-old
		// <iframe src="https://xxxyours.com/embed/17758" width="640" height="480" frameborder="0" allowfullscreen />
		if (link.url.indexOf('xxxyours.com/video/') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'XXXYours';
		props.id_source = link.url.split('/video/')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};
		props.id_uni = 'xys|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="https://xxxyours.com/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

///////// youjizz ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['youjizz.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (link.url.indexOf('youjizz.com/videos/') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'YouJizz';

		// http://www.youjizz.com/videos/amateur-honey-gets-it-hot-20968291.html
		props.id_source = link.url.split('youjizz.com/videos/')[1].split('.')[0].split('/')[0].split('?')[0].split('#')[0];
		props.id_source = props.id_source.substr(props.id_source.lastIndexOf('-') + 1);
		if (!$.isNumeric(props.id_source)) return {};

		props.id_uni = 'yjz|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {	// No HTTPS support.
		$('#media-nsfw').html('<iframe src="http://www.youjizz.com/videos/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};


///////// youporn ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources['youporn.com'] = {
	buckets : ['nsfw', 'gaynsfw']
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : true 	// nothing to load
	, _player : false

	, defaults : function(link) {
		if (link.url.indexOf('youporn.com/watch/') == -1) return {};

		if (!this._init) this.init();

		var props = {};
		props.kind = 'vid';
		props.source = 'YouPorn';
		props.id_source = link.url.split('youporn.com/watch/')[1].split('/')[0].split('?')[0].split('#')[0];
		if (!$.isNumeric(props.id_source)) return {};
		props.id_uni = 'ypn|' + props.id_source;

		return props;
	}

	, init : function() {
		if (this._init) return; this._init = true;

		if ($('#media-nsfw').length == 0)	// media holder is shared across all nsfw links
			$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp" id="media-nsfw"> </div>');
	}

	, load : function(link) {
		$('#media-nsfw').html('<iframe src="https://youporn.com/embed/' + link.id_source  + '"></iframe>').show();
	}

	, error : function(err) {}
	, msg : function(json) {}
	, seek : function(seekPct) { }
	, stop : function() { $('#media-nsfw').html(''); }
	, search : function(query, callback) { callback([]); }
};

/*
///////// template ////////////////////////////////////////////////////////////////////////////////////////////////////////
listr.sources[''] = {
	buckets : []
	, _ads : false
	, _pauses : false
	, _streams : false
	, _https : false

	, _events : 0
	, _init : false
	, _loaded : false
	, _player : false

	, defaults : function(link) {
		if (!this._init) this.init();

		var props = {};
		props.kind = '';
		props.source = '';
		props.id_source = '';
		props.id_uni = '???|' + props.id_source;

		return props;
	}
	, error : function(err) {}

	, init : function() {
		if (this._init) return; this._init = true;

		$('div.container.media div.content').append('<div class="hidden hide-on-load media-dsp"  id="???"> </div>');
	}
	, load : function(link) {
		$('#???').html('').show();
	}
	, msg : function(json) {}
	, pause : function(onOff) {}
	, post : function(event, args) {}
	, search : function(query, callback) { callback([]); }
	, seek : function(seekPct) { }
	, stop : function() {
		$('#???').html('');
	}
};
*/
