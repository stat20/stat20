// Import external libraries
import { parse, stringify } from "https://deno.land/std/yaml/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { existsSync } from "https://deno.land/std/fs/mod.ts";


// ---------------------- //
//   Read Scheduled Docs  //
// ---------------------- //

export async function readScheduledDocs(ymlPath: string, scheduledDocsKey: string, configParams: string): Promise<any> {
  const yamlContent = await Deno.readTextFile(ymlPath);
  const parsedYaml = parse(yamlContent);
  if (!parsedYaml.hasOwnProperty(configParams['scheduled-docs-key'])) {
    console.log(`> "${configParams['scheduled-docs-key']}" key not found in ${configParams['path-to-yaml']}. Extension is installed but not being used.`);
    Deno.exit(0); // Exits the script if the extension is added but not used
  }
  const scheduledDocs = parsedYaml[scheduledDocsKey];
  return scheduledDocs;
}


// --------------------- //
//     Propagate Keys    //
// --------------------- //
// Propagate the unignored keys into nested objects, being sure to not overwrite
// any keys of the same name. Also add a `projectProfile` key if one is active.

export function propagateKeys(obj: any, parentProps: Record<string, string> = {}, ignoreKeys = ['debug', 'draft-after', 'timezone', 'this-week', 'grouping-label']) {
    
    // if the object is an array, re-call this function on each item
    if (Array.isArray(obj)) {
        obj.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                propagateKeys(item, parentProps, ignoreKeys);
            }
        });
        
    // if it's not an array, then...
    } else if (typeof obj === 'object' && obj !== null) {
      
        // prepare new properties of the object that inherit parent properties and..
        const newProps = { ...parentProps };
        
        // for each key..
        Object.keys(obj).forEach(key => {
            if (!ignoreKeys.includes(key)) {
              
                // copy it into the new properties if its a simple key-value pair
                if (typeof obj[key] === 'string') {
                    newProps[key] = obj[key];
                    
                // but if it's has a nested object, re-call this function
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    propagateKeys(obj[key], newProps, ignoreKeys);
                }
            }
        });

        // add any project profile that is activated
        const projectProfile = Deno.env.get("QUARTO_PROFILE");
        if (projectProfile !== "") {
          newProps['projectProfile'] = projectProfile;
        }
        
        // then add each of the new properties to the current object
        Object.keys(newProps).forEach(key => {
            if (obj[key] === undefined) {
                obj[key] = newProps[key];
            }
        });
    }
}


// ------------------------ //
//     Set Draft Status     //
// ------------------------ //
// Set draft values for all items and collects them
// into a doclist key in the config file

export function setDraftStatuses(obj, itemsKey: string = "docs") {
  
  console.log("> Setting draft status of docs ...")
  const draftAfterStr = obj["draft-after"];
  const timezone = obj["timezone"];
  
  let thresholdDate = new Date(0);
  if (draftAfterStr === "system-time") {
      thresholdDate = new Date();
  } else {
      thresholdDate = new Date(convertDateToISOFormat(draftAfterStr, timezone));
  }
  
  let collectedItems = []
  let nDrafts = 0;
  let nNotDrafts = 0;
  
  // recursively process the config object and apply getDraftVal to all items
  function processItemsKeys(element: any) {
    if (typeof element === 'object' && element !== null) {
      if (Array.isArray(element[itemsKey])) {
        element[itemsKey].forEach((item, index) => {
          if (item && typeof item === 'object') {
            item.draft = getDraftVal(item, thresholdDate, timezone);
            collectedItems.push(item);
            if (item.draft) {
                nDrafts++;
            } else {
                nNotDrafts++;
            }
          }
        });
      }
      // recurse if it's an object
      Object.entries(element).forEach(([key, value]) => {
        if (typeof value === 'object') {
          processItemsKeys(value);
        }
      });
    }
  }
  
  // get draft values for each item
  function getDraftVal(item: any, thresholdDate: Date, timezone: string): boolean {
    // default to false
    let draftValue = false;
    const itemDate = new Date(convertDateToISOFormat(item.date, timezone));
      
    // override if using draft-after
    if (itemDate > thresholdDate) {
      draftValue = true;
    } 
    // override default and draft-after if draft value specified in _quarto.yml
    if (item.hasOwnProperty('draft')) {
      draftValue = item.draft;
    } 
    return draftValue;
  }
  
  // run recursive function
  processItemsKeys(obj);
  
  // append collected docs for easy downstream processing
  obj.doclist = collectedItems;
  
  console.log(`  - ${nDrafts} docs set to 'draft: true'.`);
  console.log(`  - ${nNotDrafts} docs set to 'draft: false'.`);

  //return config;
}


