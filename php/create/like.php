<?php
	chdir(dirname(__FILE__));

/*
php Array
(
    [bucket] => eyecandy
    [cat] => 00|Mixed
    [url] => http://i.imgur.com/Vrj4fog.jpg
    [thumb] => http://i.imgur.com/Vrj4fogm.jpg
    [label] => On the sill
    [permalink] => /r/PrettyGirls/comments/31awr0/on_the_sill/
)
*/
	if (empty($_POST["permalink"]) && empty($_POST["url"])) die('{"error":"No URL or permalink found."}');

	// If there's a permalink, upvote!
	if (!empty($_POST["permalink"])) {
		$permalink = $_POST["permalink"];
		if (substr($permalink, 0, 4) !== "http") $permalink = "https://www.reddit.com" . $permalink;

		$vote = include "../../login/upvote.php";

		// if (strpos($vote, '"error"') !== false) die($vote);
		// if (empty($vote["code"]) || $vote["code"] != "200") {
		// 	print_r($vote);
		// 	die();
		// }
		// else 

		if (empty($_POST["url"])) {
			if (empty($vote["code"]) || $vote["code"] != "200") die('{"error":"Cannot upvote, reddit has archived it."}');
			else die('{"result":"upvoted","idx":"-1"}');
		}
	}
	else $permalink = "";

	// If not just upvoting, add the like to db.
	if (!empty($_POST["url"])) {
		if (empty($vars)) $vars = include "../vars.php";

		$mysqli = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
		if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
		$mysqli->set_charset("utf8");

/*
		var link = {
			'bucket' : listr.bucket
			,'cat' : $('#addlike-cat-new').val()
			,'url' : $('#addlike-url').val()
			,'thumb' : $('#addlike-thumb-img').attr('src')
			,'label' : $('#addlike-title').val()
		};
*/
		$user = $mysqli->real_escape_string($_COOKIE["user"]);
		$bucket = $mysqli->real_escape_string($_POST["bucket"]);
		$cat = $mysqli->real_escape_string(strip_tags($_POST["cat"]));
		$earl = $mysqli->real_escape_string(strip_tags($_POST["url"]));
		$label = $mysqli->real_escape_string(strip_tags($_POST["label"]));
		$thumb = $mysqli->real_escape_string(strip_tags($_POST["thumb"]));

		if (empty($_POST["descrip"])) $descrip = "";
		else $descrip = $mysqli->real_escape_string(strip_tags($_POST["descrip"]));

		$qry = "INSERT INTO likes (user, bucket, cat, label, descrip, url, thumb, permalink) VALUES ("
			. "'" . $user . "'"
			. ",'" . $bucket . "'"
			. ",'" . $cat . "'"
			. ",'" . $label . "'"
			. ",'" . $descrip . "'"
			. ",'" . $earl . "'"
			. ",'" . $thumb . "'"
			. ",'" . $permalink . "'"
		. ")";

		$result = $mysqli->query($qry); 
		if ($result === false) die('{"error":"' . str_replace('"', "&quot;", $mysqli->error) . '"}');
		else die('{"result":"success","idx":"' . $mysqli->insert_id . '"}');
	}

?>