<?php
	if (empty($_POST["idx"])) die('{"error":"IDX not found."}');

	chdir(dirname(__FILE__));
	$vars = include "../vars.php";

	$mysqli = new mysqli($vars['dbserver'], $vars['dbwrite']['user'], $vars['dbwrite']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	$mysqli->set_charset("utf8");

	$user = $mysqli->real_escape_string($_COOKIE["user"]);
	$idx = $mysqli->real_escape_string($_POST["idx"]);

	$result = $mysqli->query(
		"INSERT INTO suggestions_rejected (user, friend, bucket, url)"
		. "SELECT distinct '" . $user . "', friend, bucket, url from user_suggestions"
		. " where url = (select url from user_suggestions where id_suggestion = " . $idx . ")"	//  limit 0, 1
	); 
	if ($result === false) die('{"error":"' . str_replace('"', "&quot;", $mysqli_del->error) . '"}');

	$mysqli_del = new mysqli($vars['dbserver'], $vars['dbdel']['user'], $vars['dbdel']['pass'], $vars['dbname']);
	if ($mysqli_del->connect_error) die('Connect Error (' . $mysqli_del->connect_errno . ') ' . $mysqli_del->connect_error);
	$mysqli_del->set_charset("utf8");

	$result = $mysqli_del->query("DELETE from user_suggestions WHERE user = '" . $mysqli_del->real_escape_string($user) . "' and id_suggestion = " . $idx); 
	if ($result === false) die('{"error":"' . str_replace('"', "&quot;", $mysqli_del->error) . '"}');
	else die('{"result":"success"}');
?>