<?php
  $mysqli = new mysqli($vars['dbserver'], $vars['dbread']['user'], $vars['dbread']['pass'], $vars['dbname']);
  if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
  $mysqli->set_charset("utf8");

  $embedded = false;
  if (substr_count($_SERVER['HTTP_HOST'], "embed.") != 0 || isset($_GET["embed"])) $embedded = true;

  $username = "";
  $loggedIn = false;
  if (!empty($_COOKIE["user"]) && !isset($_GET["nouser"])) $username = $mysqli->real_escape_string($_COOKIE["user"]);
  if (!empty($username)) {
    $loggedIn = true;
    if ($bucket != "media") include "login/quickrefresh.php";
  }

  // user (or default) feeds
  $qry = "SELECT cat, source, hasOpts, url, label, descrip, is_sticky, is_default, is_user, id_feed from feeds where bucket = '" . $bucket . "'"
    . " and (is_sticky = 1 or user = '" . $username . "')"
    . " order by is_sticky, cat, label;"
  ;

  // user's subreddits and subs they've upvoted in
  if ($loggedIn)
    $qry .= 
      "SELECT id_user_sub, source, is_multi, name, url, label FROM user_subs" // removed: , descrip
     . " WHERE active = 0 and user = '" . $username . "'" // active here means it's been made a feed by user
     . " UNION "
     . "SELECT 0 as id_user_sub, 'reddit', 0 as is_multi, subreddit as name, subreddit as url, subreddit as label from user_upvotes"  // , '' as descrip
     . " WHERE user = '" . $username . "' GROUP BY subreddit"

     . " ORDER BY id_user_sub = 0, is_multi = 0, name;"
    ;
  else $qry .= "SELECT id_user_sub, source, is_multi, name, url, label FROM user_subs where id_user_sub = 0;";

  // likes
  if ($loggedIn)
    $qry .= "SELECT cat, label, url, thumb, permalink, id_like, descrip FROM likes WHERE user = '" . $username . "' and bucket = '" . $bucket . "' ORDER BY cat, label;";
  else $qry .= "SELECT cat, label, url, thumb, permalink, id_like, descrip FROM likes where id_like = 0;";

  $qry .= "SELECT kind, source, label, descrip, url, permalink, thumb, id_suggestion from user_suggestions where user = '" . $username . "' and bucket = '" . $bucket . "' ORDER BY hotScore DESC"; // kind, 

  $result = $mysqli->multi_query($qry); 
  if ($result === false) die("db error: " . $mysqli->error);

  $feeds = $mysqli->store_result();
  $mysqli->next_result(); $userSubs = $mysqli->store_result();
  $mysqli->next_result(); $userLikes = $mysqli->store_result();
  $mysqli->next_result(); $suggestions = $mysqli->store_result();

  $userCats = "";
  $stickyCats = "";
  $defaultCats = "";

  // used when adding feeds, code below
  $urlsShown = array();

  $userPlaylists = array();  // All feeds in the "~a|Playlists" category
  $playlistOpts = "";   // <option>s for playlist <select>s
  $playlistCnt = 0;

  $foundLinks = false;
  $foundFeeds = false;
  if (!$embedded) {
    while ($sug = $suggestions->fetch_row()) {
      $s_kind = $sug[0];

      if ($s_kind == "link") $foundLinks = true;
      else if ($s_kind == "feed") $foundFeeds = true;
    }
  }

echo "<!--" . chr(10)
  . "bucket: " . $bucket . chr(10)
  . "user: " . $username . chr(10)
  . "url: " . $listrURL . chr(10)
 // . "qry: " . $qry . chr(10) . chr(10)
  . "feeds: " . $feeds->num_rows . chr(10)
  // . "subCats: " . $subCats->num_rows . chr(10)
  // . "userCats: " . $userCats->num_rows . chr(10)
  . "userSubs: " . $userSubs->num_rows . chr(10)
  . "userLikes: " . $userLikes->num_rows . chr(10)
  . "suggestions: " . $suggestions->num_rows . chr(10)
  . chr(10) . "-->" . chr(10);
?><!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
  <meta property="og:image" content="/img/little_r.png" />
  <meta name="description" content="music, videos, pics." />
  <meta name="keywords" content="music,movies,video,reddit,tv,radio,pics,images,playlister,gallery,<?=$listrURL?>" />
  <meta charset="utf-8" />
  <title>radd.it!</title>

  <link href="/css/materialize.css" type="text/css" rel="stylesheet" media="screen,projection"/>
  <!--link href="https://cdn.datatables.net/1.10.5/css/jquery.dataTables.css" type="text/css" rel="stylesheet" media="screen,projection"-->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.5/css/jquery.dataTables.min.css" type="text/css" rel="stylesheet" media="screen,projection">
  <link href="/css/listr.css" type="text/css" rel="stylesheet" media="screen,projection"/>
  <style>
    .rollImg { opacity:0.33;max-width:41%;max-height:41%;position:fixed; }
    @keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }
    @keyframes spin2 { 100% { -webkit-transform: rotate(-360deg); transform:rotate(-360deg); } }
  </style>

  <!--script type="text/javascript" src="https://code.jquery.com/jquery-2.1.1.min.js"></script-->
  <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
  <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min.js"></script>
  <!--script type="text/javascript" src="https://cdn.datatables.net/1.10.5/js/jquery.dataTables.js"></script-->
  <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.5/js/jquery.dataTables.min.js"></script>
  <script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');ga('create', 'UA-35550542-1', 'auto');ga('send', 'pageview');</script>
</head>

<body class="grey lighten-1">
  <nav class="blue-grey darken-4" role="navigation">
    <div class="nav-wrapper">
      <a id="logo-container" class="brand-logo" <?php if ($embedded) echo 'target="_blank" href="' . explode("?", $listrURL)[0] . '/' . $bucket . '"'; else echo 'href="/"'; ?>>
        <img src="/img/little_r.png" class="hide-on-med-and-up">
        <img src="/img/raddit_logo.png" class="hide-on-small-only" title="r a d d . i t!">
        <?php if ($bucket == "music"): ?><a class="easter" href="#" style="position:absolute;top:0;left:100px;" title="don't click, totally not an easter egg"><img src="/img/blank.png" class="hide-on-small-only easter" style="width:10px;height:10px;"></a><?php endif; ?>
      </a>
    

      <ul class="hide-on-embed">
        <li class="title hide-on-med-and-down"><span class="title"></span></li>
        <li class="hidden"><select class="jump virgin"><option selected disabled value="|nil"><i>Loaded</i></option></select></li>
      </ul>
    </div>
  </nav>

  <div class="navBtns">
      <a class="btn-floating tooltipped blue-grey darken-4 z-depth-light hide-on-media-bucket hide-on-embed modal-trigger" href="#options" data-position="bottom" data-tooltip="options & hotkeys"><i class="mdi-action-settings"></i></a>

      <?php if ($loggedIn): ?>
        <a class="btn-floating tooltipped blue-grey darken-2 z-depth-light hide-on-embed" href="/logout" data-position="bottom" data-tooltip="log-out from u/<?=$username ?>"><i class="mdi-social-person"></i></a>
      <?php else: ?>
        <a class="btn-floating tooltipped blue-grey darken-4 z-depth-light hide-on-embed" href="/login" data-position="bottom" data-tooltip="log-in via reddit account"><i class="mdi-social-person-outline"></i></a>
      <?php endif; ?>

      <a class="btn-floating tooltipped blue-grey darken-4 z-depth-light hide-on-embed" onClick="$('div.quickLoad span.select-dropdown').click();" data-position="bottom" data-tooltip="open/ close menu"><i class="mdi-navigation-menu"></i></a>
  </div>
  
  <!-- Order of class names for containers is important.  Section name must follow the 'container' class. -->
  <div class="container media hidden">
    <div class="section content"><div class="hide-on-load media-dsp" style="height:600px;padding-top:20%;color:#eee;font-size:32px;"><marquee hspace="25%" scrollamount="12"><i>loading!</i></marquee></div></div>

    <div class="section opts">
      <div class="mediaAbout grey-text text-lighten-3">
      <!--
        <a class="aboutMin btn-floating tooltipped blue-grey darken-4 z-depth-light" href="#minimize" data-position="left" data-tooltip="minimize panel"><i class="mdi-navigation-expand-more"></i></a>
        <a class="aboutMax hidden btn-floating tooltipped blue-grey darken-4 z-depth-light" href="#maximize" data-position="left" data-tooltip="maximize panel"><i class="mdi-navigation-expand-less"></i></a>
      -->

        <div style="margin:8px;width:100%">
          <h5 class="hide-on-small-only">
            <span class="abPostSource"></span> <span class="abPostFeed"></span><span class="abCommentsCnt"></span> <span class="abLinksCnt"></span>
            <a class="relatedNext hide-on-load tooltipped grey-text text-lighten-4 grey darken-4 z-depth-light" data-position="top" data-tooltip="load next found link">&nbsp;&#187;&nbsp;</a>
          </h5>

          <h6 class="hide-on-med-and-down">
            <a class="hotkeys hidden tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light" onclick="return false;" data-position="top" data-tooltip="hotkeys disabled, click anywhere to enable"><i class="mdi-device-brightness-auto"></i></a>
            <a class="addLink hide-on-load tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light modal-trigger" href="#linksAdd" data-position="top" data-tooltip="open search"><i class="mdi-action-search"></i></a>

            <!-- optional -->
            <a class="offliberty hide-on-load tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light" data-position="top" data-tooltip="download via offliberty.com"><i class="mdi-file-file-download"></i></a>

            <!-- music-only -->
            <a class="explode youtube-playlist hide-on-load tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light" data-position="top" data-tooltip="add all vids in playlist to links"><i class="mdi-content-add-circle-outline"></i></a>

            <!-- pics-only -->
            <a class="explode imgur-album hide-on-load tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light" data-position="top" data-tooltip="add all pics in album to links"><i class="mdi-content-add-circle-outline"></i></a>
            <a class="imgurDownload hide-on-load tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light" data-position="top" data-tooltip="download .zip of album"><i class="mdi-file-file-download"></i></i></a>

            <!--?php if ($loggedIn): ?-->
              <!-- user-only -->
              <a class="addLike hide-on-no-user tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light modal-trigger" href="#addLike" data-position="top" data-tooltip="upvote & add to liked"><i class="mdi-action-thumb-up"></i></a>
              <a class="dislike hide-on-no-user hide-on-load tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light" data-position="top" data-tooltip="remove from suggested links"><i class="mdi-action-thumb-down"></i></a>
              <a class="plAppend hide-on-no-user tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light modal-trigger" href="#plAppend" data-position="top" data-tooltip="add link to a playlist"><i class="mdi-av-playlist-add"></i></a>
            <!--?php endif; ?-->

            <?php if (empty($_COOKIE["removeads"])): ?>
              <!-- music-only -->
              <a class="amazon hide-on-load tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light" data-position="top" data-tooltip="find track on amazon"><i class="mdi-action-add-shopping-cart"></i></a>

              <a href="http://patreon.com/user?u=3584210" target="_blank" class="patreon tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light" data-position="top" data-tooltip="support radd.it on patreon!"><i class="mdi-editor-attach-money"></i></a>
              
<!--               <a onClick="$('#paypal').submit();" class="ppdonate tooltipped grey-text text-lighten-2 grey darken-4 z-depth-light" data-position="top" data-tooltip="help keep radd.it online!  <?=date('F') ?> donations: $<?=$vars['donations'] ?>"><i class="mdi-editor-attach-money"></i></a>
              <form id="paypal" style="display:none;" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank"><input type="hidden" name="cmd" value="_s-xclick"><input type="hidden" name="hosted_button_id" value="WEZA98RR3EPQ4"></form>
 -->            <?php endif; ?>
          </h6>
        </div>
      </div>

      <span class="hidden title"><h4></h4></span>
    </div>
  </div>

