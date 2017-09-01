<?php
	header('Content-type: text/html; charset=utf-8');

    function getMagicNums() {
		return array(
			11, 22, 33, 44, 55, 66, 77, 88, 99
			, 10, 12, 13, 15, 24, 29, 56, 65
			, 111, 222, 333, 444, 555, 666, 777, 888, 999
			, 112, 211, 311, 330, 440, 550, 660, 770, 880, 990
			, 116, 611, 911, 119, 190, 1611, 1911, 6911, 9611
			, 5777, 665, 226, 622, 138
			, 777, 7777, 77777, 777777, 7777777, 77777777, 777777777, 7777777777, 77777777777, 777777777777, 7777777777777
			// , 20, 30, 40, 50, 60
		);
    }

    function nSum($str) {
		$magicNumbers = getMagicNums();

    	$str = (integer)preg_replace("/[^0-9]/", "", $str);
    	if (in_array($str, $magicNumbers)) return $str;

    	$nums = str_split($str);
    	$total = 0;
    	foreach ($nums as $key => $n) $total += $n;

    	if (in_array($total, $magicNumbers) || strlen($total) == 1) return $total;
    	else return nSum($total);
    }


//	if (isset($_GET["baseDate"])) echo "found in GET<br><br>";
//	else if (isset($_POST["baseDate"])) echo "found in POST<br><br>";
//	else echo "nada.<br>";
	$magicNumbers = getMagicNums();

	$baseReport = "<h1>Enter date above to start.</h1>";

	if (isset($_GET["YYYY"]) && isset($_GET["MM"]) && isset($_GET["DD"])) {
		$baseDate = date_create($_GET["YYYY"] . "-" . $_GET["MM"] . "-" . $_GET["DD"]);

		$vars = array();
		$vars['dbserver'] = 'localhost';
		$vars['dbname'] = 'numbers';
		$vars['user'] = 'numbersdb';
		$vars['pass'] = 'pooppoop';
		$mysqli = new mysqli($vars['dbserver'], $vars['user'], $vars['pass'], $vars['dbname']);
		if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	  	$mysqli->set_charset("utf8");

	  	$qry = "select id_event, source, cat, descrip, year from events where month = " . $_GET["MM"] . " and day = " . $_GET["DD"] . " order by year DESC"; // year = " . $_GET["YYYY"] . ' and 
		$baseEvents = $mysqli->query($qry);
		if ($baseEvents === false) die($ret . $ret . "ERROR: " . $mysqli->error);

		if ($baseEvents->num_rows) {
			$baseReport = "<h1>Events on " . $_GET['MM'] . "/" . $_GET['DD'] . "</h1><table class='striped'><thead><tr><th>delta</th><th>num</th><th>year</th><th>description</th><th>category</th><th>source</th></tr></thead><tbody>";

			while ($ev = $baseEvents->fetch_row()) {
		    	$id_event = $ev[0];
		    	$source = $ev[1];
		    	$cat = $ev[2];
		    	if (strlen($cat) == 0) $cat = "n/a";

		    	$descrip = $ev[3];
				$numbers = preg_replace("/[^0-9 .,-\/]/", "", str_replace(", ", " ", $descrip));

		    	$numSplit = explode(" ", $numbers);
		    	$doBold = false;
		    	foreach ($numSplit as $key => $n) {
		    		$nc = (integer)str_replace(array('.', ',', '-', '/'), "", $n);

		    		if (in_array($nc, $magicNumbers)) $doBold = true;
		    		else {
		    			$nn = nSum($nc);
		    			if (in_array($nn, $magicNumbers)) {
		    				$doBold = true;
		    				$descrip = str_replace($n, $n . "[=" . $nn . "]", $descrip);
		    			}
		    		}
		    	}
		    	if ($doBold) $descrip = "<b>" . $descrip . "</b>";

		    	$year = $ev[4];
		    	$delta = $year - $_GET["YYYY"];
		    	$nDelta = nSum($delta);

		    	if ($delta > 0) $delta .= "yrs after";
		    	else $delta = abs($delta) . "yrs before";
		    	
		    	if (!in_array(abs($delta), $magicNumbers) && !in_array($nDelta, $magicNumbers)) continue;

		    	$baseReport .= "<tr><td>" . $delta . "</td><td>" . $nDelta . "</td><td><b>" . $year . "</b></td><td>" . $descrip . "</td><td>" . $cat . "</td><td>" . $source . "</td></tr>";
			}

			$baseReport .= "</tbody></table>";

		}
		else $baseReport = "<h1>No events found associated with this date.</h1>";
	}
