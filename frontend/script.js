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

let editId = null; // backend मधला contact id वापरू
const API_BASE_URL = 'https://contact-book-software-2.onrender.com'; // backend URL

// फॉर्म सबमिट झाल्यावर
form.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!name || !mobile || !email) {
        alert("सर्व फील्ड भरावीत.");
        return;
    }

    const contactData = { name, mobile, email };

    if (editId === null) {
        // Add new contact - POST request
        fetch('https://contact-book-software-2.onrender.com/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            })
            .then(res => res.json())
            .then(() => {
                form.reset();
                loadContacts();
            })
            .catch(err => alert("Add करताना error: " + err));
    } else {
        // Update contact - PUT request
        fetch(`https://contact-book-software-2.onrender.com/api/contacts/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            })
            .then(res => res.json())
            .then(() => {
                form.reset();
                editId = null;
                loadContacts();
            })
            .catch(err => alert("Update करताना error: " + err));
    }
});

// सर्व contacts fetch करणे (GET request)
function loadContacts() {
    fetch('https://contact-book-software-2.onrender.com/api/contacts')
        .then(res => res.json())
        .then(data => {
            renderTable(data);
        })
        .catch(err => alert("Contacts load करताना error: " + err));
}

// टेबल रेंडर करणे
// function renderTable(contacts) {
//     const filterText = searchInput.value.toLowerCase();
//     tableBody.innerHTML = '';

//     contacts
//         .filter(c => c.name.toLowerCase().includes(filterText))
//         .forEach(c => {
//             const row = document.createElement('tr');
//             row.innerHTML = `
//         <td>${c.name}</td>
//         <td>${c.mobile}</td>
//         <td>${c.email}</td>
//         <td>
//           <button onclick="editContact(${c.id})">Edit</button>
//           <button onclick="deleteContact(${c.id})">Delete</button>
//         </td>`;
//             tableBody.appendChild(row);
//         });
// }


function renderTable(contacts) {
    if (!Array.isArray(contacts)) {
        console.error("❌ renderTable expects an array, but got:", contacts);
        alert("Contacts लोड करताना त्रुटी आली.");
        return;
    }

    const filterText = searchInput.value.toLowerCase();
    tableBody.innerHTML = '';

    contacts
        .filter(c => c.name.toLowerCase().includes(filterText))
        .forEach(c => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.name}</td>
                <td>${c.mobile}</td>
                <td>${c.email}</td>
                <td>
                  <button onclick="editContact(${c.id})">Edit</button>
                  <button onclick="deleteContact(${c.id})">Delete</button>
                </td>`;
            tableBody.appendChild(row);
        });
}


// Delete contact - DELETE request
function deleteContact(id) {
    if (!confirm("हा contact delete करायचा का?")) return;

    fetch(`https://contact-book-software-2.onrender.com/api/contacts/${id}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(() => loadContacts())
        .catch(err => alert("Delete करताना error: " + err));
}

// Edit contact
function editContact(id) {
    fetch(`https://contact-book-software-2.onrender.com/api/contacts/${id}`)
        .then(res => res.json())
        .then(contact => {
            document.getElementById('name').value = contact.name;
            document.getElementById('mobile').value = contact.mobile;
            document.getElementById('email').value = contact.email;
            editId = id;
        })
        .catch(err => alert("Edit करताना error: " + err));
}

// Search input मध्ये बदल झाला की contacts लोड कर
searchInput.addEventListener('input', loadContacts);

// पेज लोड होताच contacts लोड कर
window.onload = loadContacts;
