document.addEventListener('DOMContentLoaded', () => {
  const scriptForm = document.getElementById('script-form');
  const topicInput = document.getElementById('topic-input');
  const lengthSelect = document.getElementById('length-select');
  const generateBtn = document.getElementById('generate-btn');
  const errorBanner = document.getElementById('error-banner');
  const errorMessage = document.getElementById('error-message');
  const loadingIndicator = document.getElementById('loading-indicator');
  const outputSection = document.getElementById('output-section');

  const scriptTitle = document.getElementById('script-title');
  const scriptHook = document.getElementById('script-hook');
  const scriptBody = document.getElementById('script-body');
  const scriptOutro = document.getElementById('script-outro');

  const copyBtn = document.getElementById('copy-btn');
  const resetBtn = document.getElementById('reset-btn');

  // Keep a reference to the active script data for clipboard copying
  let activeScript = null;

  scriptForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const topic = topicInput.value.trim();
    const length = lengthSelect.value;


    if (!topic) return;

    // Reset previous states
    errorBanner.classList.add('hidden');
    outputSection.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
    setFormDisabled(true);

    try {
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocalDev && window.location.port !== '3000' 
        ? 'http://localhost:3000' 
        : '';

      const response = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: topic, length: length })
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Request failed with status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || `Request failed with status ${response.status}`);
      }

      // Display the script details
      activeScript = data;
      scriptTitle.textContent = data.title || 'Untitled YouTube Script';
      scriptHook.textContent = data.hook || '';
      scriptBody.textContent = data.mainScript || '';
      scriptOutro.textContent = data.outro || '';

      // Reveal the output and scroll to it
      outputSection.classList.remove('hidden');
      outputSection.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      errorMessage.textContent = err.message || 'An unexpected error occurred during generation.';
      errorBanner.classList.remove('hidden');
      errorBanner.scrollIntoView({ behavior: 'smooth' });
    } finally {
      loadingIndicator.classList.add('hidden');
      setFormDisabled(false);
    }
  });

  // Copy to clipboard logic
  copyBtn.addEventListener('click', async () => {
    if (!activeScript) return;

    const formattedText = `TITLE: ${activeScript.title}

HOOK (0:00 - 0:30):
${activeScript.hook}

MAIN SCRIPT:
${activeScript.mainScript}

OUTRO & CALL TO ACTION:
${activeScript.outro}`;

    try {
      await navigator.clipboard.writeText(formattedText);

      // Update button state temporarily
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('copied');

      setTimeout(() => {
        copyBtn.textContent = 'Copy Script';
        copyBtn.classList.remove('copied');
      }, 2500);
    } catch (err) {
      console.error('Could not copy text to clipboard: ', err);
      alert('Could not copy script automatically. Please copy the text manually.');
    }
  });

  // Reset form and view
  resetBtn.addEventListener('click', () => {
    topicInput.value = '';
    activeScript = null;
    outputSection.classList.add('hidden');
    errorBanner.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    topicInput.focus();
  });

  // Helper to enable/disable form inputs
  function setFormDisabled(disabled) {
    topicInput.disabled = disabled;
    lengthSelect.disabled = disabled;
    generateBtn.disabled = disabled;
    if (disabled) {
      generateBtn.textContent = 'Generating...';
    } else {
      generateBtn.textContent = 'Generate Script';
    }
  }

  // Smooth scroll for Features Nav Link
  const navFeatures = document.getElementById('nav-features');
  const featuresSection = document.getElementById('features-section');

  if (navFeatures && featuresSection) {
    navFeatures.addEventListener('click', (e) => {
      e.preventDefault();
      featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // IntersectionObserver for scrollspy active highlighting and fade-up animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navFeatures.classList.add('active');
          featuresSection.classList.add('visible');
        } else {
          navFeatures.classList.remove('active');
        }
      });
    }, {
      threshold: 0.15 // Trigger when 15% of the section is visible
    });

    observer.observe(featuresSection);
  }
});
