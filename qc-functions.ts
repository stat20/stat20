
// Import external libraries
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { parse, stringify } from "https://deno.land/std/yaml/mod.ts";
import { join, dirname, basename } from "https://deno.land/std/path/mod.ts";

// -------------------------------- //
//     Prepare partial schedule     //
// -------------------------------- //
// Make schedule.yml where each item defaults to render: true
// This is overridden and set to false for items where date > live-as-of date
// That is overridden by a pre-existing render value that exists in _config.yml

export async function makeSchedule(config: any, tempFilesDir: string, renderType: string) {
    console.log("> Making ", renderType, " schedule...")
    
    const renderAsOfStr = config["partial-render"]["render-as-of"];
    const timezone = config["partial-render"]["timezone"];
    const thresholdDate = new Date(convertDateToISOFormat(renderAsOfStr, timezone));

    // propagate dates from day to items
    config.schedule.forEach((week: any) => {
        week.days.forEach((day: any) => {
            if (day.items && Array.isArray(day.items)) {
                day.items.forEach((item: any) => {
                    // If the item does not have a date, use the day's date
                    if (!item.hasOwnProperty('date')) {
                        item.date = day.date;
                    }
                });
            }
        });
    });

    // set render values for every item
    const schedule = config.schedule.map(week => ({
        ...week,
        days: week.days.map(day => ({
            ...day,
            items: day.items ? day.items.map(item => ({
                ...item,
                render: getRenderVal(item, renderType, thresholdDate, timezone)
            })) : []
        }))
    }));

    const scheduleFilePath = join(Deno.cwd(), tempFilesDir, "schedule.yml");
    await Deno.mkdir(tempFilesDir, { recursive: true });
    await Deno.writeTextFile(scheduleFilePath, stringify(schedule));
    
    return schedule;
}

// Utilities
export async function readYML(path: string): Promise<any> {
    const yamlContent = await Deno.readTextFile(path);
    return parse(yamlContent);
}

function convertDateToISOFormat(dateStr: string, timezone: string): string {
    const [month, day, year] = dateStr.split('/').map(num => num.padStart(2, '0'));
    return `20${year}-${month}-${day}T00:00:00${timezone}`;
}

function getRenderVal(item: any, renderType: string, thresholdDate: Date, timezone: string): boolean {
    // default to true
    let renderValue = true;

    if (renderType === "partial-site") {
      
        const itemDate = new Date(convertDateToISOFormat(item.date, timezone));
        
        // override if using render-as-of
        if (itemDate > thresholdDate) {
            renderValue = false;
        }

        // override default and render-as-of if render value specified in config.yml
        if (item.hasOwnProperty('render')) {
            renderValue = item.render;
        }
    }

    return renderValue;
}


// ---------------------------------------- //
//   Make this-week.yml from schedule.yml   //
// ---------------------------------------- //




// ---------------------------------------- //
//  Make adaptive-nav.yml from schedule.yml  //
// ---------------------------------------- //

export async function makeAdaptiveNav(config: any, tempFilesDir: string, schedule: any) {
    
    if (!config.hasOwnProperty('adaptive-nav')) {
        return; 
    }
    
    if (config['adaptive-nav'].hasOwnProperty('sidebar') && 
        config['adaptive-nav'].hasOwnProperty('hybrid-sidebar')) {
      console.error("'adaptive-nav' can have either 'sidebar' or 'hybrid-sidebar', not both.")
      return;
    }
    
    console.log("> Making adaptive nav...")
    let adaptiveNav = { website: {} };
    
    // to do - add navbar and hybrid-navbar
    
    // sidebar nav
    if (config['adaptive-nav'].hasOwnProperty('sidebar')) {
        let sidebarContents = [];
        const sidebarTypes = config['adaptive-nav']['sidebar'];
        
        sidebarTypes.forEach(sidebarType => {
            const type = sidebarType.type;
            let typeHrefs: string[] = [];

            schedule.forEach(week => {
               week.days.forEach(day => {
                    day.items.forEach(item => {
                        if (item.type === type && item.render) {
                            typeHrefs.push(item.href);
                        }
                    });
                });
            });
            
            sidebarContents.push({ section: type, contents: typeHrefs });
        });
    
        adaptiveNav.website.sidebar = { contents: sidebarContents };
    }
    
    // hybrid-sidebar nav
    if (config['adaptive-nav'].hasOwnProperty('hybrid-sidebar')) {
        let sidebarContents = [];
        const sidebarTypes = config['adaptive-nav']['hybrid-sidebar'];
        
        sidebarTypes.forEach(sidebarType => {
            const type = sidebarType.type;
            let typeHrefs: string[] = [];

            schedule.forEach(week => {
               week.days.forEach(day => {
                    day.items.forEach(item => {
                        if (item.type === type && item.render) {
                            typeHrefs.push(item.href);
                        }
                    });
                });
            });
            
            sidebarContents.push({ title: type, contents: typeHrefs });
        });
    
        adaptiveNav.website.sidebar = sidebarContents;
    }
    
    const adaptiveNavPath = join(Deno.cwd(), tempFilesDir, "adaptive-nav.yml");
    await Deno.writeTextFile(adaptiveNavPath, stringify(adaptiveNav));
}


