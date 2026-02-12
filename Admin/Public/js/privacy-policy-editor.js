// Privacy Policy Editor JavaScript
// Configuration is passed via data attributes

let sections = [];
let editors = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Get sections data from data attribute
  const sectionsData = document.body.dataset.sections;
  if (sectionsData) {
    try {
      sections = JSON.parse(sectionsData);
    } catch (e) {
      console.error('Failed to parse sections data:', e);
      sections = [];
    }
  }
  
  // Initialize the editor
  renderSections();
});

function showAlert(message, type = 'success') {
  const alertBox = document.getElementById('alertBox');
  alertBox.className = `alert alert-${type} show`;
  alertBox.textContent = message;
  scrollTo(0, 0);
  
  setTimeout(() => {
    alertBox.classList.remove('show');
  }, 5000);
}

function renderSections() {
  const container = document.getElementById('sectionsContainer');
  container.innerHTML = '';
  
  sections.sort((a, b) => a.order - b.order);
  
  sections.forEach((section, index) => {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section-item';
    sectionDiv.innerHTML = `
      <div class="section-header">
        <input type="text" 
               class="form-input section-title-input" 
               value="${section.title}" 
               onchange="updateSectionTitle(${section.id}, this.value)"
               placeholder="Section Title">
        <div class="section-actions">
          ${index > 0 ? `<button type="button" class="btn-icon" onclick="moveSection(${section.id}, 'up')" title="Move Up"><i class="fas fa-arrow-up"></i></button>` : ''}
          ${index < sections.length - 1 ? `<button type="button" class="btn-icon" onclick="moveSection(${section.id}, 'down')" title="Move Down"><i class="fas fa-arrow-down"></i></button>` : ''}
          <button type="button" class="btn-icon danger" onclick="deleteSection(${section.id})" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div id="editor-${section.id}" class="quill-editor"></div>
    `;
    
    container.appendChild(sectionDiv);
    
    // Initialize Quill editor
    const editorDiv = document.getElementById(`editor-${section.id}`);
    const quill = new Quill(editorDiv, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          ['link'],
          [{ 'align': [] }],
          ['clean']
        ]
      }
    });
    
    quill.root.innerHTML = section.content;
    editors[section.id] = quill;
  });
}

function updateSectionTitle(sectionId, newTitle) {
  const section = sections.find(s => s.id === sectionId);
  if (section) {
    section.title = newTitle;
  }
}

function addSection() {
  const newId = Math.max(...sections.map(s => s.id), 0) + 1;
  const newSection = {
    id: newId,
    title: `New Section ${newId}`,
    content: '',
    order: sections.length + 1
  };
  sections.push(newSection);
  renderSections();
}

function deleteSection(sectionId) {
  if (!confirm('Are you sure you want to delete this section?')) {
    return;
  }
  sections = sections.filter(s => s.id !== sectionId);
  delete editors[sectionId];
  renderSections();
}

function moveSection(sectionId, direction) {
  const index = sections.findIndex(s => s.id === sectionId);
  if (direction === 'up' && index > 0) {
    [sections[index], sections[index-1]] = [sections[index-1], sections[index]];
  } else if (direction === 'down' && index < sections.length - 1) {
    [sections[index], sections[index+1]] = [sections[index+1], sections[index]];
  }
  
  // Update order numbers
  sections.forEach((section, idx) => {
    section.order = idx + 1;
  });
  
  renderSections();
}

function gatherFormData() {
  // Update section contents from editors
  sections.forEach(section => {
    if (editors[section.id]) {
      section.content = editors[section.id].root.innerHTML;
    }
  });
  
  return {
    version: document.getElementById('version').value,
    effectiveDate: document.getElementById('effectiveDate').value,
    changeSummary: document.getElementById('changeSummary').value,
    metaTitle: document.getElementById('metaTitle').value,
    metaDescription: document.getElementById('metaDescription').value,
    sections: sections
  };
}

async function saveDraft() {
  const data = gatherFormData();
  
  if (!data.version || !data.effectiveDate) {
    showAlert('Please fill in all required fields', 'error');
    return;
  }
  
  try {
    const url = document.body.dataset.saveUrl;
    const method = document.body.dataset.saveMethod;
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      showAlert(result.message, 'success');
      setTimeout(() => {
        window.location.href = '/admin/privacy-policy';
      }, 2000);
    } else {
      showAlert(result.message || 'Failed to save', 'error');
    }
  } catch (error) {
    showAlert('Error saving policy', 'error');
    console.error(error);
  }
}

async function saveAndPublish() {
  const data = gatherFormData();
  
  if (!data.version || !data.effectiveDate) {
    showAlert('Please fill in all required fields', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to save and publish this policy? All users will be notified.')) {
    return;
  }
  
  try {
    // First, create the policy
    const createResponse = await fetch('/admin/privacy-policy/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const createResult = await createResponse.json();
    
    if (!createResult.success) {
      showAlert(createResult.message || 'Failed to create policy', 'error');
      return;
    }
    
    // Then, publish it
    const publishResponse = await fetch(`/admin/privacy-policy/${createResult.policyId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const publishResult = await publishResponse.json();
    
    if (publishResult.success) {
      showAlert('Policy created and published successfully', 'success');
      setTimeout(() => {
        window.location.href = '/admin/privacy-policy';
      }, 2000);
    } else {
      showAlert(publishResult.message || 'Policy created but failed to publish', 'error');
    }
  } catch (error) {
    showAlert('Error saving and publishing policy', 'error');
    console.error(error);
  }
}