?>


  <html>
    <head>
      <link href="http://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <link type="text/css" rel="stylesheet" href="css/materialize.min.css"  media="screen,projection"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>h1 { width: 100%; text-align: center; } </style>
    </head>

    <body>
	    <div class="head">
			<div class="row">
	      		<form class="col s12">
        			<div class="row">
						<div class="col s3 offset-s2">
							MM
							<div class="input-field inline">
								<input id="MM" name="MM" type="text" class="validate" value="<?=$_GET["MM"]?>">
								<label for="MM">month</label>
							</div>
						</div>

						<div class="col s3">
							DD
							<div class="input-field inline">
								<input id="DD" name="DD" type="text" class="validate" value="<?=$_GET["DD"]?>">
								<label for="DD">day</label>
							</div>
						</div>

						<div class="col s3">
							YYYY
							<div class="input-field inline">
								<input id="YYYY" name="YYYY" type="text" class="validate" value="<?=$_GET["YYYY"]?>">
								<label for="YYYY">year</label>
							</div>
						</div>

						<div class="col s1"> </div>
					</div>
						
        			<div class="row" style="text-align:center">
						<div class="col s6 offset-s3" style="margin-top:12px;"> <button class="btn waves-effect waves-light" type="submit" name="action">SHOW ME WHAT YOU GOT.  I WANT TO KNOW WHAT YOU HAVE GOT.<i class="material-icons right">send</i></button> </div>
						<div class="col s3"> </div>
					</div>
				</form>
			</div>
		</div>

		<hr style="width:100%">

	    <div class="baseReport">
	    	<div class="row">
				<div class="col s10 offset-s1"><?=$baseReport?></div>
	    	</div>
	    </div>


		<hr style="width:100%">

	    <div class="findings">
	    	<div class="row">
				<div class="col s10 offset-s1">
