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

/* eslint-disable no-new, no-unused-expressions */
import fs from 'fs';
import path from 'path';
import { expect } from 'chai';

import ApplicationTypes from '../../../jdl/jhipster/application-types';
import { parseFromFiles } from '../../../jdl/readers/jdl-reader';
import DocumentParser from '../../../jdl/converters/parsed-jdl-to-jdl-object/parsed-jdl-to-jdl-object-converter';
import exportToJDL from '../../../jdl/exporters/jdl-exporter';

describe('integration tests', () => {
  context('when parsing and exporting a JDL', () => {
    let originalContent;
    let writtenContent;

    before(() => {
      originalContent = DocumentParser.parseFromConfigurationObject({
        parsedContent: parseFromFiles([path.join(__dirname, '..', 'test-files', 'big_sample.jdl')]),
        applicationType: ApplicationTypes.MONOLITH,
      });
      exportToJDL(originalContent, 'exported.jdl');
      writtenContent = DocumentParser.parseFromConfigurationObject({
        parsedContent: parseFromFiles(['exported.jdl']),
        applicationType: ApplicationTypes.MONOLITH,
      });
    });

    after(() => {
      fs.unlinkSync('exported.jdl');
    });

    it('should keep the same JDL content', () => {
      expect(writtenContent.toString()).to.equal(originalContent.toString());
    });
  });
});
