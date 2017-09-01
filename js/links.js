/*
	Links is another term for the playlist, tracklist, what's loaded, or whatever else you want to call a list of URLs.
*/

listr.links = {};
listr.links.current = { 'idx': -1, 'related': {}, 'meta': {} }; // Pointer to currently loaded link

listr.links.list = [];											// Main array of loaded links
listr.links.rejected = [];										// Array of links rejected since last link load
listr.links.stashed = [];

listr.links.rollTimer = false;

listr.links.userBlacklist = [			// Array of authors to avoid on match.
	'makeswordcloudsagain'
];

listr.links.blacklist = [			// Array of partial URLs to avoid on match.
		'dropbox.com/', 'drive.google.com/folderview', 'modelmayhem.com/', 'pokecheck.org/', 'commons.wikimedia.org/wiki/file:'
		, 'imdb.com/', 'instagram.com/', 'video.google.com/','twitter.com/', 'facebook.com/', 'github.com/'
		, 'mediafire.com/', 'mediacru.sh/', 'gifsound.com/', 'gfysound.com/', 'spring.me/'
		, '.fbcdn.net/', '//fbcdn-', 'porndirtypix.com/', '.kxcdn.com/', '.kn3.net/', 'minus.com/'

		// Support added: , 'openload.io/'	// Fake .mp4 links.
		, 'weshare.me/'		// Fake .mp4 links.
		, 'imgnet.x10.mx/'	// Fake .jpg links.
		, 'tophdimgs.com/' // Fake .jpg links.
		, 'sharethispicture.tk/' // Fake .jpg links.

		// The butts are here for a (secret) reason.
		, 'buttimage'.substr(-5) + 'buttnimage'.substr(-6) + '.com/'
		, 'buttimg'.substr(-3) + 'buttchili'.substr(-5) + '.net/'
];

// BAD IDEA NO NO NO
// if (document.location.protocol == 'https:') listr.links.blacklist.push('http:');	// HTTP links don't work on a HTTPS connection.

// Mobile users get additional URLs blacklisted.
if (navigator.userAgent.toLowerCase().indexOf('phone') !== -1 || navigator.userAgent.toLowerCase().indexOf('mobile') !== -1)
	listr.links.blacklist.push('bandcamp.com/'); // 'grooveshark.com/', 'spotify.com/', 

if (navigator.userAgent.indexOf('iPhone') !== -1) listr.links.blacklist.push('soundcloud.com/');


listr.links.table = null;			// DataTables object (to display links)

listr.links.autoskip = false;		// Timeout pointer for autoskipping links.
listr.links.autoskipMS = 9000;		// If active, skip every 10sec.

//listr.links.optsTimerMS = 3000;		// If opts are showing, wait this long to hide them again.
// listr.links.optsTimer = false;		// Timeout pointer show/ hide options

listr.search = {};					// Object for search results
listr.search.list = [];				// Array of search results

// listr.links.fromNext = false;		// TRUE when listr.links.next() is called

listr.search.push = function(idx) { // Called from search results/ found links when added to loaded.
	listr.links.stash();
	listr.links.push(listr.search.list[idx]);
	listr.links.restore();
}

// New links modify these values.
listr.links.defaults = {
	'kind' : ''						// populated by source, e.g. vid, music, playlist, link, pic, album, etc etc
	, 'active' : true				// Set to FALSE by errors from the source or other problems with the link.
	, 'url' : ''					// URL, obvs.
	, 'title' : ''					// title from feed
	, 'thumb' : ''					// thumbnail for this link
	, 'descrip' : ''				// metadata/ description of this link
	, 'feed' : ''					// where the link was found, usually reddit.
	, 'meta' : {}					// artist name, year release, and other such misc. metadata about this link
	, 'related' : {}				// key-value pairs of links related to this one.  Handled in related.js.

	, 'feed' : ''					// name of feed
	, 'id_feed' : ''				// ID on feed site
	, 'utc_feed' : ''				// when the link was shared on feed site
	, 'subreddit' : ''				// Is this from a reddit feed?  What sub did it come from?
	, 'author' : ''					// who shared the link on feed site
	, 'score' : 0					// score on feed site

	, 'domain' : ''					// just the link's domain
	, 'source' : ''					// dispaly version of link domain (i.e. 'Youtube' not 'youtube.com' or 'youtu.be')
	, 'id_source' : ''				// ID on link's site
	, 'uploader' : ''				// who uploaded this link to the source
	, 'uploader_title' : ''			// source title for this link
	, 'uploader_url' : ''			// URL to uploader's profile on source

	, 'id_uni' : ''					// universal ID generated from URL, created in defaults() in source.js
	, 'explodable': false 			// Can this link be exploded into many links?  Set by defaults().

	, 'embed' : ''				// HTML to embed this link
	// nope: , 'load' : function() { return true; }	// for things like reddit's "after" to get more links from the same source.
}

// Removes everything from links.list and stores it in links.stashed
listr.links.stash = function() {
	var curPos = $('#links tr.selected').index();
	var newList = [];

	listr.links.stashed = [];
	$.each(listr.links.list, function(i, link) {
		var pos = $('#links tr td i.idx-' + link.idx).parent('td').parent('tr').index();
		if (pos > curPos) listr.links.stashed.push(link);
		else newList.push(link);
	});

	listr.links.list = newList.clone();
}

listr.links.restore = function() {
	if (listr.links.stashed.length > 0) {
		listr.links.batchPush(true, 'links');
		$.each(listr.links.stashed, function(i, link) { listr.links.push(link); });
		listr.links.batchPush(false, 'links');
	}

	listr.links.update();
}

listr.links.clear = function(opts) {
	$('ul.quickLoad,div.grid div.cardCont').html('');

	if (opts === undefined) {
		$('div.container.links div.listings a').remove();

		listr.links.list = [];	
		listr.listings.list = [];

		listr.links.table.rows().remove().draw();
		listr.broadcast({ 'action': 'clear', 'target': 'links' });
	}
	else if (opts === 'listing') {
		$('div.container.links div.listings a').remove();
		listr.listings.list = [];
	}
	else if (opts.domain !== undefined) {
		var domain = opts.domain;
		
		var remaining = [];
		$.each(listr.links.list, function(i, link) { if (link.domain != domain) remaining.push(link); });

		$.each(remaining, function(idx, link) { link.idx = idx; });

		listr.links.list = remaining;

		listr.links.table.rows().remove();
		$.each(listr.links.list, function(i, link) { listr.links.addRow(link); });
		listr.links.table.draw();
	}
	else if (opts.kind !== undefined) {
		var kind = opts.kind;

		var remaining = [];
		$.each(listr.links.list, function(i, link) { if (link.kind != kind) remaining.push(link); });

		$.each(remaining, function(idx, link) { link.idx = idx; });
		listr.links.list = remaining;

		listr.links.table.rows().remove();
		$.each(listr.links.list, function(i, link) { listr.links.addRow(link); });
		listr.links.table.draw();
	}

	$('#nixLinks').closeModal();
}

