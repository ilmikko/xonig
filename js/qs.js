module.exports={
        parse:function parseQueryString(qs){
                let data={};
                if (!qs) return data;

                qs=qs.split(/[&;]/);
                for (let p of qs){
                        // Parse key-value pairs
                        let pi=p.indexOf('=')+1;

                        // If there is an '=' in p
                        if (pi){
                                var k=decodeURIComponent(p.slice(0,pi-1)), v=decodeURIComponent(p.slice(pi));
                                data[k]=v;
                        }else{
                                data[p]='';
                        }
                }

                return data;
        }
}
