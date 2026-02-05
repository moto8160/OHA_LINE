export type WeatherLocation = {
  name: string;
  lat: number;
  lon: number;
};

export const WEATHER_LOCATIONS: WeatherLocation[] = [
  { name: '東京', lat: 35.6762, lon: 139.6503 },
  { name: '京都', lat: 35.0116, lon: 135.7681 },
  { name: '大阪', lat: 34.6937, lon: 135.5023 },
  { name: '札幌', lat: 43.0618, lon: 141.3545 },
  { name: '福岡', lat: 33.5902, lon: 130.4017 },
];