<!--
  <div id="relatedLinks" class="hidden hide-on-med-and-down">
    <ul class="collapsible" data-collapsible="expandable">    
      <li>
        <div class="collapsible-header"><i class="mdi-content-link"></i>Related Links<span id="relCnt" class="badge">-1</span> </div>
        <div class="collapsible-body">
          <ul class='collection relatedLinks'>
          </ul>
        </div>
      </li>
    </ul>
  </div>
-->

    

  <div class="container grid hidden">
    <h1 class="contLabel hide-on-med-and-down">loaded</h1>
    <div class="section content">
      <div class="cardCont boxCont row grey darken-1 z-depth-1">

      </div>
    </div>

    <div class="section opts hide-on-small-only blue-grey darken-4 z-depth-2">
      <a class="nixLinks btn-floating blue-grey darken-2 z-depth-1 tooltipped modal-trigger" href="#nixLinks" data-position="top" data-tooltip="remove links"><i class="mdi-content-remove"></i></a>
      <a class="addLink btn-floating blue-grey darken-2 z-depth-1 tooltipped modal-trigger" href="#linksAdd" data-position="top" data-tooltip="add a link"><i class="mdi-content-add"></i></a>
      <a class="plAdd hide-on-media-bucket btn-floating blue-grey darken-2 save z-depth-1 tooltipped modal-trigger" href="#plAdd" data-position="top" data-tooltip="save all links to playlist"><i class="mdi-content-save"></i></a>
      <a class="share btn-floating blue-grey darken-2 z-depth-1 tooltipped modal-trigger" href="#share" data-position="top" data-tooltip="Share or embed this feed."><i class="mdi-social-share"></i></a>
      <a class="togShuffle btn-floating blue-grey darken-2 z-depth-1 tooltipped" href="#shuffle" data-position="top" data-tooltip="shuffle links"><i class="mdi-av-shuffle"></i></a>
      <a class="togLinks btn-floating blue-grey darken-2 z-depth-1 tooltipped" href="#table" data-position="top" data-tooltip="switch to table view"><i class="mdi-editor-format-list-numbered"></i></a>
    </div>
  </div>
  

  <div class="container links hidden"> <!--< ?=($startPanel == 'links' ? '' : ' hidden' )? >">-->
    <h1 class="contLabel hide-on-med-and-down">loaded</h1>
    <div class="section content">
<?php  
    if ($bucket == 'music') 
      echo '<table id="links" class="music compact hover row-border z-depth-2"><thead><tr><th class="pos">#</th><th class="artist">Artist</th><th class="track">Track</th><th class="genre">Genre(s)</th><th class="year">Year</th><th class="length">Length</th><th class="score">Score</th><th class="subreddit">Sub</th><th class="source">Source</th><th class="opts shuffle"><i class="shuffle tiny mdi-av-shuffle lighten-2' . (isset($_GET["shuffle"]) ? " green" : "") . '"></i></th></tr></thead><tbody></tbody></table>';
    else if ($bucket == 'vids') 
      echo '<table id="links" class="vids compact hover row-border z-depth-2"><thead><tr><th class="pos">#</th><th class="title">Title</th><th class="length">Length</th><th class="kind">Kind</th><th class="author">Author</th><th class="score">Score</th><th class="subreddit">Sub</th><th class="source">Source</th><th class="opts shuffle"><i class="shuffle tiny mdi-av-shuffle lighten-2' . (isset($_GET["shuffle"]) ? " green" : "") . '"></i></th></tr></thead><tbody></tbody></table>';
    else 
      echo '<table id="links" class="others compact hover row-border z-depth-2"><thead><tr><th class="pos">#</th><th class="title">Title</th><th class="kind">Kind</th><th class="author">Author</th><th class="score">Score</th><th class="subreddit">Sub</th><th class="source">Source</th><th class="opts shuffle"><i class="shuffle tiny mdi-av-shuffle lighten-2' . (isset($_GET["shuffle"]) ? " green" : "") . '"></i></th></tr></thead><tbody></tbody></table>';
?>
      <div class="listings"></div>
    </div>

    <div class="section opts hide-on-small-only blue-grey darken-4 z-depth-2">
      <a class="nixLinks btn-floating blue-grey darken-2 z-depth-1 tooltipped modal-trigger" href="#nixLinks" data-position="top" data-tooltip="remove links"><i class="mdi-content-remove"></i></a>
      <a class="addLink btn-floating blue-grey darken-2 z-depth-1 tooltipped modal-trigger" href="#linksAdd" data-position="top" data-tooltip="add a link"><i class="mdi-content-add"></i></a>
      <a class="plAdd btn-floating blue-grey darken-2 save z-depth-1 tooltipped modal-trigger" href="#plAdd" data-position="top" data-tooltip="save all links to playlist"><i class="mdi-content-save"></i></a>
      <a class="share btn-floating blue-grey darken-2 z-depth-1 tooltipped modal-trigger" href="#share" data-position="top" data-tooltip="Share or embed this feed."><i class="mdi-social-share"></i></a>
      <a class="togLinks btn-floating blue-grey darken-2 z-depth-1 tooltipped hide-on-media-bucket" href="#grid" data-position="top" data-tooltip="switch to grid view"><i class="mdi-action-view-module"></i></a>
    </div>
  </div>

<?php
  if ($bucket == 'media') {
    $switchURL = $url;
    if (strpos($switchURL, "?") === false) {
      if (strpos($switchURL, "/r/") === false) $switchURL .= '?bucket={BUCKET}'; 
      else $switchURL .= '/{BUCKET}';
    }
    else $switchURL .= '&bucket={BUCKET}';

    echo '<div class="row"><div class="col s12 m12 l8 offset-l2"><div class="card small center-align z-depth-2" style="height:248px;margin-top:50px;"><div class="card-action">';
    echo "<h3>You are in the 'media' bucket.<br>Some functionality is not available!</h3><h5>Switch to";
    foreach ($vars['buckets'] as $key => $value) {
      $bURL = str_replace("{BUCKET}", $value, $switchURL);
      echo " <a href='" . $bURL . "' title='" . $vars['bucketDescrips'][$value] . "'>" . $value . "</a>";
    }

    echo "</h5><br><br></div></div></div></div>";
  }
?>

  <div class="container liked hidden half-height">
    <h1 class="contLabel hide-on-med-and-down">liked</h1>
    <div class="section content no-opts">
      <div class="boxCont grey darken-1 z-depth-1" style="padding:8px 20px;border-radius:2px;">
<?php
  $catCnt = 0;
  $lastCat = "";

  echo '<div class="row"><div class="input-field col s12 grey lighten-3 z-depth-2" style="border-radius:4px"><select id="likedCats">';
  if ($foundLinks) {
    echo '<option value="0">Suggested</option>';
    $catCnt = 1;
  }

  while ($like = $userLikes->fetch_row()) {
    // cat, label, url, thumb, permalink
    $l_cat = $like[0];
    $l_cat_full = $l_cat;
    if (strpos($l_cat, "|") !== false) $l_cat = substr($l_cat, strpos($l_cat, "|") + 1);

    $l_label = $like[1];
    $l_url = $like[2];
    $l_thumb = str_replace("http:", "https:", $like[3]);
    $l_perma = $like[4];
    $l_idx = $like[5];
    $l_descrip = $like[6];

    if ($l_cat_full !== $lastCat) {
      if (
        substr($l_cat_full, 0, 1) !== "~"
        && strpos($userCats, 'value="' . $l_cat_full . '"') === false 
        && strpos($stickyCats, 'value="' . $l_cat_full . '"') === false
      ) $userCats .= '<option value="' . $l_cat_full . '">' . $l_cat . '</option>';

      // if ($cnt > 0) echo "</ul></div></li>";
      // echo "<li class='collapsible-item'><div class='collapsible-header'><h5>" . $l_cat . "</h5></div><div class='collapsible-body'><ul class='collection'>";

      // if ($cnt > 0) echo '</ul></div>';

      // echo '<li class="tab col s4 green darken-4 z-depth-2"><a class="grey-text text-lighten-3" href="#liked-' . $catCnt . '">' . $l_cat . '</a></li>';
      echo '<option value="' . $catCnt . '">' . $l_cat . '</option>';

      $lastCat = $l_cat_full;
      $catCnt++;
    }    
  }
  // echo "</ul></div><div class='links row'>";
  echo "</select></div></div><div class='links row'>";

  $cnt = 0;
  $catCnt = 0;
  $hidden = "";

  if ($foundLinks) {
    echo '<div class="results" id="liked-0"><ul class="collection z-depth-1 suggested">';

    $catCnt = 1;
    $hidden = " hidden";

    $suggestions->data_seek(0);
    while ($sug = $suggestions->fetch_row()) {
        // kind, source, label, descrip, url, permalink, thumb
      $s_kind = $sug[0];
      if ($s_kind != "link" || $cnt > 98) continue;
      $s_source = $sug[1];
      $s_label = $sug[2];
      $s_descrip = $sug[3];
      $s_url = $sug[4];
      $s_permalink = $sug[5];
      $s_thumb = $sug[6];
      $s_id = $sug[7];

      if ($s_thumb == "" || substr($s_thumb, 0, 4) != "http") {
        if ($bucket == "ladycandy") $s_thumb = "/img/eyecandy.jpg";
        else if ($bucket == "gaynsfw") $s_thumb = "/img/nsfw.jpg";
        else if ($bucket == "media") $s_thumb = "/img/little_r.png";
        else $s_thumb = "/img/" . $bucket . ".jpg";
      }

      echo 
        '<div class="col s12 m4 l3">'
          . '<li class="card collection-item avatar idx-' . ($cnt * -1) . ' z-depth-2">'
            . '<div class="title">' . $s_label . '</div>'
            // . '<span class="hide-on-small-only"><br>' . $l_url . '</span>'  // . ') ' . $l_descrip . 
            . '<img class="right z-depth-1" src="' . $s_thumb . '">'  //  alt=""

            . '<div class="btns">'
              . '<a class="nixSugg secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="remove from suggestions"><i class="small mdi-content-clear"></i></a>'
              . '<a class="likeOpen secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="open on host site"><i class="small mdi-action-open-in-new"></i></a>'
              . '<a class="likeAppend secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="add to loaded"><i class="small mdi-content-add"></i></a>'
            . '</div>'
          . '</li>'
        . '</div>'
      ;

      $cnt++;
    }

    // echo "</ul></div>";  // closed in while() below
  }

  $lastCat = "";

  $userLikes->data_seek(0);
  while ($like = $userLikes->fetch_row()) {
    // cat, label, url, thumb, permalink
    $l_cat = $like[0];
    $l_cat_full = $l_cat;
    if (strpos($l_cat, "|") !== false) $l_cat = substr($l_cat, strpos($l_cat, "|") + 1);

    $l_label = $like[1];
    $l_url = $like[2];
    $l_thumb = str_replace("http:", "https:", $like[3]);
    $l_perma = $like[4];
    $l_idx = $like[5];
    $l_descrip = $like[6];

    if ($l_cat_full !== $lastCat) {
      // if ($cnt > 0) echo "</ul></div></li>";
      // echo "<li class='collapsible-item'><div class='collapsible-header'><h5>" . $l_cat . "</h5></div><div class='collapsible-body'><ul class='collection'>";

      if ($cnt > 0) {
        echo '</ul></div>';
        $hidden = " hidden";
      }
 

      // echo 
      //   '<div class="row"><ul class="collection with-header z-depth-1">'
      //     . '<div class="col s12 l12"><li class="collection-header blue-grey lighten-1 grey-text text-lighten-4"><h5>' . $l_cat . '</h5></li></div>';

      echo '<div class="results' . $hidden . '" id="liked-' . $catCnt . '"><ul class="collection z-depth-1">';

      $lastCat = $l_cat_full;
      $catCnt++;
    }

    // echo 
    //   '<li class="collection-item avatar idx-' . $l_idx . '">'
    //     . '<img src="' . $l_thumb . '">'  //  alt=""
    //     . '<div class="title"><b>' . $l_label . '</b> ' . $l_descrip . '</div>'
    //     // These <a>s float: left so order is reversed.
    //     . '<a class="secondary-content nix btn-floating tooltipped red darken-4 z-depth-1" data-position="bottom" data-tooltip="remove from liked"><i class="mdi-content-clear"></i></a>'
    //     . '<a class="secondary-content append btn-floating tooltipped green darken-4 z-depth-1" data-position="bottom" data-tooltip="add to loaded"><i class="mdi-content-add"></i></a>'
    //   . '</li>'
    // ;

    echo 
      '<div class="col s12 m4 l3">'
        . '<li class="card collection-item avatar idx-' . $l_idx . ' z-depth-2">'
          . '<div class="title">' . $l_label . '</div>'
          // . '<span class="hide-on-small-only"><br>' . $l_url . '</span>'  // . ') ' . $l_descrip . 
          . '<img class="right z-depth-1" src="' . $l_thumb . '">'  //  alt=""

          . '<div class="btns">'
            . '<a class="likeNix secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="remove from liked"><i class="small mdi-content-clear"></i></a>'
            . '<a class="likeOpen secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="open on host site"><i class="small mdi-action-open-in-new"></i></a>'
            . '<a class="likeAppend secondary-content blue-text text-darken-4 tooltipped" data-position="top" data-tooltip="add to loaded"><i class="small mdi-content-add"></i></a>'
          . '</div>'
        . '</li>'
      . '</div>'
    ;

    $cnt++;
  }

  // if ($cnt > 0) echo "</ul></div></li>";
  if ($cnt > 0) echo "</ul></div>";
  echo "</div>";  // close <div class="row">
