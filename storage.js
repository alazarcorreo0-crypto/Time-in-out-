const storage = {
    initCollection(key, defaultData = []) {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(defaultData));
        }
    },

    get(collection) {
        return Promise.resolve(JSON.parse(localStorage.getItem(collection)) || []);
    },

    save(collection, data) {
        localStorage.setItem(collection, JSON.stringify(data));
        return Promise.resolve(true);
    },

    async push(collection, item) {
        const data = await this.get(collection);
        data.push(item);
        await this.save(collection, data);
        this.logSystemHistory('INSERT', `Registro agregado a colección [${collection}]`);
        return Promise.resolve(item);
    },

    async update(collection, id, updatedFields) {
        const data = await this.get(collection);
        const index = data.findIndex(i => i.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updatedFields };
            await this.save(collection, data);
            this.logSystemHistory('UPDATE', `Modificación en [${collection}] ID: ${id}`);
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    },

    async delete(collection, id) {
        let data = await this.get(collection);
        data = data.filter(i => i.id !== id);
        await this.save(collection, data);
        this.logSystemHistory('DELETE', `Eliminado de [${collection}] ID: ${id}`);
        return Promise.resolve(true);
    },

    async logSystemHistory(event, description) {
        const log = {
            timestamp: new Date().toISOString(),
            event,
            description
        };
        const logs = JSON.parse(localStorage.getItem('history')) || [];
        logs.unshift(log);
        localStorage.setItem('history', JSON.stringify(logs));
    },

    exportBackup() {
        const backup = {};
        const collections = ['employees', 'attendance', 'payroll', 'payments', 'settings', 'history'];
        collections.forEach(c => backup[c] = JSON.parse(localStorage.getItem(c)) || []);
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `workforce_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    },

    importBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed.employees && parsed.attendance) {
                    Object.keys(parsed).forEach(key => {
                        localStorage.setItem(key, JSON.stringify(parsed[key]));
                    });
                    alert("Base de datos empresarial restaurada con éxito.");
                    window.location.reload();
                } else {
                    alert("Error: Archivo de respaldo con estructura de integridad corrupta.");
                }
            } catch (err) {
                alert("Error crítico al procesar JSON.");
            }
        };
        reader.readAsText(file);
    }
};

// Iniciar esquemas relacionales relativas
storage.initCollection('employees');
storage.initCollection('attendance');
storage.initCollection('history');
storage.initCollection('settings', { masterPass: 'admin1234' });
