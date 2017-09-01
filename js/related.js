// When a link is loaded, any key-value pairs in its 'related' property are handled here.
listr.related = {};
listr.related.list = [];		// links found through related links
// listr.related.rejected = [];	// found links that aren't supported
listr.related.last = -1;		// used with the 'next found link' button

listr.related.push = function(idx) { 
	listr.links.stash();
	listr.links.push(listr.related.list[idx]); 
	listr.links.restore();
}

listr.related.update = function() {
	if (listr.opts['pushRelated']) {
		if (listr.related.list.length > 0) {
			var links = listr.related.list.clone();	// must copy out of related[] so dupe checking doesn't skip all links.
			listr.related.list = [];

			listr.links.batchPush(true);
			$.each(links, function(i, link) { listr.links.push(link); });
			listr.links.batchPush(false);
		}
	}
	else {
		// var html = '';
		// $.each(listr.related.list, function(i, link) {
		// 	html += 
		// 		'<li class="collection-item idx-' + link.idx + '">'
		// 			+ '<a class="blue-grey-text" onclick="listr.links.load(listr.related.list[' + i + ']);">' 
		// 				+ link.title 
		// 			+ '</a>'
		// 		+ '</li>'
		// 		+ '<a style="float:right;margin-top:-40px" onClick="listr.related.push(' + i + ');" class="btn-floating waves-effect waves-light blue darken-4 tooltipped" data-position="top" data-tooltip="add to loaded"><i class="mdi-av-queue"></i></a>'
		// 	;
		// });

		// if (listr.related.list.length > 0) {
		// 	$('ul.relatedLinks').html(html);
		// 	$('#relCnt').text(listr.related.list.length);
		// 	$('#relatedLinks').show();
		// 	$(window).resize();
		// }

		var listCnt = listr.related.list.length;
		if (listCnt) $('a.relatedNext').show();
		// listCnt += listr.links.rejected.length;

		var joiner = '';
		if ($('span.abCommentsCnt:visible').length > 0) joiner = 'and ';
		$('span.abLinksCnt').html(joiner + '<a class="relatedLinks" href="#related" title="search or see found links">' + listCnt + ' link' + (listCnt == 1 ? '' : 's') + '</a> ');
	}
}

$('div.media div.opts div.mediaAbout').on('click', 'a.relatedNext', function(event) {
	listr.related.last++;
	if (listr.related.last >= listr.related.list.length) listr.related.last = -1;

	if (listr.related.last == -1) $('#links tr.selected').children('td').eq(0).click();		// back to start, load the first
	else listr.links.load(listr.related.list[listr.related.last]);
});

