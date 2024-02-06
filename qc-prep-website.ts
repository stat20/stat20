
// import qcw module
import {readYML, unIgnoreFiles, makeSchedule, makeListings } from "./qc-functions.ts"

// set parameters
const configPath = '_config.yml';
const tempFilesDir = '';
const renderType = Deno.env.get("QUARTO_PROFILE");

// load config
const config = await readYML(configPath);

// pre-render steps
const schedule = await makeSchedule(config, tempFilesDir, renderType);

if (renderType == "partial-site") {
  await unIgnoreFiles(schedule);
}

await makeListings(schedule, config, tempFilesDir);
