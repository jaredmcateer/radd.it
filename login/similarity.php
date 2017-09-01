<?php
	date_default_timezone_set("UTC");

	$username = "radd_it";
	if (!empty($_GET["user"])) $username = $_GET["user"];

	$weights = array(
		"upvotes" => 1
		, "subs" => 3
		, "feeds" => 5
	);

	$vars = include "../php/vars.php";
	$mysqli = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	$mysqli->set_charset("utf8");

	$mysqli_del = new mysqli($vars['dbserver'], $vars['dbdel']['user'], $vars['dbdel']['pass'], $vars['dbname']);
	$mysqli_del->set_charset("utf8");

	$friends = array();

	//// Upvotes ////////////////
	$qry = "SELECT friend.user, COUNT(*) FROM user_upvotes login INNER JOIN user_upvotes friend ON login.id_reddit = friend.id_reddit"
		. " WHERE login.user =  '" . $username . "' and friend.user !=  '" . $username . "' GROUP BY friend.user";

	$matches = $mysqli->query($qry);
	if ($matches === false) die($mysqli->error);

	while ($match = $matches->fetch_row()) {
		$friend = $match[0];
		$cnt = $match[1];

		if (isset($friends[$friend])) $friends[$friend] += $cnt * $weights["upvotes"];
		else $friends[$friend] = $cnt;
	}

	//// Subs //////////////////
	$qry = "SELECT friend.user, COUNT(*) FROM user_subs login INNER JOIN user_subs friend ON login.name = friend.name"
		. " WHERE login.user =  '" . $username . "' and friend.user !=  '" . $username . "' GROUP BY friend.user";

	$matches = $mysqli->query($qry);
	while ($match = $matches->fetch_row()) {
		$friend = $match[0];
		$cnt = $match[1];

		if (isset($friends[$friend])) $friends[$friend] += $cnt * $weights["subs"];
		else $friends[$friend] = $cnt;
	}


	//// feeds /////////////////
	$qry = "SELECT friend.user, COUNT(*) FROM feeds login INNER JOIN feeds friend ON login.url = friend.url"
		. " WHERE login.user =  '" . $username . "' and friend.user !=  '" . $username . "' and friend.user != '' GROUP BY friend.user";

	$matches = $mysqli->query($qry);
	while ($match = $matches->fetch_row()) {
		$friend = $match[0];
		$cnt = $match[1];

		if (isset($friends[$friend])) $friends[$friend] += $cnt * $weights["feeds"];
		else $friends[$friend] = $cnt;
	}

	if (count($friends) === 0) die("No friends found for /u/" . $username . "!");

// echo "<pre>";
// print_r($friends);
// echo "</pre>";

	$rejects = $mysqli->query(
		"select bucket, url, friend from suggestions_rejected where user = '" . $username . "'"
		. " union "
		. "select bucket, url, '' as friend from feeds where user = '" . $username . "'"
		. " union "
		. "select bucket, url, '' as friend from likes where user = '" . $username . "'"
		. " union "
		. "select 'media' as bucket, url, '' as friend from user_upvotes where user = '" . $username . "'"
	);
	if ($rejects === false) die($mysqli->error);

	$badFriends = array();
	while ($reject = $rejects->fetch_row()) {
		$friend = $reject[2];
		if (empty($friend)) continue;

		if (isset($badFriends[$friend])) $badFriends[$friend]++;
		else $badFriends[$friend] = 1;

		if (isset($friends[$friend])) {
			if ($badFriends[$friend] > 6) unset($friends[$friend]);
			else $friends[$friend]--;
		}
	}


	// Sort friends (by score) then reduce array to the top 10 friends and another 10 from the next 20.
	arsort($friends);
	array_splice($friends, 75);
	while (count($friends) > 50) array_splice($friends, 25 + mt_rand(0, count($friends) - 26), 1);
	$top10 = "'" . implode(array_keys($friends), "','") . "'";
// echo $top10 . '<br><br>';

	$mysqli_del->query("DELETE from user_suggestions WHERE user = '" . $username . "'");

	$qry = 
		"INSERT INTO user_suggestions (user, friend, kind, bucket, source, label, descrip, url, score, dt_created) "
		. "SELECT '" . $username . "', user, 'feed', bucket, source, label, descrip, url, count(*) * 2, min(dt_created) from feeds"
			. " where cat != '~a|Playlists' and user IN (" . $top10 . ")"
			. " and url NOT IN (select url from feeds where user = '" . $username . "')"
			. " and url NOT LIKE '%v=%'"	// Omit stray youtube vids.
			. " group by url order by count(*) DESC, dt_created DESC"
	;
// echo $qry . '<br><br>';

	$matches = $mysqli->query($qry);
	
	$qry = 
		"INSERT INTO user_suggestions (user, friend, kind, bucket, source, thumb, label, descrip, url, permalink, score, dt_created) "
		. "SELECT '" . $username . "', user, 'link', bucket, 'likes', max(thumb), label, descrip, url, permalink, count(*), min(dt_created) from likes"
			. " where user IN (" . $top10 . ")"
			// . " and url NOT IN (select url from likes where user = '" . $username . "')"
			// . " and url NOT IN (select url from user_upvotes where user = '" . $username . "')"
			. " group by url order by count(*) DESC, dt_created DESC"
	;
