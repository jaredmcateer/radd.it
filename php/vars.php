<?php
	$globalVars = array();
	$globalVars['donations'] = 0;

	$globalVars['buckets'] = array("music", "vids", "pics", "eyecandy", "ladycandy", "nsfw", "gaynsfw");
	$globalVars['bucketDescrips'] = array(
		'music' => 'Has a beat/ makes you tap yer feet.'
		, 'vids' => 'Movies, shows, and other videos'
		, 'pics' => 'Pics of animals and things.'
		, 'eyecandy' => 'SFW pics of attractive ladies.'
		, 'ladycandy' => 'SFW pics of attractive men.'
		, 'nsfw' => 'The naughty bits.'
		, 'gaynsfw' => 'Steamy man-on-man action.'
	);

	// $globalVars['cats'] = array(
	// 	"music" => array("Mixed", "Hip-Hop")
	// 	, "vids" => array("Mixed", "Shorts", "TV Shows", "Movies")
	// 	, "pics" => array()
	// 	, "eyecandy" => array()
	// 	, "ladycandy" => array()
	// 	, "nsfw" => array()
	// 	, "gaynsfw" => array()
	// );

	// $globalVars['catPrefixes'] = array(
	// 	"music" => array("00`", "")
	// );

	$globalVars['sources'] = array("reddit", "youtube", "soundcloud", "bandcamp", "vimeo");

	$globalVars['timers'] = array(		// used to time lookup services
		"amazon" => 0
		, "echonest" => 0
	);


	$globalVars['dbserver'] = 'localhost';
	$globalVars['dbname'] = 'twooh';
	$globalVars['dbread'] = array('user' => 'two_read', 'pass' => '4xKvdkxN');
	$globalVars['dbwrite'] = array('user' => 'two_right', 'pass' => 'xd56wATtxX5c8ER6');
	$globalVars['dbdel'] = array('user' => 'two_del', 'pass' => 'tAu9uGNKyLzEPJCs');

	$globalVars['hashPrefix'] = "BKHCAfSe";		// used to verify username cookie hasn't been changed.

	$globalVars['loaded'] = true;

	return $globalVars;
?>