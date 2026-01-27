/* ========================================
   KYC VERIFICATION PAGE INTERACTIONS
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    initializeKYC();
});

let kycData = {
    step1: {
        identityType: null,
        frontFile: null,
        backFile: null,
        frontRotation: 0,
        backRotation: 0
    },
    step2: {
        addressType: null,
        file: null,
        rotation: 0
    },
    step3: {
        selfieMode: 'upload',
        file: null,
        rotation: 0
    },
    currentStep: 1
};

/**
 * Initialize all KYC interactions
 */
function initializeKYC() {
    initializeStepNavigation();
    initializeDocumentSelectors();
    initializeUploadZones();
    initializeFormSubmission();
    initializeSelfieMode();
    loadSavedProgress();
}

/* ========================================
   STEP NAVIGATION
   ======================================== */

/**
 * Initialize step navigation
 */
function initializeStepNavigation() {
    // Next step buttons
    document.querySelectorAll('.next-step-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const currentStepEl = this.closest('.kyc-step');
            const currentStep = parseInt(currentStepEl.getAttribute('data-step'));
            
            if (validateStep(currentStep)) {
                goToStep(currentStep + 1);
            }
        });
    });

    // Previous step buttons
    document.querySelectorAll('.prev-step-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const currentStepEl = this.closest('.kyc-step');
            const currentStep = parseInt(currentStepEl.getAttribute('data-step'));
            goToStep(currentStep - 1);
        });
    });

    // Save & Complete Later buttons
    document.querySelectorAll('.save-later-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            saveProgress();
            showToast('success', 'Progress saved. You can continue later.');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        });
    });
}

/**
 * Go to a specific step
 * @param {number} step - Step number to go to
 */
function goToStep(step) {
    if (step < 1 || step > 3) return;

    // Hide current step
    document.querySelectorAll('.kyc-step').forEach(el => {
        el.classList.remove('active');
    });

    // Show new step
    const newStep = document.querySelector(`[data-step="${step}"]`);
    if (newStep) {
        newStep.classList.add('active');
    }

    // Update stepper
    updateStepper(step);
    kycData.currentStep = step;
    saveProgress();
    window.scrollTo(0, 0);
}

/**
 * Update stepper progress indicator
 * @param {number} step - Current step
 */
function updateStepper(step) {
    // Update step indicators
    document.querySelectorAll('.step-item').forEach(el => {
        const stepNum = parseInt(el.getAttribute('data-step'));
        el.classList.remove('active', 'completed');

        if (stepNum === step) {
            el.classList.add('active');
        } else if (stepNum < step) {
            el.classList.add('completed');
        }
    });

    // Update progress bar
    const progress = (step / 3) * 100;
    document.querySelector('.progress-fill').style.width = progress + '%';
    document.querySelector('.current-step').textContent = step;
}

/* ========================================
   DOCUMENT SELECTORS
   ======================================== */

/**
 * Initialize document type selectors
 */
function initializeDocumentSelectors() {
    // Step 1: Identity type selector
    document.querySelectorAll('input[name="identity-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            kycData.step1.identityType = this.value;
            
            // Show/hide back side based on document type
            const backSide = document.getElementById('back-side');
            const backInput = document.getElementById('identity-back');
            
            if (this.value === 'passport') {
                backSide.style.display = 'none';
                backInput.required = false;
            } else {
                backSide.style.display = 'block';
                backInput.required = true;
            }
            
            saveProgress();
        });
    });

    // Step 2: Address type selector
    document.querySelectorAll('input[name="address-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            kycData.step2.addressType = this.value;
            saveProgress();
        });
    });

    // Step 3: Selfie mode selector
    document.querySelectorAll('input[name="selfie-mode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            kycData.step3.selfieMode = this.value;
            switchSelfieMode(this.value);
        });
    });
}

/* ========================================
   UPLOAD ZONES & DRAG-DROP
   ======================================== */

/**
 * Initialize upload zones with drag-and-drop
 */
function initializeUploadZones() {
    // Step 1: Identity front
    setupUploadZone('upload-front', 'identity-front', 'front', 'step1');
    
    // Step 1: Identity back
    setupUploadZone('upload-back', 'identity-back', 'back', 'step1');
    
    // Step 2: Address document
    setupUploadZone('upload-address', 'address-doc', 'step2', 'step2');
    
    // Step 3: Selfie
    setupUploadZone('upload-selfie', 'selfie-file', 'step3', 'step3');
}

/**
 * Setup an upload zone with drag-and-drop
 * @param {string} zoneId - ID of upload zone
 * @param {string} inputId - ID of file input
 * @param {string} side - 'front', 'back', or step identifier
 * @param {string} step - Step identifier
 */
