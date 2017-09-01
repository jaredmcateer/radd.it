<?php
	error_reporting(E_ALL);

	$ret = "<br>";

	// if (isset($_GET["y"])) $year = $_GET["y"];
	// else $year = 1;

   /**
    * cURL request
    *
    * General cURL request function for GET and POST
    * @link URL
    * @param string $url URL to be requested
    * @param string $postVals NVP string to be send with POST request
    */
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

	if (isset($_GET["d"])) $day = $_GET["d"];
	else $day = 1;

	if (isset($_GET["m"])) $month = $_GET["m"];
	else $month = 1;
	$monthName = strtolower(date("F", mktime(0, 0, 0, $month, 10)));

	if (isset($_GET["p"])) $page = "?p=" . $_GET["p"];
	else $page = "";

	$searchURL = "http://www.onthisday.com/events/" . $monthName . "/" . $day . $page;
	echo "<h3>URL: " . $searchURL . "</h3>" . $ret . $ret;

	$vars = array();
	$vars['dbserver'] = 'localhost';
	$vars['dbname'] = 'numbers';
	$vars['user'] = 'numbersdb';
	$vars['pass'] = 'pooppoop';
	$mysqli = new mysqli($vars['dbserver'], $vars['user'], $vars['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
  	$mysqli->set_charset("utf8");

  	if ($page == "") {
		$ins = $mysqli->query("delete from events where source = 'onthisday.com' and month = " . $month . " and day = " . $day);
		if ($ins === false) die($ret . $ret . "ERROR: " . $mysqli->error);
  	}

  	// get HTML page
	$file = runCurl($searchURL);

	// trim string up to events
	$pos = strpos($file, '<p class="section__sub-head">Events');
	$file = substr($file, $pos);

	// $pos = strpos($file, '</div>');
	$pos = strpos($file, '</p>');
	$file = substr($file, $pos + 6);

	$pos = strpos($file, '<ul class="share-buttons">');
	$file = substr($file, 0, $pos);

	$split = explode(chr(10), $file);

	// echo "<pre>";
	// print_r(htmlentities($file));

	$skips = array(
		''
		, '<div class="wrapper">'
		, '<ul class="event-list event-list--with-advert">'
		, '</ul>'
		, '<script src="//tags-cdn.deployads.com/a/onthisday.com.js" async></script>'
		, '<script>(deployads = window.deployads || []).push({});</script></div></div>'
		// , ''
	);

	$event = "";
	$etype = "";
	$year = -1;
	// $BCorAD = 'AD';

	$next = false;

	$inblock = false;
	foreach ($split as $i => $str) {
		$str = trim($str);

		if (in_array($str, $skips)) continue;
		// else echo ($inblock ? "<b>ON</b>" : "of" ) . "<b>" . $i . ":</b> " . htmlentities($str) . $ret . $ret;

		if ($inblock) {
			// <p><a href="/events/date/1194">1194</a> King <a href="/people/richard-the-lionheart">Richard I</a> of England gives Portsmouth its first Royal Charter.</p></div>
			if (strpos($str, '<p><a href="/events/date/') === 0) {
				$pos = strpos($str, '/events/date/');
				$year = substr($str, $pos + 13);
				$year = substr($year, 0, strpos($year, '"'));
				if (strpos($year, "bc") !== false) {
					// $BCorAD = 'BC';
					$year = ' -' . str_replace("bc", "", $year);
				}
				// else $BCorAD = 'AD';

				$event = trim(substr(strip_tags($str), strlen($year)));
			}
			else if (strpos(str_replace(" ", "", $str), '</div></div></div>') === 0) {
				$inblock = false;

				echo "BLOCK: <b>(" . $year . ")</b> " . $event  . $ret;
				$qry = 
					"INSERT INTO `events`(source, `descrip`, `year`, `month`, `day`) " 
					. "VALUES ('onthisday.com','" . $mysqli->real_escape_string($event) . "'," . $year . "," . $month . "," . $day . ")"
				;

				// echo $qry;
				$ins = $mysqli->query($qry);
				if ($ins === false) die($ret . $ret . "ERROR: " . $mysqli->error);
			}
		}
		else if (strpos($str, '<div class="section section--highlight') === 0) {
			$inblock = true;
			$event = "";
			$etype = "";
			$year = -1;
			// $BCorAD = 'AD';
		}

		// <li class="event-list__item"><b><a href="/events/date/1230">1230</a></b> William de Braose, 10th Baron Abergavenny is hanged by Prince Llywelyn the Great.</li>
		else if (strpos($str, '<li class="event-list__item">') === 0) {	// single event
			$pos = strpos($str, '/events/date/');
			$year = substr($str, $pos + 13);
			$year = substr($year, 0, strpos($year, '"'));
			
			if (strpos($year, "bc") !== false) {
				// $BCorAD = 'BC';
				$year = ' -' . str_replace("bc", "", $year);
			}
			// else $BCorAD = 'AD';

			// $pos = strpos($str, '</a></b>');
			// $event = substr($str, $pos + 8);
			// $event = trim(str_replace(array("</li>"), "", $event));
			$event = trim(substr(strip_tags($str), strlen($year)));

			echo "Event: <b>(" . $year . ")</b> " . $event . $ret;

			$qry = 
				"INSERT INTO `events`(source, `descrip`, `year`, `month`, `day`) " 
				. "VALUES ('onthisday.com','" . $mysqli->real_escape_string($event) . "'," . $year . "," . $month . "," . $day . ")"
			;

			// echo $qry;
			$ins = $mysqli->query($qry);
			if ($ins === false) die($ret . $ret . "ERROR: " . $mysqli->error);
		}

		// <li><a href="/events/may/2?p=2" class="pag__next" rel="next"><span>Next</span></a></li>
		else if (strpos($str, '<span>Next</span></a></li>') !== false) {	// URL for the "next" page
			$pos = strpos($str, '?p=');
			$next = substr($str, $pos + 1, 3);
		}

	}

	if ($next == false) {
		// get next day
		$page = "";
		
		$day++;
		if ($day > cal_days_in_month(CAL_GREGORIAN, $month, 2017)) {
			$day = 1;
			$month++;

			if ($month > 12) {
				echo "<h1>HOLY SHIT WE'RE DONE!</h1>";
				break;
			}
		}
	}
	else {
		// get next page for this day
		$page = "&" . $next;
	}

  	if ($page == "") {
		$ins = $mysqli->query("update events set cat = 'terror' where source = 'onthisday.com' and (descrip like '%erroris%' or descrip ike '%sinks%' or descrip like '%kill%' or descrip like '%suicide%' or descrip like '%crash%' or descrip like '%dead%' or descrip like '%wounded%' or descrip like '%bomb%' or descrip like '%attack%' or descrip like '%battle%')");
		if ($ins === false) die($ret . $ret . "ERROR: " . $mysqli->error);
  	}

  	echo $ret . $ret . "<h2>Next page: ?m=" . $month . "&d=" . $day . $page . '</h2>';
	echo "<script>setTimeout(function() { window.location.href = '?m=" . $month . "&d=" . $day . $page . "'; }, 24000);</script>";
?>