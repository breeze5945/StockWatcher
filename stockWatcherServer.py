import subprocess, time, sys, string, os
import pandas as pd
import requests
from io import StringIO
import time, datetime
import matplotlib.pyplot as plt
from flask import Flask, request
from flask_cors import CORS
import json
app = Flask(__name__)
CORS(app)
stockData = {}
#print(pyautogui.position())

#i = 0
#while (i <= 715):
#   pyautogui.click(x=-757, y=573)
#    pyautogui.press('F')
#    time.sleep(4)
#    print(i)
#    i += 1

#print("Done")
def monthly_report(year, month):
    
    # 假如是西元，轉成民國
    if year > 1990:
        year -= 1911
    
    url = 'https://mops.twse.com.tw/nas/t21/sii/t21sc03_'+str(year)+'_'+str(month)+'_0.html'
    if year <= 98:
        url = 'https://mops.twse.com.tw/nas/t21/sii/t21sc03_'+str(year)+'_'+str(month)+'.html'
    
    # 偽瀏覽器
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'}
    
    # 下載該年月的網站，並用pandas轉換成 dataframe
    r = requests.get(url, headers=headers)
    r.encoding = 'big5'

    dfs = pd.read_html(StringIO(r.text), encoding='big-5')

    df = pd.concat([df for df in dfs if df.shape[1] <= 11 and df.shape[1] > 5])
    
    if 'levels' in dir(df.columns):
        df.columns = df.columns.get_level_values(1)
    else:
        df = df[list(range(0,10))]
        column_index = df.index[(df[0] == '公司 代號')][0]
        df.columns = df.iloc[column_index]
    
    df['當月營收'] = pd.to_numeric(df['當月營收'], 'coerce')
    df = df[~df['當月營收'].isnull()]
    df = df[df['公司 代號'] != '合計']
    
    # 偽停頓
    time.sleep(5)
    df = df.sort_values(by='公司 代號')

    
    return df
@app.route('/data/getAllStockId', methods=['GET'])
def getstockId():
    data = {}
    n_days = 1
    now = datetime.datetime.now()
    year = now.year
    month = now.month
    stockInfo = {}
    while len(data) < n_days:
        # 使用 crawPrice 爬資料
        try:
            print('parsing', year, month)
            print('%d-%d-01'%(year, month))
            data = monthly_report(year, month)

        except Exception as e:
            print('get 404, please check if the revenues are not revealed')
        
        # 減一個月
        month -= 1
        if month == 0:
            month = 12
            year -= 1

        time.sleep(10)
    stockId = ''
    stockName = ''
    for index, row in data.iterrows():
        stockId = row['公司 代號']
        stockName = row['公司名稱']
        if stockId == "全部國內上市公司合計":
            continue
        stockInfo[stockId] = stockName

    StockInfo = json.dumps(stockInfo)
    print("getstockId finished ... ")
    return StockInfo
@app.route('/data/sleep', methods=['GET'])
def stocksleep():
    time.sleep(5)
    return {'stocksleep': "True"}
@app.route('/data/stockRevenue', methods=['GET','POST'])
def stock_report():
    stockId = ""
    data = request.get_json()
    stockId = data['stockId']
    stockRevenue = stockData[stockId]
    print(stockRevenue)

    print("retrieved selectd stock revenue finished ... ")
    return stockRevenue

@app.route('/data/getStockInfoReady', methods=['GET'])
def getstockRevenue():
    data = {}
    n_days = 12
    now = datetime.datetime.now()
    year = now.year
    month = now.month
    stockId = ""
    while len(data) < n_days:
        # 使用 crawPrice 爬資料
        try:
            print('parsing', year, month)
            print('%d-%d-01'%(year, month))
            data['%d-%d-01'%(year, month)] = monthly_report(year, month)

        except Exception as e:
            print('get 404, please check if the revenues are not revealed')
        
        # 減一個月
        month -= 1
        if month == 0:
            month = 12
            year -= 1

        time.sleep(10)
    for k in data.keys():
        data[k].index = data[k]['公司 代號']
        
    df = pd.DataFrame({k:df['當月營收'] for k, df in data.items()}).transpose()
    df.index = pd.to_datetime(df.index)
    df = df.sort_index()

    for key in df.keys():
        print(key)
        stockId = df[key]
        print(stockId)
        stockRevenue = {}
        for index in df.index:
            print(index)
            print(df[key][index])
            # format specification
            format = '%Y-%m-%d'
            curTime = index.strftime(format)
            stockRevenue[curTime] = df[key][index]
        StockRevenue = json.dumps(stockRevenue)
        print(StockRevenue)
        stockData[key] = StockRevenue

    print("getstockRevenue finished ... ")
    return {'stockInfoReady': "True"}

#image = df['1101'].plot()
#fig = image.get_figure()
#fig.savefig('figure.png')
#stockdf = (monthly_report(2023,12))
#filename = f'./data/Stock.csv'
#stockdf.to_csv(filename, index=False, encoding='utf-8-sig')

if __name__ == '__main__':
    #df = getstockId()
    #pd.read_json(df).to_excel("output.xlsx")
    #getstockRevenue()
    app.run()