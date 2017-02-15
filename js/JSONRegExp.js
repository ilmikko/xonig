function JSONRegExp(string){
        // syntax: /expr/flags
        var expr,flags,valid=false;
        string.replace(/^\/?(.*)\/([ginmy]*)$/,function(_,_1,_2){
                valid=true;
                expr=_1;
                flags=_2;
        });

        if (!valid) throw new Error("RegExp '"+string+"' is not valid!");

        // there are some 'custom flags', like n, which negates the true and false.
        var negate=false;

        if (flags.indexOf("n")>-1){
                negate=true;
                flags=flags.replace("n","");
        }

        this.data=new RegExp(expr,flags);
        this.negate=negate;
}

JSONRegExp.prototype=new Proxy({
        exec:function(){
                return this.data.exec.apply(this.data,arguments);
        },
        test:function(){
                var result=this.data.test.apply(this.data,arguments);
                if (this.negate) result=!result;
                return result;
        }
},{
        get:function(target,key){
                var p=RegExp.prototype;
                if (key in target){
                        return target[key];
                }else if (key in p){
                        return p[key];
                }
        }
});

module.exports=JSONRegExp;
