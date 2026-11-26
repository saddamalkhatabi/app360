(function (w) {
  'use strict';
  var photos = w.STUDIO_PHOTOS || { groups: [], items: {} };
  w.STUDIO_OPTIONS = {
    colors: [
      ['#29233e','أسود','Ink'], ['#ffffff','أبيض','White'], ['#7951be','بنفسجي','Purple'],
      ['#c33688','توتي','Berry'], ['#ec7894','وردي','Pink'], ['#d94145','أحمر','Red'],
      ['#e87832','برتقالي','Orange'], ['#eab82e','أصفر','Yellow'], ['#86b846','ليموني','Lime'],
      ['#258651','أخضر','Green'], ['#17a59b','فيروزي','Teal'], ['#55b7e7','سماوي','Sky blue'],
      ['#3d68d0','أزرق','Blue'], ['#634648','بني','Brown'], ['#c2875b','رملي','Sand'],
      ['#838798','رمادي','Grey']
    ],
    tools: [['pen','قلم','Pen'], ['brush','فرشاة','Brush'], ['chalk','شمع','Crayon'], ['marker','مظلّل','Highlighter'], ['rainbow','قوس قزح','Rainbow'], ['eraser','ممحاة','Eraser']],
    sizes: [[4,'رفيع','Thin'],[8,'عادي','Medium'],[18,'عريض','Wide'],[34,'كبير','Big']],
    shapes: [['line','خط','Line'],['circle','دائرة','Circle'],['square','مربّع','Square'],['triangle','مثلّث','Triangle'],['diamond','مُعيّن','Diamond'],['oval','بيضاوي','Oval']],
    stamps: [['heart','قلب','Heart'],['star','نجمة','Star'],['sun','شمس','Sun'],['flower','زهرة','Flower'],['house','بيت','House'],['book','كتاب','Book'],['balloon','بالون','Balloon'],['leaf','ورقة','Leaf'],['smile','ابتسامة','Smile']],
    papers: [
      ['plain','أبيض','White','#fffdf8'], ['peach','خوخي','Peach','#fff0e8'], ['mint','نعناعي','Mint','#e9f8ef'],
      ['sky','سماوي','Sky','#e9f5ff'], ['lilac','بنفسجي','Lilac','#f1ebff'], ['night','ليلي','Night','#262442'],
      ['dots','نقاط','Dots','#fffdf8'], ['grid','مربّعات','Grid','#fffdf8'], ['lines','سطور','Lines','#fffdf8'],
      ['garden','حديقة للتلوين','Garden to colour','#fffdf8'], ['fish','سمكة للتلوين','Fish to colour','#fffdf8'],
      ['rocket','صاروخ للتلوين','Rocket to colour','#fffdf8']
    ],
    photos: photos
  };
})(window);
