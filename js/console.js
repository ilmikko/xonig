// Trying to standardize (for us) how console works so that our code won't break if it suddenly does not exist

var log=function(){},timestart=function(){},timeend=function(){};
if (typeof console==="object"){
        if (typeof console.log==="function") log=console.log;
        if (typeof console.time==="function"&&typeof console.timeEnd==="function"){
                timestart=console.time;
                timeend=console.timeEnd;
        }
        delete console;
}

var colors={
        default:"\x1b[0m",
        lightgreen:"\x1b[92m",
        lightyellow:"\x1b[93m",
        red:"\x1b[31m",
        green:"\x1b[32m",
        yellow:"\x1b[33m",
        blue:"\x1b[36m",
        magenta:"\x1b[35m",
        blink:"\x1b[5m",
        cyan:"\x1b[46m",
        gray:"\x1b[2m",
        darkgray:"\x1b[90m",
        bgdarkgray:"\x1b[100m"
};

var format={
        info:colors.green+"Info: %s"+colors.default,
        debug:colors.blue+"%s"+colors.default,
        error:colors.red+"ERROR: %s"+colors.default,
        warn:colors.yellow+"Warn! %s"+colors.default,
        back:colors.magenta+"> %s"+colors.default,
        massback:colors.darkgray+"~ %s"+colors.default,
        mass:colors.gray+"%s"+colors.default,
        performance:colors.bgdarkgray+colors.lightyellow+"%s"+colors.default
};

console = new Proxy({
        time:timestart,
        timeEnd:timeend,
        format:format
},{
        get:function(target,key){
                if (key in target) return target[key]; else {
                        return function(){
                                if (key in format) arguments[0]=format[key].replace("%s",arguments[0]);
                                log.apply(console,arguments);
                        }
                }
        }
});

// Optional modules; you can remove these and still keep the functionality
const cmd=require("./console-cmd.js");
