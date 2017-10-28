return {
        data:function(data){
                this.body=data;
                this.header["Content-Length"]=Buffer.byteLength(data);
        },
        mime:function(mime){
                this.header["Content-Type"]=mime;
        }
};
