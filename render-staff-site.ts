
import { parse, stringify } from "https://deno.land/std/encoding/yaml.ts";
import { join, dirname, basename } from "https://deno.land/std/path/mod.ts";

const configPath = '_config.yml'; // Path to your config YAML file
const schedulePath = 'schedule.yml';

// This is the same as full-render.ts except it activates the staff-site profile
// in the last step.


// ---------------------------------------- //
//  Make schedule.yml with all render: true //
// ---------------------------------------- //

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

console.log("> Making schedule file ...");
await makeFullSchedule(configPath, schedulePath);


// ----------------------------------- //
//    Make Sidebar Nav from schedule   //
// ----------------------------------- //

async function makeSidebarNav(schedulePath: string, configPath: string) {
    const scheduleContent = await Deno.readTextFile(schedulePath);
    const schedule = parse(scheduleContent) as Array<any>;

    const configContent = await Deno.readTextFile(configPath);
    const config = parse(configContent) as any;

    const sidebarTypes = config['adaptive-nav']['sidebar'];
    const isHybridMode = config['adaptive-nav']?.hybrid || false;

    let sidebarContents = [];

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

        if (isHybridMode) {
            sidebarContents.push({ title: type, contents: typeHrefs });
        } else {
            sidebarContents.push({ section: type, contents: typeHrefs });
        }
    });

    const sidebarNav = {
        website: {
            sidebar: isHybridMode ? sidebarContents : { contents: sidebarContents }
        }
    };

    const sidebarNavPath = join(dirname(schedulePath), 'sidebar-nav.yml');
    await Deno.writeTextFile(sidebarNavPath, stringify(sidebarNav));
}

console.log("> Making extra sidebar nav...")
await makeSidebarNav(schedulePath, configPath);


// -------------------------------- //
//       Render staff site        //
// -------------------------------- //

async function runQuartoRender() {
    const process = Deno.run({
        cmd: ["quarto", "render", "--profile", "staff-site"],
        stdout: "inherit",
        stderr: "inherit",
    });

    const { code } = await process.status();

    if (code !== 0) {
        console.error('Error: Quarto render process exited with code', code);
    }

    process.close();
}

console.log("> Full render list has been made.");
await runQuartoRender();
