'use strict';
(function(){
 var box=document.createElement('div'),up=document.createElement('button'),down=document.createElement('button'),board=document.getElementById('boardWrap');
 box.id='scrollAssist';up.type='button';down.type='button';up.innerHTML='↑';down.innerHTML='↓';up.setAttribute('aria-label','الصعود إلى أعلى الصفحة');down.setAttribute('aria-label','النزول إلى الأدوات');box.appendChild(up);box.appendChild(down);document.body.appendChild(box);
 function toolsY(){var r=board.getBoundingClientRect(),y=(window.pageYOffset||document.documentElement.scrollTop||0)+r.top;return Math.max(0,y+board.offsetHeight*.44)}
 up.onclick=function(){window.scrollTo(0,0)};down.onclick=function(){window.scrollTo(0,toolsY())};
})();
