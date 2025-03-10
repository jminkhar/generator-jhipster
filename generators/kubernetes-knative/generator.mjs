/**
 * Copyright 2013-2022 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see https://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable consistent-return */
import chalk from 'chalk';
import shelljs from 'shelljs';
import fs from 'fs';

import BaseDockerGenerator from '../base-docker/index.mjs';

import prompts from './prompts.mjs';
import { writeFiles } from './files.mjs';
import { GENERATOR_KUBERNETES_KNATIVE } from '../generator-list.mjs';
import { checkImages, generateJwtSecret, configureImageNames, setAppsFolderPaths } from '../base-docker/docker-base.mjs';
import {
  checkHelm,
  checkKubernetes,
  loadConfig,
  saveConfig,
  setupKubernetesConstants,
  setupHelmConstants,
  derivedKubernetesPlatformProperties,
} from '../kubernetes/kubernetes-base.mjs';
import statistics from '../statistics.cjs';
import { kubernetesPlatformTypes, buildToolTypes, messageBrokerTypes } from '../../jdl/jhipster/index.mjs';

const { GeneratorTypes } = kubernetesPlatformTypes;
const { MAVEN } = buildToolTypes;
const { KAFKA } = messageBrokerTypes;

const { K8S } = GeneratorTypes;

/**
 * @class
 * @extends {BaseDockerGenerator}
 */
export default class KubernetesKnativeGenerator extends BaseDockerGenerator {
  async beforeQueue() {
    if (!this.fromBlueprint) {
      await this.composeWithBlueprints(GENERATOR_KUBERNETES_KNATIVE);
    }
  }

  get initializing() {
    return {
      sayHello() {
        this.log(chalk.white(`${chalk.bold('☸')} Welcome to the JHipster Kubernetes Knative Generator ${chalk.bold('☸')}`));
        this.log(chalk.white(`Files will be generated in the folder: ${chalk.yellow(this.destinationRoot())}`));
      },
      ...super.initializing,
      checkKubernetes,
      checkHelm,
      checkKnative() {
        if (this.skipChecks) return;
        const done = this.async();
        shelljs.exec(
          'kubectl get deploy -n knative-serving --label-columns=serving.knative.dev/release | grep -E "v0\\.[8-9]{1,3}\\.[0-9]*',
          { silent: true },
          (code, stdout, stderr) => {
            if (stderr || code !== 0) {
              this.log(
                `${chalk.yellow.bold('WARNING!')} Knative 0.8.* or later is not installed on your computer.\n` +
                  'Make sure you have Knative and Istio installed. Read https://knative.dev/docs/install/\n'
              );
            }
            done();
          }
        );
      },
      loadConfig,
      localInit() {
        this.deploymentApplicationType = 'microservice';
        this.istio = true;
      },
      setupKubernetesConstants,
      setupHelmConstants,
    };
  }

  get [BaseDockerGenerator.INITIALIZING]() {
    return this.delegateTasksToBlueprint(() => this.initializing);
  }

  get prompting() {
    return {
      askForPath: prompts.askForPath,
      askForApps: prompts.askForApps,
      askForGeneratorType: prompts.askForGeneratorType,
      askForMonitoring: prompts.askForMonitoring,
      askForClustersMode: prompts.askForClustersMode,
      askForServiceDiscovery: prompts.askForServiceDiscovery,
      askForAdminPassword: prompts.askForAdminPassword,
      askForKubernetesNamespace: prompts.askForKubernetesNamespace,
      askForDockerRepositoryName: prompts.askForDockerRepositoryName,
      askForDockerPushCommand: prompts.askForDockerPushCommand,
      askForIngressDomain: prompts.askForIngressDomain,
    };
  }

  get [BaseDockerGenerator.PROMPTING]() {
    return this.delegateTasksToBlueprint(() => this.prompting);
  }

  get configuring() {
    return {
      insight() {
        statistics.sendSubGenEvent('generator', GENERATOR_KUBERNETES_KNATIVE);
      },

      checkImages,
      generateJwtSecret,
      configureImageNames,
      setAppsFolderPaths,

      setPostPromptProp() {
        this.appConfigs.forEach(element => {
          element.clusteredDb ? (element.dbPeerCount = 3) : (element.dbPeerCount = 1);
          if (element.messageBroker === KAFKA) {
            this.useKafka = true;
          }
        });
      },
      saveConfig,
    };
  }

