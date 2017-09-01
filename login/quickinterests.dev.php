<?php
	if (!empty($bucket) && isset($_COOKIE[$bucket . "_suggestions"]) && !isset($_GET["debug"])) return;

	setlocale(LC_ALL, 'en_US.UTF8');

	$debug = false;
	if (isset($_GET["debug"])) $debug = true;

	$max = 50;		// Number of interests to save.
	$sMax = 25;		// Number of authors/ subs to save.
	$maxFriends = 25;
	$minWordLen = 3;
	$period = strtotime("1 day ago");

//// blacklist ////////////////////////////////////////////////////////////////////////////
	$badInterests = array(
		"the", "and", "you", "ive", "yet", "but", "too", "for", "yes", "are", "ill", "sub", "all", "pic", "min", "max", "who", "its"
		, "new", "not", "bad", "off", "her", "his", "big", "man", "see", "out", "how", "did", "was", "now", "way", "she", "guy", "get"
		, "got", "has", "can", "top", "hot", "old", "hey", "own", "our", "mic", "aic", "men", "fat", "nprs", "may", "eat", "alt", "url"
		, "sfw", "mfw", "tfw", "irl", "thy", "let", "via", "fap", "had", "him", "why", "boy", "gif", "day", "shh", "mix", "use"

		,"from", "music", "band", "xpost", "crosspost", "this", "rated", "with", "just", "that", "reddit", "like", "nice", "what"
		, "about", "mode", "hes", "shes", "love", "when", "your", "here", "only", "down", "year", "name", "still", "look", "meet"
		, "today", "yesterday", "tomorrow", "post", "very", "some", "time", "gets", "days", "weeks", "months", "years", "decades"
		, "have", "these", "never", "always", "made", "playing", "play", "album", "song", "track", "comments", "video", "music"
		, "stream", "body", "done", "https", "http", "anyone", "show", "damn", "dont", "getting", "than", "more", "good", "think"
		, "once", "going", "they", "great", "those", "good", "real", "guys", "perfect", "told", "self", "after", "girl", "girls"
		, "before", "where", "will", "friend", "staring", "make", "hello", "picture", "movie", "please", "ever", "seen", "weve"
		, "most", "subreddit", "subs", "full", "length", "picture", "vids", "isnt", "skip", "secs", "seconds", "minutes", "hours"
		, "thinking", "woah", "sill", "want", "feat", "view", "pretty", "care", "else", "first", "photo", "image", "images", "game"
		, "cant", "their", "through", "whats", "item", "even", "hows", "were", "said", "hers", "fantastic", "beautiful", "hate"
		, "over", "times", "posts", "tonights", "morning", "afternoon", "guest", "various", "artists", "record", "doing", "version"
		, "drunken", "stunning", "dreamy", "sexy", "powerful", "directed", "electronic", "live", "perf", "performance", "didnt"
		, "somebody", "details", "gonna", "gunna", "level", "part", "starts", "amazed", "arent", "sound", "alternative", "indie"
		, "audio", "soundtrack", "listentothis", "enough", "season", "miss", "mister", "gives", "thinks", "huge", "went", "wont"
		, "link", "while", "quite", "prepare", "seasons", "shows", "offers", "sometimes", "means", "best", "nsfw", "thou", "shall"
		, "parts", "wheres", "would", "alot", "looks", "wear", "come", "same", "says", "wrote", "found", "whod", "thought", "knew"
		, "much", "many", "friends", "know", "could", "happen", "lets", "roll", "words", "word", "clean", "lady", "wonderful", "girl"
		, "awesome", "been", "last", "verification", "took", "hope", "might", "almost", "sure", "another", "watch", "better", "likes"
		, "cakeday", "thank", "heard", "needed", "youve", "yall", "youre", "already", "around", "again", "give", "later", "every"
		, "sent", "into", "left", "leave", "mine", "must", "until", "whos", "tell", "others", "other", "late", "everyday", "maybe"
		, "night", "then", "start", "stop", "wish", "brings", "bring", "proof", "agreed", "agree", "should", "pics", "there", "without"
		, "theres", "piece", "shit", "shhh", "remix", "song", "fresh", "havent", "next", "episode", "incredible", "doesnt", "thing"
		, "cool", "fine", "aint", "usual", "alright", "plunge", "shouldve", "shoulda", "brought", "dropped", "released", "release"
		, "cmon", "tonight", "playlist", "torrent", "download", "track", "todays", "session", "test", "able", "types", "type"


		, "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"
		, "zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"
	);

