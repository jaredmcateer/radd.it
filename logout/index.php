<?php
	if (!empty($_COOKIE["reddit_token"]) || !empty($_COOKIE["reddit_refresh"])) {
		chdir(dirname(__FILE__));
		require_once("../login/reddit/creds.php");
		require_once("../login/reddit/Client.php");
		require_once("../login/reddit/GrantType/IGrantType.php");
		require_once("../login/reddit/GrantType/AuthorizationCode.php");
		$client = new OAuth2\Client($clientId, $clientSecret, OAuth2\Client::AUTH_TYPE_AUTHORIZATION_BASIC);
		
		if (!empty($_COOKIE["reddit_token"]))
			$client->fetch("https://www.reddit.com/api/v1/revoke_token", array("token" => $_COOKIE["reddit_token"], "token_type_hint" => "access_token"), "POST");
		else if (!empty($_COOKIE["reddit_refesh"]))
			$client->fetch("https://www.reddit.com/api/v1/revoke_token", array("token" => $_COOKIE["reddit_refesh"], "token_type_hint" => "refresh_token"), "POST");
	}
	
	setcookie("user", "", time() - 3600, "/", "radd.it");
	setcookie("userhash", "", time() - 3600, "/", "radd.it");
	setcookie("reddit_token", "", time() - 3600, "/", "radd.it");
	setcookie("reddit_refresh", "", time() - 3600, "/", "radd.it");

	if (empty($_SERVER['HTTP_REFERER'])) echo "<script>setTimeout(function() { window.close(); }, 1000);</script>";
	else echo "<script>window.location.href = '" . $_SERVER['HTTP_REFERER'] . "';</script>";
?>