<?php
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
            ,CURLOPT_USERAGENT => 'radd.it lookup for /u/' . $_COOKIE["user"]
        );
        
        if ($postValsCurl != null) {
            $curlOptions[CURLOPT_POSTFIELDS] = $postValsCurl;
            $curlOptions[CURLOPT_CUSTOMREQUEST] = "POST";  
        }

        curl_setopt_array($chCurl, $curlOptions);
        
        $curlResponse = curl_exec($chCurl);
        curl_close($chCurl);

        return $curlResponse;
    }

	$mysqli = new mysqli($vars['dbserver'], $vars['dbread']['user'], $vars['dbread']['pass'], $vars['dbname']);
	if ($mysqli->connect_error) die('Connect Error (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error);
	$mysqli->set_charset("utf8");

	$user = $mysqli->real_escape_string($_COOKIE["user"]);
	// $bucket = $mysqli->real_escape_string($_POST["bucket"]);
	$subs = $_POST["subs"];

	if (empty($user)) die('{"error": "No user."}');
	// else if (empty($bucket)) die('{"error": "No bucket."}');
	// else print_r($_POST);
	// die();

	// $qry = "SELECT thumb, title, url, permalink, id_reddit, author, subreddit from user_upvotes where user = '" . $user . "'";
	$qry = "SELECT author, count(*) from user_upvotes where user = '" . $user . "'";
	
	if (count($subs) > 0) {
		$qry .= " and subreddit in (";
		foreach ($subs as $i => $sub) $qry .= ($i > 0 ? "," : "") . "'/r/" . $sub . "'";
		$qry .= ")";
	}

	$qry .= " group by author order by count(*) DESC limit 0, 20";

// echo $qry;
	$favs = $mysqli->query($qry);
	if ($favs->num_rows === 0)  die('{"error": "No upvotes found for these subs."}');

	$authors = array();
	while ($rec = $favs->fetch_row()) $authors[$rec[0]] = $rec[1];
	// rsort($authors);
	while (count($authors) > 10) array_splice($authors, 5 + mt_rand(0, count($authors) - 6), 1);


	$links = array();
	// while ($rec = $favs->fetch_row()) {
	foreach ($authors as $author => $score) {
// die('{"error": "https://www.reddit.com/user/' . $author . '/submitted.json?limit=100"}');		
		$file = runCurl("https://www.reddit.com/user/" . $author . "/submitted.json?limit=100");
		$input = mb_convert_encoding($file, 'UTF-8', 'ASCII,UTF-8,ISO-8859-1');
		if(substr($input, 0, 3) == pack("CCC", 0xEF, 0xBB, 0xBF)) $input = substr($input, 3);
		$input = preg_replace('/.+?({.+}).+/','$1',$input);
		$out = json_decode($input);

		foreach ($out->children as $found)
		{
			$post = $found->data;
			$sub = $post->subreddit;
			if (!in_array($sub, $subs, true) || strpos($post->url, "reddit.com/") !== false) continue;

			$key = $post->created_utc;
			while (isset($links[$key])) $key++;

			$thumb = $post->thumbnail;
			if (isset($post->media) && isset($post->media->oembed) && !empty($post->media->oembed->thumbnail_url))
				$thumb = $post->media->oembed->thumbnail_url;

			$links[$key] = array(
				'thumb' => $thumb
				,'title' => $post->title
				,'url' => $post->url
				,'permalink' => $post->permalink
				,'name' => $post->name
				,'author' => $post->author
				,'subreddit' => $post->subreddit
				,'score' => $post->score
			);
		}
	}

	if (count($links) == 0) die('{"error": "No links returned from reddit.  Is it down?"}');
	else {
		krsort($links);
		$cnt = 0;

		echo '{"links":[';
		foreach ($links as $key => $post) {
			if ($cnt > 199) continue;

			echo 
				($cnt > 0 ? "," : "") . '{'
					. '"thumb":"' . str_replace('"', '\\"', $post['thumb'])
					. '","title":"' . str_replace('"', '\\"', $post['title'])
					. '","url":"' . str_replace('"', '\\"', $post['url'])
					. '","permalink":"' . str_replace('"', '\\"', $post['permalink'])
					. '","name":"' . str_replace('"', '\\"', $post['name'])
					. '","author":"' . str_replace('"', '\\"', $post['author'])
					. '","subreddit":"' . str_replace('"', '\\"', $post['subreddit'])
					. '","score":"' . str_replace('"', '\\"', $post['score'])
				. '"}';

			$cnt++;
		}
		echo "]}";
	}
?>