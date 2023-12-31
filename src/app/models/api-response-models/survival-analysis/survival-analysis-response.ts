/**
 * Copyright 2020 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export class ApiSurvivalAnalysisResponse {
  results: {
    survivalQueryResult: {
      type: 'floatMatrix';
      data: number[][];
    } | {
      type: 'ciphertable';
      value: string;
      data: number[][];
    }
  }
}