// ------------------------ //
//     Write Draft List     //
// ------------------------ //
// Write a draft list yaml file from doclist

export async function writeDraftList(obj: any, tempFilesDir: string) {
  console.log("> Making draft list ...")
  const draftHrefs: string[] = [];
  
  obj.doclist?.forEach((item: any) => {
        if (item.draft) {
         draftHrefs.push(item.href);
        }
      });
  
  const draftList = {
    website: {
      drafts: draftHrefs
    }
  };
  
  const outputPath = join(Deno.cwd(), tempFilesDir, "draft-list.yml");
  await Deno.mkdir(tempFilesDir, { recursive: true });
  await Deno.writeTextFile(outputPath, stringify(draftList));
  console.log(`  - Created file: ${outputPath}`);
}

// -------------------------------- //
//     Write schedule.yml     //
// -------------------------------- //
// Write the contents of schedule.yml to a file.

export async function writeSchedule(obj: any, tempFilesDir: string) {
  console.log("> Making schedule.yml ...")
  
  // make a deep copy without any anchors / aliases so that stringify will
  // create a yml version that can be parsed by ejs easily
  const objNoAA = deepCopy(obj);
  let scheduleArray;
    if ('docs' in objNoAA && 'schedule' in objNoAA) {
        throw new Error('The object can only have one of the keys "docs" or "schedule" at the top level.');
    } else if ('docs' in objNoAA) {
        scheduleArray = obj['docs'];
    } else if ('schedule' in objNoAA) {
        scheduleArray = obj['schedule'];
    } else {
        throw new Error('The "scheduled-docs" must contain either "docs" or "schedule" key at the top level.');
    }
  
  if (!Array.isArray(scheduleArray)) {
    throw new Error("If you use the `scheduled-docs: schedule` key, be sure it is an array, not an object with named keys.");
  }
  
  const outputPath = join(Deno.cwd(), tempFilesDir, "schedule.yml");
  await Deno.mkdir(tempFilesDir, { recursive: true });
  await Deno.writeTextFile(outputPath, stringify(scheduleArray));
  console.log(`  - Created file: ${outputPath}`);
}


// ------------------------------- //
//     Write listing contents      //
// ------------------------------- //
// Write the listing contents for all sets of docs with a defined group

export async function writeListingContents(obj: any, tempFilesDir: string ) {
  console.log("> Making listing contents files ...")
  const groupedDocs: Record<string, any[]> = {};
  
  // use a `grouping-label` if defined, otherwise use `type`
  const type = obj['grouping-label'] ? obj['grouping-label'] : 'type';

  // group documents by their type
  for (const doc of obj.doclist) {
    if (!doc[type] || !doc.href) {
      continue;
    }
    const typeKey = doc[type].replace(" ", "-").toLowerCase();
    if (!groupedDocs[typeKey]) {
      groupedDocs[typeKey] = [];
    }
    groupedDocs[typeKey].push({ path: `../${doc.href}` });
  }
  
  if (Object.keys(groupedDocs).length === 0) {
    console.log("  - No listing groups found");
  } else {
    for (const [typeKey, items] of Object.entries(groupedDocs)) {
      const outputPath = join(Deno.cwd(), tempFilesDir, `${typeKey}-listing.yml`);
      await Deno.mkdir(tempFilesDir, { recursive: true });
      await Deno.writeTextFile(outputPath, stringify(items));
      console.log(`  - Created file: ${outputPath}`);
    }
  }
}
  
  
// ------------------------------- //
//     Write autonav contents      //
// ------------------------------- //
// Write the sidebar contents (sidebar or hybrid nav) for all sets of docs with a defined group

