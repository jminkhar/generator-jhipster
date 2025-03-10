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
import { databaseTypes, monitoringTypes, searchEngineTypes, serviceDiscoveryTypes } from '../../jdl/jhipster/index.mjs';

const { ELASTICSEARCH } = searchEngineTypes;
const { PROMETHEUS } = monitoringTypes;
const { CONSUL, EUREKA } = serviceDiscoveryTypes;

const NO_DATABASE = databaseTypes.NO;

export default {
  writeFiles,
};

export function writeFiles() {
  return {
    writeDeployments() {
      for (let i = 0; i < this.appConfigs.length; i++) {
        const appName = this.appConfigs[i].baseName.toLowerCase();
        this.app = this.appConfigs[i];
        this.template('deployment.yml.ejs', `${this.directoryPath}/ocp/${appName}/${appName}-deployment.yml`);

        if (this.app.prodDatabaseType !== NO_DATABASE) {
          this.template(
            `db/${this.app.prodDatabaseType}.yml.ejs`,
            `${this.directoryPath}/ocp/${appName}/${appName}-${this.app.prodDatabaseType}.yml`
          );
        }
        if (this.app.searchEngine === ELASTICSEARCH) {
          this.template('db/elasticsearch.yml.ejs', `${this.directoryPath}/ocp/${appName}/${appName}-elasticsearch.yml`);
        }
      }
    },

    writeMessagingBroker() {
      if (!this.useKafka) return;
      this.template('messagebroker/kafka.yml.ejs', `${this.directoryPath}/ocp/messagebroker/kafka.yml`);
    },

    writeRegistryFiles() {
      this.template('scc/scc-config.yml.ejs', `${this.directoryPath}/ocp/registry/scc-config.yml`);
      if (this.serviceDiscoveryType === EUREKA) {
        this.template('registry/jhipster-registry.yml.ejs', `${this.directoryPath}/ocp/registry/jhipster-registry.yml`);
        this.template('registry/application-configmap.yml.ejs', `${this.directoryPath}/ocp/registry/application-configmap.yml`);
      } else if (this.serviceDiscoveryType === CONSUL) {
        this.template('registry/consul.yml.ejs', `${this.directoryPath}/ocp/registry/consul.yml`);
        this.template('registry/application-configmap.yml.ejs', `${this.directoryPath}/ocp/registry/application-configmap.yml`);
      }
    },

    writePrometheusFiles() {
      if (this.monitoring !== PROMETHEUS) return;

      const appsToMonitor = [];
      for (let i = 0; i < this.appConfigs.length; i++) {
        appsToMonitor.push(`- ${this.appConfigs[i].baseName}:${this.appConfigs[i].serverPort}`);
      }

      this.appsToMonitorList = appsToMonitor.join('\n').replace(/'/g, '');

      this.template('monitoring/jhipster-metrics.yml.ejs', `${this.directoryPath}/ocp/monitoring/jhipster-metrics.yml`);
    },

    writeConfigRunFile() {
      this.template('apply.sh.ejs', `${this.directoryPath}/ocp/ocp-apply.sh`);
    },
  };
}
