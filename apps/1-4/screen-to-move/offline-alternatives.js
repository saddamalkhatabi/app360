(function(){'use strict';
var root=document.getElementById('appRoot');
if(!root)return;
var items=[
  ['👆','أشر إلى شيء أو صورة من نفس الموضوع'],
  ['🧩','طابق صورتين أو شيئين متشابهين'],
  ['🧺','افرز قطعًا كبيرة وآمنة إلى مجموعتين'],
  ['↔','انقل قطعًا كبيرة بين وعاءين أو مكانين'],
  ['〰','اصنع مسارًا قصيرًا بالإصبع أو لعبة'],
  ['✨','أخفِ عنصرًا أو غيّر ترتيبه واصنع لغزًا للمرافق']
];
function ensure(){
  var modes=root.querySelector('.mode-grid');
  if(!modes||root.querySelector('.quick-alternatives'))return;
  var topicEl=root.querySelector('.game-title-card p');
  var topic=topicEl?topicEl.textContent:'الموضوع المختار';
  var section=document.createElement('section');
  section.className='mode-card quick-alternatives';
  var html='<h3>🧺 ستة بدائل واقعية سريعة لنفس الموضوع</h3><p>اختر واحدًا فقط بما يناسب الطفل والمواد المتاحة في <strong>'+escapeHtml(topic)+'</strong>، ثم اترك الشاشة.</p><div class="materials">';
  for(var i=0;i<items.length;i++)html+='<span>'+items[i][0]+' '+items[i][1]+'</span>';
  html+='</div><p><small>استخدم مواد اللعبة المذكورة أعلاه، وورقة وقلم عند الحاجة. لا يلزم تنفيذ البدائل الستة كلها.</small></p>';
  section.innerHTML=html;
  modes.parentNode.insertBefore(section,modes);
}
function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
if(window.MutationObserver){new MutationObserver(ensure).observe(root,{childList:true,subtree:true})}
document.addEventListener('click',function(){setTimeout(ensure,0)},false);
ensure();
})();
