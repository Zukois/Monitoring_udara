const mqttStatus = document.getElementById('mqtt-status');
const dataLog = [];

// === MQTT === //
const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');

client.on('connect', () => {
  mqttStatus.textContent = 'Connected';
  mqttStatus.className = 'text-sm px-3 py-1 rounded bg-green-500 text-white';
  client.subscribe('sensor/udara/1'); // Transmiter 1
  client.subscribe('sensor/udara/2'); // Transmiter 2
});

client.on('error', () => {
  mqttStatus.textContent = 'Error';
  mqttStatus.className = 'text-sm px-3 py-1 rounded bg-red-500 text-white';
});

client.on('offline', () => {
  mqttStatus.textContent = 'Offline';
  mqttStatus.className = 'text-sm px-3 py-1 rounded bg-yellow-500 text-white';
});

client.on('message', (topic, message) => {
  if (topic === 'sensor/udara/1') {
    handleTransmiterData(message, 1); // Handle Transmiter 1
  } else if (topic === 'sensor/udara/2') {
    handleTransmiterData(message, 2); // Handle Transmiter 2
  }
});

// === Fungsi untuk update data transmiter === //
function handleTransmiterData(message, transmiterId) {
  try {
    const data = JSON.parse(message.toString());

    // Update UI sesuai dengan transmiter
    document.getElementById(`suhu-${transmiterId}`).textContent = data.suhu + ' °C';
    document.getElementById(`kelembapan-${transmiterId}`).textContent = data.kelembapan + ' %';
    document.getElementById(`co-${transmiterId}`).textContent = data.co + ' ppm';
    document.getElementById(`o3-${transmiterId}`).textContent = data.o3 + ' ppm';
    document.getElementById(`pm10-${transmiterId}`).textContent = data.pm10 + ' µg/m³';

    // Simpan ke log untuk ekspor CSV
    const timestamp = new Date().toLocaleString();
    dataLog.push({
      transmiter: `Transmiter ${transmiterId}`,
      waktu: timestamp,
      suhu: data.suhu,
      kelembapan: data.kelembapan,
      co: data.co,
      o3: data.o3,
      pm10: data.pm10
    });

  } catch (err) {
    console.error('❌ Gagal parsing data:', err);
  }
}

// === Simpan CSV === //
document.getElementById('save-csv').addEventListener('click', () => {
  if (dataLog.length === 0) return alert('Belum ada data yang bisa disimpan.');

  const header = "Transmiter,Tanggal,Waktu,Suhu,Kelembapan,CO,O3,PM10\n";
  const rows = dataLog.map(d => 
    `${d.transmiter},${d.waktu},${d.suhu},${d.kelembapan},${d.co},${d.o3},${d.pm10}`
  ).join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `data-kualitas-udara-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.getElementById("hours").textContent = hours;
    document.getElementById("minutes").textContent = minutes;
    document.getElementById("seconds").textContent = seconds;
  
    // Update tanggal
    const date = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  
    document.getElementById("date").textContent = date;
  }
  
  // Update jam setiap detik
  setInterval(updateClock, 1000);
  
  // Set jam saat halaman pertama kali dimuat
  updateClock();
  
  client.subscribe("sensor/udara/1");
client.subscribe("sensor/udara/2");

client.on("message", function (topic, message) {
  try {
    const payload = JSON.parse(message.toString());
    const pm10 = parseInt(payload.pm10);

    if (topic === "sensor/udara/1") {
      document.getElementById("pm10_1").textContent = pm10;
      updateAirQualityStatus("status_1", pm10);
    } else if (topic === "sensor/udara/2") {
      document.getElementById("pm10_2").textContent = pm10;
      updateAirQualityStatus("status_2", pm10);
    }
  } catch (error) {
    console.error("Gagal parsing pesan MQTT:", error);
  }
});

function updateAirQualityStatus(statusId, pm10) {
    const el = document.getElementById(statusId);
  
    // Jika PM10 tidak valid, tampilkan status kosong
    if (!el || pm10 === null) {
      el.textContent = "Data tidak valid"; // Tampilkan status yang jelas jika PM10 tidak valid
      el.className = "text-xl font-semibold px-3 py-1 rounded-full bg-gray-200 text-gray-800";
      return;
    }
  
    let status = "";
    let emoji = "";
    let bgClass = "";
    let textClass = "";
  
    // Tentukan status berdasarkan PM10
    if (pm10 <= 50) {
      status = "Baik";
      emoji = "🌿😊";
      bgClass = "bg-green-200 dark:bg-green-700";
      textClass = "text-green-800 dark:text-white";
    } else if (pm10 <= 150) {
      status = "Sedang";
      emoji = "🌾😐";
      bgClass = "bg-yellow-200 dark:bg-yellow-600";
      textClass = "text-yellow-800 dark:text-white";
    } else {
      status = "Buruk";
      emoji = "🏭😷";
      bgClass = "bg-red-200 dark:bg-red-700";
      textClass = "text-red-800 dark:text-white";
    }
  
    el.textContent = `${emoji} ${status}`;
    el.className = `text-xl font-semibold px-3 py-1 rounded-full ${bgClass} ${textClass}`;
  }
  
  
  