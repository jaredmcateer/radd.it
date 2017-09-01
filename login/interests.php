<?php
	setlocale(LC_ALL, 'en_US.UTF8');

	$debug = false;
	$startTime = time();

	if (!isset($vars)) $vars = include "../php/vars.php";
	if (!isset($mysqli)) {
		$mysqli = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
		if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
		$mysqli->set_charset("utf8");
	}

	if (!isset($username)) {
		$username = 'radd_it';
		if (!empty($_GET["u"])) $username = $mysqli->real_escape_string($_GET["u"]);
	}
	
	if (!isset($mysqli_del)) {
		$mysqli_del = new mysqli($vars['dbserver'], $vars['dbdel']['user'], $vars['dbdel']['pass'], $vars['dbname']);
		$mysqli_del->set_charset("utf8");
	}

	$qry = "DELETE from user_interests where user = '" . $username . "';DELETE from user_friends where user = '" . $username . "'";
	$mysqli_del->multi_query($qry);
	while ($mysqli_del->more_results()) { $mysqli_del->next_result(); } // flush multiquery

	$interests = array();

	$max = 75;		// Number of interests to save.
	$minWordLen = 3;
	$badInterests = array(
		"the", "and", "you", "ive", "yet", "but", "too", "for", "yes", "are", "ill", "sub", "all", "pic", "min", "max", "who", "its"
		, "new", "not", "bad", "off", "her", "his", "big", "man", "see", "out", "how", "did", "was", "now", "way", "she", "guy", "get"
		, "got", "has", "can", "top", "hot", "old", "hey", "own", "our", "mic", "aic", "men", "fat", "nprs", "may", "eat", "alt", "url"
		, "sfw", "mfw", "tfw", "irl", "thy", "let", "via", "fap", "had", "him", "why", "boy", "gif", "day"

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
		, "over", "times", "posts", "tonight", "morning", "afternoon", "guest", "various", "artists", "record", "doing", "version"
		, "drunken", "stunning", "dreamy", "dicker", "sexy", "powerful", "directed", "electronic", "live", "perf", "performance"
		, "somebody", "details", "gonna", "gunna", "level", "part", "starts", "amazed", "arent", "sound", "alternative", "indie"
		, "audio", "soundtrack", "listentothis", "enough", "season", "miss", "mister", "gives", "thinks", "huge", "went", "wont"
		, "link", "while", "quite", "prepare", "seasons", "shows", "offers", "sometimes", "means", "best", "nsfw", "thou", "shall"
		, "parts", "wheres", "would", "alot", "looks", "wear", "come", "same", "says", "wrote", "found", "whod", "thought", "knew"
		, "much", "many", "friends", "know", "could", "happen", "lets", "roll", "words", "word", "clean", "lady", "wonderful", "girl"
		, "awesome", "been", "last", "verification", "took", "hope", "might", "almost", "sure", "another", "watch", "better", "likes"
		, "cakeday", "thank", "heard", "needed", "youve", "yall", "youre", "already", "around", "again", "give", "later", "every"
		, "sent", "into", "left", "leave", "mine", "must", "until", "whos", "tell", "others", "other", "late", "everyday", "maybe"
		, "night", "then", "start", "stop", "wish", "brings", "bring", "proof", "agreed", "agree", "should", "pics", "there", "without"
		, "theres"

		, "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"
		, "zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"
	);

	// $qry = "SELECT feeds.bucket, subs.url FROM user_subs subs left join feeds on subs.url = feeds.url WHERE subs.user =  '" . $username . "' and (feeds.user =  '" . $username . "' or feeds.user = '')";
	// $subs = $mysqli->query($qry);
	// if ($subs === false) die($mysqli->error);

	// while ($sub = $subs->fetch_row()) {
	// 	$bucket = $sub[0];
	// 	if ($bucket == "") continue;

	// 	$url = strtolower($sub[1]);
	// 	if (substr($url, 0, 3) != "/r/") continue;

	// 	if (!isset($interests[$bucket])) $interests[$bucket] = array();
	// 	if (!in_array($url, $interests[$bucket])) $interests[$bucket][] = $url;
	// }

	// $qry = "SELECT bucket, url from feeds WHERE user =  '" . $username . "'";
	// $feeds = $mysqli->query($qry);
	// while ($feed = $feeds->fetch_row()) {
	// 	$bucket = $feed[0];
	// 	$url = strtolower($feed[1]);
	// 	if (substr($url, 0, 3) != "/r/") continue;

	// 	if (!isset($interests[$bucket])) $interests[$bucket] = array();
	// 	if (!in_array($url, $interests[$bucket], true)) $interests[$bucket][] = $url;
	// }

	$upvoteCnts = array();	// count upvotes per sub, only add to interests if >2
	$words = array();

	// $qry = "SELECT bucket, url, label from likes WHERE user =  '" . $username . "'";
	// $votes = $mysqli->query($qry);
	// if ($votes === false) die($mysqli->error);
	// while ($vote = $votes->fetch_row()) {
	// 	$bucket = $vote[0];
	// 	$url = strtolower($vote[1]);

	// 	if (!isset($upvoteCnts[$url])) $upvoteCnts[$url] = 1; else $upvoteCnts[$url] += 1;

	// 	if ($upvoteCnts[$url] > 2) {
	// 		if (!isset($interests[$bucket])) $interests[$bucket] = array();
	// 		if (!in_array($url, $interests[$bucket], true)) $interests[$bucket][] = $url;
	// 	}

	// 	$tit = 
	// 		trim(preg_replace("/[^a-z]/", " ", str_replace(array("-", "'"), "", strtolower(
	// 			iconv('UTF-8', 'ASCII//TRANSLIT', html_entity_decode($vote[2]))
	// 		))));

	// 	$allWords = "";
	// 	$splitTit = split(" ", $tit);
	// 	foreach ($splitTit as $word) {
	// 		if (strlen($word) < $minWordLen || in_array($word, $badInterests, true) || substr($word, -2) == "ly" || substr($word, -3) == "ing")
	// 			continue;

	// 		if (!isset($words[$bucket])) $words[$bucket] = array();

	// 		if (!isset($words[$bucket][$word])) $words[$bucket][$word] = 1;
	// 		else $words[$bucket][$word] += 4;

	// 		if ($allWords != $word) {
	// 			if (substr_count($allWords, " ") > 1) $allWords = substr($allWords, strpos($allWords, " ") + 1);
	// 			$allWords .= ($allWords == "" ? "" : " ") . $word;

	// 			if (!isset($words[$bucket][$allWords])) $words[$bucket][$allWords] = 3;
	// 			else {
	// 				$words[$bucket][$word] -= 2;

	// 				if (substr_count($allWords, " ") == 2) $words[$bucket][$allWords] += 8;
	// 				else  $words[$bucket][$allWords] += 5;
	// 			}

	// 			if (substr_count($allWords, " ") > 1) {
	// 				$twoWords = substr($allWords, strpos($allWords, " ") + 1);
	// 				$words[$bucket][$twoWords] += 2;

	// 				$twoWords = substr($allWords, 0, strrpos($allWords, " "));
	// 				$words[$bucket][$twoWords] += 2;
	// 			}
	// 		}
	// 	}
	// }

	$qry = "SELECT f.bucket, f.url, u.title, u.author"
		. " from user_upvotes u inner join feeds f ON u.subreddit = f.url"
		. " WHERE u.user =  '" . $username . "' and (f.user =  '" . $username . "' or f.user = '')";

	$votes = $mysqli->query($qry);
	if ($votes === false) die($mysqli->error);
	while ($vote = $votes->fetch_row()) {
		$bucket = $vote[0];
		$url = strtolower($vote[1]);
		$tit =
			trim(preg_replace("/[^a-z]/", " ", str_replace(array("-", "'"), "", strtolower(
				iconv('UTF-8', 'ASCII//TRANSLIT', html_entity_decode($vote[2]))
			))));
		$author = '/u/' . $vote[3];

		if (!isset($upvoteCnts[$bucket])) $upvoteCnts[$bucket] = array();
		if (!isset($upvoteCnts[$bucket][$url])) $upvoteCnts[$bucket][$url] = 1; else $upvoteCnts[$bucket][$url] += 1;

		if (strtolower(substr($author, -3)) != "bot") {
			if (!isset($upvoteCnts[$bucket][$author])) $upvoteCnts[$bucket][$author] = 1; else $upvoteCnts[$bucket][$author] += 1;
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

			if (!isset($words[$bucket])) $words[$bucket] = array();

			if (!isset($words[$bucket][$word])) $words[$bucket][$word] = 1;
			else $words[$bucket][$word] += 4;

			if ($allWords != $word) {
				if (substr_count($allWords, " ") > 1) $allWords = substr($allWords, strpos($allWords, " ") + 1);
				$allWords .= ($allWords == "" ? "" : " ") . $word;

				if (!isset($words[$bucket][$allWords])) $words[$bucket][$allWords] = 3;
				else {
					$words[$bucket][$word] -= 6;
					// $words[$bucket][$allWords] += 5;
					
					if (substr_count($allWords, " ") == 2) $words[$bucket][$allWords] += 6;
					else $words[$bucket][$allWords] += 4;
				}

				if (substr_count($allWords, " ") > 1) {
					$twoWords = substr($allWords, 0, strrpos($allWords, " "));	// first two words
					if (isset($words[$bucket][$twoWords])) {
						$words[$bucket][$twoWords] += 2;
						// $words[$bucket][$allWords] -= 3;
					}
					
					$twoWords = substr($allWords, strpos($allWords, " ") + 1);	// last two words
					if (isset($words[$bucket][$twoWords])) {
						$words[$bucket][$twoWords] += 2;
						// $words[$bucket][$allWords] -= 3;
					}
				}
			}
		}
	}



	// asort($words);
	foreach ($vars["buckets"] as $bucket) {
// echo "<hr><h1>" . $bucket . "</h1><br><br>";
// echo "</pre><hr><pre>";

		if (isset($upvoteCnts[$bucket])) {
			arsort($upvoteCnts[$bucket]);

			$sCnt = 0;
			$aCnt = 0;
			foreach ($upvoteCnts[$bucket] as $url => $cnt) {
				if (substr($url, 0, 2) == '/r') {
					if ($sCnt < 25) {
						if (!isset($interests[$bucket])) $interests[$bucket] = array();

						if ($cnt > 2 && !in_array($url, $interests[$bucket], true)) {
							$interests[$bucket][] = $url;
							$sCnt++;
						}
					}

				}
				else {
					if ($aCnt < 50) {
						if (!isset($interests[$bucket])) $interests[$bucket] = array();

						if ($cnt > 2 && !in_array($url, $interests[$bucket], true)) {
							$interests[$bucket][] = $url;
							$aCnt++;
						}
					}
				}
			}
		}



// arsort($words[$bucket]);
// print_r($words[$bucket]);

		if (isset($words[$bucket])) {
		// 	arsort($words[$bucket]);
		// 	// array_splice($words[$bucket], 250);

		// 	foreach ($words[$bucket] as $word => $cnt) {
		// 		if (substr_count($word, " ") == 1) {	// if we have an interest w/ a space in it, remove all the individual words
		// 			$splitTit = split(" ", $word);
		// 			// $spaceCnt = substr_count($word, " ") + 1;

		// 			foreach ($splitTit as $aWord) {
		// 				foreach ($words[$bucket] as $inWord => $inCnt) {
		// 					if ($inWord == $word) continue;
		// 					// else if (strpos($inWord, $aWord) !== false) {
		// 					// 		$words[$bucket][$inWord] -= round($cnt / $spaceCnt);
		// 					// 		if ($debug) echo "-" . round($cnt / $spaceCnt) . " to " . $inWord . "<br>";
		// 					// 	}

		// 					// if single word is higher in the list, remove it
		// 					else if ($inWord == $aWord) // unset($words[$bucket][$inWord]);	
		// 					{
		// 						if ($inCnt > $cnt) {
		// 							$words[$bucket][$inWord] -= $cnt * 2;
		// 							// if ($debug) echo "<b>-" . ($cnt * 2) . " to " . $inWord . "</b><br>";
		// 						}
		// 						else {
		// 							$words[$bucket][$inWord] -= $cnt;
		// 							// if ($debug) echo "-" . ($cnt) . " to " . $inWord . "<br>";
		// 						}
		// 					}
		// 					// else if the string contains the single word, bump it
		// 					// else if (
		// 					// 	$inWord != $word
		// 					// 	&& strpos($inWord, $aWord) !== false
		// 					// 	&& $spaceCnt == substr_count($inWord, " ")
		// 					// 	&& $inCnt < $cnt
		// 					// ) {
		// 					// 	$words[$bucket][$inWord] += round($cnt / 4);
		// 					// 	if ($debug) echo "+" . round($cnt / 4) . " to " . $inWord . "<br>";
		// 					// }
		// 				}
		// 			}
		// 		}
		// 	}

			arsort($words[$bucket]);
			array_splice($words[$bucket], $max);

			foreach ($words[$bucket] as $word => $cnt) $interests[$bucket][] = $word;
				// if ($cnt > 0) $interests[$bucket][] = $word;

// 			$highCnt = 0;
// 			foreach ($words[$bucket] as $word => $cnt) if ($cnt > $highCnt) $highCnt = $cnt;
// // echo "High: " . $highCnt . "<br>";

// 			$minCnt = floor($highCnt / 10);
// 			if ($minCnt < 5) $minCnt = 5;
// // echo "Min: " . $minCnt . "<br>";
// 			foreach ($words[$bucket] as $word => $cnt) {
// // echo $cnt . " "	. $word . "<br>";
// 				if ($cnt > $minCnt && strlen($word) > 3) {
// 					if (!isset($interests[$bucket])) $interests[$bucket] = array();

// 					$append = true;
// 					foreach ($interests[$bucket] as $intKey => $intVal)
// 						if (strpos($intVal, $word) === 0) $append = false;
// 					if ($append) $interests[$bucket][] = $word;

// 					// if (!in_array($word, $interests[$bucket])) $interests[$bucket][] = $word;
// 				}
// 			}
		}
	}

	//////////////// SCRUB //////////////////////////////////////////////////////////////
	// foreach ($vars["buckets"] as $bucket) {
	// 	if (isset($interests[$bucket])) {

	// 		foreach ($interests[$bucket] as $i => $word) {
	// 			if (substr_count($word, " ") > 0) {	// if we have an interest w/ a space in it, remove all the individual words
	// 				$splitTit = split(" ", $word);
	// 				$twoWords = "";
	// 				foreach ($splitTit as $aWord) {
	// 					$idx = array_search($aWord, $interests[$bucket], true);
	// 					if ($idx !== false && ($idx - $i) < 3) unset($interests[$bucket][$idx]);

	// 					$twoWords .= ($twoWords == "" ? "" : " ") . $aWord;
	// 					if (substr_count($twoWords, " ") > 1) $twoWords = substr($twoWords, strpos($twoWords, " ") + 1);
	// 					if (substr_count($twoWords, " ") == 1 && substr_count($word, " ") == 2) {
	// 						$idx = array_search($twoWords, $interests[$bucket], true);
	// 						if ($idx !== false && ($idx - $i) < 3) {
	// 							unset($interests[$bucket][$idx]); 
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// }

	$qry = "";
	foreach ($vars["buckets"] as $bucket)
		if (isset($interests[$bucket])) {
			$cnt = 0;
			$aCnt = 0;
			$sCnt = 0;

			foreach ($interests[$bucket] as $word) {
				$rank = $max - $cnt;

				if (substr($word, 0, 3) == "/r/") {
					if ($sCnt >= $max) continue;
					$rank = $max - $sCnt++;
				}
				if (substr($word, 0, 3) == "/u/") {
					if ($aCnt >= $max) continue;
					$rank = $max - $aCnt++;
				}
				else if ($cnt >= $max) continue;

				$qry .= 
					",('"
						. $username 
						. "','" . $bucket
						. "','" . $mysqli->real_escape_string($word) . "'"
						. "," . $rank
					. ")"
				;

				$words[$bucket][$word] = $rank;
				if (substr($word, 0, 1) != "/") $cnt++;
			}
		}

	if ($qry != "") {
		$qry = str_replace("VALUES ,(", "VALUES (", "INSERT INTO user_interests (user, bucket, interest, rank) VALUES " . $qry);
		$rez = $mysqli->query($qry);
		if ($rez === false) die($mysqli->error);
	}

