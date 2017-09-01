listr.feeds = {};
listr.feeds.list = [];
listr.feeds.subs = [];		// Separate array of subreddits.  Used to track subs from multireddits when they're loaded.

listr.feeds.nix = function(idx) {
	var feed = listr.feeds.list[idx];

	if (confirm('Remove "' + feed.label + '" from feeds?')) {
			$.ajax({
				dataType: 'json'
				, url: '/delete/feed'

				, method: 'POST'
				, data : feed

				, success: function(json) {
					if (json.error !== undefined) alert('Error: ' + json.error);
					else {
						var parent = $('div.container.feeds li.collection-item.idx-' + idx).parent('div').parent('ul.collection');
						if (parent.find('li.collection-item').length == 0) {
							var liIdx = parent.parent('div').attr('id').replace('feeds-', '');
							parent.parent('div').remove();
							$('div.feeds ul.tabs li.tab:eq(' + liIdx + ')').remove();
						}
						else $('div.container.feeds li.collection-item.idx-' + idx).parent('div').remove();

						delete listr.feeds.list[idx];
					}
				}
				, error: function(jqXHR, textStatus, errorThrown) { alert('Error: invalid reply'); }
			});		
	}

	event.stopPropagation();
}

/*
	Feeds represent sources of links, i.e. reddit, youtube, etc.

	Properties:

	opts      -- one-word options are displayed on the bucket page when expanding a feed.  Opts must be unique.
	optsDesc  -- verbose descriptions to be displayed next to opts

	optSelect -- function that's called when user clicks on an <input>.  This function handles updating the menu or requesting links.

	load      -- function that retrives links from the source
*/


//////////////////////// radd.it magic playlists //////////////////////////////
listr.feeds['radd.it'] = {
	opts : [] // only options are defined in the database
	, optSelect : function(idx, ele) {
		var opt = $(ele).children('div').children('b').text();
// console.log('radd.it optSelect: ' + opt);
	}

	, load : function(url) {
// console.log('load: ' + url);
		// '/liked/' + i + '/' + cat
		if (listr.user && url.indexOf('/' + listr.user + '/liked/') == 0) {
			var idx = url.split('/liked/')[1]; //.split('/')[0];
			// $('div.container.liked a.liked-cat-' + idx).click();
			setTimeout(function() { $('#liked-' + idx + ' li.idx-all').click(); });
			return;
		}

		// Get all subreddits loaded as feeds.
		var subs = [];
		$.each(listr.feeds.list, function(i, feed) {
			var sub = feed.url.replace('/r/', '');
			if (feed.source === 'reddit' && feed.url.indexOf('/r/') == 0 && $.inArray(sub, subs) === -1) subs.push(sub);
		});
		$.each(listr.feeds.subs, function(i, sub) { if ($.inArray(sub, subs) === -1) subs.push(sub); });
		var postData = {'bucket': listr.bucket, 'subs': subs};

		$("#loading").show();
		$.ajax({
			method: 'POST'
			, dataType: 'json'
			, data: postData
			, url: url.replace('http://', 'https://')
			, success: function(json) {
				$("#loading").hide();

				if (json.error !== undefined) { alert('Error: ' + json.error); return; }
				else if (json.links === undefined) alert('Invalid data!' + ENTER + ENTER + "Please email ohno/at/radd.it with your username and what you're trying to do.");
				else {
					if (listr.opts['clearOnLoad']) listr.links.clear();

					listr.links.batchPush(true);
					
					$.each(json.links, function(i, link) {
						if (link.thumb === undefined || link.thumb.indexOf('http') != 0) link.thumb = listr.thumb;

						var related = {};
						if (link.permalink !== undefined) related = { 'permalink': link.permalink }

						var meta = {};
						if (link.meta !== undefined) meta = link.meta;

						var sub = '';
						if (link.subreddit !== undefined) sub = link.subreddit;

						var descrip = '';
						if (link.descrip !== undefined) descrip = link.descrip;

						var name = '';
						if (link.name !== undefined) name = link.name;

						listr.links.push({
							'url': link.url
							, 'title': link.title
							, 'author': link.author
							, 'thumb': link.thumb
							, 'related': related 
							, 'meta': meta
							, 'feed' : 'radd.it'
							// hotlinks & favauthors
							, 'subreddit' : sub
							, 'descrip' : descrip
							, 'id_feed' : name
						});
					});

					listr.links.batchPush(false);

					var shareURL = 'No direct URL available.';
					$('#share-url,#share-embed').val(shareURL);
				}
			}
			, error: function(jqXHR, textStatus, errorThrown) {
				alert('Error loading from radd.it!' + ENTER + ENTER + textStatus);
				$("#loading").hide();
				console.log('radd.it load error', textStatus, errorThrown);
			}
		});
	}

}

// load suggested playlist via URL
listr.feeds['suggested'] = {
	opts : [] // only options are defined in the database
	, optSelect : function(idx, ele) { }

	, load : function(url) {
		setTimeout(function() {	// timeout not really needed, but let's do this last anyway
			if ($('div.liked div.content div.links ul.suggested').length > 0)
				$('div.liked div.content div.links ul.suggested li:first').click();
			else if (listr.user == false) alert('You must be logged-in to get suggestions!');
			else alert('Oopsie, no suggested links found!');
		});
	}
}

/* No longer available.
listr.feeds['ol.radd.it'] = {	// For importing old likes and playlists.
	opts : []
	, optSelect : function(idx, ele) { }
	, load : function(url) {
		url += '.php';

		if (url.indexOf('playlist.php') !== -1) {
			var plEarl = prompt('Enter the full URL of the playlist to import.');
			if (
				plEarl == null 
				|| plEarl.indexOf('radd.it/playlists/') == -1
			) { alert('Invalid URL.  Try again, eh?');  return; }
			else url += "?url=" + plEarl;
		}

		$.ajax({
			dataType: 'json'
			, method: 'POST'
			, data: { 'b': listr.bucket, 'u': listr.user }
			, url: url
			, success: function(json) {
				if (json.error !== undefined) { alert('Error: ' + json.error); return; }
				else if (json.links === undefined) alert('Invalid data!' + ENTER + ENTER + "Please email ohno/at/radd.it with your username and what you're trying to do.");
				else {
					if (listr.opts['clearOnLoad']) listr.links.clear();

					listr.links.batchPush(true);
					
					$.each(json.links, function(i, link) {
							if (link.thumb === undefined && link.thumbnail !== undefined) link.thumb = link.thumbnail;
							if (link.thumb === undefined || link.thumb.length == 0 || link.thumb.indexOf('/.im/') == 0) link.thumb = listr.thumb;

							var related = {};
							if (link.permalink !== undefined) related = { 'permalink': link.permalink }

							listr.links.push({
								'url': link.url
								, 'title': link.title
								, 'thumb': link.thumb
								, 'related': related 
								, 'feed' : 'ol.radd.it'
							});
					});

					listr.links.batchPush(false);

					var shareURL = 'No direct URL available.';
					$('#share-url,#share-embed').val(shareURL);
				}

			}
			, error: function(jqXHR, textStatus, errorThrown) {
				alert('Error loading old likes or playlist!' + ENTER + ENTER + textStatus);
				console.log('playlist load error', textStatus, errorThrown);
			}
		});
	}
}
*/

listr.feeds['empty'] = {
	opts : [] // only options are defined in the database
	, optSelect : function(idx, ele) { }
	, load : function(url) {
		listr.links.clear();
		$('div.container.links').show();
		$(window).resize();
		$('html,body').animate({ scrollTop: $('div.container.links').position().top }, 250);
	}
}

