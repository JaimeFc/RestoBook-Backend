export default async function handler(req, res) {
  const { city } = req.query;
  const token = req.headers['x-resto-token'];

  // Validación con tu token del .env
  if (token !== process.env.INTERNAL_BACKEND_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    // Usando tu clave de OpenWeather
    const apiKey = process.env.OPENWEATHER_API_KEY; 
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city || 'Quito'}&units=metric&lang=es&appid=${apiKey}`
    );

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({
        temperatura: Math.round(data.main.temp),
        descripcion: data.weather[0].description,
        humedad: data.main.humidity,
        viento: data.wind.speed,
        localidad: data.name,
        icono: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
      });
    } else {
      res.status(data.cod).json({ error: data.message });
    }
  } catch (error) {
    res.status(500).json({ error: 'Fallo de conexión' });
  }
}