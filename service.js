import express from 'express';

const app = express();
import fs from 'fs'
import {parse as YAMLParse} from 'yaml'
import resolvers from "./backend/resolvers.js";
import bodyParser from "body-parser";
import ApiError from "./backend/ApiError.js";
import {getStepInstance} from "./backend/steps.js";
import chalk from 'chalk';


if (!fs.existsSync('./config.yml')) {
    console.log(chalk.red("config.yml file not found"));
    console.log(chalk.yellow("Please copy config.yml.sample to config.yml and fill it with your data."));
    process.exit(1);
}

const config = YAMLParse(fs.readFileSync('./config.yml', 'utf8'));

app.listen(config?.server.port, config?.server?.host, () => {
    console.log(chalk.blue("Server started on " + chalk.green(config?.server?.host + ":" + config?.server?.port)));
});

app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
        req.json = JSON.parse(req.rawBody);
    }
}));

const getRepository = (id) => {
    if (!config?.repositories[id])
        throw new ApiError('Repository not found', 404);
    return config?.repositories[id];
}

app.post("/deploy/:provider/:id", (req, res) => {
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
            res.status(e.code || 400).send(e.message);
        } else {
            throw e;
        }
    }
});

