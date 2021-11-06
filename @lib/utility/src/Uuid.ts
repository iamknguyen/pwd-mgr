import uuid4 from 'uuid4'

export class Uuid {
  static getId() {
    return uuid4();
  }
}