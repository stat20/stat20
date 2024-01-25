
import { parse, stringify } from "https://deno.land/std/encoding/yaml.ts";
import { join, dirname, basename } from "https://deno.land/std/path/mod.ts";

const configPath = '_config.yml'; // Path to your config YAML file
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
if (quartoProfile == "partial-render") {
  console.log("> Unignoring Files ...");
  await unIgnoreFiles(schedulePath);
}

// ---------------------------------------- //
// Make schedule.yml with all render: true //
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

// This step is skipped in a partial-render
if (quartoProfile !== "partial-render") {
  console.log("> Making schedule file ...");
  await makeFullSchedule(configPath, schedulePath);
}

// -------------------------------- //
//           Make Listings          //
// -------------------------------- //

async function makeListings(schedulePath: string) {
    const yamlContent = await Deno.readTextFile(schedulePath);
    const schedule = parse(yamlContent) as Array<any>;

    const typeLists: Record<string, Array<{ path: string }>> = {};
    const scheduleDir = dirname(schedulePath);

    for (const week of schedule) {
        for (const day of week.days) {
            if (day.items && Array.isArray(day.items)) {
                for (const item of day.items) {
                    if (item.render) {
                        const type = item.type.toLowerCase();
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
    }
}

console.log("> Making files for listings ...");
await makeListings(schedulePath);


// ----------------------------------- //
//           Make Sidebar Nav          //
// ----------------------------------- //

async function makeSidebarNav(schedulePath: string) {
    const yamlContent = await Deno.readTextFile(schedulePath);
    const schedule = parse(yamlContent) as Array<any>;

    let notesHrefs: string[] = [];

    schedule.forEach(week => {
        week.days.forEach(day => {
            day.items.forEach(item => {
                if (item.type === 'Notes' && item.render) {
                    notesHrefs.push(item.href);
                }
            });
        });
    });

    const sidebarNav = {
        website: {
            sidebar: {
                contents: notesHrefs
            }
        }
    };

    const sidebarNavPath = join(dirname(schedulePath), 'sidebar-nav.yml');
    await Deno.writeTextFile(sidebarNavPath, stringify(sidebarNav));
}

console.log("> Making extra sidebar nav ...");
await makeSidebarNav(schedulePath);



