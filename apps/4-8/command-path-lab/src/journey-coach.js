(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./journey-model'));
  else root.COMMAND_JOURNEY_COACH = factory(root.COMMAND_JOURNEY);
}(this, function (M) {
  'use strict';

  var phrases = {
    move: ['اِلْمَسِ السَّهْمَ الْمُشَارَ إِلَيْهِ.', 'Tap the arrow I am pointing to.'],
    turn: ['أَدِرْ فِتِيلًا نَحْوَ الطَّرِيقِ.', 'Turn Wick toward the path.'],
    forward: ['أَصْبَحَ وَجْهُهُ نَحْوَ الطَّرِيقِ. اِلْمَسْ تَقَدَّمْ.', 'Wick is facing the path. Tap forward.'],
    add: ['ضَعْ هَذِهِ الْبِطَاقَةَ فِي خُطَّتِكَ.', 'Put this card in your plan.'],
    repeat: ['جَرِّبْ هَذِهِ الْبِطَاقَةَ. هِيَ تُعْطِيكَ خُطْوَتَيْنِ.', 'Try this card. It makes Wick take two steps.'],
    play: ['اِلْمَسْ شَغِّلْ لِنَشَاهِدَ مَا سَيَحْدُثُ.', 'Tap play and let us see what happens.'],
    watch: ['شَغِّلِ الْبِطَاقَاتِ وَرَاقِبْ أَيْنَ يَتَوَقَّفُ فِتِيلٌ.', 'Play the cards and watch where Wick stops.'],
    undo: ['اِلْمَسْ تَرَاجَعْ لِتُغَيِّرَ آخِرَ خُطْوَةٍ.', 'Tap undo to change your last step.'],
    repair: ['اِلْمَسْ هَذِهِ الْبِطَاقَةَ لِتُبَدِّلَهَا.', 'Tap this card so you can change it.'],
    replace: ['اِخْتَرْ هَذَا الْأَمْرَ مَكَانَ الْبِطَاقَةِ.', 'Choose this command to replace the card.'],
    swap: ['اِلْمَسْ هُنَا لِتُبَدِّلَ تَرْتِيبَ الْبِطَاقَتَيْنِ.', 'Tap here to swap the order of the cards.'],
    guess: ['تَتَبَّعِ الْبِطَاقَاتِ، ثُمَّ اخْتَرْ مُرَبَّعًا بِعَلَامَةِ سُؤَالٍ.', 'Follow the cards, then choose a square with a question mark.'],
    landing: ['هُنَا تَوَقَّفَ فِتِيلٌ. جَرِّبْ هَذَا الْمُرَبَّعَ.', 'Wick stopped here. Try this square.'],
    explore: ['جَرِّبْ بِطَاقَةً، وَارْسُمْ طَرِيقَكَ.', 'Try a card and make a path of your own.'],
    cheer: ['أَحْسَنْتَ! وَصَلْتَ إِلَى الْهَدَفِ.', 'Well done! You reached the goal.'],
    'track-complete': ['أَحْسَنْتَ! أَكْمَلْتَ مَهَامَّ هَذَا الْمَسَارِ.', 'Well done! You finished all the missions in this track.']
  };

  function cue(id, action) { return { id: id, action: action }; }
  function choose(card, draft, result, selected) {
    if (card.mode === 'predict') {
      if (result && result.status === 'prediction') return cue('landing', 'guess:' + card.goal.join(':'));
      return draft.guess ? cue('play', 'play') : cue('guess', 'board');
    }
    if (card.mode === 'repair' || card.mode === 'swap') {
      if (!draft.tried) return cue('watch', 'play');
      if (M.route(card, draft.tape).status === 'arrived') return cue('play', 'play');
      if (card.mode === 'swap') return cue('swap', 'swap');
      var fixed = card.edit.filter(function (i) { return draft.tape[i] !== card.answer[i]; });
      if (fixed.indexOf(selected) >= 0) return cue('replace', 'add:' + card.answer[selected]);
      return cue('repair', 'select:' + fixed[0]);
    }
    if (card.mode === 'studio') {
      if (result && result.status === 'blocked') return cue('undo', 'undo');
      return draft.tape.length ? cue('play', 'play') : cue('explore', 'add:f');
    }
    var i = 0;
    while (i < draft.tape.length && draft.tape[i] === card.answer[i]) i++;
    if (!M.direct(card) && M.route(card, draft.tape).status === 'arrived') return cue('play', 'play');
    if (i < draft.tape.length || (result && result.status === 'blocked')) return cue('undo', 'undo');
    var op = card.answer[i];
    if (!op) return cue('play', 'play');
    return cue(op === 'twice' ? 'repeat' : card.mode === 'facing' ? (op === 'f' ? 'forward' : 'turn') :
      M.direct(card) ? 'move' : 'add', 'add:' + op);
  }

  return { phrases: phrases, choose: choose };
}));
