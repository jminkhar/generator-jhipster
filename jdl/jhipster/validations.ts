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

const Validations: any = {
  REQUIRED: 'required',
  UNIQUE: 'unique',
  MIN: 'min',
  MAX: 'max',
  MINLENGTH: 'minlength',
  MAXLENGTH: 'maxlength',
  PATTERN: 'pattern',
  MINBYTES: 'minbytes',
  MAXBYTES: 'maxbytes',
};

export const REQUIRED = Validations.REQUIRED;
export const UNIQUE = Validations.UNIQUE;
export const MIN = Validations.MIN;
export const MAX = Validations.MAX;
export const MINLENGTH = Validations.MINLENGTH;
export const MAXLENGTH = Validations.MAXLENGTH;
export const PATTERN = Validations.PATTERN;
export const MINBYTES = Validations.MINBYTES;
export const MAXBYTES = Validations.MAXBYTES;

Validations.exists = validation =>
  Object.keys(Validations)
    .map(key => Validations[key])
    .includes(validation);

Validations.needsValue = validation => {
  const valuedMap = {
    required: false,
    unique: false,
    min: true,
    max: true,
    minlength: true,
    maxlength: true,
    pattern: true,
    minbytes: true,
    maxbytes: true,
  };
  return valuedMap[validation];
};

export default Validations;
