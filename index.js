const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TOKEN_TELEGRAM;
const apikey = process.env.API_KEY_RAJAONGKIR;

const bot = new TelegramBot(token, { polling: true });

let chatData = {};

// Menangani perintah /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Selamat datang di 3SBot. Silakan klik Menu di kiri bawah untuk memulai fitur pada bot ini.');
});




// seragamhariini---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
bot.onText(/\/seragamhariini/, (msg) => {
  const chatId = msg.chat.id;
  chatData[chatId] = { status: 'seragamhariini' };

  const keyboard = [
    [
      { text: 'Pria', callback_data: '1' },
      { text: 'Wanita', callback_data: '2' },
    ],
  ];

  const replyMarkup = {
    inline_keyboard: keyboard,
  };

  bot.sendMessage(chatId, 'Pilih:', { reply_markup: replyMarkup });
  // bot.sendMessage(chatId, "Balas '1', jika Anda Pria. Balas '2', jika Anda Wanita.");
});

// bot.onText(/^\d+$/, (msg) => {
bot.on('callback_query', (callbackQuery) => {
  // const chatId = msg.chat.id;
  const chatId = callbackQuery.message.chat.id;
  const data = chatData[chatId];

  if (data && data.status === 'seragamhariini') {
    // const gender = parseInt(msg.text);
    const gender = parseInt(callbackQuery.data);

    if (![1, 2].includes(gender)) {
      bot.sendMessage(chatId, 'Input tombol tidak valid.');
      return;
    }

    // Membaca file JSON dengan data pakaian kerja
    fs.readFile('pakaian_kerja.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Error:', err);
        return;
      }

      // Parsing data JSON
      const pakaianKerja = JSON.parse(data);

      const hariIni = getHariIni();
      const tanggalHariIni = getTanggalHariIni();
      const infoPakaianKerja = getPakaianKerja(hariIni, gender, pakaianKerja);

      // Reset status pengguna setelah selesai
      delete chatData[chatId];

      if (typeof infoPakaianKerja === 'string') {
        bot.sendMessage(chatId, infoPakaianKerja);
      }
      else {
        const { kemeja, bawahan } = infoPakaianKerja;
        if (hariIni.toLowerCase() === 'kamis') {
          const minggu = getMingguBulanSekarang();
          bot.sendMessage(chatId, `[UPDATE] ND-1783/PB.1/2023\n\nHari ini adalah hari ${hariIni}, minggu ${minggu}, tanggal ${tanggalHariIni}. Pakaian kerja pegawai DJPb ${gender === 1 ? 'Pria' : 'Wanita'} adalah: kemeja ${kemeja} dan bawahan ${bawahan}.\n\nKlik /seragambesok kalau mau cek seragam untuk besok :)`)
          .then(() => {
            const gambarPath = `img/kamis_${minggu}_${gender === 1 ? 'pria' : 'wanita'}.jpg`;
            bot.sendPhoto(chatId, gambarPath);
          })
          .catch((error) => {
            console.error('Error sending photo:', error);
          });
        }
        else {
          bot.sendMessage(chatId, `[UPDATE] ND-1783/PB.1/2023\n\nHari ini adalah hari ${hariIni}, tanggal ${tanggalHariIni}. Pakaian kerja pegawai DJPb ${gender === 1 ? 'Pria' : 'Wanita'} adalah: kemeja ${kemeja} dan bawahan ${bawahan}.\n\nKlik /seragambesok kalau mau cek seragam untuk besok :)`)
          .then(() => {
            const gambarPath = `img/${hariIni.toLowerCase()}_${gender === 1 ? 'pria' : 'wanita'}.jpg`;
            bot.sendPhoto(chatId, gambarPath);
          })
          .catch((error) => {
            console.error('Error sending photo:', error);
          });
        }
      }
    });
  }
});

function getHariIni() {
  const daftarHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hariIni = new Date().getDay();
  return daftarHari[hariIni];
}

function getTanggalHariIni() {
  const tanggalHariIni = new Date().getDate();
  const bulanSekarang = new Date().getMonth() + 1;
  const tahunSekarang = new Date().getFullYear();
  return `${tanggalHariIni}-${bulanSekarang}-${tahunSekarang}`;
}





// seragambesok -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
bot.onText(/\/seragambesok/, (msg) => {
  const chatId = msg.chat.id;
  chatData[chatId] = { status: 'seragambesok' };

  const keyboard = [
    [
      { text: 'Pria', callback_data: '1' },
      { text: 'Wanita', callback_data: '2' },
    ],
  ];

  const replyMarkup = {
    inline_keyboard: keyboard,
  };

  bot.sendMessage(chatId, 'Pilih:', { reply_markup: replyMarkup });
  // bot.sendMessage(chatId, "Balas '1', jika Anda Pria. Balas '2', jika Anda Wanita.");
});

