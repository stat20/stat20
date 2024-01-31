
import { parse, stringify } from "https://deno.land/std/yaml/mod.ts";
import { join, dirname, basename } from "https://deno.land/std/path/mod.ts";

const configPath = '_config.yml';
const schedulePath = 'schedule.yml';
const quartoProfile = Deno.env.get("QUARTO_PROFILE");


// -------------------------------- //
//       Clean up file names        //
// -------------------------------- //
// If this the script is during a partial-render, remove _ from filenames

async function unIgnoreFiles(schedulePath: string) {
    const yamlContent = await Deno.readTextFile(schedulePath);
    const schedule = parse(yamlContent) as any;

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
                            console.log(`Renamed: ${newPath} to ${oldPath}`);
                        } catch (error) {
                            console.error(`Error renaming ${newPath} to ${oldPath}:`, error.message);
                        }
                    }
                }
            }
        }
    }
}

// If this the script is during a partial-render, remove _ from filenames
if (quartoProfile == "partial-site") {
  console.log("> Unignoring Files ...");
  await unIgnoreFiles(schedulePath);
}


// ---------------------------------------- //
//  Make schedule.yml with all render: true //
// ---------------------------------------- //
// This step is skipped in a partial-render

async function makeFullSchedule(configPath: string, schedulePath: string) {
    const yamlContent = await Deno.readTextFile(configPath);
    const config = parse(yamlContent) as any;

    if (config && config.schedule) {
        const updatedSchedule = config.schedule.map(week => ({
            ...week,
            days: week.days.map(day => ({
                ...day,
                items: day.items.map(item => ({
                    ...item,
                    render: true // Set render to true for all items
                }))
            }))
        }));

        await Deno.writeTextFile(schedulePath, stringify(updatedSchedule));
    }
}

// This step is skipped in a partial-render and full-render
if (quartoProfile !== "partial-site" && quartoProfile !== "staff-site") {
  console.log("> Making schedule file ...");
  await makeFullSchedule(configPath, schedulePath);
}


// -------------------------------- //
//           Make Listings          //
// -------------------------------- //

async function makeListings(schedulePath: string, configPath: string) {
    const scheduleContent = await Deno.readTextFile(schedulePath);
    const schedule = parse(scheduleContent) as Array<any>;

    const configContent = await Deno.readTextFile(configPath);
    const config = parse(configContent) as any;

    const listingTypes = config['adaptive-nav']['listings'].map((listing: any) => listing.type);

    const typeLists: Record<string, Array<{ path: string }>> = {};
    const scheduleDir = dirname(schedulePath);

    for (const week of schedule) {
        for (const day of week.days) {
            if (day.items && Array.isArray(day.items)) {
                for (const item of day.items) {
                    if (item.render && listingTypes.includes(item.type)) {
                        const type = item.type; // Keep the original case
                        if (!typeLists[type]) {
                            typeLists[type] = [];
                        }
                        typeLists[type].push({ path: item.href });
                    }
                }
            }
        }
    }

    for (const [type, items] of Object.entries(typeLists)) {
        const outputPath = join(scheduleDir, `${type}-contents.yml`);
        await Deno.writeTextFile(outputPath, stringify(items));
        console.log(` - Created file: ${outputPath}`); 
    }
}

console.log("> Making contents files for listings...")
await makeListings(schedulePath, configPath);
console.log("> Rendering documents...")
