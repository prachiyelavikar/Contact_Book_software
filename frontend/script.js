// API Configuration
// const API_BASE_URL = 'http://localhost:3000/api/contacts';
const API_BASE_URL = 'https://contact-book-software-2.onrender.com/api/contacts';

// DOM Elements
const contactForm = document.getElementById('contactForm');
const editForm = document.getElementById('editForm');
const tableBody = document.querySelector('#contactTable tbody');
const searchInput = document.getElementById('searchInput');
const totalContactsEl = document.getElementById('totalContacts');
const searchFeedbackEl = document.getElementById('searchFeedback');
const loader = document.getElementById('loader');
const notificationDiv = document.getElementById('notification');
const darkModeToggle = document.getElementById('darkModeToggle');
const paginationContainer = document.getElementById('pagination');

// Modal Elements
const editModal = document.getElementById('editModal');
const closeModalBtn = document.querySelector('.close-modal');
const cancelModalBtn = document.querySelector('.close-btn');

let currentEditId = null;
let allContacts = [];
let currentPage = 1;
const contactsPerPage = 10;

// --- Utility Functions ---

function showLoader() {
    loader.style.display = 'flex';
}

function hideLoader() {
    loader.style.display = 'none';
}

function showNotification(message, type = 'success') {
    notificationDiv.textContent = message;
    notificationDiv.className = `notification ${type}`;
    notificationDiv.style.display = 'block';
    setTimeout(() => {
        notificationDiv.style.display = 'none';
    }, 4000);
}

function getInitials(name) {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function getRandomColor(name) {
    const colors = [
        '#4361ee', '#3f37c9', '#4895ef', '#4cc9f0',
        '#f72585', '#b5179e', '#7209b7', '#560bad',
        '#2a9d8f', '#264653', '#e76f51', '#f4a261'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function highlightText(text, filter) {
    if (!filter) return text;
    const regex = new RegExp(`(${filter})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// --- Dark Mode Logic ---

function initDarkMode() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateDarkModeIcon(savedTheme);
}

function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateDarkModeIcon(newTheme);
}

function updateDarkModeIcon(theme) {
    const icon = darkModeToggle.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// --- API Calls ---

async function fetchContacts() {
    showLoader();
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error('Failed to fetch contacts');
        allContacts = await response.json();
        renderTable();
        updateSummary();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoader();
    }
}

async function updateSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/summary`);
        if (response.ok) {
            const data = await response.json();
            totalContactsEl.textContent = data.totalContacts;
        }
    } catch (error) {
        console.error('Error fetching summary:', error);
    }
}

async function saveContact(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!validateContact(name, mobile, email)) return;

    showLoader();
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mobile, email })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error saving contact');

        showNotification('Contact saved successfully!');
        contactForm.reset();
        allContacts = data; // Backend returns updated list
        currentPage = 1; // Go to first page on new contact
        renderTable();
        updateSummary();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoader();
    }
}

async function updateContactRecord(e) {
    e.preventDefault();
    const name = document.getElementById('editName').value.trim();
    const mobile = document.getElementById('editMobile').value.trim();
    const email = document.getElementById('editEmail').value.trim();

    if (!validateContact(name, mobile, email)) return;

    showLoader();
    try {
        const response = await fetch(`${API_BASE_URL}/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mobile, email })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error updating contact');

        showNotification('Contact updated successfully!');
        closeModal();
        allContacts = data; // Backend returns updated list
        renderTable();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoader();
    }
}

async function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    showLoader();
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error deleting contact');

        showNotification('Contact deleted successfully');
        fetchContacts(); // Reload all
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoader();
    }
}

// --- UI Logic ---

function renderTable() {
    const filterText = searchInput.value.toLowerCase();
    tableBody.innerHTML = '';

    const filtered = allContacts.filter(c =>
        c.name.toLowerCase().includes(filterText) ||
        c.mobile.toLowerCase().includes(filterText) ||
        c.email.toLowerCase().includes(filterText)
    );

    if (filterText) {
        searchFeedbackEl.textContent = ` (Found ${filtered.length} of ${allContacts.length})`;
    } else {
        searchFeedbackEl.textContent = '';
    }

    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 40px;">No contacts found</td></tr>';
        paginationContainer.innerHTML = '';
        return;
    }

    // Pagination Logic
    const totalPages = Math.ceil(filtered.length / contactsPerPage);
    if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

    const startIndex = (currentPage - 1) * contactsPerPage;
    const paginatedContacts = filtered.slice(startIndex, startIndex + contactsPerPage);

    paginatedContacts.forEach((c, index) => {
        const row = document.createElement('tr');
        const initials = getInitials(c.name);
        const color = getRandomColor(c.name);

        row.innerHTML = `
            <td data-label="Sr. No.">${startIndex + index + 1}</td>
            <td>
                <div class="avatar" style="background-color: ${color}">${initials}</div>
            </td>
            <td data-label="Name">${highlightText(c.name, filterText)}</td>
            <td data-label="Mobile">${highlightText(c.mobile, filterText)}</td>
            <td data-label="Email">${highlightText(c.email, filterText)}</td>
            <td data-label="Actions">
                <div class="action-btns">
                    <button class="btn edit-btn" onclick="openEditModal(${c.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn delete-btn" onclick="deleteContact(${c.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.addEventListener('click', () => {
            currentPage = i;
            renderTable();
            window.scrollTo({ top: contactForm.offsetTop - 50, behavior: 'smooth' });
        });
        paginationContainer.appendChild(btn);
    }
}

function openEditModal(id) {
    const contact = allContacts.find(c => c.id === id);
    if (!contact) return;

    currentEditId = id;
    document.getElementById('editName').value = contact.name;
    document.getElementById('editMobile').value = contact.mobile;
    document.getElementById('editEmail').value = contact.email;

    editModal.style.display = 'flex';
}

function closeModal() {
    editModal.style.display = 'none';
    currentEditId = null;
    editForm.reset();
}

function validateContact(name, mobile, email) {
    if (!name || !mobile || !email) {
        showNotification('Please fill all fields', 'error');
        return false;
    }
    if (!/^\d{10}$/.test(mobile)) {
        showNotification('Invalid mobile number (10 digits required)', 'error');
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotification('Invalid email address', 'error');
        return false;
    }
    return true;
}

// --- Event Listeners ---

// Restrict mobile input to 10 digits and only numbers
const restrictMobileInput = (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
};

document.getElementById('mobile').addEventListener('input', restrictMobileInput);
document.getElementById('editMobile').addEventListener('input', restrictMobileInput);

contactForm.addEventListener('submit', saveContact);
editForm.addEventListener('submit', updateContactRecord);

searchInput.addEventListener('input', () => {
    currentPage = 1; // Reset to page 1 on search
    renderTable();
});

closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);
darkModeToggle.addEventListener('click', toggleDarkMode);

window.addEventListener('click', (e) => {
    if (e.target === editModal) closeModal();
});

document.getElementById('downloadPDF').addEventListener('click', () => {
    window.location.href = `${API_BASE_URL}/export/pdf`;
});

document.getElementById('downloadExcel').addEventListener('click', () => {
    window.location.href = `${API_BASE_URL}/export/excel`;
});

// Initial Load
window.onload = () => {
    initDarkMode();
    fetchContacts();
};
