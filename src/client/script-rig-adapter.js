export class ScriptRigAdapter {
  constructor(bones, sockets) {
    this.bones = new Map(Object.entries(bones));
    this.sockets = new Map(Object.entries(sockets));
  }

  getBone(name) {
    return this.bones.get(name) || null;
  }

  getSocket(name) {
    return this.sockets.get(name) || null;
  }
}
