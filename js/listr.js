
// Internal options.  No elements, only set by the code.
listr.opts.ajaxDelay = 1500;			// Incremental delay (in ms) between AJAX calls to a source
listr.opts.timesUsed = 1;
listr.opts.showNotify = true;	// Plugin-only option
listr.opts.sleep = false;		// sleep timer

listr.opts.preventClose = false;
$(window).bind('beforeunload', function() { if (listr.opts.preventClose) return 'Some sites try to force you to leave.'; });

$(document).ready(function() {
	$('.tooltipped').tooltip({delay: 500});								// Enable materialize tooltips
	$('.modal-trigger').leanModal();									// Enable materialize modals
	$('.collapsible').collapsible();									// Enable materialize accordian (for likes)
	$('select').material_select();										// Enable materialize selects
	
	// setTimeout(function() {
		$('div.container ul.tabs').tabs();							// Enable materialize tabs
		$('div.container.liked ul.tabs li a.active').removeClass('active');		// Clear defaulted "active" tab for liked.
	// });

	if (self != top) window.addEventListener('message', listr.msg, false);

	$('nav div.select-wrapper')
		.addClass('hide-on-embed')					// Add class to hide it when embedded.
		.addClass('quickLoad')						// And a custom one so the CSS can find it.
		// .addClass('hide-on-small-only')			// Add class to hide it on small widths..
	;

	$('nav span.select-dropdown').css({ 'border-bottom': 'none' });	// ..remove border from replacement..
	$('#' + $('nav span.select-dropdown').data('activates'))			// ..and make our "quickload" full height
		.addClass('quickLoad')					// And a custom one so the JS/ CSS can find it.
		.addClass('z-depth-2')					// SUPER DEPTH.. that's barely noticable.

		.css({	
			'max-height': 'none'
			, 'overflow-x': 'hidden'
			// , 'overflow-y': 'auto'	// gets overwritten, so moved to the animate() in the links.js click hander
		})

		.sortable({
			'containment': 'parent'
			, 'opacity': 0.666
			, cancel: '.listing'
			, start: function(event, ui) { 
				listr.opts['startIdx'] = $(ui.item[0]).index(); 
				listr.opts['actIdx'] = $('ul.quickLoad li.active').index(); 
			}
			, update: function(event, ui) { 
				var li = $(ui.item[0]);
				var liTop = li.position().top;
				var ulTop = $('ul.quickLoad').scrollTop();

				var nPos = li.index();
				var oPos = listr.opts['startIdx'];
				var actPos = listr.opts['actIdx'];

// console.log('from ' + oPos + ' to ' + nPos + ', act: ' + actPos);

				// $('ul.quickLoad li').each(function(i, ele) {
				// 	var top = $(ele).position().top + ulTop + 20;	// +20 for a little leeway
				// 	if (oPos === false && top >= ui.originalPosition.top) oPos = i;

				// 	// if (ui.position.top > ui.originalPosition.top) {	// moved down
				// 	// 	if (top <= ui.originalPosition.top) oPos = i - 1;
				// 	// 	else if (top <= ui.position.top) nPos = i - 1;
				// 	// }
				// 	// else {		// moved up
				// 	// 	if (top <= ui.position.top) nPos = i - 1;
				// 	// 	else if (top <= ui.originalPosition.top) oPos = i - 1;
				// 	// }
				// });

				if (ui.position.top > ui.originalPosition.top && nPos == oPos) nPos++;

// console.log('move ' + listr.links.list[oPos].title + ' from ' + oPos + ' to ' + nPos);

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

			    // if (li.hasClass('active')) {
			    if (oPos == actPos) {
			        listr.links.table.$('tr.selected').removeClass('selected');
			        listr.links.table.$('tr:eq(' + nPos + ')').addClass('selected');
			    }
			    else if (oPos > actPos && nPos <= actPos)
			    	listr.links.table.$('tr.selected').removeClass('selected').next().addClass('selected');

				listr.links.table.draw();
			}
		})

		.find('li.disabled').remove()	// remove materalize's "Loaded" <li>
	;

	$('div.grid div.cardCont')	// Also make cards sortable.
		.sortable({
			'containment': 'parent'
			, 'opacity': 0.666
			, cancel: '.listing'

			, start: function(event, ui) { listr.opts['startIdx'] = $(ui.item[0]).index(); }

			, update: function(event, ui) { 
				var li = $(ui.item[0]);
				var liTop = li.position().top;
				var ulTop = $('div.cardCont').scrollTop();

				var nPos = li.index();
				var oPos = listr.opts['startIdx'];
				// if (ui.position.top > ui.originalPosition.top && nPos == oPos) nPos++;
				if (nPos == oPos) return;

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

				listr.links.table.draw();
				listr.links.quickloadRefresh();
			}
		})


//////////////

	// $('div.container.media div.section.opts span.after span.' + listr.bucket).show();	// Show title OR progress bar.
	$('#addFeed div.' + listr.bucket).show();	// Show options for this bucket
	$('div.container.options div.section div.' + listr.bucket).show();	// Show options for this bucket
	$('div.container.about div.links .bucket').text(listr.bucket);		// Update "links founds" header w/ bucket

/* no longer in the UI
	// Show bucket-specific buttons.
	if (listr.bucket == 'music') $('div.media div.opts a.visualizer').css('display', 'inline-block');
	else if (
		listr.bucket == 'pics'
		|| listr.bucket == 'eyecandy'
		|| listr.bucket == 'ladycandy'
		|| listr.bucket == 'nsfw'
		|| listr.bucket == 'gaynsfw'
	) $('div.media div.opts a.autoskip').css('display', 'inline-block');
*/

	if (listr.opts['embedded']) $('.hide-on-embed').hide();				// remove marked elements from the embedded player
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) $('.hide-on-mobile').hide();
	

	if ($.cookie() !== undefined) {										// update options from user cookies
		$.cookie.defaults.path = '/';
		$.cookie.defaults.domain = 'radd.it';

		var cookies = $.cookie();
		$.each(cookies, function(key, val) { 
			if (key == 'timesUsed') listr.opts.timesUsed = parseInt(val) + 1;
			else if (listr.opts[key.replace(listr.bucket + '|', '')] !== undefined) {
				if (val === "true") val = true; else if (val === "false") val = false;	// make booleans real, y0!
				listr.opts[key.replace(listr.bucket + '|', '')] = val; 	
			}
		});

		setTimeout(function() { $.cookie('timesUsed', listr.opts.timesUsed); }, 10000);
		if (listr.opts.timesUsed > 9) $('footer').append('<div class="footer-copyright">You\'ve used radd.it ' + listr.opts.timesUsed + ' times.</div>');
	}

	// Make adjustments based on set options.
	if (!listr.opts['showLinkOpts']) $('div.container.links div.section.opts').hide();

	if (!listr.opts['showOptions']) $('div.container.options').stop().hide();

	if (!listr.opts['showMedia']) {
        $('div.container.media div.opts h6 a').addClass('fromOpts').detach().prependTo('#naviDown span.btns');
		$('div.container.media').stop().hide();
		listr.opts['allowNoStream'] = false;
	}

	if (listr.opts['shuffleOnLoad']) $('th.shuffle i,a.togShuffle').addClass('blue-grey').removeClass('grey');


	// Nope!  Let this happen when links are loaded.
	// if (listr.opts['showGrid']) { $('div.container.links').hide(); $('div.container.grid').show(); }
	// else { $('div.container.grid').hide(); $('div.container.links').show(); }

	if (listr.opts['showVisuals']) {
		setTimeout(function() {
			if (listr.sources[listr.links.current.key] !== undefined && listr.sources[listr.links.current.key]._pauses) {
				$('div.container.media div.content').append('<div class="media-dsp"  id="visualizer"><iframe src="/viz"></iframe></div>');
				$(window).resize();
			}
		}, 3000);
	}

	if (!listr.opts['aboutMax']) { $('a.aboutMin').hide(); $('a.aboutMax').show(); }

	// if (!listr.opts['showQuick']) $('select.jump.virgin').removeClass('virgin');

	// Update HTML values for <option>s from listr.opts
	$.each(listr.opts, function(opt, val) {
		var ele = $('div.container.options div.section').find('.' + opt).find('input');
		if (ele.length > 0) if (val === true || val === false) $(ele).prop('checked', val);	// on/ off checkboxes
		// TODO: add handlers for non-checkbox <input>s?
		// else console.log('no element for option ' + opt);
	});

	// Add click hander for HTML <option>s.
	$('div.container.options div.section').on('click', 'input', function(e) {
		var opt = $(this).parent('label').parent('div').attr('class').split(/\s+/)[0];	// Get option from parent <div>s class names.
		var val = $(this).val();							// get value for this input
		if (val === 'on') val = $(this).prop('checked');	// if it's a checkbox, use the 'checked' property instead

		if (listr.opts[opt] !== undefined) listr.opts[opt] = val;
		else { console.log('ERROR: no listr.opts for ' + opt); return; }

		var noCookie = ['sleep'];
		if ($.inArray(opt, noCookie) === -1 && $.cookie() !== undefined)	// store new value in cookie if we can
			$.cookie(listr.bucket + '|' + opt, val);

		//// option-specific changes to layout, etc. ////////////////////////////
		if (opt == 'showMedia') {
			// Show/ hide the media depending on val.
			if (val) {
		        $('#naviDown a.fromOpts').removeClass('fromOpts').detach().prependTo('div.container.media div.opts h6');
				$('div.container.media').show();
			}
			else {
				if ($('ul.quickLoad').css('opacity') == 1) setTimeout(function() { $('ul.quickLoad').removeClass('keepOpen'); $('body').click(); });

		        $('div.container.media div.opts h6 a').addClass('fromOpts').detach().prependTo('#naviDown span.btns');
				$('div.container.media').stop().hide();
				if (listr.opts['allowNoStream']) $('div.container.options div.allowNoStream input').click();
			}

			$(window).scrollTop($('div.container.options').position().top);
		}
		else if (opt == 'showVisuals') { 
			if (val) {	// Show it.
				$('div.container.media div.content').append('<div class="media-dsp"  id="visualizer"><iframe src="/viz"></iframe></div>');
				$(window).resize();
			}
			else $('#visualizer').remove();
		}
		// else if (opt == 'fullMedia') { 
		// 	$(window).resize(); 
		// 	$(window).scrollTop($('div.container.options').position().top);
		// }
		// else if (opt == 'showAbout') {
		// 	// Show/ hide the media depending on val.
		// 	if (val) $('div.container.about').show();
		// 	else $('div.container.about').stop().hide();

		// 	$(window).scrollTop($('div.container.options').position().top);
		// }
		else if (opt == 'showGrid') {
			if (val) { $('div.container.links').hide(); $('div.container.grid').show(); }
			else {
				$('div.container.grid').hide();
				$('div.container.links').show(); 
				setTimeout(function() { listr.links.table.draw(false); });
			}

			setTimeout(function() { $(window).scroll(); });
		}
		else if (opt == 'allowNoStream') {
			// if user wants only streaming sites and the current one isn't, skip to the next link.
			if (!val && !listr.sources[listr.links.current.key]._streams) listr.links.next();
		}
		else if (opt == 'allowAds') {
			// if user wants only adless sites and the current one isn't, skip to the next link.
			if (!val && listr.sources[listr.links.current.key]._ads) listr.links.next();
		}
		// else if (opt == 'showSongkick') {
		// 	if (val && $.inArray('music', listr.sources[listr.links.current.key].buckets) !== -1)
		// 		$('a.songkick')
		// 			.unbind('click')

		// 			// serg: update click handler
		// 			.bind('click', function() { window.open('http://offliberty.com/#' + listr.links.current.url, '_blank'); })	// HTTPS not available.
		// 			.show()
		// 		;
		// 	else $('a.songkick').hide();
		// }
		else if (opt == 'showOffliberty') {
			if (val && $.inArray('music', listr.sources[listr.links.current.key].buckets) !== -1)
				$('div.media a.offliberty')
					.unbind('click')
					.bind('click', function() { window.open('http://offliberty.com/#' + listr.links.current.url, '_blank'); })	// HTTPS not available.
					.show()
				;
			else $('div.media a.offliberty').hide();
		}
		else if (opt == 'allowZoom') {
			if (!val) $('div.zoomContainer').remove();
			else if ($('div.zoomContainer').length == 0 && $('#media-pic img').length)
				$('#media-pic img')
					.attr('data-zoom-image', listr.links.current.url)
					.elevateZoom({ zoomType: "inner", cursor: "crosshair", scrollZoom: true, zoomWindowFadeIn: 250, zoomWindowFadeOut: 250 })
				;
		}
		else if (opt == 'allowNSFW') {
			// if user doesn't want NSFW links and this is, skip to next.  try..catch since property may not be set.
			try { if (!val && listr.links.meta.nsfw) listr.links.next(); }
			catch (e) { }
		}
		else if (opt == 'sleep') {
			if (val) {	// turn on sleep timer
				listr.opts['sleep'] = 60;
				$('div.container.options div.' + listr.bucket + ' div.sleep span.time').text('60 minutes.');
				listr.broadcast({ 'action': 'start', 'target': 'sleep', 'val': listr.opts['sleep'] });


				listr.opts['sleepTimer'] = setInterval(function() {
					listr.opts['sleep']--;
					listr.broadcast({ 'action': 'interval', 'target': 'sleep', 'val': listr.opts['sleep'] });

					if (listr.opts['sleep'] > 0)
						$('div.container.options div.' + listr.bucket + ' div.sleep span.time').text(listr.opts['sleep'] + ' minutes.');
					else {
						if ($('span.btns a.pause').css('display') != 'none')		// Timer's up, is the pause button shown?  Click it.
							$('span.btns a.pause').click();
						else if ($('span.btns a.resume').css('display') == 'none')		// Otherwise, call the stop() for current source.
							 listr.sources[listr.links.current.key].stop();

						$('div.container.options div.' + listr.bucket + ' div.sleep input').click();	// Flip sleep switch to 'no'.
					}
				}, 60000);
			}
			else {	// Sleep timer off (or expired.)
				listr.broadcast({ 'action': 'stop', 'target': 'sleep', 'val': false });
				clearInterval(listr.opts['sleepTimer']);
				$('div.container.options div.' + listr.bucket + ' div.sleep span.time').text('an hour?');
			}
		}
	});


	//// Sharing is caring! 	////////////////////////////////////////////////////////////////////////////
	// Flip the 'share all' button twice to apply the "?allmedia" if needed
	$('a.share').click(function() { $('#share-all').click(); setTimeout(function() { $('#share-all').click(); }); });
	
	// Autoselect certain <input>s on mouseover and click.
	$('#share-url,#share-embed').click(function() { $(this).select(); }).mouseover(function() { $(this).select(); });

	$('#share-all').click(function() {
		var embedHtml = $('#share-embed').val();

		if ($('#share-all').is(":checked")) {
			if (embedHtml.indexOf('allmedia') == -1) embedHtml = embedHtml.split("'></iframe>")[0] + (embedHtml.indexOf('?') == -1 ? '?' : '&') + "allmedia'></iframe>";
		}
		else embedHtml = embedHtml.replace('?allmedia', '').replace('&allmedia', '');

		$('#share-embed').val(embedHtml);
	});

// No worky.
// 	$('div.container.media div.content').on('load', 'div img', function() {
// console.log('A NEW PIC');
// 	});

// 	$('body').on('load', 'img', function() {
// console.log('IMG LOAD', this);
// 	});

// 	$('body').on('error', 'img', function() {
// console.log('IMG ERROR', this);
// 	});

	//// hotkeys 	/////////////////////////////////////////////////////////
	$(document).keypress(function(event) {
		if (document.activeElement.type == 'text' || document.activeElement.type == 'input' || document.activeElement.type == 'search') {
			if (event.which == 13) {
				event.preventDefault();

				if ($(document.activeElement).hasClass('quick-search')) $('a.quick-search-full').click();
				else if ($(document.activeElement).parent().find('a.btn-floating').length > 0)
					$(document.activeElement).parent().find('a.btn-floating:eq(0)').click();
				else if ($(document.activeElement).parent().parent().find('a.btn-floating').length > 0)
					$(document.activeElement).parent().parent().find('a.btn-floating:eq(0)').click();
			}

			return;	// if user is typing in a text box, ignore the keypress
		}

		switch (event.which)
		{
			case 44: 		// , for previous song
			case 60:
				listr.links.prev();
			break;

			case 46: 		// . for next song
			case 62:
				listr.links.next();
			break;

			case 47: 		// / to pause/ resume
			case 63:
				if ($('span.btns a.pause').css('display') != 'none')
					$('span.btns a.pause').click();
				else if ($('span.btns a.resume').css('display') != 'none')
					$('span.btns a.resume').click();
				else listr.sources[listr.links.current.key].stop();

			break;

			case 58: 		// ; to toggle autoskip
			case 59:
				// $('div.media div.opts a.autoskip[display!="none"]').click();
				$('span.btns a.next').click().click();
			break;

			case 79: 		// o to open media on host
			case 111: 		//
				window.open(listr.links.current.url, '_blank');
				listr.links.stop();
			break;

			case 82: 		// r to open reddit post
			case 114: 		//
				// try..catch because permalink property may not exist
				try { window.open('https://www.reddit.com' + listr.links.current.related.permalink, '_blank'); } catch(e) { }
			break;

			case 90: 		// z to toggle sleep
			case 122:
				var sleepOpt = $('div.container.options div.' + listr.bucket + ' div.sleep input[display!="none"]');
				if (sleepOpt.length > 0) {
					if (listr.opts['sleep']) toast('sleep off', 1000); else toast('sleep in 60min', 1000);
					sleepOpt.click();
				}
			break;

			case 86: 		// v to toggle visuals
			case 118:
				var vizOpt = $('div.container.options div.' + listr.bucket + ' div.showVisuals input[display!="none"]');
				if (vizOpt.length > 0) {
					if (listr.opts['showVisuals']) toast('visuals off', 1000); else toast('visuals on', 1000);
					vizOpt.click();
				}
			break;

			case 65: 		// a to toggle about panel min/ max
			case 97:
				$('a.aboutMin:visible,a.aboutMax:visible').click();
			break;

			case 77: 		// m to toggle quickload menu
			case 109:
				$('div.quickLoad span.select-dropdown').click();
			break;

			case 78: 		// n to view next found link
			case 110:
				$('div.media div.opts a.relatedNext:visible').click();
			break;

			case 76: 		// l to add like
			case 108:
				$('div.media div.opts a.addLike:visible').click();
			break;

			case 80: 		// p to add to playlist
			case 112:
				$('div.media div.opts a.plAppend:visible').click();
			break;

			case 83: 		// s to toggle search results (found links)
			case 115:
				if ($('#linksAdd:visible').length) $('#linksAdd a.modal-close').click();
				else $('div.media div.opts a.relatedLinks').click();
			break;

			case 84: 		// t to toggle loaded/ table
			case 116:
				var vizOpt = $('div.container.options div.' + listr.bucket + ' div.showGrid input[display!="none"]');
				if (vizOpt.length > 0) vizOpt.click();
			break;

			// switch pages
			case 49: 		//	1st page
				$('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[0]).position().top }, 250);
			break;
			case 50: 		//	2nd page
				if (listr.navi.sections.length > 0)
					$('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[1]).position().top }, 250);
			break;
			case 51: 		//	3rd page
				if (listr.navi.sections.length > 1)
					$('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[2]).position().top }, 250);
			break;
			case 52: 		//	4th page
				if (listr.navi.sections.length > 2)
					$('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[3]).position().top }, 250);
			break;
			case 53: 		//	5th page
				if (listr.navi.sections.length > 3)
					$('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[4]).position().top }, 250);
			break;
			case 54: 		//	6th page
				if (listr.navi.sections.length > 4)
					$('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[5]).position().top }, 250);
			break;
			case 55: 		//	6th page
				if (listr.navi.sections.length > 5)
					$('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[6]).position().top }, 250);
			break;
			case 56: 		//	7th page
				if (listr.navi.sections.length > 6)
					$('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[7]).position().top }, 250);
			break;
			case 57: 		//	8th page
				if (listr.navi.sections.length > 7)
					$('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[8]).position().top }, 250);
			break;
			case 58: 		//	9th page.. which will probably never exist.
				if (listr.navi.sections.length > 8)
					$('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[9]).position().top }, 250);
			break;
		}

	});

	$('a.easter').click(function(event) {
		listr.links.load(listr.links.push({"title": "don't sadd.it! radd.it!", "url":"https://soundcloud.com/professorpan/raddit"}));
		event.preventDefault();
	});

	$(window).resize();
}); // end of document ready

$(window)
	.focus(function() { setTimeout(function() { $('a.hotkeys').hide(); }); })
	.blur(function() { setTimeout(function() { $('a.hotkeys').show(); }); })
;

$(window).resize(function() { 
    // Height/ width adjustments for media/ continers. /////////////////////////////////////////////
    var size = window.size();
	$("div.container:not(.no-min-height)").css('min-height', size.height);
	$("div.container.half-height").css('min-height', (size.halfSize ? size.height : (size.height / 2) +  (size.height / 10)));

    // make all media fit the container
	$('.media-dsp').css('height', size.height - 64).css('width', size.width); 

	$('div.container div.boxCont').height((size.halfSize ? size.height * 2 : size.height) - 158);
	$('div.container div.boxCont div.row.links').height((size.halfSize ? size.height * 2 : size.height) - 258);
});


////////////// messaging to/ from the listr //////////////////////////////////////////////////////
listr.broadcast = function(obj) {	// Used to send event notices to external apps.  Function overwritten where needed.
	if (self != top) parent.postMessage(obj, '*');
	// else console.log(obj);
}; 

listr.msg = function(obj) {			// message handler
	if (obj.data === undefined) return;
	var data = obj.data;

	if (data.action === undefined) return;
	// if (data.event === undefined) { console.log('ERROR: msg w/out event', data); return; }
	// else if (data.target === undefined) { console.log('ERROR: msg w/out target', data); return; }
// console.log('listr event: ' + data.action);

	// if (data.action == 'data') listr.broadcast(listr);
	// else

	if (data.action == 'load') {
		if (data.source === undefined) { console.log('ERROR: load action w/out source', data); return; }
		else if (data.url === undefined) { console.log('ERROR: load action w/out url', data); return; }

		listr.feeds[data.source].load(data.url);
	}

	else if (data.action == 'push') {
		if (data.target === undefined) { console.log('ERROR: push action w/out target', data); return; }
		else if (data.target == 'links') {
			if (data.link === undefined) { console.log('ERROR: link push action w/out link', data); return; }
			else listr.links.push(data.link);
		}
	}

	else if (data.action == 'opt') {
		if (data.opt === undefined) { console.log('ERROR: opt action w/out opt', data); return; }
		else if (data.val === undefined) { console.log('ERROR: opt action w/out val', data); return; }

		listr.opts[data.opt] = data.val;

		var noCookie = ['sleep'];
		if ($.inArray(data.opt, noCookie) === -1 && $.cookie() !== undefined) $.cookie(listr.bucket + '|' + data.opt, data.val);

		listr.broadcast({ 'action': 'opt', 'opt': data.opt, 'val': data.val });
	}

	else if (data.action == 'listing') {
		if (data.idx === undefined) { console.log('ERROR: listing action w/out idx', data); return; }
		$('ul.quickLoad li.listing.listing-' + data.idx).click();
	}
	
	else if (data.action == 'play') {
		if (data.idx === undefined) { console.log('ERROR: play action w/out idx', data); return; }

		$('ul.quickLoad li.idx-' + data.idx).click();
		// listr.links.load(data.idx);
	}
	
	else if (data.action == 'clear') {
		if (data.target === undefined) { console.log('ERROR: clear action w/out target', data); return; }
		else if (data.target == 'links') {
			listr.links.stop();
			listr.links.clear();
		}
	}

	else if (data.action == 'pause') $('span.btns a.pause').click();
	else if (data.action == 'resume') $('span.btns a.resume').click();

	else if (data.action == 'prev') $('span.btns a.prev').click();
	else if (data.action == 'next') $('span.btns a.next').click();

	else if (data.action == 'upvote') $('#addLike a.upvote').click();

	else if (data.action == 'create') {
		if (data.target === undefined) { console.log('ERROR: create action w/out target', data); return; }
		else if (data.target == 'likes') {
			$('#addlike-cat-new').val(data.link.cat);
			$('#addlike-url').val(data.link.url);
			$('#addlike-thumb-img').attr('src', data.link.thumb)
			$('#addlike-title').val(data.link.label);
			$('#addlike-descrip').val(data.link.descrip);

			setTimeout(function() { $('#addLike a.save:eq(0)').click(); });
		}
		else if (data.target == 'playlists') {
			if (data.links === undefined) {		// no link defined use listr.links.list, use plAdd
				// if data.idx is defined, overwrite existing playlist
				if (data.idx === undefined) {
					$('#plAdd-pl-new').val(data.label);
					$('#plAdd-descrip').val(data.descrip);
					$('#plAdd-pl option:last-child').attr('selected', true);
				}
				else {
					$('#plAdd-pl-new').val('');
					$('#plAdd-descrip').val('');
					$('#plAdd-pl option:eq(' + data.idx + ')').attr('selected', true);
				}

				setTimeout(function() { $('#plAdd a.save:eq(0)').click(); });
			}
			else {					// create new playlist from supplied link, use plAppend
				$('#plAppend-pl-new').val(data.label);
				$('#plAppend-descrip').val(data.descrip);
				$('#plAppend-pl option:last-child').attr('selected', true);

				$('#plAppend-url').val(data.links[0].url);
				$('#plAppend-thumb-img').attr('src', data.links[0].thumb)
				$('#plAppend-title').val(data.links[0].title)

				setTimeout(function() { $('#plAppend a.save:eq(0)').click(); });
			}
		}
	}
	else if (data.action == 'update') {
		if (data.target === undefined) { console.log('ERROR: create action w/out target', data); return; }
		else if (data.target == 'playlists') {
			if (data.links === undefined) {		// no link defined use listr.links.list, use plAdd
				if (data.idx !== undefined) {
					$('#plAdd-pl-new').val('');
					$('#plAdd-descrip').val('');
					$('#plAdd-pl option:eq(' + data.idx + ')').attr('selected', true);

					setTimeout(function() { $('#plAdd a.append:eq(0)').click(); });
				}
				else { console.log('ERROR: update playlist action w/out idx', data); return; }
			}
			else {					// add link to existing playlist, plAppend
				$('#plAppend-pl-new').val('');
				$('#plAppend-pl option:eq(' + data.idx + ')').attr('selected', true);
				$('#plAppend-descrip').val(data.descrip);
				$('#plAppend-url').val(data.links[0].url);
				$('#plAppend-thumb-img').attr('src', data.links[0].thumb)
				$('#plAppend-title').val(data.links[0].title)

				setTimeout(function() { $('#plAppend a.save:eq(0)').click(); });
			}
		}
	}

	else if (data.action == 'seek') {
		if (data.pct === undefined) console.log('ERROR: seek action w/out pct', data);
		else listr.sources[listr.links.current.key].seek(data.pct);
	}

	else if (data.action == 'search') {
		if (data.query === undefined) { console.log('ERROR: search action w/out query', data); return; }
		listr.links.search(data.query);	// results returned by batchPush()
	}

	else if (data.action == 'quicksearch') {
		if (data.query === undefined) { console.log('ERROR: quicksearch action w/out query', data); return; }

		$('#quick-search-query').val(data.query);
		setTimeout(function() { $('div.qsCont a.quick-search-go').click(); });
	}

	//// NOT FOUND ////////////
	else if (data.action != '') alert('Unknown action: ' + data.action);
}

/*
////////////// simple logging //////////////////////////////////////////////////////
listr.log = function(msg) { 
   	$("div.container.log div p").append(' <b>[' + ($.now() - listr.logTime)  + '</b>ms<b>]</b><br>' + msg);
	listr.logTime = $.now();
};
listr.logTime = $.now();
*/
