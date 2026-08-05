export const tracks = [
  { id: "001", name: "Midnight Protocol", artist: "LoyalFox", genre: "techno", bpm: 138, duration: "6:42" },
  { id: "002", name: "Synthetic Dawn", artist: "LoyalFox", genre: "house", bpm: 124, duration: "5:18" },
  { id: "003", name: "Void Signal", artist: "LoyalFox", genre: "ambient", bpm: 90, duration: "7:55" },
  { id: "004", name: "Neural Grid", artist: "LoyalFox", genre: "techno", bpm: 142, duration: "6:12" },
  { id: "005", name: "Copper Ritual", artist: "LoyalFox", genre: "house", bpm: 126, duration: "5:44" },
  { id: "006", name: "Static Ghost", artist: "LoyalFox", genre: "ambient", bpm: 82, duration: "8:20" },
  { id: "007", name: "Iron Frequency", artist: "LoyalFox", genre: "techno", bpm: 136, duration: "5:58" },
  { id: "008", name: "Liminal Space", artist: "LoyalFox", genre: "ambient", bpm: 88, duration: "9:03" },
  { id: "009", name: "Carbon Pulse", artist: "LoyalFox", genre: "house", bpm: 128, duration: "6:01" },
  { id: "010", name: "Deep Vector", artist: "LoyalFox", genre: "techno", bpm: 140, duration: "7:14" },
];

export const artists = [
  { slug: "velox", name: "VELOX", genre: "Techno · Dark", tracks: 24, bio: "Arquitectura sonora de clubes underground." },
  { slug: "syna", name: "SYNA", genre: "House · Deep", tracks: 18, bio: "Grooves melódicos y texturas profundas." },
  { slug: "arca-null", name: "ARCA NULL", genre: "Ambient · Drone", tracks: 15, bio: "Paisajes sonoros sin tiempo ni forma." },
  { slug: "freq-x", name: "FREQ-X", genre: "Experimental", tracks: 10, bio: "Electrónica modular en sus límites." },
];

export const posts = [
  {
    slug: "void-signals-ep",
    date: "ENE 2025",
    title: 'Nuevo EP: "Void Signals" ya disponible',
    excerpt: "Cuatro tracks de techno oscuro que exploran los límites del sonido industrial y la textura electrónica. Disponible en todas las plataformas.",
    tag: "LANZAMIENTO",
  },
  {
    slug: "spotify-for-artists",
    date: "DIC 2024",
    title: "LoyalFox en Spotify for Artists: pitching editorial",
    excerpt: "Cómo enviamos nuestras canciones a los curadores editoriales de Spotify y los resultados obtenidos en los primeros meses.",
    tag: "ESTRATEGIA",
  },
  {
    slug: "musica-sin-copyright",
    date: "NOV 2024",
    title: "Por qué apostamos por la música sin copyright",
    excerpt: "Nuestra filosofía sobre la distribución libre y por qué el futuro de la música independiente pasa por aquí.",
    tag: "FILOSOFÍA",
  },
];

export const genres = ["all", "techno", "house", "ambient"];

export const playlists = [
  { id: "pl01", name: "Dark Techno Vol.1", genre: "Techno", tracks: 12, url: "https://open.spotify.com" },
  { id: "pl02", name: "Deep House Sessions", genre: "House", tracks: 10, url: "https://open.spotify.com" },
  { id: "pl03", name: "Ambient Spaces", genre: "Ambient", tracks: 8, url: "https://open.spotify.com" },
  { id: "pl04", name: "Peak Hour Techno", genre: "Techno", tracks: 14, url: "https://open.spotify.com" },
  { id: "pl05", name: "Late Night House", genre: "House", tracks: 11, url: "https://open.spotify.com" },
  { id: "pl06", name: "Drone & Texture", genre: "Ambient", tracks: 7, url: "https://open.spotify.com" },
  { id: "pl07", name: "Industrial Cuts", genre: "Techno", tracks: 9, url: "https://open.spotify.com" },
  { id: "pl08", name: "Melodic House Mix", genre: "House", tracks: 13, url: "https://open.spotify.com" },
  { id: "pl09", name: "Experimental Vol.1", genre: "Experimental", tracks: 6, url: "https://open.spotify.com" },
  { id: "pl10", name: "LoyalFox Essentials", genre: "Mixed", tracks: 20, url: "https://open.spotify.com" },
];
export const streamers = [] as {
  id: string;
  name: string;
  platform: string;
  url: string;
  image_url: string;
  playlist_url: string;
  followers: number;
}[];
