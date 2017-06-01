function log(s) {
  logDiv.innerHTML += s;
}

function logError(s, stacktrace) {
  log("<span class='error'>" + s + "</span>");
  log("<pre>" + renderStack(stacktrace) + "</pre>");
}

function renderStack(stack) {
  if (stack.stack) {
    return stack.stack;
  }

  if (typeof stack.toString == "function") {
    return stack.toString();
  }

  return "Could not render error, rendered to console";
}

function reportResultAndRunNextTest(result, location) {
  if (result == "OK") {
    log(result + "<br>");
    console.log("Test succeeded");
  } else {
    console.log("Test failed");
    console.error(result);
    logError(result + "<br>", result);
  }

  var request = new XMLHttpRequest();
  request.open("POST", "/tests/result", true);
  request.setRequestHeader(
    "Content-Type",
    "application/x-www-form-urlencoded; charset=UTF-8"
  );
  request.send(
    "name=" +
      encodeURIComponent(testName) +
      "&result=" +
      encodeURIComponent(result)
  );

  // Run next test once we're done reporting
  request.onload = runNextTest
}

function runNextTest(name, result) {
  if (tests[currentTest]) {
    iframe.src = tests[currentTest];
    currentTest++;
  } else {
    var request = new XMLHttpRequest();
    request.open("POST", "/tests/done", true);
    request.send();
  }
}

function run(name, toExecute, expectedException) {
  // Reset assertion counts
  window.expectedAssertCount = null;
  window.assertCount = 0;

  var isAsync = !!toExecute.length;
  var stjsResult = "OK";
  var registeredTimeout;

  function handleException(ex) {
    if (!expectedException) {
      stjsResult = ex;
    } else if (!(ex.constructor instanceof expectedException)) {
      stjsResult = ex;
    }
  }

  function done() {
    if (registeredTimeout) {
      clearTimeout(registeredTimeout);
    }

    if (expectedAssertCount !== null && expectedAssertCount != assertCount) {
      stjsResult =
        "Expected " +
        expectedAssertCount +
        " assertions but got " +
        assertCount +
        " assertions";
    }

    reportResultAndRunNextTest(stjsResult, stjsResult.location);
  }

  testName = name;
  console.log("Testing: " + name);
  log("<b>" + name + "</b>: ");

  try {
    returned = toExecute(done);

    // We received a promise, so we're async
    if (returned && returned.then) {
      isAsync = true;

      returned.then(function(result) {
        if (expectedException) {
          stjsResult = "Expected an exception, but none was thrown";
        }
        done();
      });

      returned.catch(function(ex) {
        handleException(ex);
        done();
      });
    }

    // If the test is asyncrhonous, fail after 5 seconds
    if (isAsync) {
      registeredTimeout = setTimeout(function() {
        stjsResult = "Timeout after 5 seconds";
        done();
      }, 5000);
    }

    // If we got here in synchronous mode, it means no exception was thrown
    if (!isAsync && expectedException) {
      stjsResult = "Expected an exception, but none was thrown";
    }
  } catch (ex) {
    handleException(ex);
  } finally {
    if (!isAsync) {
      done();
    }
  }
}
