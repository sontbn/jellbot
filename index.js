const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const axios = require('axios');
const { format } = require('date-fns');
const { id } = require('date-fns/locale');
require('dotenv').config();


const token = process.env.TOKEN_TELEGRAM;
const apirajaong = process.env.API_KEY_RAJAONGKIR;
const urlakuari = process.env.URL_AKU_ARI;


const bot = new TelegramBot(token, { polling: true });

const rajaOngkirLink = 'https://rajaongkir.com/';
const saweriaLink = 'https://saweria.co/sontbn/';

let chatData = {};

// Menangani perintah /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Selamat datang di 3SBot. Silakan klik Menu di kiri bawah untuk memulai fitur pada bot ini, atau pilih dari daftar berikut.\n\n'+
    '/caklontong - TekaTeki Sulit 🤣\n\n'+
    '/cekongkir - Ongkir Indonesia\n\n'+
    '/mingguini - DJPb hari ini\n\n'+
    '/seragambesok - DJPb besok\n\n'+
    '/tokohindo - Random Tokoh Indonesia');
});




// seragamhariini---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
bot.onText(/\/seragamhariini/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Sudah beralih ke menu\n/mingguini atau /minggudepan');
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
  bot.sendMessage(chatId, 'Sudah beralih ke menu\n/mingguini atau /minggudepan');
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
    return 'Informasi pakaian kerja tidak tersedia.\n\nCobain teka-teki sulit /caklontong kalau kamu lagi bosan :D';
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

function getMingguBulanBesok() {
  const tanggalBesok = new Date();
  tanggalBesok.setDate(tanggalBesok.getDate() + 1); // Mengambil tanggal besok
  const mingguBulanBesok = Math.ceil(tanggalBesok.getDate() / 7);

  return mingguBulanBesok.toString();
}






// seragammingguini ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
bot.onText(/\/mingguini/, (msg) => {
  const chatId = msg.chat.id;
  chatData[chatId] = { status: 'mingguini' };

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
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = chatData[chatId];

  if (data && data.status === 'mingguini') {
    const gender = parseInt(callbackQuery.data);

    if (![1, 2].includes(gender)) {
      bot.sendMessage(chatId, 'Input tombol tidak valid.');
      return;
    }

    // Mengirim foto-foto pakaian kerja untuk setiap hari
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const mingguBulanSekarang = getMingguBulanSekarang();

    bot.sendMessage(chatId, `[UPDATE] ND-1783/PB.1/2023\n\nBerikut adalah pakaian kerja pegawai DJPb ${gender === 1 ? 'Pria' : 'Wanita'} untuk minggu ini:`);

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      let gambarPath;

      if (day === 'Kamis') {
        gambarPath = `img/${day.toLowerCase()}_${mingguBulanSekarang}_${gender === 1 ? 'pria' : 'wanita'}.jpg`;
      } else {
        gambarPath = `img/${day.toLowerCase()}_${gender === 1 ? 'pria' : 'wanita'}.jpg`;
      }

      try {
        await bot.sendPhoto(chatId, gambarPath, { caption: day });
      } catch (error) {
        console.error('Error sending photo:', error);
      }
    }

    // Reset status pengguna setelah selesai
    delete chatData[chatId];
  }
});

function getMingguBulanSekarang() {
  const tanggalHariIni = new Date().getDate();
  const bulanSekarang = new Date().getMonth();
  const tahunSekarang = new Date().getFullYear();
  const tanggalPertamaBulanIni = new Date(tahunSekarang, bulanSekarang, 1).getDate();

  const minggu = Math.ceil((tanggalHariIni - tanggalPertamaBulanIni + 1) / 7);
  return minggu.toString();
}




// seragamminggudepan ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
bot.onText(/\/minggudepan/, (msg) => {
  const chatId = msg.chat.id;
  chatData[chatId] = { status: 'minggudepan' };

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
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = chatData[chatId];

  if (data && data.status === 'minggudepan') {
    const gender = parseInt(callbackQuery.data);

    if (![1, 2].includes(gender)) {
      bot.sendMessage(chatId, 'Input tombol tidak valid.');
      return;
    }

    // Mengirim foto-foto pakaian kerja untuk setiap hari
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    const mingguDepanBulanSekarang = getMingguDepanBulanSekarang();

    bot.sendMessage(chatId, `[UPDATE] ND-1783/PB.1/2023\n\nBerikut adalah pakaian kerja pegawai DJPb ${gender === 1 ? 'Pria' : 'Wanita'} untuk minggu depan:`);

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      let gambarPath;

      if (day === 'Kamis') {
        gambarPath = `img/${day.toLowerCase()}_${mingguDepanBulanSekarang}_${gender === 1 ? 'pria' : 'wanita'}.jpg`;
      } else {
        gambarPath = `img/${day.toLowerCase()}_${gender === 1 ? 'pria' : 'wanita'}.jpg`;
      }

      try {
        await bot.sendPhoto(chatId, gambarPath, { caption: day });
      } catch (error) {
        console.error('Error sending photo:', error);
      }
    }

    // Reset status pengguna setelah selesai
    delete chatData[chatId];
  }
});

