var express = require('express');
var http = require('http');
var path = require('path');

var app = express();

//---- port 2046 is for localhost, use port 80 when pushing to remote host
app.set('port', 2045);
app.use(express.static(path.join(__dirname,'public')));

// ---- create server
http.createServer(app).listen(app.get('port'), function(){
	console.log('server started on port', app.get('port'));
});

//---- setting up routes
app.get('/', serveIndex);

function serveIndex(req, res){
	res.sendFile('improv_triangles.html', {root: './public'});
}