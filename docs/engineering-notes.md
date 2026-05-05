# Engineering Notes

This demo began as a single-file experiment and was packaged as a small portfolio artifact so the implementation can be inspected and run locally.

## Core Implementation

- A regular particle grid represents the cloth surface.
- Motion uses a Verlet-style update: current position, previous position, accumulated force, then damped velocity.
- Structural constraints preserve horizontal and vertical spacing.
- Shear constraints reduce diagonal collapse under drag and wind.
- Bend constraints soften fold behavior across two-particle spans.
- A small Laplacian smoothing pass reduces jagged post-drag crumpling.
- Top grommet particles are anchored while the rest of the top edge can sag between supports.
- Pointer interaction raycasts against the mesh and pulls the nearest particle toward a drag plane.

## Texture Generation

The banner texture is generated at runtime with a 4096x2048 canvas:

- dark silk gradient
- subtle vertical silk grain
- stitched top and bottom hems
- grommet rings aligned to the physics anchor profile
- a procedural ribbon mark and label text

The mark is generated directly on the texture canvas so the demo does not depend on external image assets.

## What This Demonstrates

This is not meant to be a generic cloth engine. It is a focused interaction study that combines:

- WebGL rendering
- real-time geometry mutation
- constraint-based simulation
- procedural texture generation
- pointer-driven interaction
- visual tuning for a portfolio hero surface

## Known Limits

- The solver is optimized for one hero banner, not arbitrary cloth scenes.
- Collision handling is intentionally out of scope.
- The current build uses a fixed camera and brand composition.
- Mobile interaction is supported, but the most expressive behavior is desktop pointer drag.
