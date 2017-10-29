return {
	path:function(path){
                this.realpath=path;
        },
        data:function(data){
                this.header["Content-Length"]=Buffer.byteLength(data);
        },
	serve:function(serve){
		return function(o,callback){
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
				serve.header['content-type']="image/jpg";
				s.pipe(o.res);
			});
			s.on('close',function(){
				callback({
					IP:o.IP,
					status:200
				});
			});
		}
	},
        mime:function(mime){
                this.header["Content-Type"]=mime;
        }
};
