import { parse, stringify } from "https://deno.land/std/encoding/yaml.ts";

async function modifySchedule(schedulePath: string) {
    const yamlContent = await Deno.readTextFile(schedulePath);
    let schedule = parse(yamlContent) as Array<any>;

    schedule = schedule.map(week => ({
        ...week,
        days: week.days.map(day => {
            // Ensure 'items' exists and is an array; if not, initialize it as an empty array
            const items = Array.isArray(day.items) ? day.items : [];

            return {
                ...day,
                items: items.map(item => ({
                    ...item,
                    publish: true // Always set publish to true
                }))
            };
        })
    }));

    await Deno.writeTextFile(schedulePath, stringify(schedule));
}

const schedulePath = 'schedule.yml'; // Path to your schedule YAML file
await modifySchedule(schedulePath);
