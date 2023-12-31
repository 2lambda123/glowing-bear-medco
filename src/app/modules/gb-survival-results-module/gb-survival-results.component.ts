/**
 * Copyright 2020 - 2021 CHUV
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Component, OnInit, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SelectItem } from 'primeng';
import { select, Selection } from 'd3';
import {SurvivalAnalysisClear} from '../../models/survival-analysis/survival-analysis-clear';
import {alphas, alphasReverseMap, CIs, SurvivalCurvesDrawing} from '../../utilities/rendering/survival-curves-drawing';
import {
  milestonedSummaryToTable,
  statTestToTable,
  summaryToTable
} from '../../utilities/rendering/table-format-for-pdf';
import {ErrorHelper} from '../../utilities/error-helper';
import {SurvivalSettings} from '../../models/survival-analysis/survival-settings';
import {summaryTable} from '../../utilities/survival-analysis/summary-table';
import {PDF} from '../../utilities/files/pdf';
import {clearResultsToArray, SurvivalCurve} from '../../models/survival-analysis/survival-curves';
import {SurvivalResultsService} from '../../services/survival-results.service';
import {ConfidenceInterval} from '../../models/survival-analysis/confidence-intervals';
import {NumericalTablesType} from '../../utilities/survival-analysis/numerical-tables';
import {NumericalMethodResult} from '../../models/survival-analysis/numerical-models/numerical-operation';


@Component({
  selector: 'gb-survival-results',
  templateUrl: './gb-survival-results.component.html',
  styleUrls: ['./gb-survival-results.component.css']
})
export class GbSurvivalResultsComponent implements OnInit {
  _id: number
  colorRange = colorRange
  advancedSettings = false
  _results: SurvivalAnalysisClear
  _inputParameters: SurvivalSettings
  _numericalTables: NumericalTablesType
  _survivalCurve: SurvivalCurve
  _curveNames: string[]
  _groupComparisons: SelectItem[]

  _selectedGroupComparison: {
    name1: string,
    name2: string,
    color1: string,
    color2: string,
    logrank: string,
    initialCount1: string,
    initialCount2: string,
    cumulatEvent1: string,
    cumulatEvent2: string,
    cumulatCensoring1: string,
    cumumlatCensoring2: string,
  }



  _activated = false

  _cols = ['Name', 'Value']
  _values = [{ name: 'log-rank', value: 0.9 }, { name: 'p-val', value: 0.85 }]

  _ic = CIs



  _alphas = alphas


  _groupLogrankTable: Array<Array<string>>
  _groupCoxRegTable: Array<Array<string>>
  _groupCoxWaldTable: Array<Array<string>>
  _groupCoxLogtestTable: Array<Array<string>>
  _groupTotalAtRisk: Array<string>
  _groupTotalEvent: Array<string>
  _groupTotalCensoring: Array<string>
  _margins = 10
  _svg: Selection<SVGGElement, unknown, HTMLElement, any>
  _drawing: SurvivalCurvesDrawing

  _groupTables: SelectItem[]
  selectedGroupTable: { legend: string, table: Array<Array<NumericalMethodResult>> }

  _summaryTableMileStones: number[]
  _summaryTable: { atRisk: number, event: number }[][]







  constructor(private elmRef: ElementRef, private activatedRoute: ActivatedRoute, private survivalResultsService: SurvivalResultsService) {
    this.survivalResultsService.id.subscribe(id => {
      let resAndSettingsAndTables = this.survivalResultsService.selectedSurvivalResult
      this.results = resAndSettingsAndTables.survivalAnalysisClear
      this.inputParameters = resAndSettingsAndTables.settings
      this.numericalTables = resAndSettingsAndTables.numericalTables

      this.display()
    })

    this._summaryTable = new Array<Array<{ atRisk: number, event: number }>>()
    this._summaryTableMileStones = new Array<number>()
  }

  ngOnInit() {

    this.display()

  }

  display() {
    // -- get the results
    this._survivalCurve = clearResultsToArray(this._results)
    this._curveNames = this._survivalCurve.curves.map(({ groupId }) => groupId)

    // -- remove previous svg
    let previous = select('#survivalSvgContainer svg')
    if (previous) {
      previous.remove()
    }

    // -- draw svg
    this._svg = select('#survivalSvgContainer').append('svg').attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '-40 -40 450 300')
      .attr('font-size', '8px')
      .attr('stroke-width', '1px')
      .append('g').attr('transform', `translate (${this._margins},${this._margins})`)
    this._drawing = new SurvivalCurvesDrawing(
      this._svg,
      this.survivalCurve,
      300,
      this._margins,
      160,
      300,
      this.inputParameters.timeGranularity
    )


    this._drawing._rectHeight = 6
    this._drawing.rectWidth = 1

    this._drawing.buildLines()
    this._drawing.drawCurves()

    // -- build tables
    this.setGroupComparisons()

    // -- build summary table
    this.updateSummaryTable()
  }

  setGroupComparisons() {

    /**
     *
     * Descriptions of wald test and loglikelihood tests used further in this function can be found at
     *
     * BUSE, A. The Likelihood Ratio, Wald, and Lagrange Multiplier Tests: An Expository Note.
     * The American Statistician, 1982, 36(3 Part 1), 153-157
     *
     */

    this._groupLogrankTable = new Array<Array<string>>()
    this._groupCoxRegTable = new Array<Array<string>>()
    this._groupCoxWaldTable = new Array<Array<string>>()
    this._groupTables = new Array<SelectItem>()
    this._groupTotalAtRisk = new Array<string>()
    this._groupTotalCensoring = new Array<string>()
    this._groupTotalEvent = new Array<string>()
    this._groupCoxLogtestTable = new Array<Array<string>>()
    let len = this.survivalCurve.curves.length
    this._groupComparisons = new Array<SelectItem>()

    for (let i = 0; i < len; i++) {
      let totalAtRisk: string
      let totalEvent: string
      let totalCensoring: string
      let points = this.survivalCurve.curves[i].points
      totalAtRisk = points[0].atRisk.toString()
      totalEvent = points[points.length - 1].cumulEvents.toString()
      totalCensoring = points[points.length - 1].cumulCensoringEvents.toString()

      this._groupTotalEvent.push(totalEvent)
      this._groupTotalCensoring.push(totalCensoring)
      this._groupTotalAtRisk.push(totalAtRisk)

    }
    this._groupTables.push(
      {
        label: 'Haenszel-Mantel LogRank p-value',
        value: { legend: 'Logrank p-value', table: this.numericalTables.groupLogrankTable }
      },
      {
        label: 'Cox regression proportional hazard ratio',
        value: { legend: 'Cox PH, [95% CI]', table: this.numericalTables.groupCoxRegTable }
      },
      {
        label: 'Cox regression Wald test p-value',
        value: { legend: 'Wald p-value', table: this.numericalTables.groupCoxWaldTable }
      },
      {
        label: 'Cox likelihood ratio p-value',
        value: { legend: 'Logtest p-vale', table: this.numericalTables.groupCoxLogtestTable }
      })

    this.selectedGroupTable = { legend: 'KM p-value', table: this.numericalTables.groupLogrankTable }
  }

  updateSummaryTable() {
    this._summaryTableMileStones = this._drawing.ticks
    this._survivalCurve.curves.forEach(({ points }, index) => {
      this._summaryTable[index] = summaryTable(points, this._summaryTableMileStones)
    })
  }

  exportSVG(event: Event) {
    let tables: { headers: string[][], data: string[][] }

    console.log('getting elements')

    let svg = this.elmRef.nativeElement.querySelector('#survivalSvgContainer svg')
    let can = this.elmRef.nativeElement.querySelector('#drawingconv')

    let pdfDoc = new PDF()

    pdfDoc.addImage(svg, can, -20, 0, 220, 120)
    pdfDoc.addOneLineText('Settings')
    tables = this.inputParameters.mainSettingsToTable()
    pdfDoc.addTableFromObjects(tables.headers, tables.data)
    if (this.inputParameters.subGroupTextRepresentations && this.inputParameters.subGroupTextRepresentations.length > 0) {
      pdfDoc.addOneLineText('Definitions of sub groups')
      tables = this.inputParameters.subGroupsToTable()
      pdfDoc.addTableFromObjects(tables.headers, tables.data)
    }
    if (this.selectedIc) {
      if (!this.selectedAlpha) {
        ErrorHelper.handleNewError('Unexpected error, alpha is not defined when confidence interval is.')
      }
      if (!alphasReverseMap.has(this.selectedAlpha)) {
        ErrorHelper.handleNewError('Unexpected error, the phi inverse function value has no alpha corresponding value. (phi refers to normal CDF)')
      }
      pdfDoc.addOneLineText('Curves confidence intervals')
      pdfDoc.addTableFromObjects(
        [['Transformation', 'Size (1 - alpha)']],
        [[this.selectedIc.description, `${alphasReverseMap.get(this.selectedAlpha)}`]],
      )

    }

    pdfDoc.addOneLineText('Summary')
    tables = summaryToTable(this.curveNames, this.groupTotalAtRisk, this.groupTotalEvent, this.groupTotalCensoring)
    pdfDoc.addTableFromObjects(tables.headers, tables.data)

    pdfDoc.addOneLineText('Summary at time point')
    tables = milestonedSummaryToTable(this.curveNames, this.summaryTableMileStones, this._summaryTable)
    pdfDoc.addTableFromObjects(tables.headers, tables.data)

    if (this.curveNames.length > 1) {
      pdfDoc.addOneLineText('Logrank')
      console.log(`Debug: curveNames length: ${this.curveNames.length}; groupLogrank length: ${this.groupLogrankTable}`)
      let numTables = statTestToTable(this.curveNames, this.numericalTables.groupLogrankTable)
      pdfDoc.addTableFromObjects(numTables.headers, numTables.data)
      pdfDoc.addContentText(numTables.logs)

      pdfDoc.addOneLineText('Cox regression coefficient')
      numTables = statTestToTable(this.curveNames, this.numericalTables.groupCoxRegTable)
      pdfDoc.addTableFromObjects(numTables.headers, numTables.data)
      pdfDoc.addContentText(numTables.logs)

      pdfDoc.addOneLineText('Cox regression wald test')
      numTables = statTestToTable(this.curveNames, this.numericalTables.groupCoxWaldTable)
      pdfDoc.addTableFromObjects(numTables.headers, numTables.data)
      pdfDoc.addContentText(numTables.logs)

      pdfDoc.addOneLineText('Logtest')
      numTables = statTestToTable(this.curveNames, this.numericalTables.groupCoxLogtestTable)
      pdfDoc.addTableFromObjects(numTables.headers, numTables.data)
      pdfDoc.addContentText(numTables.logs)
    }

    let exportDate = new Date(Date.now())
    pdfDoc.export(`ti4health_survival_analysis_${exportDate.toISOString()}.pdf`)
  }

  set id(i: number) {
    this._id = i
  }
  get id(): number {
    return this._id
  }
  set groupLogrankTable(table: string[][]) {
    this._groupLogrankTable = table
  }

  get groupLogrankTable(): string[][] {
    return this._groupLogrankTable
  }
  set groupCoxRegTable(table: string[][]) {
    this._groupCoxRegTable = table
  }

  get groupCoxRegTable(): string[][] {
    return this._groupCoxRegTable
  }
  set groupCoxWaldTable(table: string[][]) {
    this._groupCoxWaldTable = table
  }

  get groupCoxWaldTable(): string[][] {
    return this._groupCoxWaldTable
  }
  set groupCoxLogtestTable(table: string[][]) {
    this._groupCoxLogtestTable = table
  }

  get groupCoxLogtestTable(): string[][] {
    return this._groupCoxLogtestTable
  }
  set groupTotalAtRisk(risks: string[]) {
    this._groupTotalAtRisk = risks
  }
  get groupTotalAtRisk(): string[] {
    return this._groupTotalAtRisk
  }
  set groupTotalEvent(events: string[]) {
    this._groupTotalEvent = events
  }
  get groupTotalEvent(): string[] {
    return this._groupTotalEvent
  }
  set groupTotalCensoring(censoring: string[]) {
    this._groupTotalCensoring = censoring
  }
  get groupTotalCensoring(): string[] {
    return this._groupTotalCensoring
  }

  set results(res: SurvivalAnalysisClear) {
    this._results = res
  }

  set inputParameters(parameters: SurvivalSettings) {
    this._inputParameters = parameters
  }

  get inputParameters(): SurvivalSettings {
    return this._inputParameters
  }

  set numericalTables(tables: NumericalTablesType) {
    this._numericalTables = tables
  }

  get numericalTables(): NumericalTablesType {
    return this._numericalTables
  }

  get survivalCurve(): SurvivalCurve {
    return this._survivalCurve
  }

  get curveNames(): string[] {
    return this._curveNames
  }

  get groupTables(): SelectItem[] {
    return this._groupTables
  }



  set ic(ic) {
    this._ic = ic
  }
  get ic() {
    return this._ic
  }
  set alphas(alp) {
    this._alphas = alp
  }
  get alphas() {
    return this._alphas
  }

  set selectedIc(ci: ConfidenceInterval) {
    if (this._drawing) {
      this._drawing.selectedInterval = ci
      this._drawing.changeIntervals()
    }
  }
  get selectedIc(): ConfidenceInterval {

    return (this._drawing) ? this._drawing.selectedInterval : null

  }

  set selectedAlpha(alpha: number) {
    if (this._drawing) {
      this._drawing.alpha = alpha
      if (!alphasReverseMap.has(this.selectedAlpha)) {
        ErrorHelper.handleNewError('Unexpected error, the phi inverse function value has no alpha corresponding value. (phi refers to normal CDF)')
      }
      this._drawing.changeIntervals()
    }

  }
  get selectedAlpha(): number {
    return (this._drawing) ? this._drawing.alpha : null
  }

  get nofTicks(): number {
    return (this._drawing) ? this._drawing.nofTicks : null
  }

  set nofTicks(ticks: number) {
    if (this._drawing) {
      this._drawing.nofTicks = ticks
      this._drawing.changeGrid()
      this.updateSummaryTable()
    }
  }

  set grid(g: boolean) {
    if (this._drawing) {
      this._drawing.grid = g
      this._drawing.toggleGrid()
    }
  }

  get grid(): boolean {
    return (this._drawing) ? this._drawing.grid : null
  }

  get summaryTableMileStones(): number[] {
    return this._summaryTableMileStones
  }

  get summaryTable(): {
    atRisk: number;
    event: number;
  }[][] {
    return this._summaryTable
  }

}
export const colorRange = [
  '#ff4f4f',
  '#99f0dd',
  '#fa8d2d',
  '#5c67e6'
]
