<?php
	// $tribs = array(0, 1, 1);

	$towers = array(
		// array("Tesla's birth", "1856-04-10", "1856-04-10", 1)
		array("Tesla's death", "1856-04-10", "1943-01-07", 1)

		// , array("Franz Ferdinand's birth", false, "1863-12-18", 1)		// December 18, 1863
		// , array("Franz Ferdinand's death", false, "1928-06-28", 1)		// June 28, 1914

		// , array("Einstein's birth", "1879-03-14", "1879-03-14", 1)	// March 14, 1879
		// , array("Einstein's death", "1879-03-14", "1879-04-18", 1)	// April 18, 1955

		// , array("JFK's birth", "1917-05-29", "1917-05-29", 1) 
		// , array("JFK's death", "1917-05-29", "1963-11-22", 1)
		
		// , array("58888d post-Tesla", "1856-04-10", "2104-04-01", 1) //April 1, 2104
		// , array("Blandford fireworks fire", false, "1894-04-07", 1)
		// array("US independence", false, "1776-07-04", 1)
		// , array("Halley's comet named", false, "1682-09-15", 1)
		// , array("Pearl Harbor", false, "1941-12-07", 1) 				// December 7, 1941
		// , array("'1984' released", false, "1949-06-08", 1)
		// , array("NASA opens", "1958-10-01", "1958-10-01", 1)
		// , array("Pioneer I launch", "1958-10-11", "1958-10-11", 1)
		// , array("3 astronauts die", false, "1967-01-27", 1)
		// , array("Ronan Point", "1968-03-11", "1968-05-16", 1)
		// , array("Chicago fireworks fire", false, "1968-12-18", 1) //  Dec. 18, 1968
		// , array("Apollo 11 launch", false, "1969-07-16", 1)
		// , array("Halley's Comet", false, "1986-02-09", 1)
		// , array("Voyager 1 launch", false, "1977-09-05", 1)
		// , array("Challenger explosion", false, "1986-01-28", 1)
		// , array("OKC bombing", "1977-03-2", "1995-04-19", 1)
		// , array("Garley Building", false, "1996-11-20", 1)
		// , array("Columbine shooting", false, "1999-04-20", 1)
		, array("9/11", false, "2001-09-11", 3)
		, array("Dec. 21, 2012", false, "2012-12-21", 5)
		// , array("Montreal fireworks fire", false, "2013-06-20", 1)	//Jun 20, 2013 
		// // , array("WTC1 opens", false, "2014-11-03", 1)
		// // , array("Dallas police shooting", false, "2016-07-07", 1)
		// , array("Mexico fireworks fire", false, "2016-12-20", 1)		// Dec 20, 2016
		// // , array("Plasco Building", "1962-07-02", "2017-01-19", 1)
		// , array("Isreal fireworks fire", false, "2017-03-14", 1)		// MARCH 14, 2017
		// , array("Portugal fireworks fire", false, "2017-04-04", 1)		// April 04, 2017
		// , array("India fireworks fire", false, "2017-06-08", 1)		// June 8, 2017 
		// , array("Grenfell Tower", "1974-07-02", "2017-06-14", 1)
		// , array("al-Nuri mosque", "1173-07-02", "2017-06-22", 1)
		// , array("First eclipse", false, "2017-08-21", 2)
		// , array("Second eclipse", false, "2024-04-08", 2)
		// , array("12321d post-9/11", "2001-09-11", "2035-06-07", 1)
		// , array("Halley's Comet", false, "2061-07-28", 1)
	);

	$tab = chr(8);

	$pyramids = array();
	for ($i=1; $i < 11111; $i++) { 
		$t = $i * $i * $i;
		if (isset($pyramids[$t])) $pyramids[$t] .= "<br>" . $i . "x" . $i . "x" . $i;
		else $pyramids[$t] = "<br>" . $i . "x" . $i . "x" . $i;

		$t = $i * $i * $i * $i;
		if (isset($pyramids[$t])) $pyramids[$t] .= "<br>" . $i . "x" . $i . "x" . $i . "x" . $i;
		else $pyramids[$t] = "<br>" . $i . "x" . $i . "x" . $i . "x" . $i;

		$t = $i + $i + $i;
		if (isset($pyramids[$t])) $pyramids[$t] .= "<br>" . $i . "+" . $i . "+" . $i;
		else $pyramids[$t] = "<br>" . $i . "+" . $i . "+" . $i;

		$t = $i + $i + $i + $i;
		if (isset($pyramids[$t])) $pyramids[$t] .= "<br>" . $i . "+" . $i . "+" . $i . "+" . $i;
		else $pyramids[$t] = "<br>" . $i . "+" . $i . "+" . $i . "+" . $i;
	}

	$mode = "report";
	if (isset($_GET["mode"])) $mode = $_GET["mode"];

	if ($mode == 'tsv') {
		header('Content-type: text/tab-separated-values');
		header("Content-Disposition: attachment;filename=events" . $year . "-" . $month . "-" . $day . ($justTerror ? "" : "-all") . ".tsv");
	}

	$mysqli = new mysqli('localhost', 'numbersdb', 'pooppoop', 'numbers');
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
  	$mysqli->set_charset("utf8");

  	$qry = 
  		"select id_event, source, cat, descrip, year, month, day from events"
  		. " where cat = 'terror'"
  		// . " where year >= " . $year // cat = 'terror' and . " and month >= " . $month . " and day >= " . $day
  		// . " order by year, month, day"
  	; 

	$baseEvents = $mysqli->query($qry);
	if ($baseEvents === false) die($ret . $ret . "ERROR: " . $mysqli->error);

	$events = array();
	$evCnt = 0;
	while ($ev = $baseEvents->fetch_row()) {
    	// $id_event = $ev[0];
    	// $source = $ev[1];
    	// $cat = $ev[2];
    	// if (strlen($cat) == 0) $cat = "n/a";

    	$descrip = $ev[3];

    	$year = $ev[4];
    	if ($year < 0) continue;
    	
    	$month = $ev[5];
    	$day = $ev[6];

    	if (!isset($events[$year])) $events[$year] = array();
    	if (!isset($events[$year][$month])) $events[$year][$month] = array();
    	if (!isset($events[$year][$month][$day])) $events[$year][$month][$day] = array();

    	$events[$year][$month][$day][] = $descrip;
    	$evCnt++;
    }
