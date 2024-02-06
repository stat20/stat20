
// import qcw module
import { readYML, removeTempFiles } from "./qc-functions.ts"

// set parameters
const configPath = '_config.yml';

// load config file
const config = await readYML(configPath);
const debugMode = config['options']?.debug || false;

// clean temp files if not in debug mode
if (debugMode) {
  console.log("> Rendering complete!");
  console.log("> Debug mode is on. Examine schedule.yml and associated nav yml files.");
} else {
  console.log("> Cleaning up temporary files ...");
  await removeTempFiles(config);
  console.log("> Rendering complete!");
}

