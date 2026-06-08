export const queueOfflineRequest = (url: string, options: RequestInit) => {
  const queue = JSON.parse(localStorage.getItem('pulse_offline_queue') || '[]');
  queue.push({
    url,
    method: options.method || 'GET',
    headers: options.headers,
    body: options.body,
    timestamp: Date.now()
  });
  localStorage.setItem('pulse_offline_queue', JSON.stringify(queue));
};

export const syncOfflineQueue = async () => {
  const queue = JSON.parse(localStorage.getItem('pulse_offline_queue') || '[]');
  if (queue.length === 0) return;

  const failedSyncs = [];
  
  for (const req of queue) {
    try {
      await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
    } catch(err) {
      failedSyncs.push(req);
    }
  }

  localStorage.setItem('pulse_offline_queue', JSON.stringify(failedSyncs));
};

export const setupOfflineSync = () => {
  window.addEventListener('online', () => {
    console.log('We are online! Syncing background queue...');
    syncOfflineQueue();
  });
};