?>
        </ul>
      </div>
    </div>
  </div>

<!--?php if (empty($_COOKIE["removeads"])): ? >
  <div class="row hide-on-embed" style="padding-top:32px;margin-bottom:-16px;">

<!--
    <div class="col s12 m6 offset-m3 l4 offset-l4">
      <div class="card small center-align z-depth-2" style="height:96px;">
        <div class="card-action">
<!?php if ($loggedIn): ?!>
          Appreciate the lack of ads?  Can ya spare 6¢/day?<br>
          <a href="#paypal" onClick="$('#paypal').submit();return false;" style="font-size:18px;font-weight:500;">Support radd.it for $2/mo!</a><br>
          <a href="#paypal" onClick="$('#paypal2').submit();return false;" style="font-size:12px;font-weight:400;">Or $1/mo, that helps too.</a>
<!?php else: ?!>
          <a href="/login" style="font-size:18px;font-weight:500;">LOG-IN</a><br>to upvote & save links, create playlists,<br>and get custom suggestions.
<!?php endif; ?!>
        </div>
      </div>
    </div>
  </div>

  <form id="paypal" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" style="display:none;">
  <input type="hidden" name="cmd" value="_s-xclick">
  <input type="hidden" name="hosted_button_id" value="RDSAW38NU9BU6">
  <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_subscribeCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
  <!img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
  </form>

  <form id="paypal2" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" style="display:none;">
  <input type="hidden" name="cmd" value="_s-xclick">
  <input type="hidden" name="hosted_button_id" value="9SLATFXDJ9YHQ">
  <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_subscribeCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
  <!img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
  </form>
< ? php endif; ?-->

  <div class="container feeds hide-on-embed">
    <h1 class="contLabel hide-on-med-and-down">feeds</h1>
    <div class="section no-opts">
      <div class="boxCont grey darken-1 z-depth-1" style="padding:8px 20px;border-radius:2px;">
<?php
  $catCnt = 0;
  $lastCat = "";

  // echo '<div class="row"><ul class="tabs">';
  $width = 's12';
  if ($loggedIn) $width = 's10';
  echo '<div class="row"><div class="input-field col ' . $width . ' grey lighten-3 z-depth-2" style="border-radius:4px"><select id="feedCats">';

  if ($foundFeeds) {
    if (!$loggedIn) echo '<option value="0">Most Popular</option>';
    else echo '<option value="0">Suggested</option>';

    $catCnt = 1;
  }

  while ($l_feed = $feeds->fetch_row()) {
    // cat, source, hasOpts, url, label, descrip, is_sticky, is_default
    $l_cat_full = $l_feed[0];
    $l_cat = $l_cat_full;
    if (strpos($l_cat, "|") !== false) $l_cat = substr($l_cat, strpos($l_cat, "|") + 1);

    $l_source = $l_feed[1];
    $hasOpts = $l_feed[2];
    $l_url = $l_feed[3];

    $l_label = $l_feed[4];
    $l_descrip = str_replace(chr(10), "  ", $l_feed[5]);
    $sticky = ($l_feed[6] == 0 ? false : true);
    $default = ($l_feed[7] == 0 ? false : true);
    $userOnly = ($l_feed[8] == 0 ? false : true);

    if ($userOnly && !$loggedIn) continue;      // if not logged in, skip the user-only feeds

    if (
      !$userOnly
      && substr($l_cat_full, 0, 1) !== "~"
      && strpos($stickyCats, 'value="' . $l_cat_full . '"') === false 
      && strpos($userCats, 'value="' . $l_cat_full . '"') === false
    ) {
      if ($sticky) $stickyCats .= '<option value="' . $l_cat_full . '">' . $l_cat . '</option>';
      else $userCats .= '<option value="' . $l_cat_full . '">' . $l_cat . '</option>';
    }

    if ($default && strpos($defaultCats, 'value="' . $l_cat_full . '"') === false) $defaultCats .= '<option value="' . $l_cat_full . '">' . $l_cat . '</option>';

    if ($loggedIn && $default) continue;              // if we're logged in, skip the default feeds

    if ($l_cat_full == "~a|Playlists") {
      $playlistOpts .= '<option value="' . $playlistCnt . '">' . $l_label . '</option>';
      $playlistCnt++;

      $userPlaylists[] = array(
        "url" => $l_url
        ,"label" => $l_label
        ,"descrip" => $l_descrip
      );
    }

    if ($l_cat_full != $lastCat) {
      // echo '<li class="tab col s4 blue darken-4 z-depth-2"><a class="grey-text text-lighten-3" href="#feeds-' . $catCnt . '">' . $l_cat . '</a></li>';
      echo '<option value="' . $catCnt . '">' . $l_cat . '</option>';

      // echo 
      //   '<div class="row"><ul class="collection with-header z-depth-1">'
      //     . '<div class="col s12"><li class="collection-header blue-grey grey-text text-lighten-4"><h5>' . $l_cat . '</h5></li></div>';

      $lastCat = $l_cat_full;
      $catCnt++;
    }
  }

  echo "</select></div>";

  if ($loggedIn)
    echo '<div class="col s2"><a class="btn-large z-depth-2 blue darken-3 grey-text text-lighten-3 addFeed modal-trigger tooltipped" style="margin:16px 0 -8px;width:100%;" data-position="top" data-tooltip="add feed" href="#addFeed"><i class="mdi-content-add"></i></a></div>';

  echo "</div><div class='links row'>";

  $hidden = "";
  $cnt = 0;
  $catCnt = 0;

  if ($foundFeeds) {
    echo '<div class="results" id="feeds-0"><ul class="collection z-depth-1">';

    $catCnt = 1;
    $hidden = " hidden";

    $cnt = 0;
    $dupeFeeds = array();
    $suggestions->data_seek(0);
    while ($sug = $suggestions->fetch_row()) {
      // kind, source, label, descrip, url, permalink
      $s_kind = $sug[0];
      if ($s_kind != "feed" || $cnt > 10) continue;
      $s_source = $sug[1];
      $s_label = $sug[2];
      $s_descrip = $sug[3];
      $s_url = $sug[4];
      if (in_array(strtolower($s_url), $dupeFeeds)) continue;
      $dupeFeeds[] = strtolower($s_url);

      $s_permalink = $sug[5];

      echo
        '<div class="col s12 m6 l4">'
          . '<li class="card collection-item feed-' . $s_source . ' suggested no-opts z-depth-2"><div><div class="details"><b>' . $s_label . '</b><br><i>' . $s_url . '</i><span class="hide-on-small-only"><br>' . $s_descrip . '</span></div>'
          . '<div style="clear:both;">'
            . '<a class="secondary-content blue-text text-darken-4 tooltipped" data-position="left" data-tooltip="load feed"><i class="small mdi-hardware-keyboard-arrow-right"></i></a>'
          . '</div>'
        . "</div></li></div>"
      ;

      $cnt++;
    }

    // echo "</ul></div>";  // gets closed in while() below
  }

  $lastCat = "";
  $allSubs = "";

  $stripStrs = array("https://", "http://", "www.", "js/", ".js");  // Text to NOT display in URLs.

  $feeds->data_seek(0);
  while ($l_feed = $feeds->fetch_row()) {
    // cat, source, hasOpts, url, label, descrip, is_sticky, is_default
    $l_cat_full = $l_feed[0];
    $l_cat = $l_cat_full;
    if (strpos($l_cat, "|") !== false) $l_cat = substr($l_cat, strpos($l_cat, "|") + 1);

    $l_source = $l_feed[1];
    $hasOpts = $l_feed[2];
    $l_url = $l_feed[3];

    $l_label = $l_feed[4];
    $l_descrip = str_replace(chr(10), "  ", $l_feed[5]);
    $sticky = ($l_feed[6] == 0 ? false : true);
    $default = ($l_feed[7] == 0 ? false : true);
    $userOnly = ($l_feed[8] == 0 ? false : true);

    if ($userOnly && !$loggedIn) continue;          // if not logged in, skip the user-only feeds
    else if ($loggedIn && $default) continue;     // if we're logged in, skip the default feeds

    if (
      $embedded
      && $loggedIn
      && $l_source == 'reddit'
      && strlen($allSubs) + strlen($l_url) < 2048
      && substr($l_url, 0, 3) == '/r/'
      && strpos($l_url, "?") == false
      && strpos($l_url, "/comments/") == false
    ) $allSubs .= ($allSubs == "" ? "" : "+") . explode("/", str_replace("/r/", "", $l_url))[0];

    if ($l_cat_full != $lastCat) {
      if ($cnt > 0) {
        echo '</ul></div>';
        $hidden = " hidden";
      }

      echo '<div class="results' . $hidden . '" id="feeds-' . $catCnt . '"><ul class="collection z-depth-1">';

      $lastCat = $l_cat_full;
      $catCnt++;
    }

    if (!in_array($l_url, $urlsShown, true)) $urlsShown[] = $l_url;

    $l_descrip = str_replace(chr(10), "  ", $l_feed[5]);
    if (strlen($l_descrip) > 127) {
      $pos = strpos($l_descrip, ". ", strpos($l_descrip, ". ") + 2);
      if ($pos !== false) {
        $l_descrip = substr($l_descrip, 0, $pos + 1);
        if (strlen($l_descrip) > 127 && strpos($l_descrip, ". ") !== false)
          $l_descrip = substr($l_descrip, 0, strpos($l_descrip, ". ") + 1);
      }
    }

    $l_url = trim(str_replace($stripStrs, "", $l_url));
    $l_url = substr($l_url, 0, 24) . (strlen($l_url) > 24 ? "&hellip;" : "");

    echo '<div class="col s12 m6 l4">';

    if ($hasOpts)
      echo 
        '<li class="card collection-item collection-reveal feed-' . $l_source . ' z-depth-2"><div><div class="details"><b>' . $l_label . '</b><br><i>' . $l_url . '</i><span class="hide-on-small-only"><br>' . $l_descrip . '</span></div>'
        . '<div style="clear:both;">'
          . '<a class="secondary-content blue-text text-darken-4 tooltipped" data-position="left" data-tooltip="view feed options"><i class="small mdi-hardware-keyboard-arrow-down"></i></a>'
          . ($sticky ? '' : '<a onClick="listr.feeds.nix(' . $cnt . ');" class="secondary-content blue-text text-darken-4 tooltipped" data-position="bottom" data-tooltip="remove from feeds"><i class="small mdi-content-clear"></i></a>')
        . '</div>'
        . '<div class="secondary-reveal"> </div>'
      ;
    else
      echo 
        '<li class="card collection-item feed-' . $l_source . ' no-opts z-depth-2"><div><div class="details"><b>' . $l_label . '</b><br><i>' . $l_url . '</i><span class="hide-on-small-only"><br>' . $l_descrip . '</span></div>'
        . '<div style="clear:both;">'
          . '<a class="secondary-content blue-text text-darken-4 tooltipped" data-position="left" data-tooltip="load feed"><i class="small mdi-hardware-keyboard-arrow-right"></i></a>'
          . ($sticky ? '' : '<a onClick="listr.feeds.nix(' . $cnt . ');" class="secondary-content blue-text text-darken-4 tooltipped" data-position="bottom" data-tooltip="remove from feeds"><i class="small mdi-content-clear"></i></a>')
        . '</div>'
      ;

    echo "</div></li></div>";
    $cnt++;
  }

  if ($cnt > 0) echo '</ul></div>';  // close last cat
  echo "</div>";

  // if ($loggedIn)
  //   echo
  //     '<div style="width:100%;text-align:center">'
  //       . '<a class="addFeed btn-large green darken-4 tooltipped modal-trigger" href="#addFeed" data-position="bottom" data-tooltip="add feed"><i class="mdi-content-add left"></i>add feed</a>'
  //     . '</div>'
  //   ;
