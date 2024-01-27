
import { parse } from "https://deno.land/std/encoding/yaml.ts";
import { join, dirname } from "https://deno.land/std/path/mod.ts";

const configPath = '_config.yml';


// ------------------------------------------- //
//  Remove temp files generated during render  //
// ------------------------------------------- //
// This remove all -contents.yml files, schedule.yml, and sidebar-nav.yml

async function removeTempFiles(configPath: string) {
    const yamlContent = await Deno.readTextFile(configPath);
    const config = parse(yamlContent) as any;

    const listingTypes = config['adaptive-nav']['listings'];

    const filesToRemove: string[] = listingTypes.map((listing: any) => `${listing.type}-contents.yml`);
    filesToRemove.push('sidebar-nav.yml', 'schedule.yml'); 

    const scriptDir = dirname(new URL(import.meta.url).pathname);

    for (const file of filesToRemove) {
        const filePath = join(scriptDir, file);
        try {
            await Deno.remove(filePath);
            console.log(`  - Removed file: ${filePath}`);
        } catch (error) {
            console.error(`  - Error removing file ${filePath}:`, error.message);
        }
    }
}

console.log("> Cleaning up temporary files ...");
await removeTempFiles(configPath);

