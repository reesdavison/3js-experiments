/*
The intuition for this codes comes from 
https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/introduction-to-octrees-r3529/#:~:text=Some%20implementations%20of%20an%20Octree,then%20prefer%20the%20simple%20technique.
*/

import { setBitMaskPos, testBitMaskPos } from "./helpers";

export class OctreeNode {
  constructor(bounds, collisionDetectFunc = () => {}, depth = 0, maxDepth = 5) {
    this.bounds = bounds; // { x, y, z, size }
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.objects = [];
    this.children = [];
    // let's us know which children have objects down those routes
    this.childBitMask = 0;
    this.collisionDetectFunc = collisionDetectFunc;
  }

  // _arrayPointToXYZ(arrayPoint) {
  //   return { x: arrayPoint[0], y: arrayPoint[1], z: arrayPoint[2] };
  // }

  // Check if a point is within the bounds of the node
  // contains(point) {
  //   const { x, y, z, size } = this.bounds;
  //   const _point = this._arrayPointToXYZ(point);
  //   return (
  //     _point.x >= x - size / 2 &&
  //     _point.x < x + size / 2 &&
  //     _point.y >= y - size / 2 &&
  //     _point.y < y + size / 2 &&
  //     _point.z >= z - size / 2 &&
  //     _point.z < z + size / 2
  //   );
  // }

  // Check if an object's bounds intersect with the node's bounds
  // intersects(bounds) {
  //   const { x, y, z, size } = this.bounds;
  //   const { x: ox, y: oy, z: oz, size: osize } = bounds;
  //   return !(
  //     ox - osize / 2 > x + size / 2 ||
  //     ox + osize / 2 < x - size / 2 ||
  //     oy - osize / 2 > y + size / 2 ||
  //     oy + osize / 2 < y - size / 2 ||
  //     oz - osize / 2 > z + size / 2 ||
  //     oz + osize / 2 < z - size / 2
  //   );
  // }

  containsObjectPerfectly(bounds) {
    const { x, y, z, size } = this.bounds;
    const { x: ox, y: oy, z: oz, size: osize } = bounds;

    const ohalf = osize / 2;
    const half = size / 2;
    return (
      ox - ohalf >= x - half &&
      ox + ohalf < x + half &&
      oy - ohalf >= y - half &&
      oy + ohalf < y + half &&
      oz - ohalf >= z - half &&
      oz + ohalf < z + half
    );
  }

  // Subdivide the node into 8 children
  subdivide() {
    const { x, y, z, size } = this.bounds;
    const newSize = size / 2;
    for (let i = 0; i < 8; i++) {
      const offsetX = ((i & 1 ? 1 : -1) * newSize) / 2;
      const offsetY = ((i & 2 ? 1 : -1) * newSize) / 2;
      const offsetZ = ((i & 4 ? 1 : -1) * newSize) / 2;
      const newBounds = {
        x: x + offsetX,
        y: y + offsetY,
        z: z + offsetZ,
        size: newSize,
      };
      this.children.push(
        new OctreeNode(
          newBounds,
          this.collisionDetectFunc,
          this.depth + 1,
          this.maxDepth
        )
      );
    }
  }

  // addObject(object) {
  //   this.objects.push(object);
  //   this.hasObjects
  // }

  // Insert an object into the node
  insert(object) {
    if (this.depth >= this.maxDepth) {
      this.objects.push(object);
      return;
    }

    if (this.children.length === 0) {
      this.subdivide();
    }

    let belongsToChild = false;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (child.containsObjectPerfectly(object.getBounds(object))) {
        child.insert(object);
        belongsToChild = true;
        this.childBitMask = setBitMaskPos(this.childBitMask, i);
        break;
      }
    }

    // Scene objects need to be completely included within the outer bounds of
    // the Octree for this to work
    if (
      !belongsToChild &&
      this.containsObjectPerfectly(object.getBounds(object))
    ) {
      this.objects.push(object);
    }
  }

  checkCollisions(parentObjects = []) {
    /* Returns a list of collisions ie
      { 
        collide: true, 
        normal: [1, 0, 0], 
        obj1Closest: [1, 1, 1], 
        obj2Closest: [2, 2, 2],
      }

      Check objects all at the node first against each other
      Then check nodes at the object against all parent objects
      as in the diagram to avoid rechecking many times
    */

    // check for collisions at current node
    const collisions = [];
    let numChecks = 0;
    // aiming for upper triangle of object matrix
    // dont want to perform collision checks on same object
    // dont want to check twice for collisions which objects reversed
    if (this.objects.length >= 2) {
      for (let i = 1; i < this.objects.length; i++) {
        for (let j = 0; j < i; j++) {
          const objI = this.objects[i];
          const objJ = this.objects[j];
          if (objI.fixed && objJ.fixed) {
            continue;
          }
          const collision = this.collisionDetectFunc(objI, objJ);
          numChecks++;
          const { collide } = collision;
          if (collide) {
            collisions.push(collision);
          }
        }
      }
    }

    // check parent objects against node objects
    for (const parentObj of parentObjects) {
      for (const curObj of this.objects) {
        if (parentObj.fixed && curObj.fixed) {
          continue;
        }
        const collision = this.collisionDetectFunc(parentObj, curObj);
        numChecks++;
        const { collide } = collision;
        if (collide) {
          collisions.push(collision);
        }
      }
    }

    // check for collisions at children
    const childCollisions = [];
    for (let i = 0; i < this.children.length; i++) {
      if (testBitMaskPos(this.childBitMask, i)) {
        const child = this.children[i];
        const { collisions: newCollisions, numChecks: newNumChecks } =
          child.checkCollisions([...parentObjects, ...this.objects]);
        numChecks = numChecks + newNumChecks;
        childCollisions.push(newCollisions);
      }
    }
    return {
      collisions: [...collisions, ...childCollisions.flat()],
      numChecks,
    };
  }
}