function getMingguDepanBulanSekarang() {
  const tanggalHariIni = new Date().getDate();
  const bulanSekarang = new Date().getMonth();
  const tahunSekarang = new Date().getFullYear();
  const tanggalPertamaBulanSekarang = new Date(tahunSekarang, bulanSekarang, 1).getDate();

  const minggu = Math.ceil((tanggalHariIni - tanggalPertamaBulanSekarang + 1) / 7) + 1;
  return minggu.toString();
}







// cekongkir -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
bot.onText(/\/cekongkir/, async (msg) => {
  const chatId = msg.chat.id;
  chatData[chatId] = { status: 'cekongkir' };

  // Mengirim pertanyaan pertama
  bot.sendMessage(chatId, 'Dalam sesaat akan muncul daftar PROVINSI ASAL pengiriman. Pilih salah satu');

  setTimeout(async () => {
    // Mengirim pertanyaan pertama
    bot.sendMessage(chatId, 'PROVINSI ASAL', {
      reply_markup: {
        inline_keyboard: await getProvincesKeyboard(),
      },
    });
  }, 3000);
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = chatData[chatId];

  if (data && data.status === 'cekongkir') {

    if (!data.originProvinceId) {
      data.originProvinceId = query.data;

      // Mengirim pertanyaan kedua
      bot.sendMessage(chatId, 'Dalam sesaat akan muncul daftar KOTA/KAB ASAL pengiriman. Pilih salah satu');

      setTimeout(async () => {
        // Mengirim pertanyaan pertama
        bot.sendMessage(chatId, 'KOTA/KAB ASAL', {
          reply_markup: {
            inline_keyboard: await getCitiesKeyboard(data.originProvinceId),
          },
        });
      }, 2000);
    }
    else if (!data.originCityId) {
      data.originCityId = query.data;

      // Mengirim pertanyaan ketiga
      bot.sendMessage(chatId, 'Dalam sesaat akan muncul daftar PROVINSI TUJUAN pengiriman. Pilih salah satu');

      setTimeout(async () => {
        // Mengirim pertanyaan pertama
        bot.sendMessage(chatId, 'PROVINSI TUJUAN', {
          reply_markup: {
            inline_keyboard: await getProvincesKeyboard(),
          },
        });
      }, 3000);
    }
    else if (!data.destinationProvinceId) {
      data.destinationProvinceId = query.data;

      // Mengirim pertanyaan keempat
      bot.sendMessage(chatId, 'Dalam sesaat akan muncul daftar KOTA/KAB TUJUAN pengiriman. Pilih salah satu');

      setTimeout(async () => {
        // Mengirim pertanyaan pertama
        bot.sendMessage(chatId, 'KOTA/KAB TUJUAN', {
          reply_markup: {
            inline_keyboard: await getCitiesKeyboard(data.destinationProvinceId),
          },
        });
      }, 2000);
    }
    else if (!data.destinationCityId) {
      data.destinationCityId = query.data;

      // Mengirim pertanyaan kelima
      bot.sendMessage(chatId, 'Masukkan estimasi BERAT paket (dalam gram). Misalnya 1 kilogram, tuliskan 1000');
    }
    else if (!data.weight) {
      data.weight = query.data;

      // Mengirim pertanyaan keenam
      bot.sendMessage(chatId, 'Pilih KURIR:', {
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
      headers: { 'key': apirajaong },
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
      headers: { 'key': apirajaong },
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
      headers: { 'key': apirajaong },
    });
    
    const { query, origin_details, destination_details, results } = response.data.rajaongkir;
    const originSummary = `Estimasi Ongkir\nDari: ${origin_details.city_name}, ${origin_details.province}\n`;
    const destinationSummary = `Ke: ${destination_details.city_name}, ${destination_details.province}\n`;
    const weightSummary = `Berat: ${query.weight} gram\n`;
    
    const formattedShippingCosts = results.map((result) => {
      const { code, name, costs } = result;
      const formattedCosts = costs.map((cost) => {
        const { service, description, cost: shippingCosts } = cost;
        const formattedShippingCosts = shippingCosts.map((shippingCost) => {
          const { value, etd, note } = shippingCost;
          const formattedValue = Number(value).toLocaleString('id-ID');
          return `Service: ${service}\nDeskripsi: ${description}\nCost: Rp${formattedValue} (hari: ${etd})\nCatatan: ${note}\n`;
        });
        return formattedShippingCosts.join('\n');
      });
      return `Kurir: ${name}\n\n${formattedCosts.join('\n')}`;
    });

    const shippingCostSummary = formattedShippingCosts.join('\n\n');
    const finalSummary = originSummary + destinationSummary + weightSummary + shippingCostSummary;
    
    const finalChat = finalSummary + `\nProvided by RajaOngkir API.\n\n\nJangan sungkan ya kalau mau beliin saya kopi :) [${saweriaLink}]`;
    
    return finalChat;
  } catch (error) {
    console.error('Error getting shipping cost:', error);
    return 'Failed to retrieve shipping cost.';
  }
}







// caklontong ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
bot.onText(/\/caklontong/, async (msg) => {
  const chatId = msg.chat.id;
  chatData[chatId] = { status: 'caklontong' };

  try {
    // Baca variasi kalimat dari file JSON
    const variasiFile = fs.readFileSync('wait.json');
    const variasiKalimat = JSON.parse(variasiFile);

    // Pilih salah satu variasi kalimat secara acak
    const randomIndex = Math.floor(Math.random() * variasiKalimat.length);
    const pesanVariasi = variasiKalimat[randomIndex];

    bot.sendMessage(chatId, pesanVariasi);

    const response = await axios.get(urlakuari+'/games/caklontong');
    const { soal, jawaban, deskripsi } = response.data.hasil;

    chatData[chatId] = { jawaban: jawaban.toLowerCase(), deskripsi };

    bot.sendMessage(chatId, `*${soal}*`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.log(error);
    bot.sendMessage(chatId, 'Maaf, ada yang salah nih. Silakan coba lagi nanti.');
  }
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userAnswer = msg.text ? msg.text.toLowerCase() : '';

  if (chatData[chatId] && chatData[chatId].jawaban) {

    const { jawaban, deskripsi } = chatData[chatId];

    if (userAnswer === jawaban) {
      const emot = ['👍', '👍🏼', '👍🏽', '👍🏾', '👍🏿', '👍🏻', '👍🏿✌️', '👍✌️', '👍👏', '👍😄'];
      bot.sendMessage(chatId, `BENAR. ${deskripsi} ${emot[Math.floor(Math.random() * emot.length)]}`);
    }
    else {
      const emot = ['😂', '😆', '😝', '🤣', '😜', '😄', '😊', '😃'];
      bot.sendMessage(chatId, `Salah. Jawabannya *${jawaban}*.\n${deskripsi} ${emot[Math.floor(Math.random() * emot.length)]}`, { parse_mode: 'Markdown' });
    }

    // Menghapus data chat setelah menjawab
    delete chatData[chatId];
  }
});




// tokohindo --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
bot.onText(/\/tokohindo/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const response = await axios.get(urlakuari+'/randomtext/tokohindo');
    const hasil = response.data.hasil;

    await bot.sendPhoto(chatId, hasil.img);
    await bot.sendMessage(chatId, `*[${hasil.kategori}]*\nNama: ${hasil.nama} (${hasil.nama2})\nAsal: ${hasil.asal}\nLahir: ${hasil.lahir}\nUsia: ${hasil.usia}\nGugur: ${hasil.gugur}\nMakam: ${hasil.lokasimakam}`, { parse_mode: 'Markdown' });
    await bot.sendMessage(chatId, hasil.history);

    const randomChance = Math.random(); // Menghasilkan angka acak antara 0 dan 1
    const chanceThreshold = 0.4; // Ubah angka ini sesuai dengan peluang yang Anda inginkan (misalnya 0.3 untuk 30% peluang)
    if (randomChance < chanceThreshold) {
      await bot.sendMessage(chatId, `Jangan sungkan ya kalau mau beliin saya kopi :) [${saweriaLink}]`);
    }
  } catch (error) {
    console.log(error);
    bot.sendMessage(chatId, 'Maaf, terjadi kesalahan dalam memuat informasi tokoh Indonesia. Silakan coba lagi nanti.');
  }
});






// Menjalankan bot
bot.on("polling_error", (err) => {
  console.error('Polling error:', err);
});

console.log('Bot is running...');