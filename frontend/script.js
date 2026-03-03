// let contacts = [];
// let editIndex = -1;

// const form = document.getElementById('contactForm');
// const tableBody = document.querySelector('#contactTable tbody');
// const searchInput = document.getElementById('searchInput');

// form.addEventListener('submit', function(e) {
//     e.preventDefault();
//     const name = document.getElementById('name').value;
//     const mobile = document.getElementById('mobile').value;
//     const email = document.getElementById('email').value;

//     const contact = { name, mobile, email };

//     if (editIndex === -1) {
//         contacts.push(contact);
//     } else {
//         contacts[editIndex] = contact;
//         editIndex = -1;
//     }

//     form.reset();
//     renderTable();
// });

// function renderTable() {
//     tableBody.innerHTML = '';
//     const filteredContacts = contacts.filter(c =>
//         c.name.toLowerCase().includes(searchInput.value.toLowerCase())
//     );
//     filteredContacts.forEach((c, i) => {
//         const row = document.createElement('tr');
//         row.innerHTML = `
//       <td>${c.name}</td>
//       <td>${c.mobile}</td>
//       <td>${c.email}</td>
//       <td>
//         <button onclick="editContact(${i})">Edit</button>
//         <button onclick="deleteContact(${i})">Delete</button>
//       </td>
//     `;
//         tableBody.appendChild(row);
//     });
// }

// function deleteContact(i) {
//     contacts.splice(i, 1);
//     renderTable();
// }

// function editContact(i) {
//     const c = contacts[i];
//     document.getElementById('name').value = c.name;
//     document.getElementById('mobile').value = c.mobile;
//     document.getElementById('email').value = c.email;
//     editIndex = i;
// }

// searchInput.addEventListener('input', renderTable);




const form = document.getElementById('contactForm');
const tableBody = document.querySelector('#contactTable tbody');
const searchInput = document.getElementById('searchInput');
const notificationDiv = document.getElementById('notification'); // (New addition)

let editId = null;

// नोटिफिकेशन दाखवण्यासाठी फंक्शन (New addition)
function showNotification(message, type = 'success') {
    notificationDiv.textContent = message;
    notificationDiv.className = `notification ${type}`;
    notificationDiv.style.display = 'block';

    // ५ सेकंदानंतर नोटिफिकेशन लपवा
    setTimeout(() => {
        notificationDiv.style.display = 'none';
    }, 5000);
}

// फॉर्म सबमिट झाल्यावर
form.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const email = document.getElementById('email').value.trim();

    // फ्रंटएंड व्हॅलिडेशन (New addition)
    if (!name || !mobile || !email) {
        showNotification("कृपया सर्व फील्ड भरा.", "error");
        return;
    }

    // मोबाईल नंबर व्हॅलिडेशन (१० आकडे)
    if (!/^\d{10}$/.test(mobile)) {
        showNotification("कृपया वैध १० अंकी मोबाईल नंबर टाका.", "error");
        return;
    }

    // ईमेल व्हॅलिडेशन
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotification("कृपया वैध ईमेल आयडी टाका.", "error");
        return;
    }

    const contactData = { name, mobile, email };

    if (editId === null) {
        // Add new contact - POST request
        fetch('http://localhost:3000/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData)
        })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw new Error(err.message) });
                return res.json();
            })
            .then(() => {
                form.reset();
                showNotification("कॉन्टॅक्ट यशस्वीरित्या सेव्ह झाला!"); // (New)
                loadContacts();
            })
            .catch(err => showNotification("Error: " + err.message, "error")); // (New error handling)
    } else {
        // Update contact - PUT request
        fetch(`http://localhost:3000/api/contacts/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData)
        })
            .then(res => {
                if (!res.ok) return res.json().then(err => { throw new Error(err.message) });
                return res.json();
            })
            .then(() => {
                form.reset();
                editId = null;
                showNotification("कॉन्टॅक्ट यशस्वीरित्या अपडेट झाला!"); // (New)
                loadContacts();
            })
            .catch(err => showNotification("Update error: " + err.message, "error")); // (New)
    }
});

function loadContacts() {
    fetch('http://localhost:3000/api/contacts')
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Contacts loaded:", data);
            renderTable(data);
        })
        .catch(err => {
            console.error("Error loading contacts:", err);
            showNotification("Contacts लोड करताना त्रुटी आली.", "error");
        });
}

// टेबल रेंडर करणे आणि सर्च लॉजिक (Improved search logic)
function renderTable(contacts) {
    if (!Array.isArray(contacts)) {
        console.error("❌ renderTable expects an array, but got:", contacts);
        return;
    }

    const filterText = searchInput.value.toLowerCase();
    tableBody.innerHTML = '';

    contacts
        .filter(c =>
            // नाव, मोबाईल किंवा ईमेल कशानेही सर्च करा (New logic)
            c.name.toLowerCase().includes(filterText) ||
            c.mobile.toLowerCase().includes(filterText) ||
            c.email.toLowerCase().includes(filterText)
        )
        .forEach(c => {
            const row = document.createElement('tr');
            // 'data-label' अ‍ॅड केलं आहे जेणेकरून मोबाईलवर लेबल्स दिसतील (New addition)
            row.innerHTML = `
                <td data-label="Name">${c.name}</td>
                <td data-label="Mobile">${c.mobile}</td>
                <td data-label="Email">${c.email}</td>
                <td data-label="Actions">
                  <button class="edit-btn" onclick="editContact(${c.id})">Edit</button>
                  <button class="delete-btn" onclick="deleteContact(${c.id})" style="background-color: #dc3545;">Delete</button>
                </td>`;
            tableBody.appendChild(row);
        });
}

// Delete contact - DELETE request
function deleteContact(id) {
    // डिलीट कन्फर्मेशन (New addition)
    if (!confirm("तुम्हाला खात्री आहे की हा कॉन्टॅक्ट डिलीट करायचा आहे?")) return;

    fetch(`http://localhost:3000/api/contacts/${id}`, {
        method: 'DELETE'
    })
        .then(res => res.json())
        .then(() => {
            showNotification("कॉन्टॅक्ट डिलीट केला गेला."); // (New)
            loadContacts();
        })
        .catch(err => showNotification("Delete करताना त्रुटी आली.", "error"));
}

// Edit contact
function editContact(id) {
    fetch(`http://localhost:3000/api/contacts/${id}`)
        .then(res => res.json())
        .then(contact => {
            document.getElementById('name').value = contact.name;
            document.getElementById('mobile').value = contact.mobile;
            document.getElementById('email').value = contact.email;
            editId = id;
            // फॉर्मकडे स्क्रोल करा
            window.scrollTo({ top: 0, behavior: 'smooth' }); // (New)
        })
        .catch(err => showNotification("डेटा लोड करताना त्रुटी आली.", "error"));
}

// Search input मध्ये बदल झाला की contacts फिल्टर कर
searchInput.addEventListener('input', () => {
    // डायरेक्ट रेंडर टेबल कॉल न करता आधीच्या डेटावरूनच फिल्टर करावे लागेल किंवा पुन्हा लोड करावे लागेल
    // इथे साध्या कोडसाठी पुन्हा लोड करूया
    loadContacts();
});

// पेज लोड होताच contacts लोड कर
window.onload = loadContacts;
