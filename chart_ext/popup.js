// popup.js
const SYMBOLS = [
  "EURUSD", "GBPUSD", "AUDUSD", "NZDUSD",
  "USDJPY", "USDCAD", "USDCHF", "GOLD",
  "EURGBP", "EURJPY", "EURCHF", "EURAUD",
  "EURCAD", "EURNZD", "GBPJPY", "GBPCHF",
  "GBPAUD", "GBPCAD", "GBPNZD", "AUDJPY",
  "AUDCHF", "AUDNZD", "AUDCAD", "CADJPY",
  "CADCHF", "NZDJPY", "NZDCHF", "NZDCAD",
  "CHFJPY"
];

const getIndex = () => {
  let value = window.localStorage.getItem('index');
  if (!value) {
    value = 0;
  }
  return value;
}

const viewWidth = 450;

const setIndex = (index) => {
  window.localStorage.setItem('index', index);
}

let curIndex = getIndex();
let series = [];

document.addEventListener('DOMContentLoaded', function () {
  console.log('Popup loaded successfully!');
});

document.getElementById("prev").onclick = function (e) {
  prev();
  e.stopPropagation();
}

document.getElementById("next").onclick = function (e) {
  next();
  e.stopPropagation();
}

document.getElementById("pick").onclick = function (e) {
  takeShot();
  e.stopPropagation();
}

const keydown = (event) => {
  switch (event.keyCode) {
    case 37:
      prev();
      break;
    case 32:
    case 39:
      next();
      break;
    case 13:
      jump();
      break;
  }
}

document.addEventListener("keydown", keydown);

// document.getElementById("more").onclick = function (e) {
//   chrome.tabs.create({ url: "https://www.winfirm.com.cn" });
//   e.stopPropagation();
// }

const titleEle = document.getElementById("title");
titleEle.onclick = function (e) {
  jump();
  e.stopPropagation();
}

const jump = () => {
  let title = titleEle.innerText;
  console.log("title=" + title);
  chrome.tabs.create({ url: 'metatrader4://chart/' + title + 'm%23' });
}

const setTitle = (symbol) => {
  titleEle.innerHTML = symbol;
}

const show_candle = (chart, series, mainPriceOption, datas, priceScaleId) => {
  const candlestickSeries = chart.addCandlestickSeries({
    priceScaleId,
    touch: false,
    upColor: '#cc0000', downColor: '#33cc00', borderVisible: false,
    wickUpColor: '#cc0000', wickDownColor: '33cc00',
    priceFormat: {
      type: 'price',
      precision: 6
    }
  });

  candlestickSeries.priceScale().applyOptions(mainPriceOption);
  candlestickSeries.setData(datas);
  series.push(candlestickSeries);
}

const show_mas = (chart, series, datasma, colors, priceOption, priceScaleId) => {
  let lineSeries;
  for (let i = 0; i < datasma.length; i++) {
    lineSeries = chart.addLineSeries({
      priceScaleId,
      color: colors[i],
      lineWidth: 0.5,
      priceLineVisible: false,
      priceFormat: {
        type: 'price',
        precision: 6
      }
    });
    lineSeries.priceScale().applyOptions(priceOption);
    lineSeries.setData(datasma[i]);
    series.push(lineSeries);
  }
}

const show_histogram = (chart, series, histogram, priceOption, priceScaleId) => {
  let histogramSeries = chart.addHistogramSeries({
    priceScaleId,
    color: '#33cc00',
    priceLineVisible: false,
    priceFormat: {
      type: 'volume',
      precision: 6
    }
  });

  histogramSeries.priceScale().applyOptions(priceOption);
  histogramSeries.setData(histogram);
  series.push(histogramSeries);
}

const show_chart = (chart, series, datas, time) => {
  if (series.length > 0) {
    let i = 0;
    let item;
    while (i < series.length) {
      item = series.pop();
      if (item) {
        chart.removeSeries(item);
      }
    }
  }

  const mainPriceOption = {
    scaleMargins: {
      top: 0.05,
      bottom: 0.3
    },
  };

  show_candle(chart, series, mainPriceOption, datas.datas, '');

  let colors = time == 'D1' ? ['#ffffff', '#cc0000', '#0066ff'] : ['#0066ff', '#0066ff', '#0066ff', '#0066ff', '#0066ff']
  show_mas(chart, series, datas.mas, colors, mainPriceOption, '');
  show_mas(chart, series, datas.bolling, ['#cc0000', '#33cc00'], mainPriceOption, '');

  const macdPriceOption = {
    scaleMargins: {
      top: 0.72,
      bottom: 0.02
    },
  };

  show_histogram(chart, series, datas.macds[2], macdPriceOption, 'macd');
  let macd = datas.macds[0];
  let signal = datas.macds[1];
  show_mas(chart, series, [macd, signal], ['#ffffff', '#ff0000'], macdPriceOption, 'macd');
}