// Not-so-magic playlists.
listr.feeds['playlist'] = {
	opts : [] // No optons for playlists.
	, optSelect : function(idx, ele) {
		var opt = $(ele).children('div').children('b').text();
console.log('playlist optSelect: ' + opt);
	}

	, load : function(url) {
// console.log('playlist load: ' + url);

			$("#loading").show();
			$.ajax({
				dataType: 'json'
				, url: url.replace('http://', 'https://')
				, success: function(json) {
					if (json.links === undefined) alert('Invalid playlist file!' + ENTER + ENTER + "Email ohno/at/radd.it with the URL of this playlist and I'll try to fix it!");
					else {
						if (listr.opts['clearOnLoad']) listr.links.clear();

						listr.links.batchPush(true);
						
						$.each(json.links, function(i, link) {
								listr.links.push({
									'url' : link.url
									, 'title' : link.title
									, 'thumb' : link.thumb
									, 'related' : link.related

									, 'feed' : 'playlist'
								});
						});


						// TODO: add shuffle
						// listr.links.batchLinks.shuffle();
						// $.each(listr.links.batchLinks, function(i, link) { link.idx = startLen + i; });		// fix post-shuffle indexes

						listr.links.batchPush(false);

						var shareURL = 'http://radd.it' + url.replace('/js/', '/').replace('.js', '') + '/' + listr.bucket;
						$('#share-url').val(shareURL);
						// $('#share-embed').val('<iframe height=\'640\' width=\'320\' src=\'' + shareURL.replace('//', '//embed.') + '\'></iframe>');
						$('#share-embed').val('<iframe height=\'640\' width=\'320\' src=\'' + shareURL + (shareURL.indexOf('?') == -1 ? '?embed' : '&embed') + '\'></iframe>');
					}

					$("#loading").hide();
				}
				, error: function(jqXHR, textStatus, errorThrown) {
					if (textStatus == 'parsererror') { 
						alert("Your playlist has become corrupted!  This isn't your fault." + ENTER + ENTER + "Email ohno/at/radd.it with the URL of this playlist and I'll try to fix it!");
					}
					else alert('Error loading playlist!' + ENTER + ENTER + textStatus);

					$("#loading").hide();
console.log('playlist load error', textStatus, errorThrown);
				}
			});
	}
}