//// ok domains ////////////////////////////////////////////////////////////////////////////
	$okdomains = array(
		'vids' => array('youtube.com/', 'youtu.be/', 'vimeo.com/', 'vine.co/v/', 'dailymotion.com', '.mp4', '.webm', 'twitch.tv/', 'vid.me/')
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

	if (!isset($vars)) $vars = include "../php/vars.php";

//// databases init	
	if (!isset($mysqli_wri)) {
		$mysqli_wri = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
		if ($mysqli_wri->connect_error) die('Connect Error (' . $mysqli_wri->connect_errno . ') ' . $mysqli_wri->connect_error);
		$mysqli_wri->set_charset("utf8");
	}

	if (!isset($username)) {
		$username = 'radd_it';
		if (!empty($_GET["u"])) $username = $mysqli_wri->real_escape_string($_GET["u"]);
	}
	
	if (!isset($bucket)) {
		$bucket = 'music';
		if (!empty($_GET["b"])) $bucket = $mysqli_wri->real_escape_string($_GET["b"]);
	}

	if (isset($_COOKIE[$bucket . "_suggestions"])) {
		if ($debug) echo "redo suggestings<br>";
		else return;
	}
	setcookie($bucket . "_suggestions", "true", time() + (3600 * 22), "/", "radd.it");

	if (!isset($mysqli_del)) { $mysqli_del = new mysqli($vars['dbserver'], $vars['dbdel']['user'], $vars['dbdel']['pass'], $vars['dbname']); $mysqli_del->set_charset("utf8"); }
	$mysqli_del->multi_query("DELETE from user_interests where user = '" . $username . "' and bucket = '" . $bucket . "';DELETE from user_friends where user = '" . $username . "' and bucket = '" . $bucket . "';DELETE from user_suggestions where user = '" . $username . "' and bucket = '" . $bucket . "'");
	while ($mysqli_del->more_results()) { $mysqli_del->next_result(); } // flush multiquery

//// start ////////////////////////////////////////////////////////////////////////////
	$startTime = time();
	$interests = array();
	$processed = array();

//// previously rejected
	$rejAuthors = array();
	$rejURLs = array();

	$qry = "SELECT bucket, friend, url from suggestions_rejected where user = '" . $username . "' and bucket = '" . $bucket . "'";
	$rejects = $mysqli_wri->query($qry);
	if ($rejects === false) die($mysqli_wri->error);

	while ($rej = $rejects->fetch_row()) {
		// $bucket = $rej[0];
		$friend = $rej[1];
		$url = $rej[2];

		if (!isset($rejAuthors[$friend])) $rejAuthors[$friend] = 2; else $rejAuthors[$friend] += 2;
		$rejURLs[] = $url;
	}

	if ($debug) echo "Rejects: " . (time() - $startTime) . "s<br>";

//// count upvotes
	$upvoteCnts = array();	// count upvotes per sub, only add to interests if >2
	$words = array();

	$qry = "SELECT f.bucket, f.url, u.title, u.author"
		. " from user_upvotes u inner join feeds f ON u.subreddit = f.url and (f.user = u.user or f.user = '')"
		. " WHERE u.user =  '" . $username . "' and f.bucket = '" . $bucket . "'"	//  and (f.user =  '" . $username . "' or f.user = '')
	;

	$votes = $mysqli_wri->query($qry);
	if ($votes === false) die("votes error: " . $mysqli_wri->error . "<br><br>" . $qry);
	else if ($votes->num_rows == 0) {
		if ($debug) die("no votes found for this bucket");
		else return;
	}

	while ($vote = $votes->fetch_row()) {
		// $bucket = $vote[0];
		$url = $vote[1];
		$processed[] = $url;	// skip any already-upvoted suggestions below

		$tit =
			trim(preg_replace("/[^a-z]/", " ", str_replace(array("-", "'"), "", strtolower(
				iconv('UTF-8', 'ASCII//TRANSLIT', html_entity_decode($vote[2]))
			))));
		$author = '/u/' . $vote[3];

		if (!isset($upvoteCnts[$url])) $upvoteCnts[$url] = 1; else $upvoteCnts[$url] += 1;

		if (strtolower(substr($author, -3)) != "bot" && $author != "/u/[deleted]") {
			if (!isset($upvoteCnts[$author])) {
				if (isset($rejAuthors[$friend])) $upvoteCnts[$author] = $rejAuthors[$friend];
				else $upvoteCnts[$author] = 1; 
			}
			else $upvoteCnts[$author] += 1;
		}

		$splitTit = split(" ", $tit);

		$allWords = "";
		foreach ($splitTit as $word) {
			if (
				strlen($word) < $minWordLen
				|| in_array($word, $badInterests, true)
				|| substr($word, -2) == "ly"
				|| substr($word, -3) == "ing"
			) continue;

			// if (substr($word, -3) == "ses") $word = substr($word, 0, strlen($word) - 1);
			// else 
			if (substr($word, -2) == "es") $word = substr($word, 0, strlen($word) - 1);
			else {
				$twoLet = substr($word, -2);
				if (
					substr($word, -1) == "s" 
					&& $twoLet != "as" 
					&& $twoLet != "is" 
					&& $twoLet != "os" 
					&& $twoLet != "ss" 
					&& $twoLet != "us" 
				) $word = substr($word, 0, strlen($word) - 1);
			}

			if (!isset($words[$word])) $words[$word] = 0;
			$words[$word] += max(6, strlen($word));

			if ($allWords != $word) {
				if (substr_count($allWords, " ") > 1) $allWords = substr($allWords, strpos($allWords, " ") + 1);
				$allWords .= ($allWords == "" ? "" : " ") . $word;
				$spaces = substr_count($allWords, " ");

				if (!isset($words[$allWords])) $words[$allWords] = 1;
				else {
					$words[$word] -= 4;
					if ($spaces == 1) {
						$twoWords = substr($allWords, 0, strpos($allWords, " "));	// first word
						$words[$twoWords] -= 4;
					}

					$words[$allWords] += 2; // + $spaces;
					
					// $words[$allWords] += 5;
					// if (substr_count($allWords, " ") == 2) $words[$allWords] += 5;
					// else $words[$allWords] += 4;
				}

				if ($spaces == 2) {
					// $twoWords = substr($allWords, 0, strrpos($allWords, " "));	// first two words
					// if (isset($words[$twoWords])) {
					// 	$words[$twoWords] += 1;
					// 	$words[$allWords] -= 3;
					// }
					
					$twoWords = substr($allWords, strpos($allWords, " ") + 1);	// last two words
					if (isset($words[$twoWords])) {
						$words[$twoWords] += 7;
						$words[$allWords] -= 15;
					}
				}
			}
		}
	}

	arsort($upvoteCnts);

	$sCnt = 0;
	$aCnt = 0;
	foreach ($upvoteCnts as $url => $cnt) {
		if (substr($url, 0, 2) == '/r') {
			if ($sCnt < 25 && $cnt > 2 && !in_array($url, $interests, true)) {
					$interests[] = $url;
					$sCnt++;
			}
		}
		else {
			if ($aCnt < 50 && $cnt > 2 && !in_array($url, $interests, true)) {
					$interests[] = $url;
					$aCnt++;
			}
		}
	}

	arsort($words);
	array_splice($words, $max);

	foreach ($words as $word => $cnt) $interests[] = $word;

	$cnt = 0;
	$aCnt = 0;
	$sCnt = 0;

	$intQry = "";
	foreach ($interests as $word) {
		$rank = $max - $cnt;

		if (substr($word, 0, 3) == "/r/") {
			if ($sCnt >= $sMax) continue;
			$rank = $sMax - $sCnt++;
		}
		else if (substr($word, 0, 3) == "/u/") {
			if ($aCnt >= $max) continue;
			$rank = $sMax - $aCnt++;
		}
		else if ($cnt >= $max) continue;
		else $cnt++;

		$intQry .= 
			",('"
				. $username 
				. "','" . $bucket
				. "','" . $mysqli_wri->real_escape_string($word) . "'"
				. "," . $rank
			. ")"
		;

		$words[$word] = $rank;
	}

	$qry = "INSERT INTO user_interests (user, bucket, interest, rank) VALUES " . substr($intQry, 1);
	$rez = $mysqli_wri->query($qry);
	if ($rez === false) die($mysqli_wri->error);

	$qry =
		"SELECT f.bucket, f.user, f.interest, f.rank from user_interests u"
		. " inner join user_interests f ON f.interest = u.interest"
		. " where f.bucket = '" . $bucket . "' and u.bucket = '" . $bucket . "' and u.user = '" . $username . "' and f.user != '" . $username . "'";

	$friends = $mysqli_wri->query($qry);
	if ($friends === false) die($mysqli_wri->error);
	else if ($friends->num_rows == 0) {
		if ($debug) {
			echo "no friends found for this bucket<br><pre>";
			print_r($interests);
		}
		else return;
	}

	$friendCnts = array();
	while ($friend = $friends->fetch_row()) {
		// $bucket = $friend[0];
		$frienduser = $friend[1];
		$word = $friend[2];
		$rank = $friend[3];

		if (isset($words[$word])) {
			if (!isset($friendCnts[$frienduser])) $friendCnts[$frienduser] = 0;

			$wordRank = array_search($word, $interests);
			if ($wordRank !== false) $friendCnts[$frienduser] += 100 - abs($rank - $wordRank); //  round(($max - abs($rank - $wordRank)) / 100);
		}
	}

	$qry = "";
	$friendCnt = 0;
	arsort($friendCnts);
	
	foreach ($friendCnts as $friend => $cnt) {
		if ($cnt > 2 && $friendCnt < $maxFriends)
			$qry .= ",('" . $bucket . "','" . $username . "','" . $friend . "'," . round($cnt / 10) . ")";

		$friendCnt++;
	}

	if ($qry != "") {
		$qry = "insert into user_friends (bucket, user, friend, rank) values " . substr($qry, 1);
		$friends = $mysqli_wri->query($qry);
		if ($friends === false) die($mysqli_wri->error);
	}
	else if ($debug) { 
		echo "no friends<br><pre>";
		print_r($interests);
		print_r($friendCnts);
		die();
	}
	else return;

	// $qry = "SELECT  FROM user_upvotes"
	if ($debug) echo "Friends: " . (time() - $startTime) . "s<br>";

	$urlScores = array();
	$friendCnt = 0;
	foreach ($friendCnts as $friend => $score) {
		if ($score < 3 || $friendCnt >= $maxFriends) continue;
		$friendCnt++;

		$qry = "SELECT u.thumb, u.title, u.url, u.permalink, u.dt_created from user_upvotes u"
			. " inner join feeds f ON f.user = '' and u.subreddit = f.url"
			. " where u.user = '" . $friend . "' and f.bucket = '" . $bucket . "' and u.dt_created > '" . $period . "'"
		;
		$suggs = $mysqli_wri->query($qry);
		if ($suggs === false) die($mysqli_wri->error);

		$lowDate = time();
		while ($sugg = $suggs->fetch_row()) {
			$url = $mysqli_wri->real_escape_string($sugg[2]);
			if (isset($urlScores[$url])) $urlScores[$url] += $score; else $urlScores[$url] = 0;

			$dt = strtotime($sugg[4]);
			if ($dt > 0 && $dt < $lowDate) $lowDate = $dt;
		}

		$qry = "";
		$suggs->data_seek(0);
		while ($sugg = $suggs->fetch_row()) {
			$thumb = $sugg[0];
			$tit = $mysqli_wri->real_escape_string($sugg[1]);
			$perma = $sugg[3];

			$url = $mysqli_wri->real_escape_string($sugg[2]);
			if (in_array($url, $processed)) continue;
			$processed[] = $url;

			$dt = $sugg[4];
			$dtc = strtotime($sugg[4]);
			if ($dtc < $lowDate) $dtc = $lowDate;

			$hotScore = $dtc - $lowDate + $score;
			if (isset($urlScores[$url])) $hotScore += $urlScores[$url];

			if (
				$hotScore <= 0
				|| in_array($url, $rejURLs)
				|| $url == str_ireplace($okdomains[$bucket], "", $url)
			) continue; // $hotScore = 0;
		
			// user, friend, kind, bucket, thumb, label, url, permalink, hotScore
			$qry .=
				",('" 
					. $username 
					. "','" . $friend 
					. "','link','"
					. $bucket
					. "','" . $thumb
					. "','" . $tit
					. "','" . $url
					. "','" . $perma
					. "','" // . no $source
					. "'," . $hotScore
					. "," . $score
			 	. ")"
			;
		}


		$feedQry = 
			"SELECT source, label, descrip, url from feeds"
				. " where cat != '~a|Playlists' and user = '" . $friend . "' and bucket = '" . $bucket . "'" // " and u.dt_created > '" . $period . "'"
				. " and url NOT IN (select url from feeds where user = '" . $username . "')"
				. " order by dt_created DESC"
				// . " and url NOT LIKE '%v=%'"	// Omit stray youtube vids.
				// . " group by url order by count(*) DESC"
		;
		$suggs = $mysqli_wri->query($feedQry);
		if ($suggs === false) die($mysqli_wri->error);

		$cnt = 0;
		while ($sugg = $suggs->fetch_row()) {
			if ($cnt > 2) continue;

			$source = $sugg[0];
			$tit = $mysqli_wri->real_escape_string($sugg[1]);
			$descrip = $mysqli_wri->real_escape_string($sugg[2]);
			$url = $mysqli_wri->real_escape_string($sugg[3]);

			$hotScore = $score + $cnt;
			if (isset($urlScores[$url])) {
				$urlScores[$url] += $score;
				$hotScore += $urlScores[$url];
			} 
			else $urlScores[$url] = 0;

			// user, friend, kind, bucket, thumb, label, url, permalink, hotScore
			$qry .=
				",('" 
					. $username 
					. "','" . $friend 
					. "','feed','"
					. $bucket
					. "','" // . no $thumb
					. "','" . $tit
					. "','" . $url
					. "','" // . no $perma
					. "','" . $source
					. "'," . $hotScore
					. "," . $score
			 	. ")"
			;

			$cnt++;
		}

		if ($qry != "") {
			$qry = "INSERT INTO user_suggestions (user, friend, kind, bucket, thumb, label, url, permalink, source, hotScore, score) VALUES " . substr($qry, 1);
			$ins = $mysqli_wri->query($qry);
			if ($ins === false) die("ins error: " . $mysqli_wri->error . "<br><br>" . $qry);
		}
	}

	if ($debug) {
		echo "<hr>Runtime: " . (time() - $startTime) . "s<br><hr>";
		echo "<pre>";
		print_r($friendCnts);
		echo "</pre><hr><pre>";
		print_r($interests);
	}
?>