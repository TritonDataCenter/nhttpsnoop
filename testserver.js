/*
 * testserver.js: exercise the HTTP client and server
 */

var mod_http = require('http');

var port = 8080;
var server;

function main()
{
	if (process.argv.length > 2) {
		port = Math.floor(process.argv[2]);

		if (isNaN(port)) {
			console.error('usage: %s %s [port]',
			    process.argv[0], process.argv[1]);
			process.exit(1);
		}
	}

	server = mod_http.createServer(function (request, response) {
		setTimeout(function () {
			response.writeHead(200,
			    { 'content-type': 'text/plain' });
			response.end('hello world\n');
		}, 1);
	});

	server.listen(port, function () {
		console.log('server running at http://%s:%d',
		    server.address()['address'], port);
	});

	setInterval(tick, 1000);
}

function tick()
{
	/*
	 * We perform a random number of requests (up to 3) using some
	 * randomized paths and query strings.  This less us exercise the "path"
	 * vs. "url" fields as well as overlapping operations.
	 */
	var nrequests = Math.ceil(Math.random() * 3);
	var uris = [ '/wendell', '/uter', '/allison' ];
	var queries = [ '', '?limit=5', '?limit=5&offset=5' ];
	var i;
	
	for (i = 0; i < nrequests; i++) {
		mod_http.get({
		    'agent': false,
		    'port': port,
		    'path': uris[Math.floor(Math.random() * uris.length)] +
		        queries[Math.floor(Math.random() * queries.length)]
		});
	}
}

main();
