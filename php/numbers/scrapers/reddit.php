<?php
    function runCurl($urlCurl, $postValsCurl = null){
        $chCurl = curl_init($urlCurl);
        
        $curlOptions = array(
            CURLOPT_RETURNTRANSFER => true
            ,CURLOPT_TIMEOUT => 10
            // ,CURLOPT_USERAGENT => 'radd.it secondary listing lookup (user-requested)'
        );			//// OH YOU BIG FUCKING FAKER YOU
        
        if ($postValsCurl != null) {
            $curlOptions[CURLOPT_POSTFIELDS] = $postValsCurl;
            $curlOptions[CURLOPT_CUSTOMREQUEST] = "POST";  
        }

        curl_setopt_array($chCurl, $curlOptions);
        
        $curlResponse = curl_exec($chCurl);
        curl_close($chCurl);

        return $curlResponse;
    }

	$vars = array();
	$vars['dbserver'] = 'localhost';
	$vars['dbname'] = 'numbers';
	$vars['user'] = 'numbersdb';
	$vars['pass'] = 'pooppoop';
	$mysqli = new mysqli($vars['dbserver'], $vars['user'], $vars['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
  	$mysqli->set_charset("utf8");

    $searchURL = "https://www.reddit.com/r/worldnews.json";
	if (isset($_GET["after"])) $searchURL .= "?after=" . $_GET["after"];

	$file = runCurl($searchURL);

	$json = json_decode($file);
	$kids = $json->data->children;
	foreach ($kids as $key => $post) {
		$tit = $post->data->title;

		$qry = 
			"INSERT INTO `events`(source, `descrip`, `year`, `month`, `day`) " 
			. "VALUES ('r/worldnews','" . $mysqli->real_escape_string($tit) . "'," . $year . "," . $month . "," . $day . ")"
		;

		// echo $qry;
		$ins = $mysqli->query($qry);
		if ($ins === false) die($ret . $ret . "ERROR: " . $mysqli->error);
	}


	echo $ret . $ret . "<h2>Next page: ?d=" . $day . "&m=" . $month . $page . '</h2>';
	echo "<script>setTimeout(function() { window.location.href = '?d=" . $day . "&m=" . $month . $page . "'; }, 24000);</script>";
?>?>