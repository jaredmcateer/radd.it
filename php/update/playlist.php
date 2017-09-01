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
	$action = $mysqli->real_escape_string($_POST["action"]);
	if (empty($action)) $action = "append";

	// Playlist data
	$user = $mysqli->real_escape_string($_COOKIE["user"]);
	if (empty($user))  die('{"error":"User not found."}');
	$url = $mysqli->real_escape_string($_POST["url"]);
	if (empty($url))  die('{"error":"Playlist URL not found."}');
	$bucket = $mysqli->real_escape_string($_POST["bucket"]);
	if (empty($bucket))  die('{"error":"Bucket not found."}');

	$label = $mysqli->real_escape_string($_POST["label"]);
	$descrip = $mysqli->real_escape_string($_POST["descrip"]);
	// $cnt = $mysqli->real_escape_string($_POST["cnt"]);

	//// Link data
	$links = $_POST["links"];

	// First, check db to make sure this playlist belongs to this user.
	$qry = "SELECT id_feed from feeds where user = '" . $user . "' and url = '" . $url . "' limit 0,1";
	$ownerCheck = $mysqli->query($qry); 
	if ($ownerCheck === false) die('{"error":"' . str_replace('"', "&quot;", $mysqli->error) . '"}');
	else if ($ownerCheck->num_rows == 0) {		// If this isn't their playlist, create a new one instead.
		include("../create/playlist.php");
		die();
	}

	// Second, get playlist from the server and add new links.
	$current = file_get_contents($pathToPlaylists . str_replace("/playlists/js/", "", $url));
	try { $current = json_decode($current, true); }
	catch(Exception $e) { die('{"error":"json_decode error"}'); }

// die('{"error":"' . str_replace('"', "&quot;", $current) . '"}');


	if ($action == "append") $newLinks = $current['links'];
	else $newLinks = array();

	foreach ($links as $key => $link) $newLinks[] = $link;

	// Finally, write new file to server.
	$cont = 
		"{"
			. '"bucket":"' . $bucket . '"'
			. ',"label":"' . $current['label'] . '"'
			. ',"descrip":"' . $current['descrip'] . '"'
			. ',"cnt":"' . count($current['links']) . '"'
			. ',"utc_created":"' . $current['utc_created'] . '"'
			. ',"utc_updated":"' . time() . '"'
			. ',"links":[' 
	;

	$cnt = 0;
	foreach ($newLinks as $key => $link) {
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

	if (!file_put_contents($pathToPlaylists . str_replace("/playlists/js/", "", $url), $cont))
		die('{"error":"Playlist file could not be updated."}');

	echo '{"result":"success","action":"' . $action . '","url":"' . $url . '"}';
?>
