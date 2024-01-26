import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ColDef ,GridApi, GridReadyEvent} from 'ag-grid-community'; // Column Definition Type Interface
import * as Highcharts from 'highcharts';

interface stock {
  StockId?: string;
  StockName?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private gridApi!: GridApi<stock>;
  loading = false;
  title = 'Stock Watcher';
  name = '';
  content = '';
  modules = '';
  stockList: stock[] = [];
  stockInfoReady: boolean = false;
  stockRevenue:number [] = [];
  readyToGetstockInfo: boolean = false;
  themeClass ="ag-theme-quartz";
  frameworkComponents: any;
  updateFlag = false;
  Highcharts: typeof Highcharts = Highcharts;
  data = [1,2,3,4,5,6,7,8,1,2,3,4]
  chartOptions: Highcharts.Options = {
    chart: {
       type: "spline"
    },
    title: {
       text: "2023股票月營收變化"
    },
    subtitle: {
       text: "Source: https://mops.twse.com.tw"
    },
    xAxis:{
       categories:["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    yAxis: {
       title:{
          text:"Unit : Million"
       }
    },
    tooltip: {
       valueSuffix:" M"
    },
    series: [
       {
        type: 'spline',
        data: this.data
       }
    ]
 };

  public rowSelection: 'single' | 'multiple' = 'single';
  selectedRows: stock[] = [];
  colDefs: ColDef[] = [
    { field: "StockId" },
    { field: "StockName"}
  ];
  rowData: stock[] = [];

  constructor(private http: HttpClient) {
  }



  getSotockInfo () {
    let url = "http://127.0.0.1:5000/data/getAllStockId";
    this.http.get<any>(url).subscribe(res => {
      console.log(res)
      const keys = Object.keys(res);
      for (let i = 0; i < keys.length; i++) {
        let key: string = keys[i] as string;
        let stockObject: stock = {
           StockId: key, StockName: res[key] ,
        };

        this.stockList.push(stockObject);
      }
      this.gridApi.setGridOption('rowData', this.stockList);
    });
  }
  getSotockRevenue () {
    let url = "http://127.0.0.1:5000/data/stockRevenue";
    let requestBody = {
      'stockId' : this.selectedRows[0].StockId
    };
    console.log(requestBody)
    this.http.post<any>(url, requestBody).subscribe(res => {
      const values = Object.values(res);
      let revenue:number [] = [];
      for (let i = 0; i < values.length; i++) {
        let value: number = values[i] as number;
        console.log(value)
        revenue.push(value)
      }
      this.stockRevenue = revenue
      this.chartOptions.series = [{
           type: 'spline',
           data: this.stockRevenue
      }]
      this.updateFlag = true;

      console.log(res)
    });
  }
  handleUpdate() {
    this.chartOptions.title =  {
      text: 'updated'
    };

    this.chartOptions.series = [{
      type: 'spline',
      data: [...this.data].reverse()
    }];
    this.updateFlag = true;


  }
  onSelectionChanged(params: GridReadyEvent<stock>) {
    this.selectedRows = this.gridApi.getSelectedRows();
    (document.querySelector('#selectedRows') as any).innerHTML =
      this.selectedRows.length === 1 ? this.selectedRows[0].StockId : '';

    if (this.selectedRows.length === 1) {
      this.getSotockRevenue()
    }
  }

  onGridReady(params: GridReadyEvent<stock>) {
    this.gridApi = params.api;
  }
}
