return {
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
			if (o.req.headers["if-none-match"]==serve.header["etag"]){
				// Content match, send 304
				callback({
					IP:o.IP,
					status:304,
					header:serve.header
				});
			}else{
				// No match, send 200 and actual content
				o.res.writeHead(200,extend(serve.header,{}));

				var path = serve.realpath;
				var s = fs.createReadStream(path);
				s.on('error',function(){
					callback({
						IP:o.IP,
						status:500,
						body:http.STATUS_CODES[500]
					});
				});
				s.on('open',function(){
					s.pipe(o.res);
				});
				s.on('close',function(){
					callback({
						IP:o.IP,
						status:200
					});
				});
			}
		}
	},
        mime:function(mime){
                this.header["Content-Type"]=mime;
        }
};