$('div.media div.opts div.mediaAbout').on('click', 'a.relatedLinks', function(event) {
	event.preventDefault();

	if (listr.related.list.length || listr.links.rejected.length) {
		$('#linksAdd div.results').show();
		$('#linksAdd div.results div.col.header ul').html('');
		$('#linksAdd div.results div.col.content').html('');
	}

	$.each(listr.related.list, function(i, link) {						// loop through new links and add them to the HTML
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
					$('#linksAdd ul.tabs li:first a').click();	// fixes materalize always showing last added tab
				});
			}

			var ele = cont + ' div.' + link.kind;
			if ($(ele).length == 0) $(cont).append('<div class="' + link.kind + '"><h4>' + link.kind + 's</h4></div>');

			var comment = '';
			if (link.meta.comment !== undefined) {
				if (link.meta.comment.length < 400) comment = link.meta.comment;
				else {
					var pos = link.meta.comment.indexOf(link.title);
					if (pos < 200) comment = link.meta.comment.substr(0, 400) + '&hellip;';
					else comment = "&hellip;" + link.meta.comment.substr(pos - 200, 400) + '&hellip;';
				}
			}
			else if (link.descrip !== undefined) {
				if (link.descrip.length < 400) comment = link.descrip;
				else comment = link.descrip.substr(0, 400) + '&hellip;';
			}
			comment = comment.replace(link.title.replace('.com/ ', '.com/'), '<b>' + link.title.replace('.com/ ', '.com/') + '</b>').replace('https://', '').replace('http://', '').replace('www.', '');

			$(ele).append(
				'<div class="link-dsp z-depth-1 idx-' + link.idx + '">'
					+ '<img class="thumb z-depth-1 hide-on-small-only" src="' + link.thumb + '">'
					+ '<h6><span class="title">' + link.title.replace('.com/ ', '.com/') + '</span> (' + '<span class="source">' + link.source + '</span>)</h6>'
					+ '<p>' 
						+ (link.author.length ? '&lt;' + link.author + '&gt; ' : '')
						// + (link.meta.comment !== undefined ? link.meta.comment.substr(0, 450) + (link.meta.comment.length > 450 ? '...' : '') : link.descrip) 
						+ comment
						+ '<br><b>' + link.url.substr(0, 66) + (link.url.length > 66 ? '...' : '') + '</b>'
					+ '</p>'
					+ '<div class="opts">'
						+ '<a onClick="listr.links.load(listr.related.list[' + i + ']);" class="waves-effect waves-light btn"><i class="mdi-action-visibility left"></i>load</a>'
						+ '<a onClick="listr.related.push(' + i + ');" class="waves-effect waves-light btn"><i class="mdi-av-queue left"></i>queue</a>'
						+ '<a target="_blank" href="' + link.url + '" class="waves-effect waves-light btn"><i class="mdi-action-open-in-new left"></i>open</a>'
					+ '</div>'
				+ '</div>'
			);
		}
	});

	$.each(listr.links.rejected, function(i, link) {						// loop through new links and add them to the HTML
		if (link !== false) {	// links rejected in push() above are updated to false.
			// if (link.source === undefined || link.source.length == 0) link.source = link.domain;
			var head = '#linksAdd div.results div.col.header ul.tabs li.rejected';
			var cont = '#results-rejected';

			if ($(head).length === 0) {
				$('#linksAdd div.results div.col.header ul').append(
					'<li class="tab rejected">'
						+ '<a href="' + cont + '">Unsupported</a>'	// ' + (curLen ? '' : 'class="active" ') + '
					+ '</li>'
				);

				$('#linksAdd div.results div.col.content').append(
					'<div id="' + cont.substr(1) + '" class="col s12"> </div>'
				);

				setTimeout(function() { 		// update tabs after all HTML is appended
					$('#linksAdd ul.tabs').tabs();
					$('#linksAdd ul.tabs li:first a').click();	// fixes materalize always showing last added tab
				});
			}

			if (link.kind === undefined || link.kind.length == 0) link.kind = 'link';
			var ele = cont + ' div.' + link.kind;
			if ($(ele).length == 0) $(cont).append('<div class="' + link.kind + '"><h4>' + link.kind + 's</h4></div>');

			var comment = '';
			if (link.meta.comment !== undefined) {
				if (link.meta.comment.length < 400) comment = link.meta.comment;
				else {
					var pos = link.meta.comment.indexOf(link.title);
					if (pos < 200) comment = link.meta.comment.substr(0, 400) + '&hellip;';
					else comment = "&hellip;" + link.meta.comment.substr(pos - 200, 400) + '&hellip;';
				}
			}
			else if (link.descrip !== undefined) {
				if (link.descrip.length < 400) comment = link.descrip;
				else comment = link.descrip.substr(0, 400) + '&hellip;';
			}
			comment = comment.replace(link.title.replace('.com/ ', '.com/'), '<b>' + link.title.replace('.com/ ', '.com/') + '</b>').replace('https://', '').replace('http://', '').replace('www.', '');

			$(ele).append(
				'<div class="link-dsp z-depth-1 idx-' + link.idx + '">'
					+ '<img class="thumb z-depth-1 hide-on-small-only" src="' + link.thumb + '">'
					+ '<h6><span class="title">' + link.title.replace('.com/ ', '.com/') + '</span> (' + '<span class="source">' + link.domain + '</span>)</h6>'
					+ '<p>' 
						+ (link.author.length ? '&lt;' + link.author + '&gt; ' : '')
						// + (link.meta.comment !== undefined ? link.meta.comment.substr(0, 450) + (link.meta.comment.length > 450 ? '...' : '') : link.descrip) 
						+ comment
						+ '<br><b>' + link.url.substr(0, 66) + (link.url.length > 66 ? '...' : '') + '</b>'
					+ '</p>'
					+ '<div class="opts">'
						// + '<a onClick="listr.links.load(listr.related.list[' + i + ']);" class="waves-effect waves-light btn"><i class="mdi-action-visibility left"></i>load</a>'
						// + '<a onClick="listr.related.push(' + i + ');" class="waves-effect waves-light btn"><i class="mdi-av-queue left"></i>queue</a>'
						+ '<a target="_blank" href="' + link.url + '" class="waves-effect waves-light btn"><i class="mdi-action-open-in-new left"></i>open</a>'
					+ '</div>'
				+ '</div>'
			);
		}
	});

	$('#linksAdd').openModal();
});

