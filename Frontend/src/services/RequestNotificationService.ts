// Store lưu trữ các request từ khách phía POS
type RequestListener = (data: CustomerRequest) => void;

export interface CustomerRequest {
  id: string;
  tableId: number;
  requestType: string;
  requestCode: string;
  note: string;
  timestamp: number;
  status: 'pending' | 'seen' | 'completed';
}

class RequestNotificationService {
  private listeners: RequestListener[] = [];
  private requests: Map<string, CustomerRequest> = new Map();

  // Subscribe to receive notifications
  subscribe(listener: RequestListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Broadcast notification to all listeners (POS screens)
  notifyRequest(request: CustomerRequest) {
    this.requests.set(request.id, request);
    this.listeners.forEach((listener) => listener(request));
  }

  // Get all pending requests
  getPendingRequests(): CustomerRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.status === 'pending');
  }

  // Mark as seen
  markAsSeen(requestId: string) {
    const request = this.requests.get(requestId);
    if (request) {
      request.status = 'seen';
      this.notifyRequest(request);
    }
  }

  // Mark as completed
  markAsCompleted(requestId: string) {
    const request = this.requests.get(requestId);
    if (request) {
      request.status = 'completed';
      this.notifyRequest(request);
    }
  }

  // Clear completed requests
  clearCompleted() {
    for (const [id, request] of this.requests.entries()) {
      if (request.status === 'completed') {
        this.requests.delete(id);
      }
    }
  }
}

export const requestNotificationService = new RequestNotificationService();
