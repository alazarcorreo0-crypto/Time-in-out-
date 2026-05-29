const ui = {
    navigateTo(viewId) {
        // Guardrail de Seguridad: Proteger secciones administrativas
        if (viewId !== 'view-checador' && !auth.isAdminAuthenticated) {
            alert("Acceso denegado. Se requiere autenticación maestra.");
            this.navigateTo('view-checador');
            return;
        }

        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(viewId).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick').includes(viewId)) {
                btn.classList.add('active');
            }
        });

        this.refreshViewData(viewId);
    },

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', nextTheme);
        document.getElementById('theme-toggle').innerText = nextTheme === 'light' ? '🌙' : '☀️';
    },

    async refreshViewData(viewId) {
        if (viewId === 'view-checador') this.populateChecadorEmployees();
        if (viewId === 'view-dashboard') this.renderDashboard();
        if (viewId === 'view-turnos') this.renderTurnosTable();
        if (viewId === 'view-nomina') this.renderNominaTable();
        if (viewId === 'view-empleados') this.renderEmployeesTable();
        if (viewId === 'view-historial') this.renderHistoryTable();
    },

    async populateChecadorEmployees() {
        const select = document.getElementById('checador-empleado');
        const emps = await employees.getAll();
        select.innerHTML = emps.filter(e => e.status === 'Activo').map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    },

    async renderDashboard() {
        const emps = await employees.getAll();
        const shifts = await storage.get('attendance');
        const payrollData = await payroll.calculateWeeklyReport();

        const total = emps.length;
        const abiertos = shifts.filter(s => !s.outTimestamp).length;
        const activosHoy = shifts.filter(s => s.date === new Date().toISOString().slice(0, 10)).length;
        const totalNomina = payrollData.reduce((acc, curr) => acc + curr.totalGross, 0);

        document.getElementById('kpi-total').innerText = total;
        document.getElementById('kpi-activos').innerText = activosHoy;
        document.getElementById('kpi-abiertos').innerText = abiertos;
        document.getElementById('kpi-nomina').innerText = `$${totalNomina.toLocaleString('en-US', {minimumFractionDigits: 2})}`;

        const presentesPct = total > 0 ? (activosHoy / total) * 100 : 0;
        document.getElementById('bar-presentes').style.width = `${presentesPct}%`;
        document.getElementById('bar-ausentes').style.width = `${100 - presentesPct}%`;
    },

    async renderTurnosTable() {
        const shifts = await storage.get('attendance');
        const tbody = document.getElementById('table-turnos-body');
        
        tbody.innerHTML = shifts.map(s => `
            <tr>
                <td><b>${s.employeeName}</b></td>
                <td>${s.date}</td>
                <td>${new Date(s.inTimestamp).toLocaleTimeString()}</td>
                <td>${s.outTimestamp ? new Date(s.outTimestamp).toLocaleTimeString() : '<span class="badge badge-danger">Abierto</span>'}</td>
                <td>${s.hoursWorked} hrs</td>
                <td>
                    <div style="display:flex; gap:4px;">
                        <img src="${s.inPhoto}" width="40" height="30" style="border-radius:4px; object-fit:cover; border:1px solid var(--border)">
                        ${s.outPhoto ? `<img src="${s.outPhoto}" width="40" height="30" style="border-radius:4px; object-fit:cover; border:1px solid var(--border)">` : ''}
                    </div>
                </td>
                <td>
                    <button class="btn btn-secondary" style="padding:6px 10px; font-size:0.75rem" onclick="ui.deleteTurno('${s.id}')">Eliminar</button>
                </td>
            </tr>
        `).join('');
    },

    async renderNominaTable() {
        const data = await payroll.calculateWeeklyReport();
        const tbody = document.getElementById('table-nomina-body');
        
        tbody.innerHTML = data.map(item => `
            <tr>
                <td><b>${item.name}</b></td>
                <td>${item.totalHours} hrs</td>
                <td>$${item.rate.toFixed(2)}</td>
                <td><b>$${item.totalGross.toLocaleString('en-US', {minimumFractionDigits:2})}</b></td>
                <td><span class="badge badge-success">Calculado</span></td>
                <td><button class="btn btn-primary" style="padding:6px 12px; font-size:0.75rem" onclick="alert('Nómina dispersada vía transferencia bancaria de simulación.')">Pagar</button></td>
            </tr>
        `).join('');
    },

    async renderEmployeesTable() {
        const emps = await employees.getAll();
        const tbody = document.getElementById('table-empleados-body');
        
        tbody.innerHTML = emps.map(e => `
            <tr>
                <td><small>${e.id}</small></td>
                <td><b>${e.name}</b></td>
                <td><code>${e.pin}</code></td>
                <td>$${e.rate.toFixed(2)}/hr</td>
                <td><span class="badge ${e.status === 'Activo' ? 'badge-success' : 'badge-danger'}">${e.status}</span></td>
                <td>
                    <button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem" onclick="ui.toggleEmployeeStatus('${e.id}')">Estatus</button>
                    <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem; color:#fff;" onclick="ui.deleteEmployee('${e.id}')">Eliminar</button>
                </td>
            </tr>
        `).join('');
    },

    async renderHistoryTable() {
        const logs = JSON.parse(localStorage.getItem('history')) || [];
        const tbody = document.getElementById('table-historial-body');
        tbody.innerHTML = logs.slice(0, 50).map(l => `
            <tr>
                <td><small>${new Date(l.timestamp).toLocaleString()}</small></td>
                <td><span class="badge badge-success" style="background:rgba(59,130,246,0.1); color:var(--brand);">${l.event}</span></td>
                <td>${l.description}</td>
            </tr>
        `).join('');
    },

    showCreateEmployeeModal() {
        const name = prompt("Nombre Completo:");
        if (!name) return;
        const pin = prompt("PIN de Seguridad (4 dígitos numéricos):");
        if (!pin || pin.length !== 4) { alert("PIN Inválido."); return; }
        const rate = prompt("Tarifa de pago por hora ($):");
        if (!rate || isNaN(rate)) { alert("Tarifa Inválida."); return; }

        employees.create(name, pin, rate)
            .then(() => { alert("Empleado dado de alta en sistema."); this.renderEmployeesTable(); })
            .catch(err => alert(err.message));
    },

    async toggleEmployeeStatus(id) {
        await employees.toggleStatus(id);
        this.renderEmployeesTable();
    },

    async deleteEmployee(id) {
        if (confirm("¿Está seguro de purgar este registro de empleado?")) {
            await employees.deleteEmployee(id);
            this.renderEmployeesTable();
        }
    },

    async deleteTurno(id) {
        if (confirm("¿Desea eliminar de forma permanente este registro de turno?")) {
            await storage.delete('attendance', id);
            this.renderTurnosTable();
        }
    }
};
