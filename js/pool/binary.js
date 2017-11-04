const etag=xonig.etag,http=xonig.http,fs=xonig.fs;
module.exports={
	path:function(path){
                this.realpath=path;
        },
        data:function(data){
                this.header["content-length"]=Buffer.byteLength(data);
		this.header["etag"]=etag(data);
        },
	mime:function(mime){
		this.header['content-type']=mime;
	},
	serve:function(serve){
		return function(o,callback){
			// Check if content matches
			// FIXME: not standard conditional behavior
			// See: https://tools.ietf.org/html/rfc7232#section-3.2

			function final(r){
				o.res.writeHead(r.status,r.header);
				o.res.end(r.body);
				callback(r);
			}

			var status=200,header=extend({},serve.header);
			if (o.req.headers["if-none-match"]==serve.header["etag"]){
				// Content match, send 304
				final({
					ip:o.ip,
					status:304
				});
			}else{
				// No match, send 200 and actual content
				o.res.writeHead(status,header);

				var path = serve.realpath;
				var s = fs.createReadStream(path);
				s.on('error',function(){
					final({
						ip:o.ip,
						status:500,
						body:http.STATUS_CODES[500]
					});
				});
				s.on('open',function(){
					s.pipe(o.res);
				});
				s.on('close',function(){
					o.res.end();

					callback({
						ip:o.ip,
						status:200
					});
				});
			}


		}
	}
};
