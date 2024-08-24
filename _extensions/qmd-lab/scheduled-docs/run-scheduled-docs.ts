
// Import external libraries
import { readConfig, readScheduledDocs, propagateKeys, setDraftStatuses, writeDraftList, writeSchedule, writeListingContents, writeAutonavContents } from "./scheduled-docs.ts";
console.log("=== Scheduled-docs ===");

// Get parameters
const configParams = await readConfig();
const ymlPath = configParams['path-to-yaml']
const scheduledDocsKey = configParams['scheduled-docs-key'];
const itemsKey = configParams['docs-key'];
const tempFilesDir = configParams['temp-files-dir'];

// Run functions
let scheduledDocs = await readScheduledDocs(ymlPath, scheduledDocsKey, configParams);
propagateKeys(scheduledDocs);
setDraftStatuses(scheduledDocs, itemsKey);
await writeDraftList(scheduledDocs, tempFilesDir);
await writeSchedule(scheduledDocs, tempFilesDir);
await writeListingContents(scheduledDocs, tempFilesDir);
await writeAutonavContents(scheduledDocs, tempFilesDir);