listr.related['chat'] = function(url) {
/*
	var chatWidth = 360;
	var size = window.size();
	// size.width -= (chatWidth + 16);
	size.width -= (chatWidth + 2);
	if ($('ul.quickLoad').hasClass('keepOpen')) size.width -= $('ul.quickLoad').width();
	// old idea: if ($('body').css('overflow-y') == 'hidden') size.width -= 15;

	size.height -= 51;
	var chatHeight = size.height - 7;

	$('div.container.media div.content div.media-dsp').css('max-width', size.width + 'px');
	$('div.container.media div.content').append(
		'<div id="chat" style="float:right;margin-top:-' + size.height + 'px">'
			+ '<iframe src="' + url + '" width="' + chatWidth + 'px" height="' + chatHeight + 'px" border="0"></iframe>'
		+ '</div>'
	);
*/
}

listr.related['links'] = function(links) {
	listr.links.batchPush(true, 'related');
	$.each(links, function(i, link) { listr.links.push(link); });
	listr.links.batchPush(false, 'related');

	listr.related.update();
}

listr.related['permalink'] = function(url) {
// console.log('related permalink', url);

	// URL cleanup
    if (url.lastIndexOf('/') === url.length - 1) url = url.substr(0, url.length - 1); // trim last /
    if (url.indexOf('/') === 0) url = 'https://www.reddit.com' + url;	              // translate relative path to absolute


    var commentLoad = false;
    if (url.split('/').length === 9) commentLoad = true;

    // Update related buttons.
    // Nope, was double-opening things.
    // $('a.feedOpen').unbind('click').click(function() { window.open(url.replace('.json', ''), '_blank'); }).css('display', 'inline-block');

    /*
	$("div.container.about div.section span.feedType").html('post');
	$("div.container.about div.section span.feedOpen").html(
		// '<a class="waves-effect waves-light btn"><i class="mdi-action-exit-to-app left"></i>Open post<span class="hide-on-small-only"> on reddit</span></a>'
		'<a target="_blank" href="' + url + '" class="btn-floating btn-large waves-effect waves-light blue darken-1 tooltipped" data-position="bottom" data-tooltip="open reddit post"><i class="mdi-action-exit-to-app"></i></a>'
	).show(); 
	$('div.container.about div.section span.feedOpen a.tooltipped').tooltip();
	*/

	// Update URL to get .JSON from reddit.
    if (url.indexOf('.json') === -1) {
      var qMark = url.indexOf('?');
      if (qMark === -1) url += '.json';
      else url = url.substr(0, qMark) + '.json' + url.substr(qMark);
    }

	$.ajax({
		dataType: 'json'
		, url: url
		, cache: true
		, success: function(json) { 
// console.log('perma success', json);
			var post = {};
			var comments = false;
			try {	// try..catch in case reddit didn't return the post+ comments structure.
				post = json[0].data.children[0].data;
				comments = json[1].data.children;
			}
			catch(e) { comments = false; }
			if (comments === false) { console.log('ERROR: unknown reply for permalink', json); return; }

			listr.links.batchPush(true, 'related');		// Turn on batchPush so we can use links.push() for any found links.

			// Recurse through the comments looking for:
			// 		-- the top-most comment from OP
			//		-- any links
			var commentCnt = 0;
			setTimeout(function() {
/*
				var id_top = false;
				var gSep = new RegExp('</p>' + ENTER + ENTER + '<p>', 'g');

				if (!commentLoad && post['selftext_html'] !== null && post['selftext_html'].length > 0) {
					id_top = post['name'];

					var body = post['selftext_html'].htmlDecode().replace(gSep, '%%BR%%').htmlDecode().replace(/%%BR%%/g, '<br><br>');
					$("div.container.about div.section .authorComment").html(
						'<p><b>' + post['author'] + ' comments:</b> ' + body.substr(0, 4096) + (body.length > 4096 ? '...' : '') + '</p>'
					).show();
				}
*/

				(function appendComments(comments, depth) {
					$.each(comments, function(i, value) {
						if (value['kind'] == "t1") {
							commentCnt++;
/*
							// Did we find a comment from OP?  Show it if it's the first found.
							if (
								!id_top
								&& (
									(commentLoad && depth === 0) 
									|| value['data']['author'] == post.author
								)
							) { 
								id_top = value['data']['name'];
								var body = value['data']['body_html'].htmlDecode().replace(gSep, '%%BR%%').htmlDecode().replace(/%%BR%%/g, '<br><br>');
								// id_top = value['data']['name'];
								$("div.container.about div.section .authorComment").html(
									'<p><b>' + value['data']['author'] + ' comments:</b> ' + body.substr(0, 4096) + (body.length > 4096 ? '...' : '') + '</p>'
								).show();
							}
*/

							// parse any links from comment
							if (value['data']['body_html'] !== undefined && value['data']['body_html'] != null) {
								var html = value['data']['body_html'];
								var found = $('<div />').html(html.htmlDecode()).find('a');   // ,h1,h2,h3,iframe,object,embed,oembed
								found.each(function(idx) {
									var meta = { 'comment' :  value['data']['body_html'].htmlDecode().htmlDecode() };
									// if (value['data']['name'] == id_top) meta = {};

									if (
										$(this).attr('href') !== undefined
										&& $(this).attr('href').indexOf('http') == 0
										&& value['data']['score'] >= 0
									)
										// if (
											listr.links.push({
												'url' : $(this).attr('href')
												, 'title' : $(this).html()
												, 'feed' : 'reddit'
												, 'id_feed' : value['data']['name']
												, 'utc_feed' : value['data']['created_utc']
												, 'author' : value['data']['author']
												, 'score' : value['data']['score']
												, 'related' : { 'permalink' : post.permalink + value['data']['id'] }
												, 'meta' : meta
											})
										// === false) listr.related.rejected++;
								});
							}

							// Recurse through any replies.
							if (value['data']['replies'] != "") appendComments(value['data']['replies']['data']['children'], depth + 1);
						}
					});
				})(comments, 0);

				listr.links.batchPush(false, 'related'); // ..so we don't add what's in it to links.list when we turn batchPush off.

/* old and busted
				var html = '<div style="text-align:center">';
				$.each(listr.related.list, function(i, link) {
					html += 
						'<div class="link-dsp z-depth-1 idx-' + link.idx + '">'
							+ '<img class="thumb z-depth-1 hide-on-small-only" src="' + link.thumb + '">'
							+ '<h5><span class="title">' + link.title + '</span> (' + '<span class="source">' + link.source + '</span>)</h5>'
					;

					html += 
							// '<p class="grey-text text-darken-2">' 
							// 	+ '<span class="descrip">' + link.descrip + '</span>'
							// + '</p>'
							// + 
							'<div class="opts">'
								+ '<a onClick="listr.links.load($.extend({\'updateAbout\':false},listr.related.list[' + i + ']));" class="btn-floating btn-large waves-effect waves-light blue darken-2 tooltipped" data-position="top" data-tooltip="load"><i class="mdi-action-visibility"></i></a>'
								+ '<a onClick="listr.related.push(' + i + ');" class="btn-floating btn-large waves-effect waves-light blue darken-2 tooltipped" data-position="top" data-tooltip="add to loaded"><i class="mdi-av-queue"></i></a>'
								+ '<a onClick="listr.links.stop();" target="_blank" href="' + link.url + '" class="btn-floating btn-large waves-effect waves-light blue darken-2 tooltipped" data-position="top" data-tooltip="open on ' + link.source + '"><i class="mdi-action-open-in-new"></i></a>'
								+ '<a target="_blank" href="' + url.replace('.json', '') + '/' + link.id_feed.replace('t1_', '')  + '?context=1" class="btn-floating btn-large waves-effect waves-light blue darken-2 tooltipped" data-position="top" data-tooltip="open reddit comment"><i class="mdi-action-exit-to-app"></i></a>'
							+ '</div>'
					;
					
					if (link.meta.comment !== undefined && link.meta.comment.length > 0)
						// TODO: make comment display sentence(s) around the link, not just the first 512 chars
						html += '<p><b>' + link.author + ' comments:</b> ' + link.meta.comment.substr(0, 512) + (link.meta.comment.length > 512 ? '...' : '') + '</p>';
					else
						html += '<p><b>from ' + link.author + '</b></p>';

					html += '</div>';
				});
				html += '</div>';
*/

				$('span.abCommentsCnt').html(', <a target="_blank" href="' + url.replace('.json', '') + '" title="u/' + post.author + ENTER + post.score + ' pt' + (post.score == 1 ? '' : 's') + '">' + commentCnt + ' comment' + (commentCnt == 1 ? '' : 's') + '</a>');
				listr.related.update();
			});
		}
	});
}
