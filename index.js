const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TOKEN_TELEGRAM;
const apikey= process.env.API_KEY_RAJAONGKIR;


const bot = new TelegramBot(token, { polling: true });

let chatData = {}; // Menyimpan data percakapan

// Menangani perintah /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Selamat datang di OngkirBot. Silakan klik /cekongkir untuk memulai menggunakan bot ini.');
});

// Menangani perintah /cekongkir
bot.onText(/\/cekongkir/, async (msg) => {
  const chatId = msg.chat.id;
  chatData[chatId] = {};

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

  if (!data.originProvinceId) {
    data.originProvinceId = query.data;

    // Mengirim pertanyaan kedua
    bot.sendMessage(chatId, 'PILIH KOTA/KAB ASAL PENGIRIMAN:', {
      reply_markup: {
        inline_keyboard: await getCitiesKeyboard(data.originProvinceId),
      },
    });
  } else if (!data.originCityId) {
    data.originCityId = query.data;

    // Mengirim pertanyaan ketiga
    bot.sendMessage(chatId, 'PILIH PROVINSI TUJUAN PENGIRIMAN:', {
      reply_markup: {
        inline_keyboard: await getProvincesKeyboard(),
      },
    });
  } else if (!data.destinationProvinceId) {
    data.destinationProvinceId = query.data;

    // Mengirim pertanyaan keempat
    bot.sendMessage(chatId, 'PILIH KOTA TUJUAN PENGIRIMAN:', {
      reply_markup: {
        inline_keyboard: await getCitiesKeyboard(data.destinationProvinceId),
      },
    });
  } else if (!data.destinationCityId) {
    data.destinationCityId = query.data;

    // Mengirim pertanyaan kelima
    bot.sendMessage(chatId, 'MASUKKAN BERAT KIRIMAN (dalam gram):');
  } else if (!data.weight) {
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
  } else if (data.originCityId && data.destinationCityId && data.weight && !data.courier) {
    data.courier = query.data;
  
    // Mengirim permintaan ke API RajaOngkir untuk mendapatkan ongkos kirim
    const shippingCost = await getShippingCost(data.originCityId, data.destinationCityId, data.weight, data.courier);
  
    // Menampilkan hasil ongkos kirim
    bot.sendMessage(chatId, shippingCost);
  }  
});


// Khusus menangani pesan tanpa user klik tombol
bot.onText(/^[0-9]+$/, (msg) => {
  const chatId = msg.chat.id;
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
  } else {
    // Menangani pesan yang tidak sesuai dengan yang diharapkan
    bot.sendMessage(chatId, 'Mohon ikuti langkah-langkah yang ditentukan.');
  }
});






// ---------------------------------------------------------------------------------------------------------------------------
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
