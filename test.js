
var child_process = require("child_process");
var glob = require("glob");
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser')

var app = express();

var failedTest = false;
var runningBrowser;

app.use(bodyParser.json());                         // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // to support URL-encoded bodies

app.use('/tests', express.static(__dirname + '/tests'));
app.use('/dist', express.static(__dirname + '/dist'));

app.get('/tests/runner', function (req, res) {
    glob("tests/**/test.*.html", function (er, files) {

        console.log("Starting tests on " + files.length + " files");

        files = files.map(file => file.replace(/tests\//, ''));
        fs.readFile('tests/runner.html', 'utf8', function (err, data) {
            if (err) {
                return console.log(err);
            }
            res.send(data.replace(/__TESTS__/, JSON.stringify(files)));
        });
    })
});


app.post('/tests/result', function (req, res) {
    if (req.body.result == 'OK') {
        console.log("[OK] " + req.body.name);
    } else {
        failedTest = true;
        console.log("[FAILED] " + req.body.name + ":" + req.body.result);
    }
    res.send('');
});

app.post('/tests/done', function (req, res) {
    res.send('All tests done');
    console.log("All tests done");

    if (failedTest) {
        console.log("At least one test failed, please check the logs");
    }

    if (runningBrowser) {
        runningBrowser.kill();
    }

    process.exit(failedTest ? 1 : 0);
});

app.listen(8098, function () {
    console.log('Running tests');

    runningBrowser = child_process.spawn("firefox", ['http://127.0.0.1:8098/tests/runner']);

    runningBrowser.stdout.on('data', (data) => {
        console.log(`[BROWSER]: ${data}`);
    });

    runningBrowser.stderr.on('data', (data) => {
        console.log(`[BROWSER]: ${data}`);
    });
});

