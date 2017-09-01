<?php
  if (
    str_replace(array("devembed.", "embed.", "stage.", "dev."), "", $_SERVER['HTTP_HOST']) != "radd.it"
    // || $_SERVER['HTTPS'] != "on"
  ) die('<script>window.location.href = "http://radd.it/";</script>');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
  <meta property="og:image" content="/img/little_r.png" />

  <title>radd.it!</title>

  <!-- CSS  -->
  <link href="/css/materialize.css" type="text/css" rel="stylesheet" media="screen,projection"/>
  <link href="/css/style.css" type="text/css" rel="stylesheet" media="screen,projection"/>

  <link rel="icon" href="/img/favicon.ico" type="image/x-icon" />
  <link rel="shortcut icon" href="/img/favicon.ico" type="image/x-icon" />
  <style>div.container {  max-width: 900px; }</style>
  <script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');ga('create', 'UA-35550542-1', 'auto');ga('send', 'pageview');</script>
</head>
<body class="grey lighten-2">
  <nav class="blue-grey darken-4" role="navigation">
    <div class="container">
      <div class="nav-wrapper">
        <a id="logo-container" href="#" class="brand-logo"><img src="/img/raddit_logo.png"></a>

        <ul class="right hide-on-small-only">
          <li><?=(empty($_COOKIE["user"]) ? '<a href="/login" title="log-in w/ reddit">log-in</a>' : '<a href="/logout" title="log-out">/u/' . $_COOKIE["user"]) . '</a>' ?></li>
        </ul>
      </div>
    </div>
  </nav>

  <div class="section hide-on-med-and-up">
    <div class="container" style="text-align:center">
      <a href="/login" class="waves-effect waves-light btn-large blue darken-2"><i class="mdi-social-person"></i>log-in</a>
    </div>
  </div>

  <!--div id="bernie" class="z-depth-1 hide-on-small-only" style="position:absolute;top:86px;right:16px;border-radius:5px;"><a target="_blank" href="https://www.reddit.com/r/SandersForPresident/"><img src="https://pbs.twimg.com/profile_images/593768630619414528/NtUnu7BX.png" style="width: 120px;"></a></div-->

  <div class="section" id="index-banner">
    <div class="container">
      <br><br>
      <h1 class="header center blue-text text-darken-2">music, vids, pics.</h1>
      <div class="row center">
        <h5 class="header col s12 light">Love it or shove it into<br>your orifice of choice.</h5>
      </div>
      <div class="row center">

      </div>
    </div>
  </div>


  <div class="container">
    <div class="section">
      <div class="row">
        <div class="col s12 m4">
          <a href='/music'>
            <div class="card">
              <div class="card-image">
                <img class="" src="img/music.jpg">
              </div>
              <div class="card-content">
                <span class="card-title blue-text text-darken-4">Music</span>
                <br>Ambient to Zeuhl.
              </div>
            </div>
          </a>
        </div>

        <div class="col s12 m4">
          <a href='/vids'>
            <div class="card">
              <div class="card-image">
                <img class="" src="img/vids.jpg">
              </div>
              <div class="card-content">
                <span class="card-title blue-text text-darken-4">Vids</span>
                <br>Shorts, docs, movies.
              </div>
             </div>
          </a>
        </div>

        <div class="col s12 m4">
          <a href='/pics'>
            <div class="card">
              <div class="card-image">
                <img class="" src="img/pics.jpg">
              </div>
              <div class="card-content">
                <span class="card-title blue-text text-darken-4">Pics</span>
                <br>Not <i>just</i> cats.
              </div>
            </div>
          </a>
        </div>
      </div>
                    
      <div class="row">
        <div class="col s12 m4 offset-m1">
          <div class="card">
            <div class="card-image">
              <img class="activator" src="img/eyecandy.jpg">
            </div>
            <div class="card-content">
              <span class="card-title activator blue-text text-darken-4">Eyecandy <i class="mdi-navigation-more-vert right"></i></span>
              <br>Attractive peoples.
            </div>
            <div class="card-reveal z-depth-2">
              <span class="card-title blue-text text-darken-4"><i>Eyecandy</i><i class="mdi-navigation-close right"></i></span>
              <p>
                <a href="/eyecandy">ladies</a><br>
                <a href="/ladycandy">gentlemen</a><br>
              </p>
            </div>
          </div>
        </div>
        <div class="col s12 m4 offset-m1">
          <div class="card">
            <div class="card-image">
              <img class="activator" src="img/nsfw.jpg">
            </div>
            <div class="card-content">
              <span class="card-title activator blue-text text-darken-4">NSFW <i class="mdi-navigation-more-vert right"></i></span>
              <br>The naughty bits.
            </div>
            <div class="card-reveal z-depth-2">
              <span class="card-title blue-text text-darken-4"><i>NSFW</i><i class="mdi-navigation-close right"></i></span>
              <p>
                <a href="/nsfw">straight NSFW</a><br>
                <a href="/gaynsfw">gay NSFW</a><br>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="container latest">
    <div class="row">
      <div class="col l7 offset-l2 m6 offset-m2 s10 offset-s1">
        <input placeholder="Search.." type="text" class="validate query">
      </div>
      <div class="col l2 m4 s2 offset-s5">
        <a class="search btn-floating btn-large waves-effect waves-light"><i class="mdi-action-search"></i></a>
      </div>
    </div>
    <div class="results">
      
    </div>
  </div>

  <footer class="page-footer blue-grey darken-4">
    <div class="container">
      <div class="row">
        <div class="col l9 s12">
          <h5 class="white-text">Wots all this?</h5>
          <p class="grey-text text-lighten-4">radd.it works with reddit, youtube, soundcloud, vimeo, imgur, and almost 50 other popular video, music, and image sites.  <a target="_blank" href="https://www.reddit.com/r/radd_it/comments/36ntcz/the_big_list_of_supported_sites_v20/">See the full list!</a></p>
          <p class="grey-text text-lighten-4">radd.it is a two-creature operation, one of which is a cat.</p>
          <p class="grey-text text-lighten-4">Email: slipperypeople/at/radd.it</p>
        </div>

