const expect = require('chai').expect;
const request = require('request');

const config = require('../conf.json');

process.env.LOGLEVEL=1000; // only show console.log

var xonig=null;

describe("Xonig",()=>{
	var baseURL="http://localhost:"+config.port;

	describe("Server functionality",()=>{
		xonig=require('../xonig.js');
		it("starts up without errors",(done)=>{
			xonig.start()
			.then(()=>{
				done();
			})
			.catch((err)=>{
				throw err;
			});
		});
		it("can be opened in debug mode",(done)=>{
			xonig.start({debug:true,production:false})
			.then(()=>{
				xonig.close()
				.catch((err)=>{
					throw err;
				})
				.then(()=>{
					done();
				});
			})
			.catch((err)=>{
				throw err;
			});
		})
		it("cannot be opened in debug mode when production variable is set",(done)=>{
			xonig.start({debug:true,production:true})
			.catch((err)=>{
				xonig.close()
				.catch((err)=>{
					throw err;
				})
				.then(()=>{
					done();
				});
			})
			// will time out if error wasn't thrown
		});
		it("throws an error when proxy is configured improperly",(done)=>{
			xonig.start({proxy:{enabled:true,header:"some-custom-header"}})
			.then(()=>{
				request(baseURL+"/some-path",(err,res,body)=>{
					expect(err).to.be.a('null');
					// TODO: expect headers?
					expect(res.statusCode).to.equal(500);

					xonig.close()
					.catch((err)=>{
						throw err;
					})
					.then(()=>{
						done();
					});
				});
			})
			.catch((err)=>{
				throw err;
			});
		})
		it("closes gracefully without errors",(done)=>{
			xonig.close()
			.then(()=>{
				done();
			})
			.catch((err)=>{
				throw err;
			});
		});
	});
	describe("HTTP serving",()=>{
		it("starts up again for serving",(done)=>{
			xonig.start()
			.then(()=>{
				done();
			});
		});
		it("returns 404 for files that don't exist",(done)=>{
			request(baseURL+"/nonexistent/nonexistent/nonexistent.nonexistent",(err,res,body)=>{
				expect(err).to.be.a('null');
				// TODO: expect headers?
				expect(res.statusCode).to.equal(404);
				done();
			});
		});

		it("retrieves a text file from the server",(done)=>{
			request(baseURL+"/test.txt",(err,res,body)=>{
				expect(err).to.be.a('null');
				// TODO: expect headers?
				expect(res.statusCode).to.equal(200);
				expect(body).to.equal('This is a test text file.\n');
				done();
			});
		});

		it("retrieves a html file from the server",(done)=>{
			request(baseURL+"/test.html",(err,res,body)=>{
				expect(err).to.be.a('null');
				expect(res.headers['content-type']).to.equal('text/html');
				expect(res.statusCode).to.equal(200);
				expect(body).to.equal('<html></html>\n');
				done();
			});
		});

		it("retrieves an image file from the server",(done)=>{
			request(baseURL+"/test.png",(err,res,body)=>{
				expect(err).to.be.a('null');
				expect(res.statusCode).to.equal(200);
				expect(res.headers['content-type']).to.equal('image/png');
				// Can't really check for binary can we?
				done();
			});
		});

		it("shouldn't matter what case the request headers are in",(done)=>{
			function test_with(header,callback){
				var headers={};

				var pt=Math.random().toString();
				headers[header]=pt;

				request({
					url:baseURL+"/test.txt",
					headers:headers
				},(err,res,body)=>{
					expect(err).to.be.a('null');
					expect(res.headers['debug-pass-through']).to.equal(pt);

					callback();
				});
			}

			test_with('debug-pass-through',()=>{
				test_with('Debug-Pass-Through',()=>{
					test_with('DEBUG-pass-THROUGh',()=>{
						test_with('DeBug-PAsS-ThRoUgH',()=>{
							done();
						});
					});
				});
			});
		});

		it("checks whether etag works and is respected",(done)=>{
			request(baseURL+"/test.png",(err,res,body)=>{
				expect(err).to.be.a('null');
				expect(res.statusCode).to.equal(200);
				let etag=res.headers['etag'];
				expect(etag).to.not.be.a('null');
				request({
					url:baseURL+"/test.png",
					headers:{
						'if-none-match':etag
					}
				},(err,res,body)=>{
					expect(err).to.be.a('null');
					expect(res.statusCode).to.equal(304);
					let etag=res.headers['etag'];
					expect(etag).to.not.be.a('null');

					done();
				});
			});
		});
	});
	xdescribe("Dynamic serving",()=>{
		it("returns an error for erroneous scripts",()=>{

		});
		it("listens to GET variables in queries",()=>{

		});
		it("listens to POST variables in the body",()=>{

		});
		it("has a precedence on body variables over query variables",()=>{

		});
		it("sets cookies properly",()=>{

		});
		it("reads cookies properly",()=>{

		});
		it("updates the database on demand",()=>{

		});
	});
	xdescribe("Edge cases",()=>{
		it("serves multiple scripts that hang, not affecting the performance of the main server",()=>{

		});
		it("destroys connections that end too soon properly",()=>{

		});
		it("can handle malformed queries",()=>{

		})
	});
});
