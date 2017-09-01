<?php
	if (empty($_POST["idx"])) die('{"error":"IDX not found."}');

	chdir(dirname(__FILE__));
	$vars = include "../vars.php";

	$mysqli = new mysqli($vars['dbserver'], $vars['dbdel']['user'], $vars['dbdel']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	$mysqli->set_charset("utf8");

	$qry = "DELETE from likes WHERE user = '" . $mysqli->real_escape_string($_COOKIE["user"]) . "'"
		. " and id_like = " . $mysqli->real_escape_string($_POST["idx"])
		// . " and url = '" . $mysqli->real_escape_string($_POST["url"]) . "'"
		// . " and permalink = '" . $mysqli->real_escape_string($_POST["permalink"]) . "'"
	;

	$result = $mysqli->query($qry); 
	if ($result === false) die('{"error":"' . str_replace('"', "&quot;", $mysqli->error) . '"}');
	else die('{"result":"success"}');
?>