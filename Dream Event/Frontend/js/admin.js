// Admin Dashboard JavaScript
const API = 'http://localhost:5001/api';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeEventListeners();
});

// Check if user is authenticated and is admin
async function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Authentication failed');
        }
        
        const data = await response.json();
        
        if (data.user.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return;
        }
        
        // Update admin info
        document.getElementById('adminName').textContent = data.user.username;
        
        // Load dashboard data
        loadDashboard();
        
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Search functionality
    document.getElementById('bookingSearch')?.addEventListener('input', function() {
        searchBookings(this.value);
    });
    
    document.getElementById('userSearch')?.addEventListener('input', function() {
        searchUsers(this.value);
    });
    
    document.getElementById('feedbackSearch')?.addEventListener('input', function() {
        searchFeedback(this.value);
    });
}

// Switch between tabs
function switchTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        bookings: 'Bookings Management',
        users: 'Users Management',
        feedback: 'Feedback Management',
        analytics: 'Analytics',
        reports: 'Reports & Analytics'
    };
    
    const subtitles = {
        dashboard: 'Manage your Dream Event platform',
        bookings: 'View and manage all event bookings',
        users: 'Manage user accounts and permissions',
        feedback: 'View and respond to customer feedback',
        analytics: 'Track platform performance and trends',
        reports: 'Generate and download comprehensive reports'
    };
    
    document.getElementById('pageTitle').textContent = titles[tabName];
    document.getElementById('pageSubtitle').textContent = subtitles[tabName];
    
    // Load tab-specific data
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'bookings':
            loadBookings();
            break;
        case 'users':
            loadUsers();
            break;
        case 'feedback':
            loadFeedback();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'reports':
            initializeReports();
            break;
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load dashboard');
        
        const data = await response.json();
        
        // Update stats
        document.getElementById('totalBookings').textContent = data.totalBookings;
        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('totalFeedback').textContent = data.totalFeedback;
        document.getElementById('revenue').textContent = data.estimatedRevenue;
        
        // Update recent bookings
        const recentBookingsHtml = data.recentBookings.map(booking => `
            <div class="booking-item">
                <h4>${booking.name}</h4>
                <p><strong>Email:</strong> ${booking.email}</p>
                <p><strong>Event:</strong> ${booking.eventType}</p>
                <p><strong>Date:</strong> ${new Date(booking.eventDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${booking.status}">${booking.status}</span></p>
            </div>
        `).join('');
        document.getElementById('recentBookings').innerHTML = recentBookingsHtml || '<p>No recent bookings</p>';
        
        // Update recent feedback
        const recentFeedbackHtml = data.recentFeedback.map(feedback => `
            <div class="feedback-item">
                <h4>${feedback.name}</h4>
                <p><strong>Rating:</strong> ${'⭐'.repeat(feedback.rating)}</p>
                <p><strong>Message:</strong> ${feedback.message.substring(0, 100)}...</p>
                <p><strong>Date:</strong> ${new Date(feedback.createdAt).toLocaleDateString()}</p>
            </div>
        `).join('');
        document.getElementById('recentFeedback').innerHTML = recentFeedbackHtml || '<p>No recent feedback</p>';
        
    } catch (error) {
        console.error('Dashboard load error:', error);
        showError('Failed to load dashboard data');
    }
}

// Load bookings
async function loadBookings() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/admin/bookings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load bookings');
        
        const data = await response.json();
        displayBookings(data.bookings);
        
    } catch (error) {
        console.error('Bookings load error:', error);
        showError('Failed to load bookings');
    }
}

