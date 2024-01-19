import { parse, stringify } from "https://deno.land/std/encoding/yaml.ts";
import { join } from "https://deno.land/std/path/mod.ts";

function convertDateToISOFormat(dateStr: string, timezone: string): string {
    const [month, day, year] = dateStr.split('/').map(num => num.padStart(2, '0'));
    return `20${year}-${month}-${day}T00:00:00${timezone}`;
}

async function getAutoPublishDate(autoPublishPath: string): Promise<Date> {
    const yamlContent = await Deno.readTextFile(autoPublishPath);
    const autoPublish = parse(yamlContent) as any;
    const liveAsOfStr = autoPublish["autopublish"]["live-as-of"];
    const timezone = autoPublish["autopublish"]["timezone"];
    return new Date(convertDateToISOFormat(liveAsOfStr, timezone));
}

async function modifySchedule(schedulePath: string, thresholdDate: Date) {
    const yamlContent = await Deno.readTextFile(schedulePath);
    let schedule = parse(yamlContent) as Array<any>;

    schedule = schedule.map(week => ({
        ...week,
        days: week.days.map(day => {
            // Check if items exist
            if (!day.items) {
                return day; // Return the day as is if no items are present
            }

            // Process items if they exist
            return {
                ...day,
                items: day.items.map(item => ({
                    ...item,
                    publish: new Date(convertDateToISOFormat(day.date, "+00:00")) < thresholdDate
                }))
            };
        })
    }));

    await Deno.writeTextFile(schedulePath, stringify(schedule));
}



const schedulePath = 'schedule.yml'; // Path to your schedule YAML file
const autoPublishPath = 'autopublish.yml'; // Path to your auto-publish YAML file

const thresholdDate = await getAutoPublishDate(autoPublishPath);
await modifySchedule(schedulePath, thresholdDate);
