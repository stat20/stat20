import { parse, stringify } from "https://deno.land/std/encoding/yaml.ts";

async function createLiveTOC(schedulePath: string, outputPath: string) {
    const yamlContent = await Deno.readTextFile(schedulePath);
    const schedule = parse(yamlContent) as Array<any>;

    const notesHrefs = schedule.flatMap(week => 
        week.days.flatMap(day => 
            day.items?.filter(item => item.publish && item.type === 'Notes').map(item => ({ href: item.href })) || []
        )
    );

    const toc = {
        website: {
            sidebar: [
                {
                    title: "Notes",
                    style: "floating",
                    align: "left",
                    "collapse-level": 2,
                    contents: [
                        "notes.qmd",
                        ...notesHrefs
                    ]
                }
            ]
        }
    };

    await Deno.writeTextFile(outputPath, stringify(toc));
}

const schedulePath = 'schedule.yml'; // Path to your schedule YAML file
const outputPath = 'toc.yml'; // Output file for the table of contents
await createLiveTOC(schedulePath, outputPath);
