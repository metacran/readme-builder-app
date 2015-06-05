var marky = require("marky-markdown");
var request = require('request');
var async = require('async');

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

    var pkg = {
	name: package,
	repository: {
	    type: "git",
	    url: "https://github.com/cran/" + package
	}
    };

    var html = marky(filter_md(md), { package: pkg }).html();
    callback(null, html);
}

function filter_md(md) {

    return md
	.replace(/^\s*<!--[^\n]*-->\n?/m, '')  // leading comment
	.replace(/^\s*#[^\n]*\n/m, '')	       // leading header # style
	.replace(/^\s*[^\n]*\n===*\n/m, '')    // leading header, === style
	.replace(/^\s*>[ ]*[^\n]*\n/m, '');    // leading quote
}

module.exports = build_readme;
