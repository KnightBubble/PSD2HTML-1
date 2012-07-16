/**
 * @author: wuming.xiaowm
 * @date : 6/24 2012
 * @description: HTML元素解析
 */

// @include "css.jsx"

/**
 * 解析文本 
 * @param {Object} item
 */
page.element = function(data){
	this.cssMap = {};//用于去除相同的Css
	this.item = data;
	return this.getTextElement();
};

page.element.prototype.getTextElement = function(){
	var element = "",
		item = this.item,
		content = '';
	
	switch(item.tag){
		case "img":
			element = this.img();
			break;
		case "text":
			element = this.text();
			break;
	}
	
	return element;
	
};

/**
 * 图片图层 
 */
page.element.prototype.img = function(){
	//显示所有文本图层
	page.psd.visibleTextLayers();
	
	var elm = null,
		img = new XML('<img />'),
		psdImgObj = page.getPsdImg(this.item.top,this.item.right,this.item.bottom,this.item.left);
	img['@src'] = 'slices/'+psdImgObj.imgObject.name;
	img['@width'] = this.item.width;
	img['@height'] = this.item.height;
	img['@border'] = '0';
	if(page.option.builder != "normal"){
		img['@style'] = 'display:block;';
	}
	
	
	//隐藏所有文本图层
	page.psd.hiddenTextLayers();
	
	if(typeof(this.item.link) != 'undefined'){
		elm = new XML('<a></a>');
		elm['@href'] = this.item.link.href;
		elm.appendChild(img);
	}else{
		elm = img;
	}
	var styleCss ='width:'+this.item.width+'px;height:'+this.item.height+'px;';
	if(page.option.builder == "normal"){
		var cssName = "style"+page.option.i;
		styleCss += 'top:'+this.item.top+'px;left:'+(this.item.left - (page.option.width - 952) / 2)+'px;display:block;';
		elm['@class'] = cssName+" absolute";
		
		
		page.option.styleCss.appendChild(new XML('.'+cssName+'{'+styleCss+'}'));
		
	}else{
		elm['@style'] = styleCss;
	}
	return elm;
};

/**
 * 文本图层 
 */
page.element.prototype.text = function(){
	var elm = new XML('<div class=""></div>'),
		overValue = this.item.textInfo.contents.indexOf('\r\n')>-1 ? 2:1,
		textSize = 0,
		textRange = this.item.textInfo.textRange,
		textContents = this.item.textInfo.contents,
		pObj = textContents.split('\r');
	
	//如果有链接
	if(typeof(this.item.link) != 'undefined'){
		elm = new XML('<a></a>');
		elm['@href'] = this.item.link.href;
	}
	
	//Css
	var styleCss = new page.css(this.item);
	if(page.option.builder == "normal"){
		var cssName = 'style'+ page.option.i;
		elm['@class'] = "each "+cssName;
		page.option.styleCss.appendChild('.'+cssName+'{'+styleCss.join(";")+';}');
	}else{
		styleCss.push("overflow:hidden;");
		elm['@style'] = styleCss.join(';');
	}	
	
	//如歌没有换行和空格、行内样式，直接返回
	if(textRange.length == 1 && textContents.indexOf('\r') == -1 && textContents.indexOf(' ') == -1){
		elm.appendChild(textContents);
		return elm;
	}
	
	//textRange去重
	var rangeData = [];
	for(var i=0;i<textRange.length;i++){
		if(i>0 && textRange[i].range[0] == textRange[i-1].range[0]){
			
		}else{
			var range = textRange[i].range;
			if(textContents.substring(range[0],range[1]).indexOf("\r")>-1){
				var start = range[0];
				var obj = textContents.substring(range[0],range[1]).split("\r");
				for(var o=0;o<obj.length;o++){
					var item = {
						range:[start,start+obj[o].length+1-overValue],
						color:textRange[i].color,
						size:textRange[i].size,
						font:textRange[i].font
					};
					start += obj[o].length + overValue;
					rangeData.push(item);
				}
			}else{
				rangeData.push(textRange[i]);
			}
			
		}
	}
	
	
	
	var start = 0,
		end = 0;
	for(var o in pObj){
		start = end;
		end += pObj[o].length + overValue,
		p = new XML('<p></p>'),
		isCreateP = true;
		if(page.option.builder != "normal"){
			p['@style'] = 'margin:0px;padding:0px;';
		}else{
			p['@class'] = 'paragraph';
		}
		var len = rangeData.length
		for(var i=0;i<rangeData.length;i++){
			var textRange = rangeData[i],
				curStart = textRange.range[0],
				curEnd = textRange.range[1];
				
			if(start<=curStart && end+1>=curEnd && end>curStart){
				var text = textContents.substring(curStart,curEnd),
					textTrim = text.replace(/^\s+/, "").replace(/\s+$/, "");
				
				if(text.length>0 && textTrim.length>0){
					var span = new XML('<span></span>'),
						//文本片段
						textSpan = textContents.substring(curStart,curEnd);
					span.appendChild(new XML(textSpan));
					p.appendChild(span);
					
					if(page.option.builder == "normal"){
						var cssName = 'style'+page.option.i+'-'+i,
							fontCss = 'font-size:'+textRange.size+'px;color:#'+textRange.color+';',
							lineCss = '';
							if(textRange.font != 'SimSun' && textRange.font != 'NSimSun'){
								if(textRange.font.indexOf(' ')>-1 || textRange.font.indexOf('-')>-1){
									fontCss += ';font-family:\''+textRange.font+'\'';
								}else{
									fontCss += ';font-family:'+textRange.font;
								}
							}
						if(typeof(this.cssMap[fontCss]) != 'undefined'){
							cssName = this.cssMap[fontCss];
						}else{
							var lineCss = '.'+cssName+'{'+fontCss+';}';
							page.option.styleCss.appendChild(lineCss);
							this.cssMap[fontCss] = cssName;
						}
						span['@class'] = cssName;
					}else{
						var lineCss = '';
						if(textSpan.indexOf(' ')>-1){
							lineCss += 'white-space:pre-wrap;*white-space: pre;*word-wrap: break-word;';
						}
						if(textRange.color != this.item.textInfo.color && textRange.color != '000000'){
							lineCss += 'color:#'+textRange.color+';';
						}
						if(textRange.size != this.item.textInfo.size){
							lineCss += 'font-size:'+textRange.size+'px';
						}
						if(lineCss.length>0){
							span['@style'] = lineCss;
						}
					}
				}else{
					isCreateP = false;
				}
			}
		}
		
		if(page.option.builder != "normal"){
			p['@style'] = "margin:0px;padding:0px;";
		}
		
		
		if(page.option.builder == "normal"){
			if(p.toXMLString().indexOf("span")==-1){
				p = new XML('<br/>');
			}
			elm.appendChild(p);
		}else if(page.option.builder != "normal" && p.toXMLString().indexOf("span")>-1){
			elm.appendChild(p);
		}
		
	}
	

	
	return elm;
};