///*
	$qry = "SELECT f.bucket, f.user, f.interest, f.rank from user_interests f inner join user_interests u ON f.bucket = u.bucket and f.interest = u.interest where f.user != '" . $username . "'";

	$friends = $mysqli->query($qry);
	if ($friends === false) die($mysqli->error);

	$friendCnts = array();
	while ($friend = $friends->fetch_row()) {
		$bucket = $friend[0];
		$frienduser = $friend[1];
		$word = $friend[2];
		$rank = $friend[3];

		if (!isset($friendCnts[$bucket])) $friendCnts[$bucket] = array();

		if (isset($words[$bucket][$word])) {
			if (!isset($friendCnts[$bucket][$frienduser])) $friendCnts[$bucket][$frienduser] = 0;

			$wordRank = array_search($word, $interests[$bucket]);
			if ($wordRank !== false) $friendCnts[$bucket][$frienduser] += round(($rank - $wordRank) / 10);
		}
	}

	$qry = "";
	foreach ($vars["buckets"] as $bucket) {
		if (isset($friendCnts[$bucket])) {
			arsort($friendCnts[$bucket]);
			
			foreach ($friendCnts[$bucket] as $friend => $cnt)
				if ($cnt > 2) $qry .= ",('" . $bucket . "','" . $username . "','" . $friend . "'," . $cnt . ")";
		}
	}

	if ($qry != "") {
		$qry = "insert into user_friends (bucket, user, friend, rank) values " . substr($qry, 1);
		$friends = $mysqli->query($qry);
		if ($friends === false) die($mysqli->error);
	}



//*/
	if ($debug) {
		echo "Runtime: " . (time() - $startTime) . "s<br><hr>";
		echo "<pre>";
		print_r($friendCnts);
		echo "</pre><hr><pre>";
		print_r($interests);
	}
?>
