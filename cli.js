#!/usr/bin/env node
import fs from "node:fs";
import {execSync} from "node:child_process";
import chalk from "chalk";
import {loadConfig} from "./backend/config.js";
import {runSteps, describeStep} from "./backend/deploy.js";
import {createLogger} from "./backend/logger.js";
import {hasNewCommits} from "./backend/autoDeploy.js";
import {isKnownStepType} from "./backend/steps.js";

const usage = () => {
    console.log(`Usage:
  node cli.js list                    list configured repositories
  node cli.js deploy <id>             run the deploy steps of repository <id>
  node cli.js deploy <id> --dry-run   check repository <id> and print its steps without running them`);
}

const list = (config) => {
    for (let id in config?.repositories) {
        const repo = config.repositories[id];
        console.log(chalk.green(id), chalk.bold(repo.name ?? ''));
        console.log(`    path: ${repo.path}`);
        console.log(`    branch: ${repo.branch}`);
        console.log(`    auto: ${repo.auto ? 'yes' : 'no'}`);
        console.log(`    steps: ${(repo.steps || []).length}`);
    }
}

/**
 * Checks the repository and prints what a deploy would run, without running any step
 * @returns {number} number of problems found
 */
const dryRun = (repo) => {
    // console only, the deploy log file is not touched
    const logger = createLogger({...repo, log: undefined});
    const steps = repo.steps || [];
    let problems = 0;

    logger.info(`Dry run, branch ${repo.branch}, ${steps.length} step(s)`);

    if (!repo.path || !fs.existsSync(repo.path)) {
        logger.error(`Path "${repo.path}" does not exist`);
        problems++;
    } else {
        try {
            execSync(`git -C ${repo.path} rev-parse --git-dir`, {stdio: 'pipe'});
            const {changed, local, remote} = hasNewCommits(repo);
            changed
                ? logger.success(`New commits on origin/${repo.branch}: ${local.slice(0, 7)} -> ${remote.slice(0, 7)}`)
                : logger.info(`Up to date with origin/${repo.branch} (${local.slice(0, 7)})`);
        } catch (e) {
            logger.error(`Git check failed: ${e.message.trim()}`);
            problems++;
        }
    }

    steps.forEach((step, i) => {
        const label = `Step ${i + 1}/${steps.length} [${describeStep(step)}]`;
        if (isKnownStepType(step)) {
            logger.info(`${label} -> ${typeof step === 'string' ? 'command' : step.type}`);
        } else {
            logger.error(`${label} -> unknown type "${step?.type}", it would be skipped`);
            problems++;
        }
    });

    const summary = `Dry run finished: ${problems} problem(s)`;
    problems ? logger.error(summary) : logger.success(summary);
    return problems;
}

const [command, id, ...flags] = process.argv.slice(2);

if (command === 'list') {
    list(loadConfig());
} else if (command === 'deploy' && id) {
    const config = loadConfig();
    const repo = config?.repositories?.[id];
    if (!repo) {
        console.error(chalk.red(`Repository [${id}] not found. Available: ${Object.keys(config?.repositories || {}).join(', ')}`));
        process.exit(1);
    }
    if (flags.includes('--dry-run')) {
        process.exit(dryRun(repo) ? 1 : 0);
    }
    const responses = runSteps(repo, 'cli');
    // notification steps send asynchronously, so let the event loop drain instead of calling process.exit
    process.exitCode = responses.failed ? 1 : 0;
} else {
    usage();
    process.exitCode = command ? 1 : 0;
}
