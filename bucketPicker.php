<?php
	// $vars = include "php/vars.php";

	$mysqli = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('{"error":"Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error . '"}'); 
	$mysqli->set_charset("utf8");

	$urlCopy = $url;
	if (strpos($urlCopy, "?") !== false) $urlCopy = substr($urlCopy, 0, strpos($urlCopy, "?"));
	while (substr_count($urlCopy, "/") > 2) $urlCopy = substr($urlCopy, 0, strrpos($urlCopy, "/"));
	if (strpos($urlCopy, "+") !== false) $urlCopy = substr($urlCopy, 0, strpos($urlCopy, "+"));

	$qry = "SELECT bucket from feeds where bucket != '' and url = '" . $mysqli->real_escape_string($urlCopy) . "' group by bucket order by count(*) DESC limit 0,1";
	$buckets = $mysqli->query($qry);

	$bucket = false;
	if ($buckets->num_rows > 0) {
		$rez = $buckets->fetch_row();
		$bucket = $rez[0];
	}

	if (!in_array($bucket, $vars['buckets'])) $bucket = "media";
	
	// if (in_array($bucket, $vars['buckets'])) {
		// if (strpos($url, "?") !== false)  die("<script>setTimeout(function() { window.location.href = '" . $url . "&only=" . $bucket . "'; });</script>");
		// else die("<script>setTimeout(function() { window.location.href = '" . $url . "/" . $bucket . "'; });</script>");

		if ($feed != "") {
			$listrURL = $url;
			
			if (substr_count($_SERVER['HTTP_HOST'], 'dev.') !== 0 || substr_count($_SERVER['HTTP_HOST'], 'devembed.') !== 0)
				include "listr.dev.php";
			else if (substr_count($_SERVER['HTTP_HOST'], 'stage.') !== 0)
				include "listr.stage.php";
			else include "listr.php";
		}
		else if (strpos($url, "/" . $bucket) !== false) {
			echo '<!--' . chr(10);
			echo '  url: ' . $url . chr(10);
			echo '  bucket: ' . $bucket . chr(10);
			echo '  first: ' . $first . chr(10);
			echo '-->';
			header($_SERVER["SERVER_PROTOCOL"] . " 404 Not Found", true, 404);
			echo "<h1 style='width:100%;text-align:center;'>FOUR OH FOUR</h1><p style='width:100%;text-align:center;'>How about <a href='/'>something from the homepage</a>?</p>";
			die();
		}
		else {
			if (strpos($url, "?") !== false) $url = $url . "&only=" . $bucket; 
			else $url = $url . "/" . $bucket;

			header("Location: " . $url);
		}

		die();			
	// }
?>

<body style="background-color:#1b1b1b">
<h1 style='background-color:#eee;margin-top:50px;margin-left:25%;border-radius:20px;width:50%;text-align:center;'>BUCKET PICKA</h1>
<p style='background-color:#eee;margin-top:50px;margin-left:25%;border-radius:20px;width:40%;padding-left:8%;padding-right:2%;'>
<br><b><u>What's the best category for this content?</u></b><br><br>
<?php
	foreach ($vars['buckets'] as $key => $bucket)
		echo '<b><a href="' . $url . (strpos($url, "?") === false ? '/' : "&only=") . $bucket . '">' . $bucket . '</a></b> -- ' . $vars['bucketDescrips'][$bucket] . '<br><br>';
?>
<br><br>
</p>