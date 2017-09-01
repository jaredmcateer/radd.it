<?php
	$mysqli = new mysqli($vars['dbserver'], $vars['dbread']['user'], $vars['dbread']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	$mysqli->set_charset("utf8");

	$user = $mysqli->real_escape_string($_COOKIE["user"]);
	// $bucket = $mysqli->real_escape_string($_POST["bucket"]);
	$subs = $_POST["subs"];

	if (empty($user)) die('{"error": "No user."}');
	// else if (empty($bucket)) die('{"error": "No bucket."}');
	// else print_r($_POST);
	// die();

	$qry = "SELECT thumb, title, url, permalink, id_reddit, author, subreddit from user_upvotes where user = '" . $user . "'";
	
	if (count($subs) > 0) {
		$qry .= " and subreddit in (";
		foreach ($subs as $i => $sub) $qry .= ($i > 0 ? "," : "") . "'/r/" . $sub . "'";
		$qry .= ")";
	}

	$qry .= " order by dt_created DESC limit 0, 200";
// echo $qry;
	$upvoted = $mysqli->query($qry);
	if ($upvoted->num_rows === 0)  die('{"error": "No results."}');

	$cnt = 0;

	echo '{"links":[';
	while ($post = $upvoted->fetch_row()) {
		echo 
			($cnt > 0 ? "," : "") . '{'
				. '"thumb":"' . str_replace('"', '\\"', $post[0])
				. '","title":"' . str_replace('"', '\\"', $post[1])
				. '","url":"' . str_replace('"', '\\"', $post[2])
				. '","permalink":"' . str_replace('"', '\\"', $post[3])
				. '","name":"' . str_replace('"', '\\"', $post[4])
				. '","author":"' . str_replace('"', '\\"', $post[5])
				. '","subreddit":"' . str_replace('"', '\\"', $post[6])
			. '"}';
		$cnt++;
	}
	echo "]}";
?>