  get [BaseDockerGenerator.CONFIGURING]() {
    return this.delegateTasksToBlueprint(() => this.configuring);
  }

  get loading() {
    return {
      loadSharedConfig() {
        this.appConfigs.forEach(element => {
          this.loadAppConfig(element, element);
          this.loadServerConfig(element, element);

          this.loadDerivedAppConfig(element);
          this.loadDerivedServerConfig(element);
        });
        this.loadDeploymentConfig(this);
        derivedKubernetesPlatformProperties(this);
      },
    };
  }

  get [BaseDockerGenerator.LOADING]() {
    return this.delegateTasksToBlueprint(() => this.loading);
  }

  get writing() {
    return writeFiles();
  }

  get [BaseDockerGenerator.WRITING]() {
    return this.delegateTasksToBlueprint(() => this.writing);
  }

  get end() {
    return {
      deploy() {
        if (this.hasWarning) {
          this.log(`\n${chalk.yellow.bold('WARNING!')} Kubernetes Knative configuration generated, but no Jib cache found`);
          this.log('If you forgot to generate the Docker image for this application, please run:');
          this.log(this.warningMessage);
        } else {
          this.log(`\n${chalk.bold.green('Kubernetes Knative configuration successfully generated!')}`);
        }
        this.log(
          `\n${chalk.yellow.bold(
            'WARNING!'
          )} You will need to push your image to a registry. If you have not done so, use the following commands to tag and push the images:`
        );
        for (let i = 0; i < this.appsFolders.length; i++) {
          const originalImageName = this.appConfigs[i].baseName.toLowerCase();
          const targetImageName = this.appConfigs[i].targetImageName;
          if (originalImageName !== targetImageName) {
            this.log(`  ${chalk.cyan(`docker image tag ${originalImageName} ${targetImageName}`)}`);
          }
          this.log(`  ${chalk.cyan(`${this.dockerPushCommand} ${targetImageName}`)}`);
        }
        if (this.dockerRepositoryName) {
          this.log(`\n${chalk.green.bold('INFO!')} Alternatively, you can use Jib to build and push image directly to a remote registry:`);
          this.appsFolders.forEach((appsFolder, index) => {
            const appConfig = this.appConfigs[index];
            let runCommand = '';
            if (appConfig.buildTool === MAVEN) {
              runCommand = `./mvnw -ntp -Pprod verify jib:build -Djib.to.image=${appConfig.targetImageName}`;
            } else {
              runCommand = `./gradlew bootJar -Pprod jibBuild -Djib.to.image=${appConfig.targetImageName}`;
            }
            this.log(`  ${chalk.cyan(`${runCommand}`)} in ${this.destinationPath(this.directoryPath + appsFolder)}`);
          });
        }
        this.log('\nYou can deploy all your apps by running the following script:');
        if (this.generatorType === K8S) {
          this.log(`  ${chalk.cyan('bash kubectl-knative-apply.sh')}`);
          // Make the apply script executable
          try {
            fs.chmodSync('kubectl-knative-apply.sh', '755');
          } catch (err) {
            this.log(
              `${chalk.yellow.bold(
                'WARNING!'
              )}Failed to make 'kubectl-knative-apply.sh' executable, you may need to run 'chmod +x kubectl-knative-apply.sh'`
            );
          }
        } else {
          this.log(`  ${chalk.cyan('bash helm-knative-apply.sh or ./helm-knative-apply.sh')}`);
          this.log('\nYou can upgrade (after any changes) all your apps by running the following script:');
          this.log(`  ${chalk.cyan('bash helm-knative-upgrade.sh or ./helm-knative-upgrade.sh')}`);
          // Make the apply script executable
          try {
            fs.chmodSync('helm-knative-apply.sh', '755');
            fs.chmodSync('helm-knative-upgrade.sh', '755');
          } catch (err) {
            this.log(
              `${chalk.yellow.bold(
                'WARNING!'
              )}Failed to make 'helm-knative-apply.sh', 'helm-knative-upgrade.sh' executable, you may need to run 'chmod +x helm-knative-apply.sh helm-knative-upgrade.sh`
            );
          }
        }
      },
    };
  }

  get [BaseDockerGenerator.END]() {
    return this.delegateTasksToBlueprint(() => this.end);
  }
}
