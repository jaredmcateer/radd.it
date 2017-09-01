<?php

    function nSum($str) {
echo "nSum(" . $str . ")<br>";

        $trumps = array(447, 527, 617, 661, 5711, 6228);

        $masters = array(11, 22, 33, 44, 55, 66, 77, 88, 99);

        $superSpecials = array(
            111, 112, 113, 114, 115, 116, 117, 118, 119, 121, 122, 133, 144, 161, 166, 191, 199
            , 211, 222, 223, 225, 226, 229, 244, 255, 299
            , 311, 322, 333, 336, 337, 339, 355
            , 411, 420, 422, 433, 441, 442, 444, 445, 499
            , 511, 522, 555, 557, 599
            , 611, 616, 619, 622, 636, 655, 661, 666, 677, 691
            , 711, 722, 777, 799
            , 811, 815, 822, 888, 899
            , 911, 916, 922, 988, 999

            , 1211, 1216, 1219, 1222

            , 5111, 5113, 5115
            , 6228
            
            , 12124, 12321, 13114, 14419 

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

        $str = (integer)preg_replace("/[^1-9]/", "", $str); // omit 0s?  really?
        $nums = str_split($str);
        $cnt = count($nums);

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
            && (!in_array($str, $trumps))
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
            if ($depth) $weight = ($cnt - $depth) + 2;
            else $weight = $cnt + 3;

            $tot = 0;
            foreach ($results as $k => $n)
                foreach ($list as $listK => $listN) $resWeight[$k] += substr_count($n, $listN) * $weight;
        }

print_r($results);
print_r($resWeight);

        $topWeight = -77;
        foreach ($results as $k => $n)
            if ($resWeight[$k] > $topWeight) $topWeight = $resWeight[$k];

        foreach ($results as $k => $n) 
            if ($resWeight[$k] == $topWeight) return nSum($n);
    }

echo "<pre>";
    // nSum('22');
    // nSum('45');
    // nSum('137');
    // nSum('173');
    // nSum('522');
    // nSum('713');
    $res = nSum($_GET["n"]);
    echo chr(13) . "<h1><b>SURVEY SAYS: " . $res . '</b></h1>';

    // echo "<hr>22: " . nSum('22') . chr(13);
    // echo "<hr>45: " . nSum('45') . chr(13);
    // echo "<hr>137 : " . nSum('137 ') . chr(13);
    // echo "<hr>173: " . nSum('173') . chr(13);
    // echo "<hr>522: " . nSum('522') . chr(13);
    // echo "<hr>713: " . nSum('713') . chr(13);
    // echo "<hr>1713: " . nSum('1713') . chr(13);
    // echo "<hr>5754: " . nSum('5754') . chr(13);

?>