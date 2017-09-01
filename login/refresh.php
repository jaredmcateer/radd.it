<?php
	if (empty($_COOKIE["reddit_refresh"])) die('{"error":"No refresh token found!  Please logout and log-in again to use this feature."}');

	chdir(dirname(__FILE__));
	$vars = include "../php/vars.php";
	$username = $_COOKIE["user"];
/*
	$threeDays = strtotime("3 days ago");
	// $monthAgo = strtotime("1 month ago");

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
*/
	require_once("reddit/creds.php");
	require_once("reddit/Client.php");
	require_once("reddit/GrantType/IGrantType.php");
	require_once("reddit/GrantType/RefreshToken.php");
	$client = new OAuth2\Client($clientId, $clientSecret, OAuth2\Client::AUTH_TYPE_AUTHORIZATION_BASIC);

	$mysqli = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('{"error":"Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error . '"}'); 
	$mysqli->set_charset("utf8");

	try {
		if (empty($_COOKIE["reddit_token"])) {
			$response = $client->getAccessToken(
				$accessTokenUrl
				, "refresh_token"
				, array("refresh_token" => $_COOKIE["reddit_refresh"])
			);

			$accessTokenResult = $response["result"];
			if (isset($accessTokenResult["access_token"])) {
				setcookie("reddit_token", $accessTokenResult["access_token"], time() + 3600, "/", "radd.it");

			    $client->setAccessToken($accessTokenResult["access_token"]);
			    $client->setAccessTokenType(OAuth2\Client::ACCESS_TOKEN_BEARER);
			}
			else {
				setcookie("user", "", time() - 3600, "/", "radd.it");
				setcookie("userhash", "", time() - 3600, "/", "radd.it");
				setcookie("reddit_refresh", "", time() - 3600, "/", "radd.it");
				
				die('{"error":"Failed to get access token from reddit!  Please log-in again."}');
			}

			// update user's upvotes
			$after = "";
			do {
				$lastAfter = $after;

				$response = $client->fetch(
					"https://oauth.reddit.com/user/" . $username . "/upvoted?limit=100"
					. ($after === "" ? "" : "&after=" . $after)
				);

				$posts = $response["result"]["data"]["children"];
				if (count($posts) === 0) $after = "";
				else {
				    foreach ($posts as $key => $val) {
				    	$post = $val["data"];
						$after = $post["name"];

					    if (
					    	$val["kind"] === "t3"
					    	// && $post["author"] !== $username
					    	&& substr_count($post["url"], "reddit.com/") == 0
					    ) {
							if ($mysqli->query(
								'insert into user_upvotes (user, id_reddit, title, url, subreddit, permalink, author, thumb) values ('
									. '"' . $mysqli->real_escape_string($username) . '"'
									. ',"' . $mysqli->real_escape_string($post["name"]) . '"'
									. ',"' . $mysqli->real_escape_string($post["title"]) . '"'
									. ',"' . $mysqli->real_escape_string($post["url"]) . '"'
									. ',"/r/' . $mysqli->real_escape_string($post["subreddit"]) . '"'
									. ',"' . $mysqli->real_escape_string($post["permalink"]) . '"'
									. ',"' . $mysqli->real_escape_string($post["author"]) . '"'
									. ',"' . $mysqli->real_escape_string($post["thumbnail"]) . '"'
								. ')'
							) === false) { $after = ""; continue; } // on db error, it's a dupe record.  we're done.
					    }
					}
				}
				
				if ($after == $lastAfter) $after = "";
			} while ($after != "");

			// get subscribed subreddits
			$response = $client->fetch("https://oauth.reddit.com/subreddits/mine/subscriber?show=all");
			$subs = $response["result"]["data"]["children"];
			foreach ($subs as $key => $val) 
				if ($val["kind"] == "t5" && $val["data"]["subreddit_type"] != "private") {
					$val["data"]["url"] = substr($val["data"]["url"], 0, strlen($val["data"]["url"]) - 1);	// remove trailing /

					$mysqli->query(
						'insert into user_subs (user, source, name, url, label, descrip) values ('
							. '"' . $mysqli->real_escape_string($username) . '"'
							. ',"reddit"'
							. ',"' . $mysqli->real_escape_string($val["data"]["display_name"]) . '"'
							. ',"' . $mysqli->real_escape_string($val["data"]["url"]) . '"'
							. ',"' . $mysqli->real_escape_string($val["data"]["title"]) . '"'
							. ',"' . $mysqli->real_escape_string(strip_tags(html_entity_decode($val["data"]["description_html"]))) . '"'
						. ')'
					); 
				}

			// get public multireddits
			$response = $client->fetch("https://oauth.reddit.com/api/multi/mine");
			$multis = $response["result"];
			foreach ($multis as $key => $value) {
			    if ($value["kind"] === "LabeledMulti" && $value["data"]["visibility"] === "public") {
					$mysqli->query(
						'insert into user_subs (user, source, is_multi, name, url, label, descrip) values ('
							. '"' . $mysqli->real_escape_string($username) . '"'
							. ',"reddit"'
							. ',1'	// is multireddit
							. ',"multi/' . $mysqli->real_escape_string($value["data"]["display_name"]) . '"'
							. ',"' . $mysqli->real_escape_string($value["data"]["path"]) . '"'
							. ',"' . $mysqli->real_escape_string($value["data"]["display_name"]) . '"'
							. ',"' . $mysqli->real_escape_string(strip_tags(html_entity_decode($val["data"]["description_html"]))) . '"'
						. ')'
					); 
			    }
			}			
		}
		else {
		    $client->setAccessToken($_COOKIE["reddit_token"]);
		    $client->setAccessTokenType(OAuth2\Client::ACCESS_TOKEN_BEARER);		
		}
	}
	catch (Exception $e) { die('{"error":"' . $e->getMessage() . '"}'); }

	// if (!isset($_COOKIE["has_suggestions"])) {
	// 	setcookie("has_suggestions", "true", time() + (3600 * 22), "/", "radd.it");
	// 	include "interests.php";
	// }

	return $client;
?>