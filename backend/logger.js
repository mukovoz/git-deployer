import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";

/**
 * Logger for a repository: prints to console and, if `log` is set in config.yml, appends to that file
 * @param repo
 * @returns {{info: Function, success: Function, error: Function, output: Function}}
 */
export function createLogger(repo) {
    const file = repo?.log ? path.resolve(repo.log) : null;
    if (file) {
        try {
            fs.mkdirSync(path.dirname(file), {recursive: true});
        } catch (e) {
            console.error(chalk.red(`[${repo.name}] can't create log directory: ${e.message}`));
        }
    }

    const write = (level, message) => {
        if (!file) return;
        const lines = String(message).split('\n').map(line => `[${new Date().toISOString()}] [${level}] [${repo.name}] ${line}`);
        try {
            fs.appendFileSync(file, lines.join('\n') + '\n');
        } catch (e) {
            console.error(chalk.red(`[${repo.name}] can't write log file ${file}: ${e.message}`));
        }
    }

    return {
        info: (message) => {
            console.log(chalk.blue(`[${repo.name}] ${message}`));
            write('INFO', message);
        },
        success: (message) => {
            console.log(chalk.green(`[${repo.name}] ${message}`));
            write('INFO', message);
        },
        error: (message) => {
            console.error(chalk.red(`[${repo.name}] ${message}`));
            write('ERROR', message);
        },
        // raw step output, indented under the step line
        output: (text) => {
            const trimmed = String(text ?? '').trimEnd();
            if (!trimmed) return;
            const indented = trimmed.split('\n').map(line => `    ${line}`).join('\n');
            console.log(chalk.gray(indented));
            write('OUTPUT', indented);
        },
    }
}
