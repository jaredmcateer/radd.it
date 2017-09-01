<?php
	$mysqli = new mysqli($vars['dbserver'], $vars['dbread']['user'], $vars['dbread']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	$mysqli->set_charset("utf8");

	$user = $mysqli->real_escape_string($_COOKIE["user"]);
	$bucket = $mysqli->real_escape_string($_POST["b"]);

	if (empty($user)) die('{"error": "No user."}');
	else if (empty($bucket)) die('{"error": "No bucket."}');
	// else print_r($_POST);
	// die();

	$qry = "SELECT thumb, label, url, permalink from user_suggestions where bucket = '" . $bucket . "' and user = '' order by hotScore DESC limit 0, 75";
	
// echo $qry;
	$upvoted = $mysqli->query($qry);
	if ($upvoted == false) die("{\"error\" : \"" . $mysqli->error . "\"}");
	else if ($upvoted->num_rows === 0)  die('{"error": "No results."}');

	$cnt = 0;

	echo '{"links":[';
	while ($post = $upvoted->fetch_row()) {
		echo 
			($cnt > 0 ? "," : "") . '{'
				. '"thumb":"' . str_replace('"', '\\"', $post[0])
				. '","title":"' . str_replace('"', '\\"', $post[1])
				. '","url":"' . str_replace('"', '\\"', $post[2])
				. '","permalink":"' . $post[3] . '"'
			. '}';
		$cnt++;
	}
	echo "]}";
?>