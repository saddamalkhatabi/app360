# Piece core

Consumers: a1-tangram and a4-shape-design. Extracted ray hit testing, inverse local coordinates and nearest compatible target preserve the original tangram formulas and tie ordering. That app keeps its original shapes and difficulty rules. New consumers can use quarter-turn transforms, reflection and lattice snapping without importing an app.

`rot` in `localPoint` is radians (legacy contract); `rot` in `transform` is integer quarter turns. `transform` mirrors before rotation, then normalizes bounding minima. No UI, storage or automatic piece placement is provided.