function setupUploadZone(zoneId, inputId, side, step) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    
    if (!zone || !input) return;

    // Click to upload
    zone.addEventListener('click', () => input.click());

    // Drag and drop
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
    });

    // File input change
    input.addEventListener('change', function(e) {
        handleFileUpload(e, side, step);
    });
}

/**
 * Handle file upload
 * @param {Event} event - Change event
 * @param {string} side - 'front', 'back', or step identifier
 * @param {string} step - Step identifier
 */
function handleFileUpload(event, side, step) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
        showToast('error', validation.message);
        event.target.value = '';
        return;
    }

    // Read file
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        
        // Store data
        if (step === 'step1') {
            if (side === 'front') {
                kycData.step1.frontFile = imageData;
                kycData.step1.frontRotation = 0;
            } else {
                kycData.step1.backFile = imageData;
                kycData.step1.backRotation = 0;
            }
        } else if (step === 'step2') {
            kycData.step2.file = imageData;
            kycData.step2.rotation = 0;
        } else if (step === 'step3') {
            kycData.step3.file = imageData;
            kycData.step3.rotation = 0;
        }
        
        // Show preview
        displayPreview(imageData, side, step);
        saveProgress();
    };
    reader.readAsDataURL(file);
}

/**
 * Validate file
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
function validateFile(file) {
    // Check type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        return { valid: false, message: 'Only image files are allowed (JPG, PNG, GIF)' };
    }

    // Check size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return { valid: false, message: 'File size must be less than 5MB' };
    }

    return { valid: true };
}

/**
 * Display image preview
 * @param {string} imageData - Base64 image data
 * @param {string} side - 'front', 'back', or step identifier
 * @param {string} step - Step identifier
 */
function displayPreview(imageData, side, step) {
    let previewId, zoneId;

    if (step === 'step1') {
        previewId = side === 'front' ? 'preview-front' : 'preview-back';
        zoneId = side === 'front' ? 'upload-front' : 'upload-back';
    } else if (step === 'step2') {
        previewId = 'preview-address';
        zoneId = 'upload-address';
    } else if (step === 'step3') {
        previewId = 'preview-selfie';
        zoneId = 'upload-selfie';
    }

    const zone = document.getElementById(zoneId);
    const preview = document.getElementById(previewId);
    const img = preview.querySelector('img');

    // Hide zone, show preview
    zone.style.display = 'none';
    preview.style.display = 'block';
    img.src = imageData;

    // Setup action buttons
    const rotateBtn = preview.querySelector('.rotate-btn');
    const removeBtn = preview.querySelector('.remove-btn');

    rotateBtn.onclick = (e) => {
        e.preventDefault();
        rotateImage(side, step, preview);
    };

    removeBtn.onclick = (e) => {
        e.preventDefault();
        removeImage(side, step, preview);
    };

    showToast('success', 'Image uploaded successfully');
}

/**
 * Rotate image
 * @param {string} side - 'front', 'back', or step identifier
 * @param {string} step - Step identifier
 * @param {HTMLElement} preview - Preview element
 */
function rotateImage(side, step, preview) {
    const img = preview.querySelector('img');
    
    if (step === 'step1') {
        const key = side === 'front' ? 'frontRotation' : 'backRotation';
        kycData.step1[key] = (kycData.step1[key] + 90) % 360;
        img.style.transform = `rotate(${kycData.step1[key]}deg)`;
    } else if (step === 'step2') {
        kycData.step2.rotation = (kycData.step2.rotation + 90) % 360;
        img.style.transform = `rotate(${kycData.step2.rotation}deg)`;
    } else if (step === 'step3') {
        kycData.step3.rotation = (kycData.step3.rotation + 90) % 360;
        img.style.transform = `rotate(${kycData.step3.rotation}deg)`;
    }
    
    saveProgress();
}

/**
 * Remove image
 * @param {string} side - 'front', 'back', or step identifier
 * @param {string} step - Step identifier
 * @param {HTMLElement} preview - Preview element
 */
function removeImage(side, step, preview) {
    let zone, input;

    if (step === 'step1') {
        zone = document.getElementById(side === 'front' ? 'upload-front' : 'upload-back');
        input = document.getElementById(side === 'front' ? 'identity-front' : 'identity-back');
        
        if (side === 'front') {
            kycData.step1.frontFile = null;
            kycData.step1.frontRotation = 0;
        } else {
            kycData.step1.backFile = null;
            kycData.step1.backRotation = 0;
        }
    } else if (step === 'step2') {
        zone = document.getElementById('upload-address');
        input = document.getElementById('address-doc');
        kycData.step2.file = null;
        kycData.step2.rotation = 0;
    } else if (step === 'step3') {
        zone = document.getElementById('upload-selfie');
        input = document.getElementById('selfie-file');
        kycData.step3.file = null;
        kycData.step3.rotation = 0;
    }

    zone.style.display = 'block';
    preview.style.display = 'none';
    input.value = '';
    saveProgress();
}