?>   
  </div></div></div>

  <div id="options" class="container options no-min-height modal">
      <div class="section content no-opts modal-content">
      <h4>options</h4>
      <div class="music hidden">       <!-- Opts are divided into buckets. -->
       <!-- Order of classes is important.  First class must match corresponding listr.opt.* structure. -->
        <div class="showMedia switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Display media<span class="hide-on-small-only"> at top of page</span>?
        </div>

        <div class="showVisuals switch hide-on-mobile">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Replace media with<span class="hide-on-small-only"> more interesting</span> visuals?
        </div>

        <div class="autoSkip switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Skip to next link<span class="hide-on-small-only"> when a song finishes</span>?
        </div>

        <div class="allowNoStream switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Include sites that don't stream<span class="hide-on-small-only"> automatically  (i.e. bandcamp)</span>?
        </div>

        <div class="allowAds switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Include sites with ads<span class="hide-on-small-only"> before the media  (i.e. dailymotion)</span>?
        </div>

        <div class="allowNSFW switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Include links marked N<span class="hide-on-small-only">ot </span>S<span class="hide-on-small-only">afe </span>F<span class="hide-on-small-only">or </span>W<span class="hide-on-small-only">ork</span>?
        </div>

        <div class="replaceYoutube switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Attempt to replace youtube vids<span class="hide-on-small-only"> when link won't play</span>?
        </div>

        <div class="clearOnLoad switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Clear all links when loading<span class="hide-on-small-only"> a new feed</span>?
        </div>

        <div class="pushRelated switch">
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Automatically add all found links<span class="hide-on-small-only"> to loaded links</span>?
        </div>

        <div class="onlySearchFeeds switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Only search subreddits included in feeds?<span class="hide-on-small-only">  (If no, search all of reddit.)</span>
        </div>

<!--
        <div class="showSongkick switch">
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Show <a target="_blank" href="http://www.songkick.com">SongKick</a> button<span class="hide-on-small-only"> when an artist is on tour</span>?
        </div>
