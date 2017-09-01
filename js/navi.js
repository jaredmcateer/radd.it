/* Simple prev/ next section navigation tool */
listr.navi = {};
listr.navi.active = -1;
listr.navi.sections = [];

listr.navi.update = function() {
	var sects = $("div.container");

	listr.navi.sections = [];
	$.each(sects, function(idx, sect) {
		if ($(sect).css('display') !== 'none') 
			listr.navi.sections[listr.navi.sections.length] = $(sect).attr('class').split(' ')[1];
	});
};

$(document).ready(function() {
    listr.navi.update();
    $.each(listr.navi.sections, function(idx, sect) {
    	if (listr.navi.active == -1 && $('div.container.' + sect).css('display') !== 'none') listr.navi.active = idx;
    });

    $('#naviUp a.navi').click(function() {
    	listr.navi.active--;
    	if (window.size().width < 960) toast(listr.navi.sections[listr.navi.active], 1000);
		$('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[listr.navi.active]).position().top }, 250);
    });

    $('#naviDown a.navi').click(function() {
    	listr.navi.active++;
    	if (window.size().width < 960) toast(listr.navi.sections[listr.navi.active], 1000);
        $('html,body').animate({ scrollTop: $('div.container.' + listr.navi.sections[listr.navi.active]).position().top }, 250);
    });
});

$(window).scroll(function() {
    listr.navi.update();

    var size = window.size();
    var winScroll = $(window).scrollTop();

    if (winScroll < size.height / 2) listr.navi.active = 0;
    else if (winScroll + (size.height * 1.2) >= $(document).height())
        listr.navi.active = listr.navi.sections.length - 1;
    else 
        $.each(listr.navi.sections, function(idx, sect) {
            if (winScroll > $('div.container.' + sect).position().top - 250) listr.navi.active = idx;
        });     // removed:  - (size.height / 2)

    if (listr.navi.active > 0) $("#naviUp").show(); else $("#naviUp").hide();   //  || winScroll > 64
    if (listr.navi.active < listr.navi.sections.length - 1) $("#naviDown").show(); else $("#naviDown").hide();

    if (size.halfSize) {        // For embed & other low-width (mobile) views, give the title more vertical space and center it.
        $('div.container.media div.opts').css('height', '100px');

        // If we don't usually show the title for this bucket, hide what we are showing.
        // if (!$('div.container.media div.opts span.title').hasClass(listr.bucket))
        //     $('div.container.media div.section.opts span.after span.' + listr.bucket).hide();

        $('div.container.media div.opts').css({
            'margin-top': '-20px'
            ,'height': '100px'
        });

        $('div.container.media div.opts span.title').css('display', 'block');
        // $('nav span.select-dropdown').hide();

        // $('div.container.media div.opts span.title').css({
        //     'white-space': 'normal'
        //     , 'float': 'none'
        //     , 'display': 'block'
        // });

        // $('div.container.media div.opts span.title h4').css({
        //     'font-size': '18px'
        //     , 'text-align': 'center'
        //     , 
        //     'width': size.width - 20
        // });


        $('#naviDown').css('background-color', ''); // .css('padding-bottom', ($(window).height() - 33) + 'px');

        //// move buttons from bottom to the navbar //////////////
        // $('#naviDown span.btns a.grey')
        //     .removeClass('grey')              // Change btn colors from grey -> blue-grey darken-4
        //     .addClass('grey')
            // .addClass('darken-4') 
        // ;

        $('#naviDown span.btns a.btn-large').addClass('wasLarge').removeClass('btn-large');
        $('#naviDown span.btns').detach().appendTo('div.navBtns')
            // .css({
            //     'margin-right': ''
            //     ,'right': '8px'
            //     ,'top': '1px'
            //     ,'position': 'absolute'
            // })
        ;
        $('div.navBtns a i.mdi-navigation-menu').parent('a').hide();
        
        // $('span.btns a.amazon').removeClass('z-depth-1').addClass('z-depth-light').detach().prependTo('nav span.btns');
    }
    else {                      // Standard (prolly web) view, readjust CSS to normal.
        if ($('div.container.media div.content').css('max-width') != 'none')
            $('div.container.media div.content').css('max-width', (size.width - 320) + 'px').children('div,iframe').css('max-width', (size.width - 320) + 'px');

        // Full-view shows title in navigation bar up-top.
        $('div.container.media div.opts').css('height', '');
        // $('div.container.media div.opts').css('max-width', (size.width - 320) + 'px')
        $('div.container.media div.opts span.title').hide();

        // $('nav span.select-dropdown').show();

        if (listr.opts.aboutMax)
            $('div.container.media div.opts').css({
                'margin-top': ''
                ,'height': '250px'
            });
        else
            $('div.container.media div.opts').css({
                'margin-top': ''
                ,'height': '54px'
            });

        $('div.container.media div.opts span.title').css('display', 'none');

        // $('div.container.media div.opts span.title').css({
        //     'white-space': 'nowrap'
        //     , 'float': 'left'
        // });

        // $('div.container.media div.opts span.title h4').css({
        //     'font-size': '2.28rem'
        //     , 'text-align': 'left'
        //     , 'width': ''
        // });

        if (
            listr.navi.sections[listr.navi.active] === 'media' 
            && winScroll < 8 
            && $('div.container.media').css('min-height') != ''
            // && !$('div.container.media').is(':animated')     // no longer animated, just shows itself.
        )
            $('#naviDown').css('background-color', $('div.container.media').css('background-color'));
        else $('#naviDown').css('background-color', '');

        //// move buttons from the navbar to the bottom  //////////////
        // $('nav span.btns a')              // Change btn colors from blue-grey darken-4 -> grey
        // //     .removeClass('grey')
        //     .removeClass('darken-4') 
        // //     .addClass('grey')
        // ;

        $('div.navBtns span.btns').detach().prependTo('#naviDown')
            // .css({
            //     'margin-right': '50px'
            //     , 'right': ''
            //     , 'top': ''
            //     , 'position': 'relative'
            // })
        ;
        $('#naviDown a.wasLarge').addClass('btn-large').removeClass('wasLarge');
        $('div.navBtns a i.mdi-navigation-menu').parent('a').show();

        // $('#naviDown span.btns a.amazon')
        //     .removeClass('z-depth-light').addClass('z-depth-1')
        //     .detach().insertAfter('div.container.media div.opts span.btns a.addLike')
        // ;

        if (
            listr.navi.sections[listr.navi.active] != 'media' 
            // && listr.navi.sections[listr.navi.active] !== 'about'
            && listr.navi.sections[listr.navi.active] != 'grid'
            && listr.navi.sections[listr.navi.active] != 'links'
        ) $('#naviDown span.btns').hide();
        else $('#naviDown span.btns').show();
    }

    // $('nav li.title').css('width', (size.width - 722) + 'px');

    var barWidth = size.width - $('div.media div.opts div.afterCont').width() - 514;
    // if ($('#relatedLinks').css('display') != 'none') {
    //     var linkWidth = 320; // $('#relatedLinks').width() + 12;

    //     barWidth -= linkWidth;
    //     $('div.container.media div.opts div.progressBar').css('margin-left', (linkWidth + 26) + 'px');
    // }
    // else {
        $('div.container.media div.opts div.progressBar').css('margin-left', '18px');
    // }

    if (barWidth > 59) $('div.container.media div.opts div.progressBar').width(barWidth);
    else $('div.container.media div.opts div.progressBar').hide();

    if ($(window).scrollTop() > 0 || listr.navi.sections[0] !== 'media')
        $('#naviDown a.z-depth-light').addClass('z-depth-1').removeClass('z-depth-light');
    else $('#naviDown a.z-depth-1').removeClass('z-depth-1').addClass('z-depth-light');

    /*  //// Flashy don't like it!  Rock the casbah!  Rock the casbah!  ////////
    // disable y-scroll if we're at the top and media is loaded
    if ($(window).scrollTop() > 0 || listr.navi.sections[0] !== 'media') {
        if ($('body').css('overflow-y') === 'hidden') {
            $('body').css('overflow-y', 'auto');
            $('#naviDown').css('right', '5px');
            $('#naviDown a.z-depth-light').addClass('z-depth-1').removeClass('z-depth-light');
        }
    }
    else {
        if ($('body').css('overflow-y') !== 'hidden') {
            $('body').css('overflow-y', 'hidden');
            $('#naviDown').css('right', '22px');   // keep naviDown button aligned the same
            $('#naviDown a').removeClass('z-depth-1').addClass('z-depth-light');   // keep naviDown button aligned the same
        }
    }
    size = window.size();   // update size due to overflow-y change

    // $('div.container.media div.opts span.title').width(                             // fit the title
    //     size.width  - 255 // - $('div.container.media div.opts span.btns').width()
    // );
    */
});