/* ========================================
   VALIDATION
   ======================================== */

/**
 * Validate current step
 * @param {number} step - Step to validate
 * @returns {boolean} Is valid
 */
function validateStep(step) {
    if (step === 1) {
        // Identity type required
        if (!kycData.step1.identityType) {
            showToast('error', 'Please select an identity document type');
            return false;
        }

        // Front document required
        if (!kycData.step1.frontFile) {
            showToast('error', 'Please upload the front side of your document');
            return false;
        }

        // Back document required (unless passport)
        if (kycData.step1.identityType !== 'passport' && !kycData.step1.backFile) {
            showToast('error', 'Please upload the back side of your document');
            return false;
        }

        return true;
    } else if (step === 2) {
        // Address type required
        if (!kycData.step2.addressType) {
            showToast('error', 'Please select a document type for proof of address');
            return false;
        }

        // Document required
        if (!kycData.step2.file) {
            showToast('error', 'Please upload your proof of address document');
            return false;
        }

        return true;
    } else if (step === 3) {
        // Selfie required
        if (!kycData.step3.file) {
            showToast('error', 'Please upload or capture your selfie');
            return false;
        }

        return true;
    }

    return true;
}

/* ========================================
   SELFIE MODE
   ======================================== */

/**
 * Initialize selfie mode
 */
function initializeSelfieMode() {
    // Mode selector
    document.querySelectorAll('input[name="selfie-mode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            switchSelfieMode(this.value);
        });
    });
}

/**
 * Switch selfie mode
 * @param {string} mode - 'upload' or 'camera'
 */
function switchSelfieMode(mode) {
    const uploadMode = document.getElementById('upload-mode');
    const cameraMode = document.getElementById('camera-mode');

    if (mode === 'upload') {
        uploadMode.classList.add('active');
        cameraMode.classList.remove('active');
        stopCamera();
    } else if (mode === 'camera') {
        uploadMode.classList.remove('active');
        cameraMode.classList.add('active');
        startCamera();
    }
}

/**
 * Start camera feed
 */
async function startCamera() {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        video.srcObject = stream;
        
        // Setup capture button
        const captureBtn = document.querySelector('.capture-btn');
        captureBtn.onclick = () => captureSelfie(video, canvas, stream);
    } catch (error) {
        console.error('Camera error:', error);
        showToast('error', 'Unable to access camera. Please use upload instead.');
        document.querySelector('input[value="upload"]').checked = true;
        switchSelfieMode('upload');
    }
}

/**
 * Stop camera feed
 */
function stopCamera() {
    const video = document.getElementById('camera-feed');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
}

/**
 * Capture selfie from camera
 * @param {HTMLVideoElement} video - Video element
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {MediaStream} stream - Media stream
 */
function captureSelfie(video, canvas, stream) {
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to data URL
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    // Store and display
    kycData.step3.file = imageData;
    kycData.step3.rotation = 0;
    saveProgress();

    // Stop camera and show preview
    stream.getTracks().forEach(track => track.stop());
    
    const preview = document.getElementById('preview-selfie');
    const img = preview.querySelector('img');
    img.src = imageData;
    
    document.getElementById('upload-selfie').style.display = 'none';
    preview.style.display = 'block';

    // Setup action buttons
    const rotateBtn = preview.querySelector('.rotate-btn');
    const removeBtn = preview.querySelector('.remove-btn');

    rotateBtn.onclick = (e) => {
        e.preventDefault();
        rotateImage('selfie', 'step3', preview);
    };

    removeBtn.onclick = (e) => {
        e.preventDefault();
        removeImage('selfie', 'step3', preview);
        startCamera();
    };

    showToast('success', 'Selfie captured successfully');
}

/* ========================================
   FORM SUBMISSION
   ======================================== */

/**
 * Initialize form submission
 */
function initializeFormSubmission() {
    const form = document.getElementById('kyc-form');
    const submitBtn = document.getElementById('submit-kyc');

    submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        submitKYC();
    });
}

/**
 * Submit KYC verification
 */