?>

<?php if($mode == "report") : ?>
<html>
<head>
  <link href="http://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link type="text/css" rel="stylesheet" href="css/materialize.min.css"  media="screen,projection"/>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>h1 { width: 100%; text-align: center; } td, th { text-align: center; } i.save { cursor: pointer; } </style>

	<script type="text/javascript" src="js/materialize.min.js"></script>
</head>

<body>
	<!--div class="row"><div class="col s12"><h1>Events of [<?php echo $tribs[0] . ", " . $tribs[1] . ", " . $tribs[2]; ?>]</h1></div></div-->

	<div class="row"><div class="col s12">
	<table class='striped'>
<?php endif; ?>	

<?php
	echo "<thead><tr><th><b>#</b></th>";
	foreach ($towers as $key => $t) {
		$name = $t[0];
		echo "<th><b>" . $name . "</b></th>";
	}
	echo "</tr></thead><tbody>";

	// $last = false;
	for ($i=0; $i < 19999; $i++) { 
		// if ($last == $tribs[0]) {
		// 	$next = $tribs[0] + $tribs[1] + $tribs[2];
		// 	$tribs[0] = $tribs[1];
		// 	$tribs[1] = $tribs[2];
		// 	$tribs[2] = $next;

		// 	continue;
		// }
		// $last = $tribs[0];


		$matches = "";
		$found = false;
		foreach ($towers as $key => $t) {
			if (!$baseDate = date_create($t[2])) die("INVALID: " . $t[2]);
			date_add($baseDate, date_interval_create_from_date_string(($i + 1) . ' days'));
			$y = date_format($baseDate, "Y");
			$m = date_format($baseDate, "n");
			$d = date_format($baseDate, "j");

			if (isset($events[$y][$m][$d])) {
				$found = true;

				$matches .= "<td><b>" . $y . " " . $m . "/" . $d . "<b>";
				// $matches .= "<td><b><a href='#' title='" . str_replace("'", "", $t[0]) . "'>" . $y . " " . $m . "/" . $d . "</a><b>";
				foreach ($events[$y][$m][$d] as $k => $ev) $matches .= "<br><a onmouseover='Materialize.toast(\"" . str_replace("'", "", $t[0]) . "\", 4000)' href='#' title='" . str_replace("'", "", $ev) . "'>" . substr($ev, 0, 18) . "..</a>";
				$matches .= "</td>";
			}
			else $matches .= '<td>&nbsp;</td>';
		}

		if ($found) {
			$baseDate = date_create("1980-01-01");
			date_add($baseDate, date_interval_create_from_date_string($i . ' days'));
			$interval = date_diff(date_create("1980-01-01"), $baseDate);
			$y = $interval->format('%y');
			$m = $interval->format('%m');
			$d = $interval->format('%d');

			echo '<tr><td>' . $i . ' days<br>';
			if (isset($pyramids[$i])) echo '<b>' . substr($pyramids[$i], 4) . '</b><br>';
			echo round($i / 7, 4) . ' wks<br>';
			if (($i / 7) == round($i / 7) && isset($pyramids[$i / 7])) echo '<b>' . substr($pyramids[$i / 7], 4) . '</b><br>';
			echo $y . 'y' . $m . 'm' . $d . 'd';
			if (isset($pyramids[$y . $m . $d])) echo '<br><b>YMD: ' . substr($pyramids[$y . $m . $d], 4) . '</b>';
			// if (isset($pyramids[$y . $m])) echo '<br><b>YM: ' . substr($pyramids[$y . $m], 4) . '</b>';
			if (isset($pyramids[$m . $d])) echo '<br><b>MD: ' . substr($pyramids[$m . $d], 4) . '</b>';
			echo '</td>' . $matches . "</tr>";
		}
	}

	echo "</tbody></table>";
?>