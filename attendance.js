const attendance = {
    getFiscalWeek(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    async processRegister(employeeId, pin, type, base64Photo) {
        const emps = await employees.getAll();
        const emp = emps.find(e => e.id === employeeId);

        if (!emp || emp.status !== 'Activo') throw new Error("Colaborador no encontrado o inactivo.");
        if (emp.pin !== pin) throw new Error("PIN de seguridad incorrecto.");
        if (!base64Photo) throw new Error("La evidencia fotográfica es obligatoria por políticas corporativas.");

        const now = new Date();
        const records = await storage.get('attendance');

        if (type === 'Entrada') {
            // Verificar si ya tiene un turno abierto para no duplicar intempestivamente
            const openShift = records.find(r => r.employeeId === employeeId && !r.outTimestamp);
            if (openShift) throw new Error("Ya cuentas con una Entrada registrada sin marcar Salida.");

            const shift = {
                id: 'SHIFT-' + Math.floor(100000 + Math.random() * 900000),
                employeeId,
                employeeName: emp.name,
                date: now.toISOString().slice(0, 10),
                inTimestamp: now.toISOString(),
                outTimestamp: null,
                inPhoto: base64Photo,
                outPhoto: null,
                hoursWorked: 0,
                fiscalWeek: this.getFiscalWeek(now),
                rateAtMoment: emp.rate
            };
            await storage.push('attendance', shift);
        } else {
            // Es Salida: Buscar el turno abierto
            const openShiftIndex = records.findIndex(r => r.employeeId === employeeId && !r.outTimestamp);
            if (openShiftIndex === -1) throw new Error("No se encontró registro de Entrada previo para cerrar turno hoy.");

            const openShift = records[openShiftIndex];
            const inTime = new Date(openShift.inTimestamp);
            const diffMs = now - inTime;
            const hoursDecimal = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));

            openShift.outTimestamp = now.toISOString();
            openShift.outPhoto = base64Photo;
            openShift.hoursWorked = hoursDecimal;

            records[openShiftIndex] = openShift;
            await storage.save('attendance', records);
            await storage.logSystemHistory('SHIFT_CLOSE', `Turno cerrado para ${emp.name}. Horas calculadas: ${hoursDecimal}`);
        }
        return emp;
    }
};
