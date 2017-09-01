<?php
	$mysqli = new mysqli($vars['dbwrite']['server'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbwrite']['name']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	$mysqli->set_charset("utf8");

	$user = $mysqli->real_escape_string($_COOKIE["user"]);
	$bucket = $mysqli->real_escape_string($_POST["bucket"]);

	$feedKeys = array();
	$newCats = array();
	$labels = array();
	$descrips = array();

// echo "<pre>";
// print_r($_POST);
// die();

	foreach ($_POST as $field => $value) {
		$key = substr($field, 0, 3);
		$class = substr($field, 4);

if ($value !== "") echo $field . " --> " . $value . "<br>";

		if ($key === "key" && !empty($value)) $feedKeys[$class] = $value;
		else if ($key == "sel" && !empty($value) && substr($value, 0, 1) !== "|") $newCats[$class] = $value;
		else if ($key == "new" && !empty($value) && empty($newCats[$class])) $newCats[$class] = $value;
		else if ($key == "lbl" && !empty($value) && empty($labels[$class])) $labels[$class] = $value;
		else if ($key == "dsc" && !empty($value) && empty($descrips[$class])) $descrips[$class] = $value;
	}


	foreach ($newCats as $class => $cat) {
		$hasOpts = 0;
		$url = $mysqli->real_escape_string($feedKeys[$class]);
		$label = $mysqli->real_escape_string($labels[$class]);
		$descrip = $mysqli->real_escape_string($descrips[$class]);

		if (stripos($url, "/r/") === 0 || stripos($url, "/user/m/") === 0)
		{
			$source = "reddit";
			$hasOpts = 1;

			$qry = 
				"INSERT INTO feeds (hasOpts, source, bucket, cat, url, user, label, descrip)"
				. " SELECT " . $hasOpts . ", '" . $source . "', '" . $bucket . "', '" . $cat . "', '" . $url . "', '" . $user . "', label, descrip from user_subs"
				. " WHERE url = '" . $url . "' limit 0, 1;";	// removed: user = '" . $user . "' and 
		}
		else if (substr_count($url, "youtube.com/") > 0 || substr_count($url, "youtu.be/") > 0) {
			// So far, no youtube feeds have options.
			$source = "youtube";
			if (substr_count($url, "list=") > 0) $source .= "-playlist";

			$qry = 
				"INSERT INTO feeds (hasOpts, source, bucket, cat, url, user, label, descrip)"
				. " values (" . $hasOpts . ", '" . $source . "', '" . $bucket . "', '" . $cat . "', '" . $url . "', '" . $user . "', '" . $label . "', '" . $descrip . "')"
			;
		}
		else {
			echo "<h5>Ruh-roh!</h5><p>We don't understand the format of one of the feeds you're trying to add.  Please take a screenshot and send it to youdungoofed@radd.it, thanks!</p>";
			echo "<br><br><br>";
			echo "url: " . $url . "<br>";
			echo "class: " . $class . "<br>";
			echo "label: " . $label . "<br>";
			echo "descrip: " . $descrip . "<br>";
			echo "<hr>";
			print_r($feedKeys);
			echo "<hr>";
			print_r($newCats);
			echo "<hr>";
			print_r($labels);
			echo "<hr>";
			print_r($descrips);
			// echo "<hr><pre>";
			// print_r($_POST);
			die();
		}

		// echo "update " . $url . " to " . $cat . chr(10);

		$result = $mysqli->query($qry); 

		if ($source == "reddit" && $mysqli->affected_rows > 0) {
			$qry = "UPDATE user_subs SET active = 1 WHERE user = '" . $user . "' and url = '" . $url . "';";
			$result = $mysqli->query($qry); 
		}
	}

	echo "<script>window.location.href = '" . $_SERVER['HTTP_REFERER'] . "';</script>";

?>