export async function writeAutonavContents(obj: any, tempFilesDir: string) {
  
  // Exit if not using autonav
  if (obj.autonav === undefined ) {
    return;
  } else {
    console.log("> Processing autonav options ...");
  }
  
  if (obj.autonav.sidebar !== undefined && obj.autonav.hybrid !== undefined) {
    console.log("  - Can only use sidebar or hybrid navigation, not both.");
    return;
  }
  
  if (obj.autonav.sidebar !== undefined) {
    await writeSidebarContents(obj, tempFilesDir);
  } else if (obj.autonav.hybrid !== undefined) {
    await writeHybridContents(obj, tempFilesDir);
  } else {
    console.log("  - Neither hybrid or sidebar options found.");
    return;
  }
}

async function writeSidebarContents(obj: any, tempFilesDir: string) {
  console.log("  > Making sidebar contents files ...");
  
  // use a `grouping-label` if defined, otherwise use `type`
  const type = obj['grouping-label'] ? obj['grouping-label'] : 'type';

  // get the sidebar type and subsection label
  const sidebarType = obj.autonav.sidebar.type;
  const sectionLabel = obj.autonav.sidebar['section-label'] || 'subtype';

  // group documents by their type and section
  const groupedDocs: Record<string, Record<string, any[]>> = {};

  for (const doc of obj.doclist) {
    if (!doc[type] || !doc.href) {
      continue;
    }
    const originalType = doc[type];
    const originalSection = doc[sectionLabel] || "No Section";
    
    const typeKey = originalType.replace(" ", "-").toLowerCase();
    const sectionKey = originalSection.replace(" ", "-").toLowerCase();

    if (!groupedDocs[typeKey]) {
      groupedDocs[typeKey] = {};
    }
    if (!groupedDocs[typeKey][sectionKey]) {
      groupedDocs[typeKey][sectionKey] = [];
    }
    groupedDocs[typeKey][sectionKey].push({ href: `${doc.href}`, originalSection });
  }

  // process only the group that matches the sidebar type
  const items = groupedDocs[sidebarType.toLowerCase().replace(" ", "-")];

  if (!items) {
    console.log("    - No matching group of docs found for ", sidebarType);
    return;
  }

  // build the contents structure
  const sidebarContents: any[] = [];

  if (items["no-section"]) {
    // add items without a section first
    sidebarContents.push(...items["no-section"]);
    delete items["no-section"];
  }

  for (const [sectionKey, docs] of Object.entries(items)) {
    const originalSectionName = docs[0].originalSection;
    sidebarContents.push({
      section: originalSectionName,
      contents: docs.map(doc => ({ href: doc.href }))
    });
  }

  const yamlContent = {
    website: {
      sidebar: {
        contents: [
          {
            section: sidebarType,
            href: `${sidebarType}.qmd`,
            contents: sidebarContents
          }
        ]
      }
    }
  };

  const outputPath = join(Deno.cwd(), tempFilesDir, `sidebar-contents.yml`);
  await Deno.mkdir(tempFilesDir, { recursive: true });
  await Deno.writeTextFile(outputPath, stringify(yamlContent));
  console.log(`    - Created file: ${outputPath}`);
}


