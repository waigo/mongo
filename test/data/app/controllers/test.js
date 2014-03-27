exports.index = function*(next) {
  this.session.val = 1;
  this.body = {
    val: this.session.val
  };
};
