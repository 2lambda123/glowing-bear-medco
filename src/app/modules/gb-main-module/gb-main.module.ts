/**
 * Copyright 2017 - 2018  The Hyve B.V.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GbMainComponent } from './gb-main.component';
import { GbNavBarModule } from '../gb-navbar-module/gb-navbar.module';
import { GbSidePanelModule } from '../gb-side-panel-module/gb-side-panel.module';
import { routing } from './gb-main.routing';
import { RouterModule } from '@angular/router';
import { GbAnalysisModule } from '../gb-analysis-module/gb-analysis.module';
import { CohortService } from 'app/services/cohort.service';
import { SurvivalResultsService } from 'app/services/survival-results.service';
import { GbSurvivalResultsModule } from '../gb-survival-results-module/gb-survival-results.module';
import { ConstraintReverseMappingService } from 'app/services/constraint-reverse-mapping.service';

@NgModule({
  imports: [
    CommonModule,
    routing,
    GbNavBarModule,
    GbSidePanelModule,
    GbAnalysisModule,
    GbSurvivalResultsModule
  ],
  declarations: [GbMainComponent],
  exports: [GbMainComponent, RouterModule],
  providers: [CohortService, SurvivalResultsService, ConstraintReverseMappingService]
})
export class GbMainModule {
}
