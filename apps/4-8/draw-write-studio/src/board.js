(function (w, doc) {
  'use strict';
  var P = w.APP360_PENCIL, O = w.STUDIO_OPTIONS, images = {};
  var spectrum = ['#e54463','#f39131','#e4b41f','#43a365','#389cdc','#7356cd'];
  var clock = w.requestAnimationFrame || function (callback) { return setTimeout(callback, 16); };
  var cancelFrame = w.cancelAnimationFrame || clearTimeout;

  function paperKind(commands) {
    for (var i = commands.length - 1; i >= 0; i--) if (commands[i].type === 'paper') return commands[i].kind;
    return 'plain';
  }

  function ellipse(ctx, x, y, rx, ry) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.restore();
  }

  function path(ctx, points, closed) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    if (closed) ctx.closePath();
    ctx.stroke();
  }

  function colouring(ctx, name) {
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#897d9d';
    ctx.lineJoin = ctx.lineCap = 'round';
    if (name === 'garden') {
      path(ctx, [[65,555],[940,555]], false);
      ctx.beginPath();
      ctx.arc(780, 135, 52, 0, Math.PI * 2);
      ctx.stroke();
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4, x = Math.cos(a), y = Math.sin(a);
        path(ctx, [[780 + 67*x,135 + 67*y],[780 + 88*x,135 + 88*y]], false);
      }
      [220,500,755].forEach(function (x, index) {
        var y = index === 1 ? 300 : 385;
        path(ctx, [[x,y + 65],[x,553]], false);
        ctx.beginPath(); ellipse(ctx, x + 28, y + 120, 28, 13); ctx.stroke();
        for (var j = 0; j < 6; j++) {
          var angle = j * Math.PI / 3;
          ctx.beginPath(); ellipse(ctx, x + 48*Math.cos(angle), y + 48*Math.sin(angle), 24, 23); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.stroke();
      });
    } else if (name === 'fish') {
      ctx.beginPath();
      ctx.moveTo(735, 345); ctx.bezierCurveTo(540, 133, 310, 155, 197, 350);
      ctx.bezierCurveTo(310, 542, 550, 565, 735, 345); ctx.stroke();
      path(ctx, [[735,345],[865,235],[865,465]], true);
      ctx.beginPath(); ctx.arc(337,320,18,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(252,395); ctx.quadraticCurveTo(300,426,349,395); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(521,333); ctx.quadraticCurveTo(602,352,518,406); ctx.stroke();
      [[161,230,20],[125,149,31],[235,105,17],[719,545,27]].forEach(function (b) {
        ctx.beginPath(); ctx.arc(b[0],b[1],b[2],0,Math.PI*2); ctx.stroke();
      });
      ctx.beginPath(); ctx.moveTo(75,600); ctx.quadraticCurveTo(275,540,460,615); ctx.quadraticCurveTo(640,665,925,590); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(400,460); ctx.quadraticCurveTo(345,265,500,125);
      ctx.quadraticCurveTo(655,265,600,460); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(500,314,51,0,Math.PI*2); ctx.stroke();
      path(ctx, [[385,390],[318,514],[424,461]], false);
      path(ctx, [[615,390],[682,514],[576,461]], false);
      ctx.beginPath(); ctx.moveTo(458,475); ctx.quadraticCurveTo(436,534,500,618);
      ctx.quadraticCurveTo(564,534,542,475); ctx.stroke();
      [[220,215],[740,160],[797,483],[215,507]].forEach(function (point) {
        var x = point[0], y = point[1];
        path(ctx, [[x-21,y],[x+21,y]], false);
        path(ctx, [[x,y-21],[x,y+21]], false);
      });
    }
  }

  function paintPaper(ctx, kind, width, height) {
    var paper = O.papers[0], i, x, y;
    for (i = 0; i < O.papers.length; i++) if (O.papers[i][0] === kind) paper = O.papers[i];
    ctx.save();
    ctx.fillStyle = paper[3];
    ctx.fillRect(0, 0, width, height);
    ctx.scale(width / 1000, height / 700);
    ctx.strokeStyle = '#dfd8eb'; ctx.fillStyle = '#c5b9d6'; ctx.lineWidth = 1.8;
    if (kind === 'dots') {
      ctx.beginPath();
      for (x = 25; x < 1000; x += 50) for (y = 25; y < 700; y += 50) {
        ctx.moveTo(x + 3, y); ctx.arc(x, y, 3, 0, Math.PI * 2);
      }
      ctx.fill();
    } else if (kind === 'lines' || kind === 'grid') {
      for (y = 50; y < 700; y += 50) path(ctx, [[0,y],[1000,y]], false);
      if (kind === 'grid') for (x = 50; x < 1000; x += 50) path(ctx, [[x,0],[x,700]], false);
    } else if (kind === 'garden' || kind === 'fish' || kind === 'rocket') colouring(ctx, kind);
    ctx.restore();
  }

  function photo(id, done) {
    var item = O.photos.items[id];
    if (!item) return null;
    var entry = images[id];
    if (!entry) {
      var img = new w.Image();
      entry = images[id] = { image: img, state: 'loading', callbacks: [] };
      function settle(state) {
        entry.state = state;
        var callbacks = entry.callbacks;
        entry.callbacks = [];
        callbacks.forEach(function (cb) { cb(state === 'ready'); });
      }
      img.onload = function () { settle('ready'); };
      img.onerror = function () { delete images[id]; settle('error'); };
      img.src = '../../../' + item.image;
    }
    if (entry.state === 'loading' && done && entry.callbacks.indexOf(done) === -1) entry.callbacks.push(done);
    return entry;
  }

  function ready(pages, done) {
    var ids = {}, pending = 0, ok = true, settled = false, timer;
    pages.forEach(function (page) {
      page.commands.forEach(function (cmd) { if (cmd.type === 'photo') ids[cmd.kind] = true; });
    });
    var keys = Object.keys(ids);
    if (!keys.length) { done(true); return; }
    pending = keys.length;
    function finish(loaded) {
      if (settled) return;
      ok = ok && loaded;
      if (--pending) return;
      settled = true;
      clearTimeout(timer);
      done(ok);
    }
    timer = setTimeout(function () { if (!settled) { settled = true; done(false); } }, 6500);
    keys.forEach(function (id) {
      var entry = photo(id, finish);
      if (!entry || entry.state !== 'loading') finish(!!entry && entry.state === 'ready');
    });
  }

  function stampPhoto(ctx, c, width, height, refresh) {
    var entry = photo(c.kind, refresh), size = c.size * width, x = c.x * width, y = c.y * height;
    ctx.save();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#d7cae7'; ctx.lineWidth = Math.max(1, width / 500);
    ctx.shadowBlur = width / 170; ctx.shadowColor = 'rgba(44,36,72,.26)';
    ctx.fillRect(x - size/2, y - size/2, size, size);
    ctx.shadowBlur = 0;
    ctx.strokeRect(x - size/2, y - size/2, size, size);
    if (entry && entry.state === 'ready') {
      var img = entry.image, scale = size * .93 / Math.max(img.naturalWidth, img.naturalHeight);
      var iw = img.naturalWidth * scale, ih = img.naturalHeight * scale;
      ctx.drawImage(img, x-iw/2, y-ih/2, iw, ih);
    } else P.stamp(ctx, 'star', x, y, size * .52, '#d9cbea');
    ctx.restore();
  }

  function shape(ctx, cmd, width, height) {
    var x = cmd.x * width, y = cmd.y * height, x2 = cmd.x2 * width, y2 = cmd.y2 * height;
    var left = Math.min(x,x2), right = Math.max(x,x2), top = Math.min(y,y2), bottom = Math.max(y,y2);
    var cx = (x+x2)/2, cy = (y+y2)/2;
    ctx.save();
    ctx.strokeStyle = ctx.fillStyle = cmd.color;
    ctx.lineWidth = Math.max(1.5, cmd.width * width / 1000);
    ctx.lineJoin = ctx.lineCap = 'round';
    if (cmd.kind === 'line') { P.segment(ctx,{x:x,y:y},{x:x2,y:y2}); ctx.restore(); return; }
    ctx.beginPath();
    if (cmd.kind === 'circle' || cmd.kind === 'oval') {
      var rx = Math.max(1, (right-left)/2), ry = Math.max(1, (bottom-top)/2);
      if (cmd.kind === 'circle') rx = ry = Math.max(rx,ry);
      ellipse(ctx,cx,cy,rx,ry);
    } else if (cmd.kind === 'triangle') {
      ctx.moveTo(cx,top); ctx.lineTo(right,bottom); ctx.lineTo(left,bottom);
    } else if (cmd.kind === 'diamond') {
      ctx.moveTo(cx,top); ctx.lineTo(right,cy); ctx.lineTo(cx,bottom); ctx.lineTo(left,cy);
    } else {
      var side = Math.max(right-left,bottom-top);
      ctx.rect(cx-side/2,cy-side/2,side,side);
    }
    ctx.closePath();
    if (cmd.filled) ctx.fill(); else ctx.stroke();
    ctx.restore();
  }

  function tint(hex, mix) {
    var value = parseInt(hex.slice(1), 16), rgb = [];
    for (var i = 16; i >= 0; i -= 8) rgb.push(Math.round(((value >> i) & 255) * mix + 255 * (1 - mix)));
    return 'rgb(' + rgb.join(',') + ')';
  }

  function stroke(ctx, cmd, width, height, from, mirrored) {
    var points = cmd.points;
    if (!cmd.brush) {
      P.line(ctx, points, { width: width, height: height, penWidth: cmd.width * width / 1000, color: cmd.color, erase: cmd.erase, smooth: true });
      return;
    }
    ctx.save();
    if (mirrored) { ctx.translate(width,0); ctx.scale(-1,1); }
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = cmd.erase ? 'destination-out' : 'source-over';
    var pen = Math.max(1.2, cmd.width * width / 1000), p, previous, prior, i;
    var ink = cmd.brush === 'marker' ? tint(cmd.color,.48) : cmd.brush === 'chalk' ? tint(cmd.color,.77) : cmd.color;
    if (!from) {
      ctx.fillStyle = cmd.brush === 'rainbow' ? spectrum[0] : ink;
      ctx.beginPath(); ctx.arc(points[0].x*width, points[0].y*height, pen/2, 0, Math.PI*2); ctx.fill();
    }
    for (i = Math.max(1,from); i < points.length; i++) {
      p = points[i]; previous = points[i-1]; prior = points[i-2] || previous;
      ctx.strokeStyle = cmd.brush === 'rainbow' ? spectrum[Math.floor(i/4) % spectrum.length] : ink;
      ctx.lineWidth = cmd.brush === 'chalk' ? pen * (.64 + (i % 4) * .09) : pen;
      ctx.beginPath(); ctx.moveTo(previous.x*width,previous.y*height);
      var reach = Math.sqrt(Math.pow((p.x-previous.x)*width,2)+Math.pow((p.y-previous.y)*height,2));
      var headingX = (previous.x-prior.x)*width, headingY = (previous.y-prior.y)*height;
      var bend = Math.min(.34, reach / Math.max(1,Math.sqrt(headingX*headingX+headingY*headingY)) * .34);
      ctx.quadraticCurveTo(previous.x*width+headingX*bend, previous.y*height+headingY*bend,p.x*width,p.y*height);
      ctx.stroke();
    }
    ctx.restore();
    if (cmd.mirror && !mirrored) stroke(ctx, cmd, width, height, from, true);
  }

  function draw(ctx, cmd, width, height, refresh) {
    if (cmd.type === 'stroke') stroke(ctx,cmd,width,height,0,false);
    if (cmd.type === 'stamp') P.stamp(ctx,cmd.kind,cmd.x*width,cmd.y*height,cmd.size*width,cmd.color);
    if (cmd.type === 'photo') stampPhoto(ctx,cmd,width,height,refresh);
    if (cmd.type === 'shape') shape(ctx,cmd,width,height);
  }

  function picture(canvas, commands, refresh) {
    var width = canvas.width, height = canvas.height, ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,width,height);
    commands.forEach(function (cmd) { draw(ctx,cmd,width,height,refresh); });
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    paintPaper(ctx,paperKind(commands),width,height);
    ctx.restore();
  }

  // Legacy digitizers can report one moving pen as a succession of very short contacts.
  // Preserve the original stroke only while the next contact is near, recent and compatible.
  function canJoin(end, point, mode, now) {
    if (!end || !mode.repair || !end.repair || end.type !== mode.type || end.style !== mode.style) return false;
    if (end.type === 'pen' && !end.cancelled) return false;
    var dt = now - end.at, dx = point.px - end.point.px, dy = point.py - end.point.py;
    var distance = Math.sqrt(dx*dx + dy*dy), limit = end.cancelled ? 56 : end.moves ? 30 : 22;
    if (distance > Math.min(limit, point.board * .09) || dt < 0 || dt > (end.cancelled ? 231 : end.moves ? 150 : 95)) return false;
    if (!end.heading || distance <= 4) return true;
    return (dx*end.heading.x + dy*end.heading.y) >= -.2*distance*end.heading.length;
  }

  function bind(canvas, commands, config) {
    var ctx = canvas.getContext('2d'), back = config.paper, overlay = config.overlay;
    var frame = null, rect = null, active = null, shapeDraft = null, rendered = 0, rebuild = false;
    var end = null, input = null, lastTouch = 0, listeners = [], dead = false, refreshAfter = false;
    var passive = false;
    try {
      var value = Object.defineProperty({},'passive',{get:function () { passive = true; return false; }});
      w.addEventListener('studio-passive', noop, value); w.removeEventListener('studio-passive', noop, value);
    } catch (ignore) {}
    function noop() {}
    function on(el, name, fn, touch, capture) {
      var opts = touch && passive ? { passive:false,capture:!!capture } : !!capture;
      el.addEventListener(name,fn,opts); listeners.push([el,name,fn,opts]);
    }
    function render() {
      if (dead) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if (back) {
        var bg = back.getContext('2d'); bg.clearRect(0,0,back.width,back.height);
        paintPaper(bg,paperKind(commands),back.width,back.height);
      }
      commands.forEach(function (cmd) { draw(ctx,cmd,canvas.width,canvas.height,imageArrived); });
      rendered = active ? active.points.length : 0;
      rebuild = false;
      paintOverlay();
    }
    function imageArrived(ok) { if (ok && !dead) render(); }
    function paintOverlay() {
      if (!overlay) return;
      var front = overlay.getContext('2d');
      front.clearRect(0,0,overlay.width,overlay.height);
      if (shapeDraft) shape(front,shapeDraft,overlay.width,overlay.height);
    }
    function flush() {
      frame = null;
      if (dead) return;
      if (rebuild) { render(); return; }
      if (active && active.points.length > rendered) {
        stroke(ctx,active,canvas.width,canvas.height,rendered,false);
        rendered = active.points.length;
      }
      if (shapeDraft) paintOverlay();
    }
    function queue() { if (frame === null) frame = clock.call(w,flush); }
    function flushNow() { if (frame !== null) cancelFrame.call(w,frame); flush(); }
    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var scale = Math.min(config.legacy ? 1.2 : 2, w.devicePixelRatio || 1, 1800/r.width, 1300/r.height);
      var width = Math.max(1,Math.round(r.width*scale)), height = Math.max(1,Math.round(r.height*scale));
      if (canvas.width === width && canvas.height === height) return;
      if (input) { refreshAfter = true; return; }
      end = null;
      canvas.width = width; canvas.height = height;
      if (back) { back.width = width; back.height = height; }
      if (overlay) { overlay.width = width; overlay.height = height; }
      render();
    }
    function position(event) {
      var px = event.clientX - rect.left, py = event.clientY - rect.top;
      return { x:Math.max(0,Math.min(1,px/rect.width)), y:Math.max(0,Math.min(1,py/rect.height)), px:px, py:py, board:Math.min(rect.width,rect.height) };
    }
    function first(event, id, type) {
      if (input || dead) return;
      rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var point = position(event), setting = config.settings();
      var style = [setting.tool,setting.color,setting.width,setting.mirror].join(':');
      var continuous = setting.tool !== 'stamp' && setting.tool !== 'photo' && setting.tool !== 'shape';
      var mode = { type:type, style:style, repair:continuous && setting.repair && (type === 'touch-legacy' || type === 'pen') };
      var joined = canJoin(end, point, mode, Date.now()) && commands[commands.length-1] === end.command;
      if (!joined && commands.length >= 600) { config.limit(); return; }
      input = { id:id, mode:mode, last:point, first:point, heading:null, moves:0 };
      if (config.start) config.start();
      if (!continuous) {
        end = null;
        var cmd = { type:setting.tool, kind:setting.kind, x:point.x, y:point.y, color:setting.color };
        if (cmd.type === 'shape') {
          cmd.x2 = point.x; cmd.y2 = point.y; cmd.width = setting.width; cmd.filled = setting.filled;
          shapeDraft = cmd; queue();
        } else {
          cmd.size = setting.size; commands.push(cmd);
          draw(ctx,cmd,canvas.width,canvas.height,imageArrived); config.change();
        }
        return;
      }
      if (joined) {
        active = end.command; rendered = active.points.length;
        input.last = end.point; input.heading = end.heading; append(point);
      } else {
        active = { type:'stroke', points:[{ x:point.x,y:point.y }], color:setting.color, width:setting.width, brush:setting.tool, erase:setting.tool === 'eraser', mirror:setting.mirror };
        commands.push(active); rendered = 0; queue();
      }
      end = null;
    }
    function append(p) {
      var points = active.points, dx = p.px-input.last.px, dy = p.py-input.last.py;
      var distance = Math.sqrt(dx*dx+dy*dy);
      if (distance < .65 || (input.mode.type === 'touch-legacy' && distance > 200)) return;
      if (p.x === points[points.length-1].x && p.y === points[points.length-1].y) return;
      if (points.length >= 1600) {
        active.points = points.filter(function (point, i) { return i % 2 === 0 || i === points.length - 1; });
        rebuild = true;
      }
      active.points.push({x:p.x,y:p.y});
      if (distance >= 3) input.heading = { x:dx,y:dy,length:distance };
      input.last = p; input.moves++; queue();
    }
    function move(event) {
      if (!input || !isFinite(event.clientX) || !isFinite(event.clientY)) return;
      var p = position(event);
      if (active) append(p);
      if (shapeDraft) { shapeDraft.x2 = p.x; shapeDraft.y2 = p.y; input.last = p; queue(); }
    }
    function finish(event, cancelled, breakJoin) {
      if (breakJoin) end = null;
      if (!input) return;
      if (event && !cancelled) move(event);
      flushNow();
      if (active) {
        if (!breakJoin) end = { repair:input.mode.repair, type:input.mode.type, style:input.mode.style, point:input.last, command:active, moves:input.moves, heading:input.heading, at:Date.now(), cancelled:cancelled };
        active = null; config.change();
      }
      if (shapeDraft) {
        if (!cancelled || Math.abs(input.first.px-input.last.px) + Math.abs(input.first.py-input.last.py) > 6) {
          if (Math.abs(input.first.px-input.last.px) + Math.abs(input.first.py-input.last.py) < 7) {
            var size = config.settings().size * .45, c = shapeDraft;
            var sy = size * rect.width/rect.height;
            var cx = Math.max(size,Math.min(1-size,c.x)), cy = Math.max(sy,Math.min(1-sy,c.y));
            c.x = cx-size; c.x2 = cx+size; c.y = cy-sy; c.y2 = cy+sy;
            if (c.kind === 'line') { c.y = cy; c.y2 = cy; }
          }
          commands.push(shapeDraft); draw(ctx,shapeDraft,canvas.width,canvas.height,imageArrived); config.change();
        }
        shapeDraft = null; paintOverlay();
      }
      input = null;
      if (refreshAfter) { refreshAfter = false; resize(); }
    }
    function touch(list, id) {
      for (var i = 0; list && i < list.length; i++) if (list[i].identifier === id) return list[i];
      return null;
    }
    if (w.PointerEvent && !config.legacy) {
      on(canvas,'pointerdown',function (e) {
        e.preventDefault();
        if (e.button !== 0 || e.isPrimary === false || input) return;
        first(e,e.pointerId,e.pointerType);
        if (input && canvas.setPointerCapture) try { canvas.setPointerCapture(e.pointerId); } catch (ignore) {}
      });
      on(w,'pointermove',function (e) {
        if (!input || input.id !== e.pointerId) return;
        if (input.mode.type === 'mouse' && e.buttons === 0) { finish(null,true,true); return; }
        var points = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
        for (var i = 0; i < points.length; i++) move(points[i]);
        move(e);
      });
      on(w,'pointerup',function (e) { if (input && input.id === e.pointerId) finish(e,false,false); });
      on(w,'pointercancel',function (e) { if (input && input.id === e.pointerId) finish(null,true,false); });
      on(canvas,'lostpointercapture',function (e) { if (input && input.id === e.pointerId) finish(null,true,false); });
    } else {
      // The site's old-browser swipe guard captures touchend on document. The canvas
      // owns its touches, so handle them on window before the navigation guard sees them.
      function boardTouch(name, handle) {
        on(w,name,function (e) {
          if (e.target !== canvas) return;
          e.preventDefault(); e.stopPropagation(); handle(e);
        },true,true);
      }
      boardTouch('touchstart',function (e) {
        lastTouch = Date.now();
        if (!input && e.touches.length === 1 && e.changedTouches.length) {
          first(e.changedTouches[0],e.changedTouches[0].identifier,'touch-legacy');
        }
      });
      boardTouch('touchmove',function (e) {
        var t = input && touch(e.touches,input.id);
        if (t) move(t);
      });
      function endTouch(e, cancelled) {
        lastTouch = Date.now();
        if (!input || input.mode.type !== 'touch-legacy') return;
        var t = touch(e.changedTouches,input.id);
        if (t || !touch(e.touches,input.id)) finish(t,cancelled,false);
      }
      boardTouch('touchend',function (e) { endTouch(e,false); });
      boardTouch('touchcancel',function (e) { endTouch(e,true); });
      on(canvas,'mousedown',function (e) {
        if (e.button !== 0 || Date.now()-lastTouch < 750) return;
        e.preventDefault(); first(e,'mouse','mouse');
      });
      on(w,'mousemove',function (e) { if (input && input.id === 'mouse') move(e); });
      on(w,'mouseup',function (e) { if (input && input.id === 'mouse') finish(e,false,true); });
    }
    on(canvas,'contextmenu',function (e) { e.preventDefault(); });
    on(w,'blur',function () { finish(null,true,true); });
    resize(); render();
    return {
      finish:function () { finish(null,true,true); },
      isDrawing:function () { return !!input; },
      resize:resize,
      refresh:function () { finish(null,true,true); render(); },
      destroy:function () {
        finish(null,true,true); dead = true;
        if (frame !== null) cancelFrame.call(w,frame);
        listeners.forEach(function (row) { row[0].removeEventListener(row[1],row[2],row[3]); });
      }
    };
  }

  w.STUDIO_BOARD = { bind:bind,picture:picture,ready:ready,paintPaper:paintPaper,paperKind:paperKind };
})(window,document);
