const employees = {
    async getAll() {
        return await storage.get('employees');
    },

    async create(name, pin, rate) {
        const list = await this.getAll();
        
        // Regla de Negocio: Validar unicidad semántica
        if (list.some(e => e.name.toLowerCase().trim() === name.toLowerCase().trim())) {
            throw new Error("El nombre de empleado ya se encuentra registrado en la organización.");
        }
        if (list.some(e => e.pin === pin)) {
            throw new Error("El PIN ingresado ya está asignado a otro colaborador.");
        }

        const employee = {
            id: 'EMP-' + Math.floor(100000 + Math.random() * 900000),
            name: name.trim(),
            pin: pin.trim(),
            rate: parseFloat(rate),
            status: 'Activo',
            createdAt: new Date().toISOString()
        };

        await storage.push('employees', employee);
        return employee;
    },

    async toggleStatus(id) {
        const list = await this.getAll();
        const emp = list.find(e => e.id === id);
        if (emp) {
            const nextStatus = emp.status === 'Activo' ? 'Inactivo' : 'Activo';
            await storage.update('employees', id, { status: nextStatus });
        }
    },

    async deleteEmployee(id) {
        await storage.delete('employees', id);
    }
};
