import {execSync} from "node:child_process";

export function getActiveBranch(repoPath) {
    return execSync(`git -C ${repoPath} rev-parse --abbrev-ref HEAD`, {stdio: 'pipe'}).toString().trim();
}
