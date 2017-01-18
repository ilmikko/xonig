var consol = new Proxy({},{get:function(){return 5;}});

console.log(consol.e);