// Display bookings in table
function displayBookings(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    
    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No bookings found</td></tr>';
        return;
    }
    
    const bookingsHtml = bookings.map(booking => `
        <tr>
            <td>${booking._id.substring(0, 8)}...</td>
            <td>${booking.name}</td>
            <td>${booking.email}</td>
            <td>${booking.eventType}</td>
            <td>${new Date(booking.eventDate).toLocaleDateString()}</td>
            <td><span class="status-badge status-${booking.status}">${booking.status}</span></td>
            <td>
                <button class="btn btn-primary" onclick="updateBookingStatus('${booking._id}', 'confirmed')">Confirm</button>
                <button class="btn btn-danger" onclick="deleteBooking('${booking._id}')">Delete</button>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = bookingsHtml;
}

// Update booking status
async function updateBookingStatus(bookingId, status) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/admin/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) throw new Error('Failed to update booking');
        
        showSuccess('Booking status updated successfully');
        loadBookings();
        
    } catch (error) {
        console.error('Update booking error:', error);
        showError('Failed to update booking status');
    }
}

// Delete booking
function deleteBooking(bookingId) {
    showConfirmModal('Delete Booking', 'Are you sure you want to delete this booking?', async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API}/admin/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete booking');
            
            showSuccess('Booking deleted successfully');
            loadBookings();
            
        } catch (error) {
            console.error('Delete booking error:', error);
            showError('Failed to delete booking');
        }
    });
}

// Load users
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load users');
        
        const data = await response.json();
        displayUsers(data.users);
        
    } catch (error) {
        console.error('Users load error:', error);
        showError('Failed to load users');
    }
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No users found</td></tr>';
        return;
    }
    
    const usersHtml = users.map(user => `
        <tr>
            <td>${user._id.substring(0, 8)}...</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="role-badge role-${user.role}">${user.role}</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-primary" onclick="toggleUserRole('${user._id}', '${user.role}')">
                    ${user.role === 'admin' ? 'Make User' : 'Make Admin'}
                </button>
                <button class="btn btn-danger" onclick="deleteUser('${user._id}')">Delete</button>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = usersHtml;
}

// Toggle user role
async function toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });
        
        if (!response.ok) throw new Error('Failed to update user role');
        
        showSuccess(`User role updated to ${newRole}`);
        loadUsers();
        
    } catch (error) {
        console.error('Update user role error:', error);
        showError('Failed to update user role');
    }
}

// Delete user
function deleteUser(userId) {
    showConfirmModal('Delete User', 'Are you sure you want to delete this user? All their bookings will also be deleted.', async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete user');
            
            showSuccess('User deleted successfully');
            loadUsers();
            
        } catch (error) {
            console.error('Delete user error:', error);
            showError('Failed to delete user');
        }
    });
}