<?php
	// $assocReport = "";

	if (isset($_GET["YYYY"]) && isset($_GET["MM"]) && isset($_GET["DD"])) {
      	$qry = "select year, month, day from dates_distinct order by year, month, day"; // limit 0, 10000";
		$dates = $mysqli->query($qry);
		if ($dates === false) die($ret . $ret . "ERROR: " . $mysqli->error);

		if ($dates->num_rows) {
			// $assocDebug = "";
			// $assocReport = "<h1>Related Events</h1><table class='striped'><thead><tr><th>date</th><th>reasons</th><th>description</th><th>category</th><th>source</th></tr></thead><tbody>";
			echo "<h1>Related Events</h1><table class='striped'><thead><tr><th>date</th><th>reasons</th><th>description</th><th>category</th><th>source</th></tr></thead><tbody>";

			while ($adate = $dates->fetch_row()) {
		    	$year = $adate[0];
		    	$month = $adate[1];
		    	$day = $adate[2];
				$assocDate = date_create($year . "-" . $month . "-" . $day);

		    	$yearMinus = $year;
		    	$monthMinus = $month;
				if ($assocDate > $baseDate) {
			    	$dayMinus = $day - 1;

			    	if ($dayMinus < 1) {
			    		$monthMinus--;
			    		if ($monthMinus < 1) {
			    			$monthMinus = 12;
			    			$yearMinus--;
			    		}

			    		$dayMinus = cal_days_in_month(CAL_GREGORIAN, $monthMinus, $yearMinus);
			    	}
				}
				else {
			    	$dayMinus = $day + 1;

			    	if ($dayMinus > cal_days_in_month(CAL_GREGORIAN, $monthMinus, $yearMinus)) {
			    		$monthMinus++;
			    		if ($monthMinus > 12) {
			    			$monthMinus = 1;
			    			$yearMinus++;
			    		}

			    		$dayMinus = 1;
			    	}
				}
		
				// $assocReport .= $year . " " . $month . "/" . $day . "<br>";
				$assocDate = date_create($yearMinus . "-" . $monthMinus . "-" . $dayMinus);
				$interval = date_diff($baseDate, $assocDate);
				
				$reasons = "";

				// does this date match on number of days?
				$days = $interval->format('%a');
				if (in_array($days, $magicNumbers)) {
					$reasons .= "<br><b>" . $days . "</b> days";
					if (strlen($interval->format('%r'))) $reasons .= " before";
					else $reasons .= " after";

					// if ($year > $_GET["yyyy"]) $reasons .= " after";
					// else if ($year >= $_GET["yyyy"] && $month > $_GET["MM"]) $reasons .= " after";
					// else if ($year >= $_GET["yyyy"] && $month >= $_GET["MM"] && $day > $_GET["DD"]) $reasons .= " after";
					// else $reasons .= " before";
				}


				// how about the sumation of year, month, and day?
				$interval = date_diff($baseDate, $assocDate);

				if ($days < 31) {
					$years = 0;
					$months = 0;
					$days = $interval->format('%d');
				}
				else if ($days < 365) {
					$years = 0;
					$months = $interval->format('%m');
					$days = $interval->format('%d');
				}
				else {
					$years = $interval->format('%y');
					$months = $interval->format('%m');
					$days = $interval->format('%d');
				}

				$total = nSum($years . $months . $days);
				// if (in_array($total, $magicNumbers)) $reasons .= "<br>" . $years . "y" . $months . "m" . $days . "d=<b>" . $total . "</b>";
/*

				if ($years < 0) $years = 0;
				
				if ($months < 0) {
					if ($years > 0) {
						$years--;
						$months = 11;
					}
					else $months = 0;
				}

				if ($days == -1) {
					if ($months > 0) {
						$months--;
						$days = cal_days_in_month(CAL_GREGORIAN, $month, $year) - 1;
					}
					else $days = 0;
				}

*/


				if (strlen($reasons) > 0) {
				  	$qry = "select id_event, source, cat, descrip, year from events where year = " . $year . " and month = " . $month . " and day = " . $day; // . " order by year DESC"; // year = " . $_GET["YYYY"] . ' and 
					$baseEvents = $mysqli->query($qry);
					if ($baseEvents === false) die($ret . $ret . "ERROR: " . $mysqli->error);

					while ($ev = $baseEvents->fetch_row()) {
				    	$id_event = $ev[0];
				    	$source = $ev[1];
				    	$cat = $ev[2];
				    	if (strlen($cat) == 0) $cat = "n/a";

				    	$descrip = $ev[3];
						$numbers = preg_replace("/[^0-9 .,-\/]/", "", str_replace(", ", " ", $descrip));
				    	$numSplit = explode(" ", $numbers);
				    	$doBold = false;
				    	foreach ($numSplit as $key => $n) {
				    		$nc = (integer)str_replace(array('.', ',', '-', '/'), "", $n);

				    		if (in_array($nc, $magicNumbers)) $doBold = true;
				    		else {
				    			$nn = nSum($nc);
				    			if (in_array($nn, $magicNumbers)) {
				    				$doBold = true;
				    				$descrip = str_replace($n, $n . "[=" . $nn . "]", $descrip);
				    			}
				    		}
				    	}
				    	if ($doBold) $descrip = "<b>" . $descrip . "</b>";
	
				    	// $assocReport .= 
				    	echo
				    		"<tr><td><b>" . $month . "/" . $day . " " . $year . "</b></td><td>" . substr($reasons, 4) . "</td><td>" . $descrip . "</td><td>" . $cat . "</td><td>" . $source . "</td></tr>";
				    }

					flush();
					ob_flush();
				}
		    }

			// $assocReport .= 
			echo "</tbody></table>";
		}
		// else $assocReport = "<h1>dates_distinct table empty! :/</h1>";
		else echo "<h1>dates_distinct table empty! :/</h1>";
	}
?>
				</div>
	    	</div>
	    </div>

      <!--Import jQuery before materialize.js-->
      <script type="text/javascript" src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
      <script type="text/javascript" src="js/materialize.min.js"></script>
    </body>
  </html>