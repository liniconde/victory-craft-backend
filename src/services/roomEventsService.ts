type Listener = (event: Record<string, any>) => void;

class RoomEventsBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(roomId: string, listener: Listener) {
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set());
    }
    this.listeners.get(roomId)?.add(listener);

    return () => {
      this.listeners.get(roomId)?.delete(listener);
      if ((this.listeners.get(roomId)?.size || 0) === 0) {
        this.listeners.delete(roomId);
      }
    };
  }

  publish(roomId: string, event: Record<string, any>) {
    const roomListeners = this.listeners.get(roomId);
    if (!roomListeners) return;
    roomListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (_error) {
        // Do not break all listeners if one fails.
      }
    });
  }
}

export const roomEventsBus = new RoomEventsBus();
