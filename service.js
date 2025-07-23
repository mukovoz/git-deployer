import express from 'express';

const app = express();
import {execSync} from "node:child_process";
import fs from 'fs'
import {parse as YAMLParse, stringify} from 'yaml'
import resolvers from "./backend/resolvers.js";
import bodyParser from "body-parser";
import ApiError from "./backend/ApiError.js";
import {getStepInstance} from "./backend/steps.js";

app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
        req.json = JSON.parse(req.rawBody);
    }
}));

const config = YAMLParse(fs.readFileSync('./config.yml', 'utf8'))

const getRepository = (id) => config?.repositories[id];

app.post("/deploy/:provider/:id", (req, res) => {
    try {
        const {provider, id} = req.params;
        const repo = getRepository(id);
        if (!repo) {
            throw new ApiError('Repository not found', 404);
        }
        const resolver = resolvers[provider](req, repo);
        if (resolver.branch === repo.branch) {
            let stepResponses = [];
            repo?.steps.map(step => {
                try {
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

app.listen(3000, () => {
    console.log("Service is running on port 3000");
});