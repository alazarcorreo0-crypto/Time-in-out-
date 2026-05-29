const reports = {
    async exportCSV() {
        const shifts = await storage.get('attendance');
        if (shifts.length === 0) {
            alert("No hay registros de turnos ejecutados para exportar.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID Turno,Empleado,Fecha,Entrada,Salida,Horas Trabajadas,Semana Fiscal\n";

        shifts.forEach(s => {
            const row = [
                s.id,
                `"${s.employeeName}"`,
                s.date,
                s.inTimestamp,
                s.outTimestamp || 'ABIERTO',
                s.hoursWorked,
                s.fiscalWeek
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `workforce_report_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
