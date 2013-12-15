// getPost

var qs = require('querystring');
function getPost(request, callback){
	var body = '';
	request.on('data', function (data) {
	    body += data;
	});
	request.on('end', function () {
	    var postData = qs.parse(body);
	    // use POST
		callback(postData);
	});
	return "foo";

}

exports.getPost = getPost;