//////////////////////// reddit ///////////////////////////////////////////////
listr.feeds['reddit'] = {
	opts : ['hot', 'new', 'top', 'keyword', 'flair', 'random']	// , '-playlists'
	, optsDesc : [
		'by score and newness'
		, 'by newness'
		, 'by score'
		, 'search for keyword'
		, 'search by flair'
		, 'randomly picked (slow loading!)'
		// , 'search for playlists'
	]

	, optSelect : function(idx, ele) {
		if (listr.feeds.list[idx] === undefined) { console.log('ERROR: idx ' + idx + ' not found in feed list', listr.feeds.list); return; }
		
		var opt = $('input[name=feed' + idx + 'Opts]:checked', ele).val();
 
		if (opt == 'hot') this.load(listr.feeds.list[idx].url);
		else if (opt == 'new') this.load(listr.feeds.list[idx].url + (listr.feeds.list[idx].url.indexOf('?') == -1 ? '/' : '&sort=') + 'new');

		// top options
		else if (opt == 'top') {
			var newOpts = ['today', 'this week', 'this month', 'this year'];
			var newDesc = ['top links from the last 24 hours', 'top links in the last week', 'top links in the last month', 'top links in the last year'];      
			var txt = '<form class="secondary-reveal-temp" action="#" onchange="listr.feeds[\'reddit\'].optSelect(' + idx + ', this);">';    // add onchange here to catch events?
			var cnt = newOpts.length;

			for (var i = 0; i < cnt; i++) {
				var label = newOpts[i];
				var desc = newDesc[i];
				var name = 'feed' + idx + 'Opts';
				var id = 'redditTop' + label;

				var disabled = '';
				if (label.indexOf('-') == 0) { disabled = ' disabled'; label = label.substr(1); }

				txt += 
					'<p><input ' + disabled + 'name="' + name + '" type="radio" id="' + id + '" value="' + label + '" />'
						+ '<label for="' + id + '"><b>' + label + '</b> ' + desc + '</label>'
					+ '</p>'
				;
			}
			txt += '</form>';

			$(ele).hide('slideup');    // swap out the form
			$(ele).parent().append(txt);
		}

		// top options
		else if (opt == 'today') this.load(listr.feeds.list[idx].url + (listr.feeds.list[idx].url.indexOf('?') == -1 ? '/top?sort=top&t=day' : '&sort=top&t=day'));
		else if (opt == 'this week') this.load(listr.feeds.list[idx].url + (listr.feeds.list[idx].url.indexOf('?') == -1 ? '/top?sort=top&t=week' : '&sort=top&t=week'));
		else if (opt == 'this month') this.load(listr.feeds.list[idx].url + (listr.feeds.list[idx].url.indexOf('?') == -1 ? '/top?sort=top&t=month' : '&sort=top&t=month'));
		else if (opt == 'this year') this.load(listr.feeds.list[idx].url + (listr.feeds.list[idx].url.indexOf('?') == -1 ? '/top?sort=top&t=year' : '&sort=top&t=year'));

		else if (opt == 'flair') {
			$("#loading").show();

			var url = listr.feeds.list[idx].url.split('?')[0];
			if (url.lastIndexOf('/') === url.length - 1) url = url.substr(0, url.length - 1); // trim last /
			if (url.indexOf('http') !== 0) url = 'https://www.reddit.com' + url;              // translate relative path to absolute
			url += '/search.json?q=self%3A0&sort=relevance&restrict_sr=on&t=week&limit=100';

			// search this sub and find what flairs are being used
			$.ajax({
				dataType: 'json'
				, url: url.replace('http://', 'https://')
				, success: function(json) {
					if (json.data !== undefined && json.kind === "Listing")
					{
						var flairs = [];
						var textFlairs = false;

						$.each(json.data.children, function(idx, link) {
							if (link.data.link_flair_text !== null) {
								if ($.inArray(link.data.link_flair_text, flairs) === -1) flairs.push(link.data.link_flair_text);
								textFlairs = true;
							}
							else if (
								!textFlairs
								&& link.data.link_flair_css_class !== null 
								&& $.inArray(link.data.link_flair_css_class, flairs) === -1
							) flairs.push(link.data.link_flair_css_class);
						});

						flairs.sort(function(a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); }); // case-insensitive sort

						if (flairs.length === 0) alert('No flair found for posts in this sub.');
						else {
							if ($('div.reddit-flair-select select').length > 0)   // If there's a pre-existing <select>, remove materialize's replacement.
								$('#' + $('div.reddit-flair-select span.select-dropdown').data('activates')).remove();

							var html = '<label>Select flair to load</label><select id="reddit-flair-query">';
							$.each(flairs, function(i, flair) { html += '<option value="' + flair + '">' + flair + '</option>'; });
							html += '</select>';

							$('div.reddit-flair-select').html(html);
							$('#reddit-flair-query').material_select();

							$('#reddit-flair-url').val(listr.feeds.list[idx].url);
							$('#reddit-flair').openModal();
						}
					}
					else {
						alert('Nope.  Invalid reply from reddit.  Is it down?');
						console.log('ERROR: flair check', json);
					}

					$("#loading").hide();
				}
				, error: function(jqXHR, textStatus, errorThrown) { alert('Error: invalid reply'); $("#loading").hide(); }
			});
		}
		else if (opt == 'keyword') {
			$('#reddit-search-url').val(listr.feeds.list[idx].url);
			$('#reddit-search').openModal();
		}
		else if (opt == 'random') {
			var url = listr.feeds.list[idx].url;
			listr.feeds['reddit.com'].loadRandom(url);
		}
		else { console.log('ERROR: unknown reddit opt ' + opt); }
	}

	, loadRandom : function(url) {
		if (url.indexOf('/r/') == -1) {
			alert('Error: Sorry, random only works with subreddits!' + ENTER + ENTER + 'You can use /r/sub1+sub2 but too many subs breaks reddit\'s search!');
			return;
		}

		listr.opts['randomLoad'] = false;

		if (url.lastIndexOf('/') === url.length - 1) url = url.substr(0, url.length - 1); // trim last /
		if (url.indexOf('http') !== 0) url = 'https://www.reddit.com' + url;              // translate relative path to absolute

		if (url.indexOf('/', url.indexOf('/r/') + 3) !== -1) url = url.substr(0, url.indexOf('/', url.indexOf('/r/') + 3));
		url = url.split('.json')[0].split('?')[0];

		// First get about.json to see how old the subreddit is.
		$.ajax({
			dataType: 'json'
			,url: url.split('+')[0].replace('http://', 'https://') + '/about.json'	// split() in case of /r/sub1+sub2
			, success: function(json) {
				if (json.data === undefined || !$.isNumeric(json.data.created_utc)) { alert('Error getting subreddit data.'); console.log('about.json error', json); return; }

				var shareURL = url.replace('https://', 'http://').replace('//www.', '//').replace('//reddit.com/', '//radd.it/').replace('.json', '').replace('?limit=50', '').replace('&limit=50', '') + '/' + listr.bucket + '?random';
				$('#share-url').val(shareURL);
				$('#share-embed').val('<iframe height=\'640\' width=\'320\' src=\'' + shareURL + (shareURL.indexOf('?') == -1 ? '?embed' : '&embed') + '\'></iframe>');

				var created = json.data.created_utc;
				var now = Math.floor(new Date().getTime() / 1000);
				var age = now - created;
				var start = created + Math.floor(Math.random() * age / 2);
				var useTime = true;
				// var lowerLimit = 20;

				var span = Math.round(age / 50);
				if (span < (3600 * 24 * 7)) span = (3600 * 24 * 7);	// at least a week

				var startLen = listr.links.list.length;
				// var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'y', 'z'];
				// var letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't'];
				// var letters = ['r', 'p', 's', 'b', 'c', 'm', 'n', 'd', 'f', 'g', 'h'];

				function getLinks(attempts) {
					if (attempts === undefined) var attempts = 0;

					var sort = ['new', 'top', 'comments'][Math.floor(Math.random() * 3)];	// , 'relevance', 'hot', 

					// 	(Math.floor(Math.random() * 3) * (3600 * 24 * 30))	// 0 to 2 months
					// 	+ (Math.ceil(Math.random() * 3) * (3600 * 24 * 7))		// 1 to 3 weeks
					// 	+ (Math.floor(Math.random() * 7) * (3600 * 24))			// 0 to 7 days
					// 	+ (Math.floor(Math.random() * 24) * (3600))					// 0 to 24 hours
					// ;

					var limit = 25 + Math.ceil(Math.random() * 25);

					var thisURL = url + '/search.json?q=timestamp%3A' + start + '..' + (start + span) + '&syntax=cloudsearch&restrict_sr=on&limit=' + limit + '&sort=' + sort;
					if (!useTime) thisURL = url + '/search.json?q=self%3A0%20a&sort=' + sort + '&t=all&limit=' + limit + '&restrict_sr=on';

// console.log(attempts + ' // ' + url + '/search.json?q=timestamp%3A' + start + '..' + (start + span) + '&syntax=cloudsearch&restrict_sr=on&limit=' + limit + '&sort=' + sort);
// console.log(attempts + ' // ' + thisURL);

					$.ajax({
						dataType: 'json'
						, url: thisURL.replace('http://', 'https://')
						, success: function(json) {
							if (json.data !== undefined && json.kind === "Listing")
							{

// console.log(json.data.children.length + ' results, span ' + span);

								if (!useTime) useTime = true;
								else if (json.data.children.length < limit) {
									if (json.data.children.length <= limit / 5) useTime = false;
									else {
										span *= 2;
										if (span > age / 2) span = Math.round(age / 2);
									}
								}

								$.each(json.data.children, function(idx, link) {
									var thumb = link.data.thumbnail;
									try {   // update w/ source thumbnail if available
										if (
											thumb.indexOf('http') !== 0   // Too many dead images directly from youtube.  Only use those URLs if we have to.
											|| link.data.media.oembed.thumbnail_url.indexOf('i.ytimg.com') === -1
										) thumb = link.data.media.oembed.thumbnail_url; 
									} catch(e) { }  

									var descrip = '';
									try { descrip = link.data.media.oembed.description; } catch(e) { }

									var uploaderTitle = '';
									try { uploaderTitle = link.data.media.oembed.title; } catch(e) { }

									var uploader = '';
									try { uploader = link.data.media.oembed.author_name; } catch(e) { }

									var uploaderURL = '';
									try { uploaderURL = link.data.media.oembed.author_url; } catch(e) { }


									listr.links.push({
										'url' : link.data.url
										, 'title' : link.data.title
										, 'thumb' : thumb
										, 'descrip' : descrip

										, 'feed' : 'reddit'
										, 'id_feed' : link.data.name
										, 'utc_feed' : link.data.created
										, 'author' : link.data.author
										, 'score' : link.data.score
										, 'subreddit' : link.data.subreddit
										, 'related' : { 'permalink' : link.data.permalink }
										, 'meta' : { 'nsfw' : link.data.over_18 }

										, 'domain' : link.data.domain
										, 'uploader' : uploader
										, 'uploader_title' : uploaderTitle
										, 'uploader_url' : uploaderURL
									});
								});

								if (listr.links.batchLinks.length >= 100 || attempts > 9) {
									listr.links.batchLinks.shuffle();
									$.each(listr.links.batchLinks, function(i, link) { link.idx = startLen + i; });		// fix post-shuffle indexes
									listr.links.batchPush(false);

									$("#loading").hide();
								}
								else {
									start += span + Math.floor(Math.random() * age);
									while (start >= now) start = created + Math.floor(Math.random() * age);

									setTimeout(function() { getLinks(attempts + 1); }, (listr.opts.ajaxDelay / 10));
								}
							}
							else alert('Error loading reddit data.  Is it down?');
						}
						, error: function(jqXHR, textStatus, errorThrown) {
							listr.links.batchLinks.shuffle();
							$.each(listr.links.batchLinks, function(i, link) { link.idx = startLen + i; });		// fix post-shuffle indexes
							listr.links.batchPush(false);

							$("#loading").hide();
						}
					});
				}	// end: getLinks()

				if (listr.opts['clearOnLoad']) listr.links.clear();

				listr.links.batchPush(true);
				getLinks();

				$("#loading").show();
			}	// end: outer .success()
			, error: function(jqXHR, textStatus, errorThrown) { alert('Error getting reddit data.  Are you using a valid URL?'); }
		});	// end: outer $.ajax()
	}

	, load : function(url) {
		if (url.lastIndexOf('/') === url.length - 1) url = url.substr(0, url.length - 1); // trim last /
		if (url.indexOf('http') !== 0) url = 'https://www.reddit.com' + url;              // translate relative path to absolute
		if (url.indexOf('.json') === -1) {                                                // add the .json
			var qMark = url.indexOf('?');
			if (qMark === -1) url += '.json';
			else url = url.substr(0, qMark) + '.json' + url.substr(qMark);
		}

		if (url.indexOf('limit=') === -1) {
			if (url.indexOf('/comments/') === -1) url += (url.indexOf('?') === -1 ? '?' : '&') + 'limit=50'; // add "limit" param
			else url += (url.indexOf('?') === -1 ? '?' : '&') + 'limit=100';
		}

		if (listr.opts['randomLoad']) return this.loadRandom(url);

		$("#loading").show();

		// Option selected, reset all menus beneath feeds.
		$('div.container.feeds div.secondary-reveal form').show();    // show all-top level forms..
		$('div.container.feeds form.secondary-reveal-temp').remove(); // ..and remove the rest.
		$('div.container.feeds div.secondary-reveal').hide();         // hide any open sec-reveals..
		$('div.container.feeds ul li div a i.mdi-hardware-keyboard-arrow-up').removeClass('mdi-hardware-keyboard-arrow-up').addClass('mdi-hardware-keyboard-arrow-down');

		$.ajax({
			dataType: 'json'
			, url: url.replace('http://', 'https://')
			, success: function(json) {

				if (url.indexOf('after=') == -1) {
					if (listr.opts['clearOnLoad']) listr.links.clear();

					var shareURL = url.replace('https://', 'http://').replace('//www.', '//').replace('//reddit.com/', '//radd.it/').replace('.json', '').replace('?limit=50', '').replace('&limit=50', '') + '/' + listr.bucket;
					$('#share-url').val(shareURL);
					$('#share-embed').val('<iframe height=\'640\' width=\'320\' src=\'' + shareURL + (shareURL.indexOf('?') == -1 ? '?embed' : '&embed') + '\'></iframe>');
				}

//// postview-- load any links in selftext and comments ///////////////////////////////////////////
				if (
					json[0] !== undefined && json[0].kind === 'Listing'
					&& json[1] !== undefined && json[1].kind === 'Listing'
				) {
					listr.links.batchPush(true);

					if (
						listr.opts['allowSelftext']
						&& json[0].data.children[0].data.selftext_html !== undefined 
						&& json[0].data.children[0].data.selftext_html !== null
					) {   // parse links from selftext
						var html = json[0].data.children[0].data.selftext_html;
						var found = $('<div />').html(html.htmlDecode()).find('a');

						found.each(function(idx) {
							if ($(this).attr('href') !== undefined && $(this).attr('href').indexOf('http') == 0)
								listr.links.push({
									'url' : $(this).attr('href')
									, 'title' : $(this).html()

									, 'feed' : 'reddit'
									, 'id_feed' : json[0].data.children[0].data.name
									, 'utc_feed' : json[0].data.children[0].data.created
									, 'author' : json[0].data.children[0].data.author
									, 'score' : json[0].data.children[0].data.score
									, 'subreddit' : json[0].data.children[0].data.subreddit
									, 'related' : { 'permalink' : json[0].data.children[0].data.permalink }
								});
						});
					}
					else if (json[0].data.children[0].data.url.indexOf('reddit.com/') == -1)
							listr.links.push({                      // If it's a non-reddit URL, add the original link.
								'url' : json[0].data.children[0].data.url
								, 'title' : json[0].data.children[0].data.title

								, 'feed' : 'reddit'
								, 'id_feed' : json[0].data.children[0].data.name
								, 'utc_feed' : json[0].data.children[0].data.created
								, 'author' : json[0].data.children[0].data.author
								, 'score' : json[0].data.children[0].data.score
								, 'subreddit' : json[0].data.children[0].data.subreddit
								, 'related' : { 'permalink' : json[0].data.children[0].data.permalink }
							});


					// Reiterate through comments and push() any found links.
					(function appendComments(comments, depth)
					{
						$.each(comments, function(ii, value) {
							if (value['kind'] == "t1") {
								if (
									value['data']['body_html'] != null 
									// && value['data']['author'].toLowerCase().lastIndexOf('bot') != value['data']['author'].length - 3
								) {   // Is there text in the comment?  Is it not from a bot?
									var found = $("<div />").html(value['data']['body_html'].htmlDecode()).find("a");

									found.each(function(idx) {
										if ($(this).attr('href') !== undefined && $(this).attr('href').indexOf('http') == 0)
											listr.links.push({
												'url' : $(this).attr('href')
												, 'title' : $(this).html()

												, 'feed' : 'reddit'
												, 'id_feed' : value['data']['name']
												, 'utc_feed' : value['data']['created']
												, 'author' : value['data']['author']
												, 'score' : value['data']['score']
												, 'subreddit' : value['data']['subreddit']
												, 'related' : { 
													'permalink' : json[0].data.children[0].data.permalink + value['data']['id'] 
												}
											});
									});
								}
								
								// Does this comment have replies?  Check them too.
								if (value['data']['replies'] != "") appendComments(value['data']['replies']['data']['children'], depth + 1);
							}
						});
					})(json[1]['data']['children'], 0);

					listr.links.batchPush(false);
				}

//// wikipage-- load any links found ///////////////////////////////////////////////////////////////
				else if (json.kind === "wikipage") {
					if (json.data.content_html !== undefined && json.data.content_html.length) {
						listr.links.batchPush(true);
						
						var html = json.data.content_html;
						var found = $("<div />").html(html.htmlDecode()).find("a");
						found.each(function(idx) {
							if ($(this).attr('href') !== undefined && $(this).attr('href').indexOf('http') == 0)
								listr.links.push({
									'url' : $(this).attr('href')
									, 'title' : $(this).html()

									, 'feed' : 'reddit'
									, 'id_feed' : url.replace('https:', '').replace('http:', '').replace('//', '').replace('www.', '').replace('reddit.com/', '').replace('.json', '')
									, 'utc_feed' : json.data.revision_date
									, 'author' : json.data.revision_by.data.name
									, 'score' : 0
									, 'subreddit' : url.split('/r/')[1].split('/')[0]
									, 'related' : { 'permalink' : url }
								});
						});

						listr.links.batchPush(false);
					}
					else console.log('ERROR: wikipage has no content_html');
				}

//// subreddit load-- load links & add listing to next 50 links ////////////////////////////////////
				else if (json.kind === "Listing" && json.data !== undefined)
				{
					listr.links.batchPush(true);

	// Nope!  It's actually postview for a single post via /by_id.  Check for links in URL and selftext.
					if (url.indexOf('/by_id/') !== -1 && json.data.children.length === 1) {
						if (json.data.children[0].data.url.indexOf('reddit.com/') === -1)
							listr.links.push({
								'url' : json.data.children[0].data.url
								, 'title' : json.data.children[0].data.url.title

								, 'feed' : 'reddit'
								, 'id_feed' : json.data.children[0].data.name
								, 'utc_feed' : json.data.children[0].data.created
								, 'author' : json.data.children[0].data.author
								, 'score' : json.data.children[0].data.score
								, 'subreddit' : json.data.children[0].data.subreddit
								, 'related' : { 'permalink' : json.data.children[0].data.permalink }
							});
						else if (json.data.children[0].data.selftext_html !== undefined && json.data.children[0].data.selftext_html !== null)
						{   // parse links from selftext
							var html = json.data.children[0].data.selftext_html;
							var found = $('<div />').html(html.htmlDecode()).find('a');

							found.each(function(idx) {
								if ($(this).attr('href') !== undefined && $(this).attr('href').indexOf('http') == 0)
									listr.links.push({
										'url' : $(this).attr('href')
										, 'title' : $(this).html()

										, 'feed' : 'reddit'
										, 'id_feed' : json.data.children[0].data.name
										, 'utc_feed' : json.data.children[0].data.created
										, 'author' : json.data.children[0].data.author
										, 'score' : json.data.children[0].data.score
										, 'subreddit' : json.data.children[0].data.subreddit
										, 'related' : { 'permalink' : json.data.children[0].data.permalink }
									});
							});
						}
					}
					else {
						$.each(json.data.children, function(idx, link) {
							if (listr.opts['allowNSFW'] || !link.data.over_18)
							{
								var thumb = link.data.thumbnail;
								try {   // update w/ source thumbnail if available
									if (
										thumb.indexOf('http') !== 0   // Too many dead images directly from youtube.  Only use those URLs if we have to.
										|| link.data.media.oembed.thumbnail_url.indexOf('i.ytimg.com') === -1
									) thumb = link.data.media.oembed.thumbnail_url; 
								} catch(e) { }  

								var descrip = '';
								try { descrip = link.data.media.oembed.description; } catch(e) { }

								var uploaderTitle = '';
								try { uploaderTitle = link.data.media.oembed.title; } catch(e) { }

								var uploader = '';
								try { uploader = link.data.media.oembed.author_name; } catch(e) { }

								var uploaderURL = '';
								try { uploaderURL = link.data.media.oembed.author_url; } catch(e) { }

								// var htmlEmbed = '';
								// try { htmlEmbed = link.data.media.oembed.html; } catch(e) { }

								listr.links.push({
									'url' : link.data.url
									, 'title' : link.data.title
									, 'thumb' : thumb
									, 'descrip' : descrip

									, 'feed' : 'reddit'
									, 'id_feed' : link.data.name
									, 'utc_feed' : link.data.created
									, 'author' : link.data.author
									, 'score' : link.data.score
									, 'subreddit' : link.data.subreddit
									, 'related' : { 'permalink' : link.data.permalink }
									, 'meta' : { 'nsfw' : link.data.over_18 }

									, 'domain' : link.data.domain
									, 'uploader' : uploader
									, 'uploader_title' : uploaderTitle
									, 'uploader_url' : uploaderURL

									// , 'embed' : htmlEmbed
								});

								// If this sub isn't already in our list of loaded subreddits, add it.
								if ($.inArray(link.data.subreddit, listr.feeds.subs) === -1) listr.feeds.subs.push(link.data.subreddit);
							}
						});
					}

					listr.links.batchPush(false);

					// Did reddit include an "after" value?  If so, add listing after the links to load more from this feed.
					if (json.data.after !== null) {
						var aUrl = url;
						var afPos = aUrl.indexOf('after=');
						if (afPos !== -1) {
							var ampPos = aUrl.indexOf('&', afPos);
							if (ampPos == -1) ampPos = aUrl.length;
							aUrl = aUrl.substr(0, afPos - 1) + aUrl.substr(ampPos + 1);
						}

						var lLabel = '';
						if (url.indexOf('/m/') !== -1) lLabel = 'Multi';
						else if (url.indexOf('/r/') !== -1) lLabel = url.split('/r/')[1].split('.')[0].split('/')[0].split('?')[0];
						else if (url.indexOf('/search') !== -1) label = 'Search Results';
						if (lLabel == '') lLabel = url.substr(0, 16) + (url.length > 16 ? '&hellip;' : ''); //  '..?';

						listr.listings.push({
							'feed' : 'reddit'
							, 'url' : aUrl + (aUrl.indexOf('?') === -1 ? '?' : '&') + "after=" + json.data.after
							, 'label' : lLabel
							, 'descrip' : 'Load more from ' + lLabel
							// , 'icon' : 'mdi-action-stars'
						});
					}
				}
				else { console.log('ERROR: reddit returned unknown format.', json); }

				$("#loading").hide();
			}
			, error: function(jqXHR, textStatus, errorThrown) { alert('Error: invalid reply'); $("#loading").hide(); }
		});
	}
};

