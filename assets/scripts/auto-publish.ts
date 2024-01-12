import { parse } from "https://deno.land/std/encoding/yaml.ts";
import { join, dirname, basename } from "https://deno.land/std/path/mod.ts";

async function renameFilesBasedOnDate(yamlFilePath: string, thresholdDateStr: string) {
    const yamlContent = await Deno.readTextFile(yamlFilePath);
    const schedule = parse(yamlContent) as Array<any>;
    const thresholdDate = new Date(thresholdDateStr);

    for (const week of schedule) {
        for (const day of week.days) {
            const currentDate = new Date(day.date);
            if (currentDate > thresholdDate) {
                for (const item of day.items) {
                    const filePath = item.href;
                    const newFilePath = join(dirname(filePath), '_' + basename(filePath));
                    await Deno.rename(filePath, newFilePath);
                    console.log(`Renamed: ${filePath} to ${newFilePath}`);
                }
            }
        }
    }
}

const yamlFilePath = 'schedule.yml'; // Replace with the path to your YAML file
const thresholdDateStr = '8/2/23'; // Date format: M/D/YY
renameFilesBasedOnDate(yamlFilePath, thresholdDateStr);
