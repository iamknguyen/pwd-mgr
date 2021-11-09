import uuid4 from 'uuid4'

export class Uuid {
  static getId() {
    return uuid4();
  }
  static generateRowId(shardId /* range 0-64 for shard/slot */) {
    var CUSTOMEPOCH = 1300000000000; // artificial epoch
    var ts = new Date().getTime() - CUSTOMEPOCH; // limit to recent
    var randid = Math.floor(Math.random() * 512);
    ts = (ts * 64);   // bit-shift << 6
    ts = ts + shardId;
    return (ts * 512) + randid;
  }
}