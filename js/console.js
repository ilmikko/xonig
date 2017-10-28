// Trying to standardize (for us) how console works so that our code won't break if it suddenly does not exist

var log=function(){},timestart=function(){},timeend=function(){};
var times={};
timestart=function(id){times[id]=Date.now();}
timeend=function(id){
        let e=Date.now();
        if (id in times){
                console.performance(id+': '+(e-times[id])+'ms');
        }else return;
}
if (typeof console==="object"){
        if (typeof console.log==="function") log=console.log;
        /*if (typeof console.time==="function"&&typeof console.timeEnd==="function"){
                timestart=console.time;
                timeend=console.timeEnd;
        }*/
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
        underline:"\x1b[4m",
        bold:"\x1b[1m",
        italic:"\x1b[3m",
        cyan:"\x1b[46m",
        gray:"\x1b[2m",
        darkgray:"\x1b[90m",
        bgdarkgray:"\x1b[100m"
};

var format={
        info:           ' I '+colors.green+'%s'+colors.default,
        log:            ' . '+'%s',
        debug:          ' D '+colors.blue+'%s'+colors.default,
        error:          '!E '+colors.underline+colors.red+'%s'+colors.default,
        warn:           '!W '+colors.yellow+'%s'+colors.default,
        back:           ' > '+colors.magenta+'%s'+colors.default,
        massback:       ' ~ '+colors.darkgray+'%s'+colors.default,
        mass:           '   '+colors.gray+'%s'+colors.default,
        performance:    ' P '+colors.italic+colors.lightyellow+'%s'+colors.default
};

var levels={
        info:10,
        error:100,
        warn:50,
        back:1000,
        massback:1000,
        log:1,
        debug:-10,
        mass:-100
};

console = new Proxy({
        time:timestart,
        timeEnd:timeend,
        format:format,
        level:process.env.LOGLEVEL||0
},{
        get:function(target,key){
                if (key in target) return target[key]; else {
                        return function(){
                                if (key in levels) if (console.level>levels[key]) return;
                                if (key in format) arguments[0]=format[key].replace("%s",arguments[0]);
                                log.apply(console,arguments);
                        }
                }
        }
});

console.command = new Proxy({},{
        get:function(target,key){
                if (key in target) return target[key]; else {
                        return function(){};
                }
        }
});

// Optional modules; you can remove these and still keep the functionality
const cmd=require("./console-cmd.js");
