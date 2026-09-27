(function(w,d){
'use strict';
var RETIRED_ID='a1-parent-play',RETIRED_SLUG='responsive-play-coach',RETIRED_TITLE='رفيق المرافق: خطط جلسة لعب مستجيبة',runs=0,timer=null;
function hasClass(n,c){return !!(n&&n.className&&(' '+String(n.className)+' ').indexOf(' '+c+' ')>=0)}
function attr(n,k){return n&&n.getAttribute?String(n.getAttribute(k)||''):''}
function text(n){return String((n&&(n.textContent||n.innerText))||'')}
function containsRetired(n){if(!n)return false;if(attr(n,'data-app')===RETIRED_ID||attr(n,'data-detail-app')===RETIRED_ID)return true;var links=n.getElementsByTagName?n.getElementsByTagName('a'):[],i,h;for(i=0;i<links.length;i++){h=attr(links[i],'href');if(h.indexOf(RETIRED_SLUG)>=0)return true}var buttons=n.getElementsByTagName?n.getElementsByTagName('button'):[];for(i=0;i<buttons.length;i++){if(attr(buttons[i],'data-app')===RETIRED_ID||attr(buttons[i],'data-detail-app')===RETIRED_ID)return true}return text(n).indexOf(RETIRED_TITLE)>=0}
function removeNode(n){if(n&&n.parentNode)n.parentNode.removeChild(n)}
function cleanClass(cls){var all=d.getElementsByTagName('*'),i,n;for(i=all.length-1;i>=0;i--){n=all[i];if(hasClass(n,cls)&&containsRetired(n))removeNode(n)}}
function updateCounts(){var stage=d.getElementById('showcaseTrack'),meta=d.getElementById('showcaseResult'),cards,i,live=0;if(stage&&meta){cards=stage.getElementsByTagName('article');for(i=0;i<cards.length;i++){if(hasClass(cards[i],'showcase-card')){var spans=cards[i].getElementsByTagName('span'),j;for(j=0;j<spans.length;j++)if(hasClass(spans[j],'showcase-badge')&&hasClass(spans[j],'live')){live++;break}}}meta.innerHTML=live+' متاح من '+cards.length}var grid=d.getElementById('appGrid'),count=d.getElementById('resultCount'),n=0;if(grid&&count){cards=grid.getElementsByTagName('article');for(i=0;i<cards.length;i++)if(hasClass(cards[i],'app-card'))n++;if(n||cards.length===0)count.innerHTML='النتائج: <span class="count">'+n+'</span>'}}
function clean(){cleanClass('showcase-card');cleanClass('classic-card');cleanClass('app-card');updateCounts();runs++;if(runs>40&&timer){clearInterval(timer);timer=null}}
function boot(){clean();timer=setInterval(clean,300);if(w.MutationObserver){try{var mo=new MutationObserver(function(){clean()});mo.observe(d.documentElement||d.body,{childList:true,subtree:true})}catch(e){}}}
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',boot,false);else if(w.attachEvent)w.attachEvent('onload',boot)}else boot();
})(window,document);