// Load feedback
async function loadFeedback() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/admin/feedback`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load feedback');
        
        const data = await response.json();
        displayFeedback(data.feedback);
        
    } catch (error) {
        console.error('Feedback load error:', error);
        showError('Failed to load feedback');
    }
}

// Display feedback cards
function displayFeedback(feedback) {
    const grid = document.getElementById('feedbackGrid');
    
    if (feedback.length === 0) {
        grid.innerHTML = '<div class="loading">No feedback found</div>';
        return;
    }
    
    const feedbackHtml = feedback.map(item => `
        <div class="feedback-card">
            <div class="feedback-header">
                <h4>${item.name}</h4>
                <div class="rating">${'⭐'.repeat(item.rating)}</div>
            </div>
            <div class="feedback-message">${item.message}</div>
            <div class="feedback-date">${new Date(item.createdAt).toLocaleDateString()}</div>
            <div style="margin-top: 15px;">
                <button class="btn btn-danger" onclick="deleteFeedback('${item._id}')">Delete</button>
            </div>
        </div>
    `).join('');
    
    grid.innerHTML = feedbackHtml;
}

// Delete feedback
function deleteFeedback(feedbackId) {
    showConfirmModal('Delete Feedback', 'Are you sure you want to delete this feedback?', async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API}/admin/feedback/${feedbackId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete feedback');
            
            showSuccess('Feedback deleted successfully');
            loadFeedback();
            
        } catch (error) {
            console.error('Delete feedback error:', error);
            showError('Failed to delete feedback');
        }
    });
}

// Load analytics
async function loadAnalytics() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/admin/analytics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load analytics');
        
        const data = await response.json();
        
        // Update analytics charts (placeholder for now)
        console.log('Analytics data:', data);
        
    } catch (error) {
        console.error('Analytics load error:', error);
        showError('Failed to load analytics');
    }
}

// Refresh functions
function refreshBookings() {
    loadBookings();
}

function refreshUsers() {
    loadUsers();
}

function refreshFeedback() {
    loadFeedback();
}

// Search functions
function searchBookings(query) {
    // Implement search functionality
    console.log('Searching bookings:', query);
}

function searchUsers(query) {
    // Implement search functionality
    console.log('Searching users:', query);
}

function searchFeedback(query) {
    // Implement search functionality
    console.log('Searching feedback:', query);
}

// Modal functions
function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    
    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.onclick = function() {
        onConfirm();
        closeModal();
    };
    
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('confirmModal').classList.remove('show');
}

// Notification functions
function showSuccess(message) {
    // Create success notification
    showNotification(message, 'success');
}

function showError(message) {
    // Create error notification
    showNotification(message, 'error');
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===== REPORTS FUNCTIONALITY =====
let reportData = null;
let reportGenerationStartTime = 0;

// Initialize reports functionality
function initializeReports() {
    // Date range change handler
    document.getElementById('dateRange')?.addEventListener('change', function() {
        const customRange = document.getElementById('customDateRange');
        if (this.value === 'custom') {
            customRange.style.display = 'flex';
        } else {
            customRange.style.display = 'none';
        }
    });
    
    // Load reports stats
    loadReportsStats();
}

// Load reports statistics
async function loadReportsStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/admin/reports-stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalReports').textContent = stats.totalReports;
            document.getElementById('totalDownloads').textContent = stats.totalDownloads;
            document.getElementById('lastReport').textContent = stats.lastReport ? 
                new Date(stats.lastReport).toLocaleDateString() : 'Never';
            document.getElementById('avgTime').textContent = `${stats.avgTime}s`;
        }
    } catch (error) {
        console.error('Error loading reports stats:', error);
    }
}

// Generate report
async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const dateRange = document.getElementById('dateRange').value;
    const format = document.getElementById('format').value;
    
    let startDate = null;
    let endDate = null;
    
    if (dateRange === 'custom') {
        startDate = document.getElementById('startDate').value;
        endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            showError('Please select both start and end dates for custom range');
            return;
        }
    }
    
    reportGenerationStartTime = Date.now();
    
    try {
        const token = localStorage.getItem('token');
        let url = `${API}/admin/reports/${reportType}?dateRange=${dateRange}`;
        if (startDate && endDate) {
            url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to generate report');
        
        reportData = await response.json();
        
        if (format === 'pdf') {
            generatePDFReport(reportData, reportType, dateRange);
        } else {
            generateCSVReport(reportData, reportType, dateRange);
        }
        
        // Update stats
        updateReportsStats();
        addReportToHistory(reportType, dateRange, format);
        
    } catch (error) {
        console.error('Report generation error:', error);
        showError('Failed to generate report: ' + error.message);
    }
}

// Generate PDF report
function generatePDFReport(data, type, dateRange) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add custom font for better support
    doc.setFont('helvetica');
    
    // Title
    doc.setFontSize(20);
    doc.text('Dream Event - ' + type.charAt(0).toUpperCase() + type.slice(1) + ' Report', 14, 20);
    
    // Subtitle with date range
    doc.setFontSize(12);
    doc.text('Date Range: ' + getDateRangeText(dateRange), 14, 30);
    doc.text('Generated: ' + new Date().toLocaleString(), 14, 37);
    
    let yPosition = 50;
    
    // Add statistics
    if (data.stats) {
        doc.setFontSize(14);
        doc.text('Summary Statistics', 14, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        Object.entries(data.stats).forEach(([key, value]) => {
            if (typeof value === 'object') {
                doc.text(key + ':', 14, yPosition);
                yPosition += 7;
                Object.entries(value).forEach(([subKey, subValue]) => {
                    doc.text('  - ' + subKey + ': ' + subValue, 20, yPosition);
                    yPosition += 5;
                });
            } else {
                doc.text(key + ': ' + value, 14, yPosition);
                yPosition += 5;
            }
        });
        yPosition += 10;
    }
    
    // Add data table
    if (data.bookings || data.users || data.feedback || data.events) {
        const items = data.bookings || data.users || data.feedback || data.events;
        
        if (items.length > 0) {
            // Define table columns based on report type
            let columns = [];
            let dataRows = [];
            
            switch (type) {
                case 'bookings':
                    columns = ['Name', 'Email', 'Event Type', 'Date', 'Status', 'Budget'];
                    dataRows = items.map(item => [
                        item.name || 'N/A',
                        item.email || 'N/A',
                        item.eventType || 'N/A',
                        item.eventDate ? new Date(item.eventDate).toLocaleDateString() : 'N/A',
                        item.status || 'N/A',
                        '$' + (item.budget || 0)
                    ]);
                    break;
                    
                case 'users':
                    columns = ['Username', 'Email', 'Role', 'Joined'];
                    dataRows = items.map(item => [
                        item.username || 'N/A',
                        item.email || 'N/A',
                        item.role || 'user',
                        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'
                    ]);
                    break;
                    
                case 'feedback':
                    columns = ['Name', 'Email', 'Rating', 'Date'];
                    dataRows = items.map(item => [
                        item.name || 'N/A',
                        item.email || 'N/A',
                        '⭐'.repeat(item.rating || 0),
                        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'
                    ]);
                    break;
                    
                case 'events':
                    columns = ['Name', 'Event Type', 'Date', 'Status', 'Guests'];
                    dataRows = items.map(item => [
                        item.name || 'N/A',
                        item.eventType || 'N/A',
                        item.eventDate ? new Date(item.eventDate).toLocaleDateString() : 'N/A',
                        item.status || 'N/A',
                        item.guestCount || 0
                    ]);
                    break;
            }
            
            // Add table using autoTable
            doc.autoTable({
                head: [columns],
                body: dataRows,
                startY: yPosition,
                theme: 'grid',
                styles: {
                    fontSize: 9,
                    cellPadding: 3
                },
                headStyles: {
                    fillColor: [232, 67, 147],
                    textColor: 255
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                }
            });
        }
    }
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text('Page ' + i + ' of ' + pageCount, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        doc.text('Dream Event Management System', 14, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    const fileName = `dream-event-${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    const generationTime = ((Date.now() - reportGenerationStartTime) / 1000).toFixed(2);
    showSuccess(`PDF report generated successfully in ${generationTime}s!`);
}

