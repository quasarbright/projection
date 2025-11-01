/**
 * Dynamic Background Manager
 * Handles loading random background iframes and forwarding mouse events
 */

class DynamicBackground {
  constructor() {
    this.iframe = document.getElementById('dynamic-background');
    this.config = window.PROJECTS_DATA?.config;
    this.init();
  }

  init() {
    if (!this.iframe || !this.config?.dynamicBackgrounds?.length) {
      return;
    }

    // Load a random background
    this.loadRandomBackground();

    // Set up mouse event forwarding
    this.setupMouseEventForwarding();
  }

  loadRandomBackground() {
    const backgrounds = this.config.dynamicBackgrounds;
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    let selectedBackground = backgrounds[randomIndex];
    
    // Add a query parameter to indicate this is a background instance
    const separator = selectedBackground.includes('?') ? '&' : '?';
    selectedBackground += `${separator}background=true`;
    
    console.log(`🎨 Loading dynamic background: ${selectedBackground}`);
    
    // Set up error handling
    this.iframe.addEventListener('error', () => {
      console.warn('Failed to load dynamic background, falling back to static background');
      this.iframe.style.display = 'none';
    });
    
    // Set up load success
    this.iframe.addEventListener('load', () => {
      console.log('✅ Dynamic background loaded successfully');
      
      // Focus the iframe to ensure it can receive messages
      try {
        this.iframe.focus();
        if (this.iframe.contentWindow) {
          this.iframe.contentWindow.focus();
        }
        console.log('🎯 Focused dynamic background iframe');
      } catch (error) {
        console.log('⚠️ Could not focus iframe:', error.message);
      }
      
      // Start sending mouse events immediately
      this.startMouseForwarding();
    });
    
    this.iframe.src = selectedBackground;
  }

  setupMouseEventForwarding() {
    let messageCount = 0;
    
    // Forward mouse move events directly to the iframe
    document.addEventListener('mousemove', (e) => {
      if (this.iframe?.contentWindow) {
        try {
          this.iframe.contentWindow.postMessage({
            type: 'mousemove',
            x: e.clientX,
            y: e.clientY,
            pageX: e.pageX,
            pageY: e.pageY
          }, '*');
          
          messageCount++;
          if (messageCount % 60 === 0) { // Log every 60 messages
            console.log('📤 Sent', messageCount, 'mouse messages to background');
          }
          
        } catch (error) {
          console.error('❌ Error sending postMessage:', error);
        }
      }
    });

    console.log('🖱️ Mouse event forwarding set up for dynamic background');
  }

  startMouseForwarding() {
    // Wait a bit more for the iframe content to be fully ready
    setTimeout(() => {
      if (this.iframe?.contentWindow) {
        console.log('✅ Dynamic background ready for mouse events');
        
        // Test if postMessage works
        try {
          this.iframe.contentWindow.postMessage({
            type: 'test',
            message: 'Hello from parent window!'
          }, '*');
          console.log('🧪 Test message sent to background');
        } catch (error) {
          console.error('❌ Test message failed:', error);
        }
      } else {
        console.warn('⚠️ iframe contentWindow not available');
      }
    }, 1000);
  }


}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DynamicBackground());
} else {
  new DynamicBackground();
} 