import fs from "node:fs";
import chalk from "chalk";
import {parse as YAMLParse} from "yaml";
import {getActiveBranch} from "./git.js";

/**
 * Reads config.yml (exits if missing) and fills in `branch` from the checked out branch for repos without one
 * @param file
 * @returns {object}
 */
export function loadConfig(file = './config.yml') {
    if (!fs.existsSync(file)) {
        console.log(chalk.red(`${file} file not found`));
        console.log(chalk.yellow("Please copy config.yml.sample to config.yml and fill it with your data."));
        process.exit(1);
    }

    const config = YAMLParse(fs.readFileSync(file, 'utf8'));

    for (let id in config?.repositories) {
        const repo = config.repositories[id];
        if (!repo.branch) {
            try {
                repo.branch = getActiveBranch(repo.path);
                console.log(chalk.blue(`[${repo.name}] no branch configured, using active branch "${repo.branch}"`));
            } catch (e) {
                console.error(chalk.red(`[${repo.name}] failed to detect active branch: ${e.message}`));
            }
        }
    }
    return config;
}
