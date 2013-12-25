#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertURLIsValid = function(url) {
    if (url.length === 0) {
	console.log("URL is empty, Exiting.", url);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return url;
};

var cheerioHtmlFile = function(htmlfile) {
    var file = fs.readFileSync(htmlfile);
    return cheerio.load(file);
};

var cheerioHtml = function(html) {
    return cheerio.load(html.toString());
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var checkHtml = function(html, checksfile) {
    $ = cheerioHtml(html);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var outputResult = function(json) {
    var outJson = JSON.stringify(json, null, 4);
    console.log("RESULT:\n" + outJson);
};

if(require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
	.option('-u, --url <url>', 'URL address', clone(assertURLIsValid), URL_DEFAULT)
	.parse(process.argv);
    var checkJson;
    console.log("checks = " + program.checks);
    console.log("file = " + program.file);
    console.log("url = " + program.url);

    if (program.url) {
	rest.get(program.url).on('complete', function(result) {
	    if(result instanceof Error) {
		console.log("Cannot open '%s' with error: '%s'. Exiting.", program.url, result.message);
		process.exit(1);
	    } else {
		checkJson = checkHtml(result, program.checks);
		outputResult(checkJson);
	    }
	});
    } else {
	checkJson = checkHtmlFile(program.file, program.checks);
	outputResult(checkJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
