(function (w) {
  'use strict';
  w.STUDIO_COACH_DATA = {
    routes: [
      { id:'draw', ar:'أرسم مع مدرّبي', en:'Draw with my coach', icon:'pen', steps:['color','draw','review','save'] },
      { id:'colour', ar:'ألوّن صفحة', en:'Colour a page', icon:'brush', steps:['paper','color','colour','review','save'] },
      { id:'photos', ar:'أصنع لوحة من أشيائي', en:'Make a My Things picture', icon:'picture', steps:['choose-photo','place-photo','review','save'] },
      { id:'card', ar:'أهدي بطاقة', en:'Make a card for someone', icon:'heart', mission:'thank-you', steps:['draw','meaning','words','review-message','save'] }
    ],
    steps: {
      color: { event:'color', target:'.palette', ar:'اِخْتَرْ لَوْنًا تُحِبُّهُ مِنَ الدَّوَائِرِ.', en:'Pick a colour you like from the circles.' },
      draw: { event:'ink', target:'#drawCanvas', ar:'اِرْسُمْ شَيْئًا تُحِبُّهُ عَلَى اللَّوْحَةِ.', en:'Draw something you like on the canvas.' },
      paper: { event:'colouring-paper', drawer:'paper', target:'.paper-tile[data-value=garden]', ar:'اِخْتَرِ الحَدِيقَةَ، أَوِ السَّمَكَةَ، أَوِ الصَّارُوخَ.', en:'Choose the garden, the fish or the rocket.' },
      colour: { event:'ink', target:'#drawCanvas', ar:'لَوِّنْ جُزْءًا مِنَ الصُّورَةِ بِاللَّوْنِ الَّذِي اخْتَرْتَهُ.', en:'Colour part of the picture with your chosen colour.' },
      'choose-photo': { event:'photo-selected', drawer:'photos', target:'.photo-picker', ar:'اِخْتَرْ صُورَةً مِنْ أَشْيَائِي.', en:'Pick a picture from My Things.' },
      'place-photo': { event:'photo-placed', target:'#drawCanvas', ar:'اِلْمَسِ اللَّوْحَةَ أَيْنَمَا تُرِيدُ وَضْعَ الصُّورَةِ.', en:'Tap the canvas where you want the picture.' },
      meaning: { event:'stage-meaning', target:'.journey [data-value=meaning]', ar:'عِنْدَمَا تَنْتَهِي مِنَ الرَّسْمِ، اِضْغَطْ «أُضِيفُ كَلَامِي».', en:'When your drawing is ready, tap Add words.' },
      words: { event:'words', stage:'meaning', target:'#caption', ar:'أَضِفْ كَلِمَةً، أَوْ أَمْلِ رِسَالَتَكَ عَلَى مَنْ مَعَكَ.', en:'Add a word, or ask your grown-up to write down your message.' },
      review: { event:'stage-review', target:'.journey [data-value=review]', ar:'خُذْ وَقْتَكَ. عِنْدَمَا تَكُونُ جَاهِزًا، اِضْغَطْ «أَرَى وَأَحْفَظُ».', en:'Take your time. When you’re ready, tap See and save.' },
      'review-message': { event:'stage-review', stage:'meaning', target:'.stage-actions [data-value=review]', ar:'عِنْدَمَا تَجْهَزُ بِطَاقَتُكَ، اِضْغَطْ «أَرَى وَأَحْفَظُ».', en:'When your card is ready, tap See and save.' },
      save: { event:'saved', stage:'review', target:'.review-save [data-do=save-project]', ar:'اِضْغَطْ «أَحْفَظُ فِي مَعْرِضِي» لِتَجِدَ عَمَلَكَ مَرَّةً أُخْرَى.', en:'Tap Save to my gallery so you can find your picture again.' },
      done: { ar:'أَحْسَنْتَ! صَارَ عَمَلُكَ فِي مَعْرِضِكَ.', en:'Well done! Your picture is in your gallery.' },
      'free-prompt': { ar:'مَاذَا تُرِيدُ أَنْ تَرْسُمَ اليَوْمَ؟', en:'What would you like to draw today?' },
      'free-model': { ar:'رَسَمْتُ شَيْئًا أُحِبُّهُ.', en:'I drew something I love.' },
      'free-word-one': { ar:'أَنَا', en:'I' },
      'free-word-two': { ar:'أُحِبُّ', en:'love' },
      'free-word-three': { ar:'رَسْمَتِي', en:'my picture' },
      'free-word-four': { ar:'عَائِلَتِي', en:'my family' }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