// -------------------------------- //
//  Ignore files based on schedule  //
// -------------------------------- //

export async function ignoreFiles(schedule: any) {
    console.log("> Ignoring Files")
    
    for (const week of schedule) {
        for (const day of week.days) {
            if (day.items) {
                for (const item of day.items) {
                    if (item.render === false) {
                        const oldPath = item.href;
                        const dir = dirname(oldPath);
                        const filename = basename(oldPath);
                        const newPath = join(dir, `_${filename}`);

                        try {
                            await Deno.rename(oldPath, newPath);
                            console.log(`  - Renamed: ${oldPath} to ${newPath}`);
                        } catch (error) {
                            console.error(`  - Error renaming ${oldPath} to ${newPath}:`, error.message);
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------- //
//       Clean up file names        //
// -------------------------------- //
// If this the script is during a partial-render, remove _ from filenames

export async function unIgnoreFiles(schedule: any) {
    console.log("> Unignoring Files ...");

    for (const week of schedule) {
        for (const day of week.days) {
            if (day.items) {
                for (const item of day.items) {
                    if (item.render === false) {
                        const oldPath = item.href;
                        const dir = dirname(oldPath);
                        const filename = basename(oldPath);
                        const newPath = join(dir, `_${filename}`);

                        try {
                            await Deno.rename(newPath, oldPath);
                            console.log(`  - Renamed: ${newPath} to ${oldPath}`);
                        } catch (error) {
                            console.error(` - Error renaming ${newPath} to ${oldPath}:`, error.message);
                        }
                    }
                }
            }
        }
    }
}


// -------------------------------- //
//         Render site profile         //
// -------------------------------- //

export async function runQuartoRender(renderType) {
    console.log("> Running quarto render ...")    
    
    const process = Deno.run({
        cmd: ["quarto", "render", "--profile", renderType],
        stdout: "inherit",
        stderr: "inherit",
    });

    const { code } = await process.status();

    if (code !== 0) {
        console.error('Error: Quarto render process exited with code', code);
    }

    process.close();
}


// -------------------------------- //
//           Make Listings          //
// -------------------------------- //

export async function makeListings(schedule: any, config: any, tempFilesDir: string) {
    if (!config['adaptive-nav'].hasOwnProperty('listings')) {
        return; 
    }
    
    console.log("> Making contents files for listings...")
    
    const listingTypes = config['adaptive-nav']['listings'].map((listing: any) => listing.type);
    // Initialize typeLists with an entry for each listing type
    const typeLists: Record<string, Array<{ path: string }>> = listingTypes.reduce((acc, type) => {
        acc[type] = [];
        return acc;
    }, {});

    for (const week of schedule) {
        for (const day of week.days) {
            if (day.items && Array.isArray(day.items)) {
                for (const item of day.items) {
                    if (listingTypes.includes(item.type) && item.render) {
                        typeLists[item.type].push({ path: item.href });
                    }
                }
            }
        }
    }

    for (const [type, items] of Object.entries(typeLists)) {
        const outputPath = join(tempFilesDir, `${type}-contents.yml`);
        await Deno.writeTextFile(outputPath, stringify(items));
        console.log(` - Created file: ${outputPath}`); 
    }
}


// ------------------------------------------- //
//  Remove temp files generated during render  //
// ------------------------------------------- //
// This remove all -contents.yml files, schedule.yml, and adaptive-nav.yml
// Is turned off if options: debug: true

export async function removeTempFiles(config: any) {
    const listingTypes = config['adaptive-nav']['listings'];
    const filesToRemove: string[] = listingTypes.map((listing: any) => `${listing.type}-contents.yml`);
    filesToRemove.push('adaptive-nav.yml', 'schedule.yml'); 

    const scriptDir = dirname(new URL(import.meta.url).pathname);

    for (const file of filesToRemove) {
        const filePath = join(scriptDir, file);
        try {
            await Deno.remove(filePath);
            console.log(`  - Removed file: ${filePath}`);
        } catch (error) {
            console.error(`  - Error removing file ${filePath}:`, error.message);
        }
    }
}