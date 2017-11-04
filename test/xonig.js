const expect = require('chai').expect;
const request = require('request');

const config = require('../conf.json');
var xonig=null;

describe("Xonig",()=>{
	describe("Server functionality",()=>{
		it("starts up without errors",()=>{
			xonig=require('../index.js');
			xonig.init();
		});
		it("closes gracefully without errors",()=>{
			xonig.close();
		});
		it("can be opened in debug mode, and it warns about that",()=>{
			xonig=require('../index.js');
			xonig.config.debug = true;
			xonig.init();
			// TODO: expect warning
		})
	});
	describe("HTTP serving",()=>{
		var baseURL="http://localhost:"+config.port;
		describe("Getting a text file",()=>{
			it("retrieves a text file from the server",(done)=>{
				request(baseURL+"/test/text.txt",(err,res,body)=>{
					expect(err).to.be.a('null');
					// TODO: expect headers?
					expect(res.statusCode).to.equal(200);
					expect(body).to.equal('This is a test text file.');
					done();
				});
			});
			it("retrieves an image file from the server",(done)=>{
				request(baseURL+"/test/image.png",(err,res,body)=>{
					expect(err).to.be.a('null');
					expect(res.statusCode).to.equal(200);
					expect(res.headers['content-type']).to.equal('image/png');
					// Can't really check for binary can we?
					done();
				});
			});

			it("shouldn't matter what case the request headers are in",(done)=>{
				var pt=Math.random().toString();

				xonig.config.debug = true;

				request({
					url:baseURL+"/test/text.txt",
					headers:{
						'debug-pass-through':pt
					}
				},(err,res,body)=>{
					expect(err).to.be.a('null');
					expect(res.headers['debug-pass-through']).to.equal(pt);
				});
			});

			it("checks whether etag works and is respected",(done)=>{
				request(baseURL+"/test/image.jpg",(err,res,body)=>{
					expect(err).to.be.a('null');
					expect(res.statusCode).to.equal(200);
					var eTag=res.headers['etag'];
					expect(eTag).to.not.be.a('null');
					request({
						url:baseURL+"/test/image.jpg",
						headers:{
							'etag':eTag
						}
					},(err,res,body)=>{
						expect(err).to.be.a('null');
						expect(res.statusCode).to.equal(304);
						var eTag=res.headers['etag'];
						expect(eTag).to.not.be.a('null');
					});
				});
			});
		});
	});
});
