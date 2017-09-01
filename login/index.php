<?php
$stoopidWords = array(
	"monkey", "pants", "cheesecake", "kerfuffle", "your", "mothers", "flying", "holy", "batman", "greased", "piggy", "taco", "elite", "masterrace"
	, "want", "to", "set", "the", "world", "on", "fire", "stinky", "pigfaced", "revenge", "return", "the", "of", "son", "curse", "enslave"
	, "free", "white", "women", "halfprice", "surfing", "cow", "alien", "boring", "discount", "asian", "british", "pork", "chicken", "oh"
	, "no", "oh", "yeah", "pills", "here", "repurposed", "guarenteed", "butternut", "squash", "pancakes"
);
$stoopidCnt = count($stoopidWords);

require_once("reddit/creds.php");
require_once("reddit/Client.php");
require_once("reddit/GrantType/IGrantType.php");
require_once("reddit/GrantType/AuthorizationCode.php");
$client = new OAuth2\Client($clientId, $clientSecret, OAuth2\Client::AUTH_TYPE_AUTHORIZATION_BASIC);
$clientString = $stoopidWords[mt_rand(0, $stoopidCnt)] . $stoopidWords[mt_rand(0, $stoopidCnt)] . $stoopidWords[mt_rand(0, $stoopidCnt)] . $stoopidWords[mt_rand(0, $stoopidCnt)] . $stoopidWords[mt_rand(0, $stoopidCnt)];


// echo "getting authorization URL.. ";
$authUrl = $client->getAuthenticationUrl($authorizeUrl, $redirectUrl, 
    array(
        "scope" => "identity,history,read,mysubreddits,vote"
        , "state" => $clientString
        , "duration" => "permanent"
    )
);

setcookie("redditid", "", time() - 3600, "/", "radd.it");
setcookie("reddituser", "", time() - 3600, "/", "radd.it");
setcookie("stoopid", $clientString, time() + 60, "/", "radd.it");

if (empty($_SERVER['HTTP_REFERER'])) setcookie("redirect", "http://radd.it/", time() + 60, "/", "radd.it");
else setcookie("redirect", $_SERVER['HTTP_REFERER'], time() + 60, "/", "radd.it");

echo "<body><p>Sending you to reddit..</p><script>window.location.href = '" . $authUrl . "';</script></body>";
?>