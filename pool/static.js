return {
        data:function(data){
                this.body=data;
                this.headers["Content-Length"]=Buffer.byteLength(data);
        },
        mime:function(mime){
                this.headers["Content-Type"]=mime;
        }
};
