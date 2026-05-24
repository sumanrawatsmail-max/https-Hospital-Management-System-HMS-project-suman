const storageKeys = {
    doctors: 'hms_doctors',
    patients: 'hms_patients',
    appointments: 'hms_appointments',
    bills: 'hms_bills',
    users: 'hms_users'
};

const defaultDoctors = [
    { id: 'doc-1', name: 'Dr. Alisha Roy', specialty: 'Cardiology', phone: '9876543210', schedule: 'Mon-Fri 9am-5pm' },
    { id: 'doc-2', name: 'Dr. Saurav Mehta', specialty: 'Pediatrics', phone: '9123456780', schedule: 'Tue-Sat 10am-6pm' },
    { id: 'doc-3', name: 'Dr. Nisha Verma', specialty: 'Orthopedics', phone: '9988776655', schedule: 'Mon, Wed, Fri 11am-7pm' }
];

const defaultPatients = [
    { id: 'pat-1', name: 'Rohan Sharma', age: 32, gender: 'Male', contact: '9871234560', condition: 'General Checkup' },
    { id: 'pat-2', name: 'Kavya Singh', age: 25, gender: 'Female', contact: '9900112233', condition: 'Fever & Infection' }
];

const defaultUsers = [
    { id: 'usr-1', name: 'Admin Panel', role: 'Administrator' },
    { id: 'usr-2', name: 'Reception', role: 'Front Desk' }
];

function readData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        return [];
    }
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function ensureInitialStorage() {
    if (!localStorage.getItem(storageKeys.doctors)) saveData(storageKeys.doctors, defaultDoctors);
    if (!localStorage.getItem(storageKeys.patients)) saveData(storageKeys.patients, defaultPatients);
    if (!localStorage.getItem(storageKeys.appointments)) saveData(storageKeys.appointments, []);
    if (!localStorage.getItem(storageKeys.bills)) saveData(storageKeys.bills, []);
    if (!localStorage.getItem(storageKeys.users)) saveData(storageKeys.users, defaultUsers);
}

function formatCurrency(value) {
    return '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => toast.classList.remove('show'), 2400);
}

function getCurrentPage() {
    return document.body.dataset.page;
}

function setListOptions(selectId, items, labelKey) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">Select</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} ${item.specialty ? '(' + item.specialty + ')' : ''}`;
        select.appendChild(option);
    });
}

