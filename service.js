import express from 'express';

const app = express();
import fs from 'fs'
import {parse as YAMLParse} from 'yaml'
import resolvers from "./backend/resolvers.js";
import bodyParser from "body-parser";
import ApiError from "./backend/ApiError.js";
import {getStepInstance} from "./backend/steps.js";
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

const log = (message, data) => {
    console.log(message, data);
}

app.listen(config?.server.port, config?.server?.host, () => {
    console.log(chalk.blue("Server started on " + chalk.green(config?.server?.host + ":" + config?.server?.port)));
    for (let id in config?.repositories) {
        const _repo = config?.repositories[id];
        console.log('\n' + chalk.bgGreen(_repo.name));
        ['github', 'bitbucket', 'gitlab'].map(provider => {
            console.log(chalk.bgBlue(`for ${provider}`), chalk.underline(`//${config?.server?.host}:${config?.server?.port}/deploy/${provider}/${id}`))
        })
    }
}).on('error', (e) => {
    console.error("Server is crashed: " + e.message);
});

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
 *  Main webhook processor for any provider
 * :provider - github|gitlab|bitbucket
 * :id  - repository from config.yml
 */
app.post("/deploy/:provider/:id", (req, res) => {

    console.log(`${req.url} triggered`);
    try {
        const {provider, id} = req.params;
        const repo = getRepository(id);
        const resolver = resolvers[provider](req, repo);

        if (resolver.branch === repo.branch) {
            let stepResponses = [];
            repo?.steps.map(step => {
                try {
                    repo.result = stepResponses.join('\n');
                    stepResponses.push(getStepInstance(repo, step).run())
                } catch (e) {
                    stepResponses.push(e.message);
                    console.error(e.message);
                }
            });
            res.status(200).send(stepResponses);
        }
    } catch (e) {
        if (e instanceof ApiError) {
            console.error(e.message)
            res.status(e.code || 400).send(e.message);
        } else {
            throw e;
        }
    }
});

