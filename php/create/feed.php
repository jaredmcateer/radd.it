<?php
	$yesOpts = array("reddit");		// List of sources that get marked as having options.

	$mysqli = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	$mysqli->set_charset("utf8");

	$user = $mysqli->real_escape_string($_COOKIE["user"]);

	$bucket = $mysqli->real_escape_string($_POST["bucket"]);
	$cat = $mysqli->real_escape_string(strip_tags($_POST["cat"]));
	$label = $mysqli->real_escape_string(strip_tags($_POST["label"]));
	$earl = str_replace(
		array("https://www.reddit.com", "http://www.reddit.com", "https://reddit.com", "http://reddit.com", "https://radd.it", "http://radd.it")
		, ""
		, $mysqli->real_escape_string($_POST["url"])
	);

	if (substr($earl, -1) == "/") $earl = substr($earl, 0, strlen($earl) - 1);

	$descrip = $mysqli->real_escape_string(strip_tags($_POST["descrip"]));

	$source = $mysqli->real_escape_string($_POST["source"]);

	if ($source == "defaults") {
		$fromCat = str_replace('All feeds from ', '', $label);

		$qry = "INSERT INTO feeds (hasOpts, source, bucket, cat, url, user, label, descrip) "
			. "SELECT hasOpts, source, bucket, '" . $cat . "' as cat, url, '" . $user . "' as user, label, descrip "
			. "FROM feeds where bucket = '" . $bucket . "' and user = '' and is_default = 1 and cat = '" . $fromCat . "'"
		;
	}
	else {
		$is_default = 0;
		if ($user === "radd_it") {
			$is_default = $mysqli->real_escape_string($_POST["is_default"]);
			if ($is_default == 1) $user = "";
		}

		$hasOpts = 0;
		if (in_array($source, $yesOpts, true) && substr_count($earl, "sort=") == 0) $hasOpts = 1;

		$qry = 
			"INSERT INTO feeds (hasOpts, source, bucket, cat, url, user, label, descrip, is_default, is_sticky)"
			. " values (" 
				. $hasOpts . ",'" 
				. $source . "','" 
				. $bucket . "','" 
				. $cat . "','" 
				. $earl . "','" 
				. $user . "','" 
				. $label . "','" 
				. $descrip . "',"

				// Special me-only fields!
				. $is_default . ","
				. $is_default
			. ")"
		;
	}

	$result = $mysqli->query($qry); 
	if ($result === false) die('{"error":"' . str_replace('"', "&quot;", $mysqli->error) . '"}');

	if ($source == "reddit" && $mysqli->affected_rows > 0) {
		$qry = "UPDATE user_subs SET active = 1 WHERE user = '" . $user . "' and url = '" . $url . "';";
		$result = $mysqli->query($qry); 
	}

	echo '{"result":"success"}';
?>
