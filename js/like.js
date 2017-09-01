listr.like = {};
listr.like.list = {};

listr.like.push = function(idxs, doShuffle) {
	if (doShuffle === undefined) var doShuffle = true;

	var wuz = listr.opts['shuffleOnLoad'];		// always shuffle when loading liked links
	if (doShuffle && idxs.length > 1) {
		if (listr.opts['clearOnLoad']) listr.links.clear();
		listr.opts['shuffleOnLoad'] = true;
	}

	listr.links.batchPush(true, 'links');
	$.each(idxs, function(i, idx) {
		if (listr.like.list[idx] !== undefined) {
			var liked = listr.like.list[idx];
			var link = {
				'title': liked.label
				,'url': liked.url
				,'thumb': liked.thumb
			};

			if (liked.permalink != '') link.related = {'permalink': liked.permalink };

			listr.links.push(link);
		}
	});
	listr.links.batchPush(false, 'links');

	listr.opts['shuffleOnLoad'] = wuz;
};

$(document).ready(function() {
	$("#likedCats").change(function(e) {
		var val = $('#likedCats option:selected').val();
		$('div.container.liked div.content div.links div.results').hide();
		$('#liked-' + val).show();
	});

	$("div.container.liked").on('click', 'ul.collection li.collection-header', function(e) {
		$('div.container.liked li.collection-item').hide('slideup');
		$(this).parent('div').parent('ul').find('li.collection-item').each(function(i, ele) { $(ele).slideDown(); });
	});

	////////// LIKED DISPLAY /////////////////////////////////////
	$('div.container.liked').on('click', 'ul.collection li.collection-item', function(event) {
// console.log('load liked', event);
		if ($(event.currentTarget).hasClass('nix') || $(event.currentTarget).hasClass('append') || $(event.currentTarget).hasClass('open')) return;
// console.log('target: ', $(event.currentTarget));
		var idx = false;
		var classList = $(this).attr('class').split(/\s+/);

		$.each(classList, function(index, label) { if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', '')); });
		if (idx === false) { alert('Error: Like URL not found.'); return; }

		var liked = listr.like.list[idx];
		var link = {
			'title': liked.label
			,'url': liked.url
			,'thumb': liked.thumb
		};
		if (liked.permalink != '') link.related = {'permalink': liked.permalink };

		listr.links.batchPush(true, 'related');
		link = listr.links.push(link);
		listr.links.batchPush(false, 'related');

		if (link) {
			listr.related.list = [];
			listr.links.load(link);
		}
		else { 
			// Check if it's already in the tracklist.  If so, click it.
			var pos = false;
			$.each(listr.links.list, function(i, link) { if (link.url == liked.url) pos = link.idx; });

			if (pos !== false) $('ul.quickLoad li.idx-' + pos).click(); // listr.links.load(pos);
			// else { alert('Error loading liked link. :/'); console.log('liked error', this, link); return; }
		}
	});


	$('div.container.liked').on('click', 'ul.collection li.collection-item a.likeOpen', function(event) {
    	event.stopPropagation();	// prevent this click from triggering link play
    	event.preventDefault();

		var idx = false;
		var classList = $(this).parent('div').parent('li').attr('class').split(/\s+/);
		$.each(classList, function(index, label) { if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', '')); });
		if (idx === false || listr.like.list[idx] === undefined || listr.like.list[idx].url === undefined) { alert('Error: Like URL not found.'); return; }

		window.open(listr.like.list[idx].url, '_blank');
	});

	$('div.container.liked').on('click', 'ul.collection li.collection-item a.likeNix', function(event) {
    	event.stopPropagation();	// prevent this click from triggering link play
    	event.preventDefault();

		var idx = false;
		var classList = $(this).parent('div').parent('li').attr('class').split(/\s+/);
		$.each(classList, function(index, label) { if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', '')); });
		if (idx === false || listr.like.list[idx] === undefined) { alert('Error: Like URL not found.'); return; }
		else if (confirm('Remove "' + listr.like.list[idx].label + '" from liked?')) {
			$.ajax({
				dataType: 'json'
				, url: '/delete/like'

				, method: 'POST'
				, data : listr.like.list[idx] 

				, success: function(json) {
					if (json.error !== undefined) alert('Error: ' + json.error);
					else {
						var parent = $('div.container.liked ul.collection li.collection-item.idx-' + idx).parent('div').parent('ul');
						var tabPos = parent.parent('div').attr('id').replace('liked-', '');

						$('div.container.liked ul.collection li.collection-item.idx-' + idx).parent('div').remove();	// clear card above <li>

						// if (parent.find('li.collection-item').length == 0) { 
						// 	parent.parent('div').remove();
						// 	$('div.container.liked ul.tabs li:eq(' + tabPos + ')').remove();
						// }

						delete listr.like.list[idx];
					}
				}
			});		
		}
	});

	$('div.container.liked').on('click', 'ul.collection li.collection-item a.likeAppend', function() {
    	event.stopPropagation();	// prevent this click from triggering link play
		event.preventDefault();

		var idx = false;
		var classList = $(this).parent('div').parent('li').attr('class').split(/\s+/);
		$.each(classList, function(index, label) { if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', '')); });
		if (idx === false) { alert('Error: Like URL not found.'); return; }

		var liked = listr.like.list[idx];
		var link = {
			'title': liked.label
			,'url': liked.url
			,'thumb': liked.thumb
		};
		if (liked.permalink != '') link.related = { 'permalink': liked.permalink };

		listr.links.stash();
		link = listr.links.push(link);
		listr.links.restore();
		// if (!link) alert('Error: link already loaded!');
	});



	// Add "browse all" button for each category.
	setTimeout(function() {		// Timeout needed so listr.php can populate listr.like.list
		$("div.container.liked div ul.collection").each(function(i, ele) {
			// var cat = $(ele).parents('li.collapsible-item').find('div.collapsible-header h5').text();
			var cat = ''; // $(ele).find('li.collection-header h5').text();
			var likes = $(ele).find('li.collection-item');
			var idxs = [];

			$.each(likes, function(ii, likeEle) {
				var idx = false;
				var classList = $(likeEle).attr('class').split(/\s+/);
				$.each(classList, function(index, label) { if (label.indexOf('idx-') == 0) idx = parseInt(label.replace('idx-', '')); });

				if (idx !== false && $.inArray(idx, idxs) == -1) {
					idxs.push(idx);

					if (cat == '' && listr.like.list[idx] !== undefined) cat = listr.like.list[idx].cat;
					listr.broadcast({
						'action': 'push'
						, 'target': 'like'
						, 'link': listr.like.list[idx]
					});
				}
			});

// console.log(cat, idxs, likes);

			var cnt = idxs.length;
			if (cnt > 0) {
				if (cnt > 1 || self != top) {
					var onclick = 'listr.like.push([' + idxs.join() + ']);';
					if ($(ele).hasClass('suggested')) onclick = 'listr.like.push([' + idxs.join() + '], false);';
					
					$('<div>')	// '<div class="col s12 m6 l3">'
						.addClass('col s12 m4 l3')
						.html (
							'<li class="card collection-item avatar idx-all z-depth-2" onclick="event.stopPropagation();' + onclick + '">'
								+ '<div class="title">Add all</div>'	// : ' + cat + '
								// . '<span class="hide-on-small-only"><br>' . $l_url . '</span>'  // . ') ' . $l_descrip . 
								+ '<img class="right z-depth-1" src="' + listr.thumb + '">'  //  alt=""
							+ '</li>'
						)
						.prependTo(ele)
					;
				}

				// $(ele).parents('li.collapsible-item').find('div.collapsible-header').append(
				// $(ele).find('li.collection-header').append(
				// 	'<a onclick="event.stopPropagation();listr.like.push([' + idxs.join() + ']);" class="liked-cat-' + i + ' z-depth-1 blue-grey lighten-1 waves-effect waves-light btn-floating tooltipped" data-position="left" data-tooltip="load all ' + cat.toLowerCase() + '"><i class="mdi-action-visibility"></i></a>'
				// 	// '<a class="z-depth-1 blue-grey waves-effect waves-light btn-floating tooltipped" data-position="left" data-tooltip="load all ' + cat + '"><i class="mdi-action-visibility"></i></a>'
				// );

				if (cat != '')
					listr.broadcast({	// "fake" feed sent to external apps
						'action': 'push'
						, 'target': 'feeds'
						, 'feed': {
							source: 'radd.it'
							,url: '/' + listr.user + '/liked/' + i //+ '/' + cat
							,label: cat + ' (' + cnt + ' link' + (cnt > 1 ? 's' : '') + ')'
							,idx: -1
							,cat: '~~|Liked'
						}
					});
			}
		});

		$('div.liked ul.collection li.collection-header a').tooltip();
	});





	////////// ADD LIKE FORM ///////////////////////////////////
	$('a.addLike').click(function(e) {
		if (listr.links.current.related.permalink === undefined || listr.links.current.related.permalink.indexOf('/wiki/') != -1)
			$('#addLike a.nopermalink').show();
		else $('#addLike a.permalink').show();

		// Update fields with values from currently loaded link.
		$('#addlike-url').val(listr.links.current.url).parent('div').children('label').addClass('active');
		$('#addlike-title').val(listr.links.current.title).parent('div').children('label').addClass('active');
		$('#addlike-thumb').val(listr.links.current.thumb).parent('div').children('label').addClass('active');
		$('#addlike-thumb-img').attr('src', listr.links.current.thumb);

		if (listr.links.current.descrip.length > 0)
			$('#addlike-descrip').val(listr.links.current.descrip).parent('div').children('label').addClass('active');

		// reset the category <select>
		$('#addlike-cat option:eq(0)').attr('selected', true);
		$('#addlike-cat').appendTo('#addLike div.addlike-cat');
		$('#addlike-cat').parent('div.addlike-cat').find('div.select-wrapper').remove();
		$('#addlike-cat').removeClass('initialized').material_select();

		// and blank/hide the "new category" field.
		$('#addLike div.addlike-cat-new').hide();
		$('#addlike-cat-new').val('');
	});

	$('#addlike-cat').change(function() {
		var val = $('#addlike-cat option:selected').val();

		if (val === '|addNewCat') $('#addLike div.addlike-cat-new').show().find('input').focus();
		else {
			$('#addlike-cat-new').val('');
			$('#addLike div.addlike-cat-new').hide();
		}
	});

	$('#addlike-thumb').change(function() {
		var src = $(this).val();

		$('<img>').attr('src', src)
			.load(function() {
				$('#addlike-thumb-img').attr('src', src);
			})
			.error(function() {
				$('#addlike-thumb-img').attr('src', listr.links.current.thumb);
				$('#addlike-thumb').val(listr.links.current.thumb);

				alert('That\'s not a valid image URL!');
			})
		;
	});

	$('#addLike a.save,#addLike a.upvote').click(function() {
		var link = {
			'bucket' : listr.bucket
			,'cat' : $('#addlike-cat-new').val()
			,'url' : $('#addlike-url').val()
			,'thumb' : $('#addlike-thumb-img').attr('src')
			,'label' : $('#addlike-title').val()
			,'descrip' : $('#addlike-descrip').val()
		};

		if (link.cat == '') link.cat = $('#addlike-cat option:selected').val();			// Get category from pulldown if new is blank.
		else $('select.cats option:first-child').after('<option value="' + link.cat.replace(/"/g, '\\"') + '">' + link.cat + '</option>'); // Otherwise, add new cat to pulldowns.

		try { link.permalink = listr.links.current.related.permalink; } catch(e) { }	// Add related.permalink if it's there.

		if ($(this).hasClass('upvote')) {		// If we're just upvoting, make sure we have a permalink.
			if (link.permalink === undefined) { alert('Cannot upvote, no reddit permalink found.');  return; }
			link = {'permalink': link.permalink };
		}
		else if (link.cat.indexOf('|') === 0) { alert('You must select a category.');  return; }
		else if (link.label.length < 3) { alert('Title must be at least 3 characters.');  return; }

		$('#addLike').closeModal();
		$("#loading").show();

		$.ajax({
			dataType: 'json'
			, url: '/create/like'

			, method: 'POST'
			, data : link 

			, success: function(json) {
				if (json.error !== undefined) alert('Error: ' + json.error);
				else if (json.idx === undefined) alert('Error: no ID returned.');
				else if (json.idx != -1) {	// idx -1 means it was just upvoted, don't add a like element.
					// Create HTML element
					var ele = false;
					$.each(listr.like.list, function(i, like) {
						if (like.cat === link.cat) ele = $('div.container.liked ul.collection li.idx-' + like.idx).parents('ul.collection');
					});

					if (ele === false) {
						var cnt = $('#likedCats option').length;

						// $('div.container.liked div.content ul.tabs').append(
						// 	'<li class="tab col s4 blue-grey z-depth-1"><a class="grey-text text-lighten-4" href="#liked-' 
						// 		+ cnt + '">' 
						// 		+ link.cat
						// 	+ '</a></li>'
						// );

						// Add new cat to pulldown then remove+ replace materialize's replacement.
						$('#' + $("#likedCats").parent('div').children('span.select-dropdown').data('activates')).remove();

						var holder = $("#likedCats").parent('div').parent('div');
						$("#likedCats").detach().appendTo(holder);
						$("#likedCats").parent('div').children('div.select-wrapper').remove();

						$("#likedCats")
							.append('<option value="' + cnt + '">' + link.cat + '</option>')
							.removeClass('initialized')
							.material_select()
						;

						$('div.container.liked div.content div.links').append(
							'<div class="hidden" id="liked-' + cnt + '"><ul class="collection z-depth-1"></ul></div>'
							// "<ul class='collection with-header z-depth-1'>"
							// + "<li class='collection-header blue-grey lighten-1 grey-text text-lighten-4'><h5>" + link.cat + "</h5></li>"
							// "<li class='collapsible-item'><div class='collapsible-header'><h5>" + link.cat + "</h5></div><div class='collapsible-body'><ul class='collection'></ul></div></li>"
						);

						ele = $('div.container.liked ul.collection').filter(":last");
						$('div.container.liked div.content ul.tabs').tabs();
						// ele = $('div.container.liked ul.collapsible li.collapsible-item').filter(":last").find('ul.collection');
					}


/*
      '<li class="hidden collection-item avatar idx-' . $l_idx . '"><div>'
        . '<img class="z-depth-1 hide-on-small-only" src="' . $l_thumb . '">'  //  alt=""
        . '<b>' . $l_label . '</b><span class="hide-on-small-only"> (' . $l_url . ') ' . $l_descrip . '</span>'
        . '<div style="clear:both;">'
          . '<a class="nix secondary-content blue-text text-darken-4 tooltipped" data-position="bottom" data-tooltip="remove from liked"><i class="mdi-content-clear"></i></a>'
          . '<a class="sourceOpen secondary-content blue-text text-darken-4 tooltipped" data-position="bottom" data-tooltip="open on host site"><i class="mdi-action-open-in-new"></i></a>'
          . '<a class="append secondary-content blue-text text-darken-4 tooltipped" data-position="bottom" data-tooltip="add to loaded"><i class="mdi-content-add"></i></a>'
        . '</div>'
      . '</div></li>'
*/

/*
      '<div class="col s12 m4 l3">'
        . '<li class="card collection-item avatar idx-' . $l_idx . ' z-depth-3">'
          . '<div class="title">' . $l_label . '</div>'
          // . '<span class="hide-on-small-only"><br>' . $l_url . '</span>'  // . ') ' . $l_descrip . 
          . '<img class="right z-depth-1" src="' . $l_thumb . '">'  //  alt=""

          . '<div class="btns">'
            . '<a class="nix secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="remove from liked"><i class="mdi-content-clear"></i></a>'
            . '<a class="open secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="open on host site"><i class="mdi-action-open-in-new"></i></a>'
            . '<a class="append secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="add to loaded"><i class="mdi-content-add"></i></a>'
          . '</div>'
        . '</li>'
      . '</div>'
*/

					$('<div>')	// '<div class="col s12 m6 l3">'
						.addClass('col s12 m4 l3')
						.html (
							'<li class="card collection-item avatar idx-' + json.idx + ' z-depth-3">'
								+ '<div class="title">' + link.label + '</div>'
								// . '<span class="hide-on-small-only"><br>' . $l_url . '</span>'  // . ') ' . $l_descrip . 
								+ '<img class="right z-depth-1" src="' + link.thumb + '">'  //  alt=""

								+ '<div class="btns">'
									+ '<a class="nix secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="remove from liked"><i class="mdi-content-clear"></i></a>'
									+ '<a class="open secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="open on host site"><i class="mdi-action-open-in-new"></i></a>'
									+ '<a class="append secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="add to loaded"><i class="mdi-content-add"></i></a>'
								+ '</div>'
							+ '</li>'
						)
						.appendTo(ele)
					;

					if ($('div.container.liked').css('display') == 'none') $('div.container.liked').show();

					// reset materialize's collapsing thingy
					// removed: not needed with collections?
					// $('div.collapsible-header').unbind('click');
					// $('.collapsible').collapsible();

					// Make "like" icon green to show it all works and close the modal.
					$('a.addLike.grey').removeClass('grey').addClass('blue-grey');

					listr.like.list[json.idx] = link;
					listr.broadcast({ 'action': 'push', 'target': 'like', 'link': link });
				}

				$("#loading").hide();
			}

			, error: function(jqXHR, textStatus, errorThrown ) { alert('Error saving to liked.' + ENTER + ENTER + 'Try it again, eh?'); $("#loading").hide(); console.log('liked error: ' + errorThrown, jqXHR); }
		});		
	});

	// Handle "remove" requests from liked list.
	$("div.container.liked ul.suggested").on('click', 'div.btns a.nixSugg', function(event) {
    	event.stopPropagation();	// prevent this click from triggering link play
		event.preventDefault();

		var liked_idx = false;
		var classList = $(this).parent('div').parent('li').attr('class').split(/\s+/);
		$.each(classList, function(index, label) { if (label.indexOf('idx-') == 0) liked_idx = parseInt(label.replace('idx-', '')); });

		if (liked_idx === false || listr.like.list[liked_idx] === undefined) {
			alert('Error: cannot find that suggestion in the list.  Weird, huh?');
			console.log('suggestion nix error', liked_idx, listr.like.list);
			return;
		}

// console.log('remove', listr.like.list[liked_idx]);

		// Remove it from the list even if the server call fails.
		$(this).parent('div').parent('li').parent('div').remove();

		var id_liked = listr.like.list[liked_idx].idx;
		delete listr.like.list[liked_idx];

		$.ajax({
			dataType: 'json'
			, url: '/delete/suggestion'

			, method: 'POST'
			, data : { 'idx' : id_liked }

			, success: function(json) {
				if (json.error !== undefined) alert('Error: ' + json.error);
			}

			, error: function(jqXHR, textStatus, errorThrown) {
				alert('Error removing suggestion. :/' + ENTER + ENTER + textStatus);
				console.log('radd.it suggestion nix (2) error', listr.links.current.meta, textStatus, errorThrown);
			}
		});		


	});
});