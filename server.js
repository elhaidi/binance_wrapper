const fetch = require('isomorphic-fetch');
require('es6-promise').polyfill();


const BASE = 'https://api.binance.com'

// Function for creating suqery string from json object
const makeQueryString = q =>{
    q
    ? `?${Object.keys(q)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(q[k])}`)
        .join('&')}`
: '';
}
  

/**
 * Return a promise that will be used after fetching from the biannace API
 * It also handle the errors and handle the data as json object
 * The return type is a promise
 */

const sendResult = call =>
  call.then(res => Promise.all([res, res.json()])).then(([result, jason]) => {
    if (!result.ok) {
      const error = new Error(jason.msg || `${result.status} ${result.statusText}`)
      error.code = jason.code
      throw error
    }
    return jason
})

/*
 * This function is used for calling the puclic End Point for the API.
 * 
 */

const publicCall = (path, data, method = 'GET', headers = {}) =>{
    if (data === undefined) url = `${BASE}/api${path}`;
    else url= `${BASE}/api${path}${makeQueryString(data)}`;  
    return sendResult(
    
        fetch(url, {
        method,
        json: true,
        headers,
        }), 
)
    }




const checkParams = (name, payload, requires = []) => {
  if (!payload) {
          throw new Error('You need to pass a payload object.')
  }
      
  requires.forEach(r => {
    if (!payload[r] && isNaN(payload[r])) {
      throw new Error(`Method ${name} requires ${r} parameter.`)
    }
  })
      
  return true
}











/**
 * All the function for the public EndPoint 
 * are defined here
 * 
 */


 const ping = () => publicCall('/v1/ping').then(res=>console.log(res))
    
// Retrun the server time

const time = () => publicCall('/v1/time').then(res=>console.log(res));


/**
 * Current exchange trading rules and symbol information
 */
const exchangeInfo = () => publicCall('/v1/exchangeInfo').then(res=>console.log(res))



/**
 * 
 * Market data Endpoints : Order Book
 */
const book = payload =>
  checkParams('book', payload, ['symbol']) &&
  publicCall('/v1/depth', payload).then(({ lastUpdateId, asks, bids }) => ({
    lastUpdateId,
    asks: asks.map(a => zip(['price', 'quantity'], a)),
    bids: bids.map(b => zip(['price', 'quantity'], b)),
}))



/**
 * Market Data Endpoints : Compressed/Aggregate trades list
 * Get compressed, aggregate trades. Trades that fill at 
 * the time, from the same order, with the same price will 
 * have the quantity aggregated.
 */
const aggTrades = payload =>
  checkParams('aggTrades', payload, ['symbol']) &&
  publicCall('/v1/aggTrades', payload).then(trades =>
    trades.map(trade => ({
      aggId: trade.a,
      price: trade.p,
      quantity: trade.q,
      firstId: trade.f,
      lastId: trade.l,
      timestamp: trade.T,
      isBuyerMaker: trade.m,
      wasBestPrice: trade.M,
    })),
)





/** 
 * Market Data Endpoints : Kline/candlestick bars for a symbol. Klines are uniquely identified by their open time.
*/
const candles = payload =>
  checkParams('candles', payload, ['symbol']) &&publicCall('/v1/klines', { interval: '5m', ...payload })
  .then(candles =>
    candles.map(candle => zip(candleFields, candle)),
  )

/**
 * 
 * Market Data Endpoints : Get recent trades (up to last 500).
 */
const trades = payload => checkParams('trades', payload, ['symbol']) && publicCall('/v1/trades', payload)


/**
 * 
 * Market Data Endpoints : 24 hour price change statistics. Careful when accessing this with no symbol.
 */
const dailyStats = payload => publicCall('/v1/ticker/24hr', payload)



/**
 * 
 * Market Data Endpoints : Get prices of all coin
 */
const prices = () => publicCall('/v1/ticker/allPrices')
                    .then(r => r.reduce((out, cur) => ((out[cur.symbol] = cur.price), out), {}),)