// Generate CSV report
function generateCSVReport(data, type, dateRange) {
    const items = data.bookings || data.users || data.feedback || data.events;
    
    if (!items || items.length === 0) {
        showError('No data available for CSV export');
        return;
    }
    
    let csvContent = '';
    let headers = [];
    
    switch (type) {
        case 'bookings':
            headers = ['Name', 'Email', 'Event Type', 'Event Date', 'Status', 'Budget', 'Created At'];
            csvContent = headers.join(',') + '\n';
            items.forEach(item => {
                csvContent += [
                    `"${item.name || 'N/A'}"`,
                    `"${item.email || 'N/A'}"`,
                    `"${item.eventType || 'N/A'}"`,
                    `"${item.eventDate ? new Date(item.eventDate).toLocaleDateString() : 'N/A'}"`,
                    `"${item.status || 'N/A'}"`,
                    `"${item.budget || 0}"`,
                    `"${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}"`
                ].join(',') + '\n';
            });
            break;
            
        case 'users':
            headers = ['Username', 'Email', 'Role', 'Created At'];
            csvContent = headers.join(',') + '\n';
            items.forEach(item => {
                csvContent += [
                    `"${item.username || 'N/A'}"`,
                    `"${item.email || 'N/A'}"`,
                    `"${item.role || 'user'}"`,
                    `"${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}"`
                ].join(',') + '\n';
            });
            break;
            
        case 'feedback':
            headers = ['Name', 'Email', 'Rating', 'Message', 'Created At'];
            csvContent = headers.join(',') + '\n';
            items.forEach(item => {
                csvContent += [
                    `"${item.name || 'N/A'}"`,
                    `"${item.email || 'N/A'}"`,
                    `"${item.rating || 0}"`,
                    `"${(item.message || '').replace(/"/g, '""')}"`,
                    `"${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}"`
                ].join(',') + '\n';
            });
            break;
            
        case 'events':
            headers = ['Name', 'Email', 'Event Type', 'Event Date', 'Status', 'Guest Count', 'Budget', 'Created At'];
            csvContent = headers.join(',') + '\n';
            items.forEach(item => {
                csvContent += [
                    `"${item.name || 'N/A'}"`,
                    `"${item.email || 'N/A'}"`,
                    `"${item.eventType || 'N/A'}"`,
                    `"${item.eventDate ? new Date(item.eventDate).toLocaleDateString() : 'N/A'}"`,
                    `"${item.status || 'N/A'}"`,
                    `"${item.guestCount || 0}"`,
                    `"${item.budget || 0}"`,
                    `"${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}"`
                ].join(',') + '\n';
            });
            break;
    }
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dream-event-${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const generationTime = ((Date.now() - reportGenerationStartTime) / 1000).toFixed(2);
    showSuccess(`CSV report generated successfully in ${generationTime}s!`);
}

// Preview report
async function previewReport() {
    if (!reportData) {
        showError('Please generate a report first');
        return;
    }
    
    const previewDiv = document.getElementById('reportPreview');
    const previewContent = document.getElementById('previewContent');
    
    let previewHtml = '<div class="preview-stats">';
    
    if (reportData.stats) {
        Object.entries(reportData.stats).forEach(([key, value]) => {
            if (typeof value === 'object') {
                previewHtml += `<h4>${key}</h4><ul>`;
                Object.entries(value).forEach(([subKey, subValue]) => {
                    previewHtml += `<li><strong>${subKey}:</strong> ${subValue}</li>`;
                });
                previewHtml += '</ul>';
            } else {
                previewHtml += `<p><strong>${key}:</strong> ${value}</p>`;
            }
        });
    }
    
    previewHtml += '</div>';
    
    const items = reportData.bookings || reportData.users || reportData.feedback || reportData.events;
    if (items && items.length > 0) {
        previewHtml += `<h4>Sample Data (showing first 5 items)</h4>`;
        previewHtml += '<table class="preview-table"><thead><tr>';
        
        // Add table headers based on data type
        if (reportData.bookings) {
            previewHtml += '<th>Name</th><th>Email</th><th>Event Type</th><th>Status</th>';
        } else if (reportData.users) {
            previewHtml += '<th>Username</th><th>Email</th><th>Role</th>';
        } else if (reportData.feedback) {
            previewHtml += '<th>Name</th><th>Rating</th><th>Date</th>';
        }
        
        previewHtml += '</tr></thead><tbody>';
        
        // Add first 5 rows
        items.slice(0, 5).forEach(item => {
            previewHtml += '<tr>';
            if (reportData.bookings) {
                previewHtml += `<td>${item.name || 'N/A'}</td><td>${item.email || 'N/A'}</td><td>${item.eventType || 'N/A'}</td><td>${item.status || 'N/A'}</td>`;
            } else if (reportData.users) {
                previewHtml += `<td>${item.username || 'N/A'}</td><td>${item.email || 'N/A'}</td><td>${item.role || 'user'}</td>`;
            } else if (reportData.feedback) {
                previewHtml += `<td>${item.name || 'N/A'}</td><td>${'⭐'.repeat(item.rating || 0)}</td><td>${new Date(item.createdAt).toLocaleDateString()}</td>`;
            }
            previewHtml += '</tr>';
        });
        
        previewHtml += '</tbody></table>';
    }
    
    previewContent.innerHTML = previewHtml;
    previewDiv.style.display = 'block';
}

// Get date range text
function getDateRangeText(range) {
    const today = new Date();
    switch (range) {
        case 'today': return 'Today';
        case 'week': return 'This Week';
        case 'month': return 'This Month';
        case 'quarter': return 'This Quarter';
        case 'year': return 'This Year';
        case 'all': return 'All Time';
        case 'custom': return 'Custom Range';
        default: return range;
    }
}

// Update reports stats
function updateReportsStats() {
    const totalReports = document.getElementById('totalReports');
    const avgTime = document.getElementById('avgTime');
    const lastReport = document.getElementById('lastReport');
    
    totalReports.textContent = parseInt(totalReports.textContent) + 1;
    
    const generationTime = ((Date.now() - reportGenerationStartTime) / 1000).toFixed(2);
    const currentAvg = parseFloat(avgTime.textContent);
    const newAvg = ((currentAvg * (parseInt(totalReports.textContent) - 1)) + parseFloat(generationTime)) / parseInt(totalReports.textContent);
    avgTime.textContent = newAvg.toFixed(2) + 's';
    
    lastReport.textContent = new Date().toLocaleDateString();
}

// Add report to history
function addReportToHistory(type, dateRange, format) {
    const tbody = document.getElementById('reportsTableBody');
    const now = new Date();
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${type.charAt(0).toUpperCase() + type.slice(1)} Report</td>
        <td>${getDateRangeText(dateRange)}</td>
        <td>${now.toLocaleString()}</td>
        <td>${format.toUpperCase()}</td>
        <td><span class="status-badge status-confirmed">Completed</span></td>
        <td>
            <button class="btn btn-primary" onclick="generateReport()">Regenerate</button>
        </td>
    `;
    
    // Remove "No reports" message if it exists
    const noReportsRow = tbody.querySelector('td[colspan="6"]');
    if (noReportsRow) {
        tbody.innerHTML = '';
    }
    
    tbody.insertBefore(row, tbody.firstChild);
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Add slide-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
