import WebSocket from "ws";
import axios from "axios";

let isWebSocketActive = false;
let httpPollInterval: NodeJS.Timeout | null = null;

// Try WebSocket connection (UPGRADE to real-time)
function connectWebSocket() {
  console.log('⬆️  UPGRADE: Attempting WebSocket connection...\n');
  
  const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
  
  ws.on('open', () => {
    isWebSocketActive = true;
    console.log('✅ WebSocket UPGRADED - Real-time streaming active\n');
    
    // Stop HTTP polling if active
    if (httpPollInterval) {
      clearInterval(httpPollInterval);
      httpPollInterval = null;
    }
  });
  
  ws.on('message', (data) => {
    const trade = JSON.parse(data.toString());
    console.log(`[WS] BTC: $${parseFloat(trade.p).toLocaleString()} | Qty: ${trade.q} | ${new Date(trade.T).toLocaleTimeString()}`);
  });
  
  ws.on('close', () => {
    isWebSocketActive = false;
    console.log('\n⬇️  DOWNGRADE: WebSocket closed, falling back to HTTP polling...\n');
    startHttpPolling();
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket Error:', error.message);
    console.log('⬇️  DOWNGRADE: WebSocket failed, falling back to HTTP polling...\n');
    startHttpPolling();
  });
  
  // Auto-close WebSocket after 10 seconds to demonstrate downgrade
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('\n⏰ Simulating connection loss...');
      ws.close();
    }
  }, 1000);
}

// Fallback HTTP polling (DOWNGRADE from real-time)
async function startHttpPolling() {
  if (httpPollInterval) return; // Already polling
  
  console.log('📡 HTTP Polling started (every 3 seconds)\n');
  
  const fetchPrice = async () => {
    try {
      const response = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      const price = parseFloat(response.data.price);
      console.log(`[HTTP] BTC: $${price.toLocaleString()} | ${new Date().toLocaleTimeString()}`);
    } catch (error: any) {
      console.error('HTTP polling error:', error.message);
    }
  };
  
  // Fetch immediately
  await fetchPrice();
  
  // Then poll every 3 seconds
  httpPollInterval = setInterval(fetchPrice, 3000);
}

// Start with WebSocket (upgraded connection)
connectWebSocket(); 