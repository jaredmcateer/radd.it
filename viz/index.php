<?php header("Expires: Sat, 26 Jul 2020 05:00:00 GMT"); ?>
<!DOCTYPE html>
<html>
<head>
	<style>
		html, body, iframe { margin: 0; padding: 0; border: 0; width: 100%; height: 100%; overflow: hidden; background-color: black; }
		iframe { position: fixed; top: 0; left: 0; display: none; }
	</style>

	<script type="text/javascript" src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui.min.js"></script>
</head>

<body>
	<iframe id="f1" src="none.html"></iframe>
	<iframe id="f2" src="none.html"></iframe>

	<script type="text/javascript">
		vizes = [
			'Checkerflower by Robert Elek.html'
			,'Daisy Chain by Jon Faviell.html'
			,'Flower of Life by Tristan Brehaut.html'
			,'Morphose by Benjamin Bill Planche.html'
			,'Serious Stuff by Pawel Waleczek.html'
			,'Steven Wittens.html'
			,'very strange attractors by chris mckenzie.html'
			,'Kaleidoscope by ponce.html'
			,'Wavy Waves by Yuri Ivatchkovitch.html'
			,'Shiny Discs by Daniel Muller.html'
			,'Circlemeetssquare by Ryan.html'
			,'Trippy Metaballs by rwbg.html'
			,'Fireworks by Greg Reimer.html'
			,'PHI by Premasagar Rose.html'
			,'Screensaver by Anwerso.html'
			,'Meandering Dots by sq2.html'
			,'Robot Warehouse by oberhamsi.html'
			,'Cellular by Jason Brown.html'
			,'Psychedelic animation by Piotr Stosur.html'
			// ,'.html'

			// Removed:
			// ,'Flower by Cheeseum.html'
			// ,'Flying Carpet by Christian Krebs.html'
			// ,'Mars Rover by Ashley Bryant.html'
			// ,'Oldskool Plasma by Juhani Imberg.html'
		];

		$(document).ready(function() {
			var fadeMS = 3000;
			var frameDur = 30000;

			$('#f1').attr('src', './' + vizes[Math.floor(Math.random() * vizes.length)]).fadeIn(3000);	// start first one

			var first = true;
			setInterval(function() {
				if (first)
				{	// f1 is active, fade to f2
					var viz = vizes[Math.floor(Math.random() * vizes.length)];
					while (viz == $('#f1').attr('src')) viz = vizes[Math.floor(Math.random() * vizes.length)];
					$('#f2').attr('src', './' + viz).fadeIn(fadeMS);	// start first one

					$('#f1').fadeOut(fadeMS, function() { $('#f1').attr('src', './none.html'); });
				}
				else
				{
					var viz = vizes[Math.floor(Math.random() * vizes.length)];
					while (viz == $('#f2').attr('src')) viz = vizes[Math.floor(Math.random() * vizes.length)];
					$('#f1').attr('src', './' + viz).fadeIn(fadeMS);	// start first one

					$('#f2').fadeOut(fadeMS, function() { $('#f2').attr('src', './none.html'); });
				}

				first = !first;
			}, frameDur);	// change viz.
		});
	</script>
</body>
</html>
