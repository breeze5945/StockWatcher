import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ColDef ,GridApi, GridReadyEvent} from 'ag-grid-community'; // Column Definition Type Interface
import * as Highcharts from 'highcharts';
import { interval, Subscription } from 'rxjs';
import { SelectMultipleControlValueAccessor } from '@angular/forms';

interface stock {
  StockId?: string;
  StockName?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private gridApi!: GridApi<stock>;
  value = 0;
  loading = true;
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
  retrieveSuccess = false;
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
        name : '月營收變化',
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
    this.loadContent();

  }
  ngOnInit(): void {
    this.getSotockInfo()
    let url = "http://127.0.0.1:5000/data/getStockInfoReady";
    this.http.get<any>(url).subscribe(res => {
      console.log(res)
      console.log(res['stockInfoReady'])
      if ( res['stockInfoReady'] === "True" ) {
        this.readyToGetstockInfo = true;
      }
    });
  }
  loadContent() {
    this.loading = true;
    let retrieveSuccess = false
    const subs$: Subscription = interval(200).subscribe(res => {
      this.value = this.value + 10;
      if(this.stockInfoReady === true && this.readyToGetstockInfo === true ) {
        subs$.unsubscribe();
        this.loading = false;
        this.value = 0;
        console.log('Ha terminado');
      }
    });
  }
  async retrieveSotockInfo () {
    let url = "http://127.0.0.1:5000/data/sleep";
    this.http.get<any>(url).subscribe(res => {
      console.log(res)
      this.retrieveSuccess = true;
    });
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
      console.log(this.stockList)
      //this.gridApi.setRowData(this.stockList);
      this.stockInfoReady = true;
    });
  }
  setGripAttr() {
    if (this.gridApi) {
      this.gridApi.setRowData(this.stockList);
    }
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
          name : '月營收變化',
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
    this.setGripAttr();
  }
}
