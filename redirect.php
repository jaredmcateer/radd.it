<?php 
	if (substr_count($_SERVER['HTTP_HOST'], 'embed.') != 0 || isset($_GET["embed"])) header('X-Frame-Options: ALLOWALL'); 
	else header('X-Frame-Options: SAMEORIGIN');

	// if ($_SERVER['HTTPS'] == "on")
	// 	die('<script>window.location.href = "http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] . '";</script>');
	// else
	if (str_replace(array("devembed.", "embed.", "stage.", "dev."), "", $_SERVER['HTTP_HOST']) != "radd.it")
		die('<script>window.location.href = "//radd.it' . $_SERVER['REQUEST_URI'] . '";</script>');	// removed: https:

// echo "<-- " . $_SERVER['HTTPS'] . " / " . $_SERVER['HTTP_HOST'] . " / " . $_SERVER['REQUEST_URI'] . "-->" . chr(10);
	error_reporting(E_ERROR);
  	$vars = include "php/vars.php";

	$bucket = false;
	$feed = "";
	$opts = [];
	$only = false;

	if (
		!empty($_COOKIE["user"])
		&& $_COOKIE["userhash"] !== hash("haval192,3", $vars['hashPrefix'] . $_COOKIE["user"])
	) die('{"error": "Invalid user hash.  <a href=\'/logout\'>Log-out</a> and log-in again to get a new hash."}');

	$url = trim(str_replace("'", "", $_GET["u"]));
	if (substr($url, strlen($url) - 1) == "/") $url = substr($url, 0, strlen($url) - 1);	// remove trailing / 
	$url = str_replace(array("https:/", "http:/", "www.", "reddit.com/"), "", $url);

	$radditParams = array("shuffle", "random", "u", "nouser", "selftext", "debug", "allmedia", "embed", "hidden");
	foreach($_GET as $key => $value)
		if ($key == "only" || $key == "bucket" || $key == "b") $only = $value;
		else if (in_array($key, $radditParams) === false)
			$url .= (substr_count($url, "?") > 0 ? "&" : "?") . $key . "=" . $value;

	if ($only !== false) $bucket = $only;

	// $url = str_replace("?&", "?", $url);
	// if (substr($url, strlen($url) - 1) == "?") $url = substr($url, 0, strlen($url) - 1);	// remove trailing ? 

	// if ($only !== false) {
	// 	$qPos = strpos($url, '?');
	// 	if ($qPos === false) $url .= '/' . $only;
	// 	else $url = substr($url, 0, $qPos) . '/' . $only . substr($url, $qPos);
	// }

//echo "url: " . $url . $ret;

// home or error	
	if ($url == "" || substr($url, 0, 4) == "home" || substr($url, 0, 5) == "index" || (substr($url, 0, 2) == "40" && substr($url, -6) == ".shtml"))	// no request, show home page
	{
		include("index.php");
		die();
	}

	// $oldServer = array('me');						// list of top-level directorys that forwarded to the old radd.it server

	// top-level dirs for data gets/ updates/ etc.
	$phpFirsts = array("create", "read", "update", "delete", "api", "reports", "archivers");
	$openFirsts = array("api", "reports", "archivers");

