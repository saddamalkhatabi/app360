(function(w){'use strict';var phrases={
intro:{ar:'نُريدُ اللُّعْبَةَ نَفْسَها. نَسْمَعُ بَعْضَنا، ثُمَّ نُجَرِّبُ حَلًّا.',en:'We both want the truck. Let us listen and try a plan.'},
needA:{ar:'أُريدُ أَنْ أَلْعَبَ بِالشّاحِنَةِ. هَلْ يُمْكِنُ أَنْ آخُذَ دَوْرًا؟',en:'I would like to play with the truck. May I have a turn?'},
needB:{ar:'أُريدُ دَوْرًا أَيْضًا. لِنَجِدْ طَريقَةً تُناسِبُنا.',en:'I would like a turn too. Let us find a plan that works for us.'},
solutions:{ar:'نُشاهِدُ حَلَّيْنِ. أَيُّهُما نُحِبُّ أَنْ نُجَرِّبَ؟',en:'Let us look at two plans. Which one would we like to try?'},
turns:{ar:'نَتَبادَلُ الدَّوْرَ. أَلْعَبُ، ثُمَّ أُعْطيكَ الشّاحِنَةَ.',en:'We take turns. I play, then pass the truck to you.'},
together:{ar:'نَلْعَبُ مَعًا. أَنا أَبْني الطَّريقَ، وَأَنْتَ تَقودُ الشّاحِنَةَ.',en:'We play together. I build the road and you drive the truck.'},
agree:{ar:'هَلْ نُوافِقُ جَميعًا؟ يُمْكِنُ أَنْ نَقْتَرِحَ تَعْديلًا.',en:'Do we all agree? We can suggest a change.'},
trial:{ar:'الآنَ نُجَرِّبُ اِتِّفاقَنا بِاللُّعْبَةِ أَوْ بِالدُّمى.',en:'Now let us try our plan with a toy or puppets.'},
review:{ar:'ماذا حَدَثَ؟ هَلْ نُبْقي الاِتِّفاقَ أَمْ نُعَدِّلُهُ؟',en:'What happened? Shall we keep our plan or change it?'},
saved:{ar:'حَفِظْنا اِتِّفاقَنا. يُمْكِنُ أَنْ نَعُودَ إِلَيْهِ.',en:'Our plan is saved. We can come back to it.'},
help:{ar:'نَطْلُبُ مُساعَدَةَ الْمُرافِقِ، وَنَقُولُ ما نَحْتاجُهُ.',en:'Let us ask our grown-up for help and say what we need.'},
pause:{ar:'نَأْخُذُ اِسْتِراحَةً. نَعُودُ عِنْدَما نَكُونُ مُسْتَعِدّينَ.',en:'Let us take a break. We can return when we are ready.'}
};
w.COOP_CONTENT={phrases:phrases,stages:['intro','needA','needB','solutions','agree','trial','review'],
tracks:[{id:'entry',ar:'أطلب وأبادل الدور',en:'Ask and take turns',note_ar:'مثّل مع المرافق. يكفي الاختيار بالإشارة.',note_en:'Play with a grown-up. Pointing is welcome.'},{id:'practice',ar:'أسمع وأقترح',en:'Listen and suggest',note_ar:'جرّبا الحلين، ثم اختارا اتفاقًا معًا.',note_en:'Try both plans, then choose one together.'},{id:'extend',ar:'نتفق ونراجع',en:'Agree and review',note_ar:'جرّبا الحلين وأضيفا تعديلًا من كلماتكما. يمكن إشراك لاعب ثالث.',note_en:'Try both plans and add your own change. A third player can join.'}],
titles:{intro:{ar:'نريد اللعبة نفسها',en:'We both want the truck'},needA:{ar:'أسمع الطلب الأول',en:'Listen to the first request'},needB:{ar:'أسمع الطلب الثاني',en:'Listen to the second request'},solutions:{ar:'نجرب اقتراحين',en:'Explore two plans'},agree:{ar:'نختار اتفاقًا',en:'Choose a plan together'},trial:{ar:'نلعب خارج الشاشة',en:'Try it away from the screen'},review:{ar:'نراجع ما حدث',en:'Look back together'}},
scenes:{intro:0,needA:1,needB:2,solutions:3,agree:4,trial:4,review:5},
plans:{turns:{ar:'نتبادل الدور',en:'Take turns',rule_ar:'نمرر الشاحنة بعد رحلة قصيرة على الطريق.',rule_en:'Pass the truck after a short trip along the road.',scene:3},together:{ar:'نلعب معًا',en:'Play together',rule_ar:'واحد يبني الطريق، والآخر يقود، ثم نتبادل العمل.',rule_en:'One builds the road and one drives. Then swap jobs.',scene:4}}
};if(typeof module!=='undefined')module.exports=w.COOP_CONTENT;
})(typeof window!=='undefined'?window:globalThis);
