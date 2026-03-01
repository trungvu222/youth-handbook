// SSE (Server-Sent Events) manager for real-time attendance updates
// When a user checks in, this broadcasts to all connected admin clients

const EventEmitter = require('events');

const attendanceEmitter = new EventEmitter();
attendanceEmitter.setMaxListeners(100); // Allow many concurrent admin connections

// Store connected SSE clients
const sseClients = new Set();

/**
 * Add a new SSE client (admin) connection
 */
function addClient(res) {
  sseClients.add(res);
  console.log(`[SSE] Client connected. Total: ${sseClients.size}`);
}

/**
 * Remove a disconnected SSE client
 */
function removeClient(res) {
  sseClients.delete(res);
  console.log(`[SSE] Client disconnected. Total: ${sseClients.size}`);
}

/**
 * Broadcast a check-in event to all connected admin clients
 * @param {Object} data - { activityId, userId, userName, activityTitle, checkInTime }
 */
function broadcastCheckin(data) {
  const message = `data: ${JSON.stringify({ type: 'checkin', ...data })}\n\n`;
  let sent = 0;
  sseClients.forEach(res => {
    try {
      res.write(message);
      sent++;
    } catch (err) {
      // Client disconnected, remove it
      sseClients.delete(res);
    }
  });
  if (sent > 0) {
    console.log(`[SSE] Broadcasted checkin event to ${sent} clients:`, data.userName);
  }
}

module.exports = {
  attendanceEmitter,
  addClient,
  removeClient,
  broadcastCheckin,
  sseClients
};
