# GIT Deployer 

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-green.svg)](https://nodejs.org/)
[![Issues](https://img.shields.io/github/issues/:owner/:repo.svg)](https://github.com/:owner/:repo/issues)

## Description

Lightweight solution for automatically deploy your code from **GitHub**, **BitBucket** and ~~GitLab~~
## Features

- Based on webhooks
- Support multiple repositories
- Fully configurable

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Installation

To get started with this project, follow the steps below:

1. Clone the repository:
   ```bash
   git clone git@github.com:mukovoz/git-deployer.git
   cd git-deployer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure:
   ```bash
   cp ecosystem.config.cjs.sample ecosystem.config.cjs
   cp config.yml.sample config.yml
   ```


4. Start the application:
`npm start` or `node service.js`
   ```bash
   npm start 
   ```

5. Run it with service manager **(optional)**. It will keep your application in background as process and it will restart if it fail.
   ```bash
   #install node process manager
   npm i -g pm2
   #start service
   pm2 start ecosystem.config.cjs
   #stop service
   pm2 stop ecosystem.config.cjs
   ```

## Usage

Main configuration `config.yml` contain `server`  and `repositories` sections. Below you can see how to configure 2 or more repositories on same server.

```yaml
#this section allow you specify web-server details 
server:
  name: "Production Server" 
  host: 0.0.0.0
  port: 3000
repositories:
   my-pet-project-production:
      name: "My Pet Project [Live]"
      #secret key you would need specify during webhook configuration in github, bitbucket or gitlab
      secret: "XXXXXXXXXXXXXXXXX"
      #path to your git repository on the server
      path: /var/www/my-pet-project.com
      #branch you want to track
      branch: main
      #steps you need to deploy your project
      steps:
         - "git pull origin main"
         - "npm install"
         - "php artisan migrate"
         - "npm run production"
         - "/other/commands/you may --need"
   my-pet-project-dev:
      name: "My Pet Project [Development]"
      secret: "XXXXXXXXXXXXXXXXX"
      path: /var/www/staging.my-pet-project.com
      branch: develop
      steps:
         - "git pull origin main"
         - "npm install"
         - "php artisan migrate"
         - "npm run dev"
         - "/other/commands/you may --need"

```

### Webhooks
In BitBucket, GitHub or GitLab you can configure webhooks for push action. After you run service you can use 
```bash
http{s}://your-domain.com:port/deploy/:type/:id
#:type - where your repository is located - `github`, `bitbucket` or `gitlab`
#:id - id of repository from config.yml. Example: `my-pet-project-production`
```
Examples: 
```bash
https://your-domain.com:port/deploy/github/my-pet-project-production
https://your-domain.com:port/deploy/gitlab/other-project
https://your-domain.com:port/deploy/bitbucket/test-project
```


## Contributing

Contributions are welcome! Please follow the steps below:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit them:
   ```bash
   git commit -m "Add your-feature-name"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

## License

This project is licensed under the MIT License. A copy of the license is included in the repository. See
the [LICENSE](LICENSE) file for details.


## Contact

For any questions, suggestions, or issues, feel free to create an issue
on [GitHub](https://github.com/mukovoz/git-deployer/issues). You can also reach out to:

- **GitHub**: [https://github.com/mukovoz](https://github.com/mukovoz)