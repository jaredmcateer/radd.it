listr = {};								// One object to rule them all and in the darkness bind them.

listr.opts = {};
// User-settable.  All options correspond to an element in options <div>
listr.opts['showMedia'] = true;			// media isn't displayed when set to false
listr.opts['showAbout'] = true;			// about+ found links aren't displayed when set to false
listr.opts['allowNoStream'] = true;		// only allow sites that automatically stream/ skip to next?
listr.opts['allowAds'] = true;			// allow sites that include ads w/ the media?
listr.opts['autoSkip'] = true;			// skip to the next link when we get a 'finish' event?
listr.opts['allowNSFW'] = true;			// allow links marked NSFW?
