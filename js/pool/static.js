module.exports={
        data:function(data){
                this.body=data;
                this.header["content-length"]=Buffer.byteLength(data);
        },
        mime:function(mime){
                this.header["content-type"]=mime;
        },
	serve:function(serve){
		return function(o,callback){
			extend(o,serve);
			o.res.writeHead(o.status,o.header);
			o.res.end(o.body);
			callback(o);
		}
	}
};