//////////////////////// voat.co /////////////////////////////////////////
/* Not ready yet!
listr.feeds['voat'] = {
	opts : []
	, optSelect : function(idx, ele) { }
	, load : function(url) {
		var verse = url.split('/v/')[1].split('/')[0].split('?')[0];	// https://voat.co/v/listentous
		// var apiURL = 'https://voat.co/api/v1/v/' + verse + '/info';
		var apiURL = 'https://fakevout.azurewebsites.net/api/v1/v/' + verse + '/info';

		console.log('voat: ' + apiURL);

		if (listr.opts['clearOnLoad']) listr.links.clear();
		$("#loading").show();

		$.ajax({
			url: apiURL
			, type: 'GET'
			, dataType: 'json'
			, success: function(json) { console.log('voat sez:', json); }
			, error: function(jqXHR, textStatus, errorThrown) { alert('Error: invalid reply'); console.log('ERR', jqXHR, textStatus, errorThrown); }
			, beforeSend: function(xhrObj) {
	            xhrObj.setRequestHeader("Content-Type","application/json");
	            xhrObj.setRequestHeader("Voat-ApiKey","wzzSqOVSynwbUitj+f1qCA==");
	            // xhrObj.setRequestHeader("Accept","application/json");
	        }
		});
	}
}
*/
/* moved to radd.it source
//////////////////////// posts upvoted on reddit /////////////////////////////////////////
listr.feeds['reddit-upvoted'] = {
	opts : []
	, optSelect : function(idx, ele) { }
	, load : function(url) {
// console.log('reddit-upvoted: ' + url);

		if (listr.opts['clearOnLoad']) listr.links.clear();

		$("#loading").show();

		var subs = [];

		// Get all subreddits loaded as feeds.
		$.each(listr.feeds.list, function(i, feed) {
			var sub = feed.url.replace('/r/', '');

			if (feed.source === 'reddit' && feed.url.indexOf('/r/') == 0 && $.inArray(sub, subs) === -1) subs.push(sub);
		});

		// Then add any subreddits we've loaded (esp. from multis) to the list.
		$.each(listr.feeds.subs, function(i, sub) { if ($.inArray(sub, subs) === -1) subs.push(sub); });

// console.log('subs', subs);

		$.ajax({
			url: url
			, type: "POST"
			, data: {'bucket': listr.bucket, 'subs': subs}
			, dataType: 'json'
			, success: function(json) {
				listr.links.batchPush(true);

				$.each(json.links, function(i, upvoted) {
					listr.links.push({
						'url' : upvoted.url
						, 'title' : upvoted.title
						, 'thumb' : upvoted.thumb
						, 'descrip' : upvoted.descrip
						, 'author' : upvoted.author

						, 'feed' : 'reddit'
						, 'id_feed' : upvoted.name
						, 'subreddit' : upvoted.subreddit
						, 'related' : { 'permalink': upvoted.permalink }
					});
				});

				listr.links.batchPush(false);

				var shareURL = 'No direct URL available.'; // 'http://radd.it' + url.replace('/js/', '/') + '/' + listr.bucket;
				$('#share-url,#share-embed').val(shareURL);
				// $('#share-embed').val('<iframe height=\'640\' width=\'320\' src=\'' + shareURL + '\'></iframe>');

				$("#loading").hide();
			}
		});
	}
}
*/

