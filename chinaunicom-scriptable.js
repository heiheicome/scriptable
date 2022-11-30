
/**
 * 中国联通信息展示和自动签到
 * 模拟从手机端打开，防止cookie过期的问题
 * 
 * 2022-11-30 11:24:26
 *
 */

const files = FileManager.local();
/**
 * 修改为你的 cookie，cookie 获取方法，需在联通客户端中进行抓包
 *
 * 为方便多手机号使用多个组件 则多复制脚本
 */

// 格式化时间 
Date.prototype.Format = function(fmt) { 
    let o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (
            ("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}


var onlineTime = new Date().Format('yyyy-MM-dd hh:mm:ss');//2022-11-29 08:58:57
var onlineBody = ''

let conf = {
  phone: '', /** 手机号 */
  clientCookie: '',/** m.client.10010.com API cookie */
  actionCookie: '',/** act.10010.com API cookie  */
  onlineCookie: '',//onLine_url
};
const Tel = conf.phone;
//ua001，ua002  一定要修改成自己的  这也就是为什么你的cookie没几天就过期，以及为什么不能打开联通app的原因
const ua001 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 unicom{version:iphone_c@9.0201}';//act.10010.com
const ua002 = 'ChinaUnicom.x CFNetwork iOS/16.1 unicom{version:iphone_c@9.0201}';//m.client.10010.com
const URL_yours = 'https://m.client.10010.com/mobileserviceimportant/home/queryUserInfoSeven?version=iphone_c@9.0201&desmobiel=' + Tel + '&showType=0';
const onLine_url = 'https://m.client.10010.com/mobileService/onLine.htm'
const clientCookie = conf.clientCookie;
const Cookie = conf.actionCookie;
const onlineCookie = conf.onlineCookie;
const ringStackSize = 61; // 圆环大小
const ringTextSize = 11; // 圆环中心文字大小
const creditTextSize = 13; // 话费文本大小
const mlTextSize = 12; //免流文字大小
const my_flow = 214800;//自带流量mb
const my_voice = 700;//自带语音
const databgColor = new Color('22976B', 0.3); // 流量环背景颜色
const datafgColor = new Color('22976B'); // 流量环前景颜色
const dataTextColor = Color.dynamic(Color.black(), Color.white());
const voicebgColor = new Color('F86527', 0.3); // 语音环背景颜色
const voicefgColor = new Color('F86527'); // 语音环前景颜色


const dataSfs = SFSymbol.named('antenna.radiowaves.left.and.right');
dataSfs.applyHeavyWeight();
const dataIcon = dataSfs.image;
const canvSize = 178;
const canvas = new DrawContext();
const canvWidth = 18;
const canvRadius = 80;
const widget = new ListWidget();
// widget.url = 'chinaunicom://';
widget.setPadding(16, 16, 16, 16);

/***********onLine****************/
const onLine = async () => {
  const headers = {
    'User-Agent': ua002
  };
  // const url = 'http://192.168.123.5/june';
  const req = new Request(onLine_url);
  req.method = 'POST';
  req.headers = {
    ...headers,
    cookie: onlineCookie
  };
  req.body = onlineBody
  try{
    const data = await req.loadJSON();
    console.log('登陆成功')
  }catch(e){
    console.log('登陆失败')
  }

};



 

const main = async () => {
  if (config.runsInWidget) {
    await render();
    return
  }

  const actions = ['Preview', 'Update'];
  const alert = new Alert();
  alert.message = 'Preview the widget or update the script. Update will override the whole script.';
  for (const action of actions) {
    alert.addAction(action);
  }
  alert.addCancelAction('Cancel');
  const index = await alert.presentSheet();
  switch (actions[index]) {
    case 'Preview':
      render();
      break
    case 'Update':
      console.log('运行成功0 ')
      break
  }
};
const getImage = async (url) => {
  const request = new Request(url);
  const image = await request.loadImage();
  return image
};

const render = async () => {
  // 模拟打开手机app
  const online = await onLine()
  const data = await getData();
  const mlData = await get_mlData();
  /** [话费, 流量, 语音] */
  const [phoneData, credit, voice] = data.data.dataList;
  //await setBackground();

  const { signinState, _state } = data;
  const status = _state === 'expired'
    ? 'failed'
    : _state === 'signin_failed'
      ? 'warning'
      : signinState === '1'
        ? 'waiting'
        : 'success';
  await renderLogo(status);
  await renderBalance(phoneData.number);
  await renderML( mlData.summary.freeFlow );
  await renderArcs(credit, voice);

  if (!config.runsInWidget) {
    await widget.presentSmall();
  }
  Script.setWidget(widget);
  Script.complete();
};




/**
 * 联通 Logo 显示
 * @param {'waiting'|'success'|'warning'|'failed'} status
 */
const renderLogo = async (status) => {
  const stackStatus = widget.addStack();
  stackStatus.addSpacer();
  const iconStatus = stackStatus.addImage(SFSymbol.named('circle.fill').image);
  iconStatus.imageSize = new Size(6, 6);
  const colors = {
    waiting: Color.gray(),
    success: Color.green(),
    warning: Color.orange(),
    failed: Color.red()
  };
  iconStatus.tintColor = colors[status];
  const cuIconUrl = 'https://jun.fly.dev/imgs/chinaunicom.png';
  const headerStack = widget.addStack();
  headerStack.addSpacer();
  const logo = headerStack.addImage(await getImage(cuIconUrl));
  logo.imageSize = new Size(393 * 0.25, 118 * 0.25);
  headerStack.addSpacer();
  widget.addSpacer();
};

/** 余额显示 */
const renderBalance = async (balance) => {
  const stack = widget.addStack();
  stack.centerAlignContent();
  stack.addSpacer();
  const elText = stack.addText( " ¥"  +  balance);
  elText.textColor = dataTextColor;
  elText.font = Font.mediumRoundedSystemFont(creditTextSize);
  stack.addSpacer();
  widget.addSpacer();
};




/** ml显示 */
const renderML = async (ml) => {
  const stack = widget.addStack();
  stack.centerAlignContent();
  stack.addSpacer();
  /*ml 修改单位 mb-gb*/
  var m = parseFloat(ml)
  if (m > 1024) {
    m = parseFloat(m / 1024).toFixed(2) + ' GB'
  }else{
    m = m + ' MB'
  }
  const elText = stack.addText( "免: "  +  m);
  elText.textColor = dataTextColor;
  elText.font = Font.mediumRoundedSystemFont(mlTextSize);
  stack.addSpacer();
  widget.addSpacer();
};

const renderArcs = async (flowData, voiceData) => {
  const bodyStack = widget.addStack();
  bodyStack.layoutVertically();

  canvas.size = new Size(canvSize, canvSize);
  canvas.opaque = false;
  canvas.respectScreenScale = true;



 const patt = new RegExp('剩余')
 const mmm = parseFloat(flowData.number);
 if (flowData.remainTitle.match(patt)) {
  //如果  反回的是 剩余流量   不需要计算
    console.log('  反回的是 剩余流量   ')
       if(flowData.unit.match(/MB/g)){//  如果返回的单位MB 
         var dataGap = (mmm/my_flow * 100 )* 3.6;
       }else{//如果返回 单位 GB   转换成mb
         console.log('返回的单位是 GB')
          var dataGap = (mmm*1024/my_flow * 100 )* 3.6;
          console.log(dataGap)
       }
  
 }else{//如果  反回的是 使用流量   需要计算 剩余

    console.log('  反回的是 使用流量   ')
       if(flowData.unit.match(/MB/g)){//  如果返回的单位MB 
         var dataGap = (100 - mmm/my_flow * 100 )* 3.6;
       }else{//如果返回 单位 GB   转换成mb
          var dataGap = (100 - mmm*1024/my_flow * 100 )* 3.6;
       }
   
 }
  





  const voiceGap = (voiceData.number/my_voice)*100 *3.6;
// console.log(voiceData)

  drawArc(dataGap, datafgColor, databgColor);
  const ringStack = bodyStack.addStack();
  const ringLeft = ringStack.addStack();
  ringLeft.layoutVertically();
  ringLeft.size = new Size(ringStackSize, ringStackSize);
  ringLeft.backgroundImage = canvas.getImage();
  await ringContent(ringLeft, dataIcon, datafgColor, flowData.number, flowData.unit);
  ringStack.addSpacer();

  drawArc(voiceGap, voicefgColor, voicebgColor);
  const ringRight = ringStack.addStack();
  ringRight.layoutVertically();
  ringRight.size = new Size(ringStackSize, ringStackSize);
  ringRight.backgroundImage = canvas.getImage();
  await ringContent(
    ringRight,
    SFSymbol.named('phone.fill').image,
    voicefgColor,
    voiceData.number,
    voiceData.unit
  );
};

function sinDeg (deg) {
  return Math.sin((deg * Math.PI) / 180)
}

function cosDeg (deg) {
  return Math.cos((deg * Math.PI) / 180)
}

function ringContent (widget, icon, iconColor, text, unit) {
  const rowIcon = widget.addStack();
  rowIcon.addSpacer();
  const iconElement = rowIcon.addImage(icon);
  iconElement.tintColor = iconColor;
  iconElement.imageSize = new Size(12, 12);
  iconElement.imageOpacity = 0.7;
  rowIcon.addSpacer();

  widget.addSpacer(1);

  const rowText = widget.addStack();
  rowText.addSpacer();
  const textElement = rowText.addText(text);
  textElement.textColor = dataTextColor;
  textElement.font = Font.mediumSystemFont(ringTextSize);
  rowText.addSpacer();

  const rowUnit = widget.addStack();
  rowUnit.addSpacer();
  const unitElement = rowUnit.addText(unit);
  unitElement.textColor = dataTextColor;
  unitElement.font = Font.boldSystemFont(8);
  unitElement.textOpacity = 0.5;
  rowUnit.addSpacer();
}

function drawArc (deg, fillColor, strokeColor) {
  const ctr = new Point(canvSize / 2, canvSize / 2);
  const bgx = ctr.x - canvRadius;
  const bgy = ctr.y - canvRadius;
  const bgd = 2 * canvRadius;
  const bgr = new Rect(bgx, bgy, bgd, bgd);

  canvas.setFillColor(fillColor);
  canvas.setStrokeColor(strokeColor);
  canvas.setLineWidth(canvWidth);
  canvas.strokeEllipse(bgr);

  for (let t = 0; t < deg; t++) {
    const rectX = ctr.x + canvRadius * sinDeg(t) - canvWidth / 2;
    const rectY = ctr.y - canvRadius * cosDeg(t) - canvWidth / 2;
    const rectR = new Rect(rectX, rectY, canvWidth, canvWidth);
    canvas.fillEllipse(rectR);
  }
}


/***********get  ml****************/
const get_mlData = async () => {
  const cachePath = files.joinPath(files.documentsDirectory(), 'ml-tst');  
  const headers = {
    'User-Agent': ua001
  };
  const url = 'https://m.client.10010.com/servicequerybusiness/operationservice/queryOcsPackageFlowLeftContentRevisedInJune';
  // const url = 'http://192.168.123.5/june';
  const req = new Request(url);
  req.method = 'POST';
  req.headers = {
    ...headers,
    cookie: clientCookie
  };
  try {
    const data = await req.loadJSON();
    console.log('ml信息请求成功 => ');
    //写入缓存
    //console.log(data)
    data._state = 'approved'; // 正常通过请求
    files.writeString(cachePath, JSON.stringify(data));
    return data
  } catch (e) {
    const data = JSON.parse(files.readString(cachePath));
    data._state = 'expired'; // 缓存的数据
    console.warn('=== ml数据请求失败，使用缓存数据 ===');
    console.warn(e);
    return data
  }
};





const getData = async () => {
  const cachePath = files.joinPath(files.documentsDirectory(), 'China');
  // const url = 'https://m.client.10010.com/mobileserviceimportant/home/queryUserInfoSeven?version=iphone_c@9.0201&desmobiel=' + Tel + '&showType=0';
  const url = URL_yours;
  // const url = 'http://192.168.123.5/data';
  const req = new Request(url);
  req.headers = {
    'User-Agent': ua002,
    cookie: clientCookie
  };
  try {
    const data = await req.loadJSON();
    console.log('余额信息请求成功 => ');
    // console.log(data)
    if (data.code === 'Y') {
      data._state = 'approved'; // 正常通过请求
      files.writeString(cachePath, JSON.stringify(data));
    } else {
      throw data.message
    }
    if (data.signinState === '1') {
      // case '0'：已签到；'1'：未签到
      const url1 = 'https://act.10010.com/SigninApp/signin/daySign';
      const req1 = new Request(url1);
      req1.headers = {
        "User-Agent": ua001,
        cookie: Cookie,
        Host: 'act.10010.com'
      };
      try {
        const data1 = await req1.loadJSON();
        console.log('签到信息请求成功 => ');
        // console.log(data1)
        if (data1.status === '0000' || (data1.msg || '').includes('已经签到')) {
          data.signinState = '0';
        } else {
          throw data1.msg
        }
      } catch (e) {
        console.warn('=== 签到失败 ===');
        console.warn(e);
        data._state = 'signin_failed'; // 签到失败的
      }
    }
    return data
  } catch (e) {
    const data = JSON.parse(files.readString(cachePath));
    data._state = 'expired'; // 缓存的数据
    console.warn('=== 余额数据请求失败，使用缓存数据 ===');
    console.warn(e);
    return data
  }
};

await main();
