const axios = require('axios');

const apikey = process.env.API_KEY_RAJAONGKIR;

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

module.exports = {
  getProvincesKeyboard,
  getCitiesKeyboard,
  getShippingCost,
};