async function writeHybridContents(obj: any, tempFilesDir: string) {
  console.log("  > Making hybrid contents files ...");

  // initialize sidebar contents
  const sidebarContents: any[] = [];

  // iterate over each hybrid config entry
  for (const hybridConfig of obj.autonav.hybrid) {
    // use a `grouping-label` if defined, otherwise use `type`
    const typeLabel = obj['grouping-label'] ? obj['grouping-label'] : 'type';
    
    const type = hybridConfig[typeLabel];
    const landingPage = hybridConfig['landing-page'];
    const sectionLabel = hybridConfig['section-label'] || null;

    // create a new sidebar item, copying all keys from hybridConfig
    const sidebarItem: any = { ...hybridConfig };
    delete sidebarItem.type;
    delete sidebarItem['landing-page'];
    delete sidebarItem['section-label'];

    // group documents by their type and section (if sectionLabel is defined)
    const groupedDocs: Record<string, any[]> = {};

    for (const doc of obj.doclist) {
      if (doc.type !== type || !doc.href) {
        continue;
      }

      if (sectionLabel && doc[sectionLabel]) {
        const originalSection = doc[sectionLabel];
        if (!groupedDocs[originalSection]) {
          groupedDocs[originalSection] = [];
        }
        groupedDocs[originalSection].push({ href: `${doc.href}` });
      } else {
        // if no sectionLabel, group all under a generic "default" key
        if (!groupedDocs['default']) {
          groupedDocs['default'] = [];
        }
        groupedDocs['default'].push({ href: `${doc.href}` });
      }
    }

    // build the contents structure for the current hybrid config
    const sectionContents: any[] = [
      { href: landingPage }
    ];

    if (sectionLabel) {
      for (const [section, docs] of Object.entries(groupedDocs)) {
        sectionContents.push({
          section: section,
          contents: docs
        });
      }
    } else {
      sectionContents.push(...groupedDocs['default']);
    }

    // add the contents array to the sidebar item
    sidebarItem.contents = sectionContents;

    // add this sidebar item to the final sidebar contents
    sidebarContents.push(sidebarItem);
  }

  const yamlContent = {
    website: {
      sidebar: sidebarContents
    }
  };

  const outputPath = join(Deno.cwd(), tempFilesDir, `sidebar-contents.yml`);
  await Deno.mkdir(tempFilesDir, { recursive: true });
  await Deno.writeTextFile(outputPath, stringify(yamlContent));
  console.log(`    - Created file: ${outputPath}`);
}


  
// --------------------------------- //
//    Remove Temporary Directory     //
// --------------------------------- //
// Remove temp files generated during render
// Turned off if debug: true exists in config file.

export async function removeTempDir(obj: any, tempFilesDir: string) {
  
  if (!obj.debug) {
    try {
      await Deno.remove(tempFilesDir, { recursive: true });
      console.log(`> Temporary directory '${tempFilesDir}' has been removed.`);
    } catch (error) {
      console.error(`> Error removing temporary directory '${tempFilesDir}': ${error}`);
    }
  } else {
    console.log(`> Debug mode is on. Temporary files can be viewed in '${tempFilesDir}'.`)
  }
}


// ----------------- //
//     Utilities     //
// ----------------- //
export async function readConfig(): Promise<any> {
  // the extension can be installed in two places, so check both
  const path1 = './_extensions/scheduled-docs/config.yml';
  const path2 = './_extensions/qmd-lab/scheduled-docs/config.yml';
  let yamlContent: string;

  if (existsSync(path1)) {
    yamlContent = await Deno.readTextFile(path1);
  } else if (existsSync(path2)) {
      yamlContent = await Deno.readTextFile(path2);
  } else {
      throw new Error('Scheduled-docs config.yml file not found.');
  }

  const parsedYaml = parse(yamlContent);
  return parsedYaml
}

function convertDateToISOFormat(dateStr: string, timezone: string): string {
    const [month, day, year] = dateStr.split('/').map(num => num.padStart(2, '0'));
    return `20${year}-${month}-${day}T00:00:00${timezone}`;
}

function deepCopy(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    let temp = obj.constructor();
    for (let key in obj) {
        temp[key] = deepCopy(obj[key]);
    }
    return temp;
}
