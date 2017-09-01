<?php
	$tribs = array(0, 1, 1);

	$towers = array(
		// array("Tesla's death", false, "1943-1-7")
		// ,
		array("JFK's death", false, "1963-11-22")
		, array("Ronan Point", "1968-03-11", "1968-05-16")
		// , array("Halley's Comet", "1977-03-2", "1986-02-9")
		, array("Alfred P. Murrah", "1977-03-2", "1995-04-19")
		, array("Garley Building", false, "1996-11-20")
		, array("WTC Towers", "1970-12-23", "2001-09-11")
		// , array("WTC North Tower", "1970-12-23", "2001-09-11")
		// , array("WTC South Tower", "1971-07-19", "2001-09-11")
		, array("Dec. 21, 2012", false, "2012-12-21")
		// , array("WTC1 opens", false, "2014-11-3")
		, array("Plasco Building", "1962-07-02", "2017-01-19")
		, array("Grenfell Tower", "1974-07-02", "2017-06-14")
		, array("al-Nuri mosque", "1173-07-02", "2017-06-22")
		// , array("First eclipse", false, "2017-08-21")
		// , array("Second eclipse", false, "2024-04-08")
		// , array("Future Date", false, "2035-06-07")
		// , array("Halley's Comet", false, "2061-07-28")
	);

	$tab = chr(8);

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
</head>

<body>
	<div class="row"><div class="col s12"><h1>Events of [<?php echo $tribs[0] . ", " . $tribs[1] . ", " . $tribs[2]; ?>]</h1></div></div>

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

	$last = false;
	for ($i=0; $i < 1024; $i++) { 
		if ($last == $tribs[0]) {
			$next = $tribs[0] + $tribs[1] + $tribs[2];
			$tribs[0] = $tribs[1];
			$tribs[1] = $tribs[2];
			$tribs[2] = $next;

			continue;
		}
		$last = $tribs[0];

		echo '<tr><td>' . $tribs[0] . '</td>';

		foreach ($towers as $key => $t) {
			if (!$baseDate = date_create($t[2])) die("INVALID: " . $t[2]);
			date_add($baseDate, date_interval_create_from_date_string($tribs[0] . ' days'));
			$y = date_format($baseDate, "Y");
			$m = date_format($baseDate, "n");
			$d = date_format($baseDate, "j");

			if (isset($events[$y][$m][$d])) {
				echo "<td><b>" . $y . " " . $m . "/" . $d . "<b>";
				foreach ($events[$y][$m][$d] as $k => $ev) echo "<br><a href='#' title='" . str_replace("'", "\'", $ev) . "'>" . substr($ev, 0, 12) . "..</a>";
				echo "</td>";
			}
			else echo "<td>&nbsp;</td>";

		}


		$next = $tribs[0] + $tribs[1] + $tribs[2];
		$tribs[0] = $tribs[1];
		$tribs[1] = $tribs[2];
		$tribs[2] = $next;

		echo "</tr>";
	}


	echo "</tbody></table>";
?>