-->
        <div class="showOffliberty switch">
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Show <a target="_blank" href="http://offliberty.com">Offliberty</a> button<span class="hide-on-small-only"> to download streaming music & video</span>?
        </div>

        <div class="showGrid switch">
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Show links in a grid<span class="hide-on-small-only"> instead of a table</span>?
        </div>

        <div class="sleep switch">   
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Automatically stop playback in <span class="time">an hour?</span>
        </div>
      </div>

      <!-- vids -->
      <div class="vids hidden">
        <div class="autoSkip switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Skip to next link<span class="hide-on-small-only"> when a vid finishes</span>?
        </div>

        <div class="allowAds switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Include sites with ads<span class="hide-on-small-only"> before the media  (i.e. dailymotion)</span>?
        </div>

        <div class="allowNSFW switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Include links marked N<span class="hide-on-small-only">ot </span>S<span class="hide-on-small-only">afe </span>F<span class="hide-on-small-only">or </span>W<span class="hide-on-small-only">ork</span>?
        </div>

        <div class="replaceYoutube switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Attempt to replace youtube vids<span class="hide-on-small-only"> when link won't play</span>?
        </div>

        <div class="clearOnLoad switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Clear all links when loading<span class="hide-on-small-only"> a new feed</span>?
        </div>

        <div class="pushRelated switch">
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Automatically add all found links<span class="hide-on-small-only"> to loaded links</span>?
        </div>

        <div class="onlySearchFeeds switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Only search subreddits included in feeds?<span class="hide-on-small-only">  (If no, search all of reddit.)</span>
        </div>

        <div class="showOffliberty switch">
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Show <a href="https://offliberty.com">Offliberty</a> button<span class="hide-on-small-only"> to download streaming music & video</span>?
        </div>

        <div class="showGrid switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Show links in a grid<span class="hide-on-small-only"> instead of a table</span>?
        </div>

        <div class="sleep switch">   
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Automatically stop playback in <span class="time">an hour?</span>
        </div>
      </div>


      <div class="pics hidden">
        <div class="allowZoom switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Zoom in on images<span class="hide-on-small-only"> when mouse cursor is over them</span>?
        </div>

        <div class="allowNSFW switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Include links marked N<span class="hide-on-small-only">ot </span>S<span class="hide-on-small-only">afe </span>F<span class="hide-on-small-only">or </span>W<span class="hide-on-small-only">ork</span>?
        </div>

        <div class="clearOnLoad switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Clear all links when loading<span class="hide-on-small-only"> a new feed</span>?
        </div>

        <div class="pushRelated switch">
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Automatically add all found links<span class="hide-on-small-only"> to loaded links</span>?
        </div>

        <div class="onlySearchFeeds switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Only search subreddits included in feeds?<span class="hide-on-small-only">  (If no, search all of reddit.)</span>
        </div>

        <div class="showGrid switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Show links in a grid<span class="hide-on-small-only"> instead of a table</span>?
        </div>
      </div>

      <div class="eyecandy hidden">
        <div class="allowZoom switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Zoom in on images<span class="hide-on-small-only"> when mouse cursor is over them</span>?
        </div>

        <div class="allowNSFW switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Include links marked N<span class="hide-on-small-only">ot </span>S<span class="hide-on-small-only">afe </span>F<span class="hide-on-small-only">or </span>W<span class="hide-on-small-only">ork</span>?
        </div>

        <div class="clearOnLoad switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Clear all links when loading<span class="hide-on-small-only"> a new feed</span>?
        </div>

        <div class="pushRelated switch">
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Automatically add all found links<span class="hide-on-small-only"> to loaded links</span>?
        </div>

        <div class="onlySearchFeeds switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Only search subreddits included in feeds?<span class="hide-on-small-only">  (If no, search all of reddit.)</span>
        </div>

        <div class="showGrid switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Show links in a grid<span class="hide-on-small-only"> instead of a table</span>?
        </div>
      </div>

      <div class="ladycandy hidden">
        <div class="allowZoom switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Zoom in on images<span class="hide-on-small-only"> when mouse cursor is over them</span>?
        </div>

        <div class="allowNSFW switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Include links marked N<span class="hide-on-small-only">ot </span>S<span class="hide-on-small-only">afe </span>F<span class="hide-on-small-only">or </span>W<span class="hide-on-small-only">ork</span>?
        </div>

        <div class="clearOnLoad switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Clear all links when loading<span class="hide-on-small-only"> a new feed</span>?
        </div>

        <div class="pushRelated switch">
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Automatically add all found links<span class="hide-on-small-only"> to loaded links</span>?
        </div>

        <div class="onlySearchFeeds switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Only search subreddits included in feeds?<span class="hide-on-small-only">  (If no, search all of reddit.)</span>
        </div>

        <div class="showGrid switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Show links in a grid<span class="hide-on-small-only"> instead of a table</span>?
        </div>
      </div>

      <div class="nsfw hidden">
        <div class="allowZoom switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Zoom in on images<span class="hide-on-small-only"> when mouse cursor is over them</span>?
        </div>

        <div class="clearOnLoad switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Clear all links when loading<span class="hide-on-small-only"> a new feed</span>?
        </div>

        <div class="pushRelated switch">
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Automatically add all found links<span class="hide-on-small-only"> to loaded links</span>?
        </div>

        <div class="onlySearchFeeds switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Only search subreddits included in feeds?<span class="hide-on-small-only">  (If no, search all of reddit.)</span>
        </div>

        <div class="showGrid switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Show links in a grid<span class="hide-on-small-only"> instead of a table</span>?
        </div>
      </div>

      <div class="gaynsfw hidden">
        <div class="allowZoom switch">   
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Zoom in on images<span class="hide-on-small-only"> when mouse cursor is over them</span>?
        </div>

        <div class="clearOnLoad switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Clear all links when loading<span class="hide-on-small-only"> a new feed</span>?
        </div>

        <div class="pushRelated switch">
          <label>
            No
            <input type="checkbox">
            <span class="lever"></span>
            Yes
          </label>
          Automatically add all found links<span class="hide-on-small-only"> to loaded links</span>?
        </div>

        <div class="onlySearchFeeds switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Only search subreddits included in feeds?<span class="hide-on-small-only">  (If no, search all of reddit.)</span>
        </div>

        <div class="showGrid switch">
          <label>
            No
            <input type="checkbox" checked>
            <span class="lever"></span>
            Yes
          </label>
          Show links in a grid<span class="hide-on-small-only"> instead of a table</span>?
        </div>
      </div>
    </div>

    <div class="section hotkeys z-depth-1 hide-on-mobile">
      <h4>hotkeys</h4>
      <table class="striped">
        <tbody>
          <tr><td>, (comma)</td><td>Back to prev. link</td></tr>
          <tr><td>. (period)</td><td>Skip to next link</td></tr>
          <tr><td>n</td><td>Load next found link</td></tr>
          <tr style="display:none;"><td colspan="2">&nbsp;</td></tr>
          <tr><td>/ (slash)</td><td>Pause/ resume media.</td></tr>
          <tr><td>; (semicolon)</td><td>Turn autoskipping on/ off</td></tr>
          <tr style="display:none;"><td colspan="2">&nbsp;</td></tr>
          <tr><td>m</td><td>Toggle <b>m</b>enu open/ close</td></tr>
          <tr><td>s</td><td>Open close search results/ found links</td></tr>
          <tr style="display:none;"><td colspan="2">&nbsp;</td></tr>
          <tr><td colspan="2">&nbsp;</td></tr>
          <tr><td>o</td><td><b>O</b>pen link on host site</td></tr>
          <tr><td>r</td><td>Open <b>r</b>elated post/ comment</tr>
          <tr style="display:none;"><td colspan="2">&nbsp;</td></tr>
          <tr><td>l</td><td>Add link to <b>l</b>iked</td></tr>
          <tr><td>p</td><td>Add link to <b>p</b>laylist</td></tr>
          <tr style="display:none;"><td colspan="2">&nbsp;</td></tr>
          <tr><td colspan="2">&nbsp;</td></tr>
          <tr><td>z</td><td>Turn sleep on/ off</td></tr>
          <tr><td>t</td><td>Toggle <b>t</b>able or grid view</td></tr>
          <tr><td>v</td><td>Turn <b>v</b>isuals on/ off</td></tr>
          <tr><td>1, 2, 3, etc.</td><td>Scroll to media, links, likes, etc.</td></tr>
        </tbody>        
      </table>
      <p><b>Note:</b> Hotkeys don't work if the media has focus (like if you click on a youtube video.)<br>Not all hotkeys are available for all buckets.</p>
    </div>

    <div class="modal-footer">
      <a class="waves-effect waves-blue btn-flat modal-action modal-close">Close</a>
    </div>
  </div>

  
  <footer class="page-footer blue-grey darken-4 hide-on-embed">
    <div class="row">
      <div class="col s1">
        <?php if ($loggedIn && empty($_COOKIE["removeads"]) && $bucket == 'music'): ?>
          <a target="_blank" href="https://chrome.google.com/webstore/detail/npmlbnidkjmlejhmckddifnbkcgmddnd/" class="z-depth-1 tooltipped" data-position="right" data-tooltip="use radd.it/music in your browser!"><img class="z-depth-light" src="/img/chrome.png"></a>
        <?php else: ?>&nbsp;<?php endif; ?>
      </div>

      <div class="col s2"><a href="/music" class="z-depth-1 tooltipped" data-position="bottom" data-tooltip="music"><img class="z-depth-light" src="/img/music.jpg"></a></div>
      <div class="col s2"><a href="/vids" class="z-depth-1 tooltipped" data-position="bottom" data-tooltip="vids"><img class="z-depth-light" src="/img/vids.jpg"></a></div>
      <div class="col s2"><a href="/pics" class="z-depth-1 tooltipped" data-position="bottom" data-tooltip="pics"><img class="z-depth-light" src="/img/pics.jpg"></a></div>
      <div class="col s2"><a href="/eyecandy" class="z-depth-1 tooltipped" data-position="bottom" data-tooltip="eyecandy"><img class="z-depth-light" src="/img/eyecandy.jpg"></a></div>
      <div class="col s2"><a href="/nsfw" class="z-depth-1 tooltipped" data-position="bottom" data-tooltip="nsfw"><img class="z-depth-light" src="/img/nsfw.jpg"></a></div>

      <div class="col s1">&nbsp;</div>
    </div>
  </footer>
  <div class="container buckets no-min-height hide-on-embed"> </div>

  <div id="nixLinks" class="modal">
    <div class="row">
      <div class="modal-content">
        <span class="options"> </span>
        <a onclick="listr.links.clear('listing');" class="waves-effect waves-light btn-large darken-2 modal-close"><i class="mdi-content-clear left"></i>Remove Listings</a>
        <a onclick="listr.links.clear();" class="waves-effect waves-light btn-large darken-2 modal-close"><i class="mdi-content-clear left"></i>Remove All Links</a>
      </div>
    </div>
    <div class="row">
      <div class="modal-footer col s12">
        <a class="waves-effect waves-blue btn-flat modal-close"><b>Close</b></a>
      </div>
    </div>
  </div>

  <div id="share" class="modal">
    <div class="modal-content">
        <div class="row">
          <div class="col s9 offset-s1"><h5 class="right">Direct URL</h5></div><div class="col s2"></div>
          <div class="col s9 offset-s1 input-field"><input id="share-url" type="text"></div><div class="col s2"> </div>
        </div>
        
        <div class="row">
          <div class="col s9 offset-s1"><h5 class="right">Embed</h5></div><div class="col s2"></div>
          <div class="col s9 offset-s1 input-field"><input id="share-embed" type="text"></div><div class="col s2"> </div>
          <?php if ($bucket == 'media' || $bucket == 'vids' || $bucket == 'music'): ?>
            <div class="col s6 offset-s4"><input id="share-all" type="checkbox"><label for="share-all" style="margin-left:24px;">Include all media?</label></div><div class="col s2"> </div>
            <div class="col s6 offset-s3" style="font-size:80%;">By default, the embedded player omits any tracks that don't automatically stream.  (E.g. bandcamp, veoh, <i>etc</i>.)  Check to include links to these sources.</div><div class="col s3"> </div>
          <?php endif; ?>
        </div>

        <div class="row">
          <div class="modal-footer col s12">
            <a class="waves-effect waves-blue btn-flat modal-action modal-close"><b>Close</b></a>
          </div>
        </div>
    </div>
  </div>

  <div id="reddit-search" class="modal">
    <div class="modal-content">
      <form id="reddit-search-form">
        <input type="hidden" id="reddit-search-url" value="">
        <div class="row">
          <div class="col s12">
            <label>Load links by..</label>
            <select id="reddit-search-sort">
              <option value="relevance" selected>relevance to search</option>
              <option value="hot" selected>score and newness (hot)</option>
              <option value="new">newness</option>
              <option value="top-week">top links this week</option>
              <option value="top-month">top links this month</option>
              <option value="top-year">top links this year</option>
            </select>          
          </div>
        </div>
        <div class="row">
          <div class="input-field col s10">
            <input id="reddit-search-query" type="text">
            <label for="reddit-search-query">Search for..</label>
          </div>
          <div class="input-field col s2">
            <a class="reddit-search-go btn-floating btn-large waves-effect waves-light green darken-2"><i class="mdi-action-search"></i></a>
          </div>
        </div>
        </div>
      </form>
    </div>
  </div>
  
  <div id="reddit-flair" class="modal">
    <div class="modal-content">
      <form id="reddit-flair-form">
        <input type="hidden" id="reddit-flair-url" value="">
        <div class="row">
          <div class="col s12">
            <label>Load links by</label>
            <select id="reddit-flair-sort">
              <option value="hot" selected>score and newness (hot)</option>
              <option value="new">newness</option>
              <option value="top-week">top links this week</option>
              <option value="top-month">top links this month</option>
              <option value="top-year">top links this year</option>
            </select>          
          </div>
        </div>

        <div class="row">
          <div class="col s12 reddit-flair-select"> </div> <!-- populated w/ <select> by feeds.js -->
        </div>
        <div class="row">
          <div class="modal-footer col s12">
            <a class="reddit-flair-load waves-effect waves-blue btn-flat modal-action modal-close"><b>Load</b></a>
          </div>
        </div>
      </div>
    </form>
  </div>

  <div id="plAdd" class="modal">
    <div class="modal-content">
      <form id="plAddForm" method="post" action="#">

      <div class="row" style="overflow:hidden;">
        <div class="col s9 offset-s1 plAdd-pl">
          <select id="plAdd-pl" class="playlists"><option selected disabled value="|nil">Select Playlist</option><?=$playlistOpts ?><option value="|addNewPL">..or create a new playlist.</option></select>
        </div>

        <div class="col s9 offset-s1 input-field plAdd-pl-new hidden"><input id="plAdd-pl-new" type="text"><label for="plAdd-pl-new">New playlist label</label></div><div class="col s2"> </div>
        <div class="col s9 offset-s1 input-field plAdd-pl-new hidden"><input id="plAdd-descrip" type="text"><label for="plAdd-descrip">Playlist description (optional)</label></div><div class="col s2"></div>
      </div>

      <div class="row">
        <div class="modal-footer">
          <a class="modal-close waves-effect waves-light btn red darken-2"><i class="mdi-av-not-interested left"></i>Cancel</a>
          <a class="append waves-effect waves-light btn blue darken-2 tooltipped" data-position="bottom" data-tooltip="Add all links to the end of this playlist."><i class="mdi-navigation-check left"></i>Add to Playlist</a>
          <a class="save waves-effect waves-light btn green darken-2 tooltipped" data-position="bottom" data-tooltip="Create new or replace existing playlist with all links."><i class="mdi-av-my-library-add left"></i>Save & Replace</a>
        </div>
      </div>

      </form>
    </div>
  </div>

  <div id="plAppend" class="modal">
    <div class="modal-content">
      <form id="plAppendForm" method="post" action="#">
      <input type="hidden" id="plAppend-perma" value="">

      <div class="row" style="overflow:hidden;">
        <div class="col s9 offset-s1 input-field"><h5 class="right">pick playlist</h5></div>

        <div class="col s9 offset-s1 plAppend-pl">
          <select id="plAppend-pl" class="playlists"><option selected disabled value="|nil">Select Playlist</option><?=$playlistOpts ?><option value="|addNewPL">..or create a new playlist.</option></select>
        </div>

        <div class="col s9 offset-s1 input-field plAppend-pl-new hidden"><input id="plAppend-pl-new" type="text"><label for="plAppend-pl-new">New playlist label</label></div><div class="col s2"> </div>
        <div class="col s9 offset-s1 input-field plAppend-pl-new hidden"><input id="plAppend-descrip" type="text"><label for="plAppend-descrip">Playlist description (optional)</label></div><div class="col s2"></div>

        <div class="col s9 offset-s1 input-field"><h5 class="right">add link</h5></div>
        <div class="col s9 offset-s1 input-field"><input id="plAppend-title" type="text"><label for="plAppend-title">Title</label></div><div class="col s2"> </div>
        <div class="col s9 offset-s1 input-field"><input id="plAppend-url" type="text"><label for="plAppend-url">URL</label></div><div class="col s2"> </div>

        <div class="col s7 offset-s1 input-field"><input id="plAppend-thumb" type="text"><label for="plAppend-thumb">Thumbnail</label></div>
        <div class="col s2 input-field"><img id="plAppend-thumb-img" src="/img/little_r.png"></div>
        <div class="col s2"> </div>
      </div>
      <div class="row">
        <div class="modal-footer">
          <a class="modal-close waves-effect waves-light btn red darken-2"><i class="mdi-av-not-interested left"></i>Cancel</a>
          <a class="create hidden save waves-effect waves-light btn green darken-2"><i class="mdi-av-my-library-add left"></i>Create Playlist</a>
          <a class="append hidden save waves-effect waves-light btn green darken-2"><i class="mdi-av-my-library-add left"></i>Add to Playlist</a>
        </div>
      </div>
      </form>
    </div>
  </div>

  <div id="addLike" class="modal">
    <div class="modal-content">
      <div class="row">
        <div class="col s12">
          <h4>Add to Liked</h4>
        </div>
      </div>

      <form id="addLikeForm" method="post" action="#">
      <div class="row" style="overflow:hidden;">
        <div class="col s9 offset-s1 addlike-cat">
          <select id="addlike-cat" class="cats"><option selected disabled value="|nil">Select Category</option><?=$userCats ?><?=$stickyCats ?><option value="|addNewCat">..or add a new category.</option></select>
        </div>

        <div class="col s9 offset-s1 input-field addlike-cat-new hidden"><input id="addlike-cat-new" type="text"><label for="addlike-cat-new">New category</label></div><div class="col s2"> </div>
        <div class="col s9 offset-s1 input-field"><input id="addlike-title" type="text"><label for="addlike-title">Title</label></div><div class="col s2"> </div>
        <div class="col s9 offset-s1 input-field"><input id="addlike-descrip" type="text"><label for="addlike-descrip">Description (optional)</label></div><div class="col s2"> </div>
        <div class="col s9 offset-s1 input-field"><input id="addlike-url" type="text"><label for="addlike-url">URL</label></div><div class="col s2"> </div>

        <div class="col s7 offset-s1 input-field"><input id="addlike-thumb" type="text"><label for="addlike-thumb">Thumbnail</label></div>
        <div class="col s2 input-field"><img id="addlike-thumb-img" src="/img/little_r.png"></div>
        <div class="col s2"> </div>
      </div>
      <div class="row">
        <div class="modal-footer">
          <a class="modal-close waves-effect waves-light btn red darken-2"><i class="mdi-av-not-interested left"></i>Cancel</a>
          <a class="hide-on-load upvote permalink waves-effect waves-light btn blue darken-2"><i class="mdi-navigation-check left"></i>Only Upvote</a>
          <a class="hide-on-load save permalink waves-effect waves-light btn green darken-2"><i class="mdi-av-my-library-add left"></i>Add & Upvote</a>
          <a class="hide-on-load save nopermalink waves-effect waves-light btn green darken-2"><i class="mdi-av-my-library-add left"></i>Add to Liked</a>
        </div>
      </div>
      </form>
    </div>
  </div>

  <div id="addFeed" class="modal">
    <div class="modal-content">
      <form id="addFeedForm" method="post" action="#">
      <input id="addfeed-source" type="hidden" value="">

      <div class="step1">
        <div class="row">
          <div class="col s12">
            <h4>Add Feed</h4>
            <h5>Step 1 of 3 — Select Source</h5>
          </div>
        </div>

        <div class="row hidden firsttimer">
          <div class="col s12 m10 offset-m1 white" style="border:black 1px solid;border-radius:4px;">
            <p>Looks like this is the first time you're adding feeds!  Feeds are the different lists of links that radd.it can load, the most common being subreddits.</p>
            <div class="hidden music"><p>If you're using radd.it's Chrome extension, you'll need to add feeds here on the site and then reload the player.  All feeds, likes, and playlists are shared between the site and the plugin.</p></div>
            <p>&nbsp;</p>
          </div>
        </div>

        <div class="row">
          <div class="col s12 m3 l1 hidden pics eyecandy ladycandy">&nbsp;</div> <!-- filler for non-youtube buckets -->
          <div class="col hide-on-med-and-down hidden pics eyecandy ladycandy" style="margin-right:1%;">&nbsp;</div>

          <div class="col s12 m6 l3">
            <div class="card addfeed-reddit">
              <div class="card-image">
                <img src="https://i.imgur.com/hf1wtzN.png">
              </div>
              <div class="card-content">
                <span class="card-title grey-text text-darken-4">reddit</span>
                <p>Add a subreddit or multireddit to your feeds.</p>
              </div>
            </div>
          </div>

          <div class="col s12 m6 l3 hidden music vids nsfw gaynsfw">
            <div class="card addfeed-youtube">
              <div class="card-image">
                <img src="/img/youtube.png">
              </div>
              <div class="card-content">
                <span class="card-title grey-text text-darken-4">Youtube</span>
                <p>Add a Youtube playlist or channel to your feeds.</p>
              </div>
            </div>
          </div>

          <div class="col s12 m6 l3">
            <div class="card addfeed-defaults">
              <div class="card-image">
                <img src=<?php if ($bucket == "ladycandy") echo '"/img/eyecandy.jpg"'; else if ($bucket == "gaynsfw") echo '"/img/nsfw.jpg"'; else if ($bucket == "media") echo '"/img/little_r.png"'; else echo '"/img/' . $bucket . '.jpg"'; ?>>
              </div>
              <div class="card-content">
                <span class="card-title grey-text text-darken-4">Defaults</span>
                <p>Add all feeds in a category from the default feeds.</p>
              </div>
            </div>
          </div>

          <div class="col s12 m6 l3">
            <div class="card addfeed-direct">
              <div class="card-image">
                <img src="/img/little_r.png">
              </div>
              <div class="card-content">
                <span class="card-title grey-text text-darken-4">Direct URL</span>
                <p>Add any valid radd.it or reddit.com URL to your feeds.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col s12 m8 offset-m2 hidden music white">
            <p>You are currently in <b>music</b> which is for streaming music and music videos.  To add non-music content, please switch to another category below.</p>
            <div class="center">
              <p><a href="/vids"><b>vids</b></a> -- non-music, safe-for-work streaming video</p>
              <p><a href="/pics"><b>pics</b></a> -- safe for work pics of places or things</p>
              <p><a href="/eyecandy"><b>eyecandy</b></a> -- safe-for-work pics of attractive women</p>
              <p><a href="/ladycandy"><b>ladycandy</b></a> -- safe-for-work pics of attractive men</p>
              <p><a href="/nsfw"><b>nsfw</b></a> -- not safe for work content</p>
              <p><a href="/gaynsfw"><b>gay nsfw</b></a> -- NSFW man-on-man content</p>
              <p>&nbsp;</p>
            </div>
          </div>
          <div class="col s12 m8 offset-m2 hidden vids white">
            <p>You are currently in <b>videos</b> which is for streaming videos (that are not music).  To add non-video content, please switch to another category below.</p>
            <div class="center">
              <p><a href="/music"><b>music</b></a> -- streaming music and music videos</p>
              <p><a href="/pics"><b>pics</b></a> -- safe for work pics of places or things</p>
              <p><a href="/eyecandy"><b>eyecandy</b></a> -- safe-for-work pics of attractive women</p>
              <p><a href="/ladycandy"><b>ladycandy</b></a> -- safe-for-work pics of attractive men</p>
              <p><a href="/nsfw"><b>nsfw</b></a> -- not safe for work content</p>
              <p><a href="/gaynsfw"><b>gay nsfw</b></a> -- NSFW man-on-man content</p>
              <p>&nbsp;</p>
            </div>
          </div>
          <div class="col s12 m8 offset-m2 hidden pics white">
            <p>You are currently in <b>pics</b> which is for safe for work pics of places and things.  To add other content, please switch to another category below.</p>
            <div class="center">
              <p><a href="/music"><b>music</b></a> -- streaming music and music videos</p>
              <p><a href="/vids"><b>vids</b></a> -- non-music, safe-for-work streaming video</p>
              <p><a href="/eyecandy"><b>eyecandy</b></a> -- safe-for-work pics of attractive women</p>
              <p><a href="/ladycandy"><b>ladycandy</b></a> -- safe-for-work pics of attractive men</p>
              <p><a href="/nsfw"><b>nsfw</b></a> -- not safe for work content</p>
              <p><a href="/gaynsfw"><b>gay nsfw</b></a> -- NSFW man-on-man content</p>
              <p>&nbsp;</p>
            </div>
          </div>
          <div class="col s12 m8 offset-m2 hidden eyecandy white">
            <p>You are currently in <b>eyecandy</b> which is for <b>safe for work pics of women</b>.  To add other content, please switch to another category below.</p>
            <div class="center">
              <p><a href="/music"><b>music</b></a> -- streaming music and music videos</p>
              <p><a href="/vids"><b>vids</b></a> -- non-music, safe-for-work streaming video</p>
              <p><a href="/pics"><b>pics</b></a> -- safe for work pics of places or things</p>
              <p><a href="/ladycandy"><b>ladycandy</b></a> -- safe-for-work pics of attractive men</p>
              <p><a href="/nsfw"><b>nsfw</b></a> -- not safe for work content</p>
              <p><a href="/gaynsfw"><b>gay nsfw</b></a> -- NSFW man-on-man content</p>
              <p>&nbsp;</p>
            </div>
          </div>
          <div class="col s12 m8 offset-m2 hidden ladycandy white">
            <p>You are currently in <b>ladycandy</b> which is for <b>safe for work pics of men</b>.  To add other content, please switch to another category below.</p>
            <div class="center">
              <p><a href="/music"><b>music</b></a> -- streaming music and music videos</p>
              <p><a href="/vids"><b>vids</b></a> -- non-music, safe-for-work streaming video</p>
              <p><a href="/pics"><b>pics</b></a> -- safe for work pics of places or things</p>
              <p><a href="/eyecandy"><b>eyecandy</b></a> -- safe-for-work pics of attractive women</p>
              <p><a href="/nsfw"><b>nsfw</b></a> -- not safe for work content</p>
              <p><a href="/gaynsfw"><b>gay nsfw</b></a> -- NSFW man-on-man content</p>
              <p>&nbsp;</p>
            </div>
          </div>
          <div class="col s12 m8 offset-m2 hidden nsfw white">
            <p>You are currently in <b>nsfw</b> which is for <b>NSFW (porn) content</b>.  To add other content, please switch to another category below.</p>
            <div class="center">
              <p><a href="/music"><b>music</b></a> -- streaming music and music videos</p>
              <p><a href="/vids"><b>vids</b></a> -- non-music, safe-for-work streaming video</p>
              <p><a href="/pics"><b>pics</b></a> -- safe for work pics of places or things</p>
              <p><a href="/eyecandy"><b>eyecandy</b></a> -- safe-for-work pics of attractive women</p>
              <p><a href="/ladycandy"><b>ladycandy</b></a> -- safe-for-work pics of attractive men</p>
              <p><a href="/gaynsfw"><b>gay nsfw</b></a> -- NSFW man-on-man content</p>
              <p>&nbsp;</p>
            </div>
          </div>
          <div class="col s12 m8 offset-m2 hidden gaynsfw white">
            <p>You are currently in <b>gay nsfw</b> which is for <b>gay NSFW (porn) content</b>.  To add other content, please switch to another category below.</p>
            <div class="center">
              <p><a href="/music"><b>music</b></a> -- streaming music and music videos</p>
              <p><a href="/vids"><b>vids</b></a> -- non-music, safe-for-work streaming video</p>
              <p><a href="/pics"><b>pics</b></a> -- safe for work pics of places or things</p>
              <p><a href="/eyecandy"><b>eyecandy</b></a> -- safe-for-work pics of attractive women</p>
              <p><a href="/ladycandy"><b>ladycandy</b></a> -- safe-for-work pics of attractive men</p>
              <p><a href="/nsfw"><b>nsfw</b></a> -- not safe for work content of breeders</p>
              <p>&nbsp;</p>
            </div>
          </div>


        </div>

        <div class="modal-footer">
          <a class="waves-effect waves-blue btn-flat modal-action modal-close"><b>Close</b></a>
        </div>
      </div> <!-- end: step1 -->

      <div class="hidden step2 addfeed-defaults">
        <div class="row">
          <div class="col s12">
            <h4>Add Feed</h4>
            <h5>Step 2 of 3 — Pick Category</h5>
          </div>
        </div>
        <div class="row">
          <div class="addfeed-defaults-cat col s10 offset-s1">
            <select id="addfeed-defaults-cat"><option value="|nil">Select category to import</option><?=$defaultCats ?></select>
          </div>

          <div class="col s1">&nbsp;</div>

          <div class="col s10 offset-s1">
            <p>All default feeds in the selected category will be added to your feeds.  (Unwanted feeds may be deleted afterward.)</p>
          </div>
          <div class="col s1">&nbsp;</div>
        </div>

        <div class="modal-footer">
          <a class="addFeed waves-effect waves-light btn red darken-2"><i class="mdi-hardware-keyboard-arrow-left left"></i>Go back</a>
          <a class="step3 addfeed-defaults waves-effect waves-light btn green darken-2"><i class="mdi-hardware-keyboard-arrow-right right"></i>Next step</a>
        </div>
      </div>


      <div class="hidden step2 addfeed-reddit">
        <div class="row">
          <div class="col s12">
            <h4>Add Feed</h4>
            <h5>Step 2 of 3 — Pick a Sub or Multi</h5>
          </div>
        </div>
        <div class="row">
          <div class="addfeed-reddit-url col s10 offset-s1">
            <select id="addfeed-reddit-url">
              <option value="|nil">Select subreddit or multi</option>
