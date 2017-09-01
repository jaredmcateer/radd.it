<?php
	$authorizeUrl = 'https://www.reddit.com/api/v1/authorize';
	if (stripos($_SERVER['HTTP_USER_AGENT'], "phone") !== false || stripos($_SERVER['HTTP_USER_AGENT'], "mobile") !== false)
		$authorizeUrl .= ".compact";

	$accessTokenUrl = 'https://www.reddit.com/api/v1/access_token';
	$clientId = 'EeC-wikRt5Qwlg';
	$clientSecret = 'S-KXbyEr-28IOe7a_D2utDk_-1Q';
	$redirectUrl = "http://two-oh.radd.it/login/redirect.php";       // can't be changed
	$hashPrefix = "wluba/";
?>