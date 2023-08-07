const { Telegraf } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TOKEN_TELEGRAM;
const apirajaong = process.env.API_KEY_RAJAONGKIR;

const bot = new Telegraf(token);

const rajaOngkirLink = 'https://rajaongkir.com/';
const saweriaLink = 'https://saweria.co/sontbn/';

// Menangani perintah /start
bot.start((ctx) => {
  ctx.reply('Selamat datang di 3SBot. Silakan klik Menu di kiri bawah untuk memulai fitur pada bot ini, atau pilih dari daftar berikut.\n\n'+
    '/caklontong - TekaTeki Sulit 🤣\n\n'+
    '/cekongkir - Ongkir Indonesia\n\n'+
    '/mingguini - DJPb hari ini\n\n'+
    '/seragambesok - DJPb besok\n\n'+
    '/tokohindo - Random Tokoh Indonesia');
});

// Menangani perintah /cekongkir
bot.command('cekongkir', async (ctx) => {
  ctx.scene.session.messageId = null; // Inisialisasi messageId di dalam session
  await sendOriginProvinces(ctx);
});

// Menangani callback query
bot.on('callback_query', async (ctx) => {
  const { data } = ctx.callbackQuery;
  const { step } = data || {};

  switch (step) {
    case 'province':
      ctx.state.originProvinceId = data.provinceId;
      await sendOriginCities(ctx);
      break;
    case 'city':
      ctx.state.originCityId = data.cityId;
      await sendDestinationProvinces(ctx);
      break;
    case 'destinationProvince':
      ctx.state.destinationProvinceId = data.provinceId;
      await sendDestinationCities(ctx);
      break;
    case 'destinationCity':
      ctx.state.destinationCityId = data.cityId;
      await ctx.reply('Masukkan estimasi BERAT paket (dalam gram). Misalnya 1 kilogram, tuliskan 1000');
      break;
    case 'weight':
      ctx.state.weight = data.weight;
      await sendCourierOptions(ctx);
      break;
    case 'courier':
      ctx.state.courier = data.courier;
      await getShippingCostAndReply(ctx);
      break;
  }

  // Menjawab callback query dan memberikan umpan balik visual
  await ctx.answerCbQuery();
});

// Menangani pesan teks
bot.hears(/^[0-9]+$/, async (ctx) => {
  if (ctx.state.originCityId && ctx.state.destinationCityId && !ctx.state.weight) {
    ctx.state.weight = ctx.message.text;
    await sendCourierOptions(ctx);
  } else {
    ctx.reply('Mohon ikuti langkah-langkah yang ditentukan.');
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
      return [
        { text: province.province, callback_data: JSON.stringify({ step: 'province', provinceId: province.province_id }) }
      ];
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
      return { text: city.type + ' ' + city.city_name, callback_data: JSON.stringify({ step: 'city', cityId: city.city_id }) };
    });
    return keyboard;
  } catch (error) {
    console.error('Error getting cities:', error);
    return [];
  }
}

// Mengirim pertanyaan untuk memilih provinsi asal
async function sendOriginProvinces(ctx) {
  const provinces = await getProvincesKeyboard();

  const keyboard = {
    inline_keyboard: provinces,
  };

  const message = await ctx.reply('Dalam sesaat akan muncul daftar PROVINSI ASAL pengiriman. Pilih salah satu', {
    reply_markup: keyboard,
  });

  ctx.session.messageId = message.message_id;
}

// Mengirim pertanyaan untuk memilih kota asal
async function sendOriginCities(ctx) {
  ctx.reply('Dalam sesaat akan muncul daftar KOTA/KAB ASAL pengiriman. Pilih salah satu');
  const cities = await getCitiesKeyboard(ctx.state.originProvinceId);
  const messageId = ctx.session.messageId;
  ctx.editMessageText('Dalam sesaat akan muncul daftar KOTA/KAB ASAL pengiriman. Pilih salah satu');
  ctx.telegram.editMessageReplyMarkup(ctx.chat.id, messageId, null, { inline_keyboard: [cities] });
  ctx.state.messageId = messageId;
}

// Mengirim pertanyaan untuk memilih provinsi tujuan
async function sendDestinationProvinces(ctx) {
  ctx.reply('Dalam sesaat akan muncul daftar PROVINSI TUJUAN pengiriman. Pilih salah satu');
  const provinces = await getProvincesKeyboard();
  await ctx.replyWithMarkdownV2('PROVINSI TUJUAN', { reply_markup: { inline_keyboard: [provinces] } });
}

// Mengirim pertanyaan untuk memilih kota tujuan
async function sendDestinationCities(ctx) {
  ctx.reply('Dalam sesaat akan muncul daftar KOTA/KAB TUJUAN pengiriman. Pilih salah satu');
  const cities = await getCitiesKeyboard(ctx.state.destinationProvinceId);
  await ctx.replyWithMarkdownV2('KOTA/KAB TUJUAN', { reply_markup: { inline_keyboard: [cities] } });
}

// Mengirim pertanyaan untuk memilih opsi kurir
async function sendCourierOptions(ctx) {
  ctx.reply('Pilih KURIR:', {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'JNE', callback_data: { step: 'courier', courier: 'jne' } },
          { text: 'POS', callback_data: { step: 'courier', courier: 'pos' } },
          { text: 'TIKI', callback_data: { step: 'courier', courier: 'tiki' } },
        ],
      ],
    },
  });
}

// Mengirim permintaan ke API RajaOngkir untuk mendapatkan ongkos kirim
async function getShippingCostAndReply(ctx) {
  const { originCityId, destinationCityId, weight, courier } = ctx.state;

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

    ctx.reply(finalChat);
  } catch (error) {
    console.error('Error getting shipping cost:', error);
    ctx.reply('Failed to retrieve shipping cost.');
  }
}

// Menjalankan bot
bot.launch().then(() => {
  console.log('Bot is running...');
}).catch((error) => {
  console.error('Failed to start bot:', error);
});
