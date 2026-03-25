window.onload = function () {

    /* ===========================
       LOGIN CHECK
    ============================ */
    if (!localStorage.getItem('user')) {
        window.location.href = 'login.html';
    }

    /* ===========================
       DATE LIMIT SETUP
    ============================ */
    const today = new Date().toISOString().split('T')[0];

    const dateInput = document.getElementById('date');
    const filterDateInput = document.getElementById('filter-date');

    if (dateInput) dateInput.setAttribute('max', today);
    if (filterDateInput) filterDateInput.setAttribute('max', today);

    /* ===========================
       LIVE DATE & TIME
    ============================ */
    function updateDateTime() {
        const now = new Date();

        const day = now.getDate();
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const month = monthNames[now.getMonth()];
        const year = now.getFullYear();

        let hours = now.getHours();
        let minutes = now.getMinutes();
        let seconds = now.getSeconds();

        // Add leading zero if needed
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        const formattedDateTime = `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;

        document.getElementById("datetime").textContent = formattedDateTime;
    }



    updateDateTime();
    setInterval(updateDateTime, 1000);

    /* ===========================
       DOM REFERENCES
    ============================ */
    const form = document.getElementById('data-form');
    const calcBtn = document.getElementById("calcTotal");
    const modal = document.getElementById('success-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const reportTableBody = document.getElementById('report-table-body');
    const filterBtn = document.getElementById('filter-btn');
    const navReportBtn = document.getElementById('nav-report');

    const entryContainer = document.getElementById('data-entry-container');
    const reportContainer = document.getElementById('report-container');

    /* ===========================
       CALCULATE TOTAL HOURS & COST
    ============================ */
    calcBtn.addEventListener("click", function () {

        const entry = document.getElementById("opening").value;
        const exit = document.getElementById("received").value;
        const extra = parseFloat(document.getElementById("extra").value) || 0;

        if (!entry || !exit) {
            alert("Please enter both entry and exit time.");
            return;
        }

        // Convert HH:MM to minutes
        const [entryH, entryM] = entry.split(":").map(Number);
        const [exitH, exitM] = exit.split(":").map(Number);

        const entryMinutes = entryH * 60 + entryM;
        const exitMinutes = exitH * 60 + exitM;

        let totalMinutes = exitMinutes - entryMinutes;

        // Handle next day exit (midnight case)
        if (totalMinutes < 0) {
            totalMinutes += 24 * 60;
        }

        // Add extra hours
        totalMinutes += extra * 60;

        // Convert back to hours + minutes
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const formattedTime = `${hours}h ${minutes}m`;

        document.getElementById("sap").value = formattedTime;

        /* COST CALCULATION */

        let rate = 0;
        const vehicle = document.getElementById("vehicle").value;

        if (vehicle === "Bicycle") rate = 5;
        if (vehicle === "Motorcycle") rate = 10;
        if (vehicle === "Car") rate = 20;

        const totalHoursDecimal = totalMinutes / 60;
        const totalCost = totalHoursDecimal * rate;

        document.getElementById("Total").value = totalCost.toFixed(2);
    });
    
    
    /* ===========================
       FORM SUBMISSION
    ============================ */
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const entryData = {
                date: document.getElementById('date').value,
                vehicle: document.getElementById('vehicle').value,
                personnel: document.getElementById('personnel').value,
                passengers: document.getElementById('passengers').value,
                vehicleNo: document.getElementById('vehicleNo').value,
                entryTime: document.getElementById('opening').value,
                exitTime: document.getElementById('received').value,
                extra: document.getElementById('extra').value,
                totalHours: document.getElementById('sap').value,
                totalCost: document.getElementById('Total').value,
                remarks: document.getElementById('remarks').value
            };

            
            fetch("http://127.0.0.1:5000/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(entryData)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        modal.classList.remove('hidden');
                        form.reset();
                    } else {
                        alert("Failed to save data");
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert("Server error");
                });
        });
    }

    /* ===========================
       CLOSE MODAL
    ============================ */
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function () {
            modal.classList.add('hidden');
        });
    }

    /* ===========================
       REPORT RENDER FUNCTION
    ============================ */
    async function renderReport() {
        const filterDate = document.getElementById('filter-date')?.value || '';
        const filterVehicleNo = document.getElementById('filter-vehicle-no')?.value.trim() || '';

        // Build query params
        const params = new URLSearchParams();
        if (filterDate) params.append('date', filterDate);
        if (filterVehicleNo) params.append('vehicleNo', filterVehicleNo);

        try {
            const response = await fetch(`http://127.0.0.1:5000/report?${params.toString()}`);
            const result = await response.json();

            reportTableBody.innerHTML = '';

            if (!result.success) {
                const row = reportTableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 11;
                cell.textContent = 'Failed to load data from server.';
                cell.style.textAlign = 'center';
                return;
            }

            const data = result.data;

            // Update summary bar
            const summaryBar = document.getElementById('report-summary');
            document.getElementById('summary-count').textContent = result.count;
            document.getElementById('summary-total').textContent = '₹' + result.totalCollection.toFixed(2);
            summaryBar.style.display = 'flex';

            if (data.length === 0) {
                const row = reportTableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 11;
                cell.textContent = 'No records found for the selected filters.';
                cell.style.textAlign = 'center';
                cell.style.padding = '18px';
                cell.style.color = '#888';
            } else {
                data.forEach(item => {
                    const row = reportTableBody.insertRow();
                    row.insertCell().textContent = item.date ?? '';
                    row.insertCell().textContent = item.vehicle ?? '';
                    row.insertCell().textContent = item.personnel ?? '';
                    row.insertCell().textContent = item.passengers ?? '';
                    row.insertCell().textContent = item.vehicleNo ?? '';
                    row.insertCell().textContent = item.entryTime ?? '';
                    row.insertCell().textContent = item.exitTime ?? '';
                    row.insertCell().textContent = item.extraHours ?? '';
                    row.insertCell().textContent = item.totalHours ?? '';

                    const costCell = row.insertCell();
                    const cost = parseFloat(item.totalCost);
                    costCell.textContent = isNaN(cost) ? (item.totalCost ?? '') : '₹' + cost.toFixed(2);
                    costCell.style.fontWeight = '600';
                    costCell.style.color = '#28a745';

                    row.insertCell().textContent = item.remarks ?? '';
                });
            }
        } catch (err) {
            console.error(err);
            reportTableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:red;padding:18px;">Error connecting to server. Make sure the backend is running.</td></tr>';
        }
    }

    /* ===========================
       FILTER BUTTON
    ============================ */
    if (filterBtn) {
        filterBtn.addEventListener('click', renderReport);
    }

    // Clear filter button
    const clearFilterBtn = document.getElementById('clear-filter-btn');
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', function () {
            const fd = document.getElementById('filter-date');
            const fv = document.getElementById('filter-vehicle-no');
            if (fd) fd.value = '';
            if (fv) fv.value = '';
            renderReport();
        });
    }

    /* ===========================
       NAVIGATION SWITCH
    ============================ */
    if (navReportBtn) {
        navReportBtn.addEventListener('click', function () {
            entryContainer.classList.add('hidden');
            reportContainer.classList.remove('hidden');
            renderReport();
        });
    }

    /* ===========================
       LOGOUT
    ============================ */
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

};
