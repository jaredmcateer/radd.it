<!DOCTYPE html>
<?php
	$loginHours = 24 * 365;
?>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no"/>
  <title>two-oh</title>

  <!-- CSS  -->
  <link href="/css/materialize.css" type="text/css" rel="stylesheet" media="screen,projection"/>
  <link href="/css/style.css" type="text/css" rel="stylesheet" media="screen,projection"/>
  
  <link rel="icon" href="/img/favicon.ico" type="image/x-icon" />
  <link rel="shortcut icon" href="/img/favicon.ico" type="image/x-icon" />
</head>
<body>
  <nav class="blue-grey darken-4" role="navigation">
    <div class="container">
      <div class="nav-wrapper">
        <a id="logo-container" href="#" class="brand-logo"><img src="/img/raddit_logo.png"></a>
        <ul class="right hide-on-small-only"><li>...</li></ul>
      </div>
    </div>
  </nav>
  <div class="container" style="text-align:center;font-size:32px;margin-top:50px">
    <div class="section">
      <div class="row">
        <div class="col s8 offset-s2">
<?php
	date_default_timezone_set("UTC");

	if (isset($_GET["error"])) die('<pre>OAuth Error: ' . htmlspecialchars($_GET["error"]) .'\n</pre><br><br><a href="/login">Retry login</a>');
	else if (!isset($_GET["code"])) die('<pre>Error: No reddit \"code\" data found!\n</pre><br><br><a href="/login">Retry login</a>');

	$redirect = "/";	// where to send user after this page.
	if (isset($_COOKIE["redirect"])) {
		$redirect = $_COOKIE["redirect"];
		setcookie("redirect", "", time() - 3600, "/", "radd.it");
	}

	require_once("reddit/creds.php");
	require_once("reddit/Client.php");
	require_once("reddit/GrantType/IGrantType.php");
	require_once("reddit/GrantType/AuthorizationCode.php");
	$client = new OAuth2\Client($clientId, $clientSecret, OAuth2\Client::AUTH_TYPE_AUTHORIZATION_BASIC);

	// echo "getting code from reddit.. ";
	$response = $client->getAccessToken($accessTokenUrl, "authorization_code", array("code" => $_GET["code"], "redirect_uri" => $redirectUrl));
	$accessTokenResult = $response["result"];
	if (isset($accessTokenResult["access_token"]) && isset($accessTokenResult["refresh_token"])) {
		setcookie("reddit_token", $accessTokenResult["access_token"], time() + 3600, "/", "radd.it");
		setcookie("reddit_refresh", $accessTokenResult["refresh_token"], time() + (3600 * $loginHours), "/", "radd.it");
		// setcookie("has_suggestions", "true", time() + (3600 * 22), "/", "radd.it");
	}
	else {
		setcookie("user", "", time() - 3600, "/", "radd.it");
		setcookie("userhash", "", time() - 3600, "/", "radd.it");
		setcookie("reddit_token", "", time() - 3600, "/", "radd.it");
		setcookie("reddit_refresh", "", time() - 3600, "/", "radd.it");

		die("<pre>Error: No reddit access token found!\n");
	}

	$vars = include "../php/vars.php";

    $client->setAccessToken($accessTokenResult["access_token"]);
    $client->setAccessTokenType(OAuth2\Client::ACCESS_TOKEN_BEARER);

	$user = $client->fetch("https://oauth.reddit.com/api/v1/me");
	if (isset($user["result"]) && !empty($user["result"]["name"])) {
		$username = $user["result"]["name"];
		setcookie("user", $username, time() + 3600 * $loginHours, "/", "radd.it");
		setcookie("userhash", hash("haval192,3", $vars['hashPrefix'] . $username), time() + (3600 * $loginHours), "/", "radd.it");
	}
	else {		// no username found, clear it.
		setcookie("user", "", time() - 3600, "/", "radd.it");
		setcookie("userhash", "", time() - 3600, "/", "radd.it");
		setcookie("reddit_token", "", time() - 3600, "/", "radd.it");
		die("<pre>Error: couldn't get user data!\n");
	}

	// We want to send updates to the client as we go, so turn on implicit buffer flushing.
	ob_implicit_flush(true);
	ob_end_flush();
	echo "Logged in!<br>";

	// $vars = include "../php/vars.php";
	$mysqli = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	$mysqli->set_charset("utf8");

	sleep(1); echo "Getting subreddits.. ";
	$cnt = 0;
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

			$cnt++;
		}

	echo "<br>" . $cnt . " found.<br>";
	$cnt = 0;

	sleep(1); echo "Getting multireddits.. ";
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

			$cnt++;
	    }
	}

	echo "<br>" . $cnt . " found.<br>";
	$cnt = 0;

	echo "Getting upvotes";
	$after = "";
	do {
		$lastAfter = $after;

		sleep(1);
		echo ".";	// progress dots!
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

					$cnt++;
			    }
			}
		}
		
		// if (empty($response["result"]["data"]["after"]) || $response["result"]["data"]["after"] === $after) $after = "";
		// else { $after = $response["result"]["data"]["after"]; sleep(1); }
// echo chr(10) . "<!-- Last: " . $lastAfter . "<br>After: " . $after . " -->" . chr(10);

		if ($after == $lastAfter) $after = "";
	} while ($after != "");
	echo "<br>" . $cnt . " new votes found.<br>";

	// if (!isset($_COOKIE["has_suggestions"])) {
	// 	echo "Determining interests..";
	// 	include "interests.php";
	// 	echo " done!<br>";
	// }

	// send 'em back where they came from
	echo "<br>Sending you back..";
?>

        </div>
      </div>
  	</div>
  </div>
<?php
	if ($redirect == "empty") echo "<script>setTimeout(function() { window.close(); }, 1000);</script>";
	else echo "<script>setTimeout(function() { window.location.href = '" . $redirect . "'; }, 1000);</script>";
?>
</body>
</html>
