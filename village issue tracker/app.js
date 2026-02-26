const API_URL = 'http://localhost:3000/api';

// DOM Elements
const issueForm = document.getElementById('issue-form');
const categorySelect = document.getElementById('category');
const issueList = document.getElementById('issue-list');
const sectionReport = document.getElementById('section-report');
const sectionAdmin = document.getElementById('section-admin');
const modal = document.getElementById('modal');

// State
let selectedIssueId = null;

// Initialize
async function init() {
    const categories = await (await fetch(`${API_URL}/categories`)).json();
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// Nav Tabs
document.getElementById('btn-report').onclick = () => {
    toggleTabs('report');
};
document.getElementById('btn-admin').onclick = () => {
    toggleTabs('admin');
    loadIssues();
};

function toggleTabs(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (tab === 'report') {
        sectionReport.style.display = 'block';
        sectionAdmin.style.display = 'none';
        document.getElementById('btn-report').classList.add('active');
    } else {
        sectionReport.style.display = 'none';
        sectionAdmin.style.display = 'block';
        document.getElementById('btn-admin').classList.add('active');
    }
}

// Submit Issue
issueForm.onsubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('category', categorySelect.value);
    formData.append('description', document.getElementById('description').value);
    const photo = document.getElementById('photo').files[0];
    if (photo) formData.append('photo', photo);

    try {
        const res = await fetch(`${API_URL}/issues`, {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            alert('Issue reported successfully!');
            issueForm.reset();
        }
    } catch (err) {
        console.error(err);
        alert('Failed to report issue.');
    }
};

// Load Issues for Admin
async function loadIssues() {
    issueList.innerHTML = 'Loading...';
    try {
        const issues = await (await fetch(`${API_URL}/issues`)).json();
        issueList.innerHTML = '';
        issues.forEach(issue => {
            const card = document.createElement('div');
            card.className = `issue-card ${issue.status}`;
            card.innerHTML = `
                <div>
                    <strong>${issue.title}</strong><br>
                    <small>${issue.category} | ${new Date(issue.created_at).toLocaleDateString()}</small><br>
                    <p style="font-size: 14px; margin-top:5px;">${issue.description}</p>
                </div>
                <div>
                    <span class="status-badge">${issue.status}</span><br>
                    <button style="margin-top:5px; padding:4px 8px; font-size:12px;" onclick="openStatusModal(${issue.id})">Update</button>
                </div>
            `;
            issueList.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        issueList.innerHTML = 'Error loading issues.';
    }
}

// Modal logic
window.openStatusModal = (id) => {
    selectedIssueId = id;
    modal.style.display = 'flex';
};

document.getElementById('close-modal').onclick = () => {
    modal.style.display = 'none';
};

document.getElementById('save-status').onclick = async () => {
    const status = document.getElementById('status-update').value;
    try {
        await fetch(`${API_URL}/issues/${selectedIssueId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        modal.style.display = 'none';
        loadIssues();
    } catch (err) {
        console.error(err);
    }
};

init();
