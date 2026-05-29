const payroll = {
    async calculateWeeklyReport() {
        const shifts = await storage.get('attendance');
        const emps = await employees.getAll();
        
        const summary = emps.map(emp => {
            const empShifts = shifts.filter(s => s.employeeId === emp.id && s.outTimestamp);
            const totalHours = empShifts.reduce((acc, curr) => acc + curr.hoursWorked, 0);
            const totalGross = parseFloat((totalHours * emp.rate).toFixed(2));
            
            return {
                id: emp.id,
                name: emp.name,
                rate: emp.rate,
                totalHours: parseFloat(totalHours.toFixed(2)),
                totalGross,
                status: 'Pendiente'
            };
        });

        return summary;
    }
};