async function submitKYC() {
    // Validate final step
    if (!validateStep(3)) {
        return;
    }

    const submitBtn = document.getElementById('submit-kyc');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/kyc/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                step1: {
                    identityType: kycData.step1.identityType,
                    frontFile: kycData.step1.frontFile,
                    backFile: kycData.step1.backFile,
                    frontRotation: kycData.step1.frontRotation,
                    backRotation: kycData.step1.backRotation
                },
                step2: {
                    addressType: kycData.step2.addressType,
                    file: kycData.step2.file,
                    rotation: kycData.step2.rotation
                },
                step3: {
                    file: kycData.step3.file,
                    rotation: kycData.step3.rotation
                }
            })
        });

        const data = await response.json();

        if (data.success) {
            // Show success state
            document.getElementById('kyc-form').style.display = 'none';
            document.getElementById('success-state').style.display = 'block';
            
            // Clear saved progress
            clearSavedProgress();
            
            showToast('success', 'KYC submitted successfully!');
        } else {
            showToast('error', data.message || 'Failed to submit KYC');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Submission error:', error);
        showToast('error', 'Failed to submit KYC. Please try again.');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/* ========================================
   PROGRESS SAVING
   ======================================== */

/**
 * Save progress to localStorage
 */
function saveProgress() {
    const sanitizedData = {
        step1: {
            identityType: kycData.step1.identityType,
            frontFile: kycData.step1.frontFile,
            backFile: kycData.step1.backFile,
            frontRotation: kycData.step1.frontRotation,
            backRotation: kycData.step1.backRotation
        },
        step2: {
            addressType: kycData.step2.addressType,
            file: kycData.step2.file,
            rotation: kycData.step2.rotation
        },
        step3: {
            selfieMode: kycData.step3.selfieMode,
            file: kycData.step3.file,
            rotation: kycData.step3.rotation
        },
        currentStep: kycData.currentStep
    };

    try {
        localStorage.setItem('kycProgress', JSON.stringify(sanitizedData));
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

/**
 * Load saved progress from localStorage
 */
function loadSavedProgress() {
    try {
        const saved = localStorage.getItem('kycProgress');
        if (saved) {
            const data = JSON.parse(saved);
            
            // Restore data
            kycData.step1 = { ...kycData.step1, ...data.step1 };
            kycData.step2 = { ...kycData.step2, ...data.step2 };
            kycData.step3 = { ...kycData.step3, ...data.step3 };
            kycData.currentStep = data.currentStep || 1;

            // Restore UI state
            if (kycData.step1.identityType) {
                document.querySelector(`input[value="${kycData.step1.identityType}"]`).checked = true;
                const event = new Event('change');
                document.querySelector(`input[value="${kycData.step1.identityType}"]`).dispatchEvent(event);
            }

            if (kycData.step2.addressType) {
                document.querySelector(`input[value="${kycData.step2.addressType}"]`).checked = true;
            }

            if (kycData.step3.selfieMode) {
                document.querySelector(`input[value="${kycData.step3.selfieMode}"]`).checked = true;
            }

            // Restore previews
            if (kycData.step1.frontFile) {
                const preview = document.getElementById('preview-front');
                const img = preview.querySelector('img');
                img.src = kycData.step1.frontFile;
                img.style.transform = `rotate(${kycData.step1.frontRotation}deg)`;
                document.getElementById('upload-front').style.display = 'none';
                preview.style.display = 'block';
            }

            if (kycData.step1.backFile) {
                const preview = document.getElementById('preview-back');
                const img = preview.querySelector('img');
                img.src = kycData.step1.backFile;
                img.style.transform = `rotate(${kycData.step1.backRotation}deg)`;
                document.getElementById('upload-back').style.display = 'none';
                preview.style.display = 'block';
            }

            if (kycData.step2.file) {
                const preview = document.getElementById('preview-address');
                const img = preview.querySelector('img');
                img.src = kycData.step2.file;
                img.style.transform = `rotate(${kycData.step2.rotation}deg)`;
                document.getElementById('upload-address').style.display = 'none';
                preview.style.display = 'block';
            }

            if (kycData.step3.file) {
                const preview = document.getElementById('preview-selfie');
                const img = preview.querySelector('img');
                img.src = kycData.step3.file;
                img.style.transform = `rotate(${kycData.step3.rotation}deg)`;
                document.getElementById('upload-selfie').style.display = 'none';
                preview.style.display = 'block';
            }

            // Go to last step
            if (kycData.currentStep > 1) {
                goToStep(kycData.currentStep);
            }
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

/**
 * Clear saved progress
 */
function clearSavedProgress() {
    try {
        localStorage.removeItem('kycProgress');
    } catch (error) {
        console.error('Error clearing progress:', error);
    }
}

/* ========================================
   TOAST NOTIFICATIONS
   ======================================== */

/**
 * Show a toast notification
 * @param {string} type - 'success' or 'error'
 * @param {string} message - Message to display
 */
function showToast(type, message) {
    const container = document.querySelector('.toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

/* ========================================
   KEYBOARD NAVIGATION & ACCESSIBILITY
   ======================================== */

document.addEventListener('keydown', function(e) {
    // Tab for cycling through form elements
    if (e.key === 'Tab') {
        // Allow normal tab behavior
        return;
    }
    
    // Enter to submit in step 3
    if (e.key === 'Enter' && e.ctrlKey && kycData.currentStep === 3) {
        document.getElementById('submit-kyc').click();
    }
});
