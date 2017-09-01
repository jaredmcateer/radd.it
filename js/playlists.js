listr.playlists = {};
listr.playlists.list = [];	// was a {} but doesn't need to be?

$(document).ready(function() {
///////// playlist save (from links) ////////////////////////////////////////////////
	$('a.plAdd').click(function(e) {
		$('#plAdd-pl-new,#plAdd-descrip').val('');

		if (listr.playlists.list.length == 0) {
			$('#plAdd-pl option:eq(1)').attr('selected', true);

			$('div.plAdd-pl').hide();
			$('#plAdd a.append').hide();
			
			$('div.plAdd-pl-new').show();
			setTimeout(function() { $('#plAdd-pl-new').focus().parent('div').children('label').addClass('active'); });
		}
		else {
			$('#plAdd-pl option:eq(0)').attr('selected', true);
			
			$('div.plAdd-pl').show();
			$('#plAdd a.append').show();

			$('div.plAdd-pl-new').hide();
		}

		// reset the category <select>
		$('#plAdd-pl').appendTo('#plAdd div.plAdd-pl');
		$('#plAdd-pl').parent('div.plAdd-pl').find('div.select-wrapper').remove();
		$('#plAdd-pl').removeClass('initialized').material_select();
	});


	$('#plAdd-pl').change(function() {
		var val = $('#plAdd-pl option:selected').val();

		if (val === '|addNewPL') { 
			$('#plAdd div.plAdd-pl-new').show(); 
			$('#plAdd a.append').hide();
			$('#plAdd-pl-new').focus(); 
		}
		else {
			$('#plAdd-pl-new').val('');
			$('#plAdd div.plAdd-pl-new').hide();
			$('#plAdd a.append').show();
		}
	});

	$('#plAdd-thumb').change(function() {
		var src = $(this).val();

		$('<img>').attr('src', src)
			.load(function() {
				$('#plAdd-thumb-img').attr('src', src);
			})
			.error(function() {
				$('#plAdd-thumb-img').attr('src', listr.links.current.thumb);
				$('#plAdd-thumb').val(listr.links.current.thumb);

				alert('That\'s not a valid image URL!');
			})
		;
	});

	$('#plAdd a.save,#plAdd a.append').click(function() {
		var method = '/create';
		var action = 'create';
		var pl = $('#plAdd-pl-new').val();
		var sel = $('#plAdd-pl option:selected').val();

		if (pl === '' && listr.playlists.list[sel] !== undefined) { 
			pl = listr.playlists.list[sel].label;
			method = '/update'; 

			if ($(this).hasClass('save')) {
				if (self == top && !confirm('This will replace all links in "' + pl + '"!' + ENTER + ENTER + "This cannot be undone.  Hit OK to continue.")) return;
				// alert('OVERWRITING ' + pl);
				action = 'save';
			}
			else action = 'append';
		}
		else if (pl.length < 3) { alert('Playlist name must be at least 3 characters.'); return; }


		var newPL = {
			'action': action
			,'url' : false
			,'bucket': listr.bucket
			,'label': pl
			,'descrip': $('#plAdd-descrip').val()
			,'links' : listr.links.list
		};

		if (method == '/update') newPL.url = listr.playlists.list[sel].url;

		$('#loading').show();

		$.ajax({
			dataType: 'json'
			, url: method + '/playlist'

			, method: 'POST'
			, data : newPL 

			, success: function(json) {
				$('#loading').hide();

				if (json.error !== undefined) alert('Error: ' + json.error);
				else {
					// Add new playlist to listr.playlists.list[] and pulldowns.
					if (json.action == 'create') {
						$('select.playlists option:first-child').after('<option value="' + listr.playlists.list.length + '">' + pl + '</option>');

						delete newPL.links;
						newPL.url = json.url;
						listr.playlists.list.push(newPL);
					}

					// Mark button green & close.
					$('div.container.links div.opts a.plAdd.grey').removeClass('grey').addClass('blue-grey');
					$('#plAdd').closeModal();
				}
			}

			, error: function(jqXHR, textStatus, errorThrown ) { alert('Error saving playlist.' + ENTER + ENTER + 'Try it again, eh?'); $('#loading').hide(); }
		});
	});

///////// playlist append /////////////////////////////////////////////////////
	$('a.plAppend').click(function(e) {
		// Update fields with values from currently loaded link.
		$('#plAppend-url').val(listr.links.current.url).parent('div').children('label').addClass('active');
		$('#plAppend-title').val(listr.links.current.title).parent('div').children('label').addClass('active');
		$('#plAppend-thumb').val(listr.links.current.thumb).parent('div').children('label').addClass('active');
		$('#plAppend-thumb-img').attr('src', listr.links.current.thumb);
		$('#plAppend-pl-new,#plAppend-descrip').val('');

		try { $('#plAppend-perma').val(listr.links.current.related.permalink); }
		catch (e) { $('#plAppend-perma').val(''); }

		// if (Object.keys(listr.playlists.list).length == 0) {
		if (listr.playlists.list.length == 0) {
			$('#plAppend-pl option:eq(1)').attr('selected', true);

			$('div.plAppend-pl,div.modal-footer a.append').hide();
			$('div.modal-footer a.create').css('display', 'inline-block');
			$('div.plAppend-pl-new').show();
		}
		else {
			$('#plAppend-pl option:eq(0)').attr('selected', true);
			
			$('div.plAppend-pl-new,div.modal-footer a.create').hide();
			$('div.modal-footer a.append').css('display', 'inline-block');
			$('div.plAppend-pl').show();
		}

		// reset the category <select>
		$('#plAppend-pl').appendTo('#plAppend div.plAppend-pl');
		$('#plAppend-pl').parent('div.plAppend-pl').find('div.select-wrapper').remove();
		$('#plAppend-pl').removeClass('initialized').material_select();
	});


	$('#plAppend-pl').change(function() {
		var val = $('#plAppend-pl option:selected').val();

		if (val === '|addNewPL') { 
			$('div.modal-footer a.append').hide();
			$('div.modal-footer a.create').css('display', 'inline-block');

			$('#plAppend div.plAppend-pl-new').show(); 
			$('#plAppend-pl-new').focus(); 
		}
		else {
			$('div.modal-footer a.append').css('display', 'inline-block');
			$('div.modal-footer a.create').hide();

			$('#plAppend-pl-new').val('');
			$('#plAppend div.plAppend-pl-new').hide();
		}
	});

	$('#plAppend-thumb').change(function() {
		var src = $(this).val();

		$('<img>').attr('src', src)
			.load(function() {
				$('#plAppend-thumb-img').attr('src', src);
			})
			.error(function() {
				$('#plAppend-thumb-img').attr('src', listr.links.current.thumb);
				$('#plAppend-thumb').val(listr.links.current.thumb);

				alert('That\'s not a valid image URL!');
			})
		;
	});

	$('#plAppend a.save').click(function() {
		var method = '/create';
		var pl = $('#plAppend-pl-new').val();
		var sel = $('#plAppend-pl option:selected').val();
		if (pl == '' && listr.playlists.list[sel] !== undefined) { 
			pl = listr.playlists.list[sel].label;
			method = '/update';
		}
		else if (pl.length < 3) { alert('Playlist name must be at least 3 characters.'); return; }


		var newPL = {
			'bucket': listr.bucket
			,'url' : false
			,'label': pl
			,'descrip': $('#plAppend-descrip').val()
			,'links' : [
			 {
				'url': $('#plAppend-url').val()
				,'thumb': $('#plAppend-thumb-img').attr('src')
				,'title': $('#plAppend-title').val()
			 }
			]
		};

		if (method == '/update') {
			newPL.action = 'append';
			newPL.url = listr.playlists.list[sel].url;
		}

		if ($('#plAppend-perma').val() != '') newPL.links[0].related = { 'permalink': $('#plAppend-perma').val() };

		$('#loading').show();

		$.ajax({
			dataType: 'json'
			, url: method + '/playlist'

			, method: 'POST'
			, data : newPL 

			, success: function(json) {
				$('#loading').hide();

				if (json.error !== undefined) { alert('Error: ' + json.error.htmlDecode()); console.log('plAppend error: ' + json.error.htmlDecode()); }
				else {
					// Add new playlist to listr.playlists.list[] and pulldowns.
					if (json.action == 'create') {
						$('select.playlists option:first-child').after('<option value="' + listr.playlists.list.length + '">' + newPL.label + '</option>');

						delete newPL.links;
						newPL.url = json.url;
						listr.playlists.list.push(newPL);
					}

					// Mark button green & close.
					$('div.media a.plAppend.grey,#naviDown span.btns a.plAppend.grey').removeClass('grey').addClass('blue-grey');
					$('#plAppend').closeModal();
				}
			}

			, error: function(jqXHR, textStatus, errorThrown ) {
				alert('Error saving playlist.' + ENTER + ENTER + 'Try it again, eh?'); $('#loading').hide();
			}
		});
	});

});