<?php
  $headersShown = array();

  while ($sub = $userSubs->fetch_row()) {
    // id_user_sub, source, is_multi, name, url, label
    $idx = intval($sub[0]);
    $source = $sub[1];
    $is_multi = ($sub[2] == 0 ? false : true);
    $name = $sub[3];

    $s_url = $sub[4];

    if (in_array($s_url, $urlsShown, true)) continue;
    $urlsShown[] = $s_url;

    $label = $sub[5];

    if ($is_multi && !in_array("multis", $headersShown)) { echo '<option disabled>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;multireddits</option>'; $headersShown[] = "multis"; }
    else if (!$is_multi) {
      if ($idx > 0 && !in_array("subs", $headersShown)) {echo '<option disabled>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;subreddits</option>'; $headersShown[] = "subs"; }
      else if ($idx == 0 && !in_array("upvotes", $headersShown)) {echo '<option disabled>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;upvoted subs</option>'; $headersShown[] = "upvotes"; }
    }

    echo "<option value='" . $s_url . "'>". $label . " (" . $s_url . ")</option>";
  }
?>
            </select>
          </div>

          <div class="col s1">&nbsp;</div>

          <div class="col s10 offset-s1">
            <p>Only subreddits you are subscribed to or have upvoted in are included.  To add a subreddit or multi not listed here, use <a onclick="$('div.step2.addfeed-reddit').hide();$('div.card.addfeed-direct').click();"><i>Direct URL</i></a> instead.</p>
          </div>
          <div class="col s1">&nbsp;</div>
        </div>

        <div class="modal-footer">
          <a class="addFeed waves-effect waves-light btn red darken-2"><i class="mdi-hardware-keyboard-arrow-left left"></i>Go back</a>
          <a class="step3 addfeed-reddit waves-effect waves-light btn green darken-2"><i class="mdi-hardware-keyboard-arrow-right right"></i>Next step</a>
        </div>
      </div>

      <div class="hidden step2 addfeed-youtube">
        <div class="row">
          <div class="col s12">
            <h4>Add Feed</h4>
            <h5>Step 2 of 3 — Find Playlist or Channel</h5>
          </div>
        </div>

        <div class="row">
          <div class="col s10 offset-s1 z-depth-2 white">
            <p>When added to feeds, playlists always load the latest version from Youtube.  Channels always load the vids most recently uploaded.  This is useful for playlists or channels that are updated often.</p>
            <p>To load a playlist just once, you can add it to your links.  To add all vids in a playlist individually, use the <b><i>Youtube Playlist</i></b> feed under <b>Special</b>.</p>
            <p>If you know the URL of the playlist, channel, or user you want to add, use <a onclick="$('div.step2.addfeed-youtube').hide();$('div.card.addfeed-direct').click();"><i>Direct URL</i></a> instead.</p>
            <p>&nbsp;</p>
          </div>
          <div class="col s1">&nbsp;</div>
        </div>

        <div class="row">
          <div class="col s9 offset-s1 input-field">
            <input id="addfeed-youtube-playlist-query" type="text"><label for="addfeed-youtube-playlist-query">Search for playlist</label>
          </div>

          <div class="input-field col s2">
            <a class="addfeed-youtube-playlist-go btn-floating btn-large waves-effect waves-light blue"><i class="mdi-action-search"></i></a>
          </div>
        </div>

        <div class="row">
          <div class="col s9 offset-s1 input-field">
            <input id="addfeed-youtube-channel-query" type="text"><label for="addfeed-youtube-channel-query">Search for channel</label>
          </div>

          <div class="input-field col s2">
            <a class="addfeed-youtube-channel-go btn-floating btn-large waves-effect waves-light blue"><i class="mdi-action-search"></i></a>
          </div>
        </div>

        <div class="row addfeed-youtube-results hidden">
          <div class="results col s10 offset-s1">
          </div>
          <div class="col s1">&nbsp;</div>
        </div>

        <div class="modal-footer">
          <a class="addFeed waves-effect waves-light btn red darken-2"><i class="mdi-hardware-keyboard-arrow-left left"></i>Go back</a>
        </div>
      </div>

      <div class="hidden step2 addfeed-direct">
        <div class="row">
          <div class="col s12">
            <h4>Add Feed</h4>
            <h5>Step 2 of 3 — Enter a URL</h5>
          </div>
        </div>
        <div class="row">
          <div class="col s12">
            <div class="input-field col s10 offset-s1">
              <input id="addfeed-direct-url" type="text">
              <label for="addfeed-direct-url">URL to add:</label>
            </div>
            <div class="col s10 offset-s1">
              <p>You can use any radd.it or reddit.com URL.  This includes subreddits, multireddits, search results, wikipages, or individual posts.  Any partial URLs are assumed to be reddit URLs.  Multireddits <b>must be public and use <a href="http://www.reddit.com/user/evilnight/m/truemusic" target="_blank" title="links to example">the full URL</a></b>, <i>not</i> the /me/ URL.</b></p>
              <p>You can also use any Youtube URL to add playlists, channels, or users.  Playlists always load the latest version while channels and users load the uploaded vids with the most recent vids first.  This is <b>not for adding single videos</b>, use the add button under the links instead.  (If no links are loaded, use the "Empty playlist" option under <i>Special</i> feeds.)</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <a class="addFeed waves-effect waves-light btn red darken-2"><i class="mdi-hardware-keyboard-arrow-left left"></i>Go back</a>
          <a class="step3 addfeed-direct waves-effect waves-light btn green darken-2"><i class="mdi-hardware-keyboard-arrow-right right"></i>Next step</a>
        </div>
      </div>
      <!-- end: step2 -->

      <div class="hidden step3">
        <div class="row">
          <div class="col s12">
            <h4>Add Feed</h4>
            <h5>Step 3 of 3 — Pick Category</h5>
          </div>
        </div>
        <div class="row">
          <div class="addfeed-cat col s10 offset-s1 select-field">
            <label>Pick a Category</label>
            <select id="addfeed-cat" class="cats"><option selected disabled value="|nil">Select Category</option><?=$userCats ?><?=$stickyCats ?><option value="|addNewCat">..or add a new category.</option></select>
          </div>
          <div class="col s1"></div>
          
          <div class="addfeed-cat-new hidden col s10 offset-s1 input-field">
            <input id="addfeed-cat-new" type="text">
            <label for="addfeed-cat-new">New category name</label>
          </div>
          <div class="col s1"></div>

          <div class="col s10 offset-s1 input-field">
            <input id="addfeed-label" type="text">
            <label for="addfeed-label">Label</label>
          </div>
          <div class="col s1"></div>

          <div class="col s10 offset-s1 input-field">
            <input id="addfeed-url" type="text">
            <label for="addfeed-url">URL</label>
          </div>
          <div class="col s1"></div>

          <div class="col s10 offset-s1 input-field">
            <input id="addfeed-descrip" type="text">
            <label for="addfeed-descrip">Description (optional)</label>
          </div>
          <div class="col s1"></div>