// bot.onText(/^\d+$/, (msg) => {
bot.on('callback_query', (callbackQuery) => {
  // const chatId = msg.chat.id;
  const chatId = callbackQuery.message.chat.id;
  const data = chatData[chatId];

  if (data && data.status === 'seragambesok') {
    // const gender = parseInt(msg.text);
    const gender = parseInt(callbackQuery.data);

    if (![1, 2].includes(gender)) {
      bot.sendMessage(chatId, 'Input tombol tidak valid.');
      return;
    }

    // Membaca file JSON dengan data pakaian kerja
    fs.readFile('pakaian_kerja.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Error:', err);
        return;
      }

      // Parsing data JSON
      const pakaianKerja = JSON.parse(data);

      const hariBerikutnya = getHariBerikutnya();
      const tanggalBerikutnya = getTanggalBerikutnya();
      const infoPakaianKerja = getPakaianKerja(hariBerikutnya, gender, pakaianKerja);

      // Reset status pengguna setelah selesai
      delete chatData[chatId];

      if (typeof infoPakaianKerja === 'string') {
        bot.sendMessage(chatId, infoPakaianKerja);
      }
      else {
        const { kemeja, bawahan } = infoPakaianKerja;
        if (hariBerikutnya.toLowerCase() === 'kamis') {
          const minggu = getMingguBulanBesok();
          bot.sendMessage(chatId, `[UPDATE] ND-1783/PB.1/2023\n\nBesok adalah hari ${hariBerikutnya}, minggu ${minggu}, tanggal ${tanggalBerikutnya}. Pakaian kerja pegawai ${gender === 1 ? 'Pria' : 'Wanita'} di lingkungan DJPb adalah: ${kemeja} dan ${bawahan}.\n\nKlik /seragamhariini kalau mau cek seragam hari ini :)`)
          .then(() => {
            const gambarPath = `img/kamis_${minggu}_${gender === 1 ? 'pria' : 'wanita'}.jpg`;
            bot.sendPhoto(chatId, gambarPath);
          })
          .catch((error) => {
            console.error('Error sending photo:', error);
          });
        }
        else {
          bot.sendMessage(chatId, `[UPDATE] ND-1783/PB.1/2023\n\nBesok adalah hari ${hariBerikutnya}, tanggal ${tanggalBerikutnya}. Pakaian kerja pegawai ${gender === 1 ? 'Pria' : 'Wanita'} di lingkungan DJPb adalah: ${kemeja} dan ${bawahan}.\n\nKlik /seragamhariini kalau mau cek seragam hari ini :)`)
          .then(() => {
            const gambarPath = `img/${hariBerikutnya.toLowerCase()}_${gender === 1 ? 'pria' : 'wanita'}.jpg`;
            bot.sendPhoto(chatId, gambarPath);
          })
          .catch((error) => {
            console.error('Error sending photo:', error);
          });
        }
      }
    });
  }
});

function getHariBerikutnya() {
  const hariIni = new Date().getDay();
  const daftarHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const indeksHariBerikutnya = (hariIni + 1) % 7;
  return daftarHari[indeksHariBerikutnya];
}

function getTanggalBerikutnya() {
  const tanggalHariIni = new Date().getDate();
  const tanggalBerikutnya = tanggalHariIni + 1;
  const bulanSekarang = new Date().getMonth() + 1;
  const tahunSekarang = new Date().getFullYear();
  return `${tanggalBerikutnya}-${bulanSekarang}-${tahunSekarang}`;
}

// Fungsi untuk mendapatkan informasi pakaian kerja berdasarkan hari dan jenis kelamin
function getPakaianKerja(hari, gender, pakaianKerja) {
  const pakaianHariIni = pakaianKerja[hari.toLowerCase()];
  if (!pakaianHariIni) {
    return 'Informasi pakaian kerja tidak tersedia untuk hari ini.';
  }

  let pakaian;
  if (hari.toLowerCase() === 'kamis') {
    const minggu = getMingguBulanBesok(); // Menggunakan fungsi getMingguBulanBesok() untuk minggu dalam bulan besok
    pakaian = pakaianHariIni[minggu][gender === 1 ? 'pria' : 'wanita'];
  } else {
    pakaian = pakaianHariIni[gender === 1 ? 'pria' : 'wanita'];
  }
  return pakaian;
}

function getMingguBulanSekarang() {
  const tanggalHariIni = new Date().getDate();
  const bulanSekarang = new Date().getMonth();
  const tahunSekarang = new Date().getFullYear();
  const tanggalPertamaBulanIni = new Date(tahunSekarang, bulanSekarang, 1).getDate();

  const minggu = Math.ceil((tanggalHariIni - tanggalPertamaBulanIni + 1) / 7);
  return minggu.toString();
}

function getMingguBulanBesok() {
  const tanggalBesok = new Date();
  tanggalBesok.setDate(tanggalBesok.getDate() + 1); // Mengambil tanggal besok
  const mingguBulanBesok = Math.ceil(tanggalBesok.getDate() / 7);

  return mingguBulanBesok.toString();
}