<!--
        <div class="col l3 s12">
          <h5 class="white-text">Support</h5>
          <ul>
            <li><a class="white-text" href="https://www.patreon.com/user?u=3584210" target="_blank">Support on Patreon!</a></li>
            <li><a class="white-text" href="#paypal" onClick="$('#paypal').submit();">Donate via PayPal</a></li>
            <li><a class="white-text" href="https://www.changetip.com/tipme/raddit" target="_blank">Donate via ChangeTip</a></li>
            <li><a class="white-text" href="https://www.amazon.com/?_encoding=UTF8&camp=1789&creative=390957&linkCode=ur2&tag=raddit-20" target="_blank">Shop Amazon</a></li>
          </ul>
        </div>
-->
       <div class="col l3 s12">
        <h5 class="white-text">Tools</h5>
        <ul>
          <li><a class="white-text" href="https://reddit.com/r/radditfaq" target="_blank">FAQ</a></li>
          <li><a class="white-text" href="https://reddit.com/r/radd_it" target="_blank">Development Log</a></li>
          <li><a class="white-text" href="http://radd.it/books" target="_blank">What's reddit reading?</a></li>
          <li><a class="white-text" href="https://chrismatic.io/ublock/" target="_blank">Suggested AdBlocker</a></li>
          <!--li><a class="white-text" href="https://zenmate.com/" target="_blank">Zenmate</a></li-->
          <!--li><a class="white-text" href="https://www.reddit.com/r/SandersForPresident/" target="_blank"><b>r/SandersForPresident</b></a></li-->
        </ul>
      </div>
      </div>
    </div>


    <div class="footer-copyright center-align"> <div class="container"> Anonyco © 2015</div> </div>
  </footer>

  <form id="paypal" style="display:none;" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank"><input type="hidden" name="cmd" value="_s-xclick"><input type="hidden" name="hosted_button_id" value="WEZA98RR3EPQ4"></form>

  <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
  <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min.js"></script>
  <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.5/js/jquery.dataTables.min.js"></script>
  <script type="text/javascript" src="/js/materialize.js"></script>
  <script>
    $(document).ready(function() {
      $('a.search').click(function() {
        var query = encodeURIComponent($('input.query').val());
        if (query.length < 2) alert('Search must be at least 2 characters!');
        else getListing('https://www.reddit.com/r/radditplaylists/search.json?restrict_sr=on&limit=50&sort=relevance&t=all&q=' + query);
      });

      $('input.query').keypress(function(event) { if (event.which == 13) $('a.search').click(); });

      getListing('https://www.reddit.com/r/radditplaylists/new.json?limit=50');
    });

    function getListing(listURL) {
      $('div.container.latest .results').html('<p class="grey-text text-lighten-4" style="height:420px">waiting for reply...</p>');

      $.ajax({
        dataType: 'json'
        , url: listURL
        , success: function(json) {
          if (json.data !== undefined && json.kind == "Listing") {
            var posts = json.data.children;

            var html = '<div class="row">';
            var card = '<div class="col s12 m6 l4"><a href="{URL}"><div class="card" style="height:275px"><div class="card-content"><span class="card-title blue-text text-darken-4">{TITLE}</span></div></div></a></div>';

            var query = $('input.query').val();
            if (query.length > 1)
              html += card.replace('{TITLE}', 'Auto \'' + query  + '\' playlist').replace('{URL}', '/search.json?sort=hot&t=all&q=' + encodeURIComponent(query));

            $.each(posts, function(idx, post) {
              var tit = post.data.title;
              var earl = post.data.url.replace('https://www.reddit.com', '').replace('/music', '').replace('/vids', '').split('only=')[0].split('b=')[0];

              html += card.replace('{TITLE}', tit).replace('{URL}', earl);
            });
            
            if (posts.length) {
              if (json.data.after != null)
                html += card
                    .replace('{TITLE}', '...more!')
                    .replace('{URL}', '#" onClick="getListing(\'https://www.reddit.com/r/radditplaylists/new.json?limit=50&after=' + json.data.after + '\');return false;"');
            }

            html += '</div>';
            $('div.container.latest .results').html(html);
          }
        }
        // , failure: function() { $('div.container.latest').hide(); }
      });
    }
  </script>
  </body>
</html>
