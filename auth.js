const auth = {
    isAdminAuthenticated: false,

    async promptAdmin() {
        const pass = prompt("Ingrese Contraseña de Seguridad Maestra:");
        if (!pass) return;
        
        const settings = await storage.get('settings');
        const masterPass = settings.masterPass || 'admin1234';

        if (pass === masterPass) {
            this.isAdminAuthenticated = true;
            storage.logSystemHistory('AUTH_SUCCESS', 'Acceso concedido a consola de administración');
            ui.navigateTo('view-dashboard');
            alert("Acceso Autorizado Corporativo.");
        } else {
            alert("Credenciales Invalidas. Evento reportado.");
            storage.logSystemHistory('AUTH_FAILURE', 'Intento fallido de acceso administrativo');
        }
    },

    async updateMasterPassword() {
        const newPass = document.getElementById('config-master-pass').value;
        if (newPass.length < 4) {
            alert("La clave debe tener al menos 4 caracteres.");
            return;
        }
        await storage.save('settings', { masterPass: newPass });
        alert("Contraseña maestra actualizada.");
    },

    logoutAdmin() {
        this.isAdminAuthenticated = false;
        ui.navigateTo('view-checador');
    }
};
