<?php
	error_reporting(E_ERROR | E_PARSE);
	chdir(dirname(__FILE__));
	date_default_timezone_set("UTC");
	
	$vars = include "../php/vars.php";
	$mysqli = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	$mysqli->set_charset("utf8");


	$mysqli_del = new mysqli($vars['dbserver'], $vars['dbdel']['user'], $vars['dbdel']['pass'], $vars['dbname']);
	$mysqli_del->set_charset("utf8");
	$mysqli_del->query("DELETE from user_suggestions WHERE user = ''"); // " or dt_created < '" . strtotime("2 days ago") . "'");

	// Remove old interests to keep friends more updated.
	$mysqli_del->query("DELETE from user_interests WHERE dt_created < '" . date("Y-m-d H:i:s", strtotime("5 days ago")) . "'");

	// $qry = "";
	// foreach ($vars['buckets'] as $key => $bucket) {
	// 	$qry .= "SELECT kind, bucket, source, label, url, score from user_suggestions WHERE "
	// 		. ""
	// }

	// $qry = 
	// 	"SELECT kind, bucket, source, max(label), url, count(*), max(thumb), max(permalink), max(descrip)"
	// 	. " from user_suggestions WHERE kind = 'feed'" // " and dt_created > '" . strtotime("1 day ago") . "'"
	// 	. " GROUP BY bucket, url"
	// 	. " ORDER BY bucket, count(*) DESC"
	// ;

	$qry = 
		"SELECT 'feed' as kind, bucket, source, max(label), url, count(*), '' as thumb, '' as permalink, max(descrip)"
		. " from feeds"
		. " group by bucket, url"
		. " ORDER BY bucket, count(*) DESC"
	;
	$sugs = $mysqli->query($qry);
	// echo $sugs->num_rows;


// echo "<pre>";
	$qry = "insert into user_suggestions (kind, bucket, source, label, url, hotScore, thumb, permalink, descrip) values ";

	$lastBucket = "";
	$lastKind = "";
	$cnt = 0;
	$total = 0;
	while ($sug = $sugs->fetch_row()) {
		$kind = $sug[0];
		$bucket = $sug[1];
		$source = $sug[2];
		$label = $mysqli->real_escape_string($sug[3]);
		$url = $mysqli->real_escape_string($sug[4]);
		// $totScore = round($sug[5] / 10);
		$totScore = intval($sug[5]);
		$thumb = $mysqli->real_escape_string($sug[6]);
		$perma = $mysqli->real_escape_string($sug[7]);
		$descrip = $mysqli->real_escape_string($sug[8]);

		if ($kind == "feed" && strpos($url, "/m/") !== false) continue;		// skip /m/ulti reddits

		// $rejectCnt = 0;
		// $rejects = $mysqli->query("select user, is_invalid from suggestions_rejected where bucket = '" . $bucket . "' and url = '" . $url . "'");
		// while ($rej = $rejects->fetch_row()) {
		// 	if ($rej[0] == "radd_it") $rejectCnt += 100;
		// 	else if ($rej[1] == "1") $rejectCnt += 3;
		// 	else $rejectCnt++;
		// }
		// $totScore -= $rejectCnt * 100;
		// if ($totScore < 0) continue;

		if ($bucket != $lastBucket || $kind != $lastKind) {
echo "<hr>";
			$cnt = 0;
			$lastBucket = $bucket;
			$lastKind = $kind;
		}
		else if ($cnt > 11) continue;

echo $bucket . " " . $kind . " " . $cnt . " " . $totScore . " " . " <a href='" . $url . "' target='_blank'>" . $label . "</a><br>";

		$qry .= ($total > 0 ? "," : "") . "("
			. "'" . $kind . "'"
			. ",'" . $bucket . "'"
			. ",'" . $source . "'"
			. ",'" . $label . "'"
			. ",'" . $url . "'"
			. "," . $totScore
			. ",'" . $thumb . "'"
			. ",'" . $perma . "'"
			. ",'" . $descrip . "'"
		. ")";

		$cnt++;
		$total++;
	}

	$update = $mysqli->query($qry);
	if ($update === false) die("{\"error\" : \"" . $mysqli->error . "\"}");
?>