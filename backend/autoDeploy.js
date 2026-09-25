import {execSync} from "node:child_process";
import chalk from "chalk";
import {runSteps} from "./deploy.js";

const DEFAULT_TIMEOUT_SEC = 60;

const resolveTimeoutMs = (repo) => {
    const timeout = Number(repo.auto_timeout);
    if (!Number.isFinite(timeout) || timeout <= 0) {
        if (repo.auto_timeout !== undefined) {
            console.log(chalk.yellow(`[${repo.name}] invalid auto_timeout "${repo.auto_timeout}", falling back to ${DEFAULT_TIMEOUT_SEC}s`));
        }
        return DEFAULT_TIMEOUT_SEC * 1000;
    }
    return timeout * 1000;
}

const hasNewCommits = (repo) => {
    execSync(`git -C ${repo.path} fetch origin ${repo.branch}`, {stdio: 'pipe'});
    const local = execSync(`git -C ${repo.path} rev-parse HEAD`, {stdio: 'pipe'}).toString().trim();
    const remote = execSync(`git -C ${repo.path} rev-parse origin/${repo.branch}`, {stdio: 'pipe'}).toString().trim();
    return {changed: local !== remote, local, remote};
}

export function startAutoDeploy(repositories) {
    for (let id in repositories) {
        const repo = repositories[id];
        if (!repo?.auto) continue;

        const timeoutMs = resolveTimeoutMs(repo);
        let inProgress = false;

        console.log(chalk.bgBlue(`Auto mode enabled for ${repo.name}`), chalk.underline(`(checking every ${timeoutMs / 1000}s)`));

        setInterval(() => {
            if (inProgress) {
                console.log(chalk.yellow(`[${repo.name}] previous check still running, skipping tick`));
                return;
            }
            inProgress = true;
            try {
                console.log(chalk.blue(`[${repo.name}] checking for changes on ${repo.branch}...`));
                const {changed, local, remote} = hasNewCommits(repo);
                if (!changed) {
                    console.log(chalk.gray(`[${repo.name}] no changes`));
                    return;
                }
                console.log(chalk.green(`[${repo.name}] new commits found: ${local.slice(0, 7)} -> ${remote.slice(0, 7)}, deploying...`));
                runSteps(repo, `auto ${local.slice(0, 7)} -> ${remote.slice(0, 7)}`);
            } catch (e) {
                console.error(chalk.red(`[${repo.name}] auto-deploy check failed: ${e.message}`));
            } finally {
                inProgress = false;
            }
        }, timeoutMs);
    }
}