const timestampToString = (timestamp) => {
  const date = new Date(timestamp * 1000);
  const Y = date.getFullYear() + '-';
  const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
  const D = date.getDate() + ' ';
  const h = date.getHours() + ':';
  const m = date.getMinutes()
  return M + D + h + m;
}

const getChartOption = (height, color, barSpacing) => {
  let width = viewWidth;//(window.screen.width +1);
  return {
    width,
    height,
    timeScale: {
      rightOffset: 5,
      barSpacing: barSpacing,
      rightBarStaysOnScroll: true,
      fixLeftEdge: false,
      alignLabels: false,
      lockVisibleTimeRangeOnResize: true,
      borderVisible: false,
      visible: false,
      tickMarkFormatter: (time, tickMarkType, locale) => {
        if (LightweightCharts.isUTCTimestamp(time)) {
          return timestampToString(time);
        } else {
          return time;
        }
      },
    },
    rightPriceScale: {
      visible: false,
    },

    layout: {
      textColor: 'black',
      background: { type: 'solid', color: color }
    },
    localization: {
      locale: 'en-US',
      dateFormat: 'yyyy/MM/dd',
      timeFormatter: businessDayOrTimestamp => {
        if (LightweightCharts.isUTCTimestamp(businessDayOrTimestamp)) {
          return timestampToString(businessDayOrTimestamp);
        } else {
          return businessDayOrTimestamp;
        }
      }
    },
    grid: {
      vertLines: {
        color: 'rgba(105 , 105 , 105 , 0.2)',
      },
      horzLines: {
        color: 'rgba(105  , 105  , 105  , 0.2)',
      }
    },
    crosshair: {
      mode: 2,
      vertLine: {
        visible: false
      },
      horzLine: {
        visible: false
      }
    },
    handleScroll: {
      horzTouchDrag: false,
      vertTouchDrag: false,
    }
  };
}

const prev = () => {
  if (curIndex > 0) {
    curIndex--;
  } else {
    curIndex = SYMBOLS.length - 1;
  }
  setIndex(curIndex);
  request();
}

const next = () => {
  if (curIndex < SYMBOLS.length - 1) {
    curIndex++;
  } else {
    curIndex = 0;
  }
  setIndex(curIndex);
  request();
}

const chart = LightweightCharts.createChart(document.getElementById("chart"), getChartOption(300, '#222222', 4.75));

const loadDatas = (symbol) => {
  fetch("https://api.winfirm.com.cn/datas/klines/" + symbol + "m%23")
    .then(res => {
      return res.json();
    }).then(datas => {
      setTitle(symbol);
      show_chart(chart, series, datas.datas1, 'D1');
    }).catch(e => {
      console.log(e)
    });
}

const request = () => {
  let symbol = SYMBOLS[curIndex];
  setTitle(symbol);
  loadDatas(symbol);
}

const getFileName=(date)=>{
  return date.getFullYear()+''+alignTime(date.getMonth()+1)+''+alignTime(date.getDate())
  +''+alignTime(date.getHours())+''+alignTime(date.getMinutes())+''
  +alignTime(date.getSeconds());
}

const alignTime=(num)=>{
  if(num<10){
    return '0'+num;
  }
  return num;
}

const takeShot=()=>{
  let fileName = 'shot_'+getFileName(new Date())+".jpg";

  chart.takeScreenshot().toBlob(function(blob){
    var downloadUrl = URL.createObjectURL(blob);
    const link =document.createElement('a');
    link.style.display='none';
    link.href=downloadUrl;
    link.download=fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, 'image/jpeg',1.0);

  let chartEle = chart.takeScreenshot();
  let base64 = chartEle.toDataURL('jpeg',1.0); //get a base64 image string
  uploadShot(fileName,base64);
}

const uploadShot=(fileName,base64)=>{
  fetch("https://api.winfirm.com.cn/datas/upload_pic", {
    method:'post',
    headers: {
      'Content-Type':'application/json'
    },
    body:JSON.stringify({"name":fileName, "data": base64})
  })
  .then(res => {
    return res.json();
  }).then(datas => {
    console.log(datas);
  }).catch(e => {
    console.log(e)
  });
}

//load default
request();