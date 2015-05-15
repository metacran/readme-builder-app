var debug = require('debug');
var build_readme = require('./lib/build_readme');

function run() {

    var broker_url = process.env.RABBITMQ_URL || 'amqp://localhost';
    var q = 'readme';
    var open = require('amqplib').connect(broker_url);

    open.then(function(conn) {
	var ok = conn.createChannel();
	ok = ok.then(function(ch) {
	    ch.assertQueue(q);
	    ch.consume(q, function(msg) {
		if (msg !== null) {
		    var msg_obj = JSON.parse(msg.content.toString());
		    console.log(msg_obj.package + " start.");

		    build_readme(msg_obj, function(error, html) {
			if (!error) {
			    if (html != "") {
				store_html(msg_obj.package, html);
			    }
			    console.log(msg_obj.package + " done.");
			} else {
			    console.log(msg_obj.package + ' error.');
			}
			ch.ack(msg);
		    });
		}
	    });
	});
	return ok;
    }).then(null, console.warn);
}

function store_html(package, html) {
    var couch_url = process.env.DOCSDB_URL || 'http://127.0.0.1:5984';
    var nano = require('nano')(couch_url);
    var db = nano.db.use('readme');
    var doc = 	{ 'date': new Date().toISOString(),
		  'html': JSON.stringify(html) };
    db.insert(doc, package, function(error, response) {
	if (error) { return console.log(error); }
	doc._rev = response.rev;
	db.insert(doc, package);
    });
}

module.exports = run;
