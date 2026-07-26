import { io } from "socket.io-client";
import { useEffect, useRef } from "react";

const socket = io("/", {
  withCredentials: true,
  path: "/socket.io",
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 3000,
});

let joinCallback = null;

socket.on("connect", () => {
  const userId = localStorage.getItem("userId");
  if (userId && joinCallback) {
    joinCallback(userId);
  }
});

function setJoinCallback(cb) {
  joinCallback = cb;
}

function useSocketListener(event, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const wrappedHandler = (data) => handlerRef.current(data);
    socket.on(event, wrappedHandler);
    return () => socket.off(event, wrappedHandler);
  }, [event]);
}

export { useSocketListener, setJoinCallback };
export default socket;