<html>
<head>
  <link href="http://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link type="text/css" rel="stylesheet" href="css/materialize.min.css"  media="screen,projection"/>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>h1 { width: 100%; text-align: center; } td, th { text-align: center; } i.save { cursor: pointer; } </style>
</head>

<body>
	<div class="row"><div class="col offset-s3 s6">
	<table class='striped'><thead><tr><th>#</th><th>equation</th><th>what</th></tr></thead><tbody>


<?php
	$pyramids = array();
	for ($i=1; $i <= 1111; $i++) { 
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

	ksort($pyramids);
	foreach ($pyramids as $k => $pyr) {
		echo '<tr><td>' . $k . '</td><td>' . $pyr . '</td><td>';

		if (substr_count($pyr, "+") > 2 && substr_count($pyr, "x") > 2) echo '<b>pyramids</b></td>';
		else if (substr_count($pyr, "+") > 2 && substr_count($pyr, "x") > 1) echo 'both</td>';
		else if (substr_count($pyr, "x") > 2 && substr_count($pyr, "+") > 1) echo 'both</td>';
		else if (substr_count($pyr, "+") > 2 || substr_count($pyr, "x") > 2) echo 'pyramid</td>';
		else echo 'triangle</td>';

		echo '</tr>';
	}
?>

</tbody></table>
</div></div>
</body>
</html>