<?php if ($username == "radd_it"): ?>
          <div class="col s10 offset-s1 center">
            <input id="addfeed-is-default" type="checkbox">
            <label for="addfeed-is-default">Make a default?</label>
          </div>
          <div class="col s1"></div>
<?php endif; ?>
        </div>

        <div class="modal-footer">
          <a class="modal-close media waves-effect waves-light btn red darken-2"><i class="mdi-navigation-refresh left"></i>Cancel</a>
          <a class="save close media waves-effect waves-light btn green darken-2"><i class="mdi-navigation-refresh left"></i>Save & Close</a>

          <a class="addFeed feeds waves-effect waves-light btn red darken-2"><i class="mdi-av-not-interested left"></i>Cancel</a>
          <a class="save reload feeds waves-effect waves-light btn green darken-2"><i class="mdi-navigation-refresh left"></i>Save & Reload</a>
          <a class="save another feeds waves-effect waves-light btn blue darken-2"><i class="mdi-av-my-library-add left"></i>Save & Add Another</a>
        </div>
      </div>

      </form>
    </div>
  </div>

  <div id="linksAdd" class="modal">
    <div class="modal-content">
      <h4>Add Links</h4>
      <p>
        <div class="row">
          <form class="col s12">
            <div class="row">
              <div class="input-field col s10">
                <input id="linksAddQry" type="text">
                <label for="linksAddQry">Search</label>
              </div>
              <div class="input-field col s2">
                <a class="btn-floating btn-large waves-effect waves-light green linksSearch"><i class="mdi-action-search"></i></a>
              </div>
            </div>
          </form>
        </div>
        <div class="row results hidden" style='max-height:66%;overflow-y:auto'>
          <div class="col s12 header"><ul class="tabs"></ul></div>
          <div class="col s12 content"></div>
        </div>
      </p>
    </div>
    <div class="modal-footer">
      <a class="waves-effect waves-blue btn-flat modal-action modal-close">Close</a>
    </div>
  </div>

  <div id="hoverCard" class="card z-depth-3 hidden">
    <div class="card-image"><img src="/img/little_r.png"></div>
    <div class="card-content"></div>
  </div>

  <div id="naviUp" class="hidden"><a class="navi z-depth-1 btn-floating btn-large indigo darken-2"><i class="mdi-navigation-arrow-drop-up"></i></a></div>
  <div id="naviDown" class="hidden">
    <span class="btns">
      <a class="prev btn-floating tooltipped grey z-depth-light" data-position="top" data-tooltip="click twice for first link"><i class="mdi-av-skip-previous"></i></a>

      <!-- play/ pause -->
      <a class="pause hide-on-load btn-large btn-floating tooltipped grey darken-2 z-depth-light" data-position="top" data-tooltip="pause"><i class="mdi-av-pause"></i></a>
      <a class="resume hide-on-load btn-large btn-floating tooltipped grey darken-2 z-depth-light" data-position="top" data-tooltip="resume"><i class="mdi-av-play-arrow"></i></a>

      <a class="next keep-color btn-floating tooltipped grey z-depth-light" data-position="top" data-tooltip="click twice to autoskip"><i class="mdi-av-skip-next"></i></a>
    </span>

    <a class="navi z-depth-1 btn-floating btn-large indigo darken-2"><i class="mdi-navigation-arrow-drop-down"></i></a>
  </div>

  <div id="loading" class="hidden">
    <div class="preloader-wrapper big active">
      <div class="spinner-layer spinner-blue"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div>
      <div class="spinner-layer spinner-red"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div>
      <div class="spinner-layer spinner-yellow"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div>
      <div class="spinner-layer spinner-green"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div>
    </div>
  </div>

  <script type="text/javascript" src="/js/materialize.js"></script>
  <script type="text/javascript" src="/js/jquery.elevateZoom-3.0.8.min.js"></script>

  <script src="/js/helpers.js"></script>

  <script>
    listr = {};               // One object to rule them all and in the darkness bind them.

    listr.opts = {};
    // User-settable.  All options correspond to an element in options <div>
    listr.opts['showMedia'] = true;     // media isn't displayed when set to false
    listr.opts['showVisuals'] = false;  // replaces media with javascript visuals when true

    // set by embed option below
    // listr.opts['showGrid'] = false;     // Use cards instead of <table> for links.
    listr.opts['clearOnLoad'] = true;   // If TRUE, clears all links when a new feed is loaded.
    listr.opts['showLinkOpts'] = true;  // Internal only.  Show nix/ add/ save options beneath links?
    listr.opts['showOptions'] = true;   // Show options (& hotkeys) at bottom of page?
    listr.opts['allowNoStream'] = true; // only allow sites that automatically stream/ skip to next?
    listr.opts['allowAds'] = true;      // allow sites that include ads w/ the media?
    listr.opts['autoSkip'] = true;      // skip to the next link when we get a 'finish' event?
    listr.opts['allowZoom'] = true;     // Use zoom on mouse hover for images?
    listr.opts['allowNSFW'] = true;     // allow links marked NSFW?
    listr.opts['replaceYoutube'] = true;  // If TRUE, will attempt to replace any removed/ dead youtube vids.
    listr.opts['onlySearchFeeds'] = true; // If TRUE, reddit search only uses what's loaded in feeds[].  Otherwise, searches all reddit.
    // listr.opts['showSongkick'] = false;   // If TRUE, show songkick.com button under media (if artist is on tour)
    listr.opts['showOffliberty'] = false; // If TRUE, show offliberty.com button under media.
    listr.opts['showQuick'] = true;     // Open menu on start?

  <?php
    echo 'listr.bucket = "' . $bucket . '";';

    // Is a user logged-in?  If so, who?
    if (!$loggedIn) echo 'listr.user = false;';
    else echo 'listr.user = "' . $username . '";';

    // Is player embedded?
    if ($embedded) echo "listr.opts['embedded'] = true;listr.opts['showGrid'] = true;";
    else echo "listr.opts['embedded'] = false;listr.opts['showGrid'] = false;";

    // Do we shuffle?  If TRUE, shuffles order of all links when a new feed is loaded.
    if (isset($_GET["shuffle"])) echo "listr.opts['shuffleOnLoad'] = true;";
    else echo "listr.opts['shuffleOnLoad'] = false;";

    // Do we random?  If so, get random posts from subreddit instead of hot/ new/ etc..
    if (isset($_GET["random"])) echo "listr.opts['randomLoad'] = true;";
    else echo "listr.opts['randomLoad'] = false;";

    // Do we links in self posts?  Only used with postview.
    if (isset($_GET["selftext"]) && ($_GET["selftext"] == "0" || $_GET["selftext"] == "no" || $_GET["selftext"] == "false"))
      echo "listr.opts['allowSelftext'] = false;";
    else echo "listr.opts['allowSelftext'] = true;";

    // Automatically add all found (related) links to playlist?
    if (substr_count($listrURL, "/comments/") == 0) echo "listr.opts['pushRelated'] = false;";
    else echo "listr.opts['pushRelated'] = true;";

    if ($bucket == "ladycandy") echo 'listr.thumb = "/img/eyecandy.jpg";';
    else if ($bucket == "gaynsfw") echo 'listr.thumb = "/img/nsfw.jpg";';
    else if ($bucket == "media") echo 'listr.thumb = "/img/little_r.png";';
    else echo 'listr.thumb = "/img/' . $bucket . '.jpg";';

    // overwrite values w/ server settings
    foreach ($opts as $key => $value) echo "listr.opts['" . $key . "'] = " . ($value ? "true" : "false") . ";";
  ?>
  </script>
  <script src="/js/listr.js"></script>
  <script src="/js/navi.js"></script>
  <script src="/js/feeds.js"></script>
  <script src="/js/sources.js"></script>
  <script src="/js/links.js"></script>
  <script src="/js/listings.js"></script>
  <script src="/js/related.js"></script>
  <script src="/js/like.js"></script>
  <script src="/js/playlists.js"></script>

  <script>
    // cookie.js
    (function(a){if(typeof define==="function"&&define.amd){define(["jquery"],a)}else{a(jQuery)}}(function(f){var a=/\+/g;function d(i){return b.raw?i:encodeURIComponent(i)}function g(i){return b.raw?i:decodeURIComponent(i)}function h(i){return d(b.json?JSON.stringify(i):String(i))}function c(i){if(i.indexOf('"')===0){i=i.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,"\\")}try{i=decodeURIComponent(i.replace(a," "));return b.json?JSON.parse(i):i}catch(j){}}function e(j,i){var k=b.raw?j:c(j);return f.isFunction(i)?i(k):k}var b=f.cookie=function(q,p,v){if(p!==undefined&&!f.isFunction(p)){v=f.extend({},b.defaults,v);if(typeof v.expires==="number"){var r=v.expires,u=v.expires=new Date();u.setTime(+u+r*86400000)}return(document.cookie=[d(q),"=",h(p),v.expires?"; expires="+v.expires.toUTCString():"",v.path?"; path="+v.path:"",v.domain?"; domain="+v.domain:"",v.secure?"; secure":""].join(""))}var w=q?undefined:{};var s=document.cookie?document.cookie.split("; "):[];for(var o=0,m=s.length;o<m;o++){var n=s[o].split("=");var j=g(n.shift());var k=n.join("=");if(q&&q===j){w=e(k,p);break}if(!q&&(k=e(k))!==undefined){w[j]=k}}return w};b.defaults={};f.removeCookie=function(j,i){if(f.cookie(j)===undefined){return false}f.cookie(j,"",f.extend({},i,{expires:-1}));return !f.cookie(j)}}));

    $(document).ready(function() {
<?php
  $cnt = 0;

  if ($embedded && $loggedIn) {
    echo chr(10) . 
      'listr.feeds.list.push({'
        . '"source":"radd.it"'
        . ', "url":"/read/hotlinks"'
        . ', "label":"Suggested Links"'
        . ', "idx":-1'
        . ', "cat":"00|Mixed"'
      . '});';

    $cnt++;
    echo chr(10) . 
      'listr.feeds.list.push({'
        . '"source":"reddit"'
        . ', "url":"/r/' . $allSubs . '"'
        . ', "label":"Load all subreddits"'
        . ', "idx":0'
        . ', "cat":"00|Mixed"'
      . '});';
  }

  if ($foundFeeds) {
    $dupeFeeds = array();

    $suggestions->data_seek(0);
    while ($sug = $suggestions->fetch_row()) {
      // kind, source, label, descrip, url, permalink
      $s_kind = $sug[0];
      if ($s_kind != "feed" || $cnt > 10) continue;
      $s_source = $sug[1];
      $s_label = $sug[2];
      $s_descrip = $sug[3];
      $s_url = $sug[4];
      if (in_array(strtolower($s_url), $dupeFeeds)) continue;
      $dupeFeeds[] = strtolower($s_url);

      $s_permalink = $sug[5];

      echo chr(10) . 
        'listr.feeds.list.push({'
          . '"source":"' . $s_source . '"'
          . ', "url":"' . str_replace('"', '\\"', $s_url) . '"'
          . ', "label":"' . str_replace('"', '\\"', $s_label) . '"'
          . ', "idx":-1'
          . ', "cat":"Suggested"'
          // . ', "descrip":"' . str_replace('"', '\\"', str_replace(chr(10), '<br>', $l_descrip)) . '"'
        . '});';

        $cnt++;
    }
  }

  $feeds->data_seek(0);
  while ($l_feed = $feeds->fetch_row()) {
    // cat, source, hasOpts, url, label, descrip, is_sticky, is_default
    $l_cat_full = $l_feed[0];
    $l_cat = $l_cat_full;
    if (strpos($l_cat, "|") !== false) $l_cat = substr($l_cat, strpos($l_cat, "|") + 1);

    $l_source = $l_feed[1];
    $hasOpts = $l_feed[2];
    $l_url = $l_feed[3];

    $l_label = $l_feed[4];
    $l_descrip = str_replace(chr(10), "  ", $l_feed[5]);
    $sticky = ($l_feed[6] == 0 ? false : true);
    $default = ($l_feed[7] == 0 ? false : true);
    $userOnly = ($l_feed[8] == 0 ? false : true);

    $l_idx = $l_feed[9];

    if (!$loggedIn && $userOnly) continue;        // if not logged in, skip the user-only feeds
    else if ($loggedIn && $default) continue;   // if we are logged in, skip the default feeds

    echo chr(10) . 
      'listr.feeds.list.push({'
        . '"source":"' . $l_source . '"'
        . ', "url":"' . str_replace('"', '\\"', $l_url) . '"'
        . ', "label":"' . str_replace('"', '\\"', $l_label) . '"'
        . ', "idx":' . $l_idx
        . ', "cat":"' . str_replace('"', '\\"', $l_cat_full) . '"'
        // . ', "descrip":"' . str_replace('"', '\\"', str_replace(chr(10), '<br>', $l_descrip)) . '"'
      . '});';
  }


  if ($foundLinks) {
    $suggestions->data_seek(0);
    $cnt = 0;
    while ($sug = $suggestions->fetch_row()) {
        // kind, source, label, descrip, url, permalink, thumb
      $s_kind = $sug[0];
      if ($s_kind != "link" || $cnt > 98) continue;
      $s_source = $sug[1];
      $s_label = $sug[2];
      $s_descrip = $sug[3];
      $s_url = $sug[4];
      $s_permalink = $sug[5];
      $s_thumb = str_replace("http:", "https:", $sug[6]);
      $s_id = $sug[7];

      if ($s_thumb == "" || substr($s_thumb, 0, 4) != "http") {
        if ($bucket == "ladycandy") $s_thumb = "/img/eyecandy.jpg";
        else if ($bucket == "gaynsfw") $s_thumb = "/img/nsfw.jpg";
        else if ($bucket == "media") $s_thumb = "/img/little_r.png";
        else $s_thumb = "/img/" . $bucket . ".jpg";
      }

      echo 
        chr(10) . 'listr.like.list[' . ($cnt * -1) . '] = {'
          . '"idx":' . $s_id
          . ',"bucket":"' . str_replace('"', '\\"', $bucket) . '"'
          . ', "cat":"Suggested"'
          . ', "url":"' . str_replace('"', '\\"', $s_url) . '"'
          . ', "thumb":"' . str_replace('"', '\\"', $s_thumb) . '"'
          . ', "label":"' . str_replace(array(chr(10), chr(13)), '<br>', str_replace('"', '\\"', $s_label)) . '"'
          . ', "permalink":"' . str_replace('"', '\\"', $s_permalink) . '"'
        . '};'
      ;

      $cnt++;
    }
  }

  // else {
  if ($foundLinks || $userLikes->num_rows > 0) {
    if (!$embedded) echo "$('div.container.liked').show();listr.navi.update();";

    $userLikes->data_seek(0);
    while ($like = $userLikes->fetch_row()) {
      // cat, label, url, thumb, permalink
      $l_cat = $like[0];
      $l_label = $like[1];
      $l_url = $like[2];
      $l_thumb = $like[3];
      $l_perma = $like[4];
      $l_idx = $like[5];

      echo 
        chr(10) . 'listr.like.list[' . $l_idx . '] = {'
          . '"idx":' . $l_idx
          . ',"bucket":"' . str_replace('"', '\\"', $bucket) . '"'
          . ', "cat":"' . str_replace('"', '\\"', $l_cat) . '"'
          . ', "url":"' . str_replace('"', '\\"', $l_url) . '"'
          . ', "thumb":"' . str_replace('"', '\\"', $l_thumb) . '"'
          . ', "label":"' . str_replace(array(chr(10), chr(13)), '<br>', str_replace('"', '\\"', $l_label)) . '"'
          . ', "permalink":"' . str_replace('"', '\\"', $l_perma) . '"'
        . '};'
      ;
    }
  }

  foreach ($userPlaylists as $key => $pl)
    echo chr(10) . 'listr.playlists.list.push({'
        . '"url":"' . str_replace('"', '\\"', $pl["url"]) . '"'
        . ',"label":"' . str_replace('"', '\\"', $pl["label"]) . '"'
        . ',"descrip":"' . str_replace('"', '\\"', $pl["descrip"]) . '"'
    . '});';

  if (!$loggedIn) echo "setTimeout(function() { $('.hide-on-no-user').unbind('click').click(function(event) { event.preventDefault(); alert('You must be logged-in to use this feature.'); }); });";
  // if (!$loggedIn) echo "$('.hide-on-no-user').hide();";

  if (!$foundFeeds && $feeds->num_rows == 0) echo "$('div.container.feeds').hide();";

  if ($bucket == "media") echo "$('div.container.options div.section:eq(0),.hide-on-no-user,.hide-on-media-bucket').hide();";

  if ($listrURL !== "" && $feed !== "") echo 'listr.feeds["' . $feed . '"].load("' . $listrURL . '");';
  else if ($loggedIn && $userCats === "") echo "setTimeout(function() { $('div.feeds a.addFeed').click(); $('#addFeed div.firsttimer').show(); });";
?>
});
</script>
</body>
</html>
