(function(w,d){'use strict';
var rows=[],generation=0,audio=null,page=0,pageSize=24,status=d.getElementById('status'),list=d.getElementById('names');
function stop(){generation++;w.App360Celebration.stop();if(audio){audio.onended=audio.onerror=null;audio.pause();audio=null}}
function text(el,value){el.appendChild(d.createTextNode(value))}
function preview(row,withPrefix,gender){
 stop();var seq=generation;
 if(!withPrefix&&!row.audio){status.textContent='هذا الاسم لم يكتمل تسجيله بعد.';return}
 status.textContent='استمع إلى: '+row.name;
 function name(){if(seq!==generation)return;audio=new Audio(row.audio.path);audio.onended=function(){if(seq===generation)status.textContent='انتهى التسجيل: '+row.name+' — دوّن أي تصحيح مطلوب.'};audio.onerror=function(){if(seq===generation)status.textContent='تعذر تحميل صوت الاسم.'};var p=audio.play();if(p&&p.catch)p.catch(audio.onerror)}
 if(withPrefix){var full=row.praise_audio&&row.praise_audio[gender];if(!full){status.textContent='العبارة الكاملة لم تسجل بعد.';return}audio=new Audio(full.path);audio.onended=function(){if(seq===generation)status.textContent='انتهت العبارة الكاملة — '+row.name};audio.onerror=function(){if(seq===generation)status.textContent='تعذر تشغيل العبارة الكاملة.'};var p=audio.play();if(p&&p.catch)p.catch(audio.onerror)}else name()
}
function available(row){return row.praise_audio&&(row.praise_audio[row.gender==='girl'?'f':'m'])}
function approved(row){var a=available(row);return !!(a&&a.auditory_review==='approved'&&a.review&&a.review.sha256===a.sha256)}
function render(){
 var value=App360NameLookup.normalize(d.getElementById('search').value),filter=d.getElementById('state').value,filtered=[],recorded=0,reviewed=0,i,j;
 list.innerHTML='';
 for(i=0;i<rows.length;i++){
  var row=rows[i],aliases=[row.name].concat(row.aliases||[]),match=!value;
  if(available(row))recorded++;if(approved(row))reviewed++;
  for(j=0;j<aliases.length;j++)if(App360NameLookup.normalize(aliases[j]).indexOf(value)>=0)match=true;
  if(!match||(filter==='recorded'&&!available(row))||(filter==='pending'&&available(row))||(filter==='approved'&&!approved(row))||(filter==='review'&&(!available(row)||approved(row))))continue;
  filtered.push(row)
 }
 var pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.max(0,Math.min(page,pages-1));
 d.getElementById('summary').textContent='إجمالي الأسماء: '+rows.length+' · عبارة كاملة للصيغة الافتراضية: '+recorded+' · قيد التسجيل: '+(rows.length-recorded)+' · معتمد سمعيًا: '+reviewed;
 for(i=page*pageSize;i<Math.min((page+1)*pageSize,filtered.length);i++)(function(row){
  var card=d.createElement('article'),title=d.createElement('b'),gender=d.createElement('select'),single=d.createElement('button'),joined=d.createElement('button'),note=d.createElement('small');
  text(title,row.name);gender.setAttribute('aria-label','صيغة التهنئة لاسم '+row.name);
  for(var n=0;n<2;n++){var option=d.createElement('option');option.value=n?'f':'m';text(option,n?'مؤنث':'مذكر');gender.appendChild(option)}gender.value=row.gender==='girl'?'f':'m';
  text(single,'🔊 الاسم فقط');text(joined,'🔊 العبارة الكاملة مع الاسم');single.disabled=!row.audio;joined.disabled=!(row.praise_audio&&row.praise_audio[gender.value]);gender.onchange=function(){stop();joined.disabled=!(row.praise_audio&&row.praise_audio[gender.value])};
  single.onclick=function(){preview(row,false,gender.value)};joined.onclick=function(){preview(row,true,gender.value)};
  text(note,available(row)?(approved(row)?'العبارة معتمدة للصيغة الافتراضية':available(row).auditory_review==='rejected'?'العبارة تحتاج تصحيحًا':'العبارة مسجلة — بانتظار المراجعة السمعية'):'العبارة الكاملة قيد التسجيل');
  card.appendChild(title);card.appendChild(gender);card.appendChild(single);card.appendChild(joined);card.appendChild(note);list.appendChild(card)
 })(filtered[i]);
 d.getElementById('previous').disabled=page===0;d.getElementById('next').disabled=page>=pages-1;
 d.getElementById('page').textContent='صفحة '+(page+1)+' من '+pages+' · نتائج البحث: '+filtered.length;
 status.textContent=filtered.length?'الأسماء المعروضة: '+Math.min(pageSize,filtered.length-page*pageSize)+' من '+filtered.length:'لا توجد أسماء مطابقة.'
}
function reset(){stop();page=0;render()}
d.getElementById('search').oninput=reset;d.getElementById('state').onchange=reset;
d.getElementById('previous').onclick=function(){stop();page--;render()};d.getElementById('next').onclick=function(){stop();page++;render()};
d.getElementById('stop').onclick=function(){stop();status.textContent='توقف الصوت'};
w.addEventListener('pagehide',stop,false);d.addEventListener('visibilitychange',function(){if(d.hidden)stop()},false);
var x=new XMLHttpRequest();x.open('GET','names.json?v=20261026-full',true);x.onreadystatechange=function(){if(x.readyState!==4)return;try{if(x.status!==200)throw Error();rows=JSON.parse(x.responseText).records;render()}catch(e){status.textContent='تعذر تحميل قائمة الأسماء. أعد فتح الصفحة.'}};x.send(null);
})(window,document);