// get first directory
	$slash = strpos($url, "/");
	if ($slash == false) $slash = strlen($url);
	$first = strtolower(substr($url, 0, $slash));

	$second = "";
	if (strcmp($first, $url) != 0) {
		$sSlash = strpos($url, "/", $slash + 1);
		if ($sSlash == false) $sSlash = strlen($url);
		$second = substr($url, $slash + 1, $sSlash - $slash);
	}

	if ($first === "u") // shortcut to /user/
	{
		$first = "user";
		$url = "user/" . substr($url, 2);
	}

	// Is this something only on the old server?  Send them there.
	// else if (in_array($first, $oldServer, true)) {
	// 	if (substr_count($_SERVER['HTTP_HOST'], 'embed.') !== 0) echo "<script>window.location.href='http://olembed.radd.it/" . $url . "';</script>";
	// 	else echo "<script>window.location.href='http://ol.radd.it/" . $url . "';</script>";
	// 	die();
	// }

	else if (in_array($first, $phpFirsts, true)) {		// URL from a radd.it form, include the appropriate file and stop.
		if (!in_array($first, $openFirsts, true)) {
			if (substr_count($_SERVER['HTTP_REFERER'], "radd.it/") === 0) die('{"error": "Invalid referrer."}');
			else if (empty($_COOKIE["user"])) die('{"error": "No user logged-in."}');
		}

		$qPos = strpos($second, "?");
		if ($qPos === false) $second .= ".php";
		else $second = substr($second, 0, $qPos) . ".php"; // . substr($second, $qPos);

		include "php/" . $first . "/" . $second;
		die();
	}

	if (in_array($first, $vars['buckets'], true)) {
		$bucket = $first;

		if ($second == "suggested") {
			$feed = "suggested";
		}
	}
	else if (
		substr_count($first, "search") == 0
		&& strlen($first) > 2
		&& ($first === $url || in_array($second, $vars["buckets"], true))
	) { // if URL isn't a bucket and doesn't have a 
		$feed = "reddit";
		$url = "by_id/t3_" . $first;
		// if ($second !== "") $url .= "/" . $second;	// Nope, this just copies the bucket.

		$first = "by_id";
		if (in_array($second, $vars["buckets"], true)) $bucket = $second;
	}

//////////// parse "only" filter from URL //////////////////////////////////////////////////////////////////
	else if (
		// substr_count($url, "/") > 1
		// && (
			$first == "by_id"
			|| $first == "r" 
			|| $first == "user" 
			|| $first == "domain"
			|| $first == "comments"
			|| substr_count($first, "search") > 0
			// || $first === "live"
			// || substr_count($first, "reddits") > 0
			// || $first === "o" 
			|| $first == "playlists"

			|| $first == "v"
		// ) 
	) {

		if ($first == "playlists") $feed = "playlist";
		else if ($first == "v") {
			$feed = "voat";

		}
		else {
			$feed = "reddit";
			$url = str_replace(" ", "+", $url);
		}

		$tagURL = $url;
		if (strpos($tagURL, '?') !== false) $tagURL = substr($tagURL, 0, strpos($tagURL, '?'));
		$tagLen = strlen($tagURL);

		if (strrpos($tagURL, '/music') === $tagLen - 6) $bucket = 'music';
		else if (strrpos($tagURL, "/radio") === $tagLen - 6) {
			$bucket = 'music';
			$opts['allowNoStream'] = false;
		}
		else if (
			strrpos($tagURL, "/vid") === $tagLen - 4 
			|| strrpos($tagURL, "/vids") === $tagLen - 5 
			|| strrpos($tagURL, "/video") === $tagLen - 6 
			|| strrpos($tagURL, "/videos") === $tagLen - 7
		) {
			$bucket = "vids";
		}
		else if (
			strrpos($tagURL, "/image") === $tagLen - 6 
			|| strrpos($tagURL, "/images") === $tagLen - 7 
			|| strrpos($tagURL, "/pics") === $tagLen - 5
		) {
			$bucket = 'pics';
		}
		else if (strrpos($tagURL, "/eyecandy") === $tagLen - 9)
			$bucket = 'eyecandy';
		else if (strrpos($tagURL, "/ladycandy") === $tagLen - 10)
			$bucket = 'ladycandy';
		else if (strrpos($tagURL, "/nsfw") === $tagLen - 5 || strrpos($tagURL, "/porn") === $tagLen - 5)
			$bucket = 'nsfw';
		else if (
			strrpos($tagURL, "/gaynsfw") === $tagLen - 8
			|| strrpos($tagURL, "/nsfwgay") === $tagLen - 8
		) $bucket = 'gaynsfw';
		else if (strrpos($tagURL, '/media') === $tagLen - 6) $bucket = 'media';

		if ($bucket !== false && $only === false) {
			$curOnlyPos = strrpos($url, "/");
			$curAmpPos  = strpos($url, "?", $curOnlyPos);
			if ($curAmpPos === false) $url = substr($url, 0, $curOnlyPos);			// strip /ONLY from URL
			else $url = substr($url, 0, $curOnlyPos) . substr($url, $curAmpPos);	// strip /ONLY from URL

			$curOnlyPos = stripos($url, "only=");
			if ($curOnlyPos !== false) {
				$curAmpPos = strpos($url, "&", $curOnlyPos);
				if ($curAmpPos === false) $curAmpPos = strlen($url);

				$url = substr($url, 0, $curOnlyPos) . substr($url, $curAmpPos);
			}

			if (strlen($url) < 3) $url .= "/" . $bucket;	// Makes r/music and v/music still work w/out a bucket.
		}

		if ($first === "playlists") {
			if ($bucket == false) $bucket = "media";

			$url = str_replace("playlists/", "playlists/js/", $url) . ".js";
			if (!file_exists('/var/www/' . $url)) die('Error: playlist not found!');
				// die('<script>window.location.href = "http://ol.radd.it/' . str_replace(array("js/", ".js"), "", $url) . '";</script>'); 
		}
	}
	else if ($first == "youtube" || substr_count($first, "youtube.com") > 0) {
		$first = "youtube";

		// if (substr_count($url, "list=") > 0 || substr_count($url, "user/") > 0 || substr_count($url, "channel/") > 0) {
			if ($bucket == false) $bucket = "media";
			$feed = "youtube-playlist";

			// Pointless.
			// if (substr_count($url, "list=") > 0) $url = "https://www.youtube.com/playlist?list=" . explode('list=', $url)[1];
		// }
	}

	if ($url == $bucket) $url = '';	// Clear the URL if only the bucket page is requested.
	else if (substr($url, 0, 1) != '/') $url = '/' . $url;

	// pluralization correction
	if ($bucket == 'videos' || $bucket == 'video' || $bucket == 'vid') $bucket = 'vids';
	else if ($bucket == 'musica' || $bucket == 'musics') $bucket = 'music';
	else if ($bucket == 'images' || $bucket == 'image' || $bucket == 'pic') $bucket = 'pics';

