import { parse, stringify } from "https://deno.land/std/encoding/yaml.ts";

async function processSchedule(schedulePath: string) {
    const yamlContent = await Deno.readTextFile(schedulePath);
    const schedule = parse(yamlContent) as Array<any>;

    const typeLists: Record<string, Array<{ path: string }>> = {};

    for (const week of schedule) {
        for (const day of week.days) {
            // Check if 'items' key exists
            if (day.items && Array.isArray(day.items)) {
                for (const item of day.items) {
                    if (item.publish) {
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
        await Deno.writeTextFile(`${type}-listing.yml`, stringify(items));
    }
}

const schedulePath = 'schedule.yml'; // Path to your schedule YAML file
await processSchedule(schedulePath);
