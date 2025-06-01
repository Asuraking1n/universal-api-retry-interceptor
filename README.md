# 🌐 Universal API Retry Interceptor

<div align="center">

[![npm version](https://badge.fury.io/js/universal-api-retry-interceptor.svg)](https://www.npmjs.com/package/universal-api-retry-interceptor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Downloads](https://img.shields.io/npm/dm/universal-api-retry-interceptor.svg)](https://www.npmjs.com/package/universal-api-retry-interceptor)

**A bulletproof, universal API interceptor that automatically handles failed requests with intelligent retry logic and seamless offline support. Works with ANY HTTP library!**

[🚀 Quick Start](#-quick-start) • [🎮 Live Demo](#-live-demo) • [💡 Examples](#-examples) • [🤝 Contributing](#-contributing)

</div>


---

## ✨ Why Universal API Retry Interceptor?

In today's interconnected world, network failures are inevitable. Your users deserve applications that gracefully handle network hiccups without breaking their experience. This interceptor transforms your application into a resilient, self-healing system that automatically recovers from network failures.

### 🎯 **The Problem**
```javascript
// Without interceptor - One network hiccup breaks everything
fetch('/api/critical-data')
  .then(response => response.json())
  .then(data => updateUI(data))
  .catch(error => {
    // 💥 User sees error, experience ruined
    showErrorMessage("Something went wrong!");
  });
```

### ✅ **The Solution**
```javascript
// With interceptor - Automatically handles failures
startGlobalInterceptor({ maxRetries: 3, delayTime: 1000 });

// Same code, but now bulletproof!
fetch('/api/critical-data')
  .then(response => response.json())
  .then(data => updateUI(data)) // ✨ Just works, even after retries
  .catch(error => {
    // Only fails after 3 intelligent retry attempts
  });
```

---

## 🌟 Key Features

<table>
<tr>
<td width="50%">

### 🔧 **Universal Compatibility**
- ✅ **Fetch API** - Native browser requests
- ✅ **Axios** - Popular HTTP client
- ✅ **XMLHttpRequest** - Legacy and modern
- ✅ **jQuery.ajax** - Classic library
- ✅ **Any HTTP library** - Zero configuration needed

</td>
<td width="50%">

### 🧠 **Intelligent Retry Logic**
- 🎯 **Smart condition detection** - Only retries when appropriate
- ⏱️ **Configurable delays** - Prevent server overload
- 🔄 **Exponential backoff** - Built-in best practices
- 🛑 **Max retry limits** - Prevents infinite loops
- 📊 **Detailed callbacks** - Full visibility into retry process

</td>
</tr>
<tr>
<td width="50%">

### 📱 **Offline Resilience**
- 🔍 **Automatic offline detection** - Uses browser APIs
- 💾 **Request storage** - Queues failed requests
- 🔄 **Auto-resume** - Executes stored requests when back online
- 🎯 **Zero data loss** - Critical requests never disappear
- ⚡ **Instant recovery** - Seamless online transition

</td>
<td width="50%">

### 🛡️ **Production Ready**
- 🚀 **Zero dependencies** - Lightweight and secure
- 💪 **TypeScript support** - Full type safety
- 🌐 **Browser only** - Optimized for web applications
- 🔧 **Memory efficient** - No localStorage pollution
- 📈 **Battle tested** - Production proven

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Installation
```bash
npm install universal-api-retry-interceptor
```

### 30-Second Setup
```javascript
import { startGlobalInterceptor } from 'universal-api-retry-interceptor';

// One line to make ALL your HTTP requests bulletproof
startGlobalInterceptor({
  maxRetries: 3,        // Retry failed requests up to 3 times
  delayTime: 1000,      // Wait 1 second between retries
  retryInterval: 5000,  // Check for pending requests every 5 seconds
  enableLogging: true   // See what's happening (disable in production)
});

// That's it! Now ALL your existing HTTP code gets automatic retry logic:
fetch('/api/users');           // ✅ Auto-retried on failure
axios.get('/api/posts');       // ✅ Auto-retried on failure
$.ajax('/api/data');          // ✅ Auto-retried on failure
new XMLHttpRequest();         // ✅ Auto-retried on failure
```

---

## 🎮 Live Demo

**Experience the power yourself!** 

👉 **[Interactive Demo](https://demo-universal-api-retry-interceptor.netlify.app/)** - See the interceptor in action with real API calls, retry scenarios, and offline simulation.

![Demo Screenshot](https://github.com/user-attachments/assets/ccfa200c-eb6f-4164-8897-bec3e8cb2582)

---

## 💡 Real-World Examples

### 📱 React Application
```javascript
// App.js - Set up once, protect everything
import React, { useEffect } from 'react';
import { startGlobalInterceptor } from 'universal-api-retry-interceptor';
import { toast } from 'react-hot-toast';

function App() {
  useEffect(() => {
    // Initialize the interceptor
    startGlobalInterceptor({
      maxRetries: 3,
      delayTime: 2000,
      onRetry: (error, retryCount, requestInfo) => {
        toast.info(`Retrying ${requestInfo.url}... (${retryCount}/3)`);
      },
      onMaxRetriesExceeded: (error, requestInfo) => {
        toast.error(`Failed to load ${requestInfo.url} after 3 attempts`);
      }
    });
  }, []);

  return <YourApp />;
}

// UserProfile.js - Your existing code works unchanged
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // This fetch is now automatically protected by retry logic
    fetch(`/api/users/${userId}`)
      .then(response => response.json())
      .then(setUser)
      .catch(error => {
        // Only called after all retries are exhausted
        console.error('Failed to load user:', error);
      });
  }, [userId]);

  return user ? <div>{user.name}</div> : <div>Loading...</div>;
}
```

### 🛒 E-commerce Checkout (Critical Operations)
```javascript
import { startGlobalInterceptor } from 'universal-api-retry-interceptor';

// Configure for critical operations
startGlobalInterceptor({
  maxRetries: 5,          // More retries for critical operations
  delayTime: 3000,        // Longer delays for server recovery
  retryCondition: (error, response) => {
    // Custom retry logic for e-commerce
    if (!response) return true; // Network errors
    
    // Retry server errors but not client errors
    return response.status >= 500 || 
           response.status === 408 || // Timeout
           response.status === 429;   // Rate limited
  },
  onRetry: (error, retryCount, requestInfo) => {
    // Inform user about payment retry
    if (requestInfo.url.includes('/payment')) {
      showPaymentRetryMessage(`Processing payment... (attempt ${retryCount})`);
    }
  }
});

// Your payment code - now bulletproof
async function processPayment(paymentData) {
  try {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    
    if (response.ok) {
      const result = await response.json();
      showSuccessMessage('Payment processed successfully!');
      return result;
    }
  } catch (error) {
    // Only reaches here after 5 retry attempts
    showErrorMessage('Payment failed. Please try again or contact support.');
    throw error;
  }
}
```

### 🌐 Multi-Library Environment
```javascript
// Works seamlessly with any combination of HTTP libraries
import axios from 'axios';
import { startGlobalInterceptor } from 'universal-api-retry-interceptor';

startGlobalInterceptor({
  maxRetries: 3,
  enableLogging: true
});

// Different parts of your app can use different libraries
class ApiService {
  // Using fetch
  async getUser(id) {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }
  
  // Using axios
  async getPosts() {
    const response = await axios.get('/api/posts');
    return response.data;
  }
  
  // Using XMLHttpRequest (legacy code)
  getComments(callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/comments');
    xhr.onload = () => callback(JSON.parse(xhr.responseText));
    xhr.send();
  }
}

// All methods above are automatically protected!
```

---

## 📚 Comprehensive Configuration

### Basic Configuration
```javascript
startGlobalInterceptor({
  delayTime: 1000,       // Wait time between retries (ms)
  retryInterval: 5000,   // How often to check pending requests (ms)
  maxRetries: 3,         // Maximum retry attempts
  enableLogging: false   // Enable console logging
});
```

### Advanced Configuration
```javascript
startGlobalInterceptor({
  delayTime: 2000,
  retryInterval: 3000,
  maxRetries: 5,
  enableLogging: true,
  
  // Custom retry conditions
  retryCondition: (error, response) => {
    // Only retry specific scenarios
    if (!response && error?.name === 'TypeError') {
      return true; // Network errors
    }
    
    if (response) {
      // Retry server errors and rate limits
      return [500, 502, 503, 504, 408, 429].includes(response.status);
    }
    
    return false;
  },
  
  // Retry event handler
  onRetry: (error, retryCount, requestInfo) => {
    console.log(`🔄 Retrying ${requestInfo.url} (attempt ${retryCount})`);
    
    // Show user-friendly messages
    if (requestInfo.url.includes('/api/critical')) {
      showNotification(`Retrying critical operation... (${retryCount}/${maxRetries})`);
    }
  },
  
  // Max retries exceeded handler
  onMaxRetriesExceeded: (error, requestInfo) => {
    console.error(`💥 Failed after all retries: ${requestInfo.url}`);
    
    // Custom error handling based on endpoint
    if (requestInfo.url.includes('/api/payments')) {
      showPaymentErrorDialog();
    } else {
      showGenericErrorMessage();
    }
  }
});
```

---

## 🎯 Advanced Usage Patterns

### Instance-Based Interceptor
```javascript
import { createApiInterceptor } from 'universal-api-retry-interceptor';

// Create separate interceptors for different services
const criticalApiInterceptor = createApiInterceptor({
  maxRetries: 5,
  delayTime: 3000
});

const regularApiInterceptor = createApiInterceptor({
  maxRetries: 2,
  delayTime: 1000
});

// Start/stop as needed
criticalApiInterceptor.start();
// ... later
criticalApiInterceptor.stop();
```

### Runtime Configuration Updates
```javascript
const interceptor = startGlobalInterceptor({ maxRetries: 3 });

// Update configuration based on network conditions
navigator.connection?.addEventListener('change', () => {
  if (navigator.connection.effectiveType === 'slow-2g') {
    interceptor.updateConfig({
      maxRetries: 5,      // More retries on slow networks
      delayTime: 5000     // Longer delays
    });
  }
});
```

### Monitoring and Analytics
```javascript
startGlobalInterceptor({
  maxRetries: 3,
  onRetry: (error, retryCount, requestInfo) => {
    // Send analytics
    analytics.track('API_Retry', {
      url: requestInfo.url,
      attempt: retryCount,
      error: error?.message
    });
  },
  onMaxRetriesExceeded: (error, requestInfo) => {
    // Alert monitoring system
    monitoring.alert('API_Failure', {
      url: requestInfo.url,
      finalError: error?.message,
      timestamp: Date.now()
    });
  }
});
```

---

## 🧪 Testing & Debugging

### Debug Mode
```javascript
// Enable comprehensive logging
startGlobalInterceptor({
  enableLogging: true, // See all interceptor activity
  onRetry: (error, retryCount, requestInfo) => {
    console.log(`🔄 Retry ${retryCount}: ${requestInfo.url}`, {
      error: error?.message,
      options: requestInfo.options
    });
  }
});
```

### Status Monitoring
```javascript
const interceptor = startGlobalInterceptor();

// Monitor interceptor status
setInterval(() => {
  const status = interceptor.getStatus();
  console.log('Interceptor Status:', {
    active: status.isActive,
    online: status.isOnline,
    pending: status.pendingRequests
  });
}, 5000);
```

### Testing Offline Scenarios
```javascript
// Simulate offline mode for testing
function simulateOfflineTest() {
  // Go offline
  window.dispatchEvent(new Event('offline'));
  
  // Make requests (they'll be stored)
  fetch('/api/test-data');
  axios.get('/api/users');
  
  // Go online after 5 seconds (stored requests will execute)
  setTimeout(() => {
    window.dispatchEvent(new Event('online'));
  }, 5000);
}
```

---

## 🔧 API Reference

### Global Functions

#### `startGlobalInterceptor(config?: RetryConfig): UniversalApiRetryInterceptor`
Starts a global interceptor that affects all HTTP requests.

#### `stopGlobalInterceptor(): void`
Stops the global interceptor and cleans up.

#### `getGlobalInterceptor(): UniversalApiRetryInterceptor | null`
Returns the global interceptor instance.

#### `createApiInterceptor(config?: RetryConfig): UniversalApiRetryInterceptor`
Creates a new interceptor instance without starting it.

### Configuration Interface

```typescript
interface RetryConfig {
  delayTime?: number;                    // Delay between retries (ms)
  retryInterval?: number;                // Interval for checking pending requests (ms)
  maxRetries?: number;                   // Maximum retry attempts
  retryCondition?: (error: any, response?: Response) => boolean;
  onRetry?: (error: any, retryCount: number, requestInfo: RequestMetadata) => void;
  onMaxRetriesExceeded?: (error: any, requestInfo: RequestMetadata) => void;
  enableLogging?: boolean;               // Enable debug logging
}
```

### Instance Methods

#### `start(): void`
Starts the interceptor.

#### `stop(): void`
Stops the interceptor and cleans up.

#### `getPendingRequestsCount(): number`
Returns the number of pending retry requests.

#### `clearPendingRequests(): void`
Clears all pending requests.

#### `updateConfig(config: Partial<RetryConfig>): void`
Updates the interceptor configuration.

#### `getStatus(): InterceptorStatus`
Returns current status information.

---

## 🎭 How It Works

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Your Code     │───▶│   Interceptor    │───▶│   HTTP Layer    │
│                 │    │                  │    │                 │
│ fetch()         │    │ • Retry Logic    │    │ • fetch         │
│ axios.get()     │    │ • Offline Queue  │    │ • XMLHttpRequest│
│ $.ajax()        │    │ • Error Handling │    │ • Axios         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Request Lifecycle

1. **🚀 Request Initiated** - Your code makes an HTTP request
2. **🔍 Interceptor Catches** - Request is intercepted and monitored
3. **✅ Success Path** - If successful, response is returned normally
4. **❌ Failure Path** - If failed, interceptor evaluates retry conditions
5. **💾 Storage** - Retryable requests are stored with metadata
6. **⏱️ Retry Logic** - Background process retries stored requests
7. **🔄 Retry Attempts** - Up to maxRetries attempts with delayTime intervals
8. **📡 Offline Handling** - Requests stored when offline, executed when online
9. **✅ Final Resolution** - Success or failure after all retries exhausted

### Network State Management

```javascript
// The interceptor automatically handles these scenarios:

// Scenario 1: Temporary server error
fetch('/api/data') // → 500 error → retry 3 times → eventually succeeds

// Scenario 2: Network timeout
axios.get('/api/slow') // → timeout → retry with backoff → succeeds

// Scenario 3: Going offline
fetch('/api/update') // → offline → stored → online → executed

// Scenario 4: Rate limiting
$.ajax('/api/limited') // → 429 error → retry with delay → succeeds
```

---

## 🌐 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge | Mobile |
|---------|--------|---------|--------|------|--------|
| Basic Retry | ✅ 15+ | ✅ 41+ | ✅ 5+ | ✅ 12+ | ✅ iOS 5+ |
| Offline Detection | ✅ 15+ | ✅ 41+ | ✅ 5+ | ✅ 12+ | ✅ iOS 5+ |
| Fetch Interception | ✅ 42+ | ✅ 39+ | ✅ 10+ | ✅ 14+ | ✅ iOS 10+ |
| XHR Interception | ✅ 15+ | ✅ 41+ | ✅ 5+ | ✅ 12+ | ✅ iOS 5+ |

### Required APIs
- `fetch` API (for fetch interception)
- `XMLHttpRequest` (for XHR interception)
- `navigator.onLine` (for offline detection)
- `addEventListener` (for network events)

---

## 🚦 Best Practices

### ✅ Do's

```javascript
// ✅ Configure appropriate retry limits
startGlobalInterceptor({
  maxRetries: 3,        // Reasonable limit
  delayTime: 1000       // Not too aggressive
});

// ✅ Use custom retry conditions for different endpoints
retryCondition: (error, response) => {
  if (url.includes('/payments/')) {
    // More conservative for payments
    return response?.status === 503; // Only service unavailable
  }
  // Standard retry for other endpoints
  return response?.status >= 500;
}

// ✅ Provide user feedback during retries
onRetry: (error, retryCount, requestInfo) => {
  if (retryCount === 1) {
    showToast('Connection issue detected, retrying...');
  }
}

// ✅ Handle final failures gracefully
onMaxRetriesExceeded: (error, requestInfo) => {
  showErrorDialog('Unable to connect. Please check your connection.');
}
```

### ❌ Don'ts

```javascript
// ❌ Don't set retry limits too high
startGlobalInterceptor({
  maxRetries: 50,       // Too many retries
  delayTime: 100        // Too aggressive
});

// ❌ Don't retry everything blindly
retryCondition: () => true; // This will retry 4xx errors unnecessarily

// ❌ Don't ignore user experience
onRetry: () => {
  // No user feedback during retries
}

// ❌ Don't forget to handle edge cases
// Always provide onMaxRetriesExceeded handler
```

### 🔒 Security Considerations

```javascript
// ✅ Don't retry authentication failures
retryCondition: (error, response) => {
  if (response?.status === 401 || response?.status === 403) {
    return false; // Don't retry auth errors
  }
  return response?.status >= 500;
}

// ✅ Be careful with sensitive data in logs
enableLogging: process.env.NODE_ENV !== 'production'

// ✅ Implement proper timeout handling
// The interceptor respects your original timeout settings
```

---

## 🎨 UI/UX Integration

### React Integration with UI Feedback
```javascript
function useApiInterceptor() {
  const [retryState, setRetryState] = useState(null);

  useEffect(() => {
    startGlobalInterceptor({
      maxRetries: 3,
      onRetry: (error, retryCount, requestInfo) => {
        setRetryState({
          url: requestInfo.url,
          attempt: retryCount,
          maxAttempts: 3
        });
      },
      onMaxRetriesExceeded: () => {
        setRetryState(null);
      }
    });
  }, []);

  return retryState;
}

function App() {
  const retryState = useApiInterceptor();

  return (
    <div>
      {retryState && (
        <RetryBanner 
          url={retryState.url}
          attempt={retryState.attempt}
          maxAttempts={retryState.maxAttempts}
        />
      )}
      <YourApp />
    </div>
  );
}
```

### Progressive Enhancement
```javascript
// Gracefully enhance existing error handling
const originalErrorHandler = window.onerror;

startGlobalInterceptor({
  onMaxRetriesExceeded: (error, requestInfo) => {
    // Custom handling first
    handleApiFailure(requestInfo.url, error);
    
    // Fall back to original handler if needed
    if (originalErrorHandler) {
      originalErrorHandler(error.message, requestInfo.url, 0, 0, error);
    }
  }
});
```

---

## 📊 Performance Considerations

### Memory Usage
```javascript
// The interceptor is memory efficient:
// - Stores only essential request metadata
// - Automatically cleans up completed requests
// - No localStorage pollution
// - Configurable request limits

const interceptor = startGlobalInterceptor({
  maxRetries: 3 // Limits memory usage per request
});

// Monitor memory usage
console.log(`Pending requests: ${interceptor.getPendingRequestsCount()}`);
```

### Network Optimization
```javascript
// Implement intelligent backoff
startGlobalInterceptor({
  delayTime: 1000,      // Start with 1 second
  retryCondition: (error, response) => {
    // Don't retry client errors (saves bandwidth)
    if (response?.status >= 400 && response?.status < 500) {
      return false;
    }
    return response?.status >= 500;
  }
});

// Use connection-aware configuration
if (navigator.connection?.effectiveType === '4g') {
  // Faster retries on good connections
  interceptor.updateConfig({ delayTime: 500 });
} else {
  // Slower retries on poor connections
  interceptor.updateConfig({ delayTime: 3000 });
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: Interceptor not working with my HTTP library
```javascript
// Solution: Ensure the library uses fetch or XMLHttpRequest under the hood
// Most libraries do, but some custom implementations might not be intercepted

// Check what your library uses:
console.log('Library uses fetch:', typeof fetch !== 'undefined');
console.log('Library uses XHR:', typeof XMLHttpRequest !== 'undefined');
```

#### Issue: Requests not being retried
```javascript
// Solution: Check your retry conditions
startGlobalInterceptor({
  enableLogging: true, // Enable to see what's happening
  retryCondition: (error, response) => {
    console.log('Retry condition check:', { error, response });
    return true; // Temporarily retry everything for debugging
  }
});
```

#### Issue: Too many retries causing performance issues
```javascript
// Solution: Optimize your configuration
startGlobalInterceptor({
  maxRetries: 2,        // Reduce retry count
  delayTime: 2000,      // Increase delay
  retryCondition: (error, response) => {
    // Be more selective about what to retry
    return response?.status === 503; // Only service unavailable
  }
});
```

### Debug Checklist

1. ✅ **Enable logging**: `enableLogging: true`
2. ✅ **Check browser compatibility**: Ensure modern browser
3. ✅ **Verify interceptor status**: Use `getStatus()` method
4. ✅ **Monitor network tab**: See actual requests in DevTools
5. ✅ **Test retry conditions**: Use custom `retryCondition` for debugging

---

## 🤝 Contributing

We love contributions! Here's how you can help make this project even better:

### 🐛 Found a Bug?
1. **Check existing issues** - Someone might have already reported it
2. **Create detailed issue** - Include browser, version, and reproduction steps
3. **Provide minimal reproduction** - CodeSandbox or GitHub repo preferred

### 💡 Have a Feature Request?
1. **Check roadmap** - It might already be planned
2. **Open discussion** - Let's talk about the best implementation
3. **Consider backwards compatibility** - We value stability

### 🔧 Want to Contribute Code?

```bash
# Fork and clone the repository
git clone https://github.com/asuraking1n/universal-api-retry-interceptor.git
cd universal-api-retry-interceptor

# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Test your changes with the example
cd example-react-app
npm install
npm start
```

#### Development Guidelines
- ✅ **Write tests** for new features
- ✅ **Update documentation** for API changes
- ✅ **Follow TypeScript** best practices
- ✅ **Maintain backwards compatibility**
- ✅ **Add examples** for new features

### 📝 Improve Documentation?
- Fix typos or unclear explanations
- Add more examples or use cases
- Improve API documentation
- Create tutorials or guides

---

## 📈 Roadmap

### 🚀 Planned Features

#### v2.0 - Enhanced Intelligence
- [ ] **Adaptive retry delays** - AI-powered delay optimization
- [ ] **Request priority system** - Critical requests first
- [ ] **Circuit breaker pattern** - Prevent cascade failures
- [ ] **Metrics collection** - Built-in analytics

#### v2.1 - Advanced Scenarios
- [ ] **Request deduplication** - Avoid duplicate requests
- [ ] **Batch retry optimization** - Group similar requests
- [ ] **WebSocket support** - Extend to real-time connections
- [ ] **Service worker integration** - Background retry processing

#### v2.2 - Developer Experience
- [ ] **Visual debugger** - Browser extension for monitoring
- [ ] **Performance profiler** - Retry impact analysis
- [ ] **A/B testing hooks** - Experiment with retry strategies
- [ ] **React DevTools integration** - Component-level insights

### 🎯 Long-term Vision
Transform this into the **definitive network resilience solution** for web applications, providing:
- Zero-configuration intelligent defaults
- Enterprise-grade reliability features
- Comprehensive monitoring and analytics
- Seamless integration with all frameworks

---

## 📜 License

MIT © [Nishant Kumar Tiwari](https://github.com/asuraking1n)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Inspired by** the need for universal network resilience
- **Built for** the JavaScript community
- **Powered by** modern web standards
- **Made with** ❤️ and lots of ☕

---

## 📞 Support & Community

### 💬 Get Help
- 📖 **Documentation**: You're reading it!
- 🐛 **Issues**: [GitHub Issues](https://github.com/asuraking1n/universal-api-retry-interceptor/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/asuraking1n/universal-api-retry-interceptor/discussions)

### 🤝 Connect
- 👨‍💻 **GitHub**: [@asuraking1n](https://github.com/asuraking1n)
- 💼 **LinkedIn**: [Nishant Kumar Tiwari](https://www.linkedin.com/in/nishant-kumar-tiwari-253a46196/)
- 📧 **Email**: [Create an issue](https://github.com/asuraking1n/universal-api-retry-interceptor/issues/new) for support

### ⭐ Show Your Support
If this project helped you, please consider:
- ⭐ **Starring the repository**
- 🐦 **Sharing on social media**
- 📝 **Writing a blog post**
- 🗣️ **Telling your colleagues**

---

<div align="center">

**Made with ❤️ by [Nishant Kumar Tiwari](https://github.com/asuraking1n)**

*Empowering developers with bulletproof network resilience* 🚀

[⬆ Back to Top](#-universal-api-retry-interceptor)

</div>
