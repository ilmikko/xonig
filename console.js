// Trying to standardize (for us) how console works so that our code won't break if it suddenly does not exist
var log=function(){},timestart=function(){},timeend=function(){};
if (typeof console==="object") {
        if (typeof console.log==="function") log=console.log;
        if (typeof console.time==="function"&&typeof console.timeEnd==="function"){
                timestart=console.time;
                timeend=console.timeEnd;
        }
        delete console;
}

var format={
        info:"\x1b[92mInfo: %s\x1b[0m",
        debug:"\x1b[36m%s\x1b[0m",
        error:"\x1b[31mERROR: %s\x1b[0m",
        warn:"\x1b[33mWarn! %s\x1b[0m",
        squeak:"\x1b[5m\x1b[46mSqueak! %s\x1b[0m",
        mass:"\x1b[2m%s\x1b[22m"
};

console = new Proxy({
        time:timestart,
        timeEnd:timeend,
        format:format
},{get:function(target,key){
        return function(){
                if (key in target) target[key].apply(console,arguments); else {
                        if (key in format) arguments[0]=format[key].replace("%s",arguments[0]);
                        log.apply(console,arguments);
                }
        }
}});