// cekongkir -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
bot.onText(/\/cekongkir/, async (msg) => {
  const chatId = msg.chat.id;
  chatData[chatId] = { status: 'cekongkir' };

  // Mengirim pertanyaan pertama
  bot.sendMessage(chatId, 'PILIH PROVINSI ASAL PENGIRIMAN:', {
    reply_markup: {
      inline_keyboard: await getProvincesKeyboard(),
    },
  });
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = chatData[chatId];

  if (data && data.status === 'cekongkir') {

    if (!data.originProvinceId) {
      data.originProvinceId = query.data;

      // Mengirim pertanyaan kedua
      bot.sendMessage(chatId, 'PILIH KOTA/KAB ASAL PENGIRIMAN:', {
        reply_markup: {
          inline_keyboard: await getCitiesKeyboard(data.originProvinceId),
        },
      });
    }
    else if (!data.originCityId) {
      data.originCityId = query.data;

      // Mengirim pertanyaan ketiga
      bot.sendMessage(chatId, 'PILIH PROVINSI TUJUAN PENGIRIMAN:', {
        reply_markup: {
          inline_keyboard: await getProvincesKeyboard(),
        },
      });
    }
    else if (!data.destinationProvinceId) {
      data.destinationProvinceId = query.data;

      // Mengirim pertanyaan keempat
      bot.sendMessage(chatId, 'PILIH KOTA TUJUAN PENGIRIMAN:', {
        reply_markup: {
          inline_keyboard: await getCitiesKeyboard(data.destinationProvinceId),
        },
      });
    }
    else if (!data.destinationCityId) {
      data.destinationCityId = query.data;

      // Mengirim pertanyaan kelima
      bot.sendMessage(chatId, 'MASUKKAN BERAT KIRIMAN (dalam gram):');
    }
    else if (!data.weight) {
      data.weight = query.data;

      // Mengirim pertanyaan keenam
      bot.sendMessage(chatId, 'PILIH KURIR:', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'JNE', callback_data: 'jne' },
              { text: 'POS', callback_data: 'pos' },
              { text: 'TIKI', callback_data: 'tiki' },
            ],
          ],
        },
      });
    }
    else if (data.originCityId && data.destinationCityId && data.weight && !data.courier) {
      data.courier = query.data;

      // Mengirim permintaan ke API RajaOngkir untuk mendapatkan ongkos kirim
      const shippingCost = await getShippingCost(data.originCityId, data.destinationCityId, data.weight, data.courier);

      delete chatData[chatId];

      // Menampilkan hasil ongkos kirim
      bot.sendMessage(chatId, shippingCost);
    }
  }
});

// Khusus menangani pesan tanpa user klik tombol
bot.onText(/^[0-9]+$/, (msg) => {
  const chatId = msg.chat.id;
  const data = chatData[chatId];

  if (data && data.status === 'cekongkir') {
    const weight = msg.text;

    if (chatData[chatId] && chatData[chatId].originCityId && chatData[chatId].destinationCityId && !chatData[chatId].weight) {
      chatData[chatId].weight = weight;

      // Mengirim pertanyaan keenam
      bot.sendMessage(chatId, 'PILIH KURIR:', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'JNE', callback_data: 'jne' },
              { text: 'POS', callback_data: 'pos' },
              { text: 'TIKI', callback_data: 'tiki' },
            ],
          ],
        },
      });
    }
    else {
      bot.sendMessage(chatId, 'Mohon ikuti langkah-langkah yang ditentukan.');
    }
  }
});

// Mendapatkan daftar provinsi sebagai inline keyboard
async function getProvincesKeyboard() {
  try {
    const response = await axios.get('https://api.rajaongkir.com/starter/province', {
      headers: { 'key': apikey },
    });
    const provinces = response.data.rajaongkir.results;
    const keyboard = provinces.map((province) => {
      return [{ text: province.province, callback_data: province.province_id }];
    });
    return keyboard;
  } catch (error) {
    console.error('Error getting provinces:', error);
    return [];
  }
}

// Mendapatkan daftar kota berdasarkan provinsi sebagai inline keyboard
async function getCitiesKeyboard(provinceId) {
  try {
    const response = await axios.get(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
      headers: { 'key': apikey },
    });
    const cities = response.data.rajaongkir.results;
    const keyboard = cities.map((city) => {
      return [{ text: city.type + ' ' + city.city_name, callback_data: city.city_id }];
    });
    return keyboard;
  } catch (error) {
    console.error('Error getting cities:', error);
    return [];
  }
}

// Mengirim permintaan ke API RajaOngkir untuk mendapatkan ongkos kirim
async function getShippingCost(originCityId, destinationCityId, weight, courier) {
  try {
    const response = await axios.post('https://api.rajaongkir.com/starter/cost', {
      origin: originCityId,
      destination: destinationCityId,
      weight: weight,
      courier: courier,
    }, {
      headers: { 'key': apikey },
    });
    const shippingCosts = response.data.rajaongkir.results[0].costs;
    const formattedShippingCosts = shippingCosts.map((cost) => `${cost.service}: ${cost.cost[0].value}`);
    return formattedShippingCosts.join('\n');
  } catch (error) {
    console.error('Error getting shipping cost:', error);
    return 'Failed to retrieve shipping cost.';
  }
}





// Menjalankan bot
bot.on("polling_error", (err) => {
  console.error('Polling error:', err);
});

console.log('Bot is running...');