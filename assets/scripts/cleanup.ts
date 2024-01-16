import { parse } from "https://deno.land/std/encoding/yaml.ts";
import { join, dirname, basename } from "https://deno.land/std/path/mod.ts";

function convertDateToISOFormat(dateStr: string, timezone: string): string {
    if (dateStr.toLowerCase() === "system time") {
        const now = new Date();
        // Convert the current system time to ISO format with timezone
        return now.toISOString().split('.')[0] + timezone;
    } else {
        const [month, day, year] = dateStr.split('/').map(num => num.padStart(2, '0'));
        return `20${year}-${month}-${day}T00:00:00${timezone}`;
    }
}

async function getAutoPublishDate(autoPublishPath: string): Promise<string> {
    const yamlContent = await Deno.readTextFile(autoPublishPath);
    const autoPublish = parse(yamlContent) as any;
    const liveAsOfStr = autoPublish["autopublish"]["live-as-of"];
    const timezone = autoPublish["autopublish"]["timezone"];
    return convertDateToISOFormat(liveAsOfStr, timezone);
}

async function renameFilesBasedOnDate(yamlFilePath: string, thresholdDateStr: string) {
    const thresholdDate = new Date(thresholdDateStr);
    console.log(`Parsed Threshold Date: ${thresholdDate}`);

    const yamlContent = await Deno.readTextFile(yamlFilePath);
    const schedule = parse(yamlContent) as Array<any>;

    for (const week of schedule) {
        for (const day of week.days) {
            const currentDateStr = convertDateToISOFormat(day.date, thresholdDateStr.slice(-6));
            const currentDate = new Date(currentDateStr);
            console.log(`Current Date String: ${currentDateStr}`);
            console.log(`Parsed Current Date: ${currentDate}`);
            if (currentDate > thresholdDate) {
                for (const item of day.items) {
                    const filePath = item.href;
                    const newFilePath = join(dirname(filePath), '_' + basename(filePath));
                    console.log(`Renaming: ${newFilePath} to ${filePath}`);
                    await Deno.rename(newFilePath, filePath);
                }
            } else {
                console.log(`Date does not meet threshold: ${currentDate}`);
            }
        }
    }
}

const yamlFilePath = 'schedule.yml'; // Path to your schedule YAML file
const autoPublishPath = 'autopublish.yml'; // Path to your auto-publish YAML file

const thresholdDateStr = await getAutoPublishDate(autoPublishPath);
await renameFilesBasedOnDate(yamlFilePath, thresholdDateStr);