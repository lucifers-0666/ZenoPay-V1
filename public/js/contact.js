// Contact Us Page - Form Handling & Interactions

document.addEventListener('DOMContentLoaded', function() {
  
  // ===============================
  // Form Elements
  // ===============================
  
  const contactForm = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const successMessage = document.getElementById('successMessage');
  const ticketNumber = document.getElementById('ticketNumber');
  
  // Form fields
  const fullName = document.getElementById('fullName');
  const email = document.getElementById('email');
  const phone = document.getElementById('phone');
  const subject = document.getElementById('subject');
  const message = document.getElementById('message');
  const attachment = document.getElementById('attachment');
  
  // Error elements
  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const subjectError = document.getElementById('subjectError');
  const messageError = document.getElementById('messageError');
  
  // ===============================
  // Character Counter
  // ===============================
  
  const charCount = document.getElementById('charCount');
  
  message.addEventListener('input', function() {
    const count = this.value.length;
    charCount.textContent = count;
    
    if (count > 450) {
      charCount.style.color = '#EF4444';
    } else if (count > 400) {
      charCount.style.color = '#F59E0B';
    } else {
      charCount.style.color = '#9CA3AF';
    }
  });
  
  // ===============================
  // File Upload Handling
  // ===============================
  
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileInfo = document.getElementById('fileInfo');
  const fileName = document.getElementById('fileName');
  const removeFile = document.getElementById('removeFile');
  
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Highlight drop area
  ['dragenter', 'dragover'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    fileUploadArea.style.borderColor = '#3B82F6';
    fileUploadArea.style.background = '#F0F9FF';
  }
  
  function unhighlight() {
    fileUploadArea.style.borderColor = '#D1D5DB';
    fileUploadArea.style.background = '#FAFAFA';
  }
  
  // Handle file drop
  fileUploadArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      attachment.files = files;
      handleFileSelect();
    }
  }
  
  // Handle file selection
  attachment.addEventListener('change', handleFileSelect);
  
  function handleFileSelect() {
    const file = attachment.files[0];
    
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        attachment.value = '';
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, JPG, and PNG files are allowed');
        attachment.value = '';
        return;
      }
      
      // Show file info
      fileName.textContent = file.name;
      fileInfo.style.display = 'flex';
      fileUploadArea.style.display = 'none';
    }
  }
  
  // Remove file
  removeFile.addEventListener('click', function() {
    attachment.value = '';
    fileInfo.style.display = 'none';
    fileUploadArea.style.display = 'block';
  });
  
  // ===============================
  // Form Validation
  // ===============================
  
  function validateField(field, errorElement, validator) {
    const isValid = validator(field.value);
    const formGroup = field.closest('.form-group');
    
    if (!isValid && field.value) {
      formGroup.classList.add('error');
      errorElement.style.display = 'block';
      return false;
    } else {
      formGroup.classList.remove('error');
      errorElement.style.display = 'none';
      return true;
    }
  }
  
  // Real-time validation
  fullName.addEventListener('blur', function() {
    validateField(this, nameError, (value) => value.trim().length >= 2);
    if (this.value.trim().length < 2) {
      nameError.textContent = 'Name must be at least 2 characters';
    }
  });
  
  email.addEventListener('blur', function() {
    validateField(this, emailError, (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)) {
      emailError.textContent = 'Please enter a valid email address';
    }
  });
  
  subject.addEventListener('change', function() {
    validateField(this, subjectError, (value) => value !== '');
    if (this.value === '') {
      subjectError.textContent = 'Please select a subject';
    }
  });
  
  message.addEventListener('blur', function() {
    validateField(this, messageError, (value) => value.trim().length >= 10);
    if (this.value.trim().length < 10) {
      messageError.textContent = 'Message must be at least 10 characters';
    }
  });
  
  // ===============================
  // Form Submission
  // ===============================
  
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate all fields
    const isNameValid = validateField(fullName, nameError, (value) => value.trim().length >= 2);
    const isEmailValid = validateField(email, emailError, (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    const isSubjectValid = validateField(subject, subjectError, (value) => value !== '');
    const isMessageValid = validateField(message, messageError, (value) => value.trim().length >= 10);
    
    if (!isNameValid) nameError.textContent = 'Name must be at least 2 characters';
    if (!isEmailValid) emailError.textContent = 'Please enter a valid email address';
    if (!isSubjectValid) subjectError.textContent = 'Please select a subject';
    if (!isMessageValid) messageError.textContent = 'Message must be at least 10 characters';
    
    if (!isNameValid || !isEmailValid || !isSubjectValid || !isMessageValid) {
      // Scroll to first error
      const firstError = document.querySelector('.form-group.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    btnText.textContent = 'Sending...';
    submitBtn.querySelector('i').className = 'fas fa-spinner fa-spin';
    
    // Prepare form data
    const formData = new FormData();
    formData.append('fullName', fullName.value);
    formData.append('email', email.value);
    formData.append('phone', phone.value);
    formData.append('subject', subject.value);
    formData.append('message', message.value);
    
    // Add priority
    const priority = document.querySelector('input[name="priority"]:checked').value;
    formData.append('priority', priority);
    
    // Add attachment if present
    if (attachment.files[0]) {
      formData.append('attachment', attachment.files[0]);
    }
    
    try {
      // Submit form to backend
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Show success message
        contactForm.style.display = 'none';
        successMessage.style.display = 'flex';
        
        // Generate ticket number
        const ticket = 'ZP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        ticketNumber.textContent = ticket;
        
        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Reset form after 5 seconds
        setTimeout(() => {
          contactForm.reset();
          contactForm.style.display = 'block';
          successMessage.style.display = 'none';
          charCount.textContent = '0';
          if (fileInfo.style.display === 'flex') {
            removeFile.click();
          }
        }, 5000);
        
        // Track event
        trackEvent('contact_form_submitted', {
          subject: subject.value,
          priority: priority
        });
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to send message. Please try again or contact us directly.');
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      btnText.textContent = 'Send Message';
      submitBtn.querySelector('i').className = 'fas fa-paper-plane';
    }
  });
  
  // ===============================
  // Business Hours Status
  // ===============================
  
  function updateBusinessStatus() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    
    const phoneStatus = document.getElementById('phoneStatus');
    const phoneStatusText = document.getElementById('phoneStatusText');
    const currentStatus = document.getElementById('currentStatus');
    const statusText = document.getElementById('statusText');
    
    let isOpen = false;
    
    // Monday - Friday: 9 AM - 6 PM
    if (day >= 1 && day <= 5 && hour >= 9 && hour < 18) {
      isOpen = true;
    }
    // Saturday: 10 AM - 4 PM
    else if (day === 6 && hour >= 10 && hour < 16) {
      isOpen = true;
    }
    
    if (isOpen) {
      phoneStatus.classList.add('online');
      phoneStatusText.textContent = 'Available';
      currentStatus.classList.remove('closed');
      statusText.textContent = 'Currently Open';
    } else {
      phoneStatus.classList.remove('online');
      phoneStatusText.textContent = 'Closed';
      currentStatus.classList.add('closed');
      statusText.textContent = 'Currently Closed';
    }
  }
  
  // Update status on load and every minute
  updateBusinessStatus();
  setInterval(updateBusinessStatus, 60000);
  
  // ===============================
  // Smooth Scroll
  // ===============================
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
  // ===============================
  // Scroll Animations
  // ===============================
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe cards
  document.querySelectorAll('.info-card, .faq-link-item').forEach(card => {
    observer.observe(card);
  });
  
  // ===============================
  // Auto-fill from URL parameters
  // ===============================
  
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.has('subject')) {
    const subjectParam = urlParams.get('subject');
    const option = Array.from(subject.options).find(opt => 
      opt.value === subjectParam || opt.text.toLowerCase().includes(subjectParam.toLowerCase())
    );
    if (option) {
      subject.value = option.value;
    }
  }
  
  if (urlParams.has('email')) {
    email.value = urlParams.get('email');
  }
  
  if (urlParams.has('message')) {
    message.value = urlParams.get('message');
    message.dispatchEvent(new Event('input'));
  }
  
  // ===============================
  // Keyboard Shortcuts
  // ===============================
  
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter: Submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        contactForm.dispatchEvent(new Event('submit'));
      }
    }
  });
  
  // ===============================
  // Analytics Tracking
  // ===============================
  
  function trackEvent(eventName, eventData) {
    console.log('Event tracked:', eventName, eventData);
    
    // Implement your analytics here
    // Example: Google Analytics
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', eventName, eventData);
    // }
  }
  
  // Track form interactions
  subject.addEventListener('change', function() {
    trackEvent('contact_subject_selected', { subject: this.value });
  });
  
  document.querySelectorAll('input[name="priority"]').forEach(radio => {
    radio.addEventListener('change', function() {
      trackEvent('contact_priority_selected', { priority: this.value });
    });
  });
  
  // Track email clicks
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', function() {
      trackEvent('contact_email_clicked', { email: this.href.replace('mailto:', '') });
    });
  });
  
  // Track phone clicks
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', function() {
      trackEvent('contact_phone_clicked', { phone: this.href.replace('tel:', '') });
    });
  });
  
  // Track social media clicks
  document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('click', function() {
      const platform = this.querySelector('i').className.match(/fa-([\w-]+)/)[1];
      trackEvent('contact_social_clicked', { platform: platform });
    });
  });
  
  // ===============================
  // Prefill User Data (if logged in)
  // ===============================
  
  // If user is logged in, prefill their data
  if (typeof userData !== 'undefined' && userData) {
    if (userData.FullName) fullName.value = userData.FullName;
    if (userData.Email) email.value = userData.Email;
    if (userData.PhoneNumber) phone.value = userData.PhoneNumber;
  }
  
  // ===============================
  // Priority Auto-selection Based on Subject
  // ===============================
  
  subject.addEventListener('change', function() {
    const urgentSubjects = ['technical', 'report'];
    const mediumSubjects = ['billing', 'partnership'];
    
    if (urgentSubjects.includes(this.value)) {
      document.querySelector('input[name="priority"][value="high"]').checked = true;
    } else if (mediumSubjects.includes(this.value)) {
      document.querySelector('input[name="priority"][value="medium"]').checked = true;
    } else {
      document.querySelector('input[name="priority"][value="low"]').checked = true;
    }
  });
  
});