function renderDashboard() {
    const doctors = readData(storageKeys.doctors);
    const patients = readData(storageKeys.patients);
    const appointments = readData(storageKeys.appointments);
    const bills = readData(storageKeys.bills);

    document.getElementById('doctorCount').textContent = doctors.length;
    document.getElementById('patientCount').textContent = patients.length;
    document.getElementById('appointmentCount').textContent = appointments.length;
    document.getElementById('billCount').textContent = bills.length;

    const upcoming = appointments
        .filter(item => new Date(item.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    const list = document.getElementById('upcomingAppointments');
    if (list) {
        list.innerHTML = upcoming.length ? upcoming.map(item => `
                <li>${item.patientName} with ${item.doctorName} on ${item.date} at ${item.time}</li>
            `).join('') : '<li>No upcoming appointments</li>';
    }
}

function renderDoctorsPage() {
    const doctors = readData(storageKeys.doctors);
    const tableBody = document.getElementById('doctorListBody');
    if (tableBody) {
        tableBody.innerHTML = doctors.map(doctor => `
            <tr>
                <td>${doctor.name}</td>
                <td>${doctor.specialty}</td>
                <td>${doctor.schedule}</td>
                <td>${doctor.phone}</td>
                <td><button class="table-action" onclick="removeDoctor('${doctor.id}')">Remove</button></td>
            </tr>
        `).join('');
    }
    setListOptions('appointmentDoctor', doctors, 'name');
    setListOptions('billingDoctor', doctors, 'name');
    updateDoctorFilter();
}

function renderPatientsPage() {
    const patients = readData(storageKeys.patients);
    const tableBody = document.getElementById('patientListBody');
    if (tableBody) {
        tableBody.innerHTML = patients.map(patient => `
            <tr>
                <td>${patient.name}</td>
                <td>${patient.gender}</td>
                <td>${patient.age}</td>
                <td>${patient.contact}</td>
                <td>${patient.condition}</td>
            </tr>
        `).join('');
    }
    const patientSelect = document.getElementById('billingPatient');
    if (patientSelect) {
        patientSelect.innerHTML = '<option value="">Select</option>' + patients.map(patient => `<option value="${patient.id}">${patient.name}</option>`).join('');
    }
}

function renderAppointmentPage() {
    const appointments = readData(storageKeys.appointments);
    const tableBody = document.getElementById('appointmentListBody');
    if (tableBody) {
        tableBody.innerHTML = appointments.map(item => `
            <tr>
                <td>${item.patientName}</td>
                <td>${item.doctorName}</td>
                <td>${item.date}</td>
                <td>${item.time}</td>
                <td>${item.reason}</td>
                <td><button class="table-action" onclick="cancelAppointment('${item.id}')">Cancel</button></td>
            </tr>
        `).join('') || '<tr><td colspan="6" style="text-align:center; color: rgba(243,244,255,0.8);">No appointments booked yet.</td></tr>';
    }
}

function renderBillingPage() {
    const bills = readData(storageKeys.bills);
    const tableBody = document.getElementById('billingListBody');
    if (tableBody) {
        tableBody.innerHTML = bills.map(bill => `
            <tr>
                <td>${bill.patientName}</td>
                <td>${bill.doctorName}</td>
                <td>${bill.billDate}</td>
                <td>${formatCurrency(bill.total)}</td>
                <td><button class="table-action" onclick="downloadBill('${bill.id}')">Download</button></td>
            </tr>
        `).join('') || '<tr><td colspan="5" style="text-align:center; color: rgba(243,244,255,0.8);">No bills generated yet.</td></tr>';
    }
}

function renderAdmitPage() {
    const doctors = readData(storageKeys.doctors);
    const patients = readData(storageKeys.patients);
    const appointments = readData(storageKeys.appointments);
    const users = readData(storageKeys.users);

    document.getElementById('admitDoctorCount').textContent = doctors.length;
    document.getElementById('admitPatientCount').textContent = patients.length;
    document.getElementById('admitAppointmentCount').textContent = appointments.length;
    document.getElementById('admitUserCount').textContent = users.length;

    const doctorTable = document.getElementById('admitDoctorListBody');
    if (doctorTable) {
        doctorTable.innerHTML = doctors.map(doctor => `
            <tr>
                <td>${doctor.name}</td>
                <td>${doctor.specialty}</td>
                <td>${doctor.schedule}</td>
                <td><button class="table-action" onclick="removeDoctor('${doctor.id}')">Remove</button></td>
            </tr>
        `).join('') || '<tr><td colspan="4" style="text-align:center; color: rgba(243,244,255,0.8);">No doctors in the system.</td></tr>';
    }

    const userTable = document.getElementById('userListBody');
    if (userTable) {
        userTable.innerHTML = users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.role}</td>
            </tr>
        `).join('');
    }
}

function updateDoctorFilter() {
    const doctorList = document.getElementById('doctorFilter');
    if (!doctorList) return;
    const doctors = readData(storageKeys.doctors);
    doctorList.innerHTML = '<option value="all">Show all doctors</option>' + doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
}

function removeDoctor(id) {
    const doctors = readData(storageKeys.doctors).filter(d => d.id !== id);
    saveData(storageKeys.doctors, doctors);
    renderPage();
    showToast('Doctor removed successfully');
}

function cancelAppointment(id) {
    const appointments = readData(storageKeys.appointments).filter(item => item.id !== id);
    saveData(storageKeys.appointments, appointments);
    renderPage();
    showToast('Appointment canceled');
}

function addDoctor(event) {
    event.preventDefault();
    const form = event.target;
    const doctor = {
        id: `doc-${Date.now()}`,
        name: form.doctorName.value.trim(),
        specialty: form.specialty.value.trim(),
        phone: form.phone.value.trim(),
        schedule: form.schedule.value.trim() || 'Flexible schedule'
    };
    if (!doctor.name || !doctor.specialty || !doctor.phone) {
        showToast('Please complete all doctor details');
        return;
    }
    const doctors = readData(storageKeys.doctors);
    doctors.push(doctor);
    saveData(storageKeys.doctors, doctors);
    form.reset();
    renderPage();
    showToast('Doctor added successfully');
}

function addPatient(event) {
    event.preventDefault();
    const form = event.target;
    const patient = {
        id: `pat-${Date.now()}`,
        name: form.patientName.value.trim(),
        age: form.age.value.trim(),
        gender: form.gender.value,
        contact: form.contact.value.trim(),
        condition: form.condition.value.trim() || 'General care'
    };
    if (!patient.name || !patient.age || !patient.contact) {
        showToast('Please complete the patient form');
        return;
    }
    const patients = readData(storageKeys.patients);
    patients.push(patient);
    saveData(storageKeys.patients, patients);
    form.reset();
    renderPage();
    showToast('Patient profile created');
}

function bookAppointment(event) {
    event.preventDefault();
    const form = event.target;
    const doctorId = form.doctorId.value;
    const doctor = readData(storageKeys.doctors).find(d => d.id === doctorId) || { name: form.doctorName.value.trim() };
    const appointment = {
        id: `app-${Date.now()}`,
        patientName: form.patientName.value.trim(),
        doctorId: doctorId,
        doctorName: doctor.name,
        date: form.date.value,
        time: form.time.value,
        reason: form.reason.value.trim() || 'Consultation'
    };
    if (!appointment.patientName || !appointment.doctorName || !appointment.date || !appointment.time) {
        showToast('Fill all appointment fields');
        return;
    }
    const appointments = readData(storageKeys.appointments);
    appointments.push(appointment);
    saveData(storageKeys.appointments, appointments);
    form.reset();
    renderPage();
    showToast('Appointment booked successfully');
}

function calculateBill() {
    const treatment = Number(document.getElementById('treatmentCharges')?.value || 0);
    const medicine = Number(document.getElementById('medicineCharges')?.value || 0);
    const room = Number(document.getElementById('roomCharges')?.value || 0);
    const other = Number(document.getElementById('otherCharges')?.value || 0);
    const total = treatment + medicine + room + other;
    const totalField = document.getElementById('billTotal');
    if (totalField) totalField.textContent = formatCurrency(total);
    return total;
}

function generateBill(event) {
    event.preventDefault();
    const form = event.target;
    const patientId = form.patientId.value;
    const doctorId = form.doctorId.value;
    const patients = readData(storageKeys.patients);
    const doctors = readData(storageKeys.doctors);
    const patient = patients.find(p => p.id === patientId);
    const doctor = doctors.find(d => d.id === doctorId);
    const bill = {
        id: `bill-${Date.now()}`,
        patientName: patient ? patient.name : form.patientName.value.trim() || 'Unknown Patient',
        doctorName: doctor ? doctor.name : form.doctorName.value.trim() || 'Unknown Doctor',
        billDate: new Date().toLocaleDateString('en-IN'),
        treatment: Number(form.treatmentCharges.value || 0),
        medicine: Number(form.medicineCharges.value || 0),
        room: Number(form.roomCharges.value || 0),
        other: Number(form.otherCharges.value || 0),
        total: calculateBill()
    };
    if (!bill.patientName || !bill.doctorName) {
        showToast('Select a patient and doctor for billing');
        return;
    }
    const bills = readData(storageKeys.bills);
    bills.push(bill);
    saveData(storageKeys.bills, bills);
    form.reset();
    calculateBill();
    renderPage();
    showToast('Hospital bill generated');
}

function addAdmitUser(event) {
    event.preventDefault();
    const form = event.target;
    const user = {
        id: `usr-${Date.now()}`,
        name: form.userName.value.trim(),
        role: form.userRole.value.trim() || 'Staff'
    };
    if (!user.name) {
        showToast('Enter a user name');
        return;
    }
    const users = readData(storageKeys.users);
    users.push(user);
    saveData(storageKeys.users, users);
    form.reset();
    renderPage();
    showToast('User added to admit panel');
}

function downloadBill(id) {
    const bills = readData(storageKeys.bills);
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    const content = `Hospital Bill\n\nPatient: ${bill.patientName}\nDoctor: ${bill.doctorName}\nDate: ${bill.billDate}\n\nTreatment: ${formatCurrency(bill.treatment)}\nMedicine: ${formatCurrency(bill.medicine)}\nRoom: ${formatCurrency(bill.room)}\nOther: ${formatCurrency(bill.other)}\n\nTotal: ${formatCurrency(bill.total)}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `HospitalBill_${bill.id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Bill downloaded');
}

function renderPage() {
    ensureInitialStorage();
    const page = getCurrentPage();
    if (!page) return;

    switch (page) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'doctor':
            renderDoctorsPage();
            break;
        case 'patient':
            renderPatientsPage();
            break;
        case 'appointment':
            renderDoctorsPage();
            renderAppointmentPage();
            break;
        case 'billing':
            renderDoctorsPage();
            renderPatientsPage();
            renderBillingPage();
            break;
        case 'admit':
            renderAdmitPage();
            break;
        default:
            break;
    }
}

// ===== ENHANCED UI/UX FEATURES =====

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add ripple effect to all buttons
function addRippleEffect() {
    document.querySelectorAll('button, a.action-btn, .module-button, .table-action').forEach(element => {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255,255,255,0.5);
                border-radius: 50%;
                pointer-events: none;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
            `;

            if (!this.style.position || this.style.position === 'static') {
                this.style.position = 'relative';
            }

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Add animation styles if not present
function ensureAnimationStyles() {
    if (!document.querySelector('style[data-animations]')) {
        const style = document.createElement('style');
        style.setAttribute('data-animations', 'true');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            @keyframes slideInLeft {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            table tr {
                animation: slideInLeft 0.5s ease-out;
            }
            .metric, .module-card {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .metric:hover, .module-card:hover {
                transform: translateY(-5px);
            }
        `;
        document.head.appendChild(style);
    }
}

// Enhanced toast with animations
const originalShowToast = showToast;
showToast = function(message, duration = 2400) {
    const toast = document.getElementById('toast');
    if (!toast) {
        originalShowToast(message);
        return;
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    toast.style.animation = 'slideInRight 0.3s ease-out';
    
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.style.animation = 'slideInLeft 0.3s ease-out reverse';
        setTimeout(() => toast.classList.remove('show'), 300);
    }, duration);
};

// Form validation with visual feedback
function enhanceFormValidation() {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const inputs = this.querySelectorAll('input, select, textarea');
            let isValid = true;

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    input.style.borderColor = '#ef4444';
                    input.style.animation = 'shake 0.3s ease-in-out';
                    isValid = false;
                    setTimeout(() => {
                        input.style.animation = '';
                    }, 300);
                } else {
                    input.style.borderColor = '';
                }
            });

            if (!isValid) {
                e.preventDefault();
                showToast('Please fill all required fields', 2000);
            }
        }, true);
    });
}

// Add shake animation style
function addShakeAnimation() {
    if (!document.querySelector('style[data-shake]')) {
        const style = document.createElement('style');
        style.setAttribute('data-shake', 'true');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to show a save notification
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            showToast('Data saved successfully! ✓', 2000);
        }
        
        // Escape to clear focus
        if (e.key === 'Escape') {
            document.activeElement.blur();
        }
    });
}

// Add loading animation to buttons
function addLoadingStates() {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.textContent = '⏳ Processing...';
                submitBtn.disabled = true;
                
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }, 1000);
            }
        });
    });
}

// Counter animation for statistics
function animateCounters() {
    const counters = document.querySelectorAll('[id*="Count"]');
    counters.forEach(counter => {
        const target = parseInt(counter.textContent);
        const duration = 1500;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        // Trigger animation when element is in view
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                updateCounter();
                observer.unobserve(counter);
            }
        });
        
        observer.observe(counter);
    });
}

// Performance optimization - Lazy load images
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.src = entry.target.dataset.src;
                    imageObserver.unobserve(entry.target);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
    }
}

// Dark mode toggle (future enhancement)
function setupThemeToggle() {
    const themeToggle = document.querySelector('[data-theme-toggle]');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
            showToast('Theme updated!', 1500);
        });
    }
}

// Network status indicator
function setupNetworkStatus() {
    const updateStatus = () => {
        const statusEl = document.querySelector('[data-network-status]');
        if (statusEl) {
            statusEl.textContent = navigator.onLine ? '🟢 Online' : '🔴 Offline';
            statusEl.style.color = navigator.onLine ? '#10b981' : '#ef4444';
        }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
}

// Initialize all enhancements
function initializeEnhancements() {
    ensureAnimationStyles();
    addShakeAnimation();
    enhanceFormValidation();
    addRippleEffect();
    setupKeyboardShortcuts();
    addLoadingStates();
    animateCounters();
    setupLazyLoading();
    setupThemeToggle();
    setupNetworkStatus();
}

function filterDoctorAppointments(event) {
    const doctorId = event.target.value;
    const appointments = readData(storageKeys.appointments);
    const tableBody = document.getElementById('doctorAppointmentBody');
    if (!tableBody) return;
    const filtered = doctorId === 'all' ? appointments : appointments.filter(item => item.doctorId === doctorId);
    tableBody.innerHTML = filtered.map(item => `
        <tr>
            <td>${item.patientName}</td>
            <td>${item.doctorName}</td>
            <td>${item.date}</td>
            <td>${item.time}</td>
            <td>${item.reason}</td>
        </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center; color: rgba(243,244,255,0.8);">No appointments for this doctor.</td></tr>';
}

// Initialize application on page load
document.addEventListener('DOMContentLoaded', () => {
    ensureInitialStorage();
    renderPage();
    
    // Attach form submit handlers
    document.getElementById('doctorForm')?.addEventListener('submit', addDoctor);
    document.getElementById('patientForm')?.addEventListener('submit', addPatient);
    document.getElementById('appointmentForm')?.addEventListener('submit', bookAppointment);
    document.getElementById('billingForm')?.addEventListener('submit', generateBill);
    document.getElementById('admitUserForm')?.addEventListener('submit', addAdmitUser);
    document.querySelectorAll('.bill-input').forEach(input => input.addEventListener('input', calculateBill));
    document.getElementById('doctorFilter')?.addEventListener('change', filterDoctorAppointments);
    
    // Initialize UI enhancements
    initializeEnhancements();
    console.log('✅ Hospital Management System Ready!');
});

// Fallback if DOM is already loaded
if (document.readyState !== 'loading') {
    ensureInitialStorage();
    renderPage();
    
    // Attach form submit handlers
    document.getElementById('doctorForm')?.addEventListener('submit', addDoctor);
    document.getElementById('patientForm')?.addEventListener('submit', addPatient);
    document.getElementById('appointmentForm')?.addEventListener('submit', bookAppointment);
    document.getElementById('billingForm')?.addEventListener('submit', generateBill);
    document.getElementById('admitUserForm')?.addEventListener('submit', addAdmitUser);
    document.querySelectorAll('.bill-input').forEach(input => input.addEventListener('input', calculateBill));
    document.getElementById('doctorFilter')?.addEventListener('change', filterDoctorAppointments);
    
    // Initialize UI enhancements
    initializeEnhancements();
}
