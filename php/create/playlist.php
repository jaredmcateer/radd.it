<?php
	chdir(dirname(__FILE__));
	$pathToPlaylists = "../../playlists/js/";

	$vars = include "../vars.php";

	$mysqli = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	$mysqli->set_charset("utf8");

/*
		var link = {
			'url' : $('#plappend-url')
			,'thumb' : $('#plappend-thumb-img').attr('src')
			,'label' : $('#plappend-title').val()
		};

		if ($('#plAppend-perma').val() != '') link.related = { 'permalink': $('#plAppend-perma').val() };
*/

	// Playlist data
	$user = $mysqli->real_escape_string($_COOKIE["user"]);
	if (empty($user))  die('{"error":"User not found."}');
	$bucket = $mysqli->real_escape_string($_POST["bucket"]);
	if (empty($bucket))  die('{"error":"Bucket not found."}');

	$label = $mysqli->real_escape_string($_POST["label"]);
	$descrip = $mysqli->real_escape_string($_POST["descrip"]);

	//// Link data
	$links = $_POST["links"];
	$cnt = count($links);

	// $title = $mysqli->real_escape_string($_POST["title"]);
	// $earl = $mysqli->real_escape_string($_POST["url"]);
	// $thumb = $mysqli->real_escape_string($_POST["thumb"]);
	// $perma = $mysqli->real_escape_string($_POST["permalink"]);
	// $related = false;
	// if ($perma != "") $related = ',"related":{"permalink":"' . $perma . '"}';

	// First create playlist on server.
	$now = time();
	$guid = "";
	do $guid = sprintf('%04X%04X-%04X-%04X-%04X-%04X%04X%04X', mt_rand(0, 65535), mt_rand(0, 65535), mt_rand(0, 65535), mt_rand(16384, 20479), mt_rand(32768, 49151), mt_rand(0, 65535), mt_rand(0, 65535), mt_rand(0, 65535));
	while (file_exists($pathToPlaylists . $guid . ".js"));
	$plURL = "/playlists/js/" . $guid . ".js";

	$cont = 
		"{"
			. '"bucket":"' . $bucket . '"'
			. ',"label":"' . str_replace('"', "&quot;", $label) . '"'
			. ',"descrip":"' . str_replace('"', "&quot;", $descrip) . '"'
			. ',"cnt":"' . $cnt . '"'
			. ',"utc_created":"' . $now . '"'
			. ',"utc_updated":"' . $now . '"'
			. ',"links":[' 
	;

	$cnt = 0;
	foreach ($links as $key => $link) {
		$cont .=
				($cnt > 0 ? "," : "")
				. '{'
					. '"title":"' . str_replace('"', "&quot;", $link['title']) . '"'
					. ',"url":"' . $link['url'] . '"'
					. ',"thumb":"' . $link['thumb'] . '"'

					// . (empty($link['related']) ? "" : ',"related":{')
					. ',"related":{'
						. (empty($link['related']) || empty($link['related']['permalink']) ? "" : '"permalink":"' . $link['related']['permalink'] . '"')
					// . (empty($link['related']) ? "" : '}')
					. '}'
				. '}'
		;

		$cnt++;
	}

	$cont .=
			']'
		. "}"
	;

	if (!file_put_contents($pathToPlaylists . $guid . ".js", $cont)) die('{"error":"Playlist file could not be saved."}');

	// Then add playlist to database as a feed.
	$source = "playlist";
	$cat = "~a|Playlists";
	$hasOpts = 0;

	$qry = 
		"INSERT INTO feeds (hasOpts, source, bucket, cat, url, user, label, descrip)"
		. " values (" 
			. $hasOpts . ", '" 
			. $source . "', '" 
			. $bucket . "', '" 
			. $cat . "', '" 
			. $plURL . "', '" 
			. $user . "', '" 
			. $label . "', '" 
			. $descrip 
		. "')"
	;

	$result = $mysqli->query($qry); 
	if ($result === false) die('{"error":"' . str_replace('"', "&quot;", $mysqli->error) . '"}');

	echo '{"result":"success","action":"create","idx":"' . $guid . '","url":"' . $plURL . '"}';
?>
