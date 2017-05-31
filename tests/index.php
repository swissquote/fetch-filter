<?php
function writeLog($log) {
    $out = fopen('php://stdout', 'w');
    fwrite($out, "[TEST] " . $log . "\n");
}

function getFiles() {
    $files = array_merge(
        glob( __DIR__ . "/test.*.html"),
        glob( __DIR__ . "/**/test.*.html")
    );

    $files = array_map(function($file) { 
        return str_replace(__DIR__ . '/', "", $file);
    }, $files);

    return $files;
}

$files = getFiles();

if (array_key_exists('action', $_GET)) {

    if ($_GET['action'] == 'result') {
        if ($_POST['result'] == 'OK') {
            writeLog("'" . $_POST['name'] . "' succeeded");
        } else {
            posix_kill($_GET['pid'], SIGUSR1);
            writeLog("'" . $_POST['name'] . "' failed with " . $_POST['result']);
        }
    }

    if ($_GET['action'] == 'done') {
        posix_kill($_GET['pid'], SIGUSR2);
    }


} else  {

writeLog("Starting tests, " . count($files) . " tests to run");

?>


<html>
<head>
<script src="tests.js"></script>
<script>

    var pid = "<?php echo $_GET['pid']; ?>";
    var tests = <?php echo json_encode($files) ?>;

    var testName;
    var currentTest = 0;
	var logDiv;
	var iframe;

	onload = function() {
		iframe = document.getElementById("iframe");
		logDiv = document.getElementById("log");
		runNextTest();
	}
</script>
<style>
body {
    color: #333;
    font-family: Arial, Helvetica, sans-serif;
}
#iframe {
    float:right;
    border: solid 1px #ddd;
}
#log {
    padding-left: 20px;
    font-size: .8em;
    height: 90%;
    overflow-y: auto;
}
.error {
    color: red;
    cursor: pointer;
}
pre {
    border-left: 2px solid red;
    padding-left: 5px;
}
</style>
</head>
<body>
    <iframe id="iframe" src="about:blank" width="600" height="400"></iframe>
    <div id="log"></div>
</body>
</html>

<?php
}
?>