//////////////////////// youtube playlists //////////////////////////////////////////////
listr.feeds['youtube-playlist'] = {
	opts : [] // only options are defined in the database
	, optSelect : function(idx, ele) {
// 		if ($(ele).hasClass('no-opts')) {
// console.log('pl load', );
// 			this.load(listr.feeds.list[idx].url);
// 			return;
// 		}

		var opt = $(ele).children('div').children('b').text();
		var appendEle = $(ele).find('div.secondary-reveal');

// console.log('youtube-playlist feed: ' + opt);

		if (opt === 'Youtube Playlist') {
			var txt = 
				'<form id="yt-playlist-form">'
					+ '<div class="row" style="margin-top:10px">'
						+ '<div class="input-field col s9 offset-s1">'
							+ '<input id="yt-playlist-query" type="text">'
							+ '<label for="yt-playlist-query">Search term <i>or</i> URL of playlist</label>'
						+ '</div>'
						+ '<div class="col s2">'
							+ '<a onclick="listr.feeds[\'youtube-playlist\'].search();" class="reddit-search-go btn-floating btn-large waves-effect waves-light green darken-2"><i class="mdi-action-search"></i></a>'
						+ '</div>'
					+ '</div>'
					+ '<div class="yt-playlist-results row hidden">'
						+ '<div class="s11 offset-s1">'
						+ '</div>'
					+ '</div>'
				+ '</form>'
			;

			appendEle.html(txt); // .find('form.secondary-reveal-temp').show();
		}
	}

	, load : function(url, callback) {
		if (callback === undefined) var callback = false;

		$("#loading").show();

		var id_playlist = false;

		// http://radd.it/https://www.youtube.com/user/FunkNightRecords
		if (url.indexOf('list=') != -1) {
			id_playlist = url.split('list=')[1].split('&')[0].split('#')[0];
			if (id_playlist.substr(0, 2) == 'PL' || id_playlist.substr(0, 2) == 'LL') id_playlist = id_playlist.substr(2);
		}
		else if (url.indexOf('/channel/') != -1)
			id_playlist = url.split('/channel/')[1].split('/')[0].split('?')[0].split('#')[0].replace('UC', 'UU');
		else if (url.indexOf('/user/') != -1) {
			id_playlist = url.split('/user/')[1].split('/')[0].split('?')[0];
 
		    $.ajax({
		      dataType: "json"
		      , url: 													// youtube API v3
		      	'https://www.googleapis.com/youtube/v3/channels?part=contentDetails'
		      	+ '&key=AIzaSyCZwSZBG0DReBq7-EZT_EWRQbLe7v_yL1o'
						+ '&forUsername=' + encodeURIComponent(id_playlist)

			    , success: function(json) {
					if (json.items !== undefined && json.items.length > 0) {
						try {		// try..catch() in case relatedPlaylists.uploads isn't there (which may never happen?)
							listr.feeds['youtube-playlist'].load('https://youtube.com/playlist?list=' + json.items[0].contentDetails.relatedPlaylists.uploads);
						}
						catch(e) { }
				    }
				  }
				});

		    return;
		}
		else if (url.indexOf('v=') != -1) {
			setTimeout(function() { listr.links.push({'url': 'https:/' + url}); });
			return;
		}
		else {
			console.log('ERROR: youtube-playlist unknown URL', url);
			return;
		}

		if (listr.opts['clearOnLoad']) listr.links.clear();

		//// Ask youtube about this playlist. //////////////
		listr.links.batchPush(true);

		(function ytPlaylistAjax(after) {
			$.ajax({
				dataType: 'json'
				, url:                          // youtube API v3
					'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet'
					+ '&key=AIzaSyCZwSZBG0DReBq7-EZT_EWRQbLe7v_yL1o&maxResults=50'
					+ '&playlistId=' + encodeURIComponent(id_playlist)
					+ (after === '' ? '' : '&pageToken=' + after)

				, success: function(json) {
					if (json.items !== undefined && json.items.length > 0) {
						$.each(json.items, function(i, item) {
							var snip = item.snippet;
							var thumb = listr.thumb;
							try { thumb = snip.thumbnails.standard.url; } catch(e) {}
							if (thumb == listr.thumb) { try { thumb = snip.thumbnails.high.url; } catch(e) {} }

							if (snip.resourceId.kind === 'youtube#video')
								listr.links.push({
									'url' : 'http://youtube.com/watch?v=' + snip.resourceId.videoId
									, 'title' : snip.title

									, 'feed' : 'youtube'
									, 'id_feed' : snip.resourceId.videoId
									, 'utc_feed' : snip.publishedAt
									, 'author' : snip.channelTitle
									, 'descrip' : snip.description
									, 'thumb' : thumb
								});
							else console.log('ERROR?  unknown kind from youtube playlist load: ' + snip.resourceId.kind);
						});

						if (json.nextPageToken !== undefined) ytPlaylistAjax(json.nextPageToken);   // If there's more results, get them too.
						else {
							listr.links.batchPush(false);                                          // Otherwise, tell listr that we're done.
							$("#loading").hide();

							var shareURL = 'http://radd.it/youtube/list=' + id_playlist;
							$('#share-url').val(shareURL);
							$('#share-embed').val('<iframe height=\'640\' width=\'320\' src=\'' + shareURL + (shareURL.indexOf('?') == -1 ? '?embed' : '&embed') + '\'></iframe>');

							if (callback) callback();
						}
					}
					else {
						alert('Youtube doesn\'t recognize that as a valid playlist URL.');
						$("#loading").hide();
					}
				 }

				, error: function(jqXHR, textStatus, errorThrown) {
					alert('Error retreiving Youtube playlist. :/');
					console.log('youtube playlist error: ' + textStatus, errorThrown);
				}
			});
		})('');
	}

	, search : function() {
		var query = $('#yt-playlist-query').val();
		
		if (query.indexOf('http') === 0 && query.indexOf('list=') !== -1)       // If the query is a URL, just load that playlist.
			 this.load(query);
		else {                                                                  // Otherwise, search youtube playlists for the query.
			function results(links) {
				var html = '';
				$.each(links, function(idx, link) {
					html +=
						'<div class="link-dsp z-depth-1 idx-' + link.idx + '">'
							+ '<img class="thumb z-depth-1 hide-on-small-only" src="' + link.thumb + '">'
							+ '<h5><span class="title">' + link.title + '</span></h5>'
							+ '<p>' + link.descrip + '</p>'
							// + '<p>' + link.url + '</p>'
							+ '<div class="opts">'
								+ '<a onClick="listr.feeds[\'youtube-playlist\'].load(\'' + link.url + '\');" class="waves-effect waves-light btn"><i class="mdi-action-visibility left"></i>load</a>'
								+ '<a target="_blank" href="' + link.url + '" class="waves-effect waves-light btn"><i class="mdi-action-open-in-new left"></i>open</a>'   // removed:  onClick="listr.links.stop();"
							+ '</div>'
						+ '</div>'
					;
				});

				$('div.container.feeds div.yt-playlist-results').html(html).show();
			}

			// We already have a search in sources.js, so use it.
			listr.sources['youtube.com'].search(query, results, {'types': 'playlist,channel'});
		}
	}
}


