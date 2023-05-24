const TelegramBot = require('node-telegram-bot-api');
const { getProvincesKeyboard, getCitiesKeyboard, getShippingCost } = require('./api');
require('dotenv').config();

const token = process.env.TOKEN_TELEGRAM;


const bot = new TelegramBot(token, { polling: true });

let chatData = {}; // Menyimpan data percakapan

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
