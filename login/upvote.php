<?php
	if (empty($permalink)) return '{"error":"No reddit permalink."}';
	else if (strpos($permalink, "/comments/") === false) return '{"error":"Invalid permalink."}';

	// http://www.reddit.com/r/GoneMild/comments/31ahc4/like_my_shirt_maybe_youll_like_whats_underneath_a/
	// http://www.reddit.com/r/GoneMild/comments/31ahc4/like_my_shirt_maybe_youll_like_whats_underneath_a/cpzsszq
	$id_reddit = trim(explode("/comments/", $permalink)[1], "/");
	$sCnt = substr_count($id_reddit, "/");

	if ($sCnt === 0) $id_reddit = "t3_" . $id_reddit;							// 31ahc4
	else if ($sCnt === 1) $id_reddit = "t3_" . explode("/", $id_reddit)[0];		// 31ahc4/like_my_shirt_maybe_youll_like_whats_underneath_a
	else $id_reddit = "t1_" . substr($id_reddit, strrpos($id_reddit, "/") + 1);	// 31ahc4/like_my_shirt_maybe_youll_like_whats_underneath_a/cpzsszq

// return '{"error":"' . $id_reddit . '"}';

	chdir(dirname(__FILE__));
	$client = include "refresh.php";

	return $client->fetch("https://oauth.reddit.com/api/vote", array("dir" => 1, "id" => $id_reddit), "POST");
?>