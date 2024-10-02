<?php

date_default_timezone_set("America/New_York");

function log_info($label, $message = "")
{
  if ($message) {
    echo "$label: $message" . PHP_EOL;
  } else {
    echo $label . PHP_EOL;
  }
}

function askYesOrNo($prompt)
{
  while (true) {
    echo $prompt . " (yes/no): ";
    $input = strtolower(trim(fgets(STDIN))); // Get input and convert it to lowercase

    if (in_array($input, ["yes", "y"])) {
      return true; // Return true for "yes"
    } elseif (in_array($input, ["no", "n"])) {
      return false; // Return false for "no"
    } else {
      echo "Please type 'yes' or 'no'.\n"; // Prompt again for valid input
    }
  }
}

$targetFile = __DIR__ . "/../../script.user.js";
$fileContents = file_get_contents($targetFile);

$now = new DateTime();

$versionNumber = $now->format("ymd_His");
$versionRegex = "/(?<=\/\/\s@version\s).*/";

log_info("File", $targetFile);
log_info("isFile", is_file($targetFile));
log_info("Now", $now->format("Y-m-d H:i:s"));
log_info("Version string", $versionNumber);

preg_match($versionRegex, $fileContents, $matches);

if (!empty($matches)) {
  $firstMatch = $matches[0];
  log_info("First match", $firstMatch);
  if (askYesOrNo("Update version number?")) {
    $spacesCounter = 0;
    for (; $spacesCounter < strlen($firstMatch); ++$spacesCounter) {
      if ($firstMatch[$spacesCounter] !== " ") {
        break;
      }
    }

    $fileContents = preg_replace($versionRegex, str_repeat(" ", $spacesCounter) . $versionNumber, $fileContents);
    file_put_contents($targetFile, $fileContents);

    log_info("Done");
  }
} else {
  log_info("No version string was found");
}
