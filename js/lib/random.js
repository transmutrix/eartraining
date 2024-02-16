
export function shuffle(arr) {
  let i = arr.length;
  let j;
  while (i > 0) {
    j = Math.floor(Math.random() * i);
    i -= 1;
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return array;
}

export class RandomBag {
  _baseList = [];
  _bag = [];

  constructor(list) {
    if (list.length !== 0) {
      this._baseList = list.slice();
      this.fillBag();
    }
  }

  fillBag() {
    this._bag = this._baseList.slice();
    this._bag.shuffle();
  }

  next() {
    if (this._bag.length === 0)  this.fillBag();
    return this._bag.shift();
  }

  remove(thing) {
    let i = this._baseList.indexOf(thing);
    if (i !== -1)  this._baseList.splice(i);
    i = this._bag.indexOf(thing);
    if (i !== -1)  this._bag.splice(i);
  }
}
