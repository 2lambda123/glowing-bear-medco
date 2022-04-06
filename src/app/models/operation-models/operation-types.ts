/**
 * Copyright 2021  CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export class OperationType {


  static readonly EXPLORE: string = 'Cohort Selection'
  static readonly EXPLORE_STATISTICS: string = 'Reference Interval Estimation'
  static readonly ANALYSIS: string = 'Analysis'

  static readonly ALL_TYPES = [
    OperationType.EXPLORE,
    OperationType.EXPLORE_STATISTICS,
    OperationType.ANALYSIS
  ]

}
