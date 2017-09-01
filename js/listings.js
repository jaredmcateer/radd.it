////// listings  ////////////////////////////////////////////////////////////////////////////
// Simple "load more" buttons displayed beneath the links

listr.listings = {};				
listr.listings.list = [];			// array of listings

listr.listings.push = function(listing) {
	var listIdx = listr.listings.list.length;
	listing.idx = listIdx;

	listr.listings.list.push(listing);
	listr.broadcast({ 'action': 'push', 'target': 'listings', 'listing': listing });

	if (listing.label.indexOf('/') !== -1) listing.label = listing.label.substr(listing.label.lastIndexOf('/') + 1);

	$("div.container.links div.listings").append(
		'<a class="btn waves-effect amber lighten-1 grey-text text-darken-3 z-depth-1 listing-' + listIdx
			+ ' feed-' + listing.feed + '" title="' + listing.descrip + '">'
			+ '<i class="mdi-av-queue left"></i> '
			+ listing.label.substr(0, 36) + (listing.label.length > 36 ? '&hellip;' : '')
		+ '</a>'
	);

// console.log('listing append to ', $('#' + $('#naviDown span.select-dropdown').data('activates')));

	$('ul.quickLoad').append(
		'<li class="listing listing-' + listIdx + ' feed-' + listing.feed + '">'
			+ '<span>' 
				+ '<img class="thumb" src="/img/little_r.png">'
				+ '<i>More from ' + listing.label + '</i>'
			+ '</span>'
		+ '</li>'
	);

	$('div.container.grid div.content div.cardCont').append(
        '<div class="col l3 m6 s12">'
	        + '<div class="card listing listing-' + listIdx + ' feed-' + listing.feed + ' grey lighten-4 z-depth-light">'
	          + '<div class="about">'
	            + '<div class="title" style="width:100%;text-align:center;"><br><br>Load more<br>from ' + listing.label + '</div>'
	            + '<div class="details hide-on-small-only">&nbsp;</div>'
	          + '</div>'
	          + '<div class="thumb">'
	            + '<img src="/img/little_r.png"><br>'
	            + '<div class="details hide-on-small-only">&nbsp;</div>'
	          + '</div>'
	        + '</div>'
        + '</div>'
	);
}

$(document).ready(function() {
    $('div.container.links div.listings').on('click', 'a', function (event) {
    	event.preventDefault();

	    var classList = $(this).attr('class').split(/\s+/);
	    var feed = '';
	    var listing = -1;

	    $.each(classList, function(index, label) { 
	    	if (label.indexOf('listing-') == 0) listing = parseInt(label.replace('listing-', ''));
	    	else if (label.indexOf('feed-') == 0) feed = label.replace('feed-', ''); 
	    });

	    if (listr.feeds[feed] === undefined) { console.log('ERROR: no feed data for ' + feed); return; }
	    else if (listr.listings.list[listing] === undefined) { console.log('ERROR: no listing data for ' + listing); return; }

	    // Clear search and related lists as to not fuck up the indexes.
	    // listr.search.list = [];
	    // listr.related.list = [];
	    // $('#relatedLinks').hide();

    	listr.feeds[feed].load(listr.listings.list[listing].url);
    	
    	$('ul.quickLoad li.listing-' + listing).remove();	// remove from quickLoad
    	$('div.cardCont div.card.listing-' + listing).parent('div').remove();	// remove from cards
    	$(this).remove();									// remove HTML element
    	listr.listings.list.splice(listing, 1);				// remove from listings array
    });
});

