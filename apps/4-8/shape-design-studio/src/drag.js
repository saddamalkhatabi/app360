/* One gesture path for mouse, pen and touch, with a Touch Events fallback. */
(function (root, doc) {
  'use strict';

  function install(adapter) {
    var active = null, gate = null, ignoreMouseUntil = 0;
    var options = { capture: true, passive: false };

    function start(event, point, id, source) {
      if (active) return;
      gate = null;
      var item = adapter.pick(event.target, point.clientX, point.clientY);
      if (!item) return;
      active = { item: item, id: id, source: source, x: point.clientX, y: point.clientY, moved: false };
      if (source === 'pointer' && event.target.setPointerCapture) {
        try { event.target.setPointerCapture(id); } catch (error) { /* Document listeners still receive moves. */ }
      }
    }

    function move(event, point, id) {
      if (!active || active.id !== id) return;
      var dx = point.clientX - active.x, dy = point.clientY - active.y;
      if (!active.moved && dx * dx + dy * dy < 25) return;
      active.moved = true;
      if (event.cancelable) event.preventDefault();
      adapter.preview(active.item, point.clientX, point.clientY);
    }

    function end(event, point, id, cancelled) {
      if (!active || active.id !== id) return;
      var gesture = active;
      active = null;
      adapter.clear();
      if (!gesture.moved) return;
      var x = point ? point.clientX : gesture.x, y = point ? point.clientY : gesture.y;
      gate = { time: Date.now(), x: x, y: y, fromX: gesture.x, fromY: gesture.y };
      if (event && event.cancelable) event.preventDefault();
      if (!cancelled) adapter.drop(gesture.item, x, y);
    }

    function cancel() {
      if (active) end(null, null, active.id, true);
    }

    function touch(event) {
      for (var i = 0; i < event.changedTouches.length; i++) {
        var point = event.changedTouches[i];
        if (!active || active.id === point.identifier) return point;
      }
      return null;
    }

    if (root.PointerEvent) {
      doc.addEventListener('pointerdown', function (e) {
        if (e.button === 0 && e.isPrimary !== false) start(e, e, e.pointerId, 'pointer');
      }, true);
      doc.addEventListener('pointermove', function (e) { move(e, e, e.pointerId); }, options);
      doc.addEventListener('pointerup', function (e) { end(e, e, e.pointerId, false); }, true);
      doc.addEventListener('pointercancel', function (e) { end(e, e, e.pointerId, true); }, true);
      doc.addEventListener('lostpointercapture', function (e) { end(e, e, e.pointerId, true); }, true);
    } else {
      doc.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1 && e.changedTouches.length)
          start(e, e.changedTouches[0], e.changedTouches[0].identifier, 'touch');
        else if (active && active.source === 'touch') cancel();
      }, options);
      doc.addEventListener('touchmove', function (e) {
        var point = active && active.source === 'touch' && touch(e);
        if (point) move(e, point, point.identifier);
      }, options);
      ['touchend', 'touchcancel'].forEach(function (type) {
        doc.addEventListener(type, function (e) {
          var point = active && active.source === 'touch' && touch(e);
          if (!point) return;
          if (active.moved) ignoreMouseUntil = Date.now() + 700;
          end(e, point, point.identifier, type === 'touchcancel');
        }, options);
      });
      doc.addEventListener('mousedown', function (e) {
        if (e.button === 0 && Date.now() >= ignoreMouseUntil) start(e, e, 'mouse', 'mouse');
      }, true);
      doc.addEventListener('mousemove', function (e) { move(e, e, 'mouse'); }, true);
      doc.addEventListener('mouseup', function (e) { end(e, e, 'mouse', false); }, true);
    }

    doc.addEventListener('click', function (e) {
      if (!gate || Date.now() - gate.time > 600 || e.detail === 0) return;
      function near(x, y) { return Math.abs(e.clientX - x) < 28 && Math.abs(e.clientY - y) < 28; }
      if (near(gate.x, gate.y) || near(gate.fromX, gate.fromY)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        gate = null;
      }
    }, true);
    doc.addEventListener('dragstart', function (e) { if (active) e.preventDefault(); }, true);
    root.addEventListener('blur', cancel, false);
    root.addEventListener('resize', cancel, false);
    return { cancel: cancel };
  }

  root.SHAPE_DRAG = { install: install };
})(window, document);
