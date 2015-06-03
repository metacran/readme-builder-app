var request = require('request');
var async = require('async');
var gh_got = require('gh-got');

function build_readme(entry, callback) {
    var package = entry.package;

    var readmes = [
	'README.md', 'README.markdown', 'README.mdown', 'README.mkdn',
	'inst/README.md', 'inst/README.markdown', 'inst/README.mdown',
	'inst/README.mkdn'
    ];

    var md = null;

    async.detectSeries(
	readmes,
	function(item, callback) {
	    var url = 'https://raw.githubusercontent.com/cran/' + package +
		'/master/' + item;
	    request(url, function(error, response, body) {
		var ok = !error && response.statusCode == 200;
		if (ok) { md = body; }
		callback(ok);
	    })
	},
	function(result) {
	    if (result) {
		do_markdown(package, md, callback);
	    } else {
		console.log(package + " no README file");
		callback(null, "");
	    }
	}
    )
}

function do_markdown(package, md, callback) {

    var body = { text: md, mode: 'gfm', context: 'cran/' + package };

    gh_got.post(
	'markdown',
	{ token: process.env.GH_TOKEN || null,
	  body: JSON.stringify(body),
	  json: false,
	  headers: {
	      json: true,
              'user-agent': 'https://github.com/metacran/readme-builder-app',
	      'accept': 'application/vnd.github.v3+json' }
	},
	function(error, data, response) {
	    console.log(data)
	    callback(error, data)
	});
}

module.exports = build_readme;
