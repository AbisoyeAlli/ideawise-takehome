import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkChangeCallback = (isConnected: boolean) => void;

class NetworkMonitor {
  private isConnected: boolean = true;
  private listeners: Set<NetworkChangeCallback> = new Set();
  private unsubscribe: (() => void) | null = null;

  /**
   * Initialize network monitoring
   */
  initialize(): void {
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;

      // Notify listeners if connection state changed
      if (wasConnected !== this.isConnected) {
        this.notifyListeners();
      }
    });

    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      this.isConnected = state.isConnected ?? false;
    });
  }

  /**
   * Clean up network monitoring
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
  }

  /**
   * Check if device is currently connected to network
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get detailed network state
   */
  async getNetworkState(): Promise<NetInfoState> {
    return await NetInfo.fetch();
  }

  /**
   * Subscribe to network state changes
   */
  addListener(callback: NetworkChangeCallback): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of network state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.isConnected);
      } catch (error) {
        if (__DEV__) {
          console.error('Error in network listener:', error);
        }
      }
    });
  }

  /**
   * Wait for network connection
   * Returns a promise that resolves when connected
   */
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.addListener((isConnected) => {
        if (isConnected) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }
}

export const networkMonitor = new NetworkMonitor();