// echo $qry . '<br><br>';

	$matches = $mysqli->query($qry);
	if ($matches === false) die($mysqli->error);

	// Add suggestions from upvotes from default subreddits.
	$qry = 
		"INSERT INTO user_suggestions (user, friend, kind, bucket, source, thumb, label, descrip, url, permalink, score, dt_created) "
		. "SELECT '" . $username . "', u.user, 'link', f.bucket, 'likes', max(u.thumb), u.title, '' as descrip, u.url, u.permalink, count(*), min(u.dt_created)"
			. " from user_upvotes u inner join feeds f ON u.subreddit = f.url"
			. " where f.user = '' and u.user IN (" . $top10 . ")"
			// . " and u.url NOT IN (select url from likes where user = '" . $username . "')"
			// . " and u.url NOT IN (select url from user_upvotes where user = '" . $username . "')"
			. " group by u.url order by count(*) DESC, u.dt_created DESC"
			// . " limit 0, 100"
	;
// echo $qry . '<br><br>';

	$matches = $mysqli->query($qry);
	if ($matches === false) die($mysqli->error);

	$qry = "SELECT id_suggestion, sum(score) as score, min(dt_created), url, label, kind, bucket, max(friend) from user_suggestions where user = '" . $username . "' group by url";	//  order by bucket, kind, score DESC, label
	$matches = $mysqli->query($qry);

	$earliest = time();
	while ($match = $matches->fetch_row()) {
		$utc = strtotime($match[2]);	// e.g. 1429827733
		if ($utc > 0 && $utc < $earliest) $earliest = $utc;
	}

	$okdomains = array(
		'vids' => array('youtube.com/', 'youtu.be/', 'vimeo.com/', 'vine.co/v/', 'dailymotion.com', '.mp4', '.webm', 'twitch.tv', 'vid.me/')
		,'pics' => array(
			'imgur.com/a/', 'flickr.com/', 'deviantart.com/', '.jpg', '.gif', '.png', 'flickr.com/photos/', 'flic.kr/p/', 'gfycat.com/'
			, 'gyazo.com/', 'minus.com/', 'uploadica.com/?v=', 'vidble.com/show/', 'vidble.com/album/'
		)
	);

	$okdomains['music'] = array_merge(
		$okdomains['vids']
		, array('soundcloud.com/', 'bandcamp.com/', '.mp3', 'audiomack.com/', 'clyp.it/', 'hypem.com', '.wav', '.ogg')
	);

	$okdomains['eyecandy'] = $okdomains['pics'];
	$okdomains['ladycandy'] = $okdomains['pics'];

	$okdomains['nsfw'] = array_merge(
		$okdomains['vids']
		, $okdomains['pics']
		, array(
			'eporner.com/', 'pornhd.com/videos/', 'pornhub.com/view_video.php?viewkey=', 'redtube.com/', 'spankbang.com/', 'sunporno.com/videos/'
			, 'tnaflix.com/', 'xhamster.com/movies/', 'xvideos.com/video', 'xvideos.com/embedframe/', 'youjizz.com/videos/', 'youporn.com/watch/'
		)
	);
	$okdomains['gaynsfw'] = $okdomains['nsfw'];

	$qry = "";
	$matches->data_seek(0);
	while ($match = $matches->fetch_row()) {
		$id = $match[0];
		$score = $match[1];

		$utc = strval(strtotime($match[2]));
		if ($utc < $earliest) $utc = $earliest;
		$utc -= $earliest;
		$utc = round($utc / 3600);

		$hot = $utc + ($score * 60);

		// $utc = round(intval(substr($utc, 2)) / 100000);

		// $utc = round(intval(substr($utc, ceil(strlen($utc) / 2))) / 100);
// echo " to " . $utc . "<br>";
		// $utc = strtotime($match[2]);	// e.g. 1429827733
		// if ($utc < $earliest) $utc = $earliest;
		// $utc -= $earliest;
		// $utc = round($utc / 10000);

		$url = $mysqli->real_escape_string($match[3]);
		$tit = $match[4];
		$kind = $match[5];
		$bucket = $match[6];
		$friend = $match[7];
		if (isset($badFriends[$friend])) {
			$score -= $badFriends[$friend];
			$hot -= $badFriends[$friend] * 180;
		}

		$rejected = false;
		if ($kind == "link" && isset($okdomains[$bucket]) && $url == str_ireplace($okdomains[$bucket], "", $url)) $rejected = true;

		if (!$rejected) {
			$rejects->data_seek(0);
			while ($reject = $rejects->fetch_row()) {
				// bucket, url, is_invalid
				$rej_bucket = $reject[0];
				$rej_url = $reject[1];
				// No longer in query: $rej_invalid = ($reject[2] == 0 ? false : true);

				if (($rej_bucket == "media" || $rej_bucket == $bucket) && $rej_url == $url) $rejected = true;
			}
		}

		if ($rejected || $score <= 0 || $hot <= 0)
			$mysqli_del->query("DELETE from user_suggestions WHERE id_suggestion = " . $id . ";");
		else {
			// $hot = round(($utc * $score * 1000) / 1000);
			// $hot = $utc * $score;
			echo $bucket . " " . $kind . ' <a href="' . $url . '" target="_blank">' . $tit . '</a> -- ';
			echo $utc . " -- " . $score . " -- " . $hot . "<br>";

			$qry .= "UPDATE user_suggestions SET score = " . $score . ", hotScore = " . $hot . " WHERE id_suggestion = " . $id . ";";
		}

	}

	$matches = $mysqli->multi_query($qry);
	while ($mysqli->more_results()) { $mysqli->next_result(); } // flush multiquery

// echo "<pre>";
// print_r($friends);

	/* Maybe later:
		SELECT friend.user, COUNT( * ) 
		FROM likes login
		INNER JOIN likes friend ON login.url = friend.url
		WHERE login.user =  'radd_it'
		AND friend.user !=  'radd_it'
		GROUP BY friend.user	
	*/
?>