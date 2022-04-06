/**
 * Copyright 2017 - 2018  The Hyve B.V.
 * Copyright 2020 - 2021 EPFL LDS
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Subject, Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { Router } from '@angular/router'
import {OperationType} from '../models/operation-models/operation-types';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class NavbarService {

  private _items: MenuItem[];
  private _activeItem: MenuItem;
  private _selectedSurvivalId: Subject<number>
  private _selectedSurvivalIDtoDelete: Subject<number>

  private _resultItems: MenuItem[];
  private _activeResultItem: MenuItem;

  private _isExplore = true;
  private _isExploreStatistics = false;
  private _isExploreResults = false;
  private _isAnalysis = false;
  private _isResults = false;
  private _isSurvivalRes = false;

  private _lastSuccessfulSurvival: number;

  private EXPLORE_INDEX = 0;
  private EXPLORE_STATS_INDEX = 1;
  private ANALYSIS_INDEX = 2;
  private RESULTS_INDEX = 3;

  constructor(private authService: AuthenticationService, private keycloakService: KeycloakService, private router: Router) {
    const haveRightsForSurvivalQuery = !!this.keycloakService.getUserRoles().find((role) => role === 'survival_query');
    this._selectedSurvivalId = new Subject<number>()
    this._selectedSurvivalIDtoDelete = new Subject<number>()
    this.items = [

      // 0: explore tab, default page
      { label: OperationType.EXPLORE, routerLink: '/explore' },

      // 1: explore statistics tab
      { label: OperationType.EXPLORE_STATISTICS, routerLink: "/explore-statistics" },

      ...(haveRightsForSurvivalQuery ? [
        // 2: survival analysis tab
        { label: OperationType.ANALYSIS, routerLink: '/analysis', visible: this.authService.hasAnalysisAuth },

        // 3: results tab
//        { label: 'Results', routerLink: '/results', visible: this.authService.hasAnalysisAuth }
      ] : [])
    ]

    this.resultItems = []
    this._lastSuccessfulSurvival = 0
  }

  updateNavbar(routerLink: string) {
    this.isExplore = (routerLink === '/explore' || routerLink === '');
    this.isExploreStatistics = (routerLink === '/explore-statistics');
    this.isAnalysis = (routerLink === '/analysis');
    this.isResults = (routerLink === '/results');
    this.isSurvivalRes = false
    for (let i = 0; i < this.resultItems.length; i++) {
      if (routerLink === this.resultItems[i].routerLink.toString()) {
        this.isSurvivalRes = true
        break
      }
    }
    console.log('Updated router link: ', routerLink)

    if (this.isExplore) {
      this.activeItem = this.items[this.EXPLORE_INDEX];
    } else if (this.isExploreStatistics) {
      this.activeItem = this._items[this.EXPLORE_STATS_INDEX];
    } else if (this.isAnalysis) {
      this.activeItem = this.items[this.ANALYSIS_INDEX];
    } else if (this.isResults) {
      this.activeItem = this.items[this.RESULTS_INDEX];
    } else {
      if (this.isSurvivalRes) {
        this.activeItem = this.items[this.RESULTS_INDEX]
        for (let j = 0; j < this.resultItems.length; j++) {
          if (this.resultItems[j].routerLink.toString() === routerLink) {
            this.activeResultItem = this.resultItems[j]
            this._selectedSurvivalId.next(j)
            break
          }
        }
      }
    }
  }

  insertNewSurvResults() {
    this.resultItems.push({ label: `Survival Result ${this._lastSuccessfulSurvival + 1}`, routerLink: `/results/survival/${this._lastSuccessfulSurvival + 1}` })
    this._lastSuccessfulSurvival++;
  }

  deleteSrvResult() {
    let index = this.resultItems.indexOf(this.activeResultItem)
    this.resultItems = this.resultItems.filter(obj => obj !== this.activeResultItem)
    this._selectedSurvivalIDtoDelete.next(index)
    if (this.resultItems.length === 0) {
      this.activeResultItem = undefined
      this.router.navigateByUrl(`/results`)
    } else if (this.resultItems.length !== index) {
      this.activeResultItem = this.resultItems[index]
      this.router.navigateByUrl(this.activeResultItem.routerLink.toString())
    } else {
      this.activeResultItem = this.resultItems[index - 1]
      this.router.navigateByUrl(this.activeResultItem.routerLink.toString())
    }
  }

  navigateToExploreTab() {
    this.router.navigateByUrl('/explore-statistics');
  }

  navigateToNewResults() {
    this.router.navigateByUrl(`/results/survival/${this._lastSuccessfulSurvival}`)
  }

  get items(): MenuItem[] {
    return this._items;
  }

  set items(value: MenuItem[]) {
    this._items = value;
  }

  get activeItem(): MenuItem {
    return this._activeItem;
  }

  set activeItem(value: MenuItem) {
    this._activeItem = value;
  }

  get resultItems(): MenuItem[] {
    return this._resultItems;
  }

  set resultItems(value: MenuItem[]) {
    this._resultItems = value;
  }

  get activeResultItem(): MenuItem {
    return this._activeResultItem;
  }

  set activeResultItem(value: MenuItem) {
    this._activeResultItem = value;
  }

  get isExplore(): boolean {
    return this._isExplore;
  }

  set isExplore(value: boolean) {
    this._isExplore = value;
  }

  get isExploreStatistics(): boolean {
    return this._isExploreStatistics;
  }

  set isExploreStatistics(value: boolean) {
    this._isExploreStatistics = value;
  }

  get isExploreResults(): boolean {
    return this._isExploreResults;
  }

  set isExploreResults(value: boolean) {
    this._isExploreResults = value;
  }

  get isAnalysis(): boolean {
    return this._isAnalysis
  }

  set isAnalysis(value: boolean) {
    this._isAnalysis = value
  }

  set isSurvivalRes(value: boolean) {
    this._isSurvivalRes = value
  }

  get isSurvivalRes(): boolean {
    return this._isSurvivalRes
  }

  get selectedSurvivalId(): Observable<number> {
    return this._selectedSurvivalId.asObservable()
  }

  get selectedSurvivalIDtoDelete(): Observable<number> {
    return this._selectedSurvivalIDtoDelete.asObservable();
  }

  get isResults(): boolean {
    return this._isResults;
  }

  set isResults(value: boolean) {
    this._isResults = value;
  }

}
