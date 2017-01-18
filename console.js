// Trying to originalize how console works so that our code won't break if it suddenly does not exist
var log=function(){}
if (console) {
        log=console.log;
        delete console;
}
console = new Proxy({},{get:function(_,key){
        return function(){
                // etkjopa
                log.apply(console,arguments);
        }
}});
