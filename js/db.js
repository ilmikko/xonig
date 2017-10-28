console.info("Database initializing...");
let mongo = require('mongodb').MongoClient;
let port=27017,host='localhost';
let url = 'mongodb://'+host+':'+port+'/';

module.exports={
        db:{},
        use:function(dbpath,callback){
                console.log('Mongo connecting...');
                var self=this;
                mongo.connect(url+dbpath,function(err,db){
                        if (err) throw err;
                        console.log("Use DB: '%s'",dbpath);
                        callback(self.db[dbpath]=db);
                });
        },
        get:function(db,col){
                if (!(db in this.db)) throw new Error("DB '"+db+"' not defined."); else db=this.db[db];
                if (col) return db.collection(col); else return db;
        }
};

// XXX DEBUG: Remove this afterwards
/*module.exports.use('debug',function(db){
        db.collection('names').insertOne({name:"Henry Johnson",firstName:"Henry",lastName:"Johnson"}).catch(function(err){
                console.error(err);
        }).then(function(res){
                console.info(res);
        });
});*/
