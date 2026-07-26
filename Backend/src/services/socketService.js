let io = null;

function setIO(instance) {
  io = instance;
}

function getIO() {
  return io;
}

function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(String(userId)).emit(event, data);
  }
}

function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  setIO,
  getIO,
  emitToUser,
  emitToAll,
};