/////////////////////////// embed opts 	////////////////////////////////////////////
	if (substr_count($_SERVER['HTTP_HOST'], 'embed.') != 0 || isset($_GET["embed"])) {
		if (!isset($_GET["allmedia"]) && ($bucket == "media" || $bucket == "music" || $bucket == "vids")) $opts['allowNoStream'] = false;
		$opts['showLinkOpts'] = false;
		$opts['showOptions'] = false;
		$opts['showMedia'] = true;
		$opts['showQuick'] = false;
		$opts['showVisuals'] = false;
	}

	if (isset($_GET["hidden"])) $opts['hidden'] = true;
	else $opts['hidden'] = false;

	$opts['fullMedia'] = true;	// overwrite old value if in a cookie?

/////////////////////////// TRUMP CHECK	////////////////////////////////////////////
	// if (strlen(str_replace(array("the_donald", "donaldtrump", "donald_trump", "r/trump"), "", strtolower($url))) < strlen($url))
	// {
	// 	include "cancer.html";
	// 	die();
	// }
	// else
	// if (strlen(str_replace("stationalpha", "", strtolower($url))) < strlen($url)) {
	// 	include "hello_demons.htm";
	// 	die();
	// }

/////////////////////////// load 	///////////////////////////////////////////////
	if ($bucket == "" && $url != "") include "bucketPicker.php";
	else if ($bucket != "" || $feed != "") {
		$listrURL = $url;
		
		if (substr_count($_SERVER['HTTP_HOST'], 'dev.') !== 0 || substr_count($_SERVER['HTTP_HOST'], 'devembed.') !== 0)
			include "listr.dev.php";
		else if (substr_count($_SERVER['HTTP_HOST'], 'stage.') !== 0)
			include "listr.stage.php";
		// else if (substr_count($_SERVER['HTTP_HOST'], 'embed.') != 0 || isset($_GET["embed"])) 
		// 	include "embed.listr.php";
		else include "listr.php";
	}
	else
	{ 
		header($_SERVER["SERVER_PROTOCOL"] . " 404 Not Found", true, 404);
		echo "<h1 style='width:100%;text-align:center;'>FOUR OH FOUR</h1><p style='width:100%;text-align:center;'>How about <a href='/'>something from the homepage</a>?</p>";
	}

// echo "<!-- " . chr(10);
// echo "bucket: " . $bucket . chr(10);
// echo "feed: " . $feed . chr(10);
// echo "URL: " . $url . chr(10);
// echo "tagURL: " . $tagURL . chr(10);
// echo "opts: ";
// print_r($opts);
// // echo "first: " . $first . chr(10);
// echo  chr(10) . "-->";
?>