<?php
	$mode = "report";
	if (isset($_GET["m"])) $mode = $_GET["m"];
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
	<div class="row"><div class="col s10 offset-s1">
	<h1>Saved Events</h1>
	</div></div>

	<div class="row"><div class="col s10 offset-s1">
	<table class='striped saved'>
		<thead>
			<tr><th>&nbsp;</th><th>date</th><th>days<br>between</th><th>weeks<br>between</th><th>YYMMDD<br>between</th><th>matches</th><th style='text-align:left'>event</th></tr>
		</thead>
		<tbody>
		</tbody>
	</table></div></div>
<?php endif; ?>	

<?php
    function nSum($str) {
// echo "nSum(" . $str . ")<br>";

        $str = (integer)preg_replace("/[^1-9]/", "", $str); // omit 0s?  really?
        $nums = str_split($str);
        $cnt = count($nums);

        $trumps = array("5711", "617");
        
        $masters = array(11, 22, 33, 44, 55, 66, 77, 88, 99);

        $superSpecials = array(
            111, 112, 113, 114, 115, 116, 117, 118, 119, 122, 133, 144, 161, 166, 191, 199
            , 211, 222, 223, 226, 229, 244, 255, 299
            , 311, 322, 333, 336, 337, 339, 355
            , 411, 422, 433, 441, 442, 444, 445, 447, 499
            , 511, 522, 555, 557, 599
            , 611, 616, 619, 622, 636, 655, 666, 677, 691
            , 711, 722, 777, 799
            , 811, 815, 822, 888, 899
            , 911, 916, 922, 988, 999

            , 1211, 1216, 1219, 1222

            , 5113, 5115


            , 12124, 13114, 14419 

            , 1111, 11111, 111111
            , 1112, 11112, 111112
            , 1113, 11113, 111113
            , 1116, 11116, 111116
            , 1118, 11118, 111118
            , 1119, 11119, 111119
            
            , 2222, 22222, 222222
            , 3333, 33333, 333333
            , 4444, 44444, 444444
            , 5555, 55555, 555555
            , 6666, 66666, 666666
            , 7777, 77777, 777777
            , 8888, 88888, 888888
            , 9999, 99999, 999999   
        );

        $specials = array(9, 12, 13, 15, 16, 17, 19, 21, 24, 31, 37, 41, 42, 51, 61, 73, 91);


        /*
            DONE IF...
                ..single digit
                ..master number
                ..digit + master
                ..master + digit
        */
        if ($cnt == 1 || in_array($str, $masters) || in_array($str, $specials) || in_array($str, $superSpecials)) return $str;
        else if (substr_count($str, substr($str, 0, 1)) == strlen($str)) return $str;   // Send back and 111s, 2222s, 33333s, etc..
        else if (
            $cnt == 3
            && (in_array(substr($str, 0, 2), $masters) || in_array(substr($str, 1, 2), $masters))
        ) return $str;

        /*  OTHERWISE...   */
        $results = array();
        if ($cnt == 2) $results[] = $nums[0] + $nums[1];
        else if ($cnt == 3) {
            // add all
            $results[] = $nums[0] + $nums[1] + $nums[2];
            // add first and second
            $results[] = ($nums[0] + $nums[1]) . $nums[2];
            // add second and third
            $results[] = $nums[0] . ($nums[1] + $nums[2]);
        }
        else if ($cnt == 4) {
            // add all
            $results[] = $nums[0] + $nums[1] + $nums[2] + $nums[3];
            // add first and second
            $results[] = ($nums[0] + $nums[1]) . $nums[2] . $nums[3];
            // add second and third
            $results[] = $nums[0] . ($nums[1] + $nums[2]) . $nums[3];
            // add third and fourth
            $results[] = $nums[0] . $nums[1] . ($nums[2] + $nums[3]);

        }
        else if ($cnt == 5) {
            // add all
            $results[] = $nums[0] + $nums[1] + $nums[2] + $nums[3] + $nums[4];
            // add first and second
            $results[] = ($nums[0] + $nums[1]) . $nums[2] . $nums[3] . $nums[4];
            // add second and third
            $results[] = $nums[0] . ($nums[1] + $nums[2]) . $nums[3] . $nums[4];
            // add third and fourth
            $results[] = $nums[0] . $nums[1] . ($nums[2] + $nums[3]) . $nums[4];
            // add fourth and fifth
            $results[] = $nums[0] . $nums[1] . $nums[2] . ($nums[3] + $nums[4]);
        }

        // determine which result of numerologically "best" with weights
        $weights = array(
            $trumps
            , array("116", "119", "611", "911")
            , $masters
            , $superSpecials
            , $specials
            , array("29", "38", "47", "56", "65", "74", "83", "92", "101", "128", "129", "137", "173", "218", "281", "416", "461", "623", "632")   // 11s
            , array("5764", "6349", "8392")             // 22s
            , array("121", "123", "137", "311", "312", "623")  // 33s
            // , array ("7", "21", "23", "24", "31", "32", "48", "61", "75", "84", "528")
        );

        $resWeight = array();
        foreach ($results as $k => $n) $resWeight[$k] = 0;

        foreach ($weights as $depth => $list) {
            if ($depth) $weight = $cnt - $depth + 1;
            else $weight = $cnt + 3;

            $tot = 0;
            foreach ($results as $k => $n)
                foreach ($list as $listK => $listN) $resWeight[$k] += substr_count($n, $listN) * $weight;
        }

// print_r($results);
// print_r($resWeight);

        $topWeight = -77;
        foreach ($results as $k => $n)
            if ($resWeight[$k] > $topWeight) $topWeight = $resWeight[$k];

        foreach ($results as $k => $n) 
            if ($resWeight[$k] == $topWeight) return nSum($n);
    }