listr.links.push = function(newLink) {
// console.log('push', newLink);
	if (newLink.url === undefined) return false;

	//// data cleanup & decoding	///////////////////////////////////////////////////////////////////
	if (newLink.idx !== undefined) delete newLink.idx;

	newLink.url = newLink.url.replace('//m.', '//').replace('//en.m.', '//');		// de-mobilize all links

	// trim last / if present
	if (newLink.url.lastIndexOf('/') == newLink.url.length - 1) newLink.url = newLink.url.substr(0, newLink.url.length - 1);

	var blacklisted = false;
	var lowerURL = newLink.url.toLowerCase();
	$.each(listr.links.blacklist, function(i, partialURL) { if (lowerURL.indexOf(partialURL) !== -1) blacklisted = true; });

	if (!blacklisted && newLink.author !== undefined)
		$.each(listr.links.userBlacklist, function(i, author) { if (author == newLink.author) blacklisted = true; });

	if (blacklisted) return false;

	if (newLink.ext === undefined || newLink.ext == '') {
		var earl = newLink.url.split('?')[0];
		if (earl.lastIndexOf('.') > earl.lastIndexOf('/')) {
			var splitEarl = earl.split('/');
			newLink.ext = splitEarl[splitEarl.length - 1].split('.')[1].split('?')[0].split('&')[0].split('#')[0];
		}
		else newLink.ext = '';
	}

	if (newLink.domain === undefined || newLink.domain == '') newLink.domain = newLink.url.split('/')[2]; 	// get domain from URL
	if (newLink.domain === undefined) return false;									// couldn't get domain from URL, reject link.
	newLink.domain = newLink.domain.toLowerCase();									// Ensure we have 'imgur' not 'Imgur' and whatnot.
	
	while (newLink.domain.split('.').length > 2 && newLink.domain.indexOf('.') < newLink.domain.length - 6)
		newLink.domain = newLink.domain.substr(newLink.domain.indexOf('.') + 1);	// remove any prefix from domain

	// no thumbnail?  use the bucket's default one.
	if (newLink.thumb === undefined || newLink.thumb === null || newLink.thumb.indexOf('http') != 0) newLink.thumb = listr.thumb;
	newLink.thumb = newLink.thumb.htmlDecode()	// yes, this should be regex.
		.replace('http://a.thumbs.redditmedia.com/', 'https://a.thumbs.redditmedia.com/')
		.replace('http://b.thumbs.redditmedia.com/', 'https://b.thumbs.redditmedia.com/')
		.replace('http://i.ytimg.com/', 'https://i.ytimg.com/')
		.replace('http://i1.ytimg.com/', 'https://i1.ytimg.com/')
		.replace('http://i2.ytimg.com/', 'https://i2.ytimg.com/')
		.replace('http://i3.ytimg.com/', 'https://i3.ytimg.com/')
	;

	// no title?  use the url.
	if (newLink.title === undefined) newLink.title = newLink.url;
	if (newLink.title.substr(0, 4) == 'http') newLink.title = newLink.title.replace(/\//g, '-');

	newLink.title = newLink.title.htmlDecode().replace('[FRESH] ', '').replace('https:--', '').replace('http:--', '').replace('www.', '').replace(/  /g, ' ').cTrim(' -—,' + ENTER);
	if (newLink.title.substr(0, 1) == '"' && newLink.title.substr(-1) == '"') newLink.title = newLink.title.cTrim('"');
	if (newLink.title.substr(0, 1) == "'" && newLink.title.substr(-1) == "'") newLink.title = newLink.title.cTrim("'");

	// if (newLink.embed !== undefined) newLink.embed = newLink.embed.htmlDecode();

	// bucket-specific data tweaks based //////////////////////
	if (listr.bucket === 'music') {
		newLink.meta = $.extend(newLink.meta, newLink.title.parseMeta());
		newLink.title = newLink.title.replace('--', ' – ').replace(' - ', ' – ').replace('- ', ' – ').replace(' -', ' – ');
		if (newLink.title.indexOf(' – ') == -1)  newLink.title = newLink.title.replace('-', ' – ');
		newLink.title = newLink.title.replace(/  /g, ' ');
	}
	else if (listr.bucket === 'vids') newLink.meta = $.extend(newLink.meta, { 'length': '' });


	var key = newLink.domain;											// Use the domain as the key for listr.sources[]..
	if (listr.sources[key] === undefined) key = newLink.ext;			// ..unless not defined, use the extension instead.

	//// Check if domain is a defined source and is valid for current bucket. /////////////////////////
	if (
		listr.sources[key] === undefined
		|| (listr.bucket != 'media' && $.inArray(listr.bucket, listr.sources[key].buckets) == -1)
		|| (!listr.opts['allowAds'] && listr.sources[key]._ads)
		|| (!listr.opts['allowNoStream'] && !listr.sources[key]._streams)
		|| (document.location.protocol == 'https:' && !listr.sources[key]._https)
	) { 
// console.log('- rejecting link', newLink);
		if (newLink.url.indexOf('reddit.com/') == -1) listr.links.rejected.push(newLink);

		return false; 
	}

	var idx = listr.links.list.length;
	if (listr.links.batchTarget == 'related' || listr.links.batchTarget == 'search') idx += 1000;

	// var related = false;
	// var search = false;
	// if (!listr.links.batch) {
	// 	if (listr.related.list.length > 0) { related  = listr.related.list.clone(); listr.related.list = []; }
	// 	if (listr.search.list.length > 0) { search  = listr.search.list.clone(); listr.search.list = []; }
	// }
	// else {
	if (listr.links.batch) {
		if (listr.links.batchLinks.length > 999) {
			if (newLink.url.indexOf('reddit.com/') == -1) listr.links.rejected.push(newLink);
			return false;
		}

		idx += listr.links.batchLinks.length;
		// if (self != top) idx += listr.search.list.length + listr.related.list.length;
	}


	// add link to list 	///////////////////////////////////
	var link = $.extend(
		{
			'idx' : idx 
			, 'key' : key
		}
		, listr.links.defaults								// default values (as defined above)
		, newLink											// new link values overwrite defaults
	);

	// source defaults overwrite all values, merge it separately so it has access to all properties
	if (link._defaults === undefined) {
		if (!listr.links.batch || listr.links.batchTarget == 'links') link._defaults = true;
		$.extend(link, listr.sources[key].defaults(link));
	}

	// if (related) {
	// 	listr.links.batchPush(true, 'related');
	// 	$.each(related, function(i, val) { listr.links.push(val); });
	// 	listr.links.batchPush(false, 'related');
	// }

	// if (search) {
	// 	listr.links.batchPush(true, 'search');
	// 	$.each(search, function(i, val) { listr.links.push(val); });
	// 	listr.links.batchPush(false, 'search');
	// }

	// if sources[].defaults() didn't return a id_uni(versal), reject the link.
	if (link.id_uni == '') { 
		if (link.url.indexOf('reddit.com/') == -1) listr.links.rejected.push(link);
		listr.broadcast({ 'action': 'reject', 'target': 'source', 'link': link });
		return false; 
	}

	if (link.subreddit == '' && link.related.permalink !== undefined && link.related.permalink.indexOf('/r/') != -1)
		link.subreddit = link.related.permalink.split('/r/')[1].split('/')[0].split('?')[0];

	var dupe = false;		// make sure this isn't a duplicate link.
	$.each(listr.links.list, function(idx, oldLink) { if (link.id_uni == oldLink.id_uni) dupe = true; });
	if (dupe) { listr.broadcast({ 'action': 'reject', 'target': 'duplicate', 'link': link }); return false; }

	if (listr.links.batch) {
		// make sure the batch doesn't have this link already.
		$.each(listr.links.batchLinks, function(idx, oldLink) { if (link.id_uni == oldLink.id_uni) dupe = true; });
		if (dupe) { listr.broadcast({ 'action': 'reject', 'target': 'batch', 'link': link }); return false; }

		listr.links.batchLinks[listr.links.batchLinks.length] = link;
	}
	else {
		toast('Add: ' + link.title, 1000);
		listr.broadcast({ 'action': 'push', 'target': 'links', 'link': link });

		listr.links.list[listr.links.list.length] = link;
		listr.links.addRow(link);

		// TODO: listr.links.meta(link);	// if not adding in a batch, ask server about this link

		if ($('div.container.grid').css('display') == 'none' && $('div.container.links').css('display') == 'none') {
			// $('div.container.links').css('min-height', '').slideDown(1000, function() { $(window).resize(); });

			if (listr.opts['showGrid']) $('div.container.grid').show(); else $('div.container.links').show();
			$(window).scroll();
			// listr.navi.update();
		}

		if (listr.links.list.length == 1) setTimeout(function() { $('#links tbody tr:eq(0)').click(); }, 250);
		// if (listr.links.list.length == 1) setTimeout(function() { 
		// 	$('#links tbody tr:eq(0)').click(); 

		// 	if ($('select.jump.virgin').length > 0) {
		// 		setTimeout(function() {
		// 			$('window,body').animate({ scrollTop: 0 }, 2000);
		// 			if (window.size().width > 960) $('div.quickLoad span.select-dropdown').click();
		// 		}, 2000);
		// 	}
		// }, 250);

		// if (related) {
		// 	listr.links.batchPush(true, 'related');
		// 	$.each(related, function(i, val) { listr.links.push(val); });
		// 	listr.links.batchPush(false, 'related');
		// }

		// if (search) {
		// 	listr.links.batchPush(true, 'search');
		// 	$.each(related, function(i, val) { listr.links.push(val); });
		// 	listr.links.batchPush(false, 'search');
		// }

		$('div.container.links div.opts a.plAdd.blue-grey').removeClass('blue-grey').addClass('grey');	// mark playlist as unsaved.
		$(window).resize();		// calls listr.links.table.draw() to update table
	}

	return link;
}


listr.links.search = function(query) {
	listr.search.list = [];	// empty previous results

	$('#linksAdd div.results').show();
	$('#linksAdd div.results div.col.content').html('<p style="text-align:center">searching for ' + query + '&hellip;</p>');

	function processResults(links) {
		var curLen = listr.search.list.length;
		if (!curLen) {																// clear display on first result
			$('#linksAdd div.results div.col.header ul').html('');
			$('#linksAdd div.results div.col.content').html('');
		}

		listr.links.batchPush(true, 'search');
		$.each(links, function(i, link) { links[i] = listr.links.push(link); });	// push and overwrite this link in links[]
		listr.links.batchPush(false, 'search');

		if (self != top) { listr.search.list = []; return; }

		$.each(links, function(i, link) {											// loop through new links and add them to the HTML
			if (link !== false) {	// links rejected in push() above are updated to false.
				var head = '#linksAdd div.results div.col.header ul.tabs li.' + link.source.toLowerCase();
				var cont = '#results-' + link.source.toLowerCase();

				if ($(head).length === 0) {
					$('#linksAdd div.results div.col.header ul').append(
						'<li class="tab ' + link.source.toLowerCase() + '">'
							+ '<a href="' + cont + '">' + link.source + '</a>'	// ' + (curLen ? '' : 'class="active" ') + '
						+ '</li>'
					);

					$('#linksAdd div.results div.col.content').append(
						'<div id="' + cont.substr(1) + '" class="col s12"> </div>'
					);

					setTimeout(function() { 		// update tabs after all HTML is appended
						$('#linksAdd ul.tabs').tabs();
						if (curLen) $('#linksAdd ul.tabs li:first a').click();	// fixes materalize always showing last added tab
					});
				}

				var ele = cont + ' div.' + link.kind;
				if ($(ele).length == 0) $(cont).append('<div class="' + link.kind + '"><h4>' + link.kind + 's</h4></div>');

				$(ele).append(
					'<div class="link-dsp z-depth-1 idx-' + link.idx + '">'
						+ '<img class="thumb z-depth-1 hide-on-small-only" src="' + link.thumb + '">'
						+ '<h6><span class="title">' + link.title + '</span> (' + '<span class="source">' + link.source + '</span>)</h6>'
						+ '<p>' + link.descrip + '</p>'
						+ '<div class="opts">'
							+ '<a onClick="listr.links.load(listr.search.list[' + (curLen + i) + ']);" class="waves-effect waves-light btn"><i class="mdi-action-visibility left"></i>load</a>'
							+ '<a onClick="listr.search.push(' + (curLen + i) + ');" class="waves-effect waves-light btn"><i class="mdi-av-queue left"></i>queue</a>'
							+ '<a onClick="listr.links.stop();" target="_blank" href="' + link.url + '" class="waves-effect waves-light btn"><i class="mdi-action-open-in-new left"></i>open</a>'
						+ '</div>'
					+ '</div>'
				);
			}
		});
	}

	$.each(listr.sources, function(domain, source) { 
		if ($.inArray(listr.bucket, listr.sources[domain].buckets) != -1) source.search(query, processResults);
	});	
}

listr.links.addRow = function(link) {
	if (listr.bucket == 'music')
		listr.links.table.row.add([
			'<i class="pos idx-' + link.idx + '">' + link.idx + '</i>'
			, link.meta.artist
			, link.meta.track
			, link.meta.genre
			, link.meta.year
			, ($.isNumeric(link.meta.length) ? link.meta.length.toMMSS() : link.meta.length)
			, link.score
			, link.subreddit
			, link.source
			, '<i class="about mdi-action-info-outline"></i><i class="nix mdi-action-highlight-remove"></i>'
		]);
	else if (listr.bucket == 'vids')
		listr.links.table.row.add([
			'<i class="pos idx-' + link.idx + '">' + link.idx + '</i>'
			, link.title
			, ($.isNumeric(link.meta.length) ? link.meta.length.toMMSS() : link.meta.length)
			, link.kind
			, link.author
			, link.score
			, link.subreddit
			, link.source
			, '<i class="about mdi-action-info-outline"></i><i class="nix mdi-action-highlight-remove"></i>'
		]);	
	else
		listr.links.table.row.add([
			'<i class="pos idx-' + link.idx + '">' + link.idx + '</i>'
			, link.title
			, link.kind
			, link.author
			, link.score
			, link.subreddit
			, link.source
			, '<i class="about mdi-action-info-outline"></i><i class="nix mdi-action-highlight-remove"></i>'
		]);	

	listr.links.quicklinkAdd(link);
}

listr.links.quickloadRefresh = function() {
	$('ul.quickLoad,div.container.grid div.cardCont').html('');

	// listr.links.table.rows().each(function (index) {				
	listr.links.table.rows().iterator('row', function (context, index) {
		var row = listr.links.table.row(index).data();
		var idx = parseInt($('<div/>').html(row[0]).find('.pos').text());

		listr.links.quicklinkAdd(listr.links.list[idx]);
	});

	// Update the 'active' track in table and quickLoad
	if ($('ul.quickLoad li.idx-' + listr.links.current.idx).length > 0) {
	// if (listr.links.current.idx < listr.links.list.length) {
		$('ul.quickLoad li.active').removeClass('active');
		$('#links tr.selected').removeClass('selected');

		$('ul.quickLoad li.idx-' + listr.links.current.idx + ',div.grid div.cardCont div.card.idx-' + listr.links.current.idx).addClass('active');
		$('#links tr td i.pos.idx-' + listr.links.current.idx).parent('td').parent('tr').addClass('selected');

		$('ul.quickLoad').animate({
			scrollTop: 
				$('ul.quickLoad').scrollTop()
				+ $('ul.quickLoad li.idx-' + listr.links.current.idx).position().top 
				- (window.size().height / 4)
				+ 75
		}, 333);

		$('div.grid div.cardCont').animate({
			scrollTop: 
				$('div.grid div.cardCont').scrollTop()
				+ $('div.grid div.cardCont div.card.idx-' + listr.links.current.idx).position().top 
				- (window.size().height * 1.1)
		}, 333);
	}

//// Re-append listings.
	var listings = listr.listings.list.clone();
	listr.listings.list = [];
	$('div.container.links div.listings a').remove();
	$.each(listings, function(i, listing) { listr.listings.push(listing); });
}

listr.links.quicklinkAdd = function(link) {
	if (link === undefined) return;

	var tit = link.title.htmlDecode();

	// add new link to "jump" pulldown
	$('span.btns select.jump').append('<option value="' + link.idx + '">' + tit.substr(0, 75) + '</option>');

	if (listr.bucket === 'music') {
		if (link.meta.artist != '')
			tit = 
				'<b>' + link.meta.artist + '</b><br><i>' + link.meta.track + '</i>'
				+ (link.meta.genre != '' ? '<br><span class="genres capitalize">' + link.meta.genre.replace(/<br>/g, '/ ').replace(/,/g, '/ ').replace(/ \/ /g, '/ ') + '</span>' : '')
				+ (link.meta.year != '' ? '<br>' + link.meta.year : '')
			;
		else tit = tit.replace(' [', '<br>[').replace('] (', ']<br>(').replace('](', ']<br>(');
	}

	var listing = $('ul.quickLoad li.listing');
	if (listing.length > 0) listing.detach();

	$('ul.quickLoad').append(
		'<li class="idx-' + link.idx + '">'
			+ '<span>' 
				+ '<img class="thumb" src="' + listr.thumb + '">'	//  onload="if (this.naturalHeight + this.naturalWidth == 0) $(this).attr(\'src\', \'/img/' + listr.bucket + '.jpg\'); "
				+ tit // .substr(0, 120) + (tit.length > 120 ? '&hellip;' : '')
			+ '</span>'
		+ '</li>'
	);

	if (listing.length > 0) listing.appendTo($('ul.quickLoad'));

	// Also add to links "card" view.
	listing = $('div.cardCont div.card.listing').parent('div');
	if (listing.length > 0) listing.detach();

	$('div.container.grid div.cardCont').append(
        '<div class="col l3 m6 s12">'
	        + '<div class="card idx-' + link.idx + ' grey lighten-4 z-depth-2">'
	          // + '<a href="' + link.url + '">'  // OH GOD NO IT'S AWFUL
		          + '<div class="about">'
		            + '<div class="title">' + tit + '</div>'
		            // + '<div class="details hide-on-small-only">'
		            	// + (link.author != '' ? link.author : '')
		            	// + (link.author != '' && link.subreddit != '' ? ', ' : '')
		            	// + (link.subreddit != '' ? '<i>' + link.subreddit + '</i>' : '')
		            	// + ($.isNumeric(link.score) ? ' ' + link.score + ' pts ' : '')
		            // + '</div>'
		          + '</div>'
		          + '<div class="btns">'
		          	+ '<i class="nix small mdi-content-clear blue-text text-darken-4 hide-on-small-only"></i>'	//  tooltipped" data-position="top" data-tooltip="remove from loaded
		          	+ '<i class="open small mdi-action-open-in-new blue-text text-darken-4 hide-on-small-only"></i>'	//  tooltipped" data-position="top" data-tooltip="open on host
		          + '</div>'
		          + '<div class="thumb">'
		            + '<img class="z-depth-1" src="/img/little_r.png"><br>'
		            + '<div class="details">'
			            + link.source + '<br>'
			            + link.kind
		    	      + '</div>'
		          + '</div>'
		        // + '</a>'
	        + '</div>'
        + '</div>'
	);

	// $('div.container.grid div.content div.cardCont div.card.idx-' + link.idx + ' .tooltipped').tooltip();

	if (listing.length > 0) listing.appendTo($('div.container.grid div.content div.cardCont'));

	if (
		self == top
		|| ($.type(document.referrer) == 'string' && document.referrer.indexOf('http') == 0)
	) { // Check <img> exists and replace the default thumb if it does.
		var _img = $('ul.quickLoad li.idx-' + link.idx + ' span img');
		var _img2 = $('div.container.grid div.card.idx-' + link.idx + ' div.thumb img');

		var newImg = new Image;
		newImg.onload = function() { _img.attr('src', this.src); _img2.attr('src', this.src); }
		newImg.onerror = function() { 
			var src = this.src;
			
			if (src.indexOf('imgur.com/') != -1) {
				if (src.indexOf('lm.jpg') != -1) {	// http://i.imgur.com/o2GeMtQlm.jpg
					src = src.replace('lm.jpg', 'm.jpg');

					_img.attr('src', src); _img2.attr('src', src);
					link.thumb = src;
				}
				else if (src.indexOf('hm.jpg') != -1) {	// http://i.imgur.com/mVyQhUxhm.jpg
					src = src.replace('hm.jpg', 'm.jpg');

					_img.attr('src', src); _img2.attr('src', src);
					link.thumb = src;
				}
				else console.log('imgur missing thumb: ' + src);
			}
		}
		newImg.src = link.thumb;
	}
}



listr.links.batch = false;
listr.links.batchTarget = false;
listr.links.batchLinks = [];
listr.links.batchPush = function(onOff, target) {
	if (target === undefined) var target = 'links';
	listr.links.batch = onOff;

	if (listr.links.batch) {
		listr.links.batchTarget = target;
		
		// accidentally clears related[] when pushing links from there, damneeet!
		// if (target == 'links') { 
		// 	listr.search.list = [];
		// 	listr.related.list = []; 
		// 	// $('#relatedLinks').hide();
		// }

		listr.broadcast({ 'action': 'batchPush', 'target': target, 'val': 'start' });
	}
	else {	// batch pushing switched off, process new results.
		if (target === 'links') {
			if (listr.links.batchLinks.length == 0) {
				if (listr.opts['embedded']) alert('Ooopsie, no valid links were found!' + ENTER + ENTER + 'Try this link on radd.it!  The embedded player doesn\'t support all sites!');
				else alert('Ooopsie, no valid links were found!');
				return;
			}
			else if (listr.opts['shuffleOnLoad']) {
				var len = listr.links.list.length;

				listr.links.batchLinks.shuffle();
				$.each(listr.links.batchLinks, function(i, link) { link.idx = i + len; });		// fix post-shuffle indexes
			}

			// if (listr.links.list.length == 0 && window.size().width > 960 && $('select.jump.virgin').length > 0)
			// 	setTimeout(function() { 
			// 		// $(window).scrollTop(0);
			// 		$('window,body').animate({ scrollTop: 0 }, 2000);

			// 		setTimeout(function() { setTimeout(function() { $('div.quickLoad span.select-dropdown').click(); }); }, 200);
			// 	}, 2000);
		}

		$.each(listr.links.batchLinks, function(idx, link) {
			var dupe = false;		// make sure this isn't a duplicate link.
			if (target == 'search')  $.each(listr.search.list, function(ii, oldLink) { if (link.id_uni == oldLink.id_uni) dupe = true; });
			else if (target == 'related') $.each(listr.related.list, function(ii, oldLink) { if (link.id_uni == oldLink.id_uni) dupe = true; });
			else $.each(listr.links.list, function(ii, oldLink) { if (link.id_uni == oldLink.id_uni) dupe = true; });

			if (!dupe) {
				listr.broadcast({ 'action': 'push', 'target': target, 'link': link });

				if (target == 'search') listr.search.list.push(link);
				else if (target == 'related') listr.related.list.push(link);
				else {
					listr.links.list.push(link);
					listr.links.addRow(link);
				}
			}

			listr.links.batchTarget = false;
		});

		if (target === 'links') {
			$(window).resize();		// calls listr.links.table.draw() to update table

			if ($('div.container.grid').css('display') == 'none' && $('div.container.links').css('display') == 'none') {
				if (listr.opts['showGrid']) $('div.container.grid').show(); else $('div.container.links').show();
				listr.navi.update(); 
			}

			if (
				listr.links.batchLinks.length > 0		// if we added links, load the 'next' link if..
				&& (
					$('div.container.links tr.selected').length === 0	// ..if nothing selected or if called on last loaded link.
					|| $('div.container.links tr.selected').index() === $('div.container.links tr').length - 3
				)
			) setTimeout(function() { listr.links.next(); });
		}

		listr.broadcast({ 'action': 'batchPush', 'target': target, 'val': 'stop' });
		listr.links.batchLinks = [];
	}
}


listr.links.hoverCard = function(pos, link) {
  	$('#hoverCard div.card-image img').attr('src', link.thumb);

  	// serg: add more deets yo
  	var deets = '';

  	if (link.title != '') deets += '<b>' + link.title + '</b>';
  	if (link.kind != '') deets += ' (' + link.kind + ')';

  	if (link.meta.length !== undefined && link.meta.length != '') deets += link.meta.length + ' ';

  	if (link.url != '') deets += '<br><i>' + link.url.replace('https://', '').replace('http://', '').replace('www.', '').substr(0, 30) + (link.url.length > 36 ? '&hellip;' : '') + '</i><br>';
  	// if (link.title != '' || link.url != '' || link.kind != '')
  	deets += '<br>';

  	if (link.author != '' || link.subreddit != '') deets += 'Posted ';
  	if (link.author != '') deets += 'by u/' + link.author;
  	if (link.subreddit != '') {
  		deets += ' to r/' + link.subreddit;
  		if (link.score != 0) deets += '<br>' + link.score + ' pts<br>';
  	} 
  	if (link.author != '' || link.subreddit != '') deets += '<br>';

  	if (link.descrip != '') deets += link.descrip;

  	if (deets.length > 0) $('#hoverCard div.card-content').html(deets).show();
  	else $('#hoverCard div.card-content').html('').hide();

  	$("#hoverCard")
  		.show()
  		.css('left', (pos.x).toString() + 'px')
  		.css('top', (pos.y).toString() + 'px')
  	;
}

$(document).ready(function() {
	setTimeout(function() { listr.broadcast({ 'action': 'init', 'bucket': listr.bucket, 'user': listr.user, 'opts': listr.opts }); });

 	//// Define table cols for this bucket ////////////////////////////////////////
    var cols = [	// default table columns, may be overwritten by bucket.
			{ 'width': '4%' }			// pos
			, { 'width': '50%' }		// title
			, { 'width': '10%' }		// kind
			, { 'width': '10%' }		// author
			, { 'width': '5%' }			// score
			, { 'width': '10%' }		// subreddit
			, { 'width': '10%' }		// source
			, { 'width': '5%' }			// opts
		];

	if (listr.bucket == 'music') 
		cols = [
			{ 'width': '3%' }		// pos
			, { 'width': '20%' }	// artist
			, { 'width': '20%' }	// track
			, { 'width': '15%' }	// genre(s)
			, { 'width': '8%' }		// year
			, { 'width': '8%' }		// length
			, { 'width': '3%' }		// score
			, { 'width': '10%' }	// subreddit
			, { 'width': '10%' }	// domain
			, { 'width': '3%' }		// opts
		];
	else if (listr.bucket == 'vids') 
		cols = [
			{ 'width': '3%' }			// pos
			, { 'width': '50%' }		// title
			, { 'width': '10%' }		// length
			, { 'width': '5%' }			// kind
			, { 'width': '10%' }		// author
			, { 'width': '3%' }			// score
			, { 'width': '10%' }		// subreddit
			, { 'width': '15%' }		// domain
			, { 'width': '3%' }			// opts
		];


 	//// Initialize dataTable /////////////////////////////////////////////////////
	listr.links.table = $('#links').DataTable({
        deferRender : true
		, paging : false
		, scrollY : $(window).height() - 221	// Using window.size().height makes links too small if loaded <320px
		, columns : cols
		// , order: []
    });

 	//// Quicksearch //////////////////////////////////////////////////////////////
 	$('#quick-search-query').click(function() {
 		// clear search query on first click
 		if ($(this).val() == 'Quickload' ) $(this).val('');
 	});	

 	$('a.quick-search-full').click(function() {
		var query = $('#quick-search-query').val();
		if (query == 'Quickload') { alert('First enter your search to the left.'); return; }
		else if (query.length < 3) { alert('Search must be at least 3 characters.'); return; }

		$('#linksAddQry').val(query);
		$('#linksAdd a.linksSearch').click();

		$('#linksAdd').openModal();
		$('#linksAdd div.input-field label').addClass('active');
	});

	$('a.quick-search-go,a.quick-search-random').click(function() {
		var query = $('#quick-search-query').val();
		if (query == 'Quickload') { alert('First enter your search to the left.'); return; }
		else if (query.length < 3) { alert('Search must be at least 3 characters.'); return; }

// console.log('search for: ' + query);	

 		var mode = 'top';
 		if ($(this).hasClass('quick-search-random')) mode = 'random';

 		$('#loading').show();

 		listr.search.list = [];	// clear any existing search results.
 		var sourceCnt = 0;
 		var returnCnt = 0;

 		function processResults(results) {
// console.log(results.length + ' results');
 			if (results.length == 0) { returnCnt++; return; }

			listr.links.batchPush(true, 'search');
			$.each(results, function(i, link) { 
				if (
					(	// if we're browsing music, skip any covers or mashups
						listr.bucket != 'music'
						|| (link.title.toLowerCase().indexOf('cover') == -1 && link.title.toLowerCase().indexOf('mashup') == -1)
					)
				) listr.links.push(link);
			});
			listr.links.batchPush(false, 'search');

 			if (++returnCnt == sourceCnt || (returnCnt + 1 == sourceCnt && listr.search.list.length > 0)) {
// console.log('results', listr.search.list);

				// TODO: loop through results[] and determine the most "fit" link.
				// For now, just load the top one.
				if (listr.search.list.length == 0) alert('No links found!');
				else if (mode == 'top') {
					if (self != top) listr.links.push(listr.search.list[0]);
					else listr.links.load(listr.search.list[0]);
				}
				else if (mode == 'random') {
					var cnt = 0;	// try not to load the same link twice in a row, but don't get stuck in the loop.
					var randLink = listr.search.list.random();
					while (cnt < 3 && randLink.id_uni == listr.links.current.id_uni) {
						randLink = listr.search.list.random();
						cnt++;
					}

					listr.links.load(randLink);
				}

		 		$('#loading').hide();
 			}
 		}

		$.each(listr.sources, function(domain, source) { 
			if ($.inArray(listr.bucket, listr.sources[domain].buckets) != -1) {
				sourceCnt++;
				source.search(query, processResults);
			}
		});
 	});

 	//// Link "explode" buttons to sources when clicked ////////////////////////////
	$('a.explode').click(function() { listr.sources[listr.links.current.key].explode(listr.links.current.url) });

 	//// Link "seek" progress to sources when clicked ////////////////////////////
	$('div.container.media div.opts div.progressBar').click(function(event) {
		var barWidth = $('div.progressBar').width();
		if (barWidth > 0) {
			// $('#progress').width(event.offsetX);
			$('#progress').stop().animate({'width': event.offsetX }, 100, 'linear');
			listr.sources[listr.links.current.key].seek(event.offsetX / barWidth);
		}
	});


	$('div.container.media div.opts').on('click', 'a.addFeed', function(event) {
		event.preventDefault();
		$('#addFeed').openModal();

		setTimeout(function() {
			$('#addfeed-direct-url').val('/r/' + listr.links.current.subreddit);
			$('#addFeed div.step1').hide();
			$('a.addfeed-direct').click();
		});
	});

	// Automatically load net set of links if user scrolls to the bottom
	$('ul.quickLoad').scroll(function(event) {
		if ($('ul.quickLoad li:last').offset().top < $('ul.quickLoad').height() * 2)
			$('ul.quickLoad li.listing:first').click();
	});

/*
	$('a.addFeed').mouseover(function() {
		setTimeout(function() {
			var ele = $('div.material-tooltip[style*="display: block"]');
			var html = ele.html();
			if (html === undefined || html.indexOf(' to feeds') == -1) return;

			html = 'add /r/' + listr.links.current.subreddit + html.substr(html.indexOf(' to feeds'));
			ele.html(html);
		}, 900);
	});
*/

/*
	$('div.container.media span.btns a.visualizer').click(function() {
		if ($('#visualizer').length == 0) {	// Show it.
			$('div.container.media span.btns a.visualizer').addClass('blue-grey').removeClass('grey');
			$('div.container.media div.content').append('<div class="media-dsp"  id="visualizer"><iframe src="/viz"></iframe></div>');
			$(window).resize();
		}
		else {	// Remove it.
			$('div.container.media span.btns a.visualizer').addClass('grey').removeClass('blue-grey');
			$('#visualizer').remove();
		}
	});
*/

	// $('div.container.media span.btns a.autoskip').click(function() {
		// moved to a.next
		// if (!listr.links.autoskip) {
		// 	$('div.container.media span.btns a.autoskip').addClass('blue-grey').removeClass('grey');
			
		// 	listr.links.autoskip = setTimeout(function() { listr.links.next(); }, listr.links.autoskipMS);
		// }
		// else {
		// 	$('div.container.media span.btns a.autoskip').addClass('grey').removeClass('blue-grey');

		// 	clearTimeout(listr.links.autoskip);
		// 	listr.links.autoskip = false;
		// }
	// });

 	//// Click <tr> to load a link from the table /////////////////////////////////
    $('#links tbody').on('click', 'tr', function () {
        var row = listr.links.table.row(this).data();
        if (row !== undefined) {
	        listr.links.table.$('tr.selected').removeClass('selected');
	        $(this).addClass('selected');

	        // scroll table to move clicked track to top of the list
			$('div.container.links div.dataTables_scrollBody').animate({
				scrollTop: $('div.container.links div.dataTables_scrollBody').scrollTop() + $('#links tr.selected').position().top - $('#links tr.selected').height() * 2
			}, 250);

			// $(this).find('span.rand').text('0');

	        var pos = $(this).find('i.pos').text();
	        setTimeout(function() { listr.links.load(pos); });
        }
    });

	//// Recreate quickload on sort ///////////////////////////////////////////////
	$('div.container.links div.dataTables_scrollHead').click(function(event) {
// console.log('scrollHead click');
		if ($(event.target).hasClass('shuffle')) {
			listr.opts['shuffleOnLoad'] = !listr.opts['shuffleOnLoad'];

			if (listr.opts['shuffleOnLoad']) {
				$('th.shuffle i').addClass('blue-grey');
				$('a.togShuffle').addClass('blue-grey').removeClass('grey');
				
				var loaded = listr.links.list.splice(listr.links.current.idx + 1, listr.links.list.length - listr.links.current.idx - 1);

				listr.links.batchPush(true);
				$.each(loaded, function(i, link) { listr.links.push(link); });
				listr.links.batchPush(false);

				listr.links.update();
			}
			else {
				$('th.shuffle i').removeClass('blue-grey');
				$('a.togShuffle').addClass('grey').removeClass('blue-grey');
			}
		}
		else setTimeout(function() { listr.links.quickloadRefresh(); });
	})

	// Prevent sort on options column.
	$('th.shuffle').unbind('click');

	// Add depth to table.
	$('#links_wrapper').addClass('z-depth-1');


	//// Drag to resort table /////////////////////////////////////////////////////
/*
	$('#links tbody').sortable({
		'containment': 'tbody'
		, 'opacity': 0.666 
		, update: function(event, ui) { 
			var li = $(ui.item[0]);
			var liTop = li.position().top;
			var ulTop = $('#links_wrapper div.dataTables_scrollBody').scrollTop();

			var nPos = li.index();
			var oPos = false;
			$('#links tr').not(':eq(0)').each(function(i, ele) {
				var top = $(ele).position().top + ulTop + 10;	// +10 for a little leeway
				if (oPos === false && top >= ui.originalPosition.top) oPos = i;
			});

// console.log('from ' + oPos + ' to ' + nPos);

			if (ui.position.top > ui.originalPosition.top && nPos === oPos) nPos++;

			if (nPos > oPos) {	// move down
				for (var i = oPos; i < nPos; i++) {
				    var row1Data = listr.links.table.row(i).data();
				    var row2Data = listr.links.table.row(i + 1).data();
				    listr.links.table.row(i).data(row2Data);
				    listr.links.table.row(i + 1).data(row1Data);
				}
			}
			else {	// move up
				for (var i = oPos; i > nPos; i--) {
				    var row1Data = listr.links.table.row(i).data();
				    var row2Data = listr.links.table.row(i - 1).data();
				    listr.links.table.row(i).data(row2Data);
				    listr.links.table.row(i - 1).data(row1Data);
				}
			}

		    if (li.hasClass('active')) {
		        listr.links.table.$('tr.selected').removeClass('selected');
		        listr.links.table.$('tr:eq(' + nPos + ')').addClass('selected');
		    }

			listr.links.table.draw(false);
			listr.links.quickloadRefresh(); 
		}
	})
*/
    $('div.grid div.content div.cardCont').on('click', 'div.card div.btns i.open', function (e) {
		var idx = -1;
	    var classList = $(this).parent('div').parent('div.card').attr('class').split(/\s+/);
	    $.each(classList, function(index, label) { if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', '')); });

	    if (idx != -1 && listr.links.list[idx] !== undefined) window.open(listr.links.list[idx].url, '_blank');
    });

	//// Show/ hide hovercard /////////////////////////////////////////////////////
    $('div.grid div.content div.cardCont').on('mouseover', 'div.card div.thumb img', function (e) {
    	if ($('#hoverCard:visible').length > 0) return;

		var idx = -1;
	    var classList = $(this).parent('div').parent('div.card').attr('class').split(/\s+/);
	    $.each(classList, function(index, label) { if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', '')); });

		// var offX = $('#hoverCard').width() * -0.5;
		var offY = $('#hoverCard').height() * -0.666;
		if ($('div.container.media').css('display') != 'none') offY += $('div.container.media').height();

		// check upper/ lower bounds
		if (e.clientY + offY < $('div.container.grid').position().top)
			offY = $('div.container.grid').position().top - e.clientY;
		else if (e.clientY + offY + $('#hoverCard').height() > $('div.container.grid').position().top + $(window).height())
			offY = $('div.container.grid').position().top + $(window).height() - e.clientY - $('#hoverCard').height() - ($(window).height() / 20);

		var offX = 0;
		if (e.pageX + $('#hoverCard').width() + 48 < $(window).width())
			offX = e.pageX + 32;
		else
			offX = e.pageX - $('#hoverCard').width() - 48;

	    if (offX > 0 && idx != -1) listr.links.hoverCard({'x': offX, 'y': e.clientY + offY}, listr.links.list[idx]);
    });

    $('div.grid div.content div.cardCont').on('mouseout', 'div.card', function (e) { 
// console.log(e.target);    	
    	// if (!$(e.target).is('img') && $(e.target).attr('id') != 'hoverCard')
    	$("#hoverCard").hide(); 
    });

    $('#hoverCard').click(function () { $('#hoverCard').hide(); });

    $('#links tbody').on('mouseover', 'tr td i.about', function (e) {
        var row = listr.links.table.row($(this).parents('tr')).data();
        var pos = parseInt($('<div/>').html(row[0]).find('.pos').text());	// get 'pos' from <i> in first column
    	if (listr.links.list[pos] === undefined) pos = parseInt($('<div/>').html(row[1]).find('.pos').text()); // if not, second...

    	if (listr.links.list[pos] === undefined || $(window).width() < 321) return;

		var offX = -365;
		var offY = $('#hoverCard').height() * -0.666;
		if ($('div.container.media').css('display') !== 'none') offY += $('div.container.media').height();

		// check upper/ lower bounds
		if (e.clientY + offY < $('div.container.links').position().top)
			offY = $('div.container.links').position().top - e.clientY;
		else if (e.clientY + offY + $('#hoverCard').height() > $('div.container.links').position().top + $(window).height())
			offY = $('div.container.links').position().top + $(window).height() - e.clientY - $('#hoverCard').height() - ($(window).height() / 20);

		listr.links.hoverCard({'x': e.clientX + offX, 'y': e.clientY + offY}, listr.links.list[pos]);
    });

    $('#links tbody').on('mouseout', 'tr td', function () { $("#hoverCard").hide(); });

	//// Remove link when X is clicked /////////////////////////////////////////////
    $('div.grid div.content div.cardCont').on('click', 'div.card div.btns i.nix', function () {
    	event.stopPropagation();	// prevent this click from triggering link play

		var idx = -1;
	    var classList = $(this).parent('div').parent('div.card').attr('class').split(/\s+/);
	    $.each(classList, function(index, label) { if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', '')); });

    	if (idx != -1) { // && confirm('Remove ' + listr.links.list[idx].title + ' from links?')) {
			var listing = $('ul.quickLoad li.listing');
			if (listing.length > 0) listing.detach();

			$('ul.quickLoad li,div.grid div.cardCont div.card').remove();		// clear quickload and grid
    		listr.links.table.rows().remove();									// clear table

    		listr.links.list.splice(idx, 1);									// remove this link and update all idx's after it
    		var len = listr.links.list.length;
    		for (var i = idx; i < len; i++) listr.links.list[i].idx = listr.links.list[i].idx - 1;

    		$.each(listr.links.list, function(i, link) { listr.links.addRow(link); });		// repopulate table
			listr.links.table.draw(false);

			if (listing.length > 0) listing.appendTo($('ul.quickLoad'));
			$('ul.quickLoad li.idx-' + listr.links.current.idx).addClass('active');

			if (idx === listr.links.current.idx) 
				$('#links tbody tr:eq(' + idx + ')').click();		// Current track deleted, load its replacement.
			else													// Otherwise, just re-mark what's active.
				$('#links tbody tr:eq(' + listr.links.current.idx + ')').addClass('selected');
    	}
    });

    $('#links tbody').on('click', 'tr td i.nix', function () {
    	event.stopPropagation();	// prevent this click from triggering link play

    	var idx = parseInt($(this).parent('td').parent('tr').find('i.pos').text());
    	if (listr.links.list[idx] !== undefined) { // } (confirm('Remove ' + listr.links.list[idx].title + ' from links?')) {
			var listing = $('ul.quickLoad li.listing');
			if (listing.length > 0) listing.detach();

			$('ul.quickLoad li,div.grid div.cardCont div.card').remove();				// clear quickload & grid
    		listr.links.table.rows().remove();									// clear table

    		listr.links.list.splice(idx, 1);									// remove this link and update all idx's after it
    		var len = listr.links.list.length;
    		for (var i = idx; i < len; i++) listr.links.list[i].idx = listr.links.list[i].idx - 1;

    		$.each(listr.links.list, function(i, link) { listr.links.addRow(link); });		// repopulate table
			listr.links.table.draw(false);

			if (listing.length > 0) listing.appendTo($('ul.quickLoad'));
			$('ul.quickLoad li.idx-' + listr.links.current.idx).addClass('active');

			if (idx === listr.links.current.idx) 
				$('#links tbody tr:eq(' + idx + ')').click();		// Current track deleted, load its replacement.
			else													// Otherwise, just re-mark what's active.
				$('#links tbody tr:eq(' + listr.links.current.idx + ')').addClass('selected');
    	}
    });

	//////// links edit opts /////////////////////////
	// $('div.container.links div span.opts a.edit').click(function() {
	// 	if ($('div.container.links div span.opts span.hidden').css('display') == 'none')
	// 		$('div.container.links div span.opts span.hidden').show('slide');
	// 	else 
	// 		$('div.container.links div span.opts span.hidden').hide('slide');
	// });

	$('span.btns a.prev').click(function() {
		if ($(this).hasClass('clicked')) {	// double-clicked
			$(this).removeClass('clicked');

			setTimeout(function() { $('#links tr:eq(1)').children('td').eq(0).click(); });
		}
		else {
			$(this).addClass('clicked');

			setTimeout(function() {
				if ($('span.btns a.prev').hasClass('clicked')) {	// single-clicked
					$('span.btns a.prev').removeClass('clicked');

			    	var idx = parseInt($('#links tr.selected').find('i.pos').text());

			    	if (listr.links.list[idx] === undefined)  $('#links tr').eq(1).children('td').eq(0).click();
			    	else if (listr.links.current.url != listr.links.list[idx].url) $('#links tr.selected').children('td').eq(0).click();
					else if ($('#links tr.selected').prev().index() >= 0) $('#links tr.selected').prev().children('td').eq(0).click();
				}
			}, 250);
		}

		window.getSelection().removeAllRanges();	// unselect anything clicking may have highlighted
	});

	$('span.btns a.next').click(function() {
		if ($('span.btns a.next.clicked').length > 0) {	// double-clicked	removed: !listr.links.fromNext && 
			$('span.btns a.next.clicked').removeClass('clicked');

			// setTimeout(function() { $('div.quickLoad span.select-dropdown').click(); });
			if (!!listr.links.autoskip) {
				$('span.btns a.next').addClass('grey').removeClass('green');

				clearTimeout(listr.links.autoskip);
				listr.links.autoskip = false;
			}
			else {
				$('span.btns a.next').addClass('green').removeClass('grey');
				
				listr.links.autoskip = setTimeout(function() { listr.links.next(); }, listr.links.autoskipMS);
			}

		}
		else {
			$('span.btns a.next').not('.clicked').addClass('clicked');

			setTimeout(function() {
				if ($('span.btns a.next.clicked').length > 0) {	// single-clicked
					$('span.btns a.next.clicked').removeClass('clicked');

					if ($('div.container.links tr.selected').length == 0)						// nothing selected, load first link.
						$('#links tr:eq(1) td:eq(0)').click();
					else if ($('#links tr.selected').next().children('td').eq(0).length > 0)	// play next
						$('#links tr.selected').next().children('td').eq(0).click();	
					else if ($("div.container.links div.listings a:eq(0)").length > 0)			// no more links, load the first listing
						$("div.container.links div.listings a:eq(0)").click();
					else listr.links.stop();				
				}
			}, 333);
		}

		// listr.links.fromNext = false;
		window.getSelection().removeAllRanges();	// unselect anything clicking may have highlighted
	});

/*
	$('div.container.media div.opts,#naviDown,ul.quickLoad').bind('mouseover', function(event) {
		if (listr.links.optsTimer === null) return;

		clearTimeout(listr.links.optsTimer);
		listr.links.optsTimer = null;
		listr.opts.aboutMax = true;

		var size = window.size();

		$('#relatedLinks').animate({'bottom': '4px'}, 250);
		$('#naviDown').animate({'bottom': '-16px'}, 250);
		$('.media-dsp:visible').animate({ 'height': (size.height - 64) }, 250);
		$('.media-dsp').not(':visible').height(size.height - 64);		$('#relatedLinks').animate({'bottom': '4px'}, 250);
	});
*/

	$('span.btns a.pause').click(function() {
		// var key = listr.links.current.domain;
		// if (listr.sources[key] === undefined) key = listr.current.ext;

		if (listr.bucket != 'pics' && listr.bucket != 'eyecandy' && listr.bucket != 'ladycandy') 
			listr.sources[listr.links.current.key].pause(true);

		listr.broadcast({ 'action': 'pause', 'target': 'links', 'link': listr.links.current });
		$('span.btns a.pause').hide();
		$('span.btns a.resume').show();
	});
	
	$('span.btns a.resume').click(function() {
		// var key = listr.links.current.domain;
		// if (listr.sources[key] === undefined) key = listr.current.ext;

		listr.sources[listr.links.current.key].pause(false);
		listr.broadcast({ 'action': 'resume', 'target': 'links', 'link': listr.links.current });
		$('span.btns a.resume').hide();
		$('span.btns a.pause').show();
	});
	
	$('nav span.select-dropdown').click(function(event) {
		var ql = $('ul.quickLoad');

		event.stopPropagation();	// IM POR TANT!!!
		if (listr.links.list.length == 0) { setTimeout(function() { $('ul.quickLoad').stop(); $('body').click(); }); return; }

		if (!ql.hasClass('virgin') && ql.hasClass('keepOpen')) {	// close quickload menu
			$('div.container.media div.content').css('max-width', '').children('div,iframe').css('max-width', '');
			$('div.navBtns a:last').removeClass('darken-2').addClass('darken-4');

			ql.removeClass('keepOpen');
			setTimeout(function() { $('body').click(); });

			// also minimize 'about' panel
			setTimeout(function() { $('a.aboutMin:visible').click(); }, 225);

			$.cookie(listr.bucket + '|showQuick', 'false');
		}
		else {	// open quickload menu
			$('select.jump.virgin').removeClass('virgin');
			$('div.navBtns a:last').removeClass('darken-4').addClass('darken-2');

			setTimeout(function() {
				// if (ql.css('opacity') == 1) setTimeout(function() { $('body').click(); });
				// else {
					ql.stop().css({ 
						'overflow-y': 'auto'
						, width : '320px'
						, height: '0px'
						, 'max-height': '0px'
						, left: ''
						, right: '0'
						, position: 'absolute'
						, display: 'block'
					});

					var size = window.size();
					if (size.halfSize) size.height *= 2;

					if (size.width > 960) {
						$('div.container.media div.content').css('max-width', (size.width - 320) + 'px').children('div,iframe').css('max-width', (size.width - 320) + 'px');
						ql.addClass('keepOpen'); 

						$.cookie(listr.bucket + '|showQuick', 'true');
					}

					if ($('ul.quickLoad li.idx-' + listr.links.current.idx).length > 0)
						ql.animate({	// move materalize's select-replacement so it's on-screen.
							height : size.height - 66
							,'max-height' : size.height - 66

							, scrollTop: 
								$('ul.quickLoad').scrollTop()
								+ $('ul.quickLoad li.idx-' + listr.links.current.idx).position().top 
								- (size.height / 4)
								+ 75
						}, 333);
					else
						ql.animate({	// move materalize's select-replacement so it's on-screen.
							height : size.height - 66
							,'max-height' : size.height - 66
						}, 333);

				// }
			});
		}
	});

	$('div.grid div.cardCont').on('click', 'div.card', function(event) {
		if ($(event.target).hasClass('nix') || $(event.target).hasClass('append') || $(event.target).hasClass('open')) return;

		if ($(this).hasClass('listing')) {
		    var classList = $(this).attr('class').split(/\s+/);
			var listing = -1;	
		    $.each(classList, function(index, label) { if (label.indexOf('listing-') == 0) listing = parseInt(label.replace('listing-', '')); });
		    if (listr.listings.list[listing] === undefined) { console.log('ERROR: no listing data for ' + listing); return; }

		    if (listing == -1) console.log('ERROR: listing not found for quickload');
			else $('div.listings a:eq(' + listing + ')').click();
		}
		else { // if (listr.links.list[idx - 1] !== undefined) 
		    var classList = $(this).attr('class').split(/\s+/);
			var idx = -1;
		    $.each(classList, function(index, label) { if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', '')); });

		    if (idx == -1) console.log('ERROR: idx not found for quickload');
		    else $('#links tbody tr td').find('i.idx-' + idx).parent('td').parent('tr').click();
		}
	});

	$('ul.quickLoad').on('click', 'li', function() {
		if ($(this).hasClass('listing')) {
		    var classList = $(this).attr('class').split(/\s+/);
			var listing = -1;	
		    $.each(classList, function(index, label) { if (label.indexOf('listing-') == 0) listing = parseInt(label.replace('listing-', '')); });
		    if (listr.listings.list[listing] === undefined) { console.log('ERROR: no listing data for ' + listing); return; }

		    if (listing == -1) console.log('ERROR: listing not found for quickload');
			else $('div.listings a:eq(' + listing + ')').click();
		}
		else { // if (listr.links.list[idx - 1] !== undefined) 
		    var classList = $(this).attr('class').split(/\s+/);
			var idx = -1;
		    $.each(classList, function(index, label) { if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', '')); });

		    if (idx == -1) console.log('ERROR: idx not found for quickload');
		    else $('#links tbody tr td').find('i.idx-' + idx).parent('td').parent('tr').click();
		}
	});

	// $('a.nixAllLinks').click(function() { listr.links.clear(); });
	$('a.togShuffle').click(function(event) {
		setTimeout(function() { $('th.shuffle').click(); });
		event.preventDefault();
	});

	$('a.togLinks').click(function(event) {
		$('div.container.options div.' + listr.bucket + ' div.showGrid input[display!="none"]').click();
		event.preventDefault();
	});

	$('a.nixLinks').click(function() {
		// if (confirm("Remove all loaded links?")) listr.links.clear(); 
		var kinds = [];
		var domains = [];
		$.each(listr.links.list, function(idx, link) {
			if (link.kind != '' && $.inArray(link.kind, kinds) === -1) kinds.push(link.kind);
			if (link.domain != '' && $.inArray(link.domain, domains) === -1) domains.push(link.domain);
		});

		var html = '';
		$.each(kinds, function(i, opt) {
			html += '<a onclick="listr.links.clear({\'kind\':\'' + opt + '\'});" class="waves-effect waves-light btn-large darken-2"><i class="mdi-content-clear left"></i>Remove ' + opt + 's</a>';
		});

		$.each(domains, function(i, opt) {
			html += '<a onclick="listr.links.clear({\'domain\':\'' + opt + '\'});" class="waves-effect waves-light btn-large darken-2"><i class="mdi-content-clear left"></i>Remove ' + opt + '</a>';
		});

		$('#nixLinks span.options').html(html);
	});

	$('div.container.links div.opts a.addLink').click(function() { $('#linksAdd input').focus(); });

	$('#linksAdd a.linksSearch').click(function() { var query = $('#linksAdd input').val(); listr.links.search(query); });

	// Now handled in generic keypress() handler.
	// $('#linksAdd').on('keydown', 'input', function(e) { if(e.keyCode == 13) { e.preventDefault(); $('a.linksSearch').click(); } });

    $("div.container.media div.opts span." + listr.bucket).show();
});

$(window).resize(function() {
	var size = window.size();

	if (listr.links.table === null) return;		// do nothing if DataTable isn't initialized

	// show/ hide table colums to fit width ///////////////////////////////////////////////////////
	// if (size.width < 340) {
	if (size.halfSize) {
		$('#links_filter,div.container.media div.qsCont,div.container.media div.afterCont').hide();	// removed: ,div.container.media div.opts span.title
		// $('#relatedLinks').hide();

		if (listr.bucket === 'music') {
			// pos
			listr.links.table.columns(1).visible(false);	// artist
			// title
			listr.links.table.columns(3).visible(false);	// genre
			listr.links.table.columns(4).visible(false);	// year
			listr.links.table.columns(5).visible(false);	// length
			listr.links.table.columns(6).visible(false);	// score
			listr.links.table.columns(7).visible(false);	// subreddit
			listr.links.table.columns(8).visible(false);	// domain
			listr.links.table.columns(9).visible(false);	// opts
		}
		else if (listr.bucket === 'vids') {
			// pos
			// title
			listr.links.table.columns(2).visible(false);	// length
			listr.links.table.columns(3).visible(false);	// kind
			listr.links.table.columns(4).visible(false);	// author
			listr.links.table.columns(5).visible(false);	// score
			listr.links.table.columns(6).visible(false);	// subreddit
			listr.links.table.columns(7).visible(false);	// domain
			listr.links.table.columns(8).visible(false);	// opts
		}
		else {
			// 0 - pos
			// 1 - title
			listr.links.table.columns(2).visible(false);	// kind
			listr.links.table.columns(3).visible(false);	// author
			listr.links.table.columns(4).visible(false);	// score
			listr.links.table.columns(5).visible(false);	// subreddit
			listr.links.table.columns(6).visible(false);	// source
			listr.links.table.columns(7).visible(false);	// opts
		}
	}
	else if (size.width < 600) {
		$('#links_filter,div.container.media div.qsCont').hide();
		$('div.container.media div.afterCont').show();
		// $('#relatedLinks').hide();

		// $('#links_filter').hide();
		// $('div.container.media div.opts span.title').show();

		if (listr.bucket === 'music') {
			// pos
			listr.links.table.columns(1).visible(true);		// artist
			// title
			listr.links.table.columns(3).visible(false);	// genre
			listr.links.table.columns(4).visible(false);	// year
			listr.links.table.columns(5).visible(false);	// length
			listr.links.table.columns(6).visible(false);	// score
			listr.links.table.columns(7).visible(false);	// subreddit
			listr.links.table.columns(8).visible(false);	// domain
			listr.links.table.columns(9).visible(true);		// opts
		}
		else if (listr.bucket === 'vids') {
			// pos
			// title
			listr.links.table.columns(2).visible(true);		// length
			listr.links.table.columns(3).visible(false);	// kind
			listr.links.table.columns(4).visible(false);	// author
			listr.links.table.columns(5).visible(false);	// score
			listr.links.table.columns(6).visible(false);	// subreddit
			listr.links.table.columns(7).visible(false);	// domain
			listr.links.table.columns(8).visible(true);		// opts
		}
		else {
			// 0 - pos
			// 1 - title
			listr.links.table.columns(2).visible(false);	// kind
			listr.links.table.columns(3).visible(false);	// author
			listr.links.table.columns(4).visible(false);	// score
			listr.links.table.columns(5).visible(false);	// subreddit
			listr.links.table.columns(6).visible(false);	// source
			listr.links.table.columns(7).visible(true);		// opts
		}
	}
	else if (size.width < 960) {
		$('#links_filter,div.container.media div.qsCont').hide();
		$('div.container.media div.afterCont').show();

		// $('#relatedLinks').css({ 'left': '4px' });
		// if (listr.related.list.length > 0) $('#relatedLinks').show();

		// $('div.container.media div.opts span.title').show();

		if (listr.bucket === 'music') {
			// pos
			listr.links.table.columns(1).visible(true);		// artist
			// title
			listr.links.table.columns(3).visible(true);		// genre
			listr.links.table.columns(4).visible(true);		// year
			listr.links.table.columns(5).visible(true);		// length
			listr.links.table.columns(6).visible(false);	// score
			listr.links.table.columns(7).visible(false);	// subreddit
			listr.links.table.columns(8).visible(false);	// domain
			listr.links.table.columns(9).visible(true);		// opts
		}
		else if (listr.bucket === 'vids') {
			// pos
			// title
			listr.links.table.columns(2).visible(true);		// length
			listr.links.table.columns(3).visible(true);		// kind
			listr.links.table.columns(4).visible(false);	// author
			listr.links.table.columns(5).visible(false);	// score
			listr.links.table.columns(6).visible(false);	// subreddit
			listr.links.table.columns(7).visible(true);		// domain
			listr.links.table.columns(8).visible(true);		// opts
		}
		else {
			// 0 - pos
			// 1 - title
			listr.links.table.columns(2).visible(true);		// kind
			listr.links.table.columns(3).visible(false);	// author
			listr.links.table.columns(4).visible(true);		// score
			listr.links.table.columns(5).visible(false);	// subreddit
			listr.links.table.columns(6).visible(false);	// source
			listr.links.table.columns(7).visible(true);		// opts
		}
	}
	else {
		$('#links_filter,div.container.media div.qsCont,div.container.media div.afterCont').show();

		if (listr.bucket === 'music') {
			// pos
			listr.links.table.columns(1).visible(true);		// artist
			// title
			listr.links.table.columns(3).visible(true);		// genre
			listr.links.table.columns(4).visible(true);		// year
			listr.links.table.columns(5).visible(true);		// length
			listr.links.table.columns(6).visible(true);		// score
			listr.links.table.columns(7).visible(true);		// subreddit
			listr.links.table.columns(8).visible(true);		// domain
			listr.links.table.columns(9).visible(true);		// opts
		}
		else if (listr.bucket === 'vids') {
			// pos
			// title
			listr.links.table.columns(2).visible(true);		// length
			listr.links.table.columns(3).visible(true);		// kind
			listr.links.table.columns(4).visible(true);		// author
			listr.links.table.columns(5).visible(true);		// score
			listr.links.table.columns(6).visible(true);		// subreddit
			listr.links.table.columns(7).visible(true);		// domain
			listr.links.table.columns(8).visible(true);		// opts
		}
		else {
			// 0 - pos
			// 1 - title
			listr.links.table.columns(2).visible(true);		// kind
			listr.links.table.columns(3).visible(true);		// author
			listr.links.table.columns(4).visible(true);		// score
			listr.links.table.columns(5).visible(true);		// subreddit
			listr.links.table.columns(6).visible(true);		// source
			listr.links.table.columns(7).visible(true);		// opts
		}
	}

	setTimeout(function() { listr.links.table.draw(false); });

	// re-fit quickload menu and/ or media
	if (size.width < 960) {
		if ($('ul.quickLoad.keepOpen').length > 0) {
			$('ul.quickLoad.keepOpen').removeClass('keepOpen');
			$('div.container.media div.content').css('max-width', '').children('div,iframe').css('max-width', '');
		}
	}
	else if ($('ul.quickLoad').css('display') !== 'none') {
		$('ul.quickLoad').not('.keepOpen').addClass('keepOpen');
        $('div.container.media div.content').css('max-width', (size.width - 320) + 'px').children('div,iframe').css('max-width', (size.width - 320) + 'px');
	}

	$('ul.quickLoad').css({ height: size.height - 62, 'max-height': size.height - 62 });
});


// Updates the table to display new data.  
// If link is provided, just updates that row.  Otherwise, updates the entire table.
listr.links.update = function(link) {
	if (link === undefined) var link = false;
	else if ($.isNumeric(link)) link = listr.links.list[link];

	if (link) {		// Update a single link.
		// is it a "found link" that's being updated?
		if ($('#relatedLinks li.idx-' + link.idx).length > 0)
		{
			var ele = $('#relatedLinks li.idx-' + link.idx);
			ele.children('a').html(link.title);

/*
			var fcont = $('div.container.about div.links div.link-dsp.idx-' + link.idx);

			var found = false;
			$.each(listr.related.list, function(i, flink) {
				if (flink.idx === link.idx) found = flink;
			});

			if (found) {
				fcont.find('.thumb').attr('src', link.thumb);
				fcont.find('.title').html(link.title);
				// fcont.find('.descrip').html(link.descrip);
			}
			// else console.log('ERROR: no related link found', link);
*/
		}

		// Is it a search result that's being updated?  Do nothing (for now.)
		else if ($('#linksAdd div.results div div.idx-' + link.idx).length > 0) { }	

		// Nope, it's a link in the table being updated.
		else if ($('#links tr td i.idx-' + link.idx).length > 0)
		{
			var row = listr.links.table.row(link.idx);
			if (row === undefined) return;

			var icon = 'mdi-action-info-outline'; 
			if (!link.active) {
				icon = 'mdi-alert-warning';	// if we're updating due to the link being marked !active, use a different icon.
				// $('ul.quickLoad li.idx-' + link.idx).remove();		// Remove it from the quickload since it's a dead link.
				$('ul.quickLoad li.idx-' + link.idx).css('color', 'lightgrey');
			}
			else {
				var $li = $('ul.quickLoad li.idx-' + link.idx);
				// $li.css('background-color', '');	// in case marked inactive before?

				if ($li.length > 0) {
					var tit = link.title.htmlDecode();
					if (listr.bucket === 'music') {
						if (link.meta.artist != '')
							tit = 
								'<b>' + link.meta.artist + '</b><br><i>' + link.meta.track + '</i>'
								+ (link.meta.genre != '' ? '<br><span class="capitalize">' + link.meta.genre.replace(/<br>/g, '/ ').replace(/,/g, '/ ').replace(/ \/ /g, '/ ') + '</span>' : '')
								+ (link.meta.year != '' ? '<br>' + link.meta.year : '')
							;
						else tit = tit.replace(' [', '<br>[').replace('] (', ']<br>(').replace('](', ']<br>(');
					}

					$li.children('span').html('<img class="thumb" src="' + link.thumb + '">' + tit);

					listr.broadcast({ 'action': 'update', 'target': 'links', 'link': link });
				}
			}

			if (listr.bucket === 'music')
				row.data([
					'<i class="pos idx-' + link.idx + '">' + link.idx + '</i>'
					, link.meta.artist
					, link.meta.track
					, link.meta.genre
					, link.meta.year
					, ($.isNumeric(link.meta.length) ? link.meta.length.toMMSS() : link.meta.length)
					, link.score
					, link.subreddit
					, link.source
					, '<i class="about mdi-action-info-outline"></i><i class="nix mdi-action-highlight-remove"></i>'
				]).draw(false);
			else if (listr.bucket === 'vids')
				row.data([
					'<i class="pos idx-' + link.idx + '">' + link.idx + '</i>'
					, link.title
					, ($.isNumeric(link.meta.length) ? link.meta.length.toMMSS() : link.meta.length)
					, link.kind
					, link.author
					, link.score
					, link.subreddit
					, link.source
					, '<i class="about mdi-action-info-outline"></i><i class="nix mdi-action-highlight-remove"></i>'
				]).draw(false);
			else
				row.data([
					'<i class="pos idx-' + link.idx + '">' + link.idx + '</i>'
					, link.title
					, link.kind
					, link.author
					, link.score
					, link.subreddit
					, link.source
					, '<i class="about mdi-action-info-outline"></i><i class="nix mdi-action-highlight-remove"></i>'
				]).draw(false);
		}
		// else it's a rejected duplicate link.
		// else console.log('ERROR: unknown idx for update', link);

		// Is link what's currently loaded?  If so, update the titles.
		if (link.idx == listr.links.current.idx && link.id_uni == listr.links.current.id_uni)
		{
			if (self == top) document.title = 'radd.it: ' + link.title;		// Set title if not in an <iframe>.
			$("div.container.media div.section.opts .title h4,nav span.title").text(link.title);

			//// Update quicksearch depending on current bucket.
			if (listr.bucket === 'music' && link.meta.artist.length > 0) $('#quick-search-query').val(link.meta.artist);
			else if (!link.title.isBadTitle()) $('#quick-search-query').val(link.title.firstProperNoun());
		}
	}
	else { // Update entire table.
		listr.links.table.rows().remove();
		$.each(listr.links.list, function(i, link) { listr.links.addRow(link); });
		listr.links.table.draw(false);
		// $('ul.quickLoad,div.grid div.cardCont').html('');

		listr.links.quickloadRefresh();
	}
}

////// links load/ play/ blah blah controls ///////////////////////////////////////////////
listr.links.load = function(link) {
	if ($.isNumeric(link)) {
		// else {
			var idx = -1;
			$.each(listr.links.list, function(i, cur) { 
				if (cur.idx == link) idx = i;
			});

			if (idx != -1) link = listr.links.list[idx];
			else if (listr.links.list[link] !== undefined) link = listr.links.list[link];
		// }
	}
// console.log('load', link);

	var key = link.domain;
	if (listr.sources[key] === undefined) key = link.ext;
	if (listr.sources[key] === undefined)	// skip link if we have no source or ext handler
		{ console.log('LOAD ERROR, no source for ' + link.domain + ' or ext for ' + link.ext, link); listr.links.next(); return; }

	////// Check link properties against user options. ///////////////////////////////////////
	try {	// try..catch() since link.meta.nsfw may not exist.
		if (
			!link.active 				// skip link if it's been marked inactive (deleted vids, etc.)
			|| (!listr.opts['allowNoStream'] && !listr.sources[key]._streams)	// does user just want what streams/ skips automatically?
		 	|| (!listr.opts['allowAds'] && listr.sources[key]._ads) 			// does user just sites w/out ads?
			|| (!listr.opts['allowNSFW'] && link.meta.nsfw)						// does user not want links marked NSFW?
		) { 		// Failed, skip to next link.
			listr.broadcast({ 'action': 'reject', 'target': 'links', 'link': link });
			listr.links.next(); 
			return; 
		}

		if (document.location.protocol == 'https:' && !listr.sources[key]._https) // Are we on HTTPS?  Does source support it?
		{
			listr.broadcast({ 'action': 'reject', 'target': 'links', 'link': link });

			link.descrip = 'HTTPS not supported.';
			link.active = false;
			listr.links.update(link);
			listr.links.next();
			return; 
		}
	}
	catch (e) { }

	//////////// hide/ stop any open media /////////////////////////////////////////////////
	listr.links.stop();				// calls stop() functions for all initialized sources

	// Media passes all the requirements, update the 'current' link
	listr.links.current = link;		// Has to be done /before/ calling related functions.

	if (self == top) document.title = 'radd.it: ' + link.title;		// Set title if not in an <iframe>.

	if (link.subreddit !== undefined && link.subreddit.length > 0) {
		if (!listr.user) $('span.abPostFeed').html('to <a class="feedOpen" title="open r/' + link.subreddit + '" target="_blank" href="https://reddit.com/r/' + link.subreddit + '">r/' + link.subreddit + '</a>');
		else $('span.abPostFeed').html('to <a class="addFeed" href="#addFeed" title="add r/' + link.subreddit + ' to feeds">r/' + link.subreddit + '</a>');
	}
	else  $('span.abPostFeed').html('');

	if (link.source !== undefined && link.source.length > 0)
		$('span.abPostSource').html('<a class="sourceOpen" title="open ' + link.kind + ' on ' + link.source + '" target="_blank" href="' + link.url.replace('/embed', '').replace('?embed', '?') + '">' + link.source + '</a>');
	else  $('span.abPostSource').html('');

	// if (link.related.permalink === undefined) $('span.abLinksCnt,span.abCommentsCnt').html('<i>no links or comments found</i>');
	// else 
	$('span.abLinksCnt,span.abCommentsCnt').html('');	// these values set by 'related' function

/*
	if ($('#relatedLinks div.collapsible-body').css('display') != 'none') {
		if (!listr.opts.aboutMax) {	// todo serg update
			$('#relatedLinks').stop().animate({'width': '60px'}, 500);
			$('#relCnt').css('display', 'none');		
		}

		$('#relatedLinks div.collapsible-header').click();
	}
*/

	// Update title, about section, and other such from link data.
	// if (link.updateAbout === undefined || link.updateAbout) {
	$("div.container.media div.section.opts .title h4,nav span.title").text(link.title);

	$('.hide-on-load').hide();	// hide all previous media/ related things

	if (link.idx < listr.links.list.length || self != top) {
		listr.links.rejected = [];

		listr.related.list = [];
		listr.related.last = -1;
		// listr.related.rejected = 0;

		$('#linksAdd').closeModal();
		$('#linksAdd div.results div.col.header ul').html('');
		$('#linksAdd div.results div.col.content').html('');		
		$('#linksAdd div.results').hide();
	}

	// For each related key/ url pair, call the corresponding function in related.js to handle it.
	if (self == top) {	// don't process related links if embedded.
		if (Object.keys(link.related).length == 0) $('div.media div.opts a.addLink').show();
		else
			$.each(link.related, function(ikey, val) { 
				if (val !== undefined) {
					if (listr.related[ikey] !== undefined) setTimeout(function() { listr.related[ikey](val); });
					else console.log('ERROR: No related handler found for ' + ikey);
				}
			});
	}

	//// Update quicksearch depending on current bucket.
	if (listr.bucket === 'music' && link.meta.artist.length > 0) $('#linksAddQry').val(link.meta.artist);
	else if (!link.title.isBadTitle()) $('#linksAddQry').val(link.title.firstProperNoun());
	$('#linksAdd div.input-field label').addClass('active');

	// Reset all green buttons.
	$('a.blue-grey').not('.keep-color').removeClass('blue-grey').addClass('grey');

	// Maybe show "explode" button?
	if (link.explodable && link.idx < listr.links.list.length) $('a.explode.' + link.explodable).show();

	// Update media background color.
	var bgColor = '#121211';		// default: imgur black
	if (listr.sources[key].bgColor !== undefined) bgColor = listr.sources[key].bgColor;
	$('div.container.media').css('background-color', bgColor);

    if (
        listr.navi.sections[listr.navi.active] == 'media' 
        && $(window).scrollTop() < 8 
        && $('div.container.media').css('min-height') != ''
    ) $('#naviDown').css('background-color', bgColor);
    else $('#naviDown').css('background-color', '');


	// Bucket-specific buttons.
	if (listr.bucket == 'music') {
		$('div.container.media div.opts a.amazon')
			.unbind('click')
			.click(function(event) { 
				if (link.meta.artist == '')
					window.open('http://www.amazon.com/s?field-keywords='
						+ listr.links.current.meta.track.replace(/&/g, 'and')
						+ '&camp=1789&creative=390957&linkCode=ur2&tag=raddit-20'
					, '_blank');
				else
					window.open('http://www.amazon.com/s?field-keywords='
						+ listr.links.current.meta.artist.replace(/&/g, 'and')
						+ ' ' + listr.links.current.meta.track.replace(/&/g, 'and')
						+ '&camp=1789&creative=390957&linkCode=ur2&tag=raddit-20'
					, '_blank');
			})
			.show()
		;

		if ($('#visualizer').length > 0) {
			if (listr.sources[key]._pauses) $('#visualizer').show();
			else $('#visualizer').hide();
		}
	}


	// Update quickload
	if (link.idx < listr.links.list.length) {
		$('ul.quickLoad li.active,div.grid div.card.active').removeClass('active');	// .removeClass('z-depth-2')

		$('ul.quickLoad li.idx-' + link.idx).addClass('active');
		$('div.grid div.card.idx-' + link.idx).addClass('active');	// .addClass('z-depth-2')

		$('ul.quickLoad').animate({
			scrollTop: 
				$('ul.quickLoad').scrollTop()
				+ $('ul.quickLoad li.idx-' + link.idx).position().top 
				- (window.size().height / 4)
				+ 75
		}, 333);

		$('div.grid div.cardCont').animate({
			scrollTop: 
				$('div.grid div.cardCont').scrollTop()
				+ $('div.grid div.cardCont div.card.idx-' + link.idx).position().top 
				- (window.size().height * 1.15)
		}, 333);
	}


	if (link.subreddit == 'stationalpha' && key == 'youtube.com' && link.kind == 'vid') link.id_source = 'R9KbJFT4Qag';

/*
	// rickroll.   of sorts.
	if ($('img.rollImg').length) {
		clearInterval(listr.links.rollTimer);

		// if (
			confirm('This is all a dream.' + ENTER + ENTER + 'Can you wake up..?')
			// )
			// window.open('https://reddit.com/r/chrisolivertimes', '_blank');

		$('img.rollImg').remove();
	}

	if (self == top && key == 'youtube.com' && link.kind == 'vid' && link.idx == 0) {	
		if (Math.random() < 0.34) link.id_source = '6BGBJstQyGQ';		// attack of poloroid people
		else if (Math.random() < 0.34) link.id_source = 'HFS2oz-i3Ik';	// slippery people
		else if (Math.random() < 0.34) link.id_source = 'vhErQkbeuC4';	// GO FREAKS GO!
		else if (Math.random() < 0.34) link.id_source = 'pW6p7DpFjtM';	// CoE - Persian Song
		else if (Math.random() < 0.34) link.id_source = 'IDE9MC3jnl0';	// hungry freaks, daddy
		else if (Math.random() < 0.34) link.id_source = 'DuABc9ZNtrA';	// whoooo are the brain police?
		else link.id_source = 'DVT3LvDI9ZE';							// It can't happen heeeeerreeee..

		var rollImgs = [
			'http://stopmensonges.com/wp-content/uploads/2016/12/david-rockefeller-eebeb021d13b426b0146dfb65470f148_view_article.jpg'
			, 'http://i0.kym-cdn.com/entries/icons/original/000/000/520/hailants.jpg'
			, 'https://i.ytimg.com/vi/8lcUHQYhPTE/hqdefault.jpg'
			, 'https://i.kinja-img.com/gawker-media/image/upload/s--nMCjREqO--/c_scale,f_auto,fl_progressive,q_80,w_800/zmzj2hftqvl925p1jzcx.jpg'
			, 'http://gamingtrend.com/wp-content/uploads/2016/01/xcom-2-top--620x350.jpg'
			, 'http://liamscheff.com/wp-content/uploads/2015/11/Alien-Overlord.jpg'
			// , 'https://s-media-cache-ak0.pinimg.com/736x/f3/0d/fd/f30dfde2ada06a8e0a5b7283ba79e5ad.jpg'
			// , 'https://media2.fdncms.com/bend/imager/is-obama-being-controlled-by-alien-overlords-i-guess-well-never-really-kn/u/slideshow/2224915/1363901265-unknown.jpg'
			, 'https://3.bp.blogspot.com/-3q_0gtC0DSk/WAq40lslGCI/AAAAAAAAuG8/qn3SF4u7X98IS0g_TsyKoRgOMtbgQXfFACLcB/s640/John%2BPodesta%252C%2BCanada%252C%2BUFO%252C%2BUFOs%252C%2Bsighting%252C%2Bsightings%252C%2BClinton%252C%2Bobama%252C%2BUnited%2BNations%252C%2Bemail%252C%2Bleak%252C%2BDARPA%252C%2Bdisclosure%252C%2Bpluto%252C%2Bspace%252C%2Bsky%252C%2Bhunter%252C%2Bproject%2BAurora%252C%2B4.png'
			, 'https://1.bp.blogspot.com/-sBzEWKnzdks/VyjJ49qyFiI/AAAAAAAABss/ro6caiBqPy8DE-V5_8A1u1jD17GtzQ0dgCKgB/s1600/cruz2.jpg'
			, 'https://i1.wp.com/alien-ufo-sightings.com/wp-content/uploads/2015/08/217a9b4731db3532f37f236b39ee8c03b6e66cc2.jpg?resize=398%2C400'
			, 'https://pbs.twimg.com/media/CrFrQntWYAE84LS.jpg'
			// , 'http://townofcoma.com/wp-content/uploads/2016/06/alienbicycle2.png'
			, 'http://yfnjman.com/wp-content/uploads/2011/11/Alien.jpg'
			, 'https://s-media-cache-ak0.pinimg.com/originals/b1/4f/28/b14f288321b9c6872d17c170dadedce3.jpg'
			, 'https://cdns.klimg.com/merdeka.com/i/w/news/2014/10/31/451869/670x335/wah-manusia-ternyata-lebih-percaya-alien-ketimbang-tuhan.jpg'
			, 'http://www.joeydevilla.com/wordpress/wp-content/uploads/2012/04/our-new-insect-overlords.jpg'
			, 'http://files.rightwingwatch.org/uploads/alex-jones-maybe-aliens-really-d-1.jpg'
			, 'http://www.geek.com/wp-content/uploads/2016/04/featured-8-625x352.jpg'
			// , 'http://alien-ufo-research.com/reptilians/picture-of-reptilian-alien.gif'
			// , 'http://deadstate.org/wp-content/uploads/2014/11/doll-1-.jpg'
			, 'http://www.merlinsltd.com/WebRoot/StoreLGB/Shops/62030553/474C/63E0/8B7B/4AFA/9E7A/D5C1/1612/C5A8/mask_alien_autopsy_close_m.JPG'
			, 'http://i.imgur.com/g6nZ7.jpg'
			, 'http://img11.deviantart.net/e897/i/2013/309/8/7/overmind_by_r_3h-d6t4ivs.jpg'
			, 'http://media2.fdncms.com/portmerc/imager/u/large/18077318/oneday-hillaryclinton.jpg'
			, 'http://img.wennermedia.com/social/alien-invasion2-78e1656b-091b-48bc-b7fc-6f1ccacb693f.jpg'
			, 'https://static2.gamespot.com/uploads/original/1517/15178543/2419010-1651243543-white.jpg'
			, 'http://3.bp.blogspot.com/-glBGuZ9Zvoc/TjxluUvqgTI/AAAAAAAACN4/1ioHkM7bsfE/s400/Invaders+from+Mars.jpg'
			, 'http://m11.brkmd.com/dnet/media/878/901/2901878/6-movie-robot-overlords1.jpg'
			, 'http://application.denofgeek.com/pics/film/list/alat02.jpg'
			, 'http://i638.photobucket.com/albums/uu109/susannah_dingley/ThatchersFace.jpg'
			// , 'https://s3.amazonaws.com/gs-geo-images/3b788f41-cf17-4d64-9087-dc3ed6e32d4c.jpg'
			, 'http://25.media.tumblr.com/tumblr_matxonMdbh1r2kkvco1_500.jpg'
			, 'http://api.theweek.com/sites/default/files/styles/tw_image_9_4/public/Screen%20Shot%202016-03-17%20at%2011.42.25%20PM.jpg'
			, 'https://s-media-cache-ak0.pinimg.com/564x/9e/a6/9e/9ea69e53a93f15f57b752e363b6b98d1.jpg'
			, 'http://g.denik.cz/1/16/valeria-lukyanova-5_denik-1024.jpg'
			, 'https://i.ytimg.com/vi/hSzOUTr9tB0/maxresdefault.jpg'
			, 'http://pbs.twimg.com/media/CfQbUiMW4AASizB.jpg'
			, 'http://ezone.org/barbie/bhalien.jpg'
			, 'http://img1.rnkr-static.com/list_img_v2/4793/504793/870/full-cast-of-barbie-and-the-three-musketeers-actors-and-actresses-u4.jpg'
			, 'http://4.bp.blogspot.com/-pcp3DeYaPR8/UL1EuxIGPyI/AAAAAAAABY0/UoK-vnX1ZBw/s1600/purple+barbie+2.jpg'
			, 'http://i.imgur.com/RANl4CH.gif'
			, 'http://i.imgur.com/wXHT4GD.gif'
			, 'http://i.imgur.com/RbeKZeF.jpg'
			, 'http://i.imgur.com/IAQlqb3.jpg'
			, 'http://www.universetoday.com/wp-content/uploads/2009/12/saturn20131017-e1438109547362.jpg'
			// , 'https://www.jpl.nasa.gov/images/cassini/20131204/pia17652-640.gif'
			, 'http://i.imgur.com/ioYx97L.jpg'
			, 'https://i.imgflip.com/pkrn8.jpg'
			, 'https://pbs.twimg.com/media/Cn7saaAVIAAETG9.jpg'
			, 'https://i.ytimg.com/vi/50RZrJSC0Cs/maxresdefault.jpg'
			, 'https://staticseekingalpha.a.ssl.fastly.net/uploads/2016/4/957061_14595169907724_rId15.jpg'
			, 'http://orig11.deviantart.net/16ef/f/2015/045/8/8/alien_putin_by_finnosaurus-d8hxl74.png'
			, 'http://cdn.inquisitr.com/wp-content/uploads/2016/05/elizabeth111.jpg'
			, 'https://thedailytrash.files.wordpress.com/2017/01/putin-alien-900x440.png'
			// , 'https://i.ytimg.com/vi/xaBwSQ_mG5c/maxresdefault.jpg'
			, 'https://crazyvideono1.com/wp-content/uploads/2017/03/queenelizabeth.jpg'
			, 'http://images.gawker.com/18k4pgeogm7tgjpg/original.jpg'
			, 'http://media.breitbart.com/media/2016/01/Glenn-Beck-6-Getty.jpg'
			, 'http://i.imgur.com/qAGKjfC.jpg'
			, 'http://data.whicdn.com/images/210498018/large.jpg'
			, 'https://i.ytimg.com/vi/oAgJpFzZ2SU/maxresdefault.jpg'
			, 'https://img.buzzfeed.com/buzzfeed-static/static/2016-03/23/19/campaign_images/webdr11/simpsons-trump-2-14990-1458776214-5_dblbig.jpg'
			, 'https://i.ytimg.com/vi/qJY9G7gxqsM/maxresdefault.jpg'
			// , 'http://i3.mirror.co.uk/incoming/article7797782.ece/ALTERNATES/s615/Kim-Jong-Un.jpg'
			, 'http://cdn.images.express.co.uk/img/dynamic/1/285x214/354874_1.jpg'
			// , 'http://i0.wp.com/metrouk2.files.wordpress.com/2016/10/elib_7066241-copy.jpg'
			// , 'http://i.telegraph.co.uk/multimedia/archive/02518/Jimmy-Savile_2518107b.jpg'
			, 'http://penulispro.net/wp-content/uploads/2015/08/Twin-peaks.jpg'
			// , 'https://welcometotwinpeaks.com/wp-content/uploads/twin-peaks-deleted-scenes-where-am-i1.jpg'
			, 'http://www.buzzinbox.fr/wp-content/uploads/2016/04/Twin-Peaks-Simpsonized-ADN-e1461761517653.jpg'
			, 'https://staging-thump-images.vice.com/images/2015/1/27/post-plastic-people-a-blueprint-for-the-future-of-london-nightlife-1422362965000.jpg'
			, 'https://3a09223b3cd53870eeaa-7f75e5eb51943043279413a54aaa858a.ssl.cf3.rackcdn.com//2beb4464ddbf50b864544c4060b78e141207431566-1398760891-535f65bb-620x348.jpg'
			, 'http://s3.amazonaws.com/libapps/customers/49/images/unflag.gif'
			// , 'http://vignette2.wikia.nocookie.net/future/images/f/f4/Flag_959.png'
			, 'https://www.nasa.gov/sites/default/files/images/nasaLogo-570x450.png'
			, 'https://pbs.twimg.com/profile_images/655210685232644096/HkAHHM3c.png'
			// , 'https://i.ytimg.com/vi/CNrI1i88P-U/maxresdefault.jpg'
			, 'https://ab976f528c498801423d-2376439231beb5d718e8f49fe25fed31.ssl.cf1.rackcdn.com/uploads/media/media/8658/featured_exhib_film_baraka.jpg'
			, 'http://www.dharma-documentaries.net/screenshots/00-Headers/Baraka-by-Ron-Fricke.jpg'
			, 'https://i.ytimg.com/vi/2WHx2ITKtUg/maxresdefault.jpg'
			, 'http://s.storage.akamai.coub.com/get/b25/p/coub/simple/cw_timeline_pic/e94150e370d/c37d09ee3b3fe5b034ef7/big_1410099133_image.jpg'
			, 'https://dieuonthegrass.files.wordpress.com/2012/09/20120923-181731.jpg'
			, 'http://images.wisegeek.com/virgin-mary-image.jpg'
			, 'http://images.wisegeek.com/portrait-of-jesus-with-halo.jpg'
			, 'http://www.smom-za.org/images/ND_Philermos_26X22_pthumb.jpg'
			// , 'https://www.transcend.org/tms/wp-content/uploads/2016/06/logo-freemasons.jpg'
			, 'http://kontrrev.ho.ua/imgs/masons1.jpg'
			, 'http://cdn.static-economist.com/sites/default/files/images/articles/migrated/2609WB1.jpg'
			// , 'https://www.wlth.com/wp-content/uploads/2013/10/dollarbill-secrets21.jpg'
			, 'https://usercontent2.hubstatic.com/3507625_f520.jpg'
			, 'https://thoughtcatalog.files.wordpress.com/2013/10/aa93.jpg'
			// , 'http://www-tc.pbs.org/prod-media/newshour/photos/2013/07/10/Tesla_circa_1890_slideshow.jpeg'
			, 'http://www.intergalactiques.net/wp-content/uploads/2016/01/Teslathinker.jpg'
			, 'http://www.italianrenaissance.org/wp-content/uploads/Michelangelo-creation-of-adam-index.jpg'
			, 'http://monalisa.org/wp-content/uploads/2012/09/08-ml-cc-toprow-02-940x529.jpg'
			, 'https://www.wprost.pl/_thumb/36/54/a1ec9cd3a757024d911c1e02f625.jpeg'
			// , 'http://www.museivaticani.va/content/dam/museivaticani/immagini/collezioni/musei/cappella_sistina/02_04_03_Creazione_uomo.png/_jcr_content/renditions/cq5dam.web.1280.1280.png'
			, 'https://i.ytimg.com/vi/wAifPjcv_gs/hqdefault.jpg'
			, 'http://1.bp.blogspot.com/-x-16ozdqMgU/VYhoEkZSwUI/AAAAAAAAX4Y/8e_4XcqykVI/s1600/Alien%2Bhumanoid.png'
			, 'http://ic.pics.livejournal.com/sverchelovek/14591056/20846/20846_original.jpg'
			, 'http://beforeitsnews.com/contributor/upload/30080/images/bushalien.jpeg'
			, 'http://www.thinkaboutit-aliens.com/wp-content/uploads/2015/08/01-Alien.jpg'
			, 'http://p5.storage.canalblog.com/53/93/497307/94421599_o.png'
			, 'https://media.giphy.com/media/3o85xIX1zMWZIewiti/giphy.gif'
			, 'https://j.gifs.com/pgRkJV.gif'
			, 'https://media.giphy.com/media/e4AG5kqDejJXq/giphy.gif'
			// , 'https://i.ytimg.com/vi/4JMUimxkx7c/hqdefault.jpg'
			, 'http://ytimg.googleusercontent.com/vi/XlwwsvNA2-c/mqdefault.jpg'
			, 'http://beforeitsnews.com/contributor/upload/238056/images/obama-shapeshifted-at-colorado-hospital1.jpg'
			, 'https://i.ytimg.com/vi/vMb07XxYYsQ/hqdefault.jpg'
			, 'http://stream1.gifsoup.com/view3/4786883/martians-yip-yip-radio-1-o.gif'
			, 'http://www.ancientegyptonline.co.uk/images/thoth.jpg'
			// , 'http://www.think-aboutit.com/wp-content/uploads/2013/12/thoth1.gif'
			, 'https://previews.123rf.com/images/donsimon/donsimon1211/donsimon121100004/16218818-Copia-moderna-di-antico-egiziano-Tutankhamon-Archivio-Fotografico.jpg'
			// , 'http://remnantnewspaper.com/web/images/Obama_Pharoah.jpg'
			// , 'http://vignette4.wikia.nocookie.net/uncyclopedia/images/d/d1/Pharaoh_Dumeses_I.jpg'
			// , 'http://1.bp.blogspot.com/-AhcxfAJrmwc/T_X4AqqHgyI/AAAAAAAAB3M/Jj447AqNyYs/s1600/Loves_of_Pharoah_9.jpg'
			, 'https://i2.wp.com/ipfactly.com/wp-content/uploads/2015/04/King-Thutmose-III.jpg'
			, 'https://classconnection.s3.amazonaws.com/444/flashcards/934444/jpg/20-144653ADED2585B876D.jpg'
			, 'https://i.imgur.com/YcaZ3YR.png'
			, 'https://i.reddituploads.com/60b8f8896ee94f31a4cc4de5778416b0?fit=max&h=1536&w=1536&s=c16106abd7d9c3a41504d2edc7ce3bc6'
			// , 'https://i.imgur.com/CRdd79k.jpg'
			// , 'https://i.redd.it/ukq1z9d1usly.jpg'
			, 'https://i.imgur.com/XWw5Pw0.jpg'
			, 'https://i.imgur.com/Iyvy0c3.jpg'
			// , 'https://i.reddituploads.com/81bc62cf80c94cd1909e53f3578a2429?fit=max&h=1536&w=1536&s=efe6dfbeeb5b01ba8e7b543eeca0533c'
			, 'http://static5.businessinsider.com/image/51912b30ecad04253c000000/neil-degrasse-tyson-tells-us-why-star-trek-is-so-much-better-than-star-wars.jpg'
			, 'http://atlantablackstar.com/wp-content/uploads/2014/04/1.jpg'
			, 'http://static1.businessinsider.com/image/560bedb1dd089502718b45a3/neil-degrasse-tyson-reveals-the-biggest-misconceptions-about-the-universe.jpg'
			, 'https://s-media-cache-ak0.pinimg.com/originals/98/64/67/98646748f2b53c3d68c98513f31f2c2d.jpg'
			, 'http://iheartintelligence.com/wp-content/uploads/2015/10/Carl-Sagan.jpg'
			, 'http://www.cvltnation.com/wp-content/uploads/2014/11/PatternBreaker-820x512.jpg'
			, 'http://www.thefamouspeople.com/profiles/images/isaac-newton-22.jpg'
			// , 'http://www.crystalinks.com/newton.jpg'
			// , 'http://www.lassp.cornell.edu/ardlouis/dissipative/richard_feynman.jpg'
			, 'https://blogs.scientificamerican.com/oscillator/files/2013/07/feynman.jpg'
			, 'https://media.licdn.com/mpr/mpr/p/8/005/020/1a8/1d1272a.jpg'
			, 'https://lh3.googleusercontent.com/-BuVWl2McN0k/AAAAAAAAAAI/AAAAAAAAWY8/jBGVPH31hjk/s0-c-k-no-ns/photo.jpg'
			, 'https://pbs.twimg.com/profile_images/1146014416/mark-zuckerberg.jpg'
			, 'http://www.taxjusticeblog.org/images/zuckerberg.jpg'
			// , 'https://www.wired.com/images_blogs/business/2013/04/platonZuck.jpg'
			// , 'https://www.ronicaphotograf.se/wordpress/wp-content/uploads/2014/09/Power-Platon-US_BObama.png'
			// , 'http://img.timeinc.net/time/2010/poy_2010/poy_mz/poy_cover_z_1215.jpg'
			, 'https://pbs.twimg.com/profile_images/378800000173019318/8db7be984cfb21b5c6701dd9b6a1bb62.jpeg'
			, 'http://images.huffingtonpost.com/2015-11-25-1448491754-5950530-wolfblitzer.jpg'
			, 'https://i.ytimg.com/vi/rHFL7qjftmk/maxresdefault.jpg'
			, 'http://media.boingboing.net/wp-content/uploads/2016/10/rush-limbaugh.jpg'
			, 'http://media.salon.com/2013/08/rush_limbaugh5.jpg'
			, 'http://www.dailystormer.com/wp-content/uploads/2016/08/merkel_3573996k.jpg'
			, 'http://cdn1.spiegel.de/images/image-2954-640_panofree-lyup-2954.jpg'
			, 'http://vasevec.parlamentnilisty.cz/sites/default/files/imagecache/primary_318x221/images/2595/merkel-rating-sp-downgrading-jpg-crop_display.jpg'
			, 'http://i2.cdn.cnn.com/cnnnext/dam/assets/170315112537-mobapp-trump-merkel-split-super-169.jpg'
			// , 'https://www.casino.org/news/wp-content/uploads/2015/06/Sepp-blatter-006.jpg'
			// , 'http://static2.businessinsider.com/image/56d0ad976e97c62f008b9fff/the-new-fifa-president-won-his-first-election-when-he-was-18-thanks-to-an-amazing-campaign-promise.jpg'
			// , 'https://www.cheap-flyer-printer.com/shop/product_images/u/matt%20lucas__96049.jpg'
			, 'http://textualhealing.co.uk/wp-content/uploads/mattlucaspic.jpg'
			, 'https://pbs.twimg.com/media/CJNLQpOUkAQ2kaj.png'
			, 'https://static.giantbomb.com/uploads/scale_small/1/14741/971525-stephen_fry.jpg'
			, 'https://pmcdeadline2.files.wordpress.com/2015/10/drphil.png'
			, 'http://media.breitbart.com/media/2015/01/dr-phil-AP.jpg'
			, 'http://www.commdiginews.com/wp-content/uploads/2014/11/Charles-Manson-And-Star-670x457-435x375.jpg'
			// , 'http://sites.psu.edu/sierrasspace/wp-content/uploads/sites/33449/2015/10/download.jpeg'
			, 'https://i.ytimg.com/vi/bZTpgyG_PR4/hqdefault.jpg'
			, 'http://www.millionmonkeytheater.com/moviepics29/frickin3.jpg'
			, 'http://sxh1b2g2g4f2w04gm2piih1u.wpengine.netdna-cdn.com/wp-content/uploads/2016/07/3.-Piramid-1-696x464.jpg'
			, 'http://i985.photobucket.com/albums/ae335/tempo5687/wh_244_pc_col.jpg'
			, 'http://www.chimuadventures.com/blog/wp-content/uploads/2016/11/pyramid-07.jpg'
			// , 'https://ronabbass.files.wordpress.com/2016/12/buzz-aldrin.jpg'
			// , 'http://yournewswire.com/wp-content/uploads/2016/12/PyramidAtSouthPole-AerialShot-GoogleEarth.jpg'
			// , 'http://cdn.history.com/sites/2/2014/01/pyramids-giza-A.jpeg'
			, 'http://earthnworld.com/wp-content/uploads/2015/12/Facts-About-Ancient-Pyramid-3.jpg'
			// , 'https://dyn0.media.forbiddenplanet.com/products/2052649.jpg'
			, 'https://i.ytimg.com/vi/3_8m3Fz0G1I/maxresdefault.jpg'
			, 'http://i.imgur.com/cZ0Lfuo.jpg'
			, 'http://images1.wikia.nocookie.net/__cb20111102122647/logopedia/images/8/80/Berenstain_Bears_logo.jpg'
			, 'https://s-media-cache-ak0.pinimg.com/originals/90/a4/21/90a421b1ec94828b5d10eb11ad79b4ad.jpg'
			, 'http://kinganu.weebly.com/uploads/2/5/4/8/25488389/1446111_orig.jpg'
			, 'http://www.mesopotamiangods.com/wp-content/uploads/2014/12/2-Enlil-chief-god-of-All-On-Earth.jpg'
			, 'http://img07.deviantart.net/60d2/i/2010/054/9/d/enki_by_trance_de_anima.jpg'
			, 'http://1.bp.blogspot.com/_n9UpCIi9Waw/SvgHeppYJtI/AAAAAAAAIrk/tzOhhEldbBw/s400/l_03119418fbee45048273f3463b57a545.jpg'
			, 'http://www.annunaki.org/wp-content/uploads/2014/09/god-anu.jpg'
			, 'http://2.bp.blogspot.com/_n9UpCIi9Waw/Sjthx9qVEMI/AAAAAAAAGjk/-hsZCuODFlk/s400/AMON+RA+MARDUK.jpg'
			, 'https://userscontent2.emaze.com/images/31233c6b-d683-4c74-9e38-b4d58fa8f9e0/8fe1f5638b55d7892de092e0c1544ff5.png'
			, 'http://beforeitsnews.com/contributor/upload/2980/images/gilga3.jpg'
			// , 'https://waruzafooblog.files.wordpress.com/2016/04/king-ninma-of-agaronm.png?w=660&h=698'
			, 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Cuneiform_sumer_dingir.svg/2000px-Cuneiform_sumer_dingir.svg.png'
			, 'https://lh3.googleusercontent.com/-CL1-L_6Dh94/AAAAAAAAAAI/AAAAAAAAARo/RFSwt5xhoBs/photo.jpg'
			, 'https://s-media-cache-ak0.pinimg.com/originals/2a/4e/a7/2a4ea71c3de94fa5276cc136a4d3d1e0.jpg'
			// , 'http://325.nostate.net/images/iaf_irf-logo1.png'
			// , 'https://s-media-cache-ak0.pinimg.com/originals/b4/56/b7/b456b708d4e0044bf78796676683b67b.png'
			// , 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Triskelion-spiral-threespoked-inspiral.svg/606px-Triskelion-spiral-threespoked-inspiral.svg.png'
			, 'https://68.media.tumblr.com/1a250d11287ee4ac0b6fb50d271a0064/tumblr_inline_o1j41plxGr1r7rhsj_540.png'
			, 'https://vkjehannum.files.wordpress.com/2016/10/azathoth.png'
			, 'http://adventofdeception.com/wp-content/uploads/2010/03/11NumberElevenInCircle.jpg.png'
			// , 'http://sf911truth.org/wp-content/uploads/2015/04/target-on-constitution.png'
			, 'http://www.ndmasons.com/wp-content/uploads/2016/02/456px-Masonic_SquareCompassesG.svg_-1.png'
			, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/ChristianEyeOfProvidence.svg/1000px-ChristianEyeOfProvidence.svg.png'
			// , 'https://ih0.redbubble.net/image.15340093.6315/sticker,375x360.u1.png'
			, 'https://d30y9cdsu7xlg0.cloudfront.net/png/16487-200.png'
			, 'https://i0.wp.com/spidercatweb.files.wordpress.com/2016/02/2000px-eye_of_horus_bw-svg.png?w=596&h=596&ssl=1'
			// , 'http://healerdimitri.com/wp/wp-content/uploads/2015/05/duble_torus_side_web.jpg'
			, 'https://i0.wp.com/fdih.23video.com/user-buddy.png?ssl=1'
			, 'https://www.wired.com/wp-content/uploads/2014/08/03_Cnt3_Fr8-_crop1.jpg'
			, 'https://pbs.twimg.com/profile_images/501875004934344704/XAnDA2sU.jpeg'
			, 'http://www.nationalrighttolifenews.org/news/wp-content/uploads/2017/01/georgesoros82.jpg'
			, 'https://pbs.twimg.com/profile_images/627688107853369344/R0mRzwb6.jpg'
			, 'http://www.hollywoodreporter.com/sites/default/files/custom/Natalie/THR_Dan_Rather_2_embed.jpg'
			, 'http://cimg.tvgcdn.net/i/r/2012/05/01/0b53daa3-223e-45ad-9325-283278283d0a/thumbnail/210x305/28da7dc1bf37416ac855ff8c23c15495/120501mag-mike-wallace1.jpg'
			, 'http://pixel.nymag.com/imgs/daily/vulture/2015/12/22/22-michael-moore.w1200.h630.jpg'
			, 'http://noiimages.s3.amazonaws.com/images/redstate/201607211652486581.png'
			, 'http://media.salon.com/2013/10/ann_coulter2.jpg'
			, 'http://proofofalien.com/wp-content/uploads/2016/03/Top-20-Anunnaki-Aliens-Facts.jpg'
			, 'http://thetruthbehind.tv/wp-content/uploads/2015/07/1436888762_hqdefault-480x293.jpg'
			, 'http://bh-s2.azureedge.net/bh-uploads/2016/04/Anunnaki-366666-maxresdefault.jpg'
			, 'http://4.bp.blogspot.com/-eidWIKs-IgA/VLEehJaVC3I/AAAAAAAAGtw/R94PqHRiFq8/s1600/Nordic_Anunnaki_Alien_detail_png_%C2%A9Hawkwood.png'
			, 'http://www.thinkaboutit-aliens.com/wp-content/uploads/2012/10/inanna1.jpeg'
			// , 'https://s-media-cache-ak0.pinimg.com/736x/40/f2/ac/40f2ac87540f3df5b542510a5bdedf6f.jpg'
			// , 'https://cache.fivebelow.com/media/catalog/product/cache/1/image/800x800/17f82f742ffe127f42dca9de82fb58b1/2/7/2755577_ty-beanie-boos-owlette-white-owl-1_ecom1705.jpg'
			// , 'https://s-media-cache-ak0.pinimg.com/236x/54/a0/af/54a0afd081d51410b1e4476dc710297c.jpg'
			, 'http://www.lovethetruth.com/jis_images/cremation_of_care.jpg'
			, 'http://www.texemarrs.com/images/boho_dignitaries.jpg'
			, 'https://fellowshipofminds.files.wordpress.com/2011/02/baroness-philippine-mathilde-camille-de-rothschild-7.jpg'
			, 'https://s-media-cache-ak0.pinimg.com/564x/9f/21/86/9f2186333354f15062e83198d8724a94.jpg'
			, 'http://filmmakeriq.com/wp-content/uploads/2013/06/Stanley-Kubrick.jpg'
			, 'https://stevenhager420.files.wordpress.com/2013/09/tumblr_m2bhi1glbp1rr9g42o1_500.jpg'
			, 'http://thisishistorictimes.com/wp-content/uploads/2012/05/pyle.jpg'
			, 'http://media.salon.com/2013/10/the_shining2.jpg'
			, 'http://www.guardians.net/egypt/sphinx/images/sphinx_head2-2001.jpg'
			, 'http://cdn.images.express.co.uk/img/dynamic/139/590x/secondary/Nigel-Farage-236142.jpg'
			, 'http://www.dailystormer.com/wp-content/uploads/2014/04/Nigel-Farage.jpg'
			, 'https://img.buzzfeed.com/buzzfeed-static/static/2015-04/2/17/campaign_images/webdr04/nigel-farage-said-that-the-majority-of-those-gett-2-8040-1428011496-40_dblbig.jpg'
			, 'http://netstorage.discovery.com/feeds/brightcove/asset-stills/mil/137458348592614114000701197_104_mcveigh_past.jpg'
			, 'http://a.abcnews.com/images/Sports/espnapi_dm_150624_olympic_news_tsarnaev_sentenced_wmain.jpg'
			// , 'http://s6.sinaimg.cn/middle/49d0afb2g7a2146bb4d85&690'
			, 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2011/4/22/1303484782073/Khalid-Sheikh-Mohammed-wh-008.jpg?w=700&q=55&auto=format&usm=12&fit=max&s=0e210bf68cd69854a7b8bc0e09c73f3c'
			, 'http://media.breitbart.com/media/2014/11/Geraldo-Fox-News.jpg'
			// , 'http://i48.tinypic.com/99ias2.jpg'
			, 'http://law2.umkc.edu/faculty/projects/ftrials/mcveigh/nichols2.jpg'
			, 'http://crooksandliars.com/files/primary_image/15/06/large_size_oklahomacitybomber2_640x360.jpg'
			, 'http://s2.dmcdn.net/Ahf3q.jpg'
			, 'https://upload.wikimedia.org/wikipedia/commons/e/e1/John_Ashcroft.jpg'
			, 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2009/1/16/1232136838081/John-Ashcroft-001.jpg?w=300&q=55&auto=format&usm=12&fit=max&s=669e2cba966b8b7c10fdda5c0f1780e3'
			, 'https://i.ytimg.com/vi/zSB4nq0dmjY/maxresdefault.jpg'
			, 'http://www.ghoulishproductions.com/2882-thickbox/boogeyman.jpg'
			, 'https://i.ytimg.com/vi/_W6Fo5NylZ8/hqdefault.jpg'
			, 'http://www.bookprowrestlers.com/images/littleboogeyman.jpg'
			, 'http://www.thewrestlinganswer.com/images/eWN-editorials/face-paint/kamala-eWN-001.jpg'
			, 'http://compositeeffects.com/mystore/image/cache/data/SM/BOG/cover-500x600.png'
			, 'http://cdn-4.mrdowling.com/images/601copernicus.png'
			, 'http://info-poland.buffalo.edu/classroom/kopernik/NK.jpg'
			, 'http://www.nndb.com/people/772/000027691/anton-lavey-black.jpg'
			, 'http://christendtimeministries.com/wp-content/uploads/2016/09/lavey.jpg'
			// , 'https://s-media-cache-ak0.pinimg.com/564x/63/fb/a3/63fba3180e40034d7c507d77332dc3bf.jpg'
			, 'https://crimesofempire.files.wordpress.com/2015/02/urllking.jpg'
			, 'http://1.bp.blogspot.com/-6EF5ymxS4m8/VmH1shp35II/AAAAAAAAAX8/t5sgWGdvC2g/s1600/1448720573446.jpg'
			, 'https://movietheatersnackbar.files.wordpress.com/2013/07/grandpa-munster-screencap.jpg'
			, 'http://welcometobaltimorehon.com/images/johnastin.jpg'
			, 'http://nerdist.com/wp-content/uploads/2015/06/Groucho-Marx.jpg'
			, 'http://ce399.typepad.com/.a/6a00d8345257f969e20105371f6d50970b-600wi'
			, 'http://www.geek.com/wp-content/uploads/2016/02/zuckerberg_VR_people-625x352.jpg'
			, 'https://i.ytimg.com/vi/asduqdRizqs/maxresdefault.jpg'
			, 'http://s2.glbimg.com/GTVBUChgKvA3edOjZP7nJlgxy5Y=/0x600/s.glbimg.com/po/tt2/f/original/2016/02/10/1imagem-abertura.jpg'
			, 'http://images.amcnetworks.com/ifc.com/wp-content/uploads/2015/01/The-Matrix.jpg'
			, 'https://s3.drafthouse.com/images/made/Matrix1_758_426_81_s_c1.jpg'
			, 'http://static3.businessinsider.com/image/51adcbb0eab8eab16a000000/google-isnt-a-social-network--its-the-matrix.jpg'
			, 'http://surrealparadigm.com/wp-content/uploads/2014/03/pill.jpg'
			, 'http://images1.pref.com/live/articles/matrix-gif_7c5d5004334b8e39d9372da5c80e8309.gif'
			, 'https://www.twilio.com/blog/wp-content/uploads/2015/09/bI9j62KkvGSz5subZOO84mgvRjFxn4ZrUmXv8VYyup-UgWrfe2ewhJ8wcMamIHGleFxc5Yku5_SRtOhTZcn477suZkt7HTD5R-xrlzlKIoqvELvK7kbTGd_5eao0vpgZNbrjVbw1.png'
			, 'http://www.bostonherald.com/sites/default/files/styles/gallery/public/media/2016/07/08/Police%20Shootings%20Prot_Prus%20(4).jpg?itok=UIQwyEHr'
			, 'http://cdn.thedailybeast.com/content/dailybeast/articles/2016/07/08/micah-johnson-dallas-cop-killer-was-black-nationalist/jcr:content/image.crop.800.500.jpg/48933903.cached.jpg'
			, 'http://assets.nydailynews.com/polopoly_fs/1.2703456.1467950428!/img/httpImage/image.jpg_gen/derivatives/article_750/article-dallas-10-0707.jpg'
			, 'http://media.nbcdfw.com/images/620*349/Police-Chief-David-Brown-Dallas-0708.jpg'
			, 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Dallas_Police_Chief_David_O_Brown.jpg'
			, 'https://img.rt.com/files/2016.08/original/57b32151c46188e1668b45bc.jpg'
			, 'http://2.bp.blogspot.com/-P9xVABkDOcE/UdQGJ_lWwrI/AAAAAAAAGUg/j19-1al06YA/s254/Nathan_Rothschild.jpg'
			, 'http://verdadahora.cl/wp-content/uploads/2012/02/Billionaire-Nat-Rothschil-007.jpg'
			, 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b0/The_Lord_Rothschild_in_1965.jpg/220px-The_Lord_Rothschild_in_1965.jpg'
			, 'http://www.voltairenet.org/IMG/jpg/2-44-b0e0e.jpg'
			, 'http://bultimes.com/wp-content/uploads/2015/10/rotschild.jpg'
			, 'http://cdn1.historybuff.com/images/2015/11/09160000/Prescott-Bush-1.jpg'
			, 'http://www.worldgolfhalloffame.org/wp-content/uploads/2013/04/GeorgeBush1.png'
			, 'http://i.dawn.com/large/2015/07/55a74c535a612.jpg'
			, 'http://freedom-articles.toolsforfreedom.com/wp-content/uploads/2015/11/jfk-assassination-2.jpg'
			, 'https://timedotcom.files.wordpress.com/2013/10/131030-jfk-1947-senator-01.jpg'
			, 'http://9835bb9feb9fb776ffeb-8512833177f375bfc9e117209d1deddc.r20.cf2.rackcdn.com/571EAE69-16CD-4069-8611-17B05C2BE183.jpg'
			, 'http://www.thefamouspeople.com/profiles/images/lee-harvey-oswald-4.jpg'
			// , 'http://cz598rxdt5our6verxu01782.wpengine.netdna-cdn.com/wp-content/uploads/2016/05/unspecified-3-e1464260185728.jpg'
			, 'http://myrockwallnews.com/wp-content/uploads/2013/11/marina-oswald-lee-harvey-headshot.jpg'
			, 'https://www-tc.pbs.org/wgbh/pages/frontline/shows/oswald/art/cronp13.jpg'
			, 'http://media.salon.com/2013/10/lee_harvey_oswald.jpg'
			, 'https://cdn.theatlantic.com/assets/media/img/2013/04/15/0513-WEL-Kissinger_lede_V1/lead_large.jpg'
			, 'http://katehon.com/sites/default/files/1447161052kissinger_globalist_slug.jpg'
			, 'http://www.activistpost.com/wp-content/uploads/2013/05/Kissinger1.jpg'
			, 'https://si.wsj.net/public/resources/images/BN-RG755_trump1_GR_20161217140241.jpg'
			, 'http://www.innovationsinnewspapers.com/wp/wp-content/uploads/2006/12/kissinger061127_3_560.jpg'
			, 'http://i.dailymail.co.uk/i/pix/2011/11/18/article-0-00DDB13400000190-88_468x355.jpg'
			, 'https://emwgradstudent.files.wordpress.com/2011/01/nixon_kiss.jpg'
			, 'https://consortiumnews.com/wp-content/uploads/2013/10/nixon-kissinger-1972-300x225.jpg'
			, 'http://dailysignal.com/wp-content/uploads/2014_03_13_ObamaKissinger.jpg'
			, 'http://www.theamericanconservative.com/wp-content/uploads/2014/09/Obama-Bush-Clinton-554x405.jpg'
			, 'https://s-media-cache-ak0.pinimg.com/originals/8c/5f/f1/8c5ff16a67245e2f2b5b8c5557073612.jpg'
			, 'http://www.thesleuthjournal.com/wp-content/uploads/2014/11/hillaryhenry.jpg'
			, 'http://www.commondreams.org/sites/default/files/styles/cd_large/public/views-article/p30.jpg?itok=2Y_5lzc9'
			, 'https://sites.google.com/site/pointprophetic/_/rsrc/1468881703232/rapture-of-the-church-pre-mid-or-post-tribulation/endtime666calculator/obama-s-inner-kissinger/kissinger_bush2.jpg'
			, 'http://www.whatdoesitmean.com/pkoo1.jpg'
			, 'http://www.aaronartprints.org/images/Paintings/6072.jpg'
			, 'http://www.maryhillmuseum.org/2013/wp-content/uploads/2013/02/rodin_theThinker.jpg'
			, 'http://www.souvenirs-of-france.com/m/images_produits/rodin-thinker-statue_x-z.jpg'
			, 'https://zenandtheartofnotwriting.files.wordpress.com/2010/07/istock_000005908297xsmall.jpg'
			, 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Cassini_apparent.jpg'
			, 'https://cdn0.vox-cdn.com/thumbor/6suBwPCeaTO4I931aj2qax1Gda8=/0x0:3000x2000/920x613/filters:focal(1164x215:1644x695):format(webp)/cdn0.vox-cdn.com/uploads/chorus_image/image/53921643/490597796.0.jpg'
			, 'https://i.imgur.com/1f81ZIM.jpg'
			, 'http://www.worldgathering.net/images7/williamcooper1.jpg'
			, 'https://upload.wikimedia.org/wikipedia/en/0/0b/Milton_William_Cooper.png'
			, 'http://www.crystalinks.com/billcooper.jpg'
			, 'http://www.wanttoknow.nl/wp-content/uploads/bill-cooper.jpg'
			, 'http://www.lightmillennium.org/2006_18th/image/arthur_c_clarke_portre.jpg'
			, 'http://i.amz.mshcdn.com/Jhjw1RFZ4AIfQ1jrqg51kwDhzv4=/950x534/filters:quality(90)/https%3A%2F%2Fblueprint-api-production.s3.amazonaws.com%2Fuploads%2Fcard%2Fimage%2F429201%2F9614aa79-bd2c-4619-874d-06cbb073e89e.jpg'
			, 'http://www.trueactivist.com/wp-content/uploads/2015/10/Stephen_Hawking_Based_On.jpg'
			
			, 'https://welcometotwinpeaks.com/wp-content/uploads/twin-peaks-deleted-scenes-where-am-i1.jpg'
			, 'https://welcometotwinpeaks.com/wp-content/uploads/twin-peaks-deleted-scenes-where-am-i1.jpg'
			, 'https://welcometotwinpeaks.com/wp-content/uploads/twin-peaks-deleted-scenes-where-am-i1.jpg'
			, 'https://welcometotwinpeaks.com/wp-content/uploads/twin-peaks-deleted-scenes-where-am-i1.jpg'
			, 'https://welcometotwinpeaks.com/wp-content/uploads/twin-peaks-deleted-scenes-where-am-i1.jpg'
		];

		var size = window.size();
		var imgCnt = 0;
		listr.links.rollTimer = setInterval(function() { 
			if (Math.random() < 0.12) return;

			var spin = Math.floor((Math.random() * 16) + 8);

			var x = Math.floor((Math.random() * size.width) - size.width / 8);
			var y = Math.floor((Math.random() * size.height) - size.height / 8);
			// var z = Math.floor((Math.random() * ++imgCnt) + 9999);
			var z = ++imgCnt + 9999;
			var rot = 'spin';
			if (imgCnt % 2) rot = 'spin2';

			// var scale = (Math.random() * (imgCnt * 4)) + 1;

			$('body').append(
				'<img class="rollImg" style="border-radius:50%;animation:' + rot + ' ' + spin + 's linear infinite;left:' + x + 'px;top:' + y + 'px;z-index:' + z + '" src="' + rollImgs.random() + '">'
			);

			// if (self == top) document.title = 'everything you know is wrong.';		// Set title if not in an <iframe>.
			document.title = x * y * z * spin;
		}, 1200);
		
		$('body').append(
			// '<img class="rollImg" style="position:fixed;left:0px;top:0px;z-index:9999;width:' + size.width + 'px;height:' + (size.height + 40) + 'px" src="http://www.blurryphotos.org/wp-content/uploads/2016/02/FE.jpg">'
			'<img class="rollImg" style="opacity:1;max-width:100%;max-height:100%;position:fixed;position:fixed;left:0px;top:0px;z-index:9999;width:' + size.width + 'px;height:' + (size.height + 40) + 'px" src="https://welcometotwinpeaks.com/wp-content/uploads/twin-peaks-deleted-scenes-where-am-i1.jpg">'
		);
	}
*/

	// Finally, load the link.
	listr.sources[key].load(link);
	listr.broadcast({ 'action': 'load', 'target': 'links', 'link': link });

	// Reset autoskip if active
	if (!!listr.links.autoskip) {
		clearTimeout(listr.links.autoskip);

		if (link.idx == (listr.links.list.length - 1) && $("div.container.links div.listings a:eq(0)").length == 0)
			$('span.btns a.next').click().click();	// Last link and no listings?  Turn it off.
		else listr.links.autoskip = setTimeout(function() { listr.links.next(); }, listr.links.autoskipMS);
	}

	// Can this source pause/ resume?  If so, show the pause button.
	if (listr.sources[key]._pauses) {
		$('#naviDown').css('bottom', '-16px');
		$('div.mediaAbout h6').css('margin-right', '226px');

		$('span.btns a.pause').show();
		// $('a.sourceOpen').unbind('click').click(function() { $('span.btns a.pause').click(); window.open(link.url, '_blank'); });
	}
	else {
		$('#naviDown').css('bottom', '8px');
		$('div.mediaAbout h6').css('margin-right', '168px');
		// $('a.sourceOpen').unbind('click').click(function() { listr.links.stop(); window.open(link.url, '_blank'); });
	}

	// Show offliberty button (if available and enabled)
	if (listr.opts['showOffliberty'] && $.inArray('music', listr.sources[key].buckets) != -1)
		$('a.offliberty')
			.unbind('click')
			.bind('click', function() { window.open('http://offliberty.com/#' + link.url, '_blank'); })	// HTTPS not available.
			.show()
		;


	/* No worky. :/
	// Show songkick button (if available and enabled)
	if (
		listr.opts['showSongkick']
		&& $.inArray('music', listr.sources[key].buckets) != -1
		&& link.meta.artist !== undefined
		&& link.meta.artist.length > 2
	) {
		var skURL = 
		$.ajax({
			dataType: 'json'
			, url: 'http://api.songkick.com/api/3.0/search/artists.json?query=' + encodeURIComponent(link.meta.artist) + '&apikey=[redacted]'
			, success: function(json) {
console.log('songkick sez', json);
			}
		});	
	}
	*/

	/*
	// Update "add feed" button for this subreddit (if not already in feeds)
	if (link.subreddit != '') {
		var showAdd = true;
		$.each(listr.feeds.list, function(i, feed) { 
			if (feed !== undefined && feed.url == '/r/' + link.subreddit && feed.idx != -1) showAdd = false;
		});
		if (showAdd) $('span.btns a.addFeed').css('display', 'inline-block');
	}
	*/

	// Check listr.like.links and see if this one has been previously liked.
	var is_liked = false;
	var is_suggested = false;
	var liked_idx = false;
	$.each(listr.like.list, function(i, like) {
		if (like.url.replace('youtu.be/', 'youtube.com/watch?v=').split('://')[1] == link.url.split('://')[1]) {
			liked_idx = i;

			if (i > 0) is_liked = true;
			else is_suggested = true;
		} 
	});	// i <= 0 is a suggestion
	if (is_liked) $('a.addLike').removeClass('grey').addClass('blue-grey');

	// Show "dislike" button if this link was suggested.
	if (is_suggested) // ($.isNumeric(link.meta.id_suggestion))
		$('a.dislike').show().unbind('click').click(function() {
			$('a.dislike').removeClass('grey').addClass('blue-grey');

			$.ajax({
				dataType: 'json'
				, url: '/delete/suggestion'

				, method: 'POST'
				, data : { 'idx' : listr.like.list[liked_idx].idx } // { 'idx': listr.links.current.meta.id_suggestion }

				, success: function(json) {
					if (json.error !== undefined) {
						alert('Error: ' + json.error);
						$('a.dislike').removeClass('blue-grey').addClass('grey');
					}
					else {
						listr.links.next();
						// var listing = $('ul.quickLoad li.listing');
						// if (listing.length > 0) listing.detach();

				  //   	var idx = listr.links.current.idx;

						// $('ul.quickLoad li').remove();										// clear quickload menu
			   //  		listr.links.table.rows().remove();									// clear table

			   //  		listr.links.list.splice(idx, 1);									// remove this link and update all idx's after it
			   //  		var len = listr.links.list.length;
			   //  		for (var i = idx; i < len; i++) listr.links.list[i].idx = listr.links.list[i].idx - 1;

			   //  		$.each(listr.links.list, function(i, link) { listr.links.addRow(link); });		// repopulate table
						// listr.links.table.draw(false);

						// if (listing.length > 0) listing.appendTo($('ul.quickLoad'));
						// $('ul.quickLoad li.idx-' + listr.links.current.idx).addClass('active');

						// $('#links tbody tr:eq(' + idx + ')').click();		// Current track deleted, load its replacement.
					}
				}
				, error: function(jqXHR, textStatus, errorThrown) {
					alert('Error removing suggestion. :/' + ENTER + ENTER + textStatus);
					console.log('radd.it suggestion nix error', listr.links.current.meta, textStatus, errorThrown);
				}
			});		
		});;

	if (listr.opts['showMedia'] && $('div.container.media').css('display') == 'none')
	{	// Show the media box if it's hidden (and user hasn't hidden it.)
		$('div.container.media').show();
		$('window,body').animate({ scrollTop: 0 }, 2000);
		// $(window).scroll();

		if (window.size().width > 960 && listr.links.list.length > 0 && !listr.opts['embedded'] && listr.opts['showQuick'])
			setTimeout(function() { $('div.quickLoad span.select-dropdown').click(); }, 1000);

/* Was:
		var size = window.size();
		if (size.halfSize) {
			$('div.container.media').show();
			$(window).scroll();
		}
		else
			$('div.container.media')	// remove 'min-height' while doing the show/ slideDown
				.css('min-height', '').css('height', size.height + 'px')
				.slideDown(2000, 'swing', function() { 
					if (window.size().width > 960) setTimeout(function() { $('div.quickLoad span.select-dropdown').click(); });

					$('div.container.media').css('height', ''); 
					$(window).scroll(); // adjust buttons and calls listr.navi.update(); 
				})
			;
*/
	}
	else if (link.idx % 25 == 0) {
		$('a.ppdonate').removeClass('darken-4').addClass('darken-3');
		setTimeout(function() { $('a.ppdonate').removeClass('darken-3').addClass('darken-2'); }, 200);
		setTimeout(function() { $('a.ppdonate').removeClass('darken-2').addClass('darken-1'); }, 400);
		setTimeout(function() { $('a.ppdonate').removeClass('darken-1').addClass('darken-2'); }, 600);
		setTimeout(function() { $('a.ppdonate').removeClass('darken-2').addClass('darken-3'); }, 800);
		setTimeout(function() { $('a.ppdonate').removeClass('darken-3').addClass('darken-4'); }, 1000);
	}

	// Is it a pic?  Enable zoom.
	$('.zoomContainer').remove();	// But remove the old shit first.

	if (listr.opts['allowZoom'] && link.kind == 'pic' && $('#media-pic img:visible').length)
		// setTimeout(function() {
			$('#media-pic img')
				.attr('data-zoom-image', link.url)
				.elevateZoom({ zoomType: "inner", cursor: "crosshair", scrollZoom: true, zoomWindowFadeIn: 250, zoomWindowFadeOut: 250 })
			;
		// });

	// Prevent embedded sites from forwarding
	if (!listr.sources[key]._streams && $.inArray('pics', listr.sources[key].buckets) == -1) {
		listr.opts.preventClose = true;
		setTimeout(function() { listr.opts.preventClose = false; }, 3500);
	}

	$(window).resize(); 
}

listr.links.prev = function() {
	listr.broadcast({ 'action': 'prev', 'target': 'links', 'link': listr.links.current });

	setTimeout(function() {
		// listr.links.fromNext = true; 
		$('span.btns a.prev').not('.clicked').click(); 
	}, 100);
}

listr.links.next = function() { 
	listr.broadcast({ 'action': 'next', 'target': 'links', 'link': listr.links.current });
// console.log('listr.links.next()');
	// $('span.btns a.next.clicked').removeClass('clicked');
	if (listr.opts['autoSkip'])
		setTimeout(function() { 
			// listr.links.fromNext = true; 
			$('span.btns a.next').not('.clicked').click(); 
		}, 100);
}

listr.links.stop = function() { 
	listr.broadcast({ 'action': 'stop', 'target': 'links', 'link': listr.links.current });

	$('span.btns a.prev.clicked').removeClass('clicked');
	$.each(listr.sources, function(domain, source) {  if (listr.sources[domain]._init) source.stop(); }); 
}


// Link-related helper functions //////////////////////////////////////////////////////////////////
// Returns meta {} from properties in string (usually the title.)
String.prototype.parseMeta = function() 
{
	var str = this;
	var meta = {};
	if (listr.bucket === 'music')
	{
		meta.artist = '';
		meta.track = '';
		meta.genre = '';
		meta.year = '';
		meta.length = '';

		// first remove anything after the year (if provided)
		var yPos = str.lastIndexOf('20');
		if (yPos === -1) yPos = str.lastIndexOf('19');
		if (yPos === -1) yPos = str.lastIndexOf('18');
		if (yPos === -1) yPos = str.lastIndexOf('17');
		if (yPos === -1) yPos = str.lastIndexOf('16');
		if (yPos === -1) yPos = str.lastIndexOf('15');
		if (yPos !== -1) {
			meta.year = str.substr(yPos, 4).replace('(', '').replace(')', '').replace('[', '').replace(']', '');
			if (!$.isNumeric(meta.year) || meta.year.length !== 4) meta.year = '';
			else str = str.substr(0, yPos);
		}
		else yPos = str.length;

		// TODO: make this work better, eh?
		// then try to parse artist/ track/ genre(s)/ year from title
		var swapTitle = false;
		var pos = str.indexOf(' -');				// Regular space+dash.
		if (pos == -1) pos = str.indexOf('—'); 		// Apple's fancy hyphen
		if (pos == -1) pos = str.indexOf('–');		// dailymotion's hyphen
		if (pos == -1) {
			pos = str.indexOf('-');		// some weird, tiny hyphen
			if (pos != -1) str = str.replace('-', ' - ');
		}
		if (pos == -1) pos = str.indexOf('- ');	// dash+space maybe?
		if (pos == -1) pos = str.indexOf(' //'); 	// or a space+ //?  what a weird seperator.
		if (pos == -1) pos = str.indexOf(': '); 	// Artist: Track?

		if (pos == -1) {						// is it like "Blah Blah by the Blahers"?
			pos = str.indexOf(' by ');

			if (pos != -1) {
				str = str.replace(' by ', ' - ');
				swapTitle = true;
			}
		}
		if (pos == -1) {						// is it like "Blah Blah from the Blahers"?
			pos = str.indexOf(' from ');

			if (pos != -1) {
				str = str.replace(' from ', ' - ');
				swapTitle = true;
			}
		}

		if (pos == -1) {
			pos = str.indexOf(' at ');				// Maybe "Band at Place"?
			if (pos != -1) str = str.replace(' at ', ' - ');
		}
		if (pos === -1) pos = str.indexOf(': ');	// Band: Song?
		if (pos === -1) pos = str.indexOf(' @ ');	// Band @ Place?
		if (pos === -1) {
			pos = str.indexOf('-');		// no luck, do you even hyphen bro?
			if (pos != -1) str = str.replace('-', ' - ');
		}

		if (pos === -1) meta.track = str;			// no seperator, just use the title.
		else {
			meta.artist = str.substr(0, pos).cTrim(' "/\\\'-—()' + ENTER);
			if (meta.artist.indexOf('[') === 0 && meta.artist.indexOf(']') !== -1) 
				meta.artist = meta.artist.substr(meta.artist.indexOf(']') + 1).cTrim(' "\'-' + ENTER);

			meta.track = str.substr(pos + 2, yPos - pos).cTrim(' "/\\\'-—[]()' + ENTER);
		}

		pos = meta.track.lastIndexOf('[');
		if (pos != -1) {	// parse out genre from [brackets]
			var cPos = meta.track.lastIndexOf(']');
			if (pos === 0) {
				if (cPos !== -1) {		// if a [ is at the start of title and there's no closing ], ignore it.
					meta.genre = meta.track.substr(1, cPos - 1);
					meta.track = meta.track.substr(cPos + 1);
				}
			}
			else {
				meta.genre = meta.track.substr(pos + 1).replace(']', '').replace(/\//g, '<br>').cTrim(' "\'-[]()' + ENTER);
				meta.track = meta.track.substr(0, pos).cTrim(' "\'-()[]' + ENTER);
			}

			if ($.isNumeric(meta.genre)) {		// sometimes the year gets put in [brackets]
				if (meta.year === '') meta.year = meta.genre;
				meta.genre = '';
			}
			else {
				var badTags = ['unofficial', 'official', 'new', 'hot', 'fresh', 'best', 'good', 'indie', 'alternative', 'xpost', 'crosspost'];
				var ok = true;
				$.each(badTags, function(i, val) { if (meta.genre.toLowerCase().indexOf(val) === 0) ok = false; });
				if (!ok) meta.genre = '';
			}
		}
		else meta.track = meta.track.cTrim(' "\'-()[]' + ENTER);


		if (swapTitle && meta.artist != '' && meta.title != '') {
			var t = meta.track;
			meta.track = meta.artist;
			meta.artist = t;
		}

		if (
			str.indexOf('.com/') != -1 
			|| str.indexOf('.net/') != -1 
			|| str.indexOf('.org/') != -1 
			|| str.indexOf('youtu.be/') != -1 
			|| (meta.artist.length < 3 && meta.track.length < 3)
		) {
			meta.artist = '';
			meta.track = str;
		}
		else {
			var l = meta.artist.substr(-1);
			if (l == '(' || l == '[') meta.artist = $.trim(meta.artist.substr(0, meta.artist.length - 1));

			l = meta.track.substr(-1);
			if (l == '(' || l == '[') meta.track = $.trim(meta.track.substr(0, meta.track.length - 1));

			// remove months from titles from r/fuckmusic's weird format
			var months = ['Jan', 'Feb', 'Mar', 'March', 'Apr', 'April', 'Jun', 'June', 'Jul', 'July', 'Aug', 'Sep', 'Sept', 'Oct', 'Nov', 'Dec'];
			$.each(months, function(i, month) {
				if (meta.track.indexOf('(' + month) != -1) {
					meta.track = $.trim(meta.track.replace('(' + month, ''));
					meta.year = $.trim(month + ' ' + meta.year);
				}
			});
		}
	}

	if (meta.artist.split('(').length > meta.artist.split(')').length) meta.artist += ')';
	if (meta.artist.split(')').length > meta.artist.split('(').length) meta.artist = '(' + meta.artist;
	if (meta.track.split('(').length > meta.track.split(')').length) meta.track += ')';
	if (meta.track.split(')').length > meta.track.split('(').length) meta.track = '(' + meta.track;

	if (meta.track.length > 60) meta.track = meta.track.substr(0, 60) + '&hellip;';
	if (meta.genre.length > 52) meta.genre = meta.genre.substr(0, 52) + '&hellip;';

	if (meta.track == '') {
		if (meta.genre != '') {
			meta.track = meta.genre;
			meta.genre = '';
		}
		else if (meta.year != '') {
			meta.track = meta.year;
			meta.year = '';
		}
	}

	// if (typeof meta.artist !== "string") meta.artist = meta.artist.join();
	// if (typeof meta.genre !== "string") meta.genre = meta.genre.join();
	// if (typeof meta.track !== "string") meta.track = meta.track.join();

	return meta;
}


// Tries to find the first Proper Noun in a string and returns it.  Otherwise, returns the entire thing.
String.prototype.firstProperNoun = function() {
	var str = this;
	var words = str.split(' ');
	var shorty = 999;
	var start = false;
	var stop = false;
	var ret = '';

	$.each(words, function(i, word) {
		if (word[0] !== undefined && word[0].replace(/[^A-Z]/, '_') === word[0]) {
			start = true;

			if (!stop) {
				ret += ' ' + word;
				if (word.length < shorty) shorty = word.length;

				var cnt = ret.split(' ').length;
				if (
					cnt > 4
					|| (cnt > 3 && shorty > 3)
				) stop = true;
			}
		}
		else if (start) stop = true;
	});

	if (ret.length < 7) ret = str;

	return $.trim(ret
		.replace(/[.,\?\!\[\]()'":;<>]/g, '')
		.replace(' HD', '')
		.replace(' HQ', '')
	);
}


// Determines if a title needs replacing.
String.prototype.isBadTitle = function() {		
	var str = this.toLowerCase();
	
	if (
		$.trim(str).length < 3
		|| $.isNumeric(str.replace(/@/g, '').replace(/-/g, '').replace(/:/g, '').replace(/\//g, '').replace(/ /g, ''))
		|| str == 'episode'
		|| str.indexOf('youtu.be') != -1 
		|| str.indexOf('youtube') != -1 
		|| str.indexOf('vimeo') != -1 
		|| str.indexOf('soundcloud') != -1 
		|| str.indexOf('bandcamp') != -1 
		|| str.indexOf('http') != -1 
		|| str.indexOf('iframe:') == 0 
		|| str.indexOf('stream') == 0
		|| str.indexOf('part ') == 0 
		|| str.indexOf('here') == 0 
		|| str.indexOf('live') == 0 
		|| str.indexOf('original') == 0 
		|| str.indexOf('obligatory') == 0 
		|| str.indexOf('remix') == 0 
		|| str.indexOf('music') == 0 
		|| str.indexOf('this') == 0 
		|| str.indexOf('vid') == 0 
		|| str.indexOf('link') == 0 
		|| str.indexOf('game') == 0 
		|| str.indexOf('for the lazy') != -1 
		|| str.indexOf('this here') != -1 
	) return true;
	else return false;
}

