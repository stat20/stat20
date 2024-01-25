
import { parse, stringify } from "https://deno.land/std/encoding/yaml.ts";
import { join, dirname, basename } from "https://deno.land/std/path/mod.ts";

const configPath = '_config.yml'; // Path to your config YAML file
const schedulePath = 'schedule.yml';


// -------------------------------- //
//     Prepare partial schedule     //
// -------------------------------- //
// Make schedule.yml where each item defaults to render: true
// This is overridden and set to false for items where date > live-as-of date
// That is overridden by a pre-existing render value that exists in _config.yml

function convertDateToISOFormat(dateStr: string, timezone: string): string {
    const [month, day, year] = dateStr.split('/').map(num => num.padStart(2, '0'));
    return `20${year}-${month}-${day}T00:00:00${timezone}`;
}

async function getThresholdDate(configPath: string): Promise<Date> {
    const yamlContent = await Deno.readTextFile(configPath);
    const config = parse(yamlContent) as any;
    const liveAsOfStr = config["partial-render"]["render-as-of"];
    const timezone = config["partial-render"]["timezone"];
    return new Date(convertDateToISOFormat(liveAsOfStr, timezone));
}

async function makePartialSchedule(configPath: string, schedulePath: string) {
    const yamlContent = await Deno.readTextFile(configPath);
    let config = parse(yamlContent) as any;
    
    const renderAsOfStr = config["partial-render"]["render-as-of"];
    const timezone = config["partial-render"]["timezone"];

    const thresholdDate = await new Date(convertDateToISOFormat(renderAsOfStr, timezone));

    const schedule = config.schedule.map(week => ({
        ...week,
        days: week.days.map(day => ({
            ...day,
            items: day.items ? day.items.map(item => ({
                ...item,
                render: item.hasOwnProperty('render') ? item.render :
                         item.hasOwnProperty('date') ? new Date(convertDateToISOFormat(day.date, "+00:00")) < thresholdDate :
                         true
            })) : []
        }))
    }));

    await Deno.writeTextFile(schedulePath, stringify(schedule));
}

await makePartialSchedule(configPath, schedulePath);



// ----------------------------------- //
//    Make Sidebar Nav from schedule   //
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
                title: "Notes",
                contents: notesHrefs
            }
        }
    };

    const sidebarNavPath = join(dirname(schedulePath), 'sidebar-nav.yml');
    await Deno.writeTextFile(sidebarNavPath, stringify(sidebarNav));
}

console.log("> Making extra sidebar nav ...");
await makeSidebarNav(schedulePath);


// -------------------------------- //
//  Ignore files based on schedule  //
// -------------------------------- //

async function ignoreFiles(schedulePath: string) {
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
                            await Deno.rename(oldPath, newPath);
                            console.log(`Renamed: ${oldPath} to ${newPath}`);
                        } catch (error) {
                            console.error(`Error renaming ${oldPath} to ${newPath}:`, error.message);
                        }
                    }
                }
            }
        }
    }
}

console.log("> Ignoring Files")
await ignoreFiles(schedulePath);


// -------------------------------- //
//       Render partial site        //
// -------------------------------- //

async function runQuartoRender() {
    const process = Deno.run({
        cmd: ["quarto", "render", "--profile", "partial-render"],
        stdout: "inherit", // Pipe the standard output of the command directly to the standard output of the Deno process
        stderr: "inherit", // Pipe the standard error of the command directly to the standard error of the Deno process
    });

    const { code } = await process.status();

    if (code !== 0) {
        console.error('Error: Quarto render process exited with code', code);
    }

    process.close();
}

console.log(">> Quarto Render");
await runQuartoRender();
