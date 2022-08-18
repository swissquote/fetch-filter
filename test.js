const child_process = require("child_process");
const glob = require("glob");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const tmp = require("tmp");

const app = express();

let failedTest = false;
let runningInstance;

const stayinAlive = (process.argv.indexOf("--stayinAlive") > -1)

// to support JSON and URL-encoded bodies
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

// Automatically serve static assets
app.use("/tests", express.static(__dirname + "/tests"));
app.use("/dist", express.static(__dirname + "/dist"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));

// Register test-specific routes
require("./tests/routes")(app);

// The main test runner; homepage with add the frameworks and lists the tests to run.
app.get("/tests/runner", function(req, res) {
  failedTest = false;
  glob("tests/**/test.*.html", function(er, files) {
    console.log("Starting tests on " + files.length + " files");

    files = files.map(file => file.replace(/tests\//, ""));
    fs.readFile("tests/runner.html", "utf8", function(err, data) {
      if (err) {
        return console.log(err);
      }
      res.send(data.replace(/__TESTS__/, JSON.stringify(files)));
    });
  });
});

// This endpoint receives test results and logs them,
// If a test failed we add this in a flag
app.post("/tests/result", function(req, res) {
  if (req.body.result == "OK") {
    console.log("[OK] " + req.body.name);
  } else {
    failedTest = true;
    console.log("[FAILED] " + req.body.name + ": " + req.body.result);
  }
  res.send("");
});

// When tests are done, this endpoint is called and 
// will close the test runner with a status of 0 or 1
// depending if any test failed or not
app.post("/tests/done", function(req, res) {
  res.send("All tests done");
  console.log("All tests done");

  if (failedTest) {
    console.log("At least one test failed, please check the logs");
  }

  if (runningInstance) {
    runningInstance.kill();
  }

  if (!stayinAlive) {
    process.exit(failedTest ? 1 : 0);
  }
});

function prefixBrowserOutput(data) {
  var lines = data
    .toString()
    .split(/\r?\n/)
    .filter(line => line != "")
    .map(line => `[BROWSER] ${line}`)
    .join("\n");
  console.log(lines);
}

app.listen(8098, function() {
  var browser = process.argv[2] ? process.argv[2] : "chrome";

  console.log(`Using ${browser} to run tests`);
  runningBrowser = browsers[browser]("http://127.0.0.1:8098/tests/runner");

  runningBrowser.run();
});

// Instructions on how to start the different 
// browsers and have them run the tests
var browsers = {
  firefox: function(path) {
    let runningBrowser = null;

    return {
      run() {
        runningBrowser = child_process.spawn("firefox", [path])

        runningBrowser.stdout.on("data", prefixBrowserOutput);
        runningBrowser.stderr.on("data", prefixBrowserOutput);
      },
      kill() {
        if (runningBrowser) {
          runningBrowser.kill();
        }
      }
    };
  },
  chrome: function(path) {
    return {
      run() {
        runningBrowser = child_process.spawn("google-chrome", [path])

        runningBrowser.stdout.on("data", prefixBrowserOutput);
        runningBrowser.stderr.on("data", prefixBrowserOutput);
      },
      kill() {
        if (runningBrowser) {
          runningBrowser.kill();
        }
      }
    };
  },
  puppeteer: function(path) {
    const puppeteer = require('puppeteer');

    let browser;

    return {
      async run() {
        browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(path);
      },
      async kill() {
        if (browser) {
          await browser.close();
        }
      }
    };
  }
};
