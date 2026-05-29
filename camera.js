const camera = {
    stream: null,
    onCaptureCallback: null,

    start(callback) {
        this.onCaptureCallback = callback;
        const modal = document.getElementById('camera-modal');
        const video = document.getElementById('camera-preview');
        modal.style.display = 'flex';

        navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        })
        .then(s => {
            this.stream = s;
            video.srcObject = s;
        })
        .catch(err => {
            alert("No se pudo inicializar o acceder a la cámara frontal corporativa.");
            this.cancel();
        });
    },

    capture() {
        const video = document.getElementById('camera-preview');
        const canvas = document.getElementById('camera-canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 320; 
        canvas.height = 240;

        // Renderizado instantáneo
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Guardado y compresión a JPEG en calidad media
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        
        this.stop();
        if (this.onCaptureCallback) this.onCaptureCallback(base64);
    },

    cancel() {
        this.stop();
    },

    stop() {
        const modal = document.getElementById('camera-modal');
        modal.style.display = 'none';
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
};