//////////////////////// initialize feeds //////////////////////////////////////////////////////////////////////////////////
$(document).ready(function() {
	$("#feedCats").change(function(e) {
		var val = $('#feedCats option:selected').val();
		$('div.container.feeds div.section div.links div.results').hide();
		$('#feeds-' + val).show();
	});

	var idx = 0;

	// For each feed, add handler for opening section and displaying options when it's clicking.
	$("div.feeds div ul li.collection-item").each(function() {
		var classList = $(this).attr('class').split(/\s+/);
		var feed = '';
		var hasOpts = true;

		$.each(classList, function(index, label) { 
			if (label.indexOf('feed-') == 0) feed = label.replace('feed-', ''); 
			if (label === 'no-opts') hasOpts = false;
		});

		// Make sure we have a source handler defined above.
		if (listr.feeds[feed] === undefined) { console.log('ERROR: no feed data for ' + feed); return; }

		if (hasOpts) {
			var feedOpts = listr.feeds[feed].opts;
			var feedDesc = listr.feeds[feed].optsDesc;
			var cnt = feedOpts.length;

			// If it's marked as having options but none are defined, just call optSelect() when the <li> is clicked.
			if (cnt === 0)
				$(this).click(function() { 
					if ($(this).find('div.secondary-reveal').css('display') == 'none') listr.feeds[feed].optSelect(idx, this); 
				});
			else {
				var txt = '<form onchange="listr.feeds[\'' + feed + '\'].optSelect(' + idx + ', this);">';

				for (var i = 0; i < cnt; i++) {
					var label = feedOpts[i];
					var desc = feedDesc[i];
					var name = 'feed' + idx + 'Opts';
					var id = 'fd' + idx + 'o' + label;

					var disabled = '';
					if (label.indexOf('-') == 0) { disabled = 'disabled '; label = label.substr(1); }

					txt += 
						'<p><input ' + disabled + 'class="with-gap" name="' + name + '" type="radio" id="' + id + '" value="' + label + '" />'
							+ '<label for="' + id + '"><b>' + label + '</b> ' + desc + '</label>'
						+ '</p>'
					;
				}
				txt += '</form>';

				$(this).find("div.secondary-reveal").append(txt);
			}

		}
		else {
			$(this).click(function() {
				var classList = $(this).attr('class').split(/\s+/);
				var idx = false;

				$.each(classList, function(index, label) { 
					if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', ''));
				});

				if (idx !== false) listr.feeds[feed].load(listr.feeds.list[idx].url); 
				else console.log('ERROR: no feed found', this);
			});
		}

		$(this).addClass('idx-' + idx);
		idx++;
	});


	// Add "browse all" button for each category.
	setTimeout(function() {		// Timeout needed so listr.php can populate listr.feeds.list
		$("div.feeds div ul.collection").each(function(i, ele) {
			var feeds = $(ele).find('li.collection-item');
			var earl = '';

			$.each(feeds, function(ii, feedEle) {
				var idx = false;
				var feed = '';
				var classList = $(feedEle).attr('class').split(/\s+/);
				$.each(classList, function(index, label) { 
					if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', ''));
					if (label.indexOf('feed-') == 0) feed = label.replace('feed-', '');
				});

				if (
					idx !== false
					&& listr.feeds.list[idx].source == 'reddit'
					&& listr.feeds.list[idx].url.indexOf('/r/') == 0
				) earl += (earl == '' ? '' : '+') + listr.feeds.list[idx].url.split('/r/')[1].split('/')[0].split('?')[0];
			});

			if (earl.indexOf('+') !== -1) // (earl !== '')
				$(ele).prepend(
					'<div class="col s12 m6 l4">'
						+ '<li onclick="event.stopPropagation();listr.feeds[\'reddit\'].load(\'/r/' + earl + '\');" class="card collection-item feed-all no-opts z-depth-2"><div><div class="details"><b>Load all subs</b><br><i>/r/' + earl + '</i></div></div>'
						+ '<div style="clear:both;">'
							+ '<a class="secondary-content blue-text text-darken-4 tooltipped" data-position="left" data-tooltip="load feed"><i class="small mdi-hardware-keyboard-arrow-right"></i></a>'
						+ '</div>'
					+ '</div>'
				);
				// $(ele).find('li.collection-header').append(
				// 	'<a class="z-depth-1 blue-grey waves-effect waves-light btn-floating tooltipped" data-position="left" data-tooltip="load /r/' + earl + '"><i class="mdi-action-visibility"></i></a>'
				// );
		});

		// $('div.feeds ul.collection li.collection-header a').tooltip();

		$.each(listr.feeds.list, function(idx, feed) { // broadcast the feeds as we go.
			// if (feed.cat.indexOf('~e|Special') != 0 || feed.cat.indexOf('Playlists') != -1)	// skip "special" feeds (except playlists.)
			if (feed.cat != '~~|Special') listr.broadcast({ 'action': 'push', 'target': 'feeds', 'feed': feed });
		});
	});

	// handle events for feed <li>s w/out options
/* Now added in $.each() above.
	$("div.container.feeds").on('click', 'ul.collection li.collection-item.no-opts', function(e) { 
		var classList = $(this).attr('class').split(/\s+/);
		var feed = '';

		$.each(classList, function(index, label) { if (label.indexOf('feed-') == 0) feed = label.replace('feed-', ''); });
		if (listr.feeds[feed] === undefined) { console.log('ERROR: no feed data for ' + feed); return; }

		listr.feeds[feed].optSelect($(this).index(), this);
	});
*/

	$("div.container.feeds").on('click', 'ul.collection li.collection-header', function(e) {
		$('div.container.feeds li.collection-item').hide('slideup');
		$(this).parent('div').parent('ul').find('li.collection-item').each(function(i, ele) { $(ele).slideDown(); });
	});

	// show/ hide the secondary content for collection items (feeds)
	$("div.container.feeds").on('click', 'ul.collection li.collection-item.collection-reveal', function(e) { 
	// console.log(e, this);
		if ($(e.target).parents("div.secondary-reveal").length) return; // { console.log('clicked in the reveal'); }

		var reveal = $(this).find('div.secondary-reveal');  // .parent("div")
		reveal.find("input").prop('checked', false);    // undo any previous radio checks

		if (reveal.css('display') == 'none') {
			$(this).find('i.mdi-hardware-keyboard-arrow-down').removeClass('mdi-hardware-keyboard-arrow-down').addClass('mdi-hardware-keyboard-arrow-up');
			$('div.secondary-reveal form').show();    // show all-top level forms..
			$('form.secondary-reveal-temp').remove(); // ..and remove the rest.
			$('div.secondary-reveal').hide(); // hide any open sec-reveals..
			reveal.show();            // ..and show clicked
		}
		else {
			$(this).find('i.mdi-hardware-keyboard-arrow-up').removeClass('mdi-hardware-keyboard-arrow-up').addClass('mdi-hardware-keyboard-arrow-down');
			reveal.hide();
		}
	});


	//// reddit-specific handlers /////////////////////////////////////////////////////////////////////
	$('#reddit-flair a.reddit-flair-load').click(function(event) {
		event.preventDefault();

		var url = $('#reddit-flair-url').val();
		var query = $('#reddit-flair-query option:selected').val();

		var sort = $('#reddit-flair-sort option:selected').val();
		if (sort == 'hot') sort += '&t=day';
		else if (sort == 'new') sort += '&t=month';
		else if (sort.indexOf('-') !== -1) sort = sort.substr(0, sort.indexOf('-')) + '&t=' + sort.substr(sort.indexOf('-') + 1);
		
		$('#reddit-flair').closeModal();
		listr.feeds['reddit'].load(url + '/search?sort=' + sort + '&restrict_sr=on&q=flair%3A' + query);
	});

	$('#reddit-search a.reddit-search-go').click(function() {
		var url = $('#reddit-search-url').val();

		var query = $('#reddit-search-query').val();
		if (query == null || query.length < 3) {
			alert('Search must be at least 3 characters.  Try again.');
			return;
		}
		
		var sort = $('#reddit-search-sort option:selected').val();
		if (sort == 'hot') sort += '&t=day';
		else if (sort == 'new') sort += '&t=month';
		else if (sort.indexOf('-') !== -1) sort = sort.substr(0, sort.indexOf('-')) + '&t=' + sort.substr(sort.indexOf('-') + 1);
		
		$('#reddit-search').closeModal();
		listr.feeds['reddit'].load(url + '/search?sort=' + sort + '&restrict_sr=on&q=' + query);
	});

	//// add feeds 	///////////////////////////////////////////////////////////
	$('a.addFeed').click(function(e) {
		// Clear any existing for values.
		$('#addfeed-url,#addfeed-direct-url,#addfeed-cat-new').val('').attr('disabled', false);
		$('div.addfeed-cat-new').hide();

		$('#addfeed-reddit-url option:eq(0)').attr('selected', true);
		$('#addfeed-reddit-url').appendTo('#addFeed div.addfeed-reddit div.addfeed-reddit-url');
		$('#addfeed-reddit-url').parent('div.addfeed-reddit-url').find('div.select-wrapper').remove();
		$('#addfeed-reddit-url').removeClass('initialized').material_select();			// and replace it with a new one

		$('#addfeed-defaults-cat option:eq(0)').attr('selected', true);
		$('#addfeed-defaults-cat').appendTo('#addFeed div.addfeed-defaults div.addfeed-defaults-cat');
		$('#addfeed-defaults-cat').parent('div.addfeed-defaults-cat').find('div.select-wrapper').remove();
		$('#addfeed-defaults-cat').removeClass('initialized').material_select();			// and replace it with a new one

		$('#addfeed-cat option:eq(0)').attr('selected', true);
		$('#addfeed-cat').appendTo('#addFeed div.step3 div.addfeed-cat');
		$('#addfeed-cat').parent('div.addfeed-cat').find('div.select-wrapper').remove();
		$('#addfeed-cat').removeClass('initialized').material_select();			// and replace it with a new one

		$('#addFeed div.step2,#addFeed div.step3').hide();
		$('#addFeed div.step1').show();
	});

	$('div.container.media').on('click', 'a.addFeed', function(e) {
		$('#addFeed div.step3 div.modal-footer .media').show();
		$('#addFeed div.step3 div.modal-footer .feeds').hide();
	});

	$('div.container.feeds a.addFeed').click(function(e) {
		$('#addFeed div.step3 div.modal-footer .media').hide();
		$('#addFeed div.step3 div.modal-footer .feeds').show();
	});

	$('#addFeed div.step1 div.card').click(function(e) {
		var opt = $(this).attr('class').split(' ')[1];

		$('#addFeed div.step1').hide();
		$('#addFeed div.step2.' + opt).show();

		if (opt == 'addfeed-direct') $('#addfeed-direct-url').focus();
	});

	//// shared step2->step3 event 	////////////////
	$('#addFeed div.step2').on('click', 'a.step3', function(e) {
		var source = $(this).attr('class').split(' ')[1];
		var showNext = true;

		//// Translate direct URLs to the corresponding source.
		if (source === 'addfeed-direct') {
			var earl = $('#addfeed-direct-url').val();
			if (earl === '') { alert('You must enter a URL!'); return; }
			else if (earl.indexOf('/') !== 0 && earl.indexOf('http') !== 0) { alert('That doesn\'t look like a valid URL!');  return; }

			if (earl.indexOf('youtube.com/') !== -1) {
				source = 'addfeed-youtube';			//  && earl.indexOf('list=') !== -1
				if (earl.indexOf('list=') !== -1) {
					var plid = earl.split('list=')[1].split('&')[0];

					earl = 
						'https://youtube.com/playlist?list=' 
						+ (plid.substr(0, 2) == 'PL' || plid.substr(0, 2) == 'LL' ? '' : 'PL')
						+ plid
					;
				}
			}
			else if (earl.indexOf('/me/') !== -1) { alert('You must use the full URL (not /me/) when adding a multireddit!' + ENTER + ENTER + 'Ex: https://www.reddit.com/user/evilnight/m/truemusic'); return; }
			else if (
				earl.indexOf('reddit.com/') !== -1
				|| earl.indexOf('/r/') === 0
				|| earl.indexOf('/user/') === 0
				|| earl.indexOf('/by_id/') === 0
			) source = 'addfeed-reddit';
			else { alert('Sorry, that\'s not a supported URL.'); return; }

			$('#addfeed-url').val(earl).parent('div').children('label').addClass('active');
		}

		else if (source === 'addfeed-defaults') {
			var earl = $('#addfeed-defaults-cat option:selected').val();
			if (earl.indexOf('|') === 0) { alert('Gotta pick a category from the pulldown.'); return; }

			$('#addfeed-cat option[value="' + earl + '"]').attr('selected', true);	// Default to importing into the same category.
			$('#addfeed-cat').appendTo('#addFeed div.step3 div.addfeed-cat');
			$('#addfeed-cat').parent('div.addfeed-cat').find('div.select-wrapper').remove();
			$('#addfeed-cat').removeClass('initialized').material_select();			// and replace it with a new one

			$('#addfeed-source').val('defaults');
			$('#addfeed-label').val('All feeds from ' + earl).attr('disabled', true).parent('div').children('label').addClass('active');
			$('#addfeed-url,#addfeed-descrip').val('n/a').attr('disabled', true).parent('div').children('label').addClass('active');
		}

		//// reddit //////////////////////////////
		if (source === 'addfeed-reddit') {	// no else here!  addfeed-direct may use this if() block.
			showNext = false;
			$('#addfeed-source').val('reddit');

			var earl = $('#addfeed-url').val();
			if (earl === '') {
				earl = $('#addfeed-reddit-url option:selected').val();

				if (earl.indexOf('|') === 0) { alert('Gotta pick a sub or a multi from the pulldown.'); return; }
				$('#addfeed-url').val(earl).parent('div').children('label').addClass('active');

				var label = $('#addfeed-reddit-url option:selected').text().replace(' (' + earl + ')', '');
				$('#addfeed-label').val(label).parent('div').children('label').addClass('active');
			}

			// TODO: ping this reddit URL and verify it has links valid to this bucket.
			if (earl.lastIndexOf('/') === earl.length - 1) earl = earl.substr(0, earl.length - 1); // trim last /
			if (earl.indexOf('http') !== 0) earl = 'https://www.reddit.com' + earl;              // translate relative path to absolute
			if (earl.indexOf('.json') === -1) {                                                // add the .json
				var qMark = earl.indexOf('?');
				if (qMark === -1) earl += '.json';
				else earl = earl.substr(0, qMark) + '.json' + earl.substr(qMark);
			}
			// if (earl.indexOf('/comments/') === -1 && earl.indexOf('limit=') === -1) earl += (earl.indexOf('?') === -1 ? '?' : '&') + 'limit=50'; // add "limit" param

			$("#loading").show();
			
			$.ajax({
				dataType: 'json'
				, url: earl.replace('http://', 'https://')
				, success: function(json) {
					if (earl.indexOf('/r/') === -1) {
						$('#addFeed div.step2').hide();
						$('#addFeed div.step3').show();
						$("#loading").hide();
					}
					else {	// get the "about" data
						var abootURL = 'https://www.reddit.com/r/' + earl.replace('.json', '').split('/r/')[1].split('/')[0].split('?')[0] + '/about.json';

						$.ajax({
							dataType: 'json'
							, url: abootURL
							, success: function(json) {
								if (listr.bucket != 'nsfw' && listr.bucket != 'gaynsfw' && json.data.over18) 	// *not* over_18 like posts.
									alert('Sorry but this is an adult sub.  Adult subs can only be added to the NSFW buckets.' + ENTER + ENTER + 'Is this wrong?  Email: exceptions/at/radd.it');
								else {
// console.log(abootURL, json);
									$('#addfeed-label').val(json.data.title.htmlDecode()).parent('div').children('label:not(.active)').addClass('active');

									// if (json.data.public_description !== null && json.data.public_description.length > 0)
									// 	$('#addfeed-descrip').val(json.data.public_description).parent('div').children('label').addClass('active');
									if (json.data.public_description_html !== null && json.data.public_description_html.length > 0)
										$('#addfeed-descrip').val(
											$.trim(json.data.public_description_html.htmlDecode().replace(/<p>/g, ' ').replace(/<\/p>/g, ' ').htmlDecode())
										).parent('div').children('label').addClass('active');
									else if (json.data.description_html !== null && json.data.description_html.length > 0) // Decode twice to strip all <html>.
										$('#addfeed-descrip').val(
											$.trim(json.data.description_html.htmlDecode().replace(/<p>/g, ' ').replace(/<\/p>/g, ' ').htmlDecode())
										).parent('div').children('label').addClass('active');

									$('#addFeed div.step2').hide();
									$('#addFeed div.step3').show();
								}

								$("#loading").hide();
							}
							, error: function(jqXHR, textStatus, errorThrown) {
								$('#addFeed div.step2').hide();
								$('#addFeed div.step3').show();
								$("#loading").hide();
							}
						});
					}
				}

				, error: function(jqXHR, textStatus, errorThrown ) {
					$("#loading").hide();
					alert('"' + earl.replace('.json', '') + '" is not a valid reddit URL.');
				}
			});
		}

		//// youtube /////////////////////////////
		else if (source === 'addfeed-youtube') {
			var earl = $(this).parent('div.opts').find('a.addfeed-youtube-url').attr('href');

			if ($('#addfeed-url').val() == '') {
				$('#addfeed-url').val(earl).parent('div').children('label').addClass('active');
	
				var label = $(this).parents('div.link-dsp').find('h5 span.title').text();
				$('#addfeed-label').val(label).parent('div').children('label').addClass('active');
			}
			else earl = $('#addfeed-url').val();

			if (earl.indexOf('list=') != -1 || earl.indexOf('/channel/') != -1 || earl.indexOf('/user/') != -1) 
				$('#addfeed-source').val('youtube-playlist');
			else { 
				alert('Sorry, that\'s not a supported Youtube URL.'); return; 
			}
		}
		else if ($('#addfeed-url').val() == '') { alert('Error: Unknown source ' + source); return; }

		if (showNext) {
			$('#addFeed div.step2').hide();
			$('#addFeed div.step3').show();
		}
	});

	//// step 2 reddit events	////////////////////
	$('div.addfeed-reddit').find('span.select-dropdown').click(function() {		// When clicked, mark "Select sub.." option as disabled.
		$('#' + $(this).data('activates')).find('li:eq(0)').addClass('disabled');
	});

	//// step 2 youtube events	/////////////////
	$('div.addfeed-youtube a.addfeed-youtube-playlist-go,div.addfeed-youtube a.addfeed-youtube-channel-go').click(function() {
		var query = $('#addfeed-youtube-playlist-query').val();

		var type = 'playlist';
		if ($(this).hasClass('addfeed-youtube-channel-go')) {
			query = $('#addfeed-youtube-channel-query').val();
			type = 'channel';
		}

		// if (query.indexOf('http') === 0 && query.indexOf('list=') !== -1) {		// Direct URL, get metadata about this playlist.
		// 	// $('div.yt-playlist-cats').show();
		// 	alert('Direct URLs not yet supported.  Use search instead.');
		// 	return;
		// }
		// else {																	// Keyword search.
	      function results(links) {
	        var html = '';
	        $.each(links, function(idx, link) {
	          html +=
	            '<div class="link-dsp z-depth-1" data-url="' + link.url.replace(/"/g, '&quot;') + '">'
	              + '<img class="thumb z-depth-1 hide-on-small-only" src="' + link.thumb + '">'
	              + '<h5><span class="title">' + link.title + '</span></h5>'
  							// + '<p>' + link.url + '</p>'
	              + '<p>' + link.descrip + '</p>'
	              + '<div class="opts">'
	                + '<a class="step3 addfeed-youtube waves-effect waves-light btn"><i class="mdi-content-add left"></i>add</a>'
	                + '<a target="_blank" href="' + link.url + '" class="addfeed-youtube-url waves-effect waves-light btn"><i class="mdi-action-open-in-new left"></i>open</a>'
	              + '</div>'
	            + '</div>'
	          ;
	        });

	        $('div.addfeed-youtube div.addfeed-youtube-results').show().children('div.results').html(html);
	      }

	      // We already have a search in sources.js, so use it.
	      listr.sources['youtube.com'].search(query, results, {'types': type});
		// }
	});

	// step 3 events
	$('#addfeed-cat').change(function() {
		var val = $('#addfeed-cat option:selected').val();

		if (val === '|addNewCat') $('#addFeed div.step3 div.addfeed-cat-new').show().find('input').focus();
		else {
			$('#addfeed-cat-new').val('');
			$('#addFeed div.step3 div.addfeed-cat-new').hide();
		}

	});

	$('#addFeed div.step3 a.save').click(function() {
		var errors = '';

		var cat = $('#addfeed-cat option:selected').val();
		if (cat === '|nil')
			errors += ENTER + 'You must select a category.';
		else if (cat === '|addNewCat') {
			cat = $('#addfeed-cat-new').val();

			if (cat.indexOf('|') !== -1 && $('#addfeed-is-default:checked').length == 0) errors += ENTER + 'Categories cannot contain a |.';
			else if (cat.length < 3) errors += ENTER + 'Category must be at least 3 characters.';
			else $('select.cats option:first-child').after('<option value="' + cat.replace(/"/g, '\\"') + '">' + cat + '</option>');		// It's good, add it to the pulldowns.
		}

		var source = $('#addfeed-source').val();
		if (source === '') errors += ENTER + 'Invalid source.  Which is a bug.';

		var label = $('#addfeed-label').val();
		if (label.length < 3) errors += ENTER + 'Label must be at least 3 characters.';

		var earl = $('#addfeed-url').val();
		if (source != 'defaults' && earl.indexOf('http') !== 0 && earl.indexOf('/') !== 0) errors += ENTER + 'Invalid URL!';

		var descrip = $('#addfeed-descrip').val();

		if (errors !== '') {
			alert('Cannot save feed.' + ENTER + errors);
			return;
		}

		var andThen = $(this).attr('class').split(' ')[1];		// did user click "save & reload" or "save & add another"?

		$.ajax({
			dataType: 'json'
			, url: '/create/feed'

			, method: 'POST'
			, data : {
				'bucket' : listr.bucket
				,'cat' : cat
				,'label' : label
				,'url' : earl
				,'descrip' : descrip
				,'source' : source
				,'is_default': $('#addfeed-is-default:checked').length
			}

			, success: function(json) {
				if (json.error !== undefined) alert('Error: ' + json.error);
				else {
					if (andThen === 'another') $('div.container.feeds a.addFeed').click();
					else if (andThen === 'reload') location.reload(true);
					else if (andThen === 'close') {
						$('div.container.media a.addFeed').removeClass('grey').addClass('blue-grey');
						$('#addFeed').closeModal();
					}
				}
			}
		});
	});
});
