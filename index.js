var http = require('http');
var fs = require('fs');

http.createServer(function (request, response) {
	try {
		var url = request.url;
		var props = _parseUrl(url);
		if (props && props.type == 'static') {
			staticFile(props.path, response)
		} else {
			console.log("No request handler found for " + url);
		    response.writeHead(404, {"Content-Type": "text/html"});
		    response.write("404 Not found");
		    response.end();
		}
	}catch(e) {
		try {
			response.end();
		} catch(ignore){}
		console.log(e);
	}
}).listen(8881);

function _parseUrl(url) {
	if (url == '/' || url == '/index.html') {
		return {
				path: 'index.html',
				type: 'static'
			}
	}
	if (/^\/(js|css|images|static)\//.test(url)) {
		var path = url.substring(1);
		if (fs.existsSync(path) && fs.statSync(path).isFile()) {
			return {
				path: path,
				type: 'static'
			}
		}
	}
	return null;
}

/* handle all static files */
function staticFile(filename, response) {
	var data = fs.readFileSync(filename);
	var filetype = filename.split('.').pop();

	var contentType = 'text/html';
	if (filetype == 'css') {
		contentType = 'text/css';
	} else if (filetype == 'js') {
		contentType = 'text/javascript';
	} else if (filetype == 'png' || filetype == 'gif') {
		contentType = 'image/' + filetype;
		response.writeHead(200, {
			'content-type': contentType,
			'content-length': data.length
		});
		response.end(data, 'binary');
	}

	// text type
	var body = data.toString();
	response.writeHead(200, {
		'content-type': contentType
	});
	response.end(body);
}