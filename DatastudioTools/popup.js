chrome.runtime.onMessage.addListener(function(request, sender) {



  (function() {

    var supportsCSSText = getComputedStyle(document.body).cssText !== "";

    function copyCSS(elem, origElem, log) {

      var computedStyle = getComputedStyle(origElem);

      if (supportsCSSText) {
        elem.style.cssText = computedStyle.cssText;

      } else {

        // Really, Firefox?
        for (var prop in computedStyle) {
          if (isNaN(parseInt(prop, 10)) && typeof computedStyle[prop] !== 'function' && !(/^(cssText|length|parentRule)$/).test(prop)) {
            elem.style[prop] = computedStyle[prop];
          }
        }

      }

    }

    function inlineStyles(elem, origElem) {

      var children = elem.querySelectorAll('*');
      var origChildren = origElem.querySelectorAll('*');

      // copy the current style to the clone
      copyCSS(elem, origElem, 1);

      // collect all nodes within the element, copy the current style to the clone
      Array.prototype.forEach.call(children, function(child, i) {
        copyCSS(child, origChildren[i]);
      });

      // strip margins from the outer element
      elem.style.margin = elem.style.marginLeft = elem.style.marginTop = elem.style.marginBottom = elem.style.marginRight = '';

    }

    window.domvas = {

      toImage: function(origElem, callback, width, height, left, top) {

        left = (left || 0);
        top = (top || 0);

        var elem = origElem.cloneNode(true);

        // inline all CSS (ugh..)
        inlineStyles(elem, origElem);

        // unfortunately, SVG can only eat well formed XHTML
        elem.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

        // serialize the DOM node to a String
        var serialized = new XMLSerializer().serializeToString(elem);

        // Create well formed data URL with our DOM string wrapped in SVG
        var dataUri = "data:image/svg+xml," +
          "<svg xmlns='http://www.w3.org/2000/svg' width='" + ((width || origElem.offsetWidth) + left) + "' height='" + ((height || origElem.offsetHeight) + top) + "'>" +
          "<foreignObject width='100%' height='100%' x='" + left + "' y='" + top + "'>" +
          serialized +
          "</foreignObject>" +
          "</svg>";

        // create new, actual image
        var img = new Image();
        img.src = dataUri;

        // when loaded, fire onload callback with actual image node
        img.onload = function() {
          if (callback) {
            callback.call(this, this);
          }
        };

      }

    };

  })();

  function main_menu_button(){
      var button2 = document.createElement("button")
      button2.id='menus'
      button2.innerHTML = 'Back To Menu'
      button2.style.marginLeft = '5px'
      button2.className = 'button button-outline'
      document.body.appendChild(button2)

    document.getElementById('menus').addEventListener('click', function() {
    main_menu()
    });
  }


  if (request.action == "getSource") {
    //console.log(request.source);
    //reset = request.source
    message.outerHTML = request.source;
    listOfButtons = []



    var svg1 = document.getElementsByTagName("svg");
    svgLists = [];
  svgs =[]
    for (count = 0; count < svg1.length; count++) {
      svgLists.push(svg1[count].getElementsByTagName("rect"))
  svgs.push(svg1[count])
    }

    var svg1 = document.getElementsByTagName("svg");
    console.log(svgLists)
    console.log(svgs)
    
    document.body.innerHTML = ""
//begin:
//function resetMenu() {
  total_buttons = 0
    for (count=0; count < svgs.length; count ++) {

     var button = document.createElement("button")

      button.id = 'download'
  button.value = count

  legend = svgs[count].getElementsByTagName("text")

  if (legend.length > 1) {
      button.innerHTML = legend[0].innerHTML + " + " + legend[1].innerHTML
      //document.body.appendChild(button)
      listOfButtons.push(button)


      //document.getElementsByTagName('button')[count].addEventListener('click', function() {
      listOfButtons[total_buttons].addEventListener('click', function() {
      clicked = event.target.value
    maxWidth = 0
    maxHeight = 0
    list= svgLists[clicked]
    svg=svgs[clicked]

    //alert(svg.getElementsByTagName('gviz-barchart').innerHTML)
    /*
    for (count = 0; count < list.length; count++){
      console.log(list[count].width.baseVal.value)
      if (list[count].width.baseVal.value > 1) {
        alert('bar')
      }
    } */

    for (count = 0; count< list.length; count++) {
      //alert('hello')
        if ((list[count].width.baseVal.value > 1) & (list[count].height.baseVal.value > 1)) {
          //alert('hello')
        x = list[count].x.baseVal.value
        y = list[count].y.baseVal.value
      //if (x > maxWidth) {
        //maxWidth = x
      //};
      //if (y > maxHeight) {
        //maxHeight = y
      //}



      width = list[count].width.baseVal.value
      height = list[count].height.baseVal.value
      try {
        fill = list[count].attributes.getNamedItem("fill").nodeValue;

      } catch (err) {

        fill = "#ffffff"
      }

      if (fill != "#ffffff") {
        var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path'); //Create a path in SVG's namespace
        //alert("M " + x + " " + y + " L " + (x + width) + " " + (y) + " L " + (x+width) + (y+height) + " Z ")
        newElement.setAttribute("d", "M " + x + " " + y + " L " + (x + width) + " " + (y) + " L " + (x+width) +" " + (y+height) + " L " + x + " " + (y+height)); //Set path's data
        newElement.setAttribute('style', 'fill: ' + fill)
        newElement.style.stroke = fill

        newElement.style.strokeWidth = "1px"; 
        //svg.insertBefore(newElement, )
        svg.insertBefore(newElement, svg.firstChild)

      }

      }
    }
    for (count = 0; count < list.length; count++) {
      maxWidth = svg.width.baseVal.value
      maxHeight = svg.height.baseVal.value      


      x = list[count].x.baseVal.value
      y = list[count].y.baseVal.value
      //if (x > maxWidth) {
        //maxWidth = x
      //};
      //if (y > maxHeight) {
        //maxHeight = y
      //}



      width = list[count].width.baseVal.value
      height = list[count].height.baseVal.value
      try {
        fill = list[count].attributes.getNamedItem("fill").nodeValue;

      } catch (err) {

        fill = "#ffffff"
      }

      if (fill != "#ffffff") {
        var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'path'); //Create a path in SVG's namespace
        newElement.setAttribute("d", "M " + x + " " + y + " L " + (x + width) + " " + (y + height)); //Set path's data

        newElement.style.stroke = fill

        newElement.style.strokeWidth = "1px"; 
        newElement.id = 'backline'

        svg.insertBefore(newElement, svg.firstChild)

      }


          

  }


    adjWidth = maxWidth
    //alert(adjWidth)
    adjHeight = maxHeight 
    //document.body.style.width = ''+(adjWidth-(maxWidth * .15))+'px'
    document.body.style.height = ''+adjHeight +'px'
    document.body.style.width = ''+adjWidth +'px'
    document.body.appendChild(svg)
    var canvas = document.createElement("canvas");
    canvas.id = "test"
    document.body.appendChild(canvas)
    var divver = document.createElement("div")
    divver.appendChild(svg)
    document.body.appendChild(divver)

    var context = canvas.getContext('2d');

    domvas.toImage(document.body.getElementsByTagName("div")[0], function() {
      context.drawImage(this, 20, 20, adjWidth*1.2, adjHeight*1.2);
    });

    document.getElementById("test").width = adjWidth * 1.3
    document.getElementById("test").height = adjHeight *1.3


   
    document.body.innerHTML = ""
  
  document.body.appendChild(svg)
   
  background = document.body.appendChild(canvas)
  canvas.style.display="none";
  //background.style.hidden = true
  lineBreak = document.createElement("br")
  document.body.appendChild(lineBreak)
  var button = document.createElement("button")
  button.id='download'
  button.innerHTML = 'Rasterize!'
  document.body.appendChild(button)

  main_menu_button()



  

document.getElementById('download').addEventListener('click', function() {
    downloadCanvas(this, 'test', 'test.png');
    //continue begin
}, false);
function downloadCanvas(link, canvasId, filename) {
    link.href = document.getElementById(canvasId).toDataURL();
    console.log(link.href)
    document.body.innerHTML = ""
    var image = document.createElement("img");
  image.src = link.href

  document.body.appendChild(image);
  main_menu_button()
    //link.download = filename;
}
   

    
    }, false);
total_buttons +=1
    }
}
//}
maxButtonSize=0

for (count=0; count < listOfButtons.length; count ++){
if (listOfButtons[count].style.width > maxButtonSize) {
  maxButtonSize = listOfButtons[count].style.width
}
}

 //var table = document.createElement('table')
//resetMenu()
function main_menu() {
document.body.innerHTML = ""
title = document.createElement('h1')
title.innerHTML = 'Data Studio Tools'
document.body.style.width = '340px'
title2 = document.createElement('h5')
title2.innerHTML = 'Brought to you by <i>Accenture Digital</i>'
title2.style.textAlign = 'right'
title.style.textAlign = 'center'
title.style.margin =0
title.style.padding = 0

title2.style.paddingRight = '5px'
title2.style.marginBottom = '0px'

line = document.createElement('hr')
line.style.paddingTop = '0px'
line.style.marginTop = '0'
line.style.marginBottom = '10px'

title3 = document.createElement('h4')
title3.innerHTML = "<u>Compatible Visualziations</u>"
//title3.style.marginTop = '15px'
title3.style.marginBottom = '10px'



document.body.appendChild(title)
document.body.appendChild(title2)
document.body.appendChild(line)
document.body.appendChild(title3)

for (count=0; count < listOfButtons.length; count ++){
 
  //var row = table.insertRow(0)
  //var cell = row.insertCell(0)
  //row.style.height = "20px"
  //cell.style.height = '20px'
  //listOfButtons[count].setAttribute.('style', 'white-space: normal;')
  listOfButtons[count].style.width = "100%"
  //listOfButtons[count].style.align = "center"
  //listOfButtons[count].style.margin = "auto"
  //listOfButtons[count].style.display = "block"

  //listOfButtons[count].style.height = '100%'
  document.body.appendChild(listOfButtons[count])

  //cell.innerHTML = 'hello'
  //cell.appendChild(listOfButtons[count])
  //document.body.appendChild(listOfButtons[count])
}


  line2 = document.createElement('hr')
  line2.style.paddingTop = '0px'
  line2.style.marginTop = '0'
  line2.style.marginBottom = '10px'

  var aboutButton = document.createElement("button")
  aboutButton.id='info'
  aboutButton.innerHTML = 'About this App'
  aboutButton.className = 'button button-outline'
  aboutButton.style.width =  "100%"
  document.body.appendChild(line2)
  document.body.appendChild(aboutButton)

  document.getElementById('info').addEventListener('click', function() {
    document.body.innerHTML = ""
    document.body.appendChild(title)
document.body.appendChild(title2)
document.body.appendChild(line)
    appInfo = document.createElement('div')
    appInfo.innerHTML = "<b>App Version:</b> 0.1a<br><b>Developer:</b> George Fang<br><b>Design by:</b> Milligram"
    appInfo.style.textAlign = 'center'
    document.body.appendChild(appInfo)

    appStory = document.createElement('div')
    appStory.innerHTML = "This tool was developed as a solution to give Data Studio users to a streamlined way to export visualziations to presentations by rendering SVG graphics in real time through the browser. Please remember that <b>Google data is often sensitive,</b> be mindful of who you share your graphs with.<br><br>For bug-reports, questions, comments, and suggestions please reach out to George Fang at georgefang@google.com."


    document.body.appendChild(appStory)

    main_menu_button()

    //continue begin
}, false);


//table.setAttribute('cellpadding',0)
//document.body.appendChild(table)

  }
}

main_menu()


});



function onWindowLoad() {

  chrome.tabs.executeScript(null, {
    file: "getPagesSource.js"
  }, function() {
    // If you try and inject into an extensions page or the webstore/NTP you'll get an error
    if (chrome.runtime.lastError) {
      message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
    }
  });

}

window.onload = onWindowLoad;
