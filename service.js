import express from 'express';

const app = express();
import fs from 'fs'
import {parse as YAMLParse} from 'yaml'
import resolvers from "./backend/resolvers.js";
import bodyParser from "body-parser";
import ApiError from "./backend/ApiError.js";
import {runSteps} from "./backend/deploy.js";
import {createLogger} from "./backend/logger.js";
import {startAutoDeploy} from "./backend/autoDeploy.js";
import {getActiveBranch} from "./backend/git.js";
import chalk from 'chalk';

//import pkg from './package.json' assert { type: 'json' };

// console.log('\n');
// console.log(chalk.blue(pkg.name) + " " + chalk.bgGreen(`v${pkg.version}`));
// console.log(`${pkg.description}\n`)

if (!fs.existsSync('./config.yml')) {
    console.log(chalk.red("config.yml file not found"));
    console.log(chalk.yellow("Please copy config.yml.sample to config.yml and fill it with your data."));
    process.exit(1);
}

const config = YAMLParse(fs.readFileSync('./config.yml', 'utf8'));

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



app.listen(config?.server.port, config?.server?.host, () => {
    console.log(chalk.blue("Server started on " + chalk.green(config?.server?.host + ":" + config?.server?.port)));
    for (let id in config?.repositories) {
        const _repo = config?.repositories[id];
        console.log('\n' + chalk.bgGreen(_repo.name));
        Object.keys(resolvers).map(provider => {
            console.log(chalk.bgBlue(`for ${provider}`), chalk.underline(`//${config?.server?.host}:${config?.server?.port}/deploy/${provider}/${id}`))
        })
    }
}).on('error', (e) => {
    console.error("Server is crashed: " + e.message);
});

startAutoDeploy(config?.repositories);

app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
        req.json = JSON.parse(req.rawBody);
    }
}));

const getRepository = (id) => {
    if (!config?.repositories[id])
        throw new ApiError(`Repository [${id}] not found`, 404);
    return config?.repositories[id];
}

/**
 *  Status page to check the webhook URL in a browser
 */
app.get("/deploy/:provider/:id", (req, res) => {
    try {
        const {provider, id} = req.params;
        const repo = getRepository(id);
        if (!resolvers[provider])
            throw new ApiError(`Provider [${provider}] not supported`, 404);
        res.type('text').send(`${repo.name} Waiting webhooks from ${provider}`);
    } catch (e) {
        if (e instanceof ApiError) {
            res.status(e.code).send(e.message);
        } else {
            throw e;
        }
    }
});

/**
 *  Main webhook processor for any provider
 * :provider - github|gitlab|bitbucket|custom
 * :id  - repository from config.yml
 */
app.post("/deploy/:provider/:id", (req, res) => {

    console.log(`${req.url} triggered`);
    let logger = null;
    try {
        const {provider, id} = req.params;
        const repo = getRepository(id);
        logger = createLogger(repo);
        if (!resolvers[provider])
            throw new ApiError(`Provider [${provider}] not supported`, 404);
        const resolver = resolvers[provider](req, repo);

        if (resolver.branch !== repo.branch) {
            const message = `Webhook ${provider} skipped: pushed branch "${resolver.branch}", tracking "${repo.branch}"`;
            logger.info(message);
            return res.status(200).send(message);
        }
        res.status(200).send(runSteps(repo, `webhook ${provider}`));
    } catch (e) {
        const message = `Webhook ${req.params.provider} rejected: ${e.message}`;
        logger ? logger.error(message) : console.error(chalk.red(message));
        res.status(e instanceof ApiError ? e.code : 500).send(e instanceof ApiError ? e.message : 'Internal error');
    }
});

