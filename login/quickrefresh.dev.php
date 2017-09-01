<?php
	$updateUpvotes = true;
	$updateSuggestions = false;

	$isEmbed = false;
	if (substr_count($_SERVER['HTTP_HOST'], "embed.") > 0) $isEmbed = true;

	if (!isset($_GET["debug"])) {
		if (empty($_COOKIE["user"]) || empty($_COOKIE["reddit_refresh"])) return;
		else if (!empty($_COOKIE["reddit_token"])) {
			if (empty($bucket) || isset($_COOKIE[$bucket . "_suggs"])) return;
			else $updateUpvotes = false;
		}
	}

	chdir(dirname(__FILE__));
	if (!isset($vars)) $vars = include "../php/vars.php";
	if (!isset($username)) $username = $_COOKIE["user"];

	if (!isset($mysqli_wri)) {
		$mysqli_wri = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
		if ($mysqli_wri->connect_error) die('{"error":"Connect Error (' . $mysqli_wri->connect_errno . ') ' . $mysqli_wri->connect_error . '"}'); 
		$mysqli_wri->set_charset("utf8");
	}

	if (!isset($client)) {
		require_once("reddit/creds.php");
		require_once("reddit/Client.php");
		require_once("reddit/GrantType/IGrantType.php");
		require_once("reddit/GrantType/RefreshToken.php");
		$client = new OAuth2\Client($clientId, $clientSecret, OAuth2\Client::AUTH_TYPE_AUTHORIZATION_BASIC);
	}

	try {
		// if (!empty($_COOKIE["reddit_token"])) $accToken = $_COOKIE["reddit_token"];
		// else {
		if (!empty($bucket) && !isset($_COOKIE[$bucket . "_suggs"])) {
			$updateSuggestions = true;
			setcookie($bucket . "_suggs", "true", time() + (3600 * 22), "/", "radd.it");
		}

		if (empty($_COOKIE["reddit_token"])) {
			$response = $client->getAccessToken(
				$accessTokenUrl
				, "refresh_token"
				, array("refresh_token" => $_COOKIE["reddit_refresh"])
			);
			
			$accessTokenResult = $response["result"];
			if (isset($accessTokenResult["access_token"])) {
				$accToken = $accessTokenResult["access_token"];
				setcookie("reddit_token", $accessTokenResult["access_token"], time() + 3600, "/", "radd.it");

			}
			else {
				setcookie("user", "", time() - 3600, "/", "radd.it");
				setcookie("userhash", "", time() - 3600, "/", "radd.it");
				setcookie("reddit_refresh", "", time() - 3600, "/", "radd.it");
				
				die('<p>Could not get access token from reddit!  Please <a href="/login">log-in again</a>.</p>');
			}

			if (!$isEmbed) {
				ob_implicit_flush(true);
				ob_end_flush();
				echo "<div style='width:80%;padding:10%;text-align:center;' id='loadingmsg'><h1>Refreshing reddit login..";
			}

		    $client->setAccessToken($accToken);
		    $client->setAccessTokenType(OAuth2\Client::ACCESS_TOKEN_BEARER);

			if (!$isEmbed) echo " done.</h1>";

			if ($updateUpvotes) {
				if (!$isEmbed) echo "<h1>Getting upvotes";

				// update user's upvotes
				$after = "";
				do {
					if (!$isEmbed) echo ".";

					$lastAfter = $after;

					$response = $client->fetch(
						"https://oauth.reddit.com/user/" . $username . "/upvoted?limit=100"
						. ($after == "" ? "" : "&after=" . $after)
					);

					$posts = $response["result"]["data"]["children"];
					if (count($posts) == 0) $after = "";
					else {
					    foreach ($posts as $key => $val) {
					    	$post = $val["data"];
							$after = $post["name"];

						    if (
						    	$val["kind"] === "t3"
						    	// && $post["author"] !== $username
						    	&& substr_count($post["url"], "reddit.com/") == 0
						    ) {
								if ($mysqli_wri->query(
									'insert into user_upvotes (user, id_reddit, title, url, subreddit, permalink, author, thumb) values ('
										. '"' . $mysqli_wri->real_escape_string($username) . '"'
										. ',"' . $mysqli_wri->real_escape_string($post["name"]) . '"'
										. ',"' . $mysqli_wri->real_escape_string($post["title"]) . '"'
										. ',"' . $mysqli_wri->real_escape_string($post["url"]) . '"'
										. ',"/r/' . $mysqli_wri->real_escape_string($post["subreddit"]) . '"'
										. ',"' . $mysqli_wri->real_escape_string($post["permalink"]) . '"'
										. ',"' . $mysqli_wri->real_escape_string($post["author"]) . '"'
										. ',"' . $mysqli_wri->real_escape_string($post["thumbnail"]) . '"'
									. ')'
								) === false) { $after = ""; continue; } // on db error, it's a dupe record.  we're done.
						    }
						}
					}
					
					if ($after == $lastAfter) $after = "";
				} while ($after != "");
			}	// end: if ($updateUpvotes)
		}
		else if (!$isEmbed) {
			ob_implicit_flush(true);
			ob_end_flush();
			echo "<div style='width:80%;padding:10%;text-align:center;' id='loadingmsg'>";
		}
	} catch (Exception $e) { die('{"error":"' . $e->getMessage() . '"}'); }

	if ($updateUpvotes && !$isEmbed) echo " done!</h1>";

	if ($updateSuggestions && !$isEmbed) {
		echo "<h1>Updating suggestions..";
		include "quickinterests.php";
		echo " done!</h1>";
	}

	// echo "</h1></div><script>setTimeout(function() { $('#loadingmsg').remove(); });</script>";

	if (!$isEmbed)  {
		echo "<h1>Sending you back...</h1></div><script>setTimeout(function() { window.location.href = '" . $_SERVER['REQUEST_URI'] . "'; }, 2000);</script>";
		die();
	}
	// ob_implicit_flush(false);

	// return $client;
?>