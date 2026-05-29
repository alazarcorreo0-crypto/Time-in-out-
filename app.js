const app = {
    init() {
        // Registro del Service Worker PWA para soporte Offline en GitHub Pages
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./service-worker.js')
                    .then(reg => console.log('Service Worker registrado con éxito en alcance:', reg.scope))
                    .catch(err => console.error('Fallo en registro de Service Worker:', err));
            });
        }

        // Cargar semillas de datos iniciales en caso de almacenamiento vacío para demostración fluida
        this.seedInitialData();
        ui.refreshViewData('view-checador');
    },

    async seedInitialData() {
        const emps = await storage.get('employees');
        if (emps.length === 0) {
            // Cargar datos simulados de nivel corporativo
            await storage.push('employees', { id: 'EMP-902183', name: 'Ingeniero Ramón Macías', pin: '2312', rate: 45.00, status: 'Activo', createdAt: new Date().toISOString() });
            await storage.push('employees', { id: 'EMP-482019', name: 'Carlos Mendoza Garza', pin: '4545', rate: 28.50, status: 'Activo', createdAt: new Date().toISOString() });
            await storage.push('employees', { id: 'EMP-771029', name: 'Sofía Villanueva Díaz', pin: '8899', rate: 32.00, status: 'Activo', createdAt: new Date().toISOString() });
            ui.refreshViewData('view-checador');
        }
    },

    handleCheck(type) {
        const employeeId = document.getElementById('checador-empleado').value;
        const pin = document.getElementById('checador-pin').value;

        if (!employeeId) { alert("Debe seleccionar un empleado."); return; }
        if (!pin) { alert("Se requiere PIN para la firma digital."); return; }

        // Inicializar captura obligatoria por cámara
        camera.start(async (base64Photo) => {
            try {
                const emp = await attendance.processRegister(employeeId, pin, type, base64Photo);
                alert(`¡Registro de ${type} Exitoso!\nColaborador: ${emp.name}\nHora: ${new Date().toLocaleTimeString()}`);
                
                // Limpiar campos para el siguiente registro continuo
                document.getElementById('checador-pin').value = '';
                ui.refreshViewData('view-checador');
            } catch (error) {
                alert(`Error en validación: ${error.message}`);
            }
        });
    }
};

// Arrancar núcleo de la aplicación al cargar ventana
window.addEventListener('DOMContentLoaded', () => app.init());