//	if (isset($_GET["baseDate"])) if ($mode == "report") echo "found in GET<br><br>";
//	else if (isset($_POST["baseDate"])) if ($mode == "report") echo "found in POST<br><br>";
//	else if ($mode == "report") echo "nada.<br>";


	if (isset($_GET["yyyy"])) $year = $_GET["yyyy"];
	else $year = 1980;

	if (isset($_GET["mm"])) $month = $_GET["mm"];
	else $month = 1;

	if (isset($_GET["dd"])) $day = $_GET["dd"];
	else $day = 1;


	$masters = array(11, 22, 33, 44, 55, 66, 77, 88, 99);
	$superSpecials = array(
		111, 112, 113, 114, 115, 116, 117, 118, 119, 122, 133, 144, 161, 166, 191, 199
		, 211, 222, 223, 226, 229, 244, 255, 299
		, 311, 322, 333, 336, 337, 339, 355, 366, 377, 388, 399
		, 411, 422, 433, 441, 442, 444, 445, 447, 499
		, 511, 522, 555, 557, 566, 577, 588, 599
		, 611, 616, 619, 622, 636, 655, 665, 666, 667, 677, 691
		, 711, 722, 733, 744, 755, 766, 776, 777, 799
		, 811, 815, 822, 833, 844, 855, 866, 877, 888, 899
		, 911, 916, 922, 933, 944, 955, 966, 969, 977, 988, 996, 999

		, 1211, 1216, 1219
		// , 12124, 13114, 14419 

		, 1111, 11111, 111111
		, 1112, 11112, 111112
		, 1113, 11113, 111113
		, 1116, 11116, 111116
		, 1118, 11118, 111118
		, 1119, 11119, 111119
		
		, 2222, 22222, 222222
		, 3333, 33333, 333333
		, 4444, 44444, 444444
		, 5555, 55555, 555555
		, 6666, 66666, 666666
		, 7777, 77777, 777777
		, 8888, 88888, 888888
		, 9999, 99999, 999999	
	);

	// $specials = array(3, 7, 9, 12, 15, 16, 19, 23, 32, 51, 82, 73, 99, 123, 125, 317, 717, 811, 927, 928);
	$specials = array(9, 12, 13, 15, 16, 19, 21, 24, 31, 37, 41, 42, 51, 61, 73, 91);
	$magicNumbers = array_merge($masters, $superSpecials, $specials);

	$foundNums = array();
	$foundNumsN = array();

	$vars = array();
	$vars['dbserver'] = 'localhost';
	$vars['dbname'] = 'numbers';
	$vars['user'] = 'numbersdb';
	$vars['pass'] = 'pooppoop';
	$mysqli = new mysqli($vars['dbserver'], $vars['user'], $vars['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
  	$mysqli->set_charset("utf8");

  	$qry = 
  		"select id_event, source, cat, descrip, year, month, day from events"
  		. " where cat = 'terror' and year >= " . $year // . " and month >= " . $month . " and day >= " . $day
  		. " order by year, month, day"
  	; 

	$baseEvents = $mysqli->query($qry);
	if ($baseEvents === false) die($ret . $ret . "ERROR: " . $mysqli->error);

	if ($mode == "report") echo '<div class="row"><div class="col s10 offset-s1">';
	if ($mode == "report") echo '<h1>Dates relative to ' . $year . ' ' . $month . '/' . $day . '</h1>';
	if ($mode == "report") echo '</div></div>';

	if ($mode == "report") echo '<div class="row"><div class="col s10 offset-s1">';
	if ($mode == "report") echo "<table class='striped'><thead><tr><th>up</th><th>date</th><th>days<br>between</th><th>weeks<br>between</th><th>YYMMDD<br>between</th><th>matches</th><th style='text-align:left'>event</th></tr></thead><tbody>";

	// $baseDate = date_create("2001-09-11");
	$baseDate = date_create($year . "-" . $month . "-" . $day);
	date_add($baseDate, date_interval_create_from_date_string('1 day'));

	$becauseReasons = array();

	while ($ev = $baseEvents->fetch_row()) {
    	$id_event = $ev[0];
    	$source = $ev[1];
    	$cat = $ev[2];
    	if (strlen($cat) == 0) $cat = "n/a";

    	$descrip = $ev[3];
    	if (strpos($descrip, "erroris") == false) continue;

    	$year = $ev[4];
    	if ($year < 0) continue;
    	
    	$month = $ev[5];
    	$day = $ev[6];
    	if ($year == $_GET["yyyy"] && $month < $_GET["mm"]) continue;
    	else if ($year == $_GET["yyyy"] && $month == $_GET["mm"] && $day < $_GET["dd"]) continue;

	   	if ($mode == "report") echo '<tr>';

	   	if ($mode == "report") echo "<td><i class='material-icons save'>add</i></td>";

	   	if ($mode == "report") echo '<td>' . $month . '/' . $day . "<br>" . $year . '</td>';

		$assocDate = date_create($year . "-" . $month . "-" . $day);

		$interval = date_diff($baseDate, $assocDate);
		$dayCnt = $interval->format('%a');

		if ($year == $_GET["yyyy"] && $month == $_GET["mm"] && $day == $_GET["dd"]) {
			$years = 0;
			$months = 0;
			$days = 0;
			$dayCnt = 0;
		}

		if ($mode == "report") echo '<td><b>' . $dayCnt . '</b><br>days</td>';

		if ($dayCnt > 6) $weeks = round($dayCnt / 7, 2);
		else $weeks = 0;
		if ($mode == "report") {
			if ($weeks == round($weeks) && $weeks > 0) echo '<td><b>' . $weeks . '<br>wks</b></td>';
			else echo '<td>' . $weeks . '<br>wks</td>';
		}

		$interval = date_diff($baseDate, $assocDate);

		if ($dayCnt == 0) {
			$years = 0;
			$months = 0;
		}
		else if ($dayCnt < 31) {
			$years = 0;
			$months = 0;
			$days = $interval->format('%d');
		}
		else if ($dayCnt < 365) {
			$years = 0;
			$months = $interval->format('%m');
			$days = $interval->format('%d');
		}
		else {
			$years = $interval->format('%y');
			$months = $interval->format('%m');
			$days = $interval->format('%d');
		}

		if ($mode == "report") echo '<td><b>' . $years . 'y' . $months . 'm' . $days . 'd</b></td>';

		//$total = nSum($years . $months . $days);
		//if ($mode == "report") echo '<td>' . $total . '</td>';

		$reason = "";
		$weight = 0;
		if (in_array($month . $day, $magicNumbers)) {
			$n = $month . $day;
			$reason .= "<br>Date: " . $n;

			if (in_array($n, $superSpecials)) $weight += 9;
			else if (in_array($n, $specials)) $weight += 7;
			else if (str_replace($masters, "", $n) != $n) $weight += 5;
			else $weight += 4;
		} 
		else if (in_array(nSum($month . $day), $magicNumbers)) {
			$n = nSum($month . $day);
			$reason .= "<br>nDate: " . $n;

			if (in_array($n, $superSpecials)) $weight += 8;
			else if (in_array($n, $specials)) $weight += 7;
			else if (str_replace($masters, "", $n) != $n) $weight += 5;
			else $weight += 4;
		}
		
		// Does the date add up to itself?
		$tot = 0;
        $nums = str_split($month);
        foreach ($nums as $k => $n) $tot += $n;
        $nums = str_split($day);
        foreach ($nums as $k => $n) $tot += $n;
        if ($tot == $day) {
        	$reason .= "<br>Datesum(" . $tot . ")";

			// if (str_replace($masters, "", $tot) != $tot) $weight += 3;
			// else if (str_replace($specials, "", $tot) != $tot) $weight += 2;
			// else 
			$weight += 2;
        }

		if (in_array($dayCnt, $magicNumbers)) {
			$n = $dayCnt;
			$reason .= "<br>DayCnt: " . $n;

			if (in_array($n, $superSpecials)) $weight += 9;
			else if (in_array($n, $specials)) $weight += 7;
			else if (str_replace($masters, "", $n) != $n) $weight += 5;
			else $weight += 4;
		}
		else if (in_array(nSum($dayCnt), $magicNumbers)) {
			$n = nSum($dayCnt);
			$reason .= "<br>nDayCnt: " . $n;

			if (in_array($n, $superSpecials)) $weight += 8;
			else if (in_array($n, $specials)) $weight += 6;
			else if (str_replace($masters, "", $n) != $n) $weight += 4;
			else $weight += 3;
		} 
		
		if ($weeks > 0 && $weeks == round($weeks)) {
			if (in_array($weeks, $magicNumbers)) {
				$n = $weeks;
				$reason .= "<br>Weeks: " . $n;

				if (in_array($n, $superSpecials)) $weight += 9;
				else if (in_array($n, $specials)) $weight += 7;
				else if (str_replace($masters, "", $n) != $n) $weight += 5;
				else $weight += 4;
			}
			else if (in_array(nSum($weeks), $magicNumbers)) {
				$n = nSum($weeks);
				$reason .= "<br>nWeeks: " . $n;

				if (in_array($n, $superSpecials)) $weight += 8;
				else if (in_array($n, $specials)) $weight += 6;
				else if (str_replace($masters, "", $n) != $n) $weight += 4;
				else $weight += 3;
			}
		} 
		
		if (in_array($years . $months . $days, $magicNumbers)) {
			$n = $years  . $months . $days;
			$reason .= "<br>YYMMDD: " . $n;

			if (in_array($n, $superSpecials)) $weight += 9;
			else if (in_array($n, $specials)) $weight += 7;
			else if (str_replace($masters, "", $n) != $n) $weight += 5;
			else $weight += 4;
		}
		else if (in_array(nSum($years . $months . $days), $magicNumbers)) {
			$n = nSum($years . $months . $days);
			$reason .= "<br>nYYMMDD: " . $n;

			if (in_array($n, $superSpecials)) $weight += 8;
			else if (in_array($n, $specials)) $weight += 6;
			else if (str_replace($masters, "", $n) != $n) $weight += 4;
			else $weight += 3;
		}
		// else
		// 	$reason .= "<br>reject: " . $years . $months . $days . " (" . nSum($years  . $months . $days) . ")";

		// else 
		if (in_array($years . $months, $magicNumbers)) { 
			$n = $years . $months;
			$reason .= "<br>YYMM: " . $n;

			if (in_array($n, $superSpecials)) $weight += 9;
			else if (in_array($n, $specials)) $weight += 7;
			else if (str_replace($masters, "", $n) != $n) $weight += 5;
			else $weight += 4;
		}
		else if (in_array(nSum($years . $months), $magicNumbers)) {
			$n = nSum($years . $months);
			$reason .= "<br>nYYMM: " . $n;

			if (in_array($n, $superSpecials)) $weight += 8;
			else if (in_array($n, $specials)) $weight += 6;
			else if (str_replace($masters, "", $n) != $n) $weight += 4;
			else $weight += 3;
		}

		if (in_array($months . $days, $magicNumbers)) { 
			$n = $months . $days;
			$reason .= "<br>MMDD: " . $n;

			if (in_array($n, $superSpecials)) $weight += 9;
			else if (in_array($n, $specials)) $weight += 7;
			else if (str_replace($masters, "", $n) != $n) $weight += 5;
			else $weight += 4;
		}
		else if (in_array(nSum($months . $days), $magicNumbers)) {
			$n = nSum($months . $days);
			$reason .= "<br>nMMDD: " . $n;

			if (in_array($n, $superSpecials)) $weight += 8;
			else if (in_array($n, $specials)) $weight += 6;
			else if (str_replace($masters, "", $n) != $n) $weight += 4;
			else $weight += 3;
		}



		$n = nSum($dayCnt . $months . $days);
		if (in_array($n, $superSpecials)) {
			$reason .= "<br>nDCnt+MMDD: " . $n;
			$weight += 9;
		}
		else if (in_array($n, $specials)) {
			$reason .= "<br>nDCnt+MMDD: " . $n;
			$weight += 8;
		}
		else if (in_array($n, $masters)) {
			$reason .= "<br>nDCnt+MMDD: " . $n;
			$weight += 5;
		}
		else if (str_replace($masters, "", $n) != $n) {
			$reason .= "<br>nDCnt+MMDD: " . $n;
			$weight += 3;
		}

		// superfelous?
		// $n = nSum($months . $days . $dayCnt);
		// if (in_array($n, $masters)) {
		// 	$reason .= "<br>nMMDD+DCnt: " . $n;
		// 	$weight += 9;
		// }
		// else if (in_array($n, $specials)) {
		// 	$reason .= "<br>nMMDD+DCnt: " . $n;
		// 	$weight += 7;
		// }

        if ($years . $months == $days) {
        	$n = $years . $months;
        	$reason .= "<br>YYMM=DD";

			if (in_array($n, $superSpecials)) $weight += 9;
			else if (in_array($n, $specials)) $weight += 7;
			else if (str_replace($masters, "", $n) != $n) $weight += 5;
			else $weight += 4;
        }


   //  	if (strlen(str_replace($masters, "", $str)) == strlen($str) - 2)
			// $reason .= "<br>Mast: " .  . "= " . nSum($years . $months . $days);


		// if (substr_count($reason, "<br>") > 1) $reason = '<b>' . $reason . '</b>';
		if ($mode == "report") echo '<td>' . substr($reason, 4) . '<br><b>Weight: ' . $weight . '</b></td>';

		if (strpos($descrip, "erroris") !== false || strpos($descrip, "suicide") !== false) $descrip = '<b>' . $descrip . '</b>';
		if ($mode == "report") echo '<td style="text-align:left">' . $descrip . '</td>';

    	$numbers = preg_replace("/[^0-9 .,-\/]/", "", $descrip);
    	$numSplit = explode(" ", $numbers);
    	foreach ($numSplit as $key => $n) {
    		$nc = (integer)str_replace(array('.', ',', '-', '/'), "", $n);
    		if (isset($foundNums[$nc])) $foundNums[$nc]++;
    		else $foundNums[$nc] = 1;

    		$nc = nSum($nc);
    		if (isset($foundNumsN[$nc])) $foundNumsN[$nc]++;
    		else $foundNumsN[$nc] = 1;
    	}

		if ($mode == "report") echo '</tr>';
	}

	$day++;

	for ( ; $year < 2020 ; $year++) { 
		for ( ; $month <= 12 ; $month++) { 
			$daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
			for ( ; $day <= $daysInMonth ; $day++) { 

				$assocDate = date_create($year . "-" . $month . "-" . $day);

				$interval = date_diff($baseDate, $assocDate);
				$dayCnt = $interval->format('%a');

				$interval = date_diff($baseDate, $assocDate);

				if ($dayCnt == 0) {
					$years = 0;
					$months = 0;
				}
				else if ($dayCnt < 31) {
					$years = 0;
					$months = 0;
					$days = $interval->format('%d');
				}
				else if ($dayCnt < 365) {
					$years = 0;
					$months = $interval->format('%m');
					$days = $interval->format('%d');
				}
				else {
					$years = $interval->format('%y');
					$months = $interval->format('%m');
					$days = $interval->format('%d');
				}

				if ($dayCnt > 6) $weeks = round($dayCnt / 7, 2);
				else $weeks = 0;

				$reason = "";
				$weight = 0;
				if (in_array($month . $day, $magicNumbers)) {
					$n = $month . $day;
					$reason .= "<br>Date: " . $n;

					if (in_array($n, $superSpecials)) $weight += 9;
					else if (in_array($n, $specials)) $weight += 7;
					else if (str_replace($masters, "", $n) != $n) $weight += 5;
					else $weight += 4;
				} 
				else if (in_array(nSum($month . $day), $magicNumbers)) {
					$n = nSum($month . $day);
					$reason .= "<br>nDate: " . $n;

					if (in_array($n, $superSpecials)) $weight += 8;
					else if (in_array($n, $specials)) $weight += 7;
					else if (str_replace($masters, "", $n) != $n) $weight += 5;
					else $weight += 4;
				}
				
				// Does the date add up to itself?
				$tot = 0;
		        $nums = str_split($month);
		        foreach ($nums as $k => $n) $tot += $n;
		        $nums = str_split($day);
		        foreach ($nums as $k => $n) $tot += $n;
		        if ($tot == $day) {
		        	$reason .= "<br>Datesum(" . $tot . ")";

					// if (str_replace($masters, "", $tot) != $tot) $weight += 3;
					// else if (str_replace($specials, "", $tot) != $tot) $weight += 2;
					// else 
					$weight += 2;
		        }

				if (in_array($dayCnt, $magicNumbers)) {
					$n = $dayCnt;
					$reason .= "<br>DayCnt: " . $n;

					if (in_array($n, $superSpecials)) $weight += 9;
					else if (in_array($n, $specials)) $weight += 7;
					else if (str_replace($masters, "", $n) != $n) $weight += 5;
					else $weight += 4;
				}
				else if (in_array(nSum($dayCnt), $magicNumbers)) {
					$n = nSum($dayCnt);
					$reason .= "<br>nDayCnt: " . $n;

					if (in_array($n, $superSpecials)) $weight += 8;
					else if (in_array($n, $specials)) $weight += 6;
					else if (str_replace($masters, "", $n) != $n) $weight += 4;
					else $weight += 3;
				} 
				
				if ($weeks > 0 && $weeks == round($weeks)) {
					if (in_array($weeks, $magicNumbers)) {
						$n = $weeks;
						$reason .= "<br>Weeks: " . $n;

						if (in_array($n, $superSpecials)) $weight += 9;
						else if (in_array($n, $specials)) $weight += 7;
						else if (str_replace($masters, "", $n) != $n) $weight += 5;
						else $weight += 4;
					}
					else if (in_array(nSum($weeks), $magicNumbers)) {
						$n = nSum($weeks);
						$reason .= "<br>nWeeks: " . $n;

						if (in_array($n, $superSpecials)) $weight += 8;
						else if (in_array($n, $specials)) $weight += 6;
						else if (str_replace($masters, "", $n) != $n) $weight += 4;
						else $weight += 3;
					}
				} 
				
				if (in_array($years . $months . $days, $magicNumbers)) {
					$n = $years  . $months . $days;
					$reason .= "<br>YYMMDD: " . $n;

					if (in_array($n, $superSpecials)) $weight += 9;
					else if (in_array($n, $specials)) $weight += 7;
					else if (str_replace($masters, "", $n) != $n) $weight += 5;
					else $weight += 4;
				}
				else if (in_array(nSum($years . $months . $days), $magicNumbers)) {
					$n = nSum($years . $months . $days);
					$reason .= "<br>nYYMMDD: " . $n;

					if (in_array($n, $superSpecials)) $weight += 8;
					else if (in_array($n, $specials)) $weight += 6;
					else if (str_replace($masters, "", $n) != $n) $weight += 4;
					else $weight += 3;
				}
				// else
				// 	$reason .= "<br>reject: " . $years . $months . $days . " (" . nSum($years  . $months . $days) . ")";

				// else 
				if (in_array($years . $months, $magicNumbers)) { 
					$n = $years . $months;
					$reason .= "<br>YYMM: " . $n;

					if (in_array($n, $superSpecials)) $weight += 9;
					else if (in_array($n, $specials)) $weight += 7;
					else if (str_replace($masters, "", $n) != $n) $weight += 5;
					else $weight += 4;
				}
				else if (in_array(nSum($years . $months), $magicNumbers)) {
					$n = nSum($years . $months);
					$reason .= "<br>nYYMM: " . $n;

					if (in_array($n, $superSpecials)) $weight += 8;
					else if (in_array($n, $specials)) $weight += 6;
					else if (str_replace($masters, "", $n) != $n) $weight += 4;
					else $weight += 3;
				}

				if (in_array($months . $days, $magicNumbers)) { 
					$n = $months . $days;
					$reason .= "<br>MMDD: " . $n;

					if (in_array($n, $superSpecials)) $weight += 9;
					else if (in_array($n, $specials)) $weight += 7;
					else if (str_replace($masters, "", $n) != $n) $weight += 5;
					else $weight += 4;
				}
				else if (in_array(nSum($months . $days), $magicNumbers)) {
					$n = nSum($months . $days);
					$reason .= "<br>nMMDD: " . $n;

					if (in_array($n, $superSpecials)) $weight += 8;
					else if (in_array($n, $specials)) $weight += 6;
					else if (str_replace($masters, "", $n) != $n) $weight += 4;
					else $weight += 3;
				}



				$n = nSum($dayCnt . $months . $days);
				if (in_array($n, $superSpecials)) {
					$reason .= "<br>nDCnt+MMDD: " . $n;
					$weight += 9;
				}
				else if (in_array($n, $specials)) {
					$reason .= "<br>nDCnt+MMDD: " . $n;
					$weight += 8;
				}
				else if (in_array($n, $masters)) {
					$reason .= "<br>nDCnt+MMDD: " . $n;
					$weight += 5;
				}
				else if (str_replace($masters, "", $n) != $n) {
					$reason .= "<br>nDCnt+MMDD: " . $n;
					$weight += 3;
				}

				// superfelous?
				// $n = nSum($months . $days . $dayCnt);
				// if (in_array($n, $masters)) {
				// 	$reason .= "<br>nMMDD+DCnt: " . $n;
				// 	$weight += 9;
				// }
				// else if (in_array($n, $specials)) {
				// 	$reason .= "<br>nMMDD+DCnt: " . $n;
				// 	$weight += 7;
				// }

		        if ($years . $months == $days) {
		        	$n = $years . $months;
		        	$reason .= "<br>YYMM=DD";

					if (in_array($n, $superSpecials)) $weight += 9;
					else if (in_array($n, $specials)) $weight += 7;
					else if (str_replace($masters, "", $n) != $n) $weight += 5;
					else $weight += 4;
		        }


				if ($reason == "") continue;
				else $becauseReasons[] = $reason;
				if ($weight > 32) $reason = '<br><b>' . substr($reason, 4) . '</b>';
				// if ($reason == "") $reason = '<br><i>Estimated:</i> ' . $month . $day . ": " . nSum($month . $day) . ", dCnt: " . nSum($dayCnt) . ",  d: " . nSum($days) . ", wks: " . nSum($weeks);

				//$total = nSum($years . $months . $days);
				//if ($mode == "report") echo '<td>' . $total . '</td>';

			   	if ($mode == "report") echo '<tr>';

			   	if ($mode == "report") echo "<td><i class='material-icons save'>add</i></td>";

			   	if ($mode == "report") echo '<td>' . $month . '/' . $day . "<br>" . $year . '</td>';
				if ($mode == "report") echo '<td><b>' . $dayCnt . '</b><br>days</td>';

				if ($mode == "report") {
					if ($weeks == round($weeks) && $weeks > 0) echo '<td><b>' . $weeks . '<br>wks</b></td>';
					else echo '<td>' . $weeks . '<br>wks</td>';
				}

				if ($mode == "report") echo '<td><b>' . $years . 'y' . $months . 'm' . $days . 'd</b></td>';
				// if ($mode == "report") echo '<td style="text-align:left"><i>Estimated:</i> ' . nSum($month . $day) . ", dCnt: " . nSum($dayCnt) . ",  d: " . nSum($days) . ", wks: " . nSum($weeks) . '</td>';
				if ($mode == "report") echo '<td>' . substr($reason, 4) . '</td>';

				if ($mode == "report") echo '<td style="text-align:left"><b>Weight: ' . $weight . '</b></td>';

				if ($mode == "report") echo '</tr>';

				if ($mode == "csv-weight") {
					$weight = round($weight * 2.2);
					if ($weight > 99) $weight = 99;

					echo $month . "/" . $day . "," . $weight . "<br>";
				}
			}

			$day = 1;
		}

		$month = 1;
	}

	if ($mode == "report") echo '</table></div></div>';

	if ($mode == "report") echo '<div class="row"><div class="col s10 offset-s1">';
	if ($mode == "report") echo '<h1>Numbers found in events</h1>';
	if ($mode == "report") echo '</div></div>';

	if ($mode == "report") echo '<div class="row"><div class="col s4 offset-s4">';
	if ($mode == "report") echo "<table class='striped'><thead><tr><th>number</th><th>count</th></tr></thead><tbody>";

	arsort($foundNumsN, SORT_NUMERIC);
	foreach ($foundNumsN as $key => $value) {
		if ($key > 0)
			if ($mode == "report") echo "<tr><td><b>" . $key . "</b></td><td>" . $value  . "</td></tr>";
	}
	if ($mode == "report") echo '</table></div></div>';



	// parse out found reasons and rank
	if ($mode == "report") echo '<div class="row"><div class="col s10 offset-s1">';
	if ($mode == "report") echo "<table class='striped'><thead><tr><th>reason</th><th>count</th></tr></thead><tbody>";

	$reasonCounts = array();
	foreach ($becauseReasons as $k => $reasons) {
		$reas = explode("<br>", $reasons);

		foreach ($reas as $k2 => $r) {
			if (isset($reasonCounts[$r])) $reasonCounts[$r]++;
			else $reasonCounts[$r] = 1;
		}
	}

	arsort($reasonCounts);
	foreach ($reasonCounts as $reason => $cnt)
		if ($mode == "report") echo "<tr><td>" . $reason . "</td><td>" . $cnt . "</td></tr>";
		// csv export for reasons here

	if ($mode == "report") echo '</table></div></div>';

	if ($mode == "report") echo '<div class="row"><div class="col s10 offset-s1">';
	if ($mode == "report") echo '<h1>Numbers found in events</h1>';
	if ($mode == "report") echo '</div></div>';

	if ($mode == "report") echo '<div class="row"><div class="col s4 offset-s4">';
	if ($mode == "report") echo "<table class='striped'><thead><tr><th>number</th><th>count</th></tr></thead><tbody>";

	if ($mode == "report") echo '</table></div></div>';
?>


<?php if($mode == "report") : ?>
<script src="https://code.jquery.com/jquery-3.2.1.slim.min.js"></script>
<script>
	$(document).ready(function() {
		$('i.save').click(function() {
			var tre = $(this).parent('td').parent('tr');
			$('table.saved tbody').append(tre);
		});
	});
</script>

</body>
<?php endif; ?>	
