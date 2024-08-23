
// Import external libraries
import { readConfig, readScheduledDocs, removeTempDir } from "./scheduled-docs.ts";

// Get parameters
const configParams = await readConfig();
const ymlPath = configParams['path-to-yaml']
const scheduledDocsKey = configParams['scheduled-docs-key'];
const tempFilesDir = configParams['temp-files-dir'];

// Run functions
const scheduledDocs = await readScheduledDocs(ymlPath, scheduledDocsKey, configParams);
await removeTempDir(scheduledDocs, tempFilesDir);
