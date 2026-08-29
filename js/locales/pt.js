// Português europeu (pt-PT), для детей 10–12 лет.
// Структура должна совпадать с ru.js, паритет ключей проверяет js/locales.test.js
export const pt = {
  meta: {
    title: 'O endereço na Terra — como ler as coordenadas',
  },
  fallback: {
    title: 'O 3D não está a funcionar',
    text: 'O seu navegador não suporta WebGL. Abra a página num Chrome, Edge, Firefox ou Safari recente.',
  },
  modes: {
    lesson: 'Lição',
    free: 'Livre',
    game: 'Jogo',
  },
  ui: {
    prev: '← Voltar',
    next: 'Seguinte →',
    play: '🎮 Jogar',
  },
  free: {
    hint: 'Arrasta o alfinete amarelo com o rato ou usa as barras deslizantes',
    lat: 'Latitude',
    lon: 'Longitude',
    layers: 'Camadas',
    parallels: 'paralelos',
    meridians: 'meridianos',
    equator: 'equador',
    greenwich: 'Greenwich',
    arcs: 'ângulos',
    cities: 'cidades',
  },
  lesson: {
    spinHint: 'Roda o globo com o rato!',
    progress: 'Passo {n} de {m}',
    cityCoords: '{city}: {coords}',
    steps: {
      earth: {
        title: 'Isto é a Terra',
        text: 'Este é o nosso planeta, a Terra. Cada ponto tem um endereço exato — como uma casa. Vamos descobrir como se escreve!',
      },
      axis: {
        title: 'O eixo e os polos',
        text: 'A Terra roda à volta de um eixo imaginário. Os pontos onde o eixo sai da Terra são o Polo Norte e o Polo Sul.',
      },
      equator: {
        title: 'O equador',
        text: 'A meio caminho entre os polos fica a linha principal: o equador. Ele divide a Terra no hemisfério Norte e no hemisfério Sul.',
      },
      parallels: {
        title: 'Os paralelos',
        text: 'Os paralelos são círculos paralelos ao equador. Quanto mais perto do polo, menor é o círculo. Vamos usar os paralelos para medir a latitude.',
      },
      measureLat: {
        title: 'A medir a latitude',
        text: 'A latitude é o ângulo entre o equador e um ponto. Do equador para cima até Moscovo há 56°: são 56° de latitude norte. Para cima é norte (N), para baixo é sul (S), de 0° a 90°.',
      },
      primeMeridian: {
        title: 'O meridiano zero',
        text: 'Ficou combinado: o meridiano que passa por Greenwich (perto de Londres) é o 0° de longitude. É a partir dele que se conta.',
      },
      meridians: {
        title: 'Os meridianos',
        text: 'Os meridianos ligam os polos, como os gomos de uma laranja. Todos têm o mesmo comprimento.',
      },
      measureLon: {
        title: 'A medir a longitude',
        text: 'A longitude é o ângulo entre o meridiano de Greenwich e o meridiano de um ponto. De Greenwich para este até Moscovo há 38° de longitude este (E). Para este é E, para oeste é O. Conta-se até 180°: metade do círculo para este, metade para oeste.',
      },
      coords: {
        title: 'Coordenadas — o endereço de um ponto',
        text: 'Onde o paralelo 56° N cruza o meridiano 38° E fica Moscovo. A latitude e a longitude juntas são as coordenadas geográficas — o endereço de um ponto na Terra!',
      },
      quiz: {
        title: 'Põe-te à prova!',
        text: 'Agora experimenta encontrar pontos pelas coordenadas!',
      },
    },
  },
  game: {
    title: 'Encontra o ponto!',
    find: 'Encontra: {coords}',
    round: 'Ronda {n} de {m} · ⭐ {score}',
    clickHint: 'Clica no globo no lugar de que estamos a falar',
    answer: 'É <b>{city}</b>! Erro: {err}°',
    restart: 'Outra vez',
    done: 'Concluíste o jogo!',
    score: 'As tuas estrelas: {score} de {max}',
  },
  help: {
    buttonTitle: 'Legenda',
    title: 'Legenda',
    close: 'Compreendi',
    language: 'Língua',
    items: {
      equator: 'equador — 0° de latitude',
      greenwich: 'Meridiano de Greenwich — 0° de longitude',
      latAngle: 'ângulo de latitude: do equador para cima/baixo',
      lonAngle: 'ângulo de longitude: de Greenwich para este/oeste',
      m180: 'marcador e linha dos 180°',
    },
  },
  poles: {
    north: 'Polo Norte',
    south: 'Polo Sul',
  },
  labels: {
    equator: 'EQUADOR — 0° de latitude',
    greenwich: 'Meridiano de Greenwich — 0° de longitude',
  },
  coords: {
    latN: 'N',
    latS: 'S',
    lonE: 'E',
    lonW: 'O',
  },
  cities: {
    moscow: 'Moscovo',
    spb: 'São Petersburgo',
    london: 'Londres',
    cairo: 'Cairo',
    newyork: 'Nova Iorque',
    rio: 'Rio de Janeiro',
    sydney: 'Sydney',
    tokyo: 'Tóquio',
    beijing: 'Pequim',
    delhi: 'Nova Deli',
    capetown: 'Cidade do Cabo',
    lima: 'Lima',
    honolulu: 'Honolulu',
    greenwich: 'Greenwich',